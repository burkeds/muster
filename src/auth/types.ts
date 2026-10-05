import type { TiledAuthProvider } from '@blueskyproject/tiled';

/**
 * Local identity shape (previously imported from `@tiled/client-core`).
 * The Bluesky SDK does not export an equivalent public type.
 */
export interface UserIdentity {
  id: string;
  provider?: string;
  internal?: string;
  roles?: string[];
}

export interface AuthState {
  /** Whether the server advertises that authentication is required. */
  authRequired: boolean;
  /** Discovery from GET / — empty before loaded. */
  providers: TiledAuthProvider[];
  /** Whether we have a usable session. */
  isAuthenticated: boolean;
  /** Whether the initial auth probe/refresh has completed. */
  initialized: boolean;
  identity: UserIdentity | null;
  loginError: string | null;
  onLogin: (payload: unknown) => Promise<void>;
  onLogout: () => void;
}
