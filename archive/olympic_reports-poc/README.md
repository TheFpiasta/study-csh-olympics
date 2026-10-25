# Olympic Reports Scraper - POC

This directory contains a proof-of-concept web scraper for downloading official Olympic Games reports from the IOC Olympic Library.

## Overview

The Olympic Reports Scraper is a specialized tool that automates the collection of official Olympic Games reports (both Summer and Winter) from https://library.olympics.com. This POC demonstrates the feasibility of systematically downloading historical Olympic documentation for research purposes.

## Features

- **Automated PDF Downloads**: Downloads official Olympic Games reports from the IOC Library
- **Category Organization**: Automatically organizes downloads into Summer/Winter categories
- **Multi-Volume Support**: Handles reports with multiple volumes/parts
- **Smart File Naming**: Creates descriptive folder names based on game titles and years
- **Session Management**: Handles authentication cookies and maintains browser sessions
- **Error Handling**: Robust error handling for network issues and missing elements

## File Structure

```
olympic_reports/
├── README.md              # This documentation
└── reports_scrapper.py    # Main scraper script
```

## Technical Implementation

### Dependencies

The scraper uses the following Python libraries:
- `selenium` - Web browser automation
- `webdriver-manager` - Automatic Chrome driver management
- `requests` - HTTP downloads with session management
- `pathlib` - Modern file path handling

### Architecture

1. **URL Collection**: Contains hardcoded URLs for 54 Olympic Games reports (30 Summer, 24 Winter)
2. **Browser Automation**: Uses Selenium with Chrome WebDriver for JavaScript-heavy site navigation
3. **Cookie Handling**: Manages authentication cookies between browser and download sessions
4. **Download Organization**: Creates structured folder hierarchy by category and game

### Data Coverage

- **Summer Games**: 1896 Athens to 2024 Paris (30 reports)
- **Winter Games**: 1924 Chamonix to 2022 Beijing (24 reports)
- **Languages**: Multi-language reports (English, French, German, etc.)
- **Time Span**: Covers 128 years of Olympic history

## Usage

### Prerequisites

```bash
pip install selenium webdriver-manager requests pathlib
```

### Basic Usage

```bash
python reports_scrapper.py
```

The script will:
1. Open a Chrome browser window
2. Navigate to the IOC Olympic Library
3. Handle cookie consent
4. Download all 54 Olympic reports to `~/Downloads/olympic_reports/`

### Output Structure

Downloads are organized as:
```
~/Downloads/olympic_reports/
├── Summer/
│   ├── Paris 2024/
│   │   └── Report.pdf
│   ├── Tokyo 2020/
│   │   └── Report.pdf
│   └── ...
└── Winter/
    ├── Beijing 2022/
    │   └── Report.pdf
    ├── Pyeongchang 2018/
    │   └── Report.pdf
    └── ...
```

### Multi-Volume Handling

Some reports contain multiple volumes (e.g., comprehensive games with separate venue/sport reports):
```
London 2012/
├── Volume 1.pdf
├── Volume 2.pdf
└── Volume 3.pdf
```

## Configuration

### Key Variables

- `BASE_URL`: IOC Olympic Library base URL
- `DOWNLOAD_BASE`: Local download directory (defaults to `~/Downloads/olympic_reports`)
- `ALL_REPORT_URLS`: Curated list of 54 official report URLs

### Browser Options

- Currently runs in **visible mode** for monitoring
- Uncomment line 186 to enable headless mode: `options.add_argument("--headless")`

## Error Handling

The scraper includes comprehensive error handling for:
- Network timeouts and connection issues
- Missing download links or changed page structure
- File system permissions and disk space
- Browser automation failures

## Data Quality

### Strengths
- **Official Sources**: All reports are official IOC-published documents
- **Complete Coverage**: Includes nearly all modern Olympic Games
- **Structured Organization**: Consistent folder naming and categorization

### Limitations
- **Manual URL Curation**: URLs are hardcoded and require manual validation
- **Site Dependency**: Relies on stable IOC Library website structure
- **Single Source**: Limited to IOC Library (no alternative sources)

## Future Enhancements

For production use, consider:
1. **Dynamic URL Discovery**: Automated link extraction from catalog pages
2. **Resume Capability**: Checkpoint system for interrupted downloads
3. **Format Validation**: PDF integrity checks and metadata extraction
4. **Parallel Downloads**: Multi-threaded downloading for improved performance
5. **Update Detection**: Monitor for new reports and re-downloads

## Research Applications

This POC enables downstream analysis including:
- **Venue Data Extraction**: Parse venue information from reports (see `pdfToJson/`)
- **Historical Trend Analysis**: Compare organizational approaches across decades
- **Text Mining**: Extract specific information about venues, costs, attendance
- **Cross-Games Comparison**: Standardized format enables systematic comparison

## Technical Notes

- **Browser Choice**: Chrome WebDriver for maximum compatibility
- **Download Method**: Combines Selenium navigation with requests downloads for efficiency
- **File Safety**: Sanitizes filenames to prevent filesystem issues
- **Session Persistence**: Maintains cookies between browser and download operations

## Connection to Main Project

This scraper is part of the larger Computational Spatial Humanities Olympics project:
- Feeds into `pdfToJson/` pipeline for structured data extraction
- Supports venue matching workflows in `matching-felix/`
- Provides source data for web visualization in `webapp/`

---

**Status**: Proof of Concept - Functional but requires manual URL maintenance