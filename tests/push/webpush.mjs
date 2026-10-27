// Web Push: cifratura confrontata con l'esempio della RFC 8291 e firma VAPID (RFC 8292).
import { encrypt, vapid, generateKeys, b64u, unb64u } from '../../supabase/functions/_shared/webpush.js';
let ok = 0, ko = 0; const t = (n, c, x) => { if (c) ok++; else { ko++; console.log('NO', n, x || ''); } };
// Esempio dell'Appendice A della RFC 8291
const R = {
  plain: 'When I grow up, I want to be a watermelon',
  asPriv: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  asPub: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  uaPriv: 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94',
  uaPub: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  salt: 'DGv6ra1nlYgDCS1FRnbzlw', auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  out: 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN'
};
const got = b64u(await encrypt(R.plain, R.uaPub, R.auth, { salt: R.salt, senderPrivate: R.asPriv, senderPublic: R.asPub }));
t('RFC 8291 Appendice A: messaggio cifrato identico all’esempio ufficiale', got === R.out, '\n' + got + '\n' + R.out);
// decifratura dal lato del telefono, con una chiave casuale (prova completa di andata e ritorno)
async function decrypt(body, uaPrivJwk, uaPub, auth) {
  const te = new TextEncoder(), salt = body.slice(0, 16), idlen = body[20], asPub = body.slice(21, 21 + idlen), ct = body.slice(21 + idlen);
  const hm = async (k, d) => new Uint8Array(await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', k, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), d));
  const cat = (...p) => { const o = new Uint8Array(p.reduce((a, x) => a + x.length, 0)); let i = 0; p.forEach((x) => { o.set(x, i); i += x.length; }); return o; };
  const priv = await crypto.subtle.importKey('jwk', uaPrivJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  const asKey = await crypto.subtle.importKey('raw', asPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, priv, 256));
  const ikm = await hm(await hm(auth, ecdh), cat(te.encode('WebPush: info\0'), uaPub, asPub, new Uint8Array([1])));
  const prk = await hm(salt, ikm);
  const cek = (await hm(prk, cat(te.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hm(prk, cat(te.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);
  const pt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['decrypt']), ct));
  return new TextDecoder().decode(pt.slice(0, pt.lastIndexOf(2)));
}
const ua = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const uaPub = new Uint8Array(await crypto.subtle.exportKey('raw', ua.publicKey)), uaJwk = await crypto.subtle.exportKey('jwk', ua.privateKey), auth = crypto.getRandomValues(new Uint8Array(16));
const msg = JSON.stringify({ title: 'Nuovo tavolo: Wizard', body: 'Ale ha aperto un tavolo è in attesa', url: 'https://x/?t=ABCD' });
const enc = await encrypt(msg, b64u(uaPub), b64u(auth));
t('andata e ritorno con chiavi casuali', await decrypt(enc, uaJwk, uaPub, auth) === msg);
t('dimensione sotto il limite di 4096 byte', enc.length < 4096, enc.length);
// VAPID: la firma si verifica con la chiave pubblica
const K = await generateKeys();
const h = await vapid('https://fcm.googleapis.com/fcm/send/abc', K.publicKey, K.privateJwk, 'https://alessandrop95.github.io/board-games/');
const m = h.match(/^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/);
t('formato intestazione VAPID', !!m && m[4] === K.publicKey, h);
const claims = JSON.parse(new TextDecoder().decode(unb64u(m[2])));
t('destinatario = origine del servizio', claims.aud === 'https://fcm.googleapis.com' && claims.exp > Date.now() / 1000 && claims.exp < Date.now() / 1000 + 86400, JSON.stringify(claims));
const pubKey = await crypto.subtle.importKey('raw', unb64u(K.publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
t('firma ES256 valida', await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pubKey, unb64u(m[3]), new TextEncoder().encode(m[1] + '.' + m[2])));
t('chiave pubblica non compressa da 65 byte', unb64u(K.publicKey).length === 65 && unb64u(K.publicKey)[0] === 4);
console.log(ok + '/' + (ok + ko) + ' prove superate');
process.exit(ko ? 1 : 0);
