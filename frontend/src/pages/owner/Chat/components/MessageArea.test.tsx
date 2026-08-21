import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageArea } from './MessageArea';

vi.mock('../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
  t: (k: string, fb?: string) => fb || k,
}));

vi.mock('./UserAvatar', () => ({
  UserAvatar: () => <div data-testid="user-avatar">User Avatar</div>,
}));

vi.mock('./OwnerAvatar', () => ({
  OwnerAvatar: () => <div data-testid="owner-avatar">Owner Avatar</div>,
}));

vi.mock('./MessageBubble', () => ({
  MessageBubble: () => <div data-testid="message-bubble">Message Bubble</div>,
}));

vi.mock('./ChatToolbar', () => ({
  ChatToolbar: () => <div data-testid="chat-toolbar">Chat Toolbar</div>,
}));

vi.mock('../../../../utils/crmChat', () => ({
  formatDateSeparator: () => 'Today',
  getDateKey: () => 'today',
}));

describe('MessageArea', () => {
  it('shows placeholder when no conversation selected', () => {
    render(
      <MessageArea
        conversation={null}
        messages={[]}
        isMsgLoading={false}
        onButtonClick={vi.fn()}
      />
    );
    expect(screen.getByText(/crm.chat.select_placeholder_title/i)).toBeInTheDocument();
  });
});
