/* ===== Il Forziere Maledetto: regolamento (sezioni richiamabili dal «?» di ogni fase) ===== */
var FZRules = (function () {
  var A = FZArt, E = FZEngine, I = A.icon;
  function roleRows() {
    return '<table class="rtab"><tr><th>Giocatori</th><th>Ruoli</th><th>Clessidra</th></tr>' + [4, 5, 6, 7, 8].map(function (n) {
      var S = E.SETUP[n], cnt = {}; S.r.forEach(function (r) { cnt[r] = (cnt[r] || 0) + 1; });
      return '<tr><td><b>' + n + '</b></td><td>' + Object.keys(cnt).map(function (r) { return (cnt[r] > 1 ? cnt[r] + '× ' : '') + E.ROLES[r].n; }).join(', ') + '</td><td>' + S.glass + ' ' + I('coin') + '</td></tr>';
    }).join('') + '</table>';
  }
  function cardList() {
    return '<div class="rcards">' + E.ORDER.map(function (t) {
      var id = E.CARDS.map(function (c, i) { return c.t === t ? i : -1; }).filter(function (i) { return i >= 0; })[0];
      return '<div class="rc"><span class="rc-c">' + A.card(id) + '</span><span><b>' + E.T[t].n + '</b> <small>×' + E.T[t].c + ' · ' + A.KN[E.T[t].k] + '</small><br>' + E.T[t].d + '</span></div>';
    }).join('') + '</div>';
  }
  function capList() { return '<div class="rlist">' + E.CAPS.map(function (C) { return '<div class="rl">' + A.capFace(E.CAPS.indexOf(C)) + '<span><b>' + C.n + '</b> <small>parte con la ' + E.SHIPS[C.s].n + '</small><br>' + C.d + '</span></div>'; }).join('') + '</div>'; }
  function shipList() { return '<div class="rships">' + E.SHIPS.map(function (S, i) { return A.shipCard(i); }).join('') + '</div>'; }
  var S = {
    goal: ['Lo scopo',
      '<p>Due flotte, <b>Levante</b> e <b>Ponente</b>, si contendono un forziere maledetto. Al centro c’è il <b>tracciato</b>: il Forziere parte dallo 0 e le due <b>bandiere</b> stanno ai lati, a 5 passi (6 se siete in 6 o più).</p>' +
      '<p>Chi sta con una flotta vuole portare il Forziere <b>fino alla propria bandiera</b>. Il <b>Pirata</b> e i <b>Corsari</b> invece giocano da soli: vogliono <b>dobloni</b> e il Forziere <b>vicino al centro</b>.</p>' +
      '<p class="rbox">I ruoli sono segreti: solo l’<b>Ammiraglio di Levante</b> si mostra subito. Gli altri devi scoprirli da come giocano!</p>'],
    roles: ['I ruoli',
      '<ul><li><b>Ammiraglio</b> e <b>Ufficiali</b> di Levante o di Ponente: giocano in squadra con la propria flotta.</li>' +
      '<li><b>Pirata</b> (in 5 e in 7): gioca da solo.</li><li><b>Corsari</b> di Levante e di Ponente (in 4, 6 e 8): giocano da soli, ma quando affondano il Forziere si muove come se fossero della loro flotta.</li></ul>' + roleRows() +
      '<p>Un ruolo ancora <b>coperto vale 1 doblone</b>: quando ti affondano e lo scopri, quel doblone lo perdi.</p>'],
    turn: ['Il tuo turno',
      '<ol><li><b>Nuova nave</b>: se non hai una nave ne prendi una, tra le 3 scoperte o la prima del mazzo delle navi. Prendi tanti barili quanti ne indica.</li>' +
      '<li><b>Pesca</b> 2 carte.</li><li><b>Gioca</b> tutte le carte che vuoi, ma le carte <b>Attacco</b> al massimo quante sono le <b>munizioni</b> ' + I('ammo') + ' della tua nave.</li>' +
      '<li><b>Fine turno</b>: tieni al massimo 5 carte in mano, le altre le scarti.</li></ol>' +
      '<p class="rbox"><b>Alla deriva</b>: se resti senza carte fuori dal tuo turno ne peschi subito una; se succede nel tuo turno, la peschi appena finisci.</p>'],
    ships: ['Le navi',
      '<p>Ogni nave ha quattro numeri: ' + I('chest') + ' <b>valore</b> (quanti passi fa il Forziere se affonda), ' + I('range') + ' <b>gittata</b> (fino a che distanza spari), ' + I('ammo') + ' <b>munizioni</b> (carte Attacco per turno) e ' + I('barrel') + ' <b>barili</b> (lo scafo: quando finiscono, affondi). Alcune hanno anche un’abilità.</p>' + shipList()],
    cards: ['Le carte',
      '<p>La cornice dice il tipo: <b class="kc atk">Attacco</b> (si gioca nel tuo turno contro una nave, conta nelle munizioni), <b class="kc def">Difesa</b> (si gioca <b>fuori</b> dal tuo turno per annullare quello che ti arriva), <b class="kc act">Azione</b> (fai quello che dice e la scarti), <b class="kc eq">Equipaggiamento</b> (resta davanti a te e funziona sempre; non due uguali) e <b class="kc multi">Attacco o Difesa</b>.</p>' +
      '<p>Il <b>colpo</b> fa perdere 1 barile, più uno per ogni cannone (Cannoniera, navi armate). Si evita con una <b>Virata</b>.</p>' + cardList()],
    distance: ['Distanza e gittata',
      '<p>La distanza tra due giocatori è il numero di posti, girando a destra o a sinistra (si conta il giro più corto), contando <b>solo chi ha una nave</b>. Chi resta senza nave non conta e <b>non può essere bersaglio</b>.</p>' +
      '<p>Puoi colpire una nave se la distanza non supera la <b>gittata</b> della tua nave. La Coffa di vedetta allunga la tua gittata, il Banco di nebbia ti allontana dagli altri.</p>'],
    sink: ['Quando una nave affonda',
      '<ol><li>Si scopre il ruolo del capitano (se era coperto, perde il doblone del ruolo).</li>' +
      '<li>Il Forziere fa tanti passi quanto il <b>valore</b> della nave, verso la bandiera <b>avversaria</b> della flotta del capitano affondato (+1 passo se era un Ammiraglio). Se affonda il <b>Pirata</b>, il Forziere va verso la bandiera di chi l’ha affondato.</li>' +
      '<li><b>Promozione</b>: se affonda un Ammiraglio e c’è già un Ufficiale scoperto della sua flotta, si scambiano i ruoli.</li>' +
      '<li>Chi è affondato tiene la mano e al massimo un Equipaggiamento; al suo turno prenderà una nave nuova.</li>' +
      '<li>Chi l’ha affondato prende <b>1 doblone</b> dalla Clessidra ' + I('hourglass') + '.</li></ol>' +
      '<p>Se affondi durante il tuo turno, il tuo turno finisce subito.</p>'],
    spectre: ['Il Vascello spettrale e il Gorgo',
      '<p>Ogni carta ha un <b>simbolo</b> in basso a sinistra: ' + A.sym('A') + ' Ancora (metà delle carte), ' + A.sym('T') + ' Timone (un quarto), ' + A.sym('X') + ' Teschio e ' + A.sym('P') + ' Perla (un ottavo ciascuno).</p>' +
      '<p>Se il <b>Vascello spettrale</b> ' + I('ghost') + ' è sulla tua nave, all’inizio del turno si scopre la prima carta del mazzo: puoi <b>rispondere</b> mostrando una carta della mano con lo stesso simbolo (resta in mano) e il vascello passa alla nave successiva. Se non rispondi perdi <b>2 barili</b> e il vascello sparisce.</p>' +
      '<p>Quando la <b>Clessidra</b> si svuota arriva il <b>Gorgo</b> ' + I('gorgo') + ': parte dal giocatore dopo quello di turno e funziona allo stesso modo, anche con chi è senza nave, ma rispondere è obbligatorio e <b>chi non sa rispondere fa finire la partita</b>.</p>'],
    deck: ['Il mazzo finito',
      '<p>Ogni volta che il mazzo finisce, un doblone lascia la Clessidra e le due bandiere si avvicinano di un passo al centro. Poi si rimescolano gli scarti.</p>'],
    end: ['Come finisce',
      '<ul><li><b>Ricchezza</b>: il Pirata o un Corsaro con <b>4 dobloni</b> (contando il ruolo coperto) vince subito.</li>' +
      '<li><b>Affondamento</b>: se dopo un affondamento il Forziere arriva su una bandiera (o la supera), vince quella flotta. Se ci arriva in un altro modo, no.</li>' +
      '<li><b>Gorgo</b>: alla prima risposta mancata tutti scoprono il ruolo (chi era coperto prende il suo doblone) e si guarda il Forziere:</li></ul>' +
      '<table class="rtab"><tr><td>2 o più passi verso una bandiera</td><td>vince quella flotta</td></tr><tr><td>al centro (0)</td><td>vince il Pirata; con i Corsari, quello con più dobloni (a parità, Levante)</td></tr>' +
      '<tr><td>1 passo verso una bandiera</td><td>vince il Pirata (o il Corsaro di quella flotta) se ha più dobloni del più povero di quella flotta; altrimenti vince la flotta</td></tr></table>'],
    captains: ['I capitani', '<p>Ognuno ha un capitano con un’abilità sempre attiva e la sua nave di partenza.</p>' + capList()]
  };
  var ORD = ['goal', 'roles', 'turn', 'ships', 'cards', 'distance', 'sink', 'spectre', 'deck', 'end', 'captains'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function toc() { return '<nav class="rtoc">' + ORD.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  function html() { return ORD.map(section).join(''); }
  return { S: S, section: section, toc: toc, html: html };
})();
