package com.launchly.bot.engine.validator;

import java.util.regex.Pattern;

public enum ValidationType {
    NUMBER(Pattern.compile("^-?\\d{1,15}(\\.\\d{1,10})?$")),
    EMAIL(Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")),
    PHONE(Pattern.compile("^\\+?[0-9\\s\\-\\(\\)]{5,25}$")),
    IMAGE(null),
    PHOTO(null),
    TEXT(null);

    private final Pattern pattern;

    ValidationType(Pattern pattern) {
        this.pattern = pattern;
    }

    public Pattern getPattern() {
        return pattern;
    }

    public static ValidationType fromString(String type) {
        if (type == null) return TEXT;
        try {
            return valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            return TEXT;
        }
    }
}

