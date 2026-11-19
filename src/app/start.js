/* ===== Rahmen und Start: Kopfzeile, Routen, Schreibtisch, Export/Import, Start der App ===== */

/* Kopfzeile: der eine Profil-Chip (Avatar, Name, Rang, XP-Balken, Serie). Ein Klick öffnet die Einstellungen (settings.js).
   Der Chip wird einmal gebaut und danach nur aktualisiert, damit der XP-Balken sichtbar wächst. */
function renderHud() {
  const b = document.getElementById('meBtn'); if (!b) return;
  if (!b.firstChild) b.innerHTML = '<span class="hub-av"></span><span class="lvl"><span class="hub-c1"><b class="me-n"></b><span class="streak" id="streak" hidden></span></span><span class="hub-c2"><span id="lvlName"></span><span id="xpNum"></span></span><span class="xpbar"><i id="xpBar" style="width:0"></i></span></span>';
  const R = rank(S.xp), n = meName(), st = streak(), dayCount = st + (st === 1 ? ' Tag' : ' Tage') + ' am Stück';
  const av = avatarHtml('ich-av'), holder = b.querySelector('.hub-av');
  if (holder.dataset.av !== av) { holder.dataset.av = av; holder.innerHTML = av; }
  b.querySelector('.me-n').textContent = n || 'Dein Profil';
  /* Ein Punkt am Avatar: In der Garderobe liegt etwas Neues */
  holder.classList.toggle('hub-av-new', !!(S.wardrobeNew || []).length);
  $('#lvlName').textContent = R.name;
  $('#xpNum').textContent = S.xp + ' XP';
  $('#xpBar').style.width = (R.next ? Math.round((S.xp - R.from) / (R.to - R.from) * 100) : 100) + '%';
  const se = $('#streak'); se.textContent = '🔥 ' + st; se.title = dayCount; se.hidden = !st;
  const until = R.next ? 'noch ' + (R.to - S.xp) + ' XP bis ' + R.next : 'höchster Rang';
  b.title = 'Einstellungen · ' + until;
  b.setAttribute('aria-label', 'Einstellungen öffnen. ' + [n, R.name, S.xp + ' XP', until].concat(st ? [dayCount] : []).filter(Boolean).join(', '));
}

/* ---------- Ansichten ---------- */
let currentExercise = null;
function route() {
  if (typeof customRegister === 'function') customRegister();
  /* Spielstand von früher oder aus progress.json: schon verdiente Sachen für den Avatar still einsortieren */
  if (typeof wardrobeCheck === 'function') wardrobeCheck(true);
  if (typeof lookApply === 'function') lookApply();
  let id = location.hash.slice(1) || 'start';
  if (currentExercise) { currentExercise.dispose(); currentExercise = null; }
  ivStop();
  const main = $('#main'); main.className = 'main';
  /* Erster Start: Der Spiel-Einstieg (intro.js) übernimmt die ganze Seite, bis er erlebt oder übersprungen ist. */
  const intro = introNeeded(); document.body.classList.toggle('intro-on', intro);
  if (intro) { renderIntro(main); return; }
  /* Alte Adresse „Alle Kapitel“: Die Liste steht jetzt auf dem Schreibtisch. */
  if (id === 'plan') { id = 'start'; try { history.replaceState(null, '', '#start'); } catch (e) {} }
  const ch = CH.find(c => c.id === id);
  /* Ein Thema üben (#ueben-k07) oder neue Fragen von Toni dazu (#tonifragen-k07), siehe strengths.js */
  const topic = id.match(/^(ueben|tonifragen)-(.+)$/), thCh = topic && CH.find(c => c.id === topic[2]);
  /* #blitz ist eine alte Adresse: Das Blitz-Training ist in „Wiederholen“ aufgegangen. #wdh-frei startet gleich die freie Runde. */
  if (thCh) { if (lePending) lePending(); if (topic[1] === 'ueben') renderPractice(main, thCh); else renderToniQuestions(main, thCh); }
  else if (ARENA_IDS.test(id)) renderArena(main, id); else if (id === 'wdh' || id === 'blitz' || id === 'wdh-frei') renderRepeat(main, id === 'wdh-frei'); else if (id === 'wissen') renderKnowledge(main); else if (ch) renderChapter(main, ch); else renderStart(main);
  renderHud(); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

/* ---------- Der Schreibtisch: das eine Zuhause ---------- */
/* Phasen, die der Lernende auf dem Weg selbst auf- oder zugeklappt hat (Kennung → offen?). Sonst ist nur die aktuelle Phase offen.
   Gilt bis zum Neuladen, damit „Zurück“ nichts verstellt. */
const hubOpen = new Map();
const hubGreeting = () => { const n = meName(); return 'Hallo' + (n ? ' ' + n : ''); };
function renderStart(main) {
  srsSeed();
  const due = srsDue().length, cards = srsStats().total;
  /* Optionale Grundlagen (base.js, chapterOptional) zählen hier nicht mit */
  const everyone = allRequiredDone(), required = CH.filter(c => !chapterOptional(c)).length, catchUp = everyone && CH.some(c => chapterOptional(c) && !S.done[c.id]);
  const ch = currentChapter(), a = ACTS.find(x => x.n === ch.act) || {};
  const started = chapterStarted(ch);
  /* Kein eigener Satz zur Lage: Was ansteht, sagen die Karte und der Knopf darunter. Nur wer alles geschafft hat, liest es hier. */
  const situation = everyone ? 'Du hast alle Kapitel geschafft.' + (catchUp ? ' Die Grundlagen kannst du jederzeit nachholen.' : '') : '';

  let nextItem;
  if (everyone) nextItem = `<section class="hub-next" aria-labelledby="hubNextT"><p class="hub-l">Geschafft</p><h2 id="hubNextT">Alle ${required} Kapitel erledigt</h2><p class="hub-meta">In der Werkstatt bleibst du in Übung: Bugs, Reviews, Interview.</p><a class="btn primary big" id="hubGo" href="#training">Zur Werkstatt</a></section>`;
  else {
    const steps = buildSteps(ch), at = Math.min(S.steps[ch.id] || 0, steps.length - 1);
    const meta = [phaseNo(a) || a.title || '', chapterPos(ch)].concat(started ? ['Schritt ' + (at + 1) + ' von ' + steps.length] : []).filter(Boolean);
    /* Was dieses Kapitel einbringt: XP und, wenn es eine Phase oder eine Marke abschließt, eine Sache für den Avatar */
    const things = itemsForChapter(ch);
    const payoff = (ch.xp ? `<span class="hub-reward"><span class="sr-only">Dafür gibt es </span>+${ch.xp} XP</span>` : '') +
      things.map(x => `<span class="hub-reward hub-reward-item" title="Neu für deinen Avatar: ${esc(x.n)}">${itemSvg(x, 20)}<span><span class="sr-only">und für deinen Avatar: </span>${esc(x.n)}</span></span>`).join('');
    nextItem = `<section class="hub-next" aria-labelledby="hubNextT"${ch.ticket ? ' data-category="' + esc(ch.ticket.category) + '"' : ''}><p class="hub-l">${ch.ticket ? 'Dein nächstes Ticket' : 'Dein nächstes Kapitel'}</p>${ticketHtml(ch, true)}<h2 id="hubNextT">${esc(ch.title)}</h2><p class="hub-meta">${esc(meta.join(' · '))}</p>${hubTrack(steps, started ? at : -1)}<div class="hub-go"><a class="btn primary big" id="hubGo" href="#${esc(ch.id)}">${started ? 'Weitermachen' : 'Anfangen'}</a>${payoff}</div></section>`;
  }

  const repeat = due ? `<a class="btn" id="hubRepeat" href="#wdh">Wiederholen · ${due === 1 ? '1 Karte' : due + ' Karten'}</a>`
    : cards ? 'Nichts zu wiederholen. <a href="#wdh-frei">Freie Runde</a>' + hubToniLink() : 'Wiederholen startet nach deinem ersten Kapitel.';

  const journey = ACTS.map(p => {
    const chs = CH.filter(c => c.act === p.n); if (!chs.length) return '';
    const won = chs.filter(c => S.done[c.id]).length, finished = won === chs.length, act = !everyone && p.n === ch.act, nr = phaseNo(p), opt = chs.every(chapterOptional);
    /* Die Phase als Pixel-Leiste (ein Block je Kapitel) und das Abzeichen, das am Ende der Phase wartet */
    const bar = `<span class="hub-pbar" aria-hidden="true">${chs.map(c => `<i${S.done[c.id] ? ' class="v"' : !everyone && c === ch ? ' class="a"' : ''}></i>`).join('')}</span>`;
    const badge = BADGES.find(b => b.phase === p.n), hasBadge = badge && (S.badges || []).includes(badge.id);
    const itemP = ITEMS.filter(x => x.phase === p.n), hasS = itemP.length && itemP.every(itemUnlocked);
    const itemHtml = itemP.length ? `<span class="hub-pitem${hasS ? ' got' : ''}" role="img" aria-label="Für deinen Avatar: ${esc(itemP.map(x => x.n).join(', '))}, ${hasS ? 'gewonnen' : 'noch offen'}" title="Für deinen Avatar: ${esc(itemP.map(x => x.n).join(', '))}">${itemP.map(x => itemSvg(x, 22, !hasS)).join('')}</span>` : '';
    const price = itemHtml + (badge ? `<span class="hub-pbadge${hasBadge ? ' got' : ''}" role="img" aria-label="Abzeichen „${esc(badge.name)}“, ${hasBadge ? 'bekommen' : 'noch offen'}" title="Abzeichen: ${esc(badge.name)}">${badge.icon}</span>` : '');
    return `<li class="hub-p${finished ? ' complete' : act ? ' current' : ''}"><details data-p="${esc(p.n)}"${act ? ' data-act' : ''}${(hubOpen.has(String(p.n)) ? hubOpen.get(String(p.n)) : act) ? ' open' : ''}>
      <summary><span class="hub-pn" aria-hidden="true">${p.basics ? 'G' : nr ? nr.replace(/\D+/g, '') : '✨'}</span><span class="hub-pt"><b>${nr && !p.basics ? '<span class="sr-only">' + nr + ': </span>' : ''}${esc(p.title)}${opt ? '<span class="hub-opt">optional</span>' : ''}</b><small>${esc(p.sub)}</small>${bar}</span>${price}<span class="hub-ps">${won}/${chs.length}<span class="sr-only">${finished ? ', fertig' : act ? ', hier bist du' : ''}</span></span></summary>
      <ol class="hub-ks">${chs.map(c => {
        const d = S.done[c.id], here = !everyone && c === ch, off = chapterPending(c);
        return `<li><a class="hub-k${d ? ' done' : ''}${off ? ' pending' : ''}${here ? ' current' : ''}" href="#${esc(c.id)}"${here ? ' aria-current="step"' : ''}${off ? ' title="Nur angeschaut: ' + (c.ex ? 'Übung' : 'Quiz') + ' noch offen"' : ''}><span class="hub-kn" aria-hidden="true">${d ? '✓' : off ? '◐' : ''}</span><span class="hub-kt">${esc(c.title)}${d ? '<span class="sr-only">, erledigt</span>' : off ? '<span class="sr-only">, nur angeschaut, ' + (c.ex ? 'Übung' : 'Quiz') + ' noch offen</span>' : ''}</span><small>${esc(c.tag || '')}</small></a></li>`;
      }).join('')}</ol></details></li>`;
  }).join('');

  const owns = (S.badges || []).filter(id => BADGES.some(b => b.id === id)).length;
  main.innerHTML = `<div class="hub">
    <header class="hub-hello"><button type="button" class="hub-photo" id="hubPhoto" aria-label="Avatar anziehen: Garderobe öffnen" title="Garderobe">${avatarHtml()}${(S.wardrobeNew || []).length ? '<span class="hub-photo-new" aria-hidden="true">Neu</span>' : ''}</button><div class="hub-who"><h1>${esc(hubGreeting())}</h1>${situation ? '<p>' + situation + '</p>' : ''}</div></header>
    ${nextItem}
    <p class="hub-repeat">${repeat}</p>
    ${hubWorkAreasHtml()}
    <section class="hub-path" aria-labelledby="hubPathT"><h2 id="hubPathT">Dein Weg</h2><ol>${journey}</ol></section>
    ${everyone ? '' : '<a class="hub-work" href="#training"><span aria-hidden="true">🛠️</span><span><b>Werkstatt</b><small>Nebenaufgaben: Bugs jagen, Ausgaben vorhersagen, Code reviewen, Interview üben.</small></span><span aria-hidden="true">→</span></a>'}
    <details class="hub-badges"><summary>Abzeichen · ${owns} von ${BADGES.length}</summary>
      <div class="bd-grid">${BADGES.map(b => { const has = (S.badges || []).includes(b.id); return `<div class="bd ${has ? 'got' : ''}"><span class="bd-i" aria-hidden="true">${has ? b.icon : '🔒'}</span><b>${esc(b.name)}</b><small>${esc(b.how)}</small></div>`; }).join('')}</div></details>
  </div>`;
  $('#hubPhoto', main).onclick = wardrobeOpen;
  hubWorkAreasOn(main);
  main.querySelectorAll('.hub-path details').forEach(d => d.addEventListener('toggle', () => { if (d.open === ('act' in d.dataset)) hubOpen.delete(d.dataset.p); else hubOpen.set(d.dataset.p, d.open); }));
}

/* Mit KI und nichts fällig: neue Fragen von Toni zum wackeligsten Thema, sonst zum zuletzt geschafften Kapitel */
function hubToniLink() {
  if (!aiCfg().key) return '';
  const lastTime = CH.filter(c => S.done[c.id]).sort((a, b) => (+S.done[b.id] || 0) - (+S.done[a.id] || 0))[0];
  const c = (workAreas(1)[0] || {}).ch || lastTime;
  return c ? ` · <a href="#tonifragen-${esc(c.id)}" title="Toni schreibt dir drei neue Fragen zu „${esc(c.title)}“">Neue Fragen von Toni</a>` : '';
}

/* Wo du im nächsten Kapitel stehst: die fünf Abschnitte (Ticket, Verstehen, Quiz, Umsetzen, Abschluss) als Pixel-Blöcke,
   ein Block je Schritt. at = der aktuelle Schritt, -1 = noch nicht angefangen. Rein zum Anschauen, die Zahl steht in .hub-meta. */
function hubTrack(steps, at) {
  const ab = [];
  steps.forEach((s, j) => { const l = ab[ab.length - 1]; if (l && l.t === s.t) l.n++; else ab.push({ t: s.t, startIdx: j, n: 1 }); });
  return `<ol class="hub-track" aria-hidden="true">${ab.map(x => `<li style="--n:${x.n}"${at >= x.startIdx && at < x.startIdx + x.n ? ' class="active"' : ''}><span>${Array.from({ length: x.n }, (_, k) => `<i${x.startIdx + k < at ? ' class="v"' : x.startIdx + k === at ? ' class="a"' : ''}></i>`).join('')}</span>${STEP_LABEL[x.t]}</li>`).join('')}</ol>`;
}

/* ---------- Spielstand als Datei ---------- */
/* Rückmeldung im Reiter „Spielstand“, solange die Einstellungen offen sind (die kurze Meldung unten läge hinter dem Dialog). */
function hubGameReport(text) {
  const d = document.getElementById('meDlg'), el = document.getElementById('hubGameMsg');
  if (d && d.open && el) el.textContent = text; else toast(text);
}
async function exportProgress() {
  const data = JSON.stringify(Object.assign({ app: 'pixelwerk-angular', version: 1, exported: new Date().toISOString() }, S), null, 2);
  const filename = 'pixelwerk-spielstand.json';
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  hubGameReport('Gespeichert als ' + filename + '.');
}
function importProgress(file) {
  const r = new FileReader();
  r.onload = () => {
    let v;
    try {
      v = JSON.parse(r.result);
      if (!v || typeof v.xp !== 'number' || !v.done || typeof v.done !== 'object') throw new Error('kein Spielstand');
    } catch (e) { hubGameReport('Das ist keine Spielstand-Datei von Pixelwerk.'); return; }
    if ((S.xp || Object.keys(S.done).length) && !confirm('Dein jetziger Spielstand wird ersetzt. Trotzdem laden?')) return;
    ['app', 'version', 'exported', 'exportiert'].forEach(k => delete v[k]);
    S = withDefaults(v); wardrobeCheck(true); save();
    const d = document.getElementById('meDlg'); if (d && d.open) d.close();
    route(); toast('Spielstand geladen · ' + S.xp + ' XP');
  };
  r.onerror = () => hubGameReport('Die Datei lässt sich nicht lesen.');
  r.readAsText(file);
}

/* Ganz von vorn: Fortschritt, Profil, Avatar und Garderobe weg, danach startet der Einstieg wie beim ersten Mal.
   Hell/Dunkel und der KI-Schlüssel bleiben, sie gehören zum Gerät. Erst fragt der Reiter nach (kein confirm(), das ist im Artefakt gesperrt). */
function restartAsk() {
  const host = $('#hubNew');
  host.innerHTML = '<p class="hub-new-ask"><b>Wirklich ganz von vorn?</b> Dein Fortschritt, dein Profil und dein Avatar mit allen gewonnenen Sachen sind dann weg. Speicher ihn vorher als Datei, wenn du ihn behalten willst.</p>' +
    '<div class="dlg-row"><button class="btn hub-new-yes" id="newYes" type="button">Ja, alles löschen und neu starten</button><button class="linkbtn" id="newNo" type="button">Abbrechen</button></div>';
  $('#newNo', host).onclick = () => { host.innerHTML = '<button class="linkbtn" id="newBtn" type="button">Ganz von vorn anfangen</button>'; $('#newBtn', host).onclick = restartAsk; $('#newBtn', host).focus(); };
  $('#newYes', host).onclick = restart;
  $('#newNo', host).focus();
}
function restart() {
  S = withDefaults(); S.updated = Date.now();
  try {
    localStorage.setItem('ngfc.v1', JSON.stringify(S));
    ['pw-look-css', 'pw-motion', 'ngfc.fuerdich'].forEach(k => localStorage.removeItem(k));
    sessionStorage.removeItem(INTRO_KEY);
  } catch (e) {}
  /* Mit npm start: progress.json bekommt den leeren Stand (die alte Fassung bleibt als progress.json.bak) */
  if (typeof fileSchedule === 'function') fileSchedule();
  const d = document.getElementById('meDlg'); if (d && d.open) d.close();
  if (typeof introRun !== 'undefined') introRun = null;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  route();
}

document.addEventListener('DOMContentLoaded', () => {
  $('#newBtn').onclick = restartAsk;
  $('#exportBtn').onclick = exportProgress;
  $('#importBtn').onclick = () => $('#importFile').click();
  $('#importFile').onchange = e => { const f = e.target.files[0]; if (f) importProgress(f); e.target.value = ''; };
  /* Tastatur: 1 bis 4 wählen eine Antwort, Pfeil rechts/links blättern */
  document.addEventListener('keydown', e => {
    const t = e.target; if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (t && (t.closest('input, textarea, select, .CodeMirror, [contenteditable]') || document.querySelector('dialog[open]'))) return;
    if (/^[1-4]$/.test(e.key)) { const pri = [...document.querySelectorAll('#main .cf, #main .gr')]; if (pri.length) { const x = pri[+e.key - 1]; if (x) { x.click(); e.preventDefault(); } return; } const x = [...document.querySelectorAll('#main .opt')][+e.key - 1]; if (x && !x.disabled) { x.click(); e.preventDefault(); } return; }
    /* In einer laufenden Szene ist „Weiter“ ausgeblendet (chapter.js), Pfeil rechts geht dort trotzdem weiter */
    if (e.key === 'ArrowRight') { const n = $('#repeatNext') || $('#outNext') || $('#nextStep'); if (n && !n.disabled && (!n.hidden || (n.id === 'nextStep' && cpScene && cpScene.el.isConnected))) { n.click(); e.preventDefault(); } }
    if (e.key === 'ArrowLeft') { const p = $('#prevStep'); if (p && !p.disabled) { p.click(); e.preventDefault(); } }
  });
  setupChat(); setupAiSettings(); setupProfile(); route(); loadTS().catch(() => {});
});
