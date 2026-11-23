/* ===== Dadi e rischio: regolamento (sezioni richiamabili dal «?») ===== */
var DRRules = (function () {
  var S = {
    goal: ['Lo scopo',
      '<p>Al tuo turno tiri <b>5 dadi</b> e accumuli punti nel <b>piatto</b>. Puoi tirare quante volte vuoi, ma se esageri rischi di <b>sballare</b> e perdere tutto il piatto del turno.</p>' +
      '<p>Quando, alla fine di un giro, qualcuno ha raggiunto il <b>traguardo</b> (200 punti, o 100 o 300 come sceglie chi apre il tavolo), vince chi ha <b>più punti</b>.</p>'],
    turn: ['Il turno',
      '<ol><li>Tocca <b>Tira</b>.</li><li>Metti da parte <b>almeno un dado</b> con un valore che <b>non hai ancora</b> messo da parte in questo turno: vale quanto la sua faccia e va nel piatto. Puoi prenderne anche più di uno, purché siano tutti valori diversi.</li>' +
      '<li>Scegli: <b>Tira ancora</b> con i dadi rimasti, oppure <b>Mi fermo</b> e i punti del piatto sono tuoi per sempre.</li></ol>' +
      '<p>Esempio: tiri 6 6 3 2 1. Prendi un 6 (6 punti) e ritiri gli altri 4 dadi. Escono 6 5 5 2: il 6 non vale più, prendi il 5 (piatto 11) e ritiri 3 dadi…</p>'],
    bust: ['Sballare',
      '<p>Se un tiro non mostra <b>nessun valore nuovo</b> (tutti i dadi hanno valori che hai già messo da parte) hai <b>sballato</b>: perdi il piatto del turno e tocca al prossimo.</p>' +
      '<p>Meno dadi ti restano e più valori hai già preso, più il rischio sale. Il telefono te lo mostra prima di tirare.</p>'],
    bonus: ['La fila completa',
      '<p>Se metti da parte <b>5 valori diversi</b> hai completato la fila: <b>+15 punti</b> di bonus e riprendi <b>tutti e 5 i dadi</b>, con la fila di nuovo vuota. Il piatto resta e puoi continuare: il tiro dopo non può sballare!</p>'],
    end: ['La fine',
      '<p>Chi raggiunge il traguardo annuncia l’<b>ultimo giro</b>: chi non ha ancora giocato in questo giro ha un ultimo turno per superarlo. A fine giro vince chi ha più punti; se in testa c’è un pareggio si gioca un altro giro.</p>'],
    tips: ['Consigli',
      '<ul><li>Prendere un solo dado alla volta ti lascia più dadi, quindi meno rischio.</li><li>Con 1 dado e 4 valori già presi sballi 2 volte su 3: di solito conviene fermarsi.</li><li>Prima di fermarti prendi tutti i valori nuovi che puoi: sono punti gratis.</li><li>Se sei indietro rischia di più; se sei in testa incassa spesso.</li></ul>']
  };
  var ORDER = ['goal', 'turn', 'bust', 'bonus', 'end', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, ORDER: ORDER };
})();
