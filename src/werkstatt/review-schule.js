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
  const fertig = RS_STATIONEN.filter(s => a.rs[s.id]).length;
  return { fertig, gesamt: RS_STATIONEN.length, werkstatt: RS_WERKSTATT.filter(w => (a.rsw[w.id] || 0) >= 4).length };
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
const RS_PASST = { muss: ['muss'], sollte: ['sollte', 'muss'], nit: ['nit', 'thought', 'sollte'], frage: ['frage'], lob: ['lob'] };
const RS_SEV_TIPP = {
  muss: 'Das blockiert den Merge. Markier es so: „issue (blocking): …“',
  sollte: 'Wichtig, aber kein Blocker: „suggestion: …“ passt.',
  nit: 'Das ist eine Kleinigkeit. Mit „nitpick:“ merkt der Autor, dass er es nicht ändern muss. Alles andere wirkt wie ein Blocker.',
  frage: 'Du weißt es nicht sicher. Mit „question:“ fragst du, statt zu urteilen.',
  lob: 'Das ist ein Lob. „praise:“ davor, dann kommt es auch so an.'
};
const RS_WARUM = /\b(weil|da|sonst|dadurch|deshalb|deswegen|damit|führt|passiert|bedeutet|riskier\w*|landet|läuft|fällt|merkt|bleibt|überschreib\w*|blockier\w*|kostet|wenn|falls|bei jedem|beim)\b|→|->/i;
const RS_VORSCHLAG = /vorschlag|z\.\s?b\.|zum beispiel|\bstatt\b|lieber|besser|könnten wir|können wir|wie wäre|was hältst|\bnimm\b|nutze|verwende|`[^`]+`|```/i;
const RS_TON = /\b(einfach|offensichtlich|natürlich|eindeutig|schlecht\w*|quatsch|unsinn|schrott|katastrophe|peinlich\w*|ernsthaft|sowieso|warum hast du|wieso hast du|du hast|du musst|du solltest)\b|\bdu \w+ (immer|nie)\b|!!+|\?\?+|🙄|🤦/i;

function kommentarCheck(text, aufg) {
  const t = String(text || '').trim();
  let label = null;
  for (const [re, l] of RS_LABELS) if (re.test(t)) { label = l; break; }
  let eff = label;
  if (label && /\(\s*(blocking|blockierend)\s*\)/i.test(t)) eff = 'muss';
  if (label === 'muss' && /non-?blocking|nicht blockierend/i.test(t)) eff = 'sollte';
  if (label && label !== 'muss' && /non-?blocking/i.test(t)) eff = label;
  const sev = aufg && aufg.sev;
  const checks = [];
  /* 1. Label und Schwere */
  if (!label) checks.push({ name: 'Label', ok: false, tipp: 'Fang mit einem Label an: „issue (blocking):“, „suggestion:“, „nitpick:“, „question:“ oder „praise:“. Dann weiß der Autor sofort, wie wichtig es ist.' });
  else if (sev && !RS_PASST[sev].includes(eff)) checks.push({ name: 'Schwere', ok: false, tipp: RS_SEV_TIPP[sev] });
  else checks.push({ name: sev ? 'Label passt' : 'Label', ok: true });
  /* 2. Trifft das Problem */
  if (aufg) checks.push(aufg.keys.test(t) ? { name: 'Trifft den Punkt', ok: true } : { name: 'Trifft den Punkt', ok: false, tipp: aufg.keyTip });
  /* 3. Warum (bei Lob: konkret) */
  if (sev === 'lob') checks.push(t.length >= 45 ? { name: 'Konkret', ok: true } : { name: 'Konkret', ok: false, tipp: 'Sag, was genau gut ist und warum. „Nice“ allein bleibt nicht hängen.' });
  else checks.push(RS_WARUM.test(t) ? { name: 'Warum', ok: true } : { name: 'Warum', ok: false, tipp: 'Sag, was sonst passiert: „…, weil …“ oder „sonst …“. Ohne Warum kann der Autor nicht abwägen.' });
  /* 4. Vorschlag (bei Frage: echte Frage) */
  if (sev === 'frage') checks.push(/\?/.test(t) ? { name: 'Echte Frage', ok: true } : { name: 'Echte Frage', ok: false, tipp: 'Eine Frage braucht ein Fragezeichen, am besten mit deiner Vermutung: „Ist das wegen …?“' });
  else if (sev !== 'lob') checks.push(RS_VORSCHLAG.test(t) ? { name: 'Vorschlag', ok: true } : { name: 'Vorschlag', ok: false, tipp: 'Zeig einen Weg: „Vorschlag: …“, „statt X lieber Y“ oder ein Schnipsel in `Backticks`.' });
  /* 5. Ton */
  const bad = t.match(RS_TON);
  checks.push(bad ? { name: 'Ton', ok: false, tipp: '„' + bad[0].trim() + '“ klingt nach Vorwurf oder Urteil. Rede über den Code, nicht über die Person.' } : { name: 'Ton', ok: true });
  const hinweise = [];
  if (t.length < 25) hinweise.push('Sehr kurz. Ein guter Kommentar braucht meist 1 bis 3 Sätze.');
  if (t.length > 600) hinweise.push('Ziemlich lang. Im PR liest das keiner ganz. Kürzen, oder lieber kurz reden.');
  const score = checks.filter(c => c.ok).length;
  return { checks, score: t.length < 25 ? Math.min(score, 2) : score, max: checks.length, hinweise };
}

function kommentarCheckHtml(res) {
  return `<div class="rs-chips">${res.checks.map(c => `<span class="rs-chip ${c.ok ? 'ok' : 'no'}">${c.ok ? '✓' : '✗'} ${esc(c.name)}</span>`).join('')}</div>
    ${res.checks.filter(c => !c.ok).concat(res.hinweise.map(h => ({ tipp: h }))).map(c => `<p class="rs-tipp">${esc(c.tipp)}</p>`).join('')}`;
}

function rsAiPrompt(datei, code, lage, kommentar) {
  return TONI + '\n\nDer Lernende übt, Code-Review-Kommentare zu schreiben (Conventional Comments: issue/suggestion/nitpick/question/praise, Deko blocking/non-blocking). Datei ' + datei + ':\n```ts\n' + code + '\n```\n' + (lage ? 'Situation: ' + lage + '\n' : '') + 'Sein Kommentar:\n"""' + kommentar + '"""\n\nBewerte wie ein Senior im Review, max. 100 Wörter, genau dieses Format:\n**Sache:** Stimmt der Punkt fachlich? 1 Satz.\n**Form:** Label/Schwere, Warum, Vorschlag: was fehlt? 1 Satz.\n**Ton:** 1 kurzer Satz.\n**Besser so:** deine Version, 1 bis 3 Sätze, im Conventional-Comments-Format.';
}

/* ---------- Ansichten ---------- */
function renderRSchule(main, id) {
  if (id === 'rschule') return renderRsListe(main);
  if (id === 'rschule-spick') return renderRsSpick(main);
  const st = RS_STATIONEN.find(s => 'rschule-' + s.id === id);
  return st ? renderRsStation(main, st) : renderRsListe(main);
}

function renderRsListe(main) {
  const a = rsState(); const s = rsStats();
  const next = RS_STATIONEN.find(x => !a.rs[x.id]);
  main.innerHTML = `<header class="ch-head"><p class="ort"><a href="#training">← Werkstatt</a></p><h1>🎓 Review-Schule</h1>
    <p class="tagline">Code Reviews mit Methode. Sieben Stationen, je 5 Minuten. Danach weißt du, wo du hinschaust, wie du es markierst und wie du es sagst.</p>
    <div class="hero-cta">${next ? `<a class="btn primary big" href="#rschule-${next.id}">${s.fertig ? 'Weiter' : 'Los geht\'s'}: ${next.icon} ${esc(next.titel)}</a>` : '<a class="btn primary big" href="#review">Jetzt anwenden: Review-Arena</a>'}<a class="btn big" href="#rschule-spick">📋 Spickzettel</a></div></header>
    <div class="rs-grid">${RS_STATIONEN.map((x, k) => { const r = a.rs[x.id]; const extra = x.id === 'werkstatt' ? s.werkstatt + '/' + RS_WERKSTATT.length + ' Kommentare stark' : r ? 'bestes Ergebnis ' + r.best + '/' + r.max : 'noch offen'; return `<a class="rs-st ${r ? 'won' : ''}" href="#rschule-${x.id}"><span class="rs-nr">${k + 1}</span><span class="rs-i" aria-hidden="true">${x.icon}</span><b>${esc(x.titel)}</b><span class="ac-w">${esc(x.kurz)}</span><small>${r ? '✓ ' : ''}${extra}</small></a>`; }).join('')}</div>
    <div class="card rs-then"><p class="q-label">Und dann?</p><p>Wende es an echten PRs an: In der <a href="#review">👀 Code-Review-Arena</a> markierst du Zeilen und schreibst deine Kommentare. Die Werkstatt-Prüfung läuft dort auch.</p></div>`;
}

function renderRsStation(main, st) {
  const a = rsState();
  const i = RS_STATIONEN.indexOf(st), next = RS_STATIONEN[i + 1];
  const schonMal = !!a.rs[st.id];
  main.innerHTML = `<header class="ch-head"><p class="ort"><a href="#rschule">← Review-Schule</a><span>${i + 1}/${RS_STATIONEN.length}</span></p><h1>${st.icon} ${esc(st.titel)}</h1><p class="tagline">${esc(st.kurz)}</p><div class="blitz-bar"><i id="rsBar"></i></div></header>
    <details class="card rs-merk"${schonMal ? '' : ' open'}><summary class="q-label">📋 Das Wichtigste in 30 Sekunden</summary><ul>${st.merk.map(m => `<li>${m}</li>`).join('')}</ul></details>
    <div id="rsBody"></div>
    <nav class="step-nav"><a class="btn" href="#rschule">Alle Stationen</a>${next ? `<a class="btn" href="#rschule-${next.id}">Nächste Station</a>` : '<a class="btn" href="#rschule-spick">Spickzettel</a>'}</nav>`;
  if (st.runden[0].typ === 'schreib') return rsWerkstatt(main, st);
  rsDrill(main, st);
}

/* Sortier- und Auswahl-Karten: eine nach der anderen, falsche kommen am Ende der Runde nochmal. */
function rsDrill(main, st) {
  const a = rsState(); const body = $('#rsBody');
  let queue = [];
  st.runden.forEach((r, ri) => {
    if (r.typ === 'sort') queue.push(...shuffleA(r.karten.map(k => ({ r, k, ri }))));
    if (r.typ === 'wahl') queue.push(...r.items.map(k => ({ r, k, ri })));
  });
  const max = queue.length; let pos = 0, richtig = 0; const nochmal = new Set();
  const bar = () => { $('#rsBar').style.width = Math.round(Math.min(pos, max) / max * 100) + '%'; };
  const zeig = () => {
    bar();
    if (!queue.length) return ende();
    const it = queue[0]; const wieder = nochmal.has(it);
    if (it.r.typ === 'sort') {
      const k = it.k, ok = [].concat(k.b);
      body.innerHTML = `<div class="card rs-card"><p class="q-label">${esc(it.r.frage)}${wieder ? ' · <span class="rs-again">nochmal</span>' : ''}</p>
        ${k.code ? `<pre class="code"><code>${esc(k.code)}</code></pre>` : ''}${k.text ? `<p class="rs-text">${esc(k.text)}</p>` : ''}
        <div class="rs-buckets">${it.r.buckets.map((b, n) => `<button class="rs-b" data-b="${b.id}"><span class="key">${n + 1}</span>${esc(b.label)}</button>`).join('')}</div><div id="rsRes"></div></div>`;
      highlightIn(body);
      body.querySelectorAll('.rs-b').forEach(btn => btn.onclick = () => {
        const treffer = ok.includes(btn.dataset.b);
        body.querySelectorAll('.rs-b').forEach(x => { x.disabled = true; if (ok.includes(x.dataset.b)) x.classList.add('right'); });
        if (!treffer) btn.classList.add('wrong');
        const label = ok.map(id => it.r.buckets.find(b => b.id === id).label).join(' oder ');
        weiter(treffer, `<b>${treffer ? 'Richtig.' : 'Eher: ' + esc(label) + '.'}</b> ${esc(k.warum)}`);
      });
    } else {
      const k = it.k;
      /* Antworten gemischt: data-n bleibt der Index aus den Daten, die Tasten-Zahl ist die Stelle am Bildschirm */
      body.innerHTML = `<div class="card rs-card"><p class="q-label">${esc(it.r.frage)}${wieder ? ' · <span class="rs-again">nochmal</span>' : ''}</p><p class="rs-lage">${k.lage}</p>
        <div class="opts">${shuffleA(k.opts.map((o, n) => n)).map((n, stelle) => `<button class="opt" data-n="${n}"><span class="key">${stelle + 1}</span><span>${esc(k.opts[n].t)}</span></button>`).join('')}</div><div id="rsRes"></div></div>`;
      body.querySelectorAll('.opt').forEach(btn => btn.onclick = () => {
        const o = k.opts[+btn.dataset.n];
        body.querySelectorAll('.opt').forEach(x => { x.disabled = true; const oo = k.opts[+x.dataset.n]; if (oo.ok) x.classList.add('right'); });
        if (!o.ok) btn.classList.add('wrong');
        const gut = k.opts.find(x => x.ok);
        weiter(o.ok, `<b>${o.ok ? 'Genau.' : 'Nicht ganz.'}</b> ${esc(o.warum)}${o.ok ? '' : `<br><span class="muted small">Besser: ${esc(gut.t)} ${esc(gut.warum)}</span>`}`);
      });
    }
  };
  const weiter = (ok, html) => {
    const it = queue.shift();
    if (ok) { if (!nochmal.has(it)) richtig++; pos++; }
    else { nochmal.add(it); queue.push(it); }
    $('#rsRes').innerHTML = `<div class="out-res ${ok ? 'right' : 'wrong'}"><p>${html}</p></div><div class="ai-row"><button class="btn primary" id="rsNext">${queue.length ? 'Weiter' : 'Auswertung'}</button></div>`;
    $('#rsNext').onclick = zeig; $('#rsNext').focus({ preventScroll: true });
  };
  const ende = () => {
    bar();
    const alt = a.rs[st.id];
    const neu = !alt || richtig > alt.best;
    a.rs[st.id] = { best: Math.max(richtig, alt ? alt.best : 0), max, t: Date.now() };
    if (neu) addXp(Math.max(5, (richtig - (alt ? alt.best : 0)) * 5) + (alt ? 0 : 20), 'Review-Schule: ' + st.titel); else save();
    const quote = richtig / max;
    const i = RS_STATIONEN.indexOf(st), next = RS_STATIONEN[i + 1];
    body.innerHTML = `<div class="end"><p class="score">${richtig}/${max}</p><p class="q-label">${quote === 1 ? 'Alles beim ersten Mal. Das sitzt.' : quote >= .75 ? 'Stark. Die Wackelkandidaten hast du jetzt zweimal gesehen.' : 'Gut, dass du es hier lernst und nicht im echten PR. Nochmal eine Runde?'} ${nochmal.size ? '· ' + nochmal.size + ' Karte' + (nochmal.size === 1 ? '' : 'n') + ' nachgeholt' : ''}</p>
      <div class="card rs-merk"><p class="q-label">Das nimmst du mit</p><ul>${st.merk.map(m => `<li>${m}</li>`).join('')}</ul></div>
      <div class="ai-row">${next ? `<a class="btn primary" href="#rschule-${next.id}">Nächste Station: ${next.icon} ${esc(next.titel)}</a>` : '<a class="btn primary" href="#review">Jetzt anwenden: Review-Arena</a>'}<button class="btn" id="rsAgain">Nochmal</button></div></div>`;
    $('#rsAgain').onclick = () => renderRsStation(main, st);
  };
  zeig();
}

/* Kommentar-Werkstatt: Code mit markierter Zeile, du schreibst den Kommentar. */
function rsWerkstatt(main, st) {
  const a = rsState(); const body = $('#rsBody');
  const offen = RS_WERKSTATT.findIndex(w => (a.rsw[w.id] || 0) < 4);
  let n = offen < 0 ? 0 : offen;
  const zeig = () => {
    const w = RS_WERKSTATT[n];
    $('#rsBar').style.width = Math.round(RS_WERKSTATT.filter(x => (a.rsw[x.id] || 0) >= 4).length / RS_WERKSTATT.length * 100) + '%';
    const lines = w.code.split('\n');
    body.innerHTML = `<div class="rs-tabs">${RS_WERKSTATT.map((x, k) => `<button class="rs-tab ${k === n ? 'on' : ''} ${(a.rsw[x.id] || 0) >= 4 ? 'won' : ''}" data-k="${k}" title="${esc(x.titel)}">${k + 1}</button>`).join('')}</div>
      <div class="card rs-card"><p class="q-label">Aufgabe ${n + 1}/${RS_WERKSTATT.length} · ${esc(w.titel)} · ${esc(w.datei)}</p><p class="rs-lage">${esc(w.lage)}</p>
      <div class="rv-code rs-code">${lines.map((l, k) => `<div class="rv-line${k + 1 === w.zeile ? ' flag' : ''}"><span class="rv-n">${k + 1}</span><code>${esc(l) || ' '}</code></div>`).join('')}</div>
      <label class="q-label" for="rsKom">Dein Kommentar zu Zeile ${w.zeile}</label>
      <textarea class="recall" id="rsKom" rows="4" placeholder="issue (blocking): … weil … Vorschlag: …"></textarea>
      <div class="ai-row"><button class="btn primary" id="rsCheck">Prüfen</button><button class="linkbtn" id="rsZeig">Musterkommentar zeigen</button></div>
      <div id="rsRes"></div></div>`;
    const box = $('.rs-code', body);
    if (window.CodeMirror && CodeMirror.runMode) box.querySelectorAll('code').forEach(c => { const t = c.textContent; c.textContent = ''; c.classList.add('cm-s-ngq'); CodeMirror.runMode(t, 'text/typescript', c); });
    body.querySelectorAll('.rs-tab').forEach(b => b.onclick = () => { n = +b.dataset.k; zeig(); });
    const nav = () => `<div class="ai-row">${n + 1 < RS_WERKSTATT.length ? '<button class="btn primary" id="rsNext">Nächste Aufgabe</button>' : '<a class="btn primary" href="#rschule-' + (RS_STATIONEN[RS_STATIONEN.indexOf(st) + 1] || {}).id + '">Nächste Station</a>'}<button class="linkbtn" id="rsRetry">Nochmal schreiben</button></div>`;
    const bindNav = () => { const nx = $('#rsNext'); if (nx) { nx.onclick = () => { n++; zeig(); }; nx.focus({ preventScroll: true }); } $('#rsRetry').onclick = () => { $('#rsKom').disabled = false; $('#rsCheck').disabled = false; $('#rsRes').innerHTML = ''; $('#rsKom').focus(); }; };
    $('#rsZeig').onclick = () => { $('#rsRes').innerHTML = `<div class="out-res"><p class="q-label">So würde es ein Senior schreiben</p><div class="rs-muster">${md(w.muster)}</div></div>${nav()}`; bindNav(); };
    $('#rsCheck').onclick = () => {
      const txt = $('#rsKom').value.trim(); if (!txt) { $('#rsKom').focus(); return; }
      const res = kommentarCheck(txt, w);
      const alt = a.rsw[w.id] || 0;
      if (res.score > alt) { a.rsw[w.id] = res.score; if (res.score === res.max && alt < res.max) addXp(alt >= 4 ? 5 : 20, 'Starker Review-Kommentar'); else if (res.score >= 4 && alt < 4) addXp(10, 'Guter Review-Kommentar'); else save(); }
      const top = res.score === res.max;
      $('#rsKom').disabled = true; $('#rsCheck').disabled = true;
      $('#rsRes').innerHTML = `<div class="out-res ${top ? 'right' : res.score >= 3 ? '' : 'wrong'}"><p><b>${top ? 'Stark! So kommt der Kommentar an.' : res.score >= 3 ? 'Schon gut. Das fehlt noch:' : 'Da geht noch was:'}</b> <span class="muted">${res.score}/${res.max}</span></p>${kommentarCheckHtml(res)}
        <p class="q-label" style="margin-top:12px">So würde es ein Senior schreiben</p><div class="rs-muster">${md(w.muster)}</div></div>
        ${hasAi() ? '<div class="card"><p class="q-label">🎙️ Toni sagt</p><div id="rsAi" class="ai-box"></div></div>' : '<p class="muted small">Mit KI (Einstellungen, Reiter „Coach Toni“) liest Toni deinen Kommentar auch inhaltlich gegen.</p>'}${nav()}`;
      bindNav();
      if (hasAi()) toniStream(rsAiPrompt(w.datei, w.code, w.lage, txt), $('#rsAi'), { cache: false });
    };
  };
  zeig();
}

function renderRsSpick(main) {
  main.innerHTML = `<header class="ch-head"><p class="ort"><a href="#rschule">← Review-Schule</a></p><h1>📋 Review-Spickzettel</h1><p class="tagline">Die ganze Methode auf einer Seite. Neben den ersten echten Reviews offen lassen.</p></header>
    <div class="rs-spick">
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
