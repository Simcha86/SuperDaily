// Version 9: Umschalter Simon | Irina | Duo auf „Heute“ (lokaler Modus, Beispieldaten).
// Heute laut Beispieldaten erledigt: Glas Wasser (gemeinsam), Zahnseide bei Simon und Irina.
import { test, expect, oeffneHandy, tab } from '../hilfen.js';

const gespeichert = seite => seite.evaluate(() => JSON.parse(localStorage.getItem('superdaily-v1')).done);
const zeile = (seite, titel) => seite.locator('.sd-drow', { hasText: titel });

test('Duo als Liste: beide nebeneinander, Felder abhakbar, gemeinsam ein Feld „Beide“', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  const umschalter = seite.locator('.sd-who3');
  await expect(umschalter.locator('button.on')).toHaveText('Simon');
  await umschalter.getByRole('button', { name: 'Duo' }).click();
  await expect(umschalter.locator('button.on')).toHaveText('Duo');

  // Fünf Routinen, jede einmal; Kopfzeile mit beiden Namen
  await expect(seite.locator('.sd-drow:not(.head)')).toHaveCount(5);
  await expect(seite.locator('.sd-drow.head')).toContainText('Simon');
  await expect(seite.locator('.sd-drow.head')).toContainText('Irina');
  // Fortschritt je Person: je 2 von 4
  await expect(seite.locator('.sd-dsc')).toHaveCount(2);
  await expect(seite.locator('.sd-dsc').first()).toContainText('2 von 4');

  // Gemeinsam: ein Feld „Beide“, schon erledigt
  const wasser = zeile(seite, 'Glas Wasser');
  await expect(wasser.locator('.sd-dcell')).toHaveCount(1);
  await expect(wasser.getByRole('button', { name: /gemeinsam: erledigt/ })).toBeVisible();
  // Nur für eine Person: bei der anderen „–“
  await expect(zeile(seite, 'Sport').locator('.sd-dcell.na')).toHaveCount(1);
  await expect(zeile(seite, 'Meditation').locator('.sd-dcell.na')).toHaveCount(1);

  // Irinas Feld bei Meditation abhaken → gespeichert als Haken von Irina
  await zeile(seite, 'Meditation').getByRole('button', { name: /Irina: offen/ }).click();
  await expect(zeile(seite, 'Meditation').getByRole('button', { name: /Irina: erledigt/ })).toBeVisible();
  // Simons Feld bei Sport abhaken
  await zeile(seite, '30 Minuten Sport').getByRole('button', { name: /Simon: offen/ }).click();
  await expect(zeile(seite, '30 Minuten Sport').getByRole('button', { name: /Simon: erledigt/ })).toBeVisible();
  const heute = Object.entries(await gespeichert(seite)).sort().pop()[1];
  expect(heute['b|m']).toBe(true);
  expect(heute['a|s']).toBe(true);
  await expect(seite.locator('.sd-dsc').first()).toContainText('3 von 4');

  // Tippen auf Irinas Fortschritt öffnet ihren Tag
  await seite.locator('.sd-dsc', { hasText: 'Irina' }).click();
  await expect(umschalter.locator('button.on')).toHaveText('Irina');
  await expect(seite.locator('.sd-item.done', { hasText: 'Meditation' })).toHaveCount(1);
  expect(seite.fehler).toEqual([]);
});

test('Duo als Kacheln: je Routine eine Kachel mit den Feldern S und I', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await seite.locator('.sd-who3').getByRole('button', { name: 'Duo' }).click();
  await seite.getByRole('button', { name: 'Kacheln' }).click();
  await expect(seite.locator('.sd-dtile')).toHaveCount(5);
  const lesen = seite.locator('.sd-dtile', { hasText: '20 Seiten lesen' });
  await expect(lesen.locator('.sd-dcell')).toHaveText(['S', 'I']);
  await lesen.getByRole('button', { name: /Simon: offen/ }).click();
  await expect(lesen.getByRole('button', { name: /Simon: erledigt/ })).toBeVisible();
  await expect(lesen.getByRole('button', { name: /Irina: offen/ })).toBeVisible();
  // Gemeinsame Routinen tragen in der Liste die Avatare beider Personen
  await seite.locator('.sd-who3').getByRole('button', { name: 'Simon' }).click();
  await seite.getByRole('button', { name: 'Liste' }).click();
  await expect(seite.locator('.sd-item', { hasText: 'Glas Wasser' }).locator('.sd-pair span')).toHaveText(['S', 'I']);
  expect(seite.fehler).toEqual([]);
});

test('Duo bleibt auf Handybreite ohne seitliches Verrutschen, auch im Dunkelmodus', async ({ browser, lokal }) => {
  for (const farbschema of ['light', 'dark']) {
    const seite = await oeffneHandy(browser, lokal, { beispieldaten: true, farbschema });
    await seite.locator('.sd-who3').getByRole('button', { name: 'Duo' }).click();
    const breiten = await seite.evaluate(() => { const m = document.querySelector('.sd-scroll'); return [m.scrollWidth, m.clientWidth]; });
    expect(breiten[0]).toBeLessThanOrEqual(breiten[1]);
    await tab(seite, 'Kalender');
    await tab(seite, 'Heute');
    await expect(seite.locator('.sd-who3 button.on')).toHaveText('Duo');
  }
});
