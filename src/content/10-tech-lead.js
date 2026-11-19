/* ================= Phase: TECH LEAD =================
   Ausblick: Architektur, Security, Team führen. Für das Lernziel „Angular sicher beherrschen“ ist das die Kür, nicht die Pflicht. */
ACTS.push({ n: 8, title: 'Tech Lead', sub: 'Ausblick: Architektur, wann Angular passt, Security & a11y, das Team führen' });

CH.push({
  id: 'k26', act: 8, title: 'Ordnung im großen Projekt', tag: 'Architektur · Smart & Dumb', xp: 200,
  docs: [['Eingaben mit input()', 'https://angular.dev/guide/components/inputs'], ['Eigene Events mit output()', 'https://angular.dev/guide/components/outputs'], ['Libraries erstellen', 'https://angular.dev/tools/libraries/creating-libraries']],
  ticket: { id: 'PW-153', category: 'Tech-Debt', heading: 'Komponenten trennen: Daten und Anzeige', text: 'Die Teamseite holt Daten, filtert, zeigt an und speichert. Ändert jemand etwas, geht die Zeiterfassung kaputt. Trenne in eine smarte Seite und eine dumme Liste.' },
  story: [
    ['erz', 'Diese Phase ist ein Ausblick. Sie zeigt, was auf dich zukommt, wenn du später mehr Verantwortung im Team übernimmst. Nimm mit, was dir heute schon hilft.'],
    ['erz', 'Pixelwerk ist gewachsen. 15 Entwickler, 300 Komponenten. Keiner findet mehr etwas.'],
    ['jonas', 'Gestern hat jemand die Entwicklerliste geändert, und die Zeiterfassung ging kaputt. Wie hängt das überhaupt zusammen?'],
    ['toni', 'Genau das ist das Problem. Wir brauchen Architektur: klare Rollen, klare Ordner, klare Grenzen.']
  ],
  slides: [
    { t: 'Smart & Dumb: Daten und Anzeige', say: '„Data down, events up“ kennst du aus „Seite und Karte“. Im großen Projekt wird daraus eine feste Regel mit zwei Sorten. „Smart“ (Container) holen Daten und entscheiden. „Dumb“ (Presentational) zeigen nur an, was sie per input() bekommen, und melden per output().', job: 'In vielen Teams ist es Regel: Komponenten in ui/ oder components/ dürfen keinen Service injizieren. Dann sind sie überall verwendbar und leicht zu testen.',
      points: [['Smart / Container', 'inject() von Services, Daten laden, Router, State. Wenig eigenes HTML.', ''], ['Dumb / Presentational', 'Nur input() und output(). Kein inject von Fach-Services. Leicht wiederverwendbar und testbar.', 'plus'], ['Faustregel', 'Die meisten Komponenten sollten „dumm“ sein. Nur wenige oben sind „smart“.', '']],
      pro: 'Dumme Komponenten sind perfekt für ein Design-System und für Storybook: Man kann sie mit Testdaten anzeigen, ganz ohne Backend.' },
    { t: 'Ordner nach Fachbereich', say: 'Sortier den Code nach Fachbereich (Feature), nicht nach Technik. Alles zum Team liegt zusammen.', job: 'Ein Ordner features/team/ mit allem, was dazugehört, macht Tickets leichter: Du weißt sofort, wo du suchen musst, und änderst nicht aus Versehen etwas für die Zeiterfassung.',
      code: C`
src/app/
  team/              ← Feature
    team-seite.ts      (smart)
    entwickler-liste.ts    (dumb)
    team.store.ts
    team.routes.ts
  tickets/            ← Feature
  shared/
    ui/               ← dumme Bausteine: Button, Karte
    utils/            ← reine Funktionen
  core/               ← einmalig: Auth, Interceptor, Layout`,
      notes: [['team/', 'Ein Feature-Ordner. Hat alles, was das Team braucht.'], ['team.routes.ts', 'Eigene Routen, per loadChildren lazy geladen.'], ['shared/', 'Wird von vielen Features benutzt. Darf selbst KEIN Feature kennen.'], ['core/', 'Gibt es nur einmal in der App.']],
      pro: 'Wichtigste Regel: Abhängigkeiten zeigen nur in eine Richtung. Features dürfen shared benutzen, shared nie ein Feature. Und Features nicht kreuz und quer untereinander.' },
    { t: 'Grenzen erzwingen: Monorepo & Nx', say: 'In großen Firmen liegen viele Apps und Libraries in einem Repo. Werkzeuge wie Nx prüfen automatisch, wer wen benutzen darf.', job: 'Mit Nx-Regeln schlägt der Build fehl, wenn das Ticket-Feature direkt aus dem Team-Feature importiert. Solche Grenzen findest du in vielen großen Firmen-Repos.',
      points: [['Libraries', 'Code in eigene Pakete schneiden (ng generate library): klare öffentliche API über index.ts.', 'plus'], ['Nx-Grenzen', 'Tags wie scope:team und type:ui. Ein Lint-Fehler, wenn jemand die Regeln bricht.', 'plus'], ['Nur bauen, was sich geändert hat', 'Nx baut und testet nur betroffene Projekte.', 'plus'], ['Micro-Frontends', 'Teile der App getrennt ausliefern (Module Federation). Nur bei vielen unabhängigen Teams. Bringt viel Komplexität.', 'minus']],
      pro: 'Senior-Satz für Meetings: „Micro-Frontends lösen ein Organisations-Problem, kein Technik-Problem. Haben wir das Problem wirklich?“' }
  ],
  quiz: [
    { q: 'Was darf eine „dumme“ Komponente (Presentational Component)?', options: ['Services injecten und Daten laden', 'Nur Daten per input() bekommen und per output() melden', 'Den Router steuern', 'Alles'], correct: 1, why: 'Sie zeigt an und meldet. Die Entscheidungen trifft der Container.' },
    { q: 'Wonach sortiert man die Ordner in einer großen App?', options: ['Nach Technik (components/, services/)', 'Nach Fachbereich (team/, tickets/)', 'Nach dem Entwickler, der es gebaut hat', 'Gar nicht, alles liegt flach in src/app/'], correct: 1, why: 'Was zusammen geändert wird, liegt dann auch zusammen.' },
    { q: 'Darf Code aus dem Ordner shared/ etwas aus einem Feature-Ordner importieren?', options: ['Ja, shared ist für alle da', 'Nein, nur umgekehrt', 'Nur, wenn das Feature lazy geladen wird', 'Nur mit Nx'], correct: 1, why: 'Abhängigkeiten zeigen nur in eine Richtung: Features benutzen shared, nicht umgekehrt. Sonst entsteht Spaghetti-Code.' }
  ],
  ex: { id: 'ex26', title: 'Seite und Liste trennen', goal: 'Teil das Team in eine dumme <code>EntwicklerListe</code> und eine smarte <code>TeamSeite</code>.', preview: 'TeamSeite',
    todo: ['<b>EntwicklerListe</b> (dumm): <code>entwickler = input.required&lt;Entwickler[]&gt;()</code>, <code>auswahl = output&lt;Entwickler&gt;()</code>, KEIN inject', 'Pro Entwickler ein <code>&lt;li&gt;</code> mit Namen, Klick emittet den Entwickler', '<b>TeamSeite</b> (smart): holt den <code>TeamService</code>, gibt <code>team.entwickler()</code> an die Liste', 'Bei <code>(auswahl)</code> ruft sie <code>team.waehlen($event)</code>, <code>p.gewaehlt</code> zeigt „Gewählt: NAME“'],
    starter: C`
import { Component, Service, signal, inject, input, output } from '@angular/core';

export interface Entwickler { id: number; name: string; }

@Service()
export class TeamService {
  entwickler = signal<Entwickler[]>([{ id: 1, name: 'Leon' }, { id: 2, name: 'Mo' }, { id: 3, name: 'Ben' }]);
  gewaehlt = signal<Entwickler | null>(null);
  waehlen(s: Entwickler) { this.gewaehlt.set(s); }
}

// Dumm: nur anzeigen und melden
@Component({
  selector: 'app-entwickler-liste',
  template: \`<ul></ul>\`,
})
export class EntwicklerListe {
  team = inject(TeamService); // gehört hier nicht hin!
}

// Smart: holt Daten, entscheidet
@Component({
  selector: 'app-team-seite',
  imports: [EntwicklerListe],
  template: \`
    <app-entwickler-liste />
    <p class="gewaehlt">Gewählt: </p>
  \`,
})
export class TeamSeite {
}
`,
    solution: C`
import { Component, Service, signal, inject, input, output } from '@angular/core';

export interface Entwickler { id: number; name: string; }

@Service()
export class TeamService {
  entwickler = signal<Entwickler[]>([{ id: 1, name: 'Leon' }, { id: 2, name: 'Mo' }, { id: 3, name: 'Ben' }]);
  gewaehlt = signal<Entwickler | null>(null);
  waehlen(s: Entwickler) { this.gewaehlt.set(s); }
}

@Component({
  selector: 'app-entwickler-liste',
  template: \`
    <ul>
      @for (s of entwickler(); track s.id) {
        <li (click)="auswahl.emit(s)">{{ s.name }}</li>
      }
    </ul>
  \`,
})
export class EntwicklerListe {
  entwickler = input.required<Entwickler[]>();
  auswahl = output<Entwickler>();
}

@Component({
  selector: 'app-team-seite',
  imports: [EntwicklerListe],
  template: \`
    <app-entwickler-liste [entwickler]="team.entwickler()" (auswahl)="team.waehlen($event)" />
    <p class="gewaehlt">Gewählt: {{ team.gewaehlt()?.name }}</p>
  \`,
})
export class TeamSeite {
  team = inject(TeamService);
}
`,
    notes: [['entwickler = input.required', 'Die Liste bekommt ihre Daten nur von außen.'], ['auswahl = output', 'Und meldet nach oben, statt selbst zu entscheiden.'], ['(click)="auswahl.emit(s)"', 'Klick: „Der hier wurde gewählt!“'], ['[entwickler]="team.entwickler()"', 'Der Container reicht die Daten runter.'], ['(auswahl)="team.waehlen($event)"', 'Und entscheidet, was mit der Meldung passiert.'], ['?.name', 'Optional Chaining: Ist noch keiner gewählt (null), steht da einfach nichts.'], ['team = inject(TeamService)', 'Nur der Smarte kennt den Service.']],
    hints: ['In EntwicklerListe: <code>inject</code> raus, dafür <code>entwickler = input.required&lt;Entwickler[]&gt;();</code> und <code>auswahl = output&lt;Entwickler&gt;();</code>', 'TeamSeite-Template: <code>&lt;app-entwickler-liste [entwickler]="team.entwickler()" (auswahl)="team.waehlen($event)" /&gt;</code>', 'Gewählter Name: <code>{{ team.gewaehlt()?.name }}</code>'],
    tests: [
      { name: 'EntwicklerListe zeigt, was sie bekommt', run: T => { const f = T.mount(T.cmp('EntwicklerListe'), { inputs: { entwickler: [{ id: 7, name: 'Ali' }, { id: 8, name: 'Tom' }] } }); T.eq(f.qa('li').map(l => l.textContent.trim()), ['Ali', 'Tom'], 'Mit entwickler = [Ali, Tom] sollen genau diese zwei <li> erscheinen.'); } },
      { name: 'EntwicklerListe meldet die Auswahl', run: async T => { const f = T.mount(T.cmp('EntwicklerListe'), { inputs: { entwickler: [{ id: 7, name: 'Ali' }] } }); let got = null; T.ok(f.instance.auswahl && f.instance.auswahl.subscribe, 'Es fehlt auswahl = output<Entwickler>().'); f.instance.auswahl.subscribe(v => got = v); await f.click('li'); T.eq(got, { id: 7, name: 'Ali' }, 'Klick auf <li> soll den Entwickler per auswahl.emit(s) melden.'); } },
      { name: 'EntwicklerListe ist dumm (kein inject)', run: T => { const m = T.code.match(/class\s+EntwicklerListe\b[\s\S]*?\n}/); T.ok(m && !/inject\s*\(/.test(m[0]), 'In EntwicklerListe darf kein inject(...) stehen. Daten kommen per input().'); } },
      { name: 'TeamSeite verbindet alles', run: async T => { const f = T.mount(T.cmp('TeamSeite')); T.eq(f.qa('li').map(l => l.textContent.trim()), ['Leon', 'Mo', 'Ben'], 'TeamSeite soll die Entwickler aus dem Service an die Liste geben.'); await f.click(f.qa('li')[1]); T.ok(/Gewählt:\s*Mo/.test(f.q('.gewaehlt').textContent), 'Nach Klick auf Mo soll „Gewählt: Mo“ stehen.'); } }
    ] },
  takeaway: ['Smart (Container) holt und entscheidet, Dumb (Presentational) zeigt und meldet.', 'Ordner nach Fachbereich: team/, tickets/, shared/, core/.', 'Abhängigkeiten nur in eine Richtung. Nx kann das erzwingen.', 'Micro-Frontends nur, wenn es wirklich viele unabhängige Teams gibt.'],
  pairs: [
    ['Smart / Container', 'Holt Daten und entscheidet'],
    ['Dumb / Presentational', 'Nur input() und output()'],
    ['Ordner nach Fachbereich', 'team/, tickets/, shared/, core/'],
    ['Nx', 'Erzwingt, wer wen benutzen darf'],
    ['Micro-Frontends', 'Nur bei vielen unabhängigen Teams']
  ]
});

CH.push({
  id: 'k32', act: 8, title: 'Grenzen, die der Build prüft', tag: 'Modulgrenzen · Tags · Lint-Regeln', xp: 240,
  docs: [['Libraries erstellen', 'https://angular.dev/tools/libraries/creating-libraries'], ['Projektgrenzen in Nx', 'https://nx.dev/features/enforce-module-boundaries'], ['Style Guide: Projektstruktur', 'https://angular.dev/style-guide']],
  ticket: { id: 'PW-161', category: 'Tech-Debt', heading: 'Architekturregeln automatisch prüfen', text: 'Die Ordnerregeln aus „Ordnung im großen Projekt“ stehen im Wiki, und trotzdem importiert jede Woche jemand quer. Schreib die Prüfung, die im Build jeden verbotenen Import meldet.' },
  story: [
    ['jonas', 'Schon wieder: Das Ticket-Feature importiert direkt aus dem Team-Feature. Und shared/ui holt sich einen Service aus der Zeiterfassung.'],
    ['du', 'Aber die Regeln stehen doch im Wiki.'],
    ['toni', 'Eben. Regeln im Wiki liest keiner. Regeln im Build kann keiner übersehen. Als Tech Lead baust du nicht nur Features, du baust die Leitplanken.']
  ],
  slides: [
    { t: 'Jedes Projekt bekommt Etiketten', say: 'Im Monorepo bekommt jede Library zwei Tags: wofür sie da ist (type) und zu welchem Fachbereich sie gehört (scope). Daraus ergeben sich die Regeln.', job: 'In großen Angular-Repos stehen diese Tags in der project.json jeder Library. Ein neues Team bekommt am ersten Tag die Tabelle: welcher type darf welchen benutzen.',
      points: [['type:feature', 'Seiten und Abläufe. Darf ui, data und util benutzen.', ''], ['type:ui', 'Dumme Bausteine. Darf nur ui und util benutzen, nie data.', ''], ['type:data', 'Services, Stores, API. Darf data und util benutzen.', ''], ['type:util', 'Reine Funktionen. Benutzt nur andere util.', ''], ['scope:team, scope:tickets …', 'Ein Fachbereich darf nur sich selbst und scope:shared benutzen.', 'plus']],
      pro: 'Die Richtung zählt mehr als die Namen: Abhängigkeiten zeigen von oben (feature) nach unten (util), nie zurück. So entstehen keine Kreise, und jede Library lässt sich einzeln testen und bauen.' },
    { t: 'Die Prüfung als Funktion', say: 'Ein Lint-Werkzeug wie Nx macht im Kern genau das: Für jeden Import schaut es die Tags beider Seiten nach und vergleicht sie mit der Regel-Tabelle.', job: 'Eigene kleine Prüfungen wie diese laufen in vielen Firmen in der CI. Ein rotes Häkchen am Pull Request erklärt die Regel besser als jedes Meeting.',
      code: C`
const ERLAUBT: Record<string, string[]> = {
  feature: ['feature', 'ui', 'data', 'util'],
  ui: ['ui', 'util'],
  data: ['data', 'util'],
  util: ['util'],
};

const tag = (tags: string[], art: string) =>
  tags.find(t => t.startsWith(art + ':'))?.split(':')[1];

if (!ERLAUBT[typVon]?.includes(typNach)) {
  fehler.push(\`\${von} → \${nach}: \${typVon} darf kein \${typNach} benutzen\`);
}`,
      notes: [['ERLAUBT', 'Die Regel-Tabelle: Wer darf wen benutzen? Einmal aufgeschrieben, überall gleich.'], ['tags.find', 'Sucht das Etikett, das mit type: oder scope: anfängt.'], ['?.split', 'Optional Chaining: Fehlt das Etikett, kommt undefined statt eines Absturzes.'], ['!ERLAUBT[typVon]?.includes', 'Steht der Typ des Ziels nicht in der Liste, ist der Import verboten.'], ['fehler.push', 'Die Meldung nennt beide Seiten und den Grund. So weiß jeder sofort, was zu tun ist.']],
      pro: 'Gute Fehlermeldungen sind Teil der Architektur. „Import verboten“ hilft niemandem. „tickets-feature → team-data: scope tickets darf nicht scope team benutzen“ sagt, was los ist.' },
    { t: 'Regeln einführen, ohne alles anzuhalten', say: 'In einem alten Repo gibt es am ersten Tag hunderte Verstöße. Ein guter Tech Lead schaltet die Prüfung trotzdem ein, aber in Stufen.', job: 'So läuft es in der Praxis: erst messen, dann neue Verstöße verbieten, dann die alten nach und nach abbauen. Jede Woche ein paar, in normalen Tickets.',
      points: [['1. Messen', 'Prüfung läuft, meldet aber nur. Wie viele Verstöße gibt es, wo häufen sie sich?', ''], ['2. Nichts Neues', 'Bekannte Verstöße stehen auf einer Ausnahmeliste. Jeder neue macht den Build rot.', 'plus'], ['3. Abbauen', 'Die Ausnahmeliste wird kürzer. Wer eine Datei anfasst, räumt ihren Verstoß mit auf.', 'plus'], ['Big Bang', 'Alles an einem Wochenende umbauen. Klingt mutig, bricht meist Features und Nerven.', 'minus']],
      pro: 'Senior-Satz fürs Meeting: „Wir machen es nicht sofort perfekt, aber ab heute nicht mehr schlimmer.“ Das überzeugt auch Leute, die Angst vor dem Umbau haben.' }
  ],
  quiz: [
    { q: 'Eine Library mit <code>type:ui</code> will einen Service aus einer Library mit <code>type:data</code> benutzen. Ist das erlaubt?', options: ['Ja, Services darf jeder benutzen', 'Nein, ui darf nur ui und util benutzen', 'Nur, wenn beide denselben scope haben', 'Nur in Tests'], correct: 1, why: 'Dumme Bausteine sollen keine Daten holen. Sonst sind sie nicht mehr überall verwendbar und schwer zu testen.' },
    { q: 'Das Feature <code>scope:tickets</code> importiert aus einer Library mit <code>scope:team</code>. Was sagt die Scope-Regel?', options: ['Verboten, ein Fachbereich darf nur sich selbst und shared benutzen', 'Erlaubt, weil beide Features sind', 'Erlaubt, wenn der Import lazy ist', 'Egal, es zählt nur der type'], correct: 0, why: 'Fachbereiche sollen sich nicht kreuz und quer kennen. Was beide brauchen, wandert nach scope:shared.' },
    { q: 'Ein altes Repo hat 300 Verstöße gegen die neuen Regeln. Was ist meist der beste Weg?', options: ['Prüfung erst einschalten, wenn alle 300 behoben sind', 'Bekannte Verstöße auf eine Ausnahmeliste, jeder neue macht den Build rot', 'Alle Regeln weglassen, das Repo ist zu alt', 'Alles an einem Wochenende umbauen'], correct: 1, why: 'So wird es ab sofort nicht schlimmer, und die alten Verstöße verschwinden Stück für Stück in normalen Tickets.' }
  ],
  ex: { id: 'ex32', title: 'Die Grenzprüfung', goal: 'Schreib <code>pruefeGrenzen(projekte, importe)</code>. Sie gibt für jeden verbotenen Import eine Meldung zurück.',
    todo: ['Typ-Regel: Ist <code>typ(nach)</code> nicht in <code>ERLAUBT[typ(von)]</code>, kommt <code>"von → nach: TYP darf kein TYP benutzen"</code>', 'Scope-Regel: anderer scope und nicht <code>shared</code> ergibt <code>"von → nach: scope X darf nicht scope Y benutzen"</code>', 'Hat ein Projekt keine Tags oder fehlt es ganz: <code>"von → nach: Projekt NAME hat keine Tags"</code>, sonst nichts prüfen', 'Erlaubte Importe erzeugen keine Meldung, die Reihenfolge der Meldungen folgt den Importen'],
    starter: C`
export const ERLAUBT: Record<string, string[]> = {
  feature: ['feature', 'ui', 'data', 'util'],
  ui: ['ui', 'util'],
  data: ['data', 'util'],
  util: ['util'],
};

export interface Import { von: string; nach: string; }

/** Liest aus ['type:ui', 'scope:team'] den Wert zu art ('type' oder 'scope') */
export function tag(tags: string[], art: string): string | undefined {
  return tags.find(t => t.startsWith(art + ':'))?.split(':')[1];
}

export function pruefeGrenzen(projekte: Record<string, string[]>, importe: Import[]): string[] {
  const fehler: string[] = [];
  // Für jeden Import: Tags holen, dann Typ-Regel und Scope-Regel prüfen
  return fehler;
}
`,
    solution: C`
export const ERLAUBT: Record<string, string[]> = {
  feature: ['feature', 'ui', 'data', 'util'],
  ui: ['ui', 'util'],
  data: ['data', 'util'],
  util: ['util'],
};

export interface Import { von: string; nach: string; }

/** Liest aus ['type:ui', 'scope:team'] den Wert zu art ('type' oder 'scope') */
export function tag(tags: string[], art: string): string | undefined {
  return tags.find(t => t.startsWith(art + ':'))?.split(':')[1];
}

export function pruefeGrenzen(projekte: Record<string, string[]>, importe: Import[]): string[] {
  const fehler: string[] = [];
  for (const { von, nach } of importe) {
    const pfeil = von + ' → ' + nach + ': ';
    const ohne = [von, nach].find(p => !projekte[p] || projekte[p].length === 0);
    if (ohne) { fehler.push(pfeil + 'Projekt ' + ohne + ' hat keine Tags'); continue; }
    const typVon = tag(projekte[von], 'type'), typNach = tag(projekte[nach], 'type');
    if (!typVon || !typNach || !ERLAUBT[typVon]?.includes(typNach)) {
      fehler.push(pfeil + typVon + ' darf kein ' + typNach + ' benutzen');
    }
    const scopeVon = tag(projekte[von], 'scope'), scopeNach = tag(projekte[nach], 'scope');
    if (scopeNach !== 'shared' && scopeVon !== scopeNach) {
      fehler.push(pfeil + 'scope ' + scopeVon + ' darf nicht scope ' + scopeNach + ' benutzen');
    }
  }
  return fehler;
}
`,
    notes: [['for (const { von, nach } of importe)', 'Jeder Import wird einzeln geprüft. Die Meldungen kommen in derselben Reihenfolge.'], ['const ohne', 'Erst schauen, ob beide Seiten überhaupt Tags haben. Sonst lässt sich nichts vergleichen.'], ['continue', 'Ohne Tags keine weiteren Regeln für diesen Import, nur die eine klare Meldung.'], ['!ERLAUBT[typVon]?.includes(typNach)', 'Die Typ-Regel: Steht das Ziel nicht in der Tabelle, ist es verboten.'], ["scopeNach !== 'shared'", 'shared darf jeder benutzen, alles andere nur der eigene Fachbereich.']],
    hints: ['Geh mit <code>for (const { von, nach } of importe)</code> durch alle Importe und hol dir mit <code>tag(projekte[von], \'type\')</code> die Typen.', 'Erst prüfen, ob <code>projekte[von]</code> und <code>projekte[nach]</code> Tags haben. Wenn nicht: Meldung und <code>continue</code>.', 'Typ-Regel: <code>if (!ERLAUBT[typVon]?.includes(typNach))</code>. Scope-Regel: <code>if (scopeNach !== \'shared\' &amp;&amp; scopeVon !== scopeNach)</code>.'],
    tests: [
      { name: 'Erlaubte Importe ergeben keine Meldung', run: T => { const P = { 'team-feature': ['type:feature', 'scope:team'], 'team-data': ['type:data', 'scope:team'], 'shared-ui': ['type:ui', 'scope:shared'], 'shared-util': ['type:util', 'scope:shared'] }; T.eq(T.get('pruefeGrenzen')(P, [{ von: 'team-feature', nach: 'team-data' }, { von: 'team-feature', nach: 'shared-ui' }, { von: 'shared-ui', nach: 'shared-util' }]), [], 'Feature benutzt data und ui, ui benutzt util: alles erlaubt.'); } },
      { name: 'Typ-Regel: ui darf kein data benutzen', run: T => { const P = { 'shared-ui': ['type:ui', 'scope:shared'], 'shared-data': ['type:data', 'scope:shared'] }; T.eq(T.get('pruefeGrenzen')(P, [{ von: 'shared-ui', nach: 'shared-data' }]), ['shared-ui → shared-data: ui darf kein data benutzen'], 'ui → data ist verboten. Achte genau auf den Text der Meldung.'); } },
      { name: 'Scope-Regel: kein Import quer zwischen Fachbereichen', run: T => { const P = { 'tickets-feature': ['type:feature', 'scope:tickets'], 'team-data': ['type:data', 'scope:team'] }; T.eq(T.get('pruefeGrenzen')(P, [{ von: 'tickets-feature', nach: 'team-data' }]), ['tickets-feature → team-data: scope tickets darf nicht scope team benutzen'], 'tickets → team ist quer und verboten, auch wenn der Typ passt.'); } },
      { name: 'Beide Regeln verletzt: zwei Meldungen, in Reihenfolge', run: T => { const P = { 'team-ui': ['type:ui', 'scope:team'], 'tickets-feature': ['type:feature', 'scope:tickets'], 'shared-util': ['type:util', 'scope:shared'] }; T.eq(T.get('pruefeGrenzen')(P, [{ von: 'team-ui', nach: 'tickets-feature' }, { von: 'team-ui', nach: 'shared-util' }]), ['team-ui → tickets-feature: ui darf kein feature benutzen', 'team-ui → tickets-feature: scope team darf nicht scope tickets benutzen'], 'Erst die Typ-Meldung, dann die Scope-Meldung. Der erlaubte zweite Import bringt nichts.'); } },
      { name: 'Projekt ohne Tags gibt genau eine klare Meldung', run: T => { const P = { 'team-feature': ['type:feature', 'scope:team'], 'altes-zeug': [] }; T.eq(T.get('pruefeGrenzen')(P, [{ von: 'team-feature', nach: 'altes-zeug' }, { von: 'team-feature', nach: 'gibt-es-nicht' }]), ['team-feature → altes-zeug: Projekt altes-zeug hat keine Tags', 'team-feature → gibt-es-nicht: Projekt gibt-es-nicht hat keine Tags'], 'Fehlen die Tags oder das Projekt, soll nur diese eine Meldung kommen.'); } }
    ] },
  takeaway: ['Jede Library bekommt type und scope als Etikett.', 'Abhängigkeiten zeigen nach unten: feature → data/ui → util, nie zurück.', 'Fachbereiche benutzen nur sich selbst und shared.', 'Regeln gehören in den Build, nicht ins Wiki. Alte Verstöße in Stufen abbauen.'],
  pairs: [
    ['<code>type:feature</code>', 'Seiten und Abläufe, darf ui, data und util'],
    ['<code>type:ui</code>', 'Dumme Bausteine, nie data'],
    ['<code>type:data</code>', 'Services, Stores und API'],
    ['<code>type:util</code>', 'Reine Funktionen'],
    ['<code>scope</code>', 'Zu welchem Fachbereich die Library gehört']
  ]
});

CH.push({
  id: 'g05', act: 8, title: 'Stärken, Schwächen, Grenzen', tag: 'Wann Angular, wann nicht', xp: 120,
  docs: [['Was ist Angular?', 'https://angular.dev/overview'], ['Versionen und Releases', 'https://angular.dev/reference/releases']],
  ticket: { id: 'PW-105', category: 'Frage', heading: 'Technik-Empfehlung für ein Kundenangebot', text: 'Katrin Kaiser schreibt ein Angebot für einen neuen Kunden und will wissen, ob dessen kleine Infoseite auch mit Angular gebaut werden soll. Gib eine begründete Empfehlung.' },
  story: [
    ['boss', 'Ehrlich: Ist Angular gut? Oder sollten wir dem Kunden was anderes anbieten?'],
    ['toni', 'Kommt drauf an, wofür. Ein guter Dev kennt die Stärken UND die Schwächen. Und kann sie dem Chef in zwei Minuten erklären.']
  ],
  slides: [
    { t: 'Stärken', say: 'Hier ist Angular richtig stark.', job: 'Angular sieht man vor allem bei großen Firmen-Apps, die viele Jahre leben: Banken, Versicherungen, Behörden, Logistik. Viele Teams, viel Formular-Logik, lange Wartung.',
      points: [['Große Teams', 'Alle schreiben gleich. Neue Leute finden sich schnell zurecht.', 'plus'], ['Alles dabei', 'Keine Suche nach 20 Zusatz-Bibliotheken. Alles passt zusammen.', 'plus'], ['TypeScript überall', 'Viele Fehler fallen schon beim Tippen auf.', 'plus'], ['Lange gepflegt', 'Jede Version 24 Monate Support. ng update baut Code automatisch um.', 'plus'], ['Google dahinter', 'Google nutzt Angular selbst in tausenden Apps. Es verschwindet nicht einfach.', 'plus'], ['Testbar', 'Dank DI lässt sich fast alles leicht testen.', 'plus']],
      pro: 'Darum sieht man Angular so oft in Banken, Versicherungen, Behörden, Autoindustrie und bei großen Firmen-Tools. Dort zählen Ordnung und lange Lebensdauer mehr als die neueste Mode.' },
    { t: 'Schwächen', say: 'Das sind die ehrlichen Nachteile.', job: 'Diese Nachteile kennen auch deine Kollegen. Wer sie offen nennt, wirkt im Meeting glaubwürdiger als jemand, der alles toll findet.',
      points: [['Steile Lernkurve', 'Viele Begriffe auf einmal: Komponenten, DI, Signals, RxJS, Decorators.', 'minus'], ['Mehr Code', 'Auch für kleine Dinge gibt es Etiketten, Dateien, Struktur.', 'minus'], ['RxJS ist schwer', 'Mächtig, aber am Anfang verwirrend.', 'minus'], ['Schneller Wandel', 'Viele alte Anleitungen online. Was 2021 richtig war, ist heute veraltet.', 'minus'], ['Weniger verbreitet als React', 'Es gibt mehr React-Jobs und mehr React-Bibliotheken weltweit.', 'minus']],
      pro: 'Viele Schwächen werden kleiner: Signals sind viel leichter als RxJS, standalone spart Module, @if ist leichter als *ngIf. Das moderne Angular ist deutlich anfängerfreundlicher als das von 2018.' },
    { t: 'Grenzen: was Angular NICHT macht', say: 'Angular ist nur das, was im Browser passiert, also das „Frontend“. Alles dahinter braucht andere Werkzeuge.',
      job: 'Ein typisches Ticket-Missverständnis: „Der Preis wird falsch berechnet.“ Ist das ein Bug im Frontend oder im Backend? Wer die Grenze kennt, schickt das Ticket gleich ans richtige Team.',
      points: [['Keine Datenbank', 'Angular speichert nichts dauerhaft. Dafür braucht es einen Server.', 'minus'], ['Kein Backend', 'Logik auf dem Server schreibt man z. B. mit Java (Spring), C# (.NET) oder Node.js.', 'minus'], ['Keine Sicherheit allein', 'Alles im Browser kann der Nutzer sehen und ändern. Prüfen muss der Server.', 'minus'], ['Nicht für jede Seite', 'Für einen kleinen Blog oder eine Landingpage ist Angular zu groß.', 'minus'], ['Keine echte Handy-App', 'Geht nur über Umwege wie Ionic/Capacitor, die die Web-App verpacken.', 'minus']],
      pro: 'So sieht fast jedes Firmen-Projekt aus: Angular im Browser ⇄ HTTP (JSON) ⇄ Backend ⇄ Datenbank. Angular redet nie direkt mit der Datenbank.' },
    { t: 'Wann Angular, wann nicht', say: 'Faustregel für die Firma.', job: 'Für eine Infoseite mit fünf Unterseiten wäre Angular zu viel. Für einen Shop mit Login, Warenkorb und Formularen passt es gut. So eine Empfehlung erwartet man von dir.',
      points: [['Ja: große Firmen-App', 'Viele Masken, Formulare, Tabellen, Rollen, viele Entwickler.', 'plus'], ['Ja: Dashboards & Admin-Bereiche', 'Viele Daten, lange gepflegt.', 'plus'], ['Ja: langes Projekt', 'Jahre statt Wochen, Team wechselt.', 'plus'], ['Eher nein: kleine Webseite', 'Blog, Visitenkarte, Werbeseite.', 'minus'], ['Eher nein: schneller Prototyp allein', 'Für ein Wochenend-Experiment gibt es Leichteres.', 'minus']],
      pro: 'Ein Senior sagt nicht „Angular ist das Beste“. Er sagt: „Für dieses Projekt passt es, weil …“. Genau diese Begründung macht einen Senior aus.' }
  ],
  quiz: [
    { q: 'Für welche Art von Projekt eignet sich Angular besonders gut?', options: ['Für einen kleinen Blog mit fünf Seiten', 'Für eine große Firmen-App mit vielen Entwicklern', 'Für eine Werbeseite zu einer Aktion', 'Für einen schnellen Prototyp fürs Wochenende'], correct: 1, why: 'Angular bringt eine klare Struktur und alle wichtigen Werkzeuge mit. Das passt perfekt zu großen Teams und langen Projekten.' },
    { q: 'Kann Angular selbst Daten in einer Datenbank speichern?', options: ['Ja, Angular hat eine Datenbank eingebaut', 'Nein, dafür braucht es einen Server (Backend)', 'Ja, mit dem HttpClient direkt in die Datenbank', 'Ja, in Signals bleiben Daten dauerhaft gespeichert'], correct: 1, why: 'Angular ist nur das Frontend. Die Daten gehen per HTTP an ein Backend, und erst das speichert sie in der Datenbank.' },
    { q: 'Welcher dieser Punkte ist eine echte Schwäche von Angular?', options: ['Angular unterstützt kein TypeScript', 'Die Lernkurve ist steil, es gibt viele Begriffe', 'Jede Version wird nur 3 Monate gepflegt', 'Angular hat keinen eingebauten Router'], correct: 1, why: 'Am Anfang kommt bei Angular viel auf einmal. Darum lernst du hier Schritt für Schritt.' }
  ],
  takeaway: ['Stark: große Teams, alles dabei, TypeScript, lange gepflegt, testbar.', 'Schwach: Lernkurve, mehr Code, RxJS schwer, viele alte Anleitungen.', 'Grenze: Angular ist nur Frontend. Datenbank und Backend sind andere Werkzeuge.', 'Ein Senior begründet, WARUM ein Werkzeug passt.'],
  pairs: [
    ['Große Teams', 'Stärke: alle schreiben gleich'],
    ['Steile Lernkurve', 'Schwäche: viele Begriffe auf einmal'],
    ['Datenbank', 'Grenze: dafür braucht es einen Server'],
    ['Kleine Webseite', 'Eher nicht Angular'],
    ['Firmen-App mit vielen Formularen', 'Ja, hier passt Angular']
  ]
});

CH.push({
  id: 'k27', act: 8, title: 'Sicher, barrierefrei, mehrsprachig', tag: 'Security · a11y · i18n', xp: 200,
  docs: [['Sicherheit in Angular', 'https://angular.dev/best-practices/security'], ['Barrierefreiheit', 'https://angular.dev/best-practices/a11y'], ['Internationalisierung im Überblick', 'https://angular.dev/guide/i18n']],
  ticket: { id: 'PW-154', category: 'Security', heading: 'Pentest, Barrierefreiheit und Türkisch', text: 'Drei Tickets in einer Woche: Pentest-Funde, Beschwerde eines blinden Konzertbesuchers (Screenreader), und die App soll auf Türkisch kommen. Fang mit der Barrierefreiheit im Ticket-Bereich an.' },
  story: [
    ['sara', 'Drei Tickets diese Woche: Die Sicherheitsfirma will testen, ein blinder Besucher kann beim Konzerthaus keine Tickets kaufen, und die Partnerbühne in Istanbul will die App auf Türkisch.'],
    ['toni', 'Das sind die drei Themen, die Firmen oft zu spät angehen: sicher, für alle benutzbar, in jeder Sprache. Wir machen das richtig.']
  ],
  slides: [
    { t: 'Security: die Kette', say: 'Sicherheit ist eine Kette. Jedes Glied muss halten. Hier die Glieder, die DU als Frontend-Entwickler verantwortest.', job: 'Häufige Frontend-Funde im Pentest: fehlende Content-Security-Policy, Tokens im localStorage, sensible Daten in der URL, veraltete Pakete mit bekannten Lücken.',
      points: [['XSS', 'Angular escaped {{ }} automatisch. Nie bypassSecurityTrust… mit Nutzerdaten, kein innerHTML am DOM vorbei.', 'plus'], ['CSP', 'Content-Security-Policy-Header: Der Browser führt nur Scripts aus erlaubten Quellen aus. Angular unterstützt das (autoCsp).', 'plus'], ['Auth', 'Interceptor hängt Token an, Guard schützt die Ansicht, der SERVER prüft die Rechte.', ''], ['Geheimnisse', 'Keine API-Keys, keine Passwörter im Frontend. environment.ts ist öffentlich!', 'minus'], ['Abhängigkeiten', 'npm audit, Angular aktuell halten, Pakete prüfen.', '']],
      pro: 'Die OWASP Top 10 sind die Liste der häufigsten Web-Sicherheitslücken. Einmal durchlesen gehört zum Senior-Wissen.' },
    { t: 'Barrierefreiheit (a11y)', say: 'Viele Menschen benutzen deine App anders: mit Screenreader, nur mit Tastatur, mit Vergrößerung. In der EU ist Barrierefreiheit seit Juni 2025 für viele Apps sogar Pflicht.', job: 'Teste deine App einmal nur mit Tastatur (Tab, Enter, Leertaste). Kommst du nicht zum Kaufen-Knopf, ist das ein Bug. Tools wie axe oder Lighthouse finden viele Fehler automatisch.',
      code: C`
<!-- schlecht -->
<div (click)="kaufen()">Kaufen</div>
<img src="leon.jpg">
<button (click)="loeschen()">🗑️</button>

<!-- gut -->
<button (click)="kaufen()">Kaufen</button>
<img src="leon.jpg" alt="Leon präsentiert sein Projekt">
<button (click)="loeschen()" aria-label="Entwickler löschen">🗑️</button>`,
      notes: [['<div (click)', 'Ein div kann man nicht mit der Tastatur erreichen, und der Screenreader weiß nicht, dass es klickbar ist.'], ['<img src="leon.jpg">', 'Ohne alt weiß ein blinder Nutzer nicht, was auf dem Bild ist.'], ['🗑️</button>', 'Nur ein Icon: Der Screenreader sagt „Button“. Welcher?'], ['<button (click)="kaufen()">', 'Echter Button: Tab, Enter, Leertaste, Screenreader. Alles gratis.'], ['alt="Leon', 'Beschreibt, was man sieht. Bei reiner Deko: alt="".'], ['aria-label', 'Unsichtbarer Name für Screenreader.']],
      pro: 'Weitere Regeln: Jedes Eingabefeld braucht ein <label>. Genug Kontrast (4,5:1). Sichtbarer Fokus-Rahmen. Teste einmal deine App nur mit der Tab-Taste. Angular CDK hat a11y-Helfer (FocusTrap, LiveAnnouncer), Angular Aria bringt barrierefreie Bausteine.' },
    { t: 'Mehrsprachigkeit (i18n)', say: 'i18n heißt „internationalization“ (zwischen i und n stehen 18 Buchstaben). Texte werden markiert und pro Sprache übersetzt.', job: 'Bei i18n-Tickets ist das meiste Fleißarbeit: Texte markieren, extrahieren, übersetzen lassen. Schwierig wird es bei Plural, Datum, Währung und Sprachen von rechts nach links.',
      code: C`
<h1 i18n="@@willkommen">Willkommen im Konzerthaus</h1>

titel = $localize\`:@@tickets:Tickets kaufen\`;

{{ preis | currency: 'EUR' }}    // 12,50 € oder €12.50
{{ konzertbeginn | date: 'short' }}     // je nach Sprache`,
      notes: [['i18n="@@willkommen"', 'Markiert den Text zum Übersetzen. @@ gibt eine feste ID.'], ['$localize', 'Dasselbe für Texte im TypeScript-Code.'], ['currency', 'Pipes formatieren Zahlen, Geld und Datum passend zur Sprache.'], ["date: 'short'", 'Deutsch: 06.11.26, 18:00. Englisch: 11/6/26, 6:00 PM.']],
      pro: 'ng extract-i18n sammelt alle Texte in eine Datei (XLIFF) für die Übersetzer. Angular baut dann pro Sprache eine eigene App. Für Sprachwechsel zur Laufzeit nimmt man oft Bibliotheken wie Transloco.' }
  ],
  quiz: [
    { q: 'Ist ein API-Key geheim, wenn er in der Datei environment.ts im Frontend steht?', options: ['Ja, die Datei wird nicht ausgeliefert', 'Nein, er landet im Browser-Code', 'Nur im Produktions-Build', 'Nur, wenn die Seite HTTPS benutzt'], correct: 1, why: 'Alles, was im Frontend liegt, ist öffentlich.' },
    { q: 'Warum ist ein klickbares <div (click)> schlechter als ein echter <button>?', options: ['Es sieht anders aus', 'Es ist nicht per Tastatur erreichbar, und Screenreader erkennen es nicht', 'Es ist langsamer', 'Es funktioniert in Angular nicht'], correct: 1, why: 'Ein echter Button bringt Tastatur-Bedienung und Screenreader-Unterstützung gratis mit.' },
    { q: 'Wofür steht die Abkürzung i18n?', options: ['Für Angular in Version 18', 'Für internationalization, also Mehrsprachigkeit', 'Für ein Angular-Paket namens i18n', 'Für eine Pipe, die Texte übersetzt'], correct: 1, why: 'Zwischen dem i und dem n von internationalization stehen 18 Buchstaben.' }
  ],
  ex: { id: 'ex27', title: 'Ein Konzerthaus für alle', goal: 'Der Ticket-Bereich ist für Screenreader und Tastatur unbenutzbar. Mach ihn barrierefrei.', preview: 'TicketBereich',
    todo: ['Das Bild bekommt ein sinnvolles <code>alt</code>', 'Aus dem klickbaren <code>&lt;div class="kaufen"&gt;</code> wird ein <code>&lt;button class="kaufen"&gt;</code>', 'Das Eingabefeld bekommt ein <code>&lt;label for="anzahl"&gt;</code> (Feld mit <code>id="anzahl"</code>)', 'Der 🗑️-Button bekommt <code>aria-label</code>'],
    starter: C`
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-ticket-bereich',
  template: \`
    <img class="saal" src="saal.jpg" />

    <input class="anzahl" type="number" [value]="anzahl()"
           (input)="anzahl.set(+$any($event.target).value)" />

    <div class="kaufen" (click)="kaufen()">Tickets kaufen</div>
    <button class="leeren" (click)="anzahl.set(0)">🗑️</button>

    <p class="status">{{ status() }}</p>
  \`,
})
export class TicketBereich {
  anzahl = signal(1);
  status = signal('');
  kaufen() { this.status.set(this.anzahl() + ' Tickets im Warenkorb'); }
}
`,
    solution: C`
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-ticket-bereich',
  template: \`
    <img class="saal" src="saal.jpg" alt="Voller großer Saal im Konzerthaus am Abend" />

    <label for="anzahl">Anzahl Tickets</label>
    <input id="anzahl" class="anzahl" type="number" [value]="anzahl()"
           (input)="anzahl.set(+$any($event.target).value)" />

    <button class="kaufen" (click)="kaufen()">Tickets kaufen</button>
    <button class="leeren" (click)="anzahl.set(0)" aria-label="Anzahl zurücksetzen">🗑️</button>

    <p class="status">{{ status() }}</p>
  \`,
})
export class TicketBereich {
  anzahl = signal(1);
  status = signal('');
  kaufen() { this.status.set(this.anzahl() + ' Tickets im Warenkorb'); }
}
`,
    notes: [['alt="Voller', 'Beschreibt das Bild für alle, die es nicht sehen.'], ['<label for="anzahl">', 'Das Label gehört zum Feld mit id="anzahl". Klick auf das Label setzt den Fokus ins Feld.'], ['<button class="kaufen"', 'Echter Button: mit Tab erreichbar, Enter funktioniert.'], ['aria-label', 'Der Icon-Button hat jetzt einen Namen.']],
    hints: ['Bild: <code>alt="Voller großer Saal …"</code> anhängen.', 'Label: <code>&lt;label for="anzahl"&gt;Anzahl&lt;/label&gt;</code> und am input <code>id="anzahl"</code>.', '<code>&lt;div class="kaufen" …&gt;…&lt;/div&gt;</code> → <code>&lt;button class="kaufen" …&gt;…&lt;/button&gt;</code>'],
    tests: [
      { name: 'Bild hat alt-Text', run: T => { const f = T.mount(T.cmp('TicketBereich')); const a = (f.q('img.saal') || {}).getAttribute; const alt = f.q('img.saal') && f.q('img.saal').getAttribute('alt'); T.ok(alt && alt.trim().length >= 5, 'Das Bild braucht ein beschreibendes alt (mindestens 5 Zeichen).'); } },
      { name: 'Kaufen ist ein echter Button', run: async T => { const f = T.mount(T.cmp('TicketBereich')); const k = f.q('.kaufen'); T.ok(k && k.tagName === 'BUTTON', '.kaufen soll ein <button> sein, kein <div>.'); await f.click('.kaufen'); T.ok(/1 Tickets/.test(f.q('.status').textContent), 'Der Button soll weiterhin kaufen() aufrufen.'); } },
      { name: 'Eingabefeld hat ein Label', run: T => { const f = T.mount(T.cmp('TicketBereich')); const i = f.q('input.anzahl'); T.ok(i && i.id, 'Das Eingabefeld braucht eine id, z. B. id="anzahl".'); const l = f.q('label[for="' + i.id + '"]'); T.ok(l && l.textContent.trim(), 'Es fehlt <label for="' + i.id + '">Text</label>.'); } },
      { name: 'Icon-Button hat einen Namen', run: T => { const f = T.mount(T.cmp('TicketBereich')); const b = f.q('.leeren'); const n = b && (b.getAttribute('aria-label') || ''); T.ok(n.trim().length >= 3, 'Der 🗑️-Button braucht aria-label="…".'); } }
    ] },
  takeaway: ['Security-Kette: XSS-Schutz nicht umgehen, CSP, Server prüft, keine Geheimnisse im Frontend.', 'a11y: echte Buttons, alt-Texte, Labels, aria-label für Icons, Tastatur testen.', 'i18n: i18n-Attribut, $localize, Pipes für Zahl/Geld/Datum.'],
  pairs: [
    ['XSS-Schutz', 'Angular escaped {{ }} automatisch'],
    ['CSP', 'Der Browser führt nur erlaubte Scripts aus'],
    ['<code>aria-label</code>', 'Name für einen Knopf, der nur ein Icon hat'],
    ['alt-Text', 'Beschreibt ein Bild für den Screenreader'],
    ['i18n', 'Texte markieren und pro Sprache übersetzen']
  ]
});

CH.push({
  id: 'k28', act: 8, title: 'Du führst das Team', tag: 'Senior-Skills', xp: 300,
  docs: [['Angular aktuell halten', 'https://angular.dev/update'], ['Update-Guide', 'https://angular.dev/update-guide'], ['Signals und RxJS (toSignal)', 'https://angular.dev/ecosystem/rxjs-interop']],
  ticket: { id: 'PW-155', category: 'Frage', heading: 'Du übernimmst das Frontend-Team', text: 'Ab sofort bist du Tech Lead im Frontend. Neue Kollegen kommen, die Migration steht an, und die Geschäftsführung will Entscheidungen verstehen.' },
  story: [
    ['erz', 'Ein Jahr später. Die App läuft stabil, das Team ist gewachsen. Katrin Kaiser bittet dich in ihr Büro.'],
    ['boss', 'Ab jetzt leitest du das Frontend. Neue Leute kommen, alter Code muss migriert werden, und ich will Entscheidungen verstehen.'],
    ['ricky', 'Und ich geb’s zu: Ich hab bei deinen Reviews mehr gelernt als in drei Jahren bei Quick & Dirty.'],
    ['toni', 'Senior heißt nicht „kennt jede API“. Senior heißt: macht andere besser und trifft gute Entscheidungen.']
  ],
  slides: [
    { t: 'Review-Kultur im Team', say: 'Wie ein gutes Review geht, weißt du seit Rickys PR. Als Tech Lead sorgst du dafür, dass das ganze Team so reviewt. Auch wenn du nicht dabei bist.', job: 'Ein Tech Lead reviewt nicht jeden PR selbst. Er sorgt für klare Regeln, damit jedes Review gleich gut ist und niemand zum Flaschenhals wird.',
      points: [['Checkliste ins Repo', 'Die Review-Reihenfolge (korrekt, sicher, Lecks, Zustand, lesbar, schnell) als PR-Vorlage.', 'plus'], ['Automatisieren', 'Format, Lint, Tests und Budgets prüft die Pipeline. Menschen schauen auf Logik.', 'plus'], ['Reviews verteilen', 'Alle reviewen, auch Juniors. So lernt jeder den ganzen Code kennen.', 'plus'], ['Schnell antworten', 'Ein PR, der zwei Tage wartet, bremst mehr als ein kleiner Fehler.', ''], ['Ton vorleben', '„Was hältst du von …?“ statt „Das ist falsch.“ Lob nicht vergessen.', 'plus']],
      pro: 'Eine einfache Team-Regel: Jeder PR bekommt innerhalb eines Arbeitstags ein Review. „Muss“ blockiert, „Nit“ nie. So bleibt das Tempo hoch und der Ton gut.' },
    { t: 'Typische Review-Funde', say: 'Diese Muster findest du in fast jedem Firmen-Projekt. Erkennst du sie, bist du Gold wert.', job: 'Fehlendes Aufräumen von Abos, Logik im Template, kopierte Codeblöcke, fehlende Fehler- und Leer-Zustände: Das sind die Funde, die in fast jedem Projekt vorkommen.',
      code: C`
// 1. Abo ohne Ende: läuft nach dem Verlassen weiter
this.api.live().subscribe(d => this.daten = d);
// → daten = toSignal(this.api.live());

// 2. Abo im Abo: alte Anfragen werden nicht abgebrochen
this.suche$.subscribe(q => this.api.finde(q).subscribe(...));
// → this.suche$.pipe(switchMap(q => this.api.finde(q)))

// 3. Methode im Template
{{ berechneTabelle() }}
// → tabelle = computed(...)`,
      notes: [['.subscribe(d => this.daten = d)', 'Kein unsubscribe: Speicherleck. Und daten ist kein Signal: Anzeige hängt evtl. (zoneless).'], ['toSignal', 'Meldet sich automatisch ab und ist ein Signal.'], ['subscribe(q => this.api', 'Abo im Abo: Antworten kommen in falscher Reihenfolge.'], ['switchMap', 'Bricht die alte Anfrage ab. Immer nur die neueste zählt.'], ['berechneTabelle()', 'Läuft bei jedem Neuzeichnen.'], ['computed', 'Rechnet nur, wenn sich etwas ändert.']],
      pro: 'Du kennst jede dieser Lösungen aus den Kapiteln vorher. Genau das ist Senior: Muster erkennen und die passende Lösung kennen.' },
    { t: 'Migrationen leiten', say: 'Die Werkzeuge kennst du aus dem alten Kundenshop: ng update und Schematics. Als Tech Lead planst du die Migration für das ganze Team.', job: 'Eine gute Migration läuft Feature für Feature, mit Tests vorher und nachher. Der Fachbereich merkt nichts davon, außer dass Bugs seltener werden.',
      points: [['Bestand aufnehmen', 'Welche Version, welche alten Muster, wie viele Tests? update.angular.dev zeigt die Schritte.', 'plus'], ['Plan in Etappen', 'Eine Hauptversion nach der anderen, pro Schematic ein PR. Jede Etappe ist einzeln lieferbar.', 'plus'], ['Tests zuerst', 'Ohne Tests ist jede Migration ein Blindflug.', ''], ['Arbeit verteilen', 'Jeder migriert die Features, die er kennt. So lernt das ganze Team die neuen Muster.', 'plus'], ['Pfadfinder-Regel', 'Code, den du anfasst, etwas besser hinterlassen. Kein „Big Bang“-Umbau.', 'plus']],
      pro: 'In Firmen sitzt man oft auf alten Versionen. Wer sagen kann „Wir gehen in drei Schritten auf 22, hier ist der Plan und das Risiko“, wird zum Senior befördert.' },
    { t: 'Aufschreiben & schätzen', say: 'Große Entscheidungen schreibst du kurz auf. Und wenn jemand fragt „Wie lange dauert das?“, sagst du keine Zahl aus dem Bauch.', job: 'Ein ADR (Architecture Decision Record) ist eine halbe Seite: Problem, Optionen, Entscheidung, Folgen. In einem Jahr fragt jemand „Warum haben wir das so gemacht?“, und die Antwort steht da.',
      code: C`
# ADR 007: Zustand mit Signals statt NgRx
Status: angenommen · 2026-11-06
Kontext:     Team und Tickets teilen wenig Zustand. 4 Entwickler.
Entscheidung: Signal-Stores pro Fachbereich. Kein NgRx.
Folgen:      + weniger Code, schneller Einstieg
             − kein Time-Travel-Debugging
             Neu prüfen, wenn > 3 Bereiche denselben Zustand brauchen.`,
      notes: [['ADR', 'Architecture Decision Record: eine kurze Datei pro Entscheidung, im Repo (docs/adr/).'], ['Kontext', 'Warum mussten wir überhaupt entscheiden?'], ['Folgen', 'Vorteile UND Nachteile. Ehrlich.'], ['Neu prüfen, wenn', 'Wann die Entscheidung nicht mehr passt.']],
      pro: 'Schätzen: Aufgabe in Teile unter einem Tag zerlegen, Unbekanntes benennen („Login: 2 bis 4 Tage, je nachdem, ob die API Refresh-Tokens kann“) und eine Spanne nennen statt einer Zahl. Danach vergleichen, wie lange es wirklich gedauert hat. So wirst du jedes Mal besser.' },
    { t: 'Entscheiden & erklären', say: 'Der wichtigste Senior-Skill: Entscheidungen treffen und so erklären, dass auch die Chefin sie versteht.', job: 'Die Geschäftsführung will keine Technik hören, sondern Folgen: „Wenn wir das jetzt umbauen, kostet das zwei Wochen und spart uns jeden Monat drei Tage Bugfixing.“',
      points: [['Trade-offs nennen', '„Option A ist schneller gebaut, B ist leichter zu pflegen. Ich empfehle B, weil …“', 'plus'], ['Einfach bleiben', 'Die beste Lösung ist oft die langweilige. Kein NgRx, wenn ein Signal reicht.', 'plus'], ['Messen statt raten', 'Performance, Fehler, Nutzung: Zahlen schlagen Meinungen.', 'plus'], ['Wissen teilen', 'Neue einarbeiten, Pair Programming, kurze Doku. Ein Team, das nur dich braucht, ist ein Risiko.', 'plus'], ['„Ich weiß es nicht“', 'Sagen können, nachschauen, zurückkommen. Das ist stark, nicht schwach.', 'plus']],
      pro: 'Ab hier lernst du nicht mehr nur aus Kursen: Lies den Angular-Blog (blog.angular.dev), die Release Notes, schau dir den Code von Angular selbst an und erklär anderen, was du weißt. Wer erklärt, lernt doppelt. Du bist jetzt bereit.' }
  ],
  quiz: [
    { q: 'Im Review siehst du in einer Komponente <code>this.api.live().subscribe(d =&gt; this.daten = d)</code>. Was sagst du dazu?', options: ['Das passt, HTTP-Abos enden von selbst', 'Das ist ein Speicherleck und kein Signal: lieber toSignal()', 'Lieber mit firstValueFrom in ein Promise umwandeln', 'Nur ein Nit: daten besser umbenennen'], correct: 1, why: 'toSignal meldet das Abo selbst ab, und der Bildschirm aktualisiert sich auch ohne Zone.js korrekt.' },
    { q: 'Das Team soll die App von Angular 17 auf Angular 22 bringen. Wie planst du das?', options: ['Ein großer PR, der alles auf einmal hebt', 'In Etappen: Version für Version, Tests vorher, pro Schritt ein PR', 'Die App parallel neu schreiben', 'Warten, bis Version 17 keinen Support mehr hat'], correct: 1, why: 'Jede Version hat eigene Migrationen. Kleine Etappen lassen sich prüfen und einzeln ausliefern.' },
    { q: 'Ein Kollege will für einen einfachen Zähler NgRx einbauen. Was antwortet ein Senior?', options: ['Gute Idee, dann ist es gleich skalierbar', 'Ein signal() reicht hier, wir bleiben einfach', 'Lieber ein Service mit BehaviorSubject', 'Erst NgRx einbauen, später zurückbauen'], correct: 1, why: 'Das Werkzeug muss zum Problem passen. Jede zusätzliche Komplexität kostet.' },
    { q: 'Was macht dich laut Toni zum Senior?', options: ['Jede API auswendig zu kennen', 'Andere besser zu machen und gute Entscheidungen zu erklären', 'Am meisten Code zu schreiben', 'Nie Fragen zu stellen'], correct: 1, why: 'Und genau das kannst du jetzt.' }
  ],
  takeaway: ['Review-Kultur: Checkliste im Repo, Pipeline prüft Kleinkram, schnell und freundlich antworten.', 'Typische Funde: subscribe ohne Ende, Abo im Abo, Methoden im Template.', 'Migrationen mit ng update Schritt für Schritt, Tests zuerst.', 'Entscheidungen als ADR aufschreiben, Aufwand als Spanne schätzen.', 'Senior = entscheiden, erklären, teilen. Du bist bereit.'],
  pairs: [
    ['ADR', 'Große Entscheidung, kurz aufgeschrieben'],
    ['Schätzung', 'Als Spanne, nicht aus dem Bauch'],
    ['Trade-off', 'A ist schneller gebaut, B leichter zu pflegen'],
    ['Pipeline', 'Prüft Format, Lint, Tests und Budgets'],
    ['Migration', 'ng update Schritt für Schritt, Tests zuerst']
  ]
});
