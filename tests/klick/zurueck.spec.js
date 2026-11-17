// Version 15: Die Zurück-Taste von Android verlässt die App nicht sofort.
// Reihenfolge: offenes Blatt schließen → Unterseite verlassen → zu „Heute“ → erst dann App verlassen.
import { test, expect, oeffneHandy, tab } from '../hilfen.js';

const titel = seite => seite.locator('.sd-hdr h1');

test('Zurück schließt Blatt, verlässt Unterseite, führt zu „Heute“ und bleibt in der App', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  const start = seite.url();
  await tab(seite, 'Routinen');
  await seite.getByRole('button', { name: 'Routine hinzufügen' }).click();
  await expect(seite.getByRole('dialog', { name: 'Neue Routine' })).toBeVisible();
  await seite.goBack();
  await expect(seite.locator('.sd-sheet')).toHaveCount(0);
  await expect(titel(seite)).toHaveText('Routinen');
  await seite.goBack();
  await expect(titel(seite)).toHaveText('Verwaltung');
  await seite.goBack();
  await expect(titel(seite)).toHaveText('Heute');
  expect(seite.url()).toBe(start);
  expect(seite.fehler).toEqual([]);
});

test('Nach „Abbrechen“ oder Bereichswechsel braucht Zurück keinen Leer-Tipp', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Ausgaben');
  await tab(seite, 'Einkauf');
  await tab(seite, 'Aufgaben');
  await seite.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  await seite.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(seite.locator('.sd-sheet')).toHaveCount(0);
  // Ein Zurück reicht für „Heute“
  await seite.goBack();
  await expect(titel(seite)).toHaveText('Heute');
  // Zurück zu „Heute“ per Leiste, dann wieder weg: kein alter Eintrag bleibt hängen
  await tab(seite, 'Einkauf');
  await tab(seite, 'Heute');
  await tab(seite, 'Ausgaben');
  await seite.goBack();
  await expect(titel(seite)).toHaveText('Heute');
  expect(seite.fehler).toEqual([]);
});
