// Regression: Vergangene Tage behalten ihre Wertung, wenn Routinen geändert, archiviert
// oder wiederhergestellt werden (Version 4, „Verlauf bleibt richtig“).
import { test, expect, oeffneHandy, tab } from '../hilfen.js';

const heuteKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// Kalender „Von – bis“, letzte 30 Tage: Quoten aller vergangenen Tage einer Person (heute ausgenommen)
async function vergangeneQuoten(seite, person) {
  await tab(seite, 'Kalender');
  await seite.locator('.sd-dots').getByRole('button', { name: person, exact: true }).click();
  await seite.getByRole('button', { name: 'Von – bis' }).click();
  await seite.getByRole('button', { name: 'Letzte 30 Tage' }).click();
  const labels = await seite.locator('.sd-cal button[aria-label*="%"]').evaluateAll(bs => bs.map(b => b.getAttribute('aria-label')));
  return labels.filter(l => !l.startsWith(heuteKey()));
}
const gespeicherteRoutine = (seite, id) => seite.evaluate(i => JSON.parse(localStorage.getItem('superdaily-v1')).routines[i], id);

async function routineOeffnen(seite, titel) {
  await tab(seite, 'Routinen');
  await seite.getByRole('button', { name: new RegExp(titel) }).click();
  await expect(seite.getByRole('heading', { name: 'Routine bearbeiten' })).toBeVisible();
}

test('Wiederholung ändern: vergangene Quoten bleiben gleich, alter Plan wird als Version gespeichert', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  const vorher = await vergangeneQuoten(seite, 'Simon');
  expect(vorher.length).toBeGreaterThanOrEqual(20);

  await routineOeffnen(seite, '30 Minuten Sport');
  await seite.getByRole('button', { name: 'Wochentage', exact: true }).click();
  await expect(seite.getByText('Die Änderung gilt ab heute')).toBeVisible();
  await seite.getByRole('button', { name: 'Speichern' }).click();

  expect(await vergangeneQuoten(seite, 'Simon')).toEqual(vorher);
  const r = await gespeicherteRoutine(seite, 's');
  expect(r.hist).toHaveLength(1);
  expect(r.hist[0].rep.type).toBe('daily');
  expect(seite.fehler).toEqual([]);
});

test('Zweite Änderung am selben Tag erzeugt keine zweite Version', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  const vorher = await vergangeneQuoten(seite, 'Simon');
  for (const art of ['Wochentage', 'X-mal pro Woche']) {
    await routineOeffnen(seite, '30 Minuten Sport');
    await seite.getByRole('button', { name: art, exact: true }).click();
    await seite.getByRole('button', { name: 'Speichern' }).click();
  }
  const r = await gespeicherteRoutine(seite, 's');
  expect(r.hist).toHaveLength(1);
  expect(r.hist[0].rep.type).toBe('daily');
  expect(await vergangeneQuoten(seite, 'Simon')).toEqual(vorher);
});

test('Archivieren und Wiederherstellen: vergangene Quoten beider Personen bleiben gleich', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  const simon = await vergangeneQuoten(seite, 'Simon'), irina = await vergangeneQuoten(seite, 'Irina');

  await routineOeffnen(seite, 'Zahnseide');
  await seite.getByRole('button', { name: 'Routine archivieren' }).click();
  await expect(seite.locator('.sd-group').getByRole('button', { name: /Zahnseide/ })).toHaveCount(0);
  await expect(seite.getByText('Archiviert', { exact: false }).first()).toBeVisible();
  expect(await vergangeneQuoten(seite, 'Simon')).toEqual(simon);
  expect(await vergangeneQuoten(seite, 'Irina')).toEqual(irina);

  await tab(seite, 'Heute');
  await seite.locator('.sd-who3').getByRole('button', { name: 'Simon', exact: true }).click();
  // Heute schon abgehakt → bleibt heute als erledigt sichtbar, darf aber nicht mehr offen sein
  await expect(seite.locator('.sd-item:not(.done)', { hasText: 'Zahnseide' })).toHaveCount(0);

  await tab(seite, 'Routinen');
  await seite.locator('.sd-arch summary').click();
  await seite.getByRole('button', { name: 'Wiederherstellen' }).click();
  await expect(seite.locator('.sd-group').getByRole('button', { name: /Zahnseide/ })).toHaveCount(1);
  expect(await vergangeneQuoten(seite, 'Simon')).toEqual(simon);
  expect(await vergangeneQuoten(seite, 'Irina')).toEqual(irina);
  expect(seite.fehler).toEqual([]);
});

test('Abhaken an einem vergangenen Tag nutzt die Einstellung dieses Tages (früher gemeinsam, jetzt beide einzeln)', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await routineOeffnen(seite, 'Glas Wasser');
  await seite.getByRole('button', { name: 'Beide einzeln', exact: true }).click();
  await seite.getByRole('button', { name: 'Speichern' }).click();
  expect((await gespeicherteRoutine(seite, 'w')).hist[0].who).toBe('s');

  const gestern = await seite.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const haken = () => seite.evaluate(k => JSON.parse(localStorage.getItem('superdaily-v1')).done[k] || {}, gestern);
  const vorher = !!(await haken())['s|w'];

  await tab(seite, 'Heute');
  await seite.locator('.sd-strip button').nth(5).click();
  await seite.locator('.sd-item', { hasText: 'Glas Wasser' }).click();
  const nachher = await haken();
  expect(!!nachher['s|w']).toBe(!vorher);
  expect(nachher['a|w']).toBeUndefined();
  expect(seite.fehler).toEqual([]);
});
