/* ================= PULL REQUEST AN TONI =================
   Sind die Tests grün, kann man seine Lösung als Pull Request einreichen. Toni reviewt sie wie im Agentur-Alltag:
   Zusammenfassung, Urteil (Approve / Änderungen / Kommentar) und Kommentare direkt an den Codezeilen
   (👍 Stark, 💡 Nit, ⛔ Muss geändert werden, ❓ Frage). Grundlage sind Angular-22-Best-Practices.
   Mit KI schreibt Toni die Review, ohne KI gibt es eine automatische Review aus den Code-Checks.
   Runde 2+: Toni bekommt seine alten Kommentare mit und prüft, ob sie erledigt sind. */
var PR_ARTEN = {
  must: { ic: '⛔', n: 'Muss geändert werden' },
  nit: { ic: '💡', n: 'Nit' },
  frage: { ic: '❓', n: 'Frage' },
  lob: { ic: '👍', n: 'Stark' }
};
var PR_URTEIL = {
  approve: { ic: '✅', n: 'Approved', t: 'Toni hat deinen Pull Request freigegeben.' },
  changes: { ic: '🔁', n: 'Änderungen angefragt', t: 'Ein paar Sachen noch, dann kann es rein.' },
  comment: { ic: '💬', n: 'Kommentiert', t: 'Läuft, Toni hat aber noch Anmerkungen.' }
};
var PR_REGELN = 'Angular-22-Regeln im Team: Zustand in signal(), Abgeleitetes in computed(), nie Werte doppelt halten. Services mit @Service() (Kurzform von @Injectable({ providedIn: \'root\' })) und inject() statt Konstruktor-Injection. input()/input.required()/output()/model() statt @Input/@Output. Template mit @if/@for (mit track)/@switch statt *ngIf/*ngFor. OnPush ist Standard, ChangeDetectionStrategy.Eager nur mit gutem Grund. Signals immutable ändern (update mit neuem Array/Objekt, nie push/splice auf dem Wert). RxJS: kein subscribe im subscribe (switchMap & Co.), Abos mit takeUntilDestroyed() oder toSignal() beenden. Neue Formulare mit Signal Forms, bestehende Reactive Forms sind okay. Strikte Typen, kein any. Klassennamen ohne Component-Suffix. Keine teuren Methodenaufrufe im Template, dafür computed(). Kein console.log, kein toter Code, keine setTimeout-Hacks gegen Change Detection.';

function prZeilen(code) { return String(code || '').split('\n'); }

/* ---------- Automatische Review (ohne KI) ---------- */
var PR_AUTO = [
  { re: /constructor\s*\(\s*(private|public|protected|readonly)\s/, art: 'nit', text: 'Konstruktor-Injection ist der alte Stil. Hol den Service als Feld: `private x = inject(X);`', vorschlag: 'private service = inject(MeinService);' },
  { re: /@Injectable\s*\(\s*\{\s*providedIn:\s*'root'/, art: 'nit', text: 'Seit Angular 22 reicht `@Service()`. Kürzer, und ng generate macht es inzwischen auch so.', vorschlag: '@Service()' },
  { re: /:\s*any\b|<any>|as any\b/, art: 'nit', text: '`any` schaltet TypeScript an dieser Stelle aus. Ein Interface oder ein genauer Typ fängt Fehler, bevor sie im Browser landen.' },
  { re: /\(\)\s*\.\s*(push|splice|pop|shift|unshift|sort|reverse)\s*\(/, art: 'must', text: 'Hier wird der Wert eines Signals direkt verändert. Angular merkt das nicht, die Anzeige bleibt alt. Neues Array bauen und mit `update()` setzen.', vorschlag: m => /push|unshift/.test(m[1]) ? 'this.liste.update(l => [...l, neu]);' : /sort|reverse/.test(m[1]) ? 'this.liste.update(l => [...l].' + m[1] + '(…));' : 'this.liste.update(l => l.filter(x => x.id !== id));' },
  { re: /\*ng(If|For)\b/, art: 'nit', text: '`*ngIf`/`*ngFor` sind der alte Template-Stil. Im Team schreiben wir `@if` und `@for (… ; track …)`.' },
  { re: /@(Input|Output)\s*\(/, art: 'nit', text: 'Decorator-Inputs sind Altcode. `input()`/`output()` sind Signals und passen zum Rest.', vorschlag: 'name = input.required<string>();' },
  { re: /ChangeDetectionStrategy\.(Eager|Default)\b/, art: 'frage', text: 'Warum Eager? Seit Angular 22 ist OnPush der Standard, und mit Signals brauchst du Eager praktisch nie.' },
  { re: /\bconsole\.log\s*\(/, art: 'nit', text: '`console.log` bitte vor dem Merge rausnehmen. Für Fehler gibt es den ErrorHandler.' },
  { re: /\bvar\s+\w/, art: 'nit', text: '`var` hat überraschende Regeln (Hoisting, kein Block-Scope). `const`, und nur wenn nötig `let`.' },
  { re: /\bsetTimeout\s*\(/, art: 'frage', text: 'Wofür das `setTimeout`? Wenn es die Anzeige „anschubsen“ soll: Ein Signal löst das sauberer.' },
  { re: /[^=!<>]==[^=]/, art: 'nit', text: '`==` wandelt Typen heimlich um (`0 == \'\'` ist true). Im Team immer `===`.' },
  { re: /\/\/\s*(TODO|FIXME)/i, art: 'nit', text: 'Ein TODO im PR. Entweder erledigen oder als eigenes Ticket anlegen und hier löschen.' }
];
var PR_LOB = [
  { re: /\bcomputed\s*\(/, text: 'Sauber: abgeleiteter Wert mit `computed()`. Rechnet nur neu, wenn sich wirklich was ändert.' },
  { re: /\.asReadonly\s*\(/, text: 'Gut gekapselt. Von außen kann niemand mehr am Zustand drehen.' },
  { re: /\btrack\s+\w/, text: '`track` sitzt. Damit baut Angular beim Ändern nur die betroffenen Zeilen neu.' },
  { re: /\binject\s*\(/, text: '`inject()` statt Konstruktor, genau so wollen wir es.' },
  { re: /@Service\s*\(/, text: '`@Service()`, schon im Angular-22-Stil. 👌' },
  { re: /takeUntilDestroyed|toSignal\s*\(/, text: 'Abo räumt sich selbst auf. Kein Speicherleck, das freut das Review.' },
  { re: /\.update\s*\(/, text: 'Immutable Update mit `update()`. Genau richtig für Signals.' },
  { re: /\bswitchMap\b/, text: '`switchMap` bricht alte Anfragen ab. So gewinnt nie eine veraltete Antwort.' }
];
function prStatisch(code, ex, testRes) {
  const zeilen = prZeilen(code), k = [];
  zeilen.forEach((l, i) => {
    const t = l.trim(); if (!t || t.startsWith('//') && !/TODO|FIXME/i.test(t) || t.startsWith('*')) return;
    PR_AUTO.forEach(r => { const m = l.match(r.re); if (m && !k.some(x => x.text === r.text)) k.push({ zeile: i + 1, art: r.art, text: r.text, vorschlag: typeof r.vorschlag === 'function' ? r.vorschlag(m) : r.vorschlag || '' }); });
  });
  let lobN = 0;
  PR_LOB.forEach(r => { if (lobN >= 2) return; const i = zeilen.findIndex(l => r.re.test(l) && !l.trim().startsWith('//')); if (i >= 0 && !k.some(x => x.zeile === i + 1)) { k.push({ zeile: i + 1, art: 'lob', text: r.text, vorschlag: '' }); lobN++; } });
  const rot = prTestsRot(testRes);
  rot.forEach(n => k.push({ zeile: 0, art: 'must', text: 'Test noch rot: ' + n, vorschlag: '' }));
  const must = k.some(x => x.art === 'must'), rest = k.some(x => x.art === 'nit' || x.art === 'frage');
  const urteil = must ? 'changes' : rest ? 'comment' : 'approve';
  const n = typeof ichName === 'function' && ichName();
  const zus = must ? (rot.length ? 'Erst müssen die Tests grün werden. ' : '') + 'Ein paar Punkte bitte noch fixen, Details an den Zeilen.'
    : rest ? 'Funktioniert, sieht ordentlich aus. Die Nits sind keine Blocker, aber mach sie gleich mit.'
    : 'Sauberer PR' + (n ? ', ' + n : '') + '. Lesbar, im aktuellen Angular-Stil, Tests grün. Kann rein.';
  return { urteil, zusammenfassung: zus, kommentare: k.sort((a, b) => a.zeile - b.zeile).slice(0, 10), quelle: 'auto' };
}
function prTestsRot(testRes) {
  if (!testRes) return [];
  if (testRes.fatal) return ['Der Code läuft noch nicht (' + String(testRes.fatal).split('\n')[0].slice(0, 120) + ')'];
  return testRes.results.filter(r => !r.ok).map(r => r.name);
}

/* ---------- Review mit KI ---------- */
function prPrompt(code, ex, ch, testRes, vorher) {
  const z = prZeilen(code).map((l, i) => String(i + 1).padStart(3, ' ') + ' | ' + l).join('\n');
  const rot = prTestsRot(testRes);
  const n = typeof ichName === 'function' && ichName();
  const tk = ch && ch.ticket ? ch.ticket.id + ' · ' + ch.ticket.titel : ex.title;
  return 'Du bist Toni, Senior-Angular-Entwickler bei der Agentur Pixelwerk, und reviewst einen Pull Request von ' + (n || 'einem neuen Junior-Dev') + ' (Frontend-Dev, neu im Team). Ton: freundlich, direkt, wie ein guter Kollege im Agentur-Alltag. Deutsch, duzen, kurze Sätze, keine Sport-Vergleiche.\n\n' +
    'Ticket: ' + tk + '\nAufgabe: ' + stripHtml(ex.goal + ' ' + ex.todo.join(' | ')) + '\n' +
    'Automatische Tests: ' + (rot.length ? 'ROT: ' + rot.join('; ') : 'alle grün') + '\n\n' + PR_REGELN + '\n\n' +
    (vorher && vorher.kommentare && vorher.kommentare.length ? 'Das ist Runde ' + ((vorher.runde || 1) + 1) + '. Deine Kommentare aus der letzten Runde:\n' + vorher.kommentare.filter(k => k.art !== 'lob').map(k => '- Zeile ' + k.zeile + ' [' + k.art + ']: ' + k.text).join('\n') + '\nPrüf, was davon erledigt ist (dafür gern ein 👍-Kommentar), und wiederhol Erledigtes nicht.\n\n' : '') +
    'Code (Zeilennummern vorne, gehören NICHT zum Code):\n```ts\n' + z + '\n```\n\n' +
    'Antworte NUR mit JSON in genau dieser Form:\n{"urteil":"approve|changes|comment","zusammenfassung":"2-3 Sätze an den Entwickler","kommentare":[{"zeile":12,"art":"must|nit|frage|lob","text":"Kommentar","vorschlag":"optional, höchstens 3 Zeilen Code"}]}\n' +
    'Regeln: 2 bis 7 Kommentare, mindestens ein „lob“ für etwas wirklich Gutes. „must“ nur für echte Fehler, rote Tests, Sicherheitslücken oder klare Verstöße gegen die Team-Regeln, die später Bugs machen. Stil-Kleinkram ist „nit“. „frage“, wenn du die Absicht wissen willst. zeile = Nummer der Codezeile, 0 für allgemeine Kommentare. Kein Kommentar zu Zeilen, die nur aus dem Startcode stammen und korrekt sind. Verrate nie die komplette Lösung: Ein Vorschlag zeigt nur das Muster. urteil: approve, wenn Tests grün und kein must; changes, wenn ein must da ist; sonst comment.';
}
function prNormalisieren(o, zeilenN, testRes) {
  if (!o || typeof o !== 'object') throw new Error('Antwort ist kein Objekt');
  const s = v => typeof v === 'string' ? v.trim() : '';
  const k = (Array.isArray(o.kommentare) ? o.kommentare : []).map(x => ({
    zeile: Math.max(0, Math.min(zeilenN, parseInt(x && x.zeile, 10) || 0)),
    art: PR_ARTEN[s(x && x.art)] ? s(x.art) : 'nit',
    text: s(x && x.text).slice(0, 500),
    vorschlag: s(x && x.vorschlag).split('\n').slice(0, 4).join('\n').slice(0, 300)
  })).filter(x => x.text).slice(0, 8).sort((a, b) => a.zeile - b.zeile);
  const rot = prTestsRot(testRes);
  if (rot.length && !k.some(x => x.art === 'must' && x.zeile === 0)) k.unshift({ zeile: 0, art: 'must', text: 'Tests noch rot: ' + rot.join(', '), vorschlag: '' });
  let urteil = PR_URTEIL[s(o.urteil)] ? s(o.urteil) : 'comment';
  if (k.some(x => x.art === 'must')) urteil = 'changes';
  else if (urteil === 'changes') urteil = 'comment';
  const zus = s(o.zusammenfassung).slice(0, 600);
  if (!zus && !k.length) throw new Error('Leere Review');
  return { urteil, zusammenfassung: zus || PR_URTEIL[urteil].t, kommentare: k, quelle: 'ki' };
}
async function prKiReview(code, ex, ch, testRes, vorher) {
  const system = 'Du bist Toni, Senior-Angular-Entwickler bei Pixelwerk, und schreibst Code-Reviews als sauberes JSON.';
  const prompt = mitProfil(prPrompt(code, ex, ch, testRes, vorher));
  if (!aiCfg().key) return null;
  const t = await kiStream(prompt, () => {}, system, { temperature: 0.4, maxOutputTokens: 4096, responseMimeType: 'application/json' });
  return prNormalisieren(jsonAusText(t), prZeilen(code).length, testRes);
}

/* ---------- Anzeige ---------- */
function prKommentarHtml(k, idx) {
  const a = PR_ARTEN[k.art];
  return `<div class="pr-c pr-${k.art}" data-k="${idx}"><span class="pr-av" aria-hidden="true">T</span><div class="pr-cb"><p class="pr-ch"><b>Toni</b><span class="pr-tag">${a.ic} ${a.n}</span>${k.zeile ? `<button type="button" class="linkbtn pr-goto" data-z="${k.zeile}">Zeile ${k.zeile} im Editor</button>` : ''}</p><div class="pr-txt">${md(k.text)}</div>${k.vorschlag ? `<p class="pr-vl">Vorschlag</p><pre class="code"><code>${esc(k.vorschlag)}</code></pre>` : ''}</div></div>`;
}
function prRender(box, rv, code, start, ctx) {
  const zeilen = prZeilen(code), html = tokensByLine(code);
  const startSet = new Set(prZeilen(start).map(l => l.trim()).filter(Boolean));
  const proZeile = {}; rv.kommentare.forEach((k, i) => { (proZeile[k.zeile] = proZeile[k.zeile] || []).push(i); });
  const u = PR_URTEIL[rv.urteil], n = typeof ichName === 'function' && ichName();
  const zahl = a => rv.kommentare.filter(k => k.art === a).length;
  const nr = 100 + (ctx.nr || 0);
  const titel = (ctx.ch && ctx.ch.ticket ? ctx.ch.ticket.id + ': ' : '') + ctx.ex.title;
  const zeigen = new Set(); /* nur die Umgebung kommentierter und neuer Zeilen zeigen, Rest einklappen */
  zeilen.forEach((l, i) => { if (proZeile[i + 1] || (l.trim() && !startSet.has(l.trim()))) for (let d = -2; d <= 2; d++) zeigen.add(i + d); });
  let rows = '', luecke = 0;
  const flush = () => { if (luecke) { rows += `<div class="pr-gap">⋯ ${luecke} unveränderte ${luecke === 1 ? 'Zeile' : 'Zeilen'}</div>`; luecke = 0; } };
  zeilen.forEach((l, i) => {
    if (!zeigen.has(i) && zeilen.length > 24) { luecke++; return; }
    flush();
    const neu = l.trim() && !startSet.has(l.trim());
    rows += `<div class="pr-l${neu ? ' neu' : ''}${proZeile[i + 1] ? ' hat' : ''}"><span class="pr-n">${i + 1}</span><span class="pr-p">${neu ? '+' : ' '}</span><code class="cm-s-ngq">${html[i] || '&#8203;'}</code></div>`;
    (proZeile[i + 1] || []).forEach(k => { rows += prKommentarHtml(rv.kommentare[k], k); });
  });
  flush();
  const allg = (proZeile[0] || []).map(k => prKommentarHtml(rv.kommentare[k], k)).join('');
  box.hidden = false;
  box.innerHTML = `<div class="pr-head"><p class="pr-meta"><span class="pr-icon" aria-hidden="true">⇄</span> Pull Request #${nr} · <b>${esc(n || 'du')}</b> möchte in <code>main</code> mergen${ctx.runde > 1 ? ' · Runde ' + ctx.runde : ''}</p>
      <h3 class="pr-t">${esc(titel)}</h3>
      <p class="pr-status pr-s-${rv.urteil}">${u.ic} ${u.n}</p></div>
    <div class="pr-c pr-sum"><span class="pr-av" aria-hidden="true">T</span><div class="pr-cb"><p class="pr-ch"><b>Toni</b><span class="pr-tag">Review</span></p><div class="pr-txt">${md(rv.zusammenfassung)}</div>
      <p class="pr-zahl">${['must', 'nit', 'frage', 'lob'].filter(a => zahl(a)).map(a => `<span class="pr-${a}">${PR_ARTEN[a].ic} ${zahl(a)} ${PR_ARTEN[a].n}</span>`).join('')}</p>${rv.quelle === 'auto' ? '<p class="small muted">Automatische Review aus den Code-Checks. Mit eigenem KI-Schlüssel schreibt Toni sie selbst. <button type="button" class="linkbtn" id="prKi">Coach Toni einrichten</button></p>' : ''}</div></div>
    ${allg}
    <div class="pr-files"><p class="pr-fh">${ctx.ex.preview ? 'app.ts' : 'training.ts'}</p><div class="pr-code">${rows}</div></div>
    <div class="pr-act">${rv.urteil === 'approve' ? '<span class="pr-merged">🎉 Bereit zum Mergen</span>' : '<button type="button" class="btn" id="prFix">Fixes einbauen</button>'}${aiCfg().key ? '<button type="button" class="btn" id="prAntwort">Toni antworten</button>' : ''}<button type="button" class="linkbtn" id="prZu">Review schließen</button></div>`;
  highlightIn(box);
  box.querySelectorAll('.pr-goto').forEach(b => b.onclick = () => ctx.springe(+b.dataset.z));
  const fix = box.querySelector('#prFix'); if (fix) fix.onclick = () => { const erst = rv.kommentare.find(k => k.art === 'must' && k.zeile) || rv.kommentare.find(k => k.zeile && k.art !== 'lob'); ctx.springe(erst ? erst.zeile : 1); };
  const antwort = box.querySelector('#prAntwort'); if (antwort) antwort.onclick = () => ctx.antworten();
  const ki = box.querySelector('#prKi'); if (ki) ki.onclick = () => openAiSettings();
  box.querySelector('#prZu').onclick = () => { box.hidden = true; ctx.markierenAus(); ctx.btn.focus({ preventScroll: true }); };
}

/* Ablauf: Tests laufen lassen, Review holen (KI oder automatisch), anzeigen, merken */
async function prEinreichen(ctx) {
  const box = ctx.box, btn = ctx.btn, code = ctx.getCode();
  if (btn.disabled) return;
  if (!code.trim() || code.trim() === String(ctx.ex.starter).trim()) { toast('Erst etwas programmieren, dann den Pull Request einreichen.'); return; }
  btn.disabled = true; const alt = btn.textContent; btn.textContent = 'Toni reviewt…';
  box.hidden = false; box.innerHTML = '<div class="pr-wait"><span class="pr-av" aria-hidden="true">T</span><p><b>Toni schaut sich deinen Pull Request an…</b><br><span class="muted small">Tests laufen, dann kommentiert er Zeile für Zeile.</span></p></div>';
  box.scrollIntoView({ behavior: bewegungAn() ? 'smooth' : 'auto', block: 'nearest' });
  try {
    const testRes = await ctx.testen();
    const st = ctx.stand(); const vorher = st.pr && st.pr.code !== code ? st.pr : null;
    let rv = null;
    try { rv = await prKiReview(code, ctx.ex, ctx.ch, testRes, vorher); } catch (e) { rv = null; }
    if (!rv) rv = prStatisch(code, ctx.ex, testRes);
    const runde = vorher ? (vorher.runde || 1) + 1 : (st.pr ? st.pr.runde || 1 : 1);
    const warSchon = st.pr && st.pr.urteil === 'approve';
    st.pr = { urteil: rv.urteil, runde, at: Date.now(), code, kommentare: rv.kommentare.map(k => ({ zeile: k.zeile, art: k.art, text: k.text })), nr: st.pr ? st.pr.nr : (Object.values(S.ex || {}).filter(x => x && x.pr).length + 1) };
    ctx.speichern(st);
    prRender(box, rv, code, ctx.ex.starter, Object.assign({}, ctx, { runde, nr: st.pr.nr }));
    ctx.markieren(rv.kommentare);
    if (rv.urteil === 'approve') { jubelGross('Approved!', PR_URTEIL.approve.t); if (!warSchon && ctx.belohnen) ctx.belohnen(); }
    else if (rv.urteil === 'comment') jubelRichtig(box.querySelector('.pr-status'));
    btn.textContent = 'Pull Request neu einreichen';
  } catch (e) { box.innerHTML = '<p class="ai-err">Review ging schief: ' + esc(e.message) + '</p>'; btn.textContent = alt; }
  btn.disabled = false;
}
