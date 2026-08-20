import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PublicHeader } from '../PublicHeader';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: (selector: any) =>
    selector ? selector({ accessToken: null }) : { accessToken: null },
}));

describe('PublicHeader', () => {
  it('renders public header navigation elements', () => {
    render(
      <MemoryRouter>
        <PublicHeader />
      </MemoryRouter>
    );

    expect(screen.getByAltText(/launchly logo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /увійти/i })).toBeInTheDocument();
  });

  it('renders simple header version for auth pages', () => {
    render(
      <MemoryRouter>
        <PublicHeader simple />
      </MemoryRouter>
    );

    expect(screen.getByAltText(/launchly logo/i)).toBeInTheDocument();
  });
});
