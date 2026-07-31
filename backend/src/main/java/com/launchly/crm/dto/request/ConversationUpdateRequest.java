package com.launchly.crm.dto.request;

import com.launchly.crm.entity.ConversationStatus;
import java.util.List;

public record ConversationUpdateRequest(
        ConversationStatus status,
        Boolean unread,
        Boolean favorite,
        List<String> tags,
        String notes
) {}
