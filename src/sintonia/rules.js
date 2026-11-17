/* ===== Sintonia: regolamento (sezioni richiamabili dal «?») ===== */
var STRules = (function () {
  var S = {
    goal: ['Lo scopo',
      '<p>A ogni manche esce un <b>tema</b>, per esempio «Un frutto rosso». Ognuno scrive di nascosto <b>una risposta</b>, la prima che gli viene in mente.</p>' +
      '<p>Non si vince scrivendo la risposta più originale, ma <b>la stessa dei compagni</b>: vietato mettersi d’accordo! Quanto vi conoscete?</p>'],
    points: ['I punti',
      '<p><b>A squadre</b>: per ogni gruppo di compagni che hanno scritto la stessa cosa la squadra prende tanti punti quanti sono i compagni del gruppo. Se l’avete scritta <b>tutti</b>, +2.</p>' +
      '<p>Esempio: in quattro, tre scrivono «fragola» e uno «ciliegia»: 3 punti. Tutti e quattro «fragola»: 4 + 2 = 6 punti.</p>' +
      '<p><b>Ognuno per sé</b>: un punto per ogni altro giocatore che ha scritto la tua stessa risposta.</p>' +
      '<p>Le risposte uguali si riconoscono anche con o senza accenti, al singolare o al plurale e con un errore di battitura.</p>'],
    phone: ['Al telefono',
      '<ul><li>Scrivi la risposta e tocca <b>Invia</b>: finché il tempo non scade puoi cambiarla.</li><li>Quando hanno risposto tutti (o finisce il tempo) si scoprono le risposte.</li><li>Tocca <b>Avanti</b> per il tema successivo.</li></ul>'],
    extra: ['Regole in più a sorpresa',
      '<p>Chi apre il tavolo può attivare le <b>regole in più</b> e scegliere quali possono uscire. A ogni manche il gioco ne estrae una a caso (mai la stessa due volte di fila), scritta sotto il tema:</p><ul>' +
      '<li><b>Punti doppi</b>: la manche vale il doppio.</li>' +
      '<li><b>Pensa diverso</b>: al contrario! A squadre 2 punti per ogni risposta che <b>nessun altro</b> ha scritto; ognuno per sé 3 punti.</li>' +
      '<li><b>Lettera obbligata</b>: la risposta deve iniziare con la lettera estratta.</li>' +
      '<li><b>Vietata la più ovvia</b>: la risposta più comune del tema non si può scrivere.</li>' +
      '<li><b>Tempo lampo</b>: solo 10 secondi per rispondere.</li>' +
      '<li><b>Il capitano</b>: in ogni squadra c’è un capitano estratto a caso; contano solo i compagni che scrivono <b>la sua stessa risposta</b> (un punto ciascuno più uno, +2 se tutti). Ognuno per sé: chi scrive come il <b>bersaglio</b> prende 2 punti e il bersaglio 1 per ognuno.</li>' +
      '<li><b>Tutto o niente</b>: a squadre punti solo se scrivete <b>tutti</b> la stessa cosa (2 a testa più 2); ognuno per sé, punti solo a chi ha scritto la risposta più scritta.</li></ul>'],
    tips: ['Consigli',
      '<ul><li>La risposta più ovvia di solito è la migliore.</li><li>Pensa a cosa scriverebbe il compagno, non a cosa ti piace di più.</li><li>Scrivi una parola sola, semplice.</li></ul>']
  };
  var ORDER = ['goal', 'points', 'phone', 'extra', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, ORDER: ORDER };
})();
