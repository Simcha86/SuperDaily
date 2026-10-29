// Aufgaben (Version 7) im lokalen Modus mit Beispieldaten (sieben Aufgaben, Sicht von Simon):
// Tab mit Gruppen und Filtern, anlegen, ändern, löschen, Heute, Kalender, Statistik.
import { test, expect, oeffneHandy, tab } from '../hilfen.js';

const aufgabe = (seite, titel) => seite.locator('.sd-titem', { hasText: titel });

test('Aufgaben-Tab: Gruppen, Filter und Zahl am Tab', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await expect(seite.locator('.sd-tab .sd-badge')).toHaveText('3');
  await tab(seite, 'Aufgaben');
  await expect(seite.locator('.sd-tbanner')).toContainText('3');
  const gruppe = name => seite.locator('.sd-group', { has: seite.locator('.sd-label', { hasText: name }) });
  await expect(gruppe('Überfällig')).toContainText('Paket zur Post bringen');
  await expect(gruppe('Heute')).toContainText('Arzttermin für Mia ausmachen');
  await expect(gruppe('Heute')).toContainText('Geschenk für Oma besorgen');
  await expect(gruppe('Ohne Datum')).toContainText('Urlaub planen');
  await expect(aufgabe(seite, 'Babysitter')).toHaveCount(0);
  await seite.getByRole('button', { name: 'Vergeben', exact: true }).click();
  await expect(aufgabe(seite, 'Babysitter für Samstag fragen')).toContainText('von Simon an Irina');
  await seite.getByRole('button', { name: 'Alle', exact: true }).click();
  await expect(seite.locator('.sd-titem')).toHaveCount(6);
  await seite.getByRole('button', { name: 'Erledigt', exact: true }).click();
  await expect(aufgabe(seite, 'Fahrrad zur Inspektion')).toHaveClass(/done/);
  expect(seite.fehler).toEqual([]);
});

test('Aufgabe anlegen, abhaken, ändern und löschen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Aufgaben');
  await seite.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  await expect(seite.getByRole('button', { name: 'Aufgabe vergeben' })).toBeDisabled();
  await seite.getByPlaceholder('z. B. Paket zur Post bringen').fill('Fenster putzen');
  await seite.locator('.sd-sheet').getByRole('button', { name: 'Simon', exact: true }).click();
  await seite.locator('.sd-sheet').getByRole('button', { name: 'Ohne Datum', exact: true }).click();
  await seite.getByRole('button', { name: 'Aufgabe vergeben' }).click();
  await expect(seite.locator('.sd-group', { has: seite.locator('.sd-label', { hasText: 'Ohne Datum' }) })).toContainText('Fenster putzen');
  await expect(aufgabe(seite, 'Fenster putzen')).toContainText('selbst');

  await seite.getByRole('button', { name: 'Fenster putzen abhaken' }).click();
  await expect(aufgabe(seite, 'Fenster putzen')).toHaveCount(0);
  await seite.getByRole('button', { name: 'Erledigt', exact: true }).click();
  await seite.getByRole('button', { name: 'Fenster putzen wieder öffnen' }).click();
  await seite.getByRole('button', { name: 'Für mich', exact: true }).click();
  await aufgabe(seite, 'Fenster putzen').locator('.txt').click();
  await seite.getByPlaceholder('z. B. Paket zur Post bringen').fill('Fenster und Türen putzen');
  await seite.locator('.sd-sheet').getByRole('button', { name: 'Morgen', exact: true }).click();
  await seite.getByRole('button', { name: 'Speichern' }).click();
  await expect(seite.locator('.sd-group', { has: seite.locator('.sd-label', { hasText: 'Morgen' }) })).toContainText('Fenster und Türen putzen');
  await aufgabe(seite, 'Fenster und Türen putzen').locator('.txt').click();
  await seite.getByRole('button', { name: 'Aufgabe löschen' }).click();
  await expect(aufgabe(seite, 'Fenster und Türen putzen')).toHaveCount(0);
  const gespeichert = await seite.evaluate(() => Object.values(JSON.parse(localStorage.getItem('superdaily-v1')).tasks).map(t => t.title));
  expect(gespeichert).not.toContain('Fenster und Türen putzen');
  expect(seite.fehler).toEqual([]);
});

test('Heute: fällige Aufgaben stehen ganz oben, vor den Routinen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  const reihenfolge = await seite.locator('.sd-scroll > *').evaluateAll(l => l.map(e => e.className));
  expect(reihenfolge.findIndex(c => c.includes('sd-tasks'))).toBeLessThan(reihenfolge.findIndex(c => c.includes('sd-hero')));
  await expect(seite.locator('.sd-tasks .sd-titem')).toHaveCount(3);
  await seite.getByRole('button', { name: 'Paket zur Post bringen abhaken' }).click();
  await expect(aufgabe(seite, 'Paket zur Post bringen')).toHaveClass(/done/);
  await expect(seite.locator('.sd-tab .sd-badge')).toHaveText('2');
});

test('Kalender: Punkte an Tagen mit Aufgaben, Liste im Monat, Raster als Ansicht', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Kalender');
  await expect(seite.locator('.sd-cal button.tlate')).toHaveCount(1);
  await expect(seite.locator('.sd-cal button.today')).toHaveClass(/topen/);
  await expect(seite.locator('.sd-tasks')).toContainText('Aufgaben in diesem Monat');
  await seite.getByRole('button', { name: 'Raster', exact: true }).click();
  await expect(seite.locator('.sd-hdr h1')).toHaveText('Diese Woche');
  await seite.getByRole('button', { name: 'Kalender', exact: true }).first().click();
  await expect(seite.locator('.sd-cal').first()).toBeVisible();
  expect(seite.fehler).toEqual([]);
});

test('Statistik: Karte „Aufgaben“ je Person', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Statistik');
  const karte = seite.locator('.sd-tstat');
  await expect(karte.getByRole('heading', { name: 'Aufgaben' })).toBeVisible();
  const zeile = async p => karte.locator('.sd-stgrid > span').evaluateAll((l, p) => { const i = l.findIndex(e => e.classList.contains(p)); return l.slice(i + 1, i + 5).map(e => e.textContent); }, p);
  expect(await zeile('a')).toEqual(['1', '0%', '5', '1']);
  expect(await zeile('b')).toEqual(['0', '–', '3', '0']);
  await expect(karte.locator('.sd-given')).toContainText('Simon → Irina: 1Irina → Simon: 3Gemeinsam: 2');
  expect(seite.fehler).toEqual([]);
});
