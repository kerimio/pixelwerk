// Prüft im echten Browser, was beim Lernen hilft:
// Vorab-Tipp, „Erklär die Zeilen selbst“, Kapitel-Ablauf mit Karten für die Wiederholung, Hilfe-Leiter (Abschnitte 1 bis 9, eine Seite),
// danach der Bereich Lernen mit festen Spielständen (Abschnitte 10 bis 16): Lerntag und Abstände, Sitzung mit fälligen Karten,
// „nochmal bis es sitzt“, freie Runde, #blitz, Seite #wissen, Handy.
const { chromium } = require('playwright');
const { neuLaden } = require('./hilfe');
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');
const NM = path.join(root, 'node_modules');
const URL = 'file://' + path.join(root, 'index.html');

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) fails++; };

/* ---------- Bereich Lernen: eigene Seiten mit festem Spielstand, unabhängig vom Kapitel-Ablauf ---------- */
const TAG = 864e5;
const stand = (done, mehr) => Object.assign({ ich: { start: 1 }, xp: 100, steps: {}, done, quiz: {}, ex: {}, code: {}, days: [], badges: [], updated: 1 }, mehr || {});
async function seite(browser, errors, st, hash, ctxOpts) {
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
const karte = p => p.evaluate(() => {
  if (document.querySelector('.le-bilanz')) return { t: 'ende' };
  const f = document.querySelector('#wdhBody .le-frage'); if (!f) return null;
  const label = document.querySelector('#wdhBody .le-label').textContent, nochmal = label.includes('Nochmal');
  const text = h => { const d = document.createElement('div'); d.innerHTML = leHtml(h); return d.textContent; };
  if (document.querySelector('#xLos')) return { t: 'x', id: CH.find(c => c.ex && c.ex.title === f.textContent).id, nochmal };
  if (document.querySelector('#aufdecken')) return { t: 'm', id: CH.find(c => f.textContent.includes('„' + c.title + '“')).id, nochmal };
  const opts = [...document.querySelectorAll('.le-opts .opt')];
  for (const c of CH) if (label.endsWith(c.title)) for (let i = 0; i < c.quiz.length; i++) if (text(c.quiz[i].q) === f.textContent)
    return { t: 'q', id: c.id, i, nochmal, korrekt: c.quiz[i].correct, taste: opts.findIndex(b => +b.dataset.i === c.quiz[i].correct) + 1, tasten: opts.map(b => b.querySelector('.key').textContent).join('') };
  return null;
});
/* Spielt eine Runde bis zur Bilanz. wahl(karte) liefert für Fragen { richtig, sicher, tastatur }, für Merksätze die Note 0 bis 2.
   Rückgabe: Protokoll mit allem, was dabei zu sehen war. */
async function spiele(p, wahl) {
  const log = [];
  for (let n = 0; n < 60; n++) {
    const k = await karte(p);
    if (!k) throw new Error('Runde: unbekannte Karte');
    if (k.t === 'ende') return log;
    if (k.t === 'q') {
      const w = wahl(k);
      if (w.tastatur) await p.keyboard.press(String(k.taste));
      else await p.click(w.richtig ? `.le-opts .opt[data-i="${k.korrekt}"]` : `.le-opts .opt:not([data-i="${k.korrekt}"])`);
      k.gefragt = await p.isVisible('.conf .cf');
      if (k.gefragt) { if (w.tastatur) await p.keyboard.press(w.sicher ? '1' : '2'); else await p.click(`.cf[data-c="${w.sicher ? 1 : 0}"]`); }
      await p.waitForSelector('#wdhWeiter');
      k.hyper = await p.isVisible('.hyper'); k.warum = await p.textContent('.le-warum'); k.stand = await p.textContent('#leStand');
      k.fokus = await p.evaluate(() => document.activeElement.id);
      if (w.tastatur) await p.keyboard.press('ArrowRight'); else await p.click('#wdhWeiter');
    } else if (k.t === 'm') {
      const g = wahl(k);
      await p.fill('#recallIn', 'Stichwort'); await p.click('#aufdecken');
      k.merke = await p.locator('.le-merke li').count();
      if (g === 2) await p.keyboard.press('3'); else await p.click(`.gr[data-g="${g}"]`);
    } else {
      await p.click('#xLos'); await p.waitForSelector('#editor .CodeMirror');
      k.balkenOben = await p.isVisible('.le-xbar #leAuf');
      await p.evaluate(id => document.querySelector('.CodeMirror').CodeMirror.setValue(CH.find(c => c.id === id).ex.solution), k.id);
      await p.click('#runTests'); await p.waitForSelector('#wdhWeiter', { timeout: 30000 });
      await p.click('#wdhWeiter');
    }
    log.push(k);
  }
  throw new Error('Runde endet nicht');
}
const querscroll = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const zuKlein = (p, sel) => p.evaluate(s => [...document.querySelectorAll(s)].filter(e => e.offsetParent && e.getBoundingClientRect().height < 40).map(e => e.className || e.tagName), sel);

async function lernen(browser, ok, errors) {
  const alt = Date.now() - 9 * TAG;

  // 10. Lerntag und Abstände: gerechnet wird in Kalendertagen, der Lerntag beginnt um 4 Uhr (Zeitzone mit Zeitumstellung)
  const z = await seite(browser, errors, stand({}), 'wdh', { timezoneId: 'Europe/Berlin' });
  const L = await z.evaluate(() => {
    const d = (...a) => new Date(...a).getTime(), r = {}, echtJetzt = Date.now, echtZufall = Math.random;
    r.spaet = leFaelligIn(1, d(2026, 10, 17, 23, 50)) === d(2026, 10, 18, 4);
    r.nachts = leFaelligIn(1, d(2026, 10, 18, 1, 30)) === d(2026, 10, 18, 4);
    r.winterzeit = leFaelligIn(3, d(2026, 9, 24, 12)) === d(2026, 9, 27, 4);
    r.sommerzeit = leFaelligIn(3, d(2026, 2, 27, 12)) === d(2026, 2, 30, 4);
    r.stunden = true;
    for (const start of [d(2026, 9, 23), d(2026, 2, 27)]) for (let h = 0; h < 96; h++) { const ab = start + h * 36e5, f = leFaelligIn(1, ab); if (!(f > ab) || f - ab > 25 * 36e5 || new Date(f).getHours() !== 4) r.stunden = false; }

    Date.now = () => d(2026, 10, 17, 23, 50); Math.random = () => 0.5;
    const tage = k => leTageBis(S.srs[k].due), neu = () => ({ s: 0, n: 0, l: 0, due: 0 });
    /* Karten entstehen mit dem Kapitel: Fragen nach 1, Merksätze nach 2, Übung nach 4 Tagen */
    S.done = { g01: Date.now(), k01: Date.now() }; S.srs = {}; srsSeed();
    r.saat = [tage('q:g01:0'), tage('m:g01'), tage('x:k01')].join();
    r.nichtSofort = srsDue(d(2026, 10, 18, 0, 5)).length === 0;
    r.amMorgen = srsDue(d(2026, 10, 18, 4)).sort().join();
    const vorher = JSON.stringify(S.srs); srsSeed(); r.keineDoppelten = JSON.stringify(S.srs) === vorher;
    /* Karten ohne Frage, ohne Kapitel, ohne Übung zählen nirgends mit */
    const echte = Object.keys(S.srs).length;
    S.srs['q:g01:99'] = { s: 0, n: 0, l: 0, due: 1 }; S.srs['q:weg:0'] = { s: 0, n: 0, l: 0, due: 1 }; S.srs['x:g02'] = { s: 0, n: 0, l: 0, due: 1 };
    r.geister = srsDue().length === 0 && srsStats().total === echte && wdhRunde().length === 0 && srsStats().naechste === d(2026, 10, 18, 4);
    /* Alter Spielstand: Kapitel ohne Zeitstempel sind gleich fällig */
    S.done = { k01: 1 }; S.srs = {}; r.altFaellig = srsDue().sort().join();

    /* Bewertung bestimmt den Abstand */
    S.srs = { sicher: neu(), geraten: neu(), reif: { s: 18.75, n: 3, l: 0, due: 0 }, jung: { s: 3, n: 1, l: 0, due: 0 }, karg: { due: 1 }, lang: { s: 300, n: 9, l: 0, due: 0 } };
    srsGrade('sicher', 2); srsGrade('geraten', 1);
    r.erste = [S.srs.sicher.s, tage('sicher'), S.srs.geraten.s, tage('geraten')].join();
    srsGrade('sicher', 2); srsGrade('geraten', 1);
    r.zweite = [S.srs.sicher.s, tage('sicher'), tage('geraten')].join();
    srsGrade('reif', 0); r.fehler = [S.srs.reif.s, tage('reif'), S.srs.reif.l, S.srs.reif.r].join();
    srsGrade('reif', 2); r.auffrischung = [S.srs.reif.s, tage('reif'), S.srs.reif.r].join();
    srsGrade('reif', 2); r.danach = [S.srs.reif.s, tage('reif')].join();
    srsGrade('jung', 0); r.jungFehler = [S.srs.jung.s, tage('jung'), S.srs.jung.r].join();
    srsGrade('jung', 2); r.jungDanach = [S.srs.jung.s, tage('jung')].join();
    srsGrade('karg', 0); srsGrade('karg', 2); r.karg = JSON.stringify([S.srs.karg.s, S.srs.karg.n, S.srs.karg.l, tage('karg')]);
    srsGrade('lang', 2); r.deckel = S.srs.lang.s;
    r.nieSofort = Object.values(S.srs).every(c => c.due > Date.now());

    /* Mischen: zwei Kapitel mit gleich vielen Karten wechseln sich ab, die Übung kommt zum Schluss, höchstens 15 Karten */
    Date.now = echtJetzt; Math.random = echtZufall;
    r.gemischt = true; r.xAmEnde = true;
    S.done = { g02: 1, g03: 1 }; S.srs = {};
    for (let n = 0; n < 30; n++) { const runde = wdhRunde(), ch = runde.map(k => k.split(':')[1]); if (ch.some((c, i) => i && c === ch[i - 1]) || new Set(runde).size !== 10) r.gemischt = false; }
    S.done = { g02: 1, k01: 1 }; S.srs = {};
    for (let n = 0; n < 30; n++) { const runde = wdhRunde(); if (runde.length !== 11 || runde.indexOf('x:k01') !== 10) r.xAmEnde = false; }
    S.done = Object.fromEntries(CH.map(c => [c.id, 1])); S.srs = {};
    const voll = wdhRunde();
    r.deckelRunde = [voll.length, voll.filter(k => k[0] === 'm').length <= 3, voll.filter(k => k[0] === 'x').length <= 1, new Set(voll).size].join();

    /* Vorab-Tipp: Überschrift, Auflösung im Quiz, kein Tipp mehr nach dem Kapitel */
    const ch = CH.find(c => c.id === 'k03'), f = (ch.quiz[0].correct + 1) % ch.quiz[0].options.length;
    S.done = {}; S.quiz = {}; S.pre = {};
    const h = preTestHtml(ch); r.tipp = h.includes('class="pretest" id="pretest"') && h.includes('Dein Tipp?') && h.includes('zählt nicht') && !h.includes('disabled');
    S.pre = { k03: f }; r.tippFalsch = preNote(ch, 0).includes('getippt') && preNote(ch, 0).includes(ch.quiz[0].options[f].slice(0, 8)) && preNote(ch, 1) === '';
    S.pre = { k03: ch.quiz[0].correct }; r.tippRichtig = preNote(ch, 0).includes('Das stimmte');
    S.pre = { k03: 9 }; r.tippKaputt = preNote(ch, 0) === '';
    S.pre = {}; S.done = { k03: 1 }; r.tippVorbei = preTestHtml(ch) === '';
    /* Lösung mit Lücken: jede Übung behält ihr Gerüst und bekommt Lücken, nie die ganze Lösung */
    r.luecken = CH.filter(c => c.ex).every(c => { const l = c.ex.solution.split('\n'), f = fadeSolution(c.ex.solution, c.ex.starter).split('\n'); return f.length === l.length && f.some(x => x.includes('____')) && f.some((x, i) => x.trim() && x === l[i]) && f.every((x, i) => x === l[i] || x.includes('____')); });
    /* Rohe spitze Klammern in Fragen bleiben lesbar, <code> bleibt Auszeichnung */
    r.klammern = leHtml('Typsicher mit <T>. <code>a < b</code><br> <button> <img onerror="x">') === 'Typsicher mit &lt;T>. <code>a &lt; b</code><br> &lt;button> &lt;img onerror="x">' && leHtml('&lt;p&gt;') === '&lt;p&gt;' && leHtml(null) === '';
    return r;
  });
  ok(L.spaet && L.nachts, 'Lerntag: Wer um 23:50 oder 1:30 fertig wird, sieht die Karte erst ab 4 Uhr früh wieder');
  ok(L.winterzeit && L.sommerzeit && L.stunden, 'Zeitumstellung verschluckt und verdoppelt keinen Tag, fällig ist immer um 4 Uhr und nie in der Vergangenheit');
  ok(L.saat === '1,2,4', 'Erste Wiederholung: Fragen nach 1, Merksätze nach 2, Übung nach 4 Tagen (' + L.saat + ')');
  ok(L.nichtSofort && L.amMorgen === 'q:g01:0,q:g01:1,q:g01:2,q:k01:0,q:k01:1,q:k01:2', 'Ein spät geschafftes Kapitel ist nicht nach Mitternacht schon wieder fällig, sondern am Morgen');
  ok(L.keineDoppelten, 'Karten entstehen nur einmal');
  ok(L.geister, 'Karten für gelöschte Fragen, Kapitel und Übungen zählen nirgends mit');
  ok(L.altFaellig === 'm:k01,q:k01:0,q:k01:1,q:k01:2,x:k01,z:k01', 'Alter Spielstand ohne Zeitstempel: Karten sind gleich fällig');
  ok(L.erste === '3,3,1.5,2', 'Erster Treffer: sicher kommt nach 3 Tagen wieder, geraten nach 2 (' + L.erste + ')');
  ok(L.zweite === '7.5,8,2', 'Zweiter Treffer: sicher wächst auf etwa 7 Tage, geraten bleibt kurz (' + L.zweite + ')');
  ok(L.fehler === '6,1,1,1', 'Fehler bei einer reifen Karte: morgen wieder, Abstand fällt auf ein Drittel (' + L.fehler + ')');
  ok(L.auffrischung === '6,6,' && L.danach === '15,15', 'Sitzt die Auffrischung, gilt der gekürzte Abstand, danach wächst er wieder (' + L.auffrischung + ' / ' + L.danach + ')');
  ok(L.jungFehler === '1,1,' && L.jungDanach === '2.5,3', 'Fehler bei einer jungen Karte: morgen wieder, dann nach 3 Tagen');
  ok(L.karg === '[2.5,2,1,3]' && L.deckel === 365 && L.nieSofort, 'Karten ohne Zähler rechnen sauber, nie über ein Jahr, nie sofort wieder fällig (' + L.karg + ', ' + L.deckel + ')');
  ok(L.gemischt && L.xAmEnde, 'Mischen: Kapitel wechseln sich ab, Code aus dem Kopf kommt zum Schluss');
  ok(L.deckelRunde === '15,true,true,15', 'Eine Runde hat höchstens 15 Karten, davon 3 Merksatz-Karten und 1 Übung (' + L.deckelRunde + ')');
  ok(L.tipp && L.tippFalsch && L.tippRichtig && L.tippKaputt && L.tippVorbei, 'Vorab-Tipp heißt „Dein Tipp?“, wird im Quiz aufgelöst und verschwindet nach dem Kapitel');
  ok(L.luecken, 'Lösung mit Lücken: alle Übungen behalten ihr Gerüst und haben Lücken');
  ok(L.klammern, 'Fragen mit rohem <T> oder <button> zeigen die Klammern als Text, statt sie zu schlucken');
  await z.context().close();

  // 11. Sitzung mit fälligen Karten: Bewertung bestimmt den Abstand, nochmal bis es sitzt, Bilanz
  /* Dieselbe Runde wie früher: Die später dazugekommenen Fragen von k01 und k02, die Übung von g01 und das Zuordnen (eigener Test: zuordnen.test.js)
     sind erst in ein paar Tagen dran */
  const spaeter = { s: 3, n: 1, l: 0, due: Date.now() + 5 * TAG }, extra = Object.fromEntries(['q:k01:1', 'q:k01:2', 'q:k02:1', 'q:k02:2', 'x:g01', 'z:g01', 'z:k01', 'z:k02'].map(k => [k, Object.assign({}, spaeter)]));
  const s = await seite(browser, errors, stand({ g01: alt, k01: alt, k02: alt }, { srs: extra }), 'wdh');
  ok((await s.textContent('.le-kopf h1')) === 'Wiederholen' && (await s.getAttribute('.le-kopf .ort a', 'href')) === '#start' && (await s.textContent('#leStand')) === '0 von 9 geschafft', 'Kopf: leise zurück zum Schreibtisch, Titel, Stand der Sitzung');
  const mNoten = {};
  const log = await spiele(s, k => {
    if (k.t === 'm') { if (k.id === 'k01' && !k.nochmal) return 0; return 2; }
    if (k.nochmal) return { richtig: true };
    if (k.id === 'g01' && k.i === 0) return { richtig: false, sicher: true };
    if (k.id === 'g01' && k.i === 1) return { richtig: true, sicher: false };
    return { richtig: true, sicher: true, tastatur: k.id === 'g01' };
  });
  const erste = log.filter(k => !k.nochmal), wieder = log.filter(k => k.nochmal), f0 = log.find(k => k.t === 'q' && k.id === 'g01' && k.i === 0 && !k.nochmal);
  ok(erste.length === 9 && erste.filter(k => k.t === 'q').length === 5 && erste.filter(k => k.t === 'm').length === 3 && erste.filter(k => k.t === 'x').length === 1, 'Sitzung mischt Fragen, Merksätze und Code aus dem Kopf (9 Karten)');
  ok(erste.filter(k => k.t === 'q').every(k => k.gefragt && k.tasten === '1234'), 'Vor der Auflösung kommt „Wie sicher bist du?“');
  ok(f0.hyper && f0.warum.startsWith('Daneben.') && erste.filter(k => k !== f0 && k.t === 'q').every(k => !k.hyper), 'Sicher und daneben zeigt den Hinweis, sonst nicht');
  ok(log.find(k => k.id === 'g01' && k.i === 1).warum.startsWith('Richtig, aber geraten.') && log.find(k => k.id === 'g01' && k.i === 2).warum.startsWith('Sitzt.'), 'Auflösung sagt, ob es saß oder geraten war');
  ok(wieder.length === 2 && wieder.some(k => k.t === 'q' && k.id === 'g01' && k.i === 0 && !k.gefragt) && wieder.some(k => k.t === 'm' && k.id === 'k01'), 'Nochmal, bis es sitzt: Falsches kommt in derselben Runde wieder, ohne zweite Sicherheitsfrage');
  ok(log.filter(k => k.t === 'q').every(k => k.fokus === 'wdhWeiter') && log.find(k => k.id === 'g01' && k.i === 2).stand !== '0 von 9 geschafft', 'Tasten 1 bis 4 und Pfeil rechts steuern die Karte, der Stand zählt sofort mit');
  ok(log.find(k => k.t === 'x').balkenOben && log.filter(k => k.t === 'm').every(k => k.merke >= 3), 'Merksätze werden aufgedeckt, Code aus dem Kopf läuft mit eigener Leiste');
  const e = await s.evaluate(() => ({ S: JSON.parse(JSON.stringify(S)), tage: Object.fromEntries(Object.keys(S.srs).map(k => [k, leTageBis(S.srs[k].due)])), faellig: srsDue() }));
  const c = e.S.srs;
  ok(c['q:g01:0'].l === 1 && c['q:g01:0'].n === 1 && e.tage['q:g01:0'] === 1, 'Daneben: Die Karte kommt morgen wieder, der zweite Versuch in der Runde ändert das nicht');
  ok(e.tage['q:g01:1'] === 2 && e.tage['q:g01:2'] === 3 && c['q:g01:1'].s < c['q:g01:2'].s, 'Richtig, aber geraten kommt früher wieder als sicher gewusst');
  ok(e.tage['m:k01'] === 1 && e.tage['m:g01'] === 3 && e.tage['m:k02'] === 3, 'Merksätze: „Kaum was“ kommt morgen, „Fast alles“ nach 3 Tagen');
  ok(e.faellig.length === 1 && e.faellig[0][0] === 'x' && Object.values(e.tage).filter(t => t >= 1).length === 9 + 8, 'Alle Karten der Runde sind neu geplant, offen bleibt nur die zweite Übung');
  ok(e.S.cal.sr === 3 && e.S.cal.sw === 1 && e.S.cal.ur === 1 && !e.S.cal.uw, 'Sicherheit wird nur beim ersten Versuch gezählt');
  ok(e.S.xp === 100 + 8 * 3 + 20, 'XP: 3 je Karte, 20 für die Übung, einmal gutgeschrieben (' + e.S.xp + ')');
  ok(Object.keys(e.S.code).length === 0 && !e.S.weak, 'Code aus dem Kopf überschreibt keinen gespeicherten Code, die Sitzung fasst S.weak nicht an');
  const bil = await s.evaluate(() => ({ zahl: document.querySelector('.le-zahl').textContent, wann: [...document.querySelectorAll('.le-wann li')].map(li => li.textContent).join('|'), knoepfe: [...document.querySelectorAll('#wdhBody .btn')].map(b => b.getAttribute('href')).join(), text: document.querySelector('.le-bilanz').textContent, stand: document.querySelector('#leStand').textContent, fokus: document.activeElement.id }));
  ok(bil.zahl === '7 von 9' && bil.wann === '2morgen|7in 2 bis 7 Tagen' && bil.text.includes('+44 XP'), 'Bilanz: wie viele saßen und wann die Karten wiederkommen (' + bil.zahl + ', ' + bil.wann + ')');
  ok(bil.knoepfe === '#start' && bil.fokus === 'leHeim' && bil.text.includes('Noch 1 Karte fällig'), 'Am Ende genau ein Knopf: zurück zum Schreibtisch');
  await s.click('#leNochmal');
  ok((await karte(s)).t === 'x' && (await s.textContent('#leStand')) === '0 von 1 geschafft', 'Sind noch Karten fällig, geht es auf Wunsch mit der nächsten Runde weiter');
  await s.click('#xSkip');
  ok((await karte(s)).t === 'ende' && (await s.evaluate(() => srsDue().length)) === 0 && (await s.evaluate(() => leTageBis(S.srs['x:k01'].due) === 1 || leTageBis(S.srs['x:k02'].due) === 1)), '„Heute nicht“ verschiebt die Übung auf morgen');
  await s.context().close();

  // 12. Mittendrin weg: Bewertungen bleiben, XP werden gutgeschrieben, die Zurück-Taste führt nicht in eine halbe Karte
  const w = await seite(browser, errors, stand({ g01: alt }, { srs: { 'm:g01': { s: 3, n: 1, l: 0, due: Date.now() + 5 * TAG }, 'x:g01': { s: 3, n: 1, l: 0, due: Date.now() + 5 * TAG }, 'z:g01': { s: 3, n: 1, l: 0, due: Date.now() + 5 * TAG } } }), 'start');
  await w.evaluate(() => { location.hash = 'wdh'; }); await w.waitForSelector('.le-opts .opt');
  await w.keyboard.press('1'); await w.keyboard.press('1'); await w.waitForSelector('#wdhWeiter');
  await w.click('#wdhWeiter');
  const doppelt = await w.evaluate(() => { document.querySelector('.le-opts .opt').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 2 })); return document.querySelectorAll('.le-opts .opt:disabled, .conf').length; });
  await w.click('.le-opts .opt');
  ok(doppelt === 0 && await w.isVisible('.conf .cf'), 'Schnelles Klicken: Der zweite Klick eines Doppelklicks auf „Weiter“ wählt keine Antwort, ein einfacher Klick schon');
  await w.keyboard.press('2'); await w.waitForSelector('#wdhWeiter');
  await w.goBack(); await w.waitForFunction(() => !document.querySelector('#wdhBody'));
  const weg = await w.evaluate(() => S.xp + ' XP, ' + srsDue().length + ' fällig, ' + location.hash);
  ok(weg === '106 XP, 1 fällig, #start', 'Sitzung mittendrin verlassen: Die Karte ist bewertet, ihre XP sind da (' + weg + ')');
  await w.goForward(); await w.waitForSelector('.le-opts .opt');
  ok((await w.textContent('#leStand')) === '0 von 1 geschafft' && (await w.evaluate(() => S.xp)) === 106, 'Zurück in die Wiederholung: neue Runde mit den übrigen Karten, keine XP doppelt');
  await w.context().close();

  // 13. Nichts fällig: ruhige Seite mit einem Knopf. Die freie Runde ändert keine Abstände, zählt aber eigene Fehler (S.weak)
  const jetzt = Date.now();
  const fr = await seite(browser, errors, stand({ g01: jetzt, g02: jetzt, k01: jetzt }, { weak: { 'g01:0': 2, 'g01:1': 1 }, cal: { sr: 1, sw: 0, ur: 0, uw: 0 } }), 'wdh');
  const ruhe = await fr.evaluate(() => ({ text: document.querySelector('#main').textContent, knoepfe: [...document.querySelectorAll('#main .btn, #main button')].map(b => b.id).join(), h1: document.querySelector('.le-kopf h1').textContent }));
  ok(ruhe.h1 === 'Wiederholen' && ruhe.text.includes('Nichts zu wiederholen') && ruhe.text.includes('Die nächste Karte kommt morgen') && ruhe.knoepfe === 'leFrei', 'Nichts fällig: ruhige Seite, wann die nächste Karte kommt, ein Knopf „Freie Runde“');
  /* Fester Pool von genau 7 Fragen wie früher (g01 und g02 je 3, von k01 nur die erste), damit jede Frage einmal drankommt.
     Zuordnen bleibt hier draußen, das prüft zuordnen.test.js. */
  /* Die Seite zieht ihren Pool beim Zeichnen, darum danach neu zeichnen */
  await fr.evaluate(() => { CH.find(c => c.id === 'k01').quiz.length = 1; CH.forEach(c => { c.paare = null; }); renderWdh(document.querySelector('#main')); });
  const srsVorher = await fr.evaluate(() => JSON.stringify(S.srs));
  await fr.click('#leFrei');
  ok((await fr.textContent('.le-kopf h1')) === 'Freie Runde' && (await fr.textContent('#leStand')) === '0 von 7 geschafft', 'Freie Runde: dieselbe Karten-Oberfläche, 7 Fragen aus gespielten Kapiteln');
  let serie = 0, bonus = 0;
  const flog = await spiele(fr, k => { const falsch = k.id === 'g02' && k.i === 0 && !k.nochmal; if (!k.nochmal) { if (falsch) serie = 0; else if (++serie === 5) bonus = 15; } return { richtig: !falsch }; });
  const fe = await fr.evaluate(() => ({ S: JSON.parse(JSON.stringify(S)), zahl: document.querySelector('.le-zahl').textContent, nach: [...document.querySelectorAll('.le-nach a')].map(a => a.getAttribute('href')).join(), knoepfe: [...document.querySelectorAll('#wdhBody .btn')].map(b => b.getAttribute('href')).join(), text: document.querySelector('.le-bilanz').textContent }));
  ok(flog.every(k => k.t === 'q' && !k.gefragt) && flog.filter(k => !k.nochmal).length === 7 && new Set(flog.map(k => k.id + k.i)).size === 7, 'Freie Runde: nur Quizfragen, jede einmal, keine Sicherheitsfrage');
  ok(flog.filter(k => k.nochmal).length === 1 && flog.find(k => k.nochmal).id === 'g02', 'Freie Runde: Falsches kommt nochmal, bis es sitzt');
  ok(JSON.stringify(fe.S.srs) === srsVorher && JSON.stringify(fe.S.cal) === '{"sr":1,"sw":0,"ur":0,"uw":0}', 'Freie Runde verändert keine Abstände und keine Sicherheits-Zählung');
  ok(fe.S.weak['g01:0'] === 1 && !('g01:1' in fe.S.weak) && fe.S.weak['g02:0'] === 1, 'Freie Runde: Fehler werden gemerkt (S.weak), Treffer bauen sie wieder ab');
  ok(fe.S.xp === 100 + 6 * 5 + bonus, 'Freie Runde: 5 XP je Treffer, 15 dazu bei 5 in Folge (' + fe.S.xp + ')');
  ok(fe.zahl === '6 von 7' && fe.nach === '#g02' && fe.knoepfe === '#start' && !fe.text.includes('So kommen sie wieder'), 'Freie Runde, Bilanz: Kapitel zum Nachlesen, ein Knopf zum Schreibtisch');
  await fr.click('#leNochmal');
  ok((await fr.textContent('.le-kopf h1')) === 'Freie Runde' && (await fr.textContent('#leStand')) === '0 von 7 geschafft', '„Noch eine Runde“ startet eine neue freie Runde');
  /* Die Ziehungen hängen am Zufall. Damit die Zählungen bei jedem Lauf dieselben sind, zieht die Seite hier mit einem festen
     Zufallsgenerator (mulberry32). zufallFest(start) setzt ihn auf einen Startwert. Gleiche Gewichte geben dann gleiche Ziehungen. */
  await fr.evaluate(() => { window.zufallFest = start => { let a = start >>> 0; Math.random = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }; });
  const oft = await fr.evaluate(() => { zufallFest(7); S.steps = { k03: 2 }; S.weak = { 'g01:0': 3 }; let n = 0, fremd = false; for (let i = 0; i < 300; i++) { const p = leFreiPool(); if (p.length !== 7 || new Set(p).size !== 7 || p.some(k => !/^q:(g01|g02|k01|k03):/.test(k))) fremd = true; if (p.includes('q:g01:0')) n++; } return { n, fremd }; });
  ok(!oft.fremd && oft.n > 285, 'Freie Runde zieht nur aus gespielten Kapiteln, eigene Fehler öfter (' + oft.n + ' von 300 Runden)');
  /* Fehler aus dem Kapitel-Quiz: Erst im zweiten Anlauf richtig (S.quiz > 1) zählt wie ein Fehler aus einer freien Runde, sofort richtig nicht */
  const zweit = await fr.evaluate(() => {
    const zaehl = () => { const n = { a: 0, b: 0 }; for (let i = 0; i < 600; i++) { const p = leFreiPool(); if (p.includes('q:g01:0')) n.a++; if (p.includes('q:g01:1')) n.b++; } return n; };
    S.weak = {}; S.quiz = { 'g01:0': 2, 'g01:1': 1 }; zufallFest(11); const quiz = zaehl();
    S.quiz = {}; S.weak = { 'g01:0': 1 }; zufallFest(11); const weak = zaehl();
    S.weak = {}; zufallFest(11); const ohne = zaehl();
    return { quiz, weak, ohne, fragen: new Set(Array.from({ length: 50 }, leFreiPool).flat()).size, rest: JSON.stringify([S.weak, S.quiz]) };
  });
  ok(zweit.fragen > 7 && zweit.quiz.a > zweit.quiz.b + 40 && zweit.quiz.a > zweit.ohne.a + 40 && zweit.quiz.a === zweit.weak.a && zweit.quiz.b === zweit.weak.b && zweit.rest === '[{},{}]', 'Freie Runde: Im Kapitel-Quiz erst im zweiten Anlauf richtig zählt wie ein eigener Fehler (' + zweit.quiz.a + ' gegen ' + zweit.quiz.b + ' von 600 Runden, mit S.weak ' + zweit.weak.a + ', ohne ' + zweit.ohne.a + ')');
  await fr.context().close();

  // 14. Ganz neu: nichts zu wiederholen, keine freie Runde. #blitz zeigt dasselbe wie #wdh.
  const neu = await seite(browser, errors, { ich: { start: 1 } }, 'wdh');
  ok((await neu.textContent('#main')).includes('Nach deinem ersten Kapitel') && (await neu.locator('#main .btn, #main button').count()) === 0 && await neu.isVisible('.le-kopf .ort a'), 'Neuer Nutzer: Hinweis statt Karten, kein Knopf ins Leere');
  await neu.context().close();
  const bl = await seite(browser, errors, stand({ g01: alt }), 'blitz');
  ok((await bl.textContent('.le-kopf h1')) === 'Wiederholen' && await bl.isVisible('#wdhBody .le-frage') && !(await bl.$('#blitzBody')) && (await bl.locator('#main a[href="#blitz"]').count()) === 0, '#blitz zeigt die Wiederholung, das Blitz-Training gibt es nicht mehr');

  // 15. Seite „Wie diese App beim Lernen hilft“: nur, was es gibt, jede Quelle ein DOI-Link
  await bl.evaluate(() => { location.hash = 'wissen'; }); await bl.waitForSelector('.le-ws');
  const ws = await bl.evaluate(() => ({ text: document.querySelector('#main').innerText, n: document.querySelectorAll('.le-ws').length, h1: document.querySelector('.le-kopf h1').textContent,
    links: [...document.querySelectorAll('.le-wissen a')].map(a => a.href), ohne: [...document.querySelectorAll('.le-ws')].filter(d => !d.querySelector('a')).map(d => d.querySelector('summary b').textContent).join(),
    lang: WISSEN.filter(x => x.was.length > 130 || x.warum.length > 130 || !x.t || (x.was + x.warum).match(/[–—]/)).map(x => x.t).join() }));
  ok(ws.h1 === 'Wie diese App beim Lernen hilft' && ws.n >= 8 && ws.n <= 11, 'Seite #wissen: ' + ws.n + ' Methoden');
  /* Was die Seite über die App sagt, stimmt mit der App überein: erste Abstände aus srsSeed, Warum erst mit der richtigen Antwort, Bewegung */
  const wa = await bl.evaluate(() => {
    const ch = CH.find(c => c.quiz.length && c.ex && c.merke && c.merke.length), alt = JSON.stringify(S), was = t => WISSEN.find(w => w.t === t).was;
    S.done = { [ch.id]: Date.now() }; S.srs = {}; srsSeed();
    const tage = ['q:' + ch.id + ':0', 'm:' + ch.id, 'x:' + ch.id].map(k => leTageBis(S.srs[k].due));
    const dann = [2, 2, 2].map(g => { srsGrade('q:' + ch.id + ':0', g); return S.srs['q:' + ch.id + ':0'].s; });
    S = JSON.parse(alt);
    return { tage, dann, verteilt: was('Verteilt wiederholen'), rueck: was('Sofortige Rückmeldung'), ablenkung: was('Wenig Ablenkung') };
  });
  ok(wa.tage.join() === '1,2,4' && wa.verteilt.startsWith('Quizfragen kommen nach ' + wa.tage[0] + ' Tag wieder, Merksätze nach ' + wa.tage[1] + ', die Übung nach ' + wa.tage[2] + '.') && wa.verteilt.endsWith('etwa ' + wa.dann.map(Math.floor).join(', ') + ' Tage.'), '#wissen nennt die Abstände, die der Code setzt: ' + wa.verteilt);
  ok(!/und warum/.test(wa.rueck) && /Das Warum kommt mit der richtigen Antwort/.test(wa.rueck), '#wissen: Das Warum verspricht die Seite erst mit der richtigen Antwort');
  ok(/In Kapiteln und Übungen gibt es Bewegung nur als Rückmeldung/.test(wa.ablenkung), '#wissen: Bewegung nur als Rückmeldung gilt für Kapitel und Übungen (das Titelbild blinkt)');
  ok(!/Ruhemodus|Ruhig|Blitz|innehalten|Für dich erklärt|Hell als Standard|Fußball/i.test(ws.text), '#wissen nennt nichts, was es nicht mehr gibt');
  ok(['Verteilt wiederholen', 'Abrufen', 'Gemischt', 'Dein Tipp?', 'Erst selbst erklären', 'Lösung mit Lücken', 'Rückmeldung', 'Ablenkung'].every(t => ws.text.includes(t)), '#wissen nennt die Methoden, die es gibt');
  ok(ws.links.length >= 12 && ws.links.every(u => /^https:\/\/doi\.org\/10\.\d{4,}\/\S+$/.test(u)) && new Set(ws.links).size === ws.links.length, 'Jede Quelle ist ein DOI-Link, keine doppelt (' + ws.links.length + ')');
  ok(ws.ohne === '', 'Jede Methode nennt eine Quelle');
  ok(!ws.lang, 'Kurze Texte: höchstens 130 Zeichen je Satzblock, keine Gedankenstriche' + (ws.lang ? ' (' + ws.lang + ')' : ''));
  await bl.keyboard.press('Tab'); await bl.keyboard.press('Tab'); await bl.keyboard.press('Tab'); await bl.keyboard.press('Enter');
  ok((await bl.locator('.le-ws[open]').count()) === 1, '#wissen ist mit der Tastatur bedienbar');
  await bl.context().close();

  // 16. Handy (360 px breit): kein Querscrollen, Tippflächen mindestens 40 px.
  const hy = await seite(browser, errors, stand({ g01: alt, n03: alt, k29: alt }), 'wdh', { viewport: { width: 360, height: 740 }, hasTouch: true });
  const eng = [], klein = [], sel = '#main .opt, #main .cf, #main .gr, #main .btn, #main .linkbtn, #main .ort a, #main summary, #main .le-ws-q a, #main .le-nach a';
  ok((await hy.evaluate(() => innerWidth)) === 360, 'Handy: Die Seite ist wirklich 360 px breit');
  const messen = async wo => { if (await querscroll(hy)) eng.push(wo); const k = await zuKlein(hy, sel); if (k.length) klein.push(wo + ': ' + k.join(' ')); };
  for (let n = 0; n < 40; n++) {
    const k = await karte(hy); if (k.t === 'ende') break;
    await messen(k.t + ' ' + k.id);
    if (k.t === 'q') { await hy.tap(`.le-opts .opt:not([data-i="${k.korrekt}"])`); if (await hy.isVisible('.cf')) { await messen('sicher?'); await hy.tap('.cf[data-c="1"]'); } await messen('aufgelöst'); await hy.tap('#wdhWeiter'); }
    else if (k.t === 'm') { await hy.tap('#aufdecken'); await messen('aufgedeckt'); await hy.tap('.gr[data-g="1"]'); }
    else { await hy.tap('#xLos'); await hy.waitForSelector('#editor .CodeMirror'); await messen('übung'); await hy.tap('#leAuf'); }
  }
  await messen('bilanz');
  await hy.evaluate(() => { location.hash = 'wissen'; }); await hy.waitForSelector('.le-ws'); await hy.tap('.le-ws summary'); await messen('wissen');
  await hy.evaluate(() => { S.done = { g01: Date.now() }; S.srs = {}; location.hash = 'wdh'; }); await hy.waitForSelector('.le-ruhe'); await messen('ruhe');
  ok(!eng.length, 'Handy: kein Querscrollen' + (eng.length ? ' (' + eng.join(', ') + ')' : ''));
  ok(!klein.length, 'Handy: Tippflächen mindestens 40 px' + (klein.length ? ' (' + klein.join(' | ') + ')' : ''));
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
  ok(await page.isVisible('.kp-chat') && !(await page.isVisible('.ticket')) && !(await page.$('#pretest')) && await page.isDisabled('#prevStep'), 'Szene startet mit dem Team-Chat, Ticket und Tipp kommen danach');
  ok(!(await page.isVisible('#nextStep')), 'Solange die Szene läuft, gibt es kein „Weiter“ neben „Alles zeigen“');
  await page.click('.kp-alles');
  ok(await page.isVisible('.ticket') && await page.isVisible('#kpAnnehmen') && !(await page.isVisible('#nextStep')) && !(await page.$('#pretest')) && (await page.textContent('.ch-head h1')) && (await page.textContent('#stepQuiet')).startsWith('Ticket'), '„Alles zeigen“ zeigt den ganzen Chat und das Ticket, nicht die nächste Folie');
  await page.click('#kpAnnehmen');
  ok(await page.isVisible('#pretest') && (await page.textContent('#pretest')).includes('Dein Tipp?') && await page.isVisible('#nextStep'), 'Der Vorab-Tipp erscheint, wenn das Ticket angenommen ist, dazu „Weiter“');
  await page.click('#pretest .opt[data-i="0"]');
  ok((await st()).pre.k01 === 0, 'Vorab-Tipp wird gespeichert');

  // 2. Erklär die Zeilen selbst, mit Toni als Prüfer: „Noch nicht“ gibt Denkanstöße ohne Lösung, „Richtig“ zeigt die Lösung
  await page.evaluate(() => localStorage.setItem('ngfc.ai', JSON.stringify({ key: 'test', model: 'gemini-2.5-flash' })));
  await page.click('#nextStep');
  const xpVor = (await st()).xp, nF = await page.locator('.kp-se-in').count();
  ok(await page.isVisible('.kp-se') && nF > 1 && (await page.locator('.slide .notes:not([hidden])').count()) === 0 && await page.isVisible('#kpSeToni') && await page.isVisible('#kpSeGo'), 'Folie mit Code: Erklärungen verdeckt, Felder zum Selbsterklären, mit Schlüssel „Von Toni prüfen lassen“ und „Selbst vergleichen“');
  for (let k = 0; k < nF; k++) await page.fill('#kpSe' + k, 'meine Erklärung ' + (k + 1));
  aiVerdict = 'NOCH NICHT';
  await page.click('#kpSeToni');
  await page.waitForFunction(() => /Noch nicht/.test(document.querySelector('.kp-se-r').textContent));
  const ref1 = await page.evaluate(() => aktFolie.s.notes[0][1]);
  ok(aiPrompt.includes('meine Erklärung 1') && aiPrompt.includes('Musterlösung (NICHT verraten)'), 'Toni bekommt die eigenen Worte und die Musterlösung zum Prüfen');
  ok(await page.isVisible('#kpSeOut') && !(await page.textContent('#kpSeOut')).includes('URTEIL') && (await page.locator('.kp-se-in').count()) === nF && (await page.locator('.slide .notes:not([hidden])').count()) === 0 && !((await st()).gen || {})['k01:0'], 'Noch nicht: Tonis Denkanstoß ohne Urteilszeile, Felder bleiben, Lösung bleibt verdeckt, nichts gemerkt');
  ok((await page.textContent('#kpSeGo')) === 'Lösung zeigen', 'Noch nicht: Der zweite Knopf zeigt jetzt die Lösung');
  aiVerdict = 'RICHTIG';
  await page.fill('#kpSe0', 'besser erklärt');
  await page.click('#kpSeToni');
  await page.waitForFunction(() => !document.querySelector('.kp-se-in'));
  const g = (await st()).gen['k01:0'];
  ok(/Komplett richtig/.test(await page.textContent('.kp-se-r')) && (await page.textContent('.slide .notes')).includes(ref1) && g.toni === true && g.du[0] === 'besser erklärt', 'Richtig: Lösung zur Bestätigung, Urteil und eigene Worte im Spielstand');
  ok((await st()).xp === xpVor && ((await st()).profil.sig || {}).erklOk === 1 && ((await st()).profil.sig || {}).erklNo === 1, 'Selbsterklären gibt keine XP, zählt aber Richtig und Noch nicht fürs Lernprofil');
  await page.click('#nextStep');
  ok(await page.isVisible('.kp-se'), 'Nächste Folie mit Code: wieder selbst erklären');
  await page.click('#kpSeX');
  ok(!(await page.$('.kp-se-in')) && (await page.locator('.slide .notes:not([hidden])').count()) === 1 && !!(await st()).gen['k01:1'], 'Kein Zwang: „Erklärungen gleich zeigen“ deckt alles auf');
  await page.click('#prevStep');
  ok(!(await page.$('.kp-se')) && (await page.locator('.slide .notes .kp-du').count()) === nF, 'Schon erklärte Folie zeigt die Lösung sofort, mit den eigenen Worten');
  await page.evaluate(() => localStorage.removeItem('ngfc.ai'));

  // 3. Quiz im Kapitel: zählt sofort, ohne Sicherheitsfrage. Der Vorab-Tipp wird aufgelöst.
  for (let n = 0; n < 6 && !(await page.$('.quiz')); n++) await page.click('#nextStep');
  const xpQuiz = (await st()).xp, richtig = await page.evaluate(() => CH.find(c => c.id === 'k01').quiz[0].correct);
  await page.click(`.quiz .opt[data-i="${richtig}"]`);
  const s3 = await st();
  ok(!(await page.$('.quiz .conf, .quiz .cf')) && s3.quiz['k01:0'] === 1 && s3.xp === xpQuiz + 10 && !(s3.cal && s3.cal.sr), 'Sofort richtig wird gezählt und gibt 10 XP, nach der Sicherheit fragt erst die Wiederholung');
  ok(await page.isVisible('.pre-note'), 'Vorab-Tipp wird nach dem Quiz aufgelöst');

  // 4. Übung gilt als gelöst (geschafft zählt nur mit grüner Übung, siehe offen.test.js), Kapitelende: erst aus dem Kopf
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
  const wege = await page.evaluate(() => [...document.querySelectorAll('.kp-schluss a')].map(a => a.id + a.getAttribute('href')).join());
  ok(wege === 'kpNaechstes#k02,kpHeim#start' && !(await page.isVisible('#nextStep')), 'Abschluss: genau zwei Wege, „Nächstes Kapitel“ und „Zum Schreibtisch“');
  ok(!(await page.$('.rf, #pauseBtn, #calmBtn')) && !(await page.evaluate(() => document.body.classList.contains('calm'))), 'Den Ruhemodus gibt es nicht mehr: kein Schalter, keine Einschätzung vor dem Weitergehen');
  await page.click('#kpHeim'); await page.waitForSelector('.hub');
  ok(await page.evaluate(() => { const id = document.querySelector('#hubGo').getAttribute('href').slice(1); return CH.some(c => c.id === id) && !S.done[id] && !!S.done.k01; }) && (await page.locator('#main .btn.primary').count()) === 1, 'Schreibtisch: genau ein Hauptknopf, er führt in ein offenes Kapitel');
  ok((await page.locator('.hub-weg details[open]').count()) === 1 && (await page.locator('.hub-weg details[open][data-akt]').count()) === 1, 'Dein Weg: nur die aktuelle Phase ist aufgeklappt');

  // 6. Hilfe-Leiter in der Übung: erst die Tipps, dann die Lösung mit Lücken, die ganze Lösung ist die letzte Sprosse
  await page.goto(URL + '#k03'); await page.evaluate(() => { S.steps.k03 = buildSteps(CH.find(c => c.id === 'k03')).findIndex(s => s.t === 'code'); save(); }); await neuLaden(page);
  await page.waitForFunction(() => window.ts, null, { timeout: 30000 });
  await page.waitForSelector('#runTests');
  const tipps = await page.evaluate(() => CH.find(c => c.id === 'k03').ex.hints.length);
  for (let n = 0; n < tipps; n++) await page.click('#hintBtn');
  ok((await page.locator('#hints .hint').count()) === tipps && (await page.textContent('#hintBtn')) === 'Lösung mit Lücken zeigen' && !(await page.isVisible('#solBox')), 'Hilfe-Leiter: Nach den Tipps bietet der Knopf die Lösung mit Lücken an');
  await page.click('#hintBtn');
  ok((await page.textContent('#solBox')).includes('____') && (await page.textContent('#hintBtn')) === 'Ganze Lösung zeigen', 'Lückentext-Lösung hat Lücken, die ganze Lösung kommt erst danach');

  // 7. Alter Stand ohne neue Felder läuft
  await page.evaluate(() => { localStorage.setItem('ngfc.v1', JSON.stringify({ xp: 100, steps: {}, done: { k01: 1 }, quiz: {}, ex: {}, code: {}, days: [], badges: [], updated: 1 })); });
  await page.goto(URL + '#start'); await neuLaden(page); await page.waitForSelector('.hub');
  ok(await page.isVisible('#hubWdh') && /^Wiederholen · \d+ Karten?$/.test(await page.textContent('#hubWdh')), 'Alter Fortschritt: Schreibtisch zeigt die fällige Wiederholung');
  await page.goto(URL + '#plan'); await page.waitForFunction(() => location.hash === '#start');
  ok(await page.isVisible('.hub') && !(await page.$('.ov-mem, .today')), 'Die alte Adresse #plan führt zum Schreibtisch');

  // 9. HTML im Code: Klick aufs Tag öffnet die Karte zum Element. Eine Liste neben der Folie gibt es nicht mehr.
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.evaluate(() => { S.zeile = Object.assign(S.zeile || {}, Object.fromEntries([0, 1, 2, 3, 4, 5].map(i => ['g01:' + i, { ok: 0, fehler: 0 }]))); S.steps.g01 = 3; save(); });
  await page.goto(URL + '#g01'); await page.waitForSelector('.slide .lx');
  ok(!(await page.$('.htmlside, .hs-it, .lexpanel')), 'Breit: keine HTML-Liste neben der Folie');
  const bx = await page.$$eval('.slide .lx', els => { const e = els.find(x => x.textContent.trim() === 'button'); if (e) e.click(); return !!e; });
  ok(bx && await page.isVisible('.lexpop .lexcard') && (await page.textContent('.lexpop .lc-k')) === '<button>' && await page.isVisible('.lexpop .el-was'), 'Klick auf <button> im Code öffnet die Karte zum HTML-Element');
  ok((await page.locator('.lexpop .el-mehr').count()) === 1 && !(await page.evaluate(() => document.querySelector('.lexpop .el-mehr').open)), 'Attribute und Events sind in der Karte eingeklappt');
  await page.keyboard.press('Escape');
  ok(!(await page.isVisible('.lexpop')), 'Escape schließt die Karte');
  await page.setViewportSize({ width: 400, height: 800 }); await neuLaden(page); await page.waitForSelector('.slide .lx');
  await page.$$eval('.slide .lx', els => els.find(x => x.textContent.trim() === 'button').click());
  ok(await page.isVisible('.lexpop.sheet .lexcard') && !(await querscroll(page)), 'Schmal: Die Karte kommt als Blatt von unten, ohne Querscrollen');

  await lernen(browser, ok, errors);

  ok(!errors.length, 'Keine Seitenfehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fails ? `\n${fails} Prüfung(en) rot` : '\nAlles grün');
  process.exit(fails ? 1 : 0);
})();
