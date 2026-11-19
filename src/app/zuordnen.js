/* ===== Zuordnen: links Begriffe, rechts Aussagen, die passenden Paare finden =====
   Eine Abwechslung zum Quiz. Die Paare stehen im Kapitel: paare: [[links, rechts], …], 3 bis 6 Stück, HTML wie im Quiz (<code>).
   Jede Aussage rechts passt zu genau einem Begriff links.
   Bedienung: einen Begriff antippen, dann die Aussage (oder andersherum). Passt es, bleibt das Paar mit gleicher Nummer und Farbe
   stehen. Passt es nicht, wackeln beide kurz, und es zählt als Fehler. Alles mit Tastatur bedienbar, die Zahlentasten bleiben frei.
   Wo es vorkommt:
   - im Kapitel als Schritt „Zuordnen“ nach dem Quiz (kapitel.js). Gemerkt in S.zu[kapitel] = Fehler im ersten Durchgang.
   - beim Wiederholen als Karte z:<kapitel> (lernen.js): 0 Fehler = sitzt, 1 Fehler = wackelig, ab 2 = daneben.
   - in freien Runden und beim Üben eines Themas, Fehler dort in S.weak['<kapitel>:zu'] wie bei Quizfragen.
   Fehler zählen fürs Thema wie falsche Quizantworten (staerken.js). */
/* Als function deklariert: basis.js braucht zuHat schon beim Laden des Spielstands (zuSchritteVerschieben) */
function zuPaare(ch) { return (ch && Array.isArray(ch.paare) ? ch.paare : []).filter(p => Array.isArray(p) && typeof p[0] === 'string' && typeof p[1] === 'string' && p[0] && p[1]).slice(0, 6); }
function zuHat(ch) { return zuPaare(ch).length >= 3; }
/* Fehler einer Runde → Bewertung wie beim Wiederholen: 2 = sitzt, 1 = wackelig, 0 = daneben */
const zuNote = f => f === 0 ? 2 : f === 1 ? 1 : 0;
const zuFehlerText = f => f === 0 ? 'ohne Fehler' : f === 1 ? 'mit 1 Fehler' : 'mit ' + f + ' Fehlern';

/* Das Spiel in host. opts.fertig(fehler) kommt einmal, wenn alle Paare stehen. opts.geloest = gleich aufgelöst zeigen
   (Kapitel schon gespielt). Rückgabe: { fehler() } */
function zuSpiel(host, paare, opts) {
  opts = opts || {};
  const n = paare.length, links = shuffle(paare.map((p, i) => i)), rechts = shuffle(paare.map((p, i) => i));
  /* Höchstens ein Paar steht zufällig auf gleicher Höhe, sonst wäre es zu leicht */
  for (let t = 0; t < 20 && rechts.filter((x, k) => x === links[k]).length > 1; t++) shuffle(rechts);
  const karte = (s, i) => `<li><button type="button" class="zu-k" data-s="${s}" data-p="${i}" aria-pressed="false"><span class="zu-n" aria-hidden="true"></span><span class="zu-t">${leHtml(paare[i][s === 'l' ? 0 : 1])}</span></button></li>`;
  host.innerHTML = `<div class="zu">
    <p class="zu-h">${opts.geloest ? 'So gehören sie zusammen.' : 'Tipp links einen Begriff an, dann rechts die passende Aussage.'}</p>
    <div class="zu-feld">
      <ul class="zu-sp zu-links" aria-label="Begriffe">${links.map(i => karte('l', i)).join('')}</ul>
      <ul class="zu-sp zu-rechts" aria-label="Aussagen">${rechts.map(i => karte('r', i)).join('')}</ul>
    </div>
    <p class="zu-msg" role="status" aria-live="polite"></p>
  </div>`;
  const box = $('.zu', host), msg = $('.zu-msg', box), ks = [...box.querySelectorAll('.zu-k')];
  const gegen = b => ks.find(x => x !== b && x.dataset.p === b.dataset.p);
  const text = b => $('.zu-t', b).textContent;
  let wahl = null, fehler = 0, paar = 0, fertig = false;
  const waehle = b => {
    if (wahl) { wahl.classList.remove('zu-an'); wahl.setAttribute('aria-pressed', 'false'); }
    wahl = b || null;
    if (wahl) { wahl.classList.add('zu-an'); wahl.setAttribute('aria-pressed', 'true'); }
    box.dataset.wahl = wahl ? wahl.dataset.s : '';
  };
  const fest = (a, b, still) => {
    paar++;
    [a, b].forEach(x => {
      x.classList.add('zu-ok'); x.disabled = true; x.setAttribute('aria-pressed', 'false');
      x.dataset.nr = paar; $('.zu-n', x).textContent = paar;
      x.setAttribute('aria-label', 'Paar ' + paar + ': ' + text(x));
      if (!still) jubelHuepf(x);
    });
  };
  const ende = still => {
    fertig = true; box.classList.add('zu-fertig');
    if (!still) msg.textContent = 'Alle ' + n + ' Paare gefunden, ' + zuFehlerText(fehler) + '.';
    if (opts.fertig) opts.fertig(fehler);
  };
  if (opts.geloest) {
    links.forEach(i => { const a = ks.find(x => x.dataset.s === 'l' && +x.dataset.p === i); fest(a, gegen(a), true); });
    ende(true);
    return { fehler: () => fehler };
  }
  ks.forEach(b => b.onclick = e => {
    if (fertig || b.disabled || e.detail > 1) return;
    if (!wahl || wahl === b) { waehle(wahl === b ? null : b); return; }
    if (wahl.dataset.s === b.dataset.s) { waehle(b); return; }
    const a = wahl; waehle(null);
    const l = a.dataset.s === 'l' ? a : b, r = l === a ? b : a;
    if (a.dataset.p === b.dataset.p) {
      fest(l, r); jubelTon('klein');
      if (paar === n) { ende(); return; }
      msg.textContent = 'Passt: ' + text(l) + ' · ' + text(r);
      /* Weiter mit dem nächsten offenen Begriff auf derselben Seite, wenn die Tastatur gerade im Spiel ist */
      const weiter = ks.find(x => x.dataset.s === b.dataset.s && !x.disabled) || ks.find(x => !x.disabled);
      if (weiter && box.contains(document.activeElement)) weiter.focus({ preventScroll: true });
    } else {
      fehler++; jubelDaneben();
      msg.textContent = 'Passt nicht: ' + text(l) + ' · ' + text(r) + '. Versuch es nochmal.';
      [a, b].forEach(x => { x.classList.remove('zu-no'); void x.offsetWidth; x.classList.add('zu-no'); });
      setTimeout(() => [a, b].forEach(x => x.classList.remove('zu-no')), 700);
    }
  });
  return { fehler: () => fehler };
}

/* ---------- Im Kapitel: Schritt „Zuordnen“ nach dem Quiz ----------
   Der erste Durchgang zählt: S.zu[kapitel] = Fehler. Ohne Fehler +10 XP wie eine Quizfrage, die sofort sitzt.
   Später steht das Spiel aufgelöst da, „Nochmal mischen“ spielt es ohne Wertung erneut. */
function renderZuordnen(body, ch) {
  const paare = zuPaare(ch), war = (S.zu || {})[ch.id];
  body.innerHTML = '<div class="zu-kp"><h2 class="q">Was gehört zusammen?</h2><div class="zu-host"></div><div class="zu-unten"></div></div>';
  const host = $('.zu-host', body), unten = $('.zu-unten', body), next = $('#nextStep');
  const nochmal = () => {
    unten.innerHTML = '<p class="zu-act"><button type="button" class="linkbtn" id="zuNochmal">Nochmal mischen</button></p>';
    $('#zuNochmal', unten).onclick = () => { unten.innerHTML = ''; zuSpiel(host, paare, { fertig: f => { if (!f) jubelRichtig($('.zu-msg', host)); nochmal(); } }); $('.zu-k', host).focus({ preventScroll: true }); };
  };
  if (war != null) { zuSpiel(host, paare, { geloest: true }); nochmal(); return; }
  zuSpiel(host, paare, {
    fertig: f => {
      S.zu = S.zu || {}; S.zu[ch.id] = f;
      if (!f) { jubelRichtig($('.zu-msg', host)); addXp(10, 'Alles richtig zugeordnet'); } else save();
      if (next) { next.classList.add('primary'); kpFokus(next); }
      nochmal();
    }
  });
}

/* ---------- Beim Wiederholen, in freien Runden und beim Üben: eine Karte z:<kapitel> ----------
   label: die Zeile über der Karte. fertig(fehler) nach dem letzten Paar. */
function zuKarte(body, ch, label, fertig) {
  body.innerHTML = `<div class="le-karte">${label}<h2 class="le-frage" tabindex="-1">Was gehört zusammen?</h2><div class="zu-host"></div></div>`;
  zuSpiel($('.zu-host', body), zuPaare(ch), { fertig });
}
