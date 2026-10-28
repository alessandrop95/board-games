// ===== Board Games: funzione «notify» (Supabase Edge Function) =====
// Riceve dal sito: nuovo tavolo aperto, invito a un amico, richiesta di amicizia.
// Controlla la sessione e i permessi nel database (funzioni srv_*) e manda le notifiche Web Push.
import { send } from '../_shared/webpush.js';

const SUPA = Deno.env.get('SUPABASE_URL')!;
const SKEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE = (Deno.env.get('SITE_URL') || 'https://alessandrop95.github.io/board-games/').replace(/\/?$/, '/');
const KEYS = {
  publicKey: Deno.env.get('VAPID_PUBLIC') || '',
  privateJwk: JSON.parse(Deno.env.get('VAPID_PRIVATE_JWK') || '{}'),
  subject: Deno.env.get('VAPID_SUBJECT') || SITE
};
const GAMES: Record<string, string> = {
  'polvere-e-piombo': 'Bang!', 'presagio': 'Wizard', 'gattomina': 'Exploding Kittens', 'campi-acciaio': 'Scythe', 'binari-italia': 'Ticket to Ride Italy', 'catan': 'Catan'
};
const ORIGINS = ['https://alessandrop95.github.io', 'http://localhost:8897'];

function cors(req: Request) {
  const o = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(o) || /^http:\/\/localhost:\d+$/.test(o) ? o : ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Vary': 'Origin'
  };
}
async function rpc(fn: string, args: Record<string, unknown>) {
  const r = await fetch(SUPA + '/rest/v1/rpc/' + fn, {
    method: 'POST',
    headers: { apikey: SKEY, Authorization: 'Bearer ' + SKEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  const txt = await r.text();
  let data: any = null; try { data = txt ? JSON.parse(txt) : null; } catch (_) { data = txt; }
  if (!r.ok) throw new Error((data && data.message) || 'Errore del server.');
  return data;
}
function clean(s: unknown, n: number) { return String(s ?? '').replace(/[<>]/g, '').trim().slice(0, n); }

// Manda a tutti gli abbonamenti; quelli scaduti (404/410) vengono cancellati.
async function deliver(subs: any[], msg: Record<string, unknown>, topic?: string) {
  let sent = 0;
  await Promise.all((subs || []).slice(0, 500).map(async (s) => {
    try {
      const st = await send(s, msg, KEYS, { topic });
      if (st === 404 || st === 410) await rpc('srv_gone', { p_endpoint: s.endpoint });
      else if (st >= 200 && st < 300) sent++;
      else console.warn('push', st, new URL(s.endpoint).host);
    } catch (e) { console.warn('push errore', String(e)); }
  }));
  return sent;
}

Deno.serve(async (req) => {
  const H = { ...cors(req), 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Usa POST.' }), { status: 405, headers: H });
  try {
    if (!KEYS.publicKey || !KEYS.privateJwk.d) throw new Error('Notifiche non ancora configurate sul server.');
    const b = await req.json();
    const token = String(b.token || ''), kind = String(b.kind || '');
    if (!/^[0-9a-f-]{36}$/i.test(token)) throw new Error('Accedi per usare le notifiche.');
    const game = String(b.game || ''), code = String(b.code || '').toUpperCase();
    const needTable = kind === 'table' || kind === 'invite';
    if (needTable && (!GAMES[game] || !/^[A-Z]{4}$/.test(code))) throw new Error('Tavolo non valido.');
    const url = needTable ? SITE + game + '/?t=' + code : SITE + '?amici=1';
    let out: Record<string, unknown> = { ok: true };
    if (kind === 'table') {
      const friendsOnly = b.vis === 'friends';
      const r = await rpc('srv_table', { p_token: token, p_game: game, p_vis: friendsOnly ? 'friends' : 'public' });
      out.sent = await deliver(r.subs, {
        title: (friendsOnly ? 'Tavolo tra amici: ' : 'Nuovo tavolo: ') + GAMES[game],
        body: clean(r.from, 18) + (friendsOnly ? ' ha aperto un tavolo per i suoi amici. Tocca per sederti.' : ' ha aperto un tavolo ed è in attesa di giocatori. Tocca per sederti.'),
        url, tag: 'table-' + game + '-' + code, kind
      }, 'table' + code);
    } else if (kind === 'invite') {
      const r = await rpc('srv_invite', { p_token: token, p_to: clean(b.to, 18) });
      out.sent = await deliver(r.subs, {
        title: clean(r.from, 18) + ' ti invita a giocare',
        body: 'Tavolo ' + code + ' di ' + GAMES[game] + ': tocca per sederti.',
        url, tag: 'invite-' + code, kind
      }, 'invite' + code);
      out.to = r.to;
    } else if (kind === 'friend') {
      const r = await rpc('srv_friend', { p_token: token, p_to: clean(b.to, 18) });
      out.state = r.state; out.to = r.to;
      if (r.state === 'sent') out.sent = await deliver(r.subs, { title: 'Richiesta di amicizia', body: clean(r.from, 18) + ' vuole aggiungerti agli amici. Tocca per rispondere.', url, tag: 'friend-' + r.from, kind });
      if (r.state === 'accepted') out.sent = await deliver(r.subs, { title: 'Nuovo amico', body: clean(r.from, 18) + ' ha accettato: ora potete invitarvi ai tavoli.', url, tag: 'friend-' + r.from, kind });
    } else throw new Error('Richiesta sconosciuta.');
    return new Response(JSON.stringify(out), { headers: H });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 400, headers: H });
  }
});
