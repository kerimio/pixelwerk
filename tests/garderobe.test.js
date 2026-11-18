// Prüft im echten Browser die Garderobe: Sachen für den Avatar gewinnen (still beim Laden, mit Jubel beim Abschließen),
// anziehen und ausziehen, „Ganz von vorn anfangen“, gesperrte Sachen mit Bedingung, Speichern im Spielstand und die Anzeige auf dem Schreibtisch.
const { oeffnen, pruefer, neuLaden } = require('./hilfe');
const { ok, ende } = pruefer();
const DEV = '0000000000' + '0055555500' + '0555555550' + '0533333350' + '0311311130' + '0333333330' + '0033113300' + '0003333000' + '0077777700' + '0777777770';

(async () => {
  /* Spielstand: „Das große Bild“ (Phase 0) fertig, von „Erste Woche“ (Phase 1) fehlt nur das letzte Kapitel */
  let { browser, page, fehler } = await oeffnen({ einstieg: true });
  const ids = await page.evaluate(() => ({ p0: CH.filter(c => c.akt === 0).map(c => c.id), p1: CH.filter(c => c.akt === 1).map(c => c.id), p2: CH.filter(c => c.akt === 2).map(c => c.id) }));
  /* Dazu vier Kapitel aus „Probezeit“, damit es zehn geschaffte Kapitel sind (der Bart) */
  const done = Object.fromEntries(ids.p0.concat(ids.p1.slice(0, -1), ids.p2.slice(0, 4)).map(id => [id, Date.now()]));
  await page.evaluate(s => localStorage.setItem('ngfc.v1', s), JSON.stringify({ ich: { name: 'Kerim', start: 1, avatar: DEV }, xp: 900, done, updated: 1 }));
  await neuLaden(page); await page.waitForSelector('.hub');

  // 1. Alter Spielstand: Was schon verdient ist, kommt still in den Schrank, ohne es anzuziehen
  const st = await page.evaluate(() => ({ schrank: S.schrank, neu: S.schrankNeu, outfit: S.ich.outfit, updated: S.updated }));
  ok(st.schrank.includes('nerdbrille') && st.schrank.includes('tasse') && st.schrank.includes('bart') && !st.schrank.includes('muetze'), 'Schon verdiente Sachen (Phase, 1 und 10 Kapitel) landen im Schrank, offene nicht');
  ok(!st.outfit && st.updated === 1, 'Beim Laden wird nichts angezogen und der Spielstand gilt nicht als geändert');
  ok(await page.isVisible('.hub-foto-neu') && await page.isVisible('#ichBtn .hub-av-neu'), 'Neue Sachen: Markierung am Avatar auf dem Schreibtisch und im Profil-Chip');

  // 2. Schreibtisch: Das nächste Kapitel schließt „Erste Woche“ ab und bringt die Mütze, die Phasen zeigen ihre Sache
  ok((await page.textContent('.hub-los')).includes('Pixelwerk-Mütze'), '„Dein nächstes Ticket“ nennt die Sache, die es dafür gibt');
  ok(await page.evaluate(() => { const g = document.querySelector('.hub-p details[data-p="0"] .hub-psache'), o = document.querySelector('.hub-p details[data-p="1"] .hub-psache'); return g && g.classList.contains('got') && o && !o.classList.contains('got'); }), 'Phasen zeigen ihre Sache: gewonnen farbig, offen grau');

  // 3. Garderobe über den Avatar auf dem Schreibtisch öffnen
  await page.click('#hubFoto');
  ok(await page.isVisible('#ichDlg[open] #gd'), 'Klick auf den Avatar öffnet die Garderobe im Profil');
  ok((await page.textContent('.gd-zahl')).trim() === '5 von 17 Sachen', 'Zähler stimmt (zwei freie, drei gewonnene)');
  ok(await page.evaluate(() => document.querySelector('.gd-plaetze [aria-pressed="true"]').dataset.pl === 'gesicht'), 'Die Garderobe öffnet beim Platz mit der neuen Sache');
  ok(await page.isVisible('.gd-k[data-s="nerdbrille"] .gd-neu'), 'Neue Sache trägt „Neu“');
  const zu = await page.getAttribute('.gd-zu', 'aria-label');
  ok(/Sonnenbrille, noch nicht gewonnen\. Schließ die Phase „Probezeit“ ab\./.test(zu), 'Gesperrte Sache sagt in einem ganzen Satz, wie man sie gewinnt');

  // 4. Anziehen: Brille und Basecap, der Avatar im Chip ändert sich
  const vorher = await page.getAttribute('#ichBtn img.px-av', 'src');
  await page.click('.gd-k[data-s="nerdbrille"]');
  await page.click('.gd-plaetze [data-pl="kopf"]');
  await page.click('.gd-k[data-s="cap"]');
  ok(await page.evaluate(() => S.ich.outfit.gesicht === 'nerdbrille' && S.ich.outfit.kopf === 'cap'), 'Anziehen speichert das Outfit im Spielstand');
  ok((await page.getAttribute('#ichBtn img.px-av', 'src')) !== vorher, 'Der Avatar im Profil-Chip trägt die Sachen');
  ok(await page.evaluate(() => !document.querySelector('.gd-k[data-s="muetze"]') && !!document.querySelector('.gd-zu')), 'Nicht gewonnene Sachen lassen sich nicht anziehen');
  await page.click('.gd-k[data-s=""]');
  ok(await page.evaluate(() => !S.ich.outfit.kopf && S.ich.outfit.gesicht === 'nerdbrille'), '„Ohne“ zieht nur diesen Platz aus');
  ok(await page.evaluate(() => !S.schrankNeu.includes('nerdbrille')), 'Angesehene Sachen sind danach nicht mehr neu');

  // 5. Nach dem Neuladen ist alles noch da
  await page.keyboard.press('Escape');
  await neuLaden(page); await page.waitForSelector('.hub');
  ok(await page.evaluate(() => S.ich.outfit.gesicht === 'nerdbrille' && S.schrank.includes('nerdbrille')), 'Schrank und Outfit überstehen das Neuladen');

  // 6. Ein Kapitel abschließen: Die Mütze kommt mit Jubel und wird gleich angezogen, weil der Kopf frei ist
  await page.evaluate(id => { S.done[id] = Date.now(); addXp(30); }, ids.p1[ids.p1.length - 1]);
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => S.schrank.includes('muetze') && S.ich.outfit.kopf === 'muetze'), 'Phase geschafft: Mütze gewonnen und auf den freien Platz gesetzt');
  ok(((await page.textContent('#jubelKarte')) || '').includes('Neu für deinen Avatar: Pixelwerk-Mütze'), 'Die Jubel-Karte zeigt die neue Sache');

  // 7. Manipuliertes Outfit: Eine nicht gewonnene Sache wird nicht gezeichnet
  ok(await page.evaluate(() => { S.ich.outfit.kopf = 'krone'; return !outfit().kopf; }), 'Eine nicht gewonnene Sache im Outfit wird ignoriert');
  // 8. Ganz von vorn anfangen: erst eine Rückfrage, dann ist alles weg und der Einstieg startet
  await page.evaluate(() => { const k = document.getElementById('jubelKarte'); if (k) k.remove(); });
  await page.evaluate(() => ichOeffnen('spielstand'));
  await page.click('#neuBtn');
  ok(await page.isVisible('#neuJa') && await page.evaluate(() => S.xp > 0), 'Neustart fragt erst nach und löscht noch nichts');
  await page.click('#neuNein');
  ok(await page.isVisible('#neuBtn') && await page.evaluate(() => S.xp > 0), 'Abbrechen lässt alles, wie es ist');
  await page.click('#neuBtn'); await page.click('#neuJa');
  await page.waitForSelector('.es-bild');
  ok(await page.evaluate(() => S.xp === 0 && !Object.keys(S.done).length && !S.schrank.length && !S.ich.avatar && !S.ich.outfit), 'Ja: Fortschritt, Avatar und Garderobe sind weg');
  ok(await page.evaluate(() => document.body.classList.contains('es-an') && !document.getElementById('ichDlg').open), 'Danach startet der Einstieg wie beim ersten Mal');
  await neuLaden(page); await page.waitForSelector('.es-bild');
  ok(await page.evaluate(() => S.xp === 0), 'Der leere Stand übersteht das Neuladen');
  await ende(browser, fehler);
})();
