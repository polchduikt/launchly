import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserFieldsPanel } from './UserFieldsPanel';

vi.mock('../../../../store/useBotStore', () => ({
  useBotStore: () => 1,
}));

vi.mock('../../../../hooks/bot/useBotsQuery', () => ({
  useBotsQuery: () => ({ data: [{ id: 1 }] }),
}));

vi.mock('../../../../api/bot', () => ({
  getCustomFieldsApi: vi.fn(() => Promise.resolve({ fields: [], archivedFields: [], folders: [] })),
  saveCustomFieldsApi: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

describe('UserFieldsPanel', () => {
  it('renders user fields panel', async () => {
    render(<UserFieldsPanel />);
    expect(await screen.findByText('settings.fields.user_fields_tab')).toBeInTheDocument();
    expect(screen.getByText('settings.fields.archived_header')).toBeInTheDocument();
  });
});
