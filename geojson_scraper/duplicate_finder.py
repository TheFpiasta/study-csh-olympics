############
#
# somehow the output files were created with duplicate venues entires
# this script finds those and deletes one
#
############
import os
import json

# Get directory where the current script file is located
script_dir = os.path.dirname(os.path.abspath(__file__))
directory = os.path.join(script_dir, "output_files")


def remove_duplicates_in_file(filepath):
    print(f"Working on '{os.path.basename(filepath)}'")
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if "features" not in data:
        print(f"No features found in {filepath}")
        return
    
    seen_source_files = set()
    unique_features = []
    
    for feature in data["features"]:
        source_file = feature.get("properties", {}).get("source_file")
        if source_file is None:
            # If no source_file, consider it unique and keep it
            unique_features.append(feature)
        else:
            if source_file not in seen_source_files:
                seen_source_files.add(source_file)
                unique_features.append(feature)
            else:
                # Duplicate within the same file, skip it
                print(f"Duplicate source_file '{source_file}' removed in file: {filepath}")
    
    data["features"] = unique_features
    
    # Overwrite the file with cleaned data
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def process_directory(directory_path):
    for filename in os.listdir(directory_path):
        if filename.endswith('.geojson'):
            filepath = os.path.join(directory_path, filename)
            print(f"Processing file: {filepath}")
            remove_duplicates_in_file(filepath)

# Example usage:
print(f"Processing directory: {directory}")
process_directory(directory)
