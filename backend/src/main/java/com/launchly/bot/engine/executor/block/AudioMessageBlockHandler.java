package com.launchly.bot.engine.executor.block;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendAudio;
import org.telegram.telegrambots.meta.api.objects.InputFile;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.io.InputStream;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AudioMessageBlockHandler implements MessageBlockHandler {

    private final MessageBlockHelper helper;

    @Override
    public String getSupportedType() {
        return "audio";
    }

    @Override
    public MessageBlockResult handle(MessageBlockContext context) {
        Map<String, Object> block = context.block();
        String blockAudioUrl = (String) block.get("audioUrl");
        if (blockAudioUrl == null || blockAudioUrl.trim().isEmpty()) {
            return MessageBlockResult.ok(false);
        }

        boolean isHttp = blockAudioUrl.startsWith("http://") || blockAudioUrl.startsWith("https://");
        if (isHttp) {
            String fileName = (String) block.get("fileName");
            if (fileName == null || fileName.trim().isEmpty()) {
                fileName = helper.extractFileName(blockAudioUrl);
                if (!fileName.contains(".")) {
                    fileName += ".mp3";
                }
            }
            try (InputStream stream = helper.openUrlStream(blockAudioUrl)) {
                SendAudio sendAudio = SendAudio.builder()
                        .chatId(context.chatId())
                        .audio(new InputFile(stream, fileName))
                        .replyMarkup(context.markup())
                        .build();
                context.client().execute(sendAudio);
            } catch (Exception e) {
                log.error("Failed to send audio stream in node {}: {}", context.node().id(), e.getMessage());
            }
        } else {
            try {
                SendAudio sendAudio = SendAudio.builder()
                        .chatId(context.chatId())
                        .audio(new InputFile(blockAudioUrl))
                        .replyMarkup(context.markup())
                        .build();
                context.client().execute(sendAudio);
            } catch (TelegramApiException e) {
                log.error("Failed to send audio block in node {}: {}", context.node().id(), e.getMessage());
            }
        }

        return MessageBlockResult.ok(context.markup() != null);
    }
}
