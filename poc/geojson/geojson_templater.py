import json
import os

# TODO

# GeoJSON template with a single Point feature and placeholder coordinates
geojson_template = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [None, None]  # Placeholder: replace with [longitude, latitude]
            },
            "properties": {
                "name": "PLACEHOLDER_NAME"
            }
        }
    ]
}

# Write to file
file_name = "1992-winter"
output_path = os.path.join(os.path.dirname(__file__), file_name + ".geojson")
with open(output_path, "w") as f:
    json.dump(geojson_template, f, indent=2)

print("GeoJSON template with placeholder point created: " + file_name + ".geojson")
