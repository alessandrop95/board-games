/* ===== Conquista l’Italia: suoni (domanda, risposta giusta, conquista) ===== */
(function () {
  var S = Sound, N = S.N;
  function scratch(at, v) { S.hiss({ ft: 'bandpass', f: [3200, 2400], q: 1.2, a: .01, dur: .09, vol: v || .08, at: at || 0 }); }
  function tick(at) { S.tone({ f: 1800, type: 'square', dur: .025, vol: .035, lp: 3000, at: at || 0 }); }
  S.setup({
    tracks: ['../binari-italia/audio/m1.mp3', '../binari-italia/audio/m3.mp3', '../presagio/audio/m2.mp3'], musicVol: .18,
    credit: 'Musica: «Carefree», «Fluffing a Duck» ed «Enchanted Valley» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      write: function () { scratch(0, .06); scratch(.06, .05); },
      mate: function () { S.tone({ f: N.E6, type: 'sine', dur: .06, vol: .03 }); },
      deal: function () { S.arp([N.C5, N.G5, N.C6], { type: 'triangle', step: .08, dur: .3, vol: .1 }); S.bell({ f: N.E6, dur: .9, vol: .08, at: .25 }); },
      stop: function () { S.bell({ f: N.A5, dur: 1.2, vol: .14 }); S.bell({ f: N.A5, dur: 1.2, vol: .12, at: .22 }); S.bell({ f: N.A5, dur: 1.4, vol: .1, at: .44 }); },
      tick: function () { tick(0); },
      last: function () { tick(0); tick(.5); },
      reveal: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6], { bell: true, parts: [1, 2.76, 5.4], step: .06, dur: 1, vol: .1 }); },
      flag: function () { S.tone({ f: [N.A4, N.E4], type: 'sawtooth', dur: .22, vol: .06, lp: 1400 }); },
      vote: function () { S.tone({ f: N.G5, type: 'triangle', dur: .07, vol: .06 }); },
      good: function () { S.bell({ f: N.E6, dur: .8, vol: .08 }); },
      turn: function () { S.arp([N.G5, N.D6], { bell: true, parts: [1, 2.76, 5.4], step: .12, dur: 1, vol: .12 }); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      lose: function () { S.tone({ f: [N.G4, N.C4], type: 'triangle', dur: .6, vol: .1 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { type: 'triangle', step: .1, dur: .55, vol: .15 }); S.arp([N.C6, N.G6, N.C7], { bell: true, at: .6, step: .08, vol: .1, dur: 1.6 }); }
    }
  });
  S.scene(true);
})();
