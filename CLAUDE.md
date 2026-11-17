# SuperDaily – Hinweise für Claude

SuperDaily ist die Routinen-App von Simon und Irina: eine Web-App (PWA) ohne Build-Schritt, live über GitHub Pages unter https://simcha86.github.io/SuperDaily/, Daten über Firebase. Simons allgemeine Arbeitsweise (Sprache, Git, Release Notes, PowerPoint-Frage) steht in seinen Skills **meine-app-entwicklung**, **app-tests** und **e2e-test-generator**. Diese Datei beschreibt nur, was speziell für SuperDaily gilt, und geht bei Widersprüchen vor.

**Diese Datei aktuell halten:** Wenn sich an der App etwas Grundlegendes ändert (Design, Datenmodell, Rechte, Dateien, Ablauf beim Release), diese Datei im selben Pull Request anpassen. Sonst hält eine spätere Sitzung den neuen Stand für einen Fehler.

## Dateien

| Datei | Inhalt |
| --- | --- |
| `index.html` | Einstieg; setzt Hell/Dunkel vor dem ersten Zeichnen, lädt Schrift, Symbole, Styles und `app.js` |
| `app.js` | Gesamte Logik und Oberfläche (HTML als Text, Neuzeichnen über `render()`, Aktionen im Objekt `A` über `data-a`-Attribute) |
| `nocturne.css` | Grund-Designsystem (Tokens, Grundbausteine) – nicht ändern |
| `app.css` | App-Bausteine (`sd-…`-Klassen) |
| `theme.css` | Design „Minze“ hell/dunkel und alle späteren Ergänzungen |
| `firestore.rules` | Sicherheitsregeln; werden nach dem Merge auf `main` automatisch veröffentlicht (`.github/workflows/firebase-regeln.yml`) |
| `.github/workflows/firebase-regeln.yml` | GitHub Action: Regel-Tests, dann Regeln veröffentlichen und zurücklesen. Anmeldung ohne Schlüssel (Workload Identity Federation, nur `Simcha86/SuperDaily` auf `main`) als Konto `github-firebase-rules`, das nur Regeln verwalten darf (`roles/firebaserules.admin`) |
| `firebase-config.js` | Echte Web-Konfiguration des Projekts `superdaily-c7408` (kein Geheimnis) |
| `sw.js` | Service Worker; Konstante `CACHE` |
| `CHANGELOG.md` | Änderungen je Version |
| `docs/releases/v<N>/` | Release Notes und ggf. Vergleichs-PowerPoint je Version (ab Version 6) |
| `tests/` | Tests nach Skill **app-tests** (Regeln, Zwei Personen, Regression, Klick); Anleitung in `tests/README.md` |

Keine Abhängigkeiten oder Build-Werkzeuge in die App einbauen. Externe Bibliotheken nur mit fester Version (Phosphor-Symbole 2.1.1, Firebase-SDK 10.12.2 von gstatic).

## Design

- Das Design heißt **Minze** (Türkis bis Limette, Schrift Plus Jakarta Sans, hell und dunkel). Simon findet es gut: **nicht verändern**, nur auf seinen Wunsch.
- Neue Teile aus vorhandenen Bausteinen bauen (`sd-card`, `sd-row`, `sd-item`, `sd-chip`, `sd-opt`, `sd-btn`, `sd-hint`, `sd-mini`, Bottom-Sheet `sd-sheet`) und Farben nur über die Tokens (`--color-accent-…`, `--color-neutral-…`, `--sd-grad`, `--sd-a`/`--sd-b`).
- Der Bereich **Aufgaben** hat eine eigene Akzentfarbe **Senfgold** (Simons Wunsch): eigene Rampe für `.sd-scroll[data-tab="aufgaben"]`, `.sd-tasks`, `.sd-tfab`, `.sd-tsheet` am Ende von `theme.css`.
- Der Bereich **Ausgaben** (seit Version 13) hat die Akzentfarbe **Violett**: eigene Rampe für `.sd-scroll[data-tab="ausgaben"]`, `.sd-tab[data-v="ausgaben"]`, `.sd-esheet`, Balken `.sd-ebanner`.
- Der Bereich **Einkauf** (seit Version 10) hat die Akzentfarbe **Ozeanblau** (seit Version 11, Simons Wahl; vorher Koralle, war ihm zu wenig unterscheidbar) mit farbigem Hintergrund, Leuchten (`body:has(...)`, `#app:has(...)`) und Balken „Auf der Liste“: eigene Rampe für `.sd-scroll[data-tab="einkauf"]`, `.sd-tab[data-v="einkauf"]`, `.sd-ssheet` am Ende von `theme.css`. Alles andere bleibt Minze.
- Seit Version 12 (Marktreife-Check): Überschriften einfarbig (kein Verlaufstext), im hellen Modus dunkle Schrift auf Verläufen (`--sd-on`), Balken und Knöpfe mit mindestens 4,5 : 1 Kontrast, Tippflächen mindestens 44 px (kleine Kreise mit unsichtbar vergrößerter Trefferfläche). Neue Teile genauso bauen; `tests/klick/barrierefreiheit.spec.js` prüft das.
- Begriffe: „Gemeinsam“ = ein Haken für beide (`s`), „Jeder für sich“ = beide einzeln (`ab`). Keine echten Namen als Standard; Haushalt anlegen mit „Dein Name“ (Person 1) und „Name der zweiten Person“.
- Neue Styles ans Ende von `theme.css`, beide Modi beachten (`[data-sd="light"]` dreht die Farbrampen um: 100 = dunkel, 900 = hell).
- Symbole aus Phosphor; vor Verwendung prüfen, dass der Name existiert.

## Personen und Rechte

- Zwei Personen: **a = Simon** (Person 1), **b = Irina** (Person 2). Jedes Konto ist fest einer Rolle zugeordnet (`roles` im Haushalt), danach nicht änderbar.
- Routine `who`: `a`, `b`, `ab` (beide einzeln, jede Person hakt selbst ab) oder `s` (gemeinsam, ein Haken für beide).
- **Alle sehen alles.** Abhaken dürfen beide bei allen Routinen, auch für die andere Person (seit Version 7). Seit Version 11 dürfen beide auch alle Routinen anlegen (auch für die andere Person), bearbeiten, archivieren und löschen. Feld `from` = wer angelegt hat; ist die Routine für die andere Person, zeigt die App „vorgegeben von …“ (`givenBy`). Die Regeln erlauben `from` beim Anlegen nur als eigene Rolle (`myRole`) und danach unverändert; ältere Routinen haben kein `from`.
- **Aufgaben** (seit Version 7): beide dürfen alle Aufgaben vergeben, abhaken, ändern und löschen. Aufgabe `to`: `a`, `b` oder `s` (gemeinsam), `from`: wer sie vergeben hat.
- **Einkauf** (seit Version 10): beide dürfen alles hinzufügen, abhaken, ändern und löschen.
- **Ausgaben** (seit Version 13): beide dürfen alles eintragen, ändern und löschen. Nur Überblick, kein Ausgleich zwischen den Personen.
- Rechte immer zweifach umsetzen: in der App (Bedienung ausblenden) **und** in `firestore.rules` (durchsetzen).
- „Heute“ hat seit Version 9 den Umschalter Simon | Irina | Duo (`whoSeg`, `ui.duo`); Duo zeigt beide nebeneinander (`duoListView`, `duoTilesView`). Abhak-Knöpfe tragen `data-p` für die Person; `A.toggle` nimmt sonst `ui.person`.
- Hinweise „Neu von …“ auf Heute (seit Version 11): neue Aufgaben und vorgegebene Routinen der anderen Person seit dem letzten Blick; pro Gerät und Person in `localStorage` (`superdaily-seen-items`), beim ersten Start „jetzt“.
- Im lokalen Modus (ohne Firebase) gibt es keine Einschränkungen.

## Datenmodell (Firestore)

```
users/{uid}                              { hh, person }
households/{code}                        { members, roles, names, cats, ecats }
households/{code}/routines/{id}          Routine (inkl. hist, cat, from)
households/{code}/days/{a|b|s}_{Datum}   { routineId: true }
households/{code}/tasks/{id}             Aufgabe { title, note, from, to, due, done, doneAt, doneBy, createdAt }
households/{code}/shop/{id}              Einkauf { title, qty, aisle, open, done, count, by, addedAt, doneAt }
households/{code}/expenses/{id}          Ausgabe { title (Geschäft), amount (Cent), cat, sub, by, date, note?, tax?, createdAt, updatedAt? }
```

- Neue Felder im Haushalt-Dokument müssen in `firestore.rules` bei `affectedKeys().hasOnly([...])` freigegeben werden, sonst schlägt das Speichern fehl.
- Firestore-Regeln können keine Listen oder Maps durchlaufen. Deshalb liegen Routinen und Haken als eigene Dokumente, damit pro Dokument geprüft werden kann.
- Haken-Dokumente heißen `<Rolle>_<Datum>`; die Regeln prüfen das Präfix.
- Ausgaben: Betrag immer in Cent als ganze Zahl (Regeln prüfen `is int`). `title` = Geschäft, **seit Version 16 freiwillig** (leerer Text erlaubt, auch in den Regeln; Anzeige dann über `expName` = Unterkategorie). Eingabe als ein Satz („Rewe 23,80“) über `parseExp`. Kategorien und Regeln angelehnt an Simons App **SuperFinance** (Repository `Simcha86/SuperFinance`): gleiche Hauptkategorien; bekanntes Geschäft → zuletzt gewählte Kategorie (`suggestExp`), sonst Wortteile (`EXP_WORDS`, je `haupt|unter`); optionale Notiz (≤ 500 Zeichen). **Seit Version 15 zwei Ebenen:** Haupt- und Unterkategorie, beide Pflicht beim Eintragen und Speichern (Simons Wahl). Liste im Haushalt-Feld `ecats` (`[{ id, name, icon, off?, subs: [{ id, name, off? }] }]`, ohne Feld gilt `EXP_START`), Pflege unter Verwaltung → Ausgaben-Kategorien (`tabEkat`, Unterseite `ekat`). Benutzte Kategorien werden archiviert (`off: true`), unbenutzte gelöscht; neue Hauptkategorie startet mit Unterkategorie „Allgemein“. Ältere Ausgaben ohne `sub` bleiben gültig; beim Bearbeiten wird die Unterkategorie verlangt. Beim Eintragen: `expCatPick`, `ui.expDraftCat`/`ui.expDraftSub`; ohne Wahl gilt der Vorschlag. **Seit Version 17 steuerrelevant:** Feld `tax: true` (fehlt = nein, Regeln: `is bool`), Schalter beim Eintragen (`ui.expDraftTax`) und im Bearbeiten, „#steuer“ im Satz (`TAX_RE`, wird aus dem Geschäft entfernt), Filter `ui.expTax` mit Monats- und Jahressumme; wie SuperFinance „Steuerrelevant“. Kein Ausgleich/keine Aufteilung zwischen den Personen.
- Einkauf: ein Dokument je Produkt (gleicher Name = gleiches Dokument). `open` = steht auf der Liste, `done` = im Wagen, `count` = wie oft gekauft (für Vorschläge). „Erledigte löschen“ setzt `open: false`, das Dokument bleibt; nur „Ganz löschen“ entfernt es. Bereiche (`aisle`) und Erkennung nach Wortteilen: `AISLES`, `AISLE_WORDS` in `app.js`.

## Verlauf und Statistik

- **Navigation seit Version 14:** Leiste unten mit fünf Bereichen `TABS` = Heute · Aufgaben · Einkauf · Ausgaben · Verwaltung (Aufgaben seit Version 14 eigener Bereich, Zahl der fälligen als Badge daran). Unterseiten (`SUB_PARENT`): Verlauf gehört zu Heute, Routinen, Ausgaben-Kategorien (`ekat`) und Einstellungen (`mehr`) zur Verwaltung; sie zeigen oben „Zurück“ (`ui.back`). Kein schwebender Plus-Knopf, sondern große Knöpfe oben (`.sd-bigadd`). In Tests öffnet `tab(seite, 'Routinen'|'Verlauf'|'Mehr')` die Unterseite über die Verwaltung, `tab(seite, 'Aufgaben')` den Bereich direkt.
- **Zurück-Taste** (seit Version 15): `syncHistory()` am Ende von `render()` legt einen Eintrag im Browser-Verlauf an, solange ein Blatt offen, eine Unterseite oder ein anderer Bereich als Heute gewählt ist (`isDeep`); `popstate` schließt Blatt → Unterseite → Heute. Neue Blätter in `isDeep` und im `popstate`-Handler ergänzen. Test: `tests/klick/zurueck.spec.js`.
- **Verlauf** (seit Version 10) mit Umschalter Statistik | Kalender | Raster (`ui.verlauf`, Statistik zuerst) und einem gemeinsamen Zeitraum `ui.cal`; in der Statistik wird „Tag“ zur Woche (`verlaufRange`).

- **Vergangenheit bleibt richtig:** Ändert sich Wiederholung oder Person einer Routine, wird die alte Einstellung in `hist` mit `until` = gestern gespeichert (`addVersion`). Berechnungen fragen pro Tag `repAt`/`whoAt`. Nie die aktuelle Einstellung rückwirkend anwenden.
- **Archivieren statt Löschen:** `rep.type = 'off'`; endgültiges Löschen nur über das Archiv.
- „Alle X Tage“ zählt ab `rep.from`.
- Wichtigster Regressionstest: Kalender-Quoten vergangener Tage beider Personen sind nach Änderungen, Archivieren und Wiederherstellen unverändert.

## Anforderungen und Ideen

- Ideen, Wünsche und Fehler stehen als **GitHub Issues** im Repository (Kennzeichnung `idee`, `technik`, `fehler`). Simon kann selbst Einträge anlegen, auch in der GitHub-App.
- Format: **User Story** („Als … möchte ich …, damit …“) mit **Abnahmekriterien** als Checkliste; Vorlagen unter `.github/ISSUE_TEMPLATE/`. Die Abnahmekriterien werden bei der Umsetzung zu Tests.
- Neue Wünsche aus dem Chat nur auf Simons Wunsch als Issue anlegen, und Issues nur umsetzen, wenn Simon es ausdrücklich sagt. Zu Beginn neuer Arbeit die offenen Issues ansehen.
- Ein Pull Request, der einen Eintrag erledigt, nennt ihn mit `Closes #<Nummer>` in der Beschreibung; beim Merge schließt GitHub ihn automatisch.

## Release-Ablauf für SuperDaily

Zusätzlich zu den allgemeinen Schritten aus **meine-app-entwicklung**:

1. Neue Version oben in `CHANGES` am Anfang von `app.js` eintragen (Nutzersicht, 2–4 Punkte). Die App zeigt sie unter Mehr → Über SuperDaily und einmalig als Hinweis nach dem Update.
2. `CACHE` in `sw.js` um eins erhöhen.
3. `CHANGELOG.md` und `docs/releases/v<N>/RELEASE-NOTES.md` ergänzen.
4. Bei geänderten Regeln: vollständige `firestore.rules` im Chat zeigen. Seit Version 13 veröffentlicht die GitHub Action sie nach dem Merge selbst (Ergebnis unter Actions → „Firebase-Regeln veröffentlichen“; bei Fehler rot). Kein Anmelde-Code mehr nötig. Schlägt die Action fehl, gelten die alten Regeln weiter.

Aktueller Stand: Version 17, `CACHE = 'superdaily-v18'`.

## Testen

- Alle Tests: im Ordner `tests/` `npm install`, dann `npm test` (Regeln, danach Browser-Tests mit Auth- und Firestore-Emulator). Vor jedem Release müssen alle grün sein; neue Funktionen bekommen neue Tests im selben Pull Request.
- `tests/hilfen.js` lädt `firestore.rules` selbst in den Emulator und hängt die Emulator-Verbindung an zwei Ankerzeilen in `app.js` ein (`const auth = A.getAuth(app);`, `fb = { A, F, auth, db };`). Werden diese Zeilen geändert, `hilfen.js` mit anpassen.
- Beispieldaten: Simon und Irina, fünf Routinen (gemeinsam, beide einzeln, je eine pro Person), drei Wochen Verlauf.
- Für Zwei-Personen-Tests die App mit Test-Konfiguration gegen Auth- und Firestore-Emulator starten (`connectAuthEmulator`, `connectFirestoreEmulator`, Projekt `demo-…`), nie mit der echten `firebase-config.js`.
- In Cloud-Sitzungen sind gstatic, Google Fonts und GitHub Pages gesperrt: Firebase-SDK 10.12.2 aus npm, Plus Jakarta Sans aus `@fontsource/plus-jakarta-sans`, Phosphor aus `@phosphor-icons/web@2.1.1` über Playwright-`route` ausliefern.
