/* ================= Phase: GRUNDLAGEN =================
   Für alle, die bei null anfangen: HTML, CSS, TypeScript und die Werkzeuge, bevor Angular losgeht.
   grundlagen: true markiert die Phase. Wer im Einstieg „direkt mit Angular“ wählt, sieht sie als optional (basis.js, grundlagenOptional).
   Die Übungen brauchen kein Angular: Sie prüfen exportierte Funktionen, Klassen oder Texte mit HTML und CSS. */
AKTE.push({ n: 'B', title: 'Grundlagen', sub: 'HTML, CSS, TypeScript und deine Werkzeuge, bevor Angular losgeht', grundlagen: true });

/* HTML aus einem Text lesen, ohne es in die Seite zu hängen */
const bHtml = s => { const t = document.createElement('template'); t.innerHTML = String(s); return t.content; };
/* CSS auf eine echte Karte legen und nachmessen. Die Karte steckt in einem Shadow Root, damit das CSS nicht in die App rutscht. */
const bStil = css => {
  const host = document.createElement('div'); document.body.appendChild(host);
  try {
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = '<style>' + String(css) + '</style><div class="karte"><h2 class="titel">Leon</h2><p class="rolle">Frontend</p></div>';
    const k = getComputedStyle(root.querySelector('.karte')), t = getComputedStyle(root.querySelector('.titel')), r = getComputedStyle(root.querySelector('.rolle'));
    return { display: k.display, gap: k.columnGap, padding: [k.paddingTop, k.paddingRight, k.paddingBottom, k.paddingLeft], rahmen: [k.borderTopWidth, k.borderTopStyle, k.borderLeftWidth, k.borderLeftStyle], unten: k.marginBottom, titel: t.color, rolle: r.color };
  } finally { host.remove(); }
};

CH.push(
{
  id: 'b01', akt: 'B', title: 'HTML in kurz', tag: 'Element · Attribut · Verschachtelung', xp: 50,
  doku: [['HTML im Überblick (MDN)', 'https://developer.mozilla.org/de/docs/Web/HTML'], ['Alle HTML-Elemente (MDN)', 'https://developer.mozilla.org/de/docs/Web/HTML/Reference/Elements']],
  ticket: { id: 'PW-160', typ: 'Onboarding', titel: 'Eine Karte in reinem HTML', text: 'Bevor du Angular-Komponenten baust, baust du Leons Entwicklerkarte einmal in reinem HTML. Ohne Framework, nur Tags.' },
  story: [
    ['erz', 'Dienstag. Toni hat dir einen Platz neben sich freigeräumt.'],
    ['toni', 'Angular baut am Ende HTML. Wer HTML lesen kann, versteht jedes Template.'],
    ['du', 'Ich kenne nur die spitzen Klammern. Mehr nicht.'],
    ['toni', 'Reicht für den Anfang. Wir bauen eine Karte, Tag für Tag.']
  ],
  slides: [
    { t: 'Element = Tag auf, Inhalt, Tag zu', say: 'HTML beschreibt, was auf der Seite steht. Jedes Stück davon ist ein Element: ein Start-Tag, der Inhalt und ein End-Tag.',
      job: 'Im Template einer Angular-Komponente steht genau solches HTML. Liest du dort <h2>, weißt du: Hier kommt eine Überschrift.',
      code: C`
<h1>Teamboard</h1>
<p>Hier siehst du alle Entwickler.</p>
<input type="text">`,
      notes: [['<h1>', 'Start-Tag und End-Tag. h1 heißt: Überschrift der Stufe 1. Das End-Tag hat einen Schrägstrich.'], ['<p>Hier', 'p ist ein Absatz (paragraph). Der Inhalt steht zwischen den Tags.'], ['<input', 'Manche Elemente haben keinen Inhalt und kein End-Tag. input ist so eins.']],
      pro: 'Elemente ohne Inhalt heißen „void elements“: input, img, br. Du darfst sie auch mit Schrägstrich am Ende schreiben: <input />.' },
    { t: 'Attribute: Zusatzinfos im Start-Tag', say: 'Attribute stehen im Start-Tag, immer als name="wert". Sie geben dem Element Zusatzinfos.',
      job: 'Ein label mit for gehört an jedes Eingabefeld. Screenreader lesen den Text vor, und ein Klick auf das Label trifft das Feld. Fehlt es, fällt das im Review sofort auf.',
      code: C`
<a href="https://angular.dev">Zur Doku</a>
<button type="button" disabled>Speichern</button>
<label for="name">Name</label>
<input id="name" type="text" value="Leon">`,
      notes: [['href=', 'href sagt dem Link, wohin er führt.'], ['disabled', 'Ein Attribut ohne Wert. Es reicht, dass es da ist: Der Knopf ist ausgeschaltet.'], ['for="name"', 'Das Label gehört zum Feld mit der id name.'], ['id="name"', 'id ist ein Name, den es auf der Seite nur einmal gibt. value ist der Startwert im Feld.']],
      pro: 'Anführungszeichen um den Wert sind fast immer Pflicht, sobald ein Leerzeichen drin ist. Schreib sie einfach immer.' },
    { t: 'Verschachtelung und class', say: 'Elemente stecken ineinander wie Kisten in Kisten. Was zwischen <div> und </div> steht, gehört zu diesem div.',
      job: 'Der Komponenten-Baum aus „Das große Bild“ funktioniert genauso. In den DevTools unter Elements kannst du jede Kiste auf- und zuklappen.',
      code: C`
<div class="karte">
  <h2>Leon</h2>
  <p class="rolle">Frontend</p>
  <ul>
    <li>Angular</li>
    <li>TypeScript</li>
  </ul>
</div>`,
      notes: [['<div class="karte">', 'div ist ein Kasten ohne eigene Bedeutung. Er hält andere Elemente zusammen.'], ['class="rolle"', 'class gibt dem Element einen Namen für CSS. Viele Elemente dürfen dieselbe Klasse haben.'], ['<ul>', 'ul ist eine Liste mit Punkten (unordered list).'], ['<li>Angular', 'li ist ein Punkt der Liste. Er steht immer in einem ul oder ol.'], ['</div>', 'Hier geht der Kasten zu. Alles dazwischen ist sein Inhalt.']],
      pro: 'Einrücken ist für Menschen, dem Browser ist es egal. Gut eingerückt siehst du aber sofort, wo eine Kiste zugeht.' },
    { t: 'Die Tags, die du ständig brauchst', say: 'Mit diesen Tags kommst du im Alltag sehr weit.',
      job: 'Nimm für einen Klick immer <button>, nicht ein div mit Klick. Der button geht auch mit Tastatur und Screenreader.',
      punkte: [['h1, h2, h3', 'Überschriften, von groß nach klein.', ''], ['p', 'Ein Absatz Text.', ''], ['ul und li', 'Eine Liste und ihre Punkte.', ''], ['a', 'Ein Link. Das Ziel steht in href.', ''], ['button', 'Ein Knopf zum Klicken.', ''], ['input und label', 'Ein Eingabefeld und seine Beschriftung.', ''], ['div und span', 'Kästen ohne eigene Bedeutung. div für Blöcke, span für ein Stück Text.', '']],
      pro: 'In Angular kommen eigene Tags dazu, zum Beispiel <app-entwickler-karte>. Daran erkennst du eine Komponente: Sie hat einen Bindestrich im Namen.' },
    { t: 'Ausblick: Attribut oder Property?', say: 'Aus jedem Element baut der Browser ein Objekt im Speicher, das DOM. Das Attribut im HTML ist nur der Startwert. Die DOM-Property ist der Wert gerade jetzt.',
      job: 'Angular schreibt mit [value]="name" in die Property, nicht in das Attribut. Darum zeigt das Feld immer den aktuellen Wert. Die eckigen Klammern lernst du im Kapitel „Daten auf die Karte“.',
      code: C`
<!-- im HTML: der Startwert -->
<input id="name" value="Leon">

// im Browser, nachdem jemand Mo getippt hat:
feld.getAttribute('value');  // 'Leon'
feld.value;                  // 'Mo'`,
      notes: [['value="Leon"', 'Das Attribut steht im HTML. Es ist nur der Startwert.'], ["getAttribute('value')", 'Das Attribut bleibt Leon, egal was jemand tippt.'], ['feld.value;', 'Die DOM-Property: der Wert, der gerade im Feld steht.']],
      pro: 'Meist heißen Attribut und Property gleich: id, value, disabled. Es gibt Ausnahmen. Das Attribut class heißt als Property className.' }
  ],
  quiz: [
    { q: 'Was ist im HTML-Code <code>&lt;p class="rolle"&gt;Frontend&lt;/p&gt;</code> das Attribut?', options: ['p', 'class="rolle"', 'Frontend', '</p>'], correct: 1, why: 'Ein Attribut steht im Start-Tag als name="wert". p ist der Tag-Name, Frontend der Inhalt, </p> das End-Tag.' },
    { q: 'Ein Eingabefeld hat <code>id="name"</code>. Wie verbindest du ein label mit genau diesem Feld?', options: ['<label name="name">', '<label for="name">', '<label id="name">', 'Das label muss nur irgendwo davor stehen'], correct: 1, why: 'for im label nennt die id des Felds. Dann gehören beide zusammen, auch für Screenreader.' },
    { q: 'Ein Feld hat im HTML <code>value="Leon"</code>. Jemand tippt stattdessen Mo hinein. Was steht danach in der DOM-Property value?', options: ['Leon', 'Mo', 'LeonMo', 'Nichts, bis man speichert'], correct: 1, why: 'Das Attribut bleibt der Startwert Leon. Die Property value zeigt immer den aktuellen Inhalt, also Mo.' }
  ],
  ex: { id: 'exb1', title: 'Leons Karte in HTML', goal: 'Bau Leons Entwicklerkarte als reines HTML. Dein HTML steht als Text zwischen den Backticks, die Tests lesen es wie ein Browser.',
    todo: ['Unter dem <code>&lt;h2&gt;</code>: ein <code>&lt;p&gt;</code> mit <b>Frontend</b>', 'Eine Liste <code>&lt;ul&gt;</code> mit zwei Punkten: <b>Angular</b> und <b>TypeScript</b>', 'Ein <code>&lt;label&gt;</code> mit dem Text <b>Notiz</b>, das per <code>for</code> zu einem <code>&lt;input id="notiz"&gt;</code> gehört', 'Ein <code>&lt;button&gt;</code> mit <b>Speichern</b>', 'Alles steht im <code>&lt;div class="karte"&gt;</code>'],
    starter: C`
// Schreib dein HTML zwischen die Backticks.
export const karte = \`
<div class="karte">
  <h2>Leon</h2>

</div>
\`;
`,
    solution: C`
export const karte = \`
<div class="karte">
  <h2>Leon</h2>
  <p>Frontend</p>
  <ul>
    <li>Angular</li>
    <li>TypeScript</li>
  </ul>
  <label for="notiz">Notiz</label>
  <input id="notiz" type="text">
  <button type="button">Speichern</button>
</div>
\`;
`,
    notes: [['<p>Frontend', 'Ein Absatz direkt unter der Überschrift.'], ['<ul>', 'Die Liste. Die Punkte stecken darin.'], ['<label for="notiz">', 'for nennt die id des Felds.'], ['<input id="notiz"', 'Das Feld mit genau dieser id.'], ['<button', 'type="button" heißt: nur ein Knopf, kein Absenden eines Formulars.'], ['</div>', 'Erst hier geht die Karte zu. Alles steht darin.']],
    hints: ['Ein Absatz: <code>&lt;p&gt;Frontend&lt;/p&gt;</code>', 'Liste: <code>&lt;ul&gt;&lt;li&gt;Angular&lt;/li&gt;&lt;li&gt;TypeScript&lt;/li&gt;&lt;/ul&gt;</code>', 'Feld: <code>&lt;label for="notiz"&gt;Notiz&lt;/label&gt; &lt;input id="notiz"&gt;</code>', 'Achte darauf, dass alles vor dem <code>&lt;/div&gt;</code> steht.'],
    tests: [
      { name: 'karte ist ein Text mit HTML', run: T => T.ok(typeof T.get('karte') === 'string' && bHtml(T.get('karte')).querySelector('.karte h2'), 'karte soll ein Text in Backticks sein, mit dem <div class="karte"> und dem <h2> darin.') },
      { name: '<p> zeigt Frontend', run: T => { const p = bHtml(T.get('karte')).querySelector('.karte p'); T.ok(p, 'Kein <p> in der Karte gefunden.'); T.eq(p.textContent.trim(), 'Frontend', 'Im <p> steht nicht Frontend.'); } },
      { name: 'Liste mit zwei Punkten', run: T => T.eq([...bHtml(T.get('karte')).querySelectorAll('.karte ul > li')].map(li => li.textContent.trim()), ['Angular', 'TypeScript'], 'Die Liste braucht ein <ul> und darin zwei <li>: Angular und TypeScript.') },
      { name: 'label gehört zum Feld', run: T => {
        const d = bHtml(T.get('karte')), feld = d.querySelector('.karte input#notiz'), label = d.querySelector('.karte label');
        T.ok(feld, 'Kein <input id="notiz"> in der Karte gefunden.'); T.ok(label, 'Kein <label> in der Karte gefunden.');
        T.eq(label.getAttribute('for'), 'notiz', 'Das label braucht for="notiz", genau wie die id des Felds.');
        T.eq(label.textContent.trim(), 'Notiz', 'Im label soll Notiz stehen.');
      } },
      { name: 'Knopf zum Speichern', run: T => { const b = bHtml(T.get('karte')).querySelector('.karte button'); T.ok(b, 'Kein <button> in der Karte gefunden.'); T.eq(b.textContent.trim(), 'Speichern', 'Auf dem Knopf soll Speichern stehen.'); } },
      { name: 'Alles steht in der Karte', run: T => T.eq([...bHtml(T.get('karte')).children].map(e => e.tagName.toLowerCase() + '.' + e.className), ['div.karte'], 'Alles gehört in den einen <div class="karte">. Steht etwas nach dem </div>?') }
    ] },
  merke: ['Element = Start-Tag, Inhalt, End-Tag.', 'Attribute stehen im Start-Tag: name="wert".', 'class ist ein Name für CSS. label for gehört zur id eines Felds.', 'Attribut = Startwert im HTML. DOM-Property = Wert gerade jetzt.']
},
{
  id: 'b02', akt: 'B', title: 'CSS in kurz', tag: 'Selektor · Klasse · Box-Modell · Flexbox', xp: 50,
  doku: [['CSS im Überblick (MDN)', 'https://developer.mozilla.org/de/docs/Web/CSS'], ['Das Box-Modell (MDN)', 'https://developer.mozilla.org/de/docs/Learn_web_development/Core/Styling_basics/Box_model'], ['Flexbox (MDN)', 'https://developer.mozilla.org/de/docs/Learn_web_development/Core/CSS_layout/Flexbox']],
  ticket: { id: 'PW-161', typ: 'Feature', titel: 'Die Karte bekommt Stil', text: 'Leons Karte steht, sieht aber aus wie ein Brief von 1995. Gib ihr Abstand, einen Rahmen und stell Name und Rolle nebeneinander.' },
  story: [
    ['sara', 'Die Karte ist da. Aber im Figma-Entwurf sieht sie ganz anders aus.'],
    ['du', 'Farben und Abstände? Das ist doch CSS, oder?'],
    ['toni', 'Genau. CSS sagt dem Browser, wie etwas aussieht. Regel für Regel.']
  ],
  slides: [
    { t: 'Selektor + Regel', say: 'CSS besteht aus Regeln. Vorne steht, WEN es trifft: der Selektor. In den geschweiften Klammern steht, WIE es aussehen soll.',
      job: 'In Angular schreibst du CSS in styles der Komponente oder in eine .css-Datei daneben. Es gilt dann nur für diese Komponente. Das siehst du im Kapitel „Die erste Entwicklerkarte“.',
      code: C`
h2 {
  color: #2453c9;
  font-size: 24px;
}

.rolle {
  color: gray;
}`,
      notes: [['h2 {', 'Der Selektor: Für welche Elemente gilt das? Hier für alle h2.'], ['color: #2453c9', 'Eine Regel: Eigenschaft, Doppelpunkt, Wert, Semikolon. Hier die Schriftfarbe.'], ['font-size', 'Die Schriftgröße, hier in Pixeln.'], ['.rolle {', 'Ein Punkt davor heißt: alle Elemente mit class="rolle".']],
      pro: 'Treffen zwei Regeln dasselbe Element, gewinnt die genauere. Eine Klasse schlägt einen Tag-Namen, eine id schlägt eine Klasse. Das heißt Spezifität.' },
    { t: 'Das Box-Modell', say: 'Jedes Element ist ein Kasten. Von innen nach außen: Inhalt, Innenabstand (padding), Rahmen (border), Außenabstand (margin).',
      job: 'In den DevTools unter Elements siehst du das Box-Modell jedes Elements als bunte Grafik. So findest du schnell, woher ein komischer Abstand kommt.',
      code: C`
.karte {
  padding: 16px;
  border: 2px solid #2453c9;
  margin-bottom: 24px;
  box-sizing: border-box;
}`,
      notes: [['padding', 'Innenabstand: Platz zwischen Inhalt und Rahmen.'], ['border', 'Der Rahmen: Dicke, Art (solid heißt durchgezogen) und Farbe.'], ['margin-bottom', 'Außenabstand nach unten: Platz bis zum nächsten Kasten.'], ['box-sizing', 'Die Breite zählt Innenabstand und Rahmen mit. Das macht das Rechnen leichter.']],
      pro: 'padding: 8px 16px heißt: oben und unten 8, links und rechts 16. Mit vier Werten geht es im Uhrzeigersinn: oben, rechts, unten, links.' },
    { t: 'Flexbox: nebeneinander', say: 'Normalerweise stehen Kästen untereinander. Mit display: flex stellst du die Kinder eines Kastens in eine Reihe.',
      job: 'Kopfzeile mit Logo links und Profil rechts, Knöpfe nebeneinander: Das ist fast immer Flexbox. Du siehst es in jedem Projekt.',
      code: C`
.zeile {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
}`,
      notes: [['display: flex', 'Die Kinder dieses Kastens stehen jetzt nebeneinander.'], ['gap', 'Der Abstand zwischen den Kindern.'], ['justify-content', 'Wie die Kinder in der Reihe verteilt sind. space-between: ganz links, ganz rechts, der Rest dazwischen.'], ['align-items', 'Die Ausrichtung quer dazu. center heißt: mittig in der Höhe.']],
      pro: 'flex-direction: column stellt die Kinder wieder untereinander, aber mit allen Möglichkeiten von Flexbox. Für Raster mit Zeilen und Spalten gibt es display: grid.' }
  ],
  quiz: [
    { q: 'Welcher CSS-Selektor trifft alle Elemente mit <code>class="rolle"</code>?', options: ['rolle', '.rolle', '#rolle', '<rolle>'], correct: 1, why: 'Der Punkt steht für eine Klasse. Ohne Punkt wäre es ein Tag-Name, mit # eine id.' },
    { q: 'Du willst mehr Platz zwischen dem Text einer Karte und ihrem Rahmen. Welche Eigenschaft änderst du?', options: ['margin', 'padding', 'border', 'gap'], correct: 1, why: 'padding ist der Innenabstand zwischen Inhalt und Rahmen. margin liegt außerhalb des Rahmens.' },
    { q: 'Was bewirkt <code>display: flex</code> an einem Kasten?', options: ['Der Kasten wird unsichtbar', 'Seine Kinder stehen nebeneinander in einer Reihe', 'Der Kasten wird so breit wie die Seite', 'Der Kasten bekommt einen Rahmen'], correct: 1, why: 'display: flex macht den Kasten zum Flex-Container. Seine Kinder reihen sich nebeneinander auf.' }
  ],
  ex: { id: 'exb2', title: 'Leons Karte stylen', goal: 'Schreib das CSS für Leons Karte. Die Tests legen es auf eine echte Karte und messen nach.',
    todo: ['<code>.karte</code>: <code>display: flex</code> und <code>gap: 12px</code>', '<code>.karte</code>: Innenabstand <code>16px</code> und ein Rahmen <code>2px solid</code> in einer Farbe deiner Wahl', '<code>.karte</code>: Außenabstand unten <code>24px</code>', '<code>.titel</code>: eine eigene Schriftfarbe, nur für den Namen'],
    starter: C`
// Die Karte, auf die dein CSS kommt:
// <div class="karte">
//   <h2 class="titel">Leon</h2>
//   <p class="rolle">Frontend</p>
// </div>

export const stil = \`
.karte {

}
\`;
`,
    solution: C`
export const stil = \`
.karte {
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 2px solid #2453c9;
  margin-bottom: 24px;
}

.titel {
  color: #2453c9;
}
\`;
`,
    notes: [['display: flex', 'Name und Rolle stehen jetzt nebeneinander.'], ['gap: 12px', 'Abstand zwischen den beiden.'], ['padding: 16px', 'Innenabstand rundherum.'], ['border: 2px solid', 'Dicke, Art, Farbe.'], ['margin-bottom', 'Platz nach unten zur nächsten Karte.'], ['.titel {', 'Eine eigene Regel nur für die Klasse titel.']],
    hints: ['Jede Regel endet mit Semikolon: <code>display: flex;</code>', 'Rahmen in einer Zeile: <code>border: 2px solid #2453c9;</code>', 'Für den Namen eine zweite Regel: <code>.titel { color: #2453c9; }</code>'],
    tests: [
      { name: 'Die Karte ist eine Flex-Reihe', run: T => { const s = bStil(T.get('stil')); T.eq(s.display, 'flex', 'Die Karte braucht display: flex.'); T.eq(s.gap, '12px', 'Zwischen Name und Rolle sollen 12px Abstand sein: gap: 12px.'); } },
      { name: 'Innenabstand 16px', run: T => T.eq(bStil(T.get('stil')).padding, ['16px', '16px', '16px', '16px'], 'Die Karte braucht rundherum padding: 16px.') },
      { name: 'Rahmen 2px solid', run: T => T.eq(bStil(T.get('stil')).rahmen, ['2px', 'solid', '2px', 'solid'], 'Der Rahmen soll border: 2px solid … sein. Fehlt solid, ist er unsichtbar.') },
      { name: 'Außenabstand unten 24px', run: T => T.eq(bStil(T.get('stil')).unten, '24px', 'Unter der Karte sollen 24px Platz sein: margin-bottom: 24px.') },
      { name: 'Der Name hat eine eigene Farbe', run: T => {
        T.ok(/\.titel\s*\{/.test(T.code), 'Nimm den Klassen-Selektor .titel, damit die Regel nur den Namen trifft.');
        const s = bStil(T.get('stil')); T.ok(s.titel !== s.rolle, 'Der Name hat noch dieselbe Farbe wie die Rolle. Gib .titel eine eigene color.');
      } }
    ] },
  merke: ['Selektor { eigenschaft: wert; }', '.name trifft eine Klasse, #name eine id.', 'Box-Modell: Inhalt, padding, border, margin.', 'display: flex stellt Kinder nebeneinander, gap macht Abstand.']
},
{
  id: 'b03', akt: 'B', title: 'TypeScript: Typen und Funktionen', tag: 'Typen · Pfeilfunktion · ? : · ?? · ?.', xp: 60,
  doku: [['TypeScript in 5 Minuten', 'https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html'], ['Alltägliche Typen', 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html'], ['Pfeilfunktionen (MDN)', 'https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Functions/Arrow_functions']],
  ticket: { id: 'PW-162', typ: 'Feature', titel: 'Kleine Helfer für das Teamboard', text: 'Das Teamboard braucht drei kleine Helfer: die Größe eines Tickets, einen Anzeigenamen und die Stadt eines Kunden. Schreib sie in TypeScript, mit Typen.' },
  story: [
    ['toni', 'Ab jetzt schreibst du echten TypeScript-Code. TypeScript ist JavaScript mit Typen.'],
    ['du', 'Warum nicht einfach JavaScript?'],
    ['toni', 'Weil der Compiler dann Fehler findet, bevor ein Kunde sie sieht. Und weil Angular selbst in TypeScript geschrieben ist.']
  ],
  slides: [
    { t: 'Variablen mit Typ', say: 'Eine Variable ist eine Box mit Namen. In TypeScript klebt ein Etikett daran: Was darf hinein?',
      job: 'Oft musst du den Typ nicht hinschreiben. TypeScript sieht ihn am Wert: const name = \'Leon\' ist automatisch ein string. Bei Parametern von Funktionen schreibst du ihn aber immer hin.',
      code: C`
let tickets: number = 3;
const name: string = 'Leon';
const fertig: boolean = false;
const team: string[] = ['Leon', 'Mo'];
const chef: string | null = null;

tickets = 4;        // geht
tickets = 'viele';  // Fehler: das ist kein number`,
      notes: [['let tickets: number', 'let ist eine Box, deren Inhalt sich ändern darf. „: number“ ist das Etikett: nur Zahlen.'], ['const name: string', 'const ist eine Box mit festem Inhalt. string ist Text in Anführungszeichen.'], ['boolean', 'boolean heißt: nur true oder false.'], ['string[]', 'Die eckigen Klammern heißen: eine Liste von Texten.'], ['string | null', 'Der Strich heißt „oder“: ein Text oder null, also nichts.'], ["tickets = 'viele'", 'Hier meckert der Compiler sofort. Genau dafür gibt es Typen.']],
      pro: 'Die Typen gibt es nur beim Bauen. Im Browser läuft normales JavaScript ohne Etiketten. Für Objekte mit festen Feldern gibt es eine eigene Vorlage, das interface. Das kommt im Kapitel „Saubere Profile“.' },
    { t: 'Funktion und Pfeilfunktion', say: 'Eine Funktion: etwas rein, etwas raus. Die Pfeilfunktion ist die Kurzform davon.',
      job: 'Pfeilfunktionen siehst du in Angular überall: tickets.update(t => t + 1), liste.filter(e => e.aktiv). Lies den Pfeil als „wird zu“.',
      code: C`
function doppelt(stunden: number): number {
  return stunden * 2;
}

const doppelt2 = (stunden: number): number => stunden * 2;

const gross = ['leon', 'mo'].map(n => n.toUpperCase());
// ['LEON', 'MO']`,
      notes: [['function doppelt', 'Die klassische Form: Name, Parameter mit Typ in Klammern, dahinter der Typ des Ergebnisses.'], ['return stunden', 'return gibt das Ergebnis zurück.'], ['const doppelt2', 'Dieselbe Funktion als Pfeilfunktion. Links vom Pfeil die Parameter, rechts das Ergebnis. Ohne { } braucht sie kein return.'], ['n => n.toUpperCase()', 'Lies: „nimm n, gib n in Großbuchstaben zurück“. Der Name n ist frei gewählt.']],
      pro: 'Mit { } darf eine Pfeilfunktion mehrere Zeilen haben, braucht dann aber return: (a: number) => { const b = a * 2; return b; }. Funktionen mit export und Texte mit ${ } kommen im Kapitel „Das erste Ticket“.' },
    { t: 'Kurz entscheiden: ? :, ?? und ?.', say: 'Drei kurze Zeichen, die du in Angular ständig liest. Alle drei haben ein Fragezeichen.',
      job: 'Im Template steht oft {{ kunde()?.name ?? \'Gast\' }}. Lies es so: Gibt es einen Kunden, nimm seinen Namen. Sonst Gast.',
      code: C`
const groesse = stunden > 8 ? 'groß' : 'klein';

const anzeige = name ?? 'Unbekannt';

const stadt = kunde.adresse?.stadt;`,
      notes: [["? 'groß' :", 'Ternary: Bedingung ? Wert wenn ja : Wert wenn nein. Ein kurzes if und else in einer Zeile.'], ["?? 'Unbekannt'", 'Ist name null oder undefined, nimm Unbekannt. Sonst nimm name.'], ['?.stadt', 'Optional Chaining: Fehlt adresse, kommt undefined heraus statt eines Absturzes.']],
      pro: 'Anders als || behält ?? auch 0 und leeren Text. tickets || 5 macht aus 0 eine 5, tickets ?? 5 lässt die 0 stehen. Ternarys nie verschachteln, dann lieber ein if.' }
  ],
  quiz: [
    { q: 'Was gibt <code>const f = (x: number) => x * 3;</code> beim Aufruf <code>f(2)</code> zurück?', options: ['2', '6', 'Den Text x * 3', 'Nichts, es fehlt return'], correct: 1, why: 'Ohne geschweifte Klammern gibt die Pfeilfunktion den Ausdruck rechts vom Pfeil direkt zurück: 2 mal 3.' },
    { q: "Was ergibt <code>stunden > 8 ? 'groß' : 'klein'</code>, wenn stunden 3 ist?", options: ['groß', 'klein', 'true', '3'], correct: 1, why: '3 > 8 ist falsch. Dann gilt der Wert hinter dem Doppelpunkt.' },
    { q: 'Was ergibt <code>kunde.adresse?.stadt</code>, wenn kunde keine adresse hat?', options: ['Einen Absturz mit Fehlermeldung', 'undefined', 'Einen leeren Text', 'Die Stadt Köln'], correct: 1, why: 'Das ?. hält an, wenn links nichts ist, und gibt undefined zurück. Ohne ? gäbe es einen Fehler.' },
    { q: 'Welchen Wert hat <code>anzahl ?? 5</code>, wenn anzahl 0 ist?', options: ['5', '0', 'undefined', 'null'], correct: 1, why: '?? springt nur bei null oder undefined ein. 0 ist eine echte Zahl und bleibt stehen.' }
  ],
  ex: { id: 'exb3', title: 'Drei kleine Helfer', goal: 'Schreib drei Helfer für das Teamboard. Jeder übt ein Zeichen: den Pfeil, ?? und ?.',
    todo: ['<code>groesse</code> ist eine Pfeilfunktion mit Typ: <code>(stunden: number)</code>. Mehr als 8 Stunden ergibt <b>groß</b>, sonst <b>klein</b>. Nimm <code>? :</code>', '<code>anzeigeName(null)</code> ergibt <b>Unbekannt</b>, sonst den Namen. Nimm <code>??</code>', '<code>stadtVon</code> stürzt ohne Adresse nicht ab und gibt dann <b>keine Angabe</b> zurück. Nimm <code>?.</code> und <code>??</code>'],
    starter: C`
// 1. Mehr als 8 Stunden: 'groß', sonst 'klein'. Gib stunden einen Typ.
export const groesse = (stunden) => '';

// 2. Der Name, oder 'Unbekannt', wenn name null ist.
export function anzeigeName(name: string | null): string {
  return '';
}

// 3. Die Stadt des Kunden. Fehlt die Adresse: 'keine Angabe'.
//    adresse? heißt: Dieses Feld darf fehlen.
export function stadtVon(kunde: { name: string; adresse?: { stadt: string } }): string {
  return kunde.adresse.stadt;
}
`,
    solution: C`
export const groesse = (stunden: number): string => stunden > 8 ? 'groß' : 'klein';

export function anzeigeName(name: string | null): string {
  return name ?? 'Unbekannt';
}

export function stadtVon(kunde: { name: string; adresse?: { stadt: string } }): string {
  return kunde.adresse?.stadt ?? 'keine Angabe';
}
`,
    notes: [['(stunden: number): string =>', 'Parameter mit Typ, dahinter der Typ des Ergebnisses, dann der Pfeil.'], ["? 'groß' : 'klein'", 'Mehr als 8? Dann groß, sonst klein.'], ["name ?? 'Unbekannt'", 'Nur bei null oder undefined springt Unbekannt ein.'], ['adresse?.stadt', 'Fehlt adresse, gibt es undefined statt Absturz. Dann greift ?? und liefert keine Angabe.']],
    hints: ['Typ am Parameter: <code>(stunden: number) =&gt; …</code>', "Entscheidung: <code>stunden &gt; 8 ? 'groß' : 'klein'</code>", "<code>return name ?? 'Unbekannt';</code>", "<code>return kunde.adresse?.stadt ?? 'keine Angabe';</code>"],
    tests: [
      { name: 'groesse hat einen Typ am Parameter', run: T => T.ok(/groesse\s*=\s*\(\s*stunden\s*:\s*number\s*\)/.test(T.code), 'Gib dem Parameter einen Typ: (stunden: number) => …') },
      { name: 'groesse entscheidet richtig', run: T => { const f = T.get('groesse'); T.eq([f(12), f(3), f(8)], ['groß', 'klein', 'klein'], 'Mehr als 8 ist groß. Genau 8 ist noch klein: Nimm > statt >=.'); } },
      { name: 'groesse nutzt ? :', run: T => T.ok(/[^?.]\?[^?.:]+:/.test(T.code.split(/export\s+function\s+anzeigeName/)[0]), 'Schreib die Entscheidung mit ? : in einer Zeile, ohne if.') },
      { name: 'anzeigeName mit und ohne Namen', run: T => { const f = T.get('anzeigeName'); T.eq([f('Leon'), f(null)], ['Leon', 'Unbekannt'], 'Mit Namen soll der Name kommen, bei null Unbekannt.'); } },
      { name: 'stadtVon mit Adresse', run: T => T.eq(T.get('stadtVon')({ name: 'Kaiser GmbH', adresse: { stadt: 'Köln' } }), 'Köln', 'Mit Adresse soll die Stadt kommen.') },
      { name: 'stadtVon ohne Adresse', run: T => {
        let r;
        try { r = T.get('stadtVon')({ name: 'Kaiser GmbH' }); } catch (e) { T.ok(false, 'Ohne adresse stürzt stadtVon ab. Mit ?. statt . gibt es undefined statt eines Absturzes.'); }
        T.eq(r, 'keine Angabe', "Ohne adresse soll keine Angabe kommen. Häng ?? 'keine Angabe' an.");
      } }
    ] },
  merke: ['name: string, tickets: number, fertig: boolean, team: string[].', '(x: number) => x * 2 heißt: nimm x, gib x mal 2 zurück.', 'a ? b : c = wenn a, dann b, sonst c.', 'a ?? b = a, außer a ist null/undefined. a?.b = kein Absturz, wenn a fehlt.']
},
{
  id: 'b04', akt: 'B', title: 'TypeScript: Klassen', tag: 'class · constructor · this · get · extends · abstract', xp: 60,
  doku: [['Klassen in TypeScript', 'https://www.typescriptlang.org/docs/handbook/2/classes.html'], ['Getter (MDN)', 'https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Functions/get']],
  ticket: { id: 'PW-163', typ: 'Feature', titel: 'Bugs und Features als Klassen', text: 'Im Teamboard gibt es zwei Arten von Aufgaben: Bugs und Features. Beide haben einen Titel und Stunden. Bau eine gemeinsame Vorlage als Klasse.' },
  story: [
    ['jonas', 'Im Backend haben wir Bugs und Features. Beide haben Titel und Stunden, aber im Board sehen sie verschieden aus.'],
    ['du', 'Also zweimal fast derselbe Code?'],
    ['toni', 'Nein. Eine Klasse als Bauplan, und Klassen, die darauf aufbauen. Jede Angular-Komponente ist übrigens auch so eine Klasse.']
  ],
  slides: [
    { t: 'Klasse = Bauplan', say: 'Eine Klasse ist ein Bauplan. Daraus baust du mit new beliebig viele Objekte. Jedes hat eigene Daten.',
      job: 'Jede Angular-Komponente und jeder Service ist eine Klasse. new schreibst du dort fast nie selbst: Angular baut die Objekte für dich.',
      code: C`
class Aufgabe {
  titel: string;
  stunden: number;

  constructor(titel: string, stunden: number) {
    this.titel = titel;
    this.stunden = stunden;
  }

  verdoppeln() {
    this.stunden = this.stunden * 2;
  }
}

const a = new Aufgabe('Login reparieren', 3);`,
      notes: [['class Aufgabe', 'Der Bauplan. Klassennamen schreibt man groß.'], ['titel: string', 'Ein Feld: Jedes Objekt aus diesem Bauplan hat einen eigenen titel.'], ['constructor', 'Läuft genau einmal, wenn ein neues Objekt gebaut wird. Hier bekommt es seine Startwerte.'], ['this.titel = titel', 'this heißt „ich selbst“: das Objekt, das gerade gebaut wird.'], ['verdoppeln()', 'Eine Methode: eine Funktion, die zur Klasse gehört.'], ['new Aufgabe(', 'new baut ein Objekt nach dem Bauplan und ruft dabei den constructor auf.']],
      pro: 'Es gibt eine Kurzform: constructor(public titel: string) {} legt das Feld an und setzt es gleich. In Angular holst du dir Services stattdessen meist mit inject(), das kommt im Kapitel „Das Backoffice“.' },
    { t: 'Getter: ein Feld, das rechnet', say: 'Ein Getter sieht von außen aus wie ein Feld. Innen ist er eine kleine Funktion, die den Wert bei jedem Lesen ausrechnet.',
      job: 'In älterem Angular-Code findest du oft get istLeer() { return this.liste.length === 0; }. In neuem Code macht das meist computed(), das lernst du in der Probezeit.',
      code: C`
class Aufgabe {
  titel = 'Login reparieren';
  stunden = 3;

  get kurz(): string {
    return \`\${this.titel} (\${this.stunden} h)\`;
  }
}

const a = new Aufgabe();
a.kurz;  // 'Login reparieren (3 h)'`,
      notes: [["titel = 'Login reparieren'", 'Ein Feld mit Startwert. Den Typ string erkennt TypeScript selbst.'], ['get kurz()', 'get macht aus einer Methode ein Feld, das bei jedem Lesen neu rechnet.'], ['return `', 'Backticks mit ${ } setzen Werte in einen Text ein. Genaueres im Kapitel „Das erste Ticket“.'], ['a.kurz;', 'Lesen ohne Klammern, wie ein normales Feld.']],
      pro: 'Zu get gehört manchmal ein set. Er läuft, wenn jemand dem Feld etwas zuweist. Einen Getter ohne set kann man nur lesen.' },
    { t: 'extends und abstract', say: 'Mit extends baut eine Klasse auf einer anderen auf und erbt alles. abstract heißt: Diese Klasse ist nur eine Vorlage zum Erben.',
      job: 'In Angular erbst du selten selbst. Du liest es aber in Bibliotheken und bei Services, die eine abstract class als Vertrag nutzen. Das kommt im Kapitel „Konfiguration an einer Stelle“.',
      code: C`
abstract class Aufgabe {
  titel: string;
  constructor(titel: string) {
    this.titel = titel;
  }
  abstract art(): string;
}

class Bug extends Aufgabe {
  art(): string {
    return 'Bug';
  }
}

const b = new Bug('Login kaputt');
b.titel;  // 'Login kaputt'
new Aufgabe('x');  // Fehler: Aufgabe ist abstract`,
      notes: [['abstract class', 'abstract heißt: nur Vorlage. Davon selbst baut man kein Objekt.'], ['abstract art()', 'Hier steht nur, DASS es art() gibt. Jede Klasse, die erbt, muss art() selbst schreiben.'], ['extends Aufgabe', 'Bug erbt alles von Aufgabe: Felder, constructor, Methoden.'], ["return 'Bug'", 'Bug füllt die Lücke art() aus.'], ['b.titel;', 'titel kommt geerbt aus Aufgabe.'], ["new Aufgabe('x')", 'Das geht nicht. Der Compiler meldet sofort einen Fehler.']],
      pro: 'Neben extends gibt es implements: Eine Klasse verspricht, ein interface zu erfüllen, erbt aber nichts. Beispiel: class Karte implements OnInit. Hat die erbende Klasse einen eigenen constructor, ruft sie darin zuerst super(…) auf, also den constructor der Eltern-Klasse.' }
  ],
  quiz: [
    { q: 'Was macht der constructor einer Klasse?', options: ['Er löscht ein Objekt wieder', 'Er läuft einmal beim Bauen mit new und setzt die Startwerte', 'Er läuft bei jedem Lesen eines Felds', 'Er macht die Klasse zur Angular-Komponente'], correct: 1, why: 'new baut das Objekt und ruft dabei genau einmal den constructor auf. Dort bekommen die Felder ihre Startwerte.' },
    { q: 'Eine Klasse hat <code>get kurz(): string</code>. Wie liest du den Wert bei einem Objekt a?', options: ['a.kurz()', 'a.kurz', 'a.get(kurz)', 'get a.kurz'], correct: 1, why: 'Ein Getter liest sich wie ein Feld, ohne Klammern. Die Rechnung passiert trotzdem bei jedem Lesen.' },
    { q: 'Was bedeutet <code>class Bug extends Aufgabe</code>?', options: ['Bug ist eine Kopie von Aufgabe, die nichts mehr mit ihr zu tun hat', 'Bug erbt alles von Aufgabe und kann Eigenes dazubauen', 'Bug ersetzt Aufgabe überall in der App', 'Aufgabe erbt alles von Bug'], correct: 1, why: 'extends heißt erben. Bug bekommt Felder, constructor und Methoden von Aufgabe.' },
    { q: 'Warum baust du von einer <code>abstract class</code> kein Objekt mit new?', options: ['Weil sie keine Felder haben darf', 'Weil sie nur eine Vorlage zum Erben ist, ihre Lücken füllen erst die erbenden Klassen', 'Weil abstract-Klassen nur auf dem Server laufen', 'Weil sie keinen constructor haben darf'], correct: 1, why: 'Eine abstract class darf Lücken wie abstract art() haben. Erst eine Klasse mit extends füllt sie, und davon baust du dann Objekte.' }
  ],
  ex: { id: 'exb4', title: 'Aufgaben als Klassen', goal: 'Bau die Vorlage Aufgabe fertig und leite die Klasse Bug davon ab.',
    todo: ['Im <code>constructor</code>: <code>this.titel</code> und <code>this.stunden</code> setzen', 'Getter <code>kurz</code> in Aufgabe: <b>Login reparieren (3 h)</b>', '<code>export class Bug extends Aufgabe</code> mit <code>art()</code>, die <b>Bug</b> zurückgibt'],
    starter: C`
export abstract class Aufgabe {
  titel: string;
  stunden: number;

  constructor(titel: string, stunden: number) {
    // Setz hier this.titel und this.stunden
  }

  // Getter kurz: 'Login reparieren (3 h)'

  abstract art(): string;
}

// export class Bug ...
`,
    solution: C`
export abstract class Aufgabe {
  titel: string;
  stunden: number;

  constructor(titel: string, stunden: number) {
    this.titel = titel;
    this.stunden = stunden;
  }

  get kurz(): string {
    return \`\${this.titel} (\${this.stunden} h)\`;
  }

  abstract art(): string;
}

export class Bug extends Aufgabe {
  art(): string {
    return 'Bug';
  }
}
`,
    notes: [['this.titel = titel', 'Das Objekt merkt sich den Titel, den new mitgibt.'], ['get kurz()', 'Ein Getter: von außen ein Feld, innen eine Rechnung.'], ['return `', 'Titel und Stunden in einen Text eingesetzt.'], ['extends Aufgabe', 'Bug erbt constructor, Felder und kurz.'], ["return 'Bug'", 'Bug füllt die Lücke art() aus der Vorlage.']],
    hints: ['Im constructor: <code>this.titel = titel;</code> und <code>this.stunden = stunden;</code>', 'Getter: <code>get kurz(): string { return `${this.titel} (${this.stunden} h)`; }</code>', "<code>export class Bug extends Aufgabe { art(): string { return 'Bug'; } }</code>"],
    tests: [
      { name: 'constructor setzt die Felder', run: T => { const b = new (T.get('Bug'))('Login reparieren', 3); T.eq([b.titel, b.stunden], ['Login reparieren', 3], 'Im constructor fehlt this.titel = titel oder this.stunden = stunden.'); } },
      { name: 'kurz ist ein Getter', run: T => { const d = Object.getOwnPropertyDescriptor(T.get('Aufgabe').prototype, 'kurz'); T.ok(d && typeof d.get === 'function', 'kurz soll ein Getter in Aufgabe sein: get kurz(): string { … }'); } },
      { name: 'kurz rechnet mit den Feldern', run: T => { const B = T.get('Bug'); T.eq([new B('Login reparieren', 3).kurz, new B('Export bauen', 5).kurz], ['Login reparieren (3 h)', 'Export bauen (5 h)'], 'kurz soll Titel und Stunden so zeigen: Login reparieren (3 h).'); } },
      { name: 'Bug erbt von Aufgabe', run: T => { const b = new (T.get('Bug'))('x', 1); T.ok(b instanceof T.get('Aufgabe'), 'Bug muss mit extends Aufgabe von Aufgabe erben.'); T.eq(b.art(), 'Bug', 'art() soll in Bug den Text Bug zurückgeben.'); } }
    ] },
  merke: ['class = Bauplan, new baut ein Objekt danach.', 'constructor setzt Startwerte, this ist das Objekt selbst.', 'get name() liest sich wie ein Feld und rechnet bei jedem Lesen.', 'extends erbt alles. abstract = nur Vorlage, Lücken füllen die Erben.']
},
{
  id: 'b05', akt: 'B', title: 'TypeScript: Listen und Objekte', tag: 'map · filter · reduce · Spread · Destrukturierung', xp: 70,
  doku: [['Array-Methoden (MDN)', 'https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array'], ['Spread-Syntax (MDN)', 'https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Operators/Spread_syntax'], ['Destrukturierung (MDN)', 'https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Operators/Destructuring']],
  ticket: { id: 'PW-164', typ: 'Feature', titel: 'Zahlen für das Sprint-Board', text: 'Sara will im Sprint-Board sehen, was offen ist und wie viele Stunden es insgesamt sind. Und sie will Tickets abhaken, ohne die alte Liste kaputtzumachen.' },
  story: [
    ['sara', 'Ich brauche für das Board drei Dinge: was offen ist, wie viele Stunden insgesamt, und erledigt abhaken.'],
    ['toni', 'Das sind die Werkzeuge, die du in Angular am häufigsten brauchst: map, filter, reduce und Kopien mit drei Punkten.'],
    ['du', 'Drei Punkte? Ich dachte, das ist ein Platzhalter.'],
    ['toni', 'In echtem Code nie. Gleich siehst du, was sie tun.']
  ],
  slides: [
    { t: 'map und filter', say: 'map verwandelt jedes Element einer Liste. filter siebt Elemente aus. Beide geben eine neue Liste zurück, die alte bleibt, wie sie ist.',
      job: 'Im Template zeigst du oft nur einen Teil einer Liste: offene Tickets, aktive Nutzer. In Angular steckt das meist in einem computed(), innen arbeitet genau dieses filter.',
      code: C`
const tickets = [
  { titel: 'Login', stunden: 3, erledigt: true },
  { titel: 'Export', stunden: 5, erledigt: false },
];

const titel = tickets.map(t => t.titel);
// ['Login', 'Export']

const offen = tickets.filter(t => !t.erledigt);
// nur das Export-Ticket`,
      notes: [['const tickets = [', 'Eine Liste (Array) mit zwei Objekten. Jedes Objekt hat Felder in geschweiften Klammern.'], ['map(t => t.titel)', 'map macht aus jedem Element etwas Neues. Hier: aus jedem Ticket seinen Titel.'], ['filter(t => !t.erledigt)', 'filter behält nur, wofür die Pfeilfunktion true ergibt. Das ! dreht true und false um.']],
      pro: 'Weitere Helfer: find (das erste passende Element), some (passt mindestens eins?), every (passen alle?), includes (ist es drin?).' },
    { t: 'reduce: alles zu einem Wert', say: 'reduce macht aus einer ganzen Liste einen einzigen Wert, zum Beispiel eine Summe.',
      job: 'Summe im Warenkorb, Stunden im Sprint, Punkte im Ranking: Das ist fast immer reduce.',
      code: C`
const summe = tickets.reduce(
  (zwischen, t) => zwischen + t.stunden,
  0
);
// Runde 1: 0 + 3 = 3
// Runde 2: 3 + 5 = 8`,
      notes: [['tickets.reduce(', 'reduce geht die Liste durch und sammelt alles in einem einzigen Wert.'], ['(zwischen, t)', 'zwischen ist das Ergebnis bis hierhin, t das aktuelle Ticket. Was rechts vom Pfeil herauskommt, ist das neue zwischen.'], ['  0', 'Der Startwert für zwischen. Hier 0, weil wir Stunden zusammenzählen.'], ['Runde 2', 'Nach dem letzten Ticket ist zwischen die Summe: 8.']],
      pro: 'reduce kann auch Objekte bauen, zum Beispiel Tickets nach Status zählen. Wird es unübersichtlich, ist eine for-Schleife oft leichter zu lesen. Beides ist erlaubt.' },
    { t: 'Spread: Kopie mit drei Punkten', say: 'Die drei Punkte heißen Spread. Sie packen eine Liste oder ein Objekt aus. So baust du eine Kopie mit Änderung, und das Original bleibt gleich.',
      job: 'Signals in Angular wollen eine NEUE Liste, keine geänderte alte: liste.update(l => [...l, neu]). Das siehst du in der ersten Woche wieder.',
      code: C`
const liste = ['Login', 'Export'];
const neu = [...liste, 'Suche'];
// ['Login', 'Export', 'Suche'], liste bleibt gleich

const ticket = { titel: 'Login', erledigt: false };
const fertig = { ...ticket, erledigt: true };
// { titel: 'Login', erledigt: true }`,
      notes: [["[...liste, 'Suche']", 'Die drei Punkte packen die alte Liste aus. Dahinter kommt das Neue. Ergebnis: eine neue Liste.'], ['liste bleibt gleich', 'Das Original wird nicht verändert.'], ['{ ...ticket, erledigt: true }', 'Bei Objekten genauso: alle Felder kopieren, dann erledigt überschreiben.']],
      pro: 'Spread kopiert nur eine Ebene tief. Steckt in ticket ein weiteres Objekt, teilen sich Original und Kopie dieses innere Objekt. Für tiefe Kopien gibt es structuredClone().' },
    { t: 'Destrukturierung: auspacken in Namen', say: 'Destrukturierung packt Felder aus einem Objekt oder Elemente aus einer Liste direkt in eigene Variablen.',
      job: 'In RxJS liest du oft ([a, b]) => …, wenn zwei Werte gleichzeitig ankommen. Das ist genau so eine Liste, direkt ausgepackt.',
      code: C`
const ticket = { titel: 'Login', stunden: 3 };
const { titel, stunden } = ticket;
// titel ist 'Login', stunden ist 3

const [erster, zweiter] = ['Leon', 'Mo'];
// erster ist 'Leon', zweiter ist 'Mo'

const zeige = ({ titel }: { titel: string }) => titel;`,
      notes: [['const { titel, stunden } = ticket', 'Geschweifte Klammern links: Hol die Felder titel und stunden aus dem Objekt, als eigene Variablen.'], ['const [erster, zweiter]', 'Eckige Klammern links: Hol die Elemente nach ihrer Position aus der Liste.'], ['({ titel }', 'Das geht auch direkt bei Parametern. Die Funktion bekommt ein Objekt und packt titel sofort aus.']],
      pro: 'Umbenennen geht mit Doppelpunkt: const { titel: name } = ticket. Einen Standardwert setzt du mit =: const { stunden = 1 } = ticket.' }
  ],
  quiz: [
    { q: 'Was ergibt <code>[1, 2, 3].map(x => x * 10)</code>?', options: ['[10, 20, 30]', '60', '[1, 2, 3]', '[1, 2, 3, 10]'], correct: 0, why: 'map wendet die Pfeilfunktion auf jedes Element an und gibt eine neue Liste zurück.' },
    { q: 'Was ergibt <code>[3, 5].reduce((s, x) => s + x, 0)</code>?', options: ['[3, 5]', '8', '0', '35'], correct: 1, why: 'Start bei 0, dann 0 + 3 = 3, dann 3 + 5 = 8.' },
    { q: "Was passiert bei <code>const neu = [...liste, 'Suche']</code> mit der alten liste?", options: ['Sie bekommt Suche hinten angehängt', 'Sie bleibt unverändert, neu ist eine neue Liste', 'Sie wird gelöscht', 'Sie wird zu einem Objekt'], correct: 1, why: 'Spread packt die alte Liste in eine neue aus. Das Original bleibt, wie es war.' },
    { q: "Welche Werte haben a und b nach <code>const [a, b] = ['Leon', 'Mo']</code>?", options: ['a ist Leon, b ist Mo', 'a und b sind beide die ganze Liste', 'a ist 0, b ist 1', 'a ist Mo, b ist Leon'], correct: 0, why: 'Eckige Klammern links packen die Elemente nach Position aus: das erste nach a, das zweite nach b.' }
  ],
  ex: { id: 'exb5', title: 'Das Sprint-Board', goal: 'Schreib fünf kleine Helfer für Saras Sprint-Board. Keiner davon darf die Liste oder das Ticket verändern, das er bekommt.',
    todo: ['<code>offeneTitel</code>: die Titel aller offenen Tickets (<code>filter</code>, dann <code>map</code>)', '<code>summeStunden</code>: alle Stunden zusammen (<code>reduce</code>, Startwert 0)', '<code>mitNeuem</code>: eine neue Liste mit dem neuen Ticket hinten dran (<code>[...liste, neu]</code>)', '<code>alsErledigt</code>: eine Kopie mit <code>erledigt: true</code> (<code>{ ...t, … }</code>)', '<code>zeile</code>: <b>Login: 3 h</b>, mit <code>const { titel, stunden } = t</code>'],
    starter: C`
// Vorlage für ein Ticket. interface erklärt das Kapitel „Saubere Profile“ genauer.
export interface Ticket {
  titel: string;
  stunden: number;
  erledigt: boolean;
}

// 1. Titel aller offenen Tickets
export function offeneTitel(liste: Ticket[]): string[] {
  return [];
}

// 2. Summe aller Stunden
export function summeStunden(liste: Ticket[]): number {
  return 0;
}

// 3. Neue Liste mit neu hinten dran. liste selbst bleibt gleich.
export function mitNeuem(liste: Ticket[], neu: Ticket): Ticket[] {
  liste.push(neu);
  return liste;
}

// 4. Kopie von t mit erledigt: true. t selbst bleibt gleich.
export function alsErledigt(t: Ticket): Ticket {
  t.erledigt = true;
  return t;
}

// 5. 'Login: 3 h'
export function zeile(t: Ticket): string {
  return '';
}
`,
    solution: C`
export interface Ticket {
  titel: string;
  stunden: number;
  erledigt: boolean;
}

export function offeneTitel(liste: Ticket[]): string[] {
  return liste.filter(t => !t.erledigt).map(t => t.titel);
}

export function summeStunden(liste: Ticket[]): number {
  return liste.reduce((summe, t) => summe + t.stunden, 0);
}

export function mitNeuem(liste: Ticket[], neu: Ticket): Ticket[] {
  return [...liste, neu];
}

export function alsErledigt(t: Ticket): Ticket {
  return { ...t, erledigt: true };
}

export function zeile(t: Ticket): string {
  const { titel, stunden } = t;
  return \`\${titel}: \${stunden} h\`;
}
`,
    notes: [['filter(t => !t.erledigt)', 'Erst nur die offenen behalten, dann mit map die Titel nehmen.'], ['reduce((summe, t)', 'summe wächst mit jedem Ticket. Startwert 0.'], ['[...liste, neu]', 'Neue Liste: alle alten, dann das neue. push hätte das Original verändert.'], ['{ ...t, erledigt: true }', 'Neues Objekt: alle Felder von t, erledigt überschrieben.'], ['const { titel, stunden } = t', 'Beide Felder als eigene Variablen ausgepackt.']],
    hints: ['<code>return liste.filter(t =&gt; !t.erledigt).map(t =&gt; t.titel);</code>', '<code>return liste.reduce((summe, t) =&gt; summe + t.stunden, 0);</code>', '<code>return [...liste, neu];</code> und <code>return { ...t, erledigt: true };</code>', '<code>const { titel, stunden } = t;</code> dann <code>return `${titel}: ${stunden} h`;</code>'],
    tests: [
      { name: 'offeneTitel', run: T => T.eq(T.get('offeneTitel')([{ titel: 'Login', stunden: 3, erledigt: true }, { titel: 'Export', stunden: 5, erledigt: false }, { titel: 'Suche', stunden: 2, erledigt: false }]), ['Export', 'Suche'], 'Erwartet nur die Titel der offenen Tickets. Filterst du mit !t.erledigt und nimmst dann map?') },
      { name: 'summeStunden', run: T => { const f = T.get('summeStunden'); T.eq(f([{ titel: 'A', stunden: 3, erledigt: true }, { titel: 'B', stunden: 5, erledigt: false }, { titel: 'C', stunden: 2, erledigt: false }]), 10, '3 + 5 + 2 sind 10.'); T.eq(f([]), 0, 'Bei einer leeren Liste soll 0 herauskommen. Hast du den Startwert 0 bei reduce?'); } },
      { name: 'mitNeuem lässt die alte Liste in Ruhe', run: T => {
        const alt = [{ titel: 'Login', stunden: 3, erledigt: false }], r = T.get('mitNeuem')(alt, { titel: 'Suche', stunden: 2, erledigt: false });
        T.eq(r.map(t => t.titel), ['Login', 'Suche'], 'Die neue Liste soll erst die alten, dann das neue Ticket haben.');
        T.eq(alt.length, 1, 'Die alte Liste hat sich verändert. Nimm [...liste, neu] statt push.');
      } },
      { name: 'alsErledigt macht eine Kopie', run: T => {
        const t = { titel: 'Export', stunden: 5, erledigt: false }, r = T.get('alsErledigt')(t);
        T.eq([r.titel, r.stunden, r.erledigt], ['Export', 5, true], 'Die Kopie soll alle Felder behalten und erledigt: true haben.');
        T.eq(t.erledigt, false, 'Das Original hat sich verändert. Nimm { ...t, erledigt: true }.');
      } },
      { name: 'zeile mit Destrukturierung', run: T => {
        T.eq(T.get('zeile')({ titel: 'Login', stunden: 3, erledigt: true }), 'Login: 3 h', 'Erwartet Login: 3 h. Achte auf Doppelpunkt und Leerzeichen.');
        T.ok(/\{\s*(titel\s*,\s*stunden|stunden\s*,\s*titel)\s*\}\s*[=:]/.test(T.code), 'Pack die Felder mit const { titel, stunden } = t; aus.');
      } }
    ] },
  merke: ['map verwandelt jedes Element, filter siebt aus. Beide geben eine neue Liste.', 'reduce((zwischen, x) => …, start) macht aus einer Liste einen Wert.', '[...liste, neu] und { ...obj, feld: wert } = Kopie mit Änderung.', 'const { a } = obj und const [x, y] = liste packen aus.']
},
{
  id: 'b06', akt: 'B', title: 'TypeScript: Warten können', tag: 'Promise · async · await · try/catch', xp: 60,
  doku: [['Promises verwenden (MDN)', 'https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Using_promises'], ['async function (MDN)', 'https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Statements/async_function']],
  ticket: { id: 'PW-165', typ: 'Feature', titel: 'Team vom Server laden', text: 'Das Teamboard soll die Namen vom Server holen. Der Server antwortet nicht sofort, und manchmal gar nicht. Beides muss klappen.' },
  story: [
    ['jonas', 'Meine API liefert die Teamliste. Das dauert aber ein paar Millisekunden, und manchmal ist sie auch ganz weg.'],
    ['du', 'Und was macht mein Code, während er wartet?'],
    ['toni', 'Er blockiert nichts. Dafür gibt es Promises und async/await.']
  ],
  slides: [
    { t: 'Promise: ein Versprechen auf später', say: 'Manches dauert: eine Antwort vom Server, ein Timer. Ein Promise steht für einen Wert, der erst später kommt. Oder für einen Fehler.',
      job: 'fetch(), viele Bibliotheken und Browser-Funktionen geben Promises zurück. Für HTTP nimmst du in Angular meist Observables. Die kommen in der Phase „Erstes Kundenprojekt“.',
      code: C`
const antwort: Promise<string[]> = api.teamLaden();

antwort
  .then(namen => console.log(namen))
  .catch(fehler => console.log('Kaputt', fehler));

console.log('Ich warte nicht!');`,
      notes: [['Promise<string[]>', 'Ein Promise ist ein Versprechen: Später kommt eine Liste von Texten. Oder ein Fehler.'], ['.then(', 'Wenn das Ergebnis da ist, läuft diese Funktion.'], ['.catch(', 'Wenn etwas schiefgeht, läuft diese.'], ["'Ich warte nicht!'", 'Läuft sofort, noch BEVOR die Antwort da ist. Der Code bleibt nicht stehen.']],
      pro: 'Ein Promise hat drei Zustände: pending (wartet), fulfilled (Wert ist da) und rejected (Fehler). Es wechselt nur einmal und bleibt dann so.' },
    { t: 'async und await: Warten wie im Text', say: 'Mit async und await liest sich Warten wie normaler Code von oben nach unten. try und catch fangen Fehler ab.',
      job: 'Ohne catch sieht der Nutzer bei einem Server-Fehler einfach nichts. Im Review fragt Toni deshalb immer: Was passiert, wenn der Server nicht antwortet?',
      code: C`
async function teamZeigen(): Promise<string> {
  try {
    const namen = await api.teamLaden();
    return namen.join(', ');
  } catch (fehler) {
    return 'Server nicht erreichbar';
  }
}`,
      notes: [['async function', 'async heißt: Diese Funktion darf warten. Sie gibt selbst immer ein Promise zurück.'], ['await api', 'Warte hier, bis das Promise fertig ist, und nimm sein Ergebnis.'], ["join(', ')", 'Macht aus der Liste einen Text, mit Komma dazwischen.'], ['catch (fehler)', 'Geht das Promise schief, springt der Code hierher, statt abzustürzen.']],
      pro: 'await geht nur in einer async-Funktion. Mehrere Dinge gleichzeitig laden: await Promise.all([a(), b()]). Das wartet, bis alle fertig sind.' },
    { t: 'Wer wartet, blockiert nicht', say: 'JavaScript macht eins nach dem anderen. Wartet es auf den Server, macht es solange etwas anderes.',
      job: 'Wie das genau abläuft, zeigt das Kapitel „Die Event Loop“ in der Phase „Wie das Web funktioniert“.',
      punkte: [['Sofort', 'Normaler Code läuft Zeile für Zeile.', ''], ['Später', 'then und alles hinter await laufen erst, wenn die Antwort da ist.', ''], ['Nie blockiert', 'Während des Wartens kann der Nutzer weiter klicken und scrollen.', 'plus'], ['Ohne catch', 'Ein Fehler geht verloren oder landet rot in der Konsole. Der Nutzer erfährt nichts.', 'minus']],
      pro: 'Darum zeigen Apps Ladeanzeigen: Die Seite läuft weiter, während das Promise noch wartet.' }
  ],
  quiz: [
    { q: 'Was ist ein Promise?', options: ['Ein Wert, der erst später kommt, oder ein Fehler', 'Eine Funktion, die nie fertig wird', 'Ein anderes Wort für eine Liste', 'Ein Typ nur für Zahlen'], correct: 0, why: 'Ein Promise verspricht ein Ergebnis für später. Kommt es nicht, meldet es einen Fehler.' },
    { q: "Ein Promise ist erst später fertig. Im Code steht zuerst <code>promise.then(() => console.log('B'))</code>, danach <code>console.log('A')</code>. Was erscheint zuerst in der Konsole?", options: ['B', 'A', 'Beides gleichzeitig', 'Nur B, A fällt weg'], correct: 1, why: 'Der Code wartet nicht auf das Promise. A kommt sofort, B erst, wenn das Ergebnis da ist.' },
    { q: 'Wozu brauchst du in einer async-Funktion try und catch?', options: ['Damit sie schneller läuft', 'Damit ein Fehler beim Warten aufgefangen wird und du reagieren kannst', 'Damit await überhaupt funktioniert', 'Damit die Funktion kein Promise zurückgibt'], correct: 1, why: 'Schlägt das Promise hinter await fehl, springt der Code in catch. Dort zeigst du zum Beispiel eine Meldung.' }
  ],
  ex: { id: 'exb6', title: 'Das Team laden', goal: 'Lade die Teamliste über die API und bau daraus einen Text. Geht etwas schief, kommt eine freundliche Meldung.',
    todo: ['<code>teamText</code> ist <code>async</code> und holt die Namen mit <code>await api()</code>', 'Ergebnis: <b>Leon, Mo (2)</b>, also die Namen mit Komma und dahinter die Anzahl', 'Schlägt <code>api()</code> fehl: <b>Server nicht erreichbar</b> (mit <code>try</code> und <code>catch</code>)'],
    starter: C`
// api ist eine Funktion, die ein Promise mit Namen liefert.
// Beispiel: await api() ergibt ['Leon', 'Mo']

export async function teamText(api: () => Promise<string[]>): Promise<string> {
  // 1. Namen mit await holen
  // 2. Ergebnis: 'Leon, Mo (2)'
  // 3. Fehler auffangen: 'Server nicht erreichbar'
  return '';
}
`,
    solution: C`
export async function teamText(api: () => Promise<string[]>): Promise<string> {
  try {
    const namen = await api();
    return \`\${namen.join(', ')} (\${namen.length})\`;
  } catch (fehler) {
    return 'Server nicht erreichbar';
  }
}
`,
    notes: [['async function', 'async: Die Funktion darf warten und gibt ein Promise zurück.'], ['try {', 'Alles hier drin wird bewacht.'], ['await api()', 'Wartet auf die Liste vom Server.'], ['namen.length', 'Die Anzahl der Namen.'], ['catch (fehler)', 'Schlägt api() fehl, landet der Code hier.']],
    hints: ['<code>const namen = await api();</code>', "Text: <code>`${namen.join(', ')} (${namen.length})`</code>", "Um alles herum: <code>try { … } catch (fehler) { return 'Server nicht erreichbar'; }</code>"],
    tests: [
      { name: 'teamText gibt ein Promise zurück', run: async T => { const r = T.get('teamText')(() => Promise.resolve(['Leon'])); T.ok(r && typeof r.then === 'function', 'teamText soll async sein und damit ein Promise zurückgeben.'); await r; } },
      { name: 'Namen und Anzahl', run: async T => T.eq(await T.get('teamText')(() => Promise.resolve(['Leon', 'Mo'])), 'Leon, Mo (2)', "Erwartet Leon, Mo (2). Hast du await vor api() und join(', ')?") },
      { name: 'Wartet wirklich auf die Antwort', run: async T => T.eq(await T.get('teamText')(() => new Promise(fertig => setTimeout(() => fertig(['Ada', 'Ben', 'Cem']), 30))), 'Ada, Ben, Cem (3)', 'Die Antwort kommt hier erst nach kurzer Zeit. Wartest du mit await auf api()?') },
      { name: 'Fehler wird aufgefangen', run: async T => {
        let r;
        try { r = await T.get('teamText')(() => Promise.reject(new Error('offline'))); } catch (e) { T.ok(false, 'Der Fehler fliegt aus teamText heraus. Fang ihn mit try { … } catch (fehler) { … } ab.'); }
        T.eq(r, 'Server nicht erreichbar', 'Bei einem Fehler soll Server nicht erreichbar kommen.');
      } }
    ] },
  merke: ['Promise = Wert für später, oder ein Fehler.', 'async function darf warten und gibt ein Promise zurück.', 'await wartet auf ein Promise und gibt sein Ergebnis.', 'try/catch fängt Fehler beim Warten ab. Immer an den Fehlerfall denken.']
},
{
  id: 'b07', akt: 'B', title: 'Die Werkbank', tag: 'Terminal · npm · ng · git · DevTools', xp: 60,
  doku: [['Angular lokal einrichten', 'https://angular.dev/tools/cli/setup-local'], ['Angular DevTools', 'https://angular.dev/tools/devtools'], ['Git-Buch auf Deutsch', 'https://git-scm.com/book/de/v2']],
  ticket: { id: 'PW-166', typ: 'Onboarding', titel: 'Die Werkbank einrichten', text: 'Richte deinen Rechner ein: Terminal, Node, npm, Angular CLI, Git und die DevTools im Browser. Schreib dir danach einen kleinen Helfer für die Git-Befehle.' },
  story: [
    ['erz', 'Mittwoch. Dein Laptop ist frisch eingerichtet, aber noch leer.'],
    ['toni', 'Bevor du ein echtes Projekt anfasst, brauchst du deine Werkbank. Das Terminal ist das wichtigste Werkzeug darauf.'],
    ['du', 'Das schwarze Fenster, in das man Befehle tippt? Davor hab ich ehrlich gesagt Respekt.'],
    ['toni', 'Musst du nicht. Am Anfang sind es nur eine Handvoll Befehle.']
  ],
  slides: [
    { t: 'Das Terminal: Befehle statt Klicks', say: 'Im Terminal tippst du Befehle, statt zu klicken. Du bist dabei immer in genau einem Ordner, wie in einem Dateifenster.',
      job: 'Fast jedes Werkzeug für Angular startest du im Terminal: npm, ng, git. In VS Code öffnest du es über das Menü Terminal, Neues Terminal.',
      code: C`
pwd
# /Users/du

ls
# Desktop  Dokumente  projekte

cd projekte
cd ..`,
      notes: [['pwd', 'Wo bin ich gerade? Zeigt den aktuellen Ordner (print working directory).'], ['ls', 'Was liegt hier? Listet Dateien und Ordner auf.'], ['cd projekte', 'Wechsle in den Ordner projekte (change directory).'], ['cd ..', 'Zwei Punkte heißen: einen Ordner nach oben.']],
      pro: 'Die Tab-Taste vervollständigt Namen. Pfeil nach oben holt den letzten Befehl zurück. Unter Windows nimmst du am besten PowerShell, dort gehen cd, ls und pwd auch.' },
    { t: 'Node und npm', say: 'Node lässt JavaScript außerhalb des Browsers laufen. Alle Werkzeuge für Angular brauchen es. npm ist sein Paket-Manager: Er lädt fremden Code, den dein Projekt braucht.',
      job: 'Klappt nach dem Klonen gar nichts, ist der erste Schritt fast immer: node -v prüfen, dann npm install. Wie package.json und Versionen genau funktionieren, lernst du im Kapitel „npm & Dependencies“.',
      code: C`
node -v
# v22.12.0

npm install
npm start`,
      notes: [['node -v', 'Zeigt, welche Node-Version installiert ist.'], ['v22', 'Für Angular 22 brauchst du eine aktuelle Node-Version. Welche genau, steht auf angular.dev unter Versions.'], ['npm install', 'Lädt alle Pakete aus der package.json in den Ordner node_modules. Einmal nach dem Klonen.'], ['npm start', 'Startet das Skript start aus der package.json. In Angular-Projekten ist das meist ng serve.']],
      pro: 'Mehrere Projekte mit verschiedenen Node-Versionen? Dafür gibt es Versions-Manager wie nvm oder fnm.' },
    { t: 'Die Angular CLI: ng', say: 'Die Angular CLI ist das Werkzeug für alles rund um Angular: Projekt anlegen, starten, bauen, Bausteine erzeugen. Ihr Befehl heißt ng.',
      job: 'Im Team startest du ein Projekt meist mit npm start statt ng serve. Beides macht dasselbe, npm start nimmt aber sicher die Version aus dem Projekt.',
      code: C`
npm install -g @angular/cli
ng version

ng new teamboard
cd teamboard
ng serve
# läuft auf http://localhost:4200`,
      notes: [['npm install -g', 'Installiert die Angular CLI einmal für den ganzen Rechner. -g heißt global.'], ['ng version', 'Zeigt, welche Angular-Version die CLI hat.'], ['ng new teamboard', 'Legt ein neues Projekt im Ordner teamboard an. Die CLI stellt ein paar Fragen, die Vorschläge passen.'], ['ng serve', 'Baut die App und startet einen kleinen Server. Speicherst du eine Datei, lädt der Browser neu.'], ['localhost:4200', 'Diese Adresse öffnest du im Browser. localhost heißt: dein eigener Rechner.']],
      pro: 'Weitere Befehle: ng generate component name legt eine Komponente an, ng build baut für den Server, ng test startet die Tests. Einen Überblick über alles, was die CLI kann, gibt das Kapitel „Was ist alles dabei?“ in der Phase „Fest im Team“.' },
    { t: 'Git: Schnappschüsse deines Codes', say: 'Git speichert Schnappschüsse deines Codes. So kommst du jederzeit zurück, und das ganze Team arbeitet am selben Projekt.',
      job: 'Bei jedem Ticket läuft es gleich: git status, git add, git commit, git push. Danach stellst du einen Pull Request, damit Toni drüberschaut.',
      code: C`
git clone https://github.com/pixelwerk/teamboard.git
git status
git add .
git commit -m "Begrüßung eingebaut"
git push`,
      notes: [['git clone', 'Holt ein Projekt mit seinem ganzen Verlauf auf deinen Rechner.'], ['git status', 'Was hat sich geändert? Rot ist noch nicht vorgemerkt, grün ist vorgemerkt.'], ['git add .', 'Merkt alle Änderungen für den nächsten Schnappschuss vor. Der Punkt heißt: alles in diesem Ordner.'], ['git commit -m', 'Macht den Schnappschuss, mit einer kurzen Nachricht, was du getan hast.'], ['git push', 'Lädt deine Schnappschüsse hoch, damit das Team sie sieht.']],
      pro: 'In Firmen arbeitest du fast immer auf einem eigenen Branch: git switch -c ticket-114. So bleibt der Hauptzweig sauber, bis dein Pull Request durch ist. Ein echtes Projekt mit Git baust du im Kapitel „Dein eigenes Projekt“.' },
    { t: 'DevTools: dem Browser unter die Haube schauen', say: 'Mit F12 (Mac: Cmd + Option + I) öffnest du die Entwicklerwerkzeuge des Browsers. Damit schaust du einer laufenden Seite unter die Haube.',
      job: 'Meldet Mia einen Bug, gehst du immer gleich vor: Console auf Fehler prüfen, Network auf rote Anfragen, dann ein Breakpoint an der verdächtigen Stelle.',
      punkte: [['Console', 'Fehlermeldungen in Rot und alles aus console.log. Der erste Blick bei jedem Bug.', ''], ['Elements', 'Das echte HTML und CSS der Seite, live. Hier siehst du auch das Box-Modell.', ''], ['Network', 'Jede Anfrage an den Server, mit Statuscode und Antwort. Zeigt dir, ob der Server überhaupt geantwortet hat.', ''], ['Sources und Breakpoint', 'Klick auf eine Zeilennummer setzt einen Breakpoint. Der Code hält dort an, und du siehst alle Werte.', ''], ['Angular DevTools', 'Eine Browser-Erweiterung vom Angular-Team. Zeigt den Komponenten-Baum mit Inputs und Signals.', '']],
      pro: 'Statt in Sources zu klicken, kannst du auch debugger; in deinen Code schreiben. Bei offenen DevTools hält der Browser genau dort an. Vor dem Commit wieder rausnehmen.' }
  ],
  quiz: [
    { q: 'Mit welchem Befehl wechselst du im Terminal in den Ordner projekte?', options: ['ls projekte', 'cd projekte', 'pwd projekte', 'git projekte'], correct: 1, why: 'cd heißt change directory: Ordner wechseln. ls listet nur auf, pwd zeigt, wo du bist.' },
    { q: 'Du hast ein Angular-Projekt gerade geklont. Was machst du als Erstes, damit es startet?', options: ['ng new', 'npm install, dann npm start', 'git push', 'Nichts, es läuft sofort'], correct: 1, why: 'Nach dem Klonen fehlen die Pakete. npm install lädt sie, npm start startet die App.' },
    { q: 'In welcher Reihenfolge lädst du eine Änderung mit Git hoch?', options: ['git push, git add, git commit', 'git add, git commit, git push', 'git commit, git push, git add', 'git clone, dann git push'], correct: 1, why: 'Erst vormerken (add), dann den Schnappschuss machen (commit), dann hochladen (push).' },
    { q: 'Im Teamboard erscheint eine Liste nicht. In welchem Tab der DevTools siehst du, ob die Anfrage an den Server geklappt hat?', options: ['Elements', 'Network', 'Angular DevTools', 'Keiner, das sieht man nur auf dem Server'], correct: 1, why: 'Network zeigt jede Anfrage mit Statuscode und Antwort. So siehst du sofort, ob der Server geantwortet hat.' }
  ],
  ex: { id: 'exb7', title: 'Dein Werkbank-Helfer', goal: 'Schreib zwei kleine Helfer: einen, der die Git-Befehle zum Hochladen zusammensetzt, und einen, der die Ausgabe von <code>node -v</code> prüft. In der README des Teamboards steht: Node 22 oder neuer.',
    todo: ['<code>hochladen("Begrüßung eingebaut")</code> gibt drei Befehle zurück: <code>git add .</code>, <code>git commit -m "Begrüßung eingebaut"</code>, <code>git push</code>', '<code>nodeReicht("v22.12.0")</code> ergibt <code>true</code>, <code>nodeReicht("v20.19.0")</code> ergibt <code>false</code>', 'Vorsicht: <code>"v8.17.0"</code> ist kleiner als <code>"v22.0.0"</code>. Vergleich Zahlen, nicht Texte'],
    starter: C`
// Die drei Befehle in der richtigen Reihenfolge, als Liste von Texten
export function hochladen(nachricht: string): string[] {
  return [];
}

// "v22.12.0" → Hauptversion 22. Ab 22 reicht es.
// replace('v', '') entfernt das v, split('.') zerlegt am Punkt, Number() macht eine Zahl daraus.
export function nodeReicht(ausgabe: string): boolean {
  return false;
}
`,
    solution: C`
export function hochladen(nachricht: string): string[] {
  return ['git add .', \`git commit -m "\${nachricht}"\`, 'git push'];
}

export function nodeReicht(ausgabe: string): boolean {
  const haupt = Number(ausgabe.replace('v', '').split('.')[0]);
  return haupt >= 22;
}
`,
    notes: [["'git add .'", 'Erst alles vormerken.'], ['git commit -m', 'Dann der Schnappschuss. Die Nachricht steht in Anführungszeichen.'], ["'git push'", 'Zum Schluss hochladen.'], ["split('.')[0]", 'Aus "22.12.0" wird ["22", "12", "0"]. [0] nimmt das erste Stück.'], ['Number(', 'Macht aus dem Text "22" die Zahl 22. Erst dann vergleicht >= richtig.']],
    hints: ['Eine Liste mit drei Texten: <code>[\'git add .\', …, \'git push\']</code>', 'Die Nachricht einsetzen: <code>`git commit -m "${nachricht}"`</code>', "<code>const haupt = Number(ausgabe.replace('v', '').split('.')[0]);</code> dann <code>return haupt &gt;= 22;</code>"],
    tests: [
      { name: 'hochladen: drei Befehle in Reihenfolge', run: T => T.eq(T.get('hochladen')('Begrüßung eingebaut'), ['git add .', 'git commit -m "Begrüßung eingebaut"', 'git push'], 'Erwartet drei Texte in dieser Reihenfolge: add, commit, push.') },
      { name: 'hochladen: klappt mit jeder Nachricht', run: T => T.eq(T.get('hochladen')('Bug gefixt')[1], 'git commit -m "Bug gefixt"', 'Steht die Nachricht fest drin? Setz nachricht mit ${nachricht} ein.') },
      { name: 'nodeReicht: neue Versionen', run: T => { const f = T.get('nodeReicht'); T.eq([f('v22.12.0'), f('v24.1.0')], [true, true], 'Ab Version 22 soll true kommen.'); } },
      { name: 'nodeReicht: alte Versionen', run: T => { const f = T.get('nodeReicht'); T.eq([f('v18.20.4'), f('v20.19.0')], [false, false], 'Unter Version 22 soll false kommen.'); } },
      { name: 'nodeReicht: Zahlen, nicht Texte', run: T => { const f = T.get('nodeReicht'); T.eq([f('v8.17.0'), f('v100.0.0')], [false, true], 'Als Text verglichen wäre "8" größer als "22". Mach mit Number() eine Zahl daraus.'); } }
    ] },
  merke: ['Terminal: pwd = wo bin ich, ls = was liegt hier, cd = Ordner wechseln.', 'node -v prüfen, npm install, npm start.', 'ng new legt an, ng serve startet auf localhost:4200.', 'Git: status, add, commit, push. DevTools: Console, Elements, Network, Breakpoint.']
}
);
