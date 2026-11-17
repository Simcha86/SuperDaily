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
  await expect(seite.locator('.sd-sheet [data-a="dWho"]')).toHaveText(['Simon', 'Irina', 'Jeder für sich', 'Gemeinsam']);
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

test('Neue Aufgaben von Irina (seit Version 18): Punkt am Bereich, Hinweis „3 neue Aufgaben von Irina“ beim Öffnen, danach weg', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  // Erster Start: nichts als neu markiert
  await expect(seite.locator('.sd-hlink')).toHaveCount(0);
  await zuletztGesehen(seite, { 'a|task': 1, 'a|routine': 1 });
  // „Heute“ bleibt bei Routinen: kein Aufgaben-Hinweis
  await expect(seite.getByRole('button', { name: /neue Aufgabe/ })).toHaveCount(0);
  await expect(seite.getByRole('button', { name: /neue Routine/ })).toHaveCount(0);
  // Offen, von Irina, für Simon oder gemeinsam: Paket, Arzttermin, Urlaub planen
  await tab(seite, 'Aufgaben');
  await expect(seite.getByRole('status').filter({ hasText: 'neue Aufgaben' })).toContainText('3 neue Aufgaben von Irina');
  await tab(seite, 'Heute');
  await tab(seite, 'Aufgaben');
  await expect(seite.getByText(/neue Aufgaben von Irina/)).toHaveCount(0);
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
  // Neue Aufgaben: Punkt am Bereich „Aufgaben“ (wenn nichts fällig ist) statt Hinweis auf „Heute“
  await expect(seite.getByRole('button', { name: /neue Aufgabe/ })).toHaveCount(0);
  // X schließt den Routinen-Hinweis
  await seite.locator('.sd-hint', { hasText: 'neue Routine' }).getByRole('button', { name: 'Hinweis schließen' }).click();
  await expect(seite.getByRole('button', { name: /neue Routine/ })).toHaveCount(0);
  // Tab Aufgaben besuchen zeigt den Hinweis einmal und zählt als gesehen
  await tab(seite, 'Aufgaben');
  await expect(seite.getByText('2 neue Aufgaben von Simon')).toBeVisible();
  await tab(seite, 'Heute');
  await expect(seite.locator('.sd-hlink')).toHaveCount(0);
  expect(seite.fehler).toEqual([]);
});

test('Punkt am Bereich „Aufgaben“ bei neuer Aufgabe ohne Fälligkeit (seit Version 18)', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  // Nur Aufgaben ohne Fälligkeit: Zahl fällt weg, Punkt erscheint für neue von Irina
  await seite.evaluate(() => { const d = JSON.parse(localStorage.getItem('superdaily-v1')); for (const t of Object.values(d.tasks)) t.due = null; localStorage.setItem('superdaily-v1', JSON.stringify(d)); });
  await zuletztGesehen(seite, { 'a|task': 1, 'a|routine': 1 });
  const bereich = seite.locator('.sd-tab', { hasText: 'Aufgaben' });
  await expect(bereich.locator('.sd-bdot')).toBeVisible();
  await expect(bereich.locator('.sd-bdot')).toHaveAttribute('aria-label', 'Neue Aufgaben');
  await tab(seite, 'Aufgaben');
  await tab(seite, 'Heute');
  await expect(bereich.locator('.sd-bdot')).toHaveCount(0);
  expect(seite.fehler).toEqual([]);
});
