/* ================= DAS TEAM ALS PIXEL-AVATARE =================
   Jede Figur aus CAST bekommt ein eigenes Gesicht im selben 20 × 20-Raster wie dein Avatar.
   Gemalt wird nicht Pixel für Pixel, sondern aus Bausteinen: Hautton, Frisur, Kleidung und ein, zwei Besonderheiten.
   Das Bild liegt auf der Kachel in der Farbe der Figur, so bleibt jede Person auch auf einen Blick erkennbar.
   Farben sind Indizes aus AV_PAL (1 dunkel, 2 weiß, 3 bis 5 und d Haut- und Haartöne, 6 gelb, 7 blau, 8 rot, 9 grün, a lila, b grau, c rosa, e orange, f dunkelblau). */
var FIGURES = {
  toni: { skin: '4', hair: '5', hairdo: 'kurz', shirt: 'f', extra: ['bart', 'hoodie'] },
  boss: { skin: '3', hair: '5', hairdo: 'dutt', shirt: 'f', extra: ['kragen', 'ohrringe'] },
  sara: { skin: '3', hair: 'e', hairdo: 'lang', shirt: '9', extra: ['headset', 'wangen'] },
  jonas: { skin: 'd', hair: '1', hairdo: 'muetze', cap: 'e', shirt: 'b', extra: ['kopfhoerer'] },
  mia: { skin: '3', hair: '1', hairdo: 'zopf', shirt: 'a', extra: ['brille', 'wangen'] },
  leon: { skin: '3', hair: '1', hairdo: 'scheitel', shirt: 'f', extra: ['krawatte'] },
  ricky: { skin: '4', hair: '6', hairdo: 'stachel', shirt: '7', extra: ['sonnenbrille'] }
};
function figurePaint(m) {
  const N = AV_N, a = new Array(N * N).fill('0'), owns = x => m.extra.includes(x);
  const p = (x, y, c) => { if (x >= 0 && x < N && y >= 0 && y < N) a[y * N + x] = c; };
  const r = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) p(x, y, c); };
  const H = m.skin, R = m.hair, T = m.shirt;
  /* hinten: lange Haare, Pferdeschwanz */
  if (m.hairdo === 'lang') r(4, 3, 15, 16, R);
  if (m.hairdo === 'zopf') { r(15, 4, 16, 12, R); r(16, 13, 16, 14, R); p(15, 5, '8'); }
  /* Körper und Hals */
  r(3, 16, 16, 19, T); r(2, 17, 17, 19, T); r(8, 14, 11, 16, H);
  if (owns('hoodie')) { r(6, 15, 7, 16, T); r(12, 15, 13, 16, T); p(8, 17, '2'); p(8, 18, '2'); p(11, 17, '2'); p(11, 18, '2'); }
  if (owns('kragen')) { r(8, 16, 11, 16, '2'); p(9, 17, '2'); p(10, 17, '2'); p(7, 16, '2'); p(12, 16, '2'); }
  if (owns('krawatte')) { r(8, 16, 11, 16, '2'); r(9, 16, 10, 16, '8'); r(9, 17, 10, 19, '8'); p(8, 17, '2'); p(11, 17, '2'); }
  /* Kopf mit runden Ecken, Ohren */
  r(6, 4, 13, 13, H); r(5, 5, 14, 12, H);
  if (m.hairdo !== 'lang') { p(4, 8, H); p(4, 9, H); p(15, 8, H); p(15, 9, H); }
  /* Gesicht: Augen mit Glanzpunkt, Brauen, Lächeln */
  r(7, 8, 8, 9, '1'); r(11, 8, 12, 9, '1'); p(7, 8, '2'); p(11, 8, '2');
  r(7, 6, 8, 6, R === H ? '1' : R); r(11, 6, 12, 6, R === H ? '1' : R);
  p(8, 11, '1'); p(11, 11, '1'); r(9, 12, 10, 12, '1');
  if (owns('wangen')) { p(6, 11, 'c'); p(13, 11, 'c'); }
  if (owns('bart')) { r(5, 10, 5, 12, R); r(14, 10, 14, 12, R); r(6, 12, 13, 13, R); r(8, 14, 11, 14, R); r(8, 10, 11, 10, R); p(8, 11, H); p(11, 11, H); r(9, 11, 10, 11, '8'); p(9, 12, R); p(10, 12, R); }
  if (owns('ohrringe')) { p(4, 10, '6'); p(15, 10, '6'); }
  /* Frisuren oben */
  const lid = () => { r(6, 1, 13, 1, R); r(5, 2, 14, 4, R); r(5, 5, 5, 6, R); r(14, 5, 14, 6, R); };
  if (m.hairdo === 'kurz' || m.hairdo === 'lang' || m.hairdo === 'zopf') lid();
  if (m.hairdo === 'lang') { r(5, 5, 5, 7, R); r(14, 5, 14, 7, R); }
  if (m.hairdo === 'dutt') { lid(); r(8, 0, 11, 0, R); r(7, 1, 12, 1, R); }
  if (m.hairdo === 'scheitel') { lid(); r(10, 5, 13, 5, R); p(8, 2, '0'); p(8, 1, '0'); }
  if (m.hairdo === 'stachel') { lid(); [5, 8, 11].forEach(x => { p(x, 1, R); p(x + 1, 0, R); p(x + 2, 0, R); }); p(14, 1, R); p(15, 2, R); r(6, 5, 7, 5, R); r(12, 5, 13, 5, R); }
  if (m.hairdo === 'muetze') { r(5, 1, 14, 4, m.cap); r(4, 4, 15, 5, '1'); r(9, 0, 10, 0, '2'); }
  /* Brillen und Technik */
  if (owns('brille')) { [6, 10].forEach(x => { r(x, 7, x + 3, 7, '8'); p(x, 8, '8'); p(x + 3, 8, '8'); r(x + 1, 10, x + 2, 10, '8'); }); p(5, 8, '8'); p(14, 8, '8'); }
  if (owns('sonnenbrille')) { r(5, 7, 14, 7, '1'); r(6, 8, 9, 9, '1'); r(10, 8, 13, 9, '1'); p(7, 8, '2'); p(11, 8, '2'); }
  if (owns('kopfhoerer')) { r(3, 7, 4, 11, '1'); r(15, 7, 16, 11, '1'); r(4, 6, 4, 6, '1'); r(15, 6, 15, 6, '1'); }
  if (owns('headset')) { r(3, 7, 4, 10, 'b'); p(5, 11, 'b'); p(6, 12, 'b'); p(7, 12, '1'); }
  return a.join('');
}
var FIGURE_IMAGE = {};
/* Das Bild einer Figur als Daten-URL, '' für Figuren ohne Gesicht (die Erzählstimme, du selbst) */
function figureUrl(who) {
  if (!FIGURES[who]) return '';
  return FIGURE_IMAGE[who] || (FIGURE_IMAGE[who] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(avatarSvg(figurePaint(FIGURES[who]), 80, {})));
}
/* Inhalt der Kachel: das Pixel-Gesicht, sonst wie früher der Anfangsbuchstabe */
function figureHead(who) {
  const u = figureUrl(who), c = CAST[who] || {};
  return u ? '<img class="px-av fig-av" src="' + u + '" alt="">' : esc(c.initial || '');
}
/* Toni steckt auch in festem HTML und in CSS (Chat, Review): dort zeigt die Variable --fig-toni sein Gesicht */
document.documentElement.style.setProperty('--fig-toni', 'url("' + figureUrl('toni') + '")');
