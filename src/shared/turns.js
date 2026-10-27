/* ===== Timer di turno (condiviso): se un giocatore non fa niente per troppo tempo,
   l'host lo fa giocare in automatico finché non torna. ===== */
var Turns = (function () {
  var cfg = null, lastKey = null, timer = null, offKey = null;
  var DEFAULT = 60;
  var OFF_MS = +(new URLSearchParams(location.search).get('offMs') || 45000); // giocatore offline da così tanto al suo turno: gioca l'automatico
  function secs(doc) { var t = doc && doc.opts && doc.opts.timer; return t == null ? DEFAULT : +t; }
  // cfg: { decider(game) -> indice|null, onTimeout(doc, indice) -> true se ha cambiato qualcosa }
  function setup(c) {
    cfg = c;
    Net.setBeforePublish(function (doc) {
      if (window.Score) Score.beforePublish(doc);   // serie di partite (vedi score.js)
      if (!doc.game || doc.phase !== 'play') { doc.turnKey = null; return; }
      var d = cfg.decider(doc.game), key = doc.game.seq + ':' + d;
      if (doc.turnKey !== key) { doc.turnKey = key; doc.turnSince = Date.now(); }
    });
    setInterval(tick, 1000);
  }
  // Da chiamare a ogni nuovo stato: solo l'host arma il timer.
  function watch(doc) {
    if (!cfg) return;
    var s = secs(doc);
    if (!Net.isHost || !doc || !doc.game || doc.phase !== 'play' || !s || !doc.turnKey) { clearTimeout(timer); lastKey = null; return; }
    if (doc.turnKey === lastKey) return;
    lastKey = doc.turnKey; clearTimeout(timer);
    var d = cfg.decider(doc.game);
    if (d == null || doc.game.players[d].bot) return;
    var key = doc.turnKey, wait = Math.max(500, (doc.turnSince || Date.now()) + s * 1000 - Date.now());
    timer = setTimeout(function () {
      Net.hostApply(function (cur) {
        if (!cur.game || cur.phase !== 'play' || cur.turnKey !== key) return false;
        var dd = cfg.decider(cur.game);
        if (dd == null || cur.game.players[dd].bot) return false;
        return cfg.onTimeout(cur, dd);
      });
    }, wait);
  }
  // Solo sull'host: tocca a un giocatore che ha chiuso l'app o perso la rete da un po'? Gioca l'automatico per lui,
  // anche se il tavolo non ha limite di tempo (altrimenti la partita resterebbe ferma per sempre). Al suo ritorno riprende lui.
  function offlineCheck(doc) {
    if (!cfg || !Net.isHost || !Net.connected || !doc || !doc.game || doc.phase !== 'play' || !doc.turnKey || doc.turnKey === offKey) return;
    var d = cfg.decider(doc.game), P = d == null ? null : doc.game.players[d];
    if (!P || P.bot || !P.uid || P.uid === Net.uid || Net.presence(P.uid) !== 'off' || Net.offlineFor(P.uid) < OFF_MS) return;
    if (Date.now() - (doc.turnSince || 0) < 15000) return;
    var key = doc.turnKey; offKey = key;
    Net.hostApply(function (cur) {
      if (!cur.game || cur.phase !== 'play' || cur.turnKey !== key) return false;
      var dd = cfg.decider(cur.game);
      if (dd !== d || cur.game.players[dd].bot) return false;
      return cfg.onTimeout(cur, dd);
    });
  }
  // Conto alla rovescia visibile a chi deve giocare (elemento #tt), solo negli ultimi 20 secondi.
  function tick() {
    var doc = App.doc, s = secs(doc);
    offlineCheck(doc);
    var el = document.getElementById('tt'); if (!el) return;
    if (!doc || !doc.turnSince || !s) { el.textContent = ''; return; }
    var rem = Math.ceil((doc.turnSince + s * 1000 - Date.now()) / 1000);
    el.textContent = rem > 0 && rem <= 20 ? ' Ancora ' + rem + ' s, poi gioca l’automatico.' : '';
  }
  function optionHTML(doc, isHost) {
    var s = secs(doc), opts = [[0, 'Nessun limite'], [30, '30 secondi'], [60, '60 secondi'], [120, '2 minuti']];
    return '<label class="tt-opt" style="display:grid;gap:6px"><span><b>Timer di turno</b><br><span class="muted" style="font-size:15px">Se un giocatore resta fermo oltre questo tempo, gioca l’automatico al suo posto finché non torna.</span></span>' +
      '<select id="opt-timer" class="field"' + (isHost ? '' : ' disabled') + ' style="font-size:16px;min-height:44px">' +
      opts.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === s ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>';
  }
  function awayLog(g, p) {
    if (!g.log) return;
    g.log.push({ n: ++g.logN, t: g.players[p].nick + ' non risponde: gioca l’automatico finché non torna.', k: 'sys' });
    if (g.log.length > 70) g.log.splice(0, g.log.length - 70);
  }
  return { setup: setup, watch: watch, secs: secs, optionHTML: optionHTML, awayLog: awayLog };
})();
