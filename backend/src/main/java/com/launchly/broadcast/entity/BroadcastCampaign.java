package com.launchly.broadcast.entity;

import com.launchly.bot.entity.Bot;
import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "broadcast_campaigns", indexes = {
    @Index(name = "idx_broadcast_campaigns_bot_id", columnList = "bot_id"),
    @Index(name = "idx_broadcast_campaigns_status", columnList = "status"),
    @Index(name = "idx_broadcast_scheduled", columnList = "status, scheduled_at"),
    @Index(name = "idx_broadcast_bot_status_created", columnList = "bot_id, status, created_at DESC")
})
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BroadcastCampaign extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CampaignStatus status = CampaignStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "filter_type", nullable = false, length = 20)
    @Builder.Default
    private FilterType filterType = FilterType.ALL;

    @Column(name = "filter_value")
    private String filterValue;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "sent_count", nullable = false)
    @Builder.Default
    private Integer sentCount = 0;

    @Column(name = "failed_count", nullable = false)
    @Builder.Default
    private Integer failedCount = 0;

    @Column(name = "total_count", nullable = false)
    @Builder.Default
    private Integer totalCount = 0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String nodes = "[]";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String edges = "[]";

    @Column(name = "target_all_bots")
    @Builder.Default
    private Boolean targetAllBots = false;

    @Column(name = "template_name", length = 500)
    private String templateName;

    @Column(name = "is_blocked", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean blocked = false;

    @Column(name = "block_reason")
    private String blockReason;

    @Column(name = "blocked_at")
    private LocalDateTime blockedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bot_id", nullable = false)
    private Bot bot;

    public void cancel() {
        this.status = CampaignStatus.CANCELLED;
    }

    public void block(String reason) {
        this.blocked = true;
        this.status = CampaignStatus.CANCELLED;
        this.blockReason = reason != null && !reason.isBlank() ? reason.trim() : "Campaign blocked by administrator";
        this.blockedAt = LocalDateTime.now();
    }

    public void unblock() {
        this.blocked = false;
        this.blockReason = null;
        this.blockedAt = null;
    }

    public void markCompleted(int sent, int failed, int total) {
        this.sentCount = sent;
        this.failedCount = failed;
        this.totalCount = total;
        this.status = CampaignStatus.COMPLETED;
    }
}

