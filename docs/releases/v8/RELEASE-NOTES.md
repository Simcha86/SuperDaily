# SuperDaily – Version 8 · 30. Oktober 2026

## Geändert
- Bei einer Störung von GitHub (dort liegt die App) zeigt SuperDaily nicht mehr die Fehlerseite des Servers, sondern öffnet sich mit der zuletzt gespeicherten Version. Abhaken und Aufgaben laufen weiter über Firebase.
- Fehlerseiten des Servers werden nie mehr als Kopie auf dem Handy gespeichert.

## Vor dem Update zu tun
- Nichts. Die Firebase-Regeln bleiben gleich.

## Getestet
- Regeln 56/56 · Browser-Tests 27/27, dreimal hintereinander ohne Fehler
- Neu: Test mit simulierter Server-Störung. Er schlägt mit Version 7 fehl und läuft mit Version 8 durch.
- Nicht getestet: auf echtem iPhone und Pixel. Wirksam wird der Schutz erst, nachdem Version 8 einmal auf dem Handy geladen wurde.
