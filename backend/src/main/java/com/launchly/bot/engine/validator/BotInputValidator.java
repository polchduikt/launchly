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

    public boolean validate(String text, String replyType) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }
        ValidationType validationType = ValidationType.fromString(replyType);
        if (validationType.getPattern() != null) {
            return validationType.getPattern().matcher(text).matches();
        }
        return true;
    }

    public String getValidationErrorMessage(String replyType) {
        ValidationType validationType = ValidationType.fromString(replyType);
        switch (validationType) {
            case EMAIL:
                return messageUtils.getMessageWithDefault(
                        "bot.validation.email",
                        "Please enter a valid email address (e.g., name@example.com).");
            case PHONE:
                return messageUtils.getMessageWithDefault(
                        "bot.validation.phone",
                        "Please enter a valid phone number (e.g., +380123456789).");
            case NUMBER:
                return messageUtils.getMessageWithDefault(
                        "bot.validation.number",
                        "Please enter a valid number.");
            default:
                return messageUtils.getMessageWithDefault(
                        "bot.validation.invalid_format",
                        "Invalid format. Please enter valid data.");
        }
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
