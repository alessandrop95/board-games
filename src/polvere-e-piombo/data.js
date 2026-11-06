/* ===== Dati: carte, personaggi, ruoli (tutti originali di "Polvere & Piombo") ===== */
var PPData = (function () {
  // kind: 'b' = carta immediata (bordo cuoio), 'e' = equipaggiamento (resta in gioco, bordo ferro)
  var TYPES = {
    sparo:       { n: 'Bang!',        kind: 'b', count: 25, s: 'Spara a chi è a portata', txt: 'Spara a un giocatore a portata d’arma. Deve schivare o perde 1 punto vita. Massimo uno per turno.' },
    schivata:    { n: 'Schivata!',     kind: 'b', count: 12, s: 'Annulla un Bang! diretto a te', txt: 'Annulla un Bang! o un colpo di Catling diretto a te. Si gioca fuori turno.' },
    whisky:      { n: 'Birra',        kind: 'b', count: 6,  s: 'Recuperi 1 punto vita', txt: 'Recuperi 1 punto vita. Puoi berlo anche per salvarti quando scendi a zero. Inutile se restate in due.' },
    giro:        { n: 'Saloon',  kind: 'b', count: 1,  s: 'Tutti recuperano 1 punto vita', txt: 'Tutti i giocatori in vita recuperano 1 punto vita.' },
    posta:       { n: 'Diligenza',         kind: 'b', count: 2,  s: 'Peschi 2 carte', txt: 'Arriva la diligenza della posta: peschi 2 carte.' },
    cassaforte:  { n: 'Wells Fargo',    kind: 'b', count: 1,  s: 'Peschi 3 carte', txt: 'Scassini la cassaforte della banca: peschi 3 carte.' },
    bottega:     { n: 'Emporio',       kind: 'b', count: 2,  s: 'Una carta a testa dal banco', txt: 'Scopri una carta per ogni giocatore in vita. A turno, partendo da te, ognuno ne sceglie una.' },
    borseggio:   { n: 'Panico!',     kind: 'b', count: 4,  s: 'Rubi una carta a distanza 1', txt: 'Rubi una carta (dalla mano o in gioco) a un giocatore a distanza 1.' },
    sabotaggio:  { n: 'Cat balou ALL!',    kind: 'b', count: 4,  s: 'Fai scartare una carta a chiunque', txt: 'Fai scartare una carta (dalla mano o in gioco) a un giocatore qualsiasi.' },
    sfida:       { n: 'Duello',         kind: 'b', count: 3,  s: 'Duello a colpi di Bang!', txt: 'Sfidi chiunque: a turno, partendo dallo sfidato, scartate un Bang!. Il primo che non lo fa perde 1 punto vita.' },
    stampede:    { n: 'Indiani',      kind: 'b', count: 2,  s: 'Gli altri scartano un Bang! o −1', txt: 'Una mandria impazzita travolge il paese: tutti gli altri scartano un Bang! o perdono 1 punto vita.' },
    mitraglia:   { n: 'Catling',     kind: 'b', count: 1,  s: 'Spari a tutti gli altri', txt: 'Spari a tutti gli altri giocatori. Ognuno deve schivare. Non conta come Bang! del turno.' },
    riparo:      { n: 'Barile',        kind: 'e', count: 2,  s: 'Se ti sparano estrai: ♥ = schivato', txt: 'Quando ti sparano, estrai: se esce Cuori il colpo è schivato.' },
    cavallo:     { n: 'Mustang',       kind: 'e', count: 2,  s: 'Gli altri lo vedono a distanza +1', txt: 'Gli altri ti vedono a distanza +1.' },
    cannocchiale:{ n: 'Mirino',  kind: 'e', count: 1,  s: 'Vede gli altri a distanza −1', txt: 'Vedi tutti gli altri giocatori a distanza −1.' },
    gattabuia:   { n: 'Prigione',     kind: 'e', count: 3,  s: 'Estrae a inizio turno: senza ♥ salta il turno', txt: 'Metti in cella un altro giocatore (non lo Sceriffo). A inizio turno estrae: con Cuori esce, altrimenti salta il turno.' },
    candelotto:  { n: 'Dinamite',    kind: 'e', count: 1,  s: 'Estrae: 2–9 di ♠ esplode (−3), sennò passa', txt: 'A inizio turno estrai: con un 2-9 di Picche esplode (−3 punti vita), altrimenti passa al giocatore successivo.' },
    ripetitore:  { n: 'Volcanic',    kind: 'e', count: 2,  w: 1, s: 'Portata 1 · Bang! senza limite', txt: 'Arma, portata 1. Puoi giocare quanti Bang! vuoi nel turno.' },
    revolver:    { n: 'Shoffield',      kind: 'e', count: 3,  w: 2, s: 'Arma · portata 2', txt: 'Arma, portata 2.' },
    schioppo:    { n: 'Remington',      kind: 'e', count: 1,  w: 3, s: 'Arma · portata 3', txt: 'Arma, portata 3.' },
    carabina:    { n: 'Rev. Carabine',      kind: 'e', count: 1,  w: 4, s: 'Arma · portata 4', txt: 'Arma, portata 4.' },
    bisonte:     { n: 'Winchester', kind: 'e', count: 1, w: 5, s: 'Arma · portata 5', txt: 'Arma, portata 5.' }
  };
  // ---- Dodge City: carte marroni, blu e verdi (kind 'g': si mettono in gioco e si usano dal turno successivo) ----
  // extra: 1 = per giocarla scarti anche un'altra carta dalla mano; miss: vale come Schivata!; fx: effetto quando la si usa
  var DC_TYPES = {
    pugno:       { n: 'Pugno!',       kind: 'b', x: 'dc', s: 'Un colpo a distanza 1', txt: 'Colpisci un giocatore a distanza 1: deve schivare o perde 1 punto vita. Non conta nel limite di un Bang! per turno.' },
    tuffo:       { n: 'Tuffo!',       kind: 'b', x: 'dc', miss: 1, s: 'Schivi un colpo e peschi 1 carta', txt: 'Annulla un Bang! (o un altro colpo) diretto a te, poi peschi una carta. Si gioca fuori turno.' },
    ragtime:     { n: 'Rag Time',     kind: 'b', x: 'dc', extra: 1, s: '+1 carta scartata: rubi a chiunque', txt: 'Scarta anche un’altra carta dalla mano: rubi una carta (dalla mano o in gioco) a un giocatore qualsiasi, a qualunque distanza.' },
    rissa:       { n: 'Rissa',        kind: 'b', x: 'dc', extra: 1, s: '+1 carta scartata: tutti perdono una carta', txt: 'Scarta anche un’altra carta: ogni altro giocatore scarta una carta che scegli tu, dalla mano (a caso) o tra quelle in gioco.' },
    springfield: { n: 'Springfield',  kind: 'b', x: 'dc', extra: 1, s: '+1 carta scartata: colpo a qualunque distanza', txt: 'Scarta anche un’altra carta: spari a un giocatore a qualunque distanza. Non conta nel limite di un Bang! per turno.' },
    tequila:     { n: 'Tequila',      kind: 'b', x: 'dc', extra: 1, s: '+1 carta scartata: +1 vita a chi vuoi', txt: 'Scarta anche un’altra carta: un giocatore a tua scelta (anche tu) recupera 1 punto vita.' },
    liquore:     { n: 'Whisky',       kind: 'b', x: 'dc', extra: 1, s: '+1 carta scartata: recuperi 2 punti vita', txt: 'Scarta anche un’altra carta: recuperi 2 punti vita.' },
    binocolo:    { n: 'Binocolo',     kind: 'e', x: 'dc', s: 'Vede gli altri a distanza −1', txt: 'Vedi tutti gli altri giocatori a distanza −1. Si somma al Mirino.' },
    rifugio:     { n: 'Riparo',       kind: 'e', x: 'dc', s: 'Gli altri lo vedono a distanza +1', txt: 'Gli altri ti vedono a distanza +1. Si somma al Mustang.' },
    bibbia:      { n: 'Bibbia',       kind: 'g', x: 'dc', miss: 1, s: 'Schivi un colpo e peschi 1 carta', txt: 'Mettila in gioco. Dal turno dopo puoi scartarla per annullare un colpo diretto a te e pescare una carta.' },
    cappello:    { n: 'Cappello',     kind: 'g', x: 'dc', miss: 1, s: 'Schivi un colpo', txt: 'Mettilo in gioco. Dal turno dopo puoi scartarlo per annullare un colpo diretto a te.' },
    placca:      { n: 'Placca di ferro', kind: 'g', x: 'dc', miss: 1, s: 'Schivi un colpo', txt: 'Mettila in gioco. Dal turno dopo puoi scartarla per annullare un colpo diretto a te.' },
    sombrero:    { n: 'Sombrero',     kind: 'g', x: 'dc', miss: 1, s: 'Schivi un colpo', txt: 'Mettilo in gioco. Dal turno dopo puoi scartarlo per annullare un colpo diretto a te.' },
    pugnale:     { n: 'Pugnale',      kind: 'g', x: 'dc', s: 'Colpo a distanza 1', txt: 'Mettilo in gioco. In un tuo turno successivo scartalo per colpire un giocatore a distanza 1 (non conta come Bang!).' },
    derringer:   { n: 'Derringer',    kind: 'g', x: 'dc', s: 'Colpo a distanza 1 e peschi 1', txt: 'Mettilo in gioco. In un tuo turno successivo scartalo: colpisci un giocatore a distanza 1 e peschi una carta.' },
    borraccia:   { n: 'Borraccia',    kind: 'g', x: 'dc', s: 'Recuperi 1 punto vita', txt: 'Mettila in gioco. In un tuo turno successivo scartala per recuperare 1 punto vita.' },
    cancan:      { n: 'Can Can',      kind: 'g', x: 'dc', s: 'Fai scartare una carta a chiunque', txt: 'Mettila in gioco. In un tuo turno successivo scartala: un giocatore qualsiasi scarta una carta (dalla mano a caso o in gioco).' },
    conestoga:   { n: 'Conestoga',    kind: 'g', x: 'dc', s: 'Rubi una carta a chiunque', txt: 'Mettila in gioco. In un tuo turno successivo scartala: rubi una carta a un giocatore qualsiasi, a qualunque distanza.' },
    fucile:      { n: 'Fucile da caccia', kind: 'g', x: 'dc', s: 'Colpo a qualunque distanza', txt: 'Mettilo in gioco. In un tuo turno successivo scartalo per colpire un giocatore a qualunque distanza.' },
    ponyexpress: { n: 'Pony Express', kind: 'g', x: 'dc', s: 'Peschi 3 carte', txt: 'Mettilo in gioco. In un tuo turno successivo scartalo per pescare 3 carte.' },
    pepperbox:   { n: 'Pepperbox',    kind: 'g', x: 'dc', s: 'Colpo a portata d’arma', txt: 'Mettila in gioco. In un tuo turno successivo scartala per colpire un giocatore a portata della tua arma (non conta come Bang!).' },
    howitzer:    { n: 'Obice',        kind: 'g', x: 'dc', s: 'Spari a tutti gli altri', txt: 'Mettilo in gioco. In un tuo turno successivo scartalo: spari a tutti gli altri giocatori, come una Catling.' }
  };
  Object.keys(DC_TYPES).forEach(function (k) { TYPES[k] = DC_TYPES[k]; });
  var ORDER = ['sparo','schivata','whisky','giro','posta','cassaforte','bottega','borseggio','sabotaggio','sfida','stampede','mitraglia',
               'riparo','cavallo','cannocchiale','gattabuia','candelotto','ripetitore','revolver','schioppo','carabina','bisonte'];
  var ORDER_DC = ['pugno','tuffo','ragtime','rissa','springfield','tequila','liquore','binocolo','rifugio',
                  'bibbia','cappello','placca','sombrero','pugnale','derringer','borraccia','cancan','conestoga','fucile','ponyexpress','pepperbox','howitzer'];

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
    // le 40 carte di Dodge City, con i loro semi e valori
    ('riparo C A|binocolo D 10|candelotto C 10|cavallo H 5|schioppo D 6|carabina S 5|rifugio D K|sparo S 8|sparo C 5|sparo C 6|sparo C K|whisky H 6|whisky S 6|' +
     'sabotaggio C 8|bottega S A|stampede D 5|schivata D 8|borseggio H J|pugno S 10|ragtime H 9|rissa S J|tuffo D 7|tuffo H K|springfield S K|tequila C 9|liquore H Q|' +
     'bibbia H 10|cappello D J|placca D A|placca S Q|sombrero C 7|pugnale H 8|derringer S 7|borraccia H 7|cancan C J|conestoga D 9|fucile C Q|ponyexpress D Q|pepperbox H A|howitzer S 9')
      .split('|').forEach(function (x) { var a = x.split(' '); list.push({ id: list.length, t: a[0], s: a[1], r: a[2], x: 'dc' }); });
    return list;
  })();
  Object.keys(DC_TYPES).forEach(function (k) { DC_TYPES[k].count = CARDS.filter(function (c) { return c.t === k; }).length; });

  // 16 personaggi originali. "ab" = chiave dell'abilità usata dal motore.
  var CHARS = [
    { id: 'thorne',   n: 'Bart Cassidy',       hp: 4, title: 'Il Mandriano',     s: 'Perde 1 punto vita → pesca 1 carta', txt: 'Ogni volta che perde un punto vita, pesca una carta.' },
    { id: 'faro',     n: 'Black Jack',         hp: 4, title: 'La Croupier',      s: 'Pescando, se la 2ª è ♥ o ♦ ne pesca un’altra', txt: 'Quando pesca, mostra la seconda carta: se è Cuori o Quadri ne pesca un’altra.' },
    { id: 'dolly',    n: 'Calamity Jamet',     hp: 4, title: 'La Mulattiera',    s: 'Usa i Bang! come Schivata! e viceversa', txt: 'Può usare i Bang! come Schivata! e le Schivata! come Bang!.' },
    { id: 'cascabel', n: 'El Gringo',      hp: 3, title: 'Il Serpente',      s: 'Colpito, pesca a caso dalla mano di chi l’ha colpito', txt: 'Per ogni punto vita che gli tolgono, pesca a caso una carta dalla mano di chi l’ha colpito.' },
    { id: 'nate',     n: 'Jesse Jones',       hp: 4, title: 'Il Lesto',         s: 'Può pescare la 1ª carta dalla mano di un altro', txt: 'Può pescare la prima carta dalla mano di un altro giocatore invece che dal mazzo.' },
    { id: 'padre',    n: 'Jourdannais',    hp: 4, title: 'Il Predicatore',   s: 'Ha sempre un Barile (con uno vero estrae 2 volte)', txt: 'Ha sempre un Barile in gioco. Con un Barile vero estrae due volte.' },
    { id: 'hattie',   n: 'Kit Carlson',    hp: 4, title: 'La Vedetta',       s: 'Pesca guardando 3 carte e ne tiene 2', txt: 'Quando pesca guarda le prime 3 carte, ne tiene 2 e rimette l’altra sul mazzo.' },
    { id: 'fortuna',  n: 'Lucky Duke',     hp: 4, title: 'Il Giocatore',     s: 'Quando estrae gira 2 carte e sceglie', txt: 'Quando deve estrarre, gira 2 carte e sceglie la migliore.' },
    { id: 'wren',     n: 'Paul Regret',      hp: 3, title: 'Il Fantasma',      s: 'Mustang sempre in gioco: lo vedono a +1', txt: 'Ha sempre un Mustang in gioco: gli altri lo vedono a distanza +1.' },
    { id: 'gazza',    n: 'Pedro Ramirez',          hp: 4, title: 'La Rigattiera',    s: 'Può pescare la 1ª carta dagli scarti', txt: 'Può pescare la prima carta dalla pila degli scarti invece che dal mazzo.' },
    { id: 'maggie',   n: 'Rose Doolan',  hp: 4, title: 'La Tiratrice',     s: 'Mirino sempre: vede gli altri a −1', txt: 'Ha sempre un Mirino: vede gli altri a distanza −1.' },
    { id: 'doc',      n: 'Sid Ketchum',     hp: 4, title: 'Il Cerusico',      s: 'Scarta 2 carte → +1 punto vita, quando vuole', txt: 'In qualsiasi momento può scartare 2 carte per recuperare 1 punto vita.' },
    { id: 'abner',    n: 'Slan the Killer',      hp: 4, title: 'Il Sicario',       s: 'Per schivare i suoi Bang! servono 2 Schivata!', txt: 'Per schivare i suoi Bang! servono due Schivata!.' },
    { id: 'clem',     n: 'Suzy Lafayette', hp: 4, title: 'La Ballerina',     s: 'Senza carte in mano ne pesca subito una', txt: 'Quando resta senza carte in mano, ne pesca subito una.' },
    { id: 'crowe',    n: 'Volture Sam',    hp: 4, title: 'Il Becchino',      s: 'Prende le carte di chi viene eliminato', txt: 'Quando un giocatore viene eliminato, prende tutte le sue carte.' },
    { id: 'lark',     n: 'Willy the Kid',        hp: 4, title: 'Il Fulmine',       s: 'Bang! senza limite nel suo turno', txt: 'Può giocare quanti Bang! vuole nel suo turno.' }
  ];
  // 15 personaggi di Dodge City
  var CHARS_DC = [
    { id: 'apache',  n: 'Apache Kid',    hp: 3, title: 'L’Intoccabile',     s: 'Le carte di ♦ degli altri non hanno effetto su di lui', txt: 'Le carte di Quadri giocate dagli altri giocatori non hanno effetto su di lui (tranne durante un Duello).' },
    { id: 'belle',   n: 'Belle Star',    hp: 4, title: 'La Regina',         s: 'Nel suo turno le carte in gioco degli altri non valgono', txt: 'Durante il suo turno, le carte in gioco davanti agli altri giocatori (blu e verdi) non hanno effetto.' },
    { id: 'bill',    n: 'Bill Noface',   hp: 4, title: 'Il Senza Volto',    s: 'Pesca 1 carta + 1 per ogni ferita', txt: 'All’inizio del turno pesca 1 carta, più 1 per ogni punto vita che ha perso.' },
    { id: 'chuck',   n: 'Chuck Wengam',  hp: 4, title: 'Il Disperato',      s: 'Perde 1 vita → pesca 2 carte', txt: 'Durante il suo turno può perdere 1 punto vita per pescare 2 carte, anche più volte, ma non l’ultimo punto vita.' },
    { id: 'docholy', n: 'Doc Holyday',   hp: 4, title: 'Il Dentista',       s: 'Scarta 2 carte → un Bang! extra', txt: 'Una volta per turno può scartare 2 carte qualsiasi per sparare un Bang! a un giocatore a portata. Non conta nel limite.' },
    { id: 'elena',   n: 'Elena Fuente',  hp: 3, title: 'La Gitana',         s: 'Qualsiasi carta vale come Schivata!', txt: 'Può usare qualsiasi carta della sua mano come Schivata!.' },
    { id: 'greg',    n: 'Greg Digger',   hp: 4, title: 'Lo Scavafosse',     s: 'Quando muore qualcuno, +2 punti vita', txt: 'Ogni volta che un altro personaggio viene eliminato, recupera 2 punti vita (fino al suo massimo).' },
    { id: 'herb',    n: 'Herb Hunter',   hp: 4, title: 'Il Cacciatore',     s: 'Quando muore qualcuno, pesca 2 carte', txt: 'Ogni volta che un altro personaggio viene eliminato, pesca 2 carte.' },
    { id: 'jose',    n: 'José Delgado',  hp: 4, title: 'Il Rigattiere',     s: 'Scarta una carta blu → pesca 2 (2 volte)', txt: 'Durante il suo turno può scartare una carta blu dalla mano per pescare 2 carte, fino a due volte per turno.' },
    { id: 'molly',   n: 'Molly Stark',   hp: 4, title: 'La Svelta',         s: 'Gioca una carta fuori turno → ne pesca una', txt: 'Ogni volta che gioca o scarta volontariamente una carta fuori dal suo turno (Schivata!, Birra, Bang! in un Duello…), pesca una carta.' },
    { id: 'pat',     n: 'Pat Brennan',   hp: 4, title: 'Il Ladro di Cavalli', s: 'Può pescare una carta in gioco invece di 2', txt: 'Invece di pescare 2 carte può prendere una carta in gioco (blu o verde) davanti a un giocatore qualsiasi.' },
    { id: 'pixie',   n: 'Pixie Pete',    hp: 3, title: 'Il Mazziere',       s: 'Pesca 3 carte invece di 2', txt: 'All’inizio del turno pesca 3 carte invece di 2.' },
    { id: 'sean',    n: 'Sean Mallory',  hp: 3, title: 'Il Collezionista',  s: 'Può tenere fino a 10 carte', txt: 'A fine turno può tenere in mano fino a 10 carte, qualunque siano i suoi punti vita.' },
    { id: 'tequilajoe', n: 'Tequila Joe', hp: 4, title: 'L’Assetato',       s: 'La Birra gli ridà 2 punti vita', txt: 'Ogni Birra che beve gli fa recuperare 2 punti vita invece di 1.' },
    { id: 'vera',    n: 'Vera Custer',   hp: 3, title: 'La Camaleonte',     s: 'Copia l’abilità di un altro giocatore', txt: 'All’inizio del turno, prima di pescare, sceglie un altro personaggio in gioco e ne ha l’abilità fino al suo turno successivo.' }
  ];
  CHARS_DC.forEach(function (c) { c.x = 'dc'; });
  CHARS = CHARS.concat(CHARS_DC);
  var CHAR = {}; CHARS.forEach(function (c) { CHAR[c.id] = c; });

  // ---- Eventi: Mezzogiorno di Fuoco (hn) e Per un Pugno di Carte (fc). final = l'ultima carta, resta fino alla fine ----
  var EVENTS = {
    benedizione:  { set: 'hn', n: 'Benedizione', s: 'Tutte le carte sono di Cuori ♥', txt: 'Finché resta scoperta, ogni carta estratta o giocata conta come Cuori.' },
    maledizione:  { set: 'hn', n: 'Maledizione', s: 'Tutte le carte sono di Picche ♠', txt: 'Finché resta scoperta, ogni carta estratta o giocata conta come Picche.' },
    sbornia:      { set: 'hn', n: 'Sbornia', s: 'I personaggi perdono le abilità', txt: 'Nessun personaggio può usare la sua abilità speciale.' },
    sete:         { set: 'hn', n: 'Sete', s: 'Si pesca 1 carta in meno', txt: 'All’inizio del turno ognuno pesca una carta in meno.' },
    treno:        { set: 'hn', n: 'Il Treno', s: 'Si pesca 1 carta in più', txt: 'All’inizio del turno ognuno pesca una carta in più.' },
    reverendo:    { set: 'hn', n: 'Il Reverendo', s: 'Niente Birra', txt: 'Non si possono giocare carte Birra, nemmeno per salvarsi.' },
    dottore:      { set: 'hn', n: 'Il Dottore', s: 'Chi ha meno vita recupera 1', txt: 'Appena esce, il giocatore (o i giocatori) con meno punti vita ne recupera 1.' },
    fantasma:     { set: 'hn', n: 'Città Fantasma', s: 'I morti tornano per un turno', txt: 'I giocatori eliminati tornano per il loro turno come fantasmi: pescano 3 carte, non possono morire e a fine turno tornano nella tomba.' },
    sermone:      { set: 'hn', n: 'Sermone', s: 'Niente Bang! nel proprio turno', txt: 'Nel proprio turno nessuno può giocare carte Bang!.' },
    sparatoria:   { set: 'hn', n: 'Sparatoria', s: 'Due Bang! per turno', txt: 'Ognuno può giocare fino a due Bang! nel suo turno.' },
    corsaoro:     { set: 'hn', n: 'Corsa all’Oro', s: 'Si gioca in senso antiorario', txt: 'Per un giro i turni passano in senso antiorario. Le carte (come la Dinamite) continuano a funzionare come sempre.' },
    dalton:       { set: 'hn', n: 'I Dalton', s: 'Chi ha carte blu ne scarta una', txt: 'Appena esce, ogni giocatore con carte blu in gioco ne scarta una a sua scelta.' },
    mezzogiorno:  { set: 'hn', final: 1, n: 'Mezzogiorno di Fuoco', s: 'Ognuno perde 1 vita a inizio turno', txt: 'Resta fino alla fine: all’inizio del suo turno ogni giocatore perde 1 punto vita.' },
    agguato:      { set: 'fc', n: 'Agguato', s: 'Tutti sono a distanza 1', txt: 'La distanza di base tra due giocatori qualsiasi è 1 (Mustang, Mirino e simili valgono ancora).' },
    cecchino:     { set: 'fc', n: 'Cecchino', s: '2 Bang! insieme: servono 2 Schivata!', txt: 'Nel tuo turno puoi giocare due Bang! insieme contro un giocatore a portata: conta come il Bang! del turno e servono due Schivata! per evitarlo.' },
    deadman:      { set: 'fc', n: 'Dead Man', s: 'Il primo eliminato torna in gioco', txt: 'Al suo turno, il primo giocatore eliminato torna in gioco con 2 punti vita e 2 carte.' },
    fratelli:     { set: 'fc', n: 'Fratelli di Sangue', s: 'Puoi cedere 1 vita a un altro', txt: 'All’inizio del turno puoi perdere 1 punto vita (non l’ultimo) per darlo a un altro giocatore.' },
    giudice:      { set: 'fc', n: 'Il Giudice', s: 'Niente carte in gioco', txt: 'Non si possono mettere carte in gioco, né davanti a sé né davanti agli altri.' },
    lazo:         { set: 'fc', n: 'Lazo', s: 'Le carte in gioco non valgono', txt: 'Le carte in gioco davanti ai giocatori (blu e verdi, anche Prigione e Dinamite) non hanno effetto.' },
    leggewest:    { set: 'fc', n: 'Legge del West', s: 'La 2ª carta pescata va giocata', txt: 'Ognuno mostra la seconda carta che pesca e, se può, deve giocarla in quel turno.' },
    liquoreforte: { set: 'fc', n: 'Liquore Forte', s: 'Rinunci a pescare: +1 vita', txt: 'All’inizio del turno puoi rinunciare a pescare per recuperare 1 punto vita.' },
    miniera:      { set: 'fc', n: 'Miniera Abbandonata', s: 'Si pesca dagli scarti', txt: 'Si pesca dalla pila degli scarti (se finisce, dal mazzo) e a fine turno si scarta coperto in cima al mazzo.' },
    peyote:       { set: 'fc', n: 'Peyote', s: 'Indovina il colore per pescare', txt: 'Invece di pescare, indovina se la prima carta del mazzo è rossa o nera: se indovini la tieni e riprovi, appena sbagli smetti.' },
    ranch:        { set: 'fc', n: 'Ranch', s: 'Puoi cambiare le carte in mano', txt: 'Dopo aver pescato puoi scartare quante carte vuoi dalla mano e pescarne altrettante, una volta.' },
    rimbalzo:     { set: 'fc', n: 'Rimbalzo', s: 'Spara alle carte in gioco', txt: 'Nel tuo turno puoi scartare Bang! contro carte in gioco davanti agli altri: se il proprietario non schiva, la carta viene scartata. Non contano nel limite.' },
    roulette:     { set: 'fc', n: 'Roulette Russa', s: 'Schivata! a giro: chi non ce l’ha −2', txt: 'Appena esce, a partire dallo Sceriffo ognuno scarta una Schivata!: il primo che non lo fa perde 2 punti vita.' },
    vendetta:     { set: 'fc', n: 'Vendetta', s: 'Fine turno: con ♥ rigiochi', txt: 'A fine turno ognuno estrae: con Cuori gioca subito un altro turno (una volta sola).' },
    pugnocarte:   { set: 'fc', final: 1, n: 'Per un Pugno di Carte', s: 'Tanti Bang! quante carte in mano', txt: 'Resta fino alla fine: all’inizio del turno ognuno subisce tanti Bang! quante carte ha in mano.' }
  };

  var ROLES = {
    sceriffo:  { n: 'Sceriffo',      goal: 'Elimina tutti i Fuorilegge e il Rinnegato. Il tuo ruolo è scoperto e hai 1 punto vita in più.' },
    vice:      { n: 'Vicesceriffo',  goal: 'Proteggi lo Sceriffo: vinci con lui, anche se muori.' },
    bandito:   { n: 'Fuorilegge',       goal: 'Elimina lo Sceriffo. Vinci con gli altri Fuorilegge, anche se muori.' },
    traditore: { n: 'Rinnegato',     goal: 'Resta l’ultimo in vita: elimina tutti gli altri e lo Sceriffo per ultimo.' }
  };
  var ROLESETS = {
    4: ['sceriffo','traditore','bandito','bandito'],
    5: ['sceriffo','traditore','bandito','bandito','vice'],
    6: ['sceriffo','traditore','bandito','bandito','bandito','vice'],
    7: ['sceriffo','traditore','bandito','bandito','bandito','vice','vice'],
    8: ['sceriffo','traditore','traditore','bandito','bandito','bandito','vice','vice']
  };
  var SUITNAME = { H: 'Cuori', D: 'Quadri', C: 'Fiori', S: 'Picche' };
  var SUITSYM = { H: '♥', D: '♦', C: '♣', S: '♠' };
  return { TYPES: TYPES, ORDER: ORDER, ORDER_DC: ORDER_DC, CARDS: CARDS, CHARS: CHARS, CHAR: CHAR, EVENTS: EVENTS, ROLES: ROLES, ROLESETS: ROLESETS, SUITNAME: SUITNAME, SUITSYM: SUITSYM, RANKS: RANKS };
})();
if (typeof module !== 'undefined') module.exports = PPData;
