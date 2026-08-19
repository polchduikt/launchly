package com.launchly.crm.dto.response;

import com.launchly.crm.entity.OrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Schema(description = "E-commerce order created via Telegram bot")
public record OrderResponse(
        @Schema(description = "Order ID", example = "50")
        Long id,

        @Schema(description = "Human-readable order number", example = "ORD-2026-0050")
        String orderNumber,

        @Schema(description = "Order status: PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED", example = "PAID")
        OrderStatus status,

        @Schema(description = "Total purchase amount", example = "149.99")
        BigDecimal totalAmount,

        @Schema(description = "Currency code", example = "UAH")
        String currency,

        @Schema(description = "Order notes")
        String notes,

        @Schema(description = "JSON array of ordered items / line items")
        String items,

        @Schema(description = "Buyer name")
        String botUserName,

        @Schema(description = "Buyer Telegram username")
        String botUserUsername,

        @Schema(description = "Order placement timestamp")
        LocalDateTime createdAt,

        @Schema(description = "Last update timestamp")
        LocalDateTime updatedAt
) {}

