import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/auth-provider';
import { buildCallbackPayload, parseAuthCallbackParams } from '@/auth/oauth';
import { StateMessage } from '@/components/common/StateMessage';

/**
 * OAuth2/OIDC callback route. Always completes login in this window (so it is
 * never left on a loading screen), notifies the opening tab so it authenticates
 * too, and then best-effort closes a popup. When reached directly it simply
 * completes in-tab and routes onwards.
 */
export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { onLogin, onLogout } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const payload = buildCallbackPayload(parseAuthCallbackParams(searchParams.toString()));
    if (!payload) {
      onLogout();
      navigate('/login', { replace: true });
      return;
    }

    // Always complete in this window so the page never gets stuck.
    void onLogin(payload);

    // Let the opening tab (new-tab login) know too.
    window.opener?.postMessage({ type: 'tiled-auth-complete', ...payload }, '*');

    navigate(payload.target, { replace: true });

    // Best-effort close for the popup case; if the browser blocks it, this tab
    // is already authenticated and on the target route, so no failure state.
    if (window.opener) {
      window.setTimeout(() => window.close(), 100);
    }
  }, [searchParams, navigate, onLogin, onLogout]);

  return <StateMessage kind="loading" title="Completing sign-in…" />;
}
