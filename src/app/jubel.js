/* ================= JUBEL =================
   Erfolgsmomente, die sich gut anfühlen: Pixel-Konfetti, ein kurzer Hüpfer, eine Karte mit deinem Avatar,
   auf Wunsch ein kleiner Klang. Nur bei echten Erfolgen (richtige Antwort, Tests grün, Kapitel geschafft,
   neue Stufe), nie während man liest. „Animationen aus“ im Profil oder im System schaltet alles Bewegte ab. */
var jubelCv = null, jubelCtx = null, jubelTeile = [], jubelRaf = 0, jubelSerie = 0, jubelAudio = null, jubelKarteT = 0;
var LOB = ['Stark', 'Sauber', 'Läuft bei dir', 'Richtig gut', 'Klasse', 'Weiter so', 'Genau so'];

/* Über offene Dialoge legen: Popover landen in der obersten Ebene, auch über einem modalen <dialog> */
function obenAuf(el) {
  if (!el.showPopover) return;
  try { if (!el.hasAttribute('popover')) el.setAttribute('popover', 'manual'); if (el.matches(':popover-open')) el.hidePopover(); el.showPopover(); } catch (e) {}
}
function jubelFarben() {
  const cs = getComputedStyle(document.documentElement);
  return [cs.getPropertyValue('--accent'), cs.getPropertyValue('--grass'), '#F5B700', '#FF6B8B', '#36C5F0', '#9B6BFF'].map(s => s.trim()).filter(Boolean);
}
function jubelLeinwand() {
  if (!jubelCv) { jubelCv = document.createElement('canvas'); jubelCv.className = 'jubel-cv'; jubelCv.setAttribute('aria-hidden', 'true'); document.body.appendChild(jubelCv); jubelCtx = jubelCv.getContext('2d'); }
  obenAuf(jubelCv);
  const d = window.devicePixelRatio || 1;
  if (jubelCv.width !== Math.round(innerWidth * d) || jubelCv.height !== Math.round(innerHeight * d)) { jubelCv.width = Math.round(innerWidth * d); jubelCv.height = Math.round(innerHeight * d); }
  jubelCtx.setTransform(d, 0, 0, d, 0, 0);
}
function jubelSchleife() {
  const c = jubelCtx; c.clearRect(0, 0, innerWidth, innerHeight);
  jubelTeile = jubelTeile.filter(p => p.life > 0 && p.y < innerHeight + 40);
  for (const p of jubelTeile) {
    p.vy += p.g; p.vx *= p.f; p.vy *= p.f; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
    c.save(); c.globalAlpha = Math.min(1, p.life / 25); c.translate(p.x, p.y); c.rotate(p.r);
    c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s * p.k / 2, p.s, p.s * p.k); c.restore();
  }
  if (jubelTeile.length) jubelRaf = requestAnimationFrame(jubelSchleife); else { jubelRaf = 0; c.clearRect(0, 0, innerWidth, innerHeight); }
}
function jubelDazu(liste) {
  if (!bewegungAn() || !document.body) return;
  jubelLeinwand(); jubelTeile.push(...liste);
  if (!jubelRaf) jubelRaf = requestAnimationFrame(jubelSchleife);
}
/* Kleine Explosion an einer Stelle (richtige Antwort) */
function jubelPlatzen(x, y, n) {
  const f = jubelFarben();
  jubelDazu(Array.from({ length: n || 24 }, () => {
    const a = Math.random() * Math.PI * 2, v = 2.5 + Math.random() * 5;
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, g: .2, f: .985, r: Math.random() * 6, vr: (Math.random() - .5) * .3, s: 4 + Math.random() * 4, k: 1, c: f[Math.random() * f.length | 0], life: 55 + Math.random() * 30 };
  }));
}
/* Zwei Konfetti-Kanonen von unten links und rechts (großer Erfolg) */
function jubelKanonen() {
  const f = jubelFarben(), teile = [];
  [[0, -1], [innerWidth, 1]].forEach(([x0, dir]) => {
    for (let i = 0; i < 70; i++) {
      const a = -Math.PI / 2 - dir * (Math.PI / 5 + Math.random() * Math.PI / 6), v = 11 + Math.random() * 9;
      teile.push({ x: x0, y: innerHeight, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: .28, f: .975, r: Math.random() * 6, vr: (Math.random() - .5) * .4, s: 6 + Math.random() * 5, k: .5 + Math.random() * .7, c: f[i % f.length], life: 160 + Math.random() * 60 });
    }
  });
  jubelDazu(teile);
}

/* Klang: kleines Arpeggio mit WebAudio, nur wenn im Profil eingeschaltet */
function jubelTon(art) {
  if (!(S.ich && S.ich.ton)) return;
  try {
    jubelAudio = jubelAudio || new (window.AudioContext || window.webkitAudioContext)();
    if (jubelAudio.state === 'suspended') jubelAudio.resume();
    const t0 = jubelAudio.currentTime + .01, gross = art === 'gross';
    const toene = gross ? [523.25, 659.25, 783.99, 1046.5] : [783.99, 1174.66];
    toene.forEach((hz, i) => {
      const o = jubelAudio.createOscillator(), g = jubelAudio.createGain(), t = t0 + i * (gross ? .09 : .07);
      o.type = 'triangle'; o.frequency.value = hz;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gross ? .13 : .09, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + (gross ? .5 : .3));
      o.connect(g); g.connect(jubelAudio.destination); o.start(t); o.stop(t + .55);
    });
  } catch (e) {}
}

function jubelBlase(text) {
  const b = document.createElement('div'); b.className = 'jubel-blase'; b.setAttribute('role', 'status'); b.textContent = text;
  document.body.appendChild(b); obenAuf(b); setTimeout(() => b.remove(), 2200);
}
function jubelHuepf(el, cls) { if (!el) return; cls = cls || 'jubel-pop'; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 900); }

/* Richtige Antwort: Knopf hüpft, Konfetti platzt raus, ab 3 in Folge gibt es eine Serien-Blase */
function jubelRichtig(el) {
  jubelSerie++; jubelTon('klein'); jubelHuepf(el);
  if (el && el.getBoundingClientRect) { const r = el.getBoundingClientRect(); if (r.width) jubelPlatzen(r.left + Math.min(r.width / 2, 60), r.top + r.height / 2, 22); }
  if ([3, 5, 10, 15, 20, 30].includes(jubelSerie)) jubelBlase('🔥 ' + jubelSerie + ' richtig in Folge' + (ichName() ? ', ' + ichName() : '') + '!');
}
function jubelDaneben() { jubelSerie = 0; }

/* Großer Moment: Karte mit Avatar + Lob, Kanonen, Klang */
function jubelGross(titel, sub) {
  jubelTon('gross'); jubelKanonen();
  let k = document.getElementById('jubelKarte');
  const n = ichName(), lob = LOB[Math.random() * LOB.length | 0] + (n ? ', ' + n : '') + '!';
  if (k && Date.now() - jubelKarteT < 1800) { /* Läuft schon eine Karte (z. B. Kapitel + neue Stufe), nur ergänzen */
    k.querySelector('.jk-sub').insertAdjacentHTML('beforeend', '<br>' + esc(titel)); return;
  }
  if (k) k.remove();
  k = document.createElement('div'); k.id = 'jubelKarte'; k.className = 'jubel-karte'; k.setAttribute('role', 'status'); k.setAttribute('aria-live', 'polite');
  k.innerHTML = '<div class="jk-av">' + avatarHtml('jk-img') + '</div><p class="jk-lob">' + esc(lob) + '</p><p class="jk-t">' + esc(titel) + '</p><p class="jk-sub">' + esc(sub || '') + '</p>';
  document.body.appendChild(k); obenAuf(k); jubelKarteT = Date.now();
  setTimeout(() => { k.classList.add('weg'); setTimeout(() => k.remove(), 400); }, bewegungAn() ? 2400 : 1800);
}
/* XP-Leiste kurz aufleuchten lassen. Mit n fliegt vorher eine Münze „+n XP“ von unten in den Profil-Chip. */
function jubelXp(n) {
  const chip = document.getElementById('ichBtn'), glow = () => jubelHuepf(document.querySelector('.lvl'), 'jubel-glow');
  if (!n || !chip || !bewegungAn() || !chip.offsetParent || !document.body.animate) { glow(); return; }
  const m = document.createElement('div'); m.className = 'jubel-muenze'; m.setAttribute('aria-hidden', 'true'); m.textContent = '+' + n + ' XP';
  document.body.appendChild(m); obenAuf(m);
  const z = chip.getBoundingClientRect(), b = m.getBoundingClientRect();
  const x0 = innerWidth / 2 - b.width / 2, y0 = innerHeight - 90, x1 = z.left + z.width / 2 - b.width / 2, y1 = z.top + z.height / 2 - b.height / 2;
  const a = m.animate([
    { transform: `translate(${x0}px,${y0}px) scale(.6)`, opacity: 0 },
    { transform: `translate(${x0}px,${y0 - 50}px) scale(1.15)`, opacity: 1, offset: .25 },
    { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) + 40}px) scale(1)`, opacity: 1, offset: .6 },
    { transform: `translate(${x1}px,${y1}px) scale(.5)`, opacity: .2 }
  ], { duration: 950, easing: 'cubic-bezier(.4,0,.2,1)' });
  a.onfinish = () => { m.remove(); glow(); jubelHuepf(chip); };
}

/* Richtig/falsch erkennen, ohne jede Quizart einzeln anzufassen: Wird der zuletzt geklickte Antwortknopf grün, ist es ein Treffer */
(function jubelSetup() {
  let letzte = null;
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.opt, .rs-b'); if (b && !b.closest('#pretest')) letzte = b; }, true);
  const beobachte = () => new MutationObserver(ms => ms.forEach(m => {
    const el = m.target; if (el !== letzte) return;
    const vorher = m.oldValue || '';
    if (el.classList.contains('right') && !/\bright\b/.test(vorher)) { letzte = null; jubelRichtig(el); }
    else if (el.classList.contains('wrong') && !/\bwrong\b/.test(vorher)) { letzte = null; jubelDaneben(); }
  })).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  if (document.body) beobachte(); else document.addEventListener('DOMContentLoaded', beobachte);
  addEventListener('resize', () => { if (jubelCv) jubelLeinwand(); });
})();
