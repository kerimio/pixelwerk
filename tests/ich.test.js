// Prüft im echten Browser: Einstellungen, Reiter „Du“ (Name, Pixel-Avatar) und „Aussehen“ (Farben als Vorlage und eigene Farbe,
// Animationen, Ton), und die Erfolgsmomente (richtige Antwort, Jubel-Karte).
const { chromium } = require('playwright');
const { neuLaden } = require('./hilfe');
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
     darum lädt neuLaden so lange neu, bis der geschriebene Stand ankommt (Schritt 6 lädt auch neu). */
  await page.goto(URL);
  await page.evaluate(() => localStorage.setItem('ngfc.v1', '{"ich":{"start":1}}'));
  await neuLaden(page);
  await page.waitForSelector('#ichBtn');
  const accent = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase());
  const start = await accent();

  // 1. Ohne Namen: Der Profil-Chip oben führt in die Einstellungen (den Hinweis „Stell dich kurz vor“ gibt es nicht mehr, das macht der Einstieg)
  ok(!(await page.$('#ichHint')) && (await page.textContent('#ichBtn .ich-n')) === 'Dein Profil' && (await page.textContent('.hub-hallo h1')) === 'Hallo', 'Ohne Namen: Chip sagt „Dein Profil“, Begrüßung ohne Namen, kein Vorstellungs-Hinweis');
  await page.click('#ichBtn');
  ok(await page.isVisible('#ichDlg[open] #ichName'), 'Einstellungen gehen im Reiter „Du“ auf');

  // 2. Name
  await page.fill('#ichName', 'Kerim');
  ok(await page.evaluate(() => S.ich.name === 'Kerim' && CAST.du.name === 'Kerim'), 'Name wird gespeichert und gilt für die Szenen');
  ok((await page.textContent('#ichBtn')).includes('Kerim') && (await page.textContent('.hub-hallo h1')) === 'Hallo Kerim', 'Name steht sofort oben im Profil-Chip und in der Begrüßung');

  // 3. Avatar malen
  await page.click('.av-tpl [data-v="2"]');
  await page.click('#avPal button[data-c="8"]');
  const box = await page.locator('#avGrid i').nth(0).boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const px = await page.evaluate(() => S.ich.avatar);
  ok(px.length === 100 && px[0] === '8' && px[9] === '8', 'Pixel malen klappt, gespiegelt auch rechts');
  ok(await page.isVisible('#ichBtn img.px-av'), 'Avatar erscheint im Profil-Chip');
  await page.click('#avZufall');
  const zufall = await page.evaluate(() => S.ich.avatar);
  ok(zufall.length === 100 && zufall !== px && /[^0]/.test(zufall), 'Zufall würfelt einen neuen Avatar');
  await page.click('#avLeer');
  ok(await page.evaluate(() => !/[^0]/.test(S.ich.avatar)) && !(await page.$('#ichBtn img.px-av')) && (await page.textContent('#ichBtn .px-leer')) === 'K', 'Leeren: ohne Avatar zeigt der Chip den Anfangsbuchstaben');
  await page.click('.av-tpl [data-v="2"]');

  // 4. Farben im Reiter „Aussehen“: Vorlage und eigene
  await page.click('#ichTab-aussehen');
  const grund = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toLowerCase());
  const grund0 = await grund();
  ok(!(await page.isChecked('#farbTint')) && await page.getAttribute('.fp[data-p="pixelwerk"]', 'aria-pressed') === 'true', 'Am Anfang: Vorlage „Pixelwerk“, Hintergrund nicht eingefärbt');
  await page.click('.fp[data-p="koralle"]');
  ok((await accent()) !== start && (await accent()) === '#d23f5a', 'Vorlage „Koralle“ färbt die App um');
  ok(await page.isChecked('#farbTint') && (await grund()) !== grund0, 'Die erste andere Farbe färbt auch den Hintergrund leicht ein');
  await page.uncheck('#farbTint');
  ok((await grund()) === grund0 && (await accent()) === '#d23f5a', 'Schalter aus: Hintergrund wieder neutral, die Farbe bleibt');
  await page.click('.fp[data-p="eigen"]');
  await page.evaluate(() => { const i = document.querySelector('#farbA'); i.value = '#ffee00'; i.dispatchEvent(new Event('input')); });
  const eig = await accent();
  ok(eig !== '#ffee00' && eig.startsWith('#'), 'Zu helle eigene Farbe wird für Lesbarkeit abgedunkelt: ' + eig);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  ok((await accent()) !== eig, 'Im dunklen Modus gibt es eine hellere Variante');
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });

  // 5. Ton und Animationen schalten, Erfolgsmoment zeigt den Namen
  await page.check('#ichTon');
  ok(await page.evaluate(() => S.ich.ton === true), 'Ton lässt sich einschalten');
  await page.uncheck('#ichTon');
  await page.uncheck('#ichMotion');
  ok(await page.evaluate(() => S.ich.motion === false && document.documentElement.dataset.motion === 'off' && !bewegungAn()), 'Schalter „Animationen“ aus setzt data-motion="off"');
  await page.check('#ichMotion');
  ok(await page.evaluate(() => S.ich.ton === false && S.ich.motion === true && bewegungAn()), 'Animationen wieder an, Ton aus');
  await page.click('#ichZu');
  ok(!(await page.isVisible('#ichDlg[open]')), 'Einstellungen schließen über das Kreuz');
  await page.evaluate(() => jubelGross('So fühlt sich Erfolg an', 'Alle Tests grün.'));
  ok(await page.isVisible('#jubelKarte') && (await page.textContent('#jubelKarte')).includes('Kerim') && !!(await page.$('#jubelKarte img.px-av')), 'Jubel-Karte zeigt Lob mit Namen und Avatar');

  // 6. Nach Neuladen ist alles noch da
  await neuLaden(page); await page.waitForSelector('#ichBtn img.px-av');
  ok((await accent()) === eig && await page.evaluate(() => S.ich.name === 'Kerim'), 'Farben, Name und Avatar überleben das Neuladen');
  ok((await page.textContent('#ichBtn .ich-n')) === 'Kerim' && (await page.textContent('.hub-hallo h1')) === 'Hallo Kerim', 'Nach dem Neuladen: Name im Profil-Chip und in der Begrüßung');
  await page.click('#ichBtn'); await page.click('#ichTab-aussehen');
  ok(await page.getAttribute('.fp[data-p="eigen"]', 'aria-pressed') === 'true' && await page.isVisible('#farbEigen') && !(await page.isChecked('#farbTint')), 'Aussehen zeigt nach dem Neuladen die eigene Farbe und den Schalter, wie gewählt');
  await page.click('#ichZu');

  // 7. Richtige Antwort im Quiz hüpft und zählt die Serie
  await page.goto(URL + '#k01'); await page.waitForSelector('#stepBody');
  await page.evaluate(() => { window.sprungZu = { id: 'k01', t: 'quiz', i: 0 }; route(); });
  const q = await page.evaluate(() => CH.find(c => c.id === 'k01').quiz[0].correct);
  await page.click('.opt[data-i="' + q + '"]');
  if (await page.isVisible('.cf')) await page.click('.cf');
  await page.waitForTimeout(80);
  ok(await page.evaluate(() => jubelSerie === 1 && !!document.querySelector('.opt.right.jubel-pop')), 'Richtige Antwort: Knopf hüpft, Serie zählt');
  ok(await page.evaluate(() => !!document.querySelector('canvas.jubel-cv')), 'Konfetti-Leinwand ist da');

  // 8. Animationen aus
  await page.evaluate(() => { S.ich.motion = false; save(); lookAnwenden(); });
  ok(await page.evaluate(() => document.documentElement.dataset.motion === 'off' && !bewegungAn()), 'Animationen aus setzt data-motion="off"');
  const anim = await page.evaluate(() => { const b = document.querySelector('.opt'); b.classList.add('jubel-pop'); return getComputedStyle(b).animationName; });
  ok(anim === 'none', 'Mit Animationen aus läuft keine CSS-Animation');
  await page.evaluate(() => { jubelTeile = []; jubelPlatzen(100, 100, 10); });
  ok(await page.evaluate(() => jubelTeile.length === 0), 'Kein Konfetti, wenn Animationen aus sind');

  // 9. Toni bekommt den Namen mit
  ok(await page.evaluate(() => mitProfil('Hallo').includes('Kerim')), 'Toni kennt den Namen');

  ok(!errors.length, 'Keine JS-Fehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fails ? '\n' + fails + ' Fehler' : '\nAlles grün');
  process.exit(fails ? 1 : 0);
})();
