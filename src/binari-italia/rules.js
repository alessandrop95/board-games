/* ===== Ticket to Ride Italy: regolamento (sezioni richiamabili dal «?» di ogni fase) ===== */
var BIRules = (function () {
  var A = BIArt, D = BIData;
  function sw(c, n) { return A.swatch(c, n); }
  function regTable() {
    var ns = []; for (var n = 5; n <= 22; n++) if (n <= 18 || n % 2 === 0) ns.push(n);
    return '<table class="rtab rreg"><tr><th>Regioni</th>' + ns.slice(0, 9).map(function (n) { return '<td>' + n + '</td>'; }).join('') + '</tr><tr><th>Punti</th>' + ns.slice(0, 9).map(function (n) { return '<td>' + D.regionPts(n) + '</td>'; }).join('') + '</tr>' +
      '<tr><th>Regioni</th>' + ns.slice(9).map(function (n) { return '<td>' + n + '</td>'; }).join('') + '</tr><tr><th>Punti</th>' + ns.slice(9).map(function (n) { return '<td>' + D.regionPts(n) + '</td>'; }).join('') + '</tr></table>';
  }
  var S = {
    goal: ['Lo scopo',
      '<p>Costruisci linee ferroviarie tra le città d’Italia e verso i Paesi confinanti. Fai punti in tre modi:</p>' +
      '<ul><li><b>Tratte</b>: ogni tratta che conquisti vale punti subito, di più se è lunga.</li>' +
      '<li><b>Biglietti destinazione</b>: sono segreti. Se a fine partita le tue tratte collegano le due mete, guadagni i punti scritti sul biglietto; se non le collegano, li <b>perdi</b>.</li>' +
      '<li><b>Regioni</b>: a fine partita ogni tua rete di tratte collegate vale un bonus in base a quante regioni tocca.</li></ul>' +
      '<p class="rbox"><b>In breve:</b> raccogli carte del colore giusto, prendi le tratte che ti servono prima degli altri, completa i biglietti e unisci più regioni possibili in un’unica rete. Non c’è bonus per il percorso più lungo.</p>'],
    setup: ['Come si comincia',
      '<p>Ognuno ha <b>' + D.TRAINS + ' vagoni</b> del suo colore e <b>4 carte vagone</b>, e riceve <b>' + D.START_TICKETS + ' biglietti</b>: ne tiene <b>almeno ' + D.START_KEEP + '</b> (anche tutti). Quelli scartati tornano in fondo al mazzo.</p>' +
      '<p>Accanto al mazzo ci sono sempre <b>5 carte scoperte</b> e il mucchio delle <b>' + D.FERRY + ' carte Traghetto</b>.</p>'],
    turn: ['Il tuo turno: una sola azione',
      '<p>Quando tocca a te scegli <b>una</b> di queste quattro azioni (non si può passare):</p>' +
      '<ol><li><b>Pesca 2 carte vagone</b> (dalle scoperte o dal mazzo).</li><li><b>Conquista una tratta</b> giocando le carte che servono.</li><li><b>Pesca ' + D.DRAW_TICKETS + ' biglietti</b> e tienine almeno 1.</li><li><b>Prendi 1 carta Traghetto</b> (se ne hai meno di ' + D.FERRY_MAX + ').</li></ol>' +
      '<p>Poi tocca al giocatore successivo. La riga in fondo allo schermo ti dice sempre cosa puoi fare.</p>'],
    draw: ['Pescare carte vagone',
      '<p>Prendi <b>2 carte</b>, una per volta: ogni volta scegli tra le <b>5 scoperte</b> o la prima del <b>mazzo coperto</b>. Una carta scoperta presa viene subito sostituita.</p>' +
      '<p>' + sw('L') + ' <b>Locomotiva</b>: è il jolly, vale come qualsiasi colore.</p>' +
      '<ul><li>Se prendi una <b>locomotiva scoperta</b>, è l’<b>unica carta</b> del turno.</li>' +
      '<li>Come <b>seconda carta</b> non puoi prendere una locomotiva scoperta.</li>' +
      '<li>Una locomotiva pescata <b>dal mazzo</b> conta come una carta normale: ne peschi comunque un’altra.</li>' +
      '<li>Se tra le scoperte compaiono <b>3 locomotive</b>, si scartano tutte e 5 e se ne scoprono altre 5.</li>' +
      '<li>Quando il mazzo finisce si rimescolano gli scarti. Non c’è limite alle carte in mano.</li></ul>' +
      '<p class="muted">Colori: ' + D.CARD_COLORS.map(function (c) { return sw(c); }).join(' ') + ' — ogni colore ha anche un simbolo, per riconoscerlo senza vederlo.</p>'],
    claim: ['Conquistare una tratta',
      '<p>Una tratta collega due città vicine (o una città e un Paese confinante) ed è fatta di spazi. Per prenderla giochi <b>tante carte quanti sono gli spazi</b>, <b>tutte dello stesso colore</b>:</p>' +
      '<ul><li><b>Tratta colorata</b>: carte di quel colore.</li><li><b>Tratta grigia</b>: un colore qualsiasi, ma tutte uguali.</li><li>Le <b>locomotive</b> sostituiscono qualunque carta (anche tutte).</li></ul>' +
      '<p>Devi avere ancora abbastanza <b>vagoni</b>. Le carte usate vanno negli scarti, i tuoi vagoni coprono la tratta e i punti arrivano subito. Una tratta per turno, e non serve che sia collegata alle tue.</p>' +
      '<p><b>Sul telefono:</b> tocca la tratta sulla mappa. Si apre una scheda con le carte che userai e i punti; se non puoi prenderla, ti spiega perché.</p>' +
      '<table class="rtab"><tr><th>Spazi</th><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr><tr><th>Punti</th><td>1</td><td>2</td><td>4</td><td>7</td><td>10</td><td>15</td></tr></table>'],
    double: ['Tratte doppie',
      '<p>Tra alcune città ci sono <b>due binari affiancati</b>. Uno stesso giocatore non può prenderli entrambi.</p>' +
      '<p>Con <b>2 o 3 giocatori</b> se ne usa <b>uno solo</b>: appena qualcuno ne prende uno, l’altro resta chiuso per tutti.</p>'],
    ferry: ['Traghetti e carte Traghetto',
      '<p>Le tratte di mare verso <b>Sicilia e Sardegna</b> sono grigie e hanno degli spazi con l’<b>onda</b> <span class="wv">' + '<svg viewBox="-8 -6 16 12" width="18" aria-hidden="true">' + A.wave('#1f6f8f') + '</svg></span>.</p>' +
      '<ul><li>Ogni spazio con l’onda si paga con una <b>locomotiva</b>, oppure con le <b>carte Traghetto</b>: <b>una carta Traghetto paga fino a 2 spazi con l’onda</b>.</li>' +
      '<li>Gli spazi senza onda si pagano come una tratta grigia: carte di un solo colore o locomotive.</li>' +
      '<li>Le carte Traghetto si usano <b>solo</b> sugli spazi con l’onda. Dopo l’uso tornano nel mucchio.</li>' +
      '<li>Prendere una carta Traghetto è un’<b>azione del turno</b>. Puoi averne al massimo <b>' + D.FERRY_MAX + '</b>, e gli altri vedono quante ne hai.</li></ul>' +
      '<p><b>Esempio:</b> Cagliari–Palermo ha 5 spazi, 4 con l’onda: la paghi con 2 carte Traghetto + 1 carta di un colore, oppure con 1 carta Traghetto + 2 locomotive + 1 carta, oppure con 4 locomotive + 1 carta.</p>'],
    countries: ['Paesi confinanti',
      '<p>Al confine ci sono i valichi verso <b>' + A.flag('francia', 18) + ' Francia, ' + A.flag('svizzera', 18) + ' Svizzera, ' + A.flag('austria', 18) + ' Austria e ' + A.flag('slovenia', 18) + ' Slovenia</b>. Alcuni biglietti hanno come meta uno di questi Paesi.</p>' +
      '<ul><li>Ogni tratta verso un Paese è un <b>vicolo cieco</b>: ci arrivi ma non prosegui.</li><li>Tratte diverse verso lo stesso Paese <b>non sono collegate</b> tra loro.</li><li>Per un biglietto con un Paese basta raggiungere <b>uno qualunque</b> dei suoi valichi.</li><li>I Paesi non sono regioni: non contano per il bonus delle regioni.</li></ul>'],
    tickets: ['Biglietti destinazione',
      '<p>Peschi <b>' + D.DRAW_TICKETS + ' biglietti</b> e ne tieni <b>almeno 1</b>; gli altri tornano in fondo al mazzo. I biglietti tenuti non si possono più scartare.</p>' +
      '<p>Un biglietto è <b>arrivato</b> quando le tue tratte formano una linea continua tra le due mete, in qualsiasi ordine. A fine partita vale <b>+</b> i suoi punti se è arrivato, <b>−</b> se non lo è.</p>' +
      '<p><b>Sul telefono:</b> le mete dei tuoi biglietti sono cerchiate in rosso sulla mappa; quando un biglietto è completato diventano verdi.</p>'],
    regions: ['Il bonus delle regioni',
      '<p>Ogni città appartiene a una delle <b>' + Object.keys(D.regions).length + ' regioni</b>. A fine partita ogni tua <b>rete</b> (gruppo di tratte collegate tra loro) vale un bonus secondo quante regioni diverse tocca:</p>' + regTable() +
      '<ul><li>Se hai più reti separate, ognuna si conta <b>a parte</b>: unirle conviene molto.</li><li><b>Sicilia, Sardegna e Puglia</b> valgono <b>2 regioni</b> se <b>tutte</b> le loro città sono nella stessa rete.</li></ul>' +
      '<p><b>Sul telefono:</b> il pulsante con lo stemma sulla mappa colora le stazioni per regione; «Regioni e bonus» nel menu mostra le tue reti e il bonus di adesso.</p>'],
    end: ['Fine della partita',
      '<p>Quando un giocatore, alla fine del suo turno, ha <b>2 vagoni o meno</b>, parte l’<b>ultimo giro</b>: ognuno, lui compreso, gioca ancora <b>un turno</b>. Poi si contano i punti.</p>'],
    score: ['Il conteggio finale',
      '<ol><li>Punti delle tratte (già presi durante la partita).</li><li>Biglietti: <b>+</b> quelli arrivati, <b>−</b> quelli non arrivati.</li><li><b>Bonus delle regioni</b> per ogni rete.</li></ol>' +
      '<p>Vince chi ha più punti. Se c’è pareggio vince chi ha completato più biglietti, poi chi ha il bonus delle regioni più alto.</p>'],
    tips: ['Consigli per iniziare',
      '<ul><li>Guarda dove passano i tuoi biglietti e raccogli carte di quei colori.</li><li>Le tratte lunghe valgono molto di più per vagone: 6 spazi = 15 punti.</li>' +
      '<li>Se devi andare in Sicilia o in Sardegna, prendi per tempo una o due carte Traghetto: risparmi molte locomotive.</li><li>Cerca di tenere le tue tratte in un’unica rete: da 9 regioni in su il bonus cresce in fretta.</li>' +
      '<li>Non aspettare troppo: se un avversario prende una tratta che ti serve, dovrai fare il giro largo.</li><li>Pesca nuovi biglietti solo se hai vagoni e tempo per completarli.</li></ul>']
  };
  var ORDER = ['goal', 'setup', 'turn', 'draw', 'claim', 'double', 'ferry', 'countries', 'tickets', 'regions', 'end', 'score', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S };
})();
