#!/usr/bin/env bash
# Tutte le prove del progetto: regole, notifiche, database e prove nel browser (Playwright).
# Uso: bash tests/run.sh
# Serve PostgreSQL (variabili PGHOST, PGPORT, PGUSER, PGPASSWORD; il database «bgtest» viene ricreato da zero),
# Node 22 e Python con Playwright (python -m playwright install chromium).
set -u
cd "$(dirname "$0")/.."
export PGDATABASE=bgtest OUT="$PWD/tests/.out"
mkdir -p "$OUT"
fail=0; summary=()
step() { local name="$1"; shift; echo "::group::$name"; if "$@"; then summary+=("OK  $name"); else summary+=("NO  $name"); fail=1; fi; echo "::endgroup::"; }
retry() { "$@" || { echo "Riprovo una volta (le prove nel browser dipendono dai tempi della rete)…"; "$@"; }; }

# database di prova: ruoli come su Supabase e tutte le migrazioni, da zero
psql -d postgres -qc "drop database if exists bgtest" -c "create database bgtest" || exit 1
psql -q -v ON_ERROR_STOP=1 -f tests/db/setup.sql || exit 1
for f in supabase/migrations/*.sql; do psql -q -v ON_ERROR_STOP=1 -f "$f" || { echo "Migrazione non riuscita: $f"; exit 1; }; done

step "Regole di Binari d'Italia" node tests/rules/binari.js
step "Partite intere tra bot (Binari d'Italia)" node tests/rules/binari_bots.js 6
step "Notifiche: cifratura e firma (RFC 8291/8292)" node tests/push/webpush.mjs
step "Database" python3 tests/db/test_db.py
step "Funzione notify" node --experimental-strip-types --no-warnings tests/push/notify.mjs

# server locali: broker MQTT + sito «senza server» su 8897, Supabase simulato + sito con account su 8898
node tests/tools/broker.js . 8897 > "$OUT/broker.log" 2>&1 & BR=$!
node --experimental-strip-types --no-warnings tests/tools/mock.mjs 8898 > "$OUT/mock.log" 2>&1 & MO=$!
trap 'kill $BR $MO 2>/dev/null' EXIT
for i in $(seq 1 60); do curl -sf localhost:8897/index.html >/dev/null && curl -sf localhost:8898/server.json >/dev/null && break; sleep 0.5; done

for f in tests/web/test_*.py; do step "Browser: $(basename "$f" .py)" retry python3 "$f"; done

echo; printf '%s\n' "${summary[@]}"
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then { echo '### Prove'; printf -- '- %s\n' "${summary[@]}"; } >> "$GITHUB_STEP_SUMMARY"; fi
exit $fail
