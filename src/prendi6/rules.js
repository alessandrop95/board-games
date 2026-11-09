/* ===== Prendi 6!: regolamento (sezioni richiamabili dal «?») ===== */
var P6Rules = (function () {
  var A = P6Art;
  function row(vs) { return '<span class="rrow">' + vs.map(function (v) { return v === 'b' ? A.card(null, false) : A.flat(v); }).join('') + '</span>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Ogni carta ha un numero da 1 a 104 e delle <b>teste di toro</b>: sono punti di penalità. Vince chi, alla fine, ha preso <b>meno teste</b>.</p>' +
      '<div class="rbands">' + [[7, '1 testa'], [15, '2 teste', 'finisce per 5'], [30, '3 teste', 'decine'], [44, '5 teste', 'doppi'], [55, '7 teste']].map(function (x) { return '<span class="rband">' + A.flat(x[0]) + '<small><b>' + x[1] + '</b>' + (x[2] || '') + '</small></span>'; }).join('') + '</div>'],
    turn: ['Il turno',
      '<p>Sul tavolo ci sono <b>4 file</b>. A ogni turno tutti scelgono <b>insieme e di nascosto</b> una carta dalla mano (10 carte a testa). Poi si scoprono e si mettono <b>dalla più bassa alla più alta</b>.</p>' +
      '<p>Ogni carta va in fondo alla fila che finisce con il numero <b>più vicino sotto</b> al suo. Esempio: con le file che finiscono per 12, 25, 47 e 80, il 30 va dopo il 25.</p>'],
    six: ['La sesta carta',
      '<p>Una fila può avere al massimo <b>5 carte</b>. Chi mette la <b>sesta</b> si prende le cinque carte della fila (e le loro teste) e la sua carta diventa la prima della fila.</p>' + row([20, 23, 31, 33, 40, 'b']) +
      '<p class="rbox">Se la tua carta è <b>più bassa</b> dell’ultima carta di tutte le file, non va da nessuna parte: scegli tu <b>una fila da prendere</b> (di solito quella con meno teste) e la tua carta la sostituisce.</p>'],
    end: ['Fine della partita',
      '<p>Quando le mani sono vuote si contano le teste prese nella manche. Si gioca manche dopo manche finché qualcuno arriva a <b>66 teste</b> (o alla soglia scelta dall’host): vince chi ne ha meno.</p>' +
      '<p>Variante <b>tattica</b>: si usano solo le carte da 1 a 10 × i giocatori + 4 (con 4 giocatori, da 1 a 44). Così si sa esattamente quali carte sono in gioco.</p>'],
    phone: ['Al telefono',
      '<ul><li>Tocca una carta della tua mano e poi <b>Gioco</b>. Finché gli altri scelgono puoi cambiare idea.</li>' +
      '<li>Sopra ogni fila vedi le teste che ci sono: la fila con 5 carte ha il sesto posto in rosso.</li>' +
      '<li>Se devi prendere una fila, toccala.</li></ul>'],
    tips: ['Consigli',
      '<ul><li>Una carta appena sopra la fine di una fila corta è sicura; un salto grande verso una fila quasi piena è pericoloso.</li>' +
      '<li>Le carte molto basse sono un’arma: ti fanno scegliere tu quale fila prendere, magari quella con una sola testa.</li>' +
      '<li>Pensa a cosa giocheranno gli altri: se tutti hanno carte alte, la fila più alta si riempirà in fretta.</li></ul>']
  };
  var ORDER = ['goal', 'turn', 'six', 'end', 'phone', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, row: row };
})();
