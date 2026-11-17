// Version 12: Verbesserungen aus dem Marktreife-Check (Barrierefreiheit, Tippflächen, Kontrast, Texte).
import { test, expect, oeffneHandy, tab } from '../hilfen.js';

// Kontrast zwischen Schriftfarbe und allen Farben des Hintergrunds (bei Verläufen jede Endfarbe)
const kontrast = (seite, selektor) => seite.locator(selektor).first().evaluate(el => {
  const parse = c => (c.match(/rgba?\(([^)]+)\)/)?.[1] || '').split(/[ ,/]+/).filter(Boolean).map(Number);
  const lum = ([r, g, b]) => [r, g, b].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  let e = el, bg = [];
  while (e && !bg.length) { const cs = getComputedStyle(e); if (cs.backgroundImage.includes('gradient')) bg = (cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(parse); else { const c = parse(cs.backgroundColor); if (c.length && (c[3] ?? 1) > .9) bg = [c]; } e = e.parentElement; }
  const fg = parse(getComputedStyle(el).color);
  return Math.min(...bg.map(b => ratio(fg, b)));
});

test('Vorlesen: Routinen melden „erledigt“, Umschalter und Tabs melden „ausgewählt“', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  const zahnseide = seite.locator('.sd-item', { hasText: 'Zahnseide' });
  await expect(zahnseide).toHaveAttribute('aria-pressed', 'true');
  const sport = seite.locator('.sd-item', { hasText: '30 Minuten Sport' });
  await expect(sport).toHaveAttribute('aria-pressed', 'false');
  await sport.click();
  await expect(sport).toHaveAttribute('aria-pressed', 'true');
  // Serie wird als Wort vorgelesen
  await expect(zahnseide).toHaveAccessibleName(/Tage in Folge/);
  // Umschalter, Tagesleiste, Tabs
  await expect(seite.locator('.sd-who3').getByRole('button', { name: 'Simon' })).toHaveAttribute('aria-pressed', 'true');
  await expect(seite.locator('.sd-who3').getByRole('button', { name: 'Irina' })).toHaveAttribute('aria-pressed', 'false');
  await expect(seite.locator('.sd-strip button[aria-pressed="true"]')).toHaveCount(1);
  await expect(seite.locator('.sd-tabs [aria-current="page"]')).toContainText('Heute');
  // Abschnitte sind Überschriften
  await expect(seite.getByRole('heading', { name: 'Morgen', level: 2 })).toBeVisible();
  expect(seite.fehler).toEqual([]);
});

test('Eingabeblatt: Dialog mit Fokus, „Abbrechen“ und Escape, Seite dahinter gesperrt', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Aufgaben');
  await seite.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  const dialog = seite.getByRole('dialog', { name: 'Neue Aufgabe' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Neue Aufgabe' })).toBeFocused();
  await expect(dialog.getByLabel('Was ist zu tun?')).toBeVisible();
  // Tabulator bleibt im Blatt
  for (let i = 0; i < 15; i++) { await seite.keyboard.press('Tab'); expect(await seite.evaluate(() => !!document.activeElement.closest('.sd-sheet'))).toBe(true); }
  await seite.keyboard.press('Escape');
  await expect(seite.locator('.sd-sheet')).toHaveCount(0);
  await expect(seite.locator('.sd-scroll')).not.toHaveAttribute('inert', '');
  // Abbrechen-Knopf
  await tab(seite, 'Routinen');
  await seite.getByRole('button', { name: 'Routine hinzufügen' }).click();
  await expect(seite.getByRole('dialog', { name: 'Neue Routine' })).toBeVisible();
  await seite.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(seite.locator('.sd-sheet')).toHaveCount(0);
  expect(seite.fehler).toEqual([]);
});

test('Kontrast: Hauptknopf, Balken in Gold und Blau, Überschrift mindestens 4,5 : 1 (hell und dunkel)', async ({ browser, lokal }) => {
  for (const farbschema of ['light', 'dark']) {
    const leer = await oeffneHandy(browser, lokal, { farbschema });
    expect(await kontrast(leer, '.sd-welcome .sd-btn')).toBeGreaterThanOrEqual(4.5);
    const seite = await oeffneHandy(browser, lokal, { beispieldaten: true, farbschema });
    expect(await kontrast(seite, '.sd-hdr h1')).toBeGreaterThanOrEqual(4.5);
    await tab(seite, 'Aufgaben');
    expect(await kontrast(seite, '.sd-tbanner span')).toBeGreaterThanOrEqual(4.5);
    expect(await kontrast(seite, '.sd-tasks .sd-mini, .sd-titem .due')).toBeGreaterThanOrEqual(4.5);
    await tab(seite, 'Einkauf');
    expect(await kontrast(seite, '.sd-sbanner span')).toBeGreaterThanOrEqual(4.5);
  }
});

test('Tippflächen: Abhak-Kreis reagiert auf 44 px, letzter Eintrag nicht von der Leiste verdeckt', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Aufgaben');
  // Tipp 18 px neben die Mitte des 26-px-Kreises trifft trotzdem den Kreis
  const treffer = await seite.locator('.sd-titem .sd-check').first().evaluate(el => { const r = el.getBoundingClientRect(), cx = r.x + r.width / 2, cy = r.y + r.height / 2; return [[cx - 18, cy], [cx, cy - 18], [cx, cy + 18]].map(([x, y]) => document.elementFromPoint(x, y)?.closest('.sd-check') === el); });
  expect(treffer).toEqual([true, true, true]);
  for (const sel of ['.sd-seg button']) { const h = await seite.locator(sel).first().evaluate(e => e.getBoundingClientRect().height); expect(h).toBeGreaterThanOrEqual(44); }
  // Seit Version 13 gibt es keinen schwebenden Plus-Knopf mehr; ganz unten endet der letzte Eintrag über der Leiste
  await expect(seite.locator('.sd-fab')).toHaveCount(0);
  await seite.locator('.sd-scroll').evaluate(m => { m.scrollTop = m.scrollHeight; });
  const [unten, leisteOben] = await seite.evaluate(() => [[...document.querySelectorAll('.sd-titem')].pop().getBoundingClientRect().bottom, document.querySelector('.sd-tabs').getBoundingClientRect().top]);
  expect(unten).toBeLessThan(leisteOben);
  expect(seite.fehler).toEqual([]);
});

test('Texte: keine Entwicklerhinweise, einheitlich „Gemeinsam“ und „Jeder für sich“', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Mehr');
  await expect(seite.locator('.sd-scroll')).not.toContainText('firebase-config');
  await expect(seite.locator('.sd-scroll')).not.toContainText('README');
  await tab(seite, 'Routinen');
  await expect(seite.locator('.sd-row', { hasText: 'Zahnseide' })).toContainText('Jeder für sich');
  await expect(seite.locator('.sd-row', { hasText: 'Glas Wasser' })).toContainText('Gemeinsam');
  await tab(seite, 'Aufgaben');
  await expect(seite.locator('.sd-titem', { hasText: 'Geschenk für Oma' }).locator('.sd-from')).toHaveText('Gemeinsam');
  expect(seite.fehler).toEqual([]);
});
