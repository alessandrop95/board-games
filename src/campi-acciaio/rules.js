/* ===== Campi d'Acciaio: regole spiegate (sezioni richiamabili dai pulsanti «?») ===== */
var CARules = (function () {
  var A = CAArt, D = CAData;
  function i(k) { return A.icon(k, 'ri'); }
  var S = [
    { id: 'goal', t: 'Lo scopo', h:
      '<p>Siete fazioni rivali nelle campagne intorno a una vecchia <b>Fabbrica</b> di mech. Vince chi ha <b>più monete alla fine</b>.</p>' +
      '<p>La partita finisce <b>appena qualcuno conquista la sua 6ª stella</b> ' + i('star') + '. A quel punto si contano le monete: quelle che avete, più i premi per stelle, territori e risorse. I premi crescono con la <b>popolarità</b> ' + i('pop') + ': essere amati conviene.</p>' +
      '<div class="rbox"><b>In breve:</b> sviluppa la tua plancia, allarga il territorio, completa imprese per prendere stelle e tieni alta la popolarità.</div>' },
    { id: 'turn', t: 'Il tuo turno', h:
      '<ol><li>Scegli <b>una colonna</b> della tua plancia. Non può essere quella del turno prima (solo l’Unione di Ferro può ripeterla).</li>' +
      '<li>Fai l’<b>azione in alto</b> della colonna (puoi saltarla).</li><li>Poi fai l’<b>azione in basso</b> della stessa colonna, se puoi pagarla (puoi anche non farla).</li></ol>' +
      '<p>Le risorse guadagnate in alto si possono spendere subito in basso. Poi tocca al giocatore successivo. Non ci sono altre fasi: è tutto qui.</p>' +
      '<div class="rbox">' + i('objective') + ' All’inizio o alla fine del turno puoi anche rivelare un <b>obiettivo</b> completato.</div>' },
    { id: 'board', t: 'La plancia', h:
      '<p>Ogni giocatore ha una plancia con 4 colonne. In alto ci sono <b>Muovi</b> ' + i('move') + ', <b>Rinforza</b> ' + i('bolster') + ', <b>Commercia</b> ' + i('trade') + ' e <b>Produci</b> ' + i('produce') + ' (in ordine diverso su ogni plancia). In basso ci sono sempre <b>Aggiorna</b> ' + i('upgrade') + ', <b>Schiera</b> ' + i('deploy') + ', <b>Costruisci</b> ' + i('build') + ' e <b>Arruola</b> ' + i('enlist') + '.</p>' +
      '<p>Le azioni in basso costano risorse e danno monete. Ogni plancia ha costi e monete diversi: guardali bene, sono la tua strategia.</p>' +
      '<p>Le risorse stanno <b>sulla mappa</b>, nei territori che controlli: puoi spenderle da qualunque posto, ma se un nemico ti prende il territorio le perdi.</p>' },
    { id: 'map', t: 'La mappa', h:
      '<ul><li>' + i('f') + ' <b>Fattoria</b>: cibo · ' + i('w') + ' <b>Foresta</b>: legno · ' + i('m') + ' <b>Montagna</b>: metallo · ' + i('o') + ' <b>Tundra</b>: petrolio.</li>' +
      '<li>' + i('worker') + ' <b>Villaggio</b>: fa nascere nuovi lavoratori.</li><li>' + i('lake') + ' <b>Lago</b>: non produce; ci entra solo chi ha un’abilità adatta.</li>' +
      '<li>' + i('factory') + ' <b>Fabbrica</b>: al centro. Il primo personaggio che arriva prende una carta Fabbrica. A fine partita vale 3 territori.</li>' +
      '<li>' + i('river') + ' <b>Fiumi</b>: scorrono sui bordi e bloccano il passaggio, finché non sblocchi il Guado.</li>' +
      '<li>' + i('tunnel') + ' <b>Gallerie</b>: tutte le gallerie sono collegate tra loro, come se fossero vicine.</li>' +
      '<li><b>Basi</b>: punto di partenza di ogni fazione. Nessuno ci entra; chi perde una battaglia torna lì.</li></ul>' +
      '<p><b>Controlli</b> un territorio se ci hai almeno una pedina, oppure una tua struttura senza pedine nemiche.</p>' },
    { id: 'move', t: 'Muovi', h:
      '<p>' + i('move') + ' Muovi fino a <b>2 unità</b> (3 con il miglioramento) di <b>1 territorio</b> ciascuna. Oppure, invece di muoverti, prendi <b>1 moneta</b> (2 col miglioramento).</p>' +
      '<ul><li><b>Personaggio</b> e <b>mech</b> possono entrare dove ci sono nemici: se ci sono personaggio o mech nemici, a fine movimento scatta una <b>battaglia</b>.</li>' +
      '<li>Se entri dove ci sono <b>solo lavoratori nemici</b>, li rimandi alla loro base, ma perdi 1 popolarità per lavoratore.</li>' +
      '<li>I <b>lavoratori</b> non entrano mai dove ci sono nemici.</li>' +
      '<li>Un <b>mech</b> può portare con sé i tuoi lavoratori che sono nel suo territorio.</li>' +
      '<li>Le unità possono portarsi dietro le risorse del territorio da cui partono (il gioco lo fa da solo quando lasci un territorio vuoto).</li>' +
      '<li>Il personaggio si ferma sui <b>segnalini incontro</b> (i dischetti d’ottone) e lo risolve.</li></ul>' +
      '<p class="muted">Come si fa: tocca una tua pedina sulla mappa, poi uno dei territori illuminati. Ripeti per le altre pedine e conferma.</p>' },
    { id: 'bolster', t: 'Rinforza', h: '<p>' + i('bolster') + ' Paghi <b>1 moneta</b> e scegli: <b>+2 potere</b> ' + i('power') + ' (+3 col miglioramento) oppure <b>1 carta combattimento</b> ' + i('card') + ' (2 col miglioramento).</p><p>Il potere e le carte servono nelle battaglie. Con il <b>Monumento</b> ogni Rinforza dà anche +1 popolarità.</p>' },
    { id: 'trade', t: 'Commercia', h: '<p>' + i('trade') + ' Paghi <b>1 moneta</b> e scegli: <b>2 risorse a piacere</b> (vanno in un territorio con un tuo lavoratore) oppure <b>+1 popolarità</b> ' + i('pop') + ' (+2 col miglioramento).</p><p>Con l’<b>Armeria</b> ogni Commercia dà anche +1 potere.</p>' },
    { id: 'produce', t: 'Produci', h:
      '<p>' + i('produce') + ' Scegli fino a <b>2 territori</b> (3 col miglioramento) dove hai lavoratori: <b>ogni lavoratore produce 1 risorsa</b> del suo terreno. Nei villaggi nascono nuovi lavoratori, fino a 8.</p>' +
      '<p>Produrre costa di più man mano che hai lavoratori in campo: con 4 o più paghi <b>1 potere</b>, con 6 o più anche <b>1 popolarità</b>, con 8 anche <b>1 moneta</b>.</p><p>Con il <b>Mulino</b>, il suo territorio produce come se avesse un lavoratore in più.</p>' },
    { id: 'upgrade', t: 'Aggiorna', h: '<p>' + i('upgrade') + ' Paghi petrolio e sposti un cubo: un’azione <b>in alto migliora</b> (più unità, più potere, più territori…) e un’azione <b>in basso costa 1 risorsa in meno</b>. Dopo 6 aggiornamenti prendi una stella.</p>' },
    { id: 'deploy', t: 'Schiera', h: '<p>' + i('deploy') + ' Paghi metallo e metti un <b>mech</b> in un territorio dove hai un lavoratore. Ogni mech sblocca un’<b>abilità</b> della tua fazione (Guado, Velocità e due speciali), che vale per tutti i tuoi mech e per il personaggio. Dopo 4 mech prendi una stella.</p>' },
    { id: 'build', t: 'Costruisci', h:
      '<p>' + i('build') + ' Paghi legno e metti una <b>struttura</b> dove hai un lavoratore (una per territorio, non sui laghi). Ognuna potenzia un’azione in alto:</p>' +
      '<ul><li>' + i('mon') + ' <b>Monumento</b>: Rinforza dà anche +1 popolarità.</li><li>' + i('mil') + ' <b>Mulino</b>: il suo territorio produce come con un lavoratore in più.</li><li>' + i('min') + ' <b>Miniera</b>: il suo territorio diventa una galleria, solo per te.</li><li>' + i('arm') + ' <b>Armeria</b>: Commercia dà anche +1 potere.</li></ul>' +
      '<p>Le strutture non si distruggono. Dopo 4 strutture prendi una stella. A fine partita una tessera premia certe posizioni delle strutture.</p>' },
    { id: 'enlist', t: 'Arruola', h: '<p>' + i('enlist') + ' Paghi cibo e prendi una <b>recluta</b>: ottieni subito un bonus (+2 potere, +2 monete, +2 popolarità o 2 carte) e da quel momento, <b>ogni volta che tu o i tuoi vicini di tavolo</b> fate l’azione in basso della colonna della recluta, ricevi un piccolo bonus. Dopo 4 reclute prendi una stella.</p>' },
    { id: 'combat', t: 'Le battaglie', h:
      '<ol><li>Chi attacca e chi difende scelgono <b>in segreto</b> quanto potere usare (da 0 a 7, senza superare il proprio).</li>' +
      '<li>Possono aggiungere <b>1 carta combattimento</b> per ogni loro personaggio o mech presente nella battaglia.</li>' +
      '<li>Si rivela insieme: potere + carte. <b>Vince il totale più alto</b>; in pareggio vince chi attacca.</li>' +
      '<li>Entrambi pagano il potere scelto e scartano le carte usate.</li></ol>' +
      '<p>Chi vince prende una <b>stella</b> (al massimo 2 a partita, tranne l’Impero di Carbone) e tiene il territorio. Chi perde riporta <b>tutte le sue pedine alla base</b>; se aveva messo almeno un punto, pesca una carta.</p>' +
      '<p>Se vince l’attaccante e caccia dei lavoratori, perde 1 popolarità per lavoratore.</p>' },
    { id: 'enc', t: 'Gli incontri', h: '<p>Quando il personaggio si ferma su un segnalino incontro, si pesca una carta con <b>3 scelte</b>: di solito una gentile (popolarità), una che costa monete ma rende molto, e una prepotente (tanto bottino, meno popolarità). Ciò che guadagni arriva nel territorio del personaggio.</p><p>La Repubblica dei Campi può sceglierne due.</p>' },
    { id: 'factory', t: 'La Fabbrica', h: '<p>Il primo personaggio di ogni giocatore che arriva alla Fabbrica sceglie una <b>carta Fabbrica</b>: diventa una <b>quinta colonna</b> della plancia, con un’azione in alto speciale e, in basso, «muovi 1 unità fino a 2 territori». A fine partita la Fabbrica vale 3 territori a chi la controlla.</p>' },
    { id: 'stars', t: 'Le stelle', h:
      '<p>Ognuno ha 6 stelle. Le conquisti con queste imprese (una stella ciascuna):</p>' +
      '<ul><li>Tutti i 6 aggiornamenti · tutti i 4 mech · tutte le 4 strutture · tutte le 4 reclute · tutti gli 8 lavoratori in campo</li><li>Un obiettivo completato · popolarità 18 · potere 16</li><li>Ogni battaglia vinta (al massimo 2)</li></ul>' +
      '<p>Le stelle non si perdono mai. Chi mette la sesta stella fa finire la partita.</p>' },
    { id: 'end', t: 'Fine e punteggio', h:
      '<p>Quando qualcuno mette la 6ª stella la partita finisce subito. Ognuno somma:</p><ul><li>le <b>monete</b> che ha;</li><li>le <b>stelle</b>, i <b>territori</b> controllati e ogni <b>2 risorse</b> controllate, pagati secondo la popolarità;</li><li>il premio della <b>tessera strutture</b>.</li></ul>' +
      '<table class="rtab"><tr><th>Popolarità</th><th>Per stella</th><th>Per territorio</th><th>Per 2 risorse</th></tr>' + D.TIERS.map(function (t, k) { return '<tr><td>' + (k ? D.TIERS[k - 1].upto + 1 : 0) + '–' + t.upto + '</td><td>' + t.star + '</td><td>' + t.terr + '</td><td>' + t.res + '</td></tr>'; }).join('') + '</table>' +
      '<p>I laghi contano come territori, la Fabbrica vale 3, le basi non contano. Vince chi ha più monete.</p>' },
    { id: 'factions', t: 'Le fazioni', h: D.FAC_ORDER.map(function (k) { var f = D.FACTIONS[k]; return '<div class="rfac"><div class="rfp">' + A.portrait(k, 64) + '</div><div><h4 style="color:' + (k === 'campi' ? '#efe6cf' : f.light) + '">' + f.n + '</h4><p><b>' + f.heroFull + '</b>. Potere iniziale ' + f.power + ', carte ' + f.cards + '.</p><p><b>' + f.ab.n + ':</b> ' + f.ab.d + '</p><p class="muted">Mech: ' + f.mechs.map(function (m) { return '<b>' + m.n + '</b> (' + m.d + ')'; }).join(' · ') + '</p></div></div>'; }).join('') },
    { id: 'online', t: 'Giocare online', h: '<p>Chi apre il tavolo è l’host: il suo telefono tiene la partita e muove i giocatori automatici. Se si disconnette, gli altri possono prendere il comando. Con il timer di turno attivo, chi resta fermo troppo a lungo viene sostituito dall’automatico finché non tocca «Riprendo io».</p><p>Nomi, carte, testi e grafica sono originali; le regole sono quelle di un celebre gioco di strategia dieselpunk.</p>' }
  ];
  function html(focus) {
    return '<div class="rules">' + S.map(function (s) { return '<section id="r-' + s.id + '" class="rsec' + (s.id === focus ? ' focus' : '') + '"><h3>' + s.t + '</h3>' + s.h + '</section>'; }).join('') + '</div>';
  }
  function toc() { return '<nav class="rtoc">' + S.map(function (s) { return '<button class="chip" data-act="rulego" data-r="' + s.id + '">' + s.t + '</button>'; }).join('') + '</nav>'; }
  function section(id) { var s = S.filter(function (x) { return x.id === id; })[0]; return s ? '<section class="rsec"><h3>' + s.t + '</h3>' + s.h + '</section>' : ''; }
  return { html: html, toc: toc, section: section, S: S };
})();
