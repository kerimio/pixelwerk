/* ===== Basis: kleine Helfer, Zustand und Speichern, XP und Ränge ===== */
const RANKS = [[0, 'Praktikant'], [300, 'Junior-Dev'], [900, 'Frontend-Dev'], [1700, 'Erfahrener Dev'], [2600, 'Senior-Dev'], [3800, 'Lead-Dev'], [5400, 'Tech Lead'], [7000, 'Principal Engineer'], [8500, 'Angular-Architekt']];
const $ = (s, el) => (el || document).querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const stripHtml = h => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent; };
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }

/* ---------- Zustand ---------- */
const DEFAULT_STATE = { ich: {}, xp: 0, steps: {}, done: {}, quiz: {}, ex: {}, code: {}, days: [], badges: [], updated: 0, srs: {}, cal: { sr: 0, sw: 0, ur: 0, uw: 0 }, schrank: [], schrankNeu: [], pre: {}, offen: {}, gen: {}, reflect: {}, zeile: {}, profil: {}, eigene: {}, arena: { bug: {}, out: {}, rev: {}, iv: [] } };
/* Frische Kopie der Vorgaben, damit nie zwei Zustände dasselbe Objekt teilen. Ein bekanntes Feld mit falscher Art (etwa null
   aus einer kaputten Datei) fällt auf die Vorgabe zurück, damit ein alter oder beschädigter Spielstand die App nicht anhält.
   Felder, die hier nicht stehen, bleiben, wie sie sind. */
const withDefaults = v => {
  const d = JSON.parse(JSON.stringify(DEFAULT_STATE));
  if (v && typeof v === 'object') Object.keys(v).forEach(k => { const x = v[k]; if (!(k in d) || (x != null && typeof x === typeof d[k] && Array.isArray(x) === Array.isArray(d[k]))) d[k] = x; });
  return d;
};
let S = load();
function load() { try { const v = JSON.parse(localStorage.getItem('ngfc.v1')); if (v) return withDefaults(v); } catch (e) {} return withDefaults(); }
/* Angezeigte Nummer einer Phase: ihre Position (1, 2, 3 …). Eigene Kapitel haben keine Nummer. Die Grundlagen heißen nur
   „Grundlagen“ und zählen nicht mit, so bleiben die Nummern der Angular-Phasen gleich, ob man die Grundlagen macht oder nicht. */
const phaseNr = a => !a || a.n === 'E' ? '' : a.grundlagen ? a.title : 'Phase ' + (AKTE.filter(x => x.n !== 'E' && !x.grundlagen).indexOf(a) + 1);
const kapitelPos = ch => { const l = CH.filter(c => c.akt === ch.akt); return 'Kapitel ' + (l.indexOf(ch) + 1) + ' von ' + l.length; };
/* Angefangen heißt: über die Szene hinaus. Wer ein Kapitel nur kurz öffnet, um reinzuschauen, hat es noch nicht angefangen. */
const kapitelBegonnen = c => !S.done[c.id] && S.steps[c.id] > 0;
/* Geschafft zählt nur echte Arbeit: Die Übung ist grün (auch mit Lösung). Ein Kapitel ohne Übung braucht alle Quizfragen richtig.
   Erst dann gibt es XP, Sachen für den Avatar, Abzeichen und Wiederholkarten. */
const kapitelVerdient = c => c.ex ? !!(S.ex[c.ex.id] && S.ex[c.ex.id].passed) : (c.quiz || []).every((q, i) => S.quiz[c.id + ':' + i]);
/* Bis zum Abschluss geblättert, aber noch nicht verdient (S.offen[id] = Zeitpunkt). Steht bei „Wackelt noch“, bis es nachgeholt ist. */
const kapitelOffen = c => !!c && !S.done[c.id] && !!(S.offen || {})[c.id];
/* Grundlagen (die Phase mit grundlagen: true, HTML bis Werkbank). S.ich.weg sagt, was im Einstieg gewählt wurde:
   'grundlagen' = mitmachen, 'angular' = direkt mit Angular starten. Dann bleibt die Phase sichtbar und frei anwählbar, ist aber optional:
   „Dein nächstes Ticket“ überspringt sie, und für „alles geschafft“ zählt sie nicht mit. Ohne Wahl (alter Spielstand, Einstieg
   übersprungen) gilt sie als optional, sobald schon ein Kapitel aus einer späteren Phase geschafft ist. So schickt die neue Phase
   niemanden zurück an den Anfang, der schon weiter ist. */
const grundlagenPhase = () => AKTE.find(a => a.grundlagen);
function grundlagenOptional() {
  const w = (S.ich || {}).weg; if (w === 'angular') return true; if (w === 'grundlagen') return false;
  const p = grundlagenPhase(); if (!p) return false; const ab = AKTE.indexOf(p);
  return CH.some(c => !c.eigen && S.done[c.id] && AKTE.findIndex(a => a.n === c.akt) > ab);
}
const kapitelOptional = c => { const p = grundlagenPhase(); return !!p && !!c && c.akt === p.n && grundlagenOptional(); };
/* Das eine Kapitel, an dem du gerade dran bist: angefangen und offen, sonst das erste offene. Nur angeschaute Kapitel kommen zuletzt.
   Optionale Kapitel (siehe oben) kommen erst, wenn alles andere geschafft ist. */
const currentChapter = () => {
  const l = CH.filter(c => !kapitelOptional(c)).concat(CH.filter(kapitelOptional));
  return l.find(c => kapitelBegonnen(c) && !kapitelOffen(c)) || l.find(c => !S.done[c.id] && !kapitelOffen(c)) || l.find(c => !S.done[c.id]) || CH[CH.length - 1];
};
/* Alle Pflicht-Kapitel geschafft? Optionale Grundlagen zählen nicht mit. */
const allePflichtGeschafft = () => CH.length > 0 && CH.every(c => S.done[c.id] || kapitelOptional(c));
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function streak() {
  const set = new Set(S.days || []); let n = 0; const d = new Date();
  const key = x => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  if (!set.has(key(d))) d.setDate(d.getDate() - 1);
  while (set.has(key(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
/* Abzeichen: werden aus dem Fortschritt berechnet */
/* Phase komplett? n ist die Kennung aus AKTE (0, 'W', 1 …), nicht die angezeigte Nummer. */
const phaseFertig = n => { const c = CH.filter(x => x.akt === n); return c.length > 0 && c.every(x => S.done[x.id]); };
const BADGES = [
  { id: 'anpfiff', icon: '🚀', name: 'Erster Commit', how: 'Erstes Kapitel geschafft', ok: () => Object.keys(S.done).length >= 1 },
  { id: 'bild', icon: '🧠', name: 'Durchblicker', how: '„Das große Bild“ komplett', phase: 0, ok() { return phaseFertig(this.phase); } },
  { id: 'fundament', icon: '🧱', name: 'Fundament', how: '„Grundlagen“ komplett', phase: 'B', ok() { return phaseFertig(this.phase); } },
  { id: 'web', icon: '🌐', name: 'Netzwerker', how: '„Wie das Web funktioniert“ komplett', phase: 'W', ok() { return phaseFertig(this.phase); } },
  { id: 'kreis', icon: '🥉', name: 'Angekommen', how: '„Erste Woche“ komplett', phase: 1, ok() { return phaseFertig(this.phase); } },
  { id: 'bezirk', icon: '🥈', name: 'Probezeit bestanden', how: '„Probezeit“ komplett', phase: 2, ok() { return phaseFertig(this.phase); } },
  { id: 'rx', icon: '🌊', name: 'Stromflüsterer', how: '„Erstes Kundenprojekt“ (RxJS) komplett', phase: 3, ok() { return phaseFertig(this.phase); } },
  { id: 'buli', icon: '🏆', name: 'Teamstütze', how: '„Fest im Team“ komplett', phase: 4, ok() { return phaseFertig(this.phase); } },
  { id: 'natio', icon: '🛠️', name: 'Handwerker', how: '„Profi-Handwerk“ komplett', phase: 6, ok() { return phaseFertig(this.phase); } },
  { id: 'lizenz', icon: '📋', name: 'Agentur-Profi', how: '„Agentur-Alltag“ komplett', phase: 7, ok() { return phaseFertig(this.phase); } },
  { id: 'goat', icon: '🧭', name: 'Tech Lead', how: '„Tech Lead“ komplett', phase: 8, ok() { return phaseFertig(this.phase); } },
  { id: 'quiz10', icon: '🎯', name: 'Scharfschütze', how: '10 Quizfragen sofort richtig', ok: () => Object.values(S.quiz).filter(v => v === 1).length >= 10 },
  { id: 'solo10', icon: '💪', name: 'Ohne Lösung', how: '10 Übungen ohne Lösung anzuschauen', ok: () => Object.values(S.ex).filter(e => e.passed && !e.usedSolution).length >= 10 },
  { id: 'serie3', icon: '🔥', name: 'Dranbleiber', how: '3 Tage am Stück trainiert', ok: () => streak() >= 3 },
  { id: 'gedaechtnis', icon: '🧠', name: 'Gedächtnisprofi', how: '20 Karten sitzen fest (≥ 7 Tage)', ok: () => Object.values(S.srs || {}).filter(c => c.s >= 7).length >= 20 },
  { id: 'kalibriert', icon: '🎯', name: 'Ehrliche Selbsteinschätzung', how: '30× Sicherheit angegeben, bei „sicher“ ≥ 85 % richtig', ok: () => { const c = S.cal || {}, n = (c.sr || 0) + (c.sw || 0); return (n + (c.ur || 0) + (c.uw || 0)) >= 30 && n > 0 && c.sr / n >= 0.85; } },
  { id: 'serie7', icon: '🚀', name: 'Eine Woche dran', how: '7 Tage am Stück gelernt', ok: () => streak() >= 7 },
  { id: 'bugs5', icon: '🐞', name: 'Kammerjäger', how: '5 Bugs in der Bug-Jagd gefixt', ok: () => Object.keys((S.arena || {}).bug || {}).length >= 5 },
  { id: 'orakel', icon: '🔮', name: 'Orakel', how: '15 Ausgaben richtig vorhergesagt', ok: () => Object.values((S.arena || {}).out || {}).filter(o => o.ok).length >= 15 },
  { id: 'reviewer', icon: '👀', name: 'Adlerauge', how: 'Jeden PR der Review-Arena komplett durchschaut', ok: () => typeof REVIEWS !== 'undefined' && REVIEWS.every(r => (((S.arena || {}).rev || {})[r.id] || {}).best === r.issues.length) },
  { id: 'rschule', icon: '🎓', name: 'Review-Coach', how: 'Alle Stationen der Review-Schule geschafft', ok: () => typeof RS_STATIONEN !== 'undefined' && RS_STATIONEN.every(x => (((S.arena || {}).rs || {})[x.id])) },
  { id: 'interview', icon: '🎤', name: 'Interview-reif', how: '10 Interview-Antworten mit Ø 7+', ok: () => { const iv = ((S.arena || {}).iv || []).slice(-10); return iv.length >= 10 && iv.reduce((s, x) => s + x.score, 0) / iv.length >= 7; } }
];
function checkBadges() {
  S.badges = S.badges || [];
  BADGES.forEach(b => { if (!S.badges.includes(b.id) && b.ok()) { S.badges.push(b.id); setTimeout(() => toast(b.icon + ' Abzeichen: ' + b.name), 2400); } });
}
function save() {
  S.days = S.days || []; if (!S.days.includes(today())) S.days.push(today());
  checkBadges();
  if (typeof schrankPruefen === 'function') schrankPruefen();
  S.updated = Date.now();
  try { localStorage.setItem('ngfc.v1', JSON.stringify(S)); } catch (e) {}
  if (typeof dateiPlanen === 'function') dateiPlanen();
}

/* ---------- Automatisch in fortschritt.json speichern (nur mit `npm start`, siehe server.js) ---------- */
var dateiDa = false, dateiT = null, dateiZuletzt = 0;
/* Wo der Spielstand gerade liegt. Wird gemerkt und in den Einstellungen (Reiter „Spielstand“) angezeigt, auch wenn der Dialog erst später aufgeht. */
var hubSync = 'browser';
const HUB_SYNC = {
  browser: 'Dein Spielstand liegt nur in diesem Browser.',
  datei: 'Dein Spielstand wird automatisch in fortschritt.json gespeichert.',
  fehler: 'Speichern in fortschritt.json klappt gerade nicht. Der Spielstand bleibt im Browser.',
  offline: 'Der lokale Server ist nicht erreichbar. Der Spielstand bleibt im Browser.'
};
function hubSyncZeigen(stand) { if (stand) hubSync = stand; const el = document.getElementById('syncState'); if (el) el.textContent = HUB_SYNC[hubSync]; }
async function dateiLaden() {
  if (!/^https?:$/.test(location.protocol) || !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
  try {
    const res = await fetch('/api/fortschritt', { cache: 'no-store' });
    if (!res.ok) return;
    dateiDa = true;
    if (res.status === 200) {
      const remote = await res.json();
      if ((remote.updated || 0) > (S.updated || 0)) { S = withDefaults(remote); try { localStorage.setItem('ngfc.v1', JSON.stringify(S)); } catch (e) {} route(); }
    }
    dateiZuletzt = 0; hubSyncZeigen('datei'); dateiSchreiben();
  } catch (e) {}
}
function dateiPlanen() { if (!dateiDa) return; clearTimeout(dateiT); dateiT = setTimeout(dateiSchreiben, 800); }
async function dateiSchreiben() {
  if (!dateiDa || !S.updated || S.updated === dateiZuletzt) return;
  const stand = S.updated;
  try {
    const res = await fetch('/api/fortschritt', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(S), keepalive: JSON.stringify(S).length < 60000 });
    if (res.ok) dateiZuletzt = stand;
    hubSyncZeigen(res.ok ? 'datei' : 'fehler');
  } catch (e) { hubSyncZeigen('offline'); }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && dateiT) { clearTimeout(dateiT); dateiT = null; dateiSchreiben(); } });
dateiLaden();
function addXp(n, why) {
  const vorher = rank(S.xp).name;
  S.xp += n; save(); renderHud(); toast('+' + n + ' XP' + (why ? ' · ' + why : '')); jubelXp(n);
  const jetzt = rank(S.xp).name; if (jetzt !== vorher) jubelGross('Neuer Rang: ' + jetzt, 'Du bist aufgestiegen.');
}
function rank(xp) { let cur = RANKS[0], next = null; RANKS.forEach((r, i) => { if (xp >= r[0]) { cur = r; next = RANKS[i + 1] || null; } }); return { name: cur[1], from: cur[0], to: next ? next[0] : cur[0], next: next && next[1] }; }
