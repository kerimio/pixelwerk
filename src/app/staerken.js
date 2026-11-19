/* ===== Deine Themen: was sitzt und was wackelt. Ohne KI, nur aus dem Spielstand gerechnet =====
   Quellen je Kapitel: Kapitel-Quiz (S.quiz: Versuche bis richtig), Fehler in freien Runden (S.weak), Fehler beim Wiederholen
   (S.srs[…].l), „sicher, aber daneben“ beim Wiederholen (S.srs[…].sf), Übung (S.ex: Fehlversuche, Lösung angeschaut),
   Mini-Spiel „Welche Zeile ist das?“ (S.zeile), Zuordnen (S.zu im Kapitel, S.weak['<kapitel>:zu'] in freien Runden, zuordnen.js)
   und Toni-Fragen (S.tf).
   Danach richten sich: Wiederholen und freie Runde (wackelige Themen öfter und früher), die Hilfe in der Übung (früher angeboten),
   der Schreibtisch („Wackelt noch“) und Toni (bekommt die Themen mit). Mit KI schreibt Toni zu einem Thema neue Fragen. */

/* Ein Kapitel: pkt = Fehlerpunkte, n = Beobachtungen, schwach = 0 bis 1, stand = offen | wackelt | mittel | sitzt, gruende = Sätze */
function themaStand(ch) {
  let pkt = 0, n = 0;
  const g = { quiz: 0, frei: 0, wdh: 0, sicher: 0, fails: 0, loesung: false, zeile: 0, tf: 0, zu: 0 };
  (ch.quiz || []).forEach((q, i) => {
    const k = ch.id + ':' + i, t = (S.quiz || {})[k], w = (S.weak || {})[k];
    if (t) { n++; if (t > 1) { pkt += Math.min(t - 1, 2); g.quiz++; } }
    if (w) { pkt += w; g.frei += w; n++; }
  });
  /* Zuordnen zählt wie Quizfragen: jeder Fehler im Kapitel ein Punkt, höchstens zwei je Paar wie bei einer Frage */
  const zf = (S.zu || {})[ch.id];
  if (typeof zf === 'number' && zuHat(ch)) { n += zuPaare(ch).length; if (zf) { pkt += Math.min(zf, 2 * zuPaare(ch).length); g.zu = zf; } }
  const zw = (S.weak || {})[ch.id + ':zu'];
  if (zw) { pkt += zw; g.frei += zw; n++; }
  Object.keys(S.srs || {}).forEach(k => {
    const c = S.srs[k]; if (!c || k.split(':')[1] !== ch.id) return;
    n += c.n || 0;
    if (c.l) { pkt += c.l; g.wdh += c.l; }
    if (c.sf) { pkt += c.sf * 0.5; g.sicher += c.sf; }
  });
  const e = ch.ex && (S.ex || {})[ch.ex.id];
  if (e) {
    n++;
    if (e.fails) { pkt += Math.min(e.fails, 6) * 0.5; g.fails = e.fails; }
    if (e.usedSolution) { pkt += 2; g.loesung = true; }
  }
  Object.keys(S.zeile || {}).forEach(k => {
    const z = S.zeile[k]; if (!z || k.split(':')[0] !== ch.id) return;
    n += (z.ok || 0) + (z.fehler || 0);
    if (z.fehler) { pkt += z.fehler * 0.5; g.zeile += z.fehler; }
  });
  const ux = (S.ux || {})[ch.id];
  if (ux) { n += (ux.r || 0) + (ux.f || 0); if (ux.f) { pkt += ux.f; g.ux = ux.f; } }
  const tf = (S.tf || {})[ch.id];
  if (tf) { n += (tf.r || 0) + (tf.f || 0); if (tf.f) { pkt += tf.f; g.tf = tf.f; } }

  /* Nur angeschaut (bis zum Abschluss geblättert, ohne die Arbeit): wackelt, bis es nachgeholt ist */
  const nurAngeschaut = typeof kapitelOffen === 'function' && kapitelOffen(ch);
  if (nurAngeschaut) { pkt += 2; n++; }
  const schwach = n ? Math.min(1, pkt / (n + 2)) : 0;
  const stand = !n ? 'offen' : nurAngeschaut || (pkt >= 1.5 && schwach >= 0.25) ? 'wackelt' : !pkt && n >= 3 ? 'sitzt' : 'mittel';
  const gruende = [];
  if (nurAngeschaut) gruende.push(ch.ex ? 'Übung noch offen' : 'Quiz noch offen');
  if (g.quiz) gruende.push((g.quiz === 1 ? '1 Quizfrage' : g.quiz + ' Quizfragen') + ' erst im zweiten Anlauf');
  if (g.zu) gruende.push((g.zu === 1 ? '1 Fehler' : g.zu + ' Fehler') + ' beim Zuordnen');
  if (g.frei + g.wdh) gruende.push((g.frei + g.wdh) + '× daneben beim Wiederholen');
  if (g.sicher) gruende.push(g.sicher + '× sicher, aber falsch');
  if (g.loesung) gruende.push('Übung mit der Lösung geschafft');
  else if (g.fails >= 2) gruende.push(g.fails + ' Fehlversuche in der Übung');
  if (g.zeile) gruende.push((g.zeile === 1 ? '1 Zeile' : g.zeile + ' Zeilen') + ' im Mini-Spiel verwechselt');
  if (g.tf) gruende.push(g.tf + '× daneben bei Tonis Fragen');
  if (g.ux) gruende.push(g.ux + '× Code aus dem Kopf nicht geschafft');
  return { ch, pkt, n, schwach, stand, gruende };
}
/* Alle Kapitel, die schon begonnen sind, das wackeligste zuerst */
function themen() {
  return CH.filter(c => (S.done || {})[c.id] || (S.steps || {})[c.id] || themaBeruehrt(c)).map(themaStand).filter(t => t.n).sort((a, b) => b.schwach - a.schwach || b.pkt - a.pkt);
}
const themaBeruehrt = c => (c.quiz || []).some((q, i) => (S.quiz || {})[c.id + ':' + i]);
/* Kapitel-ID → schwach (0 bis 1), für Wiederholen und freie Runde. Einmal pro Runde berechnet.
   Nur Themen, die wirklich wackeln: Ein einzelner Ausrutscher zählt dort schon an der Frage selbst (S.weak, S.quiz). */
function schwachKarte() { const m = {}; themen().forEach(t => { if (t.stand === 'wackelt') m[t.ch.id] = t.schwach; }); return m; }
function baustellen(max) { return themen().filter(t => t.stand === 'wackelt').slice(0, max || 3); }
function themaVon(chId) { const ch = CH.find(c => c.id === chId); return ch ? themaStand(ch) : null; }

/* Für Toni: die Themen in einem Absatz (mitProfil hängt ihn an jede Anfrage) */
function themenNote() {
  const t = themen(), wk = t.filter(x => x.stand === 'wackelt').slice(0, 5), ok = t.filter(x => x.stand === 'sitzt').slice(0, 5);
  if (!wk.length && !ok.length) return '';
  return '\n\nTHEMEN laut Spielstand (Quiz, Wiederholen, Übungen): ' +
    (wk.length ? 'Wackelt noch: ' + wk.map(x => '„' + x.ch.title + '“ (' + x.gruende.join(', ') + ')').join('; ') + '. Kommt eins davon vor, erklär es gründlicher und prüf mit einer kurzen Rückfrage, ob es sitzt. ' : '') +
    (ok.length ? 'Sitzt: ' + ok.map(x => '„' + x.ch.title + '“').join(', ') + '. Darauf kannst du aufbauen.' : '');
}

/* ---------- Schreibtisch: „Wackelt noch“ ---------- */
function hubBaustellenHtml() {
  const b = baustellen(3); if (!b.length) return '';
  const ki = !!aiCfg().key;
  return `<section class="hub-bau" aria-labelledby="hubBauT"><h2 id="hubBauT">Wackelt noch</h2>
    <p class="hub-bau-s">Das merkt sich die App aus deinen Antworten. Diese Themen kommen beim Wiederholen öfter und früher dran.</p>
    <ul>${b.map(t => `<li><span class="hub-bau-t"><b>${esc(t.ch.title)}</b><small>${esc(t.gruende.join(' · '))}</small></span><span class="hub-bau-los">${kapitelOffen(t.ch) ? `<a class="btn" href="#${esc(t.ch.id)}">${t.ch.ex ? 'Übung lösen' : 'Quiz beantworten'}</a>` : `<a class="btn" href="#ueben-${esc(t.ch.id)}">Üben</a>`}${ki ? `<a class="linkbtn" href="#tonifragen-${esc(t.ch.id)}">Neue Fragen von Toni</a>` : ''}</span></li>`).join('')}</ul>
    ${ki ? '' : '<p class="hub-bau-ki">Mit einer KI schreibt Toni dir zu jedem dieser Themen neue Fragen. <button type="button" class="linkbtn" id="hubBauKi">KI einrichten</button></p>'}</section>`;
}
function hubBaustellenAn(main) { const b = $('#hubBauKi', main); if (b) b.onclick = () => openAiSettings(); }

/* ---------- Ein Thema üben (#ueben-<kapitel>): alle Quizfragen des Kapitels, gemischt, wie eine freie Runde ----------
   Hat das Kapitel eine Übung und war sie schon einmal grün, kommt sie am Schluss aus dem Kopf dazu (frischer Startcode).
   Gerade Fehlversuche in der Übung lassen ein Thema oft wackeln, darum gehört der Code mit zur Runde. */
function renderUeben(main, ch) {
  const x = ch.ex && S.ex[ch.ex.id] && S.ex[ch.ex.id].passed ? ['x:' + ch.id] : [];
  /* Zuordnen kommt als Abwechslung irgendwo zwischen die Quizfragen */
  const keys = shuffle((ch.quiz || []).map((q, i) => 'q:' + ch.id + ':' + i)).slice(0, 7);
  if (zuHat(ch)) keys.splice(1 + Math.floor(Math.random() * keys.length), 0, 'z:' + ch.id);
  keys.push(...x);
  if (!keys.length) { main.innerHTML = leKopf('Üben') + '<div class="card le-ruhe"><h2>Hier gibt es keine Fragen</h2></div>'; return; }
  leRunde(main, keys, true, 'Üben: ' + ch.title);
}

/* ---------- Neue Fragen von Toni (#tonifragen-<kapitel>): die KI schreibt drei Fragen zu dem, was bei dir wackelt ---------- */
async function tfHolen(ch, alt) {
  const t = themaStand(ch);
  const verfehlt = (ch.quiz || []).map((q, i) => ({ q, k: ch.id + ':' + i })).filter(x => (S.quiz || {})[x.k] > 1 || (S.weak || {})[x.k] || ((S.srs || {})['q:' + x.k] || {}).l)
    .map(x => '- ' + stripHtml(x.q.q) + ' (richtig: ' + stripHtml(x.q.options[x.q.correct]) + ')');
  const prompt = TONI + '\n\nSchreib genau 3 neue Multiple-Choice-Fragen zum Kapitel „' + ch.title + '“ (Thema: ' + (ch.tag || ch.title) + ').\n' +
    (ch.merke && ch.merke.length ? 'Kernaussagen des Kapitels:\n' + ch.merke.map(m => '- ' + m).join('\n') + '\n' : '') +
    (verfehlt.length ? 'Diese Fragen aus dem Kapitel hatte der Lernende falsch oder erst im zweiten Anlauf. Zielt genau auf die Missverständnisse dahinter, aber stell sie nicht wörtlich nochmal:\n' + verfehlt.join('\n') + '\n' : '') +
    (t.gruende.length ? 'Beobachtet: ' + t.gruende.join(', ') + '.\n' : '') +
    (alt && alt.length ? 'Diese Fragen hattest du schon gestellt, also andere nehmen:\n' + alt.map(q => '- ' + q).join('\n') + '\n' : '') +
    'Regeln: Jede Frage ist für sich allein verständlich (ganzer Satz). Gern ein kurzes Code-Stück mit <code>. 4 Antworten, genau eine richtig, die falschen sind typische Denkfehler. ' +
    'Die Begründung erklärt in 1 bis 2 Sätzen, warum die richtige stimmt und was am häufigsten Denkfehler falsch ist. Angular 22, moderne Syntax (Signals, @if, inject). Deutsch, du-Form.\n' +
    'Format: {"fragen":[{"q":"…","options":["…","…","…","…"],"correct":0,"why":"…"}]}';
  const text = await kiStream(mitProfil(prompt), () => {}, null, { temperature: 0.8, maxOutputTokens: 3000, responseMimeType: 'application/json' });
  const j = jsonAusText(text), fr = (j && j.fragen || []).filter(q => q && typeof q.q === 'string' && Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 5 && q.options.every(o => typeof o === 'string') && Number.isInteger(+q.correct) && +q.correct >= 0 && +q.correct < q.options.length)
    .map(q => ({ q: q.q, options: q.options, correct: +q.correct, why: String(q.why || '') }));
  if (!fr.length) throw new Error('Toni hat keine brauchbaren Fragen geschickt');
  return fr.slice(0, 3);
}
function renderToniFragen(main, ch) {
  main.innerHTML = leKopf('Neue Fragen von Toni') + `<div id="tfBody"><p class="le-label">${esc(ch.title)}</p></div>`;
  const body = $('#tfBody', main), gestellt = [];
  if (!aiCfg().key) {
    body.insertAdjacentHTML('beforeend', '<div class="card le-ruhe"><h2>Dafür braucht Toni eine KI</h2><p>Mit deinem eigenen Schlüssel schreibt Toni dir neue Fragen genau zu dem, was bei dir wackelt.</p><div class="le-weiter"><button class="btn primary" id="tfKi" type="button">KI einrichten</button><a class="linkbtn" href="#ueben-' + esc(ch.id) + '">Ohne KI üben</a></div></div>');
    $('#tfKi', body).onclick = () => openAiSettings();
    return;
  }
  let richtig = 0, gesamt = 0;
  const runde = async () => {
    body.innerHTML = `<p class="le-label">${esc(ch.title)}</p><div class="card le-ruhe" aria-busy="true"><p class="tc-denkt">Toni schreibt Fragen zu dem, was bei dir wackelt…</p></div>`;
    let fr;
    try { fr = await tfHolen(ch, gestellt); }
    catch (e) {
      if (!body.isConnected) return;
      body.innerHTML = `<div class="card le-ruhe"><h2>Das hat nicht geklappt</h2><p>${esc(aiError(e))}</p><div class="le-weiter"><button class="btn primary" id="tfNochmal" type="button">Nochmal versuchen</button><a class="linkbtn" href="#ueben-${esc(ch.id)}">Ohne KI üben</a></div></div>`;
      $('#tfNochmal', body).onclick = runde; return;
    }
    if (!body.isConnected) return;
    fr.forEach(q => gestellt.push(String(q.q).replace(/<[^>]*>/g, '')));
    let i = 0;
    const zeig = () => {
      if (i >= fr.length) return ende();
      const q = fr[i];
      body.innerHTML = `<div class="le-karte"><p class="le-label">Toni-Frage ${i + 1} von ${fr.length} · ${esc(ch.title)}</p><h2 class="le-frage" tabindex="-1">${leHtml(q.q)}</h2><div class="le-opts">${leOpts(q)}</div><div class="le-warum" aria-live="polite"></div></div>`;
      const opts = [...body.querySelectorAll('.opt')], gut = opts.find(b => +b.dataset.i === q.correct);
      opts.forEach(b => b.onclick = e => {
        if (e.detail > 1) return;
        opts.forEach(o => o.disabled = true);
        const ok = b === gut; gesamt++; if (ok) richtig++;
        b.classList.add(ok ? 'right' : 'wrong'); gut.classList.add('right'); $('.key', gut).textContent = '✓'; if (!ok) $('.key', b).textContent = '✗';
        const tf = S.tf || (S.tf = {}), st = tf[ch.id] || (tf[ch.id] = { r: 0, f: 0 }); st[ok ? 'r' : 'f']++;
        if (ok) addXp(5, 'Toni-Frage'); else save();
        $('.le-warum', body).innerHTML = (ok ? '<b>Richtig.</b> ' : '<b>Daneben.</b> ') + leHtml(q.why);
        body.firstElementChild.insertAdjacentHTML('beforeend', '<div class="le-weiter"><button class="btn primary" id="wdhWeiter" type="button">Weiter</button></div>');
        const w = $('#wdhWeiter', body); w.onclick = () => { i++; zeig(); }; w.focus({ preventScroll: true });
      });
      $('.le-frage', body).focus({ preventScroll: true });
    };
    const ende = () => {
      const t = themaStand(ch);
      body.innerHTML = `<div class="le-bilanz"><p class="le-zahl${richtig === gesamt ? ' le-voll' : ''}" tabindex="-1">${richtig} von ${gesamt}</p><p class="le-label">richtig bei Tonis Fragen</p>
        <p class="le-hinweis">${t.stand === 'wackelt' ? 'Das Thema bleibt auf deiner Liste und kommt beim Wiederholen öfter dran.' : 'Das Thema sieht schon stabiler aus.'}</p>
        <div class="le-weiter"><a class="btn primary big" href="#start">Zum Schreibtisch</a><button class="linkbtn" id="tfMehr" type="button">Noch 3 Fragen</button></div></div>`;
      $('#tfMehr', body).onclick = runde; $('.le-zahl', body).focus({ preventScroll: true });
    };
    zeig();
  };
  runde();
}

/* ---------- Einstellungen, Reiter „Coach Toni“: deine Themen, auch ohne KI ---------- */
function themenProfilHtml() {
  const t = themen(), wk = t.filter(x => x.stand === 'wackelt').slice(0, 8), ok = t.filter(x => x.stand === 'sitzt').slice(0, 8);
  if (!wk.length && !ok.length) return '<p class="muted small">Nach ein paar Quizfragen und Übungen siehst du hier, welche Themen sitzen und welche noch wackeln.</p>';
  return '<p class="q-label">Deine Themen</p><div class="pf-chips">' + wk.map(x => '<a class="pf-chip no" href="#ueben-' + esc(x.ch.id) + '" title="' + esc(x.gruende.join(', ')) + '">' + esc(x.ch.title) + '</a>').join('') +
    ok.map(x => '<span class="pf-chip ok">' + esc(x.ch.title) + '</span>').join('') + '</div><p class="small muted">Rot: wackelt noch, kommt beim Wiederholen öfter · Grün: sitzt. Das rechnet die App selbst aus, ohne KI.</p>';
}
