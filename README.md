# Pixelwerk: Angular lernen an echten Tickets

Eine Lernplattform auf Deutsch für **Angular 22** und RxJS. Du fängst als Frontend-Dev bei der Kölner Digitalagentur Pixelwerk an, dein Mentor ist Toni. Jedes Kapitel ist ein Ticket (Bug, Feature, Incident, Code Review) mit Team-Szene, knappen Folien, Quiz und einer Code-Übung, die automatisch geprüft wird. 12 Phasen, 73 Kapitel, 64 Übungen, 235 Quizfragen und ein Zuordnungsspiel pro Kapitel. Wer ganz neu ist, beginnt mit der Phase **Grundlagen** (HTML, CSS, TypeScript, Werkbank mit Terminal, npm, Git und DevTools). Wer schon Erfahrung hat, springt direkt zu Angular. Am Ende steht ein Abschlussprojekt: ein Workshop-Planer, der in vier Etappen wächst (Liste, Server, Formular mit Signal Forms, Routen mit Guard). Jede Etappe startet mit der fertigen vorigen.

## Starten

```bash
git clone https://github.com/kerimio/pixelwerk.git
cd pixelwerk
npm start
```

Dann **http://localhost:4300** öffnen. Du brauchst nur Node (ab Version 20), kein `npm install`.

- Der Spielstand wird mit `npm start` automatisch in `progress.json` im Repo-Ordner gespeichert (steht in `.gitignore`). Die vorige Fassung liegt daneben als `progress.json.bak`. Zusätzlich merkt sich der Browser den Stand.
- Ohne Server geht es auch: `index.html` im Browser öffnen. Dann liegt der Spielstand nur im Browser. Sichern und einspielen geht im Profil unter **Spielstand** (Export und Import als JSON). Dort kannst du auch **ganz von vorn anfangen**: Nach einer Rückfrage sind Fortschritt, Profil und Avatar gelöscht, und der Einstieg startet neu. Hell oder dunkel und der KI-Schlüssel bleiben.

## So läuft es ab

1. **Einstieg** (nur beim ersten Start, überspringbar): Titelbild, Charakter erstellen (Name, Pixel-Avatar, Lieblingsfarbe, Mitarbeiterausweis), erster Tag mit Katrin und Toni, Team kennenlernen, **Dein Weg** (mit den Grundlagen anfangen oder direkt mit Angular starten; die Grundlagen bleiben dann als optionale Phase sichtbar, umstellbar im Profil unter **Du**), **Dein Coach** (eigene KI mit API-Schlüssel eintragen oder ohne KI weiter), Spielregeln. Im Profil kannst du ihn später nochmal ansehen.
2. **Schreibtisch** (Startseite): Begrüßung mit Rang, XP und Serie, dein nächstes Ticket, **Wiederholen** (wenn etwas fällig ist), der Weg durch die 12 Phasen, Werkstatt, Abzeichen. Alle Kapitel bleiben frei anwählbar. Die erste Phase ist kurz (zwei Kapitel), und schon im ersten schreibst du Code.
3. **Kapitel** als Ticket: **Szene** (Team-Chat zum Durchklicken, am Ende ein Vorab-Tipp), dann **Folien** (Kernsatz, Code mit nummerierten Erklärungen, „Im Job“, eingeklappt „Mehr dazu“ mit Profi-Wissen; die Links zur offiziellen Doku stehen auf der letzten Folie; unterstrichene Wörter im Code öffnen eine Erklärkarte; beim ersten Mal erklärst du die nummerierten Stellen selbst in eigenen Worten, dann kommt die Lösung mit deinen Worten darunter, mit KI-Schlüssel prüft Toni vorher), dann **Quiz** (Antworten bei jedem Öffnen gemischt), dann **Zuordnen** (links Begriffe, rechts Aussagen: antippen, Paare finden, die App prüft sofort; Fehler zählen wie falsche Quizantworten, ohne Fehler gibt es +10 XP), dann **Übung** (Prüfen, Tipp-Leiter bis zur Lösung, optional Pull Request an Toni), zuletzt der **Abschluss** („Was nimmst du mit?“, Merksätze, Doku-Links).
   **Geschafft** ist ein Kapitel erst mit echter Arbeit: Die Übung ist grün (auch mit Lösung), bei Kapiteln ohne Übung sind alle Quizfragen richtig. Erst dann gibt es die XP des Kapitels, Sachen für den Avatar, Abzeichen und Wiederholkarten. Wer nur durchblättert, sieht am Ende „Nur angeschaut“ mit dem Weg zurück zur Übung. Das Kapitel ist auf dem Weg halb markiert, steht bei „Wackelt noch“, und sobald die Übung grün ist, zählt es nachträglich als geschafft.
4. **Wiederholen**: Quizfragen kommen nach 1 Tag wieder, Merksätze nach 2, das Zuordnen nach 3 (mit Fehlern im Kapitel schon nach 1), die Übung nach 4, danach in wachsenden Abständen (etwa 3, 7, 18 Tage), gemischt, falsche Karten in derselben Runde nochmal. Ist nichts fällig, gibt es eine freie Runde, die deine früheren Fehler (auch aus dem Kapitel-Quiz) öfter zieht. Gelöste Übungen kommen später mit leerem Startcode wieder.
   **Wackelt noch**: Aus deinen Antworten rechnet die App ohne KI aus, welche Themen sitzen und welche wackeln (Quiz erst im zweiten Anlauf, Fehler beim Wiederholen, „sicher, aber falsch“, Fehlversuche und Lösung in der Übung, Mini-Spiel). Wackelige Themen stehen auf dem Schreibtisch mit „Üben“ (die Quizfragen des Kapitels und, wenn sie schon einmal grün war, die Übung aus dem Kopf), kommen beim Wiederholen öfter und früher dran, und in der Übung bietet die App früher Hilfe an (wann, richtet sich auch nach deinem Vorwissen aus dem Einstieg).
5. **Werkstatt**: Bug-Jagd, „Was gibt das aus?“, Review-Schule, Code-Review-Arena, Mock-Interview.
6. **Coach Toni**: der Chat-Knopf unten rechts, mit Schnellfragen je nach Ort (Folie, Übung). Du kannst dir auch ein **eigenes Kapitel** zu einem Wunschthema schreiben lassen („Kapitel zu Angular Animations“), es landet unter „Eigene Kapitel“.
7. **Profil** (Chip oben rechts) ist der einzige Ort für Einstellungen: **Du** (Name, Avatar, Garderobe), **Aussehen** (hell oder dunkel, Farben, Animationen, Ton), **Coach Toni** (KI und Schlüssel, was Toni über dich gelernt hat), **Spielstand**.

   Der **Pixel-Avatar** hat 20 × 20 Pixel und 15 Farben. Mit dem **dicken Pinsel** malst du Blöcke aus 2 × 2 Pixeln, das geht auf dem Handy leichter. Avatare aus älteren Spielständen (10 × 10) werden beim Laden verdoppelt und sehen aus wie vorher. Auch das Team hat Pixel-Gesichter: im Einstieg, in den Szenen und im Chat mit Toni.

8. **Garderobe** (im Profil unter **Du**, oder Klick auf deinen Avatar auf dem Schreibtisch): Für abgeschlossene Kapitel und Phasen gewinnst du Sachen für deinen Avatar, 17 Stück auf vier Plätzen (Kopf, Gesicht, Dazu, Hintergrund). Was ein Kapitel einbringt, steht auf dem Schreibtisch neben den XP. Gewonnenes und dein Outfit stehen im Spielstand.

Dazu: Themensuche (Knopf oben oder Taste `/`), Pfeiltasten blättern, Zahlen 1 bis 4 wählen eine Quiz-Antwort, Strg/⌘ + Enter prüft deinen Code. Warum die Funktionen so gebaut sind und welche Studien dahinterstehen, steht in der App unter **„Wie diese App beim Lernen hilft“**.

## Coach Toni: deine KI, dein Schlüssel

Toni ist optional. Ohne Schlüssel läuft alles andere: Folien, Quiz, Übungen, Tests, Wiederholen, und die App passt Wiederholen und Hilfe trotzdem an dich an (siehe „Wackelt noch“). Mit Schlüssel kommt dazu:

- Chat mit Toni, der deinen Code, die Tests und dein Lernprofil kennt
- **Toni, was fehlt?** direkt in der Übung: Toni liest deinen Code nach einer roten Prüfung und sagt, welche Zeile und warum, ohne die Lösung zu verraten
- **Neue Fragen von Toni** zu jedem Thema, das bei dir wackelt, gezielt auf die Fragen, die du falsch hattest. Angeboten auch am Ende jeder Wiederholrunde und auf dem Schreibtisch, wenn nichts fällig ist
- Lernbild (wie du fragst und erklärst), Prüfung deiner eigenen Erklärungen, KI-Review zum Pull Request, eigene Kapitel
- Toni bekommt bei jeder Anfrage mit, welche Themen bei dir sitzen und welche wackeln

Einrichten im Einstieg (Bild „Dein Coach“) oder später im Profil unter **Coach Toni**: Anbieter wählen, eigenen API-Schlüssel einfügen, prüfen, Modell wählen.

| KI | Schlüssel holen |
|---|---|
| Claude | console.anthropic.com, API Keys |
| ChatGPT | platform.openai.com, API keys |
| Gemini | aistudio.google.com, Get API key (Gratis-Tarif vorhanden) |
| DeepSeek | platform.deepseek.com, API keys |

- Die Kosten laufen über dein Konto beim Anbieter, am besten setzt du dort ein Ausgabelimit.
- Toni bekommt bei jeder Anfrage seine Rolle (`TONI` in `src/app/ai.js`) und dein Niveau aus dem Einstieg mit.

### Ohne KI oder mit KI-Schlüssel?

| | Ohne KI | Mit KI-Schlüssel |
|---|---|---|
| Kapitel, Folien, Quiz, Übungen | Vollständig, für alle gleich | Gleich, dazu **Neue Fragen von Toni** zu Themen, die bei dir wackeln |
| Fehler im Code | Die Tests zeigen Rot, die Tipp-Leiter hilft Stufe für Stufe bis zur Lösung | Dazu **Toni, was fehlt?**: Toni liest deinen Code und sagt, welche Zeile und warum, ohne die Lösung zu verraten |
| Chat mit Toni | Keine freien Antworten, der Chat sagt nur, was ohne KI geht | Erklärt frei, kennt deinen Code, die Tests und dein Lernprofil |
| Selbst erklären (Folien) | Musterlösung neben deinen Worten | Dazu prüft Toni deine Erklärung vorher |
| Pull Request an Toni, eigene Kapitel | Nein | Ja |
| Schwächen erkennen | Ja, aus deinen Antworten („Wackelt noch“), ganz ohne KI gerechnet | Gleich, dazu gezielte Nachfragen und das Lernbild (wie du fragst und erklärst) |
| Wiederholen | Wachsende Abstände, Schwaches kommt früher | Genauso |
| Kosten | Keine | Pro Anfrage bei deinem Anbieter |
| Datenschutz | Nichts verlässt deinen Rechner | Anfragen mit Code und Lernstand gehen an den Anbieter (siehe unten) |
| Einrichtung | Keine | Schlüssel holen und eintragen, am sichersten mit `npm start` |

Kurz: Ohne KI lernst du strukturiert, und die App merkt sich trotzdem, was wackelt. Mit KI bekommst du dazu einen Tutor, der deinen Code liest. Dafür zahlst du pro Anfrage, und dein Übungscode verlässt den Rechner. Bei Firmenrechnern vorher klären, ob das erlaubt ist.

### Wie der Schlüssel gespeichert und übertragen wird

Es gibt drei Betriebsarten. Welche gilt, entscheidet die App beim Start selbst: Läuft sie unter `http://localhost` und antwortet `GET /api/ai` des lokalen Servers, gilt Modus 1. Sonst Modus 2, im Artefakt Modus 3.

**1. Mit `npm start` (empfohlen)**

```
Browser ──(einmal beim Speichern: Schlüssel)──▶ server.js auf 127.0.0.1 ──▶ data/secrets.json (600)
Browser ──(Frage, ohne Schlüssel)──▶ POST /api/ai/chat ──(Frage + Schlüssel, HTTPS)──▶ Anbieter
Browser ◀──(Antwort als Strom, unverändert durchgereicht)── server.js ◀── Anbieter
```

- **Speicherort:** `data/secrets.json` im Repo-Ordner, Inhalt `{ "provider", "key", "model" }` (ältere Dateien mit `anbieter` liest der Server weiter) als Klartext. Die Datei wird mit Rechten `600` angelegt (nur dein Benutzer liest und schreibt), der Ordner `data/` mit `700`. Geschrieben wird erst in eine Zwischendatei, dann umbenannt, damit nie eine halbe Datei entsteht. Hat eine vorhandene Datei zu offene Rechte, stellt der Server sie beim Start wieder auf `600`. Anderer Pfad mit `SECRETS=/pfad/zur/datei npm start`.
- **Nie im Git:** `data/` steht in `.gitignore`. Der Schlüssel steht auch nie in `progress.json` oder im Spielstand-Export.
- **Nie zurück an den Browser:** `GET /api/ai` liefert nur `{ server, provider, model, hasKey: true/false }`. Es gibt keinen Endpunkt, der den Schlüssel ausgibt. Im Formular bleibt das Feld danach leer („Gespeichert auf deinem Rechner“). Modell ändern geht ohne neuen Schlüssel.
- **Wann der Schlüssel den Browser verlässt:** nur beim Prüfen (`POST /api/ai/models`) und Speichern (`PUT /api/ai`), jeweils an `127.0.0.1`. Das ist unverschlüsseltes HTTP, bleibt aber auf deinem Rechner (Loopback). Danach hält der Browser ihn nicht mehr im Speicher.
- **Wer mit dem Anbieter spricht:** nur `server.js`, per HTTPS an fest eingetragene Adressen (`PROVIDERS` in `server.js`: api.anthropic.com, api.openai.com, api.deepseek.com, generativelanguage.googleapis.com). Der Browser kann keine andere Adresse vorgeben. Der Server liest den Schlüssel bei jeder Anfrage aus der Datei und schreibt ihn in kein Log.
- **Schutz gegen fremde Seiten:** Der Server lauscht nur auf `127.0.0.1`, nicht im Netzwerk. KI-Aufrufe nimmt er nur an, wenn der `Host`-Header `localhost`, `127.0.0.1` oder `[::1]` ist (gegen DNS-Rebinding), ein mitgeschicktes `Origin` ebenfalls lokal ist und schreibende Aufrufe `Content-Type: application/json` haben. Eine fremde Webseite kann deshalb weder per `fetch` (scheitert am CORS-Preflight, der Server sendet keine CORS-Header) noch per einfachem Formular-POST (kein JSON) deinen Schlüssel benutzen.
- **Keine statische Auslieferung:** Der Server liefert `data/`, `progress.json*` (auch ein altes `fortschritt.json*`) und alle versteckten Pfade (z. B. `.git`) nicht als Dateien aus, auch nicht über `../`.
- **Umzug von früher:** Lag ein Schlüssel noch im Browser (`localStorage`, Eintrag `ngfc.ai`), schickt die App ihn beim ersten Start mit Server einmal an `PUT /api/ai` und löscht ihn danach im Browser.
- **Entfernen:** „Schlüssel entfernen“ ruft `DELETE /api/ai` auf, das löscht `data/secrets.json`.
- **Grenzen, ehrlich gesagt:** Die Datei ist nicht verschlüsselt. Wer als dein Benutzer (oder root) auf dem Rechner etwas ausführen kann, kann sie lesen oder `127.0.0.1:4300` selbst aufrufen. Backups des Repo-Ordners enthalten die Datei. Schutz davor wäre ein Passwort-Manager oder Schlüsselbund, das ist bewusst nicht eingebaut. Setz beim Anbieter ein Ausgabelimit und nutze einen eigenen Schlüssel nur für Pixelwerk.

**2. Ohne Server** (`index.html` direkt geöffnet)

- Der Schlüssel liegt im Klartext in `localStorage` des Browsers (`ngfc.ai`), und der Browser ruft den Anbieter direkt auf (bei Claude mit dem Header `anthropic-dangerous-direct-browser-access`).
- Risiko: Jedes Script auf derselben Herkunft kann ihn lesen. Bei `file://` teilen sich je nach Browser alle lokalen HTML-Dateien diesen Speicher. Die Einstellungen und der Einstieg weisen darauf hin und empfehlen `npm start`.

**3. Im Artefakt auf claude.ai**

- Dort gibt es keinen Server. Ohne eigenen Schlüssel antwortet Toni über Claude im Artefakt (die Anfrage läuft über dein claude.ai-Konto, ein API-Schlüssel ist nicht nötig). Trägt man trotzdem einen eigenen ein, gilt Modus 2. Mit „Ganz ohne KI“ bleibt Toni still.

### Was an den Anbieter geht

Nur wenn ein Schlüssel eingetragen ist und du Toni etwas fragst oder eine KI-Funktion auslöst. Ohne KI geht nichts nach außen.

- Tonis Rolle (`TONI` in `src/app/ai.js`) und dein Niveau aus dem Einstieg
- dein Vorname aus dem Profil
- dein Lernstand: welche Themen sitzen und wackeln, mit Grund (aus `topicsNote` und `profileNote`). Das Lernbild aus deinen Fragen nur, solange „Toni darf aus meinen Fragen lernen“ an ist
- je nach Funktion: deine Frage und die letzten 10 Chat-Nachrichten, die aktuelle Folie, **dein Übungscode und die Testergebnisse**, deine eigene Erklärung oder dein Pull Request

Was der Anbieter damit macht (Speicherdauer, Training), regeln seine API-Bedingungen. Keine Firmen-Geheimnisse oder Kundendaten in die Übungen kopieren.

## Echtes Angular

Die Übungen laufen gegen **echtes Angular 22**, nicht gegen eine Nachbildung. Dein Code geht durch TypeScript und dann durch den Angular-Compiler (JIT, direkt im Browser). Fehler wie `NG0201: No provider found` kommen direkt von Angular. `HttpClient` ist echt, nur die Antworten kommen aus einem eingebauten Fake-Backend. Angular liegt gebündelt in `vendor/angular.js`. Neue Version: in `package.json` die `@angular/*`-Versionen ändern, dann `npm install && npm run vendor`.

## Inhalte und Texte ändern

Alles liegt in `src/`, daraus entsteht `index.html`. `npm start` baut bei jeder Änderung neu, danach im Browser neu laden.

- **Phasen und Kapitel**: eine Datei pro Phase in `src/content/` (`01-the-big-picture.js` …), geladen in der Reihenfolge der Dateinamen. Ein Kapitel hat Ticket, Szene, Folien, Quiz, Übung mit Tests, Merksätze und Paare zum Zuordnen (`paare: [[Begriff, Aussage], …]`, 3 bis 6 Stück, jede Aussage passt zu genau einem Begriff). Am einfachsten kopierst du ein vorhandenes Kapitel. Die Anleitung steht oben in `src/content/00-base.js`.
- **Doku-Links** eines Kapitels: Feld `doku` im Kapitel (angular.dev, rxjs.dev, MDN, typescriptlang.org).
- **Kapitel-IDs** (`k07`, `w03` …) sind die Schlüssel im Spielstand. Nie umbenennen. Die angezeigte Nummer kommt aus der Position.
- **Team und Figuren**: `CAST` in `src/content/00-base.js`.
- **Gesichter fürs Team**: `FIGUREN` in `src/app/figures.js`. Jede Figur ist aus Bausteinen gebaut (Hautton, Frisur, Kleidung, Besonderheiten wie Brille oder Bart).
- **Sachen für den Avatar**: `SACHEN` in `src/app/wardrobe.js` (Pixelbild, Platz, Bedingung). Die `id` steht im Spielstand, nie umbenennen.
- **Werkstatt-Aufgaben**: `src/workshop/tasks.js` und `src/workshop/review-school-content.js`.
- **Erklärkarten** an unterstrichenen Wörtern: `src/app/glossary.js` und `src/app/html-elements.js`.
- **Texte des Einstiegs**: `src/app/intro.js`. **Tonis Rolle**: `TONI` in `src/app/ai.js`. **Seite „Wie diese App beim Lernen hilft“**: `WISSEN` in `src/app/learning.js`.
- **Aussehen**: CSS in `src/styles/`, je Bereich eine Datei (`01-base.css`, `03-chapter.css` …), geladen in der Reihenfolge der Dateinamen. Das Seitengerüst steht in `src/shell.html`.
- **Neue Version holen**: `git pull`. Dein `progress.json` bleibt unberührt. Meldet `index.html` einen Konflikt: `npm run build`, die Datei wird aus `src/` erzeugt.
- Eigene Erweiterungen am besten auf einem eigenen Branch (`git switch -c mein-umbau`).

## Entwickeln

```bash
npm install
npx playwright install chromium   # einmalig
npm run build                      # baut index.html aus src/
npm test                           # baut, dann alle Tests
```

`npm test` prüft den Lernaufbau (Phasen, eindeutige IDs, Pflichtfelder, Quiz), alle Musterlösungen der Übungen und im echten Browser (Playwright) Einstieg, Schreibtisch, Kapitel, Übung, Wiederholen, Toni-Chat, Werkstatt, Profil, Spielstand, KI-Auswahl und den KI-Schlüssel über den lokalen Server (`tests/ai-server.test.js`).

**Artefakt-Fassung** (claude.ai): `scripts/artifact/` macht aus `index.html` die Fassung, in der Toni ohne eigenen Schlüssel über Claude im Artefakt antwortet. Dort kann man auch „Ganz ohne KI“ wählen.

```bash
node scripts/artifact/1-claude.js index.html /tmp/a.html
node scripts/artifact/2-intro.js /tmp/a.html /tmp/b.html
node scripts/artifact/3-without-ai.js /tmp/b.html artefakt.html
```

Neue JS-Dateien trägst du in `scripts/build.js` (`ORDER`) ein, der Build meldet nicht eingebundene Dateien. Neue Phasen in `src/content/` und neue CSS-Dateien in `src/styles/` findet der Build selbst.

```
src/
  shell.html            Seitengerüst: Kopfzeile, Hauptbereich
  dialogs.html          Dialoge: Themensuche und Profil (Reiter Du, Aussehen, Coach Toni, Spielstand)
  chat.html             Chat-Fenster von Coach Toni
  styles/                 CSS, eine Datei je Bereich (Grund, Start, Kapitel, Übung, Lernen, Werkstatt, Dialoge, Jubel, Chat, Einstieg)
  core/engine.js        Übungs-Laufzeit auf echtem Angular (JIT) und Test-Runner
  content/              Lern-Inhalte, eine Datei pro Phase
    00-base.js         Grundgerüst: AKTE, CH, CAST, Anleitung zum Erweitern
    01-… bis 11-…       die Phasen (01b-basics.js ist die optionale Phase Grundlagen)
  werkstatt/            Bug-Jagd, Ausgaben, Review-Arena, Review-Schule, Interview (Aufgaben und Oberfläche)
  app/
    base.js            Zustand, Speichern, Abgleich mit progress.json
    start.js            Rahmen, Routing, Schreibtisch, Tastatur
    intro.js         Spiel-Einstieg beim ersten Start
    chapter.js          Kapitel-Ablauf: Szene, Folien, Quiz, Abschluss
    matching.js         Zuordnen: Begriffe und Aussagen paaren, im Kapitel und beim Wiederholen
    exercise.js           Code-Übung mit Tipp-Leiter
    code-view.js     Code mit nummerierten Erklärungen und Wortkarten
    learning.js           Wiederholen, freie Runde, Vorab-Tipp, Lückentext, Seite „Wie diese App beim Lernen hilft“
    exam.js         Code-Checks: verlangt die Übung wirklich das geübte Konzept?
    glossary.js, html-elements.js   Erklärkarten für Wörter und HTML-Tags im Code
    ai.js               KI-Anbindung, Rolle von Toni
    chat.js, coach.js   Chat mit Toni, Lernprofil
    pr-review.js        Pull Request an Toni
    custom-chapters.js           Eigene Kapitel
    search.js            Themensuche
    settings.js              Profil-Dialog (Name, Avatar, Farben, Spielstand)
    figures.js          Pixel-Gesichter für das Team (Toni, Sara, Jonas, Mia, Leon, Katrin, Ricky)
    celebrate.js            Erfolgsmomente
scripts/build.js        setzt alles zu index.html zusammen
scripts/vendor.js       bündelt echtes Angular und RxJS nach vendor/
vendor/                 angular.js und codemirror.css (liegen im Repo, damit klonen und starten reicht)
server.js               lokaler Start: liefert die App aus, speichert progress.json, baut bei Änderungen neu
tests/                  *.test.js (Lernaufbau, Musterlösungen, Browser-Tests), helpers.js ist der gemeinsame Browser-Start
```

## Lizenz

Pixelwerk steht unter der [MIT-Lizenz](LICENSE). Das heißt: Du darfst die App kostenlos nutzen, klonen, verändern und weitergeben, auch in der Firma. Einzige Bedingung: Der Lizenztext mit dem Namen des Urhebers bleibt dabei.

Mitgelieferte fremde Teile (Angular, RxJS, CodeMirror) und ihre Lizenzen stehen in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
