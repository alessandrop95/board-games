-- Database di prova: gli stessi ruoli di Supabase, e come su Supabase le funzioni nuove nascono eseguibili da tutti
-- (così le prove controllano davvero che le migrazioni tolgano i permessi giusti).
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
