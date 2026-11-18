
/* ================= Phase: PROBEZEIT ================= */
AKTE.push({ n: 2, title: 'Probezeit', sub: 'Events, computed, @if/@for, Komponenten verbinden, Services, effect(), Angulars Eigenarten' });

CH.push({
  id: 'k06', akt: 2, title: 'Die Kudos-Wand', tag: 'Events ( )', xp: 100,
  doku: [['Ereignisse im Template abfangen', 'https://angular.dev/guide/templates/event-listeners'], ['Ausdrücke im Template', 'https://angular.dev/guide/templates/expression-syntax']],
  ticket: { id: 'PW-119', typ: 'Feature', titel: 'Kudos-Wand mit Eingabe', text: 'Kollegen sollen ihren Namen eintippen und auf „Kudos“ klicken können. Der Name erscheint dann auf der Wand.' },
  story: [
    ['sara', 'Die Geschäftsführung will mehr Teamgefühl im Board. Erster Schritt: eine Kudos-Wand.'],
    ['toni', 'Bisher redet nur die Klasse mit dem HTML. Jetzt redet das HTML zurück: Klicks, Tippen, Absenden.']
  ],
  slides: [
    { t: '( ) = auf Ereignisse hören', say: 'Runde Klammern hören auf Ereignisse. Passiert etwas, ruft Angular deine Methode auf.', job: 'Jeder Knopf, jedes Suchfeld, jedes Formular in einer Firmen-App hängt an genau so einem Event. Wenn „der Knopf nichts macht“, prüf zuerst, ob (click) auf dem richtigen Element sitzt.',
      code: C`
<button (click)="kudosGeben()">Kudos geben</button>`,
      notes: [['(click)', 'Das Ereignis, auf das gehorcht wird: ein Klick.'], ['"kudosGeben()"', 'Das passiert dann: Angular ruft kudosGeben() in deiner Klasse auf.']],
      pro: 'Links in ( ) steht immer ein Ereignis-Name vom Browser: click, input, keyup, focus, blur … Rechts steht, was passieren soll.' },
    { t: 'Was getippt wurde: Schritt für Schritt', say: 'Bei jedem Ereignis schickt der Browser einen Zettel mit: $event. Darauf steht, WO es passiert ist und WAS.', job: 'Bei Bugs mit Eingabefeldern hilft console.log($event) sofort: Du siehst, was wirklich ankommt. Oft ist es ein String, obwohl eine Zahl erwartet wird.',
      code: C`
<input (input)="getippt($event)" />
<p>Hallo {{ name() }}</p>

getippt(e: Event) {
  const feld = e.target as HTMLInputElement;
  const text = feld.value;
  this.name.set(text);
}`,
      notes: [['(input)', 'Bei JEDEM getippten Buchstaben …'], ['getippt($event)', '… ruf getippt() auf und gib den Zettel ($event) mit.'], ['getippt(e: Event)', 'Die Methode in der Klasse. e ist der Zettel, sein Typ heißt Event.'], ['e.target', 'target = Ziel. Das Element, in dem getippt wurde: dieses Eingabefeld.'], ['as HTMLInputElement', 'Sagt TypeScript: „Das ist ein Eingabefeld.“ Sonst weiß TypeScript nicht, dass es .value hat.'], ['feld.value', 'value = der Text, der gerade im Feld steht, z. B. „Leo“.'], ['this.name.set', 'Den Text ins Signal legen. Oben im <p> steht sofort „Hallo Leo“.']],
      pro: 'Lies es als Satz: „Bei jedem Tippen: nimm das Feld, hol seinen Text, leg ihn in name.“ Mehr passiert nicht.' },
    { t: 'Die Kurzform (sieht man oft)', say: 'Dasselbe wie eben, nur in eine Zeile gequetscht. Keine Panik, es sind genau die gleichen Teile.', job: 'Diese Kurzform steht in fast jedem Firmenprojekt. Wenn du sie lesen kannst, verstehst du 90 % der Templates.',
      code: C`
<input (input)="name.set($any($event.target).value)" />

<input (keyup.enter)="suchen()" />`,
      notes: [['$event.target', 'Wie eben: der Zettel, und darauf das Feld.'], ['$any(', '$any( … ) schaltet die Typprüfung für diesen Ausdruck ab: „TypeScript, vertrau mir.“ Ähnlich wie „as HTMLInputElement“, nur ohne jede Prüfung. Im Browser macht es nichts.'], ['.value)', 'Der Text im Feld.'], ['name.set(', 'Und ab ins Signal. Fertig.'], ['keyup.enter', 'Bonus: Nur wenn Enter losgelassen wird. Angular filtert die Taste für dich.']],
      pro: 'Von innen nach außen lesen: $event → .target → .value → name.set(…). Wenn dir die Kurzform zu wild ist: nimm die lange Version mit Methode. Im Job ist die oft sogar beliebter, weil man sie besser lesen und testen kann.' }
  ],
  quiz: [{ q: 'Mit welchen Klammern meldet das Template einen Klick an die Klasse?', options: ['[click]', '(click)', '{{click}}', '#click'], correct: 1, why: 'Runde Klammern sind das Event Binding: Das Template meldet ein Ereignis an die Klasse.' },
    { q: 'Jemand tippt „Leo“ in ein Eingabefeld, und das Feld meldet das mit <code>(input)</code>. Wo steht der Text „Leo“?', options: ['$event', '$event.target', '$event.target.value', 'name'], correct: 2, why: '$event ist der Zettel zum Ereignis, .target ist das Feld, und .value ist der Text im Feld.' },
    { q: 'Wofür ist <code>$any( … )</code> im Template da, zum Beispiel in <code>$any($event.target).value</code>?', options: ['Es wandelt den Wert in einen String um', 'Es sagt nur TypeScript: „Vertrau mir, das passt“', 'Es prüft im Browser, ob target existiert', 'Es fängt Fehler ab, wenn value leer ist'], correct: 1, why: 'Im Browser passiert durch $any nichts. Es schaltet nur die Typprüfung von TypeScript für diesen Ausdruck ab.' }],
  ex: { id: 'ex06', title: 'Kudos-Wand', goal: 'Kollegen tippen ihren Namen und verteilen Kudos.', preview: 'KudosWand',
    todo: ['Das <code>&lt;input&gt;</code> setzt bei <code>(input)</code> das Signal <code>name</code>', 'Das <code>&lt;input&gt;</code> zeigt immer den aktuellen Namen: <code>[value]</code> an <code>name()</code>. So ist es nach dem Löschen wieder leer', '<code>&lt;p class="gruss"&gt;</code> zeigt <b>Hallo NAME!</b>', '<code>button.loeschen</code> ruft <code>loeschen()</code> auf (setzt name auf <code>\'\'</code>)', '<code>button.kudos</code> zählt <code>kudos</code> hoch (in <code>span.kudos</code>)'],
    starter: C`
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-kudos-wand',
  template: \`
    <input placeholder="Dein Name" />
    <p class="gruss">Hallo !</p>
    <button class="loeschen">Löschen</button>

    <button class="kudos">👏 Kudos</button>
    <span class="kudos">{{ kudos() }}</span>
  \`,
})
export class KudosWand {
  name = signal('');
  kudos = signal(0);

  loeschen() {
    // name leeren
  }
}
`,
    solution: C`
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-kudos-wand',
  template: \`
    <input placeholder="Dein Name" [value]="name()" (input)="name.set($any($event.target).value)" />
    <p class="gruss">Hallo {{ name() }}!</p>
    <button class="loeschen" (click)="loeschen()">Löschen</button>

    <button class="kudos" (click)="kudos.update(anzahl => anzahl + 1)">👏 Kudos</button>
    <span class="kudos">{{ kudos() }}</span>
  \`,
})
export class KudosWand {
  name = signal('');
  kudos = signal(0);

  loeschen() {
    this.name.set('');
  }
}
`,
    notes: [['[value]="name()"', 'Feld zeigt immer den aktuellen Namen. Nach Löschen ist es leer.'], ['(input)=', 'Beim Tippen: Text ins Signal name.'], ['Hallo {{ name() }}!', 'Zeigt den Namen.'], ['(click)="loeschen()"', 'Klick ruft die Methode.'], ['kudos.update', 'Geht auch direkt im Template. anzahl ist der alte Wert, den Namen wählst du frei.'], ["this.name.set('')", 'Leerer Text.']],
    hints: ['Am input: <code>(input)="name.set($any($event.target).value)"</code>', 'Gruß: <code>Hallo {{ name() }}!</code>', 'Dasselbe input bekommt noch <code>[value]="name()"</code>. Eckige Klammern kennst du von <code>[disabled]</code>.', 'Kudos-Knopf: <code>(click)="kudos.update(anzahl =&gt; anzahl + 1)"</code>'],
    tests: [
      { name: 'Tippen setzt name', run: async T => { const f = T.mount(T.cmp('KudosWand')); await f.type('input', 'Kerim'); T.eq(f.instance.name(), 'Kerim', 'Nach dem Tippen ist name() nicht "Kerim". Fehlt (input)="..."?'); } },
      { name: 'p.gruss zeigt „Hallo Kerim!“', run: async T => { const f = T.mount(T.cmp('KudosWand')); await f.type('input', 'Kerim'); T.ok(f.q('p.gruss'), 'Kein <p class="gruss"> gefunden.'); T.eq(f.q('p.gruss').textContent.trim(), 'Hallo Kerim!', 'p.gruss soll „Hallo Kerim!“ zeigen. Steht {{ name() }} zwischen „Hallo “ und „!“?'); } },
      { name: 'Löschen leert den Namen', run: async T => { const f = T.mount(T.cmp('KudosWand')); await f.type('input', 'Kerim'); await f.click('button.loeschen'); T.eq(f.instance.name(), '', 'Nach Löschen ist name() nicht leer.'); T.eq(f.q('p.gruss').textContent.trim(), 'Hallo !', 'Gruß sollte wieder „Hallo !“ sein.'); } },
      { name: 'Feld ist nach Löschen leer', run: async T => { const f = T.mount(T.cmp('KudosWand')); await f.type('input', 'Kerim'); await f.click('button.loeschen'); T.eq(f.q('input').value, '', 'Nach Löschen soll auch das Eingabefeld leer sein. Hat das input [value]="name()"?'); } },
      { name: 'Kudos-Knopf zählt', run: async T => { const f = T.mount(T.cmp('KudosWand')); await f.click('button.kudos'); await f.click('button.kudos'); T.eq(f.q('span.kudos').textContent.trim(), '2', 'Nach 2 Klicks soll span.kudos 2 zeigen. Hat button.kudos ein (click) mit kudos.update(...)?'); } }
    ] },
  merke: ['(event)="code" = HTML meldet an Klasse.', '$event = das Ereignis.', '[ ] rein, ( ) raus. [( )] für beides lernst du später mit model().']
});

CH.push({
  id: 'k07', akt: 2, title: 'Das Team', tag: 'computed()', xp: 100,
  doku: [['Signals im Überblick', 'https://angular.dev/guide/signals'], ['Abhängiger Zustand mit linkedSignal', 'https://angular.dev/guide/signals/linked-signal'], ['Kontrollfluss mit @if und @for', 'https://angular.dev/guide/templates/control-flow']],
  ticket: { id: 'PW-120', typ: 'Bug', titel: 'Gesamtzahl im Projektteam stimmt nicht', text: 'Kommt ein Entwickler dazu, zeigt die Liste 8, die Gesamtzahl aber 7. Die Summe wird an zwei Stellen von Hand gerechnet. Ein Projekt hat höchstens 11 Plätze.' },
  story: [
    ['mia', 'Ich hab getestet: Entwickler hinzufügen, Liste sagt 8, Kopfzeile sagt 7.'],
    ['du', 'Ich mach ein drittes Signal und rechne bei jeder Änderung von Hand nach?'],
    ['toni', 'Dann vergisst du es einmal und Mia findet den nächsten Bug. Lass Angular rechnen: computed().']
  ],
  slides: [
    { t: 'computed = rechnet selbst', say: 'computed leitet einen Wert aus anderen Signals ab. Automatisch.', job: 'Summen, Filter, „ist voll“, „hat Fehler“: Alles, was sich aus anderen Daten ergibt, ist in Firmen-Code ein computed. Speichert jemand so einen Wert doppelt, ist das ein typischer Review-Fund.',
      code: C`
frontend = signal(4);
backend = signal(3);

gesamt = computed(() => this.frontend() + this.backend());
voll = computed(() => this.gesamt() >= 11);

this.frontend.set(8);
this.gesamt();
this.voll();`,
      notes: [['signal(4)', 'Zwei normale Signals.'], ['computed(() =>', 'Rechenregel. Läuft neu, wenn sich frontend oder backend ändern.'], ['voll = computed', 'computed kann auch andere computed lesen.'], ['set(8)', 'Quelle ändern …'], ['this.gesamt();', '… und gesamt ist sofort 11.'], ['this.voll();', 'true. Ganz von selbst.']],
      pro: 'computed ist lazy (rechnet erst beim Lesen) und cached. Kein set() darauf. Nie Signals in computed setzen. Überschreibbar abgeleitet? Dann linkedSignal().' }
  ],
  quiz: [{ q: '<code>gesamt</code> ist ein computed aus den Signals frontend und backend. Was passiert bei <code>gesamt.set(20)</code>?', options: ['gesamt wird 20, bis sich frontend ändert', 'Das geht nicht, ein computed ist nur lesbar', 'frontend und backend werden passend angepasst', 'gesamt wird 20 und bleibt dauerhaft 20'], correct: 1, why: 'Ein computed hat kein set. Soll sich der Wert ändern, änderst du die Signals, aus denen er berechnet wird.' },
    { q: 'Wann rechnet <code>gesamt = computed(() =&gt; this.frontend() + this.backend())</code> neu?', options: ['Jede Sekunde', 'Wenn jemand gesamt() liest und sich frontend oder backend seit dem letzten Mal geändert hat', 'Bei jedem Klick irgendwo in der App', 'Nur einmal beim Start'], correct: 1, why: 'computed ist lazy und merkt sich das Ergebnis. Es rechnet erst beim Lesen neu, und nur dann, wenn sich eine Quelle geändert hat.' },
    { q: 'Gegeben sind <code>anzahl = signal(0)</code> und <code>doppelt = computed(() =&gt; this.anzahl() * 2)</code>. Dann läuft <code>this.anzahl.set(5)</code>. Was liefert <code>this.doppelt()</code>?', options: ['10', '0', '5', 'undefined, bis man doppelt neu anlegt'], correct: 0, why: 'computed liest anzahl und hängt daran. Nach set(5) liefert doppelt() beim nächsten Lesen 5 * 2 = 10.' }
  ],
  ex: { id: 'ex07', title: 'Ist das Team voll?', goal: 'Lass Angular das Team zählen.', preview: 'Team',
    todo: ['<code>gesamt</code> = computed: frontend + backend', '<code>voll</code> = computed: true ab 11', '<code>freiePlaetze</code> = computed: 11 − gesamt, nie unter 0', '<code>p.gesamt</code> zeigt gesamt, <code>p.voll</code> zeigt „Team voll!“ oder „Noch X Plätze frei“ (mit <code>@if (voll()) {…} @else {…}</code>: Vorschau aufs nächste Kapitel, die Vorlage steht im letzten Tipp)'],
    starter: C`
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-team',
  template: \`
    <button (click)="frontend.update(anzahl => anzahl + 1)">+ Frontend</button>
    <button (click)="backend.update(anzahl => anzahl + 1)">+ Backend</button>
    <p class="gesamt"></p>
    <p class="voll"></p>
  \`,
})
export class Team {
  frontend = signal(4);
  backend = signal(3);

  // gesamt, voll, freiePlaetze
}
`,
    solution: C`
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-team',
  template: \`
    <button (click)="frontend.update(anzahl => anzahl + 1)">+ Frontend</button>
    <button (click)="backend.update(anzahl => anzahl + 1)">+ Backend</button>
    <p class="gesamt">{{ gesamt() }}</p>
    <p class="voll">
      @if (voll()) { Team voll! } @else { Noch {{ freiePlaetze() }} Plätze frei }
    </p>
  \`,
})
export class Team {
  frontend = signal(4);
  backend = signal(3);

  gesamt = computed(() => this.frontend() + this.backend());
  voll = computed(() => this.gesamt() >= 11);
  freiePlaetze = computed(() => Math.max(0, 11 - this.gesamt()));
}
`,
    notes: [['frontend.update(anzahl', 'anzahl ist der alte Wert. Den Namen links vom Pfeil wählst du frei, er gilt nur in dieser kleinen Funktion.'], ['{{ gesamt() }}', 'computed liest man wie ein Signal.'], ['@if (voll())', 'Wenn voll: erster Text, sonst der zweite.'], ['gesamt = computed', 'Addiert beide Signals.'], ['voll = computed', 'Vergleich ergibt true/false.'], ['Math.max(0,', 'Nimmt die größere Zahl. So nie unter 0.']],
    hints: ['<code>gesamt = computed(() =&gt; this.frontend() + this.backend());</code>', '<code>voll = computed(() =&gt; this.gesamt() &gt;= 11);</code>', 'Nie unter 0: <code>Math.max(0, 11 - this.gesamt())</code>', 'Im <code>p.voll</code>: <code>@if (voll()) { Team voll! } @else { Noch {{ freiePlaetze() }} Plätze frei }</code>'],
    tests: [
      { name: 'gesamt ist computed und ergibt 7', run: T => { const f = T.mount(T.cmp('Team')); const g = f.instance.gesamt; T.ok(T.isComputed(g), 'gesamt soll computed(...) sein.'); T.eq(g(), 7, 'gesamt soll 7 sein.'); } },
      { name: 'gesamt rechnet neu', run: T => { const f = T.mount(T.cmp('Team')); f.instance.frontend.set(10); T.eq(f.instance.gesamt(), 13, 'Nach frontend.set(10) soll gesamt 13 sein.'); } },
      { name: 'voll ab 11', run: T => { const f = T.mount(T.cmp('Team')); T.ok(T.isComputed(f.instance.voll), 'voll soll computed sein.'); T.eq(f.instance.voll(), false, 'Bei 7 ist das Team nicht voll.'); f.instance.backend.set(7); T.eq(f.instance.voll(), true, 'Bei genau 11 soll voll true sein.'); } },
      { name: 'freiePlaetze nie unter 0', run: T => { const f = T.mount(T.cmp('Team')); T.eq(f.instance.freiePlaetze(), 4, 'Bei 7 Entwicklern sind 4 frei.'); f.instance.frontend.set(20); T.eq(f.instance.freiePlaetze(), 0, 'Bei 23 Entwicklern soll 0 kommen, nicht -12.'); } },
      { name: 'Template zeigt alles', run: async T => { const f = T.mount(T.cmp('Team')); T.eq(f.q('p.gesamt').textContent.trim(), '7', 'p.gesamt soll gesamt zeigen, am Anfang 7. Steht {{ gesamt() }} darin?'); T.ok(/4/.test(f.q('p.voll').textContent) && !/voll!/.test(f.q('p.voll').textContent), 'p.voll soll bei 7 „Noch 4 Plätze frei“ zeigen.'); f.instance.frontend.set(8); await T.flush(); T.ok(/voll/i.test(f.q('p.voll').textContent), 'Bei 11 soll p.voll „Team voll!“ zeigen.'); } }
    ] },
  merke: ['computed(() => …) = abgeleiteter Wert.', 'Nur lesbar, rechnet selbst neu.', 'Was man ausrechnen kann, speichert man nicht.']
});

CH.push({
  id: 'k08', akt: 2, title: 'Wer ist im Projekt?', tag: '@if · @for', xp: 110,
  doku: [['Control Flow: @if, @for, @switch', 'https://angular.dev/guide/templates/control-flow'], ['Migration auf Control-Flow-Syntax', 'https://angular.dev/reference/migrations/control-flow']],
  ticket: { id: 'PW-121', typ: 'Feature', titel: 'Projektbesetzung als Liste', text: 'Sara will sehen, wer diese Woche im Projekt ist. Ist niemand da, soll „Keiner da“ erscheinen statt einer leeren Fläche.' },
  story: [
    ['sara', 'Akzeptanzkriterium zwei ist wichtig: Eine leere Liste darf nie einfach weiß bleiben.'],
    ['ricky', 'Bei Quick & Dirty kopieren wir einfach zehnmal das div. Hehe.'],
    ['toni', 'Wir machen das in drei Zeilen. Und mit dem Leer-Zustand, den Ricky immer vergisst.']
  ],
  slides: [
    { t: '@for = für jeden Entwickler', say: '@for wiederholt HTML für jedes Element einer Liste.', job: 'Ist bei @for das track schlecht gewählt, baut Angular bei jeder Änderung alle Zeilen neu. Bei langen Listen merkt man das. Nimm eine eindeutige id.',
      code: C`
<ul>
  @for (person of entwickler(); track person.id) {
    <li>{{ $index + 1 }}. {{ person.name }}</li>
  } @empty {
    <li>Keiner da</li>
  }
</ul>`,
      notes: [['@for (person of entwickler()', 'Für jede person in der Liste entwickler(). Den Namen person wählst du selbst, er gilt nur innerhalb von @for.'], ['track person.id', 'Pflicht! Woran Angular jeden Entwickler erkennt.'], ['$index', 'Die Position, ab 0.'], ['@empty', 'Wird gezeigt, wenn die Liste leer ist.']],
      pro: 'track mit stabiler id. track $index nur bei Listen, die sich nie umsortieren. Sonst landen Zustände beim falschen Element. Extras: $first, $last, $even, $odd, $count.' },
    { t: '@if = wenn, sonst', say: '@if zeigt HTML nur, wenn eine Bedingung stimmt.', job: 'Der „Leer-Zustand“ fehlt in vielen Firmen-Apps. QA findet ihn sofort. Mit @if/@else oder @empty baust du ihn gleich mit.',
      code: C`
@if (entwickler().length > 10) {
  <p>Volles Team!</p>
} @else if (entwickler().length > 0) {
  <p>Wir brauchen mehr Leute.</p>
} @else {
  <p>Projekt pausiert.</p>
}`,
      notes: [['@if (', 'Bedingung in runden Klammern.'], ['@else if', 'Zweite Bedingung, wenn die erste falsch war.'], ['@else {', 'Wenn alles falsch war.']],
      pro: 'Ersetzt *ngIf, *ngFor, ngSwitch aus altem Code. Eingebaut, schneller, typsicher. Migration: ng g @angular/core:control-flow. Es gibt auch @switch/@case.' }
  ],
  quiz: [{ q: 'Warum schreibst du bei einer sortierbaren Liste <code>track person.id</code> statt <code>track $index</code>?', options: ['track person.id ist kürzer zu schreiben', 'Angular erkennt jeden Entwickler an seiner id und verschiebt nur die Elemente', 'track $index ist bei @for verboten', 'Ohne track person.id funktioniert @empty nicht'], correct: 1, why: 'Die id bleibt beim Sortieren gleich. So verwendet Angular für jeden Eintrag das richtige Element wieder.' },
    { q: 'Die Liste <code>entwickler()</code> ist leer. Was zeigt <code>@for (person of entwickler(); track person.id) { … } @empty { Keiner da }</code>?', options: ['Nichts', 'Einen Fehler, weil die Liste leer ist', 'Eine leere Zeile', 'Keiner da'], correct: 3, why: '@empty springt genau dann ein, wenn die Liste keine Elemente hat.' },
    { q: 'Eine Liste hat drei Entwickler. Was zeigt <code>{{ $index + 1 }}</code> im @for beim zweiten Entwickler?', options: ['1', '3', '2', '0'], correct: 2, why: '$index zählt ab 0. Der zweite Entwickler hat $index 1, plus 1 ergibt 2.' }
  ],
  ex: { id: 'ex08', title: 'Besetzung zeigen', goal: 'Zeig die Entwickler als Liste.', preview: 'Besetzung',
    todo: ['Für jeden Entwickler ein <code>&lt;li&gt;</code> mit dem Namen (<code>track person.id</code>)', 'Leere Liste: <code>&lt;li class="leer"&gt;Keiner da&lt;/li&gt;</code>', 'Frontend-Devs bekommen <code>&lt;span class="fe"&gt;💻&lt;/span&gt;</code> im li', '<code>&lt;p class="viel"&gt;</code> nur bei mehr als 2 Entwicklern'],
    starter: C`
import { Component, signal } from '@angular/core';

interface Entwickler { id: number; name: string; position: 'Frontend' | 'Backend'; }

@Component({
  selector: 'app-besetzung',
  template: \`
    <ul>
      <!-- @for hier -->
    </ul>
    <!-- @if hier -->
    <button (click)="alleKrank()">Alle krank</button>
  \`,
})
export class Besetzung {
  entwickler = signal<Entwickler[]>([
    { id: 1, name: 'Leon', position: 'Frontend' },
    { id: 2, name: 'Mo', position: 'Backend' },
    { id: 3, name: 'Ben', position: 'Frontend' },
  ]);

  alleKrank() {
    this.entwickler.set([]);
  }
}
`,
    solution: C`
import { Component, signal } from '@angular/core';

interface Entwickler { id: number; name: string; position: 'Frontend' | 'Backend'; }

@Component({
  selector: 'app-besetzung',
  template: \`
    <ul>
      @for (person of entwickler(); track person.id) {
        <li>
          {{ person.name }}
          @if (person.position === 'Frontend') { <span class="fe">💻</span> }
        </li>
      } @empty {
        <li class="leer">Keiner da</li>
      }
    </ul>
    @if (entwickler().length > 2) {
      <p class="viel">Starke Truppe heute!</p>
    }
    <button (click)="alleKrank()">Alle krank</button>
  \`,
})
export class Besetzung {
  entwickler = signal<Entwickler[]>([
    { id: 1, name: 'Leon', position: 'Frontend' },
    { id: 2, name: 'Mo', position: 'Backend' },
    { id: 3, name: 'Ben', position: 'Frontend' },
  ]);

  alleKrank() {
    this.entwickler.set([]);
  }
}
`,
    notes: [['@for (person of entwickler(); track person.id)', 'Für jeden Entwickler, erkannt an der id. person ist ein frei gewählter Name.'], ['{{ person.name }}', 'Name des aktuellen Entwicklers.'], ["@if (person.position === 'Frontend')", '=== vergleicht. Nur Frontend-Devs bekommen das Laptop-Icon.'], ['@empty', 'Leere Liste? Dann das hier.'], ['entwickler().length > 2', 'Länge der Liste größer als 2?']],
    hints: ['<code>@for (person of entwickler(); track person.id) { &lt;li&gt;{{ person.name }}&lt;/li&gt; }</code>', 'Direkt danach: <code>@empty { &lt;li class="leer"&gt;Keiner da&lt;/li&gt; }</code>', "Im li: <code>@if (person.position === 'Frontend') { &lt;span class=\"fe\"&gt;💻&lt;/span&gt; }</code>"],
    tests: [
      { name: '@for mit track benutzt', run: T => T.ok(/@for\s*\([\s\S]*?;\s*track\s+/.test(T.code), 'Ich finde kein @for (... ; track ...).') },
      { name: '3 Entwickler = 3 <li>', run: T => { const f = T.mount(T.cmp('Besetzung')); const lis = f.qa('ul li'); T.eq(lis.length, 3, 'Bei 3 Entwicklern sollen 3 <li> in der ul stehen. Steht das <li> innerhalb von @for?'); T.eq(lis.map(li => li.textContent.replace('💻', '').trim()), ['Leon', 'Mo', 'Ben'], 'Die li sollen der Reihe nach Leon, Mo, Ben zeigen. Steht {{ person.name }} im li?'); } },
      { name: 'Nur Frontend-Devs kriegen 💻', run: T => { const f = T.mount(T.cmp('Besetzung')); T.eq(f.qa('span.fe').length, 2, 'Leon und Ben sind Frontend, also sollen es 2 span.fe sein. Steht das @if im li?'); T.ok(!f.qa('ul li')[1].querySelector('.fe'), 'Mo ist Backend, kein Icon.'); } },
      { name: 'p.viel nur bei mehr als 2', run: async T => { const f = T.mount(T.cmp('Besetzung')); T.ok(f.q('p.viel'), 'Bei 3 Entwicklern soll p.viel da sein.'); f.instance.entwickler.update(l => l.slice(0, 2)); await T.flush(); T.ok(!f.q('p.viel'), 'Bei 2 Entwicklern soll p.viel weg sein.'); } },
      { name: 'Leere Liste zeigt li.leer', run: async T => { const f = T.mount(T.cmp('Besetzung')); await f.click('button'); const lis = f.qa('ul li'); T.eq(lis.length, 1, 'Bei leerer Liste genau ein <li class="leer">. Nimm @empty.'); T.ok(lis[0].classList.contains('leer'), 'Das li braucht class="leer".'); } }
    ] },
  merke: ['@for (x of liste(); track x.id) wiederholt.', '@empty für leere Listen.', '@if / @else if / @else entscheidet.']
});

CH.push({
  id: 'k09', akt: 2, title: 'Seite und Karte', tag: 'input() · output()', xp: 130,
  doku: [['Daten per Input-Eigenschaften annehmen', 'https://angular.dev/guide/components/inputs'], ['Eigene Events mit Outputs', 'https://angular.dev/guide/components/outputs']],
  ticket: { id: 'PW-122', typ: 'Tech-Debt', titel: 'Besetzungs-Seite aufteilen', text: 'Die Besetzungs-Komponente hat 400 Zeilen. Lagere die Entwicklerkarte in eine eigene Komponente aus, die Daten bekommt und Klicks meldet.' },
  story: [
    ['toni', 'Die Besetzungs-Datei hat 400 Zeilen. Wir teilen sie: Die Seite hat die Daten. Jede Karte zeigt nur einen Entwickler.'],
    ['du', 'Und wie weiß die Karte, wen sie zeigt?'],
    ['toni', 'Die Seite gibt es ihr mit input(). Und die Karte meldet sich mit output(), wenn jemand klickt.']
  ],
  slides: [
    { t: 'input = Daten von oben', say: 'input() bekommt Daten von oben. Nur lesen, nicht ändern.', job: 'Eine gute Karten-Komponente kennt keinen Service und keine API. Sie bekommt alles per input(). Dann kann man sie überall wiederverwenden und leicht testen.',
      code: C`
export class EntwicklerKarte {
  entwickler = input.required<Entwickler>();
  nummer = input(10);
}

<h3>{{ entwickler().name }}</h3>`,
      notes: [['input.required<Entwickler>()', 'Pflicht-Input vom Typ Entwickler.'], ['input(10)', 'Input mit Standardwert 10.'], ['entwickler().name', 'Input liest man wie ein Signal: mit ().']],
      pro: 'Ersetzt @Input(). Extras: input(0, { transform: numberAttribute }), alias, model() für Two-Way.' },
    { t: 'output = Meldung nach oben', say: 'output() schickt eine Nachricht nach oben.', job: 'Im Review siehst du manchmal, dass eine Kind-Komponente selbst den Service aufruft. Besser: Sie meldet per output(), und die Seite entscheidet, was passiert.',
      code: C`
// KARTE
einplanen = output<number>();
<button (click)="einplanen.emit(entwickler().id)">Einplanen!</button>

// SEITE
@Component({
  imports: [EntwicklerKarte],
  template: \`
    @for (person of team(); track person.id) {
      <app-entwickler-karte [entwickler]="person" (einplanen)="rein($event)" />
    }
  \`,
})`,
      notes: [['output<number>()', 'Ein Ruf, der eine Zahl mitschickt.'], ['.emit(', 'Ruf abschicken, hier mit der id.'], ['imports: [EntwicklerKarte]', 'Die Seite muss den Baustein kennen!'], ['[entwickler]="person"', 'Daten runter zum Kind.'], ['(einplanen)="rein($event)"', 'Ruf hören. $event ist die id.']],
      pro: 'Data down, events up. Das Kind ändert nie die Daten der Seite. Smart (Seite, kennt Daten) vs. Dumb (Karte, nur Inputs/Outputs) ist ein Standard-Muster in großen Apps.' }
  ],
  quiz: [{ q: 'Die Kind-Komponente ruft <code>this.gewaehlt.emit(\'Leon\')</code> auf. Welchen Wert hat $event im Template der Eltern-Komponente bei <code>(gewaehlt)="merke($event)"</code>?', options: ['Das Klick-Ereignis des Browsers', 'Den Text "Leon"', 'undefined', 'Die Kind-Komponente selbst'], correct: 1, why: '$event ist genau der Wert, den das Kind an emit() übergibt.' },
    { q: 'Die Karte hat <code>entwickler = input.required&lt;Entwickler&gt;()</code>. Wie zeigst du im Template der Karte den Namen an?', options: ['{{ entwickler.name }}', '{{ entwickler().name }}', '{{ input.entwickler.name }}', '{{ entwickler.get().name }}'], correct: 1, why: 'Ein input() liest man wie ein Signal, also mit Klammern: entwickler(). Danach kommt .name.' },
    { q: 'Die Karte möchte den Namen des Entwicklers ändern, den sie per input() bekommen hat. Wie macht man das richtig?', options: ['Sie meldet den Wunsch per output(), und die Seite ändert die Daten', 'Sie ruft entwickler.set(...) auf', 'Sie überschreibt entwickler().name direkt', 'Gar nicht, Namen lassen sich nie ändern'], correct: 0, why: 'Data down, events up: Ein input() ist nur lesbar. Das Kind meldet nach oben, die Seite besitzt die Daten und ändert sie.' }
  ],
  ex: { id: 'ex09', title: 'Ins Projekt holen', goal: 'Die Karte meldet per Knopf, wen du einplanen willst, und die Seite merkt sich das.', preview: 'Besetzung',
    todo: ['<b>EntwicklerKarte:</b> <code>entwickler = input.required&lt;Entwickler&gt;()</code>, <code>einplanen = output&lt;number&gt;()</code>', 'Karte: <code>&lt;h3&gt;</code> mit Namen, Button emittet die <b>id</b>', '<b>Besetzung:</b> importiert EntwicklerKarte, zeigt eine Karte pro Entwickler mit <code>[entwickler]</code>', 'Bei <code>(einplanen)</code> kommt die id in <code>eingeplant</code>. <code>p.zaehler</code> zeigt „X eingeplant“'],
    starter: C`
import { Component, signal, input, output } from '@angular/core';

interface Entwickler { id: number; name: string; }

@Component({
  selector: 'app-entwickler-karte',
  template: \`
    <h3>???</h3>
    <button>Einplanen!</button>
  \`,
})
export class EntwicklerKarte {
  // entwickler (input.required) und einplanen (output)
}

@Component({
  selector: 'app-besetzung',
  imports: [],
  template: \`
    <!-- @for mit <app-entwickler-karte ... /> -->
    <p class="zaehler">{{ eingeplant().length }} eingeplant</p>
  \`,
})
export class Besetzung {
  team = signal<Entwickler[]>([
    { id: 1, name: 'Leon' },
    { id: 2, name: 'Mo' },
    { id: 3, name: 'Ben' },
  ]);
  eingeplant = signal<number[]>([]);

  rein(id: number) {
    // id hinzufügen
  }
}
`,
    solution: C`
import { Component, signal, input, output } from '@angular/core';

interface Entwickler { id: number; name: string; }

@Component({
  selector: 'app-entwickler-karte',
  template: \`
    <h3>{{ entwickler().name }}</h3>
    <button (click)="einplanen.emit(entwickler().id)">Einplanen!</button>
  \`,
})
export class EntwicklerKarte {
  entwickler = input.required<Entwickler>();
  einplanen = output<number>();
}

@Component({
  selector: 'app-besetzung',
  imports: [EntwicklerKarte],
  template: \`
    @for (person of team(); track person.id) {
      <app-entwickler-karte [entwickler]="person" (einplanen)="rein($event)" />
    }
    <p class="zaehler">{{ eingeplant().length }} eingeplant</p>
  \`,
})
export class Besetzung {
  team = signal<Entwickler[]>([
    { id: 1, name: 'Leon' },
    { id: 2, name: 'Mo' },
    { id: 3, name: 'Ben' },
  ]);
  eingeplant = signal<number[]>([]);

  rein(id: number) {
    this.eingeplant.update(ids => [...ids, id]);
  }
}
`,
    notes: [['{{ entwickler().name }}', 'Input lesen mit ().'], ['einplanen.emit(entwickler().id)', 'Ruf mit der id nach oben.'], ['input.required<Entwickler>()', 'Pflicht-Daten von der Seite.'], ['output<number>()', 'Der Ruf schickt eine Zahl.'], ['imports: [EntwicklerKarte]', 'Ohne das kennt die Seite den Tag nicht.'], ['[entwickler]="person" (einplanen)', 'Daten runter, Ruf hoch.'], ['[...ids, id]', 'Neues Array: Die drei Punkte (Spread) packen alle alten ids aus, dahinter kommt die neue. Aus [1] wird [1, 2]. Mehr zu Spread in den Grundlagen.']],
    hints: ['Karte: <code>entwickler = input.required&lt;Entwickler&gt;();</code>', 'Button: <code>(click)="einplanen.emit(entwickler().id)"</code>', 'Seite: <code>imports: [EntwicklerKarte]</code> und <code>@for (person of team(); track person.id)</code> mit <code>&lt;app-entwickler-karte [entwickler]="person" (einplanen)="rein($event)" /&gt;</code>', '<code>this.eingeplant.update(ids =&gt; [...ids, id]);</code>'],
    tests: [
      { name: 'Karte hat input und output', run: T => { const f = T.mount(T.cmp('EntwicklerKarte'), { inputs: { entwickler: { id: 7, name: 'Testi' } } }); T.ok(T.isOutput(f.instance.einplanen), 'einplanen soll output<number>() sein.'); T.ok(f.q('h3'), 'Kein <h3> in der Karte gefunden.'); T.eq(f.q('h3').textContent.trim(), 'Testi', 'Das h3 soll den Namen aus dem Input zeigen. Steht {{ entwickler().name }} darin?'); } },
      { name: 'Karte schickt die id', run: async T => { const f = T.mount(T.cmp('EntwicklerKarte'), { inputs: { entwickler: { id: 7, name: 'Testi' } } }); let got = null; f.instance.einplanen.subscribe(v => got = v); await f.click('button'); T.eq(got, 7, 'Beim Klick soll die Karte die id 7 melden. Ruft der Button einplanen.emit(entwickler().id) auf?'); } },
      { name: 'Seite zeigt 3 Karten', run: T => { T.ok(/imports\s*:\s*\[\s*EntwicklerKarte/.test(T.code), 'Besetzung braucht EntwicklerKarte in imports: [...].'); const f = T.mount(T.cmp('Besetzung')); T.eq(f.qa('app-entwickler-karte').length, 3, 'Für 3 Entwickler sollen 3 <app-entwickler-karte> da sein. Steht die Karte in @for?'); T.eq(f.qa('app-entwickler-karte h3').map(h => h.textContent.trim()), ['Leon', 'Mo', 'Ben'], 'Die Karten sollen der Reihe nach Leon, Mo, Ben zeigen. Gibst du jeder Karte [entwickler]="person" mit?'); } },
      { name: 'Klick auf Mo landet bei der Seite', run: async T => { const f = T.mount(T.cmp('Besetzung')); await f.click(f.qa('app-entwickler-karte button')[1]); T.eq(f.instance.eingeplant(), [2], 'Nach Klick auf Mo soll eingeplant() [2] sein. Hört die Seite mit (einplanen)="rein($event)" zu, und hängt rein() die id an?'); T.ok(/1 eingeplant/.test(f.q('p.zaehler').textContent), 'p.zaehler soll „1 eingeplant“ zeigen, gefunden: „' + f.q('p.zaehler').textContent.trim() + '“.'); } }
    ] },
  merke: ['input(): Daten von oben, lesen mit ().', 'output() + emit(): Ruf nach oben, kommt als $event.', 'Kinder in imports eintragen.']
});

CH.push({
  id: 'k10', akt: 2, title: 'Das Backoffice', tag: 'Services · inject()', xp: 140,
  doku: [['Services erstellen und verwenden', 'https://angular.dev/guide/di/creating-and-using-services'], ['Injection Context: wo inject() geht', 'https://angular.dev/guide/di/dependency-injection-context'], ['API: Decorator @Service', 'https://angular.dev/api/core/Service']],
  ticket: { id: 'PW-123', typ: 'Bug', titel: 'Teamgröße nach Projektwechsel falsch', text: 'Wechselt ein Entwickler in ein anderes Projekt, steht in der Kopfzeile weiter „3 im Team“. Jede Komponente hat ihre eigene Liste.' },
  story: [
    ['erz', 'Woche zwei, die Probezeit läuft. Das Teamboard hat jetzt Teamseite, Entwicklerseite und Kopfzeile.'],
    ['mia', 'Bug: Ich ziehe Ben auf der Entwicklerseite aus dem Projekt ab. Oben steht trotzdem noch: 3 im Team.'],
    ['toni', 'Jede Komponente führt ihre eigene Liste. Wir brauchen EINE Stelle für alle: einen Service.']
  ],
  slides: [
    { t: 'Service = eine Stelle für geteilte Daten', say: 'Ein Service ist eine Klasse, die alle Bausteine teilen. Er hält Daten und Logik an EINER Stelle.', job: 'In Firmen-Apps gibt es für fast jeden Fachbereich einen Service: EntwicklerService, TicketService, AuthService. Die Daten liegen dort, nicht in den Komponenten.',
      code: C`
@Service()
export class TeamService {
  team = signal<Entwickler[]>([ /* … Daten … */ ]);

  abziehen(id: number) {
    this.team.update(liste => liste.filter(person => person.id !== id));
  }
}`,
      notes: [['@Service()', 'Genau EINE Instanz für die ganze App. In älterem Code steht dafür @Injectable({ providedIn: \'root\' }). Du wirst beides sehen.'], ['team = signal', 'Die Liste, die alle teilen. Der Kommentar steht hier nur für die Daten.'], ['abziehen(id: number)', 'Eine Methode, die die Liste ändert.'], ['liste.filter(', 'filter baut eine neue Liste. Behalten wird jede person, für die die Bedingung stimmt. !== heißt „ungleich“: Alle bleiben, außer der mit dieser id.']],
      pro: 'Du wirst beides sehen: @Injectable({ providedIn: \'root\' }) ist die ältere Form von @Service(). @Service() gibt es seit Angular 22, die lange Form funktioniert weiter.' },
    { t: 'Schreibschutz: private + asReadonly', say: 'Nur der Service selbst darf seine Daten ändern. Alle anderen dürfen sie nur lesen.', job: 'Ändert jede Komponente die Liste direkt, weiß bald niemand mehr, woher ein Fehler kommt. Mit Schreibschutz gibt es genau eine Tür zum Ändern: die Methoden des Service.',
      code: C`
@Service()
export class TeamService {
  private readonly _team = signal<Entwickler[]>([ /* … Daten … */ ]);
  readonly team = this._team.asReadonly();
  readonly anzahl = computed(() => this._team().length);

  abziehen(id: number) {
    this._team.update(liste => liste.filter(person => person.id !== id));
  }
}`,
      notes: [['private readonly _team', 'private: Nur der Service sieht dieses Signal. readonly: Das Feld wird nie durch ein anderes ersetzt. Der Unterstrich ist nur eine Konvention für „intern“.'], ['asReadonly()', 'Nach außen: dasselbe Signal, aber nur zum Lesen. Ein set() gibt es darauf nicht.'], ['anzahl = computed', 'Abgeleitet, wie gelernt.'], ['this._team.update', 'Ändern geht nur hier drinnen, über die Methode.']],
      pro: 'Privates Signal + öffentliches readonly ist der Standard für Signal-Stores. Methoden sind die einzige Tür zum Ändern.' },
    { t: 'inject() = Service anfordern', say: 'inject(X) gibt dir den Service. Immer denselben. Das geht nur, während Angular die Klasse erstellt.', job: 'inject() ist auch der Grund, warum Tests einfach sind: Im Test gibst du der Komponente einen Fake-Service. Den echten Server braucht der Test dann nicht.',
      code: C`
export class Kopfzeile {
  private team = inject(TeamService);
  anzahl = this.team.anzahl;

  geklickt() {
    // inject(TeamService) hier: Fehler NG0203
  }
}`,
      notes: [['inject(TeamService)', 'Holt die eine Instanz. Angular erzeugt sie beim ersten Mal.'], ['private team', 'Als Feld der Klasse: Das läuft, während Angular die Klasse erstellt. Genau dort ist inject() erlaubt, ebenso im Konstruktor. Diese Stellen heißen Injection Context.'], ['this.team.anzahl', 'Liest das computed aus dem Service.'], ['geklickt()', 'Diese Methode läuft erst später, etwa bei einem Klick. Hier geht inject() nicht, Angular meldet NG0203. Hol den Service vorher als Feld.']],
      pro: 'Zum Injection Context gehören auch Factory-Funktionen von Providern. Alter Stil: constructor(private team: TeamService). Eine Klasse mit @Service() holt ihre eigenen Abhängigkeiten nur mit inject(). DI ist hierarchisch: root, Route, Komponente (über das Feld providers).' }
  ],
  quiz: [
    { q: 'Der TeamService ist mit <code>@Service()</code> markiert. Zwei Komponenten rufen <code>inject(TeamService)</code> auf. Was bekommen sie?', options: ['Jede Komponente bekommt eine eigene Instanz', 'Beide bekommen dieselbe Instanz', 'Der zweite Aufruf wirft einen Fehler', 'Die erste bekommt den Service, die zweite eine leere Kopie'], correct: 1, why: 'Mit @Service() gibt es genau eine Instanz für die ganze App, ein Singleton.' },
    { q: 'An welcher dieser Stellen darfst du <code>inject()</code> NICHT aufrufen?', options: ['Bei der Initialisierung eines Feldes der Klasse', 'Im Konstruktor', 'In einer Methode, die bei einem Klick läuft', 'In der Factory-Funktion eines Providers'], correct: 2, why: 'Klick-Methoden laufen außerhalb des Injection Context. Hol dir den Service vorher als Feld der Klasse.' }
  ],
  ex: { id: 'ex10', title: 'Ein Backoffice', goal: 'Alle Bausteine sehen dasselbe Team.', preview: 'Kopfzeile',
    todo: ['<code>TeamService</code> wird ein Service: <code>@Service()</code>', '<code>anzahl</code> = computed mit der Länge', '<code>abziehen(id)</code> entfernt den Entwickler (filter)', '<code>team</code> nach außen readonly', '<code>Kopfzeile</code> holt den Service mit inject, <code>p.anzahl</code> zeigt „3 im Team“'],
    starter: C`
import { Component, Service, signal, computed, inject } from '@angular/core';

interface Entwickler { id: number; name: string; }

export class TeamService {
  private readonly _team = signal<Entwickler[]>([
    { id: 1, name: 'Leon' },
    { id: 2, name: 'Mo' },
    { id: 3, name: 'Ben' },
  ]);
  readonly team = this._team;   // readonly machen
  // anzahl

  abziehen(id: number) {
    // Entwickler entfernen
  }
}

@Component({
  selector: 'app-kopfzeile',
  template: \`
    <p class="anzahl">? im Team</p>
    <button (click)="service.abziehen(3)">Ben abziehen</button>
  \`,
})
export class Kopfzeile {
  // service = inject(...)
}
`,
    solution: C`
import { Component, Service, signal, computed, inject } from '@angular/core';

interface Entwickler { id: number; name: string; }

@Service()
export class TeamService {
  private readonly _team = signal<Entwickler[]>([
    { id: 1, name: 'Leon' },
    { id: 2, name: 'Mo' },
    { id: 3, name: 'Ben' },
  ]);
  readonly team = this._team.asReadonly();
  readonly anzahl = computed(() => this._team().length);

  abziehen(id: number) {
    this._team.update(liste => liste.filter(person => person.id !== id));
  }
}

@Component({
  selector: 'app-kopfzeile',
  template: \`
    <p class="anzahl">{{ service.anzahl() }} im Team</p>
    <button (click)="service.abziehen(3)">Ben abziehen</button>
  \`,
})
export class Kopfzeile {
  service = inject(TeamService);
}
`,
    notes: [["@Service()", 'Macht die Klasse zum Service, einmal für alle.'], ['asReadonly()', 'Von außen kein set mehr möglich.'], ['anzahl = computed', 'Länge der Liste.'], ['filter(person => person.id !== id)', 'Alle behalten, außer dem mit dieser id. liste und person sind frei gewählte Namen.'], ['service.anzahl()', 'Template liest aus dem Service.'], ['inject(TeamService)', 'Schlüssel zum Backoffice.']],
    hints: ["Über die Klasse: <code>@Service()</code>", '<code>readonly anzahl = computed(() =&gt; this._team().length);</code>', '<code>this._team.update(liste =&gt; liste.filter(person =&gt; person.id !== id));</code>', 'Kopfzeile: <code>service = inject(TeamService);</code>'],
    tests: [
      { name: 'TeamService ist ein @Service()', run: T => { const S = T.get('TeamService'); T.ok(S.ɵprov && S.ɵprov.providedIn === 'root', 'Angular stellt TeamService noch nicht bereit. Schreib @Service() direkt über export class TeamService.'); } },
      { name: 'Überall dieselbe Instanz', run: T => { const S = T.get('TeamService'); T.ok(T.inject(S) === T.inject(S), 'inject soll immer dieselbe Instanz geben.'); } },
      { name: 'anzahl und abziehen klappen', run: T => { const s = T.inject(T.get('TeamService')); T.ok(T.isComputed(s.anzahl), 'anzahl soll computed sein.'); T.eq(s.anzahl(), 3, 'anzahl soll 3 sein.'); s.abziehen(2); T.eq(s.anzahl(), 2, 'Nach abziehen(2) soll anzahl 2 sein.'); T.eq(s.team().map(person => person.name), ['Leon', 'Ben'], 'Nach abziehen(2) sollen nur Leon und Ben übrig sein. Behält dein filter alle mit person.id !== id?'); } },
      { name: 'team ist von außen nicht änderbar', run: T => { const s = T.inject(T.get('TeamService')); T.ok(typeof s.team === 'function' && !s.team.set, 'team hat noch .set(). Nimm this._team.asReadonly().'); } },
      { name: 'Kopfzeile nutzt den Service', run: async T => { T.ok(/inject\s*\(\s*TeamService\s*\)/.test(T.code), 'Kopfzeile soll inject(TeamService) benutzen.'); const f = T.mount(T.cmp('Kopfzeile')); T.eq(f.q('p.anzahl').textContent.trim(), '3 im Team', 'p.anzahl soll „3 im Team“ zeigen. Steht {{ service.anzahl() }} darin?'); T.inject(T.get('TeamService')).abziehen(1); await T.flush(); T.eq(f.q('p.anzahl').textContent.trim(), '2 im Team', 'Nach dem Abziehen im Service soll die Kopfzeile „2 im Team“ zeigen.'); } }
    ] },
  merke: ['Service = geteilte Daten + Logik.', "@Service() = eine Instanz für die ganze App.", 'inject(X) nur im Injection Context.', 'Privat ändern, öffentlich readonly.']
});

CH.push({
  id: 'k11', akt: 2, title: 'Die Bewerber-Merkliste', tag: 'effect()', xp: 120,
  doku: [['Effects: Nebenwirkungen mit effect()', 'https://angular.dev/guide/signals/effect'], ['API: effect()', 'https://angular.dev/api/core/effect'], ['localStorage im Browser', 'https://developer.mozilla.org/de/docs/Web/API/Window/localStorage']],
  ticket: { id: 'PW-124', typ: 'Bug', titel: 'Merkliste nach Neuladen leer', text: 'Die Chefin merkt sich Bewerber im Teamboard. Nach F5 ist die Liste weg. Sie soll im localStorage gespeichert werden.' },
  story: [
    ['boss', 'Ich merke mir Bewerber im Board. Seite neu laden: alles weg!'],
    ['toni', 'Bei jeder Änderung müssen wir speichern. Das ist eine Nebenwirkung. Dafür gibt es effect().'],
    ['toni', 'Aber Vorsicht: Im Review ist effect oft ein Warnzeichen. Für Speichern, Loggen, Analytics ist es richtig. Zum Rechnen nimmst du computed.']
  ],
  slides: [
    { t: 'effect = macht etwas, wenn sich was ändert', say: 'effect führt Code aus, wenn ein gelesenes Signal sich ändert.', job: 'Typische Einsätze im Job: in localStorage speichern, an Analytics melden, den Seitentitel setzen. Setzt jemand im effect ein anderes Signal, frag im Review nach. Das ist fast immer ein computed.',
      code: C`
constructor() {
  effect(() => {
    const liste = this.merkliste();
    localStorage.setItem('merkliste', JSON.stringify(liste));
  });
}`,
      notes: [['constructor()', 'Der Konstruktor läuft genau einmal, wenn Angular die Klasse erstellt. Ein guter Platz, um den effect anzulegen.'], ['effect(() =>', 'Läuft einmal am Anfang und bei jeder Änderung.'], ['this.merkliste()', 'Weil es hier gelesen wird, hängt der effect daran.'], ['setItem', 'Die Nebenwirkung: speichern.'], ['JSON.stringify', 'Macht aus dem Array einen Text zum Speichern.']],
      pro: 'Effects laufen asynchron, gebündelt. Nie Signals aus Signals per effect berechnen: das ist ein verkleidetes computed (klarer Review-Fund). effect nur für Außenwelt: Speicher, Logging, Analytics, Fremd-Bibliotheken. untracked() liest ohne Abhängigkeit.' }
  ],
  quiz: [{ q: 'Du willst den Wert <code>punkte</code> aus dem Signal <code>tickets()</code> berechnen. Was nimmst du dafür?', options: ['effect(() => this.punkte.set(this.tickets() * 100))', 'computed(() => this.tickets() * 100)', 'Ein Feld, das du in jeder Methode von Hand mitsetzt', 'Ein zweites signal, das ein Timer regelmäßig aktualisiert'], correct: 1, why: 'Einen abgeleiteten Wert berechnest du mit computed. Ein effect ist nur für Nebenwirkungen da.' },
    { q: 'Wann läuft <code>effect(() =&gt; localStorage.setItem(\'liste\', JSON.stringify(this.merkliste())))</code>?', options: ['Nur, wenn man ihn selbst aufruft', 'Nur beim Schließen der Seite', 'Jede Sekunde', 'Einmal am Anfang und danach bei jeder Änderung von merkliste'], correct: 3, why: 'Ein effect läuft einmal los und merkt sich, welche Signals er liest. Ändert sich merkliste, läuft er wieder.' },
    { q: 'Wofür ist ein effect der richtige Platz?', options: ['Um aus einem Signal ein anderes zu berechnen', 'Um Daten an eine Kind-Komponente zu geben', 'Für Nebenwirkungen nach außen, etwa Speichern oder Logging', 'Um eine Liste im Template zu wiederholen'], correct: 2, why: 'effect ist für die Außenwelt da: Speicher, Logging, Analytics. Werte ableiten macht computed, das ist klarer und schneller.' }
  ],
  ex: { id: 'ex11', title: 'Bewerber merken', goal: 'Die Merkliste überlebt das Neuladen. Laden und Speichern sind schon fertig, dir fehlt nur der effect.',
    todo: ['Schau dir <code>laden()</code> und <code>speichern()</code> an. Beide sind fertig.', 'Leg im Konstruktor einen <code>effect</code> an', 'Der effect ruft bei jeder Änderung von <code>merkliste()</code> die Methode <code>speichern()</code> auf'],
    starter: C`
import { Service, signal, computed, effect, inject } from '@angular/core';

// Wie localStorage, nur zum Testen. Musst du nicht ändern.
@Service()
export class Speicher {
  daten: Record<string, string> = {};
  getItem(k: string): string | null { return this.daten[k] ?? null; }
  setItem(k: string, v: string) { this.daten[k] = v; }
}

@Service()
export class RecruitingService {
  private speicher = inject(Speicher);
  merkliste = signal<number[]>(this.laden());
  anzahl = computed(() => this.merkliste().length);

  constructor() {
    // Hier fehlt der effect: bei jeder Änderung speichern
  }

  umschalten(id: number) {
    if (this.merkliste().includes(id)) {
      this.merkliste.update(liste => liste.filter(gemerkt => gemerkt !== id));
    } else {
      this.merkliste.update(liste => [...liste, id]);
    }
  }

  // Fertig: holt die gespeicherte Liste. Ist noch nichts gespeichert, kommt eine leere Liste.
  private laden(): number[] {
    const text = this.speicher.getItem('merkliste');
    if (text === null) {
      return [];
    }
    return JSON.parse(text);
  }

  // Fertig: speichert die Liste als Text.
  private speichern(liste: number[]) {
    this.speicher.setItem('merkliste', JSON.stringify(liste));
  }
}
`,
    solution: C`
import { Service, signal, computed, effect, inject } from '@angular/core';

// Wie localStorage, nur zum Testen. Musst du nicht ändern.
@Service()
export class Speicher {
  daten: Record<string, string> = {};
  getItem(k: string): string | null { return this.daten[k] ?? null; }
  setItem(k: string, v: string) { this.daten[k] = v; }
}

@Service()
export class RecruitingService {
  private speicher = inject(Speicher);
  merkliste = signal<number[]>(this.laden());
  anzahl = computed(() => this.merkliste().length);

  constructor() {
    effect(() => {
      this.speichern(this.merkliste());
    });
  }

  umschalten(id: number) {
    if (this.merkliste().includes(id)) {
      this.merkliste.update(liste => liste.filter(gemerkt => gemerkt !== id));
    } else {
      this.merkliste.update(liste => [...liste, id]);
    }
  }

  // Fertig: holt die gespeicherte Liste. Ist noch nichts gespeichert, kommt eine leere Liste.
  private laden(): number[] {
    const text = this.speicher.getItem('merkliste');
    if (text === null) {
      return [];
    }
    return JSON.parse(text);
  }

  // Fertig: speichert die Liste als Text.
  private speichern(liste: number[]) {
    this.speicher.setItem('merkliste', JSON.stringify(liste));
  }
}
`,
    notes: [['private speicher = inject(Speicher)', 'Muss vor merkliste stehen, weil laden() den Speicher braucht.'], ['signal<number[]>(this.laden())', 'Startwert: die gespeicherte Liste.'], ['effect(() =>', 'Läuft einmal am Anfang und danach bei jeder Änderung von merkliste.'], ['this.speichern(this.merkliste())', 'merkliste() wird hier gelesen, darum hängt der effect daran. Die Nebenwirkung: speichern.'], ['includes(id)', 'includes fragt: Ist die id schon in der Liste?'], ['JSON.parse(text)', 'Macht aus dem gespeicherten Text wieder ein Array.']],
    hints: ['Im Konstruktor: <code>effect(() =&gt; { … });</code>', 'Im effect liest du das Signal: <code>this.merkliste()</code>. Dadurch läuft er bei jeder Änderung neu.', 'So: <code>effect(() =&gt; { this.speichern(this.merkliste()); });</code>'],
    tests: [
      { name: 'Ein effect ist da', run: T => T.ok(/effect\s*\(\s*\(\s*\)\s*=>/.test(T.code), 'Ich finde kein effect(() => …). Leg es im Konstruktor an.') },
      { name: 'effect speichert', run: async T => { const s = T.inject(T.get('RecruitingService')); const sp = T.inject(T.get('Speicher')); s.umschalten(2); await T.flush(); T.eq(sp.daten.merkliste, '[2]', 'Nach umschalten(2) soll im Speicher unter "merkliste" "[2]" stehen. Ruft dein effect this.speichern(this.merkliste()) auf?'); s.umschalten(4); await T.flush(); T.eq(sp.daten.merkliste, '[2,4]', 'Nach der zweiten Änderung soll "[2,4]" drin sein. Liest der effect merkliste()?'); } },
      { name: 'Speichern nur im effect', run: T => T.ok(!/umschalten\s*\([^)]*\)\s*\{[^}]*speichern\s*\(/.test(T.code), 'umschalten() ruft speichern() selbst auf. Das soll der effect übernehmen, dann vergisst es keine Methode.') },
      { name: 'Start aus dem Speicher', run: T => { const sp = T.inject(T.get('Speicher')); sp.daten.merkliste = '[7,8]'; const s = T.inject(T.get('RecruitingService')); T.eq(s.merkliste(), [7, 8], 'merkliste soll mit den gespeicherten [7,8] starten. Steht noch this.laden() als Startwert?'); } },
      { name: 'umschalten und anzahl klappen noch', run: T => { const s = T.inject(T.get('RecruitingService')); s.umschalten(1); s.umschalten(3); T.eq(s.merkliste(), [1, 3], 'Nach umschalten(1), umschalten(3) soll [1,3] drin sein.'); T.eq(s.anzahl(), 2, 'Bei 2 gemerkten Bewerbern soll anzahl 2 sein.'); s.umschalten(1); T.eq(s.merkliste(), [3], 'Nochmal umschalten(1) soll 1 entfernen.'); } },
      { name: 'Kein effect, der Signals setzt', run: T => T.ok(!/effect\s*\(\s*\(\s*\)\s*=>\s*\{?[^}]*\.(set|update)\(/.test(T.code), 'Im effect wird ein Signal gesetzt. Der effect soll nur speichern.') }
    ] },
  merke: ['effect = Nebenwirkung bei Änderung.', 'Läuft am Anfang und danach bei jeder Änderung.', 'Ableiten immer mit computed.']
});

CH.push({
  id: 'g04', akt: 2, title: 'Angulars Eigenarten', tag: 'Was Angular anders macht', xp: 60,
  doku: [['Modulares Design mit Dependency Injection', 'https://angular.dev/essentials/dependency-injection'], ['Versionen und Releases', 'https://angular.dev/reference/releases'], ['Migrationen im Überblick', 'https://angular.dev/reference/migrations']],
  ticket: { id: 'PW-104', typ: 'Frage', titel: 'Warum ist Angular so streng?', text: 'In alten Code Reviews tauchen immer wieder dieselben Kommentare zu Angular-Regeln auf. Finde heraus, warum es die Regeln gibt.' },
  story: [
    ['du', 'Ich hab mir alte Pull Requests angeschaut. Fast überall steht: „So macht man das in Angular nicht.“'],
    ['toni', 'Weil Angular „opinionated“ ist. Es hat eine Meinung, wie man es richtig macht. Lern die Meinung, dann sind die Kommentare logisch. Und dein erster PR bekommt weniger davon.']
  ],
  slides: [
    { t: 'Angular hat eine Meinung', say: '„Opinionated“ heißt: Für fast alles gibt es EINEN empfohlenen Weg. Du musst weniger entscheiden.',
      job: 'Den Vorteil merkst du beim Jobwechsel: Ein Angular-Projekt bei einer Bank sieht ähnlich aus wie eins bei einer Versicherung. Du bist nach Tagen produktiv, nicht nach Wochen.',
      punkte: [['Immer TypeScript', 'Nicht optional. Angular selbst ist in TypeScript geschrieben.', ''], ['Immer Decorators', '@Component, @Service(): Etiketten auf Klassen.', ''], ['Immer Dependency Injection', 'Services werden nicht gebaut, sondern mit inject() geholt.', ''], ['RxJS ist eingebaut', 'HttpClient liefert Observables. Das sind Werte, die über die Zeit nacheinander ankommen. Die lernst du später genau kennen, an RxJS kommst du nicht vorbei.', '']],
      pro: 'Im Vergleich: React lässt dir fast jede Freiheit. Das ist toll für Kleine, aber in großen Teams macht dann jeder es anders. Angular zwingt alle in dieselbe Richtung.' },
    { t: 'Dependency Injection: Angulars Superkraft', say: 'Statt dass sich jede Komponente ihre Werkzeuge selbst baut, liefert Angular sie. Du fragst nur danach.',
      job: 'Ändert das Backend-Team die Server-Adresse, änderst du sie an EINER Stelle im Service. Und im Test tauschst du den echten Service gegen einen Fake, ohne die Komponente anzufassen.',
      code: C`
// Ohne DI: jeder baut sich selbst einen
export class Team {
  api = new EntwicklerApi(new HttpClient(/* ??? */));
}

// Mit DI: Angular liefert
export class Team {
  api = inject(EntwicklerApi);
}`,
      notes: [['new EntwicklerApi', 'Selbst bauen: Du musst wissen, was EntwicklerApi selbst alles braucht. Und das, was das braucht …'], ['inject(EntwicklerApi)', 'Angular kennt den Bauplan und gibt dir einen fertigen.']],
      pro: 'Riesen-Vorteil beim Testen: Im Test sagst du Angular „gib statt der echten EntwicklerApi eine Fake-Version“. Kein echter Server nötig. Das ist der Grund, warum DI in großen Firmen so geliebt wird.' },
    { t: 'Neues und altes Angular', say: 'Angular hat sich stark verändert. Im Job triffst du beides. Du musst beides lesen können.',
      job: 'Fast jede Firma hat beides im Repo: neue Komponenten mit Signals und @if, alte mit NgModule und *ngIf. Tickets im Altcode bekommst du ab Woche eins.',
      punkte: [['NgModule → standalone', 'Früher musste jede Komponente in ein Modul. Heute nicht mehr.', ''], ['*ngIf / *ngFor → @if / @for', 'Neue Schreibweise im Template, seit Angular 17.', ''], ['@Input() / @Output() → input() / output()', 'Funktionen statt Decorators, eingeführt in Angular 17.1 und 17.3, stabil seit Angular 19.', ''], ['constructor(private x: X) → inject(X)', 'Services holen ohne Konstruktor.', ''], ['@Injectable({ providedIn: \'root\' }) → @Service()', 'Kurzform für Services, seit Angular 22.', ''], ['Default → OnPush', 'Seit Angular 22 prüft Angular jede Komponente nur noch bei echtem Grund.', ''], ['Zone.js → zoneless', 'Früher hat Zone.js Angular bei jedem Klick und Timer geweckt. Heute melden Signals und Events selbst, dass neu gezeichnet werden muss. Standard seit Angular 21.', ''], ['strictTemplates: aus → an', 'Seit Angular 22 prüft der Compiler auch Templates streng: Passt ein Typ im Template nicht, bricht der Build ab. In Altprojekten setzt ng update dafür strictTemplates: false, damit nichts kaputtgeht. Einschalten lohnt sich, dann findet der Compiler Fehler, bevor ein Kunde sie sieht.', '']],
      pro: 'Bis Angular 22 kam alle 6 Monate eine neue Hauptversion (… 20, 21, 22), seitdem alle 12 Monate. Aktuell ist Angular 22. Jede wird 24 Monate gepflegt. Darum findest du online viele alte Anleitungen. Achte immer auf das Datum.' },
    { t: 'Weitere Eigenarten', say: 'Ein paar Dinge, über die jeder Angular-Neuling stolpert.',
      job: 'Genau diese Punkte kommen in deinen ersten Code Reviews als Kommentare. Kennst du sie vorher, sparst du dir die Runden.',
      punkte: [['Klammern haben Bedeutung', '[ ] = Wert rein, ( ) = horchen, [( )] = beides („Banana in a box“).', ''], ['Signals werden aufgerufen', 'tickets() mit Klammern. tickets ohne Klammern ist die Box, nicht der Wert.', ''], ['Das $ am Ende', 'Später lernst du Observables kennen: Werte, die über die Zeit nacheinander kommen. Man erkennt sie oft am $ im Namen, z. B. entwickler$. Das ist nur eine Konvention, aber du siehst sie überall.', ''], ['CSS bleibt drinnen', 'Styles einer Komponente wirken nur in ihr.', ''], ['Viele Dateien', 'Auch für kleine Dinge gibt es mehrere Dateien und etwas mehr Code.', '']],
      pro: 'Das [( )] heißt Two-Way-Binding, z. B. [(ngModel)]="name". Merkhilfe: eine Banane (runde Klammern) in einer Kiste (eckige Klammern).' }
  ],
  quiz: [
    { q: 'Angular gilt als „opinionated“. Was heißt das?', options: ['Angular erzwingt ein festes Design für alle Apps', 'Es gibt für fast alles einen empfohlenen Weg', 'Jedes Team legt seine eigenen Regeln fest', 'Angular erlaubt nur eine Komponente pro Seite'], correct: 1, why: 'Angular gibt ein klares System vor. Du musst weniger entscheiden, und alle im Team machen es gleich.' },
    { q: 'Warum hilft Dependency Injection beim Testen?', options: ['DI schreibt die Tests automatisch', 'Man kann echte Services leicht gegen Fakes tauschen', 'Mit DI braucht man keinen Test-Runner mehr', 'DI prüft beim Bauen, ob alle Services fehlerfrei sind'], correct: 1, why: 'Im Test tauschst du den echten Service gegen einen Fake. So braucht der Test keinen echten Server und bleibt schnell und stabil.' },
    { q: 'Im Code deiner Firma steht *ngFor. Was ist das?', options: ['Ein Tippfehler, der den Build bricht', 'Die alte Schreibweise von @for', 'Ein RxJS-Operator für Listen', 'Eine neue Schreibweise seit Angular 22'], correct: 1, why: '*ngFor funktioniert noch, ist aber die alte Schreibweise von @for. Die Angular CLI kann solchen Code automatisch auf @for umbauen.' }
  ],
  merke: ['Angular ist „opinionated“: ein empfohlener Weg für fast alles.', 'Immer TypeScript, Decorators, DI, und RxJS ist eingebaut.', 'Altes Angular (NgModule, *ngIf, @Input) und neues (standalone, @if, input()) musst du beide lesen können.', 'Regelmäßig neue Hauptversionen (bis Angular 22 alle 6 Monate, seitdem alle 12 Monate). Bei Anleitungen aufs Datum achten.']
});
