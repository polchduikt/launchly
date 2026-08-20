import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthLayout } from '../AuthLayout';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    accessToken: null,
  }),
}));

describe('AuthLayout', () => {
  it('renders auth container and nested form content', () => {
    render(
      <MemoryRouter>
        <AuthLayout>
          <div>Login Form Component</div>
        </AuthLayout>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Form Component')).toBeInTheDocument();
  });
});
