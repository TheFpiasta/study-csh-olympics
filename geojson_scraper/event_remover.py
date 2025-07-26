import os
import json

# Set the path to your folder
folder_path = os.path.join(os.path.dirname(__file__), "named_geojsons")

# Loop through all .geojson files in the folder
for filename in os.listdir(folder_path):
    if filename.endswith(".geojson"):
        file_path = os.path.join(folder_path, filename)
        
        # Open and load the GeoJSON file
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError as e:
                print(f"Error reading {filename}: {e}")
                continue

        # Remove 'events' from each feature
        for feature in data.get("features", []):
            if "properties" in feature and "events" in feature["properties"]:
                del feature["properties"]["events"]

        # Save the cleaned GeoJSON back to the same file (overwrite)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"Processed: {filename}")
