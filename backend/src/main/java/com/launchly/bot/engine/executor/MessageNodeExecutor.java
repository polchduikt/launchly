package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.executor.block.*;
import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.common.utils.SanitizationUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.methods.send.SendPhoto;
import org.telegram.telegrambots.meta.api.objects.InputFile;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.InlineKeyboardMarkup;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import tools.jackson.databind.ObjectMapper;

import java.util.*;

@Slf4j
@Component
public class MessageNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final MessageBlockHelper helper;
    private final Map<String, MessageBlockHandler> handlerMap;

    public MessageNodeExecutor(BotDialogStateService stateService,
                               StringRedisTemplate redisTemplate,
                               ObjectMapper objectMapper,
                               MessageBlockHelper helper,
                               List<MessageBlockHandler> handlers) {
        this.stateService = stateService;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.helper = helper;
        this.handlerMap = new HashMap<>();
        for (MessageBlockHandler handler : handlers) {
            this.handlerMap.put(handler.getSupportedType(), handler);
        }
    }

    public MessageNodeExecutor(BotDialogStateService stateService,
                               StringRedisTemplate redisTemplate,
                               ObjectMapper objectMapper) {
        this(stateService, redisTemplate, objectMapper, new MessageBlockHelper(objectMapper), createDefaultHandlers(redisTemplate, objectMapper));
    }

    private static List<MessageBlockHandler> createDefaultHandlers(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        MessageBlockHelper helper = new MessageBlockHelper(objectMapper);
        return List.of(
                new TextMessageBlockHandler(helper),
                new ImageMessageBlockHandler(),
                new DelayMessageBlockHandler(),
                new DataCollectionMessageBlockHandler(helper, redisTemplate, objectMapper),
                new FileMessageBlockHandler(helper),
                new AudioMessageBlockHandler(helper),
                new VideoMessageBlockHandler(helper)
        );
    }

    @Override
    public NodeType getType() {
        return NodeType.MESSAGE;
    }

    @Override
    @SuppressWarnings("unchecked")
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        if (botUser == null || botUser.getTelegramId() == null) {
            return null;
        }
        Map<String, Object> data = node.data();
        List<Map<String, Object>> blocks = null;
        if (data != null && data.get("blocks") instanceof List) {
            blocks = (List<Map<String, Object>>) data.get("blocks");
        }
        String chatId = botUser.getTelegramId().toString();

        if (update != null && update.hasCallbackQuery()) {
            String callbackData = update.getCallbackQuery().getData();
            boolean isButtonOnThisNode = false;

            List<Object> allButtons = new ArrayList<>();
            List<?> topLevelButtons = data != null ? (List<?>) data.get("buttons") : null;
            if (topLevelButtons != null) {
                allButtons.addAll(topLevelButtons);
            }
            if (blocks != null) {
                for (Map<String, Object> block : blocks) {
                    List<?> blockButtons = (List<?>) block.get("buttons");
                    if (blockButtons != null) {
                        allButtons.addAll(blockButtons);
                    }
                }
            }

            if (!allButtons.isEmpty()) {
                for (Object btnObj : allButtons) {
                    if (btnObj instanceof Map<?, ?> btn) {
                        Object valObj = btn.get("value");
                        String value = valObj instanceof String ? (String) valObj : "";
                        if (callbackData.equals(value)) {
                            isButtonOnThisNode = true;
                            break;
                        }
                    }
                }
            }

            if (isButtonOnThisNode) {
                return edges.stream()
                        .filter(e -> e.source().equals(node.id()) && callbackData.equals(e.sourceHandle()))
                        .findFirst()
                        .map(FlowEdge::target)
                        .orElse(edges.stream()
                                .filter(e -> e.source().equals(node.id()) && (e.sourceHandle() == null || "next".equals(e.sourceHandle())))
                                .findFirst()
                                .map(FlowEdge::target)
                                .orElse(null));
            }
        }

        boolean hasButtons = false;

        List<?> menuButtons = null;
        if (blocks != null) {
            for (Map<String, Object> block : blocks) {
                if ("telegram_menu".equals(block.get("type"))) {
                    menuButtons = (List<?>) block.get("buttons");
                    break;
                }
            }
        }

        int lastSendableIdx = -1;
        if (blocks != null) {
            for (int i = 0; i < blocks.size(); i++) {
                String type = (String) blocks.get(i).get("type");
                if ("text".equals(type) || "image".equals(type) || "file".equals(type) || "audio".equals(type) || "video".equals(type)) {
                    lastSendableIdx = i;
                }
            }
        }

        if (blocks != null && !blocks.isEmpty()) {
            Long botId = botUser.getBot() != null ? botUser.getBot().getId() : null;
            Map<String, String> sessionData = botId != null ? stateService.getSessionData(botId, botUser.getTelegramId()) : Map.of();
            int blockIdx = 0;

            for (Map<String, Object> block : blocks) {
                String type = (String) block.get("type");
                if (type == null) {
                    blockIdx++;
                    continue;
                }

                List<?> blockButtons = (List<?>) block.get("buttons");
                if (blockIdx == lastSendableIdx && menuButtons != null && !menuButtons.isEmpty()) {
                    blockButtons = menuButtons;
                }
                InlineKeyboardMarkup markup = helper.buildMarkup(blockButtons);

                MessageBlockHandler handler = handlerMap.get(type);
                if (handler != null) {
                    MessageBlockContext context = new MessageBlockContext(
                            block, node, botUser, chatId, sessionData, markup, client, blockIdx, lastSendableIdx
                    );
                    MessageBlockResult result = handler.handle(context);
                    if (result.haltFlow()) {
                        return null;
                    }
                    if (result.hasButtons()) {
                        hasButtons = true;
                    }
                } else if (!"telegram_menu".equals(type)) {
                    log.warn("Unknown message block type '{}' in node {}", type, node.id());
                }

                blockIdx++;
            }

            if (lastSendableIdx == -1 && menuButtons != null && !menuButtons.isEmpty()) {
                String sanitized = SanitizationUtil.sanitizeForTelegram("...");
                InlineKeyboardMarkup markup = helper.buildMarkup(menuButtons);
                if (markup != null) hasButtons = true;
                try {
                    SendMessage message = SendMessage.builder()
                            .chatId(chatId)
                            .text(sanitized)
                            .replyMarkup(markup)
                            .build();
                    client.execute(message);
                } catch (TelegramApiException e) {
                    log.error("Failed to send fallback block for telegram_menu: {}", e.getMessage());
                }
            }
        } else {
            String text = data != null ? (String) data.get("text") : null;
            String imageUrl = data != null ? (String) data.get("imageUrl") : null;
            List<?> buttonsList = data != null ? (List<?>) data.get("buttons") : null;

            boolean hasText = text != null && !text.trim().isEmpty();
            boolean hasImage = imageUrl != null && !imageUrl.trim().isEmpty();
            InlineKeyboardMarkup markup = helper.buildMarkup(buttonsList);
            if (markup != null) hasButtons = true;

            if (hasImage) {
                String sanitizedText = hasText ? SanitizationUtil.sanitizeForTelegram(text) : "";
                try {
                    SendPhoto sendPhoto = SendPhoto.builder()
                            .chatId(chatId)
                            .photo(new InputFile(imageUrl))
                            .caption(sanitizedText)
                            .replyMarkup(markup)
                            .build();
                    client.execute(sendPhoto);
                } catch (TelegramApiException e) {
                    log.error("Failed to send photo for node {}: {}", node.id(), e.getMessage());
                }
            } else if (hasText || markup != null) {
                String sanitizedText = hasText ? SanitizationUtil.sanitizeForTelegram(text) : "...";
                try {
                    SendMessage message = SendMessage.builder()
                            .chatId(chatId)
                            .text(sanitizedText)
                            .replyMarkup(markup)
                            .build();
                    client.execute(message);
                } catch (TelegramApiException e) {
                    log.error("Failed to send legacy flat message for node {}: {}", node.id(), e.getMessage());
                }
            } else {
                log.debug("Message node {} is empty (no text/image/buttons), skipping sending.", node.id());
            }
        }

        if (hasButtons) {
            return null;
        }

        return edges.stream()
                .filter(e -> e.source().equals(node.id()) && (e.sourceHandle() == null || "next".equals(e.sourceHandle())))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }
}
