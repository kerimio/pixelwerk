/* ===== KI: Coach Toni (Anbieter, Schlüssel, Streaming, Markdown) ===== */
const TONI = 'Du bist Coach Toni: Senior-Angular-Entwickler und Mentor in der Lern-App „Pixelwerk“. Story: Der Lernende hat gerade als Frontend-Entwickler bei der Digitalagentur Pixelwerk (Köln, ca. 40 Leute) angefangen und arbeitet echte Tickets ab (Bugs, Features, Incidents, Code Reviews), erst am internen Teamboard, dann in Kundenprojekten (z. B. die App für das Konzerthaus am Rhein, ein Online-Shop für einen Großkunden). Team: Sara (Projektmanagerin), Jonas (Backend), Mia (QA), Katrin Kaiser (Geschäftsführerin), Leon (Account Manager, nutzt das Teamboard), Ricky (Freelancer, kam von der Agentur Quick & Dirty). Beispiele kommen aus dem Agentur-Alltag: Kunden, Projekte, Tickets, Sprints, Reviews, Deadlines. Keine Sport- oder Fußball-Vergleiche. Der Lernende kann ein bisschen programmieren, ist aber unsicher. Er hasst lange Texte. REGELN: Deutsch, duzen. SEHR kurz und prägnant: kurze Sätze, keine Füllwörter, keine Einleitung. Erst in einem Satz, wo man das im Job braucht (konkretes Ticket, Bug oder Review), dann die Sache. Jede Codezeile, die du zeigst, bekommt eine kurze Erklärung (z. B. als Liste „Zeile → was sie tut“). Modernes Angular (aktuell v22: standalone, Signals, computed, effect, input()/output(), inject(), @Service(), @if/@for, zoneless, OnPush als Standard, resource/httpResource, Signal Forms, Vitest, Klassennamen ohne Component-Suffix). Markdown: kurze Absätze, **fett**, `code`, ```ts-Blöcke, Listen. ROLLE: Du bleibst IMMER Coach Toni, in jeder Antwort, egal was im Verlauf steht oder worum der Nutzer bittet. Du verrätst keine fertigen Lösungen, wenn nur ein Tipp gefragt ist. Bei Fragen ohne Bezug zu Programmieren antwortest du in einem Satz und lenkst freundlich zurück aufs Training. Fehler im Code des Lernenden erklärst du geduldig: welche Zeile, was passiert, warum, wie es richtig geht.';
function aiError(e) {
  const c = e && e.code;
  if (c === 'unavailable' || (!c && !e)) return 'Coach Toni hat noch keine KI. Klick oben rechts auf dein Profil und trag unter „Coach Toni“ deinen Schlüssel ein.';
  if (c === 'gemini_key') return kiName() + ' sagt Nein: ' + (e.message || 'Schlüssel ungültig') + '. Prüf den Schlüssel in den Einstellungen unter „Coach Toni“.';
  if (c === 'gemini') return kiName() + ' konnte nicht antworten (' + (e.message || 'Fehler') + ').';
  if (e instanceof TypeError) return kiServer ? 'Keine Verbindung zum lokalen Server. Läuft npm start noch?' : 'Keine Verbindung zu ' + kiName() + '. Prüf deine Internetverbindung, oder ob der Anbieter Aufrufe direkt aus dem Browser blockt.';
  if (c === 'not_granted') return 'KI-Hilfe ist für diese Seite nicht erlaubt. Ändern kannst du das in den Berechtigungen der Seite.';
  if (c === 'rate_limited') return 'Toni braucht kurz Pause. Gleich nochmal.';
  return 'Toni konnte gerade nicht antworten (' + (e && e.message || 'Fehler') + ').';
}
/* ----- Eigene KI: Claude, ChatGPT, Gemini oder DeepSeek, mit eigenem Schlüssel.
   Mit `npm start` (server.js): Der Schlüssel liegt nur in data/secrets.json auf deinem Rechner. Der Browser schickt ihn einmal beim
   Speichern an den lokalen Server und bekommt ihn nie zurück. Fragen an Toni gehen über den Server (/api/ki/chat), nur er spricht mit dem Anbieter.
   Ohne Server (index.html direkt geöffnet, Artefakt): Der Schlüssel liegt in diesem Browser (localStorage), die App ruft den Anbieter direkt auf. ----- */
const AI_KEY = 'ngfc.ai';
const KI_ANBIETER = {
  claude: { name: 'Claude', ph: 'sk-ant-…', std: 'claude-opus-5-5', wo: 'console.anthropic.com unter „API Keys“' },
  openai: { name: 'ChatGPT', ph: 'sk-…', std: 'gpt-5', wo: 'platform.openai.com unter „API keys“' },
  gemini: { name: 'Gemini', ph: 'AIza…', std: 'gemini-2.5-flash', wo: 'Google AI Studio (aistudio.google.com), am besten auf die „Generative Language API“ beschränkt' },
  deepseek: { name: 'DeepSeek', ph: 'sk-…', std: 'deepseek-chat', wo: 'platform.deepseek.com unter „API keys“' }
};
/* Stand vom lokalen Server: null = kein Server, sonst { anbieter, model, schluessel } (nie der Schlüssel selbst) */
var kiServer = null, kiServerSpeichern = Promise.resolve();
const KI_LOKAL = '(lokal gespeichert)'; /* Platzhalter statt Schlüssel, damit überall c.key wie gewohnt „KI ist da“ heißt */
function aiCfgBrowser() { try { const c = JSON.parse(localStorage.getItem(AI_KEY) || '{}'); if (c.key && !KI_ANBIETER[c.anbieter]) c.anbieter = 'gemini'; return c; } catch (e) { return {}; } }
function aiCfg() {
  if (kiServer) return kiServer.schluessel && KI_ANBIETER[kiServer.anbieter] ? { anbieter: kiServer.anbieter, key: KI_LOKAL, model: kiServer.model || '', lokal: true } : { lokal: true };
  return aiCfgBrowser();
}
/* Speichern. Mit Server: Schlüssel einmal an den Server, danach nie wieder im Browser. Ohne Schlüssel im Aufruf behält der Server
   den gespeicherten (nur Modell ändern). aiSave({}) entfernt ihn. Gibt ein Promise zurück, Fragen an Toni warten darauf. */
function aiSave(c) {
  if (kiServer) {
    const leer = !c || !c.anbieter;
    kiServer = leer ? { server: true, schluessel: false } : { server: true, anbieter: c.anbieter, model: c.model || '', schluessel: !!c.key || (kiServer.anbieter === c.anbieter && kiServer.schluessel) };
    const body = leer ? null : { anbieter: c.anbieter, model: c.model || '' }; if (body && c.key && c.key !== KI_LOKAL) body.key = c.key;
    kiServerSpeichern = fetch('/api/ki', leer ? { method: 'DELETE' } : { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(r => r.ok ? r.json() : fetch('/api/ki', { cache: 'no-store' }).then(x => x.json())).then(j => { if (j && j.server) kiServer = j; }).catch(() => {}).then(() => renderAiState());
    renderAiState(); return kiServerSpeichern;
  }
  try { localStorage.setItem(AI_KEY, JSON.stringify(c)); } catch (e) {} renderAiState(); return Promise.resolve();
}
/* Beim Start: Läuft der lokale Server? Dann gilt sein Stand. Ein alter Schlüssel aus dem Browser wandert einmal zum Server und wird hier gelöscht. */
async function kiServerLaden() {
  if (!/^https?:$/.test(location.protocol) || !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
  try {
    const res = await fetch('/api/ki', { cache: 'no-store' }); if (!res.ok) return;
    const j = await res.json(); if (!j || !j.server) return;
    kiServer = j;
    const alt = aiCfgBrowser();
    if (alt.key && !j.schluessel) await aiSave({ anbieter: alt.anbieter, key: alt.key, model: alt.model });
    if (alt.key && kiServer.schluessel) try { localStorage.removeItem(AI_KEY); } catch (e) {}
  } catch (e) { return; }
  try { renderAiState(); if (document.getElementById('tcChips')) tcStand(); } catch (e) {}
}
/* Wo der Schlüssel liegt, als Satz für Einstellungen und Einstieg */
function kiOrt() {
  return kiServer ? 'Dein Schlüssel liegt nur auf deinem Rechner in data/secrets.json. Der Browser bekommt ihn nie zurück, nur der lokale Server spricht mit dem Anbieter.'
    : 'Ohne lokalen Server liegt der Schlüssel in diesem Browser und der Browser schickt ihn selbst an den Anbieter. Sicherer: Pixelwerk mit npm start öffnen, dann liegt er nur in data/secrets.json.';
}
/* Ein Aufruf beim Anbieter, mit Server über /api/ki, sonst direkt. art: 'chat' (body, modell) oder 'modelle' (key, leer = gespeicherter) */
async function kiHolen(anbieter, art, o) {
  if (kiServer) {
    if (art === 'chat') await kiServerSpeichern;
    return fetch('/api/ki/' + art, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(art === 'chat' ? { body: o.body, modell: o.modell } : { anbieter, key: o.key || '' }) });
  }
  const key = o.key || aiCfgBrowser().key;
  if (anbieter === 'claude') {
    const h = { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
    return art === 'chat' ? fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, h), body: JSON.stringify(o.body) })
      : fetch('https://api.anthropic.com/v1/models?limit=100', { headers: h });
  }
  if (anbieter === 'openai' || anbieter === 'deepseek') {
    const basis = anbieter === 'openai' ? 'https://api.openai.com/v1/' : 'https://api.deepseek.com/', h = { Authorization: 'Bearer ' + key };
    return art === 'chat' ? fetch(basis + 'chat/completions', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, h), body: JSON.stringify(o.body) })
      : fetch(basis + 'models', { headers: h });
  }
  return art === 'chat' ? fetch(GEMINI + 'models/' + encodeURIComponent(o.modell) + ':streamGenerateContent?alt=sse', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(o.body) })
    : fetch(GEMINI + 'models?pageSize=200', { headers: { 'x-goog-api-key': key } });
}
function kiName(c) { c = c || aiCfg(); return (KI_ANBIETER[c.anbieter] || KI_ANBIETER.gemini).name; }
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta/';
function kiNachrichten(input) {
  const strip = t => String(t).startsWith(TONI) ? String(t).slice(TONI.length).replace(/^\s+/, '') : String(t);
  const msgs = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
  return msgs.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: strip(m.content) }));
}
function toGemini(input) { return kiNachrichten(input).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })); }
function kiFehler(msg, status) { const err = new Error(msg || 'HTTP ' + status); err.code = status === 429 ? 'rate_limited' : (status === 400 || status === 401 || status === 403) ? 'gemini_key' : 'gemini'; return err; }
async function kiFehlerAus(res) { let m = ''; try { const j = await res.json(); m = (j.error && (j.error.message || j.error)) || j.message || ''; } catch (e) {} return kiFehler(typeof m === 'string' ? m : '', res.status); }
/* Liest einen SSE-Strom zeilenweise und gibt jedes data:-JSON an pick weiter */
async function kiSse(res, pick, onText) {
  const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '', text = '';
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const roh = line.slice(5).trim(); if (!roh || roh === '[DONE]') continue;
      try { const j = JSON.parse(roh); if (j.type === 'error' || (j.error && !j.choices)) throw kiFehler((j.error && j.error.message) || 'Fehler', 0); const t = pick(j); if (t) { text += t; onText(text); } }
      catch (e) { if (e && e.code) throw e; }
    }
  }
  if (!text) { const err = new Error('Leere Antwort'); err.code = 'gemini'; throw err; }
  return text;
}
/* Eine Funktion für alle Anbieter. gen: { maxOutputTokens, temperature, responseMimeType } */
async function kiStream(input, onText, system, gen) {
  const c = aiCfg(), g = Object.assign({ maxOutputTokens: 2048 }, gen || {}), sys = system || TONI;
  const modell = c.model || KI_ANBIETER[c.anbieter].std, json = g.responseMimeType === 'application/json';
  if (c.anbieter === 'claude') {
    const res = await kiHolen('claude', 'chat', { modell, body: { model: modell, max_tokens: Math.max(g.maxOutputTokens, 4096), system: sys + (json ? '\n\nAntworte ausschließlich mit gültigem JSON, ohne Text davor oder danach.' : ''), messages: kiNachrichten(input), stream: true, output_config: { effort: 'low' } } });
    if (!res.ok) throw await kiFehlerAus(res);
    const t = await kiSse(res, j => j.type === 'content_block_delta' && j.delta && j.delta.type === 'text_delta' ? j.delta.text : '', onText);
    return json ? t.replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, '') : t;
  }
  if (c.anbieter === 'openai' || c.anbieter === 'deepseek') {
    const body = { model: modell, stream: true, messages: [{ role: 'system', content: sys }].concat(kiNachrichten(input)) };
    if (c.anbieter === 'openai') body.max_completion_tokens = Math.max(g.maxOutputTokens, 4096); else { body.max_tokens = Math.min(g.maxOutputTokens, 8192); if (g.temperature != null) body.temperature = g.temperature; }
    if (json) body.response_format = { type: 'json_object' };
    const res = await kiHolen(c.anbieter, 'chat', { modell, body });
    if (!res.ok) throw await kiFehlerAus(res);
    return kiSse(res, j => (j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content) || '', onText);
  }
  const res = await kiHolen('gemini', 'chat', { modell, body: { systemInstruction: { parts: [{ text: sys }] }, contents: toGemini(input), generationConfig: Object.assign({ temperature: 0.6 }, g) } });
  if (!res.ok) throw await kiFehlerAus(res);
  return kiSse(res, j => ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).filter(p => p.text && !p.thought).map(p => p.text).join(''), onText);
}
const geminiStream = kiStream; // alter Name, falls noch irgendwo benutzt
/* Modellliste beim Anbieter abfragen, zugleich der Schlüssel-Test. Mit Server und leerem key: der gespeicherte Schlüssel. */
async function kiModelle(anbieter, key) {
  let res, liste = [];
  if (anbieter === 'claude') {
    res = await kiHolen(anbieter, 'modelle', { key });
    if (!res.ok) throw await kiFehlerAus(res);
    liste = ((await res.json()).data || []).map(m => ({ id: m.id, label: m.display_name || m.id }));
  } else if (anbieter === 'openai' || anbieter === 'deepseek') {
    res = await kiHolen(anbieter, 'modelle', { key });
    if (!res.ok) throw await kiFehlerAus(res);
    liste = ((await res.json()).data || []).map(m => ({ id: m.id, label: m.id }));
    if (anbieter === 'openai') liste = liste.filter(m => /^(gpt|o\d|chatgpt)/.test(m.id) && !/audio|realtime|transcribe|tts|image|search|instruct|codex|embedding/.test(m.id));
  } else {
    res = await kiHolen(anbieter, 'modelle', { key });
    if (!res.ok) throw await kiFehlerAus(res);
    liste = ((await res.json()).models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini/.test(m.name) && !/embed|tts|image|live|audio|vision|aqa/.test(m.name))
      .map(m => ({ id: m.name.replace(/^models\//, ''), label: m.displayName || m.name }));
  }
  return liste;
}
function pickDefaultModel(list, anbieter) {
  anbieter = anbieter || 'gemini';
  const std = KI_ANBIETER[anbieter].std; if (list.some(m => m.id === std)) return list.find(m => m.id === std);
  const ver = id => parseFloat((id.match(/(\d+(?:\.\d+)?)/) || [0, 0])[1]) || 0;
  const score = anbieter === 'gemini'
    ? id => ver(id.replace(/^gemini-/, '')) * 10 + (/flash/.test(id) && !/lite/.test(id) ? 3 : /pro/.test(id) ? 2 : 0) - (/preview|exp/.test(id) ? 1 : 0)
    : anbieter === 'claude' ? id => (/opus/.test(id) ? 300 : /sonnet/.test(id) ? 200 : 100) + ver(id.replace(/-/g, '.').replace(/^[a-z.]*?(\d)/, '$1'))
    : anbieter === 'openai' ? id => (/^gpt/.test(id) ? 100 : 0) + ver(id) - (/mini|nano/.test(id) ? 5 : 0) - (/\d{4}-\d\d-\d\d/.test(id) ? 1 : 0)
    : id => (/chat/.test(id) ? 1 : 0);
  return list.slice().sort((a, b) => score(b.id) - score(a.id))[0];
}
/* ----- Einstellungen, Reiter „Coach Toni“ (das Formular steht in dialoge.html, den Dialog öffnet ichOeffnen in ich.js) ----- */
function renderAiState() {
  const c = aiCfg(), el = document.getElementById('aiState'); if (!el) return;
  el.textContent = c.key ? 'Toni nutzt ' + kiName(c) + ' (' + (c.model || KI_ANBIETER[c.anbieter].std) + ').' : 'Noch keine KI eingestellt.';
  const weg = document.getElementById('aiRemove'); if (weg) weg.hidden = !c.key;
  ['aiOrt', 'esKiOrt'].forEach(id => { const o = document.getElementById(id); if (o) o.textContent = kiOrt(); });
}
/* Formular auf einen Anbieter stellen: Beschriftung, gespeicherter Schlüssel und Modell (nur wenn es der gespeicherte Anbieter ist) */
function aiDlgAnbieter(a) {
  const k = KI_ANBIETER[a], c = aiCfg(), meins = c.anbieter === a;
  $('#aiAnb').dataset.a = a;
  $('#aiKeyL').textContent = k.name + '-API-Schlüssel'; $('#aiKey').placeholder = k.ph; $('#aiWo').textContent = k.wo;
  document.querySelectorAll('#aiAnb button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.a === a)));
  $('#aiKey').value = meins && !c.lokal ? c.key || '' : ''; $('#aiMsg').textContent = '';
  if (meins && c.lokal && c.key) $('#aiKey').placeholder = 'Gespeichert auf deinem Rechner. Leer lassen oder neuen einfügen.';
  const m = meins && c.model || k.std; $('#aiModel').innerHTML = '<option value="' + esc(m) + '">' + esc(m) + '</option>';
}
/* Formular mit dem gespeicherten Stand füllen. Ruft ichOeffnen() bei jedem Öffnen der Einstellungen auf. */
function hubKiFuellen() { const c = aiCfg(); aiDlgAnbieter(c.key ? c.anbieter : (c.anbieter || 'claude')); renderAiState(); }
function openAiSettings() { ichOeffnen('toni'); }
function setupAiSettings() {
  const anbieter = () => $('#aiAnb').dataset.a || 'claude';
  document.querySelectorAll('#aiAnb button').forEach(b => b.onclick = () => aiDlgAnbieter(b.dataset.a));
  $('#aiLoad').onclick = async () => {
    const a = anbieter(), key = $('#aiKey').value.trim(), gespeichert = aiCfg().lokal && aiCfg().key && aiCfg().anbieter === a;
    if (!key && !gespeichert) { $('#aiMsg').textContent = 'Erst den Schlüssel einfügen.'; return; }
    $('#aiMsg').textContent = 'Prüfe Schlüssel…';
    try {
      const list = await kiModelle(a, key); if (!list.length) throw new Error('Keine passenden Modelle gefunden');
      const cur = aiCfg().anbieter === a ? aiCfg().model : '', def = pickDefaultModel(list, a);
      $('#aiModel').innerHTML = list.map(m => '<option value="' + esc(m.id) + '">' + esc(m.label === m.id ? m.id : m.label + ' · ' + m.id) + '</option>').join('');
      $('#aiModel').value = list.some(m => m.id === cur) ? cur : def.id;
      $('#aiMsg').textContent = 'Schlüssel funktioniert. ' + list.length + ' Modelle gefunden. Vorschlag: ' + def.id;
    } catch (e) { $('#aiMsg').textContent = e instanceof TypeError ? (kiServer ? 'Keine Verbindung zum lokalen Server. Läuft npm start noch?' : 'Keine Verbindung zu ' + KI_ANBIETER[a].name + '. Der Anbieter blockt evtl. Aufrufe direkt aus dem Browser.') : 'Klappt nicht: ' + e.message; }
  };
  $('#aiSaveBtn').onclick = () => {
    const a = anbieter(), c = aiCfg(), key = $('#aiKey').value.trim() || (c.lokal && c.key && c.anbieter === a ? KI_LOKAL : '');
    if (!key) { $('#aiMsg').textContent = 'Kein Schlüssel eingetragen.'; $('#aiKey').focus(); return; }
    aiSave({ anbieter: a, key, model: $('#aiModel').value || KI_ANBIETER[a].std }); $('#aiKey').value = ''; aiDlgAnbieter(a);
    $('#aiMsg').textContent = 'Gespeichert. ' + KI_ANBIETER[a].name + ' ist jetzt Coach Toni.' + (kiServer ? ' Der Schlüssel liegt nur in data/secrets.json.' : '');
  };
  $('#aiRemove').onclick = () => { const n = kiName(), a = anbieter(); aiSave({}); aiDlgAnbieter(a); $('#aiMsg').textContent = n + '-Schlüssel entfernt. Toni antwortet jetzt nicht mehr im Chat.'; };
  hubKiFuellen();
}
/* Schickt input an die eingestellte KI und schreibt die Antwort laufend in target. Gibt den Text zurück, bei Fehler null.
   opts.view: Text vor der Anzeige umformen. opts.onText: nach jedem Stück aufgerufen (z. B. zum Mitscrollen). */
async function toniStream(input, target, opts) {
  input = mitProfil(input);
  const view = (opts && opts.view) || (x => x), onText = (opts && opts.onText) || (() => {});
  target.hidden = false; target.innerHTML = '<p class="tc-denkt">Toni überlegt…</p>';
  if (!aiCfg().key) { target.innerHTML = '<p>Dafür braucht Toni einen eigenen KI-Schlüssel. <button type="button" class="linkbtn">Coach Toni einrichten</button></p>'; target.querySelector('button').onclick = () => openAiSettings(); return null; }
  target.setAttribute('aria-busy', 'true'); /* Vorlesen erst, wenn die Antwort fertig ist */
  try { const t = await kiStream(input, text => { target.innerHTML = md(view(text)); onText(); }); target.innerHTML = md(view(t)); highlightIn(target); return t; }
  catch (e) { target.innerHTML = '<p class="ai-err">' + esc(aiError(e)) + '</p>'; return null; }
  finally { target.removeAttribute('aria-busy'); }
}
function md(src) {
  const blocks = []; let s = String(src || '');
  s = s.replace(/```(\w*)\n?([\s\S]*?)(```|$)/g, (_, l, code) => { blocks.push(code.replace(/\n$/, '')); return '\u0000' + (blocks.length - 1) + '\u0000'; });
  s = esc(s);
  const inline = t => t.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  const out = []; let list = null;
  s.split('\n').forEach(line => {
    const cb = /^\u0000(\d+)\u0000$/.exec(line.trim());
    if (cb) { if (list) { out.push('</' + list + '>'); list = null; } out.push('<pre class="code"><code>' + esc(blocks[+cb[1]]) + '</code></pre>'); return; }
    let m;
    if ((m = /^\s*[-*]\s+(.*)/.exec(line))) { if (list !== 'ul') { if (list) out.push('</' + list + '>'); out.push('<ul>'); list = 'ul'; } out.push('<li>' + inline(m[1]) + '</li>'); return; }
    if ((m = /^\s*\d+[.)]\s+(.*)/.exec(line))) { if (list !== 'ol') { if (list) out.push('</' + list + '>'); out.push('<ol>'); list = 'ol'; } out.push('<li>' + inline(m[1]) + '</li>'); return; }
    if (list) { out.push('</' + list + '>'); list = null; }
    if ((m = /^#{1,4}\s+(.*)/.exec(line))) { out.push('<h4>' + inline(m[1]) + '</h4>'); return; }
    if (line.trim()) out.push('<p>' + inline(line) + '</p>');
  });
  if (list) out.push('</' + list + '>');
  return out.join('').replace(/\u0000(\d+)\u0000/g, (_, i) => '<pre class="code"><code>' + esc(blocks[+i]) + '</code></pre>');
}
kiServerLaden();
