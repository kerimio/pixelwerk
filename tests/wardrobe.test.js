// Prüft im echten Browser die Garderobe: Sachen für den Avatar gewinnen (still beim Laden, mit Jubel beim Abschließen),
// anziehen und ausziehen, „Ganz von vorn anfangen“, gesperrte Sachen mit Bedingung, Speichern im Spielstand und die Anzeige auf dem Schreibtisch.
const { openPage, checker, reloadIt } = require('./helpers');
const { ok, ending } = checker();
const DEV = '0000000000' + '0055555500' + '0555555550' + '0533333350' + '0311311130' + '0333333330' + '0033113300' + '0003333000' + '0077777700' + '0777777770';

(async () => {
  /* Spielstand: „Das große Bild“ (Phase 0) fertig, von „Erste Woche“ (Phase 1) fehlt nur das letzte Kapitel */
  let { browser, page, problems } = await openPage({ intro: true });
  const ids = await page.evaluate(() => ({ p0: CH.filter(c => c.act === 0).map(c => c.id), p1: CH.filter(c => c.act === 1).map(c => c.id), p2: CH.filter(c => c.act === 2).map(c => c.id) }));
  /* Dazu vier Kapitel aus „Probezeit“, damit es zehn geschaffte Kapitel sind (der Bart) */
  const done = Object.fromEntries(ids.p0.concat(ids.p1.slice(0, -1), ids.p2.slice(0, 4)).map(id => [id, Date.now()]));
  await page.evaluate(s => localStorage.setItem('ngfc.v1', s), JSON.stringify({ player: { name: 'Kerim', start: 1, avatar: DEV }, xp: 900, done, updated: 1 }));
  await reloadIt(page); await page.waitForSelector('.hub');

  // 1. Alter Spielstand: Was schon verdient ist, kommt still in den Schrank, ohne es anzuziehen
  const st = await page.evaluate(() => ({ wardrobe: S.wardrobe, fresh: S.wardrobeNew, outfit: S.player.outfit, updated: S.updated }));
  ok(st.wardrobe.includes('nerdbrille') && st.wardrobe.includes('tasse') && st.wardrobe.includes('bart') && !st.wardrobe.includes('muetze'), 'Schon verdiente Sachen (Phase, 1 und 10 Kapitel) landen im Schrank, offene nicht');
  ok(!st.outfit && st.updated === 1, 'Beim Laden wird nichts angezogen und der Spielstand gilt nicht als geändert');
  ok(await page.isVisible('.hub-photo-new') && await page.isVisible('#meBtn .hub-av-new'), 'Neue Sachen: Markierung am Avatar auf dem Schreibtisch und im Profil-Chip');

  // 2. Schreibtisch: Das nächste Kapitel schließt „Erste Woche“ ab und bringt die Mütze, die Phasen zeigen ihre Sache
  ok((await page.textContent('.hub-go')).includes('Pixelwerk-Mütze'), '„Dein nächstes Ticket“ nennt die Sache, die es dafür gibt');
  ok(await page.evaluate(() => { const g = document.querySelector('.hub-p details[data-p="0"] .hub-pitem'), o = document.querySelector('.hub-p details[data-p="1"] .hub-pitem'); return g && g.classList.contains('got') && o && !o.classList.contains('got'); }), 'Phasen zeigen ihre Sache: gewonnen farbig, offen grau');

  // 3. Garderobe über den Avatar auf dem Schreibtisch öffnen
  await page.click('#hubPhoto');
  ok(await page.isVisible('#meDlg[open] #wd'), 'Klick auf den Avatar öffnet die Garderobe im Profil');
  ok((await page.textContent('.wd-count')).trim() === '5 von 17 Sachen', 'Zähler stimmt (zwei freie, drei gewonnene)');
  ok(await page.evaluate(() => document.querySelector('.wd-slots [aria-pressed="true"]').dataset.pl === 'gesicht'), 'Die Garderobe öffnet beim Platz mit der neuen Sache');
  ok(await page.isVisible('.wd-k[data-s="nerdbrille"] .wd-new'), 'Neue Sache trägt „Neu“');
  const closed = await page.getAttribute('.wd-close', 'aria-label');
  ok(/Sonnenbrille, noch nicht gewonnen\. Schließ die Phase „Probezeit“ ab\./.test(closed), 'Gesperrte Sache sagt in einem ganzen Satz, wie man sie gewinnt');

  // 4. Anziehen: Brille und Basecap, der Avatar im Chip ändert sich
  const previous = await page.getAttribute('#meBtn img.px-av', 'src');
  await page.click('.wd-k[data-s="nerdbrille"]');
  await page.click('.wd-slots [data-pl="kopf"]');
  await page.click('.wd-k[data-s="cap"]');
  ok(await page.evaluate(() => S.player.outfit.gesicht === 'nerdbrille' && S.player.outfit.kopf === 'cap'), 'Anziehen speichert das Outfit im Spielstand');
  ok((await page.getAttribute('#meBtn img.px-av', 'src')) !== previous, 'Der Avatar im Profil-Chip trägt die Sachen');
  ok(await page.evaluate(() => !document.querySelector('.wd-k[data-s="muetze"]') && !!document.querySelector('.wd-close')), 'Nicht gewonnene Sachen lassen sich nicht anziehen');
  await page.click('.wd-k[data-s=""]');
  ok(await page.evaluate(() => !S.player.outfit.kopf && S.player.outfit.gesicht === 'nerdbrille'), '„Ohne“ zieht nur diesen Platz aus');
  ok(await page.evaluate(() => !S.wardrobeNew.includes('nerdbrille')), 'Angesehene Sachen sind danach nicht mehr neu');

  // 5. Nach dem Neuladen ist alles noch da
  await page.keyboard.press('Escape');
  await reloadIt(page); await page.waitForSelector('.hub');
  ok(await page.evaluate(() => S.player.outfit.gesicht === 'nerdbrille' && S.wardrobe.includes('nerdbrille')), 'Schrank und Outfit überstehen das Neuladen');

  // 6. Ein Kapitel abschließen: Die Mütze kommt mit Jubel und wird gleich angezogen, weil der Kopf frei ist
  await page.evaluate(id => { S.done[id] = Date.now(); addXp(30); }, ids.p1[ids.p1.length - 1]);
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => S.wardrobe.includes('muetze') && S.player.outfit.kopf === 'muetze'), 'Phase geschafft: Mütze gewonnen und auf den freien Platz gesetzt');
  ok(((await page.textContent('#cheerCard')) || '').includes('Neu für deinen Avatar: Pixelwerk-Mütze'), 'Die Jubel-Karte zeigt die neue Sache');

  // 7. Manipuliertes Outfit: Eine nicht gewonnene Sache wird nicht gezeichnet
  ok(await page.evaluate(() => { S.player.outfit.kopf = 'krone'; return !outfit().kopf; }), 'Eine nicht gewonnene Sache im Outfit wird ignoriert');
  // 8. Ganz von vorn anfangen: erst eine Rückfrage, dann ist alles weg und der Einstieg startet
  await page.evaluate(() => { const k = document.getElementById('cheerCard'); if (k) k.remove(); });
  await page.evaluate(() => meOpen('spielstand'));
  await page.click('#newBtn');
  ok(await page.isVisible('#newYes') && await page.evaluate(() => S.xp > 0), 'Neustart fragt erst nach und löscht noch nichts');
  await page.click('#newNo');
  ok(await page.isVisible('#newBtn') && await page.evaluate(() => S.xp > 0), 'Abbrechen lässt alles, wie es ist');
  await page.click('#newBtn'); await page.click('#newYes');
  await page.waitForSelector('.intro-image');
  ok(await page.evaluate(() => S.xp === 0 && !Object.keys(S.done).length && !S.wardrobe.length && !S.player.avatar && !S.player.outfit), 'Ja: Fortschritt, Avatar und Garderobe sind weg');
  ok(await page.evaluate(() => document.body.classList.contains('intro-on') && !document.getElementById('meDlg').open), 'Danach startet der Einstieg wie beim ersten Mal');
  await reloadIt(page); await page.waitForSelector('.intro-image');
  ok(await page.evaluate(() => S.xp === 0), 'Der leere Stand übersteht das Neuladen');
  await ending(browser, problems);
})();
