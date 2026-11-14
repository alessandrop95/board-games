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
      '<p>Se una risposta di un’altra squadra non ti convince («Zagarolo è davvero una città?») tocca <b>Contesta</b>: chi non è di quella squadra vota sì o no. Se i <b>no</b> sono più dei sì, la risposta vale 0.</p>' +
      '<p>Quando hai finito tocca <b>Pronto</b>.</p>'],
    points: ['I punti',
      '<div class="rbands"><span class="rband"><b class="pt p20">20</b><small><b>unica</b>solo la tua squadra ha una risposta valida</small></span>' +
      '<span class="rband"><b class="pt p10">10</b><small><b>originale</b>diversa da quelle degli altri</small></span>' +
      '<span class="rband"><b class="pt p5">5</b><small><b>doppione</b>un’altra squadra ha scritto la stessa parola</small></span>' +
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
