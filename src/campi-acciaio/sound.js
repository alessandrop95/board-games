/* ===== Campi d'Acciaio: suoni (vapore, metallo, tamburi) ===== */
(function () {
  var S = Sound, N = S.N;
  function clank(at, f) { S.tone({ f: [f || 160, (f || 160) * 0.6], type: 'square', dur: .09, vol: .08, lp: 1400, at: at || 0 }); S.hiss({ ft: 'bandpass', f: [2600, 1800], q: 6, dur: .06, vol: .12, at: at || 0 }); }
  function steam(at, dur, vol) { S.hiss({ ft: 'highpass', f: [2500, 4200], q: .6, a: .04, dur: dur || .5, vol: vol || .14, at: at || 0 }); }
  function drum(at, vol) { S.tone({ f: [120, 50], type: 'sine', dur: .35, vol: vol || .35, at: at || 0 }); S.hiss({ ft: 'lowpass', f: [800, 200], dur: .15, vol: .12, at: at || 0 }); }
  function step(at) { S.hiss({ ft: 'lowpass', f: [700, 300], dur: .07, vol: .12, at: at || 0 }); }
  S.setup({
    tracks: (window.CA_TRACKS || []), musicVol: .22,
    credit: window.CA_MUSIC_CREDIT || 'Esplosione da Wikimedia Commons (pubblico dominio); gli altri effetti sono sintetizzati nel browser.',
    samples: { explosion: { url: 'audio/explosion.mp3', vol: .55 } },
    synth: {
      mech: function () { steam(0, .45, .12); clank(.05, 140); clank(.32, 120); clank(.6, 135); S.tone({ f: [70, 55], type: 'sawtooth', dur: .7, vol: .06, lp: 400 }); },
      march: function () { for (var i = 0; i < 5; i++) step(i * .16); },
      deploy: function () { steam(0, .8, .18); clank(.2, 110); clank(.35, 90); S.arp([N.C4, N.G4, N.C5], { type: 'square', step: .1, at: .45, dur: .2, vol: .05 }); },
      build: function () { for (var i = 0; i < 4; i++) { clank(i * .18, 300 + i * 20); } S.tone({ f: N.G5, type: 'triangle', dur: .3, vol: .08, at: .8 }); },
      upgrade: function () { for (var i = 0; i < 6; i++) S.hiss({ ft: 'bandpass', f: 3200, q: 8, dur: .03, vol: .14, at: i * .05 }); S.arp([N.E5, N.A5], { bell: true, step: .1, at: .35, dur: .6, vol: .1 }); },
      enlist: function () { S.arp([N.G4, N.C5, N.E5, N.G5], { type: 'square', step: .12, dur: .2, vol: .05, lp: 2200 }); drum(0, .18); },
      produce: function () { S.tone({ f: [180, 260], type: 'sawtooth', dur: .5, vol: .05, lp: 900 }); clank(.1, 220); clank(.3, 240); S.bell({ f: N.A5, dur: .7, vol: .08, at: .45 }); },
      coins: function () { for (var i = 0; i < 3; i++) S.bell({ f: N.E6 + i * 120, dur: .25, vol: .06, at: i * .07 }); },
      whistle: function () { S.tone({ f: [N.A5, N.A5], type: 'sine', dur: .9, vol: .12 }); S.tone({ f: [N.Cs6, N.Cs6], type: 'sine', dur: .9, vol: .08 }); steam(0, 1, .14); },
      star: function () { S.arp([N.C5, N.E5, N.G5, N.C6], { type: 'triangle', step: .09, dur: .5, vol: .14 }); S.arp([N.E6, N.G6, N.C7], { bell: true, step: .07, at: .4, dur: 1.2, vol: .08 }); },
      horn: function () { S.tone({ f: [N.D4, N.D4], type: 'sawtooth', dur: .6, vol: .08, lp: 1200 }); S.tone({ f: [N.A4, N.A4], type: 'sawtooth', dur: .9, vol: .08, lp: 1200, at: .5 }); drum(.1, .3); drum(.55, .3); },
      battle: function () { S.sample('explosion', { at: .3, vary: .05 }); drum(0, .45); drum(.22, .35); clank(.35, 400); clank(.4, 520); S.hiss({ ft: 'highpass', f: [3000, 6000], dur: .4, vol: .15, at: .38 }); },
      page: function () { S.hiss({ ft: 'bandpass', f: [1500, 4000], q: .8, a: .05, dur: .25, vol: .12 }); S.bell({ f: N.D6, dur: .6, vol: .06, at: .2 }); },
      turn: function () { S.arp([N.G4, N.D5, N.G5], { bell: true, step: .12, dur: .9, vol: .12 }); steam(.3, .3, .06); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6], { type: 'triangle', step: .12, dur: .6, vol: .16 }); drum(0, .3); drum(.5, .3); }
    }
  });
  S.scene(true);
})();
