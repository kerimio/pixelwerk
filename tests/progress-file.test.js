// Prüft den lokalen Start (server.js): Fortschritt wird automatisch in eine JSON-Datei geschrieben und beim nächsten Start geladen.
// Wo der Spielstand liegt, steht in den Einstellungen im Reiter „Spielstand“, auch wenn der Dialog erst später aufgeht.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const root = path.join(__dirname, '..');
const NM = path.join(root, 'node_modules');

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) fails++; };
const waitFor = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-'));
  const PROGRESS_FILE = path.join(dir, 'progress.json');
  const PORT = 4391;
  const srv = spawn(process.execPath, [path.join(root, 'server.js')], { env: Object.assign({}, process.env, { PORT, PROGRESS: PROGRESS_FILE }), stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; srv.stdout.on('data', d => log += d); srv.stderr.on('data', d => log += d);
  for (let i = 0; i < 50 && !log.includes('läuft'); i++) await waitFor(100);
  ok(log.includes('http://localhost:' + PORT), 'npm start baut und startet den Server');

  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const fresh = async () => {
    const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
    await ctx.addInitScript(() => { try { if (!localStorage.getItem('ngfc.v1')) localStorage.setItem('ngfc.v1', '{"ich":{"start":1}}'); } catch (e) {} }); // Spiel-Einstieg gilt als erlebt
    await ctx.route('**/*', r => {
      const u = r.request().url();
      const m = u.match(/cdn\.jsdelivr\.net\/npm\/(@?[^@]+)@[^/]+\/(.*)$/);
      if (m) return r.fulfill({ body: fs.readFileSync(path.join(NM, m[1], m[2])), contentType: 'application/javascript' });
      if (u.startsWith('http://localhost:' + PORT)) return r.continue();
      return r.abort();
    });
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:' + PORT + '/');
    await page.waitForFunction(() => window.ts, null, { timeout: 30000 });
    return { ctx, page, errors };
  };

  // 1. Erster Start: Datei entsteht automatisch
  let { ctx, page, errors } = await fresh();
  await page.waitForFunction(() => hubSync === 'file', null, { timeout: 5000 }).catch(() => {});
  ok(await page.evaluate(() => hubSync === 'file') && !(await page.isVisible('#meDlg[open]')) && !(await page.isVisible('#syncState')), 'Der Speicherort wird gemerkt, auch solange die Einstellungen zu sind');
  await page.click('#meBtn'); await page.click('#meTab-spielstand');
  ok(await page.isVisible('#syncState') && (await page.textContent('#syncState')) === 'Dein Spielstand wird automatisch in progress.json gespeichert.', 'Einstellungen, Reiter „Spielstand“: wird automatisch in progress.json gespeichert');
  await page.click('#meClose');
  await page.evaluate(() => addXp(42, 'Test'));
  for (let i = 0; i < 30 && !(fs.existsSync(PROGRESS_FILE) && JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')).xp === 42); i++) await waitFor(100);
  ok(fs.existsSync(PROGRESS_FILE) && JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')).xp === 42, 'Neue XP stehen kurz danach in progress.json');
  ok(fs.readFileSync(PROGRESS_FILE, 'utf8').includes('\n  "xp": 42'), 'Datei ist lesbar formatiert');
  await page.evaluate(() => { localStorage.setItem('ngfc.ai', JSON.stringify({ provider: 'claude', key: 'sk-ant-geheim' })); addXp(8, 'Test'); });
  for (let i = 0; i < 30 && JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')).xp !== 50; i++) await waitFor(100);
  ok(JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')).xp === 50, 'Jede Änderung wird nachgeschrieben');
  ok(!fs.readFileSync(PROGRESS_FILE, 'utf8').includes('sk-ant-geheim'), 'KI-Schlüssel steht nicht in der Datei');
  ok(fs.existsSync(PROGRESS_FILE + '.bak'), 'Vorige Fassung bleibt als .bak liegen');
  ok(errors.length === 0, 'Keine JS-Fehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await ctx.close();

  // 2. Anderer Browser (leerer localStorage): Stand kommt aus der Datei
  ({ ctx, page, errors } = await fresh());
  await page.waitForFunction(() => S.xp === 50, null, { timeout: 5000 }).catch(() => {});
  ok(await page.evaluate(() => S.xp) === 50, 'Frischer Browser lädt den Stand aus progress.json');
  await ctx.close();

  // 3. Server schützt sich
  const r1 = await fetch('http://localhost:' + PORT + '/api/progress', { method: 'PUT', body: 'kaputt' });
  ok(r1.status === 400 && JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')).xp === 50, 'Kaputtes JSON wird abgelehnt, Datei bleibt heil');
  const r2 = await fetch('http://localhost:' + PORT + '/progress.json');
  ok(r2.status === 404, 'progress.json ist nicht als normale Datei abrufbar');
  const r3 = await fetch('http://localhost:' + PORT + '/../../etc/passwd');
  ok(r3.status === 404, 'Kein Zugriff außerhalb des Repo-Ordners');

  // 4. Server weg: Der Reiter „Spielstand“ sagt es, der Spielstand bleibt im Browser
  ({ ctx, page, errors } = await fresh());
  await page.waitForFunction(() => hubSync === 'file', null, { timeout: 5000 }).catch(() => {});
  await page.evaluate(() => meOpen('spielstand'));
  srv.kill(); await new Promise(r => srv.once('exit', r));
  await page.evaluate(() => addXp(5, 'Test'));
  await page.waitForFunction(() => hubSync === 'offline', null, { timeout: 5000 }).catch(() => {});
  ok((await page.textContent('#syncState')).includes('nicht erreichbar') && await page.evaluate(() => JSON.parse(localStorage.getItem('ngfc.v1')).xp === 55), 'Ohne Server: Der offene Reiter meldet es sofort, die XP bleiben im Browser');
  await page.click('#meClose'); await page.click('#meBtn'); await page.click('#meTab-spielstand');
  ok((await page.textContent('#syncState')).includes('nicht erreichbar'), 'Der Stand steht auch nach erneutem Öffnen da');
  ok(errors.length === 0, 'Keine JS-Fehler ohne Server' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await ctx.close();

  await browser.close();
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(fails ? '\n' + fails + ' Fehler' : '\nAlles grün');
  process.exit(fails ? 1 : 0);
})();
