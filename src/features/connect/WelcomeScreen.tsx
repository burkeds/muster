import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServers } from '@/config/ServerProvider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusLine } from '@/components/common/StatusLine';
import { StateMessage } from '@/components/common/StateMessage';
import { Plus, Check, Server as ServerIcon, Trash2 } from 'lucide-react';
import type { Server } from '@/config/Servers';

interface ServerRowProps {
  server: Server;
  isActive: boolean;
  onConnect: (id: string) => void;
  onRemove: (id: string) => void;
}

function ServerRow({ server, isActive, onConnect, onRemove }: ServerRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex min-w-0 items-center gap-2">
        <ServerIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{server.name}</p>
          <p className="truncate text-xs text-muted-foreground">{server.url}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isActive ? (
          <Badge variant="secondary">Active</Badge>
        ) : (
          <Badge variant="outline">Configured</Badge>
        )}
        <Button size="sm" variant="outline" onClick={() => onConnect(server.id)}>
          <Check />
          Connect
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onRemove(server.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function WelcomeScreen() {
  const { servers, activeServer, selectServer, addServer, removeServer } = useServers();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const connect = (id: string) => {
    selectServer(id);
    navigate('/browse', { replace: true });
  };

  const addAndConnect = (e: FormEvent) => {
    e.preventDefault();
    try {
      const server = addServer(name, url, apiKey);
      connect(server.id);
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-6 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Tiled Web Client</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a Tiled server to connect to, or add your own.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available servers</CardTitle>
          <CardDescription>Choose where to browse or search data.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {servers.length === 0 ? (
            <StateMessage kind="empty" title="No servers" description="Add a server below." />
          ) : (
            servers.map((s) => (
              <ServerRow
                key={s.id}
                server={s}
                isActive={activeServer?.id === s.id}
                onConnect={connect}
                onRemove={removeServer}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a server</CardTitle>
          <CardDescription>Enter a name, its base URL, and an optional API key.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addAndConnect} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="sname">Name</Label>
              <Input
                id="sname"
                placeholder="My experiment server"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="surl">Base URL</Label>
              <Input
                id="surl"
                placeholder="https://host:8000/api/v1"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="skey">API key (optional)</Label>
              <Input
                id="skey"
                type="password"
                placeholder="secret"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            {error ? <StatusLine text={error} /> : null}
            <Button type="submit">
              <Plus />
              Add &amp; connect
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
