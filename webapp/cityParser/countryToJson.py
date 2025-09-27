#!/usr/bin/env python3
"""
Convert GeoNames countryInfo.txt file to ISO-indexed JSON format.

This script processes the tab-separated countryInfo.txt file from GeoNames
and converts it to an ISO-indexed JSON format optimized for fast country lookups.

Usage:
    python3 countryToJson.py [input_file] [output_file]

Examples:
    python3 countryToJson.py                              # Use default files
    python3 countryToJson.py countryInfo.txt              # Custom input file
    python3 countryToJson.py countryInfo.txt countries.json  # Custom input and output

Output format:
ISO-indexed format (countryInfo_iso.json): Countries indexed by ISO code for O(1) lookups
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


def parse_languages(languages: str) -> List[str]:
    """Parse comma-separated language codes into a list."""
    if not languages or languages.strip() == "":
        return []
    return [lang.strip() for lang in languages.split(",")]


def parse_neighbours(neighbours: str) -> List[str]:
    """Parse comma-separated neighbor country codes into a list."""
    if not neighbours or neighbours.strip() == "":
        return []
    return [neighbour.strip() for neighbour in neighbours.split(",")]


def parse_country_line(line: str, line_number: int) -> Optional[Dict[str, Any]]:
    """
    Parse a single line from countryInfo.txt into a structured dictionary.

    Fields: ISO, ISO3, ISO-Numeric, fips, Country, Capital, Area(in sq km), Population,
            Continent, tld, CurrencyCode, CurrencyName, Phone, Postal Code Format,
            Postal Code Regex, Languages, geonameid, neighbours, EquivalentFipsCode

    Args:
        line: Tab-separated line from the file
        line_number: Current line number for error reporting

    Returns:
        Dictionary with structured country data or None if parsing fails
    """
    fields = line.strip().split('\t')

    # Expect at least 16 fields, pad with empty strings if needed
    if len(fields) < 16:
        print(f"Warning: Line {line_number} has {len(fields)} fields, minimum 16 required")
        return None

    # Pad fields to 19 if some trailing fields are missing
    while len(fields) < 19:
        fields.append('')

    try:
        # Skip lines that don't have a valid ISO code
        iso_code = fields[0].strip()
        if not iso_code or len(iso_code) != 2:
            return None

        country_data = {
            "iso3": fields[1] if fields[1] else None,
            "iso_numeric": safe_int(fields[2]),
            "fips": fields[3] if fields[3] else None,
            "country": fields[4] if fields[4] else None,
            "capital": fields[5] if fields[5] else None,
            "area_sq_km": safe_int(fields[6]),
            "population": safe_int(fields[7]),
            "continent": fields[8] if fields[8] else None,
            "tld": fields[9] if fields[9] else None,
            "currency": {
                "code": fields[10] if fields[10] else None,
                "name": fields[11] if fields[11] else None
            },
            "phone": fields[12] if fields[12] else None,
            "postal_format": fields[13] if fields[13] else None,
            "postal_regex": fields[14] if fields[14] else None,
            "languages": parse_languages(fields[15]),
            "geonameid": safe_int(fields[16]),
            "neighbours": parse_neighbours(fields[17]),
            "equivalent_fips": fields[18] if fields[18] else None
        }

        return {"iso": iso_code, "data": country_data}

    except Exception as e:
        print(f"Error parsing line {line_number}: {e}")
        return None


def convert_country_to_iso_json(input_file: str = "countryInfo.txt", output_file: str = "countryInfo_iso.json"):
    """
    Convert countryInfo.txt to ISO-indexed JSON format.

    Args:
        input_file: Path to input tab-separated file
        output_file: Path to output JSON file
    """
    countries = {}
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
                # Skip comment lines and headers
                if line.startswith('#') or line.startswith('ISO\t'):
                    continue

                if not line.strip():
                    continue

                result = parse_country_line(line, line_number)

                if result:
                    iso_code = result["iso"]
                    country_data = result["data"]
                    countries[iso_code] = country_data
                    processed_lines += 1
                else:
                    error_count += 1

                # Progress indication every 50 lines (smaller file than cities)
                if line_number % 50 == 0:
                    progress = (line_number / total_lines) * 100
                    print(f"Progress: {progress:.1f}% ({line_number:,}/{total_lines:,} lines)")

        # Write ISO-indexed JSON output
        print(f"Writing {len(countries):,} countries to {output_file}...")

        with open(output_file, 'w', encoding='utf-8') as file:
            output_data = {
                "meta": {
                    "source": "GeoNames countryInfo.txt",
                    "description": "Country information indexed by ISO code",
                    "format": "ISO-indexed format for fast lookups",
                    "total_countries": len(countries),
                    "processed_lines": processed_lines,
                    "error_count": error_count
                },
                "countries": countries
            }

            json.dump(output_data, file, indent=2, ensure_ascii=False)

        print(f"Conversion completed successfully!")
        print(f"- Total countries: {len(countries):,}")
        print(f"- Processed lines: {processed_lines:,}")
        print(f"- Errors: {error_count:,}")
        print(f"- Output file: {output_file}")

        # Show some example lookups
        if countries:
            print(f"\nExample usage:")
            example_countries = list(countries.keys())[:3]
            for iso in example_countries:
                country_name = countries[iso]['country']
                print(f"  data.countries['{iso}'] -> {country_name}")

    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        print("Make sure you have downloaded countryInfo.txt from GeoNames.")
        sys.exit(1)
    except Exception as e:
        print(f"Error during conversion: {e}")
        sys.exit(1)


def main():
    """Main function to handle command line arguments and run conversion."""
    input_file = "countryInfo.txt"
    output_file = "countryInfo_iso.json"

    # Simple command line argument handling
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    if len(sys.argv) > 2:
        output_file = sys.argv[2]

    print("GeoNames countryInfo.txt to ISO-indexed JSON converter")
    print("====================================================")
    print(f"Input file: {input_file}")
    print(f"Output file: {output_file}")
    print()

    convert_country_to_iso_json(input_file, output_file)


if __name__ == "__main__":
    main()
