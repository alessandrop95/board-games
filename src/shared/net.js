/* ===== Rete senza account: MQTT su WebSocket verso broker pubblici gratuiti =====
   (Le pagine dei giochi si rigenerano da sole su GitHub a ogni modifica in src/: azione «Ricostruisci i giochi».)
   Modello: il dispositivo "host" del tavolo tiene la verità. Pubblica lo stato completo
   come messaggio "retained" (chi arriva lo riceve subito); gli altri inviano solo azioni.
   Robustezza: controllo continuo che il server risponda, riconnessione immediata quando
   la pagina torna in primo piano, subentro automatico se l'host sparisce.
   App in secondo piano: finché il telefono lascia girare la pagina, la connessione resta viva (battito da un
   Web Worker, che il browser non rallenta) e gli altri vedono «in pausa» invece di «offline»; se chi regge il
   tavolo smette di guardare, il comando passa subito a chi è presente e torna al titolare quando rientra. */

var NETQ = new URLSearchParams(location.search);
var NET_PING_MS = +(NETQ.get('ping') || 10000);     // ogni quanto si interroga il server
var NET_DEAD_MS = +(NETQ.get('dead') || 15000);     // silenzio oltre il quale si verifica la connessione
var NET_PROBE_MS = 5000;                            // attesa della risposta alla verifica
var NET_WAKE_PROBE_MS = 2500;                       // la stessa attesa, più corta, quando la pagina torna in primo piano
var NET_KEEP_S = +(NETQ.get('keep') || 120);        // silenzio che il server tollera (×1,5) prima di scollegarci: largo, così regge anche i timer rallentati
var NET_STALE_MS = +(NETQ.get('stale') || 30000);   // dopo un sonno così lungo non si verifica nemmeno: ci si ricollega subito

/* ---------- battito che non si ferma in secondo piano ----------
   I timer di una pagina nascosta vengono rallentati dal browser (fino a uno al minuto). I controlli periodici
   (ping, presenza, tavolo) passano da qui: mentre si è a un tavolo il battito arriva da un Web Worker, che non
   viene rallentato. Se il telefono sospende del tutto la pagina, al risveglio ce ne accorgiamo dal salto d'orario. */
var Beat = (function () {
  var jobs = [], worker = null, last = Date.now(), gapFn = null;
  function pump() {
    var now = Date.now(), gap = now - last; last = now;
    if (gap > 8000 && gapFn) { try { gapFn(gap); } catch (e) {} }
    jobs.slice().forEach(function (j) {
      if (j.dead || now - j.last < j.ms - 60) return;
      j.last = now; try { j.fn(); } catch (e) { console.warn('battito', e); }
    });
  }
  setInterval(pump, 1000);
  // fn ogni ms millisecondi (al secondo più vicino); restituisce la funzione per smettere
  function every(ms, fn) { var j = { ms: ms, fn: fn, last: Date.now(), dead: false }; jobs.push(j); return function () { j.dead = true; jobs = jobs.filter(function (x) { return x !== j; }); }; }
  function boost(on) {
    if (on && !worker) {
      try {
        worker = new Worker(URL.createObjectURL(new Blob(['setInterval(function(){postMessage(1)},1000)'], { type: 'text/javascript' })));
        worker.onmessage = pump; worker.onerror = function () { worker = null; };
      } catch (e) { worker = null; }
    } else if (!on && worker) { try { worker.terminate(); } catch (e) {} worker = null; }
  }
  return { every: every, boost: boost, onGap: function (f) { gapFn = f; }, get boosted() { return !!worker; } };
})();

/* ---------- client MQTT 3.1.1 minimo ---------- */
function MQ(url) {
  this.url = url; this.subs = {}; this.handlers = []; this.statusHandlers = [];
  this.connected = false; this.closed = false; this.pid = 1; this.buf = new Uint8Array(0); this.acks = {};
  this.backoff = 800; this.lastRx = Date.now(); this.id = 'pp' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-6);
  var self = this;
  this.ready = new Promise(function (res, rej) { self._res = res; self._rej = rej; });
  this._open();
}
MQ.enc = new TextEncoder(); MQ.dec = new TextDecoder();
MQ.str = function (s) { var b = MQ.enc.encode(s); return [b.length >> 8, b.length & 255].concat(Array.from(b)); };
MQ.packet = function (head, body) {
  var len = body.length, rl = [];
  do { var d = len % 128; len = Math.floor(len / 128); if (len > 0) d |= 128; rl.push(d); } while (len > 0);
  var out = new Uint8Array(1 + rl.length + body.length);
  out[0] = head; out.set(rl, 1); out.set(body, 1 + rl.length);
  return out;
};
MQ.prototype._open = function () {
  var self = this, ws;
  clearTimeout(this.retryTimer); this.retryTimer = null;
  try { ws = new WebSocket(this.url, ['mqtt']); } catch (e) { this.ws = null; this._down(); return; }
  ws.binaryType = 'arraybuffer'; this.ws = ws; this.buf = new Uint8Array(0);
  this.openTimer = setTimeout(function () { if (!self.connected && self.ws === ws) self._drop(); }, 7000);
  ws.onopen = function () {
    var body = MQ.str('MQTT').concat([4, 0x02, NET_KEEP_S >> 8, NET_KEEP_S & 255]).concat(MQ.str(self.id));
    ws.send(MQ.packet(0x10, body));
  };
  ws.onmessage = function (ev) {
    if (self.ws !== ws) return;
    self.lastRx = Date.now();
    var chunk = new Uint8Array(ev.data), b = new Uint8Array(self.buf.length + chunk.length);
    b.set(self.buf); b.set(chunk, self.buf.length); self.buf = b; self._parse();
  };
  ws.onclose = function () { if (self.ws === ws) { self.ws = null; self._down(); } };
  ws.onerror = function () {};
};
// Chiude subito una connessione sospetta (anche se il browser la crede ancora aperta) e riparte.
MQ.prototype._drop = function () {
  var ws = this.ws; this.ws = null;
  if (ws) { ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null; try { ws.close(); } catch (e) {} }
  this._down();
};
MQ.prototype._down = function () {
  var self = this, was = this.connected;
  this.connected = false; if (this.pinger) { this.pinger(); this.pinger = null; } clearTimeout(this.openTimer); clearTimeout(this.probeTimer); this.probeTimer = null; this.acks = {};
  if (was) this.statusHandlers.forEach(function (f) { f(false); });
  if (this.closed) return;
  if (!this.everUp) { this._rej(new Error('broker non raggiungibile')); this.closed = true; return; }
  if (this.retryTimer) return;
  this.retryTimer = setTimeout(function () { self.retryTimer = null; if (!self.closed && !self.ws) self._open(); }, this.backoff);
  this.backoff = Math.min(this.backoff * 1.7, 8000);
};
// Verifica attiva: manda un ping e, se entro pochi secondi non arriva nulla, considera la connessione morta.
MQ.prototype.probe = function (ms) {
  var self = this;
  if (!this.connected || this.probeTimer) return;
  var since = Date.now();
  this._raw(MQ.packet(0xC0, []));
  this.probeTimer = setTimeout(function () { self.probeTimer = null; if (self.connected && self.lastRx < since) self._drop(); }, ms || NET_PROBE_MS);
};
// Da chiamare quando la pagina torna visibile o la rete torna disponibile.
MQ.prototype.wake = function () {
  if (this.closed) return;
  // dopo un lungo sonno (app in background) il server ci ha già scollegati: inutile aspettare la verifica, si riparte subito
  if (this.connected && Date.now() - this.lastRx > NET_STALE_MS) { this._drop(); return; }
  if (this.connected) { this.probe(NET_WAKE_PROBE_MS); return; }
  if (!this.ws) { this.backoff = 800; this._open(); }
};
MQ.prototype._parse = function () {
  var b = this.buf;
  while (b.length >= 2) {
    var mult = 1, len = 0, i = 1, d;
    do { if (i >= b.length) return; d = b[i++]; len += (d & 127) * mult; mult *= 128; } while (d & 128);
    if (b.length < i + len) break;
    this._handle(b[0], b.subarray(i, i + len));
    b = b.subarray(i + len);
  }
  this.buf = b.slice();
};
MQ.prototype._handle = function (h, body) {
  var type = h >> 4, self = this;
  if (type === 2) { // CONNACK
    if (body[1] !== 0) { this._drop(); return; }
    clearTimeout(this.openTimer);
    this.connected = true; this.everUp = true; this.backoff = 800;
    if (this.pinger) this.pinger();
    this.pinger = Beat.every(NET_PING_MS, function () {
      if (Date.now() - self.lastRx > NET_DEAD_MS) self.probe();
      else self._raw(MQ.packet(0xC0, []));
    });
    var topics = Object.keys(this.subs); if (topics.length) this._sub(topics);
    this._res(this);
    this.statusHandlers.forEach(function (f) { f(true); });
  } else if (type === 3) { // PUBLISH
    var qos = (h >> 1) & 3, tl = (body[0] << 8) | body[1], topic = MQ.dec.decode(body.subarray(2, 2 + tl)), p = 2 + tl;
    if (qos > 0) { var id = [body[p], body[p + 1]]; p += 2; if (qos === 1) this._raw(MQ.packet(0x40, id)); }
    var payload = MQ.dec.decode(body.subarray(p)), retained = !!(h & 1);
    this.handlers.forEach(function (f) { f(topic, payload, retained); });
  } else if (type === 9) { // SUBACK: il server ha registrato l'iscrizione
    var sid = (body[0] << 8) | body[1], ack = this.acks[sid];
    if (ack) { delete this.acks[sid]; ack(); }
  }
};
MQ.prototype._raw = function (pkt) { if (this.ws && this.ws.readyState === 1) { try { this.ws.send(pkt); return true; } catch (e) {} } return false; };
MQ.prototype._nextId = function () { this.pid = this.pid % 65000 + 1; return [this.pid >> 8, this.pid & 255]; };
MQ.prototype._sub = function (topics) {
  var body = this._nextId(), id = this.pid;
  topics.forEach(function (t) { body = body.concat(MQ.str(t), [0]); });
  this._raw(MQ.packet(0x82, body));
  return id;
};
// Richiede di nuovo un argomento già seguito: il server rimanda i messaggi conservati (per esempio la lista dei tavoli).
MQ.prototype.resub = function (topic) { if (!this.connected || !this.subs[topic]) return false; this._sub([topic]); return true; };
// onAck (facoltativa): chiamata quando il server conferma l'iscrizione; i messaggi conservati arrivano subito dopo.
MQ.prototype.subscribe = function (topic, onAck) { this.subs[topic] = true; if (this.connected) { var id = this._sub([topic]); if (onAck) this.acks[id] = onAck; } };
MQ.prototype.unsubscribe = function (topic) {
  if (!this.subs[topic]) return; delete this.subs[topic];
  if (this.connected) this._raw(MQ.packet(0xA2, this._nextId().concat(MQ.str(topic))));
};
// Niente coda: un messaggio inviato mentre si è scollegati va perso (chi invia riprova da sé),
// così una mossa vecchia non può arrivare in ritardo dopo che l'app ha detto che non è passata.
MQ.prototype.publish = function (topic, payload, retain) {
  if (!this.connected) return false;
  var body = MQ.str(topic).concat(Array.from(MQ.enc.encode(payload)));
  return this._raw(MQ.packet(0x30 | (retain ? 1 : 0), body));
};
MQ.prototype.onMessage = function (f) { this.handlers.push(f); };
MQ.prototype.onStatus = function (f) { this.statusHandlers.push(f); };

/* ---------- tavolo condiviso ---------- */
var Net = (function () {
  var qs = NETQ;
  var BROKERS = qs.get('broker') ? qs.get('broker').split(',') : [
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://broker.emqx.io:8084/mqtt',
    'wss://test.mosquitto.org:8081/mqtt'
  ];
  var HOST_TIMEOUT = +(qs.get('hostTimeout') || 12000);          // dopo quanto mostrare l'avviso
  var AUTO_TAKEOVER = +(qs.get('autoTakeover') || HOST_TIMEOUT * 1.25); // dopo quanto subentrare da soli in partita (in sala d'attesa il doppio)
  var STAGGER = +(qs.get('stagger') || 5000);                     // attesa extra per ogni giocatore prima di me
  var GIVEBACK = +(qs.get('giveBack') || 5000);                   // il titolare è tornato e guarda il tavolo da così tanto: gli si rende il comando
  var PROXY_MS = +(qs.get('proxyMs') || 5500);                    // host muto da così tanto: chi arriva si siede da solo
  var TABLE_MAX_AGE = 7 * 24 * 3600e3;                            // un tavolo fermo da una settimana è abbandonato: si chiude da solo
  var PREFIX = window.GAME_PREFIX || 'polvere-piombo/v1/';
  var uid = null; try { uid = localStorage.getItem('pp-uid'); } catch (e) {}
  if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6); try { localStorage.setItem('pp-uid', uid); } catch (e) {} }
  var clients = {}, reducer = null, beforePublish = null, onTakeover = null, lobbyInfo = null;
  var LOBBY_BEAT = +(qs.get('lobbyBeat') || 20000);   // ogni quanto l'host conferma che il tavolo è vivo
  var LOBBY_TTL = +(qs.get('lobbyTtl') || 150000);    // oltre questo silenzio il tavolo sparisce dalla lista
  var LOBBY_REFRESH = +(qs.get('lobbyRefresh') || 5000); // ogni quanto la lista dei tavoli si richiede al server
  var LOBBY_SWEEP = +(qs.get('lobbySweep') || 3000);     // attesa delle risposte prima di togliere i tavoli spariti
  var FIND_MS = +(qs.get('findMs') || 4500);          // attesa massima della risposta quando si cerca un tavolo
  var PRES_MS = +(qs.get('presMs') || 35000);       // oltre questo silenzio un giocatore risulta offline
  var HB_MS = Math.min(10000, PRES_MS / 3);          // ogni quanto ognuno dice «ci sono»
  var HID_MS = Math.max(25000, HB_MS * 2.5);         // «in pausa» vale finché viene confermato
  function lobbyTopic(id) { return PREFIX + 'lobby/' + id; }
  /* Stesso tavolo aperto in due schede dello stesso telefono/computer: resta attiva solo l'ultima aperta
     (due schede con la stessa identità applicherebbero le mosse due volte e la partita si sdoppierebbe). */
  var TAB = Math.random().toString(36).slice(2, 10), bc = null;
  try { bc = new BroadcastChannel('pp-tables'); bc.onmessage = function (ev) { var m = ev.data || {}; if (m.k === 'open' && T && m.tab !== TAB && m.key === PREFIX + T.code) displaced(); }; } catch (e) { bc = null; }
  function displaced() {
    close({ quiet: true });
    if (document.getElementById('pp-displaced')) return;
    var o = document.createElement('div'); o.id = 'pp-displaced';
    o.setAttribute('style', 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:24px;background:rgba(8,8,12,.86);color:#fff;font:16px/1.45 system-ui,sans-serif;text-align:center');
    o.innerHTML = '<div style="max-width:340px;display:grid;gap:14px"><b style="font-size:19px">Tavolo aperto in un’altra scheda</b><span>Hai aperto lo stesso tavolo in un’altra scheda o finestra: si gioca da lì. Qui il tavolo è in pausa.</span>' +
      '<button type="button" style="font:inherit;font-weight:700;padding:12px 18px;border-radius:12px;border:0;background:#f2c14e;color:#111;cursor:pointer">Gioca da questa scheda</button></div>';
    o.querySelector('button').onclick = function () { location.reload(); };
    document.body.appendChild(o);
  }
  function rid() { return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6); }
  var T = null; // sessione del tavolo aperto

  function client(i) {
    if (!clients[i]) {
      clients[i] = new MQ(BROKERS[i]);
      clients[i].ready.catch(function () { delete clients[i]; });
    }
    return clients[i].ready;
  }
  function topic(code, t) { return PREFIX + code + '/' + t; }

  // Ritorno in primo piano o rete di nuovo disponibile: verifica subito la connessione.
  function wakeAll() {
    Object.keys(clients).forEach(function (k) { clients[k].wake(); });
    if (T) { T.lastPing = Math.max(T.lastPing, Date.now() - 2000); T.graceUntil = Date.now() + 8000; heartbeat(T, true); }
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') { wakeAll(); return; }
    // la pagina va in secondo piano: gli altri lo sanno subito e, se reggo io la partita, la passo a chi sta guardando
    if (T) { heartbeat(T, true); maybeHandOver(T); }
  });
  window.addEventListener('online', wakeAll);
  window.addEventListener('pageshow', wakeAll);
  window.addEventListener('focus', wakeAll);
  document.addEventListener('resume', wakeAll);   // la pagina era stata «congelata» dal browser
  try { if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener('change', wakeAll); } catch (e) {}   // da Wi-Fi a rete mobile
  Beat.onGap(wakeAll);                             // il telefono (o il computer) ha dormito senza avvisare

  // quick (facoltativo): se il server conferma l'iscrizione e poco dopo non è arrivato niente, il tavolo non c'è
  // (senza aspettare tutta l'attesa massima). Si usa solo per scegliere un codice libero.
  function probeState(c, code, ms, quick) {
    return new Promise(function (res) {
      var st = topic(code, 'state'), done = false;
      function fin(v) { if (done) return; done = true; c.handlers = c.handlers.filter(function (x) { return x !== h; }); res(v); }
      function h(t, p) { if (t === st) fin(p ? safeParse(p) : null); }
      c.onMessage(h);
      c.subscribe(st, quick ? function () { setTimeout(function () { fin(null); }, quick); } : null);
      setTimeout(function () { fin(null); }, ms);
    });
  }
  function expired(d) { return !!(d && !d.closed && d.updated && Date.now() - d.updated > TABLE_MAX_AGE); }
  // Chiude un tavolo sul server: lascia una «lapide» (così nessuno lo riapre per errore) e lo toglie dalla lista.
  function tombstone(c, code, d) {
    var ok = c.publish(topic(code, 'state'), JSON.stringify({ code: code, closed: true, rev: ((d && d.rev) || 0) + 1, updated: Date.now() }), true);
    if (ok) { if (d && d.lobbyId) c.publish(lobbyTopic(d.lobbyId), '', true); c.publish(topic(code, 'chatlog'), '', true); }
    return ok;
  }
  function safeParse(p) { try { return JSON.parse(p); } catch (e) { return null; } }
  async function firstBroker() {
    for (var i = 0; i < BROKERS.length; i++) { try { return { i: i, c: await client(i) }; } catch (e) {} }
    throw 'Nessun server di gioco raggiungibile. Controlla la connessione e riprova.';
  }
  // Cerca un tavolo su tutti i server in parallelo, con un'attesa generosa (reti lente, pagina appena riaperta).
  // Risponde: {i, c, doc} se c'è; {closed:true} se è stato chiuso; {offline:true} se nessun server risponde; null se non c'è.
  function find(code, ms) {
    ms = ms || FIND_MS;
    return new Promise(function (resolve) {
      var pending = BROKERS.length, reached = false, closed = false, done = false;
      function finish(v) { if (!done) { done = true; resolve(v); } }
      BROKERS.forEach(function (_, i) {
        client(i).then(function (c) {
          reached = true;
          if (done) return;
          return probeState(c, code, ms).then(function (doc) {
            if (expired(doc)) { tombstone(c, code, doc); doc = { code: code, closed: true }; }   // abbandonato da giorni
            if (doc && doc.code === code && !doc.closed) { finish({ i: i, c: c, doc: doc }); return; }
            if (!(T && T.code === code)) c.unsubscribe(topic(code, 'state'));
            if (doc && doc.closed) closed = true;
          });
        }).catch(function () {}).then(function () { if (--pending === 0) finish(!reached ? { offline: true } : closed ? { closed: true } : null); });
      });
    });
  }

  // «Solo amici» serve l'account (gli amici sono quelli del server): senza, il tavolo resta aperto a tutti.
  function visOf(v) { return v === 'invite' || v === 'direct' ? v : v === 'friends' && window.Account && Account.user() ? 'friends' : 'public'; }
  /* --- «Invita amico»: tavolo privato. Non compare in nessuna lista; entra solo chi ha un invito personale dell'host.
     Ogni invito è una chiave casuale nel link (?t=CODICE&k=CHIAVE); nello stato del tavolo c'è solo la sua impronta,
     e la prima persona che la usa per sedersi se la tiene: per gli altri quel link non vale più. --- */
  function khash(str) {   // impronta di una chiave (cyrb53)
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  var KEYS = 'pp-keys';
  function keyFor(code) { try { var m = JSON.parse(localStorage.getItem(KEYS) || '{}'); return m[PREFIX + code] || null; } catch (e) { return null; } }
  (function () {   // chi apre un link d'invito personale: la chiave resta su questo telefono (anche ricaricando la pagina)
    try {
      var q = new URLSearchParams(location.search), t = (q.get('t') || '').toUpperCase(), k = q.get('k') || '';
      if (!/^[A-Z]{4}$/.test(t) || !/^[a-z0-9]{8,24}$/.test(k)) return;
      var m = JSON.parse(localStorage.getItem(KEYS) || '{}'); m[PREFIX + t] = k;
      var ks = Object.keys(m); if (ks.length > 30) delete m[ks[0]];
      localStorage.setItem(KEYS, JSON.stringify(m));
    } catch (e) {}
  })();
  function seatedIn(d, u) { return !!(d && d.seats && d.seats.some(function (s) { return s.uid === u; })); }
  // Questo telefono può entrare nel tavolo privato? (host, già seduto, oppure con un invito ancora valido per lui)
  function mayEnter(d, u, k) {
    if (!d || d.vis !== 'direct' || d.host === u || seatedIn(d, u)) return true;
    if (!k) return false;
    var h = khash(String(k));
    return (d.keys || []).some(function (x) { return x.h === h && (!x.u || x.u === u); });
  }
  var PRIVATE = 'Questo tavolo è privato: entri solo con l’invito personale di chi l’ha aperto.';
  function peekAt(prefix, code, ms) {
    return new Promise(function (resolve) {
      var st = prefix + code + '/state', pending = BROKERS.length, done = false, closed = false;
      function fin(v) { if (!done) { done = true; resolve(v); } }
      BROKERS.forEach(function (_, i) {
        client(i).then(function (c) {
          return new Promise(function (res) {
            var t0 = setTimeout(function () { c.handlers = c.handlers.filter(function (x) { return x !== h; }); c.unsubscribe(st); res(); }, ms || 4000);
            function h(t, p) { if (t !== st) return; var d = p ? safeParse(p) : null; if (expired(d)) d = { closed: true }; if (d && d.closed) closed = true; else if (d && d.code === code) { clearTimeout(t0); c.handlers = c.handlers.filter(function (x) { return x !== h; }); c.unsubscribe(st); fin({ doc: d }); } }
            c.onMessage(h); c.subscribe(st);
          });
        }).catch(function () {}).then(function () { if (--pending === 0) fin(closed ? { closed: true } : null); });
      });
    });
  }
  function acctName() { var a = window.Account && Account.user && Account.user(); return a && /^[A-Za-z0-9_.-]{3,18}$/.test(a.username || '') ? a.username : null; }
  function newCode() { var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ', s = ''; for (var i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }

  async function create(nick, opts) {
    var b = await firstBroker();
    for (var k = 0; k < 6; k++) {
      var code = newCode();
      var ex = await probeState(b.c, code, 1200, 400);
      b.c.unsubscribe(topic(code, 'state'));
      if (ex && ex.code && !ex.closed && !expired(ex)) continue;
      var seat = { uid: uid, nick: nick }, an = acctName(); if (an) seat.acct = an;
      // host = chi regge il tavolo adesso; owner = il titolare (chi l'ha aperto): se il comando passa a un altro
      // mentre lui non c'è, al suo ritorno gli viene reso.
      var doc = { code: code, host: uid, owner: uid, phase: 'lobby', seats: [seat], game: null, created: Date.now(), rev: ((ex && ex.rev) || 0) + 1, updated: Date.now(),
        vis: visOf(opts && opts.vis), lobbyId: rid() };
      if (opts && opts.practice) { doc.practice = true; doc.vis = 'invite'; }
      if (!b.c.publish(topic(code, 'state'), JSON.stringify(doc), true)) throw 'La connessione è caduta. Riprova.';
      if (window.Alerts && !doc.practice) Alerts.created(PREFIX, code, nick, doc.vis);
      return code;
    }
    throw 'Non sono riuscito a creare il tavolo. Riprova.';
  }

  // Apre un tavolo: chiama onDoc(doc) a ogni nuovo stato, onStatus() quando cambia la connessione.
  async function open(code, onDoc, onStatus) {
    close();
    var f = await find(code);
    if (f && f.offline) throw 'Nessun server di gioco raggiungibile. Controlla la connessione e riprova.';
    if (!f || !f.doc) return f && f.closed ? 'closed' : 'missing';
    if (!mayEnter(f.doc, uid, keyFor(code))) { f.c.unsubscribe(topic(code, 'state')); return 'private'; }
    var c = f.c;
    T = { code: code, c: c, doc: null, isHost: false, onDoc: onDoc, onStatus: onStatus, pending: {}, answered: {}, answeredKeys: [], lastPing: Date.now(), up: c.connected, stops: [], graceUntil: 0, chat: [], chatIds: {},
      seen: {}, hid: {}, visSince: {}, lost: {}, upSince: Date.now(), lastHb: 0, sentHid: null, resync: false, unpub: false, hostRev: 0 };
    var me = T;
    var tState = topic(code, 'state'), tAct = topic(code, 'act'), tRes = topic(code, 'res/' + uid), tPing = topic(code, 'ping'), tChat = topic(code, 'chat'), tLog = topic(code, 'chatlog'), tHb = topic(code, 'hb'), tVis = topic(code, 'vis'), tReact = topic(code, 'react');
    me.handler = function (t, p) {
      if (T !== me) return;
      if (t === tState) {
        if (!p) { me.doc = null; onDoc(null); return; }
        var d = safeParse(p); if (!d) return;
        if (d.closed) { if (!me.doc || (d.rev || 0) >= (me.doc.rev || 0)) { me.doc = null; me.closed = true; onDoc(null); } return; }
        if (me.resync) { endResync(me, d); return; }
        if (me.doc) {
          var dr = d.rev || 0, mr = me.doc.rev || 0;
          // stessa versione ma host diverso (due subentri quasi simultanei): vince l'id più basso
          var tie = dr === mr && d.host !== me.doc.host && String(d.host) < String(me.doc.host);
          if (dr < mr || (dr === mr && !tie)) return;
        }
        me.lastPing = Date.now();
        accept(d);
      } else if (t === tPing) { me.lastPing = Date.now(); if (me.doc) heard(me, me.doc.host); }
      else if (t === tHb) { var hu = String(p || '').slice(0, 40); if (hu) heard(me, hu); }
      else if (t === tVis) { var vm = /^([^|]{1,40})\|([hv])$/.exec(String(p || '')); if (vm) heard(me, vm[1], vm[2] === 'h'); }
      else if (t === tRes) {
        var r = safeParse(p); if (!r || !me.pending[r.id]) return;
        var pd = me.pending[r.id]; delete me.pending[r.id]; clearInterval(pd.timer);
        if (r.err) pd.rej(r.err); else pd.res(r.out || null);
      } else if (t === tChat) {
        var cm = safeParse(p); if (cm && cm.uid) heard(me, String(cm.uid).slice(0, 40), false);
        if (addChat(me, cm, false) && me.isHost) saveChatLog(me);
      } else if (t === tReact) {
        var rm = safeParse(p); if (rm && rm.uid) { heard(me, String(rm.uid).slice(0, 40), false); if (reactCb) reactCb(rm); }
      } else if (t === tLog) {
        var arr = p ? safeParse(p) : null;
        if (Array.isArray(arr)) arr.forEach(function (m) { addChat(me, m, true); });
      } else if (t === tAct && me.isHost && !me.resync) {
        var m = safeParse(p); if (!m || !m.id || !m.from) return;
        heard(me, String(m.from).slice(0, 40));
        hostHandle(m);
      }
    };
    c.onMessage(me.handler);
    me.statusFn = function (up) {
      if (T !== me) return;
      me.up = up;
      if (up) {
        me.lastPing = Date.now(); me.graceUntil = Date.now() + 8000; me.upSince = Date.now();
        // Appena ricollegati si aspetta lo stato salvato sul server prima di pubblicare qualsiasi cosa:
        // se intanto un altro giocatore ha preso il comando, vale il suo stato (vedi endResync).
        me.resync = true; clearTimeout(me.resyncTimer);
        me.resyncTimer = setTimeout(function () { if (T === me) endResync(me, null); }, 2500);
        heartbeat(me, true);
      }
      if (onStatus) onStatus();
    };
    c.onStatus(me.statusFn);
    c.subscribe(tRes); c.subscribe(tPing); c.subscribe(tState); c.subscribe(tLog); c.subscribe(tChat); c.subscribe(tHb); c.subscribe(tVis); c.subscribe(tReact);
    accept(f.doc);
    heartbeat(me, true);
    if (bc) { try { bc.postMessage({ k: 'open', key: PREFIX + code, tab: TAB }); } catch (e) {} }
    Beat.boost(true);   // seduti a un tavolo: il battito non deve rallentare se l'app va in secondo piano
    me.stops.push(Beat.every(Math.min(5000, Math.max(1000, HOST_TIMEOUT / 4)), function () {
      if (T !== me) return;
      heartbeat(me, false);
      if (me.isHost) {
        c.publish(tPing, String(Date.now()), false);
        if (Date.now() - (me.lastAnn || 0) > LOBBY_BEAT) announce(true);
        maybeHandOver(me); maybeGiveBack(me);
      } else maybeTakeOver(me);
      if (onStatus) onStatus();
    }));
    return true;
  }
  // Ho sentito un giocatore. hidden: true = ha l'app in secondo piano, false = la sta guardando, niente = non lo dice.
  function heard(me, u, hidden) {
    var now = Date.now(), prev = me.seen[u] || 0;
    me.seen[u] = now;
    if (hidden === true) { me.hid[u] = now; me.visSince[u] = 0; return; }
    if (hidden === false) delete me.hid[u];
    else if (me.hid[u] && now - me.hid[u] > HID_MS) delete me.hid[u];
    if (!me.hid[u] && (!me.visSince[u] || now - prev > Math.max(15000, HB_MS * 2))) me.visSince[u] = now;   // presente e attento da adesso
  }
  // Fine della risincronizzazione dopo una disconnessione. d = stato trovato sul server (o null se non è arrivato).
  function endResync(me, d) {
    if (!me.resync) return;
    me.resync = false; clearTimeout(me.resyncTimer);
    // Ero l'host ma sul server c'è uno stato pubblicato da un altro dopo che avevo preso il comando:
    // mentre ero via qualcuno è subentrato. Vale il suo stato; le mie modifiche fatte offline si scartano.
    if (d && me.isHost && d.host !== uid && (d.rev || 0) >= (me.hostRev || 0)) { me.unpub = false; me.lastPing = Date.now(); accept(d); return; }
    // (stessa versione ma io non avevo pubblicato la mia: mentre ero via qualcuno si è seduto da solo, vedi selfSeat)
    if (d && (!me.doc || (d.rev || 0) > (me.doc.rev || 0) || (me.unpub && (d.rev || 0) === (me.doc.rev || 0)))) { me.unpub = false; me.lastPing = Date.now(); accept(d); return; }
    // Sono l'host e il server ha uno stato più vecchio del mio (o niente): pubblico il mio.
    if (me.isHost && me.doc && (me.unpub || !d || (d.rev || 0) < (me.doc.rev || 0))) flush(me);
  }
  function flush(me) {
    me.doc.updated = Date.now();
    me.unpub = !(me.up && me.c.publish(topic(me.code, 'state'), JSON.stringify(me.doc), true));
    if (!me.unpub) announce(true);
  }
  // Segnale di presenza: ogni giocatore lo manda ogni 10 secondi finché la pagina gira ed è collegata.
  // Con l'app in secondo piano aggiunge «sono in pausa»: gli altri lo vedono distinto da chi è sparito davvero.
  function heartbeat(me, now) {
    if (!me.up || (!now && Date.now() - me.lastHb < HB_MS)) return;
    var hidden = document.visibilityState === 'hidden';
    if (me.c.publish(topic(me.code, 'hb'), uid, false)) me.lastHb = Date.now();
    if ((hidden || me.sentHid !== hidden) && me.c.publish(topic(me.code, 'vis'), uid + '|' + (hidden ? 'h' : 'v'), false)) me.sentHid = hidden;
  }
  // 'on' = collegato e sta guardando, 'away' = collegato ma con l'app in secondo piano, 'off' = non si sente da un po',
  // null = non si sa ancora (appena entrati o offline noi).
  function presence(u) {
    if (!T || !u || /^bot-/.test(u)) return null;
    if (u === uid) return T.up ? 'on' : 'off';
    var s = T.seen[u], now = Date.now();
    if (s && now - s < PRES_MS) return T.hid[u] && now - T.hid[u] < HID_MS ? 'away' : 'on';
    if (!T.up || T.resync || now - T.upSince < PRES_MS) return null;
    return 'off';
  }
  // Da quanto non si sente un giocatore che risulta offline (0 se è collegato o non si sa).
  function offlineFor(u) { if (!T) return 0; return presence(u) === 'off' ? Date.now() - Math.max(T.seen[u] || 0, T.upSince) : 0; }
  var presCss = false;
  function dot(u) {
    var st = presence(u); if (!st) return '';
    if (!presCss) {
      presCss = true; var el = document.createElement('style');
      el.textContent = '.pres{display:inline-block;width:9px;height:9px;border-radius:50%;margin:0 6px 1px 0;vertical-align:middle;flex:none}.pres-on{background:#3fd27a;box-shadow:0 0 0 2px rgba(63,210,122,.25)}.pres-off{background:#9aa0a8;box-shadow:0 0 0 2px rgba(154,160,168,.2)}.pres-away{background:#f0b33e;box-shadow:0 0 0 2px rgba(240,179,62,.25)}.pres-t{font-size:.78em;opacity:.75;margin-left:6px;font-weight:400;white-space:nowrap}';
      document.head.appendChild(el);
    }
    return '<i class="pres pres-' + st + '" title="' + (st === 'on' ? 'Collegato' : st === 'away' ? 'Collegato, con l’app in secondo piano' : 'Offline') + '" aria-hidden="true"></i>';
  }
  function offTag(u) { var st = presence(u); return st === 'off' ? '<span class="pres-t">offline</span>' : st === 'away' ? '<span class="pres-t">in pausa</span>' : ''; }
  function presenceSig() { if (!T || !T.doc) return ''; return T.doc.seats.map(function (s) { return s.bot ? '' : presence(s.uid) || '-'; }).join(''); }
  // Subentro automatico: solo un giocatore seduto, collegato e con la pagina aperta.
  // Per evitare due subentri insieme, ognuno aspetta in più in base al suo posto.
  // In partita si subentra presto (chi aspetta la sua mossa non deve restare fermo); in sala d'attesa con più calma,
  // perché lì chi ha aperto il tavolo spesso è solo andato a mandare l'invito agli amici.
  function maybeTakeOver(me) {
    if (!me.doc || me.closed || !me.up || me.resync || document.visibilityState === 'hidden' || Date.now() < me.graceUntil) return;
    var humans = me.doc.seats.filter(function (s) { return !s.bot && s.uid !== me.doc.host; }).map(function (s) { return s.uid; });
    var rank = humans.indexOf(uid);
    if (rank < 0) return;
    if (Date.now() - me.lastPing < AUTO_TAKEOVER * (me.doc.phase === 'lobby' ? 2 : 1) + rank * STAGGER) return;
    me.lost[me.doc.host] = (me.lost[me.doc.host] || 0) + 1;
    takeHost(true);
    if (onTakeover) onTakeover();
  }
  function seatedHuman(d, u) { return !!(d && d.seats && d.seats.some(function (s) { return s.uid === u && !s.bot; })); }
  // Reggo la partita ma la mia app è finita in secondo piano (il telefono può sospenderla da un momento all'altro):
  // passo subito il comando a chi sta guardando il tavolo. Resto il titolare: quando torno mi viene reso.
  // In sala d'attesa no: lì il comando serve a chi ha aperto il tavolo (opzioni, inizio della partita).
  function maybeHandOver(me) {
    if (T !== me || !me.isHost || !me.doc || me.doc.phase === 'lobby' || me.closed || !me.up || me.resync || me.unpub || document.visibilityState !== 'hidden') return;
    var next = me.doc.seats.filter(function (s) { return !s.bot && s.uid !== uid && presence(s.uid) === 'on'; })[0];
    if (!next) return;
    hostApply(function (w) { if (!w.owner) w.owner = uid; w.host = next.uid; return true; });
  }
  // Reggo il tavolo al posto del titolare e lui è tornato (collegato, con il tavolo davanti, da qualche secondo):
  // gli rendo il comando. Se l'aveva già perso più volte per la connessione, aspetto un po' di più.
  function maybeGiveBack(me) {
    var d = me.doc;
    if (T !== me || !me.isHost || !d || !d.owner || d.owner === uid || me.closed || !me.up || me.resync || me.unpub) return;
    if (!seatedHuman(d, d.owner) || presence(d.owner) !== 'on') return;
    var since = me.visSince[d.owner];
    if (!since || Date.now() - since < GIVEBACK * (1 + 3 * Math.min(4, me.lost[d.owner] || 0))) return;
    hostApply(function (w) { if (w.owner === uid || !seatedHuman(w, w.owner)) return false; w.host = w.owner; return true; });
  }
  function accept(d) {
    T.doc = d;
    var shouldHost = d.host === uid;
    if (shouldHost && !T.isHost) { T.isHost = true; T.hostRev = d.rev || 0; T.c.subscribe(topic(T.code, 'act')); T.c.publish(topic(T.code, 'ping'), String(Date.now()), false); }
    if (!shouldHost && T.isHost) { T.isHost = false; T.c.unsubscribe(topic(T.code, 'act')); }
    if (T.isHost && !d.lobbyId) { setTimeout(function () { hostApply(function (w) { if (w.lobbyId) return false; w.lobbyId = rid(); w.vis = w.vis || 'public'; return true; }); }, 0); }
    else if (T.isHost && !T.unpub && !T.resync) announce(false);
    T.onDoc(JSON.parse(JSON.stringify(d)));
  }
  // Annuncio del tavolo nella lista pubblica (messaggio "retained" per tavolo, aggiornato dall'host).
  // I tavoli "solo su invito" compaiono senza codice.
  function announce(force) {
    if (!T || !T.isHost || !T.doc || !T.doc.lobbyId || !T.up) return;
    if (T.doc.practice) return;   // partita di prova contro i bot: non compare nella lista
    if (T.doc.vis === 'direct') {   // tavolo privato: non compare da nessuna parte (e se c'era, sparisce)
      if (T.lobbySig !== 'direct' && T.c.publish(lobbyTopic(T.doc.lobbyId), '', true)) T.lobbySig = 'direct';
      return;
    }
    var d = T.doc, info = lobbyInfo ? lobbyInfo(d) : {}, vis = d.vis === 'invite' || d.vis === 'friends' ? d.vis : 'public';
    var acct = window.Account && Account.user();
    var host = d.seats.filter(function (s) { return s.uid === d.host; })[0];
    var e = { v: 1, id: d.lobbyId, vis: vis, code: vis === 'public' ? d.code : null, host: host ? host.nick : '', n: d.seats.length, max: info.max || null, phase: d.phase, note: info.note || '', t: Date.now(),
      c: d.created || null, g: String(document.title || '').slice(0, 30), u: acct ? acct.username : null };
    var sig = JSON.stringify([e.vis, e.code, e.host, e.n, e.phase, e.note]);
    if (!force && sig === T.lobbySig) return;
    if (T.c.publish(lobbyTopic(d.lobbyId), JSON.stringify(e), true)) { T.lobbySig = sig; T.lastAnn = Date.now(); }
  }
  // Controlla se un tavolo esiste ancora (senza entrarci). Risponde con lo stato o null; lancia un errore se nessun server è raggiungibile.
  async function peek(code) {
    var f = await find(code);
    if (f && f.offline) throw new Error('offline');
    if (f && f.doc && !(T && T.code === code)) f.c.unsubscribe(topic(code, 'state'));
    return f; // {doc} | {closed} | null
  }
  // Lista dal vivo dei tavoli di questo gioco. cb(lista) a ogni cambiamento; restituisce la funzione per smettere.
  // Ascolta tutti i server raggiungibili e unisce le liste (un tavolo può stare su un server diverso dal mio).
  /* Lista dei tavoli aperti. Oltre ai messaggi in arrivo, ogni pochi secondi (e appena l'app torna in primo piano)
     la lista si richiede al server: così si vedono i tavoli aperti mentre il telefono dormiva e spariscono quelli chiusi. */
  async function watchLobby(cb) {
    var base = PREFIX + 'lobby/', filt = base + '+', items = {}, stopped = false, att = [], reached = 0, failed = 0;
    function alive(e) { var now = Date.now(); return (e.rx && now - e.rx < LOBBY_TTL) || now - e.t < LOBBY_TTL; }
    function emit() {
      if (stopped) return;
      cb(Object.keys(items).map(function (k) { return items[k]; }).filter(function (e) { return alive(e) && (e.phase === 'lobby' || e.phase === 'play'); })
        .sort(function (a, b) { return (a.phase === 'lobby' ? 0 : 1) - (b.phase === 'lobby' ? 0 : 1) || b.t - a.t; }));
    }
    function attach(i, c) {
      if (att[i]) return;
      function h(t, p, retained) {
        if (t.indexOf(base) !== 0) return;
        var id = t.slice(base.length);
        if (!p) { delete items[id]; emit(); return; }
        var e = safeParse(p);
        if (!e || e.id !== id || typeof e.t !== 'number') return;
        if (retained && Date.now() - e.t > 3600e3) { c.publish(t, '', true); return; } // pulizia dei tavoli abbandonati da tempo
        e.host = String(e.host || '').slice(0, 18); e.note = String(e.note || '').slice(0, 40);
        if (retained && e.t > Date.now()) e.t = Date.now(); // orologio dell'host avanti: il tavolo non resta in lista più del dovuto
        var old = items[id];
        if (old && old.t > e.t) { old.seen = Date.now(); return; }
        e.rx = retained ? (old && old.rx) : Date.now(); // conferma arrivata adesso: vale anche se gli orologi dei telefoni non coincidono
        e.seen = Date.now();
        items[id] = e; emit();
      }
      c.onMessage(h); c.subscribe(filt); att[i] = { c: c, h: h };
    }
    await new Promise(function (resolve) {
      BROKERS.forEach(function (_, i) {
        client(i).then(function (c) { reached++; if (!stopped) attach(i, c); resolve(); }, function () { if (++failed === BROKERS.length) resolve(); });
      });
    });
    if (!reached) throw new Error('offline');
    // richiesta periodica: chi è collegato richiede la lista; chi non lo era ci riprova
    var sweepT = null;
    function refresh() {
      if (stopped) return;
      var t0 = Date.now(), all = true;
      BROKERS.forEach(function (_, i) {
        if (!att[i]) { all = false; client(i).then(function (c) { if (!stopped) { attach(i, c); emit(); } }, function () {}); return; }
        if (!att[i].c.resub(filt)) all = false;
      });
      emit();
      // tavoli che nessun server ha più rimandato: chiusi mentre non ascoltavamo
      clearTimeout(sweepT);
      if (all) sweepT = setTimeout(function () {
        if (stopped || !att.every(function (a) { return a && a.c.connected; }) || att.length < BROKERS.length) return;
        var gone = false; Object.keys(items).forEach(function (id) { if ((items[id].seen || 0) < t0) { delete items[id]; gone = true; } });
        if (gone) emit();
      }, LOBBY_SWEEP);
    }
    function onVis() { if (document.visibilityState === 'visible') setTimeout(refresh, 400); }
    document.addEventListener('visibilitychange', onVis); window.addEventListener('focus', onVis); window.addEventListener('online', onVis);
    var iv = setInterval(refresh, LOBBY_REFRESH);
    var stop = function () {
      stopped = true; clearInterval(iv); clearTimeout(sweepT);
      document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onVis); window.removeEventListener('online', onVis);
      att.forEach(function (a) { if (!a) return; a.c.handlers = a.c.handlers.filter(function (x) { return x !== a.h; }); a.c.unsubscribe(filt); });
    };
    stop.refresh = refresh;
    return stop;
  }
  // L'host applica sempre la modifica sul suo telefono; la pubblica solo se è collegato e sincronizzato.
  // Se non può (offline o appena ricollegato), la tiene da parte: endResync decide poi se pubblicarla o scartarla.
  function publishState() {
    // il titolare deve essere una persona seduta al tavolo: se se n'è andato, lo diventa chi regge il tavolo
    if (!T.doc.owner || !seatedHuman(T.doc, T.doc.owner)) T.doc.owner = T.doc.host;
    if (beforePublish) beforePublish(T.doc);
    T.doc.rev = (T.doc.rev || 0) + 1; T.doc.updated = Date.now();
    T.unpub = !(T.up && !T.resync && T.c.publish(topic(T.code, 'state'), JSON.stringify(T.doc), true));
    accept(T.doc);
  }
  function hostHandle(m) {
    var res = topic(T.code, 'res/' + m.from);
    if (T.answered[m.id]) { T.c.publish(res, JSON.stringify(T.answered[m.id]), false); return; }
    var out = applyLocal(m.from, m.op);
    var reply = { id: m.id, err: out.err || null, out: out.out || null };
    T.answered[m.id] = reply; T.answeredKeys.push(m.id);
    if (T.answeredKeys.length > 300) delete T.answered[T.answeredKeys.shift()];
    T.c.publish(res, JSON.stringify(reply), false);
  }
  // Applica un'operazione allo stato (solo sull'host). Il reducer modifica il documento e restituisce {err, out}.
  function applyLocal(from, op) {
    var work = JSON.parse(JSON.stringify(T.doc));
    var gate = op && op.t === 'join' && work.vis === 'direct' && work.host !== from && !seatedIn(work, from);
    if (gate && !mayEnter(work, from, op.k)) return { err: PRIVATE };
    var r = op && op.t === 'quit' ? quit(work, from, op) : op && op.t === 'vis' ? setVis(work, from, op) : op && op.t === 'addkey' ? addKey(work, from, op) : op && op.t === 'series' && window.Score ? Score.op(work, from, op) : (reducer(work, from, op) || {});
    if (r.err) return r;
    if (gate && seatedIn(work, from)) {   // l'invito ora è di chi l'ha usato per sedersi
      var hk = khash(String(op.k)); (work.keys || []).forEach(function (x) { if (x.h === hk) x.u = from; }); r.changed = true;
    }
    if (stampAcct(work, from, op)) r.changed = true;
    if (r.changed !== false) { T.doc = work; publishState(); }
    return r;
  }
  // Chi si siede con l'account lascia sul suo posto il nome utente: serve a mandargli la notifica «tocca a te»
  // quando ha l'app chiusa (vedi turns.js).
  function stampAcct(work, from, op) {
    if (!op || op.t !== 'join') return false;
    var s = work.seats.filter(function (x) { return x.uid === from; })[0]; if (!s) return false;
    var a = typeof op.acct === 'string' && /^[A-Za-z0-9_.-]{3,18}$/.test(op.acct) ? op.acct : null;
    if ((s.acct || null) === a) return false;
    if (a) s.acct = a; else delete s.acct;
    return true;
  }
  /* L'host non risponde (telefono in tasca, app sospesa mentre manda l'invito su WhatsApp…) e io voglio sedermi:
     lo faccio da solo, con le stesse regole che userebbe lui e senza togliergli il comando. Al suo ritorno trova
     il mio posto già occupato. Risponde come l'host ({err} / {out}), oppure null se qui non si può fare. */
  function selfSeat(me, op) {
    var work = JSON.parse(JSON.stringify(me.doc));
    var gate = work.vis === 'direct' && work.host !== uid && !seatedIn(work, uid);
    if (gate && !mayEnter(work, uid, op.k)) return { err: PRIVATE };
    var r; try { r = reducer(work, uid, op) || {}; } catch (e) { return null; }
    if (r.err) return r;
    if (r.changed === false && !stampAcct(work, uid, op)) return r;   // già seduto, o partita in corso (si guarda): niente da scrivere
    if (me.doc.phase !== 'lobby' || work.phase !== 'lobby') return r.changed === false ? r : null;   // a partita iniziata scrive solo l'host
    if (gate && seatedIn(work, uid)) { var hk = khash(String(op.k)); (work.keys || []).forEach(function (x) { if (x.h === hk) x.u = uid; }); }
    stampAcct(work, uid, op);
    if (beforePublish) beforePublish(work);
    work.rev = (work.rev || 0) + 1; work.updated = Date.now();
    if (!me.c.publish(topic(me.code, 'state'), JSON.stringify(work), true)) return null;
    accept(work);
    return r;
  }
  // Un giocatore lascia il tavolo per sempre (scelta dal pulsante «Esci», vedi exit.js). Vale per tutti i giochi.
  // In sala d'attesa libera il posto. In partita al suo posto gioca l'automatico, con una nuova identità «bot-»:
  // così nessuno, neanche lui rientrando, può riprendersi quel posto per errore.
  // Se era l'host, il comando passa al giocatore indicato (op.next) se è ancora seduto, altrimenti al primo collegato.
  function quit(work, from, op) {
    var seat = work.seats.filter(function (s) { return s.uid === from; })[0];
    if (!seat) return { changed: false };
    if (work.host === from) {
      var hs = work.seats.filter(function (s) { return !s.bot && s.uid !== from; }).map(function (s) { return s.uid; });
      var next = op.next && hs.indexOf(op.next) >= 0 ? op.next : (hs.filter(function (u) { return presence(u) === 'on'; })[0] || hs[0]);
      if (!next) return { err: 'Al tavolo restano solo giocatori automatici: chiudi il tavolo.' };
      work.host = next;
    }
    if (work.phase === 'lobby') { work.seats = work.seats.filter(function (s) { return s !== seat; }); return {}; }
    var bot = 'bot-' + rid().slice(0, 8), g = work.game;
    seat.uid = bot; seat.bot = true;
    if (g && Array.isArray(g.players)) g.players.forEach(function (P) {
      if (P.uid !== from) return;
      P.uid = bot; P.bot = true; P.away = false;
      if (Array.isArray(g.log) && typeof g.logN === 'number') {
        g.log.push({ n: ++g.logN, t: P.nick + ' ha lasciato la partita: al suo posto gioca l’automatico.', k: 'sys' });
        if (g.log.length > 70) g.log.splice(0, g.log.length - 70);
      }
    });
    return {};
  }
  function addKey(work, from, op) {
    if (work.host !== from) return { err: 'Solo chi ha aperto il tavolo può invitare.' };
    var h = String(op.h || ''); if (!/^[a-z0-9]{4,16}$/.test(h)) return { err: 'Invito non valido.' };
    work.keys = (work.keys || []).filter(function (x) { return x.h !== h; }).slice(-29); work.keys.push({ h: h, u: null, t: Date.now() });
    return {};
  }
  // Nuovo invito personale (solo l'host): restituisce il link da mandare a una persona.
  function newInvite() {
    if (!T || !T.doc) return Promise.reject('Non sei a un tavolo.');
    var k = ''; while (k.length < 14) k += Math.random().toString(36).slice(2);
    k = k.slice(0, 14);
    var code = T.code;
    return send({ t: 'addkey', h: khash(k) }).then(function () { return { key: k, link: location.origin + location.pathname + '?t=' + code + '&k=' + k }; });
  }
  function setVis(work, from, op) {
    if (work.host !== from) return { err: 'Solo l’host può farlo.' };
    if (work.practice) return { changed: false };
    var v = op.vis === 'invite' || op.vis === 'friends' || op.vis === 'direct' ? op.vis : 'public';
    if (v === 'friends' && !work.seats.some(function (s) { return s.uid === from; })) return { changed: false };
    work.vis = v; return {};
  }
  function send(op) {
    if (!T || !T.doc) return Promise.reject('Non sei collegato a nessun tavolo.');
    if (op && op.t === 'join') {
      var extra = {}, an = acctName();
      if (!op.k && keyFor(T.code)) extra.k = keyFor(T.code);
      if (an && !op.acct) extra.acct = an;
      op = Object.assign({}, op, extra);
    }
    if (T.isHost) { var r = applyLocal(uid, op); return r.err ? Promise.reject(r.err) : Promise.resolve(r.out || null); }
    var id = uid + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), me = T;
    var msg = JSON.stringify({ id: id, from: uid, op: op });
    if (!me.up) me.c.wake(); else if (Date.now() - me.c.lastRx > 8000) me.c.probe();
    return new Promise(function (res, rej) {
      var tries = 0;
      function stop() { clearInterval(pd.timer); delete me.pending[id]; }
      function fire() {
        if (T !== me) { stop(); rej('Hai lasciato il tavolo.'); return; }
        // nel frattempo il comando è passato a me: la mossa la applico io
        if (me.isHost && !me.resync) { stop(); var mine = applyLocal(uid, op); if (mine.err) rej(mine.err); else res(mine.out || null); return; }
        var mute = me.up && Date.now() - me.lastPing > PROXY_MS;
        // l'host è muto e voglio solo sedermi: lo faccio da me (vedi selfSeat)
        if (tries >= 2 && mute && op && op.t === 'join' && me.doc) {
          var own = selfSeat(me, op);
          if (own) { stop(); if (own.err) rej(own.err); else res(own.out || null); return; }
        }
        // host sparito: si insiste finché un altro giocatore non prende il comando (la stessa mossa arriva a lui, una volta sola)
        var max = me.up && me.doc && me.doc.phase !== 'lobby' && Date.now() - me.lastPing > HOST_TIMEOUT ? 4 + Math.ceil((AUTO_TAKEOVER + 2 * STAGGER) / 3000) : 4;
        if (tries++ >= max) {
          stop();
          rej(me.up ? 'L’host non risponde. Se è uscito, il comando passa a un altro giocatore tra poco.' : 'Sei offline: la mossa non è partita. Riprova quando torna la connessione.');
          return;
        }
        me.c.publish(topic(me.code, 'act'), msg, false);
      }
      var pd = { res: res, rej: rej, timer: setInterval(fire, 3000) };
      me.pending[id] = pd; fire();
    });
  }
  // Solo sull'host: modifica diretta (giocatori automatici, timer)
  function hostApply(fn) {
    if (!T || !T.isHost) return false;
    var work = JSON.parse(JSON.stringify(T.doc));
    if (!fn(work)) return false;
    T.doc = work; publishState(); return true;
  }
  // auto = subentro automatico perché l'host non risponde: il titolare resta lui e al ritorno riavrà il comando.
  // Senza auto è «Prendi il comando» premuto apposta: il tavolo diventa di chi lo prende.
  function takeHost(auto) {
    if (!T || !T.doc) return false;
    var work = JSON.parse(JSON.stringify(T.doc));
    if (!work.owner) work.owner = work.host;   // tavolo aperto con una versione precedente
    if (auto !== true) work.owner = uid;
    work.host = uid;
    T.doc = work; publishState(); return true;
  }
  /* Chiude il tavolo per tutti: lascia una "lapide" (stato chiuso) così nessuno può riaprirlo per errore
     ricollegandosi, e lo toglie dalla lista pubblica. Se in questo momento siamo offline il tavolo si chiude lo stesso
     per noi, e sul server appena torna la connessione (finché la pagina resta aperta): risponde 'later'. */
  var closes = [];
  function closeTable() {
    if (!T || !T.doc) return false;
    var me = T, d = me.doc;
    me.closed = true;
    if (tombstone(me.c, me.code, d)) return true;
    var job = { c: me.c, code: me.code, d: d, at: Date.now() };
    closes.push(job);
    if (!me.c.closeFn) { me.c.closeFn = function (up) { if (up) setTimeout(flushCloses, 1200); }; me.c.onStatus(me.c.closeFn); }
    me.c.wake();
    note('Sei offline: il tavolo ' + me.code + ' si chiude appena torna la connessione. Tieni aperta questa pagina.');
    setTimeout(function () { if (T === me) { me.doc = null; me.onDoc(null); } }, 0);
    return 'later';
  }
  function flushCloses() {
    closes = closes.filter(function (j) { return Date.now() - j.at < 30 * 60e3 && !tombstone(j.c, j.code, j.d); });
  }
  // Piccolo avviso in alto, per le poche cose che questa parte deve dire da sola.
  function note(text) {
    var d = document.createElement('div');
    d.setAttribute('role', 'status');
    d.setAttribute('style', 'position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:99990;max-width:calc(100vw - 24px);background:#2a2118;color:#f6ead2;border:1px solid rgba(242,193,78,.5);border-radius:12px;padding:10px 14px;font:15px/1.4 system-ui,sans-serif;box-shadow:0 10px 26px rgba(0,0,0,.45)');
    d.textContent = text; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 5200);
  }
  function clearTable() { return closeTable(); }

  /* --- Chat del tavolo: i messaggi passano direttamente tra i giocatori (arrivano anche se l'host è assente);
     l'host conserva gli ultimi messaggi come cronologia per chi entra dopo. --- */
  var chatCb = null, reactCb = null;
  function sendReact(e, nick) {
    if (!T || !T.up) return false;
    return T.c.publish(topic(T.code, 'react'), JSON.stringify({ uid: uid, nick: String(nick || '').slice(0, 18), e: String(e).slice(0, 8), ts: Date.now() }), false);
  }
  function addChat(me, m, fromLog) {
    if (!m || typeof m.id !== 'string' || typeof m.text !== 'string' || me.chatIds[m.id]) return false;
    var clean = { id: m.id.slice(0, 40), uid: String(m.uid || '').slice(0, 40), nick: String(m.nick || '').trim().slice(0, 18) || 'Giocatore', text: m.text.trim().slice(0, 240), ts: +m.ts || Date.now() };
    if (!clean.text) return false;
    me.chatIds[clean.id] = 1; me.chat.push(clean);
    me.chat.sort(function (a, b) { return a.ts - b.ts; });
    if (me.chat.length > 80) me.chat.splice(0, me.chat.length - 80);
    if (chatCb && T === me) chatCb(clean, fromLog);
    return true;
  }
  function saveChatLog(me) {
    clearTimeout(me.chatTimer);
    me.chatTimer = setTimeout(function () { if (T === me && me.isHost) me.c.publish(topic(me.code, 'chatlog'), JSON.stringify(me.chat.slice(-50)), true); }, 600);
  }
  function sendChat(text, nick) {
    if (!T) return false;
    text = String(text || '').trim().slice(0, 240); if (!text) return false;
    var m = { id: uid + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), uid: uid, nick: nick, text: text, ts: Date.now() };
    if (!T.c.publish(topic(T.code, 'chat'), JSON.stringify(m), false)) return false;
    if (addChat(T, m, false) && T.isHost) saveChatLog(T);
    return true;
  }
  function close(opts) {
    if (!T) return;
    var me = T;
    // L'host esce durante la partita: passa subito il comando a un giocatore collegato invece di farlo aspettare.
    if (!(opts && opts.quiet) && me.isHost && me.up && !me.resync && !me.closed && me.doc && me.doc.phase !== 'lobby') {
      var next = me.doc.seats.filter(function (s) { return !s.bot && s.uid !== uid && presence(s.uid) === 'on'; })[0];
      if (next) {
        var w = JSON.parse(JSON.stringify(me.doc)); w.host = next.uid;
        if (beforePublish) beforePublish(w);
        w.rev = (w.rev || 0) + 1; w.updated = Date.now();
        me.c.publish(topic(me.code, 'state'), JSON.stringify(w), true);
      }
    }
    // Partita finita e al tavolo non c'è più nessun altro: uscendo per ultimo lo chiudo, così non resta in giro
    // (né nei «tavoli recenti» degli altri, né in «Continua la partita»).
    if (!(opts && opts.quiet) && me.up && !me.resync && !me.closed && me.doc && me.doc.phase === 'over' && seatedHuman(me.doc, uid) &&
        me.doc.seats.every(function (s) { return s.bot || s.uid === uid || presence(s.uid) === 'off'; })) { tombstone(me.c, me.code, me.doc); me.closed = true; }
    T = null; clearTimeout(me.resyncTimer);
    Beat.boost(false);
    me.stops.forEach(function (f) { f(); });
    Object.keys(me.pending).forEach(function (k) { clearInterval(me.pending[k].timer); });
    ['state', 'act', 'ping', 'res/' + uid, 'chat', 'chatlog', 'hb', 'vis', 'react'].forEach(function (t) { me.c.unsubscribe(topic(me.code, t)); });
    me.c.handlers = me.c.handlers.filter(function (h) { return h !== me.handler; });
    me.c.statusHandlers = me.c.statusHandlers.filter(function (h) { return h !== me.statusFn; });
  }
  return {
    create: create, open: open, send: send, newInvite: newInvite, keyFor: keyFor, close: close, hostApply: hostApply, takeHost: takeHost, clearTable: clearTable, closeTable: closeTable, watchLobby: watchLobby, peek: peek,
    setLobbyInfo: function (f) { lobbyInfo = f; },
    sendChat: sendChat, onChat: function (f) { chatCb = f; }, sendReact: sendReact, onReact: function (f) { reactCb = f; }, peekAt: peekAt, get prefix() { return PREFIX; }, chatList: function () { return T ? T.chat.slice() : []; }, get tableCode() { return T ? T.code : null; },
    setReducer: function (f) { reducer = f; },
    setBeforePublish: function (f) { beforePublish = f; },
    setOnTakeover: function (f) { onTakeover = f; },
    get uid() { return uid; },
    get isHost() { return !!(T && T.isHost); },
    get isOwner() { return !!(T && T.doc && (T.doc.owner || T.doc.host) === uid); },
    get connected() { return !!(T && T.up); },
    hostAlive: function () { return !T || T.isHost || Date.now() - T.lastPing < HOST_TIMEOUT; },
    presence: presence, offlineFor: offlineFor, dot: dot, offTag: offTag, presenceSig: presenceSig,
    _client: function (i) { return client(i); }, get brokers() { return BROKERS.length; },
    _debug: function () { return { clients: clients, T: T }; }
  };
})();
