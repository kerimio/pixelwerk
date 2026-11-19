/* ===== Zuordnen: links Begriffe, rechts Aussagen, die passenden Paare finden =====
   Eine Abwechslung zum Quiz. Die Paare stehen im Kapitel: paare: [[links, rechts], …], 3 bis 6 Stück, HTML wie im Quiz (<code>).
   Jede Aussage rechts passt zu genau einem Begriff links.
   Bedienung: einen Begriff antippen, dann die Aussage (oder andersherum). Passt es, bleibt das Paar mit gleicher Nummer und Farbe
   stehen. Passt es nicht, wackeln beide kurz, und es zählt als Fehler. Alles mit Tastatur bedienbar, die Zahlentasten bleiben frei.
   Wo es vorkommt:
   - im Kapitel als Schritt „Zuordnen“ nach dem Quiz (chapter.js). Gemerkt in S.matching[kapitel] = Fehler im ersten Durchgang.
   - beim Wiederholen als Karte z:<kapitel> (learning.js): 0 Fehler = sitzt, 1 Fehler = wackelig, ab 2 = daneben.
   - in freien Runden und beim Üben eines Themas, Fehler dort in S.weak['<kapitel>:zu'] wie bei Quizfragen.
   Fehler zählen fürs Thema wie falsche Quizantworten (strengths.js). */
/* Als function deklariert: base.js braucht hasMatching schon beim Laden des Spielstands (shiftMatchSteps) */
function matchPairs(ch) { return (ch && Array.isArray(ch.pairs) ? ch.pairs : []).filter(p => Array.isArray(p) && typeof p[0] === 'string' && typeof p[1] === 'string' && p[0] && p[1]).slice(0, 6); }
function hasMatching(ch) { return matchPairs(ch).length >= 3; }
/* Fehler einer Runde → Bewertung wie beim Wiederholen: 2 = sitzt, 1 = wackelig, 0 = daneben */
const matchGrade = f => f === 0 ? 2 : f === 1 ? 1 : 0;
const matchErrorText = f => f === 0 ? 'ohne Fehler' : f === 1 ? 'mit 1 Fehler' : 'mit ' + f + ' Fehlern';

/* Das Spiel in host. opts.fertig(fehler) kommt einmal, wenn alle Paare stehen. opts.geloest = gleich aufgelöst zeigen
   (Kapitel schon gespielt). Rückgabe: { fehler() } */
function matchGame(host, pairs, opts) {
  opts = opts || {};
  const n = pairs.length, linkList = shuffle(pairs.map((p, i) => i)), rightList = shuffle(pairs.map((p, i) => i));
  /* Höchstens ein Paar steht zufällig auf gleicher Höhe, sonst wäre es zu leicht */
  for (let t = 0; t < 20 && rightList.filter((x, k) => x === linkList[k]).length > 1; t++) shuffle(rightList);
  const card = (s, i) => `<li><button type="button" class="match-k" data-s="${s}" data-p="${i}" aria-pressed="false"><span class="match-n" aria-hidden="true"></span><span class="match-t">${leHtml(pairs[i][s === 'l' ? 0 : 1])}</span></button></li>`;
  host.innerHTML = `<div class="match">
    <p class="match-h">${opts.solved ? 'So gehören sie zusammen.' : 'Tipp links einen Begriff an, dann rechts die passende Aussage.'}</p>
    <div class="match-field">
      <ul class="match-col match-left" aria-label="Begriffe">${linkList.map(i => card('l', i)).join('')}</ul>
      <ul class="match-col match-right" aria-label="Aussagen">${rightList.map(i => card('r', i)).join('')}</ul>
    </div>
    <p class="match-msg" role="status" aria-live="polite"></p>
  </div>`;
  const box = $('.match', host), msg = $('.match-msg', box), ks = [...box.querySelectorAll('.match-k')];
  const partner = b => ks.find(x => x !== b && x.dataset.p === b.dataset.p);
  const text = b => $('.match-t', b).textContent;
  let choice = null, problems = 0, pairNo = 0, finished = false;
  const pick = b => {
    if (choice) { choice.classList.remove('match-active'); choice.setAttribute('aria-pressed', 'false'); }
    choice = b || null;
    if (choice) { choice.classList.add('match-active'); choice.setAttribute('aria-pressed', 'true'); }
    box.dataset.choice = choice ? choice.dataset.s : '';
  };
  const firm = (a, b, still) => {
    pairNo++;
    [a, b].forEach(x => {
      x.classList.add('match-ok'); x.disabled = true; x.setAttribute('aria-pressed', 'false');
      x.dataset.nr = pairNo; $('.match-n', x).textContent = pairNo;
      x.setAttribute('aria-label', 'Paar ' + pairNo + ': ' + text(x));
      if (!still) cheerHop(x);
    });
  };
  const ending = still => {
    finished = true; box.classList.add('match-done');
    if (!still) msg.textContent = 'Alle ' + n + ' Paare gefunden, ' + matchErrorText(problems) + '.';
    if (opts.finished) opts.finished(problems);
  };
  if (opts.solved) {
    linkList.forEach(i => { const a = ks.find(x => x.dataset.s === 'l' && +x.dataset.p === i); firm(a, partner(a), true); });
    ending(true);
    return { problems: () => problems };
  }
  ks.forEach(b => b.onclick = e => {
    if (finished || b.disabled || e.detail > 1) return;
    if (!choice || choice === b) { pick(choice === b ? null : b); return; }
    if (choice.dataset.s === b.dataset.s) { pick(b); return; }
    const a = choice; pick(null);
    const l = a.dataset.s === 'l' ? a : b, r = l === a ? b : a;
    if (a.dataset.p === b.dataset.p) {
      firm(l, r); cheerSound('klein');
      if (pairNo === n) { ending(); return; }
      msg.textContent = 'Passt: ' + text(l) + ' · ' + text(r);
      /* Weiter mit dem nächsten offenen Begriff auf derselben Seite, wenn die Tastatur gerade im Spiel ist */
      const proceed = ks.find(x => x.dataset.s === b.dataset.s && !x.disabled) || ks.find(x => !x.disabled);
      if (proceed && box.contains(document.activeElement)) proceed.focus({ preventScroll: true });
    } else {
      problems++; cheerMiss();
      msg.textContent = 'Passt nicht: ' + text(l) + ' · ' + text(r) + '. Versuch es nochmal.';
      [a, b].forEach(x => { x.classList.remove('match-no'); void x.offsetWidth; x.classList.add('match-no'); });
      setTimeout(() => [a, b].forEach(x => x.classList.remove('match-no')), 700);
    }
  });
  return { problems: () => problems };
}

/* ---------- Im Kapitel: Schritt „Zuordnen“ nach dem Quiz ----------
   Der erste Durchgang zählt: S.matching[kapitel] = Fehler. Ohne Fehler +10 XP wie eine Quizfrage, die sofort sitzt.
   Später steht das Spiel aufgelöst da, „Nochmal mischen“ spielt es ohne Wertung erneut. */
function renderMatching(body, ch) {
  const pairs = matchPairs(ch), wasThere = (S.matching || {})[ch.id];
  body.innerHTML = '<div class="match-cp"><h2 class="q">Was gehört zusammen?</h2><div class="match-host"></div><div class="match-below"></div></div>';
  const host = $('.match-host', body), below = $('.match-below', body), next = $('#nextStep');
  const retry = () => {
    below.innerHTML = '<p class="match-act"><button type="button" class="linkbtn" id="matchAgain">Nochmal mischen</button></p>';
    $('#matchAgain', below).onclick = () => { below.innerHTML = ''; matchGame(host, pairs, { finished: f => { if (!f) cheerCorrect($('.match-msg', host)); retry(); } }); $('.match-k', host).focus({ preventScroll: true }); };
  };
  if (wasThere != null) { matchGame(host, pairs, { solved: true }); retry(); return; }
  matchGame(host, pairs, {
    finished: f => {
      S.matching = S.matching || {}; S.matching[ch.id] = f;
      if (!f) { cheerCorrect($('.match-msg', host)); addXp(10, 'Alles richtig zugeordnet'); } else save();
      if (next) { next.classList.add('primary'); cpFocus(next); }
      retry();
    }
  });
}

/* ---------- Beim Wiederholen, in freien Runden und beim Üben: eine Karte z:<kapitel> ----------
   label: die Zeile über der Karte. fertig(fehler) nach dem letzten Paar. */
function matchCard(body, ch, label, finished) {
  body.innerHTML = `<div class="learn-card">${label}<h2 class="learn-question" tabindex="-1">Was gehört zusammen?</h2><div class="match-host"></div></div>`;
  matchGame($('.match-host', body), matchPairs(ch), { finished });
}
