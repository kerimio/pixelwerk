/* ===== Kapitel: Rahmen, Szene, Folie, Erst selbst erklären, Quiz, Abschluss ===== */
function buildSteps(ch) {
  const st = [{ t: 'story' }];
  ch.slides.forEach((s, i) => st.push({ t: 'slide', i }));
  ch.quiz.forEach((q, i) => st.push({ t: 'quiz', i }));
  /* Zuordnen: Abwechslung zum Quiz (matching.js). Schiebt Übung und Abschluss um einen Schritt, siehe shiftMatchSteps. */
  if (hasMatching(ch)) st.push({ t: 'matching' });
  if (ch.ex) st.push({ t: 'code' }); st.push({ t: 'end' });
  return st;
}
const STEP_LABEL = { story: 'Ticket', slide: 'Verstehen', quiz: 'Quiz', matching: 'Zuordnen', code: 'Umsetzen', end: 'Abschluss' };
/* Die Szene, die sich gerade abspielt (für die Leertaste), sonst null */
var cpScene = null;
/* Fokus nur dann versetzen, wenn er gerade im Schritt liegt oder verloren ging. So springt beim Lesen nichts. */
function cpFocus(el) {
  const a = document.activeElement, body = $('#stepBody');
  if (el && (!a || a === document.body || (body && body.contains(a)))) el.focus({ preventScroll: true });
}
function cpIntoView(el) {
  if (el.getBoundingClientRect().bottom > innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: motionOn() ? 'smooth' : 'auto' });
}

function renderChapter(main, ch) {
  const steps = buildSteps(ch);
  /* Die fünf Abschnitte, jeder mit seinen Schritten: eine einzige Fortschrittsanzeige */
  const phases = [];
  steps.forEach((s, j) => { const l = phases[phases.length - 1]; if (l && l.t === s.t) l.until = j; else phases.push({ t: s.t, startIdx: j, until: j }); });
  let idx = Math.min(S.steps[ch.id] || 0, steps.length - 1);
  /* Nur angeschaut: Wer wiederkommt, landet gleich da, wo noch etwas fehlt (Übung oder offene Quizfrage) */
  if (chapterPending(ch) && idx === steps.length - 1) idx = cpPendingTarget(ch, steps);
  /* Sprung aus der Suche in ein Kapitel, das man noch nicht angefangen hat: nur nachschlagen. Solange merkt sich das Kapitel
     keinen Schritt, und der Abschluss zeigt nur die Merksätze. In einem angefangenen Kapitel zählt der Sprung wie Blättern. */
  let look = false;
  if (window.jumpTo && jumpTo.id === ch.id) {
    idx = Math.min(steps.findIndex(s => s.t === jumpTo.t && (jumpTo.i == null || s.i === jumpTo.i)), steps.length - 1); if (idx < 0) idx = 0; window.jumpTo = null;
    look = !S.done[ch.id] && !chapterStarted(ch) && idx > 0;
  }
  const a = ACTS.find(x => x.n === ch.act);
  main.innerHTML = `
    <header class="ch-head">${ch.custom ? '<p class="custom-bar small">✨ Von Toni für dich geschrieben · <button class="linkbtn" id="customDel" type="button">Kapitel löschen</button></p>' : ''}
      <p class="loc"><a href="#start">← Schreibtisch</a><span>${[phaseNo(a), chapterPos(ch)].filter(Boolean).join(' · ')}</span></p>
      <h1>${esc(ch.title)}</h1>
      <nav class="cp-path" id="cpPath" aria-label="Schritte in diesem Kapitel"></nav>
      <p class="sr-only" id="stepQuiet" aria-live="polite"></p></header>
    <div id="stepBody"></div>
    <nav class="step-nav" aria-label="Blättern"><button class="btn" id="prevStep">Zurück</button><button class="btn primary" id="nextStep">Weiter</button></nav>`;
  const journey = $('#cpPath'), next = $('#nextStep'), prev = $('#prevStep');
  const show = (i, landed) => {
    if (currentExercise) { currentExercise.dispose(); currentExercise = null; }
    cpScene = null; lexClose();
    /* Zurück bei einem Schritt, den man schon kannte: Ab hier zählt es wieder. Wer bis zum Abschluss blättert, schafft das Kapitel:
       Dann ist auch der Schritt gemerkt, und die Fortschrittsanzeige ist voll. */
    if (look && !landed && (i <= (S.steps[ch.id] || 0) || i === steps.length - 1)) look = false;
    idx = i; if (!look) { S.steps[ch.id] = Math.max(S.steps[ch.id] || 0, i); save(); }
    const st = steps[i], far = S.done[ch.id] ? steps.length : Math.min(S.steps[ch.id] || 0, steps.length - 1);
    main.classList.toggle('wide', st.t === 'code');
    const inWay = journey.contains(document.activeElement);
    /* Springen geht nur zu Abschnitten, die man schon erreicht hat, und zum direkt nächsten. Im geschafften Kapitel ist alles frei. */
    const unlocked = S.done[ch.id] ? phases.length : phases.findIndex(p => far <= p.until) + 1;
    journey.innerHTML = phases.map((p, k) => {
      const an = i >= p.startIdx && i <= p.until, n = p.until - p.startIdx + 1;
      return `<button type="button" class="cp-ph${an ? ' active' : ''}" style="--n:${n}" data-j="${p.startIdx}"${an ? ' aria-current="step"' : k > unlocked ? ' disabled' : ''}><span class="cp-ph-n">${STEP_LABEL[p.t]}${an && n > 1 ? ` <small>${i - p.startIdx + 1}/${n}</small>` : ''}</span><span class="cp-ph-b" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<i class="${p.startIdx + k === i ? 'active' : p.startIdx + k <= far ? 'full' : ''}"></i>`).join('')}</span></button>`;
    }).join('');
    journey.querySelectorAll('.cp-ph').forEach(b => b.onclick = () => show(+b.dataset.j));
    if (inWay) $('.cp-ph.active', journey).focus({ preventScroll: true });
    $('#stepQuiet').textContent = STEP_LABEL[st.t] + ' · Schritt ' + (i + 1) + ' von ' + steps.length;
    const body = $('#stepBody'); body.innerHTML = '';
    currentSlide = st.t === 'slide' ? { ch, s: ch.slides[st.i] } : null;
    /* Am Ende entscheidet der Abschluss selbst (Nächstes Kapitel oder Schreibtisch), darum dort kein „Weiter“ */
    next.hidden = i === steps.length - 1; prev.disabled = i === 0;
    /* Im Quiz ist „Weiter“ erst Hauptknopf, wenn die Frage richtig beantwortet ist, beim Zuordnen, wenn alle Paare stehen. Überspringen geht trotzdem. */
    next.classList.toggle('primary', st.t === 'quiz' ? !!S.quiz[ch.id + ':' + st.i] : st.t === 'matching' ? (S.matching || {})[ch.id] != null : true);
    let scene = null;
    if (st.t === 'story') scene = renderStory(body, ch, () => show(i + 1));
    if (st.t === 'slide') renderSlide(body, ch.slides[st.i], ch);
    if (st.t === 'quiz') renderQuiz(body, ch.quiz[st.i], ch, st.i);
    if (st.t === 'matching') renderMatching(body, ch);
    if (st.t === 'code') renderCode(body, ch.ex, ch);
    if (st.t === 'end') renderEnd(body, ch, look, () => show(cpPendingTarget(ch, steps)));
    highlightIn(body); wireAnno(body);
    /* Beim Nachschlagen kein Selbsterklären: Die Erklärungen stehen gleich da, das Erklären wartet auf den echten Besuch. */
    if (st.t === 'slide') { if (look) cpYourWords(body, ch.slides[st.i], ch.id + ':' + st.i); else cpSelfExplain(body, ch, st.i); }
    next.onclick = () => { if (!scene || !scene.proceed()) show(i + 1); };
    prev.onclick = () => show(i - 1);
    const del = $('#customDel'); if (del) del.onclick = () => customDelete(ch.id);
    window.scrollTo({ top: 0 });
  };
  show(idx, true);
}
/* Wer das Kapitel verlässt, hat keine Folie mehr offen */
window.addEventListener('hashchange', () => { if (currentSlide && currentSlide.ch.id !== location.hash.slice(1)) currentSlide = null; });

const TICKET_ICON = { Bug: '🐞', Feature: '✨', Incident: '🚨', 'Tech-Debt': '🧹', Review: '👀', Onboarding: '👋', Frage: '❓', Security: '🔒' };
function ticketHtml(ch, small) {
  const t = ch.ticket; if (!t) return '';
  return `<article class="ticket ${small ? 'tk-small' : ''}" data-category="${esc(t.category)}"><header class="tk-h"><span class="tk-id">${esc(t.id)}</span><span class="tk-typ">${TICKET_ICON[t.category] || ''} ${esc(t.category)}</span></header><h2 class="tk-t">${esc(t.heading)}</h2>${small ? '' : '<p class="tk-x">' + esc(t.text) + '</p>'}</article>`;
}

/* ---------- Szene: der Team-Chat spielt sich ab ---------- */
function cpAvatar(who) {
  const k = CAST[who] ? who : 'toni', c = CAST[k];
  return k === 'du' && avatarPx() ? `<span class="av av-px">${avatarHtml()}</span>` : `<span class="av${figureUrl(k) ? ' av-fig' : ''}" style="${figureStyle(c.color)}">${figureHead(k)}</span>`;
}
function cpLine([who, txt]) {
  if (who === 'erz') return '<p class="narr">' + txt + '</p>';
  const c = CAST[who] || CAST.toni;
  return `<div class="line${who === 'du' ? ' me' : ''}">${cpAvatar(who)}<div class="bubble"><span class="who-n">${esc(c.name)}<small>${esc(who === 'du' ? meRole() : c.role)}</small></span><p>${txt}</p></div></div>`;
}
/* Beim ersten Mal: Nachrichten kommen einzeln, eigene Zeilen sind Antwort-Knöpfe, dann das Ticket zum Annehmen, dann der Vorab-Tipp.
   Solange ist „Weiter“ ausgeblendet: „Alles zeigen“ und „Ticket annehmen“ tun dasselbe. Pfeil rechts geht weiter über weiter().
   Wer das Kapitel schon angefangen oder geschafft hat, sieht alles sofort. Rückgabe: { weiter() } für den Weiter-Knopf, sonst null. */
function renderStory(body, ch, goOn) {
  const story = ch.story, tip = preTestHtml(ch);
  if (S.done[ch.id] || S.steps[ch.id] > 0) {
    body.innerHTML = `<div class="cp-chat"><div class="story">${story.map(cpLine).join('')}</div></div>${ticketHtml(ch)}${tip ? '<div class="cp-tip">' + tip + '</div>' : ''}`;
    wirePreTest(body, ch); return null;
  }
  body.innerHTML = `<div class="cp-chat cp-plays"><div class="story" role="log" aria-live="polite" aria-label="Team-Chat"></div>
      <p class="cp-typing" aria-hidden="true" hidden></p>
      <div class="cp-answer" hidden><span class="cp-answer-l">Du sagst:</span><button type="button" class="cp-say"></button></div>
      <button type="button" class="linkbtn cp-all">Alles zeigen</button></div>
    <div class="cp-task" hidden>${ticketHtml(ch)}<button type="button" class="btn primary big" id="cpAccept">${ch.ticket ? 'Ticket annehmen' : 'Los geht’s'}</button></div>
    ${tip ? '<div class="cp-tip" hidden></div>' : ''}`;
  const chat = $('.cp-chat', body), log = $('.story', body), typing = $('.cp-typing', body), ans = $('.cp-answer', body), tell = $('.cp-say', body);
  const assignment = $('.cp-task', body), tipBox = $('.cp-tip', body), next = $('#nextStep');
  const player = { el: body, instant: () => { if (!waiting) return false; clearTimeout(t); const f = waiting; waiting = null; f(); return true; } };
  let pos = 0, t = 0, waiting = null, phase = 'chat';
  cpScene = player; next.hidden = true;
  const into = el => { el.hidden = false; if (motionOn()) el.classList.add('cp-in'); cpIntoView(el); };
  const extra = (z, still) => { log.insertAdjacentHTML('beforeend', cpLine(z)); if (!still) into(log.lastElementChild); };
  /* fn nach ms ausführen. Klick oder Leertaste holt es sofort (ich.sofort). Ohne Animationen gibt es keine Wartezeit. */
  const waitFor = (fn, ms) => {
    clearTimeout(t);
    if (!ms || !motionOn()) { waiting = null; fn(); return; }
    waiting = fn; t = setTimeout(() => { if (cpScene !== player || !body.isConnected || waiting !== fn) return; waiting = null; fn(); }, ms);
  };
  const showIt = () => { typing.hidden = true; extra(story[pos++]); stepNo(); };
  const stepNo = () => {
    if (pos >= story.length) { waitFor(toTicket, 450); return; }
    const [who, txt] = story[pos];
    if (who === 'du') { tell.innerHTML = txt; into(ans); cpFocus(tell); return; }
    if (who === 'erz' || !CAST[who]) { waitFor(showIt, pos ? 500 : 0); return; }
    typing.innerHTML = cpAvatar(who) + '<span>' + esc(CAST[who].name) + ' schreibt</span><span class="cp-points"><i></i><i></i><i></i></span>';
    typing.hidden = false; cpIntoView(typing);
    waitFor(showIt, 600 + Math.min(300, txt.length * 3));
  };
  const toTicket = () => {
    phase = 'ticket'; clearTimeout(t); waiting = null;
    typing.hidden = ans.hidden = true; $('.cp-all', body).hidden = true; chat.classList.remove('cp-plays');
    into(assignment); cpFocus($('#cpAccept'));
  };
  const everything = () => { while (pos < story.length) extra(story[pos++], true); toTicket(); };
  const accept = () => {
    phase = 'tipp';
    if (!tipBox) { goOn(); return; }
    next.hidden = false;
    $('#cpAccept').outerHTML = `<p class="cp-stamp${motionOn() ? ' cp-in' : ''}" role="status">✓ Angenommen</p>`;
    assignment.classList.add('cp-ok');
    /* Der Vorab-Tipp kommt erst jetzt ins Dokument: Verdeckt würden ihn sonst die Zifferntasten 1 bis 4 schon treffen. */
    tipBox.innerHTML = tip; wirePreTest(body, ch); into(tipBox);
    cpFocus($('.opt:not(:disabled)', tipBox) || next);
  };
  tell.onclick = () => { ans.hidden = true; extra(story[pos++]); stepNo(); };
  $('.cp-all', body).onclick = everything;
  $('#cpAccept').onclick = accept;
  chat.onclick = e => { if (!e.target.closest('button, a')) player.instant(); };
  if (tipBox) tipBox.addEventListener('click', e => { if (e.target.closest('.opt')) cpFocus(next); });
  stepNo();
  return { proceed: () => { if (phase === 'chat') everything(); else if (phase === 'ticket') accept(); else return false; return true; } };
}
document.addEventListener('keydown', e => {
  if (e.key !== ' ' || e.altKey || e.ctrlKey || e.metaKey || !cpScene || !cpScene.el.isConnected) return;
  const t = e.target;
  if ((t && t.closest && t.closest('button, a, input, textarea, select, summary, .CodeMirror, [contenteditable]')) || document.querySelector('dialog[open]')) return;
  if (cpScene.instant()) e.preventDefault();
});

/* ---------- Folie ---------- */
const slideCtx = s => (s.points ? '\nPunkte: ' + s.points.map(p => p[0] + ': ' + p[1]).join(' | ') : '') + (s.code ? '\nCode dazu:\n```ts\n' + s.code + '\n```' : '') + (s.pro ? '\nProfi-Wissen: ' + s.pro : '');
/* Die 1 bis 3 Links zur offiziellen Doku eines Kapitels als Liste. Das Feld doku kann fehlen.
   Sie stehen genau zweimal: offen auf der letzten Folie und am Abschluss. */
function cpDocs(ch) {
  const l = (Array.isArray(ch.docs) ? ch.docs : []).filter(Array.isArray).map(d => cpDocsLink(d[1], d[0] || 'Offizielle Doku')).filter(Boolean).slice(0, 3);
  return l.length ? '<ul class="cp-docs-l">' + l.map(x => '<li>' + x + '</li>').join('') + '</ul>' : '';
}
function renderSlide(body, s, ch) {
  const docs = s === ch.slides[ch.slides.length - 1] ? cpDocs(ch) : '';
  body.innerHTML = `
    <div class="slide">
      <h2 class="sl-title">${esc(s.t)}</h2>
      <p class="say">${esc(s.say)}</p>
      ${s.points ? `<div class="points">${s.points.map(([b, txt, k]) => `<div class="pk ${k || ''}">${k === 'plus' ? '<span class="pk-ic" aria-label="Stärke">+</span>' : k === 'minus' ? '<span class="pk-ic" aria-label="Achtung">−</span>' : ''}<div><b>${esc(b)}</b><span>${esc(txt)}</span></div></div>`).join('')}</div>` : ''}
      ${s.code ? annotated(s.code, s.notes) : ''}
      ${s.job ? `<aside class="job"><span class="job-l">💼 Im Job</span><p>${esc(s.job)}</p></aside>` : ''}
      ${s.pro ? `<details class="cp-more"><summary>Mehr dazu</summary><h3>Profi-Wissen</h3><p>${esc(s.pro)}</p></details>` : ''}
      ${docs ? '<p class="q-label cp-docs-t">Offizielle Doku</p>' + docs : ''}
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
   Lösung gleich da, darunter deine eigenen Worte. Folien aus dem Mini-Spiel von vorher (S.codeLine), geschaffte Kapitel und
   Folien, an denen man schon vorbei war, zeigen alles sofort. Die Folie nr ist Schritt nr + 1 (Schritt 0 ist die Szene). */
const CP_SE_MAX = 400;
/* Was auf der Folie zum Selbsterklären taugt: der Code mit seinen Erklärungen, sonst mindestens zwei Karten */
function cpSeKind(body, s) {
  const anno = $('.slide > .anno', body), cards = $('.slide > .points', body);
  if (anno && s.notes && s.notes.length) return { kind: 'code', solution: $('.notes', anno), fields: [...$('.notes', anno).children].map(li => li.lastElementChild), anno, ref: s.notes.map(n => [n[0], n[1]]) };
  if (cards && !s.code && s.points && s.points.length >= 2) return { kind: 'karten', solution: cards, fields: [...cards.querySelectorAll('.pk > div')], ref: s.points.map(p => [p[0], p[1]]) };
  return null;
}
function cpYourWords(body, s, key) {
  const g = (S.gen || {})[key], you = g && Array.isArray(g.du) ? g.du : null, x = cpSeKind(body, s);
  if (!you || !x) return;
  x.fields.forEach((el, k) => {
    if (!you[k] || el.querySelector('.cp-you')) return;
    el.insertAdjacentHTML('beforeend', `<span class="cp-you"><b>Du:</b> ${esc(you[k])}</span>`);
  });
}
function cpSelfExplain(body, ch, nr) {
  const s = ch.slides[nr], key = ch.id + ':' + nr, x = cpSeKind(body, s);
  if (!x) return;
  if (S.done[ch.id] || (S.codeLine || {})[key] || (S.gen || {})[key] || (S.steps[ch.id] || 0) > nr + 1) { cpYourWords(body, s, key); return; }
  const code = x.kind === 'code', withAi = !!aiCfg().key, n = x.ref.length;
  x.solution.hidden = true;
  const fields = x.ref.map((r, k) => `<li data-n="${k + 1}"><label for="cpSe${k}">${code ? `<span class="nb">${k + 1}</span><code>${esc(r[0])}</code>` : `<b>${esc(r[0])}</b>`}</label>
      <textarea id="cpSe${k}" class="cp-se-in" rows="1" maxlength="${CP_SE_MAX}" placeholder="${code ? 'In deinen Worten …' : 'Was weißt du dazu?'}" autocomplete="off" spellcheck="true"></textarea></li>`).join('');
  x.solution.insertAdjacentHTML(code ? 'beforebegin' : 'afterend', `<form class="cp-se${code ? '' : ' cp-se-cards'}" novalidate>
    <p class="cp-se-f"><b>${code ? 'Erklär die Zeilen selbst' : 'Erst selbst überlegen'}</b><span>${n} ${code ? (n === 1 ? 'Stelle' : 'Stellen') : 'Begriffe'}</span></p>
    <p class="cp-se-h">${code ? 'Was passiert an jeder Nummer im Code? Ein paar eigene Worte reichen. Unterstrichene Wörter im Code kannst du anklicken.' : 'Was steckt hinter jedem Begriff? Schreib auf, was du weißt oder vermutest. Raten ist erlaubt, danach kommt die Auflösung.'}</p>
    <ol class="cp-se-l">${fields}</ol>
    <p class="cp-se-act">${withAi ? '<button type="submit" class="btn primary" id="cpSeToni">Von Toni prüfen lassen</button><button type="button" class="btn" id="cpSeGo">Selbst vergleichen</button>' : `<button type="submit" class="btn primary" id="cpSeGo">${code ? 'Mit der Lösung vergleichen' : 'Auflösen'}</button>`}<button type="button" class="linkbtn" id="cpSeX">${code ? 'Erklärungen gleich zeigen' : 'Gleich auflösen'}</button></p>
    <p class="cp-se-r" role="status"></p>
    <div class="ai-box" id="cpSeOut" hidden></div>
  </form>`);
  const form = $('.cp-se', body), ins = [...form.querySelectorAll('.cp-se-in')], back = $('.cp-se-r', form), out = $('#cpSeOut', form);
  const tell = (msg, kind) => { back.textContent = msg; back.className = 'cp-se-r ' + (kind || ''); };
  let verified = false;
  /* Feld und Codezeile leuchten zusammen auf */
  const glowing = k => { if (code) x.anno.querySelectorAll('.cl[data-n]').forEach(e => e.classList.toggle('lit', k != null && e.dataset.n.split(' ').includes(String(k)))); };
  ins.forEach((t, k) => {
    t.addEventListener('focus', () => glowing(k + 1)); t.addEventListener('blur', () => glowing(null));
    /* Enter springt ins nächste Feld, im letzten prüft es. Umschalt + Enter macht eine neue Zeile. */
    t.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
      e.preventDefault();
      if (ins[k + 1]) ins[k + 1].focus(); else form.requestSubmit();
    });
  });
  const myOwn = () => ins.map(t => t.value.trim().replace(/\s+/g, ' ').slice(0, CP_SE_MAX));
  const asText = you => you.map((t, k) => (code ? (k + 1) : x.ref[k][0]) + ': ' + t).join('\n');
  /* Lösung aufdecken: Erklärungen oder Karten erscheinen, unter jeder steht, was du geschrieben hast */
  const uncover = (you, toni, msg) => {
    S.gen = S.gen || {}; S.gen[key] = { du: you, toni }; save();
    const had = form.contains(document.activeElement);
    x.solution.hidden = false; cpYourWords(body, s, key); glowing(null);
    if (motionOn()) x.solution.classList.add('cp-in');
    ['.cp-se-l', '.cp-se-act', '.cp-se-h'].forEach(sel => $(sel, form).remove());
    $('.cp-se-f span', form).textContent = code ? 'Lösung unten' : 'Auflösung oben';
    if (msg) tell(msg, toni ? 'ok' : 'hin'); else back.remove();
    if (had) cpFocus($('#nextStep'));
  };
  const checkable = () => {
    const you = myOwn(), empty = you.findIndex(t => t.length < 2);
    if (empty >= 0) { tell(you.every(t => t.length < 2) ? (code ? 'Schreib erst zu jeder Nummer ein paar Worte.' : 'Schreib erst zu jedem Begriff ein paar Worte, geraten zählt auch.') : (code ? 'Zu Nummer ' + (empty + 1) : 'Zu „' + x.ref[empty][0] + '“') + ' fehlt noch etwas.', 'no'); ins[empty].focus(); return null; }
    return you;
  };
  const selfMade = () => {
    const you = checkable(); if (!you) return;
    learnExplanation(asText(you), 'selbsterklaert', ch.id, s.t);
    uncover(you, null, code ? 'Vergleich deine Worte mit der Lösung unten. Passt der Kern?' : 'Vergleich mit den Karten oben. Was hast du schon gewusst?');
  };
  const toni = async () => {
    const you = checkable(); if (!you) return;
    tell(''); const buttons = [...form.querySelectorAll('.cp-se-act button')]; buttons.forEach(b => b.disabled = true);
    const ref = x.ref.map((r, k) => code ? (k + 1) + ': `' + r[0] + '` → ' + r[1] : r[0] + ' → ' + r[1]).join('\n');
    const prompt = TONI + (code
      ? '\n\nDer Lernende erklärt selbst, was die nummerierten Stellen im Code tun. Prüf seine Erklärung gegen die Musterlösung.\nThema: „' + s.t + '“\nCode:\n```ts\n' + s.code + '\n```'
      : '\n\nDer Lernende schreibt vorab selbst auf, was er zu jedem Begriff weiß oder vermutet. Prüf es gegen die Musterlösung.\nThema: „' + s.t + '“ (' + s.say + ')') +
      '\nMusterlösung (NICHT verraten):\n' + ref + '\n\nErklärung des Lernenden:\n' + asText(you) +
      '\n\nRegeln: Die ERSTE Zeile deiner Antwort ist genau „URTEIL: RICHTIG“ oder „URTEIL: NOCH NICHT“. RICHTIG nur, wenn JEDER Punkt inhaltlich stimmt und keiner fehlt. Eigene, einfache Worte sind okay, Rechtschreibung egal. Danach höchstens 80 Wörter. Bei RICHTIG ein Satz Lob und höchstens eine Ergänzung. Bei NOCH NICHT: pro Punkt ✅ oder ❌, bei ❌ ein kurzer Denkanstoß als Frage, aber NICHT die Lösung. Wenn er ein Fachwort falsch benutzt (etwa „Funktion“ statt „Methode“), sag freundlich in einem Halbsatz, welches Wort passt.';
    const t = await toniStream(prompt, out, { view: v => v.replace(/^\W*URTEIL:[^\n]*\n?/i, '') });
    buttons.forEach(b => b.disabled = false);
    learnExplanation(asText(you), 'selbsterklaert', ch.id, s.t);
    if (t == null) { tell('Toni ist gerade nicht erreichbar. Vergleich selbst mit der Lösung.', 'hin'); return; }
    const ok = /^\W*URTEIL:\s*RICHTIG/i.test(t.trim());
    learnSignal(ok ? 'erklOk' : 'erklNo');
    if (ok) { cheerCorrect(form); uncover(you, true, '✓ Komplett richtig. Hier die Lösung zur Bestätigung.'); return; }
    /* Noch nicht fertig: nichts gemerkt, beim nächsten Besuch wartet das Erklären wieder */
    cheerMiss(); verified = true;
    tell('Noch nicht ganz. Bessere oben nach und lass nochmal prüfen, oder lass dir die Lösung zeigen.', 'no');
    $('#cpSeGo', form).textContent = 'Lösung zeigen';
  };
  form.onsubmit = e => { e.preventDefault(); if (withAi) toni(); else selfMade(); };
  /* Nach Tonis „Noch nicht“ zeigt der zweite Knopf die Lösung direkt, sonst ist er der Selbstvergleich */
  if (withAi) $('#cpSeGo', form).onclick = () => { if (verified) uncover(myOwn(), false, 'Vergleich deine Worte mit der Lösung unten.'); else selfMade(); };
  $('#cpSeX', form).onclick = () => { const you = myOwn(); uncover(you.some(Boolean) ? you : [], null, ''); };
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
    if (+b.dataset.i === q.correct) { reveal(); S.quiz[key] = tries; if (tries === 1) addXp(10, 'Quiz sofort richtig'); else save(); chapterCatchUp(ch); $('#nextStep').classList.add('primary'); cpFocus($('#nextStep')); }
    else { b.classList.add('wrong'); b.disabled = true; why.hidden = false; why.textContent = 'Nicht ganz. Versuch es noch einmal.'; }
  });
}

/* ---------- Nur angeschaut: wohin es fehlt, und das Nachholen ---------- */
/* Der Schritt, an dem noch etwas fehlt: die Übung, sonst die erste Quizfrage ohne richtige Antwort */
function cpPendingTarget(ch, steps) {
  const j = ch.ex ? steps.findIndex(s => s.t === 'code') : steps.findIndex(s => s.t === 'quiz' && !S.quiz[ch.id + ':' + s.i]);
  return j < 0 ? steps.length - 1 : j;
}
/* Ein angeschautes Kapitel ist jetzt verdient (Übung grün, alle Fragen richtig): Dann zählt es als geschafft, mit XP und allem */
function chapterCatchUp(ch) {
  if (!ch || !CH.includes(ch) || !chapterPending(ch) || !chapterEarned(ch)) return false;
  S.done[ch.id] = Date.now(); delete S.pending[ch.id]; srsSeed();
  cheerBig('Kapitel geschafft', ch.title); addXp(ch.xp, 'Kapitel nachgeholt');
  return true;
}

/* ---------- Abschluss: erst aus dem Kopf, dann Merksätze, Doku und wie es weitergeht ---------- */
/* Geschafft ist ein Kapitel nur mit echter Arbeit (chapterEarned). Wer nur durchblättert, sieht die Merksätze,
   bekommt aber weder XP noch Sachen. Das Kapitel bleibt offen, steht bei „Wackelt noch“, und tooOpen() führt zurück. */
function renderEnd(body, ch, readOnly, tooOpen) {
  const fresh = !S.done[ch.id] && !readOnly, first = fresh && chapterEarned(ch);
  if (fresh && !first) { S.pending = S.pending || {}; if (!S.pending[ch.id]) { S.pending[ch.id] = Date.now(); save(); } }
  if (first) { S.done[ch.id] = Date.now(); if (S.pending) delete S.pending[ch.id]; }
  srsSeed();
  /* „Kapitel geschafft“ sagt einmal die Jubel-Karte. Die Meldung unten nennt nur die XP, die Seite beginnt mit der Frage. */
  if (first) { cheerBig('Kapitel geschafft', ch.title); addXp(ch.xp); }
  const nextCh = readOnly ? null : (CH.slice(CH.indexOf(ch) + 1).find(c => chapterOptional(ch) || !chapterOptional(c)) || null), docs = cpDocs(ch), pending = fresh && !first;
  const takeaway = ch.takeaway || [];
  const conclusion = `${takeaway.length ? `<p class="q-label">Das nimmst du mit</p><ul>${takeaway.map(m => '<li>' + esc(m) + '</li>').join('')}</ul>` : ''}
    ${docs ? '<p class="q-label cp-docs-t">Offizielle Doku</p>' + docs : ''}
    ${first ? '<p class="muted small">Das kommt ab morgen beim Wiederholen wieder.</p>' : ''}
    <div class="cp-finale">${nextCh ? `<a class="btn${pending ? '' : ' primary'} big" href="#${nextCh.id}" id="cpNext">Nächstes Kapitel</a>` : ''}<a class="btn big${nextCh || pending ? '' : ' primary'}" href="#start" id="cpHome">Zum Schreibtisch</a></div>`;
  if (fresh && !first) {
    const what = ch.ex ? 'die Übung grün ist' : 'alle Quizfragen richtig beantwortet sind';
    body.innerHTML = `<div class="end"><section class="cp-pending" aria-labelledby="cpPendingT"><p class="cp-end-t cp-pending-t" id="cpPendingT">Nur angeschaut</p>
      <p>Geschafft ist das Kapitel, sobald ${what}. Dann gibt es ${ch.xp ? '+' + ch.xp + ' XP' : 'die XP'} und vielleicht eine Sache für deinen Avatar. Bis dahin steht das Thema auf dem Schreibtisch bei „Wackelt noch“.</p>
      <p class="cp-finale"><button type="button" class="btn primary big" id="cpPendingGo">${ch.ex ? 'Zur Übung' : 'Zum Quiz'}</button></p></section>${conclusion}</div>`;
    $('#cpPendingGo', body).onclick = () => { if (tooOpen) tooOpen(); };
    return;
  }
  if (!first) { body.innerHTML = `<div class="end">${readOnly ? '' : '<p class="cp-end-t">✓ Geschafft</p>'}${conclusion}</div>`; return; }
  body.innerHTML = `<div class="end">
    <div id="dump"><h2 class="cp-question"><label for="dumpIn">Was nimmst du mit?</label></h2><p class="muted">Zwei, drei Stichworte aus dem Kopf. Danach vergleichst du.</p>
      <textarea class="recall" id="dumpIn" rows="3" placeholder="Stichworte reichen."></textarea>
      <div class="ai-row"><button class="btn primary" id="dumpGo">Vergleichen</button><button class="linkbtn" id="dumpSkip">Überspringen</button></div></div>
    <div id="dumpOut"></div></div>`;
  const showIt = () => {
    const mine = $('#dumpIn').value.trim();
    if (mine) learnExplanation(mine, 'ausdemkopf', ch.id, ch.title);
    $('#dump').remove();
    $('#dumpOut').innerHTML = (mine ? `<p class="q-label">Deine Stichworte</p><blockquote class="mine">${esc(mine).replace(/\n/g, '<br>')}</blockquote>` : '') + conclusion;
    cpFocus($('#cpNext') || $('#cpHome'));
  };
  $('#dumpGo').onclick = showIt; $('#dumpSkip').onclick = showIt;
}
