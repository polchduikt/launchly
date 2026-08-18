package com.launchly.ai.client;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.launchly.ai.dto.AiMessage;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiClient implements AiProviderClient {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseUrl;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    @Value("${gemini.max-tokens:8192}")
    private int maxTokens;

    @Value("${gemini.temperature:0.7}")
    private double temperature;

    @Override
    public String name() {
        return "gemini";
    }

    @Override
    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }

    @Override
    public String chat(List<AiMessage> messages, Map<String, Object> responseFormat) {
        return chat(messages, responseFormat, null);
    }

    @Override
    public String chat(List<AiMessage> messages, Map<String, Object> responseFormat, String customApiKey) {
        String keyToUse = (customApiKey != null && !customApiKey.trim().isEmpty()) ? customApiKey : apiKey;
        if (keyToUse == null || keyToUse.trim().isEmpty()) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "ai.error.no_provider_configured");
        }

        try {
            Map<String, Object> requestBody = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            StringBuilder systemPrompt = new StringBuilder();

            for (AiMessage message : messages) {
                if ("system".equalsIgnoreCase(message.role())) {
                    if (systemPrompt.length() > 0) {
                        systemPrompt.append("\n\n");
                    }
                    systemPrompt.append(message.content());
                    continue;
                }

                String role = "assistant".equalsIgnoreCase(message.role()) ? "model" : "user";
                contents.add(Map.of(
                        "role", role,
                        "parts", List.of(Map.of("text", message.content()))
                ));
            }

            if (systemPrompt.length() > 0) {
                requestBody.put("systemInstruction", Map.of(
                        "parts", List.of(Map.of("text", systemPrompt.toString()))
                ));
            }

            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", responseFormat != null ? 0.1 : temperature);
            generationConfig.put("maxOutputTokens", maxTokens);
            if (responseFormat != null) {
                generationConfig.put("responseMimeType", "application/json");
            }

            requestBody.put("contents", contents);
            requestBody.put("generationConfig", generationConfig);

            String encodedKey = URLEncoder.encode(keyToUse, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/models/" + model + ":generateContent?key=" + encodedKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            log.info("Sending chat request to Gemini model: {}", model);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Gemini API error. Status: {}, Body: {}", response.statusCode(), response.body());
                throw new AppException(HttpStatus.BAD_GATEWAY, "ai.error.provider_failed");
            }

            JsonNode rootNode = objectMapper.readTree(response.body());
            JsonNode candidates = rootNode.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && parts.size() > 0) {
                    return parts.get(0).path("text").asText();
                }
            }

            throw new AppException(HttpStatus.BAD_GATEWAY, "ai.error.invalid_response");
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Exception occurred while calling Gemini API: {}", e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "ai.error.failed_connect");
        }

    }
}
