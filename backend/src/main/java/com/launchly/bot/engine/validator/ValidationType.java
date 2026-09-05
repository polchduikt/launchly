package com.launchly.bot.engine.validator;

import java.util.regex.Pattern;

public enum ValidationType {
    NUMBER(Pattern.compile("-?\\d+(\\.\\d+)?")),
    EMAIL(Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$")),
    PHONE(Pattern.compile("^\\+?[0-9\\s\\-\\(\\)]+$")),
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
