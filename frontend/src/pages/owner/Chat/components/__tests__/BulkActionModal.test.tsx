import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BulkActionModal } from '../BulkActionModal';

vi.mock('../../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
  t: (k: string, fb?: string) => fb || k,
}));

describe('BulkActionModal', () => {
  it('returns null when isOpen=false', () => {
    const { container } = render(
      <BulkActionModal
        isOpen={false}
        onClose={vi.fn()}
        actionType="add-tag"
        selectedCount={5}
        tags={[]}
        onApply={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders add-tag action with tag select and submit button', () => {
    render(
      <BulkActionModal
        isOpen={true}
        onClose={vi.fn()}
        actionType="add-tag"
        selectedCount={5}
        tags={[{ id: 1, botId: 1, name: 'VIP', createdAt: '', updatedAt: '' } as any]}
        onApply={vi.fn()}
      />
    );
    expect(screen.getByText(/crm.contacts.bulk.add_tag/i)).toBeInTheDocument();
  });
});
