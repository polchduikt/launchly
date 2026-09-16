package com.launchly.bot.engine.action.handler;

import com.launchly.auth.entity.User;
import com.launchly.bot.engine.action.BotActionHandler;
import com.launchly.bot.entity.BotUser;
import com.launchly.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class AssigneeNotificationBotActionHandler implements BotActionHandler {

    private final NotificationService notificationService;

    @Override
    public Set<String> getSupportedTypes() {
        return Set.of("NOTIFY_ASSIGNEES", "NOTIFY_ASSIGNEE");
    }

    @Override
    public void execute(String type, Map<String, Object> action, BotUser botUser, Map<String, String> sessionData) {
        User botOwner = botUser.getBot().getUser();
        if (botOwner != null) {
            notificationService.sendAssignmentNotification(botOwner.getId(), botUser.getId());
        } else {
            log.warn("Cannot send assignee notification: bot owner is null");
        }
    }
}
