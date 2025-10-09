# Idea Collection

This folder contains the conceptual foundation and research resources for the Olympic Venues thesis project - a collection of ideas, visual concepts, and external datasets that inform the development of the interactive Olympic venues web application.

## Overview

The Idea-collection serves as a centralized repository of:
- **Conceptual documentation** outlining visualization strategies and graph ideas
- **Visual mockups** showing frontend design concepts and user interface layouts
- **External datasets** from various sources (Harvard, Kaggle, World Bank, IOC) for data enrichment
- **Project brainstorming materials** documenting research questions and technical approaches

## Contents

### Documentation & Ideas
- `Graphen und Karte Ideen.md` - Comprehensive list of 39 proposed visualizations for the web application, including interactive maps, temporal analyses, cost comparisons, and sustainability metrics
- `brainstorming.drawio.svg` - Visual brainstorming diagram (334KB SVG with detailed concept mapping)
- `ideen-vorstellung.drawio.svg` - Project concept presentation diagram showing main focus areas and technical implementation ideas

### Visual Mockups
- `Idee_Frontend.png` - Frontend interface mockups showing map layout, filtering options, and chart integration concepts
- `Kopie von ideen-vorstellung.drawio.png` - Copy of the main project concept visualization

### External Data Sources (`datasets/`)

#### Harvard Economic Data
- `harvard-Revenues-and-Costs-1960s-2010s/`
  - `Growth dataset Olympic Games and Football World Cup.xlsx` - Economic analysis data comparing Olympics and World Cup growth metrics

#### Kaggle Olympic Datasets
- `kaggle-olympics-1896-2016/`
  - `athlete_events.csv` - Historical athlete participation data (1896-2016)
  - `noc_regions.csv` - National Olympic Committee regional mappings

- `kaggle-olympics-1896-2022/` 
  - `olympic_athletes.csv` - Extended athlete dataset through 2022
  - `olympic_hosts.csv` - Host city and country information
  - `olympic_medals.csv` - Medal winners and statistics
  - `olympic_results.csv` - Competition results data
  - `olympic_results.pkl` - Preprocessed results in Python pickle format

#### Official Olympic Documentation
- `olympics-venues-pdf/`
  - `Executive-summary-venues-post-games-use_opt.pdf` - IOC executive summary on post-Games venue utilization
  - `Full-report-venues-post-games-use.pdf` - Complete IOC report on venue legacy and sustainability

#### World Bank Demographics
- `worldbank-population-total/`
  - `API_SP.POP.TOTL_DS2_en_csv_v2_2590.csv` - World population data for contextualizing Olympic host countries
  - `API_SP.POP.TOTL_DS2_en_excel_v2_2577.xls` - Excel format population data
  - `API_SP.POP.TOTL_DS2_en_xml_v2_3681.xml` - XML format population data
  - `Metadata_Country_API_SP.POP.TOTL_DS2_en_csv_v2_2590.csv` - Country metadata for population dataset
  - `Metadata_Indicator_API_SP.POP.TOTL_DS2_en_csv_v2_2590.csv` - Indicator metadata for population dataset

## Usage Notes

This folder serves as **reference material only** - the datasets and concepts here inform the main application development but are not directly integrated into the codebase. The actual data processing and application implementation occur in the main project directories (`webapp/`, `matching-felix/`, `pdfToJson/`, etc.).

## Data Sources Attribution

- **Harvard**: Growth dataset Olympic Games and Football World Cup
- **Kaggle**: Multiple Olympic datasets (1896-2022) under open data licenses
- **IOC**: Official venue reports and post-Games utilization studies
- **World Bank**: Population statistics via their open data API