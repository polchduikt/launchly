package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminBroadcastDto;
import com.launchly.admin.dto.CreateBroadcastRequest;
import com.launchly.admin.service.AdminBroadcastService;
import com.launchly.auth.entity.User;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminBroadcastServiceImpl implements AdminBroadcastService {

    private final BroadcastCampaignRepository broadcastCampaignRepository;
    private final BotRepository botRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AdminBroadcastDto> getBroadcasts() {
        List<BroadcastCampaign> campaigns = broadcastCampaignRepository.findAll();
        return campaigns.stream()
                .map(c -> {
                    Bot bot = c.getBot();
                    User creator = bot != null ? bot.getUser() : null;
                    String email = creator != null ? creator.getEmail() : "system@launchly.ai";

                    return AdminBroadcastDto.builder()
                            .id(c.getId())
                            .title(c.getName())
                            .content(c.getMessage())
                            .targetAudience(c.getTargetAllBots() != null && c.getTargetAllBots() ? "ALL_USERS" : "SPECIFIC_BOT")
                            .sentCount(c.getSentCount() != null ? c.getSentCount() : 0)
                            .status(c.getStatus() != null ? c.getStatus().name() : "SENT")
                            .createdByEmail(email)
                            .createdAt(c.getCreatedAt() != null ? c.getCreatedAt() : LocalDateTime.now())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AdminBroadcastDto createBroadcast(CreateBroadcastRequest request, String adminEmail) {
        Bot defaultBot = botRepository.findAll().stream().findFirst().orElse(null);

        BroadcastCampaign campaign = BroadcastCampaign.builder()
                .name(request.getTitle())
                .message(request.getContent())
                .sentCount(0)
                .failedCount(0)
                .totalCount(0)
                .targetAllBots(true)
                .bot(defaultBot)
                .build();

        if (defaultBot != null) {
            campaign = broadcastCampaignRepository.save(campaign);
        }

        return AdminBroadcastDto.builder()
                .id(campaign.getId() != null ? campaign.getId() : 1L)
                .title(request.getTitle())
                .content(request.getContent())
                .targetAudience(request.getTargetAudience())
                .sentCount(0)
                .status("COMPLETED")
                .createdByEmail(adminEmail)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
