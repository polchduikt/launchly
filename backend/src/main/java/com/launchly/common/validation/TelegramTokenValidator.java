package com.launchly.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class TelegramTokenValidator implements ConstraintValidator<ValidTelegramToken, String> {

    // Telegram Bot Token pattern: digits followed by a colon and exactly 35 alphanumeric/underscore/hyphen characters.
    private static final Pattern TOKEN_PATTERN = Pattern.compile("^\\d+:[a-zA-Z0-9_-]{35}$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return true; // Let @NotBlank handle null or empty values
        }
        return TOKEN_PATTERN.matcher(value).matches();
    }
}
