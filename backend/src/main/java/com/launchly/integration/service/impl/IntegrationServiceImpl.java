package com.launchly.integration.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.common.exception.AppException;
import com.launchly.integration.dto.request.ExcelConfig;
import com.launchly.integration.dto.request.GoogleSheetsConfig;
import com.launchly.integration.dto.request.IntegrationCreateRequest;
import com.launchly.integration.dto.request.WebhookConfig;
import com.launchly.integration.dto.response.IntegrationResponse;
import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.mapper.IntegrationMapper;
import com.launchly.integration.repository.IntegrationRepository;
import com.launchly.integration.service.IntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class IntegrationServiceImpl implements IntegrationService {

    private final IntegrationRepository integrationRepository;
    private final BotRepository botRepository;
    private final PlanLimitService planLimitService;
    private final IntegrationMapper integrationMapper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<IntegrationResponse> getIntegrations(Long userId) {
        List<Integration> integrations = integrationRepository.findAllByBotUserId(userId);
        return integrationMapper.toResponseList(integrations);
    }

    @Override
    @Transactional
    public IntegrationResponse createIntegration(IntegrationCreateRequest request, Long userId) {
        planLimitService.checkIntegrationAccess(userId);
        Bot bot = validateBotOwnership(request.botId(), userId);

        String configStr = null;
        if (request.config() != null) {
            try {
                configStr = objectMapper.writeValueAsString(request.config());
            } catch (Exception e) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Invalid config JSON format");
            }
        }

        validateConfig(request.type(), configStr);

        Integration integration = Integration.builder()
                .name(request.name())
                .type(request.type())
                .bot(bot)
                .config(configStr)
                .active(true)
                .build();

        integration = integrationRepository.save(integration);
        return integrationMapper.toResponse(integration);
    }

    @Override
    @Transactional
    public IntegrationResponse updateIntegration(Long id, IntegrationCreateRequest request, Long userId) {
        Integration integration = integrationRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Integration not found"));

        validateBotOwnership(integration.getBot().getId(), userId);

        String configStr = null;
        if (request.config() != null) {
            try {
                configStr = objectMapper.writeValueAsString(request.config());
            } catch (Exception e) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Invalid config JSON format");
            }
        }

        validateConfig(integration.getType(), configStr);

        integration.setName(request.name());
        integration.setConfig(configStr);

        integration = integrationRepository.save(integration);
        return integrationMapper.toResponse(integration);
    }

    @Override
    @Transactional
    public void deleteIntegration(Long id, Long userId) {
        Integration integration = integrationRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Integration not found"));

        validateBotOwnership(integration.getBot().getId(), userId);
        integrationRepository.delete(integration);
    }

    @Override
    @Transactional
    public IntegrationResponse toggleIntegration(Long id, Long userId) {
        Integration integration = integrationRepository.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Integration not found"));

        validateBotOwnership(integration.getBot().getId(), userId);
        integration.setActive(!integration.isActive());

        integration = integrationRepository.save(integration);
        return integrationMapper.toResponse(integration);
    }

    private Bot validateBotOwnership(Long botId, Long userId) {
        return botRepository.findByIdAndUserId(botId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Bot not found or access denied"));
    }

    private void validateConfig(IntegrationType type, String configStr) {
        if (configStr == null || configStr.trim().isEmpty() || "{}".equals(configStr.trim())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Configuration details are required");
        }
        try {
            if (type == IntegrationType.GOOGLE_SHEETS) {
                GoogleSheetsConfig config = objectMapper.readValue(configStr, GoogleSheetsConfig.class);
                if (config.spreadsheetId() == null || config.spreadsheetId().trim().isEmpty()) {
                    throw new AppException(HttpStatus.BAD_REQUEST, "spreadsheetId is required for Google Sheets");
                }
                if (config.sheetName() == null || config.sheetName().trim().isEmpty()) {
                    throw new AppException(HttpStatus.BAD_REQUEST, "sheetName is required for Google Sheets");
                }
                if (!"ORDERS".equalsIgnoreCase(config.dataType()) && !"LEADS".equalsIgnoreCase(config.dataType())) {
                    throw new AppException(HttpStatus.BAD_REQUEST, "dataType must be ORDERS or LEADS for Google Sheets");
                }
            } else if (type == IntegrationType.WEBHOOK) {
                WebhookConfig config = objectMapper.readValue(configStr, WebhookConfig.class);
                if (config.url() == null || config.url().trim().isEmpty() || (!config.url().startsWith("http://") && !config.url().startsWith("https://"))) {
                    throw new AppException(HttpStatus.BAD_REQUEST, "A valid Webhook URL starting with http/https is required");
                }
                if (config.events() == null || config.events().isEmpty()) {
                    throw new AppException(HttpStatus.BAD_REQUEST, "At least one target event is required for Webhooks");
                }
                for (String eventName : config.events()) {
                    if (!"ORDER_CREATED".equalsIgnoreCase(eventName) && !"LEAD_CREATED".equalsIgnoreCase(eventName)) {
                        throw new AppException(HttpStatus.BAD_REQUEST, "Invalid event: " + eventName);
                    }
                }
            } else if (type == IntegrationType.EXCEL) {
                ExcelConfig config = objectMapper.readValue(configStr, ExcelConfig.class);
                if (!"ORDERS".equalsIgnoreCase(config.dataType()) && !"LEADS".equalsIgnoreCase(config.dataType())) {
                    throw new AppException(HttpStatus.BAD_REQUEST, "dataType must be ORDERS or LEADS for Excel export config");
                }
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid config JSON format");
        }
    }
}
