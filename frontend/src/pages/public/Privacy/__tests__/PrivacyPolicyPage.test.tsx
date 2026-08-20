import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PrivacyPolicyPage } from '../PrivacyPolicyPage';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
  getLanguage: () => 'uk',
}));

vi.mock('../../../hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

describe('PrivacyPolicyPage', () => {
  it('renders privacy policy document', () => {
    const { container } = render(
      <MemoryRouter>
        <PrivacyPolicyPage />
      </MemoryRouter>
    );

    expect(container).toBeDefined();
    expect(container.querySelector('h1')).toBeInTheDocument();
  });
});
