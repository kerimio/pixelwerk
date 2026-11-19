// Prüft im echten Browser: Geschafft zählt nur echte Arbeit (kapitel.js, basis.js: kapitelVerdient, kapitelOffen).
// 1. Kapitel mit Übung nur durchgeblättert: keine XP, keine Sachen, „Nur angeschaut“, halb markiert, „Wackelt noch“, nächstes Ticket geht weiter.
// 2. Über „Zur Übung“ zurück, Übung grün: Jetzt ist das Kapitel geschafft, mit XP und Wiederholkarten.
// 3. Kapitel ohne Übung: erst alle Quizfragen richtig, dann geschafft.
// 4. „Üben“ zu einem Thema nimmt die Übung aus dem Kopf mit dazu.
const { oeffnen, pruefer } = require('./hilfe');
const { ok, ende } = pruefer();

async function durchblaettern(page) {
  for (let n = 0; n < 40; n++) {
    const ann = await page.$('#kpAnnehmen'); if (ann && await ann.isVisible()) { await ann.click(); continue; }
    const all = await page.$('.kp-alles'); if (all && await all.isVisible()) { await all.click(); continue; }
    const nx = await page.$('#nextStep'); if (!nx || !(await nx.isVisible())) return;
    await nx.click(); await page.waitForTimeout(60);
  }
}

(async () => {
  {
    const { browser, page, fehler } = await oeffnen({ hash: 'k13', stand: { ich: { start: 1, name: 'Kerim' }, xp: 0 } });
    await page.waitForSelector('#stepBody');
    await durchblaettern(page);
    await page.waitForSelector('.kp-offen');
    const s1 = await page.evaluate(() => ({ done: Object.keys(S.done), offen: Object.keys(S.offen || {}), xp: S.xp, schrank: S.schrank.length, srs: Object.keys(S.srs || {}).length, text: document.querySelector('.kp-offen').innerText }));
    ok(!s1.done.length && s1.offen.join() === 'k13' && s1.xp === 0 && !s1.schrank && !s1.srs, '1. Nur durchgeblättert: nicht geschafft, keine XP, keine Sachen, keine Wiederholkarten');
    ok(/Nur angeschaut/.test(s1.text) && /Übung grün/.test(s1.text) && /\+130 XP/.test(s1.text), 'Abschluss sagt „Nur angeschaut“ und was fehlt: ' + s1.text.replace(/\s+/g, ' ').slice(0, 80));
    ok(await page.evaluate(() => !document.querySelector('#kpNaechstes.primary') && !!document.querySelector('#kpOffenLos.primary')), 'Hauptknopf ist „Zur Übung“, nicht „Nächstes Kapitel“');

    await page.evaluate(() => { location.hash = '#start'; });
    await page.waitForSelector('.hub-bau');
    const hub = await page.evaluate(() => ({ bau: document.querySelector('.hub-bau').innerText, link: [...document.querySelectorAll('.hub-bau a.btn')].map(a => a.getAttribute('href')).join(), halb: !!document.querySelector('.hub-k.offen[href="#k13"]'), next: currentChapter().id }));
    ok(/Übung noch offen/.test(hub.bau) && /Übung lösen/.test(hub.bau) && hub.link === '#k13', 'Schreibtisch: „Wackelt noch“ mit „Übung noch offen“ und „Übung lösen“');
    ok(hub.halb, 'Auf dem Weg ist das Kapitel halb markiert');
    ok(hub.next !== 'k13', 'Das nächste Ticket ist ein anderes Kapitel (' + hub.next + ')');

    /* 2. Zurück: landet gleich in der Übung, grün = geschafft */
    await page.click('.hub-bau a.btn');
    await page.waitForSelector('#runTests');
    ok(await page.evaluate(() => /Umsetzen/.test(document.querySelector('#stepQuiet').textContent)), '2. Zurück im Kapitel: gleich bei der Übung');
    await page.evaluate(() => document.querySelector('#editor .CodeMirror').CodeMirror.setValue(CH.find(c => c.id === 'k13').ex.solution));
    await page.click('#runTests');
    await page.waitForSelector('#tests .pass', { timeout: 30000 });
    await page.waitForFunction(() => S.done.k13);
    const s2 = await page.evaluate(() => ({ xp: S.xp, offen: Object.keys(S.offen || {}).length, srs: Object.keys(S.srs).filter(k => k.includes(':k13')).length, schrank: S.schrank.length }));
    ok(s2.xp === 180 && !s2.offen && s2.srs > 0 && s2.schrank > 0, 'Übung grün: Kapitel nachgeholt, 50 + 130 XP, Wiederholkarten und die Sache für den Avatar (' + JSON.stringify(s2) + ')');
    await ende(browser, fehler);
  }
  {
    /* 3. Kapitel ohne Übung (g02): Durchblättern reicht nicht, alle Fragen richtig schon */
    const { browser, page, fehler } = await oeffnen({ hash: 'g02', stand: { ich: { start: 1, name: 'Kerim' }, xp: 0, done: { g01: Date.now() } } });
    await page.waitForSelector('#stepBody');
    await durchblaettern(page);
    await page.waitForSelector('.kp-offen');
    ok(await page.evaluate(() => !S.done.g02 && S.offen.g02 && /Zum Quiz/.test(document.querySelector('#kpOffenLos').textContent)), '3. Ohne Übung: nur angeschaut, Knopf „Zum Quiz“');
    await page.click('#kpOffenLos');
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('.quiz .opt');
      const q = await page.evaluate(() => { const k = document.querySelector('#stepQuiet').textContent; return k; });
      if (await page.evaluate(() => document.querySelector('.quiz .opt.right'))) { await page.click('#nextStep'); continue; }
      await page.evaluate(() => { const ch = CH.find(c => c.id === 'g02'), h = document.querySelector('.quiz .q').textContent, q = ch.quiz.find(x => stripHtml(x.q) === h); document.querySelector('.quiz .opt[data-i="' + q.correct + '"]').click(); });
      if (i < 2) await page.click('#nextStep');
    }
    await page.waitForFunction(() => S.done.g02);
    ok(await page.evaluate(() => !S.offen.g02 && S.xp >= 40), 'Alle Fragen richtig: g02 nachträglich geschafft, mit XP');
    await ende(browser, fehler);
  }
  {
    /* 4. Üben: Quizfragen des Kapitels, Zuordnen und die Übung aus dem Kopf */
    const { browser, page, fehler } = await oeffnen({ hash: 'ueben-k06', stand: { ich: { start: 1, name: 'Kerim' }, xp: 300, done: { k06: Date.now() - 864e5 }, quiz: { 'k06:0': 3 }, ex: { ex06: { passed: true, fails: 5, usedSolution: true } } } });
    await page.waitForSelector('#leStand');
    const n = await page.evaluate(() => CH.find(c => c.id === 'k06').quiz.length);
    ok((await page.textContent('#leStand')).includes('von ' + (n + 2)), '4. Üben: ' + n + ' Quizfragen, Zuordnen und die Übung aus dem Kopf');
    await ende(browser, fehler);
  }
})().catch(e => { console.error(e); process.exit(1); });
