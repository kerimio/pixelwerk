// Dritter Schritt nach 1-claude.js und 2-einstieg.js: Auch im Artefakt geht es ganz ohne KI.
// „Ganz ohne KI“ (Einstieg „Dein Coach“ oder Profil, Reiter „Coach Toni“) schaltet Claude über das Artefakt ab.
// Gemerkt wird das nur in diesem Browser (localStorage pw_ohne_ki).
const fs = require('fs');
const [,, inp, out] = process.argv;
let h = fs.readFileSync(inp, 'utf8');
const rep = (a, b) => { if (h.split(a).length !== 2) throw new Error('nicht eindeutig: ' + a.slice(0, 60)); h = h.replace(a, () => b); };
rep("function aiCfg() { const c = aiCfgRoh(); return (!c.key && PW_SAMPLE) ?",
`function pwOhneKi() { try { return localStorage.getItem('pw_ohne_ki') === '1'; } catch (e) { return false; } }
function pwOhneKiSetzen(an) { try { if (an) localStorage.setItem('pw_ohne_ki', '1'); else localStorage.removeItem('pw_ohne_ki'); } catch (e) {} try { renderAiState(); } catch (e) {} }
function aiCfg() { const c = aiCfgRoh(); return (!c.key && PW_SAMPLE && !pwOhneKi()) ?`);
// Einstieg: dritte Wahl „Ganz ohne KI“
rep("<b>Ohne eigenen Schlüssel</b><small>Toni nutzt hier Claude über das Artefakt. Einen Schlüssel kannst du später im Profil eintragen.</small></button>",
`<b>Ohne eigenen Schlüssel</b><small>Toni nutzt hier Claude über das Artefakt. Einen Schlüssel kannst du später im Profil eintragen.</small></button>
      <button type="button" class="es-ki-k" data-ki="aus" aria-pressed="\${wahl === 'aus'}"><b>Ganz ohne KI</b><small>Toni bleibt still. Folien, Quiz, Übungen und Wiederholen laufen trotzdem.</small></button>`);
rep("const c = aiCfgRoh(), wahl = l.ki || (c.key ? 'mit' : null);\n  return",
"const c = aiCfgRoh(), wahl = l.ki || (c.key ? 'mit' : pwOhneKi() ? 'aus' : null);\n  return");
rep("    l.ki = b.dataset.ki; esMerken(); stand();", "    l.ki = b.dataset.ki; pwOhneKiSetzen(l.ki === 'aus'); esMerken(); stand();");
rep("esFuss(w, wahl === 'ohne' ?", "esFuss(w, wahl === 'aus' ? 'Ohne KI läuft alles. Einschalten kannst du Toni jederzeit im Profil unter „Coach Toni“.' : wahl === 'ohne' ?");
rep("aiSave({ anbieter: a, key: k, model }); l.ki = 'mit';", "aiSave({ anbieter: a, key: k, model }); pwOhneKiSetzen(false); l.ki = 'mit';");
// Profil, Reiter „Coach Toni“: Claude im Artefakt aus- und wieder einschalten
rep("const weg = document.getElementById('aiRemove'); if (weg) weg.hidden = !c.key || c.anbieter === 'artefakt';",
`const weg = document.getElementById('aiRemove'); if (weg) weg.hidden = !c.key || c.anbieter === 'artefakt';
  if (!aiCfgRoh().key && PW_SAMPLE) {
    let s = document.getElementById('pwKiSchalter');
    if (!s) { el.insertAdjacentHTML('afterend', '<p class="small"><button type="button" class="linkbtn" id="pwKiSchalter"></button></p>'); s = document.getElementById('pwKiSchalter'); s.onclick = () => pwOhneKiSetzen(!pwOhneKi()); }
    if (pwOhneKi()) el.textContent = 'Ganz ohne KI: Toni bleibt still, alles andere läuft.';
    s.textContent = pwOhneKi() ? 'Claude hier wieder einschalten' : 'Ganz ohne KI weiter';
    s.parentElement.hidden = false;
  } else { const s = document.getElementById('pwKiSchalter'); if (s) s.parentElement.hidden = true; }`);
fs.writeFileSync(out, h);
console.log('ok', Math.round(h.length / 1024) + ' KB');
