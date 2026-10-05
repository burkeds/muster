import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { TiledApiClient, type TiledAuthProvider } from '@blueskyproject/tiled';
// TiledApiClient has no public refresh method — only a private doTokenRefresh
// used by its 401 interceptor. refreshSession is a local pure function (ported
// from the now-archived @tiled/client-core) that does not depend on TiledApiClient.
import { refreshSession } from '@/lib/refreshSession';
import {
  tokenManager,
  isTokenExpired,
  scopeTokens,
  scopeForServer,
  syncSdkTokenStore,
} from './token-manager';
import { useOptionalTiledClient } from '@/config/useTiledClient';
import { useServersOptional } from '@/config/ServerProvider';
import type { AuthState, UserIdentity } from './types';

const AuthContext = createContext<AuthState | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  /** Called after a successful login (e.g. to navigate). */
  onAuthenticated?: () => void;
}

/**
 * Push the current access token onto the active TiledApiClient.
 * TiledApiClient has no getBearerToken callback — tokens must be set imperatively.
 */
function applyBearerToken(client: TiledApiClient | null, accessToken: string | null) {
  client?.setBearerToken(accessToken);
}

export function AuthProvider({ children, onAuthenticated }: AuthProviderProps) {
  const client = useOptionalTiledClient();
  const active = useServersOptional();
  const navigate = useNavigate();
  const hasServer = !!active?.activeServer;
  const [authRequired, setAuthRequired] = useState(false);
  const [providers, setProviders] = useState<AuthState['providers']>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(!hasServer);
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Discovery + restore session on mount / server change.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!hasServer || !client) {
        applyBearerToken(client, null);
        syncSdkTokenStore(null, null);
        setAuthRequired(false);
        setLoggedOut();
        if (!cancelled) setInitialized(true);
        return;
      }
      // Scope the local token store to this server (hostname:port).
      scopeTokens(scopeForServer(client.getBaseUrl()));
      try {
        const info = await client.getServerInfo();
        if (cancelled) return;
        const auth = info?.authentication;
        setAuthRequired(auth?.required ?? (auth?.providers?.length ?? 0) > 0);
        setProviders(auth?.providers ?? []);

        const { accessToken, refreshToken, identity: saved } = tokenManager.hydrate();
        setIdentity(saved);
        if (accessToken && !isTokenExpired(accessToken)) {
          applyBearerToken(client, accessToken);
          // Keep SDK global keys in sync so the private 401 interceptor can refresh.
          syncSdkTokenStore(accessToken, refreshToken);
          setIsAuthenticated(true);
        } else if (refreshToken) {
          try {
            // No public refresh on TiledApiClient — use standalone pure function.
            const tokens = await refreshSession({
              base: client.getBaseUrl(),
              refreshToken,
            });
            tokenManager.saveTokens(tokens.access_token, tokens.refresh_token);
            applyBearerToken(client, tokens.access_token);
            setIsAuthenticated(true);
          } catch {
            tokenManager.clear();
            applyBearerToken(client, null);
          }
        } else {
          applyBearerToken(client, null);
          syncSdkTokenStore(null, null);
        }
      } catch {
        if (cancelled) return;
        setAuthRequired(false);
        applyBearerToken(client, null);
        setLoggedOut();
      } finally {
        if (!cancelled) setInitialized(true);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [hasServer, client]);

  function setLoggedOut() {
    setIsAuthenticated(false);
    setIdentity(null);
  }

  const handleLogin = useCallback(
    async (payload: unknown) => {
      setLoginError(null);
      const tokens = payload as {
        access_token: string;
        refresh_token: string;
        identity?: UserIdentity;
      };
      if (tokens.access_token && tokens.refresh_token) {
        tokenManager.saveTokens(tokens.access_token, tokens.refresh_token);
        applyBearerToken(client, tokens.access_token);
        setIsAuthenticated(true);
      }
      if (tokens.identity) {
        tokenManager.saveIdentity(tokens.identity);
        setIdentity(tokens.identity);
      }
      onAuthenticated?.();
    },
    [onAuthenticated, client],
  );

  const handleLogout = useCallback(() => {
    tokenManager.clear();
    applyBearerToken(client, null);
    setLoggedOut();
  }, [client]);

  // Complete login initiated in a new-tab OIDC flow: the popup posted the
  // tokens back to this (opener) tab before closing.
  const popupHandled = useRef(false);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as
        | {
            type?: string;
            access_token?: string;
            refresh_token?: string;
            identity?: UserIdentity;
            target?: string;
          }
        | undefined;
      if (!data || data.type !== 'tiled-auth-complete') return;
      if (!data.access_token || !data.refresh_token) return;
      if (popupHandled.current) return;
      popupHandled.current = true;
      void handleLogin({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        identity: data.identity,
      });
      const target = data.target && data.target.startsWith('/') ? data.target : '/browse';
      navigate(target, { replace: true });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handleLogin, navigate]);

  const value: AuthState = {
    authRequired,
    providers,
    isAuthenticated,
    initialized,
    identity,
    loginError,
    onLogin: handleLogin,
    onLogout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Convenience: perform an internal-provider password login.
 * Signature preserved for out-of-scope callers — constructs a short-lived
 * TiledApiClient bound to `base` and uses loginWithUsernamePassword.
 */
export async function authLoginPassword(
  base: string,
  providerEndpoint: string,
  username: string,
  password: string,
) {
  const client = new TiledApiClient({ baseUrl: base });
  const provider: TiledAuthProvider = {
    provider: 'internal',
    mode: 'internal',
    links: { auth_endpoint: providerEndpoint },
    confirmation_message: '',
  };
  const tokens = await client.loginWithUsernamePassword(username, password, base, provider);
  if (!tokens) {
    throw new Error('Login failed');
  }
  // loginWithUsernamePassword already wrote SDK global keys + setBearerToken on
  // this ephemeral client; callers still need to pass tokens through onLogin so
  // the live context client and scoped tokenManager pick them up.
  return tokens;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export function useAuthOptional(): AuthState | null {
  return useContext(AuthContext);
}

export function useBearerToken(): string | null {
  const state = useAuthOptional();
  return state?.isAuthenticated ? tokenManager.getAccessToken() : null;
}

export { tokenManager, isTokenExpired };
