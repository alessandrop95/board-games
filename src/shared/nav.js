/* ===== Gesto "indietro" (swipe o tasto) dentro il gioco =====
   Quando si entra in un tavolo si aggiunge una voce alla cronologia: così "indietro" non chiude la pagina
   ma viene gestito dal gioco (chiude una finestra aperta o porta alla home del gioco tenendo il posto). */
var Nav = (function () {
  var handler = null;
  function setup(onBack) { handler = onBack; }
  function guard(code) {
    var url = location.pathname + '?t=' + code;
    if (history.state && history.state.ppTable === code) history.replaceState({ ppTable: code }, '', url);
    else history.pushState({ ppTable: code }, '', url);
  }
  window.addEventListener('popstate', function (ev) {
    // la chat aperta si chiude con "indietro", restando al tavolo
    if (window.Chat && Chat.isOpen()) { Chat.close(); if (window.App && App.code && App.screen === 'table') guard(App.code); return; }
    if (handler) handler(ev.state || null);
  });
  return { setup: setup, guard: guard };
})();
