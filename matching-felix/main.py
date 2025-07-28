import json
import os
import glob
from venues_matcher import find_stadium_matches

# Module-level variables that can be accessed by all functions
summer_data = None
winter_data = None
geojson_data = {}
output_dir = "combined_geojson"

# Logging configuration
log_to_console = True
log_to_file = True

# Statistics tracking
venue_statistics = {}
total_statistics = {
    'total_venues': 0,
    'sports_matches': 0,
    'name_matches': 0,
    'name_matches_by_method': {
        'exact_match': 0,
        'substring_match': 0,
        'token_match': 0,
        'fuzzy_match': 0
    },
    'unmatched': 0,
    'files_processed': 0
}

# Mapping of Olympics file names to their respective locations
# key format: 'year-season', value format: 'year_location'
# values hold the file name of the existing GeoJSON files
olympics_file_mapping = {
    '1896-summer': '1896_Athens',
    '1900-summer': '1900_Paris',
    '1904-summer': '1904_St._Louis',
    '1908-summer': '1908_London',
    '1912-summer': '1912_Stockholm',
    '1920-summer': '1920_Antwerp',
    '1924-summer': '1924_Paris',
    '1928-summer': '1928_Amsterdam',
    '1932-summer': '1932_Los_Angeles',
    '1936-summer': '1936_Berlin',
    '1948-summer': '1948_London',
    '1952-summer': '1952_Helsinki',
    '1956-summer': '1956_Melbourne',
    '1960-summer': '1960_Rome',
    '1964-summer': '1964_Tokyo',
    '1968-summer': '1968_Mexico_City',
    '1972-summer': '1972_Munich',
    '1976-summer': '1976_Montreal',
    '1980-summer': '1980_Moscow',
    '1984-summer': '1984_Los_Angeles',
    '1988-summer': '1988_Seoul',
    '1992-summer': '1992_Barcelona',
    '1996-summer': '1996_Atlanta',
    '2000-summer': '2000_Sydney',
    '2004-summer': '2004_Athens',
    '2008-summer': '2008_Beijing',
    '2012-summer': '2012_London',
    '2016-summer': '2016_Rio',
    '2020-summer': '2020_Tokyo',

    '1924-winter': '1924_Chamonix',
    '1928-winter': '1928_St._Moritz',
    '1932-winter': '1932_Lake_Placid',
    '1936-winter': '1936_Garmisch_Partenkirchen',
    '1948-winter': '1948_St._Moritz',
    '1952-winter': '1952_Oslo',
    '1956-winter': '1956_Cortina_d_Ampezzo',
    '1960-winter': '1960_Squaw_Valley',
    '1964-winter': '1964_Innsbruck',
    '1968-winter': '1968_Grenoble',
    '1972-winter': '1972_Sapporo',
    '1976-winter': '1976_Innsbruck',
    '1980-winter': '1980_Lake_Placid',
    '1984-winter': '1984_Sarajevo',
    '1988-winter': '1988_Calgary',
    '1992-winter': '1992_Albertville',
    '1994-winter': '1994_Lillehammer',
    '1998-winter': '1998_Nagano',
    '2002-winter': '2002_Salt_Lake_City',
    '2006-winter': '2006_Turin',
    '2010-winter': '2010_Vancouver',
    '2014-winter': '2014_Sochi',
    '2018-winter': '2018_Pyeongchang',
    '2022-winter': '2022_Beijing',
}


def transfer_venue_data(geojson_feature, json_venue, match_type="sports_match", confidence=1.0, match_method=None):
    """
    Transfer important JSON venue data to the associating GeoJSON venue.

    Args:
        geojson_feature (dict): The GeoJSON feature (venue) to update directly
        json_venue (dict): The matched JSON venue data to transfer from
        match_type (str): Type of match ("sports_match" or "name_match")
        confidence (float): Confidence score of the match (for name matches)
        match_method (str): Specific matching method used (for name matches)
    """
    # Ensure properties exist
    if 'properties' not in geojson_feature:
        geojson_feature['properties'] = {}

    # Transfer important venue data from JSON to GeoJSON feature
    properties = geojson_feature['properties']

    # Add match metadata
    properties['match_type'] = match_type
    properties['match_confidence'] = confidence

    # Store the specific matching method for name matches
    if match_method:
        properties['match_method'] = match_method

    # Transfer key venue information from JSON
    if 'name' in json_venue:
        properties['matched_venue_name'] = json_venue['name']

    if 'classification' in json_venue:
        properties['venue_classification'] = json_venue['classification']

    if 'status' in json_venue:
        properties['venue_status'] = json_venue['status']

    if 'use' in json_venue:
        properties['venue_use'] = json_venue['use']

    if 'information' in json_venue:
        properties['venue_information'] = json_venue['information']


def load_venues_data():
    """
    Load the summer and winter venues JSON files into module-level variables.
    """
    global summer_data, winter_data

    # Define the paths relative to the project root
    summer_file_path = os.path.join(
        "..", "pdfToJson", "n8n", "n8n_io", "PDF_summery_v2", "venues_summer",
        "Full-report-venues-post-games-use-summer.pdf.json"
    )

    winter_file_path = os.path.join(
        "..", "pdfToJson", "n8n", "n8n_io", "PDF_summery_v2", "venues_winter",
        "Full-report-venues-post-games-use-winter.pdf.json"
    )

    # Load summer venues data
    try:
        with open(summer_file_path, 'r', encoding='utf-8') as file:
            summer_data = json.load(file)
        log_message(f"Successfully loaded summer venues data from: {summer_file_path}")
    except FileNotFoundError:
        log_message(f"Error: Summer venues file not found at {summer_file_path}", level="ERROR")
        summer_data = None
    except json.JSONDecodeError as e:
        log_message(f"Error: Invalid JSON in summer venues file - {e}", level="ERROR")
        summer_data = None

    # Load winter venues data
    try:
        with open(winter_file_path, 'r', encoding='utf-8') as file:
            winter_data = json.load(file)
        log_message(f"Successfully loaded winter venues data from: {winter_file_path}")
    except FileNotFoundError:
        log_message(f"Error: Winter venues file not found at {winter_file_path}", level="ERROR")
        winter_data = None
    except json.JSONDecodeError as e:
        log_message(f"Error: Invalid JSON in winter venues file - {e}", level="ERROR")
        winter_data = None


def load_geojson_files():
    """
    Load all GeoJSON files from the geojson_scraper/named_geojsons directory
    into the module-level geojson_data variable.
    """
    global geojson_data

    # Define the path to the named_geojsons directory
    geojson_dir = os.path.join("..", "geojson_scraper", "named_geojsons")

    # Get all .geojson files in the directory
    geojson_pattern = os.path.join(geojson_dir, "*.geojson")
    geojson_files = glob.glob(geojson_pattern)

    log_message(f"Found {len(geojson_files)} GeoJSON files in {geojson_dir}")

    for file_path in geojson_files:
        # Get filename without extension
        filename = os.path.splitext(os.path.basename(file_path))[0]

        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                geojson_data[filename] = json.load(file)
            log_message(f"Successfully loaded: {filename}")
        except FileNotFoundError:
            log_message(f"Error: File not found - {file_path}", level="ERROR")
        except json.JSONDecodeError as e:
            log_message(f"Error: Invalid JSON in {filename} - {e}", level="ERROR")
        except Exception as e:
            log_message(f"Error loading {filename}: {e}", level="ERROR")

    log_message(f"Successfully loaded {len(geojson_data)} GeoJSON files")


def manipulate_geojson_file(filename, geojson_content):
    """
    Manipulate a single GeoJSON file based on the filename and content.

    Args:
        filename (str): The filename without extension (e.g., "1896_Athens")
        geojson_content (dict): The original GeoJSON content

    Returns:
        dict: The manipulated GeoJSON content
    """
    global summer_data, winter_data

    # Split filename into year and city
    # Handle different naming patterns like "1896_Athens" or "2022_Beijing"
    parts = filename.split('_', 1)  # Split on first underscore only

    if len(parts) >= 2:
        year = parts[0]
        city = parts[1].replace('_', ' ')  # Replace remaining underscores with spaces
    else:
        # Fallback if filename doesn't follow expected pattern
        year = "Unknown"
        city = filename

    # Determine season using olympics_file_mapping
    season = "Unknown"
    for key, value in olympics_file_mapping.items():
        if value == filename:
            # Extract season from key (e.g., "1896-summer" -> "summer")
            season = key.split('-')[1] if '-' in key else "Unknown"
            break

    log_message(f"  -> Processing {year} {season.capitalize()} Olympics in {city}")

    # Determine which JSON data to use based on season
    json_datum = None
    if season.lower() == "summer":
        json_datum = summer_data
    elif season.lower() == "winter":
        json_datum = winter_data

    # Create a copy of the original content to manipulate
    manipulated_content = geojson_content.copy()

    # Add basic metadata to the GeoJSON
    if 'properties' not in manipulated_content:
        manipulated_content['properties'] = {}

    manipulated_content['properties']['olympics_year'] = year
    manipulated_content['properties']['olympics_city'] = city
    manipulated_content['properties']['olympics_season'] = season
    manipulated_content['properties']['processed_by'] = 'matching-felix'

    # Process venue matching if we have JSON data
    if json_datum and 'data' in json_datum:
        log_message(f"    -> Found {season} JSON data with {len(json_datum['data'])} entries")

        # Find the data for this specific year
        year_data = None
        for entry in json_datum['data']:
            if ('extraction' in entry and
                    'data' in entry['extraction'] and
                    'year' in entry['extraction']['data'] and
                    entry['extraction']['data']['year'] == year):
                year_data = entry['extraction']['data']
                break

        if year_data and 'venues' in year_data:
            log_message(f"    -> Found venue data for {year} with {len(year_data['venues'])} venues")

            # Process each feature (venue) in the GeoJSON
            if 'features' in manipulated_content:
                for feature in manipulated_content['features']:
                    if 'properties' in feature and 'sports' in feature['properties']:
                        venue_sports = feature['properties']['sports']
                        if isinstance(venue_sports, list):
                            log_message(f"      -> Processing venue with sports: {venue_sports}")

                            # Try to find matching venue in JSON data
                            unmatched_venues = []
                            for json_venue in year_data['venues']:
                                if 'use' in json_venue:
                                    # Parse comma-separated sports from JSON venue
                                    json_venue_sports = [sport.strip() for sport in json_venue['use'].split(',')]

                                    # Check if all GeoJSON venue sports are in JSON venue sports
                                    sports_match = all(
                                        any(geojson_sport.lower() in json_sport.lower() or
                                            json_sport.lower() in geojson_sport.lower()
                                            for json_sport in json_venue_sports)
                                        for geojson_sport in venue_sports
                                    )

                                    if sports_match:
                                        transfer_venue_data(feature, json_venue, "sports_match")
                                        log_message(f"        -> Matched with venue: {json_venue.get('name', 'Unknown')}")
                                    else:
                                        # Add unmatched venue with source_file from GeoJSON
                                        source_file = feature['properties'].get('source_file', 'Unknown')
                                        unmatched_venues.append(source_file)

                            # If we have unmatched venues, try to find matches using venue name matching
                            if unmatched_venues:
                                log_message(
                                    f"        -> Found {len(unmatched_venues)} unmatched venues, trying name matching...")

                                # Find the corresponding GeoJSON venues for the unmatched source files
                                unmatched_geojson_venues = []
                                for source_file in unmatched_venues:
                                    # Find venues in current GeoJSON that match this source_file
                                    for geojson_feature in manipulated_content['features']:
                                        if (geojson_feature.get('properties', {}).get('source_file') == source_file and
                                                'associated_names' in geojson_feature.get('properties', {})):
                                            unmatched_geojson_venues.append(geojson_feature['properties'])

                                if unmatched_geojson_venues:
                                    # Use find_stadium_matches to find the best matches
                                    all_matches = find_stadium_matches(
                                        unmatched_geojson_venues,  # GeoJSON venues with associated_names
                                        year_data['venues'],  # JSON venues with name
                                        name_key1='associated_names',  # Key for GeoJSON venue names
                                        name_key2='name',  # Key for JSON venue names
                                        debug=False
                                    )

                                    # Check if we have matches and if the highest score is over threshold
                                    if all_matches:
                                        highest_match = all_matches[0]  # Already sorted by highest score
                                        confidence_threshold = 0.75  # Define minimum confidence threshold == fussy min score match

                                        log_message(
                                            f"        -> Found {len(all_matches)} name matches, highest confidence: {highest_match['confidence']:.2f}")

                                        if highest_match['confidence'] >= confidence_threshold:
                                            log_message(
                                                f"        -> Highest match confidence ({highest_match['confidence']:.2f}) exceeds threshold ({confidence_threshold})")
                                            transfer_venue_data(feature, highest_match['stadium2'], "name_match",
                                                                highest_match['confidence'], highest_match['method'])
                                        else:
                                            log_message(
                                                f"        -> Highest match confidence ({highest_match['confidence']:.2f}) below threshold ({confidence_threshold})")
                                    else:
                                        log_message(f"        -> No name matches found")
                        else:
                            log_message(f"      -> Skipping venue - sports is not a list: {venue_sports}")
        else:
            log_message(f"    -> No venue data found for year {year}")
    else:
        log_message(f"    -> No {season} JSON data available for matching")
    return geojson_content


def process_geojson_data():
    """
    Process all loaded GeoJSON data and save manipulated files to output directory.
    Uses the module-level geojson_data variable directly.
    """
    global output_dir, venue_statistics

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    log_message(f"Output directory '{output_dir}' ready")

    log_message(f"Processing {len(geojson_data)} GeoJSON files...")

    for filename, geojson_content in geojson_data.items():
        log_message(f"Processing: {filename}")

        # Use the new manipulation function
        manipulated_geojson = manipulate_geojson_file(filename, geojson_content)

        # Collect statistics for this file
        file_stats = collect_venue_statistics(filename, manipulated_geojson)
        venue_statistics[filename] = file_stats

        # Print statistics for this file
        print_file_statistics(file_stats)

        # Update total statistics
        update_total_statistics(file_stats)

        # Save the manipulated GeoJSON to output directory
        output_file_path = os.path.join(output_dir, f"{filename}.geojson")

        try:
            with open(output_file_path, 'w', encoding='utf-8') as file:
                json.dump(manipulated_geojson, file, indent=2, ensure_ascii=False)
            log_message(f"  -> Saved manipulated file: {output_file_path}")
        except Exception as e:
            log_message(f"  -> Error saving {filename}: {e}", level="ERROR")

    log_message("Finished processing all GeoJSON files")


def collect_venue_statistics(filename, geojson_content):
    """
    Collect statistics about venue matching for a specific GeoJSON file.

    Args:
        filename (str): The filename without extension
        geojson_content (dict): The processed GeoJSON content

    Returns:
        dict: Statistics for this file
    """
    stats = {
        'filename': filename,
        'total_venues': 0,
        'sports_matches': 0,
        'name_matches': 0,
        'name_matches_by_method': {
            'exact_match': 0,
            'substring_match': 0,
            'token_match': 0,
            'fuzzy_match': 0
        },
        'unmatched': 0
    }

    if 'features' in geojson_content:
        for feature in geojson_content['features']:
            if 'properties' in feature and 'sports' in feature['properties']:
                stats['total_venues'] += 1

                # Check if venue has a match
                match_type = feature['properties'].get('match_type')
                if match_type == 'sports_match':
                    stats['sports_matches'] += 1
                elif match_type == 'name_match':
                    stats['name_matches'] += 1

                    # Track the specific matching method for name matches
                    match_method = feature['properties'].get('match_method')
                    if match_method and match_method in stats['name_matches_by_method']:
                        stats['name_matches_by_method'][match_method] += 1
                else:
                    stats['unmatched'] += 1

    return stats


def update_total_statistics(file_stats):
    """
    Update the global total statistics with data from a processed file.

    Args:
        file_stats (dict): Statistics from a single file
    """
    global total_statistics

    total_statistics['total_venues'] += file_stats['total_venues']
    total_statistics['sports_matches'] += file_stats['sports_matches']
    total_statistics['name_matches'] += file_stats['name_matches']
    total_statistics['unmatched'] += file_stats['unmatched']
    total_statistics['files_processed'] += 1

    # Update name match method counts
    for method, count in file_stats['name_matches_by_method'].items():
        total_statistics['name_matches_by_method'][method] += count


def print_file_statistics(file_stats):
    """
    Print statistics for a single file.

    Args:
        file_stats (dict): Statistics for the file
    """
    filename = file_stats['filename']
    total = file_stats['total_venues']
    sports = file_stats['sports_matches']
    name = file_stats['name_matches']
    unmatched = file_stats['unmatched']

    # Calculate percentages
    sports_pct = (sports / total * 100) if total > 0 else 0
    name_pct = (name / total * 100) if total > 0 else 0
    unmatched_pct = (unmatched / total * 100) if total > 0 else 0

    log_message(f"=== STATISTICS FOR {filename} ===")
    log_message(f"Total venues: {total}")
    log_message(f"Sports matches: {sports} ({sports_pct:.1f}%)")
    log_message(f"Name matches: {name} ({name_pct:.1f}%)")

    # Display name match method breakdown
    if name > 0:
        methods = file_stats['name_matches_by_method']
        for method, count in methods.items():
            if count > 0:
                method_pct = (count / name * 100) if name > 0 else 0
                log_message(f"  - {method}: {count} ({method_pct:.1f}% of name matches)")

    log_message(f"Unmatched: {unmatched} ({unmatched_pct:.1f}%)")
    log_message("=" * 50)


def print_total_statistics():
    """
    Print the total statistics across all processed files.
    """
    global total_statistics

    total = total_statistics['total_venues']
    sports = total_statistics['sports_matches']
    name = total_statistics['name_matches']
    unmatched = total_statistics['unmatched']
    files = total_statistics['files_processed']

    # Calculate percentages
    sports_pct = (sports / total * 100) if total > 0 else 0
    name_pct = (name / total * 100) if total > 0 else 0
    unmatched_pct = (unmatched / total * 100) if total > 0 else 0
    matched_total = sports + name
    matched_pct = (matched_total / total * 100) if total > 0 else 0

    log_message("=" * 60)
    log_message("=== TOTAL STATISTICS ACROSS ALL FILES ===")
    log_message(f"Files processed: {files}")
    log_message(f"Total venues: {total}")
    log_message(f"Sports matches: {sports} ({sports_pct:.1f}%)")
    log_message(f"Name matches: {name} ({name_pct:.1f}%)")

    # Display name match method breakdown for totals
    if name > 0:
        methods = total_statistics['name_matches_by_method']
        for method, count in methods.items():
            if count > 0:
                method_pct = (count / name * 100) if name > 0 else 0
                total_pct = (count / total * 100) if total > 0 else 0
                log_message(f"  - {method}: {count} ({method_pct:.1f}% of name matches, {total_pct:.1f}% of all venues)")

    log_message(f"Total matched: {matched_total} ({matched_pct:.1f}%)")
    log_message(f"Unmatched: {unmatched} ({unmatched_pct:.1f}%)")
    log_message("=" * 60)


def save_statistics_to_file():
    """
    Save the statistics to a JSON file in the output directory.
    """
    global venue_statistics, total_statistics, output_dir

    statistics_data = {
        'total_statistics': total_statistics,
        'file_statistics': venue_statistics,
        'generated_at': __import__('datetime').datetime.now().isoformat()
    }

    stats_file_path = os.path.join(output_dir, "venue_matching_statistics.json")

    try:
        with open(stats_file_path, 'w', encoding='utf-8') as file:
            json.dump(statistics_data, file, indent=2, ensure_ascii=False)
        log_message(f"Statistics saved to: {stats_file_path}")
    except Exception as e:
        log_message(f"Error saving statistics: {e}", level="ERROR")


def log_message(message, level="INFO"):
    """
    Log a message to console and/or file based on global configuration.

    Args:
        message (str): The message to log
        level (str): Log level (INFO, ERROR, WARNING, etc.)
    """
    global log_to_console, log_to_file, output_dir

    # Format the message with timestamp and level
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_message = f"[{timestamp}] {level}: {message}"

    # Log to console if enabled
    if log_to_console:
        print(formatted_message)

    # Log to file if enabled
    if log_to_file:
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Create log file path
        log_file_path = os.path.join(output_dir, "matching_log.txt")

        try:
            with open(log_file_path, 'a', encoding='utf-8') as log_file:
                log_file.write(formatted_message + '\n')
        except Exception as e:
            # Fallback to console if file logging fails
            if not log_to_console:
                print(f"[{timestamp}] ERROR: Failed to write to log file: {e}")
                print(formatted_message)


if __name__ == "__main__":
    # Example usage
    load_venues_data()

    if summer_data:
        log_message(
            f"Summer venues data loaded with {len(summer_data) if isinstance(summer_data, (list, dict)) else 'unknown'} items")

    if winter_data:
        log_message(
            f"Winter venues data loaded with {len(winter_data) if isinstance(winter_data, (list, dict)) else 'unknown'} items")

    # Load GeoJSON files
    load_geojson_files()

    if geojson_data:
        log_message(f"GeoJSON data loaded for {len(geojson_data)} files")

    # Process GeoJSON data (this now includes statistics collection for each file)
    process_geojson_data()

    # Print total statistics across all files
    print_total_statistics()

    # Save statistics to file
    save_statistics_to_file()
