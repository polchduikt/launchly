package com.launchly.bot.service;

import com.launchly.bot.entity.BotUser;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public interface FlowEngineService {

    void processUpdate(Long botId, Update update, TelegramClient client);

    void runFlow(Long botId, BotUser botUser, String startNodeId, Long campaignId);
}
