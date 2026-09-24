import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface JsonViewerProps {
  value: unknown;
  className?: string;
}

/** Simple pretty-printed JSON tree (read-only). */
export function JsonViewer({ value, className }: JsonViewerProps) {
  return (
    <pre
      className={cn(
        'max-h-[40rem] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed',
        className,
      )}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function kv(label: string, value: ReactNode): ReactNode {
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-all font-mono text-xs">{value ?? '—'}</span>
    </div>
  );
}
