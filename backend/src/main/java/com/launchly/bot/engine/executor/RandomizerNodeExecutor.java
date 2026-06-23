package com.launchly.bot.engine.executor;

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
import java.util.List;
import java.util.Map;
import java.util.Random;

@Component
@RequiredArgsConstructor
@Slf4j
public class RandomizerNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;
    private final Random random = new Random();

    @Override
    public NodeType getType() {
        return NodeType.RANDOMIZER;
    }

    @SuppressWarnings("unchecked")
    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data();

        if (data == null) {
            return getDefaultTarget(edges, node.id());
        }

        boolean pickEveryTime = Boolean.TRUE.equals(data.get("pickEveryTime"));
        String sessionKey = "randomizer_choice_" + node.id();

        if (!pickEveryTime) {
            Map<String, String> sessionData = stateService.getSessionData(botId, telegramUserId);
            String existingChoice = sessionData.get(sessionKey);
            if (existingChoice != null && !existingChoice.trim().isEmpty()) {
                String target = findTarget(edges, node.id(), existingChoice.trim());
                if (target != null) {
                    return target;
                }
            }
        }

        List<Map<String, Object>> variations = (List<Map<String, Object>>) data.get("variations");
        if (variations == null || variations.isEmpty()) {
            return getDefaultTarget(edges, node.id());
        }

        double totalWeight = 0;
        for (Map<String, Object> v : variations) {
            Object pctObj = v.get("percentage");
            double pct = 0;
            if (pctObj instanceof Number) {
                pct = ((Number) pctObj).doubleValue();
            } else if (pctObj instanceof String) {
                try {
                    pct = Double.parseDouble((String) pctObj);
                } catch (NumberFormatException e) {
                    log.error("Failed to parse percentage in variation", e);
                }
            }
            totalWeight += pct;
        }

        Map<String, Object> selectedVariation = null;
        if (totalWeight <= 0) {
            selectedVariation = variations.get(random.nextInt(variations.size()));
        } else {
            double roll = random.nextDouble() * totalWeight;
            double cumulative = 0;
            for (Map<String, Object> v : variations) {
                Object pctObj = v.get("percentage");
                double pct = 0;
                if (pctObj instanceof Number) {
                    pct = ((Number) pctObj).doubleValue();
                } else if (pctObj instanceof String) {
                    try {
                        pct = Double.parseDouble((String) pctObj);
                    } catch (NumberFormatException e) {
                        pct = 0;
                    }
                }
                cumulative += pct;
                if (roll < cumulative) {
                    selectedVariation = v;
                    break;
                }
            }
            if (selectedVariation == null) {
                selectedVariation = variations.get(variations.size() - 1);
            }
        }

        String selectedId = (String) selectedVariation.get("id");

        if (!pickEveryTime && selectedId != null) {
            stateService.setSessionData(botId, telegramUserId, sessionKey, selectedId);
        }

        if (selectedId != null) {
            String target = findTarget(edges, node.id(), selectedId);
            if (target != null) {
                return target;
            }
        }

        return getDefaultTarget(edges, node.id());
    }

    private String findTarget(List<FlowEdge> edges, String nodeId, String handleId) {
        return edges.stream()
                .filter(e -> e.source().equals(nodeId))
                .filter(e -> handleId.equals(e.sourceHandle()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }

    private String getDefaultTarget(List<FlowEdge> edges, String nodeId) {
        return edges.stream()
                .filter(e -> e.source().equals(nodeId))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }
}
