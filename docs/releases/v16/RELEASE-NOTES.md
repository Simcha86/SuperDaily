# SuperDaily – Version 16 · 17. November 2026

## Geändert
- **Geschäft ist freiwillig:** Eine Ausgabe braucht nur noch Betrag, Kategorie und Unterkategorie. Zum Beispiel „4,50“ eintippen, „Lebensmittel“ und „Bäckerei“ antippen, fertig.
- Wer das Geschäft dazuschreibt („Rewe 23,80“), bekommt weiter den Kategorie-Vorschlag.
- Ohne Geschäft zeigt die Liste die Unterkategorie als Namen.
- Im Bearbeiten-Fenster heißt das Feld jetzt „Geschäft (optional)“.

## Vor dem Update zu tun
- Nichts von Hand. Die Firebase-Regeln erlauben jetzt ein leeres Geschäft; die GitHub Action veröffentlicht sie beim Merge.

## Getestet
- Regeln 97/97 · Browser-Tests 65/65 (neu: Ausgabe nur mit Betrag und Kategorie)
- Nicht getestet: auf echtem iPhone und Pixel.
