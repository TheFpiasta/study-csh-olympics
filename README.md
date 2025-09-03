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

### 🔗 [Venue Matching (`matching-felix/`)](./matching-felix/README.md)
POC venue matching system with 82.2% success rate, combining GeoJSON and PDF data sources using fuzzy matching algorithms.

### 📊 [Olympic Reports Scraper (`olympic_reports/`)](./olympic_reports/README.md)
POC web scraper for downloading official Olympic Games reports from IOC Olympic Library (54 reports, 1896-2024).

### 🔧 [PDF Splitter (`pdf_splitter/`)](./pdf_splitter/README.md)
Desktop GUI application for splitting PDF documents using ToC, regex patterns, or fixed page counts.

### 💡 [Idea Collection (`Idea-collection/`)](./Idea-collection/README.md)
Research materials, visualization concepts, and external datasets informing the project development.

### 📦 [Archive (`archive/`)](./archive/README.md)
Deprecated documents and resources maintained for reference.

## 🚀 Quick Start

1. **Data Collection:** Use `olympic_reports/` to download PDF reports
2. **PDF Processing:** Split PDFs with `pdf_splitter/` and extract data via `pdfToJson/`
3. **Web Scraping:** Collect venue coordinates with `geojson_scraper/`
4. **Data Matching:** Combine sources using `matching-felix/`
5. **Visualization:** Launch web app from `webapp/` for interactive analysis

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
