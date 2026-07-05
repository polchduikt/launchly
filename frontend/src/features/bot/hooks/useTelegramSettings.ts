import { useState, useEffect } from 'react';
import { useBotsQuery } from './useBotsQuery';
import {
  useStartBotMutation,
  useStopBotMutation,
  useDeleteBotMutation,
  useUpdateBotMutation,
} from './useBotMutations';
import type { BotResponse } from '../../../types/bot';

export interface BotTelegramSettingsState {
  defaultReplyFlow: string | null;
  welcomeMessageFlow: string | null;
  optInEnabled: boolean;
  optOutEnabled: boolean;
}

export const useTelegramSettings = () => {
  const { data: botsData = [], isLoading } = useBotsQuery();
  const bots = botsData.filter((b) => b.hasTelegramToken);

  const startBotMutation = useStartBotMutation();
  const stopBotMutation = useStopBotMutation();
  const deleteBotMutation = useDeleteBotMutation();
  const updateBotMutation = useUpdateBotMutation();

  const [settings, setSettings] = useState<Record<number, BotTelegramSettingsState>>(() => {
    const saved = localStorage.getItem('launchly_telegram_settings');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeTokenBot, setActiveTokenBot] = useState<BotResponse | null>(null);
  const [newTokenValue, setNewTokenValue] = useState('');
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [activeDeleteBot, setActiveDeleteBot] = useState<BotResponse | null>(null);
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');

  const [activeEditAutomation, setActiveEditAutomation] = useState<{
    botId: number;
    type: 'opt-in' | 'opt-out';
  } | null>(null);

  const [showSuccessBanner, setShowSuccessBanner] = useState<string | null>(null);

  const [activeDropdown, setActiveDropdown] = useState<{
    botId: number;
    type: 'default-reply' | 'welcome-message';
  } | null>(null);

  useEffect(() => {
    localStorage.setItem('launchly_telegram_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (showSuccessBanner) {
      const timer = setTimeout(() => setShowSuccessBanner(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessBanner]);

  const getBotSettings = (botId: number): BotTelegramSettingsState => {
    return (
      settings[botId] || {
        defaultReplyFlow: 'Telegram Default Reply',
        welcomeMessageFlow: 'Welcome Message',
        optInEnabled: true,
        optOutEnabled: true,
      }
    );
  };

  const updateBotSetting = (botId: number, key: keyof BotTelegramSettingsState, value: string | boolean | null) => {
    setSettings((prev) => ({
      ...prev,
      [botId]: {
        ...getBotSettings(botId),
        [key]: value,
      },
    }));
  };

  const handleToggleBot = async (bot: BotResponse) => {
    try {
      if (bot.active) {
        await stopBotMutation.mutateAsync(bot.id);
        setShowSuccessBanner(`Bot "${bot.name}" disabled successfully.`);
      } else {
        await startBotMutation.mutateAsync(bot.id);
        setShowSuccessBanner(`Bot "${bot.name}" enabled successfully.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshBotToken = async () => {
    if (!activeTokenBot) return;
    if (!newTokenValue.trim()) {
      setTokenError('Bot token is required');
      return;
    }
    try {
      await updateBotMutation.mutateAsync({
        id: activeTokenBot.id,
        data: {
          name: activeTokenBot.name,
          telegramToken: newTokenValue.trim(),
        },
      });
      setShowSuccessBanner(`Token for "${activeTokenBot.name}" refreshed successfully.`);
      setActiveTokenBot(null);
      setNewTokenValue('');
      setTokenError(null);
    } catch {
      setTokenError('Failed to refresh token. Please verify the token format.');
    }
  };

  const handleDeleteBot = async () => {
    if (!activeDeleteBot) return;
    if (deleteConfirmationName.trim().toLowerCase() !== activeDeleteBot.name.toLowerCase()) {
      return;
    }
    try {
      await deleteBotMutation.mutateAsync(activeDeleteBot.id);
      setShowSuccessBanner(`Bot "${activeDeleteBot.name}" was completely removed.`);
      setActiveDeleteBot(null);
      setDeleteConfirmationName('');
    } catch (err) {
      console.error(err);
    }
  };

  return {
    bots,
    isLoading,
    getBotSettings,
    updateBotSetting,
    handleToggleBot,
    activeTokenBot,
    setActiveTokenBot,
    newTokenValue,
    setNewTokenValue,
    tokenError,
    setTokenError,
    activeDeleteBot,
    setActiveDeleteBot,
    deleteConfirmationName,
    setDeleteConfirmationName,
    activeEditAutomation,
    setActiveEditAutomation,
    showSuccessBanner,
    setShowSuccessBanner,
    activeDropdown,
    setActiveDropdown,
    handleRefreshBotToken,
    handleDeleteBot,
    updateBotMutation,
    deleteBotMutation,
  };
};
