// Bereiche selbst verwalten (Version 4): anlegen, doppelte Namen ablehnen, umbenennen,
// Symbol wechseln, entfernen mit Umzug der Routinen, Zuordnung im Formular, Statistik.
import { test, expect, oeffneHandy, tab } from '../hilfen.js';

const gespeichert = seite => seite.evaluate(() => JSON.parse(localStorage.getItem('superdaily-v1')));
const bereichFeld = (seite, name) => seite.locator('.sd-catrow input').and(seite.locator(`[value="${name}"]`));

async function bereicheOeffnen(seite) {
  await tab(seite, 'Routinen');
  await seite.locator('.sd-hdr').getByRole('button', { name: 'Bereiche' }).click();
  await expect(seite.getByRole('heading', { name: 'Bereiche' })).toBeVisible();
}

test('Sechs Startbereiche, neuen anlegen, doppelten Namen ablehnen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await bereicheOeffnen(seite);
  await expect(seite.locator('.sd-catrow')).toHaveCount(6);
  await seite.getByPlaceholder('Neuer Bereich, z. B. Beruf').fill('Beruf');
  await seite.getByRole('button', { name: 'Anlegen' }).click();
  await expect(bereichFeld(seite, 'Beruf')).toHaveCount(1);
  await seite.getByPlaceholder('Neuer Bereich, z. B. Beruf').fill('beruf');
  await seite.getByRole('button', { name: 'Anlegen' }).click();
  await expect(seite.locator('.sd-catrow')).toHaveCount(7);
  expect(seite.fehler).toEqual([]);
});

test('Umbenennen und Symbol wechseln', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await bereicheOeffnen(seite);
  const familie = bereichFeld(seite, 'Familie');
  await familie.fill('Familie & Kinder');
  await familie.press('Tab');
  await expect(bereichFeld(seite, 'Familie & Kinder')).toHaveCount(1);
  const symbol = seite.getByRole('button', { name: 'Symbol wechseln' }).first();
  const vorher = await symbol.innerHTML();
  await symbol.click();
  await expect(seite.getByRole('button', { name: 'Symbol wechseln' }).first()).not.toHaveJSProperty('innerHTML', vorher);
  expect((await gespeichert(seite)).cats.map(c => c.name)).toContain('Familie & Kinder');
});

test('Bereich entfernen: Routinen wechseln zu „Sonstiges“', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await bereicheOeffnen(seite);
  await seite.getByRole('button', { name: 'Bereich Gesundheit entfernen' }).click();
  await expect(bereichFeld(seite, 'Gesundheit')).toHaveCount(0);
  const daten = await gespeichert(seite);
  expect(daten.cats.map(c => c.name)).not.toContain('Gesundheit');
  expect(daten.routines.w.cat).toBe('sonstiges');
});

test('Routine einem Bereich zuordnen, auch über die Abkürzung im Formular', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Routinen');
  await seite.getByRole('button', { name: /20 Seiten lesen/ }).click();
  await seite.locator('.sd-sheet').getByRole('button', { name: /Haushalt$/ }).click();
  await seite.getByRole('button', { name: 'Speichern' }).click();
  await expect(seite.locator('.sd-group', { has: seite.locator('.sd-catlabel', { hasText: 'Haushalt' }) })).toContainText('20 Seiten lesen');

  await seite.getByRole('button', { name: 'Routine hinzufügen' }).click();
  await seite.locator('.sd-sheet').getByRole('button', { name: /Bereiche$/ }).click();
  await seite.getByRole('button', { name: 'Zurück zur Routine' }).click();
  await expect(seite.getByPlaceholder('z. B. Zahnseide')).toBeVisible();
});

test('Statistik zeigt „Nach Bereich“', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Statistik');
  await expect(seite.getByRole('heading', { name: 'Nach Bereich' })).toBeVisible();
  expect(seite.fehler).toEqual([]);
});
