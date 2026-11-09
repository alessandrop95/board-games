#!/usr/bin/env bash
# Prove del progetto: regole, notifiche, database e prove nel browser (Playwright).
# Uso: bash tests/run.sh                 → tutte le prove
#      bash tests/run.sh skyjo flip7     → solo le prove di quei giochi
#      bash tests/run.sh comuni          → solo le prove delle parti comuni (account, notifiche, sala d'attesa, rivincita…)
# (oppure la variabile GAMES con gli stessi nomi; «tutti» = tutto). Ogni prova nel browser dichiara il suo gioco
# nella prima riga («# gioco: skyjo»); senza dichiarazione conta tra le «comuni».
# Serve PostgreSQL (variabili PGHOST, PGPORT, PGUSER, PGPASSWORD; il database «bgtest» viene ricreato da zero),
# Node 22 e Python con Playwright (python -m playwright install chromium).
set -u
cd "$(dirname "$0")/.."
export PGDATABASE=bgtest OUT="$PWD/tests/.out"
mkdir -p "$OUT"
SEL=" ${*:-${GAMES:-tutti}} "
want() { [[ "$SEL" == *" tutti "* || "$SEL" == *" $1 "* ]]; }
echo "Prove scelte:$SEL"
fail=0; summary=()
step() { local name="$1"; shift; echo "::group::$name"; if "$@"; then summary+=("OK  $name"); else summary+=("NO  $name"); fail=1; fi; echo "::endgroup::"; }
# prova di un gioco: parte solo se quel gioco è tra quelli scelti
gstep() { local g="$1"; shift; want "$g" && step "$@"; return 0; }
retry() { "$@" || { echo "Riprovo una volta (le prove nel browser dipendono dai tempi della rete)…"; "$@"; }; }

# database di prova: ruoli come su Supabase e tutte le migrazioni, da zero
psql -d postgres -qc "drop database if exists bgtest" -c "create database bgtest" || exit 1
psql -q -v ON_ERROR_STOP=1 -f tests/db/setup.sql || exit 1
for f in supabase/migrations/*.sql; do psql -q -v ON_ERROR_STOP=1 -f "$f" || { echo "Migrazione non riuscita: $f"; exit 1; }; done

gstep binari-italia "Regole di Ticket to Ride Italy" node tests/rules/binari.js
gstep binari-italia "Partite intere tra bot (Ticket to Ride Italy)" node tests/rules/binari_bots.js 6
gstep catan "Regole di Catan" node tests/rules/catan.js
gstep catan "Partite intere tra bot (Catan)" node tests/rules/catan_bots.js 20
gstep machiavelli "Regole di Machiavelli" node tests/rules/machiavelli.js
gstep machiavelli "Partite intere tra bot (Machiavelli)" node tests/rules/machiavelli_bots.js 15
gstep unlock "Regole e avventure di Unlock!" node tests/rules/unlock.js
gstep skyjo "Regole di Skyjo" node tests/rules/skyjo.js
gstep skyjo "Partite intere tra bot (Skyjo)" node tests/rules/skyjo_bots.js 10
gstep flip7 "Regole di Flip 7" node tests/rules/flip7.js
gstep flip7 "Partite intere tra bot (Flip 7)" node tests/rules/flip7_bots.js 10
gstep citadels "Regole di Citadels" node tests/rules/citadels.js
gstep citadels "Partite intere tra bot (Citadels)" node tests/rules/citadels_bots.js 10
gstep cabo "Regole di Cabo" node tests/rules/cabo.js
gstep cabo "Partite intere tra bot (Cabo)" node tests/rules/cabo_bots.js 10
gstep nograzie "Regole di No Grazie!" node tests/rules/nograzie.js
gstep nograzie "Partite intere tra bot (No Grazie!)" node tests/rules/nograzie_bots.js 20
gstep polvere-e-piombo "Regole di Bang! con le espansioni" node tests/rules/pp_rules.js
gstep polvere-e-piombo "Partite intere tra bot (Bang!, tutte le combinazioni di espansioni)" node tests/rules/pp_bots.js
gstep comuni "Notifiche: cifratura e firma (RFC 8291/8292)" node tests/push/webpush.mjs
gstep comuni "Database" python3 tests/db/test_db.py
gstep comuni "Funzione notify" node --experimental-strip-types --no-warnings tests/push/notify.mjs

# server locali: broker MQTT + sito «senza server» su 8897, Supabase simulato + sito con account su 8898
node tests/tools/broker.js . 8897 > "$OUT/broker.log" 2>&1 & BR=$!
node --experimental-strip-types --no-warnings tests/tools/mock.mjs 8898 > "$OUT/mock.log" 2>&1 & MO=$!
trap 'kill $BR $MO 2>/dev/null' EXIT
for i in $(seq 1 60); do curl -sf localhost:8897/index.html >/dev/null && curl -sf localhost:8898/server.json >/dev/null && break; sleep 0.5; done

for f in tests/web/test_*.py; do
  g=$(head -3 "$f" | sed -n 's/^# gioco: *//p' | head -1); g=${g:-comuni}
  gstep "$g" "Browser: $(basename "$f" .py)" retry python3 "$f"
done

if [ ${#summary[@]} = 0 ]; then summary=("--  nessuna prova per:$SEL"); fi
echo; printf '%s\n' "${summary[@]}"
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then { echo "### Prove ($SEL)"; printf -- '- %s\n' "${summary[@]}"; } >> "$GITHUB_STEP_SUMMARY"; fi
exit $fail
