package com.launchly.bot.scheduler;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.bot.service.FlowEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class FlowDelayScheduler {

    private final BotUserRepository botUserRepository;
    private final FlowSchemaRepository flowSchemaRepository;
    private final BotDialogStateService stateService;
    private final FlowEngineService flowEngineService;
    private final ObjectMapper objectMapper;

    @Scheduled(fixedDelay = 15000)
    public void processDelays() {
        List<BotUser> pausedUsers = botUserRepository.findByCurrentNodeIdIsNotNull();
        for (BotUser user : pausedUsers) {
            try {
                processUserDelay(user);
            } catch (Exception e) {
                log.error("Failed to process delay for user {}", user.getId(), e);
            }
        }
    }

    private void processUserDelay(BotUser user) throws Exception {
        Long botId = user.getBot().getId();
        String currentNodeId = user.getCurrentNodeId();
        Optional<FlowSchema> schemaOpt = flowSchemaRepository.findByBotId(botId);
        if (schemaOpt.isEmpty()) {
            return;
        }

        FlowSchema schema = schemaOpt.get();
        List<FlowNode> nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
        List<FlowEdge> edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});

        FlowNode currentNode = nodes.stream()
                .filter(n -> n.id().equals(currentNodeId))
                .findFirst()
                .orElse(null);

        if (currentNode == null || currentNode.type() != NodeType.SMART_DELAY) {
            return;
        }

        Map<String, Object> data = currentNode.data();
        String nextNodeId = edges.stream()
                .filter(e -> e.source().equals(currentNode.id()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);

        if (nextNodeId == null) {
            return;
        }

        String mode = data != null ? (String) data.getOrDefault("mode", "duration") : "duration";
        boolean expired = false;

        if ("date".equalsIgnoreCase(mode)) {
            String dateTimeStr = data != null ? (String) data.getOrDefault("dateTime", "") : "";
            if (dateTimeStr.isEmpty()) {
                expired = true;
            } else {
                try {
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/dd/yyyy HH:mm");
                    LocalDateTime targetTime = LocalDateTime.parse(dateTimeStr.trim(), formatter);
                    long targetMs = targetTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
                    expired = System.currentTimeMillis() >= targetMs;
                } catch (Exception e) {
                    expired = true;
                }
            }
        } else {
            int waitAmount = 12;
            Object amtObj = data != null ? data.get("waitAmount") : null;
            if (amtObj instanceof Number) {
                waitAmount = ((Number) amtObj).intValue();
            } else if (amtObj instanceof String) {
                try {
                    waitAmount = Integer.parseInt((String) amtObj);
                } catch (NumberFormatException e) {
                    log.error("Invalid waitAmount", e);
                }
            }

            String waitUnit = data != null ? (String) data.getOrDefault("waitUnit", "Hours") : "Hours";
            String delayKey = "delay_start_" + currentNode.id();

            Map<String, String> sessionData = stateService.getSessionData(botId, user.getTelegramId());
            String startStr = sessionData.get(delayKey);

            if (startStr == null || startStr.trim().isEmpty()) {
                stateService.setSessionData(botId, user.getTelegramId(), delayKey, String.valueOf(System.currentTimeMillis()));
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

                    expired = elapsed >= durationMs;
                } catch (NumberFormatException e) {
                    stateService.setSessionData(botId, user.getTelegramId(), delayKey, String.valueOf(System.currentTimeMillis()));
                }
            }
        }

        if (expired) {
            String delayKey = "delay_start_" + currentNode.id();
            stateService.setSessionData(botId, user.getTelegramId(), delayKey, "");
            flowEngineService.runFlow(botId, user, nextNodeId, null);
        }
    }
}
