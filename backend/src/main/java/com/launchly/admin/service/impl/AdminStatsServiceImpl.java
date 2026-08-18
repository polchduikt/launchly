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
import com.launchly.integration.entity.Integration;
import com.launchly.integration.entity.IntegrationType;
import com.launchly.integration.repository.IntegrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

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
    public AdminStatsDto getStats(String search, String period, LocalDateTime startDate, LocalDateTime endDate) {
        LocalDateTime resolvedEnd = endDate != null ? endDate : LocalDateTime.now();
        LocalDateTime resolvedStart = periodResolver.resolve(period, startDate);

        List<User> allUsers = userQueryService.findAllUsers();
        List<Bot> allBots = botRepository.findAll();
        List<BotUser> allBotUsers = botUserRepository.findAll();
        List<FlowSchema> allSchemas = flowSchemaRepository.findAll();
        List<BroadcastCampaign> allBroadcasts = broadcastCampaignRepository.findAll();

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            allUsers = allUsers.stream()
                    .filter(u -> AdminStatsCalculator.contains(u.getName(), q) || AdminStatsCalculator.contains(u.getEmail(), q) || AdminStatsCalculator.contains(u.getTelegramUsername(), q))
                    .collect(Collectors.toList());
            allBots = allBots.stream()
                    .filter(b -> AdminStatsCalculator.contains(b.getName(), q) || AdminStatsCalculator.contains(b.getUsername(), q))
                    .collect(Collectors.toList());
            allSchemas = allSchemas.stream()
                    .filter(s -> s.getBot() != null && AdminStatsCalculator.contains(s.getBot().getName(), q))
                    .collect(Collectors.toList());
            allBroadcasts = allBroadcasts.stream()
                    .filter(bc -> AdminStatsCalculator.contains(bc.getName(), q))
                    .collect(Collectors.toList());
        }

        final LocalDateTime finalStart = resolvedStart;
        final LocalDateTime finalEnd = resolvedEnd;

        List<User> rangeUsers = DateTimeUtils.filterByDateRange(allUsers, u -> u.getCreatedAt(), finalStart, finalEnd);
        List<Bot> rangeBots = DateTimeUtils.filterByDateRange(allBots, b -> b.getCreatedAt(), finalStart, finalEnd);
        List<BotUser> rangeBotUsers = DateTimeUtils.filterByDateRange(allBotUsers, bu -> bu.getCreatedAt(), finalStart, finalEnd);
        List<FlowSchema> rangeSchemas = DateTimeUtils.filterByDateRange(allSchemas, s -> s.getCreatedAt(), finalStart, finalEnd);
        List<BroadcastCampaign> rangeBroadcasts = DateTimeUtils.filterByDateRange(allBroadcasts, bc -> bc.getCreatedAt(), finalStart, finalEnd);

        long totalUsers = rangeUsers.size();
        long totalOwners = rangeUsers.stream()
                .filter(u -> u.getRole() == Role.ROLE_OWNER || u.getRole() == Role.ROLE_ADMIN)
                .count();

        LocalDateTime fifteenMinsAgo = LocalDateTime.now().minusMinutes(15);
        long activeOwners = allUsers.stream()
                .filter(u -> u.isActive() && u.getUpdatedAt() != null && u.getUpdatedAt().isAfter(fifteenMinsAgo))
                .count();

        long totalBotUsers = rangeBotUsers.size();
        long activeBots = rangeBots.stream().filter(Bot::isActive).count();
        long totalAutomations = rangeSchemas.size();

        long totalMessagesSent = rangeBroadcasts.stream()
                .mapToLong(c -> c.getSentCount() != null ? c.getSentCount() : 0)
                .sum();

        long activeManagers = rangeUsers.stream()
                .filter(u -> u.getRole() == Role.ROLE_MANAGER)
                .count();

        long uptimeSeconds = (System.currentTimeMillis() - START_TIME) / 1000;

        List<AdminStatsDto.GrowthMetric> growth = buildGrowthMetrics(
                finalStart, finalEnd, rangeUsers, rangeBotUsers, rangeBots, rangeSchemas, rangeBroadcasts, activeOwners);

        AdminStatsDto.ServerHealthDto serverHealth = buildServerHealth(activeBots, allBots);

        List<Subscription> allSubscriptions = subscriptionRepository.findAll();
        double mrrVal = AdminStatsCalculator.calculateMrr(allSubscriptions);
        double ltvVal = AdminStatsCalculator.calculateLtv(allSubscriptions);

        LocalDateTime previousStart = resolvedStart.minus(Duration.between(resolvedStart, resolvedEnd));
        List<User> prevUsers = DateTimeUtils.filterByDateRange(allUsers, u -> u.getCreatedAt(), previousStart, finalStart);
        List<BotUser> prevBotUsers = DateTimeUtils.filterByDateRange(allBotUsers, bu -> bu.getCreatedAt(), previousStart, finalStart);
        List<Bot> prevBots = DateTimeUtils.filterByDateRange(allBots, b -> b.getCreatedAt(), previousStart, finalStart);
        List<FlowSchema> prevSchemas = DateTimeUtils.filterByDateRange(allSchemas, s -> s.getCreatedAt(), previousStart, finalStart);
        List<BroadcastCampaign> prevBroadcasts = DateTimeUtils.filterByDateRange(allBroadcasts, bc -> bc.getCreatedAt(), previousStart, finalStart);

        long prevOwners = prevUsers.stream().filter(u -> u.getRole() == Role.ROLE_OWNER || u.getRole() == Role.ROLE_ADMIN).count();
        long prevBotUsersCount = prevBotUsers.size();
        long prevActiveBots = prevBots.stream().filter(Bot::isActive).count();
        long prevAutomations = prevSchemas.size();
        long prevMessages = prevBroadcasts.stream().mapToLong(c -> c.getSentCount() != null ? c.getSentCount() : 0).sum();

        List<AdminStatsDto.PlanDistributionDto> planDistribution = buildPlanDistribution(allUsers, allSubscriptions);
        List<AdminStatsDto.IntegrationPopularityDto> integrationsPopularity = buildIntegrationsPopularity(previousStart, finalStart);
        List<AdminStatsDto.ClientGeoLangDto> geographyAndLanguages = buildGeography(allBotUsers, previousStart, finalStart);

        List<AdminLogDto> latestLogs = adminLogService.getSystemLogs(null, null, null, null, null, "desc", 0, 10).getContent();

        List<AdminStatsDto.PerformanceMetricDto> performanceMetrics = AdminStatsCalculator.buildPerformanceMetrics();

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
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
        long daysDiff = Duration.between(start, end).toDays();

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

    private AdminStatsDto.ServerHealthDto buildServerHealth(long activeBots, List<Bot> allBots) {
        boolean dbHealthy = true;
        String dbStatus = "Connected";
        try {
            userQueryService.countTotalUsers();
        } catch (Exception e) {
            dbHealthy = false;
            dbStatus = "Error";
        }

        return AdminStatsDto.ServerHealthDto.builder()
                .dbStatus(dbStatus)
                .dbHealthy(dbHealthy)
                .telegramStatus(activeBots > 0 ? "Polling Active" : "Idle")
                .telegramHealthy(activeBots > 0 || !allBots.isEmpty())
                .aiStatus("Operational")
                .aiHealthy(true)
                .broadcastStatus("Ready")
                .broadcastHealthy(true)
                .build();
    }

    private List<AdminStatsDto.PlanDistributionDto> buildPlanDistribution(List<User> allUsers, List<Subscription> allSubscriptions) {
        long totalOwnersCount = allUsers.stream()
                .filter(u -> u.getRole() == Role.ROLE_OWNER || u.getRole() == Role.ROLE_ADMIN)
                .count();

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
            if (!displayName.equalsIgnoreCase("Free") && (count > 0 || true)) {
                String color = AdminStatsCalculator.resolvePlanColor(displayName);
                distribution.add(new AdminStatsDto.PlanDistributionDto(displayName, count, color));
            }
        }
        return distribution;
    }

    private List<AdminStatsDto.IntegrationPopularityDto> buildIntegrationsPopularity(LocalDateTime prevStart, LocalDateTime currentStart) {
        List<Integration> allIntegrations = integrationRepository.findAll();
        long totalCount = allIntegrations.size();

        Map<IntegrationType, Long> currentCounts = allIntegrations.stream()
                .collect(Collectors.groupingBy(Integration::getType, Collectors.counting()));

        List<Integration> prevIntegrations = allIntegrations.stream()
                .filter(i -> i.getCreatedAt() != null && i.getCreatedAt().isBefore(currentStart))
                .collect(Collectors.toList());
        Map<IntegrationType, Long> prevCounts = prevIntegrations.stream()
                .collect(Collectors.groupingBy(Integration::getType, Collectors.counting()));

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

    private List<AdminStatsDto.ClientGeoLangDto> buildGeography(List<BotUser> allBotUsers, LocalDateTime prevStart, LocalDateTime currentStart) {
        long totalBotUsersCount = allBotUsers.size();

        Map<String, Long> currentLangCounts = new HashMap<>();
        for (BotUser bu : allBotUsers) {
            String region = AdminStatsCalculator.langToRegion(AdminStatsCalculator.parseLang(bu.getMetadata()));
            currentLangCounts.merge(region, 1L, Long::sum);
        }

        List<BotUser> prevBotUsers = allBotUsers.stream()
                .filter(bu -> bu.getCreatedAt() != null && bu.getCreatedAt().isBefore(currentStart))
                .collect(Collectors.toList());
        Map<String, Long> prevLangCounts = new HashMap<>();
        for (BotUser bu : prevBotUsers) {
            String region = AdminStatsCalculator.langToRegion(AdminStatsCalculator.parseLang(bu.getMetadata()));
            prevLangCounts.merge(region, 1L, Long::sum);
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

