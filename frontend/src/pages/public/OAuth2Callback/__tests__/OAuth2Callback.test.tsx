import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OAuth2Callback from '../OAuth2Callback';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api/auth', () => ({
  getCurrentUserApi: vi.fn(() => Promise.resolve({ id: 1, role: 'ROLE_USER' })),
}));

describe('OAuth2Callback', () => {
  it('renders loading spinner message', () => {
    render(
      <MemoryRouter initialEntries={['/oauth2/callback?accessToken=abc&refreshToken=def']}>
        <OAuth2Callback />
      </MemoryRouter>
    );

    expect(screen.getByText('Completing secure sign in...')).toBeInTheDocument();
  });
});
