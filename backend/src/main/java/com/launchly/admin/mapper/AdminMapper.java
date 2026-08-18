package com.launchly.admin.mapper;

import com.launchly.admin.dto.AdminBroadcastDto;
import com.launchly.admin.dto.AdminUserDto;
import com.launchly.auth.entity.User;
import com.launchly.broadcast.entity.BroadcastCampaign;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AdminMapper {

    @Mapping(target = "id", source = "user.id")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "name", source = "user.name")
    @Mapping(target = "avatar", source = "user.avatar")
    @Mapping(target = "role", source = "user.role")
    @Mapping(target = "active", expression = "java(user.isActive())")
    @Mapping(target = "blockReason", source = "user.blockReason")
    @Mapping(target = "blockedAt", source = "user.blockedAt")
    @Mapping(target = "provider", source = "user.provider")
    @Mapping(target = "createdAt", source = "user.createdAt")
    @Mapping(target = "telegramUsername", source = "user.telegramUsername")
    @Mapping(target = "botsCount", source = "botsCount")
    @Mapping(target = "automationsCount", source = "automationsCount")
    @Mapping(target = "broadcastsCount", source = "broadcastsCount")
    @Mapping(target = "contactsCount", source = "contactsCount")
    @Mapping(target = "messagesCount", source = "messagesCount")
    @Mapping(target = "planName", source = "planName")
    AdminUserDto toUserDto(User user, int botsCount, long automationsCount, long broadcastsCount, long contactsCount, long messagesCount, String planName);

    @Mapping(target = "id", source = "campaign.id")
    @Mapping(target = "title", source = "campaign.name")
    @Mapping(target = "content", source = "campaign.message")
    @Mapping(target = "targetAudience", expression = "java(Boolean.TRUE.equals(campaign.getTargetAllBots()) ? \"ALL_USERS\" : \"SPECIFIC_BOT\")")
    @Mapping(target = "botName", source = "campaign.bot.name")
    @Mapping(target = "sentCount", expression = "java(campaign.getSentCount() != null ? campaign.getSentCount() : 0)")
    @Mapping(target = "failedCount", expression = "java(campaign.getFailedCount() != null ? campaign.getFailedCount() : 0)")
    @Mapping(target = "totalCount", expression = "java(campaign.getTotalCount() != null ? campaign.getTotalCount() : 0)")
    @Mapping(target = "status", expression = "java(campaign.isBlocked() ? \"BLOCKED\" : (campaign.getStatus() != null ? campaign.getStatus().name() : \"DRAFT\"))")
    @Mapping(target = "blocked", source = "campaign.blocked")
    @Mapping(target = "blockReason", source = "campaign.blockReason")
    @Mapping(target = "blockedAt", source = "campaign.blockedAt")
    @Mapping(target = "createdByEmail", expression = "java(creator != null && creator.getEmail() != null ? creator.getEmail() : defaultAuthor)")
    @Mapping(target = "authorName", expression = "java(creator != null && creator.getName() != null ? creator.getName() : defaultAuthor)")
    @Mapping(target = "createdAt", expression = "java(campaign.getCreatedAt() != null ? campaign.getCreatedAt() : java.time.LocalDateTime.now())")
    AdminBroadcastDto toBroadcastDto(BroadcastCampaign campaign, User creator, String defaultAuthor);

    @Mapping(target = "id", source = "campaign.id")
    @Mapping(target = "title", source = "campaign.name")
    @Mapping(target = "content", source = "campaign.message")
    @Mapping(target = "targetAudience", expression = "java(Boolean.TRUE.equals(campaign.getTargetAllBots()) ? \"ALL_USERS\" : \"SPECIFIC_BOT\")")
    @Mapping(target = "botName", source = "campaign.bot.name")
    @Mapping(target = "sentCount", expression = "java(campaign.getSentCount() != null ? campaign.getSentCount() : 0)")
    @Mapping(target = "failedCount", expression = "java(campaign.getFailedCount() != null ? campaign.getFailedCount() : 0)")
    @Mapping(target = "totalCount", expression = "java(campaign.getTotalCount() != null ? campaign.getTotalCount() : 0)")
    @Mapping(target = "status", expression = "java(campaign.isBlocked() ? \"BLOCKED\" : (campaign.getStatus() != null ? campaign.getStatus().name() : \"DRAFT\"))")
    @Mapping(target = "blocked", source = "campaign.blocked")
    @Mapping(target = "blockReason", source = "campaign.blockReason")
    @Mapping(target = "blockedAt", source = "campaign.blockedAt")
    @Mapping(target = "createdByEmail", expression = "java(creator != null && creator.getEmail() != null ? creator.getEmail() : defaultAuthor)")
    @Mapping(target = "authorName", expression = "java(creator != null && creator.getName() != null ? creator.getName() : defaultAuthor)")
    @Mapping(target = "authorId", expression = "java(creator != null ? creator.getId() : null)")
    @Mapping(target = "createdAt", expression = "java(campaign.getCreatedAt() != null ? campaign.getCreatedAt() : java.time.LocalDateTime.now())")
    @Mapping(target = "scheduledAt", source = "campaign.scheduledAt")
    @Mapping(target = "activities", source = "activities")
    com.launchly.admin.dto.AdminBroadcastDetailDto toBroadcastDetailDto(BroadcastCampaign campaign, User creator, String defaultAuthor, org.springframework.data.domain.Page<com.launchly.admin.dto.UserActivityDto> activities);

    @Mapping(target = "id", source = "flow.id")
    @Mapping(target = "name", expression = "java(bot != null && bot.getName() != null ? bot.getName() : \"Flow #\" + flow.getId())")
    @Mapping(target = "triggerType", constant = "KEYWORD")
    @Mapping(target = "ownerEmail", expression = "java(owner != null && owner.getEmail() != null ? owner.getEmail() : \"N/A\")")
    @Mapping(target = "ownerName", expression = "java(owner != null && owner.getName() != null ? owner.getName() : \"N/A\")")
    @Mapping(target = "botName", source = "resolvedBotName")
    @Mapping(target = "active", expression = "java(bot != null && bot.isActive() && isConnected && !bot.isBlocked())")
    @Mapping(target = "blocked", expression = "java(bot != null && bot.isBlocked())")
    @Mapping(target = "blockReason", expression = "java(bot != null ? bot.getBlockReason() : null)")
    @Mapping(target = "blockedAt", expression = "java(bot != null ? bot.getBlockedAt() : null)")
    @Mapping(target = "triggerCount", source = "runsCount")
    @Mapping(target = "errorCount", constant = "0L")
    @Mapping(target = "lastExecutedAt", expression = "java(flow.getUpdatedAt() != null ? flow.getUpdatedAt() : java.time.LocalDateTime.now())")
    com.launchly.admin.dto.AdminAutomationDto toAutomationDto(com.launchly.bot.entity.FlowSchema flow, com.launchly.bot.entity.Bot bot, User owner, String resolvedBotName, boolean isConnected, int runsCount);

    @Mapping(target = "id", source = "log.id")
    @Mapping(target = "targetId", source = "log.targetId")
    @Mapping(target = "targetName", source = "log.targetName")
    @Mapping(target = "title", source = "log.title")
    @Mapping(target = "description", source = "log.description")
    @Mapping(target = "category", source = "log.category")
    @Mapping(target = "badge", source = "log.badge")
    @Mapping(target = "timestamp", source = "log.createdAt")
    com.launchly.admin.dto.UserActivityDto toActivityDto(com.launchly.admin.entity.UserAuditLog log);

    @Mapping(target = "id", source = "flow.id")
    @Mapping(target = "name", expression = "java(flow.getBot() != null ? flow.getBot().getName() : \"Flow #\" + flow.getId())")
    @Mapping(target = "botName", source = "resolvedBotName")
    @Mapping(target = "active", expression = "java(flow.getBot() != null && flow.getBot().isActive() && isConnected)")
    @Mapping(target = "triggerCount", source = "runs")
    @Mapping(target = "triggerType", constant = "KEYWORD")
    com.launchly.admin.dto.UserAutomationSummaryDto toAutomationSummaryDto(com.launchly.bot.entity.FlowSchema flow, String resolvedBotName, boolean isConnected, int runs);

    @Mapping(target = "id", source = "campaign.id")
    @Mapping(target = "name", source = "campaign.name")
    @Mapping(target = "botName", expression = "java(campaign.getBot() != null ? campaign.getBot().getName() : \"—\")")
    @Mapping(target = "status", expression = "java(campaign.getStatus() != null ? campaign.getStatus().name() : \"DRAFT\")")
    @Mapping(target = "sentCount", expression = "java(campaign.getSentCount() != null ? campaign.getSentCount() : 0)")
    @Mapping(target = "createdAt", expression = "java(campaign.getCreatedAt() != null ? campaign.getCreatedAt().toString() : \"\")")
    com.launchly.admin.dto.UserBroadcastSummaryDto toBroadcastSummaryDto(BroadcastCampaign campaign);

    @Mapping(target = "id", source = "user.id")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "name", source = "user.name")
    @Mapping(target = "avatar", source = "user.avatar")
    @Mapping(target = "role", source = "user.role")
    @Mapping(target = "active", expression = "java(user.isActive())")
    @Mapping(target = "blockReason", source = "user.blockReason")
    @Mapping(target = "blockedAt", source = "user.blockedAt")
    @Mapping(target = "provider", source = "user.provider")
    @Mapping(target = "createdAt", source = "user.createdAt")
    @Mapping(target = "telegramUsername", source = "user.telegramUsername")
    @Mapping(target = "botsCount", source = "botsCount")
    @Mapping(target = "automationsCount", source = "automationsCount")
    @Mapping(target = "broadcastsCount", source = "broadcastsCount")
    @Mapping(target = "contactsCount", source = "contactsCount")
    @Mapping(target = "messagesCount", constant = "0L")
    @Mapping(target = "planName", source = "planName")
    @Mapping(target = "planStatus", constant = "ACTIVE")
    @Mapping(target = "lastActivity", source = "lastActivity")
    @Mapping(target = "activities", source = "activities")
    @Mapping(target = "automations", source = "automations")
    @Mapping(target = "broadcasts", source = "broadcasts")
    com.launchly.admin.dto.AdminUserDetailDto toUserDetailDto(User user, long botsCount, long automationsCount, long broadcastsCount, long contactsCount, String planName, java.time.LocalDateTime lastActivity, org.springframework.data.domain.Page<com.launchly.admin.dto.UserActivityDto> activities, java.util.List<com.launchly.admin.dto.UserAutomationSummaryDto> automations, java.util.List<com.launchly.admin.dto.UserBroadcastSummaryDto> broadcasts);
}


