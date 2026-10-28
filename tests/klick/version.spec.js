// Versionsanzeige und Hinweis nach Updates (Version 5).
import { test, expect, oeffneHandy, tab } from '../hilfen.js';

test('Neuinstallation: kein „Neu“-Hinweis', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true });
  await expect(seite.getByRole('heading', { name: 'Heute' })).toBeVisible();
  await expect(seite.getByText(/Neu in Version/)).toHaveCount(0);
});

test('Nach einem Update: Hinweis erscheint einmal und lässt sich schließen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true, schonGesehen: '4' });
  await expect(seite.getByText(/Neu in Version \d+/)).toBeVisible();
  await seite.getByRole('button', { name: 'Hinweis schließen' }).click();
  await expect(seite.getByText(/Neu in Version/)).toHaveCount(0);
  await seite.reload();
  await expect(seite.getByRole('heading', { name: 'Heute' })).toBeVisible();
  await expect(seite.getByText(/Neu in Version/)).toHaveCount(0);
});

test('„Mehr“ im Hinweis öffnet „Über SuperDaily“ mit aktueller und früheren Versionen', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true, schonGesehen: '3' });
  await expect(seite.locator('.sd-new')).toContainText('Bereiche');
  await seite.locator('.sd-new').getByRole('button', { name: 'Mehr' }).click();
  const ueber = seite.locator('#about');
  await expect(ueber.getByRole('heading', { name: 'Über SuperDaily' })).toBeVisible();
  await expect(ueber).toContainText(/Version \d+/);
  await ueber.getByText('Frühere Versionen').click();
  await expect(ueber).toContainText('Version 1');
  expect(seite.fehler).toEqual([]);
});
