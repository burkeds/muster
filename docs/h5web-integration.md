# How the client integrates h5web with the Tiled API

This document explains how Muster (a Tiled web client) embeds the
[h5web](https://github.com/silx-kit/h5web) HDF5 explorer (`@h5web/app`) and drives it
entirely through the Tiled HTTP API — no direct filesystem or HDF5 access.

> **Modular note:** the H5Web bridge lives in the `@tiled/client-h5web` plugin
> (`tiled-client-h5web/`, a git submodule / npm workspace package), built on the
> `@tiled/client-core` plugin. The app only keeps thin wiring in
> `src/features/h5/`. See the README's "Modular structure" section.

## Concepts

### Tiled serves HDF5 as ordinary nodes

Tiled indexes the *contents* of an HDF5 file into its normal node tree:

- an HDF5 **group** becomes a Tiled **`container`** node (children listed via
  `GET /search/{path}`);
- an HDF5 **dataset** becomes a Tiled **`array`** node (data read via
  `GET /array/full/{path}?slice=...`);
- the whole file is additionally advertised with the `application/x-hdf5`
  media type, which Tiled reports when you query the node with
  `?include_data_sources=true` (see `supportsHdf5` in `@tiled/client-h5web`).

So from the client's point of view, "viewing an HDF5 file" is just "browsing a
sub-tree of container/array nodes" using endpoints the client already knows.

### h5web's extension point: `DataProviderApi`

h5web's `<App />` is data-source-agnostic. It talks to a **data provider** that
implements the abstract `DataProviderApi` class from `@h5web/app`:

```ts
abstract class DataProviderApi {
  readonly filepath: string;
  constructor(filepath: string);

  abstract getEntity(path: string): Promise<ProvidedEntity>;          // tree metadata
  abstract getValue(
    params: ValuesStoreParams,   // { dataset, selection? }
    abortSignal?, onProgress?,
  ): Promise<unknown>;                                               // dataset values
  abstract getAttrValues(entity: Entity): Promise<AttributeValues>;   // attributes
  getExportURL?;
  getSearchablePaths?;
}
```

`@h5web/app` ships providers for H5Grove and HSDS; this client implements its own
`TiledH5Api` that backs that same interface with Tiled REST calls.

## Component flow

```
BrowsePage / NodeDetailPage
   │  (container listing, requests ?include_data_sources=true)
   ▼
supportsHdf5(metadata) ── true? ──► H5ViewLauncher ("View with H5Web" button)
                                        │  (lazy React.lazy import)
                                        ▼
                                   H5ExploreView
                                        │
                                        ▼
                                   TiledH5Provider  (DataProvider context)
                                        │
                                        ▼
                                   h5web <App /> ⇄ TiledH5Api  (DataProviderApi)
                                                   │
                                                   ▼
                                         Tiled REST API (/search, /array/full, /metadata)
```

### 1. Detection: `supportsHdf5` (`@tiled/client-h5web`)

Decides whether a node offers HDF5 and should show the "View with H5Web" button:

- any of the node's `data_sources` has `mimetype === 'application/x-hdf5'`, **or**
- the node is a `container` whose name ends in `.h5` / `.hdf5` / `.hdf` / `.nxs`.

Because Tiled only populates `data_sources` when asked, both `BrowsePage` and
`NodeDetailPage` fetch the node's metadata with `includeDataSources: true` and
`fields` containing `structure`/`data_sources`.

### 2. Launcher: `H5ViewLauncher` (`src/features/h5/H5ViewLauncher.tsx` — app shell)

Keeps normal content (the child listing) as the default. When `enabled`, renders
a "View with H5Web" button that swaps the content **in place** for the explorer:

- h5web (three.js and friends) is **lazy-loaded** via `React.lazy`, so nothing is
  downloaded until the user clicks the button.
- "Back to list" flips the same state back to the normal listing.
- A `Suspense` fallback shows a loading state during the lazy chunk fetch.

### 3. Provider wiring: `TiledH5Provider` (`@tiled/client-h5web`)

Creates a single `TiledH5Api` instance (memoized on base URL + credentials + root
path) and mounts h5web's `<DataProvider api={api}>` context. `H5ExploreView`
(`src/features/h5/H5ExploreView.tsx`) injects the active client and renders `<App initialPath="/" />` inside it.

Credentials (`apiKey` / `bearerToken`) come from the same auth plumbing the rest of
the app uses (`useRequestAuth`), so proxies, API keys, and OIDC sessions all work.

### 4. The bridge: `TiledH5Api` (`@tiled/client-h5web`)

Implements the three abstract methods. The root node path (`filepath`, e.g.
`/myfile.h5`) is prefixed to every h5web path to form Tiled node segments:

| h5web call | Tiled endpoint | Purpose |
| --- | --- | --- |
| `getEntity(path)` | `GET /search/{root + path}?fields=...&page[limit]=300` | list a group's children |
| `getValue({dataset, selection})` | `GET /array/full/{root + path}?slice={selection}&format=...` | read dataset slice |
| `getAttrValues(entity)` | `GET /metadata/{root + path}?fields=metadata` | node metadata as attributes |

**Path mapping** — `toSegments(path)` joins the root node with the h5web path:
h5web `/group/dataset` under root `myfile.h5` becomes Tiled segments
`['myfile.h5', 'group', 'dataset']`.

**`getEntity`** calls the shared `search()` request helper (same one the browser
uses), asking for `fields=['structure_family','structure','specs']` with a large
page limit (300). Every returned child is mapped with `mapChildResource`
(`@tiled/client-h5web/src/mapEntity.ts`):

- `structure_family === 'container'` → h5web `EntityKind.Group`
- `structure_family === 'array'` → h5web `EntityKind.Dataset` with `shape` from
  `ArrayStructure.shape` and `type` from `ArrayStructure.data_type`
- anything else → `EntityKind.Unresolved` (rendered as a placeholder leaf)

**`getValue`** chooses the payload format by dtype:

- Numeric dtypes that have a native binary form (`isBinarySize`: float32/64, and
  8/16/32/64-bit ints) request `format=application/octet-stream` and decode the
  raw C-order bytes into a `TypedArray` with `decodeBuffer` (handles endianness and
  64-bit ints as `BigInt`/`BigUint64Array`).
- Complex, string, boolean, structured and unknown dtypes request
  `format=application/json` and return the parsed JSON directly.
- Scalar datasets are unwrapped to their single value (`array[0]`).
- The h5web `selection` (numpy-style, e.g. `0:1`) is forwarded verbatim as the
  Tiled `?slice=` parameter, so only the viewed slice is ever downloaded.

**`getAttrValues`** runs `GET /metadata/...?fields=metadata` and returns the node's
`metadata` object as the attribute map; failures fail soft (empty attributes) so the
explorer still works if metadata is missing or unreadable.

**DType translation** — `mapDataType` (`@tiled/client-h5web/src/mapDType.ts`) converts
Tiled's numpy `__array_interface__` style `data_type` (`kind`, `itemsize`,
`endianness`, optional `fields`) into h5web `DType` objects: float/int/uint, bool,
complex, time, fixed-length ASCII/UTF-8 strings, and compound/structured types with
a field map.

## Request URLs actually issued

For a root node `myfile.h5`, base `https://host/api/v1`:

```
# Expand a group
GET /search/myfile.h5?fields=structure_family&fields=structure&fields=specs&page[limit]=300

# Read one dataset slice as raw binary (numeric)
GET /array/full/myfile.h5/group/data?slice=0:1&format=application/octet-stream

# Read one dataset as JSON (complex/string/structured/unknown)
GET /array/full/myfile.h5/group/data?slice=0:1&format=application/json

# Node metadata (shown as the dataset's attributes)
GET /metadata/myfile.h5/group/data?fields=metadata
```

These all reuse the typed API layer in `@tiled/client-core` (auth headers, proxy
awareness, error normalization), so `TiledH5Api` stays a thin adapter.

## Key files

The H5Web bridge lives in the `@tiled/client-h5web` plugin (`tiled-client-h5web/`),
consumed by the app as a git submodule / npm workspace package. The app only keeps
thin wiring under `src/features/h5/` (`H5ViewLauncher` + the `H5ExploreView` adapter
that supplies the active client from context).

| File (location) | Role |
| --- | --- |
| `tiled-client-h5web/src/supportsHdf5.ts` | HDF5 detection (`application/x-hdf5` or `.h5`-like container name) |
| `src/features/h5/H5ViewLauncher.tsx` | App-shell lazy "View with H5Web" toggle around normal content |
| `src/features/h5/H5ExploreView.tsx` | App adapter: injects the active client into the plugin's `H5Explorer` |
| `tiled-client-h5web/src/H5Explorer.tsx` | Self-contained h5web `<App/>` over the Tiled client |
| `tiled-client-h5web/src/TiledH5Provider.tsx` | Wires `TiledH5Api` into h5web's `DataProvider` context |
| `tiled-client-h5web/src/TiledH5Api.ts` | `DataProviderApi` implementation over a `TiledClientLike` |
| `tiled-client-h5web/src/mapEntity.ts` | Tiled resource → h5web entity (`container`→Group, `array`→Dataset) |
| `tiled-client-h5web/src/mapDType.ts` | Tiled numpy `data_type` → h5web `DType` |
| `tiled-client-core/src/requests.ts` | `search`, `arrayFullUrl`, `buildResourceUrl` helpers used above |

## Design notes / trade-offs

- **On-demand fetching.** Only entity metadata is fetched to build the tree; dataset
  slices are streamed only when the user actually views them. Nothing is
  bulk-downloaded up front.
- **Deliberately lazy JS.** The h5web bundle is code-split so non-HDF5 pages stay
  light.
- **One root, h5web paths as suffixes.** The whole HDF5 hierarchy lives under a
  single Tiled node (`filepath`); h5web paths are suffixes of it. This is what lets
  `getEntity`/`getValue` be implemented with plain `search`/`array/full` calls.
- **Binary fast path + JSON fallback.** Numeric arrays use raw octet-stream bytes
  (decoded client-side) for efficiency; everything else falls back to Tiled's JSON
  encoding.
- **Credentials/proxying inherited.** The provider uses the app-wide auth and base-
  URL resolution, so remote servers reached through the dev proxy work unchanged.
