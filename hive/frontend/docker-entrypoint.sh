#!/bin/sh
set -e

HTTPS_CONF="/etc/nginx/conf.d/https.conf"

echo "[entrypoint] Starting nginx with HTTP-only config..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Give nginx a moment to be ready (for ACME or initial traffic)
sleep 3

echo "[entrypoint] Loading HTTPS config..."
# Render the HTTPS config template (replace ${NGINX_APP0_DOMAIN})
envsubst '${NGINX_APP0_DOMAIN}' < /etc/nginx/templates/https.conf.template > "$HTTPS_CONF"

# Reload nginx to apply HTTPS immediately
nginx -s reload
echo "[entrypoint] nginx reloaded with HTTPS."

# Wait for nginx process so container stays alive
wait $NGINX_PID


