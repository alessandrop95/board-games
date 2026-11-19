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
  function icon(n, size) { return '<svg class="k-ic" viewBox="0 0 24 24" width="' + (size || 20) + '" height="' + (size || 20) + '" aria-hidden="true">' + (P[n] || '') + '</svg>'; }

  /* --- foglio di stile --- */
  var CSS = [
    ':root{--k-accent:' + accent + ';--k-on-accent:#17120a;--k-accent-ink:var(--k-accent);--k-bg:#101217;--k-surface:#171a21;--k-surface-2:#1f232c;--k-surface-3:#272c37;--k-line:rgba(255,255,255,.08);--k-line-2:rgba(255,255,255,.14);--k-text:#f2f0eb;--k-muted:#9ea3ad;--k-ok:#3ccf7d;--k-ok-ink:#a6ecc3;--k-danger:#ff6a5c;--k-err-ink:#ffb3aa;--k-toast-bg:#20242d;--k-shadow:rgba(0,0,0,.55);--k-font:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
    /* tema chiaro: contrasti almeno 4,5:1 per i testi; l'accento dei giochi, troppo chiaro per il testo su bianco, si scurisce */
    '[data-k-theme="light"] :is(.k-back,.px-back,.pwa-back,.chat-back,.snd-pop,.rx-pick,.k-toast,.ppa-banner,.chat-bubble),[data-k-theme="light"][data-k-home] body{--k-on-accent:#17120a;--k-accent-ink:color-mix(in srgb,var(--k-accent) 52%,#000);--k-bg:#f4f5f7;--k-surface:#ffffff;--k-surface-2:#eceef2;--k-surface-3:#e1e4ea;--k-line:rgba(16,20,28,.08);--k-line-2:rgba(16,20,28,.14);--k-text:#14171c;--k-muted:#596170;--k-ok:#1f9d57;--k-ok-ink:#17803f;--k-danger:#d23a2c;--k-err-ink:#b42318;--k-toast-bg:#ffffff;--k-shadow:rgba(20,24,35,.18)}',
    '[class^="k-"],[class*=" k-"],.k-sheet *,.k-tset *{box-sizing:border-box}',
    '.k-vh{position:absolute!important;width:1px!important;height:1px!important;min-height:0!important;min-width:0!important;margin:0!important;padding:0!important;border:0!important;opacity:0!important;pointer-events:none!important;overflow:hidden!important}',
    '.k-ic{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none;display:block}',
    /* pannello (foglio dal basso su telefono, finestra al centro su schermo grande) */
    '.k-back{position:fixed;inset:0;z-index:95;background:rgba(6,8,12,.66);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;animation:kfade .18s ease-out}',
    '@keyframes kfade{from{opacity:0}}@keyframes kup{from{transform:translateY(28px);opacity:0}}',
    '.k-sheet{width:100%;max-width:520px;max-height:calc(94vh - env(safe-area-inset-top,0px));overflow-y:auto;overscroll-behavior:contain;background:var(--k-bg);color:var(--k-text);border:1px solid var(--k-line-2);border-bottom:0;border-radius:22px 22px 0 0;font:15.5px/1.45 var(--k-font);-webkit-font-smoothing:antialiased;box-shadow:0 -18px 50px var(--k-shadow);animation:kup .26s cubic-bezier(.2,.8,.2,1)}',
    '@media(min-width:640px){.k-back{align-items:center;padding:24px}.k-sheet{border-radius:22px;border-bottom:1px solid var(--k-line-2)}}',
    '.k-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;padding:14px 14px 10px;background:linear-gradient(var(--k-bg) 75%,color-mix(in srgb,var(--k-bg) 0%,transparent))}',
    '.k-head h2{display:block;flex:1;margin:0;color:var(--k-text);font:700 18px/1.2 var(--k-font);letter-spacing:-.01em;text-align:center}',
    '.k-icbtn{appearance:none;border:0;background:var(--k-surface-2);color:var(--k-text);width:36px;height:36px;border-radius:50%;display:grid;place-items:center;cursor:pointer;flex:none}',
    '.k-icbtn:hover{background:var(--k-surface-3)}.k-icbtn.ghost{visibility:hidden}',
    '.k-body{padding:4px 16px calc(22px + env(safe-area-inset-bottom,0px));display:grid;grid-template-columns:minmax(0,1fr);gap:18px}',
    '.k-body p{margin:0}.k-note{font-size:13.5px;color:var(--k-muted);line-height:1.45}',
    /* gruppi di righe in stile impostazioni */
    '.k-group{display:grid;gap:6px}.k-gtitle{font:600 12.5px/1 var(--k-font);letter-spacing:.06em;text-transform:uppercase;color:var(--k-muted);padding:0 4px}',
    '.k-list{background:var(--k-surface);border:1px solid var(--k-line);border-radius:16px;overflow:hidden}',
    '.k-row{display:flex;align-items:center;gap:12px;min-height:54px;padding:10px 14px;color:inherit;text-decoration:none;width:100%;text-align:left;background:none;border:0;font:inherit;position:relative}',
    '.k-row+.k-row::before{content:"";position:absolute;top:0;left:56px;right:0;border-top:1px solid var(--k-line)}.k-row.noic+.k-row::before,.k-row+.k-row.noic::before{left:14px}',
    'button.k-row,a.k-row,label.k-row{cursor:pointer}button.k-row:hover,a.k-row:hover,label.k-row:hover{background:rgba(255,255,255,.03)}',
    '.k-row .k-ri{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--k-surface-3);color:var(--k-text);flex:none}',
    '.k-row .k-ri.a{background:var(--k-accent);color:var(--k-on-accent)}.k-row .k-ri.r{background:rgba(255,106,92,.16);color:var(--k-danger)}',
    '.k-row .k-rt{flex:1;min-width:0;display:grid;gap:1px}.k-row .k-rt b{font-weight:600;overflow:hidden;text-overflow:ellipsis}.k-row .k-rt small{font-size:13px;color:var(--k-muted);line-height:1.35}',
    '.k-row .k-rv{color:var(--k-muted);font-size:14px;white-space:nowrap}.k-row .k-chev{color:var(--k-muted);opacity:.7}',
    '.k-row.danger .k-rt b{color:var(--k-danger)}',
    /* interruttore */
    '.k-sw{position:relative;width:46px;height:28px;flex:none;display:inline-block}.k-sw input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer;z-index:1}',
    '.k-sw i{position:absolute;inset:0;border-radius:999px;background:var(--k-surface-3);box-shadow:inset 0 0 0 1px var(--k-line-2);transition:background .18s}',
    '.k-sw i::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.35);transition:transform .2s cubic-bezier(.2,.8,.2,1)}',
    '.k-sw input:checked+i{background:var(--k-ok)}.k-sw input:checked+i::after{transform:translateX(18px)}',
    '.k-sw input:focus-visible+i{outline:2px solid var(--k-accent);outline-offset:2px}.k-sw input:disabled{cursor:default}.k-sw input:disabled+i{opacity:.45}',
    /* pulsanti */
    '.k-btn{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:10px 18px;border-radius:13px;border:0;font:650 15.5px/1.1 var(--k-font);cursor:pointer;text-decoration:none;background:var(--k-accent);color:var(--k-on-accent);transition:filter .15s,transform .08s}',
    '.k-btn:hover{filter:brightness(1.06)}.k-btn:active{transform:scale(.98)}.k-btn:disabled{opacity:.5;cursor:default}',
    '.k-btn.sec{background:var(--k-surface-2);color:var(--k-text);box-shadow:inset 0 0 0 1px var(--k-line-2)}.k-btn.danger{background:var(--k-danger);color:#fff}.k-btn.block{width:100%}',
    '.k-btn.sm{min-height:36px;padding:7px 13px;font-size:14px;border-radius:10px}',
    /* campi */
    '.k-field{display:grid;gap:6px;font-size:13.5px;color:var(--k-muted)}',
    '.k-input{width:100%;font:16px var(--k-font);color:var(--k-text);background:var(--k-surface-2);border:1px solid var(--k-line-2);border-radius:12px;min-height:46px;padding:10px 13px;outline:none}',
    '.k-input:focus{border-color:var(--k-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--k-accent) 25%,transparent)}',
    '.k-row .k-input{min-height:38px;width:128px;min-width:0;flex:0 1 128px;text-align:right;background:transparent;border-color:transparent;padding:6px 8px}.k-row .k-input:focus{background:var(--k-surface-2)}',
    '.k-form{display:grid;gap:12px}.k-inline{display:flex;gap:8px}.k-inline .k-input{flex:1;min-width:0}',
    /* segmenti */
    '.k-seg{display:flex;gap:4px;padding:4px;border-radius:13px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}',
    '.k-seg label{flex:1;position:relative;display:grid;place-items:center;text-align:center;min-height:38px;padding:6px 8px;border-radius:10px;font:600 14px/1.15 var(--k-font);cursor:pointer;color:inherit;opacity:.82;transition:background .15s,opacity .15s}',
    '.k-seg input{position:absolute;opacity:0;pointer-events:none}.k-seg label:has(input:checked){background:var(--k-accent);color:var(--k-on-accent);opacity:1;box-shadow:0 2px 8px rgba(0,0,0,.25)}',
    '.k-seg label:has(input:focus-visible){outline:2px solid var(--k-accent);outline-offset:2px}.k-seg.off label{cursor:default}.k-seg.off label:not(:has(input:checked)){opacity:.45}',
    /* scelte con descrizione (chi può sedersi) */
    '.k-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}@media(max-width:420px){.k-choices{grid-template-columns:1fr}}',
    '.k-choice{position:relative;display:flex;gap:10px;align-items:flex-start;padding:12px;border-radius:14px;background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);cursor:pointer;color:inherit;font:14px/1.35 var(--k-font);transition:box-shadow .15s,background .15s}',
    '.k-choice input{position:absolute;opacity:0;pointer-events:none}.k-choice .k-ic{margin-top:1px;opacity:.85}.k-choice b{display:block;font-weight:650;font-size:15px;margin-bottom:2px}.k-choice span span{opacity:.72;font-size:13px}',
    '.k-choice:has(input:checked){background:color-mix(in srgb,var(--k-accent) 14%,transparent);box-shadow:inset 0 0 0 2px var(--k-accent)}.k-choice:has(input:checked) .k-ic{color:var(--k-accent);opacity:1}',
    '.k-choice:has(input:focus-visible){outline:2px solid var(--k-accent);outline-offset:2px}',
    /* impostazioni del tavolo (dentro le pagine dei giochi) */
    '.k-tset{display:grid;gap:14px;padding:14px;border-radius:16px;background:rgba(0,0,0,.18);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);font-family:var(--k-font)}',
    '.k-tset>h3{margin:0;font:700 13px/1 var(--k-font);letter-spacing:.07em;text-transform:uppercase;opacity:.75}',
    '.k-opt{display:grid;gap:8px}.k-opt-h{display:flex;gap:10px;align-items:baseline;justify-content:space-between;flex-wrap:wrap}.k-opt-h b{font-size:15px}.k-opt-h small{font-size:13px;opacity:.72}',
    '.k-opt-d{font-size:13.5px;opacity:.78;margin:0;line-height:1.4}',
    /* profilo, avatar, distintivi, pillole */
    '.k-avatar{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;flex:none;background:var(--k-accent);color:var(--k-on-accent);font:800 18px/1 var(--k-font)}',
    '.k-avatar.lg{width:56px;height:56px;font-size:23px}.k-avatar.sm{width:28px;height:28px;font-size:13px}.k-avatar.off{background:var(--k-surface-3);color:var(--k-muted)}',
    '.k-badge{min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--k-danger);color:#fff;font:700 12px/20px var(--k-font);text-align:center}',
    '.k-pill{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:999px;font:600 12.5px/1.3 var(--k-font);background:var(--k-surface-3);color:var(--k-muted)}.k-pill.ok{background:color-mix(in srgb,var(--k-ok) 15%,transparent);color:var(--k-ok-ink)}.k-pill.a{background:color-mix(in srgb,var(--k-accent) 18%,transparent);color:var(--k-accent-ink)}',
    '.k-dot{width:9px;height:9px;border-radius:50%;background:#6c717b;flex:none}.k-dot.on{background:var(--k-ok);box-shadow:0 0 0 3px rgba(60,207,125,.18)}',
    /* pulsante profilo e impostazioni (lobby dei giochi e home) */
    '.k-me{appearance:none;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:4px 12px 4px 4px;border-radius:999px;border:0;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);color:inherit;font:600 14.5px/1 var(--k-font);cursor:pointer;max-width:100%}',
    '.k-me:hover{background:rgba(255,255,255,.12)}.k-me>span:not(.k-avatar):not(.k-badge){overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.k-me .k-ic{opacity:.75}',
    /* riga di stato (notifiche) dentro le pagine */
    '.k-status{display:flex;flex-wrap:wrap;gap:10px 12px;align-items:center;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);font:14px/1.35 var(--k-font)}',
    '.k-status .k-st{flex:1;min-width:180px;display:flex;gap:10px;align-items:center}.k-status .k-st b{display:block;font-weight:650}.k-status .k-st small{opacity:.72;font-size:13px}',
    '.k-status .k-sti{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;flex:none;background:rgba(255,255,255,.08)}.k-status.on .k-sti{background:rgba(60,207,125,.16);color:var(--k-ok)}',
    /* stato vuoto, avvisi */
    '.k-empty{display:grid;justify-items:center;gap:6px;text-align:center;padding:22px 12px;color:var(--k-muted);font-size:14px}',
    '.k-msg{padding:10px 12px;border-radius:12px;font-size:14px}.k-msg.err{background:color-mix(in srgb,var(--k-danger) 12%,transparent);color:var(--k-err-ink)}.k-msg.ok{background:color-mix(in srgb,var(--k-ok) 13%,transparent);color:var(--k-ok-ink)}',
    '.k-toast{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:9999;max-width:min(92vw,460px);padding:11px 16px;border-radius:14px;background:var(--k-toast-bg);color:var(--k-text);box-shadow:0 14px 34px var(--k-shadow),inset 0 0 0 1px var(--k-line-2);font:600 14.5px/1.35 var(--k-font);animation:kup .22s ease-out}',
    '.k-tabs{display:flex;gap:4px;padding:4px;border-radius:13px;background:var(--k-surface)}.k-tabs button{flex:1;appearance:none;border:0;background:none;color:var(--k-muted);font:600 14.5px var(--k-font);min-height:38px;border-radius:10px;cursor:pointer}.k-tabs button.on{background:var(--k-surface-3);color:var(--k-text)}',
    '.k-stat{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.k-stat div{background:var(--k-surface);border:1px solid var(--k-line);border-radius:14px;padding:12px;text-align:center}.k-stat b{display:block;font-size:22px;letter-spacing:-.02em}.k-stat small{color:var(--k-muted);font-size:12.5px}',
    '.k-scroll-x{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.k-scroll-x::-webkit-scrollbar{display:none}',
    '.k-chipbtn{appearance:none;flex:none;border:0;border-radius:999px;padding:7px 12px;background:var(--k-surface-2);color:var(--k-muted);font:600 13.5px var(--k-font);cursor:pointer;box-shadow:inset 0 0 0 1px var(--k-line)}.k-chipbtn.on{background:var(--k-text);color:var(--k-bg)}',
    '[data-k-theme="light"] :is(.k-sheet,.px-sheet,.pwa-sheet) .k-seg,[data-k-theme="light"][data-k-home] .k-seg{background:rgba(16,20,28,.06);box-shadow:inset 0 0 0 1px rgba(16,20,28,.1)}',
    '.k-sheet :focus-visible,.k-back :focus-visible{outline:2px solid var(--k-accent-ink);outline-offset:2px}.k-sheet [tabindex="-1"]:focus{outline:none}',
    '@media(prefers-reduced-motion:reduce){.k-back,.k-sheet,.k-toast{animation:none}.k-sw i,.k-sw i::after{transition:none}}'
  ].join('');
  function css() {
    if (document.getElementById('k-css')) return;
    var s = document.createElement('style'); s.id = 'k-css'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s);
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
  var MODALS = '.k-back,.px-back,.pwa-back,.chat-back,.sheet-back', FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]):not(.k-vh),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
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
  function sw(attrs, on, disabled) { return '<span class="k-sw"><input type="checkbox" role="switch" ' + attrs + (on ? ' checked' : '') + (disabled ? ' disabled' : '') + '><i></i></span>'; }
  // riga: o = { ic, icCls, title, sub, right, href, attrs, tag, cls, chev }
  function row(o) {
    var tag = o.tag || (o.href ? 'a' : o.attrs ? 'button' : 'div');
    var open = '<' + tag + ' class="k-row' + (o.ic ? '' : ' noic') + (o.cls ? ' ' + o.cls : '') + '"' + (o.href ? ' href="' + esc(o.href) + '"' : '') + (tag === 'button' ? ' type="button"' : '') + (o.attrs ? ' ' + o.attrs : '') + '>';
    return open + (o.ic ? '<span class="k-ri' + (o.icCls ? ' ' + o.icCls : '') + '">' + icon(o.ic, 18) + '</span>' : '') +
      '<span class="k-rt"><b>' + o.title + '</b>' + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</span>' + (o.right || '') +
      (o.chev ? '<span class="k-chev">' + icon('chev', 18) + '</span>' : '') + '</' + tag + '>';
  }
  function group(title, rows, note) { return '<section class="k-group">' + (title ? '<h3 class="k-gtitle">' + title + '</h3>' : '') + '<div class="k-list">' + rows.join('') + '</div>' + (note ? '<p class="k-note" style="padding:0 4px">' + note + '</p>' : '') + '</section>'; }
  // Selettore a segmenti collegato a un <select> nascosto: chi ascolta già il select (change) non cambia nulla.
  function seg(selectId, options, value, disabled) {
    var name = 'kseg-' + selectId;
    return '<div class="k-seg' + (disabled ? ' off' : '') + '" role="radiogroup" data-k-for="' + selectId + '">' + options.map(function (o) {
      return '<label><input type="radio" name="' + name + '" value="' + esc(o[0]) + '"' + (String(o[0]) === String(value) ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' + o[1] + '</label>';
    }).join('') + '</div><select id="' + selectId + '" class="k-vh" data-k-done tabindex="-1" aria-hidden="true"' + (disabled ? ' disabled' : '') + '>' + options.map(function (o) {
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
      if (sel.options.length < 2 || sel.options.length > 4) { sel.classList.add('k-input'); return; }
      var box = document.createElement('div'); box.className = 'k-seg' + (sel.disabled ? ' off' : ''); box.setAttribute('role', 'radiogroup'); box.setAttribute('data-k-for', sel.id);
      if (sel.labels && sel.labels[0]) box.setAttribute('aria-label', sel.labels[0].textContent.trim().slice(0, 60));
      box.innerHTML = Array.prototype.map.call(sel.options, function (o) {
        var t = o.textContent, m = t.match(/^(.*?)\s*\((.*)\)\s*$/);   // «100 punti (classico)» → «100 punti» con «classico» sotto
        return '<label title="' + esc(t) + '"><input type="radio" name="kseg-' + esc(sel.id) + '" value="' + esc(o.value) + '"' + (o.selected ? ' checked' : '') + (sel.disabled ? ' disabled' : '') + '><span>' + esc(m ? m[1] : t) + (m ? '<small style="display:block;font-weight:500;font-size:11.5px;opacity:.75">' + esc(m[2]) + '</small>' : '') + '</span></label>';
      }).join('');
      sel.classList.add('k-vh'); sel.setAttribute('aria-hidden', 'true'); sel.tabIndex = -1;
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
  function avatar(name, cls) { var n = String(name || '').trim(); return '<span class="k-avatar' + (cls ? ' ' + cls : '') + (n ? '' : ' off') + '">' + (n ? esc(n.charAt(0).toUpperCase()) : icon('user', 18)) + '</span>'; }
  function toast(t) { var old = document.querySelector('.k-toast'); if (old) old.remove(); var d = document.createElement('div'); d.className = 'k-toast'; d.setAttribute('role', 'status'); d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3400); }

  return { esc: esc, icon: icon, css: css, sw: sw, row: row, group: group, seg: seg, avatar: avatar, toast: toast, accent: accent,
    theme: themeNow, themePref: themePref, setTheme: setTheme, onTheme: function (f) { themeCbs.push(f); } };
})();
