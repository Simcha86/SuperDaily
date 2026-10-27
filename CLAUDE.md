# SuperDaily

Web-App (PWA) für tägliche Routinen von Simon und Irina. Alles Wichtige steht in `README.md`, die Versionen in `CHANGELOG.md`.

## Neue Version veröffentlichen

1. `CHANGES` am Anfang von `app.js`, `CHANGELOG.md` und `CACHE` in `sw.js` ergänzen (siehe Kopf von `CHANGELOG.md`).
2. Danach immer den Skill **release-docs** ausführen (`.claude/skills/release-docs/SKILL.md`): Anleitung, Versionsvergleich, Release Notes, Screens in `docs/` und die Figma-Datei werden damit aktualisiert. Eine Version ohne aktuelle Unterlagen ist nicht fertig.

Wer `docs/stand.json` mit einer älteren Version findet als `CHANGES[0].v` in `app.js`, holt die Unterlagen mit demselben Skill nach.
