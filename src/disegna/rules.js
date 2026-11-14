/* ===== Disegna e indovina: regolamento (sezioni richiamabili dal «?») ===== */
var DGRules = (function () {
  var S = {
    goal: ['Lo scopo',
      '<p>Si gioca <b>a squadre</b>. A turno, una squadra alla volta, uno dei suoi giocatori <b>disegna</b> una parola sul telefono e i suoi <b>compagni</b> la indovinano scrivendo le risposte. Tutti vedono il disegno mentre nasce, anche da lontano.</p>' +
      '<p>Dopo i giri stabiliti vince la squadra con più punti.</p>'],
    draw: ['Disegnare',
      '<ul><li>Quando tocca a te scegli tra una parola <b>facile</b> (1 punto) e una <b>difficile</b> (2 punti).</li>' +
      '<li>Disegna con il dito: puoi cambiare colore e spessore, usare la gomma, annullare l’ultimo tratto o ricominciare.</li>' +
      '<li><b>Niente lettere né numeri</b> nel disegno!</li>' +
      '<li>Se la parola è impossibile tocca <b>Passo</b>: si va subito al furto.</li></ul>'],
    guess: ['Indovinare',
      '<ul><li>Scrivi la risposta e invia: puoi provare quante volte vuoi. Le maiuscole, gli accenti e il plurale non contano, e un errore di battitura nelle parole lunghe si perdona.</li>' +
      '<li>Se ci vai vicino compare <b>«quasi!»</b>.</li>' +
      '<li>Indovinata entro metà del tempo: <b>+1 punto</b> in più.</li></ul>'],
    steal: ['Il furto',
      '<p>Se il tempo finisce e i compagni non hanno indovinato, le <b>altre squadre</b> hanno 12 secondi per scrivere la parola: la prima che indovina ruba i punti. Per questo conviene guardare bene anche i disegni degli avversari!</p>'],
    tips: ['Consigli',
      '<ul><li>Disegna prima la forma grande, poi i dettagli.</li><li>Le parole composte si possono disegnare a pezzi.</li><li>Leggi le risposte sbagliate dei compagni: ti dicono cosa stanno capendo.</li></ul>']
  };
  var ORDER = ['goal', 'draw', 'guess', 'steal', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S };
})();
