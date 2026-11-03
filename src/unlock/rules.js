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
      '<p>Tocca <b>Unisci</b>, scegli una rossa e una blu, poi conferma. Se l’unione non porta a nulla perdete tempo (1 minuto, di più nelle avventure difficili): niente tentativi a caso!</p>'],
    discard: ['Carte da scartare',
      '<p>Quando una carta mostra dei <b>numeri barrati</b>, quelle carte non servono più: escono dal tavolo da sole. Le trovi comunque tra le <b>scartate</b>, se vuoi rileggerle.</p>'],
    mod: ['Modificatori',
      '<p>Alcune carte mostrano un numero blu con un <b>+</b> davanti (per esempio <b>+20</b>): è un <b>modificatore</b>. Si usa come una carta blu: si somma al numero di una carta rossa. Nella barra di <b>Unisci</b> compare da solo, tra gli oggetti blu.</p>'],
    machine: ['Le macchine',
      '<p>Le carte <b>verdi</b> sono macchine: grammofoni, radio, quadri di comando… Aprila e usa i suoi comandi (manopole, pulsanti, tasti). Se la regoli bene, esce una nuova carta.</p>' +
      '<p>Alcune macchine vanno azionate premendo i comandi <b>nell’ordine giusto</b>. Un tentativo sbagliato costa tempo. Alcune macchine funzionano solo dopo aver fatto qualcos’altro (per esempio, quando torna la corrente).</p>'],
    code: ['I codici',
      '<p>Le carte <b>gialle</b> sono lucchetti: servono <b>4 cifre</b>. Gli indizi per il codice sono nascosti nelle altre carte: contate, osservate, leggete con attenzione. Un codice sbagliato costa <b>2 minuti</b> (di più nelle avventure difficili).</p>'],
    pen: ['Penalità',
      '<p>Alcune azioni sbagliate fanno uscire una <b>carta penalità</b>: tutti la vedono, il timer perde i minuti scritti sulla carta e la carta sparisce.</p>'],
    search: ['Numeri da calcolare',
      '<p>Nelle avventure più difficili alcune carte non hanno un numero scritto da nessuna parte: il numero si <b>deduce</b> mettendo insieme gli indizi (un registro, un biglietto, un muro di scritte…).</p>' +
      '<p>Quando pensate di averlo trovato, toccate <b>Cerca</b> e scrivete il numero. Se la carta esiste e ci sono gli indizi per trovarla, esce; altrimenti perdete tempo. Niente numeri a caso!</p>'],
    hint: ['Indizi',
      '<p>Bloccati? Apri una carta e tocca <b>Indizio</b>: prima un aiuto, poi, se serve, la <b>soluzione</b> per quella carta. Gli indizi chiesti li vedono tutti e tolgono stelle alla fine.</p>' +
      '<p class="rbox">Nelle avventure difficili gli indizi sono <b>contati</b> e <b>costano anche tempo</b>: al livello 3 ne avete <b>2</b> in tutto, al livello 4 <b>uno solo</b> (anche la soluzione di una carta conta come un indizio). Finiti quelli, i pulsanti degli indizi si bloccano.</p>'],
    time: ['Tempo e stelle',
      '<p>Il timer è lo stesso per tutti. Chiunque può metterlo in <b>pausa</b>. Le penalità tolgono minuti subito.</p>' +
      '<p class="rbox"><b>Allo zero avete perso:</b> l’avventura finisce e va <b>ricominciata da capo</b>, con tutte le carte di nuovo coperte e il tempo pieno. Lo stesso succede se una penalità vi porta a zero.</p>' +
      '<p>Se uscite in tempo avete da <b>1 a 5 stelle</b>: 5 se vi resta più di un sesto del tempo e quasi senza indizi; meno con poco tempo rimasto o con molti indizi.</p>'],
    team: ['Giocare in squadra',
      '<ul><li>Dividetevi le carte: uno esplora la stanza, un altro prova le unioni, un altro studia il lucchetto.</li><li>Sotto ogni carta vedi chi la sta guardando.</li><li>Con <b>Segnala</b> fai lampeggiare una carta sui telefoni degli altri: «guardate qui!».</li><li>Le carte nuove hanno l’etichetta <b>NUOVA</b>.</li></ul>'],
    adventures: ['Le avventure',
      '<p>La difficoltà va da <b>1 a 4</b>:</p><ul><li><b>La soffitta del nonno</b> (1/4, tutorial, 10 minuti) insegna tutte le regole in pochi passi.</li><li><b>Abisso</b> (2/4, 60 minuti): un sottomarino in avaria.</li>' +
      '<li><b>Espresso di Mezzanotte</b> (3/4, 60 minuti): un treno del 1928 lanciato verso un ponte crollato. Enigmi da incrociare tra più carte, numeri da calcolare, errori e indizi che costano di più.</li>' +
      '<li><b>Il teatro dell’illusionista</b> (3/4, 60 minuti): Milano 1908, un mago chiuso in una cassa che si riempie d’acqua. Carte segnate, luci di scena, un cifrario segreto e due numeri da trovare con Cerca.</li>' +
      '<li><b>La tomba di Neferka</b> (4/4, estremo, 60 minuti): sepolti vivi in una tomba egizia. Geroglifici, numeri egizi, stelle e trappole; ogni errore costa caro.</li>' +
      '<li><b>Stazione Polare</b> (4/4, estremo, 60 minuti): Svalbard 1958, un aereo nella tormenta che non vede la pista. Morse, una mappa che inganna, dati falsi, carburanti da non confondere e il vento da leggere.</li></ul>' +
      '<p class="muted">Le avventure di questa app sono originali: usano le regole del gioco Unlock!, ma storie, enigmi e disegni sono stati creati apposta.</p>']
  };
  var ORDER = ['goal', 'cards', 'reveal', 'combine', 'discard', 'mod', 'machine', 'code', 'search', 'pen', 'hint', 'time', 'team', 'adventures'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S };
})();
