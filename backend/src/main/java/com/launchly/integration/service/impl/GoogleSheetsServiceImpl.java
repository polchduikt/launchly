package com.launchly.integration.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.repository.IntegrationRepository;
import com.launchly.integration.service.GoogleSheetsService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import javax.crypto.SecretKey;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleSheetsServiceImpl implements GoogleSheetsService {

    private final IntegrationRepository integrationRepository;
    private final BotRepository botRepository;
    private final EncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret:}")
    private String googleClientSecret;

    @Value("${app.integration.google.redirect-uri:http://localhost:8080/api/v1/integrations/google/callback}")
    private String googleRedirectUri;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public String buildAuthorizationUrl(Long botId, Long userId) {
        String stateToken = Jwts.builder()
                .claim("botId", botId)
                .claim("userId", userId)
                .issuedAt(new java.util.Date())
                .expiration(new java.util.Date(System.currentTimeMillis() + 300000)) // 5 minutes
                .signWith(getSigningKey())
                .compact();

        return "https://accounts.google.com/o/oauth2/v2/auth" +
                "?client_id=" + URLEncoder.encode(googleClientId, StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(googleRedirectUri, StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&scope=" + URLEncoder.encode("https://www.googleapis.com/auth/spreadsheets", StandardCharsets.UTF_8) +
                "&access_type=offline" +
                "&prompt=consent" +
                "&state=" + URLEncoder.encode(stateToken, StandardCharsets.UTF_8);
    }

    @Override
    @Transactional
    public Long authenticate(String stateToken, String code) {
        Long botId;
        Long userId;
        try {
            var claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(stateToken)
                    .getPayload();
            botId = claims.get("botId", Long.class);
            userId = claims.get("userId", Long.class);
        } catch (Exception e) {
            log.error("Google OAuth state token verification failed: {}", e.getMessage());
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid OAuth state parameter");
        }

        Bot bot = botRepository.findByIdAndUserId(botId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Access denied"));

        try {
            String requestBody = "code=" + URLEncoder.encode(code, StandardCharsets.UTF_8) +
                    "&client_id=" + URLEncoder.encode(googleClientId, StandardCharsets.UTF_8) +
                    "&client_secret=" + URLEncoder.encode(googleClientSecret, StandardCharsets.UTF_8) +
                    "&redirect_uri=" + URLEncoder.encode(googleRedirectUri, StandardCharsets.UTF_8) +
                    "&grant_type=authorization_code";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Failed Google OAuth token exchange. Status: {}, Body: {}", response.statusCode(), response.body());
                throw new AppException(HttpStatus.BAD_REQUEST, "Google authentication failed");
            }

            JsonNode tokenResponse = objectMapper.readTree(response.body());
            String accessToken = tokenResponse.path("access_token").asText();
            String refreshToken = tokenResponse.path("refresh_token").asText(null);
            long expiresIn = tokenResponse.path("expires_in").asLong(3599);

            Integration integration = integrationRepository.findByBotIdAndType(botId, IntegrationType.GOOGLE_SHEETS)
                    .orElseGet(() -> Integration.builder()
                            .name("Google Sheets")
                            .type(IntegrationType.GOOGLE_SHEETS)
                            .bot(bot)
                            .active(true)
                            .build());

            integration.setGoogleAccessToken(encryptionUtil.encrypt(accessToken));
            if (refreshToken != null && !refreshToken.isEmpty()) {
                integration.setGoogleRefreshToken(encryptionUtil.encrypt(refreshToken));
            }
            integration.setGoogleTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));

            integrationRepository.save(integration);
            log.info("Successfully configured Google Sheets integration for bot {}", botId);
            return botId;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google Sheets OAuth token exchange error: {}", e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Google token exchange failed");
        }
    }

    @Override
    @Transactional
    public void refreshTokenIfNeeded(Integration integration) {
        LocalDateTime expiresAt = integration.getGoogleTokenExpiresAt();
        if (expiresAt != null && expiresAt.isAfter(LocalDateTime.now().plusMinutes(1))) {
            return;
        }

        String encryptedRefreshToken = integration.getGoogleRefreshToken();
        if (encryptedRefreshToken == null || encryptedRefreshToken.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "No refresh token available. Re-authenticate Google Sheets.");
        }

        String decryptedRefreshToken = encryptionUtil.decrypt(encryptedRefreshToken);

        try {
            String requestBody = "refresh_token=" + URLEncoder.encode(decryptedRefreshToken, StandardCharsets.UTF_8) +
                    "&client_id=" + URLEncoder.encode(googleClientId, StandardCharsets.UTF_8) +
                    "&client_secret=" + URLEncoder.encode(googleClientSecret, StandardCharsets.UTF_8) +
                    "&grant_type=refresh_token";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Failed to refresh Google token. Status: {}, Body: {}", response.statusCode(), response.body());
                throw new AppException(HttpStatus.BAD_REQUEST, "Failed to refresh Google session");
            }

            JsonNode tokenResponse = objectMapper.readTree(response.body());
            String accessToken = tokenResponse.path("access_token").asText();
            long expiresIn = tokenResponse.path("expires_in").asLong(3599);
            String newRefreshToken = tokenResponse.path("refresh_token").asText(null);

            integration.setGoogleAccessToken(encryptionUtil.encrypt(accessToken));
            integration.setGoogleTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
            if (newRefreshToken != null && !newRefreshToken.isEmpty()) {
                integration.setGoogleRefreshToken(encryptionUtil.encrypt(newRefreshToken));
            }

            integrationRepository.save(integration);
            log.info("Successfully refreshed Google Sheets access token for integration {}", integration.getId());

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google token refresh error for integration {}: {}", integration.getId(), e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to refresh Google token");
        }
    }

    @Override
    @Transactional
    public void appendRow(Integration integration, List<Object> values) {
        refreshTokenIfNeeded(integration);

        String configStr = integration.getConfig();
        String spreadsheetId = null;
        String sheetName = "Sheet1";

        if (configStr != null) {
            try {
                JsonNode configObj = objectMapper.readTree(configStr);
                spreadsheetId = configObj.path("spreadsheetId").asText(null);
                sheetName = configObj.path("sheetName").asText("Sheet1");
            } catch (Exception e) {
                log.error("Failed to parse config JSON for integration {}: {}", integration.getId(), e.getMessage());
            }
        }

        if (spreadsheetId == null || spreadsheetId.trim().isEmpty()) {
            log.warn("Integration {} missing spreadsheetId. Skipping append.", integration.getId());
            return;
        }

        try {
            String decryptedAccessToken = encryptionUtil.decrypt(integration.getGoogleAccessToken());

            Map<String, Object> bodyMap = new HashMap<>();
            bodyMap.put("range", sheetName);
            bodyMap.put("majorDimension", "ROWS");
            bodyMap.put("values", List.of(values));

            String requestBody = objectMapper.writeValueAsString(bodyMap);
            String encodedSheetName = URLEncoder.encode(sheetName, StandardCharsets.UTF_8);

            String url = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheetId +
                    "/values/" + encodedSheetName + ":append?valueInputOption=USER_ENTERED";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + decryptedAccessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Failed to append row to Google Sheets. Status: {}, Body: {}", response.statusCode(), response.body());
            } else {
                log.info("Successfully appended row to Google Sheet {} for integration {}", sheetName, integration.getId());
            }

        } catch (Exception e) {
            log.error("Error writing to Google Sheets in integration {}: {}", integration.getId(), e.getMessage(), e);
        }
    }
}
