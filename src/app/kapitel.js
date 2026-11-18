/* ===== Kapitel: Rahmen, Szene, Folie, Erst selbst erklären, Quiz, Abschluss ===== */
function buildSteps(ch) {
  const st = [{ t: 'story' }];
  ch.slides.forEach((s, i) => st.push({ t: 'slide', i }));
  ch.quiz.forEach((q, i) => st.push({ t: 'quiz', i }));
  if (ch.ex) st.push({ t: 'code' }); st.push({ t: 'end' });
  return st;
}
const STEP_LABEL = { story: 'Ticket', slide: 'Verstehen', quiz: 'Quiz', code: 'Umsetzen', end: 'Abschluss' };
/* Die Szene, die sich gerade abspielt (für die Leertaste), sonst null */
var kpSzene = null;
/* Fokus nur dann versetzen, wenn er gerade im Schritt liegt oder verloren ging. So springt beim Lesen nichts. */
function kpFokus(el) {
  const a = document.activeElement, body = $('#stepBody');
  if (el && (!a || a === document.body || (body && body.contains(a)))) el.focus({ preventScroll: true });
}
function kpInsBild(el) {
  if (el.getBoundingClientRect().bottom > innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: bewegungAn() ? 'smooth' : 'auto' });
}

function renderChapter(main, ch) {
  const steps = buildSteps(ch);
  /* Die fünf Abschnitte, jeder mit seinen Schritten: eine einzige Fortschrittsanzeige */
  const phasen = [];
  steps.forEach((s, j) => { const l = phasen[phasen.length - 1]; if (l && l.t === s.t) l.bis = j; else phasen.push({ t: s.t, von: j, bis: j }); });
  let idx = Math.min(S.steps[ch.id] || 0, steps.length - 1);
  /* Nur angeschaut: Wer wiederkommt, landet gleich da, wo noch etwas fehlt (Übung oder offene Quizfrage) */
  if (kapitelOffen(ch) && idx === steps.length - 1) idx = kpOffenZiel(ch, steps);
  /* Sprung aus der Suche in ein Kapitel, das man noch nicht angefangen hat: nur nachschlagen. Solange merkt sich das Kapitel
     keinen Schritt, und der Abschluss zeigt nur die Merksätze. In einem angefangenen Kapitel zählt der Sprung wie Blättern. */
  let schauen = false;
  if (window.sprungZu && sprungZu.id === ch.id) {
    idx = Math.min(steps.findIndex(s => s.t === sprungZu.t && (sprungZu.i == null || s.i === sprungZu.i)), steps.length - 1); if (idx < 0) idx = 0; window.sprungZu = null;
    schauen = !S.done[ch.id] && !kapitelBegonnen(ch) && idx > 0;
  }
  const a = AKTE.find(x => x.n === ch.akt);
  main.innerHTML = `
    <header class="ch-head">${ch.eigen ? '<p class="eigen-bar small">✨ Von Toni für dich geschrieben · <button class="linkbtn" id="eigenDel" type="button">Kapitel löschen</button></p>' : ''}
      <p class="ort"><a href="#start">← Schreibtisch</a><span>${[phaseNr(a), kapitelPos(ch)].filter(Boolean).join(' · ')}</span></p>
      <h1>${esc(ch.title)}</h1>
      <nav class="kp-weg" id="kpWeg" aria-label="Schritte in diesem Kapitel"></nav>
      <p class="nur-sr" id="stepQuiet" aria-live="polite"></p></header>
    <div id="stepBody"></div>
    <nav class="step-nav" aria-label="Blättern"><button class="btn" id="prevStep">Zurück</button><button class="btn primary" id="nextStep">Weiter</button></nav>`;
  const weg = $('#kpWeg'), next = $('#nextStep'), prev = $('#prevStep');
  const show = (i, gelandet) => {
    if (currentExercise) { currentExercise.dispose(); currentExercise = null; }
    kpSzene = null; lexZu();
    /* Zurück bei einem Schritt, den man schon kannte: Ab hier zählt es wieder. Wer bis zum Abschluss blättert, schafft das Kapitel:
       Dann ist auch der Schritt gemerkt, und die Fortschrittsanzeige ist voll. */
    if (schauen && !gelandet && (i <= (S.steps[ch.id] || 0) || i === steps.length - 1)) schauen = false;
    idx = i; if (!schauen) { S.steps[ch.id] = Math.max(S.steps[ch.id] || 0, i); save(); }
    const st = steps[i], weit = S.done[ch.id] ? steps.length : Math.min(S.steps[ch.id] || 0, steps.length - 1);
    main.classList.toggle('wide', st.t === 'code');
    const imWeg = weg.contains(document.activeElement);
    /* Springen geht nur zu Abschnitten, die man schon erreicht hat, und zum direkt nächsten. Im geschafften Kapitel ist alles frei. */
    const frei = S.done[ch.id] ? phasen.length : phasen.findIndex(p => weit <= p.bis) + 1;
    weg.innerHTML = phasen.map((p, k) => {
      const an = i >= p.von && i <= p.bis, n = p.bis - p.von + 1;
      return `<button type="button" class="kp-ph${an ? ' an' : ''}" style="--n:${n}" data-j="${p.von}"${an ? ' aria-current="step"' : k > frei ? ' disabled' : ''}><span class="kp-ph-n">${STEP_LABEL[p.t]}${an && n > 1 ? ` <small>${i - p.von + 1}/${n}</small>` : ''}</span><span class="kp-ph-b" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<i class="${p.von + k === i ? 'an' : p.von + k <= weit ? 'voll' : ''}"></i>`).join('')}</span></button>`;
    }).join('');
    weg.querySelectorAll('.kp-ph').forEach(b => b.onclick = () => show(+b.dataset.j));
    if (imWeg) $('.kp-ph.an', weg).focus({ preventScroll: true });
    $('#stepQuiet').textContent = STEP_LABEL[st.t] + ' · Schritt ' + (i + 1) + ' von ' + steps.length;
    const body = $('#stepBody'); body.innerHTML = '';
    aktFolie = st.t === 'slide' ? { ch, s: ch.slides[st.i] } : null;
    /* Am Ende entscheidet der Abschluss selbst (Nächstes Kapitel oder Schreibtisch), darum dort kein „Weiter“ */
    next.hidden = i === steps.length - 1; prev.disabled = i === 0;
    /* Im Quiz ist „Weiter“ erst Hauptknopf, wenn die Frage richtig beantwortet ist. Überspringen geht trotzdem. */
    next.classList.toggle('primary', st.t !== 'quiz' || !!S.quiz[ch.id + ':' + st.i]);
    let szene = null;
    if (st.t === 'story') szene = renderStory(body, ch, () => show(i + 1));
    if (st.t === 'slide') renderSlide(body, ch.slides[st.i], ch);
    if (st.t === 'quiz') renderQuiz(body, ch.quiz[st.i], ch, st.i);
    if (st.t === 'code') renderCode(body, ch.ex, ch);
    if (st.t === 'end') renderEnd(body, ch, schauen, () => show(kpOffenZiel(ch, steps)));
    highlightIn(body); wireAnno(body);
    /* Beim Nachschlagen kein Selbsterklären: Die Erklärungen stehen gleich da, das Erklären wartet auf den echten Besuch. */
    if (st.t === 'slide') { if (schauen) kpDeineWorte(body, ch.slides[st.i], ch.id + ':' + st.i); else kpSelbstErklaeren(body, ch, st.i); }
    next.onclick = () => { if (!szene || !szene.weiter()) show(i + 1); };
    prev.onclick = () => show(i - 1);
    const del = $('#eigenDel'); if (del) del.onclick = () => eigenLoeschen(ch.id);
    window.scrollTo({ top: 0 });
  };
  show(idx, true);
}
/* Wer das Kapitel verlässt, hat keine Folie mehr offen */
window.addEventListener('hashchange', () => { if (aktFolie && aktFolie.ch.id !== location.hash.slice(1)) aktFolie = null; });

const TICKET_ICON = { Bug: '🐞', Feature: '✨', Incident: '🚨', 'Tech-Debt': '🧹', Review: '👀', Onboarding: '👋', Frage: '❓', Security: '🔒' };
function ticketHtml(ch, small) {
  const t = ch.ticket; if (!t) return '';
  return `<article class="ticket ${small ? 'tk-small' : ''}" data-typ="${esc(t.typ)}"><header class="tk-h"><span class="tk-id">${esc(t.id)}</span><span class="tk-typ">${TICKET_ICON[t.typ] || ''} ${esc(t.typ)}</span></header><h2 class="tk-t">${esc(t.titel)}</h2>${small ? '' : '<p class="tk-x">' + esc(t.text) + '</p>'}</article>`;
}

/* ---------- Szene: der Team-Chat spielt sich ab ---------- */
function kpAvatar(who) {
  const k = CAST[who] ? who : 'toni', c = CAST[k];
  return k === 'du' && avatarPx() ? `<span class="av av-px">${avatarHtml()}</span>` : `<span class="av${figurUrl(k) ? ' av-fig' : ''}" style="${figurStil(c.color)}">${figurKopf(k)}</span>`;
}
function kpZeile([who, txt]) {
  if (who === 'erz') return '<p class="narr">' + txt + '</p>';
  const c = CAST[who] || CAST.toni;
  return `<div class="line${who === 'du' ? ' me' : ''}">${kpAvatar(who)}<div class="bubble"><span class="who-n">${esc(c.name)}<small>${esc(who === 'du' ? ichRolle() : c.role)}</small></span><p>${txt}</p></div></div>`;
}
/* Beim ersten Mal: Nachrichten kommen einzeln, eigene Zeilen sind Antwort-Knöpfe, dann das Ticket zum Annehmen, dann der Vorab-Tipp.
   Solange ist „Weiter“ ausgeblendet: „Alles zeigen“ und „Ticket annehmen“ tun dasselbe. Pfeil rechts geht weiter über weiter().
   Wer das Kapitel schon angefangen oder geschafft hat, sieht alles sofort. Rückgabe: { weiter() } für den Weiter-Knopf, sonst null. */
function renderStory(body, ch, weiterGehen) {
  const story = ch.story, tipp = preTestHtml(ch);
  if (S.done[ch.id] || S.steps[ch.id] > 0) {
    body.innerHTML = `<div class="kp-chat"><div class="story">${story.map(kpZeile).join('')}</div></div>${ticketHtml(ch)}${tipp ? '<div class="kp-tipp">' + tipp + '</div>' : ''}`;
    wirePreTest(body, ch); return null;
  }
  body.innerHTML = `<div class="kp-chat kp-spielt"><div class="story" role="log" aria-live="polite" aria-label="Team-Chat"></div>
      <p class="kp-tippt" aria-hidden="true" hidden></p>
      <div class="kp-antwort" hidden><span class="kp-antwort-l">Du sagst:</span><button type="button" class="kp-sag"></button></div>
      <button type="button" class="linkbtn kp-alles">Alles zeigen</button></div>
    <div class="kp-auftrag" hidden>${ticketHtml(ch)}<button type="button" class="btn primary big" id="kpAnnehmen">${ch.ticket ? 'Ticket annehmen' : 'Los geht’s'}</button></div>
    ${tipp ? '<div class="kp-tipp" hidden></div>' : ''}`;
  const chat = $('.kp-chat', body), log = $('.story', body), tippt = $('.kp-tippt', body), antw = $('.kp-antwort', body), sag = $('.kp-sag', body);
  const auftrag = $('.kp-auftrag', body), tippBox = $('.kp-tipp', body), next = $('#nextStep');
  const ich = { el: body, sofort: () => { if (!wartet) return false; clearTimeout(t); const f = wartet; wartet = null; f(); return true; } };
  let pos = 0, t = 0, wartet = null, phase = 'chat';
  kpSzene = ich; next.hidden = true;
  const rein = el => { el.hidden = false; if (bewegungAn()) el.classList.add('kp-rein'); kpInsBild(el); };
  const dazu = (z, still) => { log.insertAdjacentHTML('beforeend', kpZeile(z)); if (!still) rein(log.lastElementChild); };
  /* fn nach ms ausführen. Klick oder Leertaste holt es sofort (ich.sofort). Ohne Animationen gibt es keine Wartezeit. */
  const warte = (fn, ms) => {
    clearTimeout(t);
    if (!ms || !bewegungAn()) { wartet = null; fn(); return; }
    wartet = fn; t = setTimeout(() => { if (kpSzene !== ich || !body.isConnected || wartet !== fn) return; wartet = null; fn(); }, ms);
  };
  const zeig = () => { tippt.hidden = true; dazu(story[pos++]); schritt(); };
  const schritt = () => {
    if (pos >= story.length) { warte(zumTicket, 450); return; }
    const [who, txt] = story[pos];
    if (who === 'du') { sag.innerHTML = txt; rein(antw); kpFokus(sag); return; }
    if (who === 'erz' || !CAST[who]) { warte(zeig, pos ? 500 : 0); return; }
    tippt.innerHTML = kpAvatar(who) + '<span>' + esc(CAST[who].name) + ' schreibt</span><span class="kp-punkte"><i></i><i></i><i></i></span>';
    tippt.hidden = false; kpInsBild(tippt);
    warte(zeig, 600 + Math.min(300, txt.length * 3));
  };
  const zumTicket = () => {
    phase = 'ticket'; clearTimeout(t); wartet = null;
    tippt.hidden = antw.hidden = true; $('.kp-alles', body).hidden = true; chat.classList.remove('kp-spielt');
    rein(auftrag); kpFokus($('#kpAnnehmen'));
  };
  const alles = () => { while (pos < story.length) dazu(story[pos++], true); zumTicket(); };
  const annehmen = () => {
    phase = 'tipp';
    if (!tippBox) { weiterGehen(); return; }
    next.hidden = false;
    $('#kpAnnehmen').outerHTML = `<p class="kp-stempel${bewegungAn() ? ' kp-rein' : ''}" role="status">✓ Angenommen</p>`;
    auftrag.classList.add('kp-ok');
    /* Der Vorab-Tipp kommt erst jetzt ins Dokument: Verdeckt würden ihn sonst die Zifferntasten 1 bis 4 schon treffen. */
    tippBox.innerHTML = tipp; wirePreTest(body, ch); rein(tippBox);
    kpFokus($('.opt:not(:disabled)', tippBox) || next);
  };
  sag.onclick = () => { antw.hidden = true; dazu(story[pos++]); schritt(); };
  $('.kp-alles', body).onclick = alles;
  $('#kpAnnehmen').onclick = annehmen;
  chat.onclick = e => { if (!e.target.closest('button, a')) ich.sofort(); };
  if (tippBox) tippBox.addEventListener('click', e => { if (e.target.closest('.opt')) kpFokus(next); });
  schritt();
  return { weiter: () => { if (phase === 'chat') alles(); else if (phase === 'ticket') annehmen(); else return false; return true; } };
}
document.addEventListener('keydown', e => {
  if (e.key !== ' ' || e.altKey || e.ctrlKey || e.metaKey || !kpSzene || !kpSzene.el.isConnected) return;
  const t = e.target;
  if ((t && t.closest && t.closest('button, a, input, textarea, select, summary, .CodeMirror, [contenteditable]')) || document.querySelector('dialog[open]')) return;
  if (kpSzene.sofort()) e.preventDefault();
});

/* ---------- Folie ---------- */
const slideCtx = s => (s.punkte ? '\nPunkte: ' + s.punkte.map(p => p[0] + ': ' + p[1]).join(' | ') : '') + (s.code ? '\nCode dazu:\n```ts\n' + s.code + '\n```' : '') + (s.pro ? '\nProfi-Wissen: ' + s.pro : '');
/* Die 1 bis 3 Links zur offiziellen Doku eines Kapitels als Liste. Das Feld doku kann fehlen.
   Sie stehen genau zweimal: offen auf der letzten Folie und am Abschluss. */
function kpDoku(ch) {
  const l = (Array.isArray(ch.doku) ? ch.doku : []).filter(Array.isArray).map(d => kpDokuLink(d[1], d[0] || 'Offizielle Doku')).filter(Boolean).slice(0, 3);
  return l.length ? '<ul class="kp-doku-l">' + l.map(x => '<li>' + x + '</li>').join('') + '</ul>' : '';
}
function renderSlide(body, s, ch) {
  const doku = s === ch.slides[ch.slides.length - 1] ? kpDoku(ch) : '';
  body.innerHTML = `
    <div class="slide">
      <h2 class="sl-title">${esc(s.t)}</h2>
      <p class="say">${esc(s.say)}</p>
      ${s.punkte ? `<div class="punkte">${s.punkte.map(([b, txt, k]) => `<div class="pk ${k || ''}">${k === 'plus' ? '<span class="pk-ic" aria-label="Stärke">+</span>' : k === 'minus' ? '<span class="pk-ic" aria-label="Achtung">−</span>' : ''}<div><b>${esc(b)}</b><span>${esc(txt)}</span></div></div>`).join('')}</div>` : ''}
      ${s.code ? annotated(s.code, s.notes) : ''}
      ${s.job ? `<aside class="job"><span class="job-l">💼 Im Job</span><p>${esc(s.job)}</p></aside>` : ''}
      ${s.pro ? `<details class="kp-mehr"><summary>Mehr dazu</summary><h3>Profi-Wissen</h3><p>${esc(s.pro)}</p></details>` : ''}
      ${doku ? '<p class="q-label kp-doku-t">Offizielle Doku</p>' + doku : ''}
    </div>`;
}

/* ---------- Erst selbst erklären ----------
   Beim ersten Besuch einer Folie ist die Lösung verdeckt, und du arbeitest zuerst selbst:
   - Folie mit Code: Der Code steht ganz da, mit Nummern an den Zeilen und unterstrichenen Wörtern (Klick öffnet die Erklärkarte).
     Du schreibst zu jeder Nummer in eigenen Worten, was dort passiert. Die nummerierten Erklärungen sind die Lösung.
   - Folie mit Karten (punkte, ohne Code): Nur die Begriffe stehen da. Du schreibst, was du dazu weißt oder vermutest.
     Die Karten mit ihrem Text sind die Lösung.
   Dann vergleichst du selbst, oder Toni prüft (nur mit eigenem KI-Schlüssel): Komplett richtig zeigt die Lösung als Bestätigung,
   sonst gibt es Denkanstöße ohne Lösung, die Lösung nur auf Wunsch.
   Gemerkt in S.gen['kapitel:folie'] = { du: [eigene Sätze], toni: true | false | null }. Bei jedem späteren Besuch steht die
   Lösung gleich da, darunter deine eigenen Worte. Folien aus dem Mini-Spiel von vorher (S.zeile), geschaffte Kapitel und
   Folien, an denen man schon vorbei war, zeigen alles sofort. Die Folie nr ist Schritt nr + 1 (Schritt 0 ist die Szene). */
const KP_SE_MAX = 400;
/* Was auf der Folie zum Selbsterklären taugt: der Code mit seinen Erklärungen, sonst mindestens zwei Karten */
function kpSeArt(body, s) {
  const anno = $('.slide > .anno', body), karten = $('.slide > .punkte', body);
  if (anno && s.notes && s.notes.length) return { art: 'code', loesung: $('.notes', anno), felder: [...$('.notes', anno).children].map(li => li.lastElementChild), anno, ref: s.notes.map(n => [n[0], n[1]]) };
  if (karten && !s.code && s.punkte && s.punkte.length >= 2) return { art: 'karten', loesung: karten, felder: [...karten.querySelectorAll('.pk > div')], ref: s.punkte.map(p => [p[0], p[1]]) };
  return null;
}
function kpDeineWorte(body, s, key) {
  const g = (S.gen || {})[key], du = g && Array.isArray(g.du) ? g.du : null, x = kpSeArt(body, s);
  if (!du || !x) return;
  x.felder.forEach((el, k) => {
    if (!du[k] || el.querySelector('.kp-du')) return;
    el.insertAdjacentHTML('beforeend', `<span class="kp-du"><b>Du:</b> ${esc(du[k])}</span>`);
  });
}
function kpSelbstErklaeren(body, ch, nr) {
  const s = ch.slides[nr], key = ch.id + ':' + nr, x = kpSeArt(body, s);
  if (!x) return;
  if (S.done[ch.id] || (S.zeile || {})[key] || (S.gen || {})[key] || (S.steps[ch.id] || 0) > nr + 1) { kpDeineWorte(body, s, key); return; }
  const code = x.art === 'code', mitKi = !!aiCfg().key, n = x.ref.length;
  x.loesung.hidden = true;
  const felder = x.ref.map((r, k) => `<li data-n="${k + 1}"><label for="kpSe${k}">${code ? `<span class="nb">${k + 1}</span><code>${esc(r[0])}</code>` : `<b>${esc(r[0])}</b>`}</label>
      <textarea id="kpSe${k}" class="kp-se-in" rows="1" maxlength="${KP_SE_MAX}" placeholder="${code ? 'In deinen Worten …' : 'Was weißt du dazu?'}" autocomplete="off" spellcheck="true"></textarea></li>`).join('');
  x.loesung.insertAdjacentHTML(code ? 'beforebegin' : 'afterend', `<form class="kp-se${code ? '' : ' kp-se-karten'}" novalidate>
    <p class="kp-se-f"><b>${code ? 'Erklär die Zeilen selbst' : 'Erst selbst überlegen'}</b><span>${n} ${code ? (n === 1 ? 'Stelle' : 'Stellen') : 'Begriffe'}</span></p>
    <p class="kp-se-h">${code ? 'Was passiert an jeder Nummer im Code? Ein paar eigene Worte reichen. Unterstrichene Wörter im Code kannst du anklicken.' : 'Was steckt hinter jedem Begriff? Schreib auf, was du weißt oder vermutest. Raten ist erlaubt, danach kommt die Auflösung.'}</p>
    <ol class="kp-se-l">${felder}</ol>
    <p class="kp-se-act">${mitKi ? '<button type="submit" class="btn primary" id="kpSeToni">Von Toni prüfen lassen</button><button type="button" class="btn" id="kpSeGo">Selbst vergleichen</button>' : `<button type="submit" class="btn primary" id="kpSeGo">${code ? 'Mit der Lösung vergleichen' : 'Auflösen'}</button>`}<button type="button" class="linkbtn" id="kpSeX">${code ? 'Erklärungen gleich zeigen' : 'Gleich auflösen'}</button></p>
    <p class="kp-se-r" role="status"></p>
    <div class="ai-box" id="kpSeOut" hidden></div>
  </form>`);
  const form = $('.kp-se', body), ins = [...form.querySelectorAll('.kp-se-in')], rueck = $('.kp-se-r', form), out = $('#kpSeOut', form);
  const sag = (msg, art) => { rueck.textContent = msg; rueck.className = 'kp-se-r ' + (art || ''); };
  let geprueft = false;
  /* Feld und Codezeile leuchten zusammen auf */
  const leucht = k => { if (code) x.anno.querySelectorAll('.cl[data-n]').forEach(e => e.classList.toggle('lit', k != null && e.dataset.n.split(' ').includes(String(k)))); };
  ins.forEach((t, k) => {
    t.addEventListener('focus', () => leucht(k + 1)); t.addEventListener('blur', () => leucht(null));
    /* Enter springt ins nächste Feld, im letzten prüft es. Umschalt + Enter macht eine neue Zeile. */
    t.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
      e.preventDefault();
      if (ins[k + 1]) ins[k + 1].focus(); else form.requestSubmit();
    });
  });
  const meine = () => ins.map(t => t.value.trim().replace(/\s+/g, ' ').slice(0, KP_SE_MAX));
  const alsText = du => du.map((t, k) => (code ? (k + 1) : x.ref[k][0]) + ': ' + t).join('\n');
  /* Lösung aufdecken: Erklärungen oder Karten erscheinen, unter jeder steht, was du geschrieben hast */
  const aufdecken = (du, toni, msg) => {
    S.gen = S.gen || {}; S.gen[key] = { du, toni }; save();
    const hatte = form.contains(document.activeElement);
    x.loesung.hidden = false; kpDeineWorte(body, s, key); leucht(null);
    if (bewegungAn()) x.loesung.classList.add('kp-rein');
    ['.kp-se-l', '.kp-se-act', '.kp-se-h'].forEach(sel => $(sel, form).remove());
    $('.kp-se-f span', form).textContent = code ? 'Lösung unten' : 'Auflösung oben';
    if (msg) sag(msg, toni ? 'ok' : 'hin'); else rueck.remove();
    if (hatte) kpFokus($('#nextStep'));
  };
  const pruefbar = () => {
    const du = meine(), leer = du.findIndex(t => t.length < 2);
    if (leer >= 0) { sag(du.every(t => t.length < 2) ? (code ? 'Schreib erst zu jeder Nummer ein paar Worte.' : 'Schreib erst zu jedem Begriff ein paar Worte, geraten zählt auch.') : (code ? 'Zu Nummer ' + (leer + 1) : 'Zu „' + x.ref[leer][0] + '“') + ' fehlt noch etwas.', 'no'); ins[leer].focus(); return null; }
    return du;
  };
  const selbst = () => {
    const du = pruefbar(); if (!du) return;
    lerneErklaerung(alsText(du), 'selbsterklaert', ch.id, s.t);
    aufdecken(du, null, code ? 'Vergleich deine Worte mit der Lösung unten. Passt der Kern?' : 'Vergleich mit den Karten oben. Was hast du schon gewusst?');
  };
  const toni = async () => {
    const du = pruefbar(); if (!du) return;
    sag(''); const knoepfe = [...form.querySelectorAll('.kp-se-act button')]; knoepfe.forEach(b => b.disabled = true);
    const ref = x.ref.map((r, k) => code ? (k + 1) + ': `' + r[0] + '` → ' + r[1] : r[0] + ' → ' + r[1]).join('\n');
    const prompt = TONI + (code
      ? '\n\nDer Lernende erklärt selbst, was die nummerierten Stellen im Code tun. Prüf seine Erklärung gegen die Musterlösung.\nThema: „' + s.t + '“\nCode:\n```ts\n' + s.code + '\n```'
      : '\n\nDer Lernende schreibt vorab selbst auf, was er zu jedem Begriff weiß oder vermutet. Prüf es gegen die Musterlösung.\nThema: „' + s.t + '“ (' + s.say + ')') +
      '\nMusterlösung (NICHT verraten):\n' + ref + '\n\nErklärung des Lernenden:\n' + alsText(du) +
      '\n\nRegeln: Die ERSTE Zeile deiner Antwort ist genau „URTEIL: RICHTIG“ oder „URTEIL: NOCH NICHT“. RICHTIG nur, wenn JEDER Punkt inhaltlich stimmt und keiner fehlt. Eigene, einfache Worte sind okay, Rechtschreibung egal. Danach höchstens 80 Wörter. Bei RICHTIG ein Satz Lob und höchstens eine Ergänzung. Bei NOCH NICHT: pro Punkt ✅ oder ❌, bei ❌ ein kurzer Denkanstoß als Frage, aber NICHT die Lösung. Wenn er ein Fachwort falsch benutzt (etwa „Funktion“ statt „Methode“), sag freundlich in einem Halbsatz, welches Wort passt.';
    const t = await toniStream(prompt, out, { view: v => v.replace(/^\W*URTEIL:[^\n]*\n?/i, '') });
    knoepfe.forEach(b => b.disabled = false);
    lerneErklaerung(alsText(du), 'selbsterklaert', ch.id, s.t);
    if (t == null) { sag('Toni ist gerade nicht erreichbar. Vergleich selbst mit der Lösung.', 'hin'); return; }
    const ok = /^\W*URTEIL:\s*RICHTIG/i.test(t.trim());
    lerneSignal(ok ? 'erklOk' : 'erklNo');
    if (ok) { jubelRichtig(form); aufdecken(du, true, '✓ Komplett richtig. Hier die Lösung zur Bestätigung.'); return; }
    /* Noch nicht fertig: nichts gemerkt, beim nächsten Besuch wartet das Erklären wieder */
    jubelDaneben(); geprueft = true;
    sag('Noch nicht ganz. Bessere oben nach und lass nochmal prüfen, oder lass dir die Lösung zeigen.', 'no');
    $('#kpSeGo', form).textContent = 'Lösung zeigen';
  };
  form.onsubmit = e => { e.preventDefault(); if (mitKi) toni(); else selbst(); };
  /* Nach Tonis „Noch nicht“ zeigt der zweite Knopf die Lösung direkt, sonst ist er der Selbstvergleich */
  if (mitKi) $('#kpSeGo', form).onclick = () => { if (geprueft) aufdecken(meine(), false, 'Vergleich deine Worte mit der Lösung unten.'); else selbst(); };
  $('#kpSeX', form).onclick = () => { const du = meine(); aufdecken(du.some(Boolean) ? du : [], null, ''); };
}

/* ---------- Quiz ---------- */
function renderQuiz(body, q, ch, i) {
  const key = ch.id + ':' + i;
  body.innerHTML = `<div class="quiz"><h2 class="q">${leHtml(q.q)}</h2><div class="opts">${leOpts(q)}</div><div class="why" aria-live="polite" hidden></div></div>`;
  const opts = [...body.querySelectorAll('.opt')], why = $('.why', body);
  let tries = 0;
  const reveal = () => { $('.opt[data-i="' + q.correct + '"]', body).classList.add('right'); why.hidden = false; why.innerHTML = '<b>Richtig.</b> ' + leHtml(q.why) + preNote(ch, i); opts.forEach(b => b.disabled = true); };
  if (S.quiz[key]) { reveal(); return; }
  opts.forEach(b => b.onclick = () => {
    tries++;
    if (+b.dataset.i === q.correct) { reveal(); S.quiz[key] = tries; if (tries === 1) addXp(10, 'Quiz sofort richtig'); else save(); kapitelNachholen(ch); $('#nextStep').classList.add('primary'); kpFokus($('#nextStep')); }
    else { b.classList.add('wrong'); b.disabled = true; why.hidden = false; why.textContent = 'Nicht ganz. Versuch es noch einmal.'; }
  });
}

/* ---------- Nur angeschaut: wohin es fehlt, und das Nachholen ---------- */
/* Der Schritt, an dem noch etwas fehlt: die Übung, sonst die erste Quizfrage ohne richtige Antwort */
function kpOffenZiel(ch, steps) {
  const j = ch.ex ? steps.findIndex(s => s.t === 'code') : steps.findIndex(s => s.t === 'quiz' && !S.quiz[ch.id + ':' + s.i]);
  return j < 0 ? steps.length - 1 : j;
}
/* Ein angeschautes Kapitel ist jetzt verdient (Übung grün, alle Fragen richtig): Dann zählt es als geschafft, mit XP und allem */
function kapitelNachholen(ch) {
  if (!ch || !CH.includes(ch) || !kapitelOffen(ch) || !kapitelVerdient(ch)) return false;
  S.done[ch.id] = Date.now(); delete S.offen[ch.id]; srsSeed();
  jubelGross('Kapitel geschafft', ch.title); addXp(ch.xp, 'Kapitel nachgeholt');
  return true;
}

/* ---------- Abschluss: erst aus dem Kopf, dann Merksätze, Doku und wie es weitergeht ---------- */
/* Geschafft ist ein Kapitel nur mit echter Arbeit (kapitelVerdient). Wer nur durchblättert, sieht die Merksätze,
   bekommt aber weder XP noch Sachen. Das Kapitel bleibt offen, steht bei „Wackelt noch“, und zuOffen() führt zurück. */
function renderEnd(body, ch, nurLesen, zuOffen) {
  const neu = !S.done[ch.id] && !nurLesen, first = neu && kapitelVerdient(ch);
  if (neu && !first) { S.offen = S.offen || {}; if (!S.offen[ch.id]) { S.offen[ch.id] = Date.now(); save(); } }
  if (first) { S.done[ch.id] = Date.now(); if (S.offen) delete S.offen[ch.id]; }
  srsSeed();
  /* „Kapitel geschafft“ sagt einmal die Jubel-Karte. Die Meldung unten nennt nur die XP, die Seite beginnt mit der Frage. */
  if (first) { jubelGross('Kapitel geschafft', ch.title); addXp(ch.xp); }
  const nextCh = nurLesen ? null : (CH.slice(CH.indexOf(ch) + 1).find(c => kapitelOptional(ch) || !kapitelOptional(c)) || null), doku = kpDoku(ch), offen = neu && !first;
  const merke = ch.merke || [];
  const fazit = `${merke.length ? `<p class="q-label">Das nimmst du mit</p><ul>${merke.map(m => '<li>' + esc(m) + '</li>').join('')}</ul>` : ''}
    ${doku ? '<p class="q-label kp-doku-t">Offizielle Doku</p>' + doku : ''}
    ${first ? '<p class="muted small">Das kommt ab morgen beim Wiederholen wieder.</p>' : ''}
    <div class="kp-schluss">${nextCh ? `<a class="btn${offen ? '' : ' primary'} big" href="#${nextCh.id}" id="kpNaechstes">Nächstes Kapitel</a>` : ''}<a class="btn big${nextCh || offen ? '' : ' primary'}" href="#start" id="kpHeim">Zum Schreibtisch</a></div>`;
  if (neu && !first) {
    const was = ch.ex ? 'die Übung grün ist' : 'alle Quizfragen richtig beantwortet sind';
    body.innerHTML = `<div class="end"><section class="kp-offen" aria-labelledby="kpOffenT"><p class="kp-ende-t kp-offen-t" id="kpOffenT">Nur angeschaut</p>
      <p>Geschafft ist das Kapitel, sobald ${was}. Dann gibt es ${ch.xp ? '+' + ch.xp + ' XP' : 'die XP'} und vielleicht eine Sache für deinen Avatar. Bis dahin steht das Thema auf dem Schreibtisch bei „Wackelt noch“.</p>
      <p class="kp-schluss"><button type="button" class="btn primary big" id="kpOffenLos">${ch.ex ? 'Zur Übung' : 'Zum Quiz'}</button></p></section>${fazit}</div>`;
    $('#kpOffenLos', body).onclick = () => { if (zuOffen) zuOffen(); };
    return;
  }
  if (!first) { body.innerHTML = `<div class="end">${nurLesen ? '' : '<p class="kp-ende-t">✓ Geschafft</p>'}${fazit}</div>`; return; }
  body.innerHTML = `<div class="end">
    <div id="dump"><h2 class="kp-frage"><label for="dumpIn">Was nimmst du mit?</label></h2><p class="muted">Zwei, drei Stichworte aus dem Kopf. Danach vergleichst du.</p>
      <textarea class="recall" id="dumpIn" rows="3" placeholder="Stichworte reichen."></textarea>
      <div class="ai-row"><button class="btn primary" id="dumpGo">Vergleichen</button><button class="linkbtn" id="dumpSkip">Überspringen</button></div></div>
    <div id="dumpOut"></div></div>`;
  const zeig = () => {
    const mine = $('#dumpIn').value.trim();
    if (mine) lerneErklaerung(mine, 'ausdemkopf', ch.id, ch.title);
    $('#dump').remove();
    $('#dumpOut').innerHTML = (mine ? `<p class="q-label">Deine Stichworte</p><blockquote class="mine">${esc(mine).replace(/\n/g, '<br>')}</blockquote>` : '') + fazit;
    kpFokus($('#kpNaechstes') || $('#kpHeim'));
  };
  $('#dumpGo').onclick = zeig; $('#dumpSkip').onclick = zeig;
}
