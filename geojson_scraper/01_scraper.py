import os
import json
import sys
import time
import random
import argparse
from bs4 import BeautifulSoup
import requests

# Setup argument parser
parser = argparse.ArgumentParser(description="Scrape Olympedia venues.")
parser.add_argument(
    "-n", "--num_iterations", type=int, default=5,
    help="Number of iterations to run (default: 5)"
)
parser.add_argument(
    "-s", "--start", type=int, default=1,
    help="Position where the scraping begins (default: 1)"
)
args = parser.parse_args()

iteration = args.num_iterations + args.start

i = args.start

while i < iteration:
    url = "https://www.olympedia.org/venues/" + str(i)
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    container = soup.find("div", class_="container")
    if container is None:
        print(f"No container found for URL {url}, skipping...")
        i += 1
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
    else:
        i += 1
        time.sleep(3)
        continue

    event_table = container.select_one("table.table.table-striped")
    event_data = []

    if event_table:
        headers = [th.get_text(strip=True) for th in event_table.find("thead").find_all("th")]
        rows = event_table.find_all("tr")[1:]

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

    output_path = os.path.join(os.path.dirname(__file__) + "/01_scraped_websites", "venue_" + str(i) + ".json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    print(f"Data saved to {output_path}")
    i += 1
    time.sleep(0.5)
