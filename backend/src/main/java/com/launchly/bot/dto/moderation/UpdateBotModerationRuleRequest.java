package com.launchly.bot.dto.moderation;

import com.launchly.bot.entity.MediaMode;
import com.launchly.bot.entity.ViolationAction;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBotModerationRuleRequest {
    private String chatId;
    private Integer threadId;
    private boolean enabled;
    private boolean antiForwardEnabled;
    private boolean antiLinkEnabled;
    private String allowedLinks;
    private String stopWords;
    private boolean defaultProfanityFilter;
    @NotNull
    private MediaMode mediaMode;
    @NotNull
    private ViolationAction actionOnViolation;
    private String warningTemplate;
    private Integer warnTtlSeconds;
}
