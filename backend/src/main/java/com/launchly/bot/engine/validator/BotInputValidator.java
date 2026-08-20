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

    private final MessageUtils messageUtils;

    private static final String NUMBER_REGEX = "-?\\d+(\\.\\d+)?";
    private static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@(.+)$";
    private static final String PHONE_REGEX = "^\\+?[0-9\\s\\-\\(\\)]+$";

    public boolean validate(String text, String replyType) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }
        if ("Number".equalsIgnoreCase(replyType)) {
            return text.matches(NUMBER_REGEX);
        }
        if ("Email".equalsIgnoreCase(replyType)) {
            return text.matches(EMAIL_REGEX);
        }
        if ("Phone".equalsIgnoreCase(replyType)) {
            return text.matches(PHONE_REGEX);
        }
        return true;
    }

    public String getValidationErrorMessage(String replyType) {
        if ("Email".equalsIgnoreCase(replyType)) {
            return messageUtils.getMessageWithDefault(
                    "bot.validation.email",
                    "Please enter a valid email address (e.g., name@example.com).");
        }
        if ("Phone".equalsIgnoreCase(replyType)) {
            return messageUtils.getMessageWithDefault(
                    "bot.validation.phone",
                    "Please enter a valid phone number (e.g., +380123456789).");
        }
        if ("Number".equalsIgnoreCase(replyType)) {
            return messageUtils.getMessageWithDefault(
                    "bot.validation.number",
                    "Please enter a valid number.");
        }
        return messageUtils.getMessageWithDefault(
                "bot.validation.invalid_format",
                "Invalid format. Please enter valid data.");
    }

    public void sendValidationErrorMessage(String chatId, String replyType, TelegramClient client) {
        String msgText = getValidationErrorMessage(replyType);
        try {
            SendMessage message = SendMessage.builder()
                    .chatId(chatId)
                    .text(msgText)
                    .build();
            client.execute(message);
        } catch (Exception e) {
            log.error("Failed to send validation error message to chat {}: {}", chatId, e.getMessage());
        }
    }
}
