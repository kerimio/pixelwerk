/* ================= THEMENSUCHE =================
   Sucht in allen Kapiteln (auch eigenen): Titel, Stichworte, Ticket, Folien (Titel, Text, Code), Quiz, Merksätze.
   Treffer springen direkt zur passenden Folie. Nichts gefunden? Toni schreibt ein Kapitel dazu. */
const searchFold = s => String(s || '').replace(/<[^>]+>/g, ' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
const searchClear = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function searchFields(ch) {
  const f = [
    { w: 10, text: ch.title, where: null },
    { w: 8, text: ch.tag, where: null },
    { w: 4, text: ch.ticket ? ch.ticket.heading + ' ' + ch.ticket.text : '', where: { t: 'story' }, label: 'Ticket' }
  ];
  (ch.slides || []).forEach((s, i) => {
    f.push({ w: 6, text: s.t, where: { t: 'slide', i }, label: 'Folie: ' + s.t });
    f.push({ w: 2, text: [s.say, s.job, s.pro, (s.points || []).map(p => p[0] + ' ' + p[1]).join(' '), (s.notes || []).map(n => n[1]).join(' ')].join(' '), where: { t: 'slide', i }, label: 'Folie: ' + s.t });
    if (s.code) f.push({ w: 2, text: s.code, where: { t: 'slide', i }, label: 'Code auf Folie: ' + s.t });
  });
  (ch.quiz || []).forEach((q, i) => f.push({ w: 1, text: q.q + ' ' + q.options.join(' ') + ' ' + q.why, where: { t: 'quiz', i }, label: 'Quizfrage' }));
  if (ch.ex) f.push({ w: 3, text: ch.ex.title + ' ' + ch.ex.goal, where: { t: 'code' }, label: 'Übung: ' + ch.ex.title });
  (ch.takeaway || []).forEach(m => f.push({ w: 2, text: m, where: { t: 'end' }, label: 'Merksatz' }));
  return f;
}

function searchRun(q) {
  const words = searchFold(q).split(/[\s,]+/).filter(w => w.length >= 2);
  if (!words.length) return [];
  const out = [];
  CH.forEach(ch => {
    const fields = searchFields(ch).map(f => Object.assign({ fold: searchFold(f.text) }, f));
    if (!words.every(w => fields.some(f => f.fold.includes(w)))) return;
    let score = 0, best = null, bestW = -1;
    fields.forEach(f => {
      const n = words.filter(w => f.fold.includes(w)).length; if (!n) return;
      score += n * f.w + (words.length > 1 && n === words.length ? f.w : 0);
      if (f.where && n * f.w > bestW) { bestW = n * f.w; best = f; }
    });
    if (searchFold(ch.title).includes(words.join(' '))) score += 20;
    out.push({ ch, score, best });
  });
  return out.sort((a, b) => b.score - a.score).slice(0, 25).map(r => Object.assign(r, { snippet: r.best ? searchSnippet(r.best.text, words) : '' }));
}

function searchSnippet(text, words) {
  const clean = searchClear(text), fold = searchFold(clean);
  let at = -1; words.some(w => (at = fold.indexOf(w)) >= 0);
  if (at < 0) return '';
  const a = Math.max(0, at - 50), b = Math.min(clean.length, at + 90);
  let h = esc((a ? '…' : '') + clean.slice(a, b) + (b < clean.length ? '…' : ''));
  words.forEach(w => { if (w.length < 2) return; h = h.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
  return h;
}

function searchRender(q) {
  const box = $('#searchRes'); if (!box) return;
  const qq = q.trim();
  if (!qq) { box.innerHTML = '<p class="muted small">Tipp: mehrere Wörter grenzen ein, z. B. „formular validator“. Taste <kbd>/</kbd> öffnet die Suche überall.</p>'; return; }
  const res = searchRun(qq);
  const wish = '<div class="search-wish"><span>' + (res.length ? 'Nicht das Richtige?' : 'Dazu gibt es noch kein Kapitel.') + '</span> <button class="btn" type="button" id="searchChapter">📘 Toni schreibt ein Kapitel zu „' + esc(qq) + '“</button></div>';
  box.innerHTML = (res.length ? '<p class="muted small">' + res.length + (res.length === 25 ? '+' : '') + ' Treffer</p><ul class="search-list">' + res.map((r, k) => {
    const a = ACTS.find(x => x.n === r.ch.act) || {};
    const where = r.best && r.best.label ? '<span class="search-where">→ ' + esc(r.best.label) + '</span>' : '';
    return '<li><a href="#' + r.ch.id + '" data-k="' + k + '"><span class="search-t">' + esc(r.ch.title) + (S.done[r.ch.id] ? ' <span class="search-ok">✓</span>' : '') + '</span><span class="search-m">' + esc(a.title || '') + ' · ' + esc(r.ch.tag) + '</span>' + (r.snippet ? '<span class="search-s">' + r.snippet + '</span>' : '') + where + '</a></li>';
  }).join('') + '</ul>' : '') + wish;
  box.querySelectorAll('.search-list a').forEach(el => el.onclick = ev => {
    ev.preventDefault(); const r = res[+el.dataset.k];
    window.jumpTo = r.best && r.best.where ? Object.assign({ id: r.ch.id }, r.best.where) : null;
    $('#searchDlg').close();
    if (location.hash.slice(1) === r.ch.id) route(); else location.hash = r.ch.id;
  });
  $('#searchChapter').onclick = () => { $('#searchDlg').close(); toniOpen(); chapterCreate(qq); };
}

function searchOpen() {
  const d = $('#searchDlg'); if (!d || d.open) return;
  d.showModal(); const i = $('#searchIn'); i.select(); searchRender(i.value);
}

(function searchSetup() {
  const go = () => {
    const btn = $('#searchBtn'), inp = $('#searchIn'), d = $('#searchDlg'); if (!btn || !inp) return;
    btn.onclick = searchOpen;
    $('#searchClose').onclick = () => d.close();
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    let t; inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => searchRender(inp.value), 120); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { const a = $('#searchRes .search-list a'); if (a) { e.preventDefault(); a.click(); } } });
    document.addEventListener('keydown', e => {
      if (e.key !== '/' || e.altKey || e.ctrlKey || e.metaKey) return;
      const tg = e.target; if (tg && tg.closest && (tg.closest('input, textarea, select, .CodeMirror, [contenteditable]') || document.querySelector('dialog[open]'))) return;
      e.preventDefault(); searchOpen();
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
