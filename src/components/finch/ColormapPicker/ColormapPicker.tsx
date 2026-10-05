import { cn } from '@/lib/utils';
import { COLORMAPS, type ColormapDef } from './colormaps';

export interface ColormapPickerProps {
  /** The id of the currently selected colormap */
  value: string;
  /** Called with the id of the colormap the user selects */
  onChange: (id: string) => void;
  /** Override the list of available colormaps; defaults to the built-in set. */
  colormaps?: ColormapDef[];
  /** Additional CSS classes applied to the container */
  className?: string;
}

/**
 * A palette-style colormap selector. Renders a scrollable list of gradient swatches
 * and calls `onChange` with the selected colormap's `id` string.
 */
export function ColormapPicker({
  value,
  onChange,
  colormaps = COLORMAPS,
  className,
}: ColormapPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Colormap"
      className={cn('px-3 py-3 space-y-1.5 overflow-y-auto w-52 min-w-40', className)}
    >
      {colormaps.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={value === c.id}
          onClick={() => onChange(c.id)}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded border hover:cursor-pointer transition-colors',
            value === c.id
              ? 'border-sky-700 bg-sky-50'
              : 'border-slate-200 hover:bg-slate-50',
          )}
        >
          <span className="font-mono text-xs text-muted-foreground w-14 text-left shrink-0 truncate">
            {c.label}
          </span>
          <span
            className="h-3 flex-1 rounded"
            style={{ background: `linear-gradient(90deg, ${c.stops})` }}
          />
        </button>
      ))}
    </div>
  );
}
