/* ================= JUBEL =================
   Erfolgsmomente, die sich gut anfühlen: Pixel-Konfetti, ein kurzer Hüpfer, eine Karte mit deinem Avatar,
   auf Wunsch ein kleiner Klang. Nur bei echten Erfolgen (richtige Antwort, Tests grün, Kapitel geschafft,
   neue Stufe), nie während man liest. „Animationen aus“ im Profil oder im System schaltet alles Bewegte ab. */
var cheerCv = null, cheerCtx = null, cheerParts = [], cheerRaf = 0, cheerStreak = 0, cheerAudio = null, cheerCardT = 0;
var PRAISE = ['Stark', 'Sauber', 'Läuft bei dir', 'Richtig gut', 'Klasse', 'Weiter so', 'Genau so'];

/* Über offene Dialoge legen: Popover landen in der obersten Ebene, auch über einem modalen <dialog> */
function onTop(el) {
  if (!el.showPopover) return;
  try { if (!el.hasAttribute('popover')) el.setAttribute('popover', 'manual'); if (el.matches(':popover-open')) el.hidePopover(); el.showPopover(); } catch (e) {}
}
function cheerColors() {
  const cs = getComputedStyle(document.documentElement);
  return [cs.getPropertyValue('--accent'), cs.getPropertyValue('--grass'), '#F5B700', '#FF6B8B', '#36C5F0', '#9B6BFF'].map(s => s.trim()).filter(Boolean);
}
function cheerCanvas() {
  if (!cheerCv) { cheerCv = document.createElement('canvas'); cheerCv.className = 'cheer-cv'; cheerCv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cheerCv); cheerCtx = cheerCv.getContext('2d'); }
  onTop(cheerCv);
  const d = window.devicePixelRatio || 1;
  if (cheerCv.width !== Math.round(innerWidth * d) || cheerCv.height !== Math.round(innerHeight * d)) { cheerCv.width = Math.round(innerWidth * d); cheerCv.height = Math.round(innerHeight * d); }
  cheerCtx.setTransform(d, 0, 0, d, 0, 0);
}
function cheerLoop() {
  const c = cheerCtx; c.clearRect(0, 0, innerWidth, innerHeight);
  cheerParts = cheerParts.filter(p => p.life > 0 && p.y < innerHeight + 40);
  for (const p of cheerParts) {
    p.vy += p.g; p.vx *= p.f; p.vy *= p.f; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
    c.save(); c.globalAlpha = Math.min(1, p.life / 25); c.translate(p.x, p.y); c.rotate(p.r);
    c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s * p.k / 2, p.s, p.s * p.k); c.restore();
  }
  if (cheerParts.length) cheerRaf = requestAnimationFrame(cheerLoop); else { cheerRaf = 0; c.clearRect(0, 0, innerWidth, innerHeight); }
}
function cheerExtra(listing) {
  if (!motionOn() || !document.body) return;
  cheerCanvas(); cheerParts.push(...listing);
  if (!cheerRaf) cheerRaf = requestAnimationFrame(cheerLoop);
}
/* Kleine Explosion an einer Stelle (richtige Antwort) */
function cheerBurst(x, y, n) {
  const f = cheerColors();
  cheerExtra(Array.from({ length: n || 24 }, () => {
    const a = Math.random() * Math.PI * 2, v = 2.5 + Math.random() * 5;
    return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, g: .2, f: .985, r: Math.random() * 6, vr: (Math.random() - .5) * .3, s: 4 + Math.random() * 4, k: 1, c: f[Math.random() * f.length | 0], life: 55 + Math.random() * 30 };
  }));
}
/* Zwei Konfetti-Kanonen von unten links und rechts (großer Erfolg) */
function cheerCannons() {
  const f = cheerColors(), pieces = [];
  [[0, -1], [innerWidth, 1]].forEach(([x0, dir]) => {
    for (let i = 0; i < 70; i++) {
      const a = -Math.PI / 2 - dir * (Math.PI / 5 + Math.random() * Math.PI / 6), v = 11 + Math.random() * 9;
      pieces.push({ x: x0, y: innerHeight, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: .28, f: .975, r: Math.random() * 6, vr: (Math.random() - .5) * .4, s: 6 + Math.random() * 5, k: .5 + Math.random() * .7, c: f[i % f.length], life: 160 + Math.random() * 60 });
    }
  });
  cheerExtra(pieces);
}

/* Klang: kleines Arpeggio mit WebAudio, nur wenn im Profil eingeschaltet */
function cheerSound(kind) {
  if (!(S.player && S.player.sound)) return;
  try {
    cheerAudio = cheerAudio || new (window.AudioContext || window.webkitAudioContext)();
    if (cheerAudio.state === 'suspended') cheerAudio.resume();
    const t0 = cheerAudio.currentTime + .01, large = kind === 'gross';
    const tones = large ? [523.25, 659.25, 783.99, 1046.5] : [783.99, 1174.66];
    tones.forEach((hz, i) => {
      const o = cheerAudio.createOscillator(), g = cheerAudio.createGain(), t = t0 + i * (large ? .09 : .07);
      o.type = 'triangle'; o.frequency.value = hz;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(large ? .13 : .09, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + (large ? .5 : .3));
      o.connect(g); g.connect(cheerAudio.destination); o.start(t); o.stop(t + .55);
    });
  } catch (e) {}
}

function cheerBubble(text) {
  const b = document.createElement('div'); b.className = 'cheer-bubble'; b.setAttribute('role', 'status'); b.textContent = text;
  document.body.appendChild(b); onTop(b); setTimeout(() => b.remove(), 2200);
}
function cheerHop(el, cls) { if (!el) return; cls = cls || 'cheer-pop'; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 900); }

/* Richtige Antwort: Knopf hüpft, Konfetti platzt raus, ab 3 in Folge gibt es eine Serien-Blase */
function cheerCorrect(el) {
  cheerStreak++; cheerSound('klein'); cheerHop(el);
  if (el && el.getBoundingClientRect) { const r = el.getBoundingClientRect(); if (r.width) cheerBurst(r.left + Math.min(r.width / 2, 60), r.top + r.height / 2, 22); }
  if ([3, 5, 10, 15, 20, 30].includes(cheerStreak)) cheerBubble('🔥 ' + cheerStreak + ' richtig in Folge' + (meName() ? ', ' + meName() : '') + '!');
}
function cheerMiss() { cheerStreak = 0; }

/* Großer Moment: Karte mit Avatar + Lob, Kanonen, Klang */
function cheerBig(heading, sub) {
  cheerSound('gross'); cheerCannons();
  let k = document.getElementById('cheerCard');
  const n = meName(), praise = PRAISE[Math.random() * PRAISE.length | 0] + (n ? ', ' + n : '') + '!';
  if (k && Date.now() - cheerCardT < 1800) { /* Läuft schon eine Karte (z. B. Kapitel + neue Stufe), nur ergänzen */
    k.querySelector('.ck-sub').insertAdjacentHTML('beforeend', '<br>' + esc(heading)); return;
  }
  if (k) k.remove();
  k = document.createElement('div'); k.id = 'cheerCard'; k.className = 'cheer-card'; k.setAttribute('role', 'status'); k.setAttribute('aria-live', 'polite');
  k.innerHTML = '<div class="ck-av">' + avatarHtml('ck-img') + '</div><p class="ck-praise">' + esc(praise) + '</p><p class="ck-t">' + esc(heading) + '</p><p class="ck-sub">' + esc(sub || '') + '</p>';
  document.body.appendChild(k); onTop(k); cheerCardT = Date.now();
  setTimeout(() => { k.classList.add('gone'); setTimeout(() => k.remove(), 400); }, motionOn() ? 2400 : 1800);
}
/* XP-Leiste kurz aufleuchten lassen. Mit n fliegt vorher eine Münze „+n XP“ von unten in den Profil-Chip. */
function cheerXp(n) {
  const chip = document.getElementById('meBtn'), glow = () => cheerHop(document.querySelector('.lvl'), 'cheer-glow');
  if (!n || !chip || !motionOn() || !chip.offsetParent || !document.body.animate) { glow(); return; }
  const m = document.createElement('div'); m.className = 'cheer-coin'; m.setAttribute('aria-hidden', 'true'); m.textContent = '+' + n + ' XP';
  document.body.appendChild(m); onTop(m);
  const z = chip.getBoundingClientRect(), b = m.getBoundingClientRect();
  const x0 = innerWidth / 2 - b.width / 2, y0 = innerHeight - 90, x1 = z.left + z.width / 2 - b.width / 2, y1 = z.top + z.height / 2 - b.height / 2;
  const a = m.animate([
    { transform: `translate(${x0}px,${y0}px) scale(.6)`, opacity: 0 },
    { transform: `translate(${x0}px,${y0 - 50}px) scale(1.15)`, opacity: 1, offset: .25 },
    { transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) + 40}px) scale(1)`, opacity: 1, offset: .6 },
    { transform: `translate(${x1}px,${y1}px) scale(.5)`, opacity: .2 }
  ], { duration: 950, easing: 'cubic-bezier(.4,0,.2,1)' });
  a.onfinish = () => { m.remove(); glow(); cheerHop(chip); };
}

/* Richtig/falsch erkennen, ohne jede Quizart einzeln anzufassen: Wird der zuletzt geklickte Antwortknopf grün, ist es ein Treffer */
(function cheerSetup() {
  let latest = null;
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.opt, .rs-b'); if (b && !b.closest('#pretest')) latest = b; }, true);
  const observeIt = () => new MutationObserver(ms => ms.forEach(m => {
    const el = m.target; if (el !== latest) return;
    const previous = m.oldValue || '';
    if (el.classList.contains('right') && !/\bright\b/.test(previous)) { latest = null; cheerCorrect(el); }
    else if (el.classList.contains('wrong') && !/\bwrong\b/.test(previous)) { latest = null; cheerMiss(); }
  })).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  if (document.body) observeIt(); else document.addEventListener('DOMContentLoaded', observeIt);
  addEventListener('resize', () => { if (cheerCv) cheerCanvas(); });
})();
