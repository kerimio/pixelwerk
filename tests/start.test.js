// Prüft im echten Browser: den Schreibtisch (Zuhause) für neue Nutzer und mit Spielstand, die Kopfzeile mit Profil-Chip,
// die alten Adressen #plan und #blitz und den einen Einstellungs-Dialog (vier Reiter, Hell/Dunkel, Spielstand als Datei).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { openPage, checker, reloadIt } = require('./helpers');
const { ok, ending } = checker();

const tag = d => { const x = new Date(Date.now() - d * 864e5); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const txt = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); return el ? el.textContent.replace(/\s+/g, ' ').trim() : null; }, sel);
const noSideScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
/* Spielstand mitten im Kurs: die ersten acht Angular-Kapitel geschafft, das neunte angefangen, die Grundlagen übersprungen.
   ids = die Kapitel ohne die Grundlagen. alter = vor wie vielen Tagen geschafft. */
const middle = (ids, age) => ({
  player: { name: 'Kerim', start: 1, journey: 'angular' }, xp: 640, steps: { [ids[8]]: 2 }, done: Object.fromEntries(ids.slice(0, 8).map(id => [id, Date.now() - age * 864e5])),
  quiz: {}, ex: {}, code: {}, days: [tag(0), tag(1), tag(2)], badges: ['anpfiff', 'bild'], updated: 1
});

/* Öffnet die App mit einem Spielstand, der nur einmal gesetzt wird (auch ein kaputter als Text). Chromium verliert unter
   file:// beim Neuladen ab und zu den ganzen Speicher, darum lädt reloadIt so lange neu, bis der geschriebene Stand ankommt. */
async function openFixed(standing) {
  const o = await openPage({ intro: true });
  await o.page.evaluate(s => localStorage.setItem('ngfc.v1', s), typeof standing === 'string' ? standing : JSON.stringify(standing));
  await reloadIt(o.page); await o.page.waitForSelector('#main');
  return o;
}

(async () => {
  /* ---------- 1. Ganz neuer Nutzer ---------- */
  let { browser, page, problems } = await openPage();
  await page.waitForSelector('.hub');
  const chap = await page.evaluate(() => CH.map(c => ({ id: c.id, title: c.title, act: c.act })));
  const ids = chap.map(c => c.id);
  const chapA = chap.filter(c => c.act !== 'B'), idsA = chapA.map(c => c.id);
  const phases = await page.evaluate(() => ACTS.length);

  ok(await txt(page, '.hub-hello h1') === 'Hallo' && !(await page.locator('.hub-hello p').count()) && await page.locator('.hub-hello .hub-photo .px-av').count() === 1, 'Neu: Begrüßung ohne Namen, daneben der Avatar, kein Satz zur Lage (was ansteht, sagt die Karte darunter)');
  ok(await txt(page, '#hubNextT') === chap[0].title && await txt(page, '#hubGo') === 'Anfangen' && await page.getAttribute('#hubGo', 'href') === '#' + ids[0], 'Neu: Die Karte zeigt das erste Kapitel mit „Anfangen“');
  ok(/^Phase 1 · Kapitel 1 von \d+$/.test(await txt(page, '.hub-meta')), 'Neu: Karte nennt Phase und Platz, noch keinen Schritt: ' + await txt(page, '.hub-meta'));
  ok(await page.locator('.hub-next .tk-id').count() === 1 && await page.isVisible('.hub-next .tk-typ') && !(await page.isVisible('.hub-next .tk-t')), 'Ticket-Zeile zeigt Nummer und Typ, nicht noch einen Titel');
  ok(await page.locator('#main .btn.primary').count() === 1, 'Genau eine Hauptaktion auf dem Schreibtisch');
  ok(!(await page.$('#hubRepeat')) && await txt(page, '.hub-repeat') === 'Wiederholen startet nach deinem ersten Kapitel.', 'Neu: kein Wiederholen-Knopf, nur eine leise Zeile');

  const journey = await page.$$eval('.hub-path a.hub-k', l => l.map(a => a.getAttribute('href').slice(1)));
  ok(await page.locator('.hub-path li.hub-p').count() === phases && phases === 12, 'Der Weg zeigt alle 12 Phasen (mit den Grundlagen)');
  ok(journey.length === ids.length && journey.every((id, i) => id === ids[i]) && new Set(journey).size === journey.length, 'Der Weg zeigt jedes der ' + ids.length + ' Kapitel genau einmal, in der Reihenfolge des Kurses');
  ok(await page.$$eval('.hub-path details', l => l.filter(d => d.open).length) === 1 && await page.$eval('.hub-path li.hub-p:first-child details', d => d.open), 'Nur die aktuelle Phase ist aufgeklappt');
  ok(await page.getAttribute('.hub-k.current', 'href') === '#' + ids[0] && await page.getAttribute('.hub-k.current', 'aria-current') === 'step', 'Das aktuelle Kapitel ist als Station hervorgehoben');
  ok(await txt(page, '.hub-badges summary') === 'Abzeichen · 0 von ' + await page.evaluate(() => BADGES.length) && !(await page.$eval('.hub-badges', d => d.open)), 'Abzeichen sind eingeklappt, mit Zählung');
  ok(await page.locator('#main a[href="#training"]').count() === 1, 'Genau ein Link zur Werkstatt');
  ok(!(await page.$('#nav, .side, #navToggle, #calmBtn, #themeBtn, #aiDlg, #profilDlg, #ichHint')) && await page.evaluate(() => !document.body.classList.contains('calm') && !document.body.classList.contains('focus')), 'Seitenleiste, Ruhig-Schalter, Hell/Dunkel-Knopf und die alten Dialoge sind weg');
  ok(await page.evaluate(() => { const l = [...document.querySelectorAll('.hub .sr-only')]; return l.length > 0 && !document.querySelector('.hub-sr, .kp-sr, .es-sr') && l.every(e => { const c = getComputedStyle(e); return c.position === 'absolute' && c.width === '1px' && c.height === '1px' && c.overflow === 'hidden'; }); }), 'Texte nur für Screenreader nutzen die eine Klasse sr-only und sind unsichtbar');
  ok(await page.evaluate(() => typeof isCalm === 'undefined' && typeof renderNav === 'undefined' && typeof renderBlitz === 'undefined'), 'Reste aus der Zeit mit zwei Modi sind weg: isCalm, renderNav, renderBlitz');
  ok(await txt(page, '#lvlName') === 'Praktikant' && await txt(page, '#xpNum') === '0 XP' && !(await page.isVisible('#streak')), 'Profil-Chip: Rang und XP, ohne Serie keine Flamme');

  // In das Kapitel und über das Logo zurück
  await page.click('#hubGo'); await page.waitForSelector('.ch-head h1');
  ok((await txt(page, '.ch-head h1')).includes(chap[0].title), 'Der Hauptknopf führt in das Kapitel');
  await page.click('.brand'); await page.waitForSelector('.hub');
  ok(await txt(page, '#hubGo') === 'Anfangen' && !(await page.locator('.hub-hello p').count()), 'Logo führt zum Schreibtisch. Nur reingeschaut ist noch nicht angefangen');
  // Nachschlagen über die Suche und Reinschauen über den Weg verschieben das nächste Kapitel nicht
  await page.keyboard.press('/'); await page.fill('#searchIn', 'switchMap'); await page.waitForSelector('#searchRes .search-list a');
  const hits = await page.getAttribute('#searchRes .search-list a', 'href');
  await page.keyboard.press('Enter'); await page.waitForSelector('#stepBody .slide');
  ok(hits !== '#' + ids[0] && await page.evaluate(() => location.hash) === hits, 'Suche: Enter öffnet den ersten Treffer auf einer Folie (' + hits + ')');
  await page.click('#nextStep'); await page.click('.brand'); await page.waitForSelector('.hub');
  ok(await txt(page, '#hubNextT') === chap[0].title && await txt(page, '#hubGo') === 'Anfangen' && await page.evaluate(id => !S.steps[id], hits.slice(1)), 'Suche: Nachschlagen und Weiterblättern zählt nicht als angefangen, das nächste Kapitel bleibt');
  await page.evaluate(id => { location.hash = id; }, ids[5]); await page.waitForSelector('#cpAccept, .cp-all');
  await page.click('.brand'); await page.waitForSelector('.hub');
  ok(await txt(page, '#hubNextT') === chap[0].title && await txt(page, '#hubGo') === 'Anfangen', 'Weg: Ein späteres Kapitel nur öffnen, ohne das Ticket anzunehmen, verschiebt das nächste Kapitel nicht');
  await page.evaluate(id => { S.steps[id] = 2; save(); route(); }, ids[0]);
  ok(await txt(page, '#hubGo') === 'Weitermachen' && /Schritt 3 von \d+$/.test(await txt(page, '.hub-meta')) && !(await page.locator('.hub-hello p').count()), 'Angefangenes Kapitel: „Weitermachen“ mit Stand, weiter kein Satz zur Lage');
  await page.goBack(); await page.waitForSelector('.ch-head h1'); await page.goForward(); await page.waitForSelector('.hub');
  ok(await page.isVisible('#hubGo'), 'Zurück und Vor im Browser landen wieder auf dem Schreibtisch');

  // Frei anwählbar: ein Kapitel aus einer späteren Phase
  await page.click('.hub-path li.hub-p:nth-child(5) summary');
  await page.click('.hub-path li.hub-p:nth-child(5) a.hub-k');
  await page.waitForSelector('.ch-head h1');
  const unlocked = chap.find(c => c.act === chap.map(k => k.act).filter((a, i, l) => l.indexOf(a) === i)[4]);
  ok((await txt(page, '.ch-head h1')).includes(unlocked.title), 'Nichts ist gesperrt: Kapitel aus Phase 5 lässt sich direkt öffnen');
  await page.goBack(); await page.waitForSelector('.hub');
  ok(await page.$eval('.hub-path li.hub-p:nth-child(5) details', d => d.open), 'Nach „Zurück“ bleibt die selbst aufgeklappte Phase offen');
  ok(await page.getAttribute('#hubGo', 'href') === '#' + ids[0] && await page.getAttribute('.hub-k.current', 'href') === '#' + ids[0] && await page.$eval('.hub-path li.hub-p:first-child', li => li.classList.contains('current')), 'Reinschauen in ein späteres Kapitel ändert nicht, was als Nächstes dran ist');

  // Tastatur
  await page.focus('.hub-path li.hub-p:nth-child(3) summary'); await page.keyboard.press('Enter');
  ok(await page.$eval('.hub-path li.hub-p:nth-child(3) details', d => d.open), 'Phasen klappen auch per Tastatur auf');
  await page.keyboard.press('Tab');
  ok(await page.evaluate(() => document.activeElement.matches('.hub-path li.hub-p:nth-child(3) a.hub-k')), 'Tab springt von der Phase zu ihrem ersten Kapitel');
  await page.evaluate(() => document.activeElement.blur()); await page.keyboard.press('/');
  ok(await page.isVisible('#searchDlg[open]'), 'Taste / öffnet die Suche');
  await page.keyboard.press('Escape');

  // Alte Adressen
  await page.evaluate(() => { location.hash = 'plan'; }); await page.waitForTimeout(150);
  ok(await page.isVisible('.hub') && await page.evaluate(() => location.hash) === '#start', '#plan leitet auf den Schreibtisch (#start)');
  await page.evaluate(() => { location.hash = 'wdh'; }); await page.waitForTimeout(150);
  const repeat = await txt(page, '#main');
  await page.evaluate(() => { location.hash = 'blitz'; }); await page.waitForTimeout(150);
  ok(repeat && repeat.length > 20 && await txt(page, '#main') === repeat && !(await page.$('.blitz-next')), '#blitz zeigt dasselbe wie #wdh');
  await page.evaluate(() => { location.hash = 'gibtsnicht'; }); await page.waitForTimeout(150);
  ok(await page.isVisible('.hub'), 'Unbekannte Adresse zeigt den Schreibtisch');
  await ending(null, problems); await browser.close();

  /* ---------- 2. Mit Spielstand, Karten fällig ---------- */
  ({ browser, page, problems } = await openPage({ standing: middle(idsA, 10) }));
  await page.waitForSelector('.hub');
  const due = await page.evaluate(() => srsDue().length);
  ok(await txt(page, '.hub-hello h1') === 'Hallo Kerim' && due > 1 && (await txt(page, '#main')).split(due + ' Karten').length === 2, 'Spielstand: Begrüßung mit Namen, die fälligen Karten (' + due + ') nennt nur der Knopf „Wiederholen“');
  ok(await txt(page, '#hubNextT') === chapA[8].title && await txt(page, '#hubGo') === 'Weitermachen' && await page.getAttribute('#hubGo', 'href') === '#' + idsA[8], 'Spielstand: nächstes Kapitel ist das angefangene neunte');
  ok(/^Phase 3 · Kapitel 2 von 7 · Schritt 3 von \d+$/.test(await txt(page, '.hub-meta')), 'Karte: Phase, Platz und Schritt stimmen: ' + await txt(page, '.hub-meta'));
  ok(due > 0 && await txt(page, '#hubRepeat') === 'Wiederholen · ' + due + ' Karten' && !(await page.$eval('#hubRepeat', b => b.classList.contains('primary'))), 'Wiederholen-Knopf mit Kartenzahl, leiser als die Hauptaktion');
  ok(await page.locator('#main .btn.primary').count() === 1, 'Auch mit fälligen Karten genau eine Hauptaktion');
  ok(await page.$eval('.hub-path li.hub-p:nth-child(1)', li => li.classList.contains('complete') && li.querySelector('.hub-ps').textContent.startsWith('2/2')) &&
    await page.$eval('.hub-path li.hub-p:nth-child(3)', li => li.classList.contains('complete') && li.querySelector('.hub-ps').textContent.startsWith('5/5')) &&
    await page.$eval('.hub-path li.hub-p:nth-child(4)', li => li.classList.contains('current') && li.querySelector('details').open && li.querySelector('.hub-ps').textContent.startsWith('1/7')), 'Weg: Phase 1 (2/2) und 2 (5/5) fertig, Phase 3 aktuell und offen (1/7)');
  ok(await page.$eval('.hub-path li.hub-p:nth-child(2)', li => !li.classList.contains('complete') && !li.classList.contains('current') && li.querySelector('.hub-opt').textContent === 'optional' && li.querySelector('.hub-pn').textContent === 'G' && li.querySelector('.hub-ps').textContent.startsWith('0/')) && await page.locator('.hub-opt').count() === 1, 'Weg: Die übersprungenen Grundlagen stehen als „optional“ ohne Nummer an zweiter Stelle');
  ok(await page.locator('.hub-path a.hub-k.done').count() === 8 && await page.getAttribute('.hub-k.current', 'href') === '#' + idsA[8], 'Weg: acht Stationen erledigt, die neunte ist die aktuelle');
  ok(await page.evaluate(n => { const sp = document.querySelector('.hub-next .hub-track'), an = sp && sp.querySelector('li.active'); return !!sp && sp.getAttribute('aria-hidden') === 'true' && sp.querySelectorAll('li').length === n.ph && sp.querySelectorAll('i').length === n.n && sp.querySelectorAll('i.v').length === 2 && sp.querySelectorAll('i.a').length === 1 && !!an && an.querySelector('i.a') !== null; }, await page.evaluate(i => { const st = buildSteps(CH.find(c => c.id === i)); return { n: st.length, ph: new Set(st.map(s => s.t)).size }; }, idsA[8])), 'Karte: Spur durchs Kapitel mit einem Block je Schritt, zwei erledigt, der dritte ist dran');
  ok(await txt(page, '.hub-reward') === 'Dafür gibt es +' + await page.evaluate(id => CH.find(c => c.id === id).xp, idsA[8]) + ' XP', 'Karte: zeigt, wie viele XP das Kapitel bringt');
  ok(await page.$eval('.hub-path li.hub-p:nth-child(1)', li => li.querySelectorAll('.hub-pbar i.v').length === 2 && li.querySelector('.hub-pbadge.got') !== null) &&
    await page.$eval('.hub-path li.hub-p:nth-child(4)', li => li.querySelectorAll('.hub-pbar i').length === 7 && li.querySelectorAll('.hub-pbar i.v').length === 1 && li.querySelectorAll('.hub-pbar i.a').length === 1 && /noch offen/.test(li.querySelector('.hub-pbadge').getAttribute('aria-label'))), 'Weg: Pixel-Leiste je Phase und das Abzeichen am Ende (Phase 1 bekommen, Phase 3 noch offen)');
  ok(await txt(page, '#meBtn .me-n') === 'Kerim' && await txt(page, '#lvlName') === 'Junior-Dev' && await txt(page, '#xpNum') === '640 XP' && await txt(page, '#streak') === '🔥 3' && await page.$eval('#xpBar', i => i.style.width) === '57%', 'Profil-Chip: Name, Rang, XP, Balken bis zum nächsten Rang, Serie');
  ok((await page.getAttribute('#meBtn', 'aria-label')).includes('noch 260 XP bis Frontend-Dev'), 'Profil-Chip sagt Screenreadern, wie weit der nächste Rang ist');
  ok(await txt(page, '.hub-badges summary') === 'Abzeichen · 2 von ' + await page.evaluate(() => BADGES.length) && await page.evaluate(() => BADGES.length) === 22, 'Abzeichen zählen mit');
  await page.evaluate(() => addXp(300, 'Test'));
  ok(await txt(page, '#lvlName') === 'Frontend-Dev' && await txt(page, '#xpNum') === '940 XP' && (await txt(page, '#toast')).includes('+300 XP'), 'XP gutschreiben: Chip steigt mit auf, kurze Meldung erscheint');
  // Phase geschafft: Der Weg rückt weiter, die alte Phase klappt von selbst zu. Selbst zugeklappt bleibt zu.
  await page.waitForTimeout(50);
  await page.evaluate(l => { window.previous = JSON.stringify(S); l.forEach(id => { S.done[id] = Date.now(); }); save(); route(); }, chap.filter(c => c.act === chapA[8].act).map(c => c.id));
  ok(await page.$$eval('.hub-path details', l => l.map((d, i) => d.open ? i + 1 : 0).filter(Boolean).join(',')) === '5' && await page.$eval('.hub-path li.hub-p:nth-child(4)', li => li.classList.contains('complete')), 'Nächste Phase erreicht: nur noch sie ist offen, die geschaffte klappt zu');
  await page.click('.hub-path li.hub-p:nth-child(5) summary'); await page.waitForTimeout(50);
  await page.evaluate(() => route());
  ok(await page.$$eval('.hub-path details', l => l.filter(d => d.open).length) === 0, 'Die aktuelle Phase selbst zugeklappt: Sie bleibt zu, bis man sie wieder öffnet');
  await page.evaluate(() => { S = withDefaults(JSON.parse(window.previous)); save(); hubOpen.clear(); route(); });
  await page.click('#hubRepeat'); await page.waitForSelector('#main .ch-head, #main .wdh, #repeatNext, #main .opt');
  ok(await page.evaluate(() => location.hash) === '#wdh' && !(await page.$('.hub')), 'Wiederholen-Knopf führt in die Wiederholung');
  await ending(null, problems); await browser.close();

  /* ---------- 2b. Grundlagen: mitmachen oder überspringen ---------- */
  const acts = [...new Set(chap.map(c => c.act))], chapB = chap.filter(c => c.act === 'B'), chapP1 = chap.filter(c => c.act === acts[2]);
  const only = (l, journey) => ({ player: { name: 'Kerim', start: 1, journey }, xp: 100, steps: {}, done: Object.fromEntries(l.map(id => [id, Date.now()])), quiz: {}, ex: {}, code: {}, days: [tag(0)], badges: [], updated: 1 });
  ok(acts[1] === 'B' && chapB.length === 7 && chapB.every(c => /^b0\d$/.test(c.id)), 'Die Grundlagen sind die zweite Phase, mit sieben Kapiteln b01 bis b07');
  // Direkt Angular: Grundlagen bleiben im Weg, das nächste Ticket springt in Phase 2
  ({ browser, page, problems } = await openPage({ standing: only(idsA.slice(0, 2), 'angular') }));
  await page.waitForSelector('.hub');
  ok(await txt(page, '#hubNextT') === chapP1[0].title && await txt(page, '.hub-meta') === 'Phase 2 · Kapitel 1 von ' + chapP1.length, '„Direkt Angular“: Das nächste Ticket überspringt die Grundlagen: ' + await txt(page, '.hub-meta'));
  ok(await page.$eval('.hub-path li.hub-p:nth-child(2)', li => li.querySelector('.hub-opt') !== null && li.querySelectorAll('a.hub-k').length === 7 && !li.querySelector('details').open), '„Direkt Angular“: Die Grundlagen stehen zugeklappt und „optional“ im Weg');
  await page.click('.hub-path li.hub-p:nth-child(2) summary'); await page.click('.hub-path li.hub-p:nth-child(2) a.hub-k');
  await page.waitForSelector('.ch-head h1');
  ok((await txt(page, '.ch-head h1')).includes(chapB[0].title) && (await txt(page, '.ch-head .loc')).includes('Grundlagen · Kapitel 1 von 7'), 'Die Grundlagen lassen sich trotzdem öffnen, ohne Phasen-Nummer');
  await page.click('.brand'); await page.waitForSelector('.hub');
  // Im Profil umschalten
  await page.click('#meBtn');
  ok(await page.isVisible('#mePath') && !(await page.isChecked('#mePath')), 'Profil: Schalter „Grundlagen mitmachen“ steht auf aus');
  await page.click('#mePathZ');
  ok(await page.evaluate(() => S.player.journey) === 'grundlagen' && await txt(page, '#hubNextT') === chapB[0].title && !(await page.$('.hub-opt')), 'Schalter an: Die Grundlagen sind Pflicht, das nächste Ticket ist ' + chapB[0].id);
  await page.click('#mePathZ');
  ok(await page.evaluate(() => S.player.journey) === 'angular' && await txt(page, '#hubNextT') === chapP1[0].title && await page.locator('.hub-opt').count() === 1, 'Schalter wieder aus: zurück zum Angular-Ticket');
  await page.click('#meClose');
  // Alles außer den Grundlagen geschafft: Glückwunsch, Krone und Zählung ohne die Grundlagen
  await page.evaluate(() => { CH.forEach(c => { if (c.act !== 'B') S.done[c.id] = Date.now(); }); save(); route(); });
  ok(await txt(page, '#hubNextT') === 'Alle ' + idsA.length + ' Kapitel erledigt' && await txt(page, '.hub-hello p') === 'Du hast alle Kapitel geschafft. Die Grundlagen kannst du jederzeit nachholen.' && await page.evaluate(() => ITEMS.find(x => x.id === 'krone').ok() && chapterTotal() === CH.filter(c => c.act !== 'B').length), '„Direkt Angular“ und alles andere geschafft: Glückwunsch, Krone, Grundlagen zählen nicht mit');
  await ending(null, problems); await browser.close();
  // Mit Grundlagen: das nächste Ticket nach dem großen Bild ist b01
  ({ browser, page, problems } = await openPage({ standing: only(idsA.slice(0, 2), 'grundlagen') }));
  await page.waitForSelector('.hub');
  ok(await txt(page, '#hubNextT') === chapB[0].title && await txt(page, '.hub-meta') === 'Grundlagen · Kapitel 1 von 7' && !(await page.$('.hub-opt')), '„Mit Grundlagen“: Nach dem großen Bild kommt ' + chapB[0].id + ', nichts ist optional');
  ok(await page.evaluate(() => { CH.forEach(c => { if (c.act !== 'B') S.done[c.id] = Date.now(); }); return !allRequiredDone() && !ITEMS.find(x => x.id === 'krone').ok(); }), '„Mit Grundlagen“: Ohne die Grundlagen ist der Kurs nicht fertig');
  await ending(null, problems); await browser.close();
  // Alter Spielstand ohne Wahl, aber schon in Phase 2: nicht zurück in die Grundlagen schicken
  ({ browser, page, problems } = await openPage({ standing: only(idsA.slice(0, 3)) }));
  await page.waitForSelector('.hub');
  ok(await txt(page, '#hubNextT') === chapP1[1].title && await page.locator('.hub-opt').count() === 1 && await page.evaluate(() => S.player.journey === undefined), 'Alter Spielstand ohne Wahl mit Fortschritt nach den Grundlagen: weiter in Phase 2, Grundlagen optional');
  await ending(null, problems); await browser.close();

  /* ---------- 3. Mit Spielstand, nichts fällig; eigenes Kapitel; alles geschafft ---------- */
  ({ browser, page, problems } = await openPage({ standing: middle(idsA, 0) }));
  await page.waitForSelector('.hub');
  ok(!(await page.$('#hubRepeat')) && (await txt(page, '.hub-repeat')).startsWith('Nichts zu wiederholen.') && await page.getAttribute('.hub-repeat a', 'href') === '#wdh-frei' && await txt(page, '.hub-repeat a') === 'Freie Runde', 'Nichts fällig: kein Knopf, leise Zeile mit Link „Freie Runde“');
  ok(!(await page.locator('.hub-hello p').count()) && !/\d/.test(await txt(page, '.hub-hello')) && /Kapitel \d+ von \d+/.test(await txt(page, '.hub-meta')), 'Nichts fällig: Die Begrüßung zählt nicht selbst, die Stelle im Kurs nennt nur die Karte');
  /* Ein Klick reicht: „Freie Runde“ startet die Runde ohne Zwischenseite. #wdh selbst zeigt weiter die ruhige Seite. */
  await page.click('.hub-repeat a'); await page.waitForSelector('#main .learn-opts .opt, #main .match-k'); /* die erste Karte kann auch Zuordnen sein */
  ok(await page.evaluate(() => location.hash) === '#wdh-frei' && await txt(page, '.learn-head h1') === 'Freie Runde' && !(await page.$('#learnFree')) && !(await txt(page, '#main')).includes('Nichts zu wiederholen'), '„Freie Runde“ vom Schreibtisch startet die Runde direkt, ohne zweite Seite');
  await page.evaluate(() => { location.hash = 'wdh'; }); await page.waitForSelector('#learnFree');
  ok((await txt(page, '#main')).includes('Nichts zu wiederholen') && await txt(page, '.learn-head h1') === 'Wiederholen', '#wdh zeigt weiter die ruhige Seite mit dem Knopf „Freie Runde“');
  await page.evaluate(() => { location.hash = 'start'; }); await page.waitForSelector('.hub');

  await page.evaluate(() => {
    S.customChapters = { 'e-test': { id: 'e-test', title: 'Animationen im Shop', tag: 'animate', createdAt: 1, ticket: { id: 'PW-E1', category: 'Feature', heading: 'Warenkorb soll einblenden', text: 'x' }, story: [['toni', 'Hi']], slides: [{ t: 'A', say: 'b', pro: 'c' }], quiz: [{ q: '?', options: ['a', 'b'], correct: 0, why: 'w' }], takeaway: ['m'] } };
    save(); route();
  });
  ok(await page.locator('.hub-path li.hub-p').count() === phases + 1 && await page.$eval('.hub-path li.hub-p:last-child', li => li.querySelector('.hub-pn').textContent === '✨' && li.querySelector('.hub-pt b').textContent === 'Eigene Kapitel' && li.querySelector('a.hub-k').getAttribute('href') === '#e-test'), 'Eigene Kapitel von Toni stehen als eigene Gruppe am Ende des Wegs');
  ok(await page.$$eval('.hub-path a.hub-k', l => l.length) === ids.length + 1, 'Auch mit eigenem Kapitel steht jedes Kapitel genau einmal im Weg');

  await page.evaluate(() => { CH.forEach(c => { S.done[c.id] = Date.now(); }); save(); route(); });
  ok(await txt(page, '#hubGo') === 'Zur Werkstatt' && await page.getAttribute('#hubGo', 'href') === '#training' && (await txt(page, '#hubNextT')).startsWith('Alle '), 'Alles geschafft: Glückwunsch-Karte mit Link zur Werkstatt statt nächstem Kapitel');
  ok(await page.locator('#main a[href="#training"]').count() === 1 && await page.locator('#main .btn.primary').count() === 1 && !(await page.$('.hub-k.current')), 'Alles geschafft: weiter nur ein Werkstatt-Link und eine Hauptaktion, keine aktuelle Station');
  ok(await txt(page, '.hub-hello p') === 'Du hast alle Kapitel geschafft.' && await page.locator('.hub-path li.hub-p.complete').count() === phases + 1, 'Alles geschafft: Lage und alle Phasen als fertig markiert');
  await page.click('#hubGo'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => location.hash) === '#training' && !(await page.$('.hub')), 'Der Knopf führt in die Werkstatt');
  await ending(null, problems); await browser.close();

  /* ---------- 4. Einstellungen: ein Dialog, vier Reiter ---------- */
  ({ browser, page, problems } = await openFixed(middle(idsA, 0)));
  await page.waitForSelector('.hub');
  const tab = () => page.$$eval('#meDlg [role="tab"]', l => l.filter(t => t.getAttribute('aria-selected') === 'true').map(t => t.dataset.r).join(','));
  const visible = () => page.$$eval('#meDlg [role="tabpanel"]', l => l.filter(p => !p.hidden).map(p => p.id).join(','));
  await page.click('#meBtn');
  ok(await page.isVisible('#meDlg[open]') && await tab() === 'du' && await visible() === 'meP-du', 'Klick auf den Profil-Chip öffnet die Einstellungen im Reiter „Du“');
  ok(await page.$$eval('#meDlg [role="tablist"] [role="tab"]', l => l.map(t => t.textContent).join('|')) === 'Du|Aussehen|Coach Toni|Spielstand', 'Vier Reiter: Du, Aussehen, Coach Toni, Spielstand');
  ok(await page.evaluate(() => document.activeElement.id) === 'meTab-du', 'Der Fokus steht auf dem gewählten Reiter');
  await page.keyboard.press('ArrowRight');
  ok(await tab() === 'aussehen' && await visible() === 'meP-aussehen' && await page.evaluate(() => document.activeElement.id) === 'meTab-aussehen', 'Pfeil rechts wechselt zum nächsten Reiter');
  await page.keyboard.press('End'); const atEnd = await tab();
  await page.keyboard.press('ArrowRight'); const allRound = await tab();
  await page.keyboard.press('ArrowLeft'); const stepBack = await tab();
  await page.keyboard.press('Home');
  ok(atEnd === 'spielstand' && allRound === 'du' && stepBack === 'spielstand' && await tab() === 'du', 'Ende, Pos1 und Pfeile laufen rundum durch die Reiter');
  ok(await page.$$eval('#meDlg [role="tab"]', l => l.filter(t => t.tabIndex === 0).length) === 1 && await page.$$eval('#meDlg [role="tabpanel"]', l => l.every(p => document.getElementById(p.getAttribute('aria-labelledby')).getAttribute('aria-controls') === p.id)), 'Reiter sind echte Tabs: einer in der Tab-Reihenfolge, jeder mit seinem Feld verknüpft');
  await page.keyboard.press('Escape');
  ok(!(await page.isVisible('#meDlg[open]')) && await page.evaluate(() => document.activeElement.id) === 'meBtn', 'Escape schließt, der Fokus kehrt zum Profil-Chip zurück');

  for (const r of ['aussehen', 'toni', 'spielstand', 'du']) {
    await page.evaluate(x => meOpen(x), r);
    ok(await tab() === r && await visible() === 'meP-' + r, 'ichOeffnen(\'' + r + '\') zeigt den Reiter');
    if (r === 'aussehen') ok(await page.isVisible('#hubTopic') && await page.isVisible('.fp[data-p="koralle"]') && await page.isVisible('#colorTint') && await page.isVisible('#meMotion') && await page.isVisible('#meSound'), 'Aussehen: Hell/Dunkel, Farben, Animationen, Ton');
    if (r === 'toni') ok(await page.isVisible('#aiProv') && await page.isVisible('#aiKey') && await page.isVisible('#aiModel') && await page.isVisible('#aiSaveBtn') && await page.isVisible('#hubLearnImage summary') && !(await page.$('#pfFd')) && (await txt(page, '#meP-toni')).startsWith('Ohne KI läuft alles, und die App passt'), 'Coach Toni: Anbieter, Schlüssel, Modell, Speichern, eingeklappt das Lernbild; kein Schalter „Für dich erklärt“');
    if (r === 'spielstand') ok(await txt(page, '#syncState') === 'Dein Spielstand liegt nur in diesem Browser.' && await page.isVisible('#exportBtn') && await page.isVisible('#importBtn'), 'Spielstand: Speicherort, speichern und laden');
    if (r === 'du') ok(await page.inputValue('#meName') === 'Kerim' && await page.isVisible('#avGrid') && await page.isVisible('#hubIntro') && await page.getAttribute('#hubKnowledge', 'href') === '#wissen', 'Du: Name, Avatar, Links zum Einstieg und zur Lern-Seite');
    await page.click('#meClose');
  }
  ok(!(await page.isVisible('#meDlg[open]')), 'Das Kreuz schließt die Einstellungen');
  await page.evaluate(() => openAiSettings());
  ok(await tab() === 'toni', 'openAiSettings() öffnet den Reiter „Coach Toni“');
  await page.click('#hubLearnImage summary');
  ok(await page.isVisible('#pfOn') && await page.isVisible('#pfNow') && await page.isVisible('#pfReset'), 'Lernbild aufgeklappt: An/Aus, neu auswerten, zurücksetzen');
  await page.mouse.click(8, 400);
  ok(!(await page.isVisible('#meDlg[open]')), 'Klick neben den Dialog schließt ihn');

  // Name ändern wirkt auf Chip und Schreibtisch
  await page.click('#meBtn'); await page.fill('#meName', 'Maximilian-Alexander der Vierte');
  ok(await page.getAttribute('#meName', 'maxlength') === '20' && await page.inputValue('#meName') === 'Maximilian-Alexander' && await page.evaluate(() => S.player.name === 'Maximilian-Alexander' && ME_NAME_MAX === 20), 'Name im Profil: höchstens 20 Zeichen, im Feld wie im Spielstand');
  ok(await txt(page, '#meBtn .me-n') === 'Maximilian-Alexander' && await page.evaluate(() => { const c = document.getElementById('meBtn').getBoundingClientRect(); return c.right <= innerWidth && [...document.querySelectorAll('#meBtn .me-n, #streak, #lvlName, #xpNum, #meBtn .xpbar')].every(e => { const r = e.getBoundingClientRect(); return r.left >= c.left && r.right <= c.right; }); }), 'Langer Name: Chip bleibt im Bild, nichts ragt aus dem Chip');
  await page.fill('#meName', 'Kira');
  ok(await txt(page, '.hub-hello h1') === 'Hallo Kira' && await txt(page, '#meBtn .me-n') === 'Kira', 'Neuer Name steht sofort in der Begrüßung und im Chip');
  await page.click('#meClose');

  // Hell/Dunkel wirkt sofort und bleibt nach dem Neuladen
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const light = await bg();
  await page.evaluate(() => meOpen('aussehen'));
  ok(await page.getAttribute('#hubTopic [data-th="light"]', 'aria-pressed') === 'true', 'Aussehen startet mit „Hell“');
  await page.click('#hubTopic [data-th="dark"]');
  ok(await page.evaluate(() => document.documentElement.dataset.theme === 'dark' && localStorage.getItem('fc-theme') === 'dark') && await bg() !== light, '„Dunkel“ wirkt sofort');
  await reloadIt(page); await page.waitForSelector('.hub');
  ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark' && await bg() !== light, 'Dunkel bleibt nach dem Neuladen');
  await page.evaluate(() => meOpen('aussehen'));
  ok(await page.getAttribute('#hubTopic [data-th="dark"]', 'aria-pressed') === 'true', 'Der Schalter zeigt nach dem Neuladen „Dunkel“');
  await page.click('#hubTopic [data-th="light"]');
  ok(await page.evaluate(() => localStorage.getItem('fc-theme')) === 'light' && await bg() === light, '„Hell“ stellt zurück');
  await page.click('#meClose');

  // Links im Reiter „Du“
  await page.evaluate(() => { window.introStart = () => { window.introCalled = true; }; });
  await page.click('#meBtn'); await page.click('#hubIntro');
  ok(await page.evaluate(() => window.introCalled === true) && !(await page.isVisible('#meDlg[open]')), '„Einstieg nochmal ansehen“ schließt den Dialog und ruft einstiegStarten()');
  await page.click('#meBtn'); await page.click('#hubKnowledge'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => location.hash) === '#wissen' && !(await page.isVisible('#meDlg[open]')) && !(await page.$('.hub')), '„Wie diese App beim Lernen hilft“ führt zur Seite #wissen');
  await page.click('.brand'); await page.waitForSelector('.hub');

  // Spielstand als Datei speichern
  await page.evaluate(() => meOpen('spielstand'));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#exportBtn')]);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-start-'));
  const file = path.join(dir, 'export.json'); await dl.saveAs(file);
  const exp = JSON.parse(fs.readFileSync(file, 'utf8'));
  ok(dl.suggestedFilename() === 'pixelwerk-spielstand.json' && exp.app === 'pixelwerk-angular' && exp.xp === 640 && exp.player.name === 'Kira' && Object.keys(exp.done).length === 8, 'Export über den Dialog: Datei enthält XP, Namen und geschaffte Kapitel');
  ok((await txt(page, '#hubGameMsg')).includes('pixelwerk-spielstand.json'), 'Export meldet im Dialog, wie die Datei heißt');

  // Aus Datei laden: kaputte Datei, abgelehnt, angenommen
  const broken = path.join(dir, 'kaputt.json'); fs.writeFileSync(broken, '{"hallo":1}');
  await page.setInputFiles('#importFile', broken);
  await page.waitForFunction(() => document.getElementById('hubGameMsg').textContent.includes('keine Spielstand-Datei'), null, { timeout: 3000 }).catch(() => {});
  ok((await txt(page, '#hubGameMsg')).includes('keine Spielstand-Datei') && await page.isVisible('#meDlg[open]') && await page.evaluate(() => S.xp) === 640, 'Falsche Datei: Meldung im Dialog, der Spielstand bleibt');
  const fresh = path.join(dir, 'neu.json');
  fs.writeFileSync(fresh, JSON.stringify(Object.assign({}, exp, { xp: 1234, player: { name: 'Mia', start: 1 }, done: { [ids[0]]: Date.now() }, steps: {} })));
  const questions = []; let answer = false;
  page.on('dialog', d => { questions.push(d.message()); return answer ? d.accept() : d.dismiss(); });
  await page.setInputFiles('#importFile', fresh); await page.waitForTimeout(300);
  ok(questions.length === 1 && /ersetzt/.test(questions[0]) && await page.evaluate(() => S.xp) === 640, 'Laden fragt nach, bevor ein vorhandener Spielstand ersetzt wird; „Abbrechen“ lässt alles, wie es ist');
  answer = true;
  await page.setInputFiles('#importFile', fresh);
  await page.waitForFunction(() => S.xp === 1234, null, { timeout: 3000 }).catch(() => {});
  ok(await page.evaluate(() => S.xp === 1234 && S.player.name === 'Mia' && JSON.parse(localStorage.getItem('ngfc.v1')).xp === 1234), 'Import über den Dialog lädt den Spielstand und speichert ihn');
  ok(!(await page.isVisible('#meDlg[open]')) && await txt(page, '.hub-hello h1') === 'Hallo Mia' && await txt(page, '#xpNum') === '1234 XP' && await txt(page, '#hubNextT') === chap[1].title && (await txt(page, '#toast')).includes('Spielstand geladen'), 'Nach dem Laden: Dialog zu, Schreibtisch und Chip zeigen den neuen Stand');
  fs.rmSync(dir, { recursive: true, force: true });
  await ending(null, problems); await browser.close();

  /* ---------- 5. Alte und beschädigte Spielstände halten die App nicht an ---------- */
  ({ browser, page, problems } = await openFixed({ xp: 100, done: { [ids[0]]: true }, steps: null, quiz: null, badges: null, player: null, days: 'gestern', srs: null, customChapters: null, arena: null, codeLine: { 'k01:0': 1 } }));
  await page.waitForSelector('.hub');
  ok(await txt(page, '#hubNextT') === chap[1].title && await txt(page, '#hubGo') === 'Anfangen' && await txt(page, '#xpNum') === '100 XP' && await page.locator('.hub-path a.hub-k.done').count() === 1, 'Spielstand mit fehlenden und falschen Feldern: Schreibtisch steht, Fortschritt bleibt');
  ok(await page.evaluate(() => S.codeLine && S.codeLine['k01:0'] === 1 && Array.isArray(S.days) && typeof S.steps === 'object' && S.steps !== null), 'Unbekannte Felder bleiben erhalten, kaputte fallen auf die Vorgabe zurück');
  await page.click('#hubGo'); await page.waitForSelector('.ch-head h1');
  await page.click('.brand'); await page.waitForSelector('.hub');
  await page.click('#meBtn');
  ok(await page.isVisible('#meDlg[open] #meName') && await page.inputValue('#meName') === '', 'Auch damit: Kapitel öffnet, Einstellungen öffnen');
  await ending(null, problems); await browser.close();
  ({ browser, page, problems } = await openFixed('{kaputt'));
  await page.waitForSelector('#main > .intro');
  ok(await page.evaluate(() => document.body.classList.contains('intro-on') && S.xp === 0 && !document.documentElement.classList.contains('intro-fwd')), 'Unlesbarer Spielstand im Browser: Die App startet wie neu, mit dem Einstieg');
  await page.click('#introSkip'); await page.waitForSelector('.hub');
  ok(await txt(page, '#hubGo') === 'Anfangen' && await txt(page, '#xpNum') === '0 XP' && await page.isVisible('.top'), 'Einstieg übersprungen: leerer Schreibtisch, Kopfzeile ist da');
  await ending(null, problems); await browser.close();

  /* ---------- 6. Handy, 360 px breit ---------- */
  ({ browser, page, problems } = await openPage({ standing: middle(idsA, 10), mobile: true }));
  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForSelector('.hub');
  ok(await noSideScroll(page), 'Handy 360 px: Schreibtisch ohne Querscrollen');
  ok(!(await page.isVisible('.brand b')) && !(await page.isVisible('#meBtn .me-n')) && await page.isVisible('#meBtn .px-av') && await page.isVisible('#lvlName') && await page.isVisible('#searchBtn'), 'Handy: Logo-Zeichen, Lupe, Avatar mit Rang');
  const small = await page.$$eval('#searchBtn, #meBtn, #hubGo, #hubRepeat, .hub-path summary, .hub-path a.hub-k, .hub-work, .hub-badges summary', l => l.filter(e => e.offsetParent && e.getBoundingClientRect().height < 40).map(e => e.id || e.className));
  ok(!small.length, 'Handy: Tippflächen auf dem Schreibtisch mindestens 40 px hoch' + (small.length ? ': ' + small.join(', ') : ''));
  await page.tap('#meBtn');
  for (const r of ['du', 'aussehen', 'toni', 'spielstand']) {
    await page.tap('#meTab-' + r);
    const fits = await page.evaluate(() => { const d = document.getElementById('meDlg'), r = d.getBoundingClientRect(); return d.scrollWidth <= d.clientWidth + 1 && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight + 1 && [...d.querySelectorAll('[role="tab"]')].every(t => t.getBoundingClientRect().right <= r.right); });
    ok(fits && await noSideScroll(page), 'Handy 360 px: Reiter „' + r + '“ passt in den Bildschirm, alle Reiter sichtbar');
  }
  const smallDlg = await page.$$eval('#meDlg button, #meDlg select, #meDlg input:not([type=checkbox]):not([type=file]), #meDlg a', l => l.filter(e => e.offsetParent && e.getBoundingClientRect().height < 36).map(e => e.id || e.className || e.textContent));
  await page.tap('#meTab-du');
  const smallYou = await page.$$eval('#meP-du button, #meP-du input:not([type=checkbox]), #meP-du a', l => l.filter(e => e.getBoundingClientRect().height < 36).map(e => e.id || e.className || e.textContent));
  ok(!smallDlg.length && !smallYou.length, 'Handy: Bedienelemente in den Einstellungen sind groß genug zum Tippen' + (smallDlg.concat(smallYou).length ? ': ' + smallDlg.concat(smallYou).join(', ') : ''));
  await ending(browser, problems);
  console.log('\nAlles grün');
})().catch(e => { console.error(e); process.exit(1); });
