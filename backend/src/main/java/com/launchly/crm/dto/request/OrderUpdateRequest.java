package com.launchly.crm.dto.request;

import com.launchly.crm.entity.OrderStatus;

public record OrderUpdateRequest(
        OrderStatus status,
        String notes
) {}
