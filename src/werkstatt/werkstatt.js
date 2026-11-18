/* ================= WERKSTATT =================
   Vier Modi zum Selbermachen (Inhalte in content-arena.js):
   #training           Übersicht
   #bug, #bug-<id>     🐞 Bug-Jagd (nutzt die normale Code-Übung mit Tests)
   #ausgabe            🔮 Was gibt das aus?
   #review, #review-<id> 👀 Code-Review-Arena
   #interview          🎤 Mock-Interview
   Wirkt über: Fehler finden und erklären (Debugging als eigene Fertigkeit), Vorhersagen vor dem Auflösen
   (Prediction/Generation-Effekt), Abruf unter Zeitdruck (Interview), Feedback direkt nach der Antwort. */

const ARENA_IDS = /^(training|bug|ausgabe|review|interview|rschule)/;
function arena() {
  S.arena = S.arena || {};
  const a = S.arena; a.bug = a.bug || {}; a.out = a.out || {}; a.rev = a.rev || {}; a.iv = a.iv || [];
  return a;
}
const SEV = { blocker: ['Muss', 'bad'], wichtig: ['Sollte', 'warn'], frage: ['Frage', 'info'], nit: ['Nit', 'info'] };
const shuffleA = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hasAi = () => !!aiCfg().key;

function arenaStats() {
  const a = arena();
  const ivDone = new Set(a.iv.map(x => x.id)).size;
  const ivAvg = a.iv.length ? a.iv.slice(-10).reduce((s, x) => s + x.score, 0) / Math.min(10, a.iv.length) : 0;
  return {
    bug: BUGS.filter(b => a.bug[b.id]).length,
    out: OUTPUTS.filter(o => a.out[o.id] && a.out[o.id].ok).length,
    rev: REVIEWS.filter(r => a.rev[r.id]).length,
    revPts: REVIEWS.reduce((s, r) => s + ((a.rev[r.id] || {}).best || 0), 0), revMax: REVIEWS.reduce((s, r) => s + r.issues.length, 0),
    ivDone, ivAvg
  };
}

function renderArena(main, id) {
  if (id === 'training') return renderArenaHub(main);
  if (id.startsWith('rschule')) return renderRSchule(main, id);
  if (id === 'bug') return renderBugList(main);
  if (id.startsWith('bug-')) { const b = BUGS.find(x => x.id === id.slice(4)); return b ? renderBug(main, b) : renderBugList(main); }
  if (id === 'ausgabe') return renderOutput(main);
  if (id === 'review') return renderReviewList(main);
  if (id.startsWith('review-')) { const r = REVIEWS.find(x => x.id === id.slice(7)); return r ? renderReview(main, r) : renderReviewList(main); }
  if (id === 'interview') return renderInterview(main);
  renderArenaHub(main);
}

function renderArenaHub(main) {
  const st = arenaStats();
  const card = (href, icon, name, what, prog, pct) => `<a class="arena-card" href="${href}"><span class="ac-i" aria-hidden="true">${icon}</span><b>${name}</b><span class="ac-w">${what}</span><span class="ac-bar"><i style="width:${Math.round(pct * 100)}%"></i></span><small>${prog}</small></a>`;
  main.innerHTML = `<header class="ch-head"><p class="ort"><a href="#start">← Schreibtisch</a></p><h1>🛠️ Werkstatt</h1><p class="lede">Weniger lesen, mehr machen. Hier trainierst du das, was im Job und im Interview zählt.</p></header>
    <div class="arena-grid">
      ${card('#bug', '🐞', 'Bug-Jagd', 'Kaputter Code, rote Tests, ein Ticket. Finde den Fehler und fix ihn.', st.bug + '/' + BUGS.length + ' Bugs gefixt', st.bug / BUGS.length)}
      ${card('#ausgabe', '🔮', 'Was gibt das aus?', 'Lies Code und sag die Konsole voraus. Event Loop, Closures, RxJS, Signals.', st.out + '/' + OUTPUTS.length + ' sofort richtig', st.out / OUTPUTS.length)}
      ${card('#rschule', '🎓', 'Review-Schule', 'Code Reviews mit Methode: Ablauf, Schweregrade, gute Kommentare, Riesen-PRs. Du schreibst selbst Kommentare und kriegst Feedback.', rsStats().fertig + '/' + RS_STATIONEN.length + ' Stationen geschafft', rsStats().fertig / RS_STATIONEN.length)}
      ${card('#review', '👀', 'Code-Review-Arena', 'Ein echter Pull Request. Markier die Zeilen, die du kommentieren würdest.', st.revPts + '/' + st.revMax + ' Probleme gefunden', st.revPts / st.revMax)}
      ${card('#interview', '🎤', 'Mock-Interview', 'Frage, Timer, deine Antwort. ' + (hasAi() ? 'Toni bewertet wie ein Interviewer.' : 'Danach Selbstcheck mit den Kernpunkten.'), st.ivDone ? st.ivDone + '/' + INTERVIEW.length + ' Fragen geübt · Ø ' + st.ivAvg.toFixed(1) + '/10' : INTERVIEW.length + ' Fragen von Junior bis Senior', st.ivDone / INTERVIEW.length)}
    </div>`;
}

/* ---------- 🐞 Bug-Jagd ---------- */
function renderBugList(main) {
  const a = arena();
  const stufen = [...new Set(BUGS.map(b => b.stufe))];
  const next = BUGS.find(b => !a.bug[b.id]);
  main.innerHTML = `<header class="ch-head"><p class="ort"><a href="#training">← Werkstatt</a></p><h1>🐞 Bug-Jagd</h1><p class="tagline">Jedes Ticket ist ein echter Bug, wie er in Firmen-Projekten ständig vorkommt. Die Tests zeigen dir, was kaputt ist. Du findest die Ursache.</p>
    ${next ? `<div class="hero-cta"><a class="btn primary big" href="#bug-${next.id}">Nächster Bug: ${esc(next.ex.title)}</a></div>` : '<p class="pass">Alle Bugs gefixt. Kammerjäger!</p>'}</header>
    ${stufen.map(s => `<div class="league"><div class="lg-head"><div><h3>${esc(s)}</h3></div></div><div class="matches">${BUGS.filter(b => b.stufe === s).map(b => `<a class="match ${a.bug[b.id] ? 'won' : ''}" href="#bug-${b.id}"><span>${TICKET_ICON[b.ticket.typ] || '🐞'} ${esc(b.ticket.titel)}</span><small>${esc(b.ticket.id)} · ${esc(b.thema)}</small></a>`).join('')}</div></div>`).join('')}`;
}

function renderBug(main, b) {
  const a = arena();
  const i = BUGS.indexOf(b), next = BUGS[i + 1];
  /* Eine Hauptaktion: „Prüfen“, solange der Bug offen ist (siehe renderCode), danach der Weg zum nächsten */
  const gefixt = () => !!(S.ex[b.ex.id] && S.ex[b.ex.id].passed);
  main.classList.add('wide');
  main.innerHTML = `<header class="ch-head"><p class="ort"><a href="#bug">← Bug-Jagd</a><span>${i + 1}/${BUGS.length}</span></p><h1>${esc(b.ex.title)}</h1><p class="tagline">${esc(b.stufe)} · ${esc(b.thema)}</p></header>
    ${ticketHtml(b)}
    <div id="bugBody"></div>
    <div id="bugWhy"></div>
    <nav class="step-nav"><a class="btn" href="#bug">Alle Bugs</a><a class="btn${gefixt() ? ' primary' : ''}" id="bugNext" href="${next ? '#bug-' + next.id : '#training'}">${next ? 'Nächster Bug' : 'Zur Werkstatt'}</a></nav>`;
  const zeigWarum = () => { $('#bugWhy').innerHTML = `<div class="card bug-why"><p class="q-label">🔎 Die Ursache</p><p>${b.ursache}</p><p class="q-label">💼 Im Job</p><p>${b.job}</p></div>`; };
  renderCode($('#bugBody'), b.ex, b, { onSolved: () => { if (!a.bug[b.id]) { a.bug[b.id] = Date.now(); save(); } zeigWarum(); $('#bugNext').classList.add('primary'); } });
  if (a.bug[b.id]) zeigWarum();
}

/* ---------- 🔮 Was gibt das aus? ---------- */
async function runOutput(o) {
  const lines = [];
  const fmtV = v => typeof v === 'string' ? v : (v === undefined ? 'undefined' : JSON.stringify(v));
  const con = { log: (...xs) => lines.push(xs.map(fmtV).join(' ')) };
  const ng = createNg(); const core = ng.modules['@angular/core'];
  const env = Object.assign({}, window.rxjs, window.rxjs.operators, { signal: core.signal, computed: core.computed, effect: core.effect, untracked: core.untracked });
  const names = Object.keys(env).filter(k => /^[A-Za-z_$][\w$]*$/.test(k));
  // Echtes Angular: effect() braucht einen Injection Context, darum läuft der Schnipsel in dem der Test-App
  try { ng.runInInjectionContext(ng.root, () => new Function('console', ...names, o.code)(con, ...names.map(k => env[k]))); await new Promise(r => setTimeout(r, o.wait || 150)); }
  finally { ng.destroy(); }
  return lines;
}
function outPool() {
  const a = arena();
  const offen = OUTPUTS.filter(o => !a.out[o.id] || !a.out[o.id].ok);
  return offen.length ? offen : shuffleA(OUTPUTS);
}
function renderOutput(main) {
  const a = arena();
  let pool = outPool(), n = 0, richtig = 0, runde = 0;
  main.innerHTML = `<header class="ch-head"><p class="ort"><a href="#training">← Werkstatt</a></p><h1>🔮 Was gibt das aus?</h1><p class="tagline">Lies den Code. Tipp die Ausgaben in der richtigen Reihenfolge an. Nicht alle Kärtchen kommen vor.</p><div class="blitz-bar"><i id="outBar"></i></div></header><div id="outBody"></div>`;
  const body = $('#outBody');
  const themen = [...new Set(OUTPUTS.map(o => o.thema))];
  const zeig = () => {
    if (n >= pool.length) return ende();
    const o = pool[n]; runde++;
    $('#outBar').style.width = Math.round(OUTPUTS.filter(x => a.out[x.id] && a.out[x.id].ok).length / OUTPUTS.length * 100) + '%';
    const tiles = shuffleA(o.lines.concat(o.distract || []));
    const pick = [];
    body.innerHTML = `<div class="out-card" data-id="${o.id}"><p class="q-label">${esc(o.thema)} · ${esc(o.titel)}</p>
      <pre class="code"><code>${esc(o.code)}</code></pre>
      <p class="q-label">Konsole</p><div class="out-console" id="outAns"><span class="muted small">Tipp unten die Zeilen in der Reihenfolge an, in der sie erscheinen.</span></div>
      <div class="out-tiles">${tiles.map((t, k) => `<button class="tile" data-k="${k}" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      <div class="ai-row"><button class="btn primary" id="outCheck" disabled>Prüfen</button><button class="linkbtn" id="outUndo">Letzte zurück</button></div>
      <div id="outRes"></div></div>`;
    highlightIn(body);
    const ans = $('#outAns');
    const malAns = () => { ans.innerHTML = pick.length ? pick.map(k => `<div class="out-line">&gt; ${esc(tiles[k])}</div>`).join('') : '<span class="muted small">Tipp unten die Zeilen in der Reihenfolge an, in der sie erscheinen.</span>'; $('#outCheck').disabled = !pick.length; };
    body.querySelectorAll('.tile').forEach(t => t.onclick = () => { pick.push(+t.dataset.k); t.disabled = true; malAns(); });
    $('#outUndo').onclick = () => { const k = pick.pop(); if (k != null) body.querySelector('.tile[data-k="' + k + '"]').disabled = false; malAns(); };
    $('#outCheck').onclick = () => {
      const got = pick.map(k => tiles[k]); const ok = JSON.stringify(got) === JSON.stringify(o.lines);
      const st = a.out[o.id] || { ok: false, tries: 0 }; st.tries++;
      if (ok) { jubelRichtig($('#outCheck')); if (!st.ok) { st.ok = true; addXp(st.tries === 1 ? 15 : 5, st.tries === 1 ? 'Ausgabe vorhergesagt' : 'Ausgabe beim 2. Versuch'); } if (st.tries === 1) richtig++; }
      a.out[o.id] = st; save();
      body.querySelectorAll('.tile').forEach(t => t.disabled = true); $('#outCheck').disabled = true; $('#outUndo').hidden = true;
      $('#outRes').innerHTML = `<div class="out-res ${ok ? 'right' : 'wrong'}"><b>${ok ? 'Genau so!' : 'Nicht ganz.'}</b>${ok ? '' : ` Richtig ist:<div class="out-console">${o.lines.map(l => `<div class="out-line">&gt; ${esc(l)}</div>`).join('')}</div>`}<p>${o.warum}</p>${o.job ? `<p class="muted small"><b>Im Job:</b> ${o.job}</p>` : ''}</div>
        <div class="ai-row">${ok ? '' : '<button class="btn" id="outRetry">Nochmal versuchen</button>'}<button class="btn primary" id="outNext">Nächster Schnipsel</button></div>`;
      $('#outNext').onclick = () => { n++; zeig(); };
      const r = $('#outRetry'); if (r) r.onclick = () => zeig();
      $('#outNext').focus({ preventScroll: true });
    };
  };
  const ende = () => {
    const st = arenaStats();
    body.innerHTML = `<div class="end"><p class="score">${st.out}/${OUTPUTS.length}</p><p class="q-label">${st.out === OUTPUTS.length ? 'Alle Schnipsel geknackt. Du liest Code wie ein Compiler.' : 'Schnipsel sofort richtig. Die anderen kommen in der nächsten Runde zuerst.'}</p>
      <ul>${themen.map(t => { const all = OUTPUTS.filter(o => o.thema === t); const ok = all.filter(o => a.out[o.id] && a.out[o.id].ok).length; return `<li><b>${esc(t)}</b> <span class="muted">${ok}/${all.length}</span></li>`; }).join('')}</ul>
      <div class="ai-row"><button class="btn primary" id="outAgain">Noch eine Runde</button><a class="btn" href="#training">Werkstatt</a></div></div>`;
    $('#outAgain').onclick = () => { pool = outPool(); n = 0; zeig(); };
  };
  zeig();
}

/* ---------- 👀 Code-Review-Arena ---------- */
function renderReviewList(main) {
  const a = arena();
  main.innerHTML = `<header class="ch-head"><p class="ort"><a href="#training">← Werkstatt</a></p><h1>👀 Code-Review-Arena</h1><p class="tagline">Du bist als Reviewer eingetragen. Klick die Zeilen an, zu denen du einen Kommentar schreiben würdest. Vorsicht: Manche Zeilen sehen verdächtig aus und sind völlig okay.</p></header>
    ${rsStats().fertig < 3 ? '<div class="card rs-then"><p><b>Tipp:</b> Erst die Methode, dann die Arena. In der <a href="#rschule">🎓 Review-Schule</a> lernst du in 5-Minuten-Stationen, in welcher Reihenfolge du liest, wie du Funde markierst und wie du Kommentare formulierst.</p></div>' : ''}
    <div class="matches rv-list">${REVIEWS.map(r => { const st = a.rev[r.id]; return `<a class="match ${st && st.best === r.issues.length ? 'won' : ''}" href="#review-${r.id}"><span>${esc(r.titel)}</span><small>${esc(r.stufe)} · ${esc(r.datei)} · von ${esc(r.autor)}${st ? ' · bester Durchgang ' + st.best + '/' + r.issues.length : ''}</small></a>`; }).join('')}</div>`;
}

function renderReview(main, r) {
  const a = arena();
  const lines = r.code.split('\n');
  const flagged = new Set();
  const i = REVIEWS.indexOf(r), next = REVIEWS[i + 1];
  main.classList.add('wide');
  main.innerHTML = `<header class="ch-head"><p class="ort"><a href="#review">← Code-Review</a><span>${i + 1}/${REVIEWS.length}</span></p><h1>${esc(r.titel)}</h1><p class="tagline">${esc(r.datei)} · von ${esc(r.autor)}</p></header>
    <div class="ticket" data-typ="Review"><div class="tk-h"><span class="tk-id">PR #${40 + i}</span><span class="tk-typ">👀 Review</span></div><p class="tk-x">${esc(r.pr)}</p></div>
    <p class="muted small">Klick auf eine Zeile = Kommentar setzen. Nochmal klicken = zurücknehmen. Es gibt ${r.issues.length} echte Probleme.</p>
    <div class="rv-code" role="list">${lines.map((l, k) => `<button class="rv-line" role="listitem" data-n="${k + 1}"><span class="rv-n">${k + 1}</span><code>${esc(l) || ' '}</code></button>`).join('')}</div>
    <div class="ai-row"><button class="btn primary" id="rvSubmit">Review abschicken <span id="rvCount" class="pill">0</span></button><button class="linkbtn" id="rvReset" hidden>Nochmal von vorn</button></div>
    <div id="rvOut"></div>
    <nav class="step-nav"><a class="btn" href="#review">Alle PRs</a><a class="btn" id="rvNext" href="${next ? '#review-' + next.id : '#training'}">${next ? 'Nächster PR' : 'Zur Werkstatt'}</a></nav>`;
  const box = $('.rv-code', main);
  if (window.CodeMirror && CodeMirror.runMode) box.querySelectorAll('.rv-line code').forEach(c => { const t = c.textContent; c.textContent = ''; c.classList.add('cm-s-ngq'); CodeMirror.runMode(t, 'text/typescript', c); });
  let done = false;
  box.querySelectorAll('.rv-line').forEach(b => b.onclick = () => {
    if (done) { const n = +b.dataset.n; const el = document.getElementById('rvi-' + n); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    const n = +b.dataset.n; if (flagged.has(n)) flagged.delete(n); else flagged.add(n);
    b.classList.toggle('flag', flagged.has(n)); $('#rvCount').textContent = flagged.size;
  });
  $('#rvSubmit').onclick = () => {
    done = true; $('#rvSubmit').disabled = true; $('#rvReset').hidden = false;
    /* Abgeschickt: Jetzt ist der Weg zum nächsten PR die Hauptaktion */
    $('#rvSubmit').classList.remove('primary'); $('#rvNext').classList.add('primary');
    const hit = r.issues.filter(is => is.lines.some(l => flagged.has(l)));
    const issueLines = new Set(r.issues.flatMap(is => is.lines));
    const fa = [...flagged].filter(n => !issueLines.has(n)).sort((x, y) => x - y);
    box.querySelectorAll('.rv-line').forEach(b => {
      const n = +b.dataset.n; const is = r.issues.find(x => x.lines.includes(n));
      if (is) b.classList.add(hit.includes(is) ? 'hit' : 'miss');
      else if (flagged.has(n)) b.classList.add('fa');
      if (is && is.lines[0] === n) b.insertAdjacentHTML('beforeend', `<span class="rv-tag ${SEV[is.sev][1]}">${SEV[is.sev][0]}</span>`);
    });
    const st = a.rev[r.id] || { best: 0, runs: 0 }; st.runs++;
    const neu = Math.max(0, hit.length - st.best);
    if (neu) addXp(neu * 10, 'Review-Funde');
    st.best = Math.max(st.best, hit.length); st.last = { hit: hit.length, fa: fa.length }; a.rev[r.id] = st; save();
    const quote = hit.length / r.issues.length;
    $('#rvOut').innerHTML = `<div class="rv-result end"><p class="score">${hit.length}/${r.issues.length} gefunden</p>
      <p class="q-label">${quote === 1 ? (fa.length ? 'Alles gefunden. Aber schau dir die Fehlalarme an.' : 'Perfektes Review. So sieht ein Senior aus.') : quote >= .5 ? 'Solide. Die übersehenen Punkte kosten im Betrieb am meisten.' : 'Da ist noch Luft. Lies dir die übersehenen Punkte genau durch.'}${fa.length ? ' · ' + fa.length + ' Fehlalarm' + (fa.length === 1 ? '' : 'e') : ''}</p>
      <div class="rv-issues">${r.issues.map(is => `<div class="rv-issue ${hit.includes(is) ? 'hit' : 'miss'}" id="rvi-${is.lines[0]}"><p><span class="rv-tag ${SEV[is.sev][1]}">${SEV[is.sev][0]}</span> <b>Zeile ${is.lines[0]}: ${esc(is.titel)}</b> ${hit.includes(is) ? '✓' : '<span class="muted">übersehen</span>'}</p><p>${esc(is.warum)}</p><p class="rv-fix"><b>Vorschlag:</b> <code>${esc(is.fix)}</code></p></div>`).join('')}
      ${fa.map(n => { const f = (r.fallen || []).find(x => x.line === n); return `<div class="rv-issue fa" id="rvi-${n}"><p><b>Zeile ${n}: Fehlalarm</b></p><p>${f ? esc(f.warum) : 'Hier ist nichts Wichtiges falsch. Im echten Review kostet so ein Kommentar Zeit und Vertrauen.'}</p></div>`; }).join('')}</div>
      <div class="card rv-write"><p class="q-label">✍️ Jetzt der echte Teil: Schreib einen Kommentar, so wie du ihn im PR posten würdest</p><p class="muted small">Nimm dir ein Problem aus der Liste oben. Format: <code>label (deko): Was. Warum. Vorschlag.</code></p><textarea class="recall" id="rvComment" rows="3" placeholder="issue (blocking): Hier … weil … Vorschlag: …"></textarea><div class="ai-row"><button class="btn" id="rvAsk">Kommentar prüfen</button><a class="linkbtn" href="#rschule-werkstatt">Mehr üben: Kommentar-Werkstatt</a></div><div id="rvCheck"></div>${hasAi() ? '<div id="rvAi" class="ai-box" hidden></div>' : ''}</div></div>`;
    $('#rvAsk').onclick = () => {
      const c = $('#rvComment').value.trim(); if (!c) { $('#rvComment').focus(); return; }
      const res = kommentarCheck(c, null);
      $('#rvCheck').innerHTML = `<div class="out-res ${res.score === res.max ? 'right' : ''}"><p><b>${res.score === res.max ? 'Saubere Form.' : 'Form-Check:'}</b> <span class="muted">${res.score}/${res.max}</span></p>${kommentarCheckHtml(res)}${hasAi() ? '' : '<p class="muted small">Ob dein Punkt auch fachlich stimmt, prüft Toni mit KI (Einstellungen, Reiter „Coach Toni“).</p>'}</div>`;
      if (hasAi()) toniStream(rsAiPrompt(r.datei, r.code, r.pr, c), $('#rvAi'), { cache: false });
    };
    $('#rvOut').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $('#rvReset').onclick = () => renderReview(main, r);
}

/* ---------- 🎤 Mock-Interview ---------- */
let ivTimer = null, ivRec = null;
function ivStop() { clearInterval(ivTimer); ivTimer = null; if (ivRec) { try { ivRec.stop(); } catch (e) {} ivRec = null; } }
function renderInterview(main) {
  const a = arena();
  ivStop();
  const stufen = ['Alle', 'Junior', 'Mid', 'Senior'];
  const letzte = {}; a.iv.forEach(x => { letzte[x.id] = x; });
  const avg = a.iv.length ? (a.iv.slice(-10).reduce((s, x) => s + x.score, 0) / Math.min(10, a.iv.length)).toFixed(1) : null;
  main.innerHTML = `<header class="ch-head"><p class="ort"><a href="#training">← Werkstatt</a></p><h1>🎤 Mock-Interview</h1><p class="tagline">5 Fragen, wie im echten Gespräch. Pro Frage ein Timer. Antworte in eigenen Worten, gern in Stichpunkten${window.SpeechRecognition || window.webkitSpeechRecognition ? ' oder per Mikrofon' : ''}.</p></header>
    <div class="card"><p class="q-label">Für welche Stelle übst du?</p><div class="iv-levels">${stufen.map((s, k) => `<button class="tile${k === 0 ? ' on' : ''}" data-s="${s}">${s}</button>`).join('')}</div>
    <p class="muted small">${hasAi() ? 'Toni bewertet jede Antwort wie ein Interviewer (0 bis 10 Punkte) und stellt eine Nachfrage.' : 'Ohne KI vergleichst du selbst mit den Kernpunkten. Mit KI (Einstellungen, Reiter „Coach Toni“) bewertet Toni wie ein Interviewer.'}${avg ? ' · Deine letzten Antworten: Ø ' + avg + '/10' : ''}</p>
    <div class="ai-row"><button class="btn primary big" id="ivStart">Interview starten</button></div></div>
    ${a.iv.length ? `<div class="card"><p class="q-label">Bisher geübt</p><ul class="iv-hist">${INTERVIEW.filter(q => letzte[q.id]).map(q => `<li><span class="iv-score s${Math.round(letzte[q.id].score / 3.4)}">${letzte[q.id].score}</span> ${esc(q.q)} <small class="muted">${esc(q.stufe)} · ${esc(q.thema)}</small></li>`).join('')}</ul></div>` : ''}`;
  let stufe = 'Alle';
  main.querySelectorAll('.iv-levels .tile').forEach(b => b.onclick = () => { stufe = b.dataset.s; main.querySelectorAll('.iv-levels .tile').forEach(x => x.classList.toggle('on', x === b)); });
  $('#ivStart').onclick = () => {
    const pool = INTERVIEW.filter(q => stufe === 'Alle' || q.stufe === stufe);
    /* Noch nie gefragt zuerst, dann die schwächsten */
    const sorted = shuffleA(pool).sort((x, y) => (letzte[x.id] ? letzte[x.id].score + 1 : 0) - (letzte[y.id] ? letzte[y.id].score + 1 : 0));
    ivRunde(main, sorted.slice(0, 5));
  };
}
function ivRunde(main, fragen) {
  const a = arena(); const ergebnisse = []; let n = 0;
  const sekFuer = q => q.stufe === 'Senior' ? 240 : q.stufe === 'Mid' ? 180 : 120;
  const zeig = () => {
    ivStop();
    if (n >= fragen.length) return ende();
    const q = fragen[n]; let rest = sekFuer(q);
    const speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    main.innerHTML = `<header class="ch-head"><p class="ort"><a href="#interview">← Mock-Interview</a><span>Frage ${n + 1}/${fragen.length}</span></p><h1 class="iv-q">${esc(q.q)}</h1><p class="tagline">${esc(q.stufe)} · ${esc(q.thema)}</p><div class="blitz-bar"><i style="width:${Math.round(n / fragen.length * 100)}%"></i></div></header>
      <div class="card iv-card"><div class="iv-top"><span class="iv-clock" id="ivClock"></span>${speech ? '<button class="btn" id="ivMic">🎙️ Sprechen</button>' : ''}</div>
      <textarea class="recall" id="ivAnswer" rows="8" placeholder="Deine Antwort. Struktur hilft: Was ist es? Wie funktioniert es? Wo hat es dir im Job geholfen oder geschadet?"></textarea>
      <div class="ai-row"><button class="btn primary" id="ivSubmit">Antwort abgeben</button><button class="linkbtn" id="ivSkip">Weiß ich nicht, Lösung zeigen</button></div></div>
      <div id="ivOut"></div>`;
    const clock = $('#ivClock');
    const tick = () => { const m = Math.floor(Math.abs(rest) / 60), s = String(Math.abs(rest) % 60).padStart(2, '0'); clock.textContent = (rest < 0 ? 'Überzogen +' : '⏱ ') + m + ':' + s; clock.classList.toggle('over', rest < 0); rest--; };
    tick(); ivTimer = setInterval(tick, 1000);
    $('#ivAnswer').focus({ preventScroll: true });
    const mic = $('#ivMic');
    if (mic) mic.onclick = () => {
      if (ivRec) { ivRec.stop(); return; }
      try {
        const rec = new speech(); rec.lang = 'de-DE'; rec.continuous = true; rec.interimResults = false; ivRec = rec;
        rec.onresult = e => { const ta = $('#ivAnswer'); if (!ta) return; for (let k = e.resultIndex; k < e.results.length; k++) if (e.results[k].isFinal) ta.value += (ta.value && !/\s$/.test(ta.value) ? ' ' : '') + e.results[k][0].transcript.trim(); };
        rec.onend = () => { ivRec = null; const m = $('#ivMic'); if (m) { m.textContent = '🎙️ Sprechen'; m.classList.remove('rec'); } };
        rec.onerror = ev => toast('Mikrofon: ' + (ev.error === 'not-allowed' ? 'nicht erlaubt' : ev.error));
        rec.start(); mic.textContent = '⏹ Stopp'; mic.classList.add('rec');
      } catch (e) { toast('Spracheingabe geht hier nicht.'); }
    };
    const abgeben = skip => {
      const dauer = sekFuer(q) - rest - 1;
      ivStop();
      const antwort = skip ? '' : $('#ivAnswer').value.trim();
      $('#ivAnswer').disabled = true; $('#ivSubmit').disabled = true; $('#ivSkip').hidden = true; if (mic) mic.disabled = true;
      const out = $('#ivOut');
      out.innerHTML = `${hasAi() && antwort ? '<div class="card"><p class="q-label">🎙️ Interviewer Toni</p><div id="ivAi" class="ai-box"></div></div>' : ''}
        <div class="card"><p class="q-label">${antwort ? 'Selbstcheck: Was davon hattest du drin?' : 'Das gehört in eine starke Antwort'}</p>
        <div class="iv-check">${q.punkte.map((p, k) => `<label><input type="checkbox" data-k="${k}"> ${esc(p)}</label>`).join('')}</div>
        <p class="muted small"><b>Typische Nachfrage:</b> ${esc(q.nach)}</p>
        <div class="ai-row"><button class="btn primary" id="ivNext">${n + 1 < fragen.length ? 'Nächste Frage' : 'Auswertung'}</button></div></div>`;
      let aiScore = null;
      if (hasAi() && antwort) {
        toniStream(TONI + '\n\nDu bist jetzt Interviewer für eine ' + q.stufe + '-Angular-Stelle. Frage: „' + q.q + '“\nKernpunkte einer starken Antwort: ' + q.punkte.join(' | ') + '\nAntwort des Kandidaten (' + dauer + ' Sekunden):\n"""' + antwort + '"""\n\nBewerte ehrlich wie in einem echten Interview. Format genau so:\n**Punkte: X/10**\n**Stark:** 1 Satz.\n**Gefehlt:** die wichtigsten fehlenden oder falschen Punkte als kurze Liste.\n**So klingt eine 10/10:** 3-4 Sätze, wie man es im Gespräch sagen würde.\n**Nachfrage:** eine Nachfrage, die ein Interviewer jetzt stellen würde.\nMax. 220 Wörter.', $('#ivAi'), { cache: false }).then(t => { const m = t && t.match(/Punkte:\s*\**\s*(\d+(?:[.,]\d)?)\s*\/\s*10/i); if (m) aiScore = Math.min(10, Math.round(parseFloat(m[1].replace(',', '.')))); });
      }
      $('#ivNext').onclick = () => {
        const checked = out.querySelectorAll('.iv-check input:checked').length;
        const self = antwort ? Math.round(checked / q.punkte.length * 10) : 0;
        const score = aiScore != null ? aiScore : self;
        a.iv.push({ id: q.id, score, t: Date.now() }); if (a.iv.length > 200) a.iv.splice(0, a.iv.length - 200);
        ergebnisse.push({ q, score, ai: aiScore != null });
        if (antwort) addXp(10 + score, 'Interview-Antwort'); else save();
        n++; zeig();
      };
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    $('#ivSubmit').onclick = () => abgeben(false);
    $('#ivSkip').onclick = () => abgeben(true);
  };
  const ende = () => {
    const avg = ergebnisse.reduce((s, x) => s + x.score, 0) / ergebnisse.length;
    const urteil = avg >= 8 ? 'Klare Zusage. Du würdest eingestellt.' : avg >= 6 ? 'Gute Chancen. Ein, zwei Themen nacharbeiten.' : avg >= 4 ? 'Noch nicht ganz. Arbeite die schwachen Fragen nach und übe sie laut.' : 'Das wird. Nimm dir die Kernpunkte vor und starte eine neue Runde.';
    main.innerHTML = `<header class="ch-head"><p class="ort"><a href="#training">← Werkstatt</a></p><h1>🎤 Auswertung</h1></header>
      <div class="end"><p class="score">Ø ${avg.toFixed(1)}/10</p><p class="q-label">${urteil}</p>
      <ul>${ergebnisse.map(e => `<li><span class="iv-score s${Math.round(e.score / 3.4)}">${e.score}</span> ${esc(e.q.q)} <small class="muted">${e.ai ? 'von Toni bewertet' : 'Selbstcheck'}</small></li>`).join('')}</ul>
      <div class="ai-row"><button class="btn primary" id="ivAgain">Neue Runde</button><a class="btn" href="#training">Werkstatt</a></div></div>`;
    $('#ivAgain').onclick = () => renderInterview(main);
  };
  zeig();
}
