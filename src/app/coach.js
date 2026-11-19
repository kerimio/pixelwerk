/* ===== Coach Toni: Lernprofil ===== */
/* Lernprofil: Die App merkt sich, WAS und WIE du fragst (Thema, Fragetyp, Länge, Verwirrung) und wie es in Quiz,
   eigenen Erklärungen und Übungen läuft. Alle paar Fragen schreibt die KI daraus ein kurzes Profil (Niveau, Lücken, Fragestil,
   wie Toni erklären soll). Es liegt in S.profile, wird also mit dem Spielstand gespeichert.
   Jede Toni-Anfrage bekommt das Profil mit, dazu die Vorkenntnisse aus dem Spiel-Einstieg (S.player.level). */
const PROFILE_MAX = 40, PROFILE_INTERVAL = 4;
const Q_TYPES = [
  ['warum', 'will das Warum', /\b(warum|wieso|weshalb|why)\b/i],
  ['wie', 'fragt nach dem Wie', /\bwie (mach|geht|schreib|funktion|krieg|bau|komm|setz|nutz|benutz)|\bhow\b/i],
  ['was', 'fragt nach Begriffen', /^\s*(was (ist|sind|bedeutet|heißt|heisst|macht|genau)|what)/i],
  ['unterschied', 'vergleicht gern', /unterschied|\bvs\.?\b|versus|oder lieber|besser als|\bstatt\b|anstatt/i],
  ['beispiel', 'will Beispiele', /beispiel|zeig (mal|mir)|\bexample\b/i],
  ['verwirrt', 'kommt manchmal nicht mit', /versteh(e)? (ich )?(das )?(nicht|nix|gar nicht|kein)|check(e)? (das )?(nicht|nix)|kapier|keine ahnung|verwirr|\bhä\b|\?\?|zu schwer|zu kompliziert/i],
  ['code', 'fragt mit Code', /```|=>|\w\(\)|[{};]\s*$|<\w+[\s>]/m],
  ['praxis', 'denkt an die Praxis', /\b(job|firma|projekt|praxis|in echt|real)\b|wann (benutz|brauch|nehm|nutz)/i]
];
function profile() { S.profile = S.profile || {}; const p = S.profile; p.questions = p.questions || []; p.sig = p.sig || {}; return p; }
const profileOn = () => !(S.profile && S.profile.off);
function questionTypes(q) { return Q_TYPES.filter(t => t[2].test(q)).map(t => t[0]); }
/* Eine selbst getippte Frage merken. wo: folie | uebung | chat | nachfrage */
function learnQuestion(q, where, ch, topic) {
  if (!profileOn() || !q) return;
  const p = profile();
  p.questions.push({ q: String(q).slice(0, 300), where, ch: ch || '', t: String(topic || '').slice(0, 80), ts: Date.now(), category: questionTypes(q) });
  if (p.questions.length > PROFILE_MAX) p.questions.splice(0, p.questions.length - PROFILE_MAX);
  p.n = (p.n || 0) + 1;
  save(); profileEvaluate(false);
}
/* ----- Eigene Stichworte am Kapitelende („Was nimmst du mit?“): Wortwahl und Unsicherheit ----- */
const UNSURE_RE = /\b(glaub(e)?|vielleicht|irgendwie|keine ahnung|wei(ß|ss) (ich )?nicht|bin (mir )?nicht sicher|ich denke|evtl|oder so|kp)\b|\?/i;
function learnExplanation(text, kind, ch, topic) {
  if (!profileOn() || !text) return;
  const p = profile(); p.expl = p.expl || [];
  p.expl.push({ x: String(text).slice(0, 400), kind, ch: ch || '', t: String(topic || '').slice(0, 80), ts: Date.now() });
  if (p.expl.length > 25) p.expl.splice(0, p.expl.length - 25);
  if (UNSURE_RE.test(text)) p.sig.unsure = (p.sig.unsure || 0) + 1;
  p.n = (p.n || 0) + 1;
  save(); profileEvaluate(false);
}
/* Konzepte, die in seinen Erklärungen öfter wackelten als saßen (und umgekehrt). Nur noch aus älteren Spielständen: Neue kommen nicht mehr dazu. */
function concepts() {
  const k = Object.values(profile().concepts || {});
  return {
    wobbles: k.filter(e => e.w > e.s).sort((a, b) => (b.w - b.s) - (a.w - a.s) || (b.at || 0) - (a.at || 0)).slice(0, 8),
    solid: k.filter(e => e.s > 0 && e.s >= e.w).sort((a, b) => b.s - a.s).slice(0, 8)
  };
}
/* Verhalten ohne eigene Frage: Schnellfrage „Erklär’s anders“ (nochmal), Hilfe in der Übung (hilfe) */
function learnSignal(name) { if (!profileOn()) return; const p = profile(); p.sig[name] = (p.sig[name] || 0) + 1; save(); }

function profileStats() {
  const p = profile(), f = p.questions;
  const category = {}; f.forEach(x => (x.category || []).forEach(t => { category[t] = (category[t] || 0) + 1; }));
  const words = f.length ? Math.round(f.reduce((a, x) => a + x.q.split(/\s+/).filter(Boolean).length, 0) / f.length) : 0;
  const qv = Object.values(S.quiz || {}), quizInstant = qv.length ? Math.round(100 * qv.filter(v => v === 1).length / qv.length) : null;
  const ex = Object.values(S.ex || {}), exOk = ex.filter(e => e.passed), exSolo = exOk.filter(e => !e.usedSolution).length;
  const chap = {}; f.forEach(x => { if (x.ch) chap[x.ch] = (chap[x.ch] || 0) + 1; });
  return { n: p.n || 0, category, words, quizInstant, quizN: qv.length, exN: ex.length, exOk: exOk.length, exSolo, sig: p.sig, chap };
}
/* Regeln aus den Zählern, funktioniert auch ohne KI-Auswertung */
function profileHints() {
  const s = profileStats(), f = profile().questions.length, out = [];
  const share = t => f ? (s.category[t] || 0) / f : 0;
  if (f >= 3 && s.words && s.words <= 8) out.push('Fragt sehr knapp: antworte kurz, ein Gedanke pro Absatz.');
  if (f >= 3 && s.words >= 25) out.push('Fragt ausführlich: darf etwas mehr Tiefe haben.');
  if (share('verwirrt') >= 0.25 || (s.sig.nochmal || 0) >= 3) out.push('Kommt öfter nicht mit: kleine Schritte, jedes Fachwort sofort in einfachen Worten erklären, keine Sprünge.');
  if (share('warum') >= 0.3) out.push('Will das Warum verstehen: erst den Grund, dann die Syntax.');
  if (share('beispiel') >= 0.2) out.push('Lernt über Beispiele: immer ein konkretes Mini-Beispiel.');
  if (share('unterschied') >= 0.2) out.push('Denkt in Vergleichen: Gegenüberstellungen (vorher/nachher, A vs. B) helfen.');
  if (share('code') >= 0.3) out.push('Fragt gern mit Code: antworte mit Code und Zeile-für-Zeile-Erklärung.');
  if (share('praxis') >= 0.2) out.push('Will den Praxisbezug: sag, wann man das im Job wirklich braucht.');
  if (s.quizN >= 6 && s.quizInstant != null && s.quizInstant < 55) out.push('Quiz oft erst im zweiten Versuch richtig: Grundlagen wiederholen, nichts voraussetzen.');
  if (s.quizN >= 6 && s.quizInstant >= 85) out.push('Quiz fast immer sofort richtig: kommt schnell mit, darf tiefer gehen.');
  if ((s.sig.unsure || 0) + (s.sig.unsureAi || 0) >= 2) out.push('Formuliert eigene Erklärungen oft unsicher („glaube“, „irgendwie“, Fragezeichen): sag klar, was an seiner Idee schon stimmt, und definiere Begriffe eindeutig.');
  if (s.exN >= 3 && s.exOk && s.exSolo / s.exOk < 0.5) out.push('Schaut bei Übungen oft die Lösung an: lieber mit Teilschritten führen.');
  return out;
}
function profileNote() {
  if (!profileOn()) return '';
  const p = profile(), h = profileHints();
  const k = concepts(), wk = k.wobbles.map(e => e.n), bg = (p.terms || []).slice(-5);
  if (!p.image && !h.length && !wk.length && !bg.length) return '';
  return '\n\nLERNPROFIL des Lernenden (aus seinen bisherigen Fragen und Ergebnissen gelernt). Pass Tempo, Tiefe, Fachwörter, Beispiele und Länge daran an. Erwähne das Profil nicht ausdrücklich und sei nie herablassend.\n' +
    (p.image ? p.image.trim() + '\n' : '') + (h.length ? 'Beobachtet: ' + h.join(' ') + '\n' : '') +
    (wk.length ? 'Konzepte, die in seinen eigenen Erklärungen noch wackeln: ' + wk.join(', ') + '. Wenn eins davon vorkommt, erklär es kurz mit.\n' : '') +
    (bg.length ? 'Begriffe, die er schon verwechselt hat (falsch → gemeint): ' + bg.join('; ') + '. Benutz die richtigen Wörter bewusst und korrigier sanft, wenn er sie wieder verwechselt.' : '');
}
/* Vorkenntnisse aus dem Spiel-Einstieg (S.player.level: 0 = neu, 1 = etwas HTML/JS, 2 = kennt schon ein Framework), ein Satz für Toni */
const PRIOR_KNOWLEDGE = [
  'Zum Start hat er gesagt, dass Angular für ihn ganz neu ist: Erklär von Grund auf und jedes Fachwort in einfachen Worten.',
  'Zum Start hat er gesagt, dass er etwas HTML und JavaScript kann, aber noch kein Angular: Bau darauf auf und erklär Angular- und TypeScript-Begriffe kurz mit.',
  'Zum Start hat er gesagt, dass er schon ein anderes Framework kennt: Halt die Grundlagen knapp und vergleich ruhig mit anderen Frameworks.'
];
function priorKnowledgeNote() { const l = S.player && S.player.level; return typeof l === 'number' && PRIOR_KNOWLEDGE[l] ? '\n\n' + PRIOR_KNOWLEDGE[l] : ''; }
/* Profil, Vorkenntnisse und Name in die erste Nachricht direkt hinter Tonis Rolle einfügen (alle Anbieter) */
function withProfile(input) {
  const n = typeof meName === 'function' ? meName() : '';
  const note = profileNote() + (profileOn() && typeof topicsNote === 'function' ? topicsNote() : '') + priorKnowledgeNote() + (n ? '\n\nDer Lernende heißt ' + n + '. Sprich ihn ab und zu mit Vornamen an, nicht in jedem Satz.' : ''); if (!note) return input;
  const add = t => String(t).startsWith(TONI) ? TONI + note + '\n' + String(t).slice(TONI.length) : note.trim() + '\n\n' + t;
  if (typeof input === 'string') return add(input);
  return input.map((m, i) => i === 0 && m.role === 'user' ? Object.assign({}, m, { content: add(m.content) }) : m);
}
let profileBusy = false;
async function profileEvaluate(force) {
  const p = profile();
  const quantity = p.questions.length + (p.expl || []).length;
  if (!profileOn() || profileBusy || quantity < (force ? 1 : 3)) return false;
  if (!force && p.image && (p.n || 0) - (p.imageN || 0) < PROFILE_INTERVAL) return false;
  if (!aiCfg().key) return false;
  profileBusy = true;
  try {
    const s = profileStats(), heading = id => { const c = CH.find(x => x.id === id); return c ? c.title : id; };
    const he = (p.expl || []).slice(-10).map(x => '- [' + (x.ch ? heading(x.ch) : '') + (x.t ? ' / ' + x.t : '') + '] „' + String(x.x || '').replace(/\n+/g, ' / ') + '“').join('\n');
    const kz = concepts();
    const fr = p.questions.slice(-25).map(x => '- [' + (x.ch ? heading(x.ch) : 'allgemein') + (x.t ? ' / ' + x.t : '') + ', ' + x.where + '] ' + x.q).join('\n');
    const prompt = 'Du wertest aus, WIE ein Lernender Angular lernt, damit sein KI-Coach seine Erklärungen auf ihn zuschneiden kann.\n\n' +
      'Seine letzten Fragen (älteste zuerst):\n' + (fr || '(noch keine)') + '\n\n' +
      (he ? 'Seine eigenen Erklärungen im Freitext (älteste zuerst). Achte genau auf die Wortwahl: falsch oder schief benutzte Fachbegriffe, vage Wörter („Ding“, „irgendwie“), Unsicherheit („glaube“, „?“), was er auslässt:\n' + he + '\n\n' : '') +
      (kz.wobbles.length || kz.solid.length ? 'Konzepte aus allen Erklärungen bisher: wackelt ' + (kz.wobbles.map(e => e.n + ' (' + e.w + '×)').join(', ') || '-') + '; sitzt ' + (kz.solid.map(e => e.n + ' (' + e.s + '×)').join(', ') || '-') + '\n\n' : '') +
      (typeof topicsNote === 'function' && topicsNote() ? topicsNote().trim() + '\n\n' : '') +
      'Zahlen: ' + s.n + ' Fragen insgesamt, im Schnitt ' + s.words + ' Wörter pro Frage. ' +
      (s.quizN ? 'Quiz: ' + s.quizInstant + ' % von ' + s.quizN + ' Fragen im ersten Versuch richtig. ' : '') +
      (s.exN ? 'Übungen: ' + s.exOk + ' von ' + s.exN + ' gelöst, ' + s.exSolo + ' ohne Lösung anzuschauen. ' : '') +
      '„Erklär’s anders“: ' + (s.sig.nochmal || 0) + '×, Hilfe von Toni in einer Übung: ' + (s.sig.hilfe || 0) + '×.\n' +
      (p.image ? '\nBisheriges Profil (aktualisieren, nicht blind übernehmen):\n' + p.image + '\n' : '') +
      '\nSchreib das Profil, genau in diesem Format, insgesamt max. 150 Wörter, sachlich und respektvoll (nie abwertend):\n' +
      'NIVEAU: Einsteiger | Grundlagen sitzen | Mittel | Fortgeschritten (ein Wert, plus kurzer Grund)\nSO FRAGT ER: 1 Satz (Länge, Ton, Fachwörter, was er wissen will)\nSO ERKLÄRT ER: 1 Satz zu seiner Wortwahl in eigenen Erklärungen (präzise oder vage, sicher oder unsicher)\nLÜCKEN: Konzepte, die noch nicht sitzen (Komma-Liste, oder „noch unklar“)\nBEGRIFFE: Wörter, die er falsch benutzt oder verwechselt (falsch → richtig), oder „keine aufgefallen“\nSTÄRKEN: was schon sitzt\nSO ERKLÄREN: 2-3 konkrete Anweisungen an den Coach (Tempo, Beispiele/Analogien, Code-Anteil, Fachwörter, Länge)';
    const t = await aiStream(prompt, () => {}, 'Du bist eine nüchterne Lern-Analystin. Antworte nur im verlangten Format, auf Deutsch.');
    if (!t || !/NIVEAU:/i.test(t)) return false;
    const q = profile(); q.image = t.trim().slice(0, 1200); q.imageAt = Date.now(); q.imageN = q.n || 0;
    save(); renderProfileDlg();
    return true;
  } catch (e) { return false; } finally { profileBusy = false; }
}

/* ----- Einstellungen, Reiter „Coach Toni“: Was Toni über dich gelernt hat (das Gerüst steht in dialogs.html) ----- */
function renderProfileDlg() {
  const body = document.getElementById('pfBody'); if (!body) return;
  const p = profile(), s = profileStats(), h = profileHints();
  $('#pfOn').checked = profileOn();
  const category = Object.entries(s.category).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t, n]) => (Q_TYPES.find(x => x[0] === t) || [, t])[1] + ' (' + n + ')');
  body.innerHTML = topicsProfileHtml() +
    (p.image ? '<div class="pf-image">' + md(p.image) + '<p class="small muted">Stand: ' + new Date(p.imageAt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) + ', nach ' + (p.imageN || 0) + ' Fragen</p></div>'
      : '<p class="muted small">' + (p.questions.length + (p.expl || []).length < 3 ? 'Noch zu wenig gesehen. Ab 3 Fragen schreibt Toni dein Lernbild.' : 'Noch kein Lernbild. Dafür braucht Toni eine KI (oben in diesem Reiter).') + '</p>') +
    (() => { const k = concepts(), bg = p.terms || []; if (!k.wobbles.length && !k.solid.length && !bg.length) return '';
      return '<p class="q-label">Konzepte aus deinen Erklärungen</p><div class="pf-chips">' + k.wobbles.map(e => '<span class="pf-chip no" title="' + e.w + '× unscharf, ' + e.s + '× klar">' + esc(e.n) + '</span>').join('') + k.solid.map(e => '<span class="pf-chip ok" title="' + e.s + '× klar erklärt">' + esc(e.n) + '</span>').join('') + '</div>' +
        '<p class="small muted">Rot: wackelt noch · Grün: sitzt</p>' + (bg.length ? '<p class="q-label">Verwechselte Begriffe</p><ul class="small">' + bg.slice(-6).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : ''); })() +
    (h.length ? '<p class="q-label">Beobachtet</p><ul class="small">' + h.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
    (s.n ? '<p class="small muted">' + s.n + ' Fragen gesamt' + (category.length ? ' · ' + esc(category.join(', ')) : '') + (s.quizN ? ' · Quiz sofort richtig: ' + s.quizInstant + ' %' : '') + '</p>' : '') +
    ((p.expl || []).length ? '<details class="small"><summary>Deine letzten Erklärungen</summary><ul>' + p.expl.slice(-5).reverse().map(x => '<li>' + esc(x.x) + '</li>').join('') + '</ul></details>' : '') +
    (p.questions.length ? '<details class="small"><summary>Deine letzten Fragen</summary><ul>' + p.questions.slice(-8).reverse().map(x => '<li>' + esc(x.q) + '</li>').join('') + '</ul></details>' : '');
  /* Ein Thema anklicken: Einstellungen zu, Übungsrunde auf */
  body.querySelectorAll('a.pf-chip').forEach(a => a.onclick = () => { const d = document.getElementById('meDlg'); if (d && d.open) d.close(); });
}
function setupProfile() {
  if (!document.getElementById('pfBody')) return;
  $('#pfOn').onchange = e => { profile().off = !e.target.checked; save(); renderProfileDlg(); };
  $('#pfNow').onclick = async () => {
    $('#pfMsg').textContent = 'Toni wertet aus…';
    const ok = await profileEvaluate(true);
    $('#pfMsg').textContent = ok ? 'Lernbild aktualisiert.' : (profile().questions.length ? 'Klappt gerade nicht. Ist eine KI eingestellt?' : 'Stell Toni erst ein paar Fragen.');
  };
  $('#pfReset').onclick = () => {
    S.profile = { off: profile().off };
    save(); renderProfileDlg(); $('#pfMsg').textContent = 'Zurückgesetzt. Toni fängt neu an.';
  };
}
