package com.launchly.bot.engine.executor.block;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendDocument;
import org.telegram.telegrambots.meta.api.objects.InputFile;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.io.InputStream;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class FileMessageBlockHandler implements MessageBlockHandler {

    private final MessageBlockHelper helper;

    @Override
    public String getSupportedType() {
        return "file";
    }

    @Override
    public MessageBlockResult handle(MessageBlockContext context) {
        Map<String, Object> block = context.block();
        String blockFileUrl = (String) block.get("fileUrl");
        if (blockFileUrl == null || blockFileUrl.trim().isEmpty()) {
            return MessageBlockResult.ok(false);
        }

        boolean isHttp = blockFileUrl.startsWith("http://") || blockFileUrl.startsWith("https://");
        if (isHttp) {
            String fileName = (String) block.get("fileName");
            if (fileName == null || fileName.trim().isEmpty()) {
                fileName = helper.extractFileName(blockFileUrl);
            }
            try (InputStream stream = helper.openUrlStream(blockFileUrl)) {
                SendDocument sendDocument = SendDocument.builder()
                        .chatId(context.chatId())
                        .document(new InputFile(stream, fileName))
                        .replyMarkup(context.markup())
                        .build();
                context.client().execute(sendDocument);
            } catch (Exception e) {
                log.error("Failed to send file stream in node {}: {}", context.node().id(), e.getMessage());
            }
        } else {
            try {
                SendDocument sendDocument = SendDocument.builder()
                        .chatId(context.chatId())
                        .document(new InputFile(blockFileUrl))
                        .replyMarkup(context.markup())
                        .build();
                context.client().execute(sendDocument);
            } catch (TelegramApiException e) {
                log.error("Failed to send file block in node {}: {}", context.node().id(), e.getMessage());
            }
        }

        return MessageBlockResult.ok(context.markup() != null);
    }
}
