# SuperDaily – Version 15 · 17. November 2026

## Neu
- **Ausgaben mit zwei Ebenen:** Jede Ausgabe hat eine Kategorie und eine Unterkategorie, zum Beispiel „Tanken & Auto › Tanken“ oder „Lebensmittel › Bäckerei“. Beides ist Pflicht.
- **Beim Eintragen wählen:** Unter dem Eingabefeld stehen die Kategorien, darunter die passenden Unterkategorien. Die App markiert ihren Vorschlag (bekanntes Geschäft oder Wortteile). Ein Tipp ändert ihn.
- **Kategorien selbst pflegen:** Verwaltung → Ausgaben-Kategorien. Kategorien und Unterkategorien anlegen, umbenennen, Symbol wechseln. Benutzte werden archiviert (alte Ausgaben behalten sie), unbenutzte gelöscht. Archivierte lassen sich zurückholen. Gilt für euch beide.
- **Zurück-Taste am Handy:** Sie schließt zuerst ein offenes Fenster, dann eine Unterseite und führt dann zu „Heute“. Erst auf „Heute“ verlässt sie die App.

## Geändert
- Jede Ausgabe zeigt einen Stift. Antippen öffnet das Bearbeiten: Betrag, Geschäft, Kategorie, Unterkategorie, Datum, Notiz ändern oder die Ausgabe löschen.
- Tippt man im Monatsüberblick eine Kategorie an, zeigt die App deren Unterkategorien mit Beträgen.
- Nach dem Eintragen zeigt die App, was gespeichert wurde.
- Ausgaben, die vor Version 15 eingetragen wurden, haben noch keine Unterkategorie. Beim nächsten Bearbeiten fragt die App danach.

## Vor dem Update zu tun
- Nichts von Hand. Die Firebase-Regeln ändern sich (Kategorien-Liste im Haushalt, Unterkategorie an der Ausgabe). Die GitHub Action veröffentlicht sie beim Merge selbst.

## Getestet
- Regeln 95/95 · Browser-Tests 64/64 (neu u. a.: Haupt- und Unterkategorie beim Eintragen, Kategorien pflegen/archivieren/zurückholen, Irina benennt um und Simon sieht es sofort, zwei Tests zur Zurück-Taste)
- Nicht getestet: auf echtem iPhone und Pixel. Die Zurück-Taste ist im Browser nachgestellt, nicht auf einem echten Android-Handy geprüft.
