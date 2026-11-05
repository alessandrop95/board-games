/* ===== Flip 7: suoni (carte, luna park, fanfare) ===== */
(function () {
  var S = Sound, N = S.N;
  function flick(at, v) { S.hiss({ ft: 'highpass', f: [2600, 5600], q: .7, a: .004, dur: .08, vol: v || .16, at: at || 0 }); }
  function thud(at) { S.hiss({ ft: 'bandpass', f: [900, 420], q: 2, a: .002, dur: .05, vol: .13, at: at || 0 }); S.tone({ f: [210, 140], type: 'triangle', dur: .06, vol: .06, lp: 1200, at: at || 0 }); }
  var SCALE = [N.C5, N.D5, N.E5, N.F5, N.G5, N.A5, N.B5, N.C6, N.D6, N.E6, N.F6, N.G6, N.A6];
  S.setup({
    tracks: ['../binari-italia/audio/m1.mp3', '../presagio/audio/m2.mp3', '../binari-italia/audio/m3.mp3'], musicVol: .2,
    credit: 'Musica: «Carefree», «Enchanted Valley» e «Fluffing a Duck» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      // carta numero: una nota che sale con il valore
      flip: function (o) { flick(0, .16); var v = o && typeof o.v === 'number' ? o.v : 6; S.tone({ f: SCALE[v] || N.C6, type: 'triangle', dur: .16, vol: .07, at: .03 }); },
      deal: function () { flick(0, .12); thud(.04); },
      mod: function () { flick(0, .12); S.arp([N.E6, N.G6, N.C7], { bell: true, parts: [1, 2.76, 5.4], step: .05, dur: .7, vol: .08 }); },
      action: function () { S.tone({ f: [N.C5, N.C6], type: 'square', dur: .18, vol: .05, lp: 2400 }); S.bell({ f: N.G6, dur: .6, vol: .07, at: .1 }); },
      bust: function () { S.tone({ f: [520, 90], type: 'sawtooth', dur: .7, vol: .1, lp: 1500 }); S.tone({ f: [130, 60], type: 'sine', dur: .5, vol: .16, at: .05 }); S.hiss({ ft: 'lowpass', f: [800, 200], q: 1, a: .01, dur: .4, vol: .08, at: .02 }); },
      save: function () { S.arp([N.G5, N.C6, N.E6], { bell: true, parts: [1, 2.4, 4], step: .07, dur: .8, vol: .1 }); S.hiss({ ft: 'highpass', f: [4000, 8000], q: .5, a: .01, dur: .3, vol: .06 }); },
      freeze: function () { S.arp([N.B6, N.Fs6 || N.F6, N.D6, N.B5], { bell: true, parts: [1, 3.1, 5.9], step: .06, dur: 1.2, vol: .09 }); S.hiss({ ft: 'highpass', f: [6000, 9000], q: .5, a: .05, dur: .8, vol: .05 }); },
      flip3: function () { for (var i = 0; i < 8; i++) thud(i * .05); S.arp([N.C5, N.E5, N.G5], { type: 'square', step: .12, dur: .2, vol: .05, lp: 2400, at: .45 }); },
      gift: function () { S.bell({ f: N.E6, dur: .8, vol: .08 }); S.bell({ f: N.A6, dur: .8, vol: .06, at: .12 }); },
      stay: function () { S.tone({ f: N.E6, type: 'square', dur: .06, vol: .05, lp: 3000 }); S.tone({ f: N.C7, type: 'square', dur: .1, vol: .05, lp: 3000, at: .07 }); S.hiss({ ft: 'highpass', f: [5000, 5000], q: 1, a: .002, dur: .25, vol: .05, at: .12 }); },
      flip7: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6, N.C7], { type: 'triangle', step: .07, dur: .5, vol: .15 }); S.arp([N.C6, N.G6, N.C7, N.E7 || N.C7], { bell: true, at: .55, step: .09, vol: .11, dur: 1.6 }); for (var i = 0; i < 5; i++) S.hiss({ ft: 'bandpass', f: [1200, 300], q: 1, a: .005, dur: .3, vol: .07, at: .7 + i * .18 }); },
      turn: function () { S.arp([N.G5, N.D6], { bell: true, parts: [1, 2.76, 5.4], step: .12, dur: 1, vol: .12 }); },
      tick: function () { S.tone({ f: N.C6, type: 'sine', dur: .04, vol: .04 }); },
      pick: function () { flick(0, .1); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      shuffle: function () { for (var i = 0; i < 14; i++) flick(i * .04, .08); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { type: 'triangle', step: .1, dur: .55, vol: .15 }); S.arp([N.C6, N.G6, N.C7], { bell: true, at: .6, step: .08, vol: .1, dur: 1.6 }); },
      lose: function () { S.arp([N.G4, N.E4, N.C4], { type: 'triangle', step: .18, dur: .4, vol: .1 }); }
    }
  });
  S.scene(true);
})();
