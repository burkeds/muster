import { cn } from '@/lib/utils';

/** Brand colors from the Muster logo design (see `assets/logo/README.md`). */
const MUSTER_NAVY = '#0B2545';
const MUSTER_BLUE = '#8FD3F4';
const MUSTER_LIME = '#B5F23D';

/** Corner-square positions of the grid "M" mark, shared by all tones. */
const GRID_SQUARES = [
  [0, 0],
  [96, 0],
  [0, 24],
  [24, 24],
  [72, 24],
  [96, 24],
  [0, 48],
  [96, 48],
  [0, 72],
  [96, 72],
  [0, 96],
  [96, 96],
] as const;

export interface MusterMarkProps {
  className?: string;
  /** Whether the mark sits on a dark (navy) or light surface. */
  tone?: 'on-dark' | 'on-light';
}

/** The grid "M" mark on its own, without any background badge. */
export function MusterMark({ className, tone = 'on-dark' }: MusterMarkProps) {
  const squareFill = tone === 'on-dark' ? MUSTER_BLUE : MUSTER_NAVY;
  return (
    <svg viewBox="0 0 116 116" role="img" aria-label="Muster" className={className}>
      <g fill={squareFill}>
        {GRID_SQUARES.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="20" height="20" rx="4" />
        ))}
      </g>
      {tone === 'on-dark' ? (
        <rect x="48" y="48" width="20" height="20" rx="4" fill={MUSTER_LIME} />
      ) : (
        <rect x="49.5" y="49.5" width="19" height="19" rx="3" fill={MUSTER_LIME} stroke={MUSTER_NAVY} strokeWidth="3" />
      )}
    </svg>
  );
}

export interface MusterIconProps {
  className?: string;
}

/**
 * The mark on its fixed navy badge, as specified for app-icon/favicon sizes.
 * Colors are fixed (not theme-driven) so the brand reads the same in light
 * and dark mode.
 */
export function MusterIcon({ className }: MusterIconProps) {
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-[22%]', className)}
      style={{ backgroundColor: MUSTER_NAVY }}
    >
      <MusterMark className="h-[56%] w-[56%]" tone="on-dark" />
    </div>
  );
}

export interface MusterLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  /** Show the "client for Tiled" tagline under the wordmark. */
  tagline?: boolean;
}

/** Full horizontal lockup: icon badge + "Muster" wordmark. */
export function MusterLogo({ className, iconClassName, textClassName, tagline = false }: MusterLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <MusterIcon className={cn('h-8 w-8', iconClassName)} />
      <div className="flex flex-col leading-tight">
        <span className={cn('font-semibold tracking-tight', textClassName)}>Muster</span>
        {tagline ? (
          <span className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            client for Tiled
          </span>
        ) : null}
      </div>
    </div>
  );
}
