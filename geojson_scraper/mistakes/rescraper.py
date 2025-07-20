import os
import json
import time
import argparse
from bs4 import BeautifulSoup
import requests

# Setup argument parser
parser = argparse.ArgumentParser(description="Re-scrape existing Olympedia venue pages.")
parser.add_argument(
    "-l", "--limit", type=int, default=None,
    help="Limit number of venues to re-scrape (optional)"
)
args = parser.parse_args()

# Directories
input_dir = os.path.join(os.path.dirname(__file__), "scraped_websites")
output_dir = os.path.join(os.path.dirname(__file__), "rescraped_websites")
os.makedirs(output_dir, exist_ok=True)

# Get existing venue IDs
existing_files = [f for f in os.listdir(input_dir) if f.startswith("venue_") and f.endswith(".json")]
venue_ids = sorted([
    int(f.split("_")[1].split(".")[0])
    for f in existing_files
    if f.split("_")[1].split(".")[0].isdigit()
])

# Limit if requested
if args.limit:
    venue_ids = venue_ids[:args.limit]

print(f"🔁 Re-scraping {len(venue_ids)} existing venue pages...\n")

for i in venue_ids:
    url = f"https://www.olympedia.org/venues/{i}"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    container = soup.find("div", class_="container")
    if container is None:
        print(f"⚠️ No container found for {url}, skipping...")
        time.sleep(0.5)
        continue

    biodata_table = container.find("table", class_="biodata")
    biodata = {}

    if biodata_table:
        for row in biodata_table.find_all("tr"):
            th = row.find("th")
            td = row.find("td")
            if th and td:
                key = th.get_text(strip=True).lower().replace(' ', '_')
                value = td.get_text(strip=True)
                if key == "coordinates":
                    if "(" in value and ")" in value:
                        coords_part, trust_part = value.split("(", 1)
                        coords = coords_part.strip().split(",")
                        biodata["coordinates"] = f"{coords[0].strip()},{coords[1].strip()}"
                        biodata["coordinates_trust"] = trust_part.strip("() ").strip()
                    else:
                        biodata["coordinates"] = value.strip()
                        biodata["coordinates_trust"] = "Unknown"
                elif key == "games_capacity":
                    key = "seating_capacity"
                    biodata[key] = value
                elif key == "sports":
                    sport = value.split("/")
                    biodata[key] = sport
                elif key == "games":
                    games = [g.strip() for g in value.split('/') if g.strip()]
                    biodata["games"] = []
                    for game in games:
                        parts = game.split()
                        year = parts[0] if len(parts) > 0 else None
                        season = parts[1] if len(parts) > 1 else None
                        if year and season:
                            biodata["games"].append({"year": year, "season": season})
                elif key in ["english_name", "name", "other_names"]:
                    if "associated_names" not in biodata:
                        biodata["associated_names"] = []
                    biodata["associated_names"].append(value)
                else:
                    biodata[key] = value

    event_table = container.select_one("table.table.table-striped")
    event_data = []

    if event_table:
        for row in event_table.find_all("tr"):
            cols = row.find_all("td")
            if cols:
                data = []
                for col in cols:
                    link = col.find("a")
                    if link:
                        text = link.get_text(strip=True)
                        href = link.get("href")
                        data.append({"text": text, "link": "https://www.olympedia.org" + href})
                    else:
                        data.append({"text": col.get_text(strip=True)})
                event_data.append(data)

    combined = {
        "biodata": biodata,
        "event_data": event_data
    }

    # 🔁 Save to the new folder
    output_path = os.path.join(output_dir, f"venue_{i}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    print(f"✅ Rescraped and saved to: {output_path}")
    time.sleep(0.5)
