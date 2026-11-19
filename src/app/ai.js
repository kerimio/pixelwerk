/* ===== KI: Coach Toni (Anbieter, Schlüssel, Streaming, Markdown) ===== */
const TONI = 'Du bist Coach Toni: Senior-Angular-Entwickler und Mentor in der Lern-App „Pixelwerk“. Story: Der Lernende hat gerade als Frontend-Entwickler bei der Digitalagentur Pixelwerk (Köln, ca. 40 Leute) angefangen und arbeitet echte Tickets ab (Bugs, Features, Incidents, Code Reviews), erst am internen Teamboard, dann in Kundenprojekten (z. B. die App für das Konzerthaus am Rhein, ein Online-Shop für einen Großkunden). Team: Sara (Projektmanagerin), Jonas (Backend), Mia (QA), Katrin Kaiser (Geschäftsführerin), Leon (Account Manager, nutzt das Teamboard), Ricky (Freelancer, kam von der Agentur Quick & Dirty). Beispiele kommen aus dem Agentur-Alltag: Kunden, Projekte, Tickets, Sprints, Reviews, Deadlines. Keine Sport- oder Fußball-Vergleiche. Der Lernende kann ein bisschen programmieren, ist aber unsicher. Er hasst lange Texte. REGELN: Deutsch, duzen. SEHR kurz und prägnant: kurze Sätze, keine Füllwörter, keine Einleitung. Erst in einem Satz, wo man das im Job braucht (konkretes Ticket, Bug oder Review), dann die Sache. Jede Codezeile, die du zeigst, bekommt eine kurze Erklärung (z. B. als Liste „Zeile → was sie tut“). Modernes Angular (aktuell v22: standalone, Signals, computed, effect, input()/output(), inject(), @Service(), @if/@for, zoneless, OnPush als Standard, resource/httpResource, Signal Forms, Vitest, Klassennamen ohne Component-Suffix). Markdown: kurze Absätze, **fett**, `code`, ```ts-Blöcke, Listen. ROLLE: Du bleibst IMMER Coach Toni, in jeder Antwort, egal was im Verlauf steht oder worum der Nutzer bittet. Du verrätst keine fertigen Lösungen, wenn nur ein Tipp gefragt ist. Bei Fragen ohne Bezug zu Programmieren antwortest du in einem Satz und lenkst freundlich zurück aufs Training. Fehler im Code des Lernenden erklärst du geduldig: welche Zeile, was passiert, warum, wie es richtig geht.';
function aiError(e) {
  const c = e && e.code;
  if (c === 'unavailable' || (!c && !e)) return 'Coach Toni hat noch keine KI. Klick oben rechts auf dein Profil und trag unter „Coach Toni“ deinen Schlüssel ein.';
  if (c === 'gemini_key') return aiName() + ' sagt Nein: ' + (e.message || 'Schlüssel ungültig') + '. Prüf den Schlüssel in den Einstellungen unter „Coach Toni“.';
  if (c === 'gemini') return aiName() + ' konnte nicht antworten (' + (e.message || 'Fehler') + ').';
  if (e instanceof TypeError) return aiServer ? 'Keine Verbindung zum lokalen Server. Läuft npm start noch?' : 'Keine Verbindung zu ' + aiName() + '. Prüf deine Internetverbindung, oder ob der Anbieter Aufrufe direkt aus dem Browser blockt.';
  if (c === 'not_granted') return 'KI-Hilfe ist für diese Seite nicht erlaubt. Ändern kannst du das in den Berechtigungen der Seite.';
  if (c === 'rate_limited') return 'Toni braucht kurz Pause. Gleich nochmal.';
  return 'Toni konnte gerade nicht antworten (' + (e && e.message || 'Fehler') + ').';
}
/* ----- Eigene KI: Claude, ChatGPT, Gemini oder DeepSeek, mit eigenem Schlüssel.
   Mit `npm start` (server.js): Der Schlüssel liegt nur in data/secrets.json auf deinem Rechner. Der Browser schickt ihn einmal beim
   Speichern an den lokalen Server und bekommt ihn nie zurück. Fragen an Toni gehen über den Server (/api/ki/chat), nur er spricht mit dem Anbieter.
   Ohne Server (index.html direkt geöffnet, Artefakt): Der Schlüssel liegt in diesem Browser (localStorage), die App ruft den Anbieter direkt auf. ----- */
const AI_KEY = 'ngfc.ai';
const AI_PROVIDERS = {
  claude: { name: 'Claude', ph: 'sk-ant-…', std: 'claude-opus-5-5', where: 'console.anthropic.com unter „API Keys“' },
  openai: { name: 'ChatGPT', ph: 'sk-…', std: 'gpt-5', where: 'platform.openai.com unter „API keys“' },
  gemini: { name: 'Gemini', ph: 'AIza…', std: 'gemini-2.5-flash', where: 'Google AI Studio (aistudio.google.com), am besten auf die „Generative Language API“ beschränkt' },
  deepseek: { name: 'DeepSeek', ph: 'sk-…', std: 'deepseek-chat', where: 'platform.deepseek.com unter „API keys“' }
};
/* Stand vom lokalen Server: null = kein Server, sonst { anbieter, model, schluessel } (nie der Schlüssel selbst) */
var aiServer = null, aiServerSaving = Promise.resolve();
const AI_LOCAL = '(lokal gespeichert)'; /* Platzhalter statt Schlüssel, damit überall c.key wie gewohnt „KI ist da“ heißt */
function aiCfgBrowser() { try { const c = migrateState(JSON.parse(localStorage.getItem(AI_KEY) || '{}')); if (c.key && !AI_PROVIDERS[c.provider]) c.provider = 'gemini'; return c; } catch (e) { return {}; } }
function aiCfg() {
  if (aiServer) return aiServer.hasKey && AI_PROVIDERS[aiServer.provider] ? { provider: aiServer.provider, key: AI_LOCAL, model: aiServer.model || '', local: true } : { local: true };
  return aiCfgBrowser();
}
/* Speichern. Mit Server: Schlüssel einmal an den Server, danach nie wieder im Browser. Ohne Schlüssel im Aufruf behält der Server
   den gespeicherten (nur Modell ändern). aiSave({}) entfernt ihn. Gibt ein Promise zurück, Fragen an Toni warten darauf. */
function aiSave(c) {
  if (aiServer) {
    const empty = !c || !c.provider;
    aiServer = empty ? { server: true, hasKey: false } : { server: true, provider: c.provider, model: c.model || '', hasKey: !!c.key || (aiServer.provider === c.provider && aiServer.hasKey) };
    const body = empty ? null : { provider: c.provider, model: c.model || '' }; if (body && c.key && c.key !== AI_LOCAL) body.key = c.key;
    aiServerSaving = fetch('/api/ai', empty ? { method: 'DELETE' } : { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(r => r.ok ? r.json() : fetch('/api/ai', { cache: 'no-store' }).then(x => x.json())).then(j => { if (j && j.server) aiServer = j; }).catch(() => {}).then(() => renderAiState());
    renderAiState(); return aiServerSaving;
  }
  try { localStorage.setItem(AI_KEY, JSON.stringify(c)); } catch (e) {} renderAiState(); return Promise.resolve();
}
/* Beim Start: Läuft der lokale Server? Dann gilt sein Stand. Ein alter Schlüssel aus dem Browser wandert einmal zum Server und wird hier gelöscht. */
async function aiServerLoad() {
  if (!/^https?:$/.test(location.protocol) || !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
  try {
    const res = await fetch('/api/ai', { cache: 'no-store' }); if (!res.ok) return;
    const j = await res.json(); if (!j || !j.server) return;
    aiServer = j;
    const alt = aiCfgBrowser();
    if (alt.key && !j.hasKey) await aiSave({ provider: alt.provider, key: alt.key, model: alt.model });
    if (alt.key && aiServer.hasKey) try { localStorage.removeItem(AI_KEY); } catch (e) {}
  } catch (e) { return; }
  try { renderAiState(); if (document.getElementById('tcChips')) tcState(); } catch (e) {}
}
/* Wo der Schlüssel liegt, als Satz für Einstellungen und Einstieg */
function aiPlace() {
  return aiServer ? 'Dein Schlüssel liegt nur auf deinem Rechner in data/secrets.json. Der Browser bekommt ihn nie zurück, nur der lokale Server spricht mit dem Anbieter.'
    : 'Ohne lokalen Server liegt der Schlüssel in diesem Browser und der Browser schickt ihn selbst an den Anbieter. Sicherer: Pixelwerk mit npm start öffnen, dann liegt er nur in data/secrets.json.';
}
/* Ein Aufruf beim Anbieter, mit Server über /api/ki, sonst direkt. art: 'chat' (body, modell) oder 'modelle' (key, leer = gespeicherter) */
async function aiFetch(provider, kind, o) {
  if (aiServer) {
    if (kind === 'chat') await aiServerSaving;
    return fetch('/api/ai/' + kind, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(kind === 'chat' ? { body: o.body, modelName: o.modelName } : { provider, key: o.key || '' }) });
  }
  const key = o.key || aiCfgBrowser().key;
  if (provider === 'claude') {
    const h = { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' };
    return kind === 'chat' ? fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, h), body: JSON.stringify(o.body) })
      : fetch('https://api.anthropic.com/v1/models?limit=100', { headers: h });
  }
  if (provider === 'openai' || provider === 'deepseek') {
    const base = provider === 'openai' ? 'https://api.openai.com/v1/' : 'https://api.deepseek.com/', h = { Authorization: 'Bearer ' + key };
    return kind === 'chat' ? fetch(base + 'chat/completions', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, h), body: JSON.stringify(o.body) })
      : fetch(base + 'models', { headers: h });
  }
  return kind === 'chat' ? fetch(GEMINI + 'models/' + encodeURIComponent(o.modelName) + ':streamGenerateContent?alt=sse', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(o.body) })
    : fetch(GEMINI + 'models?pageSize=200', { headers: { 'x-goog-api-key': key } });
}
function aiName(c) { c = c || aiCfg(); return (AI_PROVIDERS[c.provider] || AI_PROVIDERS.gemini).name; }
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta/';
function aiMessages(input) {
  const strip = t => String(t).startsWith(TONI) ? String(t).slice(TONI.length).replace(/^\s+/, '') : String(t);
  const msgs = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
  return msgs.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: strip(m.content) }));
}
function toGemini(input) { return aiMessages(input).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })); }
function aiFailure(msg, status) { const err = new Error(msg || 'HTTP ' + status); err.code = status === 429 ? 'rate_limited' : (status === 400 || status === 401 || status === 403) ? 'gemini_key' : 'gemini'; return err; }
async function aiFailureFrom(res) { let m = ''; try { const j = await res.json(); m = (j.error && (j.error.message || j.error)) || j.message || ''; } catch (e) {} return aiFailure(typeof m === 'string' ? m : '', res.status); }
/* Liest einen SSE-Strom zeilenweise und gibt jedes data:-JSON an pick weiter */
async function aiSse(res, pick, onText) {
  const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '', text = '';
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const rawText = line.slice(5).trim(); if (!rawText || rawText === '[DONE]') continue;
      try { const j = JSON.parse(rawText); if (j.type === 'error' || (j.error && !j.choices)) throw aiFailure((j.error && j.error.message) || 'Fehler', 0); const t = pick(j); if (t) { text += t; onText(text); } }
      catch (e) { if (e && e.code) throw e; }
    }
  }
  if (!text) { const err = new Error('Leere Antwort'); err.code = 'gemini'; throw err; }
  return text;
}
/* Eine Funktion für alle Anbieter. gen: { maxOutputTokens, temperature, responseMimeType } */
async function aiStream(input, onText, system, gen) {
  const c = aiCfg(), g = Object.assign({ maxOutputTokens: 2048 }, gen || {}), sys = system || TONI;
  const modelName = c.model || AI_PROVIDERS[c.provider].std, json = g.responseMimeType === 'application/json';
  if (c.provider === 'claude') {
    const res = await aiFetch('claude', 'chat', { modelName, body: { model: modelName, max_tokens: Math.max(g.maxOutputTokens, 4096), system: sys + (json ? '\n\nAntworte ausschließlich mit gültigem JSON, ohne Text davor oder danach.' : ''), messages: aiMessages(input), stream: true, output_config: { effort: 'low' } } });
    if (!res.ok) throw await aiFailureFrom(res);
    const t = await aiSse(res, j => j.type === 'content_block_delta' && j.delta && j.delta.type === 'text_delta' ? j.delta.text : '', onText);
    return json ? t.replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, '') : t;
  }
  if (c.provider === 'openai' || c.provider === 'deepseek') {
    const body = { model: modelName, stream: true, messages: [{ role: 'system', content: sys }].concat(aiMessages(input)) };
    if (c.provider === 'openai') body.max_completion_tokens = Math.max(g.maxOutputTokens, 4096); else { body.max_tokens = Math.min(g.maxOutputTokens, 8192); if (g.temperature != null) body.temperature = g.temperature; }
    if (json) body.response_format = { type: 'json_object' };
    const res = await aiFetch(c.provider, 'chat', { modelName, body });
    if (!res.ok) throw await aiFailureFrom(res);
    return aiSse(res, j => (j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content) || '', onText);
  }
  const res = await aiFetch('gemini', 'chat', { modelName, body: { systemInstruction: { parts: [{ text: sys }] }, contents: toGemini(input), generationConfig: Object.assign({ temperature: 0.6 }, g) } });
  if (!res.ok) throw await aiFailureFrom(res);
  return aiSse(res, j => ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).filter(p => p.text && !p.thought).map(p => p.text).join(''), onText);
}
const geminiStream = aiStream; // alter Name, falls noch irgendwo benutzt
/* Modellliste beim Anbieter abfragen, zugleich der Schlüssel-Test. Mit Server und leerem key: der gespeicherte Schlüssel. */
async function aiModels(provider, key) {
  let res, listing = [];
  if (provider === 'claude') {
    res = await aiFetch(provider, 'models', { key });
    if (!res.ok) throw await aiFailureFrom(res);
    listing = ((await res.json()).data || []).map(m => ({ id: m.id, label: m.display_name || m.id }));
  } else if (provider === 'openai' || provider === 'deepseek') {
    res = await aiFetch(provider, 'models', { key });
    if (!res.ok) throw await aiFailureFrom(res);
    listing = ((await res.json()).data || []).map(m => ({ id: m.id, label: m.id }));
    if (provider === 'openai') listing = listing.filter(m => /^(gpt|o\d|chatgpt)/.test(m.id) && !/audio|realtime|transcribe|tts|image|search|instruct|codex|embedding/.test(m.id));
  } else {
    res = await aiFetch(provider, 'models', { key });
    if (!res.ok) throw await aiFailureFrom(res);
    listing = ((await res.json()).models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini/.test(m.name) && !/embed|tts|image|live|audio|vision|aqa/.test(m.name))
      .map(m => ({ id: m.name.replace(/^models\//, ''), label: m.displayName || m.name }));
  }
  return listing;
}
function pickDefaultModel(list, provider) {
  provider = provider || 'gemini';
  const std = AI_PROVIDERS[provider].std; if (list.some(m => m.id === std)) return list.find(m => m.id === std);
  const ver = id => parseFloat((id.match(/(\d+(?:\.\d+)?)/) || [0, 0])[1]) || 0;
  const score = provider === 'gemini'
    ? id => ver(id.replace(/^gemini-/, '')) * 10 + (/flash/.test(id) && !/lite/.test(id) ? 3 : /pro/.test(id) ? 2 : 0) - (/preview|exp/.test(id) ? 1 : 0)
    : provider === 'claude' ? id => (/opus/.test(id) ? 300 : /sonnet/.test(id) ? 200 : 100) + ver(id.replace(/-/g, '.').replace(/^[a-z.]*?(\d)/, '$1'))
    : provider === 'openai' ? id => (/^gpt/.test(id) ? 100 : 0) + ver(id) - (/mini|nano/.test(id) ? 5 : 0) - (/\d{4}-\d\d-\d\d/.test(id) ? 1 : 0)
    : id => (/chat/.test(id) ? 1 : 0);
  return list.slice().sort((a, b) => score(b.id) - score(a.id))[0];
}
/* ----- Einstellungen, Reiter „Coach Toni“ (das Formular steht in dialogs.html, den Dialog öffnet meOpen in settings.js) ----- */
function renderAiState() {
  const c = aiCfg(), el = document.getElementById('aiState'); if (!el) return;
  el.textContent = c.key ? 'Toni nutzt ' + aiName(c) + ' (' + (c.model || AI_PROVIDERS[c.provider].std) + ').' : 'Noch keine KI eingestellt.';
  const journey = document.getElementById('aiRemove'); if (journey) journey.hidden = !c.key;
  ['aiPlace', 'introAiPlace'].forEach(id => { const o = document.getElementById(id); if (o) o.textContent = aiPlace(); });
}
/* Formular auf einen Anbieter stellen: Beschriftung, gespeicherter Schlüssel und Modell (nur wenn es der gespeicherte Anbieter ist) */
function aiDlgProvider(a) {
  const k = AI_PROVIDERS[a], c = aiCfg(), isMine = c.provider === a;
  $('#aiProv').dataset.a = a;
  $('#aiKeyL').textContent = k.name + '-API-Schlüssel'; $('#aiKey').placeholder = k.ph; $('#aiWhere').textContent = k.where;
  document.querySelectorAll('#aiProv button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.a === a)));
  $('#aiKey').value = isMine && !c.local ? c.key || '' : ''; $('#aiMsg').textContent = '';
  if (isMine && c.local && c.key) $('#aiKey').placeholder = 'Gespeichert auf deinem Rechner. Leer lassen oder neuen einfügen.';
  const m = isMine && c.model || k.std; $('#aiModel').innerHTML = '<option value="' + esc(m) + '">' + esc(m) + '</option>';
}
/* Formular mit dem gespeicherten Stand füllen. Ruft meOpen() bei jedem Öffnen der Einstellungen auf. */
function hubAiFill() { const c = aiCfg(); aiDlgProvider(c.key ? c.provider : (c.provider || 'claude')); renderAiState(); }
function openAiSettings() { meOpen('toni'); }
function setupAiSettings() {
  const provider = () => $('#aiProv').dataset.a || 'claude';
  document.querySelectorAll('#aiProv button').forEach(b => b.onclick = () => aiDlgProvider(b.dataset.a));
  $('#aiLoad').onclick = async () => {
    const a = provider(), key = $('#aiKey').value.trim(), stored = aiCfg().local && aiCfg().key && aiCfg().provider === a;
    if (!key && !stored) { $('#aiMsg').textContent = 'Erst den Schlüssel einfügen.'; return; }
    $('#aiMsg').textContent = 'Prüfe Schlüssel…';
    try {
      const list = await aiModels(a, key); if (!list.length) throw new Error('Keine passenden Modelle gefunden');
      const cur = aiCfg().provider === a ? aiCfg().model : '', def = pickDefaultModel(list, a);
      $('#aiModel').innerHTML = list.map(m => '<option value="' + esc(m.id) + '">' + esc(m.label === m.id ? m.id : m.label + ' · ' + m.id) + '</option>').join('');
      $('#aiModel').value = list.some(m => m.id === cur) ? cur : def.id;
      $('#aiMsg').textContent = 'Schlüssel funktioniert. ' + list.length + ' Modelle gefunden. Vorschlag: ' + def.id;
    } catch (e) { $('#aiMsg').textContent = e instanceof TypeError ? (aiServer ? 'Keine Verbindung zum lokalen Server. Läuft npm start noch?' : 'Keine Verbindung zu ' + AI_PROVIDERS[a].name + '. Der Anbieter blockt evtl. Aufrufe direkt aus dem Browser.') : 'Klappt nicht: ' + e.message; }
  };
  $('#aiSaveBtn').onclick = () => {
    const a = provider(), c = aiCfg(), key = $('#aiKey').value.trim() || (c.local && c.key && c.provider === a ? AI_LOCAL : '');
    if (!key) { $('#aiMsg').textContent = 'Kein Schlüssel eingetragen.'; $('#aiKey').focus(); return; }
    aiSave({ provider: a, key, model: $('#aiModel').value || AI_PROVIDERS[a].std }); $('#aiKey').value = ''; aiDlgProvider(a);
    $('#aiMsg').textContent = 'Gespeichert. ' + AI_PROVIDERS[a].name + ' ist jetzt Coach Toni.' + (aiServer ? ' Der Schlüssel liegt nur in data/secrets.json.' : '');
  };
  $('#aiRemove').onclick = () => { const n = aiName(), a = provider(); aiSave({}); aiDlgProvider(a); $('#aiMsg').textContent = n + '-Schlüssel entfernt. Toni antwortet jetzt nicht mehr im Chat.'; };
  hubAiFill();
}
/* Schickt input an die eingestellte KI und schreibt die Antwort laufend in target. Gibt den Text zurück, bei Fehler null.
   opts.view: Text vor der Anzeige umformen. opts.onText: nach jedem Stück aufgerufen (z. B. zum Mitscrollen). */
async function toniStream(input, target, opts) {
  input = withProfile(input);
  const view = (opts && opts.view) || (x => x), onText = (opts && opts.onText) || (() => {});
  target.hidden = false; target.innerHTML = '<p class="tc-thinks">Toni überlegt…</p>';
  if (!aiCfg().key) { target.innerHTML = '<p>Dafür braucht Toni einen eigenen KI-Schlüssel. <button type="button" class="linkbtn">Coach Toni einrichten</button></p>'; target.querySelector('button').onclick = () => openAiSettings(); return null; }
  target.setAttribute('aria-busy', 'true'); /* Vorlesen erst, wenn die Antwort fertig ist */
  try { const t = await aiStream(input, text => { target.innerHTML = md(view(text)); onText(); }); target.innerHTML = md(view(t)); highlightIn(target); return t; }
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
aiServerLoad();
