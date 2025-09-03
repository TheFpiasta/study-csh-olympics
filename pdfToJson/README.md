# PDF to JSON Processing Pipeline

This directory contains an automated pipeline for converting Olympic venue PDF reports into structured JSON data using N8N workflow automation and Claude 4 AI extraction.

## Overview

The Venues PDF represents a comprehensive data source containing information about Summer and Winter Olympics in a single PDF document. For each Olympic year, all available information from this PDF source is extracted and subsequently stored in structured JSON files.

The pdfToJson system processes Olympic venue reports from PDF format into structured JSON data through an automated workflow that:

1. **Preprocesses PDFs** (by hand) by removing irrelevant pages and separating Summer/Winter Games
2. **Creates chunks** by splitting PDFs into manageable sections per Olympic year
3. **Extracts structured data** using Claude 4 AI with dual-phase processing
4. **Merges processed chunks** into comprehensive JSON datasets

## Architecture

```
PDF Reports → PDF Preprocessing → Chunk Creation → AI Extraction → AI Validation → Chunk Merging → Structured JSON
```

The workflow follows principles of generalizability and is designed for different data sources. A Large Language Model (LLM) serves as the central extraction component, enabling flexible processing of different document structures. Technical implementation uses N8N combined with Python scripts executed in Docker containers. N8N functions as a low-code development environment specifically designed for creating AI-based workflows.

## Directory Structure

```
pdfToJson/
├── 2025_06_28.md                     # Meeting notes and project insights
├── PDF-to-data.drawio.png           # Visual workflow diagram
├── n8n/                             # N8N automation environment
│   ├── Dockerfile                   # Custom N8N container with Python support
│   ├── docker-compose.yaml         # Docker orchestration for N8N + Python
│   ├── README.md                    # N8N setup instructions
│   ├── anthropic-latest-models-pricing.png  # API cost reference
│   ├── n8n_data/                   # N8N persistent data (databases, logs)
│   ├── n8n_io/                     # Working directory for file processing
│   │   ├── pdf_splitter_logic_for_n8n.py   # Core PDF splitting logic
│   │   ├── exec-chunker.sh         # Shell wrapper for PDF chunking
│   │   ├── requirements.txt         # Python dependencies (PyMuPDF)
│   │   ├── config.json.*example    # Configuration templates
│   │   ├── test_files/              # Sample PDFs for testing
│   │   ├── test_prompts/            # AI prompt templates
│   │   ├── PDF_summery/             # V1 processing results
│   │   └── PDF_summery_v2/          # V2 processing results (current)
│   │       ├── countTotalVenues.js  # Venue counting utility
│   │       ├── venues_summer/       # Summer Olympics venue data
│   │       ├── venues_winter/       # Winter Olympics venue data
│   │       └── venues_extra/        # Additional venue reports
│   ├── n8n_workflows/              # Workflow definitions
│   │   ├── docker-exec-*.sh        # Docker workflow management scripts
│   │   └── *.json                  # N8N workflow files
│   └── pdfToMd.py                  # Alternative PDF to Markdown converter
```

## Key Components

### 1. Creating Chunks (`pdf_splitter_logic_for_n8n.py`)

Processing large PDF documents for LLMs requires careful data segmentation to ensure optimal extraction results. Experience shows that a chunk-based approach delivers better results than analyzing the entire document at once. Research confirms that text chunking strategies lead to higher internal consistency and better LLM performance.

Our approach follows automated segmentation of the original PDF file into separate documents per Olympic year, creating smaller, manageable data units that form the chunks.

**Three methods for segmentation:**
- **Regex-based identification** (primary method): Uses pattern `^(.*[(18,19,20)][0-9]{2} (.*)VENUES)$`
- **Automatic headline detection** (secondary method)
- **Fixed page numbers** (fallback when main methods fail)

**Special case handling:**
A structural deviation exists for 1960, which uses format `<YEAR> OLYMPIC WINTER GAMES VENUES` instead of the regular `<CITY> <YEAR> VENUES` format.

**Features:**
- Smart filename cleaning and collision handling
- Configurable chunk numbering and naming
- Error handling and comprehensive logging
- Support for complex Olympic report structures

### 2. N8N Workflow Automation

**Setup:**
```bash
cd pdfToJson/n8n
# Create virtual environment in n8n_io directory
cd n8n_io && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cd ..
docker compose up -d        # Start N8N on http://localhost:5678
./n8n_workflows/docker-exec-import.sh  # Import workflows
```

**Main Workflows:**
- **configReader**: Loads processing configuration from `config.json`
- **OnePdf--FullWorkflow**: Main orchestrator for single PDF processing (entry point)
- **WIP_ALLPdfToJson copy**: (work in progress) Batch processing workflow for multiple PDFs

**Subworkflows (called by main orchestrator):**
- **onePDF-1-execChunker**: PDF chunking and splitting logic
- **OnePdf-2-ChunksToJson**: AI-powered chunk extraction and validation
- **OnePdf-3-aggregateJson**: JSON aggregation and merging
- **configReader**: Configuration loader for JSON settings
- **promptReader**: Utility for loading and formatting prompt templates

### 3. Extracting Structured Data

The main component of the process extracts structured data from PDF chunk texts. Extracted data is stored in JSON files to enable easy conversion to GeoJSON format.

**Technical Approach Evaluation:**
Several approaches were evaluated:
- **MarkItDown package**: Converts PDFs to Markdown but fails to properly handle tables
- **PDF24 tool**: Converts to HTML but uses generic classes like `stl_341` making processing difficult  
- **PyMuPDF package**: Direct PDF access with custom algorithms, but conflicts with reusability goals

**LLM-Based Solution:**
Claude Sonnet 4 (version 20250514) is used for direct JSON generation from PDF files, providing balanced performance, speed, and cost. The choice of LLM is based on personal preference - GPT, Claude, or Gemini are all suitable.

**Dual-Phase Processing:**

1. **Extraction Phase** (without thinking to save costs):
   - Generates JSON structure from PDF with predefined schema
   - Additional text before/after JSON is automatically removed via script
   - Validates PDF format compliance (`<CITY> <YEAR> VENUES` format)

2. **Validation Phase** (with thinking for better accuracy):
   - Independent validation of the JSON against original PDF
   - Cross-references and corrects discrepancies
   - Ensures data integrity and completeness
   - High probability of correct and complete extraction

**Output Schema:**
```json
{
  "status": "found",
  "city": "Athens",
  "year": "1896", 
  "overview": "Competition overview text...",
  "venues": [
    {
      "name": "Panathenaic Stadium",
      "classification": "Existing",
      "use": "Athletics, artistic gymnastics, weightlifting",
      "status": "In use",
      "information": "Detailed venue information..."
    }
  ],
  "trivia": "Did you know facts..."
}
```

### 4. Merging Processed Chunks

The final subworkflow consolidates JSON files from chunk processing. Initially assumed to require additional Python scripting, analysis revealed that the entire process can be implemented exclusively with N8N tools.

JSON data generated during chunk processing is stored as an array in the final JSON file, enabling easy access by processes that work across multiple years. For the current use case, working with individual JSON files proves more practical and efficient than the combined JSON structure.

### 5. Configuration Management

**Config Examples:**
- `config.json.summery-example`: Template for venue summary processing
- `config.json.results-example`: Template for detailed results processing

**Key Settings:**
```json
{
  "pdfsDir": "PDF_summery/venues_summer",
  "regexOverToc": "^(.*[(18,19,20)][0-9]{2} (.*)VENUES)$",
  "extractionPromptPath": "PDF_summery/summery-extraction.txt",
  "validationPromptPath": "PDF_summery/summery-validation.txt",
  "anthropic": {
    "model": "claude-sonnet-4-20250514",
    "maxTokens": 20000,
    "thinking": { "budget_tokens": 16000 }
  }
}
```

## Data Processing Results

### V1 vs V2 Processing

The system includes two versions of processing results:

- **PDF_summery/** (V1): Initial processing approach
- **PDF_summery_v2/** (V2): Improved processing with enhanced prompts

**Venue Coverage:**
- **Summer Olympics**: 1896-2016 (29 Olympic Games)
- **Winter Olympics**: 1924-2018 (24 Olympic Games)  
- **Total Venues Processed**: 1000+ individual venues across all Olympic history

### Output Structure

Each processed Olympic Game produces:
1. **Individual chunk JSONs** (`*_VENUES.pdf.json`) for each venue section
2. **Combined report JSON** (`Full-report-venues-*.pdf.json`) with all venues
3. **Validation metadata** for accuracy tracking

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.8+ (for local testing)

### Setup
```bash
# 1. Start N8N environment
cd pdfToJson/n8n
docker compose up -d

# 2. Setup Python environment
cd n8n_io
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
pip install -r requirements.txt

# 3. Configure processing
cp config.json.summery-example config.json
# Edit config.json with your Anthropic API key and settings

# 4. Import N8N workflows
./n8n_workflows/docker-exec-import.sh

# 5. Access N8N interface
open http://localhost:5678
```

### Processing PDFs

**Single PDF Processing:**
1. **Place PDF** in the configured directory (e.g., `PDF_summery/venues_summer/`)
2. **Run workflow** "OnePdf--FullWorkflow" in N8N interface
3. **Monitor progress** via N8N dashboard and optional Discord notifications
4. **Retrieve results** from `*_chunked/` directories and combined JSON files

**Note:** Batch processing workflow (`WIP_ALLPdfToJson copy`) is currently work in progress and not executable correctly.

### Manual PDF Splitting
```bash
cd n8n_io
python pdf_splitter_logic_for_n8n.py \
  --path "path/to/report.pdf" \
  --regex "^(.*[(18,19,20)][0-9]{2} (.*)VENUES)$" \
  --start 1
```

## Technical Details

### PDF Processing Strategy

1. **Regex-based splitting** for consistent Olympic report formats
2. **Fallback to ToC** parsing when available
3. **Fixed-page chunking** as final fallback (5 pages per chunk)
4. **Smart cleanup** removes problematic filename characters

### AI Model Configuration

- **Model**: Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Context**: 20,000 tokens max output
- **Thinking Budget**: 16,000 tokens for reasoning
- **Temperature**: 1.0 for consistent extraction
- **Cost**: ~$0.03 per 1k input tokens, ~$0.15 per 1k output tokens

### Quality Assurance

The challenge with using LLMs for extraction and structuring tasks lies primarily in creating suitable prompts. A known issue with LLMs is their tendency to hallucinate or invent data not present in the original PDF.

**Dual-Phase Approach:**
- **Phase 1**: Extract JSON structure with predefined schema (no thinking to save costs)
- **Phase 2**: Independent validation and correction of the JSON output (with thinking for accuracy)
- **Format compliance checking** for Olympic report standards  
- **Cross-reference validation** against source PDF content
- **Error handling** for malformed or non-compliant documents

The LLM validates and corrects its own previous output independently. Spot-check reviews identified no errors in the validation process.

### Integration Points

The processed JSON data integrates with:
- **matching-felix/** → Venue matching and GeoJSON generation
- **webapp/** → Frontend visualization via Next.js API routes
- **geojson_scraper/** → Additional venue data sources

## Performance

- **Processing Speed**: ~2-3 minutes per Olympic Game report
- **Accuracy Rate**: High accuracy with dual AI validation
- **Venue Coverage**: 1000+ venues across 130+ years of Olympic history
- **Format Support**: Handles varied PDF layouts and structures

## Development Notes

- Uses fixed N8N version (1.102.1) for reproducibility
- Supports both AMD64 and ARM64 architectures
- Docker environment isolated for consistent processing
- Python virtual environment prevents dependency conflicts
- Discord integration available for workflow notifications

## Troubleshooting

### Common Issues

1. **PDF splitting fails**: Check regex pattern or ensure PDF has proper structure
2. **AI extraction errors**: Verify Anthropic API key and model availability
3. **Workflow import fails**: Ensure N8N container is running and accessible
4. **Memory issues**: Uncomment payload/memory limits in `docker-compose.yaml`

### Debugging

- Check N8N logs via Docker: `docker logs n8n`
- Review extraction results in `*_chunked/*.json` files
- Validate config.json format and API credentials
- Test individual components with provided test files

## Workflow Modularization

To improve development, debugging, and execution, the workflow is modularized into three independent subworkflows. Configuration is managed through a central configuration file that allows flexible adjustment of execution parameters.

### Subworkflows:
1. **Chunk Creation**: Automated PDF segmentation per Olympic year
2. **Data Extraction**: AI-powered structured data extraction with validation  
3. **Chunk Merging**: Consolidation of processed JSON files

## Future Enhancements

- **Batch API processing** for 50% cost reduction (identified cost optimization)
- Support for additional venue report formats
- Enhanced regex patterns for edge cases
- Integration with local AI models for cost reduction
- Automated quality metrics and reporting