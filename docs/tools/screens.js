// Alle Screens der App. Diese Liste steuert Screenshots, Figma-Übersicht und Versionsvergleich.
// Neuer Screen in der App → hier eintragen (key bleibt dauerhaft gleich, er ist auch der Rahmenname in Figma).
// opt: empty = ohne Daten, seen = zuletzt gesehene Version (für „Neu in Version …“), dark = Dunkelmodus
const GROUPS = [
  ['Start', 'Anmeldung, Haushalt und erster Start'],
  ['Heute', 'Der Tag: abhaken als Liste oder Kacheln'],
  ['Kalender', 'Rückblick in vier Zeiträumen'],
  ['Raster', 'Routinen × Tage, jedes Kästchen abhakbar'],
  ['Statistik', 'Simon und Irina im Vergleich'],
  ['Routinen & Bereiche', 'Verwalten, ordnen, archivieren'],
  ['Routine-Formular', 'Neue Routine und Bearbeiten'],
  ['Mehr', 'Einstellungen und Version'],
  ['Dunkelmodus', 'Dieselben Screens in Dunkel']];

const S = (key, group, title, desc, run, opt = {}) => ({ key, group, title, desc, run, opt });
const rep = t => async h => { await h.go('heute'); await h.click('.sd-fab'); await h.fill('[data-in="dTitle"]', 'Tagebuch schreiben'); await h.click(`[data-a="dRep"][data-v="${t}"]`); await h.sheetScroll(99999); };

const SCREENS = [
  S('01-start-anmelden', 'Start', 'Anmelden', 'E-Mail und Passwort, „Passwort vergessen?“', h => h.ui({ screen: 'login', authMode: 'login' }), { empty: true }),
  S('02-start-registrieren', 'Start', 'Registrieren', 'Neues Konto anlegen', h => h.ui({ screen: 'login', authMode: 'register' }), { empty: true }),
  S('03-start-haushalt', 'Start', 'Haushalt', 'Neuen Haushalt anlegen oder mit Code beitreten', h => h.ui({ screen: 'setup' }), { empty: true }),
  S('04-start-willkommen', 'Start', 'Willkommen', 'Leerer Start mit Vorlagen', h => h.go('heute'), { empty: true }),

  S('05-heute-neu-in-version', 'Heute', 'Heute · Neu in Version', 'Einmaliger Hinweis nach einem Update', h => h.go('heute'), { seen: 'prev' }),
  S('06-heute-liste', 'Heute', 'Heute · Liste', 'Fortschrittsring, Tageszeiten, Serien', h => h.go('heute')),
  S('07-heute-liste-unten', 'Heute', 'Heute · Liste unten', 'Abend-Routinen', async h => { await h.go('heute'); await h.scroll(99999); }),
  S('08-heute-kacheln', 'Heute', 'Heute · Kacheln', 'Ringe für beide Personen', h => h.go('heute', { heuteView: 'kacheln' })),
  S('09-heute-gestern', 'Heute', 'Gestern', 'Vergangener Tag über die Tagesleiste', h => h.go('heute', { dayOff: -1 })),
  S('34-heute-andere-person', 'Heute', 'Heute · andere Person', 'Nur ansehen, Hinweis zum Abhaken', h => h.go('heute', { person: 'b' })),

  S('10-kalender-tag', 'Kalender', 'Kalender · Tag', 'Liste eines Tages, abhakbar', h => h.go('kalender', { cal: { mode: 'tag', anchor: 0, from: -29, to: 0 } })),
  S('11-kalender-woche', 'Kalender', 'Kalender · Woche', 'Routinen × 7 Tage', h => h.go('kalender', { cal: { mode: 'woche', anchor: 0, from: -29, to: 0 } })),
  S('12-kalender-monat', 'Kalender', 'Kalender · Monat', 'Farbkalender mit Tagesquote', h => h.go('kalender', { cal: { mode: 'monat', anchor: 0, from: -29, to: 0 } })),
  S('13-kalender-zeitraum', 'Kalender', 'Kalender · Von – bis', 'Eigener Zeitraum, letzte 7/30/90 Tage', h => h.go('kalender', { cal: { mode: 'zeitraum', anchor: 0, from: -29, to: 0 } })),

  S('14-raster-woche', 'Raster', 'Raster · Woche', 'Gesamtquote oben rechts', h => h.go('raster', { grid: { mode: 'woche', anchor: 0, from: -29, to: 0 } })),
  S('15-raster-monat', 'Raster', 'Raster · Monat', 'Seitlich wischen für frühere Tage', h => h.go('raster', { grid: { mode: 'monat', anchor: 0, from: -29, to: 0 } })),

  S('16-statistik-oben', 'Statistik', 'Statistik · Duell', 'Quote, Krone, perfekte Tage', h => h.go('statistik', { stat: 30 })),
  S('17-statistik-verlauf', 'Statistik', 'Statistik · Verlauf', 'Je Woche und nach Wochentag', async h => { await h.go('statistik', { stat: 30 }); await h.toText('.sd-card h2', 'Verlauf je Woche', 90); }),
  S('18-statistik-bereich', 'Statistik', 'Statistik · Nach Bereich', 'Quote je Lebensbereich', async h => { await h.go('statistik', { stat: 30 }); await h.toText('.sd-card h2', 'Nach Bereich', 90); }),
  S('19-statistik-je-routine', 'Statistik', 'Statistik · Je Routine', 'Schwächste Routinen zuerst', async h => { await h.go('statistik', { stat: 30 }); await h.scroll(99999); }),

  S('20-routinen', 'Routinen & Bereiche', 'Routinen', 'Nach Bereichen gruppiert', h => h.go('routinen')),
  S('21-routinen-unten', 'Routinen & Bereiche', 'Routinen unten', 'Weitere Bereiche', async h => { await h.go('routinen'); await h.scroll(99999); }),
  S('35-routinen-archiv', 'Routinen & Bereiche', 'Routinen · Archiv', 'Wiederherstellen oder endgültig löschen', async h => {
    await h.go('routinen'); await h.click('[data-a="edit"][data-r="t"]'); await h.click('[data-a="dArchive"]');
    await h.eval(() => { document.querySelector('.sd-arch').open = true; document.querySelector('.sd-scroll').scrollTop = 99999; });
  }),
  S('22-bereiche', 'Routinen & Bereiche', 'Bereiche', 'Symbol, Name, entfernen, neu anlegen', async h => { await h.go('routinen'); await h.click('[data-a="openCats"]'); }),

  S('23-neue-routine', 'Routine-Formular', 'Neue Routine', 'Titel, Vorschläge, Tageszeit, Bereich', async h => { await h.go('heute'); await h.click('.sd-fab'); }),
  S('24-neue-routine-unten', 'Routine-Formular', 'Neue Routine unten', 'Für wen, Wiederholung, Hinzufügen', async h => { await h.go('heute'); await h.click('.sd-fab'); await h.sheetScroll(99999); }),
  S('25-wiederholung-wochentage', 'Routine-Formular', 'Wiederholung · Wochentage', 'Tage einzeln wählen', rep('weekdays')),
  S('26-wiederholung-alle-x-tage', 'Routine-Formular', 'Wiederholung · Alle X Tage', '2 bis 30 Tage Abstand', rep('every')),
  S('27-wiederholung-monatlich', 'Routine-Formular', 'Wiederholung · Monatlich', 'Tag im Monat', rep('monthly')),
  S('28-wiederholung-x-mal-pro-woche', 'Routine-Formular', 'Wiederholung · X-mal pro Woche', '1 bis 6 Mal, Tage frei', rep('perweek')),
  S('29-routine-bearbeiten', 'Routine-Formular', 'Routine bearbeiten', 'Archivieren oder speichern', async h => { await h.go('routinen'); await h.click('[data-a="edit"][data-r="z"]'); }),
  S('30-routine-bearbeiten-hinweis', 'Routine-Formular', 'Bearbeiten · Hinweis', '„Die Änderung gilt ab heute“', async h => { await h.go('routinen'); await h.click('[data-a="edit"][data-r="z"]'); await h.click('[data-a="dRep"][data-v="weekdays"]'); await h.sheetScroll(99999); }),

  S('31-mehr', 'Mehr', 'Mehr · Einstellungen', 'Namen, Darstellung, Ich bin', async h => { await h.fake(); await h.go('mehr'); }),
  S('32-mehr-haushalt', 'Mehr', 'Mehr · Haushalt & Daten', 'Code, Abmelden, Export, Import, Über SuperDaily', async h => { await h.fake(); await h.go('mehr'); await h.toText('.sd-card h2', 'Haushalt', 90); }),
  S('33-mehr-ueber-superdaily', 'Mehr', 'Mehr · Frühere Versionen', 'Änderungsprotokoll der früheren Versionen', async h => {
    await h.fake(); await h.go('mehr'); await h.eval(() => { document.querySelectorAll('#about details').forEach(d => { d.open = true; }); }); await h.scroll(99999);
  }),

  S('36-dunkel-heute', 'Dunkelmodus', 'Dunkel · Heute', '', h => h.go('heute'), { dark: true }),
  S('37-dunkel-statistik', 'Dunkelmodus', 'Dunkel · Statistik', '', h => h.go('statistik', { stat: 30 }), { dark: true }),
  S('38-dunkel-routinen', 'Dunkelmodus', 'Dunkel · Routinen', '', h => h.go('routinen'), { dark: true })];

// Schritt-für-Schritt-Ablauf für die Anleitung und die Figma-Seite „Anleitung“:
// neuer Bereich „Wir zwei“ und eine gemeinsame Routine für Simon und Irina.
// Jeder Schritt: Titel, Text, Ziel(e) zum Hervorheben, danach die Aktion für den nächsten Schritt.
const FLOW = [
  ['A', 'Bereich anlegen', 'Ein neuer Lebensbereich, z. B. „Wir zwei“'],
  ['B', 'Gemeinsame Routine anlegen', 'Eine Routine für Simon und Irina zusammen'],
  ['C', 'Abhaken', 'Ein Haken zählt für euch beide']];
const catRow = 'Wir zwei';
const FLOW_STEPS = [
  { phase: 'A', title: 'Routinen öffnen', text: 'Unten in der Leiste auf „Routinen“ tippen.', hl: ['[data-a="tab"][data-v="routinen"]'], next: h => h.click('[data-a="tab"][data-v="routinen"]') },
  { phase: 'A', title: 'Bereiche öffnen', text: 'Oben rechts auf „Bereiche“ tippen.', hl: ['[data-a="openCats"]'], next: h => h.click('[data-a="openCats"]') },
  { phase: 'A', title: 'Namen eingeben', text: 'Unten den neuen Bereich eintippen, z. B. „Wir zwei“, dann „Anlegen“.',
    before: async h => { await h.fill('[data-in="catNew"]', catRow); await h.into('[data-a="catAdd"]', null, 'end'); },
    hl: ['[data-in="catNew"]', '[data-a="catAdd"]'], next: h => h.click('[data-a="catAdd"]') },
  { phase: 'A', title: 'Symbol wählen (optional)', text: 'Das Symbol links antippen. Jedes Tippen zeigt das nächste, bis es passt.',
    before: h => h.eval(t => { [...document.querySelectorAll('.sd-catrow')].find(r => r.querySelector('input')?.value === t).scrollIntoView({ block: 'center' }); }, catRow),
    hl: [{ row: catRow }], next: async h => { for (let i = 0; i < 6; i++) await h.eval(t => { [...document.querySelectorAll('.sd-catrow')].find(r => r.querySelector('input')?.value === t).querySelector('.sd-caticon').click(); }, catRow); } },
  { phase: 'A', title: 'Fertig', text: 'Der Bereich gilt sofort für euch beide. Mit „Fertig“ schließen.',
    before: h => h.into('button.sd-btn[data-a="closeSheet"]', null, 'end'), hl: ['button.sd-btn[data-a="closeSheet"]'], next: h => h.click('button.sd-btn[data-a="closeSheet"]') },
  { phase: 'B', title: 'Neue Routine', text: 'Auf den runden +-Knopf unten rechts tippen.', hl: ['.sd-fab'], next: h => h.click('.sd-fab') },
  { phase: 'B', title: 'Titel und Tageszeit', text: 'Titel eintippen, z. B. „Zusammen kochen“, und die Tageszeit wählen.',
    before: async h => { await h.fill('[data-in="dTitle"]', 'Zusammen kochen'); await h.click('[data-a="dSlot"][data-v="Abend"]'); await h.sheetScroll(0); },
    hl: ['[data-in="dTitle"]', '[data-a="dSlot"][data-v="Abend"]'] },
  { phase: 'B', title: 'Bereich und „Gemeinsam“', text: 'Den neuen Bereich „Wir zwei“ wählen. Bei „Für wen“ auf „Gemeinsam“ tippen.',
    before: async h => { await h.clickText('[data-a="dCat"]', catRow); await h.click('[data-a="dWho"][data-v="s"]'); await h.into('[data-a="dWho"][data-v="s"]', null, 'center'); },
    hl: [{ sel: '[data-a="dCat"]', text: catRow }, '[data-a="dWho"][data-v="s"]'] },
  { phase: 'B', title: 'Wiederholung, speichern', text: 'Wiederholung wählen, hier „Täglich“, dann auf „Hinzufügen“ tippen.',
    before: h => h.sheetScroll(99999), hl: ['[data-a="dRep"][data-v="daily"]', '[data-a="dSave"]'], next: h => h.click('[data-a="dSave"]') },
  { phase: 'B', title: 'Kontrolle', text: 'Die Routine steht jetzt unter „Wir zwei“, rechts mit „Gemeinsam“.',
    before: h => h.into('.sd-row', 'Zusammen kochen', 'center'), hl: [{ sel: '.sd-row', text: 'Zusammen kochen' }], next: h => h.click('[data-a="tab"][data-v="heute"]') },
  { phase: 'C', title: 'In „Heute“ abhaken', text: 'Die Routine steht unter „Abend“. Zum Abhaken antippen.',
    before: h => h.into('.sd-item', 'Zusammen kochen', 'center'), hl: [{ sel: '.sd-item', text: 'Zusammen kochen' }], next: h => h.clickText('.sd-item', 'Zusammen kochen') },
  { phase: 'C', title: 'Erledigt', text: 'Der Haken sitzt und zählt für Simon und Irina zugleich.',
    before: h => h.into('.sd-item', 'Zusammen kochen', 'center'), hl: [{ sel: '.sd-item', text: 'Zusammen kochen' }] },
  { phase: 'C', title: 'Zu Irina wechseln', text: 'Oben rechts auf den Kreis „I“ tippen, um Irinas Tag zu sehen.',
    before: h => h.scroll(0), hl: ['[data-a="person"][data-p="b"]'], next: h => h.click('[data-a="person"][data-p="b"]') },
  { phase: 'C', title: 'Auch bei Irina erledigt', text: 'Irina muss nichts mehr tun. Gemeinsame Routinen dürfen beide abhaken.',
    before: h => h.into('.sd-item', 'Zusammen kochen', 'center'), hl: [{ sel: '.sd-item', text: 'Zusammen kochen' }] }];

module.exports = { GROUPS, SCREENS, FLOW, FLOW_STEPS };
