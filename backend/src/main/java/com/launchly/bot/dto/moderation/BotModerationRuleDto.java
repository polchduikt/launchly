package com.launchly.bot.dto.moderation;

import com.launchly.bot.entity.CaptchaMode;
import com.launchly.bot.entity.MediaMode;
import com.launchly.bot.entity.ViolationAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BotModerationRuleDto {
    private Long id;
    private Long botId;
    private String chatId;
    private Integer threadId;
    private boolean enabled;
    private boolean antiForwardEnabled;
    private boolean antiLinkEnabled;
    private String allowedLinks;
    private String stopWords;
    private boolean defaultProfanityFilter;
    private MediaMode mediaMode;
    private ViolationAction actionOnViolation;
    private String warningTemplate;
    private Integer warnTtlSeconds;
    private boolean captchaEnabled;
    private CaptchaMode captchaMode;
    private Integer captchaTimeoutSeconds;
    private String captchaMessageTemplate;
}
