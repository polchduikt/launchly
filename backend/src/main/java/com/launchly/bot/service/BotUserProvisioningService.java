package com.launchly.bot.service;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public interface BotUserProvisioningService {
    BotUser getOrCreateBotUser(Bot bot, Update update, Long telegramUserId, TelegramClient telegramClient);
}
