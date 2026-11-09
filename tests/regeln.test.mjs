// Firebase-Regel-Tests für SuperDaily. Starten: npm run test:regeln
// Prüft für jede Regel den erlaubten UND den verbotenen Fall: Simon (a), Irina (b), Fremder, nicht angemeldet.
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, deleteField } from 'firebase/firestore';
import fs from 'fs';
const env = await initializeTestEnvironment({ projectId: 'demo-superdaily', firestore: { rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 } });
let pass = 0, failN = 0;
async function t(name, p) { try { await p; pass++; console.log('ok   ', name); } catch (e) { failN++; console.log('FEHLER', name, '-', e.message.split('\n')[0]); } }
const simon = env.authenticatedContext('uidSimon').firestore();
const irina = env.authenticatedContext('uidIrina').firestore();
const fremd = env.authenticatedContext('uidFremd').firestore();
const anon = env.unauthenticatedContext().firestore();
const H = 'K7Q2XM';
// Haushalt anlegen
await t('Simon legt Haushalt an', assertSucceeds(setDoc(doc(simon, 'households', H), { members: ['uidSimon'], roles: { uidSimon: 'a' }, names: { a: 'Simon', b: 'Irina' } })));
await t('Fremder kann keinen Haushalt mit anderen Mitgliedern anlegen', assertFails(setDoc(doc(fremd, 'households', 'XXXXXX'), { members: ['uidFremd', 'uidSimon'], roles: { uidFremd: 'a' }, names: {} })));
await t('Anlegen mit ungültiger Rolle scheitert', assertFails(setDoc(doc(fremd, 'households', 'YYYYYY'), { members: ['uidFremd'], roles: { uidFremd: 'admin' }, names: {} })));
await t('Simon setzt eigenes Profil', assertSucceeds(setDoc(doc(simon, 'users', 'uidSimon'), { hh: H, person: 'a' })));
await t('Irina liest Simons Profil nicht', assertFails(getDoc(doc(irina, 'users', 'uidSimon'))));
// Beitritt
await t('Irina kann vor Beitritt nicht lesen', assertFails(getDoc(doc(irina, 'households', H))));
await t('Irina kann nicht als Simon (a) beitreten', assertFails(updateDoc(doc(irina, 'households', H), { members: arrayUnion('uidIrina'), 'roles.uidIrina': 'a' })));
await t('Irina kann beim Beitritt keine Namen ändern', assertFails(updateDoc(doc(irina, 'households', H), { members: arrayUnion('uidIrina'), 'roles.uidIrina': 'b', names: { a: 'X', b: 'Y' } })));
await t('Irina tritt als b bei', assertSucceeds(updateDoc(doc(irina, 'households', H), { members: arrayUnion('uidIrina'), 'roles.uidIrina': 'b' })));
await t('Fremder kann nicht mehr beitreten (voll)', assertFails(updateDoc(doc(fremd, 'households', H), { members: arrayUnion('uidFremd'), 'roles.uidFremd': 'a' })));
await t('Fremder kann Haushalt nicht lesen', assertFails(getDoc(doc(fremd, 'households', H))));
await t('Ohne Anmeldung nichts lesbar', assertFails(getDoc(doc(anon, 'households', H))));
await t('Irina liest Haushalt', assertSucceeds(getDoc(doc(irina, 'households', H))));
await t('Irina ändert Namen', assertSucceeds(updateDoc(doc(irina, 'households', H), { names: { a: 'Simon', b: 'Irina M.' } })));
await t('Irina ändert Bereiche', assertSucceeds(updateDoc(doc(irina, 'households', H), { cats: [{ id: 'sport', name: 'Sport', icon: 'barbell' }, { id: 'x1', name: 'Beruf', icon: 'tag' }] })));
await t('Fremder kann Bereiche nicht ändern', assertFails(updateDoc(doc(fremd, 'households', H), { cats: [] })));
await t('Bereiche ändern schmuggelt keine Rolle mit', assertFails(updateDoc(doc(irina, 'households', H), { cats: [], 'roles.uidIrina': 'a' })));
await t('Simon speichert Routine mit Versionen und Bereich', assertSucceeds(setDoc(doc(simon, 'households', H, 'routines', 'v1'), { id: 'v1', title: 'Lesen', who: 'a', cat: 'x1', rep: { type: 'off' }, hist: [{ until: '2026-10-24', rep: { type: 'daily' }, who: 'a' }] })));
await t('Irina kann ihre Rolle nicht tauschen', assertFails(updateDoc(doc(irina, 'households', H), { 'roles.uidIrina': 'a' })));
await t('Simon kann Irina nicht entfernen', assertFails(updateDoc(doc(simon, 'households', H), { members: ['uidSimon'] })));
// Routinen (seit Version 11): beide dürfen alles, auch für die andere Person; „from“ ist nicht fälschbar
const R = (db, id) => doc(db, 'households', H, 'routines', id);
await t('Simon legt eigene Routine an', assertSucceeds(setDoc(R(simon, 'sport'), { id: 'sport', title: 'Sport', who: 'a', from: 'a', slot: 'Morgen' })));
await t('Simon legt gemeinsame Routine an', assertSucceeds(setDoc(R(simon, 'wasser'), { id: 'wasser', title: 'Wasser', who: 's', from: 'a', slot: 'Morgen' })));
await t('Simon legt "beide einzeln" an', assertSucceeds(setDoc(R(simon, 'zahn'), { id: 'zahn', title: 'Zahnseide', who: 'ab', slot: 'Abend' })));
await t('Simon gibt Irina eine Routine vor', assertSucceeds(setDoc(R(simon, 'medi'), { id: 'medi', title: 'Meditation', who: 'b', from: 'a', slot: 'Abend' })));
await t('Simon kann „vorgegeben von Irina“ nicht fälschen', assertFails(setDoc(R(simon, 'fake'), { id: 'fake', title: 'Fake', who: 'b', from: 'b', slot: 'Abend' })));
await t('Routine für unbekannte Person abgelehnt', assertFails(setDoc(R(simon, 'fake'), { id: 'fake', title: 'Fake', who: 'x', from: 'a', slot: 'Abend' })));
await t('Irina legt eigene Routine an', assertSucceeds(setDoc(R(irina, 'lesen'), { id: 'lesen', title: 'Lesen', who: 'b', from: 'b', slot: 'Abend' })));
await t('Irina sieht Simons Routine', assertSucceeds(getDoc(R(irina, 'sport'))));
await t('Irina ändert Simons Routine', assertSucceeds(setDoc(R(irina, 'sport'), { id: 'sport', title: 'Sport!', who: 'a', from: 'a', slot: 'Morgen' })));
await t('Irina archiviert die vorgegebene Routine', assertSucceeds(setDoc(R(irina, 'medi'), { id: 'medi', title: 'Meditation', who: 'b', from: 'a', slot: 'Abend', rep: { type: 'off' } })));
await t('Irina kann „vorgegeben von“ nicht ändern', assertFails(setDoc(R(irina, 'medi'), { id: 'medi', title: 'Meditation', who: 'b', from: 'b', slot: 'Abend' })));
await t('Irina kann „vorgegeben von“ nicht entfernen', assertFails(setDoc(R(irina, 'medi'), { id: 'medi', title: 'Meditation', who: 'b', slot: 'Abend' })));
await t('Ältere Routine ohne „from“ bleibt bearbeitbar', assertSucceeds(setDoc(R(irina, 'zahn'), { id: 'zahn', title: 'Zahnseide!', who: 'ab', slot: 'Abend' })));
await t('„from“ kann nicht nachträglich gesetzt werden', assertFails(setDoc(R(irina, 'zahn'), { id: 'zahn', title: 'Zahnseide', who: 'ab', from: 'a', slot: 'Abend' })));
await t('Irina ändert gemeinsame Routine', assertSucceeds(setDoc(R(irina, 'wasser'), { id: 'wasser', title: 'Glas Wasser', who: 's', from: 'a', slot: 'Morgen' })));
await t('Irina löscht Simons Routine', assertSucceeds(deleteDoc(R(irina, 'sport'))));
await t('Fremder sieht keine Routinen', assertFails(getDoc(R(fremd, 'wasser'))));
await t('Fremder legt keine Routine an', assertFails(setDoc(R(fremd, 'x1'), { id: 'x1', title: 'X', who: 'a', slot: 'Morgen' })));
await t('Fremder löscht keine Routine', assertFails(deleteDoc(R(fremd, 'wasser'))));
// Haken
const D = (db, id) => doc(db, 'households', H, 'days', id);
await t('Simon hakt eigene ab', assertSucceeds(setDoc(D(simon, 'a_2026-10-25'), { zahn: true }, { merge: true })));
await t('Simon hakt gemeinsame ab', assertSucceeds(setDoc(D(simon, 's_2026-10-25'), { wasser: true }, { merge: true })));
await t('Simon hakt für Irina ab', assertSucceeds(setDoc(D(simon, 'b_2026-10-25'), { zahn: true }, { merge: true })));
await t('Irina hakt eigene ab', assertSucceeds(setDoc(D(irina, 'b_2026-10-25'), { medi: true }, { merge: true })));
await t('Irina entfernt gemeinsamen Haken', assertSucceeds(setDoc(D(irina, 's_2026-10-25'), { wasser: deleteField() }, { merge: true })));
await t('Irina entfernt einen Haken bei Simon', assertSucceeds(setDoc(D(irina, 'a_2026-10-25'), { zahn: deleteField() }, { merge: true })));
await t('Irina löscht Simons Tag', assertSucceeds(deleteDoc(D(irina, 'a_2026-10-25'))));
await t('Irina sieht Simons Haken', assertSucceeds(getDoc(D(irina, 'a_2026-10-25'))));
await t('Kein Schreiben in Dokumente mit falschem Namen', assertFails(setDoc(D(simon, 'x_a_2026-10-25'), { zahn: true })));
await t('Kein Schreiben in Dokumente ohne Datum', assertFails(setDoc(D(simon, 'a_morgen'), { zahn: true })));
await t('Fremder sieht keine Haken', assertFails(getDoc(D(fremd, 'a_2026-10-25'))));
await t('Fremder hakt nicht ab', assertFails(setDoc(D(fremd, 's_2026-10-25'), { wasser: true }, { merge: true })));

// Aufgaben: beide dürfen alles, Fremde nichts
const TK = (db, id) => doc(db, 'households', H, 'tasks', id);
const aufgabe = { id: 't1', title: 'Paket zur Post', note: '', from: 'b', to: 'a', due: '2026-10-30', done: false, doneAt: null, doneBy: null, createdAt: 1 };
await t('Irina gibt Simon eine Aufgabe', assertSucceeds(setDoc(TK(irina, 't1'), aufgabe)));
await t('Simon sieht die Aufgabe', assertSucceeds(getDoc(TK(simon, 't1'))));
await t('Simon hakt die Aufgabe ab', assertSucceeds(setDoc(TK(simon, 't1'), { ...aufgabe, done: true, doneAt: '2026-10-29', doneBy: 'a' })));
await t('Simon ändert Irinas Aufgabe', assertSucceeds(setDoc(TK(simon, 't1'), { ...aufgabe, title: 'Zwei Pakete zur Post' })));
await t('Gemeinsame Aufgabe', assertSucceeds(setDoc(TK(simon, 't2'), { ...aufgabe, id: 't2', from: 'a', to: 's' })));
await t('Aufgabe ohne Titel abgelehnt', assertFails(setDoc(TK(simon, 't3'), { ...aufgabe, id: 't3', title: '' })));
await t('Aufgabe an unbekannte Person abgelehnt', assertFails(setDoc(TK(simon, 't3'), { ...aufgabe, id: 't3', to: 'x' })));
await t('Fremder sieht keine Aufgaben', assertFails(getDoc(TK(fremd, 't1'))));
await t('Fremder legt keine Aufgabe an', assertFails(setDoc(TK(fremd, 't9'), { ...aufgabe, id: 't9' })));
await t('Fremder löscht keine Aufgabe', assertFails(deleteDoc(TK(fremd, 't1'))));
await t('Irina löscht Simons Aufgabe', assertSucceeds(deleteDoc(TK(irina, 't2'))));
// Einkauf (Version 10): beide dürfen alles, Fremde nichts, Felder werden geprüft
const EK = (db, id) => doc(db, 'households', H, 'shop', id);
const milch = { id: 'e1', title: 'Milch', qty: '2', aisle: 'kuehl', open: true, done: false, count: 0, by: 'b', addedAt: 1, doneAt: null };
await t('Irina setzt Milch auf die Einkaufsliste', assertSucceeds(setDoc(EK(irina, 'e1'), milch)));
await t('Simon sieht die Einkaufsliste', assertSucceeds(getDoc(EK(simon, 'e1'))));
await t('Simon hakt Milch im Laden ab', assertSucceeds(setDoc(EK(simon, 'e1'), { ...milch, done: true, count: 1, doneAt: 2 })));
await t('Simon ändert Menge und Bereich', assertSucceeds(setDoc(EK(simon, 'e1'), { ...milch, qty: '3 Liter', aisle: 'getraenke' })));
await t('Eintrag ohne Titel abgelehnt', assertFails(setDoc(EK(simon, 'e2'), { ...milch, id: 'e2', title: '' })));
await t('Eintrag mit zu langer Menge abgelehnt', assertFails(setDoc(EK(simon, 'e2'), { ...milch, id: 'e2', qty: 'x'.repeat(31) })));
await t('Eintrag von unbekannter Person abgelehnt', assertFails(setDoc(EK(simon, 'e2'), { ...milch, id: 'e2', by: 'x' })));
await t('Eintrag mit negativem Zähler abgelehnt', assertFails(setDoc(EK(simon, 'e2'), { ...milch, id: 'e2', count: -1 })));
await t('Eintrag ohne Feld „open“ abgelehnt', assertFails(setDoc(EK(simon, 'e2'), { id: 'e2', title: 'Brot', qty: '', aisle: 'brot', done: false, count: 0, by: 'a' })));
await t('Fremder sieht die Einkaufsliste nicht', assertFails(getDoc(EK(fremd, 'e1'))));
await t('Fremder setzt nichts auf die Liste', assertFails(setDoc(EK(fremd, 'e9'), { ...milch, id: 'e9' })));
await t('Fremder löscht nichts von der Liste', assertFails(deleteDoc(EK(fremd, 'e1'))));
await t('Ohne Anmeldung keine Einkaufsliste', assertFails(getDoc(EK(anon, 'e1'))));
await t('Simon löscht Milch ganz', assertSucceeds(deleteDoc(EK(simon, 'e1'))));
console.log(`\n${pass} bestanden, ${failN} fehlgeschlagen`);
await env.cleanup(); process.exit(failN ? 1 : 0);
