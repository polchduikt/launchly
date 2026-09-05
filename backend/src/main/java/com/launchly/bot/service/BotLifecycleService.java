package com.launchly.bot.service;

import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.entity.Bot;

public interface BotLifecycleService {
    BotResponse startBot(Long id, Long userId);
    BotResponse publishBot(Long id, Long userId);
    BotResponse stopBot(Long id, Long userId);
    void releaseTokenFromOtherBots(String token, Long userId, Long currentBotId);
    void registerBot(Bot bot);
    void unregisterBot(Long botId);
}
