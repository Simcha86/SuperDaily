// Anleitung als PowerPoint. Texte hier pflegen, wenn sich Funktionen ändern; Screens kommen automatisch aus screens.js.
const { C, createDeck, kit } = require('./lib/deck');

// ph(key) = Handy-Bild eines Screens, flow = Ablauf-Schritte mit Handy-Bild (ph)
module.exports = async function buildAnleitung({ version, date, ph, flow, out }) {
  const pres = createDeck({ title: `SuperDaily – Anleitung (Version ${version})`, footer: `SuperDaily · Anleitung · Version ${version}` });
  const H = kit(pres);
  const one = (s, key, alt) => H.phone(s, ph(key), 9.3, 0.75, 6.0, alt);
  const two = (s, a, b, altA, altB) => { H.phone(s, ph(a), 7.0, 0.85, 5.85, altA); H.phone(s, ph(b), 10.05, 0.85, 5.85, altB); };
  const sec = t => pres.addSection({ title: t });
  let s, cur;
  const slide = (m, t) => pres.addSlide({ masterName: m, sectionTitle: t || cur });
  const chapter = async (n, title, body, key) => { cur = title; sec(title); s = slide('KAPITEL'); s.addText(n, { placeholder: 'num' }); s.addText(title, { placeholder: 'title' }); s.addText(body, { placeholder: 'body' }); one(s, key, title); };

  // ===== Titel =====
  cur = 'Einführung'; sec(cur);
  s = slide('TITEL');
  s.addText('SuperDaily', { placeholder: 'title' });
  s.addText([{ text: 'Die Anleitung', options: { bold: true, color: C.white, fontSize: 26, breakLine: true } },
    { text: 'Eure täglichen Routinen, gemeinsam abgehakt.', options: { breakLine: true } },
    { text: `Version ${version} · ${date}`, options: { fontSize: 16, color: C.teal } }], { placeholder: 'body' });
  await H.icon(s, 'PiPlant', 0.8, 1.35, 0.7, C.teal, C.ink);
  H.phone(s, ph('36-dunkel-heute'), 7.1, 0.75, 6.0, 'Heute im Dunkelmodus');
  H.phone(s, ph('06-heute-liste'), 10.1, 0.75, 6.0, 'Heute hell');

  s = slide('INHALT');
  H.head(s, 'Sechs Bereiche, ein Ziel', 'Unten in der App wechselst du zwischen den Bereichen');
  const tabs = [['PiSun', 'Heute', 'Routinen des Tages abhaken, als Liste oder als Kacheln mit Fortschrittsringen'],
    ['PiCalendarBlank', 'Kalender', 'Tag, Woche, Monat oder freier Zeitraum mit Tagesquote und Quote je Routine'],
    ['PiGridFour', 'Raster', 'Routinen × Tage auf einen Blick, jedes Kästchen lässt sich abhaken'],
    ['PiChartBar', 'Statistik', 'Simon und Irina im Vergleich: Quote, perfekte Tage, Verläufe, Bereiche'],
    ['PiListChecks', 'Routinen', 'Nach Bereichen geordnet, mit Bereichs-Verwaltung und Archiv'],
    ['PiGearSix', 'Mehr', 'Namen, Darstellung, Haushalts-Code, Sicherung, Version']];
  for (let i = 0; i < 6; i++) { const [ic, t, d] = tabs[i], x = 0.6 + (i % 3) * 4.15, y = 1.95 + Math.floor(i / 3) * 2.45;
    H.card(s, x, y, 3.85, 2.15); await H.icon(s, ic, x + 0.3, y + 0.3, 0.62); H.tdesc(s, t, d, x + 0.3, y + 1.05, 3.3, 1.0, { tsize: 20 }); }

  // ===== Einrichtung =====
  await chapter('01', 'Los geht’s', 'App aufs Handy legen, anmelden, Haushalt verbinden und die erste Routine anlegen', '01-start-anmelden');
  s = slide('INHALT');
  H.head(s, 'SuperDaily aufs Handy legen', 'Einmal einrichten, danach startet die App wie jede andere');
  const plat = [['iPhone', 'Safari', ['Eure SuperDaily-Adresse in Safari öffnen', 'Unten auf „Teilen“ tippen', '„Zum Home-Bildschirm“ wählen']],
    ['Android', 'Chrome', ['Eure SuperDaily-Adresse in Chrome öffnen', 'Oben rechts das Menü ⋮ öffnen', '„App installieren“ wählen']]];
  for (let i = 0; i < 2; i++) { const [t, b, list] = plat[i], x = 0.6 + i * 3.75;
    H.card(s, x, 1.95, 3.5, 3.85); await H.icon(s, 'PiDeviceMobile', x + 0.3, 2.25, 0.62); H.tdesc(s, t, 'mit ' + b, x + 1.05, 2.27, 2.3, 0.7, { tsize: 20 });
    s.addText(list.map((l, k) => ({ text: l, options: { bullet: { type: 'number' }, breakLine: k < list.length - 1 } })), { x: x + 0.3, y: 3.15, w: 3.0, h: 2.4, fontSize: 15, color: C.ink, valign: 'top', margin: 0, paraSpaceAfter: 10, isTextBox: true }); }
  one(s, '01-start-anmelden', 'Anmelden');

  s = slide('INHALT');
  H.head(s, 'Anmelden & Haushalt', 'Ein Haushalt verbindet genau zwei Personen');
  H.steps(s, [['Simon registriert sich', '„Registrieren“ antippen, E-Mail und Passwort (mind. 6 Zeichen) eingeben'],
    ['Haushalt anlegen', 'Namen prüfen, „Ich bin: Simon“ wählen und „Anlegen“ tippen'],
    ['Code weitergeben', 'Der Haushalts-Code steht danach unter „Mehr“'],
    ['Irina tritt bei', 'Auf ihrem Handy registrieren, „Mit Code beitreten“, Code eingeben, „Ich bin: Irina“']], 0.6, 1.95, 5.6, 1.15);
  two(s, '03-start-haushalt', '32-mehr-haushalt', 'Haushalt anlegen oder beitreten', 'Haushalts-Code unter Mehr');

  s = slide('INHALT');
  H.head(s, 'Die erste Routine in einer Sekunde', 'Beim ersten Start schlägt SuperDaily Vorlagen vor');
  H.text(s, 'Tippe eine Vorlage an und sie ist sofort angelegt, samt passendem Bereich. Oder lege mit „Eigene Routine anlegen“ eine ganz eigene an.', { x: 0.6, y: 1.95, w: 7.0, h: 0.85, fontSize: 16 });
  const tpls = [['PiDrop', 'Glas Wasser nach dem Aufstehen'], ['PiPill', 'Vitamine nehmen'], ['PiPersonSimpleTaiChi', '5 Minuten dehnen'], ['PiSneakerMove', '10 Minuten spazieren'], ['PiBookOpen', '20 Seiten lesen'], ['PiTooth', 'Zahnseide']];
  for (let i = 0; i < 6; i++) { const [ic, t] = tpls[i], x = 0.6 + (i % 2) * 3.6, y = 3.0 + Math.floor(i / 2) * 0.95;
    H.card(s, x, y, 3.35, 0.75); await H.icon(s, ic, x + 0.15, y + 0.13, 0.49, C.mint, C.deep); H.text(s, t, { x: x + 0.78, y, w: 2.5, h: 0.75, bold: true, valign: 'middle' }); }
  one(s, '04-start-willkommen', 'Willkommen mit Vorlagen');

  // ===== Alltag =====
  await chapter('02', 'Der Alltag', 'Abhaken, Routinen anlegen und verstehen, wer was darf', '08-heute-kacheln');
  s = slide('INHALT');
  H.head(s, 'Heute: dein Tag auf einen Blick', 'Antippen = abgehakt. Nochmal antippen = rückgängig');
  [['Person wechseln', 'Die Kreise S und I oben rechts zeigen Simons oder Irinas Tag'], ['Liste oder Kacheln', 'Zwei Ansichten für denselben Tag'],
    ['Tagesleiste', 'Die letzten 7 Tage. Vergessenes einfach nachträglich abhaken'], ['Fortschrittsring', 'Wie viel von heute schon geschafft ist'],
    ['Bereich und Wiederholung', 'Unter jeder Routine, z. B. „Gesundheit · Täglich“'], ['Flamme = Serie', 'Die Zahl zeigt, wie oft in Folge erledigt']]
    .forEach(([t, d], i) => { const x = 0.6 + (i % 2) * 3.65, y = 1.95 + Math.floor(i / 2) * 1.5; H.num(s, i + 1, x, y); H.tdesc(s, t, d, x + 0.62, y - 0.02, 2.9, 1.35); });
  H.card(s, 0.6, 6.25, 7.0, 0.55);
  s.addText([{ text: 'Neue Routine: ', options: { bold: true } }, { text: 'der runde + Knopf unten rechts' }], { x: 0.85, y: 6.25, w: 6.6, h: 0.55, fontSize: 14, color: C.ink, valign: 'middle', margin: 0, isTextBox: true });
  one(s, '06-heute-liste', 'Heute als Liste');

  s = slide('INHALT');
  H.head(s, 'Kacheln und die andere Person', 'Oben die Ringe für beide, darunter die Routinen');
  await H.icon(s, 'PiSquaresFour', 0.6, 1.95); H.tdesc(s, 'Zwei Fortschrittsringe', 'Wie weit ihr beide heute seid. Ring antippen wechselt zur Person.', 1.4, 1.95, 4.9, 1.0);
  await H.icon(s, 'PiHandTap', 0.6, 3.2); H.tdesc(s, 'Kachel antippen = abhaken', 'Jede Kachel zeigt Tageszeit, Titel und Serie.', 1.4, 3.2, 4.9, 1.0);
  await H.icon(s, 'PiEye', 0.6, 4.45); H.tdesc(s, 'Tag der anderen Person', 'Du siehst alles. Abhaken kann die Person selbst, gemeinsame Routinen ihr beide.', 1.4, 4.45, 4.9, 1.2);
  two(s, '08-heute-kacheln', '34-heute-andere-person', 'Kacheln', 'Irinas Tag ansehen');

  s = slide('INHALT');
  H.head(s, 'Eine Routine anlegen', '+ antippen, ausfüllen, „Hinzufügen“');
  H.steps(s, [['Titel', 'Selbst schreiben oder einen Vorschlag antippen'], ['Tageszeit', 'Morgen, Tagsüber oder Abend'], ['Bereich', 'z. B. Gesundheit, Sport oder ein eigener Bereich'],
    ['Für wen', 'Du selbst, beide einzeln oder gemeinsam'], ['Wiederholung', 'Täglich, Wochentage, alle X Tage, monatlich oder X-mal pro Woche']], 0.6, 1.95, 5.6, 0.95);
  two(s, '23-neue-routine', '24-neue-routine-unten', 'Formular oben', 'Formular unten');

  s = slide('INHALT');
  H.head(s, 'Wie oft und für wen', 'Die Optionen im Formular im Überblick');
  H.card(s, 0.6, 1.95, 7.4, 4.75);
  H.text(s, 'Wiederholung', { x: 0.9, y: 2.15, w: 6, h: 0.4, fontSize: 18, bold: true, color: C.deep });
  [['Täglich', 'jeden Tag'], ['Wochentage', 'nur an gewählten Tagen, z. B. Mo bis Fr'], ['Alle X Tage', 'alle 2 bis 30 Tage, gezählt ab heute'],
    ['Monatlich', 'an einem festen Tag, in kurzen Monaten am Monatsletzten'], ['X-mal pro Woche', '1 bis 6 Mal, die Tage wählst du frei']]
    .forEach(([t, d], i) => { const y = 2.72 + i * 0.75; H.chip(s, t, 0.9, y, 2.0); H.text(s, d, { x: 3.1, y, w: 4.7, h: 0.4, valign: 'middle' }); });
  H.card(s, 8.3, 1.95, 4.45, 4.75);
  H.text(s, 'Für wen', { x: 8.6, y: 2.15, w: 4, h: 0.4, fontSize: 18, bold: true, color: C.deep });
  [['Ich', 'nur für dich', C.teal, C.white], ['Beide einzeln', 'jede Person hakt selbst ab', C.mint, C.ink], ['Gemeinsam', 'ein Haken zählt für beide', C.lime, C.ink]]
    .forEach(([t, d, f, c], i) => { const y = 2.72 + i * 1.1; H.chip(s, t, 8.6, y, 1.75, { fill: f, color: c }); H.text(s, d, { x: 10.5, y: y - 0.1, w: 2.1, h: 0.6, valign: 'middle' }); });
  H.text(s, 'Routinen nur für die andere Person legt diese selbst an.', { x: 8.6, y: 6.0, w: 3.9, h: 0.5, fontSize: 13, italic: true, color: C.gray });

  s = slide('INHALT');
  H.head(s, 'Wer darf was?', 'Jedes Konto gehört fest zu einer Person');
  const hc = { bold: true, color: C.white, fill: { color: C.deep }, fontSize: 16, valign: 'middle' };
  const bc = (t, o = {}) => ({ text: t, options: { fontSize: 15, color: C.ink, fill: { color: C.white }, valign: 'middle', ...o } });
  s.addTable([[{ text: 'Routine für', options: hc }, { text: 'Sehen', options: hc }, { text: 'Anlegen, ändern, archivieren', options: hc }, { text: 'Abhaken', options: hc }],
    [bc('Eine Person', { bold: true }), bc('beide'), bc('nur diese Person'), bc('nur diese Person')],
    [bc('Beide einzeln', { bold: true }), bc('beide'), bc('beide'), bc('jede Person ihren eigenen Haken')],
    [bc('Gemeinsam', { bold: true }), bc('beide'), bc('beide'), bc('beide, ein gemeinsamer Haken')]],
  { x: 0.6, y: 1.95, w: 12.1, colW: [2.6, 1.9, 3.5, 4.1], rowH: 0.62, border: { type: 'solid', pt: 1, color: C.line }, margin: [0, 0.15, 0, 0.15], objectName: 'Rechte' });
  H.card(s, 0.6, 4.85, 12.1, 1.45); await H.icon(s, 'PiFolders', 0.9, 5.25, 0.62);
  H.tdesc(s, 'Bereiche gehören euch beiden', 'Anlegen, umbenennen und entfernen kann jede Person. Ausgegraute Routinen gehören der anderen Person.', 1.75, 5.1, 10.7, 1.1);

  // ===== Roter Faden =====
  await chapter('03', 'Schritt für Schritt', 'Neuer Bereich „Wir zwei“ und eine gemeinsame Routine für Simon und Irina', '22-bereiche');
  const PH = { A: 'Bereich anlegen', B: 'Gemeinsame Routine anlegen', C: 'Abhaken' };
  for (let i = 0; i < flow.length; i += 4) {
    const part = flow.slice(i, i + 4);
    s = slide('BREIT');
    s.addText(`Schritt ${part[0].n}–${part[part.length - 1].n}: ${[...new Set(part.map(p => PH[p.phase]))].join(' · ')}`, { placeholder: 'title' });
    const xs = part.map((_, k) => 0.6 + k * 3.1);
    H.bar(s, xs[0] + 0.25, 1.37, (part.length - 1) * 3.1 + (i + 4 < flow.length ? 0.9 : 0), 0.06, C.red);
    for (const [k, st] of part.entries()) {
      const x = xs[k]; H.num(s, st.n, x, 1.15, 0.5, C.red);
      H.tdesc(s, st.title, st.text, x, 1.8, 2.9, 1.05, { tsize: 16 });
      H.phone(s, st.ph, x + 0.2, 2.85, 4.0, `Schritt ${st.n}: ${st.title}`);
    }
  }

  // ===== Auswertung =====
  await chapter('04', 'Rückblick & Auswertung', 'Kalender, Raster und Statistik zeigen, wie gut ihr dranbleibt', '16-statistik-oben');
  s = slide('INHALT');
  H.head(s, 'Kalender', 'Je kräftiger das Grün, desto mehr war an dem Tag erledigt');
  [['Tag', 'Liste eines Tages, abhakbar'], ['Woche', 'Routinen × 7 Tage'], ['Monat', 'Farbkalender mit Tagesquote'], ['Von – bis', 'eigener Zeitraum oder letzte 7, 30, 90 Tage']]
    .forEach(([t, d], i) => { const y = 1.95 + i * 0.72; H.chip(s, t, 0.6, y, 1.55); H.text(s, d, { x: 2.35, y, w: 3.9, h: 0.4, valign: 'middle' }); });
  H.card(s, 0.6, 5.0, 5.6, 1.5); await H.icon(s, 'PiHandTap', 0.85, 5.25, 0.55);
  H.tdesc(s, 'Tag antippen', 'Öffnet die Tagesansicht. Dort kannst du nachträglich abhaken.', 1.6, 5.2, 4.4, 1.2);
  two(s, '12-kalender-monat', '11-kalender-woche', 'Kalender Monat', 'Kalender Woche');

  s = slide('INHALT');
  H.head(s, 'Raster: alle Routinen, alle Tage', 'Ideal, um einen ganzen Monat nachzutragen');
  await H.icon(s, 'PiGridFour', 0.6, 1.95); H.tdesc(s, 'Zeilen = Routinen, Spalten = Tage', 'Jedes Kästchen lässt sich antippen und abhaken. Hinter jeder Routine steht ihre Quote.', 1.4, 1.95, 6.2, 1.05);
  await H.icon(s, 'PiArrowsLeftRight', 0.6, 3.2); H.tdesc(s, 'Seitlich wischen', 'Bei Monat und längeren Zeiträumen wischst du nach links zu früheren Tagen.', 1.4, 3.2, 6.2, 1.05);
  await H.icon(s, 'PiChartBar', 0.6, 4.45); H.tdesc(s, 'Tagesquote unten, Gesamtquote oben', 'Kleine Balken zeigen jeden Tag, oben rechts steht der Wert für den Zeitraum.', 1.4, 4.45, 6.2, 1.05);
  one(s, '15-raster-monat', 'Raster Monat');

  s = slide('INHALT');
  H.head(s, 'Statistik: Simon und Irina', 'Für die letzten 7, 30 oder 90 Tage');
  const st = [['PiCrown', 'Duell', 'Wer vorne liegt, bekommt die Krone'], ['PiFlame', 'Perfekte Tage', 'Anzahl, aktuelle und beste Serie'], ['PiChartBar', 'Verlauf', 'Je Woche und nach Wochentag'],
    ['PiFolders', 'Nach Bereich', 'Quote je Lebensbereich'], ['PiWarning', 'Je Routine', 'Oben die Routinen, die am häufigsten liegen bleiben']];
  for (let i = 0; i < st.length; i++) { const [ic, t, d] = st[i], y = 1.9 + i * 0.95; await H.icon(s, ic, 0.6, y, 0.55); H.tdesc(s, t, d, 1.35, y - 0.04, 4.9, 0.9, { tsize: 16 }); }
  two(s, '16-statistik-oben', '18-statistik-bereich', 'Statistik oben', 'Statistik nach Bereich');

  // ===== Verwalten & Einstellungen =====
  await chapter('05', 'Verwalten & Einstellungen', 'Bereiche, Archiv, Änderungen und alles unter „Mehr“', '20-routinen');
  s = slide('INHALT');
  H.head(s, 'Routinen und Bereiche verwalten', 'Im Tab „Routinen“, geordnet nach Bereichen');
  [['PiPencilSimple', 'Bearbeiten', 'Routine antippen, ändern, „Speichern“.'], ['PiFolders', 'Bereiche', 'Oben rechts: anlegen, umbenennen, Symbol per Antippen wechseln, entfernen. Ihre Routinen wandern dann zu „Sonstiges“.'],
    ['PiLock', 'Ausgegraut?', 'Diese Routine gehört der anderen Person. Nur sie kann sie ändern.']]
    .forEach(([ic, t, d], i) => { H.tdesc(s, t, d, 1.4, 1.95 + i * 1.35, 4.9, 1.2); });
  for (const [i, ic] of ['PiPencilSimple', 'PiFolders', 'PiLock'].entries()) await H.icon(s, ic, 0.6, 1.95 + i * 1.35);
  two(s, '20-routinen', '22-bereiche', 'Routinen nach Bereichen', 'Bereiche verwalten');

  s = slide('INHALT');
  H.head(s, 'Archiv und Änderungen ab heute', 'Die Vergangenheit bleibt, wie sie war');
  await H.icon(s, 'PiArchive', 0.6, 1.95); H.tdesc(s, 'Archivieren statt Löschen', 'Im Formular unten „Routine archivieren“. Ab heute ausgeblendet, vergangene Tage zählen weiter.', 1.4, 1.95, 4.9, 1.2);
  await H.icon(s, 'PiArrowCounterClockwise', 0.6, 3.3); H.tdesc(s, 'Archiv', 'Ganz unten in „Routinen“: Wiederherstellen oder endgültig löschen.', 1.4, 3.3, 4.9, 1.2);
  await H.icon(s, 'PiClockCounterClockwise', 0.6, 4.65); H.tdesc(s, 'Änderung gilt ab heute', 'Neue Wiederholung oder Person? Vergangene Tage bleiben so gewertet, wie sie geplant waren.', 1.4, 4.65, 4.9, 1.2);
  two(s, '35-routinen-archiv', '30-routine-bearbeiten-hinweis', 'Archiv', 'Hinweis im Formular');

  s = slide('INHALT');
  H.head(s, 'Mehr: deine Einstellungen', 'Alles, was man selten braucht, aber wissen sollte');
  [['Namen', 'Die Namen der beiden Personen'], ['Darstellung', 'Automatisch, Hell oder Dunkel'], ['Ich bin', 'Zu welcher Person dieses Konto gehört'],
    ['Haushalt', 'Code für die zweite Person, Abmelden'], ['Daten', 'Export als Sicherung, Import zum Wiederherstellen']]
    .forEach(([t, d], i) => { const y = 1.95 + i * 0.92; H.chip(s, t, 0.6, y, 1.6); H.text(s, d, { x: 2.4, y: y - 0.1, w: 3.9, h: 0.6, valign: 'middle' }); });
  two(s, '31-mehr', '32-mehr-haushalt', 'Mehr oben', 'Mehr mit Haushalt und Daten');

  s = slide('INHALT');
  H.head(s, 'Was ist neu? Die Version im Blick', 'Nach einem Update und unter Mehr → Über SuperDaily');
  await H.icon(s, 'PiSparkle', 0.6, 1.95); H.tdesc(s, '„Neu in Version …“', 'Nach einem Update einmal oben auf „Heute“. „Mehr“ öffnet die Details, das X blendet den Hinweis aus.', 1.4, 1.95, 4.9, 1.3);
  await H.icon(s, 'PiInfo', 0.6, 3.45); H.tdesc(s, 'Über SuperDaily', `Ganz unten unter „Mehr“: aktuelle Version (jetzt ${version}), was neu ist, und alle früheren Versionen.`, 1.4, 3.45, 4.9, 1.3);
  two(s, '05-heute-neu-in-version', '33-mehr-ueber-superdaily', 'Hinweis nach Update', 'Frühere Versionen');

  s = slide('INHALT_DUNKEL');
  H.head(s, 'Auch im Dunkeln schön', 'Mehr → Darstellung');
  await H.icon(s, 'PiMoon', 0.6, 1.95, 0.62, C.teal, C.ink); H.tdesc(s, 'Automatisch', 'folgt der Einstellung deines Handys.', 1.45, 1.95, 4.9, 1.0, { dark: true });
  await H.icon(s, 'PiSun', 0.6, 3.2, 0.62, C.teal, C.ink); H.tdesc(s, 'Hell oder Dunkel', 'legt die Darstellung fest, egal was das Handy sagt.', 1.45, 3.2, 4.9, 1.0, { dark: true });
  two(s, '36-dunkel-heute', '37-dunkel-statistik', 'Heute dunkel', 'Statistik dunkel');

  s = slide('INHALT');
  H.head(s, 'Tipps und Hilfe', 'Wenn mal etwas nicht so läuft wie gedacht');
  const tips = [['PiArrowsClockwise', 'Neue Version kommt nicht an', 'App schließen und neu öffnen, notfalls ein zweites Mal'],
    ['PiDownloadSimple', 'Regelmäßig sichern', 'Mehr → Export speichert alles als JSON-Datei'],
    ['PiUploadSimple', 'Import mit Vorsicht', 'Ersetzt Routinen und Haken. Mit Sync nur eure eigenen und gemeinsamen'],
    ['PiKey', 'Passwort vergessen', 'Beim Anmelden antippen, der Link kommt per E-Mail'],
    ['PiClock', 'Nachtragen', 'Bis zu ein Jahr zurück in Kalender oder Raster'],
    ['PiCloudCheck', 'Immer synchron', 'Was einer abhakt, sieht die andere Person sofort']];
  for (let i = 0; i < 6; i++) { const [ic, t, d] = tips[i], x = 0.6 + (i % 2) * 6.15, y = 1.95 + Math.floor(i / 2) * 1.6;
    H.card(s, x, y, 5.95, 1.4); await H.icon(s, ic, x + 0.3, y + 0.38, 0.62); H.tdesc(s, t, d, x + 1.15, y + 0.2, 4.6, 1.05); }

  s = slide('TITEL');
  s.addText('Viel Spaß beim Abhaken!', { placeholder: 'title' });
  s.addText('Heute abhaken · im Kalender zurückblicken · in der Statistik vergleichen', { placeholder: 'body' });
  await H.icon(s, 'PiCheckCircle', 0.8, 1.35, 0.7, C.teal, C.ink);
  one(s, '08-heute-kacheln', 'Kacheln');

  await pres.writeFile({ fileName: out });
};
