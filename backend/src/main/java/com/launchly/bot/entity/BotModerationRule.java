package com.launchly.bot.entity;

import com.launchly.bot.constant.ModerationConstants;
import com.launchly.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bot_moderation_rules", indexes = {
    @Index(name = "idx_bmr_bot_chat", columnList = "bot_id, chat_id"),
    @Index(name = "idx_bmr_bot_enabled", columnList = "bot_id, enabled")
})
@Getter
@Setter
@ToString(exclude = {"bot"})
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BotModerationRule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bot_id", nullable = false)
    private Bot bot;

    @Column(name = "chat_id", nullable = false, length = 128)
    @Builder.Default
    private String chatId = "*";

    @Column(name = "thread_id")
    private Integer threadId;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "anti_forward_enabled", nullable = false)
    @Builder.Default
    private boolean antiForwardEnabled = false;

    @Column(name = "anti_link_enabled", nullable = false)
    @Builder.Default
    private boolean antiLinkEnabled = false;

    @Column(name = "allowed_links", columnDefinition = "TEXT")
    private String allowedLinks;

    @Column(name = "stop_words", columnDefinition = "TEXT")
    private String stopWords;

    @Column(name = "default_profanity_filter", nullable = false)
    @Builder.Default
    private boolean defaultProfanityFilter = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_mode", nullable = false, length = 32)
    @Builder.Default
    private MediaMode mediaMode = MediaMode.ALL;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_on_violation", nullable = false, length = 32)
    @Builder.Default
    private ViolationAction actionOnViolation = ViolationAction.DELETE_AND_WARN;

    @Column(name = "warning_template", columnDefinition = "TEXT")
    @Builder.Default
    private String warningTemplate = ModerationConstants.DEFAULT_WARNING_TEMPLATE;

    @Column(name = "warn_ttl_seconds", nullable = false)
    @Builder.Default
    private Integer warnTtlSeconds = 5;

    @Column(name = "captcha_enabled", nullable = false)
    @Builder.Default
    private boolean captchaEnabled = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "captcha_mode", nullable = false, length = 32)
    @Builder.Default
    private CaptchaMode captchaMode = CaptchaMode.BUTTON;

    @Column(name = "captcha_timeout_seconds", nullable = false)
    @Builder.Default
    private Integer captchaTimeoutSeconds = 60;

    @Column(name = "captcha_message_template", columnDefinition = "TEXT")
    private String captchaMessageTemplate;
}
