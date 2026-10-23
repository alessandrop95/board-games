/* ===== Rete senza account: MQTT su WebSocket verso broker pubblici gratuiti =====
   Modello: il dispositivo "host" del tavolo tiene la verità. Pubblica lo stato completo
   come messaggio "retained" (chi arriva lo riceve subito); gli altri inviano solo azioni. */

/* ---------- client MQTT 3.1.1 minimo ---------- */
function MQ(url) {
  this.url = url; this.subs = {}; this.handlers = []; this.statusHandlers = [];
  this.connected = false; this.closed = false; this.queue = []; this.pid = 1; this.buf = new Uint8Array(0);
  this.backoff = 800; this.id = 'pp' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-6);
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
  try { ws = new WebSocket(this.url, ['mqtt']); } catch (e) { this._down(); return; }
  ws.binaryType = 'arraybuffer'; this.ws = ws; this.buf = new Uint8Array(0);
  var t = setTimeout(function () { if (!self.connected) { try { ws.close(); } catch (e) {} } }, 7000);
  ws.onopen = function () {
    var body = MQ.str('MQTT').concat([4, 0x02, 0, 45]).concat(MQ.str(self.id));
    ws.send(MQ.packet(0x10, body));
  };
  ws.onmessage = function (ev) {
    var chunk = new Uint8Array(ev.data), b = new Uint8Array(self.buf.length + chunk.length);
    b.set(self.buf); b.set(chunk, self.buf.length); self.buf = b; self._parse();
  };
  ws.onclose = function () { clearTimeout(t); if (self.ws === ws) self._down(); };
  ws.onerror = function () {};
};
MQ.prototype._down = function () {
  var self = this, was = this.connected;
  this.connected = false; clearInterval(this.pinger);
  if (was) this.statusHandlers.forEach(function (f) { f(false); });
  if (this.closed) return;
  if (!this.everUp) { this._rej(new Error('broker non raggiungibile')); this.closed = true; return; }
  setTimeout(function () { if (!self.closed) self._open(); }, this.backoff);
  this.backoff = Math.min(this.backoff * 1.7, 8000);
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
    if (body[1] !== 0) { try { this.ws.close(); } catch (e) {} return; }
    this.connected = true; this.everUp = true; this.backoff = 800;
    this.pinger = setInterval(function () { self._raw(MQ.packet(0xC0, [])); }, 25000);
    var topics = Object.keys(this.subs); if (topics.length) this._sub(topics);
    var q = this.queue; this.queue = []; q.forEach(function (p) { self._raw(p); });
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
MQ.prototype.publish = function (topic, payload, retain) {
  var body = MQ.str(topic).concat(Array.from(MQ.enc.encode(payload)));
  var pkt = MQ.packet(0x30 | (retain ? 1 : 0), body);
  if (this.connected && this._raw(pkt)) return;
  this.queue.push(pkt); if (this.queue.length > 40) this.queue.shift();
};
MQ.prototype.onMessage = function (f) { this.handlers.push(f); };
MQ.prototype.onStatus = function (f) { this.statusHandlers.push(f); };

/* ---------- tavolo condiviso ---------- */
var Net = (function () {
  var qs = new URLSearchParams(location.search);
  var BROKERS = qs.get('broker') ? [qs.get('broker')] : [
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://broker.emqx.io:8084/mqtt',
    'wss://test.mosquitto.org:8081/mqtt'
  ];
  var HOST_TIMEOUT = +(qs.get('hostTimeout') || 20000);
  var PREFIX = window.GAME_PREFIX || 'polvere-piombo/v1/';
  var uid = lsGet('pp-uid');
  if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6); lsSet('pp-uid', uid); }
  var clients = {}, reducer = null;
  var T = null; // sessione del tavolo aperto

  function client(i) {
    if (!clients[i]) {
      clients[i] = new MQ(BROKERS[i]);
      clients[i].ready.catch(function () { delete clients[i]; });
    }
    return clients[i].ready;
  }
  function topic(code, t) { return PREFIX + code + '/' + t; }

  // Cerca lo stato "retained" di un tavolo su un broker: risponde con il documento o null.
  function probe(c, code, ms) {
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
  async function find(code) {
    var reached = false;
    for (var i = 0; i < BROKERS.length; i++) {
      var c; try { c = await client(i); reached = true; } catch (e) { continue; }
      var doc = await probe(c, code, 2600);
      if (doc && doc.code === code) return { i: i, c: c, doc: doc };
      c.unsubscribe(topic(code, 'state'));
    }
    if (!reached) throw 'Nessun server di gioco raggiungibile. Controlla la connessione e riprova.';
    return null;
  }

  function newCode() { var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ', s = ''; for (var i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }

  async function create(nick) {
    var b = await firstBroker();
    for (var k = 0; k < 6; k++) {
      var code = newCode();
      var ex = await probe(b.c, code, 1200);
      b.c.unsubscribe(topic(code, 'state'));
      if (ex && ex.code) continue;
      var doc = { code: code, host: uid, phase: 'lobby', seats: [{ uid: uid, nick: nick }], game: null, created: Date.now(), rev: 1, updated: Date.now() };
      b.c.publish(topic(code, 'state'), JSON.stringify(doc), true);
      return code;
    }
    throw 'Non sono riuscito a creare il tavolo. Riprova.';
  }

  // Apre un tavolo: chiama onDoc(doc) a ogni nuovo stato, onStatus() quando cambia la connessione.
  async function open(code, onDoc, onStatus) {
    close();
    var f = await find(code);
    if (!f) return false;
    var c = f.c;
    T = { code: code, c: c, doc: null, isHost: false, onDoc: onDoc, onStatus: onStatus, pending: {}, answered: {}, answeredKeys: [], lastPing: Date.now(), up: true, timers: [] };
    var me = T;
    var tState = topic(code, 'state'), tAct = topic(code, 'act'), tRes = topic(code, 'res/' + uid), tPing = topic(code, 'ping');
    me.handler = function (t, p) {
      if (T !== me) return;
      if (t === tState) {
        if (!p) { me.doc = null; onDoc(null); return; }
        var d = safeParse(p); if (!d) return;
        if (me.doc && (d.rev || 0) <= (me.doc.rev || 0)) return;
        accept(d);
      } else if (t === tPing) { me.lastPing = Date.now(); }
      else if (t === tRes) {
        var r = safeParse(p); if (!r || !me.pending[r.id]) return;
        var pd = me.pending[r.id]; delete me.pending[r.id]; clearInterval(pd.timer);
        if (r.err) pd.rej(r.err); else pd.res(r.out || null);
      } else if (t === tAct && me.isHost) {
        var m = safeParse(p); if (!m || !m.id || !m.from) return;
        hostHandle(m);
      }
    };
    c.onMessage(me.handler);
    me.statusFn = function (up) { if (T === me) { me.up = up; if (up) me.lastPing = Date.now(); if (onStatus) onStatus(); } };
    c.onStatus(me.statusFn);
    c.subscribe(tRes); c.subscribe(tPing); c.subscribe(tState);
    accept(f.doc);
    me.timers.push(setInterval(function () {
      if (T !== me) return;
      if (me.isHost) c.publish(tPing, String(Date.now()), false);
      if (onStatus) onStatus();
    }, 5000));
    return true;
  }
  function accept(d) {
    T.doc = d;
    var shouldHost = d.host === uid;
    if (shouldHost && !T.isHost) { T.isHost = true; T.c.subscribe(topic(T.code, 'act')); T.c.publish(topic(T.code, 'ping'), String(Date.now()), false); }
    if (!shouldHost && T.isHost) { T.isHost = false; T.c.unsubscribe(topic(T.code, 'act')); }
    T.onDoc(JSON.parse(JSON.stringify(d)));
  }
  function publishState() {
    T.doc.rev = (T.doc.rev || 0) + 1; T.doc.updated = Date.now();
    T.c.publish(topic(T.code, 'state'), JSON.stringify(T.doc), true);
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
    var r = reducer(work, from, op) || {};
    if (r.err) return r;
    if (r.changed !== false) { T.doc = work; publishState(); }
    return r;
  }
  function send(op) {
    if (!T || !T.doc) return Promise.reject('Non sei collegato a nessun tavolo.');
    if (T.isHost) { var r = applyLocal(uid, op); return r.err ? Promise.reject(r.err) : Promise.resolve(r.out || null); }
    var id = uid + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), me = T;
    var msg = JSON.stringify({ id: id, from: uid, op: op });
    return new Promise(function (res, rej) {
      var tries = 0;
      function fire() {
        if (T !== me) { clearInterval(pd.timer); delete me.pending[id]; rej('Hai lasciato il tavolo.'); return; }
        if (tries++ >= 4) { clearInterval(pd.timer); delete me.pending[id]; rej('L’host non risponde. Se è uscito, prendi tu il comando dal menu.'); return; }
        me.c.publish(topic(me.code, 'act'), msg, false);
      }
      var pd = { res: res, rej: rej, timer: setInterval(fire, 3000) };
      me.pending[id] = pd; fire();
    });
  }
  // Solo sull'host: modifica diretta (bot)
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
  function clearTable() { if (T) T.c.publish(topic(T.code, 'state'), '', true); }
  function close() {
    if (!T) return;
    var me = T; T = null;
    me.timers.forEach(clearInterval);
    Object.keys(me.pending).forEach(function (k) { clearInterval(me.pending[k].timer); });
    ['state', 'act', 'ping', 'res/' + uid].forEach(function (t) { me.c.unsubscribe(topic(me.code, t)); });
    me.c.handlers = me.c.handlers.filter(function (h) { return h !== me.handler; });
    me.c.statusHandlers = me.c.statusHandlers.filter(function (h) { return h !== me.statusFn; });
  }
  return {
    create: create, open: open, send: send, close: close, hostApply: hostApply, takeHost: takeHost, clearTable: clearTable,
    setReducer: function (f) { reducer = f; },
    get uid() { return uid; },
    get isHost() { return !!(T && T.isHost); },
    get connected() { return !!(T && T.up); },
    hostAlive: function () { return !T || T.isHost || Date.now() - T.lastPing < HOST_TIMEOUT; }
  };
})();
