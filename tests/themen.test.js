// Prüft im echten Browser, wie sich die App ohne und mit KI nach dem Lernenden richtet (staerken.js):
// 1. Ohne KI: Themen aus dem Spielstand (wackelt, sitzt), „Wackelt noch“ auf dem Schreibtisch, ein Thema üben,
//    Wiederholen zieht wackelige Themen vor, Übung mit Lösung kommt früher, „sicher, aber falsch“ zählt, Einstellungen, Toni-Notiz.
// 2. Hilfe in der Übung: kommt nach dem Vorwissen aus dem Einstieg früher oder später, ohne KI mit Tipp.
// 3. Mit KI: „Neue Fragen von Toni“ zu einem wackeligen Thema, „Toni, was fehlt?“ in der Übung liest den Code.
const { oeffnen, pruefer } = require('./hilfe');
const { ok, ende } = pruefer();
const TAG = 864e5;

/* k06 wackelt: zwei Quizfragen erst im dritten Versuch, Übung mit Lösung. g01 bis g06 sitzen: alles im ersten Versuch. */
const SITZT = ['g01', 'g02', 'g03', 'g04', 'g05', 'g06'];
function stand(mehr) {
  const quiz = { 'k06:0': 3, 'k06:1': 3, 'k06:2': 1 };
  SITZT.forEach(id => { for (let i = 0; i < 3; i++) quiz[id + ':' + i] = 1; });
  const done = { k06: Date.now() - 3 * TAG }; SITZT.forEach(id => { done[id] = Date.now() - 3 * TAG; });
  return Object.assign({ ich: { start: 1, name: 'Kerim', level: 1 }, xp: 300, steps: {}, done, quiz, ex: { ex06: { passed: true, fails: 4, usedSolution: true } }, code: {}, days: [], badges: [], updated: 1 }, mehr || {});
}
const sse = evs => evs.map(e => 'data: ' + (typeof e === 'string' ? e : JSON.stringify(e)) + '\n\n').join('');
const claudeText = t => sse([{ type: 'message_start' }, { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: t } }, { type: 'message_stop' }]);

(async () => {
  /* ---------- 1. Ohne KI ---------- */
  {
    const { browser, page, fehler } = await oeffnen({ stand: stand() });
    const t = await page.evaluate(() => { const m = {}; themen().forEach(x => { m[x.ch.id] = { stand: x.stand, gruende: x.gruende, schwach: x.schwach }; }); return m; });
    ok(t.k06 && t.k06.stand === 'wackelt' && t.k06.gruende.some(g => /Quizfragen erst im zweiten Anlauf/.test(g)) && t.k06.gruende.includes('Übung mit der Lösung geschafft'), 'k06 wackelt, mit Gründen in Worten: ' + (t.k06 && t.k06.gruende.join(' · ')));
    ok(SITZT.every(id => t[id] && t[id].stand === 'sitzt' && t[id].schwach === 0), 'Kapitel ohne Fehler sitzen');
    ok(await page.evaluate(() => themen()[0].ch.id === 'k06'), 'Das wackeligste Thema steht vorn');

    await page.waitForSelector('.hub-bau');
    const bau = await page.evaluate(() => ({ text: document.querySelector('.hub-bau').innerText, links: [...document.querySelectorAll('.hub-bau a')].map(a => a.getAttribute('href')), ki: !!document.querySelector('#hubBauKi') }));
    ok(bau.text.includes('Wackelt noch') && bau.text.includes(await page.evaluate(() => CH.find(c => c.id === 'k06').title)) && bau.links.join() === '#ueben-k06' && bau.ki, 'Schreibtisch: „Wackelt noch“ mit k06, „Üben“ und ohne KI der Hinweis „KI einrichten“ (keine Toni-Fragen)');
    ok(await page.evaluate(() => { const b = document.querySelector('.hub-bau'), w = document.querySelector('.hub-wdh'), g = document.querySelector('.hub-weg'); return w.compareDocumentPosition(b) & 4 && b.compareDocumentPosition(g) & 4; }), '„Wackelt noch“ steht zwischen Wiederholen und Dein Weg');

    /* Ein Thema üben: Fragen nur aus k06, eine falsche Antwort zählt in S.weak */
    await page.click('.hub-bau a.btn');
    await page.waitForSelector('.le-karte .opt');
    const h1 = await page.textContent('.le-kopf h1');
    ok(h1.startsWith('Üben: ') && (await page.textContent('#leStand')).includes('von'), 'Üben: eigene Überschrift „Üben: …“ und Stand der Runde');
    const falsch = await page.evaluate(() => { const b = [...document.querySelectorAll('.le-karte .opt')]; const lbl = document.querySelector('.le-label').textContent; const k = CH.find(c => c.title === lbl.replace(/^Nochmal, bis es sitzt · /, '')); return k && k.id; });
    ok(falsch === 'k06', 'Üben zeigt Fragen aus genau diesem Thema');
    await page.evaluate(() => { const q = document.querySelector('.le-frage').textContent, ch = CH.find(c => c.id === 'k06'), i = ch.quiz.findIndex(x => stripHtml(x.q) === q); window.__i = i; const b = [...document.querySelectorAll('.le-karte .opt')].find(o => +o.dataset.i !== ch.quiz[i].correct); b.click(); });
    ok(await page.evaluate(() => (S.weak || {})['k06:' + window.__i] === 1), 'Daneben beim Üben zählt fürs Thema (S.weak)');

    /* Wiederholen: 20 fällige Karten aus sicheren Themen, 3 aus k06, gleich lange fällig. Die Runde hat 15 Plätze: k06 ist ganz dabei. */
    const vor = await page.evaluate(() => {
      const alt = JSON.stringify(S), d = Date.now() - 2 * 864e5; S.srs = {};
      ['g01', 'g02', 'g03', 'g04', 'g05', 'g06'].forEach(id => CH.find(c => c.id === id).quiz.forEach((q, i) => { S.srs['q:' + id + ':' + i] = { s: 3, n: 1, l: 0, due: d }; }));
      [0, 1, 2].forEach(i => { S.srs['q:k06:' + i] = { s: 3, n: 1, l: 0, due: d }; });
      CH.forEach(c => { if (!S.done[c.id]) return; ['m:' + c.id, 'x:' + c.id].forEach(k => { S.srs[k] = { s: 3, n: 1, l: 0, due: Date.now() + 9 * 864e5 }; }); });
      let alle = 0; for (let n = 0; n < 10; n++) { const r = wdhRunde(); if (r.filter(k => k.startsWith('q:k06:')).length === 3) alle++; }
      const anzahl = Object.keys(S.srs).filter(k => S.srs[k].due < Date.now()).length;
      S = JSON.parse(alt); return { alle, anzahl };
    });
    ok(vor.anzahl > 15 && vor.alle === 10, 'Wiederholen: Karten aus wackeligen Themen rücken vor (' + vor.anzahl + ' fällig, 15 Plätze, k06 immer ganz dabei)');
    const frei = await page.evaluate(() => { let k = 0, g = 0; for (let n = 0; n < 80; n++) leFreiPool().forEach(x => { if (x === 'q:k06:2') k++; else if (x === 'q:g01:2') g++; }); return { k, g }; });
    ok(frei.k > frei.g * 1.5, 'Freie Runde zieht Fragen aus wackeligen Themen öfter (k06: ' + frei.k + ', g01: ' + frei.g + ')');
    const tage = await page.evaluate(() => { const alt = JSON.stringify(S); S.srs = {}; S.done = { k06: Date.now(), k02: Date.now() }; S.ex.ex02 = { passed: true, fails: 0 }; srsSeed(); const r = [leTageBis(S.srs['x:k06'].due), leTageBis(S.srs['x:k02'].due)]; S = JSON.parse(alt); return r; });
    ok(tage.join() === '2,4', 'Übung, die nur mit Lösung klappte, kommt nach 2 statt 4 Tagen aus dem Kopf (' + tage.join(', ') + ')');

    /* Sicher, aber falsch: zählt an der Karte (sf) und damit fürs Thema */
    await page.evaluate(() => { S.srs = { 'q:g02:0': { s: 3, n: 1, l: 0, due: Date.now() - 864e5 } }; CH.forEach(c => { if (S.done[c.id]) { ['m:', 'x:'].forEach(p => { S.srs[p + c.id] = { s: 3, n: 1, l: 0, due: Date.now() + 9 * 864e5 }; }); c.quiz.forEach((q, i) => { if (!S.srs['q:' + c.id + ':' + i]) S.srs['q:' + c.id + ':' + i] = { s: 3, n: 1, l: 0, due: Date.now() + 9 * 864e5 }; }); } }); save(); location.hash = 'wdh'; });
    await page.waitForSelector('.le-karte .opt');
    await page.evaluate(() => { const q = CH.find(c => c.id === 'g02').quiz[0]; [...document.querySelectorAll('.le-karte .opt')].find(o => +o.dataset.i !== q.correct).click(); });
    await page.click('.cf[data-c="1"]');
    const sf = await page.evaluate(() => ({ sf: S.srs['q:g02:0'].sf, g: themaVon('g02').gruende.join() }));
    ok(sf.sf === 1 && /sicher, aber falsch/.test(sf.g), '„Sicher“ und daneben zählt fürs Thema: ' + sf.g);

    /* Einstellungen und Toni-Notiz */
    await page.evaluate(() => { location.hash = 'start'; ichOeffnen('toni'); document.getElementById('hubLernbild').open = true; });
    await page.waitForSelector('#pfBody .pf-chip');
    ok(await page.evaluate(() => document.querySelector('#hubLernbild summary').textContent === 'Was die App über dich weiß' && document.querySelector('#pfBody a.pf-chip.no').getAttribute('href') === '#ueben-k06' && document.querySelectorAll('#pfBody .pf-chip.ok').length >= 5), 'Einstellungen: deine Themen auch ohne KI (rot zum Üben verlinkt, grün sitzt)');
    await page.click('#pfBody a.pf-chip.no'); await page.waitForSelector('.le-karte .opt');
    ok(await page.evaluate(() => !document.querySelector('dialog[open]') && location.hash === '#ueben-k06'), 'Ein rotes Thema öffnet die Übungsrunde und schließt die Einstellungen');
    const note = await page.evaluate(() => mitProfil(TONI + '\nFrage: x'));
    ok(/THEMEN laut Spielstand/.test(note) && note.includes('Wackelt noch: „' + await page.evaluate(() => CH.find(c => c.id === 'k06').title)) && /Sitzt: /.test(note), 'Toni bekommt die Themen bei jeder Anfrage mit');
    ok(!/THEMEN/.test(await page.evaluate(() => { profil().aus = true; const n = mitProfil(TONI + '\nFrage: x'); profil().aus = false; return n; })), 'Ist „Toni darf aus meinen Fragen lernen“ aus, gehen auch die Themen nicht mit');
    ok(await page.evaluate(() => WISSEN.some(w => w.t === 'Mehr Übung, wo es hakt')), '#wissen erklärt, dass die App sich nach den Themen richtet');
    ok(!fehler.length, 'keine JavaScript-Fehler ohne KI' + (fehler.length ? ': ' + fehler.join(' | ') : ''));
    await browser.close();
  }

  /* ---------- 2. Hilfe in der Übung nach Vorwissen, ohne KI ---------- */
  for (const [level, ab] of [[0, 1], [2, 3]]) {
    const { browser, page, fehler } = await oeffnen({ hash: 'k02', stand: { ich: { start: 1, level } } });
    await page.waitForFunction(() => window.ts, null, { timeout: 30000 });
    await page.evaluate(() => { window.sprungZu = { id: 'k02', t: 'code' }; route(); });
    await page.waitForSelector('#runTests');
    const pruefen = async () => { await page.click('#runTests'); await page.waitForFunction(() => document.querySelector('#runTests').textContent === 'Prüfen' && document.querySelector('#tests .test.bad, #tests .test.fatal'), null, { timeout: 20000 }); };
    let erst = 0;
    for (let n = 1; n <= 3 && !erst; n++) { await pruefen(); if (await page.locator('.ub-schubs').count()) erst = n; }
    ok(erst === ab, 'Vorwissen ' + level + ': Hilfe kommt von selbst nach dem ' + ab + '. Fehlversuch (war: ' + erst + ')');
    ok(await page.evaluate(() => !document.querySelector('#ubToniFrag') && document.querySelector('#ubTipp').textContent === 'Tipp ansehen'), 'Ohne KI bietet sie den Tipp an, nicht Toni');
    await page.click('#ubTipp');
    ok(await page.evaluate(() => document.querySelectorAll('#hints .hint').length === 1 && !document.querySelector('.ub-schubs')), '„Tipp ansehen“ zeigt Tipp 1, der Hinweis geht weg');
    ok(!fehler.length, 'keine JavaScript-Fehler (Vorwissen ' + level + ')' + (fehler.length ? ': ' + fehler.join(' | ') : ''));
    await browser.close();
  }

  /* ---------- 3. Mit KI ---------- */
  {
    const { browser, ctx, page, fehler } = await oeffnen({ stand: stand() });
    const reqs = []; let antwort = '';
    await page.route('https://api.anthropic.com/**', r => { reqs.push(JSON.parse(r.request().postData() || '{}')); return r.fulfill({ status: 200, contentType: 'text/event-stream', body: claudeText(antwort) }); });
    await page.evaluate(() => { localStorage.setItem('ngfc.ai', JSON.stringify({ anbieter: 'claude', key: 'sk-ant-test', model: 'claude-opus-5-5' })); route(); });
    await page.waitForSelector('.hub-bau');
    ok(await page.evaluate(() => [...document.querySelectorAll('.hub-bau a')].map(a => a.getAttribute('href')).join() === '#ueben-k06,#tonifragen-k06' && !document.querySelector('#hubBauKi')), 'Mit KI: „Neue Fragen von Toni“ neben „Üben“');

    antwort = JSON.stringify({ fragen: [
      { q: 'Was macht <code>@Input()</code>? <img src=x onerror="window.__xss=1">', options: ['Nimmt Daten von außen an', 'Sendet ein Event', 'Startet die App', 'Nichts'], correct: 0, why: 'Ein Input kommt von der Eltern-Komponente.' },
      { q: 'Frage zwei?', options: ['a', 'b', 'c', 'd'], correct: 2, why: 'Weil c.' },
      { q: 'Kaputt', options: 'keine Liste', correct: 0 },
      { q: 'Frage drei?', options: ['a', 'b'], correct: 1, why: 'Weil b.' }
    ] });
    await page.click('.hub-bau a.linkbtn');
    await page.waitForSelector('.le-karte .opt');
    const p = reqs[0], text = p.messages.map(m => m.content).join('\n');
    ok(/Schreib genau 3 neue Multiple-Choice-Fragen/.test(text) && text.includes(await page.evaluate(() => stripHtml(CH.find(c => c.id === 'k06').quiz[0].q))) && /Übung mit der Lösung geschafft/.test(text), 'Toni bekommt die Fragen, die daneben waren, und die Gründe');
    ok(/Antworte ausschließlich mit gültigem JSON/.test(p.system), 'Antwort als JSON verlangt');
    ok(await page.evaluate(() => !window.__xss && !document.querySelector('.le-frage img') && document.querySelector('.le-frage code').textContent === '@Input()'), 'Fragen der KI: <code> bleibt, anderes HTML wird Text (kein Skript)');
    ok((await page.textContent('.le-label')).startsWith('Toni-Frage 1 von 3'), 'Kaputte Fragen fallen raus: 3 von 4 bleiben');
    await page.evaluate(() => document.querySelector('.le-karte .opt[data-i="0"]').click());
    ok(await page.evaluate(() => S.tf.k06.r === 1 && document.querySelector('.le-warum').textContent.includes('Eltern-Komponente')), 'Richtig: gezählt (S.tf) und mit Begründung');
    await page.click('#wdhWeiter');
    await page.evaluate(() => document.querySelector('.le-karte .opt[data-i="0"]').click());
    await page.click('#wdhWeiter');
    await page.evaluate(() => document.querySelector('.le-karte .opt[data-i="1"]').click());
    await page.click('#wdhWeiter');
    ok(await page.evaluate(() => document.querySelector('.le-zahl').textContent === '2 von 3' && S.tf.k06.f === 1 && themaVon('k06').gruende.some(g => /Tonis Fragen/.test(g))), 'Bilanz 2 von 3, der Fehler zählt fürs Thema');
    await page.click('#tfMehr'); await page.waitForSelector('.le-karte .opt');
    ok(/Diese Fragen hattest du schon gestellt/.test(reqs[1].messages.map(m => m.content).join('\n')), '„Noch 3 Fragen“: Toni bekommt die schon gestellten mit');
    antwort = 'kein json';
    await page.evaluate(() => { location.hash = 'start'; }); await page.evaluate(() => { location.hash = 'tonifragen-k06'; });
    await page.waitForSelector('#tfNochmal');
    ok(await page.isVisible('a[href="#ueben-k06"]'), 'Kaputte Antwort: Hinweis mit „Nochmal versuchen“ und „Ohne KI üben“');

    /* Übung: „Toni, was fehlt?“ liest den Code */
    antwort = 'In Zeile 3 fehlt das Signal.';
    await page.waitForFunction(() => window.ts, null, { timeout: 30000 });
    await page.evaluate(() => { S.ich.level = 0; window.sprungZu = { id: 'k02', t: 'code' }; location.hash = 'k02'; });
    await page.waitForSelector('#runTests');
    await page.evaluate(() => document.querySelector('#editor .CodeMirror').CodeMirror.setValue('// mein Code XYZ'));
    await page.click('#runTests'); await page.waitForSelector('.ub-schubs', { timeout: 20000 });
    ok(await page.evaluate(() => !!document.querySelector('#ubToniFrag') && !!document.querySelector('#ubTipp')), 'Mit KI: „Toni, was fehlt?“ und der Tipp');
    const vorher = reqs.length;
    await page.click('#ubToniFrag');
    await page.waitForFunction(() => /Zeile 3 fehlt das Signal/.test(document.querySelector('#ubToniOut').textContent));
    const q = reqs[vorher].messages.map(m => m.content).join('\n');
    ok(q.includes('// mein Code XYZ') && /noch rot/.test(q) && /KEINE komplette Lösung/.test(q), 'Toni bekommt den Code, die roten Tests und soll nicht die Lösung verraten');
    ok(await page.evaluate(() => (S.profil.sig.hilfe || 0) >= 1), 'Zählt im Lernprofil als Hilfe');
    ok(!fehler.length, 'keine JavaScript-Fehler mit KI' + (fehler.length ? ': ' + fehler.join(' | ') : ''));
    await browser.close();
  }
  await ende();
})().catch(e => { console.error(e); process.exit(1); });
