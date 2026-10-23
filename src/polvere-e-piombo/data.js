/* ===== Dati: carte, personaggi, ruoli (tutti originali di "Polvere & Piombo") ===== */
var PPData = (function () {
  // kind: 'b' = carta immediata (bordo cuoio), 'e' = equipaggiamento (resta in gioco, bordo ferro)
  var TYPES = {
    sparo:       { n: 'Sparo!',        kind: 'b', count: 25, s: 'Spara a chi è a portata', txt: 'Spara a un giocatore a portata d’arma. Deve schivare o perde 1 punto vita. Massimo uno per turno.' },
    schivata:    { n: 'Schivata!',     kind: 'b', count: 12, s: 'Annulla uno Sparo! diretto a te', txt: 'Annulla uno Sparo! o un colpo di Mitraglia diretto a te. Si gioca fuori turno.' },
    whisky:      { n: 'Whisky',        kind: 'b', count: 6,  s: 'Recuperi 1 punto vita', txt: 'Recuperi 1 punto vita. Puoi berlo anche per salvarti quando scendi a zero. Inutile se restate in due.' },
    giro:        { n: 'Giro Offerto',  kind: 'b', count: 1,  s: 'Tutti recuperano 1 punto vita', txt: 'Tutti i giocatori in vita recuperano 1 punto vita.' },
    posta:       { n: 'Posta',         kind: 'b', count: 2,  s: 'Peschi 2 carte', txt: 'Arriva la diligenza della posta: peschi 2 carte.' },
    cassaforte:  { n: 'Cassaforte',    kind: 'b', count: 1,  s: 'Peschi 3 carte', txt: 'Scassini la cassaforte della banca: peschi 3 carte.' },
    bottega:     { n: 'Bottega',       kind: 'b', count: 2,  s: 'Una carta a testa dal banco', txt: 'Scopri una carta per ogni giocatore in vita. A turno, partendo da te, ognuno ne sceglie una.' },
    borseggio:   { n: 'Borseggio',     kind: 'b', count: 4,  s: 'Rubi una carta a distanza 1', txt: 'Rubi una carta (dalla mano o in gioco) a un giocatore a distanza 1.' },
    sabotaggio:  { n: 'Sabotaggio',    kind: 'b', count: 4,  s: 'Fai scartare una carta a chiunque', txt: 'Fai scartare una carta (dalla mano o in gioco) a un giocatore qualsiasi.' },
    sfida:       { n: 'Sfida',         kind: 'b', count: 3,  s: 'Duello a colpi di Sparo!', txt: 'Sfidi chiunque: a turno, partendo dallo sfidato, scartate uno Sparo!. Il primo che non lo fa perde 1 punto vita.' },
    stampede:    { n: 'Stampede',      kind: 'b', count: 2,  s: 'Gli altri scartano uno Sparo! o −1', txt: 'Una mandria impazzita travolge il paese: tutti gli altri scartano uno Sparo! o perdono 1 punto vita.' },
    mitraglia:   { n: 'Mitraglia',     kind: 'b', count: 1,  s: 'Spari a tutti gli altri', txt: 'Spari a tutti gli altri giocatori. Ognuno deve schivare. Non conta come Sparo! del turno.' },
    riparo:      { n: 'Riparo',        kind: 'e', count: 2,  s: 'Se ti sparano estrai: ♥ = schivato', txt: 'Quando ti sparano, estrai: se esce Cuori il colpo è schivato.' },
    cavallo:     { n: 'Cavallo',       kind: 'e', count: 2,  s: 'Gli altri lo vedono a distanza +1', txt: 'Gli altri ti vedono a distanza +1.' },
    cannocchiale:{ n: 'Cannocchiale',  kind: 'e', count: 1,  s: 'Vede gli altri a distanza −1', txt: 'Vedi tutti gli altri giocatori a distanza −1.' },
    gattabuia:   { n: 'Gattabuia',     kind: 'e', count: 3,  s: 'Estrae a inizio turno: senza ♥ salta il turno', txt: 'Metti in cella un altro giocatore (non lo Sceriffo). A inizio turno estrae: con Cuori esce, altrimenti salta il turno.' },
    candelotto:  { n: 'Candelotto',    kind: 'e', count: 1,  s: 'Estrae: 2–9 di ♠ esplode (−3), sennò passa', txt: 'A inizio turno estrai: con un 2-9 di Picche esplode (−3 punti vita), altrimenti passa al giocatore successivo.' },
    ripetitore:  { n: 'Ripetitore',    kind: 'e', count: 2,  w: 1, s: 'Portata 1 · Sparo! senza limite', txt: 'Arma, portata 1. Puoi giocare quanti Sparo! vuoi nel turno.' },
    revolver:    { n: 'Revolver',      kind: 'e', count: 3,  w: 2, s: 'Arma · portata 2', txt: 'Arma, portata 2.' },
    schioppo:    { n: 'Schioppo',      kind: 'e', count: 1,  w: 3, s: 'Arma · portata 3', txt: 'Arma, portata 3.' },
    carabina:    { n: 'Carabina',      kind: 'e', count: 1,  w: 4, s: 'Arma · portata 4', txt: 'Arma, portata 4.' },
    bisonte:     { n: 'Fucile da Bisonte', kind: 'e', count: 1, w: 5, s: 'Arma · portata 5', txt: 'Arma, portata 5.' }
  };
  var ORDER = ['sparo','schivata','whisky','giro','posta','cassaforte','bottega','borseggio','sabotaggio','sfida','stampede','mitraglia',
               'riparo','cavallo','cannocchiale','gattabuia','candelotto','ripetitore','revolver','schioppo','carabina','bisonte'];

  // Mazzo da 80 carte con seme e valore (assegnazione fissa ma mescolata con un seme numerico)
  var SUITS = ['H','D','C','S']; // Cuori, Quadri, Fiori, Picche
  var RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  function seeded(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  var CARDS = (function () {
    var pairs = [], i, j;
    for (j = 0; j < 2; j++) for (i = 0; i < 52; i++) pairs.push({ s: SUITS[Math.floor(i / 13)], r: RANKS[i % 13] });
    var rnd = seeded(1871);
    for (i = pairs.length - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); var t = pairs[i]; pairs[i] = pairs[j]; pairs[j] = t; }
    var list = [], k = 0;
    ORDER.forEach(function (ty) { for (var c = 0; c < TYPES[ty].count; c++) { list.push({ id: list.length, t: ty, s: pairs[k].s, r: pairs[k].r }); k++; } });
    return list;
  })();

  // 16 personaggi originali. "ab" = chiave dell'abilità usata dal motore.
  var CHARS = [
    { id: 'thorne',   n: 'Ezra Thorne',       hp: 4, title: 'Il Mandriano',     s: 'Perde 1 punto vita → pesca 1 carta', txt: 'Ogni volta che perde un punto vita, pesca una carta.' },
    { id: 'faro',     n: 'Lady Faro',         hp: 4, title: 'La Croupier',      s: 'Pescando, se la 2ª è ♥ o ♦ ne pesca un’altra', txt: 'Quando pesca, mostra la seconda carta: se è Cuori o Quadri ne pesca un’altra.' },
    { id: 'dolly',    n: 'Dolly Rawhide',     hp: 4, title: 'La Mulattiera',    s: 'Usa gli Sparo! come Schivata! e viceversa', txt: 'Può usare gli Sparo! come Schivata! e le Schivata! come Sparo!.' },
    { id: 'cascabel', n: 'Tío Cascabel',      hp: 3, title: 'Il Serpente',      s: 'Colpito, pesca a caso dalla mano di chi l’ha colpito', txt: 'Per ogni punto vita che gli tolgono, pesca a caso una carta dalla mano di chi l’ha colpito.' },
    { id: 'nate',     n: 'Nate Nimble',       hp: 4, title: 'Il Lesto',         s: 'Può pescare la 1ª carta dalla mano di un altro', txt: 'Può pescare la prima carta dalla mano di un altro giocatore invece che dal mazzo.' },
    { id: 'padre',    n: 'Padre Ignatius',    hp: 4, title: 'Il Predicatore',   s: 'Ha sempre un Riparo (con uno vero estrae 2 volte)', txt: 'Ha sempre un Riparo in gioco. Con un Riparo vero estrae due volte.' },
    { id: 'hattie',   n: 'Hattie Lookout',    hp: 4, title: 'La Vedetta',       s: 'Pesca guardando 3 carte e ne tiene 2', txt: 'Quando pesca guarda le prime 3 carte, ne tiene 2 e rimette l’altra sul mazzo.' },
    { id: 'fortuna',  n: 'Silas Fortuna',     hp: 4, title: 'Il Giocatore',     s: 'Quando estrae gira 2 carte e sceglie', txt: 'Quando deve estrarre, gira 2 carte e sceglie la migliore.' },
    { id: 'wren',     n: 'Wren Nowhere',      hp: 3, title: 'Il Fantasma',      s: 'Cavallo sempre in gioco: lo vedono a +1', txt: 'Ha sempre un Cavallo in gioco: gli altri lo vedono a distanza +1.' },
    { id: 'gazza',    n: 'La Gazza',          hp: 4, title: 'La Rigattiera',    s: 'Può pescare la 1ª carta dagli scarti', txt: 'Può pescare la prima carta dalla pila degli scarti invece che dal mazzo.' },
    { id: 'maggie',   n: 'Maggie Longsight',  hp: 4, title: 'La Tiratrice',     s: 'Cannocchiale sempre: vede gli altri a −1', txt: 'Ha sempre un Cannocchiale: vede gli altri a distanza −1.' },
    { id: 'doc',      n: 'Doc Amos Vane',     hp: 4, title: 'Il Cerusico',      s: 'Scarta 2 carte → +1 punto vita, quando vuole', txt: 'In qualsiasi momento può scartare 2 carte per recuperare 1 punto vita.' },
    { id: 'abner',    n: 'Abner Graves',      hp: 4, title: 'Il Sicario',       s: 'Per schivare i suoi Sparo! servono 2 Schivata!', txt: 'Per schivare i suoi Sparo! servono due Schivata!.' },
    { id: 'clem',     n: 'Clementine Pocket', hp: 4, title: 'La Ballerina',     s: 'Senza carte in mano ne pesca subito una', txt: 'Quando resta senza carte in mano, ne pesca subito una.' },
    { id: 'crowe',    n: 'Mortimer Crowe',    hp: 4, title: 'Il Becchino',      s: 'Prende le carte di chi viene eliminato', txt: 'Quando un giocatore viene eliminato, prende tutte le sue carte.' },
    { id: 'lark',     n: 'Eddie Lark',        hp: 4, title: 'Il Fulmine',       s: 'Sparo! senza limite nel suo turno', txt: 'Può giocare quanti Sparo! vuole nel suo turno.' }
  ];
  var CHAR = {}; CHARS.forEach(function (c) { CHAR[c.id] = c; });

  var ROLES = {
    sceriffo:  { n: 'Sceriffo',      goal: 'Elimina tutti i Banditi e il Traditore. Il tuo ruolo è scoperto e hai 1 punto vita in più.' },
    vice:      { n: 'Vicesceriffo',  goal: 'Proteggi lo Sceriffo: vinci con lui, anche se muori.' },
    bandito:   { n: 'Bandito',       goal: 'Elimina lo Sceriffo. Vinci con gli altri Banditi, anche se muori.' },
    traditore: { n: 'Traditore',     goal: 'Resta l’ultimo in vita: elimina tutti gli altri e lo Sceriffo per ultimo.' }
  };
  var ROLESETS = {
    4: ['sceriffo','traditore','bandito','bandito'],
    5: ['sceriffo','traditore','bandito','bandito','vice'],
    6: ['sceriffo','traditore','bandito','bandito','bandito','vice'],
    7: ['sceriffo','traditore','bandito','bandito','bandito','vice','vice']
  };
  var SUITNAME = { H: 'Cuori', D: 'Quadri', C: 'Fiori', S: 'Picche' };
  var SUITSYM = { H: '♥', D: '♦', C: '♣', S: '♠' };
  return { TYPES: TYPES, ORDER: ORDER, CARDS: CARDS, CHARS: CHARS, CHAR: CHAR, ROLES: ROLES, ROLESETS: ROLESETS, SUITNAME: SUITNAME, SUITSYM: SUITSYM, RANKS: RANKS };
})();
if (typeof module !== 'undefined') module.exports = PPData;
