package com.launchly.bot.engine.executor.block;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendVideo;
import org.telegram.telegrambots.meta.api.objects.InputFile;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.io.InputStream;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class VideoMessageBlockHandler implements MessageBlockHandler {

    private final MessageBlockHelper helper;

    @Override
    public String getSupportedType() {
        return "video";
    }

    @Override
    public MessageBlockResult handle(MessageBlockContext context) {
        Map<String, Object> block = context.block();
        String blockVideoUrl = (String) block.get("videoUrl");
        if (blockVideoUrl == null || blockVideoUrl.trim().isEmpty()) {
            return MessageBlockResult.ok(false);
        }

        boolean isHttp = blockVideoUrl.startsWith("http://") || blockVideoUrl.startsWith("https://");
        if (isHttp) {
            String fileName = (String) block.get("fileName");
            if (fileName == null || fileName.trim().isEmpty()) {
                fileName = helper.extractFileName(blockVideoUrl);
                if (!fileName.contains(".")) {
                    fileName += ".mp4";
                }
            }
            try (InputStream stream = helper.openUrlStream(blockVideoUrl)) {
                SendVideo sendVideo = SendVideo.builder()
                        .chatId(context.chatId())
                        .video(new InputFile(stream, fileName))
                        .replyMarkup(context.markup())
                        .build();
                context.client().execute(sendVideo);
            } catch (Exception e) {
                log.error("Failed to send video stream in node {}: {}", context.node().id(), e.getMessage());
            }
        } else {
            try {
                SendVideo sendVideo = SendVideo.builder()
                        .chatId(context.chatId())
                        .video(new InputFile(blockVideoUrl))
                        .replyMarkup(context.markup())
                        .build();
                context.client().execute(sendVideo);
            } catch (TelegramApiException e) {
                log.error("Failed to send video block in node {}: {}", context.node().id(), e.getMessage());
            }
        }

        return MessageBlockResult.ok(context.markup() != null);
    }
}
