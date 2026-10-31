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
| `firestore.rules` | Sicherheitsregeln; Simon veröffentlicht sie von Hand in der Firebase-Konsole |
| `firebase-config.js` | Echte Web-Konfiguration des Projekts `superdaily-c7408` (kein Geheimnis) |
| `sw.js` | Service Worker; Konstante `CACHE` |
| `CHANGELOG.md` | Änderungen je Version |
| `docs/releases/v<N>/` | Release Notes und ggf. Vergleichs-PowerPoint je Version (ab Version 6) |
| `tests/` | Tests nach Skill **app-tests** (Regeln, Zwei Personen, Regression, Klick); Anleitung in `tests/README.md` |

Keine Abhängigkeiten oder Build-Werkzeuge in die App einbauen. Externe Bibliotheken nur mit fester Version (Phosphor-Symbole 2.1.1, Firebase-SDK 10.12.2 von gstatic).

## Design

- Das Design heißt **Minze** (Türkis bis Limette, Schrift Plus Jakarta Sans, hell und dunkel). Simon findet es gut: **nicht verändern**, nur auf seinen Wunsch.
- Neue Teile aus vorhandenen Bausteinen bauen (`sd-card`, `sd-row`, `sd-item`, `sd-chip`, `sd-opt`, `sd-btn`, `sd-hint`, `sd-mini`, Bottom-Sheet `sd-sheet`) und Farben nur über die Tokens (`--color-accent-…`, `--color-neutral-…`, `--sd-grad`, `--sd-a`/`--sd-b`).
- Der Bereich **Aufgaben** hat eine eigene Akzentfarbe **Senfgold** (Simons Wunsch): eigene Rampe für `.sd-scroll[data-tab="aufgaben"]`, `.sd-tasks`, `.sd-tfab`, `.sd-tsheet` am Ende von `theme.css`. Alles andere bleibt Minze.
- Neue Styles ans Ende von `theme.css`, beide Modi beachten (`[data-sd="light"]` dreht die Farbrampen um: 100 = dunkel, 900 = hell).
- Symbole aus Phosphor; vor Verwendung prüfen, dass der Name existiert.

## Personen und Rechte

- Zwei Personen: **a = Simon** (Person 1), **b = Irina** (Person 2). Jedes Konto ist fest einer Rolle zugeordnet (`roles` im Haushalt), danach nicht änderbar.
- Routine `who`: `a`, `b`, `ab` (beide einzeln, jede Person hakt selbst ab) oder `s` (gemeinsam, ein Haken für beide).
- **Alle sehen alles.** Abhaken dürfen beide bei allen Routinen, auch für die andere Person (seit Version 7). Bearbeiten nur bei eigenen sowie `ab`/`s`-Routinen. In der App: `canCheck`, `canEdit`, `viewOnly`; in den Regeln: `editable`, `myRole`.
- **Aufgaben** (seit Version 7): beide dürfen alle Aufgaben vergeben, abhaken, ändern und löschen. Aufgabe `to`: `a`, `b` oder `s` (gemeinsam), `from`: wer sie vergeben hat.
- Rechte immer zweifach umsetzen: in der App (Bedienung ausblenden) **und** in `firestore.rules` (durchsetzen).
- „Heute“ hat seit Version 9 den Umschalter Simon | Irina | Duo (`whoSeg`, `ui.duo`); Duo zeigt beide nebeneinander (`duoListView`, `duoTilesView`). Abhak-Knöpfe tragen `data-p` für die Person; `A.toggle` nimmt sonst `ui.person`.
- Im lokalen Modus (ohne Firebase) gibt es keine Einschränkungen.

## Datenmodell (Firestore)

```
users/{uid}                              { hh, person }
households/{code}                        { members, roles, names, cats }
households/{code}/routines/{id}          Routine (inkl. hist, cat)
households/{code}/days/{a|b|s}_{Datum}   { routineId: true }
households/{code}/tasks/{id}             Aufgabe { title, note, from, to, due, done, doneAt, doneBy, createdAt }
```

- Neue Felder im Haushalt-Dokument müssen in `firestore.rules` bei `affectedKeys().hasOnly([...])` freigegeben werden, sonst schlägt das Speichern fehl.
- Firestore-Regeln können keine Listen oder Maps durchlaufen. Deshalb liegen Routinen und Haken als eigene Dokumente, damit pro Dokument geprüft werden kann.
- Haken-Dokumente heißen `<Rolle>_<Datum>`; die Regeln prüfen das Präfix.

## Verlauf und Statistik

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
4. Bei geänderten Regeln: vollständige `firestore.rules` im Chat zeigen; Simon veröffentlicht sie **vor** dem Merge.

Aktueller Stand: Version 9, `CACHE = 'superdaily-v10'`.

## Testen

- Alle Tests: im Ordner `tests/` `npm install`, dann `npm test` (Regeln, danach Browser-Tests mit Auth- und Firestore-Emulator). Vor jedem Release müssen alle grün sein; neue Funktionen bekommen neue Tests im selben Pull Request.
- `tests/hilfen.js` lädt `firestore.rules` selbst in den Emulator und hängt die Emulator-Verbindung an zwei Ankerzeilen in `app.js` ein (`const auth = A.getAuth(app);`, `fb = { A, F, auth, db };`). Werden diese Zeilen geändert, `hilfen.js` mit anpassen.
- Beispieldaten: Simon und Irina, fünf Routinen (gemeinsam, beide einzeln, je eine pro Person), drei Wochen Verlauf.
- Für Zwei-Personen-Tests die App mit Test-Konfiguration gegen Auth- und Firestore-Emulator starten (`connectAuthEmulator`, `connectFirestoreEmulator`, Projekt `demo-…`), nie mit der echten `firebase-config.js`.
- In Cloud-Sitzungen sind gstatic, Google Fonts und GitHub Pages gesperrt: Firebase-SDK 10.12.2 aus npm, Plus Jakarta Sans aus `@fontsource/plus-jakarta-sans`, Phosphor aus `@phosphor-icons/web@2.1.1` über Playwright-`route` ausliefern.
