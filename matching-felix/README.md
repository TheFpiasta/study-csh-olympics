

## venv

```bash
py -m venv .venv
# If you are using a Unix-like system (Linux, macOS)
source .venv/bin/activate
# If you are using Windows
.venv\Scripts\activate

pip install -r requirements.txt
```

## packages to requirements.txt

```bash
pip freeze > requirements.txt
```


## results

- eineiiges getestet
- beste Resultant (82.2% matches) mit:
  - namen splitten ( "hallo (aka hello)" -> "hallo", "hello" )
  - nur wenige begriffen entfernen (eigentlich nur "also known as")
  - nur direct match und fuzzy match verwenden
  - fuzzy match mit 0.75 threshold

- probleme gibt es, dass es einigermaßen unsicher ist, ob richtig gematched wurde
  - gleiche sportarten sind nicht immer gleiche stadien
  - ähnliche stadien namen sind manchmal über mehrere stadien anwendbar (z.b. "Stadium des große Schießen" <-> "stadium des Bogen Schießen", "stadium des Pistol Schießen" würden beide matchen sind aber potential beide falsch)

- Problematisch ist vor allem, dass nicht sicher festgestellt werden kann, ob die matches stimmen oder nicht

## Ordner Struktur

```txt
matching-felix
├── README.md
├── both_test.log - Test log for testing logger with log to fiel and console
├── claude-4-extraction-promt.txt - Prompt for Claude 4 to extract venue names
├── combined_geojson - first good try
│   ├── 1896_Athens.geojson
│   ├── ...
│   ├── 2022_Beijing.geojson
│   ├── matching_log.txt
│   └── venue_matching_statistics.json
├── combined_geojson_less_stages_less_array - best try
│   ├── 1896_Athens.geojson
│   ├── ...
│   ├── 2022_Beijing.geojson
│   ├── matching.log
│   └── venue_matching_statistics.json
├── combined_geojson_less_stages_less_array_no_sport_match - not so good try
│   ├── 1896_Athens.geojson
│   ├── ...
│   ├── 2022_Beijing.geojson
│   ├── matching.log
│   └── venue_matching_statistics.json
├── console_only_test.log - Test file for logging seperatly
├── getAllVenusNames.py - Script to extract all venue names from the geojson and json files
├── main.py - Main script to load, process and match venues
├── requirements.txt - Python dependencies
├── test_logging.py - Test for logging functionality
├── test_matcher-3-less-stages_less_array.log - Test log for matcher with only fuzzy and direct matches and less word removes
├── test_matcher-less-stages.log - Test log for matcher with only fuzzy and direct matches
├── test_matcher-new-arrays.log - Test log for matcher with new BIG arrays
├── test_matcher.log - test log for test_venue_matching
├── test_venue_matching.py - Test script for venue matching
├── venues.txt - List of venue names
├── venues_matcher.py - Contains the matching algorithms for venue names
└── visualize_structure.py - Script to visualize the folder structure
```