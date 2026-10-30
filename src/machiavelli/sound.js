/* ===== Machiavelli: suoni (carte sul panno, mazzo, campanella) ===== */
(function () {
  var S = Sound, N = S.N;
  function flick(at, v) { S.hiss({ ft: 'highpass', f: [2600, 5200], q: .7, a: .005, dur: .1, vol: v || .14, at: at || 0 }); }
  function tap(at) { S.hiss({ ft: 'bandpass', f: [900, 500], q: 2, a: .002, dur: .05, vol: .12, at: at || 0 }); S.tone({ f: [220, 150], type: 'triangle', dur: .06, vol: .05, lp: 1200, at: at || 0 }); }
  S.setup({
    tracks: ['audio/m1.mp3', 'audio/m2.mp3'], musicVol: .16,
    credit: 'Musica: «Bushwick Tarantella» e «Achaidh Cheide» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      pick: function () { flick(0, .1); },
      drop: function () { tap(0); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      play: function (o) { var n = Math.min(6, (o && o.n) || 2); for (var i = 0; i < n; i++) tap(i * .08); S.bell({ f: N.G5, dur: .5, vol: .05, at: n * .08 }); },
      draw: function () { flick(0); S.tone({ f: [N.E5, N.G5], type: 'triangle', dur: .12, vol: .04, at: .03 }); },
      pass: function () { S.tone({ f: [N.A4, N.F4], type: 'sine', dur: .25, vol: .05 }); },
      turn: function () { S.arp([N.C5, N.E5, N.G5], { bell: true, step: .1, dur: .8, vol: .1 }); },
      last: function () { S.bell({ f: N.A5, dur: .7, vol: .1 }); S.bell({ f: N.E6, dur: .6, vol: .07, at: .15 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6], { type: 'triangle', step: .12, dur: .6, vol: .15 }); }
    }
  });
  S.scene(true);
})();
