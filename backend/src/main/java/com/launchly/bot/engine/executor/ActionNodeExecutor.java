package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.action.BotActionHandler;
import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.service.BotDialogStateService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class ActionNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;
    private final Map<String, BotActionHandler> handlerMap = new HashMap<>();

    public ActionNodeExecutor(BotDialogStateService stateService, List<BotActionHandler> handlers) {
        this.stateService = stateService;
        if (handlers != null) {
            for (BotActionHandler handler : handlers) {
                for (String type : handler.getSupportedTypes()) {
                    handlerMap.put(type, handler);
                }
            }
        }
    }

    @Override
    public NodeType getType() {
        return NodeType.ACTION;
    }

    @Override
    @SuppressWarnings("unchecked")
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data();

        log.info("Executing Action Node {} for bot user {}", node.id(), telegramUserId);

        if (data != null && data.get("actions") instanceof List) {
            List<Map<String, Object>> actions = (List<Map<String, Object>>) data.get("actions");
            Map<String, String> sessionData = stateService.getSessionData(botId, telegramUserId);

            for (Map<String, Object> action : actions) {
                String type = (String) action.get("type");
                if (type == null) {
                    continue;
                }

                try {
                    BotActionHandler handler = handlerMap.get(type);
                    if (handler != null) {
                        handler.execute(type, action, botUser, sessionData);
                    } else {
                        log.warn("Unknown action type: {}", type);
                    }
                } catch (Exception e) {
                    log.error("Error executing action type {} in node {}: {}", type, node.id(), e.getMessage(), e);
                }
            }
        }

        return edges.stream()
                .filter(e -> e.source().equals(node.id()) && (e.sourceHandle() == null || "next".equals(e.sourceHandle())))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }
}
