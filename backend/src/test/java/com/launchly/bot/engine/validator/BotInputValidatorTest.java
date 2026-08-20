package com.launchly.bot.engine.validator;

import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BotInputValidatorTest {

    @Mock
    private MessageUtils messageUtils;

    private BotInputValidator validator;

    @BeforeEach
    void setUp() {
        validator = new BotInputValidator(messageUtils);
    }

    @Test
    @DisplayName("Should validate numbers correctly")
    void shouldValidateNumbers() {
        assertThat(validator.validate("123", "Number")).isTrue();
        assertThat(validator.validate("-45.67", "Number")).isTrue();
        assertThat(validator.validate("abc", "Number")).isFalse();
        assertThat(validator.validate("", "Number")).isFalse();
        assertThat(validator.validate(null, "Number")).isFalse();
    }

    @Test
    @DisplayName("Should validate email correctly")
    void shouldValidateEmail() {
        assertThat(validator.validate("user@example.com", "Email")).isTrue();
        assertThat(validator.validate("invalid-email", "Email")).isFalse();
    }

    @Test
    @DisplayName("Should validate phone correctly")
    void shouldValidatePhone() {
        assertThat(validator.validate("+380991234567", "Phone")).isTrue();
        assertThat(validator.validate("123456", "Phone")).isTrue();
        assertThat(validator.validate("not_a_phone", "Phone")).isFalse();
    }

    @Test
    @DisplayName("Should return localized error messages from MessageUtils")
    void shouldReturnLocalizedErrorMessage() {
        when(messageUtils.getMessageWithDefault(eq("bot.validation.email"), anyString()))
                .thenReturn("Localized email error");
        when(messageUtils.getMessageWithDefault(eq("bot.validation.phone"), anyString()))
                .thenReturn("Localized phone error");
        when(messageUtils.getMessageWithDefault(eq("bot.validation.number"), anyString()))
                .thenReturn("Localized number error");

        assertThat(validator.getValidationErrorMessage("Email")).isEqualTo("Localized email error");
        assertThat(validator.getValidationErrorMessage("Phone")).isEqualTo("Localized phone error");
        assertThat(validator.getValidationErrorMessage("Number")).isEqualTo("Localized number error");
    }
}
