import type { AboutAuthenticationProvider, UserIdentity } from '@tiled/client-core';

export interface AuthState {
  /** Whether the server advertises that authentication is required. */
  authRequired: boolean;
  /** Discovery from GET / — null before loaded. */
  providers: AboutAuthenticationProvider[];
  /** Whether we have a usable session. */
  isAuthenticated: boolean;
  /** Whether the initial auth probe/refresh has completed. */
  initialized: boolean;
  identity: UserIdentity | null;
  loginError: string | null;
  onLogin: (payload: unknown) => Promise<void>;
  onLogout: () => void;
}
