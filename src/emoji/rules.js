/* ===== Emoji in scena: regolamento (sezioni richiamabili dal «?») ===== */
var ESRules = (function () {
  var S = {
    goal: ['Lo scopo',
      '<p>Si gioca <b>a squadre</b>. A turno un giocatore fa il <b>regista</b>: racconta un titolo ai compagni usando <b>solo emoji</b>, niente parole. Un film, un modo di dire, un personaggio, un cibo, un luogo, una cosa…</p>' +
      '<p>I compagni scrivono le risposte dal loro telefono. Vince la squadra che, alla fine dei turni, ha <b>più punti</b>.</p>'],
    director: ['Il regista',
      '<ul><li>Scegli tra un titolo <b>facile</b> (1 punto) e uno <b>difficile</b> (2 punti). Lo vedi solo tu.</li>' +
      '<li>Tocca le emoji una dopo l’altra: compaiono subito sui telefoni di tutti. Puoi togliere l’ultima o ricominciare.</li>' +
      '<li>Vedi in diretta le risposte dei compagni: toccane una con <b>🔥</b> se ci sono vicini o con <b>❄️</b> se sono fuori strada.</li>' +
      '<li>Una volta per turno puoi <b>cambiare titolo</b>, se proprio non sai come raccontarlo.</li></ul>'],
    guess: ['Indovinare',
      '<ul><li>Guarda le emoji del regista e scrivi cosa raccontano. Puoi provare quante volte vuoi.</li>' +
      '<li>Non serve l’articolo e un errore di battitura si perdona. Per i modi di dire lunghi bastano quasi tutte le parole giuste.</li>' +
      '<li>Se il tempo finisce senza la risposta giusta, le <b>altre squadre</b> hanno 15 secondi per <b>rubare</b> il titolo.</li></ul>'],
    points: ['I punti',
      '<ul><li>Titolo facile: <b>1 punto</b>; difficile: <b>2 punti</b>.</li><li><b>+1</b> se la squadra indovina nella prima metà del tempo.</li><li>Chi ruba prende i punti del titolo, senza bonus.</li></ul>'],
    tips: ['Consigli',
      '<ul><li>Spezza i titoli lunghi: un’emoji per ogni parola importante (🍎 1️⃣ 📅 …).</li><li>I numeri si fanno con i tasti 1️⃣ 2️⃣ 3️⃣, i segni con ➕ ➖ 🟰 ➡️.</li><li>Leggi le risposte sbagliate: spesso basta un’emoji in più per correggere la strada.</li></ul>']
  };
  var ORDER = ['goal', 'director', 'guess', 'points', 'tips'];
  function section(k) { var s = S[k]; return s ? '<section class="rsec" id="r-' + k + '"><h3>' + s[0] + '</h3>' + s[1] + '</section>' : ''; }
  function html() { return '<div class="rules">' + ORDER.map(section).join('') + '</div>'; }
  function toc() { return '<nav class="rtoc">' + ORDER.map(function (k) { return '<button class="chip" data-act="rulego" data-r="' + k + '">' + S[k][0] + '</button>'; }).join('') + '</nav>'; }
  return { html: html, toc: toc, section: section, S: S, ORDER: ORDER };
})();
