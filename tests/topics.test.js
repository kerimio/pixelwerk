// Prüft im echten Browser, wie sich die App ohne und mit KI nach dem Lernenden richtet (strengths.js):
// 1. Ohne KI: Themen aus dem Spielstand (wackelt, sitzt), „Wackelt noch“ auf dem Schreibtisch, ein Thema üben,
//    Wiederholen zieht wackelige Themen vor, Übung mit Lösung kommt früher, „sicher, aber falsch“ zählt, Einstellungen, Toni-Notiz.
// 2. Hilfe in der Übung: kommt nach dem Vorwissen aus dem Einstieg früher oder später, ohne KI mit Tipp.
// 3. Mit KI: „Neue Fragen von Toni“ zu einem wackeligen Thema, „Toni, was fehlt?“ in der Übung liest den Code.
const { openPage, checker } = require('./helpers');
const { ok, ending } = checker();
const TAG = 864e5;

/* k06 wackelt: zwei Quizfragen erst im dritten Versuch, Übung mit Lösung. g01 bis g06 sitzen: alles im ersten Versuch. */
const SOLID = ['g01', 'g02', 'g03', 'g04', 'g05', 'g06'];
function standing(more) {
  const quiz = { 'k06:0': 3, 'k06:1': 3, 'k06:2': 1 };
  SOLID.forEach(id => { for (let i = 0; i < 3; i++) quiz[id + ':' + i] = 1; });
  const done = { k06: Date.now() - 3 * TAG }; SOLID.forEach(id => { done[id] = Date.now() - 3 * TAG; });
  return Object.assign({ player: { start: 1, name: 'Kerim', level: 1 }, xp: 300, steps: {}, done, quiz, ex: { ex06: { passed: true, fails: 4, usedSolution: true } }, code: {}, days: [], badges: [], updated: 1 }, more || {});
}
const sse = evs => evs.map(e => 'data: ' + (typeof e === 'string' ? e : JSON.stringify(e)) + '\n\n').join('');
const claudeText = t => sse([{ type: 'message_start' }, { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: t } }, { type: 'message_stop' }]);

(async () => {
  /* ---------- 1. Ohne KI ---------- */
  {
    const { browser, page, problems } = await openPage({ standing: standing() });
    const t = await page.evaluate(() => { const m = {}; topics().forEach(x => { m[x.ch.id] = { standing: x.standing, reasons: x.reasons, weakOnes: x.weakOnes }; }); return m; });
    ok(t.k06 && t.k06.standing === 'wackelt' && t.k06.reasons.some(g => /Quizfragen erst im zweiten Anlauf/.test(g)) && t.k06.reasons.includes('Übung mit der Lösung geschafft'), 'k06 wackelt, mit Gründen in Worten: ' + (t.k06 && t.k06.reasons.join(' · ')));
    ok(SOLID.every(id => t[id] && t[id].standing === 'sitzt' && t[id].weakOnes === 0), 'Kapitel ohne Fehler sitzen');
    ok(await page.evaluate(() => topics()[0].ch.id === 'k06'), 'Das wackeligste Thema steht vorn');

    await page.waitForSelector('.hub-build');
    const construction = await page.evaluate(() => ({ text: document.querySelector('.hub-build').innerText, linkList: [...document.querySelectorAll('.hub-build a')].map(a => a.getAttribute('href')), ai: !!document.querySelector('#hubBuildAi') }));
    ok(construction.text.includes('Wackelt noch') && construction.text.includes(await page.evaluate(() => CH.find(c => c.id === 'k06').title)) && construction.linkList.join() === '#ueben-k06' && construction.ai, 'Schreibtisch: „Wackelt noch“ mit k06, „Üben“ und ohne KI der Hinweis „KI einrichten“ (keine Toni-Fragen)');
    ok(await page.evaluate(() => { const b = document.querySelector('.hub-build'), w = document.querySelector('.hub-repeat'), g = document.querySelector('.hub-path'); return w.compareDocumentPosition(b) & 4 && b.compareDocumentPosition(g) & 4; }), '„Wackelt noch“ steht zwischen Wiederholen und Dein Weg');

    /* Ein Thema üben: Fragen nur aus k06, eine falsche Antwort zählt in S.weak */
    await page.click('.hub-build a.btn');
    await page.waitForSelector('.learn-card .opt');
    const h1 = await page.textContent('.learn-head h1');
    ok(h1.startsWith('Üben: ') && (await page.textContent('#learnState')).includes('von'), 'Üben: eigene Überschrift „Üben: …“ und Stand der Runde');
    const wrong = await page.evaluate(() => { const b = [...document.querySelectorAll('.learn-card .opt')]; const lbl = document.querySelector('.learn-label').textContent; const k = CH.find(c => c.title === lbl.replace(/^Nochmal, bis es sitzt · /, '')); return k && k.id; });
    ok(wrong === 'k06', 'Üben zeigt Fragen aus genau diesem Thema');
    await page.evaluate(() => { const q = document.querySelector('.learn-question').textContent, ch = CH.find(c => c.id === 'k06'), i = ch.quiz.findIndex(x => stripHtml(x.q) === q); window.__i = i; const b = [...document.querySelectorAll('.learn-card .opt')].find(o => +o.dataset.i !== ch.quiz[i].correct); b.click(); });
    ok(await page.evaluate(() => (S.weak || {})['k06:' + window.__i] === 1), 'Daneben beim Üben zählt fürs Thema (S.weak)');

    /* Wiederholen: 20 fällige Karten aus sicheren Themen, 3 aus k06, gleich lange fällig. Die Runde hat 15 Plätze: k06 ist ganz dabei. */
    const before = await page.evaluate(() => {
      const alt = JSON.stringify(S), d = Date.now() - 2 * 864e5; S.srs = {};
      ['g01', 'g02', 'g03', 'g04', 'g05', 'g06'].forEach(id => CH.find(c => c.id === id).quiz.forEach((q, i) => { S.srs['q:' + id + ':' + i] = { s: 3, n: 1, l: 0, due: d }; }));
      [0, 1, 2].forEach(i => { S.srs['q:k06:' + i] = { s: 3, n: 1, l: 0, due: d }; });
      CH.forEach(c => { if (!S.done[c.id]) return; ['m:' + c.id, 'x:' + c.id].forEach(k => { S.srs[k] = { s: 3, n: 1, l: 0, due: Date.now() + 9 * 864e5 }; }); });
      let everyone = 0; for (let n = 0; n < 10; n++) { const r = repeatRound(); if (r.filter(k => k.startsWith('q:k06:')).length === 3) everyone++; }
      const amount = Object.keys(S.srs).filter(k => S.srs[k].due < Date.now()).length;
      S = JSON.parse(alt); return { everyone, amount };
    });
    ok(before.amount > 15 && before.everyone === 10, 'Wiederholen: Karten aus wackeligen Themen rücken vor (' + before.amount + ' fällig, 15 Plätze, k06 immer ganz dabei)');
    const unlocked = await page.evaluate(() => { let k = 0, g = 0; for (let n = 0; n < 80; n++) leUnlockedPool().forEach(x => { if (x === 'q:k06:2') k++; else if (x === 'q:g01:2') g++; }); return { k, g }; });
    ok(unlocked.k > unlocked.g * 1.5, 'Freie Runde zieht Fragen aus wackeligen Themen öfter (k06: ' + unlocked.k + ', g01: ' + unlocked.g + ')');
    const dayCount = await page.evaluate(() => { const alt = JSON.stringify(S); S.srs = {}; S.done = { k06: Date.now(), k02: Date.now() }; S.ex.ex02 = { passed: true, fails: 0 }; srsSeed(); const r = [leDaysUntil(S.srs['x:k06'].due), leDaysUntil(S.srs['x:k02'].due)]; S = JSON.parse(alt); return r; });
    ok(dayCount.join() === '2,4', 'Übung, die nur mit Lösung klappte, kommt nach 2 statt 4 Tagen aus dem Kopf (' + dayCount.join(', ') + ')');

    /* Sicher, aber falsch: zählt an der Karte (sf) und damit fürs Thema */
    await page.evaluate(() => { S.srs = { 'q:g02:0': { s: 3, n: 1, l: 0, due: Date.now() - 864e5 } }; CH.forEach(c => { if (S.done[c.id]) { ['m:', 'x:', 'z:'].forEach(p => { S.srs[p + c.id] = { s: 3, n: 1, l: 0, due: Date.now() + 9 * 864e5 }; }); c.quiz.forEach((q, i) => { if (!S.srs['q:' + c.id + ':' + i]) S.srs['q:' + c.id + ':' + i] = { s: 3, n: 1, l: 0, due: Date.now() + 9 * 864e5 }; }); } }); save(); location.hash = 'wdh'; });
    await page.waitForSelector('.learn-card .opt');
    await page.evaluate(() => { const q = CH.find(c => c.id === 'g02').quiz[0]; [...document.querySelectorAll('.learn-card .opt')].find(o => +o.dataset.i !== q.correct).click(); });
    await page.click('.cf[data-c="1"]');
    const sf = await page.evaluate(() => ({ sf: S.srs['q:g02:0'].sf, g: topicOf('g02').reasons.join() }));
    ok(sf.sf === 1 && /sicher, aber falsch/.test(sf.g), '„Sicher“ und daneben zählt fürs Thema: ' + sf.g);

    /* Einstellungen und Toni-Notiz */
    await page.evaluate(() => { location.hash = 'start'; meOpen('toni'); document.getElementById('hubLearnImage').open = true; });
    await page.waitForSelector('#pfBody .pf-chip');
    ok(await page.evaluate(() => document.querySelector('#hubLearnImage summary').textContent === 'Was die App über dich weiß' && document.querySelector('#pfBody a.pf-chip.no').getAttribute('href') === '#ueben-k06' && document.querySelectorAll('#pfBody .pf-chip.ok').length >= 5), 'Einstellungen: deine Themen auch ohne KI (rot zum Üben verlinkt, grün sitzt)');
    await page.click('#pfBody a.pf-chip.no'); await page.waitForSelector('.learn-card .opt');
    ok(await page.evaluate(() => !document.querySelector('dialog[open]') && location.hash === '#ueben-k06'), 'Ein rotes Thema öffnet die Übungsrunde und schließt die Einstellungen');
    const note = await page.evaluate(() => withProfile(TONI + '\nFrage: x'));
    ok(/THEMEN laut Spielstand/.test(note) && note.includes('Wackelt noch: „' + await page.evaluate(() => CH.find(c => c.id === 'k06').title)) && /Sitzt: /.test(note), 'Toni bekommt die Themen bei jeder Anfrage mit');
    ok(!/THEMEN/.test(await page.evaluate(() => { profile().off = true; const n = withProfile(TONI + '\nFrage: x'); profile().off = false; return n; })), 'Ist „Toni darf aus meinen Fragen lernen“ aus, gehen auch die Themen nicht mit');
    ok(await page.evaluate(() => KNOWLEDGE.some(w => w.t === 'Mehr Übung, wo es hakt')), '#wissen erklärt, dass die App sich nach den Themen richtet');
    ok(!problems.length, 'keine JavaScript-Fehler ohne KI' + (problems.length ? ': ' + problems.join(' | ') : ''));
    await browser.close();
  }

  /* ---------- 2. Hilfe in der Übung nach Vorwissen, ohne KI ---------- */
  for (const [level, ab] of [[0, 1], [2, 3]]) {
    const { browser, page, problems } = await openPage({ hash: 'k02', standing: { player: { start: 1, level } } });
    await page.waitForFunction(() => window.ts, null, { timeout: 30000 });
    await page.evaluate(() => { window.jumpTo = { id: 'k02', t: 'code' }; route(); });
    await page.waitForSelector('#runTests');
    const verify = async () => { await page.click('#runTests'); await page.waitForFunction(() => document.querySelector('#runTests').textContent === 'Prüfen' && document.querySelector('#tests .test.bad, #tests .test.fatal'), null, { timeout: 20000 }); };
    let firstly = 0;
    for (let n = 1; n <= 3 && !firstly; n++) { await verify(); if (await page.locator('.xc-nudge').count()) firstly = n; }
    ok(firstly === ab, 'Vorwissen ' + level + ': Hilfe kommt von selbst nach dem ' + ab + '. Fehlversuch (war: ' + firstly + ')');
    ok(await page.evaluate(() => !document.querySelector('#xcToniAsk') && document.querySelector('#xcTip').textContent === 'Tipp ansehen'), 'Ohne KI bietet sie den Tipp an, nicht Toni');
    await page.click('#xcTip');
    ok(await page.evaluate(() => document.querySelectorAll('#hints .hint').length === 1 && !document.querySelector('.xc-nudge')), '„Tipp ansehen“ zeigt Tipp 1, der Hinweis geht weg');
    ok(!problems.length, 'keine JavaScript-Fehler (Vorwissen ' + level + ')' + (problems.length ? ': ' + problems.join(' | ') : ''));
    await browser.close();
  }

  /* ---------- 3. Mit KI ---------- */
  {
    const { browser, ctx, page, problems } = await openPage({ standing: standing() });
    const reqs = []; let answer = '';
    await page.route('https://api.anthropic.com/**', r => { reqs.push(JSON.parse(r.request().postData() || '{}')); return r.fulfill({ status: 200, contentType: 'text/event-stream', body: claudeText(answer) }); });
    await page.evaluate(() => { localStorage.setItem('ngfc.ai', JSON.stringify({ provider: 'claude', key: 'sk-ant-test', model: 'claude-opus-5-5' })); route(); });
    await page.waitForSelector('.hub-build');
    ok(await page.evaluate(() => [...document.querySelectorAll('.hub-build a')].map(a => a.getAttribute('href')).join() === '#ueben-k06,#tonifragen-k06' && !document.querySelector('#hubBuildAi')), 'Mit KI: „Neue Fragen von Toni“ neben „Üben“');

    answer = JSON.stringify({ questions: [
      { q: 'Was macht <code>@Input()</code>? <img src=x onerror="window.__xss=1">', options: ['Nimmt Daten von außen an', 'Sendet ein Event', 'Startet die App', 'Nichts'], correct: 0, why: 'Ein Input kommt von der Eltern-Komponente.' },
      { q: 'Frage zwei?', options: ['a', 'b', 'c', 'd'], correct: 2, why: 'Weil c.' },
      { q: 'Kaputt', options: 'keine Liste', correct: 0 },
      { q: 'Frage drei?', options: ['a', 'b'], correct: 1, why: 'Weil b.' }
    ] });
    await page.click('.hub-build a.linkbtn');
    await page.waitForSelector('.learn-card .opt');
    const p = reqs[0], text = p.messages.map(m => m.content).join('\n');
    ok(/Schreib genau 3 neue Multiple-Choice-Fragen/.test(text) && text.includes(await page.evaluate(() => stripHtml(CH.find(c => c.id === 'k06').quiz[0].q))) && /Übung mit der Lösung geschafft/.test(text), 'Toni bekommt die Fragen, die daneben waren, und die Gründe');
    ok(/Antworte ausschließlich mit gültigem JSON/.test(p.system), 'Antwort als JSON verlangt');
    ok(await page.evaluate(() => !window.__xss && !document.querySelector('.learn-question img') && document.querySelector('.learn-question code').textContent === '@Input()'), 'Fragen der KI: <code> bleibt, anderes HTML wird Text (kein Skript)');
    ok((await page.textContent('.learn-label')).startsWith('Toni-Frage 1 von 3'), 'Kaputte Fragen fallen raus: 3 von 4 bleiben');
    await page.evaluate(() => document.querySelector('.learn-card .opt[data-i="0"]').click());
    ok(await page.evaluate(() => S.tf.k06.r === 1 && document.querySelector('.learn-why').textContent.includes('Eltern-Komponente')), 'Richtig: gezählt (S.tf) und mit Begründung');
    await page.click('#repeatNext');
    await page.evaluate(() => document.querySelector('.learn-card .opt[data-i="0"]').click());
    await page.click('#repeatNext');
    await page.evaluate(() => document.querySelector('.learn-card .opt[data-i="1"]').click());
    await page.click('#repeatNext');
    ok(await page.evaluate(() => document.querySelector('.learn-number').textContent === '2 von 3' && S.tf.k06.f === 1 && topicOf('k06').reasons.some(g => /Tonis Fragen/.test(g))), 'Bilanz 2 von 3, der Fehler zählt fürs Thema');
    await page.click('#tfMore'); await page.waitForSelector('.learn-card .opt');
    ok(/Diese Fragen hattest du schon gestellt/.test(reqs[1].messages.map(m => m.content).join('\n')), '„Noch 3 Fragen“: Toni bekommt die schon gestellten mit');
    answer = 'kein json';
    await page.evaluate(() => { location.hash = 'start'; }); await page.evaluate(() => { location.hash = 'tonifragen-k06'; });
    await page.waitForSelector('#tfAgain');
    ok(await page.isVisible('a[href="#ueben-k06"]'), 'Kaputte Antwort: Hinweis mit „Nochmal versuchen“ und „Ohne KI üben“');

    /* Übung: „Toni, was fehlt?“ liest den Code */
    answer = 'In Zeile 3 fehlt das Signal.';
    await page.waitForFunction(() => window.ts, null, { timeout: 30000 });
    await page.evaluate(() => { S.player.level = 0; window.jumpTo = { id: 'k02', t: 'code' }; location.hash = 'k02'; });
    await page.waitForSelector('#runTests');
    await page.evaluate(() => document.querySelector('#editor .CodeMirror').CodeMirror.setValue('// mein Code XYZ'));
    await page.click('#runTests'); await page.waitForSelector('.xc-nudge', { timeout: 20000 });
    ok(await page.evaluate(() => !!document.querySelector('#xcToniAsk') && !!document.querySelector('#xcTip')), 'Mit KI: „Toni, was fehlt?“ und der Tipp');
    const previous = reqs.length;
    await page.click('#xcToniAsk');
    await page.waitForFunction(() => /Zeile 3 fehlt das Signal/.test(document.querySelector('#xcToniOut').textContent));
    const q = reqs[previous].messages.map(m => m.content).join('\n');
    ok(q.includes('// mein Code XYZ') && /noch rot/.test(q) && /KEINE komplette Lösung/.test(q), 'Toni bekommt den Code, die roten Tests und soll nicht die Lösung verraten');
    ok(await page.evaluate(() => (S.profile.sig.hilfe || 0) >= 1), 'Zählt im Lernprofil als Hilfe');
    ok(!problems.length, 'keine JavaScript-Fehler mit KI' + (problems.length ? ': ' + problems.join(' | ') : ''));
    await browser.close();
  }
  await ending();
})().catch(e => { console.error(e); process.exit(1); });
