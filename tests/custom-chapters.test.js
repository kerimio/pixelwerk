// Prüft im echten Browser: Themensuche (Treffer, Sprung zur Folie, Kapitelwunsch) und eigene Kapitel aus dem Toni-Chat
// (KI-Antwort als JSON, Prüfung, Anzeige, Speichern, Wiederherstellen nach Neuladen, Löschen).
const { chromium } = require('playwright');
const { reloadIt } = require('./helpers');
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');
const NM = path.join(root, 'node_modules');
const URL = 'file://' + path.join(root, 'index.html');

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) fails++; };
const CHAPTER = {
  title: 'Animationen im Shop', tag: 'Animations · Übergänge',
  ticket: { category: 'Feature', heading: 'Warenkorb soll weich aufklappen', text: 'Der Warenkorb springt auf. Leon will einen <b>sanften</b> Übergang.' },
  story: [['erz', 'Dienstag, Nordlicht Mode.'], ['leon', 'Kann das <script>alert(1)</script> weicher aufgehen?'], ['nemo', 'Wer bin ich?']],
  slides: [
    { t: 'Übergänge mit CSS', say: 'Für einfache Effekte reicht CSS.', job: 'Die meisten Animations-Tickets löst du mit <code>transition</code>.', code: '.korb {\n  transition: height .2s;\n}', notes: [['transition', 'Wie schnell sich etwas ändert.'], ['gibtsnicht', 'wird verworfen']], pro: 'Bevorzuge transform und opacity.' },
    { t: 'Animation beim Einblenden', say: 'Mit @if und einer CSS-Klasse.', job: 'Modals, Toasts, Menüs.' },
    { t: 'Kaputt' }
  ],
  quiz: [
    { q: 'Was ist am günstigsten zu animieren?', options: ['transform', 'width', 'top', 'margin'], correct: 0, why: 'transform läuft auf der GPU.' },
    { q: 'Wo legst du eine einfache Transition an?', options: ['Im CSS', 'Im Service', 'In main.ts', 'Im Router'], correct: 0, why: 'CSS reicht.' },
    { q: 'kaputt', options: ['a'], correct: 3 }
  ],
  takeaway: ['transform und opacity animieren.', 'Einfache Effekte mit CSS.']
};

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('ngfc.v1')) localStorage.setItem('ngfc.v1', '{"ich":{"start":1}}'); } catch (e) {} }); // Spiel-Einstieg gilt als erlebt
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  const reqs = []; let answer = '```json\n' + JSON.stringify(CHAPTER) + '\n```';
  await ctx.route('**/*', r => {
    const u = r.request().url();
    const m = u.match(/cdn\.jsdelivr\.net\/npm\/(@?[^@]+)@[^/]+\/(.*)$/);
    if (m) return r.fulfill({ body: fs.readFileSync(path.join(NM, m[1], m[2])), contentType: 'application/javascript' });
    if (u.startsWith('https://generativelanguage.googleapis.com/')) {
      reqs.push(JSON.parse(r.request().postData() || '{}'));
      return r.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: answer }] } }] }) + '\n\n' });
    }
    if (u.startsWith('file:')) return r.continue();
    return r.abort();
  });
  const st = () => page.evaluate(() => JSON.parse(JSON.stringify(S)));

  await page.goto(URL + '#start');
  await page.waitForSelector('#searchBtn');

  // 1. Suche
  await page.click('#searchBtn');
  ok(await page.isVisible('#searchIn'), 'Suchknopf öffnet die Suche');
  await page.fill('#searchIn', 'switchmap');
  await page.waitForSelector('.search-list a');
  const heading = await page.locator('.search-list .search-t').allTextContents();
  ok(heading.length >= 1, 'Suche nach „switchmap“ findet Kapitel (' + heading.length + ')');
  ok(await page.locator('.search-list mark').count() > 0, 'Treffer sind im Text markiert');
  await page.fill('#searchIn', 'formular validator');
  await page.waitForTimeout(300);
  const t2 = await page.locator('.search-list .search-t').allTextContents();
  ok(t2.some(t => /Bewerbungsformular/.test(t)), 'Mehrere Wörter grenzen ein und finden „Das Bewerbungsformular“');
  const where = await page.locator('.search-list a').first().locator('.search-where').textContent().catch(() => '');
  await page.locator('.search-list a').first().click();
  await page.waitForTimeout(400);
  ok(!(await page.isVisible('#searchDlg')), 'Klick auf Treffer schließt die Suche');
  ok(/Verstehen|Ticket|Quiz|Umsetzen|Abschluss/.test(await page.textContent('#stepQuiet')) && (await page.evaluate(() => location.hash)).length > 1, 'Treffer öffnet das Kapitel (' + where + ')');
  if (/Folie/.test(where)) ok((await page.textContent('#stepQuiet')).startsWith('Verstehen'), 'Treffer springt direkt zur passenden Folie');
  await page.keyboard.press('/');
  ok(await page.isVisible('#searchDlg'), 'Taste / öffnet die Suche');
  await page.fill('#searchIn', 'quantencomputer');
  await page.waitForTimeout(300);
  ok((await page.locator('.search-list a').count()) === 0 && await page.isVisible('#searchChapter'), 'Ohne Treffer bietet die Suche ein eigenes Kapitel an');

  // 2. Kapitelwunsch ohne KI: Der Chat geht auf und erklärt, was fehlt. Kein Eingabefeld, nichts im Verlauf.
  await page.evaluate(() => { localStorage.removeItem('ngfc.ai'); });
  await page.click('#searchChapter');
  ok(!(await page.isVisible('#searchDlg')) && await page.isVisible('#tcWithout') && !(await page.isVisible('#chatIn')) && (await page.locator('#chatLog .msg').count()) === 0, 'Ohne KI: Der Kapitelwunsch aus der Suche öffnet den Chat, der erklärt, was fehlt');
  ok(/KI-Schlüssel/.test(await page.textContent('#tcWithout')) && (await page.textContent('#tcSetup')).includes('Coach Toni'), 'Der Hinweis nennt den Schlüssel und den Weg zu „Coach Toni“');
  await page.click('#tcSetup');
  ok(await page.isVisible('#meDlg[open] #aiKey'), '„Coach Toni einrichten“ öffnet die Einstellungen im Reiter „Coach Toni“');
  await page.click('#meClose');

  // 3. Mit Gemini: Knopf „Neues Kapitel“, JSON wird geprüft und eingehängt
  await page.evaluate(() => { localStorage.setItem('ngfc.ai', JSON.stringify({ key: 'test', model: 'gemini-2.5-flash' })); location.hash = 'start'; });
  await page.waitForSelector('#chatIn', { state: 'visible' }); await page.waitForSelector('.hub');
  await page.click('#chatChapter');
  ok((await page.getAttribute('#chatIn', 'placeholder')).startsWith('Thema'), 'Knopf schaltet das Eingabefeld auf Themenwunsch');
  await page.fill('#chatIn', 'Angular Animations'); await page.press('#chatIn', 'Enter');
  await page.waitForSelector('#chatLog a[href^="#e"]', { timeout: 8000 });
  const req = reqs[reqs.length - 1];
  ok(JSON.stringify(req.contents).includes('Angular Animations') && req.generationConfig.responseMimeType === 'application/json', 'Prompt enthält das Thema und fordert JSON an');
  ok(JSON.stringify(req.contents).includes('Das Bewerbungsformular'), 'Prompt kennt die vorhandenen Kapitel');
  let s = await st(); const ids = Object.keys(s.customChapters);
  ok(ids.length === 1, 'Kapitel ist im Fortschritt gespeichert (S.eigene)');
  const k = s.customChapters[ids[0]];
  ok(k.slides.length === 2 && k.quiz.length === 2, 'Kaputte Folien und Quizfragen werden aussortiert');
  ok(k.slides[0].notes.length === 1, 'Zeilen-Erklärungen ohne passenden Code fliegen raus');
  ok(k.story[1][1].includes('&lt;script&gt;') && k.story[2][0] === 'toni', 'HTML in der Szene wird entschärft, unbekannte Figur wird Toni');
  ok(k.quiz[0].options[k.quiz[0].correct] === 'transform', 'Antworten gemischt, richtige Antwort stimmt weiter');
  ok((await page.textContent('#chatLog .msg.toni >> nth=-1')).includes('auf dem Schreibtisch') && await page.locator('.hub-path details[data-p="E"] a.hub-k').getByText('Animationen im Shop').count() === 1, 'Kapitel steht sofort auf dem Schreibtisch im Weg, unter „Eigene Kapitel“');
  await page.click('#chatLog a[href^="#e"]');
  await page.waitForTimeout(300);
  ok((await page.textContent('.ch-head h1')) === 'Animationen im Shop' && await page.isVisible('#customDel'), 'Kapitel öffnet sich, mit Hinweis und Löschen-Knopf');
  ok((await page.textContent('#stepQuiet')).includes('von 6'), 'Schritte: Ticket, 2 Folien, 2 Quizfragen, Abschluss');
  await page.click('.cp-all'); await page.click('#cpAccept');
  await page.click('#nextStep'); await page.waitForTimeout(200);
  ok(await page.isVisible('.anno'), 'Folie mit Code und Zeilen-Erklärungen wird angezeigt');

  // 4. Nach Neuladen wieder da, Suche findet es
  await reloadIt(page); await page.waitForSelector('.ch-head h1');
  ok((await page.textContent('.ch-head h1')) === 'Animationen im Shop', 'Nach dem Neuladen ist das eigene Kapitel wieder da');
  await page.click('#searchBtn'); await page.fill('#searchIn', 'transition'); await page.waitForTimeout(300);
  ok((await page.locator('.search-list .search-t').allTextContents()).some(t => t.includes('Animationen im Shop')), 'Suche findet auch eigene Kapitel');
  await page.click('#searchClose');

  // 5. Unbrauchbare Antwort: zweiter Versuch, dann Fehlermeldung
  answer = 'Tut mir leid, kein JSON.'; const previous = reqs.length;
  await page.evaluate(() => toniOpen());
  await page.fill('#chatIn', 'Erstell mir ein Kapitel über Web Components'); await page.press('#chatIn', 'Enter');
  await page.waitForSelector('#chatLog .ai-err >> text=nicht sauber gelungen', { timeout: 8000 });
  ok(reqs.length - previous === 2, 'Bei kaputter Antwort versucht Toni es ein zweites Mal');
  ok(Object.keys((await st()).customChapters).length === 1, 'Kaputtes Kapitel wird nicht gespeichert');

  // 6. Löschen
  await page.evaluate(id => { location.hash = id; }, ids[0]); await page.waitForTimeout(300);
  await page.click('#customDel'); await page.waitForTimeout(300);
  s = await st();
  ok(!Object.keys(s.customChapters).length && !(await page.evaluate(() => CH.some(c => c.custom))) && !(await page.evaluate(() => ACTS.some(a => a.n === 'E'))), 'Löschen entfernt Kapitel und leere Phase');

  ok(errors.length === 0, 'Keine JS-Fehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fails ? '\n' + fails + ' Fehler' : '\nAlles grün');
  process.exit(fails ? 1 : 0);
})();
