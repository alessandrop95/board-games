/* ===== Chat del tavolo (condivisa): pannello indipendente dal disegno del gioco,
   così il testo che stai scrivendo non si perde quando arriva una mossa. ===== */
var Chat = (function () {
  var isOpen = false, unread = 0, root = null, code = null, bubbleTimer = null;
  var pinned = (function () { try { return localStorage.getItem('pp-chatpin') === '1'; } catch (e) { return false; } })();
  var QUICK = ['Ben giocata!', 'Che fortuna…', 'Tocca a te!', 'Arrivo subito', 'Rivincita?'];
  var css = '.chat-n{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;margin-left:6px;border-radius:9px;background:var(--k-danger);color:#fff;font:700 11px/1 var(--k-font)}.chat-n[hidden],.chat-err[hidden]{display:none}' +
    '.chat-back{position:fixed;inset:0;z-index:70;background:rgba(6,8,12,.6);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;animation:kfade .18s ease-out}' +
    '.chat-box{width:100%;max-width:560px;height:min(80vh,640px);display:flex;flex-direction:column;background:var(--k-bg);color:var(--k-text);border:1px solid var(--k-line-2);border-bottom:0;border-radius:22px 22px 0 0;box-shadow:0 -18px 50px var(--k-shadow);padding-bottom:env(safe-area-inset-bottom,0px);font:15px/1.4 var(--k-font);-webkit-font-smoothing:antialiased;animation:kup .24s cubic-bezier(.2,.8,.2,1)}' +
    '@media(min-width:640px){.chat-back{align-items:center;padding:24px}.chat-box{border-radius:22px;border-bottom:1px solid var(--k-line-2)}}' +
    '.chat-head{display:flex;align-items:center;gap:8px;padding:14px max(14px,env(safe-area-inset-right,0px)) 12px max(16px,env(safe-area-inset-left,0px));border-bottom:1px solid var(--k-line)}' +
    '.chat-head b{flex:1;font-size:17px;font-weight:700;letter-spacing:-.01em}.chat-x{appearance:none;border:0;background:var(--k-surface-2);color:var(--k-text);width:36px;height:36px;border-radius:50%;font-size:22px;line-height:1;cursor:pointer;flex:none}.chat-x:hover{background:var(--k-surface-3)}' +
    '.chat-list{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:14px max(16px,env(safe-area-inset-right,0px)) 10px max(16px,env(safe-area-inset-left,0px));display:flex;flex-direction:column;gap:6px;-webkit-overflow-scrolling:touch}' +
    '.chat-m{max-width:80%;align-self:flex-start;background:var(--k-surface-2);border-radius:18px 18px 18px 6px;padding:7px 12px 8px;font-size:15px;line-height:1.38;overflow-wrap:anywhere;box-shadow:inset 0 0 0 1px var(--k-line)}' +
    '.chat-m.me{align-self:flex-end;background:var(--k-accent);color:var(--k-on-accent);border-radius:18px 18px 6px 18px;box-shadow:none}.chat-m .who{display:block;font-size:12px;font-weight:700;color:var(--k-accent-ink);margin-bottom:1px}.chat-m .tm{font-size:10.5px;opacity:.6;margin-left:8px;white-space:nowrap}' +
    '.chat-empty{margin:auto;color:var(--k-muted);text-align:center;font-size:14.5px;padding:20px}' +
    '.chat-quick{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:8px max(16px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px))}.chat-quick::-webkit-scrollbar{display:none}' +
    '.chat-quick button{flex:none;appearance:none;border:0;background:var(--k-surface-2);box-shadow:inset 0 0 0 1px var(--k-line);color:var(--k-text);border-radius:999px;padding:7px 13px;font:600 13.5px var(--k-font);cursor:pointer}.chat-quick button:hover{background:var(--k-surface-3)}' +
    '.chat-form{display:flex;gap:8px;padding:10px max(16px,env(safe-area-inset-right,0px)) 14px max(16px,env(safe-area-inset-left,0px))}' +
    '.chat-form input{flex:1;min-width:0;font:16px var(--k-font);color:var(--k-text);background:var(--k-surface-2);border:1px solid var(--k-line-2);border-radius:999px;padding:11px 16px;outline:none}.chat-form input:focus{border-color:var(--k-accent)}' +
    '.chat-form button{appearance:none;border:0;border-radius:999px;padding:0 20px;font:650 15px var(--k-font);background:var(--k-accent);color:var(--k-on-accent);cursor:pointer}' +
    '.chat-bubble{position:fixed;left:50%;top:calc(64px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:65;max-width:min(88vw,440px);background:var(--k-toast-bg);color:var(--k-text);border-radius:14px;padding:9px 14px;font:14.5px/1.35 var(--k-font);box-shadow:0 14px 34px var(--k-shadow),inset 0 0 0 1px var(--k-line-2),inset 3px 0 0 var(--k-accent);cursor:pointer;overflow-wrap:anywhere}' +
    '.chat-bubble b{color:var(--k-accent-ink)}.chat-err{color:var(--k-err-ink);font-size:13px;padding:4px 16px 0;font-family:var(--k-font)}' +
    '.chat-pin{appearance:none;border:0;background:var(--k-surface-2);box-shadow:inset 0 0 0 1px var(--k-line-2);color:var(--k-muted);border-radius:999px;padding:7px 12px;font:600 13px var(--k-font);cursor:pointer}.chat-pin.on{color:var(--k-accent-ink);box-shadow:inset 0 0 0 1px var(--k-accent)}' +
    '.chat-dock{position:relative;display:grid;gap:1px;margin:0 12px 6px;padding:6px 30px 6px 12px;border-radius:14px;background:rgba(14,16,21,.72);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);color:#f2f0eb;font:13.5px/1.35 var(--k-font);cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}.chat-dock[hidden]{display:none}' +
    '.chat-dock .cd-m{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chat-dock .cd-m:not(:last-of-type){opacity:.6}.chat-dock .cd-m b{color:var(--k-accent);font-weight:700}.chat-dock .cd-e{opacity:.6;font-style:italic}' +
    '.chat-dock .cd-x{position:absolute;top:2px;right:2px;appearance:none;border:0;background:none;color:inherit;opacity:.6;font-size:18px;line-height:1;padding:4px 7px;cursor:pointer}' +
    '.chat-dock.flash{animation:cdflash 1.2s ease}@keyframes cdflash{0%{box-shadow:inset 0 0 0 1px var(--k-accent),0 0 14px color-mix(in srgb,var(--k-accent) 50%,transparent)}100%{box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}}';
  function ensureCss() { if (!document.getElementById('chat-css')) { var s = document.createElement('style'); s.id = 'chat-css'; s.textContent = css; document.head.appendChild(s); } }
  function myNick() {
    var d = window.App && App.doc, s = d && d.seats && d.seats.filter(function (x) { return x.uid === Net.uid; })[0];
    if (s) return s.nick;
    try { return (localStorage.getItem('pp-nick') || 'Spettatore').slice(0, 18); } catch (e) { return 'Spettatore'; }
  }
  function hhmm(ts) { var d = new Date(ts); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  /* chat fissata sul tavolo: gli ultimi messaggi restano sempre in vista */
  function dockInner() {
    var msgs = (Net.tableCode ? Net.chatList() : []).slice(-3), h = '';
    var e = function (t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
    if (!msgs.length) h = '<div class="cd-m cd-e">Chat fissata: i messaggi del tavolo compaiono qui.</div>';
    msgs.forEach(function (m) { h += '<div class="cd-m"><b>' + e(m.uid === Net.uid ? 'Tu' : m.nick) + ':</b> ' + e(m.text) + '</div>'; });
    return h + '<button class="cd-x" data-chat="unpin" aria-label="Sgancia la chat dal tavolo">×</button>';
  }
  function dockHTML(style) {
    ensureCss();
    return '<div class="chat-dock" data-chat="open" role="log" aria-label="Ultimi messaggi della chat"' + (style ? ' style="' + style + '"' : '') + (pinned ? '' : ' hidden') + '>' + (pinned ? dockInner() : '') + '</div>';
  }
  function paintDock(flash) {
    document.querySelectorAll('.chat-dock').forEach(function (d) {
      d.hidden = !pinned; if (!pinned) return;
      d.innerHTML = dockInner();
      if (flash) { d.classList.remove('flash'); void d.offsetWidth; d.classList.add('flash'); }
    });
  }
  function setPinned(v) {
    pinned = !!v; try { localStorage.setItem('pp-chatpin', pinned ? '1' : '0'); } catch (e) {}
    if (pinned) { unread = 0; paintBadges(); hideBubble(); }
    paintDock(false);
    var b = root && root.querySelector('.chat-pin'); if (b) { b.classList.toggle('on', pinned); b.textContent = pinned ? 'Sgancia dal tavolo' : 'Fissa sul tavolo'; }
    window.dispatchEvent(new Event('resize'));
  }
  function badgeHTML() {
    ensureCss();
    return (window.Reactions && window.App && App.doc ? Reactions.buttonHTML() : '') + '<button class="iconbtn" data-chat="open" aria-label="Chat del tavolo' + (unread ? ', ' + unread + ' messaggi nuovi' : '') + '">Chat<span class="chat-n"' + (unread ? '' : ' hidden') + '>' + unread + '</span></button>';
  }
  function paintBadges() {
    document.querySelectorAll('[data-chat="open"]').forEach(function (b) {
      var n = b.querySelector('.chat-n'); if (!n) return;
      n.textContent = unread; n.hidden = !unread;
    });
  }
  function paintList() {
    if (!root) return;
    var list = root.querySelector('.chat-list'), atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
    var msgs = Net.chatList();
    list.innerHTML = '';
    if (!msgs.length) { var e = document.createElement('div'); e.className = 'chat-empty'; e.textContent = 'Nessun messaggio. Scrivi qualcosa al tavolo!'; list.appendChild(e); }
    msgs.forEach(function (m) {
      var div = document.createElement('div'); div.className = 'chat-m' + (m.uid === Net.uid ? ' me' : '');
      if (m.uid !== Net.uid) { var w = document.createElement('span'); w.className = 'who'; w.textContent = m.nick; div.appendChild(w); }
      div.appendChild(document.createTextNode(m.text));
      var t = document.createElement('span'); t.className = 'tm'; t.textContent = hhmm(m.ts); div.appendChild(t);
      list.appendChild(div);
    });
    if (atBottom || list.dataset.first !== '0') { list.scrollTop = list.scrollHeight; list.dataset.first = '0'; }
  }
  function open() {
    if (!Net.tableCode) return;
    ensureCss(); close(true);
    isOpen = true; unread = 0; paintBadges(); hideBubble();
    root = document.createElement('div'); root.className = 'chat-back';
    root.innerHTML = '<div class="chat-box" role="dialog" aria-modal="true" aria-label="Chat del tavolo"><div class="chat-head"><b>Chat del tavolo</b><button type="button" class="chat-pin' + (pinned ? ' on' : '') + '" data-chat="pin" aria-pressed="' + pinned + '" title="Mostra sempre gli ultimi messaggi sullo schermo del tavolo">' + (pinned ? 'Sgancia dal tavolo' : 'Fissa sul tavolo') + '</button><button class="chat-x" data-chat="close" aria-label="Chiudi la chat">×</button></div>' +
      '<div class="chat-list" aria-live="polite"></div><div class="chat-err" hidden></div><div class="chat-quick">' + QUICK.map(function (q) { return '<button type="button" data-chat="quick">' + q + '</button>'; }).join('') + '</div>' +
      '<form class="chat-form"><input id="chat-input" maxlength="240" autocomplete="off" enterkeyhint="send" placeholder="Scrivi un messaggio…" aria-label="Messaggio"><button type="submit">Invia</button></form></div>';
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    root.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); send(root.querySelector('#chat-input').value); });
    document.body.appendChild(root);
    paintList();
    setTimeout(function () { var i = root && root.querySelector('#chat-input'); if (i && window.matchMedia('(pointer:fine)').matches) i.focus(); }, 50);
  }
  function close(silent) { if (root) { root.remove(); root = null; } isOpen = false; }
  function send(text) {
    var ok = Net.sendChat(text, myNick()), err = root && root.querySelector('.chat-err');
    if (ok) { paintDock(false); if (root) { root.querySelector('#chat-input').value = ''; if (err) err.hidden = true; paintList(); root.querySelector('.chat-list').scrollTop = 1e9; } }
    else if (err && String(text || '').trim()) { err.textContent = 'Sei offline: il messaggio non è partito. Riprova quando torna la connessione.'; err.hidden = false; }
  }
  function hideBubble() { var b = document.querySelector('.chat-bubble'); if (b) b.remove(); clearTimeout(bubbleTimer); }
  function bubble(m) {
    hideBubble(); ensureCss();
    var b = document.createElement('div'); b.className = 'chat-bubble'; b.setAttribute('role', 'status'); b.setAttribute('data-chat', 'open');
    var w = document.createElement('b'); w.textContent = m.nick + ': '; b.appendChild(w); b.appendChild(document.createTextNode(m.text.length > 90 ? m.text.slice(0, 90) + '…' : m.text));
    document.body.appendChild(b);
    bubbleTimer = setTimeout(hideBubble, 4000);
  }
  Net.onChat(function (m, fromLog) {
    if (Net.tableCode !== code) { code = Net.tableCode; unread = 0; }
    paintDock(!fromLog && m.uid !== Net.uid);
    if (isOpen) { paintList(); return; }
    if (!fromLog && m.uid !== Net.uid && window.Sound) Sound.play('chat');
    if (!fromLog && m.uid !== Net.uid && !pinned) { unread++; paintBadges(); bubble(m); }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-chat]'); if (!b) return;
    var a = b.getAttribute('data-chat');
    if (a === 'open') open(); else if (a === 'close') close(); else if (a === 'quick') send(b.textContent);
    else if (a === 'pin') setPinned(!pinned); else if (a === 'unpin') setPinned(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) close(); });
  function reset() { close(); hideBubble(); unread = 0; code = Net.tableCode; paintBadges(); paintDock(false); }
  return { badgeHTML: badgeHTML, dockHTML: dockHTML, isPinned: function () { return pinned; }, open: open, close: close, reset: reset, isOpen: function () { return isOpen; } };
})();
