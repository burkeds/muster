import type { Layout } from 'plotly.js';

/**
 * Configurable, theme-aware Plotly styling for Muster.
 *
 * Plotly needs concrete colors (it cannot consume the app's CSS `hsl()` tokens),
 * so this module resolves the app theme + a user-selected palette into a Plotly
 * `layout` (paper/plot backgrounds, font, axis grid and colorway) and a
 * sequential colorscale for heatmap/contour/surface traces.
 *
 * Pure / framework-agnostic — the React provider only stores the *preference*.
 */

export type PlotThemeMode = 'auto' | 'light' | 'dark';
export type PlotPalette = 'cvd' | 'viridis' | 'plotly';

export interface PlotSchemePref {
  /** How the plot theme is chosen. */
  mode: PlotThemeMode;
  /** Which trace colorway / colorscale preset to use. */
  palette: PlotPalette;
}

export interface ResolvedPlotScheme {
  theme: 'light' | 'dark';
  palette: PlotPalette;
}

export const DEFAULT_PLOT_SCHEME: PlotSchemePref = {
  mode: 'auto',
  palette: 'cvd',
};

// Font stack shared with the app (tailwind.config.js `fontFamily.sans`).
export const PLOT_FONT_FAMILY = [
  'ui-sans-serif',
  'system-ui',
  'Arial',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'sans-serif',
].join(', ');

/** Per-theme canvas + text colors derived from the app's softened tokens. */
const THEME_COLORS: Record<
  'light' | 'dark',
  { paper: string; plot: string; text: string; tick: string; grid: string }
> = {
  light: {
    paper: '#fbfbf9', // card (40 40% 99%)
    plot: '#f7f6f1', // background (40 33% 97%)
    text: '#292932', // foreground (240 18% 18%)
    tick: '#5c5c66', // muted-foreground (240 9% 40%)
    grid: '#e6e3da', // border (40 15% 87%)
  },
  dark: {
    paper: '#12161d', // card (222 28% 10%)
    plot: '#0e1218', // background (222 30% 8%)
    text: '#f2f6f9', // foreground (210 25% 96%)
    tick: '#a9b3bd', // muted-foreground (215 16% 70%)
    grid: '#20262e', // border (222 22% 16%)
  },
};

/** Trace colorways per palette, with a variant per theme for contrast. */
export const PALETTES: Record<PlotPalette, Record<'light' | 'dark', string[]>> = {
  cvd: {
    // Okabe-Ito-inspired, distinguishable for colour-vision deficiencies.
    light: [
      '#0072B2',
      '#E69F00',
      '#009E73',
      '#D55E00',
      '#CC79A7',
      '#56B4E9',
      '#F0E442',
      '#333333',
    ],
    dark: [
      '#56B4E9',
      '#FFC000',
      '#46D6A0',
      '#FF8C42',
      '#F49BC1',
      '#7FD1FF',
      '#FFE14D',
      '#FFFFFF',
    ],
  },
  viridis: {
    light: ['#440154', '#414487', '#2A788E', '#22A884', '#7AD151', '#FDE725'],
    dark: ['#7D6BF0', '#4DA5C0', '#3BB59A', '#8FD15A', '#E7E94C', '#FFFFFF'],
  },
  plotly: {
    // Plotly's well-known default colorway.
    light: ['#636efa', '#ef553b', '#00cc96', '#ab63fa', '#ffa15a', '#19d3f3', '#ff6692', '#b6e880'],
    dark: ['#80a8ff', '#ff8a6b', '#3de0a8', '#c39cff', '#ffc07a', '#66e6ff', '#ff9abd', '#d6f0a0'],
  },
};

export const SEQUENTIAL_SCALES: Record<PlotPalette, string> = {
  cvd: 'Cividis', // sequential scale that is safe for colour-vision deficiencies
  viridis: 'Viridis',
  plotly: 'Viridis',
};

export const PLOT_THEME_OPTIONS: { value: PlotThemeMode; label: string }[] = [
  { value: 'auto', label: 'Auto (match app)' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export const PLOT_PALETTE_OPTIONS: { value: PlotPalette; label: string; description: string }[] = [
  { value: 'cvd', label: 'Muster (colour-safe)', description: 'Distinguishable for colour-vision deficiencies.' },
  { value: 'viridis', label: 'Viridis', description: 'Perceptually uniform sequential palette.' },
  { value: 'plotly', label: 'Plotly default', description: 'Plotly’s classic colorway.' },
];

/** Resolve the configured preference against the current app theme. */
export function resolvePlotScheme(
  pref: PlotSchemePref,
  appTheme: 'light' | 'dark',
): ResolvedPlotScheme {
  return { theme: pref.mode === 'auto' ? appTheme : pref.mode, palette: pref.palette };
}

/**
 * Build a Plotly layout for the given resolved scheme. Applied as the *base*
 * under a caller's own layout, so callers can still override anything.
 */
export function resolvePlotLayout(scheme: ResolvedPlotScheme): Partial<Layout> {
  const colors = THEME_COLORS[scheme.theme];
  const colorway = PALETTES[scheme.palette][scheme.theme];
  return {
    paper_bgcolor: colors.paper,
    plot_bgcolor: colors.plot,
    font: { color: colors.text, family: PLOT_FONT_FAMILY },
    colorway,
    xaxis: {
      gridcolor: colors.grid,
      zerolinecolor: colors.grid,
      linecolor: colors.grid,
      tickfont: { color: colors.tick },
      titlefont: { color: colors.text },
    },
    yaxis: {
      gridcolor: colors.grid,
      zerolinecolor: colors.grid,
      linecolor: colors.grid,
      tickfont: { color: colors.tick },
      titlefont: { color: colors.text },
    },
    legend: { font: { color: colors.text } },
  };
}

/** Sequential colorscale for heatmap/contour/surface traces. */
export function resolveSequentialScale(scheme: ResolvedPlotScheme): string {
  return SEQUENTIAL_SCALES[scheme.palette];
}
