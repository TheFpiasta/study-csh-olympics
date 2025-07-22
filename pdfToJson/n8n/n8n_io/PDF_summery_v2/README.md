# PDF Summery Workflow V2

- es gab eineige diskripanzen zwischen dem extrahierten und den erwarteten Anzahlen an venues
- problem: tabellen auf mehreren Seiten und venues außerhalb von den citys wurden teilweise nicht korrekt extrahiert
- solution: prompt angepasst
  - die tabellen werden jetzt auf jeder seite extrahiert
  - venues außerhalb von den citys werden jetzt auch extrahiert
- weiterhin wird jetzt auch aufgenommen, ob die venue in der city ist oder nicht
- der country tag is korrigiert worden zum city tag
- die headline erkennung wurde um edgecases erweitert
- bei der validierung wurden einige verbesserungen vorgenommen:
  - json format wird mitgeliefert
  - angabe der korrigierte values wurde verfeinert