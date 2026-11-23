/* ===== Nomi, cose, città: regolamento (sezioni richiamabili dal «?») ===== */
var NCRules = (function () {
  var S = {
    goal: ['Lo scopo',
      '<p>Esce una <b>lettera</b> e ci sono <b>6 categorie</b> (nome, cosa, città, animale…). Per ognuna bisogna scrivere una parola che <b>comincia con quella lettera</b>, prima che finisca il tempo.</p>' +
      '<p>Si gioca <b>a squadre</b>: ogni squadra ha un foglio solo, che tutti i compagni riempiono insieme dal proprio telefono. Vedi in diretta cosa scrivono gli altri: dividetevi le caselle! Si può giocare anche ognuno per sé.</p>'],
    turn: ['Scrivere',
      '<ul><li>Tocca una casella e scrivi. La parola arriva subito ai compagni.</li>' +
      '<li>Se un compagno ha già scritto in una casella puoi correggerla: vale l’ultima parola scritta.</li>' +
      '<li>Gli articoli non contano: «L’Aquila» comincia con la A.</li>' +
      '<li>Quando la vostra squadra ha riempito <b>tutte</b> le caselle potete dire <b>Stop!</b>: alle altre squadre restano 10 secondi.</li></ul>'],
    check: ['Il controllo',
      '<p>Finito il tempo si vedono le risposte di tutti. Quelle vuote o che non cominciano con la lettera non valgono.</p>' +
      '<p>Se una risposta di un’altra squadra non ti convince («Zagarolo è davvero una città?») tocca <b>Contesta</b>: chi non è di quella squadra vota: <b>vale</b>, <b>vale solo 5 punti</b> (non è sbagliata, ma è un po’ tirata) oppure <b>non vale</b>. Chi contesta parte da «non vale» e può cambiare voto come tutti. Accanto alla risposta si vede chi l’ha contestata e come ha votato ognuno.</p>' +
      '<p>Decide il voto di mezzo: se i <b>no</b> sono più della metà la risposta vale 0, se lo sono i «no» e i «5» insieme vale 5, altrimenti vale normalmente. A parità tra due scelte vince la più generosa.</p>' +
      '<p>Quando hai finito tocca <b>Pronto</b>.</p>'],
    points: ['I punti',
      '<div class="rbands"><span class="rband"><b class="pt p20">20</b><small><b>unica</b>solo la tua squadra ha una risposta valida</small></span>' +
      '<span class="rband"><b class="pt p10">10</b><small><b>originale</b>diversa da quelle degli altri</small></span>' +
      '<span class="rband"><b class="pt p5">5</b><small><b>doppione</b>un’altra squadra ha scritto la stessa parola, oppure il voto l’ha ridotta a 5</small></span>' +
      '<span class="rband"><b class="pt p0">0</b><small><b>non vale</b>vuota, lettera sbagliata o bocciata</small></span></div>' +
      '<p>Le parole uguali si riconoscono anche con un errore di battitura. Dopo le manche stabilite dall’host vince la squadra con più punti.</p>'],
    tips: ['Consigli',
      '<ul><li>Dividetevi le categorie senza parlarvi: guarda quali caselle sono ancora vuote.</li>' +
      '<li>Le parole strane valgono di più (nessuno le scrive), ma rischiano la contestazione.</li>' +
      '<li>Una parola qualsiasi è meglio di una casella vuota: dire Stop presto mette fretta agli altri.</li></ul>']
  };
  var ORDER = ['goal', 'turn', 'check', 'points', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S };
})();
