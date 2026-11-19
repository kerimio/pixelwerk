/* ================= EIGENE CHAPTER: Toni schreibt ein Kapitel zum Wunschthema =================
   Im Chat „Kapitel zu …“ eingeben (oder den Knopf „Neues Kapitel“ nutzen). Die KI liefert JSON im Format der
   festen Kapitel (Ticket, Szene, Folien mit Code und Zeilen-Erklärungen, Quiz, Merksätze). Das Kapitel wird geprüft,
   in S.customChapters gespeichert (also auch in progress.json / JSON-Export) und bei jedem Laden wieder in CH eingehängt. */
const CUSTOM_ACT = { n: 'E', title: 'Eigene Kapitel', sub: 'Von Toni zu deinen Wunschthemen geschrieben', label: 'Wunschthema' };
const CUSTOM_WHO = ['erz', 'toni', 'sara', 'leon', 'jonas', 'mia', 'ricky', 'boss', 'du'];

/* Text, der als HTML eingesetzt wird (Szene, Quiz): alles escapen, nur <code> und <b> erlauben. */
const customHtml = s => esc(String(s == null ? '' : s)).replace(/&lt;(\/?)(code|b)&gt;/g, '<$1$2>').replace(/`([^`]+)`/g, '<code>$1</code>');
/* Text, den die App selbst escaped: Tags entfernen, damit kein „<code>“ als Text erscheint. */
const customText = s => String(s == null ? '' : s).replace(/<\/?(code|b)>/g, '').trim();

function customRegister() {
  S.customChapters = S.customChapters || {};
  for (let i = CH.length - 1; i >= 0; i--) if (CH[i].custom) CH.splice(i, 1);
  const listing = Object.values(S.customChapters).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const ai = ACTS.findIndex(a => a.n === CUSTOM_ACT.n);
  if (!listing.length) { if (ai >= 0) ACTS.splice(ai, 1); return; }
  if (ai < 0) ACTS.push(CUSTOM_ACT);
  listing.forEach(k => CH.push(Object.assign({ act: CUSTOM_ACT.n, custom: true, xp: 40 }, k)));
}

/* Erkennt Kapitelwünsche im Chat: „Kapitel zu X“, „Erstell mir ein Kapitel über X“, „neues Kapitel: X“ */
function chapterWish(q) {
  const m = /^(?:bitte\s+)?(?:(?:erstell|schreib|mach|bau|generier)\w*\s+(?:mir\s+)?(?:bitte\s+)?)?(?:ein\s+)?(?:neues\s+|eigenes\s+)?kapitel\s*(?:zu(?:m|r)?|über|für|:|-)\s*(.+)$/i.exec(String(q).trim());
  return m ? m[1].replace(/[?.!]+$/, '').trim() : null;
}

function chapterPrompt(topic) {
  const existing = CH.map(c => c.title + ' (' + c.tag + ')').join('; ');
  return `Schreib ein neues Lernkapitel zum Wunschthema: „${topic}“.

Die Lern-App „Pixelwerk“ bringt Angular und RxJS an echten Tickets bei. Story: Der Lernende ist Frontend-Dev und neu bei der Kölner Digitalagentur Pixelwerk (ca. 40 Leute). Es gibt das interne Teamboard (Projekte, Tickets, Zeiten) und Kundenprojekte (Konzerthaus am Rhein, Online-Shop Nordlicht Mode).
Figuren (Schlüssel für "story"): erz (Erzähler, ohne Name), toni (Senior-Dev, Mentor), sara (Projektmanagerin), leon (Account Manager), jonas (Backend-Dev), mia (QA), ricky (Freelancer, schreibt gern schnellen, schlampigen Code), boss (Katrin Kaiser, Geschäftsführerin), du (der Lernende).
Diese Kapitel gibt es schon (nicht wiederholen, darauf aufbauen): ${existing}

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
  "ticket": { "category": "Feature|Bug|Tech-Debt|Incident|Review|Frage|Security", "heading": "Tickettitel", "text": "2 Sätze, worum es im Ticket geht" },
  "story": [["erz", "Szene, 1-2 Sätze"], ["sara", "…"], ["du", "…"], ["toni", "…"]],
  "slides": [
    { "t": "Folientitel", "say": "Kernaussage in 1-2 Sätzen", "job": "Wo dir das in der Agentur begegnet, 1-2 Sätze", "code": "optional", "notes": [["Ausschnitt", "Erklärung"]], "pro": "Profi-Wissen, 1-2 Sätze" }
  ],
  "quiz": [ { "q": "Frage als ganzer, für sich verständlicher Satz", "options": ["A", "B", "C", "D"], "correct": 0, "why": "Begründung in 1 bis 2 ganzen Sätzen" } ],
  "takeaway": ["Merksatz"]
}`;
}

async function customAiText(prompt, onText) {
  const system = 'Du bist Coach Toni, Senior-Angular-Entwickler bei der Agentur Pixelwerk, und schreibst Lernkapitel als sauberes JSON.';
  if (aiCfg().key) return geminiStream(prompt, onText || (() => {}), system, { temperature: 0.7, maxOutputTokens: 16384, responseMimeType: 'application/json' });
  const e = new Error('keine KI'); e.code = 'unavailable'; throw e;
}

function jsonFromText(t) {
  let s = String(t || '').replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('Kein JSON in der Antwort');
  return JSON.parse(s.slice(a, b + 1));
}

/* Macht aus der KI-Antwort ein Kapitel, das die App sicher anzeigen kann. Wirft, wenn zu wenig Brauchbares drin ist. */
function chapterNormalize(o, topic) {
  if (!o || typeof o !== 'object') throw new Error('Antwort ist kein Objekt');
  const str = v => typeof v === 'string' ? v.trim() : '';
  const slides = (Array.isArray(o.slides) ? o.slides : []).filter(s => s && str(s.t) && str(s.say)).slice(0, 6).map(s => {
    const sl = { t: customText(s.t), say: customText(s.say) };
    if (str(s.job)) sl.job = customText(s.job);
    if (str(s.pro)) sl.pro = customText(s.pro);
    const code = str(s.code).replace(/^```\w*\n?|```$/g, '').replace(/\s+$/, '');
    if (code && code.split('\n').length <= 30) {
      sl.code = code;
      sl.notes = (Array.isArray(s.notes) ? s.notes : []).filter(n => Array.isArray(n) && str(n[0]) && str(n[1]) && code.includes(n[0])).slice(0, 8).map(n => [n[0], customText(n[1])]);
    }
    return sl;
  });
  const quiz = (Array.isArray(o.quiz) ? o.quiz : []).filter(q => q && str(q.q) && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(+q.correct) && +q.correct >= 0 && +q.correct < Math.min(4, q.options.length)).slice(0, 4).map(q => {
    const opts = q.options.slice(0, 4).map(x => customHtml(x));
    const order = opts.map((_, j) => j).sort(() => Math.random() - 0.5);
    return { q: customHtml(q.q), options: order.map(j => opts[j]), correct: order.indexOf(+q.correct), why: customHtml(q.why || '') };
  });
  if (slides.length < 2) throw new Error('Zu wenige Folien');
  if (quiz.length < 2) throw new Error('Zu wenige Quizfragen');
  const t = o.ticket || {};
  const nr = 300 + Object.keys(S.customChapters || {}).length + 1;
  const story = (Array.isArray(o.story) ? o.story : []).filter(z => Array.isArray(z) && str(z[1])).slice(0, 6).map(z => [CUSTOM_WHO.includes(z[0]) ? z[0] : 'toni', customHtml(z[1])]);
  return {
    id: 'e' + Date.now().toString(36), topic: topic, createdAt: Date.now(),
    title: customText(o.title) || topic, tag: customText(o.tag) || topic,
    ticket: { id: 'PW-' + nr, category: TICKET_ICON[t.category] ? t.category : 'Feature', heading: customText(t.heading) || topic, text: customText(t.text) || 'Arbeite dich in „' + topic + '“ ein.' },
    story: story.length ? story : [['toni', 'Heute schauen wir uns ' + customHtml(topic) + ' an. Ich zeig dir, worauf es im Projekt ankommt.']],
    slides, quiz,
    takeaway: (Array.isArray(o.takeaway) ? o.takeaway : []).map(customText).filter(Boolean).slice(0, 5)
  };
}

let customRunning = false;
async function chapterCreate(topic) {
  if (!aiCfg().key) { toniOpen(); return null; } /* ohne KI erklärt der Chat selbst, was fehlt */
  const log = $('#chatLog'); const empty = log.querySelector('.chat-empty'); if (empty) empty.remove();
  log.insertAdjacentHTML('beforeend', '<div class="msg me">📘 Neues Kapitel: ' + esc(topic) + '</div>');
  const out = document.createElement('div'); out.className = 'msg toni'; log.appendChild(out); log.scrollTop = 1e9;
  if (customRunning) { out.innerHTML = '<p>Moment, ich schreibe noch am letzten Kapitel.</p>'; return null; }
  customRunning = true;
  const status = t => { out.innerHTML = '<p class="tc-thinks">' + t + '</p>'; };
  status('Ich schreibe dir ein Kapitel zu „' + esc(topic) + '“. Das dauert etwa eine halbe Minute…');
  let chap = null, problems = null;
  for (let attempt = 0; attempt < 2 && !chap; attempt++) {
    try {
      let n = 0;
      const text = await customAiText(chapterPrompt(topic) + (problems ? '\n\nDein letzter Versuch war unbrauchbar (' + problems + '). Halte dich genau an das JSON-Format.' : ''), t => { n = t.length; status('Ich schreibe dir ein Kapitel zu „' + esc(topic) + '“… (' + Math.round(n / 100) / 10 + 'k Zeichen)'); });
      chap = chapterNormalize(jsonFromText(text), topic);
    } catch (e) {
      if (e && (e.code === 'unavailable' || e.code === 'gemini_key' || e.code === 'not_granted' || e.code === 'rate_limited' || e instanceof TypeError)) { out.innerHTML = '<p class="ai-err">' + esc(aiError(e)) + '</p>'; customRunning = false; return null; }
      problems = e && e.message || 'Fehler';
    }
  }
  customRunning = false;
  if (!chap) { out.innerHTML = '<p class="ai-err">Das Kapitel ist mir nicht sauber gelungen (' + esc(problems) + '). Versuch es nochmal, gern mit einem genaueren Thema.</p>'; return null; }
  S.customChapters[chap.id] = chap; customRegister(); save();
  if ($('#main .hub')) renderStart($('#main')); /* auf dem Schreibtisch steht es sofort im Weg */
  out.innerHTML = '<p>Fertig: <b>' + esc(chap.title) + '</b> mit ' + chap.slides.length + ' Folien und ' + chap.quiz.length + ' Quizfragen. Du findest es auf dem Schreibtisch unter „Eigene Kapitel“.</p><p><a class="btn primary" href="#' + chap.id + '">Kapitel öffnen</a></p>';
  out.querySelector('a').onclick = () => { if (window.matchMedia('(max-width: 900px)').matches) tcClose(); };
  log.scrollTop = 1e9;
  return chap;
}

function customDelete(id) {
  const k = S.customChapters && S.customChapters[id]; if (!k) return;
  if (!confirm('Kapitel „' + k.title + '“ löschen? Dein Fortschritt darin geht verloren.')) return;
  delete S.customChapters[id]; delete S.done[id]; delete S.steps[id];
  Object.keys(S.quiz || {}).forEach(q => { if (q.startsWith(id + ':')) delete S.quiz[q]; });
  Object.keys(S.srs || {}).forEach(q => { if (q.includes(':' + id)) delete S.srs[q]; });
  save(); location.hash = 'start'; route(); toast('Kapitel gelöscht');
}

/* Chat: Knopf „Neues Kapitel“ schaltet das Eingabefeld auf Themenwunsch um. */
(function customChat() {
  const go = () => {
    const btn = $('#chatChapter'), inp = $('#chatIn'), form = $('#chatForm'); if (!btn || !form) return;
    const setMode = on => { form.dataset.mode = on ? 'kapitel' : ''; btn.setAttribute('aria-pressed', on ? 'true' : 'false'); inp.placeholder = on ? 'Thema, z. B. Angular Animations' : 'Nachricht an Toni'; inp.focus(); };
    btn.onclick = () => setMode(form.dataset.mode !== 'kapitel');
    form.addEventListener('submit', ev => {
      const q = inp.value.trim(); if (!q) return;
      const topic = form.dataset.mode === 'kapitel' ? q : chapterWish(q);
      if (!topic) return;
      ev.preventDefault(); ev.stopImmediatePropagation(); inp.value = ''; setMode(false);
      chapterCreate(topic);
    }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
customRegister();
