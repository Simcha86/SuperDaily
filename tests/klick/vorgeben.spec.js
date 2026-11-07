// Version 11: Routinen für die andere Person vorgeben (#16) und Hinweise „Neu von …“ (#23), lokaler Modus.
import { test, expect, oeffneHandy, tab } from '../hilfen.js';

// Gemerkten Zeitpunkt „zuletzt gesehen“ in die Vergangenheit setzen, damit vorhandene Beispieldaten als neu gelten
async function zuletztGesehen(seite, wert) {
  await seite.evaluate(w => localStorage.setItem('superdaily-seen-items', JSON.stringify(w)), wert);
  await seite.reload();
  await expect(seite.locator('.sd-tabs')).toBeVisible();
}
async function ichBin(seite, name) {
  await tab(seite, 'Mehr');
  await seite.locator('.sd-card', { hasText: 'Ich bin' }).getByRole('button', { name, exact: true }).click();
}

test('Simon gibt Irina eine Routine vor: „Für wen“ bietet alle vier, „vorgegeben von Simon“ unter Routinen und auf Heute', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Routinen');
  await seite.getByRole('button', { name: 'Routine hinzufügen' }).click();
  await expect(seite.locator('.sd-sheet [data-a="dWho"]')).toHaveText(['Simon', 'Irina', 'Beide einzeln', 'Gemeinsam']);
  await seite.getByPlaceholder('z. B. Zahnseide').fill('Yoga');
  await seite.locator('.sd-sheet').getByRole('button', { name: 'Irina', exact: true }).click();
  await seite.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  await expect(seite.locator('.sd-row', { hasText: 'Yoga' })).toContainText('vorgegeben von Simon');
  // Eigene Routinen ohne Vermerk
  await expect(seite.locator('.sd-row', { hasText: '30 Minuten Sport' })).not.toContainText('vorgegeben');
  const r = await seite.evaluate(() => Object.values(JSON.parse(localStorage.getItem('superdaily-v1')).routines).find(x => x.title === 'Yoga'));
  expect(r).toMatchObject({ who: 'b', from: 'a' });

  // Irinas Tag auf Heute zeigt den Vermerk; bearbeiten erhält ihn
  await tab(seite, 'Heute');
  await seite.locator('.sd-who3').getByRole('button', { name: 'Irina' }).click();
  await expect(seite.locator('.sd-item', { hasText: 'Yoga' })).toContainText('vorgegeben von Simon');
  await tab(seite, 'Routinen');
  await seite.locator('.sd-row', { hasText: 'Yoga' }).click();
  await seite.getByRole('button', { name: 'Abend', exact: true }).click();
  await seite.getByRole('button', { name: 'Speichern' }).click();
  await expect(seite.locator('.sd-row', { hasText: 'Yoga' })).toContainText('Abend · Täglich · vorgegeben von Simon');
  expect(seite.fehler).toEqual([]);
});

test('Hinweis „3 neue Aufgaben von Irina“: Antippen öffnet Aufgaben, danach weg', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  // Erster Start: nichts als neu markiert
  await expect(seite.locator('.sd-hlink')).toHaveCount(0);
  await zuletztGesehen(seite, { 'a|task': 1, 'a|routine': 1 });
  // Offen, von Irina, für Simon oder gemeinsam: Paket, Arzttermin, Urlaub planen
  const hinweis = seite.getByRole('button', { name: '3 neue Aufgaben von Irina' });
  await expect(hinweis).toBeVisible();
  await expect(seite.getByRole('button', { name: /neue Routine/ })).toHaveCount(0);
  await hinweis.click();
  await expect(seite.locator('.sd-hdr h1')).toHaveText('Aufgaben');
  await tab(seite, 'Heute');
  await expect(seite.locator('.sd-hlink')).toHaveCount(0);
  expect(seite.fehler).toEqual([]);
});

test('Hinweis „1 neue Routine von Simon“ bei Irina, schließen per X, Besuch im Tab zählt als gesehen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Routinen');
  await seite.getByRole('button', { name: 'Routine hinzufügen' }).click();
  await seite.getByPlaceholder('z. B. Zahnseide').fill('Yoga');
  await seite.locator('.sd-sheet').getByRole('button', { name: 'Irina', exact: true }).click();
  await seite.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  // Simon sieht keinen Hinweis für seine eigene Vorgabe
  await tab(seite, 'Heute');
  await expect(seite.locator('.sd-hlink')).toHaveCount(0);

  await zuletztGesehen(seite, { 'b|routine': 1, 'b|task': 1 });
  await ichBin(seite, 'Irina');
  await tab(seite, 'Heute');
  await expect(seite.getByRole('button', { name: '1 neue Routine von Simon' })).toBeVisible();
  await expect(seite.getByRole('button', { name: '2 neue Aufgaben von Simon' })).toBeVisible();
  // X schließt den Routinen-Hinweis
  await seite.locator('.sd-hint', { hasText: 'neue Routine' }).getByRole('button', { name: 'Hinweis schließen' }).click();
  await expect(seite.getByRole('button', { name: /neue Routine/ })).toHaveCount(0);
  // Tab Aufgaben besuchen zählt als gesehen
  await tab(seite, 'Aufgaben');
  await tab(seite, 'Heute');
  await expect(seite.locator('.sd-hlink')).toHaveCount(0);
  expect(seite.fehler).toEqual([]);
});
