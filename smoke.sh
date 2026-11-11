#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
# Start a local static server if not already running
if ! curl -sS -o /dev/null http://localhost:3002/ 2>/dev/null; then
  python3 -m http.server 3002 >/tmp/opencode/smoke-server.log 2>&1 &
  SERVER_PID=$!
  trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
  sleep 1
fi
node tests/smoke.mjs
