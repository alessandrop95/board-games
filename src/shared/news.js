/* ===== Novità dell'app (home) =====
   Un'icona accanto all'account apre l'elenco delle ultime novità. Il pallino compare finché c'è una novità
   che su questo dispositivo non è ancora stata vista (si ricorda l'ultima vista in localStorage).
   Per aggiungere una novità: una voce in cima a ITEMS, con un id nuovo e mai riusato. */
var News = (function () {
  var KEY = 'pp-news-seen';
  // la più recente in cima. g: giochi collegati [cartella, nome]
  var ITEMS = [
    { id: '2026-11-23-tressette-bastoni', d: '2026-11-23', t: 'Tressette a perdere: asso di bastoni da 11',
      x: 'Nuova opzione nella sala d’attesa: chi apre il tavolo sceglie se l’asso di bastoni vale 1 o 11 punti. Con l’asso da 11 ogni mano vale 21 punti, il cappotto ne regala 21 e si gioca fino a 31, 41, 51 o 61.',
      g: [['tressette', 'Tressette']] },
    { id: '2026-11-23-skyjo-ordine', d: '2026-11-23', t: 'Skyjo: ordine casuale e avversari in fila',
      x: 'A ogni partita, anche nella rivincita, l’ordine dei giocatori si mescola. Gli avversari si vedono nell’ordine in cui giocano: per primo chi viene dopo di te. Quando siete in tanti la fila scorre da sola fino a chi sta giocando.',
      g: [['skyjo', 'Skyjo']] },
    { id: '2026-11-23-quattro-giochi', d: '2026-11-23', t: 'Quattro giochi nuovi',
      x: 'Tra le feste a squadre arrivano <b>Vocabolario bugiardo</b> (inventa definizioni credibili di parole vere e rarissime) ed <b>Emoji in scena</b> (racconta film e modi di dire solo con le emoji). Tra i giochi veloci <b>Dadi e rischio</b> (tiri ancora o ti fermi?) e <b>Asta lampo</b> (offerte segrete, senza bisogno di parlarsi).',
      g: [['vocabolario', 'Vocabolario bugiardo'], ['emoji', 'Emoji in scena'], ['rischio', 'Dadi e rischio'], ['asta', 'Asta lampo']] },
    { id: '2026-11-23-wizard-coperte', d: '2026-11-23', t: 'Wizard: previsioni coperte tutti insieme',
      x: 'Con le previsioni coperte ora tutti scelgono quante prese faranno nello stesso momento, senza aspettare il proprio turno. La mano comincia appena hanno scelto tutti.',
      g: [['presagio', 'Wizard']] },
    { id: '2026-11-23-nomicose-5punti', d: '2026-11-23', t: 'Nomi, cose, città: parole da 5 punti',
      x: 'Una parola contestata non vale più per forza 0: si può votare anche «vale 5 punti». E per ogni parola si vede chi l’ha contestata e come hanno votato gli altri.',
      g: [['nomicose', 'Nomi, cose, città']] }
  ];
  var esc = function (s) { return Kit.esc(s); };
  var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  function day(d) { var p = d.split('-'); return +p[2] + ' ' + MESI[+p[1] - 1] + ' ' + p[0]; }
  function seen() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  // quante novità non ancora viste (tutte, se non se n'è mai vista nessuna)
  function unread() { var s = seen(), n = 0; for (var i = 0; i < ITEMS.length; i++) { if (ITEMS[i].id === s) break; n++; } return n; }
  function markSeen() { try { if (ITEMS.length) localStorage.setItem(KEY, ITEMS[0].id); } catch (e) {} paint(); }

  function buttonHTML() {
    var n = unread();
    return '<button type="button" class="news-btn" data-news="open" aria-label="' + (n ? 'Novità: ' + n + (n === 1 ? ' da leggere' : ' da leggere') : 'Novità') + '" title="Novità">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3.5l1.6 4.4a2 2 0 0 0 1.2 1.2l4.4 1.6-4.4 1.6a2 2 0 0 0-1.2 1.2L10 17.9l-1.6-4.4a2 2 0 0 0-1.2-1.2L2.8 10.7l4.4-1.6a2 2 0 0 0 1.2-1.2z"/><path d="M18 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/><path d="M18.5 3v3M17 4.5h3"/></svg>' +
      (n ? '<i class="news-dot" aria-hidden="true"></i>' : '') + '</button>';
  }
  var slot = null;
  function paint() { if (slot) slot.innerHTML = buttonHTML(); }
  function mount(el) { slot = el; paint(); }

  function close() { var b = document.querySelector('.kit-back[data-news-sheet]'); if (b) b.remove(); }
  function open() {
    var fresh = unread();
    close();
    var back = document.createElement('div'); back.className = 'kit-back'; back.setAttribute('data-news-sheet', '');
    back.addEventListener('click', function (e) { if (e.target === back || e.target.closest('[data-news="close"]')) close(); });
    var list = ITEMS.map(function (it, i) {
      return '<article class="news-it' + (i < fresh ? ' new' : '') + '">' +
        '<div class="news-meta"><time datetime="' + it.d + '">' + day(it.d) + '</time>' + (i < fresh ? '<span class="news-new">Nuovo</span>' : '') + '</div>' +
        '<h3>' + esc(it.t) + '</h3><p>' + it.x + '</p>' +
        (it.g && it.g.length ? '<div class="news-go">' + it.g.map(function (g) { return '<a href="' + g[0] + '/"><img src="' + g[0] + '/icon-180.png" alt="" width="22" height="22" loading="lazy">' + esc(g[1]) + '</a>'; }).join('') + '</div>' : '') +
        '</article>';
    }).join('');
    back.innerHTML = '<div class="kit-sheet" role="dialog" aria-modal="true" aria-labelledby="news-title"><div class="kit-head"><span class="kit-icbtn ghost"></span>' +
      '<h2 id="news-title">Novità</h2><button type="button" class="kit-icbtn" data-news="close" aria-label="Chiudi">' + Kit.icon('x') + '</button></div>' +
      '<div class="kit-body"><div class="news-list">' + list + '</div></div></div>';
    document.body.appendChild(back);
    markSeen();
  }
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-news="open"]')) open(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.querySelector('.kit-back[data-news-sheet]')) close(); });
  window.addEventListener('storage', function (e) { if (e.key === KEY) paint(); });   // letto in un'altra scheda

  function style(t) { Kit.css(); if (document.getElementById('news-css')) return; var s = document.createElement('style'); s.id = 'news-css'; s.textContent = t; (document.head || document.documentElement).appendChild(s); }
  style(
    '.news-btn{appearance:none;position:relative;display:grid;place-items:center;width:40px;height:40px;flex:none;border-radius:50%;border:0;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);color:inherit;cursor:pointer}' +
    '.news-btn:hover{background:rgba(255,255,255,.12)}.news-btn:focus-visible{outline:2px solid var(--k-accent-ink,#e8ab4c);outline-offset:2px}' +
    '[data-k-theme="light"] .news-btn{background:rgba(70,45,20,.05);box-shadow:inset 0 0 0 1px rgba(70,45,20,.14)}[data-k-theme="light"] .news-btn:hover{background:rgba(70,45,20,.08)}' +
    '.news-dot{position:absolute;top:6px;right:6px;width:10px;height:10px;border-radius:50%;background:var(--k-danger,#ff6a5c);box-shadow:0 0 0 2px var(--top,#120d09)}' +
    '.news-list{display:grid;gap:12px}' +
    '.news-it{display:grid;gap:6px;padding:14px;border-radius:16px;background:var(--k-surface);border:1px solid var(--k-line)}' +
    '.news-it.new{border-color:color-mix(in srgb,var(--k-accent) 55%,transparent)}' +
    '.news-meta{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--k-muted)}' +
    '.news-new{font:700 11px/1 var(--k-font);letter-spacing:.05em;text-transform:uppercase;padding:4px 7px;border-radius:999px;background:var(--k-accent);color:var(--k-on-accent)}' +
    '.news-it h3{margin:0;font:700 16px/1.3 var(--k-font);color:var(--k-text)}.news-it p{font-size:14.5px;line-height:1.5;color:var(--k-text);opacity:.88}' +
    '.news-go{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}' +
    '.news-go a{display:inline-flex;align-items:center;gap:7px;padding:4px 10px 4px 4px;border-radius:999px;background:var(--k-surface-2);color:var(--k-text);text-decoration:none;font:600 13px/1 var(--k-font)}' +
    '.news-go a:hover{background:var(--k-surface-3)}.news-go img{border-radius:7px}');
  return { ITEMS: ITEMS, mount: mount, open: open, close: close, unread: unread };
})();
