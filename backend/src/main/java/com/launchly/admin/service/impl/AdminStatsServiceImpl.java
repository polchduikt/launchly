package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminLogDto;
import com.launchly.admin.dto.AdminStatsDto;
import com.launchly.admin.service.AdminLogService;
import com.launchly.admin.service.AdminStatsService;
import com.launchly.admin.util.AdminPeriodResolver;
import com.launchly.admin.util.AdminStatsCalculator;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.entity.SubscriptionStatus;
import com.launchly.billing.repository.PlanRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.common.utils.DateTimeUtils;
import com.launchly.common.utils.MathUtils;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.repository.IntegrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminStatsServiceImpl implements AdminStatsService {

    private final UserQueryService userQueryService;
    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final FlowSchemaRepository flowSchemaRepository;
    private final BroadcastCampaignRepository broadcastCampaignRepository;
    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final IntegrationRepository integrationRepository;
    private final AdminLogService adminLogService;
    private final AdminPeriodResolver periodResolver;

    private static final long START_TIME = System.currentTimeMillis();

    private static final Map<IntegrationType, String> INTEGRATION_DISPLAY_NAMES = Map.of(
            IntegrationType.GOOGLE_SHEETS, "Google Sheets",
            IntegrationType.EXCEL, "Excel",
            IntegrationType.WEBHOOK, "Webhook",
            IntegrationType.CHATGPT, "ChatGPT",
            IntegrationType.CLAUDE, "Claude",
            IntegrationType.DEEPSEEK, "DeepSeek",
            IntegrationType.GEMINI, "Gemini"
    );

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "admin_stats", key = "#period != null ? #period : 'all'", condition = "#search == null && #startDate == null && #endDate == null")
    public AdminStatsDto getStats(String search, String period, LocalDateTime startDate, LocalDateTime endDate) {
        LocalDateTime resolvedEnd = endDate != null ? endDate : LocalDateTime.now();
        LocalDateTime resolvedStart = periodResolver.resolve(period, startDate);
        LocalDateTime previousStart = resolvedStart.minus(Duration.between(resolvedStart.atZone(ZoneOffset.UTC), resolvedEnd.atZone(ZoneOffset.UTC)));

        long totalUsers;
        long totalOwners;
        long activeOwners;
        long totalBotUsers;
        long activeBots;
        long totalAutomations;
        long totalMessagesSent;
        long activeManagers;

        long prevOwners;
        long prevBotUsersCount;
        long prevActiveBots;
        long prevAutomations;
        long prevMessages;

        List<User> rangeUsers;
        List<Bot> rangeBots;
        List<BotUser> rangeBotUsers;
        List<FlowSchema> rangeSchemas;
        List<BroadcastCampaign> rangeBroadcasts;

        long totalOwnersCount;
        boolean hasBots;

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            List<User> allUsers = userQueryService.findAllUsers().stream()
                    .filter(u -> AdminStatsCalculator.contains(u.getName(), q) || AdminStatsCalculator.contains(u.getEmail(), q) || AdminStatsCalculator.contains(u.getTelegramUsername(), q))
                    .collect(Collectors.toList());
            List<Bot> allBots = botRepository.findAll().stream()
                    .filter(b -> AdminStatsCalculator.contains(b.getName(), q) || AdminStatsCalculator.contains(b.getUsername(), q))
                    .collect(Collectors.toList());
            List<BotUser> allBotUsers = botUserRepository.findAll();
            List<FlowSchema> allSchemas = flowSchemaRepository.findAll().stream()
                    .filter(s -> s.getBot() != null && AdminStatsCalculator.contains(s.getBot().getName(), q))
                    .collect(Collectors.toList());
            List<BroadcastCampaign> allBroadcasts = broadcastCampaignRepository.findAll().stream()
                    .filter(bc -> AdminStatsCalculator.contains(bc.getName(), q))
                    .collect(Collectors.toList());

            rangeUsers = DateTimeUtils.filterByDateRange(allUsers, User::getCreatedAt, resolvedStart, resolvedEnd);
            rangeBots = DateTimeUtils.filterByDateRange(allBots, Bot::getCreatedAt, resolvedStart, resolvedEnd);
            rangeBotUsers = DateTimeUtils.filterByDateRange(allBotUsers, BotUser::getCreatedAt, resolvedStart, resolvedEnd);
            rangeSchemas = DateTimeUtils.filterByDateRange(allSchemas, FlowSchema::getCreatedAt, resolvedStart, resolvedEnd);
            rangeBroadcasts = DateTimeUtils.filterByDateRange(allBroadcasts, BroadcastCampaign::getCreatedAt, resolvedStart, resolvedEnd);

            totalUsers = rangeUsers.size();
            totalOwners = rangeUsers.stream().filter(u -> u.getRole() == Role.ROLE_OWNER || u.getRole() == Role.ROLE_ADMIN).count();
            LocalDateTime fifteenMinsAgo = LocalDateTime.now().minusMinutes(15);
            activeOwners = allUsers.stream().filter(u -> u.isActive() && u.getUpdatedAt() != null && u.getUpdatedAt().isAfter(fifteenMinsAgo)).count();
            totalBotUsers = rangeBotUsers.size();
            activeBots = rangeBots.stream().filter(Bot::isActive).count();
            totalAutomations = rangeSchemas.size();
            totalMessagesSent = rangeBroadcasts.stream().mapToLong(c -> c.getSentCount() != null ? c.getSentCount() : 0).sum();
            activeManagers = rangeUsers.stream().filter(u -> u.getRole() == Role.ROLE_MANAGER).count();

            List<User> prevUsers = DateTimeUtils.filterByDateRange(allUsers, User::getCreatedAt, previousStart, resolvedStart);
            List<BotUser> prevBotUsers = DateTimeUtils.filterByDateRange(allBotUsers, BotUser::getCreatedAt, previousStart, resolvedStart);
            List<Bot> prevBots = DateTimeUtils.filterByDateRange(allBots, Bot::getCreatedAt, previousStart, resolvedStart);
            List<FlowSchema> prevSchemas = DateTimeUtils.filterByDateRange(allSchemas, FlowSchema::getCreatedAt, previousStart, resolvedStart);
            List<BroadcastCampaign> prevBroadcasts = DateTimeUtils.filterByDateRange(allBroadcasts, BroadcastCampaign::getCreatedAt, previousStart, resolvedStart);

            prevOwners = prevUsers.stream().filter(u -> u.getRole() == Role.ROLE_OWNER || u.getRole() == Role.ROLE_ADMIN).count();
            prevBotUsersCount = prevBotUsers.size();
            prevActiveBots = prevBots.stream().filter(Bot::isActive).count();
            prevAutomations = prevSchemas.size();
            prevMessages = prevBroadcasts.stream().mapToLong(c -> c.getSentCount() != null ? c.getSentCount() : 0).sum();

            totalOwnersCount = allUsers.stream().filter(u -> u.getRole() == Role.ROLE_OWNER || u.getRole() == Role.ROLE_ADMIN).count();
            hasBots = !allBots.isEmpty();
        } else {
            totalUsers = userQueryService.countByCreatedAtBetween(resolvedStart, resolvedEnd);
            totalOwners = userQueryService.countByRoleInAndCreatedAtBetween(List.of(Role.ROLE_OWNER, Role.ROLE_ADMIN), resolvedStart, resolvedEnd);
            LocalDateTime fifteenMinsAgo = LocalDateTime.now().minusMinutes(15);
            activeOwners = userQueryService.countByActiveTrueAndUpdatedAtAfter(fifteenMinsAgo);
            totalBotUsers = botUserRepository.countByCreatedAtBetween(resolvedStart, resolvedEnd);
            activeBots = botRepository.countByActiveTrueAndCreatedAtBetween(resolvedStart, resolvedEnd);
            totalAutomations = flowSchemaRepository.countByCreatedAtBetween(resolvedStart, resolvedEnd);
            totalMessagesSent = broadcastCampaignRepository.sumSentCountByCreatedAtBetween(resolvedStart, resolvedEnd);
            activeManagers = userQueryService.countByRoleAndCreatedAtBetween(Role.ROLE_MANAGER, resolvedStart, resolvedEnd);

            prevOwners = userQueryService.countByRoleInAndCreatedAtBetween(List.of(Role.ROLE_OWNER, Role.ROLE_ADMIN), previousStart, resolvedStart);
            prevBotUsersCount = botUserRepository.countByCreatedAtBetween(previousStart, resolvedStart);
            prevActiveBots = botRepository.countByActiveTrueAndCreatedAtBetween(previousStart, resolvedStart);
            prevAutomations = flowSchemaRepository.countByCreatedAtBetween(previousStart, resolvedStart);
            prevMessages = broadcastCampaignRepository.sumSentCountByCreatedAtBetween(previousStart, resolvedStart);

            rangeUsers = userQueryService.findByCreatedAtBetween(resolvedStart, resolvedEnd);
            rangeBots = botRepository.findByCreatedAtBetween(resolvedStart, resolvedEnd);
            rangeBotUsers = botUserRepository.findByCreatedAtBetween(resolvedStart, resolvedEnd);
            rangeSchemas = flowSchemaRepository.findByCreatedAtBetween(resolvedStart, resolvedEnd);
            rangeBroadcasts = broadcastCampaignRepository.findByCreatedAtBetween(resolvedStart, resolvedEnd);

            totalOwnersCount = userQueryService.countByRoleIn(List.of(Role.ROLE_OWNER, Role.ROLE_ADMIN));
            hasBots = botRepository.count() > 0;
        }

        long uptimeSeconds = (System.currentTimeMillis() - START_TIME) / 1000;

        List<AdminStatsDto.GrowthMetric> growth = buildGrowthMetrics(
                resolvedStart, resolvedEnd, rangeUsers, rangeBotUsers, rangeBots, rangeSchemas, rangeBroadcasts, activeOwners);

        AdminStatsDto.ServerHealthDto serverHealth = buildServerHealth(activeBots, hasBots);

        List<Subscription> allSubscriptions = subscriptionRepository.findAllWithPlanAndUser();
        double mrrVal = AdminStatsCalculator.calculateMrr(allSubscriptions);
        double ltvVal = AdminStatsCalculator.calculateLtv(allSubscriptions);

        List<AdminStatsDto.PlanDistributionDto> planDistribution = buildPlanDistribution(totalOwnersCount, allSubscriptions);
        List<AdminStatsDto.IntegrationPopularityDto> integrationsPopularity = buildIntegrationsPopularity(resolvedStart);
        List<AdminStatsDto.ClientGeoLangDto> geographyAndLanguages = buildGeography(resolvedStart);

        List<AdminLogDto> latestLogs = adminLogService.getSystemLogs(null, null, null, null, null, "desc", 0, 10).getContent();

        List<AdminStatsDto.PerformanceMetricDto> performanceMetrics = AdminStatsCalculator.buildPerformanceMetrics();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isManagerUser = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));

        if (isManagerUser) {
            serverHealth = null;
            latestLogs = Collections.emptyList();
            performanceMetrics = Collections.emptyList();
            uptimeSeconds = 0;
        }

        return AdminStatsDto.builder()
                .totalUsers(totalUsers)
                .totalOwners(totalOwners)
                .totalOwnersChange(MathUtils.calcChange(totalOwners, prevOwners))
                .activeOwners(activeOwners)
                .activeOwnersChange("+0.0%")
                .totalBotUsers(totalBotUsers)
                .totalBotUsersChange(MathUtils.calcChange(totalBotUsers, prevBotUsersCount))
                .activeBots(activeBots)
                .activeBotsChange(MathUtils.calcChange(activeBots, prevActiveBots))
                .totalAutomations(totalAutomations)
                .totalAutomationsChange(MathUtils.calcChange(totalAutomations, prevAutomations))
                .totalMessagesSent(totalMessagesSent)
                .totalMessagesSentChange(MathUtils.calcChange(totalMessagesSent, prevMessages))
                .systemUptimeSeconds(uptimeSeconds)
                .activeManagers(activeManagers)
                .userGrowth(growth)
                .serverHealth(serverHealth)
                .mrr(mrrVal)
                .mrrChange("+0.0%")
                .ltv(ltvVal)
                .ltvChange("+0.0%")
                .planDistribution(planDistribution)
                .integrationsPopularity(integrationsPopularity)
                .geographyAndLanguages(geographyAndLanguages)
                .latestLogs(latestLogs)
                .performanceMetrics(performanceMetrics)
                .build();
    }

    private List<AdminStatsDto.GrowthMetric> buildGrowthMetrics(
            LocalDateTime start, LocalDateTime end,
            List<User> users, List<BotUser> botUsers, List<Bot> bots,
            List<FlowSchema> schemas, List<BroadcastCampaign> broadcasts, long activeOwners) {

        List<AdminStatsDto.GrowthMetric> growth = new ArrayList<>();
        long daysDiff = Duration.between(start.atZone(ZoneOffset.UTC), end.atZone(ZoneOffset.UTC)).toDays();

        if (daysDiff <= 1) {
            Map<Integer, Long> regByHour = users.stream()
                    .filter(u -> u.getRole() == Role.ROLE_OWNER || u.getRole() == Role.ROLE_ADMIN)
                    .collect(Collectors.groupingBy(u -> u.getCreatedAt().getHour(), Collectors.counting()));
            Map<Integer, Long> clientsByHour = botUsers.stream()
                    .collect(Collectors.groupingBy(bu -> bu.getCreatedAt().getHour(), Collectors.counting()));
            Map<Integer, Long> botsByHour = bots.stream()
                    .collect(Collectors.groupingBy(b -> b.getCreatedAt().getHour(), Collectors.counting()));
            Map<Integer, Long> schemasByHour = schemas.stream()
                    .collect(Collectors.groupingBy(s -> s.getCreatedAt().getHour(), Collectors.counting()));
            Map<Integer, Long> messagesByHour = broadcasts.stream()
                    .collect(Collectors.groupingBy(
                            bc -> bc.getCreatedAt().getHour(),
                            Collectors.summingLong(bc -> bc.getSentCount() != null ? bc.getSentCount() : 0)));

            for (int i = 0; i <= 24; i++) {
                LocalDateTime pointTime = start.plusHours(i);
                if (pointTime.isAfter(end)) break;
                String label = pointTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:00:00"));
                int hour = pointTime.getHour();

                growth.add(AdminStatsDto.GrowthMetric.builder()
                        .date(label)
                        .registeredCount(regByHour.getOrDefault(hour, 0L))
                        .activeCount(hour == LocalDateTime.now().getHour() ? activeOwners : Math.min(regByHour.getOrDefault(hour, 0L), 1))
                        .clientsCount(clientsByHour.getOrDefault(hour, 0L))
                        .botsCount(botsByHour.getOrDefault(hour, 0L))
                        .automationsCount(schemasByHour.getOrDefault(hour, 0L))
                        .messagesCount(messagesByHour.getOrDefault(hour, 0L))
                        .build());
            }
        } else {
            Map<LocalDate, Long> regByDate = users.stream()
                    .filter(u -> u.getRole() == Role.ROLE_OWNER || u.getRole() == Role.ROLE_ADMIN)
                    .collect(Collectors.groupingBy(u -> u.getCreatedAt().toLocalDate(), Collectors.counting()));
            Map<LocalDate, Long> clientsByDate = botUsers.stream()
                    .collect(Collectors.groupingBy(bu -> bu.getCreatedAt().toLocalDate(), Collectors.counting()));
            Map<LocalDate, Long> botsByDate = bots.stream()
                    .collect(Collectors.groupingBy(b -> b.getCreatedAt().toLocalDate(), Collectors.counting()));
            Map<LocalDate, Long> schemasByDate = schemas.stream()
                    .collect(Collectors.groupingBy(s -> s.getCreatedAt().toLocalDate(), Collectors.counting()));
            Map<LocalDate, Long> messagesByDate = broadcasts.stream()
                    .collect(Collectors.groupingBy(
                            bc -> bc.getCreatedAt().toLocalDate(),
                            Collectors.summingLong(bc -> bc.getSentCount() != null ? bc.getSentCount() : 0)));

            LocalDate current = start.toLocalDate();
            LocalDate endDate = end.toLocalDate();

            while (!current.isAfter(endDate)) {
                String label = current + "T19:00:00";
                long regCount = regByDate.getOrDefault(current, 0L);

                growth.add(AdminStatsDto.GrowthMetric.builder()
                        .date(label)
                        .registeredCount(regCount)
                        .activeCount(current.equals(LocalDate.now()) ? activeOwners : Math.min(regCount, 1))
                        .clientsCount(clientsByDate.getOrDefault(current, 0L))
                        .botsCount(botsByDate.getOrDefault(current, 0L))
                        .automationsCount(schemasByDate.getOrDefault(current, 0L))
                        .messagesCount(messagesByDate.getOrDefault(current, 0L))
                        .build());
                current = current.plusDays(1);
            }
        }
        return growth;
    }

    private AdminStatsDto.ServerHealthDto buildServerHealth(long activeBots, boolean hasBots) {
        boolean dbHealthy = true;
        String dbStatus = "Connected";
        try {
            userQueryService.countTotalUsers();
        } catch (Exception e) {
            log.warn("Database health check ping failed: {}", e.getMessage());
            dbHealthy = false;
            dbStatus = "Error";
        }

        return AdminStatsDto.ServerHealthDto.builder()
                .dbStatus(dbStatus)
                .dbHealthy(dbHealthy)
                .telegramStatus(activeBots > 0 ? "Polling Active" : "Idle")
                .telegramHealthy(activeBots > 0 || hasBots)
                .aiStatus("Operational")
                .aiHealthy(true)
                .broadcastStatus("Ready")
                .broadcastHealthy(true)
                .build();
    }

    private List<AdminStatsDto.PlanDistributionDto> buildPlanDistribution(long totalOwnersCount, List<Subscription> allSubscriptions) {
        Map<String, Long> subCountsByPlan = allSubscriptions.stream()
                .filter(sub -> sub.getStatus() == SubscriptionStatus.ACTIVE && sub.getPlan() != null)
                .collect(Collectors.groupingBy(sub -> sub.getPlan().getDisplayName(), Collectors.counting()));

        long activePaidSubsCount = subCountsByPlan.entrySet().stream()
                .filter(e -> !e.getKey().equalsIgnoreCase("Free"))
                .mapToLong(Map.Entry::getValue)
                .sum();
        long freeCount = Math.max(0, totalOwnersCount - activePaidSubsCount);

        List<AdminStatsDto.PlanDistributionDto> distribution = new ArrayList<>();
        distribution.add(new AdminStatsDto.PlanDistributionDto("Free", freeCount, "#64748b"));

        List<Plan> allPlans = planRepository.findAll();
        for (Plan plan : allPlans) {
            String displayName = plan.getDisplayName();
            long count = subCountsByPlan.getOrDefault(displayName, 0L);
            if (!displayName.equalsIgnoreCase("Free")) {
                String color = AdminStatsCalculator.resolvePlanColor(displayName);
                distribution.add(new AdminStatsDto.PlanDistributionDto(displayName, count, color));
            }
        }
        return distribution;
    }

    private List<AdminStatsDto.IntegrationPopularityDto> buildIntegrationsPopularity(LocalDateTime currentStart) {
        long totalCount = integrationRepository.count();

        Map<IntegrationType, Long> currentCounts = new EnumMap<>(IntegrationType.class);
        List<Object[]> currentGrouped = integrationRepository.countGroupedByType();
        for (Object[] row : currentGrouped) {
            IntegrationType type = (IntegrationType) row[0];
            Long count = ((Number) row[1]).longValue();
            currentCounts.put(type, count);
        }

        Map<IntegrationType, Long> prevCounts = new EnumMap<>(IntegrationType.class);
        List<Object[]> prevGrouped = integrationRepository.countGroupedByTypeAndCreatedAtBefore(currentStart);
        for (Object[] row : prevGrouped) {
            IntegrationType type = (IntegrationType) row[0];
            Long count = ((Number) row[1]).longValue();
            prevCounts.put(type, count);
        }

        List<AdminStatsDto.IntegrationPopularityDto> result = new ArrayList<>();

        for (IntegrationType type : IntegrationType.values()) {
            long count = currentCounts.getOrDefault(type, 0L);
            double pct = totalCount > 0 ? MathUtils.round2(count * 100.0 / totalCount) : 0.0;
            long prev = prevCounts.getOrDefault(type, 0L);
            String change = MathUtils.calcChange(count, prev);
            String name = INTEGRATION_DISPLAY_NAMES.getOrDefault(type, type.name());
            result.add(new AdminStatsDto.IntegrationPopularityDto(name, count, pct, change));
        }

        result.sort((a, b) -> Long.compare(b.getCount(), a.getCount()));
        return result;
    }

    private List<AdminStatsDto.ClientGeoLangDto> buildGeography(LocalDateTime currentStart) {
        long totalBotUsersCount = botUserRepository.count();

        Map<String, Long> currentLangCounts = new HashMap<>();
        Map<String, Long> prevLangCounts = new HashMap<>();

        List<Object[]> metadataList = botUserRepository.findAllMetadataAndCreatedAt();
        for (Object[] row : metadataList) {
            String metadata = (String) row[0];
            LocalDateTime createdAt = (LocalDateTime) row[1];
            String region = AdminStatsCalculator.langToRegion(AdminStatsCalculator.parseLang(metadata));
            currentLangCounts.merge(region, 1L, Long::sum);
            if (createdAt != null && createdAt.isBefore(currentStart)) {
                prevLangCounts.merge(region, 1L, Long::sum);
            }
        }

        String[] regions = {"Ukraine", "United States", "Poland", "Other"};
        List<AdminStatsDto.ClientGeoLangDto> result = new ArrayList<>();

        for (String region : regions) {
            long count = currentLangCounts.getOrDefault(region, 0L);
            double pct = totalBotUsersCount > 0 ? MathUtils.round2(count * 100.0 / totalBotUsersCount) : 0.0;
            long prev = prevLangCounts.getOrDefault(region, 0L);
            result.add(new AdminStatsDto.ClientGeoLangDto(region, count, pct, MathUtils.calcChange(count, prev)));
        }

        result.sort((a, b) -> Long.compare(b.getCount(), a.getCount()));
        return result;
    }
}

