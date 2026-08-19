package com.launchly.common.validation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TelegramTokenValidatorTest {

    private TelegramTokenValidator validator;

    @BeforeEach
    void setUp() {
        validator = new TelegramTokenValidator();
    }

    @Test
    @DisplayName("Should validate valid telegram bot tokens")
    void isValid_ValidTokens_ReturnsTrue() {
        assertThat(validator.isValid("123456789:ABCDefghIJklmnOPqrstUVwxyz123456789", null)).isTrue();
        assertThat(validator.isValid(null, null)).isTrue();
        assertThat(validator.isValid("", null)).isTrue();
    }

    @Test
    @DisplayName("Should return false for invalid token format")
    void isValid_InvalidTokens_ReturnsFalse() {
        assertThat(validator.isValid("invalid_token_without_colon", null)).isFalse();
        assertThat(validator.isValid("abc:short", null)).isFalse();
        assertThat(validator.isValid("12345:!@#$%^&*()_invalid_special_chars!!", null)).isFalse();
    }
}
