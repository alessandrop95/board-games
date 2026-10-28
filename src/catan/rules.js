/* ===== Catan: regolamento (sezioni richiamabili dal «?» di ogni fase) ===== */
var CTRules = (function () {
  var A = CTArt, D = CTData;
  function cost(c) { var h = ''; D.RES.forEach(function (r) { if (c[r]) h += A.resDot(r, c[r]); }); return '<span class="costrow">' + h + '</span>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Siete coloni appena sbarcati su un’isola. Costruite <b>strade</b>, <b>colonie</b> e <b>città</b> con le risorse che la terra produce, commerciate tra voi e con il porto.</p>' +
      '<p>Vince chi arriva per primo a <b>10 punti vittoria</b> (l’host può scegliere 8 o 12) <b>durante il proprio turno</b>.</p>' +
      '<ul><li>' + A.piece('settle', 0, 18) + ' Colonia: <b>1 punto</b></li><li>' + A.piece('city', 0, 18) + ' Città: <b>2 punti</b></li><li>Strada più lunga ed Esercito più grande: <b>2 punti</b> ciascuno</li><li>Carte Punto vittoria: <b>1 punto</b> ciascuna (segrete fino alla fine)</li></ul>'],
    island: ['L’isola',
      '<p>L’isola è fatta di <b>19 tessere</b>. Cinque terreni producono una risorsa ciascuno:</p>' +
      '<table class="rtab rl"><tr><td>Foresta</td><td>' + A.resDot('wood') + ' legname</td></tr><tr><td>Colline</td><td>' + A.resDot('brick') + ' argilla</td></tr><tr><td>Pascolo</td><td>' + A.resDot('wool') + ' lana</td></tr><tr><td>Campi</td><td>' + A.resDot('grain') + ' grano</td></tr><tr><td>Montagne</td><td>' + A.resDot('ore') + ' minerale</td></tr><tr><td>Deserto</td><td>niente (qui parte il ladro)</td></tr></table>' +
      '<p>Su ogni tessera c’è un <b>numero da 2 a 12</b>. I puntini sotto il numero dicono quanto è probabile: <b>6</b> e <b>8</b> (in rosso) escono più spesso, 2 e 12 quasi mai. I 6 e gli 8 non sono mai vicini.</p>' +
      '<p>Si costruisce sugli <b>incroci</b> (dove si toccano tre tessere) e lungo i <b>lati</b>. Una colonia raccoglie da tutte le tessere che tocca.</p>'],
    setup: ['La fondazione',
      '<p>Prima della partita ognuno piazza <b>gratis 2 colonie</b>, ciascuna con una <b>strada</b> attaccata:</p>' +
      '<ol><li>Primo giro, in ordine: una colonia e una strada a testa.</li><li>Secondo giro, <b>al contrario</b> (l’ultimo piazza di nuovo per primo): un’altra colonia e un’altra strada.</li></ol>' +
      '<p>Con la <b>seconda colonia</b> ricevi subito una risorsa per ogni tessera che tocca.</p>' +
      '<p><b>Regola della distanza</b>: tra due colonie (di chiunque) deve esserci sempre almeno <b>un incrocio libero</b>. Sul telefono i posti validi lampeggiano.</p>'],
    turn: ['Il tuo turno',
      '<ol><li><b>Lancia i dadi</b>: la somma dice quali tessere producono.</li><li><b>Commercia</b> con gli altri giocatori o con la banca.</li><li><b>Costruisci</b> strade, colonie, città o compra carte sviluppo.</li><li>Tocca <b>Fine turno</b>.</li></ol>' +
      '<p>Dopo il lancio puoi commerciare e costruire nell’ordine che vuoi, quante volte vuoi. Una carta sviluppo puoi giocarla anche <b>prima</b> di lanciare.</p>'],
    produce: ['La produzione',
      '<p>Dopo ogni lancio, <b>tutti</b> i giocatori con una colonia o una città su una tessera con quel numero ricevono la risorsa: <b>1 carta per colonia</b>, <b>2 per città</b>. Non solo chi ha lanciato!</p>' +
      '<p>Se nella banca non ci sono abbastanza carte di una risorsa per tutti, quella risorsa non la riceve nessuno (a meno che spetti a un solo giocatore: allora prende quelle che restano).</p>' +
      '<p>Una tessera con sopra il <b>ladro</b> non produce.</p>'],
    seven: ['Il 7 e il ladro',
      '<p>Il 7 è il numero più frequente ma <b>non produce</b>. Invece:</p>' +
      '<ol><li>Chi ha <b>più di 7 carte</b> risorsa in mano ne scarta <b>metà</b> (per difetto: con 9 carte ne scarti 4).</li><li>Chi ha lanciato <b>sposta il ladro</b> su un’altra tessera: quella tessera smette di produrre finché il ladro resta lì.</li><li>Poi <b>ruba una carta a caso</b> a un giocatore che ha una colonia o una città su quella tessera.</li></ol>' +
      '<p>Con l’opzione <b>«ladro gentile»</b> il ladro non può colpire chi ha ancora 2 punti o meno.</p>'],
    trade: ['Il commercio',
      '<p>Dopo aver lanciato, nel tuo turno puoi scambiare:</p>' +
      '<ul><li><b>Con gli altri giocatori</b>: proponi cosa dai e cosa chiedi. Gli altri accettano o rifiutano dal loro telefono; tu scegli con chi chiudere. Gli altri possono scambiare solo con chi è di turno, non tra loro. Non si regalano carte.</li>' +
      '<li><b>Con la banca</b>: <b>4 carte uguali</b> per 1 a scelta.</li><li><b>Con un porto</b> (se hai una colonia o città sul suo molo): porto ' + A.icon('harbor') + ' <b>3:1</b> = 3 carte uguali per 1; porto speciale <b>2:1</b> = 2 carte di <i>quella</i> risorsa per 1.</li></ul>'],
    build: ['Costruire',
      '<table class="rtab rc"><tr><th>Cosa</th><th>Costa</th><th>Dà</th></tr>' +
      '<tr><td>' + A.piece('road', 0, 18) + ' Strada</td><td>' + cost(D.COST.road) + '</td><td>allunga la rete</td></tr>' +
      '<tr><td>' + A.piece('settle', 0, 18) + ' Colonia</td><td>' + cost(D.COST.settle) + '</td><td>1 punto</td></tr>' +
      '<tr><td>' + A.piece('city', 0, 18) + ' Città</td><td>' + cost(D.COST.city) + '</td><td>2 punti (al posto di una colonia)</td></tr>' +
      '<tr><td>' + A.icon('dev') + ' Carta sviluppo</td><td>' + cost(D.COST.dev) + '</td><td>una carta a sorpresa</td></tr></table>' +
      '<ul><li>Una <b>strada</b> va attaccata a una tua strada, colonia o città. Non può passare <b>attraverso</b> la colonia di un altro.</li>' +
      '<li>Una <b>colonia</b> va su un incrocio raggiunto da una tua strada, rispettando la regola della distanza.</li>' +
      '<li>Una <b>città</b> sostituisce una tua colonia (la colonia torna a disposizione) e produce il doppio.</li>' +
      '<li>Hai al massimo 15 strade, 5 colonie e 4 città.</li></ul>'],
    dev: ['Le carte sviluppo',
      '<p>Si comprano e restano segrete. Puoi giocarne <b>una per turno</b>, anche prima di lanciare, ma <b>non</b> nello stesso turno in cui l’hai comprata.</p>' +
      '<ul><li><b>Cavaliere</b> (14): sposta il ladro e ruba una carta, come col 7 (ma senza scarti). Resta scoperto davanti a te per l’Esercito più grande.</li>' +
      '<li><b>Punto vittoria</b> (5): vale 1 punto. Non si gioca: conta da solo e si scopre a fine partita (può farti vincere appena arrivi ai punti).</li>' +
      '<li><b>Costruzione di strade</b> (2): costruisci gratis 2 strade.</li>' +
      '<li><b>Invenzione</b> (2): prendi dalla banca 2 risorse a scelta.</li>' +
      '<li><b>Monopolio</b> (2): scegli una risorsa: tutti gli altri ti danno tutte le carte di quella risorsa che hanno in mano.</li></ul>'],
    special: ['Strada più lunga ed Esercito più grande',
      '<p><b>Strada più lunga</b> (+2 punti): a chi per primo ha una strada continua di almeno <b>5 tratti</b> (senza contare le diramazioni). Se qualcuno ne fa una <b>più lunga</b>, gliela prende. La colonia di un avversario costruita in mezzo spezza la strada.</p>' +
      '<p><b>Esercito più grande</b> (+2 punti): a chi per primo ha giocato <b>3 Cavalieri</b>. Passa a chi ne gioca di più.</p>' +
      '<p>A parità non cambia di mano. Se chi l’aveva scende e due giocatori restano pari, la carta torna da parte.</p>'],
    end: ['La fine',
      '<p>La partita finisce appena un giocatore ha <b>10 punti</b> (o quelli scelti dall’host) <b>nel proprio turno</b>: contano anche le sue carte Punto vittoria segrete. Se arrivi ai punti nel turno di un altro, vinci all’inizio del tuo.</p>'],
    options: ['Le opzioni del tavolo',
      '<ul><li><b>Punti per vincere</b>: 8 (partita corta), 10 (normale) o 12 (lunga).</li><li><b>Ladro gentile</b>: il ladro non può colpire chi ha 2 punti o meno.</li><li><b>Tempo per turno</b>: se un giocatore non risponde in tempo, gioca per lui il giocatore automatico finché non torna.</li></ul>'],
    tips: ['Consigli per iniziare',
      '<ul><li>Nella fondazione scegli incroci con numeri <b>frequenti</b> (6, 8, 5, 9) e risorse <b>diverse</b>.</li><li>All’inizio servono soprattutto <b>argilla e legname</b> (strade e colonie); più avanti <b>minerale e grano</b> (città e carte).</li>' +
      '<li>Non tenere più di 7 carte: un 7 te ne porterebbe via metà.</li><li>Un porto 2:1 della risorsa che produci di più vale oro.</li><li>Commercia! Spesso conviene dare 2 carte per averne 1 che ti sblocca una costruzione.</li></ul>']
  };
  var ORDER = ['goal', 'island', 'setup', 'turn', 'produce', 'seven', 'trade', 'build', 'dev', 'special', 'end', 'options', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, cost: cost };
})();
