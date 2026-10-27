/* ===== Installazione come app (PWA): Android usa il prompt del browser, iOS mostra le istruzioni ===== */
var PWA = (function () {
  var deferred = null, listeners = [];
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var inApp = /FBAN|FBAV|Instagram|Line\/|WhatsApp|Telegram|wv\)/i.test(ua); // browser interni delle app
  var iosNotSafari = isIOS && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  function standalone() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }

  // dentro l'app Android (Trusted Web Activity) non serve proporre l'installazione
  var inApp2 = false;
  try {
    if (/[?&]app=android/.test(location.search) || (document.referrer || '').indexOf('android-app://io.github.alessandrop95.boardgames') === 0) sessionStorage.setItem('pp-twa', '1');
    inApp2 = sessionStorage.getItem('pp-twa') === '1';
  } catch (e) {}
  // app Android scaricabile: app.json viene scritto dal workflow «App Android» quando c'è una versione pubblicata
  var apk = null;
  var meta = document.querySelector('meta[name="pwa-sw"]');
  var root = meta ? new URL(meta.getAttribute('data-scope') || './', location.href).href : './';
  if (isAndroid && !inApp2 && window.fetch) {
    fetch(root + 'app.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && /^https:\/\//.test(j.apk || '')) { apk = j; notify(); } }).catch(function () {});
  }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; notify(); });
  window.addEventListener('appinstalled', function () { deferred = null; close(); notify(); });
  function notify() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); }

  // service worker: serve per l'installazione su Android e per aprire il gioco anche con rete debole
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    var swUrl = document.querySelector('meta[name="pwa-sw"]');
    if (swUrl) navigator.serviceWorker.register(swUrl.content, { scope: swUrl.getAttribute('data-scope') || './' }).catch(function () {});
  }

  function available() { return !standalone() && !inApp2; }
  function buttonHTML(cls) { return available() ? '<button type="button" class="' + (cls || 'btn ghost small') + '" data-pwa="install">' + (isAndroid && apk ? 'Scarica l’app' : 'Installa app') + '</button>' : ''; }

  var css = '.pwa-back{position:fixed;inset:0;z-index:90;background:rgba(5,5,12,.6);display:flex;align-items:flex-end;justify-content:center}' +
    '.pwa-sheet{width:100%;max-width:520px;background:#1d1b2b;color:#f2ecdf;border-radius:18px 18px 0 0;padding:18px max(18px,env(safe-area-inset-right,0px)) calc(18px + env(safe-area-inset-bottom,0px)) max(18px,env(safe-area-inset-left,0px));display:grid;gap:12px;font:16px/1.45 Georgia,serif;box-shadow:0 -10px 30px #000a}' +
    '.pwa-sheet h2{margin:0;font-size:21px}.pwa-sheet ol{margin:0;padding-left:22px;display:grid;gap:8px}.pwa-sheet .k{display:inline-flex;align-items:center;gap:4px;padding:1px 7px;border-radius:6px;background:#ffffff1a;font-weight:700;white-space:nowrap}' +
    '.pwa-sheet .note{font-size:14px;color:#c9c2d8;margin:0}.pwa-sheet .pwa-apk{display:flex;align-items:center;justify-content:center;min-height:50px;border-radius:999px;background:#e2c27a;color:#231a08;font:700 17px Georgia,serif;text-decoration:none}' +
    '.pwa-sheet button.pwa-link{background:none;color:#e2c27a;min-height:0;padding:0;font:inherit;text-decoration:underline;border-radius:0}.pwa-sheet button.pwa-close{background:#ffffff1a;color:#f2ecdf}.pwa-sheet button{appearance:none;border:0;border-radius:999px;min-height:46px;font:700 16px Georgia,serif;background:#e2c27a;color:#231a08;cursor:pointer}';
  function close() { var m = document.querySelector('.pwa-back'); if (m) m.remove(); }
  function sheet(html, closeLabel) {
    close();
    if (!document.getElementById('pwa-css')) { var st = document.createElement('style'); st.id = 'pwa-css'; st.textContent = css; document.head.appendChild(st); }
    var d = document.createElement('div'); d.className = 'pwa-back';
    d.innerHTML = '<div class="pwa-sheet" role="dialog" aria-modal="true">' + html + '<button type="button" data-pwa="close"' + (closeLabel ? ' class="pwa-close">' + closeLabel : '>Ho capito') + '</button></div>';
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    document.body.appendChild(d);
  }
  var SHARE = '<svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true"><path d="M8 1v10M4.5 4.5L8 1l3.5 3.5M3 8H1.5v9h13V8H13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function install() {
    if (standalone() || inApp2) { sheet('<h2>È già installata</h2><p class="note">Stai usando il gioco come app.</p>'); return; }
    if (isAndroid && apk && !inApp) {
      sheet('<h2>Scarica l’app per Android</h2>' +
        '<p class="note">Con l’app arrivano le notifiche dei nuovi tavoli e degli inviti degli amici anche a telefono bloccato, e i giochi si aprono a schermo intero.</p>' +
        '<a class="pwa-apk" href="' + apk.apk.replace(/"/g, '%22') + '" download>Scarica l’app' + (apk.version ? ' (versione ' + String(apk.version).replace(/[^0-9.]/g, '') + ')' : '') + '</a>' +
        '<ol><li>Apri il file scaricato <span class="k">board-games.apk</span> (dalla notifica del download o da <span class="k">File › Download</span>).</li>' +
        '<li>Se Android lo chiede, tocca <span class="k">Impostazioni</span> e attiva <span class="k">Consenti da questa fonte</span>, poi torna indietro.</li>' +
        '<li>Tocca <span class="k">Installa</span>, poi <span class="k">Apri</span>.</li></ol>' +
        '<p class="note">Nell’app accedi con lo stesso nome utente e password. Preferisci senza scaricare nulla? <button type="button" class="pwa-link" data-pwa="browser">Installa dal browser</button></p>', 'Chiudi');
      return;
    }
    browserInstall();
  }
  function browserInstall() {
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
    var a = b.getAttribute('data-pwa');
    if (a === 'install') install(); else if (a === 'browser') { close(); browserInstall(); } else close();
  });
  return { buttonHTML: buttonHTML, install: install, available: available, standalone: standalone, inApp: function () { return inApp2; }, apk: function () { return apk; }, onChange: function (f) { listeners.push(f); } };
})();
