# Tests für SuperDaily

Die Tests prüfen die App, ohne die echte Firebase-Datenbank anzufassen. Sie laufen gegen Emulatoren (eine Firebase-Kopie auf dem eigenen Rechner) mit dem Testprojekt `demo-superdaily`.

## Was wird geprüft?

| Datei | Inhalt |
| --- | --- |
| `regeln.test.mjs` | 43 Prüfungen der Sicherheitsregeln aus `../firestore.rules`: wer darf lesen, anlegen, ändern, abhaken, beitreten |
| `zwei-personen.spec.js` | Simon und Irina auf je einem „Handy“: Haushalt anlegen und beitreten, Rechte in der Oberfläche, Live-Abgleich |
| `regression/verlauf.spec.js` | Kalender-Quoten vergangener Tage bleiben nach Ändern, Archivieren und Wiederherstellen gleich |
| `klick/*.spec.js` | Klick-Tests im lokalen Modus: Grundfunktionen, Bereiche, Versionsanzeige |
| `beispieldaten.js` | Beispieldaten: Simon und Irina, fünf Routinen, drei Wochen Verlauf |
| `hilfen.js` | Test-Server und Hilfen (siehe unten) |

## Voraussetzungen

- Node.js 20 oder neuer
- Java 21 oder neuer (für die Firebase-Emulatoren)
- Einmalig im Ordner `tests/`: `npm install`
- Ein Chromium für Playwright (`npx playwright install chromium`; in Claude-Cloud-Sitzungen schon vorhanden)

## Starten

Im Ordner `tests/`:

```
npm test              # alles: Regeln, dann alle Browser-Tests
npm run test:regeln   # nur die Sicherheitsregeln
npm run test:app      # nur die Browser-Tests (mit Emulatoren)
npm run test:lokal    # nur Klick- und Regressionstests, ohne Emulatoren
```

Ergebnis: Am Ende steht z. B. `43 bestanden, 0 fehlgeschlagen` bzw. `18 passed`. Bei Fehlern legt Playwright unter `test-results/` eine Aufzeichnung ab (`npx playwright show-trace <Datei>`).

## Wie die Tests funktionieren

- `hilfen.js` startet einen kleinen Server, der die App aus dem Repository ausliefert. Statt der echten `firebase-config.js` bekommt die App eine Test-Konfiguration (lokaler Modus oder Emulator).
- Im Emulator-Modus hängt `hilfen.js` die Verbindung zu den Emulatoren in `app.js` ein. Dafür sucht es zwei Ankerzeilen (`const auth = A.getAuth(app);` und `fb = { A, F, auth, db };`). Ändern sich diese Zeilen, schlagen die Tests mit einem klaren Hinweis fehl.
- Vor den Browser-Tests lädt `hilfen.js` die aktuellen `../firestore.rules` in den Emulator. Ohne Regeln würde der Emulator alles erlauben.
- Firebase-SDK, Schrift und Symbole kommen aus `node_modules`, damit die Tests ohne Internet laufen.
