/* ===== Spiel-Einstieg beim ersten Start =====
   Sechs Bilder: Titel → Charakter → Erster Tag → Team → Dein Coach (mit eigener KI oder ohne) → So läuft’s. route() (start.js) fragt bei jedem Seitenwechsel introNeeded()
   und ruft dann nur renderIntro(main). Name, Avatar, Farbe, Vorkenntnisse und Team stehen sofort in S.player (gleiche Felder wie im
   Profil-Dialog). Bei welchem Bild man ist, merkt sich sessionStorage: Neuladen setzt dort fort.
   introStart(): den Einstieg nochmal ansehen (Link im Profil), ohne Fortschritt zu ändern. */
var INTRO_KEY = 'pw-einstieg', INTRO_N = 6;
var introRun = null, introTime = [], introChatHurry = null, introPaintColor = 1, introUrl = '', introByMouse = false;

/* Wer sich im Team vorstellt: ein Satz in der eigenen Stimme und wobei man miteinander zu tun hat (passend zu den Szenen der Kapitel) */
var INTRO_TEAM = [
  ['toni', 'Ich schau mir deinen Code an, bevor er live geht. Und ich erklär dir jeden Schritt.'],
  ['sara', 'Von mir kommen deine Tickets, immer mit Akzeptanzkriterien.'],
  ['jonas', 'Ich baue die API, du das Frontend. Und bei mir geht es immer.'],
  ['mia', 'Ich teste, was du baust. Und ich finde jeden Bug.'],
  ['leon', 'Ich rede mit den Kunden. Hakt was im Teamboard, hörst du es von mir.'],
  ['ricky', 'Bei Quick & Dirty hieß es immer: Läuft doch. Meinen Code reviewst du noch, hehe.']
];
var INTRO_PATH = [['Ticket lesen', 'Der Team-Chat sagt, worum es geht.'], ['Verstehen', 'Kurze Folien mit Code.'], ['Quiz', 'Ein paar Fragen, sofort mit Antwort.'], ['Umsetzen', 'Ab Phase 1 schreibst du echten Angular-Code.']];
/* Antwort auf die Frage nach den Grundlagen, wie sie in S.player.weg steht (siehe basicsOptional in base.js) */
var INTRO_PATHS = ['grundlagen', 'angular'];
var INTRO_PAINT_COLORS = ['Radierer', 'Schwarz', 'Weiß', 'Hautton hell', 'Hautton mittel', 'Braun', 'Gelb', 'Blau', 'Rot', 'Grün', 'Lila', 'Grau', 'Rosa', 'Hautton dunkel', 'Orange', 'Dunkelblau'];
/* Pixel-Schrift für den Schriftzug auf dem Titelbild, 7 Zeilen je Buchstabe */
var INTRO_FONT = {
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'], I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'], E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'], W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'], K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#']
};
var INTRO_LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="3" width="34" height="34" rx="9" fill="var(--accent-ink)"/><path d="M15 13 9 20l6 7M25 13l6 7-6 7" fill="none" stroke="var(--accent)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 11.5 18 28.5" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"/></svg>';

/* ---------- Zustand des Durchlaufs ---------- */
function introRunRead() {
  if (introRun) return introRun;
  try {
    const v = migrateState(JSON.parse(sessionStorage.getItem(INTRO_KEY)));
    if (v && typeof v === 'object') introRun = {
      image: Math.max(0, Math.min(INTRO_N - 1, v.image | 0)), repeated: !!v.repeated, paint: !!v.paint,
      a1: v.a1 === 0 || v.a1 === 1 ? v.a1 : null, level: [0, 1, 2].includes(v.level) ? v.level : null, journey: v.journey === 0 || v.journey === 1 ? v.journey : null,
      team: Array.isArray(v.team) ? INTRO_TEAM.map(t => t[0]).filter(k => v.team.includes(k)) : [],
      ai: v.ai === 'mit' || v.ai === 'ohne' ? v.ai : null, prov: AI_PROVIDERS[v.prov] ? v.prov : null
    };
  } catch (e) {}
  return introRun;
}
function introRemember() { try { sessionStorage.setItem(INTRO_KEY, JSON.stringify(introRun)); } catch (e) {} }
function introLater(fn, ms) { const t = setTimeout(fn, ms); introTime.push(t); return t; }
function introStop() { introTime.forEach(clearTimeout); introTime = []; introChatHurry = null; }
function introFinish() { introStop(); introRun = null; try { sessionStorage.removeItem(INTRO_KEY); } catch (e) {} }
/* Bis zu welchem Bild man schon darf: ohne Namen kein Dialog, ohne Antwort kein Team, ohne drei Begrüßte kein Coach.
   Der Coach hält nicht auf: Ohne KI geht es genauso weiter. */
function introMaxImage() { const l = introRun; return !meName() ? 1 : l.level == null || l.journey == null ? 2 : l.team.length < 3 ? 3 : 5; }

function introNeeded() {
  document.documentElement.classList.remove('intro-fwd'); /* ab jetzt entscheidet body.intro-on (siehe 10-intro.css) */
  const run = introRunRead();
  if (run && run.repeated) return true;
  const me = S.player || {};
  const pristine = !me.start && !S.xp && !Object.keys(S.done || {}).length && !Object.keys(S.steps || {}).length;
  if (!pristine) { if (run) introFinish(); return false; } /* z. B. gerade einen Spielstand geladen */
  return !!run || !String(me.name || '').trim();
}
function introStart() {
  introStop();
  introRun = { image: 0, repeated: true, paint: false, a1: null, level: null, journey: null, team: [] }; introRemember();
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  route();
}
function renderIntro(main) {
  if (!introRunRead()) { introRun = { image: 0, repeated: false, paint: false, a1: null, level: null, journey: null, team: [] }; introRemember(); }
  introRun.image = Math.min(introRun.image, introMaxImage());
  const present = main.firstElementChild;
  if (present && present.classList.contains('intro') && +present.dataset.image === introRun.image) return; /* schon da: nichts verlieren */
  introShow(main);
}

/* ---------- Rahmen: Leiste oben, Bildwechsel, Ende ---------- */
function introShow(main, back) {
  introStop();
  const l = introRun, b = l.image;
  main.innerHTML = `<div class="intro${back ? ' intro-back' : ''}" data-image="${b}">
    <div class="intro-bar">
      <button type="button" class="intro-return" id="introBack" aria-label="Zurück"${b ? '' : ' hidden'}><span aria-hidden="true">←</span></button>
      <ol class="intro-dots" role="img" aria-label="Schritt ${b + 1} von ${INTRO_N}">${Array.from({ length: INTRO_N }, (x, i) => `<li class="${i < b ? 'past' : i === b ? 'now' : ''}"></li>`).join('')}</ol>
      <button type="button" class="linkbtn intro-skip" id="introSkip">${l.repeated ? 'Beenden' : 'Überspringen'}</button>
    </div>
    ${[introTitleHtml, introCharHtml, introDayHtml, introTeamHtml, introAiHtml, introRulesHtml][b](l)}
  </div>`;
  const w = main.firstElementChild;
  /* e.detail > 1 ist der zweite Klick eines Doppelklicks: Er soll nicht gleich das nächste Bild wegklicken */
  $('#introBack', w).onclick = e => { if (e.detail < 2) introGo(-1); };
  $('#introNext', w).onclick = e => { if (e.detail < 2) { if (b === INTRO_N - 1) introEnd(l.repeated ? 'start' : CH[0].id, !l.repeated); else introGo(1); } };
  $('#introSkip', w).onclick = () => introEnd('start', false);
  introHistory();
  window.scrollTo(0, 0);
  if (b) $('#introT', w).focus({ preventScroll: true });
  [introTitleOn, introCharOn, introDayOn, introTeamOn, introAiOn, () => {}][b](w, l);
}
function introGo(d) {
  const fresh = Math.max(0, Math.min(introMaxImage(), introRun.image + d));
  if (fresh === introRun.image) return;
  introRun.image = fresh; introRemember(); introShow($('#main'), d < 0);
}
function introEnd(goal, celebrateIt) {
  const me = player();
  if (!me.start) me.start = Date.now();
  save(); introFinish();
  let replaced = false; /* der eigene Verlaufs-Eintrag wird zum Ziel, sonst ganz normal weiter */
  if (history.state && history.state.es) { try { history.replaceState(null, '', '#' + goal); replaced = true; } catch (e) {} }
  if (!replaced) location.hash = '#' + goal;
  route();
  if (celebrateIt) cheerBig('Willkommen im Team!', 'Dein erstes Ticket wartet.');
}
/* Zurück-Taste des Browsers (am Handy die Wischgeste) = ein Bild zurück. Dafür liegt ab dem zweiten Bild genau ein eigener Eintrag im Verlauf.
   Am Ende wird er zum Ziel, es bleibt also nichts zurück. Lässt der Browser den Eintrag nicht zu, verlässt Zurück wie gewohnt die Seite. */
function introHistory() {
  try {
    if (introRun.image > 0 && !(history.state && history.state.es)) history.pushState({ es: 1 }, '');
    if (history.state && history.state.es) introUrl = location.href;
  } catch (e) {}
}
/* Nur wenn die Adresse gleich geblieben ist, war es der Schritt vom eigenen Eintrag zurück (ein Hash-Wechsel löst popstate auch aus) */
window.addEventListener('popstate', () => {
  if (introRun && introRun.image > 0 && document.body.classList.contains('intro-on') && !(history.state && history.state.es) && location.href === introUrl) introGo(-1);
});
/* Kurze Rückmeldung per CSS-Animation. Läuft sie noch, startet sie nicht neu: So zittert der Ausweis beim Tippen nicht. */
function introWobble(el, cls) {
  if (!el || !motionOn() || el.classList.contains(cls)) return;
  const ending = e => { if (e.target === el) { el.classList.remove(cls); el.removeEventListener('animationend', ending); } };
  el.classList.add(cls); el.addEventListener('animationend', ending);
}
function introFooter(w, notice, ready) { const h = $('#introNotice', w); if (h.innerHTML !== notice) h.innerHTML = notice; $('#introNext', w).disabled = !ready; }

/* ---------- 1. Titelbild ---------- */
function introLettering() {
  let x = 0, r = '';
  [...'PIXELWERK'].forEach((b, n) => {
    INTRO_FONT[b].forEach((codeLine, y) => [...codeLine].forEach((c, i) => { if (c === '#') r += `<rect${n > 4 ? ' class="intro-wk"' : ''} x="${x + i + .05}" y="${y + .05}" width=".9" height=".9" style="--d:${Math.random() * 420 | 0}ms"/>`; }));
    x += INTRO_FONT[b][0].length + 1;
  });
  return `<svg class="intro-word" viewBox="0 0 ${x - 1} 7" aria-hidden="true">${r}</svg>`;
}
/* Ruhiger Hintergrund: einzelne Kästchen im Raster, die langsam auf- und abblenden (ohne Bewegung stehen sie still) */
/* Das Raster hängt an der Bildmitte und reicht für die längere Bildschirmseite: Es stimmt auch nach Drehen oder Größenänderung. */
function introPixelHtml() {
  const g = 40, r = Math.ceil(Math.min(2000, Math.max(innerWidth, innerHeight, screen.width || 0, screen.height || 0)) / g / 2) + 1, n = Math.round(4 * r * r * .09);
  let h = '';
  for (let i = 0; i < n; i++) {
    const x = (Math.random() * 2 * r | 0) - r, y = (Math.random() * 2 * r | 0) - r;
    if (Math.abs(x + .5) < 10 && y >= -4 && y <= 4) continue; /* Schriftzug und Knopf bleiben frei */
    h += `<i${i % 5 ? '' : ' class="intro-gr"'} style="--x:${x};--y:${y};--o:${(.05 + Math.random() * .12).toFixed(2)};animation-duration:${(3 + Math.random() * 5).toFixed(1)}s;animation-delay:-${(Math.random() * 8).toFixed(1)}s"></i>`;
  }
  return h;
}
function introTitleHtml(l) {
  return `<div class="intro-pixel" aria-hidden="true">${introPixelHtml()}</div>
  <section class="intro-image intro-title">
    <h1 class="intro-logo" id="introT"><span class="sr-only">Pixelwerk</span>${introLettering()}</h1>
    <p class="intro-sub">Angular lernen, vom ersten Tag bis Tech Lead</p>
    <button type="button" class="btn primary big" id="introNext">${l.repeated ? 'Nochmal ansehen' : 'Neues Spiel'}</button>
    ${l.repeated ? '' : '<button type="button" class="linkbtn intro-load" id="introLoad">Spielstand laden</button><input type="file" id="introFile" accept="application/json,.json" hidden>'}
  </section>`;
}
function introTitleOn(w) {
  const file = $('#introFile', w); if (!file) return;
  $('#introLoad', w).onclick = () => file.click();
  /* importProgress lädt die Datei, speichert und ruft route(): Hat der Spielstand Fortschritt, ist der Einstieg damit vorbei */
  file.onchange = () => { const f = file.files[0]; if (f) importProgress(f); file.value = ''; };
}

/* ---------- 2. Charakter erstellen ---------- */
function introHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
function introColorId() { const f = player().colour; return f && f.a ? f.id || 'eigen' : 'pixelwerk'; }
function introCharHtml(l) {
  const me = player(), since = new Date(me.start || Date.now()).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `<section class="intro-image intro-char">
    <div class="intro-head"><h1 id="introT" tabindex="-1">${l.repeated ? 'Dein Charakter' : 'Erstell deinen Charakter'}</h1></div>
    <div class="intro-char-g">
      <div class="intro-slider">
        <label class="intro-field" for="introName"><span class="intro-l">Name</span><input id="introName" maxlength="${ME_NAME_MAX}" autocomplete="given-name" enterkeyhint="done" placeholder="Wie heißt du?" value="${esc(me.name || '')}"></label>
        <div class="intro-field" role="group" aria-labelledby="introAvL"><span class="intro-l" id="introAvL">Avatar</span>
          <div class="intro-tiles">${AV_TEMPLATES.map((v, i) => `<button type="button" class="intro-tile" data-v="${i}" aria-label="Vorlage ${esc(v.n)}">${avatarSvg(v.px, 40)}</button>`).join('')}</div>
          <div class="intro-tiles"><button type="button" class="btn intro-mini" id="introRandom"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="2" width="16" height="16" rx="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M5.5 5.5h2.6v2.6H5.5zM11.9 5.5h2.6v2.6h-2.6zM8.7 8.7h2.6v2.6H8.7zM5.5 11.9h2.6v2.6H5.5zM11.9 11.9h2.6v2.6h-2.6z"/></svg>Zufall</button>
            <button type="button" class="btn intro-mini" id="introPaint" aria-expanded="${l.paint}" aria-controls="introPaintField"><svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M3 3h6v6H3zM11 11h6v6h-6z"/><path fill="currentColor" opacity=".35" d="M11 3h6v6h-6zM3 11h6v6H3z"/></svg>Selbst malen</button></div>
          <div class="intro-paint" id="introPaintField"${l.paint ? '' : ' hidden'}>
            <div class="intro-grid" id="introGrid" tabindex="0" role="application" aria-label="Pixel-Raster, 20 mal 20. Pfeiltasten bewegen, Leertaste malt.">${'<i></i>'.repeat(AV_N * AV_N)}</div>
            <div class="intro-paint-r"><div class="intro-palette" role="group" aria-label="Malfarbe">${AV_PAL.map((c, i) => `<button type="button" data-c="${i}" aria-pressed="${i === introPaintColor}" aria-label="${INTRO_PAINT_COLORS[i] || 'Farbe ' + i}" title="${INTRO_PAINT_COLORS[i] || ''}"><i style="${c ? 'background:' + c : ''}"></i></button>`).join('')}</div>
              <label class="sw intro-thick"><input type="checkbox" id="introThick" ${me.brush === 'dick' ? 'checked' : ''}><span>Dicker Pinsel</span></label>
              <button type="button" class="linkbtn intro-clear" id="introClear">Alles löschen</button></div>
          </div>
        </div>
        <div class="intro-field" role="group" aria-labelledby="introFaL"><span class="intro-l" id="introFaL">Lieblingsfarbe</span>
          <div class="intro-colors">${COLOR_PRESETS.map(p => `<button type="button" class="intro-color" data-p="${p.id}" aria-label="${esc(p.n)}" title="${esc(p.n)}"><i style="background:${p.a}"></i></button>`).join('')}</div>
        </div>
      </div>
      <aside class="intro-idcard-w" id="introIdCard" aria-label="Dein Mitarbeiterausweis">
        <div class="intro-band" aria-hidden="true"></div>
        <div class="intro-idcard">
          <div class="intro-id-head">${INTRO_LOGO}<b>Pixelwerk</b></div>
          <div class="intro-id-image" id="introIdImage"></div>
          <div class="intro-id-who"><p class="intro-id-name" id="introIdName"></p><p class="intro-id-role">${esc(meRole())}</p></div>
          <dl class="intro-id-data"><div><dt>Standort</dt><dd>Pixelwerk Köln</dd></div><div><dt>${me.start ? 'Dabei seit' : 'Seit heute'}</dt><dd>${since}</dd></div></dl>
          <div class="intro-id-code" aria-hidden="true"><span id="introIdCode"></span><small id="introIdNr"></small></div>
        </div>
      </aside>
    </div>
    <div class="intro-footer"><p class="intro-notice" id="introNotice" aria-live="polite"></p><button type="button" class="btn primary big" id="introNext">Weiter</button></div>
  </section>`;
}
/* Alles, was von Name, Avatar und Farbe abhängt, neu zeichnen. wackeln: Der Ausweis zeigt kurz, dass er reagiert hat. */
function introCharNew(w, wobble) {
  const n = meName(), px = avatarPx(), empty = '0'.repeat(AV_N * AV_N), fid = introColorId();
  w.querySelectorAll('.intro-tile').forEach(b => b.setAttribute('aria-pressed', AV_TEMPLATES[+b.dataset.v].px === px));
  w.querySelectorAll('.intro-color').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === fid));
  [...$('#introGrid', w).children].forEach((el, i) => { el.style.background = AV_PAL[parseInt((px || empty)[i], 16)] || ''; });
  const photo = $('#introIdImage', w); photo.innerHTML = px ? avatarSvg(px, 112, true) : esc(n ? n[0].toUpperCase() : '?'); photo.classList.toggle('intro-without', !px);
  const name = $('#introIdName', w); name.textContent = n || 'Dein Name'; name.classList.toggle('intro-empty', !n);
  let h = introHash(n + '|' + px), bars = '';
  for (let i = 0; i < 30; i++) { h = Math.imul(h ^ h >>> 15, 2246822519) >>> 0; bars += '<i class="' + (i % 2 ? '' : 'an') + '" style="flex-grow:' + (1 + h % 3) + '"></i>'; }
  $('#introIdCode', w).innerHTML = bars; $('#introIdNr', w).textContent = 'PW-' + String(introHash(n) % 9000 + 1000);
  introFooter(w, n ? '' : 'Dein Name fehlt noch.', !!n);
  if (wobble) introWobble($('#introIdCard', w), 'intro-wobble');
}
function introCharOn(w, l) {
  /* Immer frisch über ich() schreiben: S kann unterwegs ersetzt werden (Abgleich mit progress.json) */
  const name = $('#introName', w), raster = $('#introGrid', w), cells = [...raster.children];
  if (!l.repeated && player().avatar == null) player().avatar = AV_TEMPLATES[0].px; /* neu hier: gleich mit Gesicht anfangen. Ein selbst geleerter Avatar ('') bleibt leer. */
  const firm = () => { save(); lookApply(); introCharNew(w, true); };
  name.oninput = () => { meNameSet(name); firm(); };
  w.querySelectorAll('.intro-tile').forEach(b => b.onclick = () => { player().avatar = AV_TEMPLATES[+b.dataset.v].px; firm(); });
  /* Zufall: ein paar schnelle Würfe hintereinander, der letzte bleibt */
  const chance = $('#introRandom', w);
  chance.onclick = () => {
    if (chance.classList.contains('intro-rolls')) return;
    if (!motionOn()) { player().avatar = randomAvatar(); firm(); return; }
    chance.classList.add('intro-rolls');
    for (let i = 1; i <= 5; i++) introLater(() => { player().avatar = randomAvatar(); if (i < 5) introCharNew(w); else { chance.classList.remove('intro-rolls'); firm(); } }, i * 70);
  };
  const paint = $('#introPaint', w), field = $('#introPaintField', w);
  paint.onclick = () => { l.paint = !l.paint; introRemember(); field.hidden = !l.paint; paint.setAttribute('aria-expanded', l.paint); if (l.paint) field.scrollIntoView({ block: 'nearest' }); };
  w.querySelectorAll('.intro-palette button').forEach(b => b.onclick = () => { introPaintColor = +b.dataset.c; w.querySelectorAll('.intro-palette button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  /* Malen: klicken oder ziehen, mit Maus, Finger oder Stift. Gespeichert wird beim Loslassen. */
  const put = i => { const px = (avatarPx() || '0'.repeat(AV_N * AV_N)).split(''); avBrush(i, player().brush === 'dick').forEach(j => { px[j] = introPaintColor.toString(16); }); player().avatar = px.join(''); introCharNew(w); };
  $('#introThick', w).onchange = e => { player().brush = e.target.checked ? 'dick' : 'fein'; save(); };
  const cellAt = e => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.parentNode === raster ? cells.indexOf(el) : -1; };
  let pulls = false, cur = 0;
  const pointer = i => { cells[cur].classList.remove('intro-cur'); cur = i; cells[cur].classList.add('intro-cur'); };
  raster.onpointerdown = e => { const i = cellAt(e); if (i < 0) return; e.preventDefault(); pulls = true; try { raster.setPointerCapture(e.pointerId); } catch (x) {} pointer(i); put(i); };
  raster.onpointermove = e => { if (!pulls) return; const i = cellAt(e); if (i >= 0 && i !== cur) { pointer(i); put(i); } };
  raster.onpointerup = raster.onpointercancel = () => { if (pulls) { pulls = false; firm(); } };
  raster.onkeydown = e => {
    const stepNo = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -AV_N, ArrowDown: AV_N }[e.key];
    if (stepNo) { const i = cur + stepNo; if (i >= 0 && i < cells.length && (Math.abs(stepNo) > 1 || (i / AV_N | 0) === (cur / AV_N | 0))) pointer(i); e.preventDefault(); }
    else if (e.key === ' ' || e.key === 'Enter') { put(cur); firm(); e.preventDefault(); }
  };
  pointer(0);
  $('#introClear', w).onclick = () => { player().avatar = ''; firm(); };
  w.querySelectorAll('.intro-color').forEach(b => b.onclick = () => {
    const id = b.dataset.p; if (id === introColorId()) return;
    if (id === 'pixelwerk') delete player().colour; else { const p = COLOR_PRESETS.find(x => x.id === id); player().colour = { id, a: p.a, g: p.g, tint: true }; }
    firm();
  });
  introCharNew(w);
  if (!name.value && matchMedia('(hover: hover)').matches) name.focus({ preventScroll: true });
}

/* ---------- 3. Erster Tag: Dialog zum Durchklicken ---------- */
/* Liefert den Dialog bis zur nächsten offenen Frage. ['?', feld, antworten] ist eine eigene Zeile: beantwortet eine Sprechblase, offen die Knöpfe. */
function introDialog(l) {
  const n = meName();
  const d = [['boss', 'Hallo ' + n + ', willkommen bei Pixelwerk! Wir bauen Web-Apps für Kunden, ab heute mit dir.'], ['?', 'a1', ['Danke, ich freu mich!', 'Ehrlich gesagt: Ich bin nervös.']]];
  if (l.a1 == null) return d;
  d.push(['boss', ['Wir uns auch. Du bekommst gleich dein erstes Ticket.', 'Das gehört dazu. Hier darf jeder fragen, bis es sitzt.'][l.a1]],
    ['boss', 'Das ist Toni, dein Mentor. Was du hier brauchst, lernst du mit ihm.'],
    ['toni', 'Hi ' + n + '! Ich führ dich durch die Kapitel.'],
    ['toni', 'Wie viel Angular hattest du schon?'],
    ['?', 'level', ['Noch gar keins', 'Etwas HTML und JavaScript', 'Ich kenne schon ein Framework']]);
  if (l.level == null) return d;
  /* Grundlagen (HTML, CSS, TypeScript, Werkzeuge) mitmachen oder gleich mit Angular? Das vierte Feld ist die Antwort, die Toni
     zum Vorwissen vorschlägt: ohne Vorwissen die Grundlagen, wer schon ein Framework kennt, direkt Angular. Gespeichert in S.player.weg. */
  d.push(['toni', ['Kein Problem. Magst du vorher die Grundlagen machen: HTML, CSS, TypeScript?', 'Gute Basis. Nimmst du die Grundlagen trotzdem mit, oder gleich Angular?', 'Dann kennst du vieles schon. Grundlagen mitmachen oder direkt Angular?'][l.level]],
    ['?', 'journey', ['Mit Grundlagen anfangen', 'Direkt mit Angular starten'], l.level === 2 ? 1 : 0]);
  if (l.journey == null) return d;
  d.push(['toni', ['Gut. Wir starten mit HTML, CSS, TypeScript und deinen Werkzeugen.', 'Gut. Die Grundlagen bleiben frei anwählbar, falls du sie brauchst.'][l.journey]]);
  return d;
}
function introDayHtml() {
  return `<section class="intro-image intro-day">
    <div class="intro-head"><p class="intro-place">Montag, 8:45 Uhr</p><h1 id="introT" tabindex="-1">Dein erster Tag</h1></div>
    <div class="intro-chat" id="introChat" role="log" aria-live="polite" tabindex="-1"></div>
    <div class="intro-answers" id="introAnswers" role="group" aria-label="Deine Antwort"></div>
    <div class="intro-footer"><button type="button" class="btn primary big" id="introNext" hidden>Weiter</button></div>
  </section>`;
}
function introLineHtml(who, text) {
  const c = CAST[who], selfMade = who === 'du';
  return `<span class="intro-av${selfMade ? ' intro-av-me"' : '" style="' + figureStyle(c.color) + '"'} aria-hidden="true">${selfMade ? avatarHtml() : figureHead(who)}</span><div class="intro-bubble"><span class="intro-who">${esc(selfMade ? meName() || 'Du' : c.name)}${selfMade ? '' : '<small>' + esc(c.role) + '</small>'}</span><p>${esc(text)}</p></div>`;
}
function introDayOn(w, l) {
  const log = $('#introChat', w), ans = $('#introAnswers', w), nextBtn = $('#introNext', w);
  const gentle = () => ({ block: 'nearest', behavior: motionOn() ? 'smooth' : 'auto' });
  let i = 0, urgent = false, typing = null, timer = 0, lastTime = '';
  const later = (fn, ms) => { timer = introLater(() => { timer = 0; fn(); }, ms); };
  const extra = (cls, html, instant) => { const el = document.createElement('div'); el.className = 'intro-line ' + cls + (instant ? '' : ' intro-new'); el.innerHTML = html; log.appendChild(el); return el; };
  /* Schreibt dieselbe Figur gleich nochmal, steht die zweite Blase ohne Avatar und Namen darunter (intro-follow) */
  const codeLine = (z, instant) => {
    const who = z[0] === '?' ? 'du' : z[0], sequence = who === lastTime ? ' intro-follow' : ''; lastTime = who; i++;
    return who === 'du' ? extra('intro-me' + sequence, introLineHtml('du', z[2][l[z[1]]]), instant) : extra(sequence, introLineHtml(who, z[1]), instant);
  };
  const proceed = () => {
    const z = introDialog(l)[i];
    if (typing) { typing.remove(); typing = null; }
    if (!z) { nextBtn.hidden = false; nextBtn.focus({ preventScroll: true }); if (log.lastElementChild) log.lastElementChild.scrollIntoView(gentle()); return; } /* die letzte Blase bleibt über dem Knopf sichtbar */
    if (z[0] === '?') {
      if (l[z[1]] != null) { codeLine(z, urgent).scrollIntoView(gentle()); proceed(); return; }
      ans.innerHTML = z[2].map((t, k) => `<button type="button" class="btn intro-answer${k === z[3] ? ' intro-rec' : ''}" data-k="${k}">${esc(t)}${k === z[3] ? '<small class="intro-rec-t">Tonis Vorschlag</small>' : ''}</button>`).join('');
      ans.querySelectorAll('button').forEach(b => b.onclick = () => {
        l[z[1]] = +b.dataset.k; introRemember(); if (z[1] === 'level') { player().level = l.level; save(); } if (z[1] === 'journey') { player().journey = INTRO_PATHS[l.journey]; save(); }
        ans.innerHTML = ''; urgent = false; log.focus({ preventScroll: true }); proceed();
      });
      ans.scrollIntoView(gentle());
      return;
    }
    if (urgent || !motionOn()) { codeLine(z, true).scrollIntoView({ block: 'nearest' }); proceed(); return; }
    /* kurzes „schreibt …“, dann die Nachricht, dann eine Atempause */
    typing = extra('intro-typing' + (z[0] === lastTime ? ' intro-follow' : ''), `<span class="intro-av" style="${figureStyle(CAST[z[0]].color)}" aria-hidden="true">${figureHead(z[0])}</span><div class="intro-bubble" aria-hidden="true"><i></i><i></i><i></i></div>`);
    typing.scrollIntoView(gentle());
    later(() => { typing.remove(); typing = null; codeLine(z).scrollIntoView(gentle()); later(proceed, 400); }, 450 + Math.min(400, z[1].length * 5));
  };
  /* Für Eilige: Klick in den Chat oder Enter zeigt sofort alles bis zur nächsten Frage */
  introChatHurry = log.onclick = () => { if (!timer) return false; clearTimeout(timer); timer = 0; urgent = true; proceed(); return true; };
  /* Was schon beantwortet ist (Neuladen, Zurück), steht sofort da */
  const d = introDialog(l); let already = l.journey != null ? d.length : 0;
  d.forEach((z, k) => { if (z[0] === '?' && l[z[1]] != null) already = Math.max(already, k + 1); });
  while (i < already) codeLine(d[i], true);
  proceed();
}

/* ---------- 4. Team kennenlernen ---------- */
function introTeamHtml(l) {
  return `<section class="intro-image intro-team">
    <div class="intro-head"><h1 id="introT" tabindex="-1">Dein Team</h1></div>
    <ul class="intro-cards">${INTRO_TEAM.map(([k, sentence]) => { const c = CAST[k], present = l.team.includes(k); return `<li><button type="button" class="intro-card${present ? ' intro-now' : ''}" data-k="${k}" aria-pressed="${present}" style="--av:${c.color}">
      <span class="intro-av" style="${figureStyle(c.color)}" aria-hidden="true">${figureHead(k)}</span><span class="intro-kwho"><b>${esc(c.name)}</b><small>${esc(c.role)}</small></span>
      <span class="intro-ksentence">${present ? '„' + esc(sentence) + '“' : ''}</span><span class="intro-khello">Hallo sagen</span><span class="intro-kok" aria-hidden="true">✓</span></button></li>`; }).join('')}</ul>
    <p class="sr-only" id="introSays" aria-live="polite"></p>
    <div class="intro-footer"><p class="intro-notice" id="introNotice" aria-live="polite"></p><button type="button" class="btn primary big" id="introNext">Weiter</button></div>
  </section>`;
}
function introTeamOn(w, l) {
  const standing = () => { const n = l.team.length; introFooter(w, n < 3 ? 'Sag mindestens dreien Hallo. <b>' + n + ' von 3</b>' : n < INTRO_TEAM.length ? '<b>' + n + ' von ' + INTRO_TEAM.length + '</b> begrüßt' : 'Alle begrüßt', n >= 3); };
  w.querySelectorAll('.intro-card').forEach(b => b.onclick = () => {
    const k = b.dataset.k, sentence = INTRO_TEAM.find(t => t[0] === k)[1];
    if (!l.team.includes(k)) {
      l.team.push(k); introRemember();
      const me = player(); me.team = [...new Set([...(Array.isArray(me.team) ? me.team : []), k])]; save();
      b.classList.add('intro-now'); b.setAttribute('aria-pressed', 'true'); $('.intro-ksentence', b).textContent = '„' + sentence + '“';
      standing();
    }
    introWobble(b, 'intro-turn'); $('#introSays', w).textContent = CAST[k].name + ': ' + sentence;
  });
  standing();
}

/* ---------- 5. Dein Coach: mit eigener KI oder ohne ----------
   Mit KI: Anbieter wählen, eigenen API-Schlüssel einfügen, „Prüfen und speichern“ holt die Modelle und nimmt das empfohlene.
   Gespeichert wird wie im Profil unter „Coach Toni“ (aiSave in ai.js: mit npm start nur in data/secrets.json, sonst in diesem Browser). Ohne KI geht es einfach weiter. */
var INTRO_AI_PROV = ['claude', 'openai', 'gemini', 'deepseek'];
function introAiHtml(l) {
  const c = aiCfg(), choice = l.ai || (c.key ? 'mit' : null);
  return `<section class="intro-image intro-ai">
    <div class="intro-head"><h1 id="introT" tabindex="-1">Dein Coach</h1><p>Toni kann mit einer KI noch mehr. Muss aber nicht.</p></div>
    <div class="intro-chat intro-ai-toni"><div class="intro-line">${introLineHtml('toni', 'Mit einer KI lese ich deinen Code, schreib dir Fragen zu dem, was bei dir wackelt, und erkläre so, wie du lernst. Ohne KI merkt sich die App trotzdem, was du kannst.')}</div></div>
    <div class="intro-ai-choice" role="group" aria-label="Mit oder ohne KI">
      <button type="button" class="intro-ai-k" data-ai="mit" aria-pressed="${choice === 'mit'}"><b>Mit eigener KI</b><small>Claude, ChatGPT, Gemini oder DeepSeek, mit deinem API-Schlüssel</small></button>
      <button type="button" class="intro-ai-k" data-ai="ohne" aria-pressed="${choice === 'ohne'}"><b>Ohne KI</b><small>Alles läuft. Die KI kannst du später im Profil einrichten.</small></button>
    </div>
    <div class="intro-ai-form" id="introAiForm"${choice === 'mit' ? '' : ' hidden'}>
      <div class="hub-choices" id="introAiProv" role="group" aria-label="KI-Anbieter">${INTRO_AI_PROV.map(a => `<button type="button" class="hub-choice" data-a="${a}">${esc(AI_PROVIDERS[a].name)}</button>`).join('')}</div>
      <label class="fld" for="introAiKey" id="introAiKeyL">API-Schlüssel</label>
      <div class="hub-row"><input id="introAiKey" type="password" autocomplete="off" spellcheck="false"><button class="btn" id="introAiCheck" type="button">Prüfen und speichern</button></div>
      <p class="small" id="introAiMsg" aria-live="polite"></p>
      <p class="muted small">Schlüssel gibt es bei <span id="introAiWhere"></span>. <span id="introAiPlace">${esc(aiPlace())}</span> Die Kosten laufen über dein Konto beim Anbieter, am besten mit Ausgabelimit.</p>
    </div>
    <div class="intro-footer"><p class="intro-notice" id="introNotice" aria-live="polite"></p><button type="button" class="btn primary big" id="introNext">Weiter</button></div>
  </section>`;
}
function introAiOn(w, l) {
  const form = $('#introAiForm', w), key = $('#introAiKey', w), msg = $('#introAiMsg', w);
  const standing = () => {
    const c = aiCfg(), choice = l.ai || (c.key ? 'mit' : null);
    w.querySelectorAll('.intro-ai-k').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ai === choice)));
    form.hidden = choice !== 'mit';
    introFooter(w, choice === 'ohne' ? 'Einrichten kannst du die KI jederzeit im Profil unter „Coach Toni“.' : choice === 'mit' ? (c.key ? 'Toni nutzt <b>' + esc(aiName(c)) + '</b>.' : 'Ohne Schlüssel geht es auch. Dann einfach weiter.') : '', true);
  };
  const provider = a => {
    const k = AI_PROVIDERS[a], c = aiCfg(); l.prov = a; introRemember();
    w.querySelectorAll('#introAiProv button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.a === a)));
    $('#introAiKeyL', w).textContent = k.name + '-API-Schlüssel'; key.placeholder = k.ph; $('#introAiWhere', w).textContent = k.where;
    key.value = c.provider === a && !c.local ? c.key || '' : ''; msg.textContent = c.key && c.provider === a ? 'Gespeichert: ' + k.name + ' (' + (c.model || k.std) + ').' : '';
  };
  w.querySelectorAll('.intro-ai-k').forEach(b => b.onclick = () => {
    l.ai = b.dataset.ai; introRemember(); standing();
    if (l.ai === 'mit') key.focus({ preventScroll: true });
  });
  w.querySelectorAll('#introAiProv button').forEach(b => b.onclick = () => provider(b.dataset.a));
  const store = (a, k, model) => { aiSave({ provider: a, key: k, model }); l.ai = 'mit'; introRemember(); standing(); };
  $('#introAiCheck', w).onclick = async () => {
    const a = l.prov, k = key.value.trim();
    if (!k) { msg.textContent = 'Erst den Schlüssel einfügen.'; key.focus(); return; }
    msg.textContent = 'Prüfe Schlüssel…';
    try {
      const list = await aiModels(a, k); if (!list.length) throw new Error('Keine passenden Modelle gefunden');
      const def = pickDefaultModel(list, a);
      store(a, k, def.id);
      msg.textContent = 'Klappt. Toni nutzt jetzt ' + AI_PROVIDERS[a].name + ' (' + def.id + ').';
    } catch (e) {
      msg.innerHTML = esc(e instanceof TypeError ? 'Keine Verbindung zu ' + AI_PROVIDERS[a].name + '.' : 'Klappt nicht: ' + e.message) + ' <button type="button" class="linkbtn" id="introAiAnyway">Trotzdem speichern</button>';
      $('#introAiAnyway', w).onclick = () => { store(a, k, AI_PROVIDERS[a].std); msg.textContent = 'Gespeichert. Ob der Schlüssel geht, merkst du bei der ersten Frage an Toni.'; };
    }
  };
  const c = aiCfg(); provider(l.prov || (c.key && AI_PROVIDERS[c.provider] ? c.provider : 'claude'));
  standing();
}

/* ---------- 6. So läuft’s hier ---------- */
function introRulesHtml(l) {
  const my = rank(S.xp).name;
  return `<section class="intro-image intro-rules">
    <div class="intro-head"><h1 id="introT" tabindex="-1">So läuft’s hier</h1><p>Ein Kapitel ist ein Ticket.</p></div>
    <div class="intro-rules-g">
      <ol class="intro-path">${INTRO_PATH.map((s, i) => `<li style="--i:${i}"><span class="intro-wnr" aria-hidden="true">${i + 1}</span><b>${s[0]}</b><small>${s[1]}</small></li>`).join('')}</ol>
      <p class="intro-xp" style="--i:4"><i aria-hidden="true">→</i><b>+ XP</b><i aria-hidden="true">→</i><span>Mit XP steigst du auf.</span></p>
      <ol class="intro-ladder" style="--i:5" aria-label="Ränge, von oben nach unten">${RANKS.slice().reverse().map(r => `<li class="${r[1] === my ? 'intro-you' : ''}">${r[1] === my ? avatarHtml('intro-lav') : ''}<span>${esc(r[1])}</span><small>${r[1] === my ? 'Du' : r[0] + ' XP'}</small></li>`).join('')}</ol>
    </div>
    <p class="intro-repeat" style="--i:6"><span aria-hidden="true">↻</span> Was du gelernt hast, kommt in Abständen wieder. So bleibt es.</p>
    <p class="intro-repeat intro-things" style="--i:7"><span aria-hidden="true">🎁</span> Für abgeschlossene Kapitel und Phasen gewinnst du Sachen für deinen Avatar.</p>
    <div class="intro-footer"><button type="button" class="btn primary big" id="introNext">${l.repeated ? 'Zum Schreibtisch' : 'Erstes Ticket holen'}</button></div>
  </section>`;
}

/* ---------- Tastatur: Enter und Pfeil rechts gehen weiter, Pfeil links zurück, 1 bis 3 wählen eine Antwort ----------
   In der Einfangphase, damit „/“ hier nicht die Suche der Kopfzeile öffnet (die ist solange ausgeblendet). */
document.addEventListener('keydown', e => {
  if (!introRun || e.repeat || e.altKey || e.ctrlKey || e.metaKey || !document.body.classList.contains('intro-on') || document.querySelector('dialog[open]')) return;
  const w = document.querySelector('#main > .intro'), t = e.target; if (!w || !t.closest || t.closest('#introGrid')) return;
  if (e.key === '/' && !t.closest('input, textarea, select')) { e.stopPropagation(); return; }
  const before = () => {
    const b = $('#introNext', w);
    if (!b.hidden && !b.disabled) b.click(); else if (!introChatHurry || !introChatHurry()) introWobble($('.intro-answers:not(:empty)', w) || $('#introNotice', w), 'intro-jolt');
    e.preventDefault();
  };
  if (e.key === 'Tab') introByMouse = false;
  /* Enter gehört dem Knopf, auf dem der Tastatur-Fokus steht. Hat man ihn nur mit der Maus angeklickt, geht Enter weiter. */
  else if (e.key === 'Enter' && t.id === 'introAiKey') { $('#introAiCheck', w).click(); e.preventDefault(); }
  else if (e.key === 'Enter') { if (introByMouse || !t.closest('button, a, summary')) before(); }
  else if (t.closest('input, textarea, select')) return;
  else if (e.key === 'ArrowRight') before();
  else if (e.key === 'ArrowLeft') { introGo(-1); e.preventDefault(); }
  else if (/^[1-3]$/.test(e.key)) { const b = w.querySelectorAll('.intro-answer')[+e.key - 1]; if (b) { b.click(); e.preventDefault(); } }
}, true);
document.addEventListener('pointerdown', () => { introByMouse = true; }, true);
