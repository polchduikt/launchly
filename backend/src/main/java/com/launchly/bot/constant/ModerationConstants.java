package com.launchly.bot.constant;

import java.util.List;
import java.util.regex.Pattern;

public final class ModerationConstants {

    private ModerationConstants() {}

    public static final String GLOBAL_CHAT_ID = "*";

    public static final String MSG_KEY_DEFAULT_WARNING_TEMPLATE = "bot.moderation.default_warning_template";
    public static final String MSG_KEY_DEFAULT_USER = "bot.moderation.default_user";
    public static final String MSG_KEY_REASON_ANTI_FORWARD = "bot.moderation.reason.anti_forward";
    public static final String MSG_KEY_REASON_TEXT_ONLY = "bot.moderation.reason.text_only";
    public static final String MSG_KEY_REASON_MEDIA_ONLY = "bot.moderation.reason.media_only";
    public static final String MSG_KEY_REASON_ANTI_LINK = "bot.moderation.reason.anti_link";
    public static final String MSG_KEY_REASON_STOP_WORD = "bot.moderation.reason.stop_word";

    public static final String DEFAULT_WARNING_TEMPLATE = "{first_name}, your message was deleted due to a violation of chat rules!";
    public static final String DEFAULT_USER_NAME = "User";
    public static final String DEFAULT_PASS_VARIABLE = "is_moderation_passed";
    public static final String DEFAULT_REASON_VARIABLE = "moderation_violation_reasons";

    public static final int DEFAULT_WARN_TTL_SECONDS = 5;
    public static final int DEFAULT_WARN_AUTO_DELETE_SECONDS = 10;
    public static final int DEFAULT_MUTE_DURATION_MINUTES = 60;
    public static final int DEFAULT_MUTE_DURATION_SECONDS = 3600;
    public static final int SECONDS_PER_MINUTE = 60;
    public static final long MILLIS_PER_SECOND = 1000L;

    public static final String CODE_ANTI_FORWARD = "Anti-Forward";
    public static final String CODE_TEXT_ONLY = "Text-Only";
    public static final String CODE_MEDIA_ONLY = "Media-Only";
    public static final String CODE_ANTI_LINK_PREFIX = "Anti-Link: ";
    public static final String CODE_STOP_WORD_PREFIX = "Stop-Word: ";

    public static final Pattern URL_PATTERN = Pattern.compile(
            "(?i)\\b(https?://|www\\.|t\\.me/|telegram\\.me/)[^\\s]+"
    );

    public static final List<String> DEFAULT_SCAM_PATTERNS = List.of(
            "100x", "pump and dump", "free giveaway", "роздача крипти", "сигнали крипта",
            "заробіток без вкладень", "казино", "casino", "1win", "vulkan", "ставки на спорт",
            "free spins", "crypto signals", "airdrop claim", "найкращий заробіток", "інвестиції під 100%"
    );

    public static final List<String> DEFAULT_PROFANITY_PATTERNS = List.of(
            "хуй", "бляд", "сука", "єбат", "ебат", "пизд", "пізд", "мудак", "гандон",
            "fuck", "bitch", "cunt", "asshole", "dick", "shit"
    );
}
