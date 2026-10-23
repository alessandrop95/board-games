/* ===== Rete senza account: MQTT su WebSocket verso broker pubblici gratuiti =====
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
  var BROKERS = qs.get('broker') ? [qs.get('broker')] : [
    'wss://broker.hivemq.com:8884/mqtt',
    'wss://broker.emqx.io:8084/mqtt',
    'wss://test.mosquitto.org:8081/mqtt'
  ];
  var HOST_TIMEOUT = +(qs.get('hostTimeout') || 20000);          // dopo quanto mostrare l'avviso
  var AUTO_TAKEOVER = +(qs.get('autoTakeover') || HOST_TIMEOUT * 1.5); // dopo quanto subentrare da soli
  var STAGGER = +(qs.get('stagger') || 6000);                     // attesa extra per ogni giocatore prima di me
  var PREFIX = window.GAME_PREFIX || 'polvere-piombo/v1/';
  var uid = lsGet('pp-uid');
  if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6); lsSet('pp-uid', uid); }
  var clients = {}, reducer = null, beforePublish = null, onTakeover = null, lobbyInfo = null;
  var LOBBY_BEAT = +(qs.get('lobbyBeat') || 25000);   // ogni quanto l'host conferma che il tavolo è vivo
  var LOBBY_TTL = +(qs.get('lobbyTtl') || 75000);     // oltre questo silenzio il tavolo sparisce dalla lista
  function lobbyTopic(id) { return PREFIX + 'lobby/' + id; }
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
    if (T) { T.lastPing = Math.max(T.lastPing, Date.now() - 2000); T.graceUntil = Date.now() + 8000; }
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
  async function find(code) {
    var reached = false;
    for (var i = 0; i < BROKERS.length; i++) {
      var c; try { c = await client(i); reached = true; } catch (e) { continue; }
      var doc = await probeState(c, code, 2600);
      if (doc && doc.code === code && !doc.closed) return { i: i, c: c, doc: doc };
      c.unsubscribe(topic(code, 'state'));
    }
    if (!reached) throw 'Nessun server di gioco raggiungibile. Controlla la connessione e riprova.';
    return null;
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
        vis: opts && opts.vis === 'invite' ? 'invite' : 'public', lobbyId: rid() };
      if (!b.c.publish(topic(code, 'state'), JSON.stringify(doc), true)) throw 'La connessione è caduta. Riprova.';
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
    T = { code: code, c: c, doc: null, isHost: false, onDoc: onDoc, onStatus: onStatus, pending: {}, answered: {}, answeredKeys: [], lastPing: Date.now(), up: c.connected, timers: [], seenRev: 0, graceUntil: 0 };
    var me = T;
    var tState = topic(code, 'state'), tAct = topic(code, 'act'), tRes = topic(code, 'res/' + uid), tPing = topic(code, 'ping');
    me.handler = function (t, p) {
      if (T !== me) return;
      if (t === tState) {
        if (!p) { me.doc = null; onDoc(null); return; }
        var d = safeParse(p); if (!d) return;
        if (d.closed) { if (!me.doc || (d.rev || 0) >= (me.doc.rev || 0)) { me.doc = null; me.closed = true; onDoc(null); } return; }
        me.seenRev = Math.max(me.seenRev, d.rev || 0);
        if (me.doc) {
          var dr = d.rev || 0, mr = me.doc.rev || 0;
          // stessa versione ma host diverso (due subentri quasi simultanei): vince l'id più basso
          var tie = dr === mr && d.host !== me.doc.host && String(d.host) < String(me.doc.host);
          if (dr < mr || (dr === mr && !tie)) return;
        }
        me.lastPing = Date.now();
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
    me.statusFn = function (up) {
      if (T !== me) return;
      me.up = up;
      if (up) {
        me.lastPing = Date.now(); me.seenRev = 0; me.graceUntil = Date.now() + 8000;
        // Host appena ricollegato: se nel frattempo nessuno ha pubblicato uno stato più nuovo, ripubblica il proprio.
        setTimeout(function () {
          if (T === me && me.isHost && me.up && me.doc && me.seenRev < (me.doc.rev || 0)) me.c.publish(tState, JSON.stringify(me.doc), true);
        }, 1500);
      }
      if (onStatus) onStatus();
    };
    c.onStatus(me.statusFn);
    c.subscribe(tRes); c.subscribe(tPing); c.subscribe(tState);
    accept(f.doc);
    me.timers.push(setInterval(function () {
      if (T !== me) return;
      if (me.isHost) { c.publish(tPing, String(Date.now()), false); if (Date.now() - (me.lastAnn || 0) > LOBBY_BEAT) announce(true); }
      else maybeTakeOver(me);
      if (onStatus) onStatus();
    }, Math.min(5000, Math.max(1000, HOST_TIMEOUT / 4))));
    return true;
  }
  // Subentro automatico: solo un giocatore seduto, collegato e con la pagina aperta.
  // Per evitare due subentri insieme, ognuno aspetta in più in base al suo posto.
  function maybeTakeOver(me) {
    if (!me.doc || me.closed || !me.up || document.visibilityState === 'hidden' || Date.now() < me.graceUntil) return;
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
    if (shouldHost && !T.isHost) { T.isHost = true; T.c.subscribe(topic(T.code, 'act')); T.c.publish(topic(T.code, 'ping'), String(Date.now()), false); }
    if (!shouldHost && T.isHost) { T.isHost = false; T.c.unsubscribe(topic(T.code, 'act')); }
    if (T.isHost && !d.lobbyId) { setTimeout(function () { hostApply(function (w) { if (w.lobbyId) return false; w.lobbyId = rid(); w.vis = w.vis || 'public'; return true; }); }, 0); }
    else if (T.isHost) announce(false);
    T.onDoc(JSON.parse(JSON.stringify(d)));
  }
  // Annuncio del tavolo nella lista pubblica (messaggio "retained" per tavolo, aggiornato dall'host).
  // I tavoli "solo su invito" compaiono senza codice.
  function announce(force) {
    if (!T || !T.isHost || !T.doc || !T.doc.lobbyId) return;
    var d = T.doc, info = lobbyInfo ? lobbyInfo(d) : {}, vis = d.vis === 'invite' ? 'invite' : 'public';
    var host = d.seats.filter(function (s) { return s.uid === d.host; })[0];
    var e = { v: 1, id: d.lobbyId, vis: vis, code: vis === 'public' ? d.code : null, host: host ? host.nick : '', n: d.seats.length, max: info.max || null, phase: d.phase, note: info.note || '', t: Date.now() };
    var sig = JSON.stringify([e.vis, e.code, e.host, e.n, e.phase, e.note]);
    if (!force && sig === T.lobbySig) return;
    if (T.c.publish(lobbyTopic(d.lobbyId), JSON.stringify(e), true)) { T.lobbySig = sig; T.lastAnn = Date.now(); }
  }
  // Controlla se un tavolo esiste ancora (senza entrarci). Risponde con lo stato o null; lancia un errore se nessun server è raggiungibile.
  async function peek(code) {
    var reached = false;
    for (var i = 0; i < BROKERS.length; i++) {
      var c; try { c = await client(i); reached = true; } catch (e) { continue; }
      var doc = await probeState(c, code, 2200);
      if (!(T && T.code === code)) c.unsubscribe(topic(code, 'state'));
      if (doc && doc.code === code && !doc.closed) return doc;
    }
    if (!reached) throw new Error('offline');
    return null;
  }
  // Lista dal vivo dei tavoli di questo gioco. cb(lista) a ogni cambiamento; restituisce la funzione per smettere.
  async function watchLobby(cb) {
    var b = await firstBroker(), c = b.c, base = PREFIX + 'lobby/', filt = base + '+', items = {}, stopped = false;
    function emit() {
      if (stopped) return;
      var now = Date.now();
      cb(Object.keys(items).map(function (k) { return items[k]; }).filter(function (e) { return now - e.t < LOBBY_TTL && (e.phase === 'lobby' || e.phase === 'play'); })
        .sort(function (a, b) { return (a.phase === 'lobby' ? 0 : 1) - (b.phase === 'lobby' ? 0 : 1) || b.t - a.t; }));
    }
    function h(t, p) {
      if (t.indexOf(base) !== 0) return;
      var id = t.slice(base.length);
      if (!p) { delete items[id]; emit(); return; }
      var e = safeParse(p);
      if (!e || e.id !== id || typeof e.t !== 'number') return;
      if (Date.now() - e.t > 3600e3) { c.publish(t, '', true); delete items[id]; emit(); return; } // pulizia dei tavoli abbandonati
      e.host = String(e.host || '').slice(0, 18); e.note = String(e.note || '').slice(0, 40);
      items[id] = e; emit();
    }
    c.onMessage(h); c.subscribe(filt);
    var iv = setInterval(emit, 10000);
    return function () { stopped = true; clearInterval(iv); c.handlers = c.handlers.filter(function (x) { return x !== h; }); c.unsubscribe(filt); };
  }
  function publishState() {
    if (beforePublish) beforePublish(T.doc);
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
    T.closed = true;
    return ok;
  }
  function clearTable() { return closeTable(); }
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
    create: create, open: open, send: send, close: close, hostApply: hostApply, takeHost: takeHost, clearTable: clearTable, closeTable: closeTable, watchLobby: watchLobby, peek: peek,
    setLobbyInfo: function (f) { lobbyInfo = f; },
    setReducer: function (f) { reducer = f; },
    setBeforePublish: function (f) { beforePublish = f; },
    setOnTakeover: function (f) { onTakeover = f; },
    get uid() { return uid; },
    get isHost() { return !!(T && T.isHost); },
    get connected() { return !!(T && T.up); },
    hostAlive: function () { return !T || T.isHost || Date.now() - T.lastPing < HOST_TIMEOUT; },
    _debug: function () { return { clients: clients, T: T }; }
  };
})();
