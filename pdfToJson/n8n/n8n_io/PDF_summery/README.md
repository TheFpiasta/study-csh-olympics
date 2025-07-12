- workflow ist darauf ausgelegt eine PDF Datei je Ordner zu chunked und analysieren.
- Full-report-venues-post-games-use.pdf ist in drei Dateien aufgeteilt:
  - alle Sommer Spiele
  - alle Winter Spiele
  - extra Informations Seiten (Außer Title, Abstract, Table of Contents und credits Sentient)
- Sommer und Winter Spiel PDFs werden mit "summery" prompts behandelt, die extra PDF mit "result" prompts.


- summer venues: 1929 Uhr - 20:27 Uhr
- ca 5$ API costs

- winter
  - from 14,12 USD - 14,83 USD
  - from 20:50 Uhr - 21:00 Uhr
  - error nach 06: "The service failed to process your request: Overloaded"
  - --> neustart ...
  - --> ai limits müssen beachtet werden
  - neu:
  - from 14,83 USD - 17,14 USD
  - from 21:06 Uhr - 21:30 Uhr
  - error in llm (offline?)
  - weiter bei 19_Salt_Lake_City
  - --> regex mit $ enden lassen, behebt das teil weiße zu viel splitten der pdf
  - --> einführung einer start chunk by count variable, um nicht alles wiederholen zu müssen 
  - ==> ausersehen reset wintergames ... alles noch mal neu machen

- ein winter game headline startet nicht mit text, sondern direkt mit dem JAhr
  - --> regex am Anfang nur mir .* statt .+ beginnen lassen
