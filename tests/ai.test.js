// Prüft die KI-Auswahl: Claude, ChatGPT, Gemini und DeepSeek mit eigenem Schlüssel, direkt aus dem Browser.
// Eingestellt wird in den Einstellungen im Reiter „Coach Toni“.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');
const NM = path.join(root, 'node_modules');
const URL = 'file://' + path.join(root, 'index.html');

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) fails++; };
const sse = evs => evs.map(e => 'data: ' + (typeof e === 'string' ? e : JSON.stringify(e)) + '\n\n').join('');

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('ngfc.v1')) localStorage.setItem('ngfc.v1', '{"ich":{"start":1}}'); } catch (e) {} }); // Spiel-Einstieg gilt als erlebt
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const calls = [];
  await ctx.route('**/*', r => {
    const req = r.request(), u = req.url();
    const m = u.match(/cdn\.jsdelivr\.net\/npm\/(@?[^@]+)@[^/]+\/(.*)$/);
    if (m) return r.fulfill({ body: fs.readFileSync(path.join(NM, m[1], m[2])), contentType: 'application/javascript' });
    if (u.startsWith('file:')) return r.continue();
    const h = req.headers(), body = req.postData() ? JSON.parse(req.postData()) : null;
    calls.push({ u, h, body });
    if (u === 'https://api.anthropic.com/v1/messages') {
      if (h['x-api-key'] !== 'sk-ant-gut') return r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }) });
      return r.fulfill({ status: 200, contentType: 'text/event-stream', body: sse([{ type: 'message_start' }, { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hallo ' } }, { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'von Claude' } }, { type: 'message_stop' }]) });
    }
    if (u.startsWith('https://api.anthropic.com/v1/models')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'claude-haiku-5-5', display_name: 'Claude Haiku 5.5' }, { id: 'claude-opus-5-5', display_name: 'Claude Opus 5.5' }] }) });
    if (u === 'https://api.openai.com/v1/models') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'gpt-5' }, { id: 'gpt-5-mini' }, { id: 'whisper-1' }, { id: 'tts-1' }] }) });
    if (u === 'https://api.openai.com/v1/chat/completions' || u === 'https://api.deepseek.com/chat/completions') {
      const who = u.includes('openai') ? 'ChatGPT' : 'DeepSeek';
      return r.fulfill({ status: 200, contentType: 'text/event-stream', body: sse([{ choices: [{ delta: { role: 'assistant' } }] }, { choices: [{ delta: { content: 'Hallo von ' } }] }, { choices: [{ delta: { content: who } }] }, '[DONE]']) });
    }
    if (u.startsWith('https://generativelanguage.googleapis.com/')) return r.fulfill({ status: 200, contentType: 'text/event-stream', body: sse([{ candidates: [{ content: { parts: [{ text: 'Hallo von Gemini' }] } }] }]) });
    return r.abort();
  });

  await page.goto(URL);
  await page.waitForFunction(() => window.ts, null, { timeout: 30000 });
  const ask = () => page.evaluate(async () => { try { return await aiStream('Sag Hallo', () => {}, 'SYS', { maxOutputTokens: 1000 }); } catch (e) { return 'FEHLER ' + e.code + ' ' + e.message; } });
  const put = c => page.evaluate(c => localStorage.setItem('ngfc.ai', JSON.stringify(c)), c);

  // Alte Gemini-Einstellung ohne Anbieter läuft weiter
  await put({ key: 'AIza-test', model: 'gemini-2.5-flash' });
  ok(await ask() === 'Hallo von Gemini', 'Alte Gemini-Einstellung ohne Anbieter funktioniert weiter');

  // Claude
  await put({ provider: 'claude', key: 'sk-ant-gut', model: 'claude-opus-5-5' });
  ok(await ask() === 'Hallo von Claude', 'Claude antwortet im Stream');
  let c = calls.filter(x => x.u.endsWith('/v1/messages')).pop();
  ok(c.h['anthropic-dangerous-direct-browser-access'] === 'true' && c.h['anthropic-version'], 'Claude-Aufruf mit Browser-Header und Version');
  ok(c.body.system === 'SYS' && c.body.messages[0].role === 'user' && c.body.stream === true && !('temperature' in c.body), 'Claude: System getrennt, Stream an, keine Temperatur');
  await put({ provider: 'claude', key: 'sk-ant-falsch' });
  const f = await ask();
  ok(/FEHLER gemini_key .*invalid x-api-key/.test(f), 'Falscher Claude-Schlüssel gibt verständlichen Fehler');
  ok((await page.evaluate(() => aiError({ code: 'gemini_key', message: 'x' }))).startsWith('Claude sagt Nein'), 'Fehlermeldung nennt den gewählten Anbieter');

  // ChatGPT und DeepSeek
  await put({ provider: 'openai', key: 'sk-o', model: 'gpt-5' });
  ok(await ask() === 'Hallo von ChatGPT', 'ChatGPT antwortet im Stream');
  c = calls.filter(x => x.u.includes('openai.com/v1/chat')).pop();
  ok(c.h.authorization === 'Bearer sk-o' && c.body.messages[0].role === 'system' && c.body.max_completion_tokens >= 1000, 'ChatGPT: Bearer-Schlüssel, Systemrolle, max_completion_tokens');
  await put({ provider: 'deepseek', key: 'sk-d' });
  ok(await ask() === 'Hallo von DeepSeek', 'DeepSeek antwortet, Standardmodell ohne Auswahl');
  c = calls.filter(x => x.u.includes('deepseek')).pop();
  ok(c.body.model === 'deepseek-chat', 'DeepSeek nutzt deepseek-chat als Standard');

  // JSON-Modus
  await put({ provider: 'openai', key: 'sk-o', model: 'gpt-5' });
  await page.evaluate(() => aiStream('x', () => {}, 'S', { responseMimeType: 'application/json' }));
  ok(calls.filter(x => x.u.includes('openai.com/v1/chat')).pop().body.response_format.type === 'json_object', 'JSON-Wunsch wird bei ChatGPT zu response_format');

  // Ohne Schlüssel sagt die Fehlermeldung, wo man ihn einträgt
  await page.evaluate(() => localStorage.removeItem('ngfc.ai'));
  const without = await page.evaluate(() => aiError({ code: 'unavailable' }));
  ok(without.includes('oben rechts') && without.includes('„Coach Toni“') && !without.includes('unten links'), 'Ohne KI: Die Meldung nennt den neuen Ort (Profil oben rechts, Reiter „Coach Toni“)');

  // Einstellungen, Reiter „Coach Toni“: Anbieter wählen, Modelle laden, speichern
  const pressed = () => page.$$eval('#aiProv button[aria-pressed="true"]', l => l.map(b => b.dataset.a).join(','));
  await page.evaluate(() => openAiSettings());
  ok(await page.isVisible('#meDlg[open] #meP-toni') && await page.getAttribute('#meTab-toni', 'aria-selected') === 'true', 'openAiSettings() öffnet die Einstellungen im Reiter „Coach Toni“');
  ok((await page.textContent('#aiKeyL')).includes('Claude') && await pressed() === 'claude' && (await page.textContent('#aiState')) === 'Noch keine KI eingestellt.' && !(await page.isVisible('#aiRemove')), 'Reiter startet mit Claude, noch ohne KI');
  await page.click('#aiSaveBtn');
  ok((await page.textContent('#aiMsg')).includes('Kein Schlüssel') && !(await page.evaluate(() => localStorage.getItem('ngfc.ai'))), 'Speichern ohne Schlüssel speichert nichts und sagt, was fehlt');
  await page.click('#aiProv [data-a="openai"]');
  ok((await page.textContent('#aiKeyL')).includes('ChatGPT') && await pressed() === 'openai' && (await page.textContent('#aiWhere')).includes('platform.openai.com'), 'Umschalten auf ChatGPT ändert Beschriftung und Hinweis');
  await page.fill('#aiKey', 'sk-o'); await page.click('#aiLoad');
  await page.waitForFunction(() => /funktioniert/.test(document.getElementById('aiMsg').textContent), null, { timeout: 5000 });
  const opts = await page.$$eval('#aiModel option', o => o.map(x => x.value));
  ok(opts.includes('gpt-5') && !opts.includes('whisper-1') && !opts.includes('tts-1'), 'Nur Chat-Modelle in der Liste');
  ok(await page.inputValue('#aiModel') === 'gpt-5', 'Vorschlag ist das Standardmodell');
  await page.click('#aiSaveBtn');
  const cfg = await page.evaluate(() => JSON.parse(localStorage.getItem('ngfc.ai')));
  ok(cfg.provider === 'openai' && cfg.key === 'sk-o' && cfg.model === 'gpt-5', 'Gespeichert: Anbieter, Schlüssel, Modell');
  ok((await page.textContent('#aiState')).includes('ChatGPT') && (await page.textContent('#aiState')).includes('gpt-5') && await page.isVisible('#aiRemove'), 'Status im Reiter zeigt ChatGPT mit Modell');
  await page.click('#meClose');
  await page.evaluate(() => openAiSettings());
  ok(await pressed() === 'openai' && await page.inputValue('#aiKey') === 'sk-o' && await page.inputValue('#aiModel') === 'gpt-5', 'Beim nächsten Öffnen steht der gespeicherte Stand im Formular');
  await page.click('#aiProv [data-a="claude"]'); await page.fill('#aiKey', 'sk-ant-gut'); await page.click('#aiLoad');
  await page.waitForFunction(() => /funktioniert/.test(document.getElementById('aiMsg').textContent), null, { timeout: 5000 });
  ok(await page.inputValue('#aiModel') === 'claude-opus-5-5', 'Claude schlägt Opus 5.5 vor');
  await page.click('#aiProv [data-a="openai"]');
  await page.click('#aiRemove');
  ok(!(await page.evaluate(() => (JSON.parse(localStorage.getItem('ngfc.ai') || '{}')).key)) && (await page.textContent('#aiState')) === 'Noch keine KI eingestellt.' && (await page.textContent('#aiMsg')).includes('entfernt') && !(await page.isVisible('#aiRemove')), '„Schlüssel entfernen“ löscht den Schlüssel, der Status sagt es');
  await page.evaluate(() => localStorage.setItem('ngfc.ai', JSON.stringify({ provider: 'openai', key: 'sk-o', model: 'gpt-5' })));
  await page.click('#meClose');
  ok(!(await page.isVisible('#meDlg[open]')) && !(await page.$('#aiDlg')), 'Kreuz schließt die Einstellungen, einen eigenen KI-Dialog gibt es nicht mehr');

  // Schlüssel landet nicht im Fortschritt
  ok(!(await page.evaluate(() => localStorage.getItem('ngfc.v1') || '')).includes('sk-o'), 'Schlüssel steht nicht im Fortschritt');
  ok(errors.length === 0, 'Keine JS-Fehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fails ? '\n' + fails + ' Fehler' : '\nAlles grün');
  process.exit(fails ? 1 : 0);
})();
