// Gegenüberstellung neue gegen vorherige Version, automatisch aus den Screens beider Versionen.
const { C, createDeck, kit } = require('./lib/deck');

module.exports = async function buildVergleich({ version, prev, date, sha, prevSha, items, note = {}, pairs, added, removed, unchanged, out }) {
  const pres = createDeck({ title: `SuperDaily – Version ${prev} → ${version}`, footer: `SuperDaily · Vergleich Version ${prev} → ${version}` });
  const H = kit(pres);
  const label = (s, text, cx, fill) => H.chip(s, text, cx - 0.85, 0.45, 1.7, { fill, color: C.white });
  const twoUp = (s, a, b, alt) => {
    const h = 5.85, xs = [7.0, 10.05];
    [[a, `Version ${prev}`, C.gray], [b, `Version ${version}`, C.teal]].forEach(([ph, l, f], i) => { const w = H.phone(s, ph, xs[i], 0.95, h, `${alt} in ${l}`); label(s, l, xs[i] + w / 2, f); });
  };
  const oneUp = (s, ph, l, fill, alt) => { const w = H.phone(s, ph, 9.3, 0.95, 5.85, alt); label(s, l, 9.3 + w / 2, fill); };
  let s;

  pres.addSection({ title: 'Überblick' });
  s = pres.addSlide({ masterName: 'TITEL', sectionTitle: 'Überblick' });
  s.addText(`Was ist neu in Version ${version}?`, { placeholder: 'title' });
  s.addText([{ text: `SuperDaily: Version ${prev} und ${version} im Vergleich`, options: { bold: true, color: C.white, fontSize: 22, breakLine: true } },
    ...(note.summary ? [{ text: note.summary, options: { breakLine: true } }] : []),
    { text: `${date} · Commit ${prevSha.slice(0, 7)} → ${sha.slice(0, 7)}`, options: { fontSize: 14, color: C.teal } }], { placeholder: 'body' });
  await H.icon(s, 'PiSparkle', 0.8, 1.15, 0.7, C.teal, C.ink);
  const hero = pairs[0] || added[0];
  if (hero) H.phone(s, hero.newPh, 9.3, 0.75, 6.0, hero.s.title);

  s = pres.addSlide({ masterName: 'INHALT', sectionTitle: 'Überblick' });
  s.addText(`Neu in Version ${version}`, { placeholder: 'title' });
  s.addText('Aus dem Änderungsprotokoll der App', { placeholder: 'sub' });
  const list = items.length ? items : ['Keine Einträge im Änderungsprotokoll'];
  for (const [i, t] of list.slice(0, 6).entries()) {
    const y = 1.95 + i * 0.8; H.card(s, 0.6, y, 7.4, 0.65); await H.icon(s, 'PiCheck', 0.75, y + 0.1, 0.45);
    H.text(s, t, { x: 1.4, y, w: 6.45, h: 0.65, valign: 'middle', fontSize: 15 });
  }
  H.card(s, 8.4, 1.95, 4.35, 3.0);
  H.text(s, 'In der App sichtbar', { x: 8.7, y: 2.15, w: 3.8, h: 0.4, fontSize: 18, bold: true, color: C.deep });
  [[pairs.length, 'Screens verändert', C.teal], [added.length, 'Screens neu', C.lime], [removed.length, 'Screens entfallen', C.amber], [unchanged, 'Screens unverändert', C.gray]]
    .forEach(([n, l, col], i) => { H.text(s, String(n), { x: 8.7, y: 2.7 + i * 0.52, w: 0.8, h: 0.45, fontSize: 24, bold: true, color: col, valign: 'middle' }); H.text(s, l, { x: 9.55, y: 2.7 + i * 0.52, w: 3, h: 0.45, valign: 'middle' }); });
  H.text(s, 'Verglichen werden alle Screens mit denselben Beispieldaten.', { x: 8.4, y: 5.15, w: 4.35, h: 0.6, fontSize: 13, italic: true, color: C.gray });

  if (pairs.length || added.length) pres.addSection({ title: 'Screens' });
  for (const p of pairs) {
    s = pres.addSlide({ masterName: 'INHALT', sectionTitle: 'Screens' });
    s.addText(p.s.title, { placeholder: 'title' }); s.addText(`${p.s.group}${p.s.desc ? ' · ' + p.s.desc : ''}`, { placeholder: 'sub' });
    const txt = note.screens?.[p.s.key] || `Dieser Screen sieht in Version ${version} anders aus. Etwa ${Math.max(1, Math.round(p.diff * 100))} % der Fläche haben sich verändert.`;
    H.card(s, 0.6, 1.95, 6.0, 2.2); await H.icon(s, 'PiArrowsLeftRight', 0.85, 2.2, 0.55);
    H.text(s, txt, { x: 1.6, y: 2.2, w: 4.8, h: 1.8, fontSize: 16 });
    twoUp(s, p.oldPh, p.newPh, p.s.title);
  }
  for (const p of added) {
    s = pres.addSlide({ masterName: 'INHALT', sectionTitle: 'Screens' });
    s.addText(p.s.title, { placeholder: 'title' }); s.addText(`${p.s.group}${p.s.desc ? ' · ' + p.s.desc : ''}`, { placeholder: 'sub' });
    H.card(s, 0.6, 1.95, 7.3, 1.8); await H.icon(s, 'PiPlus', 0.85, 2.2, 0.55, C.lime, C.ink);
    H.text(s, note.screens?.[p.s.key] || `Diesen Screen gibt es erst ab Version ${version}.`, { x: 1.6, y: 2.2, w: 6.1, h: 1.4, fontSize: 16 });
    oneUp(s, p.newPh, `Neu in Version ${version}`, C.teal, p.s.title);
  }
  for (const p of removed) {
    s = pres.addSlide({ masterName: 'INHALT', sectionTitle: 'Screens' });
    s.addText(p.s.title, { placeholder: 'title' }); s.addText('Entfallen', { placeholder: 'sub' });
    H.text(s, note.screens?.[p.s.key] || `Diesen Screen gibt es in Version ${version} nicht mehr.`, { x: 0.6, y: 1.95, w: 7.3, h: 1.4, fontSize: 16 });
    oneUp(s, p.oldPh, `Version ${prev}`, C.gray, p.s.title);
  }

  if (note.todo?.length) {
    s = pres.addSlide({ masterName: 'INHALT', sectionTitle: pairs.length || added.length ? 'Screens' : 'Überblick' });
    s.addText('Was ihr für das Update tun müsst', { placeholder: 'title' });
    H.steps(s, note.todo.map(t => [t, '']), 0.6, 1.95, 11.5, 0.9);
  }

  s = pres.addSlide({ masterName: 'TITEL', sectionTitle: pairs.length || added.length ? 'Screens' : 'Überblick' });
  s.addText(`Version ${version} ist da`, { placeholder: 'title' });
  s.addText(`Alle Screens, die Anleitung und die Figma-Übersicht sind auf dem Stand von Version ${version}.`, { placeholder: 'body' });
  await H.icon(s, 'PiCheckCircle', 0.8, 1.15, 0.7, C.teal, C.ink);
  if (hero) H.phone(s, hero.newPh, 9.3, 0.75, 6.0, hero.s.title);

  await pres.writeFile({ fileName: out });
};
