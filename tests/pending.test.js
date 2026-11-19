// Prüft im echten Browser: Geschafft zählt nur echte Arbeit (chapter.js, base.js: chapterEarned, chapterPending).
// 1. Kapitel mit Übung nur durchgeblättert: keine XP, keine Sachen, „Nur angeschaut“, halb markiert, „Wackelt noch“, nächstes Ticket geht weiter.
// 2. Über „Zur Übung“ zurück, Übung grün: Jetzt ist das Kapitel geschafft, mit XP und Wiederholkarten.
// 3. Kapitel ohne Übung: erst alle Quizfragen richtig, dann geschafft.
// 4. „Üben“ zu einem Thema nimmt die Übung aus dem Kopf mit dazu.
const { openPage, checker } = require('./helpers');
const { ok, ending } = checker();

async function flipThrough(page) {
  for (let n = 0; n < 40; n++) {
    const ann = await page.$('#cpAccept'); if (ann && await ann.isVisible()) { await ann.click(); continue; }
    const all = await page.$('.cp-all'); if (all && await all.isVisible()) { await all.click(); continue; }
    const nx = await page.$('#nextStep'); if (!nx || !(await nx.isVisible())) return;
    await nx.click(); await page.waitForTimeout(60);
  }
}

(async () => {
  {
    const { browser, page, problems } = await openPage({ hash: 'k13', standing: { player: { start: 1, name: 'Kerim' }, xp: 0 } });
    await page.waitForSelector('#stepBody');
    await flipThrough(page);
    await page.waitForSelector('.cp-pending');
    const s1 = await page.evaluate(() => ({ done: Object.keys(S.done), pending: Object.keys(S.pending || {}), xp: S.xp, wardrobe: S.wardrobe.length, srs: Object.keys(S.srs || {}).length, text: document.querySelector('.cp-pending').innerText }));
    ok(!s1.done.length && s1.pending.join() === 'k13' && s1.xp === 0 && !s1.wardrobe && !s1.srs, '1. Nur durchgeblättert: nicht geschafft, keine XP, keine Sachen, keine Wiederholkarten');
    ok(/Nur angeschaut/.test(s1.text) && /Übung grün/.test(s1.text) && /\+130 XP/.test(s1.text), 'Abschluss sagt „Nur angeschaut“ und was fehlt: ' + s1.text.replace(/\s+/g, ' ').slice(0, 80));
    ok(await page.evaluate(() => !document.querySelector('#cpNext.primary') && !!document.querySelector('#cpPendingGo.primary')), 'Hauptknopf ist „Zur Übung“, nicht „Nächstes Kapitel“');

    await page.evaluate(() => { location.hash = '#start'; });
    await page.waitForSelector('.hub-build');
    const hub = await page.evaluate(() => ({ construction: document.querySelector('.hub-build').innerText, link: [...document.querySelectorAll('.hub-build a.btn')].map(a => a.getAttribute('href')).join(), half: !!document.querySelector('.hub-k.pending[href="#k13"]'), next: currentChapter().id }));
    ok(/Übung noch offen/.test(hub.construction) && /Übung lösen/.test(hub.construction) && hub.link === '#k13', 'Schreibtisch: „Wackelt noch“ mit „Übung noch offen“ und „Übung lösen“');
    ok(hub.half, 'Auf dem Weg ist das Kapitel halb markiert');
    ok(hub.next !== 'k13', 'Das nächste Ticket ist ein anderes Kapitel (' + hub.next + ')');

    /* 2. Zurück: landet gleich in der Übung, grün = geschafft */
    await page.click('.hub-build a.btn');
    await page.waitForSelector('#runTests');
    ok(await page.evaluate(() => /Umsetzen/.test(document.querySelector('#stepQuiet').textContent)), '2. Zurück im Kapitel: gleich bei der Übung');
    await page.evaluate(() => document.querySelector('#editor .CodeMirror').CodeMirror.setValue(CH.find(c => c.id === 'k13').ex.solution));
    await page.click('#runTests');
    await page.waitForSelector('#tests .pass', { timeout: 30000 });
    await page.waitForFunction(() => S.done.k13);
    const s2 = await page.evaluate(() => ({ xp: S.xp, pending: Object.keys(S.pending || {}).length, srs: Object.keys(S.srs).filter(k => k.includes(':k13')).length, wardrobe: S.wardrobe.length }));
    ok(s2.xp === 180 && !s2.pending && s2.srs > 0 && s2.wardrobe > 0, 'Übung grün: Kapitel nachgeholt, 50 + 130 XP, Wiederholkarten und die Sache für den Avatar (' + JSON.stringify(s2) + ')');
    await ending(browser, problems);
  }
  {
    /* 3. Kapitel ohne Übung (g02): Durchblättern reicht nicht, alle Fragen richtig schon */
    const { browser, page, problems } = await openPage({ hash: 'g02', standing: { player: { start: 1, name: 'Kerim' }, xp: 0, done: { g01: Date.now() } } });
    await page.waitForSelector('#stepBody');
    await flipThrough(page);
    await page.waitForSelector('.cp-pending');
    ok(await page.evaluate(() => !S.done.g02 && S.pending.g02 && /Zum Quiz/.test(document.querySelector('#cpPendingGo').textContent)), '3. Ohne Übung: nur angeschaut, Knopf „Zum Quiz“');
    await page.click('#cpPendingGo');
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('.quiz .opt');
      const q = await page.evaluate(() => { const k = document.querySelector('#stepQuiet').textContent; return k; });
      if (await page.evaluate(() => document.querySelector('.quiz .opt.right'))) { await page.click('#nextStep'); continue; }
      await page.evaluate(() => { const ch = CH.find(c => c.id === 'g02'), h = document.querySelector('.quiz .q').textContent, q = ch.quiz.find(x => stripHtml(x.q) === h); document.querySelector('.quiz .opt[data-i="' + q.correct + '"]').click(); });
      if (i < 2) await page.click('#nextStep');
    }
    await page.waitForFunction(() => S.done.g02);
    ok(await page.evaluate(() => !S.pending.g02 && S.xp >= 40), 'Alle Fragen richtig: g02 nachträglich geschafft, mit XP');
    await ending(browser, problems);
  }
  {
    /* 4. Üben: Quizfragen des Kapitels, Zuordnen und die Übung aus dem Kopf */
    const { browser, page, problems } = await openPage({ hash: 'ueben-k06', standing: { player: { start: 1, name: 'Kerim' }, xp: 300, done: { k06: Date.now() - 864e5 }, quiz: { 'k06:0': 3 }, ex: { ex06: { passed: true, fails: 5, usedSolution: true } } } });
    await page.waitForSelector('#learnState');
    const n = await page.evaluate(() => CH.find(c => c.id === 'k06').quiz.length);
    ok((await page.textContent('#learnState')).includes('von ' + (n + 2)), '4. Üben: ' + n + ' Quizfragen, Zuordnen und die Übung aus dem Kopf');
    await ending(browser, problems);
  }
})().catch(e => { console.error(e); process.exit(1); });
