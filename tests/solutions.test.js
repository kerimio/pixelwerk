// Prüft im echten Browser: Jede Musterlösung muss alle Tests ihrer Übung bestehen.
// CDN-Aufrufe (jsDelivr) werden auf node_modules umgeleitet, damit es offline läuft.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');
const NM = path.join(root, 'node_modules');

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  await page.addInitScript(() => { try { if (!localStorage.getItem('ngfc.v1')) localStorage.setItem('ngfc.v1', '{"ich":{"start":1}}'); } catch (e) {} }); // Spiel-Einstieg gilt als erlebt
  page.on('pageerror', e => console.log('Seitenfehler:', e.message));
  await page.route('**/*', r => {
    const u = r.request().url();
    const m = u.match(/cdn\.jsdelivr\.net\/npm\/(@?[^@]+)@[^/]+\/(.*)$/);
    if (m) return r.fulfill({ body: fs.readFileSync(path.join(NM, m[1], m[2])), contentType: 'application/javascript' });
    if (u.startsWith('file:')) return r.continue();
    return r.abort();
  });
  await page.goto('file://' + path.join(root, 'index.html'));
  await page.waitForFunction(() => window.ts, null, { timeout: 30000 });

  // NUR=ex20,k16 prüft nur einzelne Übungen (Übungs-id oder Kapitel-id), z. B. beim Schreiben eines neuen Kapitels.
  const nur = (process.env.NUR || '').split(',').map(x => x.trim()).filter(Boolean);
  const res = await page.evaluate(async nur => {
    const out = [];
    for (const ch of CH.filter(c => c.ex && (!nur.length || nur.includes(c.ex.id) || nur.includes(c.id)))) {
      const ex = ch.ex;
      const box = document.createElement('div'); document.body.appendChild(box);
      const be = ex.backend ? BACKENDS[ex.backend] : null;
      const r = await runTests(ex.solution, ex.tests.concat(codePruefungen(ex)), box, be, ex.modules);
      out.push({ id: ex.id, title: ex.title, fails: r.fatal ? [r.fatal] : r.results.filter(x => !x.ok).map(x => x.name + ': ' + x.msg) });
      box.remove();
    }
    return out;
  }, nur);

  // Schummeln muss auffallen: richtiges Ergebnis, aber ohne das geübte Konzept bzw. fest eingetragen
  const schummel = await page.evaluate(async () => {
    const box = document.createElement('div'); document.body.appendChild(box);
    const ex05 = CH.find(c => c.ex && c.ex.id === 'ex20').ex;
    const req = codePruefungen(ex05).map(t => t.name);
    const lit = codePruefungen({ starter: 'export function f(a: number) { return 0; }', solution: 'export function f(a: number) {\n  return a * 2;\n}', tests: [] });
    const r = await runTests('export function f(a: number) {\n  return 6;\n}', lit, box, null);
    box.remove();
    return { req, litFail: r.results.some(x => !x.ok && /fest/.test(x.msg)) };
  });
  console.log((schummel.req.some(n => /\?\?/.test(n)) ? '✓' : '✗') + ' Code-Check verlangt das geübte Konzept (' + schummel.req.join(' | ') + ')');
  console.log((schummel.litFail ? '✓' : '✗') + ' Fest eingetragenes Ergebnis fällt auf');
  if (!schummel.litFail || !schummel.req.some(n => /\?\?/.test(n))) process.exitCode = 1;

  await browser.close();
  let bad = 0;
  for (const r of res) {
    if (r.fails.length) { bad++; console.log('✗', r.id, r.title, '\n   ' + r.fails.join('\n   ')); }
    else console.log('✓', r.id, r.title);
  }
  console.log(`\n${res.length - bad}/${res.length} Übungen grün`);
  process.exit(bad || process.exitCode ? 1 : 0);
})();
