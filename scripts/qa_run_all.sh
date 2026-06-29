#!/usr/bin/env bash
# Owns the dev server for the whole QA run so it can't be reaped between turns.
# Runs each test sequentially (one chromium at a time) and prints QA_RESULT lines.
set -u
cd "$(dirname "$0")/.."
OUT="${1:?need out dir}"; shift || true
LOG=/tmp/devserver.log

pnpm dev > "$LOG" 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT

# wait for ready + discover the port (Next may pick 3000/3003/…)
PORT=""
for i in $(seq 1 60); do
  PORT=$(grep -oE "localhost:[0-9]+" "$LOG" | head -1 | cut -d: -f2)
  if [ -n "$PORT" ] && curl -s -o /dev/null "http://localhost:$PORT/"; then break; fi
  sleep 2
done
[ -z "$PORT" ] && { echo "SERVER_FAILED"; tail -5 "$LOG"; exit 1; }
echo "SERVER_UP port=$PORT"

CRED=$(cat /tmp/qa_cred.txt)
export QA_EMAIL="${CRED%%|*}" QA_PASSWORD="${CRED##*|}" BASE_URL="http://localhost:$PORT"

# tests: slug | dir | label
TESTS=(
  "listening-test-19-azsy0|may2026-1-20|Bộ đề thi máy 2026 (1-20) — Listening"
  "q3-reading-test-21|may2026-21-40|Bộ Đề Máy 2026 (21-40) — Reading"
  "reading-test-42-0qtvl|may2026-41-50|Bộ Đề Máy 2026 (41-50) — Reading"
  "general-test-15-yqo9y|ielts-general-collection|IELTS General collection — Reading"
  "ielts-plus-volume-1-reading-test-2-remix-2eab93|import-academic|Import IELTS Academic — Reading"
  "ielts-general-sample-reading-test-1-remix-e1dc83|import-general|Import IELTS General — Reading"
  "bc-ielts-listening-test-1-3f35a4|import-listening|Import Listening (audio)"
)
# optional: filter to a subset by index args (1-based)
SEL=("$@")
i=0
for t in "${TESTS[@]}"; do
  i=$((i+1))
  if [ ${#SEL[@]} -gt 0 ] && ! printf '%s\n' "${SEL[@]}" | grep -qx "$i"; then continue; fi
  slug="${t%%|*}"; rest="${t#*|}"; dir="${rest%%|*}"; label="${rest#*|}"
  # warm route to avoid first-hit compile inside the timed run
  curl -s -o /dev/null "http://localhost:$PORT/take-the-test/$slug"
  echo ">>> [$i] $label"
  timeout 200 node scripts/qa_take_test.mjs "$slug" "$OUT/$dir" "$label" 2>&1 | grep -E "QA_RESULT" || echo "QA_RESULT {\"slug\":\"$slug\",\"label\":\"$label\",\"ok\":false,\"error\":\"timeout/crash\"}"
done
echo "ALL_DONE"
