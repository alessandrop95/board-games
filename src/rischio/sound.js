/* ===== Dadi e rischio: suoni (dadi sul tavolo, monete, sballo, fila completa) ===== */
(function () {
  var S = Sound, N = S.N;
  function rattle(at, n) { for (var i = 0; i < (n || 7); i++) S.hiss({ ft: 'bandpass', f: [2400 + Math.random() * 1800, 1700], q: 3, a: .002, dur: .045, vol: .07, at: (at || 0) + i * .05 + Math.random() * .02 }); }
  S.setup({
    tracks: ['../binari-italia/audio/m1.mp3', '../presagio/audio/m2.mp3', '../binari-italia/audio/m3.mp3'], musicVol: .15,
    credit: 'Musica: «Carefree», «Enchanted Valley» e «Fluffing a Duck» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      roll: function () { rattle(0, 8); S.tone({ f: N.C3, type: 'sine', dur: .12, vol: .1, at: .45 }); S.tone({ f: N.G2, type: 'sine', dur: .1, vol: .08, at: .55 }); },
      pick: function () { S.tone({ f: N.E6, type: 'triangle', dur: .06, vol: .06 }); },
      unpick: function () { S.tone({ f: N.B5, type: 'triangle', dur: .05, vol: .05 }); },
      bank: function () { S.arp([N.E6, N.B6, N.E7], { bell: true, parts: [1, 2.76, 5.4], step: .06, dur: .5, vol: .08 }); },
      bust: function () { S.tone({ f: [N.E4, N.A3], type: 'sawtooth', dur: .5, vol: .08, lp: 1100 }); S.tone({ f: [N.As3, N.E3], type: 'square', dur: .5, vol: .04, lp: 800, at: .12 }); },
      row: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6], { type: 'triangle', step: .07, dur: .35, vol: .12 }); },
      last: function () { S.arp([N.G4, N.D5, N.G5], { type: 'square', step: .12, dur: .3, vol: .06, lp: 2000 }); },
      turn: function () { S.arp([N.G5, N.D6], { bell: true, parts: [1, 2.76, 5.4], step: .12, dur: 1, vol: .12 }); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      lose: function () { S.tone({ f: [N.G4, N.C4], type: 'triangle', dur: .6, vol: .1 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { type: 'triangle', step: .1, dur: .55, vol: .15 }); S.arp([N.C6, N.G6, N.C7], { bell: true, at: .6, step: .08, vol: .1, dur: 1.6 }); }
    }
  });
  S.scene(true);
})();
