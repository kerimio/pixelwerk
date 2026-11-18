// Gemeinsamer Start für Browser-Tests: öffnet index.html im echten Browser, ohne Netz (CodeMirror kommt aus node_modules).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');
const NM = path.join(root, 'node_modules');
const URL = 'file://' + path.join(root, 'index.html');

/* opts.stand:    Spielstand als Objekt (landet in localStorage ngfc.v1). Standard: nur „Einstieg schon erlebt“.
   opts.einstieg: true = ganz frischer Start ohne Spielstand (für Tests des Spiel-Einstiegs).
   opts.hash:     Seite, z. B. 'k03'. opts.viewport: { width, height }. opts.mobil: true = Handy-Größe mit Touch. */
async function oeffnen(opts = {}) {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext(opts.mobil ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: opts.viewport || { width: 1300, height: 900 } });
  const fehler = [];
  await ctx.route('**/*', r => {
    const u = r.request().url();
    const m = u.match(/cdn\.jsdelivr\.net\/npm\/(@?[^@]+)@[^/]+\/(.*)$/);
    if (m) return r.fulfill({ body: fs.readFileSync(path.join(NM, m[1], m[2])), contentType: 'application/javascript' });
    if (u.startsWith('file://')) return r.continue();
    return r.abort();
  });
  const stand = opts.einstieg ? null : JSON.stringify(opts.stand || { ich: { start: 1 } });
  await ctx.addInitScript(s => { try { if (s && !localStorage.getItem('ngfc.v1')) localStorage.setItem('ngfc.v1', s); } catch (e) {} }, stand);
  const page = await ctx.newPage();
  page.on('pageerror', e => fehler.push(e.message));
  await page.goto(URL + (opts.hash ? '#' + opts.hash : ''));
  await page.waitForSelector('#main');
  return { browser, ctx, page, fehler };
}

/* Neu laden, wenn vorher etwas in den Speicher geschrieben wurde. Unter file:// reicht Chromium localStorage verzögert an die
   neue Seite weiter, manchmal kommt dort ein alter oder leerer Stand an. neuLaden() merkt sich den Speicher, lädt neu und prüft
   noch vor dem Start der App, ob er vollständig angekommen ist. Wenn nicht: zurückschreiben und nochmal laden. */
const nlBekannt = new WeakSet();
async function neuLaden(page) {
  if (!nlBekannt.has(page)) {
    nlBekannt.add(page);
    await page.addInitScript(() => { try { window.__speicherBeimStart = JSON.stringify(Object.entries(localStorage).sort()); } catch (e) {} });
  }
  const soll = await page.evaluate(() => Object.entries(localStorage).sort());
  for (let n = 0; n < 8; n++) {
    await page.reload();
    if (await page.evaluate(s => window.__speicherBeimStart === s, JSON.stringify(soll))) return;
    await page.evaluate(e => { localStorage.clear(); e.forEach(([k, v]) => localStorage.setItem(k, v)); }, soll);
    await page.waitForTimeout(250);
  }
  throw new Error('Der Speicher kommt nach dem Neuladen nicht an');
}

/* const { ok, ende } = pruefer();  ok(Bedingung, 'Text');  am Schluss: await ende(browser, fehler); */
function pruefer() {
  let fails = 0;
  const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) fails++; };
  const ende = async (browser, fehler) => {
    if (fehler) ok(!fehler.length, 'keine JavaScript-Fehler' + (fehler.length ? ': ' + fehler.join(' | ') : ''));
    if (browser) await browser.close();
    if (fails) { console.error('\n' + fails + ' Prüfung(en) fehlgeschlagen'); process.exit(1); }
  };
  return { ok, ende };
}
module.exports = { oeffnen, pruefer, neuLaden, URL, root };
