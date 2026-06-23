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

    @SuppressWarnings("unchecked")
    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data();

        Map<String, String> sessionData = stateService.getSessionData(botId, telegramUserId);

        if (data != null && data.containsKey("branches")) {
            List<Map<String, Object>> branches = (List<Map<String, Object>>) data.get("branches");
            if (branches != null) {
                for (int i = 0; i < branches.size(); i++) {
                    Map<String, Object> branch = branches.get(i);
                    String matchType = (String) branch.getOrDefault("matchType", "all");
                    List<Map<String, Object>> conditions = (List<Map<String, Object>>) branch.get("conditions");

                    boolean branchResult = evaluateBranch(conditions, matchType, botUser, sessionData);
                    if (branchResult) {
                        String handleId = "branch_" + i;
                        String target = findTarget(edges, node.id(), handleId);
                        if (target != null) {
                            return target;
                        }
                    }
                }
            }
            return findTarget(edges, node.id(), "fallback");
        }

        String variable = data != null ? (String) data.getOrDefault("variable", "") : "";
        String operator = data != null ? (String) data.getOrDefault("operator", "equals") : "equals";
        String compareValue = data != null ? (String) data.getOrDefault("value", "") : "";

        String actualValue = resolveVariable(variable, botUser, sessionData);
        boolean result = evaluateCondition(actualValue, operator, compareValue, false);

        String handle = result ? "true" : "false";
        String target = findTarget(edges, node.id(), handle);
        if (target != null) {
            return target;
        }

        return edges.stream()
                .filter(e -> e.source().equals(node.id()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }

    private String findTarget(List<FlowEdge> edges, String nodeId, String handleId) {
        return edges.stream()
                .filter(e -> e.source().equals(nodeId))
                .filter(e -> handleId.equals(e.sourceHandle()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }

    private boolean evaluateBranch(List<Map<String, Object>> conditions, String matchType, BotUser botUser, Map<String, String> sessionData) {
        if (conditions == null || conditions.isEmpty()) {
            return false;
        }
        boolean isAll = "all".equalsIgnoreCase(matchType);
        for (Map<String, Object> cond : conditions) {
            String variable = (String) cond.getOrDefault("variable", "");
            String operator = (String) cond.getOrDefault("operator", "is");
            String expected = (String) cond.getOrDefault("value", "");
            boolean caseSensitive = Boolean.TRUE.equals(cond.get("caseSensitive"));

            String actual = resolveVariable(variable, botUser, sessionData);
            boolean condResult = evaluateCondition(actual, operator, expected, caseSensitive);

            if (isAll && !condResult) {
                return false;
            }
            if (!isAll && condResult) {
                return true;
            }
        }
        return isAll;
    }

    private String resolveVariable(String variable, BotUser botUser, Map<String, String> sessionData) {
        String varName = variable != null ? variable.trim() : "";
        if (varName.equalsIgnoreCase("First Name") || varName.equalsIgnoreCase("first_name")) {
            return botUser.getFirstName() != null ? botUser.getFirstName() : "";
        }
        if (varName.equalsIgnoreCase("Last Name") || varName.equalsIgnoreCase("last_name")) {
            return botUser.getLastName() != null ? botUser.getLastName() : "";
        }
        if (varName.equalsIgnoreCase("Full Name") || varName.equalsIgnoreCase("full_name")) {
            String first = botUser.getFirstName() != null ? botUser.getFirstName() : "";
            String last = botUser.getLastName() != null ? botUser.getLastName() : "";
            return (first + " " + last).trim();
        }
        if (varName.equalsIgnoreCase("Telegram Username") || varName.equalsIgnoreCase("telegram_username")) {
            return botUser.getUsername() != null ? botUser.getUsername() : "";
        }
        if (varName.equalsIgnoreCase("Telegram User ID") || varName.equalsIgnoreCase("telegram_user_id")) {
            return botUser.getTelegramId() != null ? String.valueOf(botUser.getTelegramId()) : "";
        }
        if (varName.equalsIgnoreCase("Contact Id") || varName.equalsIgnoreCase("contact_id")) {
            return botUser.getId() != null ? String.valueOf(botUser.getId()) : "";
        }
        return sessionData.getOrDefault(varName, "");
    }

    private boolean evaluateCondition(String actual, String operator, String expected, boolean caseSensitive) {
        String actVal = actual != null ? actual : "";
        String expVal = expected != null ? expected : "";
        switch (operator.toLowerCase()) {
            case "is":
            case "equals":
                return caseSensitive ? actVal.equals(expVal) : actVal.equalsIgnoreCase(expVal);
            case "isn_t":
            case "not_equals":
                return caseSensitive ? !actVal.equals(expVal) : !actVal.equalsIgnoreCase(expVal);
            case "contains":
                return caseSensitive ? actVal.contains(expVal) : actVal.toLowerCase().contains(expVal.toLowerCase());
            case "doesn_t_contain":
                return caseSensitive ? !actVal.contains(expVal) : !actVal.toLowerCase().contains(expVal.toLowerCase());
            case "begins_with":
                return caseSensitive ? actVal.startsWith(expVal) : actVal.toLowerCase().startsWith(expVal.toLowerCase());
            case "has_any_value":
            case "not_empty":
                return !actVal.isEmpty();
            case "is_unknown":
            case "empty":
                return actVal.isEmpty();
            default:
                return false;
        }
    }
}
