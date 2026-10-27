# Unterlagen zu SuperDaily

Bei jeder neuen Version werden diese Unterlagen neu erzeugt. Welche Version sie zeigen, steht in [`stand.json`](stand.json).

| Was | Datei |
| --- | --- |
| Anleitung | [SuperDaily-Anleitung.pptx](SuperDaily-Anleitung.pptx) · [PDF](SuperDaily-Anleitung.pdf) |
| Vergleich neue gegen vorherige Version | [SuperDaily-Vergleich.pptx](SuperDaily-Vergleich.pptx) · [PDF](SuperDaily-Vergleich.pdf) |
| Release Notes | [releasenotes/](releasenotes/README.md), eine Datei je Version |
| Alle Screens | [screens/](screens/) (Liste mit Titeln in `screens.json`), Schritt-für-Schritt-Ablauf in `screens/anleitung/` |
| Figma | [Screen-Übersicht und Anleitung](https://www.figma.com/design/Y2JslhGzdyjmzXKTL8cKFU), Seiten in [`figma.json`](figma.json) |

Ältere Stände der Anleitung und der Screens findest du in der Git-Historie dieses Ordners.

## Aktualisieren

```bash
cd docs/tools
npm install
npm run docs
```

Das Skript startet die aktuelle und die vorherige Version der App im lokalen Modus mit festen Beispieldaten (Simon und Irina), nimmt alle Screens auf, vergleicht sie und schreibt Anleitung, Vergleich, Release Notes und Screens neu. Danach wird Figma über den Figma-Zugang von Claude aktualisiert. Der vollständige Ablauf steht im Skill [`release-docs`](../.claude/skills/release-docs/SKILL.md).

Voraussetzungen: Node.js, Playwright mit Chromium, für die PDFs LibreOffice.

| Datei in `tools/` | Inhalt |
| --- | --- |
| `screens.js` | Alle Screens und der Schritt-für-Schritt-Ablauf. Neue Screens hier eintragen |
| `anleitung.js` | Folien und Texte der Anleitung |
| `releases.js` | Sätze zu den Änderungen je Version für Vergleich und Release Notes |
| `vergleich.js` | Folien des Versionsvergleichs (automatisch aus den Screens) |
| `release-docs.js` | Ablauf: App vorbereiten, aufnehmen, vergleichen, erzeugen |
| `lib/` | App starten, Screenshots, Bilder, Folien-Design, Release Notes, Beispieldaten |
