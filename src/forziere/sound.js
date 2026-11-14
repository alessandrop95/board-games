/* ===== Il Forziere Maledetto: suoni (cannoni, onde, legno, monete, spettri) ===== */
(function () {
  var S = Sound, N = S.N;
  function flick(at, v) { S.hiss({ ft: 'highpass', f: [2600, 5600], q: .7, a: .004, dur: .08, vol: v || .16, at: at || 0 }); }
  function wood(at, v) { S.hiss({ ft: 'bandpass', f: [700, 320], q: 3, a: .002, dur: .09, vol: v || .16, at: at || 0 }); S.tone({ f: [180, 110], type: 'triangle', dur: .1, vol: .07, lp: 900, at: at || 0 }); }
  function surf(at, dur, vol) { S.hiss({ ft: 'bandpass', f: [400, 1300], q: .5, a: dur * .45, dur: dur, vol: vol || .08, at: at || 0 }); }
  function boom(at, v) { S.hiss({ ft: 'lowpass', f: [1800, 120], q: .8, a: .003, dur: .6, vol: v || .3, at: at || 0 }); S.tone({ f: [95, 38], type: 'sine', dur: .55, vol: .26, at: at || 0 }); }
  S.setup({
    tracks: ['../catan/audio/m1.mp3', '../catan/audio/m2.mp3', '../catan/audio/m3.mp3'], musicVol: .16,
    credit: 'Musica: «Thatched Villagers», «Pippin the Hunchback» e «Minstrel Guild» di Kevin MacLeod (incompetech.com, CC BY 3.0). Gli effetti sono sintetizzati nel browser.',
    samples: {},
    synth: {
      deal: function () { for (var i = 0; i < 10; i++) flick(i * .05, .1); },
      draw: function () { flick(0, .12); surf(0, .25, .04); },
      play: function () { flick(0, .14); wood(.03, .08); },
      pick: function () { flick(0, .1); },
      cannon: function () { boom(0, .32); surf(.2, .6, .05); },
      musket: function () { S.hiss({ ft: 'highpass', f: [1800, 600], q: .7, a: .001, dur: .18, vol: .22 }); S.tone({ f: [400, 120], type: 'square', dur: .08, vol: .05, lp: 1500 }); },
      hit: function () { wood(0, .2); wood(.08, .12); S.hiss({ ft: 'lowpass', f: [900, 200], q: 1, a: .002, dur: .3, vol: .12, at: .04 }); },
      miss: function () { surf(0, .5, .12); S.tone({ f: [N.A5, N.E6], type: 'sine', dur: .18, vol: .05, at: .1 }); },
      splash: function () { surf(0, .9, .16); S.hiss({ ft: 'highpass', f: [1200, 3000], q: .6, a: .02, dur: .5, vol: .1, at: .05 }); },
      sink: function () { boom(0, .2); surf(.1, 1.6, .16); S.tone({ f: [N.C4, N.G2], type: 'triangle', dur: 1.4, vol: .1, at: .2 }); },
      coin: function () { S.arp([N.E6, N.B6, N.E7], { bell: true, parts: [1, 2.76, 5.4], step: .06, dur: .7, vol: .09 }); },
      heal: function () { S.tone({ f: [N.C5, N.G5], type: 'triangle', dur: .25, vol: .07 }); S.bell({ f: N.E6, dur: .6, vol: .05, at: .12 }); },
      ghost: function () { S.tone({ f: [N.E4, N.Ds4], type: 'sine', dur: 1.4, vol: .07 }); S.tone({ f: [N.B4, N.As4], type: 'sine', dur: 1.4, vol: .05, at: .2 }); surf(0, 1.2, .06); },
      gorgo: function () { S.tone({ f: [220, 55], type: 'sawtooth', dur: 1.8, vol: .08, lp: 600 }); surf(0, 2, .14); },
      chest: function () { wood(0, .14); S.arp([N.G4, N.C5, N.E5], { type: 'triangle', step: .08, dur: .4, vol: .09, at: .05 }); },
      promo: function () { S.arp([N.C5, N.E5, N.G5, N.C6], { type: 'triangle', step: .09, dur: .5, vol: .12 }); },
      turn: function () { S.bell({ f: N.G5, dur: 1, vol: .1 }); S.bell({ f: N.G5, dur: 1, vol: .08, at: .35 }); },
      shield: function () { S.tone({ f: [N.A4, N.A5], type: 'square', dur: .18, vol: .05, lp: 2200 }); S.bell({ f: N.E6, dur: 1, vol: .1, at: .1 }); },
      no: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .25, vol: .07 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], { type: 'triangle', step: .1, dur: .55, vol: .15 }); S.arp([N.C6, N.G6, N.C7], { bell: true, at: .6, step: .08, vol: .1, dur: 1.6 }); },
      lose: function () { S.tone({ f: [N.G4, N.C4], type: 'triangle', dur: .6, vol: .12 }); S.tone({ f: [N.E4, N.A3], type: 'sine', dur: .7, vol: .08, at: .15 }); }
    }
  });
  S.scene(true);
})();
