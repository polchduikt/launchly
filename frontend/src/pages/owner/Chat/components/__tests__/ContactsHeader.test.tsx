import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactsHeader } from '../ContactsHeader';

vi.mock('../../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
  t: (k: string, fb?: string) => fb || k,
}));

describe('ContactsHeader', () => {
  it('renders title and create contact button', () => {
    render(
      <ContactsHeader
        onCreateContact={vi.fn()}
      />
    );
    expect(screen.getByText(/crm.contacts.title/i)).toBeInTheDocument();
    expect(screen.getByText(/crm.contacts.btn.create/i)).toBeInTheDocument();
  });
});
