#!/bin/sh
# Generate /usr/share/nginx/html/config.js from environment variables so the
# Tiled server can be configured at run time (no image rebuild required).
#
# Supported variables:
#   TILED_API_URL        base URL of a Tiled server, e.g. https://host/api/v1
#                        (empty -> the app's connect screen / defaults are used)
#   TILED_API_KEY        optional API key for single-user Tiled servers
#   TILED_PROXY_RESOLVER DNS resolver used by nginx for the /tiled proxy
#                        (default: Docker's embedded DNS 127.0.0.11)
set -eu

config_path="/usr/share/nginx/html/config.js"
nginx_conf="/etc/nginx/conf.d/default.conf"

# JSON-escape a value for embedding in a double-quoted JS string.
js_escape() {
  printf '%s' "$1" | sed \
    -e 's/\\/\\\\/g' \
    -e 's/"/\\"/g' \
    -e 's/\t/\\t/g' \
    -e 's/\r/\\r/g' \
    -e 's/\n/\\n/g'
}

# Substitute the resolver placeholder in nginx.conf with the configured value.
resolver="${TILED_PROXY_RESOLVER:-127.0.0.11}"
if [ -f "$nginx_conf" ]; then
  sed -i "s|{{TILED_PROXY_RESOLVER}}|${resolver}|g" "$nginx_conf"
fi

api_url="${TILED_API_URL:-}"
api_key="${TILED_API_KEY:-}"

{
  printf 'window.__TILED_CONFIG__ = {\n'
  printf '  apiUrl: "%s",\n' "$(js_escape "$api_url")"
  printf '  apiKey: "%s"\n' "$(js_escape "$api_key")"
  printf '};\n'
} > "$config_path"

exec "$@"
