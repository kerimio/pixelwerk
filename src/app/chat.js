/* ===== Der eine Toni: Chat unten rechts =====
   Toni erreicht man nur hier. Der Chat weiß, wo der Lernende gerade ist (Folie, Übung, Kapitel), schickt das bei jeder
   Frage mit und bietet dazu passende Schnellfragen an. Ohne KI-Schlüssel erklärt er, was fehlt, statt einen Fehler zu zeigen. */
/* Die Folie, die gerade offen ist ({ ch, s }), sonst null. Setzt kapitel.js. */
var aktFolie = null;
const tcVerlauf = [];
let tcLaeuft = false, tcOrtAlt = null, tcVon = null, tcWarten = 0;

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
function tcOrt() {
  const hash = location.hash.slice(1), u = currentExercise;
  if (u && u.kontext) { const st = u.stand(); return { art: 'uebung', chips: st === 'offen' ? 'uebung' : st, key: 'u:' + u.ex.id + ':' + st, ch: u.ch, thema: u.ex.title, sieht: st === 'review' ? 'sieht deinen Code und die Review' : 'sieht deinen Code und die Tests' }; }
  const f = aktFolie;
  if (f && f.ch && f.s && f.ch.id === hash) return { art: 'folie', key: 'f:' + hash + ':' + f.ch.slides.indexOf(f.s), ch: f.ch, s: f.s, thema: f.s.t, sieht: 'sieht die Folie „' + f.s.t + '“' };
  const ch = CH.find(c => c.id === hash);
  if (ch) return { art: 'kapitel', key: 'k:' + hash, ch, thema: ch.title, sieht: 'Kapitel „' + ch.title + '“' };
  return { art: '', key: '', sieht: 'Senior-Dev · dein Mentor' };
}
/* Was Toni über den Ort wissen muss. In der Übung liefert uebung.js Aufgabe, Code und Tests samt der Regel „keine fertige Lösung“. */
function tcKontext(o) {
  if (o.art === 'uebung') return currentExercise.kontext();
  if (o.art === 'folie') return 'Der Lernende ist im Kapitel „' + o.ch.title + '“ auf der Folie „' + o.s.t + '“. Auf der Folie steht: ' + stripHtml(o.s.say || '') + (o.s.job ? ' Im Job: ' + stripHtml(o.s.job) : '') + slideCtx(o.s) + '\nBezieh dich auf diese Folie.';
  if (o.art === 'kapitel') return 'Der Lernende ist im Kapitel „' + o.ch.title + '“ (' + o.ch.tag + ').';
  return '';
}
const tcOffen = () => document.body.classList.contains('chat-open');

/* Oberfläche auf Stand bringen: Schlüssel da? Wo ist der Lernende? Welche Schnellfragen passen? */
function tcStand() {
  const da = !!aiCfg().key, o = tcOrt(), chips = $('#tcChips'), leer = $('#tcLeer');
  $('#tcOhne').hidden = da; $('#chatForm').hidden = !da; if (leer) leer.hidden = !da;
  $('#tcSieht').textContent = da ? o.sieht : 'braucht einen KI-Schlüssel';
  $('.chat').classList.toggle('tc-aus', !da);
  const liste = da ? TC_CHIPS[o.chips || o.art] || [] : [];
  if (tcOrtAlt !== o.key + da) {
    tcOrtAlt = o.key + da;
    chips.innerHTML = liste.map((c, i) => '<button type="button" class="chip-btn" data-i="' + i + '">' + esc(c[0]) + '</button>').join('');
    chips.querySelectorAll('button').forEach(b => b.onclick = () => { const c = liste[+b.dataset.i]; tcFragen(c[1], { zeige: c[0], sig: c[2] }); });
  }
  chips.hidden = !liste.length;
  chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-disabled', String(tcLaeuft))); /* nicht disabled: Der Fokus soll auf dem Knopf bleiben */
  $('#chatForm .send-btn').disabled = tcLaeuft;
  /* Ohne Schlüssel und offen: nachsehen, bis er da ist. Nicht jeder Weg zum Schlüssel schließt einen Dialog oder meldet sich. */
  clearTimeout(tcWarten); if (!da && tcOffen()) tcWarten = setTimeout(tcStand, 700);
}

/* Öffnet den Chat. Mit frage wird sie gleich gestellt (nur wenn Toni eine KI hat, sonst erklärt der Chat, was fehlt). */
function toniOeffnen(frage) {
  const von = document.activeElement;
  if (!tcOffen() && von && von !== document.body && !$('.chat').contains(von)) tcVon = von; /* dorthin geht der Fokus beim Schließen zurück */
  document.body.classList.add('chat-open');
  tcStand();
  const da = !!aiCfg().key, tippen = !matchMedia('(pointer: coarse)').matches; /* am Handy nicht gleich die Tastatur aufklappen */
  (da ? (tippen ? $('#chatIn') : $('.chat')) : $('#tcEinrichten')).focus({ preventScroll: true });
  if (!frage || !da) return;
  if (tcLaeuft) $('#chatIn').value = String(frage); /* Toni antwortet noch: Frage nicht verlieren, sie wartet im Eingabefeld */
  else tcFragen(String(frage), {});
}
function tcZu() {
  if (!tcOffen()) return;
  const drin = $('.chat').contains(document.activeElement), von = tcVon && tcVon.isConnected && tcVon.offsetParent ? tcVon : $('#toniFab');
  document.body.classList.remove('chat-open'); tcVon = null;
  if (drin) von.focus({ preventScroll: true });
}

/* Eine Frage an Toni. o.zeige: Text der Sprechblase (bei Schnellfragen der Knopftext). o.sig: Signal fürs Lernprofil.
   Ohne o ist es eine selbst getippte Frage: Die merkt sich das Lernprofil im Wortlaut. */
async function tcFragen(frage, o) {
  if (tcLaeuft || !frage) return false;
  if (!aiCfg().key) { tcStand(); return false; }
  const ort = tcOrt(), log = $('#chatLog'), leer = $('#tcLeer');
  if (o) { if (o.sig) lerneSignal(o.sig); } else lerneFrage(frage, ort.art === 'folie' || ort.art === 'uebung' ? ort.art : 'chat', ort.ch && ort.ch.id, ort.thema);
  if (leer) leer.remove();
  tcLaeuft = true; tcStand();
  tcVerlauf.push({ role: 'user', content: frage });
  log.insertAdjacentHTML('beforeend', '<div class="msg me">' + esc(o && o.zeige || frage) + '</div>');
  const out = document.createElement('div'); out.className = 'msg toni'; log.appendChild(out); log.scrollTop = log.scrollHeight;
  /* Verlauf: die letzten Nachrichten. Den Ort (Folie, Code von jetzt, Tests) bekommt nur die neue Frage mit, so ist er immer aktuell und nie doppelt. */
  let teil = tcVerlauf.slice(-10); if (teil[0].role !== 'user') teil = teil.slice(1);
  const ctx = tcKontext(ort);
  const input = teil.map((m, k) => {
    if (m.role !== 'user') return m;
    let c = 'Frage: ' + m.content;
    if (k === teil.length - 1) c = (ctx ? ctx + '\n' : '') + 'Antwort max. 120 Wörter, außer er will mehr.\n\n' + c;
    return { role: 'user', content: k === 0 ? TONI + '\n' + c : c };
  });
  const unten = () => log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  const text = await toniStream(input, out, { onText: () => { if (unten()) log.scrollTop = log.scrollHeight; } });
  if (text) tcVerlauf.push({ role: 'assistant', content: text }); else tcVerlauf.pop();
  tcLaeuft = false; tcStand();
  log.scrollTop = log.scrollHeight;
  return !!text;
}

function setupChat() {
  try { localStorage.removeItem('ngfc.fuerdich'); } catch (e) {} /* Zwischenspeicher der früheren „Für dich erklärt“-Kästen */
  $('#toniFab').onclick = () => toniOeffnen();
  $('#chatClose').onclick = tcZu;
  $('#tcEinrichten').onclick = () => openAiSettings();
  $('.chat').addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); tcZu(); } });
  $('#chatForm').onsubmit = ev => {
    ev.preventDefault();
    const q = $('#chatIn').value.trim(); if (!q || tcLaeuft) return;
    $('#chatIn').value = ''; tcFragen(q);
  };
  /* Der Ort ändert sich beim Blättern im Kapitel ohne neue Adresse, der Schlüssel im Einstellungs-Dialog: deshalb hier mithören. */
  let wartet = false;
  const frisch = () => { if (wartet || !tcOffen()) return; wartet = true; requestAnimationFrame(() => { wartet = false; tcStand(); }); };
  new MutationObserver(frisch).observe($('#main'), { childList: true, subtree: true });
  addEventListener('hashchange', frisch); addEventListener('storage', frisch);
  document.addEventListener('close', frisch, true);
  /* Auch wer den Chat ohne toniOeffnen() aufklappt (Klasse chat-open am body), bekommt den richtigen Stand */
  new MutationObserver(() => { $('#toniFab').setAttribute('aria-expanded', String(tcOffen())); frisch(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  tcStand();
}
