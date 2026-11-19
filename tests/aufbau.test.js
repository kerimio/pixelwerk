// Prüft den Lernaufbau ohne Browser: Phasen, Kapitel-IDs, Pflichtfelder.
// Hilft beim Erweitern: Wer ein Kapitel kopiert und die id vergisst, merkt es hier.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const dir = path.join(__dirname, '..', 'src', 'inhalte');
const dateien = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
const code = dateien.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n') + '\n;globalThis.__ = { AKTE, CH };';
const ctx = { document: {}, window: {} }; vm.createContext(ctx); vm.runInContext(code, ctx);
const { AKTE, CH } = ctx.__;
let fehler = 0; const ok = (b, m) => { console.log((b ? '✓ ' : '✗ ') + m); if (!b) fehler++; };

ok(new Set(AKTE.map(a => a.n)).size === AKTE.length, 'Jede Phase hat eine eigene Kennung (n)');
ok(AKTE.every(a => a.title && a.sub), 'Jede Phase hat title und sub');
const ids = CH.map(c => c.id), doppelt = ids.filter((id, i) => ids.indexOf(id) !== i);
ok(!doppelt.length, 'Kapitel-IDs sind eindeutig' + (doppelt.length ? ': ' + doppelt.join(', ') : ''));
const ohnePhase = CH.filter(c => !AKTE.some(a => a.n === c.akt)).map(c => c.id);
ok(!ohnePhase.length, 'Jedes Kapitel gehört zu einer Phase' + (ohnePhase.length ? ': ' + ohnePhase.join(', ') : ''));
const pflicht = ['id', 'akt', 'title', 'tag', 'xp', 'ticket', 'story', 'slides', 'quiz', 'merke'];
const unvollst = CH.filter(c => pflicht.some(k => c[k] == null)).map(c => c.id + ' (' + pflicht.filter(k => c[k] == null).join(', ') + ')');
ok(!unvollst.length, 'Alle Kapitel haben die Pflichtfelder' + (unvollst.length ? ': ' + unvollst.join('; ') : ''));
const quizKaputt = CH.flatMap(c => c.quiz.map((q, i) => [c, q, i])).filter(([, q]) => !(q.options && q.options[q.correct] != null && q.why)).map(([c, , i]) => c.id + ' Frage ' + (i + 1));
ok(!quizKaputt.length, 'Jede Quizfrage hat Optionen, eine gültige richtige Antwort und eine Begründung' + (quizKaputt.length ? ': ' + quizKaputt.join(', ') : ''));
// Kapitel einer Phase stehen am Stück, in der Reihenfolge der Phasen
const folge = CH.map(c => c.akt).filter((a, i, l) => i === 0 || l[i - 1] !== a);
ok(folge.length === new Set(folge).size && folge.every((a, i) => a === AKTE[i].n), 'Kapitel stehen phasenweise in der Reihenfolge von AKTE');
// Zuordnen (zuordnen.js): 3 bis 6 Paare aus zwei Texten, jeder Begriff und jede Aussage nur einmal, sonst wäre die Lösung nicht eindeutig
const paareKaputt = CH.filter(c => c.paare != null).filter(c => {
  const p = c.paare, ohne = s => String(s).replace(/<\/?(?:code|b|i|em|strong)>/g, '').trim().toLowerCase();
  return !Array.isArray(p) || p.length < 3 || p.length > 6 || !p.every(x => Array.isArray(x) && x.length === 2 && x.every(s => typeof s === 'string' && ohne(s))) ||
    new Set(p.map(x => ohne(x[0]))).size !== p.length || new Set(p.map(x => ohne(x[1]))).size !== p.length;
}).map(c => c.id);
ok(!paareKaputt.length, 'Zuordnen: 3 bis 6 Paare, Begriffe und Aussagen je Kapitel eindeutig' + (paareKaputt.length ? ': ' + paareKaputt.join(', ') : ''));
const ohnePaare = CH.filter(c => !c.paare).map(c => c.id);
ok(!ohnePaare.length, 'Jedes Kapitel hat Paare zum Zuordnen' + (ohnePaare.length ? ': ' + ohnePaare.join(', ') : ''));
const exIds = CH.filter(c => c.ex).map(c => c.ex.id);
ok(new Set(exIds).size === exIds.length, 'Übungs-IDs sind eindeutig');

console.log('\n' + AKTE.map((a, i) => (i + 1) + '. ' + a.title + ' (' + CH.filter(c => c.akt === a.n).length + ')').join(' · '));
if (fehler) { console.log(fehler + ' Fehler im Lernaufbau'); process.exit(1); }
