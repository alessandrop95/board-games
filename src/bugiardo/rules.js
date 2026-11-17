/* ===== Dadi del bugiardo: regolamento (sezioni richiamabili dal «?») ===== */
var LBRules = (function () {
  var S = {
    goal: ['Lo scopo',
      '<p>Ognuno ha <b>5 dadi</b> sotto il bicchiere e vede <b>solo i suoi</b>. A ogni giro si tirano tutti insieme. Chi sbaglia una dichiarazione o un dubbio <b>perde un dado</b>; senza dadi si è fuori.</p>' +
      '<p>Vince <b>l’ultimo che ha ancora dadi</b>.</p>'],
    bid: ['Dichiarare',
      '<p>Al tuo turno dichiari quanti dadi di un valore ci sono <b>in tutto il tavolo</b>, contando anche quelli degli altri: per esempio «quattro 5».</p>' +
      '<p>Chi viene dopo deve <b>alzare</b>: più dadi (qualunque valore), oppure gli stessi dadi con un valore più alto. «quattro 5» → «quattro 6» o «cinque 2». Oppure non ci crede e dice <b>Dubito!</b></p>' +
      '<p>Puoi bluffare quanto vuoi: nessuno vede i tuoi dadi!</p>'],
    doubt: ['Dubito! ed Esatto!',
      '<ul><li><b>Dubito!</b>: si alzano tutti i bicchieri e si contano i dadi. Se ce ne sono <b>almeno</b> quanti dichiarati, perde un dado chi ha dubitato; se sono meno, chi ha dichiarato.</li>' +
      '<li><b>Esatto!</b> (se attivo al tavolo): scommetti che siano <b>proprio</b> quanti dichiarati. Se hai ragione riprendi un dado (fino al numero di partenza), altrimenti ne perdi uno.</li></ul>' +
      '<p>Il giro dopo lo apre chi ha appena perso il dado.</p>'],
    ones: ['Gli 1 sono jolly',
      '<p>Se il tavolo li usa (di solito sì), gli <b>1</b> contano come <b>qualunque valore</b>: in «quattro 5» valgono anche gli 1.</p>' +
      '<ul><li>Non si apre un giro dichiarando gli 1.</li><li>Per passare agli 1 basta <b>metà</b> della quantità (per eccesso): dopo «cinque 4» puoi dire «tre 1».</li><li>Per tornare dagli 1 a un altro valore serve il <b>doppio più uno</b>: dopo «tre 1» almeno «sette 4».</li></ul>'],
    phone: ['Al telefono',
      '<ul><li>In basso ci sono i tuoi dadi: quelli che contano per la dichiarazione attuale sono evidenziati.</li><li>Al tuo turno scegli il valore e quanti dadi con <b>−</b> e <b>+</b>, poi tocca <b>Dichiaro</b>. Il telefono ti propone già la dichiarazione più bassa valida.</li><li>In alto vedi quanti dadi ha ognuno e quanti ce ne sono in tutto: serve per fare i conti!</li></ul>'],
    tips: ['Consigli',
      '<ul><li>Con gli 1 jolly, in media un terzo dei dadi degli altri vale il numero che vuoi; senza jolly, un sesto.</li><li>Esempio: in gioco 20 dadi, tu hai due 5 e un 1. Gli altri 15 dadi ne nascondono circa 5: «otto 5» è una dichiarazione ragionevole.</li><li>Dichiarare un valore che hai è più sicuro, ma ogni tanto bluffa: gli altri ti stanno studiando!</li></ul>']
  };
  var ORDER = ['goal', 'bid', 'doubt', 'ones', 'phone', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, ORDER: ORDER };
})();
