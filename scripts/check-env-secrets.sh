#!/usr/bin/env bash
# ── CI Secret Audit ──────────────────────────────────────────────────
# Fails the build if any VITE_*SECRET or VITE_*PRIVATE variable
# is found in the frontend source tree.
#
# Add to your CI pipeline:
#   bash scripts/check-env-secrets.sh
#
# Exit code 1  = secrets exposed → block deployment
# Exit code 0  = clean

set -euo pipefail

echo "🔐 NetCopilot · Env-secret audit starting…"

MATCHES=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
  "VITE_.*SECRET\|VITE_.*PRIVATE\|VITE_.*API_KEY\|VITE_.*TOKEN" \
  src/ 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo ""
  echo "❌ SECURITY VIOLATION — Secret key exposed with VITE_ prefix:"
  echo ""
  echo "$MATCHES"
  echo ""
  echo "Fix: move secret keys to backend/index.ts and access via c.env.*"
  echo "     Only VITE_BLINK_PROJECT_ID and VITE_BLINK_PUBLISHABLE_KEY are safe."
  exit 1
fi

echo "✅ No exposed secrets found — deploy safe."
exit 0
