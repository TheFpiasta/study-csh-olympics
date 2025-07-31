from venues_matcher import find_stadium_matches

test_data = {
    "geoJson":[
        {
            "associated_names": [
                "Stadio Olimpico",
                "Olympic Stadium",
                "Stadio dei Cipressi (1930-1950), Stadio dei Centomila (1950-1960)"
            ]
        },
        {
            "associated_names": [
                "Arco di Constantino",
                "Arch of Constantine"
            ]
        },
        {
            "associated_names": [
                "Palazzetto dello Sport (also known as PalaFlaminio, PalaTiziano)",
                "Minor Sports Palace"
            ]
        },
        {
            "associated_names": [
                "Palazzo dello Sport (also known as PalaLottomatica)",
                "Sports Palace",
                "PalaEUR (?-?)"
            ]
        },
        {
            "associated_names": [
                "Lago Albano (also known as Lago di Castel Gandolfo)",
                "Albano Lake"
            ]
        },
        {
            "associated_names": [
                "Circuito Grottarossa",
                "Grottarossa Circuit"
            ]
        },
        {
            "associated_names": [
                "Viale Oceano Pacifico",
                "Pacific Ocean Lane"
            ]
        },
        {
            "associated_names": [
                "Velodrome Olimpico",
                "Olympic Velodrome",
                "Velodromo Fausto Coppi"
            ]
        },
        {
            "associated_names": [
                "Stadio Olimpico del Nuoto",
                "Olympic Swimming Stadium"
            ]
        },
        {
            "associated_names": [
                "Piazza di Siena, Villa Borghese",
                "Siena Square, Villa Borghese"
            ]
        },
        {
            "associated_names": [
                "Centro Equestre Federale",
                "Federal Equestrian Centre"
            ]
        },
        {
            "associated_names": [
                "Palazzo dei Congressi",
                "Congress Palace"
            ]
        },
        {
            "associated_names": [
                "Stadio Flaminio",
                "Flaminio Stadium"
            ]
        },
        {
            "associated_names": [
                "Stadio Fuorigrotta",
                "Fuorigrotta Stadium",
                "Stadio San Paolo (?-Present)"
            ]
        },
        {
            "associated_names": [
                "Stadio Adriatico",
                "Adriatic Stadium",
                "Stadio Adriatico Giovanni Cornacchia (2009-Present)"
            ]
        },
        {
            "associated_names": [
                "Stadio Olimpico Comunale",
                "Municipal Olympic Stadium",
                "Stadio Olimpico Carlo Zecchiní (?-Present)"
            ]
        },
        {
            "associated_names": [
                "Stadio Comunale",
                "Municipal Stadium",
                "Stadio XXVII Ottobre (?-?), Stadio Tommaso Fattorí (?-Present)"
            ]
        },
        {
            "associated_names": [
                "Stadio Comunale",
                "Municipal Stadium",
                "Stadio Artemio Franchi (1991-Present)"
            ]
        },
        {
            "associated_names": [
                "Stadio Ardenza",
                "Ardenza Stadium",
                "Stadio Edda Ciano Mussolini (1935–1945), Yankee Stadium (?-?), Stadio Armando Picchi (1960s-Present)"
            ]
        },
        {
            "associated_names": [
                "Terme di Caracalla",
                "Caracalla Baths"
            ]
        },
        {
            "associated_names": [
                "Stadio dei Marmi",
                "Marmi Stadium"
            ]
        },
        {
            "associated_names": [
                "Stadio Tre Fontane",
                "Three Fountains Stadium"
            ]
        },
        {
            "associated_names": [
                "Centro Federale",
                "Federal Centre"
            ]
        },
        {
            "associated_names": [
                "Poligono Umberto I",
                "Umberto I Rifle Range"
            ]
        },
        {
            "associated_names": [
                "Circolo del Golf di Roma Acquasanta",
                "Roma Acquasanta Golf Club"
            ]
        },
        {
            "associated_names": [
                ""
            ]
        },
        {
            "associated_names": [
                "Scuola di Fanteria dell'Esercito Italiano",
                "Italian Infantry Exercise School"
            ]
        },
        {
            "associated_names": [
                "Campo di Tiro a Volo Lazio",
                "Lazio Clay Pigeon Shooting Range"
            ]
        },
        {
            "associated_names": [
                "Piscina delle Rose",
                "Rose Swimming Pool"
            ]
        },
        {
            "associated_names": [
                "Basilica di Massenzio",
                "Basilica of Maxentius"
            ]
        }
    ],
    "json": [
        {
            "name": "Olympic Stadium",
            "classification": "Existing",
            "use": "Athletics, equestrian (jumping), Opening and Closing Ceremonies",
            "status": "In use",
            "information": "Construction of the stadium was interrupted by WWII, and it officially opened in 1953. Part of the Foro Italico complex in the north of the city, it has been the home stadium of Serie A football clubs such AS Roma and SS Lazio since it opened, and the Italian national rugby team since 2012. The stadium was extensively refurbished for the 1990 FIFA World Cup, when its capacity was increased to nearly 83,000 and it hosted the final. It underwent further renovation in 2007 to make it a UEFA category-five stadium eligible to host Champions League finals, which it did in 2009. It has been a venue for European and World Athletics Championships, the Athletics Diamond League, UEFA European Championship matches in 1968, 1980 and 2021, and Coppa Italia finals, among other major sporting events. It also stages major music concerts and performances.",
            "location": "inside the city"
        },
        {
            "name": "Piazza di Siena",
            "classification": "Existing",
            "use": "Jumping, dressage",
            "status": "In use",
            "information": "Situated in the Villa Borghese gardens, the venue staged its first equestrian events in 1922. Attracting the leading riders on the international circuit, the Piazza di Siena International Horse Show is one of the top events on the equestrian calendar and was a FEI Jumping Nations Cup Division 1 venue between 2013 and 2017. In May 2021, the Piazza di Siena staged the 88th CSIO Roma Master d'Inzeo.",
            "location": "inside the city"
        },
        {
            "name": "Marble Stadium",
            "classification": "Existing",
            "use": "Hockey",
            "status": "In use",
            "information": "As well as hosting the knockout rounds of the hockey tournament at Rome 1960, the Stadio dei Marmi was used by athletes to warm up for the track and field events at the adjoining Stadio Olimpico. Opened in 1936, the 9,500-capacity stadium staged the opening ceremony of the 2009 FINA World Aquatics Championships and in 2016 became the venue for the Global Champions Tour of Rome, an annual equestrian event.",
            "location": "inside the city"
        },
        {
            "name": "Umberto I Shooting Range",
            "classification": "Existing",
            "use": "Shooting, modern pentathlon (shooting)",
            "status": "In use",
            "information": "One of three shooting venues used at the 1960 Olympic Games, it hosted the rapid fire pistol, pistol, rifle three positions, and rifle prone competitions. Italy's national range since 1883 and the home of the TSN Roma club, the venue has staged several world championships, most recently in 1995.",
            "location": "inside the city"
        },
        {
            "name": "Baths of Caracalla",
            "classification": "Existing",
            "use": "Artistic gymnastics",
            "status": "In use",
            "information": "Inaugurated in 217 AD, the Baths of Caracalla were regarded as the most impressive baths of the era and comprised hot and cold swimming baths, covered and open-air gymnasiums, and rooms for gymnastics, wrestling and relaxation. The ground floor of the precinct and a large part of its walls remain intact. The site hosted the Grand Premio di Roma car race between 1947 and 1951. It hosted artistic gymnastics at Rome 1960 and, in the years since the Games, it has been the setting for operas, concerts and dance festivals. It also attracts large numbers of tourists all year round.",
            "location": "inside the city"
        },
        {
            "name": "Acquasanta Golf Club Course",
            "classification": "Existing",
            "use": "Modern pentathlon (running)",
            "status": "In use",
            "information": "",
            "location": "inside the city"
        },
        {
            "name": "Basilica of Maxentius",
            "classification": "Existing",
            "use": "Wrestling",
            "status": "In use",
            "information": "",
            "location": "inside the city"
        },
        {
            "name": "Congress Palace",
            "classification": "Existing",
            "use": "Fencing, modern pentathlon (fencing)",
            "status": "In use",
            "information": "",
            "location": "inside the city"
        },
        {
            "name": "SS Lazio Shooting Club",
            "classification": "Existing",
            "use": "Shooting",
            "status": "Not in use (demolished)",
            "information": "The venue for the trap shooting competition at the 1960 Olympic Games was completely refurbished and equipped with modern trap machines and seating for 2,000 spectators. Founded in 1893, the club continues to host competitive and recreational shooting.",
            "location": "inside the city"
        },
        {
            "name": "Pratoni del Vivaro",
            "classification": "New build",
            "use": "Eventing",
            "status": "In use",
            "information": "Permanent stables and other facilities, including storehouses, were built for the Games. Situated 35 kilometres outside Rome, Pratoni del Vivaro continues to host equestrian events and was the setting for the 2007 European Eventing Championships.",
            "location": "outside the city"
        },
        {
            "name": "Olympic Swimming Stadium",
            "classification": "New build",
            "use": "Swimming, diving, water polo, modern pentathlon (swimming)",
            "status": "In use",
            "information": "Located in the Foro Italico complex, close to the Olympic Stadium, the venue is split into a competition area, comprising the open-air Olympic pool and diving pool, and a swimming instruction area. It is Italy's national swimming and diving centre and has five pools in all (two covered and three uncovered), as well as three gyms. The venue was refurbished to host the 1983 European Aquatics Championships and expanded for the 1994 World Aquatics Championships, which it staged again in 2009. The stadium also staged the 2011 Euroleague Water Polo Final Four and will welcome the European Aquatics Championships again in 2022. The stadium stages national and regional swimming, water polo, artistic swimming and diving competitions, runs lifesaving activities and courses and swim classes, and is open for recreational swimming and educational and social activities.",
            "location": "inside the city"
        },
        {
            "name": "Piscina delle Rose",
            "classification": "New build",
            "use": "Water polo",
            "status": "In use",
            "information": "",
            "location": "inside the city"
        },
        {
            "name": "Flaminio Stadium",
            "classification": "New build",
            "use": "Football",
            "status": "Not in use",
            "information": "The venue hosted group and knockout matches in the men's Olympic football tournament, including the gold-medal match. Built on the site of a stadium used at the 1934 FIFA World Cup, the Stadio Flaminio opened in 1959 and had a capacity of 50,000 at the time. It also featured a heated indoor pool, a fencing gym and wrestling, weightlifting and boxing facilities. In the decades that followed, it served as a major concert venue and as a temporary home for Rome's top football clubs, AS Roma and SS Lazio, during the Stadio Olimpico's renovation for the 1990 FIFA World Cup. It was also the venue for the Italian national rugby team's home Six Nations games between 2000 and 2011, at which point the stadium was closed. Empty and neglected since then, it has survived demolition plans and was awarded funds for refurbishment as part of a major urban renewal plan that includes the regeneration of the Olympic Village.",
            "location": "inside the city"
        },
        {
            "name": "Sports Palace",
            "classification": "New build",
            "use": "Basketball, boxing",
            "status": "In use",
            "information": "",
            "location": "inside the city"
        },
        {
            "name": "Small Sports Palace",
            "classification": "New build",
            "use": "Basketball, weightlifting",
            "status": "Not in use",
            "information": "The first purpose-built venue to be completed for the Games, the venue was home to Rome's leading basketball and volleyball teams for many years. Though it closed in 2018, plans have been approved for a EUR 3 million refurbishment and redevelopment of the site, which will restore its status as a major sporting venue open to the city's clubs and schools.",
            "location": "inside the city"
        },
        {
            "name": "Rome Olympic Velodrome",
            "classification": "New build",
            "use": "Cycling (track), hockey",
            "status": "Not in use (demolished)",
            "information": "The field hockey matches were held on the pitch in the middle of the velodrome. The track hosted cycling competitions up until 1968, when problems with the foundations of the stands were detected, leading to their closure. The track was still used for training, however, while the infield continued to be used for hockey and football until 2006. The velodrome was demolished in 2008. A series of legal disputes since then have prevented the site from being cleared and re-used.",
            "location": "inside the city"
        },
        {
            "name": "Cesano Shooting Range",
            "classification": "New build",
            "use": "Shooting",
            "status": "Not in use (demolished)",
            "information": "A shooting range was set up for the long-distance rifle events at the Italian Infantry School in Cesano. Though the school continues to operate, the Olympic range has since been dismantled.",
            "location": "outside the city"
        },
        {
            "name": "Olympic Village",
            "classification": "New build",
            "use": "Athlete accommodation",
            "status": "In use",
            "information": "Built in what was a run-down part of the Italian capital, the Village opened in July 1960 and admitted its first residents, as planned, after the Games were over. It fell into decline in the 1970s, when the body that maintained it was disbanded. Crime became a problem in the area in the years thereafter. Regeneration came in the 2000s, thanks in part to the opening of a number of cultural sites and architectural projects in the surrounding area, including the Parco della Musica to the south of the Village in 2002, and the Maxxi National Museum of 21st Century Arts in 2009. The Village, which is made up of 33 buildings comprising 1,800 apartments and is home to 6,500 people, is set to undergo further redevelopment as part of an extensive urban renewal project that includes the refurbishment of the Stadio Flaminio.",
            "location": "inside the city"
        },
        {
            "name": "Communal Stadium, Florence",
            "classification": "Existing",
            "use": "Football",
            "status": "In use",
            "information": "",
            "location": "outside the city"
        },
        {
            "name": "Communal Stadium, L'Aquila",
            "classification": "Existing",
            "use": "Football",
            "status": "In use",
            "information": "",
            "location": "outside the city"
        },
        {
            "name": "Communal Stadium, Grosseto",
            "classification": "Existing",
            "use": "Football",
            "status": "In use",
            "information": "",
            "location": "outside the city"
        },
        {
            "name": "Ardenza Stadium",
            "classification": "Existing",
            "use": "Football",
            "status": "In use",
            "information": "",
            "location": "outside the city"
        },
        {
            "name": "Passo Corese",
            "classification": "Existing",
            "use": "Modern pentathlon (equestrian)",
            "status": "In use",
            "information": "",
            "location": "outside the city"
        },
        {
            "name": "Bay of Naples",
            "classification": "Existing",
            "use": "Sailing",
            "status": "In use",
            "information": "",
            "location": "outside the city"
        },
        {
            "name": "Adriatico Stadium",
            "classification": "New build",
            "use": "Football",
            "status": "In use",
            "information": "",
            "location": "outside the city"
        },
        {
            "name": "Fuorigrotta Stadium",
            "classification": "New build",
            "use": "Football",
            "status": "In use",
            "information": "",
            "location": "outside the city"
        },
        {
            "name": "Lake Albano",
            "classification": "New build",
            "use": "Rowing, canoe sprint",
            "status": "In use",
            "information": "The lake has been the venue for several major rowing competitions, from the Italian Championships to European Championships, since 1903. It is home to several sailing clubs and the Italian Canoeing and Kayaking Federation (FICK). Italy's national canoe and kayak teams train there. Popular with tourists, it offers a range of recreational water activities and sports, as well as opportunities for sunbathing and hiking. There are several restaurants on its shores. The grandstand and judges' tower built for the Games have fallen into disrepair. Though their demolition has been discussed, they remain standing, as do the concrete piles installed at Games time at either end of the lake to hold the lane-marking system in place.",
            "location": "outside the city"
        }
    ],
}


def main():
    find_stadium_matches (
        test_data["geoJson"],  # GeoJSON venues with associated_names
        test_data["json"],  # JSON venues with name
        name_key1='associated_names',  # Key for GeoJSON venue names
        name_key2='name',  # Key for JSON venue names
        debug=True,
        loglevel="DEBUG",
    )

if __name__ == "__main__":
    main()
