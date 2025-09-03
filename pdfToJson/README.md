# PDF to JSON Processing Pipeline

This directory contains an automated pipeline for converting Olympic venue PDF reports into structured JSON data using N8N workflow automation and Claude 4 AI extraction.

## Overview

The pdfToJson system processes Olympic venue reports from PDF format into structured JSON data through an automated workflow that:

1. **Splits PDFs** into manageable chunks based on venue sections
2. **Extracts data** using Claude 4 AI with structured prompts
3. **Validates results** through a secondary AI verification step
4. **Outputs structured JSON** with venue information, metadata, and validation status

## Architecture

```
PDF Reports → PDF Splitting → AI Extraction → AI Validation → Structured JSON
```

The system uses **N8N** for workflow automation and **Claude Sonnet 4** for intelligent data extraction.

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

### 1. PDF Splitting (`pdf_splitter_logic_for_n8n.py`)

Intelligently splits large PDF reports into venue-specific chunks using:
- **Regex patterns** for section detection (e.g., `^(.*[(18,19,20)][0-9]{2} (.*)VENUES)$`)
- **Table of Contents** parsing as fallback
- **Fixed page chunks** (5 pages) as final fallback

**Features:**
- Smart filename cleaning and collision handling
- Configurable chunk numbering and naming
- Error handling and logging
- Support for complex Olympic report structures

### 2. N8N Workflow Automation

**Setup:**
```bash
cd pdfToJson/n8n
docker compose up -d        # Start N8N on http://localhost:5678
./n8n_workflows/docker-exec-import.sh  # Import workflows
```

**Main Workflows:**
- **configReader**: Loads processing configuration from `config.json`
- **OnePdfToJson**: Single PDF processing workflow
- **allPdfsToJson**: Batch processing for multiple PDFs

### 3. AI-Powered Data Extraction

**Dual-Phase Processing:**

1. **Extraction Phase** (`summery-extraction.txt`):
   - Validates PDF format compliance (`<CITY> <YEAR> VENUES` format)
   - Extracts structured venue information
   - Captures overview, venue details, and trivia sections

2. **Validation Phase** (`summery-validation.txt`):
   - Cross-references extracted JSON against original PDF
   - Corrects discrepancies and validates accuracy
   - Ensures data integrity and completeness

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

### 4. Configuration Management

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

1. **Place PDFs** in the configured directory (e.g., `PDF_summery/venues_summer/`)
2. **Run workflow** "allPdfsToJson" in N8N interface
3. **Monitor progress** via N8N dashboard and optional Discord notifications
4. **Retrieve results** from `*_chunked/` directories and combined JSON files

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

- **Dual-phase validation** (extract → validate)
- **Format compliance checking** for Olympic report standards
- **Cross-reference validation** against source PDF content
- **Error handling** for malformed or non-compliant documents

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

## Future Enhancements

- Batch API processing for 50% cost reduction
- Support for additional venue report formats
- Enhanced regex patterns for edge cases
- Integration with other AI models beyond Claude
- Automated quality metrics and reporting