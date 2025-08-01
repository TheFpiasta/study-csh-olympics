import json
import os
import glob
from venues_matcher import find_stadium_matches

# Module-level variables that can be accessed by all functions
summer_data = None
winter_data = None
geojson_data = {}
output_dir = "combined_geojson_less_stages_less_array"

# Logging configuration
log_to_console = False
log_to_file = True
log_file = "matching.log"

# Statistics tracking
venue_statistics = {}
total_statistics = {
    'total_venues': 0,
    'geojson': {
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
    },
    'json': {
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
    },
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
        except FileNotFoundError:
            log_message(f"Error: File not found - {file_path}", level="ERROR")
        except json.JSONDecodeError as e:
            log_message(f"Error: Invalid JSON in {filename} - {e}", level="ERROR")
        except Exception as e:
            log_message(f"Error loading {filename}: {e}", level="ERROR")


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

    log_message(f"Processing {year} {season.capitalize()} Olympics in {city}")

    # Determine which JSON data to use based on season
    json_datum = None
    if season.lower() == "summer":
        json_datum = summer_data
    elif season.lower() == "winter":
        json_datum = winter_data

    # Create a copy of the original content to manipulate
    manipulated_content = geojson_content.copy()

    transfer_olympic_year_data(city, manipulated_content, season, year)

    # Process venue matching if we have JSON data
    if json_datum and 'data' in json_datum:
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
            # Process each feature (venue) in the GeoJSON
            if 'features' in manipulated_content:
                for feature in manipulated_content['features']:
                    if 'properties' in feature and 'sports' in feature['properties']:
                        venue_sports = feature['properties']['sports']
                        if isinstance(venue_sports, list):
                            # Try to find matching venue in JSON data
                            unmatched_venues = []
                            match_by_sports(feature, unmatched_venues, venue_sports, year_data)

                            # If we have unmatched venues, try to find matches using venue name matching
                            if unmatched_venues:
                                match_by_venues(feature, manipulated_content, unmatched_venues, year_data)
    return manipulated_content


def transfer_olympic_year_data(city, manipulated_content, season, year):
    # Add basic metadata to the GeoJSON
    if 'properties' not in manipulated_content:
        manipulated_content['properties'] = {}
    manipulated_content['properties']['olympics_year'] = year
    manipulated_content['properties']['olympics_city'] = city
    manipulated_content['properties']['olympics_season'] = season


def match_by_venues(feature, manipulated_content, unmatched_venues, year_data):
    """
    Match unmatched venues by name using the find_stadium_matches function.
    This function looks for venues in the GeoJSON that match the source files of unmatched venues
    and transfers the matched data to the GeoJSON feature.

    :param feature: the GeoJSON feature to update
    :param manipulated_content: the manipulated GeoJSON content
    :param unmatched_venues: list of unmatched venue source files from GeoJSON
    :param year_data: the JSON data for the specific year containing venue information
    :return: None
    """

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
            debug=False,
            loglevel="ERROR",
        )

        # Check if we have matches and if the highest score is over threshold
        if all_matches:
            highest_match = all_matches[0]  # Already sorted by highest score
            confidence_threshold = 0.75  # Define minimum confidence threshold == fussy min score match

            # Get both venue names and sports information
            geojson_venue_name = highest_match['stadium1'].get('associated_names',
                                                               'Unknown')
            json_venue_name = highest_match['stadium2'].get('name', 'Unknown')
            # Get sports from the original feature (since highest_match['stadium1'] might not have sports)
            sports = feature['properties'].get('sports', [])
            sports_str = ', '.join(sports) if isinstance(sports, list) else str(sports)
            match_method = highest_match.get('method', 'Unknown')
            confidence = highest_match.get('confidence', 'Unknown')

            if highest_match['confidence'] >= confidence_threshold:
                transfer_venue_data(feature, highest_match['stadium2'], "name_match",
                                    highest_match['confidence'], highest_match['method'])
                log_message(
                    f"Name match: Confidence: {confidence:.2f}, Method: {match_method} | JSON venue '{json_venue_name}' <-> GeoJSON venue {geojson_venue_name} | Sports: {sports_str}")
            else:
                log_message(
                    f"Unmatch: Confidence: ({confidence:.2f}), Method: {match_method} | JSON venue '{json_venue_name}' <-> GeoJSON venue {geojson_venue_name} | Sports: {sports_str}",
                    level="WARNING")


def match_by_sports(feature, unmatched_venues, venue_sports, year_data):
    """
    Match GeoJSON venue sports with JSON venue sports.
    This function checks if the sports associated with a GeoJSON venue
    match any of the sports listed in the JSON venue data for the same year.

    :param feature: the GeoJSON feature (venue) to update
    :param unmatched_venues: list to store unmatched venue source files
    :param venue_sports: the sports associated with the GeoJSON venue
    :param year_data: the JSON data for the specific year containing venue information
    :return: None
    """

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
                geojson_venue_name = feature['properties'].get('associated_names', 'Unknown')
                json_venue_name = json_venue.get('name', 'Unknown')
                sports_str = ', '.join(venue_sports) if isinstance(venue_sports, list) else str(
                    venue_sports)
                log_message(
                    f"Sport match: JSON venue {json_venue_name} <-> GeoJSON venue {geojson_venue_name} | Sports json: {sports_str}, Sports geojson: {', '.join(venue_sports)}")
            else:
                # Add unmatched venue with source_file from GeoJSON
                source_file = feature['properties'].get('source_file', 'Unknown')
                unmatched_venues.append(source_file)


def process_geojson_data():
    """
    Process all loaded GeoJSON data and save manipulated files to output directory.
    Uses the module-level geojson_data variable directly.
    """
    global output_dir, venue_statistics

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    for filename, geojson_content in geojson_data.items():
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
        except Exception as e:
            log_message(f"Error saving {filename}: {e}", level="ERROR")

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
    global summer_data, winter_data

    stats = {
        'filename': filename,
        'total_venues': 0,
        'geojson': {
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
            'unmatched_venues': []  # List of unmatched GeoJSON venues
        },
        'json': {
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
            'unmatched_venues': []  # List of unmatched JSON venues
        }
    }

    # Collect GeoJSON venue statistics
    if 'features' in geojson_content:
        for feature in geojson_content['features']:
            if 'properties' in feature and 'sports' in feature['properties']:
                stats['total_venues'] += 1
                stats['geojson']['total_venues'] += 1

                # Check if venue has a match
                match_type = feature['properties'].get('match_type')
                if match_type == 'sports_match':
                    stats['geojson']['sports_matches'] += 1
                elif match_type == 'name_match':
                    stats['geojson']['name_matches'] += 1

                    # Track the specific matching method for name matches
                    match_method = feature['properties'].get('match_method')
                    if match_method and match_method in stats['geojson']['name_matches_by_method']:
                        stats['geojson']['name_matches_by_method'][match_method] += 1
                else:
                    stats['geojson']['unmatched'] += 1
                    # Add unmatched GeoJSON venue to the list
                    geojson_venue_info = {
                        'name': feature['properties'].get('associated_names', 'Unknown'),
                        'sports': feature['properties'].get('sports', [])
                    }
                    stats['geojson']['unmatched_venues'].append(geojson_venue_info)

    # Collect JSON venue statistics for this file
    # Determine year and season from filename to find corresponding JSON data
    parts = filename.split('_', 1)
    if len(parts) >= 2:
        year = parts[0]

        # Determine season
        season = "Unknown"
        for key, value in olympics_file_mapping.items():
            if value == filename:
                season = key.split('-')[1] if '-' in key else "Unknown"
                break

        # Get JSON data based on season
        json_datum = None
        if season.lower() == "summer":
            json_datum = summer_data
        elif season.lower() == "winter":
            json_datum = winter_data

        # Find all JSON venues and categorize them
        if json_datum and 'data' in json_datum:
            for entry in json_datum['data']:
                if ('extraction' in entry and
                        'data' in entry['extraction'] and
                        'year' in entry['extraction']['data'] and
                        entry['extraction']['data']['year'] == year):
                    year_data = entry['extraction']['data']

                    if 'venues' in year_data:
                        # Get list of matched JSON venue names from GeoJSON features
                        matched_json_names = set()
                        matched_json_venues_by_type = {
                            'sports_match': set(),
                            'name_match': set()
                        }

                        for feature in geojson_content.get('features', []):
                            if 'properties' in feature and 'matched_venue_name' in feature['properties']:
                                venue_name = feature['properties']['matched_venue_name']
                                match_type = feature['properties'].get('match_type')
                                matched_json_names.add(venue_name)

                                if match_type in matched_json_venues_by_type:
                                    matched_json_venues_by_type[match_type].add(venue_name)

                        # Count all JSON venues and categorize them
                        for json_venue in year_data['venues']:
                            venue_name = json_venue.get('name', 'Unknown')
                            stats['total_venues'] += 1
                            stats['json']['total_venues'] += 1

                            if venue_name in matched_json_venues_by_type['sports_match']:
                                stats['json']['sports_matches'] += 1
                            elif venue_name in matched_json_venues_by_type['name_match']:
                                stats['json']['name_matches'] += 1

                                # Find the match method for this JSON venue
                                for feature in geojson_content.get('features', []):
                                    if (feature.get('properties', {}).get('matched_venue_name') == venue_name and
                                            feature.get('properties', {}).get('match_type') == 'name_match'):
                                        match_method = feature.get('properties', {}).get('match_method')
                                        if match_method and match_method in stats['json']['name_matches_by_method']:
                                            stats['json']['name_matches_by_method'][match_method] += 1
                                        break
                            else:
                                # Unmatched JSON venue
                                stats['json']['unmatched'] += 1

                                # Extract sports from 'use' field and convert to list format
                                use_field = json_venue.get('use', 'Unknown')
                                if use_field != 'Unknown':
                                    sports = [sport.strip() for sport in use_field.split(',')]
                                else:
                                    sports = []

                                unmatched_json_venue_info = {
                                    'name': venue_name,
                                    'sports': sports
                                }
                                stats['json']['unmatched_venues'].append(unmatched_json_venue_info)
                    break

    return stats


def update_total_statistics(file_stats):
    """
    Update the global total statistics with data from a processed file.

    Args:
        file_stats (dict): Statistics from a single file
    """
    global total_statistics

    # Update total statistics
    total_statistics['total_venues'] += file_stats['total_venues']
    total_statistics['geojson']['total_venues'] += file_stats['geojson']['total_venues']
    total_statistics['json']['total_venues'] += file_stats['json']['total_venues']

    total_statistics['geojson']['sports_matches'] += file_stats['geojson']['sports_matches']
    total_statistics['json']['sports_matches'] += file_stats['json']['sports_matches']

    total_statistics['geojson']['name_matches'] += file_stats['geojson']['name_matches']
    total_statistics['json']['name_matches'] += file_stats['json']['name_matches']

    total_statistics['geojson']['unmatched'] += file_stats['geojson']['unmatched']
    total_statistics['json']['unmatched'] += file_stats['json']['unmatched']

    total_statistics['files_processed'] += 1

    # Update name match method counts by source
    for method, count in file_stats['geojson']['name_matches_by_method'].items():
        if method in total_statistics['geojson']['name_matches_by_method']:
            total_statistics['geojson']['name_matches_by_method'][method] += count

    for method, count in file_stats['json']['name_matches_by_method'].items():
        if method in total_statistics['json']['name_matches_by_method']:
            total_statistics['json']['name_matches_by_method'][method] += count


def print_file_statistics(file_stats):
    """
    Print statistics for a single file.

    Args:
        file_stats (dict): Statistics for the file
    """
    filename = file_stats['filename']
    total = file_stats['total_venues']

    # Calculate combined statistics from both geojson and json sources
    sports_geojson = file_stats['geojson']['sports_matches']
    sports_json = file_stats['json']['sports_matches']
    name_geojson = file_stats['geojson']['name_matches']
    name_json = file_stats['json']['name_matches']
    unmatched_geojson = file_stats['geojson']['unmatched']
    unmatched_json = file_stats['json']['unmatched']

    # Individual totals
    total_geojson = file_stats['geojson']['total_venues']
    total_json = file_stats['json']['total_venues']

    # Combined totals
    sports = sports_geojson + sports_json
    name = name_geojson + name_json
    unmatched = unmatched_geojson + unmatched_json

    # Calculate combined percentages
    sports_pct = (sports / total * 100) if total > 0 else 0
    name_pct = (name / total * 100) if total > 0 else 0
    unmatched_pct = (unmatched / total * 100) if total > 0 else 0

    # Calculate GeoJSON percentages
    sports_geojson_pct = (sports_geojson / total_geojson * 100) if total_geojson > 0 else 0
    name_geojson_pct = (name_geojson / total_geojson * 100) if total_geojson > 0 else 0
    unmatched_geojson_pct = (unmatched_geojson / total_geojson * 100) if total_geojson > 0 else 0

    # Calculate JSON percentages
    sports_json_pct = (sports_json / total_json * 100) if total_json > 0 else 0
    name_json_pct = (name_json / total_json * 100) if total_json > 0 else 0
    unmatched_json_pct = (unmatched_json / total_json * 100) if total_json > 0 else 0

    log_message("")
    log_message(f"=== STATISTICS FOR {filename} ===")
    log_message(f"Total venues: {total}")
    log_message(f"  - GeoJSON venues: {total_geojson}")
    log_message(f"  - JSON venues: {total_json}")

    log_message("")
    log_message(f"Sports matches: {sports} ({sports_pct:.1f}%)")
    log_message(f"  - GeoJSON: {sports_geojson} ({sports_geojson_pct:.1f}% of GeoJSON venues)")
    log_message(f"  - JSON: {sports_json} ({sports_json_pct:.1f}% of JSON venues)")

    log_message("")
    log_message(f"Name matches: {name} ({name_pct:.1f}%)")
    log_message(f"  - GeoJSON: {name_geojson} ({name_geojson_pct:.1f}% of GeoJSON venues)")
    log_message(f"  - JSON: {name_json} ({name_json_pct:.1f}% of JSON venues)")

    # Display name match method breakdown
    if name > 0:
        # Combine methods from both geojson and json sources
        combined_methods = {}
        for method in file_stats['geojson']['name_matches_by_method']:
            geojson_count = file_stats['geojson']['name_matches_by_method'][method]
            json_count = file_stats['json']['name_matches_by_method'][method]
            combined_methods[method] = geojson_count + json_count

        for method, count in combined_methods.items():
            if count > 0:
                method_pct = (count / name * 100) if name > 0 else 0
                geojson_method_count = file_stats['geojson']['name_matches_by_method'][method]
                json_method_count = file_stats['json']['name_matches_by_method'][method]
                log_message(f"  - {method}: {count} ({method_pct:.1f}% of name matches)")
                log_message(f"    • GeoJSON: {geojson_method_count}, JSON: {json_method_count}")

    log_message("")
    log_message(f"Unmatched: {unmatched} ({unmatched_pct:.1f}%)")
    log_message(f"  - GeoJSON: {unmatched_geojson} ({unmatched_geojson_pct:.1f}% of GeoJSON venues)")
    log_message(f"  - JSON: {unmatched_json} ({unmatched_json_pct:.1f}% of JSON venues)")

    # Display detailed unmatched venue information
    if unmatched_geojson > 0:
        log_message("")
        log_message(f"Unmatched GeoJSON venues:")
        for venue in file_stats['geojson']['unmatched_venues']:
            sports_str = ', '.join(venue.get('sports', [])) if isinstance(venue.get('sports'), list) else str(
                venue.get('sports', 'Unknown'))
            log_message(f"  - {venue.get('name', 'Unknown')} (Sports: {sports_str})")

    if unmatched_json > 0:
        log_message("")
        log_message(f"Unmatched JSON venues:")
        for venue in file_stats['json']['unmatched_venues']:
            sports_str = ', '.join(venue.get('sports', [])) if isinstance(venue.get('sports'), list) else str(
                venue.get('sports', 'Unknown'))
            log_message(f"  - {venue.get('name', 'Unknown')} (Sports: {sports_str})")

    log_message("=" * 50)
    log_message("")
    log_message("")


def print_total_statistics():
    """
    Print the total statistics across all processed files.
    """
    global total_statistics

    total = total_statistics['total_venues']
    files = total_statistics['files_processed']

    # Calculate combined statistics from both geojson and json sources
    sports_geojson = total_statistics['geojson']['sports_matches']
    sports_json = total_statistics['json']['sports_matches']
    name_geojson = total_statistics['geojson']['name_matches']
    name_json = total_statistics['json']['name_matches']
    unmatched_geojson = total_statistics['geojson']['unmatched']
    unmatched_json = total_statistics['json']['unmatched']

    # Individual totals
    total_geojson = total_statistics['geojson']['total_venues']
    total_json = total_statistics['json']['total_venues']

    # Combined totals
    sports = sports_geojson + sports_json
    name = name_geojson + name_json
    unmatched = unmatched_geojson + unmatched_json

    # Calculate combined percentages
    sports_pct = (sports / total * 100) if total > 0 else 0
    name_pct = (name / total * 100) if total > 0 else 0
    unmatched_pct = (unmatched / total * 100) if total > 0 else 0
    matched_total = sports + name
    matched_pct = (matched_total / total * 100) if total > 0 else 0

    # Calculate GeoJSON percentages
    sports_geojson_pct = (sports_geojson / total_geojson * 100) if total_geojson > 0 else 0
    name_geojson_pct = (name_geojson / total_geojson * 100) if total_geojson > 0 else 0
    unmatched_geojson_pct = (unmatched_geojson / total_geojson * 100) if total_geojson > 0 else 0
    matched_geojson_total = sports_geojson + name_geojson
    matched_geojson_pct = (matched_geojson_total / total_geojson * 100) if total_geojson > 0 else 0

    # Calculate JSON percentages
    sports_json_pct = (sports_json / total_json * 100) if total_json > 0 else 0
    name_json_pct = (name_json / total_json * 100) if total_json > 0 else 0
    unmatched_json_pct = (unmatched_json / total_json * 100) if total_json > 0 else 0
    matched_json_total = sports_json + name_json
    matched_json_pct = (matched_json_total / total_json * 100) if total_json > 0 else 0

    log_message("")
    log_message("=" * 60)
    log_message("=== TOTAL STATISTICS ACROSS ALL FILES ===")
    log_message(f"Files processed: {files}")
    log_message(f"Total venues: {total}")
    log_message(f"  - GeoJSON venues: {total_geojson}")
    log_message(f"  - JSON venues: {total_json}")

    log_message("")
    log_message(f"Sports matches: {sports} ({sports_pct:.1f}%)")
    log_message(f"  - GeoJSON: {sports_geojson} ({sports_geojson_pct:.1f}% of GeoJSON venues)")
    log_message(f"  - JSON: {sports_json} ({sports_json_pct:.1f}% of JSON venues)")

    log_message("")
    log_message(f"Name matches: {name} ({name_pct:.1f}%)")
    log_message(f"  - GeoJSON: {name_geojson} ({name_geojson_pct:.1f}% of GeoJSON venues)")
    log_message(f"  - JSON: {name_json} ({name_json_pct:.1f}% of JSON venues)")

    # Display name match method breakdown for totals
    if name > 0:
        # Combine methods from both geojson and json sources
        combined_methods = {}
        for method in total_statistics['geojson']['name_matches_by_method']:
            geojson_count = total_statistics['geojson']['name_matches_by_method'][method]
            json_count = total_statistics['json']['name_matches_by_method'][method]
            combined_methods[method] = geojson_count + json_count

        for method, count in combined_methods.items():
            if count > 0:
                method_pct = (count / name * 100) if name > 0 else 0
                total_pct = (count / total * 100) if total > 0 else 0
                geojson_method_count = total_statistics['geojson']['name_matches_by_method'][method]
                json_method_count = total_statistics['json']['name_matches_by_method'][method]
                log_message(
                    f"  - {method}: {count} ({method_pct:.1f}% of name matches, {total_pct:.1f}% of all venues)")
                log_message(f"    • GeoJSON: {geojson_method_count}, JSON: {json_method_count}")

    log_message("")
    log_message(f"Total matched: {matched_total} ({matched_pct:.1f}%)")
    log_message(f"  - GeoJSON matched: {matched_geojson_total} ({matched_geojson_pct:.1f}% of GeoJSON venues)")
    log_message(f"  - JSON matched: {matched_json_total} ({matched_json_pct:.1f}% of JSON venues)")

    log_message("")
    log_message(f"Unmatched: {unmatched} ({unmatched_pct:.1f}%)")
    log_message(f"  - GeoJSON: {unmatched_geojson} ({unmatched_geojson_pct:.1f}% of GeoJSON venues)")
    log_message(f"  - JSON: {unmatched_json} ({unmatched_json_pct:.1f}% of JSON venues)")
    log_message("=" * 60 + "")
    log_message("")
    log_message("")


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
    global log_to_console, log_to_file, output_dir, log_file

    # Format the message with timestamp (time only) and level
    from datetime import datetime
    timestamp = datetime.now().strftime("%H:%M:%S")
    formatted_message = f"[{timestamp}] {level}: {message}"

    # Log to console if enabled
    if log_to_console:
        print(formatted_message)

    # Log to file if enabled
    if log_to_file:
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Create log file path
        log_file_path = os.path.join(output_dir, log_file)

        try:
            with open(log_file_path, 'a', encoding='utf-8') as log_file_handle:
                log_file_handle.write(formatted_message + '\n')
        except Exception as e:
            # Fallback to console if file logging fails
            if not log_to_console:
                timestamp_full = datetime.now().strftime("%H:%M:%S")
                print(f"[{timestamp_full}] ERROR: Failed to write to log file: {e}")
                print(formatted_message)


def initialize_log_file():
    """
    Initialize the log file by overwriting any existing content.
    This ensures each run starts with a fresh log file.
    """
    global log_to_file, output_dir, log_file

    if log_to_file:
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Create log file path
        log_file_path = os.path.join(output_dir, log_file)

        try:
            # Overwrite the log file to start fresh
            with open(log_file_path, 'w', encoding='utf-8') as log_file_handle:
                from datetime import datetime
                execution_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                log_file_handle.write(f"Execution Date: {execution_date}\n\n")
                log_file_handle.write("=" * 50 + "\n")
                log_file_handle.write("Starting new matching run - log file overwritten\n")
                log_file_handle.write("=" * 50 + "\n\n")
        except Exception as e:
            print(f"ERROR: Failed to initialize log file: {e}")


if __name__ == "__main__":
    # Initialize log file (overwrite previous content)
    initialize_log_file()

    # Log the start of the new run
    log_message("Starting venue matching process")

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
