import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';

vi.mock('../../../../i18n/config', () => ({
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
  t: (k: string, fb?: string) => fb || k,
}));

vi.mock('../../../../utils/crmChat', () => ({
  formatMessageTime: () => '12:00',
  parseMessageButtons: (content: string) => ({ text: content, buttons: [] }),
}));

describe('MessageBubble', () => {
  it('renders owner message bubble', () => {
    const msg = { id: '1', content: 'Hello user', createdAt: '2023-01-01', senderType: 'OWNER' };
    render(
      <MessageBubble
        message={msg as unknown as never}
        isOwner={true}
        ownerAvatar={<div data-testid="owner-avatar" />}
        userAvatar={<div data-testid="user-avatar" />}
        allMessages={[]}
        onButtonClick={vi.fn()}
        onImageLoad={vi.fn()}
      />
    );
    expect(screen.getByText('Hello user')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
  });

  it('renders user message bubble', () => {
    const msg = { id: '2', content: 'Hello owner', createdAt: '2023-01-01', senderType: 'BOT_USER' };
    render(
      <MessageBubble
        message={msg as unknown as never}
        isOwner={false}
        ownerAvatar={<div data-testid="owner-avatar" />}
        userAvatar={<div data-testid="user-avatar" />}
        allMessages={[]}
        onButtonClick={vi.fn()}
        onImageLoad={vi.fn()}
      />
    );
    expect(screen.getByText('Hello owner')).toBeInTheDocument();
  });
});
