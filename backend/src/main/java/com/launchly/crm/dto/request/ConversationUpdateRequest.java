package com.launchly.crm.dto.request;

import com.launchly.crm.entity.ConversationStatus;

public record ConversationUpdateRequest(
        ConversationStatus status,
        Boolean unread
) {}
