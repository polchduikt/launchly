import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdminLayout } from '../AdminLayout';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 1, email: 'admin@launchly.app', role: 'ROLE_ADMIN' },
    logout: vi.fn(),
  }),
}));

describe('AdminLayout', () => {
  it('renders admin navigation links and children content', () => {
    render(
      <MemoryRouter>
        <AdminLayout>
          <div>Admin Content Test</div>
        </AdminLayout>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content Test')).toBeInTheDocument();
    expect(screen.getAllByText(/статистика|admin\.statistics/i).length).toBeGreaterThan(0);
  });
});
