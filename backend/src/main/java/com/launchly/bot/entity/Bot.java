package com.launchly.bot.entity;

import com.launchly.auth.entity.User;
import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "bots", indexes = {
    @Index(name = "idx_bots_user_id", columnList = "user_id"),
    @Index(name = "idx_bots_active", columnList = "is_active"),
    @Index(name = "idx_bots_user_updated", columnList = "user_id, updated_at DESC")
})
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bot extends BaseEntity {

    @Version
    private Long version;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    private String username;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String avatar;

    @Column(name = "avatar_public_id")
    private String avatarPublicId;

    @Column(name = "telegram_token", nullable = false)
    private String telegramToken;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = false;

    @Column(name = "order_sequence", nullable = false)
    @Builder.Default
    private Long orderSequence = 1000L;

    @Column(name = "is_blocked", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean blocked = false;

    @Column(name = "block_reason")
    private String blockReason;

    @Column(name = "blocked_at")
    private java.time.LocalDateTime blockedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "custom_fields_data", columnDefinition = "jsonb")
    private String customFieldsData;

    @Column(name = "template_name", length = 500)
    private String templateName;

    @Column(name = "is_template", nullable = false)
    @Builder.Default
    private boolean template = false;

    @Column(name = "runs_count", nullable = false)
    @Builder.Default
    private int runsCount = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public void activate() {
        if (this.blocked) {
            throw new IllegalStateException("Cannot activate a blocked bot");
        }
        this.active = true;
    }

    public void deactivate() {
        this.active = false;
    }

    public void block(String reason) {
        this.blocked = true;
        this.active = false;
        this.blockReason = reason != null && !reason.isBlank() ? reason.trim() : "Bot blocked by administrator";
        this.blockedAt = java.time.LocalDateTime.now();
    }

    public void unblock() {
        this.blocked = false;
        this.blockReason = null;
        this.blockedAt = null;
    }

    public void incrementRunsCount() {
        this.runsCount++;
    }

    public void updateDetails(String name, String description, String avatar, String avatarPublicId) {
        if (name != null && !name.isBlank()) {
            this.name = name.trim();
        }
        this.description = description;
        if (avatar != null) {
            this.avatar = avatar;
            this.avatarPublicId = avatarPublicId;
        }
    }
}

