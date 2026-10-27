// Broker MQTT 3.1.1 minimo su WebSocket + server statico del sito, solo per le prove.
// Uso: node tests/tools/broker.js <cartella del sito> <porta>. Qui il sito gira «senza server» (server.json non c'è):
// i giochi funzionano come prima, senza account.
const http = require('http'), crypto = require('crypto'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(process.argv[2] || '.'), PORT = +(process.argv[3] || 8899);
const retained = new Map(); const clients = new Set();
let stats = { pub: 0, maxPayload: 0 };
function match(filter, topic) {
  const f = filter.split('/'), t = topic.split('/');
  for (let i = 0; i < f.length; i++) { if (f[i] === '#') return true; if (f[i] !== '+' && f[i] !== t[i]) return false; }
  return f.length === t.length;
}
function rl(n) { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return o; }
function pkt(h, body) { return Buffer.concat([Buffer.from([h, ...rl(body.length)]), Buffer.from(body)]); }
function strb(s) { const b = Buffer.from(s); return Buffer.concat([Buffer.from([b.length >> 8, b.length & 255]), b]); }
function wsFrame(data) {
  const len = data.length; let head;
  if (len < 126) head = Buffer.from([0x82, len]);
  else if (len < 65536) head = Buffer.from([0x82, 126, len >> 8, len & 255]);
  else { head = Buffer.alloc(10); head[0] = 0x82; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
  return Buffer.concat([head, data]);
}
function publishPkt(topic, payload, retain) { return pkt(0x30 | (retain ? 1 : 0), Buffer.concat([strb(topic), payload])); }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (p === '/server.json' || !f.startsWith(path.resolve(ROOT))) { res.writeHead(404); res.end('nf'); return; }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end('nf'); return; }
    const ext = path.extname(f); res.writeHead(200, { 'content-type': { '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' }[ext] || 'application/octet-stream' });
    res.end(d);
  });
});
server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\nSec-WebSocket-Protocol: mqtt\r\n\r\n');
  const c = { sock, subs: new Set(), wbuf: Buffer.alloc(0), mbuf: Buffer.alloc(0), send(b) { if (!sock.destroyed) sock.write(wsFrame(b)); } };
  clients.add(c);
  sock.on('data', d => {
    c.wbuf = Buffer.concat([c.wbuf, d]);
    while (c.wbuf.length >= 2) {
      const op = c.wbuf[0] & 15; let len = c.wbuf[1] & 127, off = 2;
      if (len === 126) { if (c.wbuf.length < 4) return; len = c.wbuf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (c.wbuf.length < 10) return; len = Number(c.wbuf.readBigUInt64BE(2)); off = 10; }
      if (c.wbuf.length < off + 4 + len) return;
      const mask = c.wbuf.subarray(off, off + 4), data = Buffer.from(c.wbuf.subarray(off + 4, off + 4 + len));
      for (let i = 0; i < data.length; i++) data[i] ^= mask[i % 4];
      c.wbuf = c.wbuf.subarray(off + 4 + len);
      if (op === 8) { sock.end(); return; }
      if (op === 2 || op === 0) { c.mbuf = Buffer.concat([c.mbuf, data]); mqtt(c); }
    }
  });
  sock.on('close', () => clients.delete(c)); sock.on('error', () => clients.delete(c));
});
function mqtt(c) {
  let b = c.mbuf;
  while (b.length >= 2) {
    let mult = 1, len = 0, i = 1, d;
    do { if (i >= b.length) { c.mbuf = b; return; } d = b[i++]; len += (d & 127) * mult; mult *= 128; } while (d & 128);
    if (b.length < i + len) break;
    handle(c, b[0], b.subarray(i, i + len)); b = b.subarray(i + len);
  }
  c.mbuf = Buffer.from(b);
}
function handle(c, h, body) {
  const type = h >> 4;
  if (type === 1) c.send(pkt(0x20, [0, 0]));
  else if (type === 8) {
    const id = body.subarray(0, 2); let p = 2; const codes = [];
    while (p < body.length) { const l = body.readUInt16BE(p); const t = body.subarray(p + 2, p + 2 + l).toString(); p += 2 + l + 1; c.subs.add(t); codes.push(0);
      for (const [rt, pl] of retained) if (match(t, rt)) c.send(publishPkt(rt, pl, true)); }
    c.send(pkt(0x90, Buffer.concat([id, Buffer.from(codes)])));
  } else if (type === 10) { const l = body.readUInt16BE(2); c.subs.delete(body.subarray(4, 4 + l).toString()); c.send(pkt(0xB0, body.subarray(0, 2))); }
  else if (type === 3) {
    const qos = (h >> 1) & 3, retain = h & 1, l = body.readUInt16BE(0), topic = body.subarray(2, 2 + l).toString(); let p = 2 + l;
    if (qos) { c.send(pkt(0x40, body.subarray(p, p + 2))); p += 2; }
    const payload = Buffer.from(body.subarray(p));
    stats.pub++; stats.maxPayload = Math.max(stats.maxPayload, payload.length);
    if (retain) { if (payload.length) retained.set(topic, payload); else retained.delete(topic); }
    for (const o of clients) for (const s of o.subs) if (match(s, topic)) { o.send(publishPkt(topic, payload, false)); break; }
  } else if (type === 12) c.send(pkt(0xD0, []));
  else if (type === 14) c.sock.end();
}
server.listen(PORT, () => console.log('broker+static on', PORT));
setInterval(() => fs.writeFileSync(path.join(__dirname, 'broker-stats.json'), JSON.stringify({ ...stats, retained: retained.size, clients: clients.size })), 1000);
