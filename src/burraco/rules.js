/* ===== Burraco: regolamento (sezioni richiamabili dal «?») ===== */
var BURules = (function () {
  var A = BUArt;
  function row(cs) { return '<span class="rrow">' + cs.map(function (c) { return A.flat(c); }).join('') + '</span>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Si gioca con <b>due mazzi francesi e 4 jolly</b>, in 2 o in 4 (due coppie, i compagni di fronte). Si calano combinazioni di carte per fare punti; la squadra che arriva per prima ai punti stabiliti (1005, 1505 o 2005) vince.</p>'],
    turn: ['Il turno',
      '<ol><li><b>Pesca</b>: tocca il mazzo per prendere una carta, oppure gli scarti per prenderli <b>tutti</b>.</li>' +
      '<li><b>Cala</b> (se vuoi): scegli 3 o più carte e tocca «Cala», oppure tocca una combinazione della tua squadra per attaccarle.</li>' +
      '<li><b>Scarta</b> una carta: il turno passa.</li></ol>'],
    melds: ['Le combinazioni',
      '<p><b>Scala</b>: almeno 3 carte dello stesso seme in fila (l’asso va sotto il 2 o sopra il re).</p>' + row([4, 5, 6]) +
      '<p><b>Tris</b>: almeno 3 carte dello stesso valore.</p>' + row([9, 22, 61]) +
      '<p>Il <b>jolly</b> e i <b>2</b> (le «pinelle») fanno da matta: al massimo <b>una</b> per combinazione. Un 2 al suo posto in una scala del suo seme è una carta normale.</p>'],
    burraco: ['Burraco e pozzetto',
      '<p>Una combinazione di <b>7 o più carte</b> è un <b>burraco</b>: <b>pulito</b> (senza matte) vale 200 punti, <b>sporco</b> 100.</p>' +
      '<p>Chi della squadra resta per primo <b>senza carte</b> prende il <b>pozzetto</b> (11 carte di riserva): se ci arriva calando continua a giocare, se ci arriva scartando lo usa dal turno dopo.</p>' +
      '<p class="rbox">Si <b>chiude</b> scartando l’ultima carta, ma solo se la squadra ha già preso il pozzetto e ha almeno un burraco: +100 punti.</p>'],
    points: ['I punti',
      '<div class="rbands">' + [[104, 'Jolly', 30], [1, 'Pinella (2)', 20], [0, 'Asso', 15], [12, 'Dall’8 al re', 10], [5, 'Dal 3 al 7', 5]].map(function (x) { return '<span class="rband">' + A.flat(x[0]) + '<small><b>' + x[1] + '</b>' + x[2] + ' punti</small></span>'; }).join('') + '</div>' +
      '<p>A fine mano: le carte calate e i burraco contano in più, le carte rimaste in mano in meno; chi non ha preso il pozzetto perde 100 punti. Se il mazzo finisce, la mano finisce senza chiusura.</p>'],
    tips: ['Consigli',
      '<ul><li>Gli scarti tanti sono una miniera, ma ti riempiono la mano di carte che contano in meno.</li><li>Tieni le pinelle e i jolly per completare: una matta sola per combinazione.</li><li>Prima di chiudere guarda quanti punti ha in mano la squadra avversaria.</li></ul>']
  };
  var ORDER = ['goal', 'turn', 'melds', 'burraco', 'points', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, row: row, ORDER: ORDER };
})();
