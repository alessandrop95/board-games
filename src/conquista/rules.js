/* ===== Conquista l'Italia: regolamento (sezioni richiamabili dal «?») ===== */
var CQRules = (function () {
  var S = {
    goal: ['Lo scopo',
      '<p>Le 20 regioni d’Italia sono libere. A ogni turno arriva una <b>domanda per tutti</b>: chi vince la domanda conquista una regione per la sua squadra. Dopo l’ultima domanda vince la squadra con <b>più regioni</b>.</p>'],
    answer: ['Le domande',
      '<ul><li><b>A scelta</b>: quattro risposte, una sola giusta. Vince chi risponde giusto <b>per primo</b>: una risposta sola a testa, quindi niente fretta sbagliata!</li>' +
      '<li><b>Stima</b>: scrivi un numero (un anno, un’altezza…). Vince chi ci va <b>più vicino</b>; a pari distanza, chi ha risposto prima.</li></ul>'],
    claim: ['Le regioni',
      '<p>Chi vince sceglie una regione: la prima dove vuole, poi solo regioni libere <b>confinanti</b> con il territorio della squadra (le isole sono collegate via mare). Quando le regioni libere finiscono si <b>conquistano</b> quelle degli avversari confinanti.</p>' +
      '<p>Se chi ha vinto non sceglie in tempo, la regione viene scelta a caso.</p>'],
    tips: ['Consigli',
      '<ul><li>Nelle stime meglio un numero ragionato che nessuna risposta.</li><li>Tieni il territorio unito: più confini hai, più regioni puoi prendere.</li><li>A fine partita difendere conta quanto attaccare.</li></ul>']
  };
  var ORDER = ['goal', 'answer', 'claim', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, ORDER: ORDER };
})();
