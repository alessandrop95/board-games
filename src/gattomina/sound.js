/* ===== Gattomina: musica e suoni ===== */
(function () {
  var S = Sound, N = S.N, MEOWS = ['meow', 'meow2', 'meow3'];
  function meow(o) { o = o || {}; S.sample(MEOWS[Math.floor(Math.random() * MEOWS.length)], { vol: o.vol || .8, rate: o.rate || 1, at: o.at || 0 }); }
  function pop(at, f) { S.tone({ f: [f || 420, (f || 420) * 2.2], type: 'sine', dur: .08, vol: .22, at: at || 0 }); }
  function boing(at, up) { S.tone({ f: up ? [180, 520] : [520, 140], type: 'triangle', dur: .35, vol: .16, at: at || 0 }); S.tone({ f: up ? [185, 530] : [530, 145], type: 'sine', dur: .35, vol: .1, at: at || 0, detune: 30 }); }
  function sizzle(dur, at) { S.hiss({ ft: 'highpass', f: [5000, 7000], q: .5, a: .05, dur: dur || 1, vol: .12, at: at || 0 }); for (var i = 0; i < dur * 12; i++) S.hiss({ f: 6000 + Math.random() * 3000, q: 4, dur: .03, vol: .08, at: (at || 0) + Math.random() * dur }); }
  S.setup({
    tracks: ['audio/m1.mp3', 'audio/m2.mp3'], musicVol: .26,
    credit: 'Musica: «Monkeys Spinning Monkeys» e «Sneaky Snitch» di Kevin MacLeod (incompetech.com, CC BY 3.0). Miagolii, fusa e soffio da Wikimedia Commons (Dcrosby, CC BY-SA 3.0; pubblico dominio; Zabuhailo, CC0).',
    samples: { meow: { url: 'audio/meow.mp3', vol: .8 }, meow2: { url: 'audio/meow2.mp3', vol: .7 }, meow3: { url: 'audio/meow3.mp3', vol: .7 }, purr: { url: 'audio/purr.mp3', vol: .9 }, hiss: { url: 'audio/hiss.mp3', vol: .8 }, explosion: { url: 'audio/explosion.mp3', vol: 1 } },
    synth: {
      draw: function () { S.play('card'); pop(.06, 380); },
      play: function () { S.play('swoosh'); pop(.12, 520); },
      cats: function () { S.play('swoosh'); meow({ at: .15 }); },
      nope: function () { S.sample('hiss', { vol: .9 }) || S.hiss({ f: [3000, 6000], q: .6, a: .02, dur: .7, vol: .3 }); boing(.15, false); },
      cancel: function () { boing(0, false); },
      attack: function () { S.tone({ f: [110, 70], type: 'sawtooth', dur: .45, vol: .14, lp: 700 }); meow({ at: .3, rate: .85 }); for (var i = 0; i < 4; i++) pop(.6 + i * .12, 300 + i * 60); },
      skip: function () { for (var k = 0; k < 2; k++) { S.hiss({ ft: 'lowpass', f: [400, 900], a: .5, dur: .6, vol: .18, at: k * 1.2 }); S.tone({ f: [N.A5, N.E5], type: 'sine', dur: .4, vol: .06, at: k * 1.2 + .6 }); } },
      shuffle: function () { S.play('shuffle'); boing(.6, true); },
      future: function () { S.arp([N.C6, N.E6, N.G6, N.B6, N.D7], { bell: true, parts: [1, 2.76], step: .07, dur: 1.2, vol: .1 }); S.hiss({ ft: 'highpass', f: [5000, 9000], a: .2, dur: .9, vol: .05 }); },
      steal: function () { S.play('swoosh'); meow({ at: .2, rate: 1.15, vol: .6 }); },
      fuse: function () { sizzle(1.4, 0); S.tone({ f: N.C4, type: 'triangle', dur: .1, vol: .12, at: .2 }); S.tone({ f: N.C4, type: 'triangle', dur: .1, vol: .12, at: .6 }); S.tone({ f: N.Cs4, type: 'triangle', dur: .1, vol: .14, at: 1 }); },
      boom: function () { if (!S.sample('explosion', { vary: .02 })) { S.hiss({ ft: 'lowpass', f: [1500, 60], dur: 1.8, vol: .9 }); } S.tone({ f: [90, 40], type: 'sine', dur: 1, vol: .5 }); meow({ at: .9, rate: .8, vol: .5 }); S.duck(2600); },
      defuse: function () { S.bell({ f: N.E6, dur: .9, vol: .14 }); S.arp([N.C5, N.E5, N.G5, N.C6], { type: 'triangle', step: .08, at: .1, dur: .4, vol: .12 }); S.sample('purr', { at: .4, vol: .8 }); },
      insert: function () { S.hiss({ f: [2500, 1200], q: .6, a: .1, dur: .5, vol: .1 }); S.hiss({ ft: 'highpass', f: 4000, a: .15, dur: .6, vol: .08, at: .5 }); },
      miss: function () { boing(0, false); },
      turn: function () { meow({ vol: .55, rate: 1.1 }); S.arp([N.G5, N.C6], { bell: true, step: .12, at: .3, dur: .8, vol: .1 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6], { type: 'triangle', step: .1, dur: .5, vol: .16 }); S.sample('purr', { at: .5 }); meow({ at: 1.2 }); }
    }
  });
  S.scene(true);
})();
