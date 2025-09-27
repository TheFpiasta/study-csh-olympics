#!/usr/bin/env python3
"""
Convert GeoNames cities15000.txt file to structured JSON format.

This script processes the tab-separated cities15000.txt file from GeoNames
and converts it to JSON format with properly typed fields.

Usage:
    python3 txtToJson.py [format] [input_file]

    format: "structured" | "compact" | "columnar" | "all" (default: all)
    input_file: path to cities15000.txt (default: cities15000.txt)

Examples:
    python3 txtToJson.py                    # Create all formats from cities15000.txt
    python3 txtToJson.py compact            # Create only compact format
    python3 txtToJson.py cities15000.txt    # Create all formats from specified file
    python3 txtToJson.py structured cities15000.txt  # Create structured format only

Output formats:
1. Structured (cities15000.json): Nested objects with meaningful field names
2. Compact (cities15000_compact.json): Array format with keys and data arrays
3. Columnar (cities15000_columnar.json): Column-oriented format with field arrays
"""

import json
import sys
from typing import Dict, List, Any, Optional


def safe_int(value: str) -> Optional[int]:
    """Safely convert string to integer, returning None for empty strings."""
    if not value or value.strip() == "":
        return None
    try:
        return int(value)
    except ValueError:
        return None


def safe_float(value: str) -> Optional[float]:
    """Safely convert string to float, returning None for empty strings."""
    if not value or value.strip() == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def parse_alternate_names(alternate_names: str) -> List[str]:
    """Parse comma-separated alternate names into a list."""
    if not alternate_names or alternate_names.strip() == "":
        return []
    return [name.strip() for name in alternate_names.split(",")]


def parse_city_line(line: str, line_number: int) -> Optional[Dict[str, Any]]:
    """
    Parse a single line from cities15000.txt into a structured dictionary.

    Args:
        line: Tab-separated line from the file
        line_number: Current line number for error reporting

    Returns:
        Dictionary with structured city data or None if parsing fails
    """
    fields = line.strip().split('\t')

    # Expect exactly 19 fields according to GeoNames documentation
    if len(fields) != 19:
        print(f"Warning: Line {line_number} has {len(fields)} fields, expected 19")
        return None

    try:
        city_data = {
            "geonameid": safe_int(fields[0]),
            "name": fields[1],
            "asciiname": fields[2],
            "alternatenames": parse_alternate_names(fields[3]),
            "coordinates": {
                "latitude": safe_float(fields[4]),
                "longitude": safe_float(fields[5])
            },
            "feature": {
                "class": fields[6] if fields[6] else None,
                "code": fields[7] if fields[7] else None
            },
            "country": {
                "code": fields[8] if fields[8] else None,
                "cc2": fields[9] if fields[9] else None
            },
            "admin": {
                "admin1": fields[10] if fields[10] else None,
                "admin2": fields[11] if fields[11] else None,
                "admin3": fields[12] if fields[12] else None,
                "admin4": fields[13] if fields[13] else None
            },
            "population": safe_int(fields[14]),
            "elevation": safe_int(fields[15]),
            "dem": safe_int(fields[16]),
            "timezone": fields[17] if fields[17] else None,
            "modification_date": fields[18] if fields[18] else None
        }

        return city_data

    except Exception as e:
        print(f"Error parsing line {line_number}: {e}")
        return None


def parse_city_line_compact(line: str, line_number: int) -> Optional[List[Any]]:
    """
    Parse a single line from cities15000.txt into a compact array format.

    Args:
        line: Tab-separated line from the file
        line_number: Current line number for error reporting

    Returns:
        List with city data in the same order as keys, or None if parsing fails
    """
    fields = line.strip().split('\t')

    # Expect exactly 19 fields according to GeoNames documentation
    if len(fields) != 19:
        print(f"Warning: Line {line_number} has {len(fields)} fields, expected 19")
        return None

    try:
        city_data = [
            safe_int(fields[0]),  # geonameid
            fields[1],  # name
            fields[2],  # asciiname
            parse_alternate_names(fields[3]),  # alternatenames
            safe_float(fields[4]),  # latitude
            safe_float(fields[5]),  # longitude
            fields[6] if fields[6] else None,  # feature_class
            fields[7] if fields[7] else None,  # feature_code
            fields[8] if fields[8] else None,  # country_code
            fields[9] if fields[9] else None,  # cc2
            fields[10] if fields[10] else None,  # admin1_code
            fields[11] if fields[11] else None,  # admin2_code
            fields[12] if fields[12] else None,  # admin3_code
            fields[13] if fields[13] else None,  # admin4_code
            safe_int(fields[14]),  # population
            safe_int(fields[15]),  # elevation
            safe_int(fields[16]),  # dem
            fields[17] if fields[17] else None,  # timezone
            fields[18] if fields[18] else None  # modification_date
        ]

        return city_data

    except Exception as e:
        print(f"Error parsing line {line_number}: {e}")
        return None


def convert_txt_to_json(input_file: str = "cities15000.txt", output_file: str = "cities15000.json"):
    """
    Convert cities15000.txt to structured JSON format with nested objects.

    Args:
        input_file: Path to input tab-separated file
        output_file: Path to output JSON file
    """
    cities = []
    total_lines = 0
    processed_lines = 0
    error_count = 0

    try:
        # First pass to count total lines for progress indication
        with open(input_file, 'r', encoding='utf-8') as file:
            total_lines = sum(1 for _ in file)

        print(f"Processing {total_lines:,} lines from {input_file}...")

        # Second pass to process data
        with open(input_file, 'r', encoding='utf-8') as file:
            for line_number, line in enumerate(file, 1):
                city_data = parse_city_line(line, line_number)

                if city_data:
                    cities.append(city_data)
                    processed_lines += 1
                else:
                    error_count += 1

                # Progress indication every 1000 lines
                if line_number % 1000 == 0:
                    progress = (line_number / total_lines) * 100
                    print(f"Progress: {progress:.1f}% ({line_number:,}/{total_lines:,} lines)")

        # Write JSON output
        print(f"Writing {len(cities):,} cities to {output_file}...")

        with open(output_file, 'w', encoding='utf-8') as file:
            json.dump({
                "metadata": {
                    "source": "GeoNames cities15000.txt",
                    "description": "Cities with population > 15000 or capitals",
                    "total_cities": len(cities),
                    "processed_lines": processed_lines,
                    "error_count": error_count
                },
                "cities": cities
            }, file, indent=2, ensure_ascii=False)

        print(f"Conversion completed successfully!")
        print(f"- Total cities: {len(cities):,}")
        print(f"- Processed lines: {processed_lines:,}")
        print(f"- Errors: {error_count:,}")
        print(f"- Output file: {output_file}")

    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error during conversion: {e}")
        sys.exit(1)


def convert_txt_to_compact_json(input_file: str = "cities15000.txt", output_file: str = "cities15000_compact.json"):
    """
    Convert cities15000.txt to compact JSON format with keys and data arrays.

    Args:
        input_file: Path to input tab-separated file
        output_file: Path to output JSON file
    """
    cities_data = []
    total_lines = 0
    processed_lines = 0
    error_count = 0

    # Define the keys for the compact format
    keys = [
        "geonameid", "name", "asciiname", "alternatenames",
        "latitude", "longitude", "feature_class", "feature_code",
        "country_code", "cc2", "admin1_code", "admin2_code",
        "admin3_code", "admin4_code", "population", "elevation",
        "dem", "timezone", "modification_date"
    ]

    try:
        # First pass to count total lines for progress indication
        with open(input_file, 'r', encoding='utf-8') as file:
            total_lines = sum(1 for _ in file)

        print(f"Processing {total_lines:,} lines from {input_file} (compact format)...")

        # Second pass to process data
        with open(input_file, 'r', encoding='utf-8') as file:
            for line_number, line in enumerate(file, 1):
                city_data = parse_city_line_compact(line, line_number)

                if city_data:
                    cities_data.append(city_data)
                    processed_lines += 1
                else:
                    error_count += 1

                # Progress indication every 1000 lines
                if line_number % 1000 == 0:
                    progress = (line_number / total_lines) * 100
                    print(f"Progress: {progress:.1f}% ({line_number:,}/{total_lines:,} lines)")

        # Write compact JSON output
        print(f"Writing {len(cities_data):,} cities to {output_file} (compact format)...")

        with open(output_file, 'w', encoding='utf-8') as file:
            # Write metadata and keys with proper formatting
            file.write('{\n')
            file.write('  "meta": {\n')
            file.write('    "source": "GeoNames cities15000.txt",\n')
            file.write('    "description": "Cities with population > 15000 or capitals",\n')
            file.write('    "format": "Compact array format with keys and data arrays",\n')
            file.write(f'    "total_cities": {len(cities_data)},\n')
            file.write(f'    "processed_lines": {processed_lines},\n')
            file.write(f'    "error_count": {error_count}\n')
            file.write('  },\n')
            file.write('  "keys": ' + json.dumps(keys, ensure_ascii=False) + ',\n')
            file.write('  "data": [\n')

            # Write each data row on a single line
            for i, city_data in enumerate(cities_data):
                line = '    ' + json.dumps(city_data, ensure_ascii=False)
                if i < len(cities_data) - 1:
                    line += ','
                file.write(line + '\n')

            file.write('  ]\n')
            file.write('}')

        print(f"Compact conversion completed successfully!")
        print(f"- Total cities: {len(cities_data):,}")
        print(f"- Processed lines: {processed_lines:,}")
        print(f"- Errors: {error_count:,}")
        print(f"- Output file: {output_file}")

    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error during conversion: {e}")
        sys.exit(1)


def convert_txt_to_columnar_json(input_file: str = "cities15000.txt", output_file: str = "cities15000_columnar.json"):
    """
    Convert cities15000.txt to columnar JSON format with field arrays.

    Args:
        input_file: Path to input tab-separated file
        output_file: Path to output JSON file
    """
    # Initialize columnar data structure
    columnar_data = {
        "geonameid": [],
        "name": [],
        "asciiname": [],
        "alternatenames": [],
        "latitude": [],
        "longitude": [],
        "feature_class": [],
        "feature_code": [],
        "country_code": [],
        "cc2": [],
        "admin1_code": [],
        "admin2_code": [],
        "admin3_code": [],
        "admin4_code": [],
        "population": [],
        "elevation": [],
        "dem": [],
        "timezone": [],
        "modification_date": []
    }

    total_lines = 0
    processed_lines = 0
    error_count = 0

    try:
        # First pass to count total lines for progress indication
        with open(input_file, 'r', encoding='utf-8') as file:
            total_lines = sum(1 for _ in file)

        print(f"Processing {total_lines:,} lines from {input_file} (columnar format)...")

        # Second pass to process data
        with open(input_file, 'r', encoding='utf-8') as file:
            for line_number, line in enumerate(file, 1):
                fields = line.strip().split('\t')

                # Expect exactly 19 fields according to GeoNames documentation
                if len(fields) != 19:
                    print(f"Warning: Line {line_number} has {len(fields)} fields, expected 19")
                    error_count += 1
                    continue

                try:
                    # Append data to each column
                    columnar_data["geonameid"].append(safe_int(fields[0]))
                    columnar_data["name"].append(fields[1])
                    columnar_data["asciiname"].append(fields[2])
                    columnar_data["alternatenames"].append(parse_alternate_names(fields[3]))
                    columnar_data["latitude"].append(safe_float(fields[4]))
                    columnar_data["longitude"].append(safe_float(fields[5]))
                    columnar_data["feature_class"].append(fields[6] if fields[6] else None)
                    columnar_data["feature_code"].append(fields[7] if fields[7] else None)
                    columnar_data["country_code"].append(fields[8] if fields[8] else None)
                    columnar_data["cc2"].append(fields[9] if fields[9] else None)
                    columnar_data["admin1_code"].append(fields[10] if fields[10] else None)
                    columnar_data["admin2_code"].append(fields[11] if fields[11] else None)
                    columnar_data["admin3_code"].append(fields[12] if fields[12] else None)
                    columnar_data["admin4_code"].append(fields[13] if fields[13] else None)
                    columnar_data["population"].append(safe_int(fields[14]))
                    columnar_data["elevation"].append(safe_int(fields[15]))
                    columnar_data["dem"].append(safe_int(fields[16]))
                    columnar_data["timezone"].append(fields[17] if fields[17] else None)
                    columnar_data["modification_date"].append(fields[18] if fields[18] else None)

                    processed_lines += 1

                except Exception as e:
                    print(f"Error parsing line {line_number}: {e}")
                    error_count += 1
                    continue

                # Progress indication every 1000 lines
                if line_number % 1000 == 0:
                    progress = (line_number / total_lines) * 100
                    print(f"Progress: {progress:.1f}% ({line_number:,}/{total_lines:,} lines)")

        # Write columnar JSON output
        print(f"Writing {processed_lines:,} cities to {output_file} (columnar format)...")

        field_names = [
            "geonameid", "name", "asciiname", "alternatenames",
            "latitude", "longitude", "feature_class", "feature_code",
            "country_code", "cc2", "admin1_code", "admin2_code",
            "admin3_code", "admin4_code", "population", "elevation",
            "dem", "timezone", "modification_date"
        ]

        with open(output_file, 'w', encoding='utf-8') as file:
            # Write metadata with proper formatting
            file.write('{\n')
            file.write('  "meta": {\n')
            file.write('    "source": "GeoNames cities15000.txt",\n')
            file.write('    "description": "Cities with population > 15000 or capitals",\n')
            file.write('    "format": "Columnar format with field arrays",\n')
            file.write(f'    "total_cities": {processed_lines},\n')
            file.write(f'    "processed_lines": {processed_lines},\n')
            file.write(f'    "error_count": {error_count}\n')
            file.write('  },\n')
            file.write('  "data": {\n')

            # Write each field array on a single line
            for i, field_name in enumerate(field_names):
                line = f'    "{field_name}": ' + json.dumps(columnar_data[field_name], ensure_ascii=False)
                if i < len(field_names) - 1:
                    line += ','
                file.write(line + '\n')

            file.write('  }\n')
            file.write('}')

        print(f"Columnar conversion completed successfully!")
        print(f"- Total cities: {processed_lines:,}")
        print(f"- Processed lines: {processed_lines:,}")
        print(f"- Errors: {error_count:,}")
        print(f"- Output file: {output_file}")

    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        sys.exit(1)
    except Exception as e:
        print(f"Error during conversion: {e}")
        sys.exit(1)


def main():
    """Main function to handle command line arguments and run conversion."""
    input_file = "cities15000.txt"

    # Simple command line argument handling
    format_type = "all"  # Default to all formats
    if len(sys.argv) > 1:
        if sys.argv[1] in ["structured", "compact", "columnar", "all"]:
            format_type = sys.argv[1]
            if len(sys.argv) > 2:
                input_file = sys.argv[2]
        else:
            input_file = sys.argv[1]
            if len(sys.argv) > 2 and sys.argv[2] in ["structured", "compact", "columnar", "all"]:
                format_type = sys.argv[2]

    print("GeoNames cities15000.txt to JSON converter")
    print("=========================================")
    print(f"Input file: {input_file}")
    print(f"Format: {format_type}")
    print()

    if format_type in ["structured", "all"]:
        print("Creating structured JSON format...")
        convert_txt_to_json(input_file, "cities15000.json")
        print()

    if format_type in ["compact", "all"]:
        print("Creating compact JSON format...")
        convert_txt_to_compact_json(input_file, "cities15000_compact.json")
        print()

    if format_type in ["columnar", "all"]:
        print("Creating columnar JSON format...")
        convert_txt_to_columnar_json(input_file, "cities15000_columnar.json")
        print()

    print("All conversions completed!")


if __name__ == "__main__":
    main()
