package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminStatsDto;
import com.launchly.admin.service.AdminStatsService;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminStatsServiceImpl implements AdminStatsService {

    private final UserRepository userRepository;
    private final BotRepository botRepository;
    private final FlowSchemaRepository flowSchemaRepository;
    private final BroadcastCampaignRepository broadcastCampaignRepository;

    private static final long START_TIME = System.currentTimeMillis();

    @Override
    @Transactional(readOnly = true)
    public AdminStatsDto getStats() {
        List<User> allUsers = userRepository.findAll();
        List<Bot> allBots = botRepository.findAll();
        List<FlowSchema> allSchemas = flowSchemaRepository.findAll();
        List<BroadcastCampaign> allBroadcasts = broadcastCampaignRepository.findAll();

        long totalUsers = allUsers.size();
        long activeBots = allBots.stream().filter(Bot::isActive).count();
        long totalAutomations = allSchemas.size();

        long totalMessagesSent = allBroadcasts.stream()
                .mapToLong(c -> c.getSentCount() != null ? c.getSentCount() : 0)
                .sum();

        long activeManagers = allUsers.stream()
                .filter(u -> u.getRole() == Role.ROLE_MANAGER)
                .count();

        long uptimeSeconds = (System.currentTimeMillis() - START_TIME) / 1000;

        Map<LocalDate, Long> userRegByDate = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        u -> u.getCreatedAt().toLocalDate(),
                        Collectors.counting()
                ));

        List<AdminStatsDto.GrowthMetric> growth = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dateStr = date.format(DateTimeFormatter.ofPattern("MMM dd"));
            long regCount = userRegByDate.getOrDefault(date, 0L);
            growth.add(new AdminStatsDto.GrowthMetric(dateStr, regCount));
        }

        Map<LocalDate, Long> broadcastActivityByDate = allBroadcasts.stream()
                .filter(c -> c.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        c -> c.getCreatedAt().toLocalDate(),
                        Collectors.summingLong(c -> c.getSentCount() != null ? c.getSentCount() : 0)
                ));

        List<AdminStatsDto.ActivityMetric> activity = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dateStr = date.format(DateTimeFormatter.ofPattern("MMM dd"));
            long sentCount = broadcastActivityByDate.getOrDefault(date, 0L);
            activity.add(new AdminStatsDto.ActivityMetric(dateStr, sentCount));
        }

        return AdminStatsDto.builder()
                .totalUsers(totalUsers)
                .activeBots(activeBots)
                .totalAutomations(totalAutomations)
                .totalMessagesSent(totalMessagesSent)
                .systemUptimeSeconds(uptimeSeconds)
                .activeManagers(activeManagers)
                .userGrowth(growth)
                .botActivity(activity)
                .build();
    }
}
