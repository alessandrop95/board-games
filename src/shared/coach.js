/* ===== Partita guidata contro i bot (condivisa) =====
   Dalla lista dei tavoli: «Partita di prova guidata». Si apre un tavolo che non compare nella lista, con dei bot,
   senza limite di tempo. Durante la partita una barra in alto spiega cosa fare adesso e propone la mossa consigliata
   (quella che sceglierebbe il giocatore automatico). Ogni gioco dà i suoi consigli con Coach.setup({ bots, tip(g, me) }).
   Usa le funzioni globali dei giochi: App, E, BOT, act, myIdx, requireNick, run, enterTable. */
var Coach = (function () {
  var cfg = null, hidden = false, lastHTML = '';
  function setup(c) { cfg = c; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var CSS = '.cx-start{display:flex;gap:10px 12px;align-items:center;flex-wrap:wrap;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);font:14px/1.4 var(--k-font)}.cx-start span{flex:1;min-width:180px;opacity:.88}' +
    '.cx-bar{position:fixed;left:50%;transform:translateX(-50%);top:calc(58px + env(safe-area-inset-top,0px));z-index:9980;width:min(540px,calc(100vw - 16px));display:flex;gap:10px;align-items:flex-start;padding:12px 12px 12px 14px;border-radius:16px;background:rgba(20,22,29,.96);color:var(--k-text);box-shadow:0 14px 34px rgba(0,0,0,.5),inset 0 0 0 1px var(--k-line-2),inset 3px 0 0 var(--k-accent);font:14.5px/1.45 var(--k-font);-webkit-font-smoothing:antialiased}' +
    '.cx-bar .cx-t{flex:1;min-width:0}.cx-bar b{color:var(--k-accent)}.cx-bar .cx-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}' +
    '.cx-bar button{appearance:none;font:600 13.5px var(--k-font);border-radius:10px;padding:8px 12px;border:0;background:var(--k-surface-2);box-shadow:inset 0 0 0 1px var(--k-line-2);color:inherit;cursor:pointer}.cx-bar button.main{background:var(--k-accent);color:var(--k-on-accent);box-shadow:none}' +
    '.cx-bar .cx-x{background:none;box-shadow:none;padding:2px 6px;font-size:20px;line-height:1;opacity:.6}.cx-pill{position:fixed;right:max(10px,env(safe-area-inset-right,0px));top:calc(60px + env(safe-area-inset-top,0px));z-index:9980;appearance:none;border:0;background:rgba(20,22,29,.96);box-shadow:0 8px 22px rgba(0,0,0,.45),inset 0 0 0 1px var(--k-accent);color:var(--k-text);border-radius:999px;padding:8px 14px;font:600 13.5px var(--k-font);cursor:pointer}';
  function css() { if (!document.getElementById('cx-css')) { var s = document.createElement('style'); s.id = 'cx-css'; s.textContent = CSS; document.head.appendChild(s); } }
  function buttonHTML() {
    if (!cfg || (window.App && App.code)) return '';
    css();
    return '<div class="cx-start"><span>' + (cfg.startText || 'Non conosci ancora il gioco? Prova una partita contro i bot: ti spiego ogni mossa.') + '</span><button type="button" class="btn small" data-coach="start">🎓 Partita guidata</button></div>';
  }
  function wait(fn, ms) { return new Promise(function (res, rej) { var t0 = Date.now(), iv = setInterval(function () { if (fn()) { clearInterval(iv); res(); } else if (Date.now() - t0 > ms) { clearInterval(iv); rej('Il tavolo di prova non risponde: riprova.'); } }, 150); }); }
  function start() {
    var nick = requireNick(); if (!nick) return;
    hidden = false;
    run(async function () {
      var code = await Net.create(nick, { practice: true });
      await enterTable(code, nick);
      await wait(function () { return App.doc && App.doc.code === code && Net.isHost; }, 15000);
      for (var i = 0; i < (cfg.bots || 2); i++) await Net.send({ t: 'addbot' });
      await Net.send({ t: 'opt', timer: 0 });
      await Net.send({ t: 'start' });
    });
  }

  function myTurn(g, me) {
    if (me < 0 || !g || g.phase === 'over') return false;
    if (cfg.myTurn) return cfg.myTurn(g, me);
    return E.decider(g) === me;
  }
  function suggest() {
    var g = App.doc && App.doc.game, me = myIdx();
    if (!myTurn(g, me)) return;
    var a = null; try { a = BOT.decide(JSON.parse(JSON.stringify(g)), me); } catch (e) { a = null; }
    if (!a) { flash('Qui non saprei cosa consigliarti: scegli tu.'); return; }
    act(a); flash('Ho giocato per te la mossa consigliata: guarda cosa è successo sul tavolo e nel registro.');
  }
  var flashTxt = null, flashT = null;
  function flash(t) { flashTxt = t; clearTimeout(flashT); flashT = setTimeout(function () { flashTxt = null; paint(); }, 5000); paint(); }
  function paint() {
    // nascosta mentre è aperta una finestra del gioco (benvenuto, scelte, regole): quella spiega già cosa fare
    var d = window.App && App.doc, on = d && d.practice && App.screen === 'table' && d.game && cfg && !App.sheet && !document.querySelector('.pa-back,.px-back,.k-back');
    var bar = document.querySelector('.cx-bar'), pill = document.querySelector('.cx-pill');
    if (!on) { if (bar) bar.remove(); if (pill) pill.remove(); lastHTML = ''; return; }
    css();
    if (hidden) {
      if (bar) bar.remove();
      if (!pill) { pill = document.createElement('button'); pill.type = 'button'; pill.className = 'cx-pill'; pill.setAttribute('data-coach', 'show'); pill.textContent = '🎓 Guida'; document.body.appendChild(pill); }
      return;
    }
    if (pill) pill.remove();
    var g = d.game, me = myIdx(), mine = myTurn(g, me), txt;
    if (g.phase === 'over' || d.phase === 'over') txt = '<b>Partita finita!</b> Dalla schermata finale puoi giocarne un’altra con lo stesso tavolo, oppure esci e apri un tavolo vero con i tuoi amici.';
    else {
      var t = null; try { t = cfg.tip(g, me, mine); } catch (e) { t = null; }
      if (!t && !mine) { var dd = E.decider(g); t = dd != null && g.players[dd] ? 'Tocca a <b>' + esc(g.players[dd].nick) + '</b> (bot): guarda cosa fa, poi tocca a te.' : 'Aspetta un attimo: gli altri stanno giocando.'; }
      txt = t || 'Tocca a te.';
    }
    if (flashTxt) txt = flashTxt + '<br>' + txt;
    var html = '<span aria-hidden="true">🎓</span><div class="cx-t">' + txt + (mine && g.phase !== 'over' ? '<div class="cx-row"><button type="button" class="main" data-coach="suggest">Fai la mossa consigliata</button><button type="button" data-coach="rules">Regole</button></div>' : '') + '</div><button type="button" class="cx-x" data-coach="hide" aria-label="Nascondi la guida">×</button>';
    if (!bar) { bar = document.createElement('div'); bar.className = 'cx-bar'; bar.setAttribute('role', 'status'); document.body.appendChild(bar); }
    if (html !== lastHTML) { bar.innerHTML = html; lastHTML = html; }
  }
  setInterval(paint, 700);
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-coach]'); if (!b) return;
    var k = b.getAttribute('data-coach');
    if (k === 'start') start();
    else if (k === 'hide') { hidden = true; paint(); }
    else if (k === 'show') { hidden = false; lastHTML = ''; paint(); }
    else if (k === 'suggest') suggest();
    else if (k === 'rules') { var r = document.querySelector('[data-act="rules"]'); if (r) r.click(); }
  });
  // Tocca a questo giocatore fare qualcosa adesso? (lo usano il richiamo «tocca a te» e la notifica a chi è assente)
  function needs(g, i) { try { return !!(cfg && myTurn(g, i)); } catch (e) { return false; } }
  return { setup: setup, buttonHTML: buttonHTML, start: start, paint: paint, needs: needs };
})();
