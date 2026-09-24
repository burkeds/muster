import type { Plugin } from 'vite';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import * as net from 'node:net';
import * as tls from 'node:tls';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Vite dev plugin: same-origin proxy for arbitrary remote Tiled hosts.
 *
 * Requests to `/tiled/<host>/<rest>` are forwarded to `https://<host>/<rest>`
 * (or `http://` for loopback/insecure hosts), including WebSocket upgrades for
 * `/stream`. This lets the browser reach remote Tiled servers without CORS
 * during development. Production uses the equivalent reverse-proxy mapping
 * (see README).
 *
 * <host> may include a port. A hostname-shape guard rejects anything that is
 * not a plain host[:port] to reduce SSRF surface.
 */

const MOUNT = '/tiled';

function parseHost(raw: string): { host: string; port?: string; insecure?: boolean } | null {
  const s = raw.trim();
  if (!s || s.length > 253 || /[^a-zA-Z0-9._:\-\[\]]/.test(s)) return null;
  let host = s;
  let port: string | undefined;
  if (s.startsWith('[')) {
    const close = s.indexOf(']');
    if (close < 0) return null;
    host = s.slice(0, close + 1);
    const rest = s.slice(close + 1);
    if (rest.startsWith(':')) port = rest.slice(1);
    else if (rest) return null;
  } else {
    const parts = s.split(':');
    if (parts.length > 2) return null;
    if (parts.length === 2) {
      host = parts[0];
      port = parts[1];
      if (!/^\d+$/.test(port)) return null;
    }
  }
  if (!host) return null;
  const hostOnly = host.replace(/^\[|\]$/g, '');
  const insecure =
    hostOnly === 'localhost' ||
    hostOnly === '127.0.0.1' ||
    hostOnly === '::1' ||
    hostOnly.startsWith('10.') ||
    hostOnly.startsWith('192.168.') ||
    hostOnly.startsWith('172.') ||
    hostOnly.startsWith('169.254.');
  return { host: hostOnly, port, insecure };
}

function matchTiledPath(pathname: string): { hostSpec: string; rest: string } | null {
  if (!pathname.startsWith(MOUNT + '/')) return null;
  const after = pathname.slice(MOUNT.length + 1);
  const slash = after.indexOf('/');
  const hostSpec = slash < 0 ? after : after.slice(0, slash);
  const rest = slash < 0 ? '/' : after.slice(slash);
  if (!hostSpec) return null;
  return { hostSpec, rest };
}

function toPort(parsed: { port?: string; insecure?: boolean }): number {
  if (parsed.port) return Number(parsed.port);
  return parsed.insecure ? 80 : 443;
}

/**
 * Rewrite a Location header on a redirect so the browser follows it back through
 * the same proxy path instead of crossing to the upstream origin directly
 * (which the browser would reject without CORS). Only rewrites when the target
 * host matches the host being proxied, leaving unrelated redirects untouched.
 */
function rewriteLocation(location: string, parsed: { host: string; port?: string }): string {
  let next: URL;
  try {
    next = new URL(location);
  } catch {
    return location;
  }
  const canonical = next.port ? next.hostname : next.hostname;
  if (canonical !== parsed.host) return location;
  const hostPart = next.port ? `${next.hostname}:${next.port}` : next.hostname;
  return `${MOUNT}/${hostPart}${next.pathname}${next.search}`;
}

function forwardHttp(
  req: IncomingMessage,
  res: ServerResponse,
  parsed: { host: string; port?: string; insecure?: boolean },
  targetUrl: string,
) {
  const headers: Record<string, string | string[] | undefined> = { ...req.headers };
  headers.host = parsed.port ? `${parsed.host}:${parsed.port}` : parsed.host;
  const sender = parsed.insecure ? httpRequest : httpsRequest;
  const proxyReq = sender(
    {
      method: req.method ?? 'GET',
      host: parsed.host,
      port: toPort(parsed),
      path: targetUrl,
      headers,
    },
    (upstream) => {
      const headers = { ...upstream.headers };
      if (
        upstream.statusCode &&
        upstream.statusCode >= 300 &&
        upstream.statusCode < 400 &&
        headers.location
      ) {
        headers.location = rewriteLocation(String(headers.location), parsed);
      }
      res.writeHead(upstream.statusCode ?? 502, headers);
      upstream.pipe(res);
    },
  );
  proxyReq.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[tiled-proxy] upstream error:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'content-type': 'text/plain' });
      res.end('Bad Gateway: could not reach the upstream Tiled host');
    } else {
      res.destroy();
    }
  });
  req.pipe(proxyReq);
}

/** Raw-socket WebSocket forward: relay the Upgrade request, then pipe bytes. */
function forwardWs(
  req: IncomingMessage,
  socket: net.Socket,
  head: Buffer,
  parsed: { host: string; port?: string; insecure?: boolean },
  targetUrl: string,
) {
  const isSecure = !parsed.insecure;
  const upstream = isSecure
    ? tls.connect({ host: parsed.host, port: toPort(parsed), servername: parsed.host })
    : net.connect({ host: parsed.host, port: toPort(parsed) });
  upstream.on('connect', () => {
    const lines = [`${req.method ?? 'GET'} ${targetUrl} HTTP/1.1`];
    const skip = new Set(['host', 'connection', 'upgrade', 'transfer-encoding']);
    for (const [k, v] of Object.entries(req.headers)) {
      if (skip.has(k.toLowerCase()) || v === undefined) continue;
      lines.push(`${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
    }
    lines.push(
      `Host: ${parsed.host}${parsed.port ? `:${parsed.port}` : ''}`,
      'Connection: Upgrade',
      'Upgrade: websocket',
    );
    upstream.write(lines.join('\r\n') + '\r\n\r\n');
    if (head.length) upstream.write(head);
    socket.pipe(upstream);
    upstream.pipe(socket);
  });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
  socket.on('close', () => upstream.destroy());
}

function handleTiledRequest(
  req: IncomingMessage,
  res: ServerResponse,
  url: string,
  opt: { ws?: { socket: net.Socket; head: Buffer } },
) {
  const pathname = url.split('?')[0] ?? '';
  const match = matchTiledPath(pathname);
  if (!match) return false;
  const parsed = parseHost(match.hostSpec);
  if (!parsed) {
    res.writeHead(400, { 'content-type': 'text/plain' });
    res.end('Bad Request: invalid host in proxy path');
    return true;
  }
  const query = url.includes('?') ? url.slice(url.indexOf('?')) : '';
  const targetUrl = match.rest + query;
  if (opt.ws) {
    forwardWs(req, opt.ws.socket, opt.ws.head, parsed, targetUrl);
  } else {
    forwardHttp(req, res, parsed, targetUrl);
  }
  return true;
}

export function tiledProxy(): Plugin {
  return {
    name: 'tiled-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        try {
          if (!handleTiledRequest(req as IncomingMessage, res, req.url ?? '', {})) next();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[tiled-proxy] error:', err);
          res.writeHead(500, { 'content-type': 'text/plain' });
          res.end('Internal proxy error');
        }
      });
      server.httpServer?.on('upgrade', (req, socket, head) => {
        try {
          handleTiledRequest(
            req as IncomingMessage,
            {} as ServerResponse,
            req.url ?? '',
            { ws: { socket: socket as net.Socket, head: Buffer.from(head) } },
          );
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[tiled-proxy] ws error:', err);
          socket.destroy();
        }
      });
    },
  };
}
