# PDF Splitter

A desktop GUI application for splitting PDF documents into smaller sections using various methods. This tool is designed as a proof-of-concept (POC) and has been adapted for use in the `pdfToJson` workflow within the Olympic venues data processing pipeline.

## Overview

The PDF Splitter provides a user-friendly interface for dividing large PDF documents into manageable chunks based on different splitting strategies. It's particularly useful for processing Olympic venue reports that need to be split before AI-powered data extraction.

## Files Structure

- `app_gui.py` - Main GUI application using CustomTkinter
- `pdf_splitter_logic.py` - Core PDF processing logic and algorithms
- `README.md` - This documentation file

## Features

### Three Splitting Methods

1. **Table of Contents (ToC)** - Automatically detects and splits by document's built-in table of contents
2. **Regex Pattern** - Splits document based on user-defined regular expression patterns
3. **Fixed Page Count** - Divides document into equal-sized chunks of specified page count

### Key Capabilities

- Clean filename generation with special character handling
- Automatic output directory creation
- Error handling and user feedback
- Progress indication during processing
- Support for complex documents with preambles
- Optimized PDF output with compression

## Dependencies

```bash
pip install PyMuPDF customtkinter
```

- **PyMuPDF (fitz)** - PDF document manipulation and text extraction
- **CustomTkinter** - Modern GUI framework for the desktop interface

## Usage

### Running the Application

```bash
python app_gui.py
```

### Using the GUI

1. **Select PDF File** - Browse and choose the PDF document to split
2. **Choose Splitting Method**:
   - **ToC**: Uses the document's table of contents (if available)
   - **Regex**: Enter a pattern like `^Chapter \d+` to match chapter headers
   - **Fixed Pages**: Specify number of pages per chunk (e.g., 10)
3. **Start Splitting** - Click the button or press Enter to begin processing

### Output

Split PDF files are saved in the `pdf_output_split` directory with the naming convention:
- `01_Section_Title.pdf`
- `02_Next_Section.pdf`
- etc.

## Implementation Details

### Core Logic Functions

#### `clean_filename(title)`
- Sanitizes section titles for safe filename usage
- Removes special characters and replaces spaces with underscores
- Truncates to 100 characters maximum

#### `process_and_save_sections(doc, sections_to_create, output_dir)`
- Main processing function that creates individual PDF files
- Handles preamble sections automatically
- Uses optimized PDF saving with garbage collection and deflation
- Returns count of created files

#### `discover_sections_by_toc(doc)`
- Extracts sections from PDF's table of contents
- Returns list of sections with titles and page numbers
- Returns None if no ToC is found

#### `discover_sections_by_regex(doc, pattern_str)`
- Searches for regex matches across all pages
- Extracts section titles from capture groups or full matches
- Removes duplicate titles and sorts by page order
- Returns None if no matches found

#### `discover_sections_by_fixed_pages(doc, chunk_size)`
- Creates sections based on fixed page intervals
- Always returns a valid section list
- Generates descriptive titles showing page ranges

### GUI Features

- **Dark Mode Interface** - Modern CustomTkinter theme
- **Dynamic Input Fields** - Context-sensitive controls based on selected method
- **Global Enter Key Binding** - Start processing from anywhere in the application
- **Real-time Status Updates** - Progress and error feedback
- **Button State Management** - Prevents multiple simultaneous operations

## Integration with pdfToJson Workflow

This PDF splitter serves as a preprocessing step in the larger Olympic venues data extraction pipeline:

1. **Input**: Olympic venue reports in PDF format
2. **Processing**: Split PDFs into manageable chunks using this tool
3. **Output**: Individual PDF sections ready for AI-powered data extraction
4. **Next Step**: Processed chunks are fed into Claude 4 API for structured venue data extraction

The tool's regex capabilities are particularly useful for splitting Olympic reports by year or event sections, enabling more targeted data extraction downstream.

## Error Handling

- File validation for PDF format
- Regex pattern validation
- Numeric input validation for page counts
- Graceful fallback when methods fail (e.g., no ToC found)
- Comprehensive exception handling during PDF processing

## Performance Notes

- Uses efficient PDF manipulation with PyMuPDF
- Implements garbage collection and compression for output files
- Processes documents page-by-page to handle large files
- Memory-efficient section discovery algorithms

## Limitations

- GUI-based tool requiring desktop environment
- Regex patterns must be manually crafted for specific document structures
- ToC method depends on properly formatted PDF table of contents
- Fixed page splitting may break logical document sections

## Future Enhancements

- Command-line interface option
- Batch processing capabilities
- Advanced regex pattern templates
- Preview functionality before splitting
- Integration with automated workflows