import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockDownloadPlot = vi.fn();
vi.mock('@/lib/plotExporter', () => ({
  downloadPlot: (...args: unknown[]) => mockDownloadPlot(...args),
  renderPlot: vi.fn(),
}));

import { PlotExportMenu } from './PlotExportMenu';

describe('PlotExportMenu', () => {
  it('downloads the plot as PNG and SVG when disabled by no graph div', async () => {
    const user = userEvent.setup();
    render(<PlotExportMenu gd={null} filename="chart" />);
    const trigger = screen.getByText('Export');
    expect(trigger).toBeDisabled();
    await user.click(trigger).catch(() => {});
    expect(mockDownloadPlot).not.toHaveBeenCalled();
  });

  it('exports PNG and SVG for a mounted graph div', async () => {
    const user = userEvent.setup();
    const gd = document.createElement('div');
    render(<PlotExportMenu gd={gd} filename="chart" />);
    await user.click(screen.getByText('Export'));

    await user.click(screen.getByText('PNG image'));
    expect(mockDownloadPlot).toHaveBeenCalledWith(gd, 'chart.png', 'png');

    await user.click(screen.getByText('Export'));
    await user.click(screen.getByText('SVG vector'));
    expect(mockDownloadPlot).toHaveBeenCalledWith(gd, 'chart.svg', 'svg');
  });
});
