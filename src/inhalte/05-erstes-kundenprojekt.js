/* ================= Phase: ERSTES KUNDENPROJEKT · RxJS ================= */
AKTE.push({ n: 3, title: 'Erstes Kundenprojekt', sub: 'RxJS von null bis switchMap, HTTP, Fehler' });

CH.push({
  id: 'k12', akt: 3, title: 'Der Live-Ticker', tag: 'RxJS: Observable', xp: 130,
  doku: [['Observable in RxJS', 'https://rxjs.dev/guide/observable'], ['Funktion interval()', 'https://rxjs.dev/api/index/function/interval']],
  ticket: { id: 'PW-125', typ: 'Feature', titel: 'Live-Ticker anbinden', text: 'Das Backend schickt Ereignisse zum Konzertabend (Einlass, Beginn, Pause, Zugabe) über die Zeit. Zeige sie im Ticker an.' },
  story: [
    ['erz', 'Jetzt geht es los: dein erstes Kundenprojekt, die App für das Konzerthaus am Rhein. Erstes Feature: ein Live-Ticker zum Abend. Meldungen kommen irgendwann, in unbekannten Abständen.'],
    ['jonas', 'Die Ereignisse kommen als Stream über WebSocket. Ich hab euch einen Endpunkt gebaut.'],
    ['du', 'Ein Signal hat EINEN Wert. Das hier ist ein Strom von Meldungen.'],
    ['toni', 'Genau dafür gibt es RxJS. Klingt schwer, ist es nicht.']
  ],
  slides: [
    { t: 'Observable = Live-Ticker', say: 'Ein Observable schickt Werte über die Zeit. Erst, wenn jemand zuhört.', job: 'HttpClient, Router-Events, Formular-Änderungen, WebSockets: In Angular sind das alles Observables. Du triffst RxJS in jedem Firmen-Projekt, auch wenn neuer Code mehr Signals nutzt.',
      code: C`
const ticker$ = new Observable<string>(abo => {
  abo.next('Einlass');
  abo.next('Zugabe!');
  abo.complete();
  return () => console.log('aufräumen');
});

const sub = ticker$.subscribe({
  next: m => console.log(m),
  complete: () => console.log('Vorhang'),
});
sub.unsubscribe();`,
      notes: [['new Observable', 'Baut einen eigenen Ticker.'], ["abo.next('Einlass')", 'next = eine Meldung schicken.'], ['abo.complete()', 'complete = Abend vorbei. Danach kommt nichts mehr.'], ['return () =>', 'Aufräumen, wenn jemand abbestellt.'], ['.subscribe(', 'Abo starten. Erst JETZT läuft der Ticker.'], ['unsubscribe()', 'Abo kündigen.']],
      pro: 'Signal = Wert jetzt (synchron). Observable = Ereignisse über Zeit (asynchron, kann complete/error). In Angular: Zustand in Signals, Abläufe (HTTP, Eingaben, WebSockets) in RxJS. Cold: jeder Abonnent startet neu. Das $ am Namen heißt: Observable.' },
    { t: 'Fertige Ticker', say: 'Für Standardfälle gibt es fertige Erzeuger.', job: 'of() und from() siehst du im Job vor allem in Tests und Fake-Services: Statt echtem Server gibt der Fake einfach of([...Entwickler]) zurück.',
      code: C`
of('Bravo', 'Bravo');
from([1, 2, 3]);
interval(1000);
timer(500);`,
      notes: [["of('Bravo'", 'Schickt die Werte nacheinander, dann complete.'], ['from([', 'Aus einem Array.'], ['interval(1000)', 'Jede Sekunde 0, 1, 2 … Hört NIE auf. Abbestellen!'], ['timer(500)', 'Nach 500 ms ein Wert, dann complete.']],
      pro: 'Was nie completet (interval, fromEvent), musst du abbestellen. Sonst Memory-Leak.' }
  ],
  quiz: [{ q: 'Im Code steht <code>const d$ = http.get(\'/api\')</code>, aber niemand ruft subscribe auf. Was passiert?', options: ['Die Anfrage geht sofort raus', 'Nichts, denn Observables sind lazy', 'Es gehen zwei Anfragen raus', 'Angular wirft einen Fehler'], correct: 1, why: 'HttpClient schickt die Anfrage erst los, wenn jemand subscribe aufruft. Das zu vergessen ist ein typischer Anfänger-Bug.' },
    { q: 'Was gibt <code>of(\'A\', \'B\').subscribe({ next: x =&gt; log(x), complete: () =&gt; log(\'Ende\') })</code> der Reihe nach aus?', options: ['Ende, A, B', 'A, B, Ende', 'A, B', 'Nur Ende'], correct: 1, why: 'of schickt die Werte der Reihe nach und meldet danach complete.' },
    { q: 'Eine Komponente startet <code>interval(1000).subscribe(...)</code> und wird danach zerstört. Was passiert ohne unsubscribe?', options: ['Das interval läuft weiter und hält Speicher fest, ein Memory-Leak', 'Angular beendet es automatisch', 'Es hört nach zehn Werten auf', 'Es wirft sofort einen Fehler'], correct: 0, why: 'interval hört nie von selbst auf. Ohne Abbestellen läuft es weiter, auch wenn die Komponente längst weg ist.' }
  ],
  ex: { id: 'ex12', title: 'Eigene Ticker', goal: 'Bau drei Ticker.',
    todo: ['<code>applaus$</code>: mit <code>of</code>, schickt „Bravo“, „Bravo“, „Bravo“', '<code>countdown(von)</code>: mit <code>new Observable</code>, schickt von … 1, dann complete', '<code>vorhang()</code>: nach 50 ms „Vorhang!“, dann complete. Bei Abbestellen vorher: <code>clearTimeout</code>'],
    starter: C`
import { Observable, of } from 'rxjs';

export const applaus$ = of();

export function countdown(von: number): Observable<number> {
  return new Observable<number>(abo => {
    // von ... 1, dann complete
  });
}

export function vorhang(): Observable<string> {
  return new Observable<string>(abo => {
    // setTimeout 50 ms: next + complete
    // return () => clearTimeout(...)
  });
}
`,
    solution: C`
import { Observable, of } from 'rxjs';

export const applaus$ = of('Bravo', 'Bravo', 'Bravo');

export function countdown(von: number): Observable<number> {
  return new Observable<number>(abo => {
    for (let i = von; i >= 1; i--) {
      abo.next(i);
    }
    abo.complete();
  });
}

export function vorhang(): Observable<string> {
  return new Observable<string>(abo => {
    const t = setTimeout(() => {
      abo.next('Vorhang!');
      abo.complete();
    }, 50);
    return () => clearTimeout(t);
  });
}
`,
    notes: [["of('Bravo', 'Bravo', 'Bravo')", 'Drei Werte, dann complete.'], ['for (let i = von; i >= 1; i--)', 'Schleife rückwärts: von, von-1, … 1.'], ['abo.next(i)', 'Jede Zahl schicken.'], ['abo.complete()', 'Dann Schluss.'], ['const t = setTimeout', 'Timer merken, damit wir ihn stoppen können.'], ['return () => clearTimeout(t)', 'Abbestellt? Timer stoppen. Kein Wert kommt mehr.']],
    hints: ["<code>of('Bravo', 'Bravo', 'Bravo')</code>", 'countdown: <code>for (let i = von; i &gt;= 1; i--) abo.next(i);</code> dann <code>abo.complete()</code>', 'vorhang: <code>const t = setTimeout(() =&gt; { … }, 50); return () =&gt; clearTimeout(t);</code>'],
    tests: [
      { name: 'applaus$ = Bravo ×3', run: async T => { const r = await T.collect(T.get('applaus$')); T.eq(r.vals, ['Bravo', 'Bravo', 'Bravo'], 'applaus$ soll genau dreimal „Bravo“ schicken und dann fertig sein. Stehen in of(...) drei Mal \'Bravo\', genau so geschrieben?'); T.ok(r.complete, 'Soll completen.'); } },
      { name: 'countdown(3) = 3, 2, 1', run: async T => { const r = await T.collect(T.get('countdown')(3)); T.eq(r.vals, [3, 2, 1], 'countdown(3) soll 3, 2, 1 schicken.'); T.ok(r.complete, 'Am Ende complete aufrufen.'); } },
      { name: 'Jeder Abonnent bekommt alles', run: async T => { const c = T.get('countdown')(2); const a = await T.collect(c); const b = await T.collect(c); T.eq([a.vals, b.vals], [[2, 1], [2, 1]], 'Jeder Abonnent soll den ganzen Countdown bekommen.'); } },
      { name: 'vorhang kommt nach ~50 ms', run: async T => { const r = await T.collect(T.get('vorhang')(), 150); T.eq(r.vals, ['Vorhang!'], 'Es soll „Vorhang!“ kommen.'); T.ok(r.complete, 'Danach complete.'); } },
      { name: 'Früh abbestellt = nichts', run: async T => { const got = []; const sub = T.get('vorhang')().subscribe(v => got.push(v)); await T.flush(10); sub.unsubscribe(); await T.flush(80); T.eq(got, [], 'Nach unsubscribe kam trotzdem was. Gib eine Aufräum-Funktion mit clearTimeout zurück.'); } }
    ] },
  merke: ['Observable = Werte über Zeit: next, error, complete.', 'Lazy: ohne subscribe passiert nichts.', 'Aufräum-Funktion läuft beim unsubscribe.']
});

CH.push({
  id: 'k13', akt: 3, title: 'Die Support-Analyse', tag: 'pipe · map · filter · take', xp: 130,
  doku: [['Operatoren in RxJS', 'https://rxjs.dev/guide/operators'], ['filter-Operator', 'https://rxjs.dev/api/operators/filter'], ['take-Operator', 'https://rxjs.dev/api/operators/take']],
  ticket: { id: 'PW-126', typ: 'Feature', titel: 'Nur lange Support-Fälle anzeigen', text: 'Das Support-Tool meldet jeden erledigten Fall mit Bearbeiter und Dauer. Die Konzerthaus-Leitung will nur Fälle ab 80 Minuten sehen. Für die Übersicht oben reichen die ersten zwei Namen, in Großbuchstaben.' },
  story: [
    ['boss', 'Die Leitung vom Konzerthaus bekommt 300 Support-Meldungen am Tag. Sie will nur die Fälle sehen, die richtig lange gedauert haben.'],
    ['toni', 'Wir hängen Operatoren an den Stream. Jeder macht eine Sache. Zusammengesteckt mit pipe().']
  ],
  slides: [
    { t: 'Operatoren = Filter am Stream', say: 'pipe() steckt Operatoren hintereinander. Jeder bearbeitet die Werte.', job: 'In Services siehst du oft http.get(...).pipe(map(antwort => antwort.daten)). Die API-Antwort wird gleich in die Form gebracht, die die App braucht. Das hält die Komponenten sauber.',
      code: C`
faelle$.pipe(
  filter(s => s.minuten >= 80),
  map(s => s.name.toUpperCase()),
  tap(n => console.log(n)),
  take(2),
);`,
      notes: [['.pipe(', 'Startet die Kette.'], ['filter(', 'Nur Fälle ab 80 Minuten kommen durch.'], ['map(', 'Macht aus jedem Fall den Namen in GROSS.'], ['tap(', 'Nur gucken, nichts ändern. Gut zum Debuggen.'], ['take(2)', 'Nur die ersten 2, dann complete.']],
      pro: 'Reihenfolge zählt: oben nach unten. Operatoren sind Funktionen (quelle$) => neu$. Darum kannst du eigene bauen. Weitere: distinctUntilChanged, startWith, skip, first (Fehler, wenn nichts kommt).' }
  ],
  quiz: [{ q: 'Welche Werte liefert <code>from([1,2,3,4]).pipe(map(x =&gt; x * 10), filter(x =&gt; x &gt; 15))</code>?', options: ['1, 2, 3, 4', '20, 30, 40', '10, 20', '2, 3, 4'], correct: 1, why: 'Erst multipliziert map jeden Wert mit 10: 10, 20, 30, 40. Dann lässt filter nur Werte über 15 durch: 20, 30, 40.' },
    { q: 'Was liefert <code>from([5, 8, 3, 9]).pipe(filter(x =&gt; x &gt; 4), take(2))</code>?', options: ['5, 8, 9', '8, 9', '5, 8, 3', '5, 8'], correct: 3, why: 'filter lässt 5, 8 und 9 durch. take(2) nimmt davon die ersten zwei und meldet dann complete.' },
    { q: 'Wofür benutzt du <code>tap()</code> in einer pipe?', options: ['Um Werte umzuwandeln', 'Um Werte auszusortieren', 'Um Werte anzuschauen, etwa zum Loggen, ohne sie zu ändern', 'Um den Stream zu beenden'], correct: 2, why: 'tap schaut nur zu. Was du darin zurückgibst, wird ignoriert, die Werte fließen unverändert weiter.' }
  ],
  ex: { id: 'ex13', title: 'Lange Fälle', goal: 'Filtere den Support-Stream.',
    todo: ['<code>langeFaelle$</code>: nur minuten ab 80, nur der Name', '<code>ersteZweiGross$</code>: nur die ersten 2 Fälle, Name in GROSS', '<b>Profi:</b> eigener Operator <code>nurPosition(pos)</code>: lässt nur Entwickler mit dieser Position durch'],
    starter: C`
import { from, Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

interface Fall { name: string; minuten: number; }
interface Entwickler { name: string; position: string; }

export const faelle$ = from<Fall[]>([
  { name: 'Leon', minuten: 94 },
  { name: 'Mo', minuten: 42 },
  { name: 'Ben', minuten: 87 },
  { name: 'Tim', minuten: 66 },
]);

export const langeFaelle$ = faelle$.pipe(
  // filter, map
);

export const ersteZweiGross$ = faelle$.pipe(
  // take, map
);

export function nurPosition(pos: string) {
  return (quelle$: Observable<Entwickler>) => quelle$; // filter einbauen
}
`,
    solution: C`
import { from, Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

interface Fall { name: string; minuten: number; }
interface Entwickler { name: string; position: string; }

export const faelle$ = from<Fall[]>([
  { name: 'Leon', minuten: 94 },
  { name: 'Mo', minuten: 42 },
  { name: 'Ben', minuten: 87 },
  { name: 'Tim', minuten: 66 },
]);

export const langeFaelle$ = faelle$.pipe(
  filter(s => s.minuten >= 80),
  map(s => s.name),
);

export const ersteZweiGross$ = faelle$.pipe(
  take(2),
  map(s => s.name.toUpperCase()),
);

export function nurPosition(pos: string) {
  return (quelle$: Observable<Entwickler>) => quelle$.pipe(filter(s => s.position === pos));
}
`,
    notes: [['filter(s => s.minuten >= 80)', 'Nur lange Fälle durch.'], ['map(s => s.name)', 'Aus dem Objekt wird nur der Name.'], ['take(2)', 'Erst begrenzen …'], ['toUpperCase()', '… dann groß machen.'], ['return (quelle$', 'Eigener Operator: Funktion, die ein Observable nimmt und ein neues zurückgibt.']],
    hints: ['<code>filter(s =&gt; s.minuten &gt;= 80), map(s =&gt; s.name)</code>', '<code>take(2), map(s =&gt; s.name.toUpperCase())</code>', '<code>return (quelle$) =&gt; quelle$.pipe(filter(s =&gt; s.position === pos));</code>'],
    tests: [
      { name: 'langeFaelle$ = Leon, Ben', run: async T => { const r = await T.collect(T.get('langeFaelle$')); T.eq(r.vals, ['Leon', 'Ben'], 'langeFaelle$ soll nur die Namen der Fälle ab 80 Minuten schicken. Prüfst du mit >= 80 (nicht > 80)? Und kommt map(s => s.name) nach dem filter?'); } },
      { name: 'ersteZweiGross$ = LEON, MO', run: async T => { const r = await T.collect(T.get('ersteZweiGross$')); T.eq(r.vals, ['LEON', 'MO'], 'ersteZweiGross$ soll die ersten zwei Namen in Großbuchstaben schicken. Steht take(2) drin, und machst du im map aus dem Fall den Namen mit toUpperCase()?'); T.ok(r.complete, 'Soll completen.'); } },
      { name: 'nurPosition("Frontend")', run: async T => { const sp = T.rx.from([{ name: 'Leon', position: 'Frontend' }, { name: 'Mo', position: 'Backend' }, { name: 'Ben', position: 'Frontend' }]); const r = await T.collect(sp.pipe(T.get('nurPosition')('Frontend'))); T.eq(r.vals.map(s => s.name), ['Leon', 'Ben'], 'Nur Leon und Ben sollen durch.'); } },
      { name: 'nurPosition("Backend")', run: async T => { const sp = T.rx.from([{ name: 'Leon', position: 'Frontend' }, { name: 'Mo', position: 'Backend' }]); const r = await T.collect(sp.pipe(T.get('nurPosition')('Backend'))); T.eq(r.vals.map(s => s.name), ['Mo'], 'Nur Mo soll durch.'); } }
    ] },
  merke: ['pipe(op1, op2): oben nach unten.', 'map umwandeln, filter sieben, take begrenzen, tap gucken.', 'Eigener Operator = Funktion Observable → Observable.']
});

CH.push({
  id: 'k14', akt: 3, title: 'Die Durchsage im Foyer', tag: 'Subject · BehaviorSubject', xp: 140,
  doku: [['Signals im Überblick', 'https://angular.dev/guide/signals'], ['RxJS Subject', 'https://rxjs.dev/guide/subject'], ['Signals und RxJS verbinden', 'https://angular.dev/ecosystem/rxjs-interop']],
  ticket: { id: 'PW-127', typ: 'Feature', titel: 'Warenkorb im Ticket-Shop', text: 'Der Warenkorb-Zähler oben soll immer den aktuellen Stand zeigen, auch auf Seiten, die später geöffnet werden.' },
  story: [
    ['sara', 'Der Warenkorb-Zähler im Header zeigt nach Seitenwechsel 0, obwohl Tickets drin sind.'],
    ['toni', 'Wer zu spät zuhört, hat bei einem normalen Subject die Nachricht verpasst. Wir brauchen eins, das sich den letzten Stand merkt.']
  ],
  slides: [
    { t: 'Subject = Durchsage an alle', say: 'Ein Subject: Du sprichst rein (next), alle Zuhörer hören es.', job: 'In älteren Firmen-Apps findest du überall Services mit private x$ = new BehaviorSubject(...). Das ist der Vorgänger vom Service mit Signals, den du aus dem Backoffice kennst. Lesen musst du es können, für neuen Code nimmst du oft Signals.',
      code: C`
const durchsage = new Subject<string>();
durchsage.next('Hallo?');
durchsage.subscribe(m => console.log(m));
durchsage.next('Einlass!');

const stand = new BehaviorSubject<string>('0 %');
stand.next('40 %');
stand.subscribe(s => console.log(s));
stand.value;`,
      notes: [['new Subject', 'Mikro ohne Gedächtnis.'], ["next('Hallo?')", 'Keiner hört zu: verloren.'], ["next('Einlass!')", 'Jetzt hört einer zu: kommt an.'], ["BehaviorSubject<string>('0 %')", 'Mikro mit Gedächtnis (hier: Saal-Auslastung). Braucht Startwert.'], ['stand.subscribe', 'Bekommt sofort "40 %", den letzten Stand.'], ['stand.value', 'Aktuellen Wert direkt lesen.']],
      pro: 'Subjects sind hot: eine Quelle, viele Zuhörer. In neuem Code ersetzen Signals oft das BehaviorSubject-als-Zustand. Subjects bleiben für Ereignisse. Nie das Subject öffentlich machen: asObservable(). Teilen von HTTP: shareReplay({ bufferSize: 1, refCount: true }).' }
  ],
  quiz: [{ q: 'Ein BehaviorSubject hat zuletzt <code>next(\'80 %\')</code> bekommen. Danach meldet sich ein neuer Zuhörer an. Was bekommt er sofort?', options: ['Nichts, er hört erst den nächsten Wert', 'Den Wert 80 %', 'Alle bisherigen Werte', 'Einen Fehler'], correct: 1, why: 'Ein BehaviorSubject gibt jedem neuen Zuhörer sofort den letzten Wert.' },
    { q: 'Ein normales Subject bekommt <code>next(\'A\')</code>. Erst danach meldet sich ein Zuhörer an, dann kommt <code>next(\'B\')</code>. Was hört der Zuhörer?', options: ['A und B', 'Nur B', 'Nur A', 'Nichts'], correct: 1, why: 'Ein Subject hat kein Gedächtnis. Was vor dem Anmelden gesendet wurde, ist verloren.' },
    { q: 'Ein Service hält intern <code>private stand = new BehaviorSubject(0)</code>. Was gibt er nach außen?', options: ['stand.asObservable(), damit nur der Service neue Werte schicken kann', 'Das BehaviorSubject selbst', 'Nur stand.value als Zahl', 'Ein neues Subject für jeden Zuhörer'], correct: 0, why: 'Mit asObservable() können andere nur zuhören. next() bleibt im Service, so weiß man immer, wer den Zustand ändert.' }
  ],
  ex: { id: 'ex14', title: 'Ticket-Shop', goal: 'Bau den Ticket-Warenkorb.',
    todo: ['<code>tickets</code>: <b>privates</b> <code>BehaviorSubject&lt;string[]&gt;</code>, Start <code>[]</code>', '<code>tickets$</code>: öffentlich mit <code>asObservable()</code>', '<code>anzahl$</code>: Länge', '<code>kaufen(x)</code>, <code>stornieren(x)</code> (neues Array!)', '<code>meldungen</code>: <code>Subject&lt;string&gt;</code>. kaufen schickt „X gekauft“'],
    starter: C`
import { Service } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Service()
export class TicketService {
  // private tickets
  // tickets$, anzahl$
  // meldungen

  kaufen(platz: string) {}

  stornieren(platz: string) {}
}
`,
    solution: C`
import { Service } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Service()
export class TicketService {
  private tickets = new BehaviorSubject<string[]>([]);
  readonly tickets$ = this.tickets.asObservable();
  readonly anzahl$ = this.tickets$.pipe(map(t => t.length));
  readonly meldungen = new Subject<string>();

  kaufen(platz: string) {
    this.tickets.next([...this.tickets.value, platz]);
    this.meldungen.next(\`\${platz} gekauft\`);
  }

  stornieren(platz: string) {
    this.tickets.next(this.tickets.value.filter(p => p !== platz));
  }
}
`,
    notes: [['private tickets = new BehaviorSubject', 'Der Zustand. Nur der Service ändert ihn.'], ['asObservable()', 'Nach außen nur zuhören, kein next.'], ['map(t => t.length)', 'Zählt die Tickets.'], ['new Subject<string>()', 'Für Meldungen. Kein Gedächtnis nötig.'], ['[...this.tickets.value, platz]', 'Neues Array: alte Tickets plus neues.'], ['filter(p => p !== platz)', 'Alle außer diesem.']],
    hints: ['<code>private tickets = new BehaviorSubject&lt;string[]&gt;([]);</code>', '<code>readonly tickets$ = this.tickets.asObservable();</code>', 'kaufen: <code>this.tickets.next([...this.tickets.value, platz]);</code>'],
    tests: [
      { name: 'Später Zuhörer kriegt den Stand', run: async T => { const s = T.inject(T.get('TicketService')); s.kaufen('A1'); s.kaufen('B7'); const r = await T.collect(s.tickets$, 30); T.eq(r.vals, [['A1', 'B7']], 'Wer später subscribed, soll sofort ["A1","B7"] bekommen.'); } },
      { name: 'tickets$ hat kein next', run: T => { const s = T.inject(T.get('TicketService')); T.ok(s.tickets$ && typeof s.tickets$.subscribe === 'function', 'tickets$ fehlt.'); T.ok(typeof s.tickets$.next !== 'function', 'tickets$ hat .next(). Nimm asObservable().'); T.ok(/private\s+(readonly\s+)?tickets\s*=/.test(T.code), 'tickets soll private sein.'); } },
      { name: 'anzahl$ zählt mit', run: async T => { const s = T.inject(T.get('TicketService')); const got = []; s.anzahl$.subscribe(v => got.push(v)); s.kaufen('A'); s.kaufen('B'); s.stornieren('A'); T.eq(got, [0, 1, 2, 1], 'anzahl$ soll 0, 1, 2, 1 schicken.'); } },
      { name: 'meldungen: „X gekauft“', run: T => { const s = T.inject(T.get('TicketService')); const got = []; T.ok(s.meldungen && s.meldungen.subscribe, 'meldungen fehlt.'); s.meldungen.subscribe(m => got.push(m)); s.kaufen('C3'); T.eq(got, ['C3 gekauft'], 'Falsche Meldung.'); } }
    ] },
  merke: ['Subject: Mikro, nur für Anwesende.', 'BehaviorSubject: Startwert, Neue kriegen den letzten Wert.', 'Intern privat, außen asObservable().']
});

CH.push({
  id: 'k15', akt: 3, title: 'Suche mit Tücken', tag: 'switchMap · mergeMap · concatMap · exhaustMap', xp: 180,
  doku: [['switchMap Operator', 'https://rxjs.dev/api/operators/switchMap'], ['exhaustMap Operator', 'https://rxjs.dev/api/operators/exhaustMap'], ['debounceTime Operator', 'https://rxjs.dev/api/operators/debounceTime']],
  ticket: { id: 'PW-128', typ: 'Bug', titel: 'Künstlersuche zeigt falsche Ergebnisse', text: 'Tippt man im Konzerthaus-Shop „Leon“, erscheinen manchmal die Ergebnisse für „Le“. Langsame Antworten überholen schnelle. Außerdem wird bei der Restkarten-Auktion beim Doppelklick zweimal geboten.' },
  story: [
    ['mia', 'Reproduziert: Ich tippe „Leon“ schnell, am Ende stehen die Treffer für „Le“ da.'],
    ['ricky', 'Bei Quick & Dirty nennen wir das Feature.'],
    ['toni', 'Das ist ein Senior-Bug. Vier Operatoren, die fast alle verwechseln. Wer sie kann, findet so was in Minuten.']
  ],
  slides: [
    { t: 'Was passiert mit map?', say: 'Für jede Eingabe soll eine Anfrage starten. Die Anfrage ist aber selbst ein Observable. Mit map steckst du ein Observable in ein Observable, und die Treffer kommen nie an.', job: 'Siehst du im Code ein subscribe in einem subscribe oder in der Konsole ein Observable statt Daten, ist es oft genau dieser Fehler. Die Lösung ist einer von vier Operatoren.',
      code: C`
suche$.pipe(
  map(q => api.suche(q)),
).subscribe(x => console.log(x));
// Konsole: Observable { … }   statt Treffern

suche$.pipe(
  switchMap(q => api.suche(q)),
).subscribe(x => console.log(x));
// Konsole: ['Leon', 'Lea']`,
      notes: [['map(q => api.suche(q))', 'api.suche(q) liefert keine Treffer, sondern ein Observable. map reicht es einfach weiter. Heraus kommt ein Observable im Observable: Observable<Observable<string[]>>.'], ['Observable { … }', 'Ankommt nur die Verpackung. Weil niemand das innere Observable abonniert, geht nicht einmal die Anfrage raus.'], ['switchMap(q => api.suche(q))', 'switchMap abonniert das innere Observable selbst und reicht dessen Werte weiter. Heraus kommt wieder ein einfaches Observable<string[]>.'], ["['Leon', 'Lea']", 'Jetzt kommen die Treffer an.']],
      pro: 'Darum heißen switchMap und seine drei Geschwister auch „Flattening-Operatoren“: Sie machen das Doppelte flach. Alle vier abonnieren das innere Observable. Sie unterscheiden sich nur darin, was passiert, wenn ein neuer Wert kommt, während das alte noch läuft.' },
    { t: 'Vier Arten zu verhandeln', say: 'Diese Operatoren starten für jeden Wert eine neue Anfrage. Sie unterscheiden sich darin, was mit der alten passiert.', job: 'Diese Frage kommt in fast jedem Angular-Interview: „Was ist der Unterschied zwischen switchMap und mergeMap?“ Mit diesem Bug als Beispiel kannst du es sofort erklären.',
      code: C`
switchMap(q => api.suche(q))

mergeMap(f => api.upload(f), 3)

concatMap(n => api.senden(n))

exhaustMap(() => api.bieten())`,
      notes: [['switchMap', 'Neues Angebot? Altes zurückziehen (abbrechen). Für Suchen.'], ['mergeMap', 'Alle Angebote parallel. Max. 3 gleichzeitig. Für Uploads.'], ['concatMap', 'Ein Angebot nach dem anderen, in Reihenfolge. Für Chat, Speichern.'], ['exhaustMap', 'Läuft schon ein Angebot? Neue ignorieren. Gegen Doppelklick.']],
      pro: 'switchMap nie für POST/DELETE: abgebrochen heißt nicht, dass der Server es nicht bekommen hat. Fehler INNEN fangen: switchMap(q => api(q).pipe(catchError(() => of([])))). Sonst stirbt der ganze Stream.' },
    { t: 'Welcher Operator? Frag nach der alten Anfrage', say: 'Ein neuer Wert kommt, aber die alte Anfrage läuft noch. Was soll mit ihr passieren? Die Antwort auf diese eine Frage entscheidet.', job: 'Nimmt jemand im PR switchMap für alles, stell genau diese Frage. Meist ist die Antwort in einer Minute klar.',
      punkte: [['Abbrechen → switchMap', 'Nur das Neueste zählt. Für Lesen: Live-Suche, Filter, Tab wechseln. Abbrechen stoppt nur das Warten im Browser. Beim Server kann die alte Anfrage schon angekommen sein.', ''], ['Parallel → mergeMap', 'Alle laufen gleichzeitig, die Reihenfolge der Antworten ist egal. Zum Beispiel viele Dateien hochladen.', ''], ['Anstellen → concatMap', 'Eine nach der anderen, in der Reihenfolge der Werte. Speichern, Chat-Nachrichten.', ''], ['Ignorieren → exhaustMap', 'Solange eine läuft, zählen neue Werte nicht. Bezahlen, Login, Bieten.', '']],
      pro: 'mergeMap ohne Grenze startet beliebig viele Anfragen auf einmal. Mit der zweiten Zahl, z. B. mergeMap(f => api.upload(f), 3), sind höchstens drei gleichzeitig unterwegs.' },
    { t: 'Die perfekte Live-Suche', say: 'Warten, säubern, keine Duplikate, alte abbrechen.', job: 'Jede Suchleiste in einer Firmen-App hat genau diese Kette: debounceTime, distinctUntilChanged, switchMap. Fehlt eins davon, gibt es zu viele Anfragen oder falsche Ergebnisse.',
      code: C`
suche$.pipe(
  debounceTime(300),
  map(q => q.trim()),
  distinctUntilChanged(),
  filter(q => q.length >= 2),
  switchMap(q => api.suche(q)),
);`,
      notes: [['debounceTime(300)', 'Erst feuern, wenn 300 ms nicht getippt wurde.'], ['trim()', 'Leerzeichen vorne/hinten weg.'], ['distinctUntilChanged()', 'Gleiche Suche nicht nochmal.'], ['length >= 2', 'Erst ab 2 Zeichen.'], ['switchMap', 'Neue Suche bricht alte ab. Keine Race Condition.']],
      pro: 'Race Condition: Die alte Antwort kommt nach der neuen an und überschreibt sie. switchMap verhindert das. In Signal-Welt erledigen rxResource/httpResource das für dich.' }
  ],
  quiz: [
    { q: 'Jemand klickt fünfmal schnell hintereinander auf „Angebot abschicken“. Welcher Operator sorgt dafür, dass nur ein Angebot abgeschickt wird?', options: ['switchMap', 'mergeMap', 'concatMap', 'exhaustMap'], correct: 3, why: 'exhaustMap ignoriert neue Klicks, solange die erste Anfrage noch läuft.' },
    { q: 'Bei einer Live-Suche tippt der Nutzer weiter, während die letzte Anfrage noch läuft. Welcher Operator passt, damit nur die neueste Suche zählt?', options: ['switchMap', 'mergeMap', 'concatMap', 'exhaustMap'], correct: 0, why: 'Bei switchMap zählt nur die neueste Suche. Die alte Anfrage wird abgebrochen.' },
    { q: 'Ein Nutzer klickt fünfmal auf „Speichern“. Jede Speicherung soll beim Server ankommen, und zwar in der Reihenfolge der Klicks. Welcher Operator passt?', options: ['switchMap', 'mergeMap', 'concatMap', 'exhaustMap'], correct: 2, why: 'concatMap stellt die Anfragen an: Die nächste startet erst, wenn die vorige fertig ist. mergeMap schickt alle gleichzeitig, dann kann die Reihenfolge durcheinanderkommen. switchMap und exhaustMap verlieren Speicherungen.' },
    { q: 'Beim Knopf „Bezahlen“ steht switchMap statt exhaustMap. Was kann bei einem Doppelklick passieren?', options: ['Nichts, switchMap bricht die erste Zahlung sicher ab', 'Zwei Zahlungen: Der Server kann beide Anfragen bekommen, der Browser wartet nur auf die zweite Antwort', 'Angular verhindert doppelte Klicks von selbst', 'Die App stürzt ab'], correct: 1, why: 'switchMap bricht nur das Warten im Browser ab. Die erste Anfrage kann beim Server schon angekommen sein. exhaustMap ignoriert den zweiten Klick, solange die erste Zahlung läuft.' },
    { q: 'Was kommt bei <code>suche$.pipe(map(q =&gt; api.suche(q)))</code> beim Abonnenten an, wenn api.suche ein Observable zurückgibt?', options: ['Die Trefferliste', 'Ein Observable statt der Treffer, und die Anfrage startet nicht einmal', 'Ein Fehler in der Konsole', 'Nur der letzte Treffer'], correct: 1, why: 'map reicht das innere Observable einfach weiter. Niemand abonniert es, also läuft auch keine Anfrage. switchMap, mergeMap, concatMap oder exhaustMap abonnieren es und reichen die Treffer weiter.' }
  ],
  ex: { id: 'ex15', title: 'Suche reparieren', goal: 'Bau die Suche und den Bieten-Knopf.',
    todo: ['<code>liveSuche(eingabe$, api)</code>: 300 ms warten, trim, keine Duplikate, ab 2 Zeichen, alte Anfrage abbrechen', '<code>bieten(klicks$, api)</code>: pro Klick <code>api()</code>, aber Klicks ignorieren, solange ein Angebot läuft'],
    starter: C`
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, exhaustMap } from 'rxjs/operators';

export function liveSuche(
  eingabe$: Observable<string>,
  api: (q: string) => Observable<string[]>
): Observable<string[]> {
  return eingabe$.pipe(
    // deine Operatoren
  ) as any;
}

export function bieten(
  klicks$: Observable<void>,
  api: () => Observable<string>
): Observable<string> {
  return klicks$.pipe(
    // dein Operator
  ) as any;
}
`,
    solution: C`
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, exhaustMap } from 'rxjs/operators';

export function liveSuche(
  eingabe$: Observable<string>,
  api: (q: string) => Observable<string[]>
): Observable<string[]> {
  return eingabe$.pipe(
    debounceTime(300),
    map(q => q.trim()),
    distinctUntilChanged(),
    filter(q => q.length >= 2),
    switchMap(q => api(q)),
  );
}

export function bieten(
  klicks$: Observable<void>,
  api: () => Observable<string>
): Observable<string> {
  return klicks$.pipe(
    exhaustMap(() => api()),
  );
}
`,
    notes: [['debounceTime(300)', 'Ruhe abwarten.'], ['map(q => q.trim())', 'Leerzeichen weg.'], ['distinctUntilChanged()', 'Nur wenn sich die Suche geändert hat.'], ['filter(q => q.length >= 2)', 'Zu kurz? Nichts tun.'], ['switchMap(q => api(q))', 'Anfrage starten, alte abbrechen.'], ['exhaustMap(() => api())', 'Erst wenn das Angebot fertig ist, zählen neue Klicks.']],
    hints: ['Reihenfolge: debounceTime(300), map(trim), distinctUntilChanged(), filter(Länge), switchMap(api)', '<code>map(q =&gt; q.trim())</code>', 'bieten: <code>exhaustMap(() =&gt; api())</code>'],
    tests: [
      { name: 'Schnelles Tippen = eine Anfrage', run: async T => { const s = new T.rx.Subject(); const calls = []; const api = q => { calls.push(q); return T.rx.of(['Treffer ' + q]); }; const got = []; T.get('liveSuche')(s, api).subscribe(v => got.push(v)); s.next('L'); s.next('Le'); s.next('Leo'); await T.flush(400); T.eq(calls, ['Leo'], 'Bei schnellem Tippen soll nur EINE Anfrage für "Leo" rausgehen (debounceTime 300).'); T.eq(got, [['Treffer Leo']], 'Das Ergebnis kommt nicht an.'); } },
      { name: 'Zu kurz, Leerzeichen, Duplikate', run: async T => { const s = new T.rx.Subject(); const calls = []; const api = q => { calls.push(q); return T.rx.of([]); }; T.get('liveSuche')(s, api).subscribe(); s.next('a'); await T.flush(350); s.next('Mo'); await T.flush(350); s.next('  Mo '); await T.flush(350); T.eq(calls, ['Mo'], 'Nur eine Anfrage "Mo". "a" ist zu kurz, "  Mo " ist nach trim gleich.'); } },
      { name: 'Alte Anfrage wird abgebrochen', run: async T => { const s = new T.rx.Subject(); const api = q => T.rx.timer(500).pipe(T.op.map(() => ['Ergebnis ' + q])); const got = []; T.get('liveSuche')(s, api).subscribe(v => got.push(v)); s.next('Leon'); await T.flush(350); s.next('Mo'); await T.flush(1000); T.eq(got, [['Ergebnis Mo']], 'Das alte Ergebnis für "Leon" kam auch. Nimm switchMap.'); } },
      { name: 'bieten ignoriert Doppelklicks', run: async T => { const k = new T.rx.Subject(); let calls = 0; const api = () => { calls++; return T.rx.timer(100).pipe(T.op.map(() => 'ok')); }; const got = []; T.get('bieten')(k, api).subscribe(v => got.push(v)); k.next(); k.next(); k.next(); await T.flush(150); k.next(); await T.flush(150); T.eq(calls, 2, '3 schnelle Klicks = 1 Angebot, späterer Klick = 2. Nimm exhaustMap.'); T.eq(got, ['ok', 'ok'], 'Ergebnisse stimmen nicht.'); } }
    ] },
  merke: ['map mit einer Anfrage ergibt ein Observable im Observable. Die vier …Map-Operatoren machen es flach.', 'switchMap: neu bricht alt ab (Suche).', 'concatMap: der Reihe nach. mergeMap: parallel.', 'exhaustMap: ignorieren, solange beschäftigt (Submit).', 'debounceTime + distinctUntilChanged = Live-Suche.']
});

CH.push({
  id: 'k16', akt: 3, title: 'Daten vom Backend', tag: 'HttpClient · toSignal', xp: 150,
  doku: [['HTTP-Anfragen mit HttpClient', 'https://angular.dev/guide/http/making-requests'], ['Observables und Signals verbinden (toSignal)', 'https://angular.dev/ecosystem/rxjs-interop'], ['Reaktiv laden mit httpResource', 'https://angular.dev/guide/http/http-resource']],
  ticket: { id: 'PW-129', typ: 'Feature', titel: 'Team vom Server laden', text: 'Statt der festen Liste soll das Team von /api/entwickler kommen. Bis die Antwort da ist, eine leere Liste zeigen.' },
  story: [
    ['jonas', 'GET /api/entwickler ist fertig. Liefert ein Array mit id, name, position.'],
    ['toni', 'HttpClient holt die Daten als Observable. Unser Template mag Signals. Wir bauen eine Brücke: toSignal.']
  ],
  slides: [
    { t: 'HttpClient + toSignal', say: 'HttpClient holt Daten. toSignal macht daraus ein Signal.', job: 'In Firmen ruft die Komponente nie direkt http.get auf. Das macht ein Service (z. B. EntwicklerApi). Die Komponente fragt den Service. So kann man das Backend im Test leicht ersetzen.',
      code: C`
@Service()
export class EntwicklerApi {
  private http = inject(HttpClient);
  alle() {
    return this.http.get<Entwickler[]>('/api/entwickler');
  }
}

export class Team {
  private api = inject(EntwicklerApi);
  entwickler = toSignal(this.api.alle(), { initialValue: [] });
}`,
      notes: [['inject(HttpClient)', 'Werkzeug für Server-Anfragen holen.'], ["http.get<Entwickler[]>('/api/entwickler')", 'GET-Anfrage. Erwartet eine Entwickler-Liste. Gibt ein Observable zurück.'], ['toSignal(', 'Abonniert automatisch und legt den Wert in ein Signal.'], ['initialValue: []', 'Bis die Antwort da ist: leere Liste.']],
      pro: 'toSignal räumt selbst auf, wenn die Komponente verschwindet. HttpClient kannst du seit Angular 21 ohne Einrichtung injizieren, provideHttpClient(...) brauchst du nur für Extras wie Interceptors. In älterem Code steht statt toSignal oft entwickler$ | async im Template.' },
    { t: 'Neu: httpResource lädt von selbst neu', say: 'httpResource liest Signals in der Adresse. Ändert sich eins davon, lädt es von selbst neu. Lade-Zustand und Fehler bekommst du gleich mit.', job: 'Detailseiten wie „Entwickler 7“ sind der typische Fall: Die id kommt aus der Route oder einer Auswahl, und die Daten sollen jedes Mal passend nachladen.',
      code: C`
id = signal(7);
profil = httpResource<Entwickler>(() => '/api/entwickler/' + this.id());

// Template
@if (profil.hasValue()) {
  <h2>{{ profil.value().name }}</h2>
}`,
      notes: [['id = signal(7)', 'Die Auswahl als Signal.'], ['httpResource<Entwickler>', 'Lädt per GET und legt das Ergebnis in Signals ab.'], ["'/api/entwickler/' + this.id()", 'Liest id(). Ändert sich id, geht die Anfrage neu raus.'], ['profil.hasValue()', 'Sind Daten da? Dazu gibt es isLoading() und error().'], ['profil.value().name', 'Die Daten selbst lesen.']],
      pro: 'Mit toSignal(http.get(...)) geht das nicht: Die Adresse wird nur einmal beim Anlegen gebaut. resource und httpResource genauer kommen im Profi-Handwerk.' }
  ],
  quiz: [{ q: 'Gegeben ist <code>entwickler = toSignal(http.get(...), { initialValue: [] })</code>. Welchen Wert hat <code>entwickler()</code> direkt danach, bevor der Server geantwortet hat?', options: ['undefined', 'Das leere Array [], den Startwert', 'Die Daten vom Server', 'Der Aufruf wirft einen Fehler'], correct: 1, why: 'Die Antwort vom Server kommt später. Bis dahin gilt der Wert aus initialValue.' },
    { q: 'Gegeben ist <code>alle() { return this.http.get(\'/api/entwickler\'); }</code>. Wann geht die Anfrage an den Server?', options: ['Sofort beim Aufruf von alle()', 'Beim Start der App', 'Nur, wenn man zusätzlich fetch aufruft', 'Erst, wenn jemand das Observable abonniert, etwa per toSignal'], correct: 3, why: 'HttpClient liefert cold Observables. Ohne subscribe passiert nichts, und jedes neue Abo schickt eine neue Anfrage.' },
    { q: 'Die Daten eines Entwicklers sollen neu laden, sobald sich das Signal <code>id</code> ändert. Was passt in Angular 22 am besten?', options: ['toSignal(http.get(\'/api/entwickler/\' + id()))', 'Ein effect, der bei jeder Änderung neu subscribe aufruft', 'httpResource(() => \'/api/entwickler/\' + id())', 'Ein setInterval, das jede Sekunde lädt'], correct: 2, why: 'httpResource liest id() und lädt neu, sobald sich id ändert. toSignal mit http.get liest id nur ein einziges Mal beim Anlegen.' }
  ],
  ex: { id: 'ex16', title: 'Team vom Server', goal: 'Lade das Team vom Server.', preview: 'Team', backend: 'entwickler',
    todo: ['<code>EntwicklerApi</code> holt <code>HttpClient</code> mit inject', '<code>alle()</code> gibt <code>http.get(\'/api/entwickler\')</code> zurück', '<code>Team</code>: <code>entwickler = toSignal(..., { initialValue: [] })</code>', 'Ein <code>&lt;li&gt;</code> pro Entwickler. Solange leer: <code>&lt;p class="laden"&gt;Lade…&lt;/p&gt;</code>', '<code>anzahlFrontend</code>: computed, zählt position „Frontend“'],
    starter: C`
import { Component, Service, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

interface Entwickler { id: number; name: string; position: string; }

@Service()
export class EntwicklerApi {
  // http holen, alle() bauen
}

@Component({
  selector: 'app-team',
  template: \`
    <!-- Lade-Text und Liste -->
  \`,
})
export class Team {
  // api, entwickler, anzahlFrontend
}
`,
    solution: C`
import { Component, Service, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

interface Entwickler { id: number; name: string; position: string; }

@Service()
export class EntwicklerApi {
  private http = inject(HttpClient);
  alle() {
    return this.http.get<Entwickler[]>('/api/entwickler');
  }
}

@Component({
  selector: 'app-team',
  template: \`
    @if (entwickler().length === 0) {
      <p class="laden">Lade…</p>
    }
    <ul>
      @for (s of entwickler(); track s.id) {
        <li>{{ s.name }}</li>
      }
    </ul>
    <p>{{ anzahlFrontend() }} im Frontend</p>
  \`,
})
export class Team {
  private api = inject(EntwicklerApi);
  entwickler = toSignal(this.api.alle(), { initialValue: [] as Entwickler[] });
  anzahlFrontend = computed(() => this.entwickler().filter(s => s.position === 'Frontend').length);
}
`,
    notes: [['private http = inject(HttpClient)', 'Werkzeug holen.'], ["this.http.get<Entwickler[]>('/api/entwickler')", 'Anfrage. Läuft erst, wenn jemand abonniert.'], ['entwickler().length === 0', 'Noch nichts da? Lade-Text.'], ['toSignal(this.api.alle()', 'Abonniert die Anfrage. Ergebnis landet im Signal.'], ['as Entwickler[]', 'Sagt TypeScript, dass die leere Liste Entwickler enthalten wird.'], ["filter(s => s.position === 'Frontend').length", 'Nur Frontend, dann zählen.']],
    hints: ['In EntwicklerApi: <code>private http = inject(HttpClient);</code>', '<code>entwickler = toSignal(this.api.alle(), { initialValue: [] as Entwickler[] });</code>', '<code>@if (entwickler().length === 0) { &lt;p class="laden"&gt;Lade…&lt;/p&gt; }</code>'],
    tests: [
      { name: 'alle() fragt /api/entwickler an', run: async T => { const api = T.inject(T.get('EntwicklerApi')); const r = await T.collect(api.alle(), 200); T.ok(T.ng.backend.calls.some(c => c.url === '/api/entwickler' && c.method === 'GET'), 'Keine GET-Anfrage an /api/entwickler.'); T.eq(r.vals[0].length, 4, 'alle() soll 4 Entwickler liefern.'); } },
      { name: 'Erst „Lade…“, dann Liste', run: async T => { const f = T.mount(T.cmp('Team')); T.ok(f.q('p.laden'), 'Am Anfang soll <p class="laden"> da sein.'); await T.flush(100); T.ok(!f.q('p.laden'), 'Nach dem Laden soll p.laden weg sein.'); T.eq(f.qa('li').map(l => l.textContent.trim()), ['Leon', 'Mo', 'Ben', 'Tim'], 'Die Liste zeigt nicht die 4 Entwickler.'); } },
      { name: 'toSignal benutzt', run: T => T.ok(/toSignal\s*\(/.test(T.code), 'Nimm toSignal(...) als Brücke.') },
      { name: 'anzahlFrontend zählt', run: async T => { const f = T.mount(T.cmp('Team')); await T.flush(100); T.ok(T.isComputed(f.instance.anzahlFrontend), 'anzahlFrontend soll computed sein.'); T.eq(f.instance.anzahlFrontend(), 2, 'Es gibt 2 Frontend-Devs.'); } }
    ] },
  merke: ['HttpClient gibt cold Observables.', 'toSignal(obs$, { initialValue }) = Brücke, räumt selbst auf.', 'httpResource() für reaktives Laden.']
});

CH.push({
  id: 'k17', akt: 3, title: 'Wenn das WLAN streikt', tag: 'catchError · retry · takeUntilDestroyed', xp: 160,
  doku: [['catchError: Fehler abfangen', 'https://rxjs.dev/api/operators/catchError'], ['retry: Anfrage wiederholen', 'https://rxjs.dev/api/operators/retry'], ['Abos beenden mit takeUntilDestroyed', 'https://angular.dev/ecosystem/rxjs-interop/take-until-destroyed']],
  ticket: { id: 'PW-130', typ: 'Incident', titel: 'Weiße Seite bei schlechtem Netz', text: 'Im WLAN vom Konzertsaal schlägt die Anfrage fehl und die App bleibt weiß. Außerdem laufen Abos weiter, wenn man die Seite verlässt.' },
  story: [
    ['erz', 'Premiere im Konzerthaus. Das Saal-WLAN bricht ständig weg. Der Support-Kanal läuft voll.'],
    ['boss', 'Die App zeigt nur noch weiß!'],
    ['toni', 'Ein Fehler beendet den Stream für immer, und niemand fängt ihn. Wir brauchen einen Plan B. Und wir räumen hinter uns auf.']
  ],
  slides: [
    { t: 'retry und catchError', say: 'retry: nochmal versuchen. catchError: Plan B liefern.', job: 'Du kennst es aus dem HTTP-Kapitel: Nur idempotente Anfragen wie GET darfst du mit retry wiederholen. POST (z. B. Ticket kaufen) nicht blind, sonst kauft der Besucher zwei Tickets.',
      code: C`
this.http.get<Entwickler[]>('/api/entwickler').pipe(
  retry(2),
  catchError(err => {
    this.fehler.set('Server weg');
    return of([]);
  }),
);`,
      notes: [['retry(2)', 'Bei Fehler bis zu 2-mal neu versuchen.'], ['catchError(err =>', 'Fängt den Fehler, wenn alle Versuche scheitern.'], ["fehler.set('Server weg')", 'Dem Nutzer was Nettes zeigen.'], ['return of([])', 'Plan B: ein neues Observable mit leerer Liste.']],
      pro: 'Position zählt: catchError am Ende fängt alles, aber der Stream ist danach fertig. In switchMap INNEN fangen. Backoff: retry({ count: 3, delay: (e, i) => timer(2 ** i * 500) }). 4xx nicht retryen (außer 408/429).' },
    { t: 'takeUntilDestroyed', say: 'Abo endet automatisch, wenn der Baustein verschwindet.', job: 'Vergessene Abos sind die häufigste Ursache für Speicherlecks in Angular-Apps. Im Review schaust du bei jedem subscribe(): Wer beendet das wieder?',
      code: C`
export class Stoppuhr {
  sekunde = signal(0);
  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.sekunde.update(s => s + 1));
  }
}`,
      notes: [['interval(1000)', 'Hört nie von selbst auf.'], ['takeUntilDestroyed()', 'Stoppt, wenn die Komponente zerstört wird. Nur im Konstruktor/Feld.'], ['subscribe', 'Manuelles Abo, aber sicher.']],
      pro: 'Rangliste gegen Leaks: 1. gar nicht manuell subscriben (toSignal, async). 2. takeUntilDestroyed. 3. Alter Stil: destroy$ = new Subject() + takeUntil + ngOnDestroy.' }
  ],
  quiz: [{ q: 'Was passiert mit einem Observable, nachdem es einen error gemeldet hat?', options: ['Es macht mit dem nächsten Wert weiter', 'Es ist für immer beendet', 'Es startet von selbst neu', 'Es wartet, bis der Fehler behoben ist'], correct: 1, why: 'error und complete beenden den Stream. Darum brauchst du retry oder catchError.' },
    { q: 'Ein Stream hat <code>retry(2)</code>, und der Server ist dauerhaft weg. Wie oft geht die Anfrage insgesamt raus?', options: ['2-mal', '3-mal: einmal und 2 neue Versuche', '1-mal', 'Endlos'], correct: 1, why: 'retry(2) heißt: nach dem ersten Fehler noch bis zu zwei weitere Versuche. Danach geht der Fehler weiter, etwa an catchError.' },
    { q: 'Was muss die Funktion in <code>catchError(err =&gt; …)</code> zurückgeben?', options: ['Ein neues Observable, etwa of([]) als Plan B', 'Nichts, sie loggt nur', 'true oder false', 'Den Fehler als Text'], correct: 0, why: 'catchError ersetzt den kaputten Stream durch einen neuen. Darum gibt man ein Observable zurück, oft of(...) mit einem Ersatzwert.' }
  ],
  ex: { id: 'ex17', title: 'Stabile App', goal: 'Mach die App robust.', preview: 'Stoppuhr', backend: 'wackelig',
    todo: ['<code>ladeSicher(http)</code>: holt <code>/api/entwickler</code>, <b>2 Wiederholungen</b> bei Fehler, sonst <b>leere Liste</b>. Der Test-Server scheitert die ersten 2 Mal.', '<code>Stoppuhr</code>: zählt mit <code>interval(20)</code> das Signal <code>ticks</code> hoch und stoppt mit <code>takeUntilDestroyed()</code>'],
    starter: C`
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, interval, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

export function ladeSicher(http: HttpClient): Observable<unknown[]> {
  return http.get<unknown[]>('/api/entwickler'); // retry + catchError
}

@Component({
  selector: 'app-stoppuhr',
  template: \`<p>⏱ {{ ticks() }}</p>\`,
})
export class Stoppuhr {
  ticks = signal(0);

  constructor() {
    // interval(20) ... takeUntilDestroyed ... subscribe
  }
}
`,
    solution: C`
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, interval, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

export function ladeSicher(http: HttpClient): Observable<unknown[]> {
  return http.get<unknown[]>('/api/entwickler').pipe(
    retry(2),
    catchError(() => of([])),
  );
}

@Component({
  selector: 'app-stoppuhr',
  template: \`<p>⏱ {{ ticks() }}</p>\`,
})
export class Stoppuhr {
  ticks = signal(0);

  constructor() {
    interval(20)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.ticks.update(t => t + 1));
  }
}
`,
    notes: [['retry(2)', 'Zuerst nochmal versuchen …'], ['catchError(() => of([]))', '… erst danach Plan B. Andersrum würde retry nie greifen.'], ['interval(20)', 'Alle 20 ms ein Wert.'], ['takeUntilDestroyed()', 'Stoppt automatisch beim Zerstören.'], ['ticks.update(t => t + 1)', 'Bei jedem Tick +1.']],
    hints: ['<code>.pipe(retry(2), catchError(() =&gt; of([])))</code>. Reihenfolge wichtig!', 'Konstruktor: <code>interval(20).pipe(takeUntilDestroyed()).subscribe(() =&gt; this.ticks.update(t =&gt; t + 1));</code>'],
    tests: [
      { name: 'Nach 2 Fehlern klappt Versuch 3', run: async T => { T.ng.backend.failTimes = 2; const http = T.inject(T.ng.modules['@angular/common/http'].HttpClient); const r = await T.collect(T.get('ladeSicher')(http), 400); T.eq(T.ng.backend.calls.length, 3, 'Es sollen 3 Anfragen sein (1 + 2 Wiederholungen).'); T.eq(r.vals.length, 1, 'Genau ein Ergebnis.'); T.eq(r.vals[0].length, 4, 'Versuch 3 liefert 4 Entwickler.'); } },
      { name: 'Immer Fehler = leere Liste', run: async T => { T.ng.backend.failTimes = 99; const http = T.inject(T.ng.modules['@angular/common/http'].HttpClient); const r = await T.collect(T.get('ladeSicher')(http), 400); T.ok(!r.error, 'Der Fehler kam durch. Fang ihn mit catchError.'); T.eq(r.vals, [[]], 'Bei Dauerfehler soll [] kommen.'); T.ok(r.complete, 'Danach complete.'); T.eq(T.ng.backend.calls.length, 3, 'Genau 3 Versuche.'); } },
      { name: 'Stoppuhr tickt', run: async T => { const f = T.mount(T.cmp('Stoppuhr')); await T.flush(90); T.ok(f.instance.ticks() >= 2, 'Nach ~90 ms soll ticks mindestens 2 sein.'); } },
      { name: 'Stoppuhr stoppt beim Zerstören', run: async T => { const f = T.mount(T.cmp('Stoppuhr')); await T.flush(50); f.destroy(); const v = f.instance.ticks(); await T.flush(80); T.eq(f.instance.ticks(), v, 'Nach dem Zerstören läuft die Uhr weiter: Memory-Leak! Nimm takeUntilDestroyed().'); T.ok(/takeUntilDestroyed\s*\(/.test(T.code), 'Benutze takeUntilDestroyed().'); } }
    ] },
  merke: ['error beendet den Stream.', 'retry = nochmal, catchError = Plan B.', 'Keine Leaks: toSignal, sonst takeUntilDestroyed.']
});

CH.push({
  id: 'k18', akt: 3, title: 'Das Projekt-Dashboard', tag: 'combineLatest · forkJoin · scan', xp: 170,
  doku: [['combineLatest: neueste Werte kombinieren', 'https://rxjs.dev/api/index/function/combineLatest'], ['forkJoin: parallel auf alle warten', 'https://rxjs.dev/api/index/function/forkJoin'], ['scan: laufender Zustand', 'https://rxjs.dev/api/operators/scan']],
  ticket: { id: 'PW-131', typ: 'Feature', titel: 'Dashboard mit Filtern', text: 'Sara will das Projektteam nach Name UND Rolle gleichzeitig filtern. Oben stehen die gebuchten Stunden live. Team und Stunden werden parallel geladen.' },
  story: [
    ['sara', 'Das Dashboard braucht zwei Filter, die zusammen wirken. Und es soll schnell laden.'],
    ['toni', 'Mehrere Streams zu einem. Drei Operatoren, drei Aufgaben. Danach ist das Dashboard ein Einzeiler.']
  ],
  slides: [
    { t: 'Streams kombinieren', say: 'combineLatest, forkJoin und scan verbinden Werte.', job: 'forkJoin siehst du beim Seitenstart, wenn mehrere Anfragen parallel laufen sollen. Achtung: Schlägt eine fehl, schlägt alles fehl. Darum oft mit catchError pro Anfrage.',
      code: C`
combineLatest([entwickler$, suche$, position$]).pipe(
  map(([entwickler, suche, pos]) =>
    entwickler.filter(s => s.name.includes(suche) && s.position === pos)),
);

forkJoin({ entwickler: api.entwickler(), stunden: api.stunden() });

stunden$.pipe(scan((summe, t) => summe + t, 0));`,
      notes: [['combineLatest([', 'Bei jeder Änderung irgendeiner Quelle: neuester Wert von allen.'], ['map(([entwickler, suche, pos])', 'Bekommt ein Array mit allen drei Werten. Die eckigen Klammern in den runden packen es gleich aus (Destrukturierung): entwickler ist der erste Wert, suche der zweite, pos der dritte.'], ['forkJoin({', 'Startet alle parallel. EIN Ergebnis, wenn alle fertig sind.'], ['scan(', 'Laufende Summe: summe ist der Stand bisher, t der neue Wert, 0 der Startwert. Bei 2, 1, 3 kommt 2 → 3 → 6.']],
      pro: 'combineLatest feuert erst, wenn JEDE Quelle einmal gesendet hat (oft startWith nötig). forkJoin braucht Quellen, die completen (HTTP ja, interval nie). In Signal-Welt ist combineLatest oft einfach ein computed(). scan ist das Herz von NgRx-Reducern.' }
  ],
  quiz: [{ q: 'Was liefert <code>forkJoin([interval(1000), http.get(...)])</code>?', options: ['Jede Sekunde einen Wert', 'Nie einen Wert, denn interval wird nie fertig', 'Sofort einen Wert', 'Einen Fehler'], correct: 1, why: 'forkJoin wartet, bis alle Observables complete melden. interval läuft aber endlos.' },
    { q: 'combineLatest hat drei Quellen. Zwei haben schon gesendet, die dritte noch nie. Was kommt raus?', options: ['Ein Array mit undefined an dritter Stelle', 'Die zwei Werte, die schon da sind', 'Sofort ein Fehler', 'Noch nichts, combineLatest wartet, bis jede Quelle einmal gesendet hat'], correct: 3, why: 'combineLatest braucht von jeder Quelle einen Wert. Deshalb hängt man oft startWith(...) an Quellen, die spät kommen.' },
    { q: 'Was liefert <code>of(2, 1, 3).pipe(scan((summe, x) =&gt; summe + x, 0))</code>?', options: ['6', '0, 2, 3, 6', '2, 3, 6', '2, 1, 3'], correct: 2, why: 'scan gibt nach jedem Wert den laufenden Stand aus: 0 + 2 = 2, dann 3, dann 6. Den Startwert 0 selbst gibt es nicht aus.' }
  ],
  ex: { id: 'ex18', title: 'Dashboard', goal: 'Bau drei Teile fürs Dashboard: den Filter, den Stundenzähler und das parallele Laden.',
    todo: ['<code>gefiltert(entwickler$, suche$, position$)</code>: mit <code>combineLatest</code>. Name enthält Suche (Groß/Klein egal), position passt oder ist <code>\'alle\'</code>', '<code>stundenSumme(stunden$)</code>: laufende Summe mit <code>scan</code>, Start 0', '<code>dashboard(api)</code>: <code>forkJoin</code> von <code>api.entwickler()</code> und <code>api.stunden()</code> → <code>{ anzahlEntwickler, summe }</code>'],
    starter: C`
import { Observable, combineLatest, forkJoin } from 'rxjs';
import { map, scan } from 'rxjs/operators';

interface Entwickler { name: string; position: string; }

export function gefiltert(entwickler$: Observable<Entwickler[]>, suche$: Observable<string>, position$: Observable<string>): Observable<Entwickler[]> {
  return entwickler$; // combineLatest
}

export function stundenSumme(stunden$: Observable<number>): Observable<number> {
  return stunden$; // scan
}

export function dashboard(api: { entwickler(): Observable<Entwickler[]>; stunden(): Observable<number[]> }): Observable<{ anzahlEntwickler: number; summe: number }> {
  return null as any; // forkJoin
}
`,
    solution: C`
import { Observable, combineLatest, forkJoin } from 'rxjs';
import { map, scan } from 'rxjs/operators';

interface Entwickler { name: string; position: string; }

export function gefiltert(entwickler$: Observable<Entwickler[]>, suche$: Observable<string>, position$: Observable<string>): Observable<Entwickler[]> {
  return combineLatest([entwickler$, suche$, position$]).pipe(
    map(([entwickler, suche, pos]) =>
      entwickler.filter(s =>
        s.name.toLowerCase().includes(suche.toLowerCase()) &&
        (pos === 'alle' || s.position === pos))),
  );
}

export function stundenSumme(stunden$: Observable<number>): Observable<number> {
  return stunden$.pipe(scan((summe, t) => summe + t, 0));
}

export function dashboard(api: { entwickler(): Observable<Entwickler[]>; stunden(): Observable<number[]> }): Observable<{ anzahlEntwickler: number; summe: number }> {
  return forkJoin({ entwickler: api.entwickler(), stunden: api.stunden() }).pipe(
    map(({ entwickler, stunden }) => ({
      anzahlEntwickler: entwickler.length,
      summe: stunden.reduce((a, b) => a + b, 0),
    })),
  );
}
`,
    notes: [['combineLatest([entwickler$, suche$, position$])', 'Drei Quellen zu einer.'], ['toLowerCase().includes', 'Beide klein machen, dann vergleichen. So ist Groß/Klein egal.'], ["pos === 'alle' ||", 'Bei „alle“ passt jede Position.'], ['scan((summe, t) => summe + t, 0)', 'Start 0, jede Buchung kommt dazu.'], ['forkJoin({', 'Beide Anfragen parallel.'], ['map(({ entwickler, stunden }) => ({', 'Zweimal Klammern mit Sinn: ({ entwickler, stunden }) holt die zwei Eigenschaften aus dem Ergebnis-Objekt (Destrukturierung). => ({ … }) mit runden Klammern gibt direkt ein neues Objekt zurück. Ohne sie hielte JavaScript die { für den Anfang eines Funktionskörpers.'], ['reduce((a, b) => a + b, 0)', 'reduce rechnet ein Array zu einem Wert zusammen. a ist die Summe bisher, b der nächste Eintrag, 0 der Startwert. Bei [2, 1, 3]: 0 + 2, dann + 1, dann + 3 = 6.']],
    hints: ['<code>combineLatest([entwickler$, suche$, position$]).pipe(map(([entwickler, suche, pos]) =&gt; …))</code>', 'Groß/Klein egal: beide Seiten <code>.toLowerCase()</code>', '<code>scan((summe, t) =&gt; summe + t, 0)</code>', '<code>forkJoin({ entwickler: api.entwickler(), stunden: api.stunden() }).pipe(map(…))</code>'],
    tests: [
      { name: 'Filter reagiert auf Suche und Position', run: async T => { const sp = new T.rx.BehaviorSubject([{ name: 'Leon', position: 'Frontend' }, { name: 'Mo', position: 'Backend' }, { name: 'Lea', position: 'Backend' }]); const suche = new T.rx.BehaviorSubject(''); const pos = new T.rx.BehaviorSubject('alle'); const got = []; T.get('gefiltert')(sp, suche, pos).subscribe(v => got.push(v.map(s => s.name))); suche.next('le'); pos.next('Backend'); T.eq(got, [['Leon', 'Mo', 'Lea'], ['Leon', 'Lea'], ['Lea']], 'Erwartet: erst alle, dann „le“ (Leon, Lea), dann nur Backend (Lea).'); } },
      { name: 'Filter reagiert auf neue Entwickler', run: async T => { const sp = new T.rx.BehaviorSubject([{ name: 'Leon', position: 'Frontend' }]); const got = []; T.get('gefiltert')(sp, new T.rx.BehaviorSubject(''), new T.rx.BehaviorSubject('Frontend')).subscribe(v => got.push(v.length)); sp.next([{ name: 'Leon', position: 'Frontend' }, { name: 'Ben', position: 'Frontend' }]); T.eq(got, [1, 2], 'Bei neuen Entwicklern soll neu gefiltert werden.'); } },
      { name: 'stundenSumme zählt mit', run: async T => { const r = await T.collect(T.get('stundenSumme')(T.rx.from([2, 1, 3]))); T.eq(r.vals, [2, 3, 6], 'Laufende Summe soll 2, 3, 6 sein.'); } },
      { name: 'dashboard lädt parallel', run: async T => { let par = 0, max = 0; const slow = v => T.rx.defer(() => { par++; max = Math.max(max, par); return T.rx.timer(50).pipe(T.op.map(() => { par--; return v; })); }); const api = { entwickler: () => slow([{}, {}, {}]), stunden: () => slow([2, 1, 3]) }; const r = await T.collect(T.get('dashboard')(api), 300); T.eq(r.vals, [{ anzahlEntwickler: 3, summe: 6 }], 'dashboard soll { anzahlEntwickler: 3, summe: 6 } liefern.'); T.eq(max, 2, 'Die Anfragen sollen parallel laufen (forkJoin).'); } }
    ] },
  merke: ['combineLatest: neuester Stand von allen.', 'forkJoin: einmal, wenn alle fertig sind.', 'scan: laufender Zustand.']
});

/* ================= AUSBLICK ================= */
