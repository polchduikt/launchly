package com.launchly.integration.service.impl;

import com.launchly.integration.service.WebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookServiceImpl implements WebhookService {

    private final HttpClient httpClient;

    @Override
    public void send(String url, String secret, String payload) {
        String signature = calculateHmac(payload, secret);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("X-Launchly-Signature", signature)
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        int maxAttempts = 4;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                log.info("Sending webhook to {} (attempt {})", url, attempt);
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    log.info("Webhook delivered successfully to {} (attempt {}): status={}", url, attempt, response.statusCode());
                    return;
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Webhook dispatch interrupted for {}: {}", url, e.getMessage());
                return;
            } catch (Exception e) {
                log.warn("Webhook attempt {} failed with exception: {}", attempt, e.getMessage());
            }

            if (attempt < maxAttempts) {
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    log.error("Webhook dispatch retry interrupted for {}", url);
                    return;
                }
            }
        }

        log.error("Failed to deliver webhook to {} after {} attempts", url, maxAttempts);
    }

    private String calculateHmac(String payload, String secret) {
        if (secret == null || secret.trim().isEmpty()) {
            return "";
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hmacBytes);
        } catch (Exception e) {
            log.error("Failed to calculate HMAC-SHA256 signature: {}", e.getMessage(), e);
            return "";
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
