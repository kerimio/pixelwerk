// Prüft im echten Browser: den Schreibtisch (Zuhause) für neue Nutzer und mit Spielstand, die Kopfzeile mit Profil-Chip,
// die alten Adressen #plan und #blitz und den einen Einstellungs-Dialog (vier Reiter, Hell/Dunkel, Spielstand als Datei).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { oeffnen, pruefer, neuLaden } = require('./hilfe');
const { ok, ende } = pruefer();

const tag = d => { const x = new Date(Date.now() - d * 864e5); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const txt = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); return el ? el.textContent.replace(/\s+/g, ' ').trim() : null; }, sel);
const keinQuerscrollen = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
/* Spielstand mitten im Kurs: die ersten acht Angular-Kapitel geschafft, das neunte angefangen, die Grundlagen übersprungen.
   ids = die Kapitel ohne die Grundlagen. alter = vor wie vielen Tagen geschafft. */
const mitte = (ids, alter) => ({
  ich: { name: 'Kerim', start: 1, weg: 'angular' }, xp: 640, steps: { [ids[8]]: 2 }, done: Object.fromEntries(ids.slice(0, 8).map(id => [id, Date.now() - alter * 864e5])),
  quiz: {}, ex: {}, code: {}, days: [tag(0), tag(1), tag(2)], badges: ['anpfiff', 'bild'], updated: 1
});

/* Öffnet die App mit einem Spielstand, der nur einmal gesetzt wird (auch ein kaputter als Text). Chromium verliert unter
   file:// beim Neuladen ab und zu den ganzen Speicher, darum lädt neuLaden so lange neu, bis der geschriebene Stand ankommt. */
async function oeffnenFest(stand) {
  const o = await oeffnen({ einstieg: true });
  await o.page.evaluate(s => localStorage.setItem('ngfc.v1', s), typeof stand === 'string' ? stand : JSON.stringify(stand));
  await neuLaden(o.page); await o.page.waitForSelector('#main');
  return o;
}

(async () => {
  /* ---------- 1. Ganz neuer Nutzer ---------- */
  let { browser, page, fehler } = await oeffnen();
  await page.waitForSelector('.hub');
  const kap = await page.evaluate(() => CH.map(c => ({ id: c.id, title: c.title, akt: c.akt })));
  const ids = kap.map(c => c.id);
  const kapA = kap.filter(c => c.akt !== 'B'), idsA = kapA.map(c => c.id);
  const phasen = await page.evaluate(() => AKTE.length);

  ok(await txt(page, '.hub-hallo h1') === 'Hallo' && !(await page.locator('.hub-hallo p').count()) && await page.locator('.hub-hallo .hub-foto .px-av').count() === 1, 'Neu: Begrüßung ohne Namen, daneben der Avatar, kein Satz zur Lage (was ansteht, sagt die Karte darunter)');
  ok(await txt(page, '#hubNextT') === kap[0].title && await txt(page, '#hubGo') === 'Anfangen' && await page.getAttribute('#hubGo', 'href') === '#' + ids[0], 'Neu: Die Karte zeigt das erste Kapitel mit „Anfangen“');
  ok(/^Phase 1 · Kapitel 1 von \d+$/.test(await txt(page, '.hub-meta')), 'Neu: Karte nennt Phase und Platz, noch keinen Schritt: ' + await txt(page, '.hub-meta'));
  ok(await page.locator('.hub-next .tk-id').count() === 1 && await page.isVisible('.hub-next .tk-typ') && !(await page.isVisible('.hub-next .tk-t')), 'Ticket-Zeile zeigt Nummer und Typ, nicht noch einen Titel');
  ok(await page.locator('#main .btn.primary').count() === 1, 'Genau eine Hauptaktion auf dem Schreibtisch');
  ok(!(await page.$('#hubWdh')) && await txt(page, '.hub-wdh') === 'Wiederholen startet nach deinem ersten Kapitel.', 'Neu: kein Wiederholen-Knopf, nur eine leise Zeile');

  const weg = await page.$$eval('.hub-weg a.hub-k', l => l.map(a => a.getAttribute('href').slice(1)));
  ok(await page.locator('.hub-weg li.hub-p').count() === phasen && phasen === 12, 'Der Weg zeigt alle 12 Phasen (mit den Grundlagen)');
  ok(weg.length === ids.length && weg.every((id, i) => id === ids[i]) && new Set(weg).size === weg.length, 'Der Weg zeigt jedes der ' + ids.length + ' Kapitel genau einmal, in der Reihenfolge des Kurses');
  ok(await page.$$eval('.hub-weg details', l => l.filter(d => d.open).length) === 1 && await page.$eval('.hub-weg li.hub-p:first-child details', d => d.open), 'Nur die aktuelle Phase ist aufgeklappt');
  ok(await page.getAttribute('.hub-k.akt', 'href') === '#' + ids[0] && await page.getAttribute('.hub-k.akt', 'aria-current') === 'step', 'Das aktuelle Kapitel ist als Station hervorgehoben');
  ok(await txt(page, '.hub-abz summary') === 'Abzeichen · 0 von ' + await page.evaluate(() => BADGES.length) && !(await page.$eval('.hub-abz', d => d.open)), 'Abzeichen sind eingeklappt, mit Zählung');
  ok(await page.locator('#main a[href="#training"]').count() === 1, 'Genau ein Link zur Werkstatt');
  ok(!(await page.$('#nav, .side, #navToggle, #calmBtn, #themeBtn, #aiDlg, #profilDlg, #ichHint')) && await page.evaluate(() => !document.body.classList.contains('calm') && !document.body.classList.contains('focus')), 'Seitenleiste, Ruhig-Schalter, Hell/Dunkel-Knopf und die alten Dialoge sind weg');
  ok(await page.evaluate(() => { const l = [...document.querySelectorAll('.hub .nur-sr')]; return l.length > 0 && !document.querySelector('.hub-sr, .kp-sr, .es-sr') && l.every(e => { const c = getComputedStyle(e); return c.position === 'absolute' && c.width === '1px' && c.height === '1px' && c.overflow === 'hidden'; }); }), 'Texte nur für Screenreader nutzen die eine Klasse nur-sr und sind unsichtbar');
  ok(await page.evaluate(() => typeof isCalm === 'undefined' && typeof renderNav === 'undefined' && typeof renderBlitz === 'undefined'), 'Reste aus der Zeit mit zwei Modi sind weg: isCalm, renderNav, renderBlitz');
  ok(await txt(page, '#lvlName') === 'Praktikant' && await txt(page, '#xpNum') === '0 XP' && !(await page.isVisible('#streak')), 'Profil-Chip: Rang und XP, ohne Serie keine Flamme');

  // In das Kapitel und über das Logo zurück
  await page.click('#hubGo'); await page.waitForSelector('.ch-head h1');
  ok((await txt(page, '.ch-head h1')).includes(kap[0].title), 'Der Hauptknopf führt in das Kapitel');
  await page.click('.brand'); await page.waitForSelector('.hub');
  ok(await txt(page, '#hubGo') === 'Anfangen' && !(await page.locator('.hub-hallo p').count()), 'Logo führt zum Schreibtisch. Nur reingeschaut ist noch nicht angefangen');
  // Nachschlagen über die Suche und Reinschauen über den Weg verschieben das nächste Kapitel nicht
  await page.keyboard.press('/'); await page.fill('#sucheIn', 'switchMap'); await page.waitForSelector('#sucheErg .su-list a');
  const treffer = await page.getAttribute('#sucheErg .su-list a', 'href');
  await page.keyboard.press('Enter'); await page.waitForSelector('#stepBody .slide');
  ok(treffer !== '#' + ids[0] && await page.evaluate(() => location.hash) === treffer, 'Suche: Enter öffnet den ersten Treffer auf einer Folie (' + treffer + ')');
  await page.click('#nextStep'); await page.click('.brand'); await page.waitForSelector('.hub');
  ok(await txt(page, '#hubNextT') === kap[0].title && await txt(page, '#hubGo') === 'Anfangen' && await page.evaluate(id => !S.steps[id], treffer.slice(1)), 'Suche: Nachschlagen und Weiterblättern zählt nicht als angefangen, das nächste Kapitel bleibt');
  await page.evaluate(id => { location.hash = id; }, ids[5]); await page.waitForSelector('#kpAnnehmen, .kp-alles');
  await page.click('.brand'); await page.waitForSelector('.hub');
  ok(await txt(page, '#hubNextT') === kap[0].title && await txt(page, '#hubGo') === 'Anfangen', 'Weg: Ein späteres Kapitel nur öffnen, ohne das Ticket anzunehmen, verschiebt das nächste Kapitel nicht');
  await page.evaluate(id => { S.steps[id] = 2; save(); route(); }, ids[0]);
  ok(await txt(page, '#hubGo') === 'Weitermachen' && /Schritt 3 von \d+$/.test(await txt(page, '.hub-meta')) && !(await page.locator('.hub-hallo p').count()), 'Angefangenes Kapitel: „Weitermachen“ mit Stand, weiter kein Satz zur Lage');
  await page.goBack(); await page.waitForSelector('.ch-head h1'); await page.goForward(); await page.waitForSelector('.hub');
  ok(await page.isVisible('#hubGo'), 'Zurück und Vor im Browser landen wieder auf dem Schreibtisch');

  // Frei anwählbar: ein Kapitel aus einer späteren Phase
  await page.click('.hub-weg li.hub-p:nth-child(5) summary');
  await page.click('.hub-weg li.hub-p:nth-child(5) a.hub-k');
  await page.waitForSelector('.ch-head h1');
  const frei = kap.find(c => c.akt === kap.map(k => k.akt).filter((a, i, l) => l.indexOf(a) === i)[4]);
  ok((await txt(page, '.ch-head h1')).includes(frei.title), 'Nichts ist gesperrt: Kapitel aus Phase 5 lässt sich direkt öffnen');
  await page.goBack(); await page.waitForSelector('.hub');
  ok(await page.$eval('.hub-weg li.hub-p:nth-child(5) details', d => d.open), 'Nach „Zurück“ bleibt die selbst aufgeklappte Phase offen');
  ok(await page.getAttribute('#hubGo', 'href') === '#' + ids[0] && await page.getAttribute('.hub-k.akt', 'href') === '#' + ids[0] && await page.$eval('.hub-weg li.hub-p:first-child', li => li.classList.contains('akt')), 'Reinschauen in ein späteres Kapitel ändert nicht, was als Nächstes dran ist');

  // Tastatur
  await page.focus('.hub-weg li.hub-p:nth-child(3) summary'); await page.keyboard.press('Enter');
  ok(await page.$eval('.hub-weg li.hub-p:nth-child(3) details', d => d.open), 'Phasen klappen auch per Tastatur auf');
  await page.keyboard.press('Tab');
  ok(await page.evaluate(() => document.activeElement.matches('.hub-weg li.hub-p:nth-child(3) a.hub-k')), 'Tab springt von der Phase zu ihrem ersten Kapitel');
  await page.evaluate(() => document.activeElement.blur()); await page.keyboard.press('/');
  ok(await page.isVisible('#sucheDlg[open]'), 'Taste / öffnet die Suche');
  await page.keyboard.press('Escape');

  // Alte Adressen
  await page.evaluate(() => { location.hash = 'plan'; }); await page.waitForTimeout(150);
  ok(await page.isVisible('.hub') && await page.evaluate(() => location.hash) === '#start', '#plan leitet auf den Schreibtisch (#start)');
  await page.evaluate(() => { location.hash = 'wdh'; }); await page.waitForTimeout(150);
  const wdh = await txt(page, '#main');
  await page.evaluate(() => { location.hash = 'blitz'; }); await page.waitForTimeout(150);
  ok(wdh && wdh.length > 20 && await txt(page, '#main') === wdh && !(await page.$('.blitz-next')), '#blitz zeigt dasselbe wie #wdh');
  await page.evaluate(() => { location.hash = 'gibtsnicht'; }); await page.waitForTimeout(150);
  ok(await page.isVisible('.hub'), 'Unbekannte Adresse zeigt den Schreibtisch');
  await ende(null, fehler); await browser.close();

  /* ---------- 2. Mit Spielstand, Karten fällig ---------- */
  ({ browser, page, fehler } = await oeffnen({ stand: mitte(idsA, 10) }));
  await page.waitForSelector('.hub');
  const due = await page.evaluate(() => srsDue().length);
  ok(await txt(page, '.hub-hallo h1') === 'Hallo Kerim' && due > 1 && (await txt(page, '#main')).split(due + ' Karten').length === 2, 'Spielstand: Begrüßung mit Namen, die fälligen Karten (' + due + ') nennt nur der Knopf „Wiederholen“');
  ok(await txt(page, '#hubNextT') === kapA[8].title && await txt(page, '#hubGo') === 'Weitermachen' && await page.getAttribute('#hubGo', 'href') === '#' + idsA[8], 'Spielstand: nächstes Kapitel ist das angefangene neunte');
  ok(/^Phase 3 · Kapitel 2 von 7 · Schritt 3 von \d+$/.test(await txt(page, '.hub-meta')), 'Karte: Phase, Platz und Schritt stimmen: ' + await txt(page, '.hub-meta'));
  ok(due > 0 && await txt(page, '#hubWdh') === 'Wiederholen · ' + due + ' Karten' && !(await page.$eval('#hubWdh', b => b.classList.contains('primary'))), 'Wiederholen-Knopf mit Kartenzahl, leiser als die Hauptaktion');
  ok(await page.locator('#main .btn.primary').count() === 1, 'Auch mit fälligen Karten genau eine Hauptaktion');
  ok(await page.$eval('.hub-weg li.hub-p:nth-child(1)', li => li.classList.contains('fertig') && li.querySelector('.hub-ps').textContent.startsWith('2/2')) &&
    await page.$eval('.hub-weg li.hub-p:nth-child(3)', li => li.classList.contains('fertig') && li.querySelector('.hub-ps').textContent.startsWith('5/5')) &&
    await page.$eval('.hub-weg li.hub-p:nth-child(4)', li => li.classList.contains('akt') && li.querySelector('details').open && li.querySelector('.hub-ps').textContent.startsWith('1/7')), 'Weg: Phase 1 (2/2) und 2 (5/5) fertig, Phase 3 aktuell und offen (1/7)');
  ok(await page.$eval('.hub-weg li.hub-p:nth-child(2)', li => !li.classList.contains('fertig') && !li.classList.contains('akt') && li.querySelector('.hub-opt').textContent === 'optional' && li.querySelector('.hub-pn').textContent === 'G' && li.querySelector('.hub-ps').textContent.startsWith('0/')) && await page.locator('.hub-opt').count() === 1, 'Weg: Die übersprungenen Grundlagen stehen als „optional“ ohne Nummer an zweiter Stelle');
  ok(await page.locator('.hub-weg a.hub-k.done').count() === 8 && await page.getAttribute('.hub-k.akt', 'href') === '#' + idsA[8], 'Weg: acht Stationen erledigt, die neunte ist die aktuelle');
  ok(await page.evaluate(n => { const sp = document.querySelector('.hub-next .hub-spur'), an = sp && sp.querySelector('li.an'); return !!sp && sp.getAttribute('aria-hidden') === 'true' && sp.querySelectorAll('li').length === n.ph && sp.querySelectorAll('i').length === n.n && sp.querySelectorAll('i.v').length === 2 && sp.querySelectorAll('i.a').length === 1 && !!an && an.querySelector('i.a') !== null; }, await page.evaluate(i => { const st = buildSteps(CH.find(c => c.id === i)); return { n: st.length, ph: new Set(st.map(s => s.t)).size }; }, idsA[8])), 'Karte: Spur durchs Kapitel mit einem Block je Schritt, zwei erledigt, der dritte ist dran');
  ok(await txt(page, '.hub-lohn') === 'Dafür gibt es +' + await page.evaluate(id => CH.find(c => c.id === id).xp, idsA[8]) + ' XP', 'Karte: zeigt, wie viele XP das Kapitel bringt');
  ok(await page.$eval('.hub-weg li.hub-p:nth-child(1)', li => li.querySelectorAll('.hub-pbar i.v').length === 2 && li.querySelector('.hub-pabz.got') !== null) &&
    await page.$eval('.hub-weg li.hub-p:nth-child(4)', li => li.querySelectorAll('.hub-pbar i').length === 7 && li.querySelectorAll('.hub-pbar i.v').length === 1 && li.querySelectorAll('.hub-pbar i.a').length === 1 && /noch offen/.test(li.querySelector('.hub-pabz').getAttribute('aria-label'))), 'Weg: Pixel-Leiste je Phase und das Abzeichen am Ende (Phase 1 bekommen, Phase 3 noch offen)');
  ok(await txt(page, '#ichBtn .ich-n') === 'Kerim' && await txt(page, '#lvlName') === 'Junior-Dev' && await txt(page, '#xpNum') === '640 XP' && await txt(page, '#streak') === '🔥 3' && await page.$eval('#xpBar', i => i.style.width) === '57%', 'Profil-Chip: Name, Rang, XP, Balken bis zum nächsten Rang, Serie');
  ok((await page.getAttribute('#ichBtn', 'aria-label')).includes('noch 260 XP bis Frontend-Dev'), 'Profil-Chip sagt Screenreadern, wie weit der nächste Rang ist');
  ok(await txt(page, '.hub-abz summary') === 'Abzeichen · 2 von ' + await page.evaluate(() => BADGES.length) && await page.evaluate(() => BADGES.length) === 22, 'Abzeichen zählen mit');
  await page.evaluate(() => addXp(300, 'Test'));
  ok(await txt(page, '#lvlName') === 'Frontend-Dev' && await txt(page, '#xpNum') === '940 XP' && (await txt(page, '#toast')).includes('+300 XP'), 'XP gutschreiben: Chip steigt mit auf, kurze Meldung erscheint');
  // Phase geschafft: Der Weg rückt weiter, die alte Phase klappt von selbst zu. Selbst zugeklappt bleibt zu.
  await page.waitForTimeout(50);
  await page.evaluate(l => { window.vorher = JSON.stringify(S); l.forEach(id => { S.done[id] = Date.now(); }); save(); route(); }, kap.filter(c => c.akt === kapA[8].akt).map(c => c.id));
  ok(await page.$$eval('.hub-weg details', l => l.map((d, i) => d.open ? i + 1 : 0).filter(Boolean).join(',')) === '5' && await page.$eval('.hub-weg li.hub-p:nth-child(4)', li => li.classList.contains('fertig')), 'Nächste Phase erreicht: nur noch sie ist offen, die geschaffte klappt zu');
  await page.click('.hub-weg li.hub-p:nth-child(5) summary'); await page.waitForTimeout(50);
  await page.evaluate(() => route());
  ok(await page.$$eval('.hub-weg details', l => l.filter(d => d.open).length) === 0, 'Die aktuelle Phase selbst zugeklappt: Sie bleibt zu, bis man sie wieder öffnet');
  await page.evaluate(() => { S = withDefaults(JSON.parse(window.vorher)); save(); hubAuf.clear(); route(); });
  await page.click('#hubWdh'); await page.waitForSelector('#main .ch-head, #main .wdh, #wdhWeiter, #main .opt');
  ok(await page.evaluate(() => location.hash) === '#wdh' && !(await page.$('.hub')), 'Wiederholen-Knopf führt in die Wiederholung');
  await ende(null, fehler); await browser.close();

  /* ---------- 2b. Grundlagen: mitmachen oder überspringen ---------- */
  const akte = [...new Set(kap.map(c => c.akt))], kapB = kap.filter(c => c.akt === 'B'), kapP1 = kap.filter(c => c.akt === akte[2]);
  const nur = (l, weg) => ({ ich: { name: 'Kerim', start: 1, weg }, xp: 100, steps: {}, done: Object.fromEntries(l.map(id => [id, Date.now()])), quiz: {}, ex: {}, code: {}, days: [tag(0)], badges: [], updated: 1 });
  ok(akte[1] === 'B' && kapB.length === 7 && kapB.every(c => /^b0\d$/.test(c.id)), 'Die Grundlagen sind die zweite Phase, mit sieben Kapiteln b01 bis b07');
  // Direkt Angular: Grundlagen bleiben im Weg, das nächste Ticket springt in Phase 2
  ({ browser, page, fehler } = await oeffnen({ stand: nur(idsA.slice(0, 2), 'angular') }));
  await page.waitForSelector('.hub');
  ok(await txt(page, '#hubNextT') === kapP1[0].title && await txt(page, '.hub-meta') === 'Phase 2 · Kapitel 1 von ' + kapP1.length, '„Direkt Angular“: Das nächste Ticket überspringt die Grundlagen: ' + await txt(page, '.hub-meta'));
  ok(await page.$eval('.hub-weg li.hub-p:nth-child(2)', li => li.querySelector('.hub-opt') !== null && li.querySelectorAll('a.hub-k').length === 7 && !li.querySelector('details').open), '„Direkt Angular“: Die Grundlagen stehen zugeklappt und „optional“ im Weg');
  await page.click('.hub-weg li.hub-p:nth-child(2) summary'); await page.click('.hub-weg li.hub-p:nth-child(2) a.hub-k');
  await page.waitForSelector('.ch-head h1');
  ok((await txt(page, '.ch-head h1')).includes(kapB[0].title) && (await txt(page, '.ch-head .ort')).includes('Grundlagen · Kapitel 1 von 7'), 'Die Grundlagen lassen sich trotzdem öffnen, ohne Phasen-Nummer');
  await page.click('.brand'); await page.waitForSelector('.hub');
  // Im Profil umschalten
  await page.click('#ichBtn');
  ok(await page.isVisible('#ichWeg') && !(await page.isChecked('#ichWeg')), 'Profil: Schalter „Grundlagen mitmachen“ steht auf aus');
  await page.click('#ichWegZ');
  ok(await page.evaluate(() => S.ich.weg) === 'grundlagen' && await txt(page, '#hubNextT') === kapB[0].title && !(await page.$('.hub-opt')), 'Schalter an: Die Grundlagen sind Pflicht, das nächste Ticket ist ' + kapB[0].id);
  await page.click('#ichWegZ');
  ok(await page.evaluate(() => S.ich.weg) === 'angular' && await txt(page, '#hubNextT') === kapP1[0].title && await page.locator('.hub-opt').count() === 1, 'Schalter wieder aus: zurück zum Angular-Ticket');
  await page.click('#ichZu');
  // Alles außer den Grundlagen geschafft: Glückwunsch, Krone und Zählung ohne die Grundlagen
  await page.evaluate(() => { CH.forEach(c => { if (c.akt !== 'B') S.done[c.id] = Date.now(); }); save(); route(); });
  ok(await txt(page, '#hubNextT') === 'Alle ' + idsA.length + ' Kapitel erledigt' && await txt(page, '.hub-hallo p') === 'Du hast alle Kapitel geschafft. Die Grundlagen kannst du jederzeit nachholen.' && await page.evaluate(() => SACHEN.find(x => x.id === 'krone').ok() && kapitelGesamt() === CH.filter(c => c.akt !== 'B').length), '„Direkt Angular“ und alles andere geschafft: Glückwunsch, Krone, Grundlagen zählen nicht mit');
  await ende(null, fehler); await browser.close();
  // Mit Grundlagen: das nächste Ticket nach dem großen Bild ist b01
  ({ browser, page, fehler } = await oeffnen({ stand: nur(idsA.slice(0, 2), 'grundlagen') }));
  await page.waitForSelector('.hub');
  ok(await txt(page, '#hubNextT') === kapB[0].title && await txt(page, '.hub-meta') === 'Grundlagen · Kapitel 1 von 7' && !(await page.$('.hub-opt')), '„Mit Grundlagen“: Nach dem großen Bild kommt ' + kapB[0].id + ', nichts ist optional');
  ok(await page.evaluate(() => { CH.forEach(c => { if (c.akt !== 'B') S.done[c.id] = Date.now(); }); return !allePflichtGeschafft() && !SACHEN.find(x => x.id === 'krone').ok(); }), '„Mit Grundlagen“: Ohne die Grundlagen ist der Kurs nicht fertig');
  await ende(null, fehler); await browser.close();
  // Alter Spielstand ohne Wahl, aber schon in Phase 2: nicht zurück in die Grundlagen schicken
  ({ browser, page, fehler } = await oeffnen({ stand: nur(idsA.slice(0, 3)) }));
  await page.waitForSelector('.hub');
  ok(await txt(page, '#hubNextT') === kapP1[1].title && await page.locator('.hub-opt').count() === 1 && await page.evaluate(() => S.ich.weg === undefined), 'Alter Spielstand ohne Wahl mit Fortschritt nach den Grundlagen: weiter in Phase 2, Grundlagen optional');
  await ende(null, fehler); await browser.close();

  /* ---------- 3. Mit Spielstand, nichts fällig; eigenes Kapitel; alles geschafft ---------- */
  ({ browser, page, fehler } = await oeffnen({ stand: mitte(idsA, 0) }));
  await page.waitForSelector('.hub');
  ok(!(await page.$('#hubWdh')) && (await txt(page, '.hub-wdh')).startsWith('Nichts zu wiederholen.') && await page.getAttribute('.hub-wdh a', 'href') === '#wdh-frei' && await txt(page, '.hub-wdh a') === 'Freie Runde', 'Nichts fällig: kein Knopf, leise Zeile mit Link „Freie Runde“');
  ok(!(await page.locator('.hub-hallo p').count()) && !/\d/.test(await txt(page, '.hub-hallo')) && /Kapitel \d+ von \d+/.test(await txt(page, '.hub-meta')), 'Nichts fällig: Die Begrüßung zählt nicht selbst, die Stelle im Kurs nennt nur die Karte');
  /* Ein Klick reicht: „Freie Runde“ startet die Runde ohne Zwischenseite. #wdh selbst zeigt weiter die ruhige Seite. */
  await page.click('.hub-wdh a'); await page.waitForSelector('#main .le-opts .opt, #main .zu-k'); /* die erste Karte kann auch Zuordnen sein */
  ok(await page.evaluate(() => location.hash) === '#wdh-frei' && await txt(page, '.le-kopf h1') === 'Freie Runde' && !(await page.$('#leFrei')) && !(await txt(page, '#main')).includes('Nichts zu wiederholen'), '„Freie Runde“ vom Schreibtisch startet die Runde direkt, ohne zweite Seite');
  await page.evaluate(() => { location.hash = 'wdh'; }); await page.waitForSelector('#leFrei');
  ok((await txt(page, '#main')).includes('Nichts zu wiederholen') && await txt(page, '.le-kopf h1') === 'Wiederholen', '#wdh zeigt weiter die ruhige Seite mit dem Knopf „Freie Runde“');
  await page.evaluate(() => { location.hash = 'start'; }); await page.waitForSelector('.hub');

  await page.evaluate(() => {
    S.eigene = { 'e-test': { id: 'e-test', title: 'Animationen im Shop', tag: 'animate', erstellt: 1, ticket: { id: 'PW-E1', typ: 'Feature', titel: 'Warenkorb soll einblenden', text: 'x' }, story: [['toni', 'Hi']], slides: [{ t: 'A', say: 'b', pro: 'c' }], quiz: [{ q: '?', options: ['a', 'b'], correct: 0, why: 'w' }], merke: ['m'] } };
    save(); route();
  });
  ok(await page.locator('.hub-weg li.hub-p').count() === phasen + 1 && await page.$eval('.hub-weg li.hub-p:last-child', li => li.querySelector('.hub-pn').textContent === '✨' && li.querySelector('.hub-pt b').textContent === 'Eigene Kapitel' && li.querySelector('a.hub-k').getAttribute('href') === '#e-test'), 'Eigene Kapitel von Toni stehen als eigene Gruppe am Ende des Wegs');
  ok(await page.$$eval('.hub-weg a.hub-k', l => l.length) === ids.length + 1, 'Auch mit eigenem Kapitel steht jedes Kapitel genau einmal im Weg');

  await page.evaluate(() => { CH.forEach(c => { S.done[c.id] = Date.now(); }); save(); route(); });
  ok(await txt(page, '#hubGo') === 'Zur Werkstatt' && await page.getAttribute('#hubGo', 'href') === '#training' && (await txt(page, '#hubNextT')).startsWith('Alle '), 'Alles geschafft: Glückwunsch-Karte mit Link zur Werkstatt statt nächstem Kapitel');
  ok(await page.locator('#main a[href="#training"]').count() === 1 && await page.locator('#main .btn.primary').count() === 1 && !(await page.$('.hub-k.akt')), 'Alles geschafft: weiter nur ein Werkstatt-Link und eine Hauptaktion, keine aktuelle Station');
  ok(await txt(page, '.hub-hallo p') === 'Du hast alle Kapitel geschafft.' && await page.locator('.hub-weg li.hub-p.fertig').count() === phasen + 1, 'Alles geschafft: Lage und alle Phasen als fertig markiert');
  await page.click('#hubGo'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => location.hash) === '#training' && !(await page.$('.hub')), 'Der Knopf führt in die Werkstatt');
  await ende(null, fehler); await browser.close();

  /* ---------- 4. Einstellungen: ein Dialog, vier Reiter ---------- */
  ({ browser, page, fehler } = await oeffnenFest(mitte(idsA, 0)));
  await page.waitForSelector('.hub');
  const reiter = () => page.$$eval('#ichDlg [role="tab"]', l => l.filter(t => t.getAttribute('aria-selected') === 'true').map(t => t.dataset.r).join(','));
  const sichtbar = () => page.$$eval('#ichDlg [role="tabpanel"]', l => l.filter(p => !p.hidden).map(p => p.id).join(','));
  await page.click('#ichBtn');
  ok(await page.isVisible('#ichDlg[open]') && await reiter() === 'du' && await sichtbar() === 'ichP-du', 'Klick auf den Profil-Chip öffnet die Einstellungen im Reiter „Du“');
  ok(await page.$$eval('#ichDlg [role="tablist"] [role="tab"]', l => l.map(t => t.textContent).join('|')) === 'Du|Aussehen|Coach Toni|Spielstand', 'Vier Reiter: Du, Aussehen, Coach Toni, Spielstand');
  ok(await page.evaluate(() => document.activeElement.id) === 'ichTab-du', 'Der Fokus steht auf dem gewählten Reiter');
  await page.keyboard.press('ArrowRight');
  ok(await reiter() === 'aussehen' && await sichtbar() === 'ichP-aussehen' && await page.evaluate(() => document.activeElement.id) === 'ichTab-aussehen', 'Pfeil rechts wechselt zum nächsten Reiter');
  await page.keyboard.press('End'); const amEnde = await reiter();
  await page.keyboard.press('ArrowRight'); const rundum = await reiter();
  await page.keyboard.press('ArrowLeft'); const zurueck = await reiter();
  await page.keyboard.press('Home');
  ok(amEnde === 'spielstand' && rundum === 'du' && zurueck === 'spielstand' && await reiter() === 'du', 'Ende, Pos1 und Pfeile laufen rundum durch die Reiter');
  ok(await page.$$eval('#ichDlg [role="tab"]', l => l.filter(t => t.tabIndex === 0).length) === 1 && await page.$$eval('#ichDlg [role="tabpanel"]', l => l.every(p => document.getElementById(p.getAttribute('aria-labelledby')).getAttribute('aria-controls') === p.id)), 'Reiter sind echte Tabs: einer in der Tab-Reihenfolge, jeder mit seinem Feld verknüpft');
  await page.keyboard.press('Escape');
  ok(!(await page.isVisible('#ichDlg[open]')) && await page.evaluate(() => document.activeElement.id) === 'ichBtn', 'Escape schließt, der Fokus kehrt zum Profil-Chip zurück');

  for (const r of ['aussehen', 'toni', 'spielstand', 'du']) {
    await page.evaluate(x => ichOeffnen(x), r);
    ok(await reiter() === r && await sichtbar() === 'ichP-' + r, 'ichOeffnen(\'' + r + '\') zeigt den Reiter');
    if (r === 'aussehen') ok(await page.isVisible('#hubThema') && await page.isVisible('.fp[data-p="koralle"]') && await page.isVisible('#farbTint') && await page.isVisible('#ichMotion') && await page.isVisible('#ichTon'), 'Aussehen: Hell/Dunkel, Farben, Animationen, Ton');
    if (r === 'toni') ok(await page.isVisible('#aiAnb') && await page.isVisible('#aiKey') && await page.isVisible('#aiModel') && await page.isVisible('#aiSaveBtn') && await page.isVisible('#hubLernbild summary') && !(await page.$('#pfFd')) && (await txt(page, '#ichP-toni')).startsWith('Ohne KI läuft alles, und die App passt'), 'Coach Toni: Anbieter, Schlüssel, Modell, Speichern, eingeklappt das Lernbild; kein Schalter „Für dich erklärt“');
    if (r === 'spielstand') ok(await txt(page, '#syncState') === 'Dein Spielstand liegt nur in diesem Browser.' && await page.isVisible('#exportBtn') && await page.isVisible('#importBtn'), 'Spielstand: Speicherort, speichern und laden');
    if (r === 'du') ok(await page.inputValue('#ichName') === 'Kerim' && await page.isVisible('#avGrid') && await page.isVisible('#hubEinstieg') && await page.getAttribute('#hubWissen', 'href') === '#wissen', 'Du: Name, Avatar, Links zum Einstieg und zur Lern-Seite');
    await page.click('#ichZu');
  }
  ok(!(await page.isVisible('#ichDlg[open]')), 'Das Kreuz schließt die Einstellungen');
  await page.evaluate(() => openAiSettings());
  ok(await reiter() === 'toni', 'openAiSettings() öffnet den Reiter „Coach Toni“');
  await page.click('#hubLernbild summary');
  ok(await page.isVisible('#pfOn') && await page.isVisible('#pfNow') && await page.isVisible('#pfReset'), 'Lernbild aufgeklappt: An/Aus, neu auswerten, zurücksetzen');
  await page.mouse.click(8, 400);
  ok(!(await page.isVisible('#ichDlg[open]')), 'Klick neben den Dialog schließt ihn');

  // Name ändern wirkt auf Chip und Schreibtisch
  await page.click('#ichBtn'); await page.fill('#ichName', 'Maximilian-Alexander der Vierte');
  ok(await page.getAttribute('#ichName', 'maxlength') === '20' && await page.inputValue('#ichName') === 'Maximilian-Alexander' && await page.evaluate(() => S.ich.name === 'Maximilian-Alexander' && ICH_NAME_MAX === 20), 'Name im Profil: höchstens 20 Zeichen, im Feld wie im Spielstand');
  ok(await txt(page, '#ichBtn .ich-n') === 'Maximilian-Alexander' && await page.evaluate(() => { const c = document.getElementById('ichBtn').getBoundingClientRect(); return c.right <= innerWidth && [...document.querySelectorAll('#ichBtn .ich-n, #streak, #lvlName, #xpNum, #ichBtn .xpbar')].every(e => { const r = e.getBoundingClientRect(); return r.left >= c.left && r.right <= c.right; }); }), 'Langer Name: Chip bleibt im Bild, nichts ragt aus dem Chip');
  await page.fill('#ichName', 'Kira');
  ok(await txt(page, '.hub-hallo h1') === 'Hallo Kira' && await txt(page, '#ichBtn .ich-n') === 'Kira', 'Neuer Name steht sofort in der Begrüßung und im Chip');
  await page.click('#ichZu');

  // Hell/Dunkel wirkt sofort und bleibt nach dem Neuladen
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const hell = await bg();
  await page.evaluate(() => ichOeffnen('aussehen'));
  ok(await page.getAttribute('#hubThema [data-th="light"]', 'aria-pressed') === 'true', 'Aussehen startet mit „Hell“');
  await page.click('#hubThema [data-th="dark"]');
  ok(await page.evaluate(() => document.documentElement.dataset.theme === 'dark' && localStorage.getItem('fc-theme') === 'dark') && await bg() !== hell, '„Dunkel“ wirkt sofort');
  await neuLaden(page); await page.waitForSelector('.hub');
  ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark' && await bg() !== hell, 'Dunkel bleibt nach dem Neuladen');
  await page.evaluate(() => ichOeffnen('aussehen'));
  ok(await page.getAttribute('#hubThema [data-th="dark"]', 'aria-pressed') === 'true', 'Der Schalter zeigt nach dem Neuladen „Dunkel“');
  await page.click('#hubThema [data-th="light"]');
  ok(await page.evaluate(() => localStorage.getItem('fc-theme')) === 'light' && await bg() === hell, '„Hell“ stellt zurück');
  await page.click('#ichZu');

  // Links im Reiter „Du“
  await page.evaluate(() => { window.einstiegStarten = () => { window.esGerufen = true; }; });
  await page.click('#ichBtn'); await page.click('#hubEinstieg');
  ok(await page.evaluate(() => window.esGerufen === true) && !(await page.isVisible('#ichDlg[open]')), '„Einstieg nochmal ansehen“ schließt den Dialog und ruft einstiegStarten()');
  await page.click('#ichBtn'); await page.click('#hubWissen'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => location.hash) === '#wissen' && !(await page.isVisible('#ichDlg[open]')) && !(await page.$('.hub')), '„Wie diese App beim Lernen hilft“ führt zur Seite #wissen');
  await page.click('.brand'); await page.waitForSelector('.hub');

  // Spielstand als Datei speichern
  await page.evaluate(() => ichOeffnen('spielstand'));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#exportBtn')]);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-start-'));
  const datei = path.join(dir, 'export.json'); await dl.saveAs(datei);
  const exp = JSON.parse(fs.readFileSync(datei, 'utf8'));
  ok(dl.suggestedFilename() === 'pixelwerk-spielstand.json' && exp.app === 'pixelwerk-angular' && exp.xp === 640 && exp.ich.name === 'Kira' && Object.keys(exp.done).length === 8, 'Export über den Dialog: Datei enthält XP, Namen und geschaffte Kapitel');
  ok((await txt(page, '#hubSpielMsg')).includes('pixelwerk-spielstand.json'), 'Export meldet im Dialog, wie die Datei heißt');

  // Aus Datei laden: kaputte Datei, abgelehnt, angenommen
  const kaputt = path.join(dir, 'kaputt.json'); fs.writeFileSync(kaputt, '{"hallo":1}');
  await page.setInputFiles('#importFile', kaputt);
  await page.waitForFunction(() => document.getElementById('hubSpielMsg').textContent.includes('keine Spielstand-Datei'), null, { timeout: 3000 }).catch(() => {});
  ok((await txt(page, '#hubSpielMsg')).includes('keine Spielstand-Datei') && await page.isVisible('#ichDlg[open]') && await page.evaluate(() => S.xp) === 640, 'Falsche Datei: Meldung im Dialog, der Spielstand bleibt');
  const neu = path.join(dir, 'neu.json');
  fs.writeFileSync(neu, JSON.stringify(Object.assign({}, exp, { xp: 1234, ich: { name: 'Mia', start: 1 }, done: { [ids[0]]: Date.now() }, steps: {} })));
  const fragen = []; let antwort = false;
  page.on('dialog', d => { fragen.push(d.message()); return antwort ? d.accept() : d.dismiss(); });
  await page.setInputFiles('#importFile', neu); await page.waitForTimeout(300);
  ok(fragen.length === 1 && /ersetzt/.test(fragen[0]) && await page.evaluate(() => S.xp) === 640, 'Laden fragt nach, bevor ein vorhandener Spielstand ersetzt wird; „Abbrechen“ lässt alles, wie es ist');
  antwort = true;
  await page.setInputFiles('#importFile', neu);
  await page.waitForFunction(() => S.xp === 1234, null, { timeout: 3000 }).catch(() => {});
  ok(await page.evaluate(() => S.xp === 1234 && S.ich.name === 'Mia' && JSON.parse(localStorage.getItem('ngfc.v1')).xp === 1234), 'Import über den Dialog lädt den Spielstand und speichert ihn');
  ok(!(await page.isVisible('#ichDlg[open]')) && await txt(page, '.hub-hallo h1') === 'Hallo Mia' && await txt(page, '#xpNum') === '1234 XP' && await txt(page, '#hubNextT') === kap[1].title && (await txt(page, '#toast')).includes('Spielstand geladen'), 'Nach dem Laden: Dialog zu, Schreibtisch und Chip zeigen den neuen Stand');
  fs.rmSync(dir, { recursive: true, force: true });
  await ende(null, fehler); await browser.close();

  /* ---------- 5. Alte und beschädigte Spielstände halten die App nicht an ---------- */
  ({ browser, page, fehler } = await oeffnenFest({ xp: 100, done: { [ids[0]]: true }, steps: null, quiz: null, badges: null, ich: null, days: 'gestern', srs: null, eigene: null, arena: null, zeile: { 'k01:0': 1 } }));
  await page.waitForSelector('.hub');
  ok(await txt(page, '#hubNextT') === kap[1].title && await txt(page, '#hubGo') === 'Anfangen' && await txt(page, '#xpNum') === '100 XP' && await page.locator('.hub-weg a.hub-k.done').count() === 1, 'Spielstand mit fehlenden und falschen Feldern: Schreibtisch steht, Fortschritt bleibt');
  ok(await page.evaluate(() => S.zeile && S.zeile['k01:0'] === 1 && Array.isArray(S.days) && typeof S.steps === 'object' && S.steps !== null), 'Unbekannte Felder bleiben erhalten, kaputte fallen auf die Vorgabe zurück');
  await page.click('#hubGo'); await page.waitForSelector('.ch-head h1');
  await page.click('.brand'); await page.waitForSelector('.hub');
  await page.click('#ichBtn');
  ok(await page.isVisible('#ichDlg[open] #ichName') && await page.inputValue('#ichName') === '', 'Auch damit: Kapitel öffnet, Einstellungen öffnen');
  await ende(null, fehler); await browser.close();
  ({ browser, page, fehler } = await oeffnenFest('{kaputt'));
  await page.waitForSelector('#main > .es');
  ok(await page.evaluate(() => document.body.classList.contains('es-an') && S.xp === 0 && !document.documentElement.classList.contains('es-vor')), 'Unlesbarer Spielstand im Browser: Die App startet wie neu, mit dem Einstieg');
  await page.click('#esSkip'); await page.waitForSelector('.hub');
  ok(await txt(page, '#hubGo') === 'Anfangen' && await txt(page, '#xpNum') === '0 XP' && await page.isVisible('.top'), 'Einstieg übersprungen: leerer Schreibtisch, Kopfzeile ist da');
  await ende(null, fehler); await browser.close();

  /* ---------- 6. Handy, 360 px breit ---------- */
  ({ browser, page, fehler } = await oeffnen({ stand: mitte(idsA, 10), mobil: true }));
  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForSelector('.hub');
  ok(await keinQuerscrollen(page), 'Handy 360 px: Schreibtisch ohne Querscrollen');
  ok(!(await page.isVisible('.brand b')) && !(await page.isVisible('#ichBtn .ich-n')) && await page.isVisible('#ichBtn .px-av') && await page.isVisible('#lvlName') && await page.isVisible('#sucheBtn'), 'Handy: Logo-Zeichen, Lupe, Avatar mit Rang');
  const klein = await page.$$eval('#sucheBtn, #ichBtn, #hubGo, #hubWdh, .hub-weg summary, .hub-weg a.hub-k, .hub-werk, .hub-abz summary', l => l.filter(e => e.offsetParent && e.getBoundingClientRect().height < 40).map(e => e.id || e.className));
  ok(!klein.length, 'Handy: Tippflächen auf dem Schreibtisch mindestens 40 px hoch' + (klein.length ? ': ' + klein.join(', ') : ''));
  await page.tap('#ichBtn');
  for (const r of ['du', 'aussehen', 'toni', 'spielstand']) {
    await page.tap('#ichTab-' + r);
    const passt = await page.evaluate(() => { const d = document.getElementById('ichDlg'), r = d.getBoundingClientRect(); return d.scrollWidth <= d.clientWidth + 1 && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight + 1 && [...d.querySelectorAll('[role="tab"]')].every(t => t.getBoundingClientRect().right <= r.right); });
    ok(passt && await keinQuerscrollen(page), 'Handy 360 px: Reiter „' + r + '“ passt in den Bildschirm, alle Reiter sichtbar');
  }
  const kleinDlg = await page.$$eval('#ichDlg button, #ichDlg select, #ichDlg input:not([type=checkbox]):not([type=file]), #ichDlg a', l => l.filter(e => e.offsetParent && e.getBoundingClientRect().height < 36).map(e => e.id || e.className || e.textContent));
  await page.tap('#ichTab-du');
  const kleinDu = await page.$$eval('#ichP-du button, #ichP-du input:not([type=checkbox]), #ichP-du a', l => l.filter(e => e.getBoundingClientRect().height < 36).map(e => e.id || e.className || e.textContent));
  ok(!kleinDlg.length && !kleinDu.length, 'Handy: Bedienelemente in den Einstellungen sind groß genug zum Tippen' + (kleinDlg.concat(kleinDu).length ? ': ' + kleinDlg.concat(kleinDu).join(', ') : ''));
  await ende(browser, fehler);
  console.log('\nAlles grün');
})().catch(e => { console.error(e); process.exit(1); });
