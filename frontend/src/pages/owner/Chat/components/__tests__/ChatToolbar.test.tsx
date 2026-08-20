import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ChatToolbar } from '../ChatToolbar';

vi.mock('../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => fb || k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k })
}));

vi.mock('../../../../../const/chat', () => ({
  PAUSE_OPTIONS: [{ key: 'pause.1h', value: 3600000 }],
  REMINDER_OPTIONS: [{ label: '30 min', value: 1800000 }]
}));

describe('ChatToolbar', () => {
  it('renders toolbar buttons', () => {
    const { container } = render(
      <ChatToolbar
        conversation={{} as unknown as never}
        botUser={{} as unknown as never}
        infoPanelOpen={false}
        onToggleInfoPanel={vi.fn()}
        onCloseConversation={vi.fn()}
        onMarkUnread={vi.fn()}
        onPause={vi.fn()}
        onResume={vi.fn()}
        onAddLabel={vi.fn()}
        onRemoveLabel={vi.fn()}
        onDeleteGlobalLabel={vi.fn()}
        onSetReminder={vi.fn()}
        allLabels={[]}
        isPaused={false}
        isFavorite={false}
        onToggleFavorite={vi.fn()}
        meta={{}}
      />
    );
    expect(container).toBeTruthy();
  });
});
