package com.launchly.bot.service;

import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public interface SystemBotAuthService {
    void handleSystemBotUpdate(Update update, TelegramClient client);
}
