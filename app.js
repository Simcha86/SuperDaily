import { firebaseConfig } from './firebase-config.js';

// ---------- Datum ----------
const SLOTS = ['Morgen', 'Tagsüber', 'Abend'];
const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WD_ORDER = [1, 2, 3, 4, 5, 6, 0];
const MIN = -365;
const pad = n => String(n).padStart(2, '0');
const dateAt = off => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + off); return d; };
const keyOfDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dk = off => keyOfDate(dateAt(off));
const offOf = dt => Math.round((new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 12) - dateAt(0)) / 864e5);
const offOfKey = k => offOf(new Date(k + 'T12:00'));
const mondayOf = o => o - ((dateAt(o).getDay() + 6) % 7);
const isoWeek = dt => { const d = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate())); const n = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - n); const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return Math.ceil(((d - y) / 864e5 + 1) / 7); };
const fmtS = o => dateAt(o).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
const fmtLong = o => dateAt(o).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const clamp = o => Math.max(MIN, Math.min(0, o));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rid = () => Math.random().toString(36).slice(2, 10);

// ---------- Version ----------
// Bei jeder Veröffentlichung hier und in CHANGELOG.md ergänzen (neueste zuerst) und CACHE in sw.js erhöhen.
const CHANGES = [
  { v: 9, date: '2026-10-31', items: ['Heute: Umschalter Simon | Irina | Duo – Duo zeigt euch beide nebeneinander, als Liste oder Kacheln', 'Gemeinsame Routinen tragen die Avatare von euch beiden', 'Besser lesbar: dunklerer Nebentext und größere Tasten'] },
  { v: 8, date: '2026-10-30', items: ['Bei einer Störung des Servers öffnet sich die App weiter mit der gespeicherten Version statt einer Fehlerseite'] },
  { v: 7, date: '2026-10-29', items: ['Neu: Aufgaben – vergebt euch gegenseitig oder gemeinsam Aufgaben mit Datum, eigener Bereich in Senfgold', 'Fällige Aufgaben ganz oben auf „Heute“, im Kalender und in der Statistik', 'Routinen dürft ihr jetzt auch für die andere Person abhaken', 'Das Raster ist jetzt eine Ansicht im Kalender'] },
  { v: 6, date: '2026-10-29', items: ['Beitreten mit Code: die freie Person wird automatisch gewählt', 'Besser mit Vorleseprogramm (VoiceOver, TalkBack): Symbole werden nicht mehr mitgelesen'] },
  { v: 5, date: '2026-10-25', items: ['Versionsnummer und „Neu in dieser Version“ unter Mehr', 'Einmaliger Hinweis nach einem Update'] },
  { v: 4, date: '2026-10-25', items: ['Bereiche selbst anlegen, umbenennen, mit Symbol versehen oder entfernen (Routinen → Bereiche)', 'Statistik „Nach Bereich“', 'Änderungen an Routinen gelten ab heute, vergangene Tage behalten ihre Wertung', 'Archivieren statt Löschen, mit Wiederherstellen'] },
  { v: 3, date: '2026-10-25', items: ['Tab „Statistik“: Simon und Irina im Vergleich', 'Anmeldung und Sync zwischen beiden Handys', 'Jede Person hakt nur eigene und gemeinsame Routinen ab, sieht aber alles', 'Google Analytics'] },
  { v: 2, date: '2026-10-25', items: ['Design „Minze“, hell und dunkel', 'Neue Schrift und neues App-Icon', 'Vorlagen für den schnellen Start'] },
  { v: 1, date: '2026-10-25', items: ['Fortschrittskarte, Farbverläufe und Animationen', 'Konfetti bei 100 %', 'App-Icon repariert'] }];
const APP_VERSION = CHANGES[0].v;
const fmtDate = k => new Date(k + 'T12:00').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
// Gesehene Version merken: nach einem Update einmalig „Neu“ zeigen, bei Erstinstallation nicht.
const SEEN = 'superdaily-seen-version';
let seenVersion = APP_VERSION;
try { const v = +localStorage.getItem(SEEN); seenVersion = v || APP_VERSION; if (!v) localStorage.setItem(SEEN, APP_VERSION); } catch {}
const markSeen = () => { seenVersion = APP_VERSION; try { localStorage.setItem(SEEN, APP_VERSION); } catch {} };

// ---------- Daten ----------
const data = { names: { a: 'Simon', b: 'Irina' }, routines: {}, done: {}, cats: null, tasks: {} };
const ui = {
  screen: 'loading', tab: 'heute', person: 'a', me: 'a',
  heuteView: 'liste', duo: false, dayOff: 0, stat: 30, calView: 'kalender', taskView: 'mine', task: null,
  cal: { mode: 'monat', anchor: 0, from: -29, to: 0 },
  grid: { mode: 'woche', anchor: 0, from: -29, to: 0 },
  sheet: null, catSheet: false, authMode: 'login', authErr: '', setupErr: '', busy: false,
  setup: { me: 'a', a: 'Simon', b: 'Irina', code: '' }
};

const R = () => Object.values(data.routines).sort((x, y) => SLOTS.indexOf(x.slot) - SLOTS.indexOf(y.slot) || (x.createdAt || 0) - (y.createdAt || 0));
// Versionen: r.hist = [{ until: 'JJJJ-MM-TT', rep, who }, …] aufsteigend, jeweils gültig bis einschließlich `until`.
// Danach gelten r.rep und r.who. So bleiben vergangene Tage nach Änderungen so gewertet, wie sie geplant waren.
// Archiviert heißt: aktuelle Wiederholung { type: 'off' }, die Vergangenheit zählt weiter.
function verAt(r, off) { const k = dk(off); for (const h of r.hist || []) if (k <= h.until) return h; return r; }
const repAt = (r, off) => verAt(r, off).rep || { type: 'daily' };
const whoAt = (r, off) => verAt(r, off).who;
const rep = r => r.rep || { type: 'daily' };
const archived = r => rep(r).type === 'off';
const active = () => R().filter(r => !archived(r));
const forWho = (who, p) => who === 's' || who === 'ab' || who === p;
const visible = (r, p) => forWho(r.who, p);
const everVisible = (r, p) => visible(r, p) || (r.hist || []).some(h => forWho(h.who, p));
const keyFor = (r, p, off = 0) => (whoAt(r, off) === 's' ? 's' : p) + '|' + r.id;
// Mit Firebase gehört jedes Konto fest zu einer Person (ui.me). Alle sehen alles und dürfen
// seit Version 7 auch für die andere Person abhaken; bearbeiten nur die eigenen sowie gemeinsame Routinen.
// Lokal ist alles erlaubt.
const syncMode = () => firebaseConfig ? 'firebase' : 'local';
const canCheck = () => true;
const canEdit = r => syncMode() === 'local' || ['ab', 's', ui.me].includes(r.who);
const togAttr = (r, p, off) => canCheck(r, p, off) ? `data-a="toggle" data-r="${r.id}" data-o="${off}" data-p="${p}"` : 'aria-disabled="true"';
const viewOnly = () => syncMode() === 'firebase' && ui.person !== ui.me;
const isDone = (r, p, off) => !!(data.done[dk(off)] || {})[keyFor(r, p, off)];
const startOff = r => offOfKey(r.created || dk(0));
function weekDone(r, p, off, exclude) { const m = mondayOf(off); let n = 0; for (let o = m; o < m + 7; o++) { if (o !== exclude && isDone(r, p, o)) n++; } return n; }
function isDue(r, p, off) {
  if (off < startOff(r) || !forWho(whoAt(r, off), p)) return false;
  const d = dateAt(off), x = repAt(r, off);
  switch (x.type) {
    case 'off': return false;
    case 'weekdays': return (x.days || []).includes(d.getDay());
    case 'every': { const a = x.from ? offOfKey(x.from) : startOff(r); return off >= a && (off - a) % Math.max(1, x.n || 1) === 0; }
    case 'monthly': { const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); return d.getDate() === Math.min(x.day || 1, last); }
    case 'perweek': return weekDone(r, p, off, off) < (x.n || 1);
    default: return true;
  }
}
const shows = (r, p, off) => forWho(whoAt(r, off), p) && (isDue(r, p, off) || isDone(r, p, off));
function dayStats(p, off) { const list = R().filter(r => shows(r, p, off)); const n = list.filter(r => isDone(r, p, off)).length; return { list, n, t: list.length, pct: list.length ? Math.round(n / list.length * 100) : 0 }; }
// „X-mal pro Woche“ zählt je Woche höchstens X Termine (bzw. so viele Tage, wie die Woche im Zeitraum hat).
function rate(r, p, s, e) {
  const last = Math.min(e, 0), weeks = {}; let a = 0, b = 0;
  for (let o = Math.max(s, startOff(r), MIN); o <= last; o++) {
    const x = repAt(r, o);
    if (x.type === 'perweek') {
      if (!forWho(whoAt(r, o), p)) continue;
      const w = weeks[mondayOf(o)] ||= { days: 0, dn: 0, n: x.n || 1 }; w.days++; if (isDone(r, p, o)) w.dn++;
    } else if (isDue(r, p, o)) { b++; if (isDone(r, p, o)) a++; }
  }
  for (const w of Object.values(weeks)) { const need = Math.min(w.n, w.days); b += need; a += Math.min(w.dn, need); }
  return { a, b, pct: b ? Math.round(a / b * 100) : 0 };
}
function streak(r, p, off) {
  if (repAt(r, off).type === 'perweek') return 0;
  let n = 0, o = isDone(r, p, off) ? off : off - 1;
  for (let i = 0; i < 400 && o >= startOff(r); o--, i++) { if (!isDue(r, p, o)) continue; if (isDone(r, p, o)) n++; else break; }
  return n;
}
// Neue Version anlegen, wenn sich Wiederholung oder Person ändert. Die alte Einstellung gilt bis gestern;
// mehrere Änderungen am selben Tag ergeben nur eine Version.
function addVersion(r, old) {
  const same = JSON.stringify(rep(old)) === JSON.stringify(rep(r)) && old.who === r.who;
  const hist = [...(old.hist || [])];
  if (!same && startOff(old) < 0 && hist[hist.length - 1]?.until !== dk(-1)) hist.push({ until: dk(-1), rep: rep(old), who: old.who });
  r.hist = hist;
  return r;
}
function repLabel(r) {
  const x = rep(r);
  switch (x.type) {
    case 'off': return 'Archiviert';
    case 'weekdays': return WD_ORDER.filter(d => (x.days || []).includes(d)).map(d => WD[d]).join(', ') || 'Keine Tage';
    case 'every': return x.n === 1 ? 'Täglich' : `Alle ${x.n} Tage`;
    case 'monthly': return `Monatlich am ${x.day}.`;
    case 'perweek': return `${x.n}× pro Woche`;
    default: return 'Täglich';
  }
}
// ---------- Bereiche ----------
const DEFAULT_CATS = [
  { id: 'gesundheit', name: 'Gesundheit', icon: 'heartbeat' }, { id: 'sport', name: 'Sport', icon: 'barbell' },
  { id: 'familie', name: 'Familie', icon: 'house-line' }, { id: 'freunde', name: 'Freunde', icon: 'users-three' },
  { id: 'haushalt', name: 'Haushalt', icon: 'broom' }, { id: 'sonstiges', name: 'Sonstiges', icon: 'dots-three-circle' }];
const cats = () => data.cats || DEFAULT_CATS;
// Routinen ohne gespeicherten Bereich bekommen einen Vorschlag anhand des Titels, bis sie bearbeitet werden.
const guessCat = t => /sport|lauf|jogg|training|yoga|dehn|spazier|fahrrad|schwimm|gym|kraft/i.test(t) ? 'sport'
  : /wasser|vitamin|zahn|obst|gemüse|schlaf|medit|tablette|gesund|trink/i.test(t) ? 'gesundheit'
  : /putz|wäsch|aufräum|gieß|küche|müll|einkauf|staub|spül/i.test(t) ? 'haushalt'
  : /kind|tochter|sohn|familie|eltern|mama|papa|oma|opa/i.test(t) ? 'familie'
  : /freund/i.test(t) ? 'freunde' : 'sonstiges';
const catOf = r => r.cat || guessCat(r.title || '');
const catById = id => cats().find(c => c.id === id);
const catName = r => catById(catOf(r))?.name || 'Ohne Bereich';
const catIcon = id => catById(id)?.icon || 'tag';
const whoLabel = r => r.who === 's' ? 'Gemeinsam' : r.who === 'ab' ? 'Beide' : data.names[r.who];

// ---------- Aufgaben ----------
// Einmalige Aufgaben: { id, title, note, from: 'a'|'b', to: 'a'|'b'|'s', due: 'JJJJ-MM-TT'|null, done, doneAt, doneBy, createdAt }.
// Beide dürfen alle Aufgaben vergeben, abhaken, ändern und löschen.
const T = () => Object.values(data.tasks || {});
const dueOff = t => t.due ? offOfKey(t.due) : null;
const taskFor = (t, p) => t.to === p || t.to === 's';
const openTasks = p => T().filter(t => !t.done && (!p || taskFor(t, p)));
const dueNow = p => openTasks(p).filter(t => t.due && dueOff(t) <= 0);
const sortTasks = l => l.sort((x, y) => (x.due || '9999') .localeCompare(y.due || '9999') || (x.createdAt || 0) - (y.createdAt || 0));
const dueLabel = (o, done) => o === 0 ? 'heute' : o === -1 ? 'gestern' : o === 1 ? 'morgen' : o < 0 && !done ? `seit ${fmtS(o)}` : o < 0 ? fmtS(o) : dateAt(o).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
const taskChip = t => t.to === 's' ? 'Beide' : t.from === t.to ? initial(t.to) : `${initial(t.from)} → ${initial(t.to)}`;
const tasksDueOn = (p, o) => T().filter(t => taskFor(t, p) && t.due === dk(o));
// Aufgaben einer Person im Zeitraum: fällig im Zeitraum oder darin erledigt
const tasksIn = (p, s, e) => sortTasks(T().filter(t => taskFor(t, p) && ((t.due && dueOff(t) >= s && dueOff(t) <= e) || (t.done && t.doneAt && offOfKey(t.doneAt) >= s && offOfKey(t.doneAt) <= e))));
const taskGroup = (list, label = 'Aufgaben') => list.length ? `<div class="sd-group sd-tasks"><span class="sd-label sd-catlabel">${icon('check-square-offset')}${label}<em>${list.length}</em></span>${list.map(taskItem).join('')}</div>` : '';
const taskMeta = t => t.to === 's' ? 'gemeinsam' : t.from === t.to ? 'selbst' : `von ${esc(data.names[t.from])} an ${esc(data.names[t.to])}`;

// ---------- Speicher ----------
const LS = 'superdaily-v1';
let fb = null, hhId = null, unsubs = [];
const store = {
  mode: firebaseConfig ? 'firebase' : 'local',
  saveLocal() { localStorage.setItem(LS, JSON.stringify({ ...data, me: ui.me })); },
  async toggle(date, key) {
    const day = { ...(data.done[date] || {}) };
    const val = !day[key];
    if (val) day[key] = true; else delete day[key];
    data.done = { ...data.done, [date]: day };
    render();
    if (this.mode === 'local') return this.saveLocal();
    const { F, db } = fb, [p, rid] = key.split('|');
    await F.setDoc(F.doc(db, 'households', hhId, 'days', `${p}_${date}`), { [rid]: val ? true : F.deleteField() }, { merge: true });
  },
  async saveRoutine(r) {
    data.routines = { ...data.routines, [r.id]: r }; render();
    if (this.mode === 'local') return this.saveLocal();
    const { F, db } = fb; await F.setDoc(F.doc(db, 'households', hhId, 'routines', r.id), r);
  },
  async deleteRoutine(id) {
    const n = { ...data.routines }; delete n[id]; data.routines = n; render();
    if (this.mode === 'local') return this.saveLocal();
    const { F, db } = fb; await F.deleteDoc(F.doc(db, 'households', hhId, 'routines', id));
  },
  async setNames(names) {
    data.names = names; render();
    if (this.mode === 'local') return this.saveLocal();
    const { F, db } = fb; await F.updateDoc(F.doc(db, 'households', hhId), { names });
  },
  async setCats(list) {
    data.cats = list; render();
    if (this.mode === 'local') return this.saveLocal();
    const { F, db } = fb; await F.updateDoc(F.doc(db, 'households', hhId), { cats: list });
  },
  async saveTask(t) {
    data.tasks = { ...data.tasks, [t.id]: t }; render();
    if (this.mode === 'local') return this.saveLocal();
    const { F, db } = fb; await F.setDoc(F.doc(db, 'households', hhId, 'tasks', t.id), t);
  },
  async deleteTask(id) {
    const n = { ...data.tasks }; delete n[id]; data.tasks = n; render();
    if (this.mode === 'local') return this.saveLocal();
    const { F, db } = fb; await F.deleteDoc(F.doc(db, 'households', hhId, 'tasks', id));
  },
  setMe(p) { ui.me = p; ui.person = p; render(); this.saveLocal(); },
  async importAll(obj) {
    if (!obj || typeof obj !== 'object' || !obj.routines) throw new Error('Ungültige Datei');
    if (this.mode === 'local') { Object.assign(data, { names: obj.names || data.names, routines: obj.routines, done: obj.done || {}, cats: obj.cats || data.cats, tasks: obj.tasks || {} }); this.saveLocal(); return render(); }
    // Mit Firebase nur übernehmen, was dieses Konto schreiben darf; der Rest bleibt für die andere Person.
    const { F, db } = fb, own = [ui.me, 's'];
    const routines = Object.values(obj.routines).filter(canEdit), skipped = Object.keys(obj.routines).length - routines.length;
    const writes = routines.map(r => [F.doc(db, 'households', hhId, 'routines', r.id), r, false]);
    Object.values(obj.tasks || {}).forEach(t => writes.push([F.doc(db, 'households', hhId, 'tasks', t.id), t, false]));
    const days = {};
    for (const [d, v] of Object.entries(obj.done || {})) for (const k of Object.keys(v || {})) {
      const [p, rid] = k.split('|'); if (!own.includes(p)) continue;
      (days[`${p}_${d}`] ||= {})[rid] = true;
    }
    Object.entries(days).forEach(([id, v]) => writes.push([F.doc(db, 'households', hhId, 'days', id), v, true]));
    if (obj.names || obj.cats) await F.updateDoc(F.doc(db, 'households', hhId), { ...(obj.names && { names: obj.names }), ...(obj.cats && { cats: obj.cats }) });
    for (let i = 0; i < writes.length; i += 400) {
      const batch = F.writeBatch(db);
      writes.slice(i, i + 400).forEach(([ref, v, merge]) => batch.set(ref, v, { merge }));
      await batch.commit();
    }
    return skipped;
  }
};

function initLocal() {
  try { const s = JSON.parse(localStorage.getItem(LS) || 'null'); if (s) { data.names = s.names || data.names; data.routines = s.routines || {}; data.done = s.done || {}; data.cats = s.cats || null; data.tasks = s.tasks || {}; ui.me = ui.person = s.me || 'a'; } } catch {}
  ui.screen = 'app'; render();
}

async function initFirebase() {
  const base = 'https://www.gstatic.com/firebasejs/10.12.2/';
  try {
    const [App, A, F] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
    const app = App.initializeApp(firebaseConfig);
    const auth = A.getAuth(app);
    let db;
    try { db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) }); } catch { db = F.getFirestore(app); }
    fb = { A, F, auth, db };
    initAnalytics(base, app);
    A.onAuthStateChanged(auth, async user => {
      unsubs.forEach(u => u()); unsubs = [];
      if (!user) { ui.screen = 'login'; return render(); }
      ui.screen = 'loading'; render();
      const us = await F.getDoc(F.doc(db, 'users', user.uid));
      if (!us.exists() || !us.data().hh) { ui.screen = 'setup'; return render(); }
      attach(us.data());
    });
  } catch (e) {
    console.error(e); ui.screen = 'error'; ui.authErr = 'Firebase konnte nicht geladen werden. Prüfe die Internetverbindung und firebase-config.js.'; render();
  }
}
// Google Analytics nur, wenn firebase-config.js eine measurementId enthält. Gesendet werden
// Bildschirme und Aktionen mit „person_1“/„person_2“, keine Namen und keine Routine-Titel.
let an = null;
async function initAnalytics(base, app) {
  if (!firebaseConfig.measurementId) return;
  try {
    const G = await import(base + 'firebase-analytics.js');
    if (!(await G.isSupported())) return;
    an = { G, a: G.getAnalytics(app) };
    track('screen_view', { firebase_screen: ui.tab });
  } catch (e) { console.warn('Analytics nicht verfügbar', e); }
}
function track(name, params = {}) {
  if (!an) return;
  try { an.G.logEvent(an.a, name, { ...params, person: ui.me === 'b' ? 'person_2' : 'person_1' }); } catch {}
}
function attach(u) {
  const { F, db } = fb; hhId = u.hh; ui.me = ui.person = u.person || 'a';
  if (an) an.G.setUserProperties(an.a, { person: ui.me === 'b' ? 'person_2' : 'person_1' });
  unsubs.push(F.onSnapshot(F.doc(db, 'households', hhId), s => {
    const d = s.data() || {}, role = d.roles?.[fb.auth.currentUser.uid];
    if (role && role !== ui.me) ui.me = ui.person = role;
    data.names = d.names || data.names; data.cats = d.cats || null; ui.screen = 'app'; render();
  }, err => { console.error(err); ui.screen = 'setup'; ui.setupErr = 'Kein Zugriff auf den Haushalt. Code prüfen oder neu beitreten.'; render(); }));
  unsubs.push(F.onSnapshot(F.collection(db, 'households', hhId, 'routines'), qs => {
    const r = {}; qs.forEach(d => { r[d.id] = d.data(); }); data.routines = r; render();
  }));
  unsubs.push(F.onSnapshot(F.collection(db, 'households', hhId, 'tasks'), qs => {
    const t = {}; qs.forEach(d => { t[d.id] = d.data(); }); data.tasks = t; render();
  }));
  // Dokumente "<a|b|s>_<Datum>" mit { routineId: true } → data.done[Datum]["<a|b|s>|routineId"]
  unsubs.push(F.onSnapshot(F.collection(db, 'households', hhId, 'days'), qs => {
    const done = {};
    qs.forEach(d => { const [p, date] = d.id.split('_'); const day = done[date] ||= {}; Object.keys(d.data()).forEach(rid => { day[p + '|' + rid] = true; }); });
    data.done = done; render();
  }));
}
const authMsg = c => ({
  'auth/invalid-email': 'Die E-Mail-Adresse ist ungültig.',
  'auth/invalid-credential': 'E-Mail oder Passwort stimmt nicht.',
  'auth/wrong-password': 'E-Mail oder Passwort stimmt nicht.',
  'auth/user-not-found': 'Kein Konto mit dieser E-Mail.',
  'auth/email-already-in-use': 'Für diese E-Mail gibt es schon ein Konto.',
  'auth/weak-password': 'Das Passwort braucht mindestens 6 Zeichen.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte kurz warten.',
  'auth/network-request-failed': 'Keine Verbindung.'
}[c] || 'Das hat nicht geklappt (' + c + ').');

// ---------- Zeiträume ----------
function rangeOf(m) {
  const { mode, anchor, from, to } = m; const ad = dateAt(anchor); let s, e, title, sub, nav;
  if (mode === 'tag') { s = e = anchor; title = anchor === 0 ? 'Heute' : anchor === -1 ? 'Gestern' : ad.toLocaleDateString('de-DE', { weekday: 'long' }); sub = fmtLong(anchor); nav = fmtS(anchor); }
  else if (mode === 'woche') { s = mondayOf(anchor); e = s + 6; title = e >= 0 ? 'Diese Woche' : 'KW ' + isoWeek(ad); sub = fmtS(s) + ' – ' + fmtS(e); nav = 'KW ' + isoWeek(ad); }
  else if (mode === 'monat') { s = offOf(new Date(ad.getFullYear(), ad.getMonth(), 1)); e = offOf(new Date(ad.getFullYear(), ad.getMonth() + 1, 0)); title = ad.toLocaleDateString('de-DE', { month: 'long' }); sub = String(ad.getFullYear()); nav = ad.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }); }
  else { s = Math.min(from, to); e = Math.max(from, to); title = 'Zeitraum'; sub = fmtS(s) + ' – ' + fmtS(e) + ' · ' + (e - s + 1) + ' Tage'; }
  return { s, e, title, sub, nav };
}
function stepRange(m, k) {
  const ad = dateAt(m.anchor);
  if (m.mode === 'tag') m.anchor = clamp(m.anchor + k);
  else if (m.mode === 'woche') m.anchor = clamp(m.anchor + 7 * k);
  else m.anchor = clamp(offOf(new Date(ad.getFullYear(), ad.getMonth() + k, 1)));
}
function totals(p, s, e) { let a = 0, b = 0; R().filter(r => everVisible(r, p)).forEach(r => { const x = rate(r, p, s, e); a += x.a; b += x.b; }); return { a, b, pct: b ? Math.round(a / b * 100) : 0 }; }

// ---------- Bausteine ----------
// Symbole sind Schmuck: aria-hidden, damit Vorleseprogramme (VoiceOver, TalkBack) sie nicht als Zeichen vorlesen.
const icon = (n, cls = 'ph') => `<i class="${cls} ph-${n}" aria-hidden="true"></i>`;
const initial = p => esc((data.names[p] || '?')[0].toUpperCase());
const personDots = () => `<div class="sd-dots">${['a', 'b'].map(p => `<button class="sd-dot ${ui.person === p ? 'on' : ''}" data-a="person" data-p="${p}" aria-label="${esc(data.names[p])}">${initial(p)}</button>`).join('')}</div>`;
// Heute: Simon | Irina | Duo (seit Version 9 statt der runden Knöpfe)
const whoSeg = () => `<div class="sd-seg sd-who3">${[['a', esc(data.names.a)], ['b', esc(data.names.b)], ['duo', 'Duo']].map(([k, l]) => `<button class="${(ui.duo ? 'duo' : ui.person) === k ? 'on' : ''}" data-a="who" data-v="${k}"><i class="sd-wdot ${k}" aria-hidden="true"></i>${l}</button>`).join('')}</div>`;
const pair = () => `<span class="sd-pair" aria-label="Gemeinsam">${['a', 'b'].map(q => `<span class="${q}" aria-hidden="true">${initial(q)}</span>`).join('')}</span>`;
const personSeg = () => `<div class="sd-seg">${['a', 'b'].map(p => `<button class="${ui.person === p ? 'on' : ''}" data-a="person" data-p="${p}">${esc(data.names[p])}</button>`).join('')}</div>`;
const seg = (opts, cur, action) => `<div class="sd-seg">${opts.map(([k, l]) => `<button class="${k === cur ? 'on' : ''}" data-a="${action}" data-v="${k}">${l}</button>`).join('')}</div>`;
const prog = (label, pct, glow = true) => `<div class="sd-prog"><div class="row"><span>${label}</span><b>${pct}%</b></div><div class="sd-track ${glow ? 'glow' : ''}"><div style="width:${pct}%"></div></div></div>`;
const MODES = [['tag', 'Tag'], ['woche', 'Woche'], ['monat', 'Monat'], ['zeitraum', 'Von – bis']];
function rangeControls(m, scope) {
  const { s, e, nav } = rangeOf(m);
  let h = seg(MODES, m.mode, scope + 'Mode');
  if (m.mode === 'zeitraum') {
    h += `<div class="sd-range"><label class="sd-field">Von<input class="sd-input" type="date" value="${dk(s)}" min="${dk(MIN)}" max="${dk(0)}" data-ch="${scope}From"></label><span>–</span><label class="sd-field">Bis<input class="sd-input" type="date" value="${dk(e)}" min="${dk(MIN)}" max="${dk(0)}" data-ch="${scope}To"></label></div>`;
    h += `<div class="sd-chips">${[7, 30, 90].map(d => `<button class="sd-chip ${e === 0 && s === -(d - 1) ? 'on' : ''}" data-a="${scope}Preset" data-v="${d}">Letzte ${d} Tage</button>`).join('')}</div>`;
  } else {
    const nextOk = m.mode === 'tag' ? m.anchor < 0 : e < 0;
    h += `<div class="sd-nav"><button class="sd-circ" data-a="${scope}Step" data-v="-1" ${s > MIN ? '' : 'disabled'} aria-label="Zurück">${icon('caret-left')}</button><span>${nav}</span><button class="sd-circ" data-a="${scope}Step" data-v="1" ${nextOk ? '' : 'disabled'} aria-label="Weiter">${icon('caret-right')}</button></div>`;
  }
  return h;
}
function hero(st, off) {
  const h = new Date().getHours(), name = esc(data.names[ui.person]);
  const hi = viewOnly() ? `${name}s Tag` : off !== 0 ? fmtLong(off) : h < 11 ? `Guten Morgen, ${name}` : h < 18 ? `Hallo, ${name}` : `Guten Abend, ${name}`;
  const left = st.t - st.n;
  const msg = viewOnly() ? (!st.t ? 'Nichts geplant.' : !left ? 'Alles erledigt.' : `Noch ${left} offen.`) : !st.t ? 'Heute ist nichts geplant.' : !left ? 'Alles erledigt. Stark!' : st.n === 0 ? `${left} ${left === 1 ? 'Routine wartet' : 'Routinen warten'} auf dich.` : `Noch ${left}, du bist auf einem guten Weg.`;
  return `<div class="sd-hero ${st.t && !left ? 'full' : ''}"><div class="sd-hring" style="--p:${st.pct}"><div><b>${st.pct}<small>%</small></b></div></div><div class="sd-htxt"><span class="sd-hhi">${hi}</span><b>${st.n} von ${st.t} erledigt</b><span>${msg}</span></div></div>`;
}
// Vorlagen für den schnellen Start: [Icon, Titel, Tageszeit]
const TPL = [['drop', 'Glas Wasser nach dem Aufstehen', 'Morgen', 'gesundheit'], ['pill', 'Vitamine nehmen', 'Morgen', 'gesundheit'], ['person-simple-tai-chi', '5 Minuten dehnen', 'Morgen', 'sport'], ['sneaker-move', '10 Minuten spazieren', 'Tagsüber', 'sport'], ['book-open', '20 Seiten lesen', 'Abend', 'sonstiges'], ['tooth', 'Zahnseide', 'Abend', 'gesundheit']];
const tplCat = id => catById(id) ? id : null;
const tplChips = action => TPL.map(([i, t], k) => active().some(r => r.title === t) ? '' : `<button class="sd-tpl" data-a="${action}" data-v="${k}">${icon(i)}${t}</button>`).join('');
const empty = (txt, btn) => btn
  ? `<div class="sd-welcome"><span class="ico">${icon('plant', 'ph-fill')}</span><h2>Willkommen bei SuperDaily</h2><p>Tippe eine Vorlage an, um direkt loszulegen, oder lege eine eigene Routine an.</p><div class="sd-tpls">${tplChips('addTpl')}</div><button class="sd-btn block" data-a="newRoutine">${icon('plus')}Eigene Routine anlegen</button></div>`
  : `<div class="sd-empty"><span>${txt}</span></div>`;

const roNote = () => viewOnly() ? `<div class="sd-ro">${icon('eye')}<span>Du siehst ${esc(data.names[ui.person])}s Routinen und kannst sie auch für ${esc(data.names[ui.person])} abhaken.</span></div>` : '';
function listView(p, off) {
  const st = dayStats(p, off);
  if (!active().length) return empty('Noch keine Routinen. Leg die erste an, zum Beispiel „Glas Wasser nach dem Aufstehen“.', true);
  if (!st.t) return empty('An diesem Tag ist nichts geplant.');
  return SLOTS.map(slot => {
    const items = st.list.filter(r => r.slot === slot); if (!items.length) return '';
    return `<div class="sd-group"><span class="sd-label">${slot}</span>${items.map(r => {
      const dn = isDone(r, p, off), sk = streak(r, p, off), x = rep(r);
      let meta = `${esc(catName(r))} · ${repLabel(r)}` + (r.who === 's' ? ' · gemeinsam' : '');
      if (x.type === 'perweek') meta += ` · ${weekDone(r, p, off, null)}/${x.n} diese Woche`;
      return `<button class="sd-item ${dn ? 'done' : ''} ${canCheck(r, p) ? '' : 'ro'}" ${togAttr(r, p, off)}><span class="sd-check">${icon('check', 'ph-bold')}</span><span class="txt"><span class="t">${esc(r.title)}</span><span class="m">${meta}</span></span>${r.who === 's' ? pair() : ''}${sk > 1 ? `<span class="sd-streak">${icon('flame')}${sk}</span>` : ''}</button>`;
    }).join('')}</div>`;
  }).join('');
}
function tilesView(p, off) {
  const rings = ['a', 'b'].map(q => {
    const s = dayStats(q, off), deg = Math.round(s.pct * 3.6), on = q === p;
    return `<button class="sd-ringcard ${on ? 'on' : ''}" data-a="person" data-p="${q}"><div class="sd-ring" style="background:conic-gradient(${on ? `var(--color-accent-400), var(--sd-pink) ${deg}deg` : `var(--color-neutral-600) ${deg}deg`}, var(--color-neutral-900) 0)"><div><b>${s.pct}%</b><small>${s.n} von ${s.t}</small></div></div><span>${esc(data.names[q])}</span></button>`;
  }).join('');
  const st = dayStats(p, off);
  let tiles = '';
  if (!active().length) tiles = empty('Noch keine Routinen.', true);
  else if (!st.t) tiles = empty('An diesem Tag ist nichts geplant.');
  else tiles = `<div class="sd-tiles">${st.list.map(r => {
    const dn = isDone(r, p, off), sk = streak(r, p, off);
    const meta = [r.who === 's' ? 'Gemeinsam' : '', sk > 1 ? sk + ' Tage in Folge' : '', rep(r).type === 'perweek' ? `${weekDone(r, p, off, null)}/${rep(r).n} diese Woche` : ''].filter(Boolean).join(' · ');
    return `<button class="sd-tile ${dn ? 'done' : ''} ${canCheck(r, p) ? '' : 'ro'}" ${togAttr(r, p, off)}><div class="top"><span>${r.slot}</span><span class="sd-check">${icon('check', 'ph-bold')}</span></div><span class="t">${esc(r.title)}</span><span class="m">${meta}</span></button>`;
  }).join('')}</div>`;
  return `<div class="sd-rings">${rings}</div><div class="sd-hdr" style="align-items:baseline"><span style="font-size:15px;font-weight:500">${off === 0 ? 'Heute dran' : 'An diesem Tag'}</span><span class="sd-muted">${st.t - st.n ? (st.t - st.n) + ' offen' : st.t ? 'Alles erledigt' : ''}</span></div>${tiles}`;
}
// Duo: beide Personen nebeneinander. Beide dürfen für beide abhaken (seit Version 7);
// gemeinsame Routinen haben ein Feld für beide.
const PP = ['a', 'b'];
function duoPct(off) { const [x, y] = PP.map(p => dayStats(p, off)); return x.t + y.t ? Math.round((x.n + y.n) / (x.t + y.t) * 100) : 0; }
const duoList = off => R().filter(r => PP.some(p => shows(r, p, off)));
function duoCell(r, p, off, tag) {
  const nm = esc(data.names[p]);
  if (!shows(r, p, off)) return `<span class="sd-dcell na" aria-label="${nm}: nicht geplant">–</span>`;
  const dn = isDone(r, p, off), inner = (tag ? initial(p) : '') + (dn ? icon('check', 'ph-bold') : '');
  return `<button class="sd-dcell ${p} ${dn ? 'done' : ''}" ${togAttr(r, p, off)} aria-pressed="${dn}" aria-label="${esc(r.title)}, ${nm}: ${dn ? 'erledigt' : 'offen'}">${inner}</button>`;
}
function duoCells(r, off, tag) {
  if (whoAt(r, off) !== 's') return PP.map(p => duoCell(r, p, off, tag)).join('');
  const dn = isDone(r, ui.me, off);
  return `<button class="sd-dcell both ${dn ? 'done' : ''}" ${togAttr(r, ui.me, off)} aria-pressed="${dn}" aria-label="${esc(r.title)}, gemeinsam: ${dn ? 'erledigt' : 'offen'}">${dn ? icon('check', 'ph-bold') : ''}Beide</button>`;
}
const duoWho = (r, off) => ({ s: 'Gemeinsam', ab: 'Beide einzeln', a: 'Nur ' + esc(data.names.a), b: 'Nur ' + esc(data.names.b) })[whoAt(r, off)] || '';
const duoScore = off => `<div class="sd-duoscore">${PP.map(p => { const s = dayStats(p, off); return `<button class="sd-dsc" data-a="person" data-p="${p}" aria-label="${esc(data.names[p])} öffnen"><span class="sd-dring" style="background:conic-gradient(var(--sd-${p}) ${s.pct * 3.6}deg, var(--color-neutral-900) 0)"><span>${s.pct}%</span></span><span class="txt"><b>${esc(data.names[p])}</b><small>${s.n} von ${s.t}</small></span></button>`; }).join('')}</div>`;
function duoListView(off) {
  if (!active().length) return empty('', true);
  const list = duoList(off); if (!list.length) return duoScore(off) + empty('An diesem Tag ist nichts geplant.');
  const head = `<div class="sd-drow head" aria-hidden="true"><span></span>${PP.map(p => `<span class="${p}">${esc(data.names[p])}</span>`).join('')}</div>`;
  const groups = SLOTS.map(slot => {
    const items = list.filter(r => r.slot === slot); if (!items.length) return '';
    return `<span class="sd-label">${slot}</span>${items.map(r => `<div class="sd-drow ${whoAt(r, off) === 's' ? 'shared' : ''}"><span class="txt"><span class="t">${esc(r.title)}</span><span class="m">${esc(catName(r))} · ${duoWho(r, off)}</span></span>${duoCells(r, off, false)}</div>`).join('')}`;
  }).join('');
  return `${duoScore(off)}<div class="sd-duo">${head}${groups}</div>`;
}
function duoTilesView(off) {
  if (!active().length) return empty('', true);
  const list = duoList(off); if (!list.length) return duoScore(off) + empty('An diesem Tag ist nichts geplant.');
  return `${duoScore(off)}<div class="sd-dtiles">${list.map(r => `<div class="sd-dtile"><span class="top">${r.slot}${whoAt(r, off) === 's' ? ' · gemeinsam' : ''}</span><span class="t">${esc(r.title)}</span><div class="sd-dcells">${duoCells(r, off, true)}</div></div>`).join('')}</div>`;
}
function matrixView(p, s, e, withRate) {
  const vis = R().filter(r => everVisible(r, p) && (!archived(r) || rate(r, p, s, e).b));
  if (!vis.length) return empty('Noch keine Routinen.', true);
  const cols = []; for (let o = s; o <= e; o++) cols.push(o);
  const n = cols.length, size = n === 1 ? 44 : n <= 7 ? 30 : 26;
  const gtc = `grid-template-columns:${n <= 7 ? 'minmax(0,1fr)' : '128px'} repeat(${n},${size}px)`;
  const head = cols.map(o => { const d = dateAt(o); return `<span class="sd-hcell ${o === 0 ? 'today' : d.getDay() === 1 && n > 7 ? 'mon' : ''}"><span>${WD[d.getDay()]}</span><b>${d.getDate()}</b></span>`; }).join('');
  const rows = vis.map(r => {
    const rt = rate(r, p, s, e);
    const cells = cols.map(o => {
      const fut = o > 0, due = o >= MIN && (isDue(r, p, o) || rep(r).type === 'perweek' && o >= startOff(r)), dn = !fut && isDone(r, p, o);
      const cls = dn ? 'done' : !due ? 'off' : fut ? 'fut' : o === 0 ? 'today' : '';
      const can = !fut && (due || dn) && canCheck(r, p);
      return `<button class="sd-cell ${cls}" ${can ? `data-a="toggle" data-r="${r.id}" data-o="${o}"` : 'tabindex="-1"'} aria-label="${esc(r.title)} ${dk(o)}">${icon('check', 'ph-bold')}</button>`;
    }).join('');
    const meta = (rep(r).type === 'daily' && r.who === 's' ? 'Gemeinsam' : repLabel(r)) + (withRate ? ` · ${rt.pct} %` : '');
    return `<div class="sd-grow" style="${gtc}"><div class="sd-sticky"><span class="t">${esc(r.title)}</span><span class="m">${meta}</span></div>${cells}</div>`;
  }).join('');
  const foot = cols.map(o => { const ok = o <= 0 && o >= MIN; const pct = ok ? dayStats(p, o).pct : 0; return `<div class="sd-qbar"><div style="height:${ok ? Math.max(4, pct * .36) : 0}px"></div></div>`; }).join('');
  const key = s + '|' + e;
  return `<div class="sd-gridscroll" data-key="${key}"><div class="sd-grid ${n <= 7 ? 'fit' : ''}"><div class="sd-grow head" style="${gtc}"><span class="sd-sticky"></span>${head}</div>${rows}<div class="sd-grow foot" style="${gtc}"><span class="sd-sticky sd-muted" style="font-size:11px;justify-content:flex-end">Tagesquote</span>${foot}</div></div></div>${n > 7 ? `<span class="sd-muted" style="font-size:11px;display:flex;gap:4px;align-items:center">${icon('arrows-horizontal')}Seitlich wischen für frühere Tage</span>` : ''}`;
}
function calendarView(p, s, e, longRange) {
  const cs = mondayOf(s), ce = mondayOf(e) + 6; let cells = '';
  for (let o = cs; o <= ce; o++) {
    const inR = o >= s && o <= e, ok = inR && o <= 0 && o >= MIN, d = dateAt(o);
    const pct = ok ? dayStats(p, o).pct : 0;
    const label = d.getDate() === 1 && longRange ? d.toLocaleDateString('de-DE', { month: 'short' }) : d.getDate();
    const td = inR ? tasksDueOn(p, o) : [], tdot = !td.length ? '' : td.some(t => !t.done && o < 0) ? 'tlate' : td.every(t => t.done) ? 'tdone' : 'topen';
    cells += `<button class="${ok ? 'ok' : inR ? 'in' : ''} ${o === 0 ? 'today' : ''} ${tdot}" ${ok ? `data-a="calDay" data-o="${o}" style="background:color-mix(in srgb, var(--color-accent) ${Math.round(8 + pct * .62)}%, var(--color-surface))"` : 'tabindex="-1"'} aria-label="${dk(o)}${ok ? ' ' + pct + ' %' : ''}${td.length ? ', ' + td.length + ' Aufgabe(n)' : ''}">${label}</button>`;
  }
  const rates = R().filter(r => everVisible(r, p)).map(r => ({ r, x: rate(r, p, s, e) })).filter(({ x }) => x.b).sort((a, b) => b.x.pct - a.x.pct)
    .map(({ r, x }) => `<div class="sd-rate"><div class="row"><span>${esc(r.title)}</span><span>${x.a} / ${x.b} · ${x.pct} %</span></div><div class="sd-track"><div style="width:${x.pct}%"></div></div></div>`).join('');
  return `<div style="display:flex;flex-direction:column;gap:6px"><div class="sd-cal">${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(w => `<span>${w}</span>`).join('')}</div><div class="sd-cal">${cells}</div><div class="sd-legend" style="padding-top:4px"><span>0 %</span><i></i><span>100 %</span></div>${T().length ? `<div class="sd-tlegend"><span class="topen">Aufgabe fällig</span><span class="tdone">erledigt</span><span class="tlate">überfällig</span></div>` : ''}</div>${rates ? `<div class="sd-group" style="gap:12px"><span class="sd-label">Je Routine</span>${rates}</div>` : ''}`;
}

// ---------- Tabs ----------
function tabHeute() {
  const off = ui.dayOff, p = ui.person, st = dayStats(p, off);
  const title = off === 0 ? 'Heute' : off === -1 ? 'Gestern' : dateAt(off).toLocaleDateString('de-DE', { weekday: 'long' });
  const end = off < -6 ? off + 3 : 0; const days = [];
  for (let o = end - 6; o <= end; o++) days.push(o);
  const strip = `<div class="sd-strip">${days.map(o => `<button class="${o === off ? 'on' : ''}" data-a="day" data-o="${o}"><small>${WD[dateAt(o).getDay()]}</small><b>${dateAt(o).getDate()}</b><i class="bar"><i style="width:${ui.duo ? duoPct(o) : dayStats(p, o).pct}%"></i></i></button>`).join('')}</div>`;
  const body = ui.duo ? (ui.heuteView === 'liste' ? duoListView(off) : duoTilesView(off))
    : ui.heuteView === 'liste' ? `${R().length ? hero(st, off) : ''}${listView(p, off)}` : tilesView(p, off);
  return `<div class="sd-hdr"><div><div class="sd-sub">${fmtLong(off)}</div><h1>${title}</h1></div></div>
  ${whoSeg()}
  ${seg([['liste', icon('list') + 'Liste'], ['kacheln', icon('squares-four') + 'Kacheln']], ui.heuteView, 'heuteView')}
  ${strip}${newNote()}${ui.duo ? '' : roNote()}${heuteTasks(ui.duo ? ui.me : p, off)}${body}`;
}
// Ganz oben auf „Heute“: fällige und überfällige Aufgaben der Person; an diesem Tag Erledigtes bleibt durchgestrichen stehen.
// An vergangenen Tagen: die an diesem Tag fälligen Aufgaben.
function heuteTasks(p, off) {
  const list = off === 0 ? sortTasks(T().filter(t => taskFor(t, p) && t.due && dueOff(t) <= 0 && (!t.done || t.doneAt === dk(0)))) : sortTasks(tasksDueOn(p, off));
  if (!list.length) return '';
  return `<div class="sd-group sd-tasks"><span class="sd-label sd-catlabel">${icon('check-square-offset')}Aufgaben<button class="sd-mini" data-a="tab" data-v="aufgaben">Alle</button></span>${list.map(taskItem).join('')}</div>`;
}
function tabKalender() {
  const m = ui.cal, p = ui.person, { s, e, title, sub } = rangeOf(m), tot = totals(p, s, e);
  let body;
  if (m.mode === 'tag') { const st = dayStats(p, s); body = prog(`${st.n} von ${st.t} erledigt`, st.pct) + listView(p, s); }
  else { body = prog(`${tot.a} von ${tot.b} Erledigungen`, tot.pct) + (m.mode === 'woche' ? matrixView(p, s, e, false) : calendarView(p, s, e, m.mode === 'zeitraum')); }
  const tl = tasksIn(p, s, m.mode === 'monat' ? e : Math.min(e, 0));
  return `<div class="sd-hdr"><div><div class="sd-sub">${sub}</div><h1>${title}</h1></div>${personDots()}</div>${calViewSeg()}${rangeControls(m, 'cal')}${roNote()}${m.mode === 'tag' ? taskGroup(tl) : ''}${body}${m.mode === 'tag' ? '' : taskGroup(tl, m.mode === 'monat' ? 'Aufgaben in diesem Monat' : 'Aufgaben im Zeitraum')}`;
}
// Das Raster ist seit Version 7 eine Ansicht im Kalender-Tab.
const calViewSeg = () => seg([['kalender', icon('calendar-blank') + 'Kalender'], ['raster', icon('grid-four') + 'Raster']], ui.calView, 'calView');
function tabRaster() {
  const m = ui.grid, p = ui.person, { s, e, title, sub } = rangeOf(m), tot = totals(p, s, e);
  return `<div class="sd-hdr"><div><div class="sd-sub">${sub}</div><h1>${title}</h1></div><div class="sd-big"><b>${tot.pct}%</b><span>${tot.a} von ${tot.b} erfüllt</span></div></div>${calViewSeg()}${rangeControls(m, 'grid')}${personSeg()}${roNote()}${matrixView(p, s, e, true)}`;
}
function tabRoutinen() {
  const all = active(), arch = R().filter(archived);
  const row = r => `<button class="sd-row ${canEdit(r) ? '' : 'ro'}" ${canEdit(r) ? `data-a="edit" data-r="${r.id}"` : `aria-disabled="true" title="Nur ${esc(data.names[r.who])} kann diese Routine bearbeiten"`}><span class="txt"><span class="t">${esc(r.title)}</span><span class="m">${r.slot} · ${repLabel(r)}</span></span><span class="sd-who ${r.who === 's' ? 's' : ''}">${esc(whoLabel(r))}</span>${icon(canEdit(r) ? 'caret-right' : 'lock-simple')}</button>`;
  const groups = [...cats().map(c => [c.id, c.name, c.icon]), [null, 'Ohne Bereich', 'tag']].map(([id, name, ic]) => {
    const items = all.filter(r => id ? catOf(r) === id : !catById(catOf(r))); if (!items.length) return '';
    return `<div class="sd-group"><span class="sd-label sd-catlabel">${icon(ic)}${esc(name)}<em>${items.length}</em></span>${items.map(row).join('')}</div>`;
  }).join('');
  const archived_ = arch.length ? `<details class="sd-arch"><summary>${icon('archive')}Archiviert<em>${arch.length}</em></summary><p>Archivierte Routinen erscheinen nicht mehr, ihre vergangenen Tage zählen aber weiter in Kalender und Statistik.</p>${arch.map(r => `<div class="sd-row ro"><span class="txt"><span class="t">${esc(r.title)}</span><span class="m">${esc(catName(r))} · ${esc(whoLabel(r))}</span></span>${canEdit(r) ? `<button class="sd-mini" data-a="restore" data-r="${r.id}">${icon('arrow-counter-clockwise')}Wiederherstellen</button><button class="sd-mini danger" data-a="purge" data-r="${r.id}" aria-label="Endgültig löschen">${icon('trash')}</button>` : icon('lock-simple')}</div>`).join('')}</details>` : '';
  const body = !all.length && !arch.length ? empty('Noch keine Routinen.', true) : (all.length ? groups : empty('Alle Routinen sind archiviert.', true)) + archived_;
  return `<div class="sd-hdr"><div><div class="sd-sub">${all.length} ${all.length === 1 ? 'Routine' : 'Routinen'}</div><h1>Routinen</h1></div><button class="sd-btn ghost sm" data-a="openCats">${icon('folders')}Bereiche</button></div>${body}`;
}
function taskItem(t) {
  const o = dueOff(t), late = !t.done && o !== null && o < 0;
  const due = o === null ? '' : `<span class="due ${late ? 'late' : ''}">${icon(late ? 'warning-circle' : 'calendar-blank')}${dueLabel(o, t.done)}</span> · `;
  return `<div class="sd-item sd-titem ${t.done ? 'done' : ''}"><button class="sd-check" data-a="taskToggle" data-t="${t.id}" aria-label="${esc(t.title)} ${t.done ? 'wieder öffnen' : 'abhaken'}">${icon('check', 'ph-bold')}</button><button class="txt" data-a="taskEdit" data-t="${t.id}"><span class="t">${esc(t.title)}</span><span class="m">${due}${taskMeta(t)}${t.note ? ' · ' + icon('note') : ''}</span></button><span class="sd-from">${taskChip(t)}</span></div>`;
}
function tabAufgaben() {
  const me = ui.me, v = ui.taskView, open = openTasks(), late = open.filter(t => t.due && dueOff(t) < 0).length, today = dueNow(me).length;
  let list, body;
  if (v === 'done') {
    list = T().filter(t => t.done && t.doneAt >= dk(-30)).sort((x, y) => (y.doneAt || '').localeCompare(x.doneAt || ''));
    body = list.length ? `<div class="sd-group">${list.map(taskItem).join('')}</div><p class="sd-muted sd-tnote">Erledigte Aufgaben der letzten 30 Tage.</p>` : '';
  } else {
    list = sortTasks(open.filter(t => v === 'all' || (v === 'mine' ? taskFor(t, me) : t.from === me && t.to !== me)));
    const groups = [['Überfällig', t => t.due && dueOff(t) < 0], ['Heute', t => t.due && dueOff(t) === 0], ['Morgen', t => t.due && dueOff(t) === 1], ['Später', t => t.due && dueOff(t) > 1], ['Ohne Datum', t => !t.due]];
    body = groups.map(([name, f]) => { const g = list.filter(f); return g.length ? `<div class="sd-group"><span class="sd-label">${name}</span>${g.map(taskItem).join('')}</div>` : ''; }).join('');
  }
  const none = { mine: 'Nichts zu tun. Tippe auf +, um eine Aufgabe anzulegen.', from: 'Du hast gerade keine offenen Aufgaben vergeben.', all: 'Keine offenen Aufgaben.', done: 'In den letzten 30 Tagen wurde nichts erledigt.' }[v];
  const sub = `${open.length} offen${late ? ` · ${late} überfällig` : ''}`;
  return `<div class="sd-hdr"><div><div class="sd-sub">${sub}</div><h1>Aufgaben</h1></div></div>
  <div class="sd-tbanner"><span>${icon('sun-horizon', 'ph-fill')}Fällig für dich</span><b>${today}</b></div>
  ${seg([['mine', 'Für mich'], ['from', 'Vergeben'], ['all', 'Alle'], ['done', 'Erledigt']], v, 'taskView')}
  ${body || `<div class="sd-empty"><span>${none}</span></div>`}`;
}
function taskSheetHtml() {
  const d = ui.task, opt = (on, a, v, l) => `<button class="sd-opt ${on ? 'on' : ''}" data-a="${a}" data-v="${v}">${l}</button>`;
  const enter = ui.sheetFresh ? 'enter' : ''; ui.sheetFresh = false;
  const quick = [['', 'Ohne Datum'], [dk(0), 'Heute'], [dk(1), 'Morgen'], [dk((6 - dateAt(0).getDay() + 7) % 7 || 7), 'Samstag'], [dk(7), 'In einer Woche']];
  return `<div class="sd-back ${enter}" data-a="closeSheet"><div class="sd-sheet sd-tsheet" data-a="noop">
  <div class="grip"></div><h3>${d.id ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</h3>
  <input class="sd-input" value="${esc(d.title)}" placeholder="z. B. Paket zur Post bringen" data-in="tTitle" maxlength="120">
  <div class="sd-field">Für wen<div class="sd-g3">${[['a', esc(data.names.a)], ['b', esc(data.names.b)], ['s', 'Gemeinsam']].map(([k, l]) => opt(d.to === k, 'tTo', k, l)).join('')}</div></div>
  <div class="sd-field">Fällig<div class="sd-chips">${quick.map(([k, l]) => `<button class="sd-chip ${(d.due || '') === k ? 'on' : ''}" data-a="tDue" data-v="${k}">${l}</button>`).join('')}</div><input class="sd-input" type="date" value="${d.due || ''}" data-ch="tDate" aria-label="Datum wählen"></div>
  <label class="sd-field">Notiz<textarea class="sd-input" rows="2" maxlength="500" placeholder="optional" data-in="tNote">${esc(d.note || '')}</textarea></label>
  <button class="sd-btn block" data-a="tSave" ${d.title.trim() ? '' : 'disabled'}>${d.id ? 'Speichern' : 'Aufgabe vergeben'}</button>
  ${d.id ? `<button class="sd-btn danger block" data-a="tDelete">${icon('trash')}Aufgabe löschen</button>` : ''}
  </div></div>`;
}
const CAT_ICONS = ['heartbeat', 'barbell', 'house-line', 'users-three', 'broom', 'dots-three-circle', 'tag', 'briefcase', 'book-open', 'leaf', 'moon', 'sun', 'heart', 'brain', 'paint-brush', 'music-notes', 'baby', 'dog', 'currency-eur', 'fork-knife', 'drop', 'graduation-cap'];
function catSheetHtml() {
  const enter = ui.sheetFresh ? 'enter' : ''; ui.sheetFresh = false;
  const count = id => active().filter(r => catOf(r) === id).length;
  return `<div class="sd-back ${enter}" data-a="closeSheet"><div class="sd-sheet" data-a="noop">
  <div class="grip"></div><h3>Bereiche</h3>
  <p class="sd-sheetp">Ordne Routinen nach Lebensbereichen. Symbol antippen zum Wechseln, Namen direkt ändern. Gilt für euch beide.</p>
  <div class="sd-catlist">${cats().map(c => `<div class="sd-catrow"><button class="sd-caticon" data-a="catIcon" data-id="${c.id}" aria-label="Symbol wechseln">${icon(c.icon)}</button><input class="sd-input" value="${esc(c.name)}" maxlength="40" data-ch="catName" data-id="${c.id}" aria-label="Name des Bereichs"><span class="sd-catn">${count(c.id)}</span><button class="sd-circ" data-a="catDel" data-id="${c.id}" aria-label="Bereich ${esc(c.name)} entfernen">${icon('trash')}</button></div>`).join('')}</div>
  <div class="sd-catadd"><input class="sd-input" placeholder="Neuer Bereich, z. B. Beruf" maxlength="40" data-in="catNew" value="${esc(ui.catDraft || '')}"><button class="sd-btn" data-a="catAdd">${icon('plus')}Anlegen</button></div>
  <button class="sd-btn ghost block" data-a="${ui.sheet ? 'closeCats' : 'closeSheet'}">${ui.sheet ? 'Zurück zur Routine' : 'Fertig'}</button>
  </div></div>`;
}
const newNote = () => seenVersion < APP_VERSION ? `<div class="sd-hint sd-new">${icon('sparkle', 'ph-fill')}<span><b>Neu in Version ${APP_VERSION}:</b> ${CHANGES.filter(c => c.v > seenVersion).flatMap(c => c.items).slice(0, 3).map(esc).join(' · ')}</span><span class="sd-newact"><button class="sd-mini" data-a="whatsNew">Mehr</button><button class="sd-circ" data-a="seen" aria-label="Hinweis schließen">${icon('x')}</button></span></div>` : '';
const aboutCard = () => {
  const [cur, ...old] = CHANGES, list = items => `<ul class="sd-changes">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
  return `<div class="sd-card" id="about"><h2>Über SuperDaily</h2><div class="sd-version"><b>Version ${cur.v}</b><span>${fmtDate(cur.date)}</span></div><p>Neu in dieser Version:</p>${list(cur.items)}<details class="sd-arch"><summary>${icon('clock-counter-clockwise')}Frühere Versionen</summary>${old.map(c => `<div class="sd-oldv"><b>Version ${c.v}</b> <span>${fmtDate(c.date)}</span>${list(c.items)}</div>`).join('')}</details></div>`;
};
function tabMehr() {
  const fbMode = store.mode === 'firebase';
  return `<div class="sd-hdr"><div><div class="sd-sub">${fbMode ? 'Synchronisiert' : 'Lokaler Modus'}</div><h1>Einstellungen</h1></div></div>
  <div class="sd-card"><h2>Namen</h2><div class="sd-g2"><label class="sd-field">Person 1<input class="sd-input" value="${esc(data.names.a)}" data-ch="nameA"></label><label class="sd-field">Person 2<input class="sd-input" value="${esc(data.names.b)}" data-ch="nameB"></label></div></div>
  <div class="sd-card"><h2>Darstellung</h2><p>Automatisch folgt der Einstellung deines Handys.</p>${seg([['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']], modePref(), 'mode')}</div>
  ${fbMode ? `<div class="sd-card"><h2>Ich bin ${esc(data.names[ui.me])}</h2><p>Dieses Konto gehört fest zu ${esc(data.names[ui.me])}. Du siehst alles von ${esc(data.names[ui.me === 'a' ? 'b' : 'a'])}, abhaken und bearbeiten kannst du nur deine eigenen und die gemeinsamen Routinen.</p></div>`
      : `<div class="sd-card"><h2>Ich bin</h2><p>Mit dieser Person startet die App auf diesem Gerät.</p>${seg([['a', esc(data.names.a)], ['b', esc(data.names.b)]], ui.me, 'me')}</div>`}
  ${fbMode ? `<div class="sd-card"><h2>Haushalt</h2><p>Mit diesem Code tritt die zweite Person nach der Registrierung bei.</p><span class="sd-code">${esc(hhId)}</span><p>Angemeldet als ${esc(fb.auth.currentUser?.email)}</p><p>Nutzungsstatistik (Google Analytics): ${an ? 'aktiv' : 'aus'}</p><button class="sd-btn ghost" data-a="logout">${icon('sign-out')}Abmelden</button></div>`
      : `<div class="sd-card"><h2>Synchronisierung</h2><p>Die Daten liegen nur auf diesem Gerät. Für den Abgleich zwischen zwei Handys trägst du die Firebase-Konfiguration in firebase-config.js ein (siehe README).</p></div>`}
  <div class="sd-card"><h2>Daten</h2><p>Sicherung als JSON-Datei. Ein Import ersetzt alle Routinen und Erledigungen.</p><div class="sd-g2"><button class="sd-btn ghost" data-a="export">${icon('download-simple')}Export</button><label class="sd-btn ghost">${icon('upload-simple')}Import<input type="file" accept="application/json,.json" data-ch="import" hidden></label></div></div>
  ${aboutCard()}`;
}

function tabStatistik() {
  const days = ui.stat, s = -(days - 1), e = 0, P = ['a', 'b'], nm = p => esc(data.names[p]);
  const head = `<div class="sd-hdr"><div><div class="sd-sub">${fmtS(s)} – ${fmtS(e)}</div><h1>Statistik</h1></div></div>${seg([[7, '7 Tage'], [30, '30 Tage'], [90, '90 Tage']], days, 'stat')}`;
  if (!active().length && !T().length) return head + empty('', true);
  const tot = Object.fromEntries(P.map(p => [p, totals(p, s, e)]));
  const lead = tot.a.pct === tot.b.pct ? null : tot.a.pct > tot.b.pct ? 'a' : 'b';
  const duel = `<div class="sd-duel">${P.map(p => `<div class="sd-duelp ${p}"><div class="sd-ring" style="background:conic-gradient(var(--sd-${p}) ${tot[p].pct * 3.6}deg, var(--color-neutral-900) 0)"><div><b>${tot[p].pct}%</b><small>${tot[p].a} von ${tot[p].b}</small></div></div><span>${nm(p)}${lead === p ? ` <em>${icon('crown-simple', 'ph-fill')}vorne</em>` : ''}</span></div>`).join('')}</div>`;
  // Perfekte Tage: alles Geplante erledigt. Laufende Serie zählt heute erst, wenn heute schon perfekt ist.
  const perfect = p => {
    let cur = 0, best = 0, run = 0, count = 0, curDone = false;
    for (let o = 0; o >= MIN; o--) {
      const st = dayStats(p, o); if (!st.t) continue;
      const ok = st.pct === 100;
      if (o >= s && ok) count++;
      if (!curDone) { if (ok) cur++; else if (o < 0) curDone = true; }
      run = ok ? run + 1 : 0; best = Math.max(best, run);
    }
    return { cur, best, count };
  };
  const pf = Object.fromEntries(P.map(p => [p, perfect(p)]));
  const streaks = `<div class="sd-card"><h2>${icon('flame', 'ph-fill')} Perfekte Tage</h2><p>Tage, an denen alles Geplante erledigt war.</p><div class="sd-stgrid"><span></span><b>Im Zeitraum</b><b>Serie jetzt</b><b>Beste Serie</b>${P.map(p => `<span class="nm ${p}">${nm(p)}</span><span>${pf[p].count}</span><span>${pf[p].cur}</span><span>${pf[p].best}</span>`).join('')}</div></div>`;
  // Wochenverlauf: letzte 8 Wochen, laufende Woche bis heute
  const weeks = []; for (let w = 7; w >= 0; w--) { const m = mondayOf(0) - 7 * w; weeks.push({ m, v: P.map(p => { const t = totals(p, m, m + 6); return t.b ? t.pct : null; }) }); }
  const trend = `<div class="sd-card"><h2>Verlauf je Woche</h2><div class="sd-bars">${weeks.map(w => `<div class="col"><div class="pair">${w.v.map((v, i) => v === null ? '' : `<i class="${P[i]}" style="height:${Math.max(3, v)}%" title="${nm(P[i])}: ${v} %"></i>`).join('')}</div><small>KW ${isoWeek(dateAt(w.m))}</small></div>`).join('')}</div>${legend()}</div>`;
  // Wochentage im Zeitraum
  const wd = P.map(() => WD_ORDER.map(() => ({ n: 0, t: 0 })));
  for (let o = s; o <= e; o++) { const k = WD_ORDER.indexOf(dateAt(o).getDay()); P.forEach((p, i) => { const st = dayStats(p, o); wd[i][k].n += st.n; wd[i][k].t += st.t; }); }
  const pc = x => x.t ? Math.round(x.n / x.t * 100) : 0;
  const weekday = `<div class="sd-card"><h2>Nach Wochentag</h2><div class="sd-bars wd">${WD_ORDER.map((d, k) => `<div class="col"><div class="pair">${P.map((p, i) => wd[i][k].t ? `<i class="${p}" style="height:${Math.max(3, pc(wd[i][k]))}%" title="${nm(p)}: ${pc(wd[i][k])} %"></i>` : '').join('')}</div><small>${WD[d]}</small></div>`).join('')}</div>${legend()}</div>`;
  // Je Routine, schwächste zuerst
  const rows = R().map(r => ({ r, x: P.map(p => { const q = everVisible(r, p) ? rate(r, p, s, e) : null; return q && q.b ? q : null; }) })).filter(({ x }) => x.some(Boolean))
    .sort((u, v) => Math.min(...u.x.filter(Boolean).map(q => q.pct)) - Math.min(...v.x.filter(Boolean).map(q => q.pct)));
  const per = `<div class="sd-card"><h2>Je Routine</h2><p>Oben stehen die Routinen, die am häufigsten liegen bleiben.</p><div class="sd-rtab">${rows.map(({ r, x }) => `<div class="row"><span class="t">${esc(r.title)}</span>${x.map((q, i) => q ? `<span class="v ${P[i]}"><i style="width:${q.pct}%"></i><b>${q.pct}%</b></span>` : '<span class="v na">–</span>').join('')}</div>`).join('')}</div>${legend()}</div>`;
  const byCat = cats().map(c => {
    const rs = R().filter(r => catOf(r) === c.id);
    const x = P.map(p => { let a = 0, b = 0; rs.filter(r => everVisible(r, p)).forEach(r => { const q = rate(r, p, s, e); a += q.a; b += q.b; }); return b ? { a, b, pct: Math.round(a / b * 100) } : null; });
    return { c, x };
  }).filter(({ x }) => x.some(Boolean));
  const area = byCat.length ? `<div class="sd-card"><h2>Nach Bereich</h2><div class="sd-rtab">${byCat.map(({ c, x }) => `<div class="row"><span class="t sd-catt">${icon(c.icon)}${esc(c.name)}</span>${x.map((q, i) => q ? `<span class="v ${P[i]}"><i style="width:${q.pct}%"></i><b>${q.pct}%</b></span>` : '<span class="v na">–</span>').join('')}</div>`).join('')}</div>${legend()}</div>` : '';
  const tk = Object.fromEntries(P.map(p => {
    const mine = T().filter(t => taskFor(t, p)), inR = k => k && offOfKey(k) >= s && offOfKey(k) <= e;
    const done = mine.filter(t => t.done && inR(t.doneAt)), timed = done.filter(t => t.due);
    return [p, { done: done.length, ontime: timed.length ? Math.round(timed.filter(t => t.doneAt <= t.due).length / timed.length * 100) + '%' : '–', open: mine.filter(t => !t.done).length, late: mine.filter(t => !t.done && t.due && dueOff(t) < 0).length }];
  }));
  const given = (f, to) => T().filter(t => t.from === f && t.to === to && t.createdAt && offOf(new Date(t.createdAt)) >= s).length;
  const tasks = T().length ? `<div class="sd-card sd-tasks sd-tstat"><h2>${icon('check-square-offset', 'ph-fill')} Aufgaben</h2><p>Gemeinsame Aufgaben zählen bei beiden. „Pünktlich“: bis zum Fälligkeitstag erledigt.</p><div class="sd-stgrid c4"><span></span><b>Erledigt</b><b>Pünktlich</b><b>Offen</b><b>Über­fällig</b>${P.map(p => `<span class="nm ${p}">${nm(p)}</span><span>${tk[p].done}</span><span>${tk[p].ontime}</span><span>${tk[p].open}</span><span class="${tk[p].late ? 'late' : ''}">${tk[p].late}</span>`).join('')}</div><div class="sd-given"><span>Vergeben im Zeitraum</span><b>${nm('a')} → ${nm('b')}: ${given('a', 'b')}</b><b>${nm('b')} → ${nm('a')}: ${given('b', 'a')}</b><b>Gemeinsam: ${given('a', 's') + given('b', 's')}</b></div></div>` : '';
  return head + duel + tasks + streaks + trend + weekday + area + per;
}
const legend = () => `<div class="sd-leg">${['a', 'b'].map(p => `<span><i class="${p}"></i>${esc(data.names[p])}</span>`).join('')}</div>`;

// ---------- Routine-Formular ----------
function newDraft(r) {
  return r ? { ...JSON.parse(JSON.stringify(r)), cat: catById(catOf(r)) ? catOf(r) : null } : { id: null, title: '', slot: 'Morgen', who: syncMode() === 'firebase' ? ui.me : ui.person, cat: null, rep: { type: 'daily' } };
}
function sheetHtml() {
  const d = ui.sheet, x = d.rep, opt = (on, a, v, l) => `<button class="sd-opt ${on ? 'on' : ''}" data-a="${a}" data-v="${v}">${l}</button>`;
  const stepper = (field, val, min, max, label) => `<div class="sd-stepper"><button class="sd-circ" data-a="dStep" data-f="${field}" data-v="-1" ${val <= min ? 'disabled' : ''} aria-label="Weniger">${icon('minus')}</button><b>${val}</b><button class="sd-circ" data-a="dStep" data-f="${field}" data-v="1" ${val >= max ? 'disabled' : ''} aria-label="Mehr">${icon('plus')}</button><span>${label}</span></div>`;
  let extra = '';
  if (x.type === 'weekdays') extra = `<div class="sd-wds">${WD_ORDER.map(w => opt((x.days || []).includes(w), 'dDay', w, WD[w])).join('')}</div>`;
  if (x.type === 'every') extra = stepper('n', x.n, 2, 30, 'Tage Abstand, ab heute');
  if (x.type === 'monthly') extra = stepper('day', x.day, 1, 31, '. Tag im Monat');
  if (x.type === 'perweek') extra = stepper('n', x.n, 1, 6, 'mal pro Woche, Tage frei wählbar');
  const valid = d.title.trim() && (x.type !== 'weekdays' || (x.days || []).length);
  const changed = d.id && data.routines[d.id] && startOff(data.routines[d.id]) < 0 && (JSON.stringify(rep(data.routines[d.id])) !== JSON.stringify(x) || data.routines[d.id].who !== d.who);
  const enter = ui.sheetFresh ? 'enter' : ''; ui.sheetFresh = false;
  return `<div class="sd-back ${enter}" data-a="closeSheet"><div class="sd-sheet" data-a="noop">
  <div class="grip"></div><h3>${d.id ? 'Routine bearbeiten' : 'Neue Routine'}</h3>
  <input class="sd-input" value="${esc(d.title)}" placeholder="z. B. Zahnseide" data-in="dTitle" maxlength="80">
  ${!d.id && !d.title && tplChips('dTpl') ? `<div class="sd-field">Vorschläge<div class="sd-tpls">${tplChips('dTpl')}</div></div>` : ''}
  <div class="sd-field">Tageszeit<div class="sd-g3">${SLOTS.map(s => opt(d.slot === s, 'dSlot', s, s)).join('')}</div></div>
  <div class="sd-field">Bereich<div class="sd-chips">${cats().map(c => `<button class="sd-chip ${d.cat === c.id ? 'on' : ''}" data-a="dCat" data-v="${c.id}">${icon(c.icon)}${esc(c.name)}</button>`).join('')}<button class="sd-chip add" data-a="openCats">${icon('pencil-simple')}Bereiche</button></div></div>
  <div class="sd-field">Für wen<div class="sd-g2">${[['a', esc(data.names.a)], ['b', esc(data.names.b)], ['ab', 'Beide einzeln'], ['s', 'Gemeinsam']].filter(([k]) => canEdit({ who: k })).map(([k, l]) => opt(d.who === k, 'dWho', k, l)).join('')}</div></div>
  <div class="sd-field">Wiederholung<div class="sd-chips">${[['daily', 'Täglich'], ['weekdays', 'Wochentage'], ['every', 'Alle X Tage'], ['monthly', 'Monatlich'], ['perweek', 'X-mal pro Woche']].map(([k, l]) => `<button class="sd-chip ${x.type === k ? 'on' : ''}" data-a="dRep" data-v="${k}">${l}</button>`).join('')}</div>${extra}</div>
  ${changed ? `<div class="sd-hint">${icon('clock-counter-clockwise')}<span>Die Änderung gilt ab heute. Vergangene Tage bleiben so gewertet, wie sie geplant waren.</span></div>` : ''}
  <button class="sd-btn block" data-a="dSave" ${valid ? '' : 'disabled'}>${d.id ? 'Speichern' : 'Hinzufügen'}</button>
  ${d.id ? `<button class="sd-btn danger block" data-a="dArchive">${icon('archive')}Routine archivieren</button>` : ''}
  </div></div>`;
}

// ---------- Auth-Screens ----------
function loginHtml() {
  const reg = ui.authMode === 'register';
  return `<div class="sd-auth"><div class="sd-brand"><h1>SuperDaily</h1><p>Eure täglichen Routinen, gemeinsam abgehakt.</p></div>
  ${seg([['login', 'Anmelden'], ['register', 'Registrieren']], ui.authMode, 'authMode')}
  <form data-form="auth" style="display:flex;flex-direction:column;gap:14px">
  <label class="sd-field">E-Mail<input class="sd-input" type="email" name="email" autocomplete="email" required></label>
  <label class="sd-field">Passwort<input class="sd-input" type="password" name="pw" autocomplete="${reg ? 'new-password' : 'current-password'}" minlength="6" required></label>
  ${ui.authErr ? `<div class="sd-err">${esc(ui.authErr)}</div>` : ''}
  <button class="sd-btn block" type="submit" ${ui.busy ? 'disabled' : ''}>${reg ? 'Konto anlegen' : 'Anmelden'}</button>
  ${reg ? '' : '<button class="sd-btn danger block" type="button" data-a="resetPw">Passwort vergessen?</button>'}
  </form></div>`;
}
function setupHtml() {
  const s = ui.setup, who = seg([['a', esc(s.a || 'Person 1')], ['b', esc(s.b || 'Person 2')]], s.me, 'setupMe');
  return `<div class="sd-auth"><div class="sd-brand"><h1>Haushalt</h1><p>Einmal anlegen, die zweite Person tritt mit dem Code bei.</p></div>
  ${ui.setupErr ? `<div class="sd-err">${esc(ui.setupErr)}</div>` : ''}
  <div class="sd-card"><h2>Neuen Haushalt anlegen</h2><div class="sd-g2"><label class="sd-field">Person 1<input class="sd-input" value="${esc(s.a)}" data-in="setupA"></label><label class="sd-field">Person 2<input class="sd-input" value="${esc(s.b)}" data-in="setupB"></label></div><div class="sd-field">Ich bin${who}</div><button class="sd-btn block" data-a="createHH" ${ui.busy ? 'disabled' : ''}>Anlegen</button></div>
  <div class="sd-card"><h2>Mit Code beitreten</h2><p>Du bekommst automatisch die noch freie Person.</p><input class="sd-input" value="${esc(s.code)}" placeholder="z. B. K7Q2XM" data-in="setupCode" style="text-transform:uppercase;letter-spacing:.1em"><button class="sd-btn block" data-a="joinHH" ${ui.busy ? 'disabled' : ''}>Beitreten</button></div>
  <button class="sd-btn danger" data-a="logout">Abmelden</button></div>`;
}

// ---------- Hell / Dunkel ----------
// index.html setzt den Modus schon vor dem ersten Zeichnen; hier nur Umschalten und Systemwechsel.
const MODE_KEY = 'superdaily-mode';
const darkMQ = matchMedia('(prefers-color-scheme: dark)');
function modePref() { try { return localStorage.getItem(MODE_KEY) || 'auto'; } catch { return 'auto'; } }
function applyMode() {
  const m = modePref(), dark = m === 'dark' || (m === 'auto' && darkMQ.matches);
  document.documentElement.dataset.sd = dark ? 'dark' : 'light';
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0d1615' : '#f2f8f6');
}
darkMQ.addEventListener?.('change', applyMode);

// ---------- Render ----------
const $app = document.getElementById('app');
const TABS = [['heute', 'sun', 'Heute'], ['kalender', 'calendar-blank', 'Kalender'], ['aufgaben', 'check-square-offset', 'Aufgaben'], ['statistik', 'chart-bar', 'Statistik'], ['routinen', 'list-checks', 'Routinen'], ['mehr', 'gear-six', 'Mehr']];
const scrollMem = {}; let gridMem = { key: null, left: 0 };
function render() {
  const sc = $app.querySelector('.sd-scroll'); if (sc) scrollMem[sc.dataset.tab] = sc.scrollTop;
  const gs = $app.querySelector('.sd-gridscroll'); if (gs) gridMem = { key: gs.dataset.key, left: gs.scrollLeft };
  const focusCh = document.activeElement?.dataset?.in;
  if (ui.screen === 'loading') { $app.innerHTML = '<div class="sd-center"><span class="sd-muted">Lädt …</span></div>'; return; }
  if (ui.screen === 'error') { $app.innerHTML = `<div class="sd-auth"><div class="sd-err">${esc(ui.authErr)}</div></div>`; return; }
  if (ui.screen === 'login') { $app.innerHTML = loginHtml(); return; }
  if (ui.screen === 'setup') { $app.innerHTML = setupHtml(); return; }
  const tab = { heute: tabHeute, kalender: ui.calView === 'raster' ? tabRaster : tabKalender, aufgaben: tabAufgaben, statistik: tabStatistik, routinen: tabRoutinen, mehr: tabMehr }[ui.tab]();
  const fab = ui.tab === 'aufgaben' ? `<button class="sd-fab sd-tfab" data-a="newTask" aria-label="Aufgabe hinzufügen">${icon('plus')}</button>`
    : ['heute', 'routinen', 'kalender'].includes(ui.tab) ? `<button class="sd-fab" data-a="newRoutine" aria-label="Routine hinzufügen">${icon('plus')}</button>` : '';
  const badge = dueNow(ui.me).length;
  $app.innerHTML = `<main class="sd-scroll" data-tab="${ui.tab}">${tab}</main>${fab}<nav class="sd-tabs">${TABS.map(([k, i, l]) => `<button class="sd-tab ${ui.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${icon(i, ui.tab === k ? 'ph-fill' : 'ph')}<span>${l}</span>${k === 'aufgaben' && badge ? `<em class="sd-badge" aria-label="${badge} fällig">${badge}</em>` : ''}</button>`).join('')}</nav>${ui.sheet && !ui.catSheet ? sheetHtml() : ''}${ui.catSheet ? catSheetHtml() : ''}${ui.task ? taskSheetHtml() : ''}`;
  const nsc = $app.querySelector('.sd-scroll'); if (nsc) nsc.scrollTop = scrollMem[ui.tab] || 0;
  const ngs = $app.querySelector('.sd-gridscroll'); if (ngs) ngs.scrollLeft = ngs.dataset.key === gridMem.key ? gridMem.left : ngs.scrollWidth;
  if (focusCh) { const el = $app.querySelector(`[data-in="${focusCh}"]`); if (el) { el.focus(); el.setSelectionRange?.(el.value.length, el.value.length); } }
}

// ---------- Aktionen ----------
const A = {
  tab: d => { ui.tab = d.v; render(); track('screen_view', { firebase_screen: d.v }); },
  person: d => { ui.person = d.p; ui.duo = false; render(); },
  who: d => { ui.duo = d.v === 'duo'; if (!ui.duo) ui.person = d.v; render(); track('view_change', { view: ui.duo ? 'duo' : 'person' }); },
  stat: d => { ui.stat = +d.v; render(); track('stats_range', { days: +d.v }); },
  heuteView: d => { ui.heuteView = d.v; render(); track('view_change', { view: d.v }); },
  day: d => { ui.dayOff = +d.o; render(); },
  toggle: d => {
    const r = data.routines[d.r], p = d.p || ui.person, off = +d.o; if (!r || !canCheck(r, p, off)) return;
    const was = dayStats(p, off).pct;
    // Schlüssel nach der Einstellung an diesem Tag (z. B. früher gemeinsam, heute beide einzeln)
    store.toggle(dk(off), keyFor(r, p, off)).catch(fail);
    track(isDone(r, p, off) ? 'routine_check' : 'routine_uncheck', { slot: r.slot, for_person: p === 'b' ? 'person_2' : 'person_1', days_ago: -off, shared: r.who === 's' });
    if (!isDone(r, p, off)) return;
    $app.querySelector(`[data-a="toggle"][data-r="${r.id}"][data-o="${off}"]${d.p ? `[data-p="${p}"]` : ''}`)?.classList.add('pop');
    navigator.vibrate?.(12);
    if (was < 100 && dayStats(p, off).pct === 100) celebrate();
  },
  calView: d => { ui.calView = d.v; render(); },
  taskView: d => { ui.taskView = d.v; render(); },
  newTask: () => { ui.task = { id: null, title: '', note: '', to: ui.me === 'a' ? 'b' : 'a', due: dk(0) }; ui.sheetFresh = true; render(); },
  taskEdit: d => { const t = data.tasks[d.t]; if (!t) return; ui.task = { ...t }; ui.sheetFresh = true; render(); },
  taskToggle: d => {
    const t = data.tasks[d.t]; if (!t) return;
    store.saveTask(t.done ? { ...t, done: false, doneAt: null, doneBy: null } : { ...t, done: true, doneAt: dk(0), doneBy: ui.me }).catch(fail);
    if (!t.done) { $app.querySelector(`[data-a="taskToggle"][data-t="${t.id}"]`)?.closest('.sd-item')?.classList.add('pop'); navigator.vibrate?.(12); }
    track(t.done ? 'task_reopen' : 'task_done');
  },
  tTo: d => { ui.task.to = d.v; render(); },
  tDue: d => { ui.task.due = d.v || null; render(); },
  tSave: () => {
    const d = ui.task, title = d.title.trim(); if (!title) return;
    const old = d.id && data.tasks[d.id];
    const t = { id: d.id || rid(), title, note: (d.note || '').trim(), from: old?.from || ui.me, to: d.to, due: d.due || null, done: old?.done || false, doneAt: old?.doneAt || null, doneBy: old?.doneBy || null, createdAt: old?.createdAt || Date.now() };
    ui.task = null; store.saveTask(t).catch(fail);
    track(old ? 'task_edit' : 'task_create', { to: t.to === 's' ? 'shared' : t.to === ui.me ? 'self' : 'other', due: !!t.due });
  },
  tDelete: () => {
    const t = data.tasks[ui.task?.id]; if (!t) return;
    if (!confirm(`Aufgabe „${t.title}“ löschen?`)) return;
    ui.task = null; store.deleteTask(t.id).catch(fail); track('task_delete');
  },
  calMode: d => { ui.cal.mode = d.v; render(); },
  gridMode: d => { ui.grid.mode = d.v; render(); },
  calStep: d => { stepRange(ui.cal, +d.v); render(); },
  gridStep: d => { stepRange(ui.grid, +d.v); render(); },
  calPreset: d => { Object.assign(ui.cal, { from: -(+d.v - 1), to: 0 }); render(); },
  gridPreset: d => { Object.assign(ui.grid, { from: -(+d.v - 1), to: 0 }); render(); },
  calDay: d => { Object.assign(ui.cal, { mode: 'tag', anchor: +d.o }); render(); },
  newRoutine: () => { ui.sheet = newDraft(); ui.sheetFresh = true; render(); },
  edit: d => { if (!canEdit(data.routines[d.r])) return; ui.sheet = newDraft(data.routines[d.r]); ui.sheetFresh = true; render(); },
  closeSheet: () => { if (ui.catSheet && ui.sheet) { ui.catSheet = false; return render(); } ui.sheet = null; ui.catSheet = false; ui.task = null; render(); },
  noop: () => {},
  addTpl: d => { const [, title, slot, cat] = TPL[+d.v]; store.saveRoutine({ id: rid(), title, slot, who: ui.me, cat: tplCat(cat) || guessCat(title), rep: { type: 'daily' }, created: dk(0), createdAt: Date.now() }).catch(fail); track('routine_create', { slot, repeat: 'daily', who: ui.me, template: true }); },
  dTpl: d => { const [, title, slot, cat] = TPL[+d.v]; Object.assign(ui.sheet, { title, slot, cat: tplCat(cat) || ui.sheet.cat }); render(); },
  mode: d => { try { localStorage.setItem(MODE_KEY, d.v); } catch {} applyMode(); render(); },
  dSlot: d => { ui.sheet.slot = d.v; render(); },
  dWho: d => { ui.sheet.who = d.v; render(); },
  dRep: d => {
    const t = d.v, cur = ui.sheet.rep;
    ui.sheet.rep = t === 'weekdays' ? { type: t, days: cur.days || [1, 2, 3, 4, 5] } : t === 'every' ? { type: t, n: cur.n > 1 ? cur.n : 2 } : t === 'monthly' ? { type: t, day: cur.day || dateAt(0).getDate() } : t === 'perweek' ? { type: t, n: cur.type === 'perweek' ? cur.n : 3 } : { type: 'daily' };
    render();
  },
  dDay: d => { const w = +d.v, days = new Set(ui.sheet.rep.days || []); days.has(w) ? days.delete(w) : days.add(w); ui.sheet.rep.days = [...days]; render(); },
  dStep: d => { const x = ui.sheet.rep, lim = { n: x.type === 'perweek' ? [1, 6] : [2, 30], day: [1, 31] }[d.f]; x[d.f] = Math.max(lim[0], Math.min(lim[1], (x[d.f] || 1) + +d.v)); render(); },
  dSave: () => {
    const d = ui.sheet; if (!d.title.trim()) return;
    const old = d.id && data.routines[d.id];
    const r = { id: d.id || rid(), title: d.title.trim(), slot: d.slot, who: d.who, cat: d.cat || guessCat(d.title), rep: d.rep, created: old?.created || dk(0), createdAt: old?.createdAt || Date.now() };
    // „Alle X Tage“ zählt ab dem Tag, an dem es eingestellt wurde
    if (r.rep.type === 'every' && (!old || rep(old).type !== 'every' || rep(old).n !== r.rep.n)) r.rep = { ...r.rep, from: dk(0) };
    if (old) addVersion(r, old);
    ui.sheet = null; store.saveRoutine(r).catch(fail);
    track(old ? 'routine_edit' : 'routine_create', { slot: r.slot, repeat: r.rep.type, who: r.who });
  },
  dArchive: () => {
    const old = data.routines[ui.sheet.id]; if (!old) return;
    if (!confirm(`„${old.title}“ archivieren? Ab heute erscheint die Routine nicht mehr. Vergangene Tage bleiben in Kalender und Statistik erhalten; unter „Routinen → Archiviert“ kannst du sie wiederherstellen.`)) return;
    ui.sheet = null; store.saveRoutine(addVersion({ ...old, rep: { type: 'off' } }, old)).catch(fail); track('routine_archive');
  },
  restore: d => {
    const old = data.routines[d.r]; if (!old || !canEdit(old)) return;
    const prev = [...(old.hist || [])].reverse().find(h => h.rep?.type !== 'off')?.rep || { type: 'daily' };
    store.saveRoutine(addVersion({ ...old, rep: prev.type === 'every' ? { ...prev, from: dk(0) } : prev }, old)).catch(fail); track('routine_restore');
  },
  purge: d => {
    const r = data.routines[d.r]; if (!r || !canEdit(r)) return;
    if (!confirm(`„${r.title}“ endgültig löschen? Die Routine verschwindet auch aus Kalender und Statistik. Das lässt sich nicht rückgängig machen.`)) return;
    store.deleteRoutine(r.id).catch(fail); track('routine_delete');
  },
  dCat: d => { ui.sheet.cat = d.v; render(); },
  openCats: () => { ui.catSheet = true; ui.sheetFresh = !ui.sheet; render(); },
  closeCats: () => { ui.catSheet = false; render(); },
  catIcon: d => { const list = cats().map(c => c.id === d.id ? { ...c, icon: CAT_ICONS[(CAT_ICONS.indexOf(c.icon) + 1) % CAT_ICONS.length] } : c); store.setCats(list).catch(fail); },
  catAdd: () => {
    const el = $app.querySelector('[data-in="catNew"]'), name = (el?.value || '').trim().slice(0, 40); if (!name) return;
    if (cats().some(c => c.name.toLowerCase() === name.toLowerCase())) return alert(`Den Bereich „${name}“ gibt es schon.`);
    ui.catDraft = ''; store.setCats([...cats(), { id: rid(), name, icon: 'tag' }]).catch(fail); track('category_create');
  },
  catDel: d => {
    const list = cats(), c = list.find(x => x.id === d.id); if (!c) return;
    if (list.length <= 1) return alert('Mindestens ein Bereich muss bleiben.');
    const rest = list.filter(x => x.id !== c.id), target = rest.find(x => x.id === 'sonstiges') || rest[0];
    const used = R().filter(r => catOf(r) === c.id), mine = used.filter(canEdit), others = used.length - mine.length;
    if (!confirm(`Bereich „${c.name}“ entfernen?` + (mine.length ? ` ${mine.length} Routine(n) wechseln zu „${target.name}“.` : '') + (others ? ` ${others} Routine(n) der anderen Person stehen danach unter „Ohne Bereich“, bis sie sie neu zuordnet.` : ''))) return;
    if (ui.sheet?.cat === c.id) ui.sheet.cat = target.id;
    store.setCats(rest).catch(fail);
    mine.forEach(r => store.saveRoutine({ ...r, cat: target.id }).catch(fail));
    track('category_delete');
  },
  me: d => store.setMe(d.v),
  export: () => {
    const blob = new Blob([JSON.stringify({ app: 'SuperDaily', version: 1, exported: new Date().toISOString(), names: data.names, cats: cats(), routines: data.routines, done: data.done, tasks: data.tasks }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `superdaily-${dk(0)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  authMode: d => { ui.authMode = d.v; ui.authErr = ''; render(); },
  resetPw: async () => {
    const email = $app.querySelector('input[name=email]')?.value.trim();
    if (!email) { ui.authErr = 'Bitte zuerst die E-Mail eintragen.'; return render(); }
    try { await fb.A.sendPasswordResetEmail(fb.auth, email); ui.authErr = 'Link zum Zurücksetzen wurde verschickt.'; } catch (e) { ui.authErr = authMsg(e.code); }
    render();
  },
  setupMe: d => { ui.setup.me = d.v; render(); },
  createHH: async () => {
    const { F, db, auth } = fb, s = ui.setup; ui.busy = true; ui.setupErr = ''; render();
    try {
      const code = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
      await F.setDoc(F.doc(db, 'households', code), { members: [auth.currentUser.uid], roles: { [auth.currentUser.uid]: s.me }, names: { a: s.a.trim() || 'Person 1', b: s.b.trim() || 'Person 2' } });
      await F.setDoc(F.doc(db, 'users', auth.currentUser.uid), { hh: code, person: s.me });
      ui.busy = false; attach({ hh: code, person: s.me });
    } catch (e) { console.error(e); ui.busy = false; ui.setupErr = 'Anlegen fehlgeschlagen. Sind die Firestore-Regeln eingetragen?'; render(); }
  },
  joinHH: async () => {
    const { F, db, auth } = fb, s = ui.setup, code = s.code.trim().toUpperCase(); if (!code) return;
    ui.busy = true; ui.setupErr = ''; render();
    // Vor dem Beitritt darf man den Haushalt nicht lesen. Deshalb beide Personen probieren:
    // die Regeln lassen nur die noch freie zu.
    for (const me of ['a', 'b']) {
      try {
        await F.updateDoc(F.doc(db, 'households', code), { members: F.arrayUnion(auth.currentUser.uid), [`roles.${auth.currentUser.uid}`]: me });
      } catch { continue; }
      try {
        await F.setDoc(F.doc(db, 'users', auth.currentUser.uid), { hh: code, person: me });
        ui.busy = false; return attach({ hh: code, person: me });
      } catch (e) { console.error(e); break; }
    }
    ui.busy = false; ui.setupErr = 'Beitreten fehlgeschlagen. Stimmt der Code? Ein Haushalt hat Platz für zwei Personen; ist er schon voll, geht es nicht.'; render();
  },
  seen: () => { markSeen(); render(); },
  whatsNew: () => { markSeen(); ui.tab = 'mehr'; render(); requestAnimationFrame(() => $app.querySelector('#about')?.scrollIntoView({ block: 'start' })); },
  logout: () => fb && fb.A.signOut(fb.auth)
};
// Konfetti, wenn ein Tag komplett abgehakt ist. Liegt außerhalb von #app, damit render() es nicht entfernt.
function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'sd-confetti';
  const colors = ['#b5abfc', '#968ae0', '#e79ad6', '#8fd3e8', '#f3d27a'];
  for (let i = 0; i < 44; i++) {
    const c = document.createElement('i');
    c.style.cssText = `left:${50 + (Math.random() - .5) * 30}%;background:${colors[i % colors.length]};--x:${(Math.random() - .5) * 420}px;--y:${-180 - Math.random() * 320}px;--r:${Math.random() * 720 - 360}deg;animation-delay:${Math.random() * 120}ms`;
    box.appendChild(c);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 1900);
}
function fail(e) { console.error(e); alert('Speichern fehlgeschlagen: ' + (e.message || e)); }

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  if (el.getAttribute('type') === 'submit') return;
  const fn = A[el.dataset.a]; if (fn) { e.preventDefault(); fn(el.dataset, el); }
});
document.addEventListener('input', e => {
  const k = e.target.dataset?.in; if (!k) return; const v = e.target.value;
  if (k === 'dTitle') { ui.sheet.title = v; const b = $app.querySelector('[data-a="dSave"]'); if (b) b.disabled = !(v.trim() && (ui.sheet.rep.type !== 'weekdays' || ui.sheet.rep.days.length)); }
  if (k === 'catNew') ui.catDraft = v;
  if (k === 'tTitle') { ui.task.title = v; const b = $app.querySelector('[data-a="tSave"]'); if (b) b.disabled = !v.trim(); }
  if (k === 'tNote') ui.task.note = v;
  if (k === 'setupA') ui.setup.a = v;
  if (k === 'setupB') ui.setup.b = v;
  if (k === 'setupCode') ui.setup.code = v;
});
document.addEventListener('change', async e => {
  const k = e.target.dataset?.ch; if (!k) return; const v = e.target.value;
  const toOff = v => clamp(offOfKey(v));
  if (k === 'tDate') { ui.task.due = v || null; render(); }
  if (k === 'calFrom' && v) { ui.cal.from = toOff(v); render(); }
  if (k === 'calTo' && v) { ui.cal.to = toOff(v); render(); }
  if (k === 'gridFrom' && v) { ui.grid.from = toOff(v); render(); }
  if (k === 'gridTo' && v) { ui.grid.to = toOff(v); render(); }
  if (k === 'catName') {
    const name = v.trim().slice(0, 40), id = e.target.dataset.id;
    if (!name || cats().some(c => c.id !== id && c.name.toLowerCase() === name.toLowerCase())) return render();
    store.setCats(cats().map(c => c.id === id ? { ...c, name } : c)).catch(fail);
  }
  if (k === 'nameA' || k === 'nameB') { const n = { ...data.names, [k === 'nameA' ? 'a' : 'b']: v.trim() || (k === 'nameA' ? 'Person 1' : 'Person 2') }; store.setNames(n).catch(fail); }
  if (k === 'import') {
    const f = e.target.files[0]; if (!f) return;
    if (!confirm('Alle Routinen und Erledigungen durch den Inhalt der Datei ersetzen?')) return;
    try { const skipped = await store.importAll(JSON.parse(await f.text())); alert('Import abgeschlossen.' + (skipped ? ` ${skipped} Routine(n) der anderen Person wurden übersprungen; die kann sie selbst importieren.` : '')); } catch (err) { alert('Import fehlgeschlagen: ' + err.message); }
  }
});
document.addEventListener('submit', async e => {
  if (e.target.dataset.form !== 'auth') return; e.preventDefault();
  const fd = new FormData(e.target), email = fd.get('email').trim(), pw = fd.get('pw');
  ui.busy = true; ui.authErr = ''; render();
  try {
    if (ui.authMode === 'register') await fb.A.createUserWithEmailAndPassword(fb.auth, email, pw);
    else await fb.A.signInWithEmailAndPassword(fb.auth, email, pw);
  } catch (err) { ui.authErr = authMsg(err.code); }
  ui.busy = false; if (ui.screen === 'login') render();
});
// Tageswechsel um Mitternacht
let lastDay = dk(0);
setInterval(() => { if (dk(0) !== lastDay) { lastDay = dk(0); render(); } }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && dk(0) !== lastDay) { lastDay = dk(0); render(); } });

store.mode === 'firebase' ? initFirebase() : initLocal();
