package com.launchly.admin.service;

import com.launchly.admin.entity.UserAuditLog;
import com.launchly.admin.enums.AuditActionType;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.auth.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserAuditService {

    private final UserAuditLogRepository userAuditLogRepository;
    private final MessageSource messageSource;

    @Transactional
    public void logRegistration(User user, String provider, LocalDateTime timestamp) {
        logAction(
                user,
                AuditActionType.USER_REGISTRATION,
                null,
                provider,
                getMsg("audit.user_registration.title", "Registered in Launchly"),
                getMsg("audit.user_registration.desc", new Object[]{provider != null ? provider : "LOCAL"}, "Account activated via " + (provider != null ? provider : "LOCAL")),
                timestamp
        );
    }

    @Transactional
    public void logLogin(User user, String provider) {
        String descKey = "GOOGLE".equalsIgnoreCase(provider) ? "audit.user_auth_oauth.desc" : "audit.user_auth.desc";
        logAction(
                user,
                AuditActionType.USER_LOGIN,
                null,
                provider,
                getMsg("audit.user_auth.title", "User Authentication"),
                getMsg(descKey, "Successful authentication session in system"),
                null
        );
    }

    @Transactional
    public void logBotConnected(User user, Long botId, String botName, LocalDateTime timestamp) {
        logAction(
                user,
                AuditActionType.BOT_CONNECTED,
                botId,
                botName,
                getMsg("audit.bot_connected.title", new Object[]{botName}, "Bot Connected: " + botName),
                getMsg("audit.bot_connected.desc", new Object[]{botId}, "Created and activated bot in system (Bot ID: #" + botId + ")"),
                timestamp
        );
    }

    @Transactional
    public void logAutomationModified(User user, Long botId, String botName, LocalDateTime timestamp) {
        logAction(
                user,
                AuditActionType.AUTOMATION_MODIFIED,
                botId,
                botName,
                getMsg("audit.automation_modified.title", new Object[]{botName}, "Automation Modified: " + botName),
                getMsg("audit.automation_modified.desc", "Updated flow schema structure and funnel node triggers"),
                timestamp
        );
    }

    @Transactional
    public void logBroadcastLaunched(User user, Long campaignId, String campaignName, String status, LocalDateTime timestamp) {
        logAction(
                user,
                AuditActionType.BROADCAST_LAUNCHED,
                campaignId,
                campaignName,
                getMsg("audit.broadcast_launched.title", "Broadcast Launched"),
                getMsg("audit.broadcast_launched.desc", new Object[]{campaignName, status}, "Created broadcast '" + campaignName + "' (Status: " + status + ")"),
                timestamp
        );
    }

    @Transactional
    public void logRoleChanged(User user, String newRole) {
        logAction(
                user,
                AuditActionType.ROLE_CHANGED,
                null,
                newRole,
                getMsg("audit.access_role.title", "Access Rights & Role"),
                getMsg("audit.access_role.desc", new Object[]{newRole}, "Assigned system role: " + newRole),
                null
        );
    }

    @Transactional
    public void logUserBlocked(User user, String reason) {
        logAction(
                user,
                AuditActionType.USER_BLOCKED,
                null,
                reason,
                getMsg("audit.admin_block.title", "Administrative Block"),
                getMsg("audit.admin_block.desc", new Object[]{reason}, "Reason: " + reason),
                null
        );
    }

    @Transactional
    public void logUserUnblocked(User user) {
        logAction(
                user,
                AuditActionType.USER_UNBLOCKED,
                null,
                null,
                getMsg("audit.admin_unblock.title", "Administrative Unblock"),
                getMsg("audit.admin_unblock.desc", "Account restored by administration"),
                null
        );
    }

    private String getMsg(String key, String defaultMsg) {
        return getMsg(key, null, defaultMsg);
    }

    private String getMsg(String key, Object[] args, String defaultMsg) {
        try {
            Locale locale = LocaleContextHolder.getLocale();
            return messageSource.getMessage(key, args, defaultMsg, locale);
        } catch (Exception e) {
            return defaultMsg;
        }
    }

    private void logAction(
            User user,
            AuditActionType actionType,
            Long targetId,
            String targetName,
            String title,
            String description,
            LocalDateTime timestamp
    ) {
        if (user == null) return;
        try {
            UserAuditLog auditLog = UserAuditLog.builder()
                    .user(user)
                    .actionType(actionType)
                    .targetId(targetId)
                    .targetName(targetName)
                    .title(title)
                    .description(description)
                    .category(actionType.getCategory())
                    .badge(actionType.getBadge())
                    .build();
            if (timestamp != null) {
                auditLog.setCreatedAt(timestamp);
            } else {
                auditLog.setCreatedAt(LocalDateTime.now());
            }
            userAuditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log for user {}: {}", user.getId(), e.getMessage());
        }
    }
}
