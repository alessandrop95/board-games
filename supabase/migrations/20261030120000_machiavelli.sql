-- Machiavelli entra tra i giochi: statistiche, amici e notifiche dei nuovi tavoli lo riconoscono.
create or replace function public._game_ok(p_game text) returns boolean
language sql immutable as $$
  select p_game in ('polvere-e-piombo', 'presagio', 'gattomina', 'campi-acciaio', 'binari-italia', 'catan', 'machiavelli');
$$;
