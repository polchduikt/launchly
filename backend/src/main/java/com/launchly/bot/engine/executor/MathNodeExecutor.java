package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.action.ActionContactManager;
import com.launchly.bot.engine.action.ActionPlaceholderResolver;
import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import tools.jackson.databind.ObjectMapper;
import java.security.SecureRandom;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class MathNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;
    private final ActionContactManager contactManager;
    private final ActionPlaceholderResolver placeholderResolver;
    private final ObjectMapper objectMapper;
    private final SecureRandom random = new SecureRandom();

    @Override
    public NodeType getType() {
        return NodeType.MATH;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data();

        if (data == null) {
            return getDefaultTarget(edges, node.id());
        }

        String targetField = (String) data.get("targetField");
        if (targetField == null || targetField.trim().isEmpty()) {
            targetField = "points";
        }
        targetField = targetField.trim();

        String valueField = (String) data.get("valueField");
        if (valueField == null || valueField.trim().isEmpty()) {
            valueField = (String) data.get("resultVariable");
        }
        if (valueField != null) {
            valueField = valueField.trim();
        }

        String operationMode = (String) data.getOrDefault("operationMode", "RANDOM");
        String operationType = (String) data.getOrDefault("operationType", "ADD");

        Map<String, String> sessionData = stateService.getSessionData(botId, telegramUserId);
        String chatScope = resolveChatScope(update);

        double curVal = getCurrentNumericValue(botUser, chatScope, targetField, sessionData);
        double operand = calculateOperand(data, operationMode, sessionData, botUser);

        double newVal;
        switch (operationType != null ? operationType.toUpperCase() : "ADD") {
            case "SUBTRACT" -> newVal = curVal - operand;
            case "SET" -> newVal = operand;
            case "MULTIPLY" -> newVal = curVal * operand;
            case "DIVIDE" -> newVal = (operand != 0) ? curVal / operand : curVal;
            case "ADD" -> newVal = curVal + operand;
            default -> newVal = curVal + operand;
        }

        String formattedNewVal = formatNumber(newVal);
        String formattedOperand = formatNumber(operand);

        contactManager.updateContactCustomField(botUser, chatScope, targetField, formattedNewVal);
        stateService.setSessionData(botId, telegramUserId, targetField, formattedNewVal);

        if (valueField != null && !valueField.isEmpty()) {
            contactManager.updateContactCustomField(botUser, chatScope, valueField, formattedOperand);
            stateService.setSessionData(botId, telegramUserId, valueField, formattedOperand);
        }

        stateService.setSessionData(botId, telegramUserId, targetField + "_change", formattedOperand);
        stateService.setSessionData(botId, telegramUserId, "awarded_points", formattedOperand);

        log.info("Math operation for botUser {} in chatScope '{}': sumField '{}' (new={}), valueField '{}' (val={})",
                botUser.getId(), chatScope, targetField, formattedNewVal, valueField, formattedOperand);

        return getDefaultTarget(edges, node.id());
    }

    private String resolveChatScope(Update update) {
        if (update != null) {
            if (update.hasMessage() && update.getMessage().getChat() != null) {
                String type = update.getMessage().getChat().getType();
                if ("private".equalsIgnoreCase(type)) {
                    return "private";
                }
                return update.getMessage().getChatId().toString();
            }
            if (update.hasCallbackQuery() && update.getCallbackQuery().getMessage() != null && update.getCallbackQuery().getMessage().getChat() != null) {
                String type = update.getCallbackQuery().getMessage().getChat().getType();
                if ("private".equalsIgnoreCase(type)) {
                    return "private";
                }
                return update.getCallbackQuery().getMessage().getChatId().toString();
            }
            if (update.hasChannelPost() && update.getChannelPost().getChat() != null) {
                return update.getChannelPost().getChatId().toString();
            }
        }
        return "private";
    }

    @SuppressWarnings("unchecked")
    private double getCurrentNumericValue(BotUser botUser, String chatScope, String fieldName, Map<String, String> sessionData) {
        try {
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                Map<String, Object> meta = objectMapper.readValue(botUser.getMetadata(), Map.class);
                if (chatScope != null && !chatScope.isEmpty() && !"private".equalsIgnoreCase(chatScope)) {
                    Map<String, Object> chatCustomFields = (Map<String, Object>) meta.get("chatCustomFields");
                    if (chatCustomFields != null) {
                        Map<String, Object> groupFields = (Map<String, Object>) chatCustomFields.get(chatScope);
                        if (groupFields != null && groupFields.get(fieldName) != null) {
                            Object valObj = groupFields.get(fieldName);
                            if (valObj instanceof Number num) {
                                return num.doubleValue();
                            }
                            return Double.parseDouble(valObj.toString().trim());
                        }
                    }
                    return 0.0;
                } else {
                    Map<String, Object> custom = (Map<String, Object>) meta.get("customFields");
                    if (custom != null && custom.get(fieldName) != null) {
                        Object valObj = custom.get(fieldName);
                        if (valObj instanceof Number num) {
                            return num.doubleValue();
                        }
                        return Double.parseDouble(valObj.toString().trim());
                    }
                }
            }
        } catch (Exception ignored) {}

        String sessionVal = sessionData.get(fieldName);
        if (sessionVal != null && !sessionVal.trim().isEmpty()) {
            try {
                return Double.parseDouble(sessionVal.trim());
            } catch (NumberFormatException ignored) {}
        }

        return 0.0;
    }

    private double calculateOperand(Map<String, Object> data, String operationMode,
                                    Map<String, String> sessionData, BotUser botUser) {
        if ("STATIC".equalsIgnoreCase(operationMode)) {
            Object rawStatic = data.get("staticValue");
            if (rawStatic != null) {
                String resolved = placeholderResolver.resolveValue(rawStatic.toString(), sessionData, botUser);
                try {
                    return Double.parseDouble(resolved.trim());
                } catch (NumberFormatException e) {
                    log.warn("Failed to parse staticValue '{}' as number: {}", resolved, e.getMessage());
                }
            }
            return 1.0;
        }

        double min = parseDouble(data.get("randomMin"), 1.0);
        double max = parseDouble(data.get("randomMax"), 10.0);
        double step = parseDouble(data.get("randomStep"), 1.0);

        if (max < min) {
            double tmp = min;
            min = max;
            max = tmp;
        }
        if (step <= 0) {
            step = 1.0;
        }

        int stepsCount = (int) Math.floor((max - min) / step);
        if (stepsCount <= 0) {
            return min;
        }

        int chosenStep = random.nextInt(stepsCount + 1);
        return min + (chosenStep * step);
    }

    private double parseDouble(Object obj, double fallback) {
        if (obj == null) return fallback;
        if (obj instanceof Number num) return num.doubleValue();
        try {
            return Double.parseDouble(obj.toString().trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private String formatNumber(double val) {
        if (val == Math.floor(val) && !Double.isInfinite(val)) {
            return String.valueOf((long) val);
        }
        return String.format(Locale.US, "%.2f", val);
    }

    private String getDefaultTarget(List<FlowEdge> edges, String nodeId) {
        return edges.stream()
                .filter(e -> e.source().equals(nodeId))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }
}