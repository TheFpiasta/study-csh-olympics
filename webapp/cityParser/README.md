# GeoNames Cities Parser

A Python tool to convert GeoNames cities15000.txt file to various JSON formats for easy consumption in web applications
and data analysis.

## Overview

This parser processes the tab-separated cities15000.txt file from [GeoNames](https://www.geonames.org/) and converts it
into structured JSON formats with proper data types and validation. The cities15000.txt file contains all cities with
population > 15,000 or capitals (approximately 25,000 cities).

## Features

- **Three output formats**: Structured objects, compact arrays, and columnar data
- **Proper data typing**: Automatic conversion of numeric fields (integers, floats)
- **Error handling**: Graceful handling of malformed data with error reporting
- **Progress indication**: Real-time progress updates for large files
- **UTF-8 support**: Full Unicode character support for international city names
- **Memory efficient**: Streaming processing for large datasets

## Setup

### Prerequisites

- Python 3.7 or higher
- Virtual environment (recommended)

### Installation

1. **Clone the repository** (if part of larger project):
   ```bash
   cd webapp/cityParser
   ```

2. **Create and activate virtual environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **No additional dependencies required** - uses only Python standard library

### Download GeoNames Data

1. Download the cities15000.zip file from [GeoNames](http://download.geonames.org/export/dump/):
   ```bash
   wget http://download.geonames.org/export/dump/cities15000.zip
   ```

2. Extract the file:
   ```bash
   unzip cities15000.zip
   ```

   This will create `cities15000.txt` in your current directory.

## Usage

### Basic Usage

```bash
# Activate virtual environment
source .venv/bin/activate

# Convert to all three formats (default)
python3 citiesToJson.py

# Convert to specific format only
python3 citiesToJson.py structured
python3 citiesToJson.py compact
python3 citiesToJson.py columnar

# Use custom input file
python3 citiesToJson.py all cities15000.txt
python3 citiesToJson.py structured custom_cities.txt
```

### Command Line Arguments

```bash
python3 citiesToJson.py [format] [input_file]
```

**Parameters:**

- `format`: Optional format type
    - `structured` - Nested objects with meaningful field names
    - `compact` - Array format with keys and data arrays
    - `columnar` - Column-oriented format with field arrays
    - `all` - All three formats (default)
- `input_file`: Path to input file (default: `cities15000.txt`)

### Examples

```bash
# Create all formats from default file
python3 citiesToJson.py

# Create only compact format
python3 citiesToJson.py compact

# Create structured format from custom file
python3 citiesToJson.py structured my_cities.txt

# Create all formats from custom file
python3 citiesToJson.py all downloaded_cities.txt
```

## Output Formats

### 1. Structured Format (`cities15000.json`)

Nested objects with meaningful field organization:

```json
{
    "metadata": {
        "source": "GeoNames cities15000.txt",
        "description": "Cities with population > 15000 or capitals",
        "total_cities": 25000,
        "processed_lines": 25000,
        "error_count": 0
    },
    "cities": [
        {
            "geonameid": 3040051,
            "name": "les Escaldes",
            "asciiname": "les Escaldes",
            "alternatenames": [
                "Escaldes",
                "Escaldes-Engordany",
                "Les Escaldes"
            ],
            "coordinates": {
                "latitude": 42.50729,
                "longitude": 1.53414
            },
            "feature": {
                "class": "P",
                "code": "PPLA"
            },
            "country": {
                "code": "AD",
                "cc2": null
            },
            "admin": {
                "admin1": "08",
                "admin2": null,
                "admin3": null,
                "admin4": null
            },
            "population": 15853,
            "elevation": null,
            "dem": 1033,
            "timezone": "Europe/Andorra",
            "modification_date": "2024-06-20"
        }
    ]
}
```

### 2. Compact Format (`cities15000_compact.json`)

Array format with keys and data arrays for efficient storage (each data row on single line):

```json
{
    "meta": {
        "source": "GeoNames cities15000.txt",
        "description": "Cities with population > 15000 or capitals",
        "format": "Compact array format with keys and data arrays",
        "total_cities": 25000,
        "processed_lines": 25000,
        "error_count": 0
    },
    "keys": [
        "geonameid",
        "name",
        "asciiname",
        "alternatenames",
        "latitude",
        "longitude",
        "feature_class",
        "feature_code",
        "country_code",
        "cc2",
        "admin1_code",
        "admin2_code",
        "admin3_code",
        "admin4_code",
        "population",
        "elevation",
        "dem",
        "timezone",
        "modification_date"
    ],
    "data": [
        [
            3040051,
            "les Escaldes",
            "les Escaldes",
            [
                "Escaldes",
                "Escaldes-Engordany"
            ],
            42.50729,
            1.53414,
            "P",
            "PPLA",
            "AD",
            null,
            "08",
            null,
            null,
            null,
            15853,
            null,
            1033,
            "Europe/Andorra",
            "2024-06-20"
        ],
        [
            3041563,
            "Andorra la Vella",
            "Andorra la Vella",
            [
                "Andò-la-Vyèy",
                "Andorra",
                "Andorra la Biella"
            ],
            42.50779,
            1.52109,
            "P",
            "PPLC",
            "AD",
            null,
            "07",
            null,
            null,
            null,
            20430,
            null,
            1037,
            "Europe/Andorra",
            "2020-03-03"
        ]
    ]
}
```

### 3. Columnar Format (`cities15000_columnar.json`)

Column-oriented format ideal for data analysis (each field array on single line):

```json
{
    "meta": {
        "source": "GeoNames cities15000.txt",
        "description": "Cities with population > 15000 or capitals",
        "format": "Columnar format with field arrays",
        "total_cities": 25000,
        "processed_lines": 25000,
        "error_count": 0
    },
    "data": {
        "geonameid": [
            3040051,
            3041563,
            290503,
            290581,
            290594
        ],
        "name": [
            "les Escaldes",
            "Andorra la Vella",
            "Warīsān",
            "Umm Suqaym",
            "Umm Al Quwain City"
        ],
        "asciiname": [
            "les Escaldes",
            "Andorra la Vella",
            "Warisan",
            "Umm Suqaym",
            "Umm Al Quwain City"
        ],
        "alternatenames": [
            [
                "Escaldes",
                "Escaldes-Engordany"
            ],
            [
                "Andò-la-Vyèy",
                "Andorra"
            ],
            [
                "Warisan",
                "Warsan"
            ],
            [
                "Umm Suqeim"
            ],
            [
                "Oumm al Qaiwain"
            ]
        ],
        "latitude": [
            42.50729,
            42.50779,
            25.16744,
            25.15491,
            25.56473
        ],
        "longitude": [
            1.53414,
            1.52109,
            55.40708,
            55.21015,
            55.55517
        ],
        "feature_class": [
            "P",
            "P",
            "P",
            "P",
            "P"
        ],
        "feature_code": [
            "PPLA",
            "PPLC",
            "PPL",
            "PPLX",
            "PPLA"
        ],
        "country_code": [
            "AD",
            "AD",
            "AE",
            "AE",
            "AE"
        ],
        "cc2": [
            null,
            null,
            null,
            null,
            null
        ],
        "admin1_code": [
            "08",
            "07",
            "03",
            "03",
            "07"
        ],
        "admin2_code": [
            null,
            null,
            null,
            null,
            null
        ],
        "admin3_code": [
            null,
            null,
            null,
            null,
            null
        ],
        "admin4_code": [
            null,
            null,
            null,
            null,
            null
        ],
        "population": [
            15853,
            20430,
            108759,
            16459,
            59098
        ],
        "elevation": [
            null,
            null,
            null,
            null,
            null
        ],
        "dem": [
            1033,
            1037,
            12,
            1,
            2
        ],
        "timezone": [
            "Europe/Andorra",
            "Europe/Andorra",
            "Asia/Dubai",
            "Asia/Dubai",
            "Asia/Dubai"
        ],
        "modification_date": [
            "2024-06-20",
            "2020-03-03",
            "2024-06-11",
            "2024-10-28",
            "2025-04-17"
        ]
    }
}
```

## Data Fields

Based on the GeoNames database schema, each city record contains:

| Field               | Type    | Description                                     |
|---------------------|---------|-------------------------------------------------|
| `geonameid`         | integer | Unique identifier in GeoNames database          |
| `name`              | string  | Name of geographical point (UTF8)               |
| `asciiname`         | string  | ASCII version of name                           |
| `alternatenames`    | array   | Alternative names, comma separated              |
| `latitude`          | float   | Latitude in decimal degrees (WGS84)             |
| `longitude`         | float   | Longitude in decimal degrees (WGS84)            |
| `feature_class`     | string  | Feature class (usually "P" for populated place) |
| `feature_code`      | string  | Feature code (PPL, PPLC, PPLA, etc.)            |
| `country_code`      | string  | ISO-3166 2-letter country code                  |
| `cc2`               | string  | Alternate country codes                         |
| `admin1_code`       | string  | First administrative division code              |
| `admin2_code`       | string  | Second administrative division code             |
| `admin3_code`       | string  | Third administrative division code              |
| `admin4_code`       | string  | Fourth administrative division code             |
| `population`        | integer | Population count                                |
| `elevation`         | integer | Elevation in meters                             |
| `dem`               | integer | Digital elevation model                         |
| `timezone`          | string  | IANA timezone identifier                        |
| `modification_date` | string  | Last modification date (YYYY-MM-DD)             |

## Performance

- **Processing speed**: ~1000 lines per second on modern hardware
- **Memory usage**: Minimal memory footprint with streaming processing
- **File sizes**:
    - Input: ~50MB (cities15000.txt)
    - Structured output: ~120MB
    - Compact output: ~80MB
    - Columnar output: ~85MB

## Error Handling

The parser includes comprehensive error handling:

- **Malformed lines**: Skipped with warning message
- **Missing files**: Clear error message with exit code
- **Invalid data**: Graceful conversion with null values for missing data
- **Progress tracking**: Real-time progress updates and final statistics

## Integration

### Web Applications

The JSON formats are optimized for different use cases:

- **Structured**: Best for general web application consumption
- **Compact**: Ideal for bandwidth-sensitive applications
- **Columnar**: Perfect for data visualization and analytics

### Loading in JavaScript

```javascript
// Load structured format
const cityData = await fetch('cities15000.json').then(r => r.json());
const cities = cityData.cities;

// Load compact format
const compactData = await fetch('cities15000_compact.json').then(r => r.json());
const keys = compactData.keys;
const data = compactData.data;

// Load columnar format  
const columnarData = await fetch('cities15000_columnar.json').then(r => r.json());
const names = columnarData.data.name;
const coords = columnarData.data.latitude.map((lat, i) => [lat, columnarData.data.longitude[i]]);
```

## License

This tool is part of the Olympic venue data collection project. The GeoNames data is licensed under Creative Commons
Attribution 4.0 License.

## Contributing

When contributing to this parser:

1. Maintain compatibility with Python 3.7+
2. Use the existing virtual environment setup
3. Follow the existing code style and documentation patterns
4. Add tests for new functionality
5. Update this README for any new features

## Troubleshooting

### Common Issues

1. **File not found**: Ensure cities15000.txt is in the current directory
2. **Permission errors**: Check write permissions in output directory
3. **Memory issues**: For very large files, consider processing in chunks
4. **Encoding issues**: The parser handles UTF-8 automatically

### Getting Help

For issues specific to this parser, check:

1. Error messages in console output
2. Validate input file format matches GeoNames specification
3. Ensure virtual environment is activated
4. Check file permissions and available disk space
