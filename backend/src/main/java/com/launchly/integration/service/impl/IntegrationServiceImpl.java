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
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class IntegrationServiceImpl implements IntegrationService {

    private final IntegrationRepository integrationRepository;
    private final BotRepository botRepository;
    private final PlanLimitService planLimitService;
    private final IntegrationMapper integrationMapper;
    private final ObjectMapper objectMapper;
    private final Validator validator;

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
            Object configObj;
            if (type == IntegrationType.GOOGLE_SHEETS) {
                configObj = objectMapper.readValue(configStr, GoogleSheetsConfig.class);
            } else if (type == IntegrationType.WEBHOOK) {
                configObj = objectMapper.readValue(configStr, WebhookConfig.class);
            } else if (type == IntegrationType.EXCEL) {
                configObj = objectMapper.readValue(configStr, ExcelConfig.class);
            } else {
                throw new AppException(HttpStatus.BAD_REQUEST, "Unsupported integration type");
            }

            var violations = validator.validate(configObj);
            if (!violations.isEmpty()) {
                String errorMsg = violations.stream()
                        .map(violation -> {
                            String msg = violation.getMessage();
                            if ("Invalid event".equals(msg)) {
                                return msg + ": " + violation.getInvalidValue();
                            }
                            return msg;
                        })
                        .collect(Collectors.joining(", "));
                throw new AppException(HttpStatus.BAD_REQUEST, errorMsg);
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid config JSON format");
        }
    }
}
