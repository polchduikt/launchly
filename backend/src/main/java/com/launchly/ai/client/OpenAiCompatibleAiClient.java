package com.launchly.ai.client;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.launchly.ai.dto.AiMessage;
import com.launchly.common.exception.AppException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
public abstract class OpenAiCompatibleAiClient implements AiProviderClient {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    protected OpenAiCompatibleAiClient(HttpClient httpClient, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }

    protected abstract String apiKey();

    protected abstract String baseUrl();

    protected abstract String model();

    protected abstract int maxTokens();

    protected abstract double temperature();

    protected void applyHeaders(HttpRequest.Builder requestBuilder) {
    }

    @Override
    public boolean isConfigured() {
        return apiKey() != null && !apiKey().trim().isEmpty();
    }

    @Override
    public String chat(List<AiMessage> messages, Map<String, Object> responseFormat) {
        return chat(messages, responseFormat, null);
    }

    @Override
    public String chat(List<AiMessage> messages, Map<String, Object> responseFormat, String customApiKey) {
        String keyToUse = (customApiKey != null && !customApiKey.trim().isEmpty()) ? customApiKey : apiKey();
        if (keyToUse == null || keyToUse.trim().isEmpty()) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, name() + " API key is not configured");
        }

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model());
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", maxTokens());
            requestBody.put("temperature", responseFormat != null ? 0.1 : temperature());
            if (responseFormat != null) {
                requestBody.put("response_format", responseFormat);
            }

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl() + "/chat/completions"))
                    .header("Authorization", "Bearer " + keyToUse)
                    .header("Content-Type", "application/json");
            applyHeaders(requestBuilder);

            HttpRequest request = requestBuilder
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            log.info("Sending chat request to {} model: {}", name(), model());
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("{} API error. Status: {}, Body: {}", name(), response.statusCode(), response.body());
                throw new AppException(HttpStatus.BAD_GATEWAY, name() + " returned an error");
            }

            JsonNode rootNode = objectMapper.readTree(response.body());
            JsonNode choices = rootNode.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                return choices.get(0).path("message").path("content").asText();
            }

            throw new AppException(HttpStatus.BAD_GATEWAY, "Invalid response from " + name());
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Exception occurred while calling {} API: {}", name(), e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to connect to " + name());
        }
    }
}
