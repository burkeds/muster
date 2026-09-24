import { useOptionalTheme } from '@/components/theme/theme-ctx';
import {
  DEFAULT_PLOT_SCHEME,
  resolvePlotScheme,
  type PlotSchemePref,
  type ResolvedPlotScheme,
} from '@/lib/plotTheme';

export interface UsePlotScheme {
  pref: PlotSchemePref;
  resolved: ResolvedPlotScheme;
  setPref: (scheme: PlotSchemePref) => void;
}

/** Default resolved scheme when no provider is mounted (safe for tests/embedding). */
const DEFAULT_RESOLVED: ResolvedPlotScheme = { theme: 'light', palette: 'cvd' };

/** Resolve the configured plot scheme against the current app theme. */
export function useOptionalPlotScheme(): UsePlotScheme {
  const theme = useOptionalTheme();
  if (!theme) {
    return {
      pref: DEFAULT_PLOT_SCHEME,
      resolved: DEFAULT_RESOLVED,
      setPref: () => undefined,
    };
  }
  return {
    pref: theme.plotScheme,
    resolved: resolvePlotScheme(theme.plotScheme, theme.resolvedTheme),
    setPref: theme.setPlotScheme,
  };
}

/** Throws if no ThemeProvider is mounted. */
export function usePlotScheme(): UsePlotScheme {
  const theme = useOptionalTheme();
  if (!theme) throw new Error('usePlotScheme must be used within a ThemeProvider');
  return {
    pref: theme.plotScheme,
    resolved: resolvePlotScheme(theme.plotScheme, theme.resolvedTheme),
    setPref: theme.setPlotScheme,
  };
}
