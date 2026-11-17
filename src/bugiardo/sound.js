/* ===== Dadi del bugiardo: suoni (dadi nel bicchiere, dichiarazioni, bicchieri alzati) ===== */
(function () {
  var S = Sound, N = S.N;
  function rattle(at, n) { for (var i = 0; i < (n || 7); i++) S.hiss({ ft: 'bandpass', f: [2600 + Math.random() * 1600, 1800], q: 3, a: .002, dur: .045, vol: .07, at: (at || 0) + i * .055 + Math.random() * .02 }); }
  S.setup({
    tracks: ['../binari-italia/audio/m1.mp3', '../presagio/audio/m2.mp3', '../binari-italia/audio/m3.mp3'], musicVol: .16,
    credit: 'Musica: «Carefree», «Enchanted Valley» e «Fluffing a Duck» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      roll: function () { rattle(0, 9); S.tone({ f: N.C3, type: 'sine', dur: .15, vol: .1, at: .55 }); },
      bid: function () { S.tone({ f: N.A5, type: 'triangle', dur: .1, vol: .07 }); },
      bidme: function () { S.arp([N.E5, N.A5], { type: 'triangle', step: .07, dur: .15, vol: .08 }); },
      click: function () { S.tone({ f: N.C6, type: 'square', dur: .03, vol: .04, lp: 2500 }); },
      lift: function () { S.hiss({ ft: 'highpass', f: [800, 2400], q: .7, a: .05, dur: .35, vol: .08 }); rattle(.25, 3); },
      good: function () { S.arp([N.C5, N.E5, N.G5, N.C6], { bell: true, parts: [1, 2.76, 5.4], step: .07, dur: .9, vol: .1 }); },
      bad: function () { S.tone({ f: [N.D4, N.A3], type: 'sawtooth', dur: .45, vol: .07, lp: 1200 }); },
      turn: function () { S.arp([N.G5, N.D6], { bell: true, parts: [1, 2.76, 5.4], step: .12, dur: 1, vol: .12 }); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      lose: function () { S.tone({ f: [N.G4, N.C4], type: 'triangle', dur: .6, vol: .1 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { type: 'triangle', step: .1, dur: .55, vol: .15 }); S.arp([N.C6, N.G6, N.C7], { bell: true, at: .6, step: .08, vol: .1, dur: 1.6 }); }
    }
  });
  S.scene(true);
})();
