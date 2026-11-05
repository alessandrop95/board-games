/* ===== Flip 7: regolamento (sezioni richiamabili dal «?» di ogni momento) ===== */
var F7Rules = (function () {
  var A = F7Art;
  function row(cs, o) { o = o || {}; return '<span class="rrow' + (o.cls ? ' ' + o.cls : '') + '">' + cs.map(function (c, i) { return '<span class="rc' + (o.hi && o.hi.indexOf(i) >= 0 ? ' hi' : '') + (o.bad && o.bad.indexOf(i) >= 0 ? ' bad' : '') + '">' + A.flat(c) + '</span>'; }).join('') + '</span>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Fare <b>più punti possibile</b>, manche dopo manche. A ogni manche peschi carte numero una alla volta: più ne prendi, più punti fai… ma se peschi un <b>numero che hai già</b>, <b>sballi</b> e non prendi niente.</p>' +
      '<p class="rbox">Vince chi arriva per primo a <b>200 punti</b> (l’host può scegliere 100 o 300). Se alla fine di una manche più giocatori li hanno superati, vince chi ne ha di più.</p>'],
    cards: ['Le carte',
      '<p>Un mazzo di <b>94 carte</b>. I numeri vanno da 0 a 12 e ce ne sono <b>tante copie quanto il valore</b>: un solo 1, due 2, tre 3… e dodici 12 (più un unico 0). I puntini sotto il numero ricordano quante copie ci sono.</p>' +
      row([0, 1, 5, 9, 12]) +
      '<p>I <b>modificatori</b> aggiungono punti (+2, +4, +6, +8, +10) o <b>raddoppiano</b> i numeri (×2). Non fanno mai sballare.</p>' + row(['+4', '+10', 'x2']) +
      '<p>Le <b>azioni</b> (tre copie per tipo): <b>Congela</b>, <b>Flip Three</b> e <b>Seconda possibilità</b>.</p>' + row(['FRZ', 'F3', 'SC'])],
    turn: ['Come si gioca una manche',
      '<p>Il mazziere dà <b>una carta scoperta a testa</b>. Poi, a turno, ognuno sceglie:</p>' +
      '<ul><li><b>PESCA</b>: prendi un’altra carta scoperta.</li><li><b>STOP</b>: ti fermi e metti al sicuro i punti che hai. Per questa manche hai finito.</li></ul>' +
      '<p>Si continua a girare finché qualcuno è ancora in gioco. Le carte si mettono in fila davanti a sé: i numeri in basso, i modificatori sopra.</p>'],
    bust: ['Sballare',
      '<p>Se peschi un numero che hai <b>già davanti</b>, <b>sballi</b>: sei fuori dalla manche e fai <b>0 punti</b>, anche se avevi modificatori.</p>' +
      row([3, 8, 11, 8], { bad: [1, 3] }) +
      '<p>Più numeri diversi hai, più è facile sballare. Occhio ai numeri alti: ce ne sono tante copie!</p>'],
    flip7: ['Flip 7!',
      '<p>Se riesci ad avere <b>7 numeri diversi</b> davanti a te, fai <b>Flip 7</b>: la manche finisce <b>subito per tutti</b> e prendi <b>15 punti in più</b>. Gli altri incassano quello che hanno in quel momento (chi è ancora in gioco non sballa).</p>' +
      row([0, 2, 4, 5, 7, 10, 12], { hi: [0, 1, 2, 3, 4, 5, 6] }) +
      '<p>Lo 0 non vale punti, ma conta come numero per arrivare a sette.</p>'],
    actions: ['Le azioni',
      '<p>Quando peschi un’azione (anche nella prima carta) <b>scegli tu a chi va</b>, tra i giocatori ancora in gioco: anche a te stesso.</p>' +
      '<p>' + A.flat('FRZ') + ' <b>Congela</b>: chi la riceve <b>si ferma</b> subito e incassa i punti che ha. Ottima per bloccare chi sta andando forte… o per salvarti.</p>' +
      '<p>' + A.flat('F3') + ' <b>Flip Three</b>: chi la riceve deve pescare <b>tre carte di fila</b>, una alla volta. Si ferma prima solo se sballa o fa Flip 7. Se tra le tre esce un Congela o un altro Flip Three, si usa <b>dopo</b> (solo se non ha sballato).</p>' +
      '<p>' + A.flat('SC') + ' <b>Seconda possibilità</b>: la tieni davanti a te. Se peschi un doppione, scarti il doppione e questa carta, e <b>resti in gioco</b>. Se ne peschi un’altra quando ne hai già una, va regalata a chi non ne ha (altrimenti si scarta). Alla fine della manche si scarta comunque.</p>' +
      '<p class="rbox">Se sei l’unico ancora in gioco, l’azione va per forza a te.</p>'],
    score: ['I punti della manche',
      '<ol><li>Somma i tuoi <b>numeri</b>.</li><li>Se hai il <b>×2</b>, raddoppia la somma dei numeri.</li><li>Aggiungi i <b>+2…+10</b>.</li><li>Se hai fatto <b>Flip 7</b>, aggiungi <b>15</b>.</li></ol>' +
      '<p><b>Esempio</b>: 3, 8, 11 con ×2 e +4 → (3 + 8 + 11) × 2 + 4 = <b>48 punti</b>.</p>' + row([3, 8, 11, 'x2', '+4']) +
      '<p>Chi sballa fa 0. Chi si ferma o viene congelato incassa tutto.</p>'],
    end: ['Manche dopo manche',
      '<p>La manche finisce quando <b>nessuno è più in gioco</b> (tutti fermi, congelati o sballati) oppure quando qualcuno fa <b>Flip 7</b>. Poi il mazziere passa a sinistra.</p>' +
      '<p>Le carte usate vanno negli scarti e <b>non tornano nel mazzo</b> finché non finisce: solo allora si rimescolano. Ricordarsi cosa è già uscito aiuta!</p>' +
      '<p>Se a fine manche c’è un <b>pari</b> in testa sopra la soglia, si gioca un’altra manche.</p>'],
    phone: ['Sul telefono',
      '<ul><li>Quando tocca a te compaiono i bottoni <b>PESCA</b> e <b>STOP</b>.</li>' +
      '<li>Il <b>rischio</b> accanto ai tuoi punti dice quante probabilità hai di sballare con la prossima carta (conta le carte rimaste nel mazzo).</li>' +
      '<li>Quando peschi un’azione si apre una finestra: tocca il giocatore a cui darla.</li>' +
      '<li>In alto vedi le carte degli altri: toccane uno per vederlo in grande.</li></ul>'],
    tips: ['Consigli',
      '<ul><li>Con pochi numeri il rischio è basso: pesca senza paura.</li>' +
      '<li>Con 4–5 numeri, soprattutto alti, il rischio sale in fretta: valuta lo STOP.</li>' +
      '<li>Congela chi ha tanti punti in tavola, o te stesso se stai rischiando troppo.</li>' +
      '<li>Flip Three è perfetto per chi ha già tanti numeri diversi: tre carte di fila sono un bel pericolo.</li>' +
      '<li>Chi ha la Seconda possibilità può osare di più: tienine conto prima di regalargli un Flip Three.</li></ul>']
  };
  var ORDER = ['goal', 'cards', 'turn', 'bust', 'flip7', 'actions', 'score', 'end', 'phone', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, row: row };
})();
