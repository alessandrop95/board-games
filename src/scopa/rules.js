/* ===== Scopa: regolamento (sezioni richiamabili dal «?») ===== */
var SCRules = (function () {
  var A = ITArt;
  function row(cs) { return '<span class="rrow">' + cs.map(function (c) { return A.flat(c); }).join('') + '</span>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Si gioca con le <b>40 carte italiane</b>, in 2 o in 4 (due coppie, i compagni seduti di fronte). Si prendono carte dalla tavola e a fine mano si contano i punti: vince chi arriva per primo a <b>11</b> (o 21).</p>'],
    take: ['Prendere',
      '<p>Ognuno ha 3 carte e in tavola ce ne sono 4 scoperte. A turno si gioca una carta:</p>' +
      '<ul><li>se in tavola c’è una carta dello <b>stesso valore</b>, la prendi (una sola);</li>' +
      '<li>altrimenti puoi prendere <b>più carte che sommate</b> fanno il valore della tua (fante 8, cavallo 9, re 10);</li>' +
      '<li>se non prendi niente, la tua carta resta in tavola.</li></ul>' +
      '<p>Esempio: con il <b>7</b> prendi il 3 e il 4.</p>' + row([2, 13]) +
      '<p class="rbox">Se porti via <b>tutte</b> le carte dalla tavola fai <b>scopa</b>: un punto in più (non vale all’ultima giocata della mano).</p>'],
    points: ['I punti della mano',
      '<ul><li><b>Carte</b>: un punto a chi ne ha prese più di 20.</li><li><b>Denari</b>: un punto a chi ha più di 5 carte di denari.</li>' +
      '<li><b>Settebello</b> (il 7 di denari): un punto.</li><li><b>Primiera</b>: un punto a chi ha la primiera migliore (il miglior 7, 6, asso… di ogni seme).</li><li>Un punto per ogni <b>scopa</b>.</li></ul>' + row([16]) +
      '<p>Le carte rimaste in tavola alla fine vanno a chi ha preso per ultimo.</p>'],
    phone: ['Al telefono',
      '<ul><li>Tocca una tua carta: le carte della tavola che puoi prendere si illuminano.</li><li>Se ci sono più modi di prendere, tocca le carte della tavola che vuoi.</li><li>Tocca di nuovo la carta (o «Gioca») per giocarla.</li></ul>'],
    scopone: ['Scopone scientifico',
      '<p>Solo in 4: <b>10 carte a testa</b> e tavola vuota all’inizio. Le regole delle prese e dei punti sono le stesse.</p>'],
    tips: ['Consigli',
      '<ul><li>Non lasciare in tavola carte che sommate fanno 10 o meno: l’avversario potrebbe fare scopa.</li><li>I 7 contano doppio: per la primiera e per il settebello.</li><li>Ricorda quali carte sono uscite.</li></ul>']
  };
  var ORDER = ['goal', 'take', 'points', 'phone', 'scopone', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, row: row, ORDER: ORDER };
})();
