// Service Worker (Version 8): Bei einer Störung des Servers öffnet sich die App mit der gespeicherten Kopie,
// statt die Fehlerseite des Servers zu zeigen. Fehlerseiten werden nie gespeichert.
import { test, expect, oeffneHandy } from '../hilfen.js';

test('Server-Störung: App öffnet sich mit der gespeicherten Version, Fehlerseite wird nicht gespeichert', async ({ browser, lokal }) => {
  const seite = await oeffneHandy(browser, lokal, { beispieldaten: true, serviceWorker: true });
  await expect(seite.locator('.sd-tabs')).toBeVisible();
  // Warten, bis der Service Worker installiert ist und die Seite steuert
  await seite.evaluate(() => navigator.serviceWorker.ready);
  await seite.reload();
  await expect.poll(() => seite.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  try {
    lokal.zustand.stoerung = true;
    await seite.reload();
    await expect(seite.locator('.sd-tabs')).toBeVisible();
    await expect(seite.getByText('Störung beim Server')).toHaveCount(0);
    await seite.reload();
    await expect(seite.locator('.sd-tabs')).toBeVisible();
  } finally {
    lokal.zustand.stoerung = false;
  }
  const gespeichert = await seite.evaluate(async () => (await (await caches.match('./')).text()));
  expect(gespeichert).not.toContain('Störung beim Server');
  expect(gespeichert).toContain('app.js');
});
