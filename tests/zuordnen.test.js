// Prüft im echten Browser das Zuordnen (zuordnen.js): links Begriffe, rechts Aussagen, Paare finden.
// 1. Im Kapitel: Schritt nach dem Quiz, Fehler zählen fürs Thema, ohne Fehler +10 XP, später aufgelöst, „Nochmal mischen“ ohne Wertung.
// 2. Alter Spielstand: gemerkter Schritt hinter dem Quiz rückt einen weiter, Übung bleibt Übung.
// 3. Wiederholen: Karte z:<kapitel>, Fehler bestimmen die Bewertung, daneben kommt in der Runde nochmal.
// 4. Üben und freie Runde: Zuordnen ist dabei, Fehler zählen in S.weak.
// 5. Handy: zwei Spalten ohne Querscrollen, große Knöpfe, Tastatur.
const { oeffnen, pruefer } = require('./hilfe');
const { ok, ende } = pruefer();
const TAG = 864e5;
const basis = mehr => Object.assign({ ich: { start: 1, name: 'Kerim' }, xp: 100, steps: {}, done: {}, quiz: {}, ex: {}, code: {}, days: [], badges: [], updated: 1, zuV: 1 }, mehr || {});

/* Ein Paar wählen: Begriff p links, Aussage q rechts (oder andersherum) */
const paar = async (page, p, q, rechtsZuerst) => {
  const l = `.zu-links .zu-k[data-p="${p}"]`, r = `.zu-rechts .zu-k[data-p="${q}"]`;
  if (rechtsZuerst) { await page.click(r); await page.click(l); } else { await page.click(l); await page.click(r); }
};
/* Alle offenen Paare richtig legen */
const rest = async page => {
  const offen = await page.evaluate(() => [...document.querySelectorAll('.zu-links .zu-k:not(:disabled)')].map(b => +b.dataset.p));
  for (const p of offen) await paar(page, p, p);
};
const zum = (page, id) => page.evaluate(id => { const st = buildSteps(CH.find(c => c.id === id)); S.steps[id] = st.findIndex(s => s.t === 'zu'); save(); location.hash = ''; location.hash = id; }, id);

(async () => {
  /* ---------- 1. Im Kapitel ---------- */
  {
    const { browser, page, fehler } = await oeffnen({ stand: basis(), hash: 'start' });
    const st = await page.evaluate(() => buildSteps(CH.find(c => c.id === 'k06')).map(s => s.t).join());
    ok(/quiz,zu,code,end$/.test(st), 'Kapitel: „Zuordnen“ kommt nach dem Quiz und vor der Übung (' + st + ')');
    await zum(page, 'k06'); await page.waitForSelector('.zu-k');
    const n = await page.evaluate(() => CH.find(c => c.id === 'k06').paare.length);
    const anfang = await page.evaluate(() => ({ weg: document.querySelector('.kp-ph.an').textContent, l: document.querySelectorAll('.zu-links .zu-k').length, r: document.querySelectorAll('.zu-rechts .zu-k').length, prim: document.querySelector('#nextStep').classList.contains('primary'), gleich: [...document.querySelectorAll('.zu-links .zu-k')].filter((b, i) => b.dataset.p === document.querySelectorAll('.zu-rechts .zu-k')[i].dataset.p).length }));
    ok(anfang.weg.startsWith('Zuordnen') && anfang.l === n && anfang.r === n && !anfang.prim, 'Kapitel: ' + n + ' Begriffe und ' + n + ' Aussagen, „Weiter“ ist noch kein Hauptknopf');
    ok(anfang.gleich <= 1, 'Gemischt: höchstens ein Paar steht zufällig auf gleicher Höhe');

    /* Auswahl: antippen markiert, nochmal antippen hebt auf, ein anderer Begriff wechselt die Wahl */
    await page.click('.zu-links .zu-k[data-p="0"]');
    let a = await page.evaluate(() => ({ an: document.querySelector('.zu-links .zu-k[data-p="0"]').getAttribute('aria-pressed'), wahl: document.querySelector('.zu').dataset.wahl }));
    await page.click('.zu-links .zu-k[data-p="0"]');
    const aus = await page.evaluate(() => document.querySelector('.zu-links .zu-k[data-p="0"]').getAttribute('aria-pressed'));
    ok(a.an === 'true' && a.wahl === 'l' && aus === 'false', 'Antippen wählt einen Begriff (aria-pressed), nochmal antippen hebt die Wahl auf');

    /* Falsch: beide wackeln, Fehler zählt, nichts ist gesperrt */
    await paar(page, 0, 1);
    a = await page.evaluate(() => ({ no: document.querySelectorAll('.zu-k.zu-no').length, ok: document.querySelectorAll('.zu-k.zu-ok').length, msg: document.querySelector('.zu-msg').textContent }));
    ok(a.no === 2 && a.ok === 0 && /Passt nicht/.test(a.msg), 'Falsches Paar: beide Karten zeigen den Fehler, die Meldung sagt es');
    /* Richtig, von rechts angefangen: Paar bleibt mit Nummer stehen */
    await paar(page, 1, 1, true);
    a = await page.evaluate(() => { const l = document.querySelector('.zu-links .zu-k[data-p="1"]'), r = document.querySelector('.zu-rechts .zu-k[data-p="1"]'); return { dis: l.disabled && r.disabled, nr: l.querySelector('.zu-n').textContent + r.querySelector('.zu-n').textContent, label: l.getAttribute('aria-label') }; });
    ok(a.dis && a.nr === '11' && /^Paar 1: /.test(a.label), 'Richtiges Paar (auch von rechts begonnen): beide gesperrt, gleiche Nummer');
    const xpVor = await page.evaluate(() => S.xp);
    await rest(page);
    a = await page.evaluate(() => ({ zu: S.zu.k06, xp: S.xp, msg: document.querySelector('.zu-msg').textContent, prim: document.querySelector('#nextStep').classList.contains('primary'), mischen: !!document.querySelector('#zuNochmal'), thema: themaVon('k06').gruende.join(' · ') }));
    ok(a.zu === 1 && a.xp === xpVor && a.msg === 'Alle ' + n + ' Paare gefunden, mit 1 Fehler.' && a.prim, 'Fertig mit 1 Fehler: S.zu merkt ihn, keine XP, „Weiter“ wird Hauptknopf');
    ok(a.thema.includes('1 Fehler beim Zuordnen'), 'Fehler beim Zuordnen zählen fürs Thema wie falsche Quizantworten (' + a.thema + ')');
    ok(await page.evaluate(() => { const alt = S.zu.k06; S.zu.k06 = 4; const t = themaVon('k06'); S.zu.k06 = alt; return t.pkt >= 4; }), 'Mehr Fehler, mehr Fehlerpunkte fürs Thema');

    /* Nochmal mischen: neue Runde, ändert die Wertung nicht */
    await page.click('#zuNochmal');
    ok(await page.locator('.zu-k:not(:disabled)').count() === 2 * n, '„Nochmal mischen“ startet neu');
    await paar(page, 0, 2); await rest(page);
    ok(await page.evaluate(() => S.zu.k06) === 1, 'Die Wiederholung im Kapitel ändert die Wertung nicht');

    /* Wiederkommen: aufgelöst, Weiter ist Hauptknopf */
    await page.click('#prevStep'); await page.click('#nextStep'); await page.waitForSelector('.zu-fertig');
    a = await page.evaluate(() => ({ ok: document.querySelectorAll('.zu-k.zu-ok').length, prim: document.querySelector('#nextStep').classList.contains('primary'), h: document.querySelector('.zu-h').textContent }));
    ok(a.ok === 2 * n && a.prim && a.h.startsWith('So gehören'), 'Später: Das Spiel steht aufgelöst da');

    /* Ohne Fehler: +10 XP */
    await zum(page, 'k07'); await page.waitForSelector('.zu-k');
    const xp7 = await page.evaluate(() => S.xp);
    await rest(page);
    ok(await page.evaluate(x => S.zu.k07 === 0 && S.xp === x + 10, xp7), 'Ohne Fehler: +10 XP wie eine Quizfrage, die sofort sitzt');
    /* Zuordnen ist kein Muss: ein Kapitel ohne Übung ist mit allen Quizfragen geschafft */
    ok(await page.evaluate(() => { const c = CH.find(c => !c.ex && zuHat(c)); const alt = JSON.stringify(S); c.quiz.forEach((q, i) => { S.quiz[c.id + ':' + i] = 1; }); delete S.zu[c.id]; const v = kapitelVerdient(c); S = JSON.parse(alt); return v; }), 'Zuordnen ist kein Muss fürs Geschafft');
    await ende(browser, fehler, true);
  }

  /* ---------- 2. Alter Spielstand ---------- */
  {
    const alt = { ich: { start: 1 }, xp: 50, steps: { k06: 7, k07: 3, k08: 99 }, done: {}, quiz: {}, updated: 1 };
    const { browser, page, fehler } = await oeffnen({ stand: alt, hash: 'k06' });
    await page.waitForSelector('#stepBody');
    const r = await page.evaluate(() => ({ s: S.steps, v: S.zuV, code: !!document.querySelector('#stepBody #editor, #stepBody .ub') || document.querySelector('.kp-ph.an').textContent.startsWith('Umsetzen') }));
    ok(r.v === 1 && r.s.k06 === 8 && r.s.k07 === 3 && r.s.k08 === 100 && r.code, 'Alter Spielstand: Schritte hinter dem Quiz rücken einen weiter, wer bei der Übung war, landet wieder dort (' + JSON.stringify(r.s) + ')');
    ok(await page.evaluate(() => { const v = withDefaults({ steps: { k06: 8 }, zuV: 1 }); return v.steps.k06 === 8; }), 'Die Umrechnung passiert nur einmal');
    await ende(browser, fehler, true);
  }

  /* ---------- 3. Wiederholen ---------- */
  {
    const vorbei = { s: 3, n: 1, l: 0, due: Date.now() + 9 * TAG };
    const srs = { 'z:k06': { s: 3, n: 1, l: 0, due: Date.now() - TAG }, 'z:k07': { s: 3, n: 1, l: 0, due: Date.now() - TAG } };
    ['k06', 'k07'].forEach(id => { ['m:', 'x:'].forEach(p => { srs[p + id] = Object.assign({}, vorbei); }); [0, 1, 2].forEach(i => { srs['q:' + id + ':' + i] = Object.assign({}, vorbei); }); });
    const { browser, page, fehler } = await oeffnen({ stand: basis({ done: { k06: Date.now() - 5 * TAG, k07: Date.now() - 5 * TAG }, srs }), hash: 'wdh' });
    await page.waitForSelector('#wdhBody .zu-k');
    ok(await page.evaluate(() => { const d = srsDue(); return d.length === 2 && d.every(k => k[0] === 'z') && !!srsCard('z:k06') && srsCard('z:k06').t === 'z'; }), 'Karte z:<kapitel>: fällig, wie andere Karten');
    const erste = await page.evaluate(() => { const l = document.querySelector('#wdhBody .le-label').textContent; return CH.find(c => l.endsWith(c.title)).id; });
    /* Erste Karte ohne Fehler, zweite mit zwei Fehlern */
    await rest(page);
    await page.waitForSelector('#wdhWeiter');
    const w1 = await page.evaluate(id => ({ warum: document.querySelector('.le-warum').textContent, s: S.srs['z:' + id].s, n: S.srs['z:' + id].n, tage: leTageBis(S.srs['z:' + id].due), conf: !!document.querySelector('.conf') }), erste);
    ok(w1.warum.startsWith('Sitzt.') && w1.s === 7.5 && w1.n === 2 && w1.tage >= 7 && !w1.conf, 'Ohne Fehler: sitzt, der Abstand wächst (' + w1.s + ' Tage), keine Sicherheitsfrage');
    await page.click('#wdhWeiter'); await page.waitForSelector('#wdhBody .zu-k');
    const zweite = erste === 'k06' ? 'k07' : 'k06';
    await paar(page, 0, 1); await paar(page, 1, 2); await rest(page);
    await page.waitForSelector('#wdhWeiter');
    const w2 = await page.evaluate(id => ({ warum: document.querySelector('.le-warum').textContent, l: S.srs['z:' + id].l, tage: leTageBis(S.srs['z:' + id].due), stand: document.querySelector('#leStand').textContent, thema: themaVon(id).gruende.join() }), zweite);
    ok(w2.warum.startsWith('Daneben.') && w2.warum.includes('mit 2 Fehlern') && w2.l === 1 && w2.tage === 1, 'Zwei Fehler: daneben, morgen wieder (' + w2.warum + ')');
    ok(/daneben beim Wiederholen/.test(w2.thema), 'Daneben beim Wiederholen zählt fürs Thema');
    await page.click('#wdhWeiter');
    await page.waitForSelector('#wdhBody .zu-k');
    ok(/Nochmal, bis es sitzt/.test(await page.textContent('#wdhBody .le-label')), 'Daneben kommt in derselben Runde nochmal');
    await rest(page); await page.click('#wdhWeiter');
    await page.waitForSelector('.le-bilanz');
    ok(await page.evaluate(() => document.querySelector('.le-zahl').textContent === '1 von 2' && S.xp === 100 + 8 + 3), 'Bilanz und XP: 8 für sitzt, 3 für daneben (' + await page.evaluate(() => S.xp) + ')');
    ok(await page.evaluate(() => { const alt = JSON.stringify(S); S.srs = {}; S.done = { k06: Date.now() }; S.zu = { k06: 2 }; srsSeed(); const a = leTageBis(S.srs['z:k06'].due); S.srs = {}; S.zu = { k06: 0 }; srsSeed(); const b = leTageBis(S.srs['z:k06'].due); S = JSON.parse(alt); return a === 1 && b === 3; }), 'Neue Karte: mit Fehlern im Kapitel nach 1 Tag, sonst nach 3');
    ok(await page.evaluate(() => { const alt = JSON.stringify(S); S.done = Object.fromEntries(CH.map(c => [c.id, 1])); S.srs = {}; const r = wdhRunde(); S = JSON.parse(alt); return r.filter(k => k[0] === 'z').length <= 2 && r.length <= 15; }), 'Eine Runde hat höchstens 2 Karten zum Zuordnen');
    await ende(browser, fehler, true);
  }

  /* ---------- 4. Üben und freie Runde ---------- */
  {
    const { browser, page, fehler } = await oeffnen({ stand: basis({ done: { k06: Date.now() }, quiz: { 'k06:0': 1, 'k06:1': 1, 'k06:2': 1 } }), hash: 'ueben-k06' });
    await page.waitForSelector('#leStand');
    const n = await page.evaluate(() => CH.find(c => c.id === 'k06').quiz.length);
    ok((await page.textContent('#leStand')).includes('von ' + (n + 1)), 'Üben: Quizfragen und Zuordnen');
    /* Bis zur Zuordnen-Karte spielen, dabei Quizfragen richtig */
    for (let i = 0; i < 10 && !(await page.locator('#wdhBody .zu-k').count()); i++) {
      await page.evaluate(() => { const q = document.querySelector('.le-frage').textContent, ch = CH.find(c => c.id === 'k06'), k = ch.quiz.find(x => stripHtml(x.q) === q); [...document.querySelectorAll('.le-opts .opt')].find(o => +o.dataset.i === k.correct).click(); });
      await page.click('#wdhWeiter');
    }
    ok(await page.locator('#wdhBody .zu-k').count() > 0, 'Üben: Das Zuordnen kommt zwischen den Quizfragen');
    await paar(page, 0, 1); await paar(page, 0, 2); await rest(page);
    ok(await page.evaluate(() => (S.weak || {})['k06:zu'] === 1 && themaVon('k06').gruende.some(g => /daneben beim Wiederholen/.test(g))), 'Üben: Zwei Fehler zählen in S.weak und fürs Thema');
    const pool = await page.evaluate(() => { let z = 0, max = 0; for (let i = 0; i < 60; i++) { const p = leFreiPool(), n = p.filter(k => k[0] === 'z').length; if (n) z++; max = Math.max(max, n); } return { z, max }; });
    ok(pool.z > 0 && pool.max <= 2, 'Freie Runde: Zuordnen ist mit im Topf, höchstens zweimal (' + pool.z + ' von 60 Runden)');
    await ende(browser, fehler, true);
  }

  /* ---------- 5. Handy und Tastatur ---------- */
  {
    for (const theme of ['light', 'dark']) {
      const { browser, page, fehler } = await oeffnen({ mobil: true, stand: basis(), hash: 'start' });
      await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
      for (const id of ['k06', 'w04', 't02', 'k29']) {
        await zum(page, id); await page.waitForSelector('.zu-k');
        const m = await page.evaluate(() => ({ quer: document.documentElement.scrollWidth > innerWidth + 1, klein: [...document.querySelectorAll('.zu-k')].filter(b => b.getBoundingClientRect().height < 44).length, nebeneinander: document.querySelector('.zu-rechts').getBoundingClientRect().left > document.querySelector('.zu-links').getBoundingClientRect().right - 1 }));
        ok(!m.quer && !m.klein && m.nebeneinander, 'Handy (' + theme + ', ' + id + '): zwei Spalten nebeneinander, keine Querscrolle, alle Knöpfe mindestens 44 px hoch');
      }
      await ende(browser, fehler, true);
    }
    const { browser, page, fehler } = await oeffnen({ stand: basis(), hash: 'start' });
    await zum(page, 'k06'); await page.waitForSelector('.zu-k');
    await page.focus('.zu-links .zu-k[data-p="0"]'); await page.keyboard.press('Enter');
    await page.focus('.zu-rechts .zu-k[data-p="0"]'); await page.keyboard.press(' ');
    const k = await page.evaluate(() => ({ ok: document.querySelectorAll('.zu-k.zu-ok').length, fokus: document.activeElement.classList.contains('zu-k') && !document.activeElement.disabled }));
    ok(k.ok === 2 && k.fokus, 'Tastatur: Enter und Leertaste legen ein Paar, der Fokus springt zum nächsten offenen');
    await page.keyboard.press('1');
    ok(await page.evaluate(() => document.querySelectorAll('.zu-k.zu-an, .zu-k.zu-ok').length === 2), 'Zahlentasten wählen beim Zuordnen nichts aus');
    await ende(browser, fehler);
  }
})().catch(e => { console.error(e); process.exit(1); });
