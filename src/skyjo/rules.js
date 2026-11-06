/* ===== Skyjo: regolamento (sezioni richiamabili dal «?» di ogni fase) ===== */
var SKRules = (function () {
  var A = SKArt;
  function row(vs, o) { o = o || {}; return '<span class="rrow' + (o.cls ? ' ' + o.cls : '') + '">' + vs.map(function (v) { return v === null ? '<span class="rgap"></span>' : v === 'b' ? A.card(null, false) : A.flat(v); }).join('') + '</span>'; }
  // mini griglia 3×4 per gli esempi: valori, 'b' = coperta, null = colonna tolta, x = evidenziata
  function grid(cells, hi) {
    return '<span class="rgrid">' + cells.map(function (v, i) { var h = hi && hi.indexOf(i) >= 0 ? ' hi' : ''; return v === null ? '<span class="rgap' + h + '"></span>' : '<span class="rg' + h + '">' + (v === 'b' ? A.card(null, false) : A.flat(v, true)) + '</span>'; }).join('') + '</span>';
  }
  var S = {
    goal: ['Lo scopo',
      '<p>Avere <b>meno punti possibile</b>. Ognuno ha davanti una griglia di 12 carte, quasi tutte coperte: manche dopo manche si cambiano le carte alte con quelle basse (le migliori sono i <b>−2</b>).</p>' +
      '<p class="rbox">La partita finisce alla fine della manche in cui qualcuno arriva a <b>100 punti</b> (l’host può scegliere 50 o 150): vince chi ha il <b>totale più basso</b>.</p>'],
    cards: ['Le carte',
      '<p><b>150 carte</b> con valori da −2 a 12. I colori aiutano a leggere il tavolo a colpo d’occhio:</p>' +
      '<div class="rbands">' + [[-2, '5 carte', 'notte'], [-1, '10 carte', 'notte'], [0, '15 carte', 'nuvole'], [3, '1–4: 10 per valore', 'colline'], [7, '5–8: 10 per valore', 'sole'], [11, '9–12: 10 per valore', 'temporale']].map(function (x) { return '<span class="rband">' + A.flat(x[0]) + '<small><b>' + x[2] + '</b>' + x[1] + '</small></span>'; }).join('') + '</div>'],
    setup: ['All’inizio di ogni manche',
      '<p>Ognuno riceve <b>12 carte coperte</b> in una griglia di <b>3 righe e 4 colonne</b>. Una carta va scoperta sugli scarti, le altre fanno il mazzo.</p>' +
      grid(['b', 7, 'b', 'b', 'b', 'b', 'b', -1, 'b', 'b', 'b', 'b'], [1, 7]) +
      '<p>Tutti insieme, ognuno <b>scopre 2 carte</b> a scelta della propria griglia. Nella prima manche comincia chi ha la <b>somma più alta</b>; nelle manche dopo comincia chi ha chiuso quella precedente.</p>'],
    turn: ['Il tuo turno',
      '<p>Hai due possibilità:</p>' +
      '<ol><li><b>Prendi la carta in cima agli scarti</b> e mettila al posto di una carta della tua griglia (scoperta o coperta). La carta che togli va sugli scarti, scoperta.</li>' +
      '<li><b>Pesca dal mazzo</b> e guardala. Poi scegli:<ul><li>la <b>tieni</b>, al posto di una carta della griglia (che va sugli scarti), oppure</li><li>la <b>scarti</b> e <b>scopri</b> una delle tue carte coperte.</li></ul></li></ol>' +
      '<p class="rbox">La carta presa dagli scarti va <b>sempre</b> tenuta: non si può rimettere giù.</p>'],
    columns: ['Le colonne',
      '<p>Se in una <b>colonna</b> hai <b>3 carte scoperte dello stesso valore</b>, le tre carte se ne vanno sugli scarti e non contano più!</p>' +
      grid([9, 2, 'b', 5, 9, -1, 4, 'b', 9, 'b', 0, 6], [0, 4, 8]) + '<span class="rarrow">→</span>' + grid([null, 2, 'b', 5, null, -1, 4, 'b', null, 'b', 0, 6]) +
      '<p>Funziona anche con le carte alte: tre 12 in colonna sono 36 punti che spariscono. Le righe invece non contano. Le colonne si chiudono durante il gioco: le carte scoperte a fine manche contano tutte.</p>'],
    end: ['Fine della manche',
      '<p>Quando qualcuno ha <b>scoperto tutte le sue carte</b>, la manche sta per finire: <b>ognuno degli altri gioca ancora un turno</b>. Poi tutti scoprono le carte rimaste e si sommano i valori della griglia.</p>' +
      '<p class="rbox"><b>Attenzione:</b> chi ha chiuso la manche deve avere il punteggio <b>più basso di tutti</b> (da solo). Altrimenti i suoi punti della manche <b>raddoppiano</b>, se sono positivi.</p>' +
      '<p><b>Esempio</b>: Ale chiude con 14 punti, ma Bea ne ha 12: Ale prende 28 punti. Se Ale avesse avuto −3, sarebbero rimasti −3.</p>'],
    game: ['Fine della partita',
      '<p>I punti di ogni manche si sommano. Quando, alla fine di una manche, qualcuno ha raggiunto la soglia (<b>100 punti</b>, o quella scelta dall’host), la partita finisce: vince chi ha il <b>totale più basso</b>. A pari totale si vince insieme.</p>' +
      '<p>Se il mazzo finisce, gli scarti (tranne l’ultima carta) vengono mescolati e diventano il nuovo mazzo.</p>'],
    phone: ['Sul telefono',
      '<ul><li><b>Prime due carte</b>: tocca due carte coperte della tua griglia.</li>' +
      '<li><b>Mazzo</b>: toccalo per pescare. La carta pescata compare al centro: poi tocca la carta della griglia da sostituire, oppure tocca <b>Scarta</b> e poi la carta coperta da scoprire.</li>' +
      '<li><b>Scarti</b>: toccali per prendere la carta in cima (si illumina), poi tocca la carta della griglia da sostituire. Ritocca gli scarti per cambiare idea.</li>' +
      '<li>In alto vedi le griglie degli altri: toccane una per vederla in grande.</li>' +
      '<li>Accanto a ogni nome: punti delle carte scoperte e totale della partita.</li></ul>'],
    action: ['Variante Skyjo Action',
      '<p>Si gioca con <b>120 carte</b> (4 da −2, 6 da −1, 6 da 0, 8 per ogni valore da 1 a 12) più <b>8 stelle</b>, e con <b>27 carte Azione</b> (9 tipi, 3 per tipo). Quattro carte Azione stanno <b>scoperte in fila</b> accanto al loro mazzo.</p>' +
      '<div class="rrow">' + A.flat('*') + '<span class="muted" style="align-self:center;margin-left:8px">La <b>stella</b> vale <b>0</b> e fa da <b>jolly</b>: conta come qualsiasi valore per completare colonne e righe.</span></div>' +
      '<ul><li>Quando <b>peschi</b> una stella dal mazzo, la <b>prendi dagli scarti</b> o la <b>scopri</b> (anche all’inizio), puoi prendere una carta Azione: una della fila o quella in cima al mazzo delle Azioni.</li>' +
      '<li>Nel tuo turno, invece di pescare o prendere dagli scarti, puoi <b>prendere una carta Azione</b> oppure <b>giocarne una</b> che hai in mano (non quella presa nello stesso turno). Puoi anche scartarla senza effetto.</li>' +
      '<li>Oltre alle colonne di 3, se ne vanno anche le <b>righe di 4 carte uguali</b>. Colonna di sole stelle: <b>−10</b> punti; riga di sole stelle: <b>−15</b>.</li>' +
      '<li>Quando qualcuno ha chiuso la manche non si giocano e non si prendono più carte Azione.</li></ul>' +
      '<p class="rbox">Ogni carta Azione che hai ancora in mano a fine manche vale <b>+10 punti</b>: giocale (o scartale) prima che sia tardi!</p>' +
      '<p class="muted" style="font-size:14px">La divisione delle carte numerate e delle Azioni è una nostra versione bilanciata: le regole ufficiali non indicano quante carte ci sono di ciascun tipo.</p>'],
    acards: ['Le carte Azione',
      '<div class="alist">' + ['exch', 'swap2', 'draw3', 'look', 'rmall', 'two', 'prot', 'redo', 'steal'].map(function (k) { return '<div class="ali">' + A.acard(k) + '<span><b>' + A.ANAME[k] + '</b><small>' + SKEngine.ACTS[k][1] + '</small></span></div>'; }).join('') + '</div>' +
      '<p class="rbox">Lo <b>Scudo</b> ti protegge da solo: se qualcuno ti prende di mira con Scambio, Spazzata o Furto, lo Scudo si scarta e la sua azione non ti tocca.</p>'],
    elim: ['Variante a eliminazione',
      '<p>Chi, alla fine di una manche, arriva alla soglia (<b>100 punti</b> o quella scelta dall’host) è <b>eliminato</b>: la partita continua senza di lui.</p>' +
      '<p>Si va avanti manche dopo manche finché resta <b>un solo giocatore</b>: è lui a vincere. Se gli ultimi rimasti vengono eliminati tutti nella stessa manche, vince chi ha il totale più basso.</p>' +
      '<p class="rbox">Chi è eliminato resta al tavolo a guardare: vede le griglie degli altri ma non gioca più.</p>'],
    tips: ['Consigli',
      '<ul><li>All’inizio scopri carte in colonne diverse: avrai più informazioni.</li>' +
      '<li>Le carte da 0 e quelle negative sono preziose: se le vedi sugli scarti, prendile.</li>' +
      '<li>Prima di scoprire l’ultima carta, guarda le griglie degli altri: se non sei sicuro di avere meno punti, rischi il raddoppio.</li>' +
      '<li>Una colonna con due carte alte uguali può valere la pena: se esce la terza, le tre spariscono.</li>' +
      '<li>Occhio a cosa scarti: potrebbe completare la colonna del giocatore dopo di te.</li></ul>']
  };
  var ORDER = ['goal', 'cards', 'setup', 'turn', 'columns', 'end', 'game', 'phone', 'tips', 'action', 'acards', 'elim'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, row: row, grid: grid };
})();
