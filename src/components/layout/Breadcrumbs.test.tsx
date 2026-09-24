import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from './Breadcrumbs';

describe('Breadcrumbs', () => {
  it('shows the full path including the leaf when currentIsLeaf', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          segments={['fxi', '1b0b4d73-6d87-43ab-8d62-ed035c51b9b4', 'primary', 'Andor_image']}
          currentIsLeaf
        />
      </MemoryRouter>,
    );
    for (const label of ['fxi', '1b0b4d73-6d87-43ab-8d62-ed035c51b9b4', 'primary', 'Andor_image']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('does not show a leaf past the provided segments', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs segments={['fxi', 'primary']} currentIsLeaf />
      </MemoryRouter>,
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('fxi')).toBeInTheDocument();
    expect(screen.getByText('primary')).toBeInTheDocument();
  });
});
