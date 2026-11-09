/* ===== Sushi Go!: regolamento (sezioni richiamabili dal «?») ===== */
var SGRules = (function () {
  var A = SGArt;
  function row(ks) { return '<span class="rrow">' + ks.map(function (k) { return k === 'b' ? A.card(null, false) : A.flat(k); }).join('') + '</span>'; }
  function item(k, txt) { return '<div class="ali">' + A.flat(k) + '<span><b>' + A.NAME[k] + '</b><small>' + txt + '</small></span></div>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Sei al ristorante di sushi e le carte girano sul nastro: in <b>3 manche</b> prendi una carta alla volta e cerchi di mettere insieme i piatti che fanno <b>più punti</b>. Vince chi ne ha di più alla fine.</p>' + row(['sas', 'sas', 'sas', 'was', 'nsq'])],
    turn: ['Il turno',
      '<p>Tutti giocano <b>insieme</b>: ognuno sceglie <b>di nascosto</b> una carta della propria mano e la conferma. Quando tutti hanno scelto le carte si scoprono e vanno sul tavolo davanti a chi le ha prese.</p>' +
      '<p>Poi ognuno <b>passa il resto della mano</b> al vicino e si sceglie di nuovo, finché le mani non sono vuote. A quel punto si contano i punti della manche.</p>' +
      '<p class="rbox">Carte in mano a ogni manche: 10 con 2 giocatori, 9 con 3, 8 con 4, 7 con 5.</p>'],
    cards: ['Punti delle carte',
      '<div class="alist">' + item('mk2', 'A fine manche chi ha più rotolini (somma dei numeri sulle carte) prende <b>6</b>, il secondo <b>3</b>. A pari merito i punti si dividono (arrotondati per difetto); se al primo posto c’è un pareggio niente secondo posto.') +
      item('tem', 'Ogni <b>coppia</b> vale <b>5</b>. Una tempura da sola non vale niente.') +
      item('sas', 'Ogni <b>tris</b> vale <b>10</b>. Uno o due sashimi da soli non valgono niente.') +
      item('dum', 'Più ne hai, meglio è: 1 → 1, 2 → 3, 3 → 6, 4 → 10, 5 o più → <b>15</b>.') +
      item('nsq', 'Nigiri al calamaro <b>3</b>, al salmone <b>2</b>, all’uovo <b>1</b>.') +
      item('pud', 'Si tengono fino alla fine della partita: chi ha più budini prende <b>+6</b>, chi ne ha meno <b>−6</b> (con 2 giocatori niente −6).') + '</div>'],
    special: ['Wasabi e Bacchette',
      '<div class="alist">' + item('was', 'Il prossimo <b>Nigiri</b> che prendi ci va sopra e vale il <b>triplo</b> (calamaro sul wasabi = 9!). Un wasabi senza nigiri non vale niente.') +
      item('cho', 'Non valgono punti, ma da un turno successivo puoi usarle per prendere <b>2 carte</b> in un colpo solo. Le bacchette poi tornano nella mano che passi.') + '</div>'],
    end: ['Fine della partita',
      '<p>Dopo la terza manche si contano anche i <b>budini</b>. Vince chi ha più punti; a pari merito vince chi ha più budini.</p>' +
      '<p>Variante (la sceglie l’host): nella seconda manche le mani si passano <b>a destra</b> invece che a sinistra.</p>'],
    phone: ['Al telefono',
      '<ul><li>Tocca una carta della tua mano per sceglierla, poi <b>Prendo</b>. Finché gli altri non hanno scelto puoi cambiare idea.</li>' +
      '<li>Se hai le bacchette sul tavolo tocca <b>Usa le bacchette</b> e scegli due carte.</li>' +
      '<li>Sopra vedi cosa hanno preso gli altri: tocca un giocatore per vedere tutto il suo tavolo.</li></ul>'],
    tips: ['Consigli',
      '<ul><li>Guarda cosa passa: se nella mano che ricevi ci sono ancora 2 sashimi, forse il terzo arriverà.</li>' +
      '<li>Prendere una carta anche solo per toglierla a chi la sta collezionando è una mossa valida.</li>' +
      '<li>Un wasabi presto è un investimento; uno nell’ultimo turno è sprecato.</li>' +
      '<li>Non dimenticare i budini: −6 a fine partita fanno male.</li></ul>']
  };
  var ORDER = ['goal', 'turn', 'cards', 'special', 'end', 'phone', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, row: row };
})();
