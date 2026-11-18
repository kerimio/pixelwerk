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
  await page.waitForFunction(() => typeof RS_STATIONEN !== 'undefined', null, { timeout: 30000 });
  let bad = 0;
  const ok = (cond, name, extra) => { if (cond) console.log('✓', name); else { bad++; console.log('✗', name, extra ? '\n   ' + extra : ''); } };

  /* ---- Daten ---- */
  const daten = await page.evaluate(() => RS_STATIONEN.map(st => {
    const fehler = [];
    if (!st.merk || !st.merk.length || st.merk.length > 4) fehler.push('merk: 1 bis 4 Zeilen');
    st.runden.forEach(r => {
      if (r.typ === 'sort') r.karten.forEach(k => {
        const ids = r.buckets.map(b => b.id);
        if (![].concat(k.b).every(b => ids.includes(b))) fehler.push('Kategorie fehlt: ' + (k.text || k.code));
        if (!k.warum || !(k.text || k.code)) fehler.push('Karte unvollständig: ' + (k.text || k.code));
      });
      if (r.typ === 'wahl') r.items.forEach(it => { const n = it.opts.filter(o => o.ok).length; if (n !== 1) fehler.push(n + ' richtige Antworten: ' + it.lage); if (it.opts.some(o => !o.warum)) fehler.push('Antwort ohne warum: ' + it.lage); });
    });
    return { id: st.id, fehler };
  }));
  for (const d of daten) ok(!d.fehler.length, 'Station ' + d.id + ': Daten gültig', d.fehler.join('\n   '));

  const werk = await page.evaluate(() => RS_WERKSTATT.map(w => {
    const n = w.code.split('\n').length;
    const r = kommentarCheck(w.muster, w);
    return { id: w.id, zeileOk: w.zeile >= 1 && w.zeile <= n, score: r.score, max: r.max, fail: r.checks.filter(c => !c.ok).map(c => c.name) };
  }));
  for (const w of werk) {
    ok(w.zeileOk, w.id + ': markierte Zeile existiert');
    ok(w.score === w.max, w.id + ': Musterkommentar bekommt volle Punktzahl', 'durchgefallen: ' + w.fail.join(', '));
  }

  /* ---- Kommentar-Check erkennt schlechte Kommentare ---- */
  const faelle = await page.evaluate(() => {
    const w1 = RS_WERKSTATT.find(w => w.id === 'w1'), w5 = RS_WERKSTATT.find(w => w.id === 'w5'), w4 = RS_WERKSTATT.find(w => w.id === 'w4');
    const c = (t, w) => { const r = kommentarCheck(t, w); return { score: r.score, max: r.max, fail: r.checks.filter(x => !x.ok).map(x => x.name) }; };
    return {
      kurz: c('Leck!', w1),
      ohneLabel: c('Das interval endet nie, weil es kein takeUntilDestroyed hat. Vorschlag: takeUntilDestroyed davor.', w1),
      zuWeich: c('nitpick: Das interval endet nie, weil kein takeUntilDestroyed. Vorschlag: `takeUntilDestroyed()`.', w1),
      ton: c('issue (blocking): Du hast einfach das Abo vergessen, das interval läuft weiter. Vorschlag: `takeUntilDestroyed`.', w1),
      zuHart: c('issue (blocking): d ist ein schlechter Name, weil man ihn nicht versteht. Vorschlag: aktiveProjekte.', w5),
      frageOhneFragezeichen: c('question: Das setTimeout wirkt wie ein Hack wegen ExpressionChanged.', w4),
      arenaGut: c('issue (blocking): Der API-Key steht im Bundle, weil alles im Frontend öffentlich ist. Vorschlag: über unser Backend gehen.', null)
    };
  });
  ok(faelle.kurz.score <= 2, 'Zu kurzer Kommentar fällt durch', JSON.stringify(faelle.kurz));
  ok(faelle.ohneLabel.fail.includes('Label'), 'Fehlendes Label wird erkannt', JSON.stringify(faelle.ohneLabel));
  ok(faelle.zuWeich.fail.includes('Schwere'), 'Zu weich markierter Blocker wird erkannt', JSON.stringify(faelle.zuWeich));
  ok(faelle.ton.fail.includes('Ton'), 'Vorwurfs-Ton wird erkannt', JSON.stringify(faelle.ton));
  ok(faelle.zuHart.fail.includes('Schwere') && faelle.zuHart.fail.includes('Ton'), 'Zu hart markierter Nit + „schlecht“ wird erkannt', JSON.stringify(faelle.zuHart));
  ok(faelle.frageOhneFragezeichen.fail.includes('Echte Frage'), 'Frage ohne Fragezeichen wird erkannt', JSON.stringify(faelle.frageOhneFragezeichen));
  ok(faelle.arenaGut.score === faelle.arenaGut.max, 'Guter Kommentar ohne Aufgabe (Arena) bekommt volle Punktzahl', JSON.stringify(faelle.arenaGut));

  /* ---- Oberfläche ---- */
  const ui = async (name, fn) => { try { await fn(); ok(true, name); } catch (e) { ok(false, name, e.message); } };
  const spiele = async (fehlerBeiErster) => {
    let erste = true, runden = 0;
    while (runden++ < 80) {
      if (await page.$('.end .score')) return;
      await page.waitForSelector('.rs-card', { timeout: 3000 });
      const info = await page.evaluate(() => {
        const st = RS_STATIONEN.find(s => location.hash === '#rschule-' + s.id);
        const lage = document.querySelector('.rs-lage'), text = document.querySelector('.rs-card .rs-text'), code = document.querySelector('.rs-card pre code');
        for (const r of st.runden) {
          if (r.typ === 'wahl' && lage) { const it = r.items.find(i => i.lage.replace(/<[^>]+>/g, '') === lage.textContent); if (it) return { typ: 'wahl', gut: it.opts.findIndex(o => o.ok), schlecht: it.opts.findIndex(o => !o.ok) }; }
          if (r.typ === 'sort' && !lage) { const k = r.karten.find(k => (text && k.text === text.textContent) || (code && k.code === code.textContent)); if (k) return { typ: 'sort', gut: [].concat(k.b)[0], schlecht: r.buckets.find(b => ![].concat(k.b).includes(b.id)).id }; }
        }
        return null;
      });
      if (!info) throw new Error('Karte nicht gefunden');
      const falsch = fehlerBeiErster && erste; erste = false;
      if (info.typ === 'sort') await page.click(`.rs-b[data-b="${falsch ? info.schlecht : info.gut}"]`);
      else await page.click(`.opt[data-n="${falsch ? info.schlecht : info.gut}"]`);
      await page.waitForSelector(falsch ? '.out-res.wrong' : '.out-res.right', { timeout: 2000 });
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
    if (n !== (await page.evaluate(() => RS_STATIONEN.length))) throw new Error(n + ' Stationen angezeigt');
  });
  for (const id of await page.evaluate(() => RS_STATIONEN.filter(s => s.runden[0].typ !== 'schreib').map(s => s.id))) {
    await ui('Station ' + id + ' komplett durchspielen' + (id === 'ablauf' ? ' (erste Karte falsch, kommt wieder)' : ''), async () => {
      await page.evaluate(id => { location.hash = '#rschule-' + id; }, id);
      await page.waitForSelector('.rs-card', { timeout: 3000 });
      await spiele(id === 'ablauf');
      const txt = await page.textContent('.end .score');
      const max = await page.evaluate(id => { const st = RS_STATIONEN.find(s => s.id === id); return st.runden.reduce((n, r) => n + (r.karten || r.items).length, 0); }, id);
      const want = (id === 'ablauf' ? max - 1 : max) + '/' + max;
      if (txt.trim() !== want) throw new Error('Ergebnis ' + txt + ', erwartet ' + want);
      if (!(await page.evaluate(id => S.arena.rs[id], id))) throw new Error('nicht gespeichert');
    });
  }
  await ui('Auswahl-Karten mischen die Antworten: Tasten-Zahl ist die Stelle am Bildschirm, die richtige steht nicht immer gleich', async () => {
    const st = await page.evaluate(() => { const s = RS_STATIONEN.find(s => s.runden[0].typ === 'wahl'), it = s.runden[0].items[0]; return { id: s.id, n: it.opts.length, gut: it.opts.findIndex(o => o.ok) }; });
    const stellen = new Set();
    for (let n = 0; n < 12; n++) {
      await page.evaluate(() => { location.hash = '#rschule'; }); await page.waitForSelector('.rs-grid', { timeout: 3000 });
      await page.evaluate(id => { location.hash = '#rschule-' + id; }, st.id); await page.waitForSelector('.rs-card .opt', { timeout: 3000 });
      const b = await page.$$eval('.rs-card .opt', l => l.map(x => ({ n: +x.dataset.n, key: x.querySelector('.key').textContent })));
      if (b.length !== st.n || b.map(o => o.n).sort().join() !== [...Array(st.n).keys()].join() || b.map(o => o.key).join() !== b.map((o, k) => k + 1).join()) throw new Error('Antworten oder Tasten-Zahlen stimmen nicht: ' + JSON.stringify(b));
      stellen.add(b.findIndex(o => o.n === st.gut));
    }
    if (stellen.size < 2) throw new Error('Die richtige Antwort steht immer an Stelle ' + ([...stellen][0] + 1));
    const stelle = await page.$$eval('.rs-card .opt', (l, gut) => l.findIndex(x => +x.dataset.n === gut), st.gut);
    await page.keyboard.press(String(stelle + 1));
    await page.waitForSelector('.out-res.right', { timeout: 2000 });
    if ((await page.$$eval('.rs-card .opt.right', l => l.map(x => +x.dataset.n).join())) !== String(st.gut)) throw new Error('Die Auflösung markiert nicht genau die richtige Antwort');
  });
  await ui('Werkstatt: Musterkommentar schreiben = „Stark“ und gespeichert', async () => {
    await page.evaluate(() => { location.hash = '#rschule-werkstatt'; });
    await page.waitForSelector('#rsKom', { timeout: 3000 });
    if (!(await page.$('.rs-code .rv-line.flag'))) throw new Error('Zeile nicht markiert');
    await page.fill('#rsKom', await page.evaluate(() => RS_WERKSTATT[0].muster));
    await page.click('#rsCheck');
    await page.waitForSelector('.out-res.right', { timeout: 2000 });
    if ((await page.evaluate(() => S.arena.rsw.w1)) !== 5) throw new Error('Punkte nicht gespeichert');
    await page.click('#rsNext');
    await page.waitForFunction(() => document.querySelector('.rs-card .q-label').textContent.includes('Aufgabe 2'), null, { timeout: 2000 });
  });
  await ui('Werkstatt: schwacher Kommentar bekommt Tipps', async () => {
    await page.fill('#rsKom', 'Das ist falsch so!!');
    await page.click('#rsCheck');
    await page.waitForSelector('.rs-chip.no', { timeout: 2000 });
    if ((await page.$$('.rs-tipp')).length < 2) throw new Error('keine Tipps');
  });
  await ui('Spickzettel öffnet', async () => {
    await page.evaluate(() => { location.hash = '#rschule-spick'; });
    await page.waitForSelector('.rs-spick .card', { timeout: 3000 });
  });
  await ui('Review-Arena: Kommentar-Check ohne KI', async () => {
    await page.evaluate(() => { location.hash = '#review-' + REVIEWS[0].id; });
    await page.waitForSelector('#rvSubmit', { timeout: 3000 });
    await page.click('#rvSubmit');
    await page.waitForSelector('#rvComment', { timeout: 2000 });
    await page.fill('#rvComment', 'issue (blocking): Das interval endet nie, weil kein takeUntilDestroyed dran ist. Vorschlag: `takeUntilDestroyed(this.destroyRef)`.');
    await page.click('#rvAsk');
    await page.waitForSelector('#rvCheck .out-res.right', { timeout: 2000 });
    const hinweis = await page.textContent('#rvCheck');
    if (/unten links|KI einstellen/.test(hinweis) || !hinweis.includes('Einstellungen, Reiter „Coach Toni“')) throw new Error('Hinweis nennt nicht den Ort der KI-Einstellungen: ' + hinweis);
    if ((await page.textContent('.rv-write a.linkbtn')) !== 'Mehr üben: Kommentar-Werkstatt') throw new Error('Link zur Kommentar-Werkstatt heißt anders');
  });
  await ui('Abzeichen Review-Coach nach allen Stationen', async () => {
    await page.evaluate(() => { RS_STATIONEN.forEach(s => { S.arena.rs[s.id] = S.arena.rs[s.id] || { best: 1, max: 1 }; }); save(); });
    if (!(await page.evaluate(() => S.badges.includes('rschule')))) throw new Error('Abzeichen fehlt');
  });
  ok(!errors.length, 'Keine Seitenfehler', errors.join('\n   '));
  await browser.close();
  console.log(bad ? '\n' + bad + ' Fehler' : '\nReview-Schule grün');
  process.exit(bad ? 1 : 0);
})();
