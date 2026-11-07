// Version 10: Einkaufsliste (lokaler Modus). Abnahmekriterien aus Issue #28.
import { test, expect, oeffneHandy, tab } from '../hilfen.js';

const eingabe = seite => seite.locator('[data-in="shopNew"]');
async function hinzu(seite, text) { await eingabe(seite).fill(text); await eingabe(seite).press('Enter'); }
const eintrag = (seite, titel) => seite.locator('.sd-sitem', { has: seite.locator('.t', { hasText: new RegExp(`^${titel}$`) }) });
const gruppe = (seite, name) => seite.locator('.sd-group', { has: seite.locator('.sd-catlabel', { hasText: name }) });
const gespeichert = seite => seite.evaluate(() => Object.values(JSON.parse(localStorage.getItem('superdaily-v1')).shop || {}));

test('Hinzufügen: Bereich wird erkannt, Menge aus „Milch – 2“ und „500 g Mehl“', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal);
  await tab(seite, 'Einkauf');
  await expect(seite.getByText('Die Liste ist leer. Was fehlt?')).toBeVisible();
  for (const t of ['Milch – 2', '500 g Mehl', 'Äpfel', 'Apfelsaft', 'Toilettenpapier', 'Reis', 'Eis', 'Brötchen 6', 'Kerzen']) await hinzu(seite, t);
  await expect(eingabe(seite)).toHaveValue('');
  await expect(eingabe(seite)).toBeFocused();
  const erwartet = { 'Kühlregal': ['Milch'], 'Vorrat': ['Mehl', 'Reis'], 'Obst & Gemüse': ['Äpfel'], 'Getränke': ['Apfelsaft'], 'Drogerie & Haushalt': ['Toilettenpapier'], 'Tiefkühl': ['Eis'], 'Brot & Backwaren': ['Brötchen'], 'Sonstiges': ['Kerzen'] };
  for (const [name, titel] of Object.entries(erwartet)) await expect(gruppe(seite, name).locator('.t')).toHaveText(titel);
  await expect(eintrag(seite, 'Milch').locator('.sd-qty')).toHaveText('2');
  await expect(eintrag(seite, 'Mehl').locator('.sd-qty')).toHaveText('500 g');
  await expect(eintrag(seite, 'Brötchen').locator('.sd-qty')).toHaveText('6');
  // Reihenfolge im Laden: Obst & Gemüse zuerst
  await expect(seite.locator('.sd-shop .sd-catlabel').first()).toContainText('Obst & Gemüse');
  await expect(seite.locator('.sd-hdr .sd-sub')).toHaveText('9 auf der Liste');
  expect(seite.fehler).toEqual([]);
});

test('Doppelt: steht etwas schon auf der Liste, kommt ein Hinweis statt eines zweiten Eintrags', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Einkauf');
  await hinzu(seite, 'milch');
  await expect(seite.getByText('„Milch“ steht schon auf der Liste.')).toBeVisible();
  await expect(eintrag(seite, 'Milch')).toHaveCount(1);
  await eingabe(seite).fill('B');
  await expect(seite.getByText('„Milch“ steht schon auf der Liste.')).toHaveCount(0);
  expect(seite.fehler).toEqual([]);
});

test('Im Laden: abhaken → „Im Wagen“, „Erledigte löschen“ räumt auf, Zähler für Vorschläge steigt', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Einkauf');
  const wagen = gruppe(seite, 'Im Wagen');
  await expect(wagen.locator('.t')).toHaveText(['Joghurt']);
  await eintrag(seite, 'Bananen').getByRole('button', { name: 'Bananen abhaken' }).click();
  await expect(wagen.locator('.t')).toHaveText(['Joghurt', 'Bananen']);
  await expect(eintrag(seite, 'Bananen')).toHaveClass(/done/);
  await expect(seite.locator('.sd-hdr .sd-sub')).toHaveText('5 auf der Liste · 2 im Wagen');
  // versehentlich abgehakt → wieder offen
  await eintrag(seite, 'Bananen').getByRole('button', { name: 'Bananen wieder offen' }).click();
  await expect(gruppe(seite, 'Obst & Gemüse').locator('.t')).toContainText(['Bananen']);
  await eintrag(seite, 'Bananen').getByRole('button', { name: 'Bananen abhaken' }).click();

  await wagen.getByRole('button', { name: 'Erledigte löschen' }).click();
  await expect(gruppe(seite, 'Im Wagen')).toHaveCount(0);
  await expect(eintrag(seite, 'Bananen')).toHaveCount(0);
  const banane = (await gespeichert(seite)).find(x => x.title === 'Bananen');
  expect(banane).toMatchObject({ open: false, done: false, count: 7 });
  // Jetzt unter „Häufig gekauft“, mit einem Tipp wieder auf der Liste – Bereich bleibt
  const vorschlaege = seite.locator('.sd-ssug');
  await expect(vorschlaege).toContainText('Häufig gekauft');
  await vorschlaege.getByRole('button', { name: 'Bananen' }).click();
  await expect(gruppe(seite, 'Obst & Gemüse').locator('.t')).toContainText(['Bananen']);
  expect(seite.fehler).toEqual([]);
});

test('Vorschläge beim Tippen aus dem eigenen Verlauf, häufigste zuerst', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Einkauf');
  const vorschlaege = seite.locator('.sd-ssug');
  // Ohne Eingabe: die häufigsten gekauften, die nicht auf der Liste stehen (Eier 8, Kaffee 6, Äpfel 5, Butter 4, Nudeln 3)
  await expect(vorschlaege.locator('.sd-chip')).toHaveText(['Eier', 'Kaffee', 'Äpfel', 'Butter', 'Nudeln']);
  await eingabe(seite).pressSequentially('bu');
  await expect(vorschlaege).toContainText('Vorschläge');
  await expect(vorschlaege.locator('.sd-chip')).toHaveText(['Butter']);
  await expect(eingabe(seite)).toBeFocused();
  await vorschlaege.getByRole('button', { name: 'Butter' }).click();
  await expect(gruppe(seite, 'Kühlregal').locator('.t')).toContainText(['Milch', 'Butter']);
  await expect(vorschlaege.locator('.sd-chip')).toHaveText(['Eier', 'Kaffee', 'Äpfel', 'Nudeln']);
  expect(seite.fehler).toEqual([]);
});

test('Bearbeiten: Bereich und Menge ändern, von der Liste nehmen, ganz löschen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Einkauf');
  await eintrag(seite, 'Spülmittel').locator('button.txt').click();
  const blatt = seite.locator('.sd-ssheet');
  await expect(blatt.getByRole('heading', { name: 'Eintrag bearbeiten' })).toBeVisible();
  await blatt.locator('[data-in="sQty"]').fill('2 Flaschen');
  await blatt.getByRole('button', { name: 'Sonstiges' }).click();
  await blatt.getByRole('button', { name: 'Speichern' }).click();
  await expect(gruppe(seite, 'Sonstiges').locator('.t')).toHaveText(['Spülmittel']);
  await expect(eintrag(seite, 'Spülmittel').locator('.sd-qty')).toHaveText('2 Flaschen');

  await eintrag(seite, 'Tomaten').locator('button.txt').click();
  await blatt.getByRole('button', { name: 'Von der Liste nehmen' }).click();
  await expect(eintrag(seite, 'Tomaten')).toHaveCount(0);
  expect((await gespeichert(seite)).find(x => x.title === 'Tomaten')).toMatchObject({ open: false });

  await eintrag(seite, 'Vollkornbrot').locator('button.txt').click();
  await blatt.getByRole('button', { name: /Ganz löschen/ }).click();
  await expect(eintrag(seite, 'Vollkornbrot')).toHaveCount(0);
  expect((await gespeichert(seite)).find(x => x.title === 'Vollkornbrot')).toBeUndefined();
  expect(seite.fehler).toEqual([]);
});

test('Einkauf auf Handybreite hell und dunkel ohne seitliches Verrutschen', async ({ browser, lokal }) => {
  for (const farbschema of ['light', 'dark']) {
    const seite = await oeffneHandy(browser, lokal, { beispieldaten: true, farbschema });
    await tab(seite, 'Einkauf');
    const breiten = await seite.evaluate(() => { const m = document.querySelector('.sd-scroll'); return [m.scrollWidth, m.clientWidth]; });
    expect(breiten[0]).toBeLessThanOrEqual(breiten[1]);
    // Plus-Knopf mit weißem Symbol auf Ozeanblau, Balken „Auf der Liste“ mit Anzahl
    expect(await seite.locator('.sd-sadd .sd-btn').evaluate(b => getComputedStyle(b).color)).toBe('rgb(255, 255, 255)');
    await expect(seite.locator('.sd-sbanner')).toHaveText(/Auf der Liste\s*6/);
    // Eigene Farbe: Akzent im Einkauf blau (#1d4ed8 hell, #60a5fa dunkel), Hintergrund anders als auf Heute
    const akzent = await seite.locator('.sd-scroll').evaluate(m => getComputedStyle(m).getPropertyValue('--color-accent').trim());
    expect(akzent).toBe(farbschema === 'light' ? '#1d4ed8' : '#60a5fa');
    const hgEinkauf = await seite.evaluate(() => getComputedStyle(document.body).backgroundImage);
    await tab(seite, 'Heute');
    expect(await seite.evaluate(() => getComputedStyle(document.body).backgroundImage)).not.toEqual(hgEinkauf);
    expect(seite.fehler).toEqual([]);
  }
});
