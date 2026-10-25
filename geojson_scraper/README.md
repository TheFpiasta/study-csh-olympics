# GeoJSON Scraper

A comprehensive data collection and processing pipeline for Olympic venues from Olympedia.org. This module scrapes venue information, converts it to GeoJSON format, and provides utilities for data analysis and enrichment.

## Overview

The GeoJSON Scraper is part of a larger thesis project on Computational Spatial Humanities focusing on Olympic venues data analysis. It extracts venue data from Olympedia.org, processes it into standardized GeoJSON format, and provides tools for combining and analyzing the data.

## Core Components

### 1. Main Scraper (`scraper.py`)

The primary web scraper that extracts venue data from Olympedia.org.

**Features:**
- Scrapes venue biodata (coordinates, capacity, sports, games, names)
- Extracts event tables with links to detailed Olympic information
- Handles coordinate parsing with trust levels
- Processes multiple names and associated venue information
- Rate-limited requests to respect server resources

**Usage:**
```bash
python scraper.py -n 100 -s 1  # Scrape 100 venues starting from ID 1
```

**Arguments:**
- `-n, --num_iterations`: Number of venues to scrape (default: 5)
- `-s, --start`: Starting venue ID (default: 1)

**Output:**
- Creates JSON files in `scraped_websites/` directory
- Each file contains biodata and event data for a single venue
- Files named as `venue_{id}.json`

### 2. GeoJSON Template Generator (`geojson_templater.py`)

Converts scraped JSON venue data into GeoJSON FeatureCollections grouped by Olympic Games.

**Features:**
- Groups venues by year and season (e.g., "1936-summer", "1972-winter")
- Creates proper GeoJSON Point geometries from coordinates
- Preserves all venue properties including events and biodata
- Handles multiple games per venue
- Skips venues with missing or invalid coordinates

**Processing Logic:**
1. Reads all venue JSON files from input directory
2. Extracts coordinates and validates format
3. Groups venues by Olympic Games (year-season combinations)
4. Creates GeoJSON FeatureCollection for each group
5. Outputs individual `.geojson` files for each Olympic Games

**Output Structure:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      },
      "properties": {
        "associated_names": ["Venue Name"],
        "place": "City, Country",
        "coordinates_trust": "High",
        "sports": ["Sport1", "Sport2"],
        "events": [...],
        "source_file": "venue_123.json"
      }
    }
  ]
}
```

### 3. File Management Tools

#### Venue Counter (`counter.py`)
Compares venue counts between PDF-extracted data and GeoJSON files to validate data completeness.

**Features:**
- Counts venues in both PDF extraction JSONs and GeoJSON files
- Matches data by year and city
- Generates CSV report with comparison statistics
- Helps identify missing or extra venues

#### Duplicate Finder (`duplicate_finder.py`)
Removes duplicate venue entries based on source file identifiers.

**Features:**
- Identifies duplicate venues within GeoJSON files
- Uses `source_file` property as unique identifier
- Preserves first occurrence, removes subsequent duplicates
- Updates files in-place

#### File Renamer (`renamer.py`)
Converts year-season filenames to descriptive Olympic Games names.

**Features:**
- Maps year-season combinations to Olympic host cities
- Converts `1936-summer.geojson` to `1936_Berlin.geojson`
- Adds Olympic Games metadata to venue properties
- Supports both Summer and Winter Olympics from 1896-2022

### 4. Data Integration Tools

#### Venue Combiner (`venue_combiner.py`)
Advanced venue matching and data enrichment system that combines scraped GeoJSON data with PDF-extracted venue information.

**Matching Algorithm:**
1. **Part Name Matching**: Exact matches on normalized venue name components
2. **Sport/Use Matching**: Fuzzy matching between venue uses and sports (70% weight)
3. **Name Similarity**: String similarity for venue names (30% weight)
4. **Threshold Filtering**: Only accepts matches with combined score ≥ 0.55

**Features:**
- Multi-stage venue matching with confidence scoring
- Combines data from multiple PDF extraction sources
- Generates detailed match reports for validation
- Creates enriched GeoJSON files with additional venue metadata
- Identifies unmatched venues for manual review

**Output:**
- Combined GeoJSON files in `combined_geojson/` directory
- Match reports in `output_venues_found/` directory
- Enhanced venue properties with PDF data

#### Harvard Data Combiner (`harvard_combiner.py`)
Integrates Harvard study data on Olympic Games economics with venue GeoJSON data.

**Features:**
- Matches Olympic Games with Harvard dataset by year and location
- Extracts economic data with proper formatting (currency, numbers)
- Preserves data sources and formatting metadata
- Creates enriched GeoJSON files with economic context

## Directory Structure

```
geojson_scraper/
├── README.md                    # This documentation
├── naming_convention.md         # Data field documentation
├── scraper.py                   # Main venue scraper
├── geojson_templater.py        # JSON to GeoJSON converter
├── counter.py                   # Venue count validator
├── duplicate_finder.py         # Duplicate removal utility
├── renamer.py                   # File naming utility
├── venue_combiner.py           # Advanced venue matching system
├── harvard_combiner.py         # Harvard data integration
├── scraped_websites/           # Raw scraped JSON files
│   ├── venue_1.json
│   └── venue_*.json
├── output_files/               # Generated GeoJSON files (by year-season)
│   ├── 1936-summer.geojson
│   └── *.geojson
├── named_geojsons/             # GeoJSON files with Olympic city names
│   ├── 1936_Berlin.geojson
│   └── *.geojson
├── combined_geojson/           # Enhanced GeoJSON with PDF data
│   ├── combined_1936_Berlin.geojson
│   └── combined_*.geojson
├── harvard_geojsons/           # GeoJSON with Harvard economic data
│   ├── harvard_1936_Berlin.geojson
│   └── harvard_*.geojson
└── output_venues_found/        # Venue matching reports
    ├── 1936_Berlin.txt
    └── *.txt
```

## Data Fields

See `naming_convention.md` for detailed field descriptions. Key fields include:

- **associated_names**: All venue names and aliases
- **coordinates**: Latitude, longitude as comma-separated string
- **coordinates_trust**: Confidence level of coordinate accuracy
- **sports**: Array of sports hosted at venue
- **place**: Full address including city and country
- **seating_capacity**: Maximum spectator capacity
- **games**: Array of Olympic Games held at venue (year, season)
- **source_file**: Original scraped data filename

## Workflows

### 1. Basic Scraping Workflow
```bash
# Scrape venues from Olympedia
python scraper.py -n 1000 -s 1

# Convert to GeoJSON format
python geojson_templater.py

# Rename files with Olympic cities
python renamer.py

# Remove any duplicates
python duplicate_finder.py
```

### 2. Data Enrichment Workflow
```bash
# Combine with PDF-extracted venue data
python venue_combiner.py

# Add Harvard economic data
python harvard_combiner.py

# Validate venue counts
python counter.py
```

## Data Quality & Coverage

- **Coverage**: Olympic venues from 776 BCE to 2022
- **Modern Olympics**: Complete coverage from 1896-2022
- **Ancient Olympics**: Historical venues with available coordinates
- **Match Rate**: ~70% success rate for PDF data integration
- **Coordinate Accuracy**: Varies by venue, tracked in `coordinates_trust` field

## Integration with Project

This module provides venue data for:
- **Web Application**: REST API endpoints serve GeoJSON data
- **Matching Pipeline**: Input for fuzzy venue matching algorithms  
- **Visualization**: Geographic and statistical analysis components

## Dependencies

- `requests`: HTTP requests for web scraping
- `beautifulsoup4`: HTML parsing
- `json`: JSON data handling
- `pandas`: Data analysis and Excel integration
- `openpyxl`: Excel file processing
- `re`: Regular expression processing
- `difflib`: String similarity calculations

## Best Practices

1. **Rate Limiting**: Built-in delays prevent server overload
2. **Error Handling**: Graceful handling of missing data and network issues
3. **Data Validation**: Coordinate and format validation
4. **Backup Strategy**: Keep original scraped files as source of truth
5. **Version Control**: Track data changes and processing steps

## Troubleshooting

**Common Issues:**
- **Missing coordinates**: Venue skipped during GeoJSON conversion
- **Encoding errors**: Ensure UTF-8 encoding for international venue names
- **Network timeouts**: Adjust delay parameters in scraper
- **Match failures**: Review match reports in `output_venues_found/`

**Data Validation:**
- Use `counter.py` to verify venue counts
- Check match reports for venue identification issues
- Validate coordinate ranges and formats
- Review sport/use matching accuracy in reports
