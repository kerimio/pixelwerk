/* ===== Code-Anzeige: Hervorhebung, nummerierte Erklärungen, Karte am unterstrichenen Wort ===== */
function highlightIn(root) {
  if (!window.CodeMirror || !CodeMirror.runMode) return;
  root.querySelectorAll('pre.code:not(.acode) code:not(.hl)').forEach(c => { const txt = c.textContent; c.textContent = ''; c.classList.add('hl', 'cm-s-ngq'); CodeMirror.runMode(txt, 'text/typescript', c); });
}
function tokensByLine(src) {
  const lines = [[]];
  const push = (text, style) => { const h = style ? '<span class="cm-' + style.split(' ').join(' cm-') + '">' + esc(text) + '</span>' : esc(text); lines[lines.length - 1].push(h); };
  if (window.CodeMirror && CodeMirror.runMode) CodeMirror.runMode(src, 'text/typescript', (text, style) => { if (text === '\n') lines.push([]); else push(text, style); });
  else src.split('\n').forEach((l, i) => { if (i) lines.push([]); push(l); });
  return lines.map(l => l.join(''));
}
/* Erklärungen sind Paare [Ausschnitt aus einer Codezeile, Text]. Liefert je Erklärung die Zeile, an der ihre Nummer steht (oder -1).
   Gesucht wird von oben nach unten, damit gleiche Ausschnitte nacheinander auf verschiedene Zeilen fallen. */
function cpNoteLines(raw, notes) {
  const taken = {}; let from = 0;
  return (notes || []).map(n => {
    const has = i => raw[i].includes(n[0]);
    let idx = raw.findIndex((l, i) => i >= from && has(i) && !taken[i]);
    if (idx < 0) idx = raw.findIndex((l, i) => i >= from && has(i));
    if (idx < 0) idx = raw.findIndex((l, i) => has(i));
    if (idx >= 0) { taken[idx] = true; from = idx; }
    return idx;
  });
}
/* Code mit nummerierten Erklärungen pro Zeile */
function annotated(src, notes) {
  const raw = src.split('\n'); const html = tokensByLine(src);
  const at = {};
  cpNoteLines(raw, notes).forEach((idx, k) => { if (idx >= 0) (at[idx] = at[idx] || []).push(k + 1); });
  const code = raw.map((_, i) => `<span class="cl${at[i] ? ' has' : ''}" data-n="${at[i] ? at[i].join(' ') : ''}"><span class="fine">${at[i] ? at[i].map(n => '<i>' + n + '</i>').join('') : ''}</span><span class="ct">${html[i] || '&#8203;'}</span></span>`).join('');
  const list = (notes || []).map((n, k) => `<li data-n="${k + 1}"><span class="nb">${k + 1}</span><span>${esc(n[1])}</span></li>`).join('');
  const maxB = Math.max(1, ...Object.values(at).map(x => x.length));
  return `<div class="anno"><pre class="code acode cm-s-ngq" style="--gw:${maxB > 1 ? maxB * 20 + 10 : 34}px"><code>${code}</code></pre>${list ? `<ol class="notes">${list}</ol>` : ''}</div>`;
}
/* Link zur offiziellen Doku: nur https, immer in neuem Tab */
function cpDocsLink(url, text) {
  return /^https:\/\//.test(url || '') ? `<a class="cp-docs" href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}<span aria-hidden="true">↗</span><span class="sr-only"> (neuer Tab)</span></a>` : '';
}
/* ---------- Unterstrichene Wörter: Lexikon-Begriffe und HTML-Tags ---------- */
function lexWrapLine(el) {
  const text = el.textContent; const ranges = [];
  LEX_G.forEach((re, i) => { re.lastIndex = 0; let m; while ((m = re.exec(text))) { const w = m[1] != null ? m[1] : m[0]; const s = m.index + m[0].indexOf(w); if (w) ranges.push([s, s + w.length, i]); if (re.lastIndex === m.index) re.lastIndex++; } });
  ranges.sort((a, b) => a[0] - b[0] || (b[1] - b[0]) - (a[1] - a[0]));
  const keep = []; let end = -1; ranges.forEach(r => { if (r[0] >= end) { keep.push(r); end = r[1]; } });
  keep.reverse().forEach(([s, e, i]) => {
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let pos = 0, n; const parts = [];
    while ((n = tw.nextNode())) { const a = pos, b = pos + n.length; pos = b; if (b <= s || a >= e) continue; parts.push([n, Math.max(s, a) - a, Math.min(e, b) - a]); }
    parts.reverse().forEach(([node, from, to]) => {
      if (node.parentNode && node.parentNode.classList && node.parentNode.classList.contains('lx')) return;
      let mid = node; if (from > 0) mid = node.splitText(from); if (to - from < mid.length) mid.splitText(to - from);
      const w = document.createElement('span'); w.className = 'lx ' + WHO[LEX[i].who].cls; w.dataset.lx = i; w.tabIndex = -1; w.setAttribute('role', 'button');
      mid.parentNode.insertBefore(w, mid); w.appendChild(mid);
    });
  });
}
/* Karte zu einem Begriff: Was, Woher, Warum und, wenn vorhanden, der Link zur Doku */
function lexCard(i) {
  const e = LEX[i], w = WHO[e.who];
  return `<div class="lexcard"><div class="lc-h"><code class="lc-k">${esc(e.k)}</code><span class="who ${w.cls}" title="${esc(w.info)}">${w.name}</span></div>
    <dl><dt>Was?</dt><dd>${esc(e.what)}</dd><dt>Woher?</dt><dd>${esc(e.whence)}</dd><dt>Warum?</dt><dd>${esc(e.reasonWhy)}</dd></dl>${cpDocsLink(e.docs, 'Offizielle Doku')}</div>`;
}
/* Karte zu einem HTML-Tag: was es ist und wie Angular daran andockt. Attribute und Events sind eingeklappt. */
function htmlCard(tag, i) {
  const e = HTML_EL[HTML_TAG[tag]];
  const dl = (t, rows) => rows && rows.length ? `<h5>${t}</h5><dl class="el-dl">${rows.map(([k, v]) => `<dt><code>${esc(k)}</code></dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '';
  const more = dl('Attribute', e.attrs) + dl('Events', e.events);
  return `<div class="lexcard"><div class="lc-h"><code class="lc-k">&lt;${esc(tag)}&gt;</code><span class="who ${WHO.WEB.cls}">${esc(e.name)}</span></div>
    <p class="el-what">${esc(e.what)}</p>${dl('In Angular', e.ng)}
    ${more ? `<details class="el-more"><summary>Attribute und Events</summary>${more}</details>` : ''}
    ${e.job ? `<p class="el-job">💼 ${esc(e.job)}</p>` : ''}${cpDocsLink(e.docs || LEX[i].docs, 'Offizielle Doku')}</div>`;
}
let lexPop = null, lexFrom = null;
/* Karte schließen. zurueck: Fokus wieder auf das Wort, von dem sie kam. */
function lexClose(stepBack) {
  if (!lexPop || lexPop.hidden) return;
  lexPop.hidden = true;
  if (stepBack && lexFrom && lexFrom.isConnected) lexFrom.focus();
}
/* Karte am Wort öffnen. tast: per Tastatur geöffnet, dann springt der Fokus in die Karte. */
function lexShow(el, keyPress) {
  if (!lexPop) {
    lexPop = document.createElement('div'); lexPop.className = 'lexpop'; lexPop.setAttribute('role', 'dialog'); lexPop.setAttribute('aria-label', 'Erklärung zum Begriff'); document.body.appendChild(lexPop);
    document.addEventListener('click', ev => { if (!lexPop.contains(ev.target) && !ev.target.closest('.lx')) lexClose(); });
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') lexClose(lexPop.contains(document.activeElement)); });
    window.addEventListener('hashchange', () => lexClose());
  }
  const i = +el.dataset.lx, tag = LEX[i].html ? el.textContent.trim() : '';
  lexPop.innerHTML = '<button class="lp-x" type="button" aria-label="Schließen">×</button>' + (tag in HTML_TAG ? htmlCard(tag, i) : lexCard(i));
  lexPop.hidden = false; lexFrom = el;
  lexPop.querySelector('.lp-x').onclick = () => lexClose(true);
  const r = el.getBoundingClientRect(), W = window.innerWidth;
  if (W <= 640) { lexPop.style.cssText = ''; lexPop.classList.add('sheet'); }
  else {
    lexPop.classList.remove('sheet');
    const pw = Math.min(380, W - 32); const left = Math.min(Math.max(16, r.left), W - pw - 16);
    lexPop.style.cssText = `width:${pw}px;left:${left}px;top:0`;
    const ph = lexPop.offsetHeight; let top = r.bottom + 8; if (top + ph > window.innerHeight - 12) top = Math.max(12, r.top - ph - 8);
    lexPop.style.top = top + 'px';
  }
  if (keyPress) lexPop.querySelector('.lp-x').focus();
}
document.addEventListener('click', ev => { const t = ev.target.closest('.lx'); if (t) lexShow(t); });
/* Tastatur: Der Code ist ein einziger Tab-Halt. Pfeiltasten wandern von Wort zu Wort, Enter oder Leertaste öffnet die Karte. */
function lexKeys(a) {
  a.querySelectorAll('.lx').forEach((w, k) => { w.tabIndex = k ? -1 : 0; });
  a.querySelector('.acode').addEventListener('keydown', ev => {
    const w = ev.target.closest('.lx'); if (!w) return;
    const everyone = [...a.querySelectorAll('.lx')], d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
    if (d) { const z = everyone[everyone.indexOf(w) + d]; if (z) { w.tabIndex = -1; z.tabIndex = 0; z.focus(); lexClose(); } }
    else if (ev.key === 'Enter' || ev.key === ' ') lexShow(w, true);
    else return;
    ev.preventDefault(); ev.stopPropagation();
  });
}
function wireAnno(root) {
  root.querySelectorAll('.anno').forEach(a => {
    if (a.dataset.lexed) return; a.dataset.lexed = '1';
    /* Erklärung und Zeile leuchten gemeinsam auf */
    const hl = n => { const want = n ? String(n).split(' ') : []; a.querySelectorAll('[data-n]').forEach(e => e.classList.toggle('lit', want.some(w => w && e.dataset.n.split(' ').includes(w)))); };
    a.querySelectorAll('.notes li, .cl.has').forEach(e => { e.addEventListener('mouseenter', () => hl(e.dataset.n)); e.addEventListener('mouseleave', () => hl(null)); e.addEventListener('click', () => hl(e.dataset.n)); });
    a.querySelectorAll('.acode .ct').forEach(lexWrapLine);
    lexKeys(a);
  });
}
