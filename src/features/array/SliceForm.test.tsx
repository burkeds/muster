import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SliceForm } from './SliceForm';

describe('SliceForm', () => {
  it('renders one control per dimension', () => {
    render(<SliceForm ndim={3} shape={[2, 3, 4]} onSubmit={vi.fn()} />);
    expect(screen.getAllByLabelText(/dim \d slice/)).toHaveLength(3);
  });

  it('submits undefined (whole array) by default', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<SliceForm ndim={2} shape={[5, 5]} onSubmit={onSubmit} />);
    await user.click(screen.getByText('Load'));
    expect(onSubmit).toHaveBeenCalledWith(undefined);
  });

  it('submits a built slice from per-dimension controls', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<SliceForm ndim={2} shape={[5, 5]} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('dim 1 slice'), '1:3');
    await user.type(screen.getByLabelText('dim 2 slice'), '0');
    await user.click(screen.getByText('Load'));
    expect(onSubmit).toHaveBeenCalledWith('1:3,0');
  });

  it('offers First frame for N-D and submits a clean 2-D frame', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<SliceForm ndim={3} shape={[2, 3, 4]} onSubmit={onSubmit} />);
    await user.click(screen.getByText('First frame'));
    expect(onSubmit).toHaveBeenCalledWith('0,:,:');
  });

  it('clearing an entered slice loads the whole array', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<SliceForm ndim={2} shape={[5, 5]} onSubmit={onSubmit} />);
    const input = screen.getByLabelText('dim 1 slice');
    await user.type(input, '1:3');
    await user.clear(input);
    await user.click(screen.getByText('Load'));
    expect(onSubmit).toHaveBeenCalledWith(undefined);
  });

  it('blocks loading on invalid input and shows an error', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<SliceForm ndim={1} shape={[10]} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('dim 1 slice'), 'abc');
    expect(screen.getByText(/Invalid slice/)).toBeInTheDocument();
    expect(screen.getByText('Load')).toBeDisabled();
    await user.click(screen.getByText('Load')).catch(() => {});
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a live size estimate line', () => {
    render(<SliceForm ndim={1} shape={[1000]} itemsize={2} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('size-estimate')).toHaveTextContent('1,000 elements');
    expect(screen.getByTestId('size-estimate')).toHaveTextContent('1.95 KB raw');
  });

  it('warns on a large request', async () => {
    const user = userEvent.setup();
    // shape [900,1080,1280] uint16: whole = ~2.32 GB raw.
    render(
      <SliceForm
        ndim={3}
        shape={[900, 1080, 1280]}
        itemsize={2}
        defaultControls={['', '', '']}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText(/Very large request/)).toBeInTheDocument();
    await user.click(screen.getByText('First frame'));
    // First frame is small; the caution clears.
    expect(screen.queryByText(/Very large request/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Large request/)).not.toBeInTheDocument();
  });

  it('shows a soft caution just above the warning threshold', () => {
    // 9000 x 100 x 100 x 2 bytes = 180 MB raw -> amber caution, not red.
    render(
      <SliceForm
        ndim={3}
        shape={[9000, 100, 100]}
        itemsize={2}
        defaultControls={['', '', '']}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText(/Large request/)).toBeInTheDocument();
    expect(screen.queryByText(/Very large request/)).not.toBeInTheDocument();
  });
});
