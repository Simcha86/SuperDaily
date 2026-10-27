---
name: release-docs
description: Pflicht bei jeder neuen SuperDaily-Version (CHANGES in app.js, CACHE in sw.js erhöht) und wenn docs/stand.json eine ältere Version nennt als die App. Erzeugt Anleitung, Versionsvergleich, Release Notes und Screens neu und aktualisiert die Figma-Datei.
---
# Unterlagen zur neuen Version

Zu jeder Version gehören fest in `docs/`: **Anleitung** (`SuperDaily-Anleitung.pptx` + PDF), **Vergleich** neue gegen vorherige Version (`SuperDaily-Vergleich.pptx` + PDF), **Release Notes** (`releasenotes/vN.md`), **Screens** (`screens/`) und die **Figma-Datei** aus `docs/figma.json`. Alles kommt in denselben Pull Request wie die Version, oder direkt danach in einen eigenen.

## 1. Texte prüfen (vor dem Erzeugen)

- `docs/tools/releases.js`: Eintrag für die neue Version anlegen: `summary` (ein Satz), `screens` (Key → ein Satz zur sichtbaren Änderung, für jeden Screen, der sich ändert), `todo` (was die beiden nach dem Update tun müssen, z. B. Firestore-Regeln veröffentlichen).
- Neuer Bildschirm oder neuer Zustand in der App → in `docs/tools/screens.js` unter `SCREENS` eintragen (Key nie umbenennen, er ist der Rahmenname in Figma). Geänderter Ablauf für „neuer Bereich und gemeinsame Routine“ → `FLOW_STEPS`.
- Funktion neu oder anders → Folientexte in `docs/tools/anleitung.js` anpassen. Nur Fakten aus `app.js` schreiben.

## 2. Erzeugen

```bash
cd docs/tools && npm install && npm run docs
```

Dauert einige Minuten (Playwright mit Chromium nötig, LibreOffice für die PDFs). Das Skript findet die vorherige Version selbst über die Git-Historie. Danach:

- Ausgabe lesen: Welche Screens gelten als verändert? Jeder davon braucht einen Satz in `releases.js`. Fehlt einer, ergänzen und erneut erzeugen.
- Folien ansehen (PDF in Bilder umwandeln und prüfen): kein Text abgeschnitten, Screens passen zur Beschreibung.

## 3. Figma aktualisieren (Figma-MCP)

Datei und Seiten stehen in `docs/figma.json`. `create_session` mit dem `fileKey`, dann:

**Seite „Übersicht“** (`pages.uebersicht.id`):
1. Seitennamen auf `Screens · Version N` setzen, die Kopfzeile (Text unter „SuperDaily · alle Screens“) auf Version, Commit, Datum und Anzahl der Screens.
2. Rahmen per Name finden (Name = Key in `docs/screens/screens.json`). Für neue Keys im passenden Abschnitt (Section = Gruppe) einen Rahmen wie die vorhandenen anlegen: 390 × 844, Radius 36, Kontur 10 px `#16211F` außen, Schatten, darüber Titel (22 Bold) und Beschreibung (16 Regular) in Plus Jakarta Sans. Rahmen zu Keys, die es nicht mehr gibt, entfernen.
3. `upload_assets` mit den `nodeIds` aller Rahmen, dann je Rahmen `docs/screens/<key>.png` als `multipart/form-data` an die zurückgegebene URL senden (Rahmen-ID und Datei in derselben Reihenfolge).

**Seite „Anleitung“** (`pages.anleitung.id`):
1. Rahmen beginnen mit der Schrittnummer (`03 · …`). Daten in `docs/screens/anleitung/flow.json`.
2. Je Rahmen die Kinder „Hier tippen“ löschen und aus `hl` neu anlegen: Rechteck x−6, y−6, Breite +12, Höhe +12, Radius 14, Kontur 4 px `#E11D48`, Füllung `#E11D48` mit 6 % Deckkraft, Schatten-Glühen.
3. Titel und Texte der Schritte angleichen, falls sie sich geändert haben. Bilder `flow-NN.png` wie oben hochladen.

Zum Schluss je Seite ein Screenshot (`get_screenshot`) zur Kontrolle.

Wird `mcp.figma.com` beim Hochladen mit 403 abgewiesen: In den Einstellungen der Umgebung unter Netzwerkzugriff → Erlaubte Domains `mcp.figma.com` eintragen. Das kann nur die Person selbst.

## 4. Abschließen

`docs/` committen (Nachricht z. B. „Unterlagen zu Version N“). `docs/stand.json` nennt danach Version und Commit, auf denen die Unterlagen beruhen.
