import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { AiTermsPage } from '../AiTermsPage';
import { PaymentTermsPage } from '../PaymentTermsPage';
import { AcceptableUsePolicyPage } from '../AcceptableUsePolicyPage';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../i18n/config', () => ({
  t: (k: string, fb?: string) => fb || k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
}));

vi.mock('../../../hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

vi.mock('../../../components/layout/PublicHeader', () => ({
  PublicHeader: () => <header data-testid="public-header" />,
}));
vi.mock('../../../components/layout/PublicFooter', () => ({
  PublicFooter: () => <footer data-testid="public-footer" />,
}));

describe('Legal Pages', () => {
  it('renders AiTermsPage', () => {
    const { container } = render(
      <MemoryRouter>
        <AiTermsPage />
      </MemoryRouter>
    );
    expect(container).toBeDefined();
  });

  it('renders PaymentTermsPage', () => {
    const { container } = render(
      <MemoryRouter>
        <PaymentTermsPage />
      </MemoryRouter>
    );
    expect(container).toBeDefined();
  });

  it('renders AcceptableUsePolicyPage', () => {
    const { container } = render(
      <MemoryRouter>
        <AcceptableUsePolicyPage />
      </MemoryRouter>
    );
    expect(container).toBeDefined();
  });
});
