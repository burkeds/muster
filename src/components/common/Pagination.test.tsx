import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders a summary and handles next/prev', async () => {
    const onOffsetChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination offset={0} limit={20} total={100} onOffsetChange={onOffsetChange} />);
    expect(screen.getByText(/Showing 1–20 of 100/)).toBeInTheDocument();

    const next = screen.getByRole('button', { name: /next/i });
    await user.click(next);
    expect(onOffsetChange).toHaveBeenCalledWith(20);
  });

  it('disables prev on the first page', () => {
    render(<Pagination offset={0} limit={20} total={100} onOffsetChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled();
  });

  it('does not render when total is zero', () => {
    const { container } = render(
      <Pagination offset={0} limit={20} total={0} onOffsetChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
