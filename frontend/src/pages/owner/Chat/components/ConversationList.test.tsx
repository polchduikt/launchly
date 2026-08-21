import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConversationList } from './ConversationList';

vi.mock('../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
  t: (k: string, fb?: string) => fb || k,
}));

vi.mock('./UserAvatar', () => ({
  UserAvatar: () => <div data-testid="user-avatar">Avatar</div>,
}));

vi.mock('../../../../utils/crmChat', () => ({
  timeAgo: () => '1 hour ago',
}));

describe('ConversationList', () => {
  it('shows loading spinner when isLoading=true', () => {
    const { container } = render(
      <ConversationList
        conversations={[]}
        selectedConvId={null}
        onSelect={vi.fn()}
        isLoading={true}
        favorites={[]}
        onToggleFavorite={vi.fn()}
        unreadConvIds={[]}
        searchQuery=""
        chatFilter="all"
      />
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders conversation items', () => {
    const convs = [
      { id: 1, botUserName: 'User 1', lastMessage: 'Hello', lastMessageAt: '2023-01-01', unread: false },
    ];
    render(
      <ConversationList
        conversations={convs as unknown as never}
        selectedConvId={null}
        onSelect={vi.fn()}
        isLoading={false}
        favorites={[]}
        onToggleFavorite={vi.fn()}
        unreadConvIds={[]}
        searchQuery=""
        chatFilter="all"
      />
    );
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
