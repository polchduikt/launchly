package com.launchly.integration.service.impl;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
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
import java.util.*;

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
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 300000))
                .signWith(getSigningKey())
                .compact();

        return "https://accounts.google.com/o/oauth2/v2/auth" +
                "?client_id=" + URLEncoder.encode(googleClientId, StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(googleRedirectUri, StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&scope=" + URLEncoder.encode("openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.email", StandardCharsets.UTF_8) +
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
            throw new AppException(HttpStatus.BAD_REQUEST, "integration.error.google_oauth_state");
        }

        Bot bot = botRepository.findByIdAndUserId(botId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "bot.error.access_denied"));

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
                throw new AppException(HttpStatus.BAD_REQUEST, "integration.error.google_auth_failed");
            }

            JsonNode tokenResponse = objectMapper.readTree(response.body());
            String accessToken = tokenResponse.path("access_token").asText();
            String refreshToken = tokenResponse.path("refresh_token").asText(null);
            String idToken = tokenResponse.path("id_token").asText(null);
            long expiresIn = tokenResponse.path("expires_in").asLong(3599);

            String email = extractEmailFromIdToken(idToken);
            Integration integration = integrationRepository.findByBotIdAndType(botId, IntegrationType.GOOGLE_SHEETS)
                    .orElseGet(() -> Integration.builder()
                            .bot(bot)
                            .type(IntegrationType.GOOGLE_SHEETS)
                            .name("Google Sheets")
                            .active(true)
                            .build());

            integration.setGoogleAccessToken(encryptionUtil.encrypt(accessToken));
            if (refreshToken != null && !refreshToken.isEmpty()) {
                integration.setGoogleRefreshToken(encryptionUtil.encrypt(refreshToken));
            }
            integration.setGoogleTokenExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));

            Map<String, String> configMap = new HashMap<>();
            copyConfigValue(integration.getConfig(), configMap, "spreadsheetId");
            copyConfigValue(integration.getConfig(), configMap, "sheetName");
            configMap.put("email", email != null ? email : "");
            integration.setConfig(objectMapper.writeValueAsString(configMap));


            integrationRepository.save(integration);
            log.info("Successfully configured Google Sheets integration for bot {}", botId);
            return botId;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google Sheets OAuth token exchange error: {}", e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "integration.error.google_token_exchange_failed");
        }
    }

    private String extractEmailFromIdToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            return null;
        }
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) {
                return null;
            }
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            JsonNode claims = objectMapper.readTree(payload);
            String email = claims.path("email").asText(null);
            return email != null && !email.isBlank() ? email : null;
        } catch (Exception e) {
            log.warn("Failed to extract email from Google ID token: {}", e.getMessage());
            return null;
        }
    }

    private void copyConfigValue(String configStr, Map<String, String> target, String key) {
        if (configStr == null || configStr.isBlank()) {
            return;
        }
        try {
            String value = objectMapper.readTree(configStr).path(key).asText(null);
            if (value != null && !value.isBlank()) {
                target.put(key, value);
            }
        } catch (Exception e) {
            log.warn("Failed to read Google Sheets config key {}: {}", key, e.getMessage());
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
            throw new AppException(HttpStatus.BAD_REQUEST, "integration.error.google_no_refresh_token");
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
                throw new AppException(HttpStatus.BAD_REQUEST, "integration.error.google_refresh_failed");
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
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "integration.error.google_token_refresh_failed");
        }
    }

    @Override
    @Transactional
    public void appendRow(Integration integration, String spreadsheetId, String sheetName, List<Object> values) {
        refreshTokenIfNeeded(integration);

        String activeSpreadsheetId = spreadsheetId;
        String activeSheetName = sheetName != null && !sheetName.trim().isEmpty() ? sheetName : "Sheet1";

        if (activeSpreadsheetId == null || activeSpreadsheetId.trim().isEmpty()) {
            String configStr = integration.getConfig();
            if (configStr != null) {
                try {
                    JsonNode configObj = objectMapper.readTree(configStr);
                    activeSpreadsheetId = configObj.path("spreadsheetId").asText(null);
                    if (sheetName == null || sheetName.trim().isEmpty()) {
                        activeSheetName = configObj.path("sheetName").asText("Sheet1");
                    }
                } catch (Exception e) {
                    log.error("Failed to parse config JSON for integration {}: {}", integration.getId(), e.getMessage());
                }
            }
        }

        if (activeSpreadsheetId == null || activeSpreadsheetId.trim().isEmpty()) {
            log.warn("Integration {} missing spreadsheetId. Skipping append.", integration.getId());
            return;
        }

        try {
            String decryptedAccessToken = encryptionUtil.decrypt(integration.getGoogleAccessToken());

            Map<String, Object> bodyMap = new HashMap<>();
            bodyMap.put("range", activeSheetName);
            bodyMap.put("majorDimension", "ROWS");
            bodyMap.put("values", List.of(values));

            String requestBody = objectMapper.writeValueAsString(bodyMap);
            String encodedSheetName = URLEncoder.encode(activeSheetName, StandardCharsets.UTF_8);

            String url = "https://sheets.googleapis.com/v4/spreadsheets/" + activeSpreadsheetId +
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
                throw new AppException(HttpStatus.BAD_REQUEST, "integration.error.google_append_failed");
            } else {
                log.info("Successfully appended row to Google Sheet {} for integration {}", activeSheetName, integration.getId());
            }

        } catch (Exception e) {
            log.error("Error writing to Google Sheets in integration {}: {}", integration.getId(), e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public List<Map<String, String>> getSpreadsheets(Long botId) {
        Integration integration = integrationRepository.findByBotIdAndType(botId, IntegrationType.GOOGLE_SHEETS)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "integration.error.not_found"));
        refreshTokenIfNeeded(integration);

        try {
            String decryptedAccessToken = encryptionUtil.decrypt(integration.getGoogleAccessToken());
            String url = "https://www.googleapis.com/drive/v3/files" +
                    "?q=mimeType%3D%27application%2Fvnd.google-apps.spreadsheet%27%20and%20trashed%3Dfalse" +
                    "&pageSize=100" +
                    "&fields=files(id%2Cname)";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + decryptedAccessToken)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.error("Failed to fetch spreadsheets from Google Drive. Status: {}, Body: {}", response.statusCode(), response.body());
                if (response.body().contains("\"reason\": \"SERVICE_DISABLED\"")) {
                    throw new AppException(HttpStatus.BAD_REQUEST, "integration.error.google_drive_enable");
                }
                if (response.statusCode() == 401 || response.statusCode() == 403) {
                    throw new AppException(HttpStatus.BAD_REQUEST, "integration.error.google_drive_grant");
                }
                throw new AppException(HttpStatus.BAD_REQUEST, "integration.error.google_load_failed");
            }


            JsonNode responseJson = objectMapper.readTree(response.body());
            JsonNode filesNode = responseJson.path("files");
            List<Map<String, String>> spreadsheets = new ArrayList<>();
            if (filesNode.isArray()) {
                for (JsonNode file : filesNode) {
                    Map<String, String> map = new HashMap<>();
                    map.put("id", file.path("id").asText());
                    map.put("name", file.path("name").asText());
                    spreadsheets.add(map);
                }
            }
            return spreadsheets;
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching spreadsheets for bot {}: {}", botId, e.getMessage(), e);
            return List.of();
        }
    }

    @Override
    @Transactional
    public List<String> getWorksheets(Long botId, String spreadsheetId) {
        Integration integration = integrationRepository.findByBotIdAndType(botId, IntegrationType.GOOGLE_SHEETS)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Google Sheets integration not connected"));
        refreshTokenIfNeeded(integration);

        try {
            String decryptedAccessToken = encryptionUtil.decrypt(integration.getGoogleAccessToken());
            String url = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheetId;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + decryptedAccessToken)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.error("Failed to fetch sheets metadata. Status: {}, Body: {}", response.statusCode(), response.body());
                return List.of();
            }

            JsonNode responseJson = objectMapper.readTree(response.body());
            JsonNode sheetsNode = responseJson.path("sheets");
            List<String> sheets = new ArrayList<>();
            if (sheetsNode.isArray()) {
                for (JsonNode sheet : sheetsNode) {
                    String title = sheet.path("properties").path("title").asText();
                    if (!title.isEmpty()) {
                        sheets.add(title);
                    }
                }
            }
            return sheets;
        } catch (Exception e) {
            log.error("Error fetching worksheets for spreadsheet {}: {}", spreadsheetId, e.getMessage(), e);
            return List.of();
        }
    }

    @Override
    @Transactional
    public List<String> getHeaders(Long botId, String spreadsheetId, String worksheetName) {
        Integration integration = integrationRepository.findByBotIdAndType(botId, IntegrationType.GOOGLE_SHEETS)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Google Sheets integration not connected"));
        refreshTokenIfNeeded(integration);

        try {
            String decryptedAccessToken = encryptionUtil.decrypt(integration.getGoogleAccessToken());
            String encodedSheetName = URLEncoder.encode(worksheetName, StandardCharsets.UTF_8);
            String url = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheetId + "/values/" + encodedSheetName + "!1:1";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + decryptedAccessToken)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.error("Failed to fetch sheet headers. Status: {}, Body: {}", response.statusCode(), response.body());
                return List.of();
            }

            JsonNode responseJson = objectMapper.readTree(response.body());
            JsonNode valuesNode = responseJson.path("values");
            List<String> headers = new ArrayList<>();
            if (valuesNode.isArray() && valuesNode.size() > 0) {
                JsonNode firstRow = valuesNode.get(0);
                if (firstRow.isArray()) {
                    for (JsonNode cell : firstRow) {
                        headers.add(cell.asText());
                    }
                }
            }
            return headers;
        } catch (Exception e) {
            log.error("Error fetching headers for sheet {} in spreadsheet {}: {}", worksheetName, spreadsheetId, e.getMessage(), e);
            return List.of();
        }
    }

    @Override
    @Transactional
    public List<List<Object>> getSheetValues(Long botId, String spreadsheetId, String worksheetName) {
        Integration integration = integrationRepository.findByBotIdAndType(botId, IntegrationType.GOOGLE_SHEETS)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Google Sheets integration not connected"));
        refreshTokenIfNeeded(integration);

        try {
            String decryptedAccessToken = encryptionUtil.decrypt(integration.getGoogleAccessToken());
            String encodedSheetName = URLEncoder.encode(worksheetName, StandardCharsets.UTF_8);
            String url = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheetId + "/values/" + encodedSheetName + "!A:Z";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + decryptedAccessToken)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.error("Failed to fetch sheet values. Status: {}, Body: {}", response.statusCode(), response.body());
                return List.of();
            }

            JsonNode responseJson = objectMapper.readTree(response.body());
            JsonNode valuesNode = responseJson.path("values");
            List<List<Object>> rowList = new ArrayList<>();
            if (valuesNode.isArray()) {
                for (JsonNode rowNode : valuesNode) {
                    List<Object> row = new ArrayList<>();
                    if (rowNode.isArray()) {
                        for (JsonNode cell : rowNode) {
                            row.add(cell.asText());
                        }
                    }
                    rowList.add(row);
                }
            }
            return rowList;
        } catch (Exception e) {
            log.error("Error fetching values for sheet {} in spreadsheet {}: {}", worksheetName, spreadsheetId, e.getMessage(), e);
            return List.of();
        }
    }

    @Override
    @Transactional
    public void updateCell(Long botId, String spreadsheetId, String worksheetName, String cellReference, Object value) {
        Integration integration = integrationRepository.findByBotIdAndType(botId, IntegrationType.GOOGLE_SHEETS)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Google Sheets integration not connected"));
        refreshTokenIfNeeded(integration);

        try {
            String decryptedAccessToken = encryptionUtil.decrypt(integration.getGoogleAccessToken());
            String fullRange = worksheetName + "!" + cellReference;
            String encodedRange = URLEncoder.encode(fullRange, StandardCharsets.UTF_8);
            String url = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheetId + 
                    "/values/" + encodedRange + "?valueInputOption=USER_ENTERED";

            Map<String, Object> bodyMap = new HashMap<>();
            bodyMap.put("range", fullRange);
            bodyMap.put("majorDimension", "ROWS");
            bodyMap.put("values", List.of(List.of(value != null ? value : "")));

            String requestBody = objectMapper.writeValueAsString(bodyMap);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + decryptedAccessToken)
                    .header("Content-Type", "application/json")
                    .PUT(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.error("Failed to update cell {}. Status: {}, Body: {}", fullRange, response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Error updating cell {} in spreadsheet {}: {}", cellReference, spreadsheetId, e.getMessage(), e);
        }
    }
}
