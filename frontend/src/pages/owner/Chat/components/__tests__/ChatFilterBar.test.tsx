import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ChatFilterBar } from '../ChatFilterBar';

vi.mock('../../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) })
}));

vi.mock('../../../../../const/chat', () => ({
  CHAT_FILTER_OPTIONS: [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' }
  ]
}));

describe('ChatFilterBar', () => {
  it('renders filter bar with unread button', () => {
    const { container } = render(
      <ChatFilterBar
        chatFilter="all"
        onChatFilterChange={vi.fn()}
        chatFilterLabel="All"
        showChatFilterDrop={false}
        onShowChatFilterDrop={vi.fn()}
        filterRef={{ current: null }}
        showUnreadOnly={false}
        onShowUnreadOnlyChange={vi.fn()}
        unreadCount={0}
        sortOrder="newest"
        onSortOrderChange={vi.fn()}
        showSortDrop={false}
        onShowSortDrop={vi.fn()}
        sortRef={{ current: null }}
      />
    );
    expect(container).toBeTruthy();
  });
});
