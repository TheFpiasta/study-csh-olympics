import os
import json
import glob

input_dir = os.path.join(os.path.dirname(__file__), "scraped_websites")
output_dir = os.path.join(os.path.dirname(__file__), "output_files")
os.makedirs(output_dir, exist_ok=True)

geojson_groups = {}

for file_path in glob.glob(os.path.join(input_dir, "venue_*.json")):
    with open(file_path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"Skipping invalid JSON: {file_path}")
            continue

    biodata = data.get("biodata", {})
    coords = biodata.get("coordinates", "")
    if not coords:
        continue

    try:
        lat, lon = map(float, coords.split(","))
    except ValueError:
        print(f"Invalid coordinates in {file_path}")
        continue

    year = biodata.get("year", "unknown")
    season = biodata.get("season", "unknown").lower()
    events = data.get("event_data", [])

    # Create a copy of all biodata fields for properties
    properties = biodata.copy()
    properties.update({
        "events": events,
        "source_file": os.path.basename(file_path)
    })

    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [lon, lat]
        },
        "properties": properties
    }

    key = f"{year}-{season}"
    if key not in geojson_groups:
        geojson_groups[key] = {
            "type": "FeatureCollection",
            "features": []
        }

    geojson_groups[key]["features"].append(feature)

# Write out each grouped GeoJSON file
for key, geojson in geojson_groups.items():
    output_path = os.path.join(output_dir, f"{key}.geojson")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(geojson['features'])} features to {output_path}")
