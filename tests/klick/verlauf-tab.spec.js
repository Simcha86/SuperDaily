// Version 10: Tab „Verlauf“ = Statistik | Kalender | Raster mit einem Zeitraum. Abnahmekriterien aus Issue #29.
import { test, expect, oeffneHandy, tab } from '../hilfen.js';

const ansicht = seite => seite.locator('.sd-seg').first();

test('Leiste: Heute · Verlauf · Aufgaben · Einkauf · Routinen · Mehr', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await expect(seite.locator('.sd-tabs .sd-tab span')).toHaveText(['Heute', 'Verlauf', 'Aufgaben', 'Einkauf', 'Routinen', 'Mehr']);
  // Beschriftungen passen ohne Abschneiden
  const abgeschnitten = await seite.locator('.sd-tabs .sd-tab span').evaluateAll(l => l.filter(s => s.scrollWidth > s.clientWidth).map(s => s.textContent));
  expect(abgeschnitten).toEqual([]);
});

test('Statistik ist zuerst ausgewählt, letzte 30 Tage; gewählte Ansicht wird gemerkt', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Verlauf');
  await expect(ansicht(seite).locator('button')).toHaveText(['Statistik', 'Kalender', 'Raster']);
  await expect(ansicht(seite).locator('button.on')).toHaveText('Statistik');
  await expect(seite.locator('.sd-duel')).toBeVisible();
  await expect(seite.getByRole('button', { name: 'Letzte 30 Tage' })).toHaveClass(/on/);
  await expect(seite.locator('.sd-hdr .sd-sub')).toContainText('30 Tage');
  // Statistik kennt keinen „Tag“
  await expect(seite.getByRole('button', { name: 'Tag', exact: true })).toHaveCount(0);
  await seite.getByRole('button', { name: 'Kalender', exact: true }).click();
  await expect(seite.locator('.sd-cal').first()).toBeVisible();
  await tab(seite, 'Heute');
  await tab(seite, 'Verlauf');
  await expect(ansicht(seite).locator('button.on')).toHaveText('Kalender');
  expect(seite.fehler).toEqual([]);
});

test('Ein Zeitraum für alle Ansichten; „Tag“ zeigt in der Statistik die Woche', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Verlauf');
  await seite.getByRole('button', { name: 'Monat', exact: true }).click();
  const monat = await seite.locator('.sd-hdr .sd-sub').textContent();
  await seite.getByRole('button', { name: 'Kalender', exact: true }).click();
  await expect(seite.getByRole('button', { name: 'Monat', exact: true })).toHaveClass(/on/);
  await expect(seite.locator('.sd-hdr .sd-sub')).toHaveText(monat);
  await seite.getByRole('button', { name: 'Raster', exact: true }).click();
  await expect(seite.getByRole('button', { name: 'Monat', exact: true })).toHaveClass(/on/);

  await seite.getByRole('button', { name: 'Kalender', exact: true }).click();
  await seite.getByRole('button', { name: 'Tag', exact: true }).click();
  await expect(seite.locator('.sd-hdr .sd-sub')).toContainText('Heute');
  await seite.getByRole('button', { name: 'Statistik', exact: true }).click();
  await expect(seite.locator('.sd-hdr .sd-sub')).toContainText('Diese Woche');
  await expect(seite.getByRole('button', { name: 'Woche', exact: true })).toHaveClass(/on/);
  // Eine Woche zurück und wieder in den Kalender: dort ist es der Tag eine Woche früher
  await seite.getByRole('button', { name: 'Zurück' }).click();
  await expect(seite.locator('.sd-hdr .sd-sub')).toContainText('KW');
  await seite.getByRole('button', { name: 'Kalender', exact: true }).click();
  await expect(seite.getByRole('button', { name: 'Tag', exact: true })).toHaveClass(/on/);
  expect(seite.fehler).toEqual([]);
});

test('Statistik-Karten richten sich nach dem Zeitraum, „Je Routine“ nur noch in der Statistik', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Verlauf');
  for (const h of ['Aufgaben', 'Perfekte Tage', 'Verlauf je Woche', 'Nach Wochentag', 'Nach Bereich', 'Je Routine']) await expect(seite.getByRole('heading', { name: h })).toBeVisible();
  // „x von y“ bei Simon: y = geplante Erledigungen; in 7 Tagen weniger als in 30
  const geplant = async () => +(await seite.locator('.sd-duelp.a small').textContent()).split(' von ')[1];
  const in30 = await geplant();
  await seite.getByRole('button', { name: 'Letzte 7 Tage' }).click();
  await expect(seite.locator('.sd-hdr .sd-sub')).toContainText('7 Tage');
  const in7 = await geplant();
  expect(in7).toBeGreaterThan(0);
  expect(in7).toBeLessThan(in30);
  await seite.getByRole('button', { name: 'Kalender', exact: true }).click();
  await expect(seite.getByText('Je Routine')).toHaveCount(0);
  // Kalender und Raster: Person wählen ohne Duo
  await expect(seite.locator('.sd-who3 button')).toHaveText(['Simon', 'Irina']);
  expect(seite.fehler).toEqual([]);
});
