// Lokaler Start für Pixelwerk: `npm start`
// - baut index.html aus src/ und baut bei jeder Änderung in src/ automatisch neu
// - liefert die App unter http://localhost:4300 aus
// - speichert den Fortschritt automatisch in progress.json (im Repo-Ordner, nicht im Git)
// - hält den KI-Schlüssel für Coach Toni: Er liegt nur in data/secrets.json (Dateirechte 600, in .gitignore),
//   geht nie an den Browser zurück und wird nur von hier aus an den gewählten Anbieter geschickt.
// Keine Abhängigkeiten, nur Node (ab Version 18).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 4300;
const PROGRESS_FILE = path.resolve(ROOT, process.env.PROGRESS || process.env.FORTSCHRITT || 'progress.json');
const SECRETS = path.resolve(ROOT, process.env.SECRETS || path.join('data', 'secrets.json'));
const DATA = path.join(ROOT, 'data');
const MAX = 20 * 1024 * 1024;

function build() {
  return new Promise(ok => execFile(process.execPath, [path.join(ROOT, 'scripts', 'build.js')], (err, out, errOut) => {
    if (err) console.error('✗ Build fehlgeschlagen:\n' + (errOut || err.message)); else process.stdout.write('✓ ' + out);
    ok();
  }));
}

/* Fortschritt sicher schreiben: erst in eine Zwischendatei, dann umbenennen. Die vorige Fassung bleibt als .bak liegen. */
function writeOut(json) {
  const tmp = PROGRESS_FILE + '.tmp';
  fs.writeFileSync(tmp, json);
  if (fs.existsSync(PROGRESS_FILE)) fs.copyFileSync(PROGRESS_FILE, PROGRESS_FILE + '.bak');
  fs.renameSync(tmp, PROGRESS_FILE);
}

/* ---------- KI-Schlüssel ---------- */
/* Die Anbieter. Nur diese Adressen ruft der Server auf. basis lässt sich für Tests umstellen (module.exports.PROVIDERS). */
const PROVIDERS = {
  claude: {
    base: 'https://api.anthropic.com',
    head: key => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01' }),
    chat: () => '/v1/messages', models: '/v1/models?limit=100'
  },
  openai: { base: 'https://api.openai.com', head: key => ({ Authorization: 'Bearer ' + key }), chat: () => '/v1/chat/completions', models: '/v1/models' },
  deepseek: { base: 'https://api.deepseek.com', head: key => ({ Authorization: 'Bearer ' + key }), chat: () => '/chat/completions', models: '/models' },
  gemini: {
    base: 'https://generativelanguage.googleapis.com',
    head: key => ({ 'x-goog-api-key': key }),
    chat: modelName => '/v1beta/models/' + encodeURIComponent(modelName || 'gemini-2.5-flash') + ':streamGenerateContent?alt=sse', models: '/v1beta/models?pageSize=200'
  }
};

function aiRead() {
  try { const c = JSON.parse(fs.readFileSync(SECRETS, 'utf8')); if (c && c.anbieter && !c.provider) c.provider = c.anbieter; return c && typeof c === 'object' ? c : {}; } catch (e) { return {}; }
}
/* Schreibt data/secrets.json nur für dich lesbar (600), den Ordner data/ mit 700. */
function aiWrite(c) {
  fs.mkdirSync(path.dirname(SECRETS), { recursive: true, mode: 0o700 });
  const tmp = SECRETS + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(c, null, 2), { mode: 0o600 });
  fs.chmodSync(tmp, 0o600);
  fs.renameSync(tmp, SECRETS);
  fs.chmodSync(SECRETS, 0o600);
}
/* Was der Browser erfahren darf: Anbieter, Modell und ob ein Schlüssel da ist. Nie den Schlüssel selbst. */
function aiStatus() { const c = aiRead(); return { server: true, provider: c.provider || null, model: c.model || null, hasKey: !!c.key }; }

function json(res, status, obj) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }
function readBody(req, max) {
  return new Promise((ok, no) => {
    let body = '';
    req.on('data', c => { body += c; if (body.length > max) { req.destroy(); no(new Error('zu groß')); } });
    req.on('end', () => { try { ok(body ? JSON.parse(body) : {}); } catch (e) { no(e); } });
    req.on('error', no);
  });
}
/* Andere Webseiten dürfen den lokalen Server nicht als KI-Zugang benutzen: nur Aufrufe von localhost mit JSON. */
function fromHere(req) {
  const host = String(req.headers.host || '').replace(/:\d+$/, '');
  if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(host)) return false;
  const origin = req.headers.origin;
  if (origin && origin !== 'null') { try { if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(origin).hostname)) return false; } catch (e) { return false; } }
  if (req.method !== 'GET' && req.method !== 'DELETE' && !/^application\/json\b/.test(req.headers['content-type'] || '')) return false;
  return true;
}
/* Leitet die Antwort des Anbieters unverändert an den Browser weiter (Status, Typ, Strom). */
async function proceed(answer, res) {
  res.writeHead(answer.status, { 'Content-Type': answer.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store' });
  if (!answer.body) return res.end();
  try { for await (const chunk of answer.body) res.write(chunk); } catch (e) {}
  res.end();
}

async function aiApi(req, res, part) {
  if (!fromHere(req)) return json(res, 403, { error: { message: 'Nur von localhost aus erlaubt' } });
  if (part === '' && req.method === 'GET') return json(res, 200, aiStatus());
  if (part === '' && req.method === 'DELETE') { try { fs.unlinkSync(SECRETS); } catch (e) {} return json(res, 200, aiStatus()); }
  let b; try { b = await readBody(req, part === '/chat' ? MAX : 64 * 1024); } catch (e) { return json(res, 400, { error: { message: 'Ungültiges JSON' } }); }
  const alt = aiRead();
  if (part === '' && req.method === 'PUT') {
    if (!PROVIDERS[b.provider]) return json(res, 400, { error: { message: 'Unbekannter Anbieter' } });
    const key = typeof b.key === 'string' && b.key.trim() ? b.key.trim() : (alt.provider === b.provider ? alt.key : '');
    if (!key) return json(res, 400, { error: { message: 'Kein Schlüssel' } });
    aiWrite({ provider: b.provider, key, model: typeof b.model === 'string' ? b.model : '' });
    return json(res, 200, aiStatus());
  }
  if (req.method !== 'POST') return json(res, 405, { error: { message: 'Methode nicht erlaubt' } });
  if (part === '/models') {
    /* Schlüssel-Test: mit einem neu eingetippten Schlüssel oder dem gespeicherten */
    const a = b.provider || alt.provider, k = PROVIDERS[a];
    const key = typeof b.key === 'string' && b.key.trim() ? b.key.trim() : (alt.provider === a ? alt.key : '');
    if (!k) return json(res, 400, { error: { message: 'Unbekannter Anbieter' } });
    if (!key) return json(res, 401, { error: { message: 'Kein Schlüssel gespeichert' } });
    try { return await proceed(await fetch(k.base + k.models, { headers: k.head(key) }), res); }
    catch (e) { return json(res, 502, { error: { message: 'Keine Verbindung zu ' + a } }); }
  }
  if (part === '/chat') {
    const k = PROVIDERS[alt.provider];
    if (!k || !alt.key) return json(res, 401, { error: { message: 'Kein Schlüssel gespeichert' } });
    if (!b.body || typeof b.body !== 'object') return json(res, 400, { error: { message: 'Anfrage fehlt' } });
    try {
      const answer = await fetch(k.base + k.chat(b.modelName), { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, k.head(alt.key)), body: JSON.stringify(b.body) });
      return await proceed(answer, res);
    } catch (e) { return json(res, 502, { error: { message: 'Keine Verbindung zum Anbieter' } }); }
  }
  return json(res, 404, { error: { message: 'Nicht gefunden' } });
}

const MIME_TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/ai' || url.pathname.startsWith('/api/ai/')) {
    return aiApi(req, res, url.pathname.slice('/api/ai'.length)).catch(e => { if (!res.headersSent) json(res, 500, { error: { message: e.message } }); else res.end(); });
  }
  if (url.pathname === '/api/progress') {
    if (req.method === 'GET') {
      if (!fs.existsSync(PROGRESS_FILE)) { res.writeHead(204); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return fs.createReadStream(PROGRESS_FILE).pipe(res);
    }
    if (req.method === 'PUT') {
      let body = '', tooBig = false;
      req.on('data', c => { body += c; if (body.length > MAX) { tooBig = true; req.destroy(); } });
      req.on('end', () => {
        if (tooBig) return;
        try { const v = JSON.parse(body); if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('kein Objekt'); writeOut(JSON.stringify(v, null, 2)); res.writeHead(204); res.end(); }
        catch (e) { res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Ungültiges JSON: ' + e.message); }
      });
      return;
    }
    res.writeHead(405); return res.end();
  }
  // Statische Dateien aus dem Repo-Ordner, nie darüber hinaus. Nie: data/ (Schlüssel), progress.json, versteckte Dateien wie .git
  let p; try { p = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p));
  const blocked = !file.startsWith(ROOT + path.sep) || file.startsWith(DATA + path.sep) || file === SECRETS || file.startsWith(SECRETS)
    || /^(progress|fortschritt)\.json/.test(path.basename(file)) || path.relative(ROOT, file).split(path.sep).some(s => s.startsWith('.'));
  if (blocked) { res.writeHead(404); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Nicht gefunden'); }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

module.exports = { server, PROVIDERS, SECRETS };

if (require.main === module) (async () => {
  await build();
  // Neu bauen, sobald jemand in src/ etwas ändert. Danach im Browser neu laden.
  let t = null;
  fs.watch(path.join(ROOT, 'src'), { recursive: true }, () => { clearTimeout(t); t = setTimeout(build, 200); });
  // Alter Name der Fortschrittsdatei: einmal umbenennen
  const OLD_FILE = path.join(ROOT, 'fortschritt.json');
  try { if (!fs.existsSync(PROGRESS_FILE) && fs.existsSync(OLD_FILE)) { fs.renameSync(OLD_FILE, PROGRESS_FILE); console.log('fortschritt.json heißt jetzt progress.json'); } } catch (e) {}
  // Alte Schlüsseldatei mit zu offenen Rechten: wieder auf 600 stellen
  try { if (fs.existsSync(SECRETS) && (fs.statSync(SECRETS).mode & 0o077)) fs.chmodSync(SECRETS, 0o600); } catch (e) {}
  server.listen(PORT, '127.0.0.1', () => {
    console.log('\nPixelwerk läuft: http://localhost:' + PORT);
    console.log('Fortschritt wird automatisch gespeichert in: ' + PROGRESS_FILE);
    console.log('KI-Schlüssel (falls eingetragen) liegt nur hier: ' + SECRETS + ' (Rechte 600, nicht im Git)');
    console.log('Änderungen in src/ werden automatisch neu gebaut. Beenden mit Strg+C.\n');
  });
})();
