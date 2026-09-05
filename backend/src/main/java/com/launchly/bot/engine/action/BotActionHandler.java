package com.launchly.bot.engine.action;

import com.launchly.bot.entity.BotUser;
import java.util.Map;
import java.util.Set;

public interface BotActionHandler {
    Set<String> getSupportedTypes();
    void execute(String type, Map<String, Object> action, BotUser botUser, Map<String, String> sessionData);
}
