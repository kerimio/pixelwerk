/* ================= WERKSTATT: Inhalte =================
   Vier Modi, alle zum Selbermachen statt Lesen:
   BUGS      🐞 Bug-Jagd: kaputter Code, rote Tests, du findest und fixt den Fehler.
   OUTPUTS   🔮 Was gibt das aus? Reihenfolge der Konsolen-Ausgaben vorhersagen (Event Loop, Closures, RxJS, Signals).
   REVIEWS   👀 Code-Review-Arena: Zeilen im Pull Request markieren, die du kommentieren würdest.
   INTERVIEW 🎤 Mock-Interview: Frage, Timer, eigene Antwort, Toni bewertet wie ein Interviewer.
   Jeder Bug: Starter muss mindestens einen Test rot machen, die Lösung alle grün (tests/arena.test.js).
   Jede Ausgabe wird im Test wirklich ausgeführt und mit der Lösung verglichen. */

const BUGS = [
{
  id: 'bug01', stage: 'Einsteiger', topic: 'JavaScript', xp: 40,
  ticket: { id: 'PW-201', category: 'Bug', heading: '„–“ statt 0 Tickets, und 0 % Rabatt wird zu 10 %', text: 'Mia (QA): Bei Entwicklern ohne Ticket steht „–“ statt 0. Und wer den Rabatt-Code mit 0 % nutzt, bekommt trotzdem 10 %.' },
  cause: '<code>||</code> nimmt den rechten Wert bei <b>jedem</b> „falsy“ Wert: <code>0</code>, <code>""</code>, <code>false</code>, <code>null</code>, <code>undefined</code>, <code>NaN</code>. <code>??</code> nur bei <code>null</code> und <code>undefined</code>.',
  job: 'Klassiker in Formularen und Statistiken: Menge 0, Preis 0, Seite 0. Im Review bei jedem <code>||</code> mit Zahlen fragen: Darf das 0 sein?',
  ex: { id: 'xbug01', title: 'Die verschwundene Null', goal: 'Zwei Funktionen behandeln die Zahl 0 falsch. Finde die Stelle und fix sie, ohne den Rest kaputt zu machen.',
    todo: ['<code>ticketAnzeige(0)</code> → <code>"0"</code>, aber <code>null</code>/<code>undefined</code> → <code>"–"</code>', '<code>endpreis(100, 0)</code> → <code>100</code> (0 % ist ein echter Rabatt)', 'Ohne Rabatt-Angabe gelten weiter 10 %'],
    starter: C`
export function ticketAnzeige(tickets: number | null | undefined): string {
  if (!tickets) return '–';
  return String(tickets);
}

export function endpreis(preis: number, rabattProzent?: number): number {
  const rabatt = rabattProzent || 10;
  return preis - preis * rabatt / 100;
}
`,
    solution: C`
export function ticketAnzeige(tickets: number | null | undefined): string {
  if (tickets == null) return '–';
  return String(tickets);
}

export function endpreis(preis: number, rabattProzent?: number): number {
  const rabatt = rabattProzent ?? 10;
  return preis - preis * rabatt / 100;
}
`,
    notes: [['tickets == null', 'Fängt genau null UND undefined ab, aber nicht 0.'], ['?? 10', 'Nullish Coalescing: nimmt 10 nur, wenn links null oder undefined steht.']],
    hints: ['Welche Werte zählen in JavaScript als „falsch“? Die 0 gehört dazu.', 'Für den Standardwert gibt es einen Operator, der nur bei <code>null</code>/<code>undefined</code> greift: <code>??</code>', 'Bei der Anzeige: <code>if (tickets == null)</code> statt <code>if (!tickets)</code>.'],
    tests: [
      { name: '0 Tickets werden als "0" angezeigt', run: T => T.eq(T.get('ticketAnzeige')(0), '0', 'Bei 0 Tickets soll "0" stehen.') },
      { name: 'Keine Daten → "–"', run: T => { const f = T.get('ticketAnzeige'); T.eq([f(null), f(undefined), f(7)], ['–', '–', '7'], 'null und undefined → "–", 7 → "7".'); } },
      { name: '0 % Rabatt bleibt 0 %', run: T => T.eq(T.get('endpreis')(100, 0), 100, 'Mit 0 % Rabatt kostet es 100.') },
      { name: 'Standard 10 %, sonst der angegebene', run: T => { const f = T.get('endpreis'); T.eq([f(100), f(100, 25)], [90, 75], 'Ohne Angabe 90, mit 25 % → 75.'); } }
    ] }
},
{
  id: 'bug02', stage: 'Einsteiger', topic: 'JavaScript', xp: 40,
  ticket: { id: 'PW-202', category: 'Bug', heading: 'Jeder Klick öffnet „Profil von undefined“', text: 'Leon: Egal welchen Entwickler ich in der Liste anklicke, es öffnet sich „Profil von undefined“.' },
  cause: '<code>var</code> gilt für die ganze Funktion: Es gibt nur <b>ein</b> <code>i</code>. Wenn geklickt wird, ist die Schleife längst fertig und <code>i</code> steht hinter dem letzten Element. <code>let</code> erzeugt pro Durchlauf ein neues <code>i</code>.',
  job: 'Taucht in altem Code und bei Event-Handlern in Schleifen auf. Moderne Regel im Team: nie <code>var</code>, ESLint meldet es (<code>no-var</code>).',
  ex: { id: 'xbug02', title: 'Alle zeigen auf den Letzten', goal: 'Die Klick-Funktionen merken sich den falschen Entwickler. Ein einziges Wort ist schuld.',
    todo: ['<code>baueKlicks(["Leon", "Mo"])[0]()</code> → <code>"Profil von Leon"</code>', 'Jeder Klick zeigt seinen eigenen Entwickler'],
    starter: C`
export function baueKlicks(namen: string[]) {
  const klicks: Array<() => string> = [];
  for (var i = 0; i < namen.length; i++) {
    klicks.push(() => 'Profil von ' + namen[i]);
  }
  return klicks;
}
`,
    solution: C`
export function baueKlicks(namen: string[]) {
  const klicks: Array<() => string> = [];
  for (let i = 0; i < namen.length; i++) {
    klicks.push(() => 'Profil von ' + namen[i]);
  }
  return klicks;
}
`,
    notes: [['let i', 'Jeder Schleifendurchlauf bekommt sein eigenes i. Die Pfeilfunktion merkt sich genau dieses.'], ['() => ...namen[i]', 'Closure: Die Funktion merkt sich die Variable, nicht ihren Wert von damals.']],
    hints: ['Wann wird die Pfeilfunktion ausgeführt? Und welchen Wert hat <code>i</code> dann?', '<code>var</code> gibt es nur einmal pro Funktion.', 'Tausch <code>var</code> gegen <code>let</code>.'],
    tests: [
      { name: 'Erster Klick → Leon', run: T => T.eq(T.get('baueKlicks')(['Leon', 'Mo', 'Ben'])[0](), 'Profil von Leon', 'Klick 0 soll Leon zeigen.') },
      { name: 'Jeder Klick hat seinen Entwickler', run: T => T.eq(T.get('baueKlicks')(['Leon', 'Mo', 'Ben']).map(f => f()), ['Profil von Leon', 'Profil von Mo', 'Profil von Ben'], 'Alle drei sollen stimmen.') }
    ] }
},
{
  id: 'bug03', stage: 'Einsteiger', topic: 'JavaScript', xp: 50,
  ticket: { id: 'PW-203', category: 'Incident', heading: 'Preisliste: „Cannot read properties of undefined“', text: 'Seit dem Refactoring stürzt die Hoodie-Preisliste ab. In Sentry: TypeError: Cannot read properties of undefined (reading \'waehrung\').' },
  cause: '<code>preise.map(this.formatiere)</code> reicht die Methode <b>ohne</b> ihr Objekt weiter. Beim Aufruf ist <code>this</code> dann <code>undefined</code>. Eine Pfeilfunktion <code>p =&gt; this.formatiere(p)</code> behält das <code>this</code> von außen.',
  job: 'Passiert bei <code>setTimeout(this.tick, …)</code>, <code>addEventListener(\'x\', this.handler)</code> und <code>.subscribe(this.verarbeite)</code>. Die Fehlermeldung „reading … of undefined“ in einer Methode heißt fast immer: <code>this</code> verloren.',
  ex: { id: 'xbug03', title: 'Wer ist this?', goal: 'Die Preisliste stürzt ab, sobald <code>alle()</code> aufgerufen wird. Finde heraus, warum <code>this</code> plötzlich fehlt.',
    todo: ['<code>alle([5, 12.5])</code> → <code>["5.00 €", "12.50 €"]</code>', 'Eine geänderte <code>waehrung</code> wird benutzt'],
    starter: C`
export class Preisliste {
  waehrung = '€';

  formatiere(preis: number): string {
    return preis.toFixed(2) + ' ' + this.waehrung;
  }

  alle(preise: number[]): string[] {
    return preise.map(this.formatiere);
  }
}
`,
    solution: C`
export class Preisliste {
  waehrung = '€';

  formatiere(preis: number): string {
    return preis.toFixed(2) + ' ' + this.waehrung;
  }

  alle(preise: number[]): string[] {
    return preise.map(p => this.formatiere(p));
  }
}
`,
    notes: [['p => this.formatiere(p)', 'Pfeilfunktionen haben kein eigenes this. Sie nehmen das this von alle(), also die Preisliste.']],
    hints: ['Was passiert mit <code>this</code>, wenn man eine Methode als Wert weitergibt?', 'Statt die Methode selbst zu übergeben: eine kleine Funktion übergeben, die sie aufruft.', '<code>preise.map(p =&gt; this.formatiere(p))</code>'],
    tests: [
      { name: 'alle() stürzt nicht ab', run: T => { const P = T.get('Preisliste'); T.eq(new P().alle([5, 12.5]), ['5.00 €', '12.50 €'], 'Beide Preise formatiert.'); } },
      { name: 'Währung wird beachtet', run: T => { const P = T.get('Preisliste'); const p = new P(); p.waehrung = 'CHF'; T.eq(p.alle([1]), ['1.00 CHF'], 'Mit waehrung = "CHF".'); } }
    ] }
},
{
  id: 'bug04', stage: 'Grundlagen', topic: 'Signals', xp: 60,
  ticket: { id: 'PW-204', category: 'Bug', heading: 'Warenkorb-Zähler bleibt bei 0', text: 'Sara: Ich lege drei Schals in den Korb. Das Icon oben zeigt weiter 0. Lade ich die Seite neu, stimmt es.' },
  cause: 'Ein Signal meldet nur eine Änderung, wenn ein <b>neuer</b> Wert kommt (Vergleich mit <code>Object.is</code>). <code>push</code> und <code>splice</code> ändern das alte Array, die Referenz bleibt gleich, also merkt niemand etwas. Immer ein neues Array bauen.',
  job: 'Einer der häufigsten Signal-Bugs beim Umstieg. Im Review: <code>.push(</code>, <code>.splice(</code>, <code>.sort(</code> auf einem Signal-Wert ist ein Warnsignal. Dasselbe gilt für OnPush-Inputs.',
  ex: { id: 'xbug04', title: 'Der stumme Warenkorb', goal: 'Der Zähler <code>anzahl</code> aktualisiert sich nicht. Die Daten sind da, aber das Signal merkt die Änderung nicht.',
    todo: ['Nach <code>legeRein</code> stimmt <code>anzahl()</code>', 'Nach <code>entferne</code> stimmt <code>anzahl()</code>', 'Das alte Array wird nie verändert (immutable)'],
    starter: C`
import { Service, signal, computed } from '@angular/core';

@Service()
export class Warenkorb {
  artikel = signal<string[]>([]);
  anzahl = computed(() => this.artikel().length);

  legeRein(name: string) {
    this.artikel().push(name);
    this.artikel.set(this.artikel());
  }

  entferne(name: string) {
    const liste = this.artikel();
    liste.splice(liste.indexOf(name), 1);
    this.artikel.set(liste);
  }
}
`,
    solution: C`
import { Service, signal, computed } from '@angular/core';

@Service()
export class Warenkorb {
  artikel = signal<string[]>([]);
  anzahl = computed(() => this.artikel().length);

  legeRein(name: string) {
    this.artikel.update(liste => [...liste, name]);
  }

  entferne(name: string) {
    this.artikel.update(liste => liste.filter(a => a !== name));
  }
}
`,
    notes: [['update(liste => [...liste, name])', 'Neues Array mit allen alten Einträgen plus dem neuen. Neue Referenz → Signal meldet sich.'], ['liste.filter(...)', 'filter liefert immer ein neues Array.']],
    hints: ['Vergleich ist <code>Object.is(alt, neu)</code>. Ist das Array nach <code>push</code> ein anderes Objekt?', 'Spread baut ein neues Array: <code>[...liste, name]</code>', 'Entfernen ohne splice: <code>liste.filter(a =&gt; a !== name)</code>'],
    tests: [
      { name: 'legeRein erhöht anzahl', run: T => { const k = T.inject(T.get('Warenkorb')); T.eq(k.anzahl(), 0, 'Start: 0.'); k.legeRein('Schal'); k.legeRein('Hoodie'); T.eq(k.anzahl(), 2, 'Nach zwei Artikeln soll anzahl() 2 sein. Das Signal hat die Änderung nicht gemerkt.'); } },
      { name: 'entferne senkt anzahl', run: T => { const k = T.inject(T.get('Warenkorb')); k.legeRein('Schal'); k.legeRein('Hoodie'); T.eq(k.anzahl(), 2, 'Erst 2.'); k.entferne('Schal'); T.eq(k.anzahl(), 1, 'Nach entferne soll anzahl() 1 sein.'); T.eq(k.artikel(), ['Hoodie'], 'Übrig bleibt das Hoodie.'); } },
      { name: 'Altes Array bleibt unverändert', run: T => { const k = T.inject(T.get('Warenkorb')); const previous = k.artikel(); k.legeRein('Schal'); T.eq(previous, [], 'Das alte Array wurde verändert. Bau ein neues.'); } }
    ] }
},
{
  id: 'bug05', stage: 'Grundlagen', topic: 'Signals', xp: 60,
  ticket: { id: 'PW-205', category: 'Bug', heading: 'Team springt durcheinander, nachdem man die Top-Leister öffnet', text: 'Jonas: Auf der Team-Seite stehen die Entwickler nach Personalnummer. Öffnet man einmal den Tab „Top-Leister“, ist auch das Team nach Tickets sortiert.' },
  cause: '<code>Array.prototype.sort</code> sortiert <b>an Ort und Stelle</b> und gibt dasselbe Array zurück. Das computed hat also das Original im Signal umsortiert. Erst kopieren (<code>[...liste]</code>) oder <code>toSorted()</code> nehmen.',
  job: 'Genauso fies mit <code>reverse()</code> und <code>splice()</code>. Besonders gefährlich bei Daten aus einem Store oder Cache, die viele Komponenten teilen.',
  ex: { id: 'xbug05', title: 'Das Sortier-Virus', goal: 'Die Top-Leister-Liste ist richtig, aber sie verändert heimlich das Team. Finde die Nebenwirkung.',
    todo: ['<code>topLeister()</code> ist nach Tickets sortiert', '<code>team()</code> bleibt danach in der Original-Reihenfolge'],
    starter: C`
import { signal, computed } from '@angular/core';

export class Rangliste {
  team = signal([
    { name: 'Mo', tickets: 3 },
    { name: 'Leon', tickets: 9 },
    { name: 'Ben', tickets: 5 },
  ]);

  topLeister = computed(() =>
    this.team().sort((a, b) => b.tickets - a.tickets)
  );
}
`,
    solution: C`
import { signal, computed } from '@angular/core';

export class Rangliste {
  team = signal([
    { name: 'Mo', tickets: 3 },
    { name: 'Leon', tickets: 9 },
    { name: 'Ben', tickets: 5 },
  ]);

  topLeister = computed(() =>
    [...this.team()].sort((a, b) => b.tickets - a.tickets)
  );
}
`,
    notes: [['[...this.team()]', 'Flache Kopie. sort() sortiert jetzt die Kopie, das Original bleibt.']],
    hints: ['Was gibt <code>sort()</code> zurück: ein neues Array oder dasselbe?', 'Kopie zuerst: <code>[...this.team()]</code>', 'Oder modern: <code>this.team().toSorted(…)</code>'],
    tests: [
      { name: 'Top-Leister richtig sortiert', run: T => { const t = new (T.get('Rangliste'))(); T.eq(t.topLeister().map(s => s.name), ['Leon', 'Ben', 'Mo'], 'Meiste Tickets zuerst.'); } },
      { name: 'Team bleibt in Original-Reihenfolge', run: T => { const t = new (T.get('Rangliste'))(); t.topLeister(); T.eq(t.team().map(s => s.name), ['Mo', 'Leon', 'Ben'], 'Nach dem Lesen der Top-Leister ist das Team umsortiert: sort() verändert das Original.'); } }
    ] }
},
{
  id: 'bug06', stage: 'Fortgeschritten', topic: 'HTTP', xp: 70,
  ticket: { id: 'PW-206', category: 'Bug', heading: 'API antwortet 401, obwohl man eingeloggt ist', text: 'Jonas: Im Network-Tab fehlt bei allen Anfragen der Authorization-Header. Der Token ist aber da, ich hab ihn geloggt.' },
  cause: '<code>HttpHeaders</code> (und <code>HttpRequest</code>) sind <b>unveränderlich</b>. <code>set()</code> ändert nichts, sondern gibt eine neue Kopie zurück. Wer den Rückgabewert wegwirft, schickt die alten Header. Im Interceptor deshalb <code>req.clone({ setHeaders: … })</code>.',
  job: 'Typischer Fehler im ersten selbst geschriebenen Interceptor. Erkennungszeichen: Header fehlt im Network-Tab, obwohl der Code ihn „setzt“.',
  ex: { id: 'xbug06', title: 'Der verschluckte Header', goal: 'Der Token wird gesetzt, kommt aber nie an. Lies genau, was <code>set()</code> zurückgibt.',
    todo: ['Mit Token: <code>Authorization: Bearer &lt;token&gt;</code> im Ergebnis', 'Die übergebenen Header bleiben unverändert', 'Ohne Token kein Authorization-Header'],
    starter: C`
import { HttpHeaders } from '@angular/common/http';

export function mitToken(headers: HttpHeaders, token: string | null): HttpHeaders {
  if (token) {
    headers.set('Authorization', 'Bearer ' + token);
  }
  return headers;
}
`,
    solution: C`
import { HttpHeaders } from '@angular/common/http';

export function mitToken(headers: HttpHeaders, token: string | null): HttpHeaders {
  if (token) {
    return headers.set('Authorization', 'Bearer ' + token);
  }
  return headers;
}
`,
    notes: [['return headers.set(...)', 'set() liefert NEUE Header mit dem Eintrag. Die muss man weitergeben.']],
    hints: ['Schau, was <code>headers.set(…)</code> zurückgibt.', 'HttpHeaders sind immutable, wie Strings.', '<code>return headers.set(\'Authorization\', \'Bearer \' + token);</code>'],
    tests: [
      { name: 'Token landet im Header', run: T => { const H = T.ng.modules['@angular/common/http'].HttpHeaders; T.eq(T.get('mitToken')(new H(), 'abc').get('Authorization'), 'Bearer abc', 'Authorization soll "Bearer abc" sein.'); } },
      { name: 'Original bleibt unverändert', run: T => { const H = T.ng.modules['@angular/common/http'].HttpHeaders; const h = new H({ Accept: 'application/json' }); const fresh = T.get('mitToken')(h, 'abc'); T.ok(!h.has('Authorization'), 'Die übergebenen Header dürfen sich nicht ändern.'); T.eq(fresh.get('Accept'), 'application/json', 'Alte Header bleiben erhalten.'); } },
      { name: 'Ohne Token kein Header', run: T => { const H = T.ng.modules['@angular/common/http'].HttpHeaders; T.ok(!T.get('mitToken')(new H(), null).has('Authorization'), 'Ohne Token kein Authorization.'); } }
    ] }
},
{
  id: 'bug07', stage: 'Fortgeschritten', topic: 'Performance', xp: 80,
  ticket: { id: 'PW-207', category: 'Incident', heading: 'Dashboard braucht 4 Sekunden', text: 'Katrin Kaiser: Das Agentur-Dashboard lädt ewig. Im Network-Tab sieht man einen Wasserfall: Jede Anfrage startet erst, wenn die vorige fertig ist.' },
  cause: '<code>await</code> in einer Schleife wartet bei jedem Durchlauf. 4 Anfragen à 1 s = 4 s. Unabhängige Anfragen gleichzeitig starten und mit <code>Promise.all</code> auf alle warten: 1 s. Die Reihenfolge im Ergebnis bleibt trotzdem gleich.',
  job: 'Der „Wasserfall“ im Network-Tab ist ein Klassiker im Performance-Review. In RxJS heißt die Lösung <code>forkJoin</code>. Nur sequenziell, wenn eine Anfrage die Antwort der vorigen braucht.',
  ex: { id: 'xbug07', title: 'Der Wasserfall', goal: 'Die Daten stimmen, aber es dauert viel zu lange. Lass die Anfragen gleichzeitig laufen.',
    todo: ['Ergebnis in derselben Reihenfolge wie die ids', '4 Anfragen dauern nicht länger als etwa eine', 'Fehler einer Anfrage kommen weiterhin als Fehler an'],
    starter: C`
export async function ladeAlles(
  api: { lade(id: number): Promise<string> },
  ids: number[]
): Promise<string[]> {
  const ergebnisse: string[] = [];
  for (const id of ids) {
    ergebnisse.push(await api.lade(id));
  }
  return ergebnisse;
}
`,
    solution: C`
export async function ladeAlles(
  api: { lade(id: number): Promise<string> },
  ids: number[]
): Promise<string[]> {
  return Promise.all(ids.map(id => api.lade(id)));
}
`,
    notes: [['ids.map(id => api.lade(id))', 'Startet alle Anfragen sofort. Ergebnis: ein Array von Promises.'], ['Promise.all(...)', 'Wartet auf alle. Liefert die Werte in derselben Reihenfolge. Schlägt eine fehl, schlägt das Ganze fehl.']],
    hints: ['Wann startet die zweite Anfrage? Erst nach dem ersten <code>await</code>.', 'Erst alle starten (<code>map</code>), dann auf alle warten.', '<code>return Promise.all(ids.map(id =&gt; api.lade(id)));</code>'],
    tests: [
      { name: 'Reihenfolge stimmt', run: async T => { const api = { lade: id => new Promise(r => setTimeout(() => r('Daten ' + id), id === 1 ? 60 : 10)) }; T.eq(await T.get('ladeAlles')(api, [1, 2, 3]), ['Daten 1', 'Daten 2', 'Daten 3'], 'Ergebnis in der Reihenfolge der ids.'); } },
      { name: 'Alle gleichzeitig (schnell)', run: async T => { const api = { lade: id => new Promise(r => setTimeout(() => r('D' + id), 80)) }; const t0 = performance.now(); await T.get('ladeAlles')(api, [1, 2, 3, 4]); const ms = performance.now() - t0; T.ok(ms < 200, 'Hat ' + Math.round(ms) + ' ms gedauert. Gleichzeitig wären es etwa 80 ms.'); } },
      { name: 'Fehler wird weitergegeben', run: async T => { const api = { lade: id => id === 2 ? Promise.reject(new Error('503')) : Promise.resolve('ok') }; let problems = null; try { await T.get('ladeAlles')(api, [1, 2, 3]); } catch (e) { problems = e; } T.ok(problems && problems.message === '503', 'Ein Fehler soll als Fehler ankommen.'); } }
    ] }
},
{
  id: 'bug08', stage: 'Fortgeschritten', topic: 'RxJS', xp: 90,
  ticket: { id: 'PW-208', category: 'Bug', heading: 'Suche zeigt manchmal Treffer für das falsche Wort', text: 'Mia: Ich tippe schnell „Le“. Kurz steht „Leon“ da, dann springt die Liste auf die Treffer für „L“ zurück. Passiert vor allem im Handy-Netz.' },
  cause: '<code>mergeMap</code> lässt alle Anfragen parallel laufen. Kommt die Antwort für „L“ nach der für „Le“, überschreibt sie das richtige Ergebnis (Race Condition). <code>switchMap</code> bricht die alte Anfrage ab, sobald ein neuer Suchbegriff kommt.',
  job: 'Für Suchfelder und Filter immer <code>switchMap</code>. Merksatz: switch = nur das Neueste zählt, concat = Schlange stehen, merge = alle gleichzeitig, exhaust = erst fertig machen.',
  ex: { id: 'xbug08', title: 'Das Rennen der Antworten', goal: 'Langsame alte Antworten überholen schnelle neue. Ein Operator ist der falsche.',
    todo: ['Nur die Treffer für den neuesten Suchbegriff kommen an', 'Eine einzelne Suche funktioniert weiter', 'Kein <code>debounceTime</code> nötig (das wäre ein anderes Ticket)'],
    starter: C`
import { Observable, mergeMap } from 'rxjs';

export function suchErgebnisse(
  eingabe$: Observable<string>,
  suche: (q: string) => Observable<string[]>
): Observable<string[]> {
  return eingabe$.pipe(
    mergeMap(q => suche(q))
  );
}
`,
    solution: C`
import { Observable, switchMap } from 'rxjs';

export function suchErgebnisse(
  eingabe$: Observable<string>,
  suche: (q: string) => Observable<string[]>
): Observable<string[]> {
  return eingabe$.pipe(
    switchMap(q => suche(q))
  );
}
`,
    notes: [['switchMap', 'Neuer Wert kommt → alte innere Anfrage wird abbestellt (bei HttpClient: wirklich abgebrochen).']],
    hints: ['Was passiert mit der Anfrage für „L“, wenn „Le“ kommt? Bei mergeMap: nichts, sie läuft weiter.', 'Du brauchst einen Operator, der die alte Anfrage abbricht.', '<code>switchMap</code> statt <code>mergeMap</code> (Import nicht vergessen).'],
    tests: [
      { name: 'Einzelne Suche kommt an', run: async T => { const { Subject, timer, map } = T.rx; const s = new Subject(); const p = T.collect(T.get('suchErgebnisse')(s, q => timer(10).pipe(map(() => ['Treffer für ' + q]))), 80); s.next('Leo'); T.eq((await p).vals, [['Treffer für Leo']], 'Eine Suche, ein Ergebnis.'); } },
      { name: 'Alte langsame Antwort überschreibt nichts', run: async T => { const { Subject, timer, map } = T.rx; const s = new Subject(); const search = q => timer(q.length === 1 ? 90 : 10).pipe(map(() => ['Treffer für ' + q])); const p = T.collect(T.get('suchErgebnisse')(s, search), 220); s.next('L'); setTimeout(() => s.next('Le'), 5); T.eq((await p).vals, [['Treffer für Le']], 'Nach „Le“ dürfen keine Treffer für „L“ mehr kommen.'); } }
    ] }
},
{
  id: 'bug09', stage: 'Profi', topic: 'RxJS', xp: 100,
  ticket: { id: 'PW-209', category: 'Incident', heading: 'Live-Ticker friert nach einem Fehler für immer ein', text: 'Freitag, 19:42, Konzert im großen Saal: Das Backend hatte 2 Sekunden einen 503. Seitdem zeigt der Live-Ticker im Foyer „Ticker gerade nicht erreichbar“, auch nach der Pause.' },
  cause: 'Ein Fehler beendet einen Stream. <code>catchError</code> <b>außen</b> ersetzt den ganzen Ticker durch <code>of(…)</code>, und der ist nach einem Wert fertig. <code>catchError</code> <b>innen</b> (im switchMap) fängt nur die eine kaputte Anfrage ab, der äußere Trigger läuft weiter.',
  job: 'Gilt für alle langlebigen Streams: Polling, WebSocket, Formular-Änderungen. Faustregel im Review: Fehler so nah wie möglich an der Anfrage fangen.',
  ex: { id: 'xbug09', title: 'Ein Fehler, und Schluss', goal: 'Nach einem einzigen Fehler kommen keine Updates mehr. Der Fehler wird an der falschen Stelle gefangen.',
    todo: ['Ein Fehler zeigt einmal „Ticker gerade nicht erreichbar“', 'Danach kommen neue Meldungen wieder an', 'Der Stream endet nicht'],
    starter: C`
import { Observable, of, switchMap, catchError } from 'rxjs';

export function liveTicker(
  trigger$: Observable<number>,
  lade: () => Observable<string>
): Observable<string> {
  return trigger$.pipe(
    switchMap(() => lade()),
    catchError(() => of('Ticker gerade nicht erreichbar'))
  );
}
`,
    solution: C`
import { Observable, of, switchMap, catchError } from 'rxjs';

export function liveTicker(
  trigger$: Observable<number>,
  lade: () => Observable<string>
): Observable<string> {
  return trigger$.pipe(
    switchMap(() => lade().pipe(
      catchError(() => of('Ticker gerade nicht erreichbar'))
    ))
  );
}
`,
    notes: [['lade().pipe(catchError(...))', 'Fängt den Fehler der einen Anfrage. Der äußere trigger$ merkt davon nichts und läuft weiter.']],
    hints: ['Was macht ein Observable nach einem Fehler? Es ist vorbei.', 'Welcher Stream soll den Fehler abbekommen: der Trigger oder nur die eine Anfrage?', 'Schieb das <code>catchError</code> in das <code>switchMap</code>: <code>lade().pipe(catchError(…))</code>'],
    tests: [
      { name: 'Ohne Fehler kommen alle Stände', run: async T => { const { Subject, of } = T.rx; const s = new Subject(); let n = 0; const p = T.collect(T.get('liveTicker')(s, () => of(++n + ':0')), 60); s.next(1); s.next(2); T.eq((await p).vals, ['1:0', '2:0'], 'Zwei Trigger, zwei Stände.'); } },
      { name: 'Nach einem Fehler geht es weiter', run: async T => { const { Subject, of, throwError } = T.rx; const s = new Subject(); let n = 0; const loading = () => { n++; return n === 2 ? throwError(() => new Error('503')) : of(n === 1 ? '1:0' : '2:0'); }; const p = T.collect(T.get('liveTicker')(s, loading), 60); s.next(1); s.next(2); s.next(3); const r = await p; T.eq(r.vals, ['1:0', 'Ticker gerade nicht erreichbar', '2:0'], 'Nach dem 503 soll das 2:0 trotzdem ankommen.'); T.ok(!r.complete, 'Der Ticker darf nach einem Fehler nicht enden.'); } }
    ] }
},
{
  id: 'bug10', stage: 'Profi', topic: 'RxJS', xp: 100,
  ticket: { id: 'PW-210', category: 'Bug', heading: 'Kunden haben Tickets doppelt bezahlt', text: 'Support: 37 Kunden haben zwei oder drei Tickets bekommen und bezahlt. Alle sagen: „Ich hab nur einmal geklickt.“ (Doppelklick, ungeduldiges Nachklicken.)' },
  cause: '<code>mergeMap</code> startet für jeden Klick eine neue Buchung. <code>exhaustMap</code> ignoriert neue Klicks, solange die laufende Buchung nicht fertig ist. <code>switchMap</code> wäre hier falsch: Es bricht nur das Warten ab, die POST-Anfrage ist beim Server vielleicht schon angekommen.',
  job: 'Gehört zu jedem „Bezahlen“, „Speichern“, „Absenden“. Zusätzlich gehört der Button während des Ladens auf <code>disabled</code>, und das Backend sollte einen Idempotency-Key prüfen. Verteidigung in drei Schichten.',
  ex: { id: 'xbug10', title: 'Doppelt hält nicht besser', goal: 'Mehrfach-Klicks lösen mehrere Buchungen aus. Wähle den Operator, der während einer laufenden Buchung Klicks ignoriert.',
    todo: ['Drei schnelle Klicks → genau eine Buchung', 'Ein späterer Klick (nach Abschluss) bucht wieder', 'Laufende Buchungen werden nicht abgebrochen'],
    starter: C`
import { Observable, mergeMap } from 'rxjs';

export function buchungen(
  klicks$: Observable<void>,
  buche: () => Observable<string>
): Observable<string> {
  return klicks$.pipe(
    mergeMap(() => buche())
  );
}
`,
    solution: C`
import { Observable, exhaustMap } from 'rxjs';

export function buchungen(
  klicks$: Observable<void>,
  buche: () => Observable<string>
): Observable<string> {
  return klicks$.pipe(
    exhaustMap(() => buche())
  );
}
`,
    notes: [['exhaustMap', 'Solange die innere Buchung läuft, werden neue Klicks verworfen. Danach ist er wieder offen.']],
    hints: ['Vier Operatoren: merge, concat, switch, exhaust. Welcher ignoriert Neues, solange etwas läuft?', 'switchMap bricht ab, concatMap stellt in die Schlange. Beides bucht trotzdem mehrfach.', '<code>exhaustMap(() =&gt; buche())</code>'],
    tests: [
      { name: 'Drei schnelle Klicks → eine Buchung', run: async T => { const { Subject, timer, map } = T.rx; const s = new Subject(); let calls = 0; const book = () => { const n = ++calls; return timer(40).pipe(map(() => 'Ticket #' + n)); }; const p = T.collect(T.get('buchungen')(s, book), 150); s.next(); s.next(); s.next(); const r = await p; T.eq(calls, 1, 'Es wurde ' + calls + '× gebucht.'); T.eq(r.vals, ['Ticket #1'], 'Genau ein Ticket.'); } },
      { name: 'Späterer Klick bucht wieder', run: async T => { const { Subject, timer, map } = T.rx; const s = new Subject(); let calls = 0; const book = () => { const n = ++calls; return timer(30).pipe(map(() => 'Ticket #' + n)); }; const p = T.collect(T.get('buchungen')(s, book), 200); s.next(); s.next(); setTimeout(() => s.next(), 80); const r = await p; T.eq(r.vals, ['Ticket #1', 'Ticket #2'], 'Nach Abschluss darf wieder gebucht werden.'); T.eq(calls, 2, 'Insgesamt zwei Buchungen.'); } }
    ] }
},
{
  id: 'bug11', stage: 'Experte', topic: 'RxJS · HTTP', xp: 120,
  ticket: { id: 'PW-211', category: 'Bug', heading: 'Projekt-API bekommt jede Anfrage doppelt', text: 'Jonas: Seit dem neuen Projektplan-Widget haben wir doppelt so viele Requests auf /api/projekte. Im Network-Tab: zwei identische GETs pro Seitenaufruf.' },
  cause: 'Observables aus <code>HttpClient</code> sind <b>kalt</b>: Jedes <code>subscribe</code> (auch jede <code>| async</code>-Pipe) startet eine neue Anfrage. <code>anzahl$</code> hängt an <code>projekte$</code>, also zwei Abos, zwei Requests. <code>shareReplay(1)</code> teilt die eine Antwort und gibt sie auch späten Abonnenten.',
  job: 'Sehr häufig, wenn ein Observable im Template zweimal mit <code>| async</code> benutzt wird. Moderne Alternative: einmal <code>toSignal()</code> oder <code>httpResource</code>, dann ist es nur ein Abo.',
  ex: { id: 'xbug11', title: 'Doppelt gemoppelt', goal: 'Zwei Abonnenten lösen zwei identische HTTP-Anfragen aus. Teile die eine Antwort.',
    todo: ['<code>projekte$</code> und <code>anzahl$</code> zusammen → nur 1 Anfrage', 'Beide bekommen die richtigen Werte', 'Ein später Abonnent bekommt die Daten ohne neue Anfrage'],
    starter: C`
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

@Service()
export class Projektplan {
  private http = inject(HttpClient);

  projekte$ = this.http.get<string[]>('/api/projekte');
  anzahl$ = this.projekte$.pipe(map(s => s.length));
}
`,
    solution: C`
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs';

@Service()
export class Projektplan {
  private http = inject(HttpClient);

  projekte$ = this.http.get<string[]>('/api/projekte').pipe(shareReplay(1));
  anzahl$ = this.projekte$.pipe(map(s => s.length));
}
`,
    notes: [['shareReplay(1)', 'Ein gemeinsames Abo auf die Quelle. Der letzte Wert wird gemerkt und an jeden neuen Abonnenten sofort gegeben.']],
    hints: ['Zähl die <code>subscribe</code>s: Wie viele Anfragen startet <code>HttpClient.get</code>?', 'Du brauchst einen Operator, der ein Abo teilt UND den Wert für Spätere aufhebt.', '<code>this.http.get(…).pipe(shareReplay(1))</code>'],
    tests: [
      { name: 'Zwei Abonnenten, eine Anfrage', run: async T => { T.ng.backend.routes['GET /api/projekte'] = ['Relaunch', 'Shop', 'Intranet']; const sp = T.inject(T.get('Projektplan')); const [a, b] = await Promise.all([T.collect(sp.projekte$, 120), T.collect(sp.anzahl$, 120)]); T.eq(a.vals, [['Relaunch', 'Shop', 'Intranet']], 'projekte$ liefert die Liste.'); T.eq(b.vals, [3], 'anzahl$ liefert 3.'); T.eq(T.ng.backend.calls.length, 1, 'Es gab ' + T.ng.backend.calls.length + ' Anfragen auf /api/projekte.'); } },
      { name: 'Später Abonnent: keine neue Anfrage', run: async T => { T.ng.backend.routes['GET /api/projekte'] = ['Relaunch']; const sp = T.inject(T.get('Projektplan')); await T.collect(sp.projekte$, 100); const late = await T.collect(sp.anzahl$, 60); T.eq(late.vals, [1], 'Der späte Abonnent bekommt sofort 1.'); T.eq(T.ng.backend.calls.length, 1, 'Es gab ' + T.ng.backend.calls.length + ' Anfragen. Der Wert soll gemerkt werden.'); } }
    ] }
}
];

/* ---------- 🔮 Was gibt das aus? ----------
   code ist reines JavaScript (läuft wirklich). Im Test wird jede Ausgabe echt ausgeführt.
   Verfügbar im Schnipsel: alles aus rxjs, dazu signal/computed/effect. */
const OUTPUTS = [
{ id: 'o01', topic: 'Event Loop', heading: 'setTimeout mit 0', code: C`
console.log('A');
setTimeout(() => console.log('B'), 0);
console.log('C');`, lines: ['A', 'C', 'B'],
  reasonWhy: '<code>setTimeout(…, 0)</code> heißt nicht „sofort“, sondern „frühestens, wenn der aktuelle Code fertig ist“. Der Rückruf kommt in die Task-Warteschlange.',
  job: 'Darum hilft <code>setTimeout(0)</code> als Hack gegen „ExpressionChangedAfterItHasBeenChecked“. Im Review ist das ein Warnsignal: Meist stimmt der Datenfluss nicht.' },
{ id: 'o02', topic: 'Event Loop', heading: 'Promise gegen Timer', code: C`
console.log('Start');
setTimeout(() => console.log('Timeout'), 0);
Promise.resolve().then(() => console.log('Promise'));
console.log('Ende');`, lines: ['Start', 'Ende', 'Promise', 'Timeout'],
  reasonWhy: 'Erst läuft der ganze synchrone Code. Dann <b>alle</b> Microtasks (Promises). Erst danach der nächste Task (Timer). Microtasks drängeln sich also immer vor.',
  job: 'Genau das ist der Event Loop, und er ist die Lieblingsfrage in Frontend-Interviews.' },
{ id: 'o03', topic: 'Event Loop', heading: 'async und await', code: C`
async function lade() {
  console.log('lade startet');
  await null;
  console.log('nach await');
}
console.log('vorher');
lade();
console.log('nachher');`, lines: ['vorher', 'lade startet', 'nachher', 'nach await'],
  reasonWhy: 'Eine async-Funktion läuft <b>synchron</b> bis zum ersten <code>await</code>. Der Rest wird als Microtask eingeplant. Der Aufrufer macht inzwischen weiter.',
  job: 'Darum ist ein Wert direkt nach <code>lade()</code> ohne <code>await</code> noch nicht da. Häufiger Bug in Tests und in <code>ngOnInit</code>.' },
{ id: 'o04', topic: 'Event Loop', heading: 'Zwei Promise-Ketten', code: C`
Promise.resolve()
  .then(() => console.log('a1'))
  .then(() => console.log('a2'));
Promise.resolve()
  .then(() => console.log('b1'))
  .then(() => console.log('b2'));`, lines: ['a1', 'b1', 'a2', 'b2'],
  reasonWhy: 'Jedes <code>.then</code> plant erst den nächsten Schritt ein, wenn es selbst fertig ist. Die Ketten wechseln sich deshalb ab.' },
{ id: 'o05', topic: 'Event Loop', heading: 'Timer im Microtask', code: C`
setTimeout(() => console.log('T1'), 0);
Promise.resolve().then(() => {
  console.log('P1');
  setTimeout(() => console.log('T2'), 0);
  Promise.resolve().then(() => console.log('P2'));
});
console.log('sync');`, lines: ['sync', 'P1', 'P2', 'T1', 'T2'],
  reasonWhy: 'P2 wird während der Microtask-Phase eingeplant und läuft noch in derselben Phase. T2 kommt hinten in die Task-Schlange, also nach T1.' },
{ id: 'o06', topic: 'JavaScript', heading: 'var in der Schleife', code: C`
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`, lines: ['3', '3', '3'], distract: ['0', '1', '2'],
  reasonWhy: 'Mit <code>var</code> gibt es nur <b>ein</b> <code>i</code>. Wenn die Timer laufen, ist die Schleife fertig und <code>i</code> ist 3.' },
{ id: 'o07', topic: 'JavaScript', heading: 'let in der Schleife', code: C`
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`, lines: ['0', '1', '2'], distract: ['3'],
  reasonWhy: '<code>let</code> erzeugt pro Durchlauf ein eigenes <code>i</code>. Jede Pfeilfunktion merkt sich ihres.' },
{ id: 'o08', topic: 'JavaScript', heading: 'Methode ohne Objekt', code: C`
class Agentur {
  name = 'Pixelwerk';
  hallo() { return 'Hallo ' + this.name; }
}
const k = new Agentur();
console.log(k.hallo());
const f = k.hallo;
try { console.log(f()); } catch (e) { console.log('TypeError'); }`, lines: ['Hallo Pixelwerk', 'TypeError'], distract: ['Hallo undefined'],
  reasonWhy: '<code>this</code> wird beim <b>Aufruf</b> bestimmt. <code>f()</code> hat kein Objekt vor dem Punkt, in Klassen gilt strict mode, also ist <code>this</code> <code>undefined</code> und <code>this.name</code> wirft.',
  job: 'Darum <code>(click)="speichern()"</code> im Template problemlos, aber <code>setTimeout(this.speichern)</code> kaputt.' },
{ id: 'o09', topic: 'JavaScript', heading: 'Typen und Gleichheit', code: C`
console.log(typeof null);
console.log(0 == '');
console.log(0 === '');
console.log(NaN === NaN);`, lines: ['object', 'true', 'false', 'false'], distract: ['null'],
  reasonWhy: '<code>typeof null</code> ist ein uralter Fehler in JavaScript. <code>==</code> wandelt Typen um (<code>""</code> wird 0), <code>===</code> nicht. <code>NaN</code> ist zu nichts gleich, auch nicht zu sich selbst: <code>Number.isNaN()</code> nehmen.' },
{ id: 'o10', topic: 'JavaScript', heading: 'Referenz oder Kopie?', code: C`
const a = { tickets: 1 };
const b = a;
b.tickets = 2;
const c = { ...a };
c.tickets = 3;
console.log(a.tickets, b.tickets, c.tickets);`, lines: ['2 2 3'], distract: ['1 2 3', '1 1 3', '3 3 3'],
  reasonWhy: '<code>b = a</code> kopiert nur den Verweis: beide zeigen auf dasselbe Objekt. <code>{ ...a }</code> baut ein neues Objekt (flache Kopie).',
  job: 'Die Grundlage für Signals und OnPush: Nur ein neues Objekt gilt als Änderung.' },
{ id: 'o11', topic: 'JavaScript', heading: 'sort() ohne Vergleich', code: C`
console.log([10, 9, 1, 100].sort().join(','));
console.log([10, 9, 1, 100].sort((a, b) => a - b).join(','));`, lines: ['1,10,100,9', '1,9,10,100'], distract: ['100,10,9,1'],
  reasonWhy: 'Ohne Vergleichsfunktion sortiert <code>sort()</code> als <b>Text</b>: „10“ kommt vor „9“. Für Zahlen immer <code>(a, b) =&gt; a - b</code>.' },
{ id: 'o12', topic: 'HTTP', heading: 'Was landet im Request-Body?', code: C`
const body = {
  name: 'Leon',
  nummer: undefined,
  geburt: new Date(0),
  sag: () => 'hi'
};
console.log(JSON.stringify(body));`, lines: ['{"name":"Leon","geburt":"1970-01-01T00:00:00.000Z"}'], distract: ['{"name":"Leon","nummer":null,"geburt":"1970-01-01T00:00:00.000Z"}', '{"name":"Leon","nummer":undefined,"geburt":{}}'],
  reasonWhy: '<code>undefined</code> und Funktionen fallen bei JSON weg. Ein <code>Date</code> wird zum ISO-Text (UTC!). Zurück kommt beim Lesen nur ein String, kein Date.',
  job: '<code>HttpClient.post</code> macht genau das mit deinem Objekt. Willst du ein Feld beim PATCH löschen, schick <code>null</code>, nicht <code>undefined</code>.' },
{ id: 'o13', topic: 'RxJS', heading: 'Subject oder BehaviorSubject?', code: C`
const s = new Subject();
s.next(1);
s.subscribe(v => console.log('S' + v));
s.next(2);

const b = new BehaviorSubject(0);
b.next(1);
b.subscribe(v => console.log('B' + v));
b.next(2);`, lines: ['S2', 'B1', 'B2'], distract: ['S1', 'B0'],
  reasonWhy: 'Ein <code>Subject</code> hat kein Gedächtnis: Wer zu spät kommt, verpasst den Wert. Ein <code>BehaviorSubject</code> merkt sich den letzten Wert und gibt ihn jedem neuen Abonnenten sofort.',
  job: 'Darum bauen alte Services ihren Zustand mit BehaviorSubject. Heute nimmt man dafür meistens ein Signal.' },
{ id: 'o14', topic: 'RxJS', heading: 'Kalte Observables', code: C`
const entwickler$ = new Observable(sub => {
  console.log('HTTP-Anfrage');
  sub.next('Leon');
  sub.complete();
});
entwickler$.subscribe(v => console.log('Liste: ' + v));
entwickler$.subscribe(v => console.log('Zähler: ' + v));`, lines: ['HTTP-Anfrage', 'Liste: Leon', 'HTTP-Anfrage', 'Zähler: Leon'],
  reasonWhy: 'Ein kaltes Observable startet für <b>jeden</b> Abonnenten von vorn. HttpClient funktioniert genauso: zwei Abos, zwei Anfragen. Teilen mit <code>shareReplay(1)</code>.' },
{ id: 'o15', topic: 'RxJS', heading: 'of() ist synchron', code: C`
of(1, 2, 3).pipe(
  map(x => x * 10),
  filter(x => x > 10),
  tap(x => console.log('tap ' + x))
).subscribe({
  next: x => console.log('next ' + x),
  complete: () => console.log('fertig')
});
console.log('danach');`, lines: ['tap 20', 'next 20', 'tap 30', 'next 30', 'fertig', 'danach'], distract: ['tap 10'],
  reasonWhy: 'Jeder Wert läuft einzeln durch die ganze Kette, bevor der nächste startet. Und <code>of()</code> liefert alles <b>sofort</b>, also kommt „danach“ ganz am Ende.' },
{ id: 'o16', topic: 'RxJS', heading: 'mergeMap: wer zuerst fertig ist', code: C`
of(1, 2, 3).pipe(
  mergeMap(x => timer(x === 1 ? 30 : 10).pipe(map(() => 'merge ' + x)))
).subscribe(v => console.log(v));`, lines: ['merge 2', 'merge 3', 'merge 1'],
  reasonWhy: '<code>mergeMap</code> lässt alle inneren Streams gleichzeitig laufen. Die Reihenfolge der Ergebnisse hängt davon ab, wer zuerst fertig ist, nicht wer zuerst kam.' },
{ id: 'o17', topic: 'RxJS', heading: 'switchMap gegen concatMap', code: C`
of(1, 2, 3).pipe(
  switchMap(x => timer(10).pipe(map(() => 'switch ' + x)))
).subscribe(v => console.log(v));

of(1, 2, 3).pipe(
  concatMap(x => timer(10).pipe(map(() => 'concat ' + x)))
).subscribe(v => console.log(v));`, lines: ['switch 3', 'concat 1', 'concat 2', 'concat 3'], distract: ['switch 1', 'switch 2'],
  reasonWhy: '<code>switchMap</code> bricht den alten inneren Stream ab, sobald ein neuer Wert kommt: übrig bleibt nur die 3. <code>concatMap</code> arbeitet alle nacheinander ab, in Reihenfolge.' },
{ id: 'o18', topic: 'Signals', heading: 'computed ist faul', code: C`
const tickets = signal(1);
const doppelt = computed(() => {
  console.log('rechne');
  return tickets() * 2;
});
console.log('start');
tickets.set(2);
tickets.set(3);
console.log(doppelt());
console.log(doppelt());`, lines: ['start', 'rechne', '6', '6'], distract: ['2', '4'],
  reasonWhy: '<code>computed</code> rechnet erst, wenn jemand den Wert liest, und merkt sich das Ergebnis. Zweimal lesen ohne Änderung = einmal rechnen.',
  job: 'Darum ist <code>computed</code> im Template billig, eine Methode im Template dagegen läuft bei jeder Prüfung neu.' },
{ id: 'o19', topic: 'Signals', heading: 'effect bündelt', code: C`
// (stell dir vor: in einer Komponente)
const zahl = signal(0);
effect(() => console.log('Effekt: ' + zahl()));
zahl.set(1);
zahl.set(2);
zahl.set(3);
console.log('sync fertig');`, lines: ['sync fertig', 'Effekt: 3'], distract: ['Effekt: 0', 'Effekt: 1', 'Effekt: 2'],
  reasonWhy: 'Ein <code>effect</code> läuft nicht sofort, sondern wird eingeplant. Bis er dran ist, wurde das Signal dreimal gesetzt, er sieht nur den letzten Wert. Zwischenstände sieht er nie.',
  job: 'Darum eignet sich <code>effect</code> nicht, um jeden einzelnen Wert zu protokollieren. Dafür braucht man ein Observable.' },
{ id: 'o20', topic: 'Event Loop', heading: 'catch, then, finally', code: C`
Promise.reject(new Error('503'))
  .then(() => console.log('then'))
  .catch(e => console.log('catch ' + e.message))
  .then(() => console.log('weiter'))
  .finally(() => console.log('finally'));`, lines: ['catch 503', 'weiter', 'finally'], distract: ['then'],
  reasonWhy: 'Ein Fehler überspringt alle <code>then</code> bis zum nächsten <code>catch</code>. Danach ist die Kette wieder „gesund“ und läuft normal weiter.' },
{ id: 'o21', topic: 'Event Loop', heading: 'Was gibt async zurück?', code: C`
async function holeEntwickler() {
  return 'Leon';
}
const x = holeEntwickler();
console.log(typeof x);
x.then(n => console.log(n));
console.log('fertig');`, lines: ['object', 'fertig', 'Leon'], distract: ['string', 'undefined'],
  reasonWhy: 'Eine async-Funktion gibt <b>immer</b> ein Promise zurück, auch wenn sie sofort einen Wert hat. Und <code>.then</code> läuft frühestens als Microtask.' }
];

/* ---------- 👀 Code-Review-Arena ----------
   issues[].find: Text, der genau in der Problem-Zeile steht (wird beim Laden in eine Zeilennummer übersetzt).
   fallen[]: Zeilen, die verdächtig aussehen, aber in Ordnung sind. Wer sie markiert, bekommt die Erklärung. */
const REVIEWS = [
{
  id: 'r01', heading: 'Entwicklerliste mit Suche', author: 'Ricky', stage: 'Grundlagen', file: 'entwickler-liste.ts',
  pr: 'feat: Entwicklerliste mit Live-Suche und Auto-Refresh. „Läuft bei mir, bitte schnell mergen 🙏“',
  code: C`
@Component({
  selector: 'app-entwickler-liste',
  template: \`
    <input (input)="suche($event)" placeholder="Suchen…">
    @for (s of gefiltert; track $index) {
      <div class="karte">
        <b>{{ s.name }}</b> · {{ alterBerechnen(s.geburt) }} Jahre
        <p [innerHTML]="s.bio"></p>
      </div>
    }
  \`,
})
export class EntwicklerListe implements OnInit {
  private http = inject(HttpClient);
  entwickler: any[] = [];
  gefiltert: any[] = [];

  ngOnInit() {
    this.http.get<any[]>('/api/entwickler').subscribe(s => {
      this.entwickler = s;
      this.gefiltert = s;
    });
    interval(5000).subscribe(() => this.neuLaden());
  }

  suche(e: any) {
    const q = e.target.value;
    this.gefiltert = this.entwickler.filter(s => s.name.includes(q));
  }

  alterBerechnen(geburt: string) {
    return new Date().getFullYear() - new Date(geburt).getFullYear();
  }
}`,
  issues: [
    { find: 'interval(5000).subscribe', sev: 'blocker', heading: 'Abo endet nie (Speicherleck)', reasonWhy: 'interval läuft ewig. Verlässt man die Seite, lädt die Komponente im Hintergrund weiter neu, bei jedem Besuch ein Abo mehr.', fix: 'interval(5000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(…), oder gleich httpResource mit reload().' },
    { find: 'track $index', sev: 'wichtig', heading: 'track $index bei einer gefilterten Liste', reasonWhy: 'Beim Filtern verschieben sich die Positionen. Angular verwendet DOM-Elemente für die falschen Entwickler wieder (Fokus, Animationen, Zustand von Kind-Komponenten springen).', fix: 'track s.id' },
    { find: 'alterBerechnen(s.geburt)', sev: 'wichtig', heading: 'Methode im Template, und das Alter stimmt nicht', reasonWhy: 'Läuft bei jeder Change Detection für jede Karte neu. Außerdem falsch: Wer noch nicht Geburtstag hatte, ist ein Jahr jünger.', fix: 'Alter einmal beim Laden berechnen (computed oder Pipe), mit Monat und Tag.' },
    { find: 'entwickler: any[] = [];', sev: 'nit', heading: 'any statt Typ', reasonWhy: 'Tippfehler wie s.nmae fallen erst beim Kunden auf. Kein Autocomplete.', fix: 'interface Entwickler { id: number; name: string; geburt: string; bio: string }' },
    { find: 'this.entwickler = s;', sev: 'wichtig', heading: 'Zustand in normalen Feldern', reasonWhy: 'Mit OnPush oder zoneless merkt Angular die Zuweisung im subscribe nicht, die Liste bleibt leer. Und gefiltert ist eine zweite Kopie, die auseinanderlaufen kann.', fix: 'entwickler = toSignal(http.get<Entwickler[]>(…), { initialValue: [] }); suchbegriff = signal(\'\'); gefiltert = computed(…)' },
    { find: 's.name.includes(q)', sev: 'nit', heading: 'Suche unterscheidet Groß/Klein', reasonWhy: '„leon“ findet „Leon“ nicht. Kunden tippen auf dem Handy klein.', fix: 's.name.toLowerCase().includes(q.trim().toLowerCase())' }
  ],
  drop: [
    { find: '[innerHTML]="s.bio"', reasonWhy: 'Kein XSS: Angular säubert [innerHTML] automatisch und entfernt Skripte und Event-Handler. Gefährlich wird es erst mit bypassSecurityTrustHtml.' }
  ]
},
{
  id: 'r02', heading: 'Login und Zahlungen', author: 'Ricky', stage: 'Fortgeschritten', file: 'auth.service.ts',
  pr: 'feat: Login + Zahlungsdaten abrufen. Getestet mit meinem Account.',
  code: C`
@Service()
export class AuthService {
  private http = inject(HttpClient);
  private apiKey = 'sk_live_51Hx9pixelwerkGeheim';

  login(email: string, passwort: string) {
    return this.http.get<{ token: string }>(
      \`/api/login?email=\${email}&passwort=\${passwort}\`
    ).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        console.log('Login ok, Token:', res.token);
      })
    );
  }

  istEingeloggt(): boolean {
    return !!localStorage.getItem('token');
  }

  istAdmin(): boolean {
    const token = localStorage.getItem('token')!;
    return JSON.parse(atob(token.split('.')[1])).rolle === 'admin';
  }

  zahlungsDaten() {
    return this.http.get('/api/zahlung', {
      headers: { 'X-Api-Key': this.apiKey }
    });
  }
}`,
  issues: [
    { find: "private apiKey = 'sk_live", sev: 'blocker', heading: 'Geheimer Schlüssel im Frontend', reasonWhy: 'Alles im Frontend landet im JavaScript-Bundle. Jeder Kunde kann den Live-Schlüssel in den DevTools lesen und damit Zahlungen auslösen.', fix: 'Schlüssel gehört auf den Server. Das Frontend ruft das eigene Backend auf, das Backend redet mit dem Zahlungsanbieter. Schlüssel sofort rotieren!' },
    { find: '/api/login?email=', sev: 'blocker', heading: 'Passwort in der URL (GET)', reasonWhy: 'URLs landen in Server-Logs, Proxy-Logs, im Browser-Verlauf und im Referer-Header. Außerdem nicht encodiert: ein & im Passwort zerlegt die Anfrage.', fix: 'this.http.post(\'/api/login\', { email, passwort }), Passwort im Body über HTTPS.' },
    { find: "console.log('Login ok, Token:'", sev: 'wichtig', heading: 'Token in der Konsole', reasonWhy: 'Landet in Screenshots, Support-Videos und Log-Tools wie Sentry. Wer den Token hat, ist der Nutzer.', fix: 'Raus damit. Höchstens console.debug(\'Login ok\') ohne Token.' },
    { find: "localStorage.setItem('token'", sev: 'wichtig', heading: 'Token im localStorage', reasonWhy: 'Jedes Skript auf der Seite kann localStorage lesen. Eine einzige XSS-Lücke (oder eine kompromittierte npm-Bibliothek) und der Token ist weg.', fix: 'Besser: Session als HttpOnly-Cookie (Secure, SameSite) vom Server. JavaScript kommt dann gar nicht an den Token. Zumindest diskutieren.' },
    { find: "return !!localStorage.getItem('token');", sev: 'wichtig', heading: 'Abgelaufene Tokens zählen als eingeloggt', reasonWhy: 'Der Token ist nach einer Stunde abgelaufen, die App zeigt trotzdem „eingeloggt“ und jede Anfrage endet mit 401.', fix: 'exp aus dem Token prüfen und bei 401 per Interceptor erneuern oder ausloggen.' },
    { find: ".rolle === 'admin'", sev: 'frage', heading: 'Admin-Prüfung nur im Browser?', reasonWhy: 'Den Token-Inhalt kann jeder lesen und im Browser auch fälschen, die Signatur wird hier nicht geprüft. Für Menüpunkte okay, als Schutz wertlos.', fix: 'Frage an Jonas: Prüft das Backend die Rolle bei jeder Admin-Anfrage? Nur das zählt.' }
  ],
  drop: [
    { find: 'private http = inject(HttpClient);', reasonWhy: 'Völlig okay: inject() im Feld-Initialisierer ist modernes Angular.' }
  ]
},
{
  id: 'r03', heading: 'Bewerber-Suche', author: 'Neuer Werkstudent', stage: 'Fortgeschritten', file: 'bewerber-suche.ts',
  pr: 'Suche fürs Bewerber-Board. Erster PR, freue mich über Feedback!',
  code: C`
@Component({
  selector: 'app-bewerber-suche',
  imports: [ReactiveFormsModule, EntwicklerKarte],
  template: \`
    <input [formControl]="suchFeld" placeholder="Entwickler suchen">
    @for (t of treffer; track t.id) {
      <app-entwickler-karte [entwickler]="t" />
    }
  \`,
})
export class BewerberSuche {
  private api = inject(BewerberApi);
  suchFeld = new FormControl('');
  treffer: Entwickler[] = [];
  verlauf: string[] = [];

  constructor() {
    this.suchFeld.valueChanges.subscribe(q => {
      this.verlauf.push(q!);
      this.api.suche(q!).subscribe(t => {
        this.treffer = t;
      });
    });
  }
}`,
  issues: [
    { find: 'this.api.suche(q!).subscribe', sev: 'blocker', heading: 'Abo im Abo (Race Condition)', reasonWhy: 'Jeder Tastendruck startet eine Anfrage, keine wird abgebrochen. Kommt die Antwort für „L“ nach der für „Leon“, stehen die falschen Treffer da.', fix: 'valueChanges.pipe(switchMap(q => this.api.suche(q))), am besten direkt als toSignal.' },
    { find: 'this.suchFeld.valueChanges.subscribe', sev: 'wichtig', heading: 'Eine Anfrage pro Tastendruck', reasonWhy: '„Hoffmeister“ = 11 Anfragen. Das kostet Server und Akku und macht die Liste nervös.', fix: '.pipe(debounceTime(300), distinctUntilChanged(), filter(q => q.length >= 2), switchMap(…))' },
    { find: 'treffer: Entwickler[] = [];', sev: 'wichtig', heading: 'Ergebnis als normales Feld', reasonWhy: 'Mit zoneless oder OnPush wird die Zuweisung im subscribe nicht angezeigt. Und es gibt keinen Fehlerfall: Ein 500er hinterlässt eine leere Liste ohne Meldung.', fix: 'treffer = toSignal(suchFeld.valueChanges.pipe(…, catchError(() => of([]))), { initialValue: [] })' },
    { find: 'this.verlauf.push(q!);', sev: 'nit', heading: 'q! versteckt null, push verändert das Array', reasonWhy: 'FormControl liefert string | null (z. B. nach reset()). Das ! lügt den Compiler an. Und push auf geteilten Arrays macht später Ärger.', fix: 'new FormControl(\'\', { nonNullable: true }); verlauf als Signal mit update(v => [...v, q]).' }
  ],
  drop: [
    { find: '@for (t of treffer; track t.id)', reasonWhy: 'Genau richtig: track mit einer stabilen id.' },
    { find: "suchFeld = new FormControl('');", reasonWhy: 'Hier ist kein Leck: Das FormControl gehört der Komponente und verschwindet mit ihr, also auch sein valueChanges-Abo. Lecks entstehen bei Quellen, die länger leben (Services, interval, window).' }
  ]
},
{
  id: 'r04', heading: 'Pitch-Bilanz mit Signals', author: 'Ricky', stage: 'Profi', file: 'pitch-bilanz.ts',
  pr: 'refactor: Pitch-Bilanz auf Signals umgestellt 🚀',
  code: C`
@Component({
  selector: 'app-pitch-bilanz',
  template: \`
    <h2>{{ titel() }}</h2>
    <p>Punkte: {{ punkte() }} · Platz {{ platz() }}</p>
    <button (click)="gewonnen()">Gewonnen eintragen</button>
  \`,
})
export class PitchBilanz {
  pitches = input.required<Pitch[]>();
  titel = signal('Pitches 2026');
  punkte = signal(0);

  platz = computed(() => {
    const p = this.punkte();
    this.titel.set('Pitches 2026 · ' + p + ' Punkte');
    return p > 60 ? 1 : p > 40 ? 5 : 12;
  });

  constructor() {
    effect(() => {
      this.punkte.set(this.pitches().reduce((s, x) => s + x.punkte, 0));
    });
  }

  gewonnen() {
    this.pitches().push({ kunde: '?', punkte: 3 });
  }
}`,
  issues: [
    { find: "this.titel.set('Pitches", sev: 'blocker', heading: 'set() im computed', reasonWhy: 'computed soll nur ausrechnen. Angular wirft hier einen Fehler. Selbst wenn nicht: Nebenwirkungen in computed laufen unvorhersehbar oft oder gar nicht.', fix: "titel = computed(() => 'Pitches 2026 · ' + this.punkte() + ' Punkte')" },
    { find: 'this.punkte.set(this.pitches()', sev: 'wichtig', heading: 'effect, um ein Signal zu synchronisieren', reasonWhy: 'Zwei Wahrheiten, ein Takt Verzögerung (erst falscher Wert, dann richtiger) und unnötige Arbeit. effect ist für Dinge außerhalb von Angular (localStorage, Logging, DOM-Bibliotheken).', fix: 'punkte = computed(() => this.pitches().reduce((s, x) => s + x.punkte, 0))' },
    { find: 'this.pitches().push', sev: 'blocker', heading: 'Input wird von innen verändert', reasonWhy: 'Das Array gehört der Eltern-Komponente. push ändert es heimlich, kein Signal merkt es, die Punkte bleiben stehen. Und die Eltern-Komponente hat plötzlich andere Daten.', fix: 'gewonnenEingetragen = output<Pitch>(); Die Eltern-Komponente fügt hinzu (neues Array). Oder model() mit update(l => [...l, pitch]).' }
  ],
  drop: [
    { find: 'pitches = input.required<Pitch[]>();', reasonWhy: 'Korrekt: Pflicht-Input als Signal. Fehlt er, meldet der Compiler das schon im Template der Eltern.' },
    { find: '<button (click)="gewonnen()">', reasonWhy: 'Methode im (click) ist okay. Sie läuft nur beim Klick, nicht bei jeder Change Detection. Problematisch sind Methoden in {{ }} und [bindings].' }
  ]
},
{
  id: 'r05', heading: 'Backend-API (Express)', author: 'Jonas', stage: 'Wie das Web funktioniert', file: 'server.js',
  pr: 'Jonas: „Kannst du als Frontendler mal drüberschauen? CORS-Fehler hab ich jetzt gefixt.“',
  code: C`
const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.get('/api/entwickler/:id/loeschen', async (req, res) => {
  await db.entwickler.delete(req.params.id);
  res.send('ok');
});

app.post('/api/login', async (req, res) => {
  const user = await db.user.find(req.body.email);
  if (!user || user.passwort !== req.body.passwort) {
    return res.status(200).json({ fehler: 'Falsches Passwort' });
  }
  res.cookie('session', user.sessionId);
  res.json({ ok: true });
});

app.get('/api/team', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.json(await db.team.alle());
});

app.get('/api/konto', async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json(await db.konto.von(req.cookies.session));
});`,
  issues: [
    { find: "'Access-Control-Allow-Origin', '*'", sev: 'blocker', heading: 'CORS „gefixt“ mit Stern', reasonWhy: 'Stern plus Credentials verbietet der Browser sowieso: Anfragen mit Cookies scheitern weiter. Und ohne Credentials darf jede Webseite der Welt die API aus dem Browser des Kunden lesen.', fix: 'Erlaubte Origins als Liste. Origin der Anfrage prüfen und genau diesen zurückschicken, dazu Vary: Origin.' },
    { find: "'/api/entwickler/:id/loeschen'", sev: 'blocker', heading: 'Löschen per GET', reasonWhy: 'GET muss „sicher“ sein. Link-Vorschauen, Prefetching, Crawler oder ein <img src="…/loeschen"> auf einer fremden Seite löschen Entwickler (CSRF).', fix: 'app.delete(\'/api/entwickler/:id\'), Antwort 204 No Content.' },
    { find: 'user.passwort !== req.body.passwort', sev: 'blocker', heading: 'Passwörter im Klartext', reasonWhy: 'Die Datenbank kennt alle Passwörter. Ein Leak und alle Accounts (und die gleichen Passwörter woanders) sind offen.', fix: 'Nur Hashes speichern (argon2 oder bcrypt) und mit verify vergleichen.' },
    { find: "res.status(200).json({ fehler", sev: 'wichtig', heading: '200 OK für einen Fehler', reasonWhy: 'Für HttpClient ist das ein Erfolg: kein catchError, kein Interceptor greift, Monitoring sieht keine Fehler.', fix: 'res.status(401).json({ fehler: … })' },
    { find: "res.cookie('session', user.sessionId);", sev: 'blocker', heading: 'Session-Cookie ohne Schutz-Flags', reasonWhy: 'Ohne HttpOnly kann JavaScript (und damit jede XSS) das Cookie lesen. Ohne Secure geht es auch über http raus. Ohne SameSite hängt es vom Browser ab: Manche schicken das Cookie bei Anfragen von fremden Seiten mit (CSRF), Chrome nimmt ersatzweise eine lockere Lax-Variante an. Darauf verlässt man sich nicht.', fix: "res.cookie('session', id, { httpOnly: true, secure: true, sameSite: 'lax' })" },
    { find: ["app.get('/api/konto'", "'public, max-age=3600'"], sev: 'blocker', heading: 'Private Daten mit public-Cache', reasonWhy: '„public“ erlaubt CDNs und Proxys, die Antwort zu speichern. Der nächste Kunde hinter demselben Proxy sieht das Konto des vorigen.', fix: 'Cache-Control: private, no-store für alles, was vom Login abhängt.' }
  ],
  drop: [
    { find: "'public, max-age=86400'", reasonWhy: 'Okay: Das Team ist für alle gleich und öffentlich. public mit max-age entlastet den Server. Noch besser: zusätzlich ein ETag.' }
  ]
},
{
  id: 'r06', heading: 'Kunden-Feed', author: 'Agentur Quick & Dirty', stage: 'Experte', file: 'kunden-feed.ts',
  pr: 'Kunden-Feed v1. Lighthouse sagt 34, „liegt am Server“.',
  code: C`
@Component({
  selector: 'app-kunden-feed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <img [src]="banner">
    @for (post of posts(); track post.id) {
      <app-post [post]="post" [zeit]="formatiere(post.datum)" />
    }
    @defer (on viewport) {
      <app-kommentare />
    } @placeholder {
      <p>Kommentare…</p>
    }
  \`,
})
export class KundenFeed {
  private http = inject(HttpClient);
  banner = 'https://cdn.pixelwerk.de/banner-4k.png';
  posts = toSignal(this.http.get<Post[]>('/api/posts'), { initialValue: [] });

  formatiere(d: string) {
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(d));
  }

  @HostListener('window:scroll')
  beimScrollen() {
    document.querySelectorAll('app-post').forEach(el => {
      const h = document.body.scrollHeight;
      (el as HTMLElement).style.minHeight = h / 50 + 'px';
    });
  }
}`,
  issues: [
    { find: '<img [src]="banner">', sev: 'wichtig', heading: 'Riesiges Bild ohne Größe (LCP und CLS)', reasonWhy: 'Ein 4K-PNG für jedes Handy bremst das größte Element (LCP). Ohne width/height springt der Inhalt nach unten, sobald es lädt (CLS).', fix: '<img ngSrc="…" width="1200" height="400" priority> (NgOptimizedImage), dazu WebP/AVIF und srcset.' },
    { find: 'formatiere(post.datum)', sev: 'wichtig', heading: 'Teure Methode im Template', reasonWhy: 'Bei jeder Prüfung wird für jeden Post ein neuer Intl.DateTimeFormat gebaut. Der ist teuer.', fix: 'Formatter einmal als Feld anlegen und eine reine Pipe nutzen (oder date-Pipe). Oder die Zeit im computed vorbereiten.' },
    { find: 'const h = document.body.scrollHeight;', sev: 'blocker', heading: 'Layout Thrashing beim Scrollen', reasonWhy: 'In der Schleife wird abwechselnd Layout gelesen (scrollHeight) und Stil geschrieben. Jeder Lesezugriff erzwingt eine neue Layout-Berechnung (Forced Reflow), bei jedem Scroll-Event, für jeden Post. Das ruckelt.', fix: 'Erst alles lesen, dann alles schreiben, gebündelt in requestAnimationFrame. Besser: Problem per CSS lösen, oder IntersectionObserver statt scroll-Event.' },
    { find: "document.querySelectorAll('app-post')", sev: 'nit', heading: 'DOM direkt anfassen', reasonWhy: 'Vorbei an Angular: bricht bei SSR (kein document), und Angular weiß nichts von den Änderungen.', fix: 'Über ein Signal und [style.min-height] im Template, oder Renderer/afterNextRender für echte DOM-Arbeit.' }
  ],
  drop: [
    { find: '@defer (on viewport)', reasonWhy: 'Stark: Die Kommentare werden erst geladen, wenn man hinscrollt. Das macht das erste Bundle kleiner.' },
    { find: 'changeDetection: ChangeDetectionStrategy.OnPush', reasonWhy: 'Nicht falsch: Seit Angular 22 ist OnPush sowieso Standard, die Zeile ist nur überflüssig. Kein Grund für einen Kommentar.' }
  ]
}
];
REVIEWS.forEach(r => {
  const ls = r.code.split('\n');
  const at = f => ls.findIndex(l => l.includes(f)) + 1;
  r.issues.forEach(i => { i.lines = [].concat(i.find).map(at); });
  (r.fallen || []).forEach(f => { f.line = at(f.find); });
});

/* ---------- 🎤 Mock-Interview ----------
   punkte: was eine starke Antwort enthalten sollte (Selbstcheck und Bewertungsgrundlage für Toni).
   nach: typische Nachfrage des Interviewers. */
const INTERVIEW = [
{ id: 'i01', stage: 'Junior', topic: 'Web', q: 'Was passiert, wenn ich im Browser eine URL eintippe und Enter drücke?', points: ['DNS: Name wird in eine IP aufgelöst (mit Caches)', 'TCP-Verbindung und TLS-Handshake (HTTPS)', 'HTTP-Request, Server antwortet mit HTML', 'Browser parst HTML, lädt CSS/JS/Bilder nach', 'Rendern: DOM + CSSOM → Layout → Paint; bei einer SPA lädt danach JS die Daten'], after: 'Und wo genau würdest du nachschauen, wenn die Seite „nicht erreichbar“ meldet?' },
{ id: 'i02', stage: 'Junior', topic: 'HTTP', q: 'Erklär den Unterschied zwischen GET, POST, PUT, PATCH und DELETE. Was heißt „idempotent“?', points: ['GET liest, verändert nichts (sicher), cachebar', 'POST legt an / löst Aktion aus, nicht idempotent', 'PUT ersetzt komplett, PATCH ändert teilweise', 'Idempotent: mehrfach ausführen = gleiches Ergebnis (GET, PUT, DELETE)', 'Praxis: nur idempotente Anfragen automatisch wiederholen (retry)'], after: 'Darf ein Interceptor bei einem Timeout einen POST automatisch wiederholen?' },
{ id: 'i03', stage: 'Mid', topic: 'Web', q: 'Was ist CORS, wann kommt ein Preflight, und wie behebt man einen CORS-Fehler richtig?', points: ['Same-Origin-Policy: Protokoll + Host + Port müssen gleich sein', 'CORS: Server erlaubt fremde Origins per Access-Control-Allow-Origin', 'Preflight (OPTIONS) bei „nicht einfachen“ Anfragen: z. B. JSON-Content-Type, Authorization-Header, PUT/DELETE', 'Fix gehört auf den Server (oder Dev-Proxy in Angular), nicht ins Frontend', 'Mit Cookies: kein Stern, genaues Origin + Allow-Credentials'], after: 'Warum bekommst du mit curl keinen CORS-Fehler, im Browser aber schon?' },
{ id: 'i04', stage: 'Mid', topic: 'Security', q: 'Wo speicherst du einen Login-Token im Frontend, und was sind die Risiken?', points: ['localStorage: einfach, aber per XSS auslesbar', 'HttpOnly-Cookie: JS kommt nicht ran, dafür CSRF beachten (SameSite, CSRF-Token)', 'Kurzlebiger Access-Token + Refresh-Token', 'Token nie loggen, nie in URLs', 'Rechte prüft immer der Server'], after: 'Wie schützt Angular dich von Haus aus vor XSS, und wann nicht mehr?' },
{ id: 'i05', stage: 'Mid', topic: 'Security', q: 'Was sind XSS und CSRF, und was tut Angular dagegen?', points: ['XSS: fremdes Skript läuft auf meiner Seite', 'Angular escaped {{ }} und säubert [innerHTML] automatisch', 'Gefährlich: bypassSecurityTrust…, direktes DOM (nativeElement.innerHTML)', 'CSRF: fremde Seite löst Anfrage mit meinen Cookies aus', 'Gegenmittel: SameSite-Cookies, CSRF-Token (HttpClient liest XSRF-TOKEN), CSP als zweite Mauer'], after: 'Was ist eine Content Security Policy und welche Regel ist am wichtigsten?' },
{ id: 'i06', stage: 'Junior', topic: 'JavaScript', q: 'Erklär den Event Loop. Was ist der Unterschied zwischen Microtasks und Macrotasks?', points: ['JavaScript ist single-threaded, ein Call Stack', 'Macrotasks: setTimeout, Events, I/O, je einer pro Runde', 'Microtasks: Promise.then, queueMicrotask, await-Fortsetzung', 'Nach jedem Task werden ALLE Microtasks abgearbeitet, dann ggf. gerendert', 'Lange synchrone Arbeit blockiert Klicks und Rendering'], after: 'Im Code stehen nacheinander ein console.log, ein setTimeout mit 0 Millisekunden und ein Promise.then. In welcher Reihenfolge erscheinen die drei Ausgaben?' },
{ id: 'i07', stage: 'Mid', topic: 'Angular', q: 'Wie funktioniert Change Detection in Angular? Was ändern OnPush und zoneless?', points: ['Früher: zone.js merkt Events/Timer/HTTP und prüft danach den ganzen Baum', 'OnPush (seit v22 Standard, alter Modus heißt Eager): Komponente nur bei neuem Input, Event in ihr, async-Pipe oder Signal-Änderung', 'Signals melden genau, welche Ansicht betroffen ist', 'Zoneless: kein zone.js mehr, Auslöser sind Signals, Events, markForCheck', 'Folge: Mutationen (push) werden nicht erkannt, immutable arbeiten'], after: 'Was bedeutet der Fehler „ExpressionChangedAfterItHasBeenChecked“?' },
{ id: 'i08', stage: 'Mid', topic: 'Angular', q: 'Signals oder Observables: Wann nimmst du was?', points: ['Signal: synchroner Zustand, immer ein aktueller Wert, für Templates', 'Observable: Ereignisse über Zeit, asynchron, Abbrechen, Operatoren', 'Typisch: HTTP/Events mit RxJS, Ergebnis per toSignal in den Zustand', 'computed statt abgeleitete Kopien, effect nur für Nebenwirkungen nach außen', 'Neu: resource/httpResource für Laden mit Status'], after: 'Warum solltest du in einem effect kein anderes Signal setzen?' },
{ id: 'i09', stage: 'Mid', topic: 'RxJS', q: 'Erklär switchMap, mergeMap, concatMap und exhaustMap jeweils mit einem Beispiel aus der Praxis.', points: ['switchMap: nur das Neueste zählt, Alte abbrechen (Suche, Routen-Parameter)', 'mergeMap: alles parallel (unabhängige Uploads)', 'concatMap: der Reihe nach (Speichern, Reihenfolge wichtig)', 'exhaustMap: ignorieren solange beschäftigt (Login, Bezahlen, Doppelklick)', 'Falsche Wahl = Race Condition oder doppelte Buchung'], after: 'Warum ist switchMap für einen „Bezahlen“-Button gefährlich?' },
{ id: 'i10', stage: 'Mid', topic: 'Angular', q: 'Wie findest und vermeidest du Speicherlecks in einer Angular-App?', points: ['Messen: Memory-Tab, Heap Snapshots vergleichen, detached DOM', 'Ursachen: Abos ohne Ende, Timer, globale Listener, Fremd-Bibliotheken', 'takeUntilDestroyed, DestroyRef.onDestroy, async-Pipe/toSignal', 'HTTP-Abos und (click) sind keine Lecks', 'Im Review fragen: Endet dieser Stream?'], after: 'Ist valueChanges eines eigenen FormControls ein Leck?' },
{ id: 'i11', stage: 'Senior', topic: 'Angular', q: 'Erklär die Dependency Injection in Angular: Hierarchie, providedIn und wann du einen Service in einer Komponente bereitstellst.', points: ['Injector-Baum: Element-Injectoren → Environment (Route, root) → Platform', 'providedIn: root = Singleton, tree-shakeable', 'providers in Komponente = eigene Instanz pro Komponente (z. B. Formular-Zustand, Wizard)', 'InjectionToken für Konfiguration, useFactory/useValue/useExisting', 'inject() mit optional/self/skipSelf, Injection Context'], after: 'Wie würdest du in einem Test einen Service austauschen?' },
{ id: 'i12', stage: 'Senior', topic: 'Performance', q: 'Die App ist langsam. Wie gehst du vor?', points: ['Erst messen: Lighthouse/Web Vitals (LCP, INP, CLS), Performance-Tab, Angular DevTools Profiler', 'Laden: Bundle-Größe, Lazy Routes, @defer, Bilder (NgOptimizedImage), Caching', 'Laufzeit: Change Detection (OnPush/Signals), Methoden im Template, track', 'Browser: Layout Thrashing, lange Tasks, große Listen virtualisieren', 'Nachher wieder messen, Budget in CI'], after: 'Was ist INP und was verschlechtert ihn typischerweise?' },
{ id: 'i13', stage: 'Senior', topic: 'Angular', q: 'SSR und Hydration: Was ist das, wann lohnt es sich, und was sind typische Stolperfallen?', points: ['Server rendert HTML: schneller erster Inhalt, SEO, Link-Vorschauen', 'Hydration: Angular übernimmt das HTML, statt es neu zu bauen', 'Stolperfallen: window/document/localStorage auf dem Server, Zufall/Zeit → Mismatch', 'Lösungen: afterNextRender, isPlatformBrowser, TransferState / HTTP-Cache', 'Incremental Hydration mit @defer (hydrate on …)'], after: 'Warum wird eine Anfrage manchmal doppelt geschickt, einmal auf dem Server und einmal im Browser?' },
{ id: 'i14', stage: 'Senior', topic: 'Architektur', q: 'Wie würdest du eine große Angular-App mit mehreren Teams strukturieren?', points: ['Nach Fachlichkeit schneiden (Features/Domains), nicht nach Technik', 'Klare Grenzen: öffentliche API pro Bereich, Lint-Regeln für Abhängigkeiten (z. B. Nx)', 'Smart/Container vs. Presentational Components', 'State nah am Feature, nur wirklich Globales global', 'Monorepo vs. Microfrontends ehrlich abwägen (Kosten!)'], after: 'Wann würdest du von Microfrontends abraten?' },
{ id: 'i15', stage: 'Senior', topic: 'Architektur', q: 'State Management: Signals-Service, NgRx Signal Store oder klassisches NgRx? Wie entscheidest du?', points: ['Erst fragen: Wie viel Zustand wird wirklich geteilt?', 'Kleiner/mittlerer Zustand: Service mit Signals + computed', 'Signal Store: Struktur, Erweiterungen, wenig Boilerplate', 'Klassisches NgRx: Events/Actions, DevTools, große Teams, komplexe Abläufe', 'Server-Zustand (Cache) ist etwas anderes als UI-Zustand'], after: 'Was gehört NICHT in einen globalen Store?' },
{ id: 'i16', stage: 'Mid', topic: 'Testing', q: 'Wie testest du eine Komponente, die Daten per HttpClient lädt?', points: ['TestBed mit provideHttpClient + provideHttpClientTesting', 'HttpTestingController: expectOne(url), flush(daten), verify()', 'Was der Nutzer sieht prüfen (DOM), nicht Interna', 'Fehlerfall und Ladezustand testen', 'Alternativ Service mocken, wenn HTTP nicht der Punkt ist'], after: 'Was ist der Unterschied zwischen Unit-, Integrations- und E2E-Tests, und wie viele von welchen?' },
{ id: 'i17', stage: 'Junior', topic: 'Tooling', q: 'Was steht in package.json und package-lock.json, und was bedeuten ^ und ~?', points: ['package.json: gewünschte Abhängigkeiten mit Versionsbereich, Skripte', 'Lockfile: exakt installierte Versionen (reproduzierbar), gehört ins Repo', '^1.2.3 = bis unter 2.0.0, ~1.2.3 = bis unter 1.3.0', 'npm ci in CI (hält sich streng ans Lockfile)', 'dependencies vs. devDependencies, peerDependencies'], after: 'Ein Paket hat eine Sicherheitslücke, aber nur als Abhängigkeit einer Abhängigkeit. Was tust du?' },
{ id: 'i18', stage: 'Mid', topic: 'HTTP', q: 'Wie funktioniert HTTP-Caching? Erklär Cache-Control und ETag.', points: ['Cache-Control: max-age, no-cache (immer nachfragen), no-store (nie speichern)', 'public vs. private (CDN darf / nur Browser)', 'ETag + If-None-Match → 304 Not Modified (spart Daten)', 'Dateien mit Hash im Namen (main.a1b2.js): lange cachen; index.html: nicht', 'Private Daten nie public cachen'], after: 'Warum bekommen Nutzer nach einem Deploy manchmal eine kaputte App, und wie verhinderst du das?' },
{ id: 'i19', stage: 'Mid', topic: 'Angular', q: 'Was macht der Angular Router für dich? Erklär Lazy Loading, Guards und Resolver.', points: ['URL ↔ Komponente, Parameter als Input (withComponentInputBinding)', 'loadComponent/loadChildren: Code erst laden, wenn gebraucht', 'Guards (canActivate, canMatch) als Funktionen, geben UrlTree zurück zum Umleiten', 'Guards sind UX, nicht Sicherheit: Server prüft', 'Resolver vs. Laden in der Komponente (Ladezustand sichtbar)'], after: 'Was ist der Unterschied zwischen canActivate und canMatch?' },
{ id: 'i20', stage: 'Senior', topic: 'Senior-Skills', q: 'Erzähl von einem schwierigen Bug, den du gelöst hast. Wie bist du vorgegangen?', points: ['Situation kurz: Auswirkung auf Nutzer/Business', 'Systematisch: reproduzieren, eingrenzen, Hypothesen prüfen (nicht raten)', 'Werkzeuge nennen (DevTools, Logs, git bisect, Tests)', 'Ursache UND Fix UND wie man Wiederholung verhindert (Test, Monitoring)', 'Was du daraus gelernt hast'], after: 'Was hättest du anders gemacht, wenn du es nochmal machen müsstest?' },
{ id: 'i21', stage: 'Senior', topic: 'Senior-Skills', q: 'Wie machst du ein gutes Code Review?', points: ['Reihenfolge: korrekt → sicher → Lecks → Zustand → lesbar → Performance', 'Kommentare: was, warum, Vorschlag, Schwere (Muss/Blocker, Nit, Frage)', 'Kleine PRs einfordern, Automatisches dem Linter überlassen', 'Ton: Fragen statt Urteile, Lob für Gutes', 'Bei Hin und Her: kurz reden statt 20 Kommentare'], after: 'Ein Senior-Kollege ignoriert deine Kommentare und merged trotzdem. Was tust du?' },
{ id: 'i22', stage: 'Senior', topic: 'Senior-Skills', q: 'Eure App läuft auf Angular 14 mit NgModules. Wie planst du die Migration auf aktuelles Angular?', points: ['Schrittweise, eine Major-Version nach der anderen (ng update, update.angular.dev)', 'Erst Tests und CI absichern', 'Schematics: standalone, neuer Control Flow, inject(), Signal-Inputs, @Service()', 'Parallel Fachliches liefern, Migration in kleinen PRs', 'Risiken: Abhängigkeiten von Drittbibliotheken prüfen'], after: 'Wie überzeugst du den Product Owner, dafür Zeit freizugeben?' },
{ id: 'i23', stage: 'Mid', topic: 'Web', q: 'Was passiert im Browser zwischen HTML und Pixeln? Was ist ein Reflow und warum ist er teuer?', points: ['HTML → DOM, CSS → CSSOM, zusammen der Render Tree', 'Layout (Reflow): Größen und Positionen berechnen', 'Paint und Compositing', 'Reflow betrifft oft große Teile der Seite; erzwungen durch Lesen von Maßen nach Schreiben (Layout Thrashing)', 'transform/opacity laufen auf dem Compositor, ohne Layout'], after: 'Warum animiert man lieber transform als top/left?' },
{ id: 'i24', stage: 'Senior', topic: 'Angular', q: 'Wie baust du ein eigenes Formular-Element, das mit Reactive Forms funktioniert?', points: ['ControlValueAccessor: writeValue, registerOnChange, registerOnTouched, setDisabledState', 'Bereitstellen per NG_VALUE_ACCESSOR (multi, forwardRef)', 'Barrierefreiheit: Label, Tastatur, aria', 'Validierung über Validator-Interface oder vom Eltern-Formular', 'Neu: Signal Forms als Alternative im Blick'], after: 'Wann brauchst du stattdessen einfach input() und output()?' }
];
