/* ================= Phase: ERSTE WOCHE ================= */
AKTE.push({ n: 1, title: 'Erste Woche', sub: 'TypeScript, Komponenten, Templates, Signals' });


CH.push({
  id: 'k01', akt: 1, title: 'Das erste Ticket', tag: 'Bausteine · Funktionen', xp: 60,
  doku: [['Komponenten im Überblick', 'https://angular.dev/essentials/components'], ['Template-Literale', 'https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Template_literals']],
  ticket: { id: 'PW-114', typ: 'Feature', titel: 'Begrüßung für neue Kollegen', text: 'Neue Kollegen sollen nach dem Login im Teamboard „Willkommen im Team, <Name>!“ sehen. Erstes Ticket für dich, klein und abgeschlossen.' },
  story: [
    ['erz', 'Ein paar Tage später. Die Einarbeitung ist durch, die Zugänge laufen. Das interne Teamboard (Projekte, Tickets, Zeiten) ist alt und wackelig und wird gerade mit Angular neu gebaut. Jetzt schreibst du zum ersten Mal selbst Code.'],
    ['sara', 'Hi, ich bin Sara, Projektmanagerin. Dein erstes Ticket ist bewusst klein. Damit du den Ablauf kennenlernst.'],
    ['toni', 'Ticket lesen, Code schreiben, Tests grün, Pull Request. So läuft hier jede Aufgabe.']
  ],
  slides: [
    { t: 'Angular = Baukasten für Apps', say: 'Kennst du aus dem großen Bild: Eine App besteht aus Bausteinen. Jetzt baust du sie selbst.', job: 'Öffnest du ein neues Firmenprojekt, siehst du im Ordner src/app lauter solcher Bausteine: header, entwickler-liste, ticket-button. Jedes Ticket betrifft meist nur einen oder zwei davon.',
      code: C`
@Component({
  selector: 'app-anzeige',
  template: \`<p>Tickets: {{ tickets() }}</p>\`,
})
export class Anzeige {
  tickets = signal(0);
}`,
      notes: [['@Component', 'Sagt Angular: „Das ist ein Baustein.“'], ['selector', 'Name im HTML. Du schreibst dann <app-anzeige />.'], ['template', 'Das, was man sieht.'], ['{{', 'Hier kommt ein Wert aus der Klasse rein.'], ['export class', 'Die Klasse. Hier wohnen die Daten.'], ['signal(0)', 'Ein Wert, der Bescheid sagt, wenn er sich ändert.']],
      pro: 'Modernes Angular (wir nutzen v22): standalone, Signals, @if/@for, inject(), @Service(), OnPush als Standard. Alter Firmen-Code hat oft NgModule und *ngIf. Du lernst das Neue und siehst das Alte zum Vergleich.' },
    { t: 'Funktionen', say: 'Funktion: Etwas rein, etwas raus.', job: 'Hilfsfunktionen wie gruss() oder formatPreis() liegen in Firmen oft in einer eigenen Datei utils.ts. Sie sind am leichtesten zu testen, darum bekommen Neue sie oft als erstes Ticket.',
      code: C`
export function doppelt(stunden: number): number {
  return stunden * 2;
}

const name = 'Leon';
const satz = \`Ticket erledigt von \${name}!\`;`,
      notes: [['export function', 'export = andere Dateien dürfen das benutzen.'], ['stunden: number)', 'Rein kommt eine Zahl. ": number" ist das Typ-Etikett.'], ['): number {', 'Raus kommt auch eine Zahl.'], ['return', 'return gibt das Ergebnis raus.'], ['const name', 'const = Box mit festem Inhalt.'], ['`Ticket', 'Backticks ` erlauben ${...}. Ergebnis: "Ticket erledigt von Leon!"']],
      pro: 'TypeScript-Typen gibt es nur beim Bauen. Im Browser läuft normales JavaScript. Daten vom Server musst du trotzdem prüfen.' }
  ],
  quiz: [{ q: 'Was ist eine Angular-Komponente?', options: ['Eine HTML-Datei mit Platzhaltern', 'Ein Baustein aus Klasse und Template', 'Ein Service, der Daten für alle hält', 'Ein Stylesheet für einen Seitenbereich'], correct: 1, why: 'Die Klasse hält die Daten, das Template beschreibt das Aussehen. Zusammen ergeben sie einen Baustein.' },
    { q: 'Die Funktion <code>doppelt(stunden: number): number</code> gibt <code>stunden * 2</code> zurück. Was liefert <code>doppelt(4)</code>?', options: ['4', '8', 'Den Text 44', 'Einen Fehler, weil der Typ fehlt'], correct: 1, why: 'Rein kommt 4, return gibt 4 * 2 zurück, also 8. Das : number nach der Klammer verspricht genau so eine Zahl.' },
    { q: 'Im Code steht <code>const name = \'Leon\'</code>. Was ergibt <code>`Hallo ${name}`</code> mit Backticks?', options: ['Hallo Leon', 'Hallo ${name}', 'Hallo name', 'Einen Fehler'], correct: 0, why: 'Nur mit Backticks setzt ${...} den Wert ein. In normalen Anführungszeichen stünde der Text ${name} wörtlich da.' }
  ],
  ex: { id: 'ex01', title: 'Der Begrüßungsbot', goal: 'Der Bot im Team-Chat begrüßt jeden Neuen.',
    todo: ['<code>gruss("Kerim")</code> gibt <code>"Willkommen im Team, Kerim!"</code> zurück', 'Klappt mit jedem Namen'],
    starter: C`
export function gruss(name: string): string {
  // Ersetze '' durch einen Text mit dem Namen
  return '';
}
`,
    solution: C`
export function gruss(name: string): string {
  return \`Willkommen im Team, \${name}!\`;
}
`,
    notes: [['export function gruss', 'Funktion gruss, bekommt einen Text (string).'], ['return', 'Backticks + ${name}: Der Name wird eingesetzt.']],
    hints: ['Du brauchst Backticks: <code>`...`</code>', 'So: <code>`Willkommen im Team, ${name}!`</code>'],
    tests: [
      { name: 'gruss("Kerim") stimmt', run: T => T.eq(T.get('gruss')('Kerim'), 'Willkommen im Team, Kerim!', 'Text stimmt noch nicht. Achte auf Komma und Ausrufezeichen.') },
      { name: 'Klappt mit jedem Namen', run: T => T.eq(T.get('gruss')('Leon'), 'Willkommen im Team, Leon!', 'Steht "Kerim" fest drin? Nimm die Variable name.') }
    ] },
  merke: ['App = Bausteine (Komponenten).', 'Komponente = Klasse (Daten) + Template (Aussehen).', '`Text ${wert}` setzt Werte ein.'],
  paare: [
    ['Komponente', 'Ein Baustein der App'],
    ['Klasse', 'Hält die Daten der Komponente'],
    ['Template', 'Beschreibt das Aussehen als HTML'],
    ['Funktion', 'Etwas rein, etwas raus'],
    ['<code>`Hallo ${name}`</code>', 'Setzt einen Wert in einen Text ein']
  ]
});

CH.push({
  id: 'k02', akt: 1, title: 'Saubere Profile', tag: 'TypeScript: Interfaces', xp: 70,
  doku: [['Objekttypen und Interfaces', 'https://www.typescriptlang.org/docs/handbook/2/objects.html']],
  ticket: { id: 'PW-115', typ: 'Bug', titel: 'Profil zeigt Tickets = „vielleicht“', text: 'Im Entwicklerprofil steht bei Leon „Tickets: vielleicht“. Die Daten haben keinen festen Typ. Lege ein Interface an, damit so etwas nicht mehr durchrutscht.' },
  story: [
    ['leon', 'In meinem Profil im Teamboard steht: Tickets = „vielleicht“. Sehr witzig.'],
    ['toni', 'Das passiert, wenn Daten keinen Typ haben. Wir schreiben ein Interface. Dann meckert der Compiler, bevor es ein Kunde sieht.']
  ],
  slides: [
    { t: 'Interface = Vorlage für Daten', say: 'Ein Interface sagt, welche Felder ein Objekt haben MUSS.', job: 'In Firmenprojekten gibt es fast immer einen Ordner models/ mit Interfaces für jede API-Antwort. Ändert das Backend ein Feld, zeigt dir der Compiler sofort jede Stelle, die angepasst werden muss.',
      code: C`
interface Entwickler {
  id: number;
  name: string;
  position: 'Frontend' | 'Backend';
  tickets: number;
  lead?: boolean;
}

const leon: Entwickler = { id: 1, name: 'Leon', position: 'Frontend', tickets: 12 };`,
      notes: [['interface Entwickler', 'Vorlage mit dem Namen Entwickler.'], ['id: number', 'Pflichtfeld: Zahl.'], ['name: string', 'Pflichtfeld: Text.'], ["'Frontend' | 'Backend'", 'Nur einer dieser zwei Texte. Heißt Union-Typ.'], ['lead?', 'Das ? heißt: darf fehlen.'], ['const leon: Entwickler', 'leon muss genau zur Vorlage passen.']],
      pro: 'Praktische Helfer für später: Partial<Entwickler> macht alle Felder optional, Omit<Entwickler, "id"> lässt id weg. Für Quiz und Übung brauchst du sie nicht.' },
    { t: 'any oder unknown?', say: 'Kennst du die Form von Daten nicht, nimm unknown. any schaltet alle Prüfungen ab, unknown zwingt dich erst zu prüfen.', job: 'Daten von außen (Server, localStorage, Datei-Upload) haben am Anfang keinen sicheren Typ. Steht im Review ein any, fragt das Team fast immer: „Geht das auch mit unknown?“',
      code: C`
let a: any = holeDaten();
a.name.toUpperCase();

let u: unknown = holeDaten();
if (typeof u === 'string') {
  u.toUpperCase();
}`,
      notes: [['let a: any', 'any heißt: „Alles erlaubt.“ TypeScript prüft hier nichts mehr.'], ['a.name.toUpperCase()', 'Kein Fehler beim Bauen. Hat a kein name, stürzt es erst im Browser ab.'], ['let u: unknown', 'unknown heißt: „Ich weiß noch nicht, was das ist.“'], ["typeof u === 'string'", 'Erst prüfen: Ist u ein Text? typeof liefert den Typ als Wort.'], ['u.toUpperCase()', 'Erst nach der Prüfung darfst du u wie einen Text benutzen. Ohne die Prüfung meldet TypeScript einen Fehler.']] }
  ],
  quiz: [{ q: 'Was bedeutet das Fragezeichen in <code>lead?: boolean</code> in einem Interface?', options: ['Das Feld ist privat', 'Das Feld darf fehlen', 'Das Feld ist immer false', 'Das Feld darf null sein, muss aber da sein'], correct: 1, why: 'Das Fragezeichen macht das Feld optional. Ein Profil ist auch ohne dieses Feld gültig.' },
    { q: 'Das Interface sagt <code>position: \'Frontend\' | \'Backend\'</code>. Welche Zuweisung meldet TypeScript als Fehler?', options: ['position: \'Frontend\'', 'position: \'Backend\'', 'Keine, jeder Text passt', 'position: \'Design\''], correct: 3, why: 'Ein Union-Typ erlaubt nur die aufgezählten Texte. Design steht nicht in der Liste, also meldet TypeScript schon beim Bauen einen Fehler.' },
    { q: 'Warum nimmst du für Daten, deren Form du nicht kennst, <code>unknown</code> statt <code>any</code>?', options: ['unknown ist im Browser schneller', 'any gibt es in TypeScript nicht mehr', 'unknown zwingt dich, den Typ erst zu prüfen, bevor du die Daten benutzt', 'unknown wandelt die Daten automatisch um'], correct: 2, why: 'any schaltet alle Prüfungen ab. Mit unknown musst du erst prüfen, etwa mit typeof, und darfst erst dann zugreifen. So fallen kaputte Server-Daten früh auf.' }
  ],
  ex: { id: 'ex02', title: 'Profile anlegen', goal: 'Gib dem Team saubere Entwicklerprofile.',
    todo: ['Im Interface fehlt <code>tickets: number</code>', 'Erstelle <code>export const mo: Entwickler</code>: id 2, Name „Mo“, Rolle „Backend“, 1 Ticket', '<code>brauchtTraining(entwickler)</code> gibt <code>true</code>, wenn tickets kleiner als 2'],
    starter: C`
export interface Entwickler {
  id: number;
  name: string;
  position: 'Frontend' | 'Backend';
  // hier fehlt tickets
}

export const leon: Entwickler = { id: 1, name: 'Leon', position: 'Frontend', tickets: 12 };

// export const mo ...

export function brauchtTraining(entwickler: Entwickler): boolean {
  return false;
}
`,
    solution: C`
export interface Entwickler {
  id: number;
  name: string;
  position: 'Frontend' | 'Backend';
  tickets: number;
}

export const leon: Entwickler = { id: 1, name: 'Leon', position: 'Frontend', tickets: 12 };

export const mo: Entwickler = { id: 2, name: 'Mo', position: 'Backend', tickets: 1 };

export function brauchtTraining(entwickler: Entwickler): boolean {
  return entwickler.tickets < 2;
}
`,
    notes: [['tickets: number', 'Neues Pflichtfeld im Profil.'], ['export const mo', 'Mo bekommt ein Profil nach Vorlage.'], ['return entwickler.tickets < 2', 'Vergleich ergibt true oder false. Genau das ist boolean.']],
    hints: ['Im Interface: <code>tickets: number;</code>', "Mo: <code>{ id: 2, name: 'Mo', position: 'Backend', tickets: 1 }</code>", '<code>return entwickler.tickets &lt; 2;</code>'],
    tests: [
      { name: 'Interface hat tickets: number', run: T => T.ok(/interface\s+Entwickler\s*\{[\s\S]*tickets\s*:\s*number/.test(T.code), 'Im Interface fehlt "tickets: number".') },
      { name: 'mo stimmt', run: T => { const k = T.get('mo'); T.eq([k.id, k.name, k.position, k.tickets], [2, 'Mo', 'Backend', 1], 'mo soll id 2, Name „Mo“, Rolle „Backend“ und 1 Ticket haben. Verglichen wird [id, name, position, tickets].'); T.ok(/mo\s*:\s*Entwickler/.test(T.code), 'Schreib const mo: Entwickler = ...'); } },
      { name: 'brauchtTraining rechnet richtig', run: T => { const f = T.get('brauchtTraining'); T.eq([f(T.get('mo')), f(T.get('leon'))], [true, false], 'Mo (1 Ticket) braucht Training, Leon (12) nicht.'); } },
      { name: 'Genau 2 Tickets = kein Training', run: T => T.eq(T.get('brauchtTraining')({ id: 9, name: 'X', position: 'Frontend', tickets: 2 }), false, 'Bei 2 Tickets soll false kommen. Nimm < statt <=.') }
    ] },
  merke: ['interface = Vorlage für Objekte.', "'A' | 'B' = nur A oder B.", '? = optional. any vermeiden.'],
  paare: [
    ['<code>interface</code>', 'Vorlage: welche Felder ein Objekt haben muss'],
    ['<code>\'A\' | \'B\'</code>', 'Nur genau einer dieser Werte ist erlaubt'],
    ['<code>name?: string</code>', 'Optionales Feld, darf fehlen'],
    ['<code>any</code>', 'Schaltet alle Typ-Prüfungen ab'],
    ['<code>unknown</code>', 'Form unbekannt: erst prüfen, dann benutzen']
  ]
});

CH.push({
  id: 'k03', akt: 1, title: 'Die erste Entwicklerkarte', tag: '@Component', xp: 80,
  doku: [['Aufbau einer Komponente', 'https://angular.dev/guide/components'], ['Selektoren', 'https://angular.dev/guide/components/selectors'], ['Komponenten stylen', 'https://angular.dev/guide/components/styling']],
  ticket: { id: 'PW-116', typ: 'Feature', titel: 'Entwicklerkarte für das Profil', text: 'Im Teamboard soll jeder Entwickler eine eigene Karte bekommen. Fang mit Leon an: Name und Rolle.' },
  story: [
    ['sara', 'Im Figma-Entwurf von unserer UX-Designerin gibt es eine Entwicklerkarte. Kannst du die als Komponente bauen?'],
    ['toni', 'Dein erster eigener Baustein. Klasse, Template, selector. Los.']
  ],
  slides: [
    { t: 'So baust du eine Komponente', say: 'Klasse + @Component-Etikett = Baustein.', job: 'In Firmen bekommst du das Aussehen meist als Figma-Design. Deine Aufgabe ist, daraus eine wiederverwendbare Komponente zu machen, die überall gleich aussieht.',
      code: C`
import { Component } from '@angular/core';

@Component({
  selector: 'app-entwickler-karte',
  template: \`
    <h2>Leon</h2>
    <p>Frontend</p>
  \`,
  styles: \`h2 { color: gold; }\`,
})
export class EntwicklerKarte {}`,
      notes: [['import', 'Holt das Werkzeug Component aus Angular.'], ['@Component', 'Das Etikett. Macht die Klasse zum Baustein.'], ['selector', 'Name im HTML: <app-entwickler-karte />'], ['template', 'Normales HTML zwischen Backticks.'], ['styles', 'CSS nur für diesen Baustein.'], ['export class', 'Die Klasse. Noch leer.']],
      pro: 'Seit v19 ist standalone der Standard: Eine Komponente braucht kein NgModule mehr. Style-Guide seit v20: EntwicklerKarte statt EntwicklerKarteComponent.' },
    { t: 'Einen Baustein benutzen: imports', say: 'Eine Komponente kennt nur die Bausteine, die in ihrem imports stehen. Erst dann darf ihr Template den Tag benutzen.', job: 'Die Meldung „app-entwickler-karte is not a known element“ sieht jeder in der ersten Woche. Fast immer fehlt nur der Eintrag in imports.',
      code: C`
import { Component } from '@angular/core';
import { EntwicklerKarte } from './entwickler-karte';

@Component({
  selector: 'app-team-seite',
  imports: [EntwicklerKarte],
  template: \`
    <h1>Unser Team</h1>
    <app-entwickler-karte />
  \`,
})
export class TeamSeite {}`,
      notes: [["import { EntwicklerKarte }", 'TypeScript: Hol die Klasse aus der Datei entwickler-karte.ts.'], ['imports: [EntwicklerKarte]', 'Angular: Dieses Template darf den Baustein benutzen. Die eckigen Klammern sind eine Liste, mehrere Bausteine trennst du mit Komma.'], ['<app-entwickler-karte />', 'Hier erscheint die Karte. Der Tag ist ihr selector.']],
      pro: 'Beide Zeilen sind nötig: import oben macht die Klasse in der Datei bekannt, imports im @Component gibt sie dem Template frei. Die meisten Editoren schreiben die obere Zeile von selbst.' }
  ],
  quiz: [{ q: 'Die Komponente EntwicklerKarte hat den selector <code>app-entwickler-karte</code>. Wie benutzt du sie im HTML einer anderen Komponente?', options: ['<EntwicklerKarte>', '<app-entwickler-karte />', '@EntwicklerKarte()', '<component name="EntwicklerKarte">'], correct: 1, why: 'Der selector ist der Name des Tags, mit dem du die Komponente im HTML einsetzt.' },
    { q: 'Die Komponente <code>TeamSeite</code> will <code>&lt;app-entwickler-karte /&gt;</code> in ihrem Template benutzen. Was muss in ihrem @Component stehen?', options: ['selector: \'app-entwickler-karte\'', 'imports: [EntwicklerKarte]', 'styles: [EntwicklerKarte]', 'Nichts, Angular findet die Karte von selbst'], correct: 1, why: 'Standalone-Bausteine kennen nur, was sie in imports eintragen. Fehlt der Eintrag, meldet Angular, dass es das Element nicht kennt.' },
    { q: 'In der Karte steht <code>styles: `h2 { color: gold; }`</code>. Welche Überschriften werden gold?', options: ['Nur die h2 im Template dieser Karte', 'Alle h2 auf der ganzen Seite', 'Alle h2 in Komponenten, die die Karte benutzen', 'Keine, styles braucht eine eigene CSS-Datei'], correct: 0, why: 'Angular kapselt die Styles einer Komponente. Sie gelten nur für ihr eigenes Template, nicht für den Rest der Seite.' }
  ],
  ex: { id: 'ex03', title: 'Leons Karte', goal: 'Bau die erste Entwicklerkarte. In der Vorschau siehst du sie live.', preview: 'EntwicklerKarte',
    todo: ['selector: <code>app-entwickler-karte</code>', '<code>&lt;h2&gt;</code> mit <b>Leon</b>', '<code>&lt;p&gt;</code> mit <b>Frontend</b>'],
    starter: C`
import { Component } from '@angular/core';

@Component({
  selector: '',
  template: \`
    <!-- dein HTML hier -->
  \`,
})
export class EntwicklerKarte {}
`,
    solution: C`
import { Component } from '@angular/core';

@Component({
  selector: 'app-entwickler-karte',
  template: \`
    <h2>Leon</h2>
    <p>Frontend</p>
  \`,
})
export class EntwicklerKarte {}
`,
    notes: [["selector: 'app-entwickler-karte'", 'Name des Bausteins, als Text.'], ['<h2>Leon', 'Ganz normales HTML.']],
    hints: ["<code>selector: 'app-entwickler-karte'</code>", 'Zwischen die Backticks: <code>&lt;h2&gt;Leon&lt;/h2&gt;</code>'],
    tests: [
      { name: 'EntwicklerKarte ist ein Baustein', run: T => { T.cmp('EntwicklerKarte'); } },
      { name: 'selector stimmt', run: T => T.eq(T.meta(T.cmp('EntwicklerKarte')).selector, 'app-entwickler-karte', 'Der selector soll genau app-entwickler-karte heißen, als Text in Anführungszeichen.') },
      { name: '<h2> zeigt Leon', run: T => { const f = T.mount(T.cmp('EntwicklerKarte')); T.ok(f.q('h2'), 'Kein <h2> gefunden. Schreib <h2>Leon</h2> zwischen die Backticks.'); T.eq(f.q('h2').textContent.trim(), 'Leon', 'Im <h2> soll genau Leon stehen.'); } },
      { name: '<p> zeigt Frontend', run: T => { const f = T.mount(T.cmp('EntwicklerKarte')); T.ok(f.q('p'), 'Kein <p> gefunden. Schreib <p>Frontend</p> unter das h2.'); T.eq(f.q('p').textContent.trim(), 'Frontend', 'Im <p> soll genau Frontend stehen.'); } }
    ] },
  merke: ['@Component macht eine Klasse zum Baustein.', 'selector = Tag-Name, template = HTML.', 'Standalone ist Standard.'],
  paare: [
    ['<code>@Component</code>', 'Macht eine Klasse zum Baustein'],
    ['<code>selector</code>', 'Der Tag-Name, unter dem man ihn benutzt'],
    ['<code>template</code>', 'Das HTML des Bausteins'],
    ['<code>imports</code>', 'Bausteine, die das Template benutzen darf']
  ]
});

CH.push({
  id: 'k04', akt: 1, title: 'Daten auf die Karte', tag: 'Interpolation {{ }}', xp: 80,
  doku: [['Text, Eigenschaften und Attribute binden', 'https://angular.dev/guide/templates/binding'], ['Ausdruckssyntax in Templates', 'https://angular.dev/guide/templates/expression-syntax']],
  ticket: { id: 'PW-117', typ: 'Feature', titel: 'Karte zeigt echte Daten', text: 'Die Entwicklerkarte hat den Namen fest im HTML stehen. Sie soll die Daten aus der Klasse anzeigen, damit sie für alle 25 Entwickler funktioniert.' },
  story: [
    ['sara', 'Wir haben 25 Entwickler. Baust du jetzt 25 Karten?'],
    ['toni', 'Nein. Die Karte zeigt an, was in der Klasse steht. Eine Karte, beliebig viele Entwickler.']
  ],
  slides: [
    { t: '{{ }} = Blick in die Klasse', say: 'Doppelte Klammern zeigen einen Wert aus der Klasse. Hier sind es feste Startwerte. Soll sich die Anzeige später von selbst ändern, brauchst du ein Signal. Das kommt im nächsten Kapitel.', job: 'Im Review fällt sofort auf, wenn ein Wert fest im HTML steht, obwohl er aus den Daten kommen sollte. Faustregel: Alles, was sich pro Datensatz unterscheidet, kommt aus der Klasse.',
      code: C`
@Component({
  selector: 'app-entwickler-karte',
  template: \`
    <h2>{{ name }}</h2>
    <p>Tickets: {{ tickets }}</p>
    <p>{{ tickets * 100 }} Punkte</p>
  \`,
})
export class EntwicklerKarte {
  name = 'Leon';
  tickets = 3;
}`,
      notes: [['{{ name }}', 'Zeigt den Wert von name: Leon.'], ['Tickets: {{ tickets }}', 'Text und Wert gemischt: "Tickets: 3".'], ['tickets * 100', 'Rechnen geht auch: 300.'], ["name = 'Leon'", 'Die Daten wohnen in der Klasse. Das ist ein normales Feld mit festem Startwert.']],
      pro: 'Template-Ausdrücke laufen oft. Keine teuren Funktionen darin. {{ }} schützt automatisch gegen XSS.' },
    { t: '[ ] = Eigenschaft setzen', say: 'Eckige Klammern setzen eine Eigenschaft eines HTML-Elements.', job: '[disabled], [src] und [class.aktiv] siehst du in fast jedem Template. Ein typischer Bug: Ein Knopf bleibt klickbar, obwohl er deaktiviert sein sollte. Das Binding fehlt.',
      code: C`
<button [disabled]="krank">Einplanen</button>
<img [src]="foto" />`,
      notes: [['[disabled]', 'disabled bekommt den Wert von krank (true/false).'], ['[src]="foto"', 'Das Bild nimmt die Adresse aus foto. Ohne [ ] wäre es der Text "foto".']],
      pro: '[attr.aria-label] setzt ein HTML-Attribut, [value] eine DOM-Property. Nicht dasselbe.' }
  ],
  quiz: [{ q: 'In der Klasse steht <code>tickets = 2</code>. Was zeigt <code>{{ tickets * 100 }}</code> im Template an?', options: ['tickets * 100', '200', '2100', '{{200}}'], correct: 1, why: 'Angular rechnet den Ausdruck in den doppelten Klammern aus und zeigt das Ergebnis an.' },
    { q: 'Im Template steht <code>&lt;img src="foto" /&gt;</code> ohne eckige Klammern, und in der Klasse steht <code>foto = \'leon.png\'</code>. Was lädt der Browser?', options: ['leon.png', 'Nichts, Angular meldet einen Fehler', 'Das erste Bild im Ordner', 'Eine Datei mit dem Namen foto'], correct: 3, why: 'Ohne [ ] ist der Wert einfach der Text foto. Erst [src]="foto" nimmt den Wert aus der Klasse, also leon.png.' },
    { q: 'In der Klasse steht <code>krank = true</code>. Was macht <code>&lt;button [disabled]="krank"&gt;</code>?', options: ['Der Knopf zeigt den Text true', 'Der Knopf verschwindet', 'Der Knopf ist gesperrt', 'Nichts, disabled braucht einen Text'], correct: 2, why: '[disabled] setzt die Eigenschaft auf den Wert von krank. Bei true ist der Knopf gesperrt, bei false ist er frei.' }
  ],
  ex: { id: 'ex04', title: 'Eine Karte für alle', goal: 'Zeig die Daten der Klasse an. Nichts fest eintippen!', preview: 'EntwicklerKarte',
    todo: ['<code>&lt;h2&gt;</code> zeigt <code>name</code>', '<code>&lt;p class="tickets"&gt;</code> zeigt <b>Tickets: 3</b>', '<code>&lt;p class="punkte"&gt;</code> zeigt <b>300 Punkte</b> (tickets mal 100)', 'Button: <code>[disabled]</code> an <code>krank</code>'],
    starter: C`
import { Component } from '@angular/core';

@Component({
  selector: 'app-entwickler-karte',
  template: \`
    <h2>Leon</h2>
    <!-- p.tickets und p.punkte hier -->
    <button>Einplanen</button>
  \`,
})
export class EntwicklerKarte {
  name = 'Leon';
  tickets = 3;
  krank = false;
}
`,
    solution: C`
import { Component } from '@angular/core';

@Component({
  selector: 'app-entwickler-karte',
  template: \`
    <h2>{{ name }}</h2>
    <p class="tickets">Tickets: {{ tickets }}</p>
    <p class="punkte">{{ tickets * 100 }} Punkte</p>
    <button [disabled]="krank">Einplanen</button>
  \`,
})
export class EntwicklerKarte {
  name = 'Leon';
  tickets = 3;
  krank = false;
}
`,
    notes: [['{{ name }}', 'Statt "Leon" fest: der Wert aus der Klasse.'], ['class="tickets"', 'Text "Tickets: " plus Wert.'], ['tickets * 100', 'Gerechnet im Template.'], ['[disabled]', 'Button aus, wenn krank true ist.']],
    hints: ['<code>&lt;h2&gt;{{ name }}&lt;/h2&gt;</code>', '<code>&lt;p class="punkte"&gt;{{ tickets * 100 }} Punkte&lt;/p&gt;</code>', '<code>&lt;button [disabled]="krank"&gt;</code>'],
    tests: [
      { name: 'h2 zeigt den Namen aus der Klasse', run: T => { const f = T.mount(T.cmp('EntwicklerKarte')); T.ok(f.q('h2'), 'Kein <h2> gefunden.'); T.eq(f.q('h2').textContent.trim(), 'Leon', 'Im h2 soll der Name stehen.'); T.ok(/<h2[^>]*>\s*\{\{\s*(this\.)?name\s*\}\}\s*<\/h2>/.test(T.code), 'h2 soll den Wert aus name zeigen, nicht den festen Text „Leon“. Steht {{ name }} im h2?'); } },
      { name: 'p.tickets zeigt „Tickets: 3“', run: T => { const f = T.mount(T.cmp('EntwicklerKarte')); const p = f.q('p.tickets'); T.ok(p, 'Kein <p class="tickets"> gefunden.'); T.eq(p.textContent.replace(/\s+/g, ' ').trim(), 'Tickets: 3', 'p.tickets soll „Tickets: 3“ zeigen, mit Leerzeichen nach dem Doppelpunkt.'); T.ok(/class="tickets"[^>]*>[^<]*\{\{\s*(this\.)?tickets\s*\}\}/.test(T.code), 'Die 3 soll aus der Klasse kommen, nicht fest im HTML stehen. Steht {{ tickets }} im p.tickets?'); } },
      { name: 'p.punkte rechnet mal 100', run: T => { const f = T.mount(T.cmp('EntwicklerKarte')); T.ok(f.q('p.punkte'), 'Kein <p class="punkte"> gefunden.'); T.eq(f.q('p.punkte').textContent.replace(/\s+/g, ' ').trim(), '300 Punkte', 'Bei 3 Tickets soll p.punkte „300 Punkte“ zeigen.'); T.ok(/\{\{\s*(this\.)?tickets\s*\*\s*100\s*\}\}|\{\{\s*100\s*\*\s*(this\.)?tickets\s*\}\}/.test(T.code), 'Die 300 soll im Template gerechnet werden. Steht {{ tickets * 100 }} im p.punkte?'); } },
      { name: 'Button hängt an krank', run: T => { const f = T.mount(T.cmp('EntwicklerKarte')); T.ok(f.q('button'), 'Kein Button gefunden.'); T.eq(f.q('button').disabled, false, 'krank ist false, also soll der Button frei sein.'); T.ok(/\[disabled\]\s*=\s*"\s*(this\.)?krank\s*"/.test(T.code), 'Der Button soll an krank hängen. Steht [disabled]="krank" am Button?'); } }
    ] },
  merke: ['{{ x }} zeigt einen Wert.', '[eigenschaft]="x" setzt eine Eigenschaft.', 'Daten fließen: Klasse → Bildschirm.'],
  paare: [
    ['<code>{{ name }}</code>', 'Zeigt einen Wert aus der Klasse als Text'],
    ['<code>[src]="bild"</code>', 'Setzt die Eigenschaft src des Elements'],
    ['<code>[disabled]="voll"</code>', 'Knopf ist gesperrt, solange voll true ist'],
    ['Signal', 'Nötig, damit sich die Anzeige von selbst ändert']
  ]
});

CH.push({
  id: 'k05', akt: 1, title: 'Der Sprint-Zähler', tag: 'signal()', xp: 100,
  doku: [['Signals im Überblick', 'https://angular.dev/guide/signals'], ['Reaktivität mit Signals', 'https://angular.dev/essentials/signals'], ['Angular ohne ZoneJS (Zoneless)', 'https://angular.dev/guide/zoneless']],
  ticket: { id: 'PW-118', typ: 'Bug', titel: 'Ticket-Zähler aktualisiert sich nicht', text: 'Wird ein Ticket erledigt, bleibt der Zähler auf 0 stehen. Erst nach Neuladen stimmt er. Prio: hoch, Freitag ist Sprint-Review beim Kunden.' },
  story: [
    ['erz', 'Freitag, 15:34, Sprint-Review beim Kunden. Jonas schließt live ein Ticket. Das Teamboard am Beamer zeigt weiter 0.'],
    ['boss', 'Der Kunde schaut auf unseren Beamer, und das Board zeigt Unsinn. Bis zum nächsten Review muss das laufen!'],
    ['toni', 'Die Anzeige weiß nicht, dass sich der Wert geändert hat. Dafür gibt es Signals. Im großen Bild hast du sie gesehen, jetzt baust du selbst eins.']
  ],
  slides: [
    { t: 'Signal = Wert, der Bescheid sagt', say: 'Ein Signal hält einen Wert. Ändert er sich, sagt es Bescheid. Angular hört das.', job: '„Die Anzeige aktualisiert sich erst nach einem Klick“ ist einer der häufigsten Bugs in Angular-Projekten. Fast immer ist die Lösung: den Wert in ein Signal packen.',
      code: C`
import { signal } from '@angular/core';

const tickets = signal(0);

tickets();
tickets.set(2);
tickets.update(anzahl => anzahl + 1);`,
      notes: [['signal(0)', 'Neues Signal mit Startwert 0.'], ['tickets();', 'LESEN: mit Klammern! Ergibt 0.'], ['set(2)', 'SETZEN: neuer Wert 2.'], ['update(', 'ÄNDERN: aus altem Wert neuen rechnen. anzahl ist der alte Wert, also 2. Raus kommt 2 + 1 = 3. Den Namen links vom Pfeil wählst du frei, er gilt nur in dieser kleinen Funktion.']],
      pro: 'Signals sind synchron und haben immer einen Wert. Angular merkt sich, wer sie liest. Deshalb geht Angular ohne zone.js (Zoneless, Standard seit v21). Seit v22 ist auch OnPush Standard.' },
    { t: 'Signal in der Komponente', say: 'Das Template liest das Signal. Ändert es sich, malt Angular neu.', job: 'In neuem Firmen-Code sind fast alle Felder, die das Template liest, Signals. Siehst du in einer neuen Komponente ein normales Feld, das sich ändert, frag im Review nach.',
      code: C`
@Component({
  selector: 'app-sprint-zaehler',
  template: \`<p>Tickets: {{ tickets() }}</p>\`,
})
export class SprintZaehler {
  tickets = signal(0);

  erledigt() {
    this.tickets.update(anzahl => anzahl + 1);
  }
}`,
      notes: [['{{ tickets() }}', 'Im Template auch mit Klammern lesen.'], ['tickets = signal(0)', 'Das Signal wohnt in der Klasse.'], ['erledigt()', 'Eine Methode = Funktion in der Klasse.'], ['this.tickets', 'In der Klasse brauchst du this. davor.']],
      pro: 'Die Methode erledigt() ruft hier noch niemand auf. Wie ein Knopf sie aufruft, lernst du im nächsten Kapitel mit (click).' },
    { t: 'Listen im Signal: neu bauen statt push', say: 'Steckt eine Liste im Signal, baust du bei jeder Änderung eine neue Liste. Nur dann merkt das Signal die Änderung.', job: '„Ich füge was hinzu, aber die Liste zeigt es nicht an“: Hinter diesem Bug steckt fast immer ein push auf die Liste im Signal.',
      code: C`
team = signal(['Leon']);

this.team.update(liste => [...liste, 'Mo']);

this.team().push('Ben');`,
      notes: [["signal(['Leon'])", 'Ein Signal mit einer Liste (Array) als Wert.'], ['update(liste =>', 'liste ist der alte Wert, also die alte Liste.'], ["[...liste, 'Mo']", 'Eine neue Liste. Die drei Punkte (Spread) packen alle alten Einträge aus, dahinter kommt Mo. Ergebnis: Leon und Mo. Spread kennst du aus den Grundlagen, falls du sie gemacht hast.'], ["push('Ben')", 'Falsch: push ändert die alte Liste. Es bleibt dieselbe Liste, darum sagt das Signal niemandem Bescheid und die Anzeige bleibt alt.']],
      pro: 'Signals vergleichen alten und neuen Wert mit Object.is, das ist fast dasselbe wie ===. Eine veränderte, aber immer noch dieselbe Liste gilt als „nichts passiert“. Bei Objekten gilt dasselbe: { ...alt, tickets: 5 } baut ein neues Objekt.' }
  ],
  quiz: [
    { q: 'Wie liest du den aktuellen Wert des Signals <code>tickets</code>?', options: ['tickets', 'tickets.value', 'tickets()', 'tickets.get'], correct: 2, why: 'Ein Signal ist eine Funktion. Du liest den Wert, indem du sie aufrufst.' },
    { q: 'Gegeben ist <code>team = signal([\'Leon\'])</code>. Wie fügst du „Mo“ richtig zur Liste hinzu?', options: ['this.team().push(\'Mo\')', 'this.team.update(liste => [...liste, \'Mo\'])', 'this.team = [\'Leon\',\'Mo\']', 'this.team.push(\'Mo\')'], correct: 1, why: 'Mit update baust du ein neues Array: Die drei Punkte packen die alten Einträge aus, dahinter kommt Mo. push ändert nur das alte Array, und das Signal merkt davon nichts.' }
  ],
  ex: { id: 'ex05', title: 'Ticket erledigt!', goal: 'Bau den Sprint-Zähler mit einem Signal.', preview: 'SprintZaehler',
    todo: ['<code>tickets</code> wird <code>signal(0)</code>', '<code>&lt;p class="stand"&gt;</code> zeigt den Wert', '<code>erledigt()</code>: plus 1 mit <code>update</code>', '<code>reset()</code>: auf 0 mit <code>set</code>'],
    starter: C`
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-sprint-zaehler',
  template: \`
    <h2>Pixelwerk</h2>
    <p class="stand">0</p>
  \`,
})
export class SprintZaehler {
  tickets = 0;

  erledigt() {
    // plus 1
  }

  reset() {
    // auf 0
  }
}
`,
    solution: C`
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-sprint-zaehler',
  template: \`
    <h2>Pixelwerk</h2>
    <p class="stand">{{ tickets() }}</p>
  \`,
})
export class SprintZaehler {
  tickets = signal(0);

  erledigt() {
    this.tickets.update(anzahl => anzahl + 1);
  }

  reset() {
    this.tickets.set(0);
  }
}
`,
    notes: [['{{ tickets() }}', 'Liest das Signal. Malt neu bei Änderung.'], ['signal(0)', 'Aus der Zahl wird ein Signal.'], ['update(anzahl => anzahl + 1)', 'anzahl ist der alte Wert. Raus kommt alter Wert + 1.'], ['set(0)', 'Einfach auf 0 setzen.']],
    hints: ['<code>tickets = signal(0);</code>', 'Im Template: <code>{{ tickets() }}</code>', '<code>this.tickets.update(anzahl =&gt; anzahl + 1);</code>'],
    tests: [
      { name: 'tickets ist ein Signal mit 0', run: T => { const f = T.mount(T.cmp('SprintZaehler')); T.ok(T.isWritable(f.instance.tickets), 'tickets ist noch kein Signal. Schreib tickets = signal(0).'); T.eq(f.instance.tickets(), 0, 'Startwert soll 0 sein.'); } },
      { name: 'erledigt() zählt +1', run: T => { const f = T.mount(T.cmp('SprintZaehler')); f.instance.erledigt(); f.instance.erledigt(); T.eq(f.instance.tickets(), 2, 'Zweimal erledigt() sollte 2 ergeben.'); } },
      { name: 'Zähler ändert sich von selbst', run: async T => { const f = T.mount(T.cmp('SprintZaehler')); f.instance.erledigt(); await T.flush(); T.ok(f.q('p.stand'), 'Kein <p class="stand">.'); T.eq(f.q('p.stand').textContent.trim(), '1', 'Zähler zeigt nicht 1. Liest das Template tickets()?'); } },
      { name: 'reset() setzt 0', run: T => { const f = T.mount(T.cmp('SprintZaehler')); f.instance.erledigt(); f.instance.reset(); T.eq(f.instance.tickets(), 0, 'Nach reset() soll 0 sein.'); T.ok(/tickets\.set\s*\(/.test(T.code), 'Nimm this.tickets.set(0).'); } }
    ] },
  merke: ['signal(start) erstellt ein Signal.', 'Lesen s(), setzen s.set(v), ändern s.update(f).', 'Arrays neu bauen, nie push.'],
  paare: [
    ['<code>signal(0)</code>', 'Erstellt ein Signal mit Startwert 0'],
    ['<code>zahl()</code>', 'Liest den aktuellen Wert'],
    ['<code>zahl.set(5)</code>', 'Setzt einen ganz neuen Wert'],
    ['<code>zahl.update(n => n + 1)</code>', 'Ändert den Wert anhand des alten'],
    ['<code>liste.update(l => [...l, x])</code>', 'Baut eine neue Liste, statt push']
  ]
});
