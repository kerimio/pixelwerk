/* ================= Phase: DEIN NÄCHSTER SCHRITT =================
   Nach der Agentur-Story: das Abschlussprojekt, ein eigenes Projekt als Übungsplatz und das Fachgespräch im Team. */
ACTS.push({ n: 9, title: 'Dein nächster Schritt', sub: 'Abschlussprojekt in vier Etappen, eigenes Projekt mit Git, CI und Deploy, dann das Fachgespräch' });

/* ---------- Abschlussprojekt: der Workshop-Planer in vier Etappen ----------
   Jede Etappe baut auf der Lösung der vorigen auf. Der Startcode ist die fertige vorige Etappe plus die neuen Aufgaben. */
(() => {
const CARD = C`
export interface Workshop { id: number; titel: string; thema: string; plaetze: number; belegt: number; }

@Component({
  selector: 'app-workshop-karte',
  template: \`
    <h3 class="titel">{{ workshop().titel }}</h3>
    <p class="thema">{{ workshop().thema }}</p>
    @if (voll()) {
      <p class="frei">ausgebucht</p>
    } @else {
      <p class="frei">{{ workshop().plaetze - workshop().belegt }} frei</p>
    }
    <button class="anmelden" (click)="anmelden.emit(workshop().id)" [disabled]="voll()">Anmelden</button>
  \`,
})
export class WorkshopKarte {
  workshop = input.required<Workshop>();
  anmelden = output<number>();
  voll = computed(() => this.workshop().belegt >= this.workshop().plaetze);
}`;

const E1_START = C`
import { Component, computed, input, output, signal } from '@angular/core';

export interface Workshop { id: number; titel: string; thema: string; plaetze: number; belegt: number; }

// 1. Die Karte für einen Workshop
@Component({
  selector: 'app-workshop-karte',
  template: \`
    <h3 class="titel"><!-- Titel --></h3>
    <p class="thema"><!-- Thema --></p>
    <p class="frei"><!-- "5 frei" oder "ausgebucht" --></p>
    <button class="anmelden">Anmelden</button>
  \`,
})
export class WorkshopKarte {
  // workshop: Pflicht-Input, anmelden: Output mit der id, voll: computed
}

// 2. Die Seite mit Suche und Liste
@Component({
  selector: 'app-workshops',
  imports: [WorkshopKarte],
  template: \`
    <input class="suche" placeholder="Suchen …" />
    <!-- Liste mit @for, bei keinem Treffer <p class="leer"> -->
  \`,
})
export class Workshops {
  liste = signal<Workshop[]>([
    { id: 1, titel: 'Signals von null', thema: 'Angular', plaetze: 8, belegt: 3 },
    { id: 2, titel: 'HTTP verstehen', thema: 'Web', plaetze: 6, belegt: 6 },
    { id: 3, titel: 'RxJS ohne Angst', thema: 'Angular', plaetze: 10, belegt: 9 },
    { id: 4, titel: 'CSS Grid', thema: 'Web', plaetze: 12, belegt: 0 },
  ]);
  suche = signal('');

  onAnmelden(id: number) {
  }
}
`;

const E1_SOL = C`
import { Component, computed, input, output, signal } from '@angular/core';
${CARD}

@Component({
  selector: 'app-workshops',
  imports: [WorkshopKarte],
  template: \`
    <input class="suche" placeholder="Suchen …" [value]="suche()" (input)="suche.set($any($event.target).value)" />
    @for (w of gefiltert(); track w.id) {
      <app-workshop-karte [workshop]="w" (anmelden)="onAnmelden($event)" />
    } @empty {
      <p class="leer">Kein Workshop passt zu „{{ suche() }}“.</p>
    }
  \`,
})
export class Workshops {
  liste = signal<Workshop[]>([
    { id: 1, titel: 'Signals von null', thema: 'Angular', plaetze: 8, belegt: 3 },
    { id: 2, titel: 'HTTP verstehen', thema: 'Web', plaetze: 6, belegt: 6 },
    { id: 3, titel: 'RxJS ohne Angst', thema: 'Angular', plaetze: 10, belegt: 9 },
    { id: 4, titel: 'CSS Grid', thema: 'Web', plaetze: 12, belegt: 0 },
  ]);
  suche = signal('');
  gefiltert = computed(() => {
    const s = this.suche().trim().toLowerCase();
    return this.liste().filter(w => (w.titel + ' ' + w.thema).toLowerCase().includes(s));
  });

  onAnmelden(id: number) {
    this.liste.update(l => l.map(w => w.id === id ? { ...w, belegt: w.belegt + 1 } : w));
  }
}
`;

const API = C`
@Service()
export class WorkshopApi {
  private http = inject(HttpClient);

  anmelden(id: number) {
    return this.http.post<Workshop>(\`/api/workshops/\${id}/anmeldung\`, {});
  }
}`;

const LIST2 = C`
@Component({
  selector: 'app-workshops',
  imports: [WorkshopKarte],
  template: \`
    <input class="suche" placeholder="Suchen …" [value]="suche()" (input)="suche.set($any($event.target).value)" />
    @if (daten.isLoading()) {
      <p class="laden">Lade Workshops …</p>
    }
    @if (daten.error()) {
      <p class="fehler">Die Workshops konnten nicht geladen werden.</p>
    } @else if (daten.hasValue()) {
      @for (w of gefiltert(); track w.id) {
        <app-workshop-karte [workshop]="w" (anmelden)="onAnmelden($event)" />
      } @empty {
        <p class="leer">Kein Workshop passt zu „{{ suche() }}“.</p>
      }
    }
  \`,
})
export class Workshops {
  private api = inject(WorkshopApi);
  daten = httpResource<Workshop[]>(() => '/api/workshops');
  suche = signal('');
  gefiltert = computed(() => {
    const s = this.suche().trim().toLowerCase();
    return (this.daten.hasValue() ? this.daten.value() : []).filter(w => (w.titel + ' ' + w.thema).toLowerCase().includes(s));
  });

  onAnmelden(id: number) {
    this.api.anmelden(id).subscribe(() => this.daten.reload());
  }
}`;

const E2_START = C`
import { Component, Service, computed, inject, input, output, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
${CARD}

// NEU: Der Service für alles, was zum Server geht
@Service()
export class WorkshopApi {
  private http = inject(HttpClient);

  anmelden(id: number) {
    // POST /api/workshops/<id>/anmeldung
  }
}

@Component({
  selector: 'app-workshops',
  imports: [WorkshopKarte],
  template: \`
    <input class="suche" placeholder="Suchen …" [value]="suche()" (input)="suche.set($any($event.target).value)" />
    <!-- NEU: beim Laden zusätzlich <p class="laden">, bei Fehler <p class="fehler">, sonst die Liste -->
    @for (w of gefiltert(); track w.id) {
      <app-workshop-karte [workshop]="w" (anmelden)="onAnmelden($event)" />
    } @empty {
      <p class="leer">Kein Workshop passt zu „{{ suche() }}“.</p>
    }
  \`,
})
export class Workshops {
  // NEU: statt der festen Liste die Daten von /api/workshops
  liste = signal<Workshop[]>([
    { id: 1, titel: 'Signals von null', thema: 'Angular', plaetze: 8, belegt: 3 },
    { id: 2, titel: 'HTTP verstehen', thema: 'Web', plaetze: 6, belegt: 6 },
  ]);
  suche = signal('');
  gefiltert = computed(() => {
    const s = this.suche().trim().toLowerCase();
    return this.liste().filter(w => (w.titel + ' ' + w.thema).toLowerCase().includes(s));
  });

  onAnmelden(id: number) {
    this.liste.update(l => l.map(w => w.id === id ? { ...w, belegt: w.belegt + 1 } : w));
  }
}
`;

const E2_SOL = C`
import { Component, Service, computed, inject, input, output, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
${CARD}

${API}

${LIST2}
`;

const API3 = C`
@Service()
export class WorkshopApi {
  private http = inject(HttpClient);

  anmelden(id: number) {
    return this.http.post<Workshop>(\`/api/workshops/\${id}/anmeldung\`, {});
  }

  anlegen(neu: NeuerWorkshopDaten) {
    return this.http.post<Workshop>('/api/workshops', neu);
  }
}`;

const NEW3 = C`
@Component({
  selector: 'app-neuer-workshop',
  imports: [FormField],
  template: \`
    <label>Titel <input class="titel" [formField]="neu.titel" /></label>
    @if (neu.titel().touched() && neu.titel().invalid()) {
      <p class="fehler">{{ neu.titel().errors()[0].message }}</p>
    }
    <label>Thema <input class="thema" [formField]="neu.thema" /></label>
    <label>Plätze <input class="plaetze" type="number" [formField]="neu.plaetze" /></label>
    <button class="speichern" (click)="speichern()" [disabled]="neu().submitting()">Anlegen</button>
  \`,
})
export class NeuerWorkshop {
  private api = inject(WorkshopApi);
  angelegt = output<Workshop>();
  daten = signal<NeuerWorkshopDaten>({ titel: '', thema: 'Angular', plaetze: 8 });
  neu = form(this.daten, (f) => {
    required(f.titel, { message: 'Der Workshop braucht einen Titel.' });
    min(f.plaetze, 1, { message: 'Mindestens 1 Platz.' });
    max(f.plaetze, 30, { message: 'Höchstens 30 Plätze.' });
  });

  speichern() {
    submit(this.neu, async () => {
      const w = await firstValueFrom(this.api.anlegen(this.daten()));
      this.angelegt.emit(w);
      this.daten.set({ titel: '', thema: 'Angular', plaetze: 8 });
    });
  }
}`;

const E3_START = C`
import { Component, Service, computed, inject, input, output, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { form, FormField, required, min, max, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
${CARD}

export interface NeuerWorkshopDaten { titel: string; thema: string; plaetze: number; }

@Service()
export class WorkshopApi {
  private http = inject(HttpClient);

  anmelden(id: number) {
    return this.http.post<Workshop>(\`/api/workshops/\${id}/anmeldung\`, {});
  }

  // NEU: anlegen(neu) schickt POST /api/workshops
}

// NEU: das Formular für einen neuen Workshop
@Component({
  selector: 'app-neuer-workshop',
  imports: [FormField],
  template: \`
    <label>Titel <input class="titel" /></label>
    <label>Thema <input class="thema" /></label>
    <label>Plätze <input class="plaetze" type="number" /></label>
    <button class="speichern" (click)="speichern()">Anlegen</button>
  \`,
})
export class NeuerWorkshop {
  private api = inject(WorkshopApi);
  angelegt = output<Workshop>();
  daten = signal<NeuerWorkshopDaten>({ titel: '', thema: 'Angular', plaetze: 8 });
  neu = form(this.daten);

  speichern() {
  }
}

@Component({
  selector: 'app-workshops',
  imports: [WorkshopKarte],
  template: \`
    <!-- NEU: <app-neuer-workshop>, danach die Liste neu laden -->
    <input class="suche" placeholder="Suchen …" [value]="suche()" (input)="suche.set($any($event.target).value)" />
    @if (daten.isLoading()) {
      <p class="laden">Lade Workshops …</p>
    }
    @if (daten.error()) {
      <p class="fehler">Die Workshops konnten nicht geladen werden.</p>
    } @else if (daten.hasValue()) {
      @for (w of gefiltert(); track w.id) {
        <app-workshop-karte [workshop]="w" (anmelden)="onAnmelden($event)" />
      } @empty {
        <p class="leer">Kein Workshop passt zu „{{ suche() }}“.</p>
      }
    }
  \`,
})
export class Workshops {
  private api = inject(WorkshopApi);
  daten = httpResource<Workshop[]>(() => '/api/workshops');
  suche = signal('');
  gefiltert = computed(() => {
    const s = this.suche().trim().toLowerCase();
    return (this.daten.hasValue() ? this.daten.value() : []).filter(w => (w.titel + ' ' + w.thema).toLowerCase().includes(s));
  });

  onAnmelden(id: number) {
    this.api.anmelden(id).subscribe(() => this.daten.reload());
  }
}
`;

const E3_SOL = C`
import { Component, Service, computed, inject, input, output, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { form, FormField, required, min, max, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
${CARD}

export interface NeuerWorkshopDaten { titel: string; thema: string; plaetze: number; }

${API3}

${NEW3}

@Component({
  selector: 'app-workshops',
  imports: [WorkshopKarte, NeuerWorkshop],
  template: \`
    <app-neuer-workshop (angelegt)="daten.reload()" />
    <input class="suche" placeholder="Suchen …" [value]="suche()" (input)="suche.set($any($event.target).value)" />
    @if (daten.isLoading()) {
      <p class="laden">Lade Workshops …</p>
    }
    @if (daten.error()) {
      <p class="fehler">Die Workshops konnten nicht geladen werden.</p>
    } @else if (daten.hasValue()) {
      @for (w of gefiltert(); track w.id) {
        <app-workshop-karte [workshop]="w" (anmelden)="onAnmelden($event)" />
      } @empty {
        <p class="leer">Kein Workshop passt zu „{{ suche() }}“.</p>
      }
    }
  \`,
})
export class Workshops {
  private api = inject(WorkshopApi);
  daten = httpResource<Workshop[]>(() => '/api/workshops');
  suche = signal('');
  gefiltert = computed(() => {
    const s = this.suche().trim().toLowerCase();
    return (this.daten.hasValue() ? this.daten.value() : []).filter(w => (w.titel + ' ' + w.thema).toLowerCase().includes(s));
  });

  onAnmelden(id: number) {
    this.api.anmelden(id).subscribe(() => this.daten.reload());
  }
}
`;

const E4_HEAD = C`
import { Component, Service, inject, input, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Router, Routes, provideRouter, withComponentInputBinding } from '@angular/router';

export interface Workshop { id: number; titel: string; thema: string; plaetze: number; belegt: number; }

// Aus Etappe 1 bis 3, hier gekürzt: die Liste und das Formular
@Component({ selector: 'app-workshops', template: '<p>Workshops</p>' })
export class Workshops {}

@Component({ selector: 'app-neuer-workshop', template: '<p>Neuer Workshop</p>' })
export class NeuerWorkshop {}

// Wer bin ich? In echt käme das vom Login.
@Service()
export class Auth {
  rolle = signal<'orga' | 'teilnehmer'>('teilnehmer');
}`;

const E4_START = C`
${E4_HEAD}

// NEU: Detailseite für einen Workshop, die id kommt aus der Adresse
@Component({
  selector: 'app-workshop-detail',
  template: \`
    <h2><!-- Titel --></h2>
    <p class="frei"><!-- "5 von 8 Plätzen frei" --></p>
  \`,
})
export class WorkshopDetail {
}

// NEU: Nur die Orga darf neue Workshops anlegen
export const nurOrga = () => {
  return true;
};

// NEU: die Routen
export const routes: Routes = [
];

export const appConfig = {
  providers: [provideRouter(routes)],
};
`;

const E4_SOL = C`
${E4_HEAD}

@Component({
  selector: 'app-workshop-detail',
  template: \`
    @if (workshop.error()) {
      <p class="fehler">Diesen Workshop gibt es nicht.</p>
    } @else if (workshop.hasValue()) {
      <h2>{{ workshop.value().titel }}</h2>
      <p class="frei">{{ workshop.value().plaetze - workshop.value().belegt }} von {{ workshop.value().plaetze }} Plätzen frei</p>
    } @else {
      <p class="laden">Lade …</p>
    }
  \`,
})
export class WorkshopDetail {
  id = input.required<string>();
  workshop = httpResource<Workshop>(() => \`/api/workshops/\${this.id()}\`);
}

export const nurOrga = () => {
  if (inject(Auth).rolle() === 'orga') return true;
  return inject(Router).createUrlTree(['/']);
};

export const routes: Routes = [
  { path: '', component: Workshops, title: 'Workshops' },
  { path: 'workshop/:id', component: WorkshopDetail, title: 'Workshop' },
  { path: 'neu', component: NeuerWorkshop, canActivate: [nurOrga], title: 'Neuer Workshop' },
  { path: '**', redirectTo: '' },
];

export const appConfig = {
  providers: [provideRouter(routes, withComponentInputBinding())],
};
`;

const W = { id: 1, titel: 'Signals von null', thema: 'Angular', plaetze: 8, belegt: 3 };
const VALID = { titel: 'Angular testen', thema: 'Angular', plaetze: 10 };
const posts = (T, url) => T.ng.backend.calls.filter(c => c.method === 'POST' && c.url === url);

CH.push({
  id: 'p01', act: 9, title: 'Abschlussprojekt 1: Die Liste', tag: 'Projekt · Komponenten · Signals · @for', xp: 200,
  docs: [['Komponenten verbinden: input und output', 'https://angular.dev/guide/components/inputs'], ['Kontrollfluss im Template', 'https://angular.dev/guide/templates/control-flow']],
  ticket: { id: 'PW-163', category: 'Feature', heading: 'Workshop-Planer: die Liste', text: 'Pixelwerk bietet intern Workshops an. Bau den Anfang eines Workshop-Planers: eine Karte pro Workshop mit freien Plätzen und Anmelden-Knopf, darüber eine Suche. Volle Workshops sind ausgebucht.' },
  story: [
    ['sara', 'Letzte Phase. Ab jetzt keine einzelnen Bausteine mehr, sondern eine ganze App. In vier Etappen.'],
    ['toni', 'Der Workshop-Planer. Liste, Server, Formular, Seiten. Alles, was du gelernt hast, kommt zusammen.'],
    ['du', 'Und jede Etappe baut auf der vorigen auf?'],
    ['toni', 'Genau. Was du heute baust, benutzt du morgen weiter. So ist es im echten Projekt auch.']
  ],
  slides: [
    { t: 'Der Plan für die App', say: 'Eine App baut man von innen nach außen. Erst das kleinste Teil, die Karte. Dann die Seite, die viele Karten zeigt. Erst danach kommen Server, Formulare und Routen.', job: 'Im Team zerlegt man ein großes Ticket genau so: erst die Komponenten aufmalen, dann klären, wer welche Daten bekommt und wer welche Ereignisse meldet.',
      code: C`
Workshops (Seite)
├── Suche          suche = signal('')
├── gefiltert      computed(() => …)
└── @for … WorkshopKarte
      workshop = input.required<Workshop>()
      anmelden = output<number>()
      voll     = computed(() => …)`,
      notes: [['Workshops (Seite)', 'Hält die Daten und entscheidet, was passiert.'], ['WorkshopKarte', 'Zeigt nur an und meldet Klicks nach oben. Data down, events up.'], ['computed', 'Alles, was sich aus anderen Werten ergibt, wird berechnet, nicht gespeichert.']],
      pro: 'Faustregel: Komponenten, die nur anzeigen, haben keine Services und keinen eigenen Zustand. Dann kann man sie überall wiederverwenden und leicht testen.' }
  ],
  quiz: [
    { q: 'Die Karte soll melden, dass jemand auf „Anmelden“ geklickt hat. Wie macht sie das?', options: ['Sie ändert die Liste der Seite direkt', 'Mit output(), die Seite reagiert mit (anmelden)="..."', 'Mit einem globalen Event auf window', 'Gar nicht, die Seite fragt die Karte regelmäßig'], correct: 1, why: 'Data down, events up: Die Karte meldet über output(), die Seite entscheidet, was passiert.' },
    { q: 'Wie hältst du die gefilterte Liste aktuell, wenn sich Suche oder Liste ändern?', options: ['Mit computed() aus suche() und liste()', 'Mit einem zweiten signal, das du bei jedem Tippen setzt', 'Mit setInterval', 'Mit einem effect(), der eine Variable überschreibt'], correct: 0, why: 'computed() rechnet neu, sobald sich ein gelesenes Signal ändert. Kein doppelter Zustand, nichts vergessen.' },
    { q: 'Warum ändert onAnmelden die Liste mit <code>update(l =&gt; l.map(...))</code> statt das Objekt direkt zu ändern?', options: ['Weil map schneller ist', 'Weil ein Signal nur bei einem neuen Wert merkt, dass sich etwas geändert hat', 'Weil Objekte in TypeScript nicht änderbar sind', 'Das ist egal, beides geht gleich gut'], correct: 1, why: 'Signals vergleichen den Wert. Ein geändertes, aber gleiches Objekt bemerkt niemand. Ein neues Array mit neuem Objekt schon.' }
  ],
  ex: { id: 'exp1', title: 'Der Workshop-Planer: Liste', goal: 'Bau die Karte für einen Workshop und die Seite mit Suche und Liste.', preview: 'Workshops',
    todo: ['<code>WorkshopKarte</code>: <code>workshop = input.required&lt;Workshop&gt;()</code>, <code>anmelden = output&lt;number&gt;()</code>, <code>voll</code> als computed', 'In der Karte: Titel, Thema, „5 frei“ oder „ausgebucht“, der Knopf meldet die id und ist gesperrt, wenn voll', '<code>Workshops</code>: Suche über Titel und Thema als <code>gefiltert = computed(...)</code>', 'Liste mit <code>@for</code> und <code>&lt;app-workshop-karte&gt;</code>, bei keinem Treffer <code>&lt;p class="leer"&gt;</code>', '<code>onAnmelden(id)</code> zählt <code>belegt</code> um eins hoch'],
    starter: E1_START, solution: E1_SOL,
    notes: [['input.required<Workshop>()', 'Ohne Workshop keine Karte.'], ['anmelden.emit(workshop().id)', 'Die Karte meldet nur, die Seite handelt.'], ['voll = computed', 'Berechnet, nicht gespeichert.'], ['gefiltert = computed', 'Suche und Liste ergeben zusammen, was man sieht.'], ['@empty', 'Leere Liste mit freundlichem Hinweis.'], ['l.map(w => w.id === id ? { ...w', 'Neues Array, neues Objekt: Das Signal merkt die Änderung.']],
    hints: ['Die Karte: <code>workshop = input.required&lt;Workshop&gt;(); anmelden = output&lt;number&gt;(); voll = computed(() =&gt; this.workshop().belegt &gt;= this.workshop().plaetze);</code>', 'Die Suche: <code>(input)="suche.set($any($event.target).value)"</code> und <code>gefiltert = computed(() =&gt; this.liste().filter(...))</code>', 'Anmelden: <code>this.liste.update(l =&gt; l.map(w =&gt; w.id === id ? { ...w, belegt: w.belegt + 1 } : w));</code>'],
    tests: [
      { name: 'Die Karte zeigt Titel und freie Plätze', run: T => { const f = T.mount(T.cmp('WorkshopKarte'), { inputs: { workshop: W } }); T.eq(f.q('.titel') && f.q('.titel').textContent.trim(), 'Signals von null', 'In .titel soll der Titel stehen.'); T.ok(f.q('.frei') && f.q('.frei').textContent.includes('5 frei'), 'Bei 8 Plätzen und 3 belegten soll in .frei „5 frei“ stehen.'); } },
      { name: 'Volle Workshops sind ausgebucht', run: T => { const f = T.mount(T.cmp('WorkshopKarte'), { inputs: { workshop: { ...W, belegt: 8 } } }); T.ok(f.q('.frei') && f.q('.frei').textContent.includes('ausgebucht'), 'Ist alles belegt, soll „ausgebucht“ dastehen.'); T.ok(f.q('button.anmelden').disabled, 'Bei einem vollen Workshop soll der Knopf gesperrt sein.'); T.ok(T.isComputed(f.instance.voll), 'voll soll ein computed() sein.'); } },
      { name: 'Die Karte meldet die id', run: async T => { const f = T.mount(T.cmp('WorkshopKarte'), { inputs: { workshop: W } }); const got = []; T.ok(f.instance.anmelden && typeof f.instance.anmelden.subscribe === 'function', 'anmelden soll ein output<number>() sein.'); f.instance.anmelden.subscribe(v => got.push(v)); await f.click('button.anmelden'); T.eq(got, [1], 'Ein Klick auf Anmelden soll die id 1 melden.'); } },
      { name: 'Die Seite zeigt alle Karten', run: T => { const f = T.mount(T.cmp('Workshops')); T.eq(f.qa('app-workshop-karte').length, 4, 'Alle 4 Workshops sollen als <app-workshop-karte> erscheinen.'); } },
      { name: 'Die Suche filtert nach Titel und Thema', run: async T => { const f = T.mount(T.cmp('Workshops')); T.ok(T.isComputed(f.instance.gefiltert), 'gefiltert soll ein computed() sein.'); await f.type('input.suche', 'http'); T.eq(f.qa('.titel').map(t => t.textContent.trim()), ['HTTP verstehen'], '„http“ soll nur „HTTP verstehen“ finden, auch bei kleiner Schreibweise.'); await f.type('input.suche', 'angular'); T.eq(f.qa('app-workshop-karte').length, 2, '„angular“ soll beide Angular-Workshops über das Thema finden.'); await f.type('input.suche', 'xyz'); T.ok(f.q('p.leer'), 'Ohne Treffer soll <p class="leer"> erscheinen.'); } },
      { name: 'Anmelden zählt hoch', run: async T => { const f = T.mount(T.cmp('Workshops')); await f.click(f.q('app-workshop-karte button.anmelden')); T.eq(f.instance.liste()[0].belegt, 4, 'Nach einem Klick soll der erste Workshop 4 belegte Plätze haben.'); T.ok(f.q('app-workshop-karte .frei').textContent.includes('4 frei'), 'Die Karte soll danach „4 frei“ zeigen.'); } }
    ] },
  takeaway: ['Eine App von innen nach außen bauen: erst die kleinste Komponente.', 'Data down, events up: input() rein, output() raus.', 'Was sich ergibt, ist computed(), nicht gespeichert.', 'Signals mit neuen Werten ändern, nicht das alte Objekt.'],
  pairs: [
    ['Von innen nach außen', 'Erst die Karte, dann die Seite'],
    ['<code>input()</code>', 'Daten rein in die Karte'],
    ['<code>output()</code>', 'Meldung raus aus der Karte'],
    ['<code>computed()</code>', 'Was sich ergibt, wird nicht gespeichert']
  ]
});

CH.push({
  id: 'p02', act: 9, title: 'Abschlussprojekt 2: Vom Server', tag: 'Projekt · Service · httpResource · Fehler', xp: 220,
  docs: [['Reaktiv laden mit httpResource', 'https://angular.dev/guide/http/http-resource'], ['Services und Dependency Injection', 'https://angular.dev/guide/di']],
  ticket: { id: 'PW-164', category: 'Feature', heading: 'Workshop-Planer: echte Daten', text: 'Die Workshops kommen ab jetzt von /api/workshops. Beim Laden steht „Lade Workshops …“, bei einem Fehler eine Meldung. Anmelden geht per POST an /api/workshops/<id>/anmeldung, danach ist die Liste aktuell.' },
  story: [
    ['jonas', 'Die API steht. GET /api/workshops und POST für die Anmeldung. Und ja, manchmal ist der Server langsam.'],
    ['mia', 'Und manchmal ist er weg. Dann will ich keine leere Seite sehen, sondern eine Meldung.'],
    ['toni', 'Also: Alles, was zum Server geht, kommt in einen Service. Die Seite lädt mit httpResource und zeigt drei Zustände: lädt, Fehler, Daten.']
  ],
  slides: [
    { t: 'Drei Zustände, immer', say: 'Daten vom Server sind nie sofort da. Jede Seite mit Server-Daten hat drei Zustände: lädt, Fehler, fertig. httpResource gibt dir alle drei als Signals.', job: 'Im Review ist die erste Frage: Was sieht man, wenn der Server langsam ist? Und wenn er weg ist? Fehlt eins davon, geht der PR zurück.',
      code: C`
daten = httpResource<Workshop[]>(() => '/api/workshops');

@if (daten.isLoading()) { <p class="laden">Lade …</p> }
@if (daten.error()) { <p class="fehler">…</p> }
@else if (daten.hasValue()) { @for (w of daten.value(); track w.id) { … } }

// Nach einer Änderung auf dem Server:
this.daten.reload();`,
      notes: [['httpResource', 'Lädt sofort und gibt value(), isLoading() und error() als Signals.'], ['isLoading()', 'true, solange eine Anfrage läuft. Auch beim Neuladen. Darum steht der Hinweis in einem eigenen @if, zusätzlich zur Liste.'], ['error()', 'Der Fehler, wenn der Server nicht antwortet oder 500 schickt.'], ['hasValue()', 'true, sobald Daten da sind. Beim Neuladen bleibt der alte Wert erhalten, die Liste verschwindet also nicht.'], ['reload()', 'Lädt dieselbe Adresse noch einmal.']],
      pro: 'Achtung: Hat die Resource einen Fehler, wirft value() beim Lesen. Darum erst error() oder hasValue() prüfen. Dasselbe gilt für toSignal ohne catchError. Schreibende Anfragen (POST, PUT, DELETE) gehören nicht in httpResource, sondern in einen Service mit HttpClient. httpResource ist nur zum Lesen da.' }
  ],
  quiz: [
    { q: 'Warum kommt <code>http.post(...)</code> in einen eigenen Service statt direkt in die Komponente?', options: ['Weil Komponenten kein HttpClient injizieren dürfen', 'Damit alle Anfragen an einer Stelle stehen und man sie in Tests ersetzen kann', 'Weil POST sonst nicht funktioniert', 'Weil Services schneller sind'], correct: 1, why: 'Ein Service bündelt die Anfragen. Andere Seiten können ihn mitbenutzen, und in Tests ersetzt man ihn leicht.' },
    { q: 'Der Server antwortet mit 500. Was zeigt eine gute Seite?', options: ['Eine leere Liste', 'Eine verständliche Fehlermeldung, ausgelesen über daten.error()', 'Den rohen Fehlertext des Servers', 'Nichts, Fehler gehören in die Konsole'], correct: 1, why: 'Wer nichts sieht, denkt, es gibt keine Workshops. Eine klare Meldung sagt, dass etwas schiefging.' },
    { q: 'Nach der Anmeldung soll die Liste den neuen Stand zeigen. Was ist am einfachsten?', options: ['Die Seite neu laden mit location.reload()', 'daten.reload() aufrufen, wenn die Anmeldung durch ist', 'Eine Sekunde warten und hoffen', 'Gar nichts, httpResource merkt es selbst'], correct: 1, why: 'Der Server kennt den neuen Stand. reload() holt ihn ab, sobald die Anmeldung geklappt hat.' }
  ],
  ex: { id: 'exp2', title: 'Der Workshop-Planer: Server', goal: 'Hol die Workshops vom Server, zeig Laden und Fehler, und melde dich über die API an.', preview: 'Workshops', backend: 'workshops',
    todo: ['<code>WorkshopApi.anmelden(id)</code> schickt <code>POST /api/workshops/&lt;id&gt;/anmeldung</code>', 'In <code>Workshops</code>: <code>daten = httpResource&lt;Workshop[]&gt;(() =&gt; \'/api/workshops\')</code> statt der festen Liste', '<code>gefiltert</code> liest <code>daten.hasValue() ? daten.value() : []</code>', 'Template: <code>&lt;p class="laden"&gt;</code> beim Laden (zusätzlich, in einem eigenen <code>@if</code>), <code>&lt;p class="fehler"&gt;</code> bei Fehler, sonst bei <code>daten.hasValue()</code> die Liste', '<code>onAnmelden</code> ruft die API und danach <code>daten.reload()</code>'],
    starter: E2_START, solution: E2_SOL,
    notes: [['@Service()', 'Ein Service für die ganze App.'], ['this.http.post<Workshop>(', 'Die Anmeldung geht an den Server.'], ['httpResource<Workshop[]>', 'Lädt die Liste, mit Zustand als Signals.'], ['daten.hasValue() ? daten.value() : []', 'Vor der ersten Antwort gibt es noch keine Daten. Und bei einem Fehler wirft value() beim Lesen, darum erst hasValue() fragen. Dasselbe gilt für toSignal ohne catchError.'], ['@if (daten.error())', 'Fehler bekommen eine eigene Meldung.'], ['@else if (daten.hasValue())', 'Die Liste bleibt beim Neuladen stehen. Nur der Ladehinweis kommt dazu.'], ['subscribe(() => this.daten.reload())', 'Erst wenn die Anmeldung durch ist, neu laden.']],
    hints: ['Der Service: <code>return this.http.post&lt;Workshop&gt;(`/api/workshops/${id}/anmeldung`, {});</code>', 'Die Seite: <code>daten = httpResource&lt;Workshop[]&gt;(() =&gt; \'/api/workshops\');</code> und <code>(this.daten.hasValue() ? this.daten.value() : []).filter(...)</code>', 'Das Template: <code>@if (daten.isLoading()) { … }</code> für sich, darunter <code>@if (daten.error()) { … } @else if (daten.hasValue()) { @for … }</code>', 'Anmelden: <code>this.api.anmelden(id).subscribe(() =&gt; this.daten.reload());</code>'],
    tests: [
      { name: 'Die API meldet per POST an', run: async T => { const api = T.inject(T.get('WorkshopApi')); const obs = api.anmelden(1); T.ok(obs && typeof obs.subscribe === 'function', 'anmelden(id) soll das Observable von http.post zurückgeben.'); const r = await T.collect(obs, 200); T.eq(posts(T, '/api/workshops/1/anmeldung').length, 1, 'Es soll genau ein POST an /api/workshops/1/anmeldung gehen.'); T.eq(r.vals[0] && r.vals[0].belegt, 4, 'Der Server antwortet mit dem Workshop, jetzt mit 4 belegten Plätzen.'); } },
      { name: 'Erst laden, dann die Liste vom Server', run: async T => { const f = T.mount(T.cmp('Workshops')); T.ok(f.q('p.laden'), 'Am Anfang soll <p class="laden"> zu sehen sein.'); await T.flush(100); T.ok(!f.q('p.laden'), 'Nach dem Laden soll p.laden weg sein.'); T.ok(T.ng.backend.calls.some(c => c.method === 'GET' && c.url === '/api/workshops'), 'Die Liste soll per GET von /api/workshops kommen.'); T.eq(f.qa('app-workshop-karte').length, 4, 'Alle 4 Workshops vom Server sollen erscheinen.'); } },
      { name: 'Fehler bekommen eine Meldung', run: async T => { T.ng.backend.kaputt = true; const f = T.mount(T.cmp('Workshops')); await T.flush(100); T.ok(f.q('p.fehler'), 'Antwortet der Server mit 500, soll <p class="fehler"> erscheinen.'); T.eq(f.qa('app-workshop-karte').length, 0, 'Bei einem Fehler soll keine Karte zu sehen sein.'); } },
      { name: 'Beim Neuladen bleibt die Liste stehen', run: async T => { const f = T.mount(T.cmp('Workshops')); await T.flush(100); f.instance.daten.reload(); await T.flush(5); T.ok(f.q('p.laden'), 'Beim Neuladen soll <p class="laden"> erscheinen (daten.isLoading()).'); T.eq(f.qa('app-workshop-karte').length, 4, 'Beim Neuladen soll die alte Liste stehen bleiben. Zeig sie bei daten.hasValue(), den Ladehinweis in einem eigenen @if zusätzlich.'); await T.flush(100); T.ok(!f.q('p.laden'), 'Nach dem Neuladen soll p.laden wieder weg sein.'); } },
      { name: 'Die Suche geht weiter', run: async T => { const f = T.mount(T.cmp('Workshops')); await T.flush(100); await f.type('input.suche', 'grid'); T.eq(f.qa('.titel').map(t => t.textContent.trim()), ['CSS Grid'], '„grid“ soll nur „CSS Grid“ finden.'); } },
      { name: 'Anmelden geht zum Server und lädt neu', run: async T => { const f = T.mount(T.cmp('Workshops')); await T.flush(100); await f.click(f.q('app-workshop-karte button.anmelden')); await T.flush(200); T.eq(posts(T, '/api/workshops/1/anmeldung').length, 1, 'Ein Klick soll über die API anmelden.'); T.ok(T.ng.backend.calls.filter(c => c.method === 'GET' && c.url === '/api/workshops').length >= 2, 'Danach soll die Liste neu geladen werden (daten.reload()).'); T.ok(f.q('app-workshop-karte .frei').textContent.includes('4 frei'), 'Die Karte soll danach den Stand vom Server zeigen: „4 frei“.'); } },
      { name: 'httpResource lädt die Liste', run: T => T.ok(/httpResource\s*</.test(T.code) || /httpResource\s*\(/.test(T.code), 'Lade die Liste mit httpResource(() => \'/api/workshops\').') }
    ] },
  takeaway: ['Alles, was zum Server geht, steht in einem Service.', 'Jede Seite mit Server-Daten hat drei Zustände: lädt, Fehler, Daten.', 'httpResource zum Lesen, HttpClient im Service zum Schreiben.', 'Nach einer Änderung den Stand vom Server neu holen.'],
  pairs: [
    ['Service', 'Alles, was zum Server geht'],
    ['<code>httpResource</code>', 'Lesen, mit Signal für Laden und Fehler'],
    ['HttpClient', 'Schreiben im Service, etwa POST'],
    ['Drei Zustände', 'Lädt, Fehler, Daten'],
    ['<code>reload()</code>', 'Nach einer Änderung den Stand neu holen']
  ]
});

CH.push({
  id: 'p03', act: 9, title: 'Abschlussprojekt 3: Neuer Workshop', tag: 'Projekt · Signal Forms · submit · output', xp: 220,
  docs: [['Signal Forms im Überblick', 'https://angular.dev/guide/forms/signals/overview'], ['Validierung mit Signal Forms', 'https://angular.dev/guide/forms/signals/validation']],
  ticket: { id: 'PW-165', category: 'Feature', heading: 'Workshop-Planer: anlegen', text: 'Über der Liste kommt ein Formular für neue Workshops: Titel ist Pflicht, Plätze zwischen 1 und 30. Gespeichert wird per POST an /api/workshops. Danach erscheint der neue Workshop in der Liste und das Formular ist wieder leer.' },
  story: [
    ['leon', 'Die Orga will selbst Workshops anlegen, ohne jedes Mal Jonas zu fragen.'],
    ['jonas', 'POST /api/workshops mit Titel, Thema und Plätzen. Mehr als 30 Plätze hat kein Raum.'],
    ['toni', 'Das Formular wird eine eigene Komponente. Sie speichert über die API und meldet mit einem output, dass es einen neuen Workshop gibt. Die Liste lädt dann neu.']
  ],
  slides: [
    { t: 'Formular als eigene Komponente', say: 'Das Formular kennt die Liste nicht. Es speichert und meldet: Da ist ein neuer Workshop. Die Seite entscheidet, was dann passiert. Hier: neu laden.', job: 'So kann dasselbe Formular später auch in einem Dialog oder auf einer eigenen Seite stehen. Die nächste Etappe macht genau das.',
      code: C`
speichern() {
  submit(this.neu, async () => {
    const w = await firstValueFrom(this.api.anlegen(this.daten()));
    this.angelegt.emit(w);
    this.daten.set({ titel: '', thema: 'Angular', plaetze: 8 });
  });
}

// Auf der Seite:
<app-neuer-workshop (angelegt)="daten.reload()" />`,
      notes: [['submit(this.neu', 'Prüft alle Regeln. Nur wenn alles stimmt, läuft die Aktion.'], ['firstValueFrom', 'Macht aus dem Observable ein Promise, damit await geht.'], ['this.angelegt.emit(w)', 'Meldet den neuen Workshop nach oben.'], ['(angelegt)="daten.reload()"', 'Die Seite holt den neuen Stand.']],
      pro: 'Während submit() läuft, ist neu().submitting() true. Damit sperrst du den Knopf, damit niemand doppelt klickt. Sperr ihn aber nicht, nur weil das Formular ungültig ist: Dann kann niemand klicken, submit() zeigt nie die Fehler, und ein gesperrter Knopf erklärt nicht, was fehlt.' }
  ],
  quiz: [
    { q: 'Wie sagst du, dass ein Workshop zwischen 1 und 30 Plätze haben muss?', options: ['Mit min(f.plaetze, 1) und max(f.plaetze, 30) in den Regeln', 'Mit einem if im Template', 'Mit maxlength="2" am input', 'Gar nicht, das prüft der Server'], correct: 0, why: 'Die Regeln stehen in form(). Der Server prüft zusätzlich, aber der Nutzer soll den Fehler sofort sehen.' },
    { q: 'Warum meldet das Formular den neuen Workshop per output, statt selbst die Liste neu zu laden?', options: ['Weil output schneller ist', 'Damit das Formular die Liste nicht kennen muss und überall einsetzbar bleibt', 'Weil Komponenten keine Services benutzen dürfen', 'Weil reload() nur in der Seite geht'], correct: 1, why: 'Data down, events up. Das Formular meldet nur. Wer es benutzt, entscheidet, was danach passiert.' },
    { q: 'Was passiert, wenn man bei leerem Titel auf „Anlegen“ klickt und speichern() mit submit() arbeitet?', options: ['Ein leerer Workshop wird gespeichert', 'Die Felder werden als berührt markiert, die Fehler erscheinen, nichts geht zum Server', 'Die App stürzt ab', 'Der Titel wird automatisch ausgefüllt'], correct: 1, why: 'submit() führt die Aktion nur bei gültigem Formular aus und zeigt sonst alle Fehler.' }
  ],
  ex: { id: 'exp3', title: 'Der Workshop-Planer: Formular', goal: 'Bau das Formular für neue Workshops mit Signal Forms. Es speichert über die API und die Liste lädt danach neu.', preview: 'Workshops', backend: 'workshops',
    todo: ['<code>WorkshopApi.anlegen(neu)</code> schickt <code>POST /api/workshops</code>', '<code>NeuerWorkshop</code>: Regeln in <code>form()</code>, Titel Pflicht, Plätze mit <code>min</code> 1 und <code>max</code> 30', 'Die drei Eingaben mit <code>[formField]</code>, Fehler am Titel nach dem Verlassen, Knopf nur gesperrt, solange gespeichert wird (<code>neu().submitting()</code>)', '<code>speichern()</code> mit <code>submit()</code>: anlegen, <code>angelegt</code> melden, Formular leeren', 'Auf der Seite: <code>&lt;app-neuer-workshop (angelegt)="daten.reload()" /&gt;</code>'],
    starter: E3_START, solution: E3_SOL,
    notes: [['anlegen(neu: NeuerWorkshopDaten)', 'Ein neuer Weg zum Server, im selben Service.'], ['min(f.plaetze, 1', 'Regeln für Zahlen.'], ['type="number"', 'Mit [formField] kommt dann eine echte Zahl an.'], ['[disabled]="neu().submitting()"', 'Nicht wegen invalid sperren: submit() zeigt beim Klick alle Fehler. Gesperrt wird nur, solange gespeichert wird.'], ['submit(this.neu, async () =>', 'Nur gültige Workshops gehen zum Server.'], ['this.angelegt.emit(w)', 'Das Formular meldet, die Seite lädt neu.'], ['imports: [WorkshopKarte, NeuerWorkshop]', 'Die Seite benutzt jetzt beide Komponenten.']],
    hints: ['Der Service: <code>anlegen(neu: NeuerWorkshopDaten) { return this.http.post&lt;Workshop&gt;(\'/api/workshops\', neu); }</code>', 'Die Regeln: <code>form(this.daten, (f) =&gt; { required(f.titel, { message: \'...\' }); min(f.plaetze, 1, { message: \'...\' }); max(f.plaetze, 30, { message: \'...\' }); })</code>', 'Speichern: <code>submit(this.neu, async () =&gt; { const w = await firstValueFrom(this.api.anlegen(this.daten())); this.angelegt.emit(w); this.daten.set(...); });</code>'],
    tests: [
      { name: 'Die Regeln stimmen', run: T => { const f = T.mount(T.cmp('NeuerWorkshop')); const n = f.instance.neu; T.ok(n.titel().invalid(), 'Ein leerer Titel soll ungültig sein (required).'); f.instance.daten.set({ ...VALID, plaetze: 0 }); T.ok(n.plaetze().invalid(), '0 Plätze sollen ungültig sein (min 1).'); f.instance.daten.set({ ...VALID, plaetze: 31 }); T.ok(n.plaetze().invalid(), '31 Plätze sollen ungültig sein (max 30).'); f.instance.daten.set(VALID); T.ok(n().valid(), 'Mit Titel und 10 Plätzen soll das Formular gültig sein.'); } },
      { name: 'Eingaben sind verbunden, Fehler erst nach dem Verlassen', run: async T => { const f = T.mount(T.cmp('NeuerWorkshop')); T.ok(!f.q('p.fehler'), 'Am Anfang soll kein Fehler zu sehen sein.'); f.q('input.titel').dispatchEvent(new Event('blur')); await T.flush(); T.ok(f.q('p.fehler'), 'Nach dem Verlassen des leeren Titels soll <p class="fehler"> erscheinen.'); await f.type('input.titel', 'Angular testen'); T.eq(f.instance.daten().titel, 'Angular testen', 'Was man in input.titel tippt, soll in daten() landen.'); T.ok(!f.q('button.speichern').disabled, 'Mit Titel soll man anlegen können.'); } },
      { name: 'Ungültig: Klick zeigt Fehler, nichts geht zum Server', run: async T => { const f = T.mount(T.cmp('NeuerWorkshop')); const b = f.q('button.speichern'); T.ok(b && !b.disabled, 'Der Knopf soll auch bei leerem Titel klickbar sein. Sperr ihn nur während des Speicherns: [disabled]="neu().submitting()".'); await f.click('button.speichern'); await T.flush(80); T.eq(posts(T, '/api/workshops').length, 0, 'Ohne Titel darf kein POST rausgehen. Nimmst du submit()?'); T.ok(f.q('p.fehler'), 'Nach dem Klick soll der Fehler am Titel erscheinen. submit() markiert alle Felder als berührt.'); } },
      { name: 'Speichern schickt, meldet und leert', run: async T => { const f = T.mount(T.cmp('NeuerWorkshop')); const got = []; T.ok(f.instance.angelegt && typeof f.instance.angelegt.subscribe === 'function', 'angelegt soll ein output<Workshop>() sein.'); f.instance.angelegt.subscribe(w => got.push(w)); f.instance.daten.set(VALID); f.instance.speichern(); await T.flush(5); T.ok(f.q('button.speichern').disabled, 'Während gespeichert wird, soll der Knopf gesperrt sein: [disabled]="neu().submitting()".'); await T.flush(120); T.ok(!f.q('button.speichern').disabled, 'Nach dem Speichern soll der Knopf wieder frei sein.'); const p = posts(T, '/api/workshops'); T.eq(p.length, 1, 'Es soll genau ein POST an /api/workshops gehen.'); T.eq(p[0].body, VALID, 'Im POST sollen genau die Daten aus dem Formular stehen.'); T.eq(got.map(w => w.titel), ['Angular testen'], 'Danach soll angelegt den neuen Workshop vom Server melden.'); T.eq(f.instance.daten().titel, '', 'Danach soll der Titel wieder leer sein.'); } },
      { name: 'Die Liste zeigt den neuen Workshop', run: async T => { const f = T.mount(T.cmp('Workshops')); await T.flush(100); T.ok(f.q('app-neuer-workshop'), 'Die Seite soll <app-neuer-workshop> enthalten.'); await f.type('app-neuer-workshop input.titel', 'Angular testen'); await f.click('app-neuer-workshop button.speichern'); await T.flush(250); T.eq(f.qa('app-workshop-karte').length, 5, 'Nach dem Anlegen soll die Liste neu laden und 5 Workshops zeigen.'); } }
    ] },
  takeaway: ['Formulare als eigene Komponente: speichern und per output melden.', 'Regeln für Zahlen: min und max.', 'submit() schützt den Server vor ungültigen Daten.', 'firstValueFrom macht aus einem Observable ein Promise.'],
  pairs: [
    ['Formular-Komponente', 'Speichert und meldet per output'],
    ['<code>min</code> und <code>max</code>', 'Regeln für Zahlen'],
    ['<code>submit()</code>', 'Schickt nur gültige Daten an den Server'],
    ['<code>firstValueFrom</code>', 'Macht aus einem Observable ein Promise']
  ]
});

CH.push({
  id: 'p04', act: 9, title: 'Abschlussprojekt 4: Seiten und Schutz', tag: 'Projekt · Router · Guard · Input-Binding', xp: 240,
  docs: [['Routing im Überblick', 'https://angular.dev/guide/routing'], ['Routen schützen mit Guards', 'https://angular.dev/guide/routing/route-guards']],
  ticket: { id: 'PW-166', category: 'Feature', heading: 'Workshop-Planer: Seiten', text: 'Der Planer bekommt Seiten: die Liste auf /, eine Detailseite auf /workshop/<id> und das Formular auf /neu. /neu darf nur die Orga öffnen, alle anderen landen auf der Liste. Unbekannte Adressen führen auch zur Liste.' },
  story: [
    ['leon', 'Ich will einen Link zu einem einzelnen Workshop verschicken können. Und das Formular sollen nicht alle sehen.'],
    ['toni', 'Dann bekommt der Planer Routen. Die Detailseite holt die id aus der Adresse, direkt als input. Und vor /neu kommt ein Guard.'],
    ['mia', 'Denkt dran: Der Guard versteckt nur die Seite. Ob jemand wirklich anlegen darf, muss der Server prüfen.']
  ],
  slides: [
    { t: 'Die ganze App als Routen', say: 'Jede Seite bekommt eine Adresse. Die id aus der Adresse kommt dank withComponentInputBinding direkt als input() an. Der Guard entscheidet, ob man rein darf.', job: 'Links zu Details sind im Job Pflicht: Der Kunde schickt sie per Mail, das Support-Team in Tickets. Eine App ohne eigene Adressen fühlt sich kaputt an.',
      code: C`
export const routes: Routes = [
  { path: '', component: Workshops },
  { path: 'workshop/:id', component: WorkshopDetail },
  { path: 'neu', component: NeuerWorkshop, canActivate: [nurOrga] },
  { path: '**', redirectTo: '' },
];

export class WorkshopDetail {
  id = input.required<string>();
  workshop = httpResource<Workshop>(() => \`/api/workshops/\${this.id()}\`);
}`,
      notes: [['workshop/:id', 'Platzhalter. Bei /workshop/2 ist id = "2".'], ["canActivate: [nurOrga]", 'Der Guard an der Tür zum Formular.'], ["'**'", 'Alles Unbekannte führt zurück zur Liste.'], ['httpResource(() => …this.id()', 'Ändert sich die id, lädt die Seite automatisch neu.']],
      pro: 'Mit loadComponent: () => import(...) laden die Seiten erst, wenn man sie öffnet. Bei vier Seiten lohnt sich das noch nicht, bei vierzig schon.' }
  ],
  quiz: [
    { q: 'Wie kommt die id aus <code>/workshop/2</code> am einfachsten in die Detailseite?', options: ['Mit withComponentInputBinding als id = input.required<string>()', 'Mit location.href.split("/")', 'Über einen Service, in den die Liste die id schreibt', 'Gar nicht, die Detailseite zeigt immer den ersten'], correct: 0, why: 'withComponentInputBinding gibt Platzhalter direkt als input() weiter. Kein Zerlegen der Adresse.' },
    { q: 'Was gibt der Guard zurück, wenn jemand ohne Orga-Rolle /neu öffnet?', options: ['false und eine Konsolenmeldung', 'Einen UrlTree zu /, also eine Umleitung zur Liste', 'Einen Fehler', 'undefined'], correct: 1, why: 'Mit createUrlTree leitet der Guard sauber um. Bei false bliebe man einfach, wo man war, ohne Hinweis.' },
    { q: 'Reicht der Guard, damit Teilnehmer keine Workshops anlegen können?', options: ['Ja, ohne Seite kein Formular', 'Nein, der Server muss die Anfrage selbst prüfen, denn ein POST geht auch ohne die Seite', 'Ja, wenn man zusätzlich den Knopf versteckt', 'Nur in Produktion'], correct: 1, why: 'Guards schützen die Ansicht. Die Daten schützt nur der Server.' }
  ],
  ex: { id: 'exp4', title: 'Der Workshop-Planer: Routen', goal: 'Gib dem Planer seine Seiten: Liste, Detailseite mit id aus der Adresse und ein geschütztes Formular.', backend: 'workshops',
    todo: ['<code>WorkshopDetail</code>: <code>id = input.required&lt;string&gt;()</code> und <code>httpResource</code> auf <code>/api/workshops/&lt;id&gt;</code>, zeigt den Titel in <code>&lt;h2&gt;</code> und „5 von 8 Plätzen frei“', '<code>nurOrga</code>: <code>true</code> für die Orga, sonst <code>createUrlTree([\'/\'])</code>', '<code>routes</code>: <code>\'\'</code>, <code>\'workshop/:id\'</code>, <code>\'neu\'</code> mit Guard und <code>\'**\'</code> zurück zur Liste', '<code>appConfig</code>: <code>provideRouter(routes, withComponentInputBinding())</code>'],
    starter: E4_START, solution: E4_SOL,
    notes: [['id = input.required<string>()', 'Kommt direkt aus der Adresse.'], ['httpResource<Workshop>(', 'Lädt den einen Workshop, neu bei neuer id.'], ['@else if (workshop.hasValue())', 'Erst anzeigen, wenn die Daten da sind. Vorher kommt error(), denn bei einer unbekannten id wirft value() beim Lesen.'], ["inject(Auth).rolle() === 'orga'", 'Der Guard liest den Zustand aus dem Service.'], ["createUrlTree(['/'])", 'Alle anderen zurück zur Liste.'], ["{ path: '**', redirectTo: '' }", 'Ganz unten: alles Unbekannte.'], ['withComponentInputBinding()', 'Ohne das kommt die id nicht als input an.']],
    hints: ['Die Detailseite: <code>id = input.required&lt;string&gt;(); workshop = httpResource&lt;Workshop&gt;(() =&gt; `/api/workshops/${this.id()}`);</code>', 'Der Guard: <code>if (inject(Auth).rolle() === \'orga\') return true; return inject(Router).createUrlTree([\'/\']);</code>', 'Die Routen: <code>{ path: \'neu\', component: NeuerWorkshop, canActivate: [nurOrga] }</code>, ganz unten <code>{ path: \'**\', redirectTo: \'\' }</code>'],
    tests: [
      { name: 'Die Liste auf /', run: T => { const m = T.match(T.get('routes'), '/'); T.ok(m && m.route.component === T.get('Workshops'), '/ soll die Liste Workshops zeigen.'); } },
      { name: 'Die Detailseite auf /workshop/2', run: T => { const m = T.match(T.get('routes'), '/workshop/2'); T.ok(m && m.route.component === T.get('WorkshopDetail'), '/workshop/2 soll WorkshopDetail zeigen.'); T.eq(m.params.id, '2', 'Der Platzhalter soll :id heißen.'); } },
      { name: 'Die Detailseite lädt den Workshop', run: async T => { const f = T.mount(T.cmp('WorkshopDetail'), { inputs: { id: '1' } }); await T.flush(100); T.ok(T.ng.backend.calls.some(c => c.method === 'GET' && c.url === '/api/workshops/1'), 'Die Detailseite soll /api/workshops/1 laden.'); T.eq(f.q('h2') && f.q('h2').textContent.trim(), 'Signals von null', 'In <h2> soll der Titel stehen.'); T.ok(f.text().includes('5 von 8 Plätzen frei'), 'Darunter soll „5 von 8 Plätzen frei“ stehen.'); } },
      { name: '/neu ist geschützt, ** führt zur Liste', run: T => { const r = T.get('routes'); const m = T.match(r, '/neu'); T.ok(m && m.route.component === T.get('NeuerWorkshop'), '/neu soll NeuerWorkshop zeigen.'); T.ok((m.route.canActivate || []).includes(T.get('nurOrga')), 'Die Route /neu braucht canActivate: [nurOrga].'); const u = T.match(r, '/gibt/es/nicht'); T.ok(u && ['', '/'].includes(u.route.redirectTo), 'Unbekannte Adressen sollen zur Liste führen: { path: \'**\', redirectTo: \'\' }.'); T.eq(r[r.length - 1].path, '**', 'Die "**"-Route muss ganz unten stehen.'); } },
      { name: 'Der Guard lässt nur die Orga rein', run: T => { const a = T.inject(T.get('Auth')); a.rolle.set('teilnehmer'); T.ok(T.isUrlTree(T.inCtx(() => T.get('nurOrga')({}, {})), '/'), 'Teilnehmer sollen per createUrlTree([\'/\']) zur Liste.'); a.rolle.set('orga'); T.eq(T.inCtx(() => T.get('nurOrga')({}, {})), true, 'Die Orga soll rein dürfen.'); } },
      { name: 'Die id kommt als input', run: T => T.ok(/withComponentInputBinding\s*\(\s*\)/.test(T.code), 'In appConfig fehlt provideRouter(routes, withComponentInputBinding()).') }
    ] },
  takeaway: ['Jede Seite eine Adresse, Details mit :id.', 'withComponentInputBinding: Platzhalter kommen als input().', 'Guard: true oder UrlTree. Der Server prüft trotzdem.', '** ganz unten fängt alles Unbekannte.'],
  pairs: [
    ['<code>:id</code>', 'Platzhalter für die Detailseite'],
    ['<code>withComponentInputBinding</code>', 'Der Platzhalter kommt als input() an'],
    ['Guard', 'Gibt true oder einen UrlTree zurück'],
    ['<code>**</code>', 'Fängt alles Unbekannte, ganz unten']
  ]
});
})();

CH.push({
  id: 'k30', act: 9, title: 'Dein eigenes Projekt', tag: 'Echtes Projekt · Git · CI · Deploy', xp: 300,
  docs: [['Lokale Einrichtung der Angular CLI', 'https://angular.dev/tools/cli/setup-local'], ['Deployment mit der Angular CLI', 'https://angular.dev/tools/cli/deployment'], ['Tests mit Vitest', 'https://angular.dev/guide/testing']],
  ticket: { id: 'PW-156', category: 'Feature', heading: 'Eigenes Projekt aufsetzen', text: 'Leg ein eigenes Angular-Projekt an, mit Git, Pull Requests, Pipeline und Deployment. Dort probierst du Neues aus, bevor es ins Team-Projekt kommt.' },
  story: [
    ['toni', 'Alles bisher lief hier im Browser. Jetzt kommt das echte Setup: Laptop, Terminal, eigenes Projekt, das jeder im Netz sieht.'],
    ['sara', 'Ein eigenes Projekt mit Tests und Pipeline ist der beste Übungsplatz. Was du dort ausprobierst, bringst du ins Team mit.']
  ],
  slides: [
    { t: 'Start auf dem eigenen Rechner', say: 'Node installieren, die Angular CLI holen, Projekt anlegen. Ab jetzt läuft alles in deinem Editor.', job: 'Am ersten Arbeitstag ist genau das die Aufgabe: Node in der richtigen Version, Repo klonen, npm ci, ng serve. Wer das schon kann, ist am Nachmittag produktiv.',
      code: C`
# einmalig
npm install -g @angular/cli

# neues Projekt
ng new team-app --style=scss --ssr=false
cd team-app
ng serve            # http://localhost:4200

# Bausteine erzeugen
ng generate component team/team-liste
ng generate service team/team-api`,
      notes: [['npm install -g @angular/cli', 'Das ng-Werkzeug für alles: anlegen, starten, bauen, testen.'], ['ng new', 'Legt ein fertiges Projekt an: zoneless, standalone, Vitest, alles wie hier gelernt.'], ['ng serve', 'Startet den Entwicklungsserver mit Live-Neuladen.'], ['ng generate', 'Erzeugt Dateien nach Angular-Stil. Kurz: ng g c.']],
      pro: 'Projektidee: eine Team-App mit Entwicklerliste (HTTP + Signals), Entwicklerformular (Signal Forms oder Reactive Forms mit Validator), Login (Interceptor + Guard) und Auswertung (@defer). Daten vom eigenen Fake-Server (json-server) oder einer freien Public-API.' },
    { t: 'Git wie im Team', say: 'In Firmen geht nichts direkt auf main. Jede Änderung bekommt einen Branch, einen Pull Request und ein Review.', job: 'Branch-Namen wie feature/PW-112-entwicklersuche oder fix/PW-130-uhr verbinden den Code mit dem Ticket. Viele Teams verlangen das.',
      code: C`
git switch -c feature/entwicklerformular
# … arbeiten …
git add .
git commit -m "feat(team): Entwicklerformular mit Validierung"
git push -u origin feature/entwicklerformular
# → auf GitHub einen Pull Request öffnen`,
      notes: [['git switch -c', 'Neuer Branch für genau eine Sache.'], ['feat(team):', 'Conventional Commits: feat, fix, refactor, test, docs. Daraus lassen sich Changelogs bauen.'], ['git push -u', 'Branch hochladen.'], ['Pull Request', 'Beschreibung: was, warum, wie getestet. Klein halten: unter 400 Zeilen.']],
      pro: 'Lerne außerdem git rebase (Branch auf neuen Stand bringen), Merge-Konflikte lösen und git bisect (findet den Commit, der einen Fehler eingebaut hat). Das fragt jedes Team irgendwann.' },
    { t: 'Die Pipeline', say: 'Die Pipeline kennst du aus „Einmal bauen, überall live“. Jetzt baust du sie selbst, hier mit den ng-Befehlen statt npm-Skripten.', job: 'Eine Pipeline mit lint, test und build ist in fast jeder Firma Standard. Hast du sie in deinem eigenen Projekt gebaut, kannst du im Gespräch genau darüber reden.',
      code: C`
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx ng lint
      - run: npx ng test --watch=false
      - run: npx ng build`,
      notes: [['on: [pull_request]', 'Läuft bei jedem Pull Request.'], ['npm ci', 'Installiert exakt nach package-lock.json. Reproduzierbar.'], ['ng lint', 'Vorher einmal: ng add @angular-eslint/schematics.'], ['ng test --watch=false', 'Einmal durchlaufen statt warten.'], ['ng build', 'Prüft Typen und Budgets in angular.json.']],
      pro: 'Danach: Deploy automatisch bei Merge auf main, z. B. mit Firebase Hosting, Netlify, Vercel oder GitHub Pages (ng add angular-cli-ghpages). Jede Änderung ist dann Minuten später live.' },
    { t: 'Definition of Done', say: 'Wann ist eine Aufgabe fertig? Nicht wenn es auf deinem Rechner läuft, sondern wenn alle Punkte erfüllt sind.', job: 'In vielen Teams hängt die Definition of Done im Wiki: Tests grün, Review durch, Akzeptanzkriterien erfüllt, auf Test-Server geprüft. Erst dann wird das Ticket geschlossen.',
      points: [['Tests', 'Neue Logik hat Tests, alle Tests grün.', 'plus'], ['Review', 'Mindestens eine Person hat den Pull Request freigegeben.', 'plus'], ['Pipeline grün', 'Lint, Tests, Build, Budgets.', 'plus'], ['Barrierefrei', 'Tastatur und Screenreader kurz geprüft.', 'plus'], ['Fehlerfälle', 'Was passiert offline, bei 500, bei leerer Liste?', 'plus'], ['Doku', 'README oder Kommentar, wenn etwas nicht offensichtlich ist.', '']],
      pro: 'Große Firmen nutzen oft Nx (Monorepo: viele Apps und Bibliotheken, nur Betroffenes wird getestet) und Angular Material/CDK (fertige, barrierefreie Bausteine). Probier beides in deinem Projekt: npx create-nx-workspace und ng add @angular/material.' }
  ],
  quiz: [
    { q: 'npm ci bricht in deiner Pipeline ab: package.json und package-lock.json passen nicht zusammen. Was tust du?', options: ['In der Pipeline npm install statt npm ci nehmen', 'Lokal npm install ausführen und die aktualisierte package-lock.json committen', 'package-lock.json löschen und in .gitignore eintragen', 'npm ci --force in die Pipeline schreiben'], correct: 1, why: 'npm ci installiert nur, was im Lockfile steht. Darum gehört das Lockfile immer aktuell ins Repo.' },
    { q: 'Wie sieht ein guter Pull Request aus?', options: ['Möglichst groß, alles auf einmal', 'Klein, mit nur einem Thema und einer Beschreibung: was, warum und wie getestet', 'Ohne Beschreibung, der Code spricht für sich', 'Gar nicht, man pusht direkt auf main'], correct: 1, why: 'Kleine PRs werden schneller und gründlicher reviewt.' },
    { q: 'Was bedeutet „feat(team): …“ in einer Commit-Nachricht?', options: ['Der Commit liegt auf dem Branch team', 'Das ist ein Conventional Commit: ein neues Feature im Bereich team', 'Ein Feature-Flag namens team wird eingeschaltet', 'Ein Release-Tag für das Team'], correct: 1, why: 'So sehen alle Nachrichten einheitlich aus, und daraus lassen sich Changelogs erzeugen.' },
    { q: 'Wann ist eine Aufgabe „Done“?', options: ['Wenn sie auf deinem Rechner läuft', 'Wenn Tests, Review, grüne Pipeline und Fehlerfälle erfüllt sind', 'Wenn der Pull Request geöffnet ist', 'Sobald der Commit gemacht ist'], correct: 1, why: 'Die Definition of Done gilt für alle im Team gleich.' }
  ],
  takeaway: ['Eigenes Projekt mit ng new: Liste, Formular, Login, Auswertung.', 'Git im Team: Branch, kleiner Pull Request, Review, Conventional Commits.', 'CI bei jedem PR: npm ci, lint, test, build. Deploy bei Merge.', 'Done = Tests + Review + grüne Pipeline + Fehlerfälle.'],
  pairs: [
    ['Branch', 'Eigener Zweig für jede Änderung'],
    ['Pull Request', 'Bitte um Review vor dem Merge'],
    ['CI', 'npm ci, lint, test, build bei jedem PR'],
    ['Definition of Done', 'Tests, Review, grüne Pipeline, Fehlerfälle'],
    ['Conventional Commits', 'Nachrichten wie „feat: …“ oder „fix: …“']
  ]
});

CH.push({
  id: 'k29', act: 9, title: 'Das Fachgespräch', tag: 'Fachgespräch im Team · Code Review · STAR', xp: 250,
  docs: [['Komponenten-Teilbäume überspringen (OnPush)', 'https://angular.dev/best-practices/skipping-subtrees'], ['Signals und RxJS verbinden', 'https://angular.dev/ecosystem/rxjs-interop'], ['Hierarchische Dependency Injection', 'https://angular.dev/guide/di/hierarchical-dependency-injection']],
  ticket: { id: 'PW-157', category: 'Frage', heading: 'Tech-Talk: den Workshop-Planer vorstellen', text: 'Am Freitag stellst du dem Team den Workshop-Planer vor. Danach kommen Fachfragen, ein kurzes Live-Coding im Pairing und das Code-Review-Gespräch zu deinem Pull Request. Bereite dich vor.' },
  story: [
    ['erz', 'Im Kalender steht ein neuer Termin: Tech-Talk am Freitag. Du stellst den Workshop-Planer vor, Jonas und Mia reviewen danach deinen Pull Request.'],
    ['du', 'Ich weiß viel. Aber wenn mich jemand fragt, fang ich an zu stottern.'],
    ['toni', 'Wissen hast du. Jetzt üben wir, es in fünf Minuten so zu erklären, dass das ganze Team folgen kann. Am besten mit Beispielen aus deinen Tickets hier.']
  ],
  slides: [
    { t: 'Die STAR-Antwort', say: 'Auf „Erzähl mal, wie du das gelöst hast“ antwortest du in vier Teilen. Kurz, konkret, mit Zahl am Ende.', job: 'Ein Beispiel aus deinen Tickets: „Die Entwicklersuche zeigte falsche Ergebnisse (S). Ich sollte das bis zum Release fixen (T). Ich habe mergeMap durch switchMap ersetzt und einen Test geschrieben (A). Seitdem keine Meldungen mehr (R).“',
      points: [['S: Situation', '„Unsere Teamliste lud 8 Sekunden.“', ''], ['T: Task', '„Ich sollte sie unter 1 Sekunde bringen.“', ''], ['A: Action', '„Ich habe gemessen, @defer und virtuelles Scrollen eingebaut, OnPush/Signals genutzt.“', 'plus'], ['R: Result', '„0,7 Sekunden, Absprünge −30 %.“ Eine Zahl wirkt mehr als drei Adjektive.', 'plus'], ['Ich statt wir', 'Sag, was DU gemacht hast. Das Team darfst du loben.', '']],
      pro: 'Bereite 4 bis 5 STAR-Geschichten vor: ein Erfolg, ein Fehler und was du gelernt hast, eine schwere technische Entscheidung, ein Mal, wo du jemandem geholfen hast. Die passen in Retro, Review und Tech-Talk auf fast jede Frage.' },
    { t: 'Die Klassiker im Fachgespräch', say: 'Diese Fragen kommen im Team immer wieder: im Review, beim Pairing, wenn jemand Neues fragt. Du kennst alle Antworten aus den Phasen vorher.', job: 'Signals vs. RxJS, Change Detection, DI, Lazy Loading, Testen: Zu jedem Thema hast du hier ein Ticket gelöst. Erzähl das Ticket, nicht die Doku.',
      points: [['Change Detection', 'Zone.js vs. zoneless, OnPush, Signals. Wann wird neu gezeichnet?', ''], ['Signals vs. RxJS', 'Zustand vs. Ereignisse über Zeit. toSignal / toObservable als Brücke.', ''], ['switchMap & Co.', 'switchMap / mergeMap / concatMap / exhaustMap: wann welcher?', ''], ['DI', 'providedIn root vs. providers in der Komponente, InjectionToken, Hierarchie.', ''], ['Lecks & Performance', 'Abos aufräumen, track in @for, @defer, Bundle messen.', ''], ['Architektur', 'Smart/Dumb, Ordner nach Fachbereich, wann NgRx und wann nicht.', '']],
      pro: 'Antworte in drei Stufen: ein Satz Definition, ein Beispiel aus deinem Code, ein Trade-off („… aber Achtung bei …“). Der Trade-off ist, was Senior von Junior unterscheidet.' },
    { t: 'Live-Coding überleben', say: 'Beim Live-Coding zählt nicht nur das Ergebnis. Das Team will sehen, wie du denkst.', job: 'Laut denken, erst die einfache Lösung, dann verbessern. Wenn du hängst, sag es und frag nach. Das wirkt im Live-Coding besser als stilles Grübeln.',
      points: [['Laut denken', '„Ich würde erst die Daten als Signal halten, dann …“ Schweigen ist das Schlimmste.', 'plus'], ['Rückfragen', '„Soll die Suche bei jedem Tastendruck laufen?“ Das zeigt Erfahrung.', 'plus'], ['Erst einfach, dann schön', 'Erst läuft es, dann räumst du auf. Sag das auch so.', 'plus'], ['Fehler offen zugeben', '„Ah, hier fehlt track. Kurz korrigieren.“ Ruhig bleiben wirkt senior.', ''], ['Testfall nennen', '„Was passiert bei leerer Liste?“ Randfälle selbst ansprechen.', 'plus']],
      pro: 'Übe mit einer Uhr: Suchfeld mit debounceTime + switchMap, ein Formular mit Validator (Signal Forms oder Reactive Forms), eine Liste mit Filter über computed. Das sind die drei häufigsten Live-Aufgaben.' },
    { t: 'Das Code-Review-Gespräch', say: 'Im Review-Gespräch erklärst du deinen Code. Erst das Ziel, dann deine Entscheidung, dann ihren Preis. Und du nimmst Rückfragen ernst.', job: 'Typische Fragen im Review: „Warum httpResource und nicht toSignal?“, „Was passiert bei 500?“, „Warum ist der Knopf nicht gesperrt?“ Wer mit Grund antwortet, bekommt schneller ein Approve.',
      points: [['Erst das Ziel', 'Was soll der Pull Request lösen? Ein Satz.', ''], ['Dann die Entscheidung', '„Ich habe httpResource genommen, weil die Liste nur gelesen wird.“ Immer mit Grund.', ''], ['Den Preis nennen', '„Dafür lädt die Liste nach jeder Anmeldung neu.“ Jede Lösung hat einen Trade-off.', 'plus'], ['Rückfragen annehmen', '„Guter Punkt, das prüfe ich.“ Kritik am Code ist keine Kritik an dir.', 'plus'], ['Selbst fragen', '„Wie würdet ihr das lösen?“ So lernst du vom Team.', 'plus']],
      pro: 'Architektur erklären in drei Ebenen: Seiten (Routen und Guards), Bausteine (Seite mit Daten, Karten nur zum Anzeigen), Daten (Service, httpResource, Server). Mal die drei Ebenen kurz auf, bevor du in den Code springst.' }
  ],
  quiz: [
    { q: 'Im Fachgespräch mit dem Team fragt man dich: „Wann nimmst du Signals, wann RxJS?“ Welche Antwort ist die beste?', options: ['Immer Signals, RxJS ist alt', 'Signals nehme ich für Zustand, RxJS für Ereignisse über die Zeit wie Suche oder WebSocket. toSignal ist die Brücke.', 'Immer RxJS', 'Das ist egal, beides geht überall'], correct: 1, why: 'Die Antwort enthält eine Definition, ein Beispiel und die Brücke zwischen beiden. Genau so überzeugst du.' },
    { q: 'In einem Suchfeld startet jede Eingabe eine Anfrage, und alte Antworten überschreiben manchmal neuere. Welcher Operator behebt das?', options: ['mergeMap', 'concatMap', 'switchMap', 'exhaustMap'], correct: 2, why: 'switchMap bricht die alte Anfrage ab, sobald eine neue startet.' },
    { q: 'Jemand drückt den Login-Knopf dreimal schnell hintereinander, und nur der erste Klick soll zählen. Welcher Operator passt?', options: ['switchMap', 'exhaustMap', 'mergeMap', 'debounceTime'], correct: 1, why: 'exhaustMap ignoriert neue Werte, solange die erste Anfrage noch läuft.' },
    { q: 'Was ist der Unterschied zwischen providedIn: \'root\' und providers: [X] in einer Komponente?', options: ['Es gibt keinen Unterschied', 'Mit root gibt es eine Instanz für die ganze App. Mit providers bekommt jede Instanz der Komponente eine eigene, die mit ihr stirbt.', 'root ist langsamer', 'Komponenten dürfen keine providers haben'], correct: 1, why: 'Das folgt aus der Hierarchie der Injectoren in Angular.' },
    { q: 'Warum braucht @for ein track?', options: ['Das ist Pflicht, hat aber keinen technischen Grund', 'Damit Angular weiß, welcher Eintrag welcher ist, und nur Geändertes neu zeichnet', 'Damit Angular die Liste sortieren kann', 'Damit TypeScript die Typen prüfen kann'], correct: 1, why: 'Ohne gutes track baut Angular bei Änderungen unnötig viele Elemente der Liste neu.' },
    { q: 'Was bewirkt die Change-Detection-Strategie OnPush?', options: ['Die App schickt Push-Nachrichten', 'Angular prüft die Komponente nur bei neuem Input, einem Ereignis in ihr, einem neuen Wert der async-Pipe oder einem geänderten Signal', 'Die App funktioniert auch offline', 'Angular lädt Code erst bei Bedarf nach'], correct: 1, why: 'Das spart Prüfungen und macht die App schneller. Seit Angular 22 ist OnPush der Standard.' },
    { q: 'Was gehört bei einer Antwort nach der STAR-Methode ins R (Result)?', options: ['Die Rollen im Team', 'Ein messbares Ergebnis, am besten mit Zahl', 'Eine Reflexion über deine Gefühle', 'Deine Referenzen'], correct: 1, why: 'Eine Zahl wie „0,7 Sekunden statt 8“ bleibt hängen.' },
    { q: 'Beim Live-Coding im Fachgespräch weißt du nicht weiter. Was tust du?', options: ['Du schweigst und tippst weiter', 'Du denkst laut, nennst deine Annahme und fragst nach', 'Du brichst ab', 'Du googelst, ohne etwas zu sagen'], correct: 1, why: 'Das Team will sehen, wie du denkst, nicht nur den fertigen Code.' },
    { q: 'Im Fachgespräch mit dem Team fragt man dich: „Wie findest du ein Speicherleck?“ Welche Antwort ist die beste?', options: ['Ich prüfe den Lighthouse-Score', 'Im Memory-Tab der DevTools vergleiche ich Heap Snapshots vor und nach der Navigation, dann suche ich offene Abos, Timer und Listener', 'Ich ersetze alle subscribe durch Promises', 'Ich schreibe überall console.log hinein'], correct: 1, why: 'Erst messen, dann gezielt aufräumen, zum Beispiel mit DestroyRef und takeUntilDestroyed.' },
    { q: 'Im Code-Review-Gespräch fragt Jonas: „Warum lädst du die Liste mit httpResource?“ Welche Antwort ist die beste?', options: ['„Das macht man heute so.“', '„Die Liste wird nur gelesen, und httpResource gibt mir Laden, Fehler und Daten als Signals. Der Preis: Nach jeder Änderung rufe ich reload() auf.“', '„Das hat Toni gesagt.“', '„Ich kann es auch wieder ändern, wenn du willst.“'], correct: 1, why: 'Ziel, Grund und Preis in zwei Sätzen. So kann das Team die Entscheidung prüfen.' }
  ],
  takeaway: ['STAR: Situation, Aufgabe, deine Aktion, Ergebnis mit Zahl.', 'Fachfragen in 3 Stufen: Definition, Beispiel, Trade-off.', 'Live-Coding: laut denken, nachfragen, erst einfach, dann schön.', 'Im Review: Ziel, Entscheidung, Preis. Rückfragen annehmen, selbst fragen.'],
  pairs: [
    ['S: Situation', '„Unsere Teamliste lud 8 Sekunden.“'],
    ['T: Task', '„Ich sollte sie unter 1 Sekunde bringen.“'],
    ['A: Action', '„Ich habe gemessen und @defer eingebaut.“'],
    ['R: Result', '„0,7 Sekunden, Absprünge −30 %.“'],
    ['Den Preis nennen', '„Dafür lädt die Liste nach jeder Anmeldung neu.“']
  ]
});
