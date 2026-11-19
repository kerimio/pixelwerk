// Prüft die Werkstatt im echten Browser:
// - Bug-Jagd: Der kaputte Startcode muss mindestens einen Test rot machen, die Lösung alle grün.
// - Was gibt das aus?: Jeder Schnipsel wird wirklich ausgeführt, die Ausgabe muss zur Lösung passen.
// - Code-Review und Interview: Daten sind vollständig, Zeilennummern zeigen auf echte Zeilen.
// - Oberfläche: Die vier Modi lassen sich durchklicken.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');
const NM = path.join(root, 'node_modules');

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage();
  await page.addInitScript(() => { try { if (!localStorage.getItem('ngfc.v1')) localStorage.setItem('ngfc.v1', '{"ich":{"start":1}}'); } catch (e) {} }); // Spiel-Einstieg gilt als erlebt
  const errors = [];
  page.on('pageerror', e => { errors.push(e.message); console.log('Seitenfehler:', e.message); });
  await page.route('**/*', r => {
    const u = r.request().url();
    const m = u.match(/cdn\.jsdelivr\.net\/npm\/(@?[^@]+)@[^/]+\/(.*)$/);
    if (m) return r.fulfill({ body: fs.readFileSync(path.join(NM, m[1], m[2])), contentType: 'application/javascript' });
    if (u.startsWith('file:')) return r.continue();
    return r.abort();
  });
  await page.goto('file://' + path.join(root, 'index.html'));
  await page.waitForFunction(() => window.ts, null, { timeout: 30000 });
  let bad = 0;
  const ok = (cond, name, extra) => { if (cond) console.log('✓', name); else { bad++; console.log('✗', name, extra ? '\n   ' + extra : ''); } };

  /* ---- Bug-Jagd ---- */
  const bugs = await page.evaluate(async () => {
    const out = [];
    for (const b of BUGS) {
      const ex = b.ex; const box = document.createElement('div'); document.body.appendChild(box);
      const s = await runTests(ex.starter, ex.tests, box, null, ex.modules);
      const l = await runTests(ex.solution, ex.tests.concat(codeChecks(ex)), box, null, ex.modules);
      out.push({ id: b.id, title: ex.title,
        starterFails: s.fatal ? 1 : s.results.filter(x => !x.ok).length,
        starterFatal: s.fatal || null,
        solFails: l.fatal ? [l.fatal] : l.results.filter(x => !x.ok).map(x => x.name + ': ' + x.msg) });
      box.remove();
    }
    return out;
  });
  for (const b of bugs) {
    ok(b.starterFails > 0 && !b.starterFatal, b.id + ' Startcode ist kaputt (' + b.starterFails + ' rot)', b.starterFatal || 'Startcode besteht alle Tests');
    ok(!b.solFails.length, b.id + ' Lösung grün', b.solFails.join('\n   '));
  }

  /* ---- Was gibt das aus? ---- */
  if (await page.evaluate(() => typeof OUTPUTS !== 'undefined')) {
    const outs = await page.evaluate(async () => {
      const res = [];
      for (const o of OUTPUTS) { const got = await runOutput(o); res.push({ id: o.id, got, want: o.lines, distractOk: !(o.distract || []).some(d => o.lines.includes(d)) }); }
      return res;
    });
    for (const o of outs) {
      ok(JSON.stringify(o.got) === JSON.stringify(o.want), o.id + ' Ausgabe stimmt', 'erwartet ' + JSON.stringify(o.want) + ', wirklich ' + JSON.stringify(o.got));
      ok(o.distractOk, o.id + ' Ablenker kommen nicht in der Lösung vor');
    }
  }

  /* ---- Code-Review ---- */
  if (await page.evaluate(() => typeof REVIEWS !== 'undefined')) {
    const revs = await page.evaluate(() => REVIEWS.map(r => { const n = r.code.split('\n').length; return { id: r.id, bad: r.issues.filter(i => !i.lines.length || i.lines.some(l => l < 1 || l > n) || !i.reasonWhy || !i.heading).map(i => i.heading), dup: r.issues.flatMap(i => i.lines).length !== new Set(r.issues.flatMap(i => i.lines)).size, drop: (r.drop || []).filter(f => f.line < 1 || r.issues.some(i => i.lines.includes(f.line))).map(f => f.find), n: r.issues.length }; }));
    for (const r of revs) ok(!r.bad.length && !r.dup && !r.drop.length && r.n >= 3, r.id + ' Review-Daten gültig', JSON.stringify(r));
  }
  if (await page.evaluate(() => typeof INTERVIEW !== 'undefined')) {
    const iv = await page.evaluate(() => INTERVIEW.filter(q => !q.q || !q.points || q.points.length < 3 || !q.topic || !q.stage).map(q => q.id));
    ok(!iv.length, 'Interview-Fragen vollständig', iv.join(', '));
  }

  /* ---- Oberfläche ---- */
  const ui = async (name, fn) => { try { await fn(); ok(true, name); } catch (e) { ok(false, name, e.message); } };
  await ui('Werkstatt-Übersicht', async () => {
    await page.evaluate(() => { location.hash = '#training'; });
    await page.waitForSelector('.arena-grid', { timeout: 3000 });
    if (await page.locator('#main .arena-grid ~ *').count()) throw new Error('Unter den Karten steht noch etwas (die Begründung gehört nach #wissen)');
  });
  const mainButtons = () => page.evaluate(() => [...document.querySelectorAll('#main .btn.primary')].filter(b => b.offsetParent && !b.disabled).map(b => b.id).join());
  await ui('Bug-Jagd: Bug öffnen, Lösung einfügen, grün', async () => {
    await page.evaluate(() => { location.hash = '#bug-bug02'; });
    await page.waitForSelector('#runTests', { timeout: 3000 });
    await page.waitForFunction(() => document.querySelector('.CodeMirror'), null, { timeout: 5000 });
    if ((await mainButtons()) !== 'runTests') throw new Error('Offener Bug: Die eine Hauptaktion soll „Prüfen“ sein, ist aber: ' + await mainButtons());
    await page.evaluate(() => document.querySelector('.CodeMirror').CodeMirror.setValue(BUGS[1].ex.solution));
    await page.click('#runTests');
    await page.waitForSelector('.pass', { timeout: 5000 });
    await page.waitForSelector('.bug-why', { timeout: 3000 });
    if (!(await page.evaluate(() => S.arena.bug.bug02))) throw new Error('Bug nicht als gelöst gespeichert');
    if ((await mainButtons()) !== 'bugNext') throw new Error('Gefixter Bug: Die eine Hauptaktion soll „Nächster Bug“ sein, ist aber: ' + await mainButtons());
  });
  await ui('Was gibt das aus?: richtige Reihenfolge wird erkannt', async () => {
    await page.evaluate(() => { location.hash = '#ausgabe'; });
    await page.waitForSelector('.out-tiles', { timeout: 3000 });
    const id = await page.evaluate(() => document.querySelector('.out-card').dataset.id);
    const lines = await page.evaluate(id => OUTPUTS.find(o => o.id === id).lines, id);
    for (const l of lines) await page.evaluate(l => [...document.querySelectorAll('.out-tiles .tile:not([disabled])')].find(b => b.dataset.v === l).click(), l);
    await page.click('#outCheck');
    await page.waitForSelector('.out-res.right', { timeout: 2000 });
  });
  await ui('Was gibt das aus?: falsche Reihenfolge wird erkannt', async () => {
    await page.click('#outNext');
    await page.waitForSelector('.out-tiles', { timeout: 3000 });
    const id = await page.evaluate(() => document.querySelector('.out-card').dataset.id);
    const lines = await page.evaluate(id => { const o = OUTPUTS.find(o => o.id === id); return o.lines.length > 1 ? o.lines.slice().reverse() : (o.distract || []).slice(0, 1); }, id);
    for (const l of lines) await page.evaluate(l => [...document.querySelectorAll('.out-tiles .tile:not([disabled])')].find(b => b.dataset.v === l).click(), l);
    await page.click('#outCheck');
    await page.waitForSelector('.out-res.wrong', { timeout: 2000 });
  });
  await ui('Code-Review: alle Probleme markieren = volle Punktzahl', async () => {
    await page.evaluate(() => { location.hash = '#review-' + REVIEWS[0].id; });
    await page.waitForSelector('.rv-code', { timeout: 3000 });
    const lines = await page.evaluate(() => REVIEWS[0].issues.map(i => i.lines[0]));
    for (const l of lines) await page.click('.rv-line[data-n="' + l + '"]');
    if ((await mainButtons()) !== 'rvSubmit') throw new Error('Offenes Review: Die eine Hauptaktion soll „Review abschicken“ sein, ist aber: ' + await mainButtons());
    await page.click('#rvSubmit');
    await page.waitForSelector('.rv-result', { timeout: 2000 });
    if ((await mainButtons()) !== 'rvNext') throw new Error('Abgeschicktes Review: Die eine Hauptaktion soll „Nächster PR“ sein, ist aber: ' + await mainButtons());
    const txt = await page.textContent('.rv-result .score');
    if (!txt.startsWith(lines.length + '/' + lines.length)) throw new Error('Punktzahl: ' + txt);
  });
  await ui('Code-Review: Fehlalarm wird gezählt', async () => {
    await page.evaluate(() => { location.hash = '#review-' + REVIEWS[1].id; });
    await page.waitForSelector('.rv-code', { timeout: 3000 });
    const free = await page.evaluate(() => { const r = REVIEWS[1]; const used = new Set(r.issues.flatMap(i => i.lines)); for (let n = 1; n <= r.code.split('\n').length; n++) if (!used.has(n)) return n; });
    await page.click('.rv-line[data-n="' + free + '"]');
    await page.click('#rvSubmit');
    await page.waitForSelector('.rv-line.fa', { timeout: 2000 });
  });
  await ui('Interview: Frage, Antwort, Selbstcheck ohne KI', async () => {
    await page.evaluate(() => { location.hash = '#interview'; });
    await page.waitForSelector('#ivStart', { timeout: 3000 });
    await page.click('#ivStart');
    await page.waitForSelector('#ivAnswer', { timeout: 2000 });
    await page.fill('#ivAnswer', 'Testantwort mit ein paar Worten.');
    await page.click('#ivSubmit');
    await page.waitForSelector('.iv-check input', { timeout: 3000 });
    await page.click('.iv-check input');
    await page.click('#ivNext');
    await page.waitForSelector('#ivAnswer', { timeout: 2000 });
  });
  await ui('Schreibtisch führt in die Werkstatt, jede Seite der Werkstatt eine Ebene zurück', async () => {
    await page.evaluate(() => { location.hash = '#start'; });
    await page.waitForSelector('#main a.hub-work[href="#training"]', { timeout: 3000 });
    await page.click('#main a.hub-work');
    await page.waitForSelector('.arena-grid', { timeout: 3000 });
    if ((await page.getAttribute('#main .loc a', 'href')) !== '#start') throw new Error('Werkstatt: Weg zurück zum Schreibtisch fehlt');
    await page.click('.arena-card[href="#bug"]');
    await page.waitForSelector('#main .league', { timeout: 3000 });
    if ((await page.getAttribute('#main .loc a', 'href')) !== '#training') throw new Error('Bug-Jagd: Weg zurück zur Werkstatt fehlt');
    await page.click('#main .match');
    await page.waitForSelector('#bugBody #runTests', { timeout: 3000 });
    if ((await page.getAttribute('#main .loc a', 'href')) !== '#bug') throw new Error('Bug: Weg zurück zur Bug-Jagd fehlt');
  });
  ok(!errors.length, 'Keine Seitenfehler', errors.join('\n   '));
  await browser.close();
  console.log(bad ? '\n' + bad + ' Fehler' : '\nWerkstatt grün');
  process.exit(bad ? 1 : 0);
})();
