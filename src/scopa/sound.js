/* ===== Scopa: suoni (carte sul panno, presa, segno, scopa) ===== */
(function () {
  var S = Sound, N = S.N;
  function flick(at, v) { S.hiss({ ft: 'highpass', f: [2600, 5600], q: .7, a: .004, dur: .08, vol: v || .16, at: at || 0 }); }
  function thud(at) { S.hiss({ ft: 'bandpass', f: [900, 420], q: 2, a: .002, dur: .05, vol: .13, at: at || 0 }); S.tone({ f: [210, 140], type: 'triangle', dur: .06, vol: .06, lp: 1200, at: at || 0 }); }
  S.setup({
    tracks: ['../binari-italia/audio/m1.mp3', '../binari-italia/audio/m3.mp3', '../presagio/audio/m2.mp3'], musicVol: .18,
    credit: 'Musica: «Carefree», «Fluffing a Duck» ed «Enchanted Valley» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      deal: function () { for (var i = 0; i < 6; i++) flick(i * .06, .1); },
      card: function () { thud(0); flick(.02, .08); },
      pick: function () { flick(0, .08); },
      take: function () { flick(0, .1); flick(.05, .08); S.tone({ f: [N.E5, N.A5], type: 'triangle', dur: .12, vol: .04, at: .05 }); },
      big: function () { flick(0, .12); S.arp([N.C5, N.E5, N.G5], { type: 'triangle', step: .06, dur: .3, vol: .08 }); },
      scopa: function () { S.hiss({ ft: 'highpass', f: [1500, 6000], q: .6, a: .02, dur: .35, vol: .14 }); S.arp([N.G5, N.C6, N.E6, N.G6], { bell: true, parts: [1, 2.76, 5.4], step: .07, dur: 1, vol: .12, at: .2 }); },
      sign: function () { S.tone({ f: N.A5, type: 'sine', dur: .08, vol: .06 }); S.tone({ f: N.E6, type: 'sine', dur: .1, vol: .05, at: .09 }); },
      turn: function () { S.arp([N.G5, N.D6], { bell: true, parts: [1, 2.76, 5.4], step: .12, dur: 1, vol: .1 }); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      lose: function () { S.tone({ f: [N.G4, N.C4], type: 'triangle', dur: .6, vol: .1 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { type: 'triangle', step: .1, dur: .55, vol: .15 }); S.arp([N.C6, N.G6, N.C7], { bell: true, at: .6, step: .08, vol: .1, dur: 1.6 }); }
    }
  });
  S.scene(true);
})();
