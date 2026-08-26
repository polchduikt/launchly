package com.launchly.bot.entity;

import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Entity
@Table(name = "bot_users", indexes = {
    @Index(name = "idx_bot_users_bot_id", columnList = "bot_id"),
    @Index(name = "idx_bot_users_telegram_id", columnList = "telegram_id"),
    @Index(name = "idx_bot_users_bot_telegram", columnList = "bot_id, telegram_id"),
    @Index(name = "idx_bot_users_bot_created", columnList = "bot_id, created_at")
})
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BotUser extends BaseEntity {

    @Column(name = "telegram_id", nullable = false)
    private Long telegramId;

    private String username;

    private String firstName;

    private String lastName;

    private String currentNodeId;

    @Column(name = "photo_url")
    private String photoUrl;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private String metadata = "{}";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bot_id", nullable = false)
    private Bot bot;

    public void updateTelegramProfile(String firstName, String lastName, String username, String photoUrl) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.username = username;
        if (photoUrl != null && !photoUrl.isBlank()) {
            this.photoUrl = photoUrl;
        }
    }

    public void setCurrentNode(String nodeId) {
        this.currentNodeId = nodeId;
    }
}

