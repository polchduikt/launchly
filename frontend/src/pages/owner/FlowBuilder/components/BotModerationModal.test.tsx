import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BotModerationModal } from './BotModerationModal';
import type { BotResponse } from '../../../../types/bot';
import * as botApi from '../../../../api/bot';

vi.mock('../../../../api/bot', () => ({
  getBotModerationSettingsApi: vi.fn(),
  updateBotModerationSettingsApi: vi.fn(),
  testBotModerationApi: vi.fn(),
}));

const mockBot: BotResponse = {
  id: 1,
  name: 'Test Bot',
  hasTelegramToken: true,
  active: true,
  createdAt: '2026-01-01',
  description: '',
  avatar: null,
  avatarPublicId: null,
  totalUsers: 0,
};

describe('BotModerationModal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    vi.mocked(botApi.getBotModerationSettingsApi).mockResolvedValue({
      id: 1,
      botId: 1,
      enabled: true,
      antiForwardEnabled: true,
      antiLinkEnabled: false,
      defaultProfanityFilter: true,
      mediaMode: 'ALL',
      actionOnViolation: 'DELETE_AND_WARN',
      warningTemplate: '⚠️ Warning!',
      warnTtlSeconds: 5,
    });
  });

  const renderComponent = (isOpen = true, onClose = vi.fn()) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BotModerationModal bot={mockBot} isOpen={isOpen} onClose={onClose} />
      </QueryClientProvider>
    );
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = renderComponent(false);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with moderation settings', async () => {
    renderComponent(true);

    expect(await screen.findByText(/Увімкнути автомодерацію/i)).toBeInTheDocument();
  });

  it('calls update mutation on save click', async () => {
    vi.mocked(botApi.updateBotModerationSettingsApi).mockResolvedValue({
      id: 1,
      botId: 1,
      enabled: true,
      antiForwardEnabled: true,
      antiLinkEnabled: false,
      defaultProfanityFilter: true,
      mediaMode: 'ALL',
      actionOnViolation: 'DELETE_AND_WARN',
    });

    renderComponent(true);

    const saveButton = await screen.findByRole('button', { name: /Зберегти правила|Save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(botApi.updateBotModerationSettingsApi).toHaveBeenCalled();
    });
  });
});