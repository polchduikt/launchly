package com.launchly.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class TelegramTokenValidator implements ConstraintValidator<ValidTelegramToken, String> {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("^\\d+:[a-zA-Z0-9_-]{35}$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return true;
        }
        return TOKEN_PATTERN.matcher(value).matches();
    }
}
