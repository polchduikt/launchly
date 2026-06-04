package com.launchly.crm.dto.request;

import com.launchly.crm.entity.LeadStatus;

public record LeadUpdateRequest(
        LeadStatus status,
        String notes
) {}
