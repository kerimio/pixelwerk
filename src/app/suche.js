/* ================= THEMENSUCHE =================
   Sucht in allen Kapiteln (auch eigenen): Titel, Stichworte, Ticket, Folien (Titel, Text, Code), Quiz, Merksätze.
   Treffer springen direkt zur passenden Folie. Nichts gefunden? Toni schreibt ein Kapitel dazu. */
const sucheFold = s => String(s || '').replace(/<[^>]+>/g, ' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
const sucheKlar = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function sucheFelder(ch) {
  const f = [
    { w: 10, text: ch.title, wo: null },
    { w: 8, text: ch.tag, wo: null },
    { w: 4, text: ch.ticket ? ch.ticket.titel + ' ' + ch.ticket.text : '', wo: { t: 'story' }, label: 'Ticket' }
  ];
  (ch.slides || []).forEach((s, i) => {
    f.push({ w: 6, text: s.t, wo: { t: 'slide', i }, label: 'Folie: ' + s.t });
    f.push({ w: 2, text: [s.say, s.job, s.pro, (s.punkte || []).map(p => p[0] + ' ' + p[1]).join(' '), (s.notes || []).map(n => n[1]).join(' ')].join(' '), wo: { t: 'slide', i }, label: 'Folie: ' + s.t });
    if (s.code) f.push({ w: 2, text: s.code, wo: { t: 'slide', i }, label: 'Code auf Folie: ' + s.t });
  });
  (ch.quiz || []).forEach((q, i) => f.push({ w: 1, text: q.q + ' ' + q.options.join(' ') + ' ' + q.why, wo: { t: 'quiz', i }, label: 'Quizfrage' }));
  if (ch.ex) f.push({ w: 3, text: ch.ex.title + ' ' + ch.ex.goal, wo: { t: 'code' }, label: 'Übung: ' + ch.ex.title });
  (ch.merke || []).forEach(m => f.push({ w: 2, text: m, wo: { t: 'end' }, label: 'Merksatz' }));
  return f;
}

function sucheAusfuehren(q) {
  const woerter = sucheFold(q).split(/[\s,]+/).filter(w => w.length >= 2);
  if (!woerter.length) return [];
  const out = [];
  CH.forEach(ch => {
    const felder = sucheFelder(ch).map(f => Object.assign({ fold: sucheFold(f.text) }, f));
    if (!woerter.every(w => felder.some(f => f.fold.includes(w)))) return;
    let score = 0, best = null, bestW = -1;
    felder.forEach(f => {
      const n = woerter.filter(w => f.fold.includes(w)).length; if (!n) return;
      score += n * f.w + (woerter.length > 1 && n === woerter.length ? f.w : 0);
      if (f.wo && n * f.w > bestW) { bestW = n * f.w; best = f; }
    });
    if (sucheFold(ch.title).includes(woerter.join(' '))) score += 20;
    out.push({ ch, score, best });
  });
  return out.sort((a, b) => b.score - a.score).slice(0, 25).map(r => Object.assign(r, { schnipsel: r.best ? sucheSchnipsel(r.best.text, woerter) : '' }));
}

function sucheSchnipsel(text, woerter) {
  const klar = sucheKlar(text), fold = sucheFold(klar);
  let at = -1; woerter.some(w => (at = fold.indexOf(w)) >= 0);
  if (at < 0) return '';
  const a = Math.max(0, at - 50), b = Math.min(klar.length, at + 90);
  let h = esc((a ? '…' : '') + klar.slice(a, b) + (b < klar.length ? '…' : ''));
  woerter.forEach(w => { if (w.length < 2) return; h = h.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
  return h;
}

function sucheRender(q) {
  const box = $('#sucheErg'); if (!box) return;
  const qq = q.trim();
  if (!qq) { box.innerHTML = '<p class="muted small">Tipp: mehrere Wörter grenzen ein, z. B. „formular validator“. Taste <kbd>/</kbd> öffnet die Suche überall.</p>'; return; }
  const res = sucheAusfuehren(qq);
  const wunsch = '<div class="su-wunsch"><span>' + (res.length ? 'Nicht das Richtige?' : 'Dazu gibt es noch kein Kapitel.') + '</span> <button class="btn" type="button" id="sucheKapitel">📘 Toni schreibt ein Kapitel zu „' + esc(qq) + '“</button></div>';
  box.innerHTML = (res.length ? '<p class="muted small">' + res.length + (res.length === 25 ? '+' : '') + ' Treffer</p><ul class="su-list">' + res.map((r, k) => {
    const a = AKTE.find(x => x.n === r.ch.akt) || {};
    const wo = r.best && r.best.label ? '<span class="su-wo">→ ' + esc(r.best.label) + '</span>' : '';
    return '<li><a href="#' + r.ch.id + '" data-k="' + k + '"><span class="su-t">' + esc(r.ch.title) + (S.done[r.ch.id] ? ' <span class="su-ok">✓</span>' : '') + '</span><span class="su-m">' + esc(a.title || '') + ' · ' + esc(r.ch.tag) + '</span>' + (r.schnipsel ? '<span class="su-s">' + r.schnipsel + '</span>' : '') + wo + '</a></li>';
  }).join('') + '</ul>' : '') + wunsch;
  box.querySelectorAll('.su-list a').forEach(el => el.onclick = ev => {
    ev.preventDefault(); const r = res[+el.dataset.k];
    window.sprungZu = r.best && r.best.wo ? Object.assign({ id: r.ch.id }, r.best.wo) : null;
    $('#sucheDlg').close();
    if (location.hash.slice(1) === r.ch.id) route(); else location.hash = r.ch.id;
  });
  $('#sucheKapitel').onclick = () => { $('#sucheDlg').close(); toniOeffnen(); kapitelErstellen(qq); };
}

function sucheOeffnen() {
  const d = $('#sucheDlg'); if (!d || d.open) return;
  d.showModal(); const i = $('#sucheIn'); i.select(); sucheRender(i.value);
}

(function sucheSetup() {
  const go = () => {
    const btn = $('#sucheBtn'), inp = $('#sucheIn'), d = $('#sucheDlg'); if (!btn || !inp) return;
    btn.onclick = sucheOeffnen;
    $('#sucheClose').onclick = () => d.close();
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    let t; inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => sucheRender(inp.value), 120); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { const a = $('#sucheErg .su-list a'); if (a) { e.preventDefault(); a.click(); } } });
    document.addEventListener('keydown', e => {
      if (e.key !== '/' || e.altKey || e.ctrlKey || e.metaKey) return;
      const tg = e.target; if (tg && tg.closest && (tg.closest('input, textarea, select, .CodeMirror, [contenteditable]') || document.querySelector('dialog[open]'))) return;
      e.preventDefault(); sucheOeffnen();
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
