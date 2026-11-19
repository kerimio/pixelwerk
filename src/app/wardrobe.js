/* ================= GARDEROBE: Sachen für den Avatar =================
   Wer Kapitel abschließt, gewinnt Sachen für seinen Pixel-Avatar: Kopf (Mützen, Helm, Krone), Gesicht (Brillen, Bart),
   Dazu (Tasse, Krawatte, Ente, Rakete) und Hintergrund. Jede Sache ist ein kleines Pixelbild im 10 × 10-Raster (beim Zeichnen verdoppelt auf das 20 × 20 des Avatars)
   wie der Avatar und liegt beim Zeichnen über (oder beim Hintergrund unter) den eigenen Pixeln.
   Gespeichert im Spielstand: S.wardrobe (was du schon gewonnen hast), S.wardrobeNew (noch nicht angesehen) und
   S.player.outfit (was du gerade trägst, eine Sache je Platz). Damit wandert alles mit progress.json und dem Export.
   Neue Sachen: unten in ITEMS eintragen. Die id nie umbenennen, sie steht im Spielstand. */
var ITEM_SLOTS = [
  { id: 'kopf', n: 'Kopf' },
  { id: 'gesicht', n: 'Gesicht' },
  { id: 'dazu', n: 'Dazu' },
  { id: 'grund', n: 'Hintergrund' }
];
/* Wie viele Kapitel (ohne eigene) geschafft sind. Gesamt zählt optionale Grundlagen nicht mit (base.js, chapterOptional). */
const chapterDone = () => CH.filter(c => c.act !== 'E' && S.done[c.id]).length;
const chapterTotal = () => CH.filter(c => c.act !== 'E' && !chapterOptional(c)).length;
/* Name einer Phase für die Bedingung, z. B. „Erste Woche“ */
const phaseTitle = n => { const a = ACTS.find(x => x.n === n); return a ? a.title : ''; };
const afterPhase = n => ({ phase: n, ok: () => phaseDone(n), how: () => 'Schließ die Phase „' + phaseTitle(n) + '“ ab.' });
const afterChapters = k => ({ ok: () => chapterDone() >= k, how: () => k === 1 ? 'Schließ dein erstes Kapitel ab.' : 'Schließ ' + k + ' Kapitel ab.' });

/* px: zehn Zeilen mit je zehn Zeichen. '.' bleibt durchsichtig, jeder andere Buchstabe steht für eine Farbe aus f.
   Kürzere Listen fangen oben an (y gibt die erste Zeile an). */
var ITEMS = [
  /* ---------- Kopf ---------- */
  Object.assign({ id: 'cap', slot: 'kopf', n: 'Basecap', unlocked: true, f: { a: '#2453C9', b: '#163A94', w: '#FFFFFF' },
    px: ['..aaaaaa..', '.aaaawaaa.', '.bbbbbbbbb'] }),
  Object.assign({ id: 'muetze', slot: 'kopf', n: 'Pixelwerk-Mütze', f: { m: '#D6455D', k: '#A8304A', p: '#FFFFFF' },
    px: ['....pp....', '..mmmmmm..', '.mmmmmmmm.', '.kkkkkkkk.'] }, afterPhase(1)),
  Object.assign({ id: 'kopfhoerer', slot: 'kopf', n: 'Kopfhörer', f: { k: '#1A2320', h: '#2E9E63', g: '#8C979E' },
    px: ['..kkkkkk..', '.k......k.', 'k........k', 'hh......hh', 'hh......hh', 'g........g'] }, afterPhase('W')),
  Object.assign({ id: 'helm', slot: 'kopf', n: 'Bauhelm', f: { y: '#F5B700', d: '#C98F00', w: '#FFF3C4' },
    px: ['...yyyy...', '..ywyyyy..', '.yyyyyyyy.', 'dddddddddd'] }, afterPhase(6)),
  Object.assign({ id: 'krone', slot: 'kopf', n: 'Krone', f: { y: '#F5B700', d: '#C98F00', r: '#D6455D', b: '#2453C9' },
    px: ['.y..yy..y.', '.yy.yy.yy.', '.yryybyry.', '.dddddddd.'],
    ok: () => CH.every(c => c.act === 'E' || chapterOptional(c) || S.done[c.id]), how: () => 'Schließ alle ' + chapterTotal() + ' Kapitel ab.' }),
  /* ---------- Gesicht ---------- */
  Object.assign({ id: 'nerdbrille', slot: 'gesicht', n: 'Nerdbrille', f: { k: '#D6455D' }, y: 3,
    px: ['..kk.kkk..', '.k..k...k.', '..kk.kkk..'] }, afterPhase(0)),
  Object.assign({ id: 'sonnenbrille', slot: 'gesicht', n: 'Sonnenbrille', f: { k: '#1A2320', w: '#8C979E' }, y: 4,
    px: ['kkwkkkkwkk', '.kkk..kkk.'] }, afterPhase(2)),
  Object.assign({ id: 'bart', slot: 'gesicht', n: 'Schnurrbart', f: { b: '#5B3A1E' }, y: 5,
    px: ['...bbbb...', '.bb....bb.'] }, afterChapters(10)),
  /* ---------- Dazu ---------- */
  Object.assign({ id: 'tasse', slot: 'dazu', n: 'Kaffeetasse', f: { r: '#D6455D', w: '#FFFFFF', g: '#8C979E' }, y: 6,
    px: ['.g.g......', 'rrr.......', 'rwrr......', 'rrr.......'] }, afterChapters(1)),
  Object.assign({ id: 'krawatte', slot: 'dazu', n: 'Krawatte', f: { r: '#D6455D', d: '#A8304A', w: '#FFFFFF' }, y: 7,
    px: ['...wrrw...', '....rr....', '...rddr...'] }, afterPhase(4)),
  Object.assign({ id: 'ente', slot: 'dazu', n: 'Quietscheente', f: { y: '#F5B700', o: '#F08A00', k: '#1A2320' }, y: 6,
    px: ['.......yy.', '.......yko', '.....yyyy.', '......yyy.'] }, afterPhase(7)),
  Object.assign({ id: 'rakete', slot: 'dazu', n: 'Rakete', f: { r: '#D6455D', g: '#C9D1D6', b: '#2453C9', o: '#F5B700' }, y: 5,
    px: ['........r.', '.......ggg', '.......gbg', '.......ggg', '.......o.o'] }, afterPhase(9)),
  /* ---------- Hintergrund ---------- */
  Object.assign({ id: 'himmel', slot: 'grund', n: 'Himmelblau', unlocked: true, f: { a: '#CFE6FF', b: '#B6D8FF' },
    px: ['aaaaaaaaaa', 'aaaaaaaaaa', 'aaaaaaaaaa', 'aaaaaaaaaa', 'aaaaaaaaaa', 'bbbbbbbbbb', 'bbbbbbbbbb', 'bbbbbbbbbb', 'bbbbbbbbbb', 'bbbbbbbbbb'] }),
  Object.assign({ id: 'meer', slot: 'grund', n: 'Meer', f: { h: '#CFEFFF', a: '#4FA9E0', b: '#2E7FC0', w: '#E8F6FF' },
    px: ['hhhhhhhhhh', 'hhhhhhhhhh', 'hhhhhhhhhh', 'hhhhhhhhhh', 'hhhhhhhhhh', 'whaawhaawh', 'aaaaaaaaaa', 'abbaabbaab', 'bbbbbbbbbb', 'bbbbbbbbbb'] }, afterPhase(3)),
  Object.assign({ id: 'sterne', slot: 'grund', n: 'Sternenhimmel', f: { n: '#1B2545', s: '#F5D76E', w: '#FFFFFF' },
    px: ['nnnnnnnsnn', 'nwnnnnnnnn', 'nnnnnnnnnw', 'snnnnnnnnn', 'nnnnnnnnnn', 'nnnnnnnnnn', 'nnnnnnnnsn', 'nnnnnnnnnn', 'nnnnnnnnnn', 'nnnnnnnnnn'] }, afterPhase(5)),
  Object.assign({ id: 'abend', slot: 'grund', n: 'Sonnenuntergang', f: { a: '#FFD27A', b: '#FFAE6B', c: '#F58A8A', d: '#C576B5', e: '#8A68C9' },
    px: ['aaaaaaaaaa', 'aaaaaaaaaa', 'bbbbbbbbbb', 'bbbbbbbbbb', 'cccccccccc', 'cccccccccc', 'dddddddddd', 'dddddddddd', 'eeeeeeeeee', 'eeeeeeeeee'] }, afterChapters(25)),
  Object.assign({ id: 'code', slot: 'grund', n: 'Code-Regen', f: { k: '#10181A', g: '#2E9E63', h: '#7CE0A8' },
    px: ['khkkgkkkhk', 'kgkkgkhkgk', 'kgkkhkgkgk', 'kkkkgkgkkk', 'khkkkkgkhk', 'kgkhkkkkgk', 'kkkgkhkkgk', 'kgkgkgkkkk', 'khkkkgkhkk', 'kgkkkgkgkk'] }, afterPhase(8))
];
const item = id => ITEMS.find(x => x.id === id);
const itemUnlocked = x => !!x && (x.unlocked || (S.wardrobe || []).includes(x.id));

/* Was du trägst: nur Sachen, die du schon hast */
function outfit() {
  const o = player().outfit, r = {};
  if (o && typeof o === 'object') ITEM_SLOTS.forEach(p => { const x = item(o[p.id]); if (x && x.slot === p.id && itemUnlocked(x)) r[p.id] = x.id; });
  return r;
}
/* Farben aller 100 Felder: Hintergrund, dann die eigenen Pixel, dann Gesicht, Kopf und Dazu darüber */
function avatarFields(px, o) {
  const f = new Array(AV_N * AV_N).fill('');
  const k = AV_N / AV_ALT;
  const lay = x => { if (!x) return; x.px.forEach((codeLine, j) => { const y = (x.y || 0) + j; if (y >= AV_ALT) return; for (let i = 0; i < AV_ALT; i++) { const c = x.f[codeLine[i]]; if (c) for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) f[(y * k + dy) * AV_N + i * k + dx] = c; } }); };
  o = o || {};
  lay(item(o.grund));
  for (let i = 0; i < f.length; i++) { const c = AV_PAL[parseInt((px || '')[i], 16)]; if (c) f[i] = c; }
  ['gesicht', 'kopf', 'dazu'].forEach(p => lay(item(o[p])));
  return f;
}
/* Eine Sache allein, auf ihre Größe zugeschnitten: als kleines Bild auf dem Schreibtisch und in der Garderobe */
function itemSvg(x, size, grey) {
  const f = avatarFields('', { [x.slot]: x.id });
  let x0 = AV_N, y0 = AV_N, x1 = -1, y1 = -1, r = '';
  f.forEach((c, i) => { if (!c) return; const px = i % AV_N, py = (i / AV_N) | 0; x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); });
  const w = x1 - x0 + 1, h = y1 - y0 + 1, s = Math.max(w, h), ox = x0 - (s - w) / 2, oy = y0 - (s - h) / 2;
  f.forEach((c, i) => { if (c) r += '<rect x="' + (i % AV_N) + '" y="' + ((i / AV_N) | 0) + '" width="1.02" height="1.02" fill="' + (grey ? '#9AA3A8' : c) + '"/>'; });
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + ox + ' ' + oy + ' ' + s + ' ' + s + '" width="' + size + '" height="' + size + '" shape-rendering="crispEdges" aria-hidden="true">' + r + '</svg>';
}

/* ---------- Gewinnen ---------- */
/* Nach jedem Speichern: Ist etwas Neues dazugekommen? still = beim Start der App (nur einsortieren, ein kurzer Hinweis).
   Sonst wird die neue Sache gleich angezogen, wenn der Platz noch frei ist, und die Jubel-Karte zeigt sie. */
function wardrobeCheck(still) {
  if (typeof CH === 'undefined') return [];
  S.wardrobe = Array.isArray(S.wardrobe) ? S.wardrobe : []; S.wardrobeNew = Array.isArray(S.wardrobeNew) ? S.wardrobeNew : [];
  const fresh = ITEMS.filter(x => !x.unlocked && !S.wardrobe.includes(x.id) && x.ok());
  if (!fresh.length) return fresh;
  fresh.forEach(x => { S.wardrobe.push(x.id); if (!S.wardrobeNew.includes(x.id)) S.wardrobeNew.push(x.id); });
  if (still) {
    /* Nur einsortieren und merken, ohne S.updated: Das zählt nicht als Lerntag und überschreibt keinen neueren Stand. */
    try { localStorage.setItem('ngfc.v1', JSON.stringify(S)); } catch (e) {}
    setTimeout(() => toast(fresh.length === 1 ? 'Neu für deinen Avatar: ' + fresh[0].n + '. Du findest es im Profil.' : fresh.length + ' neue Sachen für deinen Avatar liegen im Profil.'), 2600);
    return fresh;
  }
  const o = player().outfit = Object.assign({}, outfit());
  fresh.forEach(x => { if (!o[x.slot]) o[x.slot] = x.id; });
  setTimeout(() => { lookApply(); cheerItem(fresh); }, 60);
  return fresh;
}
/* Die Jubel-Karte bekommt eine Zeile für jede neue Sache, und ihr Bild zeigt den Avatar mit der neuen Sache.
   Läuft gerade keine Karte, kommt eine eigene. */
function cheerItem(fresh) {
  const text = 'Neu für deinen Avatar: ' + fresh.map(x => x.n).join(', ');
  const k = document.getElementById('cheerCard');
  if (k && !k.classList.contains('gone')) {
    k.querySelector('.ck-sub').insertAdjacentHTML('beforeend', '<br><b class="ck-item">' + esc(text) + '</b>');
    const av = k.querySelector('.ck-av'); if (av) { av.innerHTML = avatarHtml('ck-img'); cheerHop(av); }
    return;
  }
  cheerBig(text, 'Anziehen kannst du es im Profil unter „Du“.');
}
/* Welche Sachen es gibt, sobald dieses Kapitel geschafft ist (für „Dein nächstes Ticket“) */
function itemsForChapter(ch) {
  if (!ch || S.done[ch.id] || typeof CH === 'undefined') return [];
  const pending = ITEMS.filter(x => !itemUnlocked(x));
  S.done[ch.id] = 1;
  try { return pending.filter(x => x.ok()); } finally { delete S.done[ch.id]; }
}
/* Was als Nächstes kommt, und wie weit es noch ist. Für die Garderobe. */
function nextThing() {
  const pending = ITEMS.filter(x => !itemUnlocked(x));
  return pending.find(x => x.phase !== undefined && ACTS.some(a => a.n === x.phase) && CH.some(c => c.act === x.phase && !S.done[c.id])) || pending[0] || null;
}

/* ---------- Garderobe im Reiter „Du“ ---------- */
var wardrobeSlot = 'kopf';
function wardrobeHtml() {
  const owns = ITEMS.filter(itemUnlocked).length;
  return `<div class="wd" id="wd"><p class="fld" id="wdT">Garderobe <small class="wd-count">${owns} von ${ITEMS.length} Sachen</small></p>
    <p class="muted small wd-intro">Für abgeschlossene Kapitel und Phasen gewinnst du Sachen für deinen Avatar. Tipp eine Sache an, um sie anzuziehen.</p>
    <div class="hub-seg wd-slots" role="group" aria-label="Platz am Avatar">${ITEM_SLOTS.map(p => `<button type="button" data-pl="${p.id}" aria-pressed="${p.id === wardrobeSlot}">${esc(p.n)}</button>`).join('')}</div>
    <div class="wd-list" id="wdList"></div></div>`;
}
function wardrobeFill(p) {
  const listing = p.querySelector('#wdList'); if (!listing) return;
  const o = outfit(), an = o[wardrobeSlot], fresh = S.wardrobeNew || [];
  const preview = id => avatarSvg(avatarPx(), 44, Object.assign({}, o, { [wardrobeSlot]: id }));
  const without = `<button type="button" class="wd-k" data-s="" aria-pressed="${!an}"><span class="wd-image">${avatarPx() ? preview('') : '<span class="wd-empty">–</span>'}</span><b>Ohne</b></button>`;
  listing.innerHTML = without + ITEMS.filter(x => x.slot === wardrobeSlot).map(x => {
    if (!itemUnlocked(x)) return `<div class="wd-k wd-close" role="img" aria-label="${esc(x.n)}, noch nicht gewonnen. ${esc(x.how())}"><span class="wd-image">${itemSvg(x, 34, true)}<span class="wd-lock" aria-hidden="true">🔒</span></span><b>${esc(x.n)}</b><small>${esc(x.how())}</small></div>`;
    return `<button type="button" class="wd-k" data-s="${x.id}" aria-pressed="${an === x.id}"><span class="wd-image">${avatarPx() ? preview(x.id) : itemSvg(x, 34)}</span><b>${esc(x.n)}</b>${fresh.includes(x.id) ? '<span class="wd-new">Neu</span>' : ''}</button>`;
  }).join('');
  listing.querySelectorAll('button.wd-k').forEach(b => b.onclick = () => {
    const me = player(); me.outfit = Object.assign({}, outfit());
    if (b.dataset.s) me.outfit[wardrobeSlot] = b.dataset.s; else delete me.outfit[wardrobeSlot];
    S.wardrobeNew = (S.wardrobeNew || []).filter(id => id !== b.dataset.s);
    save(); lookApply(); wardrobeFill(p);
    const prev = document.getElementById('avPrev'); if (prev) prev.innerHTML = avatarSvg(avatarPx(), 72, true);
    const k = listing.querySelector('[data-s="' + b.dataset.s + '"]'); if (k) k.focus();
  });
  /* Wer die Sachen eines Platzes gesehen hat, für den sind sie nicht mehr neu. Die Markierung bleibt bis zum nächsten Öffnen. */
  const seen = ITEMS.filter(x => x.slot === wardrobeSlot).map(x => x.id);
  if (fresh.some(id => seen.includes(id))) { S.wardrobeNew = fresh.filter(id => !seen.includes(id)); save(); renderHud(); }
}
function wardrobeOn(p) {
  p.querySelectorAll('.wd-slots button').forEach(b => b.onclick = () => {
    wardrobeSlot = b.dataset.pl;
    p.querySelectorAll('.wd-slots button').forEach(x => x.setAttribute('aria-pressed', x === b));
    wardrobeFill(p);
  });
  wardrobeFill(p);
}
/* Profil öffnen, gleich bei der Garderobe. Liegt dort etwas Neues, geht der passende Platz auf. */
function wardrobeOpen() {
  const fresh = (S.wardrobeNew || []).map(item).filter(Boolean);
  if (fresh.length) wardrobeSlot = fresh[0].slot;
  meOpen('du');
  const g = document.getElementById('wd'); if (g) g.scrollIntoView({ block: 'start' });
}
