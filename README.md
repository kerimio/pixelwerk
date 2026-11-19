# Pixelwerk: Angular lernen an echten Tickets

Eine Lernplattform auf Deutsch für **Angular 22** und RxJS. Du fängst als Frontend-Dev bei der Kölner Digitalagentur Pixelwerk an, dein Mentor ist Toni. Jedes Kapitel ist ein Ticket (Bug, Feature, Incident, Code Review) mit Team-Szene, knappen Folien, Quiz und einer Code-Übung, die automatisch geprüft wird. 12 Phasen, 73 Kapitel, 64 Übungen, 235 Quizfragen. Wer ganz neu ist, beginnt mit der Phase **Grundlagen** (HTML, CSS, TypeScript, Werkbank mit Terminal, npm, Git und DevTools). Wer schon Erfahrung hat, springt direkt zu Angular. Am Ende steht ein Abschlussprojekt: ein Workshop-Planer, der in vier Etappen wächst (Liste, Server, Formular mit Signal Forms, Routen mit Guard). Jede Etappe startet mit der fertigen vorigen.

## Starten

```bash
git clone https://github.com/kerimio/pixelwerk.git
cd pixelwerk
npm start
```

Dann **http://localhost:4300** öffnen. Du brauchst nur Node (ab Version 20), kein `npm install`.

- Der Spielstand wird mit `npm start` automatisch in `fortschritt.json` im Repo-Ordner gespeichert (steht in `.gitignore`). Die vorige Fassung liegt daneben als `fortschritt.json.bak`. Zusätzlich merkt sich der Browser den Stand.
- Ohne Server geht es auch: `index.html` im Browser öffnen. Dann liegt der Spielstand nur im Browser. Sichern und einspielen geht im Profil unter **Spielstand** (Export und Import als JSON). Dort kannst du auch **ganz von vorn anfangen**: Nach einer Rückfrage sind Fortschritt, Profil und Avatar gelöscht, und der Einstieg startet neu. Hell oder dunkel und der KI-Schlüssel bleiben.

## So läuft es ab

1. **Einstieg** (nur beim ersten Start, überspringbar): Titelbild, Charakter erstellen (Name, Pixel-Avatar, Lieblingsfarbe, Mitarbeiterausweis), erster Tag mit Katrin und Toni, Team kennenlernen, **Dein Weg** (mit den Grundlagen anfangen oder direkt mit Angular starten; die Grundlagen bleiben dann als optionale Phase sichtbar, umstellbar im Profil unter **Du**), **Dein Coach** (eigene KI mit API-Schlüssel eintragen oder ohne KI weiter), Spielregeln. Im Profil kannst du ihn später nochmal ansehen.
2. **Schreibtisch** (Startseite): Begrüßung mit Rang, XP und Serie, dein nächstes Ticket, **Wiederholen** (wenn etwas fällig ist), der Weg durch die 12 Phasen, Werkstatt, Abzeichen. Alle Kapitel bleiben frei anwählbar. Die erste Phase ist kurz (zwei Kapitel), und schon im ersten schreibst du Code.
3. **Kapitel** als Ticket: **Szene** (Team-Chat zum Durchklicken, am Ende ein Vorab-Tipp), dann **Folien** (Kernsatz, Code mit nummerierten Erklärungen, „Im Job“, eingeklappt „Mehr dazu“ mit Profi-Wissen; die Links zur offiziellen Doku stehen auf der letzten Folie; unterstrichene Wörter im Code öffnen eine Erklärkarte; beim ersten Mal erklärst du die nummerierten Stellen selbst in eigenen Worten, dann kommt die Lösung mit deinen Worten darunter, mit KI-Schlüssel prüft Toni vorher), dann **Quiz** (Antworten bei jedem Öffnen gemischt), dann **Übung** (Prüfen, Tipp-Leiter bis zur Lösung, optional Pull Request an Toni), zuletzt der **Abschluss** („Was nimmst du mit?“, Merksätze, Doku-Links).
   **Geschafft** ist ein Kapitel erst mit echter Arbeit: Die Übung ist grün (auch mit Lösung), bei Kapiteln ohne Übung sind alle Quizfragen richtig. Erst dann gibt es die XP des Kapitels, Sachen für den Avatar, Abzeichen und Wiederholkarten. Wer nur durchblättert, sieht am Ende „Nur angeschaut“ mit dem Weg zurück zur Übung. Das Kapitel ist auf dem Weg halb markiert, steht bei „Wackelt noch“, und sobald die Übung grün ist, zählt es nachträglich als geschafft.
4. **Wiederholen**: Quizfragen kommen nach 1 Tag wieder, Merksätze nach 2, die Übung nach 4, danach in wachsenden Abständen (etwa 3, 7, 18 Tage), gemischt, falsche Karten in derselben Runde nochmal. Ist nichts fällig, gibt es eine freie Runde, die deine früheren Fehler (auch aus dem Kapitel-Quiz) öfter zieht. Gelöste Übungen kommen später mit leerem Startcode wieder.
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

- **Mit `npm start` bleibt dein Schlüssel lokal:** Er liegt nur in `data/secrets.json` (Dateirechte 600, `data/` steht in `.gitignore`), wird nie an den Browser zurückgegeben und nur vom lokalen Server direkt an den gewählten Anbieter geschickt. Der Browser schickt ihn genau einmal beim Prüfen und Speichern an den Server. Fragen an Toni laufen über `/api/ki/chat`. Der Server nimmt nur Aufrufe von `localhost` an und liefert `data/` nie aus. Ein Schlüssel, der von früher noch im Browser lag, zieht beim ersten Start mit Server automatisch nach `data/secrets.json` um und wird im Browser gelöscht.
- **Ohne Server** (`index.html` direkt geöffnet) geht es auch, dann liegt der Schlüssel in diesem Browser (localStorage) und der Browser ruft den Anbieter selbst auf. Die Einstellungen sagen dann dazu, dass `npm start` sicherer ist. Im Artefakt auf claude.ai gibt es keinen Server: Dort antwortet Toni über Claude im Artefakt, ganz ohne Schlüssel, oder du wählst „Ganz ohne KI“.
- Der Schlüssel steht nie in `fortschritt.json` und nie im Repo. Die Kosten laufen über dein Konto beim Anbieter, am besten setzt du dort ein Ausgabelimit.
- Toni bekommt bei jeder Anfrage seine Rolle (`TONI` in `src/app/ki.js`) und dein Niveau aus dem Einstieg mit.

## Echtes Angular

Die Übungen laufen gegen **echtes Angular 22**, nicht gegen eine Nachbildung. Dein Code geht durch TypeScript und dann durch den Angular-Compiler (JIT, direkt im Browser). Fehler wie `NG0201: No provider found` kommen direkt von Angular. `HttpClient` ist echt, nur die Antworten kommen aus einem eingebauten Fake-Backend. Angular liegt gebündelt in `vendor/angular.js`. Neue Version: in `package.json` die `@angular/*`-Versionen ändern, dann `npm install && npm run vendor`.

## Inhalte und Texte ändern

Alles liegt in `src/`, daraus entsteht `index.html`. `npm start` baut bei jeder Änderung neu, danach im Browser neu laden.

- **Phasen und Kapitel**: eine Datei pro Phase in `src/inhalte/` (`01-das-grosse-bild.js` …), geladen in der Reihenfolge der Dateinamen. Ein Kapitel hat Ticket, Szene, Folien, Quiz, Übung mit Tests und Merksätze. Am einfachsten kopierst du ein vorhandenes Kapitel. Die Anleitung steht oben in `src/inhalte/00-basis.js`.
- **Doku-Links** eines Kapitels: Feld `doku` im Kapitel (angular.dev, rxjs.dev, MDN, typescriptlang.org).
- **Kapitel-IDs** (`k07`, `w03` …) sind die Schlüssel im Spielstand. Nie umbenennen. Die angezeigte Nummer kommt aus der Position.
- **Team und Figuren**: `CAST` in `src/inhalte/00-basis.js`.
- **Gesichter fürs Team**: `FIGUREN` in `src/app/figuren.js`. Jede Figur ist aus Bausteinen gebaut (Hautton, Frisur, Kleidung, Besonderheiten wie Brille oder Bart).
- **Sachen für den Avatar**: `SACHEN` in `src/app/garderobe.js` (Pixelbild, Platz, Bedingung). Die `id` steht im Spielstand, nie umbenennen.
- **Werkstatt-Aufgaben**: `src/werkstatt/aufgaben.js` und `src/werkstatt/review-schule-inhalte.js`.
- **Erklärkarten** an unterstrichenen Wörtern: `src/app/lexikon.js` und `src/app/html-elemente.js`.
- **Texte des Einstiegs**: `src/app/einstieg.js`. **Tonis Rolle**: `TONI` in `src/app/ki.js`. **Seite „Wie diese App beim Lernen hilft“**: `WISSEN` in `src/app/lernen.js`.
- **Aussehen**: CSS in `src/stil/`, je Bereich eine Datei (`01-grund.css`, `03-kapitel.css` …), geladen in der Reihenfolge der Dateinamen. Das Seitengerüst steht in `src/shell.html`.
- **Neue Version holen**: `git pull`. Dein `fortschritt.json` bleibt unberührt. Meldet `index.html` einen Konflikt: `npm run build`, die Datei wird aus `src/` erzeugt.
- Eigene Erweiterungen am besten auf einem eigenen Branch (`git switch -c mein-umbau`).

## Entwickeln

```bash
npm install
npx playwright install chromium   # einmalig
npm run build                      # baut index.html aus src/
npm test                           # baut, dann alle Tests
```

`npm test` prüft den Lernaufbau (Phasen, eindeutige IDs, Pflichtfelder, Quiz), alle Musterlösungen der Übungen und im echten Browser (Playwright) Einstieg, Schreibtisch, Kapitel, Übung, Wiederholen, Toni-Chat, Werkstatt, Profil, Spielstand, KI-Auswahl und den KI-Schlüssel über den lokalen Server (`tests/ki-server.test.js`).

**Artefakt-Fassung** (claude.ai): `scripts/artefakt/` macht aus `index.html` die Fassung, in der Toni ohne eigenen Schlüssel über Claude im Artefakt antwortet. Dort kann man auch „Ganz ohne KI“ wählen.

```bash
node scripts/artefakt/1-claude.js index.html /tmp/a.html
node scripts/artefakt/2-einstieg.js /tmp/a.html /tmp/b.html
node scripts/artefakt/3-ohne-ki.js /tmp/b.html artefakt.html
```

Neue JS-Dateien trägst du in `scripts/build.js` (`ORDER`) ein, der Build meldet nicht eingebundene Dateien. Neue Phasen in `src/inhalte/` und neue CSS-Dateien in `src/stil/` findet der Build selbst.

```
src/
  shell.html            Seitengerüst: Kopfzeile, Hauptbereich
  dialoge.html          Dialoge: Themensuche und Profil (Reiter Du, Aussehen, Coach Toni, Spielstand)
  chat.html             Chat-Fenster von Coach Toni
  stil/                 CSS, eine Datei je Bereich (Grund, Start, Kapitel, Übung, Lernen, Werkstatt, Dialoge, Jubel, Chat, Einstieg)
  kern/engine.js        Übungs-Laufzeit auf echtem Angular (JIT) und Test-Runner
  inhalte/              Lern-Inhalte, eine Datei pro Phase
    00-basis.js         Grundgerüst: AKTE, CH, CAST, Anleitung zum Erweitern
    01-… bis 11-…       die Phasen (01b-grundlagen.js ist die optionale Phase Grundlagen)
  werkstatt/            Bug-Jagd, Ausgaben, Review-Arena, Review-Schule, Interview (Aufgaben und Oberfläche)
  app/
    basis.js            Zustand, Speichern, Abgleich mit fortschritt.json
    start.js            Rahmen, Routing, Schreibtisch, Tastatur
    einstieg.js         Spiel-Einstieg beim ersten Start
    kapitel.js          Kapitel-Ablauf: Szene, Folien, Quiz, Abschluss
    uebung.js           Code-Übung mit Tipp-Leiter
    code-anzeige.js     Code mit nummerierten Erklärungen und Wortkarten
    lernen.js           Wiederholen, freie Runde, Vorab-Tipp, Lückentext, Seite „Wie diese App beim Lernen hilft“
    pruefung.js         Code-Checks: verlangt die Übung wirklich das geübte Konzept?
    lexikon.js, html-elemente.js   Erklärkarten für Wörter und HTML-Tags im Code
    ki.js               KI-Anbindung, Rolle von Toni
    chat.js, coach.js   Chat mit Toni, Lernprofil
    pr-review.js        Pull Request an Toni
    eigene.js           Eigene Kapitel
    suche.js            Themensuche
    ich.js              Profil-Dialog (Name, Avatar, Farben, Spielstand)
    figuren.js          Pixel-Gesichter für das Team (Toni, Sara, Jonas, Mia, Leon, Katrin, Ricky)
    jubel.js            Erfolgsmomente
scripts/build.js        setzt alles zu index.html zusammen
scripts/vendor.js       bündelt echtes Angular und RxJS nach vendor/
vendor/                 angular.js und codemirror.css (liegen im Repo, damit klonen und starten reicht)
server.js               lokaler Start: liefert die App aus, speichert fortschritt.json, baut bei Änderungen neu
tests/                  *.test.js (Lernaufbau, Musterlösungen, Browser-Tests), hilfe.js ist der gemeinsame Browser-Start
```

## Lizenz

Pixelwerk steht unter der [MIT-Lizenz](LICENSE). Das heißt: Du darfst die App kostenlos nutzen, klonen, verändern und weitergeben, auch in der Firma. Einzige Bedingung: Der Lizenztext mit dem Namen des Urhebers bleibt dabei.

Mitgelieferte fremde Teile (Angular, RxJS, CodeMirror) und ihre Lizenzen stehen in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
