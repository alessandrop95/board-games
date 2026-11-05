/* ===== Citadels: regolamento (sezioni richiamabili dal «?» di ogni momento) ===== */
var CTRules = (function () {
  var A = CTArt, E = CTEngine;
  function tok(r) { return '<span class="rtok">' + A.token(r) + '</span>'; }
  function cards(list) { return '<span class="rrow">' + list.map(function (c) { return A.card(c, { mini: true }); }).join('') + '</span>'; }
  function firstOf(n) { for (var i = 0; i < E.DIST.length; i++) if (E.DIST[i].n === n) return { d: i }; return null; }
  function charRow(r) { return '<div class="rchar">' + tok(r) + '<div><b>' + r + ' · ' + E.CH[r].n + '</b><span>' + E.CH[r].p + '</span></div></div>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Ognuno costruisce la sua <b>città</b> con le carte quartiere. Ogni quartiere costa oro e, a fine partita, vale <b>tanti punti quanto il suo costo</b>.</p>' +
      cards([firstOf('Taverna'), firstOf('Chiesa'), firstOf('Castello'), firstOf('Fortezza'), firstOf('Biblioteca')]) +
      '<p class="rbox">Quando qualcuno arriva a <b>7 quartieri</b>, si finisce il round in corso e si contano i punti. Vince chi ne ha di più.</p>'],
    setup: ['All’inizio',
      '<p>Ognuno parte con <b>2 oro</b> e <b>4 carte quartiere</b> in mano. Un giocatore a caso riceve la <b>corona</b> ' + A.icon('crown') + ': nel primo round sceglie il personaggio per primo.</p>' +
      '<p>Si gioca da <b>4 a 7</b> giocatori: se siete in meno, i posti mancanti li prendono i giocatori automatici.</p>'],
    round: ['Il round in due tempi',
      '<ol><li><b>Scelta dei personaggi</b>: a giro, ognuno sceglie <b>in segreto</b> un personaggio. Comincia chi ha la corona.</li>' +
      '<li><b>Chiamata</b>: chi ha la corona chiama i personaggi <b>in ordine, dall’1 all’8</b>. Chi ha il personaggio chiamato lo rivela e gioca il suo turno. Se nessuno lo ha scelto, si passa al successivo.</li></ol>' +
      '<p>Quindi l’ordine dei turni <b>cambia ogni round</b>: non dipende da dove sei seduto ma dal personaggio che hai preso.</p>' +
      '<p>In alto c’è sempre <b>la corte</b>: gli 8 personaggi in fila, con quello chiamato adesso illuminato, quelli che hanno già giocato, e i segni del pugnale (ucciso) e del sacco (derubato).</p>'],
    pick: ['La scelta dei personaggi',
      '<p>All’inizio del round i personaggi vengono mescolati. Alcuni si scartano <b>scoperti</b> (con 4 giocatori due, con 5 uno) e nessuno potrà prenderli; uno si scarta sempre <b>coperto</b>, così nessuno sa con certezza cosa manca. Il Re non si scarta mai scoperto.</p>' +
      '<p>Chi ha la corona guarda i personaggi rimasti, ne prende uno e passa gli altri al vicino, e così via. L’ultimo prende quello che resta (con 7 giocatori può scegliere anche quello scartato coperto).</p>' +
      '<p class="rbox">Il tuo personaggio resta <b>segreto</b> finché non viene chiamato: sul telefono lo vedi solo tu, accanto al tuo nome.</p>'],
    turn: ['Il tuo turno',
      '<p>Quando viene chiamato il tuo personaggio:</p>' +
      '<ol><li><b>Prendi le risorse</b> (obbligatorio, una delle due): <b>2 oro</b> dal tesoro, oppure <b>pesca 2 carte</b>, tienine una e rimetti l’altra sotto il mazzo.</li>' +
      '<li><b>Costruisci</b> (se vuoi): <b>un</b> quartiere della tua mano, pagando il suo costo in oro. Non puoi avere due quartieri con lo stesso nome.</li>' +
      '<li><b>Usa il potere</b> del tuo personaggio, in qualsiasi momento del turno.</li></ol>' +
      '<p>Quando hai finito tocca <b>Fine turno</b>. Se il tuo personaggio guadagna oro dai quartieri (Re, Vescovo, Mercante, Condottiero) e ti dimentichi di incassarlo, lo incasso io per te.</p>'],
    chars: ['Gli 8 personaggi', [1, 2, 3, 4, 5, 6, 7, 8].map(charRow).join('') +
      '<p class="rbox">L’Assassino e il Ladro scelgono un <b>personaggio</b>, non un giocatore: non sanno chi lo ha preso! Se nessuno l’ha scelto, il colpo va a vuoto.</p>'],
    kill: ['Assassino e Ladro, nel dettaglio',
      '<p>' + tok(1) + ' L’<b>Assassino</b> nomina un personaggio: quando verrà chiamato, chi lo ha scelto <b>non si rivela e salta tutto il turno</b>. Lo si scopre solo a fine round.</p>' +
      '<p>' + tok(2) + ' Il <b>Ladro</b> nomina un personaggio (non l’Assassino né quello ucciso): quando quel personaggio si rivela, il Ladro gli prende <b>tutto l’oro</b> che ha in quel momento.</p>' +
      '<p>Se il <b>Re</b> viene ucciso, prende comunque la corona a fine round, come erede.</p>'],
    build: ['Quartieri e colori',
      '<p>Ci sono cinque tipi di quartiere, ognuno col suo colore:</p>' +
      '<div class="rtypes">' + [['n', 'Nobile', 'Maniero'], ['r', 'Religioso', 'Chiesa'], ['c', 'Commerciale', 'Mercato'], ['m', 'Militare', 'Prigione'], ['u', 'Unico', 'Statua']].map(function (t) { return '<span class="rtype t-' + t[0] + '">' + A.card(firstOf(t[2]), { mini: true }) + '<b>' + t[1] + '</b></span>'; }).join('') + '</div>' +
      '<p>Il <b>Re</b>, il <b>Vescovo</b>, il <b>Mercante</b> e il <b>Condottiero</b> guadagnano 1 oro per ogni quartiere del loro colore nella tua città. Conviene quindi scegliere il personaggio che va d’accordo con la tua città!</p>' +
      '<p>Le monete in alto a sinistra di ogni carta indicano quanto costa (e quanti punti vale).</p>'],
    unique: ['I quartieri unici (viola)',
      '<p>Ce n’è uno solo per tipo e ognuno ha un effetto speciale, scritto sulla carta:</p><ul class="runi">' +
      E.DIST.filter(function (d) { return d.t === 'u'; }).map(function (d) { return '<li><b>' + d.n + '</b> (' + d.c + '): ' + d.x + '</li>'; }).join('') + '</ul>'],
    end: ['Fine della partita e punti',
      '<p>Quando una città arriva a <b>7 quartieri</b>, il round si gioca fino in fondo e poi la partita finisce. Punti:</p>' +
      '<ul><li>la somma dei <b>costi</b> di tutti i quartieri della tua città;</li><li><b>+3</b> se hai almeno un quartiere di <b>ognuno dei 5 tipi</b>;</li>' +
      '<li><b>+4</b> a chi ha completato la città <b>per primo</b>, <b>+2</b> agli altri che l’hanno completata;</li><li>i bonus dei quartieri unici.</li></ul>' +
      '<p>In caso di pareggio vince chi aveva il personaggio con il numero più alto nell’ultimo round.</p>' +
      '<p class="rbox">Una città completa è al sicuro: il Condottiero non può più distruggerne i quartieri.</p>'],
    phone: ['Sul telefono',
      '<ul><li>La riga <b>«Adesso»</b> sopra la tua città dice sempre cosa sta succedendo e cosa devi fare tu. Il <b>?</b> accanto apre la regola giusta.</li>' +
      '<li>Quando tocca a te scegliere il personaggio si apre una finestra con le carte disponibili e cosa ti renderebbero.</li>' +
      '<li>Nel tuo turno segui i passi <b>① Risorse ② Costruisci ③ Potere</b>: i bottoni compaiono da soli.</li>' +
      '<li>Tocca una carta della tua mano per vederla in grande e costruirla. Tocca un avversario per vedere la sua città.</li>' +
      '<li>Il <b>registro</b> sotto il tavolo racconta le ultime mosse; nel menu ☰ trovi la storia completa.</li></ul>'],
    tips: ['Consigli',
      '<ul><li>Guarda le città degli altri: chi ha tanti quartieri verdi probabilmente prenderà il Mercante… ed è un buon bersaglio per Assassino e Ladro.</li>' +
      '<li>Se hai poche carte, il Mago o l’Architetto ti rimettono in corsa.</li>' +
      '<li>Chi sta per completare la città è il bersaglio del Condottiero: il Vescovo ti protegge.</li>' +
      '<li>Prova ad avere tutti e 5 i colori: sono 3 punti facili.</li>' +
      '<li>L’oro serve, ma tenerne tanto attira il Ladro: spendilo!</li></ul>']
  };
  var ORDER = ['goal', 'setup', 'round', 'pick', 'turn', 'chars', 'kill', 'build', 'unique', 'end', 'phone', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, tok: tok, cards: cards, firstOf: firstOf };
})();
