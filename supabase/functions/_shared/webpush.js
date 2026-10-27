/* ===== Web Push senza librerie: cifratura del messaggio (RFC 8291, aes128gcm) e firma VAPID (RFC 8292) =====
   Usa solo WebCrypto, quindi funziona uguale su Deno (Supabase) e su Node. */
const te = new TextEncoder();
export function b64u(buf) {
  const b = new Uint8Array(buf); let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function unb64u(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
  const bin = atob(s), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function cat(...parts) { let n = 0; parts.forEach((p) => { n += p.length; }); const o = new Uint8Array(n); let k = 0; parts.forEach((p) => { o.set(p, k); k += p.length; }); return o; }
async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}
function pointToJwk(pub, d) { // punto non compresso (65 byte) -> JWK P-256
  const j = { kty: 'EC', crv: 'P-256', x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)), ext: true };
  if (d) j.d = typeof d === 'string' ? d : b64u(d);
  return j;
}

/* Cifra il contenuto per un abbonamento {p256dh, auth}. opts.salt / opts.senderPrivate / opts.senderPublic servono solo alle prove. */
export async function encrypt(payload, p256dh, auth, opts = {}) {
  const uaPub = unb64u(p256dh), authSecret = unb64u(auth);
  let asPriv, asPub;
  if (opts.senderPrivate) {
    asPub = unb64u(opts.senderPublic);
    asPriv = await crypto.subtle.importKey('jwk', pointToJwk(asPub, opts.senderPrivate), { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  } else {
    const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    asPriv = kp.privateKey; asPub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  }
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asPriv, 256));
  const prkKey = await hmac(authSecret, ecdh);
  const ikm = await hmac(prkKey, cat(te.encode('WebPush: info\0'), uaPub, asPub, new Uint8Array([1])));
  const salt = opts.salt ? unb64u(opts.salt) : crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, cat(te.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, cat(te.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);
  const data = typeof payload === 'string' ? te.encode(payload) : payload;
  const key = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, cat(data, new Uint8Array([2]))));
  const rs = opts.rs || 4096;
  const header = cat(salt, new Uint8Array([(rs >>> 24) & 255, (rs >>> 16) & 255, (rs >>> 8) & 255, rs & 255, asPub.length]), asPub);
  return cat(header, ct);
}

/* Intestazione VAPID: firma ES256 con la chiave privata del server (JWK). */
export async function vapid(endpoint, publicKey, privateJwk, subject, exp) {
  const aud = new URL(endpoint).origin;
  const head = b64u(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(te.encode(JSON.stringify({ aud: aud, exp: exp || Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const key = await crypto.subtle.importKey('jwk', privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(head + '.' + body)));
  return 'vapid t=' + head + '.' + body + '.' + b64u(sig) + ', k=' + publicKey;
}

/* Manda una notifica. Risponde con lo stato HTTP del servizio di notifiche (201 = consegnata; 404/410 = abbonamento scaduto). */
export async function send(sub, message, keys, opts = {}) {
  const body = await encrypt(JSON.stringify(message), sub.p256dh, sub.auth);
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapid(sub.endpoint, keys.publicKey, keys.privateJwk, keys.subject),
      'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
      TTL: String(opts.ttl || 86400), Urgency: opts.urgency || 'high', ...(opts.topic ? { Topic: opts.topic } : {})
    },
    body
  });
  return res.status;
}

/* Nuove chiavi VAPID: pubblica (base64url, per il browser) e privata (JWK, segreta sul server). */
export async function generateKeys() {
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  return { publicKey: b64u(pub), privateJwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d } };
}
