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
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class SmartDelayNodeExecutor implements NodeExecutor {

    private final BotDialogStateService stateService;

    @Override
    public NodeType getType() {
        return NodeType.SMART_DELAY;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data();

        String nextNodeId = edges.stream()
                .filter(e -> e.source().equals(node.id()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);

        if (nextNodeId == null) {
            return null;
        }

        String mode = data != null ? (String) data.getOrDefault("mode", "duration") : "duration";

        if ("date".equalsIgnoreCase(mode)) {
            String dateTimeStr = data != null ? (String) data.getOrDefault("dateTime", "") : "";
            if (dateTimeStr.isEmpty()) {
                return nextNodeId;
            }
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm");
                LocalDateTime targetTime = LocalDateTime.parse(dateTimeStr.trim(), formatter);
                long targetMs = targetTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
                if (System.currentTimeMillis() >= targetMs) {
                    return nextNodeId;
                }
            } catch (Exception e) {
                log.error("Failed to parse target datetime {} in node {}", dateTimeStr, node.id(), e);
                return nextNodeId;
            }
            return null;
        } else {
            int waitAmount = 12;
            Object amtObj = data != null ? data.get("waitAmount") : null;
            if (amtObj instanceof Number) {
                waitAmount = ((Number) amtObj).intValue();
            } else if (amtObj instanceof String) {
                try {
                    waitAmount = Integer.parseInt((String) amtObj);
                } catch (NumberFormatException e) {
                    log.error("Invalid waitAmount string", e);
                }
            }

            String waitUnit = data != null ? (String) data.getOrDefault("waitUnit", "Hours") : "Hours";
            String delayKey = "delay_start_" + node.id();

            Map<String, String> sessionData = stateService.getSessionData(botId, telegramUserId);
            String startStr = sessionData.get(delayKey);

            if (startStr == null || startStr.trim().isEmpty()) {
                stateService.setSessionData(botId, telegramUserId, delayKey, String.valueOf(System.currentTimeMillis()));
                return null;
            } else {
                try {
                    long startTime = Long.parseLong(startStr.trim());
                    long elapsed = System.currentTimeMillis() - startTime;
                    long durationMs;
                    if ("Minutes".equalsIgnoreCase(waitUnit)) {
                        durationMs = waitAmount * 60 * 1000L;
                    } else if ("Days".equalsIgnoreCase(waitUnit)) {
                        durationMs = waitAmount * 86400 * 1000L;
                    } else {
                        durationMs = waitAmount * 3600 * 1000L;
                    }

                    if (elapsed >= durationMs) {
                        stateService.setSessionData(botId, telegramUserId, delayKey, "");
                        return nextNodeId;
                    }
                } catch (NumberFormatException e) {
                    log.error("Invalid delay start timestamp", e);
                    stateService.setSessionData(botId, telegramUserId, delayKey, String.valueOf(System.currentTimeMillis()));
                }
                return null;
            }
        }
    }
}
