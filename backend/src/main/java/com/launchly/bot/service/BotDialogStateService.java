package com.launchly.bot.service;

import java.util.Map;
import java.util.Optional;

public interface BotDialogStateService {

    void setCurrentNodeId(Long botId, Long telegramUserId, String nodeId);

    Optional<String> getCurrentNodeId(Long botId, Long telegramUserId);

    void setExpectedInput(Long botId, Long telegramUserId, String inputKey);

    Optional<String> getExpectedInput(Long botId, Long telegramUserId);

    void clearExpectedInput(Long botId, Long telegramUserId);

    void setSessionData(Long botId, Long telegramUserId, String key, String value);

    Map<String, String> getSessionData(Long botId, Long telegramUserId);

    void clearSession(Long botId, Long telegramUserId);
}
