package com.launchly.analytics.service.impl;

import com.launchly.bot.engine.model.FlowNode;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.launchly.analytics.dto.response.DashboardStatsResponse;
import com.launchly.analytics.entity.AnalyticsEvent;
import com.launchly.analytics.entity.AnalyticsEventType;
import com.launchly.analytics.repository.AnalyticsEventRepository;
import com.launchly.analytics.service.AnalyticsService;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final AnalyticsEventRepository analyticsEventRepository;
    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final FlowSchemaRepository flowSchemaRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void logEvent(Long botId, BotUser botUser, AnalyticsEventType type, String name) {
        try {
            Bot bot = botRepository.findById(botId).orElse(null);
            if (bot == null) {
                log.warn("Cannot log event: bot {} not found", botId);
                return;
            }

            AnalyticsEvent event = AnalyticsEvent.builder()
                    .bot(bot)
                    .botUser(botUser)
                    .eventType(type)
                    .eventName(name)
                    .build();

            analyticsEventRepository.save(event);
            log.debug("Logged analytics event {}/{} for bot {}", type, name, botId);
        } catch (Exception e) {
            log.error("Failed to log analytics event", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(Long botId, int days, Long userId) {
        LocalDateTime startActivityDate = LocalDateTime.now().minusDays(days);
        LocalDateTime startClicks30d = LocalDateTime.now().minusDays(30);
        LocalDateTime start24h = LocalDateTime.now().minusHours(24);

        List<Long> botIds = new ArrayList<>();
        long totalSubscribers = 0;
        long activeUsers24h = 0;
        long clicksCount30d = 0;
        long activeAutomations = 0;

        List<Object[]> rawDaily = new ArrayList<>();
        List<Object[]> rawButtons = new ArrayList<>();

        if (botId == 0) {
            List<Bot> userBots = botRepository.findAllByUserId(userId);
            if (userBots.isEmpty()) {
                return new DashboardStatsResponse(0L, 0L, 0L, 0L, new ArrayList<>(), new ArrayList<>());
            }
            botIds = userBots.stream().map(Bot::getId).toList();

            totalSubscribers = botUserRepository.countByBotIdIn(botIds);
            activeUsers24h = analyticsEventRepository.countActiveUsersByBotIdsAndCreatedAtAfter(botIds, start24h);
            clicksCount30d = analyticsEventRepository.countClicksByBotIdsAndCreatedAtAfter(botIds, startClicks30d);
            activeAutomations = userBots.stream().filter(Bot::isActive).count();

            rawDaily = analyticsEventRepository.getDailyActivityStatsForBots(botIds, startActivityDate);
            rawButtons = analyticsEventRepository.getTopClickedButtonsForBots(botIds, startActivityDate, 10);
        } else {
            Bot bot = botRepository.findById(botId)
                    .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bot not found"));

            if (!bot.getUser().getId().equals(userId)) {
                throw new AppException(HttpStatus.FORBIDDEN, "Access denied to bot analytics");
            }
            botIds.add(botId);

            totalSubscribers = botUserRepository.countByBotId(botId);
            activeUsers24h = analyticsEventRepository.countActiveUsersByBotIdAndCreatedAtAfter(botId, start24h);
            clicksCount30d = analyticsEventRepository.countClicksByBotIdAndCreatedAtAfter(botId, startClicks30d);
            activeAutomations = botRepository.findAllByUserId(userId).stream()
                    .filter(Bot::isActive)
                    .count();

            rawDaily = analyticsEventRepository.getDailyActivityStats(botId, startActivityDate);
            rawButtons = analyticsEventRepository.getTopClickedButtons(botId, startActivityDate, 10);
        }

        List<DashboardStatsResponse.DailyStatsEntry> dailyStats = new ArrayList<>();
        for (Object[] row : rawDaily) {
            String date = row[0] != null ? row[0].toString() : "";
            long activeUsers = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            long clicks = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            dailyStats.add(new DashboardStatsResponse.DailyStatsEntry(date, activeUsers, clicks));
        }

        List<DashboardStatsResponse.ButtonStatsEntry> topButtons = new ArrayList<>();
        for (Object[] row : rawButtons) {
            String btnName = row[0] != null ? row[0].toString() : "Unknown";
            if (btnName.startsWith("btn_")) {
                btnName = resolveButtonLabel(botIds, btnName);
            }
            long clicks = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            topButtons.add(new DashboardStatsResponse.ButtonStatsEntry(btnName, clicks));
        }

        return new DashboardStatsResponse(
                totalSubscribers,
                activeUsers24h,
                clicksCount30d,
                activeAutomations,
                dailyStats,
                topButtons
        );
    }

    @SuppressWarnings("unchecked")
    private String resolveButtonLabel(List<Long> botIds, String callbackData) {
        if (callbackData == null) {
            return "Unknown Button";
        }
        for (Long bId : botIds) {
            try {
                com.launchly.bot.entity.FlowSchema schema = flowSchemaRepository.findByBotId(bId).orElse(null);
                if (schema != null && schema.getNodes() != null) {
                    List<FlowNode> nodes = objectMapper.readValue(
                            schema.getNodes(),
                            new TypeReference<List<FlowNode>>() {}
                    );
                    for (FlowNode node : nodes) {
                        Map<String, Object> data = node.data();
                        if (data == null) continue;

                        List<?> topLevelButtons = (List<?>) data.get("buttons");
                        if (topLevelButtons != null) {
                            for (Object btnObj : topLevelButtons) {
                                if (btnObj instanceof Map) {
                                    Map<String, Object> btn = (Map<String, Object>) btnObj;
                                    if (callbackData.equals(btn.get("value"))) {
                                        Object label = btn.get("label");
                                        if (label != null) return label.toString();
                                    }
                                }
                            }
                        }

                        List<Map<String, Object>> blocks = (List<Map<String, Object>>) data.get("blocks");
                        if (blocks != null) {
                            for (Map<String, Object> block : blocks) {
                                List<?> blockButtons = (List<?>) block.get("buttons");
                                if (blockButtons != null) {
                                    for (Object btnObj : blockButtons) {
                                        if (btnObj instanceof Map) {
                                            Map<String, Object> btn = (Map<String, Object>) btnObj;
                                            if (callbackData.equals(btn.get("value"))) {
                                                Object label = btn.get("label");
                                                if (label != null) return label.toString();
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
            }
        }
        return callbackData;
    }
}
