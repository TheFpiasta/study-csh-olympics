import re
from difflib import SequenceMatcher
import json
import os
from collections import defaultdict

def normalize(text):
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
    expanded_use = sorted(set([normalize(u) for u in expanded_use]))
    sports_items = sorted(set([normalize(s) for s in sports_list]))

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

# === Load JSON extracted data ===
base_dir = os.path.join(os.path.dirname(__file__), "../pdfToJson/n8n/n8n_io/PDF_summery_v2")
json_path = os.path.join(base_dir, "venues_winter/Full-report-venues-post-games-use-winter.pdf_chunked/05_ST._MORITZ_1948_VENUES.pdf.json")
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

json_venues = data[0]["extraction"]["data"]["venues"]

# === Load GeoJSON data ===
geojson_path = os.path.join(os.path.dirname(__file__), "./named_geojsons/1948_St._Moritz.geojson")
with open(geojson_path, "r", encoding="utf-8") as f:
    geojson = json.load(f)

geojson_venues = geojson["features"]

# === Perform Matching ===
def extract_normalized_name_parts(name):
    if not name:
        return set()
    name = name.strip()
    parts = re.split(r'\s*/\s*', name) if '/' in name else [name]
    return {normalize(p) for p in parts if p}

# === Prepare and Normalize All Names ===
json_name_parts_list = [extract_normalized_name_parts(v.get("name", "")) for v in json_venues]
geojson_name_parts_list = [
    extract_normalized_name_parts(f["properties"].get("associated_names", [""])[0])
    for f in geojson_venues
]

matched_json_parts = [set() for _ in json_venues]  # Track matched name parts per JSON venue
matched_json = set()
matched_geo = set()
final_matches = []

for i, json_parts in enumerate(json_name_parts_list):
    for part in json_parts:
        if part in matched_json_parts[i]:
            continue  # already matched this part
        for j, geo_parts in enumerate(geojson_name_parts_list):
            if j in matched_geo:
                continue  # this geo venue already matched
            if part in geo_parts:
                matched_json_parts[i].add(part)
                matched_geo.add(j)
                matched_json.add(i)
                json_name = json_venues[i].get("name", "Unnamed")
                geo_name = geojson_venues[j]["properties"].get("associated_names", ["Unnamed"])[0]
                print(f"[Part Name Match] JSON Venue {i} '{json_name}' matched with GeoJSON Venue {j}: {geo_name}")
                final_matches.append((i, j, 1.0, 1.0, 1.0))
                break  # move to next part after a match


# === Compute All Possible Use/Sport and Name Matches ===
all_candidates = []

for i, venue in enumerate(json_venues):
    if i in matched_json:
        continue

    use_list = [u.strip().lower() for u in venue.get("use", "").split(",") if u.strip()]
    json_name = normalize(venue.get("name", ""))

    for j, feature in enumerate(geojson_venues):
        if j in matched_geo:
            continue

        sports_list = feature["properties"].get("sports", [])
        geo_name = normalize(feature["properties"].get("associated_names", [""])[0])

        use_sim, _, _ = score_match(use_list, sports_list)
        name_sim = similar(json_name, geo_name)

        final_score = 0.7 * use_sim + 0.3 * name_sim
        all_candidates.append((final_score, use_sim, name_sim, i, j))

# === Sort Matches by Best Score ===
all_candidates.sort(reverse=True, key=lambda x: x[0])

# === Greedily Pick Best Non-Conflicting Matches ===
for final_score, use_sim, name_sim, i, j in all_candidates:
    if i in matched_json or j in matched_geo:
        continue
    if final_score < 0.55:
        continue  # Too weak

    matched_json.add(i)
    matched_geo.add(j)
    final_matches.append((i, j, use_sim, name_sim, final_score))
    json_name = json_venues[i].get("name", "Unnamed")
    geo_name = geojson_venues[j]["properties"].get("associated_names", ["Unnamed"])[0]
    verdict = "✅ (strong name)" if name_sim > 0.5 else "🟡 (weak name)"
    print(f"[Use/Sport + Name Match] JSON Venue {i} - {json_name} ↔ GeoJSON Venue {j} - {geo_name} | UseSim: {use_sim:.2f}, NameSim: {name_sim:.2f}, Score: {final_score:.2f} | Match: {verdict}")

# === Print Unmatched ===
print("\n--- Unmatched JSON Venues ---")
for i, venue in enumerate(json_venues):
    if i not in matched_json:
        print(f"[JSON Venue {i}] '{venue.get('name', 'Unnamed')}' has no matching GeoJSON venue.")

print("\n--- Unmatched GeoJSON Venues ---")
for j, feature in enumerate(geojson_venues):
    if j not in matched_geo:
        print(f"[GeoJSON Venue {j}] '{feature['properties'].get('associated_names', ['Unnamed'])[0]}' has no matching JSON venue.")