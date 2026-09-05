package com.launchly.bot.mapper;

import com.launchly.bot.constant.BotConstants;
import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotMember;
import com.launchly.bot.entity.WorkspaceRole;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.validator.BotAccessValidator;
import com.launchly.common.security.CustomUserDetails;
import com.launchly.common.utils.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BotResponseFactory {

    private final BotMapper botMapper;
    private final EncryptionUtil encryptionUtil;
    private final BotUserRepository botUserRepository;
    private final BotAccessValidator botAccessValidator;

    public BotResponse toBotResponseWithStats(Bot bot) {
        if (bot == null) return null;
        BotResponse response = botMapper.toBotResponse(bot);

        boolean hasToken = false;
        try {
            String decryptedToken = encryptionUtil.decrypt(bot.getTelegramToken());
            hasToken = decryptedToken != null && !decryptedToken.isBlank() && !BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(decryptedToken);
        } catch (Exception e) {
            log.error("Failed to decrypt token for bot id={}", bot.getId(), e);
        }

        long totalUsers = hasToken ? botUserRepository.countByBotId(bot.getId()) : 0;

        String role = WorkspaceRole.OWNER.getValue();
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
                Long currentUserId = userDetails.getId();
                if (!bot.getUser().getId().equals(currentUserId)) {
                    role = botAccessValidator.getWorkspaceMembership(bot, currentUserId)
                            .map(BotMember::getRole)
                            .orElse(WorkspaceRole.VIEWER.getValue());
                }
            }
        } catch (Exception e) {
            log.error("Failed to determine member role in toBotResponseWithStats", e);
        }

        return new BotResponse(
                response.id(),
                response.name(),
                response.username(),
                response.description(),
                response.avatar(),
                response.avatarPublicId(),
                bot.isBlocked() ? false : response.active(),
                bot.isBlocked(),
                bot.getBlockReason(),
                response.createdAt(),
                response.updatedAt(),
                totalUsers,
                hasToken,
                role,
                bot.isTemplate(),
                bot.getTemplateName(),
                bot.getRunsCount()
        );
    }

    public java.util.List<BotResponse> toBotResponseListWithStats(java.util.List<Bot> bots, Long currentUserId, java.util.List<BotMember> memberships) {
        if (bots == null || bots.isEmpty()) {
            return java.util.List.of();
        }

        java.util.List<Long> botIds = bots.stream().map(Bot::getId).toList();
        java.util.Map<Long, Long> countsByBotId = new java.util.HashMap<>();
        try {
            java.util.List<Object[]> groupedCounts = botUserRepository.countGroupedByBotIdIn(botIds);
            for (Object[] row : groupedCounts) {
                Long bId = (Long) row[0];
                Long count = ((Number) row[1]).longValue();
                countsByBotId.put(bId, count);
            }
        } catch (Exception e) {
            log.error("Failed to load grouped bot user counts: {}", e.getMessage());
        }

        java.util.Map<Long, String> rolesByBotId = new java.util.HashMap<>();
        if (memberships != null) {
            for (BotMember bm : memberships) {
                if (bm.getBot() != null && bm.getRole() != null) {
                    rolesByBotId.put(bm.getBot().getId(), bm.getRole());
                }
            }
        }

        java.util.List<BotResponse> result = new java.util.ArrayList<>(bots.size());
        for (Bot bot : bots) {
            BotResponse response = botMapper.toBotResponse(bot);
            boolean hasToken = false;
            try {
                String decryptedToken = encryptionUtil.decrypt(bot.getTelegramToken());
                hasToken = decryptedToken != null && !decryptedToken.isBlank() && !BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(decryptedToken);
            } catch (Exception e) {
                log.error("Failed to decrypt token for bot id={}", bot.getId(), e);
            }

            long totalUsers = hasToken ? countsByBotId.getOrDefault(bot.getId(), 0L) : 0L;

            String role = WorkspaceRole.OWNER.getValue();
            if (currentUserId != null && !bot.getUser().getId().equals(currentUserId)) {
                role = rolesByBotId.getOrDefault(bot.getId(), WorkspaceRole.VIEWER.getValue());
            }

            result.add(new BotResponse(
                    response.id(),
                    response.name(),
                    response.username(),
                    response.description(),
                    response.avatar(),
                    response.avatarPublicId(),
                    bot.isBlocked() ? false : response.active(),
                    bot.isBlocked(),
                    bot.getBlockReason(),
                    response.createdAt(),
                    response.updatedAt(),
                    totalUsers,
                    hasToken,
                    role,
                    bot.isTemplate(),
                    bot.getTemplateName(),
                    bot.getRunsCount()
            ));
        }

        return result;
    }
}
