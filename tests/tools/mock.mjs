// Supabase simulato per le prove: /rest/v1/rpc/* sul PostgreSQL di prova (variabili PG*), /functions/v1/notify con la funzione vera,
// file statici del sito e un server.json virtuale. Le notifiche verso https://push.example/* si registrano in /__sent.
// Uso: node --experimental-strip-types tests/tools/mock.mjs [porta]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generateKeys } from '../../supabase/functions/_shared/webpush.js';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), PORT = +(process.argv[2] || 8898), BASE = 'http://localhost:' + PORT;
const K = await generateKeys();
const env = { SUPABASE_URL: BASE, SUPABASE_SERVICE_ROLE_KEY: 'srv', VAPID_PUBLIC: K.publicKey, VAPID_PRIVATE_JWK: JSON.stringify(K.privateJwk), SITE_URL: BASE + '/' };
let handler; globalThis.Deno = { env: { get: (k) => env[k] }, serve: (h) => { handler = h; } };
const sent = []; const realFetch = globalThis.fetch;
globalThis.fetch = async (url, o) => { if (String(url).startsWith('https://push.example/')) { sent.push({ to: url, len: o.body.length }); return new Response('', { status: 201 }); } return realFetch(url, o); };
await import('../../supabase/functions/notify/index.ts');
const sql = (s, role) => { try { return { out: execFileSync('psql', ['-qtA', '-v', 'ON_ERROR_STOP=1', '-c', 'set role ' + role + '; ' + s], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() }; } catch (e) { return { err: String(e.stderr) }; } };
const lit = (v) => v == null ? 'null' : Array.isArray(v) ? 'array[' + v.map(lit).join(',') + ']::text[]' : typeof v === 'boolean' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'";
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
http.createServer(async (req, res) => {
  const u = new URL(req.url, BASE), cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey, authorization, content-type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' };
  const body = await new Promise((r) => { let b = ''; req.on('data', (d) => b += d); req.on('end', () => r(b)); });
  if (u.pathname.startsWith('/rest/v1/rpc/')) {
    if (req.method === 'OPTIONS') { res.writeHead(200, cors); return res.end(); }
    const fn = u.pathname.split('/').pop(), args = body ? JSON.parse(body) : {}, role = req.headers.apikey === 'srv' ? 'service_role' : 'anon';
    const r = sql('select ' + fn + '(' + Object.keys(args).map((k) => k + ' => ' + lit(args[k])).join(', ') + ')', role);
    res.writeHead(r.err ? 400 : 200, { ...cors, 'Content-Type': 'application/json' });
    return res.end(r.err ? JSON.stringify({ message: ((r.err.match(/ERROR:\s+(.*)/) || [])[1] || r.err).trim() }) : (r.out || 'null'));
  }
  if (u.pathname === '/functions/v1/notify') {
    const r = await handler(new Request(BASE + u.pathname, { method: req.method, headers: req.headers, body: req.method === 'POST' ? body : undefined }));
    const h = {}; r.headers.forEach((v, k) => { h[k] = v; }); res.writeHead(r.status, h); return res.end(await r.text());
  }
  if (u.pathname === '/__sent') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(sent)); }
  if (u.pathname === '/server.json') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ url: BASE, anon: 'anon', fn: BASE + '/functions/v1/notify', vapid: K.publicKey })); }
  let f = path.join(ROOT, decodeURIComponent(u.pathname)); if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); } catch (e) { res.writeHead(404); res.end('404'); }
}).listen(PORT, () => console.log('supabase simulato su ' + PORT));
