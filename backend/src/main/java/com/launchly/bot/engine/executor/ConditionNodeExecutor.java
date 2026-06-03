package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ConditionNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;

    @Override
    public NodeType getType() {
        return NodeType.CONDITION;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data();

        String variable = data != null ? (String) data.getOrDefault("variable", "") : "";
        String operator = data != null ? (String) data.getOrDefault("operator", "equals") : "equals";
        String compareValue = data != null ? (String) data.getOrDefault("value", "") : "";

        Map<String, String> sessionData = stateService.getSessionData(botId, telegramUserId);
        String actualValue = sessionData.getOrDefault(variable, "");

        boolean result = evaluateCondition(actualValue, operator, compareValue);

        String handle = result ? "true" : "false";
        return edges.stream()
                .filter(e -> e.source().equals(node.id()))
                .filter(e -> handle.equals(e.sourceHandle()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(edges.stream()
                        .filter(e -> e.source().equals(node.id()))
                        .findFirst()
                        .map(FlowEdge::target)
                        .orElse(null));
    }

    private boolean evaluateCondition(String actual, String operator, String expected) {
        return switch (operator) {
            case "equals" -> actual.equalsIgnoreCase(expected);
            case "not_equals" -> !actual.equalsIgnoreCase(expected);
            case "contains" -> actual.toLowerCase().contains(expected.toLowerCase());
            case "not_empty" -> !actual.isEmpty();
            case "empty" -> actual.isEmpty();
            default -> false;
        };
    }
}
