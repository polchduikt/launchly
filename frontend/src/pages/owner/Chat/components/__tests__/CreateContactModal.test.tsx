import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreateContactModal } from '../CreateContactModal';

vi.mock('../../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
  t: (k: string, fb?: string) => fb || k,
}));

vi.mock('../../../../../const/chat', () => ({
  COUNTRIES: [{ code: 'US', name: 'United States', dial: '+1' }],
}));

vi.mock('../../../../../schemas/crm.schema', () => ({
  createContactSchema: {
    parse: vi.fn(),
    safeParse: vi.fn().mockReturnValue({ success: true }),
  },
}));

describe('CreateContactModal', () => {
  it('returns null when isOpen=false', () => {
    const { container } = render(
      <CreateContactModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn() as any} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders form fields when open', () => {
    render(
      <CreateContactModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn() as any} />
    );
    expect(screen.getByText('crm.contact.first_name')).toBeInTheDocument();
  });
});
