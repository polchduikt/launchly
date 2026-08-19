package com.launchly.integration.validator;

import com.launchly.common.exception.AppException;
import com.launchly.integration.dto.AiProviderConfig;
import com.launchly.integration.dto.request.ExcelConfig;
import com.launchly.integration.dto.request.GoogleSheetsConfig;
import com.launchly.integration.dto.request.HotmartConfig;
import com.launchly.integration.dto.request.MailchimpConfig;
import com.launchly.integration.dto.request.WebhookConfig;
import com.launchly.integration.entity.IntegrationType;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class IntegrationConfigValidator {

    private final ObjectMapper objectMapper;
    private final Validator validator;

    public void validateConfig(IntegrationType type, String configStr) {
        if (configStr == null || configStr.trim().isEmpty() || "{}".equals(configStr.trim())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "integration.error.config_required");
        }
        try {
            Object configObj;
            if (type == IntegrationType.GOOGLE_SHEETS) {
                configObj = objectMapper.readValue(configStr, GoogleSheetsConfig.class);
            } else if (type == IntegrationType.WEBHOOK) {
                configObj = objectMapper.readValue(configStr, WebhookConfig.class);
            } else if (type == IntegrationType.EXCEL) {
                configObj = objectMapper.readValue(configStr, ExcelConfig.class);
            } else if (type == IntegrationType.GEMINI || type == IntegrationType.CHATGPT || type == IntegrationType.CLAUDE || type == IntegrationType.DEEPSEEK) {
                configObj = objectMapper.readValue(configStr, AiProviderConfig.class);
            } else if (type == IntegrationType.MAILCHIMP) {
                configObj = objectMapper.readValue(configStr, MailchimpConfig.class);
            } else if (type == IntegrationType.HOTMART) {
                configObj = objectMapper.readValue(configStr, HotmartConfig.class);
            } else {
                throw new AppException(HttpStatus.BAD_REQUEST, "integration.error.unsupported_type");
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
            throw new AppException(HttpStatus.BAD_REQUEST, "integration.error.invalid_config_json");
        }
    }
}
