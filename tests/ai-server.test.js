// Prüft den KI-Schlüssel mit lokalem Server (npm start): Der Schlüssel liegt nur in data/secrets.json (Rechte 600),
// geht nie an den Browser zurück, und nur der Server spricht mit dem Anbieter. Der Anbieter ist hier ein kleiner Test-Server.
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-ki-'));
process.env.SECRETS = path.join(tmp, 'data', 'secrets.json');
process.env.PROGRESS = path.join(tmp, 'progress.json');
const { server, PROVIDERS, SECRETS } = require('../server.js');
const root = path.join(__dirname, '..');
const NM = path.join(root, 'node_modules');

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) fails++; };
const sse = evs => evs.map(e => 'data: ' + JSON.stringify(e) + '\n\n').join('');
const listenFor = s => new Promise(r => s.listen(0, '127.0.0.1', () => r(s.address().port)));

(async () => {
  // Der „Anbieter“: merkt sich jeden Aufruf mit Kopfzeilen
  const atProvider = [];
  const provider = http.createServer((req, res) => {
    let b = ''; req.on('data', c => b += c); req.on('end', () => {
      atProvider.push({ url: req.url, h: req.headers, body: b ? JSON.parse(b) : null });
      const key = req.headers['x-api-key'] || (req.headers.authorization || '').replace('Bearer ', '');
      if (!/^sk-(ant-)?(alt|gut|o)$/.test(key)) { res.writeHead(401, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: { message: 'invalid key' } })); }
      if (req.url.startsWith('/v1/models')) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ data: req.headers['x-api-key'] ? [{ id: 'claude-opus-5-5', display_name: 'Claude Opus 5.5' }] : [{ id: 'gpt-5' }, { id: 'gpt-5-mini' }] })); }
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      if (req.url === '/v1/messages') return res.end(sse([{ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hallo ' } }, { type: 'content_block_delta', delta: { type: 'text_delta', text: 'über den Server' } }]));
      res.end(sse([{ choices: [{ delta: { content: 'Hallo von ChatGPT' } }] }]));
    });
  });
  const aPort = await listenFor(provider);
  Object.values(PROVIDERS).forEach(a => { a.base = 'http://127.0.0.1:' + aPort; });
  const port = await listenFor(server);
  const BASE = 'http://127.0.0.1:' + port;

  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
  const fromBrowser = [];
  await ctx.route('**/*', r => {
    const req = r.request(), u = req.url();
    const m = u.match(/cdn\.jsdelivr\.net\/npm\/(@?[^@]+)@[^/]+\/(.*)$/);
    if (m) return r.fulfill({ body: fs.readFileSync(path.join(NM, m[1], m[2])), contentType: 'application/javascript' });
    fromBrowser.push({ u, h: req.headers(), body: req.postData() || '' });
    if (u.startsWith(BASE)) return r.continue();
    return r.abort();
  });
  // Alter Stand: Schlüssel noch im Browser
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('ngfc.v1')) { localStorage.setItem('ngfc.v1', '{"ich":{"start":1}}'); localStorage.setItem('ngfc.ai', JSON.stringify({ provider: 'claude', key: 'sk-ant-alt', model: 'claude-opus-5-5' })); } } catch (e) {} });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(BASE + '/');
  await page.waitForFunction(() => window.aiServer && aiServer.hasKey, null, { timeout: 30000 });
  await page.waitForFunction(() => !localStorage.getItem('ngfc.ai'), null, { timeout: 5000 });

  // Umzug des alten Schlüssels
  const file = JSON.parse(fs.readFileSync(SECRETS, 'utf8'));
  ok(file.provider === 'claude' && file.key === 'sk-ant-alt' && file.model === 'claude-opus-5-5', 'Alter Schlüssel aus dem Browser liegt jetzt in data/secrets.json');
  ok((fs.statSync(SECRETS).mode & 0o777) === 0o600, 'data/secrets.json hat Rechte 600');
  ok(!(await page.evaluate(() => localStorage.getItem('ngfc.ai'))), 'Im Browser-Speicher ist kein Schlüssel mehr');
  ok(await page.evaluate(() => aiCfg().key !== 'sk-ant-alt' && !!aiCfg().key && aiCfg().provider === 'claude'), 'Die App weiß, dass Claude eingerichtet ist, kennt den Schlüssel aber nicht');

  // Der Server gibt den Schlüssel nie heraus
  const standing = await page.evaluate(() => fetch('/api/ai').then(r => r.text()));
  ok(!standing.includes('sk-ant-alt') && JSON.parse(standing).hasKey === true, 'GET /api/ai sagt nur „Schlüssel da“, ohne Schlüssel');
  const st = async p => (await fetch(BASE + p)).status;
  ok(await st('/data/secrets.json') === 404 && await st('/data/') === 404 && await st('/.gitignore') === 404, 'data/ und versteckte Dateien liefert der Server nicht aus');

  // Fragen an Toni gehen über den Server
  const previous = fromBrowser.length;
  const answer = await page.evaluate(async () => { try { return await aiStream('Sag Hallo', () => {}, 'SYS', { maxOutputTokens: 1000 }); } catch (e) { return 'FEHLER ' + e.code + ' ' + e.message; } });
  ok(answer === 'Hallo über den Server', 'Claude antwortet im Stream über den lokalen Server');
  const fresh = fromBrowser.slice(previous);
  ok(fresh.length === 1 && fresh[0].u === BASE + '/api/ai/chat' && !JSON.stringify(fresh[0]).includes('sk-ant'), 'Der Browser ruft nur /api/ai/chat auf, ohne Schlüssel');
  const c = atProvider.filter(x => x.url === '/v1/messages').pop();
  ok(c.h['x-api-key'] === 'sk-ant-alt' && !c.h['anthropic-dangerous-direct-browser-access'] && c.body.system === 'SYS' && c.body.stream === true, 'Der Server schickt den Schlüssel selbst an den Anbieter, ohne Browser-Header');

  // Einstellungen: Schlüssel steht nicht im Feld, neuer Anbieter, nur Modell ändern, entfernen
  await page.evaluate(() => openAiSettings());
  ok(await page.inputValue('#aiKey') === '' && (await page.getAttribute('#aiKey', 'placeholder')).includes('Gespeichert') && (await page.textContent('#aiPlace')).includes('data/secrets.json'), 'Reiter „Coach Toni“: Feld leer, Hinweis „gespeichert“, Text nennt data/secrets.json');
  await page.click('#aiLoad');
  await page.waitForFunction(() => /funktioniert/.test(document.getElementById('aiMsg').textContent), null, { timeout: 5000 });
  ok(true, '„Prüfen“ geht auch ohne neu eingetippten Schlüssel (der Server nimmt den gespeicherten)');
  await page.click('#aiProv [data-a="openai"]'); await page.fill('#aiKey', 'sk-o'); await page.click('#aiLoad');
  await page.waitForFunction(() => /funktioniert/.test(document.getElementById('aiMsg').textContent), null, { timeout: 5000 });
  await page.click('#aiSaveBtn');
  await page.evaluate(() => aiServerSaving);
  let s = JSON.parse(fs.readFileSync(SECRETS, 'utf8'));
  ok(s.provider === 'openai' && s.key === 'sk-o' && s.model === 'gpt-5' && await page.inputValue('#aiKey') === '', 'ChatGPT gespeichert: in der Datei, nicht mehr im Feld');
  ok((fs.statSync(SECRETS).mode & 0o777) === 0o600, 'Auch nach dem Speichern Rechte 600');
  await page.evaluate(() => { const o = document.createElement('option'); o.value = 'gpt-5-mini'; document.getElementById('aiModel').appendChild(o); document.getElementById('aiModel').value = 'gpt-5-mini'; });
  await page.click('#aiSaveBtn'); await page.evaluate(() => aiServerSaving);
  s = JSON.parse(fs.readFileSync(SECRETS, 'utf8'));
  ok(s.key === 'sk-o' && s.model === 'gpt-5-mini', 'Nur Modell ändern behält den Schlüssel');
  ok(await page.evaluate(() => aiStream('x', () => {}, 'S')) === 'Hallo von ChatGPT', 'ChatGPT antwortet über den Server');
  ok(atProvider.filter(x => x.url === '/v1/chat/completions').pop().h.authorization === 'Bearer sk-o', 'ChatGPT-Aufruf mit Bearer-Schlüssel vom Server');
  await page.click('#aiRemove'); await page.evaluate(() => aiServerSaving);
  ok(!fs.existsSync(SECRETS) && (await page.textContent('#aiState')) === 'Noch keine KI eingestellt.', '„Schlüssel entfernen“ löscht data/secrets.json');
  ok(!fromBrowser.some(x => x.u.startsWith(BASE + '/api/ai') && x.u !== BASE + '/api/ai/models' && x.u !== BASE + '/api/ai' && /sk-/.test(x.body)), 'Der Schlüssel geht nur beim Prüfen und Speichern einmal an den Server');

  // Andere Webseiten dürfen den Server nicht als KI-Zugang benutzen
  const foreign = await fetch(BASE + '/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://boese.example' }, body: '{"body":{}}' });
  const textPlain = await fetch(BASE + '/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{"body":{}}' });
  ok(foreign.status === 403 && textPlain.status === 403, 'Aufrufe von fremden Seiten oder ohne JSON lehnt der Server ab');
  ok(!fs.readdirSync(root).includes('data') || !fs.existsSync(path.join(root, 'data', 'secrets.json')), 'Der Test schreibt nichts ins Repo');

  ok(errors.length === 0, 'Keine JS-Fehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close(); server.close(); provider.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(fails ? '\n' + fails + ' Fehler' : '\nAlles grün');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
