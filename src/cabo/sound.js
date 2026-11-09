/* ===== Cabo: suoni (carte che si girano, onde, campanelli) ===== */
(function () {
  var S = Sound, N = S.N;
  function flick(at, v) { S.hiss({ ft: 'highpass', f: [2600, 5600], q: .7, a: .004, dur: .08, vol: v || .16, at: at || 0 }); }
  function thud(at) { S.hiss({ ft: 'bandpass', f: [900, 420], q: 2, a: .002, dur: .05, vol: .13, at: at || 0 }); S.tone({ f: [210, 140], type: 'triangle', dur: .06, vol: .06, lp: 1200, at: at || 0 }); }
  function wind(at, dur, vol) { S.hiss({ ft: 'bandpass', f: [500, 1400], q: .6, a: dur * .4, dur: dur, vol: vol || .07, at: at || 0 }); }
  S.setup({
    tracks: ['../binari-italia/audio/m1.mp3', '../binari-italia/audio/m3.mp3', '../presagio/audio/m2.mp3'], musicVol: .22,
    credit: 'Musica: «Carefree», «Fluffing a Duck» ed «Enchanted Valley» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      // carta che si gira: schiocco e una nota che dipende dal valore (le basse suonano più dolci)
      flip: function (o) { flick(0, .18); var v = o && o.v != null ? o.v : 5; S.tone({ f: v <= 0 ? N.E6 : v <= 4 ? N.C6 : v <= 8 ? N.A5 : N.E5, type: 'triangle', dur: .16, vol: .06, at: .04 }); },
      draw: function () { flick(0, .12); wind(0, .25, .05); S.tone({ f: [N.E5, N.A5], type: 'sine', dur: .14, vol: .04, at: .05 }); },
      place: function () { thud(0); flick(.03, .08); },
      drop: function () { flick(0, .14); S.tone({ f: [N.A4, N.E4], type: 'sine', dur: .14, vol: .05 }); },
      pick: function () { flick(0, .1); },
      col: function () { wind(0, .6, .1); S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { bell: true, parts: [1, 2.76, 5.4], step: .06, dur: 1.1, vol: .1 }); },
      good: function () { S.bell({ f: N.E6, dur: .8, vol: .08 }); },
      ender: function () { S.arp([N.G4, N.C5, N.E5, N.G5], { type: 'triangle', step: .1, dur: .5, vol: .14 }); S.bell({ f: N.C6, dur: 1.2, vol: .1, at: .4 }); },
      count: function () { S.tone({ f: N.C6, type: 'sine', dur: .05, vol: .05 }); },
      double: function () { S.tone({ f: [320, 90], type: 'sawtooth', dur: .5, vol: .1, lp: 900 }); S.tone({ f: [160, 60], type: 'sine', dur: .6, vol: .14, at: .05 }); },
      deal: function () { for (var i = 0; i < 10; i++) flick(i * .05, .1); },
      turn: function () { S.arp([N.G5, N.D6], { bell: true, parts: [1, 2.76, 5.4], step: .12, dur: 1, vol: .12 }); },
      star: function () { S.arp([N.E6, N.B6, N.E7], { bell: true, parts: [1, 2.76, 5.4], step: .07, dur: .9, vol: .09 }); },
      grab: function () { flick(0, .14); S.tone({ f: [N.C5, N.G5], type: 'triangle', dur: .18, vol: .06, at: .03 }); },
      action: function () { wind(0, .4, .08); S.arp([N.D5, N.A5, N.D6], { type: 'triangle', step: .07, dur: .35, vol: .1 }); S.bell({ f: N.A6, dur: .8, vol: .06, at: .22 }); },
      shield: function () { S.tone({ f: [N.A4, N.A5], type: 'square', dur: .18, vol: .05, lp: 2200 }); S.bell({ f: N.E6, dur: 1, vol: .1, at: .1 }); },
      out: function () { S.tone({ f: [N.G4, N.C4], type: 'triangle', dur: .6, vol: .12 }); S.tone({ f: [N.E4, N.A3], type: 'sine', dur: .7, vol: .08, at: .15 }); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { type: 'triangle', step: .1, dur: .55, vol: .15 }); S.arp([N.C6, N.G6, N.C7], { bell: true, at: .6, step: .08, vol: .1, dur: 1.6 }); }
    }
  });
  S.scene(true);
})();
