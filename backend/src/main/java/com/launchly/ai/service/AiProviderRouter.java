package com.launchly.ai.service;

import com.launchly.ai.client.AiProviderClient;
import com.launchly.ai.dto.AiMessage;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiProviderRouter {

    private final List<AiProviderClient> providers;

    @Value("${ai.providers:groq,gemini,openrouter,cerebras}")
    private String providerOrder;

    public String chat(List<AiMessage> messages, Map<String, Object> responseFormat) {
        return chat(messages, responseFormat, response -> true);
    }

    public String chat(List<AiMessage> messages, Map<String, Object> responseFormat, Predicate<String> responseValidator) {
        List<AiProviderClient> orderedProviders = orderedProviders();
        boolean hasConfiguredProvider = orderedProviders.stream().anyMatch(AiProviderClient::isConfigured);

        if (!hasConfiguredProvider) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "No AI provider API key is configured");
        }

        for (AiProviderClient provider : orderedProviders) {
            if (!provider.isConfigured()) {
                continue;
            }

            try {
                String response = provider.chat(messages, responseFormat);
                if (responseValidator.test(response)) {
                    return response;
                }
                log.warn("{} returned a response that did not pass validation", provider.name());
            } catch (AppException e) {
                log.warn("{} failed: {}", provider.name(), e.getMessage());
            } catch (Exception e) {
                log.warn("{} failed unexpectedly: {}", provider.name(), e.getMessage(), e);
            }
        }

        throw new AppException(HttpStatus.BAD_GATEWAY, "All configured AI providers are unavailable");
    }

    private List<AiProviderClient> orderedProviders() {
        Map<String, AiProviderClient> providerByName = providers.stream()
                .collect(Collectors.toMap(provider -> provider.name().toLowerCase(Locale.ROOT), provider -> provider, (left, right) -> left));
        List<AiProviderClient> result = new ArrayList<>();
        Set<String> addedNames = new HashSet<>();

        for (String rawName : providerOrder.split(",")) {
            String name = rawName.trim().toLowerCase(Locale.ROOT);
            AiProviderClient provider = providerByName.get(name);
            if (provider != null && addedNames.add(name)) {
                result.add(provider);
            }
        }

        for (AiProviderClient provider : providers) {
            String name = provider.name().toLowerCase(Locale.ROOT);
            if (addedNames.add(name)) {
                result.add(provider);
            }
        }

        return result;
    }
}
