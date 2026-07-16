package com.launchly.auth.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "telegram_auth_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelegramAuthSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(name = "telegram_user_id")
    private Long telegramUserId;

    @Column(name = "telegram_username")
    private String telegramUsername;

    @Column(name = "jwt_access_token")
    private String jwtAccessToken;

    @Column(name = "jwt_refresh_token")
    private String jwtRefreshToken;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AuthSessionStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
