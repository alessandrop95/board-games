/* ===== Asta lampo: suoni (martelletto, monete, pareggio, maledizione) ===== */
(function () {
  var S = Sound, N = S.N;
  function coins(at, n) { for (var i = 0; i < (n || 4); i++) S.tone({ f: N.E7 * (1 + Math.random() * .06), type: 'triangle', dur: .07, vol: .05, at: (at || 0) + i * .07 }); }
  S.setup({
    tracks: ['../binari-italia/audio/m1.mp3', '../presagio/audio/m2.mp3', '../binari-italia/audio/m3.mp3'], musicVol: .14,
    credit: 'Musica: «Carefree», «Enchanted Valley» e «Fluffing a Duck» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      lot: function () { S.hiss({ ft: 'highpass', f: [1200, 3000], q: .6, a: .02, dur: .25, vol: .06 }); S.arp([N.C5, N.G5], { bell: true, parts: [1, 2.76, 5.4], step: .08, dur: .5, vol: .08 }); },
      bid: function () { S.tone({ f: N.A5, type: 'triangle', dur: .07, vol: .05 }); },
      mybid: function () { coins(0, 3); },
      click: function () { S.tone({ f: N.C6, type: 'square', dur: .03, vol: .035, lp: 2500 }); },
      gavel: function () { S.tone({ f: N.C3, type: 'sine', dur: .12, vol: .16 }); S.hiss({ ft: 'bandpass', f: [900, 500], q: 2, a: .001, dur: .08, vol: .12 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { type: 'triangle', step: .1, dur: .55, vol: .15 }); S.arp([N.C6, N.G6, N.C7], { bell: true, at: .6, step: .08, vol: .1, dur: 1.6 }); },
      got: function () { S.arp([N.E5, N.A5, N.Cs6], { bell: true, parts: [1, 2.76, 5.4], step: .07, dur: .7, vol: .1 }); coins(.2, 2); },
      tie: function () { S.tone({ f: [N.G4, N.G5], type: 'triangle', dur: .35, vol: .07 }); S.tone({ f: [N.B4, N.B5], type: 'triangle', dur: .35, vol: .05, at: .05 }); },
      curse: function () { S.tone({ f: [N.E3, N.As2], type: 'sawtooth', dur: .7, vol: .07, lp: 900 }); S.tone({ f: [N.B3, N.F3], type: 'sawtooth', dur: .7, vol: .05, lp: 900, at: .08 }); },
      turn: function () { S.arp([N.G5, N.D6], { bell: true, parts: [1, 2.76, 5.4], step: .12, dur: 1, vol: .1 }); },
      tick: function () { S.tone({ f: N.A5, type: 'square', dur: .03, vol: .035, lp: 3000 }); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      lose: function () { S.tone({ f: [N.G4, N.C4], type: 'triangle', dur: .6, vol: .1 }); }
    }
  });
  S.scene(true);
})();
