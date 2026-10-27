// Screenshots aller Screens und des Schritt-für-Schritt-Ablaufs (iPhone-Format 390 × 844, doppelte Auflösung).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const seed = require('./seed');
const { SCREENS, FLOW_STEPS } = require('../screens');

const VIEW = { width: 390, height: 844 };
// Warten, bis Einblendungen (z. B. Formular von unten) fertig sind
// und nichts seitlich verschoben ist (das Raster scrollt absichtlich seitlich und bleibt, wie es ist)
const settle = async p => {
  await p.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations !== Infinity).map(a => a.finished)), new Promise(r => setTimeout(r, 3000))])).catch(() => {});
  await p.evaluate(() => { window.scrollTo(0, window.scrollY); document.querySelectorAll('*').forEach(e => { if (e.scrollLeft && !e.classList.contains('sd-gridscroll')) e.scrollLeft = 0; }); });
  await p.waitForTimeout(250);
};

function helpers(p) {
  const ev = (f, a) => p.evaluate(f, a);
  const wait = (ms = 350) => p.waitForTimeout(ms);
  return {
    eval: async (f, a) => { await ev(f, a); await wait(); },
    ui: async o => { await ev(o => { Object.assign(__sd.ui, o); __sd.render(); }, o); await wait(); },
    go: async (tab, extra) => { await ev(([t, x]) => { Object.assign(__sd.ui, { sheet: null, catSheet: false, tab: t }, x || {}); __sd.render(); const s = document.querySelector('.sd-scroll'); if (s) s.scrollTop = 0; }, [tab, extra || null]); await wait(); },
    fake: async () => { await ev(() => __sd.fake()); await wait(); },
    click: async sel => { await p.click(sel, { timeout: 4000 }); await wait(500); },
    clickText: async (sel, t) => { const ok = await ev(([s, t]) => { const el = [...document.querySelectorAll(s)].find(e => e.textContent.includes(t)); if (el) el.click(); return !!el; }, [sel, t]); if (!ok) throw new Error(`nicht gefunden: ${sel} „${t}“`); await wait(500); },
    fill: async (sel, v) => { await p.fill(sel, v, { timeout: 4000 }); await wait(); },
    scroll: async y => { await ev(y => { document.querySelector('.sd-scroll').scrollTop = y; }, y); await wait(); },
    sheetScroll: async y => { await ev(y => { document.querySelector('.sd-sheet').scrollTop = y; }, y); await wait(); },
    toText: async (sel, t, off) => { const ok = await ev(([s, t, o]) => { const el = [...document.querySelectorAll(s)].find(e => e.textContent.includes(t)); if (!el) return false; const sc = document.querySelector('.sd-scroll'); sc.scrollTop = el.getBoundingClientRect().top + sc.scrollTop - o; return true; }, [sel, t, off]); if (!ok) throw new Error(`nicht gefunden: ${sel} „${t}“`); await wait(); },
    into: async (sel, t, block) => { const ok = await ev(([s, t, b]) => { const el = [...document.querySelectorAll(s)].find(e => !t || e.textContent.includes(t) || e.value === t); if (el) el.scrollIntoView({ block: b }); return !!el; }, [sel, t, block]); if (!ok) throw new Error(`nicht gefunden: ${sel}`); await wait(); }
  };
}

async function newPage(browser, url, { empty, seen, dark } = {}) {
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2, locale: 'de-DE', timezoneId: 'Europe/Berlin', colorScheme: dark ? 'dark' : 'light' });
  await ctx.addInitScript(([d, m, s]) => {
    window.__fakeSync = true;
    localStorage.setItem('superdaily-mode', m);
    if (s) localStorage.setItem('superdaily-seen-version', String(s));
    if (d) localStorage.setItem('superdaily-v1', JSON.stringify(d)); else localStorage.removeItem('superdaily-v1');
  }, [empty ? null : seed(), dark ? 'dark' : 'light', seen || null]);
  const p = await ctx.newPage();
  p.on('dialog', d => d.accept());
  await p.goto(url); await p.waitForSelector('.sd-tabs, .sd-auth, .sd-welcome', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(900);
  return { p, close: () => ctx.close() };
}

// Ergebnis: { key: { file } | { error } }
async function captureScreens(url, outDir, version) {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch(); const res = {};
  for (const s of SCREENS) {
    const { p, close } = await newPage(browser, url, { ...s.opt, seen: s.opt.seen === 'prev' ? version - 1 : version });
    const file = path.join(outDir, s.key + '.png');
    try { await s.run(helpers(p)); await settle(p); await p.screenshot({ path: file }); res[s.key] = { file }; }
    catch (e) { res[s.key] = { error: e.message.split('\n')[0] }; fs.rmSync(file, { force: true }); }
    await close();
  }
  await browser.close();
  return res;
}

// Ablauf in einer durchgehenden Sitzung; je Schritt Screenshot und Rahmen der Tipp-Ziele (CSS-Pixel)
async function captureFlow(url, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const { p, close } = await newPage(browser, url, {});
  const h = helpers(p), steps = [];
  for (const [i, st] of FLOW_STEPS.entries()) {
    if (st.before) await st.before(h);
    await p.waitForTimeout(500);
    const boxes = [];
    for (const t of st.hl) {
      const b = await p.evaluate(t => {
        let el;
        if (typeof t === 'string') el = document.querySelector(t);
        else if (t.row) el = [...document.querySelectorAll('.sd-catrow')].find(r => r.querySelector('input')?.value === t.row)?.querySelector('.sd-caticon');
        else el = [...document.querySelectorAll(t.sel)].find(e => e.textContent.includes(t.text));
        if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height };
      }, t);
      if (!b) throw new Error(`Ablauf Schritt ${i + 1}: Ziel nicht gefunden ${JSON.stringify(t)}`);
      boxes.push(b);
    }
    await settle(p);
    const n = String(i + 1).padStart(2, '0'), file = path.join(outDir, `flow-${n}.png`);
    await p.screenshot({ path: file });
    steps.push({ n: i + 1, phase: st.phase, title: st.title, text: st.text, file, hl: boxes });
    if (st.next) { await st.next(h); await p.waitForTimeout(500); }
  }
  await close(); await browser.close();
  return steps;
}

module.exports = { captureScreens, captureFlow, VIEW };
