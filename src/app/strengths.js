/* ===== Deine Themen: was sitzt und was wackelt. Ohne KI, nur aus dem Spielstand gerechnet =====
   Quellen je Kapitel: Kapitel-Quiz (S.quiz: Versuche bis richtig), Fehler in freien Runden (S.weak), Fehler beim Wiederholen
   (S.srs[…].l), „sicher, aber daneben“ beim Wiederholen (S.srs[…].sf), Übung (S.ex: Fehlversuche, Lösung angeschaut),
   Mini-Spiel „Welche Zeile ist das?“ (S.codeLine), Zuordnen (S.matching im Kapitel, S.weak['<kapitel>:zu'] in freien Runden, matching.js)
   und Toni-Fragen (S.tf).
   Danach richten sich: Wiederholen und freie Runde (wackelige Themen öfter und früher), die Hilfe in der Übung (früher angeboten),
   der Schreibtisch („Wackelt noch“) und Toni (bekommt die Themen mit). Mit KI schreibt Toni zu einem Thema neue Fragen. */

/* Ein Kapitel: pkt = Fehlerpunkte, n = Beobachtungen, schwach = 0 bis 1, stand = offen | wackelt | mittel | sitzt, gruende = Sätze */
function topicState(ch) {
  let pkt = 0, n = 0;
  const g = { quiz: 0, unlocked: 0, repeat: 0, sure: 0, fails: 0, solution: false, codeLine: 0, tf: 0, matching: 0 };
  (ch.quiz || []).forEach((q, i) => {
    const k = ch.id + ':' + i, t = (S.quiz || {})[k], w = (S.weak || {})[k];
    if (t) { n++; if (t > 1) { pkt += Math.min(t - 1, 2); g.quiz++; } }
    if (w) { pkt += w; g.unlocked += w; n++; }
  });
  /* Zuordnen zählt wie Quizfragen: jeder Fehler im Kapitel ein Punkt, höchstens zwei je Paar wie bei einer Frage */
  const zf = (S.matching || {})[ch.id];
  if (typeof zf === 'number' && hasMatching(ch)) { n += matchPairs(ch).length; if (zf) { pkt += Math.min(zf, 2 * matchPairs(ch).length); g.matching = zf; } }
  const zw = (S.weak || {})[ch.id + ':zu'];
  if (zw) { pkt += zw; g.unlocked += zw; n++; }
  Object.keys(S.srs || {}).forEach(k => {
    const c = S.srs[k]; if (!c || k.split(':')[1] !== ch.id) return;
    n += c.n || 0;
    if (c.l) { pkt += c.l; g.repeat += c.l; }
    if (c.sf) { pkt += c.sf * 0.5; g.sure += c.sf; }
  });
  const e = ch.ex && (S.ex || {})[ch.ex.id];
  if (e) {
    n++;
    if (e.fails) { pkt += Math.min(e.fails, 6) * 0.5; g.fails = e.fails; }
    if (e.usedSolution) { pkt += 2; g.solution = true; }
  }
  Object.keys(S.codeLine || {}).forEach(k => {
    const z = S.codeLine[k]; if (!z || k.split(':')[0] !== ch.id) return;
    n += (z.ok || 0) + (z.problems || 0);
    if (z.problems) { pkt += z.problems * 0.5; g.codeLine += z.problems; }
  });
  const ux = (S.ux || {})[ch.id];
  if (ux) { n += (ux.r || 0) + (ux.f || 0); if (ux.f) { pkt += ux.f; g.ux = ux.f; } }
  const tf = (S.tf || {})[ch.id];
  if (tf) { n += (tf.r || 0) + (tf.f || 0); if (tf.f) { pkt += tf.f; g.tf = tf.f; } }

  /* Nur angeschaut (bis zum Abschluss geblättert, ohne die Arbeit): wackelt, bis es nachgeholt ist */
  const onlyViewed = typeof chapterPending === 'function' && chapterPending(ch);
  if (onlyViewed) { pkt += 2; n++; }
  const weakOnes = n ? Math.min(1, pkt / (n + 2)) : 0;
  const standing = !n ? 'offen' : onlyViewed || (pkt >= 1.5 && weakOnes >= 0.25) ? 'wackelt' : !pkt && n >= 3 ? 'sitzt' : 'mittel';
  const reasons = [];
  if (onlyViewed) reasons.push(ch.ex ? 'Übung noch offen' : 'Quiz noch offen');
  if (g.quiz) reasons.push((g.quiz === 1 ? '1 Quizfrage' : g.quiz + ' Quizfragen') + ' erst im zweiten Anlauf');
  if (g.matching) reasons.push((g.matching === 1 ? '1 Fehler' : g.matching + ' Fehler') + ' beim Zuordnen');
  if (g.unlocked + g.repeat) reasons.push((g.unlocked + g.repeat) + '× daneben beim Wiederholen');
  if (g.sure) reasons.push(g.sure + '× sicher, aber falsch');
  if (g.solution) reasons.push('Übung mit der Lösung geschafft');
  else if (g.fails >= 2) reasons.push(g.fails + ' Fehlversuche in der Übung');
  if (g.codeLine) reasons.push((g.codeLine === 1 ? '1 Zeile' : g.codeLine + ' Zeilen') + ' im Mini-Spiel verwechselt');
  if (g.tf) reasons.push(g.tf + '× daneben bei Tonis Fragen');
  if (g.ux) reasons.push(g.ux + '× Code aus dem Kopf nicht geschafft');
  return { ch, pkt, n, weakOnes, standing, reasons };
}
/* Alle Kapitel, die schon begonnen sind, das wackeligste zuerst */
function topics() {
  return CH.filter(c => (S.done || {})[c.id] || (S.steps || {})[c.id] || topicTouched(c)).map(topicState).filter(t => t.n).sort((a, b) => b.weakOnes - a.weakOnes || b.pkt - a.pkt);
}
const topicTouched = c => (c.quiz || []).some((q, i) => (S.quiz || {})[c.id + ':' + i]);
/* Kapitel-ID → schwach (0 bis 1), für Wiederholen und freie Runde. Einmal pro Runde berechnet.
   Nur Themen, die wirklich wackeln: Ein einzelner Ausrutscher zählt dort schon an der Frage selbst (S.weak, S.quiz). */
function weakCard() { const m = {}; topics().forEach(t => { if (t.standing === 'wackelt') m[t.ch.id] = t.weakOnes; }); return m; }
function workAreas(max) { return topics().filter(t => t.standing === 'wackelt').slice(0, max || 3); }
function topicOf(chId) { const ch = CH.find(c => c.id === chId); return ch ? topicState(ch) : null; }

/* Für Toni: die Themen in einem Absatz (withProfile hängt ihn an jede Anfrage) */
function topicsNote() {
  const t = topics(), wk = t.filter(x => x.standing === 'wackelt').slice(0, 5), ok = t.filter(x => x.standing === 'sitzt').slice(0, 5);
  if (!wk.length && !ok.length) return '';
  return '\n\nTHEMEN laut Spielstand (Quiz, Wiederholen, Übungen): ' +
    (wk.length ? 'Wackelt noch: ' + wk.map(x => '„' + x.ch.title + '“ (' + x.reasons.join(', ') + ')').join('; ') + '. Kommt eins davon vor, erklär es gründlicher und prüf mit einer kurzen Rückfrage, ob es sitzt. ' : '') +
    (ok.length ? 'Sitzt: ' + ok.map(x => '„' + x.ch.title + '“').join(', ') + '. Darauf kannst du aufbauen.' : '');
}

/* ---------- Schreibtisch: „Wackelt noch“ ---------- */
function hubWorkAreasHtml() {
  const b = workAreas(3); if (!b.length) return '';
  const ai = !!aiCfg().key;
  return `<section class="hub-build" aria-labelledby="hubBuildT"><h2 id="hubBuildT">Wackelt noch</h2>
    <p class="hub-build-s">Das merkt sich die App aus deinen Antworten. Diese Themen kommen beim Wiederholen öfter und früher dran.</p>
    <ul>${b.map(t => `<li><span class="hub-build-t"><b>${esc(t.ch.title)}</b><small>${esc(t.reasons.join(' · '))}</small></span><span class="hub-build-go">${chapterPending(t.ch) ? `<a class="btn" href="#${esc(t.ch.id)}">${t.ch.ex ? 'Übung lösen' : 'Quiz beantworten'}</a>` : `<a class="btn" href="#ueben-${esc(t.ch.id)}">Üben</a>`}${ai ? `<a class="linkbtn" href="#tonifragen-${esc(t.ch.id)}">Neue Fragen von Toni</a>` : ''}</span></li>`).join('')}</ul>
    ${ai ? '' : '<p class="hub-build-ai">Mit einer KI schreibt Toni dir zu jedem dieser Themen neue Fragen. <button type="button" class="linkbtn" id="hubBuildAi">KI einrichten</button></p>'}</section>`;
}
function hubWorkAreasOn(main) { const b = $('#hubBuildAi', main); if (b) b.onclick = () => openAiSettings(); }

/* ---------- Ein Thema üben (#ueben-<kapitel>): alle Quizfragen des Kapitels, gemischt, wie eine freie Runde ----------
   Hat das Kapitel eine Übung und war sie schon einmal grün, kommt sie am Schluss aus dem Kopf dazu (frischer Startcode).
   Gerade Fehlversuche in der Übung lassen ein Thema oft wackeln, darum gehört der Code mit zur Runde. */
function renderPractice(main, ch) {
  const x = ch.ex && S.ex[ch.ex.id] && S.ex[ch.ex.id].passed ? ['x:' + ch.id] : [];
  /* Zuordnen kommt als Abwechslung irgendwo zwischen die Quizfragen */
  const keys = shuffle((ch.quiz || []).map((q, i) => 'q:' + ch.id + ':' + i)).slice(0, 7);
  if (hasMatching(ch)) keys.splice(1 + Math.floor(Math.random() * keys.length), 0, 'z:' + ch.id);
  keys.push(...x);
  if (!keys.length) { main.innerHTML = leHead('Üben') + '<div class="card learn-calm"><h2>Hier gibt es keine Fragen</h2></div>'; return; }
  leRound(main, keys, true, 'Üben: ' + ch.title);
}

/* ---------- Neue Fragen von Toni (#tonifragen-<kapitel>): die KI schreibt drei Fragen zu dem, was bei dir wackelt ---------- */
async function tfFetch(ch, alt) {
  const t = topicState(ch);
  const missed = (ch.quiz || []).map((q, i) => ({ q, k: ch.id + ':' + i })).filter(x => (S.quiz || {})[x.k] > 1 || (S.weak || {})[x.k] || ((S.srs || {})['q:' + x.k] || {}).l)
    .map(x => '- ' + stripHtml(x.q.q) + ' (richtig: ' + stripHtml(x.q.options[x.q.correct]) + ')');
  const prompt = TONI + '\n\nSchreib genau 3 neue Multiple-Choice-Fragen zum Kapitel „' + ch.title + '“ (Thema: ' + (ch.tag || ch.title) + ').\n' +
    (ch.takeaway && ch.takeaway.length ? 'Kernaussagen des Kapitels:\n' + ch.takeaway.map(m => '- ' + m).join('\n') + '\n' : '') +
    (missed.length ? 'Diese Fragen aus dem Kapitel hatte der Lernende falsch oder erst im zweiten Anlauf. Zielt genau auf die Missverständnisse dahinter, aber stell sie nicht wörtlich nochmal:\n' + missed.join('\n') + '\n' : '') +
    (t.reasons.length ? 'Beobachtet: ' + t.reasons.join(', ') + '.\n' : '') +
    (alt && alt.length ? 'Diese Fragen hattest du schon gestellt, also andere nehmen:\n' + alt.map(q => '- ' + q).join('\n') + '\n' : '') +
    'Regeln: Jede Frage ist für sich allein verständlich (ganzer Satz). Gern ein kurzes Code-Stück mit <code>. 4 Antworten, genau eine richtig, die falschen sind typische Denkfehler. ' +
    'Die Begründung erklärt in 1 bis 2 Sätzen, warum die richtige stimmt und was am häufigsten Denkfehler falsch ist. Angular 22, moderne Syntax (Signals, @if, inject). Deutsch, du-Form.\n' +
    'Format: {"questions":[{"q":"…","options":["…","…","…","…"],"correct":0,"why":"…"}]}';
  const text = await aiStream(withProfile(prompt), () => {}, null, { temperature: 0.8, maxOutputTokens: 3000, responseMimeType: 'application/json' });
  const j = jsonFromText(text), fr = (j && j.questions || []).filter(q => q && typeof q.q === 'string' && Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 5 && q.options.every(o => typeof o === 'string') && Number.isInteger(+q.correct) && +q.correct >= 0 && +q.correct < q.options.length)
    .map(q => ({ q: q.q, options: q.options, correct: +q.correct, why: String(q.why || '') }));
  if (!fr.length) throw new Error('Toni hat keine brauchbaren Fragen geschickt');
  return fr.slice(0, 3);
}
function renderToniQuestions(main, ch) {
  main.innerHTML = leHead('Neue Fragen von Toni') + `<div id="tfBody"><p class="learn-label">${esc(ch.title)}</p></div>`;
  const body = $('#tfBody', main), posed = [];
  if (!aiCfg().key) {
    body.insertAdjacentHTML('beforeend', '<div class="card learn-calm"><h2>Dafür braucht Toni eine KI</h2><p>Mit deinem eigenen Schlüssel schreibt Toni dir neue Fragen genau zu dem, was bei dir wackelt.</p><div class="learn-next"><button class="btn primary" id="tfKi" type="button">KI einrichten</button><a class="linkbtn" href="#ueben-' + esc(ch.id) + '">Ohne KI üben</a></div></div>');
    $('#tfKi', body).onclick = () => openAiSettings();
    return;
  }
  let right = 0, overall = 0;
  const turn = async () => {
    body.innerHTML = `<p class="learn-label">${esc(ch.title)}</p><div class="card learn-calm" aria-busy="true"><p class="tc-thinks">Toni schreibt Fragen zu dem, was bei dir wackelt…</p></div>`;
    let fr;
    try { fr = await tfFetch(ch, posed); }
    catch (e) {
      if (!body.isConnected) return;
      body.innerHTML = `<div class="card learn-calm"><h2>Das hat nicht geklappt</h2><p>${esc(aiError(e))}</p><div class="learn-next"><button class="btn primary" id="tfAgain" type="button">Nochmal versuchen</button><a class="linkbtn" href="#ueben-${esc(ch.id)}">Ohne KI üben</a></div></div>`;
      $('#tfAgain', body).onclick = turn; return;
    }
    if (!body.isConnected) return;
    fr.forEach(q => posed.push(String(q.q).replace(/<[^>]*>/g, '')));
    let i = 0;
    const showIt = () => {
      if (i >= fr.length) return ending();
      const q = fr[i];
      body.innerHTML = `<div class="learn-card"><p class="learn-label">Toni-Frage ${i + 1} von ${fr.length} · ${esc(ch.title)}</p><h2 class="learn-question" tabindex="-1">${leHtml(q.q)}</h2><div class="learn-opts">${leOpts(q)}</div><div class="learn-why" aria-live="polite"></div></div>`;
      const opts = [...body.querySelectorAll('.opt')], fine = opts.find(b => +b.dataset.i === q.correct);
      opts.forEach(b => b.onclick = e => {
        if (e.detail > 1) return;
        opts.forEach(o => o.disabled = true);
        const ok = b === fine; overall++; if (ok) right++;
        b.classList.add(ok ? 'right' : 'wrong'); fine.classList.add('right'); $('.key', fine).textContent = '✓'; if (!ok) $('.key', b).textContent = '✗';
        const tf = S.tf || (S.tf = {}), st = tf[ch.id] || (tf[ch.id] = { r: 0, f: 0 }); st[ok ? 'r' : 'f']++;
        if (ok) addXp(5, 'Toni-Frage'); else save();
        $('.learn-why', body).innerHTML = (ok ? '<b>Richtig.</b> ' : '<b>Daneben.</b> ') + leHtml(q.why);
        body.firstElementChild.insertAdjacentHTML('beforeend', '<div class="learn-next"><button class="btn primary" id="repeatNext" type="button">Weiter</button></div>');
        const w = $('#repeatNext', body); w.onclick = () => { i++; showIt(); }; w.focus({ preventScroll: true });
      });
      $('.learn-question', body).focus({ preventScroll: true });
    };
    const ending = () => {
      const t = topicState(ch);
      body.innerHTML = `<div class="learn-balance"><p class="learn-number${right === overall ? ' learn-full' : ''}" tabindex="-1">${right} von ${overall}</p><p class="learn-label">richtig bei Tonis Fragen</p>
        <p class="learn-notice">${t.standing === 'wackelt' ? 'Das Thema bleibt auf deiner Liste und kommt beim Wiederholen öfter dran.' : 'Das Thema sieht schon stabiler aus.'}</p>
        <div class="learn-next"><a class="btn primary big" href="#start">Zum Schreibtisch</a><button class="linkbtn" id="tfMore" type="button">Noch 3 Fragen</button></div></div>`;
      $('#tfMore', body).onclick = turn; $('.learn-number', body).focus({ preventScroll: true });
    };
    showIt();
  };
  turn();
}

/* ---------- Einstellungen, Reiter „Coach Toni“: deine Themen, auch ohne KI ---------- */
function topicsProfileHtml() {
  const t = topics(), wk = t.filter(x => x.standing === 'wackelt').slice(0, 8), ok = t.filter(x => x.standing === 'sitzt').slice(0, 8);
  if (!wk.length && !ok.length) return '<p class="muted small">Nach ein paar Quizfragen und Übungen siehst du hier, welche Themen sitzen und welche noch wackeln.</p>';
  return '<p class="q-label">Deine Themen</p><div class="pf-chips">' + wk.map(x => '<a class="pf-chip no" href="#ueben-' + esc(x.ch.id) + '" title="' + esc(x.reasons.join(', ')) + '">' + esc(x.ch.title) + '</a>').join('') +
    ok.map(x => '<span class="pf-chip ok">' + esc(x.ch.title) + '</span>').join('') + '</div><p class="small muted">Rot: wackelt noch, kommt beim Wiederholen öfter · Grün: sitzt. Das rechnet die App selbst aus, ohne KI.</p>';
}
