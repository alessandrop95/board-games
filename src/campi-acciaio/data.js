/* ===== Campi d'Acciaio: dati del gioco =====
   Regole equivalenti a un noto gioco di strategia dieselpunk; nomi, testi, carte e grafica sono originali. */
var CAData = (function () {
  // Mappa: [colonna, riga, terreno, incontro, galleria, base, fiumi sui lati]
  // Terreni: F fattoria, W foresta, M montagna, T tundra, V villaggio, L lago, X Fabbrica, H base.
  // Lati: 0 alto-destra, 1 destra, 2 basso-destra, 3 basso-sinistra, 4 sinistra, 5 alto-sinistra. Le righe pari sono spostate di mezzo esagono a destra.
  var MAP = [[1,0,"H",0,0,"verde",[]],[4,0,"H",0,0,"brina",[]],[1,1,"M",0,0,"",[]],[2,1,"F",0,0,"",[]],[3,1,"V",1,0,"",[1,2]],[4,1,"W",0,0,"",[4,3]],[5,1,"T",0,0,"",[1,2]],[6,1,"V",0,0,"",[4]],[0,2,"L",0,0,"",[]],[1,2,"T",1,0,"",[3]],[2,2,"L",0,0,"",[]],[3,2,"T",0,1,"",[0,1,5]],[4,2,"M",1,0,"",[1,2,4]],[5,2,"F",0,0,"",[2,4,5]],[6,2,"F",1,0,"",[2,3]],[0,3,"H",0,0,"campi",[]],[1,3,"W",0,0,"",[0,1]],[2,3,"M",0,1,"",[3,4]],[3,3,"W",0,0,"",[]],[4,3,"L",0,0,"",[]],[5,3,"W",0,1,"",[1,2,5]],[6,3,"V",0,0,"",[0,4,5]],[7,3,"H",0,0,"ferro",[5]],[0,4,"F",0,0,"",[2,3]],[1,4,"V",1,0,"",[0,2,3]],[2,4,"L",0,0,"",[]],[3,4,"X",0,0,"",[]],[4,4,"M",0,0,"",[1]],[5,4,"T",1,0,"",[3,4,5]],[6,4,"M",0,0,"",[]],[0,5,"W",1,0,"",[0,2]],[1,5,"W",0,0,"",[0,2,3,5]],[2,5,"F",0,1,"",[3,5]],[3,5,"T",0,0,"",[]],[4,5,"L",0,0,"",[]],[5,5,"V",0,1,"",[0]],[6,5,"L",0,0,"",[]],[0,6,"M",0,0,"",[0,5]],[1,6,"V",1,0,"",[0,1,5]],[2,6,"V",1,0,"",[2,4]],[3,6,"T",0,1,"",[2,3]],[4,6,"W",0,0,"",[3]],[5,6,"M",1,0,"",[]],[6,6,"T",0,0,"",[]],[0,7,"H",0,0,"carbone",[]],[1,7,"T",0,0,"",[]],[2,7,"L",0,0,"",[]],[3,7,"F",0,0,"",[0,5]],[4,7,"M",1,0,"",[0,1,5]],[5,7,"V",0,0,"",[4]],[6,7,"F",0,0,"",[]],[7,7,"H",0,0,"viola",[]],[2,8,"H",0,0,"steppa",[]],[3,8,"V",0,0,"",[]]];

  var TERR = {
    F: { n: 'Fattoria', res: 'f', d: 'Produce cibo' },
    W: { n: 'Foresta', res: 'w', d: 'Produce legno' },
    M: { n: 'Montagna', res: 'm', d: 'Produce metallo' },
    T: { n: 'Tundra', res: 'o', d: 'Produce petrolio' },
    V: { n: 'Villaggio', res: 'wk', d: 'Produce nuovi lavoratori' },
    L: { n: 'Lago', res: null, d: 'Non produce. Ci entra solo chi ha l’abilità giusta' },
    X: { n: 'Fabbrica', res: null, d: 'Non produce. Vale 3 territori a fine partita' },
    H: { n: 'Base', res: null, d: 'Punto di partenza. Non è un territorio: non si entra' }
  };
  var RES = { f: { n: 'cibo', N: 'Cibo' }, m: { n: 'metallo', N: 'Metallo' }, w: { n: 'legno', N: 'Legno' }, o: { n: 'petrolio', N: 'Petrolio' } };
  var RES_ORDER = ['f', 'm', 'w', 'o'];

  // Fazioni, in ordine di turno (in senso orario intorno alla mappa)
  var FACTIONS = {
    brina: { n: 'Regno di Brina', short: 'Brina', col: '#3f7fbf', dark: '#24507e', light: '#8fbde8', trim: '#d9e6f2', base: '4,0', power: 4, cards: 1,
      hero: 'Eskil Varg', animal: 'l’alce Torvo', heroFull: 'Eskil Varg e l’alce Torvo',
      ab: { k: 'swim', n: 'Nuotatori', d: 'I tuoi lavoratori possono attraversare i fiumi (ma non entrano nei laghi).' },
      mechs: [
        { k: 'river', n: 'Guado', d: 'Personaggio e mech attraversano i fiumi per entrare in foreste e montagne.', terr: ['W', 'M'] },
        { k: 'sea', n: 'Navigatori', d: 'Personaggio e mech possono entrare nei laghi e uscirne.' },
        { k: 'art', n: 'Artiglieria', d: 'Prima di una battaglia paghi 1 potere: l’avversario ne perde 2.' },
        { k: 'speed', n: 'Velocità', d: 'Personaggio e mech si muovono di 2 territori invece di 1.' }] },
    ferro: { n: 'Unione di Ferro', short: 'Ferro', col: '#b5402f', dark: '#7a2419', light: '#d9654f', trim: '#e3b04b', base: '7,3', power: 3, cards: 2,
      hero: 'Vera Sokol', animal: 'la lince Iskra', heroFull: 'Vera Sokol e la lince Iskra',
      ab: { k: 'relentless', n: 'Instancabili', d: 'Puoi scegliere la stessa colonna della plancia due turni di fila.' },
      mechs: [
        { k: 'river', n: 'Guado', d: 'Personaggio e mech attraversano i fiumi per entrare in fattorie e villaggi.', terr: ['F', 'V'] },
        { k: 'rail', n: 'Ferrovia', d: 'I villaggi che controlli e la Fabbrica sono collegati: da uno all’altro in un solo passo.' },
        { k: 'militia', n: 'Milizia', d: 'In battaglia, se nel territorio c’è anche un tuo lavoratore, puoi giocare 1 carta combattimento in più.' },
        { k: 'speed', n: 'Velocità', d: 'Personaggio e mech si muovono di 2 territori invece di 1.' }] },
    steppa: { n: 'Orda della Steppa', short: 'Steppa', col: '#d9a530', dark: '#9a6f12', light: '#f2cf72', trim: '#7a3a1c', base: '2,8', power: 5, cards: 0,
      hero: 'Leyla Aydin', animal: 'il cavallo Ruzgar', heroFull: 'Leyla Aydin e il cavallo Ruzgar',
      ab: { k: 'coerce', n: 'Requisizione', d: 'Una volta per turno puoi spendere 1 carta combattimento al posto di 1 risorsa qualsiasi.' },
      mechs: [
        { k: 'river', n: 'Guado', d: 'Personaggio e mech attraversano i fiumi per entrare in fattorie e tundre.', terr: ['F', 'T'] },
        { k: 'caravan', n: 'Carovana', d: 'Personaggio e mech possono andare in un solo passo alla tua base o alla base di una fazione che non gioca.' },
        { k: 'scout', n: 'Esploratori', d: 'Prima di una battaglia rubi 1 carta combattimento a caso all’avversario.' },
        { k: 'speed', n: 'Velocità', d: 'Personaggio e mech si muovono di 2 territori invece di 1.' }] },
    carbone: { n: 'Impero di Carbone', short: 'Carbone', col: '#4a4a52', dark: '#26262c', light: '#8a8a96', trim: '#c8a24a', base: '0,7', power: 1, cards: 4,
      hero: 'Otto Kessel', animal: 'i mastini Fumo e Brace', heroFull: 'il barone Otto Kessel e i mastini Fumo e Brace',
      ab: { k: 'dominate', n: 'Dominio', d: 'Nessun limite alle stelle per battaglie vinte e obiettivi: puoi completare anche entrambi gli obiettivi.' },
      mechs: [
        { k: 'river', n: 'Guado', d: 'Personaggio e mech attraversano i fiumi per entrare in foreste e montagne.', terr: ['W', 'M'] },
        { k: 'under', n: 'Sottopassaggio', d: 'Le montagne che controlli e tutte le gallerie sono collegate tra loro.' },
        { k: 'sabot', n: 'Sabotaggio', d: 'In una battaglia su una galleria (o sulla tua miniera) l’avversario perde 2 potere prima di scegliere.' },
        { k: 'speed', n: 'Velocità', d: 'Personaggio e mech si muovono di 2 territori invece di 1.' }] },
    campi: { n: 'Repubblica dei Campi', short: 'Campi', col: '#e8e1cf', dark: '#a89f8a', light: '#fbf7ec', trim: '#4f6e8c', base: '0,3', power: 2, cards: 3,
      hero: 'Zofia Lis', animal: 'il bisonte Bory', heroFull: 'Zofia Lis e il bisonte Bory',
      ab: { k: 'meander', n: 'Diplomazia', d: 'Negli incontri scegli fino a 2 opzioni diverse, nell’ordine che vuoi.' },
      mechs: [
        { k: 'river', n: 'Guado', d: 'Personaggio e mech attraversano i fiumi per entrare in villaggi e montagne.', terr: ['V', 'M'] },
        { k: 'sub', n: 'Sommergibili', d: 'Personaggio e mech entrano nei laghi e passano da un lago a qualunque altro in un solo passo.' },
        { k: 'comrade', n: 'Cameratismo', d: 'Non perdi popolarità quando cacci lavoratori nemici in battaglia.' },
        { k: 'speed', n: 'Velocità', d: 'Personaggio e mech si muovono di 2 territori invece di 1.' }] }
  };
  var FAC_ORDER = ['brina', 'ferro', 'steppa', 'carbone', 'campi'];
  var INACTIVE_BASES = { verde: '1,0', viola: '7,7' };

  // Azioni in alto: chiavi e upgrade possibili (ogni upgrade copre 1 cubo verde)
  var TOP = {
    move: { n: 'Muovi', d: 'Muovi fino a 2 unità di 1 territorio, oppure prendi 1 moneta.', ups: ['mvU', 'mvC'] },
    bolster: { n: 'Rinforza', d: 'Paghi 1 moneta: +2 potere oppure 1 carta combattimento.', ups: ['bpP', 'bpC'] },
    trade: { n: 'Commercia', d: 'Paghi 1 moneta: 2 risorse a scelta oppure +1 popolarità.', ups: ['trP'] },
    produce: { n: 'Produci', d: 'Scegli fino a 2 territori con tuoi lavoratori: ognuno produce 1 risorsa del terreno.', ups: ['prH'] }
  };
  var UPS = {
    mvU: { top: 'move', n: '+1 unità mossa', s: '3 unità' }, mvC: { top: 'move', n: '+1 moneta', s: '2 monete' },
    bpP: { top: 'bolster', n: '+1 potere', s: '+3 potere' }, bpC: { top: 'bolster', n: '+1 carta', s: '2 carte' },
    trP: { top: 'trade', n: '+1 popolarità', s: '+2 popolarità' }, prH: { top: 'produce', n: '+1 territorio', s: '3 territori' }
  };
  var BOTTOM = [
    { k: 'upgrade', n: 'Aggiorna', res: 'o', d: 'Sposti un cubo: un’azione in alto migliora e un’azione in basso costa 1 risorsa in meno.' },
    { k: 'deploy', n: 'Schiera', res: 'm', d: 'Metti un mech dove hai un lavoratore e sblocchi la sua abilità.' },
    { k: 'build', n: 'Costruisci', res: 'w', d: 'Metti una struttura dove hai un lavoratore: potenzia l’azione in alto della sua colonna.' },
    { k: 'enlist', n: 'Arruola', res: 'f', d: 'Prendi un bonus immediato e attivi un bonus che ricevi quando tu o i tuoi vicini fate quell’azione.' }
  ];
  // Strutture: ognuna sta sopra un'azione in alto
  var STRUCTS = {
    mon: { n: 'Monumento', top: 'bolster', d: 'Ogni volta che fai Rinforza prendi anche +1 popolarità.' },
    mil: { n: 'Mulino', top: 'produce', d: 'Quando fai Produci, il territorio del mulino produce come se avesse 1 lavoratore in più (anche senza lavoratori).' },
    min: { n: 'Miniera', top: 'move', d: 'Il territorio della miniera diventa una galleria, ma solo per te.' },
    arm: { n: 'Armeria', top: 'trade', d: 'Ogni volta che fai Commercia prendi anche +1 potere.' }
  };
  var STRUCT_BY_TOP = { bolster: 'mon', produce: 'mil', move: 'min', trade: 'arm' };
  // Reclute: bonus immediati e bonus permanenti per colonna in basso
  var ONCE = { pw2: { n: '+2 potere' }, c2: { n: '+2 monete' }, pop2: { n: '+2 popolarità' }, cd2: { n: '+2 carte combattimento' } };
  var ONCE_ORDER = ['pw2', 'c2', 'pop2', 'cd2'];
  var ONGOING = [{ k: 'pw', n: '+1 potere' }, { k: 'c', n: '+1 moneta' }, { k: 'pop', n: '+1 popolarità' }, { k: 'cd', n: '+1 carta combattimento' }];

  // Plance giocatore: ordine delle azioni in alto, costi in basso (iniziale e minimo), monete per azione in basso
  var MATS = {
    1: { n: 'Industriale', pop: 2, coins: 4, top: ['bolster', 'produce', 'move', 'trade'], cost: [3, 3, 3, 4], min: [2, 1, 2, 2], gain: [3, 2, 1, 0] },
    2: { n: 'Ingegneristica', pop: 2, coins: 5, top: ['produce', 'trade', 'bolster', 'move'], cost: [3, 4, 3, 3], min: [2, 2, 1, 2], gain: [2, 0, 3, 1] },
    3: { n: 'Patriottica', pop: 2, coins: 6, top: ['move', 'bolster', 'trade', 'produce'], cost: [2, 4, 4, 3], min: [2, 1, 2, 2], gain: [1, 3, 0, 2] },
    4: { n: 'Meccanica', pop: 3, coins: 6, top: ['trade', 'bolster', 'move', 'produce'], cost: [3, 3, 3, 4], min: [2, 1, 2, 2], gain: [0, 2, 2, 2] },
    5: { n: 'Agricola', pop: 4, coins: 7, top: ['move', 'trade', 'produce', 'bolster'], cost: [2, 4, 4, 3], min: [2, 2, 2, 1], gain: [1, 0, 2, 3] }
  };
  var BANNED = [['ferro', 1], ['steppa', 3]];

  // Punteggio finale in base alla popolarità
  var TIERS = [{ upto: 6, star: 3, terr: 2, res: 1 }, { upto: 12, star: 4, terr: 3, res: 2 }, { upto: 18, star: 5, terr: 4, res: 3 }];

  // Stelle del tracciato del trionfo
  var STARS = {
    up: { n: 'Tutti i 6 aggiornamenti' }, me: { n: 'Tutti i 4 mech' }, st: { n: 'Tutte le 4 strutture' }, re: { n: 'Tutte le 4 reclute' },
    wo: { n: 'Tutti gli 8 lavoratori' }, ob: { n: 'Obiettivo completato' }, co: { n: 'Battaglia vinta' }, po: { n: 'Popolarità 18' }, pw: { n: 'Potere 16' }
  };

  // Carte combattimento: 16 da 2, 12 da 3, 8 da 4, 6 da 5
  var COMBAT = [].concat(rep(2, 16), rep(3, 12), rep(4, 8), rep(5, 6));
  function rep(v, n) { var a = []; for (var i = 0; i < n; i++) a.push(v); return a; }

  // Carte Fabbrica: un'azione in alto speciale; in basso «muovi 1 unità fino a 2 territori»
  var FACTORY = [
    { id: 0, n: 'Fucina a vapore', cost: { pw: 2 }, gain: { r: { m: 3 } }, d: 'Paghi 2 potere: prendi 3 metallo.' },
    { id: 1, n: 'Granaio cooperativo', cost: { c: 1 }, gain: { r: { f: 2 }, pop: 1 }, d: 'Paghi 1 moneta: prendi 2 cibo e +1 popolarità.' },
    { id: 2, n: 'Raffineria', cost: { pop: 2 }, gain: { r: { o: 3 }, c: 1 }, d: 'Paghi 2 popolarità: prendi 3 petrolio e 1 moneta.' },
    { id: 3, n: 'Segheria meccanica', cost: { pw: 1 }, gain: { r: { w: 2 }, c: 1 }, d: 'Paghi 1 potere: prendi 2 legno e 1 moneta.' },
    { id: 4, n: 'Tipografia', cost: { c: 2 }, gain: { pop: 2, pw: 1 }, d: 'Paghi 2 monete: +2 popolarità e +1 potere.' },
    { id: 5, n: 'Arsenale', cost: { pop: 1 }, gain: { pw: 2, cd: 1 }, d: 'Paghi 1 popolarità: +2 potere e 1 carta combattimento.' },
    { id: 6, n: 'Mercato nero', cost: { cd: 1 }, gain: { c: 3 }, d: 'Scarti 1 carta combattimento: prendi 3 monete.' },
    { id: 7, n: 'Officina di guerra', cost: { ar: 2 }, gain: { pw: 3, cd: 1 }, d: 'Paghi 2 risorse qualsiasi: +3 potere e 1 carta combattimento.' },
    { id: 8, n: 'Banca del popolo', cost: {}, gain: { c: 1, ar: 1 }, d: 'Gratis: prendi 1 moneta e 1 risorsa a scelta.' },
    { id: 9, n: 'Ufficio di collocamento', cost: { c: 2 }, gain: { wk: 1 }, d: 'Paghi 2 monete: 1 nuovo lavoratore dove hai già un lavoratore.' },
    { id: 10, n: 'Laboratorio', cost: { c: 3 }, gain: { up: 1 }, d: 'Paghi 3 monete: un aggiornamento gratuito.' },
    { id: 11, n: 'Ospedale da campo', cost: { pw: 1 }, gain: { pop: 2 }, d: 'Paghi 1 potere: +2 popolarità.' }
  ];

  // Obiettivi segreti: ognuno ha una condizione verificata dal motore (chiave k)
  var OBJECTIVES = [
    { id: 0, n: 'Raccolto abbondante', k: 'res', r: 'f', v: 7, d: 'Controlla almeno 7 cibo.' },
    { id: 1, n: 'Legname per l’inverno', k: 'res', r: 'w', v: 7, d: 'Controlla almeno 7 legno.' },
    { id: 2, n: 'Pozzi in piena', k: 'res', r: 'o', v: 7, d: 'Controlla almeno 7 petrolio.' },
    { id: 3, n: 'Fonderia', k: 'res', r: 'm', v: 7, d: 'Controlla almeno 7 metallo.' },
    { id: 4, n: 'Mercato completo', k: 'each', v: 3, d: 'Controlla almeno 3 risorse di ogni tipo.' },
    { id: 5, n: 'Lungo i fiumi', k: 'riverT', v: 5, d: 'Controlla 5 territori che toccano un fiume.' },
    { id: 6, n: 'Signore delle gallerie', k: 'tunnels', v: 3, d: 'Controlla 3 territori con una galleria.' },
    { id: 7, n: 'Paese dei campanili', k: 'terr', t: ['V'], v: 3, d: 'Controlla 3 villaggi.' },
    { id: 8, n: 'Cime e miniere', k: 'terr', t: ['M'], v: 3, d: 'Controlla 3 montagne.' },
    { id: 9, n: 'Pianure sconfinate', k: 'terr', t: ['F', 'T'], v: 4, d: 'Controlla 4 territori tra fattorie e tundre.' },
    { id: 10, n: 'Popolo in festa', k: 'popSt', v: 12, s: 2, d: 'Abbi almeno 12 popolarità e 2 strutture costruite.' },
    { id: 11, n: 'Pugno di ferro', k: 'powMe', v: 10, s: 3, d: 'Abbi almeno 10 potere e 3 mech schierati.' },
    { id: 12, n: 'Arsenale segreto', k: 'cards', v: 5, d: 'Abbi in mano almeno 5 carte combattimento.' },
    { id: 13, n: 'Forziere', k: 'coins', v: 18, d: 'Abbi almeno 18 monete.' },
    { id: 14, n: 'Macchina perfetta', k: 'ups', v: 4, d: 'Completa almeno 4 aggiornamenti.' },
    { id: 15, n: 'Braccia per i campi', k: 'workers', v: 7, d: 'Abbi almeno 7 lavoratori sulla mappa.' },
    { id: 16, n: 'Ovunque', k: 'spread', v: 9, d: 'Controlla 9 territori diversi.' },
    { id: 17, n: 'Guarnigione', k: 'garrison', v: 2, d: 'Abbi il personaggio e almeno 2 mech nello stesso territorio.' },
    { id: 18, n: 'Alla Fabbrica', k: 'factory', d: 'Abbi il personaggio nella Fabbrica e almeno 1 mech in un territorio vicino.' },
    { id: 19, n: 'Equilibrio', k: 'balance', v: 6, d: 'Abbi potere e popolarità uguali, almeno 6 ciascuno.' },
    { id: 20, n: 'Magazzini vuoti', k: 'emptyRes', v: 6, d: 'Controlla almeno 6 territori e nessuna risorsa.' },
    { id: 21, n: 'Presidio dei cantieri', k: 'guarded', v: 3, d: 'Abbi 3 strutture costruite, ognuna con un tuo lavoratore sopra.' },
    { id: 22, n: 'Contadini armati', k: 'mechWork', v: 3, d: 'Abbi un mech insieme ad almeno un lavoratore in 3 territori diversi.' }
  ];

  // Tessere bonus delle strutture (una per partita)
  var BONUS = [
    { id: 0, n: 'Porti sul lago', k: 'adjLake', d: 'Laghi vicini ad almeno una tua struttura', tiers: [[1, 2], [3, 4], [5, 6]] },
    { id: 1, n: 'Imbocchi', k: 'adjTunnel', d: 'Gallerie vicine ad almeno una tua struttura', tiers: [[1, 2], [3, 4], [5, 6]] },
    { id: 2, n: 'Crocevia', k: 'adjEnc', d: 'Territori con il segno dell’incontro vicini ad almeno una tua struttura', tiers: [[1, 2], [3, 4], [5, 6]] },
    { id: 3, n: 'Sottoterra', k: 'onTunnel', d: 'Tue strutture costruite su una galleria', tiers: [[1, 2], [2, 4], [3, 6]] },
    { id: 4, n: 'Lungo la strada', k: 'row', d: 'La fila dritta più lunga di tue strutture vicine', tiers: [[2, 2], [3, 4], [4, 6]] },
    { id: 5, n: 'Granai e pozzi', k: 'onFT', d: 'Tue strutture su fattorie e tundre', tiers: [[1, 2], [2, 4], [3, 6], [4, 9]] }
  ];

  // Incontri: 3 opzioni. Costi: c monete, pop popolarità, pw potere. Premi: c, pw, pop, cd carte, r risorse, ar risorse a scelta,
  // wk lavoratori, mech mech gratuito, st struttura gratuita, up aggiornamento gratuito, en recluta gratuita. Tutto arriva nel territorio del personaggio.
  var ENCOUNTERS = [
    { n: 'Il carro nel fosso', t: 'Un carro di contadini è finito nel fosso sotto la pioggia battente.', o: [
      { t: 'Aiuti a tirarlo fuori', cost: {}, gain: { pop: 2, c: 1 } }, { t: 'Compri tutto il carico', cost: { c: 2 }, gain: { r: { f: 2, w: 2 } } }, { t: 'Requisisci il carico', cost: { pop: 2 }, gain: { r: { f: 3, w: 2 }, c: 1 } }] },
    { n: 'L’ingegnere esule', t: 'Un ingegnere in fuga offre i suoi disegni in cambio di protezione.', o: [
      { t: 'Gli offri riparo', cost: {}, gain: { pop: 2, pw: 1 } }, { t: 'Finanzi il suo prototipo', cost: { c: 3 }, gain: { mech: 1 } }, { t: 'Gli strappi i disegni', cost: { pop: 3 }, gain: { up: 1, c: 2 } }] },
    { n: 'La fiera d’autunno', t: 'Bancarelle, fisarmoniche e odore di castagne: tutto il villaggio è in piazza.', o: [
      { t: 'Offri da bere a tutti', cost: {}, gain: { pop: 3 } }, { t: 'Compri bestiame e sementi', cost: { c: 2 }, gain: { r: { f: 4 } } }, { t: 'Imponi una tassa sulla fiera', cost: { pop: 2 }, gain: { c: 5 } }] },
    { n: 'Il pozzo che brucia', t: 'Una colonna di fumo nero: un pozzo di petrolio ha preso fuoco.', o: [
      { t: 'Organizzi la squadra antincendio', cost: {}, gain: { pop: 2, r: { o: 1 } } }, { t: 'Paghi i tecnici per salvarlo', cost: { c: 2 }, gain: { r: { o: 4 } } }, { t: 'Ti prendi i barili e lasci bruciare', cost: { pop: 2 }, gain: { r: { o: 3 }, pw: 2 } }] },
    { n: 'Veterani al bivio', t: 'Una colonna di soldati smobilitati cerca lavoro e un tetto.', o: [
      { t: 'Li accogli nei campi', cost: {}, gain: { wk: 1, pop: 1 } }, { t: 'Paghi la loro paga arretrata', cost: { c: 3 }, gain: { en: 1 } }, { t: 'Li arruoli con la forza', cost: { pop: 2 }, gain: { pw: 3, cd: 1 } }] },
    { n: 'Il mulino abbandonato', t: 'Le pale sono ferme da anni, ma le macine sono ancora buone.', o: [
      { t: 'Lo restituisci al villaggio', cost: {}, gain: { pop: 2, r: { f: 1 } } }, { t: 'Paghi i muratori per rimetterlo in piedi', cost: { c: 3 }, gain: { st: 1 } }, { t: 'Lo smonti per il legname', cost: { pop: 2 }, gain: { r: { w: 4 }, c: 1 } }] },
    { n: 'La miniera allagata', t: 'L’acqua ha invaso le gallerie: i minatori sono bloccati all’imbocco.', o: [
      { t: 'Scavi con loro un canale di scolo', cost: {}, gain: { pop: 2, r: { m: 1 } } }, { t: 'Compri le pompe a vapore', cost: { c: 2 }, gain: { r: { m: 4 } } }, { t: 'Ti prendi il metallo già estratto', cost: { pop: 2 }, gain: { r: { m: 3 }, c: 2 } }] },
    { n: 'Il circo itinerante', t: 'Un tendone a strisce e un orso che balla: il circo è in città.', o: [
      { t: 'Porti tutti allo spettacolo', cost: {}, gain: { pop: 3 } }, { t: 'Compri il carro dei giocolieri', cost: { c: 2 }, gain: { ar: 3 } }, { t: 'Sequestri il carro e gli animali', cost: { pop: 3 }, gain: { c: 4, pw: 2 } }] },
    { n: 'Il contrabbandiere', t: 'Un uomo dal cappotto lungo apre una valigia piena di sorprese.', o: [
      { t: 'Lo lasci andare', cost: {}, gain: { pop: 1, c: 2 } }, { t: 'Compri le sue mappe militari', cost: { c: 2 }, gain: { cd: 3 } }, { t: 'Gli confischi la valigia', cost: { pop: 2 }, gain: { cd: 2, c: 3 } }] },
    { n: 'La scuola del villaggio', t: 'La maestra chiede aiuto: il tetto della scuola sta crollando.', o: [
      { t: 'Ripari il tetto con le tue mani', cost: {}, gain: { pop: 3 } }, { t: 'Finanzi una scuola nuova', cost: { c: 3 }, gain: { pop: 2, up: 1 } }, { t: 'La trasformi in caserma', cost: { pop: 3 }, gain: { st: 1, pw: 1 } }] },
    { n: 'La tempesta di neve', t: 'La bufera blocca i passi: decine di famiglie sono rimaste senza legna.', o: [
      { t: 'Dividi le tue provviste', cost: {}, gain: { pop: 2, wk: 1 } }, { t: 'Paghi una carovana di soccorso', cost: { c: 2 }, gain: { pop: 2, r: { w: 2 } } }, { t: 'Vendi la legna a prezzo d’oro', cost: { pop: 2 }, gain: { c: 5 } }] },
    { n: 'Il rottamaio', t: 'Una montagna di ferraglia: pezzi di vecchi mech della Grande Guerra.', o: [
      { t: 'Aiuti a fare ordine', cost: {}, gain: { r: { m: 2 }, pop: 1 } }, { t: 'Compri un mech da rimontare', cost: { c: 3 }, gain: { mech: 1 } }, { t: 'Ti prendi i pezzi migliori', cost: { pop: 2 }, gain: { r: { m: 3 }, pw: 2 } }] },
    { n: 'Il ponte crollato', t: 'Il vecchio ponte di legno è finito nel fiume.', o: [
      { t: 'Lo ricostruisci con i paesani', cost: {}, gain: { pop: 2, r: { w: 1 } } }, { t: 'Paghi un ponte di ferro', cost: { c: 3 }, gain: { st: 1 } }, { t: 'Imponi un pedaggio a chi guada', cost: { pop: 2 }, gain: { c: 4, r: { w: 1 } } }] },
    { n: 'La cooperativa', t: 'I contadini vogliono unirsi in cooperativa e cercano un garante.', o: [
      { t: 'Fai da garante', cost: {}, gain: { pop: 2, r: { f: 1 } } }, { t: 'Investi nella cooperativa', cost: { c: 2 }, gain: { wk: 2 } }, { t: 'Ne prendi il controllo', cost: { pop: 3 }, gain: { r: { f: 3 }, wk: 1, c: 1 } }] },
    { n: 'L’accademia militare', t: 'Giovani cadetti in uniforme marciano nel cortile della vecchia villa.', o: [
      { t: 'Assisti alla parata', cost: {}, gain: { pw: 2, pop: 1 } }, { t: 'Finanzi una borsa di studio', cost: { c: 3 }, gain: { en: 1 } }, { t: 'Ti prendi i migliori cadetti', cost: { pop: 2 }, gain: { pw: 3, cd: 2 } }] },
    { n: 'La stazione del treno', t: 'L’ultimo treno è fermo da giorni: il macchinista è sparito.', o: [
      { t: 'Riporti i passeggeri a casa', cost: {}, gain: { pop: 2, c: 1 } }, { t: 'Compri il carico dei vagoni', cost: { c: 2 }, gain: { ar: 3 } }, { t: 'Svuoti i vagoni', cost: { pop: 2 }, gain: { ar: 3, c: 2 } }] },
    { n: 'Il guaritore', t: 'Un vecchio con una borsa di erbe cura i feriti senza chiedere nulla.', o: [
      { t: 'Gli dai una mano', cost: {}, gain: { pop: 2, pw: 1 } }, { t: 'Gli costruisci un’infermeria', cost: { c: 3 }, gain: { st: 1 } }, { t: 'Lo obblighi a curare solo i tuoi', cost: { pop: 2 }, gain: { pw: 4 } }] },
    { n: 'Lupi nel bosco', t: 'Un branco affamato si avvicina alle stalle ogni notte.', o: [
      { t: 'Organizzi le ronde', cost: {}, gain: { pop: 2, r: { f: 1 } } }, { t: 'Assoldi dei cacciatori', cost: { c: 2 }, gain: { pop: 1, pw: 2, cd: 1 } }, { t: 'Bruci il bosco', cost: { pop: 3 }, gain: { r: { w: 3 }, pw: 2 } }] },
    { n: 'L’officina di provincia', t: 'Un fabbro geniale costruisce motori nel retro della bottega.', o: [
      { t: 'Gli porti il tuo cibo', cost: {}, gain: { pop: 1, r: { m: 2 } } }, { t: 'Gli commissioni un motore', cost: { c: 3 }, gain: { up: 1 } }, { t: 'Gli requisisci l’officina', cost: { pop: 2 }, gain: { mech: 1 } }] },
    { n: 'La processione', t: 'Stendardi e canti: la processione del santo patrono attraversa i campi.', o: [
      { t: 'Ti unisci al corteo', cost: {}, gain: { pop: 3 } }, { t: 'Doni una campana nuova', cost: { c: 2 }, gain: { pop: 3, pw: 1 } }, { t: 'Disperdi la folla', cost: { pop: 3 }, gain: { pw: 3, c: 2 } }] },
    { n: 'Il tesoro sepolto', t: 'Un bambino ha trovato una cassa arrugginita nel campo di patate.', o: [
      { t: 'La lasci alla famiglia', cost: {}, gain: { pop: 2, c: 1 } }, { t: 'La compri dalla famiglia', cost: { c: 1 }, gain: { c: 4 } }, { t: 'Te la prendi', cost: { pop: 2 }, gain: { c: 5 } }] },
    { n: 'I profughi del nord', t: 'Famiglie intere con carretti e galline scendono verso valle.', o: [
      { t: 'Li fai stabilire qui', cost: {}, gain: { wk: 1, pop: 1 } }, { t: 'Paghi le loro nuove case', cost: { c: 3 }, gain: { wk: 2, pop: 1 } }, { t: 'Li metti al lavoro senza paga', cost: { pop: 3 }, gain: { wk: 2, r: { f: 1 } } }] },
    { n: 'Il dirigibile caduto', t: 'Un dirigibile da carico si è schiantato tra gli alberi.', o: [
      { t: 'Soccorri l’equipaggio', cost: {}, gain: { pop: 2, cd: 1 } }, { t: 'Compri il motore', cost: { c: 2 }, gain: { r: { o: 2, m: 2 } } }, { t: 'Saccheggi il relitto', cost: { pop: 2 }, gain: { r: { m: 2, o: 2 }, c: 1 } }] },
    { n: 'La scommessa', t: 'In una taverna fumosa, un gigante sfida chiunque a braccio di ferro.', o: [
      { t: 'Ridi e offri da bere', cost: {}, gain: { pop: 2, c: 1 } }, { t: 'Paghi per farlo entrare nei tuoi', cost: { c: 2 }, gain: { pw: 2, cd: 2 } }, { t: 'Lo umili davanti a tutti', cost: { pop: 2 }, gain: { pw: 4, c: 1 } }] },
    { n: 'Il cantiere fermo', t: 'Un’impalcatura vuota: il costruttore è fallito e gli operai aspettano.', o: [
      { t: 'Paghi gli operai con il tuo cibo', cost: {}, gain: { pop: 2, r: { w: 1 } } }, { t: 'Rilevi il cantiere', cost: { c: 3 }, gain: { st: 1 } }, { t: 'Ti prendi le travi', cost: { pop: 2 }, gain: { r: { w: 4 }, c: 1 } }] },
    { n: 'La raccolta', t: 'Il grano è maturo e il temporale è vicino: servono braccia, subito.', o: [
      { t: 'Mandi i tuoi a mietere', cost: {}, gain: { r: { f: 2 }, pop: 1 } }, { t: 'Compri una mietitrice', cost: { c: 2 }, gain: { r: { f: 4 } } }, { t: 'Ti prendi il raccolto', cost: { pop: 2 }, gain: { r: { f: 4 }, c: 1 } }] },
    { n: 'Il disertore', t: 'Un pilota di mech nemico si arrende e chiede asilo.', o: [
      { t: 'Gli dai asilo', cost: {}, gain: { pop: 1, cd: 2 } }, { t: 'Gli offri un posto da istruttore', cost: { c: 2 }, gain: { en: 1 } }, { t: 'Lo consegni ai suoi per una taglia', cost: { pop: 2 }, gain: { c: 3, pw: 2 } }] },
    { n: 'La centrale idroelettrica', t: 'Turbine ferme e cavi strappati: la centrale potrebbe dare luce a tutta la valle.', o: [
      { t: 'Riaccendi le luci del villaggio', cost: {}, gain: { pop: 3 } }, { t: 'Finanzi le riparazioni', cost: { c: 3 }, gain: { up: 1 } }, { t: 'Smonti le turbine', cost: { pop: 2 }, gain: { r: { m: 3, o: 1 } } }] }
  ];

  return { MAP: MAP, TERR: TERR, RES: RES, RES_ORDER: RES_ORDER, FACTIONS: FACTIONS, FAC_ORDER: FAC_ORDER, INACTIVE_BASES: INACTIVE_BASES,
    TOP: TOP, UPS: UPS, BOTTOM: BOTTOM, STRUCTS: STRUCTS, STRUCT_BY_TOP: STRUCT_BY_TOP, ONCE: ONCE, ONCE_ORDER: ONCE_ORDER, ONGOING: ONGOING,
    MATS: MATS, BANNED: BANNED, TIERS: TIERS, STARS: STARS, COMBAT: COMBAT, FACTORY: FACTORY, OBJECTIVES: OBJECTIVES, BONUS: BONUS, ENCOUNTERS: ENCOUNTERS };
})();
