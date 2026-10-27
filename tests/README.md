# Prove automatiche

`bash tests/run.sh` fa girare tutto; su GitHub lo fa il workflow **Prove** dopo ogni ricostruzione dei giochi.

| Cartella | Cosa prova |
|---|---|
| `rules/` | regole di Binari d'Italia (una prova per regola) e partite intere tra bot |
| `push/` | notifiche: cifratura e firma confrontate con le RFC, funzione `notify` con il database vero |
| `db/` | migrazioni Supabase: account, amici, notifiche, presenza, tavoli «solo amici», risultati, permessi |
| `web/` | partite vere nel browser (Playwright) con più telefoni simulati: tavoli e sessioni, uscita, account e inviti, notifiche, amici online, serie, statistiche, reazioni, partita guidata in tutti i giochi |
| `tools/` | broker MQTT locale (porta 8897, sito senza server) e Supabase simulato (porta 8898, sito con account) |

Servono PostgreSQL (variabili `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`), Node 22 e Python con Playwright.
Le schermate e i registri finiscono in `tests/.out/` (non salvati nel repository).
