package com.launchly.common.utils;

import java.util.regex.Pattern;

public final class SanitizationUtil {

    private static final Pattern SCRIPT_PATTERN = Pattern.compile("(?is)<script[^>]*>.*?</script>");
    private static final Pattern STYLE_PATTERN = Pattern.compile("(?is)<style[^>]*>.*?</style>");
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile("<[^>]+>");

    private SanitizationUtil() {
    }

    public static String sanitizeForTelegram(String input) {
        if (input == null) {
            return null;
        }
        String sanitized = SCRIPT_PATTERN.matcher(input).replaceAll("");
        sanitized = STYLE_PATTERN.matcher(sanitized).replaceAll("");
        return HTML_TAG_PATTERN.matcher(sanitized).replaceAll("");
    }
}
