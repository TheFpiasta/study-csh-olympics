import os
import json
import time
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
# TODO stop if extra_iterations reach 10
extra_iteration = 0
i = args.start

while i < iteration + extra_iteration:
    url = "https://www.olympedia.org/venues/" + str(i)
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    container = soup.find("div", class_="container")
    if container is None:
        print(f"No container found for URL {url}, skipping...")
        extra_iteration += 1
        i += 1
        time.sleep(3)
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
                    # Split the value into coordinate and trust part
                    if "(" in value and ")" in value:
                        coords_part, trust_part = value.split("(", 1)
                        coords = coords_part.strip().split(",")
                        biodata["coordinates"] = f"{coords[0].strip()},{coords[1].strip()}"
                        biodata["coordinates_trust"] = trust_part.strip("() ").strip()
                    else:
                        # Fallback if no trust part is present
                        biodata["coordinates"] = value.strip()
                        biodata["coordinates_trust"] = "Unknown"
                elif key == "games_capacity":
                    key = "seating_capacity"
                    biodata[key] = value
                elif key == "sports":
                    sport = value.split("/")
                    biodata[key] = sport
                elif key == "games":
                    entries = value.split()
                    biodata["year"] = entries[0]
                    biodata["season"] = entries[1]
                elif key in ["english_name", "name", "other_names"]:
                    if "associated_names" not in biodata:
                        biodata["associated_names"] = []
                    biodata["associated_names"].append(value)                
                else:
                    biodata[key] = value
    else:
        extra_iteration += 1
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

    output_path = os.path.join(os.path.dirname(__file__), "venue_" + str(i) + ".json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    print(f"Data saved to {output_path}")
    i += 1
    time.sleep(3)
