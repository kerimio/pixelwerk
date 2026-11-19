/* ================= REVIEW-SCHULE: Inhalte =================
   Review-Methodik zum Üben (Oberfläche in review-schule.js). Jede Station:
     merk:   das Wichtigste in max. 4 Zeilen (Spickzettel)
     runden: Übungsblöcke
       { typ: 'sort',  frage, buckets: [{ id, label }], karten: [{ text, code?, b: id | [ids], warum }] }
       { typ: 'wahl',  frage, items: [{ lage, code?, opts: [{ t, ok, warum }] }] }
       { typ: 'schreib', aufgaben: [...] }   (nur Kommentar-Werkstatt, siehe RS_WERKSTATT)
   Quellen: Google Engineering Practices (google.github.io/eng-practices/review), conventionalcomments.org,
   SmartBear-Studie bei Cisco (200–400 Zeilen, max. 60–90 Minuten am Stück). */

const RS_STATIONS = [
{
  id: 'ablauf', icon: '🧭', heading: 'Der Ablauf', short: 'In welcher Reihenfolge du einen PR liest',
  memo: [
    '<b>Durchgang 1: Überblick (5 Min.)</b> Ticket lesen, CI grün?, Dateiliste, passt der Ansatz? Noch keine Zeilen-Kommentare.',
    '<b>Durchgang 2: Tiefe.</b> Erst die Tests, dann die Kern-Logik. Prüfreihenfolge: korrekt → sicher → Lecks → Zustand → lesbar → schnell.',
    '<b>Durchgang 3: Abschluss.</b> Kommentare nach Schwere sortieren, Zusammenfassung, Entscheidung.',
    'Wer bei Zeile 1 anfängt, kommentiert Namen und merkt nicht, dass der ganze Ansatz schief ist.'
  ],
  rounds: [{
    category: 'sort', frage: 'In welchen Durchgang deines Reviews gehört dieser Schritt?',
    buckets: [{ id: 'd1', label: '1 · Überblick' }, { id: 'd2', label: '2 · Tiefe' }, { id: 'd3', label: '3 · Abschluss' }, { id: 'nie', label: 'Gar nicht' }],
    cards: [
      { text: 'Ticket und PR-Beschreibung lesen: Was soll der PR können?', b: 'd1', reasonWhy: 'Ohne Ziel kannst du nur beurteilen, ob der Code hübsch ist. Nicht, ob er das Richtige tut.' },
      { text: 'Schauen, ob die CI grün ist (Lint, Tests, Build)', b: 'd1', reasonWhy: 'Rote CI? Dann nicht tief einsteigen. Kurz Bescheid geben und wiederkommen, wenn sie grün ist.' },
      { text: 'Dateiliste überfliegen: Wo ist der Kern, was ist Beiwerk?', b: 'd1', reasonWhy: 'So weißt du, wohin deine Konzentration gehört. Lockfiles und generierter Code fressen sonst deine Energie.' },
      { text: 'Passt der Ansatz überhaupt? Richtige Stelle, gibt es so etwas schon?', b: 'd1', reasonWhy: 'Die teuerste Erkenntnis. Kommt sie erst nach 30 Zeilen-Kommentaren, war alles umsonst. Früh sagen, am besten kurz persönlich.' },
      { text: 'Die Tests lesen: Welche Fälle deckt der Autor ab, welche fehlen?', b: 'd2', reasonWhy: 'Tests sind die Spezifikation. Fehlt der Fehlerfall im Test, fehlt er oft auch im Code.' },
      { text: 'Kern-Logik Zeile für Zeile: leere Liste, null, Fehlerfall, Doppelklick', b: 'd2', reasonWhy: 'Hier sitzen die Bugs. Randfälle sind das, was der Autor beim „läuft bei mir“ nicht ausprobiert hat.' },
      { text: 'Sicherheit prüfen: innerHTML, Geheimnisse, Rechte, Nutzereingaben', b: 'd2', reasonWhy: 'Gleich nach „korrekt“. Eine Lücke im main ist teurer als jeder Bug.' },
      { text: 'Lecks prüfen: Endet jedes subscribe, jeder Timer, jeder Listener?', b: 'd2', reasonWhy: 'Der Klassiker in Angular-Reviews. Frag bei jedem Stream: Wann hört der auf?' },
      { text: 'Kommentare nach Schwere sortieren, Doppelte zusammenfassen', b: 'd3', reasonWhy: 'Zehn Nits und ein versteckter Blocker: Der Blocker geht unter. Den Blocker oben in der Zusammenfassung nennen.' },
      { text: 'Zusammenfassung schreiben: Was ist gut, was muss vor dem Merge passieren?', b: 'd3', reasonWhy: 'Ein Satz Lob plus „Vor dem Merge: X und Y. Der Rest ist optional.“ Dann weiß der Autor genau, was zu tun ist.' },
      { text: 'Entscheiden: Approve, Request changes oder nur Comment', b: 'd3', reasonWhy: 'Approve mit Nits ist völlig okay („LGTM, Nits gern später“). Request changes nur bei echten Mussern.' },
      { text: 'Einrückung und fehlende Semikolons kommentieren', b: 'nie', reasonWhy: 'Macht der Formatter (Prettier) und der Linter. Fällt es trotzdem auf: Regel in die Config, nicht in den Kommentar.' },
      { text: 'Aufschreiben, wie du es selbst gelöst hättest, obwohl der Weg des Autors auch gut ist', b: 'nie', reasonWhy: 'Geschmack ist kein Review-Grund. Korrekt, lesbar, passt zum Team-Stil? Durchlassen. Höchstens als „thought (non-blocking)“.' }
    ]
  }]
},
{
  id: 'schwere', icon: '🚦', heading: 'Schweregrade', short: 'Was blockiert den Merge, was ist egal?',
  memo: [
    '<b>Muss:</b> blockiert den Merge. Bug, Sicherheit, Datenverlust, Leck.',
    '<b>Sollte:</b> wichtig, aber kein Weltuntergang. Wartbarkeit, fehlender Test, Performance.',
    '<b>Nit:</b> Kleinigkeit, Geschmack. Blockiert nie. <b>Frage:</b> Du bist nicht sicher. <b>Lob:</b> Gutes konkret benennen.',
    'Und manches gehört gar nicht ins Review: Formatierung, persönlicher Geschmack.'
  ],
  rounds: [{
    category: 'sort', frage: 'Im PR fällt dir auf, was auf der Karte steht. Wie markierst du deinen Kommentar dazu?',
    buckets: [{ id: 'muss', label: 'Muss' }, { id: 'sollte', label: 'Sollte' }, { id: 'nit', label: 'Nit' }, { id: 'frage', label: 'Frage' }, { id: 'lob', label: 'Lob' }, { id: 'nix', label: 'Gar nicht' }],
    cards: [
      { text: 'Der geheime API-Schlüssel des Zahlungsanbieters steht in environment.ts', b: 'muss', reasonWhy: 'Alles im Frontend landet im Bundle, jeder kann es lesen. Und den Schlüssel sofort rotieren, er ist ja schon im Git-Verlauf.' },
      { text: 'interval(5000).subscribe(…) im ngOnInit, ohne takeUntilDestroyed', b: 'muss', reasonWhy: 'Speicherleck: Jeder Seitenbesuch startet ein Abo mehr, keines hört auf. Das merkt man erst nach Stunden, dann ist die App zäh.' },
      { text: 'Beim Doppelklick auf „Ticket kaufen“ werden zwei Bestellungen angelegt', b: 'muss', reasonWhy: 'Kaputtes Verhalten mit Geld. exhaustMap oder Button sperren, bis die Antwort da ist.' },
      { text: 'Die Variable heißt d statt projekte', b: 'nit', reasonWhy: 'Lesbarkeit, aber kein Bug. Als Nit markieren, damit niemand denkt, du blockierst deswegen.' },
      { text: 'Neue Bezahl-Funktion, aber kein einziger Test', b: ['sollte', 'muss'], reasonWhy: 'Mindestens Sollte. Viele Teams machen bei Geld und Login ein Muss daraus. Beides ist vertretbar, wichtig ist, dass du es ansprichst.' },
      { text: 'track $index in einer Liste, die gefiltert wird', b: 'sollte', reasonWhy: 'Angular verwendet beim Filtern DOM-Elemente für die falschen Einträge wieder (Fokus, Zustand springt). Kein Datenverlust, aber ein echter Fehler. track s.id.' },
      { text: 'Eine Methode ist 120 Zeilen lang und macht Laden, Umrechnen und Anzeigen', b: 'sollte', reasonWhy: 'Schwer zu testen und zu ändern. Vorschlag: aufteilen. Blockiert aber nicht, wenn es korrekt ist.' },
      { text: 'Neue Abhängigkeit moment.js (rund 300 KB) nur für ein einziges Datumsformat', b: 'sollte', reasonWhy: 'Bundle-Größe ist Ladezeit. Die date-Pipe oder Intl.DateTimeFormat können das gratis.' },
      { text: 'Du verstehst nicht, warum hier setTimeout(() => …, 0) steht', b: 'frage', reasonWhy: 'Kann ein Hack gegen ExpressionChanged sein, oder es gibt einen Grund. Fragen statt unterstellen: „Wofür ist das setTimeout?“' },
      { text: 'Du weißt nicht, ob das Backend bei 404 eine leere Liste oder einen Fehler schickt', b: 'frage', reasonWhy: 'Wichtige Frage, weil davon die Fehlerbehandlung abhängt. Aber du weißt es nicht, also Frage, kein Muss.' },
      { text: 'Der Autor hat Tests für leere Liste und Netzwerkfehler geschrieben', b: 'lob', reasonWhy: 'Konkretes Lob verstärkt genau das Verhalten, das du öfter sehen willst. Und es macht deine kritischen Kommentare leichter verdaulich.' },
      { text: 'Doppelter Zustand wurde durch ein computed ersetzt', b: 'lob', reasonWhy: 'Gute Entscheidung, sag das. „Schön, mit computed kann das nicht mehr auseinanderlaufen.“' },
      { text: 'Zwei Leerzeilen statt einer zwischen zwei Methoden', b: 'nix', reasonWhy: 'Formatter-Job. Wenn es euch stört: Prettier-Regel, kein Kommentar.' },
      { text: 'Du hättest statt filter().map() lieber ein reduce genommen', b: ['nix', 'nit'], reasonWhy: 'Reiner Geschmack. filter().map() ist sogar lesbarer. Weglassen, oder höchstens als klar markierter Nit.' }
    ]
  }]
},
{
  id: 'comments', icon: '🏷️', heading: 'Kommentare, die ankommen', short: 'Conventional Comments und der richtige Ton',
  memo: [
    '<b>Formel:</b> label (deko): Was. Warum. Vorschlag.',
    '<b>Labels:</b> praise, nitpick, suggestion, issue, question, thought. <b>Deko:</b> (blocking) oder (non-blocking).',
    'Über den Code reden, nicht über die Person: „Dieser Aufruf …“ statt „Du hast …“.',
    'Keine Wörter wie „einfach“, „offensichtlich“, „schlecht“. Wenn es einfach wäre, hätte es der Autor gemacht.'
  ],
  rounds: [{
    category: 'sort', frage: 'Welches Label passt zu diesem Kommentar?',
    buckets: [{ id: 'issue', label: 'issue' }, { id: 'suggestion', label: 'suggestion' }, { id: 'question', label: 'question' }, { id: 'nitpick', label: 'nitpick' }, { id: 'praise', label: 'praise' }, { id: 'thought', label: 'thought' }],
    cards: [
      { text: '„Das Passwort geht in der URL mit. Das landet in Server-Logs und im Browser-Verlauf. Bitte als POST-Body.“', b: 'issue', reasonWhy: 'Ein konkretes Problem, das behoben werden muss. issue, und hier sogar (blocking).' },
      { text: '„Bei schnellem Tippen kann eine alte Antwort die neue überschreiben. switchMap statt mergeMap löst das.“', b: 'issue', reasonWhy: 'Echter Bug (Race Condition) mit Lösung. issue (blocking).' },
      { text: '„Der Test für den leeren Warenkorb ist super, genau den Fall hätte ich vergessen.“', b: 'praise', reasonWhy: 'Konkretes Lob. Nicht nur „nice“, sondern was genau gut ist.' },
      { text: '„Wird ladeEntwickler() auch aufgerufen, wenn man über den Zurück-Button kommt?“', b: 'question', reasonWhy: 'Du weißt es nicht. Eine echte Frage, keine versteckte Kritik.' },
      { text: '„gefiltert könnte ein computed sein. Dann sparen wir die zweite Kopie und die Sync-Logik.“', b: 'suggestion', reasonWhy: 'Ein Verbesserungsvorschlag mit Begründung. Der Code funktioniert auch so.' },
      { text: '„Hast du dir httpResource angeschaut? Dann bekommst du Ladezustand und Fehler gratis.“', b: ['suggestion', 'question'], reasonWhy: 'Klingt wie eine Frage, ist aber ein Vorschlag. Beides okay, suggestion macht die Absicht klarer.' },
      { text: '„istAktiv statt aktivFlag liest sich etwas natürlicher.“', b: 'nitpick', reasonWhy: 'Geschmack bei Namen. nitpick, damit klar ist: Kann, muss nicht.' },
      { text: '„Langfristig könnten wir alle Formulare auf Signal Forms umziehen. Nichts für diesen PR.“', b: 'thought', reasonWhy: 'Ein Gedanke für später, ohne Handlungsdruck. thought trennt das sauber von dem, was jetzt zu tun ist.' }
    ]
  }, {
    category: 'wahl', frage: 'Welche Version des Kommentars schickst du ab?',
    items: [
      { situation: 'Ricky benutzt im neuen Service überall <code>any</code>.', opts: [
        { t: '„any?? Ernsthaft? 🙄“', ok: false, reasonWhy: 'Sarkasmus kommt schriftlich immer schlechter an als gemeint. Und es fehlt alles: warum und wie besser.' },
        { t: '„nitpick: Hier fehlen Typen.“', ok: false, reasonWhy: 'Zu dünn, und eher zu weich: Ohne Typen fallen Tippfehler erst beim Kunden auf.' },
        { t: '„suggestion: Für die Antwort von /api/entwickler ein Interface Entwickler anlegen? Dann fallen Tippfehler wie s.nmae schon beim Bauen auf, und wir haben Autocomplete.“', ok: true, reasonWhy: 'Was, warum, Vorschlag, freundlich als Frage formuliert. So lernt Ricky etwas.' },
        { t: '„Du schreibst immer any, das ist schlechter Stil.“', ok: false, reasonWhy: '„Du“ + „immer“ + „schlecht“: Das ist ein Urteil über die Person. Rede über den Code.' }
      ] },
      { situation: 'Lea (Senior, 10 Jahre dabei) speichert im PR den Login-Token in <code>localStorage</code>. Du bist neu und unsicher.', opts: [
        { t: 'Approve. Sie wird wissen, was sie tut.', ok: false, reasonWhy: 'Dann hat niemand reviewt. Seniors machen auch Fehler, und genau dafür gibt es Reviews.' },
        { t: '„question: Wäre ein HttpOnly-Cookie hier sicherer? localStorage kann bei einer XSS-Lücke ausgelesen werden. Oder gibt es einen Grund, den ich nicht kenne?“', ok: true, reasonWhy: 'Perfekt für unsicher: Du nennst das Risiko, bleibst offen und lernst dabei. Die meisten Seniors freuen sich über so eine Frage.' },
        { t: '„issue (blocking): Das ist eine Sicherheitslücke.“', ok: false, reasonWhy: 'Vielleicht stimmt es, aber ohne Begründung und ohne Vorschlag. Und du bist dir nicht sicher, also keine harte Behauptung.' },
        { t: 'Ihr privat schreiben und im PR nichts sagen', ok: false, reasonWhy: 'Privat vorfühlen ist okay, aber das Argument gehört in den PR. Sonst ist es nicht dokumentiert und andere lernen nichts.' }
      ] },
      { situation: 'Ein Name gefällt dir nicht: <code>handleClick()</code> statt <code>kaufen()</code>.', opts: [
        { t: '„issue (blocking): Name ist schlecht.“', ok: false, reasonWhy: 'Viel zu hart für Geschmack, und „schlecht“ ohne Begründung hilft niemandem.' },
        { t: '„nitpick (non-blocking): kaufen() statt handleClick()? Dann sieht man im Template sofort, was passiert.“', ok: true, reasonWhy: 'Klar als Kleinigkeit markiert, mit Grund. Der Autor kann es übernehmen oder lassen.' },
        { t: 'Gar nichts sagen', ok: false, reasonWhy: 'Geht, aber dann lernt niemand etwas. Ein klar markierter Nit kostet keinen etwas.' }
      ] },
      { situation: 'Jonas hat einen fiesen Doppelkauf-Bug mit <code>exhaustMap</code> elegant gelöst, inklusive Test.', opts: [
        { t: 'Approve ohne Kommentar', ok: false, reasonWhy: 'Verschenkt. Gute Arbeit ohne Rückmeldung fühlt sich an wie unsichtbar.' },
        { t: '„LGTM“', ok: false, reasonWhy: 'Okay, aber konkretes Lob zeigt, dass du es verstanden hast, und bestärkt genau dieses Muster im Team.' },
        { t: '„praise: exhaustMap ist hier genau richtig, damit ist der Doppelkauf endgültig weg. Und der Test mit dem Doppelklick 👌“', ok: true, reasonWhy: 'Konkret: was gut ist und warum. Solches Lob ist auch Wissenstransfer für alle, die den PR lesen.' }
      ] }
    ]
  }]
},
{
  id: 'werkstatt', icon: '✍️', heading: 'Kommentar-Werkstatt', short: 'Du schreibst selbst, Toni gibt Feedback',
  memo: [
    'Label + Schwere vorne: <code>issue (blocking):</code>, <code>suggestion:</code>, <code>nitpick:</code>, <code>question:</code>, <code>praise:</code>',
    '<b>Was</b> passiert in dieser Zeile? <b>Warum</b> ist das ein Problem (was passiert sonst)? <b>Vorschlag</b>, gern mit <code>Code</code>.',
    '1 bis 3 Sätze. Über den Code reden, nicht über die Person.'
  ],
  rounds: [{ category: 'schreib' }]
},
{
  id: 'gross', icon: '🐘', heading: 'Der Riesen-PR', short: '2.300 Zeilen, Freitag 16 Uhr. Was jetzt?',
  memo: [
    'Ab etwa 400 Zeilen und nach 60 Minuten am Stück findet man kaum noch Fehler (SmartBear-Studie bei Cisco).',
    'Zuerst fragen: Kann man das teilen? Refactoring, Feature und Umbenennungen getrennt.',
    'Wenn nicht: nach Risiko lesen. Kern-Logik, zentrale Stellen und Sicherheit genau, Generiertes überspringen.',
    'Nach 3 Runden Hin und Her: kurzer Call, Ergebnis als Kommentar in den PR.'
  ],
  rounds: [{
    category: 'sort', frage: 'PR #212 „Neuer Kundenportal“ (+2.340 / −410, 23 Dateien). Wie gehst du mit dieser Datei um?',
    buckets: [{ id: 'genau', label: '🔍 Genau lesen' }, { id: 'ueber', label: '👀 Überfliegen' }, { id: 'skip', label: '⏭️ Überspringen' }],
    cards: [
      { code: 'ticket-kauf.service.ts        +186  −12', b: 'genau', reasonWhy: 'Hier geht es um Geld. Kern-Logik, Fehlerfälle, Doppelklick: Zeile für Zeile.' },
      { code: 'ticket-kauf.service.spec.ts   +240', b: 'genau', reasonWhy: 'Am besten sogar zuerst lesen: Die Tests zeigen, was der Autor für richtig hält. Fehlende Fälle fallen hier sofort auf.' },
      { code: 'auth.interceptor.ts            +9   −3', b: 'genau', reasonWhy: 'Nur 12 Zeilen, aber betrifft jede Anfrage der App. Kleine Änderungen an zentralen Stellen sind die gefährlichsten.' },
      { code: 'app.routes.ts                  +6   −1', b: 'genau', reasonWhy: 'Neue Route: Ist sie lazy geladen? Hängt der richtige Guard dran? Schnell gelesen, aber genau.' },
      { code: 'package.json                   +3   −1', b: 'genau', reasonWhy: 'Drei Zeilen, aber eine neue Abhängigkeit ist eine Entscheidung: Größe, Lizenz, wird sie gepflegt? Genau anschauen.' },
      { code: 'package-lock.json          +1.204  −88', b: 'skip', reasonWhy: 'Generiert. Was wirklich neu ist, siehst du in package.json.' },
      { code: 'api/generated/tickets.api.ts   +612', b: 'skip', reasonWhy: 'Aus dem OpenAPI-Schema erzeugt. Wer hier etwas ändert, verliert es beim nächsten Generieren. Höchstens prüfen, dass es wirklich generiert ist.' },
      { code: 'kundenportal.component.html   +140  −60', b: ['ueber', 'genau'], reasonWhy: 'Gezielt überfliegen: track bei @for? Buttons statt klickbarer divs? Labels an Feldern? Nicht jede CSS-Klasse lesen.' },
      { code: 'kundenportal.component.scss   +210  −90', b: 'ueber', reasonWhy: 'Kurz schauen, ob etwas Globales überschrieben wird (::ng-deep, !important). Den Rest prüft man besser im Screenshot.' },
      { code: 'assets/i18n/de.json            +38', b: 'ueber', reasonWhy: 'Überfliegen nach Tippfehlern und fehlenden Übersetzungen. Kein Code.' },
      { code: 'assets/hero.png           (2,4 MB)', b: ['ueber', 'genau'], reasonWhy: 'Ein Blick reicht, aber genau dieser Blick zählt: 2,4 MB für ein Bild ruiniert die Ladezeit (LCP). Dateigröße ist ein Review-Punkt.' }
    ]
  }, {
    category: 'wahl', frage: 'Was tust du in dieser Situation?',
    items: [
      { situation: 'Freitag, 16 Uhr. Ricky: „PR mit 2.300 Zeilen, Release ist Montag, kannst du kurz drüberschauen?“', opts: [
        { t: 'Approve. Er hat Zeitdruck, und meistens geht es ja gut.', ok: false, reasonWhy: '„Kurz drüberschauen“ bei 2.300 Zeilen heißt: Niemand hat es gelesen. Wenn Montag doppelt verkauft wird, steht dein Approve drunter.' },
        { t: 'Ehrlich sagen, was geht: „Heute lese ich Kauf-Service und Interceptor genau, den Rest Montag früh. Fürs nächste Mal: in drei PRs teilen?“', ok: true, reasonWhy: 'Risiko zuerst, transparent, und ein konkreter Vorschlag für die Zukunft. So arbeiten Seniors.' },
        { t: 'Am Wochenende alles Zeile für Zeile lesen', ok: false, reasonWhy: 'Nach 60 Minuten am Stück findest du kaum noch etwas. Und Wochenend-Reviews sind kein Prozess, sondern ein Warnsignal.' },
        { t: '„Zu groß, mach kleiner.“ Und sonst nichts.', ok: false, reasonWhy: 'Richtige Richtung, aber ohne Hilfe. Schlag einen konkreten Schnitt vor und sag, was du trotzdem heute schaffst.' }
      ] },
      { situation: 'Ricky fragt: „Wie soll ich das denn teilen?“', opts: [
        { t: 'Nach Dateityp: erst alle HTML, dann alle TS, dann alle Tests', ok: false, reasonWhy: 'Dann ist kein Teil für sich lauffähig oder prüfbar. Man muss trotzdem alles im Kopf zusammensetzen.' },
        { t: '„1. API-Client + Interceptor. 2. Kauf-Service mit Tests. 3. Oberfläche hinter einem Feature-Flag.“', ok: true, reasonWhy: 'Jeder Teil ist für sich verständlich, testbar und mergebar. Das Flag erlaubt halbfertige Oberfläche im main, ohne dass Nutzer sie sehen.' },
        { t: 'Nach Commits: jeder Commit ein eigener PR', ok: false, reasonWhy: 'Commits sind oft „wip“ und „fix“. Der Schnitt muss nach Bedeutung gehen, nicht nach Uhrzeit.' }
      ] },
      { situation: 'Ihr diskutiert seit vier Kommentaren, ob der Warenkorb in einen Store gehört.', opts: [
        { t: 'Einen fünften, noch längeren Kommentar mit drei Links schreiben', ok: false, reasonWhy: 'Kommentar-Pingpong kostet Tage und Nerven. Schriftlich eskaliert so etwas schnell.' },
        { t: '10 Minuten Call. Das Ergebnis schreibt ihr als Kommentar in den PR.', ok: true, reasonWhy: 'Reden löst in Minuten, was schriftlich Tage dauert. Und der Kommentar hält die Entscheidung für später fest.' },
        { t: 'Nachgeben, damit Ruhe ist', ok: false, reasonWhy: 'Wenn es dir wichtig ist (Architektur!), nicht schlucken. Ist es Geschmack, ist „okay, dein Call“ völlig legitim, aber dann bewusst.' }
      ] }
    ]
  }]
},
{
  id: 'radar', icon: '📡', heading: 'Angular-Radar', short: 'Typische Angular-Stellen: passt oder Kommentar?',
  memo: [
    '<b>Endet es?</b> subscribe, interval, fromEvent: takeUntilDestroyed, toSignal oder async-Pipe. HTTP-Abos enden von selbst.',
    '<b>Stimmt der Zustand?</b> Signals per set/update neu setzen statt mutieren, computed statt Kopie, kein set() im effect.',
    '<b>Ist es sicher?</b> bypassSecurityTrust…, nativeElement.innerHTML. Guards sind Komfort, Schutz macht der Server.',
    '<b>Ist es schnell und modern?</b> track mit id, @defer, input()/inject(), keine teuren Methoden im Template.'
  ],
  rounds: [{
    category: 'sort', frage: 'Diese Zeile steht im PR. Lässt du sie durch oder schreibst du einen Kommentar?',
    buckets: [{ id: 'ok', label: '👍 Passt' }, { id: 'kom', label: '💬 Kommentar' }],
    cards: [
      { code: 'this.route.params.subscribe(p =>\n  this.http.get(`/api/entwickler/${p.id}`)\n    .subscribe(s => this.entwickler.set(s)));', b: 'kom', reasonWhy: 'Abo im Abo: Wechselt die Route schnell, kann die alte Antwort die neue überschreiben. Vorschlag: switchMap, oder gleich input() per withComponentInputBinding + httpResource.' },
      { code: '@for (s of entwickler(); track s.id) { … }', b: 'ok', reasonWhy: 'Genau richtig: track mit stabiler id.' },
      { code: 'effect(() => {\n  this.gesamt.set(this.preis() * this.anzahl());\n});', b: 'kom', reasonWhy: 'Abgeleiteter Wert per effect: unnötig und fehleranfällig. gesamt = computed(() => this.preis() * this.anzahl()).' },
      { code: 'private http = inject(HttpClient);', b: 'ok', reasonWhy: 'Moderner Standard, so soll es sein.' },
      { code: 'this.team.update(k => [...k, neu]);', b: 'ok', reasonWhy: 'Neues Array, das Signal merkt die Änderung. Richtig.' },
      { code: 'this.team().push(neu);', b: 'kom', reasonWhy: 'Mutiert das Array im Signal. Das Signal merkt nichts, die Oberfläche bleibt alt. update(k => [...k, neu]).' },
      { code: 'this.html = this.sanitizer\n  .bypassSecurityTrustHtml(kommentar.text);', b: 'kom', reasonWhy: 'kommentar.text kommt vom Nutzer: XSS-Lücke. Angular säubert [innerHTML] von selbst, bypass schaltet genau das ab. Muss raus.' },
      { code: '<p [innerHTML]="entwickler.bio"></p>', b: 'ok', reasonWhy: 'Falle! Angular säubert [innerHTML] automatisch und entfernt Skripte. Kein XSS, solange niemand bypassSecurityTrust benutzt.' },
      { code: 'fromEvent(window, \'resize\')\n  .subscribe(() => this.breite.set(innerWidth));', b: 'kom', reasonWhy: 'Globaler Listener ohne Ende: Leck bei jedem Besuch. .pipe(takeUntilDestroyed()) im Konstruktor, oder einmal zentral in einem Service.' },
      { code: 'speichern() {\n  this.http.post(\'/api/team\', this.team())\n    .subscribe(() => this.toast(\'Gespeichert\'));\n}', b: 'ok', reasonWhy: 'Falle! HTTP-Observables liefern einen Wert und sind fertig. Kein Leck, kein takeUntilDestroyed nötig.' },
      { code: 'readonly entwickler = toSignal(\n  this.api.entwickler$, { initialValue: [] });', b: 'ok', reasonWhy: 'Sauber: toSignal räumt das Abo selbst auf und liefert einen Startwert.' },
      { code: 'canActivate: [() => inject(Auth).istAdmin()]\n// schützt die Gehaltsdaten', b: 'kom', reasonWhy: 'Der Guard selbst ist okay, aber der Kommentar ist gefährlich: Ein Guard ist Komfort im Browser. Die Gehaltsdaten muss der Server schützen. Nachfragen, ob die API das prüft.' },
      { code: '@defer (on viewport) {\n  <app-kommentare />\n} @placeholder { <p>Kommentare …</p> }', b: 'ok', reasonWhy: 'Stark: Wird erst geladen, wenn man hinscrollt. Kleineres erstes Bundle.' },
      { code: 'ngAfterViewInit() {\n  setTimeout(() => this.cdr.detectChanges(), 100);\n}', b: 'kom', reasonWhy: 'Riecht nach Hack gegen ExpressionChanged oder Timing-Probleme. question: „Wofür das setTimeout?“ Meist ist Zustand an der falschen Stelle die echte Ursache.' },
      { code: 'interval(1000)\n  .pipe(takeUntilDestroyed())\n  .subscribe(() => this.tick());', b: 'ok', reasonWhy: 'Endet mit der Komponente. Achtung: takeUntilDestroyed() ohne Argument nur im Konstruktor oder Feld-Initialisierer.' },
      { code: '<td>{{ berechneMarktwert(s) }}</td>\n<!-- in einer Liste mit 500 Entwicklern -->', b: 'kom', reasonWhy: 'Läuft bei jeder Change Detection 500-mal. Bei einer langen Liste: vorher berechnen (computed) oder pure Pipe. Bei einem Einzelwert wäre es nur ein Nit.' },
      { code: 'entwickler = input.required<Entwickler>();\nname = computed(() => this.entwickler().name);', b: 'ok', reasonWhy: 'Modernes Angular: Signal-Input plus computed. Genau so.' }
    ]
  }]
},
{
  id: 'menschen', icon: '🤝', heading: 'Job-Situationen', short: 'Seniors reviewen, Streit, eigene PRs',
  memo: [
    'Google-Regel: Approve, sobald der PR den Code insgesamt besser macht, auch wenn er nicht perfekt ist.',
    'Antwort innerhalb eines Arbeitstags. Ein schnelles gutes Review schlägt ein perfektes nach drei Tagen.',
    'Juniors dürfen Seniors reviewen. Fragen sind der sicherste Einstieg.',
    'Als Autor: kleiner PR, Beschreibung mit Was/Warum/Wie testen, vorher selbst den Diff lesen.'
  ],
  rounds: [{
    category: 'wahl', frage: 'Wie reagierst du in dieser Situation?',
    items: [
      { situation: 'Du bist seit drei Monaten im Team. Lea (Senior) hat dich als Reviewer eingetragen.', opts: [
        { t: 'Approve, wird schon stimmen', ok: false, reasonWhy: 'Dann ist dein Name unter Code, den du nicht gelesen hast. Lea hat dich eingetragen, weil sie ein echtes Review will.' },
        { t: 'Ganz normal reviewen. Was du nicht verstehst, als question.', ok: true, reasonWhy: 'Genau so. Deine Fragen zeigen oft, wo Code unklar ist, und du lernst dabei in einer Stunde mehr als in einem Tutorial.' },
        { t: '„Bin noch zu junior dafür“', ok: false, reasonWhy: 'Reviews sind der schnellste Weg, Seniors einzuholen. Wer nie reviewt, lernt nie, Code anderer zu lesen.' }
      ] },
      { situation: 'Marco merged seinen PR, obwohl dein <code>issue (blocking)</code> zum Token im Log noch offen ist.', opts: [
        { t: 'Den Merge ohne Absprache reverten', ok: false, reasonWhy: 'Eskaliert sofort und kann Kolleginnen den Stand zerschießen. Erst reden.' },
        { t: 'Im Team-Channel öffentlich darauf hinweisen, dass er Reviews ignoriert', ok: false, reasonWhy: 'Öffentlich bloßstellen zerstört Vertrauen. Inhalt öffentlich, Kritik am Verhalten unter vier Augen.' },
        { t: 'Ihn direkt ansprechen: „Hast du meinen Kommentar zum Token gesehen? Lass uns kurz draufschauen.“ Passiert das öfter: Branch-Schutz im Team vorschlagen.', ok: true, reasonWhy: 'Sache klären, Person respektieren, und das Problem strukturell lösen statt jedes Mal neu zu streiten.' },
        { t: 'Nichts tun, ist ja jetzt drin', ok: false, reasonWhy: 'Der Token landet weiter im Log. Ein Sicherheitsproblem wird nicht kleiner, weil es gemergt ist.' }
      ] },
      { situation: 'Ricky antwortet auf deinen Kommentar: „Ist doch Geschmackssache.“', opts: [
        { t: 'Ehrlich prüfen: Ist es Geschmack, dann „stimmt, dein Call“ und auflösen. Wenn nicht, das Warum konkret machen (Bug, Leck, Team-Regel).', ok: true, reasonWhy: 'Manchmal hat der Autor recht. Und wenn nicht, überzeugt ein konkretes „sonst passiert X“ mehr als Beharren.' },
        { t: 'Darauf bestehen, du bist schließlich der Reviewer', ok: false, reasonWhy: 'Reviewer ist keine Machtposition. Ohne Begründung ist Beharren nur Sturheit.' },
        { t: 'Sofort den Teamlead einschalten', ok: false, reasonWhy: 'Zu früh. Erst selbst klären, im Zweifel kurzer Call. Teamlead erst, wenn es grundsätzlich wird.' }
      ] },
      { situation: 'Dein eigener PR bekommt 14 Kommentare von Lea. Du fühlst dich mies.', opts: [
        { t: 'Jeden Kommentar verteidigen', ok: false, reasonWhy: 'Wirkt, als ginge es um dich statt um den Code. Wähl die zwei Punkte, bei denen du wirklich anderer Meinung bist.' },
        { t: 'Danke sagen, Klares fixen und mit „erledigt in a1b2c3“ antworten, bei Unklarem nachfragen. Danach: Welches Muster steckt dahinter?', ok: true, reasonWhy: '14 Kommentare heißen: Jemand hat sich eine Stunde Zeit für dich genommen. Das Muster dahinter ist deine nächste Lernlektion.' },
        { t: 'Alles kommentarlos umsetzen, auch was du für falsch hältst', ok: false, reasonWhy: 'Wenn du anderer Meinung bist, sag es freundlich mit Grund. Reviews sind ein Gespräch, keine Befehlsliste.' }
      ] },
      { situation: 'Du hast drei offene Review-Anfragen und eigene Tickets. Die PRs liegen seit gestern.', opts: [
        { t: 'Erst eigene Tickets fertig machen, Reviews am Freitag gesammelt', ok: false, reasonWhy: 'Wartende PRs blockieren andere. Google-Faustregel: Antwort innerhalb eines Arbeitstags.' },
        { t: 'Feste Review-Zeiten: nach dem Daily und nach dem Mittag', ok: true, reasonWhy: 'Reviews kommen schnell zurück, und dein Fokus bleibt trotzdem in Blöcken geschützt.' },
        { t: 'Bei jeder Benachrichtigung sofort alles unterbrechen', ok: false, reasonWhy: 'Schnell, aber dein eigener Fokus ist weg. Feste Zeitfenster sind der Mittelweg.' }
      ] },
      { situation: 'Du bist selbst Autor. Wie machst du deinen PR leicht zu reviewen?', opts: [
        { t: 'Alles in einem PR, Beschreibung: „fixes stuff“', ok: false, reasonWhy: 'Damit zwingst du den Reviewer zum Raten. Ergebnis: langsames oder oberflächliches Review.' },
        { t: 'Klein halten, Beschreibung mit Was/Warum/Wie testen, Screenshot bei UI, und vorher selbst den Diff durchgehen', ok: true, reasonWhy: 'Selbst-Review findet die peinlichen Sachen (console.log, auskommentierter Code) bevor andere sie sehen. Und eine gute Beschreibung spart dem Reviewer Durchgang 1.' },
        { t: 'Reviewer bitten, alles lokal zu bauen, um es zu verstehen', ok: false, reasonWhy: 'Manchmal sinnvoll, aber kein Ersatz für eine Beschreibung. Der PR sollte sich selbst erklären.' }
      ] },
      { situation: 'Im Review entdeckst du einen Bug in einer Datei, die der PR gar nicht ändert.', opts: [
        { t: 'Request changes, bis der Autor das auch fixt', ok: false, reasonWhy: 'Scope Creep. Der PR wird nie fertig, und der Autor hat den Bug nicht gebaut.' },
        { t: 'Kurz erwähnen, Ticket anlegen, den PR nicht blockieren', ok: true, reasonWhy: 'Der Bug geht nicht verloren, und der PR bleibt bei seinem Thema.' },
        { t: 'Ignorieren, ist nicht mein PR', ok: false, reasonWhy: 'Gefunden ist gefunden. Ein Ticket kostet eine Minute.' }
      ] }
    ]
  }]
}
];

/* ---------- ✍️ Kommentar-Werkstatt ----------
   Du schreibst den Kommentar selbst. Offline-Check (ohne KI) prüft: Label passt zur Schwere, trifft das Problem (keys),
   Warum, Vorschlag bzw. Frage, Ton. sev: muss | sollte | nit | frage | lob. zeile: hervorgehobene Zeile (1-basiert). */
const RS_WORKSHOP = [
{
  id: 'w1', heading: 'Das ewige Abo', sev: 'muss', file: 'live-ticker.ts', codeLine: 6,
  situation: 'Der Live-Ticker lädt alle 10 Sekunden neu. Schreib den Kommentar zu Zeile 6.',
  code: C`
export class LiveTicker implements OnInit {
  private api = inject(TickerApi);
  meldungen = signal<Meldung[]>([]);

  ngOnInit() {
    interval(10_000).subscribe(() =>
      this.api.laden().subscribe(m => this.meldungen.set(m))
    );
  }
}`,
  keys: /interval|abo|subscri|leck|takeUntilDestroyed|destroy|beend|endet|aufhör|weiterl/i,
  keyTip: 'Nenn das eigentliche Problem: Das interval-Abo endet nie, auch nicht, wenn man die Seite verlässt.',
  pattern: 'issue (blocking): Das interval läuft weiter, wenn man die Seite verlässt. Bei jedem Besuch kommt ein Abo dazu, die App lädt im Hintergrund immer öfter. Vorschlag: `.pipe(takeUntilDestroyed(this.destroyRef))` vor das subscribe, oder gleich `httpResource` mit `reload()`.'
},
{
  id: 'w2', heading: 'Die schnelle Suche', sev: 'muss', file: 'entwickler-suche.ts', codeLine: 5,
  situation: 'Die Suche schickt bei jedem Tastendruck eine Anfrage. Manchmal zeigt sie Ergebnisse für „Le“ statt „Leon“.',
  code: C`
export class EntwicklerSuche {
  private api = inject(EntwicklerApi);
  suchbegriff = new FormControl('');
  treffer = toSignal(this.suchbegriff.valueChanges.pipe(
    mergeMap(q => this.api.suche(q ?? ''))
  ), { initialValue: [] });
}`,
  keys: /mergeMap|switchMap|reihenfolge|alte|veraltet|race|überschreib|später|zuletzt|überhol/i,
  keyTip: 'Der Kern: mergeMap lässt alle Anfragen parallel laufen, eine alte Antwort kann die neue überholen.',
  pattern: 'issue (blocking): mergeMap lässt alle Anfragen parallel laufen. Kommt die Antwort für „Le“ nach der für „Leon“, überschreibt sie die richtige. Vorschlag: `switchMap` bricht die alte Anfrage ab, dazu `debounceTime(300)` gegen Anfragen bei jedem Tastendruck.'
},
{
  id: 'w3', heading: 'Der neue Entwickler', sev: 'muss', file: 'team.service.ts', codeLine: 5,
  situation: 'Nach „Entwickler hinzufügen“ bleibt die Liste auf dem Bildschirm unverändert.',
  code: C`
export class TeamService {
  readonly team = signal<Entwickler[]>([]);

  hinzufuegen(neu: Entwickler) {
    this.team().push(neu);
  }
}`,
  keys: /push|mutier|verändert|neues array|neue liste|update|kopie|referenz|immutable|merkt/i,
  keyTip: 'Der Kern: push verändert das Array im Signal, aber das Signal merkt es nicht.',
  pattern: 'issue (blocking): `push` verändert das bestehende Array, das Signal bekommt keine neue Referenz und meldet nichts. Darum bleibt die Liste alt. Vorschlag: `this.team.update(k => [...k, neu])`.'
},
{
  id: 'w4', heading: 'Das rätselhafte setTimeout', sev: 'frage', file: 'rangliste.ts', codeLine: 6,
  situation: 'Du verstehst nicht, wofür das setTimeout in Zeile 6 da ist. Vielleicht hat es einen Grund.',
  code: C`
export class Rangliste implements AfterViewInit {
  offen = signal(false);
  @ViewChild('liste') liste!: ElementRef;

  ngAfterViewInit() {
    setTimeout(() => this.offen.set(true));
  }
}`,
  keys: /setTimeout|timeout|wofür|warum|wieso|grund|ExpressionChanged/i,
  keyTip: 'Sag, worauf sich deine Frage bezieht: das setTimeout.',
  pattern: 'question: Wofür ist das `setTimeout` hier? Falls es gegen `ExpressionChangedAfterItHasBeenChecked` hilft: Könnten wir `offen` gleich mit `true` starten oder im Template per `@defer` lösen? Dann bräuchten wir den Trick nicht.'
},
{
  id: 'w5', heading: 'Die kryptischen Namen', sev: 'nit', file: 'projektplan.ts', codeLine: 4,
  situation: 'Der Code funktioniert. Aber die Namen in Zeile 4 versteht niemand ohne Nachdenken.',
  code: C`
export class Projektplan {
  projekte = input.required<Projekt[]>();

  d = computed(() => this.projekte().filter(x => x.a));
}`,
  keys: /name|heißt|nenn|\bd\b|x\.a|lesbar|sprechend|versteh|aktiv/i,
  keyTip: 'Sag, welcher Name unklar ist (d, x.a) und wie er besser heißen könnte.',
  pattern: 'nitpick (non-blocking): `aktiveProjekte` statt `d`? Dann versteht man im Template sofort, was drin ist, ohne die Filter-Logik zu lesen. Falls `x.a` „aktiv“ heißt, wäre `projekt.aktiv` auch lesbarer.'
},
{
  id: 'w6', heading: 'Der starke Test', sev: 'lob', file: 'warenkorb.spec.ts', codeLine: 6,
  situation: 'Ricky hat einen Test für den Fehlerfall geschrieben. Das hast du bei ihm noch nie gesehen. Schreib ihm ein Lob, das ankommt.',
  code: C`
it('zeigt einen Fehler, wenn der Kauf fehlschlägt', () => {
  const http = TestBed.inject(HttpTestingController);
  fixture.componentInstance.kaufen();

  http.expectOne('/api/kauf')
    .flush('Fehler', { status: 500, statusText: 'Server Error' });
  fixture.detectChanges();

  expect(el.textContent).toContain('Kauf fehlgeschlagen');
  expect(warenkorb.anzahl()).toBe(2);
});`,
  keys: /fehler|500|fehlschl|fehlerfall|warenkorb|anzahl|bleibt|flush|kauf/i,
  keyTip: 'Lob wirkt, wenn es konkret ist: Was genau ist an dem Test gut?',
  pattern: 'praise: Stark, dass du den Fehlerfall testest, und besonders der Check, dass der Warenkorb bei einem 500er erhalten bleibt. Genau so ein Bug würde sonst erst beim Black-Friday-Ansturm auffallen.'
},
{
  id: 'w7', heading: 'Der hübsche Kommentar', sev: 'muss', file: 'kommentar.ts', codeLine: 8,
  situation: 'Kunden können unter Konzertberichten kommentieren. Ricky wollte, dass Fett und Links funktionieren.',
  code: C`
@Component({
  selector: 'app-kommentar',
  template: \`<div [innerHTML]="html"></div>\`,
})
export class Kommentar {
  private sanitizer = inject(DomSanitizer);
  @Input() set text(t: string) {
    this.html = this.sanitizer.bypassSecurityTrustHtml(t);
  }
  html!: SafeHtml;
}`,
  keys: /bypass|xss|sanitiz|säuber|skript|script|html|sicher|unsicher|angreif/i,
  keyTip: 'Der Kern: bypassSecurityTrustHtml mit Nutzertext schaltet Angulars XSS-Schutz ab.',
  pattern: 'issue (blocking): `bypassSecurityTrustHtml` mit Text von Kunden schaltet Angulars XSS-Schutz ab. Ein Kommentar mit `<img src=x onerror=…>` läuft dann bei allen Lesern. Vorschlag: bypass weglassen, `[innerHTML]` säubert selbst und lässt Fett und Links drin.'
},
{
  id: 'w8', heading: 'Die Methode im Template', sev: 'sollte', file: 'team-uebersicht.ts', codeLine: 4,
  situation: 'Die Team-Übersicht zeigt 600 Freelancer aus dem ganzen Pool. Sie fühlt sich beim Tippen zäh an.',
  code: C`
@Component({
  template: \`
    @for (s of entwickler(); track s.id) {
      <tr><td>{{ s.name }}</td><td>{{ marktwert(s) }}</td></tr>
    }\`,
})
export class TeamUebersicht {
  entwickler = input.required<Entwickler[]>();
  marktwert(s: Entwickler) { return berechneMarktwert(s.statistik); }
}`,
  keys: /methode|funktion|marktwert|change detection|jedes mal|ständig|600|computed|pipe|neu berechn/i,
  keyTip: 'Der Kern: marktwert(s) läuft bei jeder Change Detection für alle 600 Zeilen neu.',
  pattern: 'suggestion: `marktwert(s)` läuft bei jeder Change Detection für alle 600 Zeilen neu, das macht das Tippen zäh. Vorschlag: einmal vorher berechnen, z. B. `zeilen = computed(() => this.entwickler().map(s => ({ ...s, wert: berechneMarktwert(s.statistik) })))`, oder eine pure Pipe.'
}
];
