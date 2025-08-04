from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException

from webdriver_manager.chrome import ChromeDriverManager
from urllib.parse import urljoin
import requests
import time
from pathlib import Path
import re
import os

# --- Konfiguration ---
BASE_URL = "https://library.olympics.com"
DOWNLOAD_BASE = Path.home() / "Downloads" / "olympic_reports"
DOWNLOAD_BASE.mkdir(parents=True, exist_ok=True)
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}

# --- Die von dir validierte, vollständige Link-Liste ---
ALL_REPORT_URLS = [
    # Summer Games (30 Links)
    "https://library.olympics.com/Default/doc/SYRACUSE/3598866/official-report-paris-2024-organising-committee-for-the-olympic-and-paralympic-games-paris-2024",
    "https://library.olympics.com/Default/doc/SYRACUSE/2954165/tokyo-2020-official-report-the-tokyo-organising-committee-of-the-olympic-and-paralympic-games",
    "https://library.olympics.com/Default/doc/SYRACUSE/3416765/rio-2016-official-report-brazil-olympic-committee",
    "https://library.olympics.com/Default/doc/SYRACUSE/37734/london-2012-olympic-games-the-official-report-the-london-organising-committee-of-the-olympic-games-a",
    "https://library.olympics.com/Default/doc/SYRACUSE/23655/official-report-of-the-beijing-2008-olympic-games-beijing-organizing-committee-for-the-games-of-the-",
    "https://library.olympics.com/Default/doc/SYRACUSE/54515/official-report-of-the-xxviii-olympiad-athens-2004-athens-2004-organising-committee-for-the-olympic-",
    "https://library.olympics.com/Default/doc/SYRACUSE/40959/official-report-of-the-xxvii-olympiad-sydney-2000-olympic-games-15-september-1-october-2000-publ-by-",
    "https://library.olympics.com/Default/doc/SYRACUSE/41622/the-official-report-of-the-centennial-olympic-games-atlanta-1996-the-atlanta-committee-for-the-olymp",
    "https://library.olympics.com/Default/doc/SYRACUSE/57312/official-report-of-the-games-of-the-xxv-olympiad-barcelona-1992-ed-coob-92",
    "https://library.olympics.com/Default/doc/SYRACUSE/56641/official-report-games-of-the-xxivth-olympiad-seoul-1988-pub-by-the-seoul-olympic-organizing-committe",
    "https://library.olympics.com/Default/doc/SYRACUSE/49720/official-report-of-the-games-of-the-xxiiird-olympiad-los-angeles-1984-pub-by-the-los-angeles-olympic",
    "https://library.olympics.com/Default/doc/SYRACUSE/46841/games-of-the-xxii-olympiad-official-report-of-the-organising-committee-of-the-games-of-the-xxii-olym",
    "https://library.olympics.com/Default/doc/SYRACUSE/31001/montreal-1976-games-of-the-xxi-olympiad-montreal-1976-official-report-ed-cojo-76",
    "https://library.olympics.com/Default/doc/SYRACUSE/21535/die-spiele-the-official-report-of-the-organizing-committtee-for-the-games-of-the-xxth-olympiad-munic",
    "https://library.olympics.com/Default/doc/SYRACUSE/53580/mexico-68-comite-organisateur-des-jeux-de-la-xix-olympiade",
    "https://library.olympics.com/Default/doc/SYRACUSE/63146/the-games-of-the-xviii-olympiad-tokyo-1964-the-official-report-of-the-organizing-committee",
    "https://library.olympics.com/Default/doc/SYRACUSE/53271/the-games-of-the-xvii-olympiad-rome-1960-the-official-report-of-the-organizing-committee-ed-by-the-o",
    "https://library.olympics.com/Default/SearchMinify/c47d0d29be76104d410a86b08cd567c0", # Melbourne 1956
    "https://library.olympics.com/Default/doc/SYRACUSE/70779/the-official-report-of-the-organising-committee-for-the-games-of-the-xv-olympiad-ed-sulo-kolkka",
    "https://library.olympics.com/Default/doc/SYRACUSE/30813/the-official-report-of-the-organising-comittee-for-the-xiv-olympiad-publ-by-the-organising-committee",
    "https://library.olympics.com/Default/doc/SYRACUSE/67725/the-xith-olympic-games-berlin-1936-official-report-by-organisationskomitee-fur-die-xi-olympiade-berl",
    "https://library.olympics.com/Default/doc/SYRACUSE/51192/the-games-of-the-xth-olympiad-los-angeles-1932-official-report-publ-by-the-xth-olympiade-committee-o",
    "https://library.olympics.com/Default/doc/SYRACUSE/51131/the-ninth-olympiad-being-the-official-report-of-the-olympic-games-of-1928-celebrated-at-amsterdam-is",
    "https://library.olympics.com/Default/doc/SYRACUSE/32625/les-jeux-de-la-viiie-olympiade-paris-1924-rapport-officiel-comite-olympique-francais",
    "https://library.olympics.com/Default/SearchMinify/58243ac92b0ec341eb18bf79fb18ce9b", # Antwerpen 1920
    "https://library.olympics.com/Default/doc/SYRACUSE/31965/the-official-report-of-the-olympic-games-of-stockholm-1912-the-fifth-olympiad-issued-by-the-swedish-",
    "https://library.olympics.com/Default/doc/SYRACUSE/28911/the-fourth-olympiad-being-the-official-report-of-the-olympic-games-of-1908-celebrated-in-london-draw",
    "https://library.olympics.com/Default/SearchMinify/EwlL_1kFIUeF2Kdh8SJYNQ", # St Louis 1904
    "https://library.olympics.com/Default/doc/SYRACUSE/23618/concours-internationaux-d-exercices-physiques-et-de-sports-rapports-ministere-du-commerce-de-l-indus",
    "https://library.olympics.com/Default/doc/SYRACUSE/34632/the-olympic-games-b-c-776-a-d-1896-die-olympischen-spiele-776-v-chr-1896-n-chr-publ-with-the-sanctio",
    # Winter Games (24 Links)
    "https://library.olympics.com/Default/doc/SYRACUSE/3417271/beijing-2022-official-report-english-version-beijing-organising-committee-for-the-2022-olympic-and-p",
    "https://library.olympics.com/Default/doc/SYRACUSE/206806/pyeongchang-2018-official-report-the-pyeongchang-organising-committee-for-the-xxiii-olympic-and-para",
    "https://library.olympics.com/Default/doc/SYRACUSE/76792/sochi-2014-official-report-sotchi-2014-rapport-officiel-the-organizing-committee-of-the-xxii-olympic",
    "https://library.olympics.com/Default/doc/SYRACUSE/76494/vanoc-official-games-report-rapport-officiel-des-jeux-covan-comite-d-organisation-des-jeux-olympique",
    "https://library.olympics.com/Default/doc/SYRACUSE/29828/xx-giochi-olimpici-invernali-torino-2006-xx-olympic-winter-games-torino-2006-comitato-per-l-organizz",
    "https://library.olympics.com/Default/doc/SYRACUSE/38435/official-report-of-the-xix-olympic-winter-games-salt-lake-2002-8-24-february-2002-publ-by-the-salt-l",
    "https://library.olympics.com/Default/doc/SYRACUSE/66018/the-xviii-olympic-winter-games-official-report-nagano-1998-the-organizing-committee-for-the-xviii-ol",
    "https://library.olympics.com/Default/doc/SYRACUSE/64685/official-report-of-the-xvii-olympic-winter-games-lillehammer-1994-helge-mjelde-et-al",
    "https://library.olympics.com/Default/doc/SYRACUSE/76518/rapport-officiel-des-xvies-jeux-olympiques-d-hiver-d-albertville-et-de-la-savoie-official-report-of-",
    "https://library.olympics.com/Default/doc/SYRACUSE/43821/rapport-officiel-des-xves-jeux-olympiques-d-hiver-xv-olympic-winter-games-official-report",
    "https://library.olympics.com/Default/doc/SYRACUSE/44680/final-report-rapport-final-zavrsni-izvjestaj-published-by-the-organising-committee-of-the-xivth-wint",
    "https://library.olympics.com/Default/SearchMinify/0c775092a389ecda5920403b07d64fee", # Lake Placid 1980
    "https://library.olympics.com/Default/doc/SYRACUSE/52972/endbericht-xii-olympische-winterspiele-innsbruck-1976-rapport-final-innsbruck-76-final-report-innsbr",
    "https://library.olympics.com/Default/doc/SYRACUSE/33736/the-xi-olympic-winter-games-sapporo-1972-official-report-les-xi-jeux-olympiques-d-hiver-sapporo-1972",
    "https://library.olympics.com/Default/doc/SYRACUSE/26635/rapport-officiel-xemes-jeux-olympiques-d-hiver-official-report-xth-winter-olympic-games-comite-d-org",
    "https://library.olympics.com/Default/doc/SYRACUSE/75185/offizieller-bericht-der-ix-olympischen-winterspiele-innsbruck-1964-hrsg-vom-organisationskomitee-der",
    "https://library.olympics.com/Default/doc/SYRACUSE/45369/viii-olympic-winter-games-squaw-valley-california-1960-final-report-publ-by-the-california-olympic-c",
    "https://library.olympics.com/Default/doc/SYRACUSE/60979/vii-giochi-olimpici-invernali-cortina-d-ampezzo-1956-vii-olympic-winter-games-cortina-d-ampezzo-1956",
    "https://library.olympics.com/Default/doc/SYRACUSE/37927/vi-olympiske-vinterleker-oslo-1952-vi-olympic-winter-games-oslo-1952-utgitt-av-organisasjonskomiteen",
    "https://library.olympics.com/Default/doc/SYRACUSE/20609/rapport-general-sur-les-ves-jeux-olympiques-d-hiver-st-moritz-1948-comite-olympique-suisse",
    "https://library.olympics.com/Default/doc/SYRACUSE/78706/iv-olympische-winterspiele-1936-garmisch-partenkirchen-6-bis-16-februar-amtlicher-bericht-hrsg-vom-o",
    "https://library.olympics.com/Default/doc/SYRACUSE/51298/iii-olympic-winter-games-lake-placid-1932-official-report-issued-by-iii-olympic-winter-games-committ",
    "https://library.olympics.com/Default/SearchMinify/x84GWqOOm0mZWnbM8YwcSA", # St. Moritz 1928
    "https://library.olympics.com/Default/doc/SYRACUSE/32625/les-jeux-de-la-viiie-olympiade-paris-1924-rapport-officiel-comite-olympique-francais", # Chamonix 1924
]

def sanitize(name):
    """Bereinigt einen String, damit er als Datei- oder Ordnername gültig ist."""
    return "".join(c for c in name if c.isalnum() or c in " -_().").rstrip()

def get_and_classify_links():
    """Klassifiziert die hardcodierte Liste von URLs in Sommer- und Winterspiele."""
    print("--- Klassifiziere die hardcodierte Link-Liste ---")
    first_winter_game_index = 10
    links_by_category = {
        'Summer': ALL_REPORT_URLS[:first_winter_game_index],
        'Winter': ALL_REPORT_URLS[first_winter_game_index:]
    }
    print(f"✅ Klassifizierung abgeschlossen. Sommer: {len(links_by_category['Summer'])}, Winter: {len(links_by_category['Winter'])}.")
    return links_by_category

def handle_cookies_once(driver):
    """Navigiert zur Startseite und behandelt den Cookie-Banner."""
    print("--- Einmaliges Setup: Behandle Cookie-Banner ---")
    driver.get(BASE_URL)
    try:
        accept_button = WebDriverWait(driver, 15).until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Accept and continue')]")))
        driver.execute_script("arguments[0].click();", accept_button)
        WebDriverWait(driver, 10).until(EC.invisibility_of_element_located((By.XPATH, "//button[contains(., 'Accept and continue')]")))
        print("✅ Cookie-Banner erfolgreich für diese Sitzung geschlossen.")
    except TimeoutException:
        print("👍 Kein Cookie-Banner gefunden oder bereits akzeptiert.")

def create_requests_session(driver):
    """Erstellt eine requests-Session und kopiert die Browser-Cookies."""
    session = requests.Session()
    session.headers.update(HEADERS)
    for cookie in driver.get_cookies():
        session.cookies.set(cookie['name'], cookie['value'], domain=cookie['domain'])
    return session

def download_file(session, download_url, filepath):
    """Lädt eine einzelne Datei herunter."""
    if filepath.exists():
        print(f"✅ '{filepath.name}' existiert bereits. Überspringe.")
        return
    try:
        print(f"📥 Lade '{filepath.name}'...")
        r = session.get(download_url, stream=True, timeout=300)
        r.raise_for_status()
        with open(filepath, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"✅ Download abgeschlossen: {filepath.name}")
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Fehler beim Herunterladen: {e}")

def download_report(detail_url, category, driver, session):
    """Lädt alle Bände eines Reports herunter und legt sie im richtigen Kategorie-Ordner ab."""
    driver.get(detail_url)
    try:
        title_selector = "span.toolbar-title"
        title_elem = WebDriverWait(driver, 30).until(EC.presence_of_element_located((By.CSS_SELECTOR, title_selector)))
        full_title = driver.execute_script("return arguments[0].textContent;", title_elem).strip().replace('\n', '').replace('  ', '')
        
        match = re.search(r"([\w\s]+ \d{4})", full_title)
        folder_name = sanitize(match.group(1).strip()) if match else sanitize(full_title)
        
        category_folder = DOWNLOAD_BASE / category
        game_folder = category_folder / folder_name
        game_folder.mkdir(parents=True, exist_ok=True)
        print(f"🗂️  Ordner '{category}{os.path.sep}{folder_name}' wird verwendet.")
        
        try:
            WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.CSS_SELECTOR, "div.swiper-container")))
            print("📚 Mehrere Bände gefunden.")
            volume_links_selector = "a.strip-item.dr-thumb"
            num_volumes = len(WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, volume_links_selector))))
            
            for i in range(num_volumes):
                print(f"--- Verarbeite Band {i+1}/{num_volumes} ---")
                volume_elements = WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, volume_links_selector)))
                volume_elements[i].click()
                time.sleep(2.5)

                download_button_selector = 'a[href*="DigitalCollectionAttachmentDownloadHandler.ashx"]'
                download_button = WebDriverWait(driver, 20).until(EC.element_to_be_clickable((By.CSS_SELECTOR, download_button_selector)))
                download_url = download_button.get_attribute('href')
                
                filename = f"Volume {i+1}.pdf"
                download_file(session, urljoin(BASE_URL, download_url), game_folder / filename)
        
        except TimeoutException:
            print("📖 Nur ein Band gefunden.")
            download_button_selector = 'a[href*="DigitalCollectionAttachmentDownloadHandler.ashx"]'
            download_button = WebDriverWait(driver, 45).until(EC.element_to_be_clickable((By.CSS_SELECTOR, download_button_selector)))
            download_url = download_button.get_attribute('href')
            
            filename = "Report.pdf"
            download_file(session, urljoin(BASE_URL, download_url), game_folder / filename)

    except Exception as e:
        print(f"\n❌ Ein unerwarteter Fehler ist bei der Verarbeitung von {detail_url} aufgetreten: {e}")

def main():
    options = Options()
    
    # Der Browser bleibt für die Überwachung sichtbar.
    # Für den unbeaufsichtigten Lauf, diese Zeile einkommentieren.
    # options.add_argument("--headless")
    
    options.add_argument("--window-size=1920,1080")
    options.add_experimental_option("excludeSwitches", ["enable-automation", "enable-logging"])
    
    driver = None
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        
        handle_cookies_once(driver)
        links_by_category = get_and_classify_links()
        
        session = create_requests_session(driver)
        
        links_to_process = links_by_category

        for category, links in links_to_process.items():
            print(f"\n{'='*30} KATEGORIE: {category.upper()} {'='*30}")
            for i, link in enumerate(links):
                print(f"\n--- Verarbeite Report {i+1}/{len(links)} der Kategorie {category}: {link} ---")
                download_report(link, category, driver, session)

    except Exception as e:
        print(f"\n❌ Ein kritischer Fehler ist im Hauptprogramm aufgetreten: {e}")
    finally:
        if driver:
            print("\nAlle Aufgaben abgeschlossen. Schließe Browser...")
            time.sleep(5)
            driver.quit()

if __name__ == "__main__":
    main()