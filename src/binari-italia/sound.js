/* ===== Binari d'Italia: suoni (carte, binari, fischio, campanella) ===== */
(function () {
  var S = Sound, N = S.N;
  function clack(at, f, v) { S.hiss({ ft: 'bandpass', f: [f || 1900, (f || 1900) * .7], q: 5, dur: .05, vol: v || .16, at: at || 0 }); S.tone({ f: [140, 90], type: 'square', dur: .05, vol: .05, lp: 900, at: at || 0 }); }
  function flick(at) { S.hiss({ ft: 'highpass', f: [2600, 5200], q: .7, a: .005, dur: .12, vol: .16, at: at || 0 }); }
  function paper(at) { S.hiss({ ft: 'bandpass', f: [1400, 3600], q: .9, a: .04, dur: .3, vol: .12, at: at || 0 }); }
  S.setup({
    tracks: (window.BI_TRACKS || []), musicVol: .22,
    credit: window.BI_CREDIT || 'Fischio a vapore: Work With Sounds / Konrad Gutkowski (CC BY 4.0, Wikimedia Commons); gli altri effetti sono sintetizzati nel browser.',
    samples: { whistle: { url: 'audio/whistle.mp3', vol: .32 } },
    synth: {
      draw: function () { flick(0); S.tone({ f: [N.E5, N.G5], type: 'triangle', dur: .12, vol: .05, at: .02 }); },
      draw2: function () { flick(0); flick(.12); },
      deal: function () { for (var i = 0; i < 4; i++) flick(i * .09); },
      claim: function (o) { var n = Math.min(6, (o && o.n) || 3); for (var i = 0; i < n; i++) { clack(i * .11, 2000 - i * 60); clack(i * .11 + .045, 1500 - i * 50, .1); } S.bell({ f: N.G5, dur: .5, vol: .07, at: n * .11 + .05 }); },
      ferry: function () { S.tone({ f: [N.D3, N.D3], type: 'sawtooth', dur: 1.1, vol: .07, lp: 700 }); S.tone({ f: [N.A3, N.A3], type: 'sawtooth', dur: 1.1, vol: .05, lp: 700 }); },
      whistle: function () { if (S.sample('whistle', { vary: .03 })) return; S.tone({ f: [N.A5, N.A5], type: 'sine', dur: .9, vol: .12 }); S.tone({ f: [N.Cs6, N.Cs6], type: 'sine', dur: .9, vol: .08 }); },
      tickets: function () { paper(0); paper(.16); },
      keep: function () { paper(0); S.bell({ f: N.E6, dur: .4, vol: .05, at: .1 }); },
      wipe: function () { for (var i = 0; i < 5; i++) flick(i * .06); S.tone({ f: [N.C5, N.G4], type: 'triangle', dur: .3, vol: .06, at: .3 }); },
      turn: function () { S.arp([N.C5, N.E5, N.G5], { bell: true, step: .1, dur: .8, vol: .1 }); },
      last: function () { for (var i = 0; i < 4; i++) S.bell({ f: N.A5, dur: .9, vol: .12, at: i * .32 }); },
      ticketok: function () { S.arp([N.C5, N.E5, N.G5, N.C6], { type: 'triangle', step: .08, dur: .4, vol: .12 }); },
      ticketko: function () { S.tone({ f: [N.E4, N.C4], type: 'triangle', dur: .45, vol: .1 }); },
      win: function () { S.arp([N.C5, N.E5, N.G5, N.C6, N.E6], { type: 'triangle', step: .12, dur: .6, vol: .15 }); }
    }
  });
  S.scene(true);
})();
