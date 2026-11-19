/* ================= Phase: AGENTUR-ALLTAG =================
   Agentur-Alltag: Tests schreiben, Altcode migrieren, Build/CI/Deploy, Fehler app-weit,
   Auth mit Refresh, Speicherlecks finden, Code Reviews. */
ACTS.push({ n: 7, title: 'Agentur-Alltag', sub: 'Testing, Altcode, Build & CI, Fehler, Auth, Leaks, Code Review' });

/* Echte und absichtlich kaputte Versionen für „Die Generalprobe“ (Mutation Testing) */
const DEVELOPER_API = bug => ng => {
  const { Component, inject } = ng.core;
  const { HttpClient } = ng.modules['@angular/common/http'];
  const { toSignal } = ng.modules['@angular/core/rxjs-interop'];
  const { map } = window.rxjs.operators;
  class DeveloperApi {
    constructor() { this.http = inject(HttpClient); }
    alle() { return this.http.get(bug === 'url' ? '/api/entwickler/alle' : '/api/entwickler'); }
    frontendDevs() { return this.alle().pipe(map(l => l.filter(s => bug === 'filter' ? s.position !== 'Frontend' : s.position === 'Frontend'))); }
  }
  ng.core.Service()(DeveloperApi);
  class TeamCount { constructor() { this.anzahl = toSignal(inject(DeveloperApi).alle().pipe(map(l => l.length + (bug === 'zahl' ? 1 : 0))), { initialValue: 0 }); } }
  Component({ selector: 'app-team-zahl', template: '<p class="zahl">{{ anzahl() }} Entwickler</p>' })(TeamCount);
  return { EntwicklerApi: DeveloperApi, TeamZahl: TeamCount };
};
/* Hilfe für Interceptor-Tests: Anfrage durch den Interceptor schicken, next liefert Daten oder einen Fehler */
function viaInterceptor(T, name, opts) {
  const H = T.ng.modules['@angular/common/http'];
  const req = new H.HttpRequest(opts.method || 'GET', opts.url || '/api/entwickler');
  const calls = [];
  const next = r => { calls.push(r); return opts.next ? opts.next(r, H) : (opts.status == null ? T.rx.of('daten') : T.rx.throwError(() => new H.HttpErrorResponse({ status: opts.status, url: r.url }))); };
  return T.collect(T.inCtx(() => T.get(name)(req, next)), 300).then(r => Object.assign(r, { calls }));
}

CH.push({
  id: 't01', act: 7, title: 'Sicherheitsnetz aus Tests', tag: 'Testing in der Praxis · TestBed · HttpTestingController', xp: 240,
  docs: [['Testen von HTTP-Anfragen', 'https://angular.dev/guide/http/testing'], ['Services testen', 'https://angular.dev/guide/testing/services'], ['Komponenten-Harnesses nutzen', 'https://angular.dev/guide/testing/using-component-harnesses']],
  ticket: { id: 'PW-146', category: 'Bug', heading: 'Teamliste nach Release leer', text: 'Trotz zwei Stunden Klicktest war die Teamliste nach dem Release leer. Schreib Tests für EntwicklerApi und TeamZahl, die so etwas finden.' },
  story: [
    ['mia', 'Ich klicke vor jedem Release zwei Stunden durch die App. Und trotzdem war letzte Woche die Teamliste leer.'],
    ['toni', 'Weil kein Mensch bei jedem Release alles prüfen kann. Wir bauen ein Sicherheitsnetz, das in Sekunden läuft. Und du schreibst es selbst.']
  ],
  slides: [
    { t: 'Was teste ich überhaupt?', say: 'Wie ein Test aussieht, weißt du seit dem falschen Ranking. Im Alltag zählt die Frage: Was lohnt sich? Teste Verhalten, das Nutzer oder andere Teile sehen, nicht wie es innen gebaut ist.', job: 'Tests, die private Methoden oder interne Felder prüfen, gehen bei jedem Umbau kaputt, obwohl alles funktioniert. Prüf, was der Nutzer sieht oder was der Service zurückgibt.',
      points: [['Logik zuerst', 'Berechnungen, Filter, Validatoren, Stores: viele schnelle Unit-Tests.', 'plus'], ['Services mit HTTP', 'Richtige URL? Richtig umgeformt? Fehlerfall? Mit HttpTestingController.', 'plus'], ['Komponenten', 'Zeigt sie, was der Service liefert? Reagiert der Knopf? Service per DI faken.', 'plus'], ['Wenige E2E', 'Die 3 bis 5 wichtigsten Wege (Login, Kauf) mit Playwright im echten Browser.', ''], ['Nicht testen', 'Private Methoden, Angular selbst, CSS-Details. Das macht Tests zerbrechlich.', 'minus']],
      pro: 'Ein Test, der bei jedem Umbau rot wird, obwohl sich fürs Verhalten nichts ändert, testet die Implementierung. Das ist der Grund, warum Teams Tests hassen.' },
    { t: 'TestBed mit Fake-Service', say: 'TestBed kennst du schon als Mini-App für Tests. Neu ist: In providers tauschst du echte Teile gegen Fakes. Danke, Dependency Injection.', job: 'In fast jedem Firmen-Test steht oben ein providers-Block mit { provide: XService, useValue: fake }. Wer das lesen kann, versteht 80 % der Tests im Projekt.',
      code: C`
it('zeigt die Anzahl aus dem Service', async () => {
  TestBed.configureTestingModule({
    providers: [{ provide: EntwicklerApi, useValue: { alle: () => of([{}, {}, {}]) } }],
  });
  const fixture = TestBed.createComponent(TeamZahl);
  await fixture.whenStable();

  expect(fixture.nativeElement.textContent).toContain('3 Entwickler');
});`,
      notes: [['configureTestingModule', 'Die Mini-App für diesen Test einrichten.'], ['useValue: { alle:', 'Fake: gibt sofort drei Entwickler zurück. Kein Server.'], ['createComponent', 'Komponente bauen, mit dem Fake drin.'], ['whenStable', 'Warten, bis Angular fertig gemalt hat.'], ["toContain('3 Entwickler')", 'Prüft, was der Nutzer sieht.']],
      pro: 'Für Klicks und Material-Komponenten gibt es Component Harnesses (TestbedHarnessEnvironment): await button.click() statt querySelector. Die gehen nicht kaputt, wenn sich das HTML innen ändert.' },
    { t: 'HttpTestingController', say: 'Statt echtem Server fängt der Test jede Anfrage ab. Du sagst, welche Anfrage du erwartest, und antwortest selbst.', job: 'Mit HttpTestingController prüfst du genau die URL und die Methode. Ändert jemand aus Versehen /api/entwickler zu /api/entwickler/alle, wird der Test sofort rot.',
      code: C`
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  api = TestBed.inject(EntwicklerApi);
  http = TestBed.inject(HttpTestingController);
});

it('holt alle Entwickler', () => {
  let ergebnis: Entwickler[] = [];
  api.alle().subscribe(l => ergebnis = l);

  http.expectOne('/api/entwickler').flush([{ id: 1, name: 'Leon', position: 'Frontend' }]);

  expect(ergebnis.length).toBe(1);
});`,
      notes: [['provideHttpClientTesting', 'Ersetzt den echten Server durch einen Test-Server.'], ['TestBed.inject', 'Holt Service und Controller aus der Mini-App.'], ["expectOne('/api/entwickler')", 'Es muss GENAU eine Anfrage an diese URL geben. Sonst rot.'], ['flush(', 'Antwort schicken. Erst jetzt kommt ergebnis an.']],
      pro: 'Fehlerfall: req.flush(null, { status: 500, statusText: \'Fehler\' }). Am Ende http.verify(): Gibt es noch unerwartete Anfragen? E2E mit Playwright: await page.getByRole(\'button\', { name: \'Kaufen\' }).click().' }
  ],
  quiz: [
    { q: 'Wie ersetzt du im Test einen Service durch einen Fake?', options: ['Den Fake in imports der Komponente eintragen', 'Mit { provide: Service, useValue: fake } in den providers von TestBed', 'Mit provideHttpClientTesting()', 'Den Service im Test mit new selbst bauen'], correct: 1, why: 'Dependency Injection macht das Austauschen leicht. provideHttpClientTesting ersetzt nur den Server, nicht den Service.' },
    { q: 'Was macht der Aufruf http.expectOne(\'/api/entwickler\') beim HttpTestingController?', options: ['Er schickt eine Anfrage an den Test-Server', 'Er prüft, dass genau eine Anfrage an diese URL kam', 'Er prüft, dass mindestens eine Anfrage kam', 'Er antwortet automatisch mit leeren Daten'], correct: 1, why: 'Danach beantwortest du die abgefangene Anfrage selbst mit flush().' },
    { q: 'Woran erkennst du einen schlechten Test?', options: ['Er prüft sichtbares Verhalten', 'Er wird bei jedem Umbau rot, obwohl alles funktioniert', 'Er läuft in 5 ms', 'Er hat einen klaren Namen'], correct: 1, why: 'So ein Test prüft, wie der Code innen gebaut ist, statt was er tut.' }
  ],
  ex: { id: 'ext1', title: 'Sicherheitsnetz aus Tests', goal: 'Schreib Tests für <code>EntwicklerApi</code> und <code>TeamZahl</code>. Danach baue ich drei Fehler ein. Deine Tests müssen alle finden.',
    modules: { './entwickler-api': DEVELOPER_API(null) },
    todo: ['<code>alle()</code> holt <code>/api/entwickler</code>: mit <code>expectOne</code> und <code>flush</code> testen', '<code>frontendDevs()</code> liefert nur Entwickler mit <code>position: \'Frontend\'</code>', '<code>TeamZahl</code> zeigt „3 Entwickler“, wenn der (Fake-)Service drei liefert', 'Alle Tests grün, und sie finden 3 eingebaute Fehler'],
    starter: C`
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { EntwicklerApi, TeamZahl } from './entwickler-api';

describe('EntwicklerApi', () => {
  let api: EntwicklerApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(EntwicklerApi);
    http = TestBed.inject(HttpTestingController);
  });

  it('holt alle Entwickler von /api/entwickler', () => {
    let ergebnis: any[] = [];
    api.alle().subscribe(l => ergebnis = l);
    http.expectOne('/api/entwickler').flush([{ id: 1, name: 'Leon', position: 'Frontend' }]);
    expect(ergebnis.length).toBe(1);
  });

  // Test für frontendDevs(): Leon (Frontend) und Mo (Fullstack) liefern, nur Leon erwarten
});

describe('TeamZahl', () => {
  // Fake-EntwicklerApi per useValue, Komponente bauen, „3 Entwickler“ erwarten
});
`,
    solution: C`
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { EntwicklerApi, TeamZahl } from './entwickler-api';

describe('EntwicklerApi', () => {
  let api: EntwicklerApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(EntwicklerApi);
    http = TestBed.inject(HttpTestingController);
  });

  it('holt alle Entwickler von /api/entwickler', () => {
    let ergebnis: any[] = [];
    api.alle().subscribe(l => ergebnis = l);
    http.expectOne('/api/entwickler').flush([{ id: 1, name: 'Leon', position: 'Frontend' }]);
    expect(ergebnis.length).toBe(1);
  });

  it('frontendDevs() liefert nur Frontend-Devs', () => {
    let ergebnis: any[] = [];
    api.frontendDevs().subscribe(l => ergebnis = l);
    http.expectOne('/api/entwickler').flush([
      { id: 1, name: 'Leon', position: 'Frontend' },
      { id: 2, name: 'Mo', position: 'Fullstack' },
    ]);
    expect(ergebnis.map(s => s.name)).toEqual(['Leon']);
  });
});

describe('TeamZahl', () => {
  it('zeigt die Anzahl aus dem Service', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: EntwicklerApi, useValue: { alle: () => of([{}, {}, {}]) } }],
    });
    const fixture = TestBed.createComponent(TeamZahl);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('3 Entwickler');
  });
});
`,
    notes: [['api.frontendDevs().subscribe', 'Erst abonnieren, dann antworten.'], ["position: 'Fullstack'", 'Ein Nicht-Frontend-Dev, damit der Filter etwas zu tun hat.'], ["toEqual(['Leon'])", 'Genau Leon, sonst nichts.'], ['useValue: { alle: () => of([{}, {}, {}]) }', 'Fake-Service mit drei Entwicklern.'], ['TestBed.createComponent(TeamZahl)', 'Komponente mit dem Fake bauen.'], ["toContain('3 Entwickler')", 'Prüft, was man sieht.']],
    hints: ['frontendDevs: wie der erste Test, aber mit zwei Entwicklern und <code>expect(ergebnis.map(s =&gt; s.name)).toEqual([\'Leon\'])</code>', 'Komponente: <code>TestBed.configureTestingModule({ providers: [{ provide: EntwicklerApi, useValue: { alle: () =&gt; of([{}, {}, {}]) } }] })</code>', 'Dann <code>const fixture = TestBed.createComponent(TeamZahl); await fixture.whenStable();</code>'],
    tests: [
      { name: 'Mindestens 3 Tests', run: async T => { const r = await T.suite({ './entwickler-api': DEVELOPER_API(null) }); T.ok(r.total >= 3, 'Ich finde erst ' + r.total + ' Tests. Es braucht welche für alle(), frontendDevs() und TeamZahl.'); } },
      { name: 'Alle grün mit dem echten Code', run: async T => { const r = await T.suite({ './entwickler-api': DEVELOPER_API(null) }); T.ok(r.total > 0 && !r.failed.length, 'Mit dem RICHTIGEN Code rot: ' + r.failed.map(f => '„' + f.name + '“ (' + f.msg + ')').join(', ')); } },
      { name: 'Benutzt TestBed und HttpTestingController', run: T => { T.ok(T.has(/expectOne\s*\(/) && T.has(/\.flush\s*\(/), 'Antworte mit http.expectOne(...).flush(...).'); T.ok(T.has(/TestBed\.createComponent\s*\(\s*TeamZahl/), 'Teste TeamZahl mit TestBed.createComponent(TeamZahl).'); T.ok(T.has(/provide\s*:\s*EntwicklerApi/), 'Fake die EntwicklerApi für die Komponente: { provide: EntwicklerApi, useValue: … }.'); } },
      { name: 'Fehler 1 gefunden: falsche URL', run: async T => { const r = await T.suite({ './entwickler-api': DEVELOPER_API('url') }); T.ok(r.failed.length > 0, 'Ich rufe jetzt /api/entwickler/alle auf, und alles bleibt grün. Prüf die URL mit expectOne(\'/api/entwickler\').'); } },
      { name: 'Fehler 2 gefunden: Filter verdreht', run: async T => { const r = await T.suite({ './entwickler-api': DEVELOPER_API('filter') }); T.ok(r.failed.length > 0, 'frontendDevs() liefert jetzt alle AUSSER Frontend-Devs. Keiner deiner Tests merkt es.'); } },
      { name: 'Fehler 3 gefunden: Komponente zählt falsch', run: async T => { const r = await T.suite({ './entwickler-api': DEVELOPER_API('zahl') }); T.ok(r.failed.length > 0, 'TeamZahl zeigt jetzt eins zu viel. Teste die Komponente mit einem Fake-Service.'); } }
    ] },
  takeaway: ['Verhalten testen, nicht Implementierung.', 'TestBed + providers: echte Teile gegen Fakes tauschen.', 'HttpTestingController: expectOne, flush, verify.', 'Wenige E2E-Tests für die wichtigsten Wege.'],
  pairs: [
    ['TestBed + providers', 'Echte Teile gegen Fakes tauschen'],
    ['HttpTestingController', 'Fängt Anfragen ab, du antwortest selbst'],
    ['<code>expectOne</code>', 'Genau diese eine Anfrage wird erwartet'],
    ['<code>flush</code>', 'Schickt die Antwort auf die Anfrage'],
    ['<code>verify</code>', 'Prüft, dass keine Anfrage offen blieb']
  ]
});

CH.push({
  id: 't02', act: 7, title: 'Der alte Kundenshop', tag: 'Altcode lesen & migrieren', xp: 240,
  docs: [['Migrationen im Überblick', 'https://angular.dev/reference/migrations'], ['Angular aktuell halten', 'https://angular.dev/update'], ['Befehl ng update', 'https://angular.dev/cli/update']],
  ticket: { id: 'PW-147', category: 'Tech-Debt', heading: 'Alten Kundenshop migrieren', text: 'Der Shop eines Bestandskunden ist von 2019: Angular 8, NgModules, *ngIf, Constructor-Injection. Migriere eine Komponente auf modernes Angular, ohne das Verhalten zu ändern.' },
  story: [
    ['erz', 'Neues Projekt für dich: der Shop eines Bestandskunden. Geschrieben 2019 von einer anderen Agentur, seitdem kaum angefasst.'],
    ['du', 'Das sieht ja ganz anders aus als alles, was ich gelernt habe!'],
    ['toni', 'Willkommen in der Wirklichkeit. Die meisten Firmen-Apps sind älter als ihr Code-Stil. Lesen ist Pflicht. Migrieren macht dich zum Senior.']
  ],
  slides: [
    { t: 'Alt → Neu: die Übersetzung', say: 'Fast jedes alte Muster hat einen modernen Nachfolger. Lern beide Spalten.', job: 'In Bewerbungsgesprächen kommt oft: „Wir haben eine Angular-14-App. Wie würden Sie migrieren?“ Wer beide Spalten kennt, kann sofort konkret antworten.',
      points: [['@NgModule({ declarations })', '→ standalone, imports direkt in der Komponente', ''], ['*ngIf / *ngFor / [ngSwitch]', '→ @if / @for (mit track) / @switch', ''], ['@Input() / @Output() + EventEmitter', '→ input() / output() / model()', ''], ['constructor(private s: S)', '→ s = inject(S)', ''], ['@Injectable({ providedIn: \'root\' })', '→ @Service() (seit v22, gleiche Wirkung: ein Objekt für die ganze App)', ''], ['BehaviorSubject als Zustand', '→ signal() + computed()', ''], ['ngOnChanges, ngOnInit-Laden', '→ computed, effect, resource', ''], ['Klassen-Guards (implements CanActivate)', '→ CanActivateFn', ''], ['Zone.js, ChangeDetectorRef.markForCheck', '→ Zoneless + Signals', ''], ['Karma/Jasmine', '→ Vitest', '']],
      pro: 'Alter Code ist nicht falsch. Er läuft. Migration kostet Zeit und Risiko. Ein Senior fragt zuerst: Was bringt es? Wo tut es weh?' },
    { t: 'Schritt für Schritt mit Werkzeugen', say: 'Nie alles auf einmal. Erst die Version heben, dann Muster für Muster umbauen. Jeder Schritt einzeln testbar und einzeln mergebar.', job: 'ng update hebt die Version, die Angular-Schematics bauen vieles automatisch um (z. B. ng generate @angular/core:control-flow). Ein PR pro Schritt ist im Review viel leichter als ein Riesen-PR.',
      code: C`
ng update @angular/core@20 @angular/cli@20   # eine Hauptversion pro Schritt
ng update @angular/core@21 @angular/cli@21
ng update @angular/core@22 @angular/cli@22   # setzt bei Bedarf Eager und strictTemplates: false

ng generate @angular/core:standalone           # NgModules auflösen
ng generate @angular/core:control-flow         # *ngIf → @if
ng generate @angular/core:inject               # constructor → inject()
ng generate @angular/core:signal-input-migration
ng generate @angular/core:output-migration
ng generate @angular/core:signal-queries-migration`,
      notes: [['ng update', 'Hebt die Version und führt automatische Umbauten aus.'], ['@angular/core@20', 'Nie Versionen überspringen.'], [':standalone', 'Macht Komponenten standalone und räumt Module ab.'], [':control-flow', 'Neue Template-Syntax.'], [':inject', 'Konstruktor-Parameter werden zu inject().'], [':signal-input-migration', '@Input → input().']],
      pro: 'Reihenfolge, die in Firmen funktioniert: 1. Tests und CI grün. 2. ng update Version für Version. 3. Pro Schematic ein eigener PR. 4. Neuer Code nur noch modern („Pfadfinder-Regel“). 5. Zoneless erst, wenn alles Signals nutzt.' },
    { t: 'Was du im Altcode noch triffst', say: 'Ein paar Dinge, die du kennen musst, auch wenn du sie selbst nicht mehr schreibst.', job: 'NgModule, @Input()-Dekoratoren und async-Pipe triffst du in fast jedem Projekt, das älter als zwei Jahre ist. Du musst sie nicht mögen, aber du musst sie lesen können.',
      points: [['NgZone.runOutsideAngular', 'Code ohne Change Detection laufen lassen (Performance-Trick aus der Zone-Zeit).', ''], ['ChangeDetectorRef.detectChanges', 'Per Hand neu zeichnen. Oft ein Zeichen für ein Design-Problem.', 'minus'], ['APP_INITIALIZER', 'Heute provideAppInitializer(() => …).', ''], ['entryComponents, ViewEngine', 'Seit Ivy (v9) überflüssig, ViewEngine ist seit v13 ganz entfernt. Kann weg.', ''], ['@ngrx/store mit Actions/Reducern', 'Funktioniert weiter. Neue Features oft mit SignalStore.', '']],
      pro: 'Im Interview beliebt: „Wie würdest du eine Angular-12-App auf 22 bringen?“ Gute Antwort: Plan in Schritten, Risiken, Tests, kein Big Bang, Zahlen (Bundle, Build-Zeit) vorher und nachher.' }
  ],
  quiz: [
    { q: 'Du sollst eine App von Angular 15 auf Angular 22 bringen. Wie gehst du vor?', options: ['Direkt in einem Schritt auf 22 springen', 'Mit ng update Version für Version, mit Tests nach jedem Schritt', 'Die App neu schreiben', 'Die Versionen in der package.json von Hand ändern'], correct: 1, why: 'Jede Version bringt eigene Migrationen mit, die ng update ausführt.' },
    { q: 'Was ist die moderne Schreibweise für *ngFor="let s of liste"?', options: ['@each', '@for (s of liste; track s.id)', 'ngRepeat', 'map()'], correct: 1, why: 'Bei @for ist track Pflicht.' },
    { q: 'Welches Schematic baut constructor(private s: S) automatisch auf inject() um?', options: ['@angular/core:standalone', '@angular/core:inject', '@angular/core:control-flow', '@angular/core:zoneless'], correct: 1, why: 'Der Befehl lautet ng generate @angular/core:inject.' }
  ],
  ex: { id: 'ext2', title: 'Der alte Kundenshop', goal: 'Migriere den Altcode auf modernes Angular. Das Verhalten muss gleich bleiben.', preview: 'TeamListe',
    todo: ['Kein <code>@NgModule</code> mehr: <code>TeamListe</code> importiert <code>EntwicklerZeile</code> direkt', '<code>*ngIf</code> → <code>@if</code>, <code>*ngFor</code> → <code>@for</code> mit <code>track</code>', '<code>@Input</code>/<code>@Output</code>/<code>EventEmitter</code> → <code>input.required()</code>/<code>output()</code>', '<code>constructor(public team: …)</code> → <code>inject()</code>, <code>@Injectable({ providedIn: \'root\' })</code> → <code>@Service()</code>', '<code>TeamService.entwickler</code> und <code>auswahl</code> werden Signals', 'Kranke bleiben unsichtbar, Klick zeigt die id'],
    starter: C`
import { Component, Input, Output, EventEmitter, NgModule, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class TeamService {
  entwickler = [
    { id: 1, name: 'Leon', krank: false },
    { id: 2, name: 'Mo', krank: true },
    { id: 3, name: 'Ben', krank: false },
  ];
}

@Component({
  selector: 'app-entwickler-zeile',
  standalone: false,
  template: \`
    <li *ngIf="!entwickler.krank" (click)="gewaehlt.emit(entwickler.id)">{{ entwickler.name }}</li>
  \`,
})
export class EntwicklerZeile {
  @Input() entwickler!: { id: number; name: string; krank: boolean };
  @Output() gewaehlt = new EventEmitter<number>();
}

@Component({
  selector: 'app-team-liste',
  standalone: false,
  template: \`
    <ul>
      <app-entwickler-zeile *ngFor="let s of team.entwickler" [entwickler]="s" (gewaehlt)="waehlen($event)" />
    </ul>
    <p class="auswahl">{{ auswahl }}</p>
  \`,
})
export class TeamListe {
  auswahl: number | null = null;
  constructor(public team: TeamService) {}
  waehlen(id: number) { this.auswahl = id; }
}

@NgModule({
  declarations: [EntwicklerZeile, TeamListe],
  imports: [CommonModule],
  exports: [TeamListe],
})
export class TeamModule {}
`,
    solution: C`
import { Component, Service, inject, input, output, signal } from '@angular/core';

interface Entwickler { id: number; name: string; krank: boolean; }

@Service()
export class TeamService {
  entwickler = signal<Entwickler[]>([
    { id: 1, name: 'Leon', krank: false },
    { id: 2, name: 'Mo', krank: true },
    { id: 3, name: 'Ben', krank: false },
  ]);
}

@Component({
  selector: 'app-entwickler-zeile',
  template: \`
    @if (!entwickler().krank) {
      <li (click)="gewaehlt.emit(entwickler().id)">{{ entwickler().name }}</li>
    }
  \`,
})
export class EntwicklerZeile {
  entwickler = input.required<Entwickler>();
  gewaehlt = output<number>();
}

@Component({
  selector: 'app-team-liste',
  imports: [EntwicklerZeile],
  template: \`
    <ul>
      @for (s of team.entwickler(); track s.id) {
        <app-entwickler-zeile [entwickler]="s" (gewaehlt)="waehlen($event)" />
      }
    </ul>
    <p class="auswahl">{{ auswahl() }}</p>
  \`,
})
export class TeamListe {
  team = inject(TeamService);
  auswahl = signal<number | null>(null);
  waehlen(id: number) { this.auswahl.set(id); }
}
`,
    notes: [['@Service()', 'Statt @Injectable({ providedIn: \'root\' }). Wirkt genauso: ein Objekt für die ganze App.'], ['signal<Entwickler[]>', 'Zustand im Service als Signal.'], ['@if (!entwickler().krank)', 'Statt *ngIf. Input mit () lesen.'], ['input.required<Entwickler>()', 'Statt @Input() entwickler!.'], ['output<number>()', 'Statt @Output() + EventEmitter.'], ['imports: [EntwicklerZeile]', 'Statt declarations im NgModule.'], ['@for (s of team.entwickler(); track s.id)', 'Statt *ngFor, mit track.'], ['inject(TeamService)', 'Statt Konstruktor-Parameter.'], ['auswahl = signal', 'Damit die Anzeige zoneless aktualisiert.']],
    hints: ['Erst das NgModule löschen und in TeamListe <code>imports: [EntwicklerZeile]</code> eintragen.', 'EntwicklerZeile: <code>entwickler = input.required&lt;Entwickler&gt;(); gewaehlt = output&lt;number&gt;();</code> und im Template <code>entwickler().name</code>', 'TeamListe: <code>team = inject(TeamService); auswahl = signal&lt;number | null&gt;(null);</code>'],
    tests: [
      { name: 'Nur fitte Entwickler sichtbar', run: T => { const f = T.mount(T.cmp('TeamListe')); T.eq(f.qa('li').map(l => l.textContent.trim()), ['Leon', 'Ben'], 'Leon und Ben, Mo ist krank.'); } },
      { name: 'Klick wählt aus', run: async T => { const f = T.mount(T.cmp('TeamListe')); await f.click(f.qa('li')[1]); T.eq(f.q('.auswahl').textContent.trim(), '3', 'Klick auf Ben soll 3 anzeigen.'); } },
      { name: 'Kein NgModule mehr', run: T => { T.ok(!T.has(/@NgModule/) && !T.has(/declarations\s*:/), 'Lösch das NgModule. Standalone-Komponenten brauchen es nicht.'); T.ok(T.has(/imports\s*:\s*\[\s*EntwicklerZeile\s*\]/), 'TeamListe braucht imports: [EntwicklerZeile].'); } },
      { name: 'Neue Template-Syntax', run: T => { T.ok(!T.has(/\*ng(If|For)/), '*ngIf und *ngFor raus.'); T.ok(T.has(/@if\s*\(/) && T.has(/@for\s*\(.*;\s*track/), '@if und @for (… ; track s.id) benutzen.'); } },
      { name: 'input()/output() statt Decorators', run: T => { T.ok(!T.has(/@Input|@Output|EventEmitter/), '@Input, @Output und EventEmitter raus.'); T.ok(T.has(/input\.required\s*</) && T.has(/output\s*</), 'input.required<Entwickler>() und output<number>() benutzen.'); } },
      { name: 'inject() und Signals', run: T => { T.ok(!T.has(/constructor\s*\(\s*(public|private|protected)/), 'Kein Konstruktor-Parameter mehr: team = inject(TeamService).'); T.ok(!T.has(/@Injectable/) && T.has(/@Service\s*\(/), 'TeamService: @Service() statt @Injectable({ providedIn: \'root\' }).'); const f = T.mount(T.cmp('TeamListe')); T.ok(T.isSignal(f.instance.auswahl), 'auswahl soll ein Signal sein.'); T.ok(T.isSignal(T.inject(T.get('TeamService')).entwickler), 'TeamService.entwickler soll ein Signal sein.'); } }
    ] },
  takeaway: ['Altcode lesen: NgModule, *ngIf, @Input, Konstruktor-DI, Zone.js.', 'ng update Version für Version, dann Schematics, je ein PR.', 'Erst Tests, dann migrieren. Kein Big Bang.', 'Erst fragen: Was bringt die Migration?'],
  pairs: [
    ['<code>@NgModule</code>', 'Heute standalone, imports in der Komponente'],
    ['<code>*ngFor</code>', 'Heute @for mit track'],
    ['<code>@Output()</code> + EventEmitter', 'Heute output()'],
    ['Konstruktor-DI', 'Heute inject()'],
    ['<code>ng update</code>', 'Hebt die Version, eine nach der anderen']
  ]
});

CH.push({
  id: 't03', act: 7, title: 'Einmal bauen, überall live', tag: 'Build · Konfiguration · CI · Deploy', xp: 240,
  docs: [['Apps bauen mit ng build und Budgets', 'https://angular.dev/tools/cli/build'], ['Deployment und Fallback auf index.html', 'https://angular.dev/tools/cli/deployment'], ['provideAppInitializer', 'https://angular.dev/api/core/provideAppInitializer']],
  ticket: { id: 'PW-148', category: 'Bug', heading: 'Alte Version nach Release', text: 'Für Test, Abnahme und Produktion wird jedes Mal neu gebaut. Nach Releases sehen Kunden tagelang die alte Version. Einmal bauen, überall ausliefern.' },
  story: [
    ['jonas', 'Wir bauen die App für Test, Abnahme und Prod jeweils neu. Und auf Prod läuft dann doch was anderes als auf Test.'],
    ['boss', 'Und nach jedem Release sehen unsere Kunden tagelang die alte Version. Das gibt böse Anrufe.'],
    ['toni', 'Zwei klassische Fehler. Lösung: einmal bauen, überall dasselbe Paket ausliefern. Und richtig cachen.']
  ],
  slides: [
    { t: 'angular.json & ng build', say: 'angular.json steuert, wie gebaut wird. configurations sind Varianten, budgets sind Warnschwellen für die Größe.', job: 'Schlägt ein budget im Build an, hat jemand eine große Bibliothek eingebaut. Das ist ein gutes Signal, bevor die App für alle langsamer wird.',
      code: C`
"architect": {
  "build": {
    "builder": "@angular/build:application",
    "configurations": {
      "production": {
        "budgets": [
          { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" }
        ],
        "outputHashing": "all"
      },
      "development": { "optimization": false, "sourceMap": true }
    }
  }
}`,
      notes: [['@angular/build:application', 'Der moderne Builder (esbuild + Vite). Viel schneller als das alte webpack.'], ['budgets', 'Wird das Start-Bundle zu groß, warnt oder bricht der Build.'], ['outputHashing', 'Hängt den Fingerabdruck an Dateinamen: main-AB12CD34.js.'], ['sourceMap', 'Damit man im Browser den echten TypeScript-Code sieht.']],
      pro: 'ng build --configuration production landet in dist/<app>/browser. Mit fileReplacements tauscht man environment.ts pro Konfiguration. Aber: Pro Umgebung neu bauen ist ein Anti-Muster, siehe nächste Folie.' },
    { t: 'Einmal bauen, überall ausliefern', say: 'Das gleiche Paket geht auf Test, Abnahme und Produktion. Nur eine kleine config.json ist pro Server anders. Die App lädt sie beim Start.', job: 'Die Regel „Was getestet wurde, geht auch live“ klappt nur, wenn es dasselbe Paket ist. Darum lädt die App die Server-Adresse aus einer config.json, statt sie beim Build einzubacken.',
      code: C`
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAppInitializer(() => inject(KonfigService).laden()),
  ],
};

async laden() {
  this.daten.set(await firstValueFrom(this.http.get<Konfig>('/config.json')));
}`,
      notes: [['provideAppInitializer', 'Die App startet erst, wenn diese Funktion fertig ist (Promise).'], ["'/config.json'", 'Liegt neben index.html. Pro Server eine andere Datei.'], ['firstValueFrom', 'Observable → Promise mit dem ersten Wert.']],
      pro: 'Vorteil: Was getestet wurde, geht 1:1 in Produktion. Kein „auf Abnahme lief es noch“. Geheimnisse gehören trotzdem NICHT in config.json, die ist öffentlich.' },
    { t: 'CI: jeder PR wird geprüft', say: 'Bei jedem Push baut ein Server die App, prüft den Code-Stil, lässt die Tests laufen. Rot = kein Merge.', job: 'Bei GitHub Actions oder GitLab CI steht die Pipeline in einer YAML-Datei im Repo. Lint, Test, Build: Schlägt ein Schritt fehl, ist der PR blockiert.',
      code: C`
# .github/workflows/ci.yml
on: [pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --watch=false
      - run: npm run build`,
      notes: [['on: [pull_request]', 'Läuft bei jedem Pull Request.'], ['cache: npm', 'npm-Download-Cache: schneller.'], ['npm ci', 'Exakt die Versionen aus dem Lockfile. Nie npm install in CI.'], ['npm run lint', 'ESLint mit angular-eslint: Stil und typische Fehler.'], ['--watch=false', 'Tests einmal laufen lassen, nicht warten.'], ['npm run build', 'Baut es überhaupt? Budgets eingehalten?']],
      pro: 'In großen Monorepos: nx affected -t lint test build prüft nur, was der PR wirklich berührt. Dazu Prettier fürs Format und ein Pre-Commit-Hook (husky + lint-staged), damit Kleinkram gar nicht erst im PR landet.' },
    { t: 'Ausliefern: SPA-Fallback & Caching', say: 'Zwei Regeln, die jede Angular-App auf dem Server braucht. Sonst gibt es 404 beim Neuladen oder alte Versionen.', job: 'Lädt man /team/9 neu und bekommt 404, fehlt auf dem Server die Regel „alles auf index.html“. Das ist eins der häufigsten Tickets nach dem ersten Deployment.',
      code: C`
# nginx
location / {
  try_files $uri $uri/ /index.html;     # SPA-Fallback
}
location = /index.html {
  add_header Cache-Control "no-cache";
}
location ~* "-[A-Z0-9]{8,}\.(js|css)$" {
  add_header Cache-Control "public, max-age=31536000, immutable";
}`,
      notes: [['try_files', 'Gibt es /team/9 nicht als Datei? Dann index.html. Der Angular-Router übernimmt.'], ['no-cache', 'index.html immer frisch prüfen. Sie zeigt auf die neuen Dateinamen.'], ['immutable', 'Dateien mit Fingerabdruck ändern sich nie. Ein Jahr cachen.']],
      pro: 'Ohne SPA-Fallback: Klick in der App funktioniert, Neuladen oder geteilter Link auf /team/9 gibt 404. Klassiker im ersten Release. Oft steckt das in einem Docker-Image: erst node zum Bauen, dann nginx zum Ausliefern (Multi-Stage-Build).' }
  ],
  quiz: [
    { q: 'Warum sollte man die App nicht für jede Umgebung (Test, Abnahme, Produktion) neu bauen?', options: ['Weil jeder Build das Bundle größer macht', 'Weil dann ein anderes Paket getestet wird als das, das live geht', 'Weil environment.ts nur einmal gelesen wird', 'Weil Budgets dann nicht greifen'], correct: 1, why: 'Besser baust du einmal und lädst die Konfiguration zur Laufzeit.' },
    { q: 'Wer die Seite /team/9 im Browser neu lädt, bekommt vom Server einen 404. Was fehlt?', options: ['Ein Guard', 'Der SPA-Fallback auf index.html', 'Die Route in app.routes.ts', 'Ein Interceptor'], correct: 1, why: 'Der Server kennt nur echte Dateien und muss für alle anderen Pfade die index.html ausliefern. Die Route selbst existiert: Ein Klick in der App funktioniert ja.' },
    { q: 'Mit welchem Befehl installierst du in der CI die Pakete?', options: ['npm install', 'npm ci', 'npm update', 'npm audit fix --force'], correct: 1, why: 'npm ci installiert exakt die Versionen aus dem Lockfile.' }
  ],
  ex: { id: 'ext3', title: 'Einmal bauen, überall live', goal: 'Lade die Konfiguration beim Start, setz die richtigen Cache-Regeln und plane die CI.',
    todo: ['<code>KonfigService.laden()</code> holt <code>/config.json</code> und merkt sie sich', '<code>apiUrl</code> (computed) und <code>hat(feature)</code> lesen daraus', '<code>appConfig</code>: <code>provideAppInitializer(() =&gt; inject(KonfigService).laden())</code>', '<code>cacheRegel(datei)</code>: <code>index.html</code> und <code>config.json</code> → <code>no-cache</code>, Dateien mit Fingerabdruck (<code>main-AB12CD34.js</code>) → <code>public, max-age=31536000, immutable</code>', '<code>ciSchritte</code>: <code>npm ci</code>, dann lint, test, build'],
    starter: C`
import { Service, ApplicationConfig, inject, signal, computed, provideAppInitializer } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Konfig { apiUrl: string; features: string[]; }

@Service()
export class KonfigService {
  private http = inject(HttpClient);
  private daten = signal<Konfig | null>(null);

  readonly apiUrl = computed(() => '');
  hat(feature: string) { return false; }

  async laden() {}
}

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient()],
};

export function cacheRegel(datei: string): string {
  return '';
}

export const ciSchritte: string[] = [];
`,
    solution: C`
import { Service, ApplicationConfig, inject, signal, computed, provideAppInitializer } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Konfig { apiUrl: string; features: string[]; }

@Service()
export class KonfigService {
  private http = inject(HttpClient);
  private daten = signal<Konfig | null>(null);

  readonly apiUrl = computed(() => this.daten()?.apiUrl ?? '');
  hat(feature: string) { return this.daten()?.features.includes(feature) ?? false; }

  async laden() {
    this.daten.set(await firstValueFrom(this.http.get<Konfig>('/config.json')));
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAppInitializer(() => inject(KonfigService).laden()),
  ],
};

export function cacheRegel(datei: string): string {
  if (datei === 'index.html' || datei === 'config.json') return 'no-cache';
  if (/-[A-Za-z0-9]{8,}\.(js|css)$/.test(datei)) return 'public, max-age=31536000, immutable';
  return 'no-cache';
}

export const ciSchritte: string[] = ['npm ci', 'npm run lint', 'npm test', 'npm run build'];
`,
    notes: [["this.daten()?.apiUrl ?? ''", 'Noch nicht geladen? Leerer Text.'], ['firstValueFrom(', 'Auf die Antwort warten wie bei einem Promise.'], ['provideAppInitializer', 'Die App startet erst nach laden().'], ["'no-cache'", 'Immer beim Server nachfragen.'], ['/-[A-Za-z0-9]{8,}\\.(js|css)$/', 'Erkennt den Fingerabdruck im Namen.'], ["'npm ci'", 'Zuerst exakt installieren.']],
    hints: ['laden: <code>this.daten.set(await firstValueFrom(this.http.get&lt;Konfig&gt;(\'/config.json\')));</code>', 'apiUrl: <code>computed(() =&gt; this.daten()?.apiUrl ?? \'\')</code>', 'Fingerabdruck: <code>/-[A-Za-z0-9]{8,}\\.(js|css)$/.test(datei)</code>'],
    tests: [
      { name: 'Konfig kommt vom Server', run: async T => { T.ng.backend.routes['GET /config.json'] = { apiUrl: 'https://api.pixelwerk.de', features: ['tickets'] }; const k = T.inject(T.get('KonfigService')); T.eq(k.apiUrl(), '', 'Vor dem Laden soll apiUrl leer sein.'); await k.laden(); T.eq(k.apiUrl(), 'https://api.pixelwerk.de', 'Nach laden() soll apiUrl aus /config.json kommen.'); T.ok(k.hat('tickets') === true && k.hat('shop') === false, 'hat(\'tickets\') → true, hat(\'shop\') → false.'); } },
      { name: 'App wartet beim Start auf die Konfig', run: async T => { T.ng.backend.routes['GET /config.json'] = { apiUrl: 'https://test.pixelwerk.de', features: [] }; const env = new T.ng.Injector(null, T.get('appConfig').providers || []); const inits = env.get(T.ng.core.APP_INITIALIZER, []); T.ok(inits.length > 0, 'In appConfig.providers fehlt provideAppInitializer(() => inject(KonfigService).laden()).'); const st = env.get(T.ng.core.ApplicationInitStatus); st.runInitializers(); await st.donePromise; T.eq(env.get(T.get('KonfigService')).apiUrl(), 'https://test.pixelwerk.de', 'Der Initializer soll KonfigService.laden() aufrufen und das Promise zurückgeben.'); } },
      { name: 'index.html und config.json nie lange cachen', run: T => { const c = T.get('cacheRegel'); T.eq(c('index.html'), 'no-cache', 'index.html → no-cache.'); T.eq(c('config.json'), 'no-cache', 'config.json → no-cache.'); } },
      { name: 'Dateien mit Fingerabdruck ewig cachen', run: T => { const c = T.get('cacheRegel'); T.eq(c('main-AB12CD34.js'), 'public, max-age=31536000, immutable', 'main-AB12CD34.js hat einen Fingerabdruck.'); T.eq(c('styles-9F8E7D6C.css'), 'public, max-age=31536000, immutable', 'Auch CSS mit Fingerabdruck.'); T.eq(c('logo.png'), 'no-cache', 'Ohne Fingerabdruck lieber no-cache.'); } },
      { name: 'CI in der richtigen Reihenfolge', run: T => { const s = T.get('ciSchritte'); T.eq(s[0], 'npm ci', 'Zuerst npm ci (nicht npm install).'); const i = w => s.findIndex(x => x.includes(w)); T.ok(i('lint') > 0 && i('test') > i('lint') && i('build') > i('test'), 'Danach lint, dann test, dann build.'); } }
    ] },
  takeaway: ['angular.json: configurations, budgets, outputHashing.', 'Einmal bauen, Konfig zur Laufzeit (provideAppInitializer).', 'CI: npm ci, lint, test, build bei jedem PR.', 'Server: SPA-Fallback auf index.html, index.html no-cache, gehashte Dateien immutable.'],
  pairs: [
    ['<code>configurations</code>', 'Varianten des Builds in angular.json'],
    ['<code>budgets</code>', 'Warnschwellen für die Größe'],
    ['CI', 'Baut, prüft und testet jeden PR'],
    ['SPA-Fallback', 'Unbekannte Pfade bekommen index.html'],
    ['<code>outputHashing</code>', 'Fingerabdruck im Dateinamen, ewig cachebar']
  ]
});

CH.push({
  id: 't04', act: 7, title: 'Wenn der Server weg ist', tag: 'Fehlerbehandlung app-weit · Monitoring', xp: 220,
  docs: [['Unbehandelte Fehler in Angular', 'https://angular.dev/best-practices/error-handling'], ['Requests und Antworten abfangen', 'https://angular.dev/guide/http/interceptors'], ['Asynchrone Reaktivität mit Resources', 'https://angular.dev/guide/signals/resource']],
  ticket: { id: 'PW-149', category: 'Incident', heading: 'Keine Rückmeldung, wenn der Server weg ist', text: 'Fällt der Server aus, passiert in der App einfach nichts. Fehler erfahren wir nur durch Beschwerde-Mails. Baue zentrale Fehlerbehandlung.' },
  story: [
    ['leon', 'Wenn der Server weg ist, passiert einfach nichts. Kein Text, kein Ladekreis, nichts.'],
    ['boss', 'Und von Fehlern erfahre ich erst durch böse Mails.'],
    ['toni', 'Ein Senior baut die Fehlerbehandlung EINMAL zentral. Und er will Fehler sehen, bevor ein Kunde sie meldet.']
  ],
  slides: [
    { t: 'Vier Zustände für jede Anzeige', say: 'Jede Stelle, die Daten lädt, hat vier Zustände. Wer nur „Daten da“ baut, hat drei Bugs eingebaut.', job: 'Laden, Fehler, leer, Daten: QA testet im Job genau diese vier Fälle. Fehlt einer, kommt das Ticket zurück. Mit einer festen @if/@else-Kette vergisst du keinen.',
      code: C`
@if (team.isLoading()) {
  <app-spinner />
} @else if (team.error()) {
  <p>Team gerade nicht erreichbar. <button (click)="team.reload()">Nochmal</button></p>
} @else if (!team.value()?.length) {
  <p>Noch keine Entwickler.</p>
} @else {
  @for (s of team.value(); track s.id) { <app-entwickler [entwickler]="s" /> }
}`,
      notes: [['isLoading()', 'Laden: Spinner oder Platzhalter.'], ['error()', 'Fehler: Was ist los und was kann ich tun?'], ['!team.value()?.length', 'Leer: freundlich sagen, dass nichts da ist.'], ['@else', 'Erst dann die Daten.']],
      pro: 'Gute Fehlermeldung = was ist passiert + was kann ich tun. „Fehler 500“ ist keine Meldung. Und: Fehler nie still verschlucken (catchError(() => EMPTY) ohne Anzeige).' },
    { t: 'Zentral: Interceptor und ErrorHandler', say: 'HTTP-Fehler fängt ein Interceptor für ALLE Anfragen. Alle anderen Fehler landen im ErrorHandler. Beides ersetzt du durch deine eigene Version.', job: 'In Firmen-Apps gibt es meist genau einen error.interceptor.ts, der Toasts zeigt und bei 401 zum Login schickt. Neue Features bekommen die Fehlerbehandlung so gratis dazu.',
      code: C`
export const fehlerInterceptor: HttpInterceptorFn = (req, next) => {
  const meldungen = inject(Meldungen);
  return next(req).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status === 0) meldungen.zeige('Keine Verbindung.');
      return throwError(() => e);
    })
  );
};

@Injectable()
export class GlobalerFehler implements ErrorHandler {
  private monitoring = inject(Monitoring);
  handleError(e: unknown) { this.monitoring.melde(e); }
}
providers: [{ provide: ErrorHandler, useClass: GlobalerFehler }]`,
      notes: [['HttpInterceptorFn', 'Funktion zwischen App und Server. Sieht jede Anfrage und Antwort.'], ['e.status === 0', 'Status 0 = gar keine Antwort: offline, CORS, Server tot.'], ['throwError(() => e)', 'Weiterwerfen! Sonst denkt der Aufrufer, alles war gut.'], ['ErrorHandler', 'Angular ruft handleError für jeden nicht gefangenen Fehler auf.'], ['private monitoring = inject', 'inject() als Feld, nicht erst in handleError: Dort gibt es keinen Injection Context.'], ['useClass: GlobalerFehler', 'Die eigene Version statt der Standard-Konsole.']],
      pro: 'Anmelden: provideHttpClient(withInterceptors([fehlerInterceptor])). Ab v20 fängt provideBrowserGlobalErrorListeners() auch Fehler außerhalb von Angular (window.onerror, unhandledrejection).' },
    { t: 'Monitoring: Fehler sehen, bevor Kunden sie melden', say: 'Fehler aus dem Browser der Nutzer müssen bei dir ankommen. Dafür gibt es Monitoring-Dienste.', job: 'Sentry, Datadog oder Application Insights: In Firmen siehst du dort jeden Fehler mit Browser, Seite und Ablauf. Am Montag schaut das Team oft gemeinsam auf die Top-Fehler.',
      points: [['Fehler sammeln', 'Sentry, Datadog, Application Insights. Im ErrorHandler an den Dienst schicken.', 'plus'], ['Source Maps hochladen', 'Sonst steht im Fehler nur main-AB12.js:1:48213.', 'plus'], ['Kontext mitschicken', 'Version, Route, Browser, Nutzer-ID (ohne persönliche Daten!).', 'plus'], ['Correlation-ID', 'Ein Header pro Anfrage. Backend und Frontend finden denselben Fehler.', ''], ['Alarm', 'Neue Fehlerart nach Release? Sofort Nachricht ans Team.', '']],
      pro: 'Achtung DSGVO: keine Namen, E-Mails oder Formularinhalte in Fehlerberichte. Das ist im Review ein „Muss“-Kommentar.' }
  ],
  quiz: [
    { q: 'Was bedeutet es meistens, wenn HttpClient bei einem Fehler den Status 0 meldet?', options: ['Alles ist in Ordnung', 'Es kam keine Antwort: offline, CORS oder Server nicht erreichbar', 'Die Adresse wurde nicht gefunden', 'Der Nutzer ist nicht eingeloggt'], correct: 1, why: 'Der Browser hat gar keine HTTP-Antwort bekommen.' },
    { q: 'Ein Interceptor hat für einen HTTP-Fehler eine Meldung angezeigt. Was macht er danach mit dem Fehler?', options: ['Er verschluckt ihn', 'Er wirft ihn mit throwError weiter', 'Er lädt die Seite neu', 'Er schreibt ihn in localStorage'], correct: 1, why: 'Der Aufrufer muss erfahren, dass die Anfrage schiefging.' },
    { q: 'Wie ersetzt man den ErrorHandler von Angular durch eine eigene Klasse?', options: ['Gar nicht, er ist fest eingebaut', 'Mit { provide: ErrorHandler, useClass: MeinHandler }', 'Mit window.onerror', 'Mit try/catch um jeden Aufruf'], correct: 1, why: 'Dank Dependency Injection lässt er sich austauschen.' }
  ],
  ex: { id: 'ext4', title: 'Wenn der Server weg ist', goal: 'Bau einen Fehler-Interceptor und einen eigenen ErrorHandler.',
    todo: ['Status <code>0</code> → Meldung <code>Keine Verbindung. Bist du online?</code>', 'Status <code>401</code> → <code>router.navigate([\'/login\'])</code>', 'Status ab <code>500</code> → Meldung <code>Server-Problem. Bitte gleich nochmal.</code>', 'Jeder Fehler wird weitergeworfen, Erfolge gehen unverändert durch', '<code>GlobalerFehler.handleError</code>: an <code>Monitoring.melde(e)</code> und Meldung <code>Ups, da ist was schiefgelaufen.</code>', '<code>fehlerProvider</code> ersetzt den <code>ErrorHandler</code>'],
    starter: C`
import { Injectable, Service, ErrorHandler, inject, signal } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

@Service()
export class Meldungen {
  letzte = signal<string | null>(null);
  zeige(text: string) { this.letzte.set(text); }
}

@Service()
export class Monitoring {
  fehler: unknown[] = [];
  melde(e: unknown) { this.fehler.push(e); }
}

export const fehlerInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};

@Injectable()
export class GlobalerFehler implements ErrorHandler {
  handleError(e: unknown) {
    console.error(e);
  }
}

export const fehlerProvider = {};
`,
    solution: C`
import { Injectable, Service, ErrorHandler, inject, signal } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

@Service()
export class Meldungen {
  letzte = signal<string | null>(null);
  zeige(text: string) { this.letzte.set(text); }
}

@Service()
export class Monitoring {
  fehler: unknown[] = [];
  melde(e: unknown) { this.fehler.push(e); }
}

export const fehlerInterceptor: HttpInterceptorFn = (req, next) => {
  const meldungen = inject(Meldungen);
  const router = inject(Router);
  return next(req).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status === 0) meldungen.zeige('Keine Verbindung. Bist du online?');
      else if (e.status === 401) router.navigate(['/login']);
      else if (e.status >= 500) meldungen.zeige('Server-Problem. Bitte gleich nochmal.');
      return throwError(() => e);
    })
  );
};

@Injectable()
export class GlobalerFehler implements ErrorHandler {
  private monitoring = inject(Monitoring);
  private meldungen = inject(Meldungen);

  handleError(e: unknown) {
    this.monitoring.melde(e);
    this.meldungen.zeige('Ups, da ist was schiefgelaufen.');
  }
}

export const fehlerProvider = { provide: ErrorHandler, useClass: GlobalerFehler };
`,
    notes: [['const meldungen = inject(Meldungen)', 'inject ganz oben, nicht erst im catchError (dort ist kein Injection Context mehr).'], ['catchError((e: HttpErrorResponse)', 'Fängt jeden HTTP-Fehler.'], ["router.navigate(['/login'])", '401: ab zum Login.'], ['e.status >= 500', 'Alle Server-Fehler.'], ['return throwError(() => e)', 'Weiterwerfen, damit die Komponente ihren Fehler-Zustand zeigt.'], ['this.monitoring.melde(e)', 'Ab ins Monitoring.'], ['{ provide: ErrorHandler, useClass: GlobalerFehler }', 'Angulars Standard ersetzen.']],
    hints: ['Gerüst: <code>return next(req).pipe(catchError((e: HttpErrorResponse) =&gt; { …; return throwError(() =&gt; e); }));</code>', 'inject() ganz oben im Interceptor aufrufen, nicht im catchError.', 'Provider: <code>{ provide: ErrorHandler, useClass: GlobalerFehler }</code>'],
    tests: [
      { name: 'Erfolg geht unverändert durch', run: async T => { const r = await viaInterceptor(T, 'fehlerInterceptor', {}); T.eq(r.vals, ['daten'], 'Ohne Fehler sollen die Daten unverändert ankommen.'); T.eq(T.inject(T.get('Meldungen')).letzte(), null, 'Ohne Fehler keine Meldung.'); } },
      { name: 'Status 0: keine Verbindung', run: async T => { const r = await viaInterceptor(T, 'fehlerInterceptor', { status: 0 }); T.eq(T.inject(T.get('Meldungen')).letzte(), 'Keine Verbindung. Bist du online?', 'Bei Status 0 diese Meldung zeigen.'); T.ok(r.error && r.error.status === 0, 'Den Fehler danach weiterwerfen: return throwError(() => e).'); } },
      { name: '401: ab zum Login', run: async T => { const nav = T.routerSpy(); const r = await viaInterceptor(T, 'fehlerInterceptor', { status: 401 }); T.ok(nav.includes('/login'), 'Bei 401 router.navigate([\'/login\']).'); T.ok(r.error && r.error.status === 401, '401 auch weiterwerfen.'); } },
      { name: '5xx: Server-Problem', run: async T => { await viaInterceptor(T, 'fehlerInterceptor', { status: 503 }); T.eq(T.inject(T.get('Meldungen')).letzte(), 'Server-Problem. Bitte gleich nochmal.', 'Bei 500 bis 599 diese Meldung.'); } },
      { name: '404 bleibt Sache der Komponente', run: async T => { const r = await viaInterceptor(T, 'fehlerInterceptor', { status: 404 }); T.eq(T.inject(T.get('Meldungen')).letzte(), null, 'Bei 404 keine globale Meldung.'); T.ok(r.error && r.error.status === 404, 'Aber weiterwerfen!'); } },
      { name: 'Eigener ErrorHandler', run: T => { const p = T.get('fehlerProvider'); const EH = T.ng.core.ErrorHandler; T.ok(p && p.provide === EH, 'fehlerProvider = { provide: ErrorHandler, useClass: GlobalerFehler }'); const inj = new T.ng.Injector(null, [p]); const h = inj.get(EH); T.ok(h instanceof T.get('GlobalerFehler'), 'Für ErrorHandler soll GlobalerFehler kommen.'); h.handleError(new Error('Kaputt')); T.eq(inj.get(T.get('Monitoring')).fehler.length, 1, 'handleError soll Monitoring.melde(e) aufrufen.'); T.eq(inj.get(T.get('Meldungen')).letzte(), 'Ups, da ist was schiefgelaufen.', 'Und dem Nutzer eine Meldung zeigen.'); } }
    ] },
  takeaway: ['Jede Anzeige: Laden, Fehler, Leer, Daten.', 'HTTP-Fehler zentral im Interceptor, immer weiterwerfen.', 'Eigener ErrorHandler → Monitoring.', 'Source Maps hochladen, keine persönlichen Daten in Fehlerberichte.'],
  pairs: [
    ['Vier Zustände', 'Laden, Fehler, Leer, Daten'],
    ['Interceptor', 'Fängt HTTP-Fehler aller Anfragen'],
    ['ErrorHandler', 'Fängt alle anderen Fehler ab'],
    ['Source Maps', 'Machen main-AB12.js:1:48213 wieder lesbar'],
    ['Monitoring', 'Fehler sehen, bevor Kunden sie melden']
  ]
});

CH.push({
  id: 't05', act: 7, title: 'Rausgeflogen im Checkout', tag: 'Auth realistisch · Refresh-Token · Rollen', xp: 240,
  docs: [['Requests und Antworten abfangen', 'https://angular.dev/guide/http/interceptors'], ['Routen-Zugriff mit Guards steuern', 'https://angular.dev/guide/routing/route-guards']],
  ticket: { id: 'PW-150', category: 'Bug', heading: 'Ausgeloggt mitten im Checkout', text: 'Im Shop vom Großkunden fliegen Käufer nach 15 Minuten mitten im Kauf raus. Der Token soll still erneuert und die Anfrage wiederholt werden. Admin-Seiten nur für Admins.' },
  story: [
    ['leon', 'Der Kunde hat angerufen: Nach 15 Minuten fliegen seine Käufer raus, mitten im Checkout!'],
    ['jonas', 'Der Access-Token ist 15 Minuten gültig. Das ist Absicht. Mit dem Refresh-Token bekommt ihr einen neuen.'],
    ['toni', 'Dann muss die App ihn still erneuern und die Anfrage wiederholen. Das baust du jetzt.']
  ],
  slides: [
    { t: 'Login in Firmen: OIDC', say: 'Firmen bauen Login fast nie selbst. Ein Identity Provider (Keycloak, Entra ID, Auth0) macht das. Die App leitet hin und bekommt Tokens zurück.', job: 'In Firmen-Projekten heißt es fast immer: „Login läuft über Keycloak“ oder „über Entra ID“. Du baust dann keine Login-Seite, sondern bindest eine Bibliothek wie angular-auth-oidc-client ein.',
      points: [['OpenID Connect + PKCE', 'Standard-Ablauf für Browser-Apps. Bibliotheken: angular-oauth2-oidc, angular-auth-oidc-client.', 'plus'], ['Access-Token', 'Kurz gültig (z. B. 5 bis 15 Minuten). Geht als Bearer mit jeder Anfrage.', ''], ['Refresh-Token', 'Länger gültig. Holt einen neuen Access-Token, ohne neues Login.', ''], ['BFF (Backend for Frontend)', 'Noch sicherer: Tokens bleiben auf dem Server, der Browser hat nur ein HttpOnly-Cookie.', 'plus']],
      pro: 'Im Review fragen: Wo liegt der Token (localStorage ist XSS-anfällig)? Was passiert bei 401? Wird beim Logout wirklich alles gelöscht (Store, Cache)?' },
    { t: 'Der Refresh-Interceptor', say: 'Einen Interceptor, der den Token anhängt, kennst du schon. Neu: Kommt 401 zurück, holt der Interceptor still einen neuen Token und schickt die Anfrage noch einmal. Klappt auch das nicht: Logout.', job: 'Ein echter Bug: Fünf Anfragen bekommen gleichzeitig 401 und holen fünfmal einen neuen Token. Ein guter Refresh-Interceptor holt ihn einmal und lässt die anderen warten.',
      code: C`
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  if (req.url.includes('/auth/')) return next(req);
  const mit = (t: string) => req.clone({ setHeaders: { Authorization: 'Bearer ' + t } });

  return next(mit(auth.token())).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status !== 401) return throwError(() => e);
      return auth.refresh().pipe(
        catchError(err => { auth.logout(); return throwError(() => err); }),
        switchMap(neu => next(mit(neu)))
      );
    })
  );
};`,
      notes: [["req.url.includes('/auth/')", 'Die Login- und Refresh-Anfragen selbst nicht anfassen. Sonst Endlosschleife.'], ['req.clone({ setHeaders', 'Anfragen sind unveränderlich. Kopie mit Header.'], ['e.status !== 401', 'Andere Fehler: nicht unser Job.'], ['auth.refresh()', 'Neuen Token holen.'], ['switchMap(neu => next(mit(neu)))', 'Mit dem neuen Token noch einmal versuchen.'], ['auth.logout()', 'Refresh kaputt: sauber abmelden. Das catchError steht VOR switchMap, damit nur ein gescheiterter Refresh abmeldet. Scheitert danach die wiederholte Anfrage (z. B. 500), geht der Fehler normal weiter.']],
      pro: 'Profi-Detail: Kommen 5 Anfragen gleichzeitig mit 401 zurück, soll es nur EINEN Refresh geben. Dafür teilt man das Refresh-Observable (shareReplay) oder merkt sich „Refresh läuft gerade“.' },
    { t: 'Rollen in der Oberfläche', say: 'Kunden sehen anderes als Admins. Die Oberfläche richtet sich nach der Rolle, aber die Sicherheit macht der Server.', job: 'Im Review schaust du: Wird ein Admin-Knopf nur versteckt, oder prüft auch der Server? Das Verstecken ist Komfort. Sicherheit gibt es nur auf dem Server.',
      code: C`
export function nurRolle(r: Rolle): CanActivateFn {
  return () => inject(Auth).rolle() === r || inject(Router).createUrlTree(['/kein-zutritt']);
}

{ path: 'preise', component: Preise, canActivate: [nurRolle('admin')] }

@if (auth.rolle() === 'admin') { <button>Preise ändern</button> }`,
      notes: [['nurRolle(r: Rolle)', 'Eine Fabrik: gibt für jede Rolle einen passenden Guard zurück.'], ["createUrlTree(['/kein-zutritt'])", 'Freundlich umleiten statt leere Seite.'], ["nurRolle('admin')", 'Wiederverwendbar für jede Route.'], ['@if (auth.rolle()', 'Knöpfe nur zeigen, wenn erlaubt.']],
      pro: 'Rechte, nicht Rollen prüfen: hatRecht(\'preise.bearbeiten\') ist flexibler als rolle === \'admin\'. Rollen ändern sich, Rechte bleiben.' }
  ],
  quiz: [
    { q: 'Warum lässt der Refresh-Interceptor Anfragen an /auth/ unverändert durch?', options: ['Weil das schneller ist', 'Weil sonst ein 401 beim Refresh wieder einen Refresh auslöst: eine Endlosschleife', 'Wegen CORS', 'Weil /auth/-Anfragen nie fehlschlagen'], correct: 1, why: 'Die Refresh-Anfrage selbst darf keinen weiteren Refresh auslösen.' },
    { q: 'Der Versuch, einen neuen Token zu holen (Refresh), schlägt fehl. Was soll der Interceptor dann tun?', options: ['Es endlos weiter versuchen', 'Den Nutzer ausloggen und den Fehler weiterwerfen', 'Den Fehler ignorieren', 'Die Seite neu laden'], correct: 1, why: 'Dann ist die Sitzung wirklich vorbei.' },
    { q: 'Nur Admins sollen die Preis-Daten sehen. Wer schützt diese Daten wirklich?', options: ['Der Guard', 'Das @if im Template', 'Der Server', 'Der Interceptor'], correct: 2, why: 'Eine Prüfung im Frontend ist nur Komfort. Echte Sicherheit gibt es nur im Backend.' }
  ],
  ex: { id: 'ext5', title: 'Rausgeflogen im Checkout', goal: 'Bau den Interceptor mit stillem Refresh und einen Rollen-Guard.',
    todo: ['Jede Anfrage bekommt <code>Authorization: Bearer TOKEN</code>', 'Anfragen an <code>/auth/</code> bleiben unverändert', 'Bei <code>401</code>: <code>auth.refresh()</code>, dann die Anfrage mit neuem Token wiederholen', 'Refresh kaputt → <code>auth.logout()</code> und Fehler weiterwerfen', 'Andere Fehler: kein Refresh, weiterwerfen', '<code>nurRolle(r)</code>: richtige Rolle → <code>true</code>, sonst UrlTree auf <code>/kein-zutritt</code>'],
    starter: C`
import { Service, inject, signal } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router, CanActivateFn } from '@angular/router';
import { Observable, of, throwError, catchError, switchMap, tap } from 'rxjs';

export type Rolle = 'kunde' | 'admin';

@Service()
export class Auth {
  token = signal('alt');
  rolle = signal<Rolle>('kunde');
  refreshKlappt = true;
  refreshs = 0;

  refresh(): Observable<string> {
    this.refreshs++;
    return this.refreshKlappt
      ? of('neu').pipe(tap(t => this.token.set(t)))
      : throwError(() => new HttpErrorResponse({ status: 401, url: '/auth/refresh' }));
  }
  logout() { this.token.set(''); }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};

export function nurRolle(r: Rolle): CanActivateFn {
  return () => true;
}
`,
    solution: C`
import { Service, inject, signal } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router, CanActivateFn } from '@angular/router';
import { Observable, of, throwError, catchError, switchMap, tap } from 'rxjs';

export type Rolle = 'kunde' | 'admin';

@Service()
export class Auth {
  token = signal('alt');
  rolle = signal<Rolle>('kunde');
  refreshKlappt = true;
  refreshs = 0;

  refresh(): Observable<string> {
    this.refreshs++;
    return this.refreshKlappt
      ? of('neu').pipe(tap(t => this.token.set(t)))
      : throwError(() => new HttpErrorResponse({ status: 401, url: '/auth/refresh' }));
  }
  logout() { this.token.set(''); }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  if (req.url.includes('/auth/')) return next(req);
  const mit = (t: string) => req.clone({ setHeaders: { Authorization: 'Bearer ' + t } });

  return next(mit(auth.token())).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status !== 401) return throwError(() => e);
      return auth.refresh().pipe(
        catchError(err => {
          auth.logout();
          return throwError(() => err);
        }),
        switchMap(neu => next(mit(neu)))
      );
    })
  );
};

export function nurRolle(r: Rolle): CanActivateFn {
  return () => inject(Auth).rolle() === r || inject(Router).createUrlTree(['/kein-zutritt']);
}
`,
    notes: [['const auth = inject(Auth)', 'Ganz oben holen. Im catchError gibt es keinen Injection Context.'], ["req.url.includes('/auth/')", 'Login/Refresh nicht anfassen.'], ["setHeaders: { Authorization: 'Bearer ' + t }", 'Token an die Kopie hängen.'], ['e.status !== 401', 'Nur 401 löst einen Refresh aus.'], ['switchMap(neu => next(mit(neu)))', 'Zweiter Versuch mit neuem Token.'], ['auth.logout()', 'Refresh kaputt: abmelden. Vor switchMap, sonst meldet auch ein Fehler der wiederholten Anfrage ab.'], ['inject(Auth).rolle() === r ||', 'Richtige Rolle → true, sonst …'], ["createUrlTree(['/kein-zutritt'])", '… Umleitung.']],
    hints: ['Token anhängen: <code>req.clone({ setHeaders: { Authorization: \'Bearer \' + t } })</code>', 'Bei 401: <code>return auth.refresh().pipe(catchError(…), switchMap(neu =&gt; next(mit(neu))))</code>. catchError zuerst, dann fängt es nur Fehler vom Refresh.', 'Guard: <code>return () =&gt; inject(Auth).rolle() === r || inject(Router).createUrlTree([\'/kein-zutritt\']);</code>'],
    tests: [
      { name: 'Hängt den Token an', run: async T => { T.inject(T.get('Auth')).token.set('neu'); const r = await viaInterceptor(T, 'authInterceptor', { next: q => T.rx.of(q.headers.get('Authorization')) }); T.eq(r.vals, ['Bearer neu'], 'Jede Anfrage braucht Authorization: Bearer TOKEN (req.clone({ setHeaders })).'); } },
      { name: 'Bei 401: Refresh und nochmal', run: async T => { const a = T.inject(T.get('Auth')); const r = await viaInterceptor(T, 'authInterceptor', { next: (q, H) => q.headers.get('Authorization') === 'Bearer neu' ? T.rx.of('daten') : T.rx.throwError(() => new H.HttpErrorResponse({ status: 401 })) }); T.eq(r.calls.map(c => c.headers.get('Authorization')), ['Bearer alt', 'Bearer neu'], 'Erst mit altem Token, nach 401 mit neuem.'); T.eq(r.vals, ['daten'], 'Der zweite Versuch soll die Daten liefern.'); T.eq(a.refreshs, 1, 'Genau ein Refresh.'); } },
      { name: 'Refresh kaputt → Logout', run: async T => { const a = T.inject(T.get('Auth')); a.refreshKlappt = false; const r = await viaInterceptor(T, 'authInterceptor', { status: 401 }); T.ok(r.error, 'Der Fehler soll weitergeworfen werden.'); T.eq(a.token(), '', 'Wenn der Refresh scheitert: auth.logout().'); } },
      { name: 'Refresh klappt, zweiter Versuch scheitert: kein Logout', run: async T => { const a = T.inject(T.get('Auth')); const r = await viaInterceptor(T, 'authInterceptor', { next: (q, H) => T.rx.throwError(() => new H.HttpErrorResponse({ status: q.headers.get('Authorization') === 'Bearer neu' ? 500 : 401 })) }); T.ok(r.error && r.error.status === 500, 'Der 500er vom zweiten Versuch soll weitergehen.'); T.eq(a.token(), 'neu', 'Der Refresh hat geklappt, also nicht abmelden. Steht dein catchError mit auth.logout() VOR dem switchMap?'); } },
      { name: 'Andere Fehler: kein Refresh', run: async T => { const a = T.inject(T.get('Auth')); const r = await viaInterceptor(T, 'authInterceptor', { status: 500 }); T.eq(a.refreshs, 0, 'Bei 500 kein Refresh.'); T.ok(r.error && r.error.status === 500, '500 weiterwerfen.'); } },
      { name: '/auth/ bleibt unberührt', run: async T => { const r = await viaInterceptor(T, 'authInterceptor', { url: '/auth/refresh', next: q => T.rx.of(q.headers.get('Authorization')) }); T.eq(r.vals, [null], 'Anfragen an /auth/ ohne Token und ohne Refresh weiterschicken.'); } },
      { name: 'Rollen-Guard', run: T => { const a = T.inject(T.get('Auth')); const g = T.get('nurRolle')('admin'); a.rolle.set('admin'); T.eq(T.inCtx(() => g({}, {})), true, 'Admin → true.'); a.rolle.set('kunde'); const r = T.inCtx(() => g({}, {})); T.ok(T.isUrlTree(r, '/kein-zutritt'), 'Kunde → createUrlTree([\'/kein-zutritt\']).'); } }
    ] },
  takeaway: ['Login macht ein Identity Provider (OIDC + PKCE).', 'Kurzer Access-Token, Refresh im Interceptor, Anfrage wiederholen.', '/auth/ nie refreshen, bei kaputtem Refresh logout.', 'Rollen in der UI sind Komfort, der Server prüft.'],
  pairs: [
    ['OIDC + PKCE', 'Login über einen Identity Provider'],
    ['Access-Token', 'Kurz gültig, geht mit jeder Anfrage mit'],
    ['Refresh-Token', 'Holt einen neuen Access-Token ohne Login'],
    ['401 im Interceptor', 'Still neuen Token holen, Anfrage wiederholen'],
    ['Rollen in der UI', 'Nur Komfort, der Server prüft']
  ]
});

CH.push({
  id: 't06', act: 7, title: 'Der Leck-Detektiv', tag: 'Speicherlecks · Performance messen', xp: 220,
  docs: [['Abos mit takeUntilDestroyed beenden', 'https://angular.dev/ecosystem/rxjs-interop/take-until-destroyed'], ['Angular DevTools Profiler', 'https://angular.dev/tools/devtools/profiler'], ['Performance mit Chrome DevTools messen', 'https://angular.dev/best-practices/profiling-with-chrome-devtools']],
  ticket: { id: 'PW-151', category: 'Incident', heading: 'Tab stürzt nach zwei Stunden ab', text: 'Das Live-Dashboard mit den Shop-Zahlen von Nordlicht Mode läuft den ganzen Tag auf dem großen Bildschirm im Flur. Nach einer Stunde wird es zäh, nach zwei Stunden stürzt der Tab ab. Finde und stopfe die Speicherlecks.' },
  story: [
    ['boss', 'Das Live-Dashboard auf dem großen Bildschirm im Flur wird nach einer Stunde zäh. Nach zwei Stunden stürzt der Tab ab. Und morgen kommt der Kunde zu Besuch.'],
    ['toni', 'Ein Speicherleck. Irgendwer hört weiter zu, obwohl seine Komponente längst weg ist. Wir finden ihn: erst messen, dann reparieren.']
  ],
  slides: [
    { t: 'Erst messen: die Werkzeuge', say: 'Rate nie, was langsam ist. Jedes Problem hat sein Werkzeug.', job: 'Im Memory-Tab der DevTools machst du einen Snapshot, wechselst zehnmal die Seite und machst noch einen. Wächst der Speicher immer weiter, hast du ein Leck.',
      points: [['Angular DevTools → Profiler', 'Welche Komponente wird wie oft geprüft und wie lange?', 'plus'], ['Chrome → Performance', 'Aufnahme starten, klicken, stoppen. Lange gelbe Blöcke = zu viel JavaScript.', 'plus'], ['Chrome → Memory', 'Heap Snapshot vorher/nachher vergleichen. „Detached“ Elemente = Leck.', 'plus'], ['Lighthouse / Web Vitals', 'LCP, INP, CLS. In CI messen, in Produktion mit der web-vitals-Bibliothek.', 'plus']],
      pro: 'Die Drei-Schnappschuss-Methode: Snapshot, Seite 5x öffnen und verlassen, Snapshot, nochmal 5x, Snapshot. Was zwischen 2 und 3 um genau 5 wächst, ist dein Leck.' },
    { t: 'Die üblichen Verdächtigen', say: 'Fast jedes Leck in Angular ist eins von vier Dingen. Alle haben dieselbe Ursache: Etwas läuft weiter, nachdem die Komponente weg ist.', job: 'Die üblichen Funde im Review: subscribe() ohne Ende, setInterval ohne clearInterval, addEventListener auf window ohne remove. Fast jedes Firmen-Projekt hat davon ein paar.',
      points: [['subscribe ohne Ende', 'interval, WebSocket, valueChanges, Store-Selects.', 'minus'], ['Timer', 'setInterval, setTimeout in Schleifen.', 'minus'], ['addEventListener', 'An window oder document. Die leben ewig.', 'minus'], ['Fremd-Bibliotheken', 'Charts, Karten: haben meist ein destroy().', 'minus']],
      pro: 'Was KEIN Leck ist: HttpClient-Anfragen (completen von selbst) und (click) im Template (räumt Angular ab). Im Review also nicht bei jedem subscribe Alarm schlagen, sondern fragen: Endet der Stream?' },
    { t: 'Aufräumen mit DestroyRef', say: 'DestroyRef ist der eine Ort fürs Aufräumen. takeUntilDestroyed beendet Abos automatisch.', job: 'In neuem Code siehst du takeUntilDestroyed() hinter fast jedem subscribe. In altem Code oft ein destroy$-Subject mit takeUntil. Beides heißt dasselbe: Abo endet mit der Komponente.',
      code: C`
constructor() {
  const beiResize = () => this.breite.set(window.innerWidth);
  window.addEventListener('resize', beiResize);
  const uhr = setInterval(() => this.ticks.update(t => t + 1), 1000);

  this.live$.pipe(takeUntilDestroyed()).subscribe(m => this.meldung.set(m));

  inject(DestroyRef).onDestroy(() => {
    window.removeEventListener('resize', beiResize);
    clearInterval(uhr);
  });
}`,
      notes: [['const beiResize', 'Die Funktion merken. removeEventListener braucht GENAU dieselbe.'], ['const uhr = setInterval', 'Die Timer-Nummer merken.'], ['takeUntilDestroyed()', 'Abo endet mit der Komponente. Nur im Injection Context.'], ['inject(DestroyRef).onDestroy', 'Läuft, wenn die Komponente zerstört wird.']],
      pro: 'Noch besser: Gar nicht erst manuell abonnieren (toSignal), und für Fenstergröße einen Service mit einem Signal bauen, den alle teilen. Dann gibt es nur EINEN Listener in der ganzen App.' }
  ],
  quiz: [
    { q: 'Welches dieser Abos ist KEIN Speicherleck, auch wenn du es nicht selbst beendest?', options: ['interval(1000).subscribe()', 'http.get().subscribe()', 'fromEvent(window, "resize").subscribe()', 'webSocket.subscribe()'], correct: 1, why: 'Eine HTTP-Anfrage meldet nach der Antwort complete. Das Abo endet also von selbst.' },
    { q: 'Warum musst du removeEventListener genau dieselbe Funktion übergeben wie vorher addEventListener?', options: ['Das musst du gar nicht', 'Sonst findet der Browser den Listener nicht und entfernt nichts', 'Weil TypeScript es verlangt', 'Sonst entfernt der Browser alle resize-Listener'], correct: 1, why: 'Eine neu geschriebene Pfeilfunktion ist ein anderes Objekt, auch wenn sie gleich aussieht.' },
    { q: 'Mit welchem Werkzeug findest du ein Speicherleck?', options: ['Mit console.log', 'Mit Heap Snapshots im Memory-Tab, die du vergleichst', 'Mit Lighthouse', 'Mit mehr Arbeitsspeicher'], correct: 1, why: 'Was nach dem Verlassen der Seite im Speicher bleibt, ist das Leck.' }
  ],
  ex: { id: 'ext6', title: 'Der Leck-Detektiv', goal: 'Das Live-Dashboard hat drei Lecks. Stopf sie alle, ohne dass das Dashboard aufhört zu funktionieren.', preview: 'LiveDashboard',
    todo: ['Der <code>resize</code>-Listener wird beim Zerstören entfernt (gleiche Funktion!)', 'Der <code>setInterval</code>-Timer wird gestoppt', 'Das Abo auf <code>live$</code> endet mit <code>takeUntilDestroyed()</code>', 'Vorher funktioniert alles wie gehabt'],
    starter: C`
import { Component, Service, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Service()
export class Ticker {
  live$ = interval(20);
}

@Component({
  selector: 'app-live-dashboard',
  template: \`
    <p class="breite">Breite: {{ breite() }}</p>
    <p class="ticks">Ticks: {{ ticks() }}</p>
  \`,
})
export class LiveDashboard {
  breite = signal(window.innerWidth);
  ticks = signal(0);
  pings = 0;

  constructor() {
    window.addEventListener('resize', () => this.breite.set(window.innerWidth));
    setInterval(() => this.ticks.update(t => t + 1), 20);
    inject(Ticker).live$.subscribe(() => this.pings++);
  }
}
`,
    solution: C`
import { Component, Service, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Service()
export class Ticker {
  live$ = interval(20);
}

@Component({
  selector: 'app-live-dashboard',
  template: \`
    <p class="breite">Breite: {{ breite() }}</p>
    <p class="ticks">Ticks: {{ ticks() }}</p>
  \`,
})
export class LiveDashboard {
  breite = signal(window.innerWidth);
  ticks = signal(0);
  pings = 0;

  constructor() {
    const beiResize = () => this.breite.set(window.innerWidth);
    window.addEventListener('resize', beiResize);
    const uhr = setInterval(() => this.ticks.update(t => t + 1), 20);
    inject(Ticker).live$.pipe(takeUntilDestroyed()).subscribe(() => this.pings++);

    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('resize', beiResize);
      clearInterval(uhr);
    });
  }
}
`,
    notes: [['const beiResize', 'Funktion merken, damit man sie wieder abmelden kann.'], ['const uhr = setInterval', 'Timer-Nummer merken.'], ['pipe(takeUntilDestroyed())', 'Abo endet automatisch.'], ['inject(DestroyRef).onDestroy', 'Aufräum-Ort.'], ['removeEventListener', 'Dieselbe Funktion wie beim Anmelden.'], ['clearInterval(uhr)', 'Timer aus.']],
    hints: ['Listener: erst <code>const beiResize = () =&gt; …;</code>, dann <code>addEventListener(\'resize\', beiResize)</code>', 'Abo: <code>inject(Ticker).live$.pipe(takeUntilDestroyed()).subscribe(…)</code>', 'Aufräumen: <code>inject(DestroyRef).onDestroy(() =&gt; { window.removeEventListener(\'resize\', beiResize); clearInterval(uhr); });</code>'],
    tests: [
      { name: 'Vorher läuft alles', run: async T => { const f = T.mount(T.cmp('LiveDashboard')); for (let i = 0; i < 20 && (f.instance.ticks() < 2 || f.instance.pings < 2); i++) await T.flush(30); f.render(); T.ok(f.instance.ticks() >= 2, 'ticks soll hochzählen.'); T.ok(f.instance.pings >= 2, 'pings soll hochzählen.'); T.ok(/Ticks:\s*\d+/.test(f.q('.ticks').textContent), 'Ticks werden angezeigt.'); } },
      { name: 'resize-Listener wird entfernt', run: async T => { const add = [], rem = []; const oa = window.addEventListener, or = window.removeEventListener; window.addEventListener = function (t, f, o) { if (t === 'resize') add.push(f); return oa.call(this, t, f, o); }; window.removeEventListener = function (t, f, o) { if (t === 'resize') rem.push(f); return or.call(this, t, f, o); }; try { const f = T.mount(T.cmp('LiveDashboard')); T.ok(add.length >= 1, 'Das Dashboard soll auf resize hören.'); f.destroy(); T.ok(add.every(fn => rem.includes(fn)), 'Nach destroy hängt der resize-Listener noch am Fenster. removeEventListener mit DERSELBEN Funktion.'); } finally { window.addEventListener = oa; window.removeEventListener = or; } } },
      { name: 'Timer stoppt', run: async T => { const f = T.mount(T.cmp('LiveDashboard')); await T.flush(50); const i = f.instance; f.destroy(); const v = i.ticks(); await T.flush(90); T.eq(i.ticks(), v, 'Nach destroy zählt ticks weiter: clearInterval(uhr) in onDestroy.'); } },
      { name: 'Abo endet', run: async T => { const f = T.mount(T.cmp('LiveDashboard')); await T.flush(50); const i = f.instance; f.destroy(); const v = i.pings; await T.flush(90); T.eq(i.pings, v, 'Nach destroy kommen noch Pings an: .pipe(takeUntilDestroyed()).'); } }
    ] },
  takeaway: ['Erst messen: Profiler, Performance-Tab, Heap Snapshots, Web Vitals.', 'Lecks: Abos, Timer, Listener, Fremd-Bibliotheken.', 'DestroyRef.onDestroy + takeUntilDestroyed.', 'HTTP und (click) sind keine Lecks.'],
  pairs: [
    ['Profiler', 'Welche Komponente wird wie oft geprüft?'],
    ['Heap Snapshot', 'Speicher vorher und nachher vergleichen'],
    ['<code>DestroyRef</code>', 'Der eine Ort fürs Aufräumen'],
    ['<code>takeUntilDestroyed</code>', 'Beendet Abos automatisch'],
    ['Listener an <code>window</code>', 'Lebt ewig, wenn du nicht aufräumst']
  ]
});

CH.push({
  id: 't07', act: 7, title: 'Rickys erster PR', tag: 'Code Review üben', xp: 260,
  docs: [['Sicherheit in Angular (XSS)', 'https://angular.dev/best-practices/security'], ['Signals und RxJS verbinden (toSignal)', 'https://angular.dev/ecosystem/rxjs-interop'], ['Signals im Überblick', 'https://angular.dev/guide/signals']],
  ticket: { id: 'PW-152', category: 'Review', heading: 'PR „Bewerbersuche fertig, bitte mergen“', text: 'Ricky hat einen Pull Request für die Bewerbersuche im Intranet geöffnet. Du bist als Reviewer eingetragen. Finde die Probleme, bevor es live geht.' },
  story: [
    ['erz', 'Montag, 9 Uhr. Ricky hat zum ersten Mal ein ganzes Feature allein gebaut. Sein PR: „Bewerbersuche fertig, bitte mergen“.'],
    ['ricky', 'Läuft doch, oder?'],
    ['toni', 'Läuft heißt nicht fertig. Du bist Reviewer. Ich zähle sechs Dinge, die uns später wehtun.']
  ],
  slides: [
    { t: 'Die Review-Checkliste', say: 'Arbeite in dieser Reihenfolge. Das Wichtigste zuerst, Geschmack zuletzt.', job: 'In vielen Teams braucht jeder PR mindestens ein Approve. Ein Review dauert selten länger als 30 Minuten, wenn du in fester Reihenfolge vorgehst.',
      points: [['1. Korrekt?', 'Race Conditions, Randfälle, Fehlerfall, leere Liste.', ''], ['2. Sicher?', 'innerHTML, bypassSecurityTrust, Geheimnisse, Rechte.', ''], ['3. Lecks?', 'subscribe ohne Ende, Timer, Listener.', ''], ['4. Zustand?', 'Eine Wahrheit, computed statt Kopie, immutable.', ''], ['5. Lesbar & typisiert?', 'any, Namen, Größe, Tests dabei?', ''], ['6. Performance?', 'Methoden im Template, track, große Pakete im Bundle.', '']],
      pro: 'Kleine PRs fordern. 200 Zeilen kann man ernsthaft reviewen, 2000 Zeilen werden durchgewunken. Das zu sagen ist auch Review.' },
    { t: 'Gute Kommentare', say: 'Ein Review-Kommentar sagt: was, warum, und einen Vorschlag. Und wie wichtig er ist.', job: 'Gute Review-Kommentare haben oft ein Präfix: „Muss:“ (oft auch „blocker:“), „Frage:“, „Nit:“ (Kleinigkeit). So weiß der Autor sofort, was er vor dem Merge ändern muss und was nicht.',
      code: C`
❌ "Das ist falsch."

✅ "Muss: Hier läuft ein Abo im Abo. Tippt man schnell,
    kann eine alte Antwort die neue überschreiben.
    Vorschlag: suche$.pipe(switchMap(q => api.suche(q)))"

✅ "Nit: treffer statt t als Name? Liest sich leichter."

✅ "Frage: Woher kommt notiz? Wenn vom Nutzer,
    ist bypassSecurityTrustHtml eine XSS-Lücke."`,
      notes: [['Muss:', 'Blockiert den Merge. Bug, Sicherheit, Datenverlust.'], ['Nit:', 'Kleinigkeit, Geschmack. Blockiert nicht.'], ['Frage:', 'Du weißt es nicht sicher. Fragen ist kein Angriff.'], ['Vorschlag:', 'Immer einen Weg zeigen, nicht nur meckern.']],
      pro: 'Lob gehört dazu: „Schöne Tests für die Randfälle!“ Und wer dreimal hin und her schreibt, ruft lieber kurz an.' }
  ],
  quiz: [
    { q: 'Welcher Fund im Code Review blockiert den Merge auf jeden Fall?', options: ['Ein Name, der dir nicht gefällt', 'Eine XSS-Lücke', 'Überflüssige Leerzeichen', 'Ein fehlender Kommentar im Code'], correct: 1, why: 'Eine Sicherheitslücke ist immer ein „Muss“.' },
    { q: 'Wie formulierst du einen guten Review-Kommentar?', options: ['Kurz und knapp: „Falsch.“', 'Du schreibst, was dir auffällt, warum es stört, was du vorschlägst und wie wichtig es ist', 'Nur mit einem Emoji', 'Gar nicht, du behebst es einfach selbst'], correct: 1, why: 'So kann der andere daraus lernen und selbst entscheiden.' },
    { q: 'Du sollst einen PR mit 3000 Zeilen reviewen. Was tust du?', options: ['Du winkst ihn durch', 'Du bittest darum, ihn in kleinere PRs zu teilen', 'Du ignorierst ihn', 'Du liest nur die erste Datei'], correct: 1, why: 'Einen so großen PR kann niemand ehrlich prüfen.' }
  ],
  ex: { id: 'ext7', title: 'Rickys erster PR', goal: 'Rickys PR hat sechs Probleme. Repariere alle. Die Suche muss danach noch funktionieren.', preview: 'Bewerbersuche', backend: 'bewerber',
    todo: ['Abo im Abo → <code>switchMap</code> (nur die neueste Suche zählt), Fehler innen mit <code>catchError</code> fangen', 'Manuelles <code>subscribe</code> → <code>toSignal(…, { initialValue: [] })</code>', 'Methode <code>zaehle()</code> im Template → <code>anzahl = computed(…)</code>', '<code>bypassSecurityTrustHtml</code> + <code>[innerHTML]</code> → einfach <code>{{ notiz() }}</code> in <code>&lt;p class="notiz"&gt;</code>', '<code>any</code> raus, <code>string[]</code> rein', 'Suchbegriff nicht per <code>+ q</code> an die URL hängen, sondern mit <code>params: { q }</code> schicken'],
    starter: C`
import { Component, Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, Subject } from 'rxjs';

@Service()
export class BewerberApi {
  private http = inject(HttpClient);
  suche(q: string): Observable<string[]> { return this.http.get<string[]>('/api/bewerber?q=' + q); }
}

@Component({
  selector: 'app-bewerbersuche',
  template: \`
    <input class="suche" (input)="suche$.next($any($event.target).value)" />
    <p class="anzahl">{{ zaehle() }} Treffer</p>
    <ul>
      @for (n of treffer(); track $index) {
        <li>{{ n }}</li>
      }
    </ul>
    <p class="notiz" [innerHTML]="notizHtml"></p>
  \`,
})
export class Bewerbersuche {
  api = inject(BewerberApi);
  san = inject(DomSanitizer);
  suche$ = new Subject<string>();
  treffer = signal<any[]>([]);
  notiz = signal('<b>Leon</b> verlängert?');
  notizHtml: any;

  constructor() {
    this.suche$.subscribe(q => {
      this.api.suche(q).subscribe(r => this.treffer.set(r));
    });
    this.notizHtml = this.san.bypassSecurityTrustHtml(this.notiz());
  }

  zaehle() { return this.treffer().length; }
}
`,
    solution: C`
import { Component, Service, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subject, switchMap, catchError, of } from 'rxjs';

@Service()
export class BewerberApi {
  private http = inject(HttpClient);
  suche(q: string): Observable<string[]> { return this.http.get<string[]>('/api/bewerber', { params: { q } }); }
}

@Component({
  selector: 'app-bewerbersuche',
  template: \`
    <input class="suche" (input)="suche$.next($any($event.target).value)" />
    <p class="anzahl">{{ anzahl() }} Treffer</p>
    <ul>
      @for (n of treffer(); track $index) {
        <li>{{ n }}</li>
      }
    </ul>
    <p class="notiz">{{ notiz() }}</p>
  \`,
})
export class Bewerbersuche {
  private api = inject(BewerberApi);
  suche$ = new Subject<string>();
  treffer = toSignal(this.suche$.pipe(
    switchMap(q => this.api.suche(q).pipe(catchError(() => of([] as string[]))))
  ), { initialValue: [] as string[] });
  anzahl = computed(() => this.treffer().length);
  notiz = signal('<b>Leon</b> verlängert?');
}
`,
    notes: [['switchMap(q => this.api.suche(q)', 'Neue Suche bricht die alte ab. Kein Überholen mehr.'], ['catchError(() => of([] as string[]))', 'Fehler INNEN fangen. Sonst beendet ein einziger HTTP-Fehler die Suche für immer, und treffer() wirft beim Lesen.'], ["params: { q }", 'HttpClient encodiert den Suchbegriff. Mit + q würde ein & oder # die Anfrage zerlegen.'], ['toSignal(', 'Kein manuelles subscribe, räumt selbst auf.'], ['initialValue: [] as string[]', 'Typ statt any.'], ['anzahl = computed', 'Wird nur neu berechnet, wenn treffer sich ändert.'], ['track $index', 'Bleibt so. Namen sind nicht eindeutig, zwei Bewerber können Leon heißen. Ohne id ist $index hier ehrlich, die Liste wird bei jeder Suche ganz ersetzt. Liefert die API Objekte mit id, nimm track b.id.'], ['{{ notiz() }}', 'Als Text: Der Nutzer-Inhalt kann kein HTML einschleusen.']],
    hints: ['Suche: <code>treffer = toSignal(this.suche$.pipe(switchMap(q =&gt; this.api.suche(q).pipe(catchError(() =&gt; of([] as string[]))))), { initialValue: [] as string[] });</code>', 'Service: <code>this.http.get&lt;string[]&gt;(\'/api/bewerber\', { params: { q } })</code>', 'Anzahl: <code>anzahl = computed(() =&gt; this.treffer().length);</code>', 'Notiz: <code>&lt;p class="notiz"&gt;{{ notiz() }}&lt;/p&gt;</code>, DomSanitizer raus.'],
    tests: [
      { name: 'Suche zeigt Treffer', run: async T => { T.ng.backend.routes['GET /api/bewerber'] = ({ q }) => ['Leon', 'Lenny', 'Mo'].filter(n => n.toLowerCase().startsWith((q.get('q') || '').toLowerCase())); const f = T.mount(T.cmp('Bewerbersuche')); await f.type('.suche', 'le'); await T.flush(80); T.eq(f.qa('li').map(l => l.textContent.trim()), ['Leon', 'Lenny'], '„le“ soll Leon und Lenny finden.'); T.ok(/2\s*Treffer/.test(f.q('.anzahl').textContent), 'Anzeige: 2 Treffer.'); } },
      { name: 'Nur die neueste Suche zählt', run: async T => { const api = T.inject(T.get('BewerberApi')); api.suche = q => T.rx.timer(q === 'L' ? 90 : 10).pipe(T.op.map(() => [q + '-Treffer'])); const f = T.mount(T.cmp('Bewerbersuche')); await f.type('.suche', 'L'); await f.type('.suche', 'Le'); await T.flush(160); T.eq(f.qa('li').map(l => l.textContent.trim()), ['Le-Treffer'], 'Die alte Suche „L“ kam später an und hat „Le“ überschrieben. switchMap statt Abo im Abo!'); } },
      { name: 'Kein manuelles subscribe', run: T => { const m = T.code.match(/class\s+Bewerbersuche\b[\s\S]*$/); T.ok(m && !/\.subscribe\s*\(/.test(m[0]), 'In Bewerbersuche soll kein .subscribe( mehr stehen. toSignal(...) übernimmt das.'); } },
      { name: 'anzahl ist computed', run: T => { const f = T.mount(T.cmp('Bewerbersuche')); T.ok(T.isComputed(f.instance.anzahl), 'Es fehlt anzahl = computed(() => this.treffer().length).'); T.ok(!T.has(/zaehle\s*\(/), 'zaehle() raus.'); } },
      { name: 'Keine XSS-Lücke', run: T => { T.ok(!T.has(/bypassSecurityTrust/) && !T.has(/innerHTML/), 'bypassSecurityTrustHtml und [innerHTML] raus.'); const f = T.mount(T.cmp('Bewerbersuche')); T.ok(f.q('.notiz') && f.q('.notiz').textContent.includes('<b>Leon</b>') && !f.q('.notiz b'), 'Die Notiz soll als TEXT erscheinen: <p class="notiz">{{ notiz() }}</p>.'); } },
      { name: 'Ein Fehler beendet die Suche nicht', run: async T => { const api = T.inject(T.get('BewerberApi')); api.suche = q => q === 'x' ? T.rx.throwError(() => new Error('500')) : T.rx.of([q + '-Treffer']); const f = T.mount(T.cmp('Bewerbersuche')); await f.type('.suche', 'x'); await T.flush(20); T.eq(f.qa('li').length, 0, 'Nach einem Fehler soll die Liste leer sein, ohne Absturz. catchError(() => of([])) INNEN in switchMap.'); await f.type('.suche', 'Le'); await T.flush(20); T.eq(f.qa('li').map(l => l.textContent.trim()), ['Le-Treffer'], 'Nach einem Fehler soll die nächste Suche wieder gehen. Fängst du den Fehler innen, an this.api.suche(q).pipe(catchError(...))?'); } },
      { name: 'Suchbegriff kommt heil an', run: async T => { let came = null; T.ng.backend.routes['GET /api/bewerber'] = ({ q }) => { came = q.get('q'); return []; }; const f = T.mount(T.cmp('Bewerbersuche')); await f.type('.suche', 'Müller & Söhne'); await T.flush(80); T.eq(came, 'Müller & Söhne', 'Beim Server kam „' + came + '“ an. Das & zerlegt die URL. Schick den Begriff mit { params: { q } }.'); } },
      { name: 'Keine any mehr', run: T => { T.ok(!T.has(/\bany\b(?!\()/), 'any raus (außer $any im Template).'); } }
    ] },
  takeaway: ['Reihenfolge: korrekt, sicher, Lecks, Zustand, lesbar, schnell.', 'Kommentar: was, warum, Vorschlag, Muss/Nit/Frage.', 'Kleine PRs fordern, Lob nicht vergessen.', 'Typische Funde: Abo im Abo, subscribe ohne Ende, Methode im Template, bypassSecurityTrust, any.'],
  pairs: [
    ['1. Korrekt?', 'Race Conditions, Randfälle, Fehlerfall'],
    ['2. Sicher?', 'innerHTML, Geheimnisse, Rechte'],
    ['3. Lecks?', 'subscribe ohne Ende, Timer, Listener'],
    ['Nit', 'Kleinigkeit, kein Muss'],
    ['Guter Kommentar', 'Was, warum und ein Vorschlag']
  ]
});
