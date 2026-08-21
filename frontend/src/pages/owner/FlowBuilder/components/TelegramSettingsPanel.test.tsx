import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TelegramSettingsPanel } from './TelegramSettingsPanel';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../../hooks/bot/useTelegramSettings', () => ({
  useTelegramSettings: () => ({
    bots: [{ id: 1, name: 'TestBot', active: true, username: 'testbot' }],
    isLoading: false,
    getBotSettings: vi.fn(() => ({})),
    updateBotSetting: vi.fn(),
    handleToggleBot: vi.fn(),
    activeTokenBot: null,
    setActiveTokenBot: vi.fn(),
    newTokenValue: '',
    setNewTokenValue: vi.fn(),
    tokenError: null,
    setTokenError: vi.fn(),
    activeDeleteBot: null,
    setActiveDeleteBot: vi.fn(),
    deleteConfirmationName: '',
    setDeleteConfirmationName: vi.fn(),
    activeEditAutomation: null,
    setActiveEditAutomation: vi.fn(),
    showSuccessBanner: null,
    setShowSuccessBanner: vi.fn(),
    handleRefreshBotToken: vi.fn(),
    handleDeleteBot: vi.fn(),
    updateBotMutation: { isPending: false },
    deleteBotMutation: { isPending: false },
  }),
}));

vi.mock('../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

describe('TelegramSettingsPanel', () => {
  it('renders Telegram settings', () => {
    render(
      <MemoryRouter>
        <TelegramSettingsPanel />
      </MemoryRouter>
    );
    expect(screen.getByText('settings.telegram.header')).toBeInTheDocument();
    expect(screen.getAllByText('TestBot')[0]).toBeInTheDocument();
  });
});
