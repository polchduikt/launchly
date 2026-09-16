package com.launchly.bot.service.helper;

import com.launchly.bot.constant.ModerationConstants;
import com.launchly.common.utils.MessageUtils;
import lombok.extern.slf4j.Slf4j;
import org.telegram.telegrambots.meta.api.methods.AnswerCallbackQuery;
import org.telegram.telegrambots.meta.api.methods.groupadministration.BanChatMember;
import org.telegram.telegrambots.meta.api.methods.groupadministration.RestrictChatMember;
import org.telegram.telegrambots.meta.api.methods.groupadministration.UnbanChatMember;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.methods.updatingmessages.DeleteMessage;
import org.telegram.telegrambots.meta.api.objects.ChatPermissions;
import org.telegram.telegrambots.meta.api.objects.User;
import org.telegram.telegrambots.meta.api.objects.message.Message;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;

@Slf4j
public final class BotModerationHelper {

    private BotModerationHelper() {}

    public static boolean isForwarded(Message message) {
        if (message == null) return false;
        return message.getForwardOrigin() != null
                || message.getForwardFrom() != null
                || message.getForwardFromChat() != null
                || message.getForwardSenderName() != null;
    }

    public static boolean hasMediaContent(Message message) {
        if (message == null) return false;
        return message.hasPhoto()
                || message.hasVideo()
                || message.hasVoice()
                || message.hasDocument()
                || message.hasSticker()
                || message.hasAnimation()
                || message.hasAudio()
                || message.hasVideoNote();
    }

    public static String extractMessageText(Message message) {
        if (message == null) return null;
        if (message.hasText()) return message.getText();
        if (message.getCaption() != null && !message.getCaption().isBlank()) return message.getCaption();
        return null;
    }

    public static List<String> extractUrls(String text) {
        if (text == null || text.isBlank()) return Collections.emptyList();
        List<String> urls = new ArrayList<>();
        Matcher matcher = ModerationConstants.URL_PATTERN.matcher(text);
        while (matcher.find()) {
            urls.add(matcher.group());
        }
        return urls;
    }

    public static boolean isAllowedLink(String url, List<String> whitelist) {
        if (url == null || whitelist == null || whitelist.isEmpty()) return false;
        String lowerUrl = url.toLowerCase();
        for (String allowed : whitelist) {
            if (lowerUrl.contains(allowed.toLowerCase().trim())) {
                return true;
            }
        }
        return false;
    }

    public static List<String> parseList(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptyList();
        return Arrays.stream(raw.split("[,\\n]+"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    public static String findMatchedStopWord(String text, boolean defaultProfanityFilter, String customStopWords) {
        if (text == null || text.isBlank()) return null;
        String lowerText = text.toLowerCase();

        if (defaultProfanityFilter) {
            for (String scam : ModerationConstants.DEFAULT_SCAM_PATTERNS) {
                if (lowerText.contains(scam.toLowerCase())) {
                    return scam;
                }
            }
            for (String profanity : ModerationConstants.DEFAULT_PROFANITY_PATTERNS) {
                if (lowerText.contains(profanity.toLowerCase())) {
                    return profanity;
                }
            }
        }

        if (customStopWords != null && !customStopWords.isBlank()) {
            List<String> customWords = parseList(customStopWords);
            for (String word : customWords) {
                if (lowerText.contains(word.toLowerCase().trim())) {
                    return word.trim();
                }
            }
        }

        return null;
    }

    public static String formatWarningMessage(String template, User from, MessageUtils messageUtils) {
        String defaultUser = ModerationConstants.DEFAULT_USER_NAME;
        String defaultTemplate = ModerationConstants.DEFAULT_WARNING_TEMPLATE;

        if (messageUtils != null) {
            String resolvedUser = messageUtils.getMessageWithDefault(ModerationConstants.MSG_KEY_DEFAULT_USER, ModerationConstants.DEFAULT_USER_NAME);
            if (resolvedUser != null && !resolvedUser.isBlank()) {
                defaultUser = resolvedUser;
            }
            String resolvedTemplate = messageUtils.getMessageWithDefault(ModerationConstants.MSG_KEY_DEFAULT_WARNING_TEMPLATE, ModerationConstants.DEFAULT_WARNING_TEMPLATE);
            if (resolvedTemplate != null && !resolvedTemplate.isBlank()) {
                defaultTemplate = resolvedTemplate;
            }
        }

        String firstName = defaultUser;
        String usernameOnly = defaultUser.toLowerCase();
        String mention = defaultUser;

        if (from != null) {
            if (from.getFirstName() != null && !from.getFirstName().isBlank()) {
                firstName = from.getFirstName();
            }
            if (from.getUserName() != null && !from.getUserName().isBlank()) {
                usernameOnly = from.getUserName();
                mention = "@" + from.getUserName();
            } else {
                usernameOnly = firstName;
                mention = firstName;
            }
        }

        String effectiveTemplate = (template != null && !template.isBlank())
                ? template
                : defaultTemplate;

        return effectiveTemplate
                .replace("{first_name}", firstName)
                .replace("{name}", firstName)
                .replace("@{username}", mention)
                .replace("{username}", usernameOnly)
                .replace("{user}", mention);
    }

    public static String formatWarningMessage(String template, User from) {
        return formatWarningMessage(template, from, null);
    }

    public static void deleteMessageSafe(TelegramClient client, Long chatId, Integer messageId) {
        if (client == null || chatId == null || messageId == null) return;
        try {
            client.execute(DeleteMessage.builder()
                    .chatId(String.valueOf(chatId))
                    .messageId(messageId)
                    .build());
        } catch (Exception e) {
            log.warn("Failed to delete messageId={} in chatId={}: {}", messageId, chatId, e.getMessage());
        }
    }

    public static void sendSelfDestructWarning(TelegramClient client,
                                              ScheduledExecutorService executor,
                                              Long chatId,
                                              User from,
                                              String template,
                                              int ttlSeconds,
                                              MessageUtils messageUtils) {
        if (client == null || chatId == null) return;

        String warnText = formatWarningMessage(template, from, messageUtils);
        int effectiveTtl = ttlSeconds > 0 ? ttlSeconds : ModerationConstants.DEFAULT_WARN_TTL_SECONDS;

        try {
            Message warnMsg = client.execute(SendMessage.builder()
                    .chatId(String.valueOf(chatId))
                    .text(warnText)
                    .build());

            if (warnMsg != null && warnMsg.getMessageId() != null && executor != null) {
                Integer warnMsgId = warnMsg.getMessageId();
                executor.schedule(() -> {
                    try {
                        client.execute(DeleteMessage.builder()
                                .chatId(String.valueOf(chatId))
                                .messageId(warnMsgId)
                                .build());
                    } catch (Exception e) {
                        log.debug("Auto-delete warning message {} expired or failed: {}", warnMsgId, e.getMessage());
                    }
                }, effectiveTtl, TimeUnit.SECONDS);
            }
        } catch (Exception e) {
            log.warn("Failed to send warning message in chatId={}: {}", chatId, e.getMessage());
        }
    }

    public static void sendSelfDestructWarning(TelegramClient client,
                                              ScheduledExecutorService executor,
                                              Long chatId,
                                              User from,
                                              String template,
                                              int ttlSeconds) {
        sendSelfDestructWarning(client, executor, chatId, from, template, ttlSeconds, null);
    }

    public static void muteUser(TelegramClient client, Long chatId, Long userId, int durationSeconds) {
        if (client == null || chatId == null || userId == null) return;
        int effectiveDuration = durationSeconds > 0 ? durationSeconds : ModerationConstants.DEFAULT_MUTE_DURATION_SECONDS;

        try {
            ChatPermissions permissions = ChatPermissions.builder()
                    .canSendMessages(false)
                    .canSendAudios(false)
                    .canSendDocuments(false)
                    .canSendPhotos(false)
                    .canSendVideos(false)
                    .canSendVideoNotes(false)
                    .canSendVoiceNotes(false)
                    .canSendPolls(false)
                    .canSendOtherMessages(false)
                    .canAddWebPagePreviews(false)
                    .build();

            int untilDate = (int) (System.currentTimeMillis() / ModerationConstants.MILLIS_PER_SECOND + effectiveDuration);

            client.execute(RestrictChatMember.builder()
                    .chatId(String.valueOf(chatId))
                    .userId(userId)
                    .permissions(permissions)
                    .untilDate(untilDate)
                    .build());
            log.info("Muted userId={} in chatId={} for {}s", userId, chatId, effectiveDuration);
        } catch (Exception e) {
            log.warn("Failed to mute userId={} in chatId={}: {}", userId, chatId, e.getMessage());
        }
    }

    public static void kickUser(TelegramClient client, Long chatId, Long userId) {
        if (client == null || chatId == null || userId == null) return;
        try {
            client.execute(BanChatMember.builder()
                    .chatId(String.valueOf(chatId))
                    .userId(userId)
                    .build());
            client.execute(UnbanChatMember.builder()
                    .chatId(String.valueOf(chatId))
                    .userId(userId)
                    .onlyIfBanned(true)
                    .build());
            log.info("Kicked userId={} from chatId={}", userId, chatId);
        } catch (Exception e) {
            log.warn("Failed to kick userId={} from chatId={}: {}", userId, chatId, e.getMessage());
        }
    }

    public static void unmuteUser(TelegramClient client, Long chatId, Long userId) {
        if (client == null || chatId == null || userId == null) return;
        try {
            ChatPermissions permissions = ChatPermissions.builder()
                    .canSendMessages(true)
                    .canSendAudios(true)
                    .canSendDocuments(true)
                    .canSendPhotos(true)
                    .canSendVideos(true)
                    .canSendVideoNotes(true)
                    .canSendVoiceNotes(true)
                    .canSendPolls(true)
                    .canSendOtherMessages(true)
                    .canAddWebPagePreviews(true)
                    .build();

            client.execute(RestrictChatMember.builder()
                    .chatId(String.valueOf(chatId))
                    .userId(userId)
                    .permissions(permissions)
                    .useIndependentChatPermissions(true)
                    .build());
            log.info("Unmuted userId={} in chatId={}", userId, chatId);
        } catch (Exception e) {
            log.warn("Failed to unmute userId={} in chatId={}: {}", userId, chatId, e.getMessage());
        }
    }

    public static void answerCallbackQuery(TelegramClient client, String callbackQueryId, String text, boolean showAlert) {
        if (client == null || callbackQueryId == null) return;
        try {
            client.execute(AnswerCallbackQuery.builder()
                    .callbackQueryId(callbackQueryId)
                    .text(text)
                    .showAlert(showAlert)
                    .build());
        } catch (Exception e) {
            log.debug("Failed to answer callback query {}: {}", callbackQueryId, e.getMessage());
        }
    }

    public static String formatCaptchaMessage(String template, User from, int timeoutSeconds, MessageUtils messageUtils) {
        String defaultUser = ModerationConstants.DEFAULT_USER_NAME;
        String defaultTemplate = ModerationConstants.DEFAULT_CAPTCHA_MESSAGE_TEMPLATE;

        if (messageUtils != null) {
            String resolvedUser = messageUtils.getMessageWithDefault(ModerationConstants.MSG_KEY_DEFAULT_USER, ModerationConstants.DEFAULT_USER_NAME);
            if (resolvedUser != null && !resolvedUser.isBlank()) {
                defaultUser = resolvedUser;
            }
            String resolvedTemplate = messageUtils.getMessageWithDefault(ModerationConstants.MSG_KEY_CAPTCHA_DEFAULT_MESSAGE, ModerationConstants.DEFAULT_CAPTCHA_MESSAGE_TEMPLATE);
            if (resolvedTemplate != null && !resolvedTemplate.isBlank()) {
                defaultTemplate = resolvedTemplate;
            }
        }

        String firstName = defaultUser;
        String usernameOnly = defaultUser.toLowerCase();
        String mention = defaultUser;

        if (from != null) {
            if (from.getFirstName() != null && !from.getFirstName().isBlank()) {
                firstName = from.getFirstName();
            }
            if (from.getUserName() != null && !from.getUserName().isBlank()) {
                usernameOnly = from.getUserName();
                mention = "@" + from.getUserName();
            } else {
                usernameOnly = firstName;
                mention = firstName;
            }
        }

        String effectiveTemplate = (template != null && !template.isBlank())
                ? template
                : defaultTemplate;

        return effectiveTemplate
                .replace("{first_name}", firstName)
                .replace("{name}", firstName)
                .replace("@{username}", mention)
                .replace("{username}", usernameOnly)
                .replace("{user}", mention)
                .replace("{timeout}", String.valueOf(timeoutSeconds))
                .replace("{timeout_seconds}", String.valueOf(timeoutSeconds));
    }
}
