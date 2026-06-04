package com.launchly.crm.dto.response;

import com.launchly.crm.entity.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderResponse(
        Long id,
        String orderNumber,
        OrderStatus status,
        BigDecimal totalAmount,
        String currency,
        String notes,
        String items,
        String botUserName,
        String botUserUsername,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
