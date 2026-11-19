/* ===== Kit grafico condiviso: colori, pannelli, righe di impostazioni, interruttori, selettori a segmenti =====
   Lo usano la home, il pannello Impostazioni (account.js), le notifiche (alerts.js) e le impostazioni del tavolo
   (lobby.js, turns.js) in tutti i giochi. Ogni gioco ha il suo colore di accento; il resto è uguale ovunque. */
var Kit = (function () {
  var ACCENTS = {
    'polvere-piombo/v1/': '#e0a94a', 'presagio/v1/': '#b99bff', 'gattomina/v1/': '#ff9a4d', 'campi-acciaio/v1/': '#d6b04a',
    'binari-italia/v1/': '#3cc6b4', 'catan/v1/': '#eeb04a', 'machiavelli/v1/': '#4fcf94', 'unlock/v1/': '#5cc8ff',
    'skyjo/v1/': '#ffbe3d', 'flip7/v1/': '#ff6fb5', 'citadels/v1/': '#cfa8ff'
  };
  var accent = ACCENTS[window.GAME_PREFIX] || '#f2c14e';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* --- icone (tratto, 24×24) --- */
  var P = {
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M16 7l3 3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
  };
  function icon(n, size) { return '<svg class="kit-ic" viewBox="0 0 24 24" width="' + (size || 20) + '" height="' + (size || 20) + '" aria-hidden="true">' + (P[n] || '') + '</svg>'; }

  /* --- foglio di stile --- */
  var CSS = [
    ':root{--k-accent:' + accent + ';--k-on-accent:#17120a;--k-accent-ink:var(--k-accent);--k-bg:#101217;--k-surface:#171a21;--k-surface-2:#1f232c;--k-surface-3:#272c37;--k-line:rgba(255,255,255,.08);--k-line-2:rgba(255,255,255,.14);--k-text:#f2f0eb;--k-muted:#9ea3ad;--k-ok:#3ccf7d;--k-ok-ink:#a6ecc3;--k-danger:#ff6a5c;--k-err-ink:#ffb3aa;--k-toast-bg:#20242d;--k-shadow:rgba(0,0,0,.55);--k-font:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
    /* tema chiaro: contrasti almeno 4,5:1 per i testi; l'accento dei giochi, troppo chiaro per il testo su bianco, si scurisce */
    '[data-k-theme="light"] :is(.kit-back,.px-back,.pwa-back,.chat-back,.snd-pop,.rx-pick,.kit-toast,.ppa-banner,.chat-bubble),[data-k-theme="light"][data-k-home] body{--k-on-accent:#17120a;--k-accent-ink:color-mix(in srgb,var(--k-accent) 52%,#000);--k-bg:#f4f5f7;--k-surface:#ffffff;--k-surface-2:#eceef2;--k-surface-3:#e1e4ea;--k-line:rgba(16,20,28,.08);--k-line-2:rgba(16,20,28,.14);--k-text:#14171c;--k-muted:#596170;--k-ok:#1f9d57;--k-ok-ink:#17803f;--k-danger:#d23a2c;--k-err-ink:#b42318;--k-toast-bg:#ffffff;--k-shadow:rgba(20,24,35,.18)}',
    '[class^="k-"],[class*=" k-"],.kit-sheet *,.kit-tset *{box-sizing:border-box}',
    '.kit-vh{position:absolute!important;width:1px!important;height:1px!important;min-height:0!important;min-width:0!important;margin:0!important;padding:0!important;border:0!important;opacity:0!important;pointer-events:none!important;overflow:hidden!important}',
    '.kit-ic{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none;display:block}',
    /* pannello (foglio dal basso su telefono, finestra al centro su schermo grande) */
    '.kit-back{position:fixed;inset:0;z-index:95;background:rgba(6,8,12,.66);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;animation:kfade .18s ease-out}',
    '@keyframes kfade{from{opacity:0}}@keyframes kup{from{transform:translateY(28px);opacity:0}}',
    '.kit-sheet{width:100%;max-width:520px;max-height:calc(94vh - env(safe-area-inset-top,0px));overflow-y:auto;overscroll-behavior:contain;background:var(--k-bg);color:var(--k-text);border:1px solid var(--k-line-2);border-bottom:0;border-radius:22px 22px 0 0;font:15.5px/1.45 var(--k-font);-webkit-font-smoothing:antialiased;box-shadow:0 -18px 50px var(--k-shadow);animation:kup .26s cubic-bezier(.2,.8,.2,1)}',
    '@media(min-width:640px){.kit-back{align-items:center;padding:24px}.kit-sheet{border-radius:22px;border-bottom:1px solid var(--k-line-2)}}',
    '.kit-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;padding:14px 14px 10px;background:linear-gradient(var(--k-bg) 75%,color-mix(in srgb,var(--k-bg) 0%,transparent))}',
    '.kit-head h2{display:block;flex:1;margin:0;color:var(--k-text);font:700 18px/1.2 var(--k-font);letter-spacing:-.01em;text-align:center}',
    '.kit-icbtn{appearance:none;border:0;background:var(--k-surface-2);color:var(--k-text);width:36px;height:36px;border-radius:50%;display:grid;place-items:center;cursor:pointer;flex:none}',
    '.kit-icbtn:hover{background:var(--k-surface-3)}.kit-icbtn.ghost{visibility:hidden}',
    '.kit-body{padding:4px 16px calc(22px + env(safe-area-inset-bottom,0px));display:grid;grid-template-columns:minmax(0,1fr);gap:18px}',
    '.kit-body p{margin:0}.kit-note{font-size:13.5px;color:var(--k-muted);line-height:1.45}',
    /* gruppi di righe in stile impostazioni */
    '.kit-group{display:grid;gap:6px}.kit-gtitle{font:600 12.5px/1 var(--k-font);letter-spacing:.06em;text-transform:uppercase;color:var(--k-muted);padding:0 4px}',
    '.kit-list{background:var(--k-surface);border:1px solid var(--k-line);border-radius:16px;overflow:hidden}',
    '.kit-row{display:flex;align-items:center;gap:12px;min-height:54px;padding:10px 14px;color:inherit;text-decoration:none;width:100%;text-align:left;background:none;border:0;font:inherit;position:relative}',
    '.kit-row+.kit-row::before{content:"";position:absolute;top:0;left:56px;right:0;border-top:1px solid var(--k-line)}.kit-row.noic+.kit-row::before,.kit-row+.kit-row.noic::before{left:14px}',
    'button.kit-row,a.kit-row,label.kit-row{cursor:pointer}button.kit-row:hover,a.kit-row:hover,label.kit-row:hover{background:rgba(255,255,255,.03)}',
    '.kit-row .kit-ri{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--k-surface-3);color:var(--k-text);flex:none}',
    '.kit-row .kit-ri.a{background:var(--k-accent);color:var(--k-on-accent)}.kit-row .kit-ri.r{background:rgba(255,106,92,.16);color:var(--k-danger)}',
    '.kit-row .kit-rt{flex:1;min-width:0;display:grid;gap:1px}.kit-row .kit-rt b{font-weight:600;overflow:hidden;text-overflow:ellipsis}.kit-row .kit-rt small{font-size:13px;color:var(--k-muted);line-height:1.35}',
    '.kit-row .kit-rv{color:var(--k-muted);font-size:14px;white-space:nowrap}.kit-row .kit-chev{color:var(--k-muted);opacity:.7}',
    '.kit-row.danger .kit-rt b{color:var(--k-danger)}',
    /* interruttore */
    '.kit-sw{position:relative;width:46px;height:28px;flex:none;display:inline-block}.kit-sw input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;z-index:1}',
    '.kit-sw i{position:absolute;inset:0;border-radius:999px;background:var(--k-surface-3);box-shadow:inset 0 0 0 1px var(--k-line-2);transition:background .18s}',
    '.kit-sw i::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.35);transition:transform .2s cubic-bezier(.2,.8,.2,1)}',
    '.kit-sw input:checked+i{background:var(--k-ok)}.kit-sw input:checked+i::after{transform:translateX(18px)}',
    '.kit-sw input:focus-visible+i{outline:2px solid var(--k-accent);outline-offset:2px}.kit-sw input:disabled{cursor:default}.kit-sw input:disabled+i{opacity:.45}',
    /* pulsanti */
    '.kit-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:10px 18px;border-radius:13px;border:0;font:650 15.5px/1.1 var(--k-font);cursor:pointer;text-decoration:none;background:var(--k-accent);color:var(--k-on-accent);transition:filter .15s,transform .08s}',
    '.kit-btn:hover{filter:brightness(1.06)}.kit-btn:active{transform:scale(.98)}.kit-btn:disabled{opacity:.5;cursor:default}',
    '.kit-btn.sec{background:var(--k-surface-2);color:var(--k-text);box-shadow:inset 0 0 0 1px var(--k-line-2)}.kit-btn.danger{background:var(--k-danger);color:#fff}.kit-btn.block{width:100%}',
    '.kit-btn.sm{min-height:36px;padding:7px 13px;font-size:14px;border-radius:10px}',
    /* campi */
    '.kit-field{display:grid;gap:6px;font-size:13.5px;color:var(--k-muted)}',
    '.kit-input{width:100%;font:16px var(--k-font);color:var(--k-text);background:var(--k-surface-2);border:1px solid var(--k-line-2);border-radius:12px;min-height:46px;padding:10px 13px;outline:none}',
    '.kit-input:focus{border-color:var(--k-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--k-accent) 25%,transparent)}',
    '.kit-row .kit-input{min-height:38px;width:128px;min-width:0;flex:0 1 128px;text-align:right;background:transparent;border-color:transparent;padding:6px 8px}.kit-row .kit-input:focus{background:var(--k-surface-2)}',
    '.kit-form{display:grid;gap:12px}.kit-inline{display:flex;gap:8px}.kit-inline .kit-input{flex:1;min-width:0}',
    /* segmenti */
    '.kit-seg{display:flex;gap:4px;padding:4px;border-radius:13px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}',
    '.kit-seg label{flex:1;position:relative;display:grid;place-items:center;text-align:center;min-height:38px;padding:6px 8px;border-radius:10px;font:600 14px/1.15 var(--k-font);cursor:pointer;color:inherit;opacity:.82;transition:background .15s,opacity .15s}',
    '.kit-seg input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer;z-index:1}.kit-seg label:has(input:checked){background:var(--k-accent);color:var(--k-on-accent);opacity:1;box-shadow:0 2px 8px rgba(0,0,0,.25)}',
    '.kit-seg label:has(input:focus-visible){outline:2px solid var(--k-accent);outline-offset:2px}.kit-seg.off label{cursor:default}.kit-seg.off label:not(:has(input:checked)){opacity:.45}',
    /* scelte con descrizione (chi può sedersi) */
    '.kit-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}@media(max-width:420px){.kit-choices{grid-template-columns:1fr}}',
    '.kit-choice{position:relative;display:flex;gap:10px;align-items:flex-start;padding:12px;border-radius:14px;background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);cursor:pointer;color:inherit;font:14px/1.35 var(--k-font);transition:box-shadow .15s,background .15s}',
    '.kit-choice input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer;z-index:1}.kit-choice .kit-ic{margin-top:1px;opacity:.85}.kit-choice b{display:block;font-weight:650;font-size:15px;margin-bottom:2px}.kit-choice span span{opacity:.72;font-size:13px}',
    '.kit-choice:has(input:checked){background:color-mix(in srgb,var(--k-accent) 14%,transparent);box-shadow:inset 0 0 0 2px var(--k-accent)}.kit-choice:has(input:checked) .kit-ic{color:var(--k-accent);opacity:1}',
    '.kit-choice:has(input:focus-visible){outline:2px solid var(--k-accent);outline-offset:2px}',
    /* impostazioni del tavolo (dentro le pagine dei giochi) */
    '.kit-tset{display:grid;gap:14px;padding:14px;border-radius:16px;background:rgba(0,0,0,.18);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);font-family:var(--k-font)}',
    '.kit-tset>h3{margin:0;font:700 13px/1 var(--k-font);letter-spacing:.07em;text-transform:uppercase;opacity:.75}',
    '.kit-opt{display:grid;gap:8px}.kit-opt-h{display:flex;gap:10px;align-items:baseline;justify-content:space-between;flex-wrap:wrap}.kit-opt-h b{font-size:15px}.kit-opt-h small{font-size:13px;opacity:.72}',
    '.kit-opt-d{font-size:13.5px;opacity:.78;margin:0;line-height:1.4}',
    /* profilo, avatar, distintivi, pillole */
    '.kit-avatar{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;flex:none;background:var(--k-accent);color:var(--k-on-accent);font:800 18px/1 var(--k-font)}',
    '.kit-avatar.lg{width:56px;height:56px;font-size:23px}.kit-avatar.sm{width:28px;height:28px;font-size:13px}.kit-avatar.off{background:var(--k-surface-3);color:var(--k-muted)}',
    '.kit-badge{min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--k-danger);color:#fff;font:700 12px/20px var(--k-font);text-align:center}',
    '.kit-pill{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:999px;font:600 12.5px/1.3 var(--k-font);background:var(--k-surface-3);color:var(--k-muted)}.kit-pill.ok{background:color-mix(in srgb,var(--k-ok) 15%,transparent);color:var(--k-ok-ink)}.kit-pill.a{background:color-mix(in srgb,var(--k-accent) 18%,transparent);color:var(--k-accent-ink)}',
    '.kit-dot{width:9px;height:9px;border-radius:50%;background:#6c717b;flex:none}.kit-dot.on{background:var(--k-ok);box-shadow:0 0 0 3px rgba(60,207,125,.18)}',
    /* pulsante profilo e impostazioni (lobby dei giochi e home) */
    '.kit-me{appearance:none;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:4px 12px 4px 4px;border-radius:999px;border:0;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);color:inherit;font:600 14.5px/1 var(--k-font);cursor:pointer;max-width:100%}',
    '.kit-me:hover{background:rgba(255,255,255,.12)}.kit-me>span:not(.kit-avatar):not(.kit-badge){overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kit-me .kit-ic{opacity:.75}',
    /* riga di stato (notifiche) dentro le pagine */
    '.kit-status{display:flex;flex-wrap:wrap;gap:10px 12px;align-items:center;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);font:14px/1.35 var(--k-font)}',
    '.kit-status .kit-st{flex:1;min-width:180px;display:flex;gap:10px;align-items:center}.kit-status .kit-st b{display:block;font-weight:650}.kit-status .kit-st small{opacity:.72;font-size:13px}',
    '.kit-status .kit-sti{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;flex:none;background:rgba(255,255,255,.08)}.kit-status.on .kit-sti{background:rgba(60,207,125,.16);color:var(--k-ok)}',
    /* stato vuoto, avvisi */
    '.kit-empty{display:grid;justify-items:center;gap:6px;text-align:center;padding:22px 12px;color:var(--k-muted);font-size:14px}',
    '.kit-msg{padding:10px 12px;border-radius:12px;font-size:14px}.kit-msg.err{background:color-mix(in srgb,var(--k-danger) 12%,transparent);color:var(--k-err-ink)}.kit-msg.ok{background:color-mix(in srgb,var(--k-ok) 13%,transparent);color:var(--k-ok-ink)}',
    '.kit-toast{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:9999;max-width:min(92vw,460px);padding:11px 16px;border-radius:14px;background:var(--k-toast-bg);color:var(--k-text);box-shadow:0 14px 34px var(--k-shadow),inset 0 0 0 1px var(--k-line-2);font:600 14.5px/1.35 var(--k-font);animation:kup .22s ease-out}',
    '.kit-tabs{display:flex;gap:4px;padding:4px;border-radius:13px;background:var(--k-surface)}.kit-tabs button{flex:1;appearance:none;border:0;background:none;color:var(--k-muted);font:600 14.5px var(--k-font);min-height:38px;border-radius:10px;cursor:pointer}.kit-tabs button.on{background:var(--k-surface-3);color:var(--k-text)}',
    '.kit-stat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.kit-stat div{background:var(--k-surface);border:1px solid var(--k-line);border-radius:14px;padding:12px;text-align:center}.kit-stat b{display:block;font-size:22px;letter-spacing:-.02em}.kit-stat small{color:var(--k-muted);font-size:12.5px}',
    '.kit-scroll-x{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.kit-scroll-x::-webkit-scrollbar{display:none}',
    '.kit-chipbtn{appearance:none;flex:none;border:0;border-radius:999px;padding:7px 12px;background:var(--k-surface-2);color:var(--k-muted);font:600 13.5px var(--k-font);cursor:pointer;box-shadow:inset 0 0 0 1px var(--k-line)}.kit-chipbtn.on{background:var(--k-text);color:var(--k-bg)}',
    '[data-k-theme="light"] :is(.kit-sheet,.px-sheet,.pwa-sheet) .kit-seg,[data-k-theme="light"][data-k-home] .kit-seg{background:rgba(16,20,28,.06);box-shadow:inset 0 0 0 1px rgba(16,20,28,.1)}',
    '.kit-sheet :focus-visible,.kit-back :focus-visible{outline:2px solid var(--k-accent-ink);outline-offset:2px}.kit-sheet [tabindex="-1"]:focus{outline:none}',
    '@media(prefers-reduced-motion:reduce){.kit-back,.kit-sheet,.kit-toast{animation:none}.kit-sw i,.kit-sw i::after{transition:none}}'
  ].join('');
  function css() {
    if (document.getElementById('kit-css')) return;
    var s = document.createElement('style'); s.id = 'kit-css'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s);
    if (!document.querySelector('link[data-k-font]')) {   // Inter per i pannelli: se non arriva resta il carattere di sistema
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-k-font', ''); l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;650;700;800&display=swap';
      (document.head || document.documentElement).appendChild(l);
    }
  }
  css();

  /* --- tema: «auto» segue il telefono; vale per la home e per i pannelli comuni (i giochi restano con i loro colori) --- */
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null, themeCbs = [];
  function themePref() { try { var t = localStorage.getItem('pp-theme'); return t === 'light' || t === 'dark' ? t : 'auto'; } catch (e) { return 'auto'; } }
  function themeNow() { var t = themePref(); return t === 'auto' ? (mq && mq.matches ? 'light' : 'dark') : t; }
  function applyTheme() {
    var t = themeNow(), el = document.documentElement;
    el.setAttribute('data-k-theme', t); if (!window.GAME_PREFIX) el.setAttribute('data-k-home', '');
    if (!window.GAME_PREFIX) el.style.colorScheme = t;   // nei giochi barre e moduli restano scuri come la loro grafica
    themeCbs.forEach(function (f) { try { f(t); } catch (e) {} });
  }
  function setTheme(t) { try { if (t === 'light' || t === 'dark') localStorage.setItem('pp-theme', t); else localStorage.removeItem('pp-theme'); } catch (e) {} applyTheme(); }
  if (mq) { if (mq.addEventListener) mq.addEventListener('change', applyTheme); else if (mq.addListener) mq.addListener(applyTheme); }
  window.addEventListener('storage', function (e) { if (e.key === 'pp-theme') applyTheme(); });   // cambiato in un'altra scheda
  applyTheme();

  /* --- accessibilità dei pannelli: all'apertura il focus entra, Tab resta dentro, alla chiusura torna dov'era --- */
  var MODALS = '.kit-back,.px-back,.pwa-back,.chat-back,.sheet-back', FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]):not(.kit-vh),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  var openers = [];
  function topModal() { var l = document.querySelectorAll(MODALS); return l.length ? l[l.length - 1] : null; }
  function focusables(m) { return Array.prototype.filter.call(m.querySelectorAll(FOCUSABLE), function (n) { return n.offsetParent !== null || n === document.activeElement; }); }
  function onAdded(m) {
    if (m._kf) return; m._kf = 1;
    openers.push({ m: m, el: document.activeElement });
    setTimeout(function () {
      if (!m.isConnected || m.contains(document.activeElement)) return;
      var d = m.querySelector('[role="dialog"]') || m, h = d.querySelector('h2');
      var target = h || d; if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      try { target.focus({ preventScroll: true }); } catch (e) {}
    }, 30);
  }
  function onRemoved() {
    for (var i = openers.length - 1; i >= 0; i--) {
      if (openers[i].m.isConnected) continue;
      var el = openers[i].el; openers.splice(i, 1);
      if (el && el.isConnected && !topModal() && el.focus) { try { el.focus({ preventScroll: true }); } catch (e) {} }
    }
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var m = topModal(); if (!m) return;
    var f = focusables(m); if (!f.length) return;
    var first = f[0], last = f[f.length - 1], a = document.activeElement;
    if (!m.contains(a)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && (a === first || !f.length)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  });

  /* --- pezzi pronti --- */
  function sw(attrs, on, disabled) { return '<span class="kit-sw"><input type="checkbox" role="switch" ' + attrs + (on ? ' checked' : '') + (disabled ? ' disabled' : '') + '><i></i></span>'; }
  // riga: o = { ic, icCls, title, sub, right, href, attrs, tag, cls, chev }
  function row(o) {
    var tag = o.tag || (o.href ? 'a' : o.attrs ? 'button' : 'div');
    var open = '<' + tag + ' class="kit-row' + (o.ic ? '' : ' noic') + (o.cls ? ' ' + o.cls : '') + '"' + (o.href ? ' href="' + esc(o.href) + '"' : '') + (tag === 'button' ? ' type="button"' : '') + (o.attrs ? ' ' + o.attrs : '') + '>';
    return open + (o.ic ? '<span class="kit-ri' + (o.icCls ? ' ' + o.icCls : '') + '">' + icon(o.ic, 18) + '</span>' : '') +
      '<span class="kit-rt"><b>' + o.title + '</b>' + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</span>' + (o.right || '') +
      (o.chev ? '<span class="kit-chev">' + icon('chev', 18) + '</span>' : '') + '</' + tag + '>';
  }
  function group(title, rows, note) { return '<section class="kit-group">' + (title ? '<h3 class="kit-gtitle">' + title + '</h3>' : '') + '<div class="kit-list">' + rows.join('') + '</div>' + (note ? '<p class="kit-note" style="padding:0 4px">' + note + '</p>' : '') + '</section>'; }
  // Selettore a segmenti collegato a un <select> nascosto: chi ascolta già il select (change) non cambia nulla.
  function seg(selectId, options, value, disabled) {
    var name = 'kseg-' + selectId;
    return '<div class="kit-seg' + (disabled ? ' off' : '') + '" role="radiogroup" data-k-for="' + selectId + '">' + options.map(function (o) {
      return '<label><input type="radio" name="' + name + '" value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' + o[1] + '</label>';
    }).join('') + '</div><select id="' + selectId + '" class="kit-vh" data-k-done tabindex="-1" aria-hidden="true"' + (disabled ? ' disabled' : '') + '>' + options.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? ' selected' : '') + '>' + esc(String(o[1]).replace(/<[^>]*>/g, '')) + '</option>';
    }).join('') + '</select>';
  }
  document.addEventListener('change', function (e) {
    var r = e.target; if (!r.closest) return;
    var box = r.closest('[data-k-for]'); if (!box || r.type !== 'radio') return;
    var sel = document.getElementById(box.getAttribute('data-k-for')); if (!sel || sel.disabled) return;
    sel.value = r.value; sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  // Le opzioni proprie di ogni gioco (menu <select id="opt-…"> nella sala d'attesa) diventano selettori a segmenti
  // quando hanno poche scelte: stesso aspetto delle opzioni comuni, senza toccare il codice dei giochi.
  function enhance(root) {
    (root || document).querySelectorAll('select[id^="opt-"]:not([data-k-done])').forEach(function (sel) {
      sel.setAttribute('data-k-done', '');
      if (sel.options.length < 2 || sel.options.length > 4) { sel.classList.add('kit-input'); return; }
      var box = document.createElement('div'); box.className = 'kit-seg' + (sel.disabled ? ' off' : ''); box.setAttribute('role', 'radiogroup'); box.setAttribute('data-k-for', sel.id);
      if (sel.labels && sel.labels[0]) box.setAttribute('aria-label', sel.labels[0].textContent.trim().slice(0, 60));
      box.innerHTML = Array.prototype.map.call(sel.options, function (o) {
        var t = o.textContent, m = t.match(/^(.*?)\s*\((.*)\)\s*$/);   // «100 punti (classico)» → «100 punti» con «classico» sotto
        return '<label title="' + esc(t) + '"><input type="radio" name="kseg-' + esc(sel.id) + '" value="' + esc(o.value) + '"' + (o.selected ? ' checked' : '') + (sel.disabled ? ' disabled' : '') + '><span>' + esc(m ? m[1] : t) + (m ? '<small style="display:block;font-weight:500;font-size:11.5px;opacity:.75">' + esc(m[2]) + '</small>' : '') + '</span></label>';
      }).join('');
      sel.classList.add('kit-vh'); sel.setAttribute('aria-hidden', 'true'); sel.tabIndex = -1;
      box.style.flex = '1 1 100%';   // in una riga flessibile va a capo e prende tutta la larghezza
      sel.parentNode.insertBefore(box, sel);
      // se l'etichetta conteneva il select, il segmento va sotto il testo (non accanto)
      var lab = sel.closest('label'); if (lab) { lab.style.display = 'grid'; lab.style.gap = '8px'; lab.style.alignItems = 'stretch'; }
    });
  }
  if (window.MutationObserver) new MutationObserver(function (ms) {
    var added = false, removed = false;
    for (var i = 0; i < ms.length; i++) {
      if (ms[i].addedNodes.length) { added = true; Array.prototype.forEach.call(ms[i].addedNodes, function (n) { if (n.nodeType === 1 && n.matches && n.matches(MODALS)) onAdded(n); }); }
      if (ms[i].removedNodes.length) removed = true;
    }
    if (added) enhance();
    if (removed && openers.length) onRemoved();
  }).observe(document.documentElement, { childList: true, subtree: true });
  function avatar(name, cls) { var n = String(name || '').trim(); return '<span class="kit-avatar' + (cls ? ' ' + cls : '') + (n ? '' : ' off') + '">' + (n ? esc(n.charAt(0).toUpperCase()) : icon('user', 18)) + '</span>'; }
  function toast(t) { var old = document.querySelector('.kit-toast'); if (old) old.remove(); var d = document.createElement('div'); d.className = 'kit-toast'; d.setAttribute('role', 'status'); d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3400); }

  return { esc: esc, icon: icon, css: css, sw: sw, row: row, group: group, seg: seg, avatar: avatar, toast: toast, accent: accent,
    theme: themeNow, themePref: themePref, setTheme: setTheme, onTheme: function (f) { themeCbs.push(f); } };
})();
