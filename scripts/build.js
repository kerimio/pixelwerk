// Baut index.html aus src/: shell.html (Seitengerüst) + dialogs.html + chat.html, das CSS aus src/styles/ und alle JS-Dateien in fester Reihenfolge.
// Braucht kein npm install: Das CodeMirror-CSS liegt in vendor/.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = f => fs.readFileSync(path.join(root, 'src', f), 'utf8');

// Lern-Inhalte: jede Datei in src/content/ ist eine Phase, geladen in der Reihenfolge der Dateinamen (00-, 01-, …).
const contentFiles = fs.readdirSync(path.join(root, 'src', 'content')).filter(f => f.endsWith('.js')).sort().map(f => 'content/' + f);

const ORDER = [
  'core/engine.js', 'core/migrate.js',                                   // echtes Angular für die Übungen + Test-Runner
  ...contentFiles,                                         // Phasen und Kapitel
  'workshop/tasks.js', 'workshop/review-school-content.js',
  'app/html-elements.js', 'app/glossary.js', 'app/learning.js', 'app/exam.js',
  'app/base.js', 'app/ai.js', 'app/code-view.js', // Zustand und Speichern, KI-Anbindung, Code mit Erklärungen
  'app/start.js', 'app/chapter.js', 'app/matching.js', 'app/exercise.js', // Rahmen und Start, Kapitel-Ablauf, Zuordnen, Code-Übung
  'app/chat.js', 'app/coach.js', 'app/strengths.js',   // Chat mit Toni, Lernprofil, Themen (was sitzt, was wackelt)
  'workshop/workshop.js', 'workshop/review-school.js',
  'app/custom-chapters.js', 'app/search.js', 'app/celebrate.js', 'app/settings.js', 'app/wardrobe.js', 'app/figures.js', 'app/intro.js', 'app/pr-review.js'
];
const missing = [];
const walk = d => fs.readdirSync(path.join(root, 'src', d), { withFileTypes: true }).forEach(e => { const p = (d ? d + '/' : '') + e.name; if (e.isDirectory()) walk(p); else if (p.endsWith('.js') && !ORDER.includes(p)) missing.push(p); });
walk('');
if (missing.length) throw new Error('Diese Dateien stehen nicht in scripts/build.js (ORDER): ' + missing.join(', '));

const js = ORDER.map(src).join('\n');
if (js.includes('</script')) throw new Error('"</script" im JS gefunden, das würde die Seite kaputt machen.');
const cmCss = fs.readFileSync(path.join(root, 'vendor', 'codemirror.css'), 'utf8');
// Eigenes CSS: jede Datei in src/styles/ ist ein Bereich der App, geladen in der Reihenfolge der Dateinamen (01-, 02-, …).
const css = fs.readdirSync(path.join(root, 'src', 'styles')).filter(f => f.endsWith('.css')).sort().map(f => src('styles/' + f)).join('\n');

const html = src('shell.html').replace('/*__CMCSS__*/', () => cmCss).replace('/*__CSS__*/', () => css)
  .replace('<!--__DIALOGE__-->', () => src('dialogs.html')).replace('<!--__CHAT__-->', () => src('chat.html')).replace('/*__JS__*/', () => js);
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html gebaut (' + Math.round(html.length / 1024) + ' KB)');
