/* ===== Schermo acceso al tavolo e richiamo «tocca a te» (condivisi da tutti i giochi) =====
   Schermo: mentre sei seduto a un tavolo (in attesa o in partita) il telefono non spegne lo schermo da solo. È lo
   spegnimento automatico, quasi sempre, a «scollegare» chi aspetta il suo turno: a schermo spento il telefono ferma
   la pagina. Si può disattivare dal menu del tavolo («Schermo sempre acceso»).
   Richiamo: se arriva il tuo turno mentre l'app è in secondo piano ma ancora viva, il titolo della scheda cambia e,
   con le notifiche permesse, compare una notifica; ad app chiusa del tutto ci pensa il server (vedi turns.js).
   Usa le funzioni globali dei giochi: App, Net, Coach. */
var Awake = (function () {
  var KEY = 'pp-awake', lock = null, asking = false, retryAt = 0;
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function supported() { return !!(navigator.wakeLock && navigator.wakeLock.request); }
  function enabled() { return get(KEY) !== 'off'; }
  function seated(d) { return !!(d && d.seats && window.Net && (d.host === Net.uid || d.seats.some(function (s) { return s.uid === Net.uid; }))); }
  function wanted() {
    var d = window.App && App.doc;
    return enabled() && supported() && document.visibilityState === 'visible' && !!d && App.screen === 'table' && !!Net.tableCode &&
      (d.phase === 'lobby' || d.phase === 'play') && seated(d);
  }
  function release() { var l = lock; lock = null; if (l) { try { l.release().catch(function () {}); } catch (e) {} } }
  function sync() {
    var w = wanted();
    if (!w) { if (lock) release(); return; }
    if (lock || asking || Date.now() < retryAt) return;
    asking = true;
    navigator.wakeLock.request('screen').then(function (l) {
      asking = false; lock = l;
      l.addEventListener('release', function () { if (lock === l) lock = null; });   // il sistema lo toglie quando la pagina si nasconde
      if (!wanted()) release();
    }, function () { asking = false; retryAt = Date.now() + 15000; });   // risparmio energetico attivo, o pagina non in primo piano
  }
  setInterval(sync, 2500);
  document.addEventListener('visibilitychange', function () { sync(); if (document.visibilityState === 'visible') calm(); });

  /* --- voce nel menu del tavolo --- */
  function label() { return 'Schermo sempre acceso al tavolo: <b>' + (enabled() ? 'sì' : 'no') + '</b>'; }
  function menuHTML(cls) { return supported() ? '<button type="button" class="' + (cls || 'btn ghost block') + '" data-awake="toggle" aria-pressed="' + enabled() + '">' + label() + '</button>' : ''; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-awake]'); if (!b) return;
    set(KEY, enabled() ? 'off' : 'on'); retryAt = 0; sync();
    Array.prototype.forEach.call(document.querySelectorAll('[data-awake]'), function (x) { x.innerHTML = label(); x.setAttribute('aria-pressed', String(enabled())); });
  });

  /* --- richiamo al turno --- */
  var baseTitle = null, wasMine = false, flagged = false;
  function myTurn(doc) {
    if (!doc || !doc.game || doc.phase !== 'play' || !window.Coach || !Coach.needs || !doc.game.players) return false;
    var g = doc.game, me = -1; g.players.forEach(function (P, i) { if (P.uid === Net.uid) me = i; });
    if (me < 0 || g.players[me].bot) return false;   // se per me sta giocando l'automatico, non c'è niente da fare adesso
    return Coach.needs(g, me);
  }
  function tag() { return 'turn-' + (Net.tableCode || ''); }
  function reg() { return navigator.serviceWorker && navigator.serviceWorker.getRegistration ? navigator.serviceWorker.getRegistration().catch(function () { return null; }) : Promise.resolve(null); }
  function calm() {
    if (!flagged) return; flagged = false;
    if (baseTitle != null) document.title = baseTitle;
    var t = tag();
    reg().then(function (r) { if (r && r.getNotifications) return r.getNotifications({ tag: t }).then(function (l) { l.forEach(function (n) { n.close(); }); }); }).catch(function () {});
  }
  function call(doc) {
    flagged = true;
    if (baseTitle == null) baseTitle = document.title;
    document.title = '🔔 Tocca a te · ' + baseTitle;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (window.Alerts && Alerts.turnsOn && !Alerts.turnsOn()) return;
    var o = { body: baseTitle + ', tavolo ' + doc.code + ': gli altri ti aspettano.', tag: tag(), renotify: true, data: { url: location.href }, icon: new URL('../icon-192.png', location.href).href, lang: 'it' };
    reg().then(function (r) { if (r && r.showNotification && document.visibilityState === 'hidden') return r.showNotification('Tocca a te!', o); }).catch(function () {});
  }
  // Da chiamare a ogni nuovo stato del tavolo (lo fa Turns.watch).
  function watch(doc) {
    var mine = myTurn(doc);
    if (mine && !wasMine && document.visibilityState === 'hidden') call(doc);
    if (!mine || document.visibilityState === 'visible') calm();
    wasMine = mine;
  }
  return { menuHTML: menuHTML, watch: watch, supported: supported, enabled: enabled, sync: sync, get held() { return !!lock; } };
})();
