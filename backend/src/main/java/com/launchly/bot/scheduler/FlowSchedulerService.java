package com.launchly.bot.scheduler;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.bot.service.FlowEngineService;
import com.launchly.broadcast.repository.BotUserTagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlowSchedulerService {

    private static final long SCHEDULE_CHECK_INTERVAL_MS = 10_000L;
    private static final Duration LOCK_DURATION = Duration.ofSeconds(15);
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Europe/Kyiv");

    private final FlowSchemaRepository flowSchemaRepository;
    private final BotUserRepository botUserRepository;
    private final BotUserTagRepository botUserTagRepository;
    private final FlowEngineService flowEngineService;
    private final ObjectMapper objectMapper;
    private final StringRedisTemplate redisTemplate;

    @Scheduled(fixedDelay = SCHEDULE_CHECK_INTERVAL_MS)
    public void processScheduledFlows() {
        List<FlowSchema> schemas = flowSchemaRepository.findAllByBotActiveTrue();
        for (FlowSchema schema : schemas) {
            try {
                processSchema(schema);
            } catch (Exception e) {
                log.error("Failed to process scheduled flow for botId={}", schema.getBot() != null ? schema.getBot().getId() : null, e);
            }
        }
    }

    private void processSchema(FlowSchema schema) throws Exception {
        if (schema == null || schema.getBot() == null) {
            return;
        }

        String pubNodes = schema.getEffectivePublishedNodes();
        String pubEdges = schema.getEffectivePublishedEdges();
        if (pubNodes == null || pubNodes.isBlank() || "[]".equals(pubNodes.trim())) {
            return;
        }

        if (!schema.getBot().isActive()) {
            return;
        }

        Long botId = schema.getBot().getId();
        List<FlowNode> nodes = objectMapper.readValue(pubNodes, new TypeReference<>() {});
        List<FlowEdge> edges = objectMapper.readValue(pubEdges, new TypeReference<>() {});

        List<FlowNode> schedulerNodes = nodes.stream()
                .filter(n -> n.type() == NodeType.SCHEDULER)
                .toList();

        if (schedulerNodes.isEmpty()) {
            return;
        }

        for (FlowNode node : schedulerNodes) {
            try {
                evaluateAndTriggerScheduler(botId, node, edges);
            } catch (Exception e) {
                log.error("Error evaluating scheduler node {} for botId={}", node.id(), botId, e);
            }
        }
    }

    private void evaluateAndTriggerScheduler(Long botId, FlowNode node, List<FlowEdge> edges) {
        Map<String, Object> data = node.data() != null ? node.data() : Collections.emptyMap();
        String timezoneStr = (String) data.getOrDefault("timezone", "Europe/Kyiv");
        if (timezoneStr == null || timezoneStr.isBlank() || "UTC".equalsIgnoreCase(timezoneStr)) {
            timezoneStr = "Europe/Kyiv";
        }
        ZoneId zoneId;
        try {
            zoneId = ZoneId.of(timezoneStr);
        } catch (Exception e) {
            zoneId = DEFAULT_ZONE;
        }

        ZonedDateTime now = ZonedDateTime.now(zoneId);
        String frequency = (String) data.getOrDefault("frequency", data.getOrDefault("scheduleType", "daily"));
        String timeStr = (String) data.getOrDefault("time", "00:00");
        String lastRunKey;
        if ("interval".equalsIgnoreCase(frequency)) {
            lastRunKey = "flow:scheduler:last_run:" + botId + ":" + node.id() + ":interval";
        } else if ("cron".equalsIgnoreCase(frequency)) {
            lastRunKey = "flow:scheduler:last_run:" + botId + ":" + node.id() + ":cron";
        } else {
            lastRunKey = "flow:scheduler:last_run:" + botId + ":" + node.id() + ":" + frequency.toLowerCase() + ":" + timeStr;
        }

        boolean isDue = isExecutionDue(lastRunKey, data, frequency, timeStr, now, zoneId);
        if (isDue) {
            log.info("Scheduler node {} is DUE for botId={}: freq={}, targetTime={}, nowKyiv={}",
                    node.id(), botId, frequency, timeStr, now.format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        } else {
            log.debug("Scheduler node {} botId={}: freq={}, targetTime={}, nowKyiv={}, isDue=false",
                    node.id(), botId, frequency, timeStr, now.format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        }

        if (!isDue) {
            return;
        }

        String lockKey = "lock:flow:scheduler:" + botId + ":" + node.id();
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", LOCK_DURATION);
        if (Boolean.FALSE.equals(acquired)) {
            log.debug("Scheduler node {} for botId={} skipped due to active lock", node.id(), botId);
            return;
        }

        String nextNodeId = edges.stream()
                .filter(e -> e.source().equals(node.id()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);

        if (nextNodeId == null || nextNodeId.isBlank()) {
            log.warn("Scheduler node {} for botId={} has no outgoing connection", node.id(), botId);
            return;
        }

        if ("interval".equalsIgnoreCase(frequency) || "cron".equalsIgnoreCase(frequency)) {
            redisTemplate.opsForValue().set(lastRunKey, String.valueOf(System.currentTimeMillis()), Duration.ofDays(7));
        } else {
            redisTemplate.opsForValue().set(lastRunKey, now.toLocalDate().toString(), Duration.ofDays(7));
        }

        String targetScope = (String) data.getOrDefault("targetScope", data.getOrDefault("scope", "all"));
        String targetTag = (String) data.getOrDefault("targetTag", "");

        log.info("Triggering SCHEDULER node {} on botId={} for scope='{}' -> nextNodeId={}",
                node.id(), botId, targetScope, nextNodeId);

        dispatchFlowExecution(botId, nextNodeId, targetScope, targetTag);
    }

    private boolean isExecutionDue(String lastRunKey, Map<String, Object> data, String frequency, String timeStr, ZonedDateTime now, ZoneId zoneId) {
        LocalTime targetTime;
        try {
            targetTime = LocalTime.parse(timeStr.trim(), DateTimeFormatter.ofPattern("HH:mm"));
        } catch (Exception e) {
            targetTime = LocalTime.of(9, 0);
        }

        switch (frequency.toLowerCase()) {
            case "interval" -> {
                int intervalVal = 1;
                Object valObj = data.get("intervalValue");
                if (valObj instanceof Number num) {
                    intervalVal = num.intValue();
                } else if (valObj instanceof String str && !str.isBlank()) {
                    try {
                        intervalVal = Integer.parseInt(str.trim());
                    } catch (NumberFormatException ignored) {}
                }
                String intervalUnit = (String) data.getOrDefault("intervalUnit", "hours");
                long intervalMs = switch (intervalUnit.toLowerCase()) {
                    case "minutes" -> intervalVal * 60_000L;
                    case "days" -> intervalVal * 86_400_000L;
                    default -> intervalVal * 3_600_000L; // hours
                };
                String lastRunStr = redisTemplate.opsForValue().get(lastRunKey);
                if (lastRunStr == null || lastRunStr.isBlank()) {
                    redisTemplate.opsForValue().set(lastRunKey, String.valueOf(System.currentTimeMillis()), Duration.ofDays(7));
                    return false;
                }
                try {
                    long lastRunMs = Long.parseLong(lastRunStr.trim());
                    return System.currentTimeMillis() - lastRunMs >= intervalMs;
                } catch (NumberFormatException e) {
                    redisTemplate.opsForValue().set(lastRunKey, String.valueOf(System.currentTimeMillis()), Duration.ofDays(7));
                    return false;
                }
            }

            case "daily" -> {
                boolean isSameMinute = now.getHour() == targetTime.getHour() && now.getMinute() == targetTime.getMinute();
                if (!isSameMinute) {
                    return false;
                }
                String lastRunDate = redisTemplate.opsForValue().get(lastRunKey);
                String todayStr = now.toLocalDate().toString();
                return !todayStr.equals(lastRunDate);
            }

            case "weekly" -> {
                Object daysObj = data.get("daysOfWeek");
                List<?> daysList = daysObj instanceof List<?> l ? l : List.of("MONDAY");
                String currentDayName = now.getDayOfWeek().name();
                boolean matchesDay = daysList.stream()
                        .anyMatch(d -> d.toString().equalsIgnoreCase(currentDayName) ||
                                d.toString().equalsIgnoreCase(currentDayName.substring(0, 3)));
                if (!matchesDay) {
                    return false;
                }
                boolean isSameMinute = now.getHour() == targetTime.getHour() && now.getMinute() == targetTime.getMinute();
                if (!isSameMinute) {
                    return false;
                }
                String lastRunDate = redisTemplate.opsForValue().get(lastRunKey);
                String todayStr = now.toLocalDate().toString();
                return !todayStr.equals(lastRunDate);
            }

            case "monthly" -> {
                int dayOfMonth = 1;
                Object domObj = data.get("dayOfMonth");
                if (domObj instanceof Number num) {
                    dayOfMonth = num.intValue();
                } else if (domObj instanceof String str && !str.isBlank()) {
                    try {
                        dayOfMonth = Integer.parseInt(str.trim());
                    } catch (NumberFormatException ignored) {}
                }
                if (now.getDayOfMonth() != dayOfMonth) {
                    return false;
                }
                boolean isSameMinute = now.getHour() == targetTime.getHour() && now.getMinute() == targetTime.getMinute();
                if (!isSameMinute) {
                    return false;
                }
                String lastRunDate = redisTemplate.opsForValue().get(lastRunKey);
                String todayStr = now.toLocalDate().toString();
                return !todayStr.equals(lastRunDate);
            }

            case "cron" -> {
                String cronExpr = (String) data.getOrDefault("cronExpression", "0 0 9 * * *");
                try {
                    CronExpression expression = CronExpression.parse(cronExpr.trim());
                    String lastRunStr = redisTemplate.opsForValue().get(lastRunKey);
                    if (lastRunStr == null || lastRunStr.isBlank()) {
                        redisTemplate.opsForValue().set(lastRunKey, String.valueOf(System.currentTimeMillis()), Duration.ofDays(7));
                        return false;
                    }
                    LocalDateTime fromDateTime = LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(Long.parseLong(lastRunStr.trim())), zoneId);
                    LocalDateTime nextRun = expression.next(fromDateTime);
                    return nextRun != null && !nextRun.isAfter(now.toLocalDateTime());
                } catch (Exception e) {
                    log.warn("Invalid cron expression '{}': {}", cronExpr, e.getMessage());
                    return false;
                }
            }

            default -> {
                return false;
            }
        }
    }

    private void dispatchFlowExecution(Long botId, String startNodeId, String targetScope, String targetTag) {
        if ("system".equalsIgnoreCase(targetScope)) {
            // Run once in context of any active bot subscriber or minimum telegramId user
            botUserRepository.findAllByBotId(botId).stream().findFirst().ifPresentOrElse(
                    user -> flowEngineService.runFlow(botId, user, startNodeId, null),
                    () -> log.warn("Cannot run system scheduler on botId={} because bot has 0 subscribers", botId)
            );
            return;
        }

        List<BotUser> targetUsers;
        if ("tag".equalsIgnoreCase(targetScope) && targetTag != null && !targetTag.isBlank()) {
            List<Long> userIds = botUserTagRepository.findBotUserIdsByTagNameAndBotId(targetTag.trim(), botId);
            if (userIds.isEmpty()) {
                log.info("No subscribers found with tag '{}' for botId={}", targetTag, botId);
                return;
            }
            targetUsers = botUserRepository.findAllById(userIds);
        } else {
            targetUsers = botUserRepository.findAllByBotId(botId);
        }

        log.info("Dispatching scheduled flow startNodeId={} to {} subscribers on botId={}",
                startNodeId, targetUsers.size(), botId);

        for (BotUser user : targetUsers) {
            try {
                flowEngineService.runFlow(botId, user, startNodeId, null);
            } catch (Exception e) {
                log.error("Error executing scheduled flow for userId={} botId={}: {}",
                        user.getId(), botId, e.getMessage());
            }
        }
    }
}
