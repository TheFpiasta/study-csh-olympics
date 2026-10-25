"""
Test script for the new logging functionality in venues_matcher.py.
This script tests different logging configurations:
1. Console only (default)
2. File only
3. Both console and file
"""

from venues_matcher import find_stadium_matches

# Sample data for testing
test_data = {
    "geoJson": [
        {
            "associated_names": [
                "Stadio Olimpico",
                "Olympic Stadium"
            ]
        },
        {
            "associated_names": [
                "Piazza di Siena, Villa Borghese"
            ]
        }
    ],
    "json": [
        {
            "name": "Olympic Stadium",
            "classification": "Existing"
        },
        {
            "name": "Piazza di Siena",
            "classification": "Existing"
        }
    ]
}

def test_console_only():
    """Test logging to console only (default)"""
    print("\n=== Testing Console Only Logging (Default) ===")
    find_stadium_matches(
        test_data["geoJson"],
        test_data["json"],
        name_key1='associated_names',
        name_key2='name',
        debug=True,
        loglevel="INFO",
        log_to_console=True,
        log_to_file=False
    )

def test_file_only():
    """Test logging to file only"""
    print("\n=== Testing File Only Logging ===")
    find_stadium_matches(
        test_data["geoJson"],
        test_data["json"],
        name_key1='associated_names',
        name_key2='name',
        debug=True,
        loglevel="INFO",
        log_to_console=False,
        log_to_file=True,
        log_file_path="console_only_test.log"
    )
    print("Check console_only_test.log for log output")

def test_both():
    """Test logging to both console and file"""
    print("\n=== Testing Both Console and File Logging ===")
    find_stadium_matches(
        test_data["geoJson"],
        test_data["json"],
        name_key1='associated_names',
        name_key2='name',
        debug=True,
        loglevel="INFO",
        log_to_console=True,
        log_to_file=True,
        log_file_path="both_test.log"
    )
    print("Check both_test.log for log output")

if __name__ == "__main__":
    test_console_only()
    test_file_only()
    test_both()
    print("\nAll tests completed. Check log files for output.")