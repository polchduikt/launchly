package com.launchly.integration.validator;

import com.launchly.common.exception.AppException;
import com.launchly.integration.entity.IntegrationType;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IntegrationConfigValidatorTest {

    private IntegrationConfigValidator validator;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        Validator beanValidator = Validation.buildDefaultValidatorFactory().getValidator();
        validator = new IntegrationConfigValidator(objectMapper, beanValidator);
    }

    @Test
    @DisplayName("Should validate valid webhook integration config")
    void validateConfig_Webhook_Success() {
        String validJson = "{\"url\":\"https://example.com/webhook\",\"events\":[\"ORDER_CREATED\"]}";
        validator.validateConfig(IntegrationType.WEBHOOK, validJson);
    }

    @Test
    @DisplayName("Should throw BadRequest when config JSON is empty or blank")
    void validateConfig_EmptyJson_ThrowsBadRequest() {
        assertThatThrownBy(() -> validator.validateConfig(IntegrationType.WEBHOOK, ""))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);

        assertThatThrownBy(() -> validator.validateConfig(IntegrationType.WEBHOOK, "{}"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should validate AI provider config")
    void validateConfig_AiProvider_Success() {
        String aiJson = "{\"apiKey\":\"sk-12345\"}";
        validator.validateConfig(IntegrationType.CHATGPT, aiJson);
    }
}
