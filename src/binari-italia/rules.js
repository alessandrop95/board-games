/* ===== Binari d'Italia: regolamento (sezioni richiamabili dal «?» di ogni fase) ===== */
var BIRules = (function () {
  var A = BIArt, D = BIData;
  function sw(c, n) { return A.swatch(c, n); }
  var S = {
    goal: ['Lo scopo',
      '<p>Costruisci linee ferroviarie tra le città d’Italia. Fai punti in tre modi:</p>' +
      '<ul><li><b>Tratte</b>: ogni tratta che conquisti vale punti subito, di più se è lunga.</li>' +
      '<li><b>Biglietti destinazione</b>: sono segreti. Se a fine partita le tue tratte collegano le due città, guadagni i punti scritti sul biglietto; se non le collegano, li <b>perdi</b>.</li>' +
      '<li><b>Percorso più lungo</b>: 10 punti a chi ha la linea continua più lunga.</li></ul>' +
      '<p class="rbox"><b>In breve:</b> raccogli carte del colore giusto, prendi le tratte che ti servono prima degli altri e completa i biglietti.</p>'],
    setup: ['Come si comincia',
      '<p>Ognuno ha <b>45 vagoni</b> del suo colore, <b>4 carte vagone</b> e riceve <b>3 biglietti</b>: ne tiene <b>almeno 2</b> (anche tutti e 3). Quelli scartati tornano in fondo al mazzo.</p>' +
      '<p>Accanto al mazzo ci sono sempre <b>5 carte scoperte</b> che tutti possono prendere.</p>'],
    turn: ['Il tuo turno: una sola azione',
      '<p>Quando tocca a te scegli <b>una</b> di queste tre azioni (non si può passare):</p>' +
      '<ol><li><b>Pesca 2 carte vagone</b> (dalle scoperte o dal mazzo).</li><li><b>Conquista una tratta</b> giocando le carte che servono.</li><li><b>Pesca 3 biglietti</b> e tienine almeno 1.</li></ol>' +
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
      '<p>Una tratta collega due città vicine ed è fatta di spazi. Per prenderla giochi <b>tante carte quanti sono gli spazi</b>, <b>tutte dello stesso colore</b>:</p>' +
      '<ul><li><b>Tratta colorata</b>: carte di quel colore.</li><li><b>Tratta grigia</b>: un colore qualsiasi, ma tutte uguali.</li><li>Le <b>locomotive</b> sostituiscono qualunque carta (anche tutte).</li></ul>' +
      '<p>Devi avere ancora abbastanza <b>vagoni</b>. Le carte usate vanno negli scarti, i tuoi vagoni coprono la tratta e i punti arrivano subito. Una tratta per turno, e non serve che sia collegata alle tue.</p>' +
      '<p><b>Sul telefono:</b> tocca la tratta sulla mappa. Si apre una scheda con le carte che userai e i punti; se non puoi prenderla, ti spiega perché.</p>' +
      '<table class="rtab"><tr><th>Spazi</th><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr><tr><th>Punti</th><td>1</td><td>2</td><td>4</td><td>7</td><td>10</td><td>15</td></tr></table>'],
    double: ['Tratte doppie',
      '<p>Tra alcune città ci sono <b>due binari affiancati</b>. Uno stesso giocatore non può prenderli entrambi.</p>' +
      '<p>Con <b>2 o 3 giocatori</b> se ne usa <b>uno solo</b>: appena qualcuno ne prende uno, l’altro resta chiuso per tutti.</p>'],
    ferry: ['Traghetti',
      '<p>Sicilia e Sardegna si raggiungono con i <b>traghetti</b>: tratte grigie sul mare, disegnate su una rotta tratteggiata.</p>' +
      '<p>Gli spazi con il simbolo ' + sw('L') + ' richiedono <b>una locomotiva ciascuno</b>; gli altri spazi si pagano con carte di un solo colore (o altre locomotive).</p>'],
    tickets: ['Biglietti destinazione',
      '<p>Peschi <b>3 biglietti</b> e ne tieni <b>almeno 1</b>; gli altri tornano in fondo al mazzo. I biglietti tenuti non si possono più scartare.</p>' +
      '<p>Un biglietto è <b>arrivato</b> quando le tue tratte formano una linea continua tra le due città, in qualsiasi ordine. A fine partita vale <b>+</b> i suoi punti se è arrivato, <b>−</b> se non lo è.</p>' +
      '<p><b>Sul telefono:</b> le città dei tuoi biglietti sono cerchiate in rosso sulla mappa; quando un biglietto è completato diventano verdi.</p>'],
    end: ['Fine della partita',
      '<p>Quando un giocatore, alla fine del suo turno, ha <b>2 vagoni o meno</b>, parte l’<b>ultimo giro</b>: ognuno, lui compreso, gioca ancora <b>un turno</b>. Poi si contano i punti.</p>'],
    score: ['Il conteggio finale',
      '<ol><li>Punti delle tratte (già presi durante la partita).</li><li>Biglietti: <b>+</b> quelli arrivati, <b>−</b> quelli non arrivati.</li>' +
      '<li><b>Percorso più lungo</b>: +10 a chi ha la linea continua più lunga (si può ripassare da una città, ma ogni tratta conta una volta). In caso di pari merito il bonus va a tutti.</li></ol>' +
      '<p>Vince chi ha più punti. Se c’è pareggio vince chi ha completato più biglietti, poi chi ha il percorso più lungo.</p>'],
    tips: ['Consigli per iniziare',
      '<ul><li>Guarda dove passano i tuoi biglietti e raccogli carte di quei colori.</li><li>Le tratte lunghe valgono molto di più per vagone: 6 spazi = 15 punti.</li>' +
      '<li>Non aspettare troppo: se un avversario prende una tratta che ti serve, dovrai fare il giro largo.</li><li>Pesca nuovi biglietti solo se hai vagoni e tempo per completarli.</li></ul>']
  };
  var ORDER = ['goal', 'setup', 'turn', 'draw', 'claim', 'double', 'ferry', 'tickets', 'end', 'score', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S };
})();
