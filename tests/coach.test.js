// Prüft im echten Browser das Lernprofil von Coach Toni:
// Fragen im Chat werden gemerkt (mit Fragetyp), ab 3 Fragen schreibt die KI ein Profil, es steckt in jeder Toni-Anfrage,
// eigene Stichworte vom Kapitelende (Wortlaut, Unsicherheit) fließen ein, Ausschalten und Löschen wirken (Einstellungen, Reiter „Coach Toni“).
// Dazu: „Für dich erklärt“ und das Gespräch im Kasten sind weg (kein Kasten, keine Anfrage, alter Zwischenspeicher gelöscht), Nachfragen laufen im einen Chat.
const { openPage, checker, reloadIt } = require('./helpers');
const { ok, ending } = checker();
const PROFILE = 'NIVEAU: Einsteiger (Test)\nSO FRAGT ER: kurz und direkt\nLÜCKEN: Signals\nSTÄRKEN: neugierig\nSO ERKLÄREN: kleine Schritte, Alltagsbeispiele';

(async () => {
  const { browser, ctx, page, problems } = await openPage({ hash: 'k01', standing: { player: { start: 1 } } });
  const reqs = []; let n = 0;
  await page.route('https://generativelanguage.googleapis.com/**', r => {
    const body = JSON.parse(r.request().postData() || '{}'); reqs.push(body);
    const analysis = JSON.stringify(body.systemInstruction || '').includes('Lern-Analystin');
    return r.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: analysis ? PROFILE : 'Antwort ' + (++n) }] } }] }) + '\n\n' });
  });
  const st = () => page.evaluate(() => JSON.parse(JSON.stringify(S)));
  const isAnalysis = b => JSON.stringify(b.systemInstruction || '').includes('Lern-Analystin');
  const chatReqs = () => reqs.filter(b => !isAnalysis(b));
  const userText = b => b.contents.map(c => c.parts.map(p => p.text).join('')).join('\n');
  const ask = async q => {
    const k = await page.locator('#chatLog .msg.toni').count();
    await page.fill('#chatIn', q); await page.press('#chatIn', 'Enter');
    await page.waitForFunction(k => { const m = document.querySelectorAll('#chatLog .msg.toni'); return m.length === k + 1 && /Antwort \d/.test(m[k].textContent) && !document.querySelector('#chatForm .send-btn').disabled; }, k, { timeout: 5000 });
  };

  await page.waitForFunction(() => window.ts, null, { timeout: 30000 });
  // KI-Schlüssel und ein alter „Für dich erklärt“-Zwischenspeicher liegen schon da, bevor die App startet (reloadIt stellt sicher, dass der Speicher ankommt)
  await page.evaluate(() => { localStorage.setItem('ngfc.ai', JSON.stringify({ key: 'test', model: 'gemini-2.5-flash' })); localStorage.setItem('ngfc.fuerdich', '{"f:k01:0@1":{"t":"alt","at":1}}'); });
  await reloadIt(page); await page.waitForSelector('#stepBody');
  ok(await page.evaluate(() => window.__saveOnStart.includes('ngfc.fuerdich') && !!aiCfg().key), 'Testaufbau: alter Zwischenspeicher und KI-Schlüssel waren beim Start da');

  // 1. Fragen im Chat: Verlauf geht mit
  await page.click('#toniFab');
  await ask('Warum braucht man das?');
  ok((await page.textContent('#chatLog .msg.me')).includes('Warum braucht') && (await page.textContent('#chatLog .msg.toni')).includes('Antwort 1'), 'Frage und Antwort stehen im Chat');
  await ask('versteh ich nicht, nochmal einfacher?');
  let last = chatReqs().pop();
  ok(last.contents.length === 3 && last.contents.map(c => c.role).join(',') === 'user,model,user', 'Nachfrage schickt den ganzen Verlauf mit (user, model, user)');
  ok(userText(last).includes('Warum braucht') && userText(last).includes('Antwort 1') && userText(last).includes('nochmal einfacher'), 'Erste Frage, Antwort und Nachfrage sind im Verlauf');
  ok(userText(last).includes('Kapitel „') , 'Toni weiß, in welchem Kapitel der Lernende ist');

  // 2. Lernprofil: Fragen werden gemerkt, ab 3 Fragen schreibt die KI das Profil
  let s = await st();
  ok(s.profile.questions.length === 2 && s.profile.questions[1].category.includes('verwirrt') && s.profile.questions[0].category.includes('warum') && s.profile.questions[0].ch === 'k01', 'Fragen werden mit Fragetyp und Kapitel gemerkt');
  await ask('Zeig mal ein Beispiel aus dem Job');
  await page.waitForFunction(() => S.profile && S.profile.image, null, { timeout: 5000 });
  s = await st();
  ok(s.profile.image.includes('NIVEAU: Einsteiger') && s.profile.imageN === 3, 'Nach 3 Fragen gibt es ein KI-Profil');
  const analysis = reqs.find(isAnalysis);
  ok(analysis && userText(analysis).includes('nochmal einfacher') && userText(analysis).includes('Fragen insgesamt'), 'Auswertung bekommt die Fragen und Zahlen');
  ok(JSON.parse(await page.evaluate(() => localStorage.getItem('ngfc.v1'))).profile.image.includes('Einsteiger'), 'Profil wird mit dem Spielstand gespeichert');

  // 3. Profil fließt in jede Toni-Anfrage ein
  await ask('Und wann nehme ich das?');
  last = chatReqs().pop();
  ok(userText(last).includes('LERNPROFIL') && userText(last).includes('kleine Schritte'), 'Prompt enthält das Lernprofil');
  ok(userText(last).includes('Beobachtet:'), 'Prompt enthält auch die beobachteten Muster');

  // 4. „Für dich erklärt“ ist weg: kein Kasten, keine eigene Anfrage, alter Zwischenspeicher gelöscht
  const preFd = reqs.length;
  await page.evaluate(() => { window.jumpTo = { id: 'k01', t: 'slide', i: 0 }; route(); });
  await page.waitForTimeout(300);
  ok((await page.locator('.fd').count()) === 0 && reqs.length === preFd, 'Folie: trotz Profil kein „Für dich erklärt“-Kasten und keine KI-Anfrage');
  await page.evaluate(() => { window.jumpTo = { id: 'k01', t: 'code' }; route(); });
  await page.waitForSelector('#runTests'); await page.waitForTimeout(300);
  ok((await page.locator('.fd').count()) === 0 && reqs.length === preFd, 'Übung: kein „Für dich erklärt“-Kasten und keine KI-Anfrage');
  ok(await page.evaluate(() => localStorage.getItem('ngfc.fuerdich') === null && typeof forYouSlide === 'undefined' && typeof toniConvo === 'undefined'), 'Alter Zwischenspeicher ist gelöscht, fuerDichFolie und das Gespräch im Kasten gibt es nicht mehr');

  // 5. Nachfrage aus der Übung im einen Chat: Verlauf, Ort (Aufgabe und Code) und Lernprofil gehen mit, die Frage landet im Profil
  await ask('Was ist der Unterschied?');
  last = chatReqs().pop();
  ok(last.contents.length >= 3 && last.contents[last.contents.length - 1].role === 'user' && userText(last).includes('Aufgabe:') && userText(last).includes('LERNPROFIL'), 'Nachfrage aus der Übung schickt Verlauf, Aufgabe und Lernprofil mit');
  ok(userText(last).split('Aufgabe:').length === 2, 'Der Ort steht genau einmal im Verlauf, bei der neuen Frage');
  s = await st();
  ok(s.profile.questions[s.profile.questions.length - 1].where === 'uebung' && s.profile.questions[s.profile.questions.length - 1].category.includes('unterschied'), 'Nachfrage aus der Übung wird mit Ort und Fragetyp gemerkt');

  // 6. Einstellungen, Reiter „Coach Toni“: sehen, ausschalten, löschen
  const learnImage = async () => { await page.evaluate(() => meOpen('toni')); await page.click('#hubLearnImage > summary'); await page.waitForSelector('#pfBody', { state: 'visible' }); };
  await learnImage();
  ok((await page.textContent('#pfBody')).includes('Einsteiger'), 'Einstellungen zeigen, was Toni gelernt hat');
  await page.uncheck('#pfOn');
  const nBefore = (await st()).profile.questions.length;
  await page.click('#meClose');
  await ask('Frage ohne Lernen');
  await page.waitForTimeout(200);
  ok((await st()).profile.questions.length === nBefore && !userText(chatReqs().pop()).includes('LERNPROFIL'), 'Ausgeschaltet: nichts gemerkt, kein Profil im Prompt');
  const preChip = await page.locator('#chatLog .msg.me').count();
  await page.click('#tcChips button >> nth=0');
  await page.waitForFunction(k => !document.querySelector('#chatForm .send-btn').disabled && document.querySelectorAll('#chatLog .msg.me').length === k + 1, preChip, { timeout: 5000 });
  ok(!((await st()).profile.sig || {}).hilfe, 'Ausgeschaltet: auch Signale werden nicht gezählt');
  await learnImage();
  await page.check('#pfOn'); await page.click('#pfReset');
  s = await st();
  ok(!s.profile.image && !(s.profile.questions || []).length && !s.profile.off, 'Profil löschen setzt alles zurück');
  await page.click('#meClose');

  // 7. Eigene Stichworte am Kapitelende: Wortlaut und Unsicherheit. Konzepte und verwechselte Begriffe aus einem älteren Spielstand bleiben gültig.
  await page.evaluate(() => { const p = profile(); p.concepts = { decorator: { n: 'Decorator', w: 1, s: 0, at: 2 }, signal: { n: 'Signal', w: 1, s: 0, at: 1 }, component: { n: 'Komponente', w: 0, s: 1, at: 3 } }; p.terms = ['Funktion → Methode'];
    /* Reste der abgeschafften Selbsterklärung, wie sie in älteren Spielständen liegen: Zähler und Einträge mit Urteil und Befund (auch unvollständig) */
    p.sig.erklOk = 1; p.sig.erklNo = 6; p.expl = [{ x: 'alt: das Ding macht irgendwas', kind: 'zeilen', ch: 'k01', t: 'Alt', ok: false, b: { wobbles: ['Signal'], terms: [], unsure: 'ja' }, ts: 1 }, { x: 'alt ohne Befundliste', kind: 'zeilen', ok: true, b: {}, ts: 2 }];
    save(); });
  // Der echte Weg: Kapitel bis zum letzten Schritt gespielt (ein Sprung aus der Suche zeigt den Abschluss nur zum Lesen), Stichworte eintippen, „Vergleichen“
  await page.evaluate(() => { S.steps.k01 = 999; S.ex.ex01 = { passed: true, fails: 0 }; save(); location.hash = '#k01'; route(); });
  await page.fill('#dumpIn', '1: glaube das ist eine Funktion?\n2: der Name');
  await page.click('#dumpGo');
  ok((await page.textContent('.mine')).includes('glaube das ist eine Funktion') && !(await page.locator('#dumpIn').count()), 'Kapitelende: Die Stichworte stehen nach „Vergleichen“ zum Vergleich da');
  s = await st();
  ok(s.profile.expl.length === 3 && s.profile.expl[2].kind === 'ausdemkopf' && s.profile.expl[2].ch === 'k01' && s.profile.expl[2].x.includes('glaube das ist'), 'Eigene Stichworte werden im Wortlaut gemerkt');
  ok(s.profile.sig.unsure === 1, 'Unsichere Formulierung wird erkannt');
  ok(s.profile.concepts.decorator.w === 1 && s.profile.terms.includes('Funktion → Methode'), 'Konzepte und Begriffe aus dem älteren Spielstand bleiben stehen');
  await ask('Wie schreibe ich das?');
  last = chatReqs().pop();
  ok(userText(last).includes('noch wackeln: Decorator, Signal') && userText(last).includes('Funktion → Methode'), 'Toni bekommt wackelige Konzepte und verwechselte Begriffe mit');
  await learnImage();
  ok((await page.locator('.pf-chip.no').count()) === 2 && (await page.locator('.pf-chip.ok').count()) === 1, 'Einstellungen zeigen Konzepte: wackelt / sitzt');
  await page.click('#pfNow');
  await page.waitForFunction(() => /aktualisiert/.test(document.getElementById('pfMsg').textContent), null, { timeout: 5000 });
  const ana2 = reqs.filter(isAnalysis).pop();
  ok(userText(ana2).includes('Seine eigenen Erklärungen') && userText(ana2).includes('glaube das ist eine Funktion') && userText(ana2).includes('BEGRIFFE:'), 'Profil-Auswertung analysiert die Wortwahl der eigenen Erklärungen');
  ok(userText(ana2).includes('alt: das Ding macht irgendwas') && userText(ana2).includes('alt ohne Befundliste') && !/Selbsterklärung|Befund:|noch nicht richtig|war richtig/.test(userText(ana2)), 'Auswertung: Alte Einträge der Selbsterklärung gehen als Text mit, ohne Urteil, Befund und Zähler');
  ok(await page.evaluate(() => !profileHints().some(h => /Selbsterklärung/.test(h)) && !/Selbsterklärung/.test(profileNote())), 'Lernprofil: Die alten Zähler erklOk und erklNo werden nicht mehr ausgewertet');
  await page.click('#meClose');

  await ending(browser, problems);
  console.log('\nAlles grün');
})();
