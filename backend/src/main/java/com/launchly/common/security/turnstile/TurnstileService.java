package com.launchly.common.security.turnstile;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TurnstileService {

    private final TurnstileProperties properties;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TurnstileResponse(
            boolean success,
            @JsonProperty("challenge_ts") String challengeTs,
            String hostname,
            @JsonProperty("error-codes") List<String> errorCodes,
            String action,
            String cdata
    ) {}

    public boolean verifyToken(String token) {
        return verifyToken(token, null);
    }

    public boolean verifyToken(String token, String remoteIp) {
        if (!properties.isEnabled()) {
            return true;
        }

        if (token == null || token.isBlank()) {
            log.warn("Turnstile validation failed: missing token");
            return false;
        }

        try {
            Map<String, String> payload = new HashMap<>();
            payload.put("secret", properties.getSecretKey());
            payload.put("response", token);
            if (remoteIp != null && !remoteIp.isBlank()) {
                payload.put("remoteip", remoteIp);
            }

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(properties.getVerifyUrl()))
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Turnstile API returned non-200 status code: {}", response.statusCode());
                return false;
            }

            TurnstileResponse turnstileResponse = objectMapper.readValue(response.body(), TurnstileResponse.class);
            if (!turnstileResponse.success()) {
                log.warn("Turnstile token verification failed: error codes = {}", turnstileResponse.errorCodes());
                return false;
            }

            return true;
        } catch (Exception e) {
            log.error("Error during Turnstile token verification: {}", e.getMessage(), e);
            return false;
        }
    }
}
