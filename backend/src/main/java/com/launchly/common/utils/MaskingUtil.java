package com.launchly.common.utils;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class MaskingUtil {

    private static final Pattern TELEGRAM_TOKEN_PATTERN = Pattern.compile("\\b(\\d{8,10}:)([A-Za-z0-9_-]{4})[A-Za-z0-9_-]{27}([A-Za-z0-9_-]{4})\\b");
    private static final Pattern JSON_FIELD_PATTERN = Pattern.compile("(?i)(\"(?:password|secret|apiKey|api_key|token|bot_token|accessToken|access_token|refreshToken|refresh_token|clientSecret|client_secret|cvv|cvc|authorization)\"\\s*:\\s*\")[^\"]+(\")");
    private static final Pattern BEARER_PATTERN = Pattern.compile("(?i)\\bBearer\\s+[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_.+/=]+\\b");
    private static final Pattern CREDIT_CARD_PATTERN = Pattern.compile("\\b(\\d{4})[ -]?(\\d{4})[ -]?(\\d{4})[ -]?(\\d{4})\\b");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("\\b([A-Za-z0-9._%+-]{1,2})[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+\\.[A-Za-z]{2,})\\b");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(\\+?\\d{1,3})?(\\s|-|\\.)?\\(?\\d{3}\\)?(\\s|-|\\.)?\\d{3}(\\s|-|\\.)?(\\d{4})\\b");

    private MaskingUtil() {
    }

    public static String maskMessage(String message) {
        if (message == null || message.isEmpty()) {
            return message;
        }

        String masked = JSON_FIELD_PATTERN.matcher(message).replaceAll("$1******$2");
        masked = BEARER_PATTERN.matcher(masked).replaceAll("Bearer [MASKED_JWT]");
        masked = TELEGRAM_TOKEN_PATTERN.matcher(masked).replaceAll("$1$2***$3");
        masked = CREDIT_CARD_PATTERN.matcher(masked).replaceAll("$1-****-****-$4");
        masked = EMAIL_PATTERN.matcher(masked).replaceAll("$1***$2");

        return masked;
    }

    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        int atIndex = email.indexOf('@');
        if (atIndex <= 2) {
            return email.charAt(0) + "***" + email.substring(atIndex);
        }
        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }

    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) {
            return phone;
        }
        int len = phone.length();
        return phone.substring(0, 3) + "****" + phone.substring(len - 4);
    }

    public static String maskToken(String token) {
        if (token == null || token.length() < 10) {
            return "******";
        }
        return token.substring(0, 4) + "******" + token.substring(token.length() - 4);
    }
}
