import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FooterCTA } from '../FooterCTA';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ accessToken: null }) : { accessToken: null },
}));

describe('FooterCTA', () => {
  it('renders call to action banner and register button for guests', () => {
    render(
      <MemoryRouter>
        <FooterCTA />
      </MemoryRouter>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
