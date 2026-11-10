-- ===== Board Games: accessi più solidi, notifica «tocca a te», giochi nuovi =====
-- • Cabo, No Grazie!, Sushi Go! e Prendi 6! entrano tra i giochi riconosciuti (statistiche, amici, notifiche).
-- • Codice di recupero: chi dimentica la password può sceglierne una nuova (prima l'account era perso).
-- • Dispositivi collegati: elenco e uscita da tutti gli altri.
-- • Notifica «tocca a te» a chi ha l'app chiusa quando arriva il suo turno.

/* ---------- giochi riconosciuti ---------- */
create or replace function public._game_ok(p_game text) returns boolean
language sql immutable as $$
  select p_game in ('polvere-e-piombo', 'presagio', 'gattomina', 'campi-acciaio', 'binari-italia', 'catan', 'machiavelli', 'unlock',
                    'skyjo', 'flip7', 'citadels', 'cabo', 'nograzie', 'sushigo', 'prendi6');
$$;

/* ---------- codice di recupero ---------- */
alter table public.players add column if not exists recovery_hash text;

-- 12 caratteri, senza quelli che si confondono (niente I, O, 0, 1).
create or replace function public._new_code() returns text
language sql volatile set search_path = public, extensions as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + (get_byte(b, i) % 32), 1), '' order by i)
  from (select gen_random_bytes(12) as b) x, generate_series(0, 11) as i;
$$;

-- Crea (o sostituisce) il codice di recupero di un giocatore e lo restituisce una volta sola, già diviso in gruppi.
create or replace function public._set_recovery(p_player uuid) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare c text := _new_code();
begin
  update players set recovery_hash = crypt(c, gen_salt('bf', 8)) where id = p_player;
  return substr(c, 1, 4) || '-' || substr(c, 5, 4) || '-' || substr(c, 9, 4);
end $$;

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
  return json_build_object('token', tok, 'id', pid, 'username', u, 'recovery', _set_recovery(pid));
end $$;

create or replace function public.me(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  return (select json_build_object('id', id, 'username', username, 'recovery', recovery_hash is not null) from players where id = v);
end $$;

-- Nuovo codice di recupero (quello di prima non vale più): serve la password.
create or replace function public.new_recovery(p_token uuid, p_password text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare v uuid := _who(p_token); h text;
begin
  select pass_hash into h from players where id = v;
  if h <> crypt(coalesce(p_password, ''), h) then raise exception 'Password sbagliata.'; end if;
  return json_build_object('recovery', _set_recovery(v));
end $$;

-- Password dimenticata: nome utente + codice di recupero + nuova password. Esce da tutti i dispositivi, entra su questo
-- e consegna un codice nuovo (ogni codice vale una volta sola). Come login, gli errori tornano in {error} così i tentativi
-- sbagliati restano contati.
create or replace function public.recover(p_username text, p_code text, p_password text, p_device text default null) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare k text := lower(btrim(coalesce(p_username, ''))); c text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  r players%rowtype; tok uuid; nc text;
begin
  delete from login_fail where at < now() - interval '1 day';
  if (select count(*) from login_fail where uname = k and at > now() - interval '15 minutes') >= 8 then
    return json_build_object('error', 'Troppi tentativi sbagliati: riprova tra un quarto d''ora.');
  end if;
  select * into r from players where uname = k;
  if r.id is null or r.recovery_hash is null or length(c) <> 12 or r.recovery_hash <> crypt(c, r.recovery_hash) then
    insert into login_fail (uname) values (k);
    return json_build_object('error', 'Nome utente o codice di recupero sbagliati.');
  end if;
  if length(coalesce(p_password, '')) < 6 or length(p_password) > 72 then
    return json_build_object('error', 'La nuova password deve avere da 6 a 72 caratteri.');
  end if;
  update players set pass_hash = crypt(p_password, gen_salt('bf', 8)), last_seen = now() where id = r.id;
  delete from sessions where player_id = r.id;
  delete from login_fail where uname = k;
  nc := _set_recovery(r.id);
  insert into sessions (player_id, device) values (r.id, left(p_device, 120)) returning token into tok;
  return json_build_object('token', tok, 'id', r.id, 'username', r.username, 'recovery', nc);
end $$;

/* ---------- dispositivi collegati ---------- */
create or replace function public.my_sessions(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  delete from sessions where player_id = v and last_used < now() - interval '180 days';
  return (select coalesce(json_agg(json_build_object('device', coalesce(nullif(btrim(device), ''), 'Dispositivo'), 'since', created_at, 'used', last_used, 'here', token = p_token)
                          order by (token = p_token) desc, last_used desc), '[]'::json)
          from sessions where player_id = v);
end $$;

-- Esce da tutti gli altri dispositivi; le loro notifiche si spengono (resta, se c'è, l'iscrizione di questo dispositivo).
create or replace function public.logout_others(p_token uuid, p_keep_endpoint text default null) returns int
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token); n int;
begin
  delete from sessions where player_id = v and token <> p_token;
  get diagnostics n = row_count;
  delete from push_subs where player_id = v and endpoint is distinct from p_keep_endpoint;
  return n;
end $$;

/* ---------- notifica «tocca a te» ---------- */
alter table public.push_subs add column if not exists turns boolean not null default true;

drop function if exists public.save_push(uuid, text, text, text, text[], boolean, text);
create or replace function public.save_push(p_token uuid, p_endpoint text, p_p256dh text, p_auth text, p_games text[], p_invites boolean, p_ua text default null, p_turns boolean default true) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  if p_endpoint !~ '^https://' or length(p_endpoint) > 1000 or length(coalesce(p_p256dh, '')) > 200 or length(coalesce(p_auth, '')) > 100 then raise exception 'Iscrizione alle notifiche non valida.'; end if;
  insert into push_subs (endpoint, player_id, p256dh, auth, games, invites, turns, ua)
  values (p_endpoint, v, p_p256dh, p_auth, coalesce(p_games[1:40], '{}'), coalesce(p_invites, true), coalesce(p_turns, true), left(p_ua, 200))
  on conflict (endpoint) do update set player_id = excluded.player_id, p256dh = excluded.p256dh, auth = excluded.auth,
    games = excluded.games, invites = excluded.invites, turns = excluded.turns, ua = excluded.ua, updated_at = now();
end $$;

create or replace function public.get_push(p_token uuid, p_endpoint text) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  return (select json_build_object('games', games, 'invites', invites, 'turns', turns) from push_subs where endpoint = p_endpoint and player_id = v);
end $$;

create or replace function public._subs(p_player uuid, p_filter text, p_game text) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('endpoint', endpoint, 'p256dh', p256dh, 'auth', auth)), '[]'::json)
  from push_subs
  where (p_player is null or player_id = p_player)
    and (p_filter <> 'invites' or invites)
    and (p_filter <> 'turns' or turns)
    and (p_filter <> 'game' or p_game = any (games));
$$;

-- È il turno di un giocatore che non ha il gioco davanti: lo avvisa chi regge il tavolo. Vale solo tra amici, oppure tra
-- due persone che risultano sedute a quello stesso tavolo (lo dice la loro app con «presence»). Al massimo una notifica
-- ogni 45 secondi per persona; chi non rientra nelle regole non riceve niente (senza errore: non si svela chi esiste).
create or replace function public.srv_turn(p_token uuid, p_to text, p_game text, p_table text) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token); o uuid := _pid(p_to);
begin
  if not _game_ok(p_game) or coalesce(p_table, '') !~ '^[A-Z]{4}$' then raise exception 'Tavolo non valido.'; end if;
  if o is null or o = v then return json_build_object('subs', '[]'::json); end if;
  if not exists (select 1 from friends where status = 'accepted' and ((a = v and b = o) or (a = o and b = v)))
     and not exists (select 1 from players x, players y
                     where x.id = v and y.id = o and x.at_game = p_game and x.at_table = p_table and y.at_game = p_game and y.at_table = p_table) then
    return json_build_object('subs', '[]'::json);
  end if;
  if exists (select 1 from notify_log where player_id = o and kind = 'turned' and at > now() - interval '45 seconds') then
    return json_build_object('subs', '[]'::json);
  end if;
  perform _limit(v, 'turn', 120, interval '1 hour');
  insert into notify_log (player_id, kind) values (o, 'turned');
  return json_build_object('to', (select username from players where id = o), 'subs', _subs(o, 'turns', null));
end $$;

/* ---------- permessi (elenco completo: le funzioni nuove nascono aperte a tutti) ---------- */
revoke execute on all functions in schema public from public;
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke execute on all functions in schema public from %I', r);
      execute format('grant execute on function public.register(text, text, text), public.login(text, text, text), public.me(uuid), public.logout(uuid), public.change_password(uuid, text, text), public.delete_account(uuid, text), public.save_push(uuid, text, text, text, text[], boolean, text, boolean), public.get_push(uuid, text), public.delete_push(uuid, text), public.friends(uuid), public.friend_respond(uuid, text, boolean), public.friend_remove(uuid, text), public.ping(), public.presence(uuid, text, text, text, text), public.report_result(uuid, text, text, boolean, int, int, int, text[]), public.my_stats(uuid), public.friends_board(uuid, text), public.recover(text, text, text, text), public.new_recovery(uuid, text), public.my_sessions(uuid), public.logout_others(uuid, text) to %I', r);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.srv_table(uuid, text, text), public.srv_invite(uuid, text), public.srv_friend(uuid, text), public.srv_gone(text), public.srv_turn(uuid, text, text, text) to service_role;
  end if;
end $$;
