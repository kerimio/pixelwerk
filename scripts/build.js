// Baut index.html aus src/: shell.html (Seitengerüst) + dialoge.html + chat.html, das CSS aus src/stil/ und alle JS-Dateien in fester Reihenfolge.
// Braucht kein npm install: Das CodeMirror-CSS liegt in vendor/.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = f => fs.readFileSync(path.join(root, 'src', f), 'utf8');

// Lern-Inhalte: jede Datei in src/inhalte/ ist eine Phase, geladen in der Reihenfolge der Dateinamen (00-, 01-, …).
const inhalte = fs.readdirSync(path.join(root, 'src', 'inhalte')).filter(f => f.endsWith('.js')).sort().map(f => 'inhalte/' + f);

const ORDER = [
  'kern/engine.js',                                   // echtes Angular für die Übungen + Test-Runner
  ...inhalte,                                         // Phasen und Kapitel
  'werkstatt/aufgaben.js', 'werkstatt/review-schule-inhalte.js',
  'app/html-elemente.js', 'app/lexikon.js', 'app/lernen.js', 'app/pruefung.js',
  'app/basis.js', 'app/ki.js', 'app/code-anzeige.js', // Zustand und Speichern, KI-Anbindung, Code mit Erklärungen
  'app/start.js', 'app/kapitel.js', 'app/uebung.js',  // Rahmen und Start, Kapitel-Ablauf, Code-Übung
  'app/chat.js', 'app/coach.js', 'app/staerken.js',   // Chat mit Toni, Lernprofil, Themen (was sitzt, was wackelt)
  'werkstatt/werkstatt.js', 'werkstatt/review-schule.js',
  'app/eigene.js', 'app/suche.js', 'app/jubel.js', 'app/ich.js', 'app/garderobe.js', 'app/figuren.js', 'app/einstieg.js', 'app/pr-review.js'
];
const fehlt = [];
const walk = d => fs.readdirSync(path.join(root, 'src', d), { withFileTypes: true }).forEach(e => { const p = (d ? d + '/' : '') + e.name; if (e.isDirectory()) walk(p); else if (p.endsWith('.js') && !ORDER.includes(p)) fehlt.push(p); });
walk('');
if (fehlt.length) throw new Error('Diese Dateien stehen nicht in scripts/build.js (ORDER): ' + fehlt.join(', '));

const js = ORDER.map(src).join('\n');
if (js.includes('</script')) throw new Error('"</script" im JS gefunden, das würde die Seite kaputt machen.');
const cmCss = fs.readFileSync(path.join(root, 'vendor', 'codemirror.css'), 'utf8');
// Eigenes CSS: jede Datei in src/stil/ ist ein Bereich der App, geladen in der Reihenfolge der Dateinamen (01-, 02-, …).
const css = fs.readdirSync(path.join(root, 'src', 'stil')).filter(f => f.endsWith('.css')).sort().map(f => src('stil/' + f)).join('\n');

const html = src('shell.html').replace('/*__CMCSS__*/', () => cmCss).replace('/*__CSS__*/', () => css)
  .replace('<!--__DIALOGE__-->', () => src('dialoge.html')).replace('<!--__CHAT__-->', () => src('chat.html')).replace('/*__JS__*/', () => js);
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html gebaut (' + Math.round(html.length / 1024) + ' KB)');
