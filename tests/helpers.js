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
async function openPage(opts = {}) {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext(opts.mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: opts.viewport || { width: 1300, height: 900 } });
  const problems = [];
  await ctx.route('**/*', r => {
    const u = r.request().url();
    const m = u.match(/cdn\.jsdelivr\.net\/npm\/(@?[^@]+)@[^/]+\/(.*)$/);
    if (m) return r.fulfill({ body: fs.readFileSync(path.join(NM, m[1], m[2])), contentType: 'application/javascript' });
    if (u.startsWith('file://')) return r.continue();
    return r.abort();
  });
  const standing = opts.intro ? null : JSON.stringify(opts.standing || { player: { start: 1 } });
  await ctx.addInitScript(s => { try { if (s && !localStorage.getItem('ngfc.v1')) localStorage.setItem('ngfc.v1', s); } catch (e) {} }, standing);
  const page = await ctx.newPage();
  page.on('pageerror', e => problems.push(e.message));
  await page.goto(URL + (opts.hash ? '#' + opts.hash : ''));
  await page.waitForSelector('#main');
  return { browser, ctx, page, problems };
}

/* Neu laden, wenn vorher etwas in den Speicher geschrieben wurde. Unter file:// reicht Chromium localStorage verzögert an die
   neue Seite weiter, manchmal kommt dort ein alter oder leerer Stand an. reloadIt() merkt sich den Speicher, lädt neu und prüft
   noch vor dem Start der App, ob er vollständig angekommen ist. Wenn nicht: zurückschreiben und nochmal laden. */
const nlKnown = new WeakSet();
async function reloadIt(page) {
  if (!nlKnown.has(page)) {
    nlKnown.add(page);
    await page.addInitScript(() => { try { window.__saveOnStart = JSON.stringify(Object.entries(localStorage).sort()); } catch (e) {} });
  }
  const should = await page.evaluate(() => Object.entries(localStorage).sort());
  for (let n = 0; n < 8; n++) {
    await page.reload();
    if (await page.evaluate(s => window.__saveOnStart === s, JSON.stringify(should))) return;
    await page.evaluate(e => { localStorage.clear(); e.forEach(([k, v]) => localStorage.setItem(k, v)); }, should);
    await page.waitForTimeout(250);
  }
  throw new Error('Der Speicher kommt nach dem Neuladen nicht an');
}

/* const { ok, ende } = pruefer();  ok(Bedingung, 'Text');  am Schluss: await ende(browser, fehler); */
function checker() {
  let fails = 0;
  const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) fails++; };
  const ending = async (browser, problems) => {
    if (problems) ok(!problems.length, 'keine JavaScript-Fehler' + (problems.length ? ': ' + problems.join(' | ') : ''));
    if (browser) await browser.close();
    if (fails) { console.error('\n' + fails + ' Prüfung(en) fehlgeschlagen'); process.exit(1); }
  };
  return { ok, ending };
}
module.exports = { openPage, checker, reloadIt, URL, root };
