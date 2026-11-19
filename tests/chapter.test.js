// Prüft im echten Browser den Kapitel-Ablauf: Rahmen, Szene zum Durchspielen, Folie, „Erklär die Zeilen selbst“,
// Wort-Karte, Quiz, Abschluss. Die Kapitel werden nach Eigenschaften ausgesucht, nicht nach festen Texten.
const { openPage, checker } = require('./helpers');
const { ok, ending } = checker();

const st = page => page.evaluate(() => JSON.parse(JSON.stringify(S)));
/* Kapitel öffnen. wo = { t: 'story' | 'slide' | 'quiz' | 'code' | 'end', i } steht für „bis zu diesem Schritt geblättert“: Der Stand
   wird auf den Schritt gesetzt, dann öffnet der Sprung ihn. Ein Sprung allein (wie aus der Suche) zählt nicht, siehe „Nachschlagen“. */
const goTo = (page, id, where) => page.evaluate(([id, where]) => new Promise(finished => {
  if (where) {
    window.jumpTo = Object.assign({ id }, where);
    const j = buildSteps(CH.find(c => c.id === id)).findIndex(s => s.t === where.t && (where.i == null || s.i === where.i));
    if (!S.done[id]) S.steps[id] = Math.max(S.steps[id] || 0, j);
  }
  if (location.hash === '#' + id) { route(); finished(); } else { addEventListener('hashchange', () => setTimeout(finished, 0), { once: true }); location.hash = id; }
}), [id, where]);
const lines = page => page.locator('#stepBody .story > *');
const visible = (page, sel) => page.locator(sel).first().isVisible();
const txt = (page, sel) => page.locator(sel).first().textContent();
const cl = (page, z) => page.locator('#stepBody .acode .cl').nth(z);
/* Erklärungen, die gerade in der Liste zu sehen sind */
const pending = page => page.locator('#stepBody .notes li:visible').count();
/* Eine Zahl am Rand einer Codezeile: da und sichtbar? */
const numberShown = (page, z) => cl(page, z).evaluate(el => [...el.querySelectorAll('.fine i')].some(i => getComputedStyle(i).visibility === 'visible'));
const noSideScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const upward = (page, sel) => page.locator(sel).first().evaluate(el => el.getBoundingClientRect().height);

/* Was die Inhalte hergeben: Kapitel und Folien für die einzelnen Fälle */
const situation = page => page.evaluate(() => {
  /* Folie zum Selbsterklären: Code mit Erklärungen. wo = Zeile je Nummer. */
  const game = s => {
    if (!s.code || !s.notes || !s.notes.length) return null;
    return { where: cpNoteLines(s.code.split('\n'), s.notes), n: s.notes.length };
  };
  const withGame = c => c.slides.map((s, i) => game(s) ? i : -1).filter(i => i >= 0);
  /* Hauptkapitel: eigene Zeile mitten in der Szene, zwei Folien mit Code und Erklärungen (die erste mit mindestens drei), zwei Quizfragen */
  const k = CH.find(c => c.story.findIndex(z => z[0] === 'du') > 0 && withGame(c).length >= 2 && game(c.slides[withGame(c)[0]]).n >= 3 && game(c.slides[withGame(c)[0]]).where.every(z => z >= 0) && c.quiz.length >= 2 && c.slides.some(s => !s.code && s.points && s.points.length >= 2));
  /* Szene ohne eigene Zeile, nach der ersten Nachricht kommen noch mindestens zwei (für Leertaste und Klick) */
  const firstMessage = c => c.story.findIndex(z => CAST[z[0]] && z[0] !== 'erz');
  const kChat = CH.find(c => c !== k && c.story.every(z => z[0] !== 'du') && c.story.filter(z => CAST[z[0]] && z[0] !== 'erz').length >= 2 && c.story.length >= firstMessage(c) + 3);
  const cards = { id: k.id, i: k.slides.findIndex(s => !s.code && s.points && s.points.length >= 2) };
  cards.n = k.slides[cards.i].points.length;
  const tag = CH.find(c => c !== k && c.slides.some(s => /<button/.test(s.code || '')));
  const alt = CH.find(c => c !== k && c !== kChat && withGame(c).length);
  const ms = withGame(k);
  return {
    id: k.id, idx: CH.indexOf(k), title: k.title, xp: k.xp, story: k.story, stripped: k.story.map(z => stripHtml(z[1])), du: k.story.findIndex(z => z[0] === 'du'),
    ticket: k.ticket.heading, slides: k.slides.length, matching: hasMatching(k), quiz: k.quiz.map(q => ({ correct: q.correct, wrong: q.correct === 0 ? 1 : 0, why: stripHtml(q.why) })), ex: !!k.ex, takeaway: k.takeaway.length,
    f1: ms[0], s1: game(k.slides[ms[0]]), f2: ms[1], s2: game(k.slides[ms[1]]), withoutCode: k.slides.findIndex(s => !s.code && s.points && s.points.length >= 2), pro: k.slides[ms[0]].pro, say: k.slides[ms[0]].say,
    nextItem: (CH[CH.indexOf(k) + 1] || {}).id, lastItem: CH.filter(c => !c.custom).pop().id,
    chat: { id: kChat.id, n: kChat.story.length, firstOne: firstMessage(kChat), name: CAST[kChat.story.find(z => CAST[z[0]] && z[0] !== 'erz')[0]].name },
    cards, tag: { id: tag.id, i: tag.slides.findIndex(s => /<button/.test(s.code || '')) }, alt: { id: alt.id, i: withGame(alt)[0] }
  };
});

(async () => {
  /* ================= 1. Neuer Nutzer spielt ein Kapitel von vorn bis hinten ================= */
  const a = await openPage({ hash: 'start' });
  const { page } = a;
  const L = await situation(page);
  ok(L.id && L.chat.id && L.tag.id && L.alt.id && L.nextItem, 'Vorbedingung: Die Inhalte haben Kapitel für alle Fälle (' + L.id + ', ' + L.chat.id + ', ' + L.alt.id + ')');
  const stepList = 1 + L.slides + L.quiz.length + (L.matching ? 1 : 0) + (L.ex ? 1 : 0) + 1;

  // ---- Rahmen
  await goTo(page, L.id);
  ok((await page.getAttribute('.loc a', 'href')) === '#start' && /Schreibtisch/.test(await txt(page, '.loc a')), 'Rahmen: leiser Weg „← Schreibtisch“ führt nach #start');
  ok((await txt(page, '.ch-head h1')) === L.title, 'Rahmen: Kapitel-Titel steht oben');
  const journey = await page.locator('#cpPath .cp-ph').allTextContents();
  ok(journey.map(w => w.replace(/\s*\d+\/\d+$/, '').trim()).join('·') === ['Ticket', 'Verstehen', 'Quiz'].concat(L.matching ? ['Zuordnen'] : [], L.ex ? ['Umsetzen'] : [], ['Abschluss']).join('·'), 'Rahmen: eine Fortschrittsanzeige mit den Abschnitten (' + journey.join(' · ') + ')');
  ok((await page.locator('#cpPath .cp-ph-b i').count()) === stepList, 'Rahmen: ein Strich je Schritt (' + stepList + ')');
  const closed = await page.locator('#cpPath .cp-ph').evaluateAll(l => l.map(b => b.disabled));
  ok(closed.join() === closed.map((x, k) => k > 1).join(), 'Rahmen: Im frischen Kapitel sind nur „Ticket“ und der nächste Abschnitt anklickbar, der Rest ist deaktiviert');
  await page.locator('#cpPath .cp-ph').last().click({ force: true }); await page.evaluate(() => document.querySelector('#cpPath .cp-ph:last-child').click());
  ok((await st(page)).done[L.id] == null && (await st(page)).xp === 0 && (await visible(page, '#stepBody .cp-chat')) && !(await page.locator('#stepBody .end').count()), 'Rahmen: Klick auf „Abschluss“ im frischen Kapitel ändert weder S.done noch S.xp');
  ok(!(await page.locator('#stepper, .stepper, .ch-prog, #chProg, .tagline').count()), 'Rahmen: kein zweiter Stepper, kein Balken, keine Unterzeile');
  ok((await page.locator('#prevStep').isDisabled()) && (await page.locator('#nextStep').count()) === 1 && !(await visible(page, '#nextStep')), 'Rahmen: „Zurück“ ist am Anfang aus, „Weiter“ kommt erst nach der Szene');
  ok(/^Ticket · Schritt 1 von /.test(await txt(page, '#stepQuiet')) && (await page.$eval('#stepQuiet', e => { const c = getComputedStyle(e); return e.classList.contains('sr-only') && c.position === 'absolute' && c.width === '1px' && c.height === '1px'; })), 'Rahmen: Schritt wird für Screenreader angesagt, unsichtbar über die gemeinsame Klasse sr-only');
  ok(await page.evaluate(() => currentSlide === null), 'Rahmen: in der Szene ist keine Folie offen (aktFolie)');

  // ---- Szene spielt sich ab
  ok((await page.getAttribute('#stepBody .story', 'aria-live')) === 'polite', 'Szene: Chat sagt neue Nachrichten an (aria-live)');
  await page.waitForSelector('.cp-say:visible');
  ok((await lines(page).count()) === L.du, 'Szene: Nachrichten kommen einzeln, vor der eigenen Zeile stehen ' + L.du + ' von ' + L.story.length);
  ok((await txt(page, '.cp-say')) === L.stripped[L.du], 'Szene: Die eigene Zeile ist ein Antwort-Knopf mit genau diesem Text');
  ok(!(await visible(page, '.ticket')) && !(await visible(page, '#cpAccept')) && !(await page.locator('#pretest').count()), 'Szene: Ticket und Vorab-Tipp kommen erst später');
  ok(!(await visible(page, '#nextStep')) && (await visible(page, '.cp-all')), 'Szene: Beim Abspielen gibt es kein „Weiter“, dafür ist „Alles zeigen“ da');
  await page.keyboard.press('1');
  ok((await st(page)).pre[L.id] == null, 'Szene: Zifferntasten treffen keinen verdeckten Vorab-Tipp');
  await page.click('.cp-say');
  ok((await lines(page).count()) === L.du + 1 && (await txt(page, '#stepBody .line.me p')) === L.stripped[L.du] && !(await visible(page, '.cp-say')), 'Szene: Erst der Klick „sagt“ die eigene Zeile');
  if (L.du + 1 < L.story.length && L.story[L.du + 1][0] !== 'erz') {
    ok(/schreibt/.test(await txt(page, '.cp-typing')) && (await visible(page, '.cp-typing')), 'Szene: Vor der nächsten Nachricht steht kurz „… schreibt“');
  }
  await page.waitForSelector('#cpAccept:visible', { timeout: 8000 });
  ok((await lines(page).count()) === L.story.length && (await txt(page, '#stepBody .ticket .tk-t')) === L.ticket, 'Szene: Danach kommt das Ticket ins Bild');
  ok((await txt(page, '#stepBody .line.me .who-n small')) === 'Frontend · Praktikant', 'Szene: Unter dem eigenen Namen stehen Abteilung und Rang wie auf dem Ausweis');
  const pale = await page.evaluate(() => {
    const light = c => { const v = c.match(/[\d.]+/g).slice(0, 3).map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
    const d = document.createElement('div'), who = Object.keys(CAST).filter(k => k !== 'erz');
    d.innerHTML = who.map(cpAvatar).join(''); document.querySelector('#stepBody').append(d);
    const off = who.filter((k, n) => { const cs = getComputedStyle(d.children[n]), a = light(cs.color), b = light(cs.backgroundColor); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05) < 4.5; });
    d.remove(); return off;
  });
  ok(!pale.length, 'Szene: Die Initiale ist auf jeder Figurenfarbe lesbar (Kontrast ab 4,5)' + (pale.length ? ': ' + pale.join(', ') : ''));
  ok((await txt(page, '#cpAccept')) === 'Ticket annehmen' && (await page.locator('#main .btn.primary:visible').count()) === 1 && !(await visible(page, '#nextStep')), 'Szene: „Ticket annehmen“ ist die eine Hauptaktion, kein „Weiter“ daneben');
  ok(!(await visible(page, '.cp-all')) && !(await visible(page, '.cp-typing')), 'Szene: „Alles zeigen“ und „schreibt“ sind dann weg');
  await page.click('#cpAccept');
  ok(/Angenommen/.test(await txt(page, '.cp-stamp')) && !(await page.locator('#cpAccept').count()), 'Szene: Annehmen wird bestätigt, der Knopf ist weg');
  ok((await visible(page, '#pretest')) && (await visible(page, '#nextStep.primary')) && (await st(page)).steps[L.id] === 0, 'Szene: Nach dem Annehmen kommt der Vorab-Tipp, „Weiter“ erscheint als Hauptknopf');
  await page.click('#pretest .opt[data-i="' + L.quiz[0].wrong + '"]');
  ok((await st(page)).pre[L.id] === L.quiz[0].wrong && (await st(page)).xp === 0, 'Szene: Der Tipp wird gemerkt und zählt nicht');
  await page.click('#nextStep');
  ok((await visible(page, '#stepBody .slide')) && (await st(page)).steps[L.id] === 1, 'Szene: „Weiter“ führt zur ersten Folie');
  ok((await page.locator('#cpPath .cp-ph:disabled').count()) === (L.ex ? 2 : 1) + (L.matching ? 1 : 0) && !(await page.locator('#cpPath .cp-ph >> nth=2').isDisabled()), 'Rahmen: Mit jedem erreichten Abschnitt wird der nächste anklickbar');
  ok(await page.evaluate(id => currentSlide && currentSlide.ch.id === id && currentSlide.s === currentSlide.ch.slides[0], L.id), 'Folie: aktFolie zeigt auf Kapitel und Folie');
  await page.click('#prevStep');
  ok((await lines(page).count()) === L.story.length && (await visible(page, '.ticket')) && !(await page.locator('#cpAccept, .cp-say, .cp-all').count()) && (await visible(page, '#nextStep.primary')), 'Szene: Zurück im angefangenen Kapitel steht sie sofort komplett da, ohne Annehmen, „Weiter“ ist von Anfang an da');
  ok((await page.locator('#pretest .opt:disabled').count()) === 4, 'Szene: Der abgegebene Tipp bleibt stehen');

  // ---- Doku-Links aus den Inhalten: jedes Kapitel 1 bis 3, nur https. Danach ohne sie weiter, die Fälle unten setzen eigene Testwerte.
  const dk = await page.evaluate(() => ({
    kapitel: CH.filter(c => !c.custom && !(Array.isArray(c.docs) && c.docs.length >= 1 && c.docs.length <= 3 && c.docs.every(d => Array.isArray(d) && d[0] && /^https:\/\//.test(d[1])))).map(c => c.id),
    lex: LEX.filter(e => e.docs != null && !/^https:\/\//.test(e.docs)).length
  }));
  ok(!dk.kapitel.length && !dk.lex, 'Inhalte: Jedes Kapitel hat 1 bis 3 Doku-Links, alle Links (auch im Lexikon) sind https' + (dk.kapitel.length ? ': ' + dk.kapitel.join(', ') : ''));
  /* Jeder Link steht je Kapitel genau zweimal: offen auf der letzten Folie und am Abschluss. Nie unter „Mehr dazu“, nie auf anderen Folien. */
  const dl = await page.evaluate(() => {
    const wrong = [], body = document.createElement('div'), shouldLinks = c => c.docs.map(d => d[1]).join(' ');
    const linkList = () => [...body.querySelectorAll('a.cp-docs')];
    CH.filter(c => !c.custom).forEach(c => {
      c.slides.forEach((s, i) => {
        renderSlide(body, s, c);
        const latest = i === c.slides.length - 1, l = linkList(), more = body.querySelector('.cp-more');
        if (l.map(a => a.getAttribute('href')).join(' ') !== (latest ? shouldLinks(c) : '')) wrong.push(c.id + ' Folie ' + (i + 1) + ': Links');
        if (body.querySelector('.cp-more a') || !!more !== !!s.pro || (more && more.querySelector('p').textContent !== s.pro)) wrong.push(c.id + ' Folie ' + (i + 1) + ': Mehr dazu');
        if (latest && !(body.querySelector('.cp-docs-t') && body.querySelector('.cp-docs-t').textContent === 'Offizielle Doku' && !l.some(a => a.closest('details')) && l.every(a => a.target === '_blank' && a.rel === 'noopener'))) wrong.push(c.id + ': Zeile „Offizielle Doku“');
      });
      const wasThere = { done: S.done[c.id], srs: JSON.stringify(S.srs) };
      S.done[c.id] = 1; renderEnd(body, c);
      if (linkList().map(a => a.getAttribute('href')).join(' ') !== shouldLinks(c) || !linkList().every(a => a.target === '_blank' && a.rel === 'noopener' && !a.closest('details'))) wrong.push(c.id + ': Abschluss');
      if (wasThere.done) S.done[c.id] = wasThere.done; else delete S.done[c.id];
      S.srs = JSON.parse(wasThere.srs);
    });
    return wrong;
  });
  ok(!dl.length, 'Doku-Links: je Kapitel genau zweimal (letzte Folie als offene Zeile „Offizielle Doku“, Abschluss), neuer Tab mit noopener, „Mehr dazu“ nur mit Profi-Wissen' + (dl.length ? ': ' + dl.slice(0, 5).join(' | ') : ''));
  await page.evaluate(() => { CH.forEach(c => { delete c.docs; }); LEX.forEach(e => { delete e.docs; }); HTML_EL.forEach(e => { delete e.docs; }); });
  // ---- Folie: nur das Nötige
  await goTo(page, L.id, { t: 'slide', i: L.f1 });
  ok((await page.locator('#stepBody .sl-title').count()) === 1 && (await page.locator('#stepBody .say').count()) === 1 && (await txt(page, '#stepBody .say')) === L.say, 'Folie: Titel und genau ein Kernsatz');
  ok((await page.locator('#stepBody form').count()) === 1 && (await page.locator('#stepBody form.cp-se').count()) === 1 && !(await page.locator('.gen-bar, #genIn').count()), 'Folie: genau ein Formular, „Erklär die Zeilen selbst“');
  ok(!(await page.locator('#again, #ask, #askBox, #aiOut, #fdHost, .fd, #stepBody .ai-box:not(#cpSeOut), .lexbtn, .lexpanel, .htmlside, .lc-deep, .el-deep').count()), 'Folie: keine KI-Knöpfe, kein „Für dich erklärt“, keine Begriffsliste, kein Seitenkasten');
  ok((await page.locator('#stepBody .slide button:not(.cp-se button)').count()) === 0, 'Folie: außer den Knöpfen zum Selbsterklären kein Knopf');
  ok(new RegExp('^Verstehen ' + (L.f1 + 1) + '/' + L.slides).test((await txt(page, '#cpPath .cp-ph.active')).trim()), 'Rahmen: Der Abschnitt zeigt, die wievielte Folie es ist');
  ok((await page.locator('.cp-more').count()) === 1 && !(await page.locator('.cp-more[open]').count()) && (await txt(page, '.cp-more summary')) === 'Mehr dazu', 'Folie: „Mehr dazu“ ist eingeklappt');
  await page.click('.cp-more summary');
  ok((await visible(page, '.cp-more p')) && (await txt(page, '.cp-more p')) === L.pro && !(await page.locator('.cp-more a').count()), 'Folie: „Mehr dazu“ zeigt das Profi-Wissen, ohne doku keine Links');

  // ---- Erklär die Zeilen selbst: Code ganz sichtbar, ein Feld je Nummer, dann die Lösung mit den eigenen Worten
  const sp = L.s1, key1 = L.id + ':' + L.f1, xpBefore = (await st(page)).xp;
  ok(/Erklär die Zeilen selbst/.test(await txt(page, '.cp-se')) && (await page.locator('.cp-se-in').count()) === sp.n, 'Selbsterklären: Aufgabe und ein Feld je Nummer (' + sp.n + ') unter dem Code');
  ok((await pending(page)) === 0 && (await numberShown(page, sp.where[0])) && (await page.locator('#stepBody .acode .lx').count()) > 0, 'Selbsterklären: Erklärungen verdeckt, Nummern und unterstrichene Wörter im Code sichtbar');
  ok((await page.locator('#cpSeGo.primary').count()) === 1 && !(await page.locator('#cpSeToni').count()), 'Selbsterklären: Ohne KI-Schlüssel ein Knopf „Mit der Lösung vergleichen“');
  await page.click('#cpSeGo');
  ok(/Schreib erst/.test(await txt(page, '.cp-se-r')) && (await pending(page)) === 0 && !((await st(page)).gen || {})[key1], 'Selbsterklären: Leer abschicken geht nicht, nichts gemerkt');
  await page.fill('#cpSe0', 'gibt die Funktion nach außen frei');
  await page.click('#cpSeGo');
  ok(/Nummer 2 fehlt/.test(await txt(page, '.cp-se-r')) && await page.evaluate(() => document.activeElement.id === 'cpSe1'), 'Selbsterklären: Fehlt eine Nummer, sagt es welche, und der Fokus springt hin');
  ok(await cl(page, sp.where[1]).evaluate(el => el.classList.contains('lit')), 'Selbsterklären: Das Feld im Fokus lässt seine Codezeile aufleuchten');
  const stepForward = (await st(page)).steps[L.id];
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('1');
  ok((await st(page)).steps[L.id] === stepForward && (await page.inputValue('#cpSe1')) === '1', 'Selbsterklären: Pfeil und Zahlen tippen ins Feld, statt zu blättern');
  await page.fill('#cpSe1', 'eine Zahl kommt rein');
  await page.keyboard.press('Enter');
  ok(await page.evaluate(() => document.activeElement.id === 'cpSe2') && (await page.inputValue('#cpSe1')) === 'eine Zahl kommt rein', 'Selbsterklären: Enter springt ins nächste Feld');
  for (let k = 2; k < sp.n; k++) await page.fill('#cpSe' + k, 'Idee ' + (k + 1));
  await page.focus('#cpSe' + (sp.n - 1)); await page.keyboard.press('Enter');
  ok((await pending(page)) === sp.n && !(await page.locator('.cp-se-in').count()), 'Selbsterklären: Enter im letzten Feld zeigt die Lösung, die Felder verschwinden');
  ok((await page.locator('#stepBody .notes .cp-you').count()) === sp.n && /^Du: gibt die Funktion/.test(await txt(page, '#stepBody .notes .cp-you')), 'Selbsterklären: Unter jeder Erklärung stehen die eigenen Worte');
  let g1 = (await st(page)).gen[key1];
  ok(g1 && g1.du.length === sp.n && g1.du[1] === 'eine Zahl kommt rein' && g1.toni === null && (await st(page)).xp === xpBefore, 'Selbsterklären: Eigene Worte im Spielstand (S.gen), keine XP, ohne KI kein Urteil');
  ok(((await st(page)).profile.expl || []).some(e => e.kind === 'selbsterklaert' && e.ch === L.id), 'Selbsterklären: Die eigenen Worte gehen ins Lernprofil');
  ok(await page.evaluate(() => document.activeElement.id === 'nextStep'), 'Selbsterklären: Danach liegt der Fokus auf „Weiter“');

  // ---- Wort-Karte: eine kleine Karte, Was / Woher / Warum, Doku-Link wenn vorhanden
  await page.locator('#stepBody .acode .lx').first().click();
  ok((await visible(page, '.lexpop')) && (await page.locator('.lexpop dt').allTextContents()).join('') === 'Was?Woher?Warum?', 'Wort-Karte: Klick auf ein unterstrichenes Wort öffnet Was / Woher / Warum');
  ok((await page.locator('.lexpop button').count()) === 1 && !(await page.locator('.lexpop a').count()), 'Wort-Karte: keine KI-Knöpfe, ohne doku kein Link');
  await page.keyboard.press('Escape');
  ok(!(await visible(page, '.lexpop')), 'Wort-Karte: Escape schließt sie');
  await page.evaluate(() => { LEX[+document.querySelector('#stepBody .acode .lx').dataset.lx].docs = 'https://angular.dev/guide/signals'; });
  await page.locator('#stepBody .acode .lx[tabindex="0"]').focus();
  await page.keyboard.press('Enter');
  const lk = page.locator('.lexpop a.cp-docs');
  ok((await lk.count()) === 1 && /^Offizielle Doku/.test(await lk.textContent()) && (await lk.getAttribute('href')) === 'https://angular.dev/guide/signals' && (await lk.getAttribute('target')) === '_blank' && (await lk.getAttribute('rel')) === 'noopener', 'Wort-Karte: Link „Offizielle Doku“ öffnet in neuem Tab');
  ok(await page.evaluate(() => document.querySelector('.lexpop').contains(document.activeElement)), 'Wort-Karte: Per Tastatur geöffnet liegt der Fokus in der Karte');
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => document.activeElement.classList.contains('lx')), 'Wort-Karte: Escape gibt den Fokus an das Wort zurück');
  await page.locator('#stepBody .acode .lx').first().click();
  await page.keyboard.press('ArrowRight');
  ok(!(await visible(page, '.lexpop')) && (await page.evaluate(() => [...document.querySelectorAll('#stepBody .acode .lx')].indexOf(document.activeElement))) === 1 && (await visible(page, '#stepBody .slide')), 'Wort-Karte: Pfeiltaste wandert zum nächsten Wort und schließt die Karte');
  await page.locator('#stepBody .acode .lx').first().click();
  await page.click('#nextStep');
  ok(!(await visible(page, '.lexpop')), 'Wort-Karte: Beim Weiterblättern schließt sie');
  await page.click('#prevStep');
  await page.evaluate(() => LEX.forEach(e => { delete e.docs; }));

  // ---- Zweiter Besuch ohne Formular, „Weiter“ geht immer, Überspringen
  await page.click('#nextStep'); await page.click('#prevStep');
  ok(!(await page.locator('.cp-se').count()) && (await pending(page)) === sp.n && (await page.locator('#stepBody .cp-you').count()) === sp.n, 'Selbsterklären: Beim zweiten Besuch stehen die Erklärungen sofort da, mit den eigenen Worten');
  await goTo(page, L.id, { t: 'slide', i: L.f2 });
  ok((await visible(page, '.cp-se')) && (await pending(page)) === 0, 'Selbsterklären: Die nächste Folie mit Code hat ihr eigenes Formular');
  const here = (await st(page)).steps[L.id];
  await page.click('#nextStep');
  ok((await st(page)).steps[L.id] === here + 1 && !(await st(page)).gen[L.id + ':' + L.f2], 'Selbsterklären: Kein Zwang, „Weiter“ geht auch ohne');
  await page.click('#prevStep');
  ok(!(await page.locator('.cp-se').count()) && (await pending(page)) === L.s2.n && !(await st(page)).gen[L.id + ':' + L.f2], 'Selbsterklären: Wer schon weitergeblättert hat, sieht beim Zurückkommen die Erklärungen');
  /* Stand zurück auf diese Folie: Hier war man noch nicht vorbei, das Erklären wartet */
  await page.evaluate(([id, n]) => { S.steps[id] = n; route(); }, [L.id, here]);
  ok(await visible(page, '#cpSeX'), 'Selbsterklären: Auf der Folie, bis zu der man gekommen ist, wartet es noch');
  await page.click('#cpSeX');
  ok(!(await page.locator('.cp-se-in').count()) && (await pending(page)) === L.s2.n && (await numberShown(page, L.s2.where[0])) && !(await page.locator('#stepBody .cp-you').count()), '„Erklärungen gleich zeigen“ überspringt das Erklären');
  ok(!!(await st(page)).gen[L.id + ':' + L.f2], 'Selbsterklären: Auch das Überspringen wird gemerkt');
  /* Neuer Start mit dem gespeicherten Stand (ein echtes Neuladen verliert unter file:// im Test-Browser manchmal den localStorage) */
  const stored = JSON.parse(await page.evaluate(() => localStorage.getItem('ngfc.v1')));
  ok(stored.gen[key1].du.length === sp.n, 'Selbsterklären: Die eigenen Worte liegen im gespeicherten Spielstand');
  const fresh = await openPage({ standing: stored, hash: L.id });
  await goTo(fresh.page, L.id, { t: 'slide', i: L.f1 });
  ok(!(await fresh.page.locator('.cp-se').count()) && (await pending(fresh.page)) === sp.n && (await fresh.page.locator('#stepBody .cp-you').count()) === sp.n && !fresh.problems.length, 'Selbsterklären: Nach einem neuen Start mit diesem Spielstand die Lösung samt eigenen Worten');
  await goTo(fresh.page, L.id, { t: 'story' });
  ok((await lines(fresh.page).count()) === L.story.length && !(await fresh.page.locator('#cpAccept').count()), 'Szene: Nach einem neuen Start ist sie im angefangenen Kapitel komplett');
  await fresh.browser.close();
  await goTo(page, L.id, { t: 'slide', i: L.withoutCode });
  ok(!(await page.locator('#stepBody .anno').count()) && (await visible(page, '#stepBody .say')), 'Folie ohne Code: kein leerer Code-Kasten');
  // ---- Folie mit Karten: erst selbst überlegen, dann aufdecken (Stand auf genau diese Folie, wie beim ersten Besuch)
  const preCards = (await st(page)).steps[L.id];
  await page.evaluate(x => { S.steps[x.id] = x.i + 1; route(); }, L.cards);
  ok((await visible(page, '.cp-se-cards')) && /Erst selbst überlegen/.test(await txt(page, '.cp-se')) && (await page.locator('.cp-se-in').count()) === L.cards.n && !(await visible(page, '#stepBody .points')), 'Karten-Folie: Nur die Begriffe stehen da, je ein Feld, die Karten sind verdeckt');
  ok((await page.locator('.cp-se-l label b').allTextContents()).join('|') === await page.evaluate(x => CH.find(c => c.id === x.id).slides[x.i].points.map(p => p[0]).join('|'), L.cards), 'Karten-Folie: Die Felder tragen die Begriffe der Karten');
  await page.click('#cpSeGo');
  ok(/geraten zählt auch/.test(await txt(page, '.cp-se-r')) && !(await visible(page, '#stepBody .points')), 'Karten-Folie: Leer auflösen geht nicht');
  for (let k = 0; k < L.cards.n; k++) await page.fill('#cpSe' + k, 'Vermutung ' + (k + 1));
  await page.click('#cpSeGo');
  ok((await visible(page, '#stepBody .points')) && (await page.locator('#stepBody .pk .cp-you').count()) === L.cards.n && !(await page.locator('.cp-se-in').count()), 'Karten-Folie: Auflösen zeigt die Karten, in jeder steht die eigene Vermutung');
  ok((await st(page)).gen[L.cards.id + ':' + L.cards.i].du[0] === 'Vermutung 1', 'Karten-Folie: Die Vermutungen sind gemerkt');
  await page.evaluate(([id, n]) => { S.steps[id] = n; save(); }, [L.id, preCards]);

  // ---- Doku-Links auf der letzten Folie: nur https, neuer Tab. „Mehr dazu“ zeigt nur das Profi-Wissen der Folie.
  await page.evaluate(id => { CH.find(c => c.id === id).docs = [['Signals im Überblick', 'https://angular.dev/guide/signals'], ['Unsicher', 'javascript:alert(1)'], ['RxJS', 'https://rxjs.dev/guide/overview'], 'kaputt']; }, L.id);
  await goTo(page, L.id, { t: 'slide', i: L.slides - 1 });
  const linkList = await page.locator('#stepBody .slide > .cp-docs-l a').evaluateAll(l => l.map(x => [x.firstChild.textContent, x.getAttribute('href'), x.target, x.rel]));
  ok(JSON.stringify(linkList) === JSON.stringify([['Signals im Überblick', 'https://angular.dev/guide/signals', '_blank', 'noopener'], ['RxJS', 'https://rxjs.dev/guide/overview', '_blank', 'noopener']]) && (await page.locator('#stepBody a.cp-docs:visible').count()) === 2 && (await txt(page, '#stepBody .slide > .cp-docs-t')) === 'Offizielle Doku', 'Letzte Folie zeigt die Doku-Links des Kapitels offen unter „Offizielle Doku“ (nur https, neuer Tab)');
  await goTo(page, L.id, { t: 'slide', i: L.f1 });
  await page.click('.cp-more summary');
  ok((await txt(page, '.cp-more p')) === L.pro && !(await page.locator('#stepBody a.cp-docs').count()), '„Mehr dazu“ zeigt das Profi-Wissen der Folie, keine Doku-Links');
  const withoutPro = await page.evaluate(([id, i]) => { const c = CH.find(c => c.id === id), s = c.slides[i], pro = s.pro; delete s.pro; window.jumpTo = { id, t: 'slide', i }; route(); const n = document.querySelectorAll('#stepBody .slide').length === 1 ? document.querySelectorAll('.cp-more').length : -1; s.pro = pro; return n; }, [L.id, L.f1]);
  ok(withoutPro === 0, 'Ohne Profi-Wissen entfällt „Mehr dazu“, auch wenn das Kapitel Doku-Links hat');

  // ---- Quiz: sofortige Auflösung, keine Sicherheitsfrage
  await goTo(page, L.id, { t: 'quiz', i: 0 });
  ok(await page.evaluate(() => currentSlide === null), 'Quiz: aktFolie ist wieder leer');
  ok((await page.locator('#stepBody .opt').count()) === 4 && !(await page.locator('.conf, .cf, .conf-slot').count()), 'Quiz: vier Antworten, keine Sicherheitsfrage');
  ok((await visible(page, '#nextStep')) && !(await page.locator('#main .btn.primary').count()), 'Quiz: Solange die Frage offen ist, ist „Weiter“ ein normaler Knopf');
  const question0 = await txt(page, '#stepBody .q');
  await page.click('#nextStep');
  ok((await visible(page, '#stepBody .quiz')) && (await txt(page, '#stepBody .q')) !== question0 && (await st(page)).quiz[L.id + ':0'] == null, 'Quiz: Überspringen geht, auch wenn „Weiter“ leise ist');
  await page.click('#prevStep');
  ok((await txt(page, '#stepBody .q')) === question0 && !(await page.locator('#stepBody .opt:disabled').count()) && !(await page.locator('#nextStep.primary').count()), 'Quiz: Die übersprungene Frage ist beim Zurückkommen noch offen');
  const calBefore = JSON.stringify((await st(page)).cal), xp0 = (await st(page)).xp;
  await page.click('#stepBody .opt[data-i="' + L.quiz[0].wrong + '"]');
  ok((await page.locator('#stepBody .opt.wrong:disabled').count()) === 1 && !(await page.locator('.conf, .cf').count()) && /Nicht ganz/.test(await txt(page, '.why')), 'Quiz: Falsche Antwort wird sofort rot, ohne Zwischenfrage');
  ok((await st(page)).quiz[L.id + ':0'] == null && !(await page.locator('#stepBody .opt.right').count()) && !(await page.locator('#nextStep.primary').count()), 'Quiz: Die Lösung wird dabei nicht verraten, „Weiter“ bleibt leise');
  await page.click('#stepBody .opt[data-i="' + L.quiz[0].correct + '"]');
  let s = await st(page);
  ok((await page.locator('#stepBody .opt.right').count()) === 1 && (await page.locator('#stepBody .opt:disabled').count()) === 4 && (await txt(page, '.why')).includes(L.quiz[0].why), 'Quiz: Richtige Antwort wird grün, die Begründung erscheint');
  ok(s.quiz[L.id + ':0'] === 2 && s.xp === xp0, 'Quiz: Im zweiten Anlauf richtig: gemerkt mit 2 Versuchen, kein XP');
  ok((await page.locator('#main .btn.primary').count()) === 1 && (await visible(page, '#nextStep.primary')), 'Quiz: Nach der richtigen Antwort wird „Weiter“ Hauptknopf');
  ok(/Du hattest .+ getippt/.test(await txt(page, '.why .pre-note')), 'Quiz: Die erste Frage löst den Vorab-Tipp auf');
  ok((await page.getAttribute('.why', 'aria-live')) === 'polite', 'Quiz: Auflösung wird angesagt (aria-live)');
  await page.click('#nextStep');
  /* Die Zifferntaste meint die Stelle am Bildschirm, nicht den Index aus den Daten */
  await page.keyboard.press((await txt(page, '#stepBody .opt[data-i="' + L.quiz[1].correct + '"] .key')).trim());
  s = await st(page);
  ok(s.quiz[L.id + ':1'] === 1 && s.xp === xp0 + 10 && (await page.locator('#stepBody .opt.right').count()) === 1, 'Quiz: Sofort richtig (per Zifferntaste) gibt 10 XP');
  ok(JSON.stringify(s.cal) === calBefore, 'Quiz: Die Sicherheits-Statistik bleibt dem Wiederholen überlassen');
  await page.click('#prevStep');
  ok((await page.locator('#stepBody .opt.right').count()) === 1 && (await page.locator('#stepBody .opt:disabled').count()) === 4 && (await visible(page, '#nextStep.primary')), 'Quiz: Eine beantwortete Frage ist beim Zurückblättern aufgelöst, „Weiter“ ist Hauptknopf');

  /* ================= Quiz mischen: Die Antworten stehen bei jedem Zeichnen in neuer Reihenfolge ================= */
  const e = await openPage({ hash: 'start' });
  const m = e.page;
  /* Was gerade zu sehen ist: Index aus den Daten, Tasten-Zahl und Stelle am Bildschirm je Antwort, in der Reihenfolge im Dokument */
  const image = sel => m.locator(sel + ' .opt').evaluateAll(l => l.map(b => { const r = b.getBoundingClientRect(); return { i: +b.dataset.i, key: b.querySelector('.key').textContent, y: Math.round(r.top), x: Math.round(r.left), right: b.classList.contains('right'), picked: b.classList.contains('picked'), off: b.disabled }; }));
  const okay = (b, n) => b.length === n && b.map(o => o.i).sort().join() === [...Array(n).keys()].join() && b.map(o => o.key).join() === b.map((o, k) => k + 1).join() && b.every((o, k) => !k || o.y > b[k - 1].y || (o.y === b[k - 1].y && o.x > b[k - 1].x));
  const mk = await m.evaluate(() => CH.filter(c => !c.custom && c.quiz.length).slice(0, 8).map(c => ({ id: c.id, n: c.quiz[0].options.length, correct: c.quiz[0].correct })));
  const spots = new Set(), follow = new Set(); let tidy = true;
  for (const k of mk) for (let n = 0; n < 4; n++) {
    await goTo(m, k.id, { t: 'quiz', i: 0 });
    const b = await image('#stepBody');
    if (!okay(b, k.n) || b.some(o => o.right || o.off)) tidy = false;
    spots.add(b.findIndex(o => o.i === k.correct)); follow.add(k.id + ':' + b.map(o => o.i).join(''));
  }
  ok(tidy, 'Quiz mischen: Jede Antwort ist genau einmal da, die Tasten-Zahlen sind 1 bis n in der Reihenfolge am Bildschirm');
  ok(spots.size > 1 && follow.size > mk.length, 'Quiz mischen: Die richtige Antwort steht nicht immer an derselben Stelle (Stellen: ' + [...spots].sort().join(', ') + ')');
  /* Klick über den Index aus den Daten: Es zählt die Antwort, nicht die Stelle */
  const k0 = mk[0], wrong0 = k0.correct === 0 ? 1 : 0;
  await goTo(m, k0.id, { t: 'quiz', i: 0 });
  await m.click('#stepBody .opt[data-i="' + wrong0 + '"]');
  ok((await m.locator('#stepBody .opt.wrong').count()) === 1 && (await m.locator('#stepBody .opt.wrong[data-i="' + wrong0 + '"]').count()) === 1 && !(await m.locator('#stepBody .opt.right').count()), 'Quiz mischen: Eine falsche Antwort bleibt falsch, egal wo sie steht');
  await m.click('#stepBody .opt[data-i="' + k0.correct + '"]');
  let mb = await image('#stepBody');
  ok((await st(m)).quiz[k0.id + ':0'] === 2 && mb.filter(o => o.right).length === 1 && mb.find(o => o.right).i === k0.correct, 'Quiz mischen: Ein Klick auf die richtige Antwort gilt, die Auflösung markiert genau sie');
  /* Zifferntaste: gemeint ist die Stelle am Bildschirm. Jede Taste trifft die Antwort, die dort steht. */
  let keyOk = true;
  for (const k of mk.slice(1, 6)) {
    await goTo(m, k.id, { t: 'quiz', i: 0 });
    mb = await image('#stepBody');
    const spot = mb.findIndex(o => o.i === k.correct);
    await m.keyboard.press(String(spot + 1));
    mb = await image('#stepBody');
    if (!((await st(m)).quiz[k.id + ':0'] === 1 && mb.filter(o => o.right).length === 1 && mb.find(o => o.right).i === k.correct && mb.every(o => o.off))) keyOk = false;
  }
  ok(keyOk, 'Quiz mischen: Die Zifferntaste wählt die Antwort an der sichtbaren Stelle');
  /* Schon beantwortet: Bei jedem Zeichnen ist genau die richtige Antwort markiert, auch wenn sie woanders steht */
  let solved = true; const spots2 = new Set();
  for (let n = 0; n < 8; n++) {
    await goTo(m, mk[1].id, { t: 'quiz', i: 0 });
    mb = await image('#stepBody');
    if (!(okay(mb, mk[1].n) && mb.filter(o => o.right).length === 1 && mb.find(o => o.right).i === mk[1].correct && mb.every(o => o.off))) solved = false;
    spots2.add(mb.findIndex(o => o.right));
  }
  ok(solved && spots2.size > 1, 'Quiz mischen: Die beantwortete Frage zeigt beim erneuten Öffnen immer die richtige Antwort');
  /* Vorab-Tipp: gemischt, gemerkt wird der Index aus den Daten, die Auflösung im Quiz nennt den getippten Text */
  const kt = mk[6], tip = (kt.correct + 1) % kt.n;
  await m.evaluate(id => { S.steps[id] = 1; delete S.pre[id]; }, kt.id);
  const tSpots = new Set(); let tClean = true;
  for (let n = 0; n < 8; n++) {
    await goTo(m, kt.id, { t: 'story' });
    mb = await image('#pretest');
    if (!okay(mb, kt.n) || mb.some(o => o.off || o.picked)) tClean = false;
    tSpots.add(mb.map(o => o.i).join(''));
  }
  ok(tClean && tSpots.size > 1, 'Vorab-Tipp mischen: Die Antworten stehen bei jedem Zeichnen neu, Tasten-Zahlen 1 bis n');
  const tipText = await m.evaluate(([id, j]) => stripHtml(CH.find(c => c.id === id).quiz[0].options[j]), [kt.id, tip]);
  await m.keyboard.press((await txt(m, '#pretest .opt[data-i="' + tip + '"] .key')).trim());
  ok((await st(m)).pre[kt.id] === tip, 'Vorab-Tipp mischen: Die Zifferntaste merkt die Antwort an der sichtbaren Stelle (Index aus den Daten)');
  await goTo(m, kt.id, { t: 'story' });
  mb = await image('#pretest');
  ok(okay(mb, kt.n) && mb.every(o => o.off) && mb.filter(o => o.picked).length === 1 && mb.find(o => o.picked).i === tip, 'Vorab-Tipp mischen: Der abgegebene Tipp bleibt an seiner Antwort markiert');
  await goTo(m, kt.id, { t: 'quiz', i: 0 });
  await m.click('#stepBody .opt[data-i="' + kt.correct + '"]');
  ok((await txt(m, '.why .pre-note b')) === tipText && /Jetzt weißt du es genauer/.test(await txt(m, '.why .pre-note')), 'Vorab-Tipp mischen: Die Auflösung nennt die getippte Antwort');
  ok(!e.problems.length, 'Quiz mischen: keine JavaScript-Fehler' + (e.problems.length ? ': ' + e.problems.join(' | ') : ''));
  await e.browser.close();

  // ---- Abschluss
  await page.evaluate(id => { CH.find(c => c.id === id).docs = [['Signals im Überblick', 'https://angular.dev/guide/signals']]; }, L.id);
  /* Geschafft zählt nur mit grüner Übung (pending.test.js prüft das Durchblättern). Hier gilt sie als gelöst. */
  if (L.ex) await page.evaluate(id => { const c = CH.find(x => x.id === id); S.ex[c.ex.id] = { passed: true, fails: 0 }; save(); }, L.id);
  const xp1 = (await st(page)).xp;
  await goTo(page, L.id, { t: 'end' });
  s = await st(page);
  ok(s.done[L.id] > 0 && s.xp === xp1 + L.xp, 'Abschluss: Kapitel gilt als geschafft, XP dafür (' + L.xp + ')');
  ok(L.quiz.every((q, i) => s.srs['q:' + L.id + ':' + i]) && s.srs['m:' + L.id] && s.srs['q:' + L.id + ':0'].due > Date.now(), 'Abschluss: Alle Quizfragen (auch die falsch beantwortete) und die Merksätze gehen in die Wiederholung');
  ok((await visible(page, '#dumpIn')) && /Was nimmst du mit\?/.test(await txt(page, '#dump')) && (await visible(page, '#dumpSkip')), 'Abschluss: erst „Was nimmst du mit?“, überspringbar');
  ok(/Kapitel geschafft/.test(await txt(page, '#cheerCard')) && !/geschafft/i.test(await txt(page, '#stepBody')) && (await txt(page, '#toast')).trim() === '+' + L.xp + ' XP' && (await page.locator('#stepBody .end > :first-child').getAttribute('id')) === 'dump',
    'Abschluss: „Kapitel geschafft“ steht einmal da (Jubel-Karte). Keine Überschrift, die Meldung nennt nur die XP');
  ok(!(await visible(page, '#nextStep')) && !(await page.locator('#stepBody .end li, #cpNext').count()), 'Abschluss: Merksätze und Knöpfe kommen erst danach, kein zweites „Weiter“');
  ok(!(await page.locator('#reflect, .reflect, .rf, #pauseBtn, #closeOut, #nextCh').count()), 'Abschluss: kein „Kurz innehalten“, kein „Für heute fertig“');
  await page.fill('#dumpIn', 'Signal <b>merken</b>');
  await page.click('#dumpGo');
  ok((await txt(page, '.mine')) === 'Signal <b>merken</b>' && !(await page.locator('#dump').count()), 'Abschluss: Die eigenen Stichworte stehen zum Vergleich da (als Text)');
  ok((await page.locator('#stepBody .end ul:not(.cp-docs-l) > li').count()) === L.takeaway, 'Abschluss: Merksätze (' + L.takeaway + ')');
  ok((await page.locator('#stepBody .end a.cp-docs').count()) === 1 && (await page.getAttribute('#stepBody .end a.cp-docs', 'target')) === '_blank', 'Abschluss: Doku-Links des Kapitels');
  ok((await page.getAttribute('#cpNext', 'href')) === '#' + L.nextItem && (await txt(page, '#cpNext')) === 'Nächstes Kapitel' && (await page.locator('#stepBody .btn.primary').count()) === 1, 'Abschluss: „Nächstes Kapitel“ ist der Hauptknopf');
  ok((await page.getAttribute('#cpHome', 'href')) === '#start' && (await txt(page, '#cpHome')) === 'Zum Schreibtisch', 'Abschluss: „Zum Schreibtisch“ daneben');
  ok(Object.keys((await st(page)).reflect || {}).length === 0, 'Abschluss: S.reflect bleibt unangetastet');
  await page.click('#prevStep'); await page.click('#nextStep');
  ok((await txt(page, '.cp-end-t')) === '✓ Geschafft' && (await upward(page, '.cp-end-t')) < 30 && !(await page.locator('#dumpIn').count()) && (await page.locator('#stepBody .end ul:not(.cp-docs-l) > li').count()) === L.takeaway && (await st(page)).xp === xp1 + L.xp, 'Abschluss: Beim zweiten Mal direkt die Merksätze, kein zweites XP');
  await page.evaluate(id => { delete CH.find(c => c.id === id).docs; }, L.id);

  // ---- Geschafftes Kapitel: Szene komplett, kein Selbsterklären
  await goTo(page, L.id, { t: 'story' });
  ok((await lines(page).count()) === L.story.length && (await visible(page, '.ticket')) && !(await page.locator('#cpAccept, .cp-say, .cp-all, .cp-plays').count()) && (await visible(page, '#nextStep.primary')), 'Geschafftes Kapitel: Szene steht sofort komplett da, mit „Weiter“');
  await page.evaluate(([id, i]) => { delete S.gen[id + ':' + i]; save(); }, [L.id, L.f1]);
  await goTo(page, L.id, { t: 'slide', i: L.f1 });
  ok(!(await page.locator('.cp-se').count()) && (await pending(page)) === sp.n, 'Geschafftes Kapitel: Folien zeigen die Erklärungen ohne Selbsterklären');
  ok((await page.locator('#cpPath .cp-ph-b i.full').count()) === stepList - 1, 'Rahmen: Im geschafften Kapitel sind alle Schritte gefüllt');
  ok(!(await page.locator('#cpPath .cp-ph:disabled').count()), 'Rahmen: Im geschafften Kapitel ist jeder Abschnitt anklickbar');
  await page.click('#cpPath .cp-ph >> nth=2');
  ok((await visible(page, '#stepBody .quiz')) && /^Quiz/.test((await txt(page, '#cpPath .cp-ph.active')).trim()), 'Rahmen: Klick auf einen Abschnitt springt dorthin');
  await page.evaluate(() => { location.hash = 'start'; });
  await page.waitForFunction(() => !document.querySelector('#stepBody'));
  ok(await page.evaluate(() => currentSlide === null), 'Rahmen: Nach dem Verlassen des Kapitels ist aktFolie leer');

  // ---- „Nächstes Kapitel“ führt in die nächste Szene
  await goTo(page, L.id, { t: 'end' });
  await page.click('#cpNext');
  await page.waitForFunction(id => location.hash === '#' + id && document.querySelector('#stepBody .cp-chat'), L.nextItem);
  ok(await page.evaluate(id => S.done[id] ? true : !!document.querySelector('#stepBody .cp-plays'), L.nextItem), '„Nächstes Kapitel“ öffnet das nächste Kapitel mit seiner Szene');

  // ---- Szene ohne eigene Zeile: Klick und Leertaste holen die nächste Nachricht, „Alles zeigen“, Pfeil rechts
  await page.evaluate(id => { delete S.steps[id]; delete S.done[id]; }, L.chat.id);
  await goTo(page, L.chat.id);
  await page.waitForSelector('.cp-typing:visible');
  ok((await txt(page, '.cp-typing')).includes(L.chat.name + ' schreibt') && (await lines(page).count()) === L.chat.firstOne, 'Szene: „' + L.chat.name + ' schreibt“ steht vor der Nachricht');
  await page.keyboard.press('Space');
  ok((await lines(page).count()) === L.chat.firstOne + 1, 'Szene: Leertaste holt die nächste Nachricht sofort');
  await page.click('.cp-chat', { position: { x: 30, y: 12 } });
  ok(L.chat.firstOne + 2 < L.chat.n && (await lines(page).count()) === L.chat.firstOne + 2, 'Szene: Klick in den Chat holt die nächste Nachricht');
  await page.click('.cp-all');
  ok((await lines(page).count()) === L.chat.n && (await visible(page, '#cpAccept')), 'Szene: „Alles zeigen“ überspringt das Abspielen bis zum Ticket');
  ok(await page.locator('#stepBody .line:not(.me) .av img.fig-av').count() > 0, 'Szene: Das Team spricht mit Pixel-Gesichtern statt Buchstaben');
  await page.dblclick('#cpAccept');
  ok((await visible(page, '#pretest')) && (await page.locator('.cp-stamp').count()) === 1, 'Szene: Doppelklick auf „Ticket annehmen“ nimmt nur einmal an');
  await page.evaluate(id => { delete S.steps[id]; delete S.pre[id]; }, L.chat.id);
  await goTo(page, L.chat.id);
  /* „Weiter“ ist solange ausgeblendet, Pfeil rechts geht trotzdem denselben Weg: erst alles zeigen, dann annehmen, dann blättern */
  await page.keyboard.press('ArrowRight');
  ok((await lines(page).count()) === L.chat.n && (await visible(page, '#cpAccept')) && !(await visible(page, '.slide')) && !(await visible(page, '#nextStep')), 'Szene: Pfeil rechts zeigt beim Abspielen erst alles, „Weiter“ bleibt weg');
  await page.keyboard.press('ArrowRight');
  ok((await visible(page, '#pretest')) && !(await page.locator('#cpAccept').count()) && (await visible(page, '#nextStep.primary')) && (await st(page)).steps[L.chat.id] === 0, 'Szene: Der nächste Pfeil rechts nimmt das Ticket an, jetzt ist „Weiter“ da');
  await page.click('#nextStep');
  ok(await visible(page, '#stepBody .slide'), 'Szene: Dann geht „Weiter“ zur Folie, der Tipp ist freiwillig');
  // Ohne Animationen erscheint alles sofort
  await page.evaluate(id => { delete S.steps[id]; }, L.chat.id);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await goTo(page, L.chat.id);
  ok((await lines(page).count()) === L.chat.n && (await visible(page, '#cpAccept')) && !(await page.locator('.cp-in').count()), 'Ohne Animationen: Szene und Ticket stehen sofort da');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  // ---- Besondere Folien
  await page.evaluate(x => { S.gen[x.id + ':' + x.i] = 1; delete S.done[x.id]; if (S.codeLine) delete S.codeLine[x.id + ':' + x.i]; }, L.alt);
  await goTo(page, L.alt.id, { t: 'slide', i: L.alt.i });
  ok(!(await page.locator('.cp-se').count()) && (await pending(page)) > 0 && !(await page.locator('#stepBody .cp-you').count()), 'Alter Spielstand: Früher selbst erklärte Folien (S.gen = 1) zeigen die Erklärungen sofort');
  await page.evaluate(x => { delete S.gen[x.id + ':' + x.i]; S.codeLine = { [x.id + ':' + x.i]: { ok: 2, problems: 0 } }; }, L.alt);
  await goTo(page, L.alt.id, { t: 'slide', i: L.alt.i });
  ok(!(await page.locator('.cp-se').count()) && (await pending(page)) > 0, 'Alter Spielstand: Folien aus dem früheren Mini-Spiel (S.zeile) zeigen die Erklärungen sofort');
  await page.evaluate(x => { delete S.done[x.id]; if (S.codeLine) delete S.codeLine[x.id + ':' + x.i]; }, L.tag);
  await goTo(page, L.tag.id, { t: 'slide', i: L.tag.i });
  const dayIdx = await page.evaluate(() => [...document.querySelectorAll('#stepBody .acode .lx')].findIndex(e => LEX[+e.dataset.lx].html && e.textContent.trim() in HTML_TAG));
  ok(dayIdx >= 0, 'HTML-Tags im Code sind unterstrichen');
  await page.locator('#stepBody .acode .lx').nth(dayIdx).click();
  ok(/^<\w+>$/.test((await txt(page, '.lexpop .lc-k')).trim()) && (await visible(page, '.lexpop .el-what')) && (await page.locator('.lexpop').count()) === 1 && !(await page.locator('.htmlside, .lexpop .el-deep').count()), 'HTML-Tag öffnet dieselbe kleine Karte, ohne Seitenkasten und ohne KI-Knopf');
  await page.click('.lexpop .lp-x');
  ok(!(await visible(page, '.lexpop')), 'Wort-Karte: × schließt sie');

  // ---- Suche springt weiter auf eine Folie (jumpTo), letztes Kapitel hat nur den Weg zum Schreibtisch
  await page.evaluate(id => { window.jumpTo = { id, t: 'slide', i: 1 }; location.hash = id; }, L.id);
  await page.waitForFunction(id => location.hash === '#' + id && document.querySelector('#stepBody .slide'), L.id);
  ok((await txt(page, '#stepBody .sl-title')) === await page.evaluate(id => CH.find(c => c.id === id).slides[1].t, L.id) && await page.evaluate(() => window.jumpTo === null), 'sprungZu öffnet die gewünschte Folie');
  // Nachschlagen: Ein Sprung der Suche in ein Kapitel, das man noch nicht kennt, merkt sich nichts und schafft nichts
  const xpN = (await st(page)).xp;
  await page.evaluate(id => { delete S.steps[id]; window.jumpTo = { id, t: 'end' }; location.hash = id; }, L.lastItem);
  await page.waitForFunction(id => location.hash === '#' + id && document.querySelector('#stepBody .end'), L.lastItem);
  s = await st(page);
  ok(!s.done[L.lastItem] && !s.steps[L.lastItem] && s.xp === xpN && !(await page.locator('#dumpIn, .cp-end-t, #cpNext').count()) && (await page.locator('#stepBody .end li').count()) > 0, 'Nachschlagen: Ein Merksatz-Treffer zeigt die Merksätze, das Kapitel ist damit weder angefangen noch geschafft');
  await page.click('#prevStep');
  ok(!(await st(page)).steps[L.lastItem] && !(await page.locator('#stepBody .end').count()), 'Nachschlagen: Auch das Blättern von dort merkt sich keinen Schritt');
  await page.click('#cpPath .cp-ph >> nth=0'); await page.click('.cp-all'); await page.click('#cpAccept');
  if (await page.locator('#pretest').count()) await page.click('#nextStep');
  ok((await st(page)).steps[L.lastItem] === 1 && (await visible(page, '#stepBody .slide')), 'Nachschlagen: Wer zurück zum Ticket geht und es annimmt, fängt das Kapitel normal an');
  // Im angefangenen Kapitel zählt ein Sprung der Suche wie Blättern: Der Stand geht mit und übersteht das Neuzeichnen
  const leap = await page.evaluate(id => { const c = CH.find(c => c.id === id); window.jumpTo = { id, t: 'quiz', i: 0 }; route(); document.querySelector('#nextStep').click(); const after = S.steps[id]; route(); return { after, quiz: 1 + c.slides.length, where: document.querySelector('#stepQuiet').textContent }; }, L.lastItem);
  ok(leap.after === leap.quiz + 1 && new RegExp('Schritt ' + (leap.quiz + 2) + ' von ').test(leap.where), 'Nachschlagen im angefangenen Kapitel: Wer von dort weiterspielt, behält seinen Stand (' + leap.where + ')');
  // Nachschlagen auf einer Folie mit Code: Die Erklärungen stehen gleich da, das Selbsterklären bleibt für den echten Besuch
  const after = await page.evaluate(() => {
    for (const c of CH) {
      if (c.custom || S.done[c.id] || S.steps[c.id]) continue;
      const i = c.slides.findIndex((s, i) => s.code && s.notes && s.notes.length && !(S.codeLine || {})[c.id + ':' + i] && !(S.gen || {})[c.id + ':' + i]);
      if (i >= 0) return { id: c.id, i, n: c.slides[i].notes.length };
    }
  });
  await page.evaluate(x => { window.jumpTo = { id: x.id, t: 'slide', i: x.i }; location.hash = x.id; }, after);
  await page.waitForFunction(id => location.hash === '#' + id && document.querySelector('#stepBody .slide'), after.id);
  s = await st(page);
  ok(!(await page.locator('.cp-se').count()) && (await pending(page)) === after.n && !(s.gen || {})[after.id + ':' + after.i] && !s.steps[after.id], 'Nachschlagen: Eine Folie mit Code zeigt die Erklärungen sofort, ohne Selbsterklären, und merkt sich nichts');
  await goTo(page, after.id, { t: 'slide', i: after.i });
  ok((await page.locator('.cp-se').count()) === 1 && (await pending(page)) === 0, 'Nachschlagen: Beim echten Besuch der Folie wartet das Selbsterklären noch');
  // Nachschlagen und von dort bis zum Abschluss blättern: Das Kapitel ist geschafft, der Schritt gemerkt, die Fortschrittsanzeige voll und frei
  const through = await page.evaluate(() => { const c = CH.find(c => !c.custom && !c.ex && !S.done[c.id] && !S.steps[c.id] && c.quiz.length && CH.indexOf(c) < CH.length - 1); return { id: c.id, q: c.quiz.length - 1, lastOne: buildSteps(c).length - 1, matching: hasMatching(c) }; });
  await page.evaluate(x => { window.jumpTo = { id: x.id, t: 'quiz', i: x.q }; location.hash = x.id; }, through);
  await page.waitForFunction(id => location.hash === '#' + id && document.querySelector('#stepBody .quiz'), through.id);
  const blocked = await page.locator('#cpPath .cp-ph:disabled').count();
  /* Ohne Übung zählt das Quiz: Alle Fragen sind richtig beantwortet (pending.test.js prüft den Fall ohne) */
  await page.evaluate(x => { CH.find(c => c.id === x.id).quiz.forEach((q, i) => { S.quiz[x.id + ':' + i] = 1; }); save(); }, through);
  await page.click('#nextStep');
  /* Nach dem Quiz kommt das Zuordnen, es ist kein Muss: weiterblättern */
  if (through.matching) { await page.waitForSelector('#stepBody .match'); await page.click('#nextStep'); }
  s = await st(page);
  ok(blocked > 0 && !!s.done[through.id] && s.steps[through.id] === through.lastOne && (await visible(page, '#dumpIn')) && !(await page.locator('#cpPath .cp-ph:disabled').count()) && !(await page.locator('#cpPath .cp-ph-b i:not(.full):not(.active)').count()),
    'Nachschlagen: Wer von dort bis zum Abschluss blättert, hat das Kapitel geschafft, mit gemerktem Schritt und voller, freier Fortschrittsanzeige');
  await page.evaluate(id => { const c = CH.find(x => x.id === id); c.quiz.forEach((q, i) => { S.quiz[id + ':' + i] = 1; }); if (c.ex) S.ex[c.ex.id] = { passed: true, fails: 0 }; save(); }, L.lastItem);
  await goTo(page, L.lastItem, { t: 'end' });
  await page.click('#dumpSkip');
  ok(!(await page.locator('#cpNext').count()) && (await page.locator('#cpHome.primary').count()) === 1, 'Letztes Kapitel: „Zum Schreibtisch“ ist der Hauptknopf');
  ok(!a.problems.length, 'Neuer Nutzer: keine JavaScript-Fehler' + (a.problems.length ? ': ' + a.problems.join(' | ') : ''));
  await a.browser.close();

  /* ================= 2. Alter Spielstand (Format vor dem Umbau: ohne S.codeLine, mit S.gen und S.reflect) ================= */
  const finished = L.id, begun = L.nextItem, day0 = Date.now() - 5 * 864e5;
  const standing = { player: { name: 'Kerim', start: day0 }, xp: 640, steps: { [begun]: 2 }, done: { [finished]: day0 }, quiz: { [finished + ':0']: 1 }, ex: {}, code: {}, days: [], badges: [], updated: day0, srs: {},
    cal: { sr: 3, sw: 1, ur: 1, uw: 1 }, pre: {}, gen: { [begun + ':0']: 1 }, reflect: { [finished]: 1 }, profile: {}, customChapters: {}, arena: { bug: {}, out: {}, rev: {}, iv: [] } };
  const b = await openPage({ standing, hash: begun });
  await b.page.waitForSelector('#stepBody > *');
  ok(/Schritt 3 von/.test(await txt(b.page, '#stepQuiet')) && (await st(b.page)).steps[begun] === 2, 'Alter Spielstand: Angefangenes Kapitel öffnet am gemerkten Schritt');
  await goTo(b.page, begun, { t: 'story' });
  ok(!(await b.page.locator('#cpAccept, .cp-plays').count()) && (await visible(b.page, '.ticket')), 'Alter Spielstand: Szene des angefangenen Kapitels ist komplett');
  await goTo(b.page, finished, { t: 'slide', i: L.f1 });
  ok(!(await b.page.locator('.cp-se').count()) && (await pending(b.page)) === sp.n, 'Alter Spielstand: Geschaffte Kapitel ohne Selbsterklären');
  /* Offenes Kapitel, das laut Spielstand schon hinter der Folie mit Code war: Zurückblättern zeigt die Erklärungen */
  await b.page.evaluate(x => { S.steps[x.id] = x.i + 2; delete S.done[x.id]; location.hash = x.id; }, L.alt);
  await b.page.waitForFunction(id => location.hash === '#' + id && document.querySelector('#stepBody > *'), L.alt.id);
  await b.page.click('#prevStep');
  ok((await txt(b.page, '#stepBody .sl-title')) === await b.page.evaluate(x => CH.find(c => c.id === x.id).slides[x.i].t, L.alt) && !(await b.page.locator('.cp-se').count()) && (await b.page.locator('#stepBody .notes li:not(:visible)').count()) === 0,
    'Alter Spielstand: Eine Folie, die schon hinter einem lag, zeigt die Erklärungen gleich');
  await b.page.evaluate(x => { S.steps[x.id] = 99; window.jumpTo = { id: x.id, t: 'story' }; route(); }, L.alt);
  ok((await b.page.locator('#cpPath .cp-ph').count()) >= 4 && !(await b.page.locator('#cpPath .cp-ph:disabled').count()), 'Alter Spielstand: Ein gemerkter Schritt jenseits des Kapitels sperrt keinen Abschnitt');
  await goTo(b.page, finished, { t: 'end' });
  const s2 = await st(b.page);
  ok((await txt(b.page, '.cp-end-t')) === '✓ Geschafft' && s2.xp === 640 && s2.done[finished] === day0 && JSON.stringify(s2.reflect) === JSON.stringify(standing.reflect), 'Alter Spielstand: Abschluss ändert weder XP noch Datum noch S.reflect');
  ok(!b.problems.length, 'Alter Spielstand: keine JavaScript-Fehler' + (b.problems.length ? ': ' + b.problems.join(' | ') : ''));
  await b.browser.close();

  /* ================= 3. Handy, 360 px breit ================= */
  const c = await openPage({ hash: 'start', viewport: { width: 360, height: 740 } });
  const p = c.page;
  await goTo(p, L.id);
  await p.waitForSelector('.cp-say:visible');
  ok((await noSideScroll(p)) && (await upward(p, '.cp-say')) >= 40 && (await upward(p, '.cp-all')) >= 40 && (await upward(p, '#cpPath .cp-ph')) >= 40 && (await upward(p, '.loc a')) >= 40, 'Handy: Szene ohne Querscrollen, Tippflächen mindestens 40 px');
  await p.click('.cp-say'); await p.click('.cp-all');
  ok((await noSideScroll(p)) && (await upward(p, '#cpAccept')) >= 40, 'Handy: Ticket ohne Querscrollen');
  await goTo(p, L.id, { t: 'slide', i: L.f1 });
  ok((await noSideScroll(p)) && (await upward(p, '#cpSeX')) >= 40 && (await upward(p, '#cpSeGo')) >= 40 && (await upward(p, '.cp-se-in')) >= 40 && (await upward(p, '.cp-more summary')) >= 40, 'Handy: Folie mit Selbsterklären ohne Querscrollen, Tippflächen mindestens 40 px');
  for (let k = 0; k < sp.n; k++) await p.fill('#cpSe' + k, 'Idee ' + (k + 1));
  await p.click('#cpSeGo');
  ok((await pending(p)) === sp.n && (await noSideScroll(p)), 'Handy: Vergleichen zeigt die Lösung ohne Querscrollen');
  /* Lange Wörter ohne Leerzeichen (Fachbegriffe, Aufrufe) dürfen die Seite nicht breiter machen */
  await p.evaluate(([id, i]) => {
    const long = 'platformBrowserDynamic().bootstrapModule(AppModule).' + 'x'.repeat(40), c = CH.find(c => c.id === id), s = c.slides[i];
    s.pro += ' ' + long; s.say += ' ' + long; s.job = (s.job || '') + ' ' + long; s.notes[0][1] += ' ' + long; s.t += ' ' + long;
    c.quiz[0].options[0] += long; c.quiz[0].why += ' ' + long; c.takeaway[0] += ' ' + long; c.ticket.text += ' ' + long; c.story[0][1] += ' ' + long;
    c.docs = [[long, 'https://angular.dev/' + long]];
  }, [L.id, L.f1]);
  await goTo(p, L.id, { t: 'story' });
  ok(await noSideScroll(p), 'Handy: Szene und Ticket mit sehr langen Wörtern ohne Querscrollen');
  await goTo(p, L.id, { t: 'slide', i: L.f1 });
  await p.click('.cp-more summary');
  ok((await noSideScroll(p)) && (await pending(p)) === sp.n, 'Handy: Folie mit „Mehr dazu“ und sehr langen Wörtern ohne Querscrollen');
  await goTo(p, L.id, { t: 'quiz', i: 0 });
  ok((await noSideScroll(p)) && (await upward(p, '#stepBody .opt')) >= 40, 'Handy: Quiz ohne Querscrollen');
  await p.click('#stepBody .opt[data-i="' + L.quiz[0].correct + '"]');
  ok(await noSideScroll(p), 'Handy: Auflösung ohne Querscrollen');
  if (L.ex) await p.evaluate(id => { const c = CH.find(x => x.id === id); S.ex[c.ex.id] = { passed: true, fails: 0 }; save(); }, L.id);
  await goTo(p, L.id, { t: 'end' });
  await p.click('#dumpSkip');
  ok((await noSideScroll(p)) && (await upward(p, '#cpNext')) >= 40 && (await upward(p, '#cpHome')) >= 40, 'Handy: Abschluss ohne Querscrollen');
  /* Touch: Die Felder zum Selbsterklären sind groß genug, Schrift ab 16 px (sonst zoomt iOS beim Antippen) */
  const d = await openPage({ hash: 'start', mobile: true });
  await goTo(d.page, L.id, { t: 'slide', i: L.f2 });
  ok((await upward(d.page, '#stepBody .cp-se-in')) >= 40 && (await d.page.locator('#stepBody .cp-se-in').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))) >= 16 && !d.problems.length, 'Touch: Felder zum Selbsterklären mindestens 40 px hoch, Schrift ab 16 px');
  await d.browser.close();

  await ending(c.browser, c.problems);
  console.log('\nAlles grün');
})();
