package com.launchly.crm.event;

public record CrmOutgoingMessageEvent(
        Long botId,
        Long telegramUserId,
        String content,
        String mediaUrl
) {}
