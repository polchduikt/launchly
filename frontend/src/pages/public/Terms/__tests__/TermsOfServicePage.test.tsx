import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TermsOfServicePage } from '../TermsOfServicePage';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

describe('TermsOfServicePage', () => {
  it('renders terms of service document', () => {
    const { container } = render(
      <MemoryRouter>
        <TermsOfServicePage />
      </MemoryRouter>
    );

    expect(container).toBeDefined();
    expect(container.querySelector('h1')).toBeInTheDocument();
  });
});
