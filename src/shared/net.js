/* ===== Rete senza account: MQTT su WebSocket verso broker pubblici gratuiti =====
   (Le pagine dei giochi si rigenerano da sole su GitHub a ogni modifica in src/: azione «Ricostruisci i giochi».)
   Modello: il dispositivo "host" del tavolo tiene la verità. Pubblica lo stato completo
   come messaggio "retained" (chi arriva lo riceve subito); gli altri inviano solo azioni.
   Robustezza: controllo continuo che il server risponda, riconnessione immediata quando
   la pagina torna in primo piano, subentro automatico se l'host sparisce. */

var NETQ = new URLSearchParams(location.search);
var NET_PING_MS = +(NETQ.get('ping') || 10000);     // ogni quanto si interroga il server
var NET_DEAD_MS = +(NETQ.get('dead') || 15000);     // silenzio oltre il quale si verifica la connessione
var NET_PROBE_MS = 5000;                            // attesa della risposta alla verifica

/* ---------- client MQTT 3.1.1 minimo ---------- */
function MQ(url) {
  this.url = url; this.subs = {}; this.handlers = []; this.statusHandlers = [];
  this.connected = false; this.closed = false; this.pid = 1; this.buf = new Uint8Array(0);
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
    var body = MQ.str('MQTT').concat([4, 0x02, 0, 45]).concat(MQ.str(self.id));
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
  this.connected = false; clearInterval(this.pinger); clearTimeout(this.openTimer); clearTimeout(this.probeTimer); this.probeTimer = null;
  if (was) this.statusHandlers.forEach(function (f) { f(false); });
  if (this.closed) return;
  if (!this.everUp) { this._rej(new Error('broker non raggiungibile')); this.closed = true; return; }
  if (this.retryTimer) return;
  this.retryTimer = setTimeout(function () { self.retryTimer = null; if (!self.closed && !self.ws) self._open(); }, this.backoff);
  this.backoff = Math.min(this.backoff * 1.7, 8000);
};
// Verifica attiva: manda un ping e, se entro pochi secondi non arriva nulla, considera la connessione morta.
MQ.prototype.probe = function () {
  var self = this;
  if (!this.connected || this.probeTimer) return;
  var since = Date.now();
  this._raw(MQ.packet(0xC0, []));
  this.probeTimer = setTimeout(function () { self.probeTimer = null; if (self.connected && self.lastRx < since) self._drop(); }, NET_PROBE_MS);
};
// Da chiamare quando la pagina torna visibile o la rete torna disponibile.
MQ.prototype.wake = function () {
  if (this.closed) return;
  if (this.connected) { this.probe(); return; }
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
    this.pinger = setInterval(function () {
      if (Date.now() - self.lastRx > NET_DEAD_MS) self.probe();
      else self._raw(MQ.packet(0xC0, []));
    }, NET_PING_MS);
    var topics = Object.keys(this.subs); if (topics.length) this._sub(topics);
    this._res(this);
    this.statusHandlers.forEach(function (f) { f(true); });
  } else if (type === 3) { // PUBLISH
    var qos = (h >> 1) & 3, tl = (body[0] << 8) | body[1], topic = MQ.dec.decode(body.subarray(2, 2 + tl)), p = 2 + tl;
    if (qos > 0) { var id = [body[p], body[p + 1]]; p += 2; if (qos === 1) this._raw(MQ.packet(0x40, id)); }
    var payload = MQ.dec.decode(body.subarray(p)), retained = !!(h & 1);
    this.handlers.forEach(function (f) { f(topic, payload, retained); });
  }
};
MQ.prototype._raw = function (pkt) { if (this.ws && this.ws.readyState === 1) { try { this.ws.send(pkt); return true; } catch (e) {} } return false; };
MQ.prototype._nextId = function () { this.pid = this.pid % 65000 + 1; return [this.pid >> 8, this.pid & 255]; };
MQ.prototype._sub = function (topics) {
  var body = this._nextId();
  topics.forEach(function (t) { body = body.concat(MQ.str(t), [0]); });
  this._raw(MQ.packet(0x82, body));
};
MQ.prototype.subscribe = function (topic) { this.subs[topic] = true; if (this.connected) this._sub([topic]); };
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
  var HOST_TIMEOUT = +(qs.get('hostTimeout') || 20000);          // dopo quanto mostrare l'avviso
  var AUTO_TAKEOVER = +(qs.get('autoTakeover') || HOST_TIMEOUT * 1.5); // dopo quanto subentrare da soli
  var STAGGER = +(qs.get('stagger') || 6000);                     // attesa extra per ogni giocatore prima di me
  var PREFIX = window.GAME_PREFIX || 'polvere-piombo/v1/';
  var uid = null; try { uid = localStorage.getItem('pp-uid'); } catch (e) {}
  if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6); try { localStorage.setItem('pp-uid', uid); } catch (e) {} }
  var clients = {}, reducer = null, beforePublish = null, onTakeover = null, lobbyInfo = null;
  var LOBBY_BEAT = +(qs.get('lobbyBeat') || 20000);   // ogni quanto l'host conferma che il tavolo è vivo
  var LOBBY_TTL = +(qs.get('lobbyTtl') || 150000);    // oltre questo silenzio il tavolo sparisce dalla lista
  var FIND_MS = +(qs.get('findMs') || 4500);          // attesa massima della risposta quando si cerca un tavolo
  var PRES_MS = +(qs.get('presMs') || 35000);       // oltre questo silenzio un giocatore risulta offline
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
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') wakeAll(); });
  window.addEventListener('online', wakeAll);
  window.addEventListener('pageshow', function (e) { if (e.persisted) wakeAll(); });
  window.addEventListener('focus', wakeAll);

  function probeState(c, code, ms) {
    return new Promise(function (res) {
      var st = topic(code, 'state'), done = false;
      function fin(v) { if (done) return; done = true; c.handlers = c.handlers.filter(function (x) { return x !== h; }); res(v); }
      function h(t, p) { if (t === st) fin(p ? safeParse(p) : null); }
      c.onMessage(h);
      c.subscribe(st);
      setTimeout(function () { fin(null); }, ms);
    });
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
            if (doc && doc.code === code && !doc.closed) { finish({ i: i, c: c, doc: doc }); return; }
            if (!(T && T.code === code)) c.unsubscribe(topic(code, 'state'));
            if (doc && doc.closed) closed = true;
          });
        }).catch(function () {}).then(function () { if (--pending === 0) finish(!reached ? { offline: true } : closed ? { closed: true } : null); });
      });
    });
  }

  // «Solo amici» serve l'account (gli amici sono quelli del server): senza, il tavolo resta aperto a tutti.
  function visOf(v) { return v === 'invite' ? 'invite' : v === 'friends' && window.Account && Account.user() ? 'friends' : 'public'; }
  function peekAt(prefix, code, ms) {
    return new Promise(function (resolve) {
      var st = prefix + code + '/state', pending = BROKERS.length, done = false, closed = false;
      function fin(v) { if (!done) { done = true; resolve(v); } }
      BROKERS.forEach(function (_, i) {
        client(i).then(function (c) {
          return new Promise(function (res) {
            var t0 = setTimeout(function () { c.handlers = c.handlers.filter(function (x) { return x !== h; }); c.unsubscribe(st); res(); }, ms || 4000);
            function h(t, p) { if (t !== st) return; var d = p ? safeParse(p) : null; if (d && d.closed) closed = true; else if (d && d.code === code) { clearTimeout(t0); c.handlers = c.handlers.filter(function (x) { return x !== h; }); c.unsubscribe(st); fin({ doc: d }); } }
            c.onMessage(h); c.subscribe(st);
          });
        }).catch(function () {}).then(function () { if (--pending === 0) fin(closed ? { closed: true } : null); });
      });
    });
  }
  function newCode() { var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ', s = ''; for (var i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }

  async function create(nick, opts) {
    var b = await firstBroker();
    for (var k = 0; k < 6; k++) {
      var code = newCode();
      var ex = await probeState(b.c, code, 1200);
      b.c.unsubscribe(topic(code, 'state'));
      if (ex && ex.code && !ex.closed) continue;
      var doc = { code: code, host: uid, phase: 'lobby', seats: [{ uid: uid, nick: nick }], game: null, created: Date.now(), rev: ((ex && ex.rev) || 0) + 1, updated: Date.now(),
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
    var c = f.c;
    T = { code: code, c: c, doc: null, isHost: false, onDoc: onDoc, onStatus: onStatus, pending: {}, answered: {}, answeredKeys: [], lastPing: Date.now(), up: c.connected, timers: [], graceUntil: 0, chat: [], chatIds: {},
      seen: {}, upSince: Date.now(), lastHb: 0, resync: false, unpub: false, hostRev: 0 };
    var me = T;
    var tState = topic(code, 'state'), tAct = topic(code, 'act'), tRes = topic(code, 'res/' + uid), tPing = topic(code, 'ping'), tChat = topic(code, 'chat'), tLog = topic(code, 'chatlog'), tHb = topic(code, 'hb'), tReact = topic(code, 'react');
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
      } else if (t === tPing) { me.lastPing = Date.now(); if (me.doc) me.seen[me.doc.host] = Date.now(); }
      else if (t === tHb) { var hu = String(p || '').slice(0, 40); if (hu) me.seen[hu] = Date.now(); }
      else if (t === tRes) {
        var r = safeParse(p); if (!r || !me.pending[r.id]) return;
        var pd = me.pending[r.id]; delete me.pending[r.id]; clearInterval(pd.timer);
        if (r.err) pd.rej(r.err); else pd.res(r.out || null);
      } else if (t === tChat) {
        var cm = safeParse(p); if (cm && cm.uid) me.seen[String(cm.uid).slice(0, 40)] = Date.now();
        if (addChat(me, cm, false) && me.isHost) saveChatLog(me);
      } else if (t === tReact) {
        var rm = safeParse(p); if (rm && rm.uid && reactCb) { me.seen[String(rm.uid).slice(0, 40)] = Date.now(); reactCb(rm); }
      } else if (t === tLog) {
        var arr = p ? safeParse(p) : null;
        if (Array.isArray(arr)) arr.forEach(function (m) { addChat(me, m, true); });
      } else if (t === tAct && me.isHost && !me.resync) {
        var m = safeParse(p); if (!m || !m.id || !m.from) return;
        me.seen[String(m.from).slice(0, 40)] = Date.now();
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
    c.subscribe(tRes); c.subscribe(tPing); c.subscribe(tState); c.subscribe(tLog); c.subscribe(tChat); c.subscribe(tHb); c.subscribe(tReact);
    accept(f.doc);
    heartbeat(me, true);
    if (bc) { try { bc.postMessage({ k: 'open', key: PREFIX + code, tab: TAB }); } catch (e) {} }
    me.timers.push(setInterval(function () {
      if (T !== me) return;
      heartbeat(me, false);
      if (me.isHost) { c.publish(tPing, String(Date.now()), false); if (Date.now() - (me.lastAnn || 0) > LOBBY_BEAT) announce(true); }
      else maybeTakeOver(me);
      if (onStatus) onStatus();
    }, Math.min(5000, Math.max(1000, HOST_TIMEOUT / 4))));
    return true;
  }
  // Fine della risincronizzazione dopo una disconnessione. d = stato trovato sul server (o null se non è arrivato).
  function endResync(me, d) {
    if (!me.resync) return;
    me.resync = false; clearTimeout(me.resyncTimer);
    // Ero l'host ma sul server c'è uno stato pubblicato da un altro dopo che avevo preso il comando:
    // mentre ero via qualcuno è subentrato. Vale il suo stato; le mie modifiche fatte offline si scartano.
    if (d && me.isHost && d.host !== uid && (d.rev || 0) >= (me.hostRev || 0)) { me.unpub = false; me.lastPing = Date.now(); accept(d); return; }
    if (d && (!me.doc || (d.rev || 0) > (me.doc.rev || 0))) { me.lastPing = Date.now(); accept(d); return; }
    // Sono l'host e il server ha uno stato più vecchio del mio (o niente): pubblico il mio.
    if (me.isHost && me.doc && (me.unpub || !d || (d.rev || 0) < (me.doc.rev || 0))) flush(me);
  }
  function flush(me) {
    me.doc.updated = Date.now();
    me.unpub = !(me.up && me.c.publish(topic(me.code, 'state'), JSON.stringify(me.doc), true));
    if (!me.unpub) announce(true);
  }
  // Segnale di presenza: ogni giocatore lo manda ogni 10 secondi finché ha la pagina aperta e collegata.
  function heartbeat(me, now) {
    if (!me.up || (!now && Date.now() - me.lastHb < 10000)) return;
    if (me.c.publish(topic(me.code, 'hb'), uid, false)) me.lastHb = Date.now();
  }
  // 'on' = collegato adesso, 'off' = non si sente da un po', null = non si sa ancora (appena entrati o offline noi).
  function presence(u) {
    if (!T || !u || /^bot-/.test(u)) return null;
    if (u === uid) return T.up ? 'on' : 'off';
    var s = T.seen[u], now = Date.now();
    if (s && now - s < PRES_MS) return 'on';
    if (!T.up || T.resync || now - T.upSince < PRES_MS) return null;
    return 'off';
  }
  function offlineFor(u) { if (!T) return 0; return presence(u) === 'off' ? Date.now() - Math.max(T.seen[u] || 0, T.upSince) + PRES_MS : 0; }
  var presCss = false;
  function dot(u) {
    var st = presence(u); if (!st) return '';
    if (!presCss) {
      presCss = true; var el = document.createElement('style');
      el.textContent = '.pres{display:inline-block;width:9px;height:9px;border-radius:50%;margin:0 6px 1px 0;vertical-align:middle;flex:none}.pres-on{background:#3fd27a;box-shadow:0 0 0 2px rgba(63,210,122,.25)}.pres-off{background:#9aa0a8;box-shadow:0 0 0 2px rgba(154,160,168,.2)}.pres-t{font-size:.78em;opacity:.75;margin-left:6px;font-weight:400;white-space:nowrap}';
      document.head.appendChild(el);
    }
    return '<i class="pres pres-' + st + '" title="' + (st === 'on' ? 'Collegato' : 'Offline') + '" aria-hidden="true"></i>';
  }
  function offTag(u) { return presence(u) === 'off' ? '<span class="pres-t">offline</span>' : ''; }
  function presenceSig() { if (!T || !T.doc) return ''; return T.doc.seats.map(function (s) { return s.bot ? '' : presence(s.uid) || '-'; }).join(''); }
  // Subentro automatico: solo un giocatore seduto, collegato e con la pagina aperta.
  // Per evitare due subentri insieme, ognuno aspetta in più in base al suo posto.
  function maybeTakeOver(me) {
    if (!me.doc || me.closed || !me.up || me.resync || document.visibilityState === 'hidden' || Date.now() < me.graceUntil) return;
    var humans = me.doc.seats.filter(function (s) { return !s.bot && s.uid !== me.doc.host; }).map(function (s) { return s.uid; });
    var rank = humans.indexOf(uid);
    if (rank < 0) return;
    if (Date.now() - me.lastPing < AUTO_TAKEOVER + rank * STAGGER) return;
    takeHost();
    if (onTakeover) onTakeover();
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
  async function watchLobby(cb) {
    var base = PREFIX + 'lobby/', filt = base + '+', items = {}, stopped = false, attached = [], reached = 0, failed = 0;
    function alive(e) { var now = Date.now(); return (e.rx && now - e.rx < LOBBY_TTL) || now - e.t < LOBBY_TTL; }
    function emit() {
      if (stopped) return;
      cb(Object.keys(items).map(function (k) { return items[k]; }).filter(function (e) { return alive(e) && (e.phase === 'lobby' || e.phase === 'play'); })
        .sort(function (a, b) { return (a.phase === 'lobby' ? 0 : 1) - (b.phase === 'lobby' ? 0 : 1) || b.t - a.t; }));
    }
    function attach(c) {
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
        if (old && old.t > e.t) return;
        e.rx = retained ? (old && old.rx) : Date.now(); // conferma arrivata adesso: vale anche se gli orologi dei telefoni non coincidono
        items[id] = e; emit();
      }
      c.onMessage(h); c.subscribe(filt); attached.push({ c: c, h: h });
    }
    await new Promise(function (resolve) {
      BROKERS.forEach(function (_, i) {
        client(i).then(function (c) { reached++; if (!stopped) attach(c); resolve(); }, function () { if (++failed === BROKERS.length) resolve(); });
      });
    });
    if (!reached) throw new Error('offline');
    var iv = setInterval(emit, 10000);
    return function () { stopped = true; clearInterval(iv); attached.forEach(function (a) { a.c.handlers = a.c.handlers.filter(function (x) { return x !== a.h; }); a.c.unsubscribe(filt); }); };
  }
  // L'host applica sempre la modifica sul suo telefono; la pubblica solo se è collegato e sincronizzato.
  // Se non può (offline o appena ricollegato), la tiene da parte: endResync decide poi se pubblicarla o scartarla.
  function publishState() {
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
    var r = op && op.t === 'quit' ? quit(work, from, op) : op && op.t === 'vis' ? setVis(work, from, op) : op && op.t === 'series' && window.Score ? Score.op(work, from, op) : (reducer(work, from, op) || {});
    if (r.err) return r;
    if (r.changed !== false) { T.doc = work; publishState(); }
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
  function setVis(work, from, op) {
    if (work.host !== from) return { err: 'Solo l’host può farlo.' };
    if (work.practice) return { changed: false };
    var v = op.vis === 'invite' || op.vis === 'friends' ? op.vis : 'public';
    if (v === 'friends' && !work.seats.some(function (s) { return s.uid === from; })) return { changed: false };
    work.vis = v; return {};
  }
  function send(op) {
    if (!T || !T.doc) return Promise.reject('Non sei collegato a nessun tavolo.');
    if (T.isHost) { var r = applyLocal(uid, op); return r.err ? Promise.reject(r.err) : Promise.resolve(r.out || null); }
    var id = uid + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), me = T;
    var msg = JSON.stringify({ id: id, from: uid, op: op });
    if (!me.up) me.c.wake(); else if (Date.now() - me.c.lastRx > 8000) me.c.probe();
    return new Promise(function (res, rej) {
      var tries = 0;
      function fire() {
        if (T !== me) { clearInterval(pd.timer); delete me.pending[id]; rej('Hai lasciato il tavolo.'); return; }
        if (tries++ >= 4) {
          clearInterval(pd.timer); delete me.pending[id];
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
  function takeHost() {
    if (!T || !T.doc) return false;
    var work = JSON.parse(JSON.stringify(T.doc)); work.host = uid;
    T.doc = work; publishState(); return true;
  }
  // Chiude il tavolo per tutti: lascia una "lapide" (stato chiuso) così nessuno può riaprirlo per errore
  // ricollegandosi, e lo toglie dalla lista pubblica.
  function closeTable() {
    if (!T || !T.doc) return false;
    var d = T.doc, tomb = { code: d.code, closed: true, rev: (d.rev || 0) + 1, updated: Date.now() };
    var ok = T.c.publish(topic(T.code, 'state'), JSON.stringify(tomb), true);
    if (d.lobbyId) T.c.publish(lobbyTopic(d.lobbyId), '', true);
    T.c.publish(topic(T.code, 'chatlog'), '', true);
    T.closed = true;
    return ok;
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
    T = null; clearTimeout(me.resyncTimer);
    me.timers.forEach(clearInterval);
    Object.keys(me.pending).forEach(function (k) { clearInterval(me.pending[k].timer); });
    ['state', 'act', 'ping', 'res/' + uid, 'chat', 'chatlog', 'hb', 'react'].forEach(function (t) { me.c.unsubscribe(topic(me.code, t)); });
    me.c.handlers = me.c.handlers.filter(function (h) { return h !== me.handler; });
    me.c.statusHandlers = me.c.statusHandlers.filter(function (h) { return h !== me.statusFn; });
  }
  return {
    create: create, open: open, send: send, close: close, hostApply: hostApply, takeHost: takeHost, clearTable: clearTable, closeTable: closeTable, watchLobby: watchLobby, peek: peek,
    setLobbyInfo: function (f) { lobbyInfo = f; },
    sendChat: sendChat, onChat: function (f) { chatCb = f; }, sendReact: sendReact, onReact: function (f) { reactCb = f; }, peekAt: peekAt, get prefix() { return PREFIX; }, chatList: function () { return T ? T.chat.slice() : []; }, get tableCode() { return T ? T.code : null; },
    setReducer: function (f) { reducer = f; },
    setBeforePublish: function (f) { beforePublish = f; },
    setOnTakeover: function (f) { onTakeover = f; },
    get uid() { return uid; },
    get isHost() { return !!(T && T.isHost); },
    get connected() { return !!(T && T.up); },
    hostAlive: function () { return !T || T.isHost || Date.now() - T.lastPing < HOST_TIMEOUT; },
    presence: presence, offlineFor: offlineFor, dot: dot, offTag: offTag, presenceSig: presenceSig,
    _client: function (i) { return client(i); }, get brokers() { return BROKERS.length; },
    _debug: function () { return { clients: clients, T: T }; }
  };
})();
