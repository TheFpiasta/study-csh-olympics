import os
import json
import csv
import re

# --- Directories (update as needed) ---
venue_dir = r"pdfToJson\n8n\n8n_io\PDF_summery\venues_summer\Full-report-venues-post-games-use-summer.pdf_chunked"
geojson_dir = r"geojson_scraper\named_geojsons"

# --- Helpers ---

def extract_year_city_from_venue_filename(filename):
    # Expected format: "XX_CITY_YEAR_VENUES.pdf.json"
    parts = filename.split('_')
    if len(parts) < 4:
        return None, None
    year = parts[-2]
    city = parts[-3].lower()
    return year, city

def extract_year_from_geojson_filename(filename):
    # Expected format: "YEAR-season.geojson"
    if '-' not in filename:
        return None
    year = filename.split('-', 1)[0]
    return year

def count_venues_in_venue_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        venues = data[0]['extraction']['data']['venues']
        return len(venues)
    except Exception as e:
        print(f"Error reading venue JSON {filepath}: {e}")
        return 0

def count_venues_in_geojson(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        features = data.get('features', [])
        # Count only features that have 'source_file' – indicates actual venue entry
        return sum(1 for feat in features if 'source_file' in feat.get('properties', {}))
    except Exception as e:
        print(f"Error reading geojson {filepath}: {e}")
        return 0

# --- Collect venue JSON counts ---
venue_data = {}  # key: (year, city)
for fname in os.listdir(venue_dir):
    if not fname.endswith('.json'):
        continue
    year, city = extract_year_city_from_venue_filename(fname)
    if not year or not city:
        continue
    full_path = os.path.join(venue_dir, fname)
    count = count_venues_in_venue_json(full_path)
    venue_data[(year, city)] = count

# --- Collect geojson counts ---
geojson_data = {} # key: (year) -> count
for fname in os.listdir(geojson_dir):
    if not fname.endswith('.geojson'):
        continue

    match = re.match(r'^(\d{4})_(.+)\.geojson$', fname)
    if not match:
        print(f"{fname} is not in the right naming convention.")
        continue

    year = match.group(1)
    place = match.group(2).lower()
    key = (year, place)

    full_path = os.path.join(geojson_dir, fname)
    with open(full_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    features = data.get('features', [])
    count = sum(
        1 for feature in features
        if 'properties' in feature and 'source_file' in feature['properties']
    )

    print(f"{key}: {count}x 'source_file'")
    geojson_data[key] = count

# --- Match & Compare ---
output_csv = "venue_counts.csv"
with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["Year", "City", "Venue JSON Count", "GeoJSON Count", "+/-"])  # Add header

    for (year, city) in sorted(venue_data.keys()):
        venue_count = venue_data.get((year, city), 0)
        geo_count = geojson_data.get((year, city), 0)
        diff = geo_count - venue_count  # Positive = more in GeoJSON, negative = fewer
        writer.writerow([year, city.title(), venue_count, geo_count, diff])


print(f"✔ Venue comparison written to: {output_csv}")
