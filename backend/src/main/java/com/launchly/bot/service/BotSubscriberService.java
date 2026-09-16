package com.launchly.bot.service;

import com.launchly.bot.dto.request.BotUserCreateRequest;
import com.launchly.bot.dto.request.BotUserUpdateRequest;
import com.launchly.bot.dto.response.BotUserResponse;
import java.util.List;

public interface BotSubscriberService {
    List<BotUserResponse> getBotUsers(Long botId, Long userId);
    BotUserResponse updateBotUser(Long botId, Long botUserId, BotUserUpdateRequest request, Long userId);
    BotUserResponse createBotUser(Long botId, BotUserCreateRequest request, Long userId);
    void deleteBotUser(Long botId, Long botUserId, Long userId);
}
