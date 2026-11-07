// Zwei Personen gegen Auth- und Firestore-Emulator: Simon und Irina auf je einem „Handy“.
// Prüft Haushalt anlegen und beitreten, Rechte (alle sehen alles, abhaken/bearbeiten nur
// eigene und gemeinsame Routinen) und den Live-Abgleich zwischen beiden Geräten.
// Starten nur über: npm run test:app (startet die Emulatoren).
import { test, expect, oeffneHandy, tab } from './hilfen.js';

let zaehler = 0;
const neueEmail = name => `${name}.${Date.now()}.${++zaehler}@beispiel.de`;

async function registrieren(seite, email) {
  await seite.getByRole('button', { name: 'Registrieren' }).click();
  await seite.getByLabel('E-Mail').fill(email);
  await seite.getByLabel('Passwort').fill('geheim123');
  await seite.getByRole('button', { name: 'Konto anlegen' }).click();
  await expect(seite.getByRole('heading', { name: 'Haushalt', exact: true })).toBeVisible();
}

// Beitreten ohne Personenwahl: die App nimmt automatisch die noch freie Person (Version 6).
async function beitreten(seite, code) {
  const karte = seite.locator('.sd-card', { hasText: 'Mit Code beitreten' });
  await karte.getByPlaceholder('z. B. K7Q2XM').fill(code);
  await karte.getByRole('button', { name: 'Beitreten' }).click();
}

async function routineAnlegen(seite, titel, fuer) {
  await tab(seite, 'Routinen');
  await seite.getByRole('button', { name: 'Routine hinzufügen' }).click();
  await seite.getByPlaceholder('z. B. Zahnseide').fill(titel);
  await seite.locator('.sd-sheet').getByRole('button', { name: fuer, exact: true }).click();
  await seite.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  await expect(seite.locator('.sd-sheet')).toHaveCount(0);
}

// Simon legt den Haushalt an, Irina tritt bei; Simon legt drei Routinen an.
async function haushalt(browser, server) {
  const simon = await oeffneHandy(browser, server);
  await registrieren(simon, neueEmail('simon'));
  await simon.getByRole('button', { name: 'Anlegen' }).click();
  await tab(simon, 'Mehr');
  const code = (await simon.locator('.sd-code').innerText()).trim();
  await routineAnlegen(simon, 'Sport', 'Simon');
  await routineAnlegen(simon, 'Zahnseide', 'Beide einzeln');
  await routineAnlegen(simon, 'Glas Wasser', 'Gemeinsam');
  const irina = await oeffneHandy(browser, server);
  await registrieren(irina, neueEmail('irina'));
  await beitreten(irina, code);
  await expect(irina.locator('.sd-tabs')).toBeVisible();
  return { simon, irina, code };
}

const routineHeute = (seite, titel) => seite.locator('.sd-item', { hasText: titel });

test('Haushalt anlegen und beitreten: freie Person automatisch, dritte Person abgewiesen', async ({ browser, emulator }) => {
  const simon = await oeffneHandy(browser, emulator);
  await registrieren(simon, neueEmail('simon'));
  await simon.getByRole('button', { name: 'Anlegen' }).click();
  await tab(simon, 'Mehr');
  const code = (await simon.locator('.sd-code').innerText()).trim();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);
  await expect(simon.getByRole('heading', { name: 'Ich bin Simon' })).toBeVisible();

  const irina = await oeffneHandy(browser, emulator);
  await registrieren(irina, neueEmail('irina'));
  const karte = irina.locator('.sd-card', { hasText: 'Mit Code beitreten' });
  await expect(karte.getByRole('button', { name: 'Simon', exact: true })).toHaveCount(0);
  await expect(karte).toContainText('automatisch die noch freie Person');
  await beitreten(irina, 'FALSCH');
  await expect(irina.getByText(/Beitreten fehlgeschlagen/)).toBeVisible();
  await beitreten(irina, code);
  await expect(irina.locator('.sd-tabs')).toBeVisible();
  await expect(irina.locator('.sd-who3 button.on')).toHaveText('Irina');
  await tab(irina, 'Mehr');
  await expect(irina.getByRole('heading', { name: 'Ich bin Irina' })).toBeVisible();

  const fremd = await oeffneHandy(browser, emulator);
  await registrieren(fremd, neueEmail('fremd'));
  await beitreten(fremd, code);
  await expect(fremd.getByText(/Beitreten fehlgeschlagen/)).toBeVisible();
  await expect(fremd.locator('.sd-tabs')).toHaveCount(0);

  expect([...simon.fehler, ...irina.fehler]).toEqual([]);
});

test('Legt Irina den Haushalt an, wird die zweite Person automatisch Simon', async ({ browser, emulator }) => {
  const irina = await oeffneHandy(browser, emulator);
  await registrieren(irina, neueEmail('irina'));
  await irina.locator('.sd-card', { hasText: 'Neuen Haushalt anlegen' }).getByRole('button', { name: 'Irina', exact: true }).click();
  await irina.getByRole('button', { name: 'Anlegen' }).click();
  await tab(irina, 'Mehr');
  const code = (await irina.locator('.sd-code').innerText()).trim();

  const simon = await oeffneHandy(browser, emulator);
  await registrieren(simon, neueEmail('simon'));
  await beitreten(simon, code);
  await expect(simon.locator('.sd-who3 button.on')).toHaveText('Simon');
  expect([...simon.fehler, ...irina.fehler]).toEqual([]);
});

test('Irina hakt bei Simon ab (seit Version 7); gemeinsame Routinen haken beide ab, live abgeglichen', async ({ browser, emulator }) => {
  const { simon, irina } = await haushalt(browser, emulator);
  await tab(simon, 'Heute');
  await routineHeute(simon, 'Sport').click();
  await expect(routineHeute(simon, 'Sport')).toHaveClass(/done/);

  await tab(irina, 'Heute');
  await expect(routineHeute(irina, 'Zahnseide')).toBeVisible();
  await expect(routineHeute(irina, 'Sport')).toHaveCount(0);
  await routineHeute(irina, 'Zahnseide').click();
  await expect(routineHeute(irina, 'Zahnseide')).toHaveClass(/done/);

  // Simons Tag ansehen
  await irina.locator('.sd-who3').getByRole('button', { name: 'Simon', exact: true }).click();
  await expect(irina.getByText(/Du siehst Simons Routinen und kannst sie auch für Simon abhaken/)).toBeVisible();
  await expect(routineHeute(irina, 'Sport')).toHaveClass(/done/);
  await expect(routineHeute(irina, 'Sport')).not.toHaveClass(/ro/);
  await routineHeute(irina, 'Sport').click();
  await expect(routineHeute(irina, 'Sport')).not.toHaveClass(/done/);
  await expect(routineHeute(simon, 'Sport')).not.toHaveClass(/done/);
  await routineHeute(irina, 'Zahnseide').click();
  await expect(routineHeute(simon, 'Zahnseide')).toHaveClass(/done/);

  // Gemeinsame Routine: Irina hakt ab, Simon sieht es live
  await routineHeute(irina, 'Glas Wasser').click();
  await expect(routineHeute(irina, 'Glas Wasser')).toHaveClass(/done/);
  await tab(simon, 'Heute');
  await expect(routineHeute(simon, 'Glas Wasser')).toHaveClass(/done/);

  // Simon sieht Irinas Zahnseide erledigt und dürfte auch für sie abhaken
  await simon.locator('.sd-who3').getByRole('button', { name: 'Irina', exact: true }).click();
  await expect(routineHeute(simon, 'Zahnseide')).toHaveClass(/done/);
  await expect(routineHeute(simon, 'Zahnseide')).not.toHaveClass(/ro/);

  expect([...simon.fehler, ...irina.fehler]).toEqual([]);
});

test('Routinen und Bereiche: beide bearbeiten alle Routinen (seit Version 11), Bereiche und Archiv live bei beiden', async ({ browser, emulator }) => {
  const { simon, irina } = await haushalt(browser, emulator);

  await tab(irina, 'Routinen');
  await expect(irina.locator('.sd-row.ro')).toHaveCount(0);
  await expect(irina.locator('.sd-row .ph-lock-simple')).toHaveCount(0);
  await irina.getByRole('button', { name: 'Routine hinzufügen' }).click();
  const personen = await irina.locator('.sd-sheet [data-a="dWho"]').allInnerTexts();
  expect(personen).toEqual(['Simon', 'Irina', 'Beide einzeln', 'Gemeinsam']);
  await irina.locator('.sd-back').click({ position: { x: 20, y: 20 } });

  // Irina ändert Simons Routine, Simon sieht es live
  await irina.locator('.sd-row', { hasText: 'Sport' }).click();
  await irina.locator('[data-in="dTitle"]').fill('Sport am Morgen');
  await irina.getByRole('button', { name: 'Speichern' }).click();
  await tab(simon, 'Routinen');
  await expect(simon.locator('.sd-row', { hasText: 'Sport am Morgen' })).toHaveCount(1);

  // Irina legt einen Bereich an, Simon sieht ihn
  await irina.locator('.sd-hdr').getByRole('button', { name: 'Bereiche' }).click();
  await irina.getByPlaceholder('Neuer Bereich, z. B. Beruf').fill('Garten');
  await irina.getByRole('button', { name: 'Anlegen' }).click();
  await expect(irina.locator('.sd-catrow input[value="Garten"]')).toHaveCount(1);
  await irina.getByRole('button', { name: 'Fertig' }).click();
  await simon.locator('.sd-hdr').getByRole('button', { name: 'Bereiche' }).click();
  await expect(simon.locator('.sd-catrow input[value="Garten"]')).toHaveCount(1);
  await simon.getByRole('button', { name: 'Fertig' }).click();
  await expect(simon.locator('.sd-sheet')).toHaveCount(0);

  // Simon archiviert seine Routine; Irina sieht sie im Archiv und darf sie wiederherstellen
  await simon.getByRole('button', { name: /Sport am Morgen/ }).click();
  await simon.getByRole('button', { name: 'Routine archivieren' }).click();
  await expect(irina.locator('.sd-arch summary')).toContainText('1');
  await irina.locator('.sd-arch summary').click();
  await irina.getByRole('button', { name: 'Wiederherstellen' }).click();
  await expect(simon.locator('.sd-arch')).toHaveCount(0);

  await tab(irina, 'Verlauf');
  await expect(irina.locator('.sd-duel')).toContainText('Simon');
  await expect(irina.locator('.sd-duel')).toContainText('Irina');

  expect([...simon.fehler, ...irina.fehler]).toEqual([]);
});

test('Vorgeben: Irina gibt Simon eine Routine und eine Aufgabe – Simon sieht „vorgegeben von Irina“ und die Hinweise', async ({ browser, emulator }) => {
  const { simon, irina } = await haushalt(browser, emulator);
  await tab(simon, 'Heute');
  await expect(simon.locator('.sd-hlink')).toHaveCount(0);

  await routineAnlegen(irina, 'Vitamine nehmen', 'Simon');
  await expect(irina.locator('.sd-row', { hasText: 'Vitamine nehmen' })).toContainText('vorgegeben von Irina');
  await tab(irina, 'Aufgaben');
  await irina.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  await irina.getByPlaceholder('z. B. Paket zur Post bringen').fill('Reifen wechseln');
  await irina.locator('.sd-tsheet').getByRole('button', { name: 'Simon', exact: true }).click();
  await irina.getByRole('button', { name: 'Aufgabe vergeben' }).click();

  // Simon: Hinweise auf Heute, live
  await expect(simon.getByRole('button', { name: '1 neue Routine von Irina' })).toBeVisible();
  await expect(simon.getByRole('button', { name: '1 neue Aufgabe von Irina' })).toBeVisible();
  await expect(routineHeute(simon, 'Vitamine nehmen')).toContainText('vorgegeben von Irina');
  // Irina sieht für sich keine Hinweise (sie hat es selbst vergeben)
  await tab(irina, 'Heute');
  await expect(irina.locator('.sd-hlink')).toHaveCount(0);

  // Antippen öffnet den Tab, danach ist der Hinweis weg – auch nach Neuladen
  await simon.getByRole('button', { name: '1 neue Aufgabe von Irina' }).click();
  await expect(simon.locator('.sd-tab.on')).toContainText('Aufgaben');
  await expect(simon.locator('.sd-titem', { hasText: 'Reifen wechseln' })).toBeVisible();
  await tab(simon, 'Heute');
  await expect(simon.getByRole('button', { name: /neue Aufgabe/ })).toHaveCount(0);
  await simon.getByRole('button', { name: 'Hinweis schließen' }).click();
  await expect(simon.locator('.sd-hlink')).toHaveCount(0);
  await simon.reload();
  await expect(simon.locator('.sd-tabs')).toBeVisible();
  await expect(simon.locator('.sd-hlink')).toHaveCount(0);

  // Simon darf die vorgegebene Routine bearbeiten; „vorgegeben von Irina“ bleibt
  await tab(simon, 'Routinen');
  await simon.locator('.sd-row', { hasText: 'Vitamine nehmen' }).click();
  await simon.locator('[data-in="dTitle"]').fill('Vitamine D nehmen');
  await simon.getByRole('button', { name: 'Speichern' }).click();
  await tab(irina, 'Routinen');
  await expect(irina.locator('.sd-row', { hasText: 'Vitamine D nehmen' })).toContainText('vorgegeben von Irina');

  expect([...simon.fehler, ...irina.fehler]).toEqual([]);
});

test('Aufgaben: Simon gibt Irina eine Aufgabe, beide haken ab, ändern und löschen – live bei beiden', async ({ browser, emulator }) => {
  const { simon, irina } = await haushalt(browser, emulator);
  const aufgabe = (seite, titel) => seite.locator('.sd-titem', { hasText: titel });

  await tab(simon, 'Aufgaben');
  await simon.getByRole('button', { name: 'Aufgabe hinzufügen' }).click();
  await simon.getByPlaceholder('z. B. Paket zur Post bringen').fill('Blumen kaufen');
  await simon.locator('.sd-sheet').getByRole('button', { name: 'Irina', exact: true }).click();
  await simon.locator('.sd-sheet').getByRole('button', { name: 'Heute', exact: true }).click();
  await simon.getByRole('button', { name: 'Aufgabe vergeben' }).click();
  await expect(simon.locator('.sd-sheet')).toHaveCount(0);
  await simon.getByRole('button', { name: 'Vergeben', exact: true }).click();
  await expect(aufgabe(simon, 'Blumen kaufen')).toContainText('von Simon an Irina');

  // Irina sieht sie ganz oben auf „Heute“ und mit Zahl am Tab
  await tab(irina, 'Heute');
  await expect(irina.locator('.sd-group.sd-tasks')).toContainText('Blumen kaufen');
  await expect(irina.locator('.sd-tab .sd-badge')).toHaveText('1');
  await irina.getByRole('button', { name: 'Blumen kaufen abhaken' }).click();
  await expect(aufgabe(simon, 'Blumen kaufen')).toHaveCount(0);
  await simon.getByRole('button', { name: 'Erledigt', exact: true }).click();
  await expect(aufgabe(simon, 'Blumen kaufen')).toHaveClass(/done/);

  // Simon öffnet sie wieder und benennt sie um; Irina löscht sie
  await simon.getByRole('button', { name: 'Blumen kaufen wieder öffnen' }).click();
  await simon.getByRole('button', { name: 'Vergeben', exact: true }).click();
  await aufgabe(simon, 'Blumen kaufen').locator('.txt').click();
  await simon.getByPlaceholder('z. B. Paket zur Post bringen').fill('Tulpen kaufen');
  await simon.getByRole('button', { name: 'Speichern' }).click();
  await expect(irina.locator('.sd-group.sd-tasks')).toContainText('Tulpen kaufen');
  await tab(irina, 'Aufgaben');
  await aufgabe(irina, 'Tulpen kaufen').locator('.txt').click();
  await irina.getByRole('button', { name: 'Aufgabe löschen' }).click();
  await expect(aufgabe(simon, 'Tulpen kaufen')).toHaveCount(0);
  await expect(simon.locator('.sd-tab .sd-badge')).toHaveCount(0);

  expect([...simon.fehler, ...irina.fehler]).toEqual([]);
});

test('Einkauf: Irina setzt etwas auf die Liste, Simon hakt im Laden ab – live, auch ohne Netz', async ({ browser, emulator }) => {
  const { simon, irina } = await haushalt(browser, emulator);
  const eintrag = (seite, titel) => seite.locator('.sd-sitem', { hasText: titel });
  const hinzu = async (seite, text) => { await seite.locator('[data-in="shopNew"]').fill(text); await seite.locator('[data-in="shopNew"]').press('Enter'); };
  await tab(irina, 'Einkauf');
  await tab(simon, 'Einkauf');

  await hinzu(irina, 'Milch – 2');
  await expect(eintrag(simon, 'Milch')).toBeVisible();
  await expect(eintrag(simon, 'Milch')).toContainText('von Irina');
  await expect(eintrag(simon, 'Milch').locator('.sd-qty')).toHaveText('2');

  // Simon steht im Laden ohne Empfang: abhaken und etwas hinzufügen geht trotzdem
  await simon.context().setOffline(true);
  await eintrag(simon, 'Milch').getByRole('button', { name: 'Milch abhaken' }).click();
  await hinzu(simon, 'Brot');
  await expect(eintrag(simon, 'Milch')).toHaveClass(/done/);
  await expect(eintrag(simon, 'Brot')).toBeVisible();
  await expect(eintrag(irina, 'Brot')).toHaveCount(0);
  // Wieder Netz: Irina sieht beides
  await simon.context().setOffline(false);
  await expect(eintrag(irina, 'Milch')).toHaveClass(/done/, { timeout: 20000 });
  await expect(eintrag(irina, 'Brot')).toBeVisible({ timeout: 20000 });

  // Doppelt: Simon will auch Brot eintragen
  await hinzu(simon, 'brot');
  await expect(simon.getByText('„Brot“ steht schon auf der Liste.')).toBeVisible();

  // Irina räumt auf, bei Simon verschwindet Milch; als Vorschlag bleibt sie
  await irina.getByRole('button', { name: 'Erledigte löschen' }).click();
  await expect(eintrag(simon, 'Milch')).toHaveCount(0);
  await expect(simon.locator('.sd-ssug')).toContainText('Milch');

  // Verbindungsfehler im Funkloch sind gewollt, alles andere nicht
  expect([...simon.fehler, ...irina.fehler].filter(f => !/ERR_INTERNET_DISCONNECTED/.test(f))).toEqual([]);
});
