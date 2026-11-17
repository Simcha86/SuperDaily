// Version 13: Bereich Ausgaben (Überblick) und neue Navigation mit vier Bereichen.
import { test, expect, oeffneHandy, tab } from '../hilfen.js';

const eingabe = seite => seite.locator('[data-in="expNew"]');
async function hinzu(seite, text) { await eingabe(seite).fill(text); await eingabe(seite).press('Enter'); }
const gespeichert = seite => seite.evaluate(() => Object.values(JSON.parse(localStorage.getItem('superdaily-v1') || '{}').exp || {}));

test('Ausgabe mit einem Satz: Betrag, Geschäft und Kategorie werden erkannt', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal);
  await tab(seite, 'Ausgaben');
  await expect(seite.getByText(/Noch keine Ausgaben im /)).toBeVisible();
  await hinzu(seite, 'Rewe 23,80');
  await hinzu(seite, '45 € Tanken');
  await hinzu(seite, 'Kino 18');
  await hinzu(seite, 'Obi 95,00');
  await expect(eingabe(seite)).toHaveValue('');
  await expect(eingabe(seite)).toBeFocused();
  const x = Object.fromEntries((await gespeichert(seite)).map(e => [e.title, [e.amount, e.cat]]));
  expect(x).toEqual({ Rewe: [2380, 'essen'], Tanken: [4500, 'auto'], Kino: [1800, 'freizeit'], Obi: [9500, 'garten'] });
  await expect(seite.locator('.sd-ebanner')).toContainText('181,80');
  await expect(seite.locator('.sd-ecats .sd-rate').first()).toContainText('Haus & Garten');
  await expect(seite.locator('.sd-erow').first()).toContainText('Obi');
  // Tagessumme im Tageskopf
  await expect(seite.locator('.sd-eday').first()).toContainText('181,80');
  expect(seite.fehler).toEqual([]);
});

test('Ohne Betrag kommt ein Hinweis, der Text bleibt stehen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal);
  await tab(seite, 'Ausgaben');
  await hinzu(seite, 'Bäcker');
  await expect(seite.getByText('Bitte auch den Betrag angeben')).toBeVisible();
  await expect(eingabe(seite)).toHaveValue('Bäcker');
  expect(await gespeichert(seite)).toEqual([]);
});

test('Monatsüberblick: Summe, Kategorien, voriger Monat, bearbeiten und löschen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Ausgaben');
  const summe = await seite.locator('.sd-ebanner b').textContent();
  await seite.getByRole('button', { name: 'Voriger Monat' }).click();
  await expect(seite.locator('.sd-ebanner b')).not.toHaveText(summe);
  await expect(seite.getByRole('button', { name: 'Nächster Monat' })).toBeEnabled();
  await seite.getByRole('button', { name: 'Nächster Monat' }).click();
  await expect(seite.getByRole('button', { name: 'Nächster Monat' })).toBeDisabled();
  // Bearbeiten: Betrag und Kategorie
  await seite.locator('.sd-erow', { hasText: 'Kino' }).click();
  const blatt = seite.getByRole('dialog', { name: 'Ausgabe bearbeiten' });
  await blatt.locator('[data-in="eAmount"]').fill('26,50');
  await blatt.getByRole('button', { name: 'Sonstiges' }).click();
  await blatt.getByRole('button', { name: 'Speichern' }).click();
  await expect(seite.locator('.sd-erow', { hasText: 'Kino' })).toContainText('26,50');
  expect((await gespeichert(seite)).find(e => e.title === 'Kino')).toMatchObject({ amount: 2650, cat: 'sonst' });
  // Löschen
  await seite.locator('.sd-erow', { hasText: 'Apotheke' }).click();
  await seite.getByRole('button', { name: 'Ausgabe löschen' }).click();
  await expect(seite.locator('.sd-erow', { hasText: 'Apotheke' })).toHaveCount(0);
  expect(seite.fehler).toEqual([]);
});

test('Navigation: Verwaltung führt zu Routinen, Aufgaben, Verlauf und Einstellungen, „Zurück“ führt zurück', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  // Heute: Aufgaben mit „Neu“ und „Alle“, Knopf „Verlauf“
  await expect(seite.locator('.sd-tasks').getByRole('button', { name: 'Aufgabe hinzufügen' })).toBeVisible();
  await seite.locator('.sd-hdr').getByRole('button', { name: 'Verlauf' }).click();
  await expect(seite.locator('.sd-hdr h1')).toHaveText('Verlauf');
  await expect(seite.locator('.sd-tab.on')).toContainText('Heute');
  await seite.getByRole('button', { name: 'Heute' }).first().click();
  await expect(seite.locator('.sd-hdr h1')).toHaveText('Heute');
  await seite.locator('.sd-tasks').getByRole('button', { name: 'Alle' }).click();
  await expect(seite.locator('.sd-hdr h1')).toHaveText('Aufgaben');
  // Seit Version 14 eigener Bereich: unten markiert, kein „Zurück“
  await expect(seite.locator('.sd-tab.on')).toContainText('Aufgaben');
  await expect(seite.locator('.sd-backlink')).toHaveCount(0);
  await tab(seite, 'Heute');
  // Verwaltung
  await tab(seite, 'Verwaltung');
  await expect(seite.locator('.sd-vrow .t')).toHaveText(['Routinen', 'Bereiche', 'Ausgaben-Kategorien', 'Verlauf und Statistik', 'Einstellungen']);
  await seite.locator('.sd-vrow').filter({ hasText: /^Routinen/ }).click();
  await expect(seite.locator('.sd-tab.on')).toContainText('Verwaltung');
  await expect(seite.locator('.sd-backlink')).toHaveText('Verwaltung');
  await seite.getByRole('button', { name: 'Routine hinzufügen' }).click();
  await expect(seite.getByRole('dialog', { name: 'Neue Routine' })).toBeVisible();
  await seite.keyboard.press('Escape');
  await seite.locator('.sd-backlink').click();
  await expect(seite.locator('.sd-hdr h1')).toHaveText('Verwaltung');
  await seite.locator('.sd-vrow').filter({ hasText: /^Bereiche/ }).click();
  await expect(seite.getByRole('dialog', { name: 'Bereiche' })).toBeVisible();
  // Badge „fällig“ seit Version 14 am Bereich „Aufgaben“
  await expect(seite.locator('.sd-tab', { hasText: 'Aufgaben' }).locator('.sd-badge')).toHaveText('3');
  await expect(seite.locator('.sd-tab', { hasText: 'Heute' }).locator('.sd-badge')).toHaveCount(0);
  expect(seite.fehler).toEqual([]);
});

test('Ausgaben hell und dunkel: lesbarer Balken, kein seitliches Verrutschen', async ({ browser, lokal }) => {
  for (const farbschema of ['light', 'dark']) {
    const seite = await oeffneHandy(browser, lokal, { beispieldaten: true, farbschema });
    await tab(seite, 'Ausgaben');
    const [sw, cw] = await seite.evaluate(() => { const m = document.querySelector('.sd-scroll'); return [m.scrollWidth, m.clientWidth]; });
    expect(sw).toBeLessThanOrEqual(cw);
    expect(await seite.locator('.sd-ebanner').evaluate(e => getComputedStyle(e).color)).toBe('rgb(255, 255, 255)');
    expect(await seite.locator('.sd-ebanner').evaluate(e => getComputedStyle(e).backgroundImage)).toContain('124, 58, 237');
    expect(seite.fehler).toEqual([]);
  }
});

test('Wie in SuperFinance: Geschäft-Vorschläge, gemerkte Kategorie, Notiz, Filter nach Kategorie', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Ausgaben');
  // Ohne Geschäft und ohne Kategorie: Hinweis auf die Kategorie (seit Version 16 ist das Geschäft freiwillig)
  await hinzu(seite, '12,50');
  await expect(seite.getByText('Bitte eine Kategorie wählen')).toBeVisible();
  // Vorschläge aus bekannten Geschäften beim Tippen
  await eingabe(seite).fill('');
  await eingabe(seite).pressSequentially('Pi');
  await seite.locator('.sd-esug').getByRole('button', { name: 'Pizzeria Roma' }).click();
  await expect(eingabe(seite)).toHaveValue('Pizzeria Roma ');
  await eingabe(seite).pressSequentially('28,40'); await eingabe(seite).press('Enter');
  // Bekanntes Geschäft bekommt die zuletzt gewählte Kategorie (Restaurant & Café), nicht die Wortregel
  expect((await gespeichert(seite)).filter(e => e.title === 'Pizzeria Roma').map(e => e.cat)).toEqual(['restaurant', 'restaurant']);
  // Kategorie ändern → nächstes Mal wird die neue vorgeschlagen; Notiz speichern
  await seite.locator('.sd-erow', { hasText: 'Kino' }).click();
  const blatt = seite.getByRole('dialog', { name: 'Ausgabe bearbeiten' });
  await blatt.getByRole('button', { name: 'Geschenke' }).click();
  await blatt.getByRole('group', { name: 'Unterkategorie' }).getByRole('button', { name: 'Geburtstag' }).click();
  await blatt.getByLabel('Notiz (optional)').fill('Gutschein für Irina');
  await blatt.getByRole('button', { name: 'Speichern' }).click();
  await hinzu(seite, 'kino 9');
  const kino = (await gespeichert(seite)).filter(e => e.title === 'Kino');
  expect(kino.map(e => e.cat).sort()).toEqual(['geschenke', 'geschenke']);
  expect(kino.find(e => e.amount === 2400).note).toBe('Gutschein für Irina');
  // Filter nach Kategorie
  await seite.locator('.sd-ecat', { hasText: 'Lebensmittel' }).click();
  await expect(seite.locator('.sd-erow')).toHaveCount(2);
  await expect(seite.locator('.sd-ebanner')).toContainText('107,00');
  await seite.getByRole('button', { name: 'Alle zeigen' }).click();
  await expect(seite.locator('.sd-erow')).toHaveCount(9);
  expect(seite.fehler).toEqual([]);
});

test('Version 15: Haupt- und Unterkategorie beim Eintragen, Vorschlag sichtbar, Stift zum Ändern und Löschen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal);
  await tab(seite, 'Ausgaben');
  const wahl = seite.getByRole('group', { name: 'Kategorie für die neue Ausgabe' });
  const haupt = wahl.locator('.sd-ecpick').first(), unter = wahl.getByRole('group', { name: 'Unterkategorie' });
  await expect(haupt.getByRole('button')).toHaveCount(11);
  await expect(haupt.locator('.sd-chip.on')).toHaveCount(0);
  // Beim Tippen erscheint der Vorschlag, mit Unterkategorie
  await eingabe(seite).fill('Rewe 12');
  await expect(haupt.locator('.sd-chip.on')).toHaveText('Lebensmittel');
  await expect(unter.locator('.sd-chip.on')).toHaveText('Supermarkt');
  await expect(wahl).toContainText('Vorschlag');
  // Vorschlag weiter hinten in der Leiste wird sichtbar gerollt
  await eingabe(seite).fill('Aral 50');
  await expect(haupt.locator('.sd-chip.on')).toHaveText('Tanken & Auto');
  expect(await haupt.evaluate(r => { const c = r.querySelector('.sd-chip.on').getBoundingClientRect(), b = r.getBoundingClientRect(); return c.left >= b.left - 1 && c.right <= b.right + 1; })).toBe(true);
  // Andere Hauptkategorie: Unterkategorie ist Pflicht
  await eingabe(seite).fill('Rewe 31,20');
  await haupt.getByRole('button', { name: 'Haushalt' }).click();
  await expect(haupt.locator('.sd-chip.on')).toHaveText('Haushalt');
  await expect(unter.getByRole('button')).toHaveText(['Putz- & Waschmittel', 'Einrichtung', 'Elektronik']);
  await expect(wahl).toContainText('bitte wählen');
  await eingabe(seite).press('Enter');
  await expect(seite.getByRole('status')).toContainText('Bitte noch die Unterkategorie von „Haushalt“ wählen');
  expect(await gespeichert(seite)).toEqual([]);
  await unter.getByRole('button', { name: 'Elektronik' }).click();
  await expect(wahl).toContainText('gewählt');
  await eingabe(seite).press('Enter');
  expect((await gespeichert(seite)).find(e => e.amount === 3120)).toMatchObject({ title: 'Rewe', cat: 'haushalt', sub: 'elektro' });
  await expect(seite.getByRole('status')).toContainText('Gespeichert: Rewe');
  await expect(seite.getByRole('status')).toContainText('Haushalt › Elektronik');
  // Danach wieder automatisch
  await expect(haupt.locator('.sd-chip.on')).toHaveCount(0);
  const [sw, cw] = await seite.locator('.sd-scroll').evaluate(m => [m.scrollWidth, m.clientWidth]);
  expect(sw).toBeLessThanOrEqual(cw);
  // Eintrag zeigt Stift und „Haushalt › Elektronik“; Bearbeiten, dort auch löschen
  const zeile = seite.getByRole('button', { name: /Rewe.*ändern oder löschen/ });
  await expect(zeile).toContainText('Haushalt › Elektronik');
  await expect(zeile.locator('.sd-eedit')).toBeVisible();
  await expect(seite.getByText('Eine Ausgabe antippen, um sie zu ändern oder zu löschen.')).toBeVisible();
  await zeile.click();
  const blatt = seite.getByRole('dialog', { name: 'Ausgabe bearbeiten' });
  await expect(blatt.getByRole('button', { name: 'Elektronik' })).toHaveAttribute('aria-pressed', 'true');
  await blatt.getByRole('button', { name: 'Ausgabe löschen' }).click();
  await expect(seite.locator('.sd-erow')).toHaveCount(0);
  expect(seite.fehler).toEqual([]);
});

test('Version 15: Ausgaben-Kategorien in der Verwaltung pflegen, archivieren und zurückholen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await seite.locator('.sd-tabs').getByRole('button', { name: 'Verwaltung' }).click();
  await seite.locator('.sd-vrow').filter({ hasText: /^Ausgaben-Kategorien/ }).click();
  await expect(seite.locator('.sd-hdr h1')).toHaveText('Ausgaben-Kategorien');
  await expect(seite.locator('.sd-ekcard')).toHaveCount(11);
  // Neue Hauptkategorie bekommt „Allgemein“, dann eigene Unterkategorie
  await seite.getByLabel('Neue Kategorie', { exact: true }).fill('Haustier');
  await seite.getByRole('button', { name: 'Anlegen' }).click();
  const tier = seite.locator('.sd-ekcard').filter({ has: seite.locator('input[value="Haustier"]') });
  await expect(tier.locator('.sd-eksubs input[data-ch="esName"]')).toHaveValue('Allgemein');
  await tier.getByLabel('Neue Unterkategorie für Haustier').fill('Futter');
  await tier.getByRole('button', { name: 'Unterkategorie zu Haustier hinzufügen' }).click();
  await expect(tier.locator('input[data-ch="esName"]')).toHaveCount(2);
  // Umbenennen
  const tanken = seite.getByLabel('Name der Unterkategorie Tanken');
  await tanken.fill('Sprit'); await tanken.blur();
  await expect(seite.getByLabel('Name der Unterkategorie Sprit')).toBeVisible();
  // Benutzte Unterkategorie wird archiviert, unbenutzte gelöscht
  await seite.getByRole('button', { name: 'Unterkategorie Sprit archivieren' }).click();
  await expect(seite.locator('.sd-ekarch')).toContainText('Tanken & Auto › Sprit');
  await seite.getByRole('button', { name: 'Unterkategorie Parken & Maut löschen' }).click();
  await expect(seite.getByLabel('Name der Unterkategorie Parken & Maut')).toHaveCount(0);
  // Beim Eintragen: neue Kategorie wählbar, archivierte Unterkategorie nicht; alte Ausgabe behält sie
  await tab(seite, 'Ausgaben');
  const wahl = seite.getByRole('group', { name: 'Kategorie für die neue Ausgabe' });
  await wahl.locator('.sd-ecpick').first().getByRole('button', { name: 'Tanken & Auto' }).click();
  await expect(wahl.getByRole('group', { name: 'Unterkategorie' }).getByRole('button')).toHaveText(['Werkstatt & TÜV', 'Waschen & Pflege']);
  await expect(wahl.locator('.sd-ecpick').first().getByRole('button', { name: 'Haustier' })).toBeVisible();
  await expect(seite.locator('.sd-erow', { hasText: 'Aral' })).toContainText('Tanken & Auto › Sprit');
  // Zurückholen
  await seite.locator('.sd-tabs').getByRole('button', { name: 'Verwaltung' }).click();
  await seite.locator('.sd-vrow').filter({ hasText: /^Ausgaben-Kategorien/ }).click();
  await seite.locator('.sd-ekarch', { hasText: 'Sprit' }).getByRole('button', { name: 'Zurückholen' }).click();
  await expect(seite.locator('.sd-ekarch')).toHaveCount(0);
  await expect(seite.getByLabel('Name der Unterkategorie Sprit')).toBeVisible();
  // Gespeichert
  const ek = await seite.evaluate(() => JSON.parse(localStorage.getItem('superdaily-v1')).ecats);
  expect(ek.find(c => c.name === 'Haustier').subs.map(u => u.name)).toEqual(['Allgemein', 'Futter']);
  expect(seite.fehler).toEqual([]);
});

test('Version 16: Geschäft ist freiwillig – nur Betrag und Kategorie genügen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal);
  await tab(seite, 'Ausgaben');
  const wahl = seite.getByRole('group', { name: 'Kategorie für die neue Ausgabe' });
  await eingabe(seite).fill('4,50');
  await wahl.locator('.sd-ecpick').first().getByRole('button', { name: 'Lebensmittel' }).click();
  await wahl.getByRole('group', { name: 'Unterkategorie' }).getByRole('button', { name: 'Bäckerei' }).click();
  await eingabe(seite).press('Enter');
  expect((await gespeichert(seite))[0]).toMatchObject({ title: '', amount: 450, cat: 'essen', sub: 'baecker' });
  await expect(seite.getByRole('status')).toContainText('Gespeichert: 4,50');
  // Liste zeigt die Unterkategorie als Namen
  const zeile = seite.locator('.sd-erow').first();
  await expect(zeile.locator('.t')).toHaveText('Bäckerei');
  await expect(zeile).toContainText('Lebensmittel › Bäckerei');
  // Bearbeiten ohne Geschäft speichert, mit Geschäft auch
  await zeile.click();
  const blatt = seite.getByRole('dialog', { name: 'Ausgabe bearbeiten' });
  await expect(blatt.getByLabel('Geschäft (optional)')).toHaveValue('');
  await blatt.locator('[data-in="eAmount"]').fill('5,10');
  await blatt.getByRole('button', { name: 'Speichern' }).click();
  expect((await gespeichert(seite))[0]).toMatchObject({ title: '', amount: 510 });
  // Leere Geschäfte erscheinen nicht als Vorschlag
  await eingabe(seite).pressSequentially('B');
  await expect(seite.locator('.sd-esug .sd-chip')).toHaveCount(0);
  expect(seite.fehler).toEqual([]);
});

test('Version 17: steuerrelevant per Schalter und „#steuer“, Kennzeichen, Filter mit Monats- und Jahressumme', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await tab(seite, 'Ausgaben');
  const schalter = seite.locator('.sd-etax').getByRole('button', { name: 'Steuerrelevant' });
  await expect(schalter).toHaveAttribute('aria-pressed', 'false');
  // Filter erscheint erst, wenn es steuerrelevante Ausgaben gibt
  await expect(seite.getByRole('button', { name: 'Nur steuerrelevant' })).toHaveCount(0);
  // 1. Per Schalter
  await eingabe(seite).fill('Apotheke 12,40');
  await schalter.click();
  await expect(schalter).toHaveAttribute('aria-pressed', 'true');
  await eingabe(seite).press('Enter');
  await expect(seite.getByRole('status').first()).toContainText('steuerrelevant');
  await expect(seite.locator('.sd-etax').getByRole('button', { name: 'Steuerrelevant' })).toHaveAttribute('aria-pressed', 'false');
  // 2. Per „#steuer“ im Satz – Wort gehört nicht zum Geschäft, Schalter zeigt es schon beim Tippen
  await eingabe(seite).fill('Optiker 89 #steuer');
  await expect(seite.locator('.sd-etax').getByRole('button', { name: 'Steuerrelevant' })).toHaveAttribute('aria-pressed', 'true');
  await eingabe(seite).press('Enter');
  const alle = await gespeichert(seite);
  expect(alle.find(e => e.amount === 1240)).toMatchObject({ title: 'Apotheke', tax: true });
  expect(alle.find(e => e.amount === 8900)).toMatchObject({ title: 'Optiker', tax: true, cat: 'gesundheit', sub: 'brille' });
  expect(alle.find(e => e.title === 'Rewe').tax).toBeUndefined();
  // Kennzeichen in der Liste
  await expect(seite.locator('.sd-erow', { hasText: 'Optiker' })).toContainText('steuerrelevant');
  await expect(seite.locator('.sd-erow', { hasText: 'Rewe' })).not.toContainText('steuerrelevant');
  // Filter mit Summen
  await seite.getByRole('button', { name: 'Nur steuerrelevant' }).click();
  await expect(seite.locator('.sd-erow')).toHaveCount(2);
  await expect(seite.locator('.sd-ebanner')).toContainText('Steuerrelevant');
  await expect(seite.locator('.sd-ebanner')).toContainText('101,40');
  await expect(seite.locator('.sd-etaxsum')).toContainText('101,40 € im');
  await expect(seite.locator('.sd-etaxsum')).toContainText('im Jahr');
  // Kategorien und Kopfzeile rechnen nur mit steuerrelevanten Ausgaben
  await expect(seite.locator('.sd-ecat')).toHaveCount(1);
  await expect(seite.locator('.sd-ecat').first()).toContainText('101,40 € · 100 %');
  await expect(seite.locator('.sd-hdr .sd-sub')).not.toContainText('als im');
  await seite.getByRole('button', { name: 'Nur steuerrelevant' }).click();
  await expect(seite.locator('.sd-erow')).toHaveCount(9);
  // Im Bearbeiten ausschalten
  await seite.locator('.sd-erow', { hasText: 'Apotheke' }).filter({ hasText: '12,40' }).click();
  const blatt = seite.getByRole('dialog', { name: 'Ausgabe bearbeiten' });
  await blatt.getByRole('button', { name: 'Steuerrelevant' }).click();
  await blatt.getByRole('button', { name: 'Speichern' }).click();
  expect((await gespeichert(seite)).find(e => e.amount === 1240).tax).toBeUndefined();
  expect(seite.fehler).toEqual([]);
});
