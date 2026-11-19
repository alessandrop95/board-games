/* ===== Serie di partite e risultati (condivisi da tutti i giochi) =====
   Serie: con «Nuova partita con lo stesso tavolo» le vittorie si sommano; l'host può scegliere «al meglio di 3 / di 5».
   La tiene l'host nello stato del tavolo (doc.series), aggiornata quando una partita finisce.
   Risultati: a fine partita chi ha l'account registra il proprio sul server (statistiche e classifica tra amici).
   Ogni gioco dice chi ha vinto con Score.setup({ game, result(g) -> [{ won, place, score }] per giocatore }). */
var Score = (function () {
  var cfg = null;
  function setup(c) { cfg = c; }
  function rid() { return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function result(g) { if (!cfg || !g) return null; try { var r = cfg.result(g); return Array.isArray(r) && r.length === g.players.length ? r : null; } catch (e) { return null; } }
  function need(s) { return s && s.target ? Math.floor(s.target / 2) + 1 : 0; }

  // Solo sull'host, prima di ogni pubblicazione: ogni partita ha un numero (gid); a fine partita la serie si aggiorna una volta sola.
  function beforePublish(doc) {
    if (!doc) return;
    if (doc.phase === 'lobby' || !doc.game) { doc.gid = null; return; }
    if (!doc.gid) doc.gid = rid();
    if (doc.phase !== 'over') return;
    var s = doc.series || (doc.series = { target: 0, n: 0, wins: {}, names: {}, champ: null, last: null });
    if (s.last === doc.gid) return;
    var res = result(doc.game); if (!res) return;
    if (s.champ) { s.n = 0; s.wins = {}; s.champ = null; }   // la serie di prima era già vinta: ne comincia una nuova
    s.last = doc.gid; s.n++;
    doc.game.players.forEach(function (P, i) {
      s.names[P.uid] = P.nick;
      if (!(P.uid in s.wins)) s.wins[P.uid] = 0;
      if (res[i] && res[i].won) s.wins[P.uid]++;
    });
    var k = need(s);
    if (k) s.champ = Object.keys(s.wins).filter(function (u) { return s.wins[u] >= k; }).sort(function (a, b) { return s.wins[b] - s.wins[a]; })[0] || null;
  }
  // Operazione dell'host: tipo di serie (0 = partite singole, 3 o 5 = al meglio di). Ricomincia da zero.
  function op(work, from, o) {
    if (work.host !== from) return { err: 'Solo l’host può farlo.' };
    if (work.phase === 'play') return { err: 'Si cambia tra una partita e l’altra.' };
    var t = o.target === 3 || o.target === 5 ? o.target : 0, last = work.series && work.series.last;
    work.series = { target: t, n: 0, wins: {}, names: {}, champ: null, last: last || null };
    return {};
  }

  function standings(doc) {
    var s = doc && doc.series; if (!s || !s.n) return '';
    var rows = Object.keys(s.wins).sort(function (a, b) { return s.wins[b] - s.wins[a]; });
    var k = need(s), champ = s.champ && s.names[s.champ];
    return '<div class="sc-box" role="status">' +
      (champ ? '<div class="sc-champ">🏆 ' + esc(champ) + ' vince la serie!</div>' : '') +
      '<div class="sc-head"><b>Serie</b> · ' + s.n + (s.n === 1 ? ' partita' : ' partite') + (k ? ' · al meglio di ' + s.target + (champ ? '' : ' (vince chi arriva a ' + k + ')') : '') + '</div>' +
      '<div class="sc-rows">' + rows.map(function (u) { return '<span class="sc-p' + (u === s.champ ? ' on' : '') + (window.Net && u === Net.uid ? ' me' : '') + '">' + esc(s.names[u] || '…') + ' <b>' + s.wins[u] + '</b></span>'; }).join('') + '</div>' +
      (champ ? '<div class="sc-note">Con una nuova partita comincia un’altra serie.</div>' : '') + '</div>';
  }
  var CSS = '.sc-box{display:grid;gap:8px;padding:12px 14px;border-radius:16px;background:color-mix(in srgb,var(--k-accent) 10%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--k-accent) 40%,transparent);font:14.5px/1.4 var(--k-font);text-align:left}' +
    '.sc-champ{font-weight:800;font-size:17px;letter-spacing:-.01em}.sc-rows{display:flex;flex-wrap:wrap;gap:6px}.sc-p{padding:4px 11px;border-radius:999px;background:rgba(255,255,255,.08);white-space:nowrap;font-weight:600}.sc-p b{margin-left:2px}.sc-p.on{background:var(--k-accent);color:var(--k-on-accent)}.sc-p.me{box-shadow:inset 0 0 0 1px currentColor}' +
    '.sc-note,.sc-head{font-size:13px;opacity:.8}';
  function css() { if (!document.getElementById('sc-css')) { var st = document.createElement('style'); st.id = 'sc-css'; st.textContent = CSS; document.head.appendChild(st); } }
  // Sala d'attesa: scelta della serie (host) e classifica della serie in corso.
  function roomHTML(doc, isHost) {
    css();
    var t = doc.series ? doc.series.target || 0 : 0;
    return '<div class="kit-opt"><div class="kit-opt-h"><b>Serie di partite</b></div>' +
      Kit.seg('opt-series', [[0, 'Singole'], [3, 'Al meglio di 3'], [5, 'Al meglio di 5']], t, !isHost) +
      '<p class="kit-opt-d">Con «Nuova partita con lo stesso tavolo» le vittorie si sommano' + (t ? ': vince chi arriva prima a ' + Math.ceil(t / 2) + '.' : '.') + '</p></div>' + standings(doc);
  }
  function endHTML(doc) { css(); return standings(doc); }
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'opt-series' && window.Net) Net.send({ t: 'series', target: +e.target.value }).catch(function (er) { console.warn(er); });
  });

  // Risultato personale sul server (una volta per partita, solo con l'account; le partite di prova non contano).
  var RKEY = 'pp-reported', trying = {};
  function reported() { try { return JSON.parse(localStorage.getItem(RKEY) || '[]'); } catch (e) { return []; } }
  function report() {
    var d = window.App && App.doc;
    if (!cfg || !d || d.phase !== 'over' || !d.game || !d.gid || d.practice || !window.Account || !Account.user() || !window.Net) return;
    var g = d.game, me = -1; g.players.forEach(function (P, i) { if (P.uid === Net.uid) me = i; });
    if (me < 0) return;
    var key = cfg.game + ':' + d.code + ':' + d.gid, done = reported();
    if (done.indexOf(key) >= 0 || (trying[key] && Date.now() - trying[key] < 30000)) return;
    var r = result(g); if (!r || !r[me]) return;
    trying[key] = Date.now();
    Account.rpc('report_result', { p_token: Account.token, p_game: cfg.game, p_match: key, p_won: !!r[me].won, p_place: r[me].place || null, p_players: g.players.length,
      p_score: r[me].score == null ? null : Math.round(r[me].score), p_rivals: g.players.filter(function (P, i) { return i !== me; }).map(function (P) { return String(P.nick || '').slice(0, 18); }) })
      .then(function () { var l = reported(); l.push(key); try { localStorage.setItem(RKEY, JSON.stringify(l.slice(-60))); } catch (e) {} }, function () {});
  }
  setInterval(report, 2500);
  return { setup: setup, beforePublish: beforePublish, op: op, roomHTML: roomHTML, endHTML: endHTML, standings: standings, result: result };
})();
