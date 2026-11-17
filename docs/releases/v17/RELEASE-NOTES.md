# SuperDaily – Version 17 · 17. November 2026

## Neu
- **Steuerrelevant:** Beim Eintragen einer Ausgabe gibt es den Schalter „Steuerrelevant“ (Standard: aus). Schneller geht es mit „#steuer“ im Satz, z. B. „Optiker 89 #steuer“.
- Steuerrelevante Ausgaben tragen in der Liste das Kennzeichen „steuerrelevant“.
- **Filter „Nur steuerrelevant“** mit Summe für den Monat und das ganze Jahr. Er erscheint, sobald es die erste steuerrelevante Ausgabe gibt.
- Im Bearbeiten-Fenster lässt sich das Kennzeichen ein- und ausschalten.

## Vor dem Update zu tun
- Nichts von Hand. Die Firebase-Regeln erlauben das neue Feld; die GitHub Action veröffentlicht sie beim Merge.

## Noch nicht enthalten
- Spalte im Export: kommt mit dem Export selbst (#45).
- Unterkategorien, bei denen der Schalter schon an ist (optionaler Punkt aus #57).

## Getestet
- Regeln 99/99 · Browser-Tests 66/66 (neu: Schalter, „#steuer“, Kennzeichen, Filter mit Summen, Ausschalten; Zwei-Personen-Test sieht das Kennzeichen)
- Nicht getestet: auf echtem iPhone und Pixel.
