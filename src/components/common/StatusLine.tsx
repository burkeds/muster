import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface StatusLineProps {
  text: string;
  live?: boolean;
  className?: string;
}

/** Human-readable status line shown on every data view. */
export function StatusLine({ text, live, className }: StatusLineProps) {
  return (
    <div
      aria-live="polite"
      className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}
    >
      {live ? (
        <Badge variant="secondary" className="gap-1" title="Streaming live updates from the server.">
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live
        </Badge>
      ) : null}
      <span data-testid="status-line-text">{text}</span>
    </div>
  );
}
