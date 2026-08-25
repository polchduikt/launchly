package com.launchly.integration.service.impl;

import tools.jackson.databind.ObjectMapper;
import com.launchly.bot.repository.BotRepository;
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.repository.IntegrationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.net.http.HttpClient;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@ExtendWith(MockitoExtension.class)
class GoogleSheetsServiceImplTest {

    @Mock
    private IntegrationRepository integrationRepository;

    @Mock
    private BotRepository botRepository;

    @Mock
    private EncryptionUtil encryptionUtil;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private HttpClient httpClient;

    @InjectMocks
    private GoogleSheetsServiceImpl googleSheetsService;

    @Test
    @DisplayName("Should execute appendRowFallback gracefully when circuit opens")
    void appendRowFallback_ExecutesGracefully() {
        Integration integration = new Integration();
        integration.setId(10L);

        assertDoesNotThrow(() -> googleSheetsService.appendRowFallback(
                integration, "sheet123", "Sheet1", List.of("data"), new RuntimeException("Google API down")));
    }

    @Test
    @DisplayName("Should return empty list when getSpreadsheetsFallback is triggered")
    void getSpreadsheetsFallback_ReturnsEmptyList() {
        List<Map<String, String>> result = googleSheetsService.getSpreadsheetsFallback(1L, new RuntimeException("Google API down"));

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should return empty list when getWorksheetsFallback is triggered")
    void getWorksheetsFallback_ReturnsEmptyList() {
        List<String> result = googleSheetsService.getWorksheetsFallback(1L, "sheet123", new RuntimeException("Google API down"));

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should return empty list when getHeadersFallback is triggered")
    void getHeadersFallback_ReturnsEmptyList() {
        List<String> result = googleSheetsService.getHeadersFallback(1L, "sheet123", "Sheet1", new RuntimeException("Google API down"));

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should return empty list when getSheetValuesFallback is triggered")
    void getSheetValuesFallback_ReturnsEmptyList() {
        List<List<Object>> result = googleSheetsService.getSheetValuesFallback(1L, "sheet123", "Sheet1", new RuntimeException("Google API down"));

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should execute updateCellFallback gracefully when circuit opens")
    void updateCellFallback_ExecutesGracefully() {
        assertDoesNotThrow(() -> googleSheetsService.updateCellFallback(
                1L, "sheet123", "Sheet1", "A1", "value", new RuntimeException("Google API down")));
    }
}
