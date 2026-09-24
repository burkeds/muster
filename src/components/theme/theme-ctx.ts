import { createContext, useContext } from 'react';
import type { PlotSchemePref } from '@/lib/plotTheme';

export type Theme = 'light' | 'dark';
export type ThemeMode = Theme | 'system';

export interface ThemeContextValue {
  /** The user-selected mode (persisted). */
  mode: ThemeMode;
  /** The effective theme actually applied (resolves "system"). */
  resolvedTheme: Theme;
  setMode: (mode: ThemeMode) => void;
  /** The plot color-scheme preference (persisted). */
  plotScheme: PlotSchemePref;
  setPlotScheme: (scheme: PlotSchemePref) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = 'muster:theme';
export const PLOT_STORAGE_KEY = 'muster:plot';

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

/** Non-throwing access to the theme (defaults when no provider is mounted). */
export function useOptionalTheme(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
