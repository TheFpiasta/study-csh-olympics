import os
import json
import re

def extract_year_location(filename):
    match = re.match(r"(\d{4})_(.+)\.geojson", filename)
    if match:
        year, location = match.groups()
        return year, location.replace('_', ' ')
    return None, None

def normalize(text):
    return re.sub(r'\W+', '', text).lower()

def location_matches(location1, location2):
    loc1 = normalize(location1)
    loc2 = normalize(location2)
    return loc1 in loc2 or loc2 in loc1

def match_json(year, location, json_folders):
    for json_folder in json_folders:
        for json_file in os.listdir(json_folder):
            if not json_file.endswith(".json"):
                continue
            json_path = os.path.join(json_folder, json_file)
            with open(json_path, "r", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                    extraction = data[0]['extraction']['data']
                    json_year = extraction['year']
                    json_city = extraction['city']

                    if str(json_year) == str(year) and json_city and location_matches(json_city, location):
                        return True

                except Exception as e:
                    print(f"Error reading {json_file}: {e}")
                    continue
    return False

def find_matches(geojson_folder, json_folders):
    for filename in os.listdir(geojson_folder):
        if filename.endswith(".geojson"):
            year, location = extract_year_location(filename)
            if not year or not location:
                print(f"Could not extract year/location from {filename}")
                continue

            matched = match_json(year, location, json_folders)
            if matched:
                print(f"[MATCHED] Found JSON for {filename} -> {year}, {location}")
                # Add logic for venue finding here
            else:
                print(f"[NOT FOUND] No JSON found for {filename} -> {year}, {location}")

# Example usage
base_dir = os.path.join(os.path.dirname(__file__), "../pdfToJson/n8n/n8n_io/PDF_summery_v2")
json_folders = [
    os.path.join(base_dir, "venues_winter/Full-report-venues-post-games-use-winter.pdf_chunked"),
    os.path.join(base_dir, "venues_summer/Full-report-venues-post-games-use-summer.pdf_chunked"),
]
geojson_folder = os.path.join(os.path.dirname(__file__), "named_geojsons")

find_matches(geojson_folder, json_folders)

# Had to rename Torino to Torino / Turin