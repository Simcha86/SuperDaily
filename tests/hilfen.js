// Gemeinsame Hilfen für die Browser-Tests.
// Ein kleiner Server liefert die App aus dem Repository aus – im lokalen Modus (ohne Firebase)
// oder verbunden mit Auth- und Firestore-Emulator. Die echte firebase-config.js wird nie verwendet.
// Externe Dateien (Firebase-SDK, Symbole, Schrift) kommen aus node_modules, damit die Tests
// auch ohne Internet laufen.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, expect } from '@playwright/test';

const TESTS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TESTS, '..');
const NM = path.join(TESTS, 'node_modules');
export const BEISPIELDATEN = fs.readFileSync(path.join(TESTS, 'beispieldaten.js'), 'utf8');

const TYPEN = { '.js': 'application/javascript', '.mjs': 'application/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };

// App im Emulator-Modus: Verbindung zu den Emulatoren direkt nach dem Start einhängen.
// Ändert sich eine dieser Zeilen in app.js, schlägt der Test laut fehl, statt still gegen etwas Falsches zu laufen.
function appFuerEmulator(src) {
  const auth = '    const auth = A.getAuth(app);';
  const fb = '    fb = { A, F, auth, db };';
  if (!src.includes(auth) || !src.includes(fb)) throw new Error('app.js: Ankerzeilen für den Emulator nicht gefunden – tests/hilfen.js anpassen');
  return src.replace(auth, auth + "\n    A.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });")
    .replace(fb, "    F.connectFirestoreEmulator(db, '127.0.0.1', 8085);\n" + fb);
}

// Die Sicherheitsregeln aus ../firestore.rules in den Firestore-Emulator laden. Ohne diesen Schritt
// liefe der Emulator ohne Regeln und würde alles erlauben – die Rechte-Tests wären dann wertlos.
async function regelnInEmulatorLaden() {
  const rules = fs.readFileSync(path.join(ROOT, 'firestore.rules'), 'utf8');
  const antwort = await fetch('http://127.0.0.1:8085/emulator/v1/projects/demo-superdaily:securityRules', {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content: rules }] } })
  });
  if (!antwort.ok) throw new Error('Regeln konnten nicht in den Emulator geladen werden: ' + antwort.status + ' ' + await antwort.text());
}

export async function starteServer(modus) {
  if (modus === 'emulator') await regelnInEmulatorLaden();
  const konfig = modus === 'emulator'
    ? "export const firebaseConfig = { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-superdaily', appId: '1:1:web:1' };"
    : 'export const firebaseConfig = null;';
  const zustand = { stoerung: false };
  const server = http.createServer((q, r) => {
    // Simulierte Störung des Servers (wie GitHub mit „We're having a really bad day“)
    if (zustand.stoerung) { r.writeHead(503, { 'content-type': TYPEN['.html'] }); return r.end('<h1>Störung beim Server</h1>'); }
    const url = decodeURIComponent(q.url.split('?')[0]);
    if (url === '/firebase-config.js') { r.writeHead(200, { 'content-type': TYPEN['.js'] }); return r.end(konfig); }
    let datei = path.join(ROOT, url.endsWith('/') ? url + 'index.html' : url);
    if (!datei.startsWith(ROOT) || datei.startsWith(TESTS) || !fs.existsSync(datei)) { r.writeHead(404); return r.end(); }
    let inhalt = fs.readFileSync(datei);
    if (url === '/app.js' && modus === 'emulator') inhalt = appFuerEmulator(inhalt.toString());
    r.writeHead(200, { 'content-type': TYPEN[path.extname(datei)] || 'application/octet-stream' });
    r.end(inhalt);
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${server.address().port}/`, zustand, schliessen: () => server.close() })));
}

async function externeDateienLokal(ctx) {
  await ctx.route(/gstatic\.com\/firebasejs\/10\.12\.2\/(.+)$/, r => r.fulfill({ path: path.join(NM, 'firebase-app-sdk', r.request().url().split('/').pop()), contentType: TYPEN['.js'] }));
  await ctx.route(/unpkg\.com\/@phosphor-icons\/web@2\.1\.1(.*)$/, r => {
    let rest = new URL(r.request().url()).pathname.replace('/@phosphor-icons/web@2.1.1', '');
    if (!rest || rest === '/') rest = '/src/index.js';
    const datei = path.join(NM, '@phosphor-icons/web', rest);
    return fs.existsSync(datei) ? r.fulfill({ path: datei, contentType: TYPEN[path.extname(datei)] }) : r.fulfill({ status: 404 });
  });
  await ctx.route(/fonts\.googleapis\.com.*Plus\+Jakarta/, r => r.fulfill({ contentType: 'text/css', body: [400, 500, 600, 700, 800].map(w => `@font-face{font-family:"Plus Jakarta Sans";font-weight:${w};src:url(https://fonts.gstatic.com/lokal/${w}.woff2) format("woff2")}`).join('') }));
  await ctx.route(/fonts\.gstatic\.com\/lokal\/(\d+)/, r => r.fulfill({ path: path.join(NM, '@fontsource/plus-jakarta-sans/files', `plus-jakarta-sans-latin-${r.request().url().match(/lokal\/(\d+)/)[1]}-normal.woff2`), contentType: TYPEN['.woff2'] }));
  await ctx.route(/fonts\.googleapis\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
}

// Öffnet ein „Handy“ (eigener Browser-Kontext = eigenes Gerät mit eigenem Speicher).
// beispieldaten: Beispieldaten in den lokalen Speicher legen (nur lokaler Modus).
// schonGesehen: zuletzt gesehene App-Version vorgeben (für den Hinweis nach Updates).
// serviceWorker: den Service Worker der App zulassen (sonst blockiert, damit Tests immer frische Dateien laden).
export async function oeffneHandy(browser, server, { beispieldaten = false, schonGesehen = null, farbschema = 'light', serviceWorker = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: farbschema, reducedMotion: 'reduce', serviceWorkers: serviceWorker ? 'allow' : 'block' });
  await externeDateienLokal(ctx);
  if (beispieldaten) await ctx.addInitScript(BEISPIELDATEN + ";try{if(!localStorage.getItem('superdaily-v1'))localStorage.setItem('superdaily-v1',JSON.stringify(globalThis.SD_SAMPLE))}catch{}");
  if (schonGesehen) await ctx.addInitScript(`try{if(!sessionStorage.getItem('gesetzt')){localStorage.setItem('superdaily-seen-version','${schonGesehen}');sessionStorage.setItem('gesetzt','1')}}catch{}`);
  const seite = await ctx.newPage();
  seite.fehler = [];
  seite.on('pageerror', e => seite.fehler.push(e.message));
  seite.on('console', m => { if (m.type() === 'error' && !/PERMISSION_DENIED|permission/i.test(m.text())) seite.fehler.push(m.text()); });
  seite.on('dialog', d => d.accept());
  await seite.goto(server.url);
  return seite;
}

export const tab = (seite, name) => seite.locator('.sd-tabs').getByRole('button', { name }).click();

// Test mit lokalem Server (ohne Firebase) und Prüfung auf Konsolenfehler am Ende.
export const test = base.extend({
  lokal: [async ({}, use) => { const s = await starteServer('lokal'); await use(s); s.schliessen(); }, { scope: 'worker' }],
  emulator: [async ({}, use) => { const s = await starteServer('emulator'); await use(s); s.schliessen(); }, { scope: 'worker' }]
});
export { expect };
