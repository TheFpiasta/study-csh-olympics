import os
import re
import pandas as pd
import warnings
import json
import openpyxl
import shutil

warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

def extract_year_location(filename):
    match = re.match(r"combined_(\d{4})_(.+)\.geojson", filename)
    if match:
        year, location = match.groups()
        return year, location.replace('_', ' ')
    return None, None

def extract_excel_data(excel_file, year, location):
    df = pd.read_excel(excel_file)
    search_value = f"{year} {location}"
    result = df.astype(str).apply(lambda col: col.str.contains(search_value, na=False, case=False))
    coords = list(zip(*result.to_numpy().nonzero()))
    if coords:
        return coords[0][0]
    return None

def get_cell_format(ws, row_idx, col_idx):
    cell = ws.cell(row=row_idx + 2, column=col_idx + 1)  # +2: pandas row 0 is Excel row 2 (header is row 1)
    number_format = cell.number_format
    if not number_format or number_format == "General":
        return "standard", None
    # Try to extract a 3-letter currency code (ISO 4217) from the format string
    match = re.search(r'\b([A-Z]{3})\b', number_format)
    if match:
        return "currency", match.group(1)
    # Check for number
    if "0" in number_format or "#" in number_format:
        return "number", None
    return "standard", None

def find_matches(geojson_folder, excel_file, output_folder, final_dir):
    wb = openpyxl.load_workbook(excel_file, data_only=True)
    ws = wb.active

    matched_files = set()

    for filename in os.listdir(geojson_folder):
        if not filename.endswith(".geojson"):
            continue

        year, location = extract_year_location(filename)
        row_harvard = extract_excel_data(excel_file, year, location)
        if row_harvard is None:
            continue

        print(f"Found matching row in Harvard study: {row_harvard}")

        # Read the Harvard row data
        df = pd.read_excel(excel_file)
        row_data = df.iloc[row_harvard]
        headers = list(row_data.index)

        # Build the harvard dictionary
        harvard_dict = {}
        for idx, header in enumerate(headers):
            header_str = str(header).strip().replace(' ', '_').lower()
            if "source" not in header_str and "unnamed" not in header_str:
                source = ""
                for next_idx in range(idx + 1, len(headers)):
                    if "source" in str(headers[next_idx]).strip().replace(' ', '_').lower():
                        source = str(row_data[headers[next_idx]])
                        break
                # Get formatting info
                fmt_type, currency = get_cell_format(ws, row_harvard, idx)
                harvard_dict[header_str] = {
                    "data": str(row_data[header]),
                    "source": source,
                    "format": fmt_type,
                    "currency": currency
                }

        # Read the base geojson file
        geojson_path = os.path.join(geojson_folder, filename)
        with open(geojson_path, "r", encoding="utf-8") as f:
            geojson_data = json.load(f)

        # Add the harvard field at the top level as a list
        geojson_data["harvard"] = harvard_dict

        # Prepare output filenames
        safe_location = location.replace(" ", "_")
        output_filename = f"harvard_{year}_{safe_location}.geojson"
        final_filename = f"{year}_{safe_location}.geojson"
        output_path = os.path.join(output_folder, output_filename)
        final_path = os.path.join(final_dir, final_filename)

        # Write the new geojson file
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(geojson_data, f, ensure_ascii=False, indent=2)
        with open(final_path, "w", encoding="utf-8") as f:
            json.dump(geojson_data, f, ensure_ascii=False, indent=2)

        matched_files.add(filename)
        print(f"Wrote enriched GeoJSON to {output_path}")

    # Copy unmatched files into final_dir
    for filename in os.listdir(geojson_folder):
        if filename.endswith(".geojson") and filename not in matched_files:
            src_path = os.path.join(geojson_folder, filename)
            dst_filename = filename.replace("combined_", "")  # remove prefix for consistency
            dst_path = os.path.join(final_dir, dst_filename)
            shutil.copy2(src_path, dst_path)
            print(f"[UNMATCHED] Copied {filename} to {dst_path}")


# --- Setup paths ---
base_dir = os.path.join(os.path.dirname(__file__), "04_combined_geojsons")
harvard_study = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../idea-collection/datasets/harvard-Revenues-and-Costs-1960s-2010s/Growth dataset Olympic Games and Football World Cup.xlsx"
    )
)

output_folder = os.path.join(os.path.dirname(__file__), "05_harvard_geojsons")
os.makedirs(output_folder, exist_ok=True)

final_dir = os.path.join(os.path.dirname(__file__), "00_final_geojsons")
# Clear final_dir before writing
if os.path.exists(final_dir):
    shutil.rmtree(final_dir)
os.makedirs(final_dir, exist_ok=True)

# Run
find_matches(base_dir, harvard_study, output_folder, final_dir)
