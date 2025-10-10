import glob
import json
import os

summer_data = None
winter_data = None
geojson_data = {}

def load_geojson_files():
    """
    Load all GeoJSON files from the geojson_scraper/named_geojsons directory
    into the module-level geojson_data variable.
    """
    global geojson_data

    # Define the path to the named_geojsons directory
    geojson_dir = os.path.join("../..", "geojson_scraper", "named_geojsons")

    # Get all .geojson files in the directory
    geojson_pattern = os.path.join(geojson_dir, "*.geojson")
    geojson_files = glob.glob(geojson_pattern)

    for file_path in geojson_files:
        # Get filename without extension
        filename = os.path.splitext(os.path.basename(file_path))[0]

        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                geojson_data[filename] = json.load(file)
        except FileNotFoundError:
            print(f"Error: File not found - {file_path}")
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in {filename} - {e}")
        except Exception as e:
            print(f"Error loading {filename}: {e}")

def load_venues_data():
    """
    Load the summer and winter venues JSON files into module-level variables.
    """
    global summer_data, winter_data

    # Define the paths relative to the project root
    summer_file_path = os.path.join(
        "../..", "pdfToJson", "n8n", "n8n_io", "PDF_summery_v2", "venues_summer",
        "Full-report-venues-post-games-use-summer.pdf.json"
    )

    winter_file_path = os.path.join(
        "../..", "pdfToJson", "n8n", "n8n_io", "PDF_summery_v2", "venues_winter",
        "Full-report-venues-post-games-use-winter.pdf.json"
    )

    # Load summer venues data
    try:
        with open(summer_file_path, 'r', encoding='utf-8') as file:
            summer_data = json.load(file)
    except FileNotFoundError:
        print(f"Error: Summer venues file not found at {summer_file_path}")
        summer_data = None
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in summer venues file - {e}")
        summer_data = None

    # Load winter venues data
    try:
        with open(winter_file_path, 'r', encoding='utf-8') as file:
            winter_data = json.load(file)
    except FileNotFoundError:
        print(f"Error: Winter venues file not found at {winter_file_path}")
        winter_data = None
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in winter venues file - {e}")
        winter_data = None


def extract_all_venues_names(outputFile):
    """
    Extract all venue names from the loaded summer, winter data and geojson data.
    And saves them to a file.

    :param outputFile:  Path to the output file where venue names will be saved.
    :return: A set of all unique venue names extracted
    """

    global summer_data, winter_data, geojson_data

    # Set to store unique venue names
    all_venues = set()

    # Extract venue names from summer data
    if summer_data:
        for olympic_games in summer_data.get('data', []):
            extraction = olympic_games.get('extraction', {})
            data = extraction.get('data', {})
            venues = data.get('venues', [])

            for venue in venues:
                venue_name = venue.get('name')
                if venue_name:
                    all_venues.add(venue_name)

    # Extract venue names from winter data
    if winter_data:
        for olympic_games in winter_data.get('data', []):
            extraction = olympic_games.get('extraction', {})
            data = extraction.get('data', {})
            venues = data.get('venues', [])

            for venue in venues:
                venue_name = venue.get('name')
                if venue_name:
                    all_venues.add(venue_name)

    # Extract venue names from geojson data
    for geojson_file, geojson in geojson_data.items():
        features = geojson.get('features', [])

        for feature in features:
            properties = feature.get('properties', {})
            associated_names = properties.get('associated_names', [])

            # Add all associated names to the set
            for name in associated_names:
                if name and name != "":  # Skip empty names
                    all_venues.add(name)

    # Write all venue names to the output file
    with open(outputFile, 'w', encoding='utf-8') as f:
        for venue in sorted(all_venues):
            f.write(f"{venue}\n")

    print(f"Extracted {len(all_venues)} unique venue names to {outputFile}")
    return all_venues


if __name__ == "__main__":
    # Example usage
    load_venues_data()

    # Load GeoJSON files
    load_geojson_files()

    extract_all_venues_names("venues.txt")
