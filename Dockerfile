# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Tiled web client — containerized deployment.
#
#   Stage 1: build the static SPA with Vite.
#   Stage 2: serve the built assets with nginx, including a same-origin
#            reverse proxy for remote Tiled hosts (see nginx.conf).
#
# Runtime configuration is driven by environment variables:
#   - TILED_API_URL  base URL of a Tiled server (or empty to use the UI)
#   - TILED_API_KEY  optional API key for single-user Tiled servers
# The docker-entrypoint.sh writes these into /usr/share/nginx/html/config.js
# at container start so they can be changed without rebuilding the image.
# ---------------------------------------------------------------------------

# ---- Stage 1: build -------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source and build (.dockerignore keeps node_modules out).
COPY . .

RUN npm run build

# ---- Stage 2: serve -------------------------------------------------------
FROM nginx:1.27-alpine AS serve

# Static assets + nginx config + runtime config entrypoint.
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
