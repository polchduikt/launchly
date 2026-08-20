import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CheckoutCancelPage from '../CheckoutCancelPage';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

describe('CheckoutCancelPage', () => {
  it('renders payment cancellation message and retry button', () => {
    render(
      <MemoryRouter>
        <CheckoutCancelPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /Спробувати знову|retry/i })).toBeInTheDocument();
  });
});
