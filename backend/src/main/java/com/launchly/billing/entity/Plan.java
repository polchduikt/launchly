package com.launchly.billing.entity;

import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "plans")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Plan extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    @Builder.Default
    private String currency = "USD";

    @Column(name = "max_bots", nullable = false)
    private int maxBots;

    @Column(name = "max_bot_users", nullable = false)
    private int maxBotUsers;

    @Column(name = "max_broadcasts_per_month", nullable = false)
    private int maxBroadcastsPerMonth;

    @Column(name = "can_use_broadcast", nullable = false)
    private boolean canUseBroadcast;

    @Column(name = "can_use_integrations", nullable = false)
    private boolean canUseIntegrations;

    @Column(name = "can_use_ai_agent", nullable = false)
    private boolean canUseAiAgent;

    @Column(name = "can_use_payments", nullable = false)
    private boolean canUsePayments;

    @Column(name = "stripe_price_id")
    private String stripePriceId;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
