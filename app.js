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

// ---------- Daten ----------
const data = { names: { a: 'Simon', b: 'Irina' }, routines: {}, done: {} };
const ui = {
  screen: 'loading', tab: 'heute', person: 'a', me: 'a',
  heuteView: 'liste', dayOff: 0,
  cal: { mode: 'monat', anchor: 0, from: -29, to: 0 },
  grid: { mode: 'woche', anchor: 0, from: -29, to: 0 },
  sheet: null, authMode: 'login', authErr: '', setupErr: '', busy: false,
  setup: { me: 'a', a: 'Simon', b: 'Irina', code: '' }
};

const R = () => Object.values(data.routines).sort((x, y) => SLOTS.indexOf(x.slot) - SLOTS.indexOf(y.slot) || (x.createdAt || 0) - (y.createdAt || 0));
const visible = (r, p) => r.who === 's' || r.who === 'ab' || r.who === p;
const keyFor = (r, p) => (r.who === 's' ? 's' : p) + '|' + r.id;
const isDone = (r, p, off) => !!(data.done[dk(off)] || {})[keyFor(r, p)];
const startOff = r => offOfKey(r.created || dk(0));
const rep = r => r.rep || { type: 'daily' };
function weekDone(r, p, off, exclude) { const m = mondayOf(off); let n = 0; for (let o = m; o < m + 7; o++) { if (o !== exclude && isDone(r, p, o)) n++; } return n; }
function isDue(r, p, off) {
  if (off < startOff(r)) return false;
  const d = dateAt(off), x = rep(r);
  switch (x.type) {
    case 'weekdays': return (x.days || []).includes(d.getDay());
    case 'every': return (off - startOff(r)) % Math.max(1, x.n || 1) === 0;
    case 'monthly': { const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); return d.getDate() === Math.min(x.day || 1, last); }
    case 'perweek': return weekDone(r, p, off, off) < (x.n || 1);
    default: return true;
  }
}
const shows = (r, p, off) => visible(r, p) && (isDue(r, p, off) || isDone(r, p, off));
function dayStats(p, off) { const list = R().filter(r => shows(r, p, off)); const n = list.filter(r => isDone(r, p, off)).length; return { list, n, t: list.length, pct: list.length ? Math.round(n / list.length * 100) : 0 }; }
function rate(r, p, s, e) {
  const last = Math.min(e, 0), st = startOff(r); let a = 0, b = 0;
  if (rep(r).type === 'perweek') {
    for (let m = mondayOf(s); m <= last; m += 7) {
      let days = 0, dn = 0;
      for (let o = Math.max(m, s, st); o <= Math.min(m + 6, last); o++) { days++; if (isDone(r, p, o)) dn++; }
      if (!days) continue; const need = Math.min(rep(r).n || 1, days); b += need; a += Math.min(dn, need);
    }
  } else {
    for (let o = Math.max(s, st, MIN); o <= last; o++) if (isDue(r, p, o)) { b++; if (isDone(r, p, o)) a++; }
  }
  return { a, b, pct: b ? Math.round(a / b * 100) : 0 };
}
function streak(r, p, off) {
  if (rep(r).type === 'perweek') return 0;
  let n = 0, o = isDone(r, p, off) ? off : off - 1;
  for (let i = 0; i < 400 && o >= startOff(r); o--, i++) { if (!isDue(r, p, o)) continue; if (isDone(r, p, o)) n++; else break; }
  return n;
}
function repLabel(r) {
  const x = rep(r);
  switch (x.type) {
    case 'weekdays': return WD_ORDER.filter(d => (x.days || []).includes(d)).map(d => WD[d]).join(', ') || 'Keine Tage';
    case 'every': return x.n === 1 ? 'Täglich' : `Alle ${x.n} Tage`;
    case 'monthly': return `Monatlich am ${x.day}.`;
    case 'perweek': return `${x.n}× pro Woche`;
    default: return 'Täglich';
  }
}
const whoLabel = r => r.who === 's' ? 'Gemeinsam' : r.who === 'ab' ? 'Beide' : data.names[r.who];

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
    const { F, db } = fb;
    await F.setDoc(F.doc(db, 'households', hhId, 'days', date), { [key]: val ? true : F.deleteField() }, { merge: true });
  },
  async saveRoutine(r) {
    data.routines = { ...data.routines, [r.id]: r }; render();
    if (this.mode === 'local') return this.saveLocal();
    const { F, db } = fb; await F.updateDoc(F.doc(db, 'households', hhId), { [`routines.${r.id}`]: r });
  },
  async deleteRoutine(id) {
    const n = { ...data.routines }; delete n[id]; data.routines = n; render();
    if (this.mode === 'local') return this.saveLocal();
    const { F, db } = fb; await F.updateDoc(F.doc(db, 'households', hhId), { [`routines.${id}`]: F.deleteField() });
  },
  async setNames(names) {
    data.names = names; render();
    if (this.mode === 'local') return this.saveLocal();
    const { F, db } = fb; await F.updateDoc(F.doc(db, 'households', hhId), { names });
  },
  async setMe(p) {
    ui.me = p; ui.person = p; render();
    if (this.mode === 'local') return this.saveLocal();
    const { F, db, auth } = fb; await F.setDoc(F.doc(db, 'users', auth.currentUser.uid), { person: p }, { merge: true });
  },
  async importAll(obj) {
    if (!obj || typeof obj !== 'object' || !obj.routines) throw new Error('Ungültige Datei');
    if (this.mode === 'local') { Object.assign(data, { names: obj.names || data.names, routines: obj.routines, done: obj.done || {} }); this.saveLocal(); return render(); }
    const { F, db } = fb;
    await F.updateDoc(F.doc(db, 'households', hhId), { routines: obj.routines, names: obj.names || data.names });
    const entries = Object.entries(obj.done || {});
    for (let i = 0; i < entries.length; i += 400) {
      const batch = F.writeBatch(db);
      entries.slice(i, i + 400).forEach(([d, v]) => batch.set(F.doc(db, 'households', hhId, 'days', d), v));
      await batch.commit();
    }
  }
};

function initLocal() {
  try { const s = JSON.parse(localStorage.getItem(LS) || 'null'); if (s) { data.names = s.names || data.names; data.routines = s.routines || {}; data.done = s.done || {}; ui.me = ui.person = s.me || 'a'; } } catch {}
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
function attach(u) {
  const { F, db } = fb; hhId = u.hh; ui.me = ui.person = u.person || 'a';
  unsubs.push(F.onSnapshot(F.doc(db, 'households', hhId), s => {
    const d = s.data() || {}; data.names = d.names || data.names; data.routines = d.routines || {}; ui.screen = 'app'; render();
  }, err => { console.error(err); ui.screen = 'setup'; ui.setupErr = 'Kein Zugriff auf den Haushalt. Code prüfen oder neu beitreten.'; render(); }));
  unsubs.push(F.onSnapshot(F.collection(db, 'households', hhId, 'days'), qs => {
    const done = {}; qs.forEach(d => { done[d.id] = d.data(); }); data.done = done; render();
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
function totals(p, s, e) { let a = 0, b = 0; R().filter(r => visible(r, p)).forEach(r => { const x = rate(r, p, s, e); a += x.a; b += x.b; }); return { a, b, pct: b ? Math.round(a / b * 100) : 0 }; }

// ---------- Bausteine ----------
const icon = (n, cls = 'ph') => `<i class="${cls} ph-${n}"></i>`;
const initial = p => esc((data.names[p] || '?')[0].toUpperCase());
const personDots = () => `<div class="sd-dots">${['a', 'b'].map(p => `<button class="sd-dot ${ui.person === p ? 'on' : ''}" data-a="person" data-p="${p}" aria-label="${esc(data.names[p])}">${initial(p)}</button>`).join('')}</div>`;
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
  const hi = off !== 0 ? fmtLong(off) : h < 11 ? `Guten Morgen, ${name}` : h < 18 ? `Hallo, ${name}` : `Guten Abend, ${name}`;
  const left = st.t - st.n;
  const msg = !st.t ? 'Heute ist nichts geplant.' : !left ? 'Alles erledigt. Stark!' : st.n === 0 ? `${left} ${left === 1 ? 'Routine wartet' : 'Routinen warten'} auf dich.` : `Noch ${left}, du bist auf einem guten Weg.`;
  return `<div class="sd-hero ${st.t && !left ? 'full' : ''}"><div class="sd-hring" style="--p:${st.pct}"><div><b>${st.pct}<small>%</small></b></div></div><div class="sd-htxt"><span class="sd-hhi">${hi}</span><b>${st.n} von ${st.t} erledigt</b><span>${msg}</span></div></div>`;
}
// Vorlagen für den schnellen Start: [Icon, Titel, Tageszeit]
const TPL = [['drop', 'Glas Wasser nach dem Aufstehen', 'Morgen'], ['pill', 'Vitamine nehmen', 'Morgen'], ['person-simple-tai-chi', '5 Minuten dehnen', 'Morgen'], ['sneaker-move', '10 Minuten spazieren', 'Tagsüber'], ['book-open', '20 Seiten lesen', 'Abend'], ['tooth', 'Zahnseide', 'Abend']];
const tplChips = action => TPL.map(([i, t], k) => Object.values(data.routines).some(r => r.title === t) ? '' : `<button class="sd-tpl" data-a="${action}" data-v="${k}">${icon(i)}${t}</button>`).join('');
const empty = (txt, btn) => btn
  ? `<div class="sd-welcome"><span class="ico">${icon('plant', 'ph-fill')}</span><h2>Willkommen bei SuperDaily</h2><p>Tippe eine Vorlage an, um direkt loszulegen, oder lege eine eigene Routine an.</p><div class="sd-tpls">${tplChips('addTpl')}</div><button class="sd-btn block" data-a="newRoutine">${icon('plus')}Eigene Routine anlegen</button></div>`
  : `<div class="sd-empty"><span>${txt}</span></div>`;

function listView(p, off) {
  const st = dayStats(p, off);
  if (!R().length) return empty('Noch keine Routinen. Leg die erste an, zum Beispiel „Glas Wasser nach dem Aufstehen“.', true);
  if (!st.t) return empty('An diesem Tag ist nichts geplant.');
  return SLOTS.map(slot => {
    const items = st.list.filter(r => r.slot === slot); if (!items.length) return '';
    return `<div class="sd-group"><span class="sd-label">${slot}</span>${items.map(r => {
      const dn = isDone(r, p, off), sk = streak(r, p, off), x = rep(r);
      let meta = repLabel(r) + (r.who === 's' ? ' · gemeinsam' : '');
      if (x.type === 'perweek') meta += ` · ${weekDone(r, p, off, null)}/${x.n} diese Woche`;
      return `<button class="sd-item ${dn ? 'done' : ''}" data-a="toggle" data-r="${r.id}" data-o="${off}"><span class="sd-check">${icon('check', 'ph-bold')}</span><span class="txt"><span class="t">${esc(r.title)}</span><span class="m">${meta}</span></span>${sk > 1 ? `<span class="sd-streak">${icon('flame')}${sk}</span>` : ''}</button>`;
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
  if (!R().length) tiles = empty('Noch keine Routinen.', true);
  else if (!st.t) tiles = empty('An diesem Tag ist nichts geplant.');
  else tiles = `<div class="sd-tiles">${st.list.map(r => {
    const dn = isDone(r, p, off), sk = streak(r, p, off);
    const meta = [r.who === 's' ? 'Gemeinsam' : '', sk > 1 ? sk + ' Tage in Folge' : '', rep(r).type === 'perweek' ? `${weekDone(r, p, off, null)}/${rep(r).n} diese Woche` : ''].filter(Boolean).join(' · ');
    return `<button class="sd-tile ${dn ? 'done' : ''}" data-a="toggle" data-r="${r.id}" data-o="${off}"><div class="top"><span>${r.slot}</span><span class="sd-check">${icon('check', 'ph-bold')}</span></div><span class="t">${esc(r.title)}</span><span class="m">${meta}</span></button>`;
  }).join('')}</div>`;
  return `<div class="sd-rings">${rings}</div><div class="sd-hdr" style="align-items:baseline"><span style="font-size:15px;font-weight:500">${off === 0 ? 'Heute dran' : 'An diesem Tag'}</span><span class="sd-muted">${st.t - st.n ? (st.t - st.n) + ' offen' : st.t ? 'Alles erledigt' : ''}</span></div>${tiles}`;
}
function matrixView(p, s, e, withRate) {
  const vis = R().filter(r => visible(r, p));
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
      const can = !fut && (due || dn);
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
    cells += `<button class="${ok ? 'ok' : inR ? 'in' : ''} ${o === 0 ? 'today' : ''}" ${ok ? `data-a="calDay" data-o="${o}" style="background:color-mix(in srgb, var(--color-accent) ${Math.round(8 + pct * .62)}%, var(--color-surface))"` : 'tabindex="-1"'} aria-label="${dk(o)}${ok ? ' ' + pct + ' %' : ''}">${label}</button>`;
  }
  const rates = R().filter(r => visible(r, p)).map(r => ({ r, x: rate(r, p, s, e) })).sort((a, b) => b.x.pct - a.x.pct)
    .map(({ r, x }) => `<div class="sd-rate"><div class="row"><span>${esc(r.title)}</span><span>${x.a} / ${x.b} · ${x.pct} %</span></div><div class="sd-track"><div style="width:${x.pct}%"></div></div></div>`).join('');
  return `<div style="display:flex;flex-direction:column;gap:6px"><div class="sd-cal">${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(w => `<span>${w}</span>`).join('')}</div><div class="sd-cal">${cells}</div><div class="sd-legend" style="padding-top:4px"><span>0 %</span><i></i><span>100 %</span></div></div>${rates ? `<div class="sd-group" style="gap:12px"><span class="sd-label">Je Routine</span>${rates}</div>` : ''}`;
}

// ---------- Tabs ----------
function tabHeute() {
  const off = ui.dayOff, p = ui.person, st = dayStats(p, off);
  const title = off === 0 ? 'Heute' : off === -1 ? 'Gestern' : dateAt(off).toLocaleDateString('de-DE', { weekday: 'long' });
  const end = off < -6 ? off + 3 : 0; const days = [];
  for (let o = end - 6; o <= end; o++) days.push(o);
  const strip = `<div class="sd-strip">${days.map(o => `<button class="${o === off ? 'on' : ''}" data-a="day" data-o="${o}"><small>${WD[dateAt(o).getDay()]}</small><b>${dateAt(o).getDate()}</b><i class="bar"><i style="width:${dayStats(p, o).pct}%"></i></i></button>`).join('')}</div>`;
  const body = ui.heuteView === 'liste' ? `${R().length ? hero(st, off) : ''}${listView(p, off)}` : tilesView(p, off);
  return `<div class="sd-hdr"><div><div class="sd-sub">${fmtLong(off)}</div><h1>${title}</h1></div>${personDots()}</div>
  ${seg([['liste', icon('list') + 'Liste'], ['kacheln', icon('squares-four') + 'Kacheln']], ui.heuteView, 'heuteView')}
  ${strip}${body}`;
}
function tabKalender() {
  const m = ui.cal, p = ui.person, { s, e, title, sub } = rangeOf(m), tot = totals(p, s, e);
  let body;
  if (m.mode === 'tag') { const st = dayStats(p, s); body = prog(`${st.n} von ${st.t} erledigt`, st.pct) + listView(p, s); }
  else { body = prog(`${tot.a} von ${tot.b} Erledigungen`, tot.pct) + (m.mode === 'woche' ? matrixView(p, s, e, false) : calendarView(p, s, e, m.mode === 'zeitraum')); }
  return `<div class="sd-hdr"><div><div class="sd-sub">${sub}</div><h1>${title}</h1></div>${personDots()}</div>${rangeControls(m, 'cal')}${body}`;
}
function tabRaster() {
  const m = ui.grid, p = ui.person, { s, e, title, sub } = rangeOf(m), tot = totals(p, s, e);
  return `<div class="sd-hdr"><div><div class="sd-sub">${sub}</div><h1>${title}</h1></div><div class="sd-big"><b>${tot.pct}%</b><span>${tot.a} von ${tot.b} erfüllt</span></div></div>${rangeControls(m, 'grid')}${personSeg()}${matrixView(p, s, e, true)}`;
}
function tabRoutinen() {
  const all = R();
  const body = !all.length ? empty('Noch keine Routinen.', true) : SLOTS.map(slot => {
    const items = all.filter(r => r.slot === slot); if (!items.length) return '';
    return `<div class="sd-group"><span class="sd-label">${slot}</span>${items.map(r => `<button class="sd-row" data-a="edit" data-r="${r.id}"><span class="txt"><span class="t">${esc(r.title)}</span><span class="m">${repLabel(r)}</span></span><span class="sd-who ${r.who === 's' ? 's' : ''}">${esc(whoLabel(r))}</span>${icon('caret-right')}</button>`).join('')}</div>`;
  }).join('');
  return `<div class="sd-hdr"><div><div class="sd-sub">${all.length} ${all.length === 1 ? 'Routine' : 'Routinen'}</div><h1>Routinen</h1></div></div>${body}`;
}
function tabMehr() {
  const fbMode = store.mode === 'firebase';
  return `<div class="sd-hdr"><div><div class="sd-sub">${fbMode ? 'Synchronisiert' : 'Lokaler Modus'}</div><h1>Einstellungen</h1></div></div>
  <div class="sd-card"><h2>Namen</h2><div class="sd-g2"><label class="sd-field">Person 1<input class="sd-input" value="${esc(data.names.a)}" data-ch="nameA"></label><label class="sd-field">Person 2<input class="sd-input" value="${esc(data.names.b)}" data-ch="nameB"></label></div></div>
  <div class="sd-card"><h2>Darstellung</h2><p>Automatisch folgt der Einstellung deines Handys.</p>${seg([['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']], modePref(), 'mode')}</div>
  <div class="sd-card"><h2>Ich bin</h2><p>Mit dieser Person startet die App auf diesem ${fbMode ? 'Konto' : 'Gerät'}.</p>${seg([['a', esc(data.names.a)], ['b', esc(data.names.b)]], ui.me, 'me')}</div>
  ${fbMode ? `<div class="sd-card"><h2>Haushalt</h2><p>Mit diesem Code tritt die zweite Person nach der Registrierung bei.</p><span class="sd-code">${esc(hhId)}</span><p>Angemeldet als ${esc(fb.auth.currentUser?.email)}</p><button class="sd-btn ghost" data-a="logout">${icon('sign-out')}Abmelden</button></div>`
      : `<div class="sd-card"><h2>Synchronisierung</h2><p>Die Daten liegen nur auf diesem Gerät. Für den Abgleich zwischen zwei Handys trägst du die Firebase-Konfiguration in firebase-config.js ein (siehe README).</p></div>`}
  <div class="sd-card"><h2>Daten</h2><p>Sicherung als JSON-Datei. Ein Import ersetzt alle Routinen und Erledigungen.</p><div class="sd-g2"><button class="sd-btn ghost" data-a="export">${icon('download-simple')}Export</button><label class="sd-btn ghost">${icon('upload-simple')}Import<input type="file" accept="application/json,.json" data-ch="import" hidden></label></div></div>`;
}

// ---------- Routine-Formular ----------
function newDraft(r) {
  return r ? JSON.parse(JSON.stringify(r)) : { id: null, title: '', slot: 'Morgen', who: ui.person, rep: { type: 'daily' } };
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
  const enter = ui.sheetFresh ? 'enter' : ''; ui.sheetFresh = false;
  return `<div class="sd-back ${enter}" data-a="closeSheet"><div class="sd-sheet" data-a="noop">
  <div class="grip"></div><h3>${d.id ? 'Routine bearbeiten' : 'Neue Routine'}</h3>
  <input class="sd-input" value="${esc(d.title)}" placeholder="z. B. Zahnseide" data-in="dTitle" maxlength="80">
  ${!d.id && !d.title && tplChips('dTpl') ? `<div class="sd-field">Vorschläge<div class="sd-tpls">${tplChips('dTpl')}</div></div>` : ''}
  <div class="sd-field">Tageszeit<div class="sd-g3">${SLOTS.map(s => opt(d.slot === s, 'dSlot', s, s)).join('')}</div></div>
  <div class="sd-field">Für wen<div class="sd-g2">${[['a', esc(data.names.a)], ['b', esc(data.names.b)], ['ab', 'Beide einzeln'], ['s', 'Gemeinsam']].map(([k, l]) => opt(d.who === k, 'dWho', k, l)).join('')}</div></div>
  <div class="sd-field">Wiederholung<div class="sd-chips">${[['daily', 'Täglich'], ['weekdays', 'Wochentage'], ['every', 'Alle X Tage'], ['monthly', 'Monatlich'], ['perweek', 'X-mal pro Woche']].map(([k, l]) => `<button class="sd-chip ${x.type === k ? 'on' : ''}" data-a="dRep" data-v="${k}">${l}</button>`).join('')}</div>${extra}</div>
  <button class="sd-btn block" data-a="dSave" ${valid ? '' : 'disabled'}>${d.id ? 'Speichern' : 'Hinzufügen'}</button>
  ${d.id ? `<button class="sd-btn danger block" data-a="dDelete">${icon('trash')}Routine löschen</button>` : ''}
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
  <div class="sd-card"><h2>Mit Code beitreten</h2><input class="sd-input" value="${esc(s.code)}" placeholder="z. B. K7Q2XM" data-in="setupCode" style="text-transform:uppercase;letter-spacing:.1em"><div class="sd-field">Ich bin${who}</div><button class="sd-btn block" data-a="joinHH" ${ui.busy ? 'disabled' : ''}>Beitreten</button></div>
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
const TABS = [['heute', 'sun', 'Heute'], ['kalender', 'calendar-blank', 'Kalender'], ['raster', 'grid-four', 'Raster'], ['routinen', 'list-checks', 'Routinen'], ['mehr', 'gear-six', 'Mehr']];
const scrollMem = {}; let gridMem = { key: null, left: 0 };
function render() {
  const sc = $app.querySelector('.sd-scroll'); if (sc) scrollMem[sc.dataset.tab] = sc.scrollTop;
  const gs = $app.querySelector('.sd-gridscroll'); if (gs) gridMem = { key: gs.dataset.key, left: gs.scrollLeft };
  const focusCh = document.activeElement?.dataset?.in;
  if (ui.screen === 'loading') { $app.innerHTML = '<div class="sd-center"><span class="sd-muted">Lädt …</span></div>'; return; }
  if (ui.screen === 'error') { $app.innerHTML = `<div class="sd-auth"><div class="sd-err">${esc(ui.authErr)}</div></div>`; return; }
  if (ui.screen === 'login') { $app.innerHTML = loginHtml(); return; }
  if (ui.screen === 'setup') { $app.innerHTML = setupHtml(); return; }
  const tab = { heute: tabHeute, kalender: tabKalender, raster: tabRaster, routinen: tabRoutinen, mehr: tabMehr }[ui.tab]();
  const fab = ['heute', 'routinen', 'kalender'].includes(ui.tab) ? `<button class="sd-fab" data-a="newRoutine" aria-label="Routine hinzufügen">${icon('plus')}</button>` : '';
  $app.innerHTML = `<main class="sd-scroll" data-tab="${ui.tab}">${tab}</main>${fab}<nav class="sd-tabs">${TABS.map(([k, i, l]) => `<button class="sd-tab ${ui.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${icon(i, ui.tab === k ? 'ph-fill' : 'ph')}<span>${l}</span></button>`).join('')}</nav>${ui.sheet ? sheetHtml() : ''}`;
  const nsc = $app.querySelector('.sd-scroll'); if (nsc) nsc.scrollTop = scrollMem[ui.tab] || 0;
  const ngs = $app.querySelector('.sd-gridscroll'); if (ngs) ngs.scrollLeft = ngs.dataset.key === gridMem.key ? gridMem.left : ngs.scrollWidth;
  if (focusCh) { const el = $app.querySelector(`[data-in="${focusCh}"]`); if (el) { el.focus(); el.setSelectionRange?.(el.value.length, el.value.length); } }
}

// ---------- Aktionen ----------
const A = {
  tab: d => { ui.tab = d.v; render(); },
  person: d => { ui.person = d.p; render(); },
  heuteView: d => { ui.heuteView = d.v; render(); },
  day: d => { ui.dayOff = +d.o; render(); },
  toggle: d => {
    const r = data.routines[d.r]; if (!r) return;
    const p = ui.person, off = +d.o, was = dayStats(p, off).pct;
    store.toggle(dk(off), keyFor(r, p)).catch(fail);
    if (!isDone(r, p, off)) return;
    $app.querySelector(`[data-a="toggle"][data-r="${r.id}"][data-o="${off}"]`)?.classList.add('pop');
    navigator.vibrate?.(12);
    if (was < 100 && dayStats(p, off).pct === 100) celebrate();
  },
  calMode: d => { ui.cal.mode = d.v; render(); },
  gridMode: d => { ui.grid.mode = d.v; render(); },
  calStep: d => { stepRange(ui.cal, +d.v); render(); },
  gridStep: d => { stepRange(ui.grid, +d.v); render(); },
  calPreset: d => { Object.assign(ui.cal, { from: -(+d.v - 1), to: 0 }); render(); },
  gridPreset: d => { Object.assign(ui.grid, { from: -(+d.v - 1), to: 0 }); render(); },
  calDay: d => { Object.assign(ui.cal, { mode: 'tag', anchor: +d.o }); render(); },
  newRoutine: () => { ui.sheet = newDraft(); ui.sheetFresh = true; render(); },
  edit: d => { ui.sheet = newDraft(data.routines[d.r]); ui.sheetFresh = true; render(); },
  closeSheet: () => { ui.sheet = null; render(); },
  noop: () => {},
  addTpl: d => { const [, title, slot] = TPL[+d.v]; store.saveRoutine({ id: rid(), title, slot, who: ui.person, rep: { type: 'daily' }, created: dk(0), createdAt: Date.now() }).catch(fail); },
  dTpl: d => { const [, title, slot] = TPL[+d.v]; Object.assign(ui.sheet, { title, slot }); render(); },
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
    const r = { id: d.id || rid(), title: d.title.trim(), slot: d.slot, who: d.who, rep: d.rep, created: old?.created || dk(0), createdAt: old?.createdAt || Date.now() };
    if (old && rep(old).type !== 'every' && r.rep.type === 'every') r.created = dk(0);
    ui.sheet = null; store.saveRoutine(r).catch(fail);
  },
  dDelete: () => { const d = ui.sheet; if (!confirm(`„${d.title}“ löschen? Die bisherigen Haken bleiben in der Sicherung, werden aber nicht mehr angezeigt.`)) return; ui.sheet = null; store.deleteRoutine(d.id).catch(fail); },
  me: d => store.setMe(d.v).catch(fail),
  export: () => {
    const blob = new Blob([JSON.stringify({ app: 'SuperDaily', version: 1, exported: new Date().toISOString(), names: data.names, routines: data.routines, done: data.done }, null, 2)], { type: 'application/json' });
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
      await F.setDoc(F.doc(db, 'households', code), { members: [auth.currentUser.uid], names: { a: s.a.trim() || 'Person 1', b: s.b.trim() || 'Person 2' }, routines: {}, created: F.serverTimestamp() });
      await F.setDoc(F.doc(db, 'users', auth.currentUser.uid), { hh: code, person: s.me });
      ui.busy = false; attach({ hh: code, person: s.me });
    } catch (e) { console.error(e); ui.busy = false; ui.setupErr = 'Anlegen fehlgeschlagen. Sind die Firestore-Regeln eingetragen?'; render(); }
  },
  joinHH: async () => {
    const { F, db, auth } = fb, s = ui.setup, code = s.code.trim().toUpperCase(); if (!code) return;
    ui.busy = true; ui.setupErr = ''; render();
    try {
      await F.updateDoc(F.doc(db, 'households', code), { members: F.arrayUnion(auth.currentUser.uid) });
      await F.setDoc(F.doc(db, 'users', auth.currentUser.uid), { hh: code, person: s.me });
      ui.busy = false; attach({ hh: code, person: s.me });
    } catch (e) { console.error(e); ui.busy = false; ui.setupErr = 'Beitreten fehlgeschlagen. Stimmt der Code?'; render(); }
  },
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
  if (k === 'setupA') ui.setup.a = v;
  if (k === 'setupB') ui.setup.b = v;
  if (k === 'setupCode') ui.setup.code = v;
});
document.addEventListener('change', async e => {
  const k = e.target.dataset?.ch; if (!k) return; const v = e.target.value;
  const toOff = v => clamp(offOfKey(v));
  if (k === 'calFrom' && v) { ui.cal.from = toOff(v); render(); }
  if (k === 'calTo' && v) { ui.cal.to = toOff(v); render(); }
  if (k === 'gridFrom' && v) { ui.grid.from = toOff(v); render(); }
  if (k === 'gridTo' && v) { ui.grid.to = toOff(v); render(); }
  if (k === 'nameA' || k === 'nameB') { const n = { ...data.names, [k === 'nameA' ? 'a' : 'b']: v.trim() || (k === 'nameA' ? 'Person 1' : 'Person 2') }; store.setNames(n).catch(fail); }
  if (k === 'import') {
    const f = e.target.files[0]; if (!f) return;
    if (!confirm('Alle Routinen und Erledigungen durch den Inhalt der Datei ersetzen?')) return;
    try { await store.importAll(JSON.parse(await f.text())); alert('Import abgeschlossen.'); } catch (err) { alert('Import fehlgeschlagen: ' + err.message); }
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
