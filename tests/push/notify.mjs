// Prova completa della funzione notify: database vero (PostgreSQL locale), servizio push simulato che decifra i messaggi.
import { execFileSync } from 'node:child_process';
import { generateKeys, b64u } from '../../supabase/functions/_shared/webpush.js';
const sql = (s, role = 'service_role') => { try { return { out: execFileSync('psql', ['-qtA', '-v', 'ON_ERROR_STOP=1', '-c', 'set role ' + role + '; ' + s], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() }; } catch (e) { return { err: String(e.stderr) }; } };
const K = await generateKeys();
const env = { SUPABASE_URL: 'https://proj.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'srv', VAPID_PUBLIC: K.publicKey, VAPID_PRIVATE_JWK: JSON.stringify(K.privateJwk) };
let handler; globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };
// telefoni simulati: ognuno ha le sue chiavi; il servizio push decifra con quelle
const phones = {}, inbox = [];
async function phone(name) {
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const pub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)), auth = crypto.getRandomValues(new Uint8Array(16));
  phones['https://push.example/' + name] = { name, kp, pub, auth };
  return { endpoint: 'https://push.example/' + name, p256dh: b64u(pub), auth: b64u(auth) };
}
async function decrypt(ph, body) {
  const te = new TextEncoder(), salt = body.slice(0, 16), idlen = body[20], asPub = body.slice(21, 21 + idlen), ct = body.slice(21 + idlen);
  const hm = async (k, d) => new Uint8Array(await crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', k, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), d));
  const cat = (...p) => { const o = new Uint8Array(p.reduce((a, x) => a + x.length, 0)); let i = 0; p.forEach((x) => { o.set(x, i); i += x.length; }); return o; };
  const asKey = await crypto.subtle.importKey('raw', asPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, ph.kp.privateKey, 256));
  const ikm = await hm(await hm(ph.auth, ecdh), cat(te.encode('WebPush: info\0'), ph.pub, asPub, new Uint8Array([1])));
  const prk = await hm(salt, ikm);
  const cek = (await hm(prk, cat(te.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hm(prk, cat(te.encode('Content-Encoding: nonce\0'), new Uint8Array([1])))).slice(0, 12);
  const pt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['decrypt']), ct));
  return JSON.parse(new TextDecoder().decode(pt.slice(0, pt.lastIndexOf(2))));
}
globalThis.fetch = async (url, o) => {
  if (url.startsWith(env.SUPABASE_URL + '/rest/v1/rpc/')) {
    const fn = url.split('/').pop(), args = JSON.parse(o.body);
    const lit = (v) => v == null ? 'null' : "'" + String(v).replace(/'/g, "''") + "'";
    const r = sql('select ' + fn + '(' + Object.keys(args).map((k) => k + ' => ' + lit(args[k])).join(', ') + ')');
    if (r.err) return new Response(JSON.stringify({ message: (r.err.match(/ERROR:\s+(.*)/) || [])[1] }), { status: 400 });
    return new Response(r.out || 'null', { status: 200 });
  }
  if (url.startsWith('https://push.example/')) {
    if (url.endsWith('/gone')) return new Response('', { status: 410 });
    if (!/^vapid t=.+, k=/.test(o.headers.Authorization) || o.headers['Content-Encoding'] !== 'aes128gcm') return new Response('', { status: 401 });
    inbox.push({ to: phones[url].name, msg: await decrypt(phones[url], o.body) });
    return new Response('', { status: 201 });
  }
  throw new Error('rete non prevista ' + url);
};
await import('../../supabase/functions/notify/index.ts');
const call = async (b, origin = 'https://alessandrop95.github.io') => { const r = await handler(new Request('https://f/notify', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(b) })); return { status: r.status, cors: r.headers.get('access-control-allow-origin'), body: await r.json() }; };
let ok = 0, ko = 0; const t = (n, c, x) => { if (c) ok++; else { ko++; console.log('NO', n, x === undefined ? '' : JSON.stringify(x)); } };
// pulizia e utenti
sql('delete from players; delete from notify_log; delete from login_fail;', 'postgres');
const reg = (u) => JSON.parse(sql("select register('" + u + "','segreto1')", 'anon').out);
const A = reg('Ale'), B = reg('Bea'), C = reg('Cleo');
const sub = async (U, name, games, invites = true) => { const s = await phone(name); sql(`select save_push('${U.token}','${s.endpoint}','${s.p256dh}','${s.auth}',array[${games.map((g) => "'" + g + "'").join(',')}]::text[],${invites},'test')`, 'anon'); };
await sub(A, 'ale-telefono', ['binari-italia']); await sub(B, 'bea-telefono', ['binari-italia', 'presagio']); await sub(B, 'bea-pc', ['binari-italia']); await sub(C, 'cleo', ['presagio'], false);
const pre = (await call({ kind: 'table', token: A.token, game: 'binari-italia', code: 'ABCD' }));
t('nuovo tavolo: risposta', pre.status === 200 && pre.body.sent === 2, pre);
t('…arriva ai due dispositivi di Bea, non ad Ale né a Cleo', inbox.map((m) => m.to).sort().join() === 'bea-pc,bea-telefono', inbox);
t('…testo e link giusti', inbox[0].msg.title === 'Nuovo tavolo: Ticket to Ride Italy' && /^Ale ha aperto un tavolo/.test(inbox[0].msg.body) && inbox[0].msg.url === 'https://alessandrop95.github.io/board-games/binari-italia/?t=ABCD', inbox[0].msg);
t('CORS per il sito', pre.cors === 'https://alessandrop95.github.io');
inbox.length = 0;
let r = await call({ kind: 'invite', token: A.token, to: 'Bea', game: 'presagio', code: 'WXYZ' });
t('invito senza amicizia rifiutato', r.status === 400 && /amici/.test(r.body.error), r);
r = await call({ kind: 'friend', token: A.token, to: 'bea' });
t('richiesta di amicizia', r.body.state === 'sent' && r.body.sent === 2 && inbox.length === 2 && inbox[0].msg.title === 'Richiesta di amicizia', [r, inbox]);
inbox.length = 0;
r = await call({ kind: 'friend', token: B.token, to: 'Ale' });
t('accettare = rispondere con una richiesta', r.body.state === 'accepted' && inbox.length === 1 && inbox[0].to === 'ale-telefono' && inbox[0].msg.title === 'Nuovo amico', [r, inbox]);
inbox.length = 0;
r = await call({ kind: 'invite', token: A.token, to: 'Bea', game: 'presagio', code: 'wxyz' });
t('invito a un amico', r.status === 200 && inbox.length === 2 && inbox[0].msg.title === 'Ale ti invita a giocare' && inbox[0].msg.url.endsWith('/presagio/?t=WXYZ'), [r, inbox]);
r = await call({ kind: 'table', token: A.token, game: 'monopoli', code: 'ABCD' }); t('gioco sconosciuto', r.status === 400, r);
r = await call({ kind: 'table', token: 'x', game: 'presagio', code: 'ABCD' }); t('senza accesso', r.status === 400 && /Accedi/.test(r.body.error), r);
r = await call({ kind: 'table', token: '00000000-0000-0000-0000-000000000000', game: 'presagio', code: 'ABCD' }); t('sessione scaduta', /Sessione scaduta/.test(r.body.error), r);
// abbonamento scaduto: viene cancellato
const g = await phone('gone'); sql(`select save_push('${C.token}','https://push.example/gone','${g.p256dh}','${g.auth}',array['gattomina']::text[],true,null)`, 'anon');
r = await call({ kind: 'table', token: A.token, game: 'gattomina', code: 'QQQQ' });
t('abbonamento scaduto rimosso', sql("select count(*) from push_subs where endpoint='https://push.example/gone'", 'postgres').out === '0', r);
r = await call({ kind: 'table', token: A.token, game: 'gattomina', code: 'QQQR' });
t('terzo annuncio ancora ammesso', r.status === 200, r);
r = await call({ kind: 'table', token: A.token, game: 'gattomina', code: 'QQQS' });
t('limite di annunci per giocatore', r.status === 400 && /troppi/.test(r.body.error), r);
// tavolo «solo amici»: l'annuncio arriva solo agli amici (Ale e Bea sono amici, Cleo no)
inbox.length = 0; sql("delete from notify_log", 'postgres');
await sub(C, 'cleo-binari', ['binari-italia']);
r = await call({ kind: 'table', token: B.token, game: 'binari-italia', code: 'AMIC', vis: 'friends' });
t('tavolo solo amici: avvisato solo Ale', r.status === 200 && inbox.map((m) => m.to).join() === 'ale-telefono' && inbox[0].msg.title === 'Tavolo tra amici: Ticket to Ride Italy', [r, inbox]);
inbox.length = 0;
r = await call({ kind: 'table', token: B.token, game: 'binari-italia', code: 'TUTT' });
t('tavolo aperto a tutti: avvisati anche gli altri', inbox.map((m) => m.to).sort().join() === 'ale-telefono,cleo-binari', inbox.map((m) => m.to));
const opt = await handler(new Request('https://f/notify', { method: 'OPTIONS', headers: { origin: 'https://alessandrop95.github.io' } }));
t('preflight CORS', opt.status === 200 && /POST/.test(opt.headers.get('access-control-allow-methods')));
console.log(ok + '/' + (ok + ko) + ' prove superate');
process.exit(ko ? 1 : 0);
