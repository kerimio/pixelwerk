// Lokaler Start für Pixelwerk: `npm start`
// - baut index.html aus src/ und baut bei jeder Änderung in src/ automatisch neu
// - liefert die App unter http://localhost:4300 aus
// - speichert den Fortschritt automatisch in fortschritt.json (im Repo-Ordner, nicht im Git)
// Keine Abhängigkeiten, nur Node.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 4300;
const DATEI = path.resolve(ROOT, process.env.FORTSCHRITT || 'fortschritt.json');
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

const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
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
  // Statische Dateien aus dem Repo-Ordner, nie darüber hinaus
  let p = decodeURIComponent(url.pathname); if (p === '/') p = '/index.html';
  const datei = path.join(ROOT, path.normalize(p));
  if (!datei.startsWith(ROOT + path.sep) || path.basename(datei).startsWith('fortschritt.json')) { res.writeHead(404); return res.end(); }
  fs.readFile(datei, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Nicht gefunden'); }
    res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

(async () => {
  await bauen();
  // Neu bauen, sobald jemand in src/ etwas ändert. Danach im Browser neu laden.
  let t = null;
  fs.watch(path.join(ROOT, 'src'), { recursive: true }, () => { clearTimeout(t); t = setTimeout(bauen, 200); });
  server.listen(PORT, '127.0.0.1', () => {
    console.log('\nPixelwerk läuft: http://localhost:' + PORT);
    console.log('Fortschritt wird automatisch gespeichert in: ' + DATEI);
    console.log('Änderungen in src/ werden automatisch neu gebaut. Beenden mit Strg+C.\n');
  });
})();
