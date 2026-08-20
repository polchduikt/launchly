import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactsFilterBuilder } from '../ContactsFilterBuilder';

vi.mock('../../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
  t: (k: string, fb?: string) => fb || k,
}));

vi.mock('../../../../../api/bot', () => ({
  getCustomFieldsApi: vi.fn(() => Promise.resolve([]))
}));

describe('ContactsFilterBuilder', () => {
  it('returns null when isOpen=false', () => {
    const { container } = render(
      <ContactsFilterBuilder
        isOpen={false}
        conditions={[]}
        setConditions={vi.fn()}
        tags={[]}
        contacts={[]}
        botId={1}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders filter builder when isOpen=true', () => {
    render(
      <ContactsFilterBuilder
        isOpen={true}
        conditions={[]}
        setConditions={vi.fn()}
        tags={[]}
        contacts={[]}
        botId={1}
      />
    );
    expect(screen.getByText(/audience.panel.add_condition/i)).toBeInTheDocument();
  });
});
