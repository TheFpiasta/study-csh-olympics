import os
import json
import re
from difflib import SequenceMatcher
import shutil

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
                        return json_path  # Return path for further processing

                except Exception as e:
                    print(f"Error reading {json_file}: {e}")
                    continue
    return None

def find_matches(geojson_folder, json_folders):
    output_folder = os.path.join(os.path.dirname(__file__), "output_venues_found")
    os.makedirs(output_folder, exist_ok=True)
    finals = []

    for filename in os.listdir(geojson_folder):
        if filename.endswith(".geojson"):
            year, location = extract_year_location(filename)
            if not year or not location:
                print(f"Could not extract year/location from {filename}")
                continue

            matched_json_path = match_json(year, location, json_folders)
            if matched_json_path:
                # print(f"[MATCHED] Found JSON for {filename} -> {year}, {location}")
                # Load JSON extracted data
                with open(matched_json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                json_venues = data[0]["extraction"]["data"].get("venues", [])

                # Load GeoJSON data
                geojson_path = os.path.join(geojson_folder, filename)
                with open(geojson_path, "r", encoding="utf-8") as f:
                    geojson = json.load(f)
                geojson_venues = geojson.get("features", [])

                # Prepare venue matching output collector
                output_lines = []

                # Venue matching functions (simplified for integration)
                def norm(text):
                    text = text.lower()
                    text = re.sub(r'[()]', '', text)
                    text = re.sub(r'[^\w\s]', '', text)
                    words = text.split()
                    words.sort()
                    return ' '.join(words)

                def similar(a, b):
                    return SequenceMatcher(None, a, b).ratio()

                def split_combined(text):
                    return [part.strip() for part in re.split(r',| and ', text.lower()) if part.strip()]

                def score_match(use_list, sports_list):
                    if not use_list or not sports_list:
                        return 0, 0, 0

                    expanded_use = []
                    for item in use_list:
                        expanded_use.extend(split_combined(item))
                    expanded_use = sorted(set([norm(u) for u in expanded_use]))
                    sports_items = sorted(set([norm(s) for s in sports_list]))

                    total_score = 0
                    max_score = len(expanded_use) * 3
                    matched_sports = set()

                    for use_item in expanded_use:
                        best_score = -1
                        best_match = None
                        for sport_item in sports_items:
                            if sport_item in matched_sports:
                                continue
                            sim = similar(use_item, sport_item)
                            if sim > 0.9:
                                best_score = 3
                                best_match = sport_item
                                break
                            elif sim > 0.6 and sim > best_score:
                                best_score = 1
                                best_match = sport_item
                        if best_match:
                            matched_sports.add(best_match)
                        total_score += best_score

                    unmatched_sports = [s for s in sports_items if s not in matched_sports]
                    total_score -= len(unmatched_sports)

                    similarity_ratio = total_score / max_score if max_score > 0 else 0
                    return similarity_ratio, total_score, max_score

                def extract_normalized_name_parts(name):
                    if not name:
                        return set()
                    name = name.strip()
                    parts = re.split(r'\s*/\s*', name) if '/' in name else [name]
                    return {norm(p) for p in parts if p}

                json_name_parts_list = [extract_normalized_name_parts(v.get("name", "")) for v in json_venues]
                geojson_name_parts_list = [
                    extract_normalized_name_parts(f["properties"].get("associated_names", [""])[0])
                    for f in geojson_venues
                ]

                matched_json_parts = [set() for _ in json_venues]
                matched_json = set()
                matched_geo = set()
                final_matches = []

                # Part name matches first
                for i, json_parts in enumerate(json_name_parts_list):
                    for part in json_parts:
                        if part in matched_json_parts[i]:
                            continue
                        for j, geo_parts in enumerate(geojson_name_parts_list):
                            if j in matched_geo:
                                continue
                            if part in geo_parts:
                                matched_json_parts[i].add(part)
                                matched_geo.add(j)
                                matched_json.add(i)
                                json_name = json_venues[i].get("name", "Unnamed")
                                geo_name = geojson_venues[j]["properties"].get("associated_names", ["Unnamed"])[0]
                                line = f"[Part Name Match] JSON Venue {i} '{json_name}' matched with GeoJSON Venue {j}: {geo_name}"
                                # Add to found match list
                                output_lines.append(line)
                                final_matches.append((filename, i, j, matched_json_path))
                                break

                # Score matches by use/sport and name similarity
                all_candidates = []

                for i, venue in enumerate(json_venues):
                    if i in matched_json:
                        continue

                    use_list = [u.strip().lower() for u in venue.get("use", "").split(",") if u.strip()]
                    json_name = norm(venue.get("name", ""))

                    for j, feature in enumerate(geojson_venues):
                        if j in matched_geo:
                            continue

                        sports_list = feature["properties"].get("sports", [])
                        geo_name = norm(feature["properties"].get("associated_names", [""])[0])

                        # Match score (0.0 - 1.0) between use_list and sports_list
                        use_sim, _, _ = score_match(use_list, sports_list)
                        # Similarity between the json_name and the geo_name
                        name_sim = similar(json_name, geo_name)

                        final_score = 0.7 * use_sim + 0.3 * name_sim
                        all_candidates.append((final_score, use_sim, name_sim, i, j))

                all_candidates.sort(reverse=True, key=lambda x: x[0])

                for final_score, use_sim, name_sim, i, j in all_candidates:
                    if i in matched_json or j in matched_geo:
                        continue
                    if final_score < 0.55:
                        continue

                    matched_json.add(i)
                    matched_geo.add(j)
                    final_matches.append((filename, i, j, matched_json_path))
                    json_name = json_venues[i].get("name", "Unnamed")
                    geo_name = geojson_venues[j]["properties"].get("associated_names", ["Unnamed"])[0]
                    verdict = "✅ (strong name)" if name_sim > 0.5 else "🟡 (weak name)"
                    line = f"[Use/Sport + Name Match] JSON Venue {i} - {json_name} ↔ GeoJSON Venue {j} - {geo_name} | UseSim: {use_sim:.2f}, NameSim: {name_sim:.2f}, Score: {final_score:.2f} | Match: {verdict}"
                    # Add to found match list
                    output_lines.append(line)

                # Unmatched JSON venues
                output_lines.append("\n--- Unmatched JSON Venues ---")
                for i, venue in enumerate(json_venues):
                    if i not in matched_json:
                        line = f"[JSON Venue {i}] '{venue.get('name', 'Unnamed')}' has no matching GeoJSON venue."
                        output_lines.append(line)

                # Unmatched GeoJSON venues
                output_lines.append("\n--- Unmatched GeoJSON Venues ---")
                for j, feature in enumerate(geojson_venues):
                    if j not in matched_geo:
                        line = f"[GeoJSON Venue {j}] '{feature['properties'].get('associated_names', ['Unnamed'])[0]}' has no matching JSON venue."
                        output_lines.append(line)

                # Write output to text file named like geojson but .txt in test_output
                out_filename = os.path.splitext(filename)[0] + ".txt"
                out_path = os.path.join(output_folder, out_filename)
                with open(out_path, "w", encoding="utf-8") as out_file:
                    out_file.write("\n".join(output_lines))
                finals.append(final_matches)

            else:
                print(f"[NOT FOUND] No JSON found for {filename} -> {year}, {location}")
    return finals

# Define the function to combine venue data
def combine_matches(matches, geojson_folder, output_folder="geojson_scraper/04_combined_geojsons", final_dir="geojson_scraper/00_final_geojsons"):
    os.makedirs(output_folder, exist_ok=True)
    os.makedirs(final_dir, exist_ok=True)

    # Clear final_dir before use
    if os.path.exists(final_dir):
        shutil.rmtree(final_dir)
    os.makedirs(final_dir, exist_ok=True)

    # Group matches by filename
    matches_by_file = {}
    for entry in matches:
        for filename, json_venue_idx, geojson_venue_idx, json_path in entry:
            matches_by_file.setdefault(filename, []).append((json_venue_idx, geojson_venue_idx, json_path))

    for filename, updates in matches_by_file.items():
        geojson_path = os.path.join(geojson_folder, filename)
        with open(geojson_path, 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)

        # Process all updates for this file
        for json_venue_idx, geojson_venue_idx, json_path in updates:
            with open(json_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)

            json_venue = json_data[0]['extraction']['data']['venues'][json_venue_idx]
            geojson_feature = geojson_data['features'][geojson_venue_idx]

            # Update name → associated_names
            name = json_venue.get('name')
            if name:
                assoc_names = geojson_feature['properties'].setdefault('associated_names', [])
                if not any(name.lower() == existing.lower() for existing in assoc_names):
                    assoc_names.append(name)

            # Update use → sports
            use = json_venue.get('use')
            if use:
                sports = geojson_feature['properties'].setdefault('sports', [])
                for sport in [s.strip() for s in use.split(',') if s.strip()]:
                    if not any(sport.lower() == existing.lower() for existing in sports):
                        sports.append(sport)

            # Add other fields to properties (except 'name' and 'use')
            for key, value in json_venue.items():
                if key not in ['name', 'use']:
                    # Maybe add a identifier such as _pdf to the key or PDF: to value
                    geojson_feature['properties'][key] = value

        # Save updated geojson once per file
        output_path = os.path.join(output_folder, "combined_" + filename)
        final_path = os.path.join(final_dir, filename)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(geojson_data, f, indent=2, ensure_ascii=False)
        with open(final_path, 'w', encoding='utf-8') as f:
            json.dump(geojson_data, f, indent=2, ensure_ascii=False)
        print(f"✅ Saved {filename} to {output_path} and copied to {final_path}")



# Example usage
base_dir = os.path.join(os.path.dirname(__file__), "../pdfToJson/n8n/n8n_io/PDF_summery_v2")
json_folders = [
    os.path.join(base_dir, "venues_winter/Full-report-venues-post-games-use-winter.pdf_chunked"),
    os.path.join(base_dir, "venues_summer/Full-report-venues-post-games-use-summer.pdf_chunked"),
]
geojson_folder = os.path.join(os.path.dirname(__file__), "03_named_geojsons")

matches = find_matches(geojson_folder, json_folders)

combine_matches(matches, geojson_folder)
