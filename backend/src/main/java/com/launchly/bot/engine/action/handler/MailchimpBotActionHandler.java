package com.launchly.bot.engine.action.handler;

import com.launchly.bot.engine.action.ActionPlaceholderResolver;
import com.launchly.bot.engine.action.BotActionHandler;
import com.launchly.bot.entity.BotUser;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.repository.IntegrationRepository;
import com.launchly.integration.service.MailchimpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class MailchimpBotActionHandler implements BotActionHandler {

    private final IntegrationRepository integrationRepository;
    private final MailchimpService mailchimpService;
    private final ActionPlaceholderResolver placeholderResolver;

    @Override
    public Set<String> getSupportedTypes() {
        return Set.of("MAILCHIMP_SUBSCRIBE");
    }

    @Override
    public void execute(String type, Map<String, Object> action, BotUser botUser, Map<String, String> sessionData) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();

        Integration integration = integrationRepository.findByBotIdAndType(botId, IntegrationType.MAILCHIMP).orElse(null);
        if (integration != null && integration.isActive()) {
            String email = placeholderResolver.resolveValue((String) action.get("email"), sessionData, botUser);
            if (email == null || email.trim().isEmpty()) {
                email = sessionData != null ? sessionData.getOrDefault("email", "") : "";
            }
            String firstName = placeholderResolver.resolveValue((String) action.get("firstName"), sessionData, botUser);
            if (firstName == null || firstName.trim().isEmpty()) {
                firstName = botUser.getFirstName() != null ? botUser.getFirstName() : "";
            }
            String lastName = placeholderResolver.resolveValue((String) action.get("lastName"), sessionData, botUser);
            if (lastName == null || lastName.trim().isEmpty()) {
                lastName = botUser.getLastName() != null ? botUser.getLastName() : "";
            }
            String phone = placeholderResolver.resolveValue((String) action.get("phone"), sessionData, botUser);
            if (phone == null || phone.trim().isEmpty()) {
                phone = sessionData != null ? sessionData.getOrDefault("phone", "") : "";
            }
            Object tagsObj = action.get("tags");
            List<String> tags = null;
            if (tagsObj instanceof List) {
                tags = ((List<?>) tagsObj).stream().map(String::valueOf).collect(Collectors.toList());
            }
            if (email != null && !email.trim().isEmpty()) {
                mailchimpService.addOrUpdateSubscriber(integration, email.trim(), firstName.trim(), lastName.trim(), phone.trim(), tags);
                log.info("Triggered Mailchimp subscribe for user {} email {}", telegramUserId, email);
            }
        } else {
            log.warn("Skipping Mailchimp subscribe: no active MAILCHIMP integration for bot {}", botId);
        }
    }
}
