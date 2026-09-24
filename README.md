# Muster

Muster is a generic React web client for [Tiled](https://blueskyproject.io/tiled) —
search, data browsing, slicing, download/format conversion, and live streaming.

## Stack

- Vite 6 + React 18 + TypeScript (strict)
- TanStack Query for server state
- react-router v7 for routing
- Tailwind CSS + shadcn/ui (Radix primitives)
- Plotly (`react-plotly.js`) for scientific data views
- vitest + Storybook

See the repo's `.opencode/skills/tiled-client-conventions` for the architecture and
coding conventions this app follows.

## Modular structure

This app is split into three git repositories (this one plus two plugins it consumes
as **git submodules** / npm workspace packages):

| Repo (dir)                | Package              | Purpose                                                       |
| ------------------------- | -------------------- | ------------------------------------------------------------- |
| `tiled-client-core/`      | `@tiled/client-core` | Standalone, framework-agnostic `TiledClient` for the Tiled API |
| `tiled-client-h5web/`     | `@tiled/client-h5web`| Modular h5web explorer over a `TiledClientLike` object         |
| this directory           | `muster`            | The React app (browse/search/view/download/stream)             |

The plugins live in this repo as git submodules and are linked as npm workspaces:

```jsonc
{ "workspaces": ["tiled-client-core", "tiled-client-h5web"] }
```

The app consumes their **TypeScript source directly** (via `exports`/`main` pointing
at `src/index.ts` plus Vite/tsconfig aliases), so there is no build step during
development.

- The "talk to Tiled" layer lives entirely in `@tiled/client-core` — swap it for any
  other `TiledClientLike` implementation.
- The H5Web feature is provided by `@tiled/client-h5web` and wired into the app through
  the thin `src/features/h5/H5ExploreView` adapter (supplies the active client from
  context) and `H5ViewLauncher`.

## Getting started

```bash
# pull the plugin submodules (if not already checked out)
git submodule update --init --recursive

npm install
npm run dev        # Vite dev server on http://localhost:5173
```

Point the client at a Tiled server via env vars (copy `.env.example` to `.env`):

```
VITE_TILED_API_URL=http://localhost:8000/api/v1
VITE_TILED_API_KEY=
```

To run a local Tiled server: `tiled serve demo`.

## CORS & proxying

Tiled servers block cross-origin browser requests by default (`allow_origins` is
empty), so a browser client cannot read a remote server directly unless the server
allows it. This app handles that with a **same-origin proxy**:

- In development, a Vite plugin forwards requests to `/tiled/<remote-host>/...`
  to `https://<remote-host>/...` (HTTP and WebSocket streaming). Remote servers
  you add in the app (e.g. the pre-seeded NSLS-II demo and DESY) are mounted under
  this path automatically, so **no server-side CORS configuration is needed** in dev.
- For a local server on `localhost`, `tiled serve` talks to the browser directly
  (loopback is not proxied). If you get a CORS error there, start Tiled with an
  explicit origin:
  ```
  TILED_ALLOW_ORIGINS='["http://localhost:5173"]' tiled serve demo
  ```
- To disable proxying and talk to remote hosts directly (they must then allow this
  origin via CORS), set `VITE_TILED_PROXY=0`.
- The proxy mount is configurable via `VITE_TILED_PROXY_MOUNT` (default `/tiled`),
  and `VITE_TILED_PROXY_ALLOW` can restrict which hosts the dev proxy forwards to
  (empty = any well-formed hostname).

### Production

The dev proxy is for development only. Deploy behind a reverse proxy (nginx,
Caddy, Traefik, …) that serves the same `/tiled/<host>/...` mapping to the origin
of each host the client may connect to, e.g.:

```nginx
location ~ ^/tiled/([^/]+)(/.*)$ {
    proxy_pass https://$1$2;
    proxy_set_header Host $1;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

Then set `VITE_TILED_API_URL=/tiled/<host>/api/v1` (a relative, same-origin path)
or just add that as a server in the app.

## Deploy with Docker

A `Dockerfile` is included so the client can run as a containerized static
service (built with Vite, served by nginx).

### Configure at run time via environment variables

The container is configurable at **run time** — no image rebuild needed. At
startup a small entrypoint writes `/config.js` from these variables (the app
reads it and falls back to the build-time `VITE_*` env vars when unset):

| Variable               | Meaning                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `TILED_API_URL`        | Base URL of a Tiled server, e.g. `https://host/api/v1` (or a relative same-origin path such as `/api/v1`). Leave empty to use the app's connect screen / defaults.             |
| `TILED_API_KEY`        | Optional API key for single-user Tiled servers.                                                                                                                                |
| `TILED_PROXY_RESOLVER` | DNS resolver nginx uses for the `/tiled/<host>` proxy. Defaults to Docker's embedded DNS (`127.0.0.11`); set a public or network resolver when not on a Docker bridge network. |

### Build and run

```bash
# build (from the muster/ directory)
docker build -t muster .

# run, configuring the Tiled server at start time
docker run -d -p 8080:80 \
  -e TILED_API_URL=https://tiled.desy.de/api/v1 \
  -e TILED_API_KEY=your-key \
  muster
```

Then open http://localhost:8080. The value of `TILED_API_URL` seeds the first
server on first launch; users can still switch or add servers from the dropdown
(choices persist in `localStorage`).

### Notes & caveats

- The nginx config also proxies `GET /tiled/<host>…` (and WebSocket upgrade for
  `/api/v1/stream/…`) to the remote Tiled host, matching the app's same-origin
  proxy scheme so remote servers work without server-side CORS.
- To reach a Tiled server on the same Docker network (e.g. a `tiled` service),
  set `TILED_API_URL=https://tiled:8000/api/v1`; the `/tiled` proxy forwards to
  it. Self-signed upstream certificates can be trusted by enabling
  `proxy_ssl_verify off;` in `nginx.conf`.
- nginx resolves proxy hostnames through Docker's embedded DNS (`127.0.0.11`) by
  default; on other networks set `TILED_PROXY_RESOLVER` (e.g. `8.8.8.8`).

## HDF5 exploration with H5Web

Tiled serves an HDF5 file as a tree of container/array nodes. The client detects
nodes that offer the `application/x-hdf5` media type and, when found, shows a
**"View with H5Web"** button on the node's View tab (in both the browser and the
node detail page). Clicking it swaps the listing **in place** for the embedded
[h5web](https://github.com/silx-kit/h5web) explorer — sidebar tree, breadcrumbs,
visualizers (`LineVis`/`HeatmapVis`/...), and a metadata inspector — with a
"Back to list" button to return.

- The button only appears for nodes that support HDF5: a data source with
  `mimetype == application/x-hdf5`, or a container whose name ends in
  `.h5`/`.hdf5`/`.hdf`/`.nxs`. Everything else is rendered normally, even if it
  is HDF5 data.
- Detection queries `?include_data_sources=true` so the server returns each
  node's `data_sources` (which Tiled only sends when that flag is set).
- h5web is **lazy-loaded** via `React.lazy` — its bundle (three.js and friends)
  is downloaded only after you click the button, so non-HDF5 pages stay light.
- Data is fetched **on demand**: h5web requests only entity metadata to build the
  tree, and streams only the slice you actually view (translated to Tiled's
  `?slice=`), so nothing is bulk-downloaded up front.

Implementation lives in `src/features/h5/`: a `DataProviderApi` shim over the
Tiled REST API (`TiledH5Api`), the `H5ViewLauncher` toggle, and the HDF5
detection helper `supportsHdf5`. See [`docs/h5web-integration.md`](docs/h5web-integration.md)
for a full explanation of how the client drives h5web through the Tiled API.

## Scripts

| Script                          | Description                                |
| ------------------------------- | ------------------------------------------ |
| `npm run dev`                   | Start the Vite dev server                  |
| `npm run build`                 | Type-check (`tsc -b`) and production build |
| `npm run preview`               | Preview the production build               |
| `npm run lint` / `lint:fix`     | ESLint                                     |
| `npm run format` / `format:fix` | Prettier                                   |
| `npm run test` / `test:run`     | vitest (watch / run once)                  |
| `npm run storybook`             | Storybook dev server                       |
| `npm run build-storybook`       | Static Storybook build                     |

## Routes

| Path             | Purpose                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `/`              | Connect screen (if no server selected) or redirect to `/browse`                                          |
| `/connect`       | Pick/add a Tiled server to connect to                                                                    |
| `/browse/*`      | Node browser/explorer (container listing + navigation); HDF5 containers offer a "View with H5Web" button |
| `/node/*`        | Node detail (per-family views in tabs: View/Download/Metadata/Live)                                      |
| `/search`        | Search UI (fulltext/metadata/comparison/family filters)                                                  |
| `/login`         | Sign in (internal password or OIDC redirect)                                                             |
| `/auth-callback` | OAuth2/OIDC token callback                                                                               |

## Servers

The client is a multi-server tool: it runs standalone and connects to any Tiled server
you choose. On first launch (with no saved server) it shows the connect screen at `/`.
You can also switch servers anytime from the dropdown in the header.

- Pre-seeded servers: **Local demo** (`http://localhost:8000/api/v1`), **NSLS-II demo**
  (`https://tiled-demo.nsls2.bnl.gov/api/v1`), and **DESY**
  (`https://tiled.desy.de/api/v1`).
- Add a server by name, base URL, and optional API key; the list and the active choice
  persist in `localStorage` (`tiled_servers`, `tiled_active_server_id`).
- The env vars `VITE_TILED_API_URL` / `VITE_TILED_API_KEY` bootstrap a configured server
  on first launch.
- Switching servers re-scopes authentication: tokens are stored per server
  (`tiled_access_token:<host>`, etc.) so credentials never leak between servers.

## Architecture

```
src/
├─ api/          # hand-rolled typed Tiled HTTP/WS client (types, client, requests, auth, stream, data)
├─ auth/         # token manager + auth provider/context
├─ config/       # ServerProvider + server list/active-state + TiledConfig (env-driven)
├─ hooks/        # react-query hooks (search, metadata, array, table, stream)
├─ components/   # shadcn ui + layout + common components
├─ features/     # browse, node (family views), search, download, stream, metadata, auth, h5 (H5Web explorer)
├─ lib/          # cn() helper, Plotly wrapper
└─ utils/        # link/path helpers
```

Notes:

- The API layer is fetch-based and **hand-rolled** (not the `@blueskyproject/tiled`
  npm package) for full type control. All `links` returned by the server are rewritten
  to relative paths so the client survives reverse-proxying.
- Auth support: API keys (single-user) and OAuth2 password/OIDC sessions with token
  refresh. Data requests prefer the bearer session token when present, else the API key.
- Sparse/Awkward/Ragged nodes currently render read-only structure info with a
  placeholder; full block/buffer renderers are future work.
