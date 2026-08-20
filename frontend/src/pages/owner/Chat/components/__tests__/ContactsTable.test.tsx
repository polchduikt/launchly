import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContactsTable } from '../ContactsTable';

vi.mock('../../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
  t: (k: string, fb?: string) => fb || k,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../ContactAvatar', () => ({
  ContactAvatar: () => <div data-testid="contact-avatar">Avatar</div>,
}));

describe('ContactsTable', () => {
  it('shows no-bot state when botId=0', () => {
    render(
      <MemoryRouter>
        <ContactsTable
          botId={0}
          isContactsLoading={false}
          filteredContacts={[]}
          selectedContactIds={new Set()}
          onSelectAll={vi.fn()}
          onSelectContact={vi.fn()}
          onSelectContactDetail={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(screen.getByText(/crm.contacts.no_bot_title/i)).toBeInTheDocument();
  });

  it('renders table with contacts', () => {
    const contacts = [
      { id: 1, botUserId: '1', firstName: 'John', lastName: 'Doe', photoUrl: '', phone: '123', email: 'a@b.c', createdAt: '2023-01-01', metadata: '{}' },
    ];
    render(
      <MemoryRouter>
        <ContactsTable
          botId={1}
          isContactsLoading={false}
          filteredContacts={contacts as unknown as never}
          selectedContactIds={new Set()}
          onSelectAll={vi.fn()}
          onSelectContact={vi.fn()}
          onSelectContactDetail={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
