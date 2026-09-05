package com.launchly.bot.engine.executor.block;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendPhoto;
import org.telegram.telegrambots.meta.api.objects.InputFile;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ImageMessageBlockHandler implements MessageBlockHandler {

    @Override
    public String getSupportedType() {
        return "image";
    }

    @Override
    public MessageBlockResult handle(MessageBlockContext context) {
        Map<String, Object> block = context.block();
        String blockImageUrl = (String) block.get("imageUrl");
        if (blockImageUrl == null || blockImageUrl.trim().isEmpty()) {
            return MessageBlockResult.ok(false);
        }

        try {
            SendPhoto sendPhoto = SendPhoto.builder()
                    .chatId(context.chatId())
                    .photo(new InputFile(blockImageUrl))
                    .replyMarkup(context.markup())
                    .build();
            context.client().execute(sendPhoto);
        } catch (TelegramApiException e) {
            log.error("Failed to send image block in node {}: {}", context.node().id(), e.getMessage());
        }

        return MessageBlockResult.ok(context.markup() != null);
    }
}
