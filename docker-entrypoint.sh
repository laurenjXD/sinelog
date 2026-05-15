#!/bin/sh
# ═══════════════════════════════════════════════════════════════
#  docker-entrypoint.sh
#  Runs at container startup.
#  Reads K8s Secret env vars → writes /usr/share/nginx/html/env-config.js
#  so the browser can access them via window.__SL_ENV__
# ═══════════════════════════════════════════════════════════════

set -e

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__SL_ENV__ = {
  TMDB_KEY:    "${TMDB_KEY}",
  SUPABASE_URL:  "${SUPABASE_URL}",
  SUPABASE_ANON: "${SUPABASE_ANON}"
};
EOF

echo "[entrypoint] env-config.js written."

# Hand off to nginx
exec nginx -g "daemon off;"
