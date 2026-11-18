// Prüft im echten Browser den Kapitel-Ablauf: Rahmen, Szene zum Durchspielen, Folie, „Erklär die Zeilen selbst“,
// Wort-Karte, Quiz, Abschluss. Die Kapitel werden nach Eigenschaften ausgesucht, nicht nach festen Texten.
const { oeffnen, pruefer } = require('./hilfe');
const { ok, ende } = pruefer();

const st = page => page.evaluate(() => JSON.parse(JSON.stringify(S)));
/* Kapitel öffnen. wo = { t: 'story' | 'slide' | 'quiz' | 'code' | 'end', i } steht für „bis zu diesem Schritt geblättert“: Der Stand
   wird auf den Schritt gesetzt, dann öffnet der Sprung ihn. Ein Sprung allein (wie aus der Suche) zählt nicht, siehe „Nachschlagen“. */
const geh = (page, id, wo) => page.evaluate(([id, wo]) => new Promise(fertig => {
  if (wo) {
    window.sprungZu = Object.assign({ id }, wo);
    const j = buildSteps(CH.find(c => c.id === id)).findIndex(s => s.t === wo.t && (wo.i == null || s.i === wo.i));
    if (!S.done[id]) S.steps[id] = Math.max(S.steps[id] || 0, j);
  }
  if (location.hash === '#' + id) { route(); fertig(); } else { addEventListener('hashchange', () => setTimeout(fertig, 0), { once: true }); location.hash = id; }
}), [id, wo]);
const zeilen = page => page.locator('#stepBody .story > *');
const sichtbar = (page, sel) => page.locator(sel).first().isVisible();
const txt = (page, sel) => page.locator(sel).first().textContent();
const cl = (page, z) => page.locator('#stepBody .acode .cl').nth(z);
/* Erklärungen, die gerade in der Liste zu sehen sind */
const offen = page => page.locator('#stepBody .notes li:visible').count();
/* Eine Zahl am Rand einer Codezeile: da und sichtbar? */
const nummerDa = (page, z) => cl(page, z).evaluate(el => [...el.querySelectorAll('.gut i')].some(i => getComputedStyle(i).visibility === 'visible'));
const keinQuerscrollen = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const hoch = (page, sel) => page.locator(sel).first().evaluate(el => el.getBoundingClientRect().height);

/* Was die Inhalte hergeben: Kapitel und Folien für die einzelnen Fälle */
const lage = page => page.evaluate(() => {
  /* Folie zum Selbsterklären: Code mit Erklärungen. wo = Zeile je Nummer. */
  const spiel = s => {
    if (!s.code || !s.notes || !s.notes.length) return null;
    return { wo: kpNotizZeilen(s.code.split('\n'), s.notes), n: s.notes.length };
  };
  const mitSpiel = c => c.slides.map((s, i) => spiel(s) ? i : -1).filter(i => i >= 0);
  /* Hauptkapitel: eigene Zeile mitten in der Szene, zwei Folien mit Code und Erklärungen (die erste mit mindestens drei), zwei Quizfragen */
  const k = CH.find(c => c.story.findIndex(z => z[0] === 'du') > 0 && mitSpiel(c).length >= 2 && spiel(c.slides[mitSpiel(c)[0]]).n >= 3 && spiel(c.slides[mitSpiel(c)[0]]).wo.every(z => z >= 0) && c.quiz.length >= 2 && c.slides.some(s => !s.code && s.punkte && s.punkte.length >= 2));
  /* Szene ohne eigene Zeile, nach der ersten Nachricht kommen noch mindestens zwei (für Leertaste und Klick) */
  const ersteNachricht = c => c.story.findIndex(z => CAST[z[0]] && z[0] !== 'erz');
  const kChat = CH.find(c => c !== k && c.story.every(z => z[0] !== 'du') && c.story.filter(z => CAST[z[0]] && z[0] !== 'erz').length >= 2 && c.story.length >= ersteNachricht(c) + 3);
  const karten = { id: k.id, i: k.slides.findIndex(s => !s.code && s.punkte && s.punkte.length >= 2) };
  karten.n = k.slides[karten.i].punkte.length;
  const tag = CH.find(c => c !== k && c.slides.some(s => /<button/.test(s.code || '')));
  const alt = CH.find(c => c !== k && c !== kChat && mitSpiel(c).length);
  const ms = mitSpiel(k);
  return {
    id: k.id, idx: CH.indexOf(k), title: k.title, xp: k.xp, story: k.story, stripped: k.story.map(z => stripHtml(z[1])), du: k.story.findIndex(z => z[0] === 'du'),
    ticket: k.ticket.titel, slides: k.slides.length, quiz: k.quiz.map(q => ({ correct: q.correct, falsch: q.correct === 0 ? 1 : 0, why: stripHtml(q.why) })), ex: !!k.ex, merke: k.merke.length,
    f1: ms[0], s1: spiel(k.slides[ms[0]]), f2: ms[1], s2: spiel(k.slides[ms[1]]), ohneCode: k.slides.findIndex(s => !s.code && s.punkte && s.punkte.length >= 2), pro: k.slides[ms[0]].pro, say: k.slides[ms[0]].say,
    naechstes: (CH[CH.indexOf(k) + 1] || {}).id, letztes: CH.filter(c => !c.eigen).pop().id,
    chat: { id: kChat.id, n: kChat.story.length, erste: ersteNachricht(kChat), name: CAST[kChat.story.find(z => CAST[z[0]] && z[0] !== 'erz')[0]].name },
    karten, tag: { id: tag.id, i: tag.slides.findIndex(s => /<button/.test(s.code || '')) }, alt: { id: alt.id, i: mitSpiel(alt)[0] }
  };
});

(async () => {
  /* ================= 1. Neuer Nutzer spielt ein Kapitel von vorn bis hinten ================= */
  const a = await oeffnen({ hash: 'start' });
  const { page } = a;
  const L = await lage(page);
  ok(L.id && L.chat.id && L.tag.id && L.alt.id && L.naechstes, 'Vorbedingung: Die Inhalte haben Kapitel für alle Fälle (' + L.id + ', ' + L.chat.id + ', ' + L.alt.id + ')');
  const schritte = 1 + L.slides + L.quiz.length + (L.ex ? 1 : 0) + 1;

  // ---- Rahmen
  await geh(page, L.id);
  ok((await page.getAttribute('.ort a', 'href')) === '#start' && /Schreibtisch/.test(await txt(page, '.ort a')), 'Rahmen: leiser Weg „← Schreibtisch“ führt nach #start');
  ok((await txt(page, '.ch-head h1')) === L.title, 'Rahmen: Kapitel-Titel steht oben');
  const weg = await page.locator('#kpWeg .kp-ph').allTextContents();
  ok(weg.map(w => w.replace(/\s*\d+\/\d+$/, '').trim()).join('·') === ['Ticket', 'Verstehen', 'Quiz'].concat(L.ex ? ['Umsetzen'] : [], ['Abschluss']).join('·'), 'Rahmen: eine Fortschrittsanzeige mit den Abschnitten (' + weg.join(' · ') + ')');
  ok((await page.locator('#kpWeg .kp-ph-b i').count()) === schritte, 'Rahmen: ein Strich je Schritt (' + schritte + ')');
  const zu = await page.locator('#kpWeg .kp-ph').evaluateAll(l => l.map(b => b.disabled));
  ok(zu.join() === zu.map((x, k) => k > 1).join(), 'Rahmen: Im frischen Kapitel sind nur „Ticket“ und der nächste Abschnitt anklickbar, der Rest ist deaktiviert');
  await page.locator('#kpWeg .kp-ph').last().click({ force: true }); await page.evaluate(() => document.querySelector('#kpWeg .kp-ph:last-child').click());
  ok((await st(page)).done[L.id] == null && (await st(page)).xp === 0 && (await sichtbar(page, '#stepBody .kp-chat')) && !(await page.locator('#stepBody .end').count()), 'Rahmen: Klick auf „Abschluss“ im frischen Kapitel ändert weder S.done noch S.xp');
  ok(!(await page.locator('#stepper, .stepper, .ch-prog, #chProg, .tagline').count()), 'Rahmen: kein zweiter Stepper, kein Balken, keine Unterzeile');
  ok((await page.locator('#prevStep').isDisabled()) && (await page.locator('#nextStep').count()) === 1 && !(await sichtbar(page, '#nextStep')), 'Rahmen: „Zurück“ ist am Anfang aus, „Weiter“ kommt erst nach der Szene');
  ok(/^Ticket · Schritt 1 von /.test(await txt(page, '#stepQuiet')) && (await page.$eval('#stepQuiet', e => { const c = getComputedStyle(e); return e.classList.contains('nur-sr') && c.position === 'absolute' && c.width === '1px' && c.height === '1px'; })), 'Rahmen: Schritt wird für Screenreader angesagt, unsichtbar über die gemeinsame Klasse nur-sr');
  ok(await page.evaluate(() => aktFolie === null), 'Rahmen: in der Szene ist keine Folie offen (aktFolie)');

  // ---- Szene spielt sich ab
  ok((await page.getAttribute('#stepBody .story', 'aria-live')) === 'polite', 'Szene: Chat sagt neue Nachrichten an (aria-live)');
  await page.waitForSelector('.kp-sag:visible');
  ok((await zeilen(page).count()) === L.du, 'Szene: Nachrichten kommen einzeln, vor der eigenen Zeile stehen ' + L.du + ' von ' + L.story.length);
  ok((await txt(page, '.kp-sag')) === L.stripped[L.du], 'Szene: Die eigene Zeile ist ein Antwort-Knopf mit genau diesem Text');
  ok(!(await sichtbar(page, '.ticket')) && !(await sichtbar(page, '#kpAnnehmen')) && !(await page.locator('#pretest').count()), 'Szene: Ticket und Vorab-Tipp kommen erst später');
  ok(!(await sichtbar(page, '#nextStep')) && (await sichtbar(page, '.kp-alles')), 'Szene: Beim Abspielen gibt es kein „Weiter“, dafür ist „Alles zeigen“ da');
  await page.keyboard.press('1');
  ok((await st(page)).pre[L.id] == null, 'Szene: Zifferntasten treffen keinen verdeckten Vorab-Tipp');
  await page.click('.kp-sag');
  ok((await zeilen(page).count()) === L.du + 1 && (await txt(page, '#stepBody .line.me p')) === L.stripped[L.du] && !(await sichtbar(page, '.kp-sag')), 'Szene: Erst der Klick „sagt“ die eigene Zeile');
  if (L.du + 1 < L.story.length && L.story[L.du + 1][0] !== 'erz') {
    ok(/schreibt/.test(await txt(page, '.kp-tippt')) && (await sichtbar(page, '.kp-tippt')), 'Szene: Vor der nächsten Nachricht steht kurz „… schreibt“');
  }
  await page.waitForSelector('#kpAnnehmen:visible', { timeout: 8000 });
  ok((await zeilen(page).count()) === L.story.length && (await txt(page, '#stepBody .ticket .tk-t')) === L.ticket, 'Szene: Danach kommt das Ticket ins Bild');
  ok((await txt(page, '#stepBody .line.me .who-n small')) === 'Frontend · Praktikant', 'Szene: Unter dem eigenen Namen stehen Abteilung und Rang wie auf dem Ausweis');
  const blass = await page.evaluate(() => {
    const hell = c => { const v = c.match(/[\d.]+/g).slice(0, 3).map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
    const d = document.createElement('div'), wer = Object.keys(CAST).filter(k => k !== 'erz');
    d.innerHTML = wer.map(kpAvatar).join(''); document.querySelector('#stepBody').append(d);
    const aus = wer.filter((k, n) => { const cs = getComputedStyle(d.children[n]), a = hell(cs.color), b = hell(cs.backgroundColor); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05) < 4.5; });
    d.remove(); return aus;
  });
  ok(!blass.length, 'Szene: Die Initiale ist auf jeder Figurenfarbe lesbar (Kontrast ab 4,5)' + (blass.length ? ': ' + blass.join(', ') : ''));
  ok((await txt(page, '#kpAnnehmen')) === 'Ticket annehmen' && (await page.locator('#main .btn.primary:visible').count()) === 1 && !(await sichtbar(page, '#nextStep')), 'Szene: „Ticket annehmen“ ist die eine Hauptaktion, kein „Weiter“ daneben');
  ok(!(await sichtbar(page, '.kp-alles')) && !(await sichtbar(page, '.kp-tippt')), 'Szene: „Alles zeigen“ und „schreibt“ sind dann weg');
  await page.click('#kpAnnehmen');
  ok(/Angenommen/.test(await txt(page, '.kp-stempel')) && !(await page.locator('#kpAnnehmen').count()), 'Szene: Annehmen wird bestätigt, der Knopf ist weg');
  ok((await sichtbar(page, '#pretest')) && (await sichtbar(page, '#nextStep.primary')) && (await st(page)).steps[L.id] === 0, 'Szene: Nach dem Annehmen kommt der Vorab-Tipp, „Weiter“ erscheint als Hauptknopf');
  await page.click('#pretest .opt[data-i="' + L.quiz[0].falsch + '"]');
  ok((await st(page)).pre[L.id] === L.quiz[0].falsch && (await st(page)).xp === 0, 'Szene: Der Tipp wird gemerkt und zählt nicht');
  await page.click('#nextStep');
  ok((await sichtbar(page, '#stepBody .slide')) && (await st(page)).steps[L.id] === 1, 'Szene: „Weiter“ führt zur ersten Folie');
  ok((await page.locator('#kpWeg .kp-ph:disabled').count()) === (L.ex ? 2 : 1) && !(await page.locator('#kpWeg .kp-ph >> nth=2').isDisabled()), 'Rahmen: Mit jedem erreichten Abschnitt wird der nächste anklickbar');
  ok(await page.evaluate(id => aktFolie && aktFolie.ch.id === id && aktFolie.s === aktFolie.ch.slides[0], L.id), 'Folie: aktFolie zeigt auf Kapitel und Folie');
  await page.click('#prevStep');
  ok((await zeilen(page).count()) === L.story.length && (await sichtbar(page, '.ticket')) && !(await page.locator('#kpAnnehmen, .kp-sag, .kp-alles').count()) && (await sichtbar(page, '#nextStep.primary')), 'Szene: Zurück im angefangenen Kapitel steht sie sofort komplett da, ohne Annehmen, „Weiter“ ist von Anfang an da');
  ok((await page.locator('#pretest .opt:disabled').count()) === 4, 'Szene: Der abgegebene Tipp bleibt stehen');

  // ---- Doku-Links aus den Inhalten: jedes Kapitel 1 bis 3, nur https. Danach ohne sie weiter, die Fälle unten setzen eigene Testwerte.
  const dk = await page.evaluate(() => ({
    kapitel: CH.filter(c => !c.eigen && !(Array.isArray(c.doku) && c.doku.length >= 1 && c.doku.length <= 3 && c.doku.every(d => Array.isArray(d) && d[0] && /^https:\/\//.test(d[1])))).map(c => c.id),
    lex: LEX.filter(e => e.doku != null && !/^https:\/\//.test(e.doku)).length
  }));
  ok(!dk.kapitel.length && !dk.lex, 'Inhalte: Jedes Kapitel hat 1 bis 3 Doku-Links, alle Links (auch im Lexikon) sind https' + (dk.kapitel.length ? ': ' + dk.kapitel.join(', ') : ''));
  /* Jeder Link steht je Kapitel genau zweimal: offen auf der letzten Folie und am Abschluss. Nie unter „Mehr dazu“, nie auf anderen Folien. */
  const dl = await page.evaluate(() => {
    const falsch = [], body = document.createElement('div'), sollLinks = c => c.doku.map(d => d[1]).join(' ');
    const links = () => [...body.querySelectorAll('a.kp-doku')];
    CH.filter(c => !c.eigen).forEach(c => {
      c.slides.forEach((s, i) => {
        renderSlide(body, s, c);
        const letzte = i === c.slides.length - 1, l = links(), mehr = body.querySelector('.kp-mehr');
        if (l.map(a => a.getAttribute('href')).join(' ') !== (letzte ? sollLinks(c) : '')) falsch.push(c.id + ' Folie ' + (i + 1) + ': Links');
        if (body.querySelector('.kp-mehr a') || !!mehr !== !!s.pro || (mehr && mehr.querySelector('p').textContent !== s.pro)) falsch.push(c.id + ' Folie ' + (i + 1) + ': Mehr dazu');
        if (letzte && !(body.querySelector('.kp-doku-t') && body.querySelector('.kp-doku-t').textContent === 'Offizielle Doku' && !l.some(a => a.closest('details')) && l.every(a => a.target === '_blank' && a.rel === 'noopener'))) falsch.push(c.id + ': Zeile „Offizielle Doku“');
      });
      const war = { done: S.done[c.id], srs: JSON.stringify(S.srs) };
      S.done[c.id] = 1; renderEnd(body, c);
      if (links().map(a => a.getAttribute('href')).join(' ') !== sollLinks(c) || !links().every(a => a.target === '_blank' && a.rel === 'noopener' && !a.closest('details'))) falsch.push(c.id + ': Abschluss');
      if (war.done) S.done[c.id] = war.done; else delete S.done[c.id];
      S.srs = JSON.parse(war.srs);
    });
    return falsch;
  });
  ok(!dl.length, 'Doku-Links: je Kapitel genau zweimal (letzte Folie als offene Zeile „Offizielle Doku“, Abschluss), neuer Tab mit noopener, „Mehr dazu“ nur mit Profi-Wissen' + (dl.length ? ': ' + dl.slice(0, 5).join(' | ') : ''));
  await page.evaluate(() => { CH.forEach(c => { delete c.doku; }); LEX.forEach(e => { delete e.doku; }); HTML_EL.forEach(e => { delete e.doku; }); });
  // ---- Folie: nur das Nötige
  await geh(page, L.id, { t: 'slide', i: L.f1 });
  ok((await page.locator('#stepBody .sl-title').count()) === 1 && (await page.locator('#stepBody .say').count()) === 1 && (await txt(page, '#stepBody .say')) === L.say, 'Folie: Titel und genau ein Kernsatz');
  ok((await page.locator('#stepBody form').count()) === 1 && (await page.locator('#stepBody form.kp-se').count()) === 1 && !(await page.locator('.gen-bar, #genIn').count()), 'Folie: genau ein Formular, „Erklär die Zeilen selbst“');
  ok(!(await page.locator('#again, #ask, #askBox, #aiOut, #fdHost, .fd, #stepBody .ai-box:not(#kpSeOut), .lexbtn, .lexpanel, .htmlside, .lc-deep, .el-deep').count()), 'Folie: keine KI-Knöpfe, kein „Für dich erklärt“, keine Begriffsliste, kein Seitenkasten');
  ok((await page.locator('#stepBody .slide button:not(.kp-se button)').count()) === 0, 'Folie: außer den Knöpfen zum Selbsterklären kein Knopf');
  ok(new RegExp('^Verstehen ' + (L.f1 + 1) + '/' + L.slides).test((await txt(page, '#kpWeg .kp-ph.an')).trim()), 'Rahmen: Der Abschnitt zeigt, die wievielte Folie es ist');
  ok((await page.locator('.kp-mehr').count()) === 1 && !(await page.locator('.kp-mehr[open]').count()) && (await txt(page, '.kp-mehr summary')) === 'Mehr dazu', 'Folie: „Mehr dazu“ ist eingeklappt');
  await page.click('.kp-mehr summary');
  ok((await sichtbar(page, '.kp-mehr p')) && (await txt(page, '.kp-mehr p')) === L.pro && !(await page.locator('.kp-mehr a').count()), 'Folie: „Mehr dazu“ zeigt das Profi-Wissen, ohne doku keine Links');

  // ---- Erklär die Zeilen selbst: Code ganz sichtbar, ein Feld je Nummer, dann die Lösung mit den eigenen Worten
  const sp = L.s1, key1 = L.id + ':' + L.f1, xpVor = (await st(page)).xp;
  ok(/Erklär die Zeilen selbst/.test(await txt(page, '.kp-se')) && (await page.locator('.kp-se-in').count()) === sp.n, 'Selbsterklären: Aufgabe und ein Feld je Nummer (' + sp.n + ') unter dem Code');
  ok((await offen(page)) === 0 && (await nummerDa(page, sp.wo[0])) && (await page.locator('#stepBody .acode .lx').count()) > 0, 'Selbsterklären: Erklärungen verdeckt, Nummern und unterstrichene Wörter im Code sichtbar');
  ok((await page.locator('#kpSeGo.primary').count()) === 1 && !(await page.locator('#kpSeToni').count()), 'Selbsterklären: Ohne KI-Schlüssel ein Knopf „Mit der Lösung vergleichen“');
  await page.click('#kpSeGo');
  ok(/Schreib erst/.test(await txt(page, '.kp-se-r')) && (await offen(page)) === 0 && !((await st(page)).gen || {})[key1], 'Selbsterklären: Leer abschicken geht nicht, nichts gemerkt');
  await page.fill('#kpSe0', 'gibt die Funktion nach außen frei');
  await page.click('#kpSeGo');
  ok(/Nummer 2 fehlt/.test(await txt(page, '.kp-se-r')) && await page.evaluate(() => document.activeElement.id === 'kpSe1'), 'Selbsterklären: Fehlt eine Nummer, sagt es welche, und der Fokus springt hin');
  ok(await cl(page, sp.wo[1]).evaluate(el => el.classList.contains('lit')), 'Selbsterklären: Das Feld im Fokus lässt seine Codezeile aufleuchten');
  const schrittVor = (await st(page)).steps[L.id];
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('1');
  ok((await st(page)).steps[L.id] === schrittVor && (await page.inputValue('#kpSe1')) === '1', 'Selbsterklären: Pfeil und Zahlen tippen ins Feld, statt zu blättern');
  await page.fill('#kpSe1', 'eine Zahl kommt rein');
  await page.keyboard.press('Enter');
  ok(await page.evaluate(() => document.activeElement.id === 'kpSe2') && (await page.inputValue('#kpSe1')) === 'eine Zahl kommt rein', 'Selbsterklären: Enter springt ins nächste Feld');
  for (let k = 2; k < sp.n; k++) await page.fill('#kpSe' + k, 'Idee ' + (k + 1));
  await page.focus('#kpSe' + (sp.n - 1)); await page.keyboard.press('Enter');
  ok((await offen(page)) === sp.n && !(await page.locator('.kp-se-in').count()), 'Selbsterklären: Enter im letzten Feld zeigt die Lösung, die Felder verschwinden');
  ok((await page.locator('#stepBody .notes .kp-du').count()) === sp.n && /^Du: gibt die Funktion/.test(await txt(page, '#stepBody .notes .kp-du')), 'Selbsterklären: Unter jeder Erklärung stehen die eigenen Worte');
  let g1 = (await st(page)).gen[key1];
  ok(g1 && g1.du.length === sp.n && g1.du[1] === 'eine Zahl kommt rein' && g1.toni === null && (await st(page)).xp === xpVor, 'Selbsterklären: Eigene Worte im Spielstand (S.gen), keine XP, ohne KI kein Urteil');
  ok(((await st(page)).profil.erkl || []).some(e => e.art === 'selbsterklaert' && e.ch === L.id), 'Selbsterklären: Die eigenen Worte gehen ins Lernprofil');
  ok(await page.evaluate(() => document.activeElement.id === 'nextStep'), 'Selbsterklären: Danach liegt der Fokus auf „Weiter“');

  // ---- Wort-Karte: eine kleine Karte, Was / Woher / Warum, Doku-Link wenn vorhanden
  await page.locator('#stepBody .acode .lx').first().click();
  ok((await sichtbar(page, '.lexpop')) && (await page.locator('.lexpop dt').allTextContents()).join('') === 'Was?Woher?Warum?', 'Wort-Karte: Klick auf ein unterstrichenes Wort öffnet Was / Woher / Warum');
  ok((await page.locator('.lexpop button').count()) === 1 && !(await page.locator('.lexpop a').count()), 'Wort-Karte: keine KI-Knöpfe, ohne doku kein Link');
  await page.keyboard.press('Escape');
  ok(!(await sichtbar(page, '.lexpop')), 'Wort-Karte: Escape schließt sie');
  await page.evaluate(() => { LEX[+document.querySelector('#stepBody .acode .lx').dataset.lx].doku = 'https://angular.dev/guide/signals'; });
  await page.locator('#stepBody .acode .lx[tabindex="0"]').focus();
  await page.keyboard.press('Enter');
  const lk = page.locator('.lexpop a.kp-doku');
  ok((await lk.count()) === 1 && /^Offizielle Doku/.test(await lk.textContent()) && (await lk.getAttribute('href')) === 'https://angular.dev/guide/signals' && (await lk.getAttribute('target')) === '_blank' && (await lk.getAttribute('rel')) === 'noopener', 'Wort-Karte: Link „Offizielle Doku“ öffnet in neuem Tab');
  ok(await page.evaluate(() => document.querySelector('.lexpop').contains(document.activeElement)), 'Wort-Karte: Per Tastatur geöffnet liegt der Fokus in der Karte');
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => document.activeElement.classList.contains('lx')), 'Wort-Karte: Escape gibt den Fokus an das Wort zurück');
  await page.locator('#stepBody .acode .lx').first().click();
  await page.keyboard.press('ArrowRight');
  ok(!(await sichtbar(page, '.lexpop')) && (await page.evaluate(() => [...document.querySelectorAll('#stepBody .acode .lx')].indexOf(document.activeElement))) === 1 && (await sichtbar(page, '#stepBody .slide')), 'Wort-Karte: Pfeiltaste wandert zum nächsten Wort und schließt die Karte');
  await page.locator('#stepBody .acode .lx').first().click();
  await page.click('#nextStep');
  ok(!(await sichtbar(page, '.lexpop')), 'Wort-Karte: Beim Weiterblättern schließt sie');
  await page.click('#prevStep');
  await page.evaluate(() => LEX.forEach(e => { delete e.doku; }));

  // ---- Zweiter Besuch ohne Formular, „Weiter“ geht immer, Überspringen
  await page.click('#nextStep'); await page.click('#prevStep');
  ok(!(await page.locator('.kp-se').count()) && (await offen(page)) === sp.n && (await page.locator('#stepBody .kp-du').count()) === sp.n, 'Selbsterklären: Beim zweiten Besuch stehen die Erklärungen sofort da, mit den eigenen Worten');
  await geh(page, L.id, { t: 'slide', i: L.f2 });
  ok((await sichtbar(page, '.kp-se')) && (await offen(page)) === 0, 'Selbsterklären: Die nächste Folie mit Code hat ihr eigenes Formular');
  const hier = (await st(page)).steps[L.id];
  await page.click('#nextStep');
  ok((await st(page)).steps[L.id] === hier + 1 && !(await st(page)).gen[L.id + ':' + L.f2], 'Selbsterklären: Kein Zwang, „Weiter“ geht auch ohne');
  await page.click('#prevStep');
  ok(!(await page.locator('.kp-se').count()) && (await offen(page)) === L.s2.n && !(await st(page)).gen[L.id + ':' + L.f2], 'Selbsterklären: Wer schon weitergeblättert hat, sieht beim Zurückkommen die Erklärungen');
  /* Stand zurück auf diese Folie: Hier war man noch nicht vorbei, das Erklären wartet */
  await page.evaluate(([id, n]) => { S.steps[id] = n; route(); }, [L.id, hier]);
  ok(await sichtbar(page, '#kpSeX'), 'Selbsterklären: Auf der Folie, bis zu der man gekommen ist, wartet es noch');
  await page.click('#kpSeX');
  ok(!(await page.locator('.kp-se-in').count()) && (await offen(page)) === L.s2.n && (await nummerDa(page, L.s2.wo[0])) && !(await page.locator('#stepBody .kp-du').count()), '„Erklärungen gleich zeigen“ überspringt das Erklären');
  ok(!!(await st(page)).gen[L.id + ':' + L.f2], 'Selbsterklären: Auch das Überspringen wird gemerkt');
  /* Neuer Start mit dem gespeicherten Stand (ein echtes Neuladen verliert unter file:// im Test-Browser manchmal den localStorage) */
  const gespeichert = JSON.parse(await page.evaluate(() => localStorage.getItem('ngfc.v1')));
  ok(gespeichert.gen[key1].du.length === sp.n, 'Selbsterklären: Die eigenen Worte liegen im gespeicherten Spielstand');
  const neu = await oeffnen({ stand: gespeichert, hash: L.id });
  await geh(neu.page, L.id, { t: 'slide', i: L.f1 });
  ok(!(await neu.page.locator('.kp-se').count()) && (await offen(neu.page)) === sp.n && (await neu.page.locator('#stepBody .kp-du').count()) === sp.n && !neu.fehler.length, 'Selbsterklären: Nach einem neuen Start mit diesem Spielstand die Lösung samt eigenen Worten');
  await geh(neu.page, L.id, { t: 'story' });
  ok((await zeilen(neu.page).count()) === L.story.length && !(await neu.page.locator('#kpAnnehmen').count()), 'Szene: Nach einem neuen Start ist sie im angefangenen Kapitel komplett');
  await neu.browser.close();
  await geh(page, L.id, { t: 'slide', i: L.ohneCode });
  ok(!(await page.locator('#stepBody .anno').count()) && (await sichtbar(page, '#stepBody .say')), 'Folie ohne Code: kein leerer Code-Kasten');
  // ---- Folie mit Karten: erst selbst überlegen, dann aufdecken (Stand auf genau diese Folie, wie beim ersten Besuch)
  const vorKarten = (await st(page)).steps[L.id];
  await page.evaluate(x => { S.steps[x.id] = x.i + 1; route(); }, L.karten);
  ok((await sichtbar(page, '.kp-se-karten')) && /Erst selbst überlegen/.test(await txt(page, '.kp-se')) && (await page.locator('.kp-se-in').count()) === L.karten.n && !(await sichtbar(page, '#stepBody .punkte')), 'Karten-Folie: Nur die Begriffe stehen da, je ein Feld, die Karten sind verdeckt');
  ok((await page.locator('.kp-se-l label b').allTextContents()).join('|') === await page.evaluate(x => CH.find(c => c.id === x.id).slides[x.i].punkte.map(p => p[0]).join('|'), L.karten), 'Karten-Folie: Die Felder tragen die Begriffe der Karten');
  await page.click('#kpSeGo');
  ok(/geraten zählt auch/.test(await txt(page, '.kp-se-r')) && !(await sichtbar(page, '#stepBody .punkte')), 'Karten-Folie: Leer auflösen geht nicht');
  for (let k = 0; k < L.karten.n; k++) await page.fill('#kpSe' + k, 'Vermutung ' + (k + 1));
  await page.click('#kpSeGo');
  ok((await sichtbar(page, '#stepBody .punkte')) && (await page.locator('#stepBody .pk .kp-du').count()) === L.karten.n && !(await page.locator('.kp-se-in').count()), 'Karten-Folie: Auflösen zeigt die Karten, in jeder steht die eigene Vermutung');
  ok((await st(page)).gen[L.karten.id + ':' + L.karten.i].du[0] === 'Vermutung 1', 'Karten-Folie: Die Vermutungen sind gemerkt');
  await page.evaluate(([id, n]) => { S.steps[id] = n; save(); }, [L.id, vorKarten]);

  // ---- Doku-Links auf der letzten Folie: nur https, neuer Tab. „Mehr dazu“ zeigt nur das Profi-Wissen der Folie.
  await page.evaluate(id => { CH.find(c => c.id === id).doku = [['Signals im Überblick', 'https://angular.dev/guide/signals'], ['Unsicher', 'javascript:alert(1)'], ['RxJS', 'https://rxjs.dev/guide/overview'], 'kaputt']; }, L.id);
  await geh(page, L.id, { t: 'slide', i: L.slides - 1 });
  const links = await page.locator('#stepBody .slide > .kp-doku-l a').evaluateAll(l => l.map(x => [x.firstChild.textContent, x.getAttribute('href'), x.target, x.rel]));
  ok(JSON.stringify(links) === JSON.stringify([['Signals im Überblick', 'https://angular.dev/guide/signals', '_blank', 'noopener'], ['RxJS', 'https://rxjs.dev/guide/overview', '_blank', 'noopener']]) && (await page.locator('#stepBody a.kp-doku:visible').count()) === 2 && (await txt(page, '#stepBody .slide > .kp-doku-t')) === 'Offizielle Doku', 'Letzte Folie zeigt die Doku-Links des Kapitels offen unter „Offizielle Doku“ (nur https, neuer Tab)');
  await geh(page, L.id, { t: 'slide', i: L.f1 });
  await page.click('.kp-mehr summary');
  ok((await txt(page, '.kp-mehr p')) === L.pro && !(await page.locator('#stepBody a.kp-doku').count()), '„Mehr dazu“ zeigt das Profi-Wissen der Folie, keine Doku-Links');
  const ohnePro = await page.evaluate(([id, i]) => { const c = CH.find(c => c.id === id), s = c.slides[i], pro = s.pro; delete s.pro; window.sprungZu = { id, t: 'slide', i }; route(); const n = document.querySelectorAll('#stepBody .slide').length === 1 ? document.querySelectorAll('.kp-mehr').length : -1; s.pro = pro; return n; }, [L.id, L.f1]);
  ok(ohnePro === 0, 'Ohne Profi-Wissen entfällt „Mehr dazu“, auch wenn das Kapitel Doku-Links hat');

  // ---- Quiz: sofortige Auflösung, keine Sicherheitsfrage
  await geh(page, L.id, { t: 'quiz', i: 0 });
  ok(await page.evaluate(() => aktFolie === null), 'Quiz: aktFolie ist wieder leer');
  ok((await page.locator('#stepBody .opt').count()) === 4 && !(await page.locator('.conf, .cf, .conf-slot').count()), 'Quiz: vier Antworten, keine Sicherheitsfrage');
  ok((await sichtbar(page, '#nextStep')) && !(await page.locator('#main .btn.primary').count()), 'Quiz: Solange die Frage offen ist, ist „Weiter“ ein normaler Knopf');
  const frage0 = await txt(page, '#stepBody .q');
  await page.click('#nextStep');
  ok((await sichtbar(page, '#stepBody .quiz')) && (await txt(page, '#stepBody .q')) !== frage0 && (await st(page)).quiz[L.id + ':0'] == null, 'Quiz: Überspringen geht, auch wenn „Weiter“ leise ist');
  await page.click('#prevStep');
  ok((await txt(page, '#stepBody .q')) === frage0 && !(await page.locator('#stepBody .opt:disabled').count()) && !(await page.locator('#nextStep.primary').count()), 'Quiz: Die übersprungene Frage ist beim Zurückkommen noch offen');
  const calVor = JSON.stringify((await st(page)).cal), xp0 = (await st(page)).xp;
  await page.click('#stepBody .opt[data-i="' + L.quiz[0].falsch + '"]');
  ok((await page.locator('#stepBody .opt.wrong:disabled').count()) === 1 && !(await page.locator('.conf, .cf').count()) && /Nicht ganz/.test(await txt(page, '.why')), 'Quiz: Falsche Antwort wird sofort rot, ohne Zwischenfrage');
  ok((await st(page)).quiz[L.id + ':0'] == null && !(await page.locator('#stepBody .opt.right').count()) && !(await page.locator('#nextStep.primary').count()), 'Quiz: Die Lösung wird dabei nicht verraten, „Weiter“ bleibt leise');
  await page.click('#stepBody .opt[data-i="' + L.quiz[0].correct + '"]');
  let s = await st(page);
  ok((await page.locator('#stepBody .opt.right').count()) === 1 && (await page.locator('#stepBody .opt:disabled').count()) === 4 && (await txt(page, '.why')).includes(L.quiz[0].why), 'Quiz: Richtige Antwort wird grün, die Begründung erscheint');
  ok(s.quiz[L.id + ':0'] === 2 && s.xp === xp0, 'Quiz: Im zweiten Anlauf richtig: gemerkt mit 2 Versuchen, kein XP');
  ok((await page.locator('#main .btn.primary').count()) === 1 && (await sichtbar(page, '#nextStep.primary')), 'Quiz: Nach der richtigen Antwort wird „Weiter“ Hauptknopf');
  ok(/Du hattest .+ getippt/.test(await txt(page, '.why .pre-note')), 'Quiz: Die erste Frage löst den Vorab-Tipp auf');
  ok((await page.getAttribute('.why', 'aria-live')) === 'polite', 'Quiz: Auflösung wird angesagt (aria-live)');
  await page.click('#nextStep');
  /* Die Zifferntaste meint die Stelle am Bildschirm, nicht den Index aus den Daten */
  await page.keyboard.press((await txt(page, '#stepBody .opt[data-i="' + L.quiz[1].correct + '"] .key')).trim());
  s = await st(page);
  ok(s.quiz[L.id + ':1'] === 1 && s.xp === xp0 + 10 && (await page.locator('#stepBody .opt.right').count()) === 1, 'Quiz: Sofort richtig (per Zifferntaste) gibt 10 XP');
  ok(JSON.stringify(s.cal) === calVor, 'Quiz: Die Sicherheits-Statistik bleibt dem Wiederholen überlassen');
  await page.click('#prevStep');
  ok((await page.locator('#stepBody .opt.right').count()) === 1 && (await page.locator('#stepBody .opt:disabled').count()) === 4 && (await sichtbar(page, '#nextStep.primary')), 'Quiz: Eine beantwortete Frage ist beim Zurückblättern aufgelöst, „Weiter“ ist Hauptknopf');

  /* ================= Quiz mischen: Die Antworten stehen bei jedem Zeichnen in neuer Reihenfolge ================= */
  const e = await oeffnen({ hash: 'start' });
  const m = e.page;
  /* Was gerade zu sehen ist: Index aus den Daten, Tasten-Zahl und Stelle am Bildschirm je Antwort, in der Reihenfolge im Dokument */
  const bild = sel => m.locator(sel + ' .opt').evaluateAll(l => l.map(b => { const r = b.getBoundingClientRect(); return { i: +b.dataset.i, key: b.querySelector('.key').textContent, y: Math.round(r.top), x: Math.round(r.left), right: b.classList.contains('right'), picked: b.classList.contains('picked'), aus: b.disabled }; }));
  const inOrdnung = (b, n) => b.length === n && b.map(o => o.i).sort().join() === [...Array(n).keys()].join() && b.map(o => o.key).join() === b.map((o, k) => k + 1).join() && b.every((o, k) => !k || o.y > b[k - 1].y || (o.y === b[k - 1].y && o.x > b[k - 1].x));
  const mk = await m.evaluate(() => CH.filter(c => !c.eigen && c.quiz.length).slice(0, 8).map(c => ({ id: c.id, n: c.quiz[0].options.length, correct: c.quiz[0].correct })));
  const stellen = new Set(), folgen = new Set(); let sauber = true;
  for (const k of mk) for (let n = 0; n < 4; n++) {
    await geh(m, k.id, { t: 'quiz', i: 0 });
    const b = await bild('#stepBody');
    if (!inOrdnung(b, k.n) || b.some(o => o.right || o.aus)) sauber = false;
    stellen.add(b.findIndex(o => o.i === k.correct)); folgen.add(k.id + ':' + b.map(o => o.i).join(''));
  }
  ok(sauber, 'Quiz mischen: Jede Antwort ist genau einmal da, die Tasten-Zahlen sind 1 bis n in der Reihenfolge am Bildschirm');
  ok(stellen.size > 1 && folgen.size > mk.length, 'Quiz mischen: Die richtige Antwort steht nicht immer an derselben Stelle (Stellen: ' + [...stellen].sort().join(', ') + ')');
  /* Klick über den Index aus den Daten: Es zählt die Antwort, nicht die Stelle */
  const k0 = mk[0], falsch0 = k0.correct === 0 ? 1 : 0;
  await geh(m, k0.id, { t: 'quiz', i: 0 });
  await m.click('#stepBody .opt[data-i="' + falsch0 + '"]');
  ok((await m.locator('#stepBody .opt.wrong').count()) === 1 && (await m.locator('#stepBody .opt.wrong[data-i="' + falsch0 + '"]').count()) === 1 && !(await m.locator('#stepBody .opt.right').count()), 'Quiz mischen: Eine falsche Antwort bleibt falsch, egal wo sie steht');
  await m.click('#stepBody .opt[data-i="' + k0.correct + '"]');
  let mb = await bild('#stepBody');
  ok((await st(m)).quiz[k0.id + ':0'] === 2 && mb.filter(o => o.right).length === 1 && mb.find(o => o.right).i === k0.correct, 'Quiz mischen: Ein Klick auf die richtige Antwort gilt, die Auflösung markiert genau sie');
  /* Zifferntaste: gemeint ist die Stelle am Bildschirm. Jede Taste trifft die Antwort, die dort steht. */
  let tasteOk = true;
  for (const k of mk.slice(1, 6)) {
    await geh(m, k.id, { t: 'quiz', i: 0 });
    mb = await bild('#stepBody');
    const stelle = mb.findIndex(o => o.i === k.correct);
    await m.keyboard.press(String(stelle + 1));
    mb = await bild('#stepBody');
    if (!((await st(m)).quiz[k.id + ':0'] === 1 && mb.filter(o => o.right).length === 1 && mb.find(o => o.right).i === k.correct && mb.every(o => o.aus))) tasteOk = false;
  }
  ok(tasteOk, 'Quiz mischen: Die Zifferntaste wählt die Antwort an der sichtbaren Stelle');
  /* Schon beantwortet: Bei jedem Zeichnen ist genau die richtige Antwort markiert, auch wenn sie woanders steht */
  let geloest = true; const stellen2 = new Set();
  for (let n = 0; n < 8; n++) {
    await geh(m, mk[1].id, { t: 'quiz', i: 0 });
    mb = await bild('#stepBody');
    if (!(inOrdnung(mb, mk[1].n) && mb.filter(o => o.right).length === 1 && mb.find(o => o.right).i === mk[1].correct && mb.every(o => o.aus))) geloest = false;
    stellen2.add(mb.findIndex(o => o.right));
  }
  ok(geloest && stellen2.size > 1, 'Quiz mischen: Die beantwortete Frage zeigt beim erneuten Öffnen immer die richtige Antwort');
  /* Vorab-Tipp: gemischt, gemerkt wird der Index aus den Daten, die Auflösung im Quiz nennt den getippten Text */
  const kt = mk[6], tipp = (kt.correct + 1) % kt.n;
  await m.evaluate(id => { S.steps[id] = 1; delete S.pre[id]; }, kt.id);
  const tStellen = new Set(); let tSauber = true;
  for (let n = 0; n < 8; n++) {
    await geh(m, kt.id, { t: 'story' });
    mb = await bild('#pretest');
    if (!inOrdnung(mb, kt.n) || mb.some(o => o.aus || o.picked)) tSauber = false;
    tStellen.add(mb.map(o => o.i).join(''));
  }
  ok(tSauber && tStellen.size > 1, 'Vorab-Tipp mischen: Die Antworten stehen bei jedem Zeichnen neu, Tasten-Zahlen 1 bis n');
  const tippText = await m.evaluate(([id, j]) => stripHtml(CH.find(c => c.id === id).quiz[0].options[j]), [kt.id, tipp]);
  await m.keyboard.press((await txt(m, '#pretest .opt[data-i="' + tipp + '"] .key')).trim());
  ok((await st(m)).pre[kt.id] === tipp, 'Vorab-Tipp mischen: Die Zifferntaste merkt die Antwort an der sichtbaren Stelle (Index aus den Daten)');
  await geh(m, kt.id, { t: 'story' });
  mb = await bild('#pretest');
  ok(inOrdnung(mb, kt.n) && mb.every(o => o.aus) && mb.filter(o => o.picked).length === 1 && mb.find(o => o.picked).i === tipp, 'Vorab-Tipp mischen: Der abgegebene Tipp bleibt an seiner Antwort markiert');
  await geh(m, kt.id, { t: 'quiz', i: 0 });
  await m.click('#stepBody .opt[data-i="' + kt.correct + '"]');
  ok((await txt(m, '.why .pre-note b')) === tippText && /Jetzt weißt du es genauer/.test(await txt(m, '.why .pre-note')), 'Vorab-Tipp mischen: Die Auflösung nennt die getippte Antwort');
  ok(!e.fehler.length, 'Quiz mischen: keine JavaScript-Fehler' + (e.fehler.length ? ': ' + e.fehler.join(' | ') : ''));
  await e.browser.close();

  // ---- Abschluss
  await page.evaluate(id => { CH.find(c => c.id === id).doku = [['Signals im Überblick', 'https://angular.dev/guide/signals']]; }, L.id);
  /* Geschafft zählt nur mit grüner Übung (offen.test.js prüft das Durchblättern). Hier gilt sie als gelöst. */
  if (L.ex) await page.evaluate(id => { const c = CH.find(x => x.id === id); S.ex[c.ex.id] = { passed: true, fails: 0 }; save(); }, L.id);
  const xp1 = (await st(page)).xp;
  await geh(page, L.id, { t: 'end' });
  s = await st(page);
  ok(s.done[L.id] > 0 && s.xp === xp1 + L.xp, 'Abschluss: Kapitel gilt als geschafft, XP dafür (' + L.xp + ')');
  ok(L.quiz.every((q, i) => s.srs['q:' + L.id + ':' + i]) && s.srs['m:' + L.id] && s.srs['q:' + L.id + ':0'].due > Date.now(), 'Abschluss: Alle Quizfragen (auch die falsch beantwortete) und die Merksätze gehen in die Wiederholung');
  ok((await sichtbar(page, '#dumpIn')) && /Was nimmst du mit\?/.test(await txt(page, '#dump')) && (await sichtbar(page, '#dumpSkip')), 'Abschluss: erst „Was nimmst du mit?“, überspringbar');
  ok(/Kapitel geschafft/.test(await txt(page, '#jubelKarte')) && !/geschafft/i.test(await txt(page, '#stepBody')) && (await txt(page, '#toast')).trim() === '+' + L.xp + ' XP' && (await page.locator('#stepBody .end > :first-child').getAttribute('id')) === 'dump',
    'Abschluss: „Kapitel geschafft“ steht einmal da (Jubel-Karte). Keine Überschrift, die Meldung nennt nur die XP');
  ok(!(await sichtbar(page, '#nextStep')) && !(await page.locator('#stepBody .end li, #kpNaechstes').count()), 'Abschluss: Merksätze und Knöpfe kommen erst danach, kein zweites „Weiter“');
  ok(!(await page.locator('#reflect, .reflect, .rf, #pauseBtn, #closeOut, #nextCh').count()), 'Abschluss: kein „Kurz innehalten“, kein „Für heute fertig“');
  await page.fill('#dumpIn', 'Signal <b>merken</b>');
  await page.click('#dumpGo');
  ok((await txt(page, '.mine')) === 'Signal <b>merken</b>' && !(await page.locator('#dump').count()), 'Abschluss: Die eigenen Stichworte stehen zum Vergleich da (als Text)');
  ok((await page.locator('#stepBody .end ul:not(.kp-doku-l) > li').count()) === L.merke, 'Abschluss: Merksätze (' + L.merke + ')');
  ok((await page.locator('#stepBody .end a.kp-doku').count()) === 1 && (await page.getAttribute('#stepBody .end a.kp-doku', 'target')) === '_blank', 'Abschluss: Doku-Links des Kapitels');
  ok((await page.getAttribute('#kpNaechstes', 'href')) === '#' + L.naechstes && (await txt(page, '#kpNaechstes')) === 'Nächstes Kapitel' && (await page.locator('#stepBody .btn.primary').count()) === 1, 'Abschluss: „Nächstes Kapitel“ ist der Hauptknopf');
  ok((await page.getAttribute('#kpHeim', 'href')) === '#start' && (await txt(page, '#kpHeim')) === 'Zum Schreibtisch', 'Abschluss: „Zum Schreibtisch“ daneben');
  ok(Object.keys((await st(page)).reflect || {}).length === 0, 'Abschluss: S.reflect bleibt unangetastet');
  await page.click('#prevStep'); await page.click('#nextStep');
  ok((await txt(page, '.kp-ende-t')) === '✓ Geschafft' && (await hoch(page, '.kp-ende-t')) < 30 && !(await page.locator('#dumpIn').count()) && (await page.locator('#stepBody .end ul:not(.kp-doku-l) > li').count()) === L.merke && (await st(page)).xp === xp1 + L.xp, 'Abschluss: Beim zweiten Mal direkt die Merksätze, kein zweites XP');
  await page.evaluate(id => { delete CH.find(c => c.id === id).doku; }, L.id);

  // ---- Geschafftes Kapitel: Szene komplett, kein Selbsterklären
  await geh(page, L.id, { t: 'story' });
  ok((await zeilen(page).count()) === L.story.length && (await sichtbar(page, '.ticket')) && !(await page.locator('#kpAnnehmen, .kp-sag, .kp-alles, .kp-spielt').count()) && (await sichtbar(page, '#nextStep.primary')), 'Geschafftes Kapitel: Szene steht sofort komplett da, mit „Weiter“');
  await page.evaluate(([id, i]) => { delete S.gen[id + ':' + i]; save(); }, [L.id, L.f1]);
  await geh(page, L.id, { t: 'slide', i: L.f1 });
  ok(!(await page.locator('.kp-se').count()) && (await offen(page)) === sp.n, 'Geschafftes Kapitel: Folien zeigen die Erklärungen ohne Selbsterklären');
  ok((await page.locator('#kpWeg .kp-ph-b i.voll').count()) === schritte - 1, 'Rahmen: Im geschafften Kapitel sind alle Schritte gefüllt');
  ok(!(await page.locator('#kpWeg .kp-ph:disabled').count()), 'Rahmen: Im geschafften Kapitel ist jeder Abschnitt anklickbar');
  await page.click('#kpWeg .kp-ph >> nth=2');
  ok((await sichtbar(page, '#stepBody .quiz')) && /^Quiz/.test((await txt(page, '#kpWeg .kp-ph.an')).trim()), 'Rahmen: Klick auf einen Abschnitt springt dorthin');
  await page.evaluate(() => { location.hash = 'start'; });
  await page.waitForFunction(() => !document.querySelector('#stepBody'));
  ok(await page.evaluate(() => aktFolie === null), 'Rahmen: Nach dem Verlassen des Kapitels ist aktFolie leer');

  // ---- „Nächstes Kapitel“ führt in die nächste Szene
  await geh(page, L.id, { t: 'end' });
  await page.click('#kpNaechstes');
  await page.waitForFunction(id => location.hash === '#' + id && document.querySelector('#stepBody .kp-chat'), L.naechstes);
  ok(await page.evaluate(id => S.done[id] ? true : !!document.querySelector('#stepBody .kp-spielt'), L.naechstes), '„Nächstes Kapitel“ öffnet das nächste Kapitel mit seiner Szene');

  // ---- Szene ohne eigene Zeile: Klick und Leertaste holen die nächste Nachricht, „Alles zeigen“, Pfeil rechts
  await page.evaluate(id => { delete S.steps[id]; delete S.done[id]; }, L.chat.id);
  await geh(page, L.chat.id);
  await page.waitForSelector('.kp-tippt:visible');
  ok((await txt(page, '.kp-tippt')).includes(L.chat.name + ' schreibt') && (await zeilen(page).count()) === L.chat.erste, 'Szene: „' + L.chat.name + ' schreibt“ steht vor der Nachricht');
  await page.keyboard.press('Space');
  ok((await zeilen(page).count()) === L.chat.erste + 1, 'Szene: Leertaste holt die nächste Nachricht sofort');
  await page.click('.kp-chat', { position: { x: 30, y: 12 } });
  ok(L.chat.erste + 2 < L.chat.n && (await zeilen(page).count()) === L.chat.erste + 2, 'Szene: Klick in den Chat holt die nächste Nachricht');
  await page.click('.kp-alles');
  ok((await zeilen(page).count()) === L.chat.n && (await sichtbar(page, '#kpAnnehmen')), 'Szene: „Alles zeigen“ überspringt das Abspielen bis zum Ticket');
  await page.dblclick('#kpAnnehmen');
  ok((await sichtbar(page, '#pretest')) && (await page.locator('.kp-stempel').count()) === 1, 'Szene: Doppelklick auf „Ticket annehmen“ nimmt nur einmal an');
  await page.evaluate(id => { delete S.steps[id]; delete S.pre[id]; }, L.chat.id);
  await geh(page, L.chat.id);
  /* „Weiter“ ist solange ausgeblendet, Pfeil rechts geht trotzdem denselben Weg: erst alles zeigen, dann annehmen, dann blättern */
  await page.keyboard.press('ArrowRight');
  ok((await zeilen(page).count()) === L.chat.n && (await sichtbar(page, '#kpAnnehmen')) && !(await sichtbar(page, '.slide')) && !(await sichtbar(page, '#nextStep')), 'Szene: Pfeil rechts zeigt beim Abspielen erst alles, „Weiter“ bleibt weg');
  await page.keyboard.press('ArrowRight');
  ok((await sichtbar(page, '#pretest')) && !(await page.locator('#kpAnnehmen').count()) && (await sichtbar(page, '#nextStep.primary')) && (await st(page)).steps[L.chat.id] === 0, 'Szene: Der nächste Pfeil rechts nimmt das Ticket an, jetzt ist „Weiter“ da');
  await page.click('#nextStep');
  ok(await sichtbar(page, '#stepBody .slide'), 'Szene: Dann geht „Weiter“ zur Folie, der Tipp ist freiwillig');
  // Ohne Animationen erscheint alles sofort
  await page.evaluate(id => { delete S.steps[id]; }, L.chat.id);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await geh(page, L.chat.id);
  ok((await zeilen(page).count()) === L.chat.n && (await sichtbar(page, '#kpAnnehmen')) && !(await page.locator('.kp-rein').count()), 'Ohne Animationen: Szene und Ticket stehen sofort da');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  // ---- Besondere Folien
  await page.evaluate(x => { S.gen[x.id + ':' + x.i] = 1; delete S.done[x.id]; if (S.zeile) delete S.zeile[x.id + ':' + x.i]; }, L.alt);
  await geh(page, L.alt.id, { t: 'slide', i: L.alt.i });
  ok(!(await page.locator('.kp-se').count()) && (await offen(page)) > 0 && !(await page.locator('#stepBody .kp-du').count()), 'Alter Spielstand: Früher selbst erklärte Folien (S.gen = 1) zeigen die Erklärungen sofort');
  await page.evaluate(x => { delete S.gen[x.id + ':' + x.i]; S.zeile = { [x.id + ':' + x.i]: { ok: 2, fehler: 0 } }; }, L.alt);
  await geh(page, L.alt.id, { t: 'slide', i: L.alt.i });
  ok(!(await page.locator('.kp-se').count()) && (await offen(page)) > 0, 'Alter Spielstand: Folien aus dem früheren Mini-Spiel (S.zeile) zeigen die Erklärungen sofort');
  await page.evaluate(x => { delete S.done[x.id]; if (S.zeile) delete S.zeile[x.id + ':' + x.i]; }, L.tag);
  await geh(page, L.tag.id, { t: 'slide', i: L.tag.i });
  const tagIdx = await page.evaluate(() => [...document.querySelectorAll('#stepBody .acode .lx')].findIndex(e => LEX[+e.dataset.lx].html && e.textContent.trim() in HTML_TAG));
  ok(tagIdx >= 0, 'HTML-Tags im Code sind unterstrichen');
  await page.locator('#stepBody .acode .lx').nth(tagIdx).click();
  ok(/^<\w+>$/.test((await txt(page, '.lexpop .lc-k')).trim()) && (await sichtbar(page, '.lexpop .el-was')) && (await page.locator('.lexpop').count()) === 1 && !(await page.locator('.htmlside, .lexpop .el-deep').count()), 'HTML-Tag öffnet dieselbe kleine Karte, ohne Seitenkasten und ohne KI-Knopf');
  await page.click('.lexpop .lp-x');
  ok(!(await sichtbar(page, '.lexpop')), 'Wort-Karte: × schließt sie');

  // ---- Suche springt weiter auf eine Folie (sprungZu), letztes Kapitel hat nur den Weg zum Schreibtisch
  await page.evaluate(id => { window.sprungZu = { id, t: 'slide', i: 1 }; location.hash = id; }, L.id);
  await page.waitForFunction(id => location.hash === '#' + id && document.querySelector('#stepBody .slide'), L.id);
  ok((await txt(page, '#stepBody .sl-title')) === await page.evaluate(id => CH.find(c => c.id === id).slides[1].t, L.id) && await page.evaluate(() => window.sprungZu === null), 'sprungZu öffnet die gewünschte Folie');
  // Nachschlagen: Ein Sprung der Suche in ein Kapitel, das man noch nicht kennt, merkt sich nichts und schafft nichts
  const xpN = (await st(page)).xp;
  await page.evaluate(id => { delete S.steps[id]; window.sprungZu = { id, t: 'end' }; location.hash = id; }, L.letztes);
  await page.waitForFunction(id => location.hash === '#' + id && document.querySelector('#stepBody .end'), L.letztes);
  s = await st(page);
  ok(!s.done[L.letztes] && !s.steps[L.letztes] && s.xp === xpN && !(await page.locator('#dumpIn, .kp-ende-t, #kpNaechstes').count()) && (await page.locator('#stepBody .end li').count()) > 0, 'Nachschlagen: Ein Merksatz-Treffer zeigt die Merksätze, das Kapitel ist damit weder angefangen noch geschafft');
  await page.click('#prevStep');
  ok(!(await st(page)).steps[L.letztes] && !(await page.locator('#stepBody .end').count()), 'Nachschlagen: Auch das Blättern von dort merkt sich keinen Schritt');
  await page.click('#kpWeg .kp-ph >> nth=0'); await page.click('.kp-alles'); await page.click('#kpAnnehmen');
  if (await page.locator('#pretest').count()) await page.click('#nextStep');
  ok((await st(page)).steps[L.letztes] === 1 && (await sichtbar(page, '#stepBody .slide')), 'Nachschlagen: Wer zurück zum Ticket geht und es annimmt, fängt das Kapitel normal an');
  // Im angefangenen Kapitel zählt ein Sprung der Suche wie Blättern: Der Stand geht mit und übersteht das Neuzeichnen
  const sprung = await page.evaluate(id => { const c = CH.find(c => c.id === id); window.sprungZu = { id, t: 'quiz', i: 0 }; route(); document.querySelector('#nextStep').click(); const nach = S.steps[id]; route(); return { nach, quiz: 1 + c.slides.length, wo: document.querySelector('#stepQuiet').textContent }; }, L.letztes);
  ok(sprung.nach === sprung.quiz + 1 && new RegExp('Schritt ' + (sprung.quiz + 2) + ' von ').test(sprung.wo), 'Nachschlagen im angefangenen Kapitel: Wer von dort weiterspielt, behält seinen Stand (' + sprung.wo + ')');
  // Nachschlagen auf einer Folie mit Code: Die Erklärungen stehen gleich da, das Selbsterklären bleibt für den echten Besuch
  const nach = await page.evaluate(() => {
    for (const c of CH) {
      if (c.eigen || S.done[c.id] || S.steps[c.id]) continue;
      const i = c.slides.findIndex((s, i) => s.code && s.notes && s.notes.length && !(S.zeile || {})[c.id + ':' + i] && !(S.gen || {})[c.id + ':' + i]);
      if (i >= 0) return { id: c.id, i, n: c.slides[i].notes.length };
    }
  });
  await page.evaluate(x => { window.sprungZu = { id: x.id, t: 'slide', i: x.i }; location.hash = x.id; }, nach);
  await page.waitForFunction(id => location.hash === '#' + id && document.querySelector('#stepBody .slide'), nach.id);
  s = await st(page);
  ok(!(await page.locator('.kp-se').count()) && (await offen(page)) === nach.n && !(s.gen || {})[nach.id + ':' + nach.i] && !s.steps[nach.id], 'Nachschlagen: Eine Folie mit Code zeigt die Erklärungen sofort, ohne Selbsterklären, und merkt sich nichts');
  await geh(page, nach.id, { t: 'slide', i: nach.i });
  ok((await page.locator('.kp-se').count()) === 1 && (await offen(page)) === 0, 'Nachschlagen: Beim echten Besuch der Folie wartet das Selbsterklären noch');
  // Nachschlagen und von dort bis zum Abschluss blättern: Das Kapitel ist geschafft, der Schritt gemerkt, die Fortschrittsanzeige voll und frei
  const durch = await page.evaluate(() => { const c = CH.find(c => !c.eigen && !c.ex && !S.done[c.id] && !S.steps[c.id] && c.quiz.length && CH.indexOf(c) < CH.length - 1); return { id: c.id, q: c.quiz.length - 1, letzter: buildSteps(c).length - 1 }; });
  await page.evaluate(x => { window.sprungZu = { id: x.id, t: 'quiz', i: x.q }; location.hash = x.id; }, durch);
  await page.waitForFunction(id => location.hash === '#' + id && document.querySelector('#stepBody .quiz'), durch.id);
  const gesperrt = await page.locator('#kpWeg .kp-ph:disabled').count();
  /* Ohne Übung zählt das Quiz: Alle Fragen sind richtig beantwortet (offen.test.js prüft den Fall ohne) */
  await page.evaluate(x => { CH.find(c => c.id === x.id).quiz.forEach((q, i) => { S.quiz[x.id + ':' + i] = 1; }); save(); }, durch);
  await page.click('#nextStep');
  s = await st(page);
  ok(gesperrt > 0 && !!s.done[durch.id] && s.steps[durch.id] === durch.letzter && (await sichtbar(page, '#dumpIn')) && !(await page.locator('#kpWeg .kp-ph:disabled').count()) && !(await page.locator('#kpWeg .kp-ph-b i:not(.voll):not(.an)').count()),
    'Nachschlagen: Wer von dort bis zum Abschluss blättert, hat das Kapitel geschafft, mit gemerktem Schritt und voller, freier Fortschrittsanzeige');
  await page.evaluate(id => { const c = CH.find(x => x.id === id); c.quiz.forEach((q, i) => { S.quiz[id + ':' + i] = 1; }); if (c.ex) S.ex[c.ex.id] = { passed: true, fails: 0 }; save(); }, L.letztes);
  await geh(page, L.letztes, { t: 'end' });
  await page.click('#dumpSkip');
  ok(!(await page.locator('#kpNaechstes').count()) && (await page.locator('#kpHeim.primary').count()) === 1, 'Letztes Kapitel: „Zum Schreibtisch“ ist der Hauptknopf');
  ok(!a.fehler.length, 'Neuer Nutzer: keine JavaScript-Fehler' + (a.fehler.length ? ': ' + a.fehler.join(' | ') : ''));
  await a.browser.close();

  /* ================= 2. Alter Spielstand (Format vor dem Umbau: ohne S.zeile, mit S.gen und S.reflect) ================= */
  const fertig = L.id, angefangen = L.naechstes, tag0 = Date.now() - 5 * 864e5;
  const stand = { ich: { name: 'Kerim', start: tag0 }, xp: 640, steps: { [angefangen]: 2 }, done: { [fertig]: tag0 }, quiz: { [fertig + ':0']: 1 }, ex: {}, code: {}, days: [], badges: [], updated: tag0, srs: {},
    cal: { sr: 3, sw: 1, ur: 1, uw: 1 }, pre: {}, gen: { [angefangen + ':0']: 1 }, reflect: { [fertig]: 1 }, profil: {}, eigene: {}, arena: { bug: {}, out: {}, rev: {}, iv: [] } };
  const b = await oeffnen({ stand, hash: angefangen });
  await b.page.waitForSelector('#stepBody > *');
  ok(/Schritt 3 von/.test(await txt(b.page, '#stepQuiet')) && (await st(b.page)).steps[angefangen] === 2, 'Alter Spielstand: Angefangenes Kapitel öffnet am gemerkten Schritt');
  await geh(b.page, angefangen, { t: 'story' });
  ok(!(await b.page.locator('#kpAnnehmen, .kp-spielt').count()) && (await sichtbar(b.page, '.ticket')), 'Alter Spielstand: Szene des angefangenen Kapitels ist komplett');
  await geh(b.page, fertig, { t: 'slide', i: L.f1 });
  ok(!(await b.page.locator('.kp-se').count()) && (await offen(b.page)) === sp.n, 'Alter Spielstand: Geschaffte Kapitel ohne Selbsterklären');
  /* Offenes Kapitel, das laut Spielstand schon hinter der Folie mit Code war: Zurückblättern zeigt die Erklärungen */
  await b.page.evaluate(x => { S.steps[x.id] = x.i + 2; delete S.done[x.id]; location.hash = x.id; }, L.alt);
  await b.page.waitForFunction(id => location.hash === '#' + id && document.querySelector('#stepBody > *'), L.alt.id);
  await b.page.click('#prevStep');
  ok((await txt(b.page, '#stepBody .sl-title')) === await b.page.evaluate(x => CH.find(c => c.id === x.id).slides[x.i].t, L.alt) && !(await b.page.locator('.kp-se').count()) && (await b.page.locator('#stepBody .notes li:not(:visible)').count()) === 0,
    'Alter Spielstand: Eine Folie, die schon hinter einem lag, zeigt die Erklärungen gleich');
  await b.page.evaluate(x => { S.steps[x.id] = 99; window.sprungZu = { id: x.id, t: 'story' }; route(); }, L.alt);
  ok((await b.page.locator('#kpWeg .kp-ph').count()) >= 4 && !(await b.page.locator('#kpWeg .kp-ph:disabled').count()), 'Alter Spielstand: Ein gemerkter Schritt jenseits des Kapitels sperrt keinen Abschnitt');
  await geh(b.page, fertig, { t: 'end' });
  const s2 = await st(b.page);
  ok((await txt(b.page, '.kp-ende-t')) === '✓ Geschafft' && s2.xp === 640 && s2.done[fertig] === tag0 && JSON.stringify(s2.reflect) === JSON.stringify(stand.reflect), 'Alter Spielstand: Abschluss ändert weder XP noch Datum noch S.reflect');
  ok(!b.fehler.length, 'Alter Spielstand: keine JavaScript-Fehler' + (b.fehler.length ? ': ' + b.fehler.join(' | ') : ''));
  await b.browser.close();

  /* ================= 3. Handy, 360 px breit ================= */
  const c = await oeffnen({ hash: 'start', viewport: { width: 360, height: 740 } });
  const p = c.page;
  await geh(p, L.id);
  await p.waitForSelector('.kp-sag:visible');
  ok((await keinQuerscrollen(p)) && (await hoch(p, '.kp-sag')) >= 40 && (await hoch(p, '.kp-alles')) >= 40 && (await hoch(p, '#kpWeg .kp-ph')) >= 40 && (await hoch(p, '.ort a')) >= 40, 'Handy: Szene ohne Querscrollen, Tippflächen mindestens 40 px');
  await p.click('.kp-sag'); await p.click('.kp-alles');
  ok((await keinQuerscrollen(p)) && (await hoch(p, '#kpAnnehmen')) >= 40, 'Handy: Ticket ohne Querscrollen');
  await geh(p, L.id, { t: 'slide', i: L.f1 });
  ok((await keinQuerscrollen(p)) && (await hoch(p, '#kpSeX')) >= 40 && (await hoch(p, '#kpSeGo')) >= 40 && (await hoch(p, '.kp-se-in')) >= 40 && (await hoch(p, '.kp-mehr summary')) >= 40, 'Handy: Folie mit Selbsterklären ohne Querscrollen, Tippflächen mindestens 40 px');
  for (let k = 0; k < sp.n; k++) await p.fill('#kpSe' + k, 'Idee ' + (k + 1));
  await p.click('#kpSeGo');
  ok((await offen(p)) === sp.n && (await keinQuerscrollen(p)), 'Handy: Vergleichen zeigt die Lösung ohne Querscrollen');
  /* Lange Wörter ohne Leerzeichen (Fachbegriffe, Aufrufe) dürfen die Seite nicht breiter machen */
  await p.evaluate(([id, i]) => {
    const lang = 'platformBrowserDynamic().bootstrapModule(AppModule).' + 'x'.repeat(40), c = CH.find(c => c.id === id), s = c.slides[i];
    s.pro += ' ' + lang; s.say += ' ' + lang; s.job = (s.job || '') + ' ' + lang; s.notes[0][1] += ' ' + lang; s.t += ' ' + lang;
    c.quiz[0].options[0] += lang; c.quiz[0].why += ' ' + lang; c.merke[0] += ' ' + lang; c.ticket.text += ' ' + lang; c.story[0][1] += ' ' + lang;
    c.doku = [[lang, 'https://angular.dev/' + lang]];
  }, [L.id, L.f1]);
  await geh(p, L.id, { t: 'story' });
  ok(await keinQuerscrollen(p), 'Handy: Szene und Ticket mit sehr langen Wörtern ohne Querscrollen');
  await geh(p, L.id, { t: 'slide', i: L.f1 });
  await p.click('.kp-mehr summary');
  ok((await keinQuerscrollen(p)) && (await offen(p)) === sp.n, 'Handy: Folie mit „Mehr dazu“ und sehr langen Wörtern ohne Querscrollen');
  await geh(p, L.id, { t: 'quiz', i: 0 });
  ok((await keinQuerscrollen(p)) && (await hoch(p, '#stepBody .opt')) >= 40, 'Handy: Quiz ohne Querscrollen');
  await p.click('#stepBody .opt[data-i="' + L.quiz[0].correct + '"]');
  ok(await keinQuerscrollen(p), 'Handy: Auflösung ohne Querscrollen');
  if (L.ex) await p.evaluate(id => { const c = CH.find(x => x.id === id); S.ex[c.ex.id] = { passed: true, fails: 0 }; save(); }, L.id);
  await geh(p, L.id, { t: 'end' });
  await p.click('#dumpSkip');
  ok((await keinQuerscrollen(p)) && (await hoch(p, '#kpNaechstes')) >= 40 && (await hoch(p, '#kpHeim')) >= 40, 'Handy: Abschluss ohne Querscrollen');
  /* Touch: Die Felder zum Selbsterklären sind groß genug, Schrift ab 16 px (sonst zoomt iOS beim Antippen) */
  const d = await oeffnen({ hash: 'start', mobil: true });
  await geh(d.page, L.id, { t: 'slide', i: L.f2 });
  ok((await hoch(d.page, '#stepBody .kp-se-in')) >= 40 && (await d.page.locator('#stepBody .kp-se-in').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))) >= 16 && !d.fehler.length, 'Touch: Felder zum Selbsterklären mindestens 40 px hoch, Schrift ab 16 px');
  await d.browser.close();

  await ende(c.browser, c.fehler);
  console.log('\nAlles grün');
})();
