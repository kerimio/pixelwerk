/* ================= ICH, LOOK UND EINSTELLUNGEN =================
   Eigener Name, Pixel-Avatar, Farbschema (Vorlagen oder eigene Farben), Animationen und Ton.
   Gespeichert in S.ich, wandert also mit fortschritt.json und dem Spielstand als Datei. Das fertige Farb-CSS liegt zusätzlich
   in localStorage, damit die Farben schon vor dem ersten Bild stimmen (siehe Skript im <head>).
   Unten: der eine Einstellungs-Dialog mit vier Reitern (Du, Aussehen, Coach Toni, Spielstand). */
var LOOK_CSS_KEY = 'pw-look-css', LOOK_MOTION_KEY = 'pw-motion';
var FARB_PRESETS = [
  { id: 'pixelwerk', n: 'Pixelwerk', a: '#2453C9', g: '#1D7A4A' },
  { id: 'mint', n: 'Mint', a: '#0E8577', g: '#2E7D32' },
  { id: 'koralle', n: 'Koralle', a: '#D23F5A', g: '#1D7A4A' },
  { id: 'lila', n: 'Lila', a: '#7044D6', g: '#1F8A5B' },
  { id: 'sonne', n: 'Sonne', a: '#BF5B00', g: '#2F7D32' },
  { id: 'ozean', n: 'Ozean', a: '#0A6EA3', g: '#13806A' },
  { id: 'beere', n: 'Beere', a: '#B0306E', g: '#2C7A4B' },
  { id: 'graphit', n: 'Graphit', a: '#37424E', g: '#2E7D4F' }
];
/* Avatar: 20 × 20 Pixel, jedes Zeichen ein Farbindex von 0 bis f (0 = leer). Bis Ende 2026 waren es 10 × 10:
   Solche Avatare (100 Zeichen) werden beim Lesen verdoppelt, jedes alte Pixel wird ein Block aus 2 × 2. */
var AV_N = 20, AV_ALT = 10;
var AV_PAL = ['', '#1A2320', '#FFFFFF', '#F2C9A0', '#C68A5E', '#6B4226', '#F5B700', '#2453C9', '#D6455D', '#2E9E63', '#7B4DDB', '#8C979E', '#F4A7C0', '#8D5524', '#F08A00', '#163A94'];
/* 10 × 10 → 20 × 20 */
function avDoppelt(p) { let r = ''; for (let y = 0; y < AV_ALT; y++) { const z = p.slice(y * AV_ALT, (y + 1) * AV_ALT).split('').map(c => c + c).join(''); r += z + z; } return r; }
/* Einzelne Pixel setzen: [[x, y, Farbe], …] auf einem 20 × 20-Avatar */
function avFein(p, punkte) { const a = p.split(''); punkte.forEach(([x, y, c]) => { a[y * AV_N + x] = c; }); return a.join(''); }
var AV_VORLAGEN = [
  { n: 'Dev', px: '0000000000' + '0055555500' + '0555555550' + '0533333350' + '0311311130' + '0333333330' + '0033113300' + '0003333000' + '0077777700' + '0777777770' },
  { n: 'Brille', px: '0001111000' + '0011111100' + '0133333310' + '1111331111' + '1221331221' + '0133333310' + '0033883300' + '0003333000' + '00a0aa0a00' + '0aaaaaaaa0' },
  { n: 'Roboter', px: '0000660000' + '0000bb0000' + '0bbbbbbbb0' + '0b77bb77b0' + '0b77bb77b0' + '0bbbbbbbb0' + '0bb1111bb0' + '0bbbbbbbb0' + '00b0bb0b00' + '0bb0bb0bb0' },
  { n: 'Katze', px: '0600000060' + '0660000660' + '0666666660' + '0612662160' + '0666666660' + '066c11c660' + '0666666660' + '0066666600' + '0006666000' + '0000000000' },
  { n: 'Pilz', px: '0008888000' + '0088228800' + '0828888280' + '8888888888' + '8228888228' + '0888888880' + '0002332000' + '0003113000' + '0003333000' + '0002222000' }
].map(v => Object.assign(v, { px: avDoppelt(v.px) }));
/* Eine Vorlage, die zeigt, was mit den feinen Pixeln geht: Glanz in den Augen, Lächeln, Haarsträhne, Kragen */
AV_VORLAGEN.splice(1, 0, { n: 'Dev fein', px: avFein(AV_VORLAGEN[0].px, [
  [5, 9, '2'], [12, 9, '2'], [4, 8, '1'], [5, 8, '1'], [11, 8, '1'], [12, 8, '1'], [13, 8, '1'],
  [6, 12, '3'], [7, 12, '3'], [12, 12, '3'], [13, 12, '3'], [7, 13, '1'], [12, 13, '1'], [8, 13, '8'], [9, 13, '8'], [10, 13, '8'], [11, 13, '8'],
  [9, 2, '3'], [10, 3, '3'], [3, 10, 'c'], [16, 10, 'c'],
  [8, 16, '2'], [9, 16, '2'], [10, 16, '2'], [11, 16, '2'], [9, 17, '2'], [10, 17, '2'], [9, 18, 'f'], [10, 18, 'f'], [9, 19, 'f'], [10, 19, 'f']
]) });

function ich() { S.ich = S.ich || {}; return S.ich; }
/* Ein Name hat höchstens ICH_NAME_MAX Zeichen, im Einstieg wie im Profil. Ältere, längere Namen (früher bis 24) bleiben beim Laden ganz. */
const ICH_NAME_MAX = 20;
function ichName() { return String(ich().name || '').trim().slice(0, 24); }
/* Eingabe im Namensfeld übernehmen: Was über die Grenze geht, fällt auch im Feld weg. */
function ichNameSetzen(feld) { if (feld.value.length > ICH_NAME_MAX) feld.value = feld.value.slice(0, ICH_NAME_MAX); ich().name = feld.value.trim(); }
/* Was auf dem Ausweis und im Team-Chat unter deinem Namen steht: Abteilung und Rang */
function ichRolle() { const r = rank(S.xp).name; return r === 'Frontend-Dev' ? r : 'Frontend · ' + r; }
function bewegungAn() { return document.documentElement.dataset.motion !== 'off' && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }

/* ---------- Farben ---------- */
function hexRgb(h) { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return isNaN(n) ? [36, 83, 201] : [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbHex(c) { return '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function mische(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * t)); }
function helligkeit(h) { const c = hexRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
/* Schrift auf einer Farbfläche (Knopf, Ausweis): Weiß, solange das mindestens 4,5:1 Kontrast hat, sonst das dunkle Blau.
   Dazwischen liegt ein schmaler Bereich, in dem beide knapp darunter bleiben: Dort ist es Schwarz. */
function tinte(h) { const l = helligkeit(h) + .05; return 1.05 / l >= 4.5 ? '#FFFFFF' : l / (helligkeit('#0D1530') + .05) >= 4.5 ? '#0D1530' : '#000000'; }
/* Avatar einer Figur: ihre Farbe als Grund (CAST.color ist eine CSS-Variable), die Initiale darauf in lesbarem Hell oder Dunkel */
function figurStil(farbe) { const m = /^var\((--[\w-]+)\)$/.exec(farbe); return '--av:' + farbe + ';color:' + tinte(m ? getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() : farbe); }
/* Zu helle Akzente werden im hellen Modus abgedunkelt, damit Links auf Weiß und weiße Schrift auf dem Knopf lesbar bleiben */
function lesbar(h) { let x = h, k = 0; while (helligkeit(x) > .18 && k++ < 12) x = mische(x, '#000000', .12); return x; }

function lookCss() {
  const me = ich(), f = me.farbe;
  let css = '';
  if (f && f.a) {
    const a = lesbar(f.a), g = lesbar(f.g || '#1D7A4A'), ad = mische(f.a, '#FFFFFF', .42), gd = mische(f.g || '#1D7A4A', '#FFFFFF', .35);
    const bgL = f.tint ? mische('#F6F7F5', a, .045) : '', sunkL = f.tint ? mische('#EEF1EE', a, .06) : '';
    const bgD = f.tint ? mische('#12161A', ad, .06) : '', surfD = f.tint ? mische('#1A2026', ad, .05) : '';
    css += ':root:root:not([data-theme="dark"]){--accent:' + a + ';--accent-ink:' + tinte(a) + ';--accent-soft:' + mische(a, '#FFFFFF', .9) + ';--accent-line:' + mische(a, '#FFFFFF', .66) +
      ';--grass:' + g + ';--grass-soft:' + mische(g, '#FFFFFF', .88) + ';--on-grass:' + tinte(g) + (bgL ? ';--bg:' + bgL + ';--sunk:' + sunkL : '') + '}' +
      ':root:root[data-theme="dark"]{--accent:' + ad + ';--accent-ink:' + tinte(ad) + ';--accent-soft:' + mische(f.a, '#1A2026', .78) + ';--accent-line:' + mische(f.a, '#1A2026', .5) +
      ';--grass:' + gd + ';--grass-soft:' + mische(f.g || '#1D7A4A', '#1A2026', .78) + ';--on-grass:' + tinte(gd) + (bgD ? ';--bg:' + bgD + ';--surface:' + surfD : '') + '}';
  }
  const n = ichName(), av = avatarUrl();
  const cssStr = s => '"' + String(s).replace(/["\\]/g, '\\$&').replace(/[\n\r]/g, ' ') + '"';
  if (n) css += 'body .msg.me::after{content:' + cssStr(n) + '}';
  if (av) css += 'body .msg.me::before{content:"";background:var(--foto) url("' + av + '") center/cover no-repeat;image-rendering:pixelated}';
  else if (n) css += 'body .msg.me::before{content:' + cssStr(n[0].toUpperCase()) + ';font-size:14px}';
  return css;
}
function lookAnwenden() {
  const css = lookCss();
  let st = document.getElementById('lookStyle');
  if (!st) { st = document.createElement('style'); st.id = 'lookStyle'; }
  if (st !== document.head.lastElementChild) document.head.appendChild(st);
  st.textContent = css;
  const m = ich().motion === false ? 'off' : 'on';
  document.documentElement.dataset.motion = m;
  /* Nur Farben/Bewegung vorab laden; Avatar-Bilder sind dafür zu groß und kommen mit dem Zustand */
  try { localStorage.setItem(LOOK_CSS_KEY, css.replace(/body \.msg\.me::before[^}]*\}/g, '')); localStorage.setItem(LOOK_MOTION_KEY, m); } catch (e) {}
  if (typeof CAST === 'object' && CAST.du) { const n = ichName(); CAST.du.name = n || 'Du'; CAST.du.initial = n ? n[0].toUpperCase() : 'D'; }
  renderHud();
}

/* ---------- Avatar ---------- */
function avatarPx() {
  let p = String(ich().avatar || '');
  if (p.length === AV_ALT * AV_ALT && /^[0-9a-f]+$/.test(p)) p = avDoppelt(p);
  return p.length === AV_N * AV_N && /^[0-9a-f]+$/.test(p) && /[^0]/.test(p) ? p : '';
}
/* o: Sachen aus der Garderobe (garderobe.js). true = was du gerade trägst, ein Objekt = genau diese, ohne = nur die eigenen Pixel */
function avatarSvg(px, size, o) {
  let r = '';
  const f = typeof avatarFelder === 'function' ? avatarFelder(px, o === true ? outfit() : o) : px.split('').map(c => AV_PAL[parseInt(c, 16)]);
  for (let i = 0; i < f.length; i++) { const c = f[i]; if (c) r += '<rect x="' + (i % AV_N) + '" y="' + ((i / AV_N) | 0) + '" width="1.02" height="1.02" fill="' + c + '"/>'; }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + AV_N + ' ' + AV_N + '" width="' + (size || 80) + '" height="' + (size || 80) + '" shape-rendering="crispEdges">' + r + '</svg>';
}
function avatarUrl(px) { px = px || avatarPx(); return px ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(avatarSvg(px, 80, true)) : ''; }
/* Avatar oder Anfangsbuchstabe als kleines Bild, für Kopfzeile, Szene, Jubel-Karte */
function avatarHtml(cls) {
  const u = avatarUrl(), n = ichName();
  return u ? '<img class="' + (cls || '') + ' px-av" src="' + u + '" alt="">' : '<span class="' + (cls || '') + ' px-av px-leer" aria-hidden="true">' + esc(n ? n[0].toUpperCase() : '🙂') + '</span>';
}
/* Zufall: grob würfeln (10 × 10, symmetrisch), dann verdoppeln. Feines Rauschen sähe nicht nach Figur aus. */
function zufallsAvatar() {
  const farben = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].sort(() => Math.random() - .5).slice(0, 3);
  let px = '';
  for (let y = 0; y < AV_ALT; y++) {
    const halb = [];
    for (let x = 0; x < AV_ALT / 2; x++) halb.push(Math.random() < (y === 0 || y === AV_ALT - 1 ? .25 : .55) ? farben[Math.random() * 3 | 0] : 0);
    px += halb.concat(halb.slice().reverse()).map(v => v.toString(16)).join('');
  }
  return avDoppelt(px);
}
/* Pinsel: fein = 1 Pixel, dick = Block aus 2 × 2 (bündig am Raster, wie die alten Pixel). Liefert die Felder, die er trifft. */
function avPinsel(i, dick) {
  if (!dick) return [i];
  const x = (i % AV_N) & ~1, y = ((i / AV_N) | 0) & ~1;
  return [y * AV_N + x, y * AV_N + x + 1, (y + 1) * AV_N + x, (y + 1) * AV_N + x + 1];
}
/* ---------- Einstellungen: ein Dialog, vier Reiter ---------- */
var HUB_REITER = ['du', 'aussehen', 'toni', 'spielstand'];
function hubReiter(r) {
  if (!HUB_REITER.includes(r)) r = 'du';
  HUB_REITER.forEach(x => {
    const t = document.getElementById('ichTab-' + x), an = x === r;
    t.setAttribute('aria-selected', an); t.tabIndex = an ? 0 : -1;
    document.getElementById('ichP-' + x).hidden = !an;
  });
  return document.getElementById('ichTab-' + r);
}
/* reiter: 'du' | 'aussehen' | 'toni' | 'spielstand' */
function ichOeffnen(reiter) {
  const d = document.getElementById('ichDlg'); if (!d) return;
  if (!d.open) {
    hubDuBauen(d, document.getElementById('ichP-du')); hubAussehenBauen(document.getElementById('ichP-aussehen'));
    hubKiFuellen(); renderProfilDlg(); hubSyncZeigen();
    ['aiMsg', 'pfMsg', 'hubSpielMsg'].forEach(id => { document.getElementById(id).textContent = ''; });
    document.getElementById('hubLernbild').open = false;
    d.showModal();
  }
  hubReiter(reiter).focus();
}
function hubThema(v) {
  v = v === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = v;
  try { localStorage.setItem('fc-theme', v); } catch (e) {}
}

/* Reiter „Du“: Name und Pixel-Avatar. Jede Änderung gilt sofort. */
function hubDuBauen(d, p) {
  const me = ich();
  const ed = { px: (avatarPx() || '0'.repeat(AV_N * AV_N)).split(''), farbe: 1, spiegel: me.spiegel !== false, dick: me.pinsel === 'dick' };
  p.innerHTML = `<label class="fld" for="ichName">Dein Name</label><input id="ichName" maxlength="${ICH_NAME_MAX}" autocomplete="given-name" placeholder="Dein Vorname" value="${esc(me.name || '')}">
    <p class="fld" id="avT">Dein Pixel-Avatar</p>
    <div class="av-ed"><div class="av-grid" id="avGrid" aria-label="Malfläche, 20 mal 20 Pixel. Malen mit Maus oder Finger.">${ed.px.map((c, i) => `<i data-i="${i}"></i>`).join('')}</div>
      <div class="av-side"><div class="av-prev" id="avPrev"></div>
        <div class="av-pal" id="avPal" role="group" aria-label="Malfarbe">${AV_PAL.map((c, i) => `<button type="button" data-c="${i}" aria-pressed="${i === 1}" aria-label="${i ? ES_MALFARBEN[i] || 'Farbe ' + i : 'Radierer'}" title="${i ? ES_MALFARBEN[i] || '' : 'Radierer'}" style="${i ? '--c:' + c : ''}">${i ? '' : '⌫'}</button>`).join('')}</div>
        <label class="sw"><input type="checkbox" id="avSpiegel" ${ed.spiegel ? 'checked' : ''}><span>Spiegeln</span></label>
        <label class="sw"><input type="checkbox" id="avDick" ${ed.dick ? 'checked' : ''}><span>Dicker Pinsel (2 × 2)</span></label>
      </div></div>
    <div class="hub-wahlen av-tpl" role="group" aria-label="Vorlagen">${AV_VORLAGEN.map((v, i) => `<button type="button" class="hub-wahl" data-v="${i}">${v.n}</button>`).join('')}<button type="button" class="hub-wahl" id="avZufall">🎲 Zufall</button><button type="button" class="hub-wahl" id="avLeer">Leeren</button></div>
    ${garderobeHtml()}
    <label class="sw" id="ichWegZ"><input type="checkbox" id="ichWeg" ${grundlagenOptional() ? '' : 'checked'}><span><b>Grundlagen mitmachen</b> · HTML, CSS, TypeScript und Werkzeuge. Aus: Die Phase bleibt offen, zählt aber als optional.</span></label>
    <p class="hub-links"><button type="button" class="linkbtn" id="hubEinstieg">Einstieg nochmal ansehen</button><a class="linkbtn" id="hubWissen" href="#wissen">Wie diese App beim Lernen hilft</a></p>`;

  const grid = p.querySelector('#avGrid'), cells = [...grid.children];
  const malen = () => { cells.forEach((el, i) => { const c = AV_PAL[parseInt(ed.px[i], 16)]; el.style.background = c || ''; el.classList.toggle('leer', !c); }); p.querySelector('#avPrev').innerHTML = avatarSvg(ed.px.join(''), 72, true); };
  const setzen = i => {
    const v = ed.farbe.toString(16);
    avPinsel(i, ed.dick).forEach(j => { const x = j % AV_N, y = (j / AV_N) | 0; ed.px[j] = v; if (ed.spiegel) ed.px[y * AV_N + (AV_N - 1 - x)] = v; });
  };
  /* Die Vorschauen in der Garderobe zeigen deine eigenen Pixel, darum nach jedem Malen auch dort neu zeichnen */
  const speichern = () => { me.avatar = ed.px.join(''); malen(); save(); lookAnwenden(); garderobeFuellen(p); };
  let zieht = false;
  grid.addEventListener('pointerdown', e => { const c = e.target.closest('i'); if (!c) return; e.preventDefault(); zieht = true; setzen(+c.dataset.i); malen(); });
  grid.addEventListener('pointerover', e => { if (!zieht) return; const c = e.target.closest('i'); if (c) { setzen(+c.dataset.i); malen(); } });
  const los = () => { if (zieht) { zieht = false; speichern(); } };
  window.addEventListener('pointerup', los); d.addEventListener('close', () => window.removeEventListener('pointerup', los), { once: true });
  p.querySelectorAll('#avPal button').forEach(b => b.onclick = () => { ed.farbe = +b.dataset.c; p.querySelectorAll('#avPal button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  p.querySelector('#avSpiegel').onchange = e => { ed.spiegel = me.spiegel = e.target.checked; save(); };
  p.querySelector('#avDick').onchange = e => { ed.dick = e.target.checked; me.pinsel = ed.dick ? 'dick' : 'fein'; save(); };
  p.querySelectorAll('.av-tpl [data-v]').forEach(b => b.onclick = () => { ed.px = AV_VORLAGEN[+b.dataset.v].px.split(''); speichern(); });
  p.querySelector('#avZufall').onclick = () => { ed.px = zufallsAvatar().split(''); speichern(); };
  p.querySelector('#avLeer').onclick = () => { ed.px = '0'.repeat(AV_N * AV_N).split(''); speichern(); };
  malen();
  garderobeAn(p);

  const name = p.querySelector('#ichName');
  /* Der neue Name steht sofort im Profil-Chip und in der Begrüßung auf dem Schreibtisch */
  name.oninput = () => { ichNameSetzen(name); save(); lookAnwenden(); const h = document.querySelector('.hub-hallo h1'); if (h) h.textContent = hubGruss(); };
  /* Grundlagen mitmachen oder direkt Angular (wie im Einstieg, S.ich.weg). Der Schreibtisch dahinter zeigt es sofort. */
  p.querySelector('#ichWeg').onchange = e => { me.weg = e.target.checked ? 'grundlagen' : 'angular'; save(); const m = document.getElementById('main'); if (m && m.querySelector(':scope > .hub')) renderStart(m); };
  p.querySelector('#hubEinstieg').onclick = () => { d.close(); einstiegStarten(); };
  p.querySelector('#hubWissen').onclick = () => d.close();
}

/* Reiter „Aussehen“: Hell/Dunkel (pro Gerät), Farben, Animationen, Ton. */
function hubAussehenBauen(p) {
  const me = ich(), f = me.farbe || {};
  const presetId = f.id || (f.a ? 'eigen' : 'pixelwerk'), thema = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  p.innerHTML = `<div class="hub-seg" id="hubThema" role="group" aria-label="Hell oder dunkel"><button type="button" data-th="light" aria-pressed="${thema === 'light'}">☀️ Hell</button><button type="button" data-th="dark" aria-pressed="${thema === 'dark'}">🌙 Dunkel</button></div>
    <p class="fld" id="farbT">Farben</p>
    <div class="farb-presets" role="group" aria-labelledby="farbT">${FARB_PRESETS.map(x => `<button type="button" class="fp" aria-pressed="${presetId === x.id}" data-p="${x.id}" style="--a:${x.a};--g:${x.g}"><span class="fp-sw"><i></i><i></i></span>${x.n}</button>`).join('')}<button type="button" class="fp" aria-pressed="${presetId === 'eigen'}" data-p="eigen" style="--a:${esc(f.a || '#2453C9')};--g:${esc(f.g || '#1D7A4A')}"><span class="fp-sw fp-regen"><i></i><i></i></span>Eigene</button></div>
    <div class="farb-eigen" id="farbEigen" ${presetId === 'eigen' ? '' : 'hidden'}>
      <label>Akzent <input type="color" id="farbA" value="${esc(f.a || '#2453C9')}"></label>
      <label>Erfolg <input type="color" id="farbG" value="${esc(f.g || '#1D7A4A')}"></label>
    </div>
    <label class="sw"><input type="checkbox" id="farbTint" ${f.tint ? 'checked' : ''}><span>Hintergrund leicht einfärben</span></label>
    <label class="sw"><input type="checkbox" id="ichMotion" ${me.motion === false ? '' : 'checked'}><span><b>Animationen</b> · Konfetti und Übergänge</span></label>
    <label class="sw"><input type="checkbox" id="ichTon" ${me.ton ? 'checked' : ''}><span><b>Ton</b> · kurzer Klang bei Erfolgen</span></label>`;

  p.querySelectorAll('#hubThema button').forEach(b => b.onclick = () => { hubThema(b.dataset.th); p.querySelectorAll('#hubThema button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  const farbeSetzen = id => {
    const tint = p.querySelector('#farbTint').checked;
    if (id === 'pixelwerk' && !tint) delete me.farbe;
    else if (id === 'eigen') me.farbe = { id: 'eigen', a: p.querySelector('#farbA').value, g: p.querySelector('#farbG').value, tint };
    else { const x = FARB_PRESETS.find(y => y.id === id); me.farbe = { id, a: x.a, g: x.g, tint }; }
    p.querySelectorAll('.fp').forEach(x => x.setAttribute('aria-pressed', x.dataset.p === id));
    p.querySelector('#farbEigen').hidden = id !== 'eigen';
    const eig = p.querySelector('.fp[data-p="eigen"]'); eig.style.setProperty('--a', p.querySelector('#farbA').value); eig.style.setProperty('--g', p.querySelector('#farbG').value);
    save(); lookAnwenden();
  };
  const aktiv = () => { const o = p.querySelector('.fp[aria-pressed="true"]'); return o ? o.dataset.p : 'pixelwerk'; };
  /* Wer zum ersten Mal eine andere Farbe wählt, bekommt den Hintergrund passend eingefärbt (abschaltbar) */
  p.querySelectorAll('.fp').forEach(b => b.onclick = () => { if (!me.farbe && b.dataset.p !== 'pixelwerk') p.querySelector('#farbTint').checked = true; farbeSetzen(b.dataset.p); });
  p.querySelector('#farbA').oninput = p.querySelector('#farbG').oninput = () => farbeSetzen('eigen');
  p.querySelector('#farbTint').onchange = () => farbeSetzen(aktiv());
  p.querySelector('#ichMotion').onchange = e => { me.motion = e.target.checked; save(); lookAnwenden(); };
  p.querySelector('#ichTon').onchange = e => { me.ton = e.target.checked; save(); if (me.ton) jubelTon('klein'); };
}

(function ichSetup() {
  try { lookAnwenden(); } catch (e) {}
  const go = () => {
    lookAnwenden();
    const b = document.getElementById('ichBtn'), d = document.getElementById('ichDlg'); if (!b || !d) return;
    b.onclick = () => ichOeffnen();
    document.getElementById('ichZu').onclick = () => d.close();
    /* Reiter: Klick oder Pfeiltasten, Pos1 und Ende */
    const tabs = d.querySelector('.hub-tabs');
    tabs.addEventListener('click', e => { const t = e.target.closest('[role="tab"]'); if (t) hubReiter(t.dataset.r); });
    tabs.addEventListener('keydown', e => {
      const t = e.target.closest('[role="tab"]'), i = t ? HUB_REITER.indexOf(t.dataset.r) : -1; if (i < 0) return;
      const n = HUB_REITER.length, j = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i + n - 1) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
      if (j < 0) return;
      e.preventDefault(); hubReiter(HUB_REITER[j]).focus();
    });
    /* Klick neben den Dialog schließt ihn (nicht, wenn man beim Malen über den Rand hinaus zieht) */
    let aussen = false;
    const daneben = e => { const r = d.getBoundingClientRect(); return e.target === d && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom); };
    d.addEventListener('pointerdown', e => { aussen = daneben(e); });
    d.addEventListener('click', e => { if (aussen && daneben(e)) d.close(); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
