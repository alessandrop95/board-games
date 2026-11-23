/* ===== Vocabolario bugiardo: suoni (pagine, penna, voti, risultati) ===== */
(function () {
  var S = Sound, N = S.N;
  S.setup({
    tracks: ['../binari-italia/audio/m1.mp3', '../presagio/audio/m2.mp3', '../binari-italia/audio/m3.mp3'], musicVol: .13,
    credit: 'Musica: «Carefree», «Enchanted Valley» e «Fluffing a Duck» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      word: function () { S.hiss({ ft: 'bandpass', f: [1800, 900], q: 1.2, a: .01, dur: .35, vol: .07 }); S.arp([N.D5, N.A5], { bell: true, parts: [1, 2.76, 5.4], step: .1, dur: .7, vol: .09, at: .2 }); },
      wrote: function () { S.tone({ f: N.G5, type: 'triangle', dur: .07, vol: .05 }); },
      sent: function () { S.hiss({ ft: 'highpass', f: [3000, 5000], q: .7, a: .005, dur: .12, vol: .05 }); S.tone({ f: N.C6, type: 'triangle', dur: .1, vol: .06, at: .05 }); },
      vote: function () { S.arp([N.E5, N.B5], { type: 'triangle', step: .06, dur: .2, vol: .07 }); },
      click: function () { S.tone({ f: N.C6, type: 'square', dur: .03, vol: .035, lp: 2500 }); },
      reveal: function () { S.arp([N.C5, N.G5, N.E6], { bell: true, parts: [1, 2.76, 5.4], step: .12, dur: 1, vol: .1 }); },
      good: function () { S.arp([N.C5, N.E5, N.G5, N.C6], { bell: true, parts: [1, 2.76, 5.4], step: .07, dur: .9, vol: .1 }); },
      fooled: function () { S.tone({ f: [N.C5, N.G4], type: 'triangle', dur: .3, vol: .07 }); S.tone({ f: [N.E5, N.B4], type: 'triangle', dur: .3, vol: .05, at: .1 }); },
      tick: function () { S.tone({ f: N.A5, type: 'square', dur: .03, vol: .035, lp: 3000 }); },
      turn: function () { S.arp([N.G5, N.D6], { bell: true, parts: [1, 2.76, 5.4], step: .12, dur: 1, vol: .1 }); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      lose: function () { S.tone({ f: [N.G4, N.C4], type: 'triangle', dur: .6, vol: .1 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { type: 'triangle', step: .1, dur: .55, vol: .15 }); S.arp([N.C6, N.G6, N.C7], { bell: true, at: .6, step: .08, vol: .1, dur: 1.6 }); }
    }
  });
  S.scene(true);
})();
