// Stellt eine Version der App für Screenshots bereit: lokaler Modus, Icons lokal, kein Service Worker.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../../..');
const git = cmd => execSync('git ' + cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 }).trim();

// Versionsnummer einer app.js: CHANGES[0].v, ältere Stände ohne CHANGES über den Cache-Namen in sw.js (superdaily-vN = Version N-1)
function versionOf(appJs, swJs) {
  const m = /const CHANGES = \[\s*\{\s*v:\s*(\d+)/.exec(appJs || '');
  if (m) return +m[1];
  const c = /superdaily-v(\d+)/.exec(swJs || '');
  return c ? +c[1] - 1 : null;
}
const read = (rev, file) => { try { return git(`show ${rev}:${file}`); } catch { return ''; } };

function currentVersion() {
  return versionOf(fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'), fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'));
}
function changes() {
  const src = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const m = /const CHANGES = (\[[\s\S]*?\]);\n/.exec(src);
  return m ? Function('return ' + m[1])() : [];
}
// Letzter Commit, in dem die App die gesuchte Version hatte
function commitOfVersion(v) {
  try { git('fetch --quiet --deepen=500 origin'); } catch {}
  for (const sha of git('log --format=%H -- app.js sw.js').split('\n').filter(Boolean)) {
    if (versionOf(read(sha, 'app.js'), read(sha, 'sw.js')) === v) return sha;
  }
  return null;
}

const HOOKS = `
// Nur für Screenshots der Dokumentation
window.__sd = { ui, data, store, render,
  // „Mehr“ wie angemeldet zeigen (Haushalts-Code, Konto); danach nichts mehr speichern
  fake() { try { store.mode = 'firebase'; hhId = 'K7Q2XM'; fb = { auth: { currentUser: { email: 'simon@beispiel.de' } } }; } catch {} render(); } };`;

function prepare(rev, dest) {
  fs.rmSync(dest, { recursive: true, force: true }); fs.mkdirSync(dest, { recursive: true });
  if (rev) execSync(`git archive ${rev} | tar x -C "${dest}"`, { cwd: ROOT, shell: '/bin/bash' });
  else for (const f of fs.readdirSync(ROOT)) if (!['.git', 'docs', 'node_modules'].includes(f)) fs.cpSync(path.join(ROOT, f), path.join(dest, f), { recursive: true });
  fs.rmSync(path.join(dest, 'docs'), { recursive: true, force: true });
  fs.writeFileSync(path.join(dest, 'firebase-config.js'), 'export const firebaseConfig = null;\n');
  fs.rmSync(path.join(dest, 'sw.js'), { force: true });
  fs.cpSync(path.join(__dirname, '../node_modules/@phosphor-icons/web/src'), path.join(dest, 'ph'), { recursive: true });
  let html = fs.readFileSync(path.join(dest, 'index.html'), 'utf8');
  html = html.replace(/<script src="https:\/\/unpkg\.com\/@phosphor-icons\/web@[^"]*"><\/script>/,
    ['regular', 'bold', 'fill'].map(w => `<link rel="stylesheet" href="ph/${w}/style.css">`).join(''));
  html = html.replace(/navigator\.serviceWorker\.register\([^)]*\)(\.catch\([^)]*\))?/, '0');
  fs.writeFileSync(path.join(dest, 'index.html'), html);
  let js = fs.readFileSync(path.join(dest, 'app.js'), 'utf8');
  // Wie mit Anmeldung (Rechte pro Person), gespeichert wird trotzdem lokal
  js = js.replace("const syncMode = () => firebaseConfig ? 'firebase' : 'local';", "const syncMode = () => (window.__fakeSync || firebaseConfig) ? 'firebase' : 'local';");
  fs.writeFileSync(path.join(dest, 'app.js'), js + HOOKS);
  return dest;
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
function serve(dir) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(dir, p);
      if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${srv.address().port}/`, close: () => srv.close() }));
  });
}

module.exports = { ROOT, git, versionOf, currentVersion, changes, commitOfVersion, prepare, serve };
