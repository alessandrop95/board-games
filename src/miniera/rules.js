/* ===== La Miniera: regolamento (sezioni richiamabili dal «?») ===== */
var MNRules = (function () {
  var S = {
    goal: ['Lo scopo',
      '<p>Siete cercatori d’oro in una vecchia miniera. La partita dura <b>5 spedizioni</b> (o 3). Vince chi alla fine ha più pepite <b>nella cassa</b>, al campo.</p>' +
      '<p>A ogni spedizione entrate tutti insieme e si scopre una galleria dopo l’altra. Le pepite trovate si dividono <b>in parti uguali</b> tra chi è ancora dentro; quelle che avanzano restano per terra.</p>'],
    choice: ['Avanti o al campo?',
      '<p>Dopo ogni galleria, ognuno sceglie <b>di nascosto</b> e tutti insieme: <b>Avanti</b> o <b>Al campo</b>. Le scelte si scoprono quando hanno scelto tutti.</p>' +
      '<ul><li><b>Al campo</b>: le pepite che hai in tasca vanno nella cassa, al sicuro. In più raccogli quelle rimaste per terra, divise con chi torna insieme a te. Per questa spedizione hai finito.</li>' +
      '<li><b>Avanti</b>: resti dentro e ti dividi le prossime pepite con meno persone… ma rischi tutto.</li></ul>' +
      '<p>Se non scegli in tempo, torni al campo.</p>'],
    danger: ['I pericoli',
      '<p>Nella miniera ci sono 5 pericoli: <b>Frana</b>, <b>Grisù</b>, <b>Piena</b>, <b>Pipistrelli</b> e <b>Serpenti</b>, 3 carte per tipo.</p>' +
      '<p>Il primo pericolo di un tipo fa solo paura. Se nella stessa spedizione ne esce <b>un secondo uguale</b>, tutti quelli ancora dentro scappano e <b>perdono le pepite in tasca</b> (la cassa resta salva). La spedizione finisce e una di quelle carte esce dal gioco.</p>'],
    idol: ['Gli idoli',
      '<p>A ogni spedizione entra nel mazzo un <b>idolo</b>. Lo può portare via solo chi torna al campo <b>da solo</b>. I primi tre idoli valgono 5 pepite, il quarto e il quinto 10. Gli idoli rimasti nella miniera restano nel mazzo per le spedizioni dopo.</p>' +
      '<p>A pari pepite vince chi ha più idoli.</p>'],
    phone: ['Al telefono',
      '<ul><li>In alto vedi tutti i giocatori: chi è nella miniera (lanterna) e chi è al campo (tenda), con le pepite in tasca e nella cassa.</li><li>Al centro c’è il sentiero con tutte le gallerie scoperte; i numeri gialli sono le pepite rimaste per terra.</li><li>Tocca <b>Avanti</b> o <b>Al campo</b>: puoi cambiare idea finché non hanno scelto tutti.</li></ul>'],
    tips: ['Consigli',
      '<ul><li>Più pericoli diversi sono già usciti, più è facile che ne esca un secondo uguale.</li><li>Se gli altri tornano, chi resta si divide le pepite tra meno persone.</li><li>Tornare da soli conviene quando per terra ci sono tante pepite avanzate o un idolo.</li></ul>']
  };
  var ORDER = ['goal', 'choice', 'danger', 'idol', 'phone', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, ORDER: ORDER };
})();
