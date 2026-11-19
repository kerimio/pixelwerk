/* ================= Phase: FEST IM TEAM ================= */
AKTE.push({ n: 4, title: 'Fest im Team', sub: 'Was alles dabei ist, Router, Formulare, Change Detection, Tests' });

CH.push({
  id: 'g03', akt: 4, title: 'Was ist alles dabei?', tag: 'Batteries included', xp: 60,
  doku: [['Angular CLI im Überblick', 'https://angular.dev/tools/cli'], ['Style Guide (Dateinamen)', 'https://angular.dev/style-guide'], ['ng generate', 'https://angular.dev/cli/generate']],
  ticket: { id: 'PW-103', typ: 'Frage', titel: 'Warum nicht einfach React?', text: 'Ricky, unser Freelancer, fragt im Team-Chat, warum wir Angular benutzen. Bereite eine kurze Antwort vor.' },
  story: [
    ['ricky', 'Bei meiner alten Agentur Quick & Dirty haben wir React genommen. Da suchen wir uns alles selbst zusammen.'],
    ['toni', 'Kann man machen. Dann diskutiert jedes Team erst mal drei Wochen über Router und Formulare. Bei uns ist das schon entschieden.']
  ],
  slides: [
    { t: 'Alles aus einer Hand', say: 'Angular ist ein komplettes Paket. Fast alles, was eine große App braucht, ist eingebaut und vom selben Team gepflegt.',
      job: 'In React-Projekten liest du in der package.json oft 30 Bibliotheken für Router, Formulare und State. In Angular-Projekten kommt das meiste aus @angular/... und alles hat dieselbe Versionsnummer.',
      punkte: [['Komponenten + Templates', 'Bausteine für den Bildschirm.', ''], ['Signals', 'Werte, die den Bildschirm automatisch aktualisieren.', ''], ['Dependency Injection', 'Services an alle verteilen, die sie brauchen.', ''], ['Router', 'Verschiedene Seiten unter verschiedenen Adressen (/team, /tickets).', ''], ['Formulare', 'Eingaben, Prüfungen, Fehlermeldungen.', ''], ['HttpClient', 'Mit dem Server reden.', ''], ['Test-Werkzeuge', 'Prüfen, ob dein Code wirklich tut, was er soll.', ''], ['CLI', 'Kommandozeile: Projekt anlegen, starten, bauen, updaten.', ''], ['Mehrsprachigkeit (i18n)', 'Die App auf Deutsch, Englisch, Türkisch.', ''], ['SSR', 'Seiten schon auf dem Server bauen, für Tempo und Google.', '']],
      pro: 'Englisch heißt das „batteries included“: Batterien liegen bei. React ist dagegen nur die View-Schicht. Router, Formulare, HTTP sucht man sich dort aus vielen Bibliotheken zusammen.' },
    { t: 'Die CLI: dein Werkzeug im Terminal', say: 'Die Angular CLI ist ein Programm für die Kommandozeile. Sie legt Dateien an, startet die App und baut sie.',
      job: 'Im Job legst du neue Dateien fast nie von Hand an. ng generate component entwickler-liste erzeugt sie mit den richtigen Namen, und das ganze Team hat dieselbe Struktur.',
      punkte: [['ng new teamboard', 'Neues Projekt mit allem Drum und Dran.', ''], ['ng serve', 'App lokal starten. Jede Änderung ist sofort sichtbar.', ''], ['ng generate component team', 'Neue Komponente mit allen Dateien.', ''], ['ng build', 'Fertige Dateien für den echten Server.', ''], ['ng test', 'Alle Tests laufen lassen.', ''], ['ng update', 'Auf die nächste Angular-Version heben, inklusive automatischer Code-Umbauten.', '']],
      pro: 'ng update ist ein Riesenvorteil im Job: Angular liefert „Migrationen“ mit, die deinen Code automatisch auf neue Schreibweisen umbauen, z. B. *ngIf → @if (das startest du extra mit ng generate @angular/core:control-flow).' },
    { t: 'Ein Bauteil, vier Dateien', say: 'Eine Komponente besteht im echten Projekt meistens aus vier Dateien mit festen Namen.',
      job: 'Suchst du in einem fremden Projekt einen Bug in der Entwicklerliste, weißt du sofort: Logik in entwickler-liste.ts, Aussehen in .html, Stil in .css, Test in .spec.ts.',
      punkte: [['team.ts', 'Die Klasse mit Daten und Logik.', ''], ['team.html', 'Das Template.', ''], ['team.css', 'Das Aussehen nur für diese Komponente.', ''], ['team.spec.ts', 'Die Tests. „spec“ heißt Spezifikation: was es können muss.', '']],
      pro: 'In älteren Projekten heißen die Dateien team.component.ts usw. Seit Angular 20 lässt man das .component weg. Weil jedes Angular-Projekt so aussieht, findest du dich in jeder Firma schnell zurecht. Das ist ein Hauptgrund, warum große Firmen Angular mögen.' }
  ],
  quiz: [
    { q: 'Was bedeutet es, dass Angular „batteries included“ ist?', options: ['Angular bringt fertige Designs und Farben mit', 'Router, Formulare, HTTP und mehr sind schon dabei', 'Angular hat ein eigenes Backend eingebaut', 'Alle npm-Pakete sind schon vorinstalliert'], correct: 1, why: 'Alles Wichtige für eine große App kommt vom Angular-Team selbst und ist schon eingebaut.' },
    { q: 'Welcher Befehl startet deine App lokal zum Entwickeln?', options: ['ng build', 'ng new', 'ng serve', 'ng test'], correct: 2, why: 'Der Befehl ng serve startet einen Entwicklungs-Server und lädt die App bei jeder Änderung neu.' },
    { q: 'Wofür ist die Datei team.spec.ts in einem Angular-Projekt da?', options: ['Sie enthält die Styles der Komponente', 'Sie enthält die Tests der Komponente', 'Sie enthält die Typen (Interfaces) der Komponente', 'Sie enthält die Konfiguration für den Build'], correct: 1, why: 'Die Endung .spec.ts steht für Tests. Sie beschreiben, was die Komponente können muss.' }
  ],
  merke: ['Angular bringt alles mit: Router, Formulare, HTTP, Tests, CLI.', 'Die CLI (ng …) legt an, startet, baut, testet und updatet.', 'Jede Komponente: .ts, .html, .css, .spec.ts.', 'Gleiche Struktur überall → du findest dich in jedem Angular-Projekt zurecht.'],
  paare: [
    ['Router', 'Seiten unter verschiedenen Adressen'],
    ['HttpClient', 'Mit dem Server reden'],
    ['i18n', 'Die App in mehreren Sprachen'],
    ['<code>ng generate component</code>', 'Neue Komponente mit allen Dateien'],
    ['<code>.spec.ts</code>', 'Die Datei mit den Tests']
  ]
});

CH.push({
  id: 'k19', akt: 4, title: 'Das Agentur-Intranet', tag: 'Router', xp: 160,
  doku: [['Routen definieren', 'https://angular.dev/guide/routing/define-routes'], ['Zugriff auf Routen mit Guards steuern', 'https://angular.dev/guide/routing/route-guards'], ['Routen: Lade-Strategien', 'https://angular.dev/guide/routing/loading-strategies']],
  ticket: { id: 'PW-132', typ: 'Feature', titel: 'Teilbare Links und geschützter interner Bereich', text: 'Jede Seite braucht eine eigene Adresse (z. B. /entwickler/9). Der interne Bereich (Verträge, Gehälter) ist nur nach Login erreichbar.' },
  story: [
    ['erz', 'Probezeit bestanden, du bist fest im Team! Das Teamboard wächst zum Intranet: Team, Entwicklerprofile, Tickets und ein interner Bereich nur für Mitarbeiter.'],
    ['sara', 'Die Kollegen wollen Links teilen: pixelwerk.de/entwickler/9. Und der interne Bereich muss zu sein für Fremde.'],
    ['toni', 'Dafür gibt es den Router. Er schaut auf die Adresse und zeigt die richtige Seite. Und Guards stehen vor der Tür.']
  ],
  slides: [
    { t: 'Router = Wegweiser', say: 'Du schreibst eine Liste: Welcher Pfad zeigt welche Komponente. Angular tauscht die Seite, ohne neu zu laden.', job: 'In jedem Firmen-Projekt gibt es eine app.routes.ts. Willst du wissen, welche Komponente hinter einer URL steckt, schau zuerst dort.',
      code: C`
export const routes: Routes = [
  { path: '', redirectTo: 'team', pathMatch: 'full' },
  { path: 'team', component: TeamSeite },
  { path: 'tickets', component: TicketSeite },
  { path: '**', component: NichtGefunden },
];

// app.config.ts
providers: [provideRouter(routes)]

// app.html
<nav><a routerLink="/team">Team</a></nav>
<router-outlet />`,
      notes: [["path: ''", 'Die Startadresse (nur Domain). Leitet weiter auf /team.'], ["pathMatch: 'full'", 'Nur wenn der GANZE Pfad leer ist. Sonst würde jede Adresse umgeleitet.'], ["path: 'team'", 'Bei /team zeig TeamSeite.'], ["'**'", 'Alles andere: 404-Seite. Muss IMMER ganz unten stehen, der Router nimmt den ersten Treffer.'], ['provideRouter', 'Router für die App einschalten.'], ['routerLink', 'Link ohne Neuladen. Statt href.'], ['<router-outlet', 'Hier erscheint die aktuelle Seite.']],
      pro: 'Reihenfolge zählt! Der Router geht von oben nach unten und nimmt den ersten passenden Eintrag. ** oben = jede Seite ist 404.' },
    { t: 'Parameter: /entwickler/9', say: 'Ein Doppelpunkt im Pfad ist ein Platzhalter. Der Wert landet in deiner Komponente, ganz bequem als input().', job: 'Ein häufiger Bug: Die Seite zeigt den alten Entwickler, wenn man von /entwickler/9 zu /entwickler/10 wechselt. Mit input() aus der Route passiert das nicht, weil der Wert ein Signal ist.',
      code: C`
{ path: 'entwickler/:id', component: EntwicklerSeite }

// app.config.ts
provideRouter(routes, withComponentInputBinding())

export class EntwicklerSeite {
  id = input.required<string>();
  entwickler = computed(() => this.team.finde(+this.id()));
}`,
      notes: [[':id', 'Platzhalter. Bei /entwickler/9 ist id = "9".'], ['withComponentInputBinding', 'Schaltet ein, dass Parameter direkt als input() ankommen.'], ['input.required<string>()', 'Heißt genau wie der Platzhalter: id. Kommt immer als Text.'], ['+this.id()', 'Das + macht aus "9" die Zahl 9.']],
      pro: 'Ohne withComponentInputBinding liest man Parameter über inject(ActivatedRoute).paramMap. Das siehst du in älterem Code sehr oft.' },
    { t: 'Lazy Loading: erst laden, wenn nötig', say: 'Große Seiten lädt man erst, wenn jemand hingeht. Die App startet schneller.', job: 'Im Build-Log siehst du für jede lazy Route eine eigene Datei (Chunk). Wird main.js zu groß, ist Lazy Loading meist der erste Schritt.',
      code: C`
{
  path: 'tickets',
  loadComponent: () => import('./tickets/tickets').then(m => m.Tickets)
},
{
  path: 'admin',
  loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
}`,
      notes: [['loadComponent', 'Statt component: eine Funktion, die die Komponente nachlädt.'], ['import(', 'Dynamischer Import: Die Datei wird erst bei Bedarf vom Server geholt.'], ['m.Tickets', 'Aus der geladenen Datei die Komponente nehmen.'], ['loadChildren', 'Gleich einen ganzen Bereich mit eigenen Routen nachladen.']],
      pro: 'ng build legt für jede lazy Route eine eigene Datei an („Chunk“). Im Netzwerk-Tab siehst du sie erst laden, wenn du hinklickst.' },
    { t: 'Guards: Prüfung vor dem Betreten', say: 'Ein Guard ist eine Funktion, die vor dem Betreten gefragt wird. true = rein. Ein UrlTree = schick ihn woanders hin.', job: 'Ein Guard ist nur Komfort. Ein Pentester ruft die API direkt auf. Der Server muss jede geschützte Anfrage trotzdem selbst prüfen.',
      code: C`
export const nurMitarbeiter: CanActivateFn = () => {
  const auth = inject(Auth);
  if (auth.eingeloggt()) return true;
  return inject(Router).createUrlTree(['/login']);
};

{ path: 'intern', component: Intern, canActivate: [nurMitarbeiter] }`,
      notes: [['CanActivateFn', 'Der Typ für „darf man diese Seite betreten?“.'], ['inject(Auth)', 'Guards dürfen inject() benutzen.'], ['return true', 'Tür auf.'], ['createUrlTree', 'Tür zu, und gleich zur Login-Seite umleiten. Besser als false, sonst sieht man nur eine leere Seite.'], ['canActivate', 'Hier wird der Guard an die Route gehängt. Es können mehrere sein.']],
      pro: 'Das kennst du aus dem Kapitel „Sicherheit“: Guards schützen nur die ANSICHT, nicht die Daten. Es gibt auch canMatch (Route gar nicht erst finden) und canDeactivate (Seite verlassen, z. B. ungespeicherte Änderungen).' }
  ],
  quiz: [
    { q: 'An welcher Stelle der Routen-Liste muss die Route mit path: "**" stehen?', options: ['Ganz oben', 'Ganz unten', 'Das ist egal, der Router sucht den besten Treffer', 'Direkt nach der leeren Start-Route'], correct: 1, why: 'Der Router nimmt den ersten Treffer, und ** passt auf jeden Pfad. Stünde die Route weiter oben, kämen die Routen darunter nie dran.' },
    { q: 'Die Route hat den path "entwickler/:id", und jemand öffnet /entwickler/9. Welchen Wert hat id?', options: ['Die Zahl 9', 'Den Text "9"', 'Den Text "entwickler"', 'undefined'], correct: 1, why: 'Parameter aus der URL sind immer Text. Mit einem + davor machst du daraus eine Zahl.' },
    { q: 'Was sollte ein Guard zurückgeben, wenn jemand die Seite nicht betreten darf?', options: ['false', 'Einen UrlTree zur Login-Seite', 'Nichts, er wirft einen Fehler', 'null'], correct: 1, why: 'Bei false bricht der Router nur ab, und beim direkten Aufruf bleibt die Seite leer. Ein UrlTree schickt den Nutzer gleich zur Login-Seite.' }
  ],
  ex: { id: 'ex19', title: 'Die Pforte', goal: 'Bau die Routen fürs Intranet und die Zugangskontrolle vor dem internen Bereich.',
    todo: ['Leere Adresse leitet auf <code>team</code> um (<code>pathMatch: "full"</code>)', '<code>entwickler/:id</code> zeigt <code>EntwicklerSeite</code>, <code>login</code> zeigt <code>Login</code>', '<code>intern</code> zeigt <code>Intern</code>, geschützt durch <code>nurMitarbeiter</code>', 'Alles andere zeigt <code>NichtGefunden</code>', '<code>nurMitarbeiter</code>: eingeloggt → <code>true</code>, sonst UrlTree auf <code>/login</code>'],
    starter: C`
import { Component, Service, signal, inject } from '@angular/core';
import { Routes, Router, CanActivateFn } from '@angular/router';

@Component({ selector: 'app-team-seite', template: '<h2>Team</h2>' })
export class TeamSeite {}
@Component({ selector: 'app-entwickler-seite', template: '<h2>Entwickler</h2>' })
export class EntwicklerSeite {}
@Component({ selector: 'app-intern', template: '<h2>Intern</h2>' })
export class Intern {}
@Component({ selector: 'app-login', template: '<h2>Login</h2>' })
export class Login {}
@Component({ selector: 'app-nicht-gefunden', template: '<h2>404</h2>' })
export class NichtGefunden {}

@Service()
export class Auth {
  eingeloggt = signal(false);
}

export const nurMitarbeiter: CanActivateFn = () => {
  // eingeloggt? → true. Sonst → UrlTree auf '/login'
  return true;
};

export const routes: Routes = [
  { path: 'team', component: TeamSeite },
  // Deine Routen hier
];
`,
    solution: C`
import { Component, Service, signal, inject } from '@angular/core';
import { Routes, Router, CanActivateFn } from '@angular/router';

@Component({ selector: 'app-team-seite', template: '<h2>Team</h2>' })
export class TeamSeite {}
@Component({ selector: 'app-entwickler-seite', template: '<h2>Entwickler</h2>' })
export class EntwicklerSeite {}
@Component({ selector: 'app-intern', template: '<h2>Intern</h2>' })
export class Intern {}
@Component({ selector: 'app-login', template: '<h2>Login</h2>' })
export class Login {}
@Component({ selector: 'app-nicht-gefunden', template: '<h2>404</h2>' })
export class NichtGefunden {}

@Service()
export class Auth {
  eingeloggt = signal(false);
}

export const nurMitarbeiter: CanActivateFn = () => {
  if (inject(Auth).eingeloggt()) return true;
  return inject(Router).createUrlTree(['/login']);
};

export const routes: Routes = [
  { path: '', redirectTo: 'team', pathMatch: 'full' },
  { path: 'team', component: TeamSeite },
  { path: 'entwickler/:id', component: EntwicklerSeite },
  { path: 'login', component: Login },
  { path: 'intern', component: Intern, canActivate: [nurMitarbeiter] },
  { path: '**', component: NichtGefunden },
];
`,
    notes: [['inject(Auth).eingeloggt()', 'Signal lesen: Ist jemand eingeloggt?'], ['createUrlTree', 'Umleitung zur Login-Seite.'], ["path: ''", 'Start → team. pathMatch full nicht vergessen.'], ["'entwickler/:id'", 'Platzhalter für die Nummer.'], ['canActivate: [nurMitarbeiter]', 'Der Guard an der Tür zum internen Bereich.'], ["'**'", 'Ganz unten: alles andere.']],
    hints: ['Umleitung: <code>{ path: "", redirectTo: "team", pathMatch: "full" }</code>', 'Guard: <code>if (inject(Auth).eingeloggt()) return true; return inject(Router).createUrlTree(["/login"]);</code>', 'Die <code>"**"</code>-Route muss der letzte Eintrag sein.'],
    tests: [
      { name: 'Leere Adresse → team', run: T => { const m = T.match(T.get('routes'), '/'); T.ok(m && m.redirectedTo === '/team' && m.route.component === T.get('TeamSeite'), '"/" soll auf /team umleiten. Tipp: { path: "", redirectTo: "team", pathMatch: "full" }'); } },
      { name: '/entwickler/9 → EntwicklerSeite mit id', run: T => { const m = T.match(T.get('routes'), '/entwickler/9'); T.ok(m && m.route.component === T.get('EntwicklerSeite'), '/entwickler/9 soll EntwicklerSeite zeigen.'); T.eq(m.params.id, '9', 'Der Parameter soll :id heißen.'); } },
      { name: '/login → Login', run: T => { const m = T.match(T.get('routes'), '/login'); T.ok(m && m.route.component === T.get('Login'), '/login soll Login zeigen.'); } },
      { name: 'Interner Bereich ist geschützt', run: T => { const m = T.match(T.get('routes'), '/intern'); T.ok(m && m.route.component === T.get('Intern'), '/intern soll Intern zeigen.'); T.ok((m.route.canActivate || []).includes(T.get('nurMitarbeiter')), 'Die Intern-Route braucht canActivate: [nurMitarbeiter].'); } },
      { name: 'Unbekannt → 404, und ** steht unten', run: T => { const r = T.get('routes'); const m = T.match(r, '/quatsch/123'); T.ok(m && m.route.component === T.get('NichtGefunden'), 'Unbekannte Adressen sollen NichtGefunden zeigen.'); T.eq(r[r.length - 1].path, '**', 'Die "**"-Route muss ganz unten stehen.'); } },
      { name: 'Guard schickt Fremde zum Login', run: T => { T.inject(T.get('Auth')).eingeloggt.set(false); const r = T.inCtx(() => T.get('nurMitarbeiter')({}, {})); T.ok(T.isUrlTree(r, '/login'), 'Nicht eingeloggt → createUrlTree(["/login"]) zurückgeben.'); } },
      { name: 'Guard lässt Mitarbeiter rein', run: T => { T.inject(T.get('Auth')).eingeloggt.set(true); T.eq(T.inCtx(() => T.get('nurMitarbeiter')({}, {})), true, 'Eingeloggt → true.'); } }
    ] },
  merke: ['Routes = Liste Pfad → Komponente. Erster Treffer gewinnt, ** ganz unten.', ':id ist ein Platzhalter. Mit withComponentInputBinding kommt er als input().', 'loadComponent / loadChildren laden Seiten erst bei Bedarf.', 'Guard: true oder UrlTree. Schützt nur die Ansicht, nicht die Daten.'],
  paare: [
    ['<code>Routes</code>', 'Liste: welcher Pfad zeigt welche Komponente'],
    ['<code>:id</code>', 'Platzhalter im Pfad'],
    ['<code>**</code>', 'Fängt alles Unbekannte, steht ganz unten'],
    ['<code>loadComponent</code>', 'Lädt eine Seite erst bei Bedarf'],
    ['Guard', 'Prüft vor dem Betreten: true oder UrlTree']
  ]
});

CH.push({
  id: 'k20', akt: 4, title: 'Das Bewerbungsformular', tag: 'Reactive Forms · Validatoren', xp: 160,
  doku: [['Reactive Forms', 'https://angular.dev/guide/forms/reactive-forms'], ['Formulareingaben validieren', 'https://angular.dev/guide/forms/form-validation'], ['Signal Forms im Überblick', 'https://angular.dev/guide/forms/signals/overview']],
  ticket: { id: 'PW-133', typ: 'Feature', titel: 'Online-Bewerbung auf der Agentur-Website', text: 'Bewerber schicken ihre Daten online: Name, E-Mail, Alter. Fehler erst nach dem Verlassen des Feldes zeigen. Spam-Bewerbungen blocken.' },
  story: [
    ['sara', 'Akzeptanzkriterien: Pflichtfelder, gültige E-Mail, gültiges Alter. Und keine Fehler-Wand, bevor man überhaupt getippt hat.'],
    ['ricky', 'Ich meld mich zehnmal als „Quick & Dirty“ an. Hehe.'],
    ['toni', 'Nicht mit uns. Reactive Forms prüfen jede Eingabe. Und Ricky bekommt einen eigenen Validator.']
  ],
  slides: [
    { t: 'Reactive Forms: das Formular als Objekt', say: 'Bei Reactive Forms ist das Formular ein Objekt in TypeScript. Jedes Feld kennt seinen Wert, seine Regeln und seine Fehler. Das Template verbindet nur noch die Eingabefelder damit.', job: 'In Firmen-Apps sind Formulare oft die Hälfte der Arbeit: Anträge, Profile, Bestellungen. Fast alle Teams nutzen Reactive Forms, weil man sie gut testen kann.',
      punkte: [['Reactive Forms', 'Das lernst du hier. Gut testbar, im Bestandscode überall.', 'plus'], ['Template-driven (ngModel)', 'Ältere Art, alles steht im HTML. Siehst du in altem Code, hier brauchst du sie nicht.', ''], ['Signal Forms', 'Neu in Angular 22, auf Signals gebaut. Ausblick: Die übst du im Profi-Handwerk (Das Feedback-Formular).', '']],
      pro: 'Das Denken ist bei allen drei gleich: Feld, Regeln, Fehler. Wer Reactive Forms kann, kommt auch mit Signal Forms schnell zurecht.' },
    { t: 'FormControl & FormGroup', say: 'Ein FormControl ist EIN Feld mit Wert und Regeln. Eine FormGroup bündelt mehrere Felder.', job: 'form.valid entscheidet, ob der Absenden-Knopf aktiv ist. Ein typischer Bug: Der Knopf ist aktiv, obwohl ein verstecktes Feld ungültig ist. form.errors und jedes control.errors zeigen dir, welches.',
      code: C`
antrag = new FormGroup({
  name: new FormControl('', [Validators.required, Validators.minLength(2)]),
  email: new FormControl('', [Validators.required, Validators.email]),
});

// Template
<form [formGroup]="antrag" (ngSubmit)="senden()">
  <input formControlName="name" />
  <input formControlName="email" />
  <button [disabled]="antrag.invalid">Absenden</button>
</form>`,
      notes: [['new FormGroup', 'Die Gruppe: hier das ganze Formular.'], ["new FormControl('',", 'Ein Feld. Startwert: leerer Text.'], ['Validators.required', 'Regel: Pflichtfeld.'], ['minLength(2)', 'Regel: mindestens 2 Zeichen.'], ['[formGroup]', 'Verbindet das <form> mit der Gruppe.'], ['formControlName', 'Verbindet ein Eingabefeld mit einem Control, über den Namen.'], ['antrag.invalid', 'Ist irgendein Feld ungültig? Dann Knopf aus.']],
      pro: 'Dafür muss ReactiveFormsModule in imports der Komponente stehen. Und denk dran: [disabled] ist Komfort. Der Server prüft trotzdem.' },
    { t: 'Fehler zeigen', say: 'Jedes Control weiß, ob es gültig ist und welche Fehler es hat. Zeig sie erst, wenn der Nutzer das Feld schon angefasst hat.', job: 'UX-Regel, die QA prüft: Fehler erst zeigen, wenn das Feld touched ist. Sonst sieht der Nutzer beim Öffnen sofort fünf rote Meldungen.',
      code: C`
@let name = antrag.controls.name;
@if (name.touched && name.hasError('required')) {
  <p class="fehler">Name fehlt.</p>
}
@if (name.hasError('minlength')) {
  <p class="fehler">Mindestens 2 Buchstaben.</p>
}`,
      notes: [['@let name', '@let legt im Template eine Variable an. Hier ein kurzer Name für das Control, damit das Template lesbar bleibt.'], ['touched', 'Hat der Nutzer das Feld schon verlassen? Sonst ist am Anfang alles rot.'], ["hasError('required')", 'Gibt es genau diesen Fehler?'], ["'minlength'", 'Achtung: Der Fehlername ist klein geschrieben, der Validator heißt minLength.']],
      pro: 'Wichtige Zustände: valid/invalid, touched (verlassen), dirty (geändert), pending (async Prüfung läuft). Und form.markAllAsTouched() beim Absenden, damit alle Fehler sichtbar werden.' },
    { t: 'Eigene Validatoren', say: 'Ein Validator ist nur eine Funktion: Sie bekommt das Control und gibt null (alles gut) oder ein Fehler-Objekt zurück.', job: 'Eigene Validatoren gibt es in jedem Firmen-Projekt: IBAN, Postleitzahl, „Enddatum nach Startdatum“. Sie sind reine Funktionen und darum leicht zu testen.',
      code: C`
export const keinRivale: ValidatorFn = (control) => {
  const text = String(control.value ?? '').toLowerCase();
  return text.includes('quick & dirty') ? { rivale: true } : null;
};

name: new FormControl('', [Validators.required, keinRivale])`,
      notes: [['ValidatorFn', 'Der Typ: Funktion, die ein Control bekommt.'], ['control.value ?? ', '?? heißt: wenn value null ist, nimm einen leeren Text. So stürzt nichts ab.'], ['{ rivale: true }', 'Fehler-Objekt. Der Name (rivale) ist frei wählbar.'], [': null', 'null heißt: alles gut.'], ['keinRivale]', 'Einfach in die Liste der Validatoren.']],
      pro: 'Es gibt auch Gruppen-Validatoren (Passwort = Wiederholung) und asynchrone Validatoren, die beim Server nachfragen (ist der Name schon vergeben?). Ausblick: Mit Signal Forms stehen die Regeln als Funktionen wie required(feld.name) an einer Stelle. Das kommt im Profi-Handwerk.' }
  ],
  quiz: [
    { q: 'Was gibt ein Validator zurück, wenn der Wert gültig ist?', options: ['true', 'null', '{ ok: true }', 'false'], correct: 1, why: 'null bedeutet: kein Fehler. Ein Objekt bedeutet: Es gibt einen Fehler.' },
    { q: 'Wann zeigt man die Fehlermeldung eines Formularfelds üblicherweise an?', options: ['Sofort beim Laden der Seite', 'Sobald das Feld touched ist', 'Nur, wenn das ganze Formular invalid ist', 'Bei jedem Tastendruck, schon vor dem ersten Verlassen'], correct: 1, why: 'Sonst wäre das Formular schon beim Öffnen voller roter Meldungen.' },
    { q: 'Wann gilt eine FormGroup als valid?', options: ['Wenn mindestens ein Feld gültig ist', 'Wenn ALLE Felder gültig sind', 'Sobald sie dirty ist', 'Wenn sie touched ist'], correct: 1, why: 'Das Formular ist erst bereit zum Absenden, wenn jedes Feld gültig ist.' }
  ],
  ex: { id: 'ex20', title: 'Das Bewerbungsformular', goal: 'Bau das Bewerbungsformular mit Regeln und zeig den Fehler erst, wenn das Feld verlassen wurde. Und halt Ricky draußen.', preview: 'Bewerbung',
    todo: ['<code>keinRivale</code>: enthält der Wert „quick & dirty“ (egal ob groß/klein) → <code>{ rivale: true }</code>, sonst <code>null</code>', '<code>neuerAntrag()</code> gibt eine <code>FormGroup</code> mit <code>name</code>, <code>email</code>, <code>alter</code> zurück', '<code>name</code>: Pflicht, mind. 2 Zeichen, <code>keinRivale</code>', '<code>email</code>: Pflicht, gültige E-Mail', '<code>alter</code>: Pflicht, mindestens 6', 'Im Template der Komponente <code>Bewerbung</code>: Ist <code>name</code> touched und fehlt, steht darunter <code>&lt;p class="fehler"&gt;Name fehlt.&lt;/p&gt;</code>'],
    starter: C`
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, ValidatorFn, ReactiveFormsModule } from '@angular/forms';

export const keinRivale: ValidatorFn = (control) => {
  return null;
};

export function neuerAntrag() {
  return new FormGroup({
    name: new FormControl(''),
    // email und alter fehlen noch
  });
}

@Component({
  selector: 'app-bewerbung',
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="antrag">
      <label>Name <input class="name" formControlName="name" /></label>
      <!-- Hier die Fehlermeldung: erst nach dem Verlassen -->
    </form>
  \`,
})
export class Bewerbung {
  antrag = neuerAntrag();
}
`,
    solution: C`
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, ValidatorFn, ReactiveFormsModule } from '@angular/forms';

export const keinRivale: ValidatorFn = (control) => {
  const text = String(control.value ?? '').toLowerCase();
  return text.includes('quick & dirty') ? { rivale: true } : null;
};

export function neuerAntrag() {
  return new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2), keinRivale]),
    email: new FormControl('', [Validators.required, Validators.email]),
    alter: new FormControl<number | null>(null, [Validators.required, Validators.min(6)]),
  });
}

@Component({
  selector: 'app-bewerbung',
  imports: [ReactiveFormsModule],
  template: \`
    <form [formGroup]="antrag">
      <label>Name <input class="name" formControlName="name" /></label>
      @let name = antrag.controls.name;
      @if (name.touched && name.hasError('required')) {
        <p class="fehler">Name fehlt.</p>
      }
    </form>
  \`,
})
export class Bewerbung {
  antrag = neuerAntrag();
}
`,
    notes: [['toLowerCase', 'Alles klein machen, dann ist „Quick & Dirty“ = „quick & dirty“.'], ['{ rivale: true }', 'Der Fehler.'], ['minLength(2), keinRivale', 'Mehrere Regeln einfach in die Liste.'], ['Validators.email', 'Prüft, ob es wie eine E-Mail aussieht.'], ['FormControl<number | null>(null', 'Startwert null, Typ: Zahl oder nichts.'], ['Validators.min(6)', 'Mindestens 6 Jahre.'], ['@let name', 'Kurzer Name für das Control im Template.'], ["name.touched && name.hasError('required')", 'Beides muss stimmen: Das Feld wurde verlassen UND es ist leer. Vorher bleibt es ruhig.'], ['<p class="fehler">', 'Die Meldung erscheint erst dann.']],
    hints: ['Validatoren kommen als zweites Argument: <code>new FormControl("", [Validators.required, ...])</code>', 'keinRivale: <code>String(control.value ?? "").toLowerCase().includes("quick & dirty")</code>', 'Im Template: <code>@if (antrag.controls.name.touched &amp;&amp; antrag.controls.name.hasError(\'required\')) { … }</code>. touched wird true, sobald das Feld den Fokus verliert.'],
    tests: [
      { name: 'keinRivale erkennt Ricky', run: T => { const v = T.get('keinRivale'); const F = T.ng.modules['@angular/forms']; T.eq(v(new F.FormControl('Ricky von QUICK & DIRTY')), { rivale: true }, '"Quick & Dirty" in egal welcher Schreibweise → { rivale: true }.'); T.eq(v(new F.FormControl('Leon')), null, 'Normaler Name → null.'); T.eq(v(new F.FormControl(null)), null, 'Bei null darf nichts abstürzen → null.'); } },
      { name: 'Formular hat name, email, alter', run: T => { const f = T.get('neuerAntrag')(); T.ok(f && f.controls, 'neuerAntrag() soll eine FormGroup zurückgeben.'); T.eq(Object.keys(f.controls).sort(), ['alter', 'email', 'name'], 'Es braucht genau name, email und alter.'); } },
      { name: 'Leeres Formular ist ungültig', run: T => { const f = T.get('neuerAntrag')(); T.ok(f.invalid, 'Leer darf es nicht gültig sein.'); T.ok(f.hasError('required', 'name') && f.hasError('required', 'email') && f.hasError('required', 'alter'), 'Alle drei Felder brauchen Validators.required.'); } },
      { name: 'Name: mind. 2 Zeichen, kein Rivale', run: T => { const f = T.get('neuerAntrag')(); const n = f.get('name'); n.setValue('L'); T.ok(n.hasError('minlength'), '"L" ist zu kurz → minLength(2).'); n.setValue('Quick & Dirty Ricky'); T.ok(n.hasError('rivale'), 'keinRivale gehört auch an name.'); n.setValue('Leon'); T.ok(n.valid, '"Leon" soll gültig sein.'); } },
      { name: 'E-Mail wird geprüft', run: T => { const e = T.get('neuerAntrag')().get('email'); e.setValue('leon'); T.ok(e.hasError('email'), '"leon" ist keine E-Mail → Validators.email.'); e.setValue('leon@pixelwerk.de'); T.ok(e.valid, 'Echte E-Mail soll gültig sein.'); } },
      { name: 'Alter mindestens 6', run: T => { const a = T.get('neuerAntrag')().get('alter'); a.setValue(5); T.ok(a.hasError('min'), '5 ist zu jung → Validators.min(6).'); a.setValue(16); T.ok(a.valid, '16 soll gültig sein.'); } },
      { name: 'Fehler erst nach dem Verlassen', run: async T => { const f = T.mount(T.cmp('Bewerbung')); T.ok(f.q('input.name'), 'Im Template fehlt <input class="name" formControlName="name">.'); T.ok(!f.q('p.fehler'), 'Beim Öffnen soll noch kein Fehler zu sehen sein. Prüfst du touched?'); f.q('input.name').dispatchEvent(new Event('blur')); await T.flush(); const p = f.q('p.fehler'); T.ok(p && /Name fehlt/.test(p.textContent), 'Nach dem Verlassen des leeren Namens soll <p class="fehler">Name fehlt.</p> erscheinen. Prüfst du name.touched und hasError(\'required\')?'); await f.type('input.name', 'Leon'); T.ok(!f.q('p.fehler'), 'Mit „Leon“ im Feld soll die Meldung wieder verschwinden.'); } },
      { name: 'Alles richtig → Formular gültig', run: T => { const f = T.get('neuerAntrag')(); T.eq(Object.keys(f.controls).length, 3, 'Erst alle drei Felder anlegen.'); f.setValue({ name: 'Leon', email: 'leon@pixelwerk.de', alter: 23 }); T.ok(f.valid, 'Mit gültigen Werten soll das ganze Formular valid sein.'); } }
    ] },
  merke: ['FormControl = ein Feld, FormGroup = mehrere. Gruppe ist nur valid, wenn alle valid sind.', 'Validatoren: required, minLength, email, min … als Liste.', 'Eigener Validator: Funktion → null (gut) oder { fehler: true }.', 'Fehler erst zeigen, wenn touched.'],
  paare: [
    ['FormControl', 'Ein Feld mit Wert und Regeln'],
    ['FormGroup', 'Bündelt Felder, gültig nur, wenn alle gültig sind'],
    ['<code>Validators.required</code>', 'Das Feld darf nicht leer sein'],
    ['Eigener Validator', 'Gibt null oder ein Fehler-Objekt zurück'],
    ['<code>touched</code>', 'Schon angefasst: jetzt Fehler zeigen']
  ]
});

CH.push({
  id: 'k21', akt: 4, title: 'Die hängende Stoppuhr', tag: 'Change Detection · Zoneless', xp: 160,
  doku: [['Angular ohne Zone.js (Zoneless)', 'https://angular.dev/guide/zoneless'], ['OnPush: Teilbäume überspringen', 'https://angular.dev/best-practices/skipping-subtrees'], ['ChangeDetectionStrategy: OnPush und Eager', 'https://angular.dev/api/core/ChangeDetectionStrategy']],
  ticket: { id: 'PW-134', typ: 'Bug', titel: 'Stoppuhr springt nur bei Klick weiter', text: 'Die Stoppuhr in der Zeiterfassung bleibt stehen und springt erst weiter, wenn man irgendwo klickt. Seit der Umstellung auf zoneless.' },
  story: [
    ['leon', 'Die Stoppuhr in der Zeiterfassung hängt! Sie springt erst weiter, wenn ich irgendwo klicke. So kann ich keine Stunden für den Kunden buchen.'],
    ['toni', 'Klassiker nach der Umstellung auf zoneless. Angular hat gar nicht gemerkt, dass sich was geändert hat. Wir schauen uns an, wann Angular überhaupt hinschaut.']
  ],
  slides: [
    { t: 'Change Detection: wann Angular hinschaut', say: 'Change Detection heißt: Angular prüft, ob sich Daten geändert haben, und malt dann den Bildschirm neu. Aber nur, wenn es einen Grund hat hinzuschauen.', job: '„Wird erst nach Klick aktualisiert“ ist ein Bug-Ticket, das du in jedem Angular-Team sehen wirst. Die Ursache ist fast immer Change Detection.',
      punkte: [['Signal ändert sich', 'Ein Signal, das im Template gelesen wird, bekommt set/update.', 'plus'], ['Ereignis im Template', 'Ein (click), (input) usw. wurde ausgelöst.', 'plus'], ['async-Pipe', 'Ein Observable im Template liefert einen neuen Wert.', 'plus'], ['markForCheck()', 'Man ruft Angular per Hand.', ''], ['Normales Feld in setTimeout/setInterval', 'Angular merkt NICHTS. Der Bildschirm bleibt alt.', 'minus']],
      pro: 'Genau das ist Leons Bug: minute++ in einem setInterval ist ein normales Feld. Kein Signal, kein Ereignis, also kein Grund für Angular hinzuschauen.' },
    { t: 'Früher: Zone.js', say: 'Früher hat Angular mit Zone.js alle Browser-Funktionen „verwanzt“: setTimeout, Klicks, fetch. Nach JEDEM davon hat Angular die GANZE App geprüft (nur OnPush-Teile ohne Änderung durften aussetzen).', job: 'Viele Firmen-Apps laufen noch mit Zone.js. Dort funktioniert der Bug von oben „zufällig“. Bei der Migration auf zoneless tauchen dann plötzlich viele solche Tickets auf.',
      punkte: [['Vorteil', 'Alles „funktionierte einfach“, auch normale Felder.', 'plus'], ['Nachteil', 'Viel unnötige Arbeit, langsam bei großen Apps, schwer zu debuggen.', 'minus'], ['Heute: Zoneless', 'Neue Projekte (seit Angular 21) laufen ohne Zone.js. Angular schaut nur bei echten Gründen hin.', 'plus']],
      pro: 'Im alten Code siehst du NgZone, zone.js in polyfills und ChangeDetectorRef.detectChanges(). In neuem Code: Signals überall. provideZonelessChangeDetection() brauchte man nur in Angular 20, seit 21 ist zoneless der Standard.' },
    { t: 'Der Bug und die Lösung', say: 'Mach aus dem normalen Feld ein Signal. Dann sagt es Angular selbst Bescheid.', job: 'Die Lösung im Job ist fast immer gleich: Wert in ein Signal packen. Ein ChangeDetectorRef.detectChanges() im Code ist meist nur ein Pflaster.',
      code: C`
// Bug: Bildschirm bleibt bei 0
minute = 0;
uhr = setInterval(() => this.minute++, 60_000);

// Lösung
minute = signal(0);
uhr = setInterval(() => this.minute.update(m => m + 1), 60_000);

// Template: {{ minute() }}`,
      notes: [['minute = 0', 'Normales Feld. Ändert sich still und heimlich.'], ['this.minute++', 'Angular bekommt davon nichts mit. 60_000 ist einfach 60000 Millisekunden, also eine Minute. Der Unterstrich dient nur der Lesbarkeit, wie ein Tausenderpunkt.'], ['signal(0)', 'Signal: meldet jede Änderung.'], ['update(m => m + 1)', 'Jetzt weiß Angular: Das Template muss neu.'], ['{{ minute() }}', 'Mit Klammern lesen, wie immer.']],
      pro: 'Und Aufräumen nicht vergessen: setInterval läuft sonst weiter, auch wenn die Komponente weg ist. ngOnDestroy ist eine Methode, die Angular aufruft, wenn die Komponente verschwindet. Dort kommt clearInterval hin, oder du nimmst inject(DestroyRef).onDestroy(...). Mehr zum Lebenslauf einer Komponente kommt in „Eine Karte für alle“.' },
    { t: 'OnPush: nur bei Bedarf prüfen', say: 'Mit OnPush sagt eine Komponente: Prüf mich nur, wenn sich meine Inputs, meine Signals oder meine Ereignisse ändern.', job: 'In Projekten von vor Angular 22 steht OnPush ausdrücklich im Decorator. Fehlt es dort, kommt im Review ein Kommentar.',
      code: C`
@Component({
  selector: 'app-stundenliste',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`...\`
})`,
      notes: [['changeDetection', 'Hier stellt man die Strategie ein.'], ['OnPush', 'Nur bei echten Gründen prüfen. Mit Signals ist das automatisch richtig.']],
      pro: 'Faustregel für 2026: Alles mit Signals, überall OnPush. Dann ist deine App schnell und du hast nie wieder „hängende“ Anzeigen. Seit Angular 22 ist OnPush der Standard, du musst es nicht mehr hinschreiben (oben steht es nur zur Erklärung). Der alte Modus heißt jetzt ChangeDetectionStrategy.Eager. ng update trägt Eager bei alten Komponenten ein, damit nichts kaputtgeht. Siehst du Eager im Code, ist das ein Kandidat zum Aufräumen.' }
  ],
  quiz: [
    { q: 'Ein normales Feld der Klasse (kein Signal) ändert sich in einem setTimeout. Was passiert auf dem Bildschirm, wenn die App ohne Zone.js läuft?', options: ['Der Bildschirm aktualisiert sich sofort', 'Nichts, Angular merkt die Änderung nicht', 'Angular wirft einen Fehler in der Konsole', 'Angular prüft beim nächsten Frame von selbst'], correct: 1, why: 'Ohne Signal und ohne Ereignis hat Angular keinen Grund hinzuschauen.' },
    { q: 'Was hat Zone.js früher für Angular erledigt?', options: ['Nur Komponenten mit Signals geprüft', 'Nach jedem Ereignis (Klick, Timer, HTTP) die ganze App geprüft', 'Normale Felder automatisch in Signals umgewandelt', 'Nur beim Neuladen der Seite geprüft'], correct: 1, why: 'Zone.js hat setTimeout, Klicks und fetch abgefangen und danach die ganze App prüfen lassen. Das war bequem, machte aber viel unnötige Arbeit.' },
    { q: 'Leons Stoppuhr zählt das Feld <code>minute</code> in einem setInterval hoch, aber der Bildschirm bleibt stehen. Was ist die beste Lösung?', options: ['In jedem Tick ChangeDetectorRef.detectChanges() aufrufen', 'minute zu einem signal() machen und mit update() hochzählen', 'Zone.js wieder einbauen', 'Die Komponente auf Eager umstellen'], correct: 1, why: 'Ein Signal meldet jede Änderung selbst an Angular. detectChanges und Zone.js sind nur Pflaster.' }
  ],
  ex: { id: 'ex21', title: 'Die hängende Stoppuhr', goal: 'Die Uhr hängt, weil Angular die Änderung nicht merkt. Reparier sie mit Signals und räum am Ende auf. (In der Übung ist eine Minute nur 0,1 Sekunden lang.)', preview: 'LiveUhr',
    todo: ['<code>minute</code>, <code>erledigt</code> und <code>offen</code> werden zu Signals', 'Die Uhr tickt sichtbar weiter, ohne dass jemand klickt', 'Der Erledigt-Knopf zählt weiter', 'In <code>ngOnDestroy</code> die Uhr stoppen: <code>clearInterval(this.uhr)</code>. Diese Methode ruft Angular auf, wenn die Komponente verschwindet. <code>implements OnDestroy</code> verspricht TypeScript, dass es sie gibt. Mehr dazu im Kapitel „Eine Karte für alle“'],
    starter: C`
import { Component, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-live-uhr',
  template: \`
    <p class="min">{{ minute }}'</p>
    <p class="stand">{{ erledigt }} : {{ offen }}</p>
    <button class="fertig" (click)="fertig()">Ticket erledigt</button>
  \`,
})
export class LiveUhr implements OnDestroy {
  minute = 0;
  erledigt = 0;
  offen = 0;

  uhr = setInterval(() => this.minute++, 100);

  fertig() {
    this.erledigt++;
  }

  ngOnDestroy() {
    // Uhr stoppen!
  }
}
`,
    solution: C`
import { Component, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-live-uhr',
  template: \`
    <p class="min">{{ minute() }}'</p>
    <p class="stand">{{ erledigt() }} : {{ offen() }}</p>
    <button class="fertig" (click)="fertig()">Ticket erledigt</button>
  \`,
})
export class LiveUhr implements OnDestroy {
  minute = signal(0);
  erledigt = signal(0);
  offen = signal(0);

  uhr = setInterval(() => this.minute.update(m => m + 1), 100);

  fertig() {
    this.erledigt.update(h => h + 1);
  }

  ngOnDestroy() {
    clearInterval(this.uhr);
  }
}
`,
    notes: [['{{ minute() }}', 'Im Template jetzt mit Klammern lesen.'], ['signal(0)', 'Alle drei Werte als Signals.'], ['this.minute.update', 'Jede Minute meldet sich bei Angular.'], ['this.erledigt.update', 'Erledigte Tickets zählen per update.'], ['clearInterval', 'Uhr stoppen, wenn die Komponente verschwindet. Sonst läuft sie ewig im Hintergrund.']],
    hints: ['Aus <code>minute = 0</code> wird <code>minute = signal(0)</code>. Im Template dann <code>{{ minute() }}</code>.', '<code>this.minute++</code> wird zu <code>this.minute.update(m => m + 1)</code>.', 'In ngOnDestroy: <code>clearInterval(this.uhr);</code>'],
    tests: [
      { name: 'Uhr tickt ohne Klick', run: async T => { const f = T.mount(T.cmp('LiveUhr')); await T.flush(380); const m = parseInt(f.q('.min').textContent, 10); T.ok(m >= 2, 'Nach 0,4 Sekunden steht immer noch ' + m + '. Angular merkt die Änderung nicht. Mach minute zu einem Signal.'); } },
      { name: 'Erledigt-Knopf zählt', run: async T => { const f = T.mount(T.cmp('LiveUhr')); await f.click('.fertig'); await f.click('.fertig'); T.eq(f.q('.stand').textContent.replace(/\s/g, ''), '2:0', 'Nach zwei erledigten Tickets soll 2 : 0 stehen.'); } },
      { name: 'Alle Werte sind Signals', run: T => { const f = T.mount(T.cmp('LiveUhr')); const i = f.instance; T.ok(['minute', 'erledigt', 'offen'].every(k => T.isSignal(i[k])), 'minute, erledigt und offen sollen Signals sein.'); } },
      { name: 'Uhr stoppt beim Verlassen', run: async T => { const f = T.mount(T.cmp('LiveUhr')); await T.flush(150); const i = f.instance; T.ok(typeof i.minute === 'function', 'minute soll ein Signal sein.'); f.destroy(); const vorher = i.minute(); await T.flush(300); T.eq(i.minute(), vorher, 'Nach destroy tickt die Uhr weiter. clearInterval(this.uhr) in ngOnDestroy!'); } }
    ] },
  merke: ['Angular schaut nur hin bei: Signal-Änderung, Template-Ereignis, async-Pipe, markForCheck.', 'Normales Feld in setTimeout/setInterval → Bildschirm bleibt alt.', 'Früher Zone.js (prüft alles), heute Zoneless + Signals.', 'Signals + OnPush überall. Timer immer aufräumen.'],
  paare: [
    ['Change Detection', 'Angular prüft Daten und malt neu'],
    ['Zone.js', 'Prüfte früher nach jedem Klick und Timer'],
    ['Zoneless', 'Angular schaut nur bei echtem Grund hin'],
    ['OnPush', 'Prüf mich nur bei Inputs, Signals und Ereignissen'],
    ['Normales Feld in <code>setInterval</code>', 'Der Bildschirm bleibt alt']
  ]
});

CH.push({
  id: 'k22', akt: 4, title: 'Das falsche Ranking', tag: 'Testing', xp: 180,
  doku: [['Testen im Überblick (Vitest, ng test)', 'https://angular.dev/guide/testing'], ['Komponenten testen mit TestBed', 'https://angular.dev/guide/testing/components-basics'], ['Von Karma auf Vitest umsteigen', 'https://angular.dev/guide/testing/migrating-to-vitest']],
  ticket: { id: 'PW-135', typ: 'Bug', titel: 'Ranking zeigt falsche Punkte', text: 'Nach einer „Verbesserung“ der Punkte-Berechnung stand Pixelwerk im Agentur-Ranking auf Platz 1. Es war falsch. Schreib Tests, die so etwas künftig auffangen.' },
  story: [
    ['boss', 'Letzte Woche hat jemand die Punkte-Berechnung im Pitch-Ranking „verbessert“. Wir standen auf Platz 1 und ich hab es dem Kunden gezeigt. Leider falsch. Und das vor dem großen Pitch.'],
    ['mia', 'Das hätte ein Test in zwei Sekunden gefunden.'],
    ['toni', 'Darum schreibst du jetzt die Tests selbst. Danach baue ich heimlich Fehler ein. Deine Tests müssen jeden finden.']
  ],
  slides: [
    { t: 'Warum Tests?', say: 'Ein Test ist Code, der deinen Code prüft. Ändert jemand etwas und macht dabei was kaputt, wird der Test rot. Sofort, nicht erst beim Kunden.', job: 'In fast jeder Firma gilt: Ohne Tests kein Merge. Die Pipeline lässt alle Tests laufen, und ist einer rot, kommt dein PR nicht rein.',
      punkte: [['Unit-Tests', 'Viele, klein, schnell. Eine Funktion, ein Service, eine Komponente.', ''], ['Integrations-Tests', 'Mehrere Teile zusammen, z. B. Komponente + Service.', ''], ['E2E-Tests', 'Wenige, langsam. Ein echter Browser klickt durch die App (z. B. mit Playwright).', ''], ['Testpyramide', 'Unten viele Unit-Tests, oben wenige E2E-Tests.', '']],
      pro: 'Seit Angular 21 ist Vitest der Standard-Testrunner (vorher Karma/Jasmine). Alte Jasmine-Tests schreibt ng generate @schematics/angular:refactor-jasmine-vitest auf Vitest um. Befehl: ng test. Die Schreibweise describe/it/expect ist bei allen fast gleich.' },
    { t: 'So sieht ein Test aus', say: 'describe = Gruppe, it = ein einzelner Test, expect = „ich erwarte, dass …“.', job: 'Bei einem Bug-Ticket schreibt man im Job zuerst einen Test, der den Bug zeigt (rot). Dann repariert man den Code (grün). So kommt der Bug nie zurück.',
      code: C`
import { describe, it, expect } from 'vitest';
import { punkte } from './ranking';

describe('punkte', () => {
  it('ein gewonnener Pitch gibt 3 Punkte', () => {
    // vorbereiten
    const gewonnen = 1;
    // ausführen
    const ergebnis = punkte(gewonnen, 0, 0);
    // prüfen
    expect(ergebnis).toBe(3);
  });
});`,
      notes: [["from 'vitest'", 'Die Test-Werkzeuge.'], ["describe('punkte'", 'Eine Gruppe von Tests für eine Sache.'], ["it('ein gewonnener Pitch", 'Ein Test. Der Text sagt, was erwartet wird. Lies es als Satz.'], ['vorbereiten', 'Arrange: Ausgangslage herstellen.'], ['ausführen', 'Act: das Ding tun, das man testet.'], ['expect(ergebnis).toBe(3)', 'Assert: Ist das Ergebnis genau 3?']],
      pro: 'Wichtige Prüfungen: toBe (genau gleich, für Zahlen/Text), toEqual (gleicher Inhalt, für Objekte/Listen), toBeTruthy, toContain, toThrow. Und .not davor dreht alles um: expect(x).not.toBe(0).' },
    { t: 'Gute Tests finden Fehler', say: 'Ein Test, der nie rot wird, bringt nichts. Teste vor allem die Grenzen: genau an der Kante passieren die Fehler.', job: 'Die meisten echten Bugs sitzen an Grenzen: genau 0, genau 16 Jahre, leere Liste, letzter Tag im Monat. Gute Tests prüfen genau diese Stellen.',
      punkte: [['Normalfall', 'punkte(2, 1, 0) ist 7.', ''], ['Jeder Teil einzeln', 'Nur geteilte, nur verlorene Pitches. Zählt jeder Teil richtig?', ''], ['Grenzen', 'Platz 15 bleibt drin, Platz 16 fliegt raus. Beide testen!', 'plus'], ['Null-Fälle', 'punkte(0, 0, 0) ist 0.', ''], ['Ein Ding pro Test', 'Wird er rot, weißt du sofort, was kaputt ist.', 'plus']],
      pro: 'Profi-Trick „Mutation Testing“: Man baut absichtlich Fehler in den Code. Wird dann kein Test rot, fehlen Tests. Genau das macht gleich die Übung mit deinen Tests.' },
    { t: 'Komponenten testen mit TestBed', say: 'Für Angular-Teile gibt es TestBed: eine Mini-App nur für den Test. Damit baust du eine Komponente, klickst und prüfst den Bildschirm.', job: 'Komponenten-Tests laufen im Job meist mit TestBed. Für ganze Abläufe im echten Browser nimmt man zusätzlich ein E2E-Werkzeug wie Playwright.',
      code: C`
it('zählt Tickets', async () => {
  const fixture = TestBed.createComponent(SprintZaehler);
  await fixture.whenStable();

  fixture.nativeElement.querySelector('button').click();
  await fixture.whenStable();

  expect(fixture.nativeElement.textContent).toContain('1');
});`,
      notes: [['TestBed.createComponent', 'Baut die Komponente in der Test-App.'], ['whenStable', 'Warten, bis Angular fertig gemalt hat.'], ['nativeElement', 'Das echte HTML-Element der Komponente.'], ['.click()', 'Klick simulieren.'], ["toContain('1')", 'Steht irgendwo eine 1?']],
      pro: 'Services mit HTTP testest du mit provideHttpClientTesting() und HttpTestingController: Du sagst „auf GET /api/entwickler antworte mit dieser Liste“ und prüfst, was der Service daraus macht. Kein echter Server nötig, danke Dependency Injection.' }
  ],
  quiz: [
    { q: 'Was ist in einem Test der Unterschied zwischen toBe und toEqual?', options: ['Es gibt keinen, beide prüfen den Inhalt', 'toBe prüft, ob es exakt dasselbe ist, toEqual prüft bei Objekten den Inhalt', 'toEqual vergleicht nur die Länge', 'toBe ist nur für Text erlaubt'], correct: 1, why: 'Zwei verschiedene Objekte mit gleichem Inhalt bestehen toEqual, aber nicht toBe.' },
    { q: 'Wer auf Platz 16 oder schlechter steht, fliegt aus dem Ranking. Welche Plätze MUSST du testen?', options: ['Platz 1 und Platz 18', 'Nur Platz 16', 'Platz 15 und Platz 16, also die Grenze', 'Die Plätze 17 und 18'], correct: 2, why: 'An der Grenze passieren die Fehler. Der Test für Platz 16 findet ein „>“ statt „>=“, der Test für Platz 15 findet eine Grenze, die eins zu früh liegt.' },
    { q: 'Von welcher Art Tests sollte es nach der Testpyramide am meisten geben?', options: ['E2E-Tests', 'Unit-Tests', 'Integrations-Tests', 'Von allen Arten gleich viele'], correct: 1, why: 'Unit-Tests sind schnell und billig. E2E-Tests sind langsam, darum gibt es davon nur wenige.' }
  ],
  ex: { id: 'ex22', title: 'Der Fehler-Jäger', goal: 'Diesmal schreibst DU die Tests. Ich baue danach heimlich Fehler in <code>punkte</code> und <code>fliegtRaus</code> ein. Deine Tests müssen jeden Fehler erwischen.',
    todo: ['<code>punkte(gewonnen, geteilt, verloren)</code>: gewonnener Pitch 3, geteilter Auftrag 1, verlorener Pitch 0', '<code>fliegtRaus(platz)</code>: Platz 16, 17, 18 → <code>true</code>, sonst <code>false</code>', 'Alle deine Tests sind mit dem echten Code grün', 'Deine Tests finden 4 eingebaute Fehler (Tipp: jeder Teil einzeln und die Grenzen 15/16)'],
    modules: { './ranking': { punkte: (s, u, n) => 3 * s + u, fliegtRaus: p => p >= 16 } },
    starter: C`
import { describe, it, expect } from 'vitest';
import { punkte, fliegtRaus } from './ranking';

describe('punkte', () => {
  it('ein gewonnener Pitch gibt 3 Punkte', () => {
    expect(punkte(1, 0, 0)).toBe(3);
  });

  // Schreib weitere Tests: geteilt? verloren?
});

describe('fliegtRaus', () => {
  // Welche Plätze musst du unbedingt prüfen?
});
`,
    solution: C`
import { describe, it, expect } from 'vitest';
import { punkte, fliegtRaus } from './ranking';

describe('punkte', () => {
  it('ein gewonnener Pitch gibt 3 Punkte', () => {
    expect(punkte(1, 0, 0)).toBe(3);
  });
  it('ein geteilter Pitch gibt 1 Punkt', () => {
    expect(punkte(0, 1, 0)).toBe(1);
  });
  it('verlorene Pitches geben 0 Punkte', () => {
    expect(punkte(0, 0, 5)).toBe(0);
  });
  it('alles zusammen', () => {
    expect(punkte(2, 1, 3)).toBe(7);
  });
});

describe('fliegtRaus', () => {
  it('Platz 15 bleibt drin', () => {
    expect(fliegtRaus(15)).toBe(false);
  });
  it('Platz 16 fliegt raus', () => {
    expect(fliegtRaus(16)).toBe(true);
  });
  it('Platz 1 ist sicher', () => {
    expect(fliegtRaus(1)).toBe(false);
  });
});
`,
    notes: [['punkte(0, 1, 0)', 'Nur geteilt: Zählt es wirklich 1?'], ['punkte(0, 0, 5)', 'Nur verloren: Bleibt es bei 0?'], ['punkte(2, 1, 3)', 'Gemischt: 2·3 + 1 = 7.'], ['fliegtRaus(15)', 'Grenze von unten: gerade noch gerettet.'], ['fliegtRaus(16)', 'Grenze: der erste, der rausfliegt. Findet > statt >=.']],
    hints: ['Teste jeden Teil einzeln: <code>punkte(0, 1, 0)</code> und <code>punkte(0, 0, 5)</code>.', 'Die Grenze: <code>expect(fliegtRaus(15)).toBe(false)</code> und <code>expect(fliegtRaus(16)).toBe(true)</code>.'],
    tests: [
      { name: 'Mindestens 4 Tests geschrieben', run: async T => { const r = await T.suite({ './ranking': { punkte: (s, u, n) => 3 * s + u, fliegtRaus: p => p >= 16 } }); T.ok(r.total >= 4, 'Ich finde erst ' + r.total + ' Tests (it). Schreib mindestens 4.'); } },
      { name: 'Alle Tests grün mit dem echten Code', run: async T => { const r = await T.suite({ './ranking': { punkte: (s, u, n) => 3 * s + u, fliegtRaus: p => p >= 16 } }); T.ok(r.total > 0 && !r.failed.length, 'Diese Tests sind mit dem RICHTIGEN Code rot: ' + r.failed.map(f => '„' + f.name + '“ (' + f.msg + ')').join(', ')); } },
      { name: 'Fehler 1 gefunden: geteilt zählt 3', run: async T => { const r = await T.suite({ './ranking': { punkte: (s, u, n) => 3 * s + 3 * u, fliegtRaus: p => p >= 16 } }); T.ok(r.failed.length > 0, 'Ich habe geteilte Pitches auf 3 Punkte gesetzt, und alle deine Tests blieben grün. Teste einen geteilten Pitch allein.'); } },
      { name: 'Fehler 2 gefunden: Verlorene geben Punkte', run: async T => { const r = await T.suite({ './ranking': { punkte: (s, u, n) => 3 * s + u + n, fliegtRaus: p => p >= 16 } }); T.ok(r.failed.length > 0, 'Verlorene Pitches geben jetzt 1 Punkt, keiner deiner Tests merkt es. Teste verlorene Pitches.'); } },
      { name: 'Fehler 3 gefunden: Platz 16 bleibt drin', run: async T => { const r = await T.suite({ './ranking': { punkte: (s, u, n) => 3 * s + u, fliegtRaus: p => p > 16 } }); T.ok(r.failed.length > 0, 'Ich habe >= zu > gemacht: Platz 16 fliegt nicht mehr raus. Teste genau Platz 16.'); } },
      { name: 'Fehler 4 gefunden: Platz 15 fliegt raus', run: async T => { const r = await T.suite({ './ranking': { punkte: (s, u, n) => 3 * s + u, fliegtRaus: p => p >= 15 } }); T.ok(r.failed.length > 0, 'Jetzt fliegt schon Platz 15 raus. Teste die Grenze von unten: Platz 15.'); } }
    ] },
  merke: ['Test = Code, der Code prüft. describe → it → expect.', 'Vorbereiten, ausführen, prüfen (Arrange, Act, Assert).', 'Grenzen testen! Dort wohnen die Bugs.', 'Ein guter Test wird rot, wenn der Code kaputt ist. Sonst ist er wertlos.'],
  paare: [
    ['<code>describe</code>', 'Eine Gruppe von Tests'],
    ['<code>it</code>', 'Ein einzelner Test'],
    ['<code>expect</code>', 'Ich erwarte, dass …'],
    ['Grenzfall', 'Platz 15 bleibt drin, 16 fliegt raus'],
    ['TestBed', 'Eine Mini-App nur für den Test']
  ]
});
