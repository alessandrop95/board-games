/* ===== Tiro alla fune di parole: regolamento (sezioni richiamabili dal «?») ===== */
var FNRules = (function () {
  var S = {
    goal: ['Lo scopo',
      '<p>Due squadre, una <b>griglia di 25 lettere</b> uguale per tutti. Ognuno, dal proprio telefono, cerca parole: ogni parola trovata <b>tira la corda</b> verso la sua squadra, in diretta. Allo scadere del tempo vince il round la squadra che ha tirato di più.</p>' +
      '<p>Si gioca al meglio di 1, 3 o 5 round.</p>'],
    word: ['Comporre le parole',
      '<ul><li>Tocca le lettere una dopo l’altra: ogni lettera deve essere <b>vicina</b> alla precedente (anche in diagonale).</li><li>La stessa casella non si usa due volte nella stessa parola.</li><li>Almeno <b>3 lettere</b>. Poi tocca <b>Invia</b>; per togliere l’ultima lettera tocca la freccia.</li><li>Una parola già trovata da un compagno non conta di nuovo; gli avversari invece possono trovarla anche loro.</li></ul>'],
    points: ['Quanto tira',
      '<div class="rbands"><span class="rband"><b class="pt">1</b><small><b>3 lettere</b></small></span><span class="rband"><b class="pt">2</b><small><b>4 lettere</b></small></span><span class="rband"><b class="pt">3</b><small><b>5 lettere</b></small></span><span class="rband"><b class="pt">5</b><small><b>6 lettere</b></small></span><span class="rband"><b class="pt">8</b><small><b>7 o più</b></small></span></div>'],
    check: ['Il controllo',
      '<p>Molte parole il gioco le conosce e valgono subito. Le altre, a fine round, compaiono nell’elenco: se una parola degli avversari <b>non esiste</b> tocca <b>Contesta</b>. Vota chi non è della squadra: con più «no» che «sì» la parola non tira più.</p>'],
    tips: ['Consigli',
      '<ul><li>Plurali e verbi valgono: se c’è «casa» guarda se c’è anche «case».</li><li>Le parole lunghe tirano molto di più: cercale attorno alle vocali.</li><li>Dividetevi la griglia con i compagni: guardate l’elenco delle parole già trovate.</li></ul>']
  };
  var ORDER = ['goal', 'word', 'points', 'check', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, ORDER: ORDER };
})();
