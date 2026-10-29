// Grundfunktionen im lokalen Modus: erster Start mit Vorlagen, Routine anlegen und abhaken,
// Bildschirme wechseln, Darstellung umschalten.
import { test, expect, oeffneHandy, tab } from '../hilfen.js';

test('Erster Start: Vorlage antippen legt eine Routine an', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal);
  await expect(seite.getByRole('heading', { name: 'Willkommen bei SuperDaily' })).toBeVisible();
  await seite.getByRole('button', { name: 'Vitamine nehmen' }).click();
  await expect(seite.getByRole('heading', { name: 'Willkommen bei SuperDaily' })).toHaveCount(0);
  await expect(seite.getByRole('button', { name: /Vitamine nehmen/ })).toBeVisible();
  await expect(seite.getByText('0 von 1 erledigt')).toBeVisible();
});

test('Eigene Routine anlegen und abhaken', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal);
  await seite.getByRole('button', { name: 'Routine hinzufügen' }).click();
  await seite.getByPlaceholder('z. B. Zahnseide').fill('Blumen gießen');
  await seite.locator('.sd-sheet').getByRole('button', { name: 'Abend', exact: true }).click();
  await seite.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  const routine = seite.getByRole('button', { name: /Blumen gießen/ });
  await expect(routine).toBeVisible();
  await routine.click();
  await expect(seite.getByText('1 von 1 erledigt')).toBeVisible();
  await expect(seite.locator('.sd-item.done', { hasText: 'Blumen gießen' })).toHaveCount(1);
  await tab(seite, 'Routinen');
  await expect(seite.locator('.sd-group', { has: seite.locator('.sd-catlabel', { hasText: 'Haushalt' }) })).toContainText('Blumen gießen');
});

test('Alle Bildschirme öffnen ohne Fehler', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  for (const [name, ueberschrift] of [['Kalender', /\w+/], ['Raster', 'Diese Woche'], ['Statistik', 'Statistik'], ['Routinen', 'Routinen'], ['Mehr', 'Einstellungen'], ['Heute', 'Heute']]) {
    await tab(seite, name);
    await expect(seite.locator('.sd-hdr h1')).toHaveText(ueberschrift);
  }
  expect(seite.fehler).toEqual([]);
});

test('Darstellung auf Dunkel umschalten', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await expect(seite.locator('html')).toHaveAttribute('data-sd', 'light');
  await tab(seite, 'Mehr');
  await seite.getByRole('button', { name: 'Dunkel', exact: true }).click();
  await expect(seite.locator('html')).toHaveAttribute('data-sd', 'dark');
  await seite.reload();
  await expect(seite.locator('html')).toHaveAttribute('data-sd', 'dark');
});

test('Vorleseprogramme: Symbole sind ausgeblendet, Knöpfe heißen nur wie ihr Text', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal);
  await expect(seite.getByRole('button', { name: 'Eigene Routine anlegen', exact: true })).toBeVisible();
  await seite.getByRole('button', { name: 'Vitamine nehmen' }).click();
  for (const name of ['Heute', 'Kalender', 'Raster', 'Statistik', 'Routinen', 'Mehr']) {
    await expect(seite.locator('.sd-tabs').getByRole('button', { name, exact: true })).toHaveCount(1);
  }
  await tab(seite, 'Routinen');
  await expect(seite.locator('.sd-hdr').getByRole('button', { name: 'Bereiche', exact: true })).toBeVisible();
  expect(await seite.locator('i.ph, i[class*="ph-"]').evaluateAll(l => l.filter(i => i.className.includes('ph-') && i.getAttribute('aria-hidden') !== 'true').length)).toBe(0);
});
