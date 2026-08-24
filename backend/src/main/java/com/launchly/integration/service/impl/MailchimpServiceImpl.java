package com.launchly.integration.service.impl;

import tools.jackson.databind.ObjectMapper;
import com.launchly.integration.dto.request.MailchimpConfig;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.service.MailchimpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailchimpServiceImpl implements MailchimpService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Override
    public void addOrUpdateSubscriber(Integration integration, String email, String firstName, String lastName, String phone, List<String> tags) {
        if (integration == null || integration.getConfig() == null || email == null || email.trim().isEmpty()) {
            return;
        }

        try {
            MailchimpConfig config = objectMapper.readValue(integration.getConfig(), MailchimpConfig.class);
            List<String> combinedTags = tags;
            if (config.tags() != null && !config.tags().isEmpty()) {
                if (combinedTags == null) {
                    combinedTags = config.tags();
                } else {
                    combinedTags = new java.util.ArrayList<>(combinedTags);
                    for (String t : config.tags()) {
                        if (!combinedTags.contains(t)) {
                            combinedTags.add(t);
                        }
                    }
                }
            }
            addOrUpdateSubscriber(config.apiKey(), config.listId(), config.serverPrefix(), email, firstName, lastName, phone, combinedTags);
        } catch (Exception e) {
            log.error("Failed to parse Mailchimp config for integration {}: {}", integration.getId(), e.getMessage());
        }
    }

    @Override
    public void addOrUpdateSubscriber(String apiKey, String listId, String serverPrefix, String email, String firstName, String lastName, String phone, List<String> tags) {
        if (apiKey == null || apiKey.trim().isEmpty() || listId == null || listId.trim().isEmpty() || email == null || email.trim().isEmpty()) {
            log.warn("Missing required parameters for Mailchimp subscribe");
            return;
        }

        String trimmedEmail = email.trim().toLowerCase();
        String dc = resolveDataCenter(apiKey, serverPrefix);
        String md5Hash = calculateMd5(trimmedEmail);

        String url = String.format("https://%s.api.mailchimp.com/3.0/lists/%s/members/%s", dc, listId.trim(), md5Hash);

        try {
            Map<String, Object> body = new HashMap<>();
            body.put("email_address", trimmedEmail);
            body.put("status_if_new", "subscribed");

            Map<String, Object> mergeFields = new HashMap<>();
            if (firstName != null && !firstName.trim().isEmpty()) {
                mergeFields.put("FNAME", firstName.trim());
            }
            if (lastName != null && !lastName.trim().isEmpty()) {
                mergeFields.put("LNAME", lastName.trim());
            }
            if (phone != null && !phone.trim().isEmpty()) {
                mergeFields.put("PHONE", phone.trim());
            }
            if (!mergeFields.isEmpty()) {
                body.put("merge_fields", mergeFields);
            }

            if (tags != null && !tags.isEmpty()) {
                body.put("tags", tags);
            }

            String jsonPayload = objectMapper.writeValueAsString(body);
            String authHeader = "Basic " + Base64.getEncoder().encodeToString(("anystring:" + apiKey.trim()).getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", authHeader)
                    .header("Content-Type", "application/json")
                    .PUT(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Successfully synced subscriber {} to Mailchimp list {}", trimmedEmail, listId);
            } else {
                log.warn("Failed to sync subscriber {} to Mailchimp. Status: {}, Response: {}", trimmedEmail, response.statusCode(), response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Mailchimp request interrupted for email {}: {}", trimmedEmail, e.getMessage());
        } catch (Exception e) {
            log.error("Error executing Mailchimp API request for email {}: {}", trimmedEmail, e.getMessage(), e);
        }
    }

    private String resolveDataCenter(String apiKey, String serverPrefix) {
        if (serverPrefix != null && !serverPrefix.trim().isEmpty()) {
            return serverPrefix.trim();
        }
        if (apiKey != null && apiKey.contains("-")) {
            String[] parts = apiKey.split("-");
            if (parts.length > 1 && !parts[1].trim().isEmpty()) {
                return parts[1].trim();
            }
        }
        return "us1";
    }

    @SuppressWarnings("java:S4790") // Mailchimp API protocol explicitly mandates MD5 email hashing
    private String calculateMd5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] messageDigest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            BigInteger no = new BigInteger(1, messageDigest);
            StringBuilder hashtext = new StringBuilder(no.toString(16));
            while (hashtext.length() < 32) {
                hashtext.insert(0, "0");
            }
            return hashtext.toString();
        } catch (Exception e) {
            return input;
        }
    }
}
