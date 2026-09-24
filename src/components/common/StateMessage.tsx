import type { ReactNode } from 'react';
import { Loader2, AlertCircle, PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StateKind = 'loading' | 'error' | 'empty';

export interface StateMessageProps {
  kind: StateKind;
  title: string;
  description?: ReactNode;
  className?: string;
}

/** Loading / error / empty placeholder used across views. */
export function StateMessage({ kind, title, description, className }: StateMessageProps) {
  const Icon = kind === 'loading' ? Loader2 : kind === 'error' ? AlertCircle : PackageOpen;
  return (
    <div
      role={kind === 'error' ? 'alert' : kind === 'loading' ? 'status' : undefined}
      aria-live={kind === 'loading' ? 'polite' : undefined}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center text-muted-foreground',
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn('h-8 w-8', kind === 'loading' && 'animate-spin')}
      />
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="text-xs">{description}</p> : null}
    </div>
  );
}
