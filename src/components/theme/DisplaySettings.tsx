import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Monitor, Check, Palette, SlidersHorizontal } from 'lucide-react';
import { useTheme, type ThemeMode } from './theme-ctx';
import {
  PALETTES,
  PLOT_PALETTE_OPTIONS,
  PLOT_THEME_OPTIONS,
  type PlotPalette,
  type PlotThemeMode,
} from '@/lib/plotTheme';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/** Small inline colorway swatch for a palette choice. */
function PaletteSwatch({ palette, theme }: { palette: PlotPalette; theme: 'light' | 'dark' }) {
  const colors = PALETTES[palette][theme].slice(0, 5);
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {colors.map((c) => (
        <span
          key={c}
          className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: c }}
        />
      ))}
    </span>
  );
}

/**
 * Header control to configure display settings:
 *  - Color theme (light / dark / system)
 *  - Plot theme (match app / light / dark)
 *  - Plot palette (colour-safe / Viridis / Plotly default)
 * Preferences persist across sessions.
 */
export function DisplaySettings() {
  const { resolvedTheme, mode, setMode, plotScheme, setPlotScheme } = useTheme();
  const ActiveIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Display settings"
        title="Display settings (theme, plots)"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ActiveIcon className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Display settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Theme
        </DropdownMenuLabel>
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setMode(value)} className="justify-between">
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </span>
            {mode === value ? <Check className="h-4 w-4 shrink-0" /> : null}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
          <Palette className="h-4 w-4" />
          Plot colors
        </DropdownMenuLabel>
        {PLOT_THEME_OPTIONS.map(({ value, label }) => (
          <DropdownMenuItem
            key={`t-${value}`}
            onSelect={() => setPlotScheme({ ...plotScheme, mode: value as PlotThemeMode })}
          >
            <span className="flex flex-1 items-center justify-between gap-3">
              {label}
              {plotScheme.mode === value ? <Check className="h-4 w-4 shrink-0" /> : null}
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Color scheme
        </DropdownMenuLabel>
        {PLOT_PALETTE_OPTIONS.map(({ value, label, description }) => (
          <DropdownMenuItem
            key={`p-${value}`}
            title={description}
            onSelect={() => setPlotScheme({ ...plotScheme, palette: value as PlotPalette })}
          >
            <span className="flex flex-1 items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <PaletteSwatch palette={value} theme="light" />
                {label}
              </span>
              {plotScheme.palette === value ? <Check className="h-4 w-4 shrink-0" /> : null}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
