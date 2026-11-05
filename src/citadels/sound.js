/* ===== Citadels: suoni (monete, campane della corte, pugnale, fanfare) ===== */
(function () {
  var S = Sound, N = S.N;
  function flick(at, v) { S.hiss({ ft: 'highpass', f: [2600, 5600], q: .7, a: .004, dur: .08, vol: v || .14, at: at || 0 }); }
  function clink(at, f) { S.bell({ f: f || N.A6, dur: .25, vol: .05, at: at || 0 }); S.hiss({ ft: 'highpass', f: [7000, 9000], q: .8, a: .001, dur: .05, vol: .05, at: at || 0 }); }
  S.setup({
    tracks: ['../presagio/audio/m2.mp3', '../binari-italia/audio/m1.mp3', '../binari-italia/audio/m3.mp3'], musicVol: .18,
    credit: 'Musica: «Enchanted Valley», «Carefree» e «Fluffing a Duck» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      coin: function (o) { var n = Math.min(6, Math.max(1, (o && o.n) || 2)); for (var i = 0; i < n; i++) clink(i * .07, [N.A6, N.C7, N.E6][i % 3]); },
      card: function () { flick(0, .14); },
      cards: function () { flick(0, .12); flick(.08, .12); },
      pick: function () { flick(0, .1); S.tone({ f: N.E5, type: 'triangle', dur: .1, vol: .04, at: .03 }); },
      call: function () { S.bell({ f: N.C6, dur: 1.2, vol: .09 }); S.bell({ f: N.G5, dur: 1.4, vol: .06, at: .18 }); },
      reveal: function () { S.arp([N.G4, N.C5, N.E5, N.G5], { type: 'triangle', step: .07, dur: .35, vol: .09 }); flick(.05, .14); },
      build: function () { for (var i = 0; i < 3; i++) S.hiss({ ft: 'bandpass', f: [700, 300], q: 2, a: .003, dur: .07, vol: .12, at: i * .11 }); S.arp([N.C5, N.G5, N.C6], { bell: true, step: .08, at: .32, dur: .8, vol: .07 }); },
      kill: function () { S.hiss({ ft: 'highpass', f: [2000, 6000], q: 1, a: .002, dur: .22, vol: .12 }); S.tone({ f: [400, 70], type: 'sawtooth', dur: .5, vol: .08, lp: 1300, at: .12 }); },
      dead: function () { S.arp([N.E4, N.C4, N.A3 || N.C4], { type: 'triangle', step: .22, dur: .6, vol: .1 }); },
      rob: function () { for (var i = 0; i < 5; i++) clink(i * .06, N.E7 || N.C7); S.tone({ f: [N.C5, N.G4], type: 'square', dur: .25, vol: .04, lp: 1800, at: .3 }); },
      magic: function () { S.arp([N.C6, N.E6, N.G6, N.B6, N.D7 || N.C7], { bell: true, step: .06, dur: 1, vol: .07 }); S.hiss({ ft: 'highpass', f: [5000, 9000], q: .5, a: .05, dur: .7, vol: .04 }); },
      crown: function () { S.arp([N.C5, N.E5, N.G5, N.C6], { type: 'square', step: .1, dur: .3, vol: .05, lp: 2600 }); S.bell({ f: N.C6, dur: 1.4, vol: .08, at: .42 }); },
      boom: function () { S.tone({ f: [140, 40], type: 'sine', dur: .7, vol: .2 }); S.hiss({ ft: 'lowpass', f: [1600, 200], q: .8, a: .005, dur: .8, vol: .16 }); },
      turn: function () { S.arp([N.G5, N.D6], { bell: true, parts: [1, 2.76, 5.4], step: .12, dur: 1, vol: .12 }); },
      done: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6], { type: 'triangle', step: .08, dur: .5, vol: .13 }); },
      tick: function () { S.tone({ f: N.C6, type: 'sine', dur: .04, vol: .04 }); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      shuffle: function () { for (var i = 0; i < 12; i++) flick(i * .045, .08); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { type: 'triangle', step: .1, dur: .55, vol: .15 }); S.arp([N.C6, N.G6, N.C7], { bell: true, at: .6, step: .08, vol: .1, dur: 1.6 }); },
      lose: function () { S.arp([N.G4, N.E4, N.C4], { type: 'triangle', step: .18, dur: .4, vol: .1 }); }
    }
  });
  S.scene(true);
})();
