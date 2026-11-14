/* ===== Briscola: regolamento (sezioni richiamabili dal «?») ===== */
var BRRules = (function () {
  var A = ITArt;
  function row(cs) { return '<span class="rrow">' + cs.map(function (c) { return A.flat(c); }).join('') + '</span>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Si gioca con le <b>40 carte italiane</b>, in 2 (uno contro uno) o in 4 (due coppie, i compagni seduti di fronte). Alla fine della mano si contano i punti delle carte prese: vince chi ne ha <b>più di 60</b> (su 120).</p>' +
      '<div class="rbands">' + [[0, 'Asso', 11], [2, 'Tre', 10], [9, 'Re', 4], [8, 'Cavallo', 3], [7, 'Fante', 2]].map(function (x) { return '<span class="rband">' + A.flat(x[0]) + '<small><b>' + x[1] + '</b>' + x[2] + ' punti</small></span>'; }).join('') + '</div><p>Le altre carte (2, 4, 5, 6, 7) valgono zero: sono i «lisci».</p>'],
    trick: ['La mano',
      '<p>Ognuno ha 3 carte. La carta scoperta sotto il mazzo è la <b>briscola</b>: il suo seme batte tutti gli altri.</p>' +
      '<p>A turno ognuno gioca una carta. Prende la <b>briscola più alta</b>; se non ci sono briscole, la carta più alta del seme di chi ha cominciato. L’ordine è: asso, tre, re, cavallo, fante, 7, 6, 5, 4, 2. Non c’è obbligo di rispondere al seme.</p>' +
      '<p>Chi prende pesca per primo dal mazzo, poi gli altri, e comincia la mano successiva. L’ultima carta pescata è la briscola scoperta.</p>'],
    pairs: ['In coppia',
      '<p>In 4 i punti delle carte prese si sommano con quelli del compagno. Quando il mazzo è finito i compagni <b>vedono le carte</b> l’uno dell’altro.</p>' +
      '<p>Se l’host lo permette, puoi fare dei <b>segni</b> al compagno (tocca «Segni»): li vede solo lui. Per esempio «Ho l’asso di briscola» o «Ho solo lisci».</p>'],
    end: ['La partita',
      '<p>Si gioca una mano sola o si va avanti finché qualcuno vince 2 (o 3) mani, come sceglie l’host. A 60 punti pari la mano non va a nessuno.</p>'],
    tips: ['Consigli',
      '<ul><li>Non sprecare le briscole per prendere lisci.</li><li>Se la mano è del tuo compagno e dopo di te non gioca nessuno, «carica»: dagli un asso o un tre.</li><li>Conta le briscole uscite: sapere se l’asso è ancora in giro cambia tutto.</li></ul>']
  };
  var ORDER = ['goal', 'trick', 'pairs', 'end', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, row: row, ORDER: ORDER };
})();
