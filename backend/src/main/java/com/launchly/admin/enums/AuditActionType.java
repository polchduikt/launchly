package com.launchly.admin.enums;

import lombok.Getter;

@Getter
public enum AuditActionType {
    USER_REGISTRATION("audit.user_registration.title", "audit.user_registration.desc", "system", "Account"),
    USER_LOGIN("audit.user_auth.title", "audit.user_auth.desc", "system", "Session"),
    BOT_CONNECTED("audit.bot_connected.title", "audit.bot_connected.desc", "automations", "Bot Config"),
    AUTOMATION_MODIFIED("audit.automation_modified.title", "audit.automation_modified.desc", "automations", "Flow Engine"),
    BROADCAST_LAUNCHED("audit.broadcast_launched.title", "audit.broadcast_launched.desc", "broadcasts", "Campaign"),
    ROLE_CHANGED("audit.access_role.title", "audit.access_role.desc", "system", "Access"),
    USER_BLOCKED("audit.admin_block.title", "audit.admin_block.desc", "system", "Security"),
    USER_UNBLOCKED("audit.admin_unblock.title", "audit.admin_unblock.desc", "system", "Security");

    private final String titleKey;
    private final String descKey;
    private final String category;
    private final String badge;

    AuditActionType(String titleKey, String descKey, String category, String badge) {
        this.titleKey = titleKey;
        this.descKey = descKey;
        this.category = category;
        this.badge = badge;
    }
}
