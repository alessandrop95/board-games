/* ===== La Miniera: suoni (pepite, passi nella galleria, pericoli, crollo) ===== */
(function () {
  var S = Sound, N = S.N;
  function tick(at) { S.tone({ f: 1800, type: 'square', dur: .025, vol: .035, lp: 3000, at: at || 0 }); }
  function clink(at, f) { S.bell({ f: f || N.E6, dur: .5, vol: .07, at: at || 0 }); }
  S.setup({
    tracks: ['../catan/audio/m2.mp3', '../catan/audio/m1.mp3', '../catan/audio/m3.mp3'], musicVol: .16,
    credit: 'Musica: «Pippin the Hunchback», «Thatched Villagers» e «Minstrel Guild» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      mate: function () { S.tone({ f: N.E6, type: 'sine', dur: .05, vol: .03 }); },
      deal: function () { S.hiss({ ft: 'lowpass', f: [900, 300], q: .8, a: .02, dur: .5, vol: .08 }); S.arp([N.C4, N.G4, N.C5], { type: 'triangle', step: .1, dur: .35, vol: .1, at: .1 }); },
      gem: function () { clink(0, N.E6); clink(.07, N.A6); clink(.15, N.C7); },
      idol: function () { S.arp([N.A4, N.C5, N.E5, N.A5], { bell: true, parts: [1, 2.76, 5.4], step: .1, dur: 1.2, vol: .1 }); },
      haz: function () { S.tone({ f: [N.A3, N.F3], type: 'sawtooth', dur: .35, vol: .06, lp: 900 }); S.hiss({ ft: 'bandpass', f: [600, 200], q: 1, a: .01, dur: .3, vol: .06, at: .05 }); },
      boom: function () { S.hiss({ ft: 'lowpass', f: [700, 80], q: .7, a: .005, dur: 1.2, vol: .22 }); S.tone({ f: [N.C3, 40], type: 'sine', dur: 1, vol: .2 }); },
      home: function () { S.arp([N.G4, N.C5, N.E5], { type: 'triangle', step: .08, dur: .3, vol: .09 }); },
      step: function () { S.hiss({ ft: 'bandpass', f: [400, 300], q: 2, a: .005, dur: .08, vol: .1 }); S.hiss({ ft: 'bandpass', f: [400, 300], q: 2, a: .005, dur: .08, vol: .1, at: .22 }); },
      pickc: function () { S.tone({ f: N.C6, type: 'square', dur: .04, vol: .05, lp: 2500 }); },
      tentc: function () { S.tone({ f: N.G4, type: 'triangle', dur: .08, vol: .07 }); },
      tick: function () { tick(0); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      turn: function () { S.arp([N.G5, N.D6], { bell: true, parts: [1, 2.76, 5.4], step: .12, dur: 1, vol: .12 }); },
      lose: function () { S.tone({ f: [N.G4, N.C4], type: 'triangle', dur: .6, vol: .1 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { type: 'triangle', step: .1, dur: .55, vol: .15 }); S.arp([N.C6, N.G6, N.C7], { bell: true, at: .6, step: .08, vol: .1, dur: 1.6 }); }
    }
  });
  S.scene(true);
})();
