package com.launchly.bot.service;

import com.launchly.bot.dto.moderation.BotModerationRuleDto;
import com.launchly.bot.dto.moderation.TestModerationRequest;
import com.launchly.bot.dto.moderation.TestModerationResponse;
import com.launchly.bot.dto.moderation.UpdateBotModerationRuleRequest;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public interface BotModerationService {

    BotModerationRuleDto getModerationSettings(Long botId);

    BotModerationRuleDto updateModerationSettings(Long botId, UpdateBotModerationRuleRequest request);

    boolean processUpdateModeration(Long botId, Update update, TelegramClient client);

    TestModerationResponse testModeration(Long botId, TestModerationRequest request);
}
