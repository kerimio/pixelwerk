// Prüft im echten Browser: „Pull Request an Toni“. Erst nach grünen Tests zu sehen. Automatische Review ohne KI (Approve,
// Änderungen mit Zeilenkommentaren und Markierung im Editor), die KI-Review als JSON (Zeilen, Urteil, Runde 2) und
// „Toni antworten“ im einen Chat (Toni bekommt die Review mit).
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '..');
const NM = path.join(root, 'node_modules');
const URL = 'file://' + path.join(root, 'index.html');

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) fails++; };

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 1300, height: 900 } });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('ngfc.v1')) localStorage.setItem('ngfc.v1', '{"ich":{"start":1}}'); } catch (e) {} }); // Spiel-Einstieg gilt als erlebt
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const reqs = []; let answer = '';
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
  await page.goto(URL);
  await page.waitForFunction(() => typeof CH !== 'undefined' && CH.length);
  const chId = await page.evaluate(() => CH.find(c => c.ex && c.ex.id === 'ex10').id);
  await page.evaluate(id => { window.jumpTo = { id, t: 'code' }; location.hash = id; }, chId);
  await page.waitForSelector('#runTests');
  await page.waitForFunction(() => window.ts, null, { timeout: 30000 });
  const setCode = c => page.evaluate(c => document.querySelector('.CodeMirror').CodeMirror.setValue(c), c);
  const { solution, starter } = await page.evaluate(() => CH.find(c => c.ex && c.ex.id === 'ex10').ex);

  // 1. Der PR-Knopf kommt erst nach grünen Tests. Startcode wird nie eingereicht.
  ok(await page.locator('#prBtn').isHidden(), 'Vor grünen Tests gibt es keinen PR-Knopf');
  await page.click('#runTests');
  await page.waitForSelector('#tests .test.bad, #tests .test.fatal', { timeout: 20000 });
  ok(await page.locator('#prBtn').isHidden(), 'Auch nach roten Tests gibt es keinen PR-Knopf');
  await setCode(solution);
  await page.click('#runTests');
  await page.waitForSelector('#prBtn', { state: 'visible', timeout: 20000 });
  ok((await page.textContent('#prBtn')) === 'Als Pull Request an Toni schicken', 'Nach grünen Tests: „Als Pull Request an Toni schicken“');
  await setCode(starter);
  await page.click('#prBtn');
  ok(await page.locator('#prBox').isHidden(), 'Unveränderter Startcode wird nicht reviewt');

  // 2. Saubere Lösung ohne KI: Approve
  const xp0 = await page.evaluate(() => S.xp);
  await setCode(solution);
  await page.click('#prBtn');
  await page.waitForSelector('#prBox .pr-status', { timeout: 20000 });
  ok((await page.textContent('#prBox .pr-status')).includes('Approved'), 'Musterlösung wird approved');
  ok(await page.locator('#prBox .pr-lob').count() >= 1, 'Toni lobt etwas Konkretes an einer Zeile');
  ok(await page.locator('#prBox .pr-l.fresh').count() >= 3, 'Neue Zeilen sind wie im Diff markiert');
  ok(await page.evaluate(() => S.ex.ex10.pr.verdict === 'approve' && S.ex.ex10.passed), 'Urteil wird gespeichert');
  ok((await page.evaluate(() => S.xp)) - xp0 === 20, 'Approve bringt 20 XP');
  ok(await page.isVisible('#cheerCard'), 'Approve wird gefeiert');
  ok(await page.locator('#prAnswer').count() === 0 && await page.isVisible('#prKi'), 'Ohne KI: kein „Toni antworten“, dafür der Weg zu „Coach Toni einrichten“');
  await page.waitForFunction(() => !document.querySelector('#prBtn').disabled);
  ok((await page.textContent('#prBtn')) === 'Pull Request neu einreichen', 'Nach der Review heißt der Knopf „Pull Request neu einreichen“');
  await page.click('#prBtn');
  await page.waitForFunction(() => !document.querySelector('#prBtn').disabled && document.querySelector('#prBox .pr-status'), null, { timeout: 20000 });
  ok((await page.evaluate(() => S.xp)) - xp0 === 20, 'Zweites Approve gibt kein zweites Mal XP');

  // 3. Code mit Problemen ohne KI: Änderungen angefragt
  const poor = solution
    .replace('this._team.update(liste => liste.filter(person => person.id !== id));', 'console.log(id);\n    this._team().splice(id, 1);')
    .replace('readonly anzahl = computed(() => this._team().length);', 'readonly anzahl: any = computed(() => this._team().length);');
  await setCode(poor);
  await page.click('#prBtn');
  await page.waitForFunction(() => document.querySelector('#prBox .pr-status') && document.querySelector('#prBox .pr-status').textContent.includes('Änderungen'), null, { timeout: 20000 });
  const lineSplice = poor.split('\n').findIndex(l => l.includes('.splice(')) + 1;
  const must = await page.evaluate(() => [...document.querySelectorAll('#prBox .pr-must .pr-goto')].map(b => +b.dataset.z));
  ok(must.includes(lineSplice), 'Must-fix sitzt an der Zeile mit splice (' + lineSplice + ')');
  ok(await page.locator('#prBox .pr-nit').count() >= 2, 'console.log und any werden als Nits angemerkt');
  ok(await page.locator('#prBox .pr-must').filter({ hasText: 'Test noch rot' }).count() >= 1, 'Rote Tests sind ein Must-fix');
  ok(await page.evaluate(() => document.querySelectorAll('.CodeMirror .rv-must').length >= 1), 'Zeile ist im Editor markiert');
  await page.click('#prBox .pr-must .pr-goto[data-z="' + lineSplice + '"]');
  ok(await page.evaluate(() => document.querySelector('.CodeMirror').CodeMirror.getCursor().line) === lineSplice - 1, '„Zeile im Editor“ springt an die Stelle');
  await setCode(poor + '\n');
  ok(await page.evaluate(() => document.querySelectorAll('.CodeMirror .rv-must').length === 0), 'Markierungen verschwinden beim Weiterschreiben');

  // 4. Mit KI: JSON-Review, Zeilen und Urteil werden übernommen, Runde 2 bekommt alte Kommentare
  await page.evaluate(() => localStorage.setItem('ngfc.ai', JSON.stringify({ key: 'test', model: 'gemini-2.5-flash' })));
  answer = JSON.stringify({ verdict: 'approve', summary: 'Fast gut, **Kerim**.', comments: [
    { codeLine: 3, kind: 'lob', text: 'Interface sauber.' },
    { codeLine: lineSplice, kind: 'must', text: 'splice verändert das Signal von innen.', suggestion: 'this._team.update(liste => liste.filter(person => person.id !== id));' },
    { codeLine: 999, kind: 'quatsch', text: 'Zeile gibt es nicht.' }
  ] });
  await page.click('#prBtn');
  await page.waitForFunction(() => document.querySelector('#prBox .pr-sum') && document.querySelector('#prBox .pr-sum').textContent.includes('Fast gut'), null, { timeout: 20000 });
  const body = JSON.stringify(reqs[reqs.length - 1] || {});
  ok(body.includes('Angular-22-Regeln') && /\b\d+ \| /.test(body) && body.includes('application/json'), 'Prompt enthält Team-Regeln, nummerierte Zeilen und fordert JSON');
  ok(/Runde [23]/.test(body) && body.includes('Deine Kommentare aus der letzten Runde'), 'Runde 2: Toni bekommt seine alten Kommentare mit');
  ok((await page.textContent('#prBox .pr-status')).includes('Änderungen'), 'Must-fix macht aus „approve“ ein „Änderungen angefragt“');
  ok(await page.locator('#prBox .pr-must pre.code').count() === 1, 'Vorschlag wird als Code gezeigt');
  ok(await page.evaluate(() => [...document.querySelectorAll('#prBox .pr-nit .pr-goto')].some(b => +b.dataset.z === document.querySelector('.CodeMirror').CodeMirror.lineCount())), 'Ungültige Zeile/Art wird auf letzte Zeile und Nit begrenzt');

  // 5. „Toni antworten“ führt in den einen Chat, Toni kennt dort seine Review. „Review schließen“ räumt auf.
  answer = 'Klar, frag ruhig.';
  await page.click('#prAnswer');
  ok(await page.evaluate(() => document.body.classList.contains('chat-open') && !document.querySelector('#main #aiOut')), '„Toni antworten“ öffnet den Chat (kein eigener KI-Kasten in der Übung)');
  ok((await page.locator('#tcChips button').allTextContents()).join('|') === 'Erklär mir die Review', 'Im Chat passt die Schnellfrage zur Review: „Erklär mir die Review“');
  await page.fill('#chatIn', 'Wieso ist splice hier falsch?'); await page.press('#chatIn', 'Enter');
  await page.waitForFunction(() => /Klar, frag ruhig/.test(document.querySelector('#chatLog').textContent), null, { timeout: 5000 });
  const question = JSON.stringify(reqs[reqs.length - 1]);
  ok(question.includes('Du hast seinen Pull Request reviewt') && question.includes('splice verändert das Signal von innen') && question.includes('Wieso ist splice hier falsch?'), 'Toni bekommt im Chat seine Review-Kommentare und die Rückfrage');
  await page.evaluate(() => { const cm = document.querySelector('.CodeMirror').CodeMirror; cm.setValue(cm.getValue() + '\n// Fix kommt'); });
  await page.waitForFunction(() => document.querySelectorAll('#tcChips button').length !== 1 || document.querySelector('#tcChips').textContent !== 'Erklär mir die Review');
  ok(!(await page.textContent('#tcChips')).includes('Review'), 'Schreibt er am Code weiter, gehört die Schnellfrage wieder zur Übung');
  await page.click('#chatClose');
  await page.click('#prClose');
  ok(await page.evaluate(() => document.activeElement.id === 'prBtn'), '„Review schließen“ setzt den Fokus zurück auf den PR-Knopf');
  ok(await page.locator('#prBox').isHidden() && await page.evaluate(() => document.querySelectorAll('.CodeMirror [class*="rv-"]').length === 0), '„Review schließen“ blendet die Review aus und nimmt die Markierungen weg');

  ok(!errors.length, 'Keine JS-Fehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fails ? '\n' + fails + ' Fehler' : '\nAlles grün');
  process.exit(fails ? 1 : 0);
})();
