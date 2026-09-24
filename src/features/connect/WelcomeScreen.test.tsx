import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { ServerProvider } from '@/config/ServerProvider';
import { WelcomeScreen } from './WelcomeScreen';

function renderWelcome() {
  return render(
    <MemoryRouter>
      <ServerProvider>
        <WelcomeScreen />
      </ServerProvider>
    </MemoryRouter>,
  );
}

describe('WelcomeScreen', () => {
  beforeEach(() => localStorage.clear());

  it('renders the pre-seeded servers and connect buttons', () => {
    renderWelcome();

    expect(screen.getByText('Local demo')).toBeInTheDocument();
    expect(screen.getByText('DESY')).toBeInTheDocument();
    expect(screen.getByText('http://localhost:8000/api/v1')).toBeInTheDocument();
    expect(screen.getByText('Add & connect')).toBeInTheDocument();
  });

  it('validates the add-server form before connecting', async () => {
    const user = userEvent.setup();
    renderWelcome();

    await user.type(screen.getByLabelText('Name'), 'Mine');
    await user.type(screen.getByLabelText('Base URL'), 'not a url');
    await user.click(screen.getByText('Add & connect'));

    expect(screen.getByText(/valid Tiled URL|valid absolute/)).toBeInTheDocument();
    // Invalid input must not have selected/connected a server.
    expect(screen.getByText('Local demo')).toBeInTheDocument();
  });
});
