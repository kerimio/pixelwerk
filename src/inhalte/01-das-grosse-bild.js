/* ================= Phase: DAS GROSSE BILD =================
   Kurzer Einstieg: verstehen, WAS Angular ist, und gleich der erste Klick. Die übrigen Grundlagen-Kapitel stehen später,
   da, wo sie gebraucht werden (Was ist alles dabei, Eigenarten, Sicherheit, Stärken und Schwächen).
   Slides können neben code/notes auch punkte: [[titel, text, 'plus'|'minus'|'']] haben. */
AKTE.push({ n: 0, title: 'Das große Bild', sub: 'Was Angular ist, wie eine App startet, dein erster Klick' });

CH.push(
{
  id: 'g01', akt: 0, title: 'Was ist Angular?', tag: 'Framework · Web-App', xp: 40,
  doku: [['Was ist Angular?', 'https://angular.dev/overview'], ['Komponenten im Überblick', 'https://angular.dev/essentials/components'], ['Reaktivität mit Signals', 'https://angular.dev/essentials/signals']],
  ticket: { id: 'PW-101', typ: 'Onboarding', titel: 'Erster Tag: Projekt verstehen', text: 'Lies dich ins Teamboard ein, unser internes Angular-Projekt. Ziel bis Freitag: Du kannst in zwei Sätzen erklären, was Angular in unserem Projekt macht.' },
  story: [
    ['erz', 'Montag, 9:00 bei Pixelwerk in Köln. Laptop ist da, Zugänge fehlen noch, Kaffee gibt es in der Küche.'],
    ['du', 'Toni, im Bewerbungsgespräch hab ich bei „Angular“ nur genickt. Was IST das eigentlich?'],
    ['toni', 'Gute Frage. Die stellen die wenigsten. Wir fangen ganz vorne an.']
  ],
  slides: [
    { t: 'Der Browser kann nur drei Dinge', say: 'Jeder Browser versteht genau drei Sprachen: HTML, CSS und JavaScript. Sonst nichts.',
      job: 'Öffne im Teamboard F12 und dann den Tab „Elements“. Was du da siehst, ist nur HTML. Egal was die Firma für ein Framework benutzt: Am Ende landet genau das im Browser.',
      punkte: [['HTML', 'Die Struktur: Überschrift, Knopf, Liste.', ''], ['CSS', 'Das Aussehen: Farben, Abstände, Schrift.', ''], ['JavaScript', 'Das Verhalten: Klick → etwas passiert.', '']],
      pro: 'Angular ändert daran nichts. Am Ende kommt immer HTML, CSS und JavaScript im Browser an. Angular ist nur ein sehr gutes Werkzeug, um das zu erzeugen.' },
    { t: 'Ohne Angular: alles von Hand', say: 'Mit purem JavaScript musst du jede Kleinigkeit selbst machen: Element suchen, Text ändern, aufpassen.',
      job: 'Fast jede Firma hat irgendwo noch eine alte Seite mit jQuery oder purem JavaScript. Dort findest du genau diese Bugs: Der Zähler oben stimmt nicht mit der Liste unten überein.',
      code: C`
// Pures JavaScript, ganz ohne Angular
let tickets = 0;
const anzeige = document.querySelector('#tickets');
const knopf = document.querySelector('#ticket-knopf');

knopf.addEventListener('click', () => {
  tickets = tickets + 1;
  anzeige.textContent = 'Tickets: ' + tickets;
});`,
      notes: [['let tickets', 'Der Zähler. Nur eine Zahl im Speicher.'], ['querySelector(\'#tickets\')', 'Such im HTML das Element mit der id „tickets“. Von Hand.'], ['addEventListener', 'Horch auf Klicks am Knopf. Von Hand.'], ['tickets = tickets + 1', 'Zahl erhöhen. Die Anzeige weiß davon NICHTS.'], ['textContent', 'Darum musst du die Anzeige selbst umschreiben. Vergisst du das an einer Stelle: falscher Zähler.']],
      pro: 'Das Hauptproblem heißt „Daten und Bildschirm synchron halten“. Genau das löst jedes moderne Framework (Angular, React, Vue): Du änderst die Daten, der Bildschirm folgt automatisch.' },
    { t: 'Mit Angular: du sagst nur WAS', say: 'In Angular beschreibst du, wie es aussehen soll. Angular kümmert sich ums Wie.',
      job: 'In einer Firmen-App ändert dein Ticket fast nie das DOM direkt. Du änderst Daten, und die Anzeige folgt. Siehst du im Review document.querySelector in einer Komponente, ist das meistens ein Warnzeichen.',
      code: C`
@Component({
  selector: 'app-anzeige',
  template: \`
    <p>Tickets: {{ tickets() }}</p>
    <button (click)="erledigt()">Erledigt!</button>
  \`,
})
export class Anzeige {
  tickets = signal(0);
  erledigt() { this.tickets.update(t => t + 1); }
}`,
      notes: [['{{ tickets() }}', 'Hier steht IMMER der aktuelle Zähler. Kein querySelector, kein textContent.'], ['(click)', 'Klick horchen, direkt im HTML.'], ['signal(0)', 'Der Zähler als Signal. Es sagt Angular Bescheid, wenn es sich ändert.'], ['update', 'Du änderst nur die Zahl. Den Bildschirm macht Angular.'], ['t => t + 1', 'Lies t => t + 1 als: Nimm den alten Wert t und gib t + 1 zurück. Diese Kurzform heißt Pfeilfunktion. Genauer erklärt im Kapitel „TypeScript: Typen und Funktionen“ (Phase Grundlagen).']],
      pro: 'Das nennt man „deklarativ“ (beschreiben, was sein soll) statt „imperativ“ (jeden Schritt befehlen). Das ist der wichtigste Denkwechsel überhaupt.' },
    { t: 'Library oder Framework?', say: 'Eine Library ist ein Werkzeug, das DU aufrufst. Ein Framework ist ein Rahmen, der DICH aufruft.',
      job: 'Im Bewerbungsgespräch kommt oft: „Angular oder React?“ Die gute Antwort fängt mit diesem Unterschied an: Angular ist ein Framework mit festen Regeln, React eine Library, um die du alles selbst baust.',
      punkte: [['Library', 'Du bestimmst den Ablauf und holst dir Hilfe, wenn du sie brauchst. Beispiel: RxJS.', ''], ['Framework', 'Angular bestimmt den Ablauf. Du füllst die Lücken: Komponenten, Services. Angular ruft deinen Code zur richtigen Zeit auf.', '']],
      pro: 'Man nennt das „Inversion of Control“ oder Hollywood-Prinzip: „Don’t call us, we’ll call you.“ Darum schreibst du in Angular fast nie new Komponente(). Angular baut sie.' },
    { t: 'Eine Seite, die sich verwandelt', say: 'Angular-Apps sind „Single Page Applications“ (SPA). Der Browser lädt EINE Seite. Danach tauscht Angular nur noch Inhalte aus.',
      job: 'Wenn du im Teamboard von „Projekte“ zu „Tickets“ klickst, schau in den Netzwerk-Tab: Es kommt keine neue HTML-Seite, nur JSON-Daten. Daran erkennst du jede SPA.',
      punkte: [['Klassische Webseite', 'Jeder Klick lädt eine komplett neue Seite vom Server. Kurz weiß, flackern.', 'minus'], ['SPA mit Angular', 'Ein Klick tauscht nur den Teil, der sich ändert. Fühlt sich an wie eine App.', 'plus']],
      pro: 'Woher: AngularJS hat Miško Hevery 2009 bei Google erfunden, 2010 kam es raus. 2016 hat Google es komplett neu geschrieben: Das ist „Angular“ (ohne JS). Zwei verschiedene Frameworks mit fast gleichem Namen. Wenn im Job jemand „AngularJS“ sagt: das alte. Angular ist kostenlos und Open Source (MIT-Lizenz).' }
  ],
  quiz: [
    { q: 'Was kommt am Ende im Browser an, wenn du Angular benutzt?', options: ['TypeScript, das der Browser direkt ausführt', 'HTML, CSS und JavaScript', 'Angular-Templates, die ein Browser-Plugin liest', 'Fertiges HTML ohne JavaScript'], correct: 1, why: 'Der Browser versteht nur diese drei Sprachen. Angular übersetzt deinen Code vor der Auslieferung in HTML, CSS und JavaScript.' },
    { q: 'Was ist der größte Unterschied zwischen Angular und purem JavaScript?', options: ['Angular-Code läuft immer schneller als pures JavaScript', 'Du änderst Daten, der Bildschirm folgt automatisch', 'Du schreibst kein HTML mehr, nur noch TypeScript', 'Angular lädt bei jedem Klick die passende Seite vom Server'], correct: 1, why: 'Angular hält Daten und Bildschirm automatisch synchron. Mit purem JavaScript musst du das selbst erledigen.' },
    { q: 'Worin unterscheiden sich ein Framework und eine Library, wenn es darum geht, wer wessen Code aufruft?', options: ['Bei beiden rufst du selbst den Code auf', 'Ein Framework ruft deinen Code auf, eine Library rufst du selbst auf', 'Eine Library ruft deinen Code auf, ein Framework rufst du selbst auf', 'Bei beiden ruft der Browser deinen Code direkt auf'], correct: 1, why: 'Das nennt man Hollywood-Prinzip: Ein Framework wie Angular ruft deinen Code zur richtigen Zeit auf. Eine Library rufst du selbst auf.' }
  ],
  ex: { id: 'exg01', title: 'Der erste Klick', goal: 'Die Klasse ist fertig. Verbinde nur noch Anzeige und Knopf mit ihr, dann hält Angular beides synchron. In der Vorschau kannst du gleich klicken.', preview: 'Anzeige',
    todo: ['Im <code>&lt;p&gt;</code> steht der Zähler: <code>Tickets: {{ tickets() }}</code>', 'Der Knopf ruft bei <code>(click)</code> die Methode <code>erledigt()</code> auf'],
    starter: C`
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-anzeige',
  template: \`
    <p>Tickets: 0</p>
    <button>Erledigt!</button>
  \`,
})
export class Anzeige {
  tickets = signal(0);
  erledigt() { this.tickets.update(t => t + 1); }
}
`,
    solution: C`
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-anzeige',
  template: \`
    <p>Tickets: {{ tickets() }}</p>
    <button (click)="erledigt()">Erledigt!</button>
  \`,
})
export class Anzeige {
  tickets = signal(0);
  erledigt() { this.tickets.update(t => t + 1); }
}
`,
    notes: [['{{ tickets() }}', 'Hier steht immer der aktuelle Wert. Ändert sich das Signal, ändert Angular die Zahl.'], ['(click)="erledigt()"', 'Bei jedem Klick ruft Angular deine Methode auf. Kein addEventListener, kein querySelector.']],
    hints: ['Statt der festen 0 im <code>&lt;p&gt;</code> kommt der Wert aus der Klasse: <code>{{ tickets() }}</code>. Signals liest man mit Klammern.', 'Am Knopf: <code>&lt;button (click)="erledigt()"&gt;</code>'],
    tests: [
      { name: 'Anfangs steht da Tickets: 0', run: T => { const f = T.mount(T.cmp('Anzeige')); T.ok(/Tickets:\s*0\b/.test(f.q('p').textContent), 'Im <p> soll „Tickets: 0“ stehen.'); } },
      { name: 'Ein Klick zählt hoch', run: async T => { const f = T.mount(T.cmp('Anzeige')); await f.click('button'); await f.click('button'); T.ok(/Tickets:\s*2\b/.test(f.q('p').textContent), 'Nach zwei Klicks soll „Tickets: 2“ dastehen. Ruft der Knopf erledigt() auf, und steht im <p> {{ tickets() }}?'); } }
    ] },
  merke: ['Browser verstehen nur HTML, CSS, JavaScript. Angular erzeugt genau das.', 'Angular hält Daten und Bildschirm automatisch synchron.', 'Framework = fester Rahmen. Es ruft deinen Code (Hollywood-Prinzip).', 'AngularJS (alt, 2010) ≠ Angular (neu, seit 2016).'],
  paare: [
    ['HTML', 'Die Struktur: Überschrift, Knopf, Liste'],
    ['CSS', 'Das Aussehen: Farben, Abstände, Schrift'],
    ['JavaScript', 'Das Verhalten: Klick, und etwas passiert'],
    ['Framework', 'Fester Rahmen, der deinen Code aufruft'],
    ['SPA', 'Eine Seite lädt, danach tauscht Angular nur Inhalte aus']
  ]
},
{
  id: 'g02', akt: 0, title: 'Was passiert beim Start?', tag: 'index.html · main.ts · Komponenten-Baum', xp: 40,
  doku: [['Angular-Apps bauen', 'https://angular.dev/tools/cli/build'], ['Zoneless Change Detection', 'https://angular.dev/guide/zoneless'], ['Aufbau von Komponenten', 'https://angular.dev/guide/components']],
  ticket: { id: 'PW-102', typ: 'Onboarding', titel: 'Wo fängt die App an?', text: 'Stell dir vor, die App läuft auf deinem Rechner. Finde heraus, welche Datei als Erstes läuft. Wie du ein Projekt klonst und mit ng serve startest, übst du im Kapitel „Die Werkbank“ (Phase Grundlagen).' },
  story: [
    ['du', 'Toni, das Teamboard läuft auf deinem Laptop. Aber ich hab keine Ahnung, wo es eigentlich anfängt.'],
    ['toni', 'Dann gehen wir den Weg einmal ab: vom Laden der Seite bis zum ersten Klick. Danach findest du dich in jedem Angular-Projekt zurecht.']
  ],
  slides: [
    { t: 'Schritt 1: eine fast leere HTML-Seite', say: 'Der Browser lädt index.html. Darin steht fast nichts, nur ein einziger eigener Tag.',
      job: 'Zeigt die App nur eine weiße Seite, schau zuerst in index.html und in die Konsole. Fehlt <app-root> oder ist der selector falsch geschrieben, startet einfach nichts. Das ist ein echter Klassiker beim Umbenennen.',
      code: C`
<!-- index.html -->
<html>
  <body>
    <app-root></app-root>
    <script src="main.js"><\/script>
  </body>
</html>`,
      notes: [['<app-root>', 'Ein leerer Platzhalter. Der Browser kennt den Tag nicht und ignoriert ihn erst mal.'], ['<script', 'Das lädt dein übersetztes Angular-Programm. Ab jetzt übernimmt Angular.']],
      pro: 'Darum sieht man bei einer Angular-App mit „Seitenquelltext anzeigen“ fast nichts. Alles entsteht erst durch JavaScript. Problem für Google-Suche → Lösung: SSR (später).' },
    { t: 'Schritt 2: main.ts startet die App', say: 'main.ts ist die allererste Datei, die läuft. Sie sagt: Starte Angular mit dieser Komponente.',
      job: 'In main.ts bzw. app.config.ts stehen die Provider für die ganze App: Router, HttpClient, Interceptors. Ein Provider ist ein Eintrag, der Angular sagt, wie es ein Werkzeug für alle bereitstellt. Mehr dazu im Kapitel „Das Backoffice“ (Phase Probezeit). Fragt dich jemand „Wo ist das HTTP eingestellt?“, schaust du genau da.',
      code: C`
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app';

bootstrapApplication(App, {
  providers: []
});`,
      notes: [['bootstrapApplication', 'Startet Angular. „Bootstrap“ heißt: sich selbst an den Stiefeln hochziehen, also aus dem Nichts hochfahren.'], ['App', 'Die oberste Komponente. Ihr selector ist app-root.'], ['providers', 'Hier meldest du Dinge für die ganze App an, z. B. Router oder HttpClient.']],
      pro: 'Ältere Projekte starten mit platformBrowserDynamic().bootstrapModule(AppModule). Gleiches Ziel, alte Schreibweise mit NgModule.' },
    { t: 'Schritt 3: der Baum wächst', say: 'Angular findet <app-root>, baut die App-Komponente, schaut in ihr Template und baut jede Komponente darin. Immer weiter.',
      job: 'Mit den Angular DevTools im Browser siehst du diesen Baum live. So findest du in einem fremden Projekt schnell heraus, welche Komponente welchen Teil der Seite baut.',
      code: C`
App                 (app-root)
├── Kopfzeile       (app-kopfzeile)
├── Team           (app-team)
│   ├── EntwicklerKarte  (Leon)
│   ├── EntwicklerKarte  (Mo)
│   └── EntwicklerKarte  (Ben)
└── Anzeigetafel    (app-anzeigetafel)`,
      notes: [['App', 'Die Wurzel. Es gibt immer genau eine.'], ['Team', 'Eine Komponente in einer Komponente.'], ['EntwicklerKarte', 'Dieselbe Komponente dreimal, jede mit eigenen Daten.']],
      pro: 'Daten fließen im Baum nach unten (input), Meldungen nach oben (output). Services sitzen außerhalb vom Baum und sind für alle erreichbar.' },
    { t: 'Schritt 4: es passiert was', say: 'Jemand klickt. Ein Signal ändert sich. Angular prüft nur die Komponenten, die dieses Signal lesen, und ändert im DOM nur, was wirklich anders ist.',
      job: 'Wenn eine Seite im Projekt bei jeder Kleinigkeit spürbar ruckelt, wird oft zu viel neu geprüft. Später lernst du, wie Signals das verhindern.',
      punkte: [['1. Klick', 'Der Browser meldet: Klick auf den Knopf.', ''], ['2. Dein Code', 'tickets.update(t => t + 1)', ''], ['3. Signal meldet', 'Mein Wert hat sich geändert!', ''], ['4. Angular malt', 'Die Komponente mit {{ tickets() }} wird geprüft. Im DOM ändert sich nur die Zahl im <p>.', '']],
      pro: 'Dieses Neuzeichnen heißt „Change Detection“. Früher hat Zone.js, ein Hilfspaket, Angular nach jedem Klick oder Timer Bescheid gesagt, und Angular hat die ganze App geprüft. Nur Komponenten mit OnPush durften aussetzen. OnPush ist eine Einstellung, die sagt: Prüf mich nur, wenn sich bei mir etwas ändert. Heute fällt Zone.js weg, das heißt „zoneless“ und ist seit v21 Standard: Signals und Events melden selbst, dass etwas neu gezeichnet werden muss. Zusammen mit OnPush (Standard seit v22) prüft Angular dann nur die betroffenen Komponenten. Zoneless und OnPush erklärt genau das Kapitel „Die hängende Stoppuhr“ (Phase Fest im Team).' },
    { t: 'Vom Code zur App: der Build', say: 'Dein Code läuft nicht direkt. Vorher übersetzt ihn die Angular CLI in kleine, schnelle JavaScript-Dateien.',
      job: 'In der Pipeline läuft ng build bei jedem Pull Request. Bricht der Build, kommt dein Code nicht rein. Was du lokal mit ng serve siehst, ist nicht genau das, was auf den Server geht.',
      punkte: [['TypeScript → JavaScript', 'Typen werden geprüft und dann weggeworfen.', ''], ['Templates → Befehle', 'Dein HTML wird zu JavaScript-Code, der Elemente baut.', ''], ['Bündeln', 'Hunderte Dateien werden zu wenigen zusammengepackt.', ''], ['Aufräumen', 'Unbenutzter Code fliegt raus (Tree-Shaking). Alles wird verkleinert.', '']],
      pro: 'ng build legt das Ergebnis im Ordner dist/ ab. Diese Dateien kommen auf den Server. Die übrigen CLI-Befehle lernst du im Kapitel „Was ist alles dabei?“ kennen.' }
  ],
  quiz: [
    { q: 'Was steht in der index.html einer Angular-App?', options: ['Das komplette HTML aller Seiten', 'Fast nichts, nur <app-root> und ein Script', 'Der TypeScript-Code der App', 'Die Templates aller Komponenten'], correct: 1, why: 'Alles Sichtbare baut Angular erst im Browser per JavaScript auf.' },
    { q: 'Was macht der Aufruf bootstrapApplication(App) in der Datei main.ts?', options: ['Er übersetzt TypeScript in JavaScript', 'Er startet Angular mit App als oberster Komponente', 'Er lädt die index.html vom Server', 'Er installiert die Angular-Pakete'], correct: 1, why: 'Das ist der Startschuss: Angular setzt die Komponente App in <app-root> ein, und von dort wächst der Komponenten-Baum.' },
    { q: 'Ein Signal ändert seinen Wert. Was macht Angular daraufhin?', options: ['Angular lädt die Seite neu', 'Angular prüft jede Komponente der App', 'Angular aktualisiert nur die Stellen, die das Signal benutzen', 'Angular macht nichts, bis du die Seite neu lädst'], correct: 2, why: 'Angular weiß, welche Stellen das Signal lesen, und aktualisiert nur diese. Genau das macht Signals so stark.' }
  ],
  merke: ['index.html ist fast leer. Angular baut alles in <app-root>.', 'main.ts startet alles mit bootstrapApplication.', 'Komponenten bilden einen Baum. Daten runter, Meldungen hoch.', 'Signal ändert sich → nur die betroffene Stelle wird neu gemalt.'],
  paare: [
    ['<code>index.html</code>', 'Fast leere Seite mit nur einem eigenen Tag'],
    ['<code>main.ts</code>', 'Startet Angular mit bootstrapApplication'],
    ['Komponenten-Baum', 'Daten fließen runter, Meldungen hoch'],
    ['Tree-Shaking', 'Unbenutzter Code fliegt beim Build raus']
  ]
}
);
