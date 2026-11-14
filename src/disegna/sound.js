/* ===== Disegna e indovina: suoni (pennarello, campanello della risposta giusta, sirena del furto) ===== */
(function () {
  var S = Sound, N = S.N;
  function tick(at) { S.tone({ f: 1800, type: 'square', dur: .025, vol: .035, lp: 3000, at: at || 0 }); }
  S.setup({
    tracks: ['../binari-italia/audio/m1.mp3', '../binari-italia/audio/m3.mp3', '../presagio/audio/m2.mp3'], musicVol: .16,
    credit: 'Musica: «Carefree», «Fluffing a Duck» ed «Enchanted Valley» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      turn: function () { S.arp([N.G5, N.D6], { bell: true, parts: [1, 2.76, 5.4], step: .12, dur: 1, vol: .12 }); },
      draw: function () { S.arp([N.C5, N.G5, N.C6], { type: 'triangle', step: .08, dur: .3, vol: .1 }); },
      guess: function () { S.tone({ f: N.E5, type: 'triangle', dur: .06, vol: .05 }); },
      near: function () { S.tone({ f: [N.C5, N.E5], type: 'triangle', dur: .15, vol: .07 }); },
      hit: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6], { bell: true, parts: [1, 2.76, 5.4], step: .06, dur: 1, vol: .12 }); },
      steal: function () { S.tone({ f: [N.A4, N.A5], type: 'sawtooth', dur: .3, vol: .07, lp: 1800 }); S.tone({ f: [N.A4, N.A5], type: 'sawtooth', dur: .3, vol: .07, lp: 1800, at: .35 }); },
      miss: function () { S.tone({ f: [N.G4, N.C4], type: 'triangle', dur: .5, vol: .1 }); },
      tick: function () { tick(0); },
      clear: function () { S.hiss({ ft: 'highpass', f: [1200, 4000], q: .7, a: .02, dur: .25, vol: .1 }); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      lose: function () { S.tone({ f: [N.G4, N.C4], type: 'triangle', dur: .6, vol: .1 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { type: 'triangle', step: .1, dur: .55, vol: .15 }); S.arp([N.C6, N.G6, N.C7], { bell: true, at: .6, step: .08, vol: .1, dur: 1.6 }); }
    }
  });
  S.scene(true);
})();
