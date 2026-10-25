# SuperDaily

Tägliche Routinen für zwei Personen, als Web-App (PWA) fürs Handy. Design: Nocturne.

- **Heute**: Abhakliste nach Tageszeit oder Kacheln mit Fortschrittsringen für beide
- **Kalender**: Tag, Woche, Monat oder freier Zeitraum mit Tagesquote und Quote je Routine
- **Raster**: Routinen × Tage für den gewählten Zeitraum, jedes Kästchen abhakbar
- **Routinen**: anlegen, bearbeiten, löschen. Wiederholung täglich, an Wochentagen, alle X Tage, monatlich oder X-mal pro Woche. Für eine Person, für beide einzeln oder gemeinsam (ein Haken für beide)
- **Mehr**: Namen, „Ich bin“, Haushalts-Code, Export/Import als JSON

Ohne Firebase-Konfiguration läuft die App im lokalen Modus (Daten nur im Browser dieses Geräts).

---

## 1. Repository anlegen und veröffentlichen (GitHub Pages)

1. Auf github.com oben rechts **+ → New repository**, Name `SuperDaily`, Public, **Create repository**.
2. **Add file → Upload files**, den gesamten Inhalt dieses Ordners hineinziehen (nicht den Ordner selbst), **Commit changes**.
3. **Settings → Pages**: Source „Deploy from a branch“, Branch `main`, Ordner `/ (root)`, **Save**.
4. Nach ein bis zwei Minuten läuft die App unter `https://<dein-github-name>.github.io/SuperDaily/`.

Oder per Terminal:

```bash
cd SuperDaily
git init && git add . && git commit -m "SuperDaily"
git branch -M main
git remote add origin https://github.com/<dein-github-name>/SuperDaily.git
git push -u origin main
```

## 2. Firebase einrichten (Sync zwischen euren Handys)

1. <https://console.firebase.google.com> → **Projekt hinzufügen**, Name z. B. `superdaily`. Google Analytics kannst du abschalten.
2. **Build → Authentication → Jetzt starten → Anbieter „E-Mail/Passwort“** aktivieren, speichern.
3. **Authentication → Einstellungen → Autorisierte Domains → Domain hinzufügen**: `<dein-github-name>.github.io`
4. **Build → Firestore Database → Datenbank erstellen**, Standort `eur3 (europe-west)`, „Im Produktionsmodus starten“.
5. In Firestore auf **Regeln**, den Inhalt von `firestore.rules` aus diesem Ordner einfügen, **Veröffentlichen**.
6. **Projektübersicht → Zahnrad → Projekteinstellungen → Deine Apps → Web (`</>`)**, App-Name `SuperDaily`, registrieren. Hosting nicht ankreuzen.
7. Den angezeigten `firebaseConfig`-Block kopieren und in `firebase-config.js` statt `null` eintragen (Beispiel steht in der Datei). Datei auf GitHub aktualisieren.

Der Firebase-`apiKey` ist kein Geheimnis und darf im öffentlichen Repo stehen; geschützt werden die Daten durch Login und die Firestore-Regeln.

## 3. Erste Anmeldung

1. Simon öffnet die App, **Registrieren** mit E-Mail und Passwort.
2. **Neuen Haushalt anlegen**, Namen prüfen, „Ich bin: Simon“. Der Haushalts-Code steht danach unter **Mehr**.
3. Irina registriert sich auf ihrem Handy, wählt **Mit Code beitreten**, gibt den Code ein und „Ich bin: Irina“.
4. Ein Haushalt nimmt genau zwei Personen auf.

**Aufs Handy legen:** iPhone: Safari → Teilen → „Zum Home-Bildschirm“. Android: Chrome → Menü → „App installieren“.

## 4. Änderungen einspielen

1. Geänderte Datei (meist `app.js` oder `app.css`) herunterladen.
2. Im Repo **Add file → Upload files**, Datei hineinziehen (überschreibt die alte), kurze Commit-Nachricht, **Commit changes**.
3. Nach ca. 1 Minute ist die neue Version live. Auf dem Handy die App einmal schließen und neu öffnen. Wenn noch die alte Version kommt, ein zweites Mal (der Service Worker lädt im Hintergrund nach).

Ältere Stände findest du unter **Commits** im Repo. Dort kannst du jede Datei vergleichen oder wiederherstellen.

## Wenn etwas nicht geht

- **„auth/unauthorized-domain“** beim Login: Schritt 2.3, Domain `<dein-github-name>.github.io` fehlt.
- **„Missing or insufficient permissions“**: Die Regeln aus `firestore.rules` wurden nicht veröffentlicht (Schritt 2.5).
- **App bleibt im lokalen Modus**: In `firebase-config.js` steht noch `null`, oder die Datei ist auf GitHub nicht aktualisiert.
- **Seite 404**: Pages ist nicht auf `main` / `(root)` gestellt, oder `index.html` liegt in einem Unterordner statt im Repo-Stamm.

## Dateien

| Datei | Inhalt |
| --- | --- |
| `index.html` | Einstieg, lädt Schrift, Icons, Styles und App |
| `app.js` | Gesamte App-Logik und Oberfläche |
| `app.css` | App-Styles auf Basis der Nocturne-Tokens |
| `nocturne.css` | Nocturne-Designsystem (Farben, Schrift, Abstände) |
| `firebase-config.js` | Deine Firebase-Konfiguration |
| `firestore.rules` | Sicherheitsregeln für Firestore |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline-Fähigkeit und Installation |

## Datenmodell (Firestore)

```
users/{uid}                 { hh: "K7Q2XM", person: "a" | "b" }
households/{code}           { members: [uid, uid], names: {a, b}, routines: { id: Routine } }
households/{code}/days/{YYYY-MM-DD}   { "a|<routineId>": true, "b|<routineId>": true, "s|<routineId>": true }

Routine { id, title, slot: "Morgen"|"Tagsüber"|"Abend", who: "a"|"b"|"ab"|"s",
          rep: { type: "daily" } | { type: "weekdays", days: [0..6] } | { type: "every", n }
             | { type: "monthly", day } | { type: "perweek", n },
          created: "YYYY-MM-DD", createdAt }
```

`who`: `ab` = beide einzeln (jede Person hakt selbst ab), `s` = gemeinsam (ein Haken zählt für beide).
