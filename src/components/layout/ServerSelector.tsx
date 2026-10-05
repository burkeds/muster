import { useNavigate } from 'react-router-dom';
import { useServers } from '@/config/ServerProvider';
import { useServerInfo } from '@/hooks/useServerInfo';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Check, PlugZap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Header control to view/switch the connected Tiled server.
 *
 * Query keys used by data hooks already include the server base URL, so
 * switching servers does not mix cached responses across servers. Token
 * isolation is handled separately via `scopeTokens` in the auth layer.
 */
export function ServerSelector() {
  const { servers, activeServer, selectServer } = useServers();
  const navigate = useNavigate();
  const server = useServerInfo();
  const isLoading = server.isLoading;
  const isError = server.isError;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors hover:bg-accent',
        )}
      >
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              isLoading ? 'bg-muted-foreground/50' : isError ? 'bg-destructive' : 'bg-emerald-500',
            )}
          />
          <span className="max-w-[10rem] truncate">
            {activeServer?.name ?? 'No server connected'}
          </span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>
          {activeServer ? activeServer.url : 'Choose a server'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {servers.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onSelect={() => selectServer(s.id)}
            className="justify-between"
          >
            <span className="truncate">{s.name}</span>
            {activeServer?.id === s.id ? <Check className="h-4 w-4 shrink-0" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/connect')}>
          <PlugZap className="h-4 w-4" />
          Manage servers
        </DropdownMenuItem>
        {isLoading ? (
          <DropdownMenuItem disabled className="justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking…
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
