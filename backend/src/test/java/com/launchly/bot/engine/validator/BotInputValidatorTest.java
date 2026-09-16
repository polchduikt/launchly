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
        assertThat(validator.validate("0", "Number")).isTrue();
        assertThat(validator.validate("abc", "Number")).isFalse();
        assertThat(validator.validate("", "Number")).isFalse();
        assertThat(validator.validate(null, "Number")).isFalse();
        assertThat(validator.validate("123a45", "Number")).isFalse();
        assertThat(validator.validate("1234567890123456789012345", "Number")).isFalse();
    }

    @Test
    @DisplayName("Should validate email correctly")
    void shouldValidateEmail() {
        assertThat(validator.validate("user@example.com", "Email")).isTrue();
        assertThat(validator.validate("invalid-email", "Email")).isFalse();
        assertThat(validator.validate("user@", "Email")).isFalse();
        assertThat(validator.validate("@example.com", "Email")).isFalse();
        assertThat(validator.validate("a".repeat(250) + "@example.com", "Email")).isFalse();
    }

    @Test
    @DisplayName("Should validate phone correctly")
    void shouldValidatePhone() {
        assertThat(validator.validate("+380991234567", "Phone")).isTrue();
        assertThat(validator.validate("123456", "Phone")).isTrue();
        assertThat(validator.validate("not_a_phone", "Phone")).isFalse();
        assertThat(validator.validate("+", "Phone")).isFalse();
        assertThat(validator.validate("+3809912345678901234567890123456", "Phone")).isFalse();
    }

    @Test
    @DisplayName("Should validate text length limit")
    void shouldValidateTextLength() {
        assertThat(validator.validate("Hello world", "Text")).isTrue();
        assertThat(validator.validate("a".repeat(2000), "Text")).isTrue();
        assertThat(validator.validate("a".repeat(2001), "Text")).isFalse();
    }

    @Test
    @DisplayName("Should reject text for image validation")
    void shouldRejectTextForImage() {
        assertThat(validator.validate("some text", "Image")).isFalse();
        assertThat(validator.validate("photo.jpg", "Photo")).isFalse();
    }

    @Test
    @DisplayName("Should return localized error messages from MessageUtils")
    void shouldReturnLocalizedErrorMessage() {
        when(messageUtils.getMessage(eq("bot.validation.image")))
                .thenReturn("Localized image error");
        when(messageUtils.getMessage(eq("bot.validation.email")))
                .thenReturn("Localized email error");
        when(messageUtils.getMessage(eq("bot.validation.phone")))
                .thenReturn("Localized phone error");
        when(messageUtils.getMessage(eq("bot.validation.number")))
                .thenReturn("Localized number error");
        when(messageUtils.getMessage(eq("bot.validation.image_size_limit")))
                .thenReturn("Localized image size error");
        when(messageUtils.getMessage(eq("bot.validation.image_invalid_format")))
                .thenReturn("Localized image format error");
        when(messageUtils.getMessage(eq("bot.validation.text_length_limit")))
                .thenReturn("Localized text length error");

        assertThat(validator.getValidationErrorMessage("Image")).isEqualTo("Localized image error");
        assertThat(validator.getValidationErrorMessage("Photo")).isEqualTo("Localized image error");
        assertThat(validator.getValidationErrorMessage("Email")).isEqualTo("Localized email error");
        assertThat(validator.getValidationErrorMessage("Phone")).isEqualTo("Localized phone error");
        assertThat(validator.getValidationErrorMessage("Number")).isEqualTo("Localized number error");
        assertThat(validator.getImageSizeErrorMessage()).isEqualTo("Localized image size error");
        assertThat(validator.getImageFormatErrorMessage()).isEqualTo("Localized image format error");
        assertThat(validator.getTextLengthErrorMessage()).isEqualTo("Localized text length error");
    }
}
