/* ===== No Grazie!: regolamento (sezioni richiamabili dal «?») ===== */
var NGRules = (function () {
  var A = NGArt;
  function row(vs) { return '<span class="rrow">' + vs.map(function (v) { return v === null ? '<span class="rgap"></span>' : v === 'b' ? A.card(null, false) : A.flat(v); }).join('') + '</span>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Le carte sono <b>regali che nessuno vuole</b>: ogni carta vale <b>i punti scritti sopra</b> e vince chi, alla fine, ha <b>meno punti</b>.</p>' +
      '<p>Per evitare una carta paghi un <b>gettone</b> e dici «No grazie!». Ma i gettoni finiscono… e chi alla fine prende la carta si porta via <b>anche tutti i gettoni</b> che ci sono sopra.</p>' + row([5, 6, 7, 18])],
    cards: ['Le carte e i gettoni',
      '<p>Ci sono le carte dal <b>3 al 35</b>, una per numero. All’inizio se ne tolgono <b>9 a caso</b>, senza guardarle: nessuno sa quali mancano, si scopre solo alla fine.</p>' +
      '<p>Gettoni: <b>11</b> a testa da 3 a 5 giocatori, <b>9</b> con 6 giocatori, <b>7</b> con 7 giocatori. Ogni gettone che ti resta alla fine vale <b>−1 punto</b>. Di solito i gettoni degli altri sono <b>nascosti</b>: l’host può renderli visibili.</p>'],
    turn: ['Il tuo turno',
      '<p>Al centro c’è una carta scoperta. Quando tocca a te puoi:</p>' +
      '<ul><li><b>«No grazie!»</b>: metti uno dei tuoi gettoni sulla carta e tocca al giocatore dopo;</li>' +
      '<li><b>Prendo</b>: prendi la carta e tutti i gettoni che ci sono sopra. Poi giri la carta successiva e decidi di nuovo tu.</li></ul>' +
      '<p class="rbox">Se non hai più gettoni sei <b>costretto</b> a prendere la carta.</p>'],
    runs: ['Le scale',
      '<p>Se hai carte con <b>numeri consecutivi</b> (una scala) conta <b>solo la più bassa</b>:</p>' + row([10, 11, 12, 13]) + '<p>vale solo <b>10</b> punti, non 46!</p>' +
      '<p>Per questo a volte una carta alta conviene: un 24 quando hai già il 23 e il 25 non ti costa niente, anzi ti fa scendere. Ma attenzione: anche gli altri lo sanno, e un buco nella scala la spezza in due.</p>'],
    end: ['Fine della partita',
      '<p>Quando l’ultima carta è stata presa si contano i punti: la <b>più bassa di ogni scala</b> più le carte singole, <b>meno un punto per ogni gettone</b>. Vince chi ha meno punti. Si scoprono anche le 9 carte tolte.</p>' +
      '<p>L’host può scegliere di giocare <b>3 o 5 partite di fila</b>, sommando i punti.</p>'],
    tips: ['Consigli',
      '<ul><li>Le carte basse prese presto con qualche gettone sopra sono un affare.</li>' +
      '<li>Se una carta serve solo a te, lasciala girare: gli altri ci metteranno sopra gettoni prima di toccare a te di nuovo. Ma non esagerare, qualcuno potrebbe prenderla per dispetto!</li>' +
      '<li>Guarda le scale degli altri: una carta che chiude la loro scala è oro per loro.</li>' +
      '<li>Restare senza gettoni è pericolosissimo: chi non può pagare deve prendere tutto.</li></ul>']
  };
  var ORDER = ['goal', 'cards', 'turn', 'runs', 'end', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, row: row };
})();
