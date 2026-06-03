package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApiCallNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Override
    public NodeType getType() {
        return NodeType.API_CALL;
    }

    @Override
    @SuppressWarnings("unchecked")
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data();

        String url = data != null ? (String) data.get("url") : null;
        String method = data != null ? (String) data.getOrDefault("method", "GET") : "GET";
        String body = data != null ? (String) data.get("body") : "";
        String responseVariable = data != null ? (String) data.getOrDefault("responseVariable", "api_response") : "api_response";

        if (url == null || url.trim().isEmpty()) {
            log.warn("API Call node executed with empty URL in bot {}", botId);
        } else {
            try {
                Map<String, String> sessionData = stateService.getSessionData(botId, telegramUserId);
                String resolvedUrl = resolvePlaceholders(url, sessionData);
                String resolvedBody = resolvePlaceholders(body, sessionData);

                HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                        .uri(URI.create(resolvedUrl))
                        .timeout(Duration.ofSeconds(5));

                if (data.containsKey("headers") && data.get("headers") instanceof Map) {
                    Map<String, String> headers = (Map<String, String>) data.get("headers");
                    headers.forEach(requestBuilder::header);
                }

                HttpRequest.BodyPublisher bodyPublisher = HttpRequest.BodyPublishers.noBody();
                if (method.equalsIgnoreCase("POST") || method.equalsIgnoreCase("PUT")) {
                    bodyPublisher = HttpRequest.BodyPublishers.ofString(resolvedBody);
                }

                HttpRequest request = requestBuilder
                        .method(method.toUpperCase(), bodyPublisher)
                        .build();

                log.info("Sending API request: {} {}", method, resolvedUrl);
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                int statusCode = response.statusCode();
                String responseBody = response.body();

                log.info("API Response received: status={}", statusCode);
                stateService.setSessionData(botId, telegramUserId, responseVariable, responseBody);
                stateService.setSessionData(botId, telegramUserId, responseVariable + "_status", String.valueOf(statusCode));
            } catch (Exception e) {
                log.error("Failed to execute API call in bot {}: {}", botId, e.getMessage());
                stateService.setSessionData(botId, telegramUserId, responseVariable + "_error", e.getMessage());
            }
        }

        return edges.stream()
                .filter(e -> e.source().equals(node.id()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }

    private String resolvePlaceholders(String text, Map<String, String> variables) {
        if (text == null) return "";
        String result = text;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return result;
    }
}
