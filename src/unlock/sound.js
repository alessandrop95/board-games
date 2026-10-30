/* ===== Unlock!: suoni (carte, lucchetti, macchine, allarmi, timer) ===== */
(function () {
  var S = Sound, N = S.N;
  function flick(at, v) { S.hiss({ ft: 'highpass', f: [2600, 5200], q: .7, a: .005, dur: .1, vol: v || .14, at: at || 0 }); }
  function clunk(at, v) { S.hiss({ ft: 'lowpass', f: [900, 200], q: 1, a: .002, dur: .12, vol: v || .3, at: at || 0 }); S.tone({ f: [140, 60], type: 'sine', dur: .14, vol: (v || .3) * .6, at: at || 0 }); }
  function click(at) { S.hiss({ ft: 'bandpass', f: [3200, 2400], q: 3, a: .001, dur: .025, vol: .22, at: at || 0 }); }
  S.setup({
    tracks: ['audio/m1.mp3', 'audio/m2.mp3'], musicVol: .14,
    credit: 'Musica: «Lightless Dawn» e «Unseen Horrors» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      reveal: function () { S.hiss({ f: [700, 4200], ft: 'bandpass', q: 1.1, a: .06, dur: .25, vol: .2 }); S.bell({ f: N.E6, dur: .7, vol: .07, at: .16 }); S.bell({ f: N.B6, dur: .6, vol: .05, at: .24 }); },
      peek: function () { flick(0, .1); },
      combo: function () { clunk(0, .32); clunk(.14, .22); S.arp([N.G4, N.D5, N.G5], { type: 'triangle', step: .07, dur: .3, vol: .12, at: .2 }); },
      miss: function () { clunk(0, .25); S.tone({ f: [N.E3, N.C3], type: 'sawtooth', dur: .35, vol: .07, lp: 900, at: .06 }); },
      key: function () { click(0); S.tone({ f: 1320, type: 'square', dur: .05, vol: .04, lp: 3000 }); },
      unlock: function () { click(0); click(.08); clunk(.18, .3); S.arp([N.C5, N.G5, N.C6], { bell: true, step: .09, dur: .8, vol: .1, at: .3 }); },
      wrong: function () { for (var i = 0; i < 3; i++) S.tone({ f: 180, type: 'square', dur: .12, vol: .07, lp: 1400, at: i * .16 }); },
      dial: function () { click(0); S.tone({ f: [500, 420], type: 'triangle', dur: .04, vol: .05 }); },
      mac: function () { S.tone({ f: [80, 240], type: 'sawtooth', dur: .8, vol: .08, lp: 700 }); S.hiss({ ft: 'lowpass', f: [300, 1200], dur: .8, vol: .12 }); S.arp([N.C5, N.E5, N.G5, N.C6], { type: 'triangle', step: .1, dur: .4, vol: .12, at: .6 }); },
      macno: function () { S.tone({ f: [240, 60], type: 'sawtooth', dur: .6, vol: .09, lp: 600 }); clunk(.5, .2); },
      dot: function () { S.tone({ f: 750, type: 'sine', dur: .09, vol: .14, a: .004 }); },
      dash: function () { S.tone({ f: 750, type: 'sine', dur: .3, vol: .14, a: .004 }); },
      pen: function () { for (var i = 0; i < 4; i++) S.tone({ f: [880, 620], type: 'square', dur: .2, vol: .06, lp: 2200, at: i * .24 }); clunk(0, .35); },
      hint: function () { S.arp([N.A5, N.E6], { bell: true, step: .1, dur: .7, vol: .08 }); },
      ping: function () { S.tone({ f: [1200, 1800], type: 'sine', dur: .12, vol: .12 }); S.tone({ f: [1200, 1800], type: 'sine', dur: .12, vol: .08, at: .16 }); },
      tick: function () { click(0); },
      beat: function () { S.tone({ f: [70, 45], type: 'sine', dur: .14, vol: .3 }); S.tone({ f: [70, 45], type: 'sine', dur: .14, vol: .22, at: .2 }); },
      pause: function () { S.tone({ f: [N.C5, N.G4], type: 'triangle', dur: .3, vol: .1 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6], { type: 'triangle', step: .12, dur: .6, vol: .15 }); S.arp([N.C6, N.G6, N.C7], { bell: true, step: .18, dur: 1.6, vol: .08, at: .7 }); },
      star: function (o) { S.bell({ f: [N.C6, N.D6, N.E6, N.G6, N.C7][Math.min(4, (o && o.i) || 0)], dur: .9, vol: .1 }); }
    }
  });
  S.scene(true);
})();
