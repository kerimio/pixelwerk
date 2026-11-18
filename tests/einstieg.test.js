// Prüft im echten Browser den Spiel-Einstieg beim ersten Start: Titelbild, Charakter, Erster Tag, Team, Dein Coach (KI oder ohne), Spielregeln.
// Wer neu ist, landet darin. Wer schon einen Spielstand hat, sieht ihn nie ungefragt. Dazu: Neuladen, Zurück-Taste, Tastatur, Kontrast je
// Lieblingsfarbe, ohne Bewegung, Handy-Größen.
const { oeffnen, pruefer, neuLaden } = require('./hilfe');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ok, ende } = pruefer();

const bild = page => page.evaluate(() => { const e = document.querySelector('#main > .es'); return e ? +e.dataset.bild : -1; });
const imEinstieg = page => page.evaluate(() => document.body.classList.contains('es-an'));
const ruhig = page => page.emulateMedia({ reducedMotion: 'reduce' }); // ohne Bewegung kommt der Dialog sofort: schnelle Tests
/* Vom Titelbild bis zum Bild mit der Nummer ziel durchklicken */
async function bisBild(page, ziel, name) {
  await page.click('#esWeiter'); if (ziel === 1) return;
  await page.fill('#esName', name || 'Kerim'); await page.click('#esWeiter'); if (ziel === 2) return;
  await page.click('.es-antwort'); await page.click('.es-antwort'); await page.click('.es-antwort'); await page.click('#esWeiter'); if (ziel === 3) return;
  for (const k of ['toni', 'sara', 'mia']) await page.click('.es-karte[data-k="' + k + '"]');
  await page.click('#esWeiter');
}
/* Am Ende jedes Abschnitts: JavaScript-Fehler melden, Browser schließen. Erst ganz am Schluss entscheidet ende() über den Ausgang. */
const zu = async (browser, fehler) => { ok(!fehler.length, 'keine JavaScript-Fehler in diesem Abschnitt' + (fehler.length ? ': ' + fehler.join(' | ') : '')); await browser.close(); };
/* Merkt sich, ob <html> die Klasse es-vor trägt, sobald das Dokument gelesen ist (vor DOMContentLoaded, also vor route()) */
const VOR_MERKEN = () => { document.addEventListener('readystatechange', () => { if (window.__vor === undefined) window.__vor = document.documentElement.classList.contains('es-vor'); }); };
const MIT_FORTSCHRITT = { ich: { name: 'Ada', avatar: '' }, xp: 640, steps: { k03: 2 }, done: { g01: 1794255568743, g02: 1794341968743 } };

(async () => {
  /* ---------- 1. Neuer Nutzer: ganzer Durchlauf per Klick, mit Animationen ---------- */
  {
    const { browser, page, fehler } = await oeffnen({ einstieg: true });
    ok(await imEinstieg(page) && await bild(page) === 0, 'Neuer Nutzer landet im Einstieg, auf dem Titelbild');
    ok(!(await page.isVisible('.top')) && !(await page.isVisible('#toniFab')), 'Kopfzeile und Chat-Knopf sind solange ausgeblendet');
    /* Das Skript im <head> setzt es-vor, bevor die Seite gezeichnet wird. Gemessen, sobald das Dokument gelesen ist, also vor route(). */
    await page.addInitScript(VOR_MERKEN); await page.reload(); await page.waitForSelector('#main > .es');
    ok(await page.evaluate(() => window.__vor === true && !document.documentElement.classList.contains('es-vor')) && !(await page.isVisible('.top')), 'Ohne Spielstand: es-vor steht schon vor dem ersten Bild, route() nimmt die Klasse wieder weg');
    ok(await page.$eval('.es-logo .nur-sr', e => { const c = getComputedStyle(e); return c.position === 'absolute' && c.width === '1px' && c.height === '1px'; }), 'Titelbild: Der Name für Screenreader ist unsichtbar (gemeinsame Klasse nur-sr)');
    ok(await page.isVisible('.es-wort') && (await page.textContent('.es-logo')).includes('Pixelwerk') && (await page.textContent('#esWeiter')).trim() === 'Neues Spiel', 'Titelbild: Schriftzug und „Neues Spiel“');
    ok(await page.isVisible('#esLaden') && await page.locator('.es-punkte li').count() === 6, 'Titelbild: „Spielstand laden“ und sechs Fortschritts-Punkte');
    ok(await page.evaluate(() => { const p = document.querySelectorAll('.es-pixel i'); return p.length > 10 && getComputedStyle(p[0]).animationName !== 'none'; }), 'Titelbild: Der Pixel-Hintergrund lebt');

    await page.click('#esWeiter');
    ok(await bild(page) === 1 && await page.isDisabled('#esWeiter'), 'Charakter: „Weiter“ ist ohne Namen aus');
    ok((await page.textContent('#esHinweis')).includes('Name'), 'Ein kurzer Hinweis sagt, was fehlt');
    await page.press('#esName', 'Enter');
    await page.fill('#esName', '   ');
    ok(await bild(page) === 1 && await page.isDisabled('#esWeiter'), 'Enter ohne Namen und ein Name nur aus Leerzeichen gehen nicht weiter');
    ok(await page.evaluate(() => S.ich.avatar === AV_VORLAGEN[0].px) && await page.isVisible('#esAwBild svg'), 'Der Ausweis hat von Anfang an ein Gesicht (erste Vorlage)');

    await page.fill('#esName', 'Kerim');
    ok(await page.evaluate(() => S.ich.name === 'Kerim' && CAST.du.name === 'Kerim') && (await page.textContent('#esAwName')) === 'Kerim', 'Name wird gespeichert und steht sofort auf dem Ausweis');
    ok((await page.textContent('.es-aw-rolle')).trim() === 'Frontend · Praktikant' && (await page.textContent('.es-ausweis')).includes('Pixelwerk Köln'), 'Ausweis: Abteilung mit erstem Rang (kein späterer Rang vorweg) und Standort');
    ok(await page.isEnabled('#esWeiter') && (await page.textContent('#esHinweis')) === '', 'Mit Namen ist „Weiter“ frei');

    await page.click('#esZufall');
    await page.waitForFunction(() => !document.querySelector('#esZufall').classList.contains('es-rollt'));
    const zufall = await page.evaluate(() => S.ich.avatar);
    ok(zufall.length === 400 && /[^0]/.test(zufall) && await page.evaluate(() => !AV_VORLAGEN.some(v => v.px === S.ich.avatar)), '„Zufall“ würfelt einen neuen Avatar');

    await page.click('#esMalen');
    ok(await page.isVisible('#esRaster') && await page.getAttribute('#esMalen', 'aria-expanded') === 'true', '„Selbst malen“ klappt das Pixel-Raster auf');
    await page.click('.es-palette [data-c="8"]');
    const zelle = async i => { const b = await page.locator('#esRaster i').nth(i).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
    await page.mouse.click(...await zelle(0));
    const [x1, y1] = await zelle(22), [x2, y2] = await zelle(25);
    await page.mouse.move(x1, y1); await page.mouse.down(); await page.mouse.move(x2, y2, { steps: 8 }); await page.mouse.up();
    const gemalt = await page.evaluate(() => S.ich.avatar);
    ok(gemalt[0] === '8' && gemalt.slice(22, 26) === '8888' && gemalt[21] === zufall[21], 'Klicken und Ziehen malt Pixel in der gewählten Farbe');
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem('ngfc.v1')).ich.avatar === S.ich.avatar), 'Das Gemalte ist gespeichert');
    await page.focus('#esRaster'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Space');
    ok(await bild(page) === 1 && await page.evaluate(() => S.ich.avatar[46] === '8'), 'Malen geht auch mit Pfeiltasten und Leertaste');

    await page.click('#esLeeren');
    ok(await page.evaluate(() => S.ich.avatar === '') && (await page.textContent('#esAwBild')).trim() === 'K' && await page.locator('#esAwBild svg').count() === 0, '„Alles löschen“ leert das Raster, der Ausweis zeigt solange den Anfangsbuchstaben');
    /* Absichtlich geleert bleibt geleert: weder Neuladen noch Weiter und Zurück holen die Vorlage zurück */
    await neuLaden(page); await page.waitForSelector('#esRaster');
    ok(await bild(page) === 1 && await page.evaluate(() => S.ich.avatar === '') && await page.locator('#esAwBild svg').count() === 0, 'Neuladen nach „Alles löschen“: Der Avatar bleibt leer, die Vorlage kommt nicht zurück');
    await page.click('#esWeiter'); await page.click('#esZurueck'); await page.waitForSelector('#esRaster');
    ok(await bild(page) === 1 && await page.evaluate(() => S.ich.avatar === '') && await page.locator('#esAwBild svg').count() === 0, 'Weiter und Zurück nach „Alles löschen“: Der Avatar bleibt leer');
    await page.click('.es-palette [data-c="8"]');
    await page.mouse.click(...await zelle(44));
    ok(await page.evaluate(() => S.ich.avatar.length === 400 && S.ich.avatar[44] === '8' && S.ich.avatar.replace(/0/g, '') === '8'), 'Danach malt man auf leerem Raster weiter');

    await page.click('.es-kachel[data-v="2"]');
    ok(await page.evaluate(() => S.ich.avatar === AV_VORLAGEN[2].px) && await page.getAttribute('.es-kachel[data-v="2"]', 'aria-pressed') === 'true', 'Vorlage anklicken setzt den Avatar');
    /* 1280 × 800 mit offenem Raster: Die Lieblingsfarben liegen ohne Scrollen im Bereich des klebenden Fußes. Er darf den Klick nicht schlucken. */
    await page.setViewportSize({ width: 1280, height: 800 }); await page.evaluate(() => scrollTo(0, 0));
    const imFuss = await page.evaluate(() => { const f = document.querySelector('.es-farbe[data-p="mint"]').getBoundingClientRect(), u = document.querySelector('.es-fuss').getBoundingClientRect(); return f.top + f.height / 2 > u.top; });
    const [fx, fy] = await page.evaluate(() => { const f = document.querySelector('.es-farbe[data-p="mint"]').getBoundingClientRect(); return [f.left + f.width / 2, f.top + f.height / 2]; });
    await page.mouse.click(fx, fy);
    ok(imFuss && await page.evaluate(() => S.ich.farbe && S.ich.farbe.id === 'mint'), 'Lieblingsfarbe lässt sich auch dort anklicken, wo der klebende Fuß über ihr liegt');
    await page.evaluate(() => scrollTo(0, 1e6));
    ok(await page.evaluate(() => { const k = document.querySelector('#esWeiter').getBoundingClientRect(); return [...document.querySelectorAll('.es-char button, .es-char input, #esRaster')].every(e => { if (e.id === 'esWeiter') return true; const r = e.getBoundingClientRect(); return !r.width || r.bottom <= k.top + 1 || r.right <= k.left || r.left >= k.right; }); }), 'Am Seitenende liegt nichts Bedienbares unter dem Knopf „Weiter“');
    await page.setViewportSize({ width: 1300, height: 900 });
    await page.click('.es-farbe[data-p="koralle"]');
    const akzent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase());
    ok(akzent === '#d23f5a' && await page.evaluate(() => S.ich.farbe.id === 'koralle' && S.ich.farbe.a === '#D23F5A'), 'Lieblingsfarbe färbt sofort die Oberfläche und liegt in S.ich.farbe wie im Profil');

    await page.click('#esWeiter');
    await page.waitForSelector('.es-antwort');
    ok(await bild(page) === 2 && (await page.textContent('#esChat')).includes('Hallo Kerim') && (await page.textContent('#esChat')).includes('Katrin Kaiser'), 'Erster Tag: Katrin begrüßt dich mit Namen');
    ok(await page.locator('.es-antwort').count() === 2 && await page.isHidden('#esWeiter'), 'Eigene Antworten sind Knöpfe, „Weiter“ kommt erst am Ende');
    await page.click('.es-antwort >> nth=1');
    ok(await page.locator('.es-zeile.es-ich').count() === 1 && (await page.textContent('.es-zeile.es-ich')).includes('nervös'), 'Die gewählte Antwort steht als eigene Sprechblase im Chat');
    await page.waitForSelector('.es-antwort');
    ok(await page.locator('.es-antwort').count() === 3 && (await page.textContent('#esChat')).includes('Wie viel Angular hattest du schon?'), 'Toni fragt nach den Vorkenntnissen, drei Antworten');
    await page.click('.es-antwort >> nth=2');
    await page.waitForSelector('.es-antwort');
    ok(await page.evaluate(() => S.ich.level === 2) && (await page.textContent('#esChat')).includes('Grundlagen mitmachen oder direkt Angular?'), 'Die Antwort landet in S.ich.level, Toni fragt passend nach den Grundlagen');
    ok(await page.locator('.es-antwort').count() === 2 && await page.isHidden('#esWeiter') && await page.locator('.es-antwort.es-empf').count() === 1 && (await page.textContent('.es-antwort.es-empf')).includes('Direkt mit Angular') && (await page.textContent('.es-antwort.es-empf')).includes('Tonis Vorschlag'),
      'Grundlagen oder direkt Angular: zwei Antworten, wer schon ein Framework kennt, bekommt „direkt Angular“ vorgeschlagen');
    ok(await page.evaluate(() => S.ich.weg === undefined), 'Solange nicht gewählt, steht nichts in S.ich.weg');
    await page.click('.es-antwort >> nth=1');
    await page.waitForSelector('#esWeiter:not([hidden])');
    ok(await page.evaluate(() => S.ich.weg === 'angular') && (await page.textContent('#esChat')).includes('frei anwählbar') && (await page.locator('.es-zeile.es-ich').last().textContent()).includes('Direkt mit Angular starten') && !(await page.textContent('#esChat')).includes('Tonis Vorschlag'),
      'Die Wahl landet in S.ich.weg, Toni reagiert passend, die Sprechblase zeigt nur die Antwort');
    ok(await page.locator('#esChat .es-zeile').count() === 10, 'Der Dialog hat höchstens zehn Nachrichten');
    ok((await page.textContent('#esChat')).includes('Ich führ dich durch die Kapitel.') && !/Frag mich|fragen\./.test(await page.textContent('#esChat') + await page.evaluate(() => ES_TEAM.find(t => t[0] === 'toni')[1])), 'Toni verspricht nur, was ohne KI stimmt: Er führt durch die Kapitel, kein „Frag mich alles“');
    ok(await page.evaluate(() => [...document.querySelectorAll('#esChat .es-blase p')].every(p => (p.textContent.match(/[.!?](\s|$)/g) || []).length <= 2 && p.textContent.length <= 90)), 'Jede Nachricht hat höchstens zwei kurze Sätze');
    ok(await page.locator('#esChat .es-folge').count() === 2 && await page.evaluate(() => [...document.querySelectorAll('#esChat .es-folge .es-av')].every(a => getComputedStyle(a).visibility === 'hidden')),
      'Schreibt dieselbe Figur zweimal hintereinander, steht die zweite Blase ohne Avatar darunter');
    ok(await page.locator('#esChat .es-tippt').count() === 0, 'Am Ende tippt niemand mehr');

    await page.click('#esWeiter');
    ok(await bild(page) === 3 && await page.locator('.es-karte').count() === 6 && await page.isDisabled('#esWeiter'), 'Team: sechs Karten, „Weiter“ noch aus');
    ok(await page.locator('.es-karte .es-av img.fig-av').count() === 6 && await page.evaluate(() => new Set(Object.keys(FIGUREN).map(k => figurMalen(FIGUREN[k]))).size === Object.keys(FIGUREN).length), 'Team: Jede Figur hat ihr eigenes Pixel-Gesicht');
    await page.click('.es-karte[data-k="sara"]'); await page.click('.es-karte[data-k="sara"]'); await page.click('.es-karte[data-k="jonas"]');
    ok(await page.isDisabled('#esWeiter') && (await page.textContent('#esHinweis')).includes('2 von 3'), 'Zwei Begrüßte reichen nicht, doppelt klicken zählt nicht doppelt');
    ok((await page.textContent('.es-karte[data-k="sara"] .es-ksatz')).includes('Tickets') && await page.getAttribute('.es-karte[data-k="sara"]', 'aria-pressed') === 'true', 'Die begrüßte Figur stellt sich vor und bekommt einen Haken');
    await page.click('.es-karte[data-k="ricky"]');
    ok(await page.isEnabled('#esWeiter') && await page.evaluate(() => S.ich.team.join() === 'sara,jonas,ricky'), 'Ab drei Begrüßten geht es weiter, sie stehen in S.ich.team');
    ok(await page.evaluate(() => {
      const hell = c => { const v = c.match(/[\d.]+/g).slice(0, 3).map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
      return [...document.querySelectorAll('.es-karte .es-av')].every(el => { const cs = getComputedStyle(el), a = hell(cs.color), b = hell(cs.backgroundColor); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5; });
    }), 'Die Initiale ist auf jeder Figurenfarbe lesbar (Kontrast ab 4,5)');
    ok(await page.evaluate(() => ES_TEAM.every(t => CAST[t[0]] && t[1].length <= 85 && (t[1].match(/[.!?](\s|$)/g) || []).length <= 2) && !ES_TEAM.some(t => t[0] === 'boss')), 'Jede Vorstellung ist kurz: höchstens zwei Sätze');

    await page.click('#esWeiter');
    /* Dein Coach: mit eigener KI (Schlüssel prüfen und speichern) oder ohne */
    ok(await bild(page) === 4 && (await page.textContent('#esT')) === 'Dein Coach' && await page.locator('.es-ki-k').count() === 2 && await page.isHidden('#esKiForm') && await page.isEnabled('#esWeiter'), 'Dein Coach: zwei Wege, „Weiter“ geht auch ohne Wahl');
    await page.click('.es-ki-k[data-ki="mit"]');
    ok(await page.isVisible('#esKiForm') && await page.locator('#esKiAnb button').count() === 4 && (await page.textContent('#esKiKeyL')) === 'Claude-API-Schlüssel' && await page.evaluate(() => document.activeElement.id === 'esKiKey'), 'Mit KI: vier Anbieter, Claude vorgewählt, der Fokus steht im Schlüsselfeld');
    await page.click('#esKiAnb button[data-a="gemini"]');
    ok((await page.textContent('#esKiKeyL')) === 'Gemini-API-Schlüssel' && (await page.getAttribute('#esKiKey', 'placeholder')).startsWith('AIza') && (await page.textContent('#esKiWo')).includes('aistudio'), 'Anbieter wechseln: Beschriftung, Platzhalter und wo es den Schlüssel gibt');
    await page.route('https://generativelanguage.googleapis.com/**', r => r.request().headers()['x-goog-api-key'] === 'AIza-gut'
      ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ models: [{ name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', supportedGenerationMethods: ['generateContent'] }] }) })
      : r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { message: 'API key not valid' } }) }));
    await page.click('#esKiPruef');
    ok((await page.textContent('#esKiMsg')) === 'Erst den Schlüssel einfügen.', 'Ohne Schlüssel: Hinweis statt Anfrage');
    await page.fill('#esKiKey', 'AIza-falsch'); await page.keyboard.press('Enter');
    await page.waitForSelector('#esKiTrotzdem');
    ok((await page.textContent('#esKiMsg')).includes('API key not valid') && await bild(page) === 4 && await page.evaluate(() => !aiCfg().key), 'Falscher Schlüssel: Fehler vom Anbieter, nichts gespeichert, Enter im Feld prüft und geht nicht weiter');
    await page.fill('#esKiKey', 'AIza-gut'); await page.click('#esKiPruef');
    await page.waitForFunction(() => /Klappt/.test(document.querySelector('#esKiMsg').textContent));
    ok(await page.evaluate(() => { const c = aiCfg(); return c.anbieter === 'gemini' && c.key === 'AIza-gut' && c.model === 'gemini-2.5-flash'; }) && (await page.textContent('#esHinweis')).includes('Toni nutzt Gemini'), 'Richtiger Schlüssel: gespeichert wie im Profil, mit Modell');
    ok(await page.evaluate(() => !JSON.stringify(S).includes('AIza-gut')), 'Der Schlüssel steht nicht im Spielstand');
    await page.click('#esZurueck'); await page.click('#esWeiter');
    ok(await bild(page) === 4 && await page.getAttribute('.es-ki-k[data-ki="mit"]', 'aria-pressed') === 'true' && await page.inputValue('#esKiKey') === 'AIza-gut' && (await page.textContent('#esKiMsg')).includes('Gespeichert: Gemini'), 'Zurück und wieder hin: Wahl und gespeicherter Schlüssel stehen da');
    await page.click('.es-ki-k[data-ki="ohne"]');
    ok(await page.isHidden('#esKiForm') && (await page.textContent('#esHinweis')).includes('im Profil'), 'Ohne KI: Formular zu, Hinweis aufs Profil');
    await page.evaluate(() => localStorage.removeItem('ngfc.ai'));
    await page.click('#esWeiter');
    ok(await bild(page) === 5 && await page.locator('.es-weg li').count() === 4 && await page.evaluate(() => document.querySelectorAll('.es-leiter li').length === RANKS.length), 'Spielregeln: vier Stationen und die Leiter mit allen Rängen');
    ok(await page.evaluate(() => document.querySelector('.es-weg li:last-child small').textContent.includes('Ab ' + phaseNr(AKTE.find(a => a.n === CH.find(c => c.ex).akt)) + ' ')), 'Station „Umsetzen“ nennt die Phase, in der die erste Übung kommt');
    ok((await page.textContent('.es-leiter .es-du')).includes('Praktikant') && await page.isVisible('.es-leiter .es-du .px-av'), 'Dein Avatar steht auf der untersten Sprosse');
    ok((await page.textContent('#esWeiter')).trim() === 'Erstes Ticket holen', 'Hauptknopf: „Erstes Ticket holen“');
    await page.click('#esWeiter');
    await page.waitForFunction(() => !document.body.classList.contains('es-an'));
    ok(await page.evaluate(() => location.hash === '#' + CH[0].id && typeof S.ich.start === 'number' && S.ich.start > 1e12), 'Ende: S.ich.start gesetzt, weiter ins erste Kapitel');
    ok((await page.textContent('#jubelKarte')).includes('Willkommen im Team!'), 'Zum Schluss gibt es Jubel');
    ok(await page.isVisible('.top') && (await page.textContent('#main')).includes(await page.evaluate(() => CH[0].title)), 'Das erste Kapitel ist offen, die Kopfzeile wieder da');
    ok(await page.evaluate(() => sessionStorage.getItem('pw-einstieg') === null), 'Der gemerkte Zwischenstand ist aufgeräumt');
    await neuLaden(page); await page.waitForSelector('#main > *');
    ok(!(await imEinstieg(page)) && await page.evaluate(() => S.ich.name === 'Kerim' && S.ich.avatar === AV_VORLAGEN[2].px && S.ich.level === 2 && S.ich.team.length === 3), 'Nach dem Neuladen: kein Einstieg mehr, alles gespeichert');
    await zu(browser, fehler);
  }

  /* ---------- 2. Überspringen ---------- */
  {
    const { browser, page, fehler } = await oeffnen({ einstieg: true, hash: 'k03' });
    ok(await imEinstieg(page), 'Auch mit einem Kapitel-Link landet ein neuer Nutzer erst im Einstieg');
    await page.click('#esSkip');
    ok(!(await imEinstieg(page)) && await page.evaluate(() => location.hash === '#start' && S.ich.start > 0), '„Überspringen“ führt zum Start');
    await neuLaden(page); await page.waitForSelector('#main > *');
    ok(!(await imEinstieg(page)) && await page.evaluate(() => !einstiegNoetig()), 'Nach dem Überspringen kommt der Einstieg nicht wieder');
    await zu(browser, fehler);
  }

  /* ---------- 3. Vorhandener Spielstand ohne S.ich.start ---------- */
  {
    const { browser, page, fehler } = await oeffnen({ stand: MIT_FORTSCHRITT });
    ok(!(await imEinstieg(page)) && await page.isVisible('.top'), 'Wer schon Fortschritt hat, sieht keinen Einstieg');
    await page.addInitScript(VOR_MERKEN); await page.reload(); await page.waitForSelector('.hub');
    ok(await page.evaluate(() => window.__vor === false && !document.documentElement.classList.contains('es-vor')) && await page.isVisible('.top'), 'Mit Spielstand wird es-vor gar nicht erst gesetzt, die Kopfzeile ist sofort da');
    ok(await page.evaluate(() => { document.documentElement.classList.add('es-vor'); const weg = getComputedStyle(document.querySelector('.top')).visibility === 'hidden'; route(); return weg && !document.documentElement.classList.contains('es-vor'); }) && await page.isVisible('.top'),
      'Die Klasse es-vor (Kopfzeile bis zur Entscheidung unsichtbar) nimmt route() wieder weg');
    ok(await page.evaluate(() => { const alt = S; let gut = true; [{ xp: 5 }, { done: { g01: 1 } }, { steps: { g01: 0 } }, { ich: { name: 'Ada' } }, { ich: { start: 1 } }].forEach(v => { S = withDefaults(v); if (einstiegNoetig()) gut = false; }); S = withDefaults({}); if (!einstiegNoetig()) gut = false; S = alt; return gut; }),
      'einstiegNoetig(): nur ohne XP, ohne Kapitel, ohne Namen und ohne S.ich.start');
    await zu(browser, fehler);
  }

  /* ---------- 4. Neuladen mittendrin, Zurück, Tastatur, mehrfaches renderEinstieg ---------- */
  {
    const { browser, page, fehler } = await oeffnen({ einstieg: true });
    await ruhig(page);
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('.es-pixel i')).animationName === 'none' && getComputedStyle(document.querySelector('.es-wort rect')).animationName === 'none'), 'Ohne Bewegung steht der Hintergrund still');
    await page.keyboard.press('/');
    ok(await page.evaluate(() => !document.querySelector('dialog[open]')) && await bild(page) === 0, 'Die Taste „/“ öffnet im Einstieg nicht die Suche');
    await page.keyboard.press('Enter');
    ok(await bild(page) === 1, 'Enter auf dem Titelbild startet das Spiel');
    await page.fill('#esName', 'Mo <b>');
    await page.evaluate(() => { location.hash = '#k02'; });
    await page.waitForFunction(() => location.hash === '#k02');
    await page.evaluate(() => { route(); renderEinstieg(document.querySelector('#main')); });
    ok(await bild(page) === 1 && await page.inputValue('#esName') === 'Mo <b>' && await imEinstieg(page), 'Ein Seitenwechsel mittendrin (route) fängt nicht von vorn an und verliert nichts');
    await neuLaden(page); await page.waitForSelector('.es');
    ok(await bild(page) === 1 && await page.inputValue('#esName') === 'Mo <b>', 'Neuladen beim Charakter: gleiches Bild, Name noch da');
    await page.press('#esName', 'Enter');
    ok(await bild(page) === 2 && (await page.textContent('#esChat')).includes('Hallo Mo <b>,') && await page.locator('#esChat b').count() === 0, 'Enter im Namensfeld geht weiter, der Name wird als Text gezeigt (kein HTML)');
    ok(await page.locator('#esChat .es-zeile').count() === 1 && await page.locator('.es-antwort').count() === 2, 'Ohne Bewegung steht der Dialog sofort bis zur ersten Frage da');
    await page.keyboard.press('Enter');
    ok(await bild(page) === 2 && await page.locator('.es-zeile.es-ich').count() === 0, 'Enter beantwortet keine Frage und geht nicht weiter, solange eine Antwort offen ist');
    await page.keyboard.press('2');
    ok(await page.locator('.es-zeile.es-ich').count() === 1 && await page.locator('.es-antwort').count() === 3, 'Zifferntasten wählen eine Antwort');
    await neuLaden(page); await page.waitForSelector('.es-antwort');
    ok(await bild(page) === 2 && (await page.textContent('.es-zeile.es-ich')).includes('nervös') && await page.locator('.es-antwort').count() === 3, 'Neuladen im Dialog: gleiche Stelle, die erste Antwort steht noch da');
    await page.keyboard.press('1');
    ok(await page.evaluate(() => S.ich.level === 0) && await page.locator('.es-antwort').count() === 2 && (await page.textContent('.es-antwort.es-empf')).includes('Mit Grundlagen'), 'Ohne Vorwissen schlägt Toni die Grundlagen vor');
    await neuLaden(page); await page.waitForSelector('.es-antwort');
    ok(await bild(page) === 2 && await page.locator('.es-zeile.es-ich').count() === 2 && await page.locator('.es-antwort').count() === 2 && !(await page.textContent('#esChat')).includes('undefined'), 'Neuladen vor der Grundlagen-Frage: beide Antworten stehen noch da, die Frage ist wieder offen');
    await page.keyboard.press('1');
    ok(await page.evaluate(() => S.ich.weg === 'grundlagen') && await page.evaluate(() => document.activeElement.id === 'esWeiter'), 'Nach der letzten Antwort liegt der Fokus auf „Weiter“, die Wahl steht in S.ich.weg');
    await page.keyboard.press('Enter');
    ok(await bild(page) === 3, 'Enter geht weiter zum Team');
    await page.keyboard.press('ArrowRight');
    ok(await bild(page) === 3, 'Pfeil rechts geht nicht weiter, solange die Hauptaktion nicht möglich ist');
    await page.click('.es-karte[data-k="mia"]');
    await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
    ok(await bild(page) === 3 && await page.locator('.es-karte.es-da').count() === 2, 'Enter auf einer Karte mit Tastatur-Fokus begrüßt sie');
    await page.click('.es-karte[data-k="ricky"]'); await page.keyboard.press('Enter');
    ok(await bild(page) === 4, 'Nach einem Mausklick auf eine Karte geht Enter weiter, sobald drei begrüßt sind');
    await page.keyboard.press('ArrowLeft');
    await neuLaden(page); await page.waitForSelector('.es-karte');
    ok(await bild(page) === 3 && await page.locator('.es-karte.es-da').count() === 3 && (await page.textContent('#esHinweis')).includes('3 von 6'), 'Neuladen beim Team: Begrüßte bleiben begrüßt');
    await page.keyboard.press('ArrowLeft');
    ok(await bild(page) === 2 && await page.locator('#esChat .es-zeile').count() === 10 && await page.isVisible('#esWeiter'), 'Pfeil links geht zurück: Der Dialog steht fertig da');
    await page.click('#esZurueck');
    ok(await bild(page) === 1 && await page.inputValue('#esName') === 'Mo <b>', 'Zurück-Knopf: Charakter mit allen Eingaben');
    await page.click('#esZurueck');
    ok(await bild(page) === 0 && await page.isHidden('#esZurueck'), 'Auf dem Titelbild gibt es kein Zurück');
    await zu(browser, fehler);
  }

  /* ---------- 5. Zurück-Taste des Browsers: ein Bild zurück, und am Ende bleibt kein Rest im Verlauf ---------- */
  {
    const { browser, page, fehler } = await oeffnen({ einstieg: true });
    await ruhig(page);
    const laenge = await page.evaluate(() => history.length);
    await bisBild(page, 2);
    await page.goBack();
    ok(await bild(page) === 1 && await imEinstieg(page) && await page.inputValue('#esName') === 'Kerim', 'Zurück-Taste des Browsers im Dialog: zurück zum Charakter, nichts verloren');
    await page.goBack();
    ok(await bild(page) === 0 && await imEinstieg(page), 'Nochmal Zurück: Titelbild');
    await page.click('#esWeiter'); await page.click('#esWeiter'); await page.click('.es-antwort'); await page.click('.es-antwort'); await page.click('.es-antwort'); await page.click('#esWeiter');
    for (const k of ['toni', 'sara', 'mia']) await page.click('.es-karte[data-k="' + k + '"]');
    await page.click('#esWeiter'); await page.click('#esWeiter'); await page.click('#esWeiter');
    await page.waitForFunction(() => !document.body.classList.contains('es-an'));
    ok(await page.evaluate(() => location.hash === '#' + CH[0].id && history.state === null), 'Am Ende steht das erste Kapitel an der Stelle des eigenen Verlaufs-Eintrags');
    await page.goBack(); await page.waitForFunction(() => location.hash !== '#' + CH[0].id);
    ok(!(await imEinstieg(page)) && await page.isVisible('.top') && await page.evaluate(n => history.length === n + 1, laenge), 'Zurück aus dem Kapitel führt zum Start, im Verlauf liegt nur ein Eintrag mehr als vorher');
    await zu(browser, fehler);
  }

  /* ---------- 6. Doppelklick überspringt kein Bild ---------- */
  {
    const { browser, page, fehler } = await oeffnen({ einstieg: true });
    await ruhig(page);
    await bisBild(page, 3);
    for (const k of ['toni', 'sara', 'mia']) await page.click('.es-karte[data-k="' + k + '"]');
    await page.dblclick('#esWeiter');
    ok(await bild(page) === 4 && await imEinstieg(page), 'Ein Doppelklick auf „Weiter“ klickt das nächste Bild nicht gleich mit weg');
    await zu(browser, fehler);
  }

  /* ---------- 7. Spielstand laden auf dem Titelbild ---------- */
  {
    const datei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pw-es-')), 'stand.json');
    fs.writeFileSync(datei, JSON.stringify(Object.assign({ app: 'pixelwerk-angular', version: 1 }, MIT_FORTSCHRITT)));
    const { browser, page, fehler } = await oeffnen({ einstieg: true });
    await page.setInputFiles('#esDatei', datei);
    await page.waitForFunction(() => !document.body.classList.contains('es-an'));
    ok(await page.evaluate(() => S.xp === 640 && S.ich.name === 'Ada' && !einstiegNoetig()) && await page.isVisible('.top'), '„Spielstand laden“ lädt die Datei und beendet den Einstieg');
    fs.writeFileSync(datei, '{"kaputt":true}');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); await page.reload(); await page.waitForSelector('#esDatei', { state: 'attached' });
    await page.setInputFiles('#esDatei', datei);
    await page.waitForSelector('#toast.show');
    ok(await imEinstieg(page) && await bild(page) === 0, 'Eine unpassende Datei ändert nichts, der Einstieg bleibt');
    await zu(browser, fehler);
  }

  /* ---------- 8. einstiegStarten(): nochmal ansehen, ohne Fortschritt zu ändern ---------- */
  {
    const stand = Object.assign({}, MIT_FORTSCHRITT, { ich: { name: 'Ada', avatar: '', start: 1700000000000, level: 1, team: ['toni'] } });
    const { browser, page, fehler } = await oeffnen({ stand });
    await ruhig(page);
    const fortschritt = () => page.evaluate(() => JSON.stringify([S.xp, S.done, S.steps, S.quiz, S.ex, S.ich.name, S.ich.avatar, S.ich.start]));
    const vorher = await fortschritt();
    await page.evaluate(() => { document.body.classList.add('chat-open'); einstiegStarten(); });
    ok(await imEinstieg(page) && await bild(page) === 0 && !(await page.isVisible('#esLaden')), 'einstiegStarten() zeigt den Einstieg erneut, ohne „Spielstand laden“');
    ok(!(await page.isVisible('.chat')) && !(await page.isVisible('#toniFab')), 'Ein offener Chat ist solange ausgeblendet');
    await page.evaluate(() => document.body.classList.remove('chat-open'));
    await page.click('#esWeiter');
    ok(await page.inputValue('#esName') === 'Ada' && await page.evaluate(() => S.ich.avatar === ''), 'Name steht schon da, der Avatar wird nicht ungefragt gesetzt');
    await page.click('#esWeiter');
    await page.click('.es-antwort'); await page.click('.es-antwort >> nth=2'); await page.click('.es-antwort >> nth=1'); await page.click('#esWeiter');
    for (const k of ['sara', 'mia', 'leon']) await page.click('.es-karte[data-k="' + k + '"]');
    await page.click('#esWeiter'); await page.click('#esWeiter');
    ok((await page.textContent('.es-leiter .es-du')).includes('Junior-Dev'), 'Auf der Leiter stehst du auf deinem jetzigen Rang');
    await page.click('#esWeiter');
    await page.waitForFunction(() => !document.body.classList.contains('es-an'));
    ok(await fortschritt() === vorher && await page.evaluate(() => location.hash === '#start'), 'Danach: Fortschritt, Name, Avatar und Startdatum unverändert, zurück am Start');
    ok(await page.locator('#jubelKarte').count() === 0, 'Beim erneuten Ansehen gibt es keinen Jubel');
    ok(await page.evaluate(() => S.ich.level === 2 && S.ich.weg === 'angular' && S.ich.team.join() === 'toni,sara,mia,leon'), 'Neue Antworten (auch die Grundlagen-Wahl) und neu Begrüßte kommen dazu');
    await page.evaluate(() => einstiegStarten());
    await page.click('#esSkip');
    ok(!(await imEinstieg(page)) && await fortschritt() === vorher && await page.evaluate(() => !einstiegNoetig()), '„Beenden“ beim erneuten Ansehen ändert nichts');
    await zu(browser, fehler);
  }
  {
    const lang = 'Maximilian-Alexander IV.'; /* 24 Zeichen, so lang durfte ein Name früher sein. Neue Namen haben höchstens 20. */
    const { browser, page, fehler } = await oeffnen({ stand: { ich: { name: lang, start: 1700000000000 }, xp: 1000, done: { g01: 1 } } });
    await ruhig(page);
    await page.evaluate(() => einstiegStarten());
    await page.click('#esWeiter');
    ok((await page.textContent('.es-aw-rolle')).trim() === 'Frontend-Dev' && (await page.textContent('.es-kopf h1')).trim() === 'Dein Charakter', 'Ausweis beim erneuten Ansehen: Der Rang „Frontend-Dev“ steht nicht doppelt da');
    await page.click('.es-kachel[data-v="3"]');
    ok(await page.evaluate(n => S.ich.name === n && S.ich.avatar === AV_VORLAGEN[3].px, lang) && (await page.textContent('#esAwName')) === lang, 'Ein langer Name aus dem Profil bleibt ganz, geändert wird nur, was man anfasst');
    ok(await page.getAttribute('#esName', 'maxlength') === '20' && await page.inputValue('#esName') === lang && await page.evaluate(n => ichName() === n, lang), 'Namensfeld im Einstieg: höchstens 20 Zeichen wie im Profil, der ältere längere Name wird beim Laden nicht gekürzt');
    await page.fill('#esName', 'Bartholomäus-Ferdinand der Dritte');
    ok(await page.inputValue('#esName') === 'Bartholomäus-Ferdina' && await page.evaluate(() => S.ich.name === 'Bartholomäus-Ferdina'), 'Ein neu getippter Name endet nach 20 Zeichen, im Feld wie im Spielstand');
    await zu(browser, fehler);
  }

  /* ---------- 9. Jede Lieblingsfarbe, hell und dunkel: Der Hauptknopf bleibt lesbar ---------- */
  for (const design of ['light', 'dark']) {
    const { browser, page, fehler } = await oeffnen({ einstieg: true });
    await ruhig(page);
    await page.evaluate(d => { document.documentElement.dataset.theme = d; }, design);
    await page.click('#esWeiter'); await page.fill('#esName', 'Kerim');
    const schwach = [];
    for (const id of await page.evaluate(() => FARB_PRESETS.map(p => p.id))) {
      await page.click('.es-farbe[data-p="' + id + '"]');
      const k = await page.evaluate(() => {
        const hell = c => { const v = c.match(/[\d.]+/g).slice(0, 3).map(x => x / 255).map(x => x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4)); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
        const kontrast = el => { const cs = getComputedStyle(el), a = hell(cs.color), b = hell(cs.backgroundColor); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); };
        return Math.min(kontrast(document.querySelector('#esWeiter')), kontrast(document.querySelector('.es-aw-kopf')));
      });
      if (k < 4.5) schwach.push(id + ' ' + k.toFixed(2));
    }
    ok(!schwach.length, (design === 'dark' ? 'Dunkel' : 'Hell') + ': Hauptknopf und Ausweis-Kopf sind mit jeder Lieblingsfarbe lesbar (Kontrast ab 4,5)' + (schwach.length ? ': ' + schwach.join(', ') : ''));
    await zu(browser, fehler);
  }

  /* ---------- 10. Handy: kein Querscrollen, Hauptknopf erreichbar, Malen per Finger ---------- */
  for (const breite of [390, 360]) {
    const { browser, page, fehler } = await oeffnen({ einstieg: true, viewport: { width: breite, height: breite === 390 ? 844 : 640 } });
    await ruhig(page);
    const passt = () => page.evaluate(() => { const b = document.querySelector('#esWeiter').getBoundingClientRect(); return document.documentElement.scrollWidth <= innerWidth && b.width >= 40 && b.height >= 40 && b.left >= 0 && b.right <= innerWidth; });
    const unten = () => page.evaluate(() => { scrollTo(0, 0); const b = document.querySelector('#esWeiter').getBoundingClientRect(); return b.bottom <= innerHeight + 1 && b.top > 0; });
    let gut = await passt();
    await page.click('#esWeiter');
    await page.fill('#esName', 'WWWWWWWWWWWWWWWWWWWW'); await page.click('#esMalen');
    gut = gut && await passt() && await unten();
    await page.click('#esWeiter'); await page.click('.es-antwort'); await page.click('.es-antwort >> nth=2'); await page.click('.es-antwort >> nth=1');
    gut = gut && await passt();
    await page.click('#esWeiter');
    for (const k of ['toni', 'sara', 'jonas', 'mia', 'leon', 'ricky']) await page.click('.es-karte[data-k="' + k + '"]');
    gut = gut && await passt() && await unten();
    await page.click('#esWeiter'); await page.click('.es-ki-k[data-ki="mit"]');
    gut = gut && await passt() && await unten();
    await page.click('#esWeiter');
    gut = gut && await passt() && await unten();
    ok(gut, breite + ' px breit: alle sechs Bilder ohne Querscrollen, Hauptknopf immer im Bild (auch mit langem Namen)');
    await zu(browser, fehler);
  }
  {
    const { browser, page, fehler } = await oeffnen({ einstieg: true, mobil: true });
    await page.tap('#esWeiter'); await page.fill('#esName', 'Kerim'); await page.tap('#esMalen'); await page.tap('.es-palette [data-c="9"]');
    await page.tap('#esRaster i >> nth=55');
    ok(await page.evaluate(() => S.ich.avatar[55] === '9'), 'Malen klappt auch per Finger');
    await zu(browser, fehler);
  }
  await ende();
})();
