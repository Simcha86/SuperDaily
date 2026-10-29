# SuperDaily – Version 7 · 29. Oktober 2026

## Neu
- **Aufgaben:** Simon und Irina vergeben sich gegenseitig, sich selbst oder gemeinsam einmalige Aufgaben, mit Fälligkeitsdatum und Notiz. Beide dürfen alle Aufgaben abhaken, ändern und löschen. Der Bereich hat eine eigene Farbe (Senfgold).
- Ansichten „Für mich“, „Vergeben“, „Alle“ und „Erledigt“, sortiert nach überfällig, heute, morgen, später und ohne Datum. Eine rote Zahl am Tab zeigt, was für dich fällig ist.
- Fällige Aufgaben stehen ganz oben auf **Heute**.
- **Kalender:** Punkte an Tagen mit Aufgaben (gelb offen, blass erledigt, rot überfällig) und eine Liste der Aufgaben im gewählten Zeitraum.
- **Statistik:** neue Karte „Aufgaben“ mit erledigt, pünktlich, offen und überfällig je Person und wer wem wie viele Aufgaben gegeben hat.

## Geändert
- Routinen dürft ihr jetzt beide auch für die andere Person abhaken. Bearbeiten bleibt bei den eigenen und gemeinsamen Routinen.
- Das **Raster** ist jetzt eine Ansicht im Kalender (Umschalter „Kalender | Raster“). Sein Platz in der unteren Leiste gehört jetzt den Aufgaben.

## Vor dem Update zu tun
- Firebase-Regeln aktualisieren (Anleitung im Pull Request). Ohne neue Regeln lassen sich Aufgaben nicht speichern.

## Getestet
- Regeln 56/56 · Browser-Tests 26/26 (zwei Personen 5, Verlauf 3, Klick 18), dreimal hintereinander ohne Fehler
- Nicht getestet: auf echtem iPhone und Pixel.
