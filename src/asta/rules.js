/* ===== Asta lampo: regolamento (sezioni richiamabili dal «?») ===== */
var ALRules = (function () {
  var S = {
    goal: ['Lo scopo',
      '<p>Si mettono all’asta <b>20 lotti</b>, uno alla volta: gemme da collezionare e qualche maledizione da evitare. Ognuno parte con <b>20 monete</b>.</p>' +
      '<p>A ogni lotto <b>tutti offrono in segreto e nello stesso momento</b>: non c’è niente da dire agli altri, solo da indovinare quanto offriranno. Alla fine vince chi ha <b>più punti</b>.</p>'],
    bid: ['Le offerte',
      '<ul><li>Scegli quante monete offrire (anche 0) e tocca <b>Offro</b>. Finché gli altri non hanno offerto puoi cambiare idea.</li>' +
      '<li>Hai pochi secondi: chi non offre in tempo offre 0.</li>' +
      '<li>Quando hanno offerto tutti, le offerte si scoprono insieme.</li></ul>'],
    gem: ['Le gemme',
      '<p>Vince l’<b>offerta più alta</b>: paga alla banca e prende il lotto.</p>' +
      '<p>Se due o più giocatori sono <b>pari in testa</b>, nessuno vince e nessuno paga: la gemma resta sul banco e al lotto dopo se ne aggiunge un’altra. Il lotto <b>cresce</b> finché qualcuno non lo vince da solo!</p>'],
    curse: ['Le maledizioni',
      '<p>Una maledizione toglie punti (da −2 a −5). La prende chi offre <b>meno</b> di tutti, che però <b>incassa le offerte</b> di tutti gli altri.</p>' +
      '<p>Gli altri pagano quello che hanno offerto, quindi: offri abbastanza per non essere l’ultimo, ma non troppo. A parità tra i più bassi la prende chi ha più monete.</p>'],
    points: ['I punti',
      '<ul><li><b>Gemme</b>: il loro valore (da 1 a 4).</li>' +
      '<li><b>Maggioranze</b>: per ogni colore, chi ha il totale più alto prende <b>+5</b> (+2 a testa se pari).</li>' +
      '<li><b>Collezioni</b>: <b>+4</b> per ogni gruppo di 4 gemme di colori diversi.</li>' +
      '<li><b>Maledizioni</b>: i loro punti negativi.</li>' +
      '<li><b>Monete</b>: 1 punto ogni 2 monete rimaste.</li></ul>' +
      '<p>A parità di punti vince chi ha più monete.</p>'],
    tips: ['Consigli',
      '<ul><li>Una gemma vale di più se ti dà una maggioranza o completa una collezione: guarda le collezioni degli altri.</li>' +
      '<li>Le monete avanzate valgono solo mezzo punto: spenderle bene conviene, sprecarle no.</li>' +
      '<li>Offrire lo stesso numero di un altro fa saltare il lotto: a volte è proprio quello che vuoi.</li>' +
      '<li>Tieni qualche moneta per le maledizioni: chi resta a zero se le prende tutte.</li></ul>']
  };
  var ORDER = ['goal', 'bid', 'gem', 'curse', 'points', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, ORDER: ORDER };
})();
