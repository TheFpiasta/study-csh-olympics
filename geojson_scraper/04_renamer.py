import os
import json
import re
import shutil

# Mapping von Jahr+Saison zu Olympiastadt (englische Bezeichnungen mit Unterstrich)
olympics = {
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

# Directories
input_dir = os.path.join(os.path.dirname(__file__), "02_basic_geojsons")
output_dir = os.path.join(os.path.dirname(__file__), "03_named_geojsons")
final_dir = os.path.join(os.path.dirname(__file__), "00_final_geojsons")

os.makedirs(output_dir, exist_ok=True)

# Clear and recreate final_dir
if os.path.exists(final_dir):
    shutil.rmtree(final_dir)
os.makedirs(final_dir, exist_ok=True)

def process_file(filepath, output_dir, final_dir):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    base = os.path.splitext(os.path.basename(filepath))[0].lower()  # e.g. "1936-summer"
    olympic_label = olympics.get(base)
    if not olympic_label:
        print(f'No entry found for {filepath}.')
        return
    
    for feature in data.get('features', []):
        props = feature.get('properties', {})
        props['Olympics'] = olympic_label.replace('_', ' ')
        feature['properties'] = props
    
    # New filename
    new_filename = olympic_label + '.geojson'
    new_path = os.path.join(output_dir, new_filename)
    final_path = os.path.join(final_dir, new_filename)
    
    # Save into output_dir
    with open(new_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    # Also save a copy into final_dir
    with open(final_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f'{filepath} was saved as {new_path} and copied to {final_path}')

def main():
    pattern = re.compile(r'^(\d{4})-(summer|winter)\.geojson$', re.IGNORECASE)
    
    for file in os.listdir(input_dir):
        if pattern.match(file):
            filepath = os.path.join(input_dir, file)
            process_file(filepath, output_dir, final_dir)

if __name__ == "__main__":
    main()