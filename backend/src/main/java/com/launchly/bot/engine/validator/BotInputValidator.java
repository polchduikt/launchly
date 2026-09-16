package com.launchly.bot.engine.validator;

import com.launchly.common.utils.MessageUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.generics.TelegramClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class BotInputValidator {

    public static final long MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024L;
    public static final int MAX_TEXT_LENGTH = 2000;
    public static final int MAX_EMAIL_LENGTH = 254;

    private static final String MSG_KEY_IMAGE = "bot.validation.image";
    private static final String MSG_KEY_EMAIL = "bot.validation.email";
    private static final String MSG_KEY_PHONE = "bot.validation.phone";
    private static final String MSG_KEY_NUMBER = "bot.validation.number";
    private static final String MSG_KEY_INVALID_FORMAT = "bot.validation.invalid_format";
    private static final String MSG_KEY_IMAGE_SIZE_LIMIT = "bot.validation.image_size_limit";
    private static final String MSG_KEY_IMAGE_INVALID_FORMAT = "bot.validation.image_invalid_format";
    private static final String MSG_KEY_TEXT_LENGTH_LIMIT = "bot.validation.text_length_limit";

    private final MessageUtils messageUtils;

    public boolean validate(String text, String replyType) {
        ValidationType validationType = ValidationType.fromString(replyType);
        if (validationType == ValidationType.IMAGE || validationType == ValidationType.PHOTO) {
            return false;
        }
        if (text == null) {
            return false;
        }
        String trimmed = text.trim();
        if (trimmed.isEmpty() || trimmed.length() > MAX_TEXT_LENGTH) {
            return false;
        }

        if (validationType == ValidationType.NUMBER) {
            if (validationType.getPattern() != null && !validationType.getPattern().matcher(trimmed).matches()) {
                return false;
            }
            try {
                double val = Double.parseDouble(trimmed);
                return !Double.isNaN(val) && !Double.isInfinite(val);
            } catch (NumberFormatException e) {
                return false;
            }
        }

        if (validationType == ValidationType.EMAIL) {
            if (trimmed.length() > MAX_EMAIL_LENGTH) {
                return false;
            }
            return validationType.getPattern() != null && validationType.getPattern().matcher(trimmed).matches();
        }

        if (validationType.getPattern() != null) {
            return validationType.getPattern().matcher(trimmed).matches();
        }
        return true;
    }

    public String getValidationErrorMessage(String replyType) {
        ValidationType validationType = ValidationType.fromString(replyType);
        switch (validationType) {
            case IMAGE:
            case PHOTO:
                return messageUtils.getMessage(MSG_KEY_IMAGE);
            case EMAIL:
                return messageUtils.getMessage(MSG_KEY_EMAIL);
            case PHONE:
                return messageUtils.getMessage(MSG_KEY_PHONE);
            case NUMBER:
                return messageUtils.getMessage(MSG_KEY_NUMBER);
            default:
                return messageUtils.getMessage(MSG_KEY_INVALID_FORMAT);
        }
    }

    public String getImageSizeErrorMessage() {
        return messageUtils.getMessage(MSG_KEY_IMAGE_SIZE_LIMIT);
    }

    public String getImageFormatErrorMessage() {
        return messageUtils.getMessage(MSG_KEY_IMAGE_INVALID_FORMAT);
    }

    public String getTextLengthErrorMessage() {
        return messageUtils.getMessage(MSG_KEY_TEXT_LENGTH_LIMIT);
    }

    public void sendValidationErrorMessage(String chatId, String replyType, TelegramClient client) {
        String msgText = getValidationErrorMessage(replyType);
        sendCustomErrorMessage(chatId, msgText, client);
    }

    public void sendCustomErrorMessage(String chatId, String messageText, TelegramClient client) {
        try {
            SendMessage message = SendMessage.builder()
                    .chatId(chatId)
                    .text(messageText)
                    .build();
            client.execute(message);
        } catch (Exception e) {
            log.error("Failed to send validation error message to chat {}: {}", chatId, e.getMessage());
        }
    }
}
