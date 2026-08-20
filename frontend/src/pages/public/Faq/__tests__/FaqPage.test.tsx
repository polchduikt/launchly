import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FaqPage } from '../FaqPage';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

describe('FaqPage', () => {
  it('renders FAQ page with header and footer', () => {
    const { container } = render(
      <MemoryRouter>
        <FaqPage />
      </MemoryRouter>
    );

    expect(container.querySelector('header')).toBeInTheDocument();
    expect(container.querySelector('footer')).toBeInTheDocument();
  });
});
