import type { TiledAuthProvider } from '@blueskyproject/tiled';

/** Tokens returned by password / device-code OAuth flows. */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  token_type?: string;
}

/** Device-code flow: response from POST /auth/provider/{name}/authorize. */
export interface DeviceCodeResponse {
  authorization_uri: string;
  verification_uri: string;
  interval: number;
  expires_in: number;
  device_code: string;
  user_code: string;
}

/** Sub-classified device-code failure so the UI can distinguish "keep polling". */
export class DeviceCodeError extends Error {
  kind: 'pending' | 'expired' | 'denied' | 'error';
  constructor(kind: DeviceCodeError['kind'], message: string) {
    super(message);
    this.name = 'DeviceCodeError';
    this.kind = kind;
  }
}

export interface StartDeviceCodeArgs {
  provider: TiledAuthProvider;
  /** Rewrite server-reported absolute URLs through the same-origin proxy. */
  rewrite?: (url: string) => string;
}

/**
 * POST the provider's auth_endpoint to begin a Tiled device-code login. Returns
 * the Keycloak authorization_uri (to open in a new tab) and the verification
 * endpoint + device code to poll. Only verification_uri is rewritten to
 * same-origin; authorization_uri stays cross-origin for the browser tab.
 */
export async function startDeviceCodeAuth(
  args: StartDeviceCodeArgs,
): Promise<DeviceCodeResponse> {
  const endpoint = args.provider.links?.auth_endpoint;
  if (!endpoint) throw new Error('Provider has no auth_endpoint');
  const res = await fetch(endpoint, { method: 'POST' });
  if (!res.ok) throw new Error(`Cannot start device login (${res.status})`);
  const data = (await res.json()) as DeviceCodeResponse;
  const rewrite = args.rewrite ?? ((url: string) => url);
  return { ...data, verification_uri: rewrite(data.verification_uri) };
}

const DEVICE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';

export interface PollDeviceCodeArgs {
  /** Same-origin (proxied) verification endpoint. */
  verificationUri: string;
  deviceCode: string;
}

/**
 * Poll the verification endpoint for the device-code tokens. Throws
 * DeviceCodeError with kind 'pending' while the user has not yet authorized.
 */
export async function pollDeviceCodeToken(args: PollDeviceCodeArgs): Promise<AuthTokens> {
  const res = await fetch(args.verificationUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_code: args.deviceCode, grant_type: DEVICE_GRANT }),
  });
  if (res.status === 400) {
    const body = (await res.json().catch(() => null)) as { detail?: { error?: string } } | null;
    const error = body?.detail?.error;
    if (error === 'authorization_pending') {
      throw new DeviceCodeError('pending', 'Waiting for authorization');
    }
    if (error === 'access_denied') {
      throw new DeviceCodeError('denied', 'Login was denied');
    }
    throw new DeviceCodeError('error', `Device login failed (${error ?? res.status})`);
  }
  if (res.status === 404) {
    throw new DeviceCodeError('expired', 'Device code expired or invalid');
  }
  if (!res.ok) {
    throw new DeviceCodeError('error', `Device login failed (${res.status})`);
  }
  return (await res.json()) as AuthTokens;
}
