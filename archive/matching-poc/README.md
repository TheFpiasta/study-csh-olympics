# Olympic Venues Matching System

## Overview

This is a proof-of-concept (POC) venue matching system for the Computational Spatial Humanities thesis project at University Leipzig. The system matches Olympic venue data from two sources: GeoJSON files (scraped from Olympedia.org) and structured JSON data (extracted from PDF reports via Claude 4). This implementation has been adopted by the `geojson_scraper` component.

**Current Performance**: 82.2% successful venue matching rate across all Olympic Games (1896-2022)

## Project Structure

```
matching-poc/
├── main.py                                    # Main execution script
├── venues_matcher.py                          # Core matching algorithms
├── requirements.txt                           # Python dependencies
├── getAllVenusNames.py                        # Venue name extraction utility
├── test_venue_matching.py                     # Test suite for matching algorithms
├── test_logging.py                            # Logging functionality tests
├── visualize_structure.py                     # Project structure visualization
├── claude-4-extraction-promt.txt              # Claude 4 extraction prompt template
├── venues.txt                                 # Complete list of venue names
├── results.md                                 # Development notes and findings
├── combined_geojson/                          # First iteration results
├── combined_geojson_less_stages_less_array/   # Best results (82.2% match rate)
├── combined_geojson_less_stages_less_array_no_sport_match/ # No sports matching variant
└── *.log                                      # Various test and execution logs
```

## Core Components

### 1. Main Pipeline (`main.py`)

The main execution script orchestrates the entire matching process:

- **Data Loading**: Loads summer/winter venue JSON data from PDF extractions
- **GeoJSON Processing**: Processes venue data from Olympedia scraper
- **Venue Matching**: Applies two-stage matching algorithm
- **Statistics Collection**: Tracks matching performance and generates reports
- **Output Generation**: Creates enhanced GeoJSON files with matched venue data

**Key Features**:
- Configurable logging (console/file)
- Comprehensive statistics tracking
- Support for 53 Olympic Games (Summer: 1896-2020, Winter: 1924-2022)
- Automatic output directory management

### 2. Matching Engine (`venues_matcher.py`)

Advanced venue name matching system using hybrid algorithms:

#### Matching Stages:
1. **Exact Match**: Direct string comparison after normalization
2. **Fuzzy Match**: Uses FuzzyWuzzy/RapidFuzz for similarity scoring (threshold: 0.75)

#### Advanced Features:
- **Parentheses Splitting**: Handles venue names like "Stadium (aka Olympic Arena)"
- **Name Preprocessing**: Removes filler words ("also", "known", "as")
- **Multi-library Support**: Primary FuzzyWuzzy, fallback to difflib
- **Confidence Scoring**: Provides match confidence for quality assessment

### 3. Two-Stage Matching Process

#### Stage 1: Sports-Based Matching
- Matches venues by comparing sports/activities
- Fast initial filtering for obvious matches
- Handles comma-separated sport lists

#### Stage 2: Name-Based Matching
- Processes unmatched venues from Stage 1
- Uses advanced string similarity algorithms
- Applies confidence thresholding (≥0.75)

## Data Sources

### Input Data
- **GeoJSON Files**: `../geojson_scraper/named_geojsons/*.geojson`
  - Scraped venue data with coordinates and metadata
  - Sports associations and venue names
- **JSON Files**: PDF-extracted venue data
  - Summer: `../pdfToJson/n8n/n8n_io/PDF_summery_v2/venues_summer/*.json`
  - Winter: `../pdfToJson/n8n/n8n_io/PDF_summery_v2/venues_winter/*.json`

### Output Data
- **Enhanced GeoJSON Files**: Original GeoJSON with matched venue metadata
- **Statistics Reports**: JSON files with detailed matching performance
- **Log Files**: Comprehensive matching process logs

## Installation & Setup

### Prerequisites
- Python 3.8+
- Required dependencies (see `requirements.txt`)

### Installation

```bash
# Navigate to matching-poc directory
cd matching-poc

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Linux/macOS:
source .venv/bin/activate
# Windows:
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Dependencies

```
fuzzywuzzy==0.18.0
Levenshtein==0.27.1
python-Levenshtein==0.27.1
RapidFuzz==3.13.0
```

## Usage

### Basic Execution

```bash
# Run the complete matching pipeline
python main.py
```

### Testing

```bash
# Run venue matching tests
python test_venue_matching.py

# Test logging functionality
python test_logging.py

# Extract all venue names
python getAllVenusNames.py
```

### Configuration

Key configuration options in `main.py`:

```python
# Output directory
output_dir = "combined_geojson_less_stages_less_array"

# Logging configuration
log_to_console = False
log_to_file = True
log_file = "matching.log"

# Matching threshold (in venues_matcher.py)
confidence_threshold = 0.75
```

## Algorithm Details

### Matching Strategy

1. **Preprocessing**:
   - Normalize venue names
   - Remove filler words and standardize terminology
   - Split parenthetical content for multiple matching attempts

2. **Sports Matching**:
   - Compare sport/activity lists between data sources
   - Fast filtering for venues with matching sports

3. **Name Matching**:
   - Multi-variation matching (original, outer parentheses, inner parentheses)
   - Fuzzy string similarity with confidence scoring
   - Bidirectional matching for robustness

### Performance Characteristics

- **Overall Match Rate**: 82.2%
- **Exact Matches**: 243 venues (high confidence)
- **Fuzzy Matches**: 345 venues (good confidence ≥0.75)
- **Sports Matches**: 177 venues
- **Unmatched**: 149 GeoJSON venues, 192 JSON venues

## Output Structure

### Enhanced GeoJSON Features

Matched venues receive additional properties:

```json
{
  "properties": {
    "match_type": "name_match|sports_match",
    "match_confidence": 0.85,
    "match_method": "fuzzy_match_outer",
    "matched_venue_name": "Olympic Stadium",
    "venue_classification": "Existing",
    "venue_status": "In use",
    "venue_use": "Athletics, ceremonies",
    "venue_information": "Detailed venue description...",
    "olympics_year": "1960",
    "olympics_city": "Rome",
    "olympics_season": "summer"
  }
}
```

### Statistics Output

Comprehensive matching statistics saved as JSON:

```json
{
  "total_statistics": {
    "total_venues": 1911,
    "geojson": {
      "total_venues": 983,
      "sports_matches": 177,
      "name_matches": 657,
      "unmatched": 149
    },
    "json": {
      "total_venues": 928,
      "sports_matches": 135,
      "name_matches": 601,
      "unmatched": 192
    }
  }
}
```

## Data Quality & Limitations

### Known Issues
- **False Positives**: Sports-based matching may incorrectly link different venues with same sports
- **Incomplete Coverage**: 17.8% of venues remain unmatched
- **Data Variations**: Inconsistent naming conventions across sources
- **Language Barriers**: Limited multi-language synonym support

### Recommendations
- Manual verification for critical analysis years
- Use individual data sources for statistical analysis rather than combined GeoJSONs
- Consider venue matching as approximate for broad analysis

## Development Notes

### POC Status
This is a proof-of-concept implementation demonstrating venue matching feasibility. The algorithm prioritizes:
- **Speed**: Efficient processing of large venue datasets
- **Accuracy**: High-confidence matches with detailed scoring
- **Flexibility**: Configurable thresholds and logging

### Integration with geojson_scraper
The matching algorithms and data structures have been integrated into the main `geojson_scraper` component for production use.

### Future Improvements
- Enhanced multi-language synonym support
- Machine learning-based matching refinements
- Geographic proximity-based matching validation
- Automated false positive detection

## Logging & Debugging

### Log Levels
- **INFO**: Basic matching results and statistics
- **DEBUG**: Detailed matching attempts and scores
- **WARNING**: Low-confidence matches and potential issues
- **ERROR**: Data loading and processing errors

### Log Analysis
- Detailed venue matching logs in output directories
- Statistics summaries for performance evaluation
- Unmatched venue lists for manual review

## Files Reference

- `main.py:923-955` - Main execution entry point
- `venues_matcher.py:614-701` - Core matching algorithm
- `main.py:368-406` - Sports-based matching logic
- `main.py:310-366` - Name-based matching implementation
- `main.py:444-598` - Statistics collection system
