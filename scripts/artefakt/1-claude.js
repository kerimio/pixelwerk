// Erster Schritt: macht aus index.html (main) die Artefakt-Fassung. Coach Toni nutzt ohne eigenen Schlüssel Claude über das Artefakt (sample).
const fs = require('fs');
const [,, inp, out] = process.argv;
let h = fs.readFileSync(inp, 'utf8');
const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error('nicht eindeutig: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
rep('function aiCfg() {', 'function aiCfgRoh() {');
rep("function aiSave(c) {", `/* Artefakt: ohne eigenen Schlüssel antwortet Claude über das Artefakt */
let PW_SAMPLE = null;
(function pwSample(n) {
  try {
    if (window.claude && window.claude.use) { window.claude.use('sample').then(s => { if (!s) return; PW_SAMPLE = s; try { renderAiState(); if (document.getElementById('tcChips')) tcStand(); } catch (e) {} }).catch(() => {}); return; }
  } catch (e) {}
  if (n < 20) setTimeout(() => pwSample(n + 1), 250);
})(0);
function aiCfg() { const c = aiCfgRoh(); return (!c.key && PW_SAMPLE) ? { anbieter: 'artefakt', key: 'artefakt', model: 'Claude' } : c; }
function aiSave(c) {`);
rep("deepseek: { name: 'DeepSeek',", "artefakt: { name: 'Claude', ph: '', std: 'Claude', wo: '' },\n  deepseek: { name: 'DeepSeek',");
rep("const modell = c.model || KI_ANBIETER[c.anbieter].std, json = g.responseMimeType === 'application/json';",
`const modell = c.model || KI_ANBIETER[c.anbieter].std, json = g.responseMimeType === 'application/json';
  if (c.anbieter === 'artefakt') {
    const msgs = kiNachrichten(input), vor = sys + (json ? '\\n\\nAntworte ausschließlich mit gültigem JSON, ohne Text davor oder danach.' : '');
    if (msgs.length && msgs[0].role === 'user') msgs[0] = { role: 'user', content: vor + '\\n\\n---\\n\\n' + msgs[0].content };
    else msgs.unshift({ role: 'user', content: vor }, { role: 'assistant', content: 'Alles klar.' });
    const r = await PW_SAMPLE(msgs, { cache: false, onText: ({ text }) => { if (text) onText(text); } });
    const t = (r && r.text) || ''; if (!t) { const err = new Error('Leere Antwort'); err.code = 'gemini'; throw err; }
    return json ? t.replace(/^\\s*\`\`\`(?:json)?\\s*/, '').replace(/\\s*\`\`\`\\s*$/, '') : t;
  }`);
rep("el.textContent = c.key ? 'Toni nutzt '", "el.textContent = c.anbieter === 'artefakt' ? 'Toni nutzt hier Claude, direkt über dieses Artefakt. Ein eigener Schlüssel ist nicht nötig, geht aber auch.' : c.key ? 'Toni nutzt '");
rep("const weg = document.getElementById('aiRemove'); if (weg) weg.hidden = !c.key;", "const weg = document.getElementById('aiRemove'); if (weg) weg.hidden = !c.key || c.anbieter === 'artefakt';");
rep("function hubKiFuellen() { const c = aiCfg();", "function hubKiFuellen() { const c = aiCfgRoh();");
rep("const k = KI_ANBIETER[a], c = aiCfg(), meins", "const k = KI_ANBIETER[a], c = aiCfgRoh(), meins");
rep("  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = filename; document.body.appendChild(a); a.click(); a.remove();\n  setTimeout(() => URL.revokeObjectURL(a.href), 2000);",
"  const dl = window.claude && window.claude.use ? await window.claude.use('downloads').catch(() => null) : null;\n  if (dl) { try { await dl.save({ filename, data }); } catch (e) { hubSpielMelden('Nicht gespeichert.'); return; } }\n  else { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = filename; document.body.appendChild(a); a.click(); a.remove();\n  setTimeout(() => URL.revokeObjectURL(a.href), 2000); }");
fs.writeFileSync(out, h);
console.log('ok', Math.round(h.length / 1024) + ' KB');
