-- ===== Board Games: account, sessioni, notifiche push e amici =====
-- Nessuno legge le tabelle direttamente: tutto passa da funzioni che controllano la sessione.
-- Le funzioni srv_* le usa solo il server (funzione «notify») con la chiave di servizio.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  uname text generated always as (lower(username)) stored unique,
  pass_hash text not null,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
create table if not exists public.sessions (
  token uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players on delete cascade,
  device text,
  created_at timestamptz not null default now(),
  last_used timestamptz not null default now()
);
create index if not exists sessions_player on public.sessions (player_id);
create table if not exists public.push_subs (
  endpoint text primary key,
  player_id uuid not null references public.players on delete cascade,
  p256dh text not null,
  auth text not null,
  games text[] not null default '{}',
  invites boolean not null default true,
  ua text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists push_subs_player on public.push_subs (player_id);
-- a ha chiesto l'amicizia a b; status: pending | accepted
create table if not exists public.friends (
  a uuid not null references public.players on delete cascade,
  b uuid not null references public.players on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a <> b)
);
create index if not exists friends_b on public.friends (b);
create table if not exists public.login_fail (uname text not null, at timestamptz not null default now());
create index if not exists login_fail_u on public.login_fail (uname, at);
create table if not exists public.notify_log (player_id uuid not null, kind text not null, at timestamptz not null default now());
create index if not exists notify_log_p on public.notify_log (player_id, kind, at);

alter table public.players enable row level security;
alter table public.sessions enable row level security;
alter table public.push_subs enable row level security;
alter table public.friends enable row level security;
alter table public.login_fail enable row level security;
alter table public.notify_log enable row level security;
revoke all on public.players, public.sessions, public.push_subs, public.friends, public.login_fail, public.notify_log from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then execute 'revoke all on public.players, public.sessions, public.push_subs, public.friends, public.login_fail, public.notify_log from anon'; end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then execute 'revoke all on public.players, public.sessions, public.push_subs, public.friends, public.login_fail, public.notify_log from authenticated'; end if;
end $$;

/* ---------- utilità interne ---------- */
create or replace function public._who(p_token uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  update sessions set last_used = now() where token = p_token and last_used > now() - interval '180 days' returning player_id into v;
  if v is null then raise exception 'Sessione scaduta: accedi di nuovo.'; end if;
  update players set last_seen = now() where id = v and last_seen < now() - interval '5 minutes';
  return v;
end $$;

create or replace function public._pid(p_username text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from players where uname = lower(btrim(coalesce(p_username, '')));
$$;

create or replace function public._limit(p_player uuid, p_kind text, p_max int, p_window interval) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from notify_log where at < now() - interval '1 day';
  if (select count(*) from notify_log where player_id = p_player and kind = p_kind and at > now() - p_window) >= p_max then
    raise exception 'Hai mandato troppi avvisi: aspetta qualche minuto.';
  end if;
  insert into notify_log (player_id, kind) values (p_player, p_kind);
end $$;

create or replace function public._subs(p_player uuid, p_filter text, p_game text) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('endpoint', endpoint, 'p256dh', p256dh, 'auth', auth)), '[]'::json)
  from push_subs
  where (p_player is null or player_id = p_player)
    and (p_filter <> 'invites' or invites)
    and (p_filter <> 'game' or p_game = any (games));
$$;

/* ---------- account ---------- */
create or replace function public.register(p_username text, p_password text, p_device text default null) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare u text := btrim(coalesce(p_username, '')); pid uuid; tok uuid;
begin
  if u !~ '^[A-Za-z0-9_.-]{3,18}$' then raise exception 'Il nome utente deve avere da 3 a 18 caratteri: lettere senza accenti, numeri, punto, trattino o trattino basso.'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'La password deve avere almeno 6 caratteri.'; end if;
  if length(p_password) > 72 then raise exception 'La password è troppo lunga (massimo 72 caratteri).'; end if;
  if exists (select 1 from players where uname = lower(u)) then raise exception 'Il nome «%» è già preso: scegline un altro.', u; end if;
  if (select count(*) from players where created_at > now() - interval '1 minute') >= 30 then raise exception 'Troppe registrazioni in questo momento: riprova tra un minuto.'; end if;
  insert into players (username, pass_hash) values (u, crypt(p_password, gen_salt('bf', 8))) returning id into pid;
  insert into sessions (player_id, device) values (pid, left(p_device, 120)) returning token into tok;
  return json_build_object('token', tok, 'id', pid, 'username', u);
end $$;

-- In caso di errore restituisce {error} invece di un'eccezione, così il tentativo sbagliato resta registrato.
create or replace function public.login(p_username text, p_password text, p_device text default null) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare k text := lower(btrim(coalesce(p_username, ''))); r players%rowtype; tok uuid;
begin
  delete from login_fail where at < now() - interval '1 day';
  if (select count(*) from login_fail where uname = k and at > now() - interval '15 minutes') >= 8 then
    return json_build_object('error', 'Troppi tentativi sbagliati: riprova tra un quarto d''ora.');
  end if;
  select * into r from players where uname = k;
  if r.id is null or r.pass_hash <> crypt(coalesce(p_password, ''), r.pass_hash) then
    insert into login_fail (uname) values (k);
    return json_build_object('error', 'Nome utente o password sbagliati.');
  end if;
  delete from login_fail where uname = k;
  insert into sessions (player_id, device) values (r.id, left(p_device, 120)) returning token into tok;
  update players set last_seen = now() where id = r.id;
  return json_build_object('token', tok, 'id', r.id, 'username', r.username);
end $$;

create or replace function public.me(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  return (select json_build_object('id', id, 'username', username) from players where id = v);
end $$;

create or replace function public.logout(p_token uuid) returns void
language sql security definer set search_path = public as $$
  delete from sessions where token = p_token;
$$;

create or replace function public.change_password(p_token uuid, p_old text, p_new text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare v uuid := _who(p_token); h text;
begin
  select pass_hash into h from players where id = v;
  if h <> crypt(coalesce(p_old, ''), h) then raise exception 'La password attuale non è giusta.'; end if;
  if length(coalesce(p_new, '')) < 6 or length(p_new) > 72 then raise exception 'La nuova password deve avere da 6 a 72 caratteri.'; end if;
  update players set pass_hash = crypt(p_new, gen_salt('bf', 8)) where id = v;
  delete from sessions where player_id = v and token <> p_token; -- esce dagli altri dispositivi
end $$;

create or replace function public.delete_account(p_token uuid, p_password text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare v uuid := _who(p_token); h text;
begin
  select pass_hash into h from players where id = v;
  if h <> crypt(coalesce(p_password, ''), h) then raise exception 'Password sbagliata: l''account non è stato cancellato.'; end if;
  delete from players where id = v; -- sessioni, notifiche e amicizie spariscono a cascata
end $$;

/* ---------- notifiche ---------- */
create or replace function public.save_push(p_token uuid, p_endpoint text, p_p256dh text, p_auth text, p_games text[], p_invites boolean, p_ua text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 or length(coalesce(p_p256dh, '')) > 200 or length(coalesce(p_auth, '')) > 100 then raise exception 'Iscrizione alle notifiche non valida.'; end if;
  insert into push_subs (endpoint, player_id, p256dh, auth, games, invites, ua)
  values (p_endpoint, v, p_p256dh, p_auth, coalesce(p_games[1:20], '{}'), coalesce(p_invites, true), left(p_ua, 200))
  on conflict (endpoint) do update set player_id = excluded.player_id, p256dh = excluded.p256dh, auth = excluded.auth,
    games = excluded.games, invites = excluded.invites, ua = excluded.ua, updated_at = now();
end $$;

create or replace function public.get_push(p_token uuid, p_endpoint text) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  return (select json_build_object('games', games, 'invites', invites) from push_subs where endpoint = p_endpoint and player_id = v);
end $$;

create or replace function public.delete_push(p_token uuid, p_endpoint text) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  delete from push_subs where endpoint = p_endpoint and player_id = v;
end $$;

/* ---------- amici ---------- */
create or replace function public.friends(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  return json_build_object(
    'friends', (select coalesce(json_agg(json_build_object('username', p.username, 'online', p.last_seen > now() - interval '10 minutes') order by p.uname), '[]'::json)
                from friends f join players p on p.id = case when f.a = v then f.b else f.a end
                where (f.a = v or f.b = v) and f.status = 'accepted'),
    'incoming', (select coalesce(json_agg(p.username order by f.created_at desc), '[]'::json) from friends f join players p on p.id = f.a where f.b = v and f.status = 'pending'),
    'outgoing', (select coalesce(json_agg(p.username order by f.created_at desc), '[]'::json) from friends f join players p on p.id = f.b where f.a = v and f.status = 'pending'));
end $$;

create or replace function public.friend_respond(p_token uuid, p_username text, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token); o uuid := _pid(p_username);
begin
  if o is null then raise exception 'Giocatore non trovato.'; end if;
  if p_accept then update friends set status = 'accepted' where a = o and b = v;
  else delete from friends where a = o and b = v; end if;
end $$;

create or replace function public.friend_remove(p_token uuid, p_username text) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token); o uuid := _pid(p_username);
begin
  delete from friends where (a = v and b = o) or (a = o and b = v);
end $$;

-- per tenere sveglio il progetto gratuito (controllo giornaliero)
create or replace function public.ping() returns text language sql stable as $$ select 'ok'::text $$;

/* ---------- solo per il server (funzione notify) ---------- */
-- Nuovo tavolo pubblico: chi lo annuncia e a chi mandare la notifica (escluso chi l'ha aperto).
create or replace function public.srv_table(p_token uuid, p_game text) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  perform _limit(v, 'table', 3, interval '10 minutes');
  return json_build_object('from', (select username from players where id = v),
    'subs', (select coalesce(json_agg(json_build_object('endpoint', endpoint, 'p256dh', p256dh, 'auth', auth)), '[]'::json)
             from push_subs where player_id <> v and p_game = any (games)));
end $$;

-- Invito diretto: solo tra amici.
create or replace function public.srv_invite(p_token uuid, p_to text) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token); o uuid := _pid(p_to);
begin
  if o is null then raise exception 'Giocatore non trovato.'; end if;
  if not exists (select 1 from friends where status = 'accepted' and ((a = v and b = o) or (a = o and b = v))) then raise exception 'Puoi invitare solo i tuoi amici.'; end if;
  perform _limit(v, 'invite', 20, interval '10 minutes');
  return json_build_object('from', (select username from players where id = v), 'to', (select username from players where id = o), 'subs', _subs(o, 'invites', null));
end $$;

-- Richiesta di amicizia (se l'altro l'aveva già chiesta a te, diventate subito amici).
create or replace function public.srv_friend(p_token uuid, p_to text) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token); o uuid := _pid(p_to); st text; n int;
begin
  if o is null then raise exception 'Nessun giocatore si chiama «%».', btrim(coalesce(p_to, '')); end if;
  if o = v then raise exception 'Non puoi aggiungere te stesso.'; end if;
  if exists (select 1 from friends where status = 'accepted' and ((a = v and b = o) or (a = o and b = v))) then
    return json_build_object('state', 'already', 'to', (select username from players where id = o), 'subs', '[]'::json);
  end if;
  if exists (select 1 from friends where a = o and b = v) then
    update friends set status = 'accepted' where a = o and b = v; st := 'accepted';
  else
    insert into friends (a, b) values (v, o) on conflict do nothing;
    get diagnostics n = row_count;
    st := case when n > 0 then 'sent' else 'pending' end;
  end if;
  if st = 'pending' then return json_build_object('state', st, 'to', (select username from players where id = o), 'subs', '[]'::json); end if;
  perform _limit(v, 'friend', 30, interval '1 hour');
  return json_build_object('state', st, 'from', (select username from players where id = v), 'to', (select username from players where id = o), 'subs', _subs(o, 'invites', null));
end $$;

create or replace function public.srv_gone(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from push_subs where endpoint = p_endpoint;
$$;

/* ---------- permessi ---------- */
revoke execute on all functions in schema public from public;
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke execute on all functions in schema public from %I', r);
      execute format('grant execute on function public.register(text, text, text), public.login(text, text, text), public.me(uuid), public.logout(uuid), public.change_password(uuid, text, text), public.delete_account(uuid, text), public.save_push(uuid, text, text, text, text[], boolean, text), public.get_push(uuid, text), public.delete_push(uuid, text), public.friends(uuid), public.friend_respond(uuid, text, boolean), public.friend_remove(uuid, text), public.ping() to %I', r);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.srv_table(uuid, text), public.srv_invite(uuid, text), public.srv_friend(uuid, text), public.srv_gone(text) to service_role;
  end if;
end $$;
