/* ===== Installazione come app (PWA): Android usa il prompt del browser, iOS mostra le istruzioni ===== */
var PWA = (function () {
  var deferred = null, listeners = [];
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var inApp = /FBAN|FBAV|Instagram|Line\/|WhatsApp|Telegram|wv\)/i.test(ua); // browser interni delle app
  var iosNotSafari = isIOS && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  function standalone() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; notify(); });
  window.addEventListener('appinstalled', function () { deferred = null; close(); notify(); });
  function notify() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); }

  // service worker: serve per l'installazione su Android e per aprire il gioco anche con rete debole
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    var swUrl = document.querySelector('meta[name="pwa-sw"]');
    if (swUrl) navigator.serviceWorker.register(swUrl.content, { scope: swUrl.getAttribute('data-scope') || './' }).catch(function () {});
  }

  function available() { return !standalone(); }
  function buttonHTML(cls) { return available() ? '<button type="button" class="' + (cls || 'btn ghost small') + '" data-pwa="install">Installa app</button>' : ''; }

  var css = '.pwa-back{position:fixed;inset:0;z-index:90;background:rgba(5,5,12,.6);display:flex;align-items:flex-end;justify-content:center}' +
    '.pwa-sheet{width:100%;max-width:520px;background:#1d1b2b;color:#f2ecdf;border-radius:18px 18px 0 0;padding:18px max(18px,env(safe-area-inset-right,0px)) calc(18px + env(safe-area-inset-bottom,0px)) max(18px,env(safe-area-inset-left,0px));display:grid;gap:12px;font:16px/1.45 Georgia,serif;box-shadow:0 -10px 30px #000a}' +
    '.pwa-sheet h2{margin:0;font-size:21px}.pwa-sheet ol{margin:0;padding-left:22px;display:grid;gap:8px}.pwa-sheet .k{display:inline-flex;align-items:center;gap:4px;padding:1px 7px;border-radius:6px;background:#ffffff1a;font-weight:700;white-space:nowrap}' +
    '.pwa-sheet .note{font-size:14px;color:#c9c2d8;margin:0}.pwa-sheet button{appearance:none;border:0;border-radius:999px;min-height:46px;font:700 16px Georgia,serif;background:#e2c27a;color:#231a08;cursor:pointer}';
  function close() { var m = document.querySelector('.pwa-back'); if (m) m.remove(); }
  function sheet(html) {
    close();
    if (!document.getElementById('pwa-css')) { var st = document.createElement('style'); st.id = 'pwa-css'; st.textContent = css; document.head.appendChild(st); }
    var d = document.createElement('div'); d.className = 'pwa-back';
    d.innerHTML = '<div class="pwa-sheet" role="dialog" aria-modal="true">' + html + '<button type="button" data-pwa="close">Ho capito</button></div>';
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    document.body.appendChild(d);
  }
  var SHARE = '<svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true"><path d="M8 1v10M4.5 4.5L8 1l3.5 3.5M3 8H1.5v9h13V8H13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function install() {
    if (standalone()) { sheet('<h2>È già installata</h2><p class="note">Stai usando il gioco come app.</p>'); return; }
    if (deferred) {
      var e = deferred; deferred = null;
      e.prompt();
      (e.userChoice || Promise.resolve()).then(function () { notify(); });
      return;
    }
    if (isIOS) {
      sheet('<h2>Aggiungi alla schermata Home</h2>' +
        (iosNotSafari || inApp ? '<p class="note">Su iPhone e iPad l’installazione funziona da <b>Safari</b>: apri questa pagina in Safari e segui i passaggi.</p>' : '') +
        '<ol><li>Tocca <span class="k">' + SHARE + ' Condividi</span> nella barra di Safari (in basso, o in alto su iPad).</li>' +
        '<li>Scorri e scegli <span class="k">Aggiungi alla schermata Home</span>.</li>' +
        '<li>Tocca <span class="k">Aggiungi</span> in alto a destra.</li></ol>' +
        '<p class="note">L’icona comparirà sulla Home e il gioco si aprirà a schermo intero, come un’app.</p>');
      return;
    }
    sheet('<h2>Installa come app</h2>' +
      (inApp ? '<p class="note">Sei nel browser interno di un’altra app: apri questa pagina in <b>Chrome</b> per installarla.</p>' : '') +
      '<ol><li>Apri il menu del browser <span class="k">⋮</span> in alto a destra.</li>' +
      '<li>Scegli <span class="k">Installa app</span> oppure <span class="k">Aggiungi a schermata Home</span>' + (isAndroid ? ' (su alcuni telefoni: “Installa e crea scorciatoia”)' : '') + '.</li>' +
      '<li>Conferma con <span class="k">Installa</span>.</li></ol>' +
      '<p class="note">Se l’opzione non compare, ricarica la pagina e riprova tra qualche secondo.</p>');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pwa]'); if (!b) return;
    if (b.getAttribute('data-pwa') === 'install') install(); else close();
  });
  return { buttonHTML: buttonHTML, install: install, available: available, standalone: standalone, onChange: function (f) { listeners.push(f); } };
})();
