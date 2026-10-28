/* ===== Catan: suoni (dadi, legno, campanella del porto, ladro) ===== */
(function () {
  var S = Sound, N = S.N;
  function knock(at, f, v) { S.tone({ f: [f || 320, (f || 320) * .6], type: 'triangle', dur: .09, vol: v || .14, lp: 1800, at: at || 0 }); S.hiss({ ft: 'bandpass', f: [900, 600], q: 3, dur: .05, vol: .08, at: at || 0 }); }
  function rattle(at) { for (var i = 0; i < 7; i++) S.hiss({ ft: 'bandpass', f: [2600 + Math.random() * 1400, 1800], q: 6, a: .002, dur: .035, vol: .12 + Math.random() * .06, at: (at || 0) + i * .055 + Math.random() * .02 }); }
  function flick(at) { S.hiss({ ft: 'highpass', f: [2600, 5200], q: .7, a: .005, dur: .11, vol: .14, at: at || 0 }); }
  function coin(at) { S.tone({ f: [N.E6, N.E6], type: 'sine', dur: .25, vol: .06, at: at || 0 }); S.tone({ f: [N.B6, N.B6], type: 'sine', dur: .18, vol: .04, at: (at || 0) + .01 }); }
  S.setup({
    tracks: ['audio/m1.mp3', 'audio/m2.mp3', 'audio/m3.mp3'], musicVol: .18,
    credit: 'Musica di Kevin MacLeod (incompetech.com, CC BY 3.0) da Wikimedia Commons; i titoli sono nel file tools/audio-report.json. Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      dice: function () { rattle(0); knock(.42, 240, .1); knock(.52, 300, .08); },
      prod: function () { flick(0); flick(.1); S.tone({ f: [N.G5, N.C6], type: 'triangle', dur: .16, vol: .05, at: .05 }); },
      road: function () { knock(0, 300); knock(.12, 260, .1); },
      settle: function () { knock(0, 260); knock(.1, 340); S.bell({ f: N.G5, dur: .5, vol: .06, at: .2 }); },
      city: function () { knock(0, 220); knock(.1, 260); knock(.2, 300); S.arp([N.C5, N.G5, N.C6], { bell: true, step: .1, dur: .7, vol: .08, at: .3 }); },
      buy: function () { flick(0); coin(.08); },
      robber: function () { S.tone({ f: [N.D3, N.A2], type: 'sawtooth', dur: .7, vol: .08, lp: 600 }); S.tone({ f: [N.F3, N.C3], type: 'sawtooth', dur: .7, vol: .05, lp: 600, at: .05 }); },
      steal: function () { flick(0); S.tone({ f: [N.A4, N.E4], type: 'triangle', dur: .2, vol: .07, at: .05 }); },
      knight: function () { S.hiss({ ft: 'highpass', f: [5000, 2500], q: 1, a: .005, dur: .3, vol: .12 }); S.tone({ f: [N.E5, N.E5], type: 'square', dur: .12, vol: .03, lp: 3000, at: .02 }); S.arp([N.C4, N.G4, N.C5], { type: 'triangle', step: .09, dur: .3, vol: .08, at: .15 }); },
      card: function () { flick(0); S.arp([N.E5, N.A5], { type: 'triangle', step: .07, dur: .25, vol: .07, at: .05 }); },
      offer: function () { S.bell({ f: N.A5, dur: .6, vol: .08 }); S.bell({ f: N.E6, dur: .5, vol: .05, at: .12 }); },
      deal: function () { coin(0); coin(.1); coin(.2); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .3, vol: .07 }); },
      bank: function () { coin(0); flick(.08); },
      special: function () { S.arp([N.C5, N.E5, N.G5, N.C6], { bell: true, step: .1, dur: .8, vol: .1 }); },
      turn: function () { S.arp([N.C5, N.E5, N.G5], { bell: true, step: .1, dur: .8, vol: .1 }); },
      discard: function () { for (var i = 0; i < 4; i++) flick(i * .07); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6], { type: 'triangle', step: .12, dur: .6, vol: .15 }); }
    }
  });
  S.scene(true);
})();
