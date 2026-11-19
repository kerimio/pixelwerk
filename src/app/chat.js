/* ===== Der eine Toni: Chat unten rechts =====
   Toni erreicht man nur hier. Der Chat weiß, wo der Lernende gerade ist (Folie, Übung, Kapitel), schickt das bei jeder
   Frage mit und bietet dazu passende Schnellfragen an. Ohne KI-Schlüssel erklärt er, was fehlt, statt einen Fehler zu zeigen. */
/* Die Folie, die gerade offen ist ({ ch, s }), sonst null. Setzt chapter.js. */
var currentSlide = null;
const tcHistory = [];
let tcRunning = false, tcPlaceOld = null, tcFrom = null, tcWait = 0;

/* Schnellfragen je Ort: [Text auf dem Knopf, Frage an Toni, Signal fürs Lernprofil]. Höchstens drei pro Ort. */
const TC_CHIPS = {
  folie: [
    ['Erklär’s anders', 'Erklär mir diese Folie nochmal anders: einfachere Worte, ein anderes Beispiel. Gibt es Code, geh ihn Zeile für Zeile durch, je ein Stichpunkt.', 'nochmal'],
    ['Beispiel aus dem Job', 'Gib mir ein konkretes Beispiel aus dem Agentur-Alltag (Ticket, Bug oder Code Review), bei dem man genau das braucht.'],
    ['Warum macht man das so?', 'Warum macht man das so? Nenn den Grund dahinter und was ohne das schiefgeht.']
  ],
  uebung: [
    ['Gib mir einen Tipp', 'Gib mir einen Tipp: Was ist mein nächster kleiner Schritt?', 'hilfe'],
    ['Was ist an meinem Code falsch?', 'Was ist an meinem Code falsch? Sag mir die Zeile und warum.', 'hilfe']
  ],
  /* Übung gelöst und alles grün: Ein Tipp wäre hier fehl am Platz. */
  geloest: [['Geht das noch besser?', 'Die Tests sind grün. Geht mein Code noch besser? Nenn höchstens zwei konkrete Punkte, je mit Grund.']],
  /* Er hat in der Review „Toni antworten“ gewählt */
  review: [['Erklär mir die Review', 'Erklär mir deine Review: Welcher Punkt ist der wichtigste, und warum?']]
};

/* Wo ist der Lernende gerade? Übung vor Folie vor Kapitel. key ändert sich genau dann, wenn sich der Ort ändert. */
function tcPlace() {
  const hash = location.hash.slice(1), u = currentExercise;
  if (u && u.context) { const st = u.standing(); return { kind: 'uebung', chips: st === 'offen' ? 'uebung' : st, key: 'u:' + u.ex.id + ':' + st, ch: u.ch, topic: u.ex.title, sees: st === 'review' ? 'sieht deinen Code und die Review' : 'sieht deinen Code und die Tests' }; }
  const f = currentSlide;
  if (f && f.ch && f.s && f.ch.id === hash) return { kind: 'folie', key: 'f:' + hash + ':' + f.ch.slides.indexOf(f.s), ch: f.ch, s: f.s, topic: f.s.t, sees: 'sieht die Folie „' + f.s.t + '“' };
  const ch = CH.find(c => c.id === hash);
  if (ch) return { kind: 'kapitel', key: 'k:' + hash, ch, topic: ch.title, sees: 'Kapitel „' + ch.title + '“' };
  return { kind: '', key: '', sees: 'Senior-Dev · dein Mentor' };
}
/* Was Toni über den Ort wissen muss. In der Übung liefert exercise.js Aufgabe, Code und Tests samt der Regel „keine fertige Lösung“. */
function tcContext(o) {
  if (o.kind === 'uebung') return currentExercise.context();
  if (o.kind === 'folie') return 'Der Lernende ist im Kapitel „' + o.ch.title + '“ auf der Folie „' + o.s.t + '“. Auf der Folie steht: ' + stripHtml(o.s.say || '') + (o.s.job ? ' Im Job: ' + stripHtml(o.s.job) : '') + slideCtx(o.s) + '\nBezieh dich auf diese Folie.';
  if (o.kind === 'kapitel') return 'Der Lernende ist im Kapitel „' + o.ch.title + '“ (' + o.ch.tag + ').';
  return '';
}
const tcOpen = () => document.body.classList.contains('chat-open');

/* Oberfläche auf Stand bringen: Schlüssel da? Wo ist der Lernende? Welche Schnellfragen passen? */
function tcState() {
  const present = !!aiCfg().key, o = tcPlace(), chips = $('#tcChips'), empty = $('#tcEmpty');
  $('#tcWithout').hidden = present; $('#chatForm').hidden = !present; if (empty) empty.hidden = !present;
  $('#tcSees').textContent = present ? o.sees : 'braucht einen KI-Schlüssel';
  $('.chat').classList.toggle('tc-off', !present);
  const listing = present ? TC_CHIPS[o.chips || o.kind] || [] : [];
  if (tcPlaceOld !== o.key + present) {
    tcPlaceOld = o.key + present;
    chips.innerHTML = listing.map((c, i) => '<button type="button" class="chip-btn" data-i="' + i + '">' + esc(c[0]) + '</button>').join('');
    chips.querySelectorAll('button').forEach(b => b.onclick = () => { const c = listing[+b.dataset.i]; tcQuestions(c[1], { display: c[0], sig: c[2] }); });
  }
  chips.hidden = !listing.length;
  chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-disabled', String(tcRunning))); /* nicht disabled: Der Fokus soll auf dem Knopf bleiben */
  $('#chatForm .send-btn').disabled = tcRunning;
  /* Ohne Schlüssel und offen: nachsehen, bis er da ist. Nicht jeder Weg zum Schlüssel schließt einen Dialog oder meldet sich. */
  clearTimeout(tcWait); if (!present && tcOpen()) tcWait = setTimeout(tcState, 700);
}

/* Öffnet den Chat. Mit frage wird sie gleich gestellt (nur wenn Toni eine KI hat, sonst erklärt der Chat, was fehlt). */
function toniOpen(question) {
  const startIdx = document.activeElement;
  if (!tcOpen() && startIdx && startIdx !== document.body && !$('.chat').contains(startIdx)) tcFrom = startIdx; /* dorthin geht der Fokus beim Schließen zurück */
  document.body.classList.add('chat-open');
  tcState();
  const present = !!aiCfg().key, typeIn = !matchMedia('(pointer: coarse)').matches; /* am Handy nicht gleich die Tastatur aufklappen */
  (present ? (typeIn ? $('#chatIn') : $('.chat')) : $('#tcSetup')).focus({ preventScroll: true });
  if (!question || !present) return;
  if (tcRunning) $('#chatIn').value = String(question); /* Toni antwortet noch: Frage nicht verlieren, sie wartet im Eingabefeld */
  else tcQuestions(String(question), {});
}
function tcClose() {
  if (!tcOpen()) return;
  const inside = $('.chat').contains(document.activeElement), startIdx = tcFrom && tcFrom.isConnected && tcFrom.offsetParent ? tcFrom : $('#toniFab');
  document.body.classList.remove('chat-open'); tcFrom = null;
  if (inside) startIdx.focus({ preventScroll: true });
}

/* Eine Frage an Toni. o.zeige: Text der Sprechblase (bei Schnellfragen der Knopftext). o.sig: Signal fürs Lernprofil.
   Ohne o ist es eine selbst getippte Frage: Die merkt sich das Lernprofil im Wortlaut. */
async function tcQuestions(question, o) {
  if (tcRunning || !question) return false;
  if (!aiCfg().key) { tcState(); return false; }
  const place = tcPlace(), log = $('#chatLog'), empty = $('#tcEmpty');
  if (o) { if (o.sig) learnSignal(o.sig); } else learnQuestion(question, place.kind === 'folie' || place.kind === 'uebung' ? place.kind : 'chat', place.ch && place.ch.id, place.topic);
  if (empty) empty.remove();
  tcRunning = true; tcState();
  tcHistory.push({ role: 'user', content: question });
  log.insertAdjacentHTML('beforeend', '<div class="msg me">' + esc(o && o.display || question) + '</div>');
  const out = document.createElement('div'); out.className = 'msg toni'; log.appendChild(out); log.scrollTop = log.scrollHeight;
  /* Verlauf: die letzten Nachrichten. Den Ort (Folie, Code von jetzt, Tests) bekommt nur die neue Frage mit, so ist er immer aktuell und nie doppelt. */
  let part = tcHistory.slice(-10); if (part[0].role !== 'user') part = part.slice(1);
  const ctx = tcContext(place);
  const input = part.map((m, k) => {
    if (m.role !== 'user') return m;
    let c = 'Frage: ' + m.content;
    if (k === part.length - 1) c = (ctx ? ctx + '\n' : '') + 'Antwort max. 120 Wörter, außer er will mehr.\n\n' + c;
    return { role: 'user', content: k === 0 ? TONI + '\n' + c : c };
  });
  const below = () => log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  const text = await toniStream(input, out, { onText: () => { if (below()) log.scrollTop = log.scrollHeight; } });
  if (text) tcHistory.push({ role: 'assistant', content: text }); else tcHistory.pop();
  tcRunning = false; tcState();
  log.scrollTop = log.scrollHeight;
  return !!text;
}

function setupChat() {
  try { localStorage.removeItem('ngfc.fuerdich'); } catch (e) {} /* Zwischenspeicher der früheren „Für dich erklärt“-Kästen */
  $('#toniFab').onclick = () => toniOpen();
  $('#chatClose').onclick = tcClose;
  $('#tcSetup').onclick = () => openAiSettings();
  $('.chat').addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); tcClose(); } });
  $('#chatForm').onsubmit = ev => {
    ev.preventDefault();
    const q = $('#chatIn').value.trim(); if (!q || tcRunning) return;
    $('#chatIn').value = ''; tcQuestions(q);
  };
  /* Der Ort ändert sich beim Blättern im Kapitel ohne neue Adresse, der Schlüssel im Einstellungs-Dialog: deshalb hier mithören. */
  let waiting = false;
  const pristine = () => { if (waiting || !tcOpen()) return; waiting = true; requestAnimationFrame(() => { waiting = false; tcState(); }); };
  new MutationObserver(pristine).observe($('#main'), { childList: true, subtree: true });
  addEventListener('hashchange', pristine); addEventListener('storage', pristine);
  document.addEventListener('close', pristine, true);
  /* Auch wer den Chat ohne toniOpen() aufklappt (Klasse chat-open am body), bekommt den richtigen Stand */
  new MutationObserver(() => { $('#toniFab').setAttribute('aria-expanded', String(tcOpen())); pristine(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  tcState();
}
