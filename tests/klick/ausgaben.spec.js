// Version 13: Bereich Ausgaben (Überblick) und neue Navigation mit vier Bereichen.
import { test, expect, oeffneHandy, tab } from '../hilfen.js';

const eingabe = seite => seite.locator('[data-in="expNew"]');
async function hinzu(seite, text) { await eingabe(seite).fill(text); await eingabe(seite).press('Enter'); }
const gespeichert = seite => seite.evaluate(() => Object.values(JSON.parse(localStorage.getItem('superdaily-v1') || '{}').exp || {}));

test('Ausgabe mit einem Satz: Betrag, Geschäft und Kategorie werden erkannt', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal);
  await tab(seite, 'Ausgaben');
  await expect(seite.getByText(/Noch keine Ausgaben im /)).toBeVisible();
  await hinzu(seite, 'Rewe 23,80');
  await hinzu(seite, '45 € Tanken');
  await hinzu(seite, 'Kino 18');
  await hinzu(seite, 'Obi 95,00');
  await expect(eingabe(seite)).toHaveValue('');
  await expect(eingabe(seite)).toBeFocused();
  const x = Object.fromEntries((await gespeichert(seite)).map(e => [e.title, [e.amount, e.cat]]));
  expect(x).toEqual({ Rewe: [2380, 'essen'], Tanken: [4500, 'auto'], Kino: [1800, 'freizeit'], Obi: [9500, 'garten'] });
  await expect(seite.locator('.sd-ebanner')).toContainText('181,80');
  await expect(seite.locator('.sd-ecats .sd-rate').first()).toContainText('Haus & Garten');
  await expect(seite.locator('.sd-erow').first()).toContainText('Obi');
  // Tagessumme im Tageskopf
  await expect(seite.locator('.sd-eday').first()).toContainText('181,80');
  expect(seite.fehler).toEqual([]);
});

test('Ohne Betrag kommt ein Hinweis, der Text bleibt stehen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal);
  await tab(seite, 'Ausgaben');
  await hinzu(seite, 'Bäcker');
  await expect(seite.getByText('Bitte auch den Betrag angeben')).toBeVisible();
  await expect(eingabe(seite)).toHaveValue('Bäcker');
  expect(await gespeichert(seite)).toEqual([]);
});

test('Monatsüberblick: Summe, Kategorien, voriger Monat, bearbeiten und löschen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Ausgaben');
  const summe = await seite.locator('.sd-ebanner b').textContent();
  await seite.getByRole('button', { name: 'Voriger Monat' }).click();
  await expect(seite.locator('.sd-ebanner b')).not.toHaveText(summe);
  await expect(seite.getByRole('button', { name: 'Nächster Monat' })).toBeEnabled();
  await seite.getByRole('button', { name: 'Nächster Monat' }).click();
  await expect(seite.getByRole('button', { name: 'Nächster Monat' })).toBeDisabled();
  // Bearbeiten: Betrag und Kategorie
  await seite.locator('.sd-erow', { hasText: 'Kino' }).click();
  const blatt = seite.getByRole('dialog', { name: 'Ausgabe bearbeiten' });
  await blatt.locator('[data-in="eAmount"]').fill('26,50');
  await blatt.getByRole('button', { name: 'Sonstiges' }).click();
  await blatt.getByRole('button', { name: 'Speichern' }).click();
  await expect(seite.locator('.sd-erow', { hasText: 'Kino' })).toContainText('26,50');
  expect((await gespeichert(seite)).find(e => e.title === 'Kino')).toMatchObject({ amount: 2650, cat: 'sonst' });
  // Löschen
  await seite.locator('.sd-erow', { hasText: 'Apotheke' }).click();
  await seite.getByRole('button', { name: 'Ausgabe löschen' }).click();
  await expect(seite.locator('.sd-erow', { hasText: 'Apotheke' })).toHaveCount(0);
  expect(seite.fehler).toEqual([]);
});

test('Navigation: Verwaltung führt zu Routinen, Aufgaben, Verlauf und Einstellungen, „Zurück“ führt zurück', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  // Heute: Aufgaben mit „Neu“ und „Alle“, Knopf „Verlauf“
  await expect(seite.locator('.sd-tasks').getByRole('button', { name: 'Aufgabe hinzufügen' })).toBeVisible();
  await seite.locator('.sd-hdr').getByRole('button', { name: 'Verlauf' }).click();
  await expect(seite.locator('.sd-hdr h1')).toHaveText('Verlauf');
  await expect(seite.locator('.sd-tab.on')).toContainText('Heute');
  await seite.getByRole('button', { name: 'Heute' }).first().click();
  await expect(seite.locator('.sd-hdr h1')).toHaveText('Heute');
  await seite.locator('.sd-tasks').getByRole('button', { name: 'Alle' }).click();
  await expect(seite.locator('.sd-hdr h1')).toHaveText('Aufgaben');
  await seite.locator('.sd-backlink').click();
  await expect(seite.locator('.sd-hdr h1')).toHaveText('Heute');
  // Verwaltung
  await tab(seite, 'Verwaltung');
  await expect(seite.locator('.sd-vrow .t')).toHaveText(['Routinen', 'Bereiche', 'Alle Aufgaben', 'Verlauf und Statistik', 'Einstellungen']);
  await seite.locator('.sd-vrow').filter({ hasText: /^Routinen/ }).click();
  await expect(seite.locator('.sd-tab.on')).toContainText('Verwaltung');
  await expect(seite.locator('.sd-backlink')).toHaveText('Verwaltung');
  await seite.getByRole('button', { name: 'Routine hinzufügen' }).click();
  await expect(seite.getByRole('dialog', { name: 'Neue Routine' })).toBeVisible();
  await seite.keyboard.press('Escape');
  await seite.locator('.sd-backlink').click();
  await expect(seite.locator('.sd-hdr h1')).toHaveText('Verwaltung');
  await seite.locator('.sd-vrow').filter({ hasText: /^Bereiche/ }).click();
  await expect(seite.getByRole('dialog', { name: 'Bereiche' })).toBeVisible();
  // Badge „fällig“ jetzt an „Heute“
  await expect(seite.locator('.sd-tab', { hasText: 'Heute' }).locator('.sd-badge')).toHaveText('3');
  expect(seite.fehler).toEqual([]);
});

test('Ausgaben hell und dunkel: lesbarer Balken, kein seitliches Verrutschen', async ({ browser, lokal }) => {
  for (const farbschema of ['light', 'dark']) {
    const seite = await oeffneHandy(browser, lokal, { beispieldaten: true, farbschema });
    await tab(seite, 'Ausgaben');
    const [sw, cw] = await seite.evaluate(() => { const m = document.querySelector('.sd-scroll'); return [m.scrollWidth, m.clientWidth]; });
    expect(sw).toBeLessThanOrEqual(cw);
    expect(await seite.locator('.sd-ebanner').evaluate(e => getComputedStyle(e).color)).toBe('rgb(255, 255, 255)');
    expect(await seite.locator('.sd-ebanner').evaluate(e => getComputedStyle(e).backgroundImage)).toContain('124, 58, 237');
    expect(seite.fehler).toEqual([]);
  }
});

test('Wie in SuperFinance: Geschäft-Vorschläge, gemerkte Kategorie, Notiz, Filter nach Kategorie', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Ausgaben');
  // Ohne Geschäft: Hinweis
  await hinzu(seite, '12,50');
  await expect(seite.getByText('Bitte auch das Geschäft angeben')).toBeVisible();
  // Vorschläge aus bekannten Geschäften beim Tippen
  await eingabe(seite).fill('');
  await eingabe(seite).pressSequentially('Pi');
  await seite.locator('.sd-esug').getByRole('button', { name: 'Pizzeria Roma' }).click();
  await expect(eingabe(seite)).toHaveValue('Pizzeria Roma ');
  await eingabe(seite).pressSequentially('28,40'); await eingabe(seite).press('Enter');
  // Bekanntes Geschäft bekommt die zuletzt gewählte Kategorie (Restaurant & Café), nicht die Wortregel
  expect((await gespeichert(seite)).filter(e => e.title === 'Pizzeria Roma').map(e => e.cat)).toEqual(['restaurant', 'restaurant']);
  // Kategorie ändern → nächstes Mal wird die neue vorgeschlagen; Notiz speichern
  await seite.locator('.sd-erow', { hasText: 'Kino' }).click();
  const blatt = seite.getByRole('dialog', { name: 'Ausgabe bearbeiten' });
  await blatt.getByRole('button', { name: 'Geschenke' }).click();
  await blatt.getByLabel('Notiz (optional)').fill('Gutschein für Irina');
  await blatt.getByRole('button', { name: 'Speichern' }).click();
  await hinzu(seite, 'kino 9');
  const kino = (await gespeichert(seite)).filter(e => e.title === 'Kino');
  expect(kino.map(e => e.cat).sort()).toEqual(['geschenke', 'geschenke']);
  expect(kino.find(e => e.amount === 2400).note).toBe('Gutschein für Irina');
  // Filter nach Kategorie
  await seite.locator('.sd-ecat', { hasText: 'Lebensmittel' }).click();
  await expect(seite.locator('.sd-erow')).toHaveCount(2);
  await expect(seite.locator('.sd-ebanner')).toContainText('107,00');
  await seite.getByRole('button', { name: 'Alle zeigen' }).click();
  await expect(seite.locator('.sd-erow')).toHaveCount(9);
  expect(seite.fehler).toEqual([]);
});
