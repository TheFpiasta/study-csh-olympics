

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

## Stand der matches

Ich habe einiges rum probiert. Die Beste Lösung um die Stadien zu matchen in meinem Code (matching-felix) ist:

Hauptfile: main.py
Nutzt: venues_matcher.py (Funktionalität für name-matches)

README.md für mehr Strucktur infos

- Sports match --> alle unmatched weiter behandeln
- Namen mit klammern "Stadium (aka venues)" splitten --> "Stadium", "aka venues"
  --> fällt mir gerade ein: könnte man auch noch nach Komma oder "/" splitten?
- dann für alle Kombinationen (unsplittet, splittet) Name-matching ausführen
  --> 1. direkter Match (gleiche namen)
  --> 2. fuzzy Match mit threshold
- im preprocessing nur die wörter "also", "known", "as" filtern.
- FYI aktuelle und Beste Implementation erzeugte den Ordner "combined_geojson_less_stages_less_array"
  ==> 82.2% matches ereicht (über alle Stadien)

### Problem / todos

- es wird alles schön gelogged, aber da das ultra viel ist, stellt sich eine Überprüfung als schwirig raus. Es kann nur stichprobenhaltig geschaut werden

### Noch zu implementieren:

- bei den matches werden aktuell noch nicht alle Statistiken eingefügt. Und die globalen infos je Austragung. Das müsste mal noch angepast werden
  --> transfer_venue_data() für venues properties
  --> transfer_olympic_year_data() für globale properties

### Erkentnisse

- mehr wörter filtern (filler, place namen, location namen) hat das matching verschlechtert
- die implementierten token_based_match und substring_match sind unsichere Matches. Es werden gefühlt mehr False Positive produziert. und etwas mehr unmatched bleiben übrig
- fuzzy mit thrashold von 0.75 ist ziemlich gut, kann aber auch noch mal anders gesetzt werden
- Es gibt/ gab einige Fälle, indem mal durch das Sports match zwei unterschiedliche Stadien gematched wurden. Das muss nochmal überprüft werden
  z.B.

`[00:09:01] INFO: Sport match: JSON venue Rio Olympic Stadium <-> GeoJSON venue ['Minerão', 'Mineirão', 'Estádio Governador Magalhães Pinto'] | Sports json: Football, Sports geojson: Football`

~2016 Summer Olympics

### Resultat

- meine Implementation könnte man nehmen.
- Es sollte darauf hingewießen werden, dass es zu fehlerhaten / unvollständigen Daten kommen kann
- todos wie oben beschrieben müssten mal noch angepast werden
- für die paar Jahre, die wir tiefer analysieren, müssen wir die Matching Resultate genauer untersuchen/ prüfen
- Auswertungen über alle venues sollten mit bedacht erstellt werden. ggf für graphen nicht die geojsons verwenden sondern die einzelnen Datenquellen
- Das exakte matching ist ein POC und ein offenes Thema für weitere Forschungsarbeiten.

Ich denke, wir sollten uns vorerst mit den über 80% Matches zufrieden geben und damit weiter arbeiten.

