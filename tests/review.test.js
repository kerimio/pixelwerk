// Prüft die Review-Schule im echten Browser:
// - Daten: jede Karte hat eine gültige Kategorie, jede Auswahl genau eine richtige Antwort, Werkstatt-Zeilen existieren.
// - Kommentar-Check: Jeder Musterkommentar bekommt volle Punktzahl, typische schlechte Kommentare nicht.
// - Oberfläche: Station komplett durchspielen, falsche Karte kommt wieder, Werkstatt, Spickzettel, Arena-Kommentar.
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
  await page.waitForFunction(() => typeof RS_STATIONS !== 'undefined', null, { timeout: 30000 });
  let bad = 0;
  const ok = (cond, name, extra) => { if (cond) console.log('✓', name); else { bad++; console.log('✗', name, extra ? '\n   ' + extra : ''); } };

  /* ---- Daten ---- */
  const details = await page.evaluate(() => RS_STATIONS.map(st => {
    const problems = [];
    if (!st.memo || !st.memo.length || st.memo.length > 4) problems.push('merk: 1 bis 4 Zeilen');
    st.rounds.forEach(r => {
      if (r.category === 'sort') r.cards.forEach(k => {
        const ids = r.buckets.map(b => b.id);
        if (![].concat(k.b).every(b => ids.includes(b))) problems.push('Kategorie fehlt: ' + (k.text || k.code));
        if (!k.reasonWhy || !(k.text || k.code)) problems.push('Karte unvollständig: ' + (k.text || k.code));
      });
      if (r.category === 'wahl') r.items.forEach(it => { const n = it.opts.filter(o => o.ok).length; if (n !== 1) problems.push(n + ' richtige Antworten: ' + it.situation); if (it.opts.some(o => !o.reasonWhy)) problems.push('Antwort ohne warum: ' + it.situation); });
    });
    return { id: st.id, problems };
  }));
  for (const d of details) ok(!d.problems.length, 'Station ' + d.id + ': Daten gültig', d.problems.join('\n   '));

  const work = await page.evaluate(() => RS_WORKSHOP.map(w => {
    const n = w.code.split('\n').length;
    const r = commentCheck(w.pattern, w);
    return { id: w.id, lineOk: w.codeLine >= 1 && w.codeLine <= n, score: r.score, max: r.max, fail: r.checks.filter(c => !c.ok).map(c => c.name) };
  }));
  for (const w of work) {
    ok(w.lineOk, w.id + ': markierte Zeile existiert');
    ok(w.score === w.max, w.id + ': Musterkommentar bekommt volle Punktzahl', 'durchgefallen: ' + w.fail.join(', '));
  }

  /* ---- Kommentar-Check erkennt schlechte Kommentare ---- */
  const cases = await page.evaluate(() => {
    const w1 = RS_WORKSHOP.find(w => w.id === 'w1'), w5 = RS_WORKSHOP.find(w => w.id === 'w5'), w4 = RS_WORKSHOP.find(w => w.id === 'w4');
    const c = (t, w) => { const r = commentCheck(t, w); return { score: r.score, max: r.max, fail: r.checks.filter(x => !x.ok).map(x => x.name) }; };
    return {
      short: c('Leck!', w1),
      withoutLabel: c('Das interval endet nie, weil es kein takeUntilDestroyed hat. Vorschlag: takeUntilDestroyed davor.', w1),
      tooSoft: c('nitpick: Das interval endet nie, weil kein takeUntilDestroyed. Vorschlag: `takeUntilDestroyed()`.', w1),
      sound: c('issue (blocking): Du hast einfach das Abo vergessen, das interval läuft weiter. Vorschlag: `takeUntilDestroyed`.', w1),
      tooHard: c('issue (blocking): d ist ein schlechter Name, weil man ihn nicht versteht. Vorschlag: aktiveProjekte.', w5),
      questionWithoutMark: c('question: Das setTimeout wirkt wie ein Hack wegen ExpressionChanged.', w4),
      arenaGood: c('issue (blocking): Der API-Key steht im Bundle, weil alles im Frontend öffentlich ist. Vorschlag: über unser Backend gehen.', null)
    };
  });
  ok(cases.short.score <= 2, 'Zu kurzer Kommentar fällt durch', JSON.stringify(cases.short));
  ok(cases.withoutLabel.fail.includes('Label'), 'Fehlendes Label wird erkannt', JSON.stringify(cases.withoutLabel));
  ok(cases.tooSoft.fail.includes('Schwere'), 'Zu weich markierter Blocker wird erkannt', JSON.stringify(cases.tooSoft));
  ok(cases.sound.fail.includes('Ton'), 'Vorwurfs-Ton wird erkannt', JSON.stringify(cases.sound));
  ok(cases.tooHard.fail.includes('Schwere') && cases.tooHard.fail.includes('Ton'), 'Zu hart markierter Nit + „schlecht“ wird erkannt', JSON.stringify(cases.tooHard));
  ok(cases.questionWithoutMark.fail.includes('Echte Frage'), 'Frage ohne Fragezeichen wird erkannt', JSON.stringify(cases.questionWithoutMark));
  ok(cases.arenaGood.score === cases.arenaGood.max, 'Guter Kommentar ohne Aufgabe (Arena) bekommt volle Punktzahl', JSON.stringify(cases.arenaGood));

  /* ---- Oberfläche ---- */
  const ui = async (name, fn) => { try { await fn(); ok(true, name); } catch (e) { ok(false, name, e.message); } };
  const games = async (errorOnFirst) => {
    let firstOne = true, rounds = 0;
    while (rounds++ < 80) {
      if (await page.$('.end .score')) return;
      await page.waitForSelector('.rs-card', { timeout: 3000 });
      const info = await page.evaluate(() => {
        const st = RS_STATIONS.find(s => location.hash === '#rschule-' + s.id);
        const situation = document.querySelector('.rs-situation'), text = document.querySelector('.rs-card .rs-text'), code = document.querySelector('.rs-card pre code');
        for (const r of st.rounds) {
          if (r.category === 'wahl' && situation) { const it = r.items.find(i => i.situation.replace(/<[^>]+>/g, '') === situation.textContent); if (it) return { category: 'wahl', fine: it.opts.findIndex(o => o.ok), poor: it.opts.findIndex(o => !o.ok) }; }
          if (r.category === 'sort' && !situation) { const k = r.cards.find(k => (text && k.text === text.textContent) || (code && k.code === code.textContent)); if (k) return { category: 'sort', fine: [].concat(k.b)[0], poor: r.buckets.find(b => ![].concat(k.b).includes(b.id)).id }; }
        }
        return null;
      });
      if (!info) throw new Error('Karte nicht gefunden');
      const wrong = errorOnFirst && firstOne; firstOne = false;
      if (info.category === 'sort') await page.click(`.rs-b[data-b="${wrong ? info.poor : info.fine}"]`);
      else await page.click(`.opt[data-n="${wrong ? info.poor : info.fine}"]`);
      await page.waitForSelector(wrong ? '.out-res.wrong' : '.out-res.right', { timeout: 2000 });
      await page.click('#rsNext');
    }
    throw new Error('Station endet nicht');
  };
  await ui('Werkstatt zeigt die Review-Schule', async () => {
    await page.evaluate(() => { location.hash = '#training'; });
    await page.waitForSelector('.arena-card[href="#rschule"]', { timeout: 3000 });
  });
  await ui('Übersicht listet alle Stationen', async () => {
    await page.evaluate(() => { location.hash = '#rschule'; });
    await page.waitForSelector('.rs-grid', { timeout: 3000 });
    const n = await page.$$eval('.rs-st', x => x.length);
    if (n !== (await page.evaluate(() => RS_STATIONS.length))) throw new Error(n + ' Stationen angezeigt');
  });
  for (const id of await page.evaluate(() => RS_STATIONS.filter(s => s.rounds[0].category !== 'schreib').map(s => s.id))) {
    await ui('Station ' + id + ' komplett durchspielen' + (id === 'ablauf' ? ' (erste Karte falsch, kommt wieder)' : ''), async () => {
      await page.evaluate(id => { location.hash = '#rschule-' + id; }, id);
      await page.waitForSelector('.rs-card', { timeout: 3000 });
      await games(id === 'ablauf');
      const txt = await page.textContent('.end .score');
      const max = await page.evaluate(id => { const st = RS_STATIONS.find(s => s.id === id); return st.rounds.reduce((n, r) => n + (r.cards || r.items).length, 0); }, id);
      const want = (id === 'ablauf' ? max - 1 : max) + '/' + max;
      if (txt.trim() !== want) throw new Error('Ergebnis ' + txt + ', erwartet ' + want);
      if (!(await page.evaluate(id => S.arena.rs[id], id))) throw new Error('nicht gespeichert');
    });
  }
  await ui('Auswahl-Karten mischen die Antworten: Tasten-Zahl ist die Stelle am Bildschirm, die richtige steht nicht immer gleich', async () => {
    const st = await page.evaluate(() => { const s = RS_STATIONS.find(s => s.rounds[0].category === 'wahl'), it = s.rounds[0].items[0]; return { id: s.id, n: it.opts.length, fine: it.opts.findIndex(o => o.ok) }; });
    const spots = new Set();
    for (let n = 0; n < 12; n++) {
      await page.evaluate(() => { location.hash = '#rschule'; }); await page.waitForSelector('.rs-grid', { timeout: 3000 });
      await page.evaluate(id => { location.hash = '#rschule-' + id; }, st.id); await page.waitForSelector('.rs-card .opt', { timeout: 3000 });
      const b = await page.$$eval('.rs-card .opt', l => l.map(x => ({ n: +x.dataset.n, key: x.querySelector('.key').textContent })));
      if (b.length !== st.n || b.map(o => o.n).sort().join() !== [...Array(st.n).keys()].join() || b.map(o => o.key).join() !== b.map((o, k) => k + 1).join()) throw new Error('Antworten oder Tasten-Zahlen stimmen nicht: ' + JSON.stringify(b));
      spots.add(b.findIndex(o => o.n === st.fine));
    }
    if (spots.size < 2) throw new Error('Die richtige Antwort steht immer an Stelle ' + ([...spots][0] + 1));
    const spot = await page.$$eval('.rs-card .opt', (l, fine) => l.findIndex(x => +x.dataset.n === fine), st.fine);
    await page.keyboard.press(String(spot + 1));
    await page.waitForSelector('.out-res.right', { timeout: 2000 });
    if ((await page.$$eval('.rs-card .opt.right', l => l.map(x => +x.dataset.n).join())) !== String(st.fine)) throw new Error('Die Auflösung markiert nicht genau die richtige Antwort');
  });
  await ui('Werkstatt: Musterkommentar schreiben = „Stark“ und gespeichert', async () => {
    await page.evaluate(() => { location.hash = '#rschule-werkstatt'; });
    await page.waitForSelector('#rsComment', { timeout: 3000 });
    if (!(await page.$('.rs-code .rv-line.flag'))) throw new Error('Zeile nicht markiert');
    await page.fill('#rsComment', await page.evaluate(() => RS_WORKSHOP[0].pattern));
    await page.click('#rsCheck');
    await page.waitForSelector('.out-res.right', { timeout: 2000 });
    if ((await page.evaluate(() => S.arena.rsw.w1)) !== 5) throw new Error('Punkte nicht gespeichert');
    await page.click('#rsNext');
    await page.waitForFunction(() => document.querySelector('.rs-card .q-label').textContent.includes('Aufgabe 2'), null, { timeout: 2000 });
  });
  await ui('Werkstatt: schwacher Kommentar bekommt Tipps', async () => {
    await page.fill('#rsComment', 'Das ist falsch so!!');
    await page.click('#rsCheck');
    await page.waitForSelector('.rs-chip.no', { timeout: 2000 });
    if ((await page.$$('.rs-tip')).length < 2) throw new Error('keine Tipps');
  });
  await ui('Spickzettel öffnet', async () => {
    await page.evaluate(() => { location.hash = '#rschule-spick'; });
    await page.waitForSelector('.rs-cheat .card', { timeout: 3000 });
  });
  await ui('Review-Arena: Kommentar-Check ohne KI', async () => {
    await page.evaluate(() => { location.hash = '#review-' + REVIEWS[0].id; });
    await page.waitForSelector('#rvSubmit', { timeout: 3000 });
    await page.click('#rvSubmit');
    await page.waitForSelector('#rvComment', { timeout: 2000 });
    await page.fill('#rvComment', 'issue (blocking): Das interval endet nie, weil kein takeUntilDestroyed dran ist. Vorschlag: `takeUntilDestroyed(this.destroyRef)`.');
    await page.click('#rvAsk');
    await page.waitForSelector('#rvCheck .out-res.right', { timeout: 2000 });
    const notice = await page.textContent('#rvCheck');
    if (/unten links|KI einstellen/.test(notice) || !notice.includes('Einstellungen, Reiter „Coach Toni“')) throw new Error('Hinweis nennt nicht den Ort der KI-Einstellungen: ' + notice);
    if ((await page.textContent('.rv-write a.linkbtn')) !== 'Mehr üben: Kommentar-Werkstatt') throw new Error('Link zur Kommentar-Werkstatt heißt anders');
  });
  await ui('Abzeichen Review-Coach nach allen Stationen', async () => {
    await page.evaluate(() => { RS_STATIONS.forEach(s => { S.arena.rs[s.id] = S.arena.rs[s.id] || { best: 1, max: 1 }; }); save(); });
    if (!(await page.evaluate(() => S.badges.includes('rschule')))) throw new Error('Abzeichen fehlt');
  });
  ok(!errors.length, 'Keine Seitenfehler', errors.join('\n   '));
  await browser.close();
  console.log(bad ? '\n' + bad + ' Fehler' : '\nReview-Schule grün');
  process.exit(bad ? 1 : 0);
})();
