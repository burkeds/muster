import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext, THEME_STORAGE_KEY, PLOT_STORAGE_KEY, type Theme, type ThemeMode } from './theme-ctx';
import {
  DEFAULT_PLOT_SCHEME,
  type PlotPalette,
  type PlotSchemePref,
  type PlotThemeMode,
} from '@/lib/plotTheme';

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* ignore */
  }
  return 'system';
}

function readStoredPlotScheme(): PlotSchemePref {
  try {
    const raw = localStorage.getItem(PLOT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlotSchemePref>;
      const mode: PlotThemeMode =
        parsed.mode === 'light' || parsed.mode === 'dark' || parsed.mode === 'auto'
          ? parsed.mode
          : 'auto';
      const palette: PlotPalette =
        parsed.palette === 'viridis' || parsed.palette === 'plotly' ? parsed.palette : 'cvd';
      return { mode, palette };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_PLOT_SCHEME };
}

function currentSystemTheme(): Theme {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Light/dark/system theme with persistence and no-flash initialisation.
 *
 * Applies a `dark` class on <html> (Tailwind `darkMode: ['class']`), follows the
 * OS preference when "system", and reacts to live OS preference changes.
 * ROCK-IT guidance: offer both light and dark modes to reduce screen-exposure
 * eye strain across different working environments.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);
  const [systemPref, setSystemPref] = useState<Theme>(currentSystemTheme);
  const [plotScheme, setPlotScheme] = useState<PlotSchemePref>(readStoredPlotScheme);

  // Track live OS preference changes.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemPref(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: Theme = mode === 'system' ? systemPref : mode;

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('dark', resolvedTheme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode, resolvedTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(PLOT_STORAGE_KEY, JSON.stringify(plotScheme));
    } catch {
      /* ignore */
    }
  }, [plotScheme]);

  const value = useMemo(
    () => ({ mode, resolvedTheme, setMode, plotScheme, setPlotScheme }),
    [mode, resolvedTheme, plotScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
