import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark';
export type ThemeMode = Theme | 'system';

export interface ThemeContextValue {
  /** The user-selected mode (persisted). */
  mode: ThemeMode;
  /** The effective theme actually applied (resolves "system"). */
  resolvedTheme: Theme;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export const THEME_STORAGE_KEY = 'muster:theme';

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
