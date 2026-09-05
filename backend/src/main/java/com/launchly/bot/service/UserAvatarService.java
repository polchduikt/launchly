package com.launchly.bot.service;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public interface UserAvatarService {

    void fetchAndSetPhotoUrl(BotUser botUser);

    void fetchAndSetPhotoUrl(BotUser botUser, Bot bot, TelegramClient telegramClient);
}
