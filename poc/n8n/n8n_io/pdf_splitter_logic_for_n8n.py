import fitz  # PyMuPDF
import os
import re
import argparse
import traceback

parser = argparse.ArgumentParser(description='PDF Chunker Script for n8n.io workflow')
parser.add_argument('--path', type=str, required=True, help='Path to the PDF document')


def discover_sections_by_toc():
    """Tries to split by ToC. Returns a list of sections or None."""
    sections = [{"title": title, "page": page} for level, title, page in toc]
    return sections


def discover_sections_by_fixed_pages():
    """Splits the document into fixed-size chunks based on page count."""
    pages_per_chunk = 5  # Default chunk size
    total_pages = len(doc)
    sections = []

    for start_page in range(1, total_pages + 1, pages_per_chunk):
        end_page = min(start_page + pages_per_chunk - 1, total_pages)
        title = f"Part_Pages_{start_page}_to_{end_page}"
        sections.append({"title": title, "page": start_page})
    return sections


def process_and_save_sections(sections_to_create, output_dir):
    """Processes the sections and saves them as separate PDF files."""

    def clean_filename(title):
        """Cleans the title to create a valid filename."""
        title = title.strip()
        title = re.sub(r'[\\/*?:"<>|]', "", title)
        title = re.sub(r'\s+', '_', title)
        return title[:100]

    if not sections_to_create:
        return None

    os.makedirs(output_dir, exist_ok=True)

    if sections_to_create[0]['page'] > 1:
        sections_to_create.insert(0, {"title": "Preamble", "page": 1})

    for i, section in enumerate(sections_to_create):
        start_page = section['page']
        if i + 1 < len(sections_to_create):
            end_page = sections_to_create[i + 1]['page'] - 1
        else:
            end_page = len(doc)

        if start_page > end_page:
            continue

        safe_title = clean_filename(section['title'])
        output_path = os.path.join(output_dir, f"{i + 1:02d}_{safe_title}.pdf")

        new_doc = fitz.open()
        new_doc.insert_pdf(doc, from_page=start_page - 1, to_page=end_page - 1)
        new_doc.save(output_path, garbage=4, deflate=True)
        new_doc.close()
    return len(sections_to_create)  # Return the number of files created


try:
    args = parser.parse_args()
    doc_path = args.path
    doc = fitz.open(doc_path)
    chunked_doc = []
    print(f"[INFO] Processing {doc_path}")

    toc = doc.get_toc()

    if toc:
        print("[INFO] Table of Contents found, attempting to split by ToC...")
        chunked_doc = discover_sections_by_toc()
    else:
        print("[INFO] No Table of Contents found, attempting to split by fixed pages...")
        chunked_doc = discover_sections_by_fixed_pages()

    print(f"[INFO] Found {len(chunked_doc)} sections")
    do_dir, doc_name = os.path.split(doc_path)
    chunked_path = os.path.join(do_dir, doc_name + "_chunked")
    saved_chunks = process_and_save_sections(chunked_doc, chunked_path)
    doc.close()

    print(f"[INFO] Successfully created {saved_chunks} files in '{chunked_path}' folder.")
    exit(0)

except Exception as e:
    print(f"[ERROR] {e}")
    print(str(traceback.print_exc()))
    exit(1)
