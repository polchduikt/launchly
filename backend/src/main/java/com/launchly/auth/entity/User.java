package com.launchly.auth.entity;

import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@ToString
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
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

    @Column(name = "timezone")
    @Builder.Default
    private String timezone = "Europe/Kyiv";

    @JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "automation_folders", columnDefinition = "jsonb")
    private String automationFolders;

    public void block(String reason) {
        this.active = false;
        this.blockReason = reason != null && !reason.isBlank() ? reason.trim() : "Account blocked by administrator";
        this.blockedAt = LocalDateTime.now();
    }

    public void unblock() {
        this.active = true;
        this.blockReason = null;
        this.blockedAt = null;
    }

    public void changeRole(Role newRole) {
        if (newRole == null) {
            throw new IllegalArgumentException("Role cannot be null");
        }
        this.role = newRole;
    }

    public void updateProfile(String name, String avatar) {
        if (name != null && !name.isBlank()) {
            this.name = name.trim();
        }
        if (avatar != null) {
            this.avatar = avatar.isBlank() ? null : avatar.trim();
        }
    }

    public void changePassword(String newPassword) {
        this.password = newPassword;
    }

    public void verifyEmail() {
        this.emailVerified = true;
    }

    public void linkTelegram(Long telegramUserId, String username, String name, String photoUrl) {
        this.telegramUserId = telegramUserId;
        this.telegramUsername = username;
        this.telegramName = name;
        this.telegramPhotoUrl = photoUrl;
    }

    public void unlinkTelegram() {
        this.telegramUserId = null;
        this.telegramUsername = null;
        this.telegramName = null;
        this.telegramPhotoUrl = null;
        this.notifyTelegram = false;
        this.statsNotifyTelegram = false;
    }

    public void updateNotificationPreferences(boolean notifyEmail, boolean notifyTelegram, String notificationEmail) {
        this.notifyEmail = notifyEmail;
        this.notifyTelegram = notifyTelegram && this.telegramUserId != null;
        this.notificationEmail = notificationEmail;
    }
}

