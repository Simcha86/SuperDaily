// Erzeugt die Unterlagen zur aktuellen Version:
//   docs/SuperDaily-Anleitung.pptx (+ .pdf), docs/SuperDaily-Vergleich.pptx (+ .pdf),
//   docs/releasenotes/vN.md, docs/screens/*.png (für Figma), docs/screens/anleitung/ (Ablauf mit Tipp-Zielen), docs/stand.json
// Aufruf: cd docs/tools && npm install && npm run docs
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const A = require('./lib/app');
const { captureScreens, captureFlow } = require('./lib/capture');
const { optimize, phone, difference } = require('./lib/images');
const { SCREENS, GROUPS } = require('./screens');
const RELEASES = require('./releases');
const buildAnleitung = require('./anleitung');
const buildVergleich = require('./vergleich');
const releaseNotes = require('./lib/notes');

const DOCS = path.join(A.ROOT, 'docs');
const TMP = path.join(os.tmpdir(), 'superdaily-docs');
const log = (...a) => console.log('·', ...a);

function pdf(file) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'lo-'));
  try {
    execFileSync('soffice', [`-env:UserInstallation=file://${profile}`, '--headless', '--convert-to', 'pdf', '--outdir', path.dirname(file), file],
      { env: { ...process.env, SAL_USE_VCLPLUGIN: 'svp' }, stdio: 'ignore', timeout: 240000 });
    return true;
  } catch { log('PDF übersprungen (LibreOffice nicht verfügbar):', path.basename(file)); return false; }
  finally { fs.rmSync(profile, { recursive: true, force: true }); }
}

(async () => {
  const version = A.currentVersion(), prev = version - 1;
  const sha = A.git('rev-parse HEAD'), prevSha = A.commitOfVersion(prev);
  const date = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  log(`Version ${version}, Vergleich mit Version ${prev}${prevSha ? ' (' + prevSha.slice(0, 7) + ')' : ': nicht gefunden'}`);
  fs.rmSync(TMP, { recursive: true, force: true });

  const neuSrv = await A.serve(A.prepare(null, path.join(TMP, 'app-neu')));
  log('Screens der neuen Version …');
  const neu = await captureScreens(neuSrv.url, path.join(TMP, 'neu'), version);
  log('Schritt-für-Schritt-Ablauf …');
  const flow = await captureFlow(neuSrv.url, path.join(TMP, 'flow'));
  neuSrv.close();
  let alt = {};
  if (prevSha) {
    const altSrv = await A.serve(A.prepare(prevSha, path.join(TMP, 'app-alt')));
    log(`Screens von Version ${prev} …`);
    alt = await captureScreens(altSrv.url, path.join(TMP, 'alt'), prev);
    altSrv.close();
  }
  const failed = Object.entries(neu).filter(([, r]) => r.error);
  if (failed.length) { console.error('Screens fehlgeschlagen:', failed.map(([k, r]) => `${k}: ${r.error}`).join('\n')); process.exit(1); }

  // Screens fürs Repo und für Figma
  const sdir = path.join(DOCS, 'screens'), fdir = path.join(sdir, 'anleitung');
  fs.rmSync(sdir, { recursive: true, force: true }); fs.mkdirSync(fdir, { recursive: true });
  for (const s of SCREENS) await optimize(neu[s.key].file, path.join(sdir, s.key + '.png'));
  for (const st of flow) await optimize(st.file, path.join(fdir, path.basename(st.file)));
  fs.writeFileSync(path.join(sdir, 'screens.json'), JSON.stringify({ version, groups: GROUPS.map(([name, desc]) => ({ name, desc, screens: SCREENS.filter(s => s.group === name).map(({ key, title, desc }) => ({ key, title, desc, file: key + '.png' })) })) }, null, 2) + '\n');
  fs.writeFileSync(path.join(fdir, 'flow.json'), JSON.stringify({ version, steps: flow.map(({ n, phase, title, text, file, hl }) => ({ n, phase, title, text, file: path.basename(file), hl: hl.map(b => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v * 10) / 10]))) })) }, null, 2) + '\n');

  // Handy-Bilder für die Folien
  log('Folien …');
  const cache = {};
  const ph = async (file, o) => cache[file + JSON.stringify(o || {})] ||= await phone(file, o);
  const phNeu = {}; for (const s of SCREENS) phNeu[s.key] = await ph(neu[s.key].file);
  for (const st of flow) st.ph = await ph(st.file, { highlights: st.hl });
  await buildAnleitung({ version, date, ph: k => phNeu[k], flow, out: path.join(DOCS, 'SuperDaily-Anleitung.pptx') });

  const pairs = [], added = [], removed = []; let unchanged = 0;
  if (prevSha) {
    for (const s of SCREENS) {
      const a = alt[s.key];
      if (!a || a.error) { added.push({ s, newPh: phNeu[s.key] }); continue; }
      const diff = await difference(a.file, neu[s.key].file);
      if (diff > 0.004) pairs.push({ s, diff, oldPh: await ph(a.file), newPh: phNeu[s.key] }); else unchanged++;
    }
    const items = (A.changes().find(c => c.v === version) || {}).items || [];
    await buildVergleich({ version, prev, date, sha, prevSha, items, note: RELEASES[version], pairs, added, removed, unchanged, out: path.join(DOCS, 'SuperDaily-Vergleich.pptx') });
  }
  const figma = JSON.parse(fs.readFileSync(path.join(DOCS, 'figma.json'), 'utf8'));
  const ndir = path.join(DOCS, 'releasenotes'); fs.mkdirSync(ndir, { recursive: true });
  fs.writeFileSync(path.join(ndir, `v${version}.md`), releaseNotes({ version, prev, entry: A.changes().find(c => c.v === version), sha, prevSha, note: RELEASES[version], pairs, added, removed, unchanged, figmaUrl: figma.url }));
  // Frühere Versionen ohne Release Notes aus dem Änderungsprotokoll nachtragen
  for (const entry of A.changes().filter(c => c.v < version && !fs.existsSync(path.join(ndir, `v${c.v}.md`))))
    fs.writeFileSync(path.join(ndir, `v${entry.v}.md`), releaseNotes({ version: entry.v, prev: entry.v - 1, entry, sha: A.commitOfVersion(entry.v) || '', prevSha: null, note: RELEASES[entry.v], archiv: true }));
  const all = fs.readdirSync(ndir).map(f => /^v(\d+)\.md$/.exec(f)?.[1]).filter(Boolean).map(Number).sort((a, b) => b - a);
  fs.writeFileSync(path.join(ndir, 'README.md'), ['# Release Notes', '', ...all.map(v => `- [Version ${v}](v${v}.md)`), ''].join('\n'));
  if (!prevSha) fs.rmSync(path.join(DOCS, 'SuperDaily-Vergleich.pptx'), { force: true });
  for (const f of ['SuperDaily-Anleitung.pptx', 'SuperDaily-Vergleich.pptx']) if (fs.existsSync(path.join(DOCS, f))) pdf(path.join(DOCS, f));

  const stand = { version, datum: new Date().toISOString().slice(0, 10), commit: sha, vergleich: prevSha ? { version: prev, commit: prevSha, veraendert: pairs.map(p => p.s.key), neu: added.map(p => p.s.key), unveraendert: unchanged } : null };
  fs.writeFileSync(path.join(DOCS, 'stand.json'), JSON.stringify(stand, null, 2) + '\n');
  log(`Fertig: Version ${version}. Verändert: ${pairs.map(p => p.s.key).join(', ') || '–'}. Neu: ${added.map(p => p.s.key).join(', ') || '–'}.`);
  log('Jetzt noch Figma aktualisieren (siehe docs/README.md, Abschnitt „Figma“).');
})().catch(e => { console.error(e); process.exit(1); });
