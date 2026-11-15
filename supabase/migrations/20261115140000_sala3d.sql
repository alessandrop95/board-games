-- Sala 3D (sito a parte, repository «sala-3d»): le sale condivise del progettista 3D stanno qui.
-- Chi ha il link di una sala la legge e la modifica senza account: il codice nel link è la chiave.
-- La tabella non è leggibile da fuori; si passa solo dalle due funzioni, così i codici non si possono elencare.
create table if not exists public.sala3d_rooms (
  id text primary key,
  rev integer not null default 1,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sala3d_rooms enable row level security;
revoke all on public.sala3d_rooms from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then execute 'revoke all on public.sala3d_rooms from anon'; end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then execute 'revoke all on public.sala3d_rooms from authenticated'; end if;
end $$;

-- Legge la sala solo se è più recente della versione che il chiamante ha già (p_rev): nessuna riga = niente di nuovo (o sala inesistente).
create or replace function public.sala3d_get(p_id text, p_rev integer default 0)
returns table(rev integer, data jsonb)
language sql stable security definer set search_path = public as $$
  select r.rev, r.data from sala3d_rooms r where r.id = p_id and r.rev > coalesce(p_rev, 0);
$$;

-- Salva la sala. p_rev = 0 la crea (se non c'è già); altrimenti aggiorna solo se p_rev è ancora la versione corrente.
-- Risponde la nuova versione, oppure -1 se qualcun altro ha salvato nel frattempo (il sito allora rilegge e unisce le modifiche).
create or replace function public.sala3d_save(p_id text, p_rev integer, p_data jsonb)
returns integer
language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  if p_id is null or p_id !~ '^[a-z0-9]{10,40}$' then raise exception 'Sala: codice non valido.'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or length(p_data::text) > 150000 then raise exception 'Sala: dati non validi.'; end if;
  if coalesce(p_rev, 0) <= 0 then
    if (select count(*) from sala3d_rooms) >= 1000 then raise exception 'Sala: troppe sale salvate.'; end if;
    insert into sala3d_rooms (id, data) values (p_id, p_data) on conflict (id) do nothing returning sala3d_rooms.rev into v;
  else
    update sala3d_rooms set data = p_data, rev = sala3d_rooms.rev + 1, updated_at = now()
      where sala3d_rooms.id = p_id and sala3d_rooms.rev = p_rev returning sala3d_rooms.rev into v;
  end if;
  return coalesce(v, -1);
end $$;

/* ---------- permessi (elenco completo: le funzioni nuove nascono aperte a tutti) ----------
   Le due funzioni sala3d_* devono restare in questo elenco anche nelle prossime migrazioni: senza, il sito Sala 3D smette di salvare. */
revoke execute on all functions in schema public from public;
do $$
declare r text;
begin
  foreach r in array array['anon', 'authenticated', 'service_role'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke execute on all functions in schema public from %I', r);
      execute format('grant execute on function public.register(text, text, text), public.login(text, text, text), public.me(uuid), public.logout(uuid), public.change_password(uuid, text, text), public.delete_account(uuid, text), public.save_push(uuid, text, text, text, text[], boolean, text, boolean), public.get_push(uuid, text), public.delete_push(uuid, text), public.friends(uuid), public.friend_respond(uuid, text, boolean), public.friend_remove(uuid, text), public.ping(), public.presence(uuid, text, text, text, text), public.report_result(uuid, text, text, boolean, int, int, int, text[]), public.my_stats(uuid), public.friends_board(uuid, text), public.recover(text, text, text, text), public.new_recovery(uuid, text), public.my_sessions(uuid), public.logout_others(uuid, text), public.sala3d_get(text, integer), public.sala3d_save(text, integer, jsonb) to %I', r);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.srv_table(uuid, text, text), public.srv_invite(uuid, text), public.srv_friend(uuid, text), public.srv_gone(text), public.srv_turn(uuid, text, text, text) to service_role;
  end if;
end $$;
