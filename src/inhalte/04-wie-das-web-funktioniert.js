/* ================= Phase: WIE DAS WEB FUNKTIONIERT =================
   URL, HTTP, REST, CORS, Cookies/Tokens, npm, HTTPS & Caching, Event Loop (nur das Grundprinzip).
   Wie der Browser rendert (w09) steht beim Großkunden, wo es um Performance geht.
   Kommt nach der Probezeit, direkt vor dem ersten Kundenprojekt: Dort geht es mit HttpClient und RxJS
   ans Backend, und genau dafür braucht man dieses Wissen. */
AKTE.push({ n: 'W', title: 'Wie das Web funktioniert', sub: 'Bevor das Kundenprojekt startet: URL, HTTP, REST, CORS, Tokens, Sicherheit, npm, Caching, Event Loop' });

/* Übung „Was kommt zuerst?“ (w08): Die Prüfung führt dieselben Schnipsel wie im Startcode wirklich aus
   und vergleicht mit der Vorhersage. Die Meldung sagt nur, wie viele Plätze stimmen, nie die Lösung. */
const EL_SCHNIPSEL = {
  1: log => { log('A'); setTimeout(() => log('B'), 0); Promise.resolve().then(() => log('C')); log('D'); },
  2: log => { const speichern = async () => { log('B'); await Promise.resolve(); log('C'); }; log('A'); setTimeout(() => log('D'), 0); speichern(); log('E'); },
  3: log => { setTimeout(() => { log('A'); Promise.resolve().then(() => log('B')); }, 0); setTimeout(() => log('C'), 0); Promise.resolve().then(() => log('D')); log('E'); },
  4: log => { const ausDemCache = () => Promise.resolve(); log('A'); setTimeout(() => log('B'), 0); ausDemCache().then(() => log('C')); }
};
async function elVorhersage(T, nr, tipp) {
  const echt = [];
  EL_SCHNIPSEL[nr](x => echt.push(x));
  await new Promise(r => setTimeout(r, 30));
  const name = 'ausgabe' + nr, v = T.get(name);
  T.ok(Array.isArray(v) && v.length > 0, name + ' ist noch leer. Trag die Buchstaben als Liste ein, z. B. [\'A\', \'B\'].');
  const du = v.map(x => String(x).trim().toUpperCase());
  T.ok(du.length === echt.length && [...du].sort().join() === [...echt].sort().join(), 'In ' + name + ' soll jeder Buchstabe aus Schnipsel ' + nr + ' genau einmal stehen, also ' + echt.length + ' Einträge. Gerade sind es ' + du.length + '.');
  const richtig = du.filter((x, i) => x === echt[i]).length;
  T.ok(richtig === echt.length, 'Noch nicht ganz: ' + richtig + ' von ' + echt.length + ' Plätzen stimmen. ' + tipp);
}

const WEB_CH = [
{
  id: 'w01', akt: 'W', title: 'Was passiert bei einer URL?', tag: 'URL · DNS · Anfrage & Antwort', xp: 60,
  doku: [['URL-Schnittstelle im Browser', 'https://developer.mozilla.org/de/docs/Web/API/URL']],
  ticket: { id: 'PW-107', typ: 'Bug', titel: 'Kundenseite lädt nicht bei manchen Nutzern', text: 'Mehrere Nutzer der Konzerthaus-Website melden: „Seite nicht erreichbar“. Finde heraus, an welcher Stelle der Weg vom Enter-Drücken zur Seite abbricht.' },
  story: [
    ['erz', 'Pixelwerk betreut die Website vom Konzerthaus am Rhein. Bald baut ihr dafür auch eine App, dein erstes Kundenprojekt. Vorher sollst du verstehen, wie das Web funktioniert.'],
    ['boss', 'Bei mir geht die Seite vom Konzerthaus. Beim Kunden selbst kommt „Seite nicht erreichbar“. Wie kann das sein?'],
    ['toni', 'Zwischen Enter und fertiger Seite passieren fünf Dinge. Wenn du die kennst, kannst du sagen, WO es kaputt ist.']
  ],
  slides: [
    { t: 'Die URL: eine Adresse in Teilen', say: 'Eine URL ist wie eine Postadresse. Jedes Stück hat eine feste Aufgabe.', job: 'Im Support-Ticket steht oft nur „geht nicht“. Bitte immer um die komplette URL. Ein falscher Port oder ein fehlendes https ist schneller gefunden als jeder Bug.',
      code: C`
https://team.pixelwerk.de:443/projekte/neu?tab=infos#dateianhang
└─┬─┘   └───────┬───────┘ └┬┘└─────┬────┘ └───┬────┘ └────┬────┘
Protokoll      Host      Port     Pfad       Query      Anker`,
      notes: [['https', 'Protokoll: WIE geredet wird. https = verschlüsselt.'], ['team.pixelwerk.de', 'Host: WELCHER Rechner. Ein Name, den Menschen sich merken können.'], [':443', 'Port: welche „Tür“ am Rechner. 443 ist Standard für https, darum schreibt man ihn fast nie.'], ['/projekte/neu', 'Pfad: welche Seite oder welches Ding auf dem Server.'], ['?tab=infos', 'Query: Extra-Wünsche als name=wert, mehrere mit & getrennt.'], ['#dateianhang', 'Anker: springt auf der Seite an eine Stelle. Geht NIE an den Server.']],
      pro: 'In Angular landet der Pfad beim Router (/projekte/neu), die Query bei queryParams. Die Begriffe brauchst du in jedem Code-Review.' },
    { t: 'Die Reise in 5 Schritten', say: 'Vom Enter-Drücken bis zur fertigen Seite.', job: 'Jeder Schritt hat seinen eigenen Fehler: DNS kaputt = „Server nicht gefunden“. Zertifikat abgelaufen = Warnseite. Server down = Timeout. So grenzt du ein, wer zuständig ist.',
      punkte: [['1. DNS', 'Der Browser fragt ein „Telefonbuch“: Welche IP-Adresse hat shop.pixelwerk.de? Antwort z. B. 203.0.113.7.', ''], ['2. Verbindung (TCP)', 'Der Browser klingelt bei dieser IP an Port 443 und baut eine Leitung auf.', ''], ['3. TLS', 'Beide tauschen Schlüssel aus. Ab jetzt ist alles verschlüsselt (das Schloss im Browser).', ''], ['4. HTTP-Anfrage', 'Der Browser schickt: „GET /team/leon bitte“.', ''], ['5. Antwort & Rendern', 'Der Server schickt HTML zurück. Der Browser lädt dazu CSS, JavaScript, Bilder und malt die Seite.', '']],
      pro: 'Bei einer Angular-App ist Schritt 5 doppelt: Erst kommt die fast leere index.html, dann das JavaScript, und das holt per HttpClient die Daten (JSON) nach. Darum siehst du im Netzwerk-Tab so viele Anfragen.' },
    { t: 'Anfrage und Antwort: immer ein Paar', say: 'HTTP ist ein Gespräch in Paaren: Der Browser fragt (Request), der Server antwortet (Response). Jede Antwort gehört zu genau einer Frage.', job: 'Der Netzwerk-Tab in den DevTools zeigt jedes Paar aus Anfrage und Antwort. Das ist das erste Werkzeug, das du bei fast jedem Bug-Ticket öffnest.',
      code: C`
GET /api/entwickler/7 HTTP/1.1
Host: pixelwerk.de
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json

{ "id": 7, "name": "Leon", "position": "Frontend" }`,
      notes: [['GET /api/entwickler/7', 'Die Anfrage: Methode GET (holen) und der Pfad.'], ['Host:', 'Header: Zusatzinfos. Hier: an welchen Host.'], ['Accept:', 'Ich hätte die Antwort gern als JSON.'], ['200 OK', 'Statuscode: 200 heißt „alles gut“.'], ['Content-Type', 'Der Server sagt, was im Körper (Body) steckt.'], ['{ "id"', 'Der Body: die eigentlichen Daten.']],
      pro: 'Öffne F12 → Network → klick eine Anfrage. Genau das hier siehst du dort: Headers, Payload, Response. Das ist das wichtigste Debug-Werkzeug für Frontend-Entwickler.' }
  ],
  quiz: [
    { q: 'Welchen Teil der URL schickt der Browser NIE an den Server?', options: ['Den Pfad', 'Die Query (?a=1)', 'Den Anker (#teil)', 'Den Host'], correct: 2, why: 'Den Anker benutzt nur der Browser selbst, um auf der Seite an eine Stelle zu springen.' },
    { q: 'Welche Aufgabe hat DNS, wenn du eine URL aufrufst?', options: ['Es verschlüsselt die Verbindung', 'Es übersetzt den Namen in eine IP-Adresse', 'Es malt die Seite', 'Es speichert Cookies'], correct: 1, why: 'DNS ist das Telefonbuch des Internets: Es liefert zum Namen die passende IP-Adresse.' },
    { q: 'Wo siehst du im Browser alle Anfragen und Antworten deiner App?', options: ['F12 → Console', 'F12 → Network', 'F12 → Elements', 'Im Terminal von ng serve'], correct: 1, why: 'Der Network-Tab zeigt jede Anfrage mit Headern, Body und Status.' }
  ],
  ex: { id: 'exw1', title: 'Der Adress-Scout', goal: 'Zerleg eine URL in ihre Teile. Der Browser hat dafür schon ein Werkzeug eingebaut: <code>new URL(...)</code>.',
    todo: ['<code>zerlege(url)</code> gibt <code>{ protokoll, host, pfad, query }</code> zurück', '<code>protokoll</code> ohne Doppelpunkt, also <code>"https"</code>', '<code>query</code> ist ein Objekt, z. B. <code>{ tab: "zeiten" }</code>'],
    starter: C`
export function zerlege(adresse: string) {
  const u = new URL(adresse);
  // u.protocol  → "https:"   (mit Doppelpunkt!)
  // u.hostname  → "shop.pixelwerk.de"
  // u.pathname  → "/team/leon"
  // u.searchParams → die Query

  return {
    protokoll: '',
    host: '',
    pfad: '',
    query: {}
  };
}
`,
    solution: C`
export function zerlege(adresse: string) {
  const u = new URL(adresse);
  return {
    protokoll: u.protocol.replace(':', ''),
    host: u.hostname,
    pfad: u.pathname,
    query: Object.fromEntries(u.searchParams)
  };
}
`,
    notes: [['new URL(adresse)', 'Browser-Werkzeug: zerlegt die Adresse für dich.'], ["replace(':', '')", 'Den Doppelpunkt hinten abschneiden.'], ['u.hostname', 'Nur der Rechner-Name, ohne Port.'], ['Object.fromEntries', 'Macht aus den searchParams ein normales Objekt.']],
    hints: ['<code>u.protocol</code> ist <code>"https:"</code>. Mit <code>.replace(":", "")</code> fliegt der Doppelpunkt raus.', 'Für die Query: <code>Object.fromEntries(u.searchParams)</code>'],
    tests: [
      { name: 'Protokoll ohne Doppelpunkt', run: T => T.eq(T.get('zerlege')('https://shop.pixelwerk.de/team?tab=zeiten').protokoll, 'https', 'protokoll soll "https" sein, ohne ":".') },
      { name: 'Host stimmt', run: T => T.eq(T.get('zerlege')('https://shop.pixelwerk.de:8080/tickets').host, 'shop.pixelwerk.de', 'host ist nur der Name, ohne Port. Tipp: u.hostname.') },
      { name: 'Pfad stimmt', run: T => T.eq(T.get('zerlege')('https://pixelwerk.de/team/leon?tab=zeiten').pfad, '/team/leon', 'pfad soll "/team/leon" sein.') },
      { name: 'Query als Objekt', run: T => T.eq(T.get('zerlege')('https://pixelwerk.de/t?tab=zeiten&monat=mai').query, { tab: 'zeiten', monat: 'mai' }, 'query soll { tab: "zeiten", monat: "mai" } sein.') }
    ] },
  merke: ['URL = Protokoll + Host + Port + Pfad + Query + Anker.', 'DNS → Verbindung → TLS → Anfrage → Antwort.', 'HTTP kommt immer als Paar: Request und Response.', 'F12 → Network ist dein bester Freund.'],
  paare: [
    ['DNS', 'Telefonbuch: Name zu IP-Adresse'],
    ['TLS', 'Verschlüsselt die Verbindung'],
    ['Request', 'Die Frage des Browsers an den Server'],
    ['Response', 'Die Antwort des Servers'],
    ['Query <code>?q=angular</code>', 'Zusatzangaben hinter dem Fragezeichen']
  ]
},
{
  id: 'w02', akt: 'W', title: 'HTTP: Methoden & Statuscodes', tag: 'GET · POST · 200 · 404 · 500', xp: 60,
  doku: [['HTTP-Anfragemethoden', 'https://developer.mozilla.org/de/docs/Web/HTTP/Reference/Methods'], ['HTTP-Antwortstatuscodes', 'https://developer.mozilla.org/de/docs/Web/HTTP/Reference/Status'], ['Anfragen mit HttpClient stellen', 'https://angular.dev/guide/http/making-requests']],
  ticket: { id: 'PW-108', typ: 'Bug', titel: 'Fehler 401 im Teamboard', text: 'Leon bekommt beim Buchen seiner Stunden „Fehler 401“. Finde heraus, was der Code bedeutet und wer ihn beheben muss.' },
  story: [
    ['leon', 'Das Teamboard sagt „Fehler 401“. Was will das von mir?'],
    ['toni', 'Statuscodes sagen dir sofort, wo du suchen musst. 4 vorne: der Server lehnt diese Anfrage ab, schau zuerst, was du geschickt hast. 5 vorne: der Server hat ein Problem.']
  ],
  slides: [
    { t: 'Methoden: was du willst', say: 'Die Methode sagt dem Server, WAS du vorhast.', job: 'Liest du im Code POST für eine reine Abfrage oder GET zum Löschen, schreib einen Review-Kommentar. Proxies und Browser behandeln die Methoden unterschiedlich.',
      punkte: [['GET', 'Holen. „Zeig mir die Entwickler.“ Ändert nichts.', ''], ['POST', 'Neu anlegen. „Hier ist ein neuer Entwickler.“', ''], ['PUT', 'Komplett ersetzen. „Entwickler 7 sieht jetzt so aus.“', ''], ['PATCH', 'Teilweise ändern. „Bei Entwickler 7 nur die Nummer ändern.“', ''], ['DELETE', 'Löschen. „Entwickler 7 weg.“', '']],
      pro: '„Idempotent“ heißt: Zweimal schicken ändert nichts mehr als einmal. GET, PUT und DELETE sind idempotent, POST nicht (zweimal POST = zwei Entwickler). Darum darf man GET gefahrlos wiederholen (retry), POST nicht.' },
    { t: 'Statuscodes: wo suchen?', say: 'Die erste Ziffer zeigt dir, wo du zuerst suchst.', job: 'Im Daily hörst du: „Das Backend wirft 500er.“ Dann ist das Backend-Team dran. Bei 400 oder 422 schickt meist das Frontend falsche Daten. Diese Zuordnung spart viele Diskussionen.',
      punkte: [['2xx · Alles gut', '200 OK, 201 Created (angelegt), 204 No Content (ok, aber nichts zurück).', 'plus'], ['3xx · Woanders hin', '301/302 Umleitung, 304 Not Modified (nimm deine gespeicherte Kopie).', ''], ['4xx · Anfrage abgelehnt', '400 Anfrage kaputt, 401 nicht eingeloggt, 403 eingeloggt, aber verboten, 404 gibt es nicht, 409 Konflikt, 429 zu viele Anfragen. Prüf zuerst, was du geschickt hast. Die Ursache kann aber auch bei den Daten liegen: 404, wenn jemand den Datensatz gelöscht hat, 409, wenn ihn jemand anderes gerade geändert hat.', 'minus'], ['5xx · SERVER-Fehler', '500 Server abgestürzt, 502/503 Server nicht erreichbar oder überlastet.', 'minus']],
      pro: '401 vs. 403 kommt in jedem Interview: 401 = „Wer bist du?“ (Login fehlt), 403 = „Ich weiß, wer du bist, aber du darfst das nicht.“' },
    { t: 'In Angular: Fehler sauber behandeln', say: 'Vorschau, du musst den Code jetzt nicht verstehen. HttpClient, pipe, catchError, of und throwError lernst du im Kundenprojekt genau. Hier zählt nur das Prinzip: Bei 4xx und 5xx meldet Angular einen Fehler, und du reagierst je nach Statuscode anders.', job: 'Ein echter Firmen-Bug: Bei JEDEM Fehler steht „Etwas ist schiefgelaufen“. Besser: 401 = zum Login, 404 = „nicht gefunden“, 500 = „versuch es gleich nochmal“.',
      code: C`
this.http.get<Entwickler[]>('/api/entwickler').pipe(
  catchError((e: HttpErrorResponse) => {
    if (e.status === 401) this.router.navigate(['/login']);
    if (e.status === 404) return of([]);
    return throwError(() => e);
  })
);`,
      notes: [['this.http.get', 'Holt die Liste vom Server. Die Antwort kommt später.'], ['catchError', 'Fängt den Fehler, damit der Strom nicht einfach stirbt.'], ['e.status', 'Hier steckt der Statuscode drin.'], ['401', 'Nicht eingeloggt → ab zur Login-Seite.'], ['return of([])', 'Gibt es nicht → leere Liste statt Absturz. of([]) heißt: Liefere als Ergebnis eine leere Liste.'], ['throwError', 'Alles andere weiterreichen.']],
      pro: 'In echten Apps macht man das oft zentral in einem HTTP-Interceptor, statt in jedem Service einzeln. Was ein Interceptor ist, siehst du im Kapitel zu Cookies und Tokens.' }
  ],
  quiz: [
    { q: 'Der Server antwortet mit dem Statuscode 403. Was heißt das?', options: ['Der Server ist kaputt', 'Du bist nicht eingeloggt', 'Du bist eingeloggt, hast aber keine Berechtigung', 'Alles ist in Ordnung'], correct: 2, why: '401 heißt „Wer bist du?“, du bist also nicht eingeloggt. 403 heißt „Du darfst das nicht“, obwohl der Server weiß, wer du bist.' },
    { q: 'Beim Speichern eines Entwicklers kommt 409 Conflict zurück, obwohl dein Code gestern noch lief. Was ist die wahrscheinlichste Ursache?', options: ['Ein Tippfehler in der URL', 'Jemand anderes hat den Datensatz inzwischen geändert', 'Der Server ist abgestürzt', 'Du bist nicht eingeloggt'], correct: 1, why: '409 heißt Konflikt: Die Daten passen nicht zum aktuellen Stand auf dem Server, oft weil jemand anderes schneller war. Ein Tippfehler in der URL gäbe eher 404, ein Absturz 500, fehlender Login 401. Ein 4xx muss also nicht dein Fehler sein.' },
    { q: 'Mit welcher HTTP-Methode legst du etwas NEU an?', options: ['GET', 'POST', 'DELETE', 'PUT'], correct: 1, why: 'POST legt etwas neu an. Der Server antwortet dann oft mit 201 Created.' },
    { q: 'Welche Anfrage darfst du nach einem Fehler gefahrlos automatisch wiederholen?', options: ['POST', 'GET', 'PATCH', 'Alle, der Server erkennt doppelte Anfragen'], correct: 1, why: 'GET liest nur und ist idempotent: Zweimal ausführen wirkt wie einmal. Ein doppelter POST kann dagegen eine doppelte Bestellung auslösen.' }
  ],
  ex: { id: 'exw2', title: 'Der Statuscode-Dolmetscher', goal: 'Übersetz Statuscodes in Klartext und sag, welche Methoden man gefahrlos wiederholen darf.',
    todo: ['<code>wasIstLos(200)</code> → <code>"ok"</code>, alle 2xx', '3xx → <code>"umleitung"</code>, 4xx → <code>"client"</code>, 5xx → <code>"server"</code>', '<code>darfWiederholen("GET")</code> → <code>true</code> für GET, PUT, DELETE (idempotent), sonst <code>false</code>'],
    starter: C`
export function wasIstLos(status: number): string {
  // Tipp: Die erste Ziffer reicht. Math.floor(status / 100)
  return '';
}

export function darfWiederholen(methode: string): boolean {
  return false;
}
`,
    solution: C`
export function wasIstLos(status: number): string {
  const klasse = Math.floor(status / 100);
  if (klasse === 2) return 'ok';
  if (klasse === 3) return 'umleitung';
  if (klasse === 4) return 'client';
  if (klasse === 5) return 'server';
  return 'unbekannt';
}

export function darfWiederholen(methode: string): boolean {
  return ['GET', 'PUT', 'DELETE'].includes(methode.toUpperCase());
}
`,
    notes: [['Math.floor(status / 100)', '404 / 100 = 4.04 → abrunden → 4. Das ist die Klasse.'], ["['GET', 'PUT', 'DELETE']", 'Die idempotenten Methoden.'], ['toUpperCase', 'Damit auch "get" klappt.']],
    hints: ['<code>Math.floor(404 / 100)</code> ist <code>4</code>.', 'Für die Methoden: <code>["GET","PUT","DELETE"].includes(methode.toUpperCase())</code>'],
    tests: [
      { name: '2xx → ok', run: T => { const f = T.get('wasIstLos'); T.eq([200, 201, 204].map(f), ['ok', 'ok', 'ok'], '200, 201 und 204 sollen alle "ok" sein.'); } },
      { name: '3xx → umleitung', run: T => T.eq(T.get('wasIstLos')(304), 'umleitung', '304 soll "umleitung" sein.') },
      { name: '4xx → client', run: T => { const f = T.get('wasIstLos'); T.eq([400, 401, 403, 404].map(f), ['client', 'client', 'client', 'client'], 'Alle 4xx sollen "client" sein.'); } },
      { name: '5xx → server', run: T => T.eq(T.get('wasIstLos')(503), 'server', '503 soll "server" sein.') },
      { name: 'GET, PUT, DELETE dürfen wiederholt werden', run: T => { const f = T.get('darfWiederholen'); T.eq(['GET', 'PUT', 'DELETE', 'get'].map(f), [true, true, true, true], 'GET, PUT, DELETE (auch klein geschrieben) sollen true sein.'); } },
      { name: 'POST und PATCH nicht', run: T => { const f = T.get('darfWiederholen'); T.eq(['POST', 'PATCH'].map(f), [false, false], 'POST und PATCH sind nicht idempotent → false.'); } }
    ] },
  merke: ['GET holen, POST anlegen, PUT ersetzen, PATCH teilweise ändern, DELETE löschen.', '2xx gut, 3xx woanders, 4xx du, 5xx Server.', '401 = nicht eingeloggt, 403 = nicht erlaubt.', 'Nur idempotente Anfragen automatisch wiederholen.'],
  paare: [
    ['GET', 'Holen, ändert nichts'],
    ['POST', 'Etwas neu anlegen'],
    ['401', 'Nicht eingeloggt'],
    ['403', 'Eingeloggt, aber nicht erlaubt'],
    ['500', 'Fehler auf dem Server']
  ]
},
{
  id: 'w03', akt: 'W', title: 'Header, JSON & REST', tag: 'Wie man mit APIs redet', xp: 60,
  doku: [['HTTP-Header im Überblick', 'https://developer.mozilla.org/de/docs/Web/HTTP/Reference/Headers'], ['Arbeiten mit JSON', 'https://developer.mozilla.org/de/docs/Learn_web_development/Core/Scripting/JSON'], ['Anfragen und Interceptors in Angular', 'https://angular.dev/guide/http/interceptors']],
  ticket: { id: 'PW-109', typ: 'Feature', titel: 'Neue Entwickler-API anbinden', text: 'Jonas aus dem Backend hat die REST-API für Entwickler fertig. Lies die API-Doku und plane die Anfragen fürs Frontend.' },
  story: [
    ['erz', 'Slack-Nachricht von Jonas aus dem Backend-Team.'],
    ['jonas', 'Die Entwickler-API ist live. Swagger-Doku liegt im Wiki. Sag Bescheid, wenn was fehlt.'],
    ['toni', 'Wenn die API sauber nach REST gebaut ist, verstehst du sie in fünf Minuten. Wir lernen die Regeln.']
  ],
  slides: [
    { t: 'Header: Zettel am Paket', say: 'Header sind kleine Zusatzinfos an jeder Anfrage und Antwort. Name: Wert.', job: 'Fehlt bei einer Anfrage der Header Content-Type: application/json, lehnt das Backend sie oft mit 415 ab. Der Header ist dann der erste Blick im Netzwerk-Tab.',
      punkte: [['Content-Type', 'Was im Body steckt, z. B. application/json.', ''], ['Accept', 'Was ich als Antwort gern hätte.', ''], ['Authorization', 'Mein Ausweis, z. B. „Bearer eyJhbGci…“ (ein Token).', ''], ['Cache-Control', 'Wie lange darf man die Antwort zwischenspeichern?', ''], ['Set-Cookie / Cookie', 'Der Server legt ein Cookie ab, der Browser schickt es danach immer mit.', '']],
      pro: 'In Angular hängst du Header so an: http.get(url, { headers: { Authorization: "Bearer " + token } }). Besser: ein Interceptor macht das für alle Anfragen.' },
    { t: 'JSON: die Sprache der APIs', say: 'Daten reisen als Text. JSON sieht aus wie ein JavaScript-Objekt, ist aber ein String.', job: 'Häufiger Fehler: Ein Datum kommt als Text "2026-05-01" vom Server, im Code wird es aber wie ein Date-Objekt behandelt. JSON kennt kein Datum, du musst es selbst umwandeln.',
      code: C`
const entwickler = { name: 'Leon', nummer: 9 };

const text = JSON.stringify(entwickler);
// '{"name":"Leon","nummer":9}'

const zurueck = JSON.parse(text);
zurueck.nummer; // 9`,
      notes: [['JSON.stringify', 'Objekt → Text. So geht es auf die Reise.'], ['{"name"', 'In JSON stehen Namen IMMER in doppelten Anführungszeichen.'], ['JSON.parse', 'Text → Objekt. HttpClient macht das automatisch für dich.']],
      pro: 'JSON kennt nur: Text, Zahl, true/false, null, Listen, Objekte. Kein Datum, keine Funktionen! Ein Datum kommt als Text ("2026-11-06T18:00:00Z") und muss umgewandelt werden.' },
    { t: 'REST: Dinge statt Befehle', say: 'REST heißt: Die URL nennt ein DING (Ressource), die Methode sagt, was damit passiert. Keine Verben in der URL.', job: 'In der API-Doku (meist Swagger/OpenAPI) siehst du sofort: GET /api/entwickler, POST /api/entwickler, DELETE /api/entwickler/9. Halten sich alle daran, braucht es weniger Absprachen.',
      punkte: [['GET /api/entwickler', 'Alle Entwickler holen.', 'plus'], ['GET /api/entwickler/7', 'Entwickler 7 holen.', 'plus'], ['POST /api/entwickler', 'Neuen Entwickler anlegen (Daten im Body).', 'plus'], ['PUT /api/entwickler/7', 'Entwickler 7 ersetzen.', 'plus'], ['DELETE /api/entwickler/7', 'Entwickler 7 löschen.', 'plus'], ['GET /api/loescheEntwickler?id=7', 'Verb in der URL und GET zum Löschen. So bitte nicht.', 'minus']],
      pro: 'Es gibt auch GraphQL (eine einzige URL, man schickt eine Abfrage) und gRPC. In Firmen ist REST + JSON aber mit Abstand am häufigsten.' }
  ],
  quiz: [
    { q: 'Welcher Header sagt dem Empfänger, dass im Body der Anfrage JSON steckt?', options: ['Accept: application/json', 'Content-Type: application/json', 'Authorization: Bearer …', 'Cache-Control: no-cache'], correct: 1, why: 'Content-Type beschreibt den Inhalt des Bodys. Accept sagt nur, was du als Antwort gern hättest.' },
    { q: 'Welche Anfrage löscht den Entwickler mit der id 7 so, wie es REST vorsieht?', options: ['GET /api/loesche/7', 'POST /api/entwickler/loeschen', 'DELETE /api/entwickler/7', 'DELETE /api/loeschen'], correct: 2, why: 'Bei REST nennt die URL das Ding, und die Methode sagt, was damit passiert.' },
    { q: 'Kann JSON ein Datums-Objekt (Date) transportieren?', options: ['Ja, JSON hat einen eigenen Datums-Typ', 'Nein, ein Datum reist nur als Text', 'Ja, HttpClient macht automatisch ein Date daraus', 'Ja, mit Content-Type: application/json'], correct: 1, why: 'JSON kennt keinen Datums-Typ. Das Datum kommt als Text an, und du musst es selbst umwandeln.' }
  ],
  ex: { id: 'exw3', title: 'Der REST-Planer', goal: 'Bau für jede Aktion die richtige Anfrage: Methode und URL nach REST-Regeln.',
    todo: ['<code>anfrage("alle")</code> → <code>{ methode: "GET", url: "/api/entwickler" }</code>', '<code>"eins"</code>, <code>"aendern"</code>, <code>"loeschen"</code> brauchen die id: <code>/api/entwickler/7</code>', '<code>"neu"</code> → POST auf <code>/api/entwickler</code>'],
    starter: C`
type Aktion = 'alle' | 'eins' | 'neu' | 'aendern' | 'loeschen';

export function anfrage(aktion: Aktion, id?: number) {
  const basis = '/api/entwickler';
  // Gib { methode, url } zurück
  return { methode: '', url: '' };
}
`,
    solution: C`
type Aktion = 'alle' | 'eins' | 'neu' | 'aendern' | 'loeschen';

export function anfrage(aktion: Aktion, id?: number) {
  const basis = '/api/entwickler';
  switch (aktion) {
    case 'alle': return { methode: 'GET', url: basis };
    case 'eins': return { methode: 'GET', url: \`\${basis}/\${id}\` };
    case 'neu': return { methode: 'POST', url: basis };
    case 'aendern': return { methode: 'PUT', url: \`\${basis}/\${id}\` };
    case 'loeschen': return { methode: 'DELETE', url: \`\${basis}/\${id}\` };
  }
}
`,
    notes: [["type Aktion", 'Ein Typ, der nur diese 5 Texte erlaubt. Tippfehler fallen sofort auf.'], ['id?: number', 'Das ? heißt: id darf fehlen (bei "alle" und "neu").'], ['switch (aktion)', 'Je nach Aktion ein anderer Fall.'], ["case 'eins'", 'Ein Ding holen: GET + id in der URL.'], ["case 'neu'", 'Neu anlegen: POST, OHNE id. Die vergibt der Server.']],
    hints: ['Mit <code>switch (aktion) { case "alle": return ...; }</code> gehst du alle Fälle durch.', 'URL mit id: <code>`${basis}/${id}`</code>'],
    tests: [
      { name: 'alle → GET /api/entwickler', run: T => T.eq(T.get('anfrage')('alle'), { methode: 'GET', url: '/api/entwickler' }, 'Alle holen = GET auf /api/entwickler.') },
      { name: 'eins → GET mit id', run: T => T.eq(T.get('anfrage')('eins', 7), { methode: 'GET', url: '/api/entwickler/7' }, 'Einen holen = GET /api/entwickler/7.') },
      { name: 'neu → POST ohne id', run: T => T.eq(T.get('anfrage')('neu'), { methode: 'POST', url: '/api/entwickler' }, 'Neu = POST auf /api/entwickler, ohne id.') },
      { name: 'aendern → PUT mit id', run: T => T.eq(T.get('anfrage')('aendern', 3), { methode: 'PUT', url: '/api/entwickler/3' }, 'Ändern = PUT /api/entwickler/3.') },
      { name: 'loeschen → DELETE mit id', run: T => T.eq(T.get('anfrage')('loeschen', 9), { methode: 'DELETE', url: '/api/entwickler/9' }, 'Löschen = DELETE /api/entwickler/9.') }
    ] },
  merke: ['Header = Zusatzinfos: Content-Type, Accept, Authorization, Cache-Control.', 'JSON ist Text. stringify hin, parse zurück. Kein Datum, keine Funktionen.', 'REST: URL = Ding, Methode = Aktion. Keine Verben in der URL.'],
  paare: [
    ['Content-Type', 'Was im Body steckt, z. B. application/json'],
    ['Authorization', 'Der Ausweis, z. B. ein Bearer-Token'],
    ['<code>JSON.parse</code>', 'Macht aus JSON-Text ein Objekt'],
    ['<code>JSON.stringify</code>', 'Macht aus einem Objekt JSON-Text'],
    ['<code>DELETE /api/entwickler/7</code>', 'Entwickler 7 löschen, sauber im REST-Stil']
  ]
},
{
  id: 'w04', akt: 'W', title: 'CORS', tag: 'Same-Origin · Preflight · Proxy', xp: 80,
  doku: [['CORS im Detail (MDN)', 'https://developer.mozilla.org/de/docs/Web/HTTP/CORS'], ['Dev-Server und Proxy', 'https://angular.dev/tools/cli/serve']],
  ticket: { id: 'PW-110', typ: 'Bug', titel: '„blocked by CORS policy“', text: 'Lokal schlägt jede Anfrage an die Entwickler-API fehl. In Postman klappt alles. Finde die Ursache.' },
  story: [
    ['du', 'In Postman geht alles. In meiner App: „blocked by CORS policy“. Rot. Überall.'],
    ['jonas', 'Bei mir geht es. Muss am Frontend liegen.'],
    ['toni', 'Keiner von euch hat einen Bug. CORS ist eine Schutzregel im Browser. Wir schauen, wie sie denkt.']
  ],
  slides: [
    { t: 'Origin: wer du bist', say: 'Ein Origin ist Protokoll + Host + Port. Nur wenn ALLE drei gleich sind, ist es dasselbe Origin.', job: 'http://localhost:4200 und http://localhost:8080 sind verschiedene Origins, nur wegen des Ports. Genau darum taucht CORS in fast jedem neuen Projekt am ersten Tag auf.',
      punkte: [['https://pixelwerk.de vs. https://pixelwerk.de/team', 'Gleiches Origin. Der Pfad zählt nicht.', 'plus'], ['http:// vs. https://', 'Anderes Origin. Protokoll anders.', 'minus'], ['pixelwerk.de vs. api.pixelwerk.de', 'Anderes Origin. Host anders.', 'minus'], ['localhost:4200 vs. localhost:8080', 'Anderes Origin. Port anders. Genau DAS ist dein Fall beim Entwickeln!', 'minus']],
      pro: 'ng serve läuft auf http://localhost:4200, das Backend oft auf http://localhost:8080. Andere Ports = andere Origins = CORS.' },
    { t: 'Warum gibt es CORS?', say: 'Der Browser schützt DICH. Ohne Regel könnte jede böse Seite im Hintergrund mit deinen Cookies deine Bank-API abfragen.', job: 'Postman und curl kennen kein CORS, nur der Browser. Darum sagt das Backend-Team oft „bei mir geht es“. Beide haben recht.',
      punkte: [['Same-Origin-Policy', 'Grundregel: JavaScript darf Antworten nur vom eigenen Origin lesen.', ''], ['CORS', '„Cross-Origin Resource Sharing“: Der SERVER darf Ausnahmen erlauben, per Header.', ''], ['Access-Control-Allow-Origin', 'Der wichtigste Header. Wert: das erlaubte Origin oder * für alle.', ''], ['Nur im Browser!', 'Postman, curl oder ein Server kennen kein CORS. Darum „geht es im Backend“.', '']],
      pro: 'Ganz wichtig: CORS wird auf dem SERVER konfiguriert, nicht in Angular. Du kannst es in Angular nicht „ausschalten“. Und * zusammen mit Cookies ist verboten.' },
    { t: 'Postman und curl: Anfragen ohne Browser', say: 'Postman ist ein Programm mit Fenster und Knöpfen, curl ein Befehl im Terminal. Beide schicken HTTP-Anfragen direkt, ohne Browser. Darum prüfen sie auch kein CORS.', job: 'Bevor du ein CORS-Ticket ans Backend schreibst, stell die Anfrage mit curl nach. Antwortet der Server, ist die API in Ordnung, und es fehlt nur der Header für den Browser.',
      code: C`
curl -i -H "Origin: http://localhost:4200" http://localhost:8080/api/entwickler

HTTP/1.1 200 OK
Content-Type: application/json

[{ "id": 7, "name": "Leon" }]`,
      notes: [['curl -i', 'curl schickt eine Anfrage aus dem Terminal. -i zeigt auch Statuscode und Header der Antwort.'], ['-H "Origin:', 'Ein Header von Hand: Wir tun so, als käme die Anfrage von deiner App auf Port 4200.'], ['200 OK', 'Der Server antwortet ganz normal.'], ['Content-Type', 'Schau genau hin: Ein Header Access-Control-Allow-Origin fehlt. curl ist das egal, es zeigt die Daten trotzdem. Der Browser würde sie deiner App nicht geben.']],
      pro: 'Im Network-Tab kannst du jede Anfrage per Rechtsklick mit „Copy as cURL“ kopieren und im Terminal nachstellen. Wie das Terminal funktioniert, steht in der Werkzeugbank der Grundlagen.' },
    { t: 'Preflight: erst anklopfen', say: 'Bei „besonderen“ Anfragen fragt der Browser vorher mit OPTIONS nach, ob er darf. Erst dann kommt die echte Anfrage.', job: 'Siehst du im Netzwerk-Tab eine OPTIONS-Anfrage ohne die passenden Access-Control-Header, muss das Backend sie freischalten. Das schreibst du so ins Ticket ans Backend-Team.',
      code: C`
OPTIONS /api/entwickler
Origin: http://localhost:4200
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: authorization

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Methods: GET, POST, DELETE
Access-Control-Allow-Headers: authorization, content-type`,
      notes: [['OPTIONS', 'Die Vorab-Frage. Schickt der Browser automatisch.'], ['Origin:', 'Wer fragt.'], ['Request-Method', 'Was ich gleich vorhabe.'], ['Request-Headers', 'Welche besonderen Header ich mitschicke.'], ['Allow-Origin', 'Antwort: Du darfst, Origin passt.'], ['Allow-Methods', 'Diese Methoden sind ok.']],
      pro: 'Preflight gibt es bei allem außer „einfachen“ Anfragen: GET/HEAD/POST ohne eigene Header und mit einfachem Content-Type. application/json ist NICHT einfach, darum hat fast jede API-Anfrage einen Preflight.' },
    { t: 'Die Lösung beim Entwickeln: Proxy', say: 'Damit du nicht auf das Backend-Team warten musst: Die Angular CLI kann Anfragen an /api durchreichen. Dann ist alles „gleiches Origin“.', job: 'Fast jedes Firmenprojekt hat eine proxy.conf.json für die lokale Entwicklung. In Produktion liegen App und API dann meist hinter derselben Domain, und das Problem ist weg.',
      code: C`
// proxy.conf.json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  }
}

// angular.json → serve → options:
// "proxyConfig": "proxy.conf.json"`,
      notes: [['"/api"', 'Alles, was mit /api anfängt …'], ['"target"', '… leitet der Dev-Server an das Backend weiter.'], ['proxyConfig', 'In angular.json einschalten. Danach ng serve neu starten.']],
      pro: 'Der Proxy gilt nur für ng serve. In Produktion liegen Frontend und API oft hinter demselben Server (z. B. nginx) oder das Backend setzt die CORS-Header richtig.' }
  ],
  quiz: [
    { q: 'Haben http://localhost:4200 und http://localhost:8080 dasselbe Origin?', options: ['Ja, beide liegen auf localhost', 'Nein, der Port ist anders', 'Nur bei GET-Anfragen', 'Nur, wenn beide https benutzen'], correct: 1, why: 'Für dasselbe Origin müssen Protokoll, Host UND Port gleich sein.' },
    { q: 'Wo wird festgelegt, welche fremden Origins eine API per CORS aufrufen dürfen?', options: ['In Angular per HttpClient-Option', 'Auf dem Server per Header', 'In der index.html per meta-Tag', 'In den Browser-Einstellungen'], correct: 1, why: 'Der Server sagt mit dem Header Access-Control-Allow-Origin, welches Origin zugreifen darf.' },
    { q: 'Eine Anfrage an die API klappt in Postman, aber im Browser meldet deine App einen CORS-Fehler. Warum?', options: ['Postman schickt andere Header', 'Nur der Browser prüft CORS', 'Angular blockiert fremde Server', 'Postman umgeht die Firewall'], correct: 1, why: 'CORS ist ein Schutz im Browser. Andere Werkzeuge wie Postman prüfen es nicht.' }
  ],
  ex: { id: 'exw4', title: 'Der Türsteher', goal: 'Bau den Türsteher nach: Ist es dasselbe Origin? Und lässt der Server dieses Origin rein?',
    todo: ['<code>gleichesOrigin(a, b)</code>: true, wenn Protokoll, Host und Port gleich sind', '<code>darfRein(origin, allow)</code>: true, wenn <code>allow</code> <code>"*"</code> ist oder genau <code>origin</code>', '<code>allow</code> kann auch <code>null</code> sein (Header fehlt) → false'],
    starter: C`
export function gleichesOrigin(a: string, b: string): boolean {
  // Tipp: new URL(a).origin gibt "https://host:port"
  return false;
}

export function darfRein(origin: string, allow: string | null): boolean {
  return false;
}
`,
    solution: C`
export function gleichesOrigin(a: string, b: string): boolean {
  return new URL(a).origin === new URL(b).origin;
}

export function darfRein(origin: string, allow: string | null): boolean {
  if (allow === null) return false;
  return allow === '*' || allow === origin;
}
`,
    notes: [['new URL(a).origin', 'Der Browser rechnet das Origin selbst aus: Protokoll + Host + Port.'], ['allow === null', 'Kein Header = keine Erlaubnis. Tür zu.'], ["allow === '*'", 'Stern = alle dürfen.'], ['allow === origin', 'Oder genau dieses Origin.']],
    hints: ['<code>new URL("http://localhost:4200/team").origin</code> ist <code>"http://localhost:4200"</code>.', 'Bei darfRein: erst null prüfen, dann <code>allow === "*" || allow === origin</code>.'],
    tests: [
      { name: 'Pfad egal → gleiches Origin', run: T => T.eq(T.get('gleichesOrigin')('https://pixelwerk.de/team', 'https://pixelwerk.de/tickets?x=1'), true, 'Nur der Pfad ist anders → gleiches Origin.') },
      { name: 'Port anders → anderes Origin', run: T => T.eq(T.get('gleichesOrigin')('http://localhost:4200', 'http://localhost:8080'), false, 'Anderer Port → false.') },
      { name: 'Protokoll und Host zählen', run: T => { const f = T.get('gleichesOrigin'); T.eq([f('http://a.de', 'https://a.de'), f('https://a.de', 'https://api.a.de')], [false, false], 'http vs https und a.de vs api.a.de sind verschieden.'); } },
      { name: 'Stern lässt alle rein', run: T => T.eq(T.get('darfRein')('http://localhost:4200', '*'), true, '"*" = alle dürfen.') },
      { name: 'Nur das genaue Origin', run: T => { const f = T.get('darfRein'); T.eq([f('http://localhost:4200', 'http://localhost:4200'), f('http://evil.de', 'http://localhost:4200')], [true, false], 'Genau gleich → true, anderes → false.'); } },
      { name: 'Kein Header → draußen', run: T => T.eq(T.get('darfRein')('http://localhost:4200', null), false, 'allow ist null → false.') }
    ] },
  merke: ['Origin = Protokoll + Host + Port.', 'CORS ist ein Browser-Schutz. Der SERVER erlaubt per Access-Control-Allow-Origin.', 'Bei JSON-Anfragen klopft der Browser vorher mit OPTIONS an (Preflight).', 'Beim Entwickeln: proxy.conf.json mit ng serve.'],
  paare: [
    ['Origin', 'Protokoll + Host + Port'],
    ['Same-Origin-Policy', 'JavaScript liest nur Antworten vom eigenen Origin'],
    ['Access-Control-Allow-Origin', 'Damit erlaubt der Server ein fremdes Origin'],
    ['Preflight', 'Der Browser fragt vorher mit OPTIONS'],
    ['Proxy', 'ng serve reicht /api durch: gleiches Origin']
  ]
},
{
  id: 'w05', akt: 'W', title: 'Cookies, Storage & Tokens', tag: 'Login verstehen · JWT', xp: 80,
  doku: [['HTTP-Cookies verstehen (MDN)', 'https://developer.mozilla.org/de/docs/Web/HTTP/Cookies'], ['Requests abfangen mit Interceptors', 'https://angular.dev/guide/http/interceptors']],
  ticket: { id: 'PW-111', typ: 'Bug', titel: 'Nach dem Neuladen ausgeloggt', text: 'Kollegen melden: Nach F5 sind sie im Teamboard wieder ausgeloggt. Verstehe, wie der Login technisch funktioniert.' },
  story: [
    ['leon', 'Ich lade die Seite neu und muss mich wieder einloggen. Jedes Mal!'],
    ['toni', 'HTTP hat kein Gedächtnis. Jede Anfrage ist neu. Die Frage ist: Wo bewahrt die App den Ausweis auf?']
  ],
  slides: [
    { t: 'HTTP vergisst alles', say: 'Jede Anfrage steht für sich allein. Der Server erkennt dich nur, wenn du jedes Mal etwas mitschickst: ein Cookie oder einen Token.', job: 'Liegt der Token nur in einer Variable im Service, ist er nach F5 weg. Genau das ist Leons Bug. Die Lösung hängt davon ab, ob ihr Cookies oder Tokens benutzt.',
      punkte: [['Cookie', 'Der Server legt es per Set-Cookie ab. Der Browser schickt es danach AUTOMATISCH bei jeder Anfrage an diesen Server mit.', ''], ['localStorage', 'Speicher im Browser, bleibt für immer. JavaScript kann lesen und schreiben.', ''], ['sessionStorage', 'Wie localStorage, aber weg, wenn der Tab zu ist.', '']],
      pro: 'Cookie-Schalter, die du kennen musst: HttpOnly (JavaScript kommt nicht ran, Schutz vor XSS), Secure (nur über https), SameSite=Lax/Strict (nicht bei Anfragen von fremden Seiten mitschicken, Schutz vor CSRF).' },
    { t: 'JWT: der Ausweis zum Lesen', say: 'Ein JWT (JSON Web Token) ist ein Text aus drei Teilen mit Punkten dazwischen. Der mittlere Teil ist lesbar für JEDEN.', job: 'Auf jwt.io kannst du jeden Token einfügen und lesen. Steht da etwas Geheimes drin, ist das ein Fund für den Pentest. Im Frontend darfst du ihn lesen, prüfen muss ihn immer der Server.',
      code: C`
eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiTGVvbiIsImV4cCI6MTc5NDAwMDAwMH0.abc123
└──── Kopf ────────┘ └────────── Inhalt (Payload) ───────────────┘ └Stempel┘

// Inhalt dekodiert (Base64):
{ "name": "Leon", "exp": 1794000000 }`,
      notes: [['eyJhbGci', 'Kopf: welches Verfahren für den Stempel.'], ['eyJuYW1l', 'Inhalt: Base64-kodiert, NICHT verschlüsselt. Jeder kann es lesen!'], ['abc123', 'Signatur: Nur der Server kann sie erzeugen. Ändert jemand den Inhalt, passt sie nicht mehr.'], ['"exp"', 'Ablaufzeit in Sekunden seit 1970. Danach ist der Token ungültig.']],
      pro: 'Darum: Nie Geheimnisse in ein JWT packen. Und das Frontend darf das JWT lesen (z. B. Name anzeigen), aber PRÜFEN (ist es echt?) kann nur der Server.' },
    { t: 'In Angular: der Interceptor', say: 'Damit du den Token nicht an jede Anfrage einzeln hängen musst, gibt es Interceptors: Sie fangen jede Anfrage ab und hängen den Header an. Vorschau, du musst den Code jetzt nicht ganz verstehen. Anfragen mit HttpClient kommen im Kundenprojekt. Merk dir nur die Idee: eine Stelle für alle Anfragen.', job: 'In fast jeder Firmen-App gibt es genau einen auth.interceptor.ts. Fehlt bei einer Anfrage der Header, schau zuerst, ob die URL dort ausgenommen ist.',
      code: C`
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  if (!token) return next(req);
  return next(req.clone({
    setHeaders: { Authorization: \`Bearer \${token}\` }
  }));
};

// app.config.ts
provideHttpClient(withInterceptors([authInterceptor]))`,
      notes: [['HttpInterceptorFn', 'Eine Funktion, die jede Anfrage bekommt (req) und weiterreicht (next).'], ['inject(AuthService)', 'Den Token aus dem Service holen. inject() kennst du aus dem Kapitel zu Services: Es holt dir einen Service, hier mitten in einer Funktion.'], ['next(req)', 'Kein Token? Unverändert weiterschicken.'], ['req.clone', 'Eine Anfrage kann man nicht mehr ändern. req.clone({ ... }) macht eine Kopie mit dem neuen Header, das Original bleibt, wie es ist.'], ['Bearer', '„Inhaber“: Wer den Token hat, ist drin. Darum gut aufpassen.'], ['withInterceptors', 'Hier meldest du den Interceptor für die ganze App an.']],
      pro: 'Wenn das Login per HttpOnly-Cookie läuft, brauchst du den Interceptor gar nicht: Der Browser schickt das Cookie selbst mit. Dann sind withCredentials und XSRF-Schutz das Thema.' }
  ],
  quiz: [
    { q: 'Kann jeder, der ein JWT in die Hand bekommt, dessen Inhalt lesen?', options: ['Nein, er ist verschlüsselt', 'Ja, er ist nur Base64-kodiert', 'Nein, nur der Server kann ihn lesen', 'Nein, nur Angular kann ihn lesen'], correct: 1, why: 'Base64 ist keine Verschlüsselung. Darum gehören keine Geheimnisse in ein JWT.' },
    { q: 'Was bewirkt das Flag HttpOnly an einem Cookie?', options: ['Das Cookie geht nur über http, nicht über https', 'JavaScript kann das Cookie nicht lesen', 'Das Cookie wird nur an die eigene Seite geschickt', 'Das Cookie gilt nur, bis der Tab zu ist'], correct: 1, why: 'Das schützt den Login: Ein per XSS eingeschleustes Script kann das Cookie nicht stehlen.' },
    { q: 'Wozu ist ein HTTP-Interceptor in Angular gut?', options: ['Um Antworten im Browser-Cache zu speichern', 'Um jede Anfrage an einer Stelle zu verändern, z. B. den Token anzuhängen', 'Um CORS im Frontend auszuschalten', 'Um Nachrichten vom Server an den Browser abzufangen'], correct: 1, why: 'Du schreibst den Interceptor einmal, und er gilt für alle Anfragen.' }
  ],
  ex: { id: 'exw5', title: 'Der Ausweis-Leser', goal: 'Lies ein JWT aus und prüf, ob es abgelaufen ist. So sieht man: Das Frontend kann JWTs lesen, aber nicht fälschen.',
    todo: ['<code>leseToken(jwt)</code> gibt den Inhalt (mittlerer Teil) als Objekt zurück', 'Tipp: <code>atob()</code> macht aus Base64 wieder Text, dann <code>JSON.parse</code>', '<code>abgelaufen(inhalt, jetztSek)</code>: true, wenn <code>exp</code> kleiner oder gleich jetzt ist'],
    starter: C`
export function leseToken(jwt: string) {
  const teile = jwt.split('.');
  // teile[0] = Kopf, teile[1] = Inhalt, teile[2] = Stempel
  return {};
}

export function abgelaufen(inhalt: { exp: number }, jetztSek: number): boolean {
  return false;
}
`,
    solution: C`
export function leseToken(jwt: string) {
  const teile = jwt.split('.');
  const base64 = teile[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

export function abgelaufen(inhalt: { exp: number }, jetztSek: number): boolean {
  return inhalt.exp <= jetztSek;
}
`,
    notes: [["split('.')", 'In die drei Teile zerlegen.'], ['replace(/-/g', 'JWTs benutzen eine URL-freundliche Base64-Variante. Für atob tauscht man - und _ zurück.'], ['atob', 'Base64 → Text. Kein Schlüssel nötig: Das ist keine Verschlüsselung!'], ['JSON.parse', 'Text → Objekt.'], ['inhalt.exp <= jetztSek', 'Ablauf erreicht oder vorbei → abgelaufen.']],
    hints: ['<code>atob(teile[1])</code> gibt den JSON-Text.', 'Dann <code>JSON.parse(...)</code> drumherum.'],
    tests: [
      { name: 'Inhalt wird gelesen', run: T => { const p = btoa(JSON.stringify({ name: 'Leon', exp: 1794000000 })); T.eq(T.get('leseToken')('eyJhbGciOiJIUzI1NiJ9.' + p + '.sig'), { name: 'Leon', exp: 1794000000 }, 'Der mittlere Teil soll als Objekt rauskommen.'); } },
      { name: 'Klappt mit anderem Inhalt', run: T => { const p = btoa(JSON.stringify({ rolle: 'lead', exp: 5 })); T.eq(T.get('leseToken')('a.' + p + '.b'), { rolle: 'lead', exp: 5 }, 'Nimm immer teile[1].'); } },
      { name: 'Abgelaufen erkannt', run: T => { const f = T.get('abgelaufen'); T.eq([f({ exp: 100 }, 200), f({ exp: 200 }, 200)], [true, true], 'exp 100 bei jetzt 200 → abgelaufen. Genau gleich auch.'); } },
      { name: 'Noch gültig erkannt', run: T => T.eq(T.get('abgelaufen')({ exp: 300 }, 200), false, 'exp 300 bei jetzt 200 → noch gültig → false.') }
    ] },
  merke: ['HTTP vergisst alles: Cookie oder Token bei jeder Anfrage.', 'Cookie-Flags: HttpOnly, Secure, SameSite.', 'JWT = Kopf.Inhalt.Stempel. Inhalt ist für alle lesbar, prüfen kann nur der Server.', 'Interceptor hängt den Token an jede Anfrage.'],
  paare: [
    ['Cookie', 'Der Server legt es ab, der Browser schickt es mit'],
    ['localStorage', 'Bleibt für immer, JavaScript kann es lesen'],
    ['sessionStorage', 'Weg, sobald der Tab zu ist'],
    ['HttpOnly', 'JavaScript kommt an dieses Cookie nicht ran'],
    ['JWT', 'Kopf.Inhalt.Stempel, der Inhalt ist für alle lesbar']
  ]
},
{
  id: 'g06', akt: 'W', title: 'Sicherheit', tag: 'Was Angular schützt, was nicht', xp: 70,
  doku: [['Sicherheit in Angular', 'https://angular.dev/best-practices/security'], ['HTTP-Anfragen abfangen (Interceptors)', 'https://angular.dev/guide/http/interceptors']],
  ticket: { id: 'PW-106', typ: 'Security', titel: 'Pentest-Bericht ist da', text: 'Die externe Sicherheitsfirma hat das Teamboard geprüft. Drei Funde betreffen das Frontend. Verstehe, was gemeint ist.' },
  story: [
    ['ricky', 'Ich drück F12 und guck mir euren ganzen Code an. Hehe.'],
    ['toni', 'Darf er. Kann jeder. Das ist die wichtigste Sicherheitsregel überhaupt. Und genau darum geht es im Pentest-Bericht.']
  ],
  slides: [
    { t: 'Regel Nr. 1: Der Browser gehört dem Angreifer', say: 'Alles, was im Browser läuft, kann der Nutzer sehen und ändern. Jede Zeile, jede Variable, jede Anfrage.',
      job: 'Einer der häufigsten Pentest-Funde: Ein Preis oder eine Rolle wird nur im Frontend geprüft. Der Tester ändert die Anfrage im Browser, und der Server glaubt es. Prüfungen gehören immer auf den Server.',
      punkte: [['Nie Passwörter oder geheime Schlüssel in Angular', 'Jeder findet sie mit F12 in Sekunden.', 'minus'], ['Ausgegrauter Knopf ≠ Schutz', '[disabled] ist Komfort. Jeder kann die Anfrage trotzdem schicken.', 'minus'], ['Der Server prüft alles', 'Darf dieser Nutzer das? Sind die Daten gültig? Immer auf dem Server.', 'plus']],
      pro: 'Auch Route Guards (die Seiten sperren) schützen nur die Ansicht. Die Daten muss der Server schützen. Merksatz: Frontend-Prüfung ist für den Nutzer, Backend-Prüfung ist für die Sicherheit.' },
    { t: 'XSS: fremder Code in deiner Seite', say: 'XSS heißt Cross-Site Scripting: Ein Angreifer schmuggelt JavaScript in deine Seite, z. B. als Entwicklername. Läuft es, kann er alles, was der Nutzer kann.',
      job: 'Ein echter Fall: Ein Bewerber nennt sich <img src=x onerror=alert(1)>. Wird der Name ungeprüft als HTML eingefügt, läuft das Skript bei jedem, der die Liste sieht.',
      code: C`
// Ein Bewerber gibt das als Namen ein:
name = signal('<img src=x onerror="klauDaten()">');

// Template:
// <p>Hallo {{ name() }}</p>`,
      notes: [['onerror', 'Böser Code, versteckt in einem Bild-Tag.'], ['{{ name() }}', 'Angular zeigt das als harmlosen TEXT an. Es wird nie als HTML ausgeführt.']],
      pro: 'Angular schützt dich hier automatisch: {{ }} wird immer „escaped“, also als Text eingesetzt. Gefährliche Bindungen wie [innerHTML] oder [href] werden „sanitized“: Angular entfernt Scripts und javascript:-Links. Pures JavaScript mit element.innerHTML = name hätte den Angriff ausgeführt.' },
    { t: 'Wo du dich selbst angreifbar machst', say: 'Angular schützt dich, solange du dich nicht selbst aussperrst. Diese Dinge sind gefährlich.',
      job: 'Sucht in eurem Projekt nach innerHTML, bypassSecurityTrust und ElementRef.nativeElement. Jede Fundstelle gehört in ein Review mit zwei Augenpaaren.',
      punkte: [['[innerHTML]', 'Angular säubert es zwar. Nutze es trotzdem nur, wenn du wirklich HTML anzeigen musst.', ''], ['bypassSecurityTrust…', 'Heißt wörtlich „Sicherheit umgehen“. Nur mit Daten, die du selbst geschrieben hast. Nie mit Nutzer-Eingaben.', 'minus'], ['Direkt am DOM basteln', 'document.querySelector(…).innerHTML = … umgeht Angulars Schutz komplett.', 'minus'], ['Alte Pakete', 'Bekannte Lücken in alten Versionen. npm audit und ng update regelmäßig.', 'minus']],
      pro: 'In Code-Reviews ist „bypassSecurityTrustHtml“ ein Alarmwort. Wenn du das siehst: Woher kommen die Daten? Wer hat sie geschrieben?' },
    { t: 'Login und Tokens', say: 'Nach dem Login bekommt der Browser meist einen „Token“, eine Art Eintrittskarte. Die muss gut aufbewahrt werden.',
      job: 'Im Pentest-Bericht steht oft „Token im localStorage“. Das heißt: Ein XSS-Angriff könnte ihn auslesen. Viele Firmen setzen deshalb auf HttpOnly-Cookies.',
      punkte: [['localStorage', 'Bequem, aber jedes eingeschleuste Script kann es lesen.', 'minus'], ['HttpOnly-Cookie', 'JavaScript kommt gar nicht ran, auch kein böses. Meist die sicherere Wahl.', 'plus'], ['Interceptor', 'Angular-Baustein, der jeder HTTP-Anfrage automatisch den Token anhängt.', ''], ['XSRF-Schutz', 'HttpClient kann automatisch ein Schutz-Token mitschicken, gegen gefälschte Anfragen von fremden Seiten.', 'plus']],
      pro: 'Wo der Token liegt, entscheidet meist das Backend-Team mit. Du musst nur wissen, warum es zählt, und im Meeting die richtige Frage stellen. Wie Cookies und Tokens genau funktionieren, kennst du aus dem Kapitel davor.' }
  ],
  quiz: [
    { q: 'Wo gehört ein geheimer API-Schlüssel hin?', options: ['In den Angular-Code, gut versteckt', 'In den localStorage des Browsers', 'Auf den Server, nie in den Browser', 'In eine environment.ts-Datei im Frontend'], correct: 2, why: 'Alles, was im Browser liegt, kann jeder mit F12 sehen. Geheimnisse gehören deshalb auf den Server.' },
    { q: 'Ein Nutzer gibt als Namen <img onerror="…"> ein. Was zeigt das Template an der Stelle {{ name() }}?', options: ['Der Browser führt das Script aus', 'Die Eingabe erscheint als harmloser Text', 'Es erscheint ein kaputtes Bild', 'Angular entfernt den Tag, es erscheint nichts'], correct: 1, why: 'Angular wandelt Sonderzeichen in {{ }} automatisch in harmlosen Text um (Escaping). Das ist der eingebaute Schutz vor XSS.' },
    { q: 'Ein Knopf ist mit [disabled] gesperrt. Ist die Aktion damit sicher verboten?', options: ['Ja, ein gesperrter Knopf kann nichts auslösen', 'Nein, der Server muss es prüfen', 'Ja, wenn zusätzlich ein Route Guard die Seite sperrt', 'Ja, solange der Code minifiziert ist'], correct: 1, why: 'Jeder kann die Anfrage auch ohne Knopf direkt an den Server schicken. Echten Schutz gibt es deshalb nur auf dem Server.' }
  ],
  merke: ['Alles im Browser ist sichtbar und änderbar. Geheimnisse gehören auf den Server.', 'Echte Prüfung passiert immer auf dem Server, nie nur im Frontend.', 'Angular schützt automatisch vor XSS, solange du nicht bypassSecurityTrust… benutzt oder innerHTML direkt am DOM setzt.', 'Tokens gut aufbewahren, Pakete aktuell halten.'],
  paare: [
    ['XSS', 'Fremdes JavaScript läuft in deiner Seite'],
    ['<code>bypassSecurityTrust…</code>', 'Schaltet Angulars Schutz bewusst ab'],
    ['<code>[disabled]</code>', 'Nur Komfort, kein Schutz'],
    ['HttpOnly-Cookie', 'Token, an das kein Script rankommt'],
    ['Server', 'Prüft Rechte und Daten, immer']
  ]
},
{
  id: 'w06', akt: 'W', title: 'npm & Dependencies', tag: 'package.json · Versionen · Lockfile', xp: 80,
  doku: [['Kompatible Versionen', 'https://angular.dev/reference/versions']],
  ticket: { id: 'PW-112', typ: 'Tech-Debt', titel: 'Build bricht nach npm install', text: 'Seit heute Morgen bricht der Build auf Mias neuem Laptop. Bei dir läuft er. Finde heraus, warum.' },
  story: [
    ['erz', 'Mia hat einen neuen Laptop. npm install, ng serve, roter Fehler. Bei dir läuft alles.'],
    ['mia', 'Ich hab genau das gemacht, was in der README steht.'],
    ['toni', 'Dann hat sie andere Paket-Versionen als du. Wer Abhängigkeiten versteht, rettet in der Firma jeden zweiten Montag.']
  ],
  slides: [
    { t: 'npm: der Ausrüster', say: 'npm ist der Paket-Manager von Node.js. Er lädt fremden Code (Pakete) aus dem Internet in den Ordner node_modules.', job: 'npm audit zeigt Sicherheitslücken in den Paketen. In vielen Firmen läuft das automatisch, und Tickets wie „Update lodash wegen CVE“ landen bei dir.',
      punkte: [['npm install', 'Installiert alles, was in package.json steht.', ''], ['npm install paket', 'Fügt ein neues Paket hinzu und trägt es ein.', ''], ['npm ci', 'Installiert GENAU die Versionen aus dem Lockfile. Für CI-Server und saubere Neustarts.', ''], ['npm run build', 'Startet ein Skript aus package.json.', ''], ['npx befehl', 'Führt ein Programm aus einem Paket aus, ohne es fest zu installieren.', '']],
      pro: 'Warum 1200 Pakete? Abhängigkeiten haben selbst Abhängigkeiten („transitive Dependencies“). Darum: node_modules nie ins Git, nie per Hand ändern, im Zweifel löschen und npm ci.' },
    { t: 'package.json: die Einkaufsliste', say: 'In package.json steht, was dein Projekt braucht und welche Befehle es gibt.', job: 'Steht ein Test-Werkzeug in dependencies statt devDependencies, wird es auf dem Server oder im Docker-Image mitinstalliert (npm ci --omit=dev lässt nur devDependencies weg). Ins Browser-Bundle kommt trotzdem nur, was der Code wirklich importiert. Das ist ein typischer Review-Kommentar.',
      code: C`
{
  "name": "pixelwerk-teamboard",
  "scripts": {
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test"
  },
  "dependencies": {
    "@angular/core": "^22.0.0",
    "rxjs": "~7.8.0"
  },
  "devDependencies": {
    "@angular/cli": "^22.0.0",
    "typescript": "~6.0.0"
  }
}`,
      notes: [['"scripts"', 'Abkürzungen: npm start führt ng serve aus.'], ['"dependencies"', 'Was die App zur Laufzeit braucht.'], ['"^22.0.0"', 'Das ^ heißt: Updates sind ok, solange die erste Zahl gleich bleibt.'], ['"~7.8.0"', 'Das ~ heißt: Nur die letzte Zahl darf steigen.'], ['"devDependencies"', 'Nur für die Entwicklung: CLI, TypeScript, Test-Werkzeuge. Bei npm ci --omit=dev werden sie nicht installiert.']],
      pro: 'Faustregel: Alles, was im Browser mitlaufen muss, gehört zu dependencies. Alles, was nur baut, testet oder prüft, zu devDependencies.' },
    { t: 'Versionen: MAJOR.MINOR.PATCH', say: 'Versionsnummern haben drei Teile. Jeder Teil verspricht etwas. Das heißt „Semantic Versioning“ (SemVer).', job: 'Die Faustregel im Team: PATCH-Updates einfach mergen, MINOR kurz testen, MAJOR bekommt ein eigenes Ticket mit Migration.',
      punkte: [['MAJOR (21.x.x)', 'Kann deinen Code kaputt machen (Breaking Changes). Nur bewusst updaten, mit ng update.', 'minus'], ['MINOR (x.2.x)', 'Neue Features, nichts geht kaputt.', 'plus'], ['PATCH (x.x.5)', 'Nur Fehler behoben.', 'plus'], ['^21.0.0', 'Erlaubt 21.x.x, also MINOR und PATCH. Nicht 22.', ''], ['~7.8.0', 'Erlaubt 7.8.x, also nur PATCH.', ''], ['21.0.0', 'Ohne Zeichen: genau diese Version.', '']],
      pro: 'Achtung bei 0.x-Versionen: Da gilt ^0.4.0 nur für 0.4.x, weil vor 1.0 alles als instabil gilt.' },
    { t: 'Das Lockfile: der Beweis', say: 'package-lock.json schreibt auf, welche Version von JEDEM Paket wirklich installiert wurde. Auch die 1200 indirekten.', job: 'Der Satz „bei mir geht es“ hat oft genau diesen Grund. Lösung: package-lock.json immer committen, und in der CI npm ci statt npm install.',
      punkte: [['Ins Git!', 'package-lock.json gehört immer mit ins Repo.', 'plus'], ['Gleich für alle', 'Mit npm ci hat jeder Rechner und der Build-Server exakt dieselben Versionen.', 'plus'], ['„Bei mir geht’s“', 'Klassischer Fehler: Lockfile nicht committed, jeder hat andere Versionen.', 'minus'], ['npm audit', 'Zeigt bekannte Sicherheitslücken in deinen Paketen.', ''], ['peerDependencies', 'Ein Paket sagt: „Ich brauche Angular 22, bring du es mit.“ Passt die Version nicht, gibt es die berühmten ERESOLVE-Fehler.', 'minus']],
      pro: 'Jedes Paket ist fremder Code, der auf deinem Rechner und im Browser deiner Nutzer läuft. Vor dem Installieren kurz prüfen: Wird es gepflegt? Wie viele Downloads? Braucht man es wirklich?' }
  ],
  quiz: [
    { q: 'Welche Versionen erlaubt die Angabe "^21.0.0" in der package.json?', options: ['Nur genau 21.0.0', 'Alle Versionen 21.x.x', 'Alle Versionen ab 21, auch 22 und höher', 'Nur die Versionen 21.0.x'], correct: 1, why: 'Das Zeichen ^ erlaubt höhere MINOR- und PATCH-Versionen. Die MAJOR-Version bleibt gleich.' },
    { q: 'Gehört die Datei package-lock.json ins Git?', options: ['Nein, npm install erzeugt sie ja neu', 'Ja, immer', 'Nur bei Bibliotheken', 'Nein, der Ordner node_modules reicht'], correct: 1, why: 'Nur mit dem Lockfile im Git bekommen alle im Team exakt dieselben Versionen.' },
    { q: 'In welchen Abschnitt der package.json gehört das Paket @angular/cli?', options: ['dependencies', 'devDependencies', 'peerDependencies', 'In keinen, man installiert es nur global'], correct: 1, why: 'Die CLI braucht man nur zum Bauen. Sie läuft nicht im Browser mit.' }
  ],
  ex: { id: 'exw6', title: 'Der Versions-Check', goal: 'Bau den Versions-Prüfer von npm nach: Passt eine Version zu <code>^</code>, <code>~</code> oder einer exakten Angabe?',
    todo: ['<code>passt("^21.0.0", "21.3.1")</code> → true, <code>"22.0.0"</code> → false', '<code>passt("~7.8.0", "7.8.4")</code> → true, <code>"7.9.0"</code> → false', 'Ohne Zeichen: nur genau gleich', 'Die Version darf nicht kleiner sein als die Angabe (<code>^21.2.0</code> passt nicht zu <code>21.1.9</code>)'],
    starter: C`
// "21.3.1" → [21, 3, 1]
function zahlen(v: string): number[] {
  return v.split('.').map(Number);
}

// Ist a >= b? (beide [major, minor, patch])
function mindestens(a: number[], b: number[]): boolean {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true;
}

export function passt(bereich: string, version: string): boolean {
  const v = zahlen(version);
  // bereich fängt mit ^ oder ~ an, oder ist exakt
  return false;
}
`,
    solution: C`
function zahlen(v: string): number[] {
  return v.split('.').map(Number);
}

function mindestens(a: number[], b: number[]): boolean {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true;
}

export function passt(bereich: string, version: string): boolean {
  const v = zahlen(version);
  if (bereich.startsWith('^')) {
    const b = zahlen(bereich.slice(1));
    return v[0] === b[0] && mindestens(v, b);
  }
  if (bereich.startsWith('~')) {
    const b = zahlen(bereich.slice(1));
    return v[0] === b[0] && v[1] === b[1] && mindestens(v, b);
  }
  return bereich === version;
}
`,
    notes: [["startsWith('^')", 'Fängt der Bereich mit ^ an?'], ['slice(1)', 'Das Zeichen abschneiden: "^21.0.0" → "21.0.0".'], ['v[0] === b[0]', '^: MAJOR muss gleich bleiben.'], ['mindestens(v, b)', 'Und die Version darf nicht älter sein als die Angabe.'], ['v[1] === b[1]', '~: auch MINOR muss gleich bleiben.'], ['bereich === version', 'Ohne Zeichen: exakt gleich.']],
    hints: ['Für ^: <code>const b = zahlen(bereich.slice(1));</code> dann <code>v[0] === b[0] && mindestens(v, b)</code>', 'Für ~ zusätzlich <code>v[1] === b[1]</code>.'],
    tests: [
      { name: '^ erlaubt MINOR und PATCH', run: T => { const f = T.get('passt'); T.eq([f('^21.0.0', '21.3.1'), f('^21.0.0', '21.0.0')], [true, true], '^21.0.0 soll 21.3.1 und 21.0.0 erlauben.'); } },
      { name: '^ verbietet neue MAJOR', run: T => T.eq(T.get('passt')('^21.0.0', '22.0.0'), false, '22.0.0 ist eine neue MAJOR → false.') },
      { name: '~ erlaubt nur PATCH', run: T => { const f = T.get('passt'); T.eq([f('~7.8.0', '7.8.4'), f('~7.8.0', '7.9.0')], [true, false], '~7.8.0: 7.8.4 ja, 7.9.0 nein.'); } },
      { name: 'Nicht älter als die Angabe', run: T => { const f = T.get('passt'); T.eq([f('^21.2.0', '21.1.9'), f('~7.8.3', '7.8.1')], [false, false], '21.1.9 ist älter als 21.2.0 → false.'); } },
      { name: 'Exakt heißt exakt', run: T => { const f = T.get('passt'); T.eq([f('5.4.5', '5.4.5'), f('5.4.5', '5.4.6')], [true, false], 'Ohne Zeichen nur genau gleich.'); } }
    ] },
  merke: ['npm lädt Pakete in node_modules. Nie ins Git, nie per Hand ändern.', 'dependencies = braucht die App zur Laufzeit, devDependencies = nur zum Bauen/Testen. Ins Bundle kommt nur, was importiert wird.', 'MAJOR.MINOR.PATCH. ^ erlaubt MINOR+PATCH, ~ nur PATCH.', 'package-lock.json gehört ins Git. npm ci für exakt gleiche Versionen.'],
  paare: [
    ['MAJOR', 'Kann deinen Code kaputt machen'],
    ['PATCH', 'Nur Fehler behoben'],
    ['<code>^21.0.0</code>', 'Erlaubt 21.x.x, aber nicht 22'],
    ['<code>~7.8.0</code>', 'Erlaubt nur 7.8.x'],
    ['<code>npm ci</code>', 'Installiert genau die Versionen aus dem Lockfile']
  ]
},
{
  id: 'w07', akt: 'W', title: 'HTTPS & Caching', tag: 'Verschlüsselung · Cache · CDN', xp: 50,
  doku: [['HTTP-Caching', 'https://developer.mozilla.org/de/docs/Web/HTTP/Caching'], ['Transport Layer Security (TLS)', 'https://developer.mozilla.org/de/docs/Web/Security/Transport_Layer_Security']],
  ticket: { id: 'PW-113', typ: 'Feature', titel: 'Nach Release sehen Kunden die alte Version', text: 'Nach jedem Deployment sehen Besucher der Kundenseite tagelang den alten Stand. Gleichzeitig soll die Seite schneller laden. Verstehe Caching.' },
  story: [
    ['boss', 'Die App soll schneller sein und sicher. Geht beides?'],
    ['toni', 'Ja. HTTPS für sicher. Caching für schnell. Beides ist am Ende nur Header und Zertifikate. Und falsches Caching ist der Grund, warum die Besucher alte Versionen sehen.']
  ],
  slides: [
    { t: 'HTTPS: das Schloss', say: 'HTTPS ist HTTP mit Verschlüsselung (TLS). Niemand unterwegs kann mitlesen oder etwas verändern.', job: 'Läuft das Zertifikat ab, sehen alle Nutzer eine rote Warnseite. Darum gibt es in Firmen automatische Erneuerung (z. B. Let’s Encrypt) und ein Monitoring, das vorher warnt.',
      punkte: [['Verschlüsselt', 'Passwörter und Tokens kann im WLAN keiner mitlesen.', 'plus'], ['Echt', 'Das Zertifikat beweist: Das ist wirklich pixelwerk.de und kein Betrüger.', 'plus'], ['Unverändert', 'Niemand kann unterwegs Werbung oder Schadcode einschleusen.', 'plus'], ['Pflicht', 'Viele Browser-Funktionen (Kamera, Service Worker, Secure-Cookies) gehen nur mit HTTPS.', '']],
      pro: 'Zertifikate kommen von einer Zertifizierungsstelle, oft kostenlos über Let’s Encrypt. localhost gilt beim Entwickeln als sicher, auch ohne HTTPS.' },
    { t: 'Caching: nicht zweimal holen', say: 'Der Browser kann Antworten speichern und wiederverwenden. Der Server sagt per Header, wie lange.', job: 'Das ist der Grund für das Ticket: Nach einem Release sehen Besucher die alte App, weil index.html zu lange im Cache liegt. index.html bekommt darum no-cache.',
      punkte: [['Cache-Control: max-age=31536000', 'Ein Jahr lang behalten. Für Dateien, die sich nie ändern.', ''], ['Cache-Control: no-cache', 'Speichern ja, aber vor jeder Benutzung beim Server nachfragen.', ''], ['Cache-Control: no-store', 'Gar nicht speichern. Für sensible Daten.', ''], ['ETag / 304', 'Der Server sagt: „Hat sich nicht geändert, nimm deine Kopie.“ Spart den ganzen Download.', '']],
      pro: 'Angular macht das schlau: ng build hängt einen Fingerabdruck an jede Datei (main-AB12CD.js). Ändert sich der Code, ändert sich der Name. So dürfen diese Dateien ewig gecacht werden, nur index.html nicht.' },
    { t: 'CDN & Kompression', say: 'Zwei Tricks, die jede große Seite benutzt.', job: 'Im Netzwerk-Tab siehst du bei jeder Datei die Größe vor und nach der Kompression. Ist eine JS-Datei nicht komprimiert, ist das ein schnelles Ticket mit großer Wirkung.',
      punkte: [['CDN', 'Kopien deiner Dateien auf Servern weltweit. Der Nutzer lädt vom nächsten.', 'plus'], ['gzip / Brotli', 'Text wird vor dem Senden gepackt. JavaScript oft auf ein Viertel der Größe.', 'plus'], ['HTTP/2 & HTTP/3', 'Viele Dateien gleichzeitig über eine Leitung. Schneller als früher.', 'plus']],
      pro: 'Im Netzwerk-Tab steht „(disk cache)“, wenn der Browser gar nicht erst fragen musste. Bilder wie JPG oder PNG sind schon gepackt, gzip bringt dort nichts.' }
  ],
  quiz: [
    { q: 'Wovor schützt HTTPS?', options: ['Vor einer Überlastung des Servers', 'Vor Mitlesen und Verändern der Daten unterwegs', 'Vor Hackern, die Daten auf dem Server stehlen', 'Vor XSS auf der Seite'], correct: 1, why: 'HTTPS verschlüsselt die Verbindung, bestätigt die Echtheit des Servers und stellt sicher, dass unterwegs nichts verändert wird.' },
    { q: 'Warum darf der Browser eine Datei wie main-AB12CD.js aus dem Angular-Build beliebig lange cachen?', options: ['Weil die Datei klein ist', 'Weil sich bei jeder Änderung der Dateiname ändert', 'Weil alte Versionen niemanden stören', 'Das darf er gar nicht'], correct: 1, why: 'Ändert sich der Code, bekommt die Datei einen neuen Namen. Der Browser lädt sie dann neu herunter.' },
    { q: 'Was bedeutet der HTTP-Statuscode 304?', options: ['Auf dem Server ist ein Fehler passiert', 'Nichts hat sich geändert, nimm deine gespeicherte Kopie', 'Die Ressource wurde gelöscht', 'Die Adresse hat sich dauerhaft geändert'], correct: 1, why: '304 heißt Not Modified: Der Browser benutzt seine Kopie aus dem Cache und lädt nichts neu.' }
  ],
  merke: ['HTTPS = verschlüsselt, echt, unverändert.', 'Cache-Control sagt, wie lange gespeichert wird.', 'Angular-Dateien haben Fingerabdrücke im Namen → ewig cachen ok.', 'CDN + Kompression = schnell überall.'],
  paare: [
    ['HTTPS', 'HTTP mit Verschlüsselung'],
    ['<code>max-age=31536000</code>', 'Ein Jahr lang behalten'],
    ['<code>no-cache</code>', 'Speichern, aber vor jeder Nutzung nachfragen'],
    ['<code>no-store</code>', 'Gar nicht speichern'],
    ['CDN', 'Kopien deiner Dateien weltweit, nah am Nutzer']
  ]
},
{
  id: 'w08', akt: 'W', title: 'Die Event Loop', tag: 'Call Stack · Microtasks · Timer', xp: 90,
  doku: [['Das JavaScript-Ausführungsmodell', 'https://developer.mozilla.org/de/docs/Web/JavaScript/Event_loop'], ['Promises verwenden', 'https://developer.mozilla.org/de/docs/Web/JavaScript/Guide/Using_promises'], ['Zoneless Change Detection', 'https://angular.dev/guide/zoneless']],
  ticket: { id: 'PW-158', typ: 'Bug', titel: 'Statusmeldung springt in falscher Reihenfolge', text: 'Im Teamboard steht nach dem Speichern erst „Gespeichert!“ und dann kurz wieder „Speichert…“. Mia hat es reproduziert: Ein setTimeout und ein Promise kommen sich in die Quere. Finde heraus, in welcher Reihenfolge JavaScript Dinge wirklich ausführt.' },
  story: [
    ['mia', 'Ich hab den Code dreimal gelesen. Laut Code müsste „Gespeichert!“ als Letztes kommen. Tut es aber nicht.'],
    ['toni', 'Code läuft nicht einfach von oben nach unten. Er läuft in der Reihenfolge der Event Loop. Wer die kennt, findet solche Bugs in zwei Minuten.'],
    ['ricky', 'Ich mach bei sowas immer ein setTimeout(…, 0) drum, dann geht’s meistens.'],
    ['toni', '„Meistens“ ist genau das Problem, Ricky. Heute lernen wir, WARUM es manchmal geht.']
  ],
  slides: [
    { t: 'Ein Koch, eine Küche', say: 'JavaScript macht eins nach dem anderen. Es hat genau einen Faden (Thread), wie ein Koch allein in der Küche. Timer und Antworten vom Server kommen später dran: Sie warten in Schlangen, bis der Koch wieder frei ist.', job: 'Klassische Interview-Frage: „Was gibt dieser Code aus?“ Und im Alltag: Wer die Reihenfolge nicht kennt, baut Bugs, die nur manchmal auftreten.',
      code: C`
console.log('1 Start');

setTimeout(() => console.log('4 Timer'), 0);

Promise.resolve().then(() => console.log('3 Promise'));

console.log('2 Weiter');`,
      notes: [["'1 Start'", 'Normaler Code läuft sofort. Ausgabe 1.'], ['setTimeout', 'setTimeout(fn, 0) heißt: Ruf fn später auf, frühestens nach 0 ms. Der Aufruf kommt in die Timer-Schlange (Macrotask). Er muss warten, bis alles andere durch ist.'], ['Promise.resolve().then', 'Ein Promise ist ein Versprechen auf einen Wert, der später kommt. Promise.resolve() ist eins, das schon erfüllt ist. .then(fn) heißt: Wenn der Wert da ist, ruf fn auf. Dieser Aufruf kommt in die Microtask-Schlange. Die ist VIP: Sie wird geleert, bevor der nächste Timer dran ist.'], ["'2 Weiter'", 'Läuft noch sofort, weil der aktuelle Code erst fertig werden muss. Ausgabe 2, dann 3, dann 4.']],
      pro: 'setTimeout(fn, 0) heißt nicht „sofort“, sondern „frühestens nach allem, was gerade läuft, und nach allen Microtasks“. Promises und async/await üben wir auch im Werkzeugkasten der Grundlagen.' },
    { t: 'Die Reihenfolge', say: 'Die Event Loop ist eine Endlosschleife mit einer festen Reihenfolge. Merk dir die Reihenfolge, die Namen sind zweitrangig.', job: 'Bei Bugs der Art „erst richtig, dann kurz wieder falsch“ gehst du genau diese Liste durch. Fast immer läuft ein Timer später, als man denkt.',
      punkte: [['1. Der Code, der gerade läuft', 'Fachwort: Call Stack. Er wird komplett zu Ende ausgeführt. Nichts unterbricht ihn.', ''], ['2. ALLE Microtasks', 'Promise.then, der Rest nach await. Alle werden geleert, auch neue, die dabei entstehen.', ''], ['3. EINE Macrotask', 'Ein Timer, ein Klick, eine fertige Antwort vom Server. Genau eine, dann geht es wieder bei 2 los.', '']],
      pro: 'Zwischen zwei Runden darf der Browser die Seite neu malen. Wie das genau abläuft und warum es ruckeln kann, lernst du später beim Großkunden im Kapitel „Wie der Browser rendert“.' },
    { t: 'await zerschneidet deine Funktion', say: 'Alles nach einem await ist in Wahrheit ein .then. Die Funktion pausiert, gibt den Koch frei und macht später als Microtask weiter.', job: 'Typischer Review-Kommentar: „Du liest this.entwickler direkt nach dem Aufruf von laden(), aber laden() ist async. Da ist noch nichts drin.“',
      code: C`
async function laden() {
  console.log('B laden startet');
  await Promise.resolve();
  console.log('D nach dem await');
}

console.log('A');
laden();
console.log('C');`,
      notes: [['async function', 'async vor einer Funktion heißt: Sie darf await benutzen und gibt immer ein Promise zurück.'], ["'B laden startet'", 'Bis zum ersten await läuft eine async-Funktion ganz normal und sofort.'], ['await Promise.resolve()', 'await heißt: Warte, bis das Promise erfüllt ist. Hier wird die Funktion zerschnitten. Der Rest wandert als Microtask in die Schlange.'], ["'D nach dem await'", 'Kommt erst, wenn der aktuelle Code fertig ist. Also nach C.'], ['laden();', 'Ohne await davor wartet hier niemand. Ausgabe: A, B, C, D.']],
      pro: 'Wer das Ergebnis einer async-Funktion braucht, muss selbst await schreiben. Vergessene awaits sind einer der häufigsten Bugs in Tests: Der Test ist fertig, bevor die Daten da sind.' },
    { t: 'Den Koch nicht blockieren', say: 'Solange dein Code läuft, kann der Browser nichts anderes: kein Klick, kein Scrollen, kein Malen. Die Seite friert ein.', job: 'Ticket „CSV-Export friert die App 4 Sekunden ein“: Fast immer läuft dann zu viel Code am Stück. Wie man das misst und in Häppchen teilt, kommt beim Großkunden.',
      punkte: [['Der Klick wartet', 'Ein Klick ist eine Macrotask. Er wartet, bis der laufende Code fertig ist.', 'minus'], ['Lange Aufgabe', 'Alles über 50 ms nennt der Browser „Long Task“. Nutzer merken das als Ruckeln.', 'minus'], ['Angular', 'Ohne Zone.js (zoneless) plant Angular einen Prüf-Durchlauf selbst ein, sobald sich ein Signal ändert. Auch der wartet, bis dein Code fertig ist.', '']],
      pro: 'Früher hat Zone.js setTimeout, Promise und Events „umgebaut“, um zu wissen, wann Angular prüfen muss. Darum tauchten im Stacktrace immer zone.js-Zeilen auf. Zoneless (Standard seit Angular 21) braucht das nicht mehr: Signals sagen Angular direkt Bescheid.' }
  ],
  quiz: [
    { q: 'Im Code stehen nacheinander setTimeout(…, 0) und Promise.resolve().then(…). Welcher Rückruf läuft zuerst?', options: ['Der Timeout, er steht weiter oben', 'Das Promise, Microtasks kommen vor dem nächsten Timer', 'Das ist zufällig', 'Beide laufen gleichzeitig'], correct: 1, why: 'Nach dem aktuellen Code werden erst ALLE Microtasks abgearbeitet. Dann kommt eine Macrotask wie der Timer.' },
    { q: 'Eine Schleife rechnet 3 Sekunden lang. Was passiert mit einem Klick, der in dieser Zeit kommt?', options: ['Er geht verloren', 'Er unterbricht die Schleife', 'Er wartet in der Schlange und läuft danach', 'Er läuft parallel zur Schleife'], correct: 2, why: 'JavaScript hat nur einen Thread. Der Klick ist eine Macrotask und wartet, bis der laufende Code fertig ist. Darum friert die Seite ein.' },
    { q: 'Wann läuft der Code weiter, der in einer Funktion nach einem await steht?', options: ['Sofort, ohne Pause', 'Als Microtask, frühestens wenn der aktuelle Code fertig ist', 'Erst beim nächsten Timer', 'Nach dem nächsten Rendern'], correct: 1, why: 'await ist ein .then in schönerer Schreibweise. Der Rest der Funktion läuft später als Microtask.' }
  ],
  ex: { id: 'exw8', title: 'Was kommt zuerst?', goal: 'Sag voraus, in welcher Reihenfolge die Buchstaben in der Konsole erscheinen. Geh jedes Schnipsel im Kopf durch und trag die Reihenfolge als Liste ein. Beim Prüfen laufen die Schnipsel wirklich im Browser, und die Prüfung vergleicht mit deiner Vorhersage.',
    todo: ['<code>ausgabe1</code> bis <code>ausgabe4</code>: je eine Liste mit den Buchstaben in der Reihenfolge, in der sie erscheinen, z. B. <code>[\'A\', \'B\', \'C\']</code>', 'Jeder Buchstabe aus dem Schnipsel kommt genau einmal vor', 'Erst überlegen, dann eintragen. Die Prüfung sagt dir, wie viele Plätze schon stimmen'],
    starter: C`
// Die Schnipsel laufen hier nicht mit. Geh sie im Kopf durch.

// Schnipsel 1: der Klassiker
function schnipsel1() {
  console.log('A');
  setTimeout(() => console.log('B'), 0);
  Promise.resolve().then(() => console.log('C'));
  console.log('D');
}
export const ausgabe1: string[] = [];

// Schnipsel 2: async und await
async function speichern() {
  console.log('B');
  await Promise.resolve();
  console.log('C');
}
function schnipsel2() {
  console.log('A');
  setTimeout(() => console.log('D'), 0);
  speichern();
  console.log('E');
}
export const ausgabe2: string[] = [];

// Schnipsel 3: ein Timer stößt ein Promise an
function schnipsel3() {
  setTimeout(() => {
    console.log('A');
    Promise.resolve().then(() => console.log('B'));
  }, 0);
  setTimeout(() => console.log('C'), 0);
  Promise.resolve().then(() => console.log('D'));
  console.log('E');
}
export const ausgabe3: string[] = [];

// Schnipsel 4: Mias Bug aus dem Ticket
const ausDemCache = () => Promise.resolve(); // Antwort liegt schon bereit
function schnipsel4() {
  console.log('A');                                // zeigt „Speichert …“
  setTimeout(() => console.log('B'), 0);           // Rickys Trick: nochmal „Speichert …“
  ausDemCache().then(() => console.log('C'));      // zeigt „Gespeichert!“
}
export const ausgabe4: string[] = [];
`,
    solution: C`
// Die Schnipsel laufen hier nicht mit. Geh sie im Kopf durch.

// Schnipsel 1: der Klassiker
function schnipsel1() {
  console.log('A');
  setTimeout(() => console.log('B'), 0);
  Promise.resolve().then(() => console.log('C'));
  console.log('D');
}
export const ausgabe1: string[] = ['A', 'D', 'C', 'B'];

// Schnipsel 2: async und await
async function speichern() {
  console.log('B');
  await Promise.resolve();
  console.log('C');
}
function schnipsel2() {
  console.log('A');
  setTimeout(() => console.log('D'), 0);
  speichern();
  console.log('E');
}
export const ausgabe2: string[] = ['A', 'B', 'E', 'C', 'D'];

// Schnipsel 3: ein Timer stößt ein Promise an
function schnipsel3() {
  setTimeout(() => {
    console.log('A');
    Promise.resolve().then(() => console.log('B'));
  }, 0);
  setTimeout(() => console.log('C'), 0);
  Promise.resolve().then(() => console.log('D'));
  console.log('E');
}
export const ausgabe3: string[] = ['E', 'D', 'A', 'B', 'C'];

// Schnipsel 4: Mias Bug aus dem Ticket
const ausDemCache = () => Promise.resolve(); // Antwort liegt schon bereit
function schnipsel4() {
  console.log('A');                                // zeigt „Speichert …“
  setTimeout(() => console.log('B'), 0);           // Rickys Trick: nochmal „Speichert …“
  ausDemCache().then(() => console.log('C'));      // zeigt „Gespeichert!“
}
export const ausgabe4: string[] = ['A', 'C', 'B'];
`,
    notes: [["ausgabe1: string[] = ['A', 'D'", 'Erst der normale Code: A und D. Dann alle Microtasks: C. Zuletzt der Timer: B.'], ["ausgabe2: string[] = ['A', 'B', 'E'", 'speichern() läuft bis zum await sofort mit, darum kommt B direkt nach A. Dann E. Der Rest nach dem await ist eine Microtask: C. Der Timer D kommt als Letztes.'], ["ausgabe3: string[] = ['E', 'D'", 'Normaler Code: nur E. Microtask: D. Dann der erste Timer: A. Er stößt B an, und B ist eine Microtask. Die läuft vor dem zweiten Timer C.'], ["ausgabe4: string[] = ['A', 'C', 'B']", 'Genau Mias Bug: Das fertige Promise (C, „Gespeichert!“) ist eine Microtask und überholt Rickys Timer (B, „Speichert …“). Die Anzeige springt zurück. Die Lösung im Team: kein setTimeout als Trick, die Anzeige nur an einer Stelle setzen.']],
    hints: ['Geh jedes Schnipsel in zwei Runden durch. Runde 1: nur die Zeilen, die sofort laufen. Runde 2: was in den Schlangen wartet.', 'Was in <code>.then(...)</code> oder nach einem <code>await</code> steht, ist eine Microtask. Was in <code>setTimeout</code> steht, ist eine Macrotask. Nach dem normalen Code kommen erst ALLE Microtasks, dann EIN Timer.', 'Eine async-Funktion läuft bis zum ersten <code>await</code> ganz normal mit. Erst der Rest danach muss warten.', 'Nach jedem Timer werden wieder alle Microtasks geleert, auch die, die der Timer gerade erst angestoßen hat. Erst dann ist der nächste Timer dran.'],
    tests: [
      { name: 'Schnipsel 1: der Klassiker', run: T => elVorhersage(T, 1, 'Geh erst den normalen Code durch, dann die Schlangen. Was ist VIP?') },
      { name: 'Schnipsel 2: async und await', run: T => elVorhersage(T, 2, 'Bis wohin läuft speichern() sofort mit?') },
      { name: 'Schnipsel 3: ein Timer stößt ein Promise an', run: T => elVorhersage(T, 3, 'Was passiert direkt nach dem ersten Timer, bevor der zweite drankommt?') },
      { name: 'Schnipsel 4: Mias Bug', run: T => elVorhersage(T, 4, 'Auch ein Promise, das schon fertig ist, ruft then nicht sofort auf. Wer ist trotzdem schneller als ein Timer?') }
    ] },
  merke: ['JavaScript macht eins nach dem anderen. Laufender Code wird immer zu Ende ausgeführt.', 'Reihenfolge: laufender Code → alle Microtasks → EINE Macrotask → wieder alle Microtasks.', 'Promise.then und alles nach await sind Microtasks, setTimeout ist eine Macrotask.', 'setTimeout(…, 0) ist kein Fix, nur eine andere Reihenfolge.'],
  paare: [
    ['Call Stack', 'Der Code, der gerade läuft'],
    ['Microtask', 'Promise.then und alles nach await'],
    ['Macrotask', 'Ein Timer, ein Klick: genau einer pro Runde'],
    ['Long Task', 'Läuft über 50 ms, die Seite friert ein'],
    ['<code>setTimeout(…, 0)</code>', 'Kein Fix, nur eine andere Reihenfolge']
  ]
}
];
CH.push(...WEB_CH);
