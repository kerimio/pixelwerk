/* ===== Code-Übung: Editor, Vorschau, Tests gegen echtes Angular ===== */
/* Daten für die nachgebauten Backends der Übungen */
const TEAM4 = [{ id: 1, name: 'Leon', position: 'Frontend' }, { id: 2, name: 'Mo', position: 'Backend' }, { id: 3, name: 'Ben', position: 'Frontend' }, { id: 4, name: 'Tim', position: 'Design' }];
const BACKENDS = {
  entwickler(b) { b.routes['GET /api/entwickler'] = TEAM4; },
  profile(b) { ['Leon', 'Mo', 'Ben', 'Tim', 'Ali'].forEach((n, i) => { b.routes['GET /api/entwickler/' + (i + 1)] = { id: i + 1, name: n }; }); },
  bewerber(b) { b.routes['GET /api/bewerber'] = ({ q }) => ['Leon', 'Lenny', 'Mo', 'Ben'].filter(n => n.toLowerCase().startsWith((q.get('q') || '').toLowerCase())); },
  konfig(b) { b.routes['GET /config.json'] = { apiUrl: 'https://api.pixelwerk.de', features: ['tickets'] }; },
  /* Workshop-Planer (Abschlussprojekt): Liste, einzelner Workshop, Anmeldung, Anlegen. b.kaputt = true lässt die Liste mit 500 scheitern. */
  workshops(b) {
    const liste = [{ id: 1, titel: 'Signals von null', thema: 'Angular', plaetze: 8, belegt: 3 }, { id: 2, titel: 'HTTP verstehen', thema: 'Web', plaetze: 6, belegt: 6 }, { id: 3, titel: 'RxJS ohne Angst', thema: 'Angular', plaetze: 10, belegt: 9 }, { id: 4, titel: 'CSS Grid', thema: 'Web', plaetze: 12, belegt: 0 }];
    b.routes['GET /api/workshops'] = () => b.kaputt ? { ɵerror: { status: 500, message: 'Server Error' } } : liste;
    b.routes['POST /api/workshops'] = ({ body }) => { const w = Object.assign({ thema: '', plaetze: 1 }, body, { id: liste.length + 1, belegt: 0 }); liste.push(w); return w; };
    for (let id = 1; id <= 9; id++) {
      const finde = () => liste.find(w => w.id === id);
      b.routes['GET /api/workshops/' + id] = () => finde() || { ɵerror: { status: 404, message: 'Not Found' } };
      b.routes['POST /api/workshops/' + id + '/anmeldung'] = () => { const w = finde(); if (!w) return { ɵerror: { status: 404, message: 'Not Found' } }; if (w.belegt >= w.plaetze) return { ɵerror: { status: 409, message: 'Ausgebucht' } }; w.belegt++; return w; };
    }
  },
  wackelig(b) { b.failTimes = 0; let n = 0; b.routes['GET /api/entwickler'] = () => { n++; return n <= b.failTimes ? { ɵerror: { status: 503, message: 'Service Unavailable' } } : TEAM4; }; }
};

/* Rückfrage an Ort und Stelle statt eines Browser-Dialogs: ein Satz, ein Ja-Knopf, ein leiser Rückzieher. */
function ubRueckfrage(host, text, ja, nein, onJa, onNein) {
  if (host.firstChild) return; /* die Frage steht schon da */
  const box = document.createElement('div'); box.className = 'ub-frage';
  box.innerHTML = '<p>' + esc(text) + '</p><button type="button" class="btn">' + esc(ja) + '</button><button type="button" class="linkbtn">' + esc(nein) + '</button>';
  const [jaBtn, neinBtn] = box.querySelectorAll('button');
  jaBtn.onclick = () => { box.remove(); onJa(); };
  neinBtn.onclick = () => { box.remove(); if (onNein) onNein(); };
  host.appendChild(box); jaBtn.focus({ preventScroll: true });
}

function renderCode(body, ex, ch, opt) {
  const alleTests = ex.tests.concat(typeof codePruefungen === 'function' ? codePruefungen(ex) : []);
  /* opt.review: Übung aus dem Kopf in der Wiederholung. Eigener Zustand, frischer Startcode, nichts überschreibt den gespeicherten Code. */
  const RV = opt && opt.review ? { passed: false, fails: 0, hints: 0, sol: false } : null;
  const saved = RV ? null : S.code[ex.id];
  const geloest = () => RV ? RV.passed : !!(S.ex[ex.id] && S.ex[ex.id].passed);
  const offen = t => `<div class="test"><span class="ic">○</span><span>${esc(t.name)}</span></div>`;
  body.innerHTML = `
  <div class="ub">
    <div class="ex">
      <div class="ex-left">
        <p class="q-label">${RV ? '💻 Aus dem Kopf' : (ch.ticket ? esc(ch.ticket.id) + ' umsetzen' : 'Umsetzen')} · ${esc(ex.title)}</p>
        <div class="task"><p class="goal">${ex.goal}</p><ul class="todo">${ex.todo.map(t => '<li>' + t + '</li>').join('')}</ul></div>
        <div class="ex-actions">
          <button class="btn primary" id="runTests" type="button">Prüfen</button>
          <button class="btn" id="hintBtn" type="button"></button>
        </div>
        <div class="hints" id="hints" aria-live="polite"></div>
        <div id="solBox" tabindex="-1" hidden></div>
        <div id="ubFrage" aria-live="polite"></div>
        <div class="tests" id="tests" aria-live="polite">${alleTests.map(offen).join('')}</div>
        <div id="ubSchubs" aria-live="polite"></div>
        <div class="ex-more"><button class="linkbtn" id="prBtn" type="button" ${geloest() ? '' : 'hidden'}>Als Pull Request an Toni schicken</button><button class="linkbtn" id="resetCode" type="button">Neu anfangen</button></div>
        <div id="ubNeu" aria-live="polite"></div>
      </div>
      <div class="ex-right">
        <div class="editor-wrap"><div class="ed-bar"><span>${ex.preview ? 'app.ts' : 'training.ts'}</span><span id="edStatus">lädt…</span></div><div id="editor"></div></div>
        ${ex.preview ? `<div class="preview-wrap"><div class="ed-bar"><span>Vorschau</span><button class="linkbtn" id="refreshPrev" type="button">neu laden</button></div><div id="preview"></div></div>` : ''}
        <div class="console" id="console" hidden></div>
      </div>
    </div>
    <section id="prBox" class="pr" hidden aria-label="Code-Review von Toni"></section>
  </div>`;
  const start = saved != null ? saved : ex.starter;
  let cm = null, ta = null;
  if (window.CodeMirror) cm = CodeMirror($('#editor'), { value: start, mode: 'text/typescript', theme: 'ngq', lineNumbers: true, indentUnit: 2, tabSize: 2, autoCloseBrackets: true, matchBrackets: true, viewportMargin: Infinity, screenReaderLabel: 'Dein Code. Tab rückt ein, Escape verlässt den Editor.', extraKeys: { 'Tab': c => c.execCommand('insertSoftTab'), 'Esc': () => $('#runTests').focus(), 'Ctrl-Enter': () => check(), 'Cmd-Enter': () => check() } });
  else { ta = document.createElement('textarea'); ta.className = 'fallback-ed'; ta.value = start; ta.spellcheck = false; ta.setAttribute('aria-label', 'Dein Code'); $('#editor').appendChild(ta); }
  const getCode = () => cm ? cm.getValue() : ta.value;
  const setCode = v => { if (cm) cm.setValue(v); else { ta.value = v; onChange(); } };
  let prevT = null, previewNg = null, lastResults = null;
  const con = $('#console');
  const logLine = (l, m) => { con.hidden = false; const d = document.createElement('div'); d.className = 'log ' + l; d.textContent = m; con.appendChild(d); con.scrollTop = 1e9; };
  const onChange = () => { if (!RV) { S.code[ex.id] = getCode(); save(); } clearTimeout(prevT); prevT = setTimeout(updatePreview, 700); };
  if (cm) cm.on('change', onChange); else ta.addEventListener('input', onChange);
  const previewHost = ex.preview ? $('#preview').attachShadow({ mode: 'open' }) : null;
  function updatePreview() {
    if (!ex.preview || !window.ts) return;
    con.replaceChildren(); con.hidden = true;
    if (previewNg) { try { previewNg.destroy(); } catch (e) {} }
    const ng = createNg(); previewNg = ng; ng.onLog = logLine;
    if (ex.backend) BACKENDS[ex.backend](ng.backend);
    if (ex.modules) applyMods(ng, ex.modules);
    const box = document.createElement('div'); box.className = 'pv';
    previewHost.replaceChildren(previewStyle(), box);
    try {
      const mod = runModule(getCode(), ng); const cls = mod[ex.preview];
      if (!cls || !Object.prototype.hasOwnProperty.call(cls, 'ɵcmp')) { box.innerHTML = '<p class="pv-msg">Sobald <code>' + ex.preview + '</code> ein Baustein ist, siehst du ihn hier.</p>'; return; }
      ng.mount(cls, { host: box, onError: e => logLine('error', e.message) });
    } catch (e) { box.innerHTML = '<p class="pv-msg err">' + esc(e.message) + '</p>'; }
  }
  if (ex.preview) $('#refreshPrev').onclick = updatePreview;
  loadTS().then(() => { $('#edStatus').textContent = 'Strg/⌘ + Enter = Prüfen'; updatePreview(); }).catch(() => { $('#edStatus').textContent = 'TypeScript lädt nicht. Internet prüfen.'; });

  /* Eine Hauptaktion: erst „Prüfen“, nach grünen Tests „Weiter“ (der Knopf des Kapitels, falls es ihn hier gibt). */
  const weiter = RV ? null : document.querySelector('#main #nextStep'), weiterWar = !!weiter && weiter.classList.contains('primary');
  const hauptknopf = () => { $('#runTests').classList.toggle('primary', !geloest()); if (weiter) weiter.classList.toggle('primary', geloest()); };
  hauptknopf();

  /* Hilfe-Leiter: Tipp 1 … n, dann die Lösung mit Lücken, dann die ganze Lösung. Jede Sprosse bleibt stehen.
     Tipps zählen in der Wiederholung als „mit Hilfe“. Die ganze Lösung vor dem Lösen kostet XP (15 statt 50) und gilt in der Wiederholung als nicht gewusst. */
  const tipps = ex.hints || [], luecken = fadeSolution(ex.solution, ex.starter);
  const SPROSSEN = tipps.map(() => 'tipp').concat(luecken.includes('____') ? ['luecken'] : [], ['loesung']);
  let sprosse = 0, loesungDa = false;
  const leiter = () => {
    const b = $('#hintBtn'), art = SPROSSEN[sprosse];
    b.hidden = loesungDa; b.disabled = false;
    b.textContent = geloest() ? 'Musterlösung zeigen' : art === 'tipp' ? (sprosse ? 'Tipp ' + (sprosse + 1) + ' von ' + tipps.length : 'Tipp') : art === 'luecken' ? 'Lösung mit Lücken zeigen' : 'Ganze Lösung zeigen';
  };
  const loesungZeigen = () => {
    if (!geloest()) { if (RV) RV.sol = true; else { const es = S.ex[ex.id] || { passed: false, fails: 0 }; es.usedSolution = true; S.ex[ex.id] = es; save(); } }
    const b = $('#solBox'); b.hidden = false;
    b.innerHTML = '<p class="q-label">Lösung, Zeile für Zeile</p>' + annotated(ex.solution, ex.notes) + '<p class="muted small">Nicht kopieren. Selbst abtippen, dann bleibt es hängen.</p>';
    wireAnno(b); loesungDa = true; leiter(); b.focus({ preventScroll: true }); b.scrollIntoView({ behavior: bewegungAn() ? 'smooth' : 'auto', block: 'nearest' });
  };
  $('#hintBtn').onclick = () => {
    const art = SPROSSEN[sprosse];
    if (geloest()) return loesungZeigen();
    if (art === 'loesung') { $('#hintBtn').disabled = true; return ubRueckfrage($('#ubFrage'), 'Erst selbst probieren bringt mehr. Trotzdem zeigen?', 'Trotzdem zeigen', 'Weiter probieren', loesungZeigen, () => { leiter(); $('#hintBtn').focus({ preventScroll: true }); }); }
    if (art === 'tipp') $('#hints').insertAdjacentHTML('beforeend', '<div class="hint"><b>Tipp ' + (sprosse + 1) + '</b> ' + tipps[sprosse] + '</div>');
    else { const b = $('#solBox'); b.hidden = false; b.innerHTML = '<p class="q-label">Lösung mit Lücken</p><pre class="code"><code>' + esc(luecken) + '</code></pre><p class="muted small">Füll die ____ selbst.</p>'; highlightIn(b); b.scrollIntoView({ behavior: bewegungAn() ? 'smooth' : 'auto', block: 'nearest' }); }
    sprosse++; leiter();
  };
  leiter();

  /* Hängt es? Nach roten Prüfungen bietet die App von sich aus Hilfe an. Wann, richtet sich nach dem Vorwissen aus dem Einstieg
     (neu: ab dem 1., etwas HTML/JS: ab dem 2., kennt ein Framework: ab dem 3. Fehlversuch) und kommt einen Versuch früher,
     wenn das Thema bei dir schon wackelt (staerken.js). Mit KI sagt Toni gleich hier, was an deinem Code fehlt. */
  const schubs = fails => {
    const host = $('#ubSchubs'); if (!host) return;
    if (geloest() || !fails) { host.replaceChildren(); return; }
    const lv = S.ich && S.ich.level, wackelt = ch && ch.id && (themaVon(ch.id) || {}).stand === 'wackelt';
    if (fails < Math.max(1, ([1, 2, 3][lv] || 2) - (wackelt ? 1 : 0))) return;
    const tippDa = !loesungDa && SPROSSEN[sprosse] === 'tipp', ki = !!aiCfg().key;
    if (!tippDa && !ki) { host.replaceChildren(); return; }
    host.innerHTML = '<div class="ub-schubs"><p>' + (ki ? 'Hängt es? Toni schaut sich deinen Code an und sagt dir, was noch fehlt.' : 'Hängt es? Ein Tipp zeigt dir den nächsten Schritt.') + '</p><div class="dlg-row">' +
      (ki ? '<button class="btn" id="ubToniFrag" type="button">Toni, was fehlt?</button>' : '') + (tippDa ? '<button class="' + (ki ? 'linkbtn' : 'btn') + '" id="ubTipp" type="button">' + (sprosse ? 'Nächsten Tipp ansehen' : 'Tipp ansehen') + '</button>' : '') +
      '</div><div class="ub-toni" id="ubToniOut" hidden></div></div>';
    const tb = $('#ubTipp', host); if (tb) tb.onclick = () => { $('#hintBtn').click(); host.replaceChildren(); };
    const kb = $('#ubToniFrag', host);
    if (kb) kb.onclick = async () => {
      kb.disabled = true; lerneSignal('hilfe');
      const frage = TONI + '\n\n' + (currentExercise ? currentExercise.kontext() : '') + '\n\nEr hat gerade auf „Prüfen“ gedrückt, und es ist noch rot. Schau dir seinen Code genau an. Antwort max. 100 Wörter: welche Zeile, was dort falsch ist oder fehlt, warum, und der nächste kleine Schritt.';
      await toniStream(frage, $('#ubToniOut', host));
      kb.disabled = false; kb.textContent = 'Nochmal fragen';
    };
  };

  const sandbox = document.createElement('div'); sandbox.className = 'sandbox'; sandbox.setAttribute('aria-hidden', 'true'); document.body.appendChild(sandbox);
  let laeuft = false;
  async function check() {
    if (laeuft) return lastResults;
    laeuft = true;
    const btn = $('#runTests'); btn.disabled = true; btn.textContent = 'Prüfe…';
    try {
      await loadTS();
      const res = await runTests(getCode(), alleTests, sandbox, ex.backend ? BACKENDS[ex.backend] : null, ex.modules);
      if (!btn.isConnected) return res; /* Seite inzwischen verlassen */
      lastResults = res;
      const box = $('#tests');
      if (res.fatal) box.innerHTML = `<div class="test fatal"><span class="ic">!</span><span><b>Code läuft noch nicht.</b><br>${esc(res.fatal).replace(/\n/g, '<br>')}</span></div>` + alleTests.map(offen).join('');
      else box.innerHTML = res.results.map(r => `<div class="test ${r.ok ? 'ok' : 'bad'}"><span class="ic">${r.ok ? '✓' : '✗'}</span><span>${esc(r.name)}${r.ok ? '' : '<br><small>' + esc(r.msg) + '</small>'}</span></div>`).join('');
      const allOk = !res.fatal && res.results.every(r => r.ok);
      if (RV) {
        if (allOk && !RV.passed) { RV.passed = true; celebrate(); box.insertAdjacentHTML('afterbegin', '<div class="pass">Geschafft! Aus dem Kopf. Das sitzt.</div>'); RV.hints = Math.min(sprosse, tipps.length) || (sprosse ? 1 : 0); opt.onPass(RV); } /* auch die Lösung mit Lücken ist Hilfe */
        else if (!allOk) RV.fails++;
        schubs(RV.fails);
      } else {
        const es = S.ex[ex.id] || { passed: false, fails: 0 };
        if (allOk) {
          if (!es.passed) { es.passed = true; S.ex[ex.id] = es; addXp(es.usedSolution ? 15 : 50, es.usedSolution ? 'Gelöst mit Lösung' : 'Übung gelöst'); celebrate(); }
          if (opt && opt.onSolved) opt.onSolved();
          /* Kapitel war nur angeschaut: Jetzt ist es geschafft (kapitel.js) */
          kapitelNachholen(ch);
          box.insertAdjacentHTML('afterbegin', '<div class="pass">Geschafft. Alle Tests grün.</div>');
        } else { es.fails = (es.fails || 0) + 1; S.ex[ex.id] = es; save(); }
        schubs(allOk ? 0 : es.fails);
      }
      /* Gelöst: Die offene Rückfrage „Trotzdem zeigen?“ hat sich erledigt, der Knopf bietet jetzt die Musterlösung an. */
      if (geloest()) { $('#prBtn').hidden = false; hauptknopf(); $('#ubFrage').replaceChildren(); if (!loesungDa) leiter(); }
    } catch (e) { if (btn.isConnected) toast('Prüfen ging schief: ' + e.message); }
    finally { laeuft = false; btn.disabled = false; btn.textContent = 'Prüfen'; }
    return lastResults;
  }
  $('#runTests').onclick = check;
  $('#resetCode').onclick = () => {
    if (getCode() === ex.starter) { toast('Das ist schon der Startcode.'); return; }
    const r = $('#resetCode'); r.hidden = true;
    ubRueckfrage($('#ubNeu'), 'Deinen Code verwerfen?', 'Ja, neu anfangen', 'Abbrechen', () => { setCode(ex.starter); r.hidden = false; r.focus({ preventScroll: true }); }, () => { r.hidden = false; r.focus({ preventScroll: true }); });
  };

  /* Pull Request an Toni: Review mit Zeilenkommentaren (siehe pr-review.js). Erst zu sehen, wenn die Tests einmal grün waren. */
  let prMarken = [], prThema = false;
  const markierenAus = () => { if (cm) prMarken.forEach(l => ['must', 'nit', 'frage', 'lob'].forEach(a => cm.removeLineClass(l, 'background', 'rv-' + a))); prMarken = []; };
  const prCtx = {
    ex, ch, box: $('#prBox'), btn: $('#prBtn'), getCode,
    testen: () => check(),
    stand: () => RV ? (RV.prSt = RV.prSt || {}) : (S.ex[ex.id] = S.ex[ex.id] || { passed: false, fails: 0 }),
    speichern: () => { if (!RV) save(); },
    belohnen: () => { if (!RV) addXp(20, 'Pull Request approved'); },
    springe: z => {
      $('#editor').scrollIntoView({ behavior: bewegungAn() ? 'smooth' : 'auto', block: 'center' });
      if (cm) { const l = Math.max(0, Math.min(cm.lineCount() - 1, z - 1)); cm.focus(); cm.setCursor({ line: l, ch: cm.getLine(l).length }); cm.scrollIntoView({ line: l, ch: 0 }, 120); cm.addLineClass(l, 'wrap', 'rv-blink'); setTimeout(() => cm.removeLineClass(l, 'wrap', 'rv-blink'), 1400); }
      else { const pos = ta.value.split('\n').slice(0, z - 1).join('\n').length + (z > 1 ? 1 : 0); ta.focus(); ta.setSelectionRange(pos, pos); }
    },
    markieren: ks => { markierenAus(); if (!cm) return; ks.forEach(k => { if (k.zeile && k.zeile <= cm.lineCount()) { cm.addLineClass(k.zeile - 1, 'background', 'rv-' + k.art); prMarken.push(k.zeile - 1); } }); },
    markierenAus,
    /* „Toni antworten“: im einen Chat. Toni bekommt die Review dort als Kontext mit. */
    antworten: () => { prThema = true; toniOeffnen(); }
  };
  if (cm) cm.on('change', () => { if (prMarken.length) markierenAus(); });
  $('#prBtn').onclick = () => prEinreichen(prCtx);

  /* Die offene Übung. Der Chat (chat.js) holt sich hier, was Toni sehen soll: Aufgabe, Code von jetzt, Stand der Tests. */
  const failText = () => lastResults ? (lastResults.fatal ? 'Fehler: ' + lastResults.fatal : lastResults.results.filter(r => !r.ok).map(r => '- ' + r.name + ': ' + r.msg).join('\n') || 'Alle Tests grün.') : 'Noch nicht geprüft.';
  currentExercise = {
    ex, ch,
    /* Wo steht er? 'review': Er redet über die Review zu genau diesem Code. 'geloest': gelöst und nichts rot. Sonst 'offen'. */
    stand() {
      const pr = prThema && prCtx.stand().pr, rot = lastResults && (lastResults.fatal || lastResults.results.some(r => !r.ok));
      return pr && pr.code === getCode() ? 'review' : geloest() && !rot ? 'geloest' : 'offen';
    },
    kontext() {
      const pr = prThema && prCtx.stand().pr;
      return 'Der Lernende arbeitet gerade an der Übung „' + ex.title + '“' + (ch && ch.title ? ' (Kapitel „' + ch.title + '“)' : '') + '.\nAufgabe: ' + stripHtml(ex.goal + ' ' + ex.todo.join(' | ')) +
        '\nSein Code jetzt:\n```ts\n' + getCode() + '\n```\nTests:\n' + failText() +
        (pr ? '\nDu hast seinen Pull Request reviewt (Urteil: ' + pr.urteil + '). Deine Kommentare:\n' + pr.kommentare.map(k => '- Zeile ' + k.zeile + ' [' + k.art + ']: ' + k.text).join('\n') + '\nEr will über die Review reden: Geh auf seine Rückfragen und Einwände ein.' : '') +
        (geloest() ? '\nDie Übung ist gelöst. Du darfst seinen Code offen besprechen.' : '\nEr soll selbst auf die Lösung kommen: Sag, was genau noch fehlt oder falsch ist (welche Zeile), WARUM, und den nächsten kleinen Schritt. KEINE komplette Lösung, höchstens ein Schnipsel mit Lücke.');
    },
    dispose() { sandbox.remove(); if (previewNg) previewNg.fixtures.forEach(f => { try { f.destroy(); } catch (e) {} }); clearTimeout(prevT); if (weiter) weiter.classList.toggle('primary', weiterWar); }
  };
}
/* Grundlook der Live-Vorschau. Alles in :where(), also ohne Gewicht: Die styles der eigenen Komponente
   (Angular hängt sie mit in die Vorschau) gewinnen immer, auch bei h1, button oder input. */
function previewStyle() {
  const s = document.createElement('style');
  s.textContent = `:host{display:block} .pv{color-scheme:light;font:15px/1.5 "Atkinson Hyperlegible",system-ui,sans-serif;color:#13201A;padding:14px 16px;min-height:60px}
  :where(.pv) :where(h1,h2,h3){margin:.2em 0 .3em;line-height:1.25}
  :where(.pv) :where(button){font:inherit;padding:6px 12px;border-radius:8px;border:1px solid #BFD3C7;background:#EEF5F0;color:#13201A;cursor:pointer;margin:2px 4px 2px 0}
  :where(.pv) :where(button:disabled){opacity:.45;cursor:not-allowed} :where(.pv) :where(input,select,textarea){font:inherit;color:#13201A;background:#fff;padding:6px 10px;border:1px solid #BFD3C7;border-radius:8px}
  :where(.pv) :where(ul){padding-left:20px;margin:.3em 0}
  :where(.pv) :where(app-entwickler-karte){display:block;border:1px dashed #BFD3C7;border-radius:10px;padding:4px 10px;margin:6px 0}
  .pv-msg{color:#56665D;font:14px/1.5 system-ui;margin:0} .pv-msg.err{color:#B3261E;white-space:pre-wrap;font:13px/1.5 "JetBrains Mono",monospace}`;
  return s;
}
function celebrate() { jubelGross('Alle Tests grün!', 'Dein Code macht genau, was das Ticket will.'); }
