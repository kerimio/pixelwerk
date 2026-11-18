/* ================= EIGENE KAPITEL: Toni schreibt ein Kapitel zum Wunschthema =================
   Im Chat „Kapitel zu …“ eingeben (oder den Knopf „Neues Kapitel“ nutzen). Die KI liefert JSON im Format der
   festen Kapitel (Ticket, Szene, Folien mit Code und Zeilen-Erklärungen, Quiz, Merksätze). Das Kapitel wird geprüft,
   in S.eigene gespeichert (also auch in fortschritt.json / JSON-Export) und bei jedem Laden wieder in CH eingehängt. */
const EIGEN_AKT = { n: 'E', title: 'Eigene Kapitel', sub: 'Von Toni zu deinen Wunschthemen geschrieben', label: 'Wunschthema' };
const EIGEN_WER = ['erz', 'toni', 'sara', 'leon', 'jonas', 'mia', 'ricky', 'boss', 'du'];

/* Text, der als HTML eingesetzt wird (Szene, Quiz): alles escapen, nur <code> und <b> erlauben. */
const eigenHtml = s => esc(String(s == null ? '' : s)).replace(/&lt;(\/?)(code|b)&gt;/g, '<$1$2>').replace(/`([^`]+)`/g, '<code>$1</code>');
/* Text, den die App selbst escaped: Tags entfernen, damit kein „<code>“ als Text erscheint. */
const eigenText = s => String(s == null ? '' : s).replace(/<\/?(code|b)>/g, '').trim();

function eigeneRegistrieren() {
  S.eigene = S.eigene || {};
  for (let i = CH.length - 1; i >= 0; i--) if (CH[i].eigen) CH.splice(i, 1);
  const liste = Object.values(S.eigene).sort((a, b) => (a.erstellt || 0) - (b.erstellt || 0));
  const ai = AKTE.findIndex(a => a.n === EIGEN_AKT.n);
  if (!liste.length) { if (ai >= 0) AKTE.splice(ai, 1); return; }
  if (ai < 0) AKTE.push(EIGEN_AKT);
  liste.forEach(k => CH.push(Object.assign({ akt: EIGEN_AKT.n, eigen: true, xp: 40 }, k)));
}

/* Erkennt Kapitelwünsche im Chat: „Kapitel zu X“, „Erstell mir ein Kapitel über X“, „neues Kapitel: X“ */
function kapitelWunsch(q) {
  const m = /^(?:bitte\s+)?(?:(?:erstell|schreib|mach|bau|generier)\w*\s+(?:mir\s+)?(?:bitte\s+)?)?(?:ein\s+)?(?:neues\s+|eigenes\s+)?kapitel\s*(?:zu(?:m|r)?|über|für|:|-)\s*(.+)$/i.exec(String(q).trim());
  return m ? m[1].replace(/[?.!]+$/, '').trim() : null;
}

function kapitelPrompt(thema) {
  const vorhanden = CH.map(c => c.title + ' (' + c.tag + ')').join('; ');
  return `Schreib ein neues Lernkapitel zum Wunschthema: „${thema}“.

Die Lern-App „Pixelwerk“ bringt Angular und RxJS an echten Tickets bei. Story: Der Lernende ist Frontend-Dev und neu bei der Kölner Digitalagentur Pixelwerk (ca. 40 Leute). Es gibt das interne Teamboard (Projekte, Tickets, Zeiten) und Kundenprojekte (Konzerthaus am Rhein, Online-Shop Nordlicht Mode).
Figuren (Schlüssel für "story"): erz (Erzähler, ohne Name), toni (Senior-Dev, Mentor), sara (Projektmanagerin), leon (Account Manager), jonas (Backend-Dev), mia (QA), ricky (Freelancer, schreibt gern schnellen, schlampigen Code), boss (Katrin Kaiser, Geschäftsführerin), du (der Lernende).
Diese Kapitel gibt es schon (nicht wiederholen, darauf aufbauen): ${vorhanden}

Regeln:
- Deutsch, du-Form, kurze Sätze, keine Gedankenstriche, keine Sport-Vergleiche.
- Fachlich korrekt für aktuelles Angular (Standalone-Komponenten, Signals, neuer Control Flow @if/@for, inject()).
- Ist das Thema kein Angular-/Web-Thema, mach trotzdem das Beste daraus, mit Bezug zum Frontend-Alltag.
- 3 bis 5 Folien. Wo es passt mit Code (max. 14 Zeilen, TypeScript oder HTML). Zu jedem Code 3 bis 6 "notes": [exakter Ausschnitt aus genau einer Codezeile, Erklärung in einfachen Worten].
- Genau 3 Quizfragen mit je 4 Antworten, eine richtig. Jede Frage ist ein ganzer Satz und für sich allein verständlich: Nenn in der Frage, worum es geht (Code, Begriff oder Situation), statt es vorauszusetzen. Auch die Begründung steht in ganzen Sätzen.
- 3 bis 4 Merksätze.
- Im Text darfst du <code>…</code> für Code-Wörter nutzen, sonst kein HTML.

Antworte NUR mit JSON in genau dieser Form, ohne Erklärung davor oder danach:
{
  "title": "kurzer Kapiteltitel aus der Story, max. 5 Wörter",
  "tag": "Fachbegriffe · getrennt · mit Mittelpunkt",
  "ticket": { "typ": "Feature|Bug|Tech-Debt|Incident|Review|Frage|Security", "titel": "Tickettitel", "text": "2 Sätze, worum es im Ticket geht" },
  "story": [["erz", "Szene, 1-2 Sätze"], ["sara", "…"], ["du", "…"], ["toni", "…"]],
  "slides": [
    { "t": "Folientitel", "say": "Kernaussage in 1-2 Sätzen", "job": "Wo dir das in der Agentur begegnet, 1-2 Sätze", "code": "optional", "notes": [["Ausschnitt", "Erklärung"]], "pro": "Profi-Wissen, 1-2 Sätze" }
  ],
  "quiz": [ { "q": "Frage als ganzer, für sich verständlicher Satz", "options": ["A", "B", "C", "D"], "correct": 0, "why": "Begründung in 1 bis 2 ganzen Sätzen" } ],
  "merke": ["Merksatz"]
}`;
}

async function eigenKiText(prompt, onText) {
  const system = 'Du bist Coach Toni, Senior-Angular-Entwickler bei der Agentur Pixelwerk, und schreibst Lernkapitel als sauberes JSON.';
  if (aiCfg().key) return geminiStream(prompt, onText || (() => {}), system, { temperature: 0.7, maxOutputTokens: 16384, responseMimeType: 'application/json' });
  const e = new Error('keine KI'); e.code = 'unavailable'; throw e;
}

function jsonAusText(t) {
  let s = String(t || '').replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('Kein JSON in der Antwort');
  return JSON.parse(s.slice(a, b + 1));
}

/* Macht aus der KI-Antwort ein Kapitel, das die App sicher anzeigen kann. Wirft, wenn zu wenig Brauchbares drin ist. */
function kapitelNormalisieren(o, thema) {
  if (!o || typeof o !== 'object') throw new Error('Antwort ist kein Objekt');
  const str = v => typeof v === 'string' ? v.trim() : '';
  const slides = (Array.isArray(o.slides) ? o.slides : []).filter(s => s && str(s.t) && str(s.say)).slice(0, 6).map(s => {
    const sl = { t: eigenText(s.t), say: eigenText(s.say) };
    if (str(s.job)) sl.job = eigenText(s.job);
    if (str(s.pro)) sl.pro = eigenText(s.pro);
    const code = str(s.code).replace(/^```\w*\n?|```$/g, '').replace(/\s+$/, '');
    if (code && code.split('\n').length <= 30) {
      sl.code = code;
      sl.notes = (Array.isArray(s.notes) ? s.notes : []).filter(n => Array.isArray(n) && str(n[0]) && str(n[1]) && code.includes(n[0])).slice(0, 8).map(n => [n[0], eigenText(n[1])]);
    }
    return sl;
  });
  const quiz = (Array.isArray(o.quiz) ? o.quiz : []).filter(q => q && str(q.q) && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(+q.correct) && +q.correct >= 0 && +q.correct < Math.min(4, q.options.length)).slice(0, 4).map(q => {
    const opts = q.options.slice(0, 4).map(x => eigenHtml(x));
    const order = opts.map((_, j) => j).sort(() => Math.random() - 0.5);
    return { q: eigenHtml(q.q), options: order.map(j => opts[j]), correct: order.indexOf(+q.correct), why: eigenHtml(q.why || '') };
  });
  if (slides.length < 2) throw new Error('Zu wenige Folien');
  if (quiz.length < 2) throw new Error('Zu wenige Quizfragen');
  const t = o.ticket || {};
  const nr = 300 + Object.keys(S.eigene || {}).length + 1;
  const story = (Array.isArray(o.story) ? o.story : []).filter(z => Array.isArray(z) && str(z[1])).slice(0, 6).map(z => [EIGEN_WER.includes(z[0]) ? z[0] : 'toni', eigenHtml(z[1])]);
  return {
    id: 'e' + Date.now().toString(36), thema: thema, erstellt: Date.now(),
    title: eigenText(o.title) || thema, tag: eigenText(o.tag) || thema,
    ticket: { id: 'PW-' + nr, typ: TICKET_ICON[t.typ] ? t.typ : 'Feature', titel: eigenText(t.titel) || thema, text: eigenText(t.text) || 'Arbeite dich in „' + thema + '“ ein.' },
    story: story.length ? story : [['toni', 'Heute schauen wir uns ' + eigenHtml(thema) + ' an. Ich zeig dir, worauf es im Projekt ankommt.']],
    slides, quiz,
    merke: (Array.isArray(o.merke) ? o.merke : []).map(eigenText).filter(Boolean).slice(0, 5)
  };
}

let eigenLaeuft = false;
async function kapitelErstellen(thema) {
  if (!aiCfg().key) { toniOeffnen(); return null; } /* ohne KI erklärt der Chat selbst, was fehlt */
  const log = $('#chatLog'); const leer = log.querySelector('.chat-empty'); if (leer) leer.remove();
  log.insertAdjacentHTML('beforeend', '<div class="msg me">📘 Neues Kapitel: ' + esc(thema) + '</div>');
  const out = document.createElement('div'); out.className = 'msg toni'; log.appendChild(out); log.scrollTop = 1e9;
  if (eigenLaeuft) { out.innerHTML = '<p>Moment, ich schreibe noch am letzten Kapitel.</p>'; return null; }
  eigenLaeuft = true;
  const status = t => { out.innerHTML = '<p class="tc-denkt">' + t + '</p>'; };
  status('Ich schreibe dir ein Kapitel zu „' + esc(thema) + '“. Das dauert etwa eine halbe Minute…');
  let kap = null, fehler = null;
  for (let versuch = 0; versuch < 2 && !kap; versuch++) {
    try {
      let n = 0;
      const text = await eigenKiText(kapitelPrompt(thema) + (fehler ? '\n\nDein letzter Versuch war unbrauchbar (' + fehler + '). Halte dich genau an das JSON-Format.' : ''), t => { n = t.length; status('Ich schreibe dir ein Kapitel zu „' + esc(thema) + '“… (' + Math.round(n / 100) / 10 + 'k Zeichen)'); });
      kap = kapitelNormalisieren(jsonAusText(text), thema);
    } catch (e) {
      if (e && (e.code === 'unavailable' || e.code === 'gemini_key' || e.code === 'not_granted' || e.code === 'rate_limited' || e instanceof TypeError)) { out.innerHTML = '<p class="ai-err">' + esc(aiError(e)) + '</p>'; eigenLaeuft = false; return null; }
      fehler = e && e.message || 'Fehler';
    }
  }
  eigenLaeuft = false;
  if (!kap) { out.innerHTML = '<p class="ai-err">Das Kapitel ist mir nicht sauber gelungen (' + esc(fehler) + '). Versuch es nochmal, gern mit einem genaueren Thema.</p>'; return null; }
  S.eigene[kap.id] = kap; eigeneRegistrieren(); save();
  if ($('#main .hub')) renderStart($('#main')); /* auf dem Schreibtisch steht es sofort im Weg */
  out.innerHTML = '<p>Fertig: <b>' + esc(kap.title) + '</b> mit ' + kap.slides.length + ' Folien und ' + kap.quiz.length + ' Quizfragen. Du findest es auf dem Schreibtisch unter „Eigene Kapitel“.</p><p><a class="btn primary" href="#' + kap.id + '">Kapitel öffnen</a></p>';
  out.querySelector('a').onclick = () => { if (window.matchMedia('(max-width: 900px)').matches) tcZu(); };
  log.scrollTop = 1e9;
  return kap;
}

function eigenLoeschen(id) {
  const k = S.eigene && S.eigene[id]; if (!k) return;
  if (!confirm('Kapitel „' + k.title + '“ löschen? Dein Fortschritt darin geht verloren.')) return;
  delete S.eigene[id]; delete S.done[id]; delete S.steps[id];
  Object.keys(S.quiz || {}).forEach(q => { if (q.startsWith(id + ':')) delete S.quiz[q]; });
  Object.keys(S.srs || {}).forEach(q => { if (q.includes(':' + id)) delete S.srs[q]; });
  save(); location.hash = 'start'; route(); toast('Kapitel gelöscht');
}

/* Chat: Knopf „Neues Kapitel“ schaltet das Eingabefeld auf Themenwunsch um. */
(function eigenChat() {
  const go = () => {
    const btn = $('#chatKapitel'), inp = $('#chatIn'), form = $('#chatForm'); if (!btn || !form) return;
    const setMode = on => { form.dataset.mode = on ? 'kapitel' : ''; btn.setAttribute('aria-pressed', on ? 'true' : 'false'); inp.placeholder = on ? 'Thema, z. B. Angular Animations' : 'Nachricht an Toni'; inp.focus(); };
    btn.onclick = () => setMode(form.dataset.mode !== 'kapitel');
    form.addEventListener('submit', ev => {
      const q = inp.value.trim(); if (!q) return;
      const thema = form.dataset.mode === 'kapitel' ? q : kapitelWunsch(q);
      if (!thema) return;
      ev.preventDefault(); ev.stopImmediatePropagation(); inp.value = ''; setMode(false);
      kapitelErstellen(thema);
    }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
eigeneRegistrieren();
