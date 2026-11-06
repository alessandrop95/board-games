/* Partite complete tra bot, con ogni combinazione di espansioni: nessun errore, carte conservate, partita conclusa. */
var D = require('../../src/polvere-e-piombo/data.js');
var E = require('../../src/polvere-e-piombo/engine.js');
var B = require('../../src/polvere-e-piombo/bot.js');
var assert = require('assert');

function total(s) {
  var n = s.deck.length + s.disc.length;
  s.players.forEach(function (P) { n += P.hand.length + P.eq.length; });
  s.stack.forEach(function (f) { if (f.cards && (f.type === 'store' || f.type === 'kit')) n += f.cards.length; });
  return n;
}
function seats(n) { var r = []; for (var i = 0; i < n; i++) r.push({ uid: 'u' + i, nick: 'P' + i, bot: true }); return r; }

var combos = [{}, { dc: 1 }, { hn: 1 }, { fc: 1 }, { hn: 1, fc: 1 }, { dc: 1, hn: 1 }, { dc: 1, fc: 1 }, { dc: 1, hn: 1, fc: 1 }];
var GAMES = +process.env.PP_GAMES || 60, stats = { over: 0, long: 0, winners: {}, events: {} };
combos.forEach(function (o) {
  for (var g = 0; g < GAMES; g++) {
    var n = 4 + (g % (o.dc ? 5 : 4));
    var s = E.newGame(seats(n), o), N = total(s), steps = 0;
    assert.strictEqual(N, o.dc ? 120 : 80, 'mazzo iniziale');
    while (s.phase === 'play' && steps < 6000) {
      var p = E.decider(s);
      assert(p != null, 'nessuno deve decidere');
      var a = B.decide(s, p);
      assert(a, 'il bot non sa cosa fare: ' + JSON.stringify(s.stack[s.stack.length - 1]) + ' step ' + s.step);
      var err = E.act(s, p, a);
      if (err) throw new Error('azione rifiutata: ' + err + ' ' + JSON.stringify(a) + ' frame ' + JSON.stringify(s.stack[s.stack.length - 1]) + ' ev ' + (s.ev && s.ev.cur));
      assert.strictEqual(total(s), N, 'carte perse dopo ' + JSON.stringify(a));
      s.players.forEach(function (P) { assert(P.hp <= P.max, 'punti vita oltre il massimo'); });
      if (s.ev && s.ev.cur) stats.events[s.ev.cur] = 1;
      steps++;
    }
    if (s.phase === 'over') { stats.over++; stats.winners[s.winner] = (stats.winners[s.winner] || 0) + 1; } else stats.long++;
  }
});
var evSeen = Object.keys(stats.events).length;
console.log('partite concluse', stats.over, 'troppo lunghe', stats.long, stats.winners, 'eventi visti', evSeen);
assert(stats.long <= combos.length * GAMES * 0.03, 'troppe partite senza fine');
assert(evSeen >= 24, 'pochi eventi visti');
console.log('OK pp_bots');
