/* ===== Lernen: Wiederholen in Abständen, freie Runde, Vorab-Tipp, Lösung mit Lücken, Seite „Wie diese App beim Lernen hilft“ =====
   Welche Quelle welche Funktion trägt: siehe WISSEN unten (Seite #wissen). */
const DAY = 864e5;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/* Antworten einer Quizfrage in gemischter Reihenfolge: data-i bleibt der Index aus den Daten, die Tasten-Zahl ist die Stelle am Bildschirm. */
/* pre: schon abgegebener Tipp (Index aus den Daten). Dann ist diese Antwort markiert und alle sind gesperrt. */
const leOpts = (q, pre) => shuffle(q.options.map((o, j) => j)).map((j, n) => `<button class="opt${pre === j ? ' picked' : ''}" type="button" data-i="${j}"${pre != null ? ' disabled' : ''}><span class="key">${n + 1}</span>${esc(q.options[j])}</button>`).join('');
function srs() { return S.srs || (S.srs = {}); }
/* Fragen, Begründungen und Übungsziele sind HTML (mit <code>). Ein rohes <T> oder <button> darin würde der Browser
   schlucken oder als echtes Element bauen: Alles außer einfacher Auszeichnung erscheint als Text. */
const leHtml = s => String(s == null ? '' : s).replace(/<(?!\/?(?:code|b|i|em|strong|br)\s*\/?>)/g, '&lt;');

/* Lerntag: Karten werden um 4 Uhr früh fällig, nicht um Mitternacht. Wer um 23:50 ein Kapitel schafft, soll es nicht
   zehn Minuten später schon wiederholen. Gerechnet wird in Kalendertagen statt in 24-Stunden-Schritten, sonst verschluckt
   oder verdoppelt die Zeitumstellung einen Tag. leFaelligIn(1) = morgen früh, leFaelligIn(0, t) = Beginn des Lerntags von t. */
const LE_TAG_AB = 4;
function leFaelligIn(tage, ab) {
  const d = new Date(ab == null || isNaN(ab) ? Date.now() : ab); d.setHours(d.getHours() - LE_TAG_AB);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + tage, LE_TAG_AB).getTime();
}
/* Lerntage von heute bis t: 1 = morgen */
const leTageBis = t => Math.round((leFaelligIn(0, t) - leFaelligIn(0)) / DAY);
const leWann = t => { const n = leTageBis(t); return n <= 1 ? 'morgen' : 'in ' + n + ' Tagen'; };

/* Karten: q:<kapitel>:<nr> Quizfrage · m:<kapitel> Merksätze aus dem Kopf · x:<kapitel> Übung aus dem Kopf.
   Sie entstehen, sobald ein Kapitel geschafft ist. Die erste Wiederholung kommt nach 1, 2 oder 4 Tagen. */
function srsSeed() {
  const c = srs();
  CH.forEach(ch => {
    const d = S.done[ch.id]; if (!d) return;
    const add = (k, tage) => { if (!c[k]) c[k] = { s: 0, n: 0, l: 0, due: leFaelligIn(tage, typeof d === 'number' ? d : Date.now()) }; };
    ch.quiz.forEach((q, i) => add('q:' + ch.id + ':' + i, 1));
    if (ch.merke && ch.merke.length) add('m:' + ch.id, 2);
    /* Übung, die nur mit Lösung oder nach vielen Fehlversuchen klappte: schon nach 2 Tagen aus dem Kopf */
    const e = ch.ex && (S.ex || {})[ch.ex.id];
    if (ch.ex) add('x:' + ch.id, e && (e.usedSolution || e.fails >= 3) ? 2 : 4);
  });
}
/* Karte zum Schlüssel. null, wenn es Kapitel, Frage oder Übung nicht mehr gibt: Solche Karten zählen nirgends mit. */
function srsCard(k) {
  const p = String(k).split(':'), ch = CH.find(c => c.id === p[1]); if (!ch) return null;
  if (p[0] === 'q') { const q = ch.quiz[+p[2]]; return q ? { t: 'q', k, ch, q, i: +p[2] } : null; }
  if (p[0] === 'm') return ch.merke && ch.merke.length ? { t: 'm', k, ch } : null;
  if (p[0] === 'x') return ch.ex ? { t: 'x', k, ch } : null;
  return null;
}
function srsDue(now) { srsSeed(); const c = srs(); now = now || Date.now(); return Object.keys(c).filter(k => c[k].due <= now && srsCard(k)); }
/* Bewertung: 0 = daneben, 1 = richtig, aber unsicher, 2 = sitzt. Der Abstand (s, in Tagen) wächst bei Erfolg
   (×2,5 bzw. ×1,3), nie über ein Jahr, und fällt nach einem Fehler auf ein Drittel.
   Nach einem Fehler kommt die Karte immer morgen wieder (r = 1: Auffrischung offen). Sitzt sie dann, gilt der gekürzte
   Abstand, erst beim Mal danach wächst er wieder. So bleibt die Leiter 1, 3, 7, 18 … Tage, wie sie war. */
function srsGrade(k, g) {
  const c = srs()[k]; if (!c) return;
  const auffrischen = c.r && g > 0; delete c.r;
  if (g === 0) { c.l = (c.l || 0) + 1; c.s = Math.max(1, Math.round((c.s || 0) * 0.3)); if (c.s > 1) c.r = 1; }
  else if (!c.n || !(c.s >= 1)) c.s = g === 2 ? 3 : 1.5;
  else if (!auffrischen) c.s = Math.min(365, c.s * (g === 2 ? 2.5 : 1.3));
  c.n = (c.n || 0) + 1; c.last = Date.now();
  const fuzz = c.s < 4 ? 1 : 0.9 + Math.random() * 0.2;
  c.due = leFaelligIn(g === 0 ? 1 : Math.max(1, Math.round(c.s * fuzz)));
}
/* total: Karten · naechste: Zeitpunkt der nächsten noch nicht fälligen Karte (oder null) */
function srsStats() {
  srsSeed();
  const c = srs(), now = Date.now(), ks = Object.keys(c).filter(k => srsCard(k)), spaeter = ks.filter(k => c[k].due > now);
  return { total: ks.length, naechste: spaeter.length ? Math.min(...spaeter.map(k => c[k].due)) : null };
}

/* ---------- Wie sicher? Die Frage gibt es nur beim Wiederholen: Sie bestimmt den nächsten Abstand. ---------- */
function cal() { return S.cal || (S.cal = { sr: 0, sw: 0, ur: 0, uw: 0 }); }
function calRecord(sure, right) { const c = cal(), k = (sure ? 's' : 'u') + (right ? 'r' : 'w'); c[k] = (c[k] || 0) + 1; }
/* Trefferquote bei „sicher“ in Prozent, sobald es dafür mindestens fünf Antworten gibt */
function calText() {
  const c = cal(), n = (c.sr || 0) + (c.sw || 0);
  return n >= 5 ? { ps: Math.round((c.sr || 0) / n * 100), n } : null;
}
/* Nach der Wahl, vor der Auflösung: erst danach wäre die Einschätzung vom Ergebnis gefärbt. */
function askConf(host, cb) {
  host.innerHTML = '<div class="conf" role="group" aria-label="Wie sicher bist du?"><span class="le-conf-f">Wie sicher bist du?</span><button class="cf" type="button" data-c="1"><span class="key">1</span>Sicher</button><button class="cf" type="button" data-c="0"><span class="key">2</span>Eher geraten</button></div>';
  host.querySelectorAll('.cf').forEach(b => b.onclick = () => { host.innerHTML = ''; cb(b.dataset.c === '1'); });
  host.querySelector('.cf').focus({ preventScroll: true });
}
const HYPER = '<p class="hyper">Sicher und daneben: Solche Fehler bleiben nach der Korrektur meist besonders gut hängen. Lies die Erklärung einmal genau.</p>';

/* ---------- Vorab-Tipp („Dein Tipp?“): die erste Quizfrage raten, bevor man es lernt ---------- */
function preTestHtml(ch) {
  const q = ch.quiz[0]; if (!q) return '';
  const pre = (S.pre || {})[ch.id];
  if (pre == null && (S.done[ch.id] || S.quiz[ch.id + ':0'])) return '';
  return `<div class="pretest" id="pretest"><p class="le-pre-t">Dein Tipp?</p><p class="le-pre-s">Rate einfach: Das hilft beim Behalten und zählt nicht.</p><h3 class="q">${leHtml(q.q)}</h3>
    <div class="opts">${leOpts(q, pre)}</div>
    <p class="pre-msg" aria-live="polite">${pre != null ? LE_TIPP_OK : ''}</p></div>`;
}
const LE_TIPP_OK = 'Gemerkt. Die Auflösung kommt im Quiz.';
function wirePreTest(body, ch) {
  const box = $('#pretest', body); if (!box) return;
  box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    S.pre = S.pre || {}; S.pre[ch.id] = +b.dataset.i; save();
    box.querySelectorAll('.opt').forEach(x => x.disabled = true); b.classList.add('picked');
    $('.pre-msg', box).textContent = LE_TIPP_OK;
  });
}
function preNote(ch, i) {
  if (i !== 0) return '';
  const pre = (S.pre || {})[ch.id], q = ch.quiz[0];
  if (pre == null || !q || q.options[pre] == null) return '';
  return `<p class="pre-note">Du hattest <b>${esc(q.options[pre])}</b> getippt. ${pre === q.correct ? 'Das stimmte.' : 'Jetzt weißt du es genauer.'}</p>`;
}

/* ---------- Lösung mit Lücken: Zeilen aus dem Startcode und das Gerüst bleiben stehen, der Rest wird zur Lücke ---------- */
function fadeSolution(sol, starter) {
  const have = new Set(String(starter || '').split('\n').map(l => l.trim()).filter(Boolean));
  return sol.split('\n').map(l => {
    const t = l.trim();
    if (!t || have.has(t) || /^[{}()[\];,`<>/]+$/.test(t) || t.startsWith('//') || t.startsWith('}') || t.startsWith('import ') || t.startsWith('@Component') || t.startsWith('export class')) return l;
    const ind = l.match(/^\s*/)[0], open = /\{\s*$/.test(t) ? ' {' : '';
    if (t.startsWith('<') || t.startsWith('{{')) {
      /* Template-Zeile: Struktur bleibt, Inhalte von {{ }} und Bindungen werden Lücken */
      const h = t.replace(/\{\{[^}]*\}\}/g, '{{ ____ }}').replace(/(\[[\w.@-]+\]|\([\w.@-]+\)|@\w+)\s*(=\s*"[^"]*"|\([^)]*\))/g, (x, a, b) => a + (b.trim()[0] === '=' ? '="____"' : '(____)'));
      return ind + (h !== t ? h : t.replace(/^(<[\w-]+).*$/, '$1 ____'));
    }
    const m = t.match(/^(['"][^'"]+['"]\s*:)/) || t.match(/^(.*?(=>|=|return\b|\(|:))/);
    const keep = m && m[1].length < t.length * 0.75 ? m[1] : t.slice(0, Math.max(3, Math.ceil(t.length * 0.35)));
    return ind + keep + ' ____' + open;
  }).join('\n');
}

/* ---------- Wiederholen: eine Runde aus fälligen Karten, sonst auf Wunsch eine freie Runde ---------- */
/* Mischen: wo es geht, nie zweimal hintereinander dasselbe Kapitel und möglichst auch nicht dieselbe Phase */
function leMischen(keys) {
  const rest = shuffle(keys.slice()), out = [];
  while (rest.length) {
    const prev = out.length ? srsCard(out[out.length - 1]).ch : null;
    let j = prev ? rest.findIndex(k => { const ch = srsCard(k).ch; return ch.id !== prev.id && ch.akt !== prev.akt; }) : 0;
    if (j < 0) j = rest.findIndex(k => srsCard(k).ch.id !== prev.id);
    out.push(rest.splice(j < 0 ? 0 : j, 1)[0]);
  }
  return out;
}
/* Fällige Karten für eine Runde: die am längsten überfälligen zuerst, höchstens 15, davon 3 Merksatz-Karten und 1 Übung (am Schluss).
   Karten aus Themen, die bei dir wackeln (staerken.js), rücken nach vorn: Sie zählen bis zu doppelt so dringend. */
function wdhRunde() {
  const c = srs(), now = Date.now(), sw = schwachKarte(), dran = k => (now - c[k].due + DAY) / Math.max(1, c[k].s) * (1 + (sw[k.split(':')[1]] || 0));
  const pick = []; let nm = 0, nx = 0;
  srsDue(now).sort((a, b) => dran(b) - dran(a)).forEach(k => { if (pick.length >= 15) return; if (k[0] === 'm') { if (nm >= 3) return; nm++; } if (k[0] === 'x') { if (nx >= 1) return; nx++; } pick.push(k); });
  return leMischen(pick.filter(k => k[0] !== 'x')).concat(pick.filter(k => k[0] === 'x'));
}
/* Freie Runde: bis zu 7 Quizfragen aus gespielten Kapiteln. Was du in freien Runden falsch hattest (S.weak), wird öfter gezogen.
   Eine Frage, die im Kapitel erst im zweiten Anlauf saß (S.quiz > 1), zählt wie ein solcher Fehler.
   Dazu zieht jedes Thema, das bei dir wackelt (staerken.js), bis zu drei Lose mehr pro Frage. */
function leFreiPool() {
  const lose = [], sw = schwachKarte();
  CH.filter(c => S.done[c.id] || S.steps[c.id]).forEach(c => c.quiz.forEach((q, i) => { const k = c.id + ':' + i, w = Math.min(((S.weak || {})[k] || 0) + (S.quiz[k] > 1 ? 1 : 0), 3); for (let n = 0; n < 1 + w * 2 + Math.round((sw[c.id] || 0) * 3); n++) lose.push('q:' + c.id + ':' + i); }));
  const pick = new Set(), max = Math.min(7, new Set(lose).size);
  while (pick.size < max) pick.add(lose[Math.floor(Math.random() * lose.length)]);
  return leMischen([...pick]);
}
const leKopf = (titel, stand) => `<header class="le-kopf"><div class="ort"><a href="#start">← Schreibtisch</a>${stand ? '<p id="leStand" aria-live="polite"></p>' : ''}</div><h1>${titel}</h1>${stand ? '<div class="le-balken" aria-hidden="true"><i id="wdhBar"></i></div>' : ''}</header>`;
const leKarten = n => n + (n === 1 ? ' Karte' : ' Karten');

let leOffen = null; /* schreibt die XP der laufenden Runde gut, wenn man die Seite mittendrin verlässt */
/* gleichFrei: Der Link „Freie Runde“ vom Schreibtisch (#wdh-frei) startet sie ohne Zwischenseite, wenn nichts fällig ist. */
function renderWdh(main, gleichFrei) {
  if (leOffen) leOffen();
  const dran = wdhRunde();
  if (dran.length) return leRunde(main, dran, false);
  const st = srsStats(), frei = leFreiPool();
  if (gleichFrei && frei.length) return leRunde(main, frei, true);
  main.innerHTML = leKopf('Wiederholen') + `<div class="card le-ruhe"><h2>Nichts zu wiederholen</h2>
    <p>${st.naechste ? 'Die nächste Karte kommt ' + leWann(st.naechste) + '.' : 'Nach deinem ersten Kapitel kommen seine Fragen hier in Abständen wieder.'}</p>
    ${frei.length ? `<div class="le-weiter"><button class="btn primary" id="leFrei" type="button">Freie Runde</button></div><p class="le-hinweis">${frei.length === 1 ? '1 Frage' : frei.length + ' Fragen'} aus deinen Kapiteln. Die Abstände bleiben, wie sie sind.</p>` : ''}</div>`;
  if (frei.length) $('#leFrei', main).onclick = () => leRunde(main, frei, true);
}

/* Eine Runde. frei = false: Sitzung mit fälligen Karten, jede Bewertung bestimmt den nächsten Abstand.
   frei = true: nur Quizfragen, ohne Sicherheitsfrage, die Abstände bleiben unberührt (dafür zählt S.weak mit). */
/* titel: eigene Überschrift (Üben eines Themas, staerken.js) */
function leRunde(main, keys, frei, titel) {
  const queue = keys.map(k => ({ k, again: 0 })), total = queue.length;
  let done = 0, sass = 0, xp = 0, serie = 0; const daneben = new Map();
  main.innerHTML = leKopf(esc(titel || (frei ? 'Freie Runde' : 'Wiederholen')), true) + '<div id="wdhBody"></div>';
  const body = $('#wdhBody', main);
  const gutschreiben = () => {
    removeEventListener('hashchange', gutschreiben); if (leOffen === gutschreiben) leOffen = null;
    const n = xp; xp = 0; if (n) addXp(n, frei ? 'Freie Runde' : 'Wiederholen');
  };
  leOffen = gutschreiben; addEventListener('hashchange', gutschreiben);

  /* Kann auch feuern, wenn die Seite schon weg ist (Tests einer Übung laufen noch): dann gibt es nichts zu zeigen */
  const stand = () => { const b = $('#wdhBar', main); if (!b) return; b.style.width = Math.round(done / total * 100) + '%'; $('#leStand', main).textContent = done + ' von ' + total + ' geschafft'; };
  /* g: 0 = daneben, 1 = wackelig, 2 = sitzt. Nur der erste Versuch einer Karte zählt für Abstand, XP und Bilanz. */
  const fertig = (item, g) => {
    const card = srsCard(item.k), x = card.t === 'x';
    if (!item.again) {
      if (g) sass++; else daneben.set(card.ch.id, card.ch);
      if (frei && x) {
        /* Code aus dem Kopf beim Üben eines Themas: zählt fürs Thema (S.ux, staerken.js), nicht für den Abstand */
        const u = S.ux || (S.ux = {}), st = u[card.ch.id] || (u[card.ch.id] = { r: 0, f: 0 }); st[g ? 'r' : 'f']++;
        if (g) xp += 20;
      } else if (frei) {
        const w = S.weak || (S.weak = {}), wk = card.ch.id + ':' + card.i;
        if (g) { xp += 5; if (++serie === 5) xp += 15; if (w[wk] > 1) w[wk]--; else delete w[wk]; }
        else { serie = 0; w[wk] = (w[wk] || 0) + 1; }
      } else { srsGrade(item.k, g); xp += x ? (g ? 20 : 5) : 3; }
    }
    /* Nochmal, bis es sitzt: Was daneben war, kommt in dieser Runde wieder (höchstens zweimal) */
    if (g === 0 && item.again < 2 && !x) queue.splice(Math.min(queue.length, 3 + Math.floor(Math.random() * 2)), 0, { k: item.k, again: item.again + 1 });
    else done++;
    save(); stand();
  };
  const weiterKnopf = host => {
    host.insertAdjacentHTML('beforeend', '<div class="le-weiter"><button class="btn primary" id="wdhWeiter" type="button">Weiter</button></div>');
    const b = $('#wdhWeiter', host); b.onclick = zeig; b.focus({ preventScroll: true });
    if (b.getBoundingClientRect().bottom > innerHeight) b.scrollIntoView({ block: 'end', behavior: bewegungAn() ? 'smooth' : 'auto' });
  };
  const zeig = () => {
    if (currentExercise) { currentExercise.dispose(); currentExercise = null; }
    main.classList.remove('wide'); stand();
    if (!queue.length) return ende();
    const item = queue.shift(), card = srsCard(item.k), ch = card.ch;
    const label = was => `<p class="le-label">${item.again ? 'Nochmal, bis es sitzt · ' : ''}${esc(was)}</p>`;
    if (card.t === 'q') {
      const q = card.q;
      body.innerHTML = `<div class="le-karte">${label(ch.title)}<h2 class="le-frage" tabindex="-1">${leHtml(q.q)}</h2><div class="le-opts">${leOpts(q)}</div><div class="conf-slot"></div><div class="le-warum" aria-live="polite"></div></div>`;
      const opts = [...body.querySelectorAll('.opt')], gut = opts.find(b => +b.dataset.i === q.correct);
      opts.forEach(b => b.onclick = e => {
        if (e.detail > 1) return; /* zweiter Klick eines Doppelklicks auf „Weiter“ der Karte davor */
        opts.forEach(o => o.disabled = true); b.classList.add('picked');
        const right = b === gut;
        /* sure: true/false aus der Sicherheitsfrage, null ohne Frage (freie Runde, zweiter Versuch) */
        const aufloesen = sure => {
          b.classList.remove('picked'); b.classList.add(right ? 'right' : 'wrong'); gut.classList.add('right');
          $('.key', gut).textContent = '✓'; if (!right) $('.key', b).textContent = '✗';
          if (sure != null) calRecord(sure, right);
          /* Sicher und daneben: ein Missverständnis. Zählt fürs Thema (staerken.js). */
          if (sure && !right && !item.again) { const sc = srs()[item.k]; if (sc) sc.sf = (sc.sf || 0) + 1; }
          $('.le-warum', body).innerHTML = (right ? (sure === false ? '<b>Richtig, aber geraten.</b> Die Karte kommt früher wieder. ' : sure ? '<b>Sitzt.</b> ' : '<b>Richtig.</b> ') : '<b>Daneben.</b> ') + leHtml(q.why) + (!right && sure ? HYPER : '');
          fertig(item, right ? (sure === false ? 1 : 2) : 0);
          weiterKnopf(body.firstElementChild);
        };
        if (frei || item.again) aufloesen(null); else askConf($('.conf-slot', body), aufloesen);
      });
    } else if (card.t === 'm') {
      body.innerHTML = `<div class="le-karte">${label('Merksätze')}<h2 class="le-frage" tabindex="-1">Was nimmst du aus „${esc(ch.title)}“ mit?</h2><p class="le-hinweis">Erst aus dem Kopf. Stichworte reichen, im Kopf aufsagen zählt auch.</p>
        <textarea class="recall" id="recallIn" rows="3" aria-label="Deine Stichworte" placeholder="Stichworte …"></textarea><div class="le-weiter"><button class="btn primary" id="aufdecken" type="button">Aufdecken</button></div><div id="mOut"></div></div>`;
      $('#aufdecken', body).onclick = e => {
        e.currentTarget.parentElement.remove();
        const mine = $('#recallIn', body); if (mine.value.trim()) mine.readOnly = true; else mine.remove();
        $('#mOut', body).innerHTML = `<p class="le-label le-ab" tabindex="-1">So steht es im Kapitel</p><ul class="le-merke">${ch.merke.map(m => '<li>' + esc(m) + '</li>').join('')}</ul>
          <p class="le-label le-ab" id="leWieviel">Wie viel hattest du?</p><div class="grades" role="group" aria-labelledby="leWieviel"><button class="gr bad" type="button" data-g="0"><span class="key">1</span>Kaum was</button><button class="gr" type="button" data-g="1"><span class="key">2</span>Teilweise</button><button class="gr good" type="button" data-g="2"><span class="key">3</span>Fast alles</button></div>`;
        $('#mOut .le-ab', body).focus({ preventScroll: true });
        body.querySelectorAll('.gr').forEach(b => b.onclick = e => { if (e.detail > 1) return; fertig(item, +b.dataset.g); zeig(); });
      };
    } else {
      const ex = ch.ex;
      body.innerHTML = `<div class="le-karte">${label('Code aus dem Kopf')}<h2 class="le-frage" tabindex="-1">${esc(ex.title)}</h2><p class="le-ziel">${leHtml(ex.goal)}</p><p class="le-hinweis">Dieselbe Übung, frischer Startcode. Je weniger Hilfe du brauchst, desto später kommt sie wieder.</p>
        <div class="le-weiter"><button class="btn primary" id="xLos" type="button">Los</button><button class="linkbtn" id="xSkip" type="button">Heute nicht</button></div></div>`;
      $('#xSkip', body).onclick = () => { if (!frei && srs()[item.k]) srs()[item.k].due = leFaelligIn(1); done++; save(); zeig(); };
      $('#xLos', body).onclick = () => {
        main.classList.add('wide');
        /* Eigene Leiste über der Übung: Aufgeben und Weiter hängen nicht am Innenleben von renderCode */
        body.innerHTML = '<div class="le-xbar"><span class="le-label">Code aus dem Kopf</span><button class="linkbtn" id="leAuf" type="button">Aufgeben, morgen nochmal</button></div><div class="wdh-x"></div>';
        const bar = body.firstElementChild; let bewertet = false;
        $('#leAuf', bar).onclick = () => { if (!bewertet) { bewertet = true; fertig(item, 0); } zeig(); };
        renderCode(bar.nextElementSibling, ex, ch, { review: true, onPass: r => {
          if (bewertet) return; bewertet = true;
          fertig(item, r.sol ? 0 : (r.hints || r.fails > 1) ? 1 : 2);
          $('#leAuf', bar).remove();
          weiterKnopf(bar);
        } });
        highlightIn(body); wireAnno(body);
      };
    }
    $('.le-frage', body).focus({ preventScroll: true });
  };
  const ende = () => {
    const plus = xp, alles = sass === total;
    $('#leStand', main).textContent = '';
    gutschreiben();
    if (alles && total >= 3) jubelGross('Alles richtig', leKarten(total) + ' beim ersten Versuch.');
    let mitte = '', rest = 0;
    if (frei) {
      mitte = daneben.size ? `<p class="le-label le-ab">Nochmal ansehen</p><ul class="le-nach">${[...daneben.values()].map(c => `<li><a href="#${c.id}">${esc(c.title)}</a></li>`).join('')}</ul>` : '';
    } else {
      /* Was kommt wann wieder: die Karten dieser Runde nach ihrem neuen Termin */
      const c = srs(), t = [...new Set(keys)].map(k => leTageBis(c[k].due)), eimer = [['morgen', t.filter(n => n <= 1).length], ['in 2 bis 7 Tagen', t.filter(n => n > 1 && n <= 7).length], ['später', t.filter(n => n > 7).length]];
      const ct = calText(); rest = srsDue().length;
      mitte = `<p class="le-label le-ab">So kommen sie wieder</p><ul class="le-wann">${eimer.filter(e => e[1]).map(e => `<li><b>${e[1]}</b><span>${e[0]}</span></li>`).join('')}</ul>`
        + (ct ? `<p class="le-hinweis">Wenn du „sicher“ sagst, stimmt es bisher in ${ct.ps}\u00a0% der Fälle.</p>` : '')
        + (rest ? `<p class="le-hinweis">Noch ${leKarten(rest)} fällig.</p>` : '');
    }
    /* Mit KI: Toni schreibt neue Fragen zu dem Thema, das in dieser Runde daneben war, sonst zum wackeligsten.
       So bleibt es nicht bei denselben Fragen, deren Antwort man irgendwann auswendig weiß. */
    const toniCh = aiCfg().key ? ([...daneben.values()][0] || (baustellen(1)[0] || {}).ch || srsCard(keys[0]).ch) : null;
    const toniTipp = toniCh ? `<p class="le-hinweis le-toni">Lust auf Fragen, die du noch nicht kennst? <a href="#tonifragen-${esc(toniCh.id)}">Neue Fragen von Toni zu „${esc(toniCh.title)}“</a></p>` : '';
    body.innerHTML = `<div class="le-bilanz"><p class="le-zahl${alles ? ' le-voll' : ''}" tabindex="-1">${sass} von ${total}</p><p class="le-label">${frei ? 'richtig' : sass === 1 ? 'saß' : 'saßen'} beim ersten Versuch${plus ? ' · +' + plus + ' XP' : ''}</p>${mitte}
      ${toniTipp}
      <div class="le-weiter"><a class="btn primary big" id="leHeim" href="#start">Zum Schreibtisch</a>${frei || rest ? `<button class="linkbtn" id="leNochmal" type="button">${frei ? 'Noch eine Runde' : 'Nächste Runde'}</button>` : ''}</div></div>`;
    const nochmal = $('#leNochmal', body);
    if (nochmal) nochmal.onclick = () => { const neu = frei ? (titel ? shuffle(keys.slice()) : leFreiPool()) : []; if (neu.length) leRunde(main, neu, true); else renderWdh(main); scrollTo(0, 0); };
    $('#leHeim', body).focus({ preventScroll: true });
  };
  zeig();
}

/* ---------- Seite „Wie diese App beim Lernen hilft“: was die App tut, warum, und worauf sich das stützt ---------- */
const LE_DOI = 'https://doi.org/';
const WISSEN = [
  { t: 'Verteilt wiederholen', was: 'Quizfragen kommen nach 1 Tag wieder, Merksätze nach 2, die Übung nach 4. Sitzt es, wächst der Abstand: etwa 3, 7, 18 Tage.', warum: 'Über Tage verteilt bleibt meist mehr hängen als alles an einem Stück.', q: [['Cepeda u. a. 2006, Psychological Bulletin (Meta-Analyse)', '10.1037/0033-2909.132.3.354'], ['Carpenter, Pan & Butler 2022, Nature Reviews Psychology (Überblick)', '10.1038/s44159-022-00089-1']] },
  { t: 'Abrufen statt nachlesen', was: 'Quiz, „Was nimmst du mit?“ und Code aus dem Kopf: Du holst das Wissen selbst hervor.', warum: 'Sich zu erinnern festigt meist besser, als denselben Text nochmal zu lesen.', q: [['Roediger & Karpicke 2006, Psychological Science', '10.1111/j.1467-9280.2006.01693.x'], ['Yang u. a. 2021, Psychological Bulletin (Meta-Analyse, Unterricht)', '10.1037/bul0000309']] },
  { t: 'Nochmal, bis es sitzt', was: 'Eine falsche Karte kommt in derselben Runde wieder und am nächsten Tag noch einmal.', warum: 'Bis zum Treffer üben und das an späteren Tagen wiederholen hält Wissen meist lange.', q: [['Rawson & Dunlosky 2022, Current Directions in Psychological Science (Überblick)', '10.1177/09637214221100484']] },
  { t: 'Mehr Übung, wo es hakt', was: 'Die App rechnet aus deinen Antworten, welche Themen wackeln. Die kommen öfter dran, und in Übungen kommt Hilfe früher.', warum: 'Übung, die sich nach deinem Stand richtet, bringt meist mehr als für alle die gleiche.', q: [['Kulik & Fletcher 2016, Review of Educational Research (Meta-Analyse, Tutor-Systeme)', '10.3102/0034654315581420']] },
  { t: 'Wie sicher bist du?', was: 'Beim Wiederholen sagst du vor der Auflösung, ob du sicher bist. Geratenes kommt früher wieder.', warum: 'Richtig geraten ist noch nicht gewusst. Und wer sicher war und danebenlag, behält die Korrektur meist besonders gut.', q: [['Metcalfe 2017, Annual Review of Psychology (Überblick)', '10.1146/annurev-psych-010416-044022']] },
  { t: 'Gemischt statt am Stück', was: 'Beim Wiederholen wechseln sich die Kapitel ab, wo immer es geht.', warum: 'Mischen hilft oft, Ähnliches auseinanderzuhalten. Wie stark, hängt vom Stoff ab.', q: [['Brunmair & Richter 2019, Psychological Bulletin (Meta-Analyse)', '10.1037/bul0000209']] },
  { t: 'Dein Tipp?', was: 'Vor den Folien rätst du eine Quizfrage. Das zählt nicht.', warum: 'Raten vor dem Lernen hilft oft beim Behalten, auch wenn der Tipp falsch war.', q: [['Pan & Carpenter 2023, Educational Psychology Review (Überblick)', '10.1007/s10648-023-09814-5']] },
  { t: 'Erst selbst erklären', was: 'Auf den Folien schreibst du zu jeder Nummer im Code, was dort passiert. Danach kommt die Lösung.', warum: 'Wer sich Beispiele selbst erklärt, versteht sie meist tiefer, als wenn er nur die Erklärung liest.', q: [['Bisra u. a. 2018, Educational Psychology Review (Meta-Analyse)', '10.1007/s10648-018-9434-x']] },
  { t: 'Lösung mit Lücken', was: 'Hängst du in einer Übung, zeigt die Hilfe erst eine Lösung mit Lücken, dann die ganze.', warum: 'Fertige Lösungsteile zu ergänzen entlastet am Anfang und führt zum selbst Lösen.', q: [['van Merriënboer 1990, Journal of Educational Computing Research (Programmier-Unterricht)', '10.2190/4NK5-17L7-TWQV-1EHL'], ['Renkl & Atkinson 2003, Educational Psychologist', '10.1207/S15326985EP3801_3']] },
  { t: 'Sofortige Rückmeldung', was: 'Nach jeder Antwort und jedem Test siehst du gleich, ob es stimmt. Das Warum kommt mit der richtigen Antwort.', warum: 'Rückmeldung wirkt meist umso besser, je mehr sie erklärt. Ein bloßes Richtig oder Falsch bringt weniger.', q: [['Wisniewski, Zierer & Hattie 2020, Frontiers in Psychology (Meta-Analyse)', '10.3389/fpsyg.2019.03087'], ['Butler & Roediger 2008, Memory & Cognition', '10.3758/MC.36.3.604']] },
  { t: 'Wenig Ablenkung', was: 'Ein Schritt pro Bildschirm. In Kapiteln und Übungen gibt es Bewegung nur als Rückmeldung.', warum: 'Schmuck, der nichts mit dem Stoff zu tun hat, lenkt ab und kostet meist Lernerfolg.', q: [['Rey 2012, Educational Research Review (Meta-Analyse)', '10.1016/j.edurev.2012.05.003'], ['Sundararajan & Adesope 2020, Educational Psychology Review (Meta-Analyse)', '10.1007/s10648-020-09522-4']] }
];
function renderWissen(main) {
  main.innerHTML = leKopf('Wie diese App beim Lernen hilft') + `<div class="le-wissen"><p class="le-lede">Faustregel: Leicht fühlt sich gut an, täuscht aber oft. Ein bisschen Mühe beim Erinnern hilft. <a href="${LE_DOI}10.1146/annurev-psych-113011-143823" target="_blank" rel="noopener">Bjork, Dunlosky &amp; Kornell 2013</a></p>
    ${WISSEN.map(w => `<details class="le-ws" name="le-ws"><summary><b>${esc(w.t)}</b><span>${esc(w.was)}</span></summary><div class="le-ws-m"><p>${esc(w.warum)}</p>${w.q.length ? '<ul class="le-ws-q" aria-label="Quellen">' + w.q.map(q => `<li><a href="${LE_DOI}${q[1]}" target="_blank" rel="noopener">${esc(q[0])}</a></li>`).join('') + '</ul>' : ''}</div></details>`).join('')}</div>`;
}
