// Zweiter Schritt nach 1-claude.js: Im Bild „Dein Coach“ zählt nur ein eigener Schlüssel (aiCfgRoh),
// nicht der Claude-Zugang des Artefakts. Der Text sagt, dass Toni hier auch ohne Schlüssel antwortet.
const fs = require('fs');
const [,, inp, out] = process.argv;
let h = fs.readFileSync(inp, 'utf8');
const alle = (a, b, n) => { const k = h.split(a).length - 1; if (k !== n) throw new Error(n + '× erwartet, ' + k + '× gefunden: ' + a.slice(0, 60)); h = h.split(a).join(b); };
alle("const c = aiCfg(), wahl = l.ki || (c.key ? 'mit' : null);", "const c = aiCfgRoh(), wahl = l.ki || (c.key ? 'mit' : null);", 2);
alle("const k = KI_ANBIETER[a], c = aiCfg(); l.anb = a; esMerken();", "const k = KI_ANBIETER[a], c = aiCfgRoh(); l.anb = a; esMerken();", 1);
alle("const c = aiCfg(); anbieter(l.anb || (c.key && KI_ANBIETER[c.anbieter]", "const c = aiCfgRoh(); anbieter(l.anb || (c.key && KI_ANBIETER[c.anbieter]", 1);
alle("<p>Toni kann mit einer KI noch mehr. Muss aber nicht.</p>", "<p>Hier im Artefakt antwortet Toni schon über Claude. Einen eigenen Schlüssel kannst du trotzdem eintragen.</p>", 1);
alle("<b>Ohne KI</b><small>Alles läuft. Die KI kannst du später im Profil einrichten.</small>", "<b>Ohne eigenen Schlüssel</b><small>Toni nutzt hier Claude über das Artefakt. Einen Schlüssel kannst du später im Profil eintragen.</small>", 1);
fs.writeFileSync(out, h);
console.log('ok', Math.round(h.length / 1024) + ' KB');
