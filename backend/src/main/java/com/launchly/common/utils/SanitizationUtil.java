package com.launchly.common.utils;

public class SanitizationUtil {

    public static String sanitizeForTelegram(String input) {
        if (input == null) {
            return null;
        }
        String sanitized = input.replaceAll("(?i)<script.*?>.*?</script>", "");
        sanitized = sanitized.replaceAll("(?i)<style.*?>.*?</style>", "");
        sanitized = sanitized.replaceAll("<[^>]*>", "");
        return sanitized;
    }
}
