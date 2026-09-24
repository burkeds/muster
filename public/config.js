// Runtime configuration for the Tiled web client.
//
// This file is served as-is in the built app and is OVERWRITTEN at container
// start by the Docker entrypoint (docker-entrypoint.sh) with the values of the
// TILED_API_URL / TILED_API_KEY environment variables. In local development it
// is a no-op, so the app falls back to the build-time VITE_* environment
// variables.
window.__TILED_CONFIG__ = {};
