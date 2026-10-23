/* ===== Presagio: musica e suoni ===== */
(function () {
  var S = Sound, N = S.N, PENTA = [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6, N.D6, N.E6, N.G6, N.A6, N.C7, N.D7, N.E7];
  S.setup({
    tracks: ['audio/m1.mp3', 'audio/m2.mp3'], musicVol: .3,
    credit: 'Musica: «Fireflies and Stardust» ed «Enchanted Valley» di Kevin MacLeod (incompetech.com, CC BY 3.0).',
    synth: {
      // carta giocata: fruscio più un rintocco di cristallo che sale con il valore
      play: function (o) { S.play('card'); var v = o.v || 7; S.bell({ f: PENTA[Math.max(0, Math.min(12, v - 1))] / 2, parts: [1, 2.76, 5.4], dur: .9, vol: .1, at: .08 }); },
      wizard: function () { S.play('card'); S.arp([N.E6, N.G6, N.B6, N.E7, N.G7], { bell: true, parts: [1, 2.76], step: .05, dur: 1, vol: .09 }); S.hiss({ ft: 'highpass', f: [4000, 9000], a: .2, dur: .8, vol: .05 }); },
      jester: function () { S.play('card'); S.tone({ f: [300, 900], type: 'square', dur: .12, vol: .05, lp: 2500 }); S.tone({ f: [900, 250], type: 'square', dur: .2, vol: .05, lp: 2500, at: .13 }); },
      trick: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6], { type: 'triangle', step: .055, dur: .5, vol: .1 }); S.bell({ f: N.G6, dur: 1.4, vol: .08, at: .3 }); },
      mytrick: function () { S.play('trick'); S.arp([N.C6, N.G6], { bell: true, step: .1, at: .35, dur: 1.4, vol: .1 }); },
      bid: function (o) { S.bell({ f: PENTA[Math.min(12, (o.b || 0) + 2)], dur: 1.1, vol: .13 }); },
      reveal: function () { S.arp([N.A5, N.C6, N.E6, N.A6], { bell: true, step: .1, dur: 1.2, vol: .1 }); },
      plus: function () { S.arp([N.E5, N.A5, N.E6], { bell: true, step: .08, dur: 1, vol: .1 }); },
      minus: function () { S.arp([N.E4, N.C4], { type: 'sine', step: .18, dur: .7, vol: .14 }); },
      trump: function () { S.hiss({ f: [800, 6000], q: .7, a: .15, dur: .6, vol: .08 }); S.arp([N.D5, N.A5, N.D6], { bell: true, step: .12, at: .2, dur: 1.4, vol: .1 }); },
      turn: function () { S.arp([N.E6, N.B6], { bell: true, parts: [1, 2.76, 5.4], step: .14, dur: 1.4, vol: .12 }); }
    }
  });
  S.scene(true);
})();
