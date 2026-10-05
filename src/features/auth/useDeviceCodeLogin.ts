import { useCallback, useEffect, useRef, useState } from 'react';
import type { TiledApiClient, TiledAuthProvider } from '@blueskyproject/tiled';
import {
  DeviceCodeError,
  pollDeviceCodeToken,
  startDeviceCodeAuth,
  type AuthTokens,
  type DeviceCodeResponse,
} from '@/lib/deviceCodeAuth';
import { useOptionalTiledConfig } from '@/config/TiledConfigProvider';

export interface DeviceLoginState {
  /** Active device-code request, or null when idle/complete/errored. */
  device: DeviceCodeResponse | null;
  /** True while polling / awaiting user authorization. */
  waiting: boolean;
  /** Human-readable error, or null. */
  error: string | null;
}

const initialState: DeviceLoginState = { device: null, waiting: false, error: null };

/**
 * OAuth device-code login for external providers (e.g. Keycloak/DESY). Begins
 * a Tiled device flow, opens the Keycloak authorization URI in a new tab, and
 * polls the verification endpoint until the user authorizes, then hands the
 * tokens to `onSuccess`.
 *
 * Uses local pure helpers (SDK has no device-code support). Optional
 * `linkRewrite` from TiledConfig rewrites the verification URI through the
 * same-origin proxy.
 */
export function useDeviceCodeLogin(
  client: TiledApiClient | null,
  onSuccess: (tokens: AuthTokens) => void,
) {
  const config = useOptionalTiledConfig();
  const [state, setState] = useState<DeviceLoginState>(initialState);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const polling = useRef(false);
  const clientRef = useRef(client);
  clientRef.current = client;
  const rewriteRef = useRef(config?.linkRewrite);
  rewriteRef.current = config?.linkRewrite;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const settle = useCallback(
    (patch: Partial<DeviceLoginState>) => {
      polling.current = false;
      clearTimers();
      setState((s) => ({ ...s, ...patch }));
    },
    [clearTimers],
  );

  const poll = useCallback(
    async (device: DeviceCodeResponse) => {
      if (polling.current) return;
      polling.current = true;
      const deadline = Date.now() + device.expires_in * 1000;
      const tick = async () => {
        if (Date.now() > deadline) {
          settle({ waiting: false, error: 'Device login timed out. Try again.', device: null });
          return;
        }
        try {
          const tokens = await pollDeviceCodeToken({
            verificationUri: device.verification_uri,
            deviceCode: device.device_code,
          });
          settle({ waiting: false, error: null, device: null });
          onSuccessRef.current(tokens);
        } catch (err) {
          if (err instanceof DeviceCodeError && err.kind === 'pending') {
            const t = setTimeout(tick, Math.max(device.interval, 1) * 1000);
            timers.current.push(t);
          } else {
            settle({
              waiting: false,
              error: err instanceof DeviceCodeError ? err.message : 'Device login failed',
              device: null,
            });
          }
        }
      };
      void tick();
    },
    [settle],
  );

  const start = useCallback(
    async (provider: TiledAuthProvider) => {
      clearTimers();
      polling.current = false;
      setState({ device: null, waiting: true, error: null });
      try {
        if (!clientRef.current) throw new Error('No Tiled client available');
        const device = await startDeviceCodeAuth({
          provider,
          rewrite: rewriteRef.current,
        });
        setState({ device, waiting: true, error: null });
        // Open Keycloak in a new tab for the user to log in.
        window.open(device.authorization_uri, '_blank');
        void poll(device);
      } catch (err) {
        setState({
          device: null,
          waiting: false,
          error: err instanceof Error ? err.message : 'Cannot start device login',
        });
      }
    },
    [clearTimers, poll],
  );

  const clear = useCallback(() => {
    clearTimers();
    polling.current = false;
    setState(initialState);
  }, [clearTimers]);

  return { ...state, start, clear, setError: (e: string) => setState((s) => ({ ...s, error: e })) };
}
