package com.launchly.bot.engine.executor.block;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendPhoto;
import org.telegram.telegrambots.meta.api.objects.InputFile;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import java.io.InputStream;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ImageMessageBlockHandler implements MessageBlockHandler {

    private final MessageBlockHelper helper;

    @Override
    public String getSupportedType() {
        return "image";
    }

    @Override
    public MessageBlockResult handle(MessageBlockContext context) {
        Map<String, Object> block = context.block();
        String rawImageUrl = (String) block.get("imageUrl");
        if (rawImageUrl == null || rawImageUrl.trim().isEmpty()) {
            return MessageBlockResult.ok(false);
        }

        String blockImageUrl = helper.resolvePlaceholders(rawImageUrl, context.sessionData(), context.botUser());
        if (blockImageUrl == null || blockImageUrl.trim().isEmpty()) {
            return MessageBlockResult.ok(false);
        }

        String caption = (String) block.get("caption");
        if (caption == null || caption.isBlank()) {
            String rawText = (String) block.get("text");
            if (rawText != null && !rawText.isBlank()) {
                String resolvedText = helper.resolvePlaceholders(rawText, context.sessionData(), context.botUser());
                String escapedText = helper.escapeHtml(resolvedText);
                caption = helper.convertMarkdownLinksToHtml(escapedText);
            }
        }

        boolean isHttp = blockImageUrl.startsWith("http://") || blockImageUrl.startsWith("https://");
        if (isHttp) {
            String fileName = (String) block.get("fileName");
            if (fileName == null || fileName.trim().isEmpty()) {
                fileName = helper.extractFileName(blockImageUrl);
                if (!fileName.contains(".")) {
                    fileName += ".jpg";
                }
            }
            try (InputStream stream = helper.openUrlStream(blockImageUrl)) {
                SendPhoto.SendPhotoBuilder sendPhotoBuilder = SendPhoto.builder()
                        .chatId(context.chatId())
                        .photo(new InputFile(stream, fileName))
                        .replyMarkup(context.markup());
                if (caption != null && !caption.isBlank()) {
                    sendPhotoBuilder.caption(caption).parseMode("HTML");
                }
                context.client().execute(sendPhotoBuilder.build());
            } catch (Exception e) {
                log.error("Failed to send image stream in node {}: {}", context.node().id(), e.getMessage());
            }
        } else {
            try {
                SendPhoto.SendPhotoBuilder sendPhotoBuilder = SendPhoto.builder()
                        .chatId(context.chatId())
                        .photo(new InputFile(blockImageUrl))
                        .replyMarkup(context.markup());
                if (caption != null && !caption.isBlank()) {
                    sendPhotoBuilder.caption(caption).parseMode("HTML");
                }
                context.client().execute(sendPhotoBuilder.build());
            } catch (TelegramApiException e) {
                log.error("Failed to send image block in node {}: {}", context.node().id(), e.getMessage());
            }
        }

        return MessageBlockResult.ok(context.markup() != null);
    }
}

