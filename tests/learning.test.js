// Prüft im echten Browser, was beim Lernen hilft:
// Vorab-Tipp, „Erklär die Zeilen selbst“, Kapitel-Ablauf mit Karten für die Wiederholung, Hilfe-Leiter (Abschnitte 1 bis 9, eine Seite),
// danach der Bereich Lernen mit festen Spielständen (Abschnitte 10 bis 16): Lerntag und Abstände, Sitzung mit fälligen Karten,
// „nochmal bis es sitzt“, freie Runde, #blitz, Seite #wissen, Handy.
const { chromium } = require('playwright');
const { reloadIt } = require('./helpers');
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');
const NM = path.join(root, 'node_modules');
const URL = 'file://' + path.join(root, 'index.html');

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) fails++; };

/* ---------- Bereich Lernen: eigene Seiten mit festem Spielstand, unabhängig vom Kapitel-Ablauf ---------- */
const TAG = 864e5;
const standing = (done, more) => Object.assign({ player: { start: 1 }, xp: 100, steps: {}, done, quiz: {}, ex: {}, code: {}, days: [], badges: [], updated: 1 }, more || {});
async function side(browser, errors, st, hash, ctxOpts) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1300, height: 900 } }, ctxOpts || {}));
  await ctx.route('**/*', r => {
    const u = r.request().url(), m = u.match(/cdn\.jsdelivr\.net\/npm\/(@?[^@]+)@[^/]+\/(.*)$/);
    if (m) return r.fulfill({ body: fs.readFileSync(path.join(NM, m[1], m[2])), contentType: 'application/javascript' });
    return u.startsWith('file:') ? r.continue() : r.abort();
  });
  await ctx.addInitScript(s => { try { if (!localStorage.getItem('ngfc.v1')) localStorage.setItem('ngfc.v1', s); } catch (e) {} }, JSON.stringify(st));
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(hash + ': ' + e.message));
  await p.goto(URL + '#' + hash); await p.waitForSelector('#main');
  return p;
}
/* Was zeigt die Runde gerade? { t: 'q' | 'm' | 'x' | 'ende', id, i, nochmal, korrekt, taste } */
const card = p => p.evaluate(() => {
  if (document.querySelector('.learn-balance')) return { t: 'ende' };
  const f = document.querySelector('#repeatBody .learn-question'); if (!f) return null;
  const label = document.querySelector('#repeatBody .learn-label').textContent, retry = label.includes('Nochmal');
  const text = h => { const d = document.createElement('div'); d.innerHTML = leHtml(h); return d.textContent; };
  if (document.querySelector('#xGo')) return { t: 'x', id: CH.find(c => c.ex && c.ex.title === f.textContent).id, nochmal: retry };
  if (document.querySelector('#reveal')) return { t: 'm', id: CH.find(c => f.textContent.includes('„' + c.title + '“')).id, nochmal: retry };
  const opts = [...document.querySelectorAll('.learn-opts .opt')];
  for (const c of CH) if (label.endsWith(c.title)) for (let i = 0; i < c.quiz.length; i++) if (text(c.quiz[i].q) === f.textContent)
    return { t: 'q', id: c.id, i, nochmal: retry, isCorrect: c.quiz[i].correct, keyName: opts.findIndex(b => +b.dataset.i === c.quiz[i].correct) + 1, keyNames: opts.map(b => b.querySelector('.key').textContent).join('') };
  return null;
});
/* Spielt eine Runde bis zur Bilanz. wahl(karte) liefert für Fragen { richtig, sicher, tastatur }, für Merksätze die Note 0 bis 2.
   Rückgabe: Protokoll mit allem, was dabei zu sehen war. */
async function games(p, choice) {
  const log = [];
  for (let n = 0; n < 60; n++) {
    const k = await card(p);
    if (!k) throw new Error('Runde: unbekannte Karte');
    if (k.t === 'ende') return log;
    if (k.t === 'q') {
      const w = choice(k);
      if (w.keyboardKeys) await p.keyboard.press(String(k.keyName));
      else await p.click(w.right ? `.learn-opts .opt[data-i="${k.isCorrect}"]` : `.learn-opts .opt:not([data-i="${k.isCorrect}"])`);
      k.asked = await p.isVisible('.conf .cf');
      if (k.asked) { if (w.keyboardKeys) await p.keyboard.press(w.sure ? '1' : '2'); else await p.click(`.cf[data-c="${w.sure ? 1 : 0}"]`); }
      await p.waitForSelector('#repeatNext');
      k.hyper = await p.isVisible('.hyper'); k.reasonWhy = await p.textContent('.learn-why'); k.standing = await p.textContent('#learnState');
      k.focusEl = await p.evaluate(() => document.activeElement.id);
      if (w.keyboardKeys) await p.keyboard.press('ArrowRight'); else await p.click('#repeatNext');
    } else if (k.t === 'm') {
      const g = choice(k);
      await p.fill('#recallIn', 'Stichwort'); await p.click('#reveal');
      k.takeaway = await p.locator('.learn-takeaway li').count();
      if (g === 2) await p.keyboard.press('3'); else await p.click(`.gr[data-g="${g}"]`);
    } else {
      await p.click('#xGo'); await p.waitForSelector('#editor .CodeMirror');
      k.barTop = await p.isVisible('.learn-xbar #learnUp');
      await p.evaluate(id => document.querySelector('.CodeMirror').CodeMirror.setValue(CH.find(c => c.id === id).ex.solution), k.id);
      await p.click('#runTests'); await p.waitForSelector('#repeatNext', { timeout: 30000 });
      await p.click('#repeatNext');
    }
    log.push(k);
  }
  throw new Error('Runde endet nicht');
}
const sideScroll = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const tooSmall = (p, sel) => p.evaluate(s => [...document.querySelectorAll(s)].filter(e => e.offsetParent && e.getBoundingClientRect().height < 40).map(e => e.className || e.tagName), sel);

async function learn(browser, ok, errors) {
  const alt = Date.now() - 9 * TAG;

  // 10. Lerntag und Abstände: gerechnet wird in Kalendertagen, der Lerntag beginnt um 4 Uhr (Zeitzone mit Zeitumstellung)
  const z = await side(browser, errors, standing({}), 'wdh', { timezoneId: 'Europe/Berlin' });
  const L = await z.evaluate(() => {
    const d = (...a) => new Date(...a).getTime(), r = {}, realNow = Date.now, realRandom = Math.random;
    r.late = leDueIn(1, d(2026, 10, 17, 23, 50)) === d(2026, 10, 18, 4);
    r.atNight = leDueIn(1, d(2026, 10, 18, 1, 30)) === d(2026, 10, 18, 4);
    r.winterTime = leDueIn(3, d(2026, 9, 24, 12)) === d(2026, 9, 27, 4);
    r.summerTime = leDueIn(3, d(2026, 2, 27, 12)) === d(2026, 2, 30, 4);
    r.hours = true;
    for (const start of [d(2026, 9, 23), d(2026, 2, 27)]) for (let h = 0; h < 96; h++) { const ab = start + h * 36e5, f = leDueIn(1, ab); if (!(f > ab) || f - ab > 25 * 36e5 || new Date(f).getHours() !== 4) r.hours = false; }

    Date.now = () => d(2026, 10, 17, 23, 50); Math.random = () => 0.5;
    const dayCount = k => leDaysUntil(S.srs[k].due), fresh = () => ({ s: 0, n: 0, l: 0, due: 0 });
    /* Karten entstehen mit dem Kapitel: Fragen nach 1, Merksätze nach 2, Übung nach 4 Tagen */
    S.done = { g01: Date.now(), k01: Date.now() }; S.srs = {}; srsSeed();
    r.seed = [dayCount('q:g01:0'), dayCount('m:g01'), dayCount('x:k01')].join();
    r.notInstant = srsDue(d(2026, 10, 18, 0, 5)).length === 0;
    r.inMorning = srsDue(d(2026, 10, 18, 4)).sort().join();
    const previous = JSON.stringify(S.srs); srsSeed(); r.noDuplicates = JSON.stringify(S.srs) === previous;
    /* Karten ohne Frage, ohne Kapitel, ohne Übung zählen nirgends mit */
    const realOnes = Object.keys(S.srs).length;
    S.srs['q:g01:99'] = { s: 0, n: 0, l: 0, due: 1 }; S.srs['q:weg:0'] = { s: 0, n: 0, l: 0, due: 1 }; S.srs['x:g02'] = { s: 0, n: 0, l: 0, due: 1 };
    r.ghosts = srsDue().length === 0 && srsStats().total === realOnes && repeatRound().length === 0 && srsStats().upcoming === d(2026, 10, 18, 4);
    /* Alter Spielstand: Kapitel ohne Zeitstempel sind gleich fällig */
    S.done = { k01: 1 }; S.srs = {}; r.oldDue = srsDue().sort().join();

    /* Bewertung bestimmt den Abstand */
    S.srs = { sure: fresh(), guessed: fresh(), ripe: { s: 18.75, n: 3, l: 0, due: 0 }, young: { s: 3, n: 1, l: 0, due: 0 }, sparse: { due: 1 }, long: { s: 300, n: 9, l: 0, due: 0 } };
    srsGrade('sure', 2); srsGrade('guessed', 1);
    r.firstOne = [S.srs.sure.s, dayCount('sure'), S.srs.guessed.s, dayCount('guessed')].join();
    srsGrade('sure', 2); srsGrade('guessed', 1);
    r.secondOne = [S.srs.sure.s, dayCount('sure'), dayCount('guessed')].join();
    srsGrade('ripe', 0); r.problems = [S.srs.ripe.s, dayCount('ripe'), S.srs.ripe.l, S.srs.ripe.r].join();
    srsGrade('ripe', 2); r.refresher = [S.srs.ripe.s, dayCount('ripe'), S.srs.ripe.r].join();
    srsGrade('ripe', 2); r.afterwards = [S.srs.ripe.s, dayCount('ripe')].join();
    srsGrade('young', 0); r.youngError = [S.srs.young.s, dayCount('young'), S.srs.young.r].join();
    srsGrade('young', 2); r.youngAfter = [S.srs.young.s, dayCount('young')].join();
    srsGrade('sparse', 0); srsGrade('sparse', 2); r.sparse = JSON.stringify([S.srs.sparse.s, S.srs.sparse.n, S.srs.sparse.l, dayCount('sparse')]);
    srsGrade('long', 2); r.lid = S.srs.long.s;
    r.neverInstant = Object.values(S.srs).every(c => c.due > Date.now());

    /* Mischen: zwei Kapitel mit gleich vielen Karten wechseln sich ab, die Übung kommt zum Schluss, höchstens 15 Karten */
    Date.now = realNow; Math.random = realRandom;
    r.mixed = true; r.xAtEnd = true;
    S.done = { g02: 1, g03: 1 }; S.srs = {};
    for (let n = 0; n < 30; n++) { const turn = repeatRound(), ch = turn.map(k => k.split(':')[1]); if (ch.some((c, i) => i && c === ch[i - 1]) || new Set(turn).size !== 10) r.mixed = false; }
    S.done = { g02: 1, k01: 1 }; S.srs = {};
    for (let n = 0; n < 30; n++) { const turn = repeatRound(); if (turn.length !== 11 || turn.indexOf('x:k01') !== 10) r.xAtEnd = false; }
    S.done = Object.fromEntries(CH.map(c => [c.id, 1])); S.srs = {};
    const full = repeatRound();
    r.lidRound = [full.length, full.filter(k => k[0] === 'm').length <= 3, full.filter(k => k[0] === 'x').length <= 1, new Set(full).size].join();

    /* Vorab-Tipp: Überschrift, Auflösung im Quiz, kein Tipp mehr nach dem Kapitel */
    const ch = CH.find(c => c.id === 'k03'), f = (ch.quiz[0].correct + 1) % ch.quiz[0].options.length;
    S.done = {}; S.quiz = {}; S.pre = {};
    const h = preTestHtml(ch); r.tip = h.includes('class="pretest" id="pretest"') && h.includes('Dein Tipp?') && h.includes('zählt nicht') && !h.includes('disabled');
    S.pre = { k03: f }; r.tipWrong = preNote(ch, 0).includes('getippt') && preNote(ch, 0).includes(ch.quiz[0].options[f].slice(0, 8)) && preNote(ch, 1) === '';
    S.pre = { k03: ch.quiz[0].correct }; r.tipRight = preNote(ch, 0).includes('Das stimmte');
    S.pre = { k03: 9 }; r.tipBroken = preNote(ch, 0) === '';
    S.pre = {}; S.done = { k03: 1 }; r.tipOver = preTestHtml(ch) === '';
    /* Lösung mit Lücken: jede Übung behält ihr Gerüst und bekommt Lücken, nie die ganze Lösung */
    r.gaps = CH.filter(c => c.ex).every(c => { const l = c.ex.solution.split('\n'), f = fadeSolution(c.ex.solution, c.ex.starter).split('\n'); return f.length === l.length && f.some(x => x.includes('____')) && f.some((x, i) => x.trim() && x === l[i]) && f.every((x, i) => x === l[i] || x.includes('____')); });
    /* Rohe spitze Klammern in Fragen bleiben lesbar, <code> bleibt Auszeichnung */
    r.brackets = leHtml('Typsicher mit <T>. <code>a < b</code><br> <button> <img onerror="x">') === 'Typsicher mit &lt;T>. <code>a &lt; b</code><br> &lt;button> &lt;img onerror="x">' && leHtml('&lt;p&gt;') === '&lt;p&gt;' && leHtml(null) === '';
    return r;
  });
  ok(L.late && L.atNight, 'Lerntag: Wer um 23:50 oder 1:30 fertig wird, sieht die Karte erst ab 4 Uhr früh wieder');
  ok(L.winterTime && L.summerTime && L.hours, 'Zeitumstellung verschluckt und verdoppelt keinen Tag, fällig ist immer um 4 Uhr und nie in der Vergangenheit');
  ok(L.seed === '1,2,4', 'Erste Wiederholung: Fragen nach 1, Merksätze nach 2, Übung nach 4 Tagen (' + L.seed + ')');
  ok(L.notInstant && L.inMorning === 'q:g01:0,q:g01:1,q:g01:2,q:k01:0,q:k01:1,q:k01:2', 'Ein spät geschafftes Kapitel ist nicht nach Mitternacht schon wieder fällig, sondern am Morgen');
  ok(L.noDuplicates, 'Karten entstehen nur einmal');
  ok(L.ghosts, 'Karten für gelöschte Fragen, Kapitel und Übungen zählen nirgends mit');
  ok(L.oldDue === 'm:k01,q:k01:0,q:k01:1,q:k01:2,x:k01,z:k01', 'Alter Spielstand ohne Zeitstempel: Karten sind gleich fällig');
  ok(L.firstOne === '3,3,1.5,2', 'Erster Treffer: sicher kommt nach 3 Tagen wieder, geraten nach 2 (' + L.firstOne + ')');
  ok(L.secondOne === '7.5,8,2', 'Zweiter Treffer: sicher wächst auf etwa 7 Tage, geraten bleibt kurz (' + L.secondOne + ')');
  ok(L.problems === '6,1,1,1', 'Fehler bei einer reifen Karte: morgen wieder, Abstand fällt auf ein Drittel (' + L.problems + ')');
  ok(L.refresher === '6,6,' && L.afterwards === '15,15', 'Sitzt die Auffrischung, gilt der gekürzte Abstand, danach wächst er wieder (' + L.refresher + ' / ' + L.afterwards + ')');
  ok(L.youngError === '1,1,' && L.youngAfter === '2.5,3', 'Fehler bei einer jungen Karte: morgen wieder, dann nach 3 Tagen');
  ok(L.sparse === '[2.5,2,1,3]' && L.lid === 365 && L.neverInstant, 'Karten ohne Zähler rechnen sauber, nie über ein Jahr, nie sofort wieder fällig (' + L.sparse + ', ' + L.lid + ')');
  ok(L.mixed && L.xAtEnd, 'Mischen: Kapitel wechseln sich ab, Code aus dem Kopf kommt zum Schluss');
  ok(L.lidRound === '15,true,true,15', 'Eine Runde hat höchstens 15 Karten, davon 3 Merksatz-Karten und 1 Übung (' + L.lidRound + ')');
  ok(L.tip && L.tipWrong && L.tipRight && L.tipBroken && L.tipOver, 'Vorab-Tipp heißt „Dein Tipp?“, wird im Quiz aufgelöst und verschwindet nach dem Kapitel');
  ok(L.gaps, 'Lösung mit Lücken: alle Übungen behalten ihr Gerüst und haben Lücken');
  ok(L.brackets, 'Fragen mit rohem <T> oder <button> zeigen die Klammern als Text, statt sie zu schlucken');
  await z.context().close();

  // 11. Sitzung mit fälligen Karten: Bewertung bestimmt den Abstand, nochmal bis es sitzt, Bilanz
  /* Dieselbe Runde wie früher: Die später dazugekommenen Fragen von k01 und k02, die Übung von g01 und das Zuordnen (eigener Test: matching.test.js)
     sind erst in ein paar Tagen dran */
  const later = { s: 3, n: 1, l: 0, due: Date.now() + 5 * TAG }, extra = Object.fromEntries(['q:k01:1', 'q:k01:2', 'q:k02:1', 'q:k02:2', 'x:g01', 'z:g01', 'z:k01', 'z:k02'].map(k => [k, Object.assign({}, later)]));
  const s = await side(browser, errors, standing({ g01: alt, k01: alt, k02: alt }, { srs: extra }), 'wdh');
  ok((await s.textContent('.learn-head h1')) === 'Wiederholen' && (await s.getAttribute('.learn-head .loc a', 'href')) === '#start' && (await s.textContent('#learnState')) === '0 von 9 geschafft', 'Kopf: leise zurück zum Schreibtisch, Titel, Stand der Sitzung');
  const mGrades = {};
  const log = await games(s, k => {
    if (k.t === 'm') { if (k.id === 'k01' && !k.nochmal) return 0; return 2; }
    if (k.nochmal) return { right: true };
    if (k.id === 'g01' && k.i === 0) return { right: false, sure: true };
    if (k.id === 'g01' && k.i === 1) return { right: true, sure: false };
    return { right: true, sure: true, keyboardKeys: k.id === 'g01' };
  });
  const firstOne = log.filter(k => !k.nochmal), again = log.filter(k => k.nochmal), f0 = log.find(k => k.t === 'q' && k.id === 'g01' && k.i === 0 && !k.nochmal);
  ok(firstOne.length === 9 && firstOne.filter(k => k.t === 'q').length === 5 && firstOne.filter(k => k.t === 'm').length === 3 && firstOne.filter(k => k.t === 'x').length === 1, 'Sitzung mischt Fragen, Merksätze und Code aus dem Kopf (9 Karten)');
  ok(firstOne.filter(k => k.t === 'q').every(k => k.asked && k.keyNames === '1234'), 'Vor der Auflösung kommt „Wie sicher bist du?“');
  ok(f0.hyper && f0.reasonWhy.startsWith('Daneben.') && firstOne.filter(k => k !== f0 && k.t === 'q').every(k => !k.hyper), 'Sicher und daneben zeigt den Hinweis, sonst nicht');
  ok(log.find(k => k.id === 'g01' && k.i === 1).reasonWhy.startsWith('Richtig, aber geraten.') && log.find(k => k.id === 'g01' && k.i === 2).reasonWhy.startsWith('Sitzt.'), 'Auflösung sagt, ob es saß oder geraten war');
  ok(again.length === 2 && again.some(k => k.t === 'q' && k.id === 'g01' && k.i === 0 && !k.asked) && again.some(k => k.t === 'm' && k.id === 'k01'), 'Nochmal, bis es sitzt: Falsches kommt in derselben Runde wieder, ohne zweite Sicherheitsfrage');
  ok(log.filter(k => k.t === 'q').every(k => k.focusEl === 'repeatNext') && log.find(k => k.id === 'g01' && k.i === 2).standing !== '0 von 9 geschafft', 'Tasten 1 bis 4 und Pfeil rechts steuern die Karte, der Stand zählt sofort mit');
  ok(log.find(k => k.t === 'x').barTop && log.filter(k => k.t === 'm').every(k => k.takeaway >= 3), 'Merksätze werden aufgedeckt, Code aus dem Kopf läuft mit eigener Leiste');
  const e = await s.evaluate(() => ({ S: JSON.parse(JSON.stringify(S)), dayCount: Object.fromEntries(Object.keys(S.srs).map(k => [k, leDaysUntil(S.srs[k].due)])), dueNow: srsDue() }));
  const c = e.S.srs;
  ok(c['q:g01:0'].l === 1 && c['q:g01:0'].n === 1 && e.dayCount['q:g01:0'] === 1, 'Daneben: Die Karte kommt morgen wieder, der zweite Versuch in der Runde ändert das nicht');
  ok(e.dayCount['q:g01:1'] === 2 && e.dayCount['q:g01:2'] === 3 && c['q:g01:1'].s < c['q:g01:2'].s, 'Richtig, aber geraten kommt früher wieder als sicher gewusst');
  ok(e.dayCount['m:k01'] === 1 && e.dayCount['m:g01'] === 3 && e.dayCount['m:k02'] === 3, 'Merksätze: „Kaum was“ kommt morgen, „Fast alles“ nach 3 Tagen');
  ok(e.dueNow.length === 1 && e.dueNow[0][0] === 'x' && Object.values(e.dayCount).filter(t => t >= 1).length === 9 + 8, 'Alle Karten der Runde sind neu geplant, offen bleibt nur die zweite Übung');
  ok(e.S.cal.sr === 3 && e.S.cal.sw === 1 && e.S.cal.ur === 1 && !e.S.cal.uw, 'Sicherheit wird nur beim ersten Versuch gezählt');
  ok(e.S.xp === 100 + 8 * 3 + 20, 'XP: 3 je Karte, 20 für die Übung, einmal gutgeschrieben (' + e.S.xp + ')');
  ok(Object.keys(e.S.code).length === 0 && !e.S.weak, 'Code aus dem Kopf überschreibt keinen gespeicherten Code, die Sitzung fasst S.weak nicht an');
  const img = await s.evaluate(() => ({ number: document.querySelector('.learn-number').textContent, when: [...document.querySelectorAll('.learn-when li')].map(li => li.textContent).join('|'), buttons: [...document.querySelectorAll('#repeatBody .btn')].map(b => b.getAttribute('href')).join(), text: document.querySelector('.learn-balance').textContent, standing: document.querySelector('#learnState').textContent, focusEl: document.activeElement.id }));
  ok(img.number === '7 von 9' && img.when === '2morgen|7in 2 bis 7 Tagen' && img.text.includes('+44 XP'), 'Bilanz: wie viele saßen und wann die Karten wiederkommen (' + img.number + ', ' + img.when + ')');
  ok(img.buttons === '#start' && img.focusEl === 'learnHome' && img.text.includes('Noch 1 Karte fällig'), 'Am Ende genau ein Knopf: zurück zum Schreibtisch');
  await s.click('#learnAgain');
  ok((await card(s)).t === 'x' && (await s.textContent('#learnState')) === '0 von 1 geschafft', 'Sind noch Karten fällig, geht es auf Wunsch mit der nächsten Runde weiter');
  await s.click('#xSkip');
  ok((await card(s)).t === 'ende' && (await s.evaluate(() => srsDue().length)) === 0 && (await s.evaluate(() => leDaysUntil(S.srs['x:k01'].due) === 1 || leDaysUntil(S.srs['x:k02'].due) === 1)), '„Heute nicht“ verschiebt die Übung auf morgen');
  await s.context().close();

  // 12. Mittendrin weg: Bewertungen bleiben, XP werden gutgeschrieben, die Zurück-Taste führt nicht in eine halbe Karte
  const w = await side(browser, errors, standing({ g01: alt }, { srs: { 'm:g01': { s: 3, n: 1, l: 0, due: Date.now() + 5 * TAG }, 'x:g01': { s: 3, n: 1, l: 0, due: Date.now() + 5 * TAG }, 'z:g01': { s: 3, n: 1, l: 0, due: Date.now() + 5 * TAG } } }), 'start');
  await w.evaluate(() => { location.hash = 'wdh'; }); await w.waitForSelector('.learn-opts .opt');
  await w.keyboard.press('1'); await w.keyboard.press('1'); await w.waitForSelector('#repeatNext');
  await w.click('#repeatNext');
  const duplicate = await w.evaluate(() => { document.querySelector('.learn-opts .opt').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 2 })); return document.querySelectorAll('.learn-opts .opt:disabled, .conf').length; });
  await w.click('.learn-opts .opt');
  ok(duplicate === 0 && await w.isVisible('.conf .cf'), 'Schnelles Klicken: Der zweite Klick eines Doppelklicks auf „Weiter“ wählt keine Antwort, ein einfacher Klick schon');
  await w.keyboard.press('2'); await w.waitForSelector('#repeatNext');
  await w.goBack(); await w.waitForFunction(() => !document.querySelector('#repeatBody'));
  const journey = await w.evaluate(() => S.xp + ' XP, ' + srsDue().length + ' fällig, ' + location.hash);
  ok(journey === '106 XP, 1 fällig, #start', 'Sitzung mittendrin verlassen: Die Karte ist bewertet, ihre XP sind da (' + journey + ')');
  await w.goForward(); await w.waitForSelector('.learn-opts .opt');
  ok((await w.textContent('#learnState')) === '0 von 1 geschafft' && (await w.evaluate(() => S.xp)) === 106, 'Zurück in die Wiederholung: neue Runde mit den übrigen Karten, keine XP doppelt');
  await w.context().close();

  // 13. Nichts fällig: ruhige Seite mit einem Knopf. Die freie Runde ändert keine Abstände, zählt aber eigene Fehler (S.weak)
  const current = Date.now();
  const fr = await side(browser, errors, standing({ g01: current, g02: current, k01: current }, { weak: { 'g01:0': 2, 'g01:1': 1 }, cal: { sr: 1, sw: 0, ur: 0, uw: 0 } }), 'wdh');
  const calm = await fr.evaluate(() => ({ text: document.querySelector('#main').textContent, buttons: [...document.querySelectorAll('#main .btn, #main button')].map(b => b.id).join(), h1: document.querySelector('.learn-head h1').textContent }));
  ok(calm.h1 === 'Wiederholen' && calm.text.includes('Nichts zu wiederholen') && calm.text.includes('Die nächste Karte kommt morgen') && calm.buttons === 'learnFree', 'Nichts fällig: ruhige Seite, wann die nächste Karte kommt, ein Knopf „Freie Runde“');
  /* Fester Pool von genau 7 Fragen wie früher (g01 und g02 je 3, von k01 nur die erste), damit jede Frage einmal drankommt.
     Zuordnen bleibt hier draußen, das prüft matching.test.js. */
  /* Die Seite zieht ihren Pool beim Zeichnen, darum danach neu zeichnen */
  await fr.evaluate(() => { CH.find(c => c.id === 'k01').quiz.length = 1; CH.forEach(c => { c.pairs = null; }); renderRepeat(document.querySelector('#main')); });
  const srsBefore = await fr.evaluate(() => JSON.stringify(S.srs));
  await fr.click('#learnFree');
  ok((await fr.textContent('.learn-head h1')) === 'Freie Runde' && (await fr.textContent('#learnState')) === '0 von 7 geschafft', 'Freie Runde: dieselbe Karten-Oberfläche, 7 Fragen aus gespielten Kapiteln');
  let series = 0, bonus = 0;
  const flew = await games(fr, k => { const wrong = k.id === 'g02' && k.i === 0 && !k.nochmal; if (!k.nochmal) { if (wrong) series = 0; else if (++series === 5) bonus = 15; } return { right: !wrong }; });
  const fe = await fr.evaluate(() => ({ S: JSON.parse(JSON.stringify(S)), number: document.querySelector('.learn-number').textContent, after: [...document.querySelectorAll('.learn-after a')].map(a => a.getAttribute('href')).join(), buttons: [...document.querySelectorAll('#repeatBody .btn')].map(b => b.getAttribute('href')).join(), text: document.querySelector('.learn-balance').textContent }));
  ok(flew.every(k => k.t === 'q' && !k.asked) && flew.filter(k => !k.nochmal).length === 7 && new Set(flew.map(k => k.id + k.i)).size === 7, 'Freie Runde: nur Quizfragen, jede einmal, keine Sicherheitsfrage');
  ok(flew.filter(k => k.nochmal).length === 1 && flew.find(k => k.nochmal).id === 'g02', 'Freie Runde: Falsches kommt nochmal, bis es sitzt');
  ok(JSON.stringify(fe.S.srs) === srsBefore && JSON.stringify(fe.S.cal) === '{"sr":1,"sw":0,"ur":0,"uw":0}', 'Freie Runde verändert keine Abstände und keine Sicherheits-Zählung');
  ok(fe.S.weak['g01:0'] === 1 && !('g01:1' in fe.S.weak) && fe.S.weak['g02:0'] === 1, 'Freie Runde: Fehler werden gemerkt (S.weak), Treffer bauen sie wieder ab');
  ok(fe.S.xp === 100 + 6 * 5 + bonus, 'Freie Runde: 5 XP je Treffer, 15 dazu bei 5 in Folge (' + fe.S.xp + ')');
  ok(fe.number === '6 von 7' && fe.after === '#g02' && fe.buttons === '#start' && !fe.text.includes('So kommen sie wieder'), 'Freie Runde, Bilanz: Kapitel zum Nachlesen, ein Knopf zum Schreibtisch');
  await fr.click('#learnAgain');
  ok((await fr.textContent('.learn-head h1')) === 'Freie Runde' && (await fr.textContent('#learnState')) === '0 von 7 geschafft', '„Noch eine Runde“ startet eine neue freie Runde');
  /* Die Ziehungen hängen am Zufall. Damit die Zählungen bei jedem Lauf dieselben sind, zieht die Seite hier mit einem festen
     Zufallsgenerator (mulberry32). randomFixed(start) setzt ihn auf einen Startwert. Gleiche Gewichte geben dann gleiche Ziehungen. */
  await fr.evaluate(() => { window.randomFixed = start => { let a = start >>> 0; Math.random = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }; });
  const often = await fr.evaluate(() => { randomFixed(7); S.steps = { k03: 2 }; S.weak = { 'g01:0': 3 }; let n = 0, foreign = false; for (let i = 0; i < 300; i++) { const p = leUnlockedPool(); if (p.length !== 7 || new Set(p).size !== 7 || p.some(k => !/^q:(g01|g02|k01|k03):/.test(k))) foreign = true; if (p.includes('q:g01:0')) n++; } return { n, foreign }; });
  ok(!often.foreign && often.n > 285, 'Freie Runde zieht nur aus gespielten Kapiteln, eigene Fehler öfter (' + often.n + ' von 300 Runden)');
  /* Fehler aus dem Kapitel-Quiz: Erst im zweiten Anlauf richtig (S.quiz > 1) zählt wie ein Fehler aus einer freien Runde, sofort richtig nicht */
  const second = await fr.evaluate(() => {
    const tally = () => { const n = { a: 0, b: 0 }; for (let i = 0; i < 600; i++) { const p = leUnlockedPool(); if (p.includes('q:g01:0')) n.a++; if (p.includes('q:g01:1')) n.b++; } return n; };
    S.weak = {}; S.quiz = { 'g01:0': 2, 'g01:1': 1 }; randomFixed(11); const quiz = tally();
    S.quiz = {}; S.weak = { 'g01:0': 1 }; randomFixed(11); const weak = tally();
    S.weak = {}; randomFixed(11); const without = tally();
    return { quiz, weak, without, questions: new Set(Array.from({ length: 50 }, leUnlockedPool).flat()).size, rest: JSON.stringify([S.weak, S.quiz]) };
  });
  ok(second.questions > 7 && second.quiz.a > second.quiz.b + 40 && second.quiz.a > second.without.a + 40 && second.quiz.a === second.weak.a && second.quiz.b === second.weak.b && second.rest === '[{},{}]', 'Freie Runde: Im Kapitel-Quiz erst im zweiten Anlauf richtig zählt wie ein eigener Fehler (' + second.quiz.a + ' gegen ' + second.quiz.b + ' von 600 Runden, mit S.weak ' + second.weak.a + ', ohne ' + second.without.a + ')');
  await fr.context().close();

  // 14. Ganz neu: nichts zu wiederholen, keine freie Runde. #blitz zeigt dasselbe wie #wdh.
  const fresh = await side(browser, errors, { player: { start: 1 } }, 'wdh');
  ok((await fresh.textContent('#main')).includes('Nach deinem ersten Kapitel') && (await fresh.locator('#main .btn, #main button').count()) === 0 && await fresh.isVisible('.learn-head .loc a'), 'Neuer Nutzer: Hinweis statt Karten, kein Knopf ins Leere');
  await fresh.context().close();
  const bl = await side(browser, errors, standing({ g01: alt }), 'blitz');
  ok((await bl.textContent('.learn-head h1')) === 'Wiederholen' && await bl.isVisible('#repeatBody .learn-question') && !(await bl.$('#blitzBody')) && (await bl.locator('#main a[href="#blitz"]').count()) === 0, '#blitz zeigt die Wiederholung, das Blitz-Training gibt es nicht mehr');

  // 15. Seite „Wie diese App beim Lernen hilft“: nur, was es gibt, jede Quelle ein DOI-Link
  await bl.evaluate(() => { location.hash = 'wissen'; }); await bl.waitForSelector('.learn-ws');
  const ws = await bl.evaluate(() => ({ text: document.querySelector('#main').innerText, n: document.querySelectorAll('.learn-ws').length, h1: document.querySelector('.learn-head h1').textContent,
    linkList: [...document.querySelectorAll('.learn-knowledge a')].map(a => a.href), without: [...document.querySelectorAll('.learn-ws')].filter(d => !d.querySelector('a')).map(d => d.querySelector('summary b').textContent).join(),
    long: KNOWLEDGE.filter(x => x.what.length > 130 || x.reasonWhy.length > 130 || !x.t || (x.what + x.reasonWhy).match(/[–—]/)).map(x => x.t).join() }));
  ok(ws.h1 === 'Wie diese App beim Lernen hilft' && ws.n >= 8 && ws.n <= 11, 'Seite #wissen: ' + ws.n + ' Methoden');
  /* Was die Seite über die App sagt, stimmt mit der App überein: erste Abstände aus srsSeed, Warum erst mit der richtigen Antwort, Bewegung */
  const wa = await bl.evaluate(() => {
    const ch = CH.find(c => c.quiz.length && c.ex && c.takeaway && c.takeaway.length), alt = JSON.stringify(S), what = t => KNOWLEDGE.find(w => w.t === t).what;
    S.done = { [ch.id]: Date.now() }; S.srs = {}; srsSeed();
    const dayCount = ['q:' + ch.id + ':0', 'm:' + ch.id, 'x:' + ch.id].map(k => leDaysUntil(S.srs[k].due));
    const thenStep = [2, 2, 2].map(g => { srsGrade('q:' + ch.id + ':0', g); return S.srs['q:' + ch.id + ':0'].s; });
    S = JSON.parse(alt);
    return { dayCount, thenStep, spread: what('Verteilt wiederholen'), back: what('Sofortige Rückmeldung'), distraction: what('Wenig Ablenkung') };
  });
  ok(wa.dayCount.join() === '1,2,4' && wa.spread.startsWith('Quizfragen kommen nach ' + wa.dayCount[0] + ' Tag wieder, Merksätze nach ' + wa.dayCount[1] + ', die Übung nach ' + wa.dayCount[2] + '.') && wa.spread.endsWith('etwa ' + wa.thenStep.map(Math.floor).join(', ') + ' Tage.'), '#wissen nennt die Abstände, die der Code setzt: ' + wa.spread);
  ok(!/und warum/.test(wa.back) && /Das Warum kommt mit der richtigen Antwort/.test(wa.back), '#wissen: Das Warum verspricht die Seite erst mit der richtigen Antwort');
  ok(/In Kapiteln und Übungen gibt es Bewegung nur als Rückmeldung/.test(wa.distraction), '#wissen: Bewegung nur als Rückmeldung gilt für Kapitel und Übungen (das Titelbild blinkt)');
  ok(!/Ruhemodus|Ruhig|Blitz|innehalten|Für dich erklärt|Hell als Standard|Fußball/i.test(ws.text), '#wissen nennt nichts, was es nicht mehr gibt');
  ok(['Verteilt wiederholen', 'Abrufen', 'Gemischt', 'Dein Tipp?', 'Erst selbst erklären', 'Lösung mit Lücken', 'Rückmeldung', 'Ablenkung'].every(t => ws.text.includes(t)), '#wissen nennt die Methoden, die es gibt');
  ok(ws.linkList.length >= 12 && ws.linkList.every(u => /^https:\/\/doi\.org\/10\.\d{4,}\/\S+$/.test(u)) && new Set(ws.linkList).size === ws.linkList.length, 'Jede Quelle ist ein DOI-Link, keine doppelt (' + ws.linkList.length + ')');
  ok(ws.without === '', 'Jede Methode nennt eine Quelle');
  ok(!ws.long, 'Kurze Texte: höchstens 130 Zeichen je Satzblock, keine Gedankenstriche' + (ws.long ? ' (' + ws.long + ')' : ''));
  await bl.keyboard.press('Tab'); await bl.keyboard.press('Tab'); await bl.keyboard.press('Tab'); await bl.keyboard.press('Enter');
  ok((await bl.locator('.learn-ws[open]').count()) === 1, '#wissen ist mit der Tastatur bedienbar');
  await bl.context().close();

  // 16. Handy (360 px breit): kein Querscrollen, Tippflächen mindestens 40 px.
  const hy = await side(browser, errors, standing({ g01: alt, n03: alt, k29: alt }), 'wdh', { viewport: { width: 360, height: 740 }, hasTouch: true });
  const eng = [], small = [], sel = '#main .opt, #main .cf, #main .gr, #main .btn, #main .linkbtn, #main .ort a, #main summary, #main .learn-ws-q a, #main .learn-after a';
  ok((await hy.evaluate(() => innerWidth)) === 360, 'Handy: Die Seite ist wirklich 360 px breit');
  const measure = async where => { if (await sideScroll(hy)) eng.push(where); const k = await tooSmall(hy, sel); if (k.length) small.push(where + ': ' + k.join(' ')); };
  for (let n = 0; n < 40; n++) {
    const k = await card(hy); if (k.t === 'ende') break;
    await measure(k.t + ' ' + k.id);
    if (k.t === 'q') { await hy.tap(`.learn-opts .opt:not([data-i="${k.isCorrect}"])`); if (await hy.isVisible('.cf')) { await measure('sicher?'); await hy.tap('.cf[data-c="1"]'); } await measure('aufgelöst'); await hy.tap('#repeatNext'); }
    else if (k.t === 'm') { await hy.tap('#reveal'); await measure('aufgedeckt'); await hy.tap('.gr[data-g="1"]'); }
    else { await hy.tap('#xGo'); await hy.waitForSelector('#editor .CodeMirror'); await measure('übung'); await hy.tap('#learnUp'); }
  }
  await measure('bilanz');
  await hy.evaluate(() => { location.hash = 'wissen'; }); await hy.waitForSelector('.learn-ws'); await hy.tap('.learn-ws summary'); await measure('wissen');
  await hy.evaluate(() => { S.done = { g01: Date.now() }; S.srs = {}; location.hash = 'wdh'; }); await hy.waitForSelector('.learn-calm'); await measure('ruhe');
  ok(!eng.length, 'Handy: kein Querscrollen' + (eng.length ? ' (' + eng.join(', ') + ')' : ''));
  ok(!small.length, 'Handy: Tippflächen mindestens 40 px' + (small.length ? ' (' + small.join(' | ') + ')' : ''));
  await hy.context().close();
}

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext();
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('ngfc.v1')) localStorage.setItem('ngfc.v1', '{"ich":{"start":1}}'); } catch (e) {} }); // Spiel-Einstieg gilt als erlebt
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let aiVerdict = 'RICHTIG', aiPrompt = '';
  await ctx.route('**/*', r => {
    const u = r.request().url();
    const m = u.match(/cdn\.jsdelivr\.net\/npm\/(@?[^@]+)@[^/]+\/(.*)$/);
    if (m) return r.fulfill({ body: fs.readFileSync(path.join(NM, m[1], m[2])), contentType: 'application/javascript' });
    if (u.startsWith('https://generativelanguage.googleapis.com/')) {
      aiPrompt = r.request().postData() || '';
      const txt = 'URTEIL: ' + aiVerdict + '\n' + (aiVerdict === 'RICHTIG' ? 'Stark erklärt.' : '1: ❌ Was gibt die Funktion zurück?');
      return r.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: txt }] } }] }) + '\n\n' });
    }
    if (u.startsWith('file:')) return r.continue();
    return r.abort();
  });
  await page.goto(URL + '#k01');
  await page.waitForFunction(() => window.ts, null, { timeout: 30000 });
  const st = () => page.evaluate(() => JSON.parse(JSON.stringify(S)));

  // 1. Szene: erst der Team-Chat, dann das Ticket, dann „Dein Tipp?“
  ok(await page.isVisible('.cp-chat') && !(await page.isVisible('.ticket')) && !(await page.$('#pretest')) && await page.isDisabled('#prevStep'), 'Szene startet mit dem Team-Chat, Ticket und Tipp kommen danach');
  ok(!(await page.isVisible('#nextStep')), 'Solange die Szene läuft, gibt es kein „Weiter“ neben „Alles zeigen“');
  await page.click('.cp-all');
  ok(await page.isVisible('.ticket') && await page.isVisible('#cpAccept') && !(await page.isVisible('#nextStep')) && !(await page.$('#pretest')) && (await page.textContent('.ch-head h1')) && (await page.textContent('#stepQuiet')).startsWith('Ticket'), '„Alles zeigen“ zeigt den ganzen Chat und das Ticket, nicht die nächste Folie');
  await page.click('#cpAccept');
  ok(await page.isVisible('#pretest') && (await page.textContent('#pretest')).includes('Dein Tipp?') && await page.isVisible('#nextStep'), 'Der Vorab-Tipp erscheint, wenn das Ticket angenommen ist, dazu „Weiter“');
  await page.click('#pretest .opt[data-i="0"]');
  ok((await st()).pre.k01 === 0, 'Vorab-Tipp wird gespeichert');

  // 2. Erklär die Zeilen selbst, mit Toni als Prüfer: „Noch nicht“ gibt Denkanstöße ohne Lösung, „Richtig“ zeigt die Lösung
  await page.evaluate(() => localStorage.setItem('ngfc.ai', JSON.stringify({ key: 'test', model: 'gemini-2.5-flash' })));
  await page.click('#nextStep');
  const xpBefore = (await st()).xp, nF = await page.locator('.cp-se-in').count();
  ok(await page.isVisible('.cp-se') && nF > 1 && (await page.locator('.slide .notes:not([hidden])').count()) === 0 && await page.isVisible('#cpSeToni') && await page.isVisible('#cpSeGo'), 'Folie mit Code: Erklärungen verdeckt, Felder zum Selbsterklären, mit Schlüssel „Von Toni prüfen lassen“ und „Selbst vergleichen“');
  for (let k = 0; k < nF; k++) await page.fill('#cpSe' + k, 'meine Erklärung ' + (k + 1));
  aiVerdict = 'NOCH NICHT';
  await page.click('#cpSeToni');
  await page.waitForFunction(() => /Noch nicht/.test(document.querySelector('.cp-se-r').textContent));
  const ref1 = await page.evaluate(() => currentSlide.s.notes[0][1]);
  ok(aiPrompt.includes('meine Erklärung 1') && aiPrompt.includes('Musterlösung (NICHT verraten)'), 'Toni bekommt die eigenen Worte und die Musterlösung zum Prüfen');
  ok(await page.isVisible('#cpSeOut') && !(await page.textContent('#cpSeOut')).includes('URTEIL') && (await page.locator('.cp-se-in').count()) === nF && (await page.locator('.slide .notes:not([hidden])').count()) === 0 && !((await st()).gen || {})['k01:0'], 'Noch nicht: Tonis Denkanstoß ohne Urteilszeile, Felder bleiben, Lösung bleibt verdeckt, nichts gemerkt');
  ok((await page.textContent('#cpSeGo')) === 'Lösung zeigen', 'Noch nicht: Der zweite Knopf zeigt jetzt die Lösung');
  aiVerdict = 'RICHTIG';
  await page.fill('#cpSe0', 'besser erklärt');
  await page.click('#cpSeToni');
  await page.waitForFunction(() => !document.querySelector('.cp-se-in'));
  const g = (await st()).gen['k01:0'];
  ok(/Komplett richtig/.test(await page.textContent('.cp-se-r')) && (await page.textContent('.slide .notes')).includes(ref1) && g.toni === true && g.du[0] === 'besser erklärt', 'Richtig: Lösung zur Bestätigung, Urteil und eigene Worte im Spielstand');
  ok((await st()).xp === xpBefore && ((await st()).profile.sig || {}).erklOk === 1 && ((await st()).profile.sig || {}).erklNo === 1, 'Selbsterklären gibt keine XP, zählt aber Richtig und Noch nicht fürs Lernprofil');
  await page.click('#nextStep');
  ok(await page.isVisible('.cp-se'), 'Nächste Folie mit Code: wieder selbst erklären');
  await page.click('#cpSeX');
  ok(!(await page.$('.cp-se-in')) && (await page.locator('.slide .notes:not([hidden])').count()) === 1 && !!(await st()).gen['k01:1'], 'Kein Zwang: „Erklärungen gleich zeigen“ deckt alles auf');
  await page.click('#prevStep');
  ok(!(await page.$('.cp-se')) && (await page.locator('.slide .notes .cp-you').count()) === nF, 'Schon erklärte Folie zeigt die Lösung sofort, mit den eigenen Worten');
  await page.evaluate(() => localStorage.removeItem('ngfc.ai'));

  // 3. Quiz im Kapitel: zählt sofort, ohne Sicherheitsfrage. Der Vorab-Tipp wird aufgelöst.
  for (let n = 0; n < 6 && !(await page.$('.quiz')); n++) await page.click('#nextStep');
  const xpQuiz = (await st()).xp, right = await page.evaluate(() => CH.find(c => c.id === 'k01').quiz[0].correct);
  await page.click(`.quiz .opt[data-i="${right}"]`);
  const s3 = await st();
  ok(!(await page.$('.quiz .conf, .quiz .cf')) && s3.quiz['k01:0'] === 1 && s3.xp === xpQuiz + 10 && !(s3.cal && s3.cal.sr), 'Sofort richtig wird gezählt und gibt 10 XP, nach der Sicherheit fragt erst die Wiederholung');
  ok(await page.isVisible('.pre-note'), 'Vorab-Tipp wird nach dem Quiz aufgelöst');

  // 4. Übung gilt als gelöst (geschafft zählt nur mit grüner Übung, siehe pending.test.js), Kapitelende: erst aus dem Kopf
  await page.evaluate(() => { S.ex.ex01 = { passed: true, fails: 0 }; save(); });
  for (let n = 0; n < 6 && !(await page.$('#dumpIn')); n++) await page.click('#nextStep');
  ok(await page.isVisible('#dumpIn') && !(await page.isVisible('#nextStep')), 'Kapitelende fragt erst aus dem Kopf ab');
  await page.fill('#dumpIn', 'Komponente = Klasse + Template');
  await page.click('#dumpGo');
  ok(await page.isVisible('blockquote.mine') && (await page.locator('.end li').count()) > 0, 'Danach Vergleich mit den Merksätzen');
  const s4 = await st();
  ok(s4.srs['q:k01:0'] && s4.srs['m:k01'] && s4.srs['x:k01'], 'Karten für die Wiederholung entstehen');
  ok(s4.srs['q:k01:0'].due > Date.now(), 'Erste Wiederholung liegt in der Zukunft');

  // 4b. Abschluss ohne Ablenkung (früher der Ruhemodus): zwei Wege, dann ein Schreibtisch mit einem Hauptknopf
  const paths = await page.evaluate(() => [...document.querySelectorAll('.cp-finale a')].map(a => a.id + a.getAttribute('href')).join());
  ok(paths === 'cpNext#k02,cpHome#start' && !(await page.isVisible('#nextStep')), 'Abschluss: genau zwei Wege, „Nächstes Kapitel“ und „Zum Schreibtisch“');
  ok(!(await page.$('.rf, #pauseBtn, #calmBtn')) && !(await page.evaluate(() => document.body.classList.contains('calm'))), 'Den Ruhemodus gibt es nicht mehr: kein Schalter, keine Einschätzung vor dem Weitergehen');
  await page.click('#cpHome'); await page.waitForSelector('.hub');
  ok(await page.evaluate(() => { const id = document.querySelector('#hubGo').getAttribute('href').slice(1); return CH.some(c => c.id === id) && !S.done[id] && !!S.done.k01; }) && (await page.locator('#main .btn.primary').count()) === 1, 'Schreibtisch: genau ein Hauptknopf, er führt in ein offenes Kapitel');
  ok((await page.locator('.hub-path details[open]').count()) === 1 && (await page.locator('.hub-path details[open][data-act]').count()) === 1, 'Dein Weg: nur die aktuelle Phase ist aufgeklappt');

  // 6. Hilfe-Leiter in der Übung: erst die Tipps, dann die Lösung mit Lücken, die ganze Lösung ist die letzte Sprosse
  await page.goto(URL + '#k03'); await page.evaluate(() => { S.steps.k03 = buildSteps(CH.find(c => c.id === 'k03')).findIndex(s => s.t === 'code'); save(); }); await reloadIt(page);
  await page.waitForFunction(() => window.ts, null, { timeout: 30000 });
  await page.waitForSelector('#runTests');
  const tips = await page.evaluate(() => CH.find(c => c.id === 'k03').ex.hints.length);
  for (let n = 0; n < tips; n++) await page.click('#hintBtn');
  ok((await page.locator('#hints .hint').count()) === tips && (await page.textContent('#hintBtn')) === 'Lösung mit Lücken zeigen' && !(await page.isVisible('#solBox')), 'Hilfe-Leiter: Nach den Tipps bietet der Knopf die Lösung mit Lücken an');
  await page.click('#hintBtn');
  ok((await page.textContent('#solBox')).includes('____') && (await page.textContent('#hintBtn')) === 'Ganze Lösung zeigen', 'Lückentext-Lösung hat Lücken, die ganze Lösung kommt erst danach');

  // 7. Alter Stand ohne neue Felder läuft
  await page.evaluate(() => { localStorage.setItem('ngfc.v1', JSON.stringify({ xp: 100, steps: {}, done: { k01: 1 }, quiz: {}, ex: {}, code: {}, days: [], badges: [], updated: 1 })); });
  await page.goto(URL + '#start'); await reloadIt(page); await page.waitForSelector('.hub');
  ok(await page.isVisible('#hubRepeat') && /^Wiederholen · \d+ Karten?$/.test(await page.textContent('#hubRepeat')), 'Alter Fortschritt: Schreibtisch zeigt die fällige Wiederholung');
  await page.goto(URL + '#plan'); await page.waitForFunction(() => location.hash === '#start');
  ok(await page.isVisible('.hub') && !(await page.$('.ov-mem, .today')), 'Die alte Adresse #plan führt zum Schreibtisch');

  // 9. HTML im Code: Klick aufs Tag öffnet die Karte zum Element. Eine Liste neben der Folie gibt es nicht mehr.
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.evaluate(() => { S.codeLine = Object.assign(S.codeLine || {}, Object.fromEntries([0, 1, 2, 3, 4, 5].map(i => ['g01:' + i, { ok: 0, problems: 0 }]))); S.steps.g01 = 3; save(); });
  await page.goto(URL + '#g01'); await page.waitForSelector('.slide .lx');
  ok(!(await page.$('.htmlside, .hs-it, .lexpanel')), 'Breit: keine HTML-Liste neben der Folie');
  const bx = await page.$$eval('.slide .lx', els => { const e = els.find(x => x.textContent.trim() === 'button'); if (e) e.click(); return !!e; });
  ok(bx && await page.isVisible('.lexpop .lexcard') && (await page.textContent('.lexpop .lc-k')) === '<button>' && await page.isVisible('.lexpop .el-what'), 'Klick auf <button> im Code öffnet die Karte zum HTML-Element');
  ok((await page.locator('.lexpop .el-more').count()) === 1 && !(await page.evaluate(() => document.querySelector('.lexpop .el-more').open)), 'Attribute und Events sind in der Karte eingeklappt');
  await page.keyboard.press('Escape');
  ok(!(await page.isVisible('.lexpop')), 'Escape schließt die Karte');
  await page.setViewportSize({ width: 400, height: 800 }); await reloadIt(page); await page.waitForSelector('.slide .lx');
  await page.$$eval('.slide .lx', els => els.find(x => x.textContent.trim() === 'button').click());
  ok(await page.isVisible('.lexpop.sheet .lexcard') && !(await sideScroll(page)), 'Schmal: Die Karte kommt als Blatt von unten, ohne Querscrollen');

  await learn(browser, ok, errors);

  ok(!errors.length, 'Keine Seitenfehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fails ? `\n${fails} Prüfung(en) rot` : '\nAlles grün');
  process.exit(fails ? 1 : 0);
})();
