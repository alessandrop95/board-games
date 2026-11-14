-- Nomi, cose, città, Disegna e indovina, Briscola, Scopa, Burraco, Sintonia, Tiro alla fune e Conquista l'Italia
-- entrano tra i giochi riconosciuti: statistiche, amici e notifiche dei nuovi tavoli li riconoscono.
create or replace function public._game_ok(p_game text) returns boolean
language sql immutable as $$
  select p_game in ('polvere-e-piombo', 'presagio', 'gattomina', 'campi-acciaio', 'binari-italia', 'catan', 'machiavelli', 'unlock',
                    'skyjo', 'flip7', 'citadels', 'cabo', 'nograzie', 'sushigo', 'prendi6',
                    'nomicose', 'disegna', 'briscola', 'scopa', 'burraco', 'sintonia', 'fune', 'conquista');
$$;
