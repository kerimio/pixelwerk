// Prüft den Lernaufbau ohne Browser: Phasen, Kapitel-IDs, Pflichtfelder.
// Hilft beim Erweitern: Wer ein Kapitel kopiert und die id vergisst, merkt es hier.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const dir = path.join(__dirname, '..', 'src', 'content');
const fileNames = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
const code = fileNames.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n') + '\n;globalThis.__ = { ACTS, CH };';
const ctx = { document: {}, window: {} }; vm.createContext(ctx); vm.runInContext(code, ctx);
const { ACTS, CH } = ctx.__;
let problems = 0; const ok = (b, m) => { console.log((b ? '✓ ' : '✗ ') + m); if (!b) problems++; };

ok(new Set(ACTS.map(a => a.n)).size === ACTS.length, 'Jede Phase hat eine eigene Kennung (n)');
ok(ACTS.every(a => a.title && a.sub), 'Jede Phase hat title und sub');
const ids = CH.map(c => c.id), duplicate = ids.filter((id, i) => ids.indexOf(id) !== i);
ok(!duplicate.length, 'Kapitel-IDs sind eindeutig' + (duplicate.length ? ': ' + duplicate.join(', ') : ''));
const withoutPhase = CH.filter(c => !ACTS.some(a => a.n === c.act)).map(c => c.id);
ok(!withoutPhase.length, 'Jedes Kapitel gehört zu einer Phase' + (withoutPhase.length ? ': ' + withoutPhase.join(', ') : ''));
const required = ['id', 'act', 'title', 'tag', 'xp', 'ticket', 'story', 'slides', 'quiz', 'takeaway'];
const incomplete = CH.filter(c => required.some(k => c[k] == null)).map(c => c.id + ' (' + required.filter(k => c[k] == null).join(', ') + ')');
ok(!incomplete.length, 'Alle Kapitel haben die Pflichtfelder' + (incomplete.length ? ': ' + incomplete.join('; ') : ''));
const quizBroken = CH.flatMap(c => c.quiz.map((q, i) => [c, q, i])).filter(([, q]) => !(q.options && q.options[q.correct] != null && q.why)).map(([c, , i]) => c.id + ' Frage ' + (i + 1));
ok(!quizBroken.length, 'Jede Quizfrage hat Optionen, eine gültige richtige Antwort und eine Begründung' + (quizBroken.length ? ': ' + quizBroken.join(', ') : ''));
// Kapitel einer Phase stehen am Stück, in der Reihenfolge der Phasen
const sequence = CH.map(c => c.act).filter((a, i, l) => i === 0 || l[i - 1] !== a);
ok(sequence.length === new Set(sequence).size && sequence.every((a, i) => a === ACTS[i].n), 'Kapitel stehen phasenweise in der Reihenfolge von ACTS');
// Zuordnen (matching.js): 3 bis 6 Paare aus zwei Texten, jeder Begriff und jede Aussage nur einmal, sonst wäre die Lösung nicht eindeutig
const paareKaputt = CH.filter(c => c.pairs != null).filter(c => {
  const p = c.pairs, without = s => String(s).replace(/<\/?(?:code|b|i|em|strong)>/g, '').trim().toLowerCase();
  return !Array.isArray(p) || p.length < 3 || p.length > 6 || !p.every(x => Array.isArray(x) && x.length === 2 && x.every(s => typeof s === 'string' && without(s))) ||
    new Set(p.map(x => without(x[0]))).size !== p.length || new Set(p.map(x => without(x[1]))).size !== p.length;
}).map(c => c.id);
ok(!paareKaputt.length, 'Zuordnen: 3 bis 6 Paare, Begriffe und Aussagen je Kapitel eindeutig' + (paareKaputt.length ? ': ' + paareKaputt.join(', ') : ''));
const ohnePaare = CH.filter(c => !c.pairs).map(c => c.id);
ok(!ohnePaare.length, 'Jedes Kapitel hat Paare zum Zuordnen' + (ohnePaare.length ? ': ' + ohnePaare.join(', ') : ''));
const exIds = CH.filter(c => c.ex).map(c => c.ex.id);
ok(new Set(exIds).size === exIds.length, 'Übungs-IDs sind eindeutig');

console.log('\n' + ACTS.map((a, i) => (i + 1) + '. ' + a.title + ' (' + CH.filter(c => c.act === a.n).length + ')').join(' · '));
if (problems) { console.log(problems + ' Fehler im Lernaufbau'); process.exit(1); }
