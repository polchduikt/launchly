package com.launchly.bot.service;

import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public interface FlowEngineService {

    void processUpdate(Long botId, Update update, TelegramClient client);
}
