# Muster

Muster is a **generic React web client for [Tiled](https://blueskyproject.io/tiled)** —
the scientific data server that provides search, remote slicing, format conversion,
and live streaming. It is multi-server: it runs standalone and connects to any Tiled
server you choose, browsing nodes, slicing arrays, exploring I/O datasets with h5web,
downloading in other formats, and streaming live data.

## Stack

- **Vite 6** + **React 18** + **TypeScript** (strict)
- **TanStack Query** for server state
- **react-router v7** for routing
- **Tailwind CSS** + **shadcn/ui** (Radix primitives)
- **Plotly** (`react-plotly.js`) for scientific data views
- **vitest** + **Storybook** for testing/docs

See the `tiled-client-conventions` skill (installed to
`~/.config/opencode/skills/`) for the architecture and coding conventions this app follows.

## Modular structure

This app consumes `@photonic/tiled-client-h5web` (hosted in the `tiled-client-h5web`
repo) as an **npm workspace package**, wired via Vite/tsconfig aliases to its
TypeScript source (`src/index.ts`) — there are no git submodules, and dev never
generates artifacts.

| Repo (dir) | Package | Purpose |
| --- | --- | --- |
| `tiled-client-h5web` | `@photonic/tiled-client-h5web` | HDF5 (h5web) explorer for Tiled: React library (`H5Explorer`, `TiledH5Provider`, `TiledH5Api`, mappers, detection) + a `<tiled-h5web>` webcomponent (subpath `./webcomponent`, not imported by this app). |
| this directory | `muster` | The React app (browse/search/view/download/stream) |

- The **"talk to Tiled"** layer is the official `@blueskyproject/tiled` SDK's
  `TiledApiClient`, instantiated **per server** (see `src/config/`). A few
  capability gaps the SDK doesn't cover (device-code OAuth, WebSocket stream URLs,
  raw download/asset URLs, general Tiled slice strings) are handled by small local
  modules under `src/lib/`.
- The **H5Web feature** is provided by `@photonic/tiled-client-h5web` and wired into
  the app through the thin `src/features/h5/` adapter (`H5ExploreView`, `H5ViewLauncher`).

## Getting started

Requires Node 18+. Make sure the `tiled-client-h5web` monorepo is present next to
`muster/` (see AGENTS.md), then:

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

Point the client at a Tiled server via env vars. Copy `.env.example` to `.env` and
adjust:

```
VITE_TILED_API_URL=http://localhost:8000/api/v1
VITE_TILED_API_KEY=
```

To run a local Tiled server: `tiled serve demo` (see the `tiled-dev-setup` skill).

## Connectivity & the same-origin proxy

Tiled servers block cross-origin browser requests by default (`allow_origins` is
empty), so a browser cannot read a remote server directly unless the server allows
it. Muster handles this with a **same-origin proxy** mounted at `/tiled/<host>/...`:

- **Remote hosts** (e.g. the pre-seeded NSLS-II demo and DESY) are reached through
  the proxy — both regular HTTP and WebSocket streaming upgrade paths are forwarded,
  so **no server-side CORS configuration is needed** in dev. The Vite proxy plugin
  (`vite.tiled-proxy.ts`) forwards requests and rewrites upstream redirects to stay
  same-origin.
- **Loopback hosts** (`localhost`/`127.0.0.1`/`::1`) and **relative paths** (e.g.
  `/api/v1`) are used directly. For a local server on `localhost`, if you get a CORS
  error, start Tiled with an explicit origin:
  ```
  TILED_ALLOW_ORIGINS='["http://localhost:5173"]' tiled serve demo
  ```
  > The build-time `vite.config.ts` also forwards `/api/v1` to
  > `http://localhost:8000` for convenience; the app's per-server proxy is the
  > general mechanism for remote hosts.

Proxying is enabled by default. Because it is derived from each server's URL
(remote → proxied, loopback/relative → direct), you don't configure it with env
vars — a server URL that is relative or loopback is simply not proxied.

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

Then point a server at a relative same-origin path such as
`VITE_TILED_API_URL=/tiled/<host>/api/v1`, or just add that as a server in the app.

## Deploy with Docker

A `Dockerfile` is included so the client runs as a containerized static service
(built with Vite, served by nginx).

### Configure at run time via environment variables

At startup a small entrypoint writes `/config.js` from these variables (the app
reads it and falls back to the build-time `VITE_*` env vars when unset):

| Variable | Meaning |
| --- | --- |
| `TILED_API_URL` | Base URL of a Tiled server, e.g. `https://host/api/v1` (or a relative same-origin path such as `/api/v1`). Leave empty to use the app's connect screen / defaults. |
| `TILED_API_KEY` | Optional API key for single-user Tiled servers. |
| `TILED_PROXY_RESOLVER` | DNS resolver nginx uses for the `/tiled/<host>` proxy. Defaults to Docker's embedded DNS (`127.0.0.11`); set a public or network resolver when not on a Docker bridge network. |

### Build and run

```bash
docker build -t muster .
docker run -d -p 8080:80 \
  -e TILED_API_URL=https://tiled.desy.de/api/v1 \
  -e TILED_API_KEY=your-key \
  muster
```

Then open http://localhost:8080. `TILED_API_URL` seeds the first server on first
launch; users can still switch or add servers from the dropdown (choices persist in
`localStorage`).

### Notes & caveats

- nginx also proxies `GET /tiled/<host>...` (and WebSocket upgrade for `/api/v1/stream/...`)
  to the remote Tiled host, matching the app's same-origin proxy scheme.
- To reach a Tiled server on the same Docker network (e.g. a `tiled` service), set
  `TILED_API_URL=https://tiled:8000/api/v1`. Self-signed upstream certificates can
  be trusted by enabling `proxy_ssl_verify off;` in `nginx.conf`.
- nginx resolves proxy hostnames through Docker's embedded DNS (`127.0.0.11`) by
  default; on other networks set `TILED_PROXY_RESOLVER` (e.g. `8.8.8.8`).

## HDF5 exploration with h5web

Tiled serves an HDF5 file as a tree of container/array nodes. The client detects
nodes that offer the `application/x-hdf5` media type and, when found, shows a
**"View with H5Web"** button on the node's View tab (in both the browser and the
node detail page). Clicking it swaps the listing **in place** for the embedded
[h5web](https://github.com/silx-kit/h5web) explorer — sidebar tree, breadcrumbs,
visualizers (`LineVis`/`HeatmapVis`/...), and a metadata inspector — with a "Back to
list" button to return.

- The button only appears for nodes that support HDF5: a data source with
  `mimetype == application/x-hdf5`, or a container whose name ends in
  `.h5`/`.hdf5`/`.hdf`/`.nxs`. Everything else is rendered normally, even if it is
  HDF5 data.
- Detection queries `?include_data_sources=true` so the server returns each node's
  `data_sources` (only sent when that flag is set).
- h5web is **lazy-loaded** via `React.lazy` — its bundle (three.js and friends) is
  downloaded only after you click the button, so non-HDF5 pages stay light.
- Data is fetched **on demand**: h5web requests only entity metadata to build the
  tree and streams only the slice you actually view, so nothing is bulk-downloaded
  up front.

Implementation lives in `src/features/h5/`, backed by the `@photonic/tiled-client-h5web`
package. See [`docs/h5web-integration.md`](docs/h5web-integration.md) for a full walkthrough
of how the client drives h5web through the Tiled API.

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Connect screen (if no server selected) or redirect to `/browse` |
| `/connect` | Pick/add a Tiled server to connect to |
| `/browse/*` | Node browser/explorer (container listing + navigation); container-scoped search filters; HDF5 containers offer a "View with H5Web" button |
| `/node/*` | Node detail (per-family views in tabs: View/Download/Metadata/Live); container view offers search filters |
| `/login` | Sign in (internal password or OIDC redirect) |
| `/auth-callback` | OAuth2/OIDC token callback |

## Servers & authentication

The client is a multi-server tool. On first launch (with no saved server) it shows
the connect screen at `/`; you can switch servers anytime from the header dropdown.

- Pre-seeded servers: **Local demo** (`http://localhost:8000/api/v1`), **NSLS-II demo**
  (`https://tiled-demo.nsls2.bnl.gov/api/v1`), and **DESY** (`https://tiled.desy.de/api/v1`).
- Add a server by name, base URL, and optional API key; the list and the active
  choice persist in `localStorage` (`tiled_servers`, `tiled_active_server_id`).
- The env vars `VITE_TILED_API_URL` / `VITE_TILED_API_KEY` bootstrap a configured
  server on first launch.
- Switching servers re-scopes authentication: tokens are stored per server
  (`tiled_access_token:<host>`, etc.) so credentials never leak between servers.
  Data requests prefer the bearer session token when present, else the API key.
- Auth support: API keys (single-user) and OAuth2 password/OIDC sessions with token
  refresh (see `src/auth/` and `src/lib/`).

## Architecture

```
src/
├─ auth/         # token manager + auth provider/context (per-server isolation)
├─ config/       # ServerProvider + server list/active-state + TiledApiClient per server + TiledConfig + proxy resolution
├─ hooks/        # react-query hooks (search, metadata, array, table, stream)
├─ components/   # shadcn/ui + layout + common + finch components
├─ features/     # browse, node (family views), search, download, stream, metadata, auth, h5 (h5web explorer)
├─ lib/          # cn() helper, Plotly wrapper, Tiled capability-gap helpers (device-code OAuth, stream URLs, download URLs)
└─ utils/        # link/path helpers
```

Notes:

- The "talk to Tiled" layer is the official **`@blueskyproject/tiled`** SDK's
  `TiledApiClient`, instantiated per server (`src/config/useTiledClient.ts`). SDK
  gaps are handled by small pure-function modules under `src/lib/`.
- Sparse/Awkward/Ragged nodes currently render read-only structure info with a
  placeholder; full block/buffer renderers are future work.
- Contour/Surface array visualizations are temporarily disabled pending a fix to
  the underlying plotly `z` handling (see `src/features/array/ArrayVisualizations.tsx`).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Preview the production build |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:fix` | Prettier |
| `npm run test` / `test:run` | vitest (watch / run once) |
| `npm run storybook` | Storybook dev server |
| `npm run build-storybook` | Static Storybook build |
