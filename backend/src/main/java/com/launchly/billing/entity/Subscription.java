package com.launchly.billing.entity;

import com.launchly.auth.entity.User;
import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Index;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions", indexes = {
    @Index(name = "idx_subscriptions_user_id", columnList = "user_id"),
    @Index(name = "idx_subscriptions_plan_id", columnList = "plan_id"),
    @Index(name = "idx_subscriptions_stripe_id", columnList = "stripe_subscription_id")
})
@Getter
@Setter
@ToString(exclude = {"user", "plan"})
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Subscription extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status;

    @Column(name = "stripe_subscription_id")
    private String stripeSubscriptionId;

    @Column(name = "stripe_customer_id")
    private String stripeCustomerId;

    @Column(name = "current_period_start")
    private LocalDateTime currentPeriodStart;

    @Column(name = "current_period_end")
    private LocalDateTime currentPeriodEnd;

    @Column(name = "cancel_at_period_end", nullable = false)
    private boolean cancelAtPeriodEnd;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    public void activate(Plan plan, String stripeCustomerId, String stripeSubscriptionId, LocalDateTime start, LocalDateTime end) {
        this.plan = plan;
        this.stripeCustomerId = stripeCustomerId;
        this.stripeSubscriptionId = stripeSubscriptionId;
        this.currentPeriodStart = start;
        this.currentPeriodEnd = end;
        this.status = SubscriptionStatus.ACTIVE;
        this.cancelAtPeriodEnd = false;
    }

    public void markCancelAtPeriodEnd() {
        this.cancelAtPeriodEnd = true;
    }

    public void cancelImmediately() {
        this.status = SubscriptionStatus.CANCELLED;
        this.cancelAtPeriodEnd = false;
    }

    public boolean isActive() {
        return this.status == SubscriptionStatus.ACTIVE && !isExpired();
    }

    public boolean isExpired() {
        return this.currentPeriodEnd != null && this.currentPeriodEnd.isBefore(LocalDateTime.now());
    }
}

