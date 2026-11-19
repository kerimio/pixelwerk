/* ================= 🎓 REVIEW-SCHULE =================
   Review-Methodik zum Üben (Inhalte in content-review.js).
   #rschule            Übersicht der Stationen
   #rschule-<id>       eine Station (Sortieren, Auswählen oder Kommentare schreiben)
   #rschule-spick      Spickzettel: die ganze Methode auf einer Seite
   Wirkt über: sofortiges Feedback mit Begründung, falsche Karten kommen in derselben Runde wieder
   (Successive Relearning), gemischte Reihenfolge (Interleaving), selbst formulieren (Generation-Effekt). */

function rsState() { const a = arena(); a.rs = a.rs || {}; a.rsw = a.rsw || {}; return a; }

function rsStats() {
  const a = rsState();
  const finished = RS_STATIONS.filter(s => a.rs[s.id]).length;
  return { finished, overall: RS_STATIONS.length, werkstatt: RS_WORKSHOP.filter(w => (a.rsw[w.id] || 0) >= 4).length };
}

/* ---------- Kommentar-Check ohne KI ----------
   Prüft einen Review-Kommentar auf: Label passt zur Schwere, trifft das Problem, Warum, Vorschlag/Frage, Ton.
   aufg darf null sein (z. B. in der Review-Arena): dann ohne Schwere- und Treffer-Prüfung. */
const RS_LABELS = [
  [/^\s*\**\s*(issue|muss|blocker|todo|problem)\b/i, 'muss'],
  [/^\s*\**\s*(suggestion|vorschlag|sollte|wichtig)\b/i, 'sollte'],
  [/^\s*\**\s*(nitpick|nit|kleinigkeit)\b/i, 'nit'],
  [/^\s*\**\s*(question|frage)\b/i, 'frage'],
  [/^\s*\**\s*(praise|lob)\b/i, 'lob'],
  [/^\s*\**\s*(thought|gedanke|idee|chore)\b/i, 'thought']
];
const RS_FITS = { muss: ['muss'], sollte: ['sollte', 'muss'], nit: ['nit', 'thought', 'sollte'], frage: ['frage'], lob: ['lob'] };
const RS_SEV_TIPP = {
  muss: 'Das blockiert den Merge. Markier es so: „issue (blocking): …“',
  sollte: 'Wichtig, aber kein Blocker: „suggestion: …“ passt.',
  nit: 'Das ist eine Kleinigkeit. Mit „nitpick:“ merkt der Autor, dass er es nicht ändern muss. Alles andere wirkt wie ein Blocker.',
  frage: 'Du weißt es nicht sicher. Mit „question:“ fragst du, statt zu urteilen.',
  lob: 'Das ist ein Lob. „praise:“ davor, dann kommt es auch so an.'
};
const RS_WHY = /\b(weil|da|sonst|dadurch|deshalb|deswegen|damit|führt|passiert|bedeutet|riskier\w*|landet|läuft|fällt|merkt|bleibt|überschreib\w*|blockier\w*|kostet|wenn|falls|bei jedem|beim)\b|→|->/i;
const RS_SUGGESTION = /vorschlag|z\.\s?b\.|zum beispiel|\bstatt\b|lieber|besser|könnten wir|können wir|wie wäre|was hältst|\bnimm\b|nutze|verwende|`[^`]+`|```/i;
const RS_TONE = /\b(einfach|offensichtlich|natürlich|eindeutig|schlecht\w*|quatsch|unsinn|schrott|katastrophe|peinlich\w*|ernsthaft|sowieso|warum hast du|wieso hast du|du hast|du musst|du solltest)\b|\bdu \w+ (immer|nie)\b|!!+|\?\?+|🙄|🤦/i;

function commentCheck(text, task) {
  const t = String(text || '').trim();
  let label = null;
  for (const [re, l] of RS_LABELS) if (re.test(t)) { label = l; break; }
  let eff = label;
  if (label && /\(\s*(blocking|blockierend)\s*\)/i.test(t)) eff = 'muss';
  if (label === 'muss' && /non-?blocking|nicht blockierend/i.test(t)) eff = 'sollte';
  if (label && label !== 'muss' && /non-?blocking/i.test(t)) eff = label;
  const sev = task && task.sev;
  const checks = [];
  /* 1. Label und Schwere */
  if (!label) checks.push({ name: 'Label', ok: false, tip: 'Fang mit einem Label an: „issue (blocking):“, „suggestion:“, „nitpick:“, „question:“ oder „praise:“. Dann weiß der Autor sofort, wie wichtig es ist.' });
  else if (sev && !RS_FITS[sev].includes(eff)) checks.push({ name: 'Schwere', ok: false, tip: RS_SEV_TIPP[sev] });
  else checks.push({ name: sev ? 'Label passt' : 'Label', ok: true });
  /* 2. Trifft das Problem */
  if (task) checks.push(task.keys.test(t) ? { name: 'Trifft den Punkt', ok: true } : { name: 'Trifft den Punkt', ok: false, tip: task.keyTip });
  /* 3. Warum (bei Lob: konkret) */
  if (sev === 'lob') checks.push(t.length >= 45 ? { name: 'Konkret', ok: true } : { name: 'Konkret', ok: false, tip: 'Sag, was genau gut ist und warum. „Nice“ allein bleibt nicht hängen.' });
  else checks.push(RS_WHY.test(t) ? { name: 'Warum', ok: true } : { name: 'Warum', ok: false, tip: 'Sag, was sonst passiert: „…, weil …“ oder „sonst …“. Ohne Warum kann der Autor nicht abwägen.' });
  /* 4. Vorschlag (bei Frage: echte Frage) */
  if (sev === 'frage') checks.push(/\?/.test(t) ? { name: 'Echte Frage', ok: true } : { name: 'Echte Frage', ok: false, tip: 'Eine Frage braucht ein Fragezeichen, am besten mit deiner Vermutung: „Ist das wegen …?“' });
  else if (sev !== 'lob') checks.push(RS_SUGGESTION.test(t) ? { name: 'Vorschlag', ok: true } : { name: 'Vorschlag', ok: false, tip: 'Zeig einen Weg: „Vorschlag: …“, „statt X lieber Y“ oder ein Schnipsel in `Backticks`.' });
  /* 5. Ton */
  const bad = t.match(RS_TONE);
  checks.push(bad ? { name: 'Ton', ok: false, tip: '„' + bad[0].trim() + '“ klingt nach Vorwurf oder Urteil. Rede über den Code, nicht über die Person.' } : { name: 'Ton', ok: true });
  const notices = [];
  if (t.length < 25) notices.push('Sehr kurz. Ein guter Kommentar braucht meist 1 bis 3 Sätze.');
  if (t.length > 600) notices.push('Ziemlich lang. Im PR liest das keiner ganz. Kürzen, oder lieber kurz reden.');
  const score = checks.filter(c => c.ok).length;
  return { checks, score: t.length < 25 ? Math.min(score, 2) : score, max: checks.length, notices };
}

function commentCheckHtml(res) {
  return `<div class="rs-chips">${res.checks.map(c => `<span class="rs-chip ${c.ok ? 'ok' : 'no'}">${c.ok ? '✓' : '✗'} ${esc(c.name)}</span>`).join('')}</div>
    ${res.checks.filter(c => !c.ok).concat(res.notices.map(h => ({ tip: h }))).map(c => `<p class="rs-tip">${esc(c.tip)}</p>`).join('')}`;
}

function rsAiPrompt(file, code, situation, comment) {
  return TONI + '\n\nDer Lernende übt, Code-Review-Kommentare zu schreiben (Conventional Comments: issue/suggestion/nitpick/question/praise, Deko blocking/non-blocking). Datei ' + file + ':\n```ts\n' + code + '\n```\n' + (situation ? 'Situation: ' + situation + '\n' : '') + 'Sein Kommentar:\n"""' + comment + '"""\n\nBewerte wie ein Senior im Review, max. 100 Wörter, genau dieses Format:\n**Sache:** Stimmt der Punkt fachlich? 1 Satz.\n**Form:** Label/Schwere, Warum, Vorschlag: was fehlt? 1 Satz.\n**Ton:** 1 kurzer Satz.\n**Besser so:** deine Version, 1 bis 3 Sätze, im Conventional-Comments-Format.';
}

/* ---------- Ansichten ---------- */
function renderRSchool(main, id) {
  if (id === 'rschule') return renderRsList(main);
  if (id === 'rschule-spick') return renderRsCheat(main);
  const st = RS_STATIONS.find(s => 'rschule-' + s.id === id);
  return st ? renderRsStation(main, st) : renderRsList(main);
}

function renderRsList(main) {
  const a = rsState(); const s = rsStats();
  const next = RS_STATIONS.find(x => !a.rs[x.id]);
  main.innerHTML = `<header class="ch-head"><p class="loc"><a href="#training">← Werkstatt</a></p><h1>🎓 Review-Schule</h1>
    <p class="tagline">Code Reviews mit Methode. Sieben Stationen, je 5 Minuten. Danach weißt du, wo du hinschaust, wie du es markierst und wie du es sagst.</p>
    <div class="hero-cta">${next ? `<a class="btn primary big" href="#rschule-${next.id}">${s.finished ? 'Weiter' : 'Los geht\'s'}: ${next.icon} ${esc(next.heading)}</a>` : '<a class="btn primary big" href="#review">Jetzt anwenden: Review-Arena</a>'}<a class="btn big" href="#rschule-spick">📋 Spickzettel</a></div></header>
    <div class="rs-grid">${RS_STATIONS.map((x, k) => { const r = a.rs[x.id]; const extra = x.id === 'werkstatt' ? s.werkstatt + '/' + RS_WORKSHOP.length + ' Kommentare stark' : r ? 'bestes Ergebnis ' + r.best + '/' + r.max : 'noch offen'; return `<a class="rs-st ${r ? 'won' : ''}" href="#rschule-${x.id}"><span class="rs-nr">${k + 1}</span><span class="rs-i" aria-hidden="true">${x.icon}</span><b>${esc(x.heading)}</b><span class="ac-w">${esc(x.short)}</span><small>${r ? '✓ ' : ''}${extra}</small></a>`; }).join('')}</div>
    <div class="card rs-then"><p class="q-label">Und dann?</p><p>Wende es an echten PRs an: In der <a href="#review">👀 Code-Review-Arena</a> markierst du Zeilen und schreibst deine Kommentare. Die Werkstatt-Prüfung läuft dort auch.</p></div>`;
}

function renderRsStation(main, st) {
  const a = rsState();
  const i = RS_STATIONS.indexOf(st), next = RS_STATIONS[i + 1];
  const alreadyOnce = !!a.rs[st.id];
  main.innerHTML = `<header class="ch-head"><p class="loc"><a href="#rschule">← Review-Schule</a><span>${i + 1}/${RS_STATIONS.length}</span></p><h1>${st.icon} ${esc(st.heading)}</h1><p class="tagline">${esc(st.short)}</p><div class="blitz-bar"><i id="rsBar"></i></div></header>
    <details class="card rs-memo"${alreadyOnce ? '' : ' open'}><summary class="q-label">📋 Das Wichtigste in 30 Sekunden</summary><ul>${st.memo.map(m => `<li>${m}</li>`).join('')}</ul></details>
    <div id="rsBody"></div>
    <nav class="step-nav"><a class="btn" href="#rschule">Alle Stationen</a>${next ? `<a class="btn" href="#rschule-${next.id}">Nächste Station</a>` : '<a class="btn" href="#rschule-spick">Spickzettel</a>'}</nav>`;
  if (st.rounds[0].category === 'schreib') return rsWorkshop(main, st);
  rsDrill(main, st);
}

/* Sortier- und Auswahl-Karten: eine nach der anderen, falsche kommen am Ende der Runde nochmal. */
function rsDrill(main, st) {
  const a = rsState(); const body = $('#rsBody');
  let queue = [];
  st.rounds.forEach((r, ri) => {
    if (r.category === 'sort') queue.push(...shuffleA(r.cards.map(k => ({ r, k, ri }))));
    if (r.category === 'wahl') queue.push(...r.items.map(k => ({ r, k, ri })));
  });
  const max = queue.length; let pos = 0, right = 0; const retry = new Set();
  const bar = () => { $('#rsBar').style.width = Math.round(Math.min(pos, max) / max * 100) + '%'; };
  const showIt = () => {
    bar();
    if (!queue.length) return ending();
    const it = queue[0]; const again = retry.has(it);
    if (it.r.category === 'sort') {
      const k = it.k, ok = [].concat(k.b);
      body.innerHTML = `<div class="card rs-card"><p class="q-label">${esc(it.r.frage)}${again ? ' · <span class="rs-again">nochmal</span>' : ''}</p>
        ${k.code ? `<pre class="code"><code>${esc(k.code)}</code></pre>` : ''}${k.text ? `<p class="rs-text">${esc(k.text)}</p>` : ''}
        <div class="rs-buckets">${it.r.buckets.map((b, n) => `<button class="rs-b" data-b="${b.id}"><span class="key">${n + 1}</span>${esc(b.label)}</button>`).join('')}</div><div id="rsRes"></div></div>`;
      highlightIn(body);
      body.querySelectorAll('.rs-b').forEach(btn => btn.onclick = () => {
        const hits = ok.includes(btn.dataset.b);
        body.querySelectorAll('.rs-b').forEach(x => { x.disabled = true; if (ok.includes(x.dataset.b)) x.classList.add('right'); });
        if (!hits) btn.classList.add('wrong');
        const label = ok.map(id => it.r.buckets.find(b => b.id === id).label).join(' oder ');
        proceed(hits, `<b>${hits ? 'Richtig.' : 'Eher: ' + esc(label) + '.'}</b> ${esc(k.reasonWhy)}`);
      });
    } else {
      const k = it.k;
      /* Antworten gemischt: data-n bleibt der Index aus den Daten, die Tasten-Zahl ist die Stelle am Bildschirm */
      body.innerHTML = `<div class="card rs-card"><p class="q-label">${esc(it.r.frage)}${again ? ' · <span class="rs-again">nochmal</span>' : ''}</p><p class="rs-situation">${k.situation}</p>
        <div class="opts">${shuffleA(k.opts.map((o, n) => n)).map((n, spot) => `<button class="opt" data-n="${n}"><span class="key">${spot + 1}</span><span>${esc(k.opts[n].t)}</span></button>`).join('')}</div><div id="rsRes"></div></div>`;
      body.querySelectorAll('.opt').forEach(btn => btn.onclick = () => {
        const o = k.opts[+btn.dataset.n];
        body.querySelectorAll('.opt').forEach(x => { x.disabled = true; const oo = k.opts[+x.dataset.n]; if (oo.ok) x.classList.add('right'); });
        if (!o.ok) btn.classList.add('wrong');
        const fine = k.opts.find(x => x.ok);
        proceed(o.ok, `<b>${o.ok ? 'Genau.' : 'Nicht ganz.'}</b> ${esc(o.reasonWhy)}${o.ok ? '' : `<br><span class="muted small">Besser: ${esc(fine.t)} ${esc(fine.reasonWhy)}</span>`}`);
      });
    }
  };
  const proceed = (ok, html) => {
    const it = queue.shift();
    if (ok) { if (!retry.has(it)) right++; pos++; }
    else { retry.add(it); queue.push(it); }
    $('#rsRes').innerHTML = `<div class="out-res ${ok ? 'right' : 'wrong'}"><p>${html}</p></div><div class="ai-row"><button class="btn primary" id="rsNext">${queue.length ? 'Weiter' : 'Auswertung'}</button></div>`;
    $('#rsNext').onclick = showIt; $('#rsNext').focus({ preventScroll: true });
  };
  const ending = () => {
    bar();
    const alt = a.rs[st.id];
    const fresh = !alt || right > alt.best;
    a.rs[st.id] = { best: Math.max(right, alt ? alt.best : 0), max, t: Date.now() };
    if (fresh) addXp(Math.max(5, (right - (alt ? alt.best : 0)) * 5) + (alt ? 0 : 20), 'Review-Schule: ' + st.heading); else save();
    const quote = right / max;
    const i = RS_STATIONS.indexOf(st), next = RS_STATIONS[i + 1];
    body.innerHTML = `<div class="end"><p class="score">${right}/${max}</p><p class="q-label">${quote === 1 ? 'Alles beim ersten Mal. Das sitzt.' : quote >= .75 ? 'Stark. Die Wackelkandidaten hast du jetzt zweimal gesehen.' : 'Gut, dass du es hier lernst und nicht im echten PR. Nochmal eine Runde?'} ${retry.size ? '· ' + retry.size + ' Karte' + (retry.size === 1 ? '' : 'n') + ' nachgeholt' : ''}</p>
      <div class="card rs-memo"><p class="q-label">Das nimmst du mit</p><ul>${st.memo.map(m => `<li>${m}</li>`).join('')}</ul></div>
      <div class="ai-row">${next ? `<a class="btn primary" href="#rschule-${next.id}">Nächste Station: ${next.icon} ${esc(next.heading)}</a>` : '<a class="btn primary" href="#review">Jetzt anwenden: Review-Arena</a>'}<button class="btn" id="rsAgain">Nochmal</button></div></div>`;
    $('#rsAgain').onclick = () => renderRsStation(main, st);
  };
  showIt();
}

/* Kommentar-Werkstatt: Code mit markierter Zeile, du schreibst den Kommentar. */
function rsWorkshop(main, st) {
  const a = rsState(); const body = $('#rsBody');
  const pending = RS_WORKSHOP.findIndex(w => (a.rsw[w.id] || 0) < 4);
  let n = pending < 0 ? 0 : pending;
  const showIt = () => {
    const w = RS_WORKSHOP[n];
    $('#rsBar').style.width = Math.round(RS_WORKSHOP.filter(x => (a.rsw[x.id] || 0) >= 4).length / RS_WORKSHOP.length * 100) + '%';
    const lines = w.code.split('\n');
    body.innerHTML = `<div class="rs-tabs">${RS_WORKSHOP.map((x, k) => `<button class="rs-tab ${k === n ? 'on' : ''} ${(a.rsw[x.id] || 0) >= 4 ? 'won' : ''}" data-k="${k}" title="${esc(x.heading)}">${k + 1}</button>`).join('')}</div>
      <div class="card rs-card"><p class="q-label">Aufgabe ${n + 1}/${RS_WORKSHOP.length} · ${esc(w.heading)} · ${esc(w.file)}</p><p class="rs-situation">${esc(w.situation)}</p>
      <div class="rv-code rs-code">${lines.map((l, k) => `<div class="rv-line${k + 1 === w.codeLine ? ' flag' : ''}"><span class="rv-n">${k + 1}</span><code>${esc(l) || ' '}</code></div>`).join('')}</div>
      <label class="q-label" for="rsComment">Dein Kommentar zu Zeile ${w.codeLine}</label>
      <textarea class="recall" id="rsComment" rows="4" placeholder="issue (blocking): … weil … Vorschlag: …"></textarea>
      <div class="ai-row"><button class="btn primary" id="rsCheck">Prüfen</button><button class="linkbtn" id="rsShow">Musterkommentar zeigen</button></div>
      <div id="rsRes"></div></div>`;
    const box = $('.rs-code', body);
    if (window.CodeMirror && CodeMirror.runMode) box.querySelectorAll('code').forEach(c => { const t = c.textContent; c.textContent = ''; c.classList.add('cm-s-ngq'); CodeMirror.runMode(t, 'text/typescript', c); });
    body.querySelectorAll('.rs-tab').forEach(b => b.onclick = () => { n = +b.dataset.k; showIt(); });
    const nav = () => `<div class="ai-row">${n + 1 < RS_WORKSHOP.length ? '<button class="btn primary" id="rsNext">Nächste Aufgabe</button>' : '<a class="btn primary" href="#rschule-' + (RS_STATIONS[RS_STATIONS.indexOf(st) + 1] || {}).id + '">Nächste Station</a>'}<button class="linkbtn" id="rsRetry">Nochmal schreiben</button></div>`;
    const bindNav = () => { const nx = $('#rsNext'); if (nx) { nx.onclick = () => { n++; showIt(); }; nx.focus({ preventScroll: true }); } $('#rsRetry').onclick = () => { $('#rsComment').disabled = false; $('#rsCheck').disabled = false; $('#rsRes').innerHTML = ''; $('#rsComment').focus(); }; };
    $('#rsShow').onclick = () => { $('#rsRes').innerHTML = `<div class="out-res"><p class="q-label">So würde es ein Senior schreiben</p><div class="rs-pattern">${md(w.pattern)}</div></div>${nav()}`; bindNav(); };
    $('#rsCheck').onclick = () => {
      const txt = $('#rsComment').value.trim(); if (!txt) { $('#rsComment').focus(); return; }
      const res = commentCheck(txt, w);
      const alt = a.rsw[w.id] || 0;
      if (res.score > alt) { a.rsw[w.id] = res.score; if (res.score === res.max && alt < res.max) addXp(alt >= 4 ? 5 : 20, 'Starker Review-Kommentar'); else if (res.score >= 4 && alt < 4) addXp(10, 'Guter Review-Kommentar'); else save(); }
      const top = res.score === res.max;
      $('#rsComment').disabled = true; $('#rsCheck').disabled = true;
      $('#rsRes').innerHTML = `<div class="out-res ${top ? 'right' : res.score >= 3 ? '' : 'wrong'}"><p><b>${top ? 'Stark! So kommt der Kommentar an.' : res.score >= 3 ? 'Schon gut. Das fehlt noch:' : 'Da geht noch was:'}</b> <span class="muted">${res.score}/${res.max}</span></p>${commentCheckHtml(res)}
        <p class="q-label" style="margin-top:12px">So würde es ein Senior schreiben</p><div class="rs-pattern">${md(w.pattern)}</div></div>
        ${hasAi() ? '<div class="card"><p class="q-label">🎙️ Toni sagt</p><div id="rsAi" class="ai-box"></div></div>' : '<p class="muted small">Mit KI (Einstellungen, Reiter „Coach Toni“) liest Toni deinen Kommentar auch inhaltlich gegen.</p>'}${nav()}`;
      bindNav();
      if (hasAi()) toniStream(rsAiPrompt(w.file, w.code, w.situation, txt), $('#rsAi'), { cache: false });
    };
  };
  showIt();
}

function renderRsCheat(main) {
  main.innerHTML = `<header class="ch-head"><p class="loc"><a href="#rschule">← Review-Schule</a></p><h1>📋 Review-Spickzettel</h1><p class="tagline">Die ganze Methode auf einer Seite. Neben den ersten echten Reviews offen lassen.</p></header>
    <div class="rs-cheat">
      <div class="card"><h3>1 · Ablauf in drei Durchgängen</h3><ol><li><b>Überblick (5 Min.):</b> Ticket, CI grün?, Dateiliste, passt der Ansatz? Grundsätzliches sofort und persönlich sagen.</li><li><b>Tiefe:</b> Tests zuerst, dann Kern-Logik. Generiertes überspringen.</li><li><b>Abschluss:</b> Kommentare sortieren, Zusammenfassung, Approve / Request changes / Comment.</li></ol></div>
      <div class="card"><h3>2 · Prüfreihenfolge</h3><ol><li><b>Korrekt?</b> Randfälle, Fehlerfall, Race Conditions, Doppelklick</li><li><b>Sicher?</b> Geheimnisse, bypassSecurityTrust, Rechte nur im Frontend</li><li><b>Lecks?</b> Endet jedes subscribe, jeder Timer, jeder Listener?</li><li><b>Zustand?</b> Eine Wahrheit, computed statt Kopie, Signals neu setzen statt mutieren</li><li><b>Lesbar?</b> Namen, Größe, Typen, Tests dabei?</li><li><b>Schnell?</b> track, Methoden im Template, Bundle, @defer</li></ol></div>
      <div class="card"><h3>3 · Kommentar-Formel</h3><p><code>label (deko): Was. Warum. Vorschlag.</code></p><ul><li><b>issue (blocking)</b>: Bug, Sicherheit, Leck, Datenverlust</li><li><b>suggestion</b>: besser wäre … (blockiert meist nicht)</li><li><b>nitpick</b>: Kleinigkeit, nie blockierend</li><li><b>question</b>: du weißt es nicht sicher</li><li><b>praise</b>: Gutes konkret benennen</li><li><b>thought</b>: Idee für später, nicht für diesen PR</li></ul></div>
      <div class="card"><h3>4 · Ton</h3><ul><li>Über den Code, nicht die Person: „Dieser Aufruf …“ statt „Du hast …“</li><li>Kein „einfach“, „offensichtlich“, „schlecht“</li><li>Fragen statt Urteile, wenn du unsicher bist</li><li>Mindestens ein konkretes Lob pro PR, wenn es etwas Gutes gibt (fast immer)</li><li>Nach 3 Runden Hin und Her: kurzer Call, Ergebnis in den PR</li></ul></div>
      <div class="card"><h3>5 · Große PRs</h3><ul><li>Über ~400 Zeilen sinkt die Trefferquote stark, max. 60 Min. am Stück</li><li>Teilen vorschlagen: nach Bedeutung (API → Logik → UI hinter Flag)</li><li>Sonst nach Risiko: Geld, Login, zentrale Stellen (Interceptor, Routen) genau</li><li>Ehrlich sagen, was du gelesen hast und was nicht</li></ul></div>
      <div class="card"><h3>6 · Angular-Radar</h3><ul><li>subscribe / interval / fromEvent ohne Ende? HTTP-Abos sind okay</li><li>Abo im Abo → switchMap & Co</li><li>effect, der ein Signal setzt → computed</li><li>push / sort auf Signal-Daten → update mit neuem Array</li><li>bypassSecurityTrust… mit Nutzerdaten → raus. [innerHTML] allein ist okay</li><li>track $index bei veränderlichen Listen → track item.id</li><li>Guard als „Schutz“ → Server muss prüfen</li></ul></div>
      <div class="card"><h3>7 · Haltung</h3><ul><li>Approve, wenn der PR den Code insgesamt besser macht, auch wenn er nicht perfekt ist</li><li>Antwort innerhalb eines Arbeitstags, feste Review-Zeiten</li><li>Juniors reviewen Seniors: mit Fragen</li><li>Fremde Bugs: Ticket anlegen, PR nicht blockieren</li><li>Als Autor: klein, gute Beschreibung, erst selbst den Diff lesen</li></ul></div>
    </div>
    <p class="muted small">Quellen: Google Engineering Practices „How to do a code review“ (google.github.io/eng-practices), conventionalcomments.org, SmartBear-Studie mit Cisco zu Review-Größe und Dauer.</p>
    <nav class="step-nav"><a class="btn" href="#rschule">Alle Stationen</a><a class="btn primary" href="#review">Jetzt anwenden: Review-Arena</a></nav>`;
}

/* Tasten 1–6 wählen eine Kategorie, Pfeil rechts = weiter */
document.addEventListener('keydown', e => {
  const t = e.target; if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (t && t.closest && t.closest('input, textarea, select, .CodeMirror, [contenteditable]')) return;
  if (/^[1-6]$/.test(e.key)) { const b = [...document.querySelectorAll('#main .rs-b')][+e.key - 1]; if (b && !b.disabled) { b.click(); e.preventDefault(); } }
  if (e.key === 'ArrowRight' || e.key === 'Enter') { const nx = document.querySelector('#main #rsNext'); if (nx && document.activeElement !== nx) { nx.click(); e.preventDefault(); } }
});
