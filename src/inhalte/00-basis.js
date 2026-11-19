/* ===== Inhalte: Grundgerüst =====
   Jede Datei in src/inhalte/ ist eine Phase. Der Build lädt sie in der Reihenfolge der Dateinamen (01-, 02-, …),
   und genau so sehen die Lernenden sie auch: AKTE und CH werden der Reihe nach befüllt.

   Neue Phase:   neue Datei mit passender Nummer, oben AKTE.push({ n: <neue eindeutige Kennung>, title, sub }).
   Neues Kapitel: CH.push({ id, akt, title, tag, xp, ticket, story, slides, quiz, ex, merke, paare }) in der Phase-Datei.
                  paare: [[Begriff, Aussage], …] fürs Zuordnen, 3 bis 6 Stück, HTML wie im Quiz (<code>). Jede Aussage
                  passt zu genau einem Begriff.
                  Am einfachsten ein vorhandenes Kapitel kopieren. Die id (z. B. 'k07') ist der Schlüssel im
                  gespeicherten Fortschritt: nie umbenennen, auch wenn ein Kapitel an eine andere Stelle wandert.
                  Die Nummer, die die App anzeigt, kommt aus der Position, nicht aus der id.

   C`…` ist ein Tagged Template für Code-Beispiele: Backticks und ${} darin bleiben, wie sie sind. */
const C = (s, ...v) => String.raw(s, ...v).replace(/\\`/g, '`').replace(/\\\$\{/g, '${').replace(/<\\\//g, '</').replace(/^\n/, '');

const CAST = {
  toni: { name: 'Toni', role: 'Senior-Dev · dein Mentor', color: 'var(--c-toni)', initial: 'T' },
  boss: { name: 'Katrin Kaiser', role: 'Geschäftsführerin', color: 'var(--c-boss)', initial: 'K' },
  sara: { name: 'Sara', role: 'Projektmanagerin', color: 'var(--c-sara)', initial: 'S' },
  jonas: { name: 'Jonas', role: 'Backend-Dev', color: 'var(--c-jonas)', initial: 'J' },
  mia: { name: 'Mia', role: 'QA · Testerin', color: 'var(--c-mia)', initial: 'M' },
  leon: { name: 'Leon', role: 'Account Manager · nutzt das Teamboard', color: 'var(--c-leon)', initial: 'L' },
  du: { name: 'Du', role: 'Frontend-Dev, neu hier', color: 'var(--c-du)', initial: 'K' },
  ricky: { name: 'Ricky', role: 'Freelancer, kam von der Agentur Quick & Dirty', color: 'var(--c-ricky)', initial: 'R' },
  erz: { name: '', role: '', color: 'var(--muted)', initial: '' }
};

const AKTE = [];
const CH = [];
