/* ===== Suoni e musica (condiviso) =====
   Musica di sottofondo da file (licenze libere), effetti in parte registrati e in parte sintetizzati con Web Audio.
   Le preferenze (musica / effetti) valgono per questo telefono. Il suono parte solo dopo il primo tocco (regole dei browser). */
var Sound = (function () {
  var ctx = null, master = null, sfxBus = null, musicBus = null, buffers = {}, loading = {}, cfg = { tracks: [], samples: {}, synth: {}, musicVol: .32 };
  var musicOn = read('bg-music', true), sfxOn = read('bg-sfx', true), unlocked = false, wantMusic = false;
  var audioEl = null, trackIdx = 0, lastPlay = {};
  function read(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) {} }

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = .9;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 1 : 0; sfxBus.connect(master);
    return ctx;
  }
  function unlock() {
    if (unlocked) return; unlocked = true;
    ensure(); if (ctx && ctx.state === 'suspended') ctx.resume();
    Object.keys(cfg.samples).forEach(load);
    if (musicOn && wantMusic) startMusic();
  }
  ['pointerdown', 'keydown', 'touchend'].forEach(function (ev) { document.addEventListener(ev, unlock, { capture: true, passive: true }); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (audioEl) audioEl.pause(); if (ctx && ctx.state === 'running') ctx.suspend(); }
    else { if (ctx && unlocked) ctx.resume(); if (audioEl && musicOn && wantMusic && unlocked) audioEl.play().catch(function () {}); }
  });

  /* ---------- campioni registrati ---------- */
  function load(name) {
    if (buffers[name] || loading[name] || !ensure()) return;
    var s = cfg.samples[name]; loading[name] = true;
    fetch(s.url).then(function (r) { return r.arrayBuffer(); }).then(function (a) {
      return new Promise(function (ok, ko) { ctx.decodeAudioData(a, ok, ko); });
    }).then(function (b) { buffers[name] = b; }).catch(function () { loading[name] = false; });
  }
  function sample(name, o) {
    o = o || {}; var b = buffers[name], s = cfg.samples[name];
    if (!b) { load(name); return false; }
    var src = ctx.createBufferSource(); src.buffer = b;
    src.playbackRate.value = (o.rate || 1) * (1 + (o.vary == null ? .06 : o.vary) * (Math.random() * 2 - 1));
    var g = ctx.createGain(); g.gain.value = (s.vol || 1) * (o.vol || 1);
    src.connect(g); g.connect(sfxBus);
    var off = s.start || 0, dur = o.dur || s.dur;
    src.start(ctx.currentTime + (o.at || 0), off, dur);
    if (dur) { g.gain.setValueAtTime(g.gain.value, ctx.currentTime + (o.at || 0) + dur * .8); g.gain.linearRampToValueAtTime(0, ctx.currentTime + (o.at || 0) + dur); }
    return true;
  }

  /* ---------- piccolo sintetizzatore ---------- */
  var noiseBuf = null;
  function noise() {
    if (noiseBuf) return noiseBuf;
    var n = ctx.sampleRate * 2; noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  function env(g, t, a, d, peak, sus) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(.0001, sus || .0001), t + a + d); }
  // tono: f frequenza (o [da, a]), type, dur, vol, at, a(ttacco)
  function tone(o) {
    var t = ctx.currentTime + (o.at || 0), osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    var f = o.f instanceof Array ? o.f : [o.f, o.f];
    osc.frequency.setValueAtTime(f[0], t); if (f[1] !== f[0]) osc.frequency.exponentialRampToValueAtTime(f[1], t + (o.slide || o.dur || .2));
    if (o.detune) osc.detune.value = o.detune;
    env(g, t, o.a || .005, o.dur || .2, o.vol || .3);
    var out = g;
    if (o.lp) { var fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; g.connect(fl); out = fl; }
    osc.connect(g); out.connect(sfxBus);
    osc.start(t); osc.stop(t + (o.a || .005) + (o.dur || .2) + .05);
  }
  // rumore filtrato: tipo filtro, frequenza (o [da, a]), q, dur, vol
  function hiss(o) {
    var t = ctx.currentTime + (o.at || 0), src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise(); src.loop = true;
    fl.type = o.ft || 'bandpass'; fl.Q.value = o.q || 1;
    var f = o.f instanceof Array ? o.f : [o.f || 2000, o.f || 2000];
    fl.frequency.setValueAtTime(f[0], t); fl.frequency.exponentialRampToValueAtTime(f[1], t + (o.dur || .2));
    env(g, t, o.a || .005, o.dur || .2, o.vol || .3);
    src.connect(fl); fl.connect(g); g.connect(sfxBus);
    src.start(t, Math.random()); src.stop(t + (o.a || .005) + (o.dur || .2) + .05);
  }
  // campanella: parziali inarmonici (vetro, cristallo, campana)
  function bell(o) {
    var parts = o.parts || [1, 2.76, 5.4, 8.93];
    parts.forEach(function (m, i) { tone({ f: o.f * m, type: 'sine', dur: (o.dur || 1.2) / (1 + i * .7), vol: (o.vol || .2) / (1 + i * 1.3), at: o.at, a: .002 }); });
  }
  function arp(notes, o) { o = o || {}; notes.forEach(function (n, i) { (o.bell ? bell : tone)({ f: n, type: o.type || 'triangle', dur: o.dur || .35, vol: o.vol || .18, at: (o.at || 0) + i * (o.step || .08), parts: o.parts }); }); }
  var N = {}; (function () { var names = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B']; for (var o = 2; o <= 7; o++) names.forEach(function (n, i) { N[n + o] = 440 * Math.pow(2, (o - 4) + (i - 9) / 12); }); })();

  // effetti comuni a tutti i giochi
  var BASE = {
    tap: function () { tone({ f: [900, 600], type: 'triangle', dur: .05, vol: .12 }); },
    card: function () { hiss({ f: [5200, 2400], q: .8, dur: .09, vol: .28 }); tone({ f: [180, 120], type: 'sine', dur: .05, vol: .12, at: .04 }); },
    deal: function () { for (var i = 0; i < 6; i++) hiss({ f: [6000, 3000], q: .9, dur: .06, vol: .2, at: i * .07 }); },
    swoosh: function () { hiss({ f: [800, 4800], ft: 'bandpass', q: 1.2, a: .08, dur: .28, vol: .22 }); },
    shuffle: function () { for (var i = 0; i < 14; i++) hiss({ f: [4500, 2500], q: 1.4, dur: .04, vol: .12 + Math.random() * .08, at: i * .045 + Math.random() * .01 }); },
    turn: function () { arp([N.E5, N.A5], { bell: true, vol: .16, step: .12, dur: .9 }); },
    chat: function () { tone({ f: N.A5, type: 'sine', dur: .12, vol: .12 }); tone({ f: N.E6, type: 'sine', dur: .2, vol: .1, at: .08 }); },
    error: function () { tone({ f: [220, 180], type: 'square', dur: .14, vol: .07, lp: 1200 }); },
    win: function () { arp([N.C5, N.E5, N.G5, N.C6], { type: 'triangle', step: .12, dur: .5, vol: .2 }); arp([N.C6, N.E6, N.G6], { bell: true, at: .5, step: .06, vol: .12, dur: 1.4 }); },
    lose: function () { arp([N.G4, N.Ds4, N.C4], { type: 'triangle', step: .22, dur: .6, vol: .18 }); }
  };
  function play(name, o) {
    if (!sfxOn || !unlocked || !ensure() || ctx.state !== 'running') return;
    var now = performance.now(); if (lastPlay[name] && now - lastPlay[name] < 45) return; lastPlay[name] = now; // niente raffiche identiche
    try {
      var f = cfg.synth[name] || BASE[name];
      if (f) f(o || {}, api);
      else if (cfg.samples[name]) sample(name, o);
    } catch (e) {}
  }

  /* ---------- musica ---------- */
  function startMusic() {
    if (!cfg.tracks.length) return;
    if (!audioEl) {
      audioEl = new Audio(); audioEl.preload = 'auto'; audioEl.volume = cfg.musicVol;
      audioEl.addEventListener('ended', function () { trackIdx = (trackIdx + 1) % cfg.tracks.length; audioEl.src = cfg.tracks[trackIdx]; audioEl.play().catch(function () {}); });
      trackIdx = Math.floor(Math.random() * cfg.tracks.length); audioEl.src = cfg.tracks[trackIdx];
    }
    fadeTo(cfg.musicVol);
    audioEl.play().catch(function () {});
  }
  var fadeTimer = null;
  function fadeTo(v, then) {
    if (!audioEl) return; clearInterval(fadeTimer);
    fadeTimer = setInterval(function () {
      var cur = audioEl.volume, step = .03;
      if (Math.abs(cur - v) <= step) { audioEl.volume = v; clearInterval(fadeTimer); if (then) then(); return; }
      audioEl.volume = cur + (v > cur ? step : -step);
    }, 40);
  }
  function stopMusic() { if (audioEl) fadeTo(0, function () { audioEl.pause(); }); }
  function duck(ms) { if (!audioEl || audioEl.paused) return; fadeTo(cfg.musicVol * .35); setTimeout(function () { if (musicOn && wantMusic) fadeTo(cfg.musicVol); }, ms || 1500); }

  function setMusic(v) { musicOn = !!v; write('bg-music', musicOn); if (musicOn && wantMusic && unlocked) startMusic(); else stopMusic(); paint(); }
  function setSfx(v) { sfxOn = !!v; write('bg-sfx', sfxOn); if (sfxBus) sfxBus.gain.value = sfxOn ? 1 : 0; paint(); if (sfxOn) play('tap'); }
  // la musica suona solo dentro i giochi (home e tavolo), e si spegne se il gioco lo chiede
  function scene(on) { wantMusic = !!on; if (wantMusic && musicOn && unlocked) startMusic(); else if (!wantMusic) stopMusic(); }

  var css = '.snd-btn{appearance:none;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.07);color:inherit;border-radius:999px;min-height:36px;min-width:38px;padding:4px 9px;cursor:pointer;display:inline-grid;place-items:center;font-size:17px;line-height:1}' +
    '.snd-btn svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '.snd-pop{position:fixed;z-index:75;min-width:230px;padding:10px;border-radius:14px;background:#1d1a2a;color:#f4eefc;box-shadow:0 12px 30px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.15);display:grid;gap:6px;font:15px/1.3 system-ui,sans-serif}' +
    '.snd-pop label{display:flex;align-items:center;gap:10px;padding:8px 6px;border-radius:10px;cursor:pointer}.snd-pop label:hover{background:rgba(255,255,255,.06)}' +
    '.snd-pop input{width:20px;height:20px;accent-color:#e6c278}.snd-pop small{opacity:.65;font-size:12px;padding:0 6px}';
  function ensureCss() { if (!document.getElementById('snd-css')) { var s = document.createElement('style'); s.id = 'snd-css'; s.textContent = css; document.head.appendChild(s); } }
  var ICON_ON = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  function buttonHTML() { ensureCss(); var on = musicOn || sfxOn; return '<button class="snd-btn" data-snd="menu" aria-label="Suoni e musica">' + (on ? ICON_ON : ICON_OFF) + '</button>'; }
  function paint() {
    document.querySelectorAll('[data-snd="menu"]').forEach(function (b) { b.innerHTML = musicOn || sfxOn ? ICON_ON : ICON_OFF; });
    var p = document.querySelector('.snd-pop'); if (p) { p.querySelector('#snd-m').checked = musicOn; p.querySelector('#snd-s').checked = sfxOn; }
  }
  function openPop(btn) {
    var old = document.querySelector('.snd-pop'); if (old) { old.remove(); return; }
    unlock();
    var r = btn.getBoundingClientRect(), p = document.createElement('div'); p.className = 'snd-pop';
    p.innerHTML = '<label><input type="checkbox" id="snd-m"' + (musicOn ? ' checked' : '') + '> Musica di sottofondo</label><label><input type="checkbox" id="snd-s"' + (sfxOn ? ' checked' : '') + '> Effetti sonori</label><small>' + (cfg.credit || '') + '</small>';
    document.body.appendChild(p);
    var w = p.offsetWidth; p.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + 'px'; p.style.top = (r.bottom + 6) + 'px';
    p.addEventListener('change', function (e) { if (e.target.id === 'snd-m') setMusic(e.target.checked); if (e.target.id === 'snd-s') setSfx(e.target.checked); });
    setTimeout(function () { document.addEventListener('click', function off(e) { if (!p.contains(e.target) && !e.target.closest('[data-snd]')) { p.remove(); document.removeEventListener('click', off, true); } }, true); }, 0);
  }
  document.addEventListener('click', function (e) { if (e.target.closest('.btn,.iconbtn,.pbtn,.opt,.trow button') && !e.target.closest('[disabled]')) play('tap'); }, true);
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-snd="menu"]'); if (b) { e.preventDefault(); e.stopPropagation(); openPop(b); } }, true);

  function setup(c) { for (var k in c) cfg[k] = c[k]; if (unlocked) Object.keys(cfg.samples).forEach(load); }
  var api = { setup: setup, play: play, scene: scene, duck: duck, buttonHTML: buttonHTML, setMusic: setMusic, setSfx: setSfx,
    tone: function (o) { tone(o); }, hiss: function (o) { hiss(o); }, bell: function (o) { bell(o); }, arp: arp, sample: function (n, o) { return sample(n, o); }, N: N,
    get music() { return audioEl ? { paused: audioEl.paused, t: audioEl.currentTime, src: audioEl.src.split('/').pop(), vol: audioEl.volume } : null; }, get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; }, get ready() { return unlocked && ctx && ctx.state === 'running'; } };
  return api;
})();
