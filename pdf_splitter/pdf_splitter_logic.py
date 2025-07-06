# pdf_splitter_logic.py

import fitz  # PyMuPDF
import os
import re

def clean_filename(title):
    """Creates a safe, clean filename from a chapter title."""
    title = title.strip()
    title = re.sub(r'[\\/*?:"<>|]', "", title)
    title = re.sub(r'\s+', '_', title)
    return title[:100]

def process_and_save_sections(doc, sections_to_create, output_dir):
    """Iterates through a list of discovered sections and saves each as a separate PDF."""
    if not sections_to_create:
        return # Nothing to do

    os.makedirs(output_dir, exist_ok=True)
    
    if sections_to_create[0]['page'] > 1:
        sections_to_create.insert(0, {"title": "Preamble", "page": 1})

    for i, section in enumerate(sections_to_create):
        start_page = section['page']
        if i + 1 < len(sections_to_create):
            end_page = sections_to_create[i+1]['page'] - 1
        else:
            end_page = len(doc)

        if start_page > end_page:
            continue

        safe_title = clean_filename(section['title'])
        output_path = os.path.join(output_dir, f"{i+1:02d}_{safe_title}.pdf")
        
        new_doc = fitz.open()
        new_doc.insert_pdf(doc, from_page=start_page - 1, to_page=end_page - 1)
        new_doc.save(output_path, garbage=4, deflate=True)
        new_doc.close()
    return len(sections_to_create) # Return the number of files created

def discover_sections_by_toc(doc):
    """Tries to split by ToC. Returns a list of sections or None."""
    toc = doc.get_toc()
    if not toc:
        return None
    sections = [{"title": title, "page": page} for level, title, page in toc]
    return sections

def discover_sections_by_regex(doc, pattern_str):
    """Tries to split by Regex. Returns a list of sections or None."""
    try:
        pattern = re.compile(pattern_str, re.MULTILINE)
    except re.error:
        return None

    sections = []
    found_titles = set()
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        for match in pattern.finditer(text):
            title = (match.group(1) if match.groups() else match.group(0)).strip()
            if title not in found_titles:
                sections.append({"title": title, "page": page_num + 1})
                found_titles.add(title)
    if not sections:
        return None
    sections.sort(key=lambda x: x['page'])
    return sections

def discover_sections_by_fixed_pages(doc, chunk_size):
    """Splits by fixed page count. Always returns a list of sections."""
    total_pages = len(doc)
    sections = []
    for start_page in range(1, total_pages + 1, chunk_size):
        end_page = min(start_page + chunk_size - 1, total_pages)
        title = f"Part_Pages_{start_page}_to_{end_page}"
        sections.append({"title": title, "page": start_page})
    return sections