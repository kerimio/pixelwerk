/* ================= PULL REQUEST AN TONI =================
   Sind die Tests grün, kann man seine Lösung als Pull Request einreichen. Toni reviewt sie wie im Agentur-Alltag:
   Zusammenfassung, Urteil (Approve / Änderungen / Kommentar) und Kommentare direkt an den Codezeilen
   (👍 Stark, 💡 Nit, ⛔ Muss geändert werden, ❓ Frage). Grundlage sind Angular-22-Best-Practices.
   Mit KI schreibt Toni die Review, ohne KI gibt es eine automatische Review aus den Code-Checks.
   Runde 2+: Toni bekommt seine alten Kommentare mit und prüft, ob sie erledigt sind. */
var PR_KINDS = {
  must: { ic: '⛔', n: 'Muss geändert werden' },
  nit: { ic: '💡', n: 'Nit' },
  frage: { ic: '❓', n: 'Frage' },
  lob: { ic: '👍', n: 'Stark' }
};
var PR_VERDICT = {
  approve: { ic: '✅', n: 'Approved', t: 'Toni hat deinen Pull Request freigegeben.' },
  changes: { ic: '🔁', n: 'Änderungen angefragt', t: 'Ein paar Sachen noch, dann kann es rein.' },
  comment: { ic: '💬', n: 'Kommentiert', t: 'Läuft, Toni hat aber noch Anmerkungen.' }
};
var PR_RULES = 'Angular-22-Regeln im Team: Zustand in signal(), Abgeleitetes in computed(), nie Werte doppelt halten. Services mit @Service() (Kurzform von @Injectable({ providedIn: \'root\' })) und inject() statt Konstruktor-Injection. input()/input.required()/output()/model() statt @Input/@Output. Template mit @if/@for (mit track)/@switch statt *ngIf/*ngFor. OnPush ist Standard, ChangeDetectionStrategy.Eager nur mit gutem Grund. Signals immutable ändern (update mit neuem Array/Objekt, nie push/splice auf dem Wert). RxJS: kein subscribe im subscribe (switchMap & Co.), Abos mit takeUntilDestroyed() oder toSignal() beenden. Neue Formulare mit Signal Forms, bestehende Reactive Forms sind okay. Strikte Typen, kein any. Klassennamen ohne Component-Suffix. Keine teuren Methodenaufrufe im Template, dafür computed(). Kein console.log, kein toter Code, keine setTimeout-Hacks gegen Change Detection.';

function prLines(code) { return String(code || '').split('\n'); }

/* ---------- Automatische Review (ohne KI) ---------- */
var PR_AUTO = [
  { re: /constructor\s*\(\s*(private|public|protected|readonly)\s/, kind: 'nit', text: 'Konstruktor-Injection ist der alte Stil. Hol den Service als Feld: `private x = inject(X);`', suggestion: 'private service = inject(MeinService);' },
  { re: /@Injectable\s*\(\s*\{\s*providedIn:\s*'root'/, kind: 'nit', text: 'Seit Angular 22 reicht `@Service()`. Kürzer, und ng generate macht es inzwischen auch so.', suggestion: '@Service()' },
  { re: /:\s*any\b|<any>|as any\b/, kind: 'nit', text: '`any` schaltet TypeScript an dieser Stelle aus. Ein Interface oder ein genauer Typ fängt Fehler, bevor sie im Browser landen.' },
  { re: /\(\)\s*\.\s*(push|splice|pop|shift|unshift|sort|reverse)\s*\(/, kind: 'must', text: 'Hier wird der Wert eines Signals direkt verändert. Angular merkt das nicht, die Anzeige bleibt alt. Neues Array bauen und mit `update()` setzen.', suggestion: m => /push|unshift/.test(m[1]) ? 'this.liste.update(l => [...l, neu]);' : /sort|reverse/.test(m[1]) ? 'this.liste.update(l => [...l].' + m[1] + '(…));' : 'this.liste.update(l => l.filter(x => x.id !== id));' },
  { re: /\*ng(If|For)\b/, kind: 'nit', text: '`*ngIf`/`*ngFor` sind der alte Template-Stil. Im Team schreiben wir `@if` und `@for (… ; track …)`.' },
  { re: /@(Input|Output)\s*\(/, kind: 'nit', text: 'Decorator-Inputs sind Altcode. `input()`/`output()` sind Signals und passen zum Rest.', suggestion: 'name = input.required<string>();' },
  { re: /ChangeDetectionStrategy\.(Eager|Default)\b/, kind: 'frage', text: 'Warum Eager? Seit Angular 22 ist OnPush der Standard, und mit Signals brauchst du Eager praktisch nie.' },
  { re: /\bconsole\.log\s*\(/, kind: 'nit', text: '`console.log` bitte vor dem Merge rausnehmen. Für Fehler gibt es den ErrorHandler.' },
  { re: /\bvar\s+\w/, kind: 'nit', text: '`var` hat überraschende Regeln (Hoisting, kein Block-Scope). `const`, und nur wenn nötig `let`.' },
  { re: /\bsetTimeout\s*\(/, kind: 'frage', text: 'Wofür das `setTimeout`? Wenn es die Anzeige „anschubsen“ soll: Ein Signal löst das sauberer.' },
  { re: /[^=!<>]==[^=]/, kind: 'nit', text: '`==` wandelt Typen heimlich um (`0 == \'\'` ist true). Im Team immer `===`.' },
  { re: /\/\/\s*(TODO|FIXME)/i, kind: 'nit', text: 'Ein TODO im PR. Entweder erledigen oder als eigenes Ticket anlegen und hier löschen.' }
];
var PR_PRAISE = [
  { re: /\bcomputed\s*\(/, text: 'Sauber: abgeleiteter Wert mit `computed()`. Rechnet nur neu, wenn sich wirklich was ändert.' },
  { re: /\.asReadonly\s*\(/, text: 'Gut gekapselt. Von außen kann niemand mehr am Zustand drehen.' },
  { re: /\btrack\s+\w/, text: '`track` sitzt. Damit baut Angular beim Ändern nur die betroffenen Zeilen neu.' },
  { re: /\binject\s*\(/, text: '`inject()` statt Konstruktor, genau so wollen wir es.' },
  { re: /@Service\s*\(/, text: '`@Service()`, schon im Angular-22-Stil. 👌' },
  { re: /takeUntilDestroyed|toSignal\s*\(/, text: 'Abo räumt sich selbst auf. Kein Speicherleck, das freut das Review.' },
  { re: /\.update\s*\(/, text: 'Immutable Update mit `update()`. Genau richtig für Signals.' },
  { re: /\bswitchMap\b/, text: '`switchMap` bricht alte Anfragen ab. So gewinnt nie eine veraltete Antwort.' }
];
function prStatic(code, ex, testRes) {
  const lines = prLines(code), k = [];
  lines.forEach((l, i) => {
    const t = l.trim(); if (!t || t.startsWith('//') && !/TODO|FIXME/i.test(t) || t.startsWith('*')) return;
    PR_AUTO.forEach(r => { const m = l.match(r.re); if (m && !k.some(x => x.text === r.text)) k.push({ codeLine: i + 1, kind: r.kind, text: r.text, suggestion: typeof r.suggestion === 'function' ? r.suggestion(m) : r.suggestion || '' }); });
  });
  let praiseN = 0;
  PR_PRAISE.forEach(r => { if (praiseN >= 2) return; const i = lines.findIndex(l => r.re.test(l) && !l.trim().startsWith('//')); if (i >= 0 && !k.some(x => x.codeLine === i + 1)) { k.push({ codeLine: i + 1, kind: 'lob', text: r.text, suggestion: '' }); praiseN++; } });
  const red = prTestsRed(testRes);
  red.forEach(n => k.push({ codeLine: 0, kind: 'must', text: 'Test noch rot: ' + n, suggestion: '' }));
  const must = k.some(x => x.kind === 'must'), rest = k.some(x => x.kind === 'nit' || x.kind === 'frage');
  const verdict = must ? 'changes' : rest ? 'comment' : 'approve';
  const n = typeof meName === 'function' && meName();
  const recap = must ? (red.length ? 'Erst müssen die Tests grün werden. ' : '') + 'Ein paar Punkte bitte noch fixen, Details an den Zeilen.'
    : rest ? 'Funktioniert, sieht ordentlich aus. Die Nits sind keine Blocker, aber mach sie gleich mit.'
    : 'Sauberer PR' + (n ? ', ' + n : '') + '. Lesbar, im aktuellen Angular-Stil, Tests grün. Kann rein.';
  return { verdict, summary: recap, comments: k.sort((a, b) => a.codeLine - b.codeLine).slice(0, 10), origin: 'auto' };
}
function prTestsRed(testRes) {
  if (!testRes) return [];
  if (testRes.fatal) return ['Der Code läuft noch nicht (' + String(testRes.fatal).split('\n')[0].slice(0, 120) + ')'];
  return testRes.results.filter(r => !r.ok).map(r => r.name);
}

/* ---------- Review mit KI ---------- */
function prPrompt(code, ex, ch, testRes, previous) {
  const z = prLines(code).map((l, i) => String(i + 1).padStart(3, ' ') + ' | ' + l).join('\n');
  const red = prTestsRed(testRes);
  const n = typeof meName === 'function' && meName();
  const tk = ch && ch.ticket ? ch.ticket.id + ' · ' + ch.ticket.heading : ex.title;
  return 'Du bist Toni, Senior-Angular-Entwickler bei der Agentur Pixelwerk, und reviewst einen Pull Request von ' + (n || 'einem neuen Junior-Dev') + ' (Frontend-Dev, neu im Team). Ton: freundlich, direkt, wie ein guter Kollege im Agentur-Alltag. Deutsch, duzen, kurze Sätze, keine Sport-Vergleiche.\n\n' +
    'Ticket: ' + tk + '\nAufgabe: ' + stripHtml(ex.goal + ' ' + ex.todo.join(' | ')) + '\n' +
    'Automatische Tests: ' + (red.length ? 'ROT: ' + red.join('; ') : 'alle grün') + '\n\n' + PR_RULES + '\n\n' +
    (previous && previous.comments && previous.comments.length ? 'Das ist Runde ' + ((previous.turn || 1) + 1) + '. Deine Kommentare aus der letzten Runde:\n' + previous.comments.filter(k => k.kind !== 'lob').map(k => '- Zeile ' + k.codeLine + ' [' + k.kind + ']: ' + k.text).join('\n') + '\nPrüf, was davon erledigt ist (dafür gern ein 👍-Kommentar), und wiederhol Erledigtes nicht.\n\n' : '') +
    'Code (Zeilennummern vorne, gehören NICHT zum Code):\n```ts\n' + z + '\n```\n\n' +
    'Antworte NUR mit JSON in genau dieser Form:\n{"verdict":"approve|changes|comment","summary":"2-3 Sätze an den Entwickler","comments":[{"codeLine":12,"kind":"must|nit|frage|lob","text":"Kommentar","suggestion":"optional, höchstens 3 Zeilen Code"}]}\n' +
    'Regeln: 2 bis 7 Kommentare, mindestens ein „lob“ für etwas wirklich Gutes. „must“ nur für echte Fehler, rote Tests, Sicherheitslücken oder klare Verstöße gegen die Team-Regeln, die später Bugs machen. Stil-Kleinkram ist „nit“. „frage“, wenn du die Absicht wissen willst. codeLine = Nummer der Codezeile, 0 für allgemeine Kommentare. Kein Kommentar zu Zeilen, die nur aus dem Startcode stammen und korrekt sind. Verrate nie die komplette Lösung: Ein Vorschlag zeigt nur das Muster. verdict: approve, wenn Tests grün und kein must; changes, wenn ein must da ist; sonst comment.';
}
function prNormalize(o, linesN, testRes) {
  if (!o || typeof o !== 'object') throw new Error('Antwort ist kein Objekt');
  const s = v => typeof v === 'string' ? v.trim() : '';
  const k = (Array.isArray(o.comments) ? o.comments : []).map(x => ({
    codeLine: Math.max(0, Math.min(linesN, parseInt(x && x.codeLine, 10) || 0)),
    kind: PR_KINDS[s(x && x.kind)] ? s(x.kind) : 'nit',
    text: s(x && x.text).slice(0, 500),
    suggestion: s(x && x.suggestion).split('\n').slice(0, 4).join('\n').slice(0, 300)
  })).filter(x => x.text).slice(0, 8).sort((a, b) => a.codeLine - b.codeLine);
  const red = prTestsRed(testRes);
  if (red.length && !k.some(x => x.kind === 'must' && x.codeLine === 0)) k.unshift({ codeLine: 0, kind: 'must', text: 'Tests noch rot: ' + red.join(', '), suggestion: '' });
  let verdict = PR_VERDICT[s(o.verdict)] ? s(o.verdict) : 'comment';
  if (k.some(x => x.kind === 'must')) verdict = 'changes';
  else if (verdict === 'changes') verdict = 'comment';
  const recap = s(o.summary).slice(0, 600);
  if (!recap && !k.length) throw new Error('Leere Review');
  return { verdict, summary: recap || PR_VERDICT[verdict].t, comments: k, origin: 'ki' };
}
async function prKiReview(code, ex, ch, testRes, previous) {
  const system = 'Du bist Toni, Senior-Angular-Entwickler bei Pixelwerk, und schreibst Code-Reviews als sauberes JSON.';
  const prompt = withProfile(prPrompt(code, ex, ch, testRes, previous));
  if (!aiCfg().key) return null;
  const t = await aiStream(prompt, () => {}, system, { temperature: 0.4, maxOutputTokens: 4096, responseMimeType: 'application/json' });
  return prNormalize(jsonFromText(t), prLines(code).length, testRes);
}

/* ---------- Anzeige ---------- */
function prCommentHtml(k, idx) {
  const a = PR_KINDS[k.kind];
  return `<div class="pr-c pr-${k.kind}" data-k="${idx}"><span class="pr-av" aria-hidden="true">T</span><div class="pr-cb"><p class="pr-ch"><b>Toni</b><span class="pr-tag">${a.ic} ${a.n}</span>${k.codeLine ? `<button type="button" class="linkbtn pr-goto" data-z="${k.codeLine}">Zeile ${k.codeLine} im Editor</button>` : ''}</p><div class="pr-txt">${md(k.text)}</div>${k.suggestion ? `<p class="pr-vl">Vorschlag</p><pre class="code"><code>${esc(k.suggestion)}</code></pre>` : ''}</div></div>`;
}
function prRender(box, rv, code, start, ctx) {
  const lines = prLines(code), html = tokensByLine(code);
  const startSet = new Set(prLines(start).map(l => l.trim()).filter(Boolean));
  const perLine = {}; rv.comments.forEach((k, i) => { (perLine[k.codeLine] = perLine[k.codeLine] || []).push(i); });
  const u = PR_VERDICT[rv.verdict], n = typeof meName === 'function' && meName();
  const number = a => rv.comments.filter(k => k.kind === a).length;
  const nr = 100 + (ctx.nr || 0);
  const heading = (ctx.ch && ctx.ch.ticket ? ctx.ch.ticket.id + ': ' : '') + ctx.ex.title;
  const reveal = new Set(); /* nur die Umgebung kommentierter und neuer Zeilen zeigen, Rest einklappen */
  lines.forEach((l, i) => { if (perLine[i + 1] || (l.trim() && !startSet.has(l.trim()))) for (let d = -2; d <= 2; d++) reveal.add(i + d); });
  let rows = '', gap = 0;
  const flush = () => { if (gap) { rows += `<div class="pr-gap">⋯ ${gap} unveränderte ${gap === 1 ? 'Zeile' : 'Zeilen'}</div>`; gap = 0; } };
  lines.forEach((l, i) => {
    if (!reveal.has(i) && lines.length > 24) { gap++; return; }
    flush();
    const fresh = l.trim() && !startSet.has(l.trim());
    rows += `<div class="pr-l${fresh ? ' fresh' : ''}${perLine[i + 1] ? ' owned' : ''}"><span class="pr-n">${i + 1}</span><span class="pr-p">${fresh ? '+' : ' '}</span><code class="cm-s-ngq">${html[i] || '&#8203;'}</code></div>`;
    (perLine[i + 1] || []).forEach(k => { rows += prCommentHtml(rv.comments[k], k); });
  });
  flush();
  const general = (perLine[0] || []).map(k => prCommentHtml(rv.comments[k], k)).join('');
  box.hidden = false;
  box.innerHTML = `<div class="pr-head"><p class="pr-meta"><span class="pr-icon" aria-hidden="true">⇄</span> Pull Request #${nr} · <b>${esc(n || 'du')}</b> möchte in <code>main</code> mergen${ctx.turn > 1 ? ' · Runde ' + ctx.turn : ''}</p>
      <h3 class="pr-t">${esc(heading)}</h3>
      <p class="pr-status pr-s-${rv.verdict}">${u.ic} ${u.n}</p></div>
    <div class="pr-c pr-sum"><span class="pr-av" aria-hidden="true">T</span><div class="pr-cb"><p class="pr-ch"><b>Toni</b><span class="pr-tag">Review</span></p><div class="pr-txt">${md(rv.summary)}</div>
      <p class="pr-count">${['must', 'nit', 'frage', 'lob'].filter(a => number(a)).map(a => `<span class="pr-${a}">${PR_KINDS[a].ic} ${number(a)} ${PR_KINDS[a].n}</span>`).join('')}</p>${rv.origin === 'auto' ? '<p class="small muted">Automatische Review aus den Code-Checks. Mit eigenem KI-Schlüssel schreibt Toni sie selbst. <button type="button" class="linkbtn" id="prKi">Coach Toni einrichten</button></p>' : ''}</div></div>
    ${general}
    <div class="pr-files"><p class="pr-fh">${ctx.ex.preview ? 'app.ts' : 'training.ts'}</p><div class="pr-code">${rows}</div></div>
    <div class="pr-act">${rv.verdict === 'approve' ? '<span class="pr-merged">🎉 Bereit zum Mergen</span>' : '<button type="button" class="btn" id="prFix">Fixes einbauen</button>'}${aiCfg().key ? '<button type="button" class="btn" id="prAnswer">Toni antworten</button>' : ''}<button type="button" class="linkbtn" id="prClose">Review schließen</button></div>`;
  highlightIn(box);
  box.querySelectorAll('.pr-goto').forEach(b => b.onclick = () => ctx.jump(+b.dataset.z));
  const fix = box.querySelector('#prFix'); if (fix) fix.onclick = () => { const firstly = rv.comments.find(k => k.kind === 'must' && k.codeLine) || rv.comments.find(k => k.codeLine && k.kind !== 'lob'); ctx.jump(firstly ? firstly.codeLine : 1); };
  const answer = box.querySelector('#prAnswer'); if (answer) answer.onclick = () => ctx.answers();
  const ai = box.querySelector('#prKi'); if (ai) ai.onclick = () => openAiSettings();
  box.querySelector('#prClose').onclick = () => { box.hidden = true; ctx.markOff(); ctx.btn.focus({ preventScroll: true }); };
}

/* Ablauf: Tests laufen lassen, Review holen (KI oder automatisch), anzeigen, merken */
async function prSubmit(ctx) {
  const box = ctx.box, btn = ctx.btn, code = ctx.getCode();
  if (btn.disabled) return;
  if (!code.trim() || code.trim() === String(ctx.ex.starter).trim()) { toast('Erst etwas programmieren, dann den Pull Request einreichen.'); return; }
  btn.disabled = true; const alt = btn.textContent; btn.textContent = 'Toni reviewt…';
  box.hidden = false; box.innerHTML = '<div class="pr-wait"><span class="pr-av" aria-hidden="true">T</span><p><b>Toni schaut sich deinen Pull Request an…</b><br><span class="muted small">Tests laufen, dann kommentiert er Zeile für Zeile.</span></p></div>';
  box.scrollIntoView({ behavior: motionOn() ? 'smooth' : 'auto', block: 'nearest' });
  try {
    const testRes = await ctx.runTest();
    const st = ctx.standing(); const previous = st.pr && st.pr.code !== code ? st.pr : null;
    let rv = null;
    try { rv = await prKiReview(code, ctx.ex, ctx.ch, testRes, previous); } catch (e) { rv = null; }
    if (!rv) rv = prStatic(code, ctx.ex, testRes);
    const turn = previous ? (previous.turn || 1) + 1 : (st.pr ? st.pr.turn || 1 : 1);
    const wasAlready = st.pr && st.pr.verdict === 'approve';
    st.pr = { verdict: rv.verdict, turn, at: Date.now(), code, comments: rv.comments.map(k => ({ codeLine: k.codeLine, kind: k.kind, text: k.text })), nr: st.pr ? st.pr.nr : (Object.values(S.ex || {}).filter(x => x && x.pr).length + 1) };
    ctx.store(st);
    prRender(box, rv, code, ctx.ex.starter, Object.assign({}, ctx, { turn, nr: st.pr.nr }));
    ctx.mark(rv.comments);
    if (rv.verdict === 'approve') { cheerBig('Approved!', PR_VERDICT.approve.t); if (!wasAlready && ctx.reward) ctx.reward(); }
    else if (rv.verdict === 'comment') cheerCorrect(box.querySelector('.pr-status'));
    btn.textContent = 'Pull Request neu einreichen';
  } catch (e) { box.innerHTML = '<p class="ai-err">Review ging schief: ' + esc(e.message) + '</p>'; btn.textContent = alt; }
  btn.disabled = false;
}
