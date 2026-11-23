/* ===== Vocabolario bugiardo: regolamento (sezioni richiamabili dal «?») ===== */
var VBRules = (function () {
  var S = {
    goal: ['Lo scopo',
      '<p>Esce una <b>parola italiana vera ma rarissima</b> (chi sa cos’è un «nefelibata»?). Ognuno inventa una <b>definizione falsa</b> ma credibile, poi tutti cercano di riconoscere quella <b>vera</b> in mezzo alle bugie.</p>' +
      '<p>Si fanno punti indovinando e, soprattutto, ingannando gli altri. Dopo le manche stabilite vince chi ha più punti.</p>'],
    write: ['Inventare',
      '<ul><li>Scrivi una definizione che sembri uscita da un vocabolario: tono serio, frase breve.</li>' +
      '<li>Guarda se la parola è un sostantivo, un verbo o un aggettivo e scrivi una definizione dello stesso tipo.</li>' +
      '<li>Finché il tempo non scade puoi correggerla. Se conosci davvero la parola scrivi la definizione vera: vale <b>3 punti</b>!</li></ul>'],
    vote: ['Votare',
      '<p>Le definizioni di tutti, più quella vera, compaiono mescolate e senza nome. Tocca quella che secondo te è <b>vera</b>. La tua non si può votare.</p>'],
    points: ['I punti',
      '<ul><li><b>+2</b> se voti la definizione vera.</li><li><b>+1</b> per ogni giocatore che vota la tua definizione inventata.</li><li><b>+3</b> se scrivi proprio la definizione vera.</li></ul>' +
      '<p>Se due giocatori scrivono la stessa definizione, la bugia vale per entrambi.</p>'],
    tips: ['Consigli',
      '<ul><li>Le definizioni vere spesso hanno un «per estensione» o un «in origine»: puoi usarli anche tu.</li>' +
      '<li>Non esagerare con i dettagli buffi: le bugie migliori sono noiose.</li>' +
      '<li>Pensa a che suono ha la parola: «nefelibata» sembra un mestiere, «sesquipedale» un oggetto…</li></ul>']
  };
  var ORDER = ['goal', 'write', 'vote', 'points', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, ORDER: ORDER };
})();
