// Prüft die Migration alter Spielstände (deutsche Feldnamen) ohne Browser: src/core/migrate.js
const { migrateState, LEGACY_KEYS } = require('../src/core/migrate.js');
let problems = 0; const ok = (b, m) => { console.log((b ? '✓ ' : '✗ ') + m); if (!b) problems++; };

const old = {
  ich: { name: 'Kerim', start: 1, weg: 'grundlagen', level: 1, outfit: { kopf: 'cap', grund: 'himmel' } },
  xp: 640, done: { k01: 1 }, schrank: ['cap'], schrankNeu: [], offen: { k02: 5 }, zeile: { k03: ['a'] },
  profil: { fragen: [{ q: 'Warum?', typ: ['warum'], wo: 'uebung' }], sig: { nochmal: 2, hilfe: 1, erklOk: 1 } },
  eigene: { e1: { id: 'e1', akt: 'E', title: 'Eigenes', merke: ['M'], ticket: { typ: 'Feature', titel: 'T' }, story: [['erz', 'Text']] } },
  arena: { rs: { werkstatt: 3 } }, exportiert: '2026-11-18'
};
const neu = migrateState(old);
ok(neu.player && neu.player.name === 'Kerim' && neu.player.journey === 'grundlagen' && !('ich' in neu), 'ich -> player, weg -> journey, Werte bleiben');
ok(neu.player.outfit.kopf === 'cap' && neu.player.outfit.grund === 'himmel', 'Outfit-Plätze behalten ihre Namen (sie kommen aus gespeicherten Werten)');
ok(Array.isArray(neu.wardrobe) && neu.wardrobe[0] === 'cap' && Array.isArray(neu.wardrobeNew), 'schrank -> wardrobe, schrankNeu -> wardrobeNew');
ok(neu.pending.k02 === 5 && neu.codeLine.k03[0] === 'a' && neu.done.k01 === 1, 'offen -> pending, zeile -> codeLine, Kapitel-IDs bleiben');
ok(neu.profile.questions[0].category[0] === 'warum' && neu.profile.questions[0].where === 'uebung', 'Lernprofil: Felder umbenannt, Werte bleiben');
ok(neu.profile.sig.nochmal === 2 && neu.profile.sig.hilfe === 1 && neu.profile.sig.erklOk === 1, 'Signale behalten ihre Namen (Schlüssel kommen aus Strings)');
const e = neu.customChapters.e1;
ok(e.act === 'E' && e.takeaway[0] === 'M' && e.ticket.category === 'Feature' && e.ticket.heading === 'T' && e.story[0][0] === 'erz', 'Eigene Kapitel: Schema umbenannt, Sprecher-IDs bleiben');
ok(neu.arena.rs.werkstatt === 3 && neu.exported === '2026-11-18', 'Review-Schule-Station bleibt, exportiert -> exported');
ok(JSON.stringify(migrateState(neu)) === JSON.stringify(neu), 'Zweimal migrieren ändert nichts');
ok(Object.values(LEGACY_KEYS).every(v => !Object.prototype.hasOwnProperty.call(LEGACY_KEYS, v)), 'Kein neuer Name ist zugleich ein alter');
const both = migrateState({ ich: { name: 'alt' }, player: { name: 'neu' } });
ok(both.player.name === 'neu' && both.ich.name === 'alt', 'Gibt es den neuen Namen schon, wird nichts überschrieben');
ok(migrateState(null) === null && migrateState(5) === 5 && migrateState('x') === 'x', 'Kein Objekt: unverändert');

if (problems) { console.log(problems + ' Fehler in der Migration'); process.exit(1); }
