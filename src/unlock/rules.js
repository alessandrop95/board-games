/* ===== Unlock!: regolamento (sezioni richiamabili dal «?») ===== */
var URules = (function () {
  function mini(k, n, t) { return '<span class="rmini k-' + k + '"><i>' + n + '</i><span>' + t + '</span></span>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Unlock! è una <b>escape room in carte</b>: giocate <b>tutti insieme</b>, ognuno dal suo telefono, contro il tempo. Dovete risolvere gli enigmi dell’avventura e uscire prima che il timer arrivi a zero.</p>' +
      '<p class="rbox">Non c’è un turno: chiunque può fare qualsiasi cosa in qualsiasi momento. Parlatevi (o usate la chat): ognuno vede le stesse carte, ma ognuno può guardarne una diversa.</p>'],
    cards: ['Le carte',
      '<p>Ogni carta ha un <b>numero</b> (o una lettera, per le stanze) e un colore che dice cosa si può fare:</p><div class="rgrid">' +
      mini('room', 'A', '<b>Stanze</b>: luoghi pieni di numeri da esplorare.') + mini('red', '11', '<b>Rosse</b>: oggetti da unire a una carta blu.') + mini('blue', '4', '<b>Blu</b>: oggetti da unire a una carta rossa.') +
      mini('green', '20', '<b>Verdi</b>: macchine da far funzionare.') + mini('yellow', '9', '<b>Gialle</b>: lucchetti con un codice di 4 cifre.') + mini('grey', '15', '<b>Grigie</b>: risultati, indizi e racconto.') + mini('pen', '27', '<b>Penalità</b>: vi fanno perdere minuti.') + '</div>'],
    reveal: ['Scoprire le carte',
      '<p>Quando su una carta in tavola vedi un <b>numero in un cerchio</b> (o una lettera in un esagono), toccalo: esce la carta con quel numero. Apri una carta toccandola per vederla in grande.</p>' +
      '<p>Alcuni numeri sono <b>nascosti nei disegni</b>: piccoli, mimetizzati, in un angolo buio. Guardate bene ogni illustrazione e toccate il numero quando lo trovate.</p>'],
    combine: ['Unire due oggetti',
      '<p>Una carta <b>rossa</b> si unisce solo a una carta <b>blu</b>: <b>la somma dei due numeri</b> è la carta che esce. Esempio: baule <b>11</b> + chiavetta <b>4</b> = carta <b>15</b>.</p>' +
      '<p>Tocca <b>Unisci</b>, scegli una rossa e una blu, poi conferma. Se l’unione non porta a nulla perdete <b>1 minuto</b>: niente tentativi a caso!</p>'],
    discard: ['Carte da scartare',
      '<p>Quando una carta mostra dei <b>numeri barrati</b>, quelle carte non servono più: escono dal tavolo da sole. Le trovi comunque tra le <b>scartate</b>, se vuoi rileggerle.</p>'],
    mod: ['Modificatori',
      '<p>Alcune carte mostrano un numero blu con un <b>+</b> davanti (per esempio <b>+20</b>): è un <b>modificatore</b>. Si usa come una carta blu: si somma al numero di una carta rossa. Nella barra di <b>Unisci</b> compare da solo, tra gli oggetti blu.</p>'],
    machine: ['Le macchine',
      '<p>Le carte <b>verdi</b> sono macchine: grammofoni, radio, quadri di comando… Aprila e usa i suoi comandi (manopole, pulsanti, tasti). Se la regoli bene, esce una nuova carta.</p>' +
      '<p>Un tentativo sbagliato costa <b>1 minuto</b>. Alcune macchine funzionano solo dopo aver fatto qualcos’altro (per esempio, quando torna la corrente).</p>'],
    code: ['I codici',
      '<p>Le carte <b>gialle</b> sono lucchetti: servono <b>4 cifre</b>. Gli indizi per il codice sono nascosti nelle altre carte: contate, osservate, leggete con attenzione. Un codice sbagliato costa <b>2 minuti</b>.</p>'],
    pen: ['Penalità',
      '<p>Alcune azioni sbagliate fanno uscire una <b>carta penalità</b>: tutti la vedono, il timer perde i minuti scritti sulla carta e la carta sparisce.</p>'],
    hint: ['Indizi',
      '<p>Bloccati? Apri una carta e tocca <b>Indizio</b>: prima un aiuto, poi, se serve, la <b>soluzione</b> per quella carta. Gli indizi chiesti li vedono tutti. Non costano tempo, ma tolgono stelle alla fine.</p>'],
    time: ['Tempo e stelle',
      '<p>Il timer è lo stesso per tutti. Chiunque può metterlo in <b>pausa</b>. Allo zero non si perde: si continua a giocare, ma con meno stelle.</p>' +
      '<p class="rbox">Alla fine avete da <b>1 a 5 stelle</b>: 5 se uscite con più di un sesto del tempo ancora da usare e quasi senza indizi; meno con poco tempo rimasto, oltre lo zero o con molti indizi.</p>'],
    team: ['Giocare in squadra',
      '<ul><li>Dividetevi le carte: uno esplora la stanza, un altro prova le unioni, un altro studia il lucchetto.</li><li>Sotto ogni carta vedi chi la sta guardando.</li><li>Con <b>Segnala</b> fai lampeggiare una carta sui telefoni degli altri: «guardate qui!».</li><li>Le carte nuove hanno l’etichetta <b>NUOVA</b>.</li></ul>'],
    adventures: ['Le avventure',
      '<p><b>La soffitta del nonno</b> (tutorial, 10 minuti) insegna tutte le regole in pochi passi. <b>Abisso</b> (60 minuti) è un’avventura completa a bordo di un sottomarino in avaria.</p>' +
      '<p class="muted">Le avventure di questa app sono originali: usano le regole del gioco Unlock!, ma storie, enigmi e disegni sono stati creati apposta.</p>']
  };
  var ORDER = ['goal', 'cards', 'reveal', 'combine', 'discard', 'mod', 'machine', 'code', 'pen', 'hint', 'time', 'team', 'adventures'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S };
})();
