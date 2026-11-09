# Änderungsprotokoll

Die aktuelle Version steht in der App unter **Mehr → Über SuperDaily**. Bei jeder Veröffentlichung hier, in `CHANGES` am Anfang von `app.js` und bei `CACHE` in `sw.js` ergänzen.

## Version 11 · 7. November 2026 · [Release Notes](docs/releases/v11/RELEASE-NOTES.md)

**Routinen vorgeben**
- Simon kann Irina Routinen vorgeben und umgekehrt: Unter „Für wen“ stehen jetzt für beide alle vier Möglichkeiten.
- An vorgegebenen Routinen steht **„vorgegeben von Simon“** bzw. **„vorgegeben von Irina“** (auf Heute und unter Routinen). Bei selbst angelegten steht nichts.
- Beide dürfen alle Routinen bearbeiten, archivieren und wiederherstellen; das Schloss-Symbol entfällt.

**Hinweise**
- Auf „Heute“ erscheint ein Hinweis wie „2 neue Aufgaben von Irina“ oder „1 neue Routine von Simon“, wenn seit dem letzten Blick etwas dazugekommen ist. Antippen öffnet den passenden Tab, das X schließt den Hinweis.

**Einkauf**
- Neue Farbe **Ozeanblau** mit farbigem Hintergrund und Balken „Auf der Liste“, damit der Bereich sofort von den anderen zu unterscheiden ist (vorher Koralle).

## Version 10 · 4. November 2026 · [Release Notes](docs/releases/v10/RELEASE-NOTES.md)

**Einkauf**
- Neuer Tab **Einkauf** in Koralle: eine gemeinsame Einkaufsliste für Simon und Irina, live auf beiden Handys.
- Eintragen mit Menge („Milch – 2“, „500 g Mehl“). Die App sortiert nach Bereichen im Laden (Obst & Gemüse, Brot, Kühlregal, Tiefkühl, Vorrat, Getränke, Süßes, Drogerie); den Bereich könnt ihr ändern.
- Im Laden abhaken → „Im Wagen“; „Erledigte löschen“ räumt auf. Steht etwas schon auf der Liste, kommt ein Hinweis statt eines zweiten Eintrags.
- Vorschläge aus eurem Verlauf: „Häufig gekauft“ und passende Einträge beim Tippen. Funktioniert auch ohne Empfang im Laden.

**Verlauf**
- **Statistik**, **Kalender** und **Raster** sind ein Tab **Verlauf** (Statistik zuerst) mit einem gemeinsamen Zeitraum: Woche, Monat oder Von–bis mit „Letzte 7/30/90 Tage“. In der Statistik wird „Tag“ zur Woche.
- Die Statistik wertet jetzt jeden Zeitraum bis 365 Tage aus. „Je Routine“ gibt es nur noch in der Statistik.
- Leiste unten: Heute · Verlauf · Aufgaben · Einkauf · Routinen · Mehr.

## Version 9 · 31. Oktober 2026 · [Release Notes](docs/releases/v9/RELEASE-NOTES.md)

**Heute: Simon | Irina | Duo**
- Oben wählt ihr, wessen Tag ihr seht: **Simon**, **Irina** oder **Duo**. Der Umschalter ersetzt die runden Knöpfe S/I.
- **Duo** zeigt euch beide nebeneinander, als Liste (je eine Spalte pro Person) oder als Kacheln (Felder S und I). Alle Felder sind abhakbar; gemeinsame Routinen haben ein Feld „Beide“, nicht geplant ist „–“.
- Gemeinsame Routinen tragen in der Liste die Avatare beider Personen.

**Lesbarkeit**
- Nebentext im hellen Modus dunkler, Tasten größer; die Seite verrutscht nicht mehr seitlich.

**Behoben**
- Abhaken an früheren Tagen nutzt die Einstellung dieses Tages (z. B. früher gemeinsam, jetzt beide einzeln).

## Version 8 · 30. Oktober 2026 · [Release Notes](docs/releases/v8/RELEASE-NOTES.md)

- Bei einer Störung von GitHub (dort liegt die App) zeigt SuperDaily nicht mehr die Fehlerseite des Servers, sondern öffnet sich mit der zuletzt gespeicherten Version. Abhaken und Aufgaben laufen weiter über Firebase. Fehlerseiten werden nie mehr als Kopie gespeichert.

## Version 7 · 29. Oktober 2026 · [Release Notes](docs/releases/v7/RELEASE-NOTES.md)

**Aufgaben**
- Neuer Tab **Aufgaben** in Senfgold: Simon und Irina vergeben sich gegenseitig, sich selbst oder gemeinsam einmalige Aufgaben, mit Fälligkeitsdatum und Notiz. Beide dürfen alle Aufgaben abhaken, ändern und löschen.
- Ansichten „Für mich“, „Vergeben“, „Alle“ und „Erledigt“, sortiert nach überfällig, heute, morgen, später und ohne Datum. Eine rote Zahl am Tab zeigt, was für dich fällig ist.
- Fällige Aufgaben stehen ganz oben auf **Heute**.
- **Kalender:** Punkte an den Tagen mit Aufgaben (offen, erledigt, überfällig) und eine Liste der Aufgaben im gewählten Zeitraum.
- **Statistik:** Karte „Aufgaben“ mit erledigt, pünktlich, offen und überfällig je Person sowie wer wem wie viele Aufgaben gegeben hat.

**Geändert**
- Routinen dürfen beide jetzt auch für die andere Person abhaken. Bearbeiten bleibt bei den eigenen und gemeinsamen Routinen.
- Das **Raster** ist jetzt eine Ansicht im Kalender-Tab (Umschalter „Kalender | Raster“).

## Version 6 · 29. Oktober 2026 · [Release Notes](docs/releases/v6/RELEASE-NOTES.md)

- **Beitreten mit Code:** Die Auswahl „Ich bin …“ entfällt. Die App nimmt automatisch die noch freie Person. Bisher konnte man die schon vergebene Person antippen und bekam dann einen Fehler.
- **Vorleseprogramme:** VoiceOver (iPhone) und TalkBack (Android) lesen die Symbole auf Knöpfen nicht mehr als seltsame Zeichen vor. Sichtbar ändert sich nichts.

## Version 5 · 25. Oktober 2026

- Unter **Mehr → Über SuperDaily** stehen die Versionsnummer, die Neuerungen dieser Version und die früheren Versionen.
- Nach einem Update erscheint auf „Heute“ einmalig ein Hinweis „Neu in Version …“. Bei einer neuen Installation erscheint er nicht.

## Version 4 · 25. Oktober 2026 · [Pull Request #4](https://github.com/Simcha86/SuperDaily/pull/4)

**Bereiche**
- Eigene Lebensbereiche unter **Routinen → Bereiche**: anlegen, umbenennen, Symbol per Antippen wechseln, entfernen. Sechs Startvorschläge (Gesundheit, Sport, Familie, Freunde, Haushalt, Sonstiges), alle änderbar, gemeinsam für beide.
- Bereich im Routine-Formular, Routinen-Seite nach Bereichen sortiert, Bereich in der Heute-Liste, Statistik „Nach Bereich“.
- Bestehende Routinen ohne Bereich bekommen einen Vorschlag anhand des Titels.

**Verlauf bleibt richtig**
- Änderungen an Wiederholung oder Person gelten ab heute; vergangene Tage behalten ihre Wertung in Kalender, Raster, Statistik und Serien.
- Löschen wird zu **Archivieren**: ab heute ausgeblendet, die Vergangenheit zählt weiter. Archiv mit Wiederherstellen und endgültigem Löschen.
- „Alle X Tage“ zählt ab dem Tag der Einstellung.

**Firebase:** Regeln erlauben Mitgliedern zusätzlich das Feld `cats`.

## Version 3 · 25. Oktober 2026 · [Pull Request #3](https://github.com/Simcha86/SuperDaily/pull/3)

- **Tab „Statistik“**: Simon und Irina im Vergleich für 7, 30 oder 90 Tage – Quote, perfekte Tage mit Serien, Verlauf je Woche, Wochentage, Routinen nach Quote.
- **Google Analytics**: Bildschirme und Aktionen, ohne Namen und Routine-Titel. Unter Mehr steht, ob es aktiv ist.
- **Rechte pro Person**: Jedes Konto gehört fest zu Simon oder Irina. Beide sehen alles; abhaken und bearbeiten nur eigene Routinen sowie „Beide einzeln“ und „Gemeinsam“. Fremdes nur zum Ansehen, mit Hinweis und Schloss.
- **Firebase verbunden**: Anmeldung und Registrierung, Haushalt per Code, Sync zwischen beiden Handys.
- Neues Datenmodell (Routinen und Haken als eigene Dokumente) und neue Datenbank-Regeln.

## Version 2 · 25. Oktober 2026 · [Pull Request #2](https://github.com/Simcha86/SuperDaily/pull/2)

- Design **„Minze“** (Türkis bis Limette), hell und dunkel; unter Mehr → Darstellung: Automatisch, Hell, Dunkel.
- Schrift Plus Jakarta Sans, neues App-Icon in Minze (auch randlos fürs iPhone).
- Willkommen-Karte mit **Vorlagen**, Vorschläge im Formular.
- Feinschliff: lesbarere Texte und ausgegraute Knöpfe, kleineres Flammen-Kästchen, Raster zeigt immer alle 7 Tage.

## Version 1 · 25. Oktober 2026 · [Pull Request #1](https://github.com/Simcha86/SuperDaily/pull/1)

- Icons in den Ordner `icons/` verschoben; vorher fehlten Home-Bildschirm-Symbol und Offline-Funktion.
- Fortschrittskarte auf „Heute“ mit Ring und Begrüßung, Farbverläufe, leichtes Leuchten im Hintergrund.
- Animationen: Häkchen ploppt auf, kurze Vibration auf Android, Konfetti bei 100 %, Formular gleitet hoch.

## Version 0 · Ausgangsstand

- Routinen für zwei Personen: Heute (Liste und Kacheln), Kalender, Raster, Routinen, Mehr.
- Wiederholungen täglich, Wochentage, alle X Tage, monatlich, X-mal pro Woche; für eine Person, beide einzeln oder gemeinsam.
- Dunkles Design „Nocturne“, Firebase vorbereitet, aber nicht verbunden.
