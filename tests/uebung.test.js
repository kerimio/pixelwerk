// Prüft im echten Browser die Code-Übung und den einen Toni-Chat:
// drei Knöpfe, Hilfe-Leiter Sprosse für Sprosse, XP-Regeln, „Weiter“ als Hauptknopf nach grün, PR-Knopf erst nach grün,
// „Neu anfangen“ mit Rückfrage, Regeln der Wiederholung, Reihenfolge am Handy.
// Chat: Zustand ohne Schlüssel, Schnellfragen je nach Ort, Ort/Code/Tests im Prompt, Lernprofil-Signale, Vorkenntnisse.
const { oeffnen, pruefer } = require('./hilfe');
const { ok, ende } = pruefer();

(async () => {
  const { browser, page, fehler } = await oeffnen({ hash: 'k01', stand: { ich: { start: 1 } } });
  const reqs = []; let n = 0, bremse = 0;
  await page.route('https://generativelanguage.googleapis.com/**', async r => {
    reqs.push(JSON.parse(r.request().postData() || '{}'));
    if (bremse) await new Promise(f => setTimeout(f, bremse));
    return r.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Antwort ' + (++n) }] } }] }) + '\n\n' });
  });
  const text = b => b.contents.map(c => c.parts.map(p => p.text).join('')).join('\n');
  const letzte = () => reqs[reqs.length - 1];
  const st = () => page.evaluate(() => JSON.parse(JSON.stringify(S)));
  const zurUebung = id => page.evaluate(id => { window.sprungZu = { id, t: 'code' }; if (location.hash === '#' + id) route(); else location.hash = id; }, id);
  const code = () => page.evaluate(() => document.querySelector('#editor .CodeMirror').CodeMirror.getValue());
  const setCode = c => page.evaluate(c => document.querySelector('#editor .CodeMirror').CodeMirror.setValue(c), c);
  const pruefen = async () => { await page.click('#runTests'); await page.waitForFunction(() => document.querySelector('#runTests').textContent === 'Prüfen' && document.querySelector('#tests .test.ok, #tests .test.bad, #tests .test.fatal'), null, { timeout: 20000 }); };
  const sichtbar = sel => page.locator(sel).first().isVisible();
  const hauptknoepfe = () => page.evaluate(() => [...document.querySelectorAll('#main .btn.primary')].filter(b => b.offsetParent).map(b => b.id));
  const antworten = k => page.waitForFunction(k => { const m = document.querySelectorAll('#chatLog .msg.toni'); return m.length === k && m[k - 1].textContent.includes('Antwort ' + k); }, k);

  await page.waitForFunction(() => window.ts, null, { timeout: 30000 });
  const ex1 = await page.evaluate(() => { const e = CH.find(c => c.id === 'k01').ex; return { id: e.id, hints: e.hints.length, starter: e.starter, solution: e.solution }; });
  await zurUebung('k01');
  await page.waitForSelector('#runTests');

  // 1. Zwei Knöpfe, sonst nichts. Toni gibt es einmal: unten rechts.
  ok((await page.locator('.ex-actions button').allTextContents()).join('|') === 'Prüfen|Tipp' && !(await page.locator('#ubToni').count()) && await sichtbar('#toniFab'), 'Übung hat genau zwei Knöpfe: Prüfen, Tipp. „Toni fragen“ steht nur unten rechts');
  ok(await page.evaluate(() => { const li = document.querySelector('.task .todo li'); return getComputedStyle(li, '::before').content === 'none' && getComputedStyle(li).listStyleType === 'disc'; }), 'Die Aufgaben sind eine schlichte Aufzählung ohne Kästchen (abgehakt wird in der Testliste)');
  ok(await page.evaluate(() => !document.querySelector('#aiHint, #lexMine, #explainMine, #fadeSol, #showSol, #fdHost, #main #aiOut, .fd')), 'Alte Knöpfe, Links und der Kasten „Für dich erklärt“ sind weg');
  ok((await page.locator('.ex-more button:visible').allTextContents()).join('|') === 'Neu anfangen', 'Leise darunter nur „Neu anfangen“');
  ok(!(await sichtbar('#prBtn')), 'PR-Knopf ist vor grünen Tests nicht zu sehen');
  ok((await hauptknoepfe()).join() === 'runTests', 'Eine Hauptaktion: „Prüfen“ („Weiter“ ist noch leise)');
  await page.click('#editor .CodeMirror-lines'); await page.keyboard.press('Tab'); await page.keyboard.press('Escape');
  ok(await page.evaluate(() => document.activeElement.id === 'runTests' && /Escape/.test(document.querySelector('#editor textarea').getAttribute('aria-label'))), 'Tastatur: Tab rückt im Editor ein, Escape führt heraus zu „Prüfen“');
  await setCode(ex1.starter);

  // 2. Hilfe-Leiter: Tipp 1 … n, Lösung mit Lücken, ganze Lösung mit Rückfrage
  ok(ex1.hints === 2, 'Übung ex01 hat zwei Tipps (Annahme dieses Tests)');
  await page.click('#hintBtn');
  ok((await page.locator('#hints .hint').count()) === 1 && (await page.textContent('#hintBtn')) === 'Tipp 2 von 2', 'Erster Klick zeigt Tipp 1, der Knopf nennt die nächste Sprosse');
  await page.click('#hintBtn');
  ok((await page.locator('#hints .hint').count()) === 2 && (await page.textContent('#hintBtn')) === 'Lösung mit Lücken zeigen', 'Nach dem letzten Tipp kommt „Lösung mit Lücken zeigen“');
  await page.click('#hintBtn');
  ok((await page.textContent('#solBox')).includes('____') && !(await page.textContent('#solBox')).includes('Willkommen im Team'), 'Lösung mit Lücken zeigt Lücken statt der Antwort');
  ok((await page.textContent('#hintBtn')) === 'Ganze Lösung zeigen' && (await page.locator('#hints .hint').count()) === 2, 'Dann „Ganze Lösung zeigen“, die Tipps bleiben stehen');
  await page.click('#hintBtn');
  ok((await page.textContent('#ubFrage')).includes('Erst selbst probieren bringt mehr. Trotzdem zeigen?') && !(await page.locator('#solBox .anno').count()), 'Ganze Lösung: erst die Rückfrage, noch keine Lösung');
  ok(!(await st()).ex[ex1.id], 'Rückfrage allein kostet nichts');
  await page.click('#ubFrage .linkbtn');
  ok(!(await page.locator('.ub-frage').count()) && await page.isEnabled('#hintBtn') && (await page.textContent('#solBox')).includes('____'), '„Weiter probieren“ nimmt die Rückfrage zurück');
  await page.click('#hintBtn'); await page.click('#ubFrage .btn');
  ok((await page.locator('#solBox .anno').count()) === 1 && (await page.textContent('#solBox')).includes('Willkommen im Team'), 'Zweiter Klick zeigt die ganze Lösung mit Erklärungen');
  ok((await st()).ex[ex1.id].usedSolution === true && !(await sichtbar('#hintBtn')), 'Gezeigte Lösung wird gemerkt, die Leiter ist zu Ende');

  // 3. XP: rot kostet nichts, grün nach gezeigter Lösung bringt 15 statt 50
  let xp = (await st()).xp;
  await pruefen();
  let s = await st();
  ok(s.xp === xp && s.ex[ex1.id].fails === 1 && !s.ex[ex1.id].passed, 'Rote Tests: kein XP, Fehlversuch gezählt');
  ok(await sichtbar('#tests .test.bad') && !(await sichtbar('#prBtn')), 'Rote Tests zeigen, was fehlt. Kein PR-Knopf.');
  await setCode(ex1.solution);
  await pruefen();
  s = await st();
  ok(s.xp - xp === 15 && s.ex[ex1.id].passed, 'Grün nach gezeigter Lösung: 15 XP');
  ok(await sichtbar('.pass') && await sichtbar('#jubelKarte'), 'Grüne Tests werden gefeiert');
  ok(await sichtbar('#prBtn') && (await page.textContent('#prBtn')) === 'Als Pull Request an Toni schicken', 'Nach grün erscheint leise „Als Pull Request an Toni schicken“');
  ok((await hauptknoepfe()).join() === 'nextStep', 'Nach grün ist „Weiter“ die Hauptaktion');
  await pruefen();
  ok((await st()).xp - xp === 15, 'Nochmal prüfen gibt kein zweites Mal XP');

  // 4. „Neu anfangen“ mit Rückfrage
  await page.click('#resetCode');
  ok((await page.textContent('#ubNeu')).includes('Deinen Code verwerfen?') && (await code()) === ex1.solution, '„Neu anfangen“ fragt erst nach');
  await page.click('#ubNeu .linkbtn');
  ok((await code()) === ex1.solution && await sichtbar('#resetCode'), '„Abbrechen“ lässt den Code stehen');
  await page.click('#resetCode'); await page.click('#ubNeu .btn');
  ok((await code()) === ex1.starter && (await st()).code[ex1.id] === ex1.starter, '„Ja, neu anfangen“ setzt auf den Startcode zurück');
  await page.click('#resetCode');
  ok(!(await page.locator('.ub-frage').count()), 'Beim Startcode gibt es nichts zu verwerfen: keine Rückfrage');

  // 5. Schritt verlassen: „Weiter“ ist wieder die Hauptaktion des Kapitels
  await page.click('#prevStep');
  /* Davor liegt das Zuordnen: Solange es nicht gespielt ist, ist „Weiter“ dort auch nur ein normaler Knopf */
  if (await page.locator('#stepBody .zu').count()) {
    ok(await page.evaluate(() => !document.querySelector('#nextStep').classList.contains('primary') && currentExercise === null), 'Nach dem Verlassen der Übung: Beim offenen Zuordnen davor ist „Weiter“ ein normaler Knopf');
    await page.click('#prevStep');
  }
  ok(await page.evaluate(() => !!document.querySelector('#stepBody .quiz .opt:not(:disabled)') && !document.querySelector('#nextStep').classList.contains('primary') && currentExercise === null), 'Nach dem Verlassen der Übung: Im offenen Quiz davor ist „Weiter“ ein normaler Knopf');
  await page.click('#kpWeg .kp-ph >> nth=1');
  ok(await page.evaluate(() => !!document.querySelector('#stepBody .slide') && document.querySelector('#nextStep').classList.contains('primary')), 'Auf der Folie ist „Weiter“ wieder Hauptknopf');

  // 6. Ohne Lösung gelöst: 50 XP, Tipps kosten nichts. Danach gibt es die Musterlösung ohne Rückfrage und ohne Abzug.
  const k2 = await page.evaluate(() => { const c = CH.filter(c => c.ex && c.id !== 'k01' && c.akt !== 'B')[1]; return { id: c.id, ex: c.ex.id, solution: c.ex.solution }; });
  await zurUebung(k2.id);
  await page.waitForFunction(id => currentExercise && currentExercise.ex.id === id, k2.ex);
  xp = (await st()).xp;
  await page.click('#hintBtn');
  /* Die Leiter bis zur Rückfrage hochklettern, sie aber offen stehen lassen */
  for (let i = 0; i < 8 && !(await page.locator('#ubFrage .ub-frage').count()); i++) await page.click('#hintBtn');
  ok(await page.locator('#ubFrage .ub-frage').count() === 1 && await page.isDisabled('#hintBtn'), 'Vor dem Lösen steht die Rückfrage „Trotzdem zeigen?“ offen da');
  await setCode(k2.solution);
  await pruefen();
  s = await st();
  ok(s.xp - xp === 50 && !s.ex[k2.ex].usedSolution, 'Gelöst mit Tipp, ohne Lösung: volle 50 XP');
  ok(!(await page.locator('.ub-frage').count()) && (await page.textContent('#ubFrage')) === '', 'Nach dem Lösen ist die offene Rückfrage weg');
  ok((await page.textContent('#hintBtn')) === 'Musterlösung zeigen' && await page.isEnabled('#hintBtn'), 'Nach dem Lösen bietet die Leiter die Musterlösung an');
  await page.click('#hintBtn');
  ok((await page.locator('#solBox .anno').count()) === 1 && !(await page.locator('.ub-frage').count()) && !(await st()).ex[k2.ex].usedSolution, 'Musterlösung nach dem Lösen: sofort und ohne Abzug');

  // 7. Wiederholung („Aus dem Kopf“): eigener Zustand, Tipps und Lösung zählen wie bisher
  const rv = async (schritte) => {
    await page.evaluate(() => { location.hash = 'wdh'; });
    await page.waitForFunction(() => location.hash === '#wdh' && !currentExercise);
    await page.evaluate(() => { const c = CH.find(c => c.id === 'k01'); window.rvErgebnis = null; const m = document.querySelector('#main'); m.innerHTML = '<div></div>'; renderCode(m.firstElementChild, c.ex, c, { review: true, onPass: r => { window.rvErgebnis = JSON.parse(JSON.stringify(r)); } }); });
    await page.waitForSelector('#runTests');
    await schritte();
    await setCode(ex1.solution); await pruefen();
    const erg = await page.evaluate(() => window.rvErgebnis);
    await page.evaluate(() => { location.hash = 'start'; });
    await page.waitForFunction(() => location.hash === '#start' && !currentExercise);
    return erg;
  };
  const vorher = (await st()).code[ex1.id];
  let r = await rv(async () => { ok((await code()) === ex1.starter, 'Wiederholung startet mit leerem Startcode'); await page.click('#hintBtn'); });
  ok(r && r.passed && r.hints === 1 && !r.sol, 'Wiederholung: ein Tipp zählt als „mit Hilfe“');
  ok((await st()).code[ex1.id] === vorher, 'Wiederholung überschreibt den gespeicherten Code nicht');
  r = await rv(async () => { for (let i = 0; i < 4; i++) await page.click('#hintBtn'); await page.click('#ubFrage .btn'); });
  ok(r && r.sol === true && r.hints === 2, 'Wiederholung: gezeigte Lösung zählt als nicht gewusst');

  // 8. Schmal (Handy-Breite): Aufgabe, Editor, Knöpfe, Tests, Vorschau untereinander, nichts läuft seitlich raus
  await page.setViewportSize({ width: 360, height: 780 });
  const kv = await page.evaluate(() => CH.find(c => c.ex && c.ex.preview).id);
  await zurUebung(kv);
  await page.waitForFunction(() => currentExercise && currentExercise.ex.preview && document.querySelector('#preview'));
  const lage = await page.evaluate(() => { const y = s => document.querySelector(s).getBoundingClientRect().top; return { o: ['.task', '.editor-wrap', '.ex-actions', '#tests', '.preview-wrap'].map(y), quer: document.scrollingElement.scrollWidth - innerWidth, klein: [...document.querySelectorAll('.ex-actions .btn, .ex-more .linkbtn')].filter(b => b.offsetParent).map(b => b.getBoundingClientRect().height).filter(h => h < 40), knoepfe: [...document.querySelectorAll('.ex-actions .btn, .ex-more .linkbtn')].filter(b => b.offsetParent).length }; });
  ok(lage.o.every((v, i) => !i || v > lage.o[i - 1]), 'Schmal: Aufgabe → Editor → Knöpfe → Tests → Vorschau');
  ok(lage.quer <= 0, 'Schmal: kein Querscrollen (' + lage.quer + ' px)');
  ok(lage.knoepfe === 3 && !lage.klein.length, 'Schmal: Tippflächen mindestens 40 px hoch');
  const lang = await page.evaluate(() => { const wort = c => Math.max(...c.ex.hints.concat(c.ex.todo).join(' ').replace(/<[^>]+>/g, '').split(/\s+/).map(w => w.length)); const c = CH.filter(c => c.ex && c.ex.hints.length > 1).sort((a, b) => wort(b) - wort(a))[0]; return { id: c.id, tipps: c.ex.hints.length, wort: wort(c) }; });
  await zurUebung(lang.id);
  await page.waitForFunction(id => currentExercise && currentExercise.ch.id === id, lang.id);
  for (let i = 0; i < lang.tipps + 1; i++) await page.click('#hintBtn');
  await pruefen();
  ok(await page.evaluate(() => document.querySelectorAll('#hints .hint').length > 1 && !!document.querySelector('#tests .test.bad') && document.scrollingElement.scrollWidth <= innerWidth), 'Schmal: lange Code-Wörter in Aufgabe, Tipps und Testmeldungen brechen um (längstes: ' + lang.wort + ' Zeichen, kein Querscrollen)');
  await zurUebung(kv);
  await page.waitForFunction(() => currentExercise && currentExercise.ex.preview && document.querySelector('#preview'));
  await page.setViewportSize({ width: 1300, height: 900 });

  // ===== Der eine Toni =====
  // 9. Ohne Schlüssel: Erklärung und Weg zur Einstellung, keine Eingabe, kein Fehlertext
  await page.click('#toniFab');
  ok(await page.evaluate(() => document.body.classList.contains('chat-open')), '„Toni fragen“ unten rechts öffnet den Chat');
  ok(await sichtbar('#tcOhne') && /Schlüssel/.test(await page.textContent('#tcOhne')) && /läuft auch ohne/.test(await page.textContent('#tcOhne')), 'Ohne Schlüssel erklärt der Chat in zwei Sätzen, was fehlt');
  ok(!(await sichtbar('#chatForm')) && !(await sichtbar('#tcChips')) && !(await sichtbar('#chatIn')), 'Ohne Schlüssel sind Schnellfragen und Eingabe aus');
  ok(!(await page.locator('.chat .ai-err').count()), 'Ohne Schlüssel gibt es keinen Fehlertext');
  await page.evaluate(() => toniOeffnen('Was ist ein Signal?'));
  ok(!reqs.length && !(await page.locator('#chatLog .msg').count()), 'Ohne Schlüssel wird nichts abgeschickt');
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => !document.body.classList.contains('chat-open') && document.activeElement.id === 'toniFab'), 'Escape schließt den Chat, der Fokus geht zurück zu „Toni fragen“');
  await page.evaluate(() => document.body.classList.add('chat-open'));
  ok(await sichtbar('#tcOhne') && (await page.getAttribute('#toniFab', 'aria-expanded')) === 'true', 'Auch wer nur die Klasse chat-open setzt, bekommt den richtigen Stand');
  ok(await page.evaluate(async () => { const b = document.createElement('div'); document.querySelector('#main').appendChild(b); const t = await toniStream(TONI + '\nx', b); const gut = t === null && !!b.querySelector('button') && /Coach Toni einrichten/.test(b.textContent) && !/unten links/.test(b.textContent); b.remove(); return gut; }) && !reqs.length, 'Toni-Kasten ohne Schlüssel: Hinweis mit „Coach Toni einrichten“, keine Anfrage');
  await page.click('#tcEinrichten');
  ok(await page.evaluate(() => !!document.querySelector('dialog[open]')), '„Coach Toni einrichten“ öffnet die Einstellungen');
  await page.evaluate(() => { localStorage.setItem('ngfc.ai', JSON.stringify({ key: 'test', model: 'gemini-2.5-flash' })); document.querySelector('dialog[open]').close(); });
  await page.waitForSelector('#chatForm', { state: 'visible' });
  ok(!(await sichtbar('#tcOhne')), 'Ist der Schlüssel da, schaltet der Chat ohne Neuladen um');
  await page.click('#chatClose');
  await page.evaluate(() => { localStorage.removeItem('ngfc.ai'); toniOeffnen(); });
  ok(await sichtbar('#tcOhne'), 'Schlüssel weg: Beim nächsten Öffnen steht wieder der Hinweis');
  await page.evaluate(() => { localStorage.setItem('ngfc.ai', JSON.stringify({ key: 'test', model: 'gemini-2.5-flash' })); });
  await page.waitForSelector('#chatForm', { state: 'visible', timeout: 5000 });
  ok(!(await sichtbar('#tcOhne')), 'Kommt der Schlüssel auf anderem Weg (ohne Dialog), merkt es der offene Chat auch');

  // 10. In der Übung: zwei Schnellfragen, Toni bekommt Aufgabe, Code von jetzt, Tests und die Regel „keine Lösung“
  ok((await page.locator('#tcChips button').allTextContents()).join('|') === 'Gib mir einen Tipp|Was ist an meinem Code falsch?', 'Übung: Schnellfragen „Gib mir einen Tipp“ und „Was ist an meinem Code falsch?“');
  await setCode('export class Kaputt {}\n// mein Stand');
  await pruefen();
  bremse = 300;
  await page.evaluate(() => { const b = document.querySelectorAll('#tcChips button'); b[0].click(); b[1].click(); b[0].click(); });
  ok(await page.evaluate(() => !!document.querySelector('#chatLog .msg.toni p.tc-denkt') && document.querySelector('#chatForm .send-btn').disabled), 'Solange Toni überlegt, steht das da und Senden ist gesperrt');
  await page.evaluate(() => toniOeffnen('Zwischenfrage'));
  ok((await page.inputValue('#chatIn')) === 'Zwischenfrage', 'toniOeffnen(frage) bei laufender Antwort: Die Frage wartet im Eingabefeld');
  await page.fill('#chatIn', '');
  await antworten(1);
  bremse = 0;
  ok(reqs.length === 1, 'Schnelles Mehrfachklicken schickt nur eine Frage');
  let t = text(letzte());
  ok(t.includes('// mein Stand') && t.includes('Aufgabe:') && /Tests:\n- /.test(t), 'Toni bekommt die Aufgabe, den aktuellen Code und die roten Tests');
  ok(t.includes('KEINE komplette Lösung'), 'In der Übung gilt: Hinweise, keine fertige Lösung');
  ok((await page.textContent('#chatLog .msg.me')) === 'Gib mir einen Tipp', 'Die Schnellfrage steht als eigene Nachricht im Verlauf');
  ok((await page.locator('#tcChips button').count()) === 2 && (await page.getAttribute('#tcChips button >> nth=0', 'aria-disabled')) === 'false', 'Schnellfragen bleiben nach dem Klick stehen');
  s = await st();
  ok(s.profil.sig.hilfe === 1 && !(s.profil.fragen || []).length, 'Schnellfrage in der Übung zählt als Hilfe-Signal, nicht als eigene Frage');
  await setCode('export class Kaputt {}\n// zweiter Stand');
  await page.fill('#chatIn', 'Warum geht das nicht?'); await page.press('#chatIn', 'Enter');
  await antworten(2);
  t = text(letzte());
  ok(letzte().contents.map(c => c.role).join() === 'user,model,user', 'Eigene Frage schickt den Verlauf mit (user, model, user)');
  ok(t.includes('// zweiter Stand') && !t.includes('// mein Stand') && t.split('Sein Code jetzt').length === 2, 'Toni sieht den Code von jetzt, genau einmal');
  s = await st();
  ok(s.profil.fragen.length === 1 && s.profil.fragen[0].wo === 'uebung' && s.profil.fragen[0].typ.includes('warum'), 'Getippte Frage landet mit Ort und Fragetyp im Lernprofil');
  await setCode(await page.evaluate(() => currentExercise.ex.solution));
  await pruefen();
  await page.waitForFunction(() => document.querySelectorAll('#tcChips button').length === 1);
  ok((await page.textContent('#tcChips')) === 'Geht das noch besser?', 'Übung gelöst: statt Tipp-Fragen die Schnellfrage „Geht das noch besser?“');
  await page.focus('#tcChips button'); await page.keyboard.press('Enter');
  await antworten(3);
  ok(await page.evaluate(() => document.activeElement === document.querySelector('#tcChips button')), 'Tastatur: Nach der Antwort liegt der Fokus noch auf der Schnellfrage');
  t = text(letzte());
  ok(t.includes('Die Übung ist gelöst') && !t.includes('KEINE komplette Lösung') && t.includes('Alle Tests grün.') && (await st()).profil.sig.hilfe === 1, 'Nach dem Lösen darf Toni den Code offen besprechen, kein Hilfe-Signal');
  await setCode('export class Kaputt {}');
  await pruefen();
  await page.waitForFunction(() => document.querySelectorAll('#tcChips button').length === 2);
  ok(true, 'Sind die Tests wieder rot, kommen die Tipp-Fragen zurück');

  // 11. Auf einer Folie: drei Schnellfragen, Toni bekommt den Folien-Inhalt
  await page.evaluate(() => { window.sprungZu = { id: 'k01', t: 'slide', i: 0 }; location.hash = 'k01'; });
  await page.waitForFunction(() => location.hash === '#k01' && !currentExercise);
  const folie = await page.evaluate(() => { const ch = CH.find(c => c.id === 'k01'); aktFolie = { ch, s: ch.slides[0] }; tcStand(); return { t: ch.slides[0].t, code: ch.slides[0].code || '' }; });
  ok((await page.locator('#tcChips button').allTextContents()).join('|') === 'Erklär’s anders|Beispiel aus dem Job|Warum macht man das so?', 'Folie: drei Schnellfragen');
  ok((await page.textContent('#tcSieht')).includes(folie.t), 'Der Chat zeigt, welche Folie Toni sieht');
  await page.click('#tcChips button >> nth=0');
  await antworten(4);
  t = text(letzte());
  ok(t.includes('Folie „' + folie.t + '“') && (!folie.code || t.includes(folie.code.split('\n')[0])) && !t.includes('Sein Code jetzt'), 'Toni bekommt Titel und Inhalt der Folie mit, nicht mehr die Übung');
  ok((await st()).profil.sig.nochmal === 1, '„Erklär’s anders“ zählt als Signal fürs Lernprofil');

  // 12. Woanders: keine Schnellfragen. Eine alte Folie gilt nicht mehr, wenn man das Kapitel verlassen hat.
  await page.evaluate(() => { location.hash = 'start'; });
  await page.waitForFunction(() => location.hash === '#start' && document.querySelector('#tcChips').hidden);
  ok(await page.evaluate(() => aktFolie === null), 'Wer das Kapitel verlässt, hat keine Folie mehr offen (aktFolie)');
  ok(!(await sichtbar('#tcChips')) && await sichtbar('#chatIn'), 'Außerhalb von Folie und Übung gibt es keine Schnellfragen, nur die Eingabe');
  ok(await page.evaluate(() => { const ch = CH.find(c => c.id === 'k01'); aktFolie = { ch, s: ch.slides[0] }; tcStand(); const zu = document.querySelector('#tcChips').hidden; aktFolie = null; return zu; }), 'Auch eine liegen gebliebene Folie eines anderen Kapitels bringt keine Schnellfragen');
  ok(await sichtbar('#chatKapitel'), '„Neues Kapitel“ bleibt erreichbar');

  // 13. toniOeffnen(frage) stellt die Frage gleich. Vorkenntnisse aus dem Einstieg gehen als ein Satz mit.
  await page.click('#chatClose');
  await page.evaluate(() => { S.ich.level = 2; save(); toniOeffnen('Was ist ein Signal?'); });
  await antworten(5);
  t = text(letzte());
  ok(await page.evaluate(() => document.body.classList.contains('chat-open')) && t.includes('Frage: Was ist ein Signal?'), 'toniOeffnen(frage) öffnet den Chat und schickt die Frage ab');
  ok(t.includes('schon ein anderes Framework kennt') && !t.includes('Folie „'), 'Vorkenntnisse (S.ich.level) stehen im Prompt');
  ok(await page.evaluate(() => { S.ich.level = 0; return mitProfil(TONI + '\nx').includes('ganz neu'); }) && await page.evaluate(() => { delete S.ich.level; return !/Zum Start hat er gesagt/.test(mitProfil(TONI + '\nx')); }), 'Stufe 0 bekommt ihren Satz, ohne Angabe fehlt er');

  // 14. Langer Verlauf: Nachrichten bleiben ganz und überlappen nicht, der Verlauf scrollt und steht am Ende
  await page.setViewportSize({ width: 1300, height: 430 });
  const verlauf = await page.evaluate(() => { const l = document.querySelector('#chatLog'), m = [...l.children].map(e => e.getBoundingClientRect()); l.scrollTop = l.scrollHeight; return { n: m.length, scrollt: l.scrollHeight > l.clientHeight + 20, ueberlappt: m.some((r, i) => i && r.top < m[i - 1].bottom - 0.5), flach: [...l.children].some(e => e.scrollHeight > e.clientHeight + 1) }; });
  ok(verlauf.n >= 10 && verlauf.scrollt && !verlauf.ueberlappt && !verlauf.flach, 'Langer Verlauf: ' + verlauf.n + ' Nachrichten scrollen, keine überlappt oder wird gestaucht');
  await page.setViewportSize({ width: 1300, height: 900 });

  // 15. Tastatur: Escape schließt, der Fokus geht zurück zum Knopf
  await page.focus('#chatIn'); await page.keyboard.press('Escape');
  ok(await page.evaluate(() => !document.body.classList.contains('chat-open') && document.activeElement.id === 'toniFab' && document.querySelector('#toniFab').getAttribute('aria-expanded') === 'false'), 'Escape schließt den Chat, Fokus zurück auf den Toni-Knopf');

  await ende(browser, fehler);
  console.log('\nAlles grün');
})();
