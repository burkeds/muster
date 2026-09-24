import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithPassword } from '@tiled/client-core';
import { tokenManager, isTokenExpired, scopeTokens, scopeForServer } from './token-manager';
import { useOptionalTiledClient } from '@/config/useTiledClient';
import { useServersOptional } from '@/config/ServerProvider';
import type { UserIdentity } from '@tiled/client-core';
import type { AuthState } from './types';

const AuthContext = createContext<AuthState | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  /** Called after a successful login (e.g. to navigate). */
  onAuthenticated?: () => void;
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
        setAuthRequired(false);
        setLoggedOut();
        if (!cancelled) setInitialized(true);
        return;
      }
      scopeTokens(scopeForServer(client.baseUrl));
      try {
        const info = await client.about();
        if (cancelled) return;
        setAuthRequired(
          info.authentication?.required ?? (info.authentication?.providers?.length ?? 0) > 0,
        );
        setProviders(info.authentication?.providers ?? []);

        const { accessToken, refreshToken, identity: saved } = tokenManager.hydrate();
        setIdentity(saved);
        if (accessToken && !isTokenExpired(accessToken)) {
          setIsAuthenticated(true);
        } else if (refreshToken) {
          try {
            const tokens = await client.refresh(refreshToken);
            tokenManager.saveTokens(tokens.access_token, tokens.refresh_token);
            setIsAuthenticated(true);
          } catch {
            tokenManager.clear();
          }
        }
      } catch {
        if (cancelled) return;
        setAuthRequired(false);
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

  const handleLogin = useMemo(
    () => async (payload: unknown) => {
      setLoginError(null);
      const tokens = payload as {
        access_token: string;
        refresh_token: string;
        identity?: UserIdentity;
      };
      if (tokens.access_token && tokens.refresh_token) {
        tokenManager.saveTokens(tokens.access_token, tokens.refresh_token);
        setIsAuthenticated(true);
      }
      if (tokens.identity) {
        tokenManager.saveIdentity(tokens.identity);
        setIdentity(tokens.identity);
      }
      onAuthenticated?.();
    },
    [onAuthenticated],
  );

  const handleLogout = useMemo(
    () => () => {
      tokenManager.clear();
      setLoggedOut();
    },
    [],
  );

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

/** Convenience: perform an internal-provider password login. */
export async function authLoginPassword(
  base: string,
  providerEndpoint: string,
  username: string,
  password: string,
) {
  return loginWithPassword({
    base,
    provider: {
      provider: 'internal',
      mode: 'internal',
      links: { auth_endpoint: providerEndpoint },
    },
    username,
    password,
  });
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
