/* ===== Unlock!: il risolutore (per la partita guidata e per le prove) =====
   Segue la soluzione dell'avventura e propone il primo passo non ancora fatto. */
var UBot = (function () {
  var E = typeof UEngine !== 'undefined' ? UEngine : require('./engine.js');
  function result(g, s) {
    if (s.a === 'reveal') return s.id;
    if (s.a === 'combine') { var m = E.combo(g, s.r, s.b); return m && m.to; }
    var c = E.card(g, s.id); return s.a === 'code' ? c.code.to : c.mac.to;
  }
  function next(g) {
    var sol = E.scen(g).solution;
    for (var i = 0; i < sol.length; i++) if (!E.seen(g, result(g, sol[i]))) return sol[i];
    return null;
  }
  function decide(g) {
    var s = next(g); if (!s) return null;
    var a = { a: s.a }; Object.keys(s).forEach(function (k) { a[k] = s[k]; });
    return a;
  }
  // a parole, per la guida: su quale carta lavorare adesso
  function focus(g) {
    var s = next(g); if (!s) return null;
    if (s.a === 'reveal') { var src = E.table(g).filter(function (t) { var c = E.card(g, t); return (c.refs || []).indexOf(s.id) >= 0 || (c.hid || []).indexOf(s.id) >= 0; })[0]; return { step: s, card: src || s.id }; }
    if (s.a === 'combine') return { step: s, card: s.r };
    return { step: s, card: s.id };
  }
  return { decide: decide, next: next, focus: focus, result: result };
})();
if (typeof module !== 'undefined') module.exports = UBot;
