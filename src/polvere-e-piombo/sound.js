/* ===== Polvere & Piombo: musica e suoni ===== */
(function () {
  var S = Sound, N = S.N;
  function thud(at, f, v) { S.tone({ f: [f || 120, 50], type: 'sine', dur: .16, vol: v || .45, at: at }); S.hiss({ ft: 'lowpass', f: 380, dur: .12, vol: (v || .45) * .5, at: at }); }
  S.setup({
    tracks: ['audio/m1.mp3', 'audio/m2.mp3'], musicVol: .28,
    credit: 'Musica: «Western Streets» di Kevin MacLeod (incompetech.com, CC BY 3.0) e «Maple Leaf Rag» suonata da Scott Joplin (1916, pubblico dominio).',
    samples: { gunshot: { url: 'audio/gunshot.mp3', vol: .9 }, explosion: { url: 'audio/explosion.mp3', vol: 1 }, horse: { url: 'audio/horse.mp3', vol: .8 } },
    synth: {
      shot: function () { if (!S.sample('gunshot')) { S.hiss({ ft: 'lowpass', f: [3000, 300], dur: .3, vol: .7 }); thud(0, 160, .5); } },
      gatling: function () { for (var i = 0; i < 9; i++) if (!S.sample('gunshot', { at: i * .11, vol: .7, dur: .3, vary: .12 })) S.hiss({ ft: 'lowpass', f: [3000, 400], dur: .12, vol: .5, at: i * .11 }); },
      ricochet: function () { S.tone({ f: [3200, 700], type: 'sine', dur: .5, slide: .5, vol: .09 }); S.hiss({ f: [6000, 2500], q: 3, dur: .3, vol: .05 }); },
      hit: function () { thud(0, 130, .5); S.hiss({ f: [900, 200], q: .8, dur: .25, vol: .12 }); },
      boom: function () { if (!S.sample('explosion')) { S.hiss({ ft: 'lowpass', f: [1200, 60], dur: 1.6, vol: .9 }); thud(0, 80, .8); } S.duck(2200); },
      heal: function () { S.bell({ f: 2093, parts: [1, 2.02, 3.1], dur: .8, vol: .16 }); S.bell({ f: 2637, parts: [1, 2.02, 3.1], dur: .8, vol: .12, at: .12 }); S.hiss({ f: [1800, 900], q: 2, a: .05, dur: .5, vol: .05, at: .2 }); },
      cheers: function () { for (var i = 0; i < 5; i++) S.bell({ f: 1900 + Math.random() * 900, parts: [1, 2.02, 3.1], dur: .6, vol: .12, at: i * .09 + Math.random() * .05 }); },
      death: function () { S.bell({ f: 98, parts: [1, 2, 2.4, 3, 4.2, 5.4], dur: 3.2, vol: .35 }); S.bell({ f: 98, parts: [1, 2, 2.4, 3, 4.2, 5.4], dur: 3.2, vol: .25, at: 1.4 }); S.duck(3000); },
      jail: function () { S.bell({ f: 330, parts: [1, 2.3, 3.7, 5.1, 7.2], dur: .9, vol: .22 }); S.hiss({ ft: 'highpass', f: 3000, dur: .1, vol: .15 }); S.bell({ f: 262, parts: [1, 2.3, 3.7], dur: .6, vol: .15, at: .18 }); },
      safe: function () { thud(0, 90, .5); S.bell({ f: 180, parts: [1, 2.6, 4.1], dur: .5, vol: .15, at: .05 }); for (var i = 0; i < 6; i++) S.bell({ f: 3000 + Math.random() * 1500, parts: [1, 1.8], dur: .3, vol: .07, at: .3 + i * .07 }); },
      shopbell: function () { S.bell({ f: 1760, parts: [1, 2.4, 4.5], dur: 1.1, vol: .18 }); S.bell({ f: 1760, parts: [1, 2.4, 4.5], dur: 1.1, vol: .12, at: .16 }); },
      post: function () { if (!S.sample('horse', { vol: .7 })) S.tone({ f: [700, 1200], type: 'sawtooth', dur: .5, vol: .05, lp: 1800 }); for (var i = 0; i < 8; i++) thud(.1 + i * .13, 220 + (i % 2) * 40, .18); },
      stampede: function () { S.sample('horse', { vol: .6, rate: .9 }); S.hiss({ ft: 'lowpass', f: [180, 90], a: .3, dur: 2.2, vol: .55 }); for (var i = 0; i < 22; i++) thud(i * .09 + Math.random() * .04, 160 + Math.random() * 80, .22); S.duck(2500); },
      duel: function () { S.tone({ f: N.E5, type: 'sine', dur: .5, vol: .12, a: .05 }); S.tone({ f: [N.E5, N.B5], type: 'sine', dur: .9, vol: .12, at: .55, a: .05 }); S.tone({ f: [N.B5, N.A5], type: 'sine', dur: .6, slide: .15, vol: .1, at: 1.45, a: .02 }); },
      check: function () { S.play('card'); S.tone({ f: N.A3, type: 'triangle', dur: .12, vol: .12, at: .2 }); S.tone({ f: N.A3, type: 'triangle', dur: .12, vol: .12, at: .45 }); },
      good: function () { S.arp([N.G4, N.B4, N.D5], { type: 'triangle', step: .07, dur: .3, vol: .14 }); },
      bad: function () { S.arp([N.D4, N.As3], { type: 'triangle', step: .15, dur: .35, vol: .14 }); },
      spurs: function () { for (var i = 0; i < 3; i++) S.bell({ f: 4200 + i * 300, parts: [1, 1.5, 2.3], dur: .25, vol: .08, at: i * .07 }); },
      turn: function () { S.play('spurs'); S.tone({ f: N.D5, type: 'sine', dur: .25, vol: .1, at: .25, a: .03 }); S.tone({ f: N.G5, type: 'sine', dur: .5, vol: .1, at: .45, a: .03 }); },
      win: function () { S.arp([N.G4, N.C5, N.E5, N.G5, N.C6], { type: 'triangle', step: .13, dur: .5, vol: .18 }); for (var i = 0; i < 3; i++) S.sample('gunshot', { at: .8 + i * .35, vol: .6 }); }
    }
  });
  S.scene(true);
})();
