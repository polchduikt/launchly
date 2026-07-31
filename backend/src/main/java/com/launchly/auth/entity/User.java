package com.launchly.auth.entity;

import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String email;

    private String password;

    @Column(nullable = false)
    private String name;

    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.ROLE_OWNER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Provider provider = Provider.LOCAL;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "block_reason")
    private String blockReason;

    @Column(name = "blocked_at")
    private LocalDateTime blockedAt;

    @Column(name = "is_email_verified", nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Column(name = "telegram_user_id", unique = true)
    private Long telegramUserId;

    @Column(name = "telegram_username")
    private String telegramUsername;

    @Column(name = "telegram_name")
    private String telegramName;

    @Column(name = "telegram_photo_url")
    private String telegramPhotoUrl;

    @Column(name = "notify_email", nullable = false)
    @Builder.Default
    private boolean notifyEmail = true;

    @Column(name = "notify_telegram", nullable = false)
    @Builder.Default
    private boolean notifyTelegram = false;

    @Column(name = "notification_email")
    private String notificationEmail;

    @Column(name = "stats_notifications_enabled", nullable = false)
    @Builder.Default
    private boolean statsNotificationsEnabled = false;

    @Column(name = "stats_day_of_week")
    @Builder.Default
    private String statsDayOfWeek = "SATURDAY";

    @Column(name = "stats_hour")
    @Builder.Default
    private int statsHour = 10;

    @Column(name = "stats_days_range")
    @Builder.Default
    private int statsDaysRange = 5;

    @Column(name = "stats_notify_email", nullable = false)
    @Builder.Default
    private boolean statsNotifyEmail = true;

    @Column(name = "stats_notify_telegram", nullable = false)
    @Builder.Default
    private boolean statsNotifyTelegram = false;

    @JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "automation_folders", columnDefinition = "jsonb")
    private String automationFolders;
}
