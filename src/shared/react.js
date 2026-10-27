/* ===== Reazioni rapide al tavolo (condivise): un tocco e tutti vedono l'emoji per qualche secondo =====
   Il pulsante sta accanto a «Chat» nella barra in alto (Chat.badgeHTML lo aggiunge). Passano direttamente
   tra i giocatori sul canale «react» del tavolo, come la chat, senza cronologia. */
var Reactions = (function () {
  var EMO = ['😂', '👏', '😱', '😡', '😎', '🤞', '🙏', '💀'];
  var last = 0, seen = {}, open = false;
  var CSS = '.rx-btn{min-width:40px}.rx-pick{position:fixed;z-index:9990;top:calc(54px + env(safe-area-inset-top,0px));right:max(8px,env(safe-area-inset-right,0px));display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:8px;border-radius:16px;background:#1d1b22;border:1px solid rgba(255,255,255,.18);box-shadow:0 12px 30px rgba(0,0,0,.5);animation:rxin .15s ease-out}' +
    '.rx-pick button{appearance:none;border:0;background:rgba(255,255,255,.06);border-radius:12px;font-size:28px;line-height:1;width:52px;height:52px;cursor:pointer}.rx-pick button:active{transform:scale(.9)}' +
    '.rx-lay{position:fixed;left:0;right:0;top:calc(64px + env(safe-area-inset-top,0px));z-index:9989;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:6px}' +
    '.rx-b{display:inline-flex;align-items:center;gap:8px;padding:6px 14px 6px 8px;border-radius:999px;background:rgba(20,18,26,.88);color:#fff;font:600 15px system-ui,sans-serif;box-shadow:0 8px 20px rgba(0,0,0,.4);animation:rxpop 3.2s ease-out forwards}' +
    '.rx-b i{font-style:normal;font-size:34px;line-height:1;animation:rxbig .6s ease-out}' +
    '@keyframes rxin{from{opacity:0;transform:translateY(-6px)}}@keyframes rxbig{0%{transform:scale(.3)}60%{transform:scale(1.35)}100%{transform:scale(1)}}' +
    '@keyframes rxpop{0%{opacity:0;transform:translateY(-10px)}10%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}' +
    '@media (prefers-reduced-motion: reduce){.rx-b,.rx-b i,.rx-pick{animation:none}}';
  function css() { if (!document.getElementById('rx-css')) { var s = document.createElement('style'); s.id = 'rx-css'; s.textContent = CSS; document.head.appendChild(s); } }
  function buttonHTML() { css(); return '<button class="iconbtn rx-btn" type="button" data-rx="open" aria-label="Reazione rapida">😊</button>'; }
  function myNick() {
    var d = window.App && App.doc; if (!d || !window.Net) return '';
    var s = d.seats.filter(function (x) { return x.uid === Net.uid; })[0];
    return s ? s.nick : (window.Account && Account.user() ? Account.user().username : 'Spettatore');
  }
  function close() { var p = document.querySelector('.rx-pick'); if (p) p.remove(); open = false; }
  function pick() {
    css(); close(); open = true;
    var p = document.createElement('div'); p.className = 'rx-pick'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Scegli una reazione');
    p.innerHTML = EMO.map(function (e) { return '<button type="button" data-rx="send" data-e="' + e + '">' + e + '</button>'; }).join('');
    document.body.appendChild(p);
  }
  function show(nick, e) {
    css();
    var lay = document.querySelector('.rx-lay'); if (!lay) { lay = document.createElement('div'); lay.className = 'rx-lay'; lay.setAttribute('aria-live', 'polite'); document.body.appendChild(lay); }
    while (lay.children.length > 3) lay.firstChild.remove();
    var b = document.createElement('div'); b.className = 'rx-b'; b.innerHTML = '<i></i><span></span>';
    b.querySelector('i').textContent = e; b.querySelector('span').textContent = nick;
    lay.appendChild(b); setTimeout(function () { b.remove(); }, 3300);
  }
  function send(e) {
    if (EMO.indexOf(e) < 0 || !window.Net) return;
    if (Date.now() - last < 1200) return;   // niente raffiche
    last = Date.now();
    var nick = myNick();
    if (Net.sendReact(e, nick)) show(nick, e);
  }
  if (window.Net && Net.onReact) Net.onReact(function (m) {
    if (!m || m.uid === Net.uid || EMO.indexOf(m.e) < 0) return;
    var now = Date.now(), s = seen[m.uid] || (seen[m.uid] = []);
    while (s.length && now - s[0] > 6000) s.shift();
    if (s.length >= 4) return;              // chi esagera viene ignorato per qualche secondo
    s.push(now);
    var d = window.App && App.doc, seat = d && d.seats.filter(function (x) { return x.uid === m.uid; })[0];
    show(seat ? seat.nick : String(m.nick || 'Spettatore').slice(0, 18), m.e);
  });
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-rx]');
    if (!b) { if (open && !(ev.target.closest && ev.target.closest('.rx-pick'))) close(); return; }
    var k = b.getAttribute('data-rx');
    if (k === 'open') { ev.stopPropagation(); if (open) close(); else pick(); }
    else if (k === 'send') { send(b.getAttribute('data-e')); close(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) close(); });
  return { buttonHTML: buttonHTML, send: send, show: show, EMO: EMO };
})();
