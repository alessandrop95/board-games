/* ===== Cabo: regolamento (sezioni richiamabili dal «?» di ogni fase) ===== */
var CBRules = (function () {
  var A = CBArt;
  function row(vs) { return '<span class="rrow">' + vs.map(function (v) { return v === null ? '<span class="rgap"></span>' : v === 'b' ? A.card(null, false) : A.flat(v); }).join('') + '</span>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Davanti a te ci sono <b>4 carte coperte</b>. Vince chi, alla fine, ha <b>meno punti</b>: ogni carta vale il suo numero.</p>' +
      '<p>Il bello è che le tue carte <b>non le vedi</b>: all’inizio ne guardi due e poi devi <b>ricordartele</b>. Con le carte giuste puoi sbirciarne altre, spiare quelle degli altri e scambiarle.</p>' + row(['b', 3, 'b', 0])],
    cards: ['Le carte',
      '<p>52 carte: due <b>0</b>, quattro per ogni valore da <b>1 a 12</b>, due <b>13</b>.</p>' +
      '<div class="rbands">' + [[0, 'perla', '2 carte'], [3, 'laguna', '1–4'], [6, 'mare aperto', '5–8'], [10, 'burrasca', '9–12'], [13, 'kraken', '2 carte']].map(function (x) { return '<span class="rband">' + A.flat(x[0]) + '<small><b>' + x[1] + '</b>' + x[2] + '</small></span>'; }).join('') + '</div>' +
      '<p>Le carte da 7 a 12 hanno un <b>potere</b> (il nastro in basso), che si usa solo quando le <b>peschi dal mazzo e le scarti</b>:</p>' +
      '<ul class="pw"><li>' + A.picon('peek') + '<b>7 e 8 · Sbircia</b>: guardi una delle tue carte coperte.</li><li>' + A.picon('spy') + '<b>9 e 10 · Spia</b>: guardi una carta di un altro giocatore.</li><li>' + A.picon('trade') + '<b>11 e 12 · Scambia</b>: scambi una tua carta con una di un altro, senza guardarle.</li></ul>'],
    setup: ['Inizio della manche',
      '<p>Ognuno riceve 4 carte coperte in fila. Prima di cominciare <b>tocca due delle tue carte</b>: le vedi per qualche secondo, solo tu. Poi tornano coperte: tienile a mente!</p>' +
      '<p class="rbox">Le carte non cambiano mai posto nella fila: ricordati <b>quale posto</b> vale cosa.</p>'],
    turn: ['Il tuo turno',
      '<p>Nel tuo turno fai <b>una</b> di queste tre cose:</p>' +
      '<ol><li><b>Peschi dal mazzo</b> e guardi la carta (solo tu). Poi o la <b>scarti</b> (e, se è dal 7 al 12, puoi usarne il potere), o la <b>tieni</b> al posto di una o più carte della tua fila: quelle vanno negli scarti, scoperte.</li>' +
      '<li><b>Prendi la carta in cima agli scarti</b> e la metti al posto di una o più carte della tua fila. Questa carta resta <b>scoperta</b>: la vedono tutti.</li>' +
      '<li><b>Chiami «Cabo»</b> se pensi di avere meno punti di tutti: gli altri giocano ancora un turno e poi si contano i punti.</li></ol>'],
    multi: ['Scartare più carte insieme',
      '<p>Quando metti la carta nuova nella fila puoi scegliere <b>più carte che pensi siano uguali</b> (per esempio due 9). Si girano:</p>' +
      '<ul><li>se sono <b>davvero tutte uguali</b> vanno tutte negli scarti e al loro posto resta solo la carta nuova: hai <b>una carta in meno</b>!</li>' +
      '<li>se <b>non sono uguali</b> restano al loro posto, ma <b>scoperte</b>, e la carta nuova si aggiunge <b>in fondo</b> alla fila. Se ci hai provato con 3 o più carte, peschi anche una <b>carta di penalità</b> coperta.</li></ul>'],
    end: ['Cabo e fine della manche',
      '<p>Chi chiama <b>Cabo</b> non gioca più in quella manche; gli altri fanno un ultimo turno. Poi si girano tutte le carte e ognuno somma le sue.</p>' +
      '<ul><li>Chi ha chiamato Cabo con il punteggio <b>più basso</b> (anche a pari merito) prende <b>0 punti</b>.</li>' +
      '<li>Se invece qualcuno ha meno di lui, prende la sua somma <b>più 10</b> di penalità.</li>' +
      '<li>Gli altri prendono la loro somma.</li></ul>' +
      '<p>La manche finisce anche se il <b>mazzo si esaurisce</b>: si contano i punti senza nessun Cabo.</p>' +
      '<p class="rbox"><b>Kamikaze!</b> Chi finisce la manche con esattamente <b>due 12 e due 13</b> (e nient’altro) prende 0 punti e tutti gli altri ne prendono <b>50</b>.</p>'],
    game: ['Fine della partita',
      '<p>Si gioca manche dopo manche. La partita finisce quando qualcuno <b>supera i 100 punti</b>: vince chi ha il totale <b>più basso</b> (a parità, chi ha fatto meno punti nell’ultima manche).</p>' +
      '<p class="rbox">Chi arriva <b>esattamente a 100</b> scende a 50 (una sola volta per partita). La manche dopo comincia chi ha fatto meno punti.</p>'],
    phone: ['Al telefono',
      '<ul><li>Le carte che guardi si girano solo sul tuo telefono per qualche secondo. Con la memoria <b>classica</b> poi tornano coperte e resta solo un occhio sulle carte che hai già visto; con la memoria <b>facile</b> il loro valore resta scritto in piccolo, solo per te.</li>' +
      '<li>Per mettere una carta nella fila: tocca una o più carte della tua fila e poi <b>Scambia</b>.</li>' +
      '<li>Per scartare la carta pescata tocca gli <b>scarti</b>; se ha un potere te lo chiede subito.</li>' +
      '<li>Tocca un avversario per vedere la sua fila più grande.</li></ul>'],
    tips: ['Consigli',
      '<ul><li>Gli 0 e le carte basse sono preziosi: se ne vedi uno negli scarti pensaci.</li>' +
      '<li>Ricordati anche le carte degli altri: quelle che spii, quelle che scambiano e quelle che restano scoperte.</li>' +
      '<li>Sbirciare all’inizio della manche conviene: meno carte non conosci, più puoi rischiare un Cabo.</li>' +
      '<li>Scambiare un tuo 12 con una carta a caso di chi sta vincendo spesso fa bene a te e male a lui.</li>' +
      '<li>Chiamare Cabo troppo presto costa caro: +10. Ma aspettare troppo lascia agli altri il tempo di migliorare.</li></ul>']
  };
  var ORDER = ['goal', 'cards', 'setup', 'turn', 'multi', 'end', 'game', 'phone', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, row: row };
})();
