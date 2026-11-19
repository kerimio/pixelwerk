// Lokaler Start für Pixelwerk: `npm start`
// - baut index.html aus src/ und baut bei jeder Änderung in src/ automatisch neu
// - liefert die App unter http://localhost:4300 aus
// - speichert den Fortschritt automatisch in fortschritt.json (im Repo-Ordner, nicht im Git)
// - hält den KI-Schlüssel für Coach Toni: Er liegt nur in data/secrets.json (Dateirechte 600, in .gitignore),
//   geht nie an den Browser zurück und wird nur von hier aus an den gewählten Anbieter geschickt.
// Keine Abhängigkeiten, nur Node (ab Version 18).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 4300;
const DATEI = path.resolve(ROOT, process.env.FORTSCHRITT || 'fortschritt.json');
const SECRETS = path.resolve(ROOT, process.env.SECRETS || path.join('data', 'secrets.json'));
const DATA = path.join(ROOT, 'data');
const MAX = 20 * 1024 * 1024;

function bauen() {
  return new Promise(ok => execFile(process.execPath, [path.join(ROOT, 'scripts', 'build.js')], (err, out, errOut) => {
    if (err) console.error('✗ Build fehlgeschlagen:\n' + (errOut || err.message)); else process.stdout.write('✓ ' + out);
    ok();
  }));
}

/* Fortschritt sicher schreiben: erst in eine Zwischendatei, dann umbenennen. Die vorige Fassung bleibt als .bak liegen. */
function schreiben(json) {
  const tmp = DATEI + '.tmp';
  fs.writeFileSync(tmp, json);
  if (fs.existsSync(DATEI)) fs.copyFileSync(DATEI, DATEI + '.bak');
  fs.renameSync(tmp, DATEI);
}

/* ---------- KI-Schlüssel ---------- */
/* Die Anbieter. Nur diese Adressen ruft der Server auf. basis lässt sich für Tests umstellen (module.exports.ANBIETER). */
const ANBIETER = {
  claude: {
    basis: 'https://api.anthropic.com',
    kopf: key => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01' }),
    chat: () => '/v1/messages', modelle: '/v1/models?limit=100'
  },
  openai: { basis: 'https://api.openai.com', kopf: key => ({ Authorization: 'Bearer ' + key }), chat: () => '/v1/chat/completions', modelle: '/v1/models' },
  deepseek: { basis: 'https://api.deepseek.com', kopf: key => ({ Authorization: 'Bearer ' + key }), chat: () => '/chat/completions', modelle: '/models' },
  gemini: {
    basis: 'https://generativelanguage.googleapis.com',
    kopf: key => ({ 'x-goog-api-key': key }),
    chat: modell => '/v1beta/models/' + encodeURIComponent(modell || 'gemini-2.5-flash') + ':streamGenerateContent?alt=sse', modelle: '/v1beta/models?pageSize=200'
  }
};

function kiLesen() {
  try { const c = JSON.parse(fs.readFileSync(SECRETS, 'utf8')); return c && typeof c === 'object' ? c : {}; } catch (e) { return {}; }
}
/* Schreibt data/secrets.json nur für dich lesbar (600), den Ordner data/ mit 700. */
function kiSchreiben(c) {
  fs.mkdirSync(path.dirname(SECRETS), { recursive: true, mode: 0o700 });
  const tmp = SECRETS + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(c, null, 2), { mode: 0o600 });
  fs.chmodSync(tmp, 0o600);
  fs.renameSync(tmp, SECRETS);
  fs.chmodSync(SECRETS, 0o600);
}
/* Was der Browser erfahren darf: Anbieter, Modell und ob ein Schlüssel da ist. Nie den Schlüssel selbst. */
function kiStand() { const c = kiLesen(); return { server: true, anbieter: c.anbieter || null, model: c.model || null, schluessel: !!c.key }; }

function json(res, status, obj) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }
function koerper(req, max) {
  return new Promise((ok, nein) => {
    let body = '';
    req.on('data', c => { body += c; if (body.length > max) { req.destroy(); nein(new Error('zu groß')); } });
    req.on('end', () => { try { ok(body ? JSON.parse(body) : {}); } catch (e) { nein(e); } });
    req.on('error', nein);
  });
}
/* Andere Webseiten dürfen den lokalen Server nicht als KI-Zugang benutzen: nur Aufrufe von localhost mit JSON. */
function vonHier(req) {
  const host = String(req.headers.host || '').replace(/:\d+$/, '');
  if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(host)) return false;
  const origin = req.headers.origin;
  if (origin && origin !== 'null') { try { if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(origin).hostname)) return false; } catch (e) { return false; } }
  if (req.method !== 'GET' && req.method !== 'DELETE' && !/^application\/json\b/.test(req.headers['content-type'] || '')) return false;
  return true;
}
/* Leitet die Antwort des Anbieters unverändert an den Browser weiter (Status, Typ, Strom). */
async function weiter(antwort, res) {
  res.writeHead(antwort.status, { 'Content-Type': antwort.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store' });
  if (!antwort.body) return res.end();
  try { for await (const stueck of antwort.body) res.write(stueck); } catch (e) {}
  res.end();
}

async function kiApi(req, res, teil) {
  if (!vonHier(req)) return json(res, 403, { error: { message: 'Nur von localhost aus erlaubt' } });
  if (teil === '' && req.method === 'GET') return json(res, 200, kiStand());
  if (teil === '' && req.method === 'DELETE') { try { fs.unlinkSync(SECRETS); } catch (e) {} return json(res, 200, kiStand()); }
  let b; try { b = await koerper(req, teil === '/chat' ? MAX : 64 * 1024); } catch (e) { return json(res, 400, { error: { message: 'Ungültiges JSON' } }); }
  const alt = kiLesen();
  if (teil === '' && req.method === 'PUT') {
    if (!ANBIETER[b.anbieter]) return json(res, 400, { error: { message: 'Unbekannter Anbieter' } });
    const key = typeof b.key === 'string' && b.key.trim() ? b.key.trim() : (alt.anbieter === b.anbieter ? alt.key : '');
    if (!key) return json(res, 400, { error: { message: 'Kein Schlüssel' } });
    kiSchreiben({ anbieter: b.anbieter, key, model: typeof b.model === 'string' ? b.model : '' });
    return json(res, 200, kiStand());
  }
  if (req.method !== 'POST') return json(res, 405, { error: { message: 'Methode nicht erlaubt' } });
  if (teil === '/modelle') {
    /* Schlüssel-Test: mit einem neu eingetippten Schlüssel oder dem gespeicherten */
    const a = b.anbieter || alt.anbieter, k = ANBIETER[a];
    const key = typeof b.key === 'string' && b.key.trim() ? b.key.trim() : (alt.anbieter === a ? alt.key : '');
    if (!k) return json(res, 400, { error: { message: 'Unbekannter Anbieter' } });
    if (!key) return json(res, 401, { error: { message: 'Kein Schlüssel gespeichert' } });
    try { return await weiter(await fetch(k.basis + k.modelle, { headers: k.kopf(key) }), res); }
    catch (e) { return json(res, 502, { error: { message: 'Keine Verbindung zu ' + a } }); }
  }
  if (teil === '/chat') {
    const k = ANBIETER[alt.anbieter];
    if (!k || !alt.key) return json(res, 401, { error: { message: 'Kein Schlüssel gespeichert' } });
    if (!b.body || typeof b.body !== 'object') return json(res, 400, { error: { message: 'Anfrage fehlt' } });
    try {
      const antwort = await fetch(k.basis + k.chat(b.modell), { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, k.kopf(alt.key)), body: JSON.stringify(b.body) });
      return await weiter(antwort, res);
    } catch (e) { return json(res, 502, { error: { message: 'Keine Verbindung zum Anbieter' } }); }
  }
  return json(res, 404, { error: { message: 'Nicht gefunden' } });
}

const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/ki' || url.pathname.startsWith('/api/ki/')) {
    return kiApi(req, res, url.pathname.slice('/api/ki'.length)).catch(e => { if (!res.headersSent) json(res, 500, { error: { message: e.message } }); else res.end(); });
  }
  if (url.pathname === '/api/fortschritt') {
    if (req.method === 'GET') {
      if (!fs.existsSync(DATEI)) { res.writeHead(204); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return fs.createReadStream(DATEI).pipe(res);
    }
    if (req.method === 'PUT') {
      let body = '', zuGross = false;
      req.on('data', c => { body += c; if (body.length > MAX) { zuGross = true; req.destroy(); } });
      req.on('end', () => {
        if (zuGross) return;
        try { const v = JSON.parse(body); if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('kein Objekt'); schreiben(JSON.stringify(v, null, 2)); res.writeHead(204); res.end(); }
        catch (e) { res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Ungültiges JSON: ' + e.message); }
      });
      return;
    }
    res.writeHead(405); return res.end();
  }
  // Statische Dateien aus dem Repo-Ordner, nie darüber hinaus. Nie: data/ (Schlüssel), fortschritt.json, versteckte Dateien wie .git
  let p; try { p = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (p === '/') p = '/index.html';
  const datei = path.join(ROOT, path.normalize(p));
  const gesperrt = !datei.startsWith(ROOT + path.sep) || datei.startsWith(DATA + path.sep) || datei === SECRETS || datei.startsWith(SECRETS)
    || path.basename(datei).startsWith('fortschritt.json') || path.relative(ROOT, datei).split(path.sep).some(s => s.startsWith('.'));
  if (gesperrt) { res.writeHead(404); return res.end(); }
  fs.readFile(datei, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Nicht gefunden'); }
    res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

module.exports = { server, ANBIETER, SECRETS };

if (require.main === module) (async () => {
  await bauen();
  // Neu bauen, sobald jemand in src/ etwas ändert. Danach im Browser neu laden.
  let t = null;
  fs.watch(path.join(ROOT, 'src'), { recursive: true }, () => { clearTimeout(t); t = setTimeout(bauen, 200); });
  // Alte Schlüsseldatei mit zu offenen Rechten: wieder auf 600 stellen
  try { if (fs.existsSync(SECRETS) && (fs.statSync(SECRETS).mode & 0o077)) fs.chmodSync(SECRETS, 0o600); } catch (e) {}
  server.listen(PORT, '127.0.0.1', () => {
    console.log('\nPixelwerk läuft: http://localhost:' + PORT);
    console.log('Fortschritt wird automatisch gespeichert in: ' + DATEI);
    console.log('KI-Schlüssel (falls eingetragen) liegt nur hier: ' + SECRETS + ' (Rechte 600, nicht im Git)');
    console.log('Änderungen in src/ werden automatisch neu gebaut. Beenden mit Strg+C.\n');
  });
})();
