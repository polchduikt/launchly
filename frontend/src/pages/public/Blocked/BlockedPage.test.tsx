import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BlockedPage } from './BlockedPage';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ user: { email: 'user@launchly.ai', name: 'User' }, logout: vi.fn() }) : { user: null, logout: vi.fn() },
}));

describe('BlockedPage', () => {
  it('renders blocked account notice and appeal form', () => {
    const { container } = render(
      <MemoryRouter>
        <BlockedPage />
      </MemoryRouter>
    );

    expect(container.querySelector('header')).toBeInTheDocument();
    expect(container.querySelector('form')).toBeInTheDocument();
  });
});
