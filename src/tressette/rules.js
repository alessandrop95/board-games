/* ===== Tressette: regolamento (sezioni richiamabili dal «?») ===== */
var TSRules = (function () {
  var A = ITArt;
  function C(r, s) { return s * 10 + r - 1; }
  function row(cs) { return '<span class="rrow">' + cs.map(function (c) { return A.flat(c); }).join('') + '</span>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Si gioca con le <b>40 carte italiane</b>, dieci a testa. Ci sono due modi di giocare, li sceglie chi apre il tavolo:</p>' +
      '<ul><li><b>A vincere</b>: in 2 (uno contro uno) o in 4 (due coppie, i compagni di fronte). Si cerca di fare <b>più punti</b> possibile: vince chi arriva per primo a 21, 31 o 41.</li>' +
      '<li><b>A perdere</b>: da 3 a 6 giocatori, ognuno per sé. Si cerca di prendere <b>meno punti</b> possibile: quando qualcuno arriva alla soglia, vince chi ne ha meno.</li></ul>'],
    cards: ['Le carte',
      '<p>L’ordine di forza, dalla più alta: <b>3, 2, asso, re, cavallo, fante, 7, 6, 5, 4</b>.</p>' + row([C(3, 1), C(2, 1), C(1, 1), C(10, 1), C(9, 1), C(8, 1), C(7, 1)]) +
      '<div class="rbands">' + [[C(1, 0), 'Asso', '1 punto'], [C(3, 0), 'Tre e due', '1/3 di punto'], [C(10, 0), 'Figure', '1/3 di punto'], [C(7, 0), 'Dal 4 al 7', 'niente']].map(function (x) { return '<span class="rband">' + A.flat(x[0]) + '<small><b>' + x[1] + '</b>' + x[2] + '</small></span>'; }).join('') + '</div>' +
      '<p>L’<b>ultima presa</b> della mano vale un punto in più. Alla fine si contano solo i punti interi: tre terzi fanno un punto, quelli avanzati si perdono. In tutto ci sono 11 punti per mano.</p>'],
    trick: ['La mano',
      '<p>Chi comincia gioca una carta; gli altri, a turno, devono <b>rispondere al seme</b>, cioè giocare una carta dello stesso seme se ce l’hanno. Solo chi non ha quel seme può giocare quello che vuole (si dice «scartare»).</p>' +
      '<p>Non c’è briscola: prende la <b>carta più alta del seme</b> con cui si è cominciato, e chi prende comincia la mano dopo. Le carte che non puoi giocare restano in grigio.</p>'],
    two: ['In due',
      '<p>Uno contro uno, a vincere: oltre alle dieci carte a testa ci sono 20 carte nel <b>tallone</b>. Dopo ogni presa si pesca una carta, prima chi ha preso: le carte pescate <b>si vedono</b>, così sai cosa è entrato nella mano dell’avversario.</p>'],
    pairs: ['In coppia e i segnali',
      '<p>In 4, a vincere, le prese si sommano con quelle del compagno, seduto di fronte. Parlare non si può: si possono solo fare i <b>tre segnali</b> ammessi, quando si comincia la mano, e li sentono tutti:</p>' +
      '<ul><li><b>Busso</b>: «se prendi, torna a questo seme».</li><li><b>Striscio</b>: «ne ho ancora altre di questo seme».</li><li><b>Volo</b>: «era l’ultima che avevo di questo seme».</li></ul>' +
      '<p>Per farlo, quando tocca a te cominciare, scegli la carta e poi tocca il segnale invece di «Gioca». Chi apre il tavolo può anche vietarli.</p>'],
    accuse: ['Gli accusi',
      '<p>A vincere, se all’inizio della mano hai certe combinazioni, le <b>accusi</b> (le dichiari) e valgono punti in più per te o la tua coppia. Si dichiarano da sole quando giochi la tua prima carta:</p>' +
      '<ul><li><b>Napoletana</b>: asso, 2 e 3 dello stesso seme, 3 punti.</li><li><b>Buon gioco</b>: tre 3, tre 2 o tre assi, 3 punti; tutti e quattro, 4 punti.</li></ul>' +
      '<p>Accusando, gli altri sanno che hai quelle carte. Chi apre il tavolo può giocare senza accusi.</p>'],
    lose: ['A perdere',
      '<p>Ognuno gioca per sé e le prese sono un guaio: alla fine della mano ognuno segna i punti che ha preso, e la partita finisce quando qualcuno arriva alla soglia. <b>Vince chi ha meno punti</b>.</p>' +
      '<p>Le regole della mano sono le stesse: bisogna rispondere al seme e prende la carta più alta. Quando non hai il seme è il momento di liberarti degli assi e delle figure.</p>' +
      '<p><b>Cappotto</b>: chi in una mano prende <b>tutti gli 11 punti</b> non ne segna nessuno, e ne regala 11 a ciascuno degli altri. In 3 si gioca senza il 4 di bastoni, in 6 senza i quattro 4.</p>'],
    end: ['La partita',
      '<p>Dopo ogni mano si sommano i punti. <b>A vincere</b> vince chi arriva per primo alla soglia (21, 31 o 41); se ci arrivano insieme con gli stessi punti si gioca un’altra mano. <b>A perdere</b> la partita finisce appena qualcuno arriva alla soglia e vince chi ha meno punti, anche a pari merito.</p>'],
    tips: ['Consigli',
      '<ul><li>Il 3 è la carta più forte: se hai il 3 e il 2 dello stesso seme, prendi due volte di fila.</li><li>Non lasciare l’asso da solo: basta un 2 o un 3 per portartelo via, ed è il punto più pesante.</li><li>Conta le carte uscite: sapere se il 3 di un seme è ancora in giro cambia tutto.</li><li>A perdere tieni qualche carta bassa per stare sotto alle prese degli altri.</li></ul>']
  };
  var ORDER = ['goal', 'cards', 'trick', 'two', 'pairs', 'accuse', 'lose', 'end', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, row: row, ORDER: ORDER };
})();
