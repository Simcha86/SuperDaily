# SuperDaily – Version 10 · 4. November 2026

## Neu
- **Einkauf:** Ein eigener Tab mit einer gemeinsamen Einkaufsliste für Simon und Irina, in der Farbe Koralle. Was eine Person einträgt, sieht die andere sofort.
- Eintragen geht schnell, auch mit Menge: „Milch – 2“, „500 g Mehl“ oder „Brötchen 6“.
- Die Liste ist nach Bereichen im Laden sortiert (Obst & Gemüse, Brot, Kühlregal, Tiefkühl, Vorrat, Getränke, Süßes, Drogerie). Die App erkennt den Bereich am Namen; antippen und ändern geht jederzeit.
- Im Laden abhaken: Der Eintrag wandert nach „Im Wagen“. „Erledigte löschen“ räumt auf.
- Steht etwas schon auf der Liste, kommt ein Hinweis statt eines zweiten Eintrags.
- **Vorschläge:** „Häufig gekauft“ zeigt, was ihr oft kauft; beim Tippen erscheinen passende Einträge. Ein Tipp setzt sie wieder auf die Liste.
- Funktioniert auch mit schlechtem Empfang im Laden; die Änderungen werden nachgereicht.

## Geändert
- **Verlauf:** Statistik, Kalender und Raster sind jetzt ein Tab „Verlauf“. Oben wählt ihr die Ansicht (Statistik zuerst) und einen gemeinsamen Zeitraum: Woche, Monat oder Von–bis mit „Letzte 7 / 30 / 90 Tage“.
- Die Statistik wertet jetzt jeden Zeitraum bis 365 Tage aus (bisher nur 7, 30 oder 90 Tage).
- „Je Routine“ steht nur noch in der Statistik, mit euch beiden im Vergleich.
- Die Leiste unten: Heute · Verlauf · Aufgaben · Einkauf · Routinen · Mehr.

## Vor dem Update zu tun
- **Firebase-Regeln aktualisieren** (neue Einkaufsliste). Ohne neue Regeln lässt sich nichts auf die Liste setzen. Anleitung im Pull Request.

## Getestet
- Regeln 70/70 · Browser-Tests 42/42 (neu: 6 Einkauf, 4 Verlauf, 1 Einkauf mit zwei Handys inklusive Funkloch)
- Nicht getestet: auf echtem iPhone und Pixel.
