// Prüft im echten Browser: Einstellungen, Reiter „Du“ (Name, Pixel-Avatar) und „Aussehen“ (Farben als Vorlage und eigene Farbe,
// Animationen, Ton), und die Erfolgsmomente (richtige Antwort, Jubel-Karte).
const { chromium } = require('playwright');
const { reloadIt } = require('./helpers');
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
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await ctx.route('**/*', r => {
    const u = r.request().url();
    const m = u.match(/cdn\.jsdelivr\.net\/npm\/(@?[^@]+)@[^/]+\/(.*)$/);
    if (m) return r.fulfill({ body: fs.readFileSync(path.join(NM, m[1], m[2])), contentType: 'application/javascript' });
    if (u.startsWith('file://')) return r.continue();
    return r.abort();
  });
  /* Spiel-Einstieg gilt als erlebt. Chromium verliert unter file:// beim Neuladen ab und zu den ganzen Speicher,
     darum lädt reloadIt so lange neu, bis der geschriebene Stand ankommt (Schritt 6 lädt auch neu). */
  await page.goto(URL);
  await page.evaluate(() => localStorage.setItem('ngfc.v1', '{"ich":{"start":1}}'));
  await reloadIt(page);
  await page.waitForSelector('#meBtn');
  const accent = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase());
  const start = await accent();

  // 1. Ohne Namen: Der Profil-Chip oben führt in die Einstellungen (den Hinweis „Stell dich kurz vor“ gibt es nicht mehr, das macht der Einstieg)
  ok(!(await page.$('#ichHint')) && (await page.textContent('#meBtn .me-n')) === 'Dein Profil' && (await page.textContent('.hub-hello h1')) === 'Hallo', 'Ohne Namen: Chip sagt „Dein Profil“, Begrüßung ohne Namen, kein Vorstellungs-Hinweis');
  await page.click('#meBtn');
  ok(await page.isVisible('#meDlg[open] #meName'), 'Einstellungen gehen im Reiter „Du“ auf');

  // 2. Name
  await page.fill('#meName', 'Kerim');
  ok(await page.evaluate(() => S.player.name === 'Kerim' && CAST.du.name === 'Kerim'), 'Name wird gespeichert und gilt für die Szenen');
  ok((await page.textContent('#meBtn')).includes('Kerim') && (await page.textContent('.hub-hello h1')) === 'Hallo Kerim', 'Name steht sofort oben im Profil-Chip und in der Begrüßung');

  // 3. Avatar malen
  await page.click('.av-tpl [data-v="2"]');
  await page.click('#avPal button[data-c="8"]');
  const box = await page.locator('#avGrid i').nth(0).boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const px = await page.evaluate(() => S.player.avatar);
  ok(px.length === 400 && px[0] === '8' && px[19] === '8', 'Pixel malen klappt, gespiegelt auch rechts');
  ok(await page.isVisible('#meBtn img.px-av'), 'Avatar erscheint im Profil-Chip');
  await page.click('#avRandom');
  const chance = await page.evaluate(() => S.player.avatar);
  ok(chance.length === 400 && chance !== px && /[^0]/.test(chance), 'Zufall würfelt einen neuen Avatar');
  await page.click('#avClear');
  ok(await page.evaluate(() => !/[^0]/.test(S.player.avatar)) && !(await page.$('#meBtn img.px-av')) && (await page.textContent('#meBtn .px-empty')) === 'K', 'Leeren: ohne Avatar zeigt der Chip den Anfangsbuchstaben');
  await page.click('.av-tpl [data-v="2"]');

  // 4. Farben im Reiter „Aussehen“: Vorlage und eigene
  await page.click('#meTab-aussehen');
  const reason = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toLowerCase());
  const reason0 = await reason();
  ok(!(await page.isChecked('#colorTint')) && await page.getAttribute('.fp[data-p="pixelwerk"]', 'aria-pressed') === 'true', 'Am Anfang: Vorlage „Pixelwerk“, Hintergrund nicht eingefärbt');
  await page.click('.fp[data-p="koralle"]');
  ok((await accent()) !== start && (await accent()) === '#d23f5a', 'Vorlage „Koralle“ färbt die App um');
  ok(await page.isChecked('#colorTint') && (await reason()) !== reason0, 'Die erste andere Farbe färbt auch den Hintergrund leicht ein');
  await page.uncheck('#colorTint');
  ok((await reason()) === reason0 && (await accent()) === '#d23f5a', 'Schalter aus: Hintergrund wieder neutral, die Farbe bleibt');
  await page.click('.fp[data-p="eigen"]');
  await page.evaluate(() => { const i = document.querySelector('#colorA'); i.value = '#ffee00'; i.dispatchEvent(new Event('input')); });
  const own = await accent();
  ok(own !== '#ffee00' && own.startsWith('#'), 'Zu helle eigene Farbe wird für Lesbarkeit abgedunkelt: ' + own);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  ok((await accent()) !== own, 'Im dunklen Modus gibt es eine hellere Variante');
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });

  // 5. Ton und Animationen schalten, Erfolgsmoment zeigt den Namen
  await page.check('#meSound');
  ok(await page.evaluate(() => S.player.sound === true), 'Ton lässt sich einschalten');
  await page.uncheck('#meSound');
  await page.uncheck('#meMotion');
  ok(await page.evaluate(() => S.player.motion === false && document.documentElement.dataset.motion === 'off' && !motionOn()), 'Schalter „Animationen“ aus setzt data-motion="off"');
  await page.check('#meMotion');
  ok(await page.evaluate(() => S.player.sound === false && S.player.motion === true && motionOn()), 'Animationen wieder an, Ton aus');
  await page.click('#meClose');
  ok(!(await page.isVisible('#meDlg[open]')), 'Einstellungen schließen über das Kreuz');
  await page.evaluate(() => cheerBig('So fühlt sich Erfolg an', 'Alle Tests grün.'));
  ok(await page.isVisible('#cheerCard') && (await page.textContent('#cheerCard')).includes('Kerim') && !!(await page.$('#cheerCard img.px-av')), 'Jubel-Karte zeigt Lob mit Namen und Avatar');

  // 6. Nach Neuladen ist alles noch da
  await reloadIt(page); await page.waitForSelector('#meBtn img.px-av');
  ok((await accent()) === own && await page.evaluate(() => S.player.name === 'Kerim'), 'Farben, Name und Avatar überleben das Neuladen');
  ok((await page.textContent('#meBtn .me-n')) === 'Kerim' && (await page.textContent('.hub-hello h1')) === 'Hallo Kerim', 'Nach dem Neuladen: Name im Profil-Chip und in der Begrüßung');
  await page.click('#meBtn'); await page.click('#meTab-aussehen');
  ok(await page.getAttribute('.fp[data-p="eigen"]', 'aria-pressed') === 'true' && await page.isVisible('#colorCustom') && !(await page.isChecked('#colorTint')), 'Aussehen zeigt nach dem Neuladen die eigene Farbe und den Schalter, wie gewählt');
  await page.click('#meClose');

  // 7. Richtige Antwort im Quiz hüpft und zählt die Serie
  await page.goto(URL + '#k01'); await page.waitForSelector('#stepBody');
  await page.evaluate(() => { window.jumpTo = { id: 'k01', t: 'quiz', i: 0 }; route(); });
  const q = await page.evaluate(() => CH.find(c => c.id === 'k01').quiz[0].correct);
  await page.click('.opt[data-i="' + q + '"]');
  if (await page.isVisible('.cf')) await page.click('.cf');
  await page.waitForTimeout(80);
  ok(await page.evaluate(() => cheerStreak === 1 && !!document.querySelector('.opt.right.cheer-pop')), 'Richtige Antwort: Knopf hüpft, Serie zählt');
  ok(await page.evaluate(() => !!document.querySelector('canvas.cheer-cv')), 'Konfetti-Leinwand ist da');

  // 8. Animationen aus
  await page.evaluate(() => { S.player.motion = false; save(); lookApply(); });
  ok(await page.evaluate(() => document.documentElement.dataset.motion === 'off' && !motionOn()), 'Animationen aus setzt data-motion="off"');
  const anim = await page.evaluate(() => { const b = document.querySelector('.opt'); b.classList.add('cheer-pop'); return getComputedStyle(b).animationName; });
  ok(anim === 'none', 'Mit Animationen aus läuft keine CSS-Animation');
  await page.evaluate(() => { cheerParts = []; cheerBurst(100, 100, 10); });
  ok(await page.evaluate(() => cheerParts.length === 0), 'Kein Konfetti, wenn Animationen aus sind');

  // 9. Toni bekommt den Namen mit
  ok(await page.evaluate(() => withProfile('Hallo').includes('Kerim')), 'Toni kennt den Namen');

  ok(!errors.length, 'Keine JS-Fehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fails ? '\n' + fails + ' Fehler' : '\nAlles grün');
  process.exit(fails ? 1 : 0);
})();
