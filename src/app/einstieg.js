/* ===== Spiel-Einstieg beim ersten Start =====
   Sechs Bilder: Titel → Charakter → Erster Tag → Team → Dein Coach (mit eigener KI oder ohne) → So läuft’s. route() (start.js) fragt bei jedem Seitenwechsel einstiegNoetig()
   und ruft dann nur renderEinstieg(main). Name, Avatar, Farbe, Vorkenntnisse und Team stehen sofort in S.ich (gleiche Felder wie im
   Profil-Dialog). Bei welchem Bild man ist, merkt sich sessionStorage: Neuladen setzt dort fort.
   einstiegStarten(): den Einstieg nochmal ansehen (Link im Profil), ohne Fortschritt zu ändern. */
var ES_KEY = 'pw-einstieg', ES_N = 6;
var esLauf = null, esZeit = [], esChatEile = null, esMalFarbe = 1, esUrl = '', esPerMaus = false;

/* Wer sich im Team vorstellt: ein Satz in der eigenen Stimme und wobei man miteinander zu tun hat (passend zu den Szenen der Kapitel) */
var ES_TEAM = [
  ['toni', 'Ich schau mir deinen Code an, bevor er live geht. Und ich erklär dir jeden Schritt.'],
  ['sara', 'Von mir kommen deine Tickets, immer mit Akzeptanzkriterien.'],
  ['jonas', 'Ich baue die API, du das Frontend. Und bei mir geht es immer.'],
  ['mia', 'Ich teste, was du baust. Und ich finde jeden Bug.'],
  ['leon', 'Ich rede mit den Kunden. Hakt was im Teamboard, hörst du es von mir.'],
  ['ricky', 'Bei Quick & Dirty hieß es immer: Läuft doch. Meinen Code reviewst du noch, hehe.']
];
var ES_WEG = [['Ticket lesen', 'Der Team-Chat sagt, worum es geht.'], ['Verstehen', 'Kurze Folien mit Code.'], ['Quiz', 'Ein paar Fragen, sofort mit Antwort.'], ['Umsetzen', 'Ab Phase 1 schreibst du echten Angular-Code.']];
/* Antwort auf die Frage nach den Grundlagen, wie sie in S.ich.weg steht (siehe grundlagenOptional in basis.js) */
var ES_WEGE = ['grundlagen', 'angular'];
var ES_MALFARBEN = ['Radierer', 'Schwarz', 'Weiß', 'Hautton hell', 'Hautton mittel', 'Braun', 'Gelb', 'Blau', 'Rot', 'Grün', 'Lila', 'Grau', 'Rosa'];
/* Pixel-Schrift für den Schriftzug auf dem Titelbild, 7 Zeilen je Buchstabe */
var ES_SCHRIFT = {
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'], I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'], E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'], W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'], K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#']
};
var ES_LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="3" width="34" height="34" rx="9" fill="var(--accent-ink)"/><path d="M15 13 9 20l6 7M25 13l6 7-6 7" fill="none" stroke="var(--accent)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 11.5 18 28.5" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"/></svg>';

/* ---------- Zustand des Durchlaufs ---------- */
function esLaufLesen() {
  if (esLauf) return esLauf;
  try {
    const v = JSON.parse(sessionStorage.getItem(ES_KEY));
    if (v && typeof v === 'object') esLauf = {
      bild: Math.max(0, Math.min(ES_N - 1, v.bild | 0)), erneut: !!v.erneut, malen: !!v.malen,
      a1: v.a1 === 0 || v.a1 === 1 ? v.a1 : null, level: [0, 1, 2].includes(v.level) ? v.level : null, weg: v.weg === 0 || v.weg === 1 ? v.weg : null,
      team: Array.isArray(v.team) ? ES_TEAM.map(t => t[0]).filter(k => v.team.includes(k)) : [],
      ki: v.ki === 'mit' || v.ki === 'ohne' ? v.ki : null, anb: KI_ANBIETER[v.anb] ? v.anb : null
    };
  } catch (e) {}
  return esLauf;
}
function esMerken() { try { sessionStorage.setItem(ES_KEY, JSON.stringify(esLauf)); } catch (e) {} }
function esSpaeter(fn, ms) { const t = setTimeout(fn, ms); esZeit.push(t); return t; }
function esStopp() { esZeit.forEach(clearTimeout); esZeit = []; esChatEile = null; }
function esSchluss() { esStopp(); esLauf = null; try { sessionStorage.removeItem(ES_KEY); } catch (e) {} }
/* Bis zu welchem Bild man schon darf: ohne Namen kein Dialog, ohne Antwort kein Team, ohne drei Begrüßte kein Coach.
   Der Coach hält nicht auf: Ohne KI geht es genauso weiter. */
function esMaxBild() { const l = esLauf; return !ichName() ? 1 : l.level == null || l.weg == null ? 2 : l.team.length < 3 ? 3 : 5; }

function einstiegNoetig() {
  document.documentElement.classList.remove('es-vor'); /* ab jetzt entscheidet body.es-an (siehe 10-einstieg.css) */
  const lauf = esLaufLesen();
  if (lauf && lauf.erneut) return true;
  const me = S.ich || {};
  const frisch = !me.start && !S.xp && !Object.keys(S.done || {}).length && !Object.keys(S.steps || {}).length;
  if (!frisch) { if (lauf) esSchluss(); return false; } /* z. B. gerade einen Spielstand geladen */
  return !!lauf || !String(me.name || '').trim();
}
function einstiegStarten() {
  esStopp();
  esLauf = { bild: 0, erneut: true, malen: false, a1: null, level: null, weg: null, team: [] }; esMerken();
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  route();
}
function renderEinstieg(main) {
  if (!esLaufLesen()) { esLauf = { bild: 0, erneut: false, malen: false, a1: null, level: null, weg: null, team: [] }; esMerken(); }
  esLauf.bild = Math.min(esLauf.bild, esMaxBild());
  const da = main.firstElementChild;
  if (da && da.classList.contains('es') && +da.dataset.bild === esLauf.bild) return; /* schon da: nichts verlieren */
  esZeigen(main);
}

/* ---------- Rahmen: Leiste oben, Bildwechsel, Ende ---------- */
function esZeigen(main, rueck) {
  esStopp();
  const l = esLauf, b = l.bild;
  main.innerHTML = `<div class="es${rueck ? ' es-rueck' : ''}" data-bild="${b}">
    <div class="es-leiste">
      <button type="button" class="es-zurueck" id="esZurueck" aria-label="Zurück"${b ? '' : ' hidden'}><span aria-hidden="true">←</span></button>
      <ol class="es-punkte" role="img" aria-label="Schritt ${b + 1} von ${ES_N}">${Array.from({ length: ES_N }, (x, i) => `<li class="${i < b ? 'war' : i === b ? 'da' : ''}"></li>`).join('')}</ol>
      <button type="button" class="linkbtn es-skip" id="esSkip">${l.erneut ? 'Beenden' : 'Überspringen'}</button>
    </div>
    ${[esTitelHtml, esCharHtml, esTagHtml, esTeamHtml, esKiHtml, esRegelnHtml][b](l)}
  </div>`;
  const w = main.firstElementChild;
  /* e.detail > 1 ist der zweite Klick eines Doppelklicks: Er soll nicht gleich das nächste Bild wegklicken */
  $('#esZurueck', w).onclick = e => { if (e.detail < 2) esGeh(-1); };
  $('#esWeiter', w).onclick = e => { if (e.detail < 2) { if (b === ES_N - 1) esEnde(l.erneut ? 'start' : CH[0].id, !l.erneut); else esGeh(1); } };
  $('#esSkip', w).onclick = () => esEnde('start', false);
  esVerlauf();
  window.scrollTo(0, 0);
  if (b) $('#esT', w).focus({ preventScroll: true });
  [esTitelAn, esCharAn, esTagAn, esTeamAn, esKiAn, () => {}][b](w, l);
}
function esGeh(d) {
  const neu = Math.max(0, Math.min(esMaxBild(), esLauf.bild + d));
  if (neu === esLauf.bild) return;
  esLauf.bild = neu; esMerken(); esZeigen($('#main'), d < 0);
}
function esEnde(ziel, feiern) {
  const me = ich();
  if (!me.start) me.start = Date.now();
  save(); esSchluss();
  let ersetzt = false; /* der eigene Verlaufs-Eintrag wird zum Ziel, sonst ganz normal weiter */
  if (history.state && history.state.es) { try { history.replaceState(null, '', '#' + ziel); ersetzt = true; } catch (e) {} }
  if (!ersetzt) location.hash = '#' + ziel;
  route();
  if (feiern) jubelGross('Willkommen im Team!', 'Dein erstes Ticket wartet.');
}
/* Zurück-Taste des Browsers (am Handy die Wischgeste) = ein Bild zurück. Dafür liegt ab dem zweiten Bild genau ein eigener Eintrag im Verlauf.
   Am Ende wird er zum Ziel, es bleibt also nichts zurück. Lässt der Browser den Eintrag nicht zu, verlässt Zurück wie gewohnt die Seite. */
function esVerlauf() {
  try {
    if (esLauf.bild > 0 && !(history.state && history.state.es)) history.pushState({ es: 1 }, '');
    if (history.state && history.state.es) esUrl = location.href;
  } catch (e) {}
}
/* Nur wenn die Adresse gleich geblieben ist, war es der Schritt vom eigenen Eintrag zurück (ein Hash-Wechsel löst popstate auch aus) */
window.addEventListener('popstate', () => {
  if (esLauf && esLauf.bild > 0 && document.body.classList.contains('es-an') && !(history.state && history.state.es) && location.href === esUrl) esGeh(-1);
});
/* Kurze Rückmeldung per CSS-Animation. Läuft sie noch, startet sie nicht neu: So zittert der Ausweis beim Tippen nicht. */
function esWackeln(el, cls) {
  if (!el || !bewegungAn() || el.classList.contains(cls)) return;
  const ende = e => { if (e.target === el) { el.classList.remove(cls); el.removeEventListener('animationend', ende); } };
  el.classList.add(cls); el.addEventListener('animationend', ende);
}
function esFuss(w, hinweis, bereit) { const h = $('#esHinweis', w); if (h.innerHTML !== hinweis) h.innerHTML = hinweis; $('#esWeiter', w).disabled = !bereit; }

/* ---------- 1. Titelbild ---------- */
function esSchriftzug() {
  let x = 0, r = '';
  [...'PIXELWERK'].forEach((b, n) => {
    ES_SCHRIFT[b].forEach((zeile, y) => [...zeile].forEach((c, i) => { if (c === '#') r += `<rect${n > 4 ? ' class="es-wk"' : ''} x="${x + i + .05}" y="${y + .05}" width=".9" height=".9" style="--d:${Math.random() * 420 | 0}ms"/>`; }));
    x += ES_SCHRIFT[b][0].length + 1;
  });
  return `<svg class="es-wort" viewBox="0 0 ${x - 1} 7" aria-hidden="true">${r}</svg>`;
}
/* Ruhiger Hintergrund: einzelne Kästchen im Raster, die langsam auf- und abblenden (ohne Bewegung stehen sie still) */
/* Das Raster hängt an der Bildmitte und reicht für die längere Bildschirmseite: Es stimmt auch nach Drehen oder Größenänderung. */
function esPixelHtml() {
  const g = 40, r = Math.ceil(Math.min(2000, Math.max(innerWidth, innerHeight, screen.width || 0, screen.height || 0)) / g / 2) + 1, n = Math.round(4 * r * r * .09);
  let h = '';
  for (let i = 0; i < n; i++) {
    const x = (Math.random() * 2 * r | 0) - r, y = (Math.random() * 2 * r | 0) - r;
    if (Math.abs(x + .5) < 10 && y >= -4 && y <= 4) continue; /* Schriftzug und Knopf bleiben frei */
    h += `<i${i % 5 ? '' : ' class="es-gr"'} style="--x:${x};--y:${y};--o:${(.05 + Math.random() * .12).toFixed(2)};animation-duration:${(3 + Math.random() * 5).toFixed(1)}s;animation-delay:-${(Math.random() * 8).toFixed(1)}s"></i>`;
  }
  return h;
}
function esTitelHtml(l) {
  return `<div class="es-pixel" aria-hidden="true">${esPixelHtml()}</div>
  <section class="es-bild es-titel">
    <h1 class="es-logo" id="esT"><span class="nur-sr">Pixelwerk</span>${esSchriftzug()}</h1>
    <p class="es-unter">Angular lernen, vom ersten Tag bis Tech Lead</p>
    <button type="button" class="btn primary big" id="esWeiter">${l.erneut ? 'Nochmal ansehen' : 'Neues Spiel'}</button>
    ${l.erneut ? '' : '<button type="button" class="linkbtn es-laden" id="esLaden">Spielstand laden</button><input type="file" id="esDatei" accept="application/json,.json" hidden>'}
  </section>`;
}
function esTitelAn(w) {
  const datei = $('#esDatei', w); if (!datei) return;
  $('#esLaden', w).onclick = () => datei.click();
  /* importProgress lädt die Datei, speichert und ruft route(): Hat der Spielstand Fortschritt, ist der Einstieg damit vorbei */
  datei.onchange = () => { const f = datei.files[0]; if (f) importProgress(f); datei.value = ''; };
}

/* ---------- 2. Charakter erstellen ---------- */
function esHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
function esFarbId() { const f = ich().farbe; return f && f.a ? f.id || 'eigen' : 'pixelwerk'; }
function esCharHtml(l) {
  const me = ich(), seit = new Date(me.start || Date.now()).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `<section class="es-bild es-char">
    <div class="es-kopf"><h1 id="esT" tabindex="-1">${l.erneut ? 'Dein Charakter' : 'Erstell deinen Charakter'}</h1></div>
    <div class="es-char-g">
      <div class="es-regler">
        <label class="es-feld" for="esName"><span class="es-l">Name</span><input id="esName" maxlength="${ICH_NAME_MAX}" autocomplete="given-name" enterkeyhint="done" placeholder="Wie heißt du?" value="${esc(me.name || '')}"></label>
        <div class="es-feld" role="group" aria-labelledby="esAvL"><span class="es-l" id="esAvL">Avatar</span>
          <div class="es-kacheln">${AV_VORLAGEN.map((v, i) => `<button type="button" class="es-kachel" data-v="${i}" aria-label="Vorlage ${esc(v.n)}">${avatarSvg(v.px, 40)}</button>`).join('')}</div>
          <div class="es-kacheln"><button type="button" class="btn es-mini" id="esZufall"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="2" width="16" height="16" rx="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M5.5 5.5h2.6v2.6H5.5zM11.9 5.5h2.6v2.6h-2.6zM8.7 8.7h2.6v2.6H8.7zM5.5 11.9h2.6v2.6H5.5zM11.9 11.9h2.6v2.6h-2.6z"/></svg>Zufall</button>
            <button type="button" class="btn es-mini" id="esMalen" aria-expanded="${l.malen}" aria-controls="esMalFeld"><svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M3 3h6v6H3zM11 11h6v6h-6z"/><path fill="currentColor" opacity=".35" d="M11 3h6v6h-6zM3 11h6v6H3z"/></svg>Selbst malen</button></div>
          <div class="es-mal" id="esMalFeld"${l.malen ? '' : ' hidden'}>
            <div class="es-raster" id="esRaster" tabindex="0" role="application" aria-label="Pixel-Raster, 10 mal 10. Pfeiltasten bewegen, Leertaste malt.">${'<i></i>'.repeat(AV_N * AV_N)}</div>
            <div class="es-mal-r"><div class="es-palette" role="group" aria-label="Malfarbe">${AV_PAL.map((c, i) => `<button type="button" data-c="${i}" aria-pressed="${i === esMalFarbe}" aria-label="${ES_MALFARBEN[i] || 'Farbe ' + i}" title="${ES_MALFARBEN[i] || ''}"><i style="${c ? 'background:' + c : ''}"></i></button>`).join('')}</div>
              <button type="button" class="linkbtn es-leeren" id="esLeeren">Alles löschen</button></div>
          </div>
        </div>
        <div class="es-feld" role="group" aria-labelledby="esFaL"><span class="es-l" id="esFaL">Lieblingsfarbe</span>
          <div class="es-farben">${FARB_PRESETS.map(p => `<button type="button" class="es-farbe" data-p="${p.id}" aria-label="${esc(p.n)}" title="${esc(p.n)}"><i style="background:${p.a}"></i></button>`).join('')}</div>
        </div>
      </div>
      <aside class="es-ausweis-w" id="esAusweis" aria-label="Dein Mitarbeiterausweis">
        <div class="es-band" aria-hidden="true"></div>
        <div class="es-ausweis">
          <div class="es-aw-kopf">${ES_LOGO}<b>Pixelwerk</b></div>
          <div class="es-aw-bild" id="esAwBild"></div>
          <div class="es-aw-wer"><p class="es-aw-name" id="esAwName"></p><p class="es-aw-rolle">${esc(ichRolle())}</p></div>
          <dl class="es-aw-daten"><div><dt>Standort</dt><dd>Pixelwerk Köln</dd></div><div><dt>${me.start ? 'Dabei seit' : 'Seit heute'}</dt><dd>${seit}</dd></div></dl>
          <div class="es-aw-code" aria-hidden="true"><span id="esAwCode"></span><small id="esAwNr"></small></div>
        </div>
      </aside>
    </div>
    <div class="es-fuss"><p class="es-hinweis" id="esHinweis" aria-live="polite"></p><button type="button" class="btn primary big" id="esWeiter">Weiter</button></div>
  </section>`;
}
/* Alles, was von Name, Avatar und Farbe abhängt, neu zeichnen. wackeln: Der Ausweis zeigt kurz, dass er reagiert hat. */
function esCharNeu(w, wackeln) {
  const n = ichName(), px = avatarPx(), leer = '0'.repeat(AV_N * AV_N), fid = esFarbId();
  w.querySelectorAll('.es-kachel').forEach(b => b.setAttribute('aria-pressed', AV_VORLAGEN[+b.dataset.v].px === px));
  w.querySelectorAll('.es-farbe').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === fid));
  [...$('#esRaster', w).children].forEach((el, i) => { el.style.background = AV_PAL[parseInt((px || leer)[i], 16)] || ''; });
  const foto = $('#esAwBild', w); foto.innerHTML = px ? avatarSvg(px, 112, true) : esc(n ? n[0].toUpperCase() : '?'); foto.classList.toggle('es-ohne', !px);
  const name = $('#esAwName', w); name.textContent = n || 'Dein Name'; name.classList.toggle('es-leer', !n);
  let h = esHash(n + '|' + px), bars = '';
  for (let i = 0; i < 30; i++) { h = Math.imul(h ^ h >>> 15, 2246822519) >>> 0; bars += '<i class="' + (i % 2 ? '' : 'an') + '" style="flex-grow:' + (1 + h % 3) + '"></i>'; }
  $('#esAwCode', w).innerHTML = bars; $('#esAwNr', w).textContent = 'PW-' + String(esHash(n) % 9000 + 1000);
  esFuss(w, n ? '' : 'Dein Name fehlt noch.', !!n);
  if (wackeln) esWackeln($('#esAusweis', w), 'es-wackel');
}
function esCharAn(w, l) {
  /* Immer frisch über ich() schreiben: S kann unterwegs ersetzt werden (Abgleich mit fortschritt.json) */
  const name = $('#esName', w), raster = $('#esRaster', w), zellen = [...raster.children];
  if (!l.erneut && ich().avatar == null) ich().avatar = AV_VORLAGEN[0].px; /* neu hier: gleich mit Gesicht anfangen. Ein selbst geleerter Avatar ('') bleibt leer. */
  const fest = () => { save(); lookAnwenden(); esCharNeu(w, true); };
  name.oninput = () => { ichNameSetzen(name); fest(); };
  w.querySelectorAll('.es-kachel').forEach(b => b.onclick = () => { ich().avatar = AV_VORLAGEN[+b.dataset.v].px; fest(); });
  /* Zufall: ein paar schnelle Würfe hintereinander, der letzte bleibt */
  const zufall = $('#esZufall', w);
  zufall.onclick = () => {
    if (zufall.classList.contains('es-rollt')) return;
    if (!bewegungAn()) { ich().avatar = zufallsAvatar(); fest(); return; }
    zufall.classList.add('es-rollt');
    for (let i = 1; i <= 5; i++) esSpaeter(() => { ich().avatar = zufallsAvatar(); if (i < 5) esCharNeu(w); else { zufall.classList.remove('es-rollt'); fest(); } }, i * 70);
  };
  const malen = $('#esMalen', w), feld = $('#esMalFeld', w);
  malen.onclick = () => { l.malen = !l.malen; esMerken(); feld.hidden = !l.malen; malen.setAttribute('aria-expanded', l.malen); if (l.malen) feld.scrollIntoView({ block: 'nearest' }); };
  w.querySelectorAll('.es-palette button').forEach(b => b.onclick = () => { esMalFarbe = +b.dataset.c; w.querySelectorAll('.es-palette button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  /* Malen: klicken oder ziehen, mit Maus, Finger oder Stift. Gespeichert wird beim Loslassen. */
  const setze = i => { const px = (avatarPx() || '0'.repeat(AV_N * AV_N)).split(''); px[i] = esMalFarbe.toString(16); ich().avatar = px.join(''); esCharNeu(w); };
  const zelleBei = e => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.parentNode === raster ? zellen.indexOf(el) : -1; };
  let zieht = false, cur = 0;
  const zeiger = i => { zellen[cur].classList.remove('es-cur'); cur = i; zellen[cur].classList.add('es-cur'); };
  raster.onpointerdown = e => { const i = zelleBei(e); if (i < 0) return; e.preventDefault(); zieht = true; try { raster.setPointerCapture(e.pointerId); } catch (x) {} zeiger(i); setze(i); };
  raster.onpointermove = e => { if (!zieht) return; const i = zelleBei(e); if (i >= 0 && i !== cur) { zeiger(i); setze(i); } };
  raster.onpointerup = raster.onpointercancel = () => { if (zieht) { zieht = false; fest(); } };
  raster.onkeydown = e => {
    const schritt = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -AV_N, ArrowDown: AV_N }[e.key];
    if (schritt) { const i = cur + schritt; if (i >= 0 && i < zellen.length && (Math.abs(schritt) > 1 || (i / AV_N | 0) === (cur / AV_N | 0))) zeiger(i); e.preventDefault(); }
    else if (e.key === ' ' || e.key === 'Enter') { setze(cur); fest(); e.preventDefault(); }
  };
  zeiger(0);
  $('#esLeeren', w).onclick = () => { ich().avatar = ''; fest(); };
  w.querySelectorAll('.es-farbe').forEach(b => b.onclick = () => {
    const id = b.dataset.p; if (id === esFarbId()) return;
    if (id === 'pixelwerk') delete ich().farbe; else { const p = FARB_PRESETS.find(x => x.id === id); ich().farbe = { id, a: p.a, g: p.g, tint: true }; }
    fest();
  });
  esCharNeu(w);
  if (!name.value && matchMedia('(hover: hover)').matches) name.focus({ preventScroll: true });
}

/* ---------- 3. Erster Tag: Dialog zum Durchklicken ---------- */
/* Liefert den Dialog bis zur nächsten offenen Frage. ['?', feld, antworten] ist eine eigene Zeile: beantwortet eine Sprechblase, offen die Knöpfe. */
function esDialog(l) {
  const n = ichName();
  const d = [['boss', 'Hallo ' + n + ', willkommen bei Pixelwerk! Wir bauen Web-Apps für Kunden, ab heute mit dir.'], ['?', 'a1', ['Danke, ich freu mich!', 'Ehrlich gesagt: Ich bin nervös.']]];
  if (l.a1 == null) return d;
  d.push(['boss', ['Wir uns auch. Du bekommst gleich dein erstes Ticket.', 'Das gehört dazu. Hier darf jeder fragen, bis es sitzt.'][l.a1]],
    ['boss', 'Das ist Toni, dein Mentor. Was du hier brauchst, lernst du mit ihm.'],
    ['toni', 'Hi ' + n + '! Ich führ dich durch die Kapitel.'],
    ['toni', 'Wie viel Angular hattest du schon?'],
    ['?', 'level', ['Noch gar keins', 'Etwas HTML und JavaScript', 'Ich kenne schon ein Framework']]);
  if (l.level == null) return d;
  /* Grundlagen (HTML, CSS, TypeScript, Werkzeuge) mitmachen oder gleich mit Angular? Das vierte Feld ist die Antwort, die Toni
     zum Vorwissen vorschlägt: ohne Vorwissen die Grundlagen, wer schon ein Framework kennt, direkt Angular. Gespeichert in S.ich.weg. */
  d.push(['toni', ['Kein Problem. Magst du vorher die Grundlagen machen: HTML, CSS, TypeScript?', 'Gute Basis. Nimmst du die Grundlagen trotzdem mit, oder gleich Angular?', 'Dann kennst du vieles schon. Grundlagen mitmachen oder direkt Angular?'][l.level]],
    ['?', 'weg', ['Mit Grundlagen anfangen', 'Direkt mit Angular starten'], l.level === 2 ? 1 : 0]);
  if (l.weg == null) return d;
  d.push(['toni', ['Gut. Wir starten mit HTML, CSS, TypeScript und deinen Werkzeugen.', 'Gut. Die Grundlagen bleiben frei anwählbar, falls du sie brauchst.'][l.weg]]);
  return d;
}
function esTagHtml() {
  return `<section class="es-bild es-tag">
    <div class="es-kopf"><p class="es-ort">Montag, 8:45 Uhr</p><h1 id="esT" tabindex="-1">Dein erster Tag</h1></div>
    <div class="es-chat" id="esChat" role="log" aria-live="polite" tabindex="-1"></div>
    <div class="es-antworten" id="esAntworten" role="group" aria-label="Deine Antwort"></div>
    <div class="es-fuss"><button type="button" class="btn primary big" id="esWeiter" hidden>Weiter</button></div>
  </section>`;
}
function esZeileHtml(wer, text) {
  const c = CAST[wer], selbst = wer === 'du';
  return `<span class="es-av${selbst ? ' es-av-ich"' : '" style="' + figurStil(c.color) + '"'} aria-hidden="true">${selbst ? avatarHtml() : c.initial}</span><div class="es-blase"><span class="es-wer">${esc(selbst ? ichName() || 'Du' : c.name)}${selbst ? '' : '<small>' + esc(c.role) + '</small>'}</span><p>${esc(text)}</p></div>`;
}
function esTagAn(w, l) {
  const log = $('#esChat', w), antw = $('#esAntworten', w), weiterBtn = $('#esWeiter', w);
  const sanft = () => ({ block: 'nearest', behavior: bewegungAn() ? 'smooth' : 'auto' });
  let i = 0, eilig = false, tippt = null, timer = 0, zuletzt = '';
  const spaeter = (fn, ms) => { timer = esSpaeter(() => { timer = 0; fn(); }, ms); };
  const dazu = (cls, html, sofort) => { const el = document.createElement('div'); el.className = 'es-zeile ' + cls + (sofort ? '' : ' es-neu'); el.innerHTML = html; log.appendChild(el); return el; };
  /* Schreibt dieselbe Figur gleich nochmal, steht die zweite Blase ohne Avatar und Namen darunter (es-folge) */
  const zeile = (z, sofort) => {
    const wer = z[0] === '?' ? 'du' : z[0], folge = wer === zuletzt ? ' es-folge' : ''; zuletzt = wer; i++;
    return wer === 'du' ? dazu('es-ich' + folge, esZeileHtml('du', z[2][l[z[1]]]), sofort) : dazu(folge, esZeileHtml(wer, z[1]), sofort);
  };
  const weiter = () => {
    const z = esDialog(l)[i];
    if (tippt) { tippt.remove(); tippt = null; }
    if (!z) { weiterBtn.hidden = false; weiterBtn.focus({ preventScroll: true }); if (log.lastElementChild) log.lastElementChild.scrollIntoView(sanft()); return; } /* die letzte Blase bleibt über dem Knopf sichtbar */
    if (z[0] === '?') {
      if (l[z[1]] != null) { zeile(z, eilig).scrollIntoView(sanft()); weiter(); return; }
      antw.innerHTML = z[2].map((t, k) => `<button type="button" class="btn es-antwort${k === z[3] ? ' es-empf' : ''}" data-k="${k}">${esc(t)}${k === z[3] ? '<small class="es-empf-t">Tonis Vorschlag</small>' : ''}</button>`).join('');
      antw.querySelectorAll('button').forEach(b => b.onclick = () => {
        l[z[1]] = +b.dataset.k; esMerken(); if (z[1] === 'level') { ich().level = l.level; save(); } if (z[1] === 'weg') { ich().weg = ES_WEGE[l.weg]; save(); }
        antw.innerHTML = ''; eilig = false; log.focus({ preventScroll: true }); weiter();
      });
      antw.scrollIntoView(sanft());
      return;
    }
    if (eilig || !bewegungAn()) { zeile(z, true).scrollIntoView({ block: 'nearest' }); weiter(); return; }
    /* kurzes „schreibt …“, dann die Nachricht, dann eine Atempause */
    tippt = dazu('es-tippt' + (z[0] === zuletzt ? ' es-folge' : ''), `<span class="es-av" style="${figurStil(CAST[z[0]].color)}" aria-hidden="true">${CAST[z[0]].initial}</span><div class="es-blase" aria-hidden="true"><i></i><i></i><i></i></div>`);
    tippt.scrollIntoView(sanft());
    spaeter(() => { tippt.remove(); tippt = null; zeile(z).scrollIntoView(sanft()); spaeter(weiter, 400); }, 450 + Math.min(400, z[1].length * 5));
  };
  /* Für Eilige: Klick in den Chat oder Enter zeigt sofort alles bis zur nächsten Frage */
  esChatEile = log.onclick = () => { if (!timer) return false; clearTimeout(timer); timer = 0; eilig = true; weiter(); return true; };
  /* Was schon beantwortet ist (Neuladen, Zurück), steht sofort da */
  const d = esDialog(l); let schon = l.weg != null ? d.length : 0;
  d.forEach((z, k) => { if (z[0] === '?' && l[z[1]] != null) schon = Math.max(schon, k + 1); });
  while (i < schon) zeile(d[i], true);
  weiter();
}

/* ---------- 4. Team kennenlernen ---------- */
function esTeamHtml(l) {
  return `<section class="es-bild es-team">
    <div class="es-kopf"><h1 id="esT" tabindex="-1">Dein Team</h1></div>
    <ul class="es-karten">${ES_TEAM.map(([k, satz]) => { const c = CAST[k], da = l.team.includes(k); return `<li><button type="button" class="es-karte${da ? ' es-da' : ''}" data-k="${k}" aria-pressed="${da}" style="--av:${c.color}">
      <span class="es-av" style="${figurStil(c.color)}" aria-hidden="true">${c.initial}</span><span class="es-kwer"><b>${esc(c.name)}</b><small>${esc(c.role)}</small></span>
      <span class="es-ksatz">${da ? '„' + esc(satz) + '“' : ''}</span><span class="es-khallo">Hallo sagen</span><span class="es-kok" aria-hidden="true">✓</span></button></li>`; }).join('')}</ul>
    <p class="nur-sr" id="esSagt" aria-live="polite"></p>
    <div class="es-fuss"><p class="es-hinweis" id="esHinweis" aria-live="polite"></p><button type="button" class="btn primary big" id="esWeiter">Weiter</button></div>
  </section>`;
}
function esTeamAn(w, l) {
  const stand = () => { const n = l.team.length; esFuss(w, n < 3 ? 'Sag mindestens dreien Hallo. <b>' + n + ' von 3</b>' : n < ES_TEAM.length ? '<b>' + n + ' von ' + ES_TEAM.length + '</b> begrüßt' : 'Alle begrüßt', n >= 3); };
  w.querySelectorAll('.es-karte').forEach(b => b.onclick = () => {
    const k = b.dataset.k, satz = ES_TEAM.find(t => t[0] === k)[1];
    if (!l.team.includes(k)) {
      l.team.push(k); esMerken();
      const me = ich(); me.team = [...new Set([...(Array.isArray(me.team) ? me.team : []), k])]; save();
      b.classList.add('es-da'); b.setAttribute('aria-pressed', 'true'); $('.es-ksatz', b).textContent = '„' + satz + '“';
      stand();
    }
    esWackeln(b, 'es-dreh'); $('#esSagt', w).textContent = CAST[k].name + ': ' + satz;
  });
  stand();
}

/* ---------- 5. Dein Coach: mit eigener KI oder ohne ----------
   Mit KI: Anbieter wählen, eigenen API-Schlüssel einfügen, „Prüfen und speichern“ holt die Modelle und nimmt das empfohlene.
   Gespeichert wird wie im Profil unter „Coach Toni“ (aiSave in ki.js, nur in diesem Browser). Ohne KI geht es einfach weiter. */
var ES_KI_ANB = ['claude', 'openai', 'gemini', 'deepseek'];
function esKiHtml(l) {
  const c = aiCfg(), wahl = l.ki || (c.key ? 'mit' : null);
  return `<section class="es-bild es-ki">
    <div class="es-kopf"><h1 id="esT" tabindex="-1">Dein Coach</h1><p>Toni kann mit einer KI noch mehr. Muss aber nicht.</p></div>
    <div class="es-chat es-ki-toni"><div class="es-zeile">${esZeileHtml('toni', 'Mit einer KI lese ich deinen Code, schreib dir Fragen zu dem, was bei dir wackelt, und erkläre so, wie du lernst. Ohne KI merkt sich die App trotzdem, was du kannst.')}</div></div>
    <div class="es-ki-wahl" role="group" aria-label="Mit oder ohne KI">
      <button type="button" class="es-ki-k" data-ki="mit" aria-pressed="${wahl === 'mit'}"><b>Mit eigener KI</b><small>Claude, ChatGPT, Gemini oder DeepSeek, mit deinem API-Schlüssel</small></button>
      <button type="button" class="es-ki-k" data-ki="ohne" aria-pressed="${wahl === 'ohne'}"><b>Ohne KI</b><small>Alles läuft. Die KI kannst du später im Profil einrichten.</small></button>
    </div>
    <div class="es-ki-form" id="esKiForm"${wahl === 'mit' ? '' : ' hidden'}>
      <div class="hub-wahlen" id="esKiAnb" role="group" aria-label="KI-Anbieter">${ES_KI_ANB.map(a => `<button type="button" class="hub-wahl" data-a="${a}">${esc(KI_ANBIETER[a].name)}</button>`).join('')}</div>
      <label class="fld" for="esKiKey" id="esKiKeyL">API-Schlüssel</label>
      <div class="hub-zeile"><input id="esKiKey" type="password" autocomplete="off" spellcheck="false"><button class="btn" id="esKiPruef" type="button">Prüfen und speichern</button></div>
      <p class="small" id="esKiMsg" aria-live="polite"></p>
      <p class="muted small">Schlüssel gibt es bei <span id="esKiWo"></span>. Er bleibt nur in diesem Browser. Die Kosten laufen über dein Konto beim Anbieter, am besten mit Ausgabelimit.</p>
    </div>
    <div class="es-fuss"><p class="es-hinweis" id="esHinweis" aria-live="polite"></p><button type="button" class="btn primary big" id="esWeiter">Weiter</button></div>
  </section>`;
}
function esKiAn(w, l) {
  const form = $('#esKiForm', w), key = $('#esKiKey', w), msg = $('#esKiMsg', w);
  const stand = () => {
    const c = aiCfg(), wahl = l.ki || (c.key ? 'mit' : null);
    w.querySelectorAll('.es-ki-k').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ki === wahl)));
    form.hidden = wahl !== 'mit';
    esFuss(w, wahl === 'ohne' ? 'Einrichten kannst du die KI jederzeit im Profil unter „Coach Toni“.' : wahl === 'mit' ? (c.key ? 'Toni nutzt <b>' + esc(kiName(c)) + '</b>.' : 'Ohne Schlüssel geht es auch. Dann einfach weiter.') : '', true);
  };
  const anbieter = a => {
    const k = KI_ANBIETER[a], c = aiCfg(); l.anb = a; esMerken();
    w.querySelectorAll('#esKiAnb button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.a === a)));
    $('#esKiKeyL', w).textContent = k.name + '-API-Schlüssel'; key.placeholder = k.ph; $('#esKiWo', w).textContent = k.wo;
    key.value = c.anbieter === a ? c.key || '' : ''; msg.textContent = c.key && c.anbieter === a ? 'Gespeichert: ' + k.name + ' (' + (c.model || k.std) + ').' : '';
  };
  w.querySelectorAll('.es-ki-k').forEach(b => b.onclick = () => {
    l.ki = b.dataset.ki; esMerken(); stand();
    if (l.ki === 'mit') key.focus({ preventScroll: true });
  });
  w.querySelectorAll('#esKiAnb button').forEach(b => b.onclick = () => anbieter(b.dataset.a));
  const speichern = (a, k, model) => { aiSave({ anbieter: a, key: k, model }); l.ki = 'mit'; esMerken(); stand(); };
  $('#esKiPruef', w).onclick = async () => {
    const a = l.anb, k = key.value.trim();
    if (!k) { msg.textContent = 'Erst den Schlüssel einfügen.'; key.focus(); return; }
    msg.textContent = 'Prüfe Schlüssel…';
    try {
      const list = await kiModelle(a, k); if (!list.length) throw new Error('Keine passenden Modelle gefunden');
      const def = pickDefaultModel(list, a);
      speichern(a, k, def.id);
      msg.textContent = 'Klappt. Toni nutzt jetzt ' + KI_ANBIETER[a].name + ' (' + def.id + ').';
    } catch (e) {
      msg.innerHTML = esc(e instanceof TypeError ? 'Keine Verbindung zu ' + KI_ANBIETER[a].name + '.' : 'Klappt nicht: ' + e.message) + ' <button type="button" class="linkbtn" id="esKiTrotzdem">Trotzdem speichern</button>';
      $('#esKiTrotzdem', w).onclick = () => { speichern(a, k, KI_ANBIETER[a].std); msg.textContent = 'Gespeichert. Ob der Schlüssel geht, merkst du bei der ersten Frage an Toni.'; };
    }
  };
  const c = aiCfg(); anbieter(l.anb || (c.key && KI_ANBIETER[c.anbieter] ? c.anbieter : 'claude'));
  stand();
}

/* ---------- 6. So läuft’s hier ---------- */
function esRegelnHtml(l) {
  const mein = rank(S.xp).name;
  return `<section class="es-bild es-regeln">
    <div class="es-kopf"><h1 id="esT" tabindex="-1">So läuft’s hier</h1><p>Ein Kapitel ist ein Ticket.</p></div>
    <div class="es-regeln-g">
      <ol class="es-weg">${ES_WEG.map((s, i) => `<li style="--i:${i}"><span class="es-wnr" aria-hidden="true">${i + 1}</span><b>${s[0]}</b><small>${s[1]}</small></li>`).join('')}</ol>
      <p class="es-xp" style="--i:4"><i aria-hidden="true">→</i><b>+ XP</b><i aria-hidden="true">→</i><span>Mit XP steigst du auf.</span></p>
      <ol class="es-leiter" style="--i:5" aria-label="Ränge, von oben nach unten">${RANKS.slice().reverse().map(r => `<li class="${r[1] === mein ? 'es-du' : ''}">${r[1] === mein ? avatarHtml('es-lav') : ''}<span>${esc(r[1])}</span><small>${r[1] === mein ? 'Du' : r[0] + ' XP'}</small></li>`).join('')}</ol>
    </div>
    <p class="es-wdh" style="--i:6"><span aria-hidden="true">↻</span> Was du gelernt hast, kommt in Abständen wieder. So bleibt es.</p>
    <p class="es-wdh es-sachen" style="--i:7"><span aria-hidden="true">🎁</span> Für abgeschlossene Kapitel und Phasen gewinnst du Sachen für deinen Avatar.</p>
    <div class="es-fuss"><button type="button" class="btn primary big" id="esWeiter">${l.erneut ? 'Zum Schreibtisch' : 'Erstes Ticket holen'}</button></div>
  </section>`;
}

/* ---------- Tastatur: Enter und Pfeil rechts gehen weiter, Pfeil links zurück, 1 bis 3 wählen eine Antwort ----------
   In der Einfangphase, damit „/“ hier nicht die Suche der Kopfzeile öffnet (die ist solange ausgeblendet). */
document.addEventListener('keydown', e => {
  if (!esLauf || e.repeat || e.altKey || e.ctrlKey || e.metaKey || !document.body.classList.contains('es-an') || document.querySelector('dialog[open]')) return;
  const w = document.querySelector('#main > .es'), t = e.target; if (!w || !t.closest || t.closest('#esRaster')) return;
  if (e.key === '/' && !t.closest('input, textarea, select')) { e.stopPropagation(); return; }
  const vor = () => {
    const b = $('#esWeiter', w);
    if (!b.hidden && !b.disabled) b.click(); else if (!esChatEile || !esChatEile()) esWackeln($('.es-antworten:not(:empty)', w) || $('#esHinweis', w), 'es-ruck');
    e.preventDefault();
  };
  if (e.key === 'Tab') esPerMaus = false;
  /* Enter gehört dem Knopf, auf dem der Tastatur-Fokus steht. Hat man ihn nur mit der Maus angeklickt, geht Enter weiter. */
  else if (e.key === 'Enter' && t.id === 'esKiKey') { $('#esKiPruef', w).click(); e.preventDefault(); }
  else if (e.key === 'Enter') { if (esPerMaus || !t.closest('button, a, summary')) vor(); }
  else if (t.closest('input, textarea, select')) return;
  else if (e.key === 'ArrowRight') vor();
  else if (e.key === 'ArrowLeft') { esGeh(-1); e.preventDefault(); }
  else if (/^[1-3]$/.test(e.key)) { const b = w.querySelectorAll('.es-antwort')[+e.key - 1]; if (b) { b.click(); e.preventDefault(); } }
}, true);
document.addEventListener('pointerdown', () => { esPerMaus = true; }, true);
