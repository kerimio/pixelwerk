/* ================= Phase: DER GROSSKUNDE ================= */
AKTE.push({ n: 5, title: 'Der Großkunde', sub: 'Performance, @defer, Rendering, SSR, State Management' });

/* Zähler für die teure Berechnung in der Performance-Übung */
const STATISTIK = { zaehler: 0, beliebtheit(p) { STATISTIK.zaehler++; return p.verkauft * 3 + p.bewertungen * 2; } };
/* localStorage für Tests nachbauen: auf dem „Server“ wirft jeder Zugriff einen Fehler */
function fakeStorage(server) {
  const P = Storage.prototype, g = P.getItem, st = P.setItem, m = {};
  const boom = () => { throw new Error('ReferenceError: localStorage is not defined (auf dem Server gibt es kein localStorage!)'); };
  P.getItem = function (k) { if (server) boom(); return k in m ? m[k] : null; };
  P.setItem = function (k, v) { if (server) boom(); m[k] = String(v); };
  return () => { P.getItem = g; P.setItem = st; };
}

CH.push({
  id: 'k23', akt: 5, title: 'Black Friday', tag: 'Performance · @defer', xp: 180,
  doku: [['Später laden mit @defer', 'https://angular.dev/guide/templates/defer'], ['Performance im Überblick', 'https://angular.dev/best-practices/performance'], ['Teure Berechnungen im Template finden', 'https://angular.dev/best-practices/slow-computations']],
  ticket: { id: 'PW-136', typ: 'Incident', titel: 'Shop ruckelt am Black Friday', text: 'Am Black Friday sind 80.000 Leute gleichzeitig im Shop von Nordlicht Mode. Der Start dauert ewig und die Bestseller-Liste friert bei jedem Klick ein.' },
  story: [
    ['erz', 'Pixelwerk hat einen Großkunden gewonnen: den Online-Shop von Nordlicht Mode. Black Friday, 80.000 Leute gleichzeitig im Shop. Das Monitoring zeigt rote Kurven.'],
    ['boss', 'Auf meinem Handy dauert der Start ewig. Und jedes Mal, wenn jemand auf „Gefällt mir“ tippt, friert die Liste ein. Der Kunde ruft schon an.'],
    ['toni', 'Drei Gründe, drei Lösungen: zu viel laden, zu viel rechnen, zu viel neu bauen. Erst messen, dann reparieren.']
  ],
  slides: [
    { t: 'Was macht Apps langsam?', say: 'Fast jedes Performance-Problem gehört in eine von drei Schubladen.', job: 'Performance-Tickets klingen oft nur „App ist langsam“. Deine erste Frage: Langsam beim Laden, beim Klicken oder beim Scrollen? Jede Antwort zeigt auf eine andere Schublade.',
      punkte: [['Zu viel laden', 'Riesiges JavaScript beim Start. Lösung: Lazy Routes, @defer, unnötige Pakete raus.', 'minus'], ['Zu viel rechnen', 'Teure Funktionen im Template laufen bei JEDEM Neuzeichnen. Lösung: computed().', 'minus'], ['Zu viel malen', 'Lange Listen ohne gutes track werden komplett neu gebaut. Lösung: track mit id, Virtual Scrolling.', 'minus'], ['Erst messen!', 'Nicht raten. Angular DevTools (Profiler), Netzwerk-Tab, Lighthouse.', 'plus']],
      pro: 'Google misst die Geschwindigkeit mit drei Werten, den Core Web Vitals. Zu viel laden verschlechtert vor allem LCP, zu viel rechnen und malen vor allem INP. Was die Werte bedeuten und wie der Browser malt, kommt im nächsten Kapitel.' },
    { t: 'Funktion im Template = Falle', say: 'Eine Methode im Template läuft bei JEDEM Neuzeichnen, auch wenn sich ihre Daten gar nicht geändert haben. computed() rechnet nur neu, wenn sich etwas ändert.', job: 'Eine Funktion im Template, die eine lange Liste filtert, ist ein typischer Review-Fund. Mit computed() läuft die Rechnung nur noch, wenn sich die Daten ändern.',
      code: C`
// Falle: läuft bei jedem Neuzeichnen
<li>{{ besteEntwickler() }}</li>
besteEntwickler() { return this.team().sort(...).slice(0, 3); }

// Richtig: gemerkt, bis sich team ändert
<li>{{ beste() }}</li>
beste = computed(() => [...this.team()].sort(...).slice(0, 3));`,
      notes: [['besteEntwickler()', 'Eine normale Methode. Angular muss sie bei jedem Neuzeichnen aufrufen.'], ['.sort(...)', 'Teuer! Und sort ändert sogar die Original-Liste.'], ['beste()', 'Sieht im Template gleich aus …'], ['computed', '… rechnet aber nur neu, wenn sich team() ändert. Sonst kommt das gemerkte Ergebnis.'], ['[...this.team()]', 'Erst kopieren, dann sortieren. Die Original-Liste bleibt heil.']],
      pro: 'Signals im Template ({{ anzahl() }}) sind dagegen völlig okay: Lesen eines Signals kostet fast nichts. Teuer ist nur echte Rechenarbeit in normalen Methoden.' },
    { t: '@defer: später laden', say: '@defer lädt einen Teil der Seite erst, wenn er gebraucht wird. Bis dahin steht ein Platzhalter da. Der Code dafür kommt in eine eigene Datei.', job: 'Kandidaten für @defer in Firmen-Apps: Diagramme, Karten, Kommentarbereiche, alles unterhalb des sichtbaren Bereichs. Der erste Seitenaufbau wird dadurch spürbar schneller.',
      code: C`
@defer (on viewport; prefetch on idle) {
  <app-statistik-chart />
} @placeholder {
  <p>Statistik kommt gleich …</p>
} @loading (minimum 300ms) {
  <app-spinner />
}`,
      notes: [['on viewport', 'Erst laden, wenn der Bereich ins Bild gescrollt wird.'], ['prefetch on idle', 'Wenn der Browser gerade nichts zu tun hat, schon mal im Hintergrund holen.'], ['<app-statistik-chart', 'Diese Komponente und alles, was sie braucht, wird ein eigener Chunk.'], ['@placeholder', 'Was man VOR dem Laden sieht.'], ['@loading', 'Was man WÄHREND des Ladens sieht. minimum verhindert Flackern.']],
      pro: 'Weitere Auslöser: on interaction (Klick), on hover, on timer(2s), on immediate, when bedingung(). Und @defer funktioniert nur, wenn die Komponente standalone ist und nirgends sonst direkt benutzt wird.' },
    { t: 'Der Werkzeugkasten', say: 'Diese Werkzeuge solltest du kennen und im Team vorschlagen können.', job: 'Lighthouse und der Performance-Tab der DevTools zeigen dir Zahlen. Mit Zahlen vorher und nachher überzeugst du im Team, nicht mit Bauchgefühl.',
      punkte: [['NgOptimizedImage', '<img ngSrc="…" width height priority>: Bilder in richtiger Größe, lazy, mit Vorrang fürs wichtigste Bild.', 'plus'], ['Virtual Scrolling', 'Bei 10.000 Zeilen nur die ~20 sichtbaren malen (CDK ScrollingModule).', 'plus'], ['track mit id', '@for (s of liste(); track s.id). Nie track $index bei Listen, die sich umsortieren.', 'plus'], ['OnPush + Signals', 'Angular prüft nur, was sich geändert hat.', 'plus'], ['Bundle-Analyse', 'ng build zeigt die Größen. Mit source-map-explorer siehst du, welches Paket dick ist.', 'plus'], ['Angular DevTools', 'Browser-Erweiterung: Komponentenbaum und Profiler, zeigt jede Change Detection.', 'plus']],
      pro: 'Angular warnt beim Build, wenn das Start-Bundle zu groß wird (budgets in angular.json). Diese Budgets nicht einfach hochdrehen, sondern verstehen, was dick ist.' }
  ],
  quiz: [
    { q: 'Warum ist ein Methoden-Aufruf wie {{ berechne() }} im Template gefährlich für die Performance?', options: ['Es führt zu einem Kompilierfehler', 'Die Methode läuft bei jedem Neuzeichnen neu', 'Methoden dürfen im Template keine Signals lesen', 'Der Wert wird nur einmal berechnet und nie aktualisiert'], correct: 1, why: 'Das Ergebnis einer normalen Methode merkt sich Angular nicht. Ein computed() rechnet dagegen nur neu, wenn sich seine Signals ändern.' },
    { q: 'Wann lädt ein Block mit @defer (on viewport) seinen Inhalt?', options: ['Sofort, er zeigt ihn aber erst beim Scrollen', 'Sobald der Bereich ins Bild kommt', 'Sobald der Browser nichts zu tun hat', 'Erst nach einem Klick'], correct: 1, why: 'Bis dahin steht der @placeholder da. „Sobald der Browser nichts zu tun hat“ wäre on idle, der Klick wäre on interaction.' },
    { q: 'Eine Liste wird oft umsortiert. Welchen Ausdruck schreibst du bei @for hinter track?', options: ['$index', 's.id', 's.name', 's (das ganze Objekt)'], correct: 1, why: 'Die id ist eindeutig und bleibt gleich. $index ändert sich beim Sortieren, Namen können doppelt sein, und ein neues Objekt mit gleichem Inhalt gilt bei track s als anderes Element.' }
  ],
  ex: { id: 'ex23', title: 'Die ruckelnde Bestseller-Liste', goal: 'Bei jedem Like-Klick rechnet die Liste alle Produkte neu durch. Mach sie schnell: <code>computed</code>, gutes <code>track</code> und <code>@defer</code>.', preview: 'Bestseller',
    modules: { './statistik': STATISTIK },
    todo: ['Die Top 3 werden in einem <code>computed</code> namens <code>top</code> berechnet (nicht in einer Methode)', 'Ein Like-Klick rechnet die Beliebtheit NICHT neu aus', '<code>@for</code> benutzt <code>track s.id</code>', 'Die Liste steht in einem <code>@defer</code>-Block mit <code>@placeholder</code>'],
    starter: C`
import { Component, signal, computed } from '@angular/core';
import { beliebtheit } from './statistik';

interface Produkt { id: number; name: string; verkauft: number; bewertungen: number; }

@Component({
  selector: 'app-bestseller',
  template: \`
    <button class="like" (click)="likes.update(n => n + 1)">👍 {{ likes() }}</button>
    <ol class="top">
      @for (s of topProdukte(); track $index) {
        <li>{{ s.name }}</li>
      }
    </ol>
  \`,
})
export class Bestseller {
  likes = signal(0);
  produkte = signal<Produkt[]>([
    { id: 1, name: 'Jacke', verkauft: 12, bewertungen: 4 },
    { id: 2, name: 'Schal', verkauft: 2, bewertungen: 9 },
    { id: 3, name: 'Mütze', verkauft: 7, bewertungen: 7 },
    { id: 4, name: 'Socken', verkauft: 0, bewertungen: 1 },
    { id: 5, name: 'Stiefel', verkauft: 9, bewertungen: 2 },
  ]);

  // Teuer! Läuft bei jedem Neuzeichnen.
  topProdukte() {
    return [...this.produkte()].sort((a, b) => beliebtheit(b) - beliebtheit(a)).slice(0, 3);
  }
}
`,
    solution: C`
import { Component, signal, computed } from '@angular/core';
import { beliebtheit } from './statistik';

interface Produkt { id: number; name: string; verkauft: number; bewertungen: number; }

@Component({
  selector: 'app-bestseller',
  template: \`
    <button class="like" (click)="likes.update(n => n + 1)">👍 {{ likes() }}</button>
    @defer (on viewport) {
      <ol class="top">
        @for (s of top(); track s.id) {
          <li>{{ s.name }}</li>
        }
      </ol>
    } @placeholder {
      <p>Bestseller laden …</p>
    }
  \`,
})
export class Bestseller {
  likes = signal(0);
  produkte = signal<Produkt[]>([
    { id: 1, name: 'Jacke', verkauft: 12, bewertungen: 4 },
    { id: 2, name: 'Schal', verkauft: 2, bewertungen: 9 },
    { id: 3, name: 'Mütze', verkauft: 7, bewertungen: 7 },
    { id: 4, name: 'Socken', verkauft: 0, bewertungen: 1 },
    { id: 5, name: 'Stiefel', verkauft: 9, bewertungen: 2 },
  ]);

  top = computed(() =>
    [...this.produkte()].sort((a, b) => beliebtheit(b) - beliebtheit(a)).slice(0, 3)
  );
}
`,
    notes: [['@defer (on viewport)', 'Liste erst laden, wenn sie ins Bild kommt.'], ['top(); track s.id', 'Gemerktes Ergebnis lesen, Elemente an der id erkennen.'], ['@placeholder', 'Was vorher zu sehen ist.'], ['top = computed', 'Wird nur neu berechnet, wenn sich produkte() ändert. Ein Like ändert nur likes().']],
    hints: ['Aus der Methode wird ein Feld: <code>top = computed(() => ...)</code>. Im Template dann <code>top()</code>.', '<code>track $index</code> → <code>track s.id</code>', 'Um die <code>&lt;ol&gt;</code>: <code>@defer (on viewport) { ... } @placeholder { &lt;p&gt;Lädt …&lt;/p&gt; }</code>'],
    tests: [
      { name: 'Top 3 stimmen', run: async T => { const f = T.mount(T.cmp('Bestseller')); await T.flush(60); T.eq(f.qa('.top li').map(l => l.textContent.trim()), ['Jacke', 'Mütze', 'Stiefel'], 'Die Top 3 sind Jacke, Mütze, Stiefel.'); } },
      { name: 'Like-Klicks rechnen nicht neu', run: async T => { const f = T.mount(T.cmp('Bestseller')); await T.flush(60); STATISTIK.zaehler = 0; for (let i = 0; i < 5; i++) await f.click('.like'); T.ok(STATISTIK.zaehler === 0, '5 Like-Klicks → beliebtheit() wurde ' + STATISTIK.zaehler + '-mal neu aufgerufen. Pack die Berechnung in computed().'); } },
      { name: 'Neues Produkt → Liste aktualisiert', run: async T => { const f = T.mount(T.cmp('Bestseller')); await T.flush(60); f.instance.produkte.update(l => [...l, { id: 9, name: 'Mantel', verkauft: 30, bewertungen: 10 }]); await T.flush(); T.eq(f.qa('.top li')[0] && f.qa('.top li')[0].textContent.trim(), 'Mantel', 'Kommt ein neues Produkt dazu, soll die Liste neu rechnen.'); } },
      { name: 'Berechnung ist ein computed', run: T => { const f = T.mount(T.cmp('Bestseller')); T.ok(T.isComputed(f.instance.top), 'Es braucht ein Feld top = computed(...).'); } },
      { name: 'track s.id', run: T => T.ok(T.has(/track\s+s\.id/), 'Im @for bitte track s.id statt track $index.') },
      { name: '@defer mit @placeholder', run: T => T.ok(T.has(/@defer/) && T.has(/@placeholder/), 'Pack die Liste in @defer (on viewport) { ... } @placeholder { ... }.') }
    ] },
  merke: ['Drei Schubladen: zu viel laden, zu viel rechnen, zu viel malen. Erst messen.', 'Keine teuren Methoden im Template. computed() merkt sich das Ergebnis.', '@defer lädt Teile später, mit @placeholder und @loading.', 'track s.id, OnPush, NgOptimizedImage, Virtual Scrolling.'],
  paare: [
    ['Zu viel laden', 'Riesiges JavaScript schon beim Start'],
    ['Zu viel rechnen', 'Teure Methode läuft bei jedem Neuzeichnen'],
    ['Zu viel malen', 'Lange Liste wird komplett neu gebaut'],
    ['<code>@defer</code>', 'Lädt einen Teil erst, wenn er gebraucht wird'],
    ['<code>@placeholder</code>', 'Steht da, bis der Teil geladen wird']
  ]
});

CH.push({
  id: 'w09', akt: 5, title: 'Wie der Browser rendert', tag: 'DOM · Layout · Paint · Web Vitals', xp: 90,
  doku: [['Wie Browser eine Seite aufbauen', 'https://developer.mozilla.org/de/docs/Web/Performance/How_browsers_work'], ['Bilder optimieren mit NgOptimizedImage', 'https://angular.dev/guide/image-optimization'], ['Lifecycle und afterNextRender', 'https://angular.dev/guide/components/lifecycle']],
  ticket: { id: 'PW-159', typ: 'Incident', titel: 'Produktseite ruckelt, Google-Ranking fällt', text: 'Nach Black Friday startet der Shop von Nordlicht Mode schneller. Aber das Scrollen durch die Produktseite ruckelt auf Handys, und die SEO-Agentur meldet schlechte „Core Web Vitals“. Finde heraus, was der Browser bei jedem Bild arbeitet und wo es hakt.' },
  story: [
    ['sara', 'Die SEO-Agentur von Nordlicht Mode sagt, unser LCP ist rot und der CLS auch. Ich weiß nicht mal, was das heißt. Aber wir verlieren Besucher aus der Google-Suche.'],
    ['toni', 'Das sind Messwerte dafür, wie schnell und ruhig die Seite für echte Nutzer ist. Um sie zu verbessern, musst du wissen, wie der Browser aus Code Pixel macht.'],
    ['ricky', 'Ich hab auf der Produktseite die Höhe der Karten animiert. Sieht doch schick aus.'],
    ['toni', 'Schick, aber teuer. Height zwingt den Browser in jedem Bild zum kompletten Neu-Rechnen. Gleich siehst du, warum.']
  ],
  slides: [
    { t: 'Vom Code zum Pixel', say: 'Bei jedem Bild läuft der Browser eine feste Strecke ab. Je früher in der Strecke du etwas änderst, desto mehr Arbeit folgt danach.', job: 'Im Performance-Tab der DevTools heißen genau diese Schritte so. Lila = Style und Layout, Grün = Paint. Wer die Farben lesen kann, findet Ruckler in Minuten.',
      punkte: [['1. DOM', 'Aus dem HTML wird ein Baum aus Elementen. Angular ändert genau diesen Baum.', ''], ['2. CSSOM & Style', 'Aus dem CSS wird ein zweiter Baum. Der Browser berechnet für jedes Element die fertigen Styles.', ''], ['3. Layout', 'Wo steht jedes Element, wie groß ist es? Teuer: Eine Änderung kann die ganze Seite verschieben.', ''], ['4. Paint', 'Pixel ausmalen: Farben, Text, Schatten, Bilder.', ''], ['5. Composite', 'Fertige Ebenen übereinanderlegen. Macht die Grafikkarte, sehr billig.', '']],
      pro: 'CSS im <head> blockiert das erste Malen: Ohne CSSOM malt der Browser nichts. Normale <script>-Tags blockieren das Parsen des HTML. Darum setzt Angular CLI seine Skripte mit type="module", die automatisch wie defer laufen.' },
    { t: 'Layout Thrashing: lesen, schreiben, lesen …', say: 'Der Browser ist faul: Er rechnet Layout erst, wenn er muss. Liest du nach einer Änderung eine Größe aus, muss er SOFORT rechnen. In einer Schleife passiert das hundertmal.', job: 'Klassischer Fund im Performance-Tab: lauter lila „Layout“-Balken mit rotem Dreieck „Forced reflow“. Fast immer eine Schleife, die abwechselnd liest und schreibt.',
      code: C`
// schlecht: in jeder Runde lesen UND schreiben
karten.forEach(k => {
  const h = k.offsetHeight;
  k.style.height = h + 10 + 'px';
});

// gut: erst alles lesen, dann alles schreiben
const hoehen = karten.map(k => k.offsetHeight);
karten.forEach((k, i) => {
  k.style.height = hoehen[i] + 10 + 'px';
});`,
      notes: [['const h = k.offsetHeight', 'Lesen: Damit die Zahl stimmt, rechnet der Browser jetzt das Layout.'], ["k.style.height = h + 10", 'Schreiben: Das Layout ist wieder ungültig. Nächste Runde muss er erneut rechnen.'], ['karten.map(k => k.offsetHeight)', 'Alle Lesevorgänge zusammen: Layout wird nur einmal gerechnet.'], ["hoehen[i] + 10", 'Alle Schreibvorgänge danach: Der Browser rechnet das Layout erst beim nächsten Bild, einmal.']],
      pro: 'In Angular schreibst du selten direkt ins DOM. Wenn doch (z. B. in einer Direktive), gibt es afterNextRender mit getrennten Phasen earlyRead, write und read. Genau dafür: erst lesen, dann schreiben.' },
    { t: 'Billig animieren', say: 'Nicht jede CSS-Eigenschaft kostet gleich viel. Die Frage ist immer: Ab welchem Schritt muss der Browser neu arbeiten?', job: 'Review-Kommentar, den du oft schreiben wirst: „Bitte transform: translateY statt top animieren.“ Gleiches Aussehen, ein Bruchteil der Arbeit.',
      punkte: [['width, height, top, margin, font-size', 'Layout + Paint + Composite. Am teuersten, alles wird neu gerechnet.', 'minus'], ['color, background, box-shadow', 'Paint + Composite. Position bleibt, nur Pixel neu malen.', ''], ['transform, opacity', 'Nur Composite. Die Grafikkarte verschiebt fertige Ebenen. Flüssig auch auf alten Handys.', 'plus'], ['16,7 ms', 'Bei 60 Bildern pro Sekunde hat der Browser pro Bild nur so viel Zeit. Darüber ruckelt es.', '']],
      pro: 'will-change: transform legt ein Element vorab auf eine eigene Ebene. Hilft bei Animationen, kostet aber Grafikspeicher. Nur gezielt einsetzen, nie für alles.' },
    { t: 'Lange Aufgaben: den Koch nicht blockieren', say: 'Aus der Event Loop weißt du: JavaScript macht eins nach dem anderen. Solange dein Code läuft, kann der Browser weder auf Klicks reagieren noch malen.', job: 'Ticket „CSV-Export von 50.000 Zeilen friert die App 4 Sekunden ein“. Lösung: Arbeit in Häppchen teilen oder in einen Web Worker auslagern.',
      punkte: [['Long Task', 'Alles über 50 ms nennt der Browser „lange Aufgabe“. Im Performance-Tab ist sie rot markiert. Nutzer merken das als Ruckeln.', 'minus'], ['In Häppchen', 'Große Schleifen teilen und zwischendurch mit setTimeout oder scheduler.yield() Luft lassen. Dann darf der Browser zwischendurch malen und Klicks annehmen.', 'plus'], ['Web Worker', 'Ein zweiter Koch in einer eigenen Küche. Rechnet, ohne die Seite zu blockieren, kann aber nicht ans DOM. Die Angular CLI legt einen an mit ng generate web-worker.', 'plus']],
      pro: 'Bei tief verschachtelten Timern (ab der fünften Ebene) machen Browser aus setTimeout(fn, 0) mindestens 4 ms. Für Häppchen ist scheduler.yield() darum besser, wo der Browser es kennt.' },
    { t: 'Core Web Vitals: die Noten von Google', say: 'Drei Messwerte von echten Nutzern. Google benutzt sie fürs Ranking, und Product Owner lieben sie, weil man sie messen kann.', job: 'Lighthouse in den DevTools gibt dir die Werte in einer Minute. In Firmen landen die Werte echter Nutzer oft in einem Dashboard, und ein roter Wert wird ein Ticket.',
      punkte: [['LCP < 2,5 s', 'Largest Contentful Paint: Wann ist das größte Element (meist das Hero-Bild) da?', ''], ['INP < 200 ms', 'Interaction to Next Paint: Wie schnell reagiert die Seite auf Klicks? Lange Tasks machen den Wert schlecht.', ''], ['CLS < 0,1', 'Cumulative Layout Shift: Wie sehr springt der Inhalt? Bilder ohne Größe sind der Klassiker.', ''], ['Angular-Werkzeuge', 'NgOptimizedImage (ngSrc, priority) für LCP und CLS, @defer und Lazy Loading für weniger JavaScript am Start. Beides kennst du aus Black Friday.', 'plus']],
      pro: 'INP hängt direkt an der Event Loop aus „Wie das Web funktioniert“: Ein Klick muss warten, bis der laufende Task fertig ist, dann kommt dein Handler, dann das nächste Malen. Alles zusammen zählt.' }
  ],
  quiz: [
    { q: 'Ricky animiert in seinem PR die CSS-Eigenschaft height. Was schlägst du im Review vor?', options: ['Stattdessen margin animieren', 'Stattdessen transform: scaleY animieren', 'Gar nichts, das passt so', 'Die Animation mit JavaScript statt CSS bauen'], correct: 1, why: 'Eine Animation von transform braucht nur den Schritt Composite. height erzwingt dagegen in jedem Bild Layout und Paint.' },
    { q: 'Warum ist es gefährlich, in einer Schleife abwechselnd Styles zu ändern und offsetHeight zu lesen?', options: ['offsetHeight ist veraltet', 'Das Lesen erzwingt jedes Mal sofort ein neues Layout', 'offsetHeight liefert dann falsche Werte', 'Das Lesen entfernt das Element aus dem DOM'], correct: 1, why: 'Wer nach dem Schreiben eine Größe liest, zwingt den Browser, das Layout sofort zu berechnen. In einer Schleife passiert das immer wieder. Das heißt Layout Thrashing.' },
    { q: 'Der Inhalt einer Seite springt, weil Bilder spät laden. Welcher Messwert wird dadurch schlechter?', options: ['LCP', 'INP', 'CLS', 'TTFB'], correct: 2, why: 'CLS misst, wie stark sich das Layout verschiebt. Die Lösung: dem Bild Breite und Höhe geben, zum Beispiel mit NgOptimizedImage.' }
  ],
  ex: { id: 'exw9', title: 'Der Performance-Detektiv', goal: 'Bau zwei Werkzeuge für Code Reviews: eins sagt, wie teuer eine CSS-Änderung ist, das andere zählt ruckelnde Bilder.',
    todo: ['<code>schritte(eigenschaft)</code> gibt die Schritte zurück, die neu laufen müssen', 'Layout-Eigenschaften → <code>["layout", "paint", "composite"]</code>', 'Paint-Eigenschaften → <code>["paint", "composite"]</code>, <code>transform</code>/<code>opacity</code> → <code>["composite"]</code>', '<code>ruckler(frames, fps)</code> zählt Bilder, die länger dauern als <code>1000 / fps</code> ms (fps ist standardmäßig 60)'],
    starter: C`
const LAYOUT = ['width', 'height', 'top', 'left', 'margin', 'padding', 'font-size', 'display'];
const PAINT = ['color', 'background-color', 'box-shadow', 'visibility', 'border-color'];

export function schritte(eigenschaft: string): string[] {
  // Layout → alle drei Schritte
  // Paint → paint und composite
  // sonst (transform, opacity) → nur composite
  return [];
}

export function ruckler(frames: number[], fps = 60): number {
  // Budget pro Bild in ms: 1000 / fps
  // Zähle alle Frames, die länger dauern
  return 0;
}
`,
    solution: C`
const LAYOUT = ['width', 'height', 'top', 'left', 'margin', 'padding', 'font-size', 'display'];
const PAINT = ['color', 'background-color', 'box-shadow', 'visibility', 'border-color'];

export function schritte(eigenschaft: string): string[] {
  if (LAYOUT.includes(eigenschaft)) return ['layout', 'paint', 'composite'];
  if (PAINT.includes(eigenschaft)) return ['paint', 'composite'];
  return ['composite'];
}

export function ruckler(frames: number[], fps = 60): number {
  const budget = 1000 / fps;
  return frames.filter(ms => ms > budget).length;
}
`,
    notes: [["LAYOUT.includes(eigenschaft)", 'Ändert sich Größe oder Position, muss alles ab Layout neu.'], ["['layout', 'paint', 'composite']", 'Die Strecke läuft immer bis zum Ende. Wer früh einsteigt, macht alle späteren Schritte mit.'], ["PAINT.includes", 'Nur Aussehen ändert sich: Layout bleibt, Pixel neu malen.'], ["return ['composite']", 'transform und opacity: Die Grafikkarte schiebt nur fertige Ebenen.'], ['1000 / fps', '60 fps → 16,7 ms pro Bild. 120 fps → 8,3 ms.'], ['frames.filter(ms => ms > budget)', 'Alle zu langen Bilder behalten und zählen. Jedes davon sieht der Nutzer als Ruckler.']],
    hints: ['<code>if (LAYOUT.includes(eigenschaft)) return ["layout", "paint", "composite"];</code>', 'Budget: <code>const budget = 1000 / fps;</code>', 'Zählen: <code>frames.filter(ms => ms > budget).length</code>'],
    tests: [
      { name: 'height ist am teuersten', run: T => T.eq(T.get('schritte')('height'), ['layout', 'paint', 'composite'], 'height ändert die Größe → layout, paint, composite.') },
      { name: 'background-color braucht kein Layout', run: T => T.eq(T.get('schritte')('background-color'), ['paint', 'composite'], 'Nur die Farbe ändert sich → paint, composite.') },
      { name: 'transform und opacity sind billig', run: T => { const f = T.get('schritte'); T.eq([f('transform'), f('opacity')], [['composite'], ['composite']], 'transform und opacity brauchen nur composite.'); } },
      { name: 'Ruckler bei 60 fps', run: T => T.eq(T.get('ruckler')([10, 20, 16, 40, 16.6]), 2, 'Budget 16,7 ms: nur 20 und 40 sind zu lang.') },
      { name: 'Ruckler bei 120 fps', run: T => T.eq(T.get('ruckler')([8, 9, 5, 12], 120), 2, 'Budget 8,3 ms: 9 und 12 sind zu lang.') }
    ] },
  merke: ['Strecke pro Bild: DOM → Style → Layout → Paint → Composite.', 'Erst alles lesen, dann alles schreiben. Sonst Layout Thrashing.', 'Animiere transform und opacity, nicht width, height oder top.', 'Core Web Vitals: LCP < 2,5 s, INP < 200 ms, CLS < 0,1.'],
  paare: [
    ['Layout', 'Wo steht jedes Element, wie groß ist es?'],
    ['Composite', 'Nur Ebenen verschieben: transform, opacity'],
    ['Layout Thrashing', 'Lesen, schreiben, lesen in einer Schleife'],
    ['LCP', 'Wann ist das größte Element zu sehen?'],
    ['CLS', 'Wie sehr springt der Inhalt?']
  ]
});

CH.push({
  id: 'k24', akt: 5, title: 'Weltweit live', tag: 'SSR · Hydration', xp: 180,
  doku: [['SSR, Prerendering und Render-Modi', 'https://angular.dev/guide/ssr'], ['Hydration und ihre Fehlerquellen', 'https://angular.dev/guide/hydration'], ['Incremental Hydration mit @defer', 'https://angular.dev/guide/incremental-hydration']],
  ticket: { id: 'PW-137', typ: 'Feature', titel: 'Bei Google gefunden werden', text: 'Die Produktseiten von Nordlicht Mode tauchen nicht bei Google auf, und auf dem Handy ist die Seite erst mal weiß. Die App soll per SSR ausgeliefert werden.' },
  story: [
    ['sara', 'Das Marketing vom Kunden beschwert sich: Bei Google findet die Produkte keiner. Und auf dem Handy ist die Seite erst mal weiß.'],
    ['toni', 'Weil der Browser erst das ganze JavaScript laden muss, bevor er etwas zeigt. Die Lösung: Die Seite schon auf dem Server bauen.']
  ],
  slides: [
    { t: 'Drei Arten, eine Seite zu bauen', say: 'Wo wird das HTML gebaut? Im Browser, auf dem Server bei jeder Anfrage, oder einmal beim Build?', job: 'Öffentliche Seiten wie Shop, Blog oder Produktseiten bekommen in Firmen oft SSR oder Prerender. Interne Tools hinter dem Login brauchen das meist nicht.',
      punkte: [['CSR · Client-Side Rendering', 'Browser bekommt fast leeres HTML und baut alles mit JavaScript. Erst weiß, Google sieht wenig.', 'minus'], ['SSR · Server-Side Rendering', 'Server baut bei jeder Anfrage fertiges HTML. Sofort sichtbar, gut für Google.', 'plus'], ['Prerendering (SSG)', 'HTML wird beim Build für feste Seiten erzeugt. Am schnellsten, aber nur für Seiten, die für alle gleich sind.', 'plus']],
      pro: 'Angular kann alle drei, sogar gemischt pro Route (Server Routes mit RenderMode.Server, RenderMode.Prerender, RenderMode.Client). Neues Projekt: ng new --ssr. Bestehendes: ng add @angular/ssr.' },
    { t: 'Hydration: aufwecken statt neu bauen', say: 'Mit SSR kommt fertiges HTML an. Dann lädt Angular und „weckt es auf“: Es hängt Klicks und Signals an das vorhandene HTML, statt alles wegzuwerfen.', job: 'Ein typischer Hydration-Bug: Eine Komponente baut das HTML selbst um, etwa mit innerHTML oder appendChild. Dann meldet Angular in der Konsole einen Hydration-Mismatch.',
      punkte: [['Hydration', 'Vorhandenes HTML wird übernommen. Kein Flackern.', 'plus'], ['Event Replay', 'Klickt jemand, bevor Angular wach ist, wird der Klick gemerkt und danach ausgeführt.', 'plus'], ['Incremental Hydration', 'Mit @defer (hydrate on viewport) werden Teile erst aufgeweckt, wenn man hinschaut.', 'plus'], ['Achtung', 'Server-HTML und Browser-HTML müssen gleich aufgebaut sein. Sonst „Hydration Mismatch“-Fehler.', 'minus']],
      pro: 'Weitere typische Ursachen: fremde Skripte, die das HTML vor der Hydration verändern, oder ungültiges HTML wie ein <div> in einem <p>. Das baut der Browser selbst um, und dann passt es nicht mehr zum Server-HTML.' },
    { t: 'Auf dem Server gibt es kein window', say: 'Dein Code läuft jetzt ZWEIMAL: einmal auf dem Server (Node.js), einmal im Browser. Auf dem Server gibt es kein window, kein document, kein localStorage.', job: 'Nach der Umstellung auf SSR sind Fehler wie „window is not defined“ oder „localStorage is not defined“ die ersten Tickets. Die Lösung ist fast immer afterNextRender oder ein isPlatformBrowser-Check.',
      code: C`
export class Merkzettel {
  private browser = isPlatformBrowser(inject(PLATFORM_ID));

  lesen(): string[] {
    if (!this.browser) return [];
    return JSON.parse(localStorage.getItem('merk') ?? '[]');
  }
}

// In Komponenten: Code, der nur im Browser laufen darf
constructor() {
  afterNextRender(() => this.chart.zeichne());
}`,
      notes: [['inject(PLATFORM_ID)', 'Sagt dir, wo du gerade läufst: "browser" oder "server".'], ['isPlatformBrowser', 'Macht daraus true oder false.'], ['if (!this.browser)', 'Auf dem Server: gar nicht erst an localStorage gehen.'], ['afterNextRender', 'Läuft NUR im Browser, nachdem Angular gemalt hat. Perfekt für Charts, Fokus, Messen.']],
      pro: 'Noch besser: Browser-Sachen in einen eigenen Service kapseln. Dann ist nur EINE Stelle plattformabhängig und der Rest der App bleibt sauber.' },
    { t: 'Doppelte Anfragen vermeiden', say: 'Der Server holt die Daten schon beim Bauen. Ohne Trick würde der Browser sie danach gleich nochmal holen.', job: 'Sieht das Backend-Team plötzlich doppelt so viele Anfragen, ist oft der Transfer-Cache falsch eingestellt. Server und Browser holen dann dieselben Daten zweimal.',
      punkte: [['HTTP Transfer Cache', 'HttpClient schreibt die Antworten ins Server-HTML. Der Browser liest sie von dort statt neu zu fragen. Ist bei provideClientHydration() automatisch an.', 'plus'], ['TransferState', 'Für eigene Daten, die nicht per HttpClient kommen.', ''], ['Was nicht geht', 'Daten, die nur der Nutzer hat (localStorage, Fenstergröße), kennt der Server nicht.', 'minus']],
      pro: 'SSR braucht einen Node-Server zum Ausliefern (oder eine Plattform wie Firebase App Hosting, Vercel, Netlify). Prerendering braucht nur statisches Hosting.' }
  ],
  quiz: [
    { q: 'Was ist der große Vorteil von Server-Side Rendering (SSR)?', options: ['Der Server braucht weniger Leistung', 'Fertiges HTML kommt sofort an, das hilft auch bei Google', 'Die App braucht kein JavaScript mehr', 'Man muss nicht mehr auf window achten'], correct: 1, why: 'Die erste Anzeige ist schneller da, und Suchmaschinen sehen den Inhalt.' },
    { q: 'Was passiert bei der Hydration?', options: ['Der Server schickt nach dem HTML alle Daten noch einmal als JSON', 'Angular übernimmt das Server-HTML und macht es interaktiv', 'Angular wirft das Server-HTML weg und baut die Seite neu', 'Der Browser speichert die Seite für den nächsten Besuch'], correct: 1, why: 'Angular weckt das vorhandene HTML auf, statt die Seite neu zu bauen.' },
    { q: 'Warum stürzt ein Aufruf von localStorage.getItem() beim Server-Side Rendering ab?', options: ['localStorage ist auf dem Server zu langsam', 'Auf dem Server gibt es kein localStorage', 'localStorage ist gesperrt, bis die Hydration fertig ist', 'Der Browser blockiert localStorage bei SSR-Seiten'], correct: 1, why: 'Der Server ist Node.js und kein Browser.' }
  ],
  ex: { id: 'ex24', title: 'Der Merkzettel für überall', goal: 'Der Merkzettel stürzt auf dem Server ab, weil er sofort localStorage benutzt. Mach ihn SSR-fest.',
    todo: ['<code>browser</code> = <code>isPlatformBrowser(inject(PLATFORM_ID))</code>', '<code>lesen()</code>: auf dem Server <code>[]</code>, im Browser die gespeicherte Liste', '<code>speichern(liste)</code>: auf dem Server nichts tun, im Browser speichern', 'Im Browser funktioniert alles wie vorher'],
    starter: C`
import { Service, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Service()
export class Merkzettel {
  lesen(): string[] {
    return JSON.parse(localStorage.getItem('merk') ?? '[]');
  }

  speichern(liste: string[]) {
    localStorage.setItem('merk', JSON.stringify(liste));
  }
}
`,
    solution: C`
import { Service, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Service()
export class Merkzettel {
  private browser = isPlatformBrowser(inject(PLATFORM_ID));

  lesen(): string[] {
    if (!this.browser) return [];
    return JSON.parse(localStorage.getItem('merk') ?? '[]');
  }

  speichern(liste: string[]) {
    if (!this.browser) return;
    localStorage.setItem('merk', JSON.stringify(liste));
  }
}
`,
    notes: [['private browser', 'Einmal beim Erstellen merken: Laufen wir im Browser?'], ['if (!this.browser) return []', 'Server: leere Liste, kein Absturz.'], ['if (!this.browser) return;', 'Server: einfach nichts speichern.']],
    hints: ['Feld anlegen: <code>private browser = isPlatformBrowser(inject(PLATFORM_ID));</code>', 'In beiden Methoden ganz oben: <code>if (!this.browser) return ...;</code>'],
    tests: [
      { name: 'Im Browser: speichern und lesen', run: T => { const undo = fakeStorage(false); try { const m = T.inject(T.get('Merkzettel')); m.speichern(['Leon', 'Mo']); T.eq(m.lesen(), ['Leon', 'Mo'], 'Im Browser soll lesen() die gespeicherte Liste zurückgeben.'); } finally { undo(); } } },
      { name: 'Auf dem Server: lesen stürzt nicht ab', run: T => { const core = T.ng.modules['@angular/core']; T.ng.root.add({ provide: core.PLATFORM_ID, useValue: 'server' }); const undo = fakeStorage(true); try { const m = T.inject(T.get('Merkzettel')); let r; try { r = m.lesen(); } catch (e) { T.ok(false, 'Auf dem Server abgestürzt: ' + e.message); } T.eq(r, [], 'Auf dem Server soll lesen() [] zurückgeben.'); } finally { undo(); } } },
      { name: 'Auf dem Server: speichern stürzt nicht ab', run: T => { const core = T.ng.modules['@angular/core']; T.ng.root.add({ provide: core.PLATFORM_ID, useValue: 'server' }); const undo = fakeStorage(true); try { const m = T.inject(T.get('Merkzettel')); try { m.speichern(['Leon']); } catch (e) { T.ok(false, 'Auf dem Server abgestürzt: ' + e.message); } } finally { undo(); } } },
      { name: 'Benutzt isPlatformBrowser', run: T => T.ok(T.has(/isPlatformBrowser\s*\(\s*inject\s*\(\s*PLATFORM_ID\s*\)\s*\)/), 'Frag Angular nach der Plattform: isPlatformBrowser(inject(PLATFORM_ID)).') }
    ] },
  merke: ['CSR baut im Browser, SSR auf dem Server, Prerender beim Build.', 'Hydration weckt Server-HTML auf, statt es neu zu bauen.', 'Auf dem Server: kein window, document, localStorage. isPlatformBrowser / afterNextRender.', 'HttpClient-Antworten reisen im HTML mit, keine doppelten Anfragen.'],
  paare: [
    ['CSR', 'Der Browser baut alles mit JavaScript'],
    ['SSR', 'Der Server baut bei jeder Anfrage fertiges HTML'],
    ['Prerendering', 'HTML entsteht einmal beim Build'],
    ['Hydration', 'Server-HTML aufwecken statt neu bauen'],
    ['Event Replay', 'Ein früher Klick wird gemerkt und nachgespielt']
  ]
});

CH.push({
  id: 'k25', akt: 5, title: 'Eine Wahrheit für alle', tag: 'State Management', xp: 200,
  doku: [['Signals im Überblick', 'https://angular.dev/guide/signals'], ['Services erstellen und nutzen', 'https://angular.dev/guide/di/creating-and-using-services']],
  ticket: { id: 'PW-138', typ: 'Bug', titel: 'Drei verschiedene Punktzahlen', text: 'Die Pitch-Übersicht zeigt 9 Punkte, Kopfzeile 6, Dashboard 7. Jede Komponente hat ihre eigene Kopie. Baue einen zentralen Store.' },
  story: [
    ['leon', 'Ich will dem Kunden unsere Pitch-Bilanz zeigen. Die Übersicht zeigt 9 Punkte, die Kopfzeile 6 und das Dashboard 7. Wer hat recht?'],
    ['toni', 'Keiner. Jeder hat seine eigene Kopie der Daten. Wir bauen EINEN Store, und alle lesen dort.']
  ],
  slides: [
    { t: 'State = was die App sich merkt', say: 'State sind alle Daten, die sich ändern können: Warenkorb, eingeloggter Nutzer, Filter, Pitch-Bilanz. Die große Frage: Wo wohnen sie?', job: 'Bugs wie „Zahl stimmt an einer Stelle nicht“ haben fast immer dieselbe Ursache: Daten liegen doppelt. Frag dich bei jedem neuen Feature: Wo genau wohnen diese Daten?',
      punkte: [['Lokaler State', 'Nur eine Komponente braucht es (Dropdown offen?). → signal() in der Komponente.', ''], ['Geteilter State', 'Mehrere Teile brauchen es (Warenkorb, Nutzer). → ein Service als Store.', ''], ['Server-State', 'Daten vom Server (Teamliste). → resource()/HttpClient + Store oder Cache.', ''], ['URL-State', 'Filter, Seite, Auswahl. → in die URL (Query-Parameter) wie im Lead-Bereich, dann ist es teilbar.', '']],
      pro: 'Goldene Regel: „Single Source of Truth“. Jede Information hat genau EINEN Ort. Alles andere wird daraus mit computed() abgeleitet, nicht kopiert.' },
    { t: 'Der Signal-Store als Service', say: 'Ein Store ist ein Service mit privatem State, öffentlichen computed-Werten zum Lesen und Methoden zum Ändern. Ein Weg rein, viele Wege raus.', job: 'In vielen Firmen-Apps sieht ein Store genau so aus: private signal für den Zustand, öffentliche computed zum Lesen, Methoden zum Ändern. Komponenten dürfen den Zustand nie direkt setzen.',
      code: C`
@Service()
export class PitchStore {
  private state = signal<PitchState>({ pitches: [], laedt: false });

  readonly pitches = computed(() => this.state().pitches);
  readonly punkte = computed(() => this.pitches().reduce((p, s) => p + wertung(s), 0));

  eintragen(pitch: Pitch) {
    this.state.update(s => ({ ...s, pitches: [...s.pitches, pitch] }));
  }
}`,
      notes: [['private state', 'Der ganze State in EINEM Signal. Privat: Von außen darf niemand direkt ran.'], ['readonly pitches = computed', 'Lesen ja, schreiben nein. computed hat kein set().'], ['punkte = computed', 'Abgeleitet. Kann nie „falsch“ sein, weil es immer aus pitches() kommt.'], ['eintragen', 'Der einzige Weg, etwas zu ändern. Leicht zu finden, leicht zu debuggen.'], ['{ ...s, pitches: [...s.pitches, pitch] }', 'Neues Objekt, neue Liste. Mehr dazu auf der nächsten Folie.']],
      pro: 'Für Daten vom Server passen resource() und httpResource() aus dem Entwicklerprofil perfekt in so einen Store: value(), isLoading() und error() sind schon Signals.' },
    { t: 'Nie ändern, immer ersetzen', say: 'Ändere Objekte und Listen im State nie direkt (push, x.name = …). Bau immer eine neue Kopie. Sonst merkt das Signal nichts.', job: 'Ein echter Bug-Klassiker: liste().push(neu). Die Liste ändert sich, aber das Signal merkt nichts, und die Anzeige bleibt alt. Darum immer [...alt, neu].',
      code: C`
// FALSCH: gleiche Liste, nur verändert
this.state().pitches.push(pitch);       // Signal merkt nichts!

// RICHTIG: neue Liste, neues Objekt
this.state.update(s => ({
  ...s,
  pitches: [...s.pitches, pitch]
}));`,
      notes: [['push(pitch)', 'Die Liste ist noch DIESELBE. Für das Signal hat sich nichts geändert, computed rechnet nicht neu.'], ['...s', 'Spread: alle Felder vom alten State übernehmen.'], ['[...s.pitches, pitch]', 'Neue Liste: alle alten Pitches plus der neue.']],
      pro: 'Signals vergleichen mit Object.is: Gleiche Referenz = keine Änderung. Darum ist „immutable“ in Angular, NgRx und React so wichtig. Merkhilfe: push, splice, sort und direkte Zuweisung sind im State tabu. map, filter, slice und Spread sind erlaubt.' },
    { t: 'NgRx: wenn es groß wird', say: 'Für große Teams gibt es fertige Bibliotheken. NgRx ist die bekannteste. Heute meist als SignalStore.', job: 'Bekommst du ein Projekt mit NgRx, findest du Actions, Reducer, Effects und Selectors. Das ist viel Code, dafür sieht jeder Datenfluss gleich aus. In großen Teams ist das ein Vorteil.',
      code: C`
export const PitchStore = signalStore(
  { providedIn: 'root' },
  withState({ pitches: [] as Pitch[] }),
  withComputed(({ pitches }) => ({
    punkte: computed(() => pitches().reduce((p, s) => p + wertung(s), 0)),
  })),
  withMethods(store => ({
    eintragen(pitch: Pitch) {
      patchState(store, s => ({ pitches: [...s.pitches, pitch] }));
    },
  }))
);`,
      notes: [['signalStore', 'Baut einen Store-Service aus Bausteinen.'], ['withState', 'Der Anfangszustand.'], ['withComputed', 'Abgeleitete Werte, wie bei uns.'], ['withMethods', 'Die Wege, etwas zu ändern.'], ['patchState', 'Ändert den State immutable für dich.']],
      pro: 'Klassisches NgRx (Actions, Reducer, Effects, Selectors) findest du in vielen Firmen-Apps von 2018 bis 2023. Gleiche Idee, mehr Code. Wann was? Kleine App: Signals in Services. Mittlere: Signal-Store-Service oder NgRx SignalStore. Große mit vielen Teams und Undo/DevTools: NgRx.' }
  ],
  quiz: [
    { q: 'Was heißt „Single Source of Truth“ beim State einer App?', options: ['Alle Daten liegen in localStorage', 'Jede Information hat genau einen Ort', 'Jede Komponente hält ihre eigene Kopie aktuell', 'Es gibt nur einen einzigen Service in der App'], correct: 1, why: 'Alles andere wird aus diesem einen Ort abgeleitet und nicht kopiert.' },
    { q: 'Warum merkt ein Signal nichts, wenn du state().pitches.push(x) aufrufst?', options: ['push ist bei Signals gesperrt und wird ignoriert', 'Es bleibt dieselbe Liste, die Referenz ändert sich nicht', 'Signals beobachten nur Zahlen und Texte', 'Das Signal merkt es erst beim nächsten set()'], correct: 1, why: 'Ein Signal vergleicht die Referenz. Erst eine neue Liste zählt als Änderung.' },
    { q: 'Wie schützt ein Signal-Store seinen State davor, dass ihn jemand von außen ändert?', options: ['Mit readonly vor dem Signal', 'Das Signal ist privat, nach außen gibt es nur computed-Werte', 'Mit Object.freeze auf jedem Wert', 'Komponenten bekommen eine Kopie per JSON.parse'], correct: 1, why: 'Lesen dürfen alle, ändern können nur die Methoden des Stores. readonly schützt nur das Feld selbst, set() ginge trotzdem.' }
  ],
  ex: { id: 'ex25', title: 'Die eine Wahrheit', goal: 'Bau den PitchStore: privater State, abgeleitete Punkte und Punktdifferenz, und Änderungen nur immutable.',
    todo: ['<code>eintragen(pitch)</code> fügt den Pitch <b>immutable</b> hinzu (kein push!)', '<code>punkte</code>: computed, gewonnen 3, geteilt 1, verloren 0 (wir mehr, gleich viel, weniger Jury-Punkte)', '<code>punktDifferenz</code>: computed, Summe aus <code>wir - andere</code>', '<code>zuruecksetzen()</code> leert alles', 'Von außen kann niemand <code>pitches</code> oder <code>punkte</code> direkt setzen'],
    starter: C`
import { Service, signal, computed } from '@angular/core';

export interface Pitch { wir: number; andere: number; }
interface PitchState { pitches: Pitch[]; }

@Service()
export class PitchStore {
  private state = signal<PitchState>({ pitches: [] });

  readonly pitches = computed(() => this.state().pitches);
  // punkte und punktDifferenz fehlen

  eintragen(pitch: Pitch) {
    this.state().pitches.push(pitch); // Bug!
  }

  zuruecksetzen() {}
}
`,
    solution: C`
import { Service, signal, computed } from '@angular/core';

export interface Pitch { wir: number; andere: number; }
interface PitchState { pitches: Pitch[]; }

const wertung = (s: Pitch) => s.wir > s.andere ? 3 : s.wir === s.andere ? 1 : 0;

@Service()
export class PitchStore {
  private state = signal<PitchState>({ pitches: [] });

  readonly pitches = computed(() => this.state().pitches);
  readonly punkte = computed(() => this.pitches().reduce((p, s) => p + wertung(s), 0));
  readonly punktDifferenz = computed(() => this.pitches().reduce((d, s) => d + s.wir - s.andere, 0));

  eintragen(pitch: Pitch) {
    this.state.update(s => ({ ...s, pitches: [...s.pitches, pitch] }));
  }

  zuruecksetzen() {
    this.state.set({ pitches: [] });
  }
}
`,
    notes: [['const wertung', 'Kleine Hilfsfunktion: 3 (gewonnen), 1 (geteilt) oder 0 Punkte für einen Pitch.'], ['reduce((p, s) => p + wertung(s), 0)', 'reduce: geht alle Pitches durch und zählt auf. Start bei 0.'], ['d + s.wir - s.andere', 'Punktdifferenz pro Pitch aufaddieren.'], ['[...s.pitches, pitch]', 'Neue Liste statt push.'], ['this.state.set', 'Zurücksetzen: komplett neuer State.']],
    hints: ['Statt push: <code>this.state.update(s => ({ ...s, pitches: [...s.pitches, pitch] }));</code>', 'Punkte: <code>computed(() => this.pitches().reduce((p, s) => p + (s.wir > s.andere ? 3 : s.wir === s.andere ? 1 : 0), 0))</code>'],
    tests: [
      { name: 'Gewonnener Pitch gibt 3 Punkte', run: T => { const st = T.inject(T.get('PitchStore')); st.eintragen({ wir: 2, andere: 0 }); T.ok(st.punkte, 'Es fehlt punkte = computed(...).'); T.eq(st.punkte(), 3, 'Ein gewonnener Pitch = 3 Punkte. Rechnet punkte neu? (push ändert die Liste heimlich, das Signal merkt es nicht.)'); } },
      { name: 'Gewonnen, geteilt, verloren', run: T => { const st = T.inject(T.get('PitchStore')); [{ wir: 3, andere: 1 }, { wir: 1, andere: 1 }, { wir: 0, andere: 2 }].forEach(s => st.eintragen(s)); T.eq(st.punkte(), 4, '3 + 1 + 0 = 4 Punkte.'); T.ok(st.punktDifferenz, 'Es fehlt punktDifferenz = computed(...).'); T.eq(st.punktDifferenz(), 0, '(3-1) + (1-1) + (0-2) = 0.'); } },
      { name: 'Immutable: alte Liste bleibt unverändert', run: T => { const st = T.inject(T.get('PitchStore')); const vorher = st.pitches(); st.eintragen({ wir: 1, andere: 0 }); T.eq(vorher.length, 0, 'Die alte Liste wurde verändert (push?). Bau eine neue Liste: [...s.pitches, pitch].'); T.ok(st.pitches() !== vorher && st.pitches().length === 1, 'Nach eintragen soll pitches() eine NEUE Liste mit 1 Pitch sein.'); } },
      { name: 'Zurücksetzen', run: T => { const st = T.inject(T.get('PitchStore')); st.eintragen({ wir: 5, andere: 0 }); st.zuruecksetzen(); T.eq([st.pitches().length, st.punkte ? st.punkte() : -1], [0, 0], 'Nach zuruecksetzen(): keine Pitches, 0 Punkte.'); } },
      { name: 'Von außen nur lesen', run: T => { const st = T.inject(T.get('PitchStore')); T.ok(!st.pitches.set && (!st.punkte || !st.punkte.set), 'pitches und punkte sollen computed sein, ohne set().'); T.ok(!T.has(/^\s*(public\s+)?state\s*=/m), 'state soll private sein.'); } }
    ] },
  merke: ['Jede Information hat EINEN Ort. Der Rest ist computed.', 'Store = privates Signal + computed zum Lesen + Methoden zum Ändern.', 'Nie push/direkt ändern. Immer neue Objekte/Listen (Spread).', 'NgRx SignalStore für größere Apps, klassisches NgRx im Bestandscode.'],
  paare: [
    ['Lokaler State', 'signal() in der Komponente'],
    ['Geteilter State', 'Ein Service als Store'],
    ['Server-State', 'resource() oder HttpClient'],
    ['Store', 'Privates Signal, computed zum Lesen, Methoden zum Ändern'],
    ['NgRx SignalStore', 'Fertige Bibliothek für große Apps']
  ]
});

CH.push({
  id: 'k31', akt: 5, title: 'Ein Baustein für alle Teams', tag: 'Komponenten-API · model() · Transforms · host', xp: 220,
  doku: [['Eingaben mit input()', 'https://angular.dev/guide/components/inputs'], ['Two-Way-Binding mit model()', 'https://angular.dev/guide/components/inputs#model-inputs'], ['Das Host-Element', 'https://angular.dev/guide/components/host-elements']],
  ticket: { id: 'PW-160', typ: 'Feature', titel: 'Ein Schalter für das Design-System', text: 'Vier Teams beim Großkunden bauen sich je einen eigenen Ein-Aus-Schalter. Bau EINEN Schalter für das gemeinsame Design-System: per [(an)] bindbar, mit „deaktiviert“ als einfachem Attribut, für Screenreader als Schalter erkennbar.' },
  story: [
    ['sara', 'Der Großkunde hat vier Teams. Jedes hat seinen eigenen Schalter gebaut, und alle sehen anders aus. Einer reagiert nicht mal auf die Tastatur.'],
    ['toni', 'Dann wird das jetzt ein Baustein im Design-System. Und da zählt vor allem eins: die API. Wie fühlt es sich an, ihn zu benutzen?'],
    ['du', 'Also nicht nur, dass er funktioniert, sondern dass ihn keiner falsch benutzen kann?'],
    ['toni', 'Genau. Ein Baustein für alle wird hundertmal benutzt. Jeder Stolperstein darin kostet hundertmal Zeit.']
  ],
  slides: [
    { t: 'Two-Way-Binding mit model()', say: 'Ein Schalter muss seinen Wert bekommen UND ändern können. model() ist beides: ein Input, den die Komponente selbst setzen darf, und ein Output, der jede Änderung meldet.', job: 'In Design-Systemen haben fast alle Eingabe-Bausteine so ein model(): Schalter, Slider, Datumsauswahl. Die Seite schreibt dann einfach [(an)]="newsletter".',
      code: C`
export class Schalter {
  an = model(false);

  umschalten() {
    this.an.update(v => !v);
  }
}

// Auf der Seite:
<app-schalter [(an)]="newsletter" />`,
      notes: [['an = model(false)', 'Wert von außen, Startwert false. Anders als input() darf die Komponente ihn selbst ändern.'], ['this.an.update', 'Ändert den Wert. Angular meldet das automatisch als Ereignis anChange nach außen.'], ['[(an)]="newsletter"', 'Banana in a box: newsletter geht rein, und jede Änderung kommt zurück. newsletter ist hier ein Signal.']],
      pro: 'model() ist die moderne Form von @Input() plus @Output() mit dem Namen xChange. Nimm es nur für echte Eingabe-Bausteine. Für Daten, die nur angezeigt werden, bleibt input() richtig: Data down, events up.' },
    { t: 'Inputs, die sich gut anfühlen', say: 'In HTML schreibt man <button disabled>, ohne ="true". Ein guter Baustein erlaubt das auch. Ein Transform wandelt den Wert beim Reinkommen um.', job: 'Ohne Transform ist <app-schalter deaktiviert /> ein leerer Text, und der passt nicht zu boolean. Seit v22 prüft der Compiler Templates streng (strictTemplates) und meldet das beim Bauen. In Altprojekten ohne diese Prüfung kommt der leere Text still an, er ist falsy, und der Schalter bleibt aktiv. Solche Bugs findet man in Reviews von Design-Systemen ständig.',
      code: C`
export class Schalter {
  label = input.required<string>();
  deaktiviert = input(false, { transform: booleanAttribute });
  breite = input(40, { transform: numberAttribute });
}

<app-schalter label="Newsletter" deaktiviert />`,
      notes: [['input.required<string>()', 'Pflicht: Ohne label meldet Angular schon beim Bauen einen Fehler. Kein Schalter ohne Beschriftung.'], ['booleanAttribute', 'Macht aus dem leeren Attribut (und aus "true") ein echtes true, aus "false" ein false.'], ['numberAttribute', 'Macht aus breite="60" die Zahl 60.'], ['deaktiviert />', 'So einfach wie bei einem normalen HTML-Element.']],
      pro: 'Faustregel für Bausteine: Pflicht-Inputs mit input.required, Rest mit sinnvollem Standardwert. Wenige Inputs mit klaren Namen sind besser als viele Schalter für jeden Sonderfall. Die strenge Prüfung steht in der tsconfig.json als strictTemplates. Bei alten Projekten trägt ng update dort strictTemplates: false ein, damit nichts bricht. Einschalten lohnt sich.' },
    { t: 'Das Host-Element gehört dazu', say: 'Das Element <app-schalter> selbst heißt Host. Über host im @Component setzt du dort Rolle, ARIA-Attribute, Klassen und Ereignisse. Ganz ohne extra Wrapper-div.', job: 'Barrierefreiheit gehört in den Baustein, nicht in jede Seite. Steht role="switch" einmal im Design-System, haben es alle hundert Stellen in der App richtig.',
      code: C`
@Component({
  selector: 'app-schalter',
  host: {
    'role': 'switch',
    '[attr.aria-checked]': 'an()',
    '[class.aus]': 'deaktiviert()',
    '(click)': 'umschalten()',
  },
  template: \`<span class="label">{{ label() }}</span>\`,
})`,
      notes: [["'role': 'switch'", 'Fester Wert: Screenreader sagen „Schalter“ statt nur Text.'], ["'[attr.aria-checked]'", 'Gebunden wie [ ] im Template: an oder aus wird mit vorgelesen.'], ["'[class.aus]'", 'Klasse am Host, wenn deaktiviert. Das Aussehen kommt dann aus dem CSS.'], ["'(click)'", 'Klick irgendwo auf den Baustein schaltet um.']],
      pro: 'host ersetzt die alten @HostBinding und @HostListener. Für die Tastatur fehlen noch tabindex="0" und (keydown.space). Im echten Design-System gehört das dazu, genauso wie ein sichtbarer Fokus. Für Dialoge, Menüs und Auswahllisten schau erst ins Angular CDK (@angular/cdk), bevor du Fokus-Logik selbst schreibst: FocusTrap hält den Fokus im Dialog, LiveAnnouncer lässt Screenreader Meldungen vorlesen, Overlay legt Menüs und Popups sauber über die Seite.' }
  ],
  quiz: [
    { q: 'Ein Datumsfeld im Design-System soll seinen Wert bekommen und selbst ändern können. Was nimmst du dafür?', options: ['input() und die Seite liest den Wert per viewChild aus', 'model(), dann bindet die Seite mit [(wert)]', 'Einen Service, in den alle Datumsfelder schreiben', 'output() allein, ohne Startwert'], correct: 1, why: 'model() ist Input und Output in einem. Die Seite bindet mit [(wert)], und die Komponente darf den Wert selbst setzen.' },
    { q: 'Im Baustein steht <code>deaktiviert = input(false)</code> ohne Transform. Jemand schreibt <code>&lt;app-schalter deaktiviert /&gt;</code>. Was kommt an?', options: ['true', 'Ein leerer Text, der als falsy gilt, also bleibt der Schalter aktiv', 'Ein Fehler beim Bauen', 'undefined'], correct: 2, why: 'Ein Attribut ohne Wert ist der leere Text \'\', und der passt nicht zu boolean. Seit v22 prüft der Compiler Templates streng (strictTemplates) und bricht den Build ab. Erst transform: booleanAttribute erlaubt die Schreibweise und macht daraus true. Ohne strenge Prüfung käme still der leere Text an.' },
    { q: 'Wo setzt du am besten <code>role="switch"</code> für einen Schalter aus dem Design-System?', options: ['In jeder Seite, die den Schalter benutzt', 'Im host des Bausteins, dann stimmt es überall', 'In einem globalen CSS', 'Gar nicht, Screenreader erkennen das selbst'], correct: 1, why: 'Was zum Baustein gehört, steht im Baustein. Dann haben es alle Stellen richtig, ohne dass jemand daran denken muss.' }
  ],
  ex: { id: 'ex31', title: 'Der Schalter', goal: 'Bau den Schalter für das Design-System: Wert per <code>model()</code>, <code>deaktiviert</code> als Attribut, Rolle und Zustand am Host.', preview: 'Vorschau',
    todo: ['<code>an = model(false)</code>, <code>label = input.required&lt;string&gt;()</code>', '<code>deaktiviert</code>: input mit Standard false und <code>transform: booleanAttribute</code>', '<code>host</code>: <code>role</code> ist <code>switch</code>, <code>[attr.aria-checked]</code> zeigt <code>an()</code>, <code>(click)</code> ruft <code>umschalten()</code>', '<code>umschalten()</code> dreht den Wert um, außer der Schalter ist deaktiviert'],
    starter: C`
import { Component, booleanAttribute, input, model, signal } from '@angular/core';

@Component({
  selector: 'app-schalter',
  host: {
    // Rolle, aria-checked und Klick
  },
  template: \`<span class="label">{{ label() }}</span>\`,
  styles: \`:host { display: inline-flex; margin: 4px; padding: 6px 14px; border: 2px solid #9AA3A8; border-radius: 999px; cursor: pointer; user-select: none; }
    :host([aria-checked="true"]) { background: #2E9E63; border-color: #2E9E63; color: #fff; }\`,
})
export class Schalter {
  label = input('');
  an = false;
  deaktiviert = input(false);

  umschalten() {
    this.an = !this.an;
  }
}

// Nur für die Vorschau: so benutzt eine Seite den Schalter
@Component({
  selector: 'app-vorschau',
  imports: [Schalter],
  template: \`
    <app-schalter label="Newsletter" [(an)]="newsletter" />
    <app-schalter label="Gesperrt" deaktiviert />
    <p>Newsletter: {{ newsletter() ? 'an' : 'aus' }}</p>
  \`,
})
export class Vorschau {
  newsletter = signal(false);
}
`,
    solution: C`
import { Component, booleanAttribute, input, model, signal } from '@angular/core';

@Component({
  selector: 'app-schalter',
  host: {
    'role': 'switch',
    '[attr.aria-checked]': 'an()',
    '(click)': 'umschalten()',
  },
  template: \`<span class="label">{{ label() }}</span>\`,
  styles: \`:host { display: inline-flex; margin: 4px; padding: 6px 14px; border: 2px solid #9AA3A8; border-radius: 999px; cursor: pointer; user-select: none; }
    :host([aria-checked="true"]) { background: #2E9E63; border-color: #2E9E63; color: #fff; }\`,
})
export class Schalter {
  label = input.required<string>();
  an = model(false);
  deaktiviert = input(false, { transform: booleanAttribute });

  umschalten() {
    if (this.deaktiviert()) return;
    this.an.update(v => !v);
  }
}

// Nur für die Vorschau: so benutzt eine Seite den Schalter
@Component({
  selector: 'app-vorschau',
  imports: [Schalter],
  template: \`
    <app-schalter label="Newsletter" [(an)]="newsletter" />
    <app-schalter label="Gesperrt" deaktiviert />
    <p>Newsletter: {{ newsletter() ? 'an' : 'aus' }}</p>
  \`,
})
export class Vorschau {
  newsletter = signal(false);
}
`,
    notes: [["'role': 'switch'", 'Fester Wert am Host: Screenreader sagen „Schalter“.'], ["'[attr.aria-checked]': 'an()'", 'Der Zustand wird mit vorgelesen und bleibt immer aktuell.'], ["'(click)': 'umschalten()'", 'Klick auf den ganzen Baustein.'], ['input.required<string>()', 'Ohne Beschriftung kein Schalter.'], ['an = model(false)', 'Wert rein, Änderung raus: [(an)] auf der Seite.'], ['booleanAttribute', 'Damit reicht deaktiviert als leeres Attribut.'], ['if (this.deaktiviert()) return;', 'Gesperrt heißt: nichts passiert, auch nicht beim Klick.']],
    hints: ['Zuerst die Klasse: <code>an = model(false);</code>, <code>label = input.required&lt;string&gt;();</code>, <code>deaktiviert = input(false, { transform: booleanAttribute });</code>', 'In <code>umschalten()</code>: <code>if (this.deaktiviert()) return;</code> und dann <code>this.an.update(v =&gt; !v);</code>', 'Der host: <code>{ \'role\': \'switch\', \'[attr.aria-checked]\': \'an()\', \'(click)\': \'umschalten()\' }</code>'],
    tests: [
      { name: 'Der Schalter zeigt seine Beschriftung', run: T => { const f = T.mount(T.cmp('Schalter'), { inputs: { label: 'Newsletter' } }); T.ok(f.q('.label') && f.q('.label').textContent.trim() === 'Newsletter', 'Mit label = Newsletter soll in .label genau „Newsletter“ stehen.'); } },
      { name: 'an ist ein model() und meldet Änderungen', run: async T => { const f = T.mount(T.cmp('Schalter'), { inputs: { label: 'X' } }); const an = f.instance.an; T.ok(an && typeof an === 'function' && typeof an.set === 'function' && typeof an.subscribe === 'function', 'an soll ein model(false) sein: lesbar mit an(), änderbar und von außen bindbar.'); const got = []; an.subscribe(v => got.push(v)); await f.click(f.host); T.eq(got, [true], 'Ein Klick auf den Schalter soll an auf true setzen und das melden.'); } },
      { name: 'Host: Rolle und Zustand für Screenreader', run: async T => { const f = T.mount(T.cmp('Schalter'), { inputs: { label: 'X' } }); T.eq(f.host.getAttribute('role'), 'switch', 'Am Host-Element soll role="switch" stehen.'); T.eq(f.host.getAttribute('aria-checked'), 'false', 'Am Anfang soll aria-checked="false" sein.'); await f.click(f.host); T.eq(f.host.getAttribute('aria-checked'), 'true', 'Nach einem Klick soll aria-checked="true" sein.'); } },
      { name: 'deaktiviert als leeres Attribut sperrt den Schalter', run: async T => { const f = T.mount(T.cmp('Schalter'), { inputs: { label: 'X', deaktiviert: '' } }); T.ok(f.instance.deaktiviert() === true, 'deaktiviert="" (das leere Attribut) soll true ergeben. Fehlt transform: booleanAttribute?'); await f.click(f.host); T.ok(f.instance.an() === false, 'Ein gesperrter Schalter darf beim Klick nicht umschalten.'); } },
      { name: 'label ist Pflicht', run: T => { T.ok(/label\s*=\s*input\.required\s*<\s*string\s*>\s*\(/.test(T.code), 'label soll input.required<string>() sein. Ein Schalter ohne Beschriftung soll gar nicht erst bauen.'); } }
    ] },
  merke: ['model() = Wert rein und Änderung raus, auf der Seite [(wert)].', 'transform: booleanAttribute, damit ein leeres Attribut true ist.', 'host setzt Rolle, ARIA, Klassen und Ereignisse am Baustein selbst.', 'Ein Baustein für alle braucht eine API, die man nicht falsch benutzen kann.'],
  paare: [
    ['<code>model()</code>', 'Wert rein und Änderung raus'],
    ['<code>[(wert)]</code>', 'Two-Way-Binding auf der Seite'],
    ['<code>booleanAttribute</code>', 'Ein leeres Attribut wird true'],
    ['<code>host</code>', 'Rolle, ARIA und Klassen am Baustein selbst']
  ]
});
