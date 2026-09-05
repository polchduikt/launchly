package com.launchly.bot.engine.executor.block;

import com.launchly.bot.engine.model.DataCollectionState;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataCollectionMessageBlockHandler implements MessageBlockHandler {

    private final MessageBlockHelper helper;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public String getSupportedType() {
        return "data_collection";
    }

    @Override
    public MessageBlockResult handle(MessageBlockContext context) {
        Map<String, Object> block = context.block();
        String blockText = (String) block.getOrDefault("text", "");
        if (blockText != null && !blockText.trim().isEmpty()) {
            String resolvedText = helper.resolvePlaceholders(blockText, context.sessionData(), context.botUser());
            String escapedText = helper.escapeHtml(resolvedText);
            String htmlText = helper.convertMarkdownLinksToHtml(escapedText);

            try {
                SendMessage message = SendMessage.builder()
                        .chatId(context.chatId())
                        .text(htmlText)
                        .parseMode("HTML")
                        .build();
                context.client().execute(message);
            } catch (TelegramApiException e) {
                log.error("Failed to send data collection question in node {}: {}", context.node().id(), e.getMessage());
            }
        }

        try {
            String replyType = (String) block.getOrDefault("replyType", "Text");
            String variableName = (String) block.getOrDefault("variableName", "");
            Object expObj = block.get("expirationMinutes");
            int expirationMinutes = expObj instanceof Number number ? number.intValue() : 30;
            Object retryObj = block.get("retryCount");
            int retryCount = retryObj instanceof Number number ? number.intValue() : 3;

            DataCollectionState state = DataCollectionState.builder()
                    .nodeId(context.node().id())
                    .blockId((String) block.get("id"))
                    .replyType(replyType)
                    .saveToField(variableName)
                    .retryCount(retryCount)
                    .expiresAt(System.currentTimeMillis() + (expirationMinutes * 60 * 1000L))
                    .build();

            String dcKey = "launchly:bot:data_collection:" + context.botUser().getBot().getId() + ":" + context.botUser().getTelegramId();
            redisTemplate.opsForValue().set(dcKey, objectMapper.writeValueAsString(state));
        } catch (Exception e) {
            log.error("Failed to save data collection state: {}", e.getMessage(), e);
        }

        return MessageBlockResult.halt();
    }
}
