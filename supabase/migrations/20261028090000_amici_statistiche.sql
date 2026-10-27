-- ===== Board Games: amici online, tavoli «solo amici», risultati delle partite e statistiche =====

/* ---------- presenza: chi è collegato e a quale tavolo ---------- */
alter table public.players add column if not exists active_at timestamptz;
alter table public.players add column if not exists at_game text;
alter table public.players add column if not exists at_table text;
alter table public.players add column if not exists at_vis text;
alter table public.players add column if not exists at_phase text;

create or replace function public._game_ok(p_game text) returns boolean
language sql immutable as $$
  select p_game in ('polvere-e-piombo', 'presagio', 'gattomina', 'campi-acciaio', 'binari-italia');
$$;

-- Elenco amici con lo stato attuale (online = l'app ha dato segni di vita negli ultimi 150 secondi).
create or replace function public.friends(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  return json_build_object(
    'friends', (select coalesce(json_agg(json_build_object(
                  'username', p.username,
                  'online', coalesce(p.active_at > now() - interval '150 seconds', false),
                  'game', case when p.active_at > now() - interval '150 seconds' then p.at_game end,
                  'table', case when p.active_at > now() - interval '150 seconds' then p.at_table end,
                  'vis', case when p.active_at > now() - interval '150 seconds' then p.at_vis end,
                  'phase', case when p.active_at > now() - interval '150 seconds' then p.at_phase end)
                order by (p.active_at > now() - interval '150 seconds') desc nulls last, p.uname), '[]'::json)
                from friends f join players p on p.id = case when f.a = v then f.b else f.a end
                where (f.a = v or f.b = v) and f.status = 'accepted'),
    'incoming', (select coalesce(json_agg(p.username order by f.created_at desc), '[]'::json) from friends f join players p on p.id = f.a where f.b = v and f.status = 'pending'),
    'outgoing', (select coalesce(json_agg(p.username order by f.created_at desc), '[]'::json) from friends f join players p on p.id = f.b where f.a = v and f.status = 'pending'));
end $$;

-- Segnale di presenza (ogni minuto con l'app aperta, e subito quando cambia tavolo). Risponde con gli amici aggiornati.
create or replace function public.presence(p_token uuid, p_game text, p_table text, p_vis text, p_phase text) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token); g text := case when _game_ok(p_game) then p_game end;
begin
  update players set active_at = now(), at_game = g,
    at_table = case when g is not null and p_table ~ '^[A-Z]{4}$' then p_table end,
    at_vis = case when p_vis in ('public', 'invite', 'friends') then p_vis end,
    at_phase = case when p_phase in ('lobby', 'play', 'over') then p_phase end
  where id = v;
  return friends(p_token);
end $$;

/* ---------- annuncio di un nuovo tavolo: «solo amici» arriva solo agli amici ---------- */
drop function if exists public.srv_table(uuid, text);
create or replace function public.srv_table(p_token uuid, p_game text, p_vis text default 'public') returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  perform _limit(v, 'table', 3, interval '10 minutes');
  return json_build_object('from', (select username from players where id = v),
    'subs', (select coalesce(json_agg(json_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)), '[]'::json)
             from push_subs s
             where s.player_id <> v and p_game = any (s.games)
               and (p_vis is distinct from 'friends' or exists (
                 select 1 from friends f where f.status = 'accepted' and ((f.a = v and f.b = s.player_id) or (f.b = v and f.a = s.player_id))))));
end $$;

/* ---------- risultati delle partite ---------- */
create table if not exists public.results (
  player_id uuid not null references public.players on delete cascade,
  match text not null,
  game text not null,
  at timestamptz not null default now(),
  won boolean not null,
  place int,
  players int,
  score int,
  rivals text[] not null default '{}',
  primary key (player_id, match)
);
create index if not exists results_player_at on public.results (player_id, at desc);
alter table public.results enable row level security;
revoke all on public.results from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then execute 'revoke all on public.results from anon'; end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then execute 'revoke all on public.results from authenticated'; end if;
end $$;

-- Ogni giocatore con l'account registra il proprio risultato a fine partita (una volta sola per partita).
create or replace function public.report_result(p_token uuid, p_game text, p_match text, p_won boolean, p_place int, p_players int, p_score int, p_rivals text[]) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  if not _game_ok(p_game) then raise exception 'Gioco sconosciuto.'; end if;
  if p_match is null or length(p_match) not between 8 and 80 then raise exception 'Partita non valida.'; end if;
  perform _limit(v, 'result', 40, interval '1 hour');
  insert into results (player_id, match, game, won, place, players, score, rivals)
  values (v, p_match, p_game, coalesce(p_won, false),
          case when p_place between 1 and 10 then p_place end,
          case when p_players between 1 and 10 then p_players end,
          case when p_score between -10000 and 10000 then p_score end,
          coalesce((select array_agg(left(btrim(r), 18)) from unnest((coalesce(p_rivals, '{}'::text[]))[1:9]) r where btrim(r) <> ''), '{}'))
  on conflict do nothing;
end $$;

-- Le mie statistiche: per gioco e ultime partite.
create or replace function public.my_stats(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  return json_build_object(
    'games', (select coalesce(json_agg(json_build_object('game', game, 'played', n, 'won', w) order by n desc), '[]'::json)
              from (select game, count(*) n, count(*) filter (where won) w from results where player_id = v group by game) t),
    'recent', (select coalesce(json_agg(json_build_object('game', game, 'at', at, 'won', won, 'place', place, 'players', players, 'score', score, 'rivals', rivals) order by at desc), '[]'::json)
               from (select * from results where player_id = v order by at desc limit 15) r));
end $$;

-- Classifica tra me e i miei amici (tutti i giochi, oppure uno solo).
create or replace function public.friends_board(p_token uuid, p_game text default null) returns json
language plpgsql security definer set search_path = public as $$
declare v uuid := _who(p_token);
begin
  return (select coalesce(json_agg(json_build_object('username', p.username, 'me', p.id = v, 'played', coalesce(t.n, 0), 'won', coalesce(t.w, 0))
                 order by coalesce(t.w, 0) desc, coalesce(t.n, 0) asc, p.uname), '[]'::json)
          from players p
          left join (select player_id, count(*) n, count(*) filter (where won) w from results
                     where p_game is null or game = p_game group by player_id) t on t.player_id = p.id
          where p.id = v or p.id in (select case when f.a = v then f.b else f.a end from friends f where (f.a = v or f.b = v) and f.status = 'accepted'));
end $$;

/* ---------- permessi (elenco completo: le funzioni nuove nascono aperte a tutti) ---------- */
revoke execute on all functions in schema public from public;
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke execute on all functions in schema public from %I', r);
      execute format('grant execute on function public.register(text, text, text), public.login(text, text, text), public.me(uuid), public.logout(uuid), public.change_password(uuid, text, text), public.delete_account(uuid, text), public.save_push(uuid, text, text, text, text[], boolean, text), public.get_push(uuid, text), public.delete_push(uuid, text), public.friends(uuid), public.friend_respond(uuid, text, boolean), public.friend_remove(uuid, text), public.ping(), public.presence(uuid, text, text, text, text), public.report_result(uuid, text, text, boolean, int, int, int, text[]), public.my_stats(uuid), public.friends_board(uuid, text) to %I', r);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.srv_table(uuid, text, text), public.srv_invite(uuid, text), public.srv_friend(uuid, text), public.srv_gone(text) to service_role;
  end if;
end $$;
