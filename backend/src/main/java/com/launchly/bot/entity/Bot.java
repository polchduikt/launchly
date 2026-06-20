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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bots", indexes = {
    @Index(name = "idx_bots_user_id", columnList = "user_id"),
    @Index(name = "idx_bots_active", columnList = "is_active")
})
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bot extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String username;

    private String description;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
