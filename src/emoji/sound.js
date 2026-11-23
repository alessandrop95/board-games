/* ===== Emoji in scena: suoni (sipario, emoji, risposte, applausi) ===== */
(function () {
  var S = Sound, N = S.N;
  function applause(at, n) { for (var i = 0; i < (n || 14); i++) S.hiss({ ft: 'bandpass', f: [1500 + Math.random() * 2500, 1200], q: 2, a: .002, dur: .04, vol: .05, at: (at || 0) + Math.random() * .9 }); }
  S.setup({
    tracks: ['../binari-italia/audio/m1.mp3', '../presagio/audio/m2.mp3', '../binari-italia/audio/m3.mp3'], musicVol: .13,
    credit: 'Musica: «Carefree», «Enchanted Valley» e «Fluffing a Duck» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      turn: function () { S.arp([N.C5, N.E5, N.G5], { type: 'square', step: .08, dur: .2, vol: .05, lp: 2400 }); },
      myturn: function () { S.arp([N.G5, N.D6], { bell: true, parts: [1, 2.76, 5.4], step: .12, dur: 1, vol: .12 }); },
      pick: function () { S.tone({ f: N.A5, type: 'triangle', dur: .1, vol: .07 }); },
      emo: function () { S.tone({ f: N.E6 * (1 + Math.random() * .1), type: 'sine', dur: .09, vol: .07 }); },
      send: function () { S.tone({ f: N.C6, type: 'triangle', dur: .06, vol: .05 }); },
      guess: function () { S.tone({ f: N.G4, type: 'triangle', dur: .06, vol: .04 }); },
      mark: function () { S.arp([N.A5, N.E6], { type: 'triangle', step: .05, dur: .12, vol: .06 }); },
      hit: function () { S.arp([N.C5, N.E5, N.G5, N.C6], { bell: true, parts: [1, 2.76, 5.4], step: .07, dur: .9, vol: .1 }); applause(.2, 18); },
      steal: function () { S.arp([N.G4, N.D5, N.G5], { type: 'square', step: .1, dur: .3, vol: .06, lp: 2000 }); },
      miss: function () { S.tone({ f: [N.E4, N.A3], type: 'triangle', dur: .5, vol: .08 }); },
      tick: function () { S.tone({ f: N.A5, type: 'square', dur: .03, vol: .035, lp: 3000 }); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      lose: function () { S.tone({ f: [N.G4, N.C4], type: 'triangle', dur: .6, vol: .1 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { type: 'triangle', step: .1, dur: .55, vol: .15 }); applause(.4, 30); }
    }
  });
  S.scene(true);
})();
