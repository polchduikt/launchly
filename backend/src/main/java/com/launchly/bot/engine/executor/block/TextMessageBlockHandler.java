package com.launchly.bot.engine.executor.block;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class TextMessageBlockHandler implements MessageBlockHandler {

    private final MessageBlockHelper helper;

    @Override
    public String getSupportedType() {
        return "text";
    }

    @Override
    public MessageBlockResult handle(MessageBlockContext context) {
        Map<String, Object> block = context.block();
        String blockText = (String) block.getOrDefault("text", "");
        if (blockText == null || blockText.trim().isEmpty()) {
            return MessageBlockResult.ok(false);
        }

        String resolvedText = helper.resolvePlaceholders(blockText, context.sessionData(), context.botUser());
        String escapedText = helper.escapeHtml(resolvedText);
        String htmlText = helper.convertMarkdownLinksToHtml(escapedText);

        try {
            SendMessage message = SendMessage.builder()
                    .chatId(context.chatId())
                    .text(htmlText)
                    .parseMode("HTML")
                    .replyMarkup(context.markup())
                    .build();
            context.client().execute(message);
        } catch (TelegramApiException e) {
            log.error("Failed to send text block in node {}: {}", context.node().id(), e.getMessage());
        }

        return MessageBlockResult.ok(context.markup() != null);
    }
}
