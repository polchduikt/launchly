package com.launchly.bot.telegram;

import org.telegram.telegrambots.meta.generics.TelegramClient;

public interface TelegramClientProvider {
    TelegramClient getTelegramClient(Long botId);
}
