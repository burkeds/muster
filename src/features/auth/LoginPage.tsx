import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TiledAuthProvider } from '@blueskyproject/tiled';
import { useAuth } from '@/auth/auth-provider';
import { useOptionalTiledClient } from '@/config/useTiledClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusLine } from '@/components/common/StatusLine';
import { ExternalLink } from 'lucide-react';
import { useDeviceCodeLogin } from './useDeviceCodeLogin';

/** Internal-provider login form + OIDC device-code login for external providers. */
export function LoginPage() {
  const { providers, authRequired, onLogin } = useAuth();
  const client = useOptionalTiledClient();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const internalProvider = providers.find((p) => p.mode === 'internal' || p.mode === 'password');
  const externalProviders = providers.filter((p) => p.mode === 'external');

  const device = useDeviceCodeLogin(client, (tokens) => {
    void onLogin(tokens);
    navigate('/browse', { replace: true });
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!client || !internalProvider) return;
    setBusy(true);
    setError(null);
    try {
      const tokens = await client.loginWithUsernamePassword(
        username,
        password,
        undefined,
        internalProvider,
      );
      if (!tokens) throw new Error('Login failed');
      await onLogin(tokens);
      navigate('/browse', { replace: true });
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const startExternal = (provider: TiledAuthProvider) => {
    void device.start(provider);
  };

  if (!authRequired && providers.length === 0) {
    return (
      <Card className="mx-auto mt-10 max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>This server does not require authentication.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-10 max-w-md">
      <CardHeader>
        <CardTitle>Sign in to Tiled</CardTitle>
        <CardDescription>Authenticate to access this data server.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {internalProvider ? (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error ? <StatusLine text={error} /> : null}
            <Button type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        ) : null}

        {externalProviders.map((p) => (
          <Button
            key={p.provider}
            variant="outline"
            disabled={device.waiting}
            onClick={() => startExternal(p)}
          >
            <ExternalLink />
            Continue with {p.provider}
          </Button>
        ))}

        {device.error ? <StatusLine text={device.error} /> : null}

        {device.device && device.waiting ? (
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <Label className="text-sm font-medium">
              Sign in to {externalProviders[0]?.provider ?? 'provider'}
            </Label>
            <p className="text-xs text-muted-foreground">
              A Keycloak login page opened in a new tab. Complete the login there, then enter this
              code on the confirmation page:
            </p>
            <p
              data-testid="device-code"
              className="rounded-md border bg-muted px-3 py-2 text-center font-mono text-lg tracking-[0.3em]"
            >
              {device.device.user_code}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              Waiting for you to finish signing in… (cancels automatically after ~15 min)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(device.device?.authorization_uri, '_blank')}
              >
                Reopen login page
              </Button>
              <Button variant="ghost" size="sm" onClick={device.clear}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
