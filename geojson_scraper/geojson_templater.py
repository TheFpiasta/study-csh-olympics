import os
import json
import glob
import time

start_time = time.time()

input_dir = os.path.join(os.path.dirname(__file__), "rescraped_websites")
output_dir = os.path.join(os.path.dirname(__file__), "output_files_rescraped")
os.makedirs(output_dir, exist_ok=True)

geojson_groups = {}
file_count = 0
skipped_files = 0

print("Starting to process files...")

for file_path in glob.glob(os.path.join(input_dir, "venue_*.json")):
    file_count += 1
    # print(f"Processing: {os.path.basename(file_path)}")

    with open(file_path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"⚠️ Skipping invalid JSON: {file_path}")
            skipped_files += 1
            continue

    biodata = data.get("biodata", {})
    coords = biodata.get("coordinates", "")
    if not coords:
        print(f"⚠️ Skipping file (missing coordinates): {file_path}")
        skipped_files += 1
        continue

    try:
        lat, lon = map(float, coords.split(","))
    except ValueError:
        print(f"⚠️ Skipping file (invalid coordinates): {file_path}")
        skipped_files += 1
        continue

    events = data.get("event_data", [])

    # Create a copy of all biodata fields for properties
    properties = biodata.copy()
    properties.update({
        "events": events,
        "source_file": os.path.basename(file_path)
    })

    games = biodata.get("games")
    if games and isinstance(games, list):
        for game in games:
            year = game.get("year", "unknown")
            season = game.get("season", "unknown").lower()
            key = f"{year}-{season}"

            if key not in geojson_groups:
                geojson_groups[key] = {
                    "type": "FeatureCollection",
                    "features": []
                }

            geojson_groups[key]["features"].append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                },
                "properties": properties
            })
    else:
        # fallback to old logic if "games" key not present
        year = biodata.get("year", "unknown")
        season = biodata.get("season", "unknown").lower()
        key = f"{year}-{season}"

    if key not in geojson_groups:
        geojson_groups[key] = {
            "type": "FeatureCollection",
            "features": []
        }

    geojson_groups[key]["features"].append({
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [lon, lat]
        },
        "properties": properties
    })


print(f"\n✅ Finished processing {file_count} files (skipped {skipped_files})")
print(f"📦 Generating GeoJSON files for {len(geojson_groups)} year-season groups...\n")

# Write out each grouped GeoJSON file
for key, geojson in geojson_groups.items():
    output_path = os.path.join(output_dir, f"{key}.geojson")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)
    print(f"🗂️  Saved {len(geojson['features'])} features to {output_path}")

end_time = time.time()
print(f"\n🎉 Done in {end_time - start_time:.2f} seconds.")
