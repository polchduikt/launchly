package com.launchly.crm.dto.request;

import com.launchly.crm.entity.OrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request payload to update e-commerce order fulfillment status")
public record OrderUpdateRequest(
        @Schema(description = "Order status: PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED", example = "PAID")
        OrderStatus status,

        @Schema(description = "Order management notes")
        String notes
) {}

