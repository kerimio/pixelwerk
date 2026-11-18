/* ===== Rahmen und Start: Kopfzeile, Routen, Schreibtisch, Export/Import, Start der App ===== */

/* Kopfzeile: der eine Profil-Chip (Avatar, Name, Rang, XP-Balken, Serie). Ein Klick öffnet die Einstellungen (ich.js).
   Der Chip wird einmal gebaut und danach nur aktualisiert, damit der XP-Balken sichtbar wächst. */
function renderHud() {
  const b = document.getElementById('ichBtn'); if (!b) return;
  if (!b.firstChild) b.innerHTML = '<span class="hub-av"></span><span class="lvl"><span class="hub-c1"><b class="ich-n"></b><span class="streak" id="streak" hidden></span></span><span class="hub-c2"><span id="lvlName"></span><span id="xpNum"></span></span><span class="xpbar"><i id="xpBar" style="width:0"></i></span></span>';
  const R = rank(S.xp), n = ichName(), st = streak(), tage = st + (st === 1 ? ' Tag' : ' Tage') + ' am Stück';
  const av = avatarHtml('ich-av'), halter = b.querySelector('.hub-av');
  if (halter.dataset.av !== av) { halter.dataset.av = av; halter.innerHTML = av; }
  b.querySelector('.ich-n').textContent = n || 'Dein Profil';
  /* Ein Punkt am Avatar: In der Garderobe liegt etwas Neues */
  halter.classList.toggle('hub-av-neu', !!(S.schrankNeu || []).length);
  $('#lvlName').textContent = R.name;
  $('#xpNum').textContent = S.xp + ' XP';
  $('#xpBar').style.width = (R.next ? Math.round((S.xp - R.from) / (R.to - R.from) * 100) : 100) + '%';
  const se = $('#streak'); se.textContent = '🔥 ' + st; se.title = tage; se.hidden = !st;
  const bis = R.next ? 'noch ' + (R.to - S.xp) + ' XP bis ' + R.next : 'höchster Rang';
  b.title = 'Einstellungen · ' + bis;
  b.setAttribute('aria-label', 'Einstellungen öffnen. ' + [n, R.name, S.xp + ' XP', bis].concat(st ? [tage] : []).filter(Boolean).join(', '));
}

/* ---------- Ansichten ---------- */
let currentExercise = null;
function route() {
  if (typeof eigeneRegistrieren === 'function') eigeneRegistrieren();
  /* Spielstand von früher oder aus fortschritt.json: schon verdiente Sachen für den Avatar still einsortieren */
  if (typeof schrankPruefen === 'function') schrankPruefen(true);
  if (typeof lookAnwenden === 'function') lookAnwenden();
  let id = location.hash.slice(1) || 'start';
  if (currentExercise) { currentExercise.dispose(); currentExercise = null; }
  ivStop();
  const main = $('#main'); main.className = 'main';
  /* Erster Start: Der Spiel-Einstieg (einstieg.js) übernimmt die ganze Seite, bis er erlebt oder übersprungen ist. */
  const einstieg = einstiegNoetig(); document.body.classList.toggle('es-an', einstieg);
  if (einstieg) { renderEinstieg(main); return; }
  /* Alte Adresse „Alle Kapitel“: Die Liste steht jetzt auf dem Schreibtisch. */
  if (id === 'plan') { id = 'start'; try { history.replaceState(null, '', '#start'); } catch (e) {} }
  const ch = CH.find(c => c.id === id);
  /* Ein Thema üben (#ueben-k07) oder neue Fragen von Toni dazu (#tonifragen-k07), siehe staerken.js */
  const thema = id.match(/^(ueben|tonifragen)-(.+)$/), thCh = thema && CH.find(c => c.id === thema[2]);
  /* #blitz ist eine alte Adresse: Das Blitz-Training ist in „Wiederholen“ aufgegangen. #wdh-frei startet gleich die freie Runde. */
  if (thCh) { if (leOffen) leOffen(); if (thema[1] === 'ueben') renderUeben(main, thCh); else renderToniFragen(main, thCh); }
  else if (ARENA_IDS.test(id)) renderArena(main, id); else if (id === 'wdh' || id === 'blitz' || id === 'wdh-frei') renderWdh(main, id === 'wdh-frei'); else if (id === 'wissen') renderWissen(main); else if (ch) renderChapter(main, ch); else renderStart(main);
  renderHud(); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

/* ---------- Der Schreibtisch: das eine Zuhause ---------- */
/* Phasen, die der Lernende auf dem Weg selbst auf- oder zugeklappt hat (Kennung → offen?). Sonst ist nur die aktuelle Phase offen.
   Gilt bis zum Neuladen, damit „Zurück“ nichts verstellt. */
const hubAuf = new Map();
const hubGruss = () => { const n = ichName(); return 'Hallo' + (n ? ' ' + n : ''); };
function renderStart(main) {
  srsSeed();
  const due = srsDue().length, karten = srsStats().total;
  /* Optionale Grundlagen (basis.js, kapitelOptional) zählen hier nicht mit */
  const alle = allePflichtGeschafft(), pflicht = CH.filter(c => !kapitelOptional(c)).length, nachholen = alle && CH.some(c => kapitelOptional(c) && !S.done[c.id]);
  const ch = currentChapter(), a = AKTE.find(x => x.n === ch.akt) || {};
  const started = kapitelBegonnen(ch);
  /* Kein eigener Satz zur Lage: Was ansteht, sagen die Karte und der Knopf darunter. Nur wer alles geschafft hat, liest es hier. */
  const lage = alle ? 'Du hast alle Kapitel geschafft.' + (nachholen ? ' Die Grundlagen kannst du jederzeit nachholen.' : '') : '';

  let naechstes;
  if (alle) naechstes = `<section class="hub-next" aria-labelledby="hubNextT"><p class="hub-l">Geschafft</p><h2 id="hubNextT">Alle ${pflicht} Kapitel erledigt</h2><p class="hub-meta">In der Werkstatt bleibst du in Übung: Bugs, Reviews, Interview.</p><a class="btn primary big" id="hubGo" href="#training">Zur Werkstatt</a></section>`;
  else {
    const steps = buildSteps(ch), at = Math.min(S.steps[ch.id] || 0, steps.length - 1);
    const meta = [phaseNr(a) || a.title || '', kapitelPos(ch)].concat(started ? ['Schritt ' + (at + 1) + ' von ' + steps.length] : []).filter(Boolean);
    /* Was dieses Kapitel einbringt: XP und, wenn es eine Phase oder eine Marke abschließt, eine Sache für den Avatar */
    const sachen = sachenFuerKapitel(ch);
    const lohn = (ch.xp ? `<span class="hub-lohn"><span class="nur-sr">Dafür gibt es </span>+${ch.xp} XP</span>` : '') +
      sachen.map(x => `<span class="hub-lohn hub-lohn-sache" title="Neu für deinen Avatar: ${esc(x.n)}">${sacheSvg(x, 20)}<span><span class="nur-sr">und für deinen Avatar: </span>${esc(x.n)}</span></span>`).join('');
    naechstes = `<section class="hub-next" aria-labelledby="hubNextT"${ch.ticket ? ' data-typ="' + esc(ch.ticket.typ) + '"' : ''}><p class="hub-l">${ch.ticket ? 'Dein nächstes Ticket' : 'Dein nächstes Kapitel'}</p>${ticketHtml(ch, true)}<h2 id="hubNextT">${esc(ch.title)}</h2><p class="hub-meta">${esc(meta.join(' · '))}</p>${hubSpur(steps, started ? at : -1)}<div class="hub-los"><a class="btn primary big" id="hubGo" href="#${esc(ch.id)}">${started ? 'Weitermachen' : 'Anfangen'}</a>${lohn}</div></section>`;
  }

  const wdh = due ? `<a class="btn" id="hubWdh" href="#wdh">Wiederholen · ${due === 1 ? '1 Karte' : due + ' Karten'}</a>`
    : karten ? 'Nichts zu wiederholen. <a href="#wdh-frei">Freie Runde</a>' + hubToniLink() : 'Wiederholen startet nach deinem ersten Kapitel.';

  const weg = AKTE.map(p => {
    const chs = CH.filter(c => c.akt === p.n); if (!chs.length) return '';
    const won = chs.filter(c => S.done[c.id]).length, fertig = won === chs.length, akt = !alle && p.n === ch.akt, nr = phaseNr(p), opt = chs.every(kapitelOptional);
    /* Die Phase als Pixel-Leiste (ein Block je Kapitel) und das Abzeichen, das am Ende der Phase wartet */
    const leiste = `<span class="hub-pbar" aria-hidden="true">${chs.map(c => `<i${S.done[c.id] ? ' class="v"' : !alle && c === ch ? ' class="a"' : ''}></i>`).join('')}</span>`;
    const abz = BADGES.find(b => b.phase === p.n), hatAbz = abz && (S.badges || []).includes(abz.id);
    const sachP = SACHEN.filter(x => x.phase === p.n), hatS = sachP.length && sachP.every(sacheFrei);
    const sachHtml = sachP.length ? `<span class="hub-psache${hatS ? ' got' : ''}" role="img" aria-label="Für deinen Avatar: ${esc(sachP.map(x => x.n).join(', '))}, ${hatS ? 'gewonnen' : 'noch offen'}" title="Für deinen Avatar: ${esc(sachP.map(x => x.n).join(', '))}">${sachP.map(x => sacheSvg(x, 22, !hatS)).join('')}</span>` : '';
    const preis = sachHtml + (abz ? `<span class="hub-pabz${hatAbz ? ' got' : ''}" role="img" aria-label="Abzeichen „${esc(abz.name)}“, ${hatAbz ? 'bekommen' : 'noch offen'}" title="Abzeichen: ${esc(abz.name)}">${abz.icon}</span>` : '');
    return `<li class="hub-p${fertig ? ' fertig' : akt ? ' akt' : ''}"><details data-p="${esc(p.n)}"${akt ? ' data-akt' : ''}${(hubAuf.has(String(p.n)) ? hubAuf.get(String(p.n)) : akt) ? ' open' : ''}>
      <summary><span class="hub-pn" aria-hidden="true">${p.grundlagen ? 'G' : nr ? nr.replace(/\D+/g, '') : '✨'}</span><span class="hub-pt"><b>${nr && !p.grundlagen ? '<span class="nur-sr">' + nr + ': </span>' : ''}${esc(p.title)}${opt ? '<span class="hub-opt">optional</span>' : ''}</b><small>${esc(p.sub)}</small>${leiste}</span>${preis}<span class="hub-ps">${won}/${chs.length}<span class="nur-sr">${fertig ? ', fertig' : akt ? ', hier bist du' : ''}</span></span></summary>
      <ol class="hub-ks">${chs.map(c => {
        const d = S.done[c.id], hier = !alle && c === ch, off = kapitelOffen(c);
        return `<li><a class="hub-k${d ? ' done' : ''}${off ? ' offen' : ''}${hier ? ' akt' : ''}" href="#${esc(c.id)}"${hier ? ' aria-current="step"' : ''}${off ? ' title="Nur angeschaut: ' + (c.ex ? 'Übung' : 'Quiz') + ' noch offen"' : ''}><span class="hub-kn" aria-hidden="true">${d ? '✓' : off ? '◐' : ''}</span><span class="hub-kt">${esc(c.title)}${d ? '<span class="nur-sr">, erledigt</span>' : off ? '<span class="nur-sr">, nur angeschaut, ' + (c.ex ? 'Übung' : 'Quiz') + ' noch offen</span>' : ''}</span><small>${esc(c.tag || '')}</small></a></li>`;
      }).join('')}</ol></details></li>`;
  }).join('');

  const hat = (S.badges || []).filter(id => BADGES.some(b => b.id === id)).length;
  main.innerHTML = `<div class="hub">
    <header class="hub-hallo"><button type="button" class="hub-foto" id="hubFoto" aria-label="Avatar anziehen: Garderobe öffnen" title="Garderobe">${avatarHtml()}${(S.schrankNeu || []).length ? '<span class="hub-foto-neu" aria-hidden="true">Neu</span>' : ''}</button><div class="hub-wer"><h1>${esc(hubGruss())}</h1>${lage ? '<p>' + lage + '</p>' : ''}</div></header>
    ${naechstes}
    <p class="hub-wdh">${wdh}</p>
    ${hubBaustellenHtml()}
    <section class="hub-weg" aria-labelledby="hubWegT"><h2 id="hubWegT">Dein Weg</h2><ol>${weg}</ol></section>
    ${alle ? '' : '<a class="hub-werk" href="#training"><span aria-hidden="true">🛠️</span><span><b>Werkstatt</b><small>Nebenaufgaben: Bugs jagen, Ausgaben vorhersagen, Code reviewen, Interview üben.</small></span><span aria-hidden="true">→</span></a>'}
    <details class="hub-abz"><summary>Abzeichen · ${hat} von ${BADGES.length}</summary>
      <div class="bd-grid">${BADGES.map(b => { const has = (S.badges || []).includes(b.id); return `<div class="bd ${has ? 'got' : ''}"><span class="bd-i" aria-hidden="true">${has ? b.icon : '🔒'}</span><b>${esc(b.name)}</b><small>${esc(b.how)}</small></div>`; }).join('')}</div></details>
  </div>`;
  $('#hubFoto', main).onclick = garderobeOeffnen;
  hubBaustellenAn(main);
  main.querySelectorAll('.hub-weg details').forEach(d => d.addEventListener('toggle', () => { if (d.open === ('akt' in d.dataset)) hubAuf.delete(d.dataset.p); else hubAuf.set(d.dataset.p, d.open); }));
}

/* Mit KI und nichts fällig: neue Fragen von Toni zum wackeligsten Thema, sonst zum zuletzt geschafften Kapitel */
function hubToniLink() {
  if (!aiCfg().key) return '';
  const zuletzt = CH.filter(c => S.done[c.id]).sort((a, b) => (+S.done[b.id] || 0) - (+S.done[a.id] || 0))[0];
  const c = (baustellen(1)[0] || {}).ch || zuletzt;
  return c ? ` · <a href="#tonifragen-${esc(c.id)}" title="Toni schreibt dir drei neue Fragen zu „${esc(c.title)}“">Neue Fragen von Toni</a>` : '';
}

/* Wo du im nächsten Kapitel stehst: die fünf Abschnitte (Ticket, Verstehen, Quiz, Umsetzen, Abschluss) als Pixel-Blöcke,
   ein Block je Schritt. at = der aktuelle Schritt, -1 = noch nicht angefangen. Rein zum Anschauen, die Zahl steht in .hub-meta. */
function hubSpur(steps, at) {
  const ab = [];
  steps.forEach((s, j) => { const l = ab[ab.length - 1]; if (l && l.t === s.t) l.n++; else ab.push({ t: s.t, von: j, n: 1 }); });
  return `<ol class="hub-spur" aria-hidden="true">${ab.map(x => `<li style="--n:${x.n}"${at >= x.von && at < x.von + x.n ? ' class="an"' : ''}><span>${Array.from({ length: x.n }, (_, k) => `<i${x.von + k < at ? ' class="v"' : x.von + k === at ? ' class="a"' : ''}></i>`).join('')}</span>${STEP_LABEL[x.t]}</li>`).join('')}</ol>`;
}

/* ---------- Spielstand als Datei ---------- */
/* Rückmeldung im Reiter „Spielstand“, solange die Einstellungen offen sind (die kurze Meldung unten läge hinter dem Dialog). */
function hubSpielMelden(text) {
  const d = document.getElementById('ichDlg'), el = document.getElementById('hubSpielMsg');
  if (d && d.open && el) el.textContent = text; else toast(text);
}
async function exportProgress() {
  const data = JSON.stringify(Object.assign({ app: 'pixelwerk-angular', version: 1, exportiert: new Date().toISOString() }, S), null, 2);
  const filename = 'pixelwerk-spielstand.json';
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  hubSpielMelden('Gespeichert als ' + filename + '.');
}
function importProgress(file) {
  const r = new FileReader();
  r.onload = () => {
    let v;
    try {
      v = JSON.parse(r.result);
      if (!v || typeof v.xp !== 'number' || !v.done || typeof v.done !== 'object') throw new Error('kein Spielstand');
    } catch (e) { hubSpielMelden('Das ist keine Spielstand-Datei von Pixelwerk.'); return; }
    if ((S.xp || Object.keys(S.done).length) && !confirm('Dein jetziger Spielstand wird ersetzt. Trotzdem laden?')) return;
    ['app', 'version', 'exportiert'].forEach(k => delete v[k]);
    S = withDefaults(v); schrankPruefen(true); save();
    const d = document.getElementById('ichDlg'); if (d && d.open) d.close();
    route(); toast('Spielstand geladen · ' + S.xp + ' XP');
  };
  r.onerror = () => hubSpielMelden('Die Datei lässt sich nicht lesen.');
  r.readAsText(file);
}

/* Ganz von vorn: Fortschritt, Profil, Avatar und Garderobe weg, danach startet der Einstieg wie beim ersten Mal.
   Hell/Dunkel und der KI-Schlüssel bleiben, sie gehören zum Gerät. Erst fragt der Reiter nach (kein confirm(), das ist im Artefakt gesperrt). */
function neuAnfangenFragen() {
  const host = $('#hubNeu');
  host.innerHTML = '<p class="hub-neu-frage"><b>Wirklich ganz von vorn?</b> Dein Fortschritt, dein Profil und dein Avatar mit allen gewonnenen Sachen sind dann weg. Speicher ihn vorher als Datei, wenn du ihn behalten willst.</p>' +
    '<div class="dlg-row"><button class="btn hub-neu-ja" id="neuJa" type="button">Ja, alles löschen und neu starten</button><button class="linkbtn" id="neuNein" type="button">Abbrechen</button></div>';
  $('#neuNein', host).onclick = () => { host.innerHTML = '<button class="linkbtn" id="neuBtn" type="button">Ganz von vorn anfangen</button>'; $('#neuBtn', host).onclick = neuAnfangenFragen; $('#neuBtn', host).focus(); };
  $('#neuJa', host).onclick = neuAnfangen;
  $('#neuNein', host).focus();
}
function neuAnfangen() {
  S = withDefaults(); S.updated = Date.now();
  try {
    localStorage.setItem('ngfc.v1', JSON.stringify(S));
    ['pw-look-css', 'pw-motion', 'ngfc.fuerdich'].forEach(k => localStorage.removeItem(k));
    sessionStorage.removeItem(ES_KEY);
  } catch (e) {}
  /* Mit npm start: fortschritt.json bekommt den leeren Stand (die alte Fassung bleibt als fortschritt.json.bak) */
  if (typeof dateiPlanen === 'function') dateiPlanen();
  const d = document.getElementById('ichDlg'); if (d && d.open) d.close();
  if (typeof esLauf !== 'undefined') esLauf = null;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  route();
}

document.addEventListener('DOMContentLoaded', () => {
  $('#neuBtn').onclick = neuAnfangenFragen;
  $('#exportBtn').onclick = exportProgress;
  $('#importBtn').onclick = () => $('#importFile').click();
  $('#importFile').onchange = e => { const f = e.target.files[0]; if (f) importProgress(f); e.target.value = ''; };
  /* Tastatur: 1 bis 4 wählen eine Antwort, Pfeil rechts/links blättern */
  document.addEventListener('keydown', e => {
    const t = e.target; if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (t && (t.closest('input, textarea, select, .CodeMirror, [contenteditable]') || document.querySelector('dialog[open]'))) return;
    if (/^[1-4]$/.test(e.key)) { const pri = [...document.querySelectorAll('#main .cf, #main .gr')]; if (pri.length) { const x = pri[+e.key - 1]; if (x) { x.click(); e.preventDefault(); } return; } const x = [...document.querySelectorAll('#main .opt')][+e.key - 1]; if (x && !x.disabled) { x.click(); e.preventDefault(); } return; }
    /* In einer laufenden Szene ist „Weiter“ ausgeblendet (kapitel.js), Pfeil rechts geht dort trotzdem weiter */
    if (e.key === 'ArrowRight') { const n = $('#wdhWeiter') || $('#outNext') || $('#nextStep'); if (n && !n.disabled && (!n.hidden || (n.id === 'nextStep' && kpSzene && kpSzene.el.isConnected))) { n.click(); e.preventDefault(); } }
    if (e.key === 'ArrowLeft') { const p = $('#prevStep'); if (p && !p.disabled) { p.click(); e.preventDefault(); } }
  });
  setupChat(); setupAiSettings(); setupProfil(); route(); loadTS().catch(() => {});
});
