/* ================= Phase: PROFI-HANDWERK =================
   Profi-Handwerk, das in Firmen-Code überall steckt: Content Projection, viewChild,
   Direktiven & Pipes, DI in der Tiefe, Forms für echte Masken, resource & Interop,
   TypeScript für Profis, Router für große Apps.
   Kommt vor dem Großkunden: dort werden afterNextRender, resource und Co. schon gebraucht. */
ACTS.push({ n: 6, title: 'Profi-Handwerk', sub: 'ng-content, Direktiven & Pipes, DI in der Tiefe, große Formulare, resource, TypeScript, Router' });

CH.push({
  id: 'n01', act: 6, title: 'Eine Karte für alle', tag: 'ng-content · viewChild · Lifecycle · Animation', xp: 200,
  docs: [['Content Projection mit ng-content', 'https://angular.dev/guide/components/content-projection'], ['Lebenszyklus einer Komponente', 'https://angular.dev/guide/components/lifecycle'], ['Animationen mit animate.enter und animate.leave', 'https://angular.dev/guide/animations']],
  ticket: { id: 'PW-139', category: 'Tech-Debt', heading: 'Eine Karten-Komponente für alle', text: 'Es gibt fünf fast gleiche Karten-Komponenten. Baue eine Karte mit Fächern für Kopf und Inhalt. Das Suchfeld darin soll beim Öffnen fokussiert sein.' },
  story: [
    ['erz', 'Die UX-Designerin hat ein Design-System gebaut. Ab jetzt sehen alle Karten gleich aus.'],
    ['du', 'Also eine Karte, aber was drinsteht, bestimmt der, der sie benutzt?'],
    ['toni', 'Genau. Das heißt Content Projection. Und danach holen wir uns ein Element aus dem Template, um es zu fokussieren.']
  ],
  slides: [
    { t: 'ng-content: Inhalt durchreichen', say: 'Die Karte gibt nur den Rahmen vor. Der Eltern-Baustein legt den Inhalt hinein. Mit select gibt es mehrere Fächer.', job: 'Jede Komponenten-Bibliothek (Angular Material, PrimeNG, euer eigenes Design-System) arbeitet so: Karte, Dialog, Tab-Leiste geben den Rahmen, du legst den Inhalt hinein.',
      code: C`
@Component({
  selector: 'app-karte',
  template: \`
    <header><ng-content select="[kopf]" /></header>
    <section><ng-content /></section>
  \`,
})
export class Karte {}

// So benutzt man sie:
<app-karte>
  <h3 kopf>Leon</h3>
  <p>12 Tickets, 4 Reviews</p>
</app-karte>`,
      notes: [['<ng-content select="[kopf]"', 'Fach für alles mit dem Attribut kopf.'], ['<ng-content />', 'Fach für den ganzen Rest.'], ['<h3 kopf>', 'Hat das Attribut kopf: landet oben.'], ['<p>12 Tickets', 'Kein kopf: landet im Rest-Fach.']],
      pro: 'Content Projection ist das Herz jedes Design-Systems: Karte, Dialog, Tabs, Layout. Der Inhalt gehört dem Eltern-Baustein. Darum landet ein (click) im Inhalt auch in der Eltern-Klasse.' },
    { t: 'viewChild: ein Element greifen', say: 'Manchmal brauchst du das echte DOM-Element: fokussieren, messen, eine Chart-Bibliothek anhängen. Mit #name markierst du es, mit viewChild holst du es.', job: 'viewChild brauchst du im Job für Fokus (Barrierefreiheit!), für Chart-Bibliotheken und zum Messen von Größen. Für alles andere reicht meistens das Template.',
      code: C`
@Component({
  selector: 'app-suche',
  template: \`<input #feld placeholder="Entwickler suchen" />\`,
})
export class Suche {
  feld = viewChild.required<ElementRef<HTMLInputElement>>('feld');

  constructor() {
    afterNextRender(() => this.feld().nativeElement.focus());
  }
}`,
      notes: [['#feld', 'Template-Referenz: Dieses Element heißt jetzt feld.'], ['viewChild.required', 'Holt das Element mit diesem Namen. Ergebnis ist ein Signal.'], ['ElementRef<HTMLInputElement>', 'Hülle ums echte DOM-Element.'], ['afterNextRender', 'Erst wenn Angular gemalt hat, gibt es das Element wirklich.'], ['nativeElement.focus()', 'Das echte <input> bekommt den Fokus.']],
      pro: 'viewChild(EntwicklerKarte) findet auch eine Kind-Komponente, viewChildren findet alle. contentChild sucht im projizierten Inhalt. Im alten Code: @ViewChild(\'feld\') feld!: ElementRef und ngAfterViewInit.' },
    { t: 'Der Lebenslauf einer Komponente', say: 'Jede Komponente wird geboren, gemalt und irgendwann zerstört. Für jeden Moment gibt es einen Haken.', job: 'Ein echter Bug: Ein setInterval im ngOnInit wird nie beendet, und nach zehnmal Seitenwechsel laufen zehn Timer. Darum gehört zu jedem Start ein Aufräumen im onDestroy.',
      points: [['constructor', 'inject() und Felder. Inputs sind noch NICHT gesetzt, DOM gibt es noch nicht.', ''], ['ngOnInit', 'Inputs sind da. Im alten Code der Start fürs Laden. Mit Signals oft unnötig.', ''], ['ngOnChanges', 'Alter Weg, auf @Input-Änderungen zu reagieren. Heute: computed() oder effect().', ''], ['afterNextRender / ngAfterViewInit', 'Die Ansicht ist gemalt. Jetzt darfst du ans DOM.', 'plus'], ['DestroyRef / ngOnDestroy', 'Aufräumen: Timer, Listener, Abos.', 'plus']],
      pro: 'Interview-Klassiker: Reihenfolge? constructor → ngOnChanges → ngOnInit → ngAfterContentInit → ngAfterViewInit → … → ngOnDestroy. Und: Im constructor ist ein input() noch leer.' },
    { t: 'Rein und raus mit Animation', say: 'Erscheint ein Element durch @if oder @for, kann es sanft einblenden. Verschwindet es, darf es vorher ausblenden. Dafür gibt es animate.enter und animate.leave, direkt im Template.', job: 'Hinweise, Dialoge, aufklappende Listen: Ein kurzes Ein- und Ausblenden zeigt dem Nutzer, was sich gerade geändert hat.',
      code: C`
@Component({
  selector: 'app-hinweis',
  template: \`
    @if (offen()) {
      <p animate.enter="einblenden" animate.leave="ausblenden">Gespeichert!</p>
    }
  \`,
  styles: \`
    .einblenden { animation: rein 200ms ease-out; }
    .ausblenden { animation: raus 200ms ease-in; }
    @keyframes rein { from { opacity: 0; transform: translateY(8px); } }
    @keyframes raus { to { opacity: 0; } }
  \`,
})
export class Hinweis {
  offen = signal(true);
}`,
      notes: [['animate.enter="einblenden"', 'Beim Erscheinen hängt Angular die Klasse einblenden an. Ist die Animation fertig, nimmt Angular sie wieder ab.'], ['animate.leave="ausblenden"', 'Beim Verschwinden kommt die Klasse ausblenden dazu. Angular entfernt das Element erst, wenn die Animation fertig ist.'], ['styles:', 'Die Klassen sind ganz normales CSS bei der Komponente.'], ['@keyframes rein', 'Die Bewegung selbst: von unsichtbar zu sichtbar.']],
      pro: 'animate.enter und animate.leave gibt es seit Angular 20.2. Mit [animate.enter]="klasse()" bindest du ein Signal. Mit (animate.leave)="weg($event)" rufst du eigenen Code auf, danach $event.animationComplete(). Im Altcode siehst du noch @angular/animations mit trigger(), state(), transition() und animations: [...] im @Component. Das ist seit 20.2 veraltet und soll mit v23 entfallen. Denk an Menschen, die Bewegung abschalten: @media (prefers-reduced-motion: reduce).' }
  ],
  quiz: [
    { q: 'Was macht <code>&lt;ng-content select="[kopf]" /&gt;</code> im Template einer Komponente?', options: ['Es lädt die Vorlage kopf.html nach', 'Es zeigt den hineingereichten Inhalt, der das Attribut kopf trägt', 'Es erzeugt ein neues Element <kopf>', 'Es zeigt den Inhalt nur, wenn ein Input kopf gesetzt ist'], correct: 1, why: 'Mit select legst du fest, welcher hineingereichte Inhalt in dieses Fach kommt.' },
    { q: 'Ab wann kannst du sicher auf das DOM-Element zugreifen, das du mit viewChild holst?', options: ['Im constructor', 'Nach dem Malen, in afterNextRender', 'In einem computed', 'In ngOnInit'], correct: 1, why: 'Vor dem ersten Malen ist das Element noch nicht gebaut.' },
    { q: 'Hat ein input() im constructor der Komponente schon den Wert von den Eltern?', options: ['Ja, immer', 'Nein, Angular setzt ihn erst danach', 'Nur bei input.required()', 'Nur in Apps mit Zone.js'], correct: 1, why: 'Angular setzt Inputs erst nach dem Erzeugen der Komponente. Darum liest man sie in einem computed oder später.' },
    { q: 'Ein Hinweis steht in einem @if und hat <code>animate.leave="ausblenden"</code>. Was passiert, wenn die Bedingung false wird?', options: ['Der Hinweis verschwindet sofort, die Klasse wird ignoriert', 'Angular hängt die Klasse ausblenden an und entfernt das Element erst nach der Animation', 'Der Hinweis bleibt für immer sichtbar', 'Man braucht dafür zusätzlich @angular/animations'], correct: 1, why: 'animate.leave wartet auf das Ende der CSS-Animation. Erst dann nimmt Angular das Element aus dem DOM.' }
  ],
  ex: { id: 'exn1', title: 'Eine Karte für alle', goal: 'Bau eine Karte mit zwei Fächern und fokussiere das Suchfeld automatisch.', preview: 'Team',
    todo: ['<code>Karte</code>: im <code>.kopf</code> ein <code>&lt;ng-content select="[kopf]" /&gt;</code>, im <code>.inhalt</code> ein <code>&lt;ng-content /&gt;</code>', 'Die Namen (mit <code>kopf</code>) landen oben, der Rest unten', 'Das Suchfeld bekommt <code>#suche</code>', '<code>suche = viewChild.required&lt;ElementRef&lt;HTMLInputElement&gt;&gt;(\'suche\')</code>', 'Nach dem Malen bekommt das Feld den Fokus (<code>afterNextRender</code>)'],
    starter: C`
import { Component, ElementRef, viewChild, afterNextRender } from '@angular/core';

@Component({
  selector: 'app-karte',
  template: \`
    <div class="karte">
      <div class="kopf"><!-- Fach für [kopf] --></div>
      <div class="inhalt"><!-- Fach für den Rest --></div>
    </div>
  \`,
})
export class Karte {}

@Component({
  selector: 'app-team',
  imports: [Karte],
  template: \`
    <input class="suche" placeholder="Entwickler suchen" />
    <app-karte>
      <h3 kopf>Leon</h3>
      <p>12 Tickets</p>
    </app-karte>
    <app-karte>
      <h3 kopf>Mo</h3>
      <p>9 Reviews</p>
    </app-karte>
  \`,
})
export class Team {
  // Suchfeld holen und nach dem Malen fokussieren
}
`,
    solution: C`
import { Component, ElementRef, viewChild, afterNextRender } from '@angular/core';

@Component({
  selector: 'app-karte',
  template: \`
    <div class="karte">
      <div class="kopf"><ng-content select="[kopf]" /></div>
      <div class="inhalt"><ng-content /></div>
    </div>
  \`,
})
export class Karte {}

@Component({
  selector: 'app-team',
  imports: [Karte],
  template: \`
    <input #suche class="suche" placeholder="Entwickler suchen" />
    <app-karte>
      <h3 kopf>Leon</h3>
      <p>12 Tickets</p>
    </app-karte>
    <app-karte>
      <h3 kopf>Mo</h3>
      <p>9 Reviews</p>
    </app-karte>
  \`,
})
export class Team {
  suche = viewChild.required<ElementRef<HTMLInputElement>>('suche');

  constructor() {
    afterNextRender(() => this.suche().nativeElement.focus());
  }
}
`,
    notes: [['<ng-content select="[kopf]" />', 'Fach oben: nur was kopf hat.'], ['<ng-content />', 'Fach unten: alles andere.'], ['#suche', 'Das Suchfeld bekommt einen Namen.'], ['viewChild.required', 'Holt das Element als Signal.'], ['afterNextRender', 'Wartet, bis das Feld wirklich da ist.'], ['nativeElement.focus()', 'Fokus rein: Man kann sofort tippen.']],
    hints: ['In der Karte: <code>&lt;div class="kopf"&gt;&lt;ng-content select="[kopf]" /&gt;&lt;/div&gt;</code>', 'Feld: <code>&lt;input #suche class="suche" … /&gt;</code>', 'Im constructor: <code>afterNextRender(() =&gt; this.suche().nativeElement.focus());</code>'],
    tests: [
      { name: 'Namen landen im Kopf', run: T => { const f = T.mount(T.cmp('Team')); T.eq(f.qa('.karte .kopf h3').map(e => e.textContent.trim()), ['Leon', 'Mo'], 'In jedem .kopf soll der Name stehen. Tipp: <ng-content select="[kopf]" />'); } },
      { name: 'Der Rest landet im Inhalt', run: T => { const f = T.mount(T.cmp('Team')); T.eq(f.qa('.karte .inhalt p').map(e => e.textContent.trim()), ['12 Tickets', '9 Reviews'], 'In .inhalt soll der Rest stehen. Tipp: <ng-content />'); T.eq(f.qa('.karte .inhalt h3').length, 0, 'Die Namen gehören nicht ins Inhalts-Fach.'); } },
      { name: 'Suchfeld per viewChild', run: async T => { const f = T.mount(T.cmp('Team')); await T.flush(10); const s = f.instance.suche; T.ok(T.isSignal(s), 'Es fehlt suche = viewChild.required<ElementRef<HTMLInputElement>>(\'suche\').'); const el = s(); T.ok(el && el.nativeElement && el.nativeElement.tagName === 'INPUT', 'viewChild findet das Feld nicht. Steht #suche am <input>?'); } },
      { name: 'Suchfeld hat den Fokus', run: async T => { const f = T.mount(T.cmp('Team')); await T.flush(20); T.ok(document.activeElement === f.q('input.suche'), 'Nach dem Malen soll das Suchfeld fokussiert sein: afterNextRender(() => this.suche().nativeElement.focus()).'); } }
    ] },
  takeaway: ['ng-content reicht Inhalt durch, select macht Fächer.', '#name + viewChild holt ein Element als Signal.', 'DOM erst nach dem Malen: afterNextRender.', 'Im constructor sind Inputs noch leer.', 'animate.enter / animate.leave: CSS-Klasse beim Erscheinen und Verschwinden. @angular/animations ist Altcode.'],
  pairs: [
    ['<code>ng-content</code>', 'Reicht Inhalt vom Eltern-Baustein durch'],
    ['<code>viewChild</code>', 'Holt ein markiertes Element als Signal'],
    ['<code>afterNextRender</code>', 'Für Code, der das fertig gemalte DOM braucht'],
    ['<code>constructor</code>', 'Hier sind die Inputs noch leer'],
    ['<code>animate.enter</code>', 'CSS-Klasse beim Erscheinen']
  ]
});

CH.push({
  id: 'n02', act: 6, title: 'Das Lead-Badge', tag: 'Direktiven · eigene Pipes', xp: 200,
  docs: [['Attribut-Direktiven', 'https://angular.dev/guide/directives/attribute-directives'], ['Pipes im Template', 'https://angular.dev/guide/templates/pipes'], ['Host-Elemente und host-Bindings', 'https://angular.dev/guide/components/host-elements']],
  ticket: { id: 'PW-140', category: 'Feature', heading: 'Teamleads überall markieren', text: 'Teamleads sollen in jeder Liste markiert sein (Team, Projekte, Besetzung). Außerdem sollen Pitch-Ergebnisse als Punktzahl angezeigt werden.' },
  story: [
    ['sara', 'Teamleads sollen in JEDER Liste markiert sein. Ohne dass wir fünf Komponenten umbauen.'],
    ['du', 'Ich baue also überall ein extra Element ein?'],
    ['toni', 'Nein. Eine Direktive hängt Verhalten an ein Element, das schon da ist. Ein Attribut, fertig.']
  ],
  slides: [
    { t: 'Attribut-Direktive', say: 'Eine Direktive ist eine Komponente ohne eigenes HTML. Sie sitzt als Attribut auf einem Element und ändert Aussehen oder Verhalten.', job: 'Typische Direktiven in Firmen-Apps: appAutofokus, appTooltip, appHatRecht (zeigt etwas nur für Admins), appClickOutside. Einmal gebaut, überall benutzt.',
      code: C`
@Directive({
  selector: '[appBadge]',
  host: {
    'class': 'badge',
    '[style.border-color]': 'farbe()',
    '(mouseenter)': 'hover.set(true)',
    '(mouseleave)': 'hover.set(false)',
    '[class.hover]': 'hover()',
  },
})
export class Badge {
  farbe = input('gold', { alias: 'appBadge' });
  hover = signal(false);
}

<li [appBadge]="'red'">Leon</li>`,
      notes: [["selector: '[appBadge]'", 'Eckige Klammern: Die Direktive sitzt auf jedem Element mit diesem Attribut.'], ["'class': 'badge'", 'Feste Klasse am Element.'], ["'[style.border-color]'", 'Binding am Element, wie im Template.'], ["'(mouseenter)'", 'Hört auf Ereignisse am Element.'], ["alias: 'appBadge'", 'Der Wert im Attribut selbst landet in farbe.'], ["[appBadge]=\"'red'\"", 'So benutzt man sie. In imports der Komponente eintragen!']],
      pro: 'Alter Code: @HostListener(\'mouseenter\') und @HostBinding(\'class.hover\'). Heute schreibt man alles in host: {}. Mit hostDirectives baut man fertige Direktiven in eine Komponente ein.' },
    { t: 'Eigene Pipe', say: 'Eine Pipe formt einen Wert nur fürs Anzeigen um. Sie ist eine Klasse mit transform().', job: 'Pipes siehst du im Job für Datum, Währung, „vor 3 Minuten“ oder Status-Texte. Sie sind schneller als eine Methode im Template, weil sie nicht bei jeder Prüfung neu rechnen.',
      code: C`
@Pipe({ name: 'punkte' })
export class PunktePipe implements PipeTransform {
  transform(pitches: Pitch[]): number {
    return pitches.reduce((p, s) => p + (s.wir > s.andere ? 3 : s.wir === s.andere ? 1 : 0), 0);
  }
}

// Template (PunktePipe in imports!)
<p>{{ pitches() | punkte }} Punkte</p>`,
      notes: [["name: 'punkte'", 'Unter diesem Namen benutzt man sie im Template.'], ['transform(', 'Wird mit dem Wert links vom | aufgerufen.'], ['| punkte', 'Wert rein, umgeformter Wert raus.']],
      pro: 'Pipes sind standardmäßig „pure“: Sie rechnen nur neu, wenn sich die Referenz des Werts ändert. Darum braucht man auch hier neue Arrays statt push. pure: false rechnet bei jeder Prüfung: fast nie eine gute Idee.' },
    { t: 'Wann was?', say: 'Drei Werkzeuge, drei Aufgaben. Wer sie verwechselt, baut Spaghetti.', job: 'Im Review fällt auf, wenn eine Pipe Daten vom Server lädt oder eine Komponente nur aus einem Attribut besteht. Das richtige Werkzeug macht den Code für alle leichter.',
      points: [['Komponente', 'Eigenes HTML. Ein Baustein der Seite.', ''], ['Direktive', 'Kein eigenes HTML. Verhalten an ein bestehendes Element hängen (Tooltip, Rechte, Autofokus).', ''], ['Pipe', 'Einen Wert fürs Anzeigen umformen (Datum, Geld, Punkte).', ''], ['Struktur-Direktive', 'Alter Code: *ngIf, *appHatRecht="\'admin\'". Heute meist @if statt eigener *-Direktive.', '']],
      pro: 'Direktiven und Pipes müssen in imports stehen. Fehlt eine Pipe, meldet der Compiler einen Fehler. Fehlt eine Direktive an einem einfachen Attribut, passiert gar nichts, ganz ohne Fehlermeldung.' }
  ],
  quiz: [
    { q: 'Was hat eine Direktive im Unterschied zu einer Komponente NICHT?', options: ['Inputs', 'Ein eigenes Template', 'host-Bindings', 'inject()'], correct: 1, why: 'Eine Direktive hängt sich an ein vorhandenes Element und bringt kein eigenes HTML mit.' },
    { q: 'Wann berechnet eine pure Pipe ihr Ergebnis neu?', options: ['Bei jeder Change Detection', 'Wenn sich der Eingabewert ändert, bei Listen und Objekten die Referenz', 'Wenn sich etwas in der Liste ändert, auch per push', 'Nur beim ersten Anzeigen'], correct: 1, why: 'Bleibt die Referenz gleich, ruft Angular die Pipe nicht noch einmal auf. Darum baust du Listen neu, statt sie zu verändern.' },
    { q: 'Wie schreibt man heute, was früher @HostListener(\'click\') erledigt hat?', options: ['Gar nicht mehr, Direktiven hören keine Klicks', 'Mit host: { \'(click)\': \'klick()\' } im Decorator', 'Mit addEventListener im constructor', 'Mit (click) im Template der Eltern-Komponente'], correct: 1, why: 'Das Feld host im Decorator ersetzt @HostListener und @HostBinding.' }
  ],
  ex: { id: 'exn2', title: 'Badge und Punkte', goal: 'Bau das Lead-Badge als Direktive und eine Pipe, die Punkte zählt.', preview: 'PitchListe',
    todo: ['<code>Badge</code>: <code>selector: \'[appBadge]\'</code>, feste Klasse <code>badge</code>', '<code>farbe = input(\'gold\', { alias: \'appBadge\' })</code> setzt <code>border-color</code>', 'Maus drüber: Klasse <code>hover</code> (mouseenter/mouseleave)', '<code>PunktePipe</code> (<code>name: \'punkte\'</code>): gewonnen 3, geteilt 1, verloren 0', '<code>PitchListe</code> importiert beide und zeigt <code>{{ pitches() | punkte }}</code>'],
    starter: C`
import { Component, Directive, Pipe, PipeTransform, input, signal } from '@angular/core';

export interface Pitch { wir: number; andere: number; }

@Directive({
  selector: '[appBadge]',
  host: {},
})
export class Badge {
}

@Pipe({ name: 'punkte' })
export class PunktePipe implements PipeTransform {
  transform(pitches: Pitch[]): number {
    return 0;
  }
}

@Component({
  selector: 'app-pitch-liste',
  imports: [],
  template: \`
    <ul>
      <li class="leon" [appBadge]="'red'">Leon</li>
      <li class="mo">Mo</li>
    </ul>
    <p class="punkte">0</p>
  \`,
})
export class PitchListe {
  pitches = signal<Pitch[]>([{ wir: 3, andere: 1 }, { wir: 1, andere: 1 }, { wir: 0, andere: 2 }]);
}
`,
    solution: C`
import { Component, Directive, Pipe, PipeTransform, input, signal } from '@angular/core';

export interface Pitch { wir: number; andere: number; }

@Directive({
  selector: '[appBadge]',
  host: {
    'class': 'badge',
    '[style.border-color]': 'farbe()',
    '(mouseenter)': 'hover.set(true)',
    '(mouseleave)': 'hover.set(false)',
    '[class.hover]': 'hover()',
  },
})
export class Badge {
  farbe = input('gold', { alias: 'appBadge' });
  hover = signal(false);
}

@Pipe({ name: 'punkte' })
export class PunktePipe implements PipeTransform {
  transform(pitches: Pitch[]): number {
    let summe = 0;
    for (const s of pitches) {
      if (s.wir > s.andere) {
        summe += 3;
      } else if (s.wir === s.andere) {
        summe += 1;
      }
    }
    return summe;
  }
}

@Component({
  selector: 'app-pitch-liste',
  imports: [Badge, PunktePipe],
  template: \`
    <ul>
      <li class="leon" [appBadge]="'red'">Leon</li>
      <li class="mo">Mo</li>
    </ul>
    <p class="punkte">{{ pitches() | punkte }}</p>
  \`,
})
export class PitchListe {
  pitches = signal<Pitch[]>([{ wir: 3, andere: 1 }, { wir: 1, andere: 1 }, { wir: 0, andere: 2 }]);
}
`,
    notes: [["'class': 'badge'", 'Jedes Element mit appBadge bekommt die Klasse.'], ["'[style.border-color]': 'farbe()'", 'Farbe kommt aus dem Input.'], ["alias: 'appBadge'", 'Der Wert im Attribut selbst ist die Farbe.'], ["'[class.hover]': 'hover()'", 'Klasse nur, solange die Maus drauf ist.'], ['for (const s of pitches)', 'Jeden Pitch einmal ansehen: gewonnen 3, geteilt 1, verloren 0. Kürzer geht es später mit reduce wie auf der Folie.'], ['imports: [Badge, PunktePipe]', 'Ohne imports kennt das Template weder Badge noch punkte.'], ['| punkte', 'Pipe im Template benutzen.']],
    hints: ['host: <code>{ \'class\': \'badge\', \'[style.border-color]\': \'farbe()\', … }</code>', 'Input: <code>farbe = input(\'gold\', { alias: \'appBadge\' });</code> und <code>hover = signal(false);</code>', 'Pipe: Zähle mit einer Schleife. <code>let summe = 0; for (const s of pitches) { if (s.wir &gt; s.andere) { summe += 3; } else if (s.wir === s.andere) { summe += 1; } } return summe;</code> Kürzen kannst du später.', 'Nicht vergessen: <code>imports: [Badge, PunktePipe]</code>'],
    tests: [
      { name: 'Pipe zählt Punkte', run: T => { const P = T.get('PunktePipe'); T.ok(T.meta(P) && T.meta(P).name === 'punkte', 'Die Pipe braucht @Pipe({ name: \'punkte\' }).'); const p = new P(); T.eq(p.transform([{ wir: 3, andere: 1 }, { wir: 1, andere: 1 }, { wir: 0, andere: 2 }]), 4, '3 + 1 + 0 = 4.'); T.eq(p.transform([]), 0, 'Keine Pitches = 0 Punkte.'); } },
      { name: 'Liste zeigt die Punkte per Pipe', run: T => { const f = T.mount(T.cmp('PitchListe')); T.eq(f.q('.punkte').textContent.trim(), '4', 'Im <p class="punkte"> soll {{ pitches() | punkte }} stehen, und PunktePipe in imports.'); } },
      { name: 'Badge sitzt am richtigen Entwickler', run: T => { const B = T.get('Badge'); T.ok(T.meta(B) && T.meta(B).selector === '[appBadge]', 'Die Direktive braucht selector: \'[appBadge]\'.'); const f = T.mount(T.cmp('PitchListe')); T.ok(f.q('.leon').classList.contains('badge'), 'Leon soll die Klasse badge bekommen. host: { \'class\': \'badge\' } und Badge in imports.'); T.ok(!f.q('.mo').classList.contains('badge'), 'Mo hat kein appBadge, also kein Badge.'); } },
      { name: 'Farbe kommt aus dem Attribut', run: T => { const f = T.mount(T.cmp('PitchListe')); T.eq(f.q('.leon').style.borderColor, 'red', 'border-color soll red sein: farbe = input(\'gold\', { alias: \'appBadge\' }) und \'[style.border-color]\': \'farbe()\'.'); } },
      { name: 'Hover zeigt die Badge an', run: async T => { const f = T.mount(T.cmp('PitchListe')); f.q('.leon').dispatchEvent(new Event('mouseenter')); await T.flush(); T.ok(f.q('.leon').classList.contains('hover'), 'Nach mouseenter soll .leon die Klasse hover haben.'); f.q('.leon').dispatchEvent(new Event('mouseleave')); await T.flush(); T.ok(!f.q('.leon').classList.contains('hover'), 'Nach mouseleave soll hover wieder weg sein.'); } }
    ] },
  takeaway: ['Direktive = Verhalten ohne eigenes HTML, selector in [ ].', 'host: {} statt @HostListener/@HostBinding.', 'Pipe = transform(), pure rechnet nur bei neuer Referenz.', 'Direktiven und Pipes immer in imports.'],
  pairs: [
    ['Komponente', 'Hat eigenes HTML'],
    ['Direktive', 'Kein eigenes HTML, hängt Verhalten an ein Element'],
    ['Pipe', 'Formt einen Wert fürs Anzeigen um'],
    ['<code>transform()</code>', 'Die Methode, die eine Pipe ausmacht'],
    ['<code>host: {}</code>', 'Ersetzt @HostListener und @HostBinding']
  ]
});

CH.push({
  id: 'n03', act: 6, title: 'Konfiguration an einer Stelle', tag: 'DI in der Tiefe', xp: 220,
  docs: [['Abhängigkeiten bereitstellen', 'https://angular.dev/guide/di/defining-dependency-providers'], ['Hierarchische Injektoren', 'https://angular.dev/guide/di/hierarchical-dependency-injection'], ['Services erstellen und nutzen', 'https://angular.dev/guide/di/creating-and-using-services']],
  ticket: { id: 'PW-141', category: 'Tech-Debt', heading: 'Server-Adresse an 40 Stellen', text: 'Die API-Adresse steht in 40 Dateien. Im Test soll ein Fake-Wetterdienst laufen. Logs sollen an mehrere Ziele gehen. Baue das mit DI sauber auf.' },
  story: [
    ['jonas', 'Wir ziehen mit dem Backend auf einen neuen Server um. Neue Adresse ab Montag.'],
    ['du', 'Die alte Adresse steht in ungefähr 40 Dateien …'],
    ['toni', 'Darum lernen wir DI jetzt richtig. Eine Stelle für die Adresse, austauschbar im Test. Das kommt auch in jedem Senior-Interview.']
  ],
  slides: [
    { t: 'Vier Arten, etwas bereitzustellen', say: 'Ein Provider sagt Angular: Wenn jemand X will, gib ihm Y. Es gibt vier Rezepte.', job: 'useValue für Konfiguration (API-Adresse), useClass für Fakes im Test, useFactory, wenn etwas vom Umfeld abhängt, useExisting für einen zweiten Namen. Alle vier triffst du in größeren Projekten.',
      code: C`
export const API_URL = new InjectionToken<string>('API_URL');

providers: [
  { provide: API_URL, useValue: 'https://api.pixelwerk.de' },
  { provide: Wetter, useClass: EchtesWetter },
  { provide: Logger, useExisting: KonsoleLogger },
  { provide: Wetter, useFactory: () => inject(API_URL).includes('localhost') ? new FakeWetter() : new EchtesWetter() },
]

const url = inject(API_URL);`,
      notes: [['new InjectionToken', 'Ein Schlüssel für Dinge, die keine Klasse sind: Text, Zahl, Konfig, Funktion.'], ['useValue', 'Genau dieser Wert.'], ['useClass', 'Bau ein Objekt dieser Klasse.'], ['useExisting', 'Nimm das, was es für einen anderen Schlüssel schon gibt (ein Alias).'], ['useFactory', 'Eine Funktion entscheidet. Darin darf inject() stehen.'], ['inject(API_URL)', 'Mit dem Token holt man den Wert.']],
      pro: 'Die Klasse selbst ist auch ein Token. providers: [Wetter] ist die Kurzform von { provide: Wetter, useClass: Wetter }.' },
    { t: 'multi: viele unter einem Schlüssel', say: 'Mit multi: true sammelt Angular alle Provider eines Tokens in einer Liste. So erweitern Plugins ein System.', job: 'So kann jedes Team seinen eigenen Teil beisteuern (Logger, Plugins, Prüfregeln), ohne den zentralen Code anzufassen.',
      code: C`
export const LOGGER = new InjectionToken<Logger[]>('LOGGER');

providers: [
  { provide: LOGGER, useClass: KonsoleLogger, multi: true },
  { provide: LOGGER, useClass: SpeicherLogger, multi: true },
]

loggers = inject(LOGGER); // [KonsoleLogger, SpeicherLogger]`,
      notes: [['multi: true', 'Nicht überschreiben, sondern dazulegen.'], ['inject(LOGGER)', 'Ergebnis ist eine Liste mit allen.']],
      pro: 'Angular benutzt das selbst: klassische HTTP-Interceptors (HTTP_INTERCEPTORS), Validatoren (NG_VALIDATORS), NG_VALUE_ACCESSOR und App-Initializer. Wer multi versteht, versteht ein großes Stück Angular von innen.' },
    { t: 'Die Injector-Hierarchie', say: 'Es gibt nicht DEN einen Injector, sondern einen Baum. Angular sucht von unten nach oben, bis es einen Provider findet.', job: 'Ein häufiger Bug: Ein Service steht zusätzlich in providers einer Komponente. Dann bekommt diese Komponente eine eigene Kopie, und die Daten sind nicht mehr geteilt.',
      points: [['Element-Injector', 'providers: [...] in @Component. JEDE Instanz der Komponente bekommt ihr eigenes Objekt. Kinder sehen es mit.', ''], ['Route', 'providers in einer Route: gilt für diesen Bereich (lazy).', ''], ['Environment (root)', 'providedIn: \'root\' oder app.config. Ein Objekt für die ganze App.', ''], ['Null-Injector', 'Ganz oben. Findet nichts → NullInjectorError.', 'minus']],
      pro: 'Suchregeln ändern: inject(X, { optional: true }) gibt null statt Fehler. { self: true } sucht nur hier, { skipSelf: true } erst ab den Eltern, { host: true } nur bis zur Host-Komponente. viewProviders sind wie providers, aber für projizierten Inhalt unsichtbar.' },
    { t: 'Warum das im Job zählt', say: 'DI ist das, was große Angular-Apps testbar und austauschbar macht.', job: 'Wenn du im Interview erklären kannst, wie du einen Service im Test austauschst, ohne die Komponente zu ändern, hast du DI verstanden. Das wird sehr oft gefragt.',
      points: [['Tests', 'Im TestBed einfach { provide: Api, useValue: fake }. Kein echter Server.', 'plus'], ['Umgebungen', 'Konfig als Token statt hart im Code. Pro Umgebung ein anderer Wert.', 'plus'], ['Zustand pro Bereich', 'Ein Formular-Zustand pro Dialog: providers in der Komponente.', 'plus'], ['Falle', 'Service in providers einer Komponente UND providedIn root: zwei verschiedene Objekte, „warum sind meine Daten weg?“', 'minus']],
      pro: 'Wenn jemand fragt „Ist das ein Singleton?“, ist die richtige Antwort: „Kommt drauf an, in welchem Injector er bereitgestellt wird.“' }
  ],
  quiz: [
    { q: 'Was ist ein InjectionToken?', options: ['Ein Token für den Login', 'Ein Schlüssel für die Dependency Injection, wenn es keine Klasse gibt', 'Ein RxJS-Operator', 'Eine Pipe'], correct: 1, why: 'Mit einem InjectionToken stellst du Texte, Konfiguration oder Funktionen bereit. Mit <T> ist es typsicher.' },
    { q: 'Für das Token LOGGER gibt es zwei Provider mit multi: true. Was liefert inject(LOGGER)?', options: ['Nur den ersten Logger', 'Nur den letzten Logger', 'Eine Liste mit beiden Loggern', 'Einen Fehler'], correct: 2, why: 'Mit multi: true sammelt Angular alle Provider, statt den vorherigen zu überschreiben.' },
    { q: 'Ein Service steht in providers: [...] einer Komponente. Die Komponente steht dreimal auf der Seite. Wie viele Instanzen des Service gibt es?', options: ['1', '3', '2', 'Nur 1, wenn der Service auch providedIn: root hat'], correct: 1, why: 'Der Injector am Element entscheidet: Jede Instanz der Komponente bekommt ihren eigenen Service, auch wenn er zusätzlich in root bereitsteht.' },
    { q: 'Für Analytics gibt es keinen Provider. Was liefert inject(Analytics, { optional: true })?', options: ['Einen Fehler', 'null', 'undefined', 'Ein leeres Objekt'], correct: 1, why: 'optional heißt: Es gibt keinen Absturz, sondern null.' }
  ],
  ex: { id: 'exn3', title: 'Konfiguration an einer Stelle', goal: 'Bau die DI-Struktur der Agentur: Token, multi, Factory, Komponenten-Provider und optional. Jeder Teil wird für sich geprüft, du kannst in beliebiger Reihenfolge arbeiten.', preview: 'Projektraum',
    todo: ['<code>API_URL</code> und <code>LOGGER</code> sind <code>InjectionToken</code>', '<code>appProviders</code>: API_URL = <code>\'https://api.pixelwerk.de\'</code>, beide Logger per <code>multi: true</code>', '<code>Wetter</code> per <code>useFactory</code>: bei <code>localhost</code> in API_URL → <code>FakeWetter</code>, sonst <code>EchtesWetter</code>', '<code>Protokoll.melde(text)</code> schreibt in ALLE Logger', '<code>Projektraum</code> hat sein eigenes <code>Whiteboard</code> (<code>providers</code>)', '<code>Statistik</code> holt <code>Analytics</code> mit <code>{ optional: true }</code> und stürzt ohne nicht ab'],
    starter: C`
import { Component, Injectable, Service, InjectionToken, inject, signal } from '@angular/core';

export interface Logger { log(text: string): void; }
export class KonsoleLogger implements Logger { log(text: string) { console.log(text); } }
export class SpeicherLogger implements Logger { eintraege: string[] = []; log(text: string) { this.eintraege.push(text); } }

export abstract class Wetter { abstract vorhersage(): string; }
export class EchtesWetter extends Wetter { vorhersage() { return 'Regen (echt)'; } }
export class FakeWetter extends Wetter { vorhersage() { return 'Sonne (fake)'; } }

export const API_URL = null; // InjectionToken<string>
export const LOGGER = null;  // InjectionToken<Logger[]>

export const appProviders = [
  // API_URL, zwei Logger (multi), Wetter per useFactory
];

@Service()
export class Protokoll {
  melde(text: string) {}
}

@Injectable()
export class Whiteboard {
  stand = signal('Sprint 1');
}

@Component({
  selector: 'app-projektraum',
  template: \`<p class="stand">{{ tafel.stand() }}</p>\`,
})
export class Projektraum {
  tafel = inject(Whiteboard);
}

@Injectable()
export class Analytics {
  gesendet: string[] = [];
  send(e: string) { this.gesendet.push(e); }
}

@Service()
export class Statistik {
  analytics = inject(Analytics);
  tracke(e: string) { this.analytics.send(e); }
}
`,
    solution: C`
import { Component, Injectable, Service, InjectionToken, inject, signal } from '@angular/core';

export interface Logger { log(text: string): void; }
export class KonsoleLogger implements Logger { log(text: string) { console.log(text); } }
export class SpeicherLogger implements Logger { eintraege: string[] = []; log(text: string) { this.eintraege.push(text); } }

export abstract class Wetter { abstract vorhersage(): string; }
export class EchtesWetter extends Wetter { vorhersage() { return 'Regen (echt)'; } }
export class FakeWetter extends Wetter { vorhersage() { return 'Sonne (fake)'; } }

export const API_URL = new InjectionToken<string>('API_URL');
export const LOGGER = new InjectionToken<Logger[]>('LOGGER');

export const appProviders = [
  { provide: API_URL, useValue: 'https://api.pixelwerk.de' },
  { provide: LOGGER, useClass: KonsoleLogger, multi: true },
  { provide: LOGGER, useClass: SpeicherLogger, multi: true },
  { provide: Wetter, useFactory: () => inject(API_URL).includes('localhost') ? new FakeWetter() : new EchtesWetter() },
];

@Service()
export class Protokoll {
  private loggers = inject(LOGGER);
  melde(text: string) {
    this.loggers.forEach(l => l.log(text));
  }
}

@Injectable()
export class Whiteboard {
  stand = signal('Sprint 1');
}

@Component({
  selector: 'app-projektraum',
  providers: [Whiteboard],
  template: \`<p class="stand">{{ tafel.stand() }}</p>\`,
})
export class Projektraum {
  tafel = inject(Whiteboard);
}

@Injectable()
export class Analytics {
  gesendet: string[] = [];
  send(e: string) { this.gesendet.push(e); }
}

@Service()
export class Statistik {
  analytics = inject(Analytics, { optional: true });
  tracke(e: string) { this.analytics?.send(e); }
}
`,
    notes: [["new InjectionToken<string>('API_URL')", 'Schlüssel für einen Text. Der Name hilft beim Debuggen.'], ['abstract class Wetter', 'Eine Klasse, von der man selbst kein Objekt baut. Hier dient sie nur als Schlüssel. EchtesWetter und FakeWetter erben mit extends und liefern vorhersage().'], ['useValue', 'Fester Wert.'], ['multi: true', 'Beide Logger landen in einer Liste.'], ['useFactory', 'Funktion entscheidet. inject() ist darin erlaubt.'], ['this.loggers.forEach', 'Liste durchgehen, jeder Logger schreibt.'], ['providers: [Whiteboard]', 'Jeder Projektraum bekommt sein eigenes Whiteboard.'], ['{ optional: true }', 'Kein Provider? Dann null statt Absturz.'], ['this.analytics?.send', '?. ruft nur auf, wenn analytics nicht null ist.']],
    hints: ['Token: <code>export const API_URL = new InjectionToken&lt;string&gt;(\'API_URL\');</code>', 'multi: <code>{ provide: LOGGER, useClass: KonsoleLogger, multi: true }</code>', 'Factory: <code>{ provide: Wetter, useFactory: () =&gt; inject(API_URL).includes(\'localhost\') ? new FakeWetter() : new EchtesWetter() }</code>', 'Projektraum: <code>providers: [Whiteboard]</code> im @Component'],
    tests: [
      { name: 'API_URL ist ein InjectionToken', run: T => { T.ok(T.get('API_URL') instanceof T.ng.core.InjectionToken, 'API_URL soll new InjectionToken<string>(\'API_URL\') sein.'); } },
      { name: 'LOGGER ist ein InjectionToken', run: T => { T.ok(T.get('LOGGER') instanceof T.ng.core.InjectionToken, 'LOGGER soll new InjectionToken<Logger[]>(\'LOGGER\') sein.'); } },
      { name: 'API_URL kommt per useValue', run: T => { const A = T.get('API_URL'); T.ok(A instanceof T.ng.core.InjectionToken, 'Erst API_URL als InjectionToken anlegen, dann kann appProviders es benutzen.'); const only = (T.get('appProviders') || []).filter(x => x && x.provide === A); T.ok(only.length > 0, 'In appProviders fehlt { provide: API_URL, useValue: \'https://api.pixelwerk.de\' }.'); T.eq(new T.ng.Injector(null, only).get(A), 'https://api.pixelwerk.de', 'API_URL soll \'https://api.pixelwerk.de\' sein (useValue).'); } },
      { name: 'multi: beide Logger', run: T => { const L = T.get('LOGGER'); T.ok(L instanceof T.ng.core.InjectionToken, 'Erst LOGGER als InjectionToken anlegen, dann kann appProviders es benutzen.'); const only = (T.get('appProviders') || []).filter(x => x && x.provide === L); T.ok(only.length === 2 && only.every(x => x.multi === true), 'appProviders braucht zwei Einträge für LOGGER, beide mit multi: true.'); const l = new T.ng.Injector(null, only).get(L); T.ok(Array.isArray(l) && l[0] instanceof T.get('KonsoleLogger') && l[1] instanceof T.get('SpeicherLogger'), 'inject(LOGGER) soll eine Liste sein: erst KonsoleLogger, dann SpeicherLogger.'); } },
      { name: 'Protokoll schreibt in alle', run: T => { const L = T.get('LOGGER'); T.ok(L instanceof T.ng.core.InjectionToken, 'Protokoll braucht LOGGER als InjectionToken.'); const newer = () => ({ eintraege: [], log(t) { this.eintraege.push(t); } }); const a = newer(), b = newer(); const inj = new T.ng.Injector(null, [{ provide: L, useValue: a, multi: true }, { provide: L, useValue: b, multi: true }]); inj.get(T.get('Protokoll')).melde('Deploy!'); T.eq([a.eintraege, b.eintraege], [['Deploy!'], ['Deploy!']], 'melde(text) soll jeden Logger aus inject(LOGGER) aufrufen, nicht nur einen.'); } },
      { name: 'useFactory wählt das Wetter', run: T => { const A = T.get('API_URL'), W = T.get('Wetter'); T.ok(A instanceof T.ng.core.InjectionToken, 'Die Factory liest API_URL. Leg API_URL zuerst als InjectionToken an.'); const f = (T.get('appProviders') || []).find(x => x && x.provide === W); T.ok(f && typeof f.useFactory === 'function', 'In appProviders fehlt { provide: Wetter, useFactory: () => … }.'); const withIt = url => new T.ng.Injector(null, [{ provide: A, useValue: url }, f]).get(W); T.ok(withIt('https://api.pixelwerk.de') instanceof T.get('EchtesWetter'), 'Mit der echten API_URL soll EchtesWetter kommen.'); T.ok(withIt('http://localhost:3000') instanceof T.get('FakeWetter'), 'Mit localhost in API_URL soll FakeWetter kommen (useFactory).'); } },
      { name: 'Jeder Projektraum hat sein eigenes Whiteboard', run: async T => { const a = T.mount(T.cmp('Projektraum')), b = T.mount(T.cmp('Projektraum')); T.ok(a.instance.tafel !== b.instance.tafel, 'Beide Projekträume teilen sich ein Whiteboard. providers: [Whiteboard] in die Komponente!'); a.instance.tafel.stand.set('Sprint 2'); await T.flush(); T.eq([a.q('.stand').textContent, b.q('.stand').textContent], ['Sprint 2', 'Sprint 1'], 'Änderung in einem Projektraum darf den anderen nicht treffen.'); } },
      { name: 'Ohne Analytics kein Absturz', run: T => { let s; try { s = T.inject(T.get('Statistik')); } catch (e) { T.ok(false, 'Statistik stürzt ab: ' + e.message + ' Tipp: inject(Analytics, { optional: true })'); } T.ok(s.analytics === null, 'Ohne Provider soll analytics null sein.'); s.tracke('Klick'); } },
      { name: 'Mit Analytics wird gesendet', run: T => { const inj = new T.ng.Injector(null, [T.get('Analytics')]); const s = inj.get(T.get('Statistik')); s.tracke('Klick'); T.eq(s.analytics && s.analytics.gesendet, ['Klick'], 'Gibt es Analytics, soll tracke() senden.'); } }
    ] },
  takeaway: ['useValue, useClass, useExisting, useFactory.', 'InjectionToken für alles, was keine Klasse ist.', 'multi: true sammelt alle in einer Liste.', 'providers in der Komponente = eigene Instanz pro Komponente.', 'optional, self, skipSelf, host ändern die Suche.'],
  pairs: [
    ['<code>useValue</code>', 'Gib genau diesen fertigen Wert'],
    ['<code>useClass</code>', 'Baue dafür diese Klasse'],
    ['<code>useFactory</code>', 'Rechne den Wert mit einer Funktion aus'],
    ['<code>multi: true</code>', 'Sammelt alle Provider in einer Liste'],
    ['InjectionToken', 'Schlüssel für etwas, das keine Klasse ist']
  ]
});

CH.push({
  id: 'n04', act: 6, title: 'Die Hackathon-Anmeldung', tag: 'FormArray · async · ControlValueAccessor', xp: 220,
  docs: [['Reactive Forms mit FormArray', 'https://angular.dev/guide/forms/reactive-forms'], ['Validierung: feldübergreifend und async', 'https://angular.dev/guide/forms/form-validation'], ['ControlValueAccessor: Methoden im Detail', 'https://angular.dev/api/forms/ControlValueAccessor']],
  ticket: { id: 'PW-142', category: 'Feature', heading: 'Team-Anmeldung für den Hackathon', text: 'Agenturen melden ganze Teams an: beliebig viele Entwickler, keine Teilnehmernummer doppelt, Teamname darf nicht vergeben sein. Bewertung mit Sternen.' },
  story: [
    ['sara', 'Pixelwerk richtet im Frühjahr einen Hackathon aus. Agenturen melden ganze Teams an. Drei Regeln: Zeilen hinzufügen und löschen, keine Teilnehmernummer doppelt, Teamname einmalig.'],
    ['leon', 'Und ich will mit Sternen bewerten, nicht mit einer Zahl im Textfeld.'],
    ['toni', 'Das sind genau die drei Dinge, die echte Firmen-Formulare von Tutorials unterscheiden.']
  ],
  slides: [
    { t: 'FormArray: Liste von Feldern', say: 'Ein FormArray ist eine Liste von Controls oder Gruppen. Man kann zur Laufzeit hinzufügen und entfernen.', job: 'FormArray brauchst du im Job bei allem mit „+ weitere hinzufügen“: Positionen einer Rechnung, Kinder in einem Antrag, mehrere Adressen.',
      code: C`
form = new FormGroup({
  entwickler: new FormArray<FormGroup>([]),
});

get entwickler() { return this.form.controls.entwickler; }

neu() {
  this.entwickler.push(new FormGroup({
    name: new FormControl('', Validators.required),
    nummer: new FormControl<number | null>(null, [Validators.min(1), Validators.max(99)]),
  }));
}
entfernen(i: number) { this.entwickler.removeAt(i); }`,
      notes: [['new FormArray', 'Leere Liste am Anfang.'], ['get entwickler()', 'Ein Getter: Man liest ihn wie ein Feld (this.entwickler), dahinter läuft diese kleine Funktion. So schreibst du nicht jedes Mal this.form.controls.entwickler.'], ['push(', 'Neue Zeile anhängen.'], ['removeAt(i)', 'Zeile an Position i löschen.'], ['FormControl<number | null>', 'Typisiertes Feld: Zahl oder leer.']],
      pro: 'Typed Forms (seit v14): form.value ist typisiert. Mit NonNullableFormBuilder (fb.nonNullable) springt reset() auf den Startwert statt auf null.' },
    { t: 'Gruppen- und async-Validatoren', say: 'Manche Regeln betreffen mehrere Felder: keine Nummer doppelt. Andere brauchen den Server: Name schon vergeben?', job: 'Async-Validatoren fragen oft beim Server nach („Benutzername frei?“). Ohne debounce schickt jeder Tastendruck eine Anfrage. Das merkt das Backend-Team schnell.',
      code: C`
export const nummernEindeutig: ValidatorFn = liste => {
  const n = (liste.value as { nummer: number | null }[]).map(s => s.nummer).filter(x => x != null);
  const doppelt = n.some((x, i) => n.indexOf(x) !== i);
  return doppelt ? { doppelt: true } : null;
};

export function nameFrei(api: HackathonApi): AsyncValidatorFn {
  return c => api.istVergeben(c.value).pipe(map(v => v ? { vergeben: true } : null));
}

teamname: new FormControl('', { validators: [Validators.required], asyncValidators: [nameFrei(api)] })`,
      notes: [['liste.value', 'Der Validator bekommt das ganze Array und sieht alle Zeilen.'], ['n.indexOf(x) !== i', 'indexOf findet die erste Stelle einer Nummer. Ist das nicht die aktuelle Stelle, gab es sie schon vorher: doppelt.'], ['AsyncValidatorFn', 'Gibt ein Observable (oder Promise) zurück.'], ['asyncValidators', 'Laufen erst, wenn alle normalen Regeln passen.']],
      pro: 'Während der Server prüft, ist das Control pending (status PENDING). Den Absenden-Knopf dann sperren. In echt: debounce im Validator oder updateOn: \'blur\', sonst gibt es pro Tastendruck eine Anfrage.' },
    { t: 'ControlValueAccessor: eigene Felder', say: 'Mit einem ControlValueAccessor wird deine eigene Komponente ein echtes Formularfeld. formControlName funktioniert dann wie bei einem input.', job: 'Datumsauswahl, Sterne-Bewertung, Farbwähler: In Design-Systemen sind solche Felder fast immer mit ControlValueAccessor gebaut. Dann funktionieren sie wie jedes andere Formularfeld.',
      code: C`
@Component({
  selector: 'app-sterne',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Sterne), multi: true }],
  template: \`...\`,
})
export class Sterne implements ControlValueAccessor {
  wert = signal(0);
  private onChange = (v: number) => {};
  private onTouched = () => {};

  writeValue(v: number | null) { this.wert.set(v ?? 0); }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  waehle(n: number) { this.wert.set(n); this.onChange(n); this.onTouched(); }
}`,
      notes: [['NG_VALUE_ACCESSOR', 'Das Token, über das Angular Formularfelder findet. multi!'], ['forwardRef', 'Die Klasse Sterne gibt es an dieser Stelle noch nicht. forwardRef löst das später auf.'], ['writeValue', 'Formular → Feld: Neuer Wert von außen.'], ['registerOnChange', 'Angular gibt dir eine Funktion. Rufst du sie auf, kennt das Formular den neuen Wert.'], ['registerOnTouched', 'Für „touched“: Nutzer hat das Feld angefasst.']],
      pro: 'Dazu gehört oft setDisabledState(aus). Bei Signal Forms (kommt im Kapitel zum Feedback-Formular) baust du eigene Felder mit FormValueControl (value = model()), das ist deutlich einfacher. FormValueControl funktioniert inzwischen auch mit Reactive Forms. Im Bestandscode ist CVA aber Pflichtwissen.' }
  ],
  quiz: [
    { q: 'Wann laufen die async-Validatoren eines Formularfelds?', options: ['Immer zuerst, vor den normalen Validatoren', 'Erst, wenn alle normalen Validatoren keinen Fehler melden', 'Nur beim Absenden', 'Nie automatisch'], correct: 1, why: 'Sonst würde Angular auch für Werte beim Server nachfragen, die ohnehin ungültig sind.' },
    { q: 'Welchen Status hat ein Control, während der async-Validator läuft?', options: ['VALID', 'INVALID', 'PENDING', 'DISABLED'], correct: 2, why: 'PENDING heißt: Die Prüfung läuft noch.' },
    { q: 'Welche Methode eines ControlValueAccessor ruft Angular auf, um einen Wert INS Feld zu schreiben?', options: ['registerOnChange', 'writeValue', 'setValue', 'onTouched'], correct: 1, why: 'writeValue geht vom Formular zum Feld. onChange geht vom Feld zurück zum Formular.' }
  ],
  ex: { id: 'exn4', title: 'Die Hackathon-Anmeldung', goal: 'Baue das Team-Formular mit Zeilen, Doppelt-Prüfung, Server-Prüfung und einem Sterne-Feld.', preview: 'Sterne',
    todo: ['<code>entwicklerZeile(name, nummer)</code>: Gruppe, <code>name</code> Pflicht, <code>nummer</code> Pflicht, 1 bis 99', '<code>nummernEindeutig</code>: Gruppen-Validator fürs Array → <code>{ doppelt: true }</code>', '<code>nameFrei(api)</code>: async, <code>api.istVergeben(name)</code> true → <code>{ vergeben: true }</code>', '<code>neuesTeam(api)</code>: <code>teamname</code> (Pflicht + async) und <code>entwickler</code> (FormArray mit nummernEindeutig)', '<code>Sterne</code> ist ein ControlValueAccessor mit NG_VALUE_ACCESSOR-Provider'],
    starter: C`
import { Component, signal, forwardRef } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators, ValidatorFn, AsyncValidatorFn, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface HackathonApi { istVergeben(name: string): Observable<boolean>; }

export function entwicklerZeile(name = '', nummer: number | null = null) {
  return new FormGroup({
    name: new FormControl(name),
    nummer: new FormControl<number | null>(nummer),
  });
}

export const nummernEindeutig: ValidatorFn = liste => null;

export function nameFrei(api: HackathonApi): AsyncValidatorFn {
  return c => api.istVergeben(c.value).pipe(map(() => null));
}

export function neuesTeam(api: HackathonApi) {
  return new FormGroup({
    teamname: new FormControl(''),
    entwickler: new FormArray<FormGroup>([]),
  });
}

@Component({
  selector: 'app-sterne',
  template: \`
    @for (n of [1, 2, 3, 4, 5]; track n) {
      <button type="button" class="stern" [class.an]="n <= wert()" [disabled]="aus()" (click)="waehle(n)">★</button>
    }
  \`,
})
export class Sterne {
  wert = signal(0);
  aus = signal(false);
  waehle(n: number) { this.wert.set(n); }
}
`,
    solution: C`
import { Component, signal, forwardRef } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators, ValidatorFn, AsyncValidatorFn, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface HackathonApi { istVergeben(name: string): Observable<boolean>; }

export function entwicklerZeile(name = '', nummer: number | null = null) {
  return new FormGroup({
    name: new FormControl(name, Validators.required),
    nummer: new FormControl<number | null>(nummer, [Validators.required, Validators.min(1), Validators.max(99)]),
  });
}

export const nummernEindeutig: ValidatorFn = liste => {
  const n = (liste.value as { nummer: number | null }[]).map(s => s.nummer).filter(x => x != null);
  const doppelt = n.some((x, i) => n.indexOf(x) !== i);
  return doppelt ? { doppelt: true } : null;
};

export function nameFrei(api: HackathonApi): AsyncValidatorFn {
  return c => api.istVergeben(c.value).pipe(map(v => v ? { vergeben: true } : null));
}

export function neuesTeam(api: HackathonApi) {
  return new FormGroup({
    teamname: new FormControl('', { validators: [Validators.required], asyncValidators: [nameFrei(api)] }),
    entwickler: new FormArray<FormGroup>([], { validators: [nummernEindeutig] }),
  });
}

@Component({
  selector: 'app-sterne',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Sterne), multi: true }],
  template: \`
    @for (n of [1, 2, 3, 4, 5]; track n) {
      <button type="button" class="stern" [class.an]="n <= wert()" [disabled]="aus()" (click)="waehle(n)">★</button>
    }
  \`,
})
export class Sterne implements ControlValueAccessor {
  wert = signal(0);
  aus = signal(false);
  private onChange = (v: number) => {};
  private onTouched = () => {};

  writeValue(v: number | null) { this.wert.set(v ?? 0); }
  registerOnChange(fn: (v: number) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(aus: boolean) { this.aus.set(aus); }

  waehle(n: number) {
    this.wert.set(n);
    this.onChange(n);
    this.onTouched();
  }
}
`,
    notes: [['Validators.max(99)', 'Teilnehmernummern gehen bis 99.'], ['filter(x => x != null)', 'Leere Nummern zählen nicht als doppelt.'], ['n.some((x, i) => n.indexOf(x) !== i)', 'Gibt es eine Nummer, die schon weiter vorne steht? Dann ist sie doppelt.'], ["v ? { vergeben: true } : null", 'Server sagt vergeben → Fehler.'], ['asyncValidators: [nameFrei(api)]', 'Async-Regel im Options-Objekt.'], ['{ validators: [nummernEindeutig] }', 'Die Regel hängt am ganzen Array.'], ['NG_VALUE_ACCESSOR', 'Macht Sterne zu einem echten Formularfeld.'], ['forwardRef(() => Sterne)', 'Der Provider steht im @Component über der Klasse. Dort ist Sterne noch nicht definiert. forwardRef holt die Klasse erst später, wenn Angular sie braucht.'], ['this.onChange(n)', 'Dem Formular den neuen Wert melden.']],
    hints: ['Gruppen-Validator: <code>(liste.value as …[]).map(s =&gt; s.nummer).filter(x =&gt; x != null)</code>, dann mit <code>n.some((x, i) =&gt; n.indexOf(x) !== i)</code> nach Doppelten suchen', 'Async: <code>new FormControl(\'\', { validators: [Validators.required], asyncValidators: [nameFrei(api)] })</code>', 'CVA-Provider: <code>{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() =&gt; Sterne), multi: true }</code>'],
    tests: [
      { name: 'Entwicklerzeile prüft Name und Nummer', run: T => { const z = T.get('entwicklerZeile')(); T.ok(z.hasError('required', 'name') && z.hasError('required', 'nummer'), 'name und nummer sind Pflicht.'); z.get('nummer').setValue(100); T.ok(z.get('nummer').hasError('max'), '100 ist zu groß → Validators.max(99).'); z.get('nummer').setValue(0); T.ok(z.get('nummer').hasError('min'), '0 ist zu klein → Validators.min(1).'); const ok = T.get('entwicklerZeile')('Leon', 9); T.ok(ok.valid, 'Leon mit 9 soll gültig sein.'); } },
      { name: 'Doppelte Nummer wird erkannt', run: T => { const api = { istVergeben: () => T.rx.of(false) }; const f = T.get('neuesTeam')(api); const a = f.get('entwickler'); T.ok(a && a.push, 'entwickler soll ein FormArray sein.'); a.push(T.get('entwicklerZeile')('Leon', 9)); a.push(T.get('entwicklerZeile')('Mo', 9)); T.ok(a.hasError('doppelt'), 'Zweimal die 9 → { doppelt: true } am FormArray.'); a.removeAt(1); T.ok(!a.hasError('doppelt'), 'Nach removeAt ist alles wieder gut.'); a.push(T.get('entwicklerZeile')('Ben', null)); a.push(T.get('entwicklerZeile')('Tim', null)); T.ok(!a.hasError('doppelt'), 'Leere Nummern zählen nicht als doppelt.'); } },
      { name: 'Teamname wird beim Server geprüft', run: async T => { let questions = 0; const api = { istVergeben: n => { questions++; return T.rx.of(n === 'Quick & Dirty').pipe(T.op.delay(20)); } }; const f = T.get('neuesTeam')(api); const v = f.get('teamname'); T.ok(v.hasError('required'), 'teamname ist Pflicht.'); T.eq(questions, 0, 'Leer → noch keine Server-Anfrage.'); v.setValue('Quick & Dirty'); T.ok(v.pending, 'Während der Prüfung soll teamname pending sein (asyncValidators).'); await T.flush(60); T.ok(v.hasError('vergeben'), '„Quick & Dirty“ ist vergeben → { vergeben: true }.'); v.setValue('Pixelwerk'); await T.flush(60); T.ok(v.valid, 'Freier Name → gültig.'); } },
      { name: 'Sterne melden den Wert ans Formular', run: async T => { const f = T.mount(T.cmp('Sterne')); const i = f.instance; T.ok(typeof i.registerOnChange === 'function' && typeof i.writeValue === 'function' && typeof i.registerOnTouched === 'function', 'Sterne braucht writeValue, registerOnChange und registerOnTouched.'); const got = []; let touched = 0; i.registerOnChange(v => got.push(v)); i.registerOnTouched(() => touched++); await f.click(f.qa('.stern')[3]); T.eq(got, [4], 'Klick auf den 4. Stern → onChange(4).'); T.ok(touched > 0, 'Nach dem Klick onTouched() aufrufen.'); T.eq(f.qa('.stern.an').length, 4, '4 Sterne sollen leuchten.'); } },
      { name: 'Formular schreibt in die Sterne', run: async T => { const f = T.mount(T.cmp('Sterne')); f.instance.writeValue(2); await T.flush(); T.eq(f.qa('.stern.an').length, 2, 'writeValue(2) → 2 Sterne an.'); f.instance.writeValue(null); await T.flush(); T.eq(f.qa('.stern.an').length, 0, 'writeValue(null) → keiner an.'); T.ok(typeof f.instance.setDisabledState === 'function', 'Es fehlt setDisabledState(aus).'); f.instance.setDisabledState(true); await T.flush(); T.ok(f.qa('.stern').every(b => b.disabled), 'setDisabledState(true) → alle Knöpfe disabled.'); } },
      { name: 'NG_VALUE_ACCESSOR-Provider', run: T => { const S = T.get('Sterne'); const NVA = T.ng.modules['@angular/forms'].NG_VALUE_ACCESSOR; const p = [].concat(T.meta(S).providers || []).find(x => x && x.provide === NVA); T.ok(p, 'providers: [{ provide: NG_VALUE_ACCESSOR, … }] fehlt.'); T.ok(p.multi === true, 'NG_VALUE_ACCESSOR braucht multi: true.'); const ex = T.ng.core.resolveForwardRef(p.useExisting); T.ok(ex === S, 'useExisting: forwardRef(() => Sterne).'); } }
    ] },
  takeaway: ['FormArray für Listen: push, removeAt.', 'Gruppen-Validator sieht alle Felder, async-Validator fragt den Server (pending).', 'ControlValueAccessor: writeValue rein, onChange raus.', 'NG_VALUE_ACCESSOR + forwardRef + multi.'],
  pairs: [
    ['FormArray', 'Liste von Feldern, wächst zur Laufzeit'],
    ['Gruppen-Validator', 'Sieht alle Felder: keine Nummer doppelt'],
    ['async-Validator', 'Fragt den Server, solange ist es pending'],
    ['ControlValueAccessor', 'Macht deine Komponente zum Formularfeld'],
    ['<code>writeValue</code>', 'Wert vom Formular in deine Komponente']
  ]
});

CH.push({
  id: 'n05', act: 6, title: 'Das Entwicklerprofil', tag: 'Signals ⇄ RxJS · resource · linkedSignal', xp: 220,
  docs: [['Asynchrone Daten mit resource', 'https://angular.dev/guide/signals/resource'], ['Signals und RxJS verbinden, rxResource', 'https://angular.dev/ecosystem/rxjs-interop'], ['Abhängiger Zustand mit linkedSignal', 'https://angular.dev/guide/signals/linked-signal']],
  ticket: { id: 'PW-143', category: 'Bug', heading: 'Alter Entwickler blitzt kurz auf', text: 'Beim Wechsel zum nächsten Entwickler steht eine Sekunde lang noch der alte da. Der gewählte Tab springt nicht auf „Profil“ zurück.' },
  story: [
    ['mia', 'Zwei Bugs im Entwicklerprofil: Beim Wechsel blitzt kurz der alte Entwickler auf. Und der Tab „Statistik“ bleibt offen, obwohl ein neuer Entwickler da ist.'],
    ['du', 'Soll ich das mit Signals oder mit RxJS lösen?'],
    ['toni', 'Beides. Die eigentliche Senior-Frage ist nicht „was ist besser“, sondern „was wofür“.']
  ],
  slides: [
    { t: 'Was wofür?', say: 'Signals halten Zustand. RxJS beschreibt Abläufe über Zeit. Gute Apps benutzen beides und verbinden sie an klaren Stellen.', job: 'Faustregel aus vielen Teams: Zustand, den das Template anzeigt, als Signal. Abläufe mit Zeit (Suche, Websocket, Wiederholen) mit RxJS. An der Grenze toSignal oder toObservable.',
      points: [['Signal', 'Aktueller Wert, synchron, immer da. Template, abgeleitete Werte, Formular-Zustand.', ''], ['Observable', 'Ereignisse über Zeit: Tippen, WebSocket, Polling, Abbrechen, Wiederholen.', ''], ['toSignal / toObservable', 'Brücke in beide Richtungen.', 'plus'], ['resource / rxResource / httpResource', 'Laden als Signal: value, isLoading, error, reload.', 'plus'], ['Faustregel', 'Braucht es Zeit-Operatoren (debounce, switchMap, retry)? → RxJS. Sonst Signal.', 'plus']],
      pro: 'Typische Falle: toSignal() außerhalb des Injection Context (z. B. in ngOnInit) → Fehler. Und: Ein Signal ist „glitch-free“: computed sieht nie einen halben Zwischenstand, ein combineLatest schon.' },
    { t: 'rxResource: Laden, wenn sich etwas ändert', say: 'Ändert sich params, lädt die Ressource neu. Die alte Anfrage wird abgebrochen. Du bekommst Signals für Wert, Laden und Fehler.', job: 'rxResource und httpResource ersetzen in neuem Code viele selbst gebaute Lade-Logiken mit isLoading, error und subscribe. Weniger Code, weniger Bugs.',
      code: C`
id = signal(1);

entwickler = rxResource({
  params: () => this.id(),
  stream: ({ params }) => this.http.get<Entwickler>('/api/entwickler/' + params),
});

// Template
@if (entwickler.isLoading()) { <p>Lädt …</p> }
@if (entwickler.hasValue() && entwickler.value(); as s) { <h3>{{ s.name }}</h3> }
@if (entwickler.error()) { <p>Fehler!</p> }`,
      notes: [['params: () => this.id()', 'Wovon hängt das Laden ab? Ändert sich id, lädt es neu.'], ['stream:', 'Ein Observable, das die Daten holt.'], ['isLoading()', 'Läuft gerade eine Anfrage?'], ['value(); as s', 'as s gibt dem Ergebnis einen kurzen Namen. Im Block schreibst du s.name statt entwickler.value().name. hasValue() steht davor, weil value() bei einem Fehler wirft.'], ['error()', 'Was schiefging.']],
      pro: 'resource({ params, loader }) macht dasselbe mit Promises/fetch. httpResource(() => \'/api/entwickler/\' + id()) ist die Kurzform mit HttpClient. Dazu reload() und set(). Seit Angular 22 stabil. Neu: params: ({ chain }) => chain(andereResource) wartet auf eine andere Resource. debounced(() => suche(), 300) entprellt ein Signal, ist aber noch experimentell.' },
    { t: 'linkedSignal & untracked', say: 'linkedSignal ist ein Signal, das man setzen kann, das aber zurückspringt, wenn sich seine Quelle ändert. untracked liest ein Signal, ohne davon abzuhängen.', job: 'Formular, das sich beim Wechsel des Datensatzes zurücksetzen soll, oder eine Auswahl, die bei neuem Filter zurückspringt: Das sind die typischen Fälle für linkedSignal.',
      code: C`
tab = linkedSignal({ source: this.id, computation: () => 'profil' });

effect(() => {
  const id = this.id();
  untracked(() => this.log.push('Entwickler ' + id + ', Klicks: ' + this.klicks()));
});

suche$ = toObservable(this.suchbegriff).pipe(debounceTime(300));`,
      notes: [['linkedSignal', 'Setzbar wie signal(), aber neu berechnet, wenn source sich ändert.'], ["computation: () => 'profil'", 'Startwert nach jedem Wechsel.'], ['untracked(', 'Liest klicks, ohne dass der effect bei jeder Klick-Änderung läuft.'], ['toObservable', 'Signal → Observable, damit debounceTime möglich ist.']],
      pro: 'Ohne untracked würde der effect bei jeder Änderung von klicks laufen. Das ist die häufigste effect-Falle im Review: Er hängt an mehr Signals, als man denkt.' }
  ],
  quiz: [
    { q: 'Eine Suche soll erst nach einer kurzen Tipp-Pause starten (debounce) und alte Anfragen abbrechen. Womit baust du das?', options: ['Mit einem computed', 'Mit RxJS (z. B. toObservable + debounceTime + switchMap)', 'Mit einem effect, in dem ein subscribe steht', 'Mit linkedSignal'], correct: 1, why: 'Abläufe über die Zeit sind die Stärke von RxJS. Dafür gibt es fertige Operatoren.' },
    { q: 'Was macht eine rxResource, wenn sich ihr Signal params ändert?', options: ['Nichts, bis man reload() aufruft', 'Sie lädt neu und bricht die alte Anfrage ab', 'Sie lädt neu, die alte Anfrage läuft aber weiter', 'Sie wartet, bis die alte Anfrage fertig ist'], correct: 1, why: 'Das wirkt wie switchMap, nur als Signal verpackt.' },
    { q: 'Wozu benutzt man untracked() in einem effect?', options: ['Um den effect schneller zu machen', 'Um ein Signal zu lesen, ohne davon abzuhängen', 'Um Fehler im effect abzufangen', 'Um ein Signal zu setzen, ohne dass es eine Änderung meldet'], correct: 1, why: 'Der effect läuft dann nur neu, wenn sich die Signals ändern, die er wirklich beobachten soll.' }
  ],
  ex: { id: 'exn5', title: 'Das Entwicklerprofil', goal: 'Lade Entwickler mit rxResource, setz den Tab mit linkedSignal zurück und protokolliere nur Entwicklerwechsel.', preview: 'ProfilAnsicht', backend: 'profile',
    todo: ['<code>entwickler = rxResource({ params: () =&gt; this.id(), stream: … })</code> lädt <code>/api/entwickler/ID</code>', 'Template: <code>.laedt</code> bei <code>isLoading()</code>, <code>.name</code> mit dem Namen', '<code>tab = linkedSignal({ source: this.id, computation: () =&gt; \'profil\' })</code>', 'Der <code>effect</code> protokolliert nur, wenn sich <code>id</code> ändert. <code>klicks</code> mit <code>untracked</code> lesen'],
    starter: C`
import { Component, inject, signal, effect, untracked, linkedSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';

interface Entwickler { id: number; name: string; }

@Component({
  selector: 'app-profil-ansicht',
  template: \`
    <button class="next" (click)="id.update(i => i + 1)">Nächster</button>
    <button class="klick" (click)="klicks.update(k => k + 1)">Klick</button>
    <!-- Lädt …  und  Name -->
    <p class="tab">{{ tab() }}</p>
  \`,
})
export class ProfilAnsicht {
  private http = inject(HttpClient);
  id = signal(1);
  klicks = signal(0);
  protokoll: string[] = [];

  tab = signal('profil');

  constructor() {
    effect(() => {
      this.protokoll.push('Entwickler ' + this.id() + ', Klicks: ' + this.klicks());
    });
  }
}
`,
    solution: C`
import { Component, inject, signal, effect, untracked, linkedSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';

interface Entwickler { id: number; name: string; }

@Component({
  selector: 'app-profil-ansicht',
  template: \`
    <button class="next" (click)="id.update(i => i + 1)">Nächster</button>
    <button class="klick" (click)="klicks.update(k => k + 1)">Klick</button>
    @if (entwickler.isLoading()) {
      <p class="laedt">Lädt …</p>
    }
    @if (entwickler.hasValue() && entwickler.value(); as s) {
      <h3 class="name">{{ s.name }}</h3>
    }
    <p class="tab">{{ tab() }}</p>
  \`,
})
export class ProfilAnsicht {
  private http = inject(HttpClient);
  id = signal(1);
  klicks = signal(0);
  protokoll: string[] = [];

  entwickler = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.http.get<Entwickler>('/api/entwickler/' + params),
  });

  tab = linkedSignal({ source: this.id, computation: () => 'profil' });

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.protokoll.push('Entwickler ' + id + ', Klicks: ' + this.klicks()));
    });
  }
}
`,
    notes: [['rxResource({', 'Laden als Signal.'], ['params: () => this.id()', 'Neue id = neu laden.'], ["stream: ({ params })", 'params ist der aktuelle Wert von id.'], ['entwickler.isLoading()', 'Zeigt „Lädt …“, solange die Anfrage läuft.'], ['entwickler.value(); as s', 'Name anzeigen, sobald da. Mit as s heißt der Wert im Block einfach s.'], ['linkedSignal({ source: this.id', 'Neuer Entwickler → Tab zurück auf profil.'], ['untracked(', 'klicks lesen, ohne den effect daran zu hängen.']],
    hints: ['<code>entwickler = rxResource({ params: () =&gt; this.id(), stream: ({ params }) =&gt; this.http.get&lt;Entwickler&gt;(\'/api/entwickler/\' + params) });</code>', 'Template: <code>@if (entwickler.hasValue() &amp;&amp; entwickler.value(); as s) { &lt;h3 class="name"&gt;{{ s.name }}&lt;/h3&gt; }</code>', 'Effect: erst <code>const id = this.id();</code>, dann <code>untracked(() =&gt; …this.klicks()…)</code>'],
    tests: [
      { name: 'Lädt Entwickler 1', run: async T => { const f = T.mount(T.cmp('ProfilAnsicht')); await T.flush(5); T.ok(f.q('.laedt'), 'Während des Ladens soll <p class="laedt"> zu sehen sein (entwickler.isLoading()).'); await T.flush(80); T.ok(!f.q('.laedt'), 'Nach dem Laden soll „Lädt …“ weg sein.'); T.eq(f.q('.name') && f.q('.name').textContent.trim(), 'Leon', 'Nach dem Laden soll <h3 class="name">Leon</h3> stehen.'); } },
      { name: 'Nächster lädt neu', run: async T => { const f = T.mount(T.cmp('ProfilAnsicht')); await T.flush(80); await f.click('.next'); await T.flush(80); T.eq(f.q('.name') && f.q('.name').textContent.trim(), 'Mo', 'Nach „Nächster“ soll Entwickler 2 (Mo) geladen werden.'); T.ok(T.has(/rxResource\s*\(/), 'Bitte rxResource benutzen.'); } },
      { name: 'Tab springt zurück', run: async T => { const f = T.mount(T.cmp('ProfilAnsicht')); const i = f.instance; i.tab.set('statistik'); T.eq(i.tab(), 'statistik', 'tab soll setzbar sein.'); i.id.set(2); T.eq(i.tab(), 'profil', 'Neuer Entwickler → tab wieder profil. linkedSignal({ source: this.id, computation: () => \'profil\' })'); } },
      { name: 'Protokoll nur bei Entwicklerwechsel', run: async T => { const f = T.mount(T.cmp('ProfilAnsicht')); await T.flush(10); const i = f.instance; const n = i.protokoll.length; T.ok(n === 1, 'Nach dem Start soll genau ein Eintrag im Protokoll stehen.'); await f.click('.klick'); await f.click('.klick'); await T.flush(10); T.eq(i.protokoll.length, n, 'Klicks sollen den effect NICHT auslösen. klicks mit untracked lesen.'); i.id.set(3); await T.flush(10); T.eq(i.protokoll[i.protokoll.length - 1], 'Entwickler 3, Klicks: 2', 'Bei Entwicklerwechsel neuer Eintrag mit aktuellen Klicks.'); } }
    ] },
  takeaway: ['Signal = Zustand, Observable = Ablauf über Zeit.', 'rxResource/httpResource: value, isLoading, error, reload.', 'linkedSignal: setzbar, springt bei neuer Quelle zurück.', 'untracked: lesen ohne Abhängigkeit.'],
  pairs: [
    ['Signal', 'Aktueller Zustand, synchron, immer da'],
    ['Observable', 'Ereignisse über die Zeit'],
    ['<code>rxResource</code>', 'Lädt neu, wenn sich params ändert'],
    ['<code>linkedSignal</code>', 'Setzbar, springt bei neuer Quelle zurück'],
    ['<code>untracked</code>', 'Liest ein Signal, ohne davon abzuhängen']
  ]
});

CH.push({
  id: 'n06', act: 6, title: 'Das Incident-Protokoll', tag: 'TypeScript für Profis', xp: 200,
  docs: [['Generics in TypeScript', 'https://www.typescriptlang.org/docs/handbook/2/generics.html'], ['Typen eingrenzen: Guards und Unions', 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html']],
  ticket: { id: 'PW-144', category: 'Bug', heading: 'Kritischer Alarm als Warnung angezeigt', text: 'Vom Monitoring kam ein Alarm ohne Stufe. Das Dashboard hat „Warnung“ angezeigt, es war kritisch. Mach die Typen so genau, dass das nicht mehr durchrutscht.' },
  story: [
    ['boss', 'Gestern kam vom Monitoring ein Alarm ohne Stufe. Unser Dashboard hat „Warnung“ gezeigt. Es war kritisch. Der Shop eines Kunden war eine Stunde down!'],
    ['jonas', 'Sorry, das war ein Fehler bei uns. Aber das Frontend hätte das merken können.'],
    ['toni', 'Er hat recht. TypeScript kann solche Fehler auffangen. Aber nur, wenn wir mehr als string und number benutzen.']
  ],
  slides: [
    { t: 'Generics: ein Werkzeug für alle Typen', say: 'Ein Generic ist ein Platzhalter für einen Typ. Die Funktion funktioniert mit Entwicklern, Projekten, Tickets, und TypeScript weiß trotzdem genau, was rauskommt.', job: 'In jedem Projekt gibt es Hilfen wie ApiResponse<T> oder Page<T> für Seiten mit Blättern. Einmal generisch geschrieben, für alle Daten benutzt.',
      code: C`
function gruppiere<T, K extends string>(liste: T[], schluessel: (x: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const x of liste) (out[schluessel(x)] ??= []).push(x);
  return out;
}

const nachPosition = gruppiere(team, s => s.position);
// Typ: Record<'Design' | 'Backend' | 'Fullstack' | 'Frontend', Entwickler[]>`,
      notes: [['<T, K extends string>', 'Zwei Platzhalter. K muss ein Text-Typ sein.'], ['(x: T) => K', 'Eine Funktion, die aus einem Element den Schlüssel macht.'], ['Record<K, T[]>', 'Objekt: Schlüssel K, Wert Liste von T.'], ['??= []', 'Wenn noch leer, leere Liste anlegen.']],
      pro: 'Angular ist voller Generics: signal<Entwickler[]>, input.required<string>, http.get<Entwickler>, InjectionToken<string>, FormControl<number | null>. Wer sie lesen kann, liest Angular.' },
    { t: 'Discriminated Unions', say: 'Ein Typ, der mehrere Formen haben kann. Ein Feld (typ) sagt, welche. TypeScript prüft dann, dass du jeden Fall behandelst.', job: 'Lade-Zustände, Ereignisse, Zahlungsarten: Wo es „entweder das eine oder das andere“ gibt, sind Discriminated Unions in Firmen-Code Standard. Der Compiler meldet dann jeden vergessenen Fall.',
      code: C`
type Ereignis =
  | { typ: 'deploy'; minute: number; autor: string }
  | { typ: 'alarm'; minute: number; stufe: 'warnung' | 'kritisch'; entwickler: string };

function beschreibe(e: Ereignis) {
  switch (e.typ) {
    case 'deploy': return e.autor;   // hier gibt es autor
    case 'alarm': return e.stufe;     // hier gibt es stufe
    default: { const nie: never = e; return nie; }
  }
}`,
      notes: [["typ: 'deploy'", 'Das Unterscheidungs-Feld.'], ["'warnung' | 'kritisch'", 'Nur diese zwei Texte erlaubt. Kein „vielleicht“.'], ['switch (e.typ)', 'TypeScript weiß in jedem case, welche Form es ist.'], ['never', 'Kommt ein neuer Typ dazu und du vergisst ihn, meckert der Compiler hier.']],
      pro: 'Damit modelliert man auch Ladezustände: { status: \'laedt\' } | { status: \'fertig\'; daten: Entwickler[] } | { status: \'fehler\'; meldung: string }. Unmögliche Zustände sind dann unmöglich.' },
    { t: 'Typen zur Laufzeit: Type Guards', say: 'TypeScript-Typen verschwinden beim Bauen. Was vom Server kommt, ist erst mal unknown. Ein Type Guard prüft echt und sagt TypeScript Bescheid.', job: 'Daten vom Server, aus localStorage oder aus der URL sind nie sicher. In größeren Projekten prüft man sie mit einer Bibliothek wie zod oder mit eigenen Type Guards.',
      code: C`
function istEntwickler(x: unknown): x is Entwickler {
  return typeof x === 'object' && x !== null
    && typeof (x as Entwickler).id === 'number'
    && typeof (x as Entwickler).name === 'string';
}

const STANDORTE = { koeln: 'Köln', berlin: 'Berlin' } satisfies Record<string, string>;`,
      notes: [['x is Entwickler', 'Rückgabetyp „Type Predicate“: Ist das true, ist x ein Entwickler.'], ['unknown', 'Wie any, aber man MUSS erst prüfen. Immer unknown statt any.'], ['satisfies', 'Prüft gegen einen Typ, behält aber die genauen Werte (koeln bleibt bekannt).']],
      pro: 'In Firmen nimmt man dafür oft Zod oder Valibot: ein Schema für Laufzeit-Prüfung UND Typ. Und tsconfig mit "strict": true ist Pflicht. Ohne strict ist TypeScript halb so viel wert.' }
  ],
  quiz: [
    { q: 'Welchen Typ gibst du Daten, die als JSON vom Server kommen und noch nicht geprüft sind?', options: ['any', 'unknown', 'Entwickler', 'object'], correct: 1, why: 'unknown zwingt dich, die Daten erst zu prüfen. any schaltet dagegen jede Prüfung ab.' },
    { q: 'Wozu dient die Zeile <code>const nie: never = e</code> im default-Zweig eines switch über eine Discriminated Union?', options: ['Sie macht den Code schneller', 'Der Compiler meldet einen Fehler, wenn ein Fall fehlt', 'Sie wandelt e in einen leeren Wert um', 'Sie fängt Fehler zur Laufzeit ab'], correct: 1, why: 'Das heißt Exhaustiveness Check: So wird kein Fall vergessen.' },
    { q: 'Was sagt die Signatur <code>function f&lt;T&gt;(x: T): T</code> aus?', options: ['Die Funktion gibt immer any zurück', 'Die Funktion gibt denselben Typ zurück, der hineinkam', 'Die Funktion gibt immer unknown zurück', 'Die Funktion nimmt nur Objekte an, keine Zahlen oder Texte'], correct: 1, why: 'T ist ein Platzhalter für einen Typ, der erst beim Aufruf festgelegt wird.' }
  ],
  ex: { id: 'exn6', title: 'Das Incident-Protokoll', goal: 'Schreib typsichere Hilfsfunktionen: generisch gruppieren, Ereignisse beschreiben, Server-Daten prüfen.',
    todo: ['<code>gruppiere&lt;T, K extends string&gt;(liste, schluessel)</code> gibt <code>Record&lt;K, T[]&gt;</code> zurück', '<code>beschreibe(e)</code>: Deploy → <code>12\'. Deploy von Leon</code>, Alarm → <code>30\'. Kritisch für Ricky</code>, Schichtwechsel → <code>60\'. Ben für Mo</code>', 'Im <code>default</code> ein <code>never</code>-Check', '<code>istEntwickler(x: unknown): x is Entwickler</code> prüft id (Zahl) und name (Text)', '<code>STANDORTE</code> mit <code>satisfies Record&lt;string, string&gt;</code>'],
    starter: C`
export interface Entwickler { id: number; name: string; position: 'Design' | 'Backend' | 'Fullstack' | 'Frontend'; }

export type Ereignis =
  | { typ: 'deploy'; minute: number; autor: string }
  | { typ: 'alarm'; minute: number; stufe: 'warnung' | 'kritisch'; entwickler: string }
  | { typ: 'wechsel'; minute: number; raus: string; rein: string };

export function gruppiere(liste: any[], schluessel: any): any {
  return {};
}

export function beschreibe(e: any): string {
  return '';
}

export function istEntwickler(x: any): boolean {
  return true;
}

export const STANDORTE = { koeln: 'Köln', berlin: 'Berlin' };
`,
    solution: C`
export interface Entwickler { id: number; name: string; position: 'Design' | 'Backend' | 'Fullstack' | 'Frontend'; }

export type Ereignis =
  | { typ: 'deploy'; minute: number; autor: string }
  | { typ: 'alarm'; minute: number; stufe: 'warnung' | 'kritisch'; entwickler: string }
  | { typ: 'wechsel'; minute: number; raus: string; rein: string };

export function gruppiere<T, K extends string>(liste: T[], schluessel: (x: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const x of liste) {
    (out[schluessel(x)] ??= []).push(x);
  }
  return out;
}

export function beschreibe(e: Ereignis): string {
  switch (e.typ) {
    case 'deploy': return \`\${e.minute}'. Deploy von \${e.autor}\`;
    case 'alarm': return \`\${e.minute}'. \${e.stufe === 'kritisch' ? 'Kritisch' : 'Warnung'} für \${e.entwickler}\`;
    case 'wechsel': return \`\${e.minute}'. \${e.rein} für \${e.raus}\`;
    default: {
      const nie: never = e;
      return nie;
    }
  }
}

export function istEntwickler(x: unknown): x is Entwickler {
  return typeof x === 'object' && x !== null
    && typeof (x as Entwickler).id === 'number'
    && typeof (x as Entwickler).name === 'string';
}

export const STANDORTE = { koeln: 'Köln', berlin: 'Berlin' } satisfies Record<string, string>;
`,
    notes: [['<T, K extends string>', 'Platzhalter für Element-Typ und Schlüssel-Typ.'], ['??= []', 'Leere Liste, falls es den Schlüssel noch nicht gibt.'], ['switch (e.typ)', 'Pro Form ein Fall.'], ['const nie: never = e', 'Fehlt ein Fall, wird das ein Compiler-Fehler.'], ['x is Entwickler', 'Type Guard: TypeScript glaubt dir nach der Prüfung.'], ['satisfies', 'Geprüft, aber genauer Typ bleibt.']],
    hints: ['Signatur: <code>gruppiere&lt;T, K extends string&gt;(liste: T[], schluessel: (x: T) =&gt; K): Record&lt;K, T[]&gt;</code>', 'Alarm: <code>e.stufe === \'kritisch\' ? \'Kritisch\' : \'Warnung\'</code>', 'Guard: <code>typeof x === \'object\' &amp;&amp; x !== null &amp;&amp; typeof (x as Entwickler).id === \'number\' …</code>'],
    tests: [
      { name: 'gruppiere funktioniert', run: T => { const k = [{ n: 'Leon', p: 'Frontend' }, { n: 'Mo', p: 'Fullstack' }, { n: 'Ben', p: 'Frontend' }]; const g = T.get('gruppiere')(k, s => s.p); T.eq(g.Frontend && g.Frontend.map(s => s.n), ['Leon', 'Ben'], 'Frontend soll [Leon, Ben] sein.'); T.eq(g.Fullstack && g.Fullstack.map(s => s.n), ['Mo'], 'Fullstack soll [Mo] sein.'); T.eq(T.get('gruppiere')([], s => s), {}, 'Leere Liste → leeres Objekt.'); } },
      { name: 'gruppiere ist generisch', run: T => { T.ok(T.has(/function\s+gruppiere\s*<\s*T\s*,\s*K\s+extends\s+string\s*>/), 'Signatur: gruppiere<T, K extends string>(…)'); T.ok(T.has(/Record<\s*K\s*,\s*T\[\]\s*>/) && !T.has(/function\s+gruppiere[^{]*any/), 'Rückgabetyp Record<K, T[]>, kein any.'); } },
      { name: 'beschreibe kennt alle Ereignisse', run: T => { const b = T.get('beschreibe'); T.eq(b({ typ: 'deploy', minute: 12, autor: 'Leon' }), "12'. Deploy von Leon", 'Deploy falsch.'); T.eq(b({ typ: 'alarm', minute: 30, stufe: 'kritisch', entwickler: 'Ricky' }), "30'. Kritisch für Ricky", 'Kritischer Alarm falsch.'); T.eq(b({ typ: 'alarm', minute: 31, stufe: 'warnung', entwickler: 'Ricky' }), "31'. Warnung für Ricky", 'Warnung falsch.'); T.eq(b({ typ: 'wechsel', minute: 60, raus: 'Mo', rein: 'Ben' }), "60'. Ben für Mo", 'Schichtwechsel falsch: rein für raus.'); } },
      { name: 'never-Check und Ereignis-Typ', run: T => { T.ok(T.has(/beschreibe\s*\(\s*e\s*:\s*Ereignis\s*\)/), 'beschreibe(e: Ereignis) statt any.'); T.ok(T.has(/:\s*never\s*=/), 'Im default: const nie: never = e;'); } },
      { name: 'istEntwickler prüft wirklich', run: T => { const g = T.get('istEntwickler'); T.ok(g({ id: 9, name: 'Leon' }) === true, 'Echter Entwickler → true.'); T.ok(g({ id: '9', name: 'Leon' }) === false, 'id als Text → false.'); T.ok(g(null) === false && g('Leon') === false && g({ name: 'Leon' }) === false, 'null, Text oder ohne id → false.'); T.ok(T.has(/x\s*:\s*unknown\s*\)\s*:\s*x\s+is\s+Entwickler/), 'Signatur: istEntwickler(x: unknown): x is Entwickler'); } },
      { name: 'satisfies', run: T => { T.eq(T.get('STANDORTE').koeln, 'Köln', 'Werte bleiben gleich.'); T.ok(T.has(/satisfies\s+Record<\s*string\s*,\s*string\s*>/), 'Hänge satisfies Record<string, string> an.'); } }
    ] },
  takeaway: ['Generics: <T> ist ein Typ-Platzhalter.', 'Discriminated Union + switch + never = kein Fall vergessen.', 'Server-Daten sind unknown, Type Guard prüft echt.', 'strict: true, unknown statt any, satisfies.'],
  pairs: [
    ['Generic <code><T></code>', 'Platzhalter für einen Typ'],
    ['Discriminated Union', 'Ein Feld sagt, welche Form gerade gilt'],
    ['<code>never</code>', 'Meldet im switch: ein Fall wurde vergessen'],
    ['Type Guard', 'Prüft zur Laufzeit und sagt TypeScript Bescheid'],
    ['<code>satisfies</code>', 'Prüft gegen einen Typ und behält den genauen Typ']
  ]
});

CH.push({
  id: 'n07', act: 6, title: 'Der Lead-Bereich', tag: 'Router für große Apps', xp: 200,
  docs: [['Routen definieren, auch verschachtelt', 'https://angular.dev/guide/routing/define-routes'], ['Guards für den Routen-Zugriff', 'https://angular.dev/guide/routing/route-guards'], ['Resolver für Routen-Daten', 'https://angular.dev/guide/routing/data-resolvers']],
  ticket: { id: 'PW-145', category: 'Feature', heading: 'Lead-Bereich mit Unterseiten', text: 'Der Lead-Bereich im Intranet hat Unterseiten. Die Planungs-Seite ist nur für Teamleads. Wer ungespeicherte Änderungen hat, wird vor dem Verlassen gefragt.' },
  story: [
    ['sara', 'Der Lead-Bereich wächst: Übersicht, Team, Planung. Planung nur für Teamleads. Und Leon hat gestern seine Änderungen verloren, weil er weggeklickt hat.'],
    ['toni', 'Dafür gibt es verschachtelte Routen, Resolver, canMatch und canDeactivate. Das ist der Router in großen Apps.']
  ],
  slides: [
    { t: 'Verschachtelte Routen', say: 'Ein Bereich hat eine eigene Liste von Unterseiten. Hat die Eltern-Route eine component, braucht diese ein eigenes <router-outlet>. Ohne component (wie hier) landen die Kinder im Outlet darüber.', job: 'Admin-Bereiche, Einstellungen mit Tabs, Profile mit Unterseiten: Fast jede größere Firmen-App hat verschachtelte Routen mit eigenem router-outlet.',
      code: C`
{
  path: 'team',
  title: 'Team',
  children: [
    { path: '', component: TeamListe },
    { path: ':id', component: EntwicklerSeite, resolve: { entwickler: entwicklerResolver } },
    { path: ':id/bearbeiten', component: Bearbeiten, canDeactivate: [ungespeichert] },
  ],
}`,
      notes: [['children:', 'Unterseiten von /team.'], ["path: ''", '/team selbst zeigt die Liste.'], ["':id'", '/team/9 zeigt den Entwickler.'], ['resolve:', 'Daten VOR dem Anzeigen laden.'], ['canDeactivate', 'Fragt, bevor man die Seite verlässt.'], ["title: 'Team'", 'Der Browser-Tab heißt dann „Team“.']],
      pro: 'Mit withComponentInputBinding kommt das Resolver-Ergebnis direkt als input() an: entwickler = input.required<Entwickler>(). Query-Parameter (?seite=2) übrigens auch.' },
    { t: 'Resolver, canMatch, canDeactivate', say: 'Drei Funktionen, drei Momente: vorher Daten holen, Route gar nicht erst finden, beim Verlassen nachfragen.', job: 'canDeactivate mit „Ungespeicherte Änderungen verwerfen?“ steht in fast jedem Formular-lastigen Projekt. Fehlt es, kommt früher oder später genau Leons Ticket.',
      code: C`
export const entwicklerResolver: ResolveFn<Entwickler> = route =>
  inject(TeamApi).finde(+route.paramMap.get('id')!);

export const nurLeads: CanMatchFn = () => inject(Auth).rolle() === 'lead';

export const ungespeichert: CanDeactivateFn<Bearbeiten> = seite =>
  !seite.geaendert() || inject(Dialog).frage('Änderungen verwerfen?');`,
      notes: [['ResolveFn<Entwickler>', 'Gibt die Daten zurück (Wert, Promise oder Observable).'], ["route.paramMap.get('id')", 'Parameter aus der URL lesen.'], ['CanMatchFn', 'false = die Route existiert für diesen Nutzer gar nicht. Bei lazy Routen wird ihr Code nicht einmal geladen.'], ['CanDeactivateFn<Bearbeiten>', 'Bekommt die Komponente und fragt sie.'], ['seite.geaendert()', 'Nichts geändert? Dann einfach gehen.']],
      pro: 'Resolver blockieren die Navigation, bis Daten da sind. Für langsame APIs ist es oft besser, sofort zu navigieren und in der Seite einen Lade-Zustand zu zeigen (resource). Senior-Entscheidung!' },
    { t: 'URL als Zustand', say: 'Filter, Seite, Sortierung gehören in die URL. Dann kann man den Link teilen und der Zurück-Knopf funktioniert.', job: 'Ein häufiger Wunsch vom Fachbereich: „Ich will den gefilterten Stand per Link an den Kollegen schicken.“ Das geht nur, wenn Filter in den Query-Parametern stehen.',
      code: C`
// /team?position=Frontend&seite=2
position = input<string>();   // mit withComponentInputBinding

weiter() {
  this.router.navigate([], {
    queryParams: { seite: 2 },
    queryParamsHandling: 'merge',
  });
}`,
      notes: [['?position=Frontend', 'Query-Parameter: Filter in der Adresse.'], ['input<string>()', 'Kommt automatisch aus der URL.'], ["navigate([]", 'Gleiche Seite, nur andere Parameter.'], ["'merge'", 'Vorhandene Parameter behalten.']],
      pro: 'Weitere Profi-Schalter: withPreloading(PreloadAllModules) lädt lazy Bereiche im Hintergrund vor, withViewTransitions für weiche Übergänge, RedirectCommand in Guards für Umleitungen mit Optionen.' }
  ],
  quiz: [
    { q: 'Was passiert, wenn der Guard canMatch einer Route false liefert?', options: ['Der Router zeigt eine leere Seite', 'Der Router überspringt die Route, als gäbe es sie nicht', 'Der Router lädt die Seite neu', 'Der Router wirft einen Fehler'], correct: 1, why: 'Der Router sucht dann in der Liste weiter. Bei einer lazy Route lädt er den Code gar nicht erst herunter.' },
    { q: 'Wo speicherst du den Filter einer Tabelle, wenn man die gefilterte Ansicht als Link teilen können soll?', options: ['Im localStorage', 'In der URL, als Query-Parameter', 'In einem globalen Objekt', 'In einem Cookie'], correct: 1, why: 'So lässt sich der Link teilen, der Zurück-Knopf funktioniert, und nach dem Neuladen ist der Filter noch da.' },
    { q: 'Wozu ist der Guard canDeactivate da?', options: ['Um vor dem Betreten den Login zu prüfen', 'Um vor dem Verlassen nachzufragen, z. B. bei ungespeicherten Änderungen', 'Um die Route für bestimmte Nutzer auszublenden', 'Um Daten vor dem Anzeigen zu laden'], correct: 1, why: 'Er schützt davor, dass jemand ungespeicherte Arbeit verliert.' }
  ],
  ex: { id: 'exn7', title: 'Der Lead-Bereich', goal: 'Bau die Routen mit Kindern, Resolver, canMatch und canDeactivate.',
    todo: ['<code>team</code> hat <code>children</code>: <code>\'\'</code> → TeamListe, <code>\':id\'</code> → EntwicklerSeite mit <code>resolve: { entwickler: entwicklerResolver }</code>, <code>\':id/bearbeiten\'</code> → Bearbeiten mit <code>canDeactivate</code>', '<code>team</code> hat <code>title: \'Team\'</code>', '<code>planung</code> → Planung, nur mit <code>canMatch: [nurLeads]</code>', '<code>entwicklerResolver</code> holt per <code>TeamApi.finde(id)</code>', '<code>ungespeichert</code>: nichts geändert → true, sonst <code>Dialog.frage(…)</code>'],
    starter: C`
import { Component, Service, inject, signal } from '@angular/core';
import { Routes, ResolveFn, CanMatchFn, CanDeactivateFn } from '@angular/router';

export interface Entwickler { id: number; name: string; }

@Service()
export class TeamApi {
  private liste = [{ id: 9, name: 'Leon' }, { id: 10, name: 'Mo' }];
  finde(id: number) { return this.liste.find(s => s.id === id); }
}
@Service()
export class Auth { rolle = signal<'dev' | 'lead'>('dev'); }
@Service()
export class Dialog { antwort = false; frage(text: string) { return this.antwort; } }

@Component({ selector: 'app-team-liste', template: '<h2>Team</h2>' }) export class TeamListe {}
@Component({ selector: 'app-entwickler-seite', template: '<h2>Entwickler</h2>' }) export class EntwicklerSeite {}
@Component({ selector: 'app-bearbeiten', template: '<h2>Bearbeiten</h2>' })
export class Bearbeiten { geaendert = signal(false); }
@Component({ selector: 'app-planung', template: '<h2>Planung</h2>' }) export class Planung {}

export const entwicklerResolver: ResolveFn<Entwickler | undefined> = route => undefined;
export const nurLeads: CanMatchFn = () => true;
export const ungespeichert: CanDeactivateFn<Bearbeiten> = seite => true;

export const routes: Routes = [
  { path: '', redirectTo: 'team', pathMatch: 'full' },
  { path: 'team', component: TeamListe },
];
`,
    solution: C`
import { Component, Service, inject, signal } from '@angular/core';
import { Routes, ResolveFn, CanMatchFn, CanDeactivateFn } from '@angular/router';

export interface Entwickler { id: number; name: string; }

@Service()
export class TeamApi {
  private liste = [{ id: 9, name: 'Leon' }, { id: 10, name: 'Mo' }];
  finde(id: number) { return this.liste.find(s => s.id === id); }
}
@Service()
export class Auth { rolle = signal<'dev' | 'lead'>('dev'); }
@Service()
export class Dialog { antwort = false; frage(text: string) { return this.antwort; } }

@Component({ selector: 'app-team-liste', template: '<h2>Team</h2>' }) export class TeamListe {}
@Component({ selector: 'app-entwickler-seite', template: '<h2>Entwickler</h2>' }) export class EntwicklerSeite {}
@Component({ selector: 'app-bearbeiten', template: '<h2>Bearbeiten</h2>' })
export class Bearbeiten { geaendert = signal(false); }
@Component({ selector: 'app-planung', template: '<h2>Planung</h2>' }) export class Planung {}

export const entwicklerResolver: ResolveFn<Entwickler | undefined> = route =>
  inject(TeamApi).finde(+route.paramMap.get('id')!);

export const nurLeads: CanMatchFn = () => inject(Auth).rolle() === 'lead';

export const ungespeichert: CanDeactivateFn<Bearbeiten> = seite =>
  !seite.geaendert() || inject(Dialog).frage('Änderungen verwerfen?');

export const routes: Routes = [
  { path: '', redirectTo: 'team', pathMatch: 'full' },
  {
    path: 'team',
    title: 'Team',
    children: [
      { path: '', component: TeamListe },
      { path: ':id', component: EntwicklerSeite, resolve: { entwickler: entwicklerResolver } },
      { path: ':id/bearbeiten', component: Bearbeiten, canDeactivate: [ungespeichert] },
    ],
  },
  { path: 'planung', component: Planung, canMatch: [nurLeads] },
];
`,
    notes: [["inject(TeamApi).finde(+route.paramMap.get('id')!)", 'id aus der URL, + macht eine Zahl, ! sagt: ist sicher da.'], ["inject(Auth).rolle() === 'lead'", 'Nur Leads finden die Route.'], ['!seite.geaendert() ||', 'Nichts geändert → sofort raus.'], ["inject(Dialog).frage", 'Sonst nachfragen.'], ['children: [', 'Unterseiten von team.'], ['resolve: { entwickler: entwicklerResolver }', 'Entwickler vor dem Anzeigen laden.'], ['canMatch: [nurLeads]', 'Für alle anderen gibt es /planung gar nicht.']],
    hints: ['Kinder: <code>{ path: \'team\', title: \'Team\', children: [ { path: \'\', component: TeamListe }, … ] }</code>', 'Resolver: <code>inject(TeamApi).finde(+route.paramMap.get(\'id\')!)</code>', 'Guard: <code>!seite.geaendert() || inject(Dialog).frage(\'Änderungen verwerfen?\')</code>'],
    tests: [
      { name: '/team zeigt die Liste, mit Titel', run: T => { const m = T.match(T.get('routes'), '/team'); T.ok(m && m.route.component === T.get('TeamListe'), '/team soll TeamListe zeigen (children mit path: \'\').'); T.ok(m.chain[0].title === 'Team', 'Die team-Route braucht title: \'Team\'.'); T.ok(Array.isArray(m.chain[0].children), 'team soll children haben.'); } },
      { name: '/team/9 mit Resolver', run: T => { const m = T.match(T.get('routes'), '/team/9'); T.ok(m && m.route.component === T.get('EntwicklerSeite'), '/team/9 soll EntwicklerSeite zeigen.'); T.eq(m.params.id, '9', 'Parameter heißt id.'); T.ok(m.route.resolve && m.route.resolve.entwickler === T.get('entwicklerResolver'), 'resolve: { entwickler: entwicklerResolver } fehlt.'); } },
      { name: 'Resolver holt den Entwickler', run: T => { const r = T.inCtx(() => T.get('entwicklerResolver')({ paramMap: new Map([['id', '9']]) }, {})); T.eq(r && r.name, 'Leon', 'Für id 9 soll der Resolver Leon liefern.'); } },
      { name: 'Bearbeiten mit canDeactivate', run: T => { const m = T.match(T.get('routes'), '/team/9/bearbeiten'); T.ok(m && m.route.component === T.get('Bearbeiten'), '/team/9/bearbeiten soll Bearbeiten zeigen.'); T.ok((m.route.canDeactivate || []).includes(T.get('ungespeichert')), 'canDeactivate: [ungespeichert] fehlt.'); } },
      { name: 'ungespeichert fragt nur bei Änderungen', run: T => { const g = T.get('ungespeichert'); const d = T.inject(T.get('Dialog')); T.eq(T.inCtx(() => g({ geaendert: () => false })), true, 'Nichts geändert → true.'); d.antwort = false; T.eq(T.inCtx(() => g({ geaendert: () => true })), false, 'Geändert und Dialog sagt nein → false.'); d.antwort = true; T.eq(T.inCtx(() => g({ geaendert: () => true })), true, 'Geändert und Dialog sagt ja → true.'); } },
      { name: 'Planung nur für Leads', run: T => { const m = T.match(T.get('routes'), '/planung'); T.ok(m && m.route.component === T.get('Planung'), '/planung soll Planung zeigen.'); T.ok((m.route.canMatch || []).includes(T.get('nurLeads')), 'canMatch: [nurLeads] fehlt.'); const a = T.inject(T.get('Auth')); a.rolle.set('dev'); T.eq(T.inCtx(() => T.get('nurLeads')({}, [])), false, 'Dev → false.'); a.rolle.set('lead'); T.eq(T.inCtx(() => T.get('nurLeads')({}, [])), true, 'Lead → true.'); } }
    ] },
  takeaway: ['children für Bereiche, title für den Tab.', 'Resolver: Daten vorher. canMatch: Route unsichtbar. canDeactivate: vor dem Gehen fragen.', 'Filter und Seite in die URL.', 'Guards schützen nur die Ansicht, der Server schützt die Daten.'],
  pairs: [
    ['<code>children</code>', 'Unterseiten eines Bereichs'],
    ['Resolver', 'Holt Daten, bevor die Seite erscheint'],
    ['<code>canMatch</code>', 'Die Route wird gar nicht erst gefunden'],
    ['<code>canDeactivate</code>', 'Fragt vor dem Verlassen nach'],
    ['Query-Parameter', 'Filter und Seite in der URL, der Link ist teilbar']
  ]
});

CH.push({
  id: 'n08', act: 6, title: 'Das Feedback-Formular', tag: 'Signal Forms · Regeln · submit', xp: 220,
  docs: [['Signal Forms im Überblick', 'https://angular.dev/guide/forms/signals/overview'], ['Validierung mit Signal Forms', 'https://angular.dev/guide/forms/signals/validation']],
  ticket: { id: 'PW-162', category: 'Feature', heading: 'Feedback nach dem Workshop', text: 'Nach jedem Workshop sollen Teilnehmer Feedback geben: Name, E-Mail und mindestens 20 Zeichen Text. Fehler erst zeigen, wenn man das Feld verlassen hat. Abgeschickt wird nur, wenn alles stimmt, sonst zeigt der Klick alle Fehler. Bitte mit Signal Forms, nicht mehr mit Reactive Forms.' },
  story: [
    ['leon', 'Der Kunde will nach jedem Workshop Feedback einsammeln. Bisher kommt das per Mail, und die Hälfte schreibt nur „war gut“.'],
    ['sara', 'Deshalb mindestens 20 Zeichen. Und keine roten Fehler, bevor jemand überhaupt angefangen hat zu tippen.'],
    ['toni', 'Das bauen wir mit Signal Forms. Das Formular ist dann einfach ein Signal mit deinen Daten, und die Regeln stehen an einer Stelle.'],
    ['du', 'Also kein FormGroup und kein FormControl mehr?'],
    ['toni', 'Genau. Du kennst Signals schon. Ein Formular ist jetzt nur noch: Daten, Regeln, und ein Feld pro Eingabe.']
  ],
  slides: [
    { t: 'Daten zuerst', say: 'Bei Signal Forms beginnst du mit den Daten, nicht mit dem Formular. Ein ganz normales Signal mit einem Objekt. form() baut daraus ein Feld pro Eigenschaft.', job: 'Weil die Daten ein normales Signal sind, kannst du sie überall benutzen: in computed(), zum Speichern, zum Vorbelegen beim Bearbeiten.',
      code: C`
import { form, FormField } from '@angular/forms/signals';

export class Feedback {
  daten = signal({ name: '', mail: '', text: '' });
  feedback = form(this.daten);
}

// Template (imports: [FormField])
<input [formField]="feedback.name" />
<input [formField]="feedback.mail" type="email" />
<textarea [formField]="feedback.text"></textarea>`,
      notes: [["signal({ name: ''", 'Die Daten. Tippt jemand, ändert sich genau dieses Signal.'], ['form(this.daten)', 'Baut den Feld-Baum: feedback.name, feedback.mail, feedback.text.'], ['[formField]', 'Verbindet ein Eingabefeld mit einem Feld. In beide Richtungen.'], ['imports: [FormField]', 'Die Direktive für [formField] muss in die Komponente importiert werden.']],
      pro: 'Bei Reactive Forms gab es zwei Wahrheiten: das FormGroup und deine Daten. Bei Signal Forms gibt es nur eine, das Signal. Das spart das ständige Hin- und Herkopieren.' },
    { t: 'Regeln an einer Stelle', say: 'Das zweite Argument von form() ist eine Funktion mit allen Regeln. Jede Regel bekommt das Feld und eine Fehlermeldung.', job: 'Im Review fragt Toni immer: Wo stehen die Regeln? Bei Signal Forms ist die Antwort einfach: hier, in dieser einen Funktion.',
      code: C`
feedback = form(this.daten, (f) => {
  required(f.name, { message: 'Bitte gib deinen Namen an.' });
  required(f.mail, { message: 'Bitte gib deine E-Mail an.' });
  email(f.mail, { message: 'Das ist keine gültige E-Mail.' });
  minLength(f.text, 20, { message: 'Bitte schreib mindestens 20 Zeichen.' });
});`,
      notes: [['(f) =>', 'f ist der Pfad zu den Feldern. f.name meint das Feld name.'], ['required', 'Pflichtfeld. Leerer Text zählt als fehlend.'], ['email', 'Prüft das Format, aber nur, wenn etwas drinsteht.'], ['minLength(f.text, 20', 'Mindestens 20 Zeichen.']],
      pro: 'Eigene Regeln schreibst du mit validate(f.feld, ({ value }) => ...). Gibt die Funktion einen Fehler zurück, ist das Feld ungültig. Mit applyWhen gelten Regeln nur unter einer Bedingung.' },
    { t: 'Zustand lesen und absenden', say: 'Ruf ein Feld auf, dann bekommst du seinen Zustand: value(), invalid(), touched(), errors(). Das ganze Formular kannst du genauso fragen. submit() markiert alles als berührt und führt deine Aktion nur aus, wenn alles gültig ist.', job: 'Fehler erst nach dem Verlassen des Felds zeigen ist der Standard in guten Formularen. Wer schon beim ersten Buchstaben rot sieht, bricht ab.',
      code: C`
@if (feedback.name().touched() && feedback.name().invalid()) {
  <p class="fehler">{{ feedback.name().errors()[0].message }}</p>
}
<button (click)="absenden()" [disabled]="feedback().submitting()">
  Absenden
</button>

absenden() {
  submit(this.feedback, async () => {
    this.gesendet.update(l => [...l, this.daten()]);
    this.daten.set({ name: '', mail: '', text: '' });
  });
}`,
      notes: [['feedback.name()', 'Das Feld aufrufen gibt seinen Zustand.'], ['touched()', 'Wird true, wenn man das Feld verlassen hat.'], ['errors()[0].message', 'Die Meldung aus der Regel.'], ['feedback().submitting()', 'true, solange die Aktion in submit() läuft. Nur dann ist der Knopf gesperrt, so klickt niemand doppelt.'], ['submit(', 'Markiert alle Felder als berührt, zeigt so alle Fehler und führt die Aktion nur aus, wenn alles gültig ist.']],
      pro: 'Sperr den Knopf nicht mit invalid(). Dann kann niemand klicken, submit() zeigt nie die Fehler, und ein gesperrter Knopf erklärt nicht, was fehlt. Kommt vom Server ein Fehler zurück (z. B. „E-Mail schon benutzt“), kann die Aktion in submit() ihn als Fehler zurückgeben. Er erscheint dann direkt am Feld.' }
  ],
  quiz: [
    { q: 'Wo stehen bei Signal Forms die Daten, die jemand eingetippt hat?', options: ['In einem FormGroup, das man mit getRawValue() ausliest', 'Im Signal, das man an form() gegeben hat', 'Nur im DOM, in den input-Elementen', 'In einem Service, den Angular automatisch anlegt'], correct: 1, why: 'Signal Forms schreibt direkt in dein Signal. Es gibt keine zweite Kopie der Daten.' },
    { q: 'Ein Fehler soll erst erscheinen, wenn man das Feld verlassen hat. Was prüfst du im Template?', options: ['feedback.name().dirty()', 'feedback.name().touched() && feedback.name().invalid()', 'feedback().valid()', 'feedback.name().value() === \'\''], correct: 1, why: 'touched() wird true, wenn man das Feld verlassen hat. Zusammen mit invalid() erscheint die Meldung erst dann.' },
    { q: 'Was macht <code>submit(this.feedback, aktion)</code>, wenn ein Feld ungültig ist?', options: ['Es führt die Aktion trotzdem aus', 'Es markiert alle Felder als berührt und führt die Aktion nicht aus', 'Es wirft einen Fehler in der Konsole', 'Es leert das Formular'], correct: 1, why: 'submit() markiert alles als berührt, damit alle Fehler sichtbar werden. Die Aktion läuft nur, wenn alles gültig ist.' }
  ],
  ex: { id: 'ex33', title: 'Feedback mit Signal Forms', goal: 'Bau das Feedback-Formular mit Signal Forms: Regeln an einer Stelle, Fehler erst nach dem Verlassen, abgeschickt wird nur, wenn alles stimmt.', preview: 'Feedback',
    todo: ['<code>feedback = form(this.daten, f =&gt; { ... })</code> mit den Regeln: Name und E-Mail Pflicht, E-Mail gültig, Text mindestens 20 Zeichen', 'Die drei Eingaben mit <code>[formField]</code> verbinden', 'Unter dem Namen: <code>&lt;p class="fehler"&gt;</code> nur, wenn das Feld berührt und ungültig ist', 'Knopf <code>absenden</code> nur gesperrt, solange gespeichert wird (<code>feedback().submitting()</code>). Bei Fehlern bleibt er klickbar.', '<code>absenden()</code> mit <code>submit()</code>: Daten in <code>gesendet</code> ablegen, danach Formular leeren'],
    starter: C`
import { Component, signal } from '@angular/core';
import { form, FormField, required, email, minLength, submit } from '@angular/forms/signals';

export interface Rueckmeldung { name: string; mail: string; text: string; }

@Component({
  selector: 'app-feedback',
  imports: [FormField],
  template: \`
    <label>Name <input class="name" /></label>
    <!-- Fehler für den Namen -->

    <label>E-Mail <input class="mail" type="email" /></label>
    <label>Feedback <textarea class="text"></textarea></label>

    <button class="absenden" (click)="absenden()">Absenden</button>
    <p class="anzahl">{{ gesendet().length }} Rückmeldungen</p>
  \`,
})
export class Feedback {
  daten = signal<Rueckmeldung>({ name: '', mail: '', text: '' });
  feedback = form(this.daten);
  gesendet = signal<Rueckmeldung[]>([]);

  absenden() {
    this.gesendet.update(l => [...l, this.daten()]);
  }
}
`,
    solution: C`
import { Component, signal } from '@angular/core';
import { form, FormField, required, email, minLength, submit } from '@angular/forms/signals';

export interface Rueckmeldung { name: string; mail: string; text: string; }

@Component({
  selector: 'app-feedback',
  imports: [FormField],
  template: \`
    <label>Name <input class="name" [formField]="feedback.name" /></label>
    @if (feedback.name().touched() && feedback.name().invalid()) {
      <p class="fehler">{{ feedback.name().errors()[0].message }}</p>
    }

    <label>E-Mail <input class="mail" type="email" [formField]="feedback.mail" /></label>
    <label>Feedback <textarea class="text" [formField]="feedback.text"></textarea></label>

    <button class="absenden" (click)="absenden()" [disabled]="feedback().submitting()">Absenden</button>
    <p class="anzahl">{{ gesendet().length }} Rückmeldungen</p>
  \`,
})
export class Feedback {
  daten = signal<Rueckmeldung>({ name: '', mail: '', text: '' });
  feedback = form(this.daten, (f) => {
    required(f.name, { message: 'Bitte gib deinen Namen an.' });
    required(f.mail, { message: 'Bitte gib deine E-Mail an.' });
    email(f.mail, { message: 'Das ist keine gültige E-Mail.' });
    minLength(f.text, 20, { message: 'Bitte schreib mindestens 20 Zeichen.' });
  });
  gesendet = signal<Rueckmeldung[]>([]);

  absenden() {
    submit(this.feedback, async () => {
      this.gesendet.update(l => [...l, this.daten()]);
      this.daten.set({ name: '', mail: '', text: '' });
    });
  }
}
`,
    notes: [['form(this.daten, (f) =>', 'Daten und Regeln an einer Stelle.'], ['minLength(f.text, 20', 'Gegen „war gut“.'], ['[formField]="feedback.name"', 'Eingabe und Feld sind verbunden.'], ['touched() && invalid()', 'Fehler erst nach dem Verlassen.'], ['[disabled]="feedback().submitting()"', 'Nicht wegen invalid sperren: submit() zeigt beim Klick alle Fehler. Gesperrt wird nur, solange gespeichert wird.'], ['submit(', 'Prüft alles, führt die Aktion nur bei gültigem Formular aus.'], ['this.daten.set(', 'Danach leer für die nächste Person.']],
    hints: ['Die Regeln: <code>form(this.daten, (f) =&gt; { required(f.name, { message: \'...\' }); ... })</code>', 'Im Template: <code>[formField]="feedback.name"</code>, und für den Fehler <code>@if (feedback.name().touched() &amp;&amp; feedback.name().invalid())</code>', 'In <code>absenden()</code>: <code>submit(this.feedback, async () =&gt; { ...; this.daten.set({ name: \'\', mail: \'\', text: \'\' }); });</code>', 'Der Knopf: <code>[disabled]="feedback().submitting()"</code>, nicht <code>invalid()</code>'],
    tests: [
      { name: 'Tippen schreibt in die Daten', run: async T => { const f = T.mount(T.cmp('Feedback')); await f.type('input.name', 'Lea'); await f.type('input.mail', 'lea@firma.de'); await f.type('textarea.text', 'Sehr verständlich erklärt.'); T.eq(f.instance.daten(), { name: 'Lea', mail: 'lea@firma.de', text: 'Sehr verständlich erklärt.' }, 'Was man tippt, soll in daten() landen. Sind alle drei Felder mit [formField] verbunden?'); } },
      { name: 'Die Regeln stimmen', run: T => { const f = T.mount(T.cmp('Feedback')); const fb = f.instance.feedback; T.ok(fb.name().invalid(), 'Ein leerer Name soll ungültig sein (required).'); f.instance.daten.set({ name: 'Lea', mail: 'lea', text: 'kurz' }); T.ok(fb.mail().invalid(), '„lea“ ist keine gültige E-Mail (email).'); T.ok(fb.text().invalid(), '„kurz“ hat weniger als 20 Zeichen (minLength).'); f.instance.daten.set({ name: 'Lea', mail: 'lea@firma.de', text: 'Sehr verständlich erklärt.' }); T.ok(fb().valid(), 'Mit Name, gültiger E-Mail und 20+ Zeichen soll das Formular gültig sein.'); } },
      { name: 'Fehler erst nach dem Verlassen', run: async T => { const f = T.mount(T.cmp('Feedback')); T.ok(!f.q('p.fehler'), 'Am Anfang soll noch kein Fehler da sein. Prüfst du touched()?'); f.q('input.name').dispatchEvent(new Event('blur')); await T.flush(); const p = f.q('p.fehler'); T.ok(p && p.textContent.trim().length > 0, 'Nach dem Verlassen des leeren Namens soll <p class="fehler"> mit der Meldung erscheinen.'); await f.type('input.name', 'Lea'); T.ok(!f.q('p.fehler'), 'Mit Namen soll der Fehler wieder verschwinden.'); } },
      { name: 'Klick bei Fehlern zeigt alle Fehler', run: async T => { const f = T.mount(T.cmp('Feedback')); T.ok(!f.q('button.absenden').disabled, 'Der Knopf soll auch bei leerem Formular klickbar sein. Sperr ihn nur während des Speicherns: [disabled]="feedback().submitting()".'); T.ok(!T.has(/\[disabled\]\s*=\s*"[^"]*invalid\(\)/), 'Sperr den Knopf nicht mit invalid(). submit() zeigt beim Klick die Fehler.'); await f.click('button.absenden'); await T.flush(20); T.ok(f.q('p.fehler'), 'Nach dem Klick auf Absenden soll der Fehler am Namen erscheinen. submit() markiert alle Felder als berührt.'); T.eq(f.instance.gesendet().length, 0, 'Ein ungültiges Formular darf nicht abgeschickt werden.'); } },
      { name: 'submit legt ab und leert das Formular', run: async T => { const f = T.mount(T.cmp('Feedback')); f.instance.absenden(); await T.flush(20); T.eq(f.instance.gesendet().length, 0, 'Ein ungültiges Formular darf nicht abgeschickt werden. Nimmst du submit()?'); f.instance.daten.set({ name: 'Lea', mail: 'lea@firma.de', text: 'Sehr verständlich erklärt.' }); f.instance.absenden(); await T.flush(20); T.eq(f.instance.gesendet().map(r => r.name), ['Lea'], 'Nach dem Absenden soll die Rückmeldung in gesendet() stehen.'); T.eq(f.instance.daten(), { name: '', mail: '', text: '' }, 'Danach sollen die Daten wieder leer sein.'); T.eq(f.text().includes('1 Rückmeldung'), true, 'Die Anzahl soll 1 zeigen.'); } }
    ] },
  takeaway: ['Signal Forms: erst die Daten als Signal, dann form(daten, regeln).', 'Regeln an einer Stelle: required, email, minLength, validate.', 'Feld aufrufen = Zustand: value(), invalid(), touched(), errors().', 'submit() zeigt alle Fehler und führt die Aktion nur bei gültigem Formular aus.'],
  pairs: [
    ['<code>form(daten, regeln)</code>', 'Baut aus einem Signal ein Feld pro Eigenschaft'],
    ['<code>required</code>', 'Regel: das Feld darf nicht leer sein'],
    ['<code>touched()</code>', 'Wurde das Feld schon angefasst?'],
    ['<code>errors()</code>', 'Die Fehler eines Felds'],
    ['<code>submit()</code>', 'Zeigt alle Fehler, führt nur gültig aus']
  ]
});
