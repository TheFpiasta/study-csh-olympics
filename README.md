# Olympic Venues Digital Documentation - Computational Spatial Humanities

**Project work:** Olympia digital erschließen - Workflow zur systematischen Erfassung und Analyse olympischer Veranstaltungsorte

**Authors:** Felix Piasta, Jeremy Melpitz, Marvin Gels  
**Institution:** Universität Leipzig, Sommersemester 2025  

## Project Overview

This thesis project develops a comprehensive workflow for systematic collection and analysis of Olympic venue data, combining web scraping, AI-powered PDF extraction, venue matching algorithms, and interactive web visualization.

## 📁 Project Components

### 🌐 [Web Application (`webapp/`)](./webapp/README.md)
Next.js interactive web application featuring Olympic venue maps, charts, and analytics dashboard with dark mode support.

### 🗺️ [GeoJSON Scraper (`geojson_scraper/`)](./geojson_scraper/README.md) 
Comprehensive data collection pipeline scraping venue information from Olympedia.org and converting to GeoJSON format.

### 📄 [PDF to JSON Pipeline (`pdfToJson/`)](./pdfToJson/README.md)
Automated N8N workflow converting Olympic venue PDF reports into structured JSON using Claude 4 AI extraction.

### 🔗 [Venue Matching (`matching-felix/`)](archive/matching-poc/README.md)
POC venue matching system with 82.2% success rate, combining GeoJSON and PDF data sources using fuzzy matching algorithms.

### 📊 [Olympic Reports Scraper (`olympic_reports/`)](archive/olympic_reports-poc/README.md)
POC web scraper for downloading official Olympic Games reports from IOC Olympic Library (54 reports, 1896-2024).

### 🔧 [PDF Splitter (`pdf_splitter/`)](archive/pdf_splitter-poc/README.md)
Desktop GUI application for splitting PDF documents using ToC, regex patterns, or fixed page counts.

### 💡 [Idea Collection (`Idea-collection/`)](archive/idea-collection/README.md)
Research materials, visualization concepts, and external datasets informing the project development.

### 📦 [Archive (`archive/`)](./archive/README.md)
Deprecated documents and resources maintained for reference.

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** with pip for data processing scripts
- **Node.js 18+** with npm for the web application
- **Chrome browser** (for web scraping)

### Option 1: Use Existing Data (Recommended for Quick Setup)
The repository contains pre-processed Olympic venue data. You can jump straight to visualization:

```bash
# 1. Navigate to the web application
cd webapp

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open http://localhost:3000 in your browser
```

The webapp automatically loads processed GeoJSON data from `geojson_scraper/00_final_geojsons/`.

### Option 2: Full Data Pipeline (For Research/Extension)

#### Step 1: Collect Raw Data

**Download Olympic Reports (Optional - PDFs provided):**
```bash
cd olympic_reports-poc
pip install selenium webdriver-manager requests
python reports_scrapper.py
```

**Scrape Venue Coordinates from Olympedia:**
```bash
cd geojson_scraper
pip install requests beautifulsoup4
python 01_scraper.py -n 100 -s 1    # Scrape 100 venues starting from ID 1
```

#### Step 2: Process Data

**Convert scraped data to GeoJSON:**
```bash
cd geojson_scraper
python 02_geojson_templater.py      # Creates basic GeoJSON files
python 03_duplicate_finder.py       # Removes duplicates
python 04_renamer.py               # Adds descriptive names
python 05_venue_combiner.py        # Combines related venues
```

**Process PDFs (Advanced - requires N8N setup):**
```bash
cd pdf_splitter-poc
pip install PyMuPDF customtkinter
python app_gui.py                  # GUI tool for splitting PDFs

# For automated processing, see pdfToJson/n8n/README.md
```

#### Step 3: Match and Combine Data Sources

```bash
cd matching-poc
pip install fuzzywuzzy python-Levenshtein
python main.py                     # Matches PDF and GeoJSON data (82.2% success rate)
```

#### Step 4: Launch Web Application

```bash
cd webapp
npm install
npm run build                      # Production build
npm start                          # Production server
# Or: npm run dev                  # Development server
```

### Adding Your Own Data

**PDF Reports:** Place Olympic venue PDFs in `pdfToJson/n8n/n8n_io/test_files/`
**GeoJSON Files:** Processed files go to `geojson_scraper/00_final_geojsons/`
**Scraped Data:** Raw venue JSON files stored in `geojson_scraper/01_scraped_websites/`

### Troubleshooting

- **Webapp can't find data:** Ensure GeoJSON files exist in `geojson_scraper/00_final_geojsons/`
- **Scraping fails:** Check internet connection and Olympedia.org availability
- **Node.js issues:** Verify Node.js 18+ is installed with `node --version`
- **Python dependencies:** Use virtual environments: `python -m venv venv && venv\Scripts\activate`

## 🔧 Technical Stack

- **Backend:** Python (Selenium, BeautifulSoup, PyMuPDF), N8N automation
- **AI Processing:** Claude 4 Sonnet for PDF extraction and validation
- **Frontend:** Next.js 15, React 19, MapLibre GL, Tailwind CSS
- **Data:** GeoJSON, PDF reports, external datasets (Harvard, Kaggle, World Bank)

## 📈 Results

- **Venue Coverage:** 1000+ venues across 130+ years of Olympic history
- **Match Rate:** 70% successful venue matching between data sources
- **Games Coverage:** 54 Olympic Games (Summer 1896-2024, Winter 1924-2022)
- **Web Interface:** Interactive maps, charts, and analytics dashboard
