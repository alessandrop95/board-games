/* ===== Disegna e indovina: regolamento (sezioni richiamabili dal «?») ===== */
var DGRules = (function () {
  var S = {
    goal: ['Lo scopo',
      '<p>Si gioca <b>a squadre</b>. A turno, una squadra alla volta, uno dei suoi giocatori <b>disegna</b> una parola sul telefono e i suoi <b>compagni</b> la indovinano scrivendo le risposte. Tutti vedono il disegno mentre nasce, anche da lontano.</p>' +
      '<p>Dopo i giri stabiliti vince la squadra con più punti.</p>'],
    draw: ['Disegnare',
      '<ul><li>Quando tocca a te scegli tra una parola <b>facile</b> (1 punto) e una <b>difficile</b> (2 punti).</li>' +
      '<li>Disegna con il dito: puoi cambiare colore e spessore, usare la gomma, annullare l’ultimo tratto o ricominciare.</li>' +
      '<li><b>Niente lettere né numeri</b> nel disegno!</li>' +
      '<li>Se la parola è impossibile tocca <b>Passo</b>: si va subito al furto.</li></ul>'],
    guess: ['Indovinare',
      '<ul><li>Scrivi la risposta e invia: puoi provare quante volte vuoi. Le maiuscole, gli accenti e il plurale non contano, e un errore di battitura nelle parole lunghe si perdona.</li>' +
      '<li>Se ci vai vicino compare <b>«quasi!»</b>.</li>' +
      '<li>Indovinata entro metà del tempo: <b>+1 punto</b> in più.</li></ul>'],
    steal: ['Il furto',
      '<p>Se il tempo finisce e i compagni non hanno indovinato, le <b>altre squadre</b> hanno 12 secondi per scrivere la parola: la prima che indovina ruba i punti. Per questo conviene guardare bene anche i disegni degli avversari!</p>'],
    modes: ['Le modalità',
      '<p>Chi apre il tavolo sceglie come si gioca:</p><ul>' +
      '<li><b>A squadre</b>: quella classica, con il furto.</li>' +
      '<li><b>Tutti contro tutti</b>: niente squadre, vedi sotto.</li>' +
      '<li><b>Staffetta</b>: la penna passa di mano ogni 10 secondi.</li>' +
      '<li><b>Indovina tu per me</b>: chi disegna non sa la parola, ha solo 3 aiuti.</li>' +
      '<li><b>Telefono senza fili</b>: catene di disegni e scritte, tutti insieme.</li></ul>'],
    ffa: ['Tutti contro tutti',
      '<p>Niente squadre: ognuno gioca per sé. A turno ogni persona disegna e <b>tutti gli altri</b> provano a indovinare. Il primo che indovina prende i punti della parola (+1 se entro metà del tempo) e prende i punti della parola anche <b>chi disegna</b>, perché ha disegnato bene. Niente furto: se nessuno indovina si passa avanti. Vince chi ha più punti.</p>'],
    relay: ['Staffetta',
      '<p>Si gioca a squadre, ma il disegno è di tutta la squadra: chi comincia sceglie la parola e la disegna per <b>10 secondi</b>, poi la penna passa a un compagno, che vede la parola solo in quel momento e continua il disegno da dove era arrivato. Indovinano i compagni che <b>non hanno ancora avuto la penna</b>: per questo resta sempre almeno uno che indovina. Se il tempo finisce, le altre squadre possono rubare.</p>'],
    blind: ['Indovina tu per me',
      '<p>Quando tocca alla tua squadra, un <b>avversario</b> sceglie la parola (facile o difficile) e scrive <b>al massimo 3 parole di aiuto</b>, senza usare la parola né un suo pezzo. Chi disegna <b>non vede la parola</b>: vede solo gli aiuti e disegna quello che gli suggeriscono. Indovinano lui e i suoi compagni. Gli avversari vedono la parola, quindi niente furto.</p>'],
    chain: ['Telefono senza fili',
      '<p>Si gioca tutti insieme, solo persone. Ognuno riceve una <b>parola segreta</b> e la disegna sul suo telefono, poi consegna. Il disegno passa al vicino, che scrive <b>che cosa vede</b>; la scritta passa al successivo, che la disegna… e così via (al massimo 6 passaggi).</p>' +
      '<p>Alla fine si rivedono tutte le catene, dalla parola di partenza all’ultima scritta. <b>Un punto</b> a chi scrive esattamente la parola di partenza e uno a chi ha fatto il disegno che gliel’ha fatta capire.</p>'],
    extra: ['Regole in più',
      '<ul><li><b>Una linea sola</b>: il disegno è un unico tratto, senza mai alzare il dito (si può solo ricominciare).</li>' +
      '<li><b>Un colore, niente gomma</b>: solo nero, senza gomma, annulla o cestino.</li>' +
      '<li><b>A occhi chiusi</b>: chi disegna non vede il proprio disegno, lo vedono solo gli altri.</li>' +
      '<li><b>Con la mano sbagliata</b>: si disegna con la mano che non si usa di solito. È una regola d’onore!</li>' +
      '<li><b>Tempo che si accorcia</b>: a ogni giro il tempo scende di 20 secondi (minimo 30).</li>' +
      '<li><b>Scommessa</b>: prima di disegnare si puntano 1, 2 o 3 punti. Se la squadra indovina vince la puntata (+1 per la parola difficile, +1 se entro metà del tempo); se nessuno indovina, la perde. Chi ruba vince la puntata.</li></ul>'],
    tips: ['Consigli',
      '<ul><li>Disegna prima la forma grande, poi i dettagli.</li><li>Le parole composte si possono disegnare a pezzi.</li><li>Leggi le risposte sbagliate dei compagni: ti dicono cosa stanno capendo.</li></ul>']
  };
  var ORDER = ['goal', 'draw', 'guess', 'steal', 'modes', 'ffa', 'relay', 'blind', 'chain', 'extra', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S };
})();
