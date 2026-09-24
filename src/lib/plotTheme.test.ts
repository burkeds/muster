import { describe, expect, it } from 'vitest';
import {
  PALETTES,
  PLOT_PALETTE_OPTIONS,
  PLOT_THEME_OPTIONS,
  resolvePlotLayout,
  resolvePlotScheme,
  resolveSequentialScale,
  DEFAULT_PLOT_SCHEME,
} from './plotTheme';

describe('resolvePlotScheme', () => {
  it('auto follows the app theme', () => {
    expect(resolvePlotScheme({ mode: 'auto', palette: 'cvd' }, 'dark')).toEqual({
      theme: 'dark',
      palette: 'cvd',
    });
    expect(resolvePlotScheme({ mode: 'auto', palette: 'cvd' }, 'light')).toEqual({
      theme: 'light',
      palette: 'cvd',
    });
  });

  it('explicit mode overrides the app theme', () => {
    expect(resolvePlotScheme({ mode: 'dark', palette: 'viridis' }, 'light')).toEqual({
      theme: 'dark',
      palette: 'viridis',
    });
  });

  it('defaults to auto + cvd', () => {
    expect(DEFAULT_PLOT_SCHEME).toEqual({ mode: 'auto', palette: 'cvd' });
  });
});

describe('resolvePlotLayout', () => {
  it('uses different backgrounds/text for light vs dark', () => {
    const light = resolvePlotLayout({ theme: 'light', palette: 'cvd' });
    const dark = resolvePlotLayout({ theme: 'dark', palette: 'cvd' });
    expect(light.paper_bgcolor).not.toBe(dark.paper_bgcolor);
    expect(light.font?.color).not.toBe(dark.font?.color);
  });

  it('sets a colorway and font family', () => {
    const layout = resolvePlotLayout({ theme: 'light', palette: 'cvd' });
    expect(layout.colorway).toBeDefined();
    expect(layout.colorway?.length).toBeGreaterThan(0);
    expect(String(layout.font?.family)).toContain('Arial');
  });

  it('colour-safe palette differs from Plotly default', () => {
    const cvd = `${PALETTES.cvd.light.join(',')}`;
    const plotly = `${PALETTES.plotly.light.join(',')}`;
    expect(cvd).not.toBe(plotly);
  });
});

describe('resolveSequentialScale', () => {
  it('maps palette to a colorscale', () => {
    expect(resolveSequentialScale({ theme: 'light', palette: 'cvd' })).toBe('Cividis');
    expect(resolveSequentialScale({ theme: 'light', palette: 'viridis' })).toBe('Viridis');
    expect(resolveSequentialScale({ theme: 'light', palette: 'plotly' })).toBe('Viridis');
  });
});

describe('settings metadata', () => {
  it('exposes theme + palette options for the settings menu', () => {
    expect(PLOT_THEME_OPTIONS.map((o) => o.value)).toContain('auto');
    expect(PLOT_PALETTE_OPTIONS.map((o) => o.value)).toContain('cvd');
  });
});
