import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

const mockUseServers = vi.fn();
vi.mock('@/config/ServerProvider', () => ({
  useServers: (...args: unknown[]) => mockUseServers(...args),
}));

vi.mock('@/hooks/useServerInfo', () => ({
  useServerInfo: () => ({ data: undefined, isLoading: false, isError: false }),
}));

import { ServerSelector } from './ServerSelector';

describe('ServerSelector', () => {
  it('shows the active server name and lists servers in the menu', async () => {
    const selectServer = vi.fn();
    mockUseServers.mockReturnValue({
      servers: [
        { id: 'local', name: 'Local demo', url: 'http://localhost:8000/api/v1' },
        { id: 'desy', name: 'DESY', url: 'https://tiled.desy.de/api/v1' },
      ],
      activeServer: {
        id: 'local',
        name: 'Local demo',
        url: 'http://localhost:8000/api/v1',
      },
      selectServer,
    });

    render(
      <MemoryRouter>
        <ServerSelector />
      </MemoryRouter>,
    );

    expect(screen.getByText('Local demo')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('DESY'));
    expect(selectServer).toHaveBeenCalledWith('desy');
  });
});
