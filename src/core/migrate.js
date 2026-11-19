/* ===== Migration: gespeicherte Daten mit deutschen Feldnamen (vor der Umbenennung auf Englisch) ===== */
/* Spielstände in localStorage, fortschritt.json, exportierte Dateien und die KI-Einstellungen im Browser hatten deutsche
   Feldnamen (z. B. ich, schrank, offen). migrateState benennt sie beim Laden um, rekursiv in allen Objekten und Listen.
   Werte (Kapitel-IDs, Texte, Code) bleiben unverändert. Schon migrierte Daten laufen unverändert durch: kein neuer Name
   ist zugleich ein alter. Felder, deren Namen aus gespeicherten Werten stammen (etwa die Plätze im Outfit), heißen weiter so. */
const LEGACY_KEYS = {
  AKTE: 'ACTS', ANBIETER: 'PROVIDERS', FORTSCHRITT: 'PROGRESS', NUR: 'ONLY', __speicherBeimStart: '__saveOnStart', __vor: '__before', ablenkung: 'distraction',
  akt: 'act', alle: 'everyone', altFaellig: 'oldDue', amMorgen: 'inMorning', anb: 'prov', anbieter: 'provider', antworten: 'answers', anzahl: 'amount',
  arenaGut: 'arenaGood', art: 'kind', auffrischung: 'refresher', aus: 'off', autor: 'author', balkenOben: 'barTop', basis: 'base', bau: 'construction',
  begriffe: 'terms', belohnen: 'reward', bild: 'image', bildAt: 'imageAt', bildN: 'imageN', bis: 'until', danach: 'afterwards', dann: 'thenStep',
  datei: 'file', deckel: 'lid', deckelRunde: 'lidRound', dick: 'thick', doku: 'docs', eigen: 'custom', eigene: 'customChapters', einstieg: 'intro',
  einstiegStarten: 'introStart', ende: 'ending', erkl: 'expl', erneut: 'repeated', erste: 'firstOne', erstellt: 'createdAt', esGerufen: 'introCalled',
  exportiert: 'exported', faellig: 'dueNow', fallen: 'drop', falsch: 'wrong', farbe: 'colour', fehler: 'problems', felder: 'fields', fertig: 'finished',
  flach: 'shallow', fokus: 'focusEl', frageOhneFragezeichen: 'questionWithoutMark', fragen: 'questions', frei: 'unlocked', fremd: 'foreign', frisur: 'hairdo',
  gefragt: 'asked', geister: 'ghosts', gemischt: 'mixed', geraten: 'guessed', gesamt: 'overall', gruende: 'reasons', grundlagen: 'basics', gut: 'fine',
  haar: 'hair', halb: 'half', haut: 'skin', hinweise: 'notices', ich: 'player', jung: 'young', jungDanach: 'youngAfter', jungFehler: 'youngError', kap: 'chap',
  karg: 'sparse', karten: 'cards', keineDoppelten: 'noDuplicates', ki: 'ai', kiServer: 'aiServer', klammern: 'brackets', klein: 'small', knoepfe: 'buttons',
  kommentare: 'comments', komponente: 'component', kontext: 'context', konzepte: 'concepts', korrekt: 'isCorrect', kurz: 'short', lage: 'situation',
  lang: 'long', letzter: 'lastOne', letztes: 'lastItem', links: 'linkList', loesung: 'solution', lokal: 'local', luecken: 'gaps', malen: 'paint',
  markieren: 'mark', markierenAus: 'markOff', merk: 'memo', merke: 'takeaway', mobil: 'mobile', modell: 'modelName', modelle: 'models', muetze: 'cap',
  muster: 'pattern', nach: 'after', nachts: 'atNight', naechste: 'upcoming', naechstes: 'nextItem', neu: 'fresh', neuLaden: 'reloadIt',
  nichtSofort: 'notInstant', nieSofort: 'neverInstant', oeffnen: 'openPage', offen: 'pending', ohne: 'without', ohneCode: 'withoutCode',
  ohneLabel: 'withoutLabel', paare: 'pairs', pinsel: 'brush', platz: 'slot', profil: 'profile', pruefer: 'checker', punkte: 'points', quelle: 'origin',
  quer: 'across', quizSofort: 'quizInstant', reif: 'ripe', richtig: 'right', rueck: 'back', runde: 'turn', runden: 'rounds', rvErgebnis: 'rvResult',
  saat: 'seed', schlecht: 'poor', schluessel: 'hasKey', schnipsel: 'snippet', schrank: 'wardrobe', schrankNeu: 'wardrobeNew', schwach: 'weakOnes',
  scrollt: 'scrolls', sicher: 'sure', sieht: 'sees', sitzt: 'solid', sofort: 'instant', sommerzeit: 'summerTime', spaet: 'late', speichern: 'store',
  spiegel: 'mirror', springe: 'jump', sprungZu: 'jumpTo', stand: 'standing', stufe: 'stage', stunden: 'hours', tage: 'dayCount', tastatur: 'keyboardKeys',
  taste: 'keyName', tasten: 'keyNames', testen: 'runTest', thema: 'topic', tipp: 'tip', tippFalsch: 'tipWrong', tippKaputt: 'tipBroken',
  tippRichtig: 'tipRight', tippVorbei: 'tipOver', tipps: 'tips', titel: 'heading', ton: 'sound', typ: 'category', ueberlappt: 'overlaps', unsicher: 'unsure',
  unsicherKI: 'unsureAi', ursache: 'cause', urteil: 'verdict', verteilt: 'spread', von: 'startIdx', vorher: 'previous', vorschlag: 'suggestion',
  wackelt: 'wobbles', wahl: 'choice', wann: 'when', warum: 'reasonWhy', was: 'what', wdh: 'repeat', weg: 'journey', weiter: 'proceed', wie: 'how',
  winterzeit: 'winterTime', wo: 'where', woerter: 'words', woher: 'whence', wort: 'word', xAmEnde: 'xAtEnd', zahl: 'number', zeige: 'display',
  zeile: 'codeLine', zeileOk: 'lineOk', zu: 'matching', zuHart: 'tooHard', zuV: 'matchV', zuWeich: 'tooSoft', zufallFest: 'randomFixed',
  zusammenfassung: 'summary', zweite: 'secondOne'
};
function migrateState(v) {
  if (Array.isArray(v)) return v.map(migrateState);
  if (!v || typeof v !== 'object') return v;
  const out = {};
  Object.keys(v).forEach(k => { const n = Object.prototype.hasOwnProperty.call(LEGACY_KEYS, k) && !(LEGACY_KEYS[k] in v) ? LEGACY_KEYS[k] : k; out[n] = migrateState(v[k]); });
  return out;
}
if (typeof module === 'object' && module.exports) module.exports = { migrateState, LEGACY_KEYS };
