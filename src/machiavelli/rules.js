/* ===== Machiavelli: regolamento (sezioni richiamabili dal «?» di ogni fase) ===== */
var MCRules = (function () {
  var A = MCArt, E = MCEngine;
  function C(r, s, d) { return (d || 0) * 52 + s * 13 + (r - 1); }
  function row(cs, bad) { return '<span class="rrow' + (bad ? ' bad' : '') + '">' + cs.map(function (c) { return A.card(c); }).join('') + '</span>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Liberarti per primo di tutte le carte che hai in mano, calandole sul tavolo in <b>combinazioni</b>.</p>' +
      '<p class="rbox">Il bello del Machiavelli: le combinazioni sul tavolo <b>non sono di nessuno</b>. Nel tuo turno puoi smontarle e rimontarle come vuoi, purché alla fine siano tutte valide.</p>'],
    cards: ['Le carte',
      '<p>Si gioca con <b>due mazzi francesi</b> da 52 carte, senza jolly: 104 carte, ognuna presente due volte. Ognuno riceve <b>13 carte</b> (l’host può scegliere 15); le altre formano il mazzo coperto.</p>' +
      '<p>Da 2 a 5 giocatori.</p>'],
    combos: ['Le combinazioni',
      '<p>Ogni combinazione ha <b>almeno 3 carte</b>:</p>' +
      '<ul><li><b>Tris o poker</b>: 3 o 4 carte dello <b>stesso valore</b> e di <b>semi tutti diversi</b>.</li>' + row([C(7, 0), C(7, 1), C(7, 3)]) +
      '<li><b>Scala</b>: 3 o più carte <b>dello stesso seme</b> in fila.</li>' + row([C(4, 2), C(5, 2), C(6, 2), C(7, 2)]) +
      '<li>L’<b>asso</b> sta prima del 2 (A-2-3) oppure dopo il re (Q-K-A), ma non in mezzo: K-A-2 non vale.</li>' + row([C(12, 1), C(13, 1), C(1, 1)]) + '</ul>' +
      '<p>Non valgono: due carte dello stesso seme in un tris, scale con buchi o con la stessa carta due volte.</p>' + row([C(7, 0), C(7, 0, 1), C(7, 2)], true)],
    turn: ['Il tuo turno',
      '<p>Nel tuo turno fai <b>una</b> di queste due cose:</p>' +
      '<ol><li><b>Giochi</b>: metti sul tavolo <b>almeno una carta</b> della tua mano, in combinazioni nuove o attaccandola a quelle che ci sono, e intanto puoi riorganizzare il tavolo come vuoi.</li>' +
      '<li><b>Peschi</b> una carta dal mazzo, e il turno passa.</li></ol>' +
      '<p>Non si può fare entrambe le cose: o giochi o peschi.</p>'],
    manip: ['Riorganizzare il tavolo',
      '<p>Puoi spostare qualunque carta del tavolo da una combinazione all’altra, dividere una scala in due, prendere la quarta carta di un poker per un altro tris… Due regole:</p>' +
      '<ul><li>Le carte del tavolo <b>restano sul tavolo</b>: non puoi riprenderle in mano.</li><li>Alla fine del turno <b>tutte</b> le combinazioni devono essere valide.</li></ul>' +
      '<p><b>Esempio</b>: sul tavolo c’è la scala ' + row([C(3, 1), C(4, 1), C(5, 1), C(6, 1), C(7, 1)]) + ' e hai in mano un altro 5♥: la dividi in ' + row([C(3, 1), C(4, 1), C(5, 1)]) + ' e ' + row([C(5, 1, 1), C(6, 1), C(7, 1)]) + '.</p>' +
      '<p>Se cominci a spostare carte e non riesci a sistemare tutto, tocca <b>Annulla</b>: il tavolo torna com’era e puoi pescare.</p>'],
    phone: ['Sul telefono',
      '<ul><li><b>Trascina</b> una carta (dalla mano o dal tavolo) sulla combinazione dove vuoi metterla. Mentre la trascini, i posti dove sta bene si accendono di <b>verde</b>.</li>' +
      '<li>Oppure <b>tocca</b> una o più carte per selezionarle e poi tocca il posto dove spostarle.</li>' +
      '<li><b>Nuova combinazione</b>: trascina sulla casella tratteggiata. Finché non è completa resta in <b>rosso</b>, e in una combinazione rossa puoi mettere qualsiasi carta.</li>' +
      '<li>Una carta che hai messo in questo turno la puoi riportare in mano trascinandola sulla mano.</li>' +
      '<li><b>Fine turno</b> si accende quando il tavolo è tutto valido e hai giocato almeno una carta. Gli altri vedono in diretta le tue mosse.</li></ul>'],
    draw: ['Pescare e mazzo finito',
      '<p>Se non giochi, peschi una carta. Quando il mazzo finisce, chi non può giocare <b>passa</b>. Se passano tutti di fila, la partita finisce e vince chi ha <b>meno carte</b> in mano (a parità, chi ha meno punti: asso 1, figure 10).</p>'],
    end: ['La fine',
      '<p>Vince chi cala per primo <b>tutte</b> le sue carte. Gli altri si mettono in classifica in base alle carte che hanno ancora in mano.</p>'],
    open36: ['Variante: apertura a 36',
      '<p>Se l’host la attiva, la tua <b>prima</b> giocata deve essere fatta solo con carte tue, senza toccare il tavolo, e le combinazioni che cali devono valere in tutto <b>almeno 36 punti</b> (asso 1, o 11 dopo il re; figure 10; le altre il loro numero). Dopo aver aperto giochi normalmente.</p>'],
    tips: ['Consigli',
      '<ul><li>Guarda il tavolo prima di pescare: spesso una carta si attacca in fondo a una scala o completa un poker.</li><li>Le scale lunghe sono preziose: puoi staccarne la prima o l’ultima carta per farne un’altra combinazione.</li>' +
      '<li>Tieni d’occhio quante carte hanno gli avversari: chi ne ha 2 o 3 sta per chiudere.</li></ul>']
  };
  var ORDER = ['goal', 'cards', 'combos', 'turn', 'manip', 'phone', 'draw', 'end', 'open36', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, row: row };
})();
