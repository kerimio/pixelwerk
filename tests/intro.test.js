// Prüft im echten Browser den Spiel-Einstieg beim ersten Start: Titelbild, Charakter, Erster Tag, Team, Dein Coach (KI oder ohne), Spielregeln.
// Wer neu ist, landet darin. Wer schon einen Spielstand hat, sieht ihn nie ungefragt. Dazu: Neuladen, Zurück-Taste, Tastatur, Kontrast je
// Lieblingsfarbe, ohne Bewegung, Handy-Größen.
const { openPage, checker, reloadIt } = require('./helpers');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ok, ending } = checker();

const image = page => page.evaluate(() => { const e = document.querySelector('#main > .intro'); return e ? +e.dataset.image : -1; });
const inIntro = page => page.evaluate(() => document.body.classList.contains('intro-on'));
const quiet = page => page.emulateMedia({ reducedMotion: 'reduce' }); // ohne Bewegung kommt der Dialog sofort: schnelle Tests
/* Vom Titelbild bis zum Bild mit der Nummer ziel durchklicken */
async function untilImage(page, goal, name) {
  await page.click('#introNext'); if (goal === 1) return;
  await page.fill('#introName', name || 'Kerim'); await page.click('#introNext'); if (goal === 2) return;
  await page.click('.intro-answer'); await page.click('.intro-answer'); await page.click('.intro-answer'); await page.click('#introNext'); if (goal === 3) return;
  for (const k of ['toni', 'sara', 'mia']) await page.click('.intro-card[data-k="' + k + '"]');
  await page.click('#introNext');
}
/* Am Ende jedes Abschnitts: JavaScript-Fehler melden, Browser schließen. Erst ganz am Schluss entscheidet ende() über den Ausgang. */
const closed = async (browser, problems) => { ok(!problems.length, 'keine JavaScript-Fehler in diesem Abschnitt' + (problems.length ? ': ' + problems.join(' | ') : '')); await browser.close(); };
/* Merkt sich, ob <html> die Klasse intro-fwd trägt, sobald das Dokument gelesen ist (vor DOMContentLoaded, also vor route()) */
const PRE_REMEMBER = () => { document.addEventListener('readystatechange', () => { if (window.__before === undefined) window.__before = document.documentElement.classList.contains('intro-fwd'); }); };
const WITH_PROGRESS = { player: { name: 'Ada', avatar: '' }, xp: 640, steps: { k03: 2 }, done: { g01: 1794255568743, g02: 1794341968743 } };

(async () => {
  /* ---------- 1. Neuer Nutzer: ganzer Durchlauf per Klick, mit Animationen ---------- */
  {
    const { browser, page, problems } = await openPage({ intro: true });
    ok(await inIntro(page) && await image(page) === 0, 'Neuer Nutzer landet im Einstieg, auf dem Titelbild');
    ok(!(await page.isVisible('.top')) && !(await page.isVisible('#toniFab')), 'Kopfzeile und Chat-Knopf sind solange ausgeblendet');
    /* Das Skript im <head> setzt intro-fwd, bevor die Seite gezeichnet wird. Gemessen, sobald das Dokument gelesen ist, also vor route(). */
    await page.addInitScript(PRE_REMEMBER); await page.reload(); await page.waitForSelector('#main > .intro');
    ok(await page.evaluate(() => window.__before === true && !document.documentElement.classList.contains('intro-fwd')) && !(await page.isVisible('.top')), 'Ohne Spielstand: intro-fwd steht schon vor dem ersten Bild, route() nimmt die Klasse wieder weg');
    ok(await page.$eval('.intro-logo .sr-only', e => { const c = getComputedStyle(e); return c.position === 'absolute' && c.width === '1px' && c.height === '1px'; }), 'Titelbild: Der Name für Screenreader ist unsichtbar (gemeinsame Klasse sr-only)');
    ok(await page.isVisible('.intro-word') && (await page.textContent('.intro-logo')).includes('Pixelwerk') && (await page.textContent('#introNext')).trim() === 'Neues Spiel', 'Titelbild: Schriftzug und „Neues Spiel“');
    ok(await page.isVisible('#introLoad') && await page.locator('.intro-dots li').count() === 6, 'Titelbild: „Spielstand laden“ und sechs Fortschritts-Punkte');
    ok(await page.evaluate(() => { const p = document.querySelectorAll('.intro-pixel i'); return p.length > 10 && getComputedStyle(p[0]).animationName !== 'none'; }), 'Titelbild: Der Pixel-Hintergrund lebt');

    await page.click('#introNext');
    ok(await image(page) === 1 && await page.isDisabled('#introNext'), 'Charakter: „Weiter“ ist ohne Namen aus');
    ok((await page.textContent('#introNotice')).includes('Name'), 'Ein kurzer Hinweis sagt, was fehlt');
    await page.press('#introName', 'Enter');
    await page.fill('#introName', '   ');
    ok(await image(page) === 1 && await page.isDisabled('#introNext'), 'Enter ohne Namen und ein Name nur aus Leerzeichen gehen nicht weiter');
    ok(await page.evaluate(() => S.player.avatar === AV_TEMPLATES[0].px) && await page.isVisible('#introIdImage svg'), 'Der Ausweis hat von Anfang an ein Gesicht (erste Vorlage)');

    await page.fill('#introName', 'Kerim');
    ok(await page.evaluate(() => S.player.name === 'Kerim' && CAST.du.name === 'Kerim') && (await page.textContent('#introIdName')) === 'Kerim', 'Name wird gespeichert und steht sofort auf dem Ausweis');
    ok((await page.textContent('.intro-id-role')).trim() === 'Frontend · Praktikant' && (await page.textContent('.intro-idcard')).includes('Pixelwerk Köln'), 'Ausweis: Abteilung mit erstem Rang (kein späterer Rang vorweg) und Standort');
    ok(await page.isEnabled('#introNext') && (await page.textContent('#introNotice')) === '', 'Mit Namen ist „Weiter“ frei');

    await page.click('#introRandom');
    await page.waitForFunction(() => !document.querySelector('#introRandom').classList.contains('intro-rolls'));
    const chance = await page.evaluate(() => S.player.avatar);
    ok(chance.length === 400 && /[^0]/.test(chance) && await page.evaluate(() => !AV_TEMPLATES.some(v => v.px === S.player.avatar)), '„Zufall“ würfelt einen neuen Avatar');

    await page.click('#introPaint');
    ok(await page.isVisible('#introGrid') && await page.getAttribute('#introPaint', 'aria-expanded') === 'true', '„Selbst malen“ klappt das Pixel-Raster auf');
    await page.click('.intro-palette [data-c="8"]');
    const cell = async i => { const b = await page.locator('#introGrid i').nth(i).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
    await page.mouse.click(...await cell(0));
    const [x1, y1] = await cell(22), [x2, y2] = await cell(25);
    await page.mouse.move(x1, y1); await page.mouse.down(); await page.mouse.move(x2, y2, { steps: 8 }); await page.mouse.up();
    const painted = await page.evaluate(() => S.player.avatar);
    ok(painted[0] === '8' && painted.slice(22, 26) === '8888' && painted[21] === chance[21], 'Klicken und Ziehen malt Pixel in der gewählten Farbe');
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem('ngfc.v1')).player.avatar === S.player.avatar), 'Das Gemalte ist gespeichert');
    await page.focus('#introGrid'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Space');
    ok(await image(page) === 1 && await page.evaluate(() => S.player.avatar[46] === '8'), 'Malen geht auch mit Pfeiltasten und Leertaste');

    await page.click('#introClear');
    ok(await page.evaluate(() => S.player.avatar === '') && (await page.textContent('#introIdImage')).trim() === 'K' && await page.locator('#introIdImage svg').count() === 0, '„Alles löschen“ leert das Raster, der Ausweis zeigt solange den Anfangsbuchstaben');
    /* Absichtlich geleert bleibt geleert: weder Neuladen noch Weiter und Zurück holen die Vorlage zurück */
    await reloadIt(page); await page.waitForSelector('#introGrid');
    ok(await image(page) === 1 && await page.evaluate(() => S.player.avatar === '') && await page.locator('#introIdImage svg').count() === 0, 'Neuladen nach „Alles löschen“: Der Avatar bleibt leer, die Vorlage kommt nicht zurück');
    await page.click('#introNext'); await page.click('#introBack'); await page.waitForSelector('#introGrid');
    ok(await image(page) === 1 && await page.evaluate(() => S.player.avatar === '') && await page.locator('#introIdImage svg').count() === 0, 'Weiter und Zurück nach „Alles löschen“: Der Avatar bleibt leer');
    await page.click('.intro-palette [data-c="8"]');
    await page.mouse.click(...await cell(44));
    ok(await page.evaluate(() => S.player.avatar.length === 400 && S.player.avatar[44] === '8' && S.player.avatar.replace(/0/g, '') === '8'), 'Danach malt man auf leerem Raster weiter');

    await page.click('.intro-tile[data-v="2"]');
    ok(await page.evaluate(() => S.player.avatar === AV_TEMPLATES[2].px) && await page.getAttribute('.intro-tile[data-v="2"]', 'aria-pressed') === 'true', 'Vorlage anklicken setzt den Avatar');
    /* 1280 × 800 mit offenem Raster: Die Lieblingsfarben liegen ohne Scrollen im Bereich des klebenden Fußes. Er darf den Klick nicht schlucken. */
    await page.setViewportSize({ width: 1280, height: 800 }); await page.evaluate(() => scrollTo(0, 0));
    const inFooter = await page.evaluate(() => { const f = document.querySelector('.intro-color[data-p="mint"]').getBoundingClientRect(), u = document.querySelector('.intro-footer').getBoundingClientRect(); return f.top + f.height / 2 > u.top; });
    const [fx, fy] = await page.evaluate(() => { const f = document.querySelector('.intro-color[data-p="mint"]').getBoundingClientRect(); return [f.left + f.width / 2, f.top + f.height / 2]; });
    await page.mouse.click(fx, fy);
    ok(inFooter && await page.evaluate(() => S.player.colour && S.player.colour.id === 'mint'), 'Lieblingsfarbe lässt sich auch dort anklicken, wo der klebende Fuß über ihr liegt');
    await page.evaluate(() => scrollTo(0, 1e6));
    ok(await page.evaluate(() => { const k = document.querySelector('#introNext').getBoundingClientRect(); return [...document.querySelectorAll('.intro-char button, .intro-char input, #introGrid')].every(e => { if (e.id === 'introNext') return true; const r = e.getBoundingClientRect(); return !r.width || r.bottom <= k.top + 1 || r.right <= k.left || r.left >= k.right; }); }), 'Am Seitenende liegt nichts Bedienbares unter dem Knopf „Weiter“');
    await page.setViewportSize({ width: 1300, height: 900 });
    await page.click('.intro-color[data-p="koralle"]');
    const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase());
    ok(accent === '#d23f5a' && await page.evaluate(() => S.player.colour.id === 'koralle' && S.player.colour.a === '#D23F5A'), 'Lieblingsfarbe färbt sofort die Oberfläche und liegt in S.ich.farbe wie im Profil');

    await page.click('#introNext');
    await page.waitForSelector('.intro-answer');
    ok(await image(page) === 2 && (await page.textContent('#introChat')).includes('Hallo Kerim') && (await page.textContent('#introChat')).includes('Katrin Kaiser'), 'Erster Tag: Katrin begrüßt dich mit Namen');
    ok(await page.locator('.intro-answer').count() === 2 && await page.isHidden('#introNext'), 'Eigene Antworten sind Knöpfe, „Weiter“ kommt erst am Ende');
    await page.click('.intro-answer >> nth=1');
    ok(await page.locator('.intro-line.intro-me').count() === 1 && (await page.textContent('.intro-line.intro-me')).includes('nervös'), 'Die gewählte Antwort steht als eigene Sprechblase im Chat');
    await page.waitForSelector('.intro-answer');
    ok(await page.locator('.intro-answer').count() === 3 && (await page.textContent('#introChat')).includes('Wie viel Angular hattest du schon?'), 'Toni fragt nach den Vorkenntnissen, drei Antworten');
    await page.click('.intro-answer >> nth=2');
    await page.waitForSelector('.intro-answer');
    ok(await page.evaluate(() => S.player.level === 2) && (await page.textContent('#introChat')).includes('Grundlagen mitmachen oder direkt Angular?'), 'Die Antwort landet in S.ich.level, Toni fragt passend nach den Grundlagen');
    ok(await page.locator('.intro-answer').count() === 2 && await page.isHidden('#introNext') && await page.locator('.intro-answer.intro-rec').count() === 1 && (await page.textContent('.intro-answer.intro-rec')).includes('Direkt mit Angular') && (await page.textContent('.intro-answer.intro-rec')).includes('Tonis Vorschlag'),
      'Grundlagen oder direkt Angular: zwei Antworten, wer schon ein Framework kennt, bekommt „direkt Angular“ vorgeschlagen');
    ok(await page.evaluate(() => S.player.journey === undefined), 'Solange nicht gewählt, steht nichts in S.ich.weg');
    await page.click('.intro-answer >> nth=1');
    await page.waitForSelector('#introNext:not([hidden])');
    ok(await page.evaluate(() => S.player.journey === 'angular') && (await page.textContent('#introChat')).includes('frei anwählbar') && (await page.locator('.intro-line.intro-me').last().textContent()).includes('Direkt mit Angular starten') && !(await page.textContent('#introChat')).includes('Tonis Vorschlag'),
      'Die Wahl landet in S.ich.weg, Toni reagiert passend, die Sprechblase zeigt nur die Antwort');
    ok(await page.locator('#introChat .intro-line').count() === 10, 'Der Dialog hat höchstens zehn Nachrichten');
    ok((await page.textContent('#introChat')).includes('Ich führ dich durch die Kapitel.') && !/Frag mich|fragen\./.test(await page.textContent('#introChat') + await page.evaluate(() => INTRO_TEAM.find(t => t[0] === 'toni')[1])), 'Toni verspricht nur, was ohne KI stimmt: Er führt durch die Kapitel, kein „Frag mich alles“');
    ok(await page.evaluate(() => [...document.querySelectorAll('#introChat .intro-bubble p')].every(p => (p.textContent.match(/[.!?](\s|$)/g) || []).length <= 2 && p.textContent.length <= 90)), 'Jede Nachricht hat höchstens zwei kurze Sätze');
    ok(await page.locator('#introChat .intro-follow').count() === 2 && await page.evaluate(() => [...document.querySelectorAll('#introChat .intro-follow .intro-av')].every(a => getComputedStyle(a).visibility === 'hidden')),
      'Schreibt dieselbe Figur zweimal hintereinander, steht die zweite Blase ohne Avatar darunter');
    ok(await page.locator('#introChat .intro-typing').count() === 0, 'Am Ende tippt niemand mehr');

    await page.click('#introNext');
    ok(await image(page) === 3 && await page.locator('.intro-card').count() === 6 && await page.isDisabled('#introNext'), 'Team: sechs Karten, „Weiter“ noch aus');
    ok(await page.locator('.intro-card .intro-av img.fig-av').count() === 6 && await page.evaluate(() => new Set(Object.keys(FIGURES).map(k => figurePaint(FIGURES[k]))).size === Object.keys(FIGURES).length), 'Team: Jede Figur hat ihr eigenes Pixel-Gesicht');
    await page.click('.intro-card[data-k="sara"]'); await page.click('.intro-card[data-k="sara"]'); await page.click('.intro-card[data-k="jonas"]');
    ok(await page.isDisabled('#introNext') && (await page.textContent('#introNotice')).includes('2 von 3'), 'Zwei Begrüßte reichen nicht, doppelt klicken zählt nicht doppelt');
    ok((await page.textContent('.intro-card[data-k="sara"] .intro-ksentence')).includes('Tickets') && await page.getAttribute('.intro-card[data-k="sara"]', 'aria-pressed') === 'true', 'Die begrüßte Figur stellt sich vor und bekommt einen Haken');
    await page.click('.intro-card[data-k="ricky"]');
    ok(await page.isEnabled('#introNext') && await page.evaluate(() => S.player.team.join() === 'sara,jonas,ricky'), 'Ab drei Begrüßten geht es weiter, sie stehen in S.ich.team');
    ok(await page.evaluate(() => {
      const light = c => { const v = c.match(/[\d.]+/g).slice(0, 3).map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
      return [...document.querySelectorAll('.intro-card .intro-av')].every(el => { const cs = getComputedStyle(el), a = light(cs.color), b = light(cs.backgroundColor); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5; });
    }), 'Die Initiale ist auf jeder Figurenfarbe lesbar (Kontrast ab 4,5)');
    ok(await page.evaluate(() => INTRO_TEAM.every(t => CAST[t[0]] && t[1].length <= 85 && (t[1].match(/[.!?](\s|$)/g) || []).length <= 2) && !INTRO_TEAM.some(t => t[0] === 'boss')), 'Jede Vorstellung ist kurz: höchstens zwei Sätze');

    await page.click('#introNext');
    /* Dein Coach: mit eigener KI (Schlüssel prüfen und speichern) oder ohne */
    ok(await image(page) === 4 && (await page.textContent('#introT')) === 'Dein Coach' && await page.locator('.intro-ai-k').count() === 2 && await page.isHidden('#introAiForm') && await page.isEnabled('#introNext'), 'Dein Coach: zwei Wege, „Weiter“ geht auch ohne Wahl');
    await page.click('.intro-ai-k[data-ai="mit"]');
    ok(await page.isVisible('#introAiForm') && await page.locator('#introAiProv button').count() === 4 && (await page.textContent('#introAiKeyL')) === 'Claude-API-Schlüssel' && await page.evaluate(() => document.activeElement.id === 'introAiKey'), 'Mit KI: vier Anbieter, Claude vorgewählt, der Fokus steht im Schlüsselfeld');
    await page.click('#introAiProv button[data-a="gemini"]');
    ok((await page.textContent('#introAiKeyL')) === 'Gemini-API-Schlüssel' && (await page.getAttribute('#introAiKey', 'placeholder')).startsWith('AIza') && (await page.textContent('#introAiWhere')).includes('aistudio'), 'Anbieter wechseln: Beschriftung, Platzhalter und wo es den Schlüssel gibt');
    await page.route('https://generativelanguage.googleapis.com/**', r => r.request().headers()['x-goog-api-key'] === 'AIza-gut'
      ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ models: [{ name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', supportedGenerationMethods: ['generateContent'] }] }) })
      : r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { message: 'API key not valid' } }) }));
    await page.click('#introAiCheck');
    ok((await page.textContent('#introAiMsg')) === 'Erst den Schlüssel einfügen.', 'Ohne Schlüssel: Hinweis statt Anfrage');
    await page.fill('#introAiKey', 'AIza-falsch'); await page.keyboard.press('Enter');
    await page.waitForSelector('#introAiAnyway');
    ok((await page.textContent('#introAiMsg')).includes('API key not valid') && await image(page) === 4 && await page.evaluate(() => !aiCfg().key), 'Falscher Schlüssel: Fehler vom Anbieter, nichts gespeichert, Enter im Feld prüft und geht nicht weiter');
    await page.fill('#introAiKey', 'AIza-gut'); await page.click('#introAiCheck');
    await page.waitForFunction(() => /Klappt/.test(document.querySelector('#introAiMsg').textContent));
    ok(await page.evaluate(() => { const c = aiCfg(); return c.provider === 'gemini' && c.key === 'AIza-gut' && c.model === 'gemini-2.5-flash'; }) && (await page.textContent('#introNotice')).includes('Toni nutzt Gemini'), 'Richtiger Schlüssel: gespeichert wie im Profil, mit Modell');
    ok(await page.evaluate(() => !JSON.stringify(S).includes('AIza-gut')), 'Der Schlüssel steht nicht im Spielstand');
    await page.click('#introBack'); await page.click('#introNext');
    ok(await image(page) === 4 && await page.getAttribute('.intro-ai-k[data-ai="mit"]', 'aria-pressed') === 'true' && await page.inputValue('#introAiKey') === 'AIza-gut' && (await page.textContent('#introAiMsg')).includes('Gespeichert: Gemini'), 'Zurück und wieder hin: Wahl und gespeicherter Schlüssel stehen da');
    await page.click('.intro-ai-k[data-ai="ohne"]');
    ok(await page.isHidden('#introAiForm') && (await page.textContent('#introNotice')).includes('im Profil'), 'Ohne KI: Formular zu, Hinweis aufs Profil');
    await page.evaluate(() => localStorage.removeItem('ngfc.ai'));
    await page.click('#introNext');
    ok(await image(page) === 5 && await page.locator('.intro-path li').count() === 4 && await page.evaluate(() => document.querySelectorAll('.intro-ladder li').length === RANKS.length), 'Spielregeln: vier Stationen und die Leiter mit allen Rängen');
    ok(await page.evaluate(() => document.querySelector('.intro-path li:last-child small').textContent.includes('Ab ' + phaseNo(ACTS.find(a => a.n === CH.find(c => c.ex).act)) + ' ')), 'Station „Umsetzen“ nennt die Phase, in der die erste Übung kommt');
    ok((await page.textContent('.intro-ladder .intro-you')).includes('Praktikant') && await page.isVisible('.intro-ladder .intro-you .px-av'), 'Dein Avatar steht auf der untersten Sprosse');
    ok((await page.textContent('#introNext')).trim() === 'Erstes Ticket holen', 'Hauptknopf: „Erstes Ticket holen“');
    await page.click('#introNext');
    await page.waitForFunction(() => !document.body.classList.contains('intro-on'));
    ok(await page.evaluate(() => location.hash === '#' + CH[0].id && typeof S.player.start === 'number' && S.player.start > 1e12), 'Ende: S.ich.start gesetzt, weiter ins erste Kapitel');
    ok((await page.textContent('#cheerCard')).includes('Willkommen im Team!'), 'Zum Schluss gibt es Jubel');
    ok(await page.isVisible('.top') && (await page.textContent('#main')).includes(await page.evaluate(() => CH[0].title)), 'Das erste Kapitel ist offen, die Kopfzeile wieder da');
    ok(await page.evaluate(() => sessionStorage.getItem('pw-einstieg') === null), 'Der gemerkte Zwischenstand ist aufgeräumt');
    await reloadIt(page); await page.waitForSelector('#main > *');
    ok(!(await inIntro(page)) && await page.evaluate(() => S.player.name === 'Kerim' && S.player.avatar === AV_TEMPLATES[2].px && S.player.level === 2 && S.player.team.length === 3), 'Nach dem Neuladen: kein Einstieg mehr, alles gespeichert');
    await closed(browser, problems);
  }

  /* ---------- 2. Überspringen ---------- */
  {
    const { browser, page, problems } = await openPage({ intro: true, hash: 'k03' });
    ok(await inIntro(page), 'Auch mit einem Kapitel-Link landet ein neuer Nutzer erst im Einstieg');
    await page.click('#introSkip');
    ok(!(await inIntro(page)) && await page.evaluate(() => location.hash === '#start' && S.player.start > 0), '„Überspringen“ führt zum Start');
    await reloadIt(page); await page.waitForSelector('#main > *');
    ok(!(await inIntro(page)) && await page.evaluate(() => !introNeeded()), 'Nach dem Überspringen kommt der Einstieg nicht wieder');
    await closed(browser, problems);
  }

  /* ---------- 3. Vorhandener Spielstand ohne S.player.start ---------- */
  {
    const { browser, page, problems } = await openPage({ standing: WITH_PROGRESS });
    ok(!(await inIntro(page)) && await page.isVisible('.top'), 'Wer schon Fortschritt hat, sieht keinen Einstieg');
    await page.addInitScript(PRE_REMEMBER); await page.reload(); await page.waitForSelector('.hub');
    ok(await page.evaluate(() => window.__before === false && !document.documentElement.classList.contains('intro-fwd')) && await page.isVisible('.top'), 'Mit Spielstand wird intro-fwd gar nicht erst gesetzt, die Kopfzeile ist sofort da');
    ok(await page.evaluate(() => { document.documentElement.classList.add('intro-fwd'); const journey = getComputedStyle(document.querySelector('.top')).visibility === 'hidden'; route(); return journey && !document.documentElement.classList.contains('intro-fwd'); }) && await page.isVisible('.top'),
      'Die Klasse intro-fwd (Kopfzeile bis zur Entscheidung unsichtbar) nimmt route() wieder weg');
    ok(await page.evaluate(() => { const alt = S; let fine = true; [{ xp: 5 }, { done: { g01: 1 } }, { steps: { g01: 0 } }, { player: { name: 'Ada' } }, { player: { start: 1 } }].forEach(v => { S = withDefaults(v); if (introNeeded()) fine = false; }); S = withDefaults({}); if (!introNeeded()) fine = false; S = alt; return fine; }),
      'einstiegNoetig(): nur ohne XP, ohne Kapitel, ohne Namen und ohne S.ich.start');
    await closed(browser, problems);
  }

  /* ---------- 4. Neuladen mittendrin, Zurück, Tastatur, mehrfaches renderIntro ---------- */
  {
    const { browser, page, problems } = await openPage({ intro: true });
    await quiet(page);
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('.intro-pixel i')).animationName === 'none' && getComputedStyle(document.querySelector('.intro-word rect')).animationName === 'none'), 'Ohne Bewegung steht der Hintergrund still');
    await page.keyboard.press('/');
    ok(await page.evaluate(() => !document.querySelector('dialog[open]')) && await image(page) === 0, 'Die Taste „/“ öffnet im Einstieg nicht die Suche');
    await page.keyboard.press('Enter');
    ok(await image(page) === 1, 'Enter auf dem Titelbild startet das Spiel');
    await page.fill('#introName', 'Mo <b>');
    await page.evaluate(() => { location.hash = '#k02'; });
    await page.waitForFunction(() => location.hash === '#k02');
    await page.evaluate(() => { route(); renderIntro(document.querySelector('#main')); });
    ok(await image(page) === 1 && await page.inputValue('#introName') === 'Mo <b>' && await inIntro(page), 'Ein Seitenwechsel mittendrin (route) fängt nicht von vorn an und verliert nichts');
    await reloadIt(page); await page.waitForSelector('.intro');
    ok(await image(page) === 1 && await page.inputValue('#introName') === 'Mo <b>', 'Neuladen beim Charakter: gleiches Bild, Name noch da');
    await page.press('#introName', 'Enter');
    ok(await image(page) === 2 && (await page.textContent('#introChat')).includes('Hallo Mo <b>,') && await page.locator('#introChat b').count() === 0, 'Enter im Namensfeld geht weiter, der Name wird als Text gezeigt (kein HTML)');
    ok(await page.locator('#introChat .intro-line').count() === 1 && await page.locator('.intro-answer').count() === 2, 'Ohne Bewegung steht der Dialog sofort bis zur ersten Frage da');
    await page.keyboard.press('Enter');
    ok(await image(page) === 2 && await page.locator('.intro-line.intro-me').count() === 0, 'Enter beantwortet keine Frage und geht nicht weiter, solange eine Antwort offen ist');
    await page.keyboard.press('2');
    ok(await page.locator('.intro-line.intro-me').count() === 1 && await page.locator('.intro-answer').count() === 3, 'Zifferntasten wählen eine Antwort');
    await reloadIt(page); await page.waitForSelector('.intro-answer');
    ok(await image(page) === 2 && (await page.textContent('.intro-line.intro-me')).includes('nervös') && await page.locator('.intro-answer').count() === 3, 'Neuladen im Dialog: gleiche Stelle, die erste Antwort steht noch da');
    await page.keyboard.press('1');
    ok(await page.evaluate(() => S.player.level === 0) && await page.locator('.intro-answer').count() === 2 && (await page.textContent('.intro-answer.intro-rec')).includes('Mit Grundlagen'), 'Ohne Vorwissen schlägt Toni die Grundlagen vor');
    await reloadIt(page); await page.waitForSelector('.intro-answer');
    ok(await image(page) === 2 && await page.locator('.intro-line.intro-me').count() === 2 && await page.locator('.intro-answer').count() === 2 && !(await page.textContent('#introChat')).includes('undefined'), 'Neuladen vor der Grundlagen-Frage: beide Antworten stehen noch da, die Frage ist wieder offen');
    await page.keyboard.press('1');
    ok(await page.evaluate(() => S.player.journey === 'grundlagen') && await page.evaluate(() => document.activeElement.id === 'introNext'), 'Nach der letzten Antwort liegt der Fokus auf „Weiter“, die Wahl steht in S.ich.weg');
    await page.keyboard.press('Enter');
    ok(await image(page) === 3, 'Enter geht weiter zum Team');
    await page.keyboard.press('ArrowRight');
    ok(await image(page) === 3, 'Pfeil rechts geht nicht weiter, solange die Hauptaktion nicht möglich ist');
    await page.click('.intro-card[data-k="mia"]');
    await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
    ok(await image(page) === 3 && await page.locator('.intro-card.intro-now').count() === 2, 'Enter auf einer Karte mit Tastatur-Fokus begrüßt sie');
    await page.click('.intro-card[data-k="ricky"]'); await page.keyboard.press('Enter');
    ok(await image(page) === 4, 'Nach einem Mausklick auf eine Karte geht Enter weiter, sobald drei begrüßt sind');
    await page.keyboard.press('ArrowLeft');
    await reloadIt(page); await page.waitForSelector('.intro-card');
    ok(await image(page) === 3 && await page.locator('.intro-card.intro-now').count() === 3 && (await page.textContent('#introNotice')).includes('3 von 6'), 'Neuladen beim Team: Begrüßte bleiben begrüßt');
    await page.keyboard.press('ArrowLeft');
    ok(await image(page) === 2 && await page.locator('#introChat .intro-line').count() === 10 && await page.isVisible('#introNext'), 'Pfeil links geht zurück: Der Dialog steht fertig da');
    await page.click('#introBack');
    ok(await image(page) === 1 && await page.inputValue('#introName') === 'Mo <b>', 'Zurück-Knopf: Charakter mit allen Eingaben');
    await page.click('#introBack');
    ok(await image(page) === 0 && await page.isHidden('#introBack'), 'Auf dem Titelbild gibt es kein Zurück');
    await closed(browser, problems);
  }

  /* ---------- 5. Zurück-Taste des Browsers: ein Bild zurück, und am Ende bleibt kein Rest im Verlauf ---------- */
  {
    const { browser, page, problems } = await openPage({ intro: true });
    await quiet(page);
    const len = await page.evaluate(() => history.length);
    await untilImage(page, 2);
    await page.goBack();
    ok(await image(page) === 1 && await inIntro(page) && await page.inputValue('#introName') === 'Kerim', 'Zurück-Taste des Browsers im Dialog: zurück zum Charakter, nichts verloren');
    await page.goBack();
    ok(await image(page) === 0 && await inIntro(page), 'Nochmal Zurück: Titelbild');
    await page.click('#introNext'); await page.click('#introNext'); await page.click('.intro-answer'); await page.click('.intro-answer'); await page.click('.intro-answer'); await page.click('#introNext');
    for (const k of ['toni', 'sara', 'mia']) await page.click('.intro-card[data-k="' + k + '"]');
    await page.click('#introNext'); await page.click('#introNext'); await page.click('#introNext');
    await page.waitForFunction(() => !document.body.classList.contains('intro-on'));
    ok(await page.evaluate(() => location.hash === '#' + CH[0].id && history.state === null), 'Am Ende steht das erste Kapitel an der Stelle des eigenen Verlaufs-Eintrags');
    await page.goBack(); await page.waitForFunction(() => location.hash !== '#' + CH[0].id);
    ok(!(await inIntro(page)) && await page.isVisible('.top') && await page.evaluate(n => history.length === n + 1, len), 'Zurück aus dem Kapitel führt zum Start, im Verlauf liegt nur ein Eintrag mehr als vorher');
    await closed(browser, problems);
  }

  /* ---------- 6. Doppelklick überspringt kein Bild ---------- */
  {
    const { browser, page, problems } = await openPage({ intro: true });
    await quiet(page);
    await untilImage(page, 3);
    for (const k of ['toni', 'sara', 'mia']) await page.click('.intro-card[data-k="' + k + '"]');
    await page.dblclick('#introNext');
    ok(await image(page) === 4 && await inIntro(page), 'Ein Doppelklick auf „Weiter“ klickt das nächste Bild nicht gleich mit weg');
    await closed(browser, problems);
  }

  /* ---------- 7. Spielstand laden auf dem Titelbild ---------- */
  {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pw-es-')), 'stand.json');
    fs.writeFileSync(file, JSON.stringify(Object.assign({ app: 'pixelwerk-angular', version: 1 }, WITH_PROGRESS)));
    const { browser, page, problems } = await openPage({ intro: true });
    await page.setInputFiles('#introFile', file);
    await page.waitForFunction(() => !document.body.classList.contains('intro-on'));
    ok(await page.evaluate(() => S.xp === 640 && S.player.name === 'Ada' && !introNeeded()) && await page.isVisible('.top'), '„Spielstand laden“ lädt die Datei und beendet den Einstieg');
    fs.writeFileSync(file, '{"kaputt":true}');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await page.reload(); await page.waitForSelector('#introFile', { state: 'attached' });
    await page.setInputFiles('#introFile', file);
    await page.waitForSelector('#toast.show');
    ok(await inIntro(page) && await image(page) === 0, 'Eine unpassende Datei ändert nichts, der Einstieg bleibt');
    await closed(browser, problems);
  }

  /* ---------- 8. introStart(): nochmal ansehen, ohne Fortschritt zu ändern ---------- */
  {
    const standing = Object.assign({}, WITH_PROGRESS, { player: { name: 'Ada', avatar: '', start: 1700000000000, level: 1, team: ['toni'] } });
    const { browser, page, problems } = await openPage({ standing });
    await quiet(page);
    const progress = () => page.evaluate(() => JSON.stringify([S.xp, S.done, S.steps, S.quiz, S.ex, S.player.name, S.player.avatar, S.player.start]));
    const previous = await progress();
    await page.evaluate(() => { document.body.classList.add('chat-open'); introStart(); });
    ok(await inIntro(page) && await image(page) === 0 && !(await page.isVisible('#introLoad')), 'einstiegStarten() zeigt den Einstieg erneut, ohne „Spielstand laden“');
    ok(!(await page.isVisible('.chat')) && !(await page.isVisible('#toniFab')), 'Ein offener Chat ist solange ausgeblendet');
    await page.evaluate(() => document.body.classList.remove('chat-open'));
    await page.click('#introNext');
    ok(await page.inputValue('#introName') === 'Ada' && await page.evaluate(() => S.player.avatar === ''), 'Name steht schon da, der Avatar wird nicht ungefragt gesetzt');
    await page.click('#introNext');
    await page.click('.intro-answer'); await page.click('.intro-answer >> nth=2'); await page.click('.intro-answer >> nth=1'); await page.click('#introNext');
    for (const k of ['sara', 'mia', 'leon']) await page.click('.intro-card[data-k="' + k + '"]');
    await page.click('#introNext'); await page.click('#introNext');
    ok((await page.textContent('.intro-ladder .intro-you')).includes('Junior-Dev'), 'Auf der Leiter stehst du auf deinem jetzigen Rang');
    await page.click('#introNext');
    await page.waitForFunction(() => !document.body.classList.contains('intro-on'));
    ok(await progress() === previous && await page.evaluate(() => location.hash === '#start'), 'Danach: Fortschritt, Name, Avatar und Startdatum unverändert, zurück am Start');
    ok(await page.locator('#cheerCard').count() === 0, 'Beim erneuten Ansehen gibt es keinen Jubel');
    ok(await page.evaluate(() => S.player.level === 2 && S.player.journey === 'angular' && S.player.team.join() === 'toni,sara,mia,leon'), 'Neue Antworten (auch die Grundlagen-Wahl) und neu Begrüßte kommen dazu');
    await page.evaluate(() => introStart());
    await page.click('#introSkip');
    ok(!(await inIntro(page)) && await progress() === previous && await page.evaluate(() => !introNeeded()), '„Beenden“ beim erneuten Ansehen ändert nichts');
    await closed(browser, problems);
  }
  {
    const long = 'Maximilian-Alexander IV.'; /* 24 Zeichen, so lang durfte ein Name früher sein. Neue Namen haben höchstens 20. */
    const { browser, page, problems } = await openPage({ standing: { player: { name: long, start: 1700000000000 }, xp: 1000, done: { g01: 1 } } });
    await quiet(page);
    await page.evaluate(() => introStart());
    await page.click('#introNext');
    ok((await page.textContent('.intro-id-role')).trim() === 'Frontend-Dev' && (await page.textContent('.intro-head h1')).trim() === 'Dein Charakter', 'Ausweis beim erneuten Ansehen: Der Rang „Frontend-Dev“ steht nicht doppelt da');
    await page.click('.intro-tile[data-v="3"]');
    ok(await page.evaluate(n => S.player.name === n && S.player.avatar === AV_TEMPLATES[3].px, long) && (await page.textContent('#introIdName')) === long, 'Ein langer Name aus dem Profil bleibt ganz, geändert wird nur, was man anfasst');
    ok(await page.getAttribute('#introName', 'maxlength') === '20' && await page.inputValue('#introName') === long && await page.evaluate(n => meName() === n, long), 'Namensfeld im Einstieg: höchstens 20 Zeichen wie im Profil, der ältere längere Name wird beim Laden nicht gekürzt');
    await page.fill('#introName', 'Bartholomäus-Ferdinand der Dritte');
    ok(await page.inputValue('#introName') === 'Bartholomäus-Ferdina' && await page.evaluate(() => S.player.name === 'Bartholomäus-Ferdina'), 'Ein neu getippter Name endet nach 20 Zeichen, im Feld wie im Spielstand');
    await closed(browser, problems);
  }

  /* ---------- 9. Jede Lieblingsfarbe, hell und dunkel: Der Hauptknopf bleibt lesbar ---------- */
  for (const design of ['light', 'dark']) {
    const { browser, page, problems } = await openPage({ intro: true });
    await quiet(page);
    await page.evaluate(d => { document.documentElement.dataset.theme = d; }, design);
    await page.click('#introNext'); await page.fill('#introName', 'Kerim');
    const weakOnes = [];
    for (const id of await page.evaluate(() => COLOR_PRESETS.map(p => p.id))) {
      await page.click('.intro-color[data-p="' + id + '"]');
      const k = await page.evaluate(() => {
        const light = c => { const v = c.match(/[\d.]+/g).slice(0, 3).map(x => x / 255).map(x => x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4)); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
        const contrast = el => { const cs = getComputedStyle(el), a = light(cs.color), b = light(cs.backgroundColor); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); };
        return Math.min(contrast(document.querySelector('#introNext')), contrast(document.querySelector('.intro-id-head')));
      });
      if (k < 4.5) weakOnes.push(id + ' ' + k.toFixed(2));
    }
    ok(!weakOnes.length, (design === 'dark' ? 'Dunkel' : 'Hell') + ': Hauptknopf und Ausweis-Kopf sind mit jeder Lieblingsfarbe lesbar (Kontrast ab 4,5)' + (weakOnes.length ? ': ' + weakOnes.join(', ') : ''));
    await closed(browser, problems);
  }

  /* ---------- 10. Handy: kein Querscrollen, Hauptknopf erreichbar, Malen per Finger ---------- */
  for (const breadth of [390, 360]) {
    const { browser, page, problems } = await openPage({ intro: true, viewport: { width: breadth, height: breadth === 390 ? 844 : 640 } });
    await quiet(page);
    const fits = () => page.evaluate(() => { const b = document.querySelector('#introNext').getBoundingClientRect(); return document.documentElement.scrollWidth <= innerWidth && b.width >= 40 && b.height >= 40 && b.left >= 0 && b.right <= innerWidth; });
    const below = () => page.evaluate(() => { scrollTo(0, 0); const b = document.querySelector('#introNext').getBoundingClientRect(); return b.bottom <= innerHeight + 1 && b.top > 0; });
    let fine = await fits();
    await page.click('#introNext');
    await page.fill('#introName', 'WWWWWWWWWWWWWWWWWWWW'); await page.click('#introPaint');
    fine = fine && await fits() && await below();
    await page.click('#introNext'); await page.click('.intro-answer'); await page.click('.intro-answer >> nth=2'); await page.click('.intro-answer >> nth=1');
    fine = fine && await fits();
    await page.click('#introNext');
    for (const k of ['toni', 'sara', 'jonas', 'mia', 'leon', 'ricky']) await page.click('.intro-card[data-k="' + k + '"]');
    fine = fine && await fits() && await below();
    await page.click('#introNext'); await page.click('.intro-ai-k[data-ai="mit"]');
    fine = fine && await fits() && await below();
    await page.click('#introNext');
    fine = fine && await fits() && await below();
    ok(fine, breadth + ' px breit: alle sechs Bilder ohne Querscrollen, Hauptknopf immer im Bild (auch mit langem Namen)');
    await closed(browser, problems);
  }
  {
    const { browser, page, problems } = await openPage({ intro: true, mobile: true });
    await page.tap('#introNext'); await page.fill('#introName', 'Kerim'); await page.tap('#introPaint'); await page.tap('.intro-palette [data-c="9"]');
    await page.tap('#introGrid i >> nth=55');
    ok(await page.evaluate(() => S.player.avatar[55] === '9'), 'Malen klappt auch per Finger');
    await closed(browser, problems);
  }
  await ending();
})();
