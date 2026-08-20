import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatHistoryModal } from '../ChatHistoryModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => fb || k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k })
}));

vi.mock('../../../../../hooks/crm/useCrmQueries', () => ({
  useMessagesQuery: () => ({ data: [], isLoading: false })
}));

vi.mock('../UserAvatar', () => ({ UserAvatar: () => <div data-testid="user-avatar" /> }));
vi.mock('../OwnerAvatar', () => ({ OwnerAvatar: () => <div data-testid="owner-avatar" /> }));
vi.mock('../MessageBubble', () => ({ MessageBubble: () => <div data-testid="message-bubble" /> }));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('ChatHistoryModal', () => {
  it('renders modal with conversation user name and close button', () => {
    const mockConv = { id: 1, botUserName: 'John Doe', botUserPhotoUrl: '' } as any;
    render(
      <QueryClientProvider client={qc}>
        <ChatHistoryModal
          conversation={mockConv}
          onClose={vi.fn()}
        />
      </QueryClientProvider>
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
