/* ================= GARDEROBE: Sachen für den Avatar =================
   Wer Kapitel abschließt, gewinnt Sachen für seinen Pixel-Avatar: Kopf (Mützen, Helm, Krone), Gesicht (Brillen, Bart),
   Dazu (Tasse, Krawatte, Ente, Rakete) und Hintergrund. Jede Sache ist ein kleines Pixelbild im 10 × 10-Raster (beim Zeichnen verdoppelt auf das 20 × 20 des Avatars)
   wie der Avatar und liegt beim Zeichnen über (oder beim Hintergrund unter) den eigenen Pixeln.
   Gespeichert im Spielstand: S.schrank (was du schon gewonnen hast), S.schrankNeu (noch nicht angesehen) und
   S.ich.outfit (was du gerade trägst, eine Sache je Platz). Damit wandert alles mit fortschritt.json und dem Export.
   Neue Sachen: unten in SACHEN eintragen. Die id nie umbenennen, sie steht im Spielstand. */
var SACH_PLAETZE = [
  { id: 'kopf', n: 'Kopf' },
  { id: 'gesicht', n: 'Gesicht' },
  { id: 'dazu', n: 'Dazu' },
  { id: 'grund', n: 'Hintergrund' }
];
/* Wie viele Kapitel (ohne eigene) geschafft sind. Gesamt zählt optionale Grundlagen nicht mit (basis.js, kapitelOptional). */
const kapitelGeschafft = () => CH.filter(c => c.akt !== 'E' && S.done[c.id]).length;
const kapitelGesamt = () => CH.filter(c => c.akt !== 'E' && !kapitelOptional(c)).length;
/* Name einer Phase für die Bedingung, z. B. „Erste Woche“ */
const phaseTitel = n => { const a = AKTE.find(x => x.n === n); return a ? a.title : ''; };
const nachPhase = n => ({ phase: n, ok: () => phaseFertig(n), wie: () => 'Schließ die Phase „' + phaseTitel(n) + '“ ab.' });
const nachKapiteln = k => ({ ok: () => kapitelGeschafft() >= k, wie: () => k === 1 ? 'Schließ dein erstes Kapitel ab.' : 'Schließ ' + k + ' Kapitel ab.' });

/* px: zehn Zeilen mit je zehn Zeichen. '.' bleibt durchsichtig, jeder andere Buchstabe steht für eine Farbe aus f.
   Kürzere Listen fangen oben an (y gibt die erste Zeile an). */
var SACHEN = [
  /* ---------- Kopf ---------- */
  Object.assign({ id: 'cap', platz: 'kopf', n: 'Basecap', frei: true, f: { a: '#2453C9', b: '#163A94', w: '#FFFFFF' },
    px: ['..aaaaaa..', '.aaaawaaa.', '.bbbbbbbbb'] }),
  Object.assign({ id: 'muetze', platz: 'kopf', n: 'Pixelwerk-Mütze', f: { m: '#D6455D', k: '#A8304A', p: '#FFFFFF' },
    px: ['....pp....', '..mmmmmm..', '.mmmmmmmm.', '.kkkkkkkk.'] }, nachPhase(1)),
  Object.assign({ id: 'kopfhoerer', platz: 'kopf', n: 'Kopfhörer', f: { k: '#1A2320', h: '#2E9E63', g: '#8C979E' },
    px: ['..kkkkkk..', '.k......k.', 'k........k', 'hh......hh', 'hh......hh', 'g........g'] }, nachPhase('W')),
  Object.assign({ id: 'helm', platz: 'kopf', n: 'Bauhelm', f: { y: '#F5B700', d: '#C98F00', w: '#FFF3C4' },
    px: ['...yyyy...', '..ywyyyy..', '.yyyyyyyy.', 'dddddddddd'] }, nachPhase(6)),
  Object.assign({ id: 'krone', platz: 'kopf', n: 'Krone', f: { y: '#F5B700', d: '#C98F00', r: '#D6455D', b: '#2453C9' },
    px: ['.y..yy..y.', '.yy.yy.yy.', '.yryybyry.', '.dddddddd.'],
    ok: () => CH.every(c => c.akt === 'E' || kapitelOptional(c) || S.done[c.id]), wie: () => 'Schließ alle ' + kapitelGesamt() + ' Kapitel ab.' }),
  /* ---------- Gesicht ---------- */
  Object.assign({ id: 'nerdbrille', platz: 'gesicht', n: 'Nerdbrille', f: { k: '#D6455D' }, y: 3,
    px: ['..kk.kkk..', '.k..k...k.', '..kk.kkk..'] }, nachPhase(0)),
  Object.assign({ id: 'sonnenbrille', platz: 'gesicht', n: 'Sonnenbrille', f: { k: '#1A2320', w: '#8C979E' }, y: 4,
    px: ['kkwkkkkwkk', '.kkk..kkk.'] }, nachPhase(2)),
  Object.assign({ id: 'bart', platz: 'gesicht', n: 'Schnurrbart', f: { b: '#5B3A1E' }, y: 5,
    px: ['...bbbb...', '.bb....bb.'] }, nachKapiteln(10)),
  /* ---------- Dazu ---------- */
  Object.assign({ id: 'tasse', platz: 'dazu', n: 'Kaffeetasse', f: { r: '#D6455D', w: '#FFFFFF', g: '#8C979E' }, y: 6,
    px: ['.g.g......', 'rrr.......', 'rwrr......', 'rrr.......'] }, nachKapiteln(1)),
  Object.assign({ id: 'krawatte', platz: 'dazu', n: 'Krawatte', f: { r: '#D6455D', d: '#A8304A', w: '#FFFFFF' }, y: 7,
    px: ['...wrrw...', '....rr....', '...rddr...'] }, nachPhase(4)),
  Object.assign({ id: 'ente', platz: 'dazu', n: 'Quietscheente', f: { y: '#F5B700', o: '#F08A00', k: '#1A2320' }, y: 6,
    px: ['.......yy.', '.......yko', '.....yyyy.', '......yyy.'] }, nachPhase(7)),
  Object.assign({ id: 'rakete', platz: 'dazu', n: 'Rakete', f: { r: '#D6455D', g: '#C9D1D6', b: '#2453C9', o: '#F5B700' }, y: 5,
    px: ['........r.', '.......ggg', '.......gbg', '.......ggg', '.......o.o'] }, nachPhase(9)),
  /* ---------- Hintergrund ---------- */
  Object.assign({ id: 'himmel', platz: 'grund', n: 'Himmelblau', frei: true, f: { a: '#CFE6FF', b: '#B6D8FF' },
    px: ['aaaaaaaaaa', 'aaaaaaaaaa', 'aaaaaaaaaa', 'aaaaaaaaaa', 'aaaaaaaaaa', 'bbbbbbbbbb', 'bbbbbbbbbb', 'bbbbbbbbbb', 'bbbbbbbbbb', 'bbbbbbbbbb'] }),
  Object.assign({ id: 'meer', platz: 'grund', n: 'Meer', f: { h: '#CFEFFF', a: '#4FA9E0', b: '#2E7FC0', w: '#E8F6FF' },
    px: ['hhhhhhhhhh', 'hhhhhhhhhh', 'hhhhhhhhhh', 'hhhhhhhhhh', 'hhhhhhhhhh', 'whaawhaawh', 'aaaaaaaaaa', 'abbaabbaab', 'bbbbbbbbbb', 'bbbbbbbbbb'] }, nachPhase(3)),
  Object.assign({ id: 'sterne', platz: 'grund', n: 'Sternenhimmel', f: { n: '#1B2545', s: '#F5D76E', w: '#FFFFFF' },
    px: ['nnnnnnnsnn', 'nwnnnnnnnn', 'nnnnnnnnnw', 'snnnnnnnnn', 'nnnnnnnnnn', 'nnnnnnnnnn', 'nnnnnnnnsn', 'nnnnnnnnnn', 'nnnnnnnnnn', 'nnnnnnnnnn'] }, nachPhase(5)),
  Object.assign({ id: 'abend', platz: 'grund', n: 'Sonnenuntergang', f: { a: '#FFD27A', b: '#FFAE6B', c: '#F58A8A', d: '#C576B5', e: '#8A68C9' },
    px: ['aaaaaaaaaa', 'aaaaaaaaaa', 'bbbbbbbbbb', 'bbbbbbbbbb', 'cccccccccc', 'cccccccccc', 'dddddddddd', 'dddddddddd', 'eeeeeeeeee', 'eeeeeeeeee'] }, nachKapiteln(25)),
  Object.assign({ id: 'code', platz: 'grund', n: 'Code-Regen', f: { k: '#10181A', g: '#2E9E63', h: '#7CE0A8' },
    px: ['khkkgkkkhk', 'kgkkgkhkgk', 'kgkkhkgkgk', 'kkkkgkgkkk', 'khkkkkgkhk', 'kgkhkkkkgk', 'kkkgkhkkgk', 'kgkgkgkkkk', 'khkkkgkhkk', 'kgkkkgkgkk'] }, nachPhase(8))
];
const sache = id => SACHEN.find(x => x.id === id);
const sacheFrei = x => !!x && (x.frei || (S.schrank || []).includes(x.id));

/* Was du trägst: nur Sachen, die du schon hast */
function outfit() {
  const o = ich().outfit, r = {};
  if (o && typeof o === 'object') SACH_PLAETZE.forEach(p => { const x = sache(o[p.id]); if (x && x.platz === p.id && sacheFrei(x)) r[p.id] = x.id; });
  return r;
}
/* Farben aller 100 Felder: Hintergrund, dann die eigenen Pixel, dann Gesicht, Kopf und Dazu darüber */
function avatarFelder(px, o) {
  const f = new Array(AV_N * AV_N).fill('');
  const k = AV_N / AV_ALT;
  const legen = x => { if (!x) return; x.px.forEach((zeile, j) => { const y = (x.y || 0) + j; if (y >= AV_ALT) return; for (let i = 0; i < AV_ALT; i++) { const c = x.f[zeile[i]]; if (c) for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) f[(y * k + dy) * AV_N + i * k + dx] = c; } }); };
  o = o || {};
  legen(sache(o.grund));
  for (let i = 0; i < f.length; i++) { const c = AV_PAL[parseInt((px || '')[i], 16)]; if (c) f[i] = c; }
  ['gesicht', 'kopf', 'dazu'].forEach(p => legen(sache(o[p])));
  return f;
}
/* Eine Sache allein, auf ihre Größe zugeschnitten: als kleines Bild auf dem Schreibtisch und in der Garderobe */
function sacheSvg(x, size, grau) {
  const f = avatarFelder('', { [x.platz]: x.id });
  let x0 = AV_N, y0 = AV_N, x1 = -1, y1 = -1, r = '';
  f.forEach((c, i) => { if (!c) return; const px = i % AV_N, py = (i / AV_N) | 0; x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); });
  const w = x1 - x0 + 1, h = y1 - y0 + 1, s = Math.max(w, h), ox = x0 - (s - w) / 2, oy = y0 - (s - h) / 2;
  f.forEach((c, i) => { if (c) r += '<rect x="' + (i % AV_N) + '" y="' + ((i / AV_N) | 0) + '" width="1.02" height="1.02" fill="' + (grau ? '#9AA3A8' : c) + '"/>'; });
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + ox + ' ' + oy + ' ' + s + ' ' + s + '" width="' + size + '" height="' + size + '" shape-rendering="crispEdges" aria-hidden="true">' + r + '</svg>';
}

/* ---------- Gewinnen ---------- */
/* Nach jedem Speichern: Ist etwas Neues dazugekommen? still = beim Start der App (nur einsortieren, ein kurzer Hinweis).
   Sonst wird die neue Sache gleich angezogen, wenn der Platz noch frei ist, und die Jubel-Karte zeigt sie. */
function schrankPruefen(still) {
  if (typeof CH === 'undefined') return [];
  S.schrank = Array.isArray(S.schrank) ? S.schrank : []; S.schrankNeu = Array.isArray(S.schrankNeu) ? S.schrankNeu : [];
  const neu = SACHEN.filter(x => !x.frei && !S.schrank.includes(x.id) && x.ok());
  if (!neu.length) return neu;
  neu.forEach(x => { S.schrank.push(x.id); if (!S.schrankNeu.includes(x.id)) S.schrankNeu.push(x.id); });
  if (still) {
    /* Nur einsortieren und merken, ohne S.updated: Das zählt nicht als Lerntag und überschreibt keinen neueren Stand. */
    try { localStorage.setItem('ngfc.v1', JSON.stringify(S)); } catch (e) {}
    setTimeout(() => toast(neu.length === 1 ? 'Neu für deinen Avatar: ' + neu[0].n + '. Du findest es im Profil.' : neu.length + ' neue Sachen für deinen Avatar liegen im Profil.'), 2600);
    return neu;
  }
  const o = ich().outfit = Object.assign({}, outfit());
  neu.forEach(x => { if (!o[x.platz]) o[x.platz] = x.id; });
  setTimeout(() => { lookAnwenden(); jubelSache(neu); }, 60);
  return neu;
}
/* Die Jubel-Karte bekommt eine Zeile für jede neue Sache, und ihr Bild zeigt den Avatar mit der neuen Sache.
   Läuft gerade keine Karte, kommt eine eigene. */
function jubelSache(neu) {
  const text = 'Neu für deinen Avatar: ' + neu.map(x => x.n).join(', ');
  const k = document.getElementById('jubelKarte');
  if (k && !k.classList.contains('weg')) {
    k.querySelector('.jk-sub').insertAdjacentHTML('beforeend', '<br><b class="jk-sache">' + esc(text) + '</b>');
    const av = k.querySelector('.jk-av'); if (av) { av.innerHTML = avatarHtml('jk-img'); jubelHuepf(av); }
    return;
  }
  jubelGross(text, 'Anziehen kannst du es im Profil unter „Du“.');
}
/* Welche Sachen es gibt, sobald dieses Kapitel geschafft ist (für „Dein nächstes Ticket“) */
function sachenFuerKapitel(ch) {
  if (!ch || S.done[ch.id] || typeof CH === 'undefined') return [];
  const offen = SACHEN.filter(x => !sacheFrei(x));
  S.done[ch.id] = 1;
  try { return offen.filter(x => x.ok()); } finally { delete S.done[ch.id]; }
}
/* Was als Nächstes kommt, und wie weit es noch ist. Für die Garderobe. */
function naechsteSache() {
  const offen = SACHEN.filter(x => !sacheFrei(x));
  return offen.find(x => x.phase !== undefined && AKTE.some(a => a.n === x.phase) && CH.some(c => c.akt === x.phase && !S.done[c.id])) || offen[0] || null;
}

/* ---------- Garderobe im Reiter „Du“ ---------- */
var garderobePlatz = 'kopf';
function garderobeHtml() {
  const hat = SACHEN.filter(sacheFrei).length;
  return `<div class="gd" id="gd"><p class="fld" id="gdT">Garderobe <small class="gd-zahl">${hat} von ${SACHEN.length} Sachen</small></p>
    <p class="muted small gd-intro">Für abgeschlossene Kapitel und Phasen gewinnst du Sachen für deinen Avatar. Tipp eine Sache an, um sie anzuziehen.</p>
    <div class="hub-seg gd-plaetze" role="group" aria-label="Platz am Avatar">${SACH_PLAETZE.map(p => `<button type="button" data-pl="${p.id}" aria-pressed="${p.id === garderobePlatz}">${esc(p.n)}</button>`).join('')}</div>
    <div class="gd-liste" id="gdListe"></div></div>`;
}
function garderobeFuellen(p) {
  const liste = p.querySelector('#gdListe'); if (!liste) return;
  const o = outfit(), an = o[garderobePlatz], neu = S.schrankNeu || [];
  const vorschau = id => avatarSvg(avatarPx(), 44, Object.assign({}, o, { [garderobePlatz]: id }));
  const ohne = `<button type="button" class="gd-k" data-s="" aria-pressed="${!an}"><span class="gd-bild">${avatarPx() ? vorschau('') : '<span class="gd-leer">–</span>'}</span><b>Ohne</b></button>`;
  liste.innerHTML = ohne + SACHEN.filter(x => x.platz === garderobePlatz).map(x => {
    if (!sacheFrei(x)) return `<div class="gd-k gd-zu" role="img" aria-label="${esc(x.n)}, noch nicht gewonnen. ${esc(x.wie())}"><span class="gd-bild">${sacheSvg(x, 34, true)}<span class="gd-schloss" aria-hidden="true">🔒</span></span><b>${esc(x.n)}</b><small>${esc(x.wie())}</small></div>`;
    return `<button type="button" class="gd-k" data-s="${x.id}" aria-pressed="${an === x.id}"><span class="gd-bild">${avatarPx() ? vorschau(x.id) : sacheSvg(x, 34)}</span><b>${esc(x.n)}</b>${neu.includes(x.id) ? '<span class="gd-neu">Neu</span>' : ''}</button>`;
  }).join('');
  liste.querySelectorAll('button.gd-k').forEach(b => b.onclick = () => {
    const me = ich(); me.outfit = Object.assign({}, outfit());
    if (b.dataset.s) me.outfit[garderobePlatz] = b.dataset.s; else delete me.outfit[garderobePlatz];
    S.schrankNeu = (S.schrankNeu || []).filter(id => id !== b.dataset.s);
    save(); lookAnwenden(); garderobeFuellen(p);
    const prev = document.getElementById('avPrev'); if (prev) prev.innerHTML = avatarSvg(avatarPx(), 72, true);
    const k = liste.querySelector('[data-s="' + b.dataset.s + '"]'); if (k) k.focus();
  });
  /* Wer die Sachen eines Platzes gesehen hat, für den sind sie nicht mehr neu. Die Markierung bleibt bis zum nächsten Öffnen. */
  const gesehen = SACHEN.filter(x => x.platz === garderobePlatz).map(x => x.id);
  if (neu.some(id => gesehen.includes(id))) { S.schrankNeu = neu.filter(id => !gesehen.includes(id)); save(); renderHud(); }
}
function garderobeAn(p) {
  p.querySelectorAll('.gd-plaetze button').forEach(b => b.onclick = () => {
    garderobePlatz = b.dataset.pl;
    p.querySelectorAll('.gd-plaetze button').forEach(x => x.setAttribute('aria-pressed', x === b));
    garderobeFuellen(p);
  });
  garderobeFuellen(p);
}
/* Profil öffnen, gleich bei der Garderobe. Liegt dort etwas Neues, geht der passende Platz auf. */
function garderobeOeffnen() {
  const neu = (S.schrankNeu || []).map(sache).filter(Boolean);
  if (neu.length) garderobePlatz = neu[0].platz;
  ichOeffnen('du');
  const g = document.getElementById('gd'); if (g) g.scrollIntoView({ block: 'start' });
}
