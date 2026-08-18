package com.launchly.admin.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.admin.dto.AdminAutomationDetailDto;
import com.launchly.admin.dto.AdminAutomationDto;
import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.admin.dto.UserActivityDto;
import com.launchly.admin.entity.UserAuditLog;
import com.launchly.admin.mapper.AdminMapper;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.admin.service.AdminAutomationService;
import com.launchly.admin.service.UserAuditService;
import com.launchly.admin.util.AdminFilterUtils;
import com.launchly.admin.util.AdminPeriodResolver;
import com.launchly.admin.validator.BotTokenValidator;
import com.launchly.auth.entity.User;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.MessageUtils;
import com.launchly.crm.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAutomationServiceImpl implements AdminAutomationService {


    private final FlowSchemaRepository flowSchemaRepository;
    private final BotRepository botRepository;
    private final ConversationRepository conversationRepository;
    private final UserAuditLogRepository userAuditLogRepository;
    private final UserAuditService userAuditService;
    private final BotTokenValidator botTokenValidator;
    private final AdminPeriodResolver periodResolver;
    private final AdminMapper adminMapper;
    private final MessageUtils messageUtils;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional(readOnly = true)
    public Page<AdminAutomationDto> getAutomations(String search, String status, String sort, int page, int size) {
        List<FlowSchema> schemas = flowSchemaRepository.findAll();
        List<AdminAutomationDto> allDtos = schemas.stream()
                .map(this::mapToListDto)
                .filter(dto -> AdminFilterUtils.matchesStatus(dto, status))
                .filter(dto -> AdminFilterUtils.matchesAutomationSearch(dto, search))
                .collect(Collectors.toList());

        allDtos.sort((a, b) -> {
            LocalDateTime t1 = a.getLastExecutedAt() != null ? a.getLastExecutedAt() : LocalDateTime.MIN;
            LocalDateTime t2 = b.getLastExecutedAt() != null ? b.getLastExecutedAt() : LocalDateTime.MIN;
            return "asc".equalsIgnoreCase(sort) ? t1.compareTo(t2) : t2.compareTo(t1);
        });

        int start = Math.min(page * size, allDtos.size());
        int end = Math.min(start + size, allDtos.size());
        return new PageImpl<>(allDtos.subList(start, end), PageRequest.of(page, size), allDtos.size());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminAutomationDetailDto getAutomationDetails(Long automationId, String period, int page, int size) {
        FlowSchema schema = flowSchemaRepository.findById(automationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "admin.error.automation_not_found"));

        Bot bot = schema.getBot();
        User owner = bot != null ? bot.getUser() : null;
        boolean connected = botTokenValidator.isConnected(bot);
        long execCount = (bot != null && connected) ? conversationRepository.countByBotId(bot.getId()) : 0;
        int runsCount = connected ? Math.max((int) execCount, schema.getVersion()) : 0;

        int nodesCount = 0;
        int edgesCount = 0;
        int integrationsCount = 0;
        try {
            if (schema.getNodes() != null && !schema.getNodes().isBlank()) {
                List<?> nodeArray = objectMapper.readValue(schema.getNodes(), List.class);
                nodesCount = nodeArray.size();
                integrationsCount = AdminFilterUtils.countIntegrations(nodeArray);
            }
            if (schema.getEdges() != null && !schema.getEdges().isBlank()) {
                List<?> edgeArray = objectMapper.readValue(schema.getEdges(), List.class);
                edgesCount = edgeArray.size();
            }
        } catch (Exception e) {
            log.warn("Failed to parse schema nodes/edges for automationId={}: {}", automationId, e.getMessage());
        }


        LocalDateTime cutoff = periodResolver.resolve(period);
        Page<UserAuditLog> logPage = Page.empty();
        if (bot != null) {
            logPage = userAuditLogRepository.findAutomationLogs(bot.getId(), cutoff, PageRequest.of(page, size));
        }

        Page<UserActivityDto> activityPage = logPage.map(adminMapper::toActivityDto);

        return AdminAutomationDetailDto.builder()
                .id(schema.getId())
                .name(bot != null ? bot.getName() : "Flow #" + schema.getId())
                .triggerType("KEYWORD")
                .botId(bot != null ? bot.getId() : null)
                .botName(botTokenValidator.resolveBotName(bot))
                .botActive(bot != null && bot.isActive() && !bot.isBlocked())
                .blocked(bot != null && bot.isBlocked())
                .blockReason(bot != null ? bot.getBlockReason() : null)
                .blockedAt(bot != null ? bot.getBlockedAt() : null)
                .ownerId(owner != null ? owner.getId() : null)
                .ownerName(owner != null ? owner.getName() : "N/A")
                .ownerEmail(owner != null ? owner.getEmail() : "N/A")
                .ownerAvatar(owner != null ? owner.getAvatar() : null)
                .nodesCount(nodesCount)
                .edgesCount(edgesCount)
                .integrationsCount(integrationsCount)
                .version(schema.getVersion())
                .triggerCount(runsCount)
                .errorCount(0)
                .createdAt(schema.getCreatedAt() != null ? schema.getCreatedAt() : LocalDateTime.now())
                .updatedAt(schema.getUpdatedAt() != null ? schema.getUpdatedAt() : LocalDateTime.now())
                .activities(activityPage)
                .build();
    }

    @Override
    @Transactional
    public void toggleAutomation(Long automationId) {
        FlowSchema schema = flowSchemaRepository.findById(automationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "admin.error.automation_not_found"));
        if (schema.getBot() != null) {
            Bot bot = schema.getBot();
            if (bot.isBlocked()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "admin.error.automation_blocked");
            }
            bot.setActive(!bot.isActive());
            botRepository.save(bot);
        }
    }

    @Override
    @Transactional
    public void blockAutomation(Long automationId, AdminBlockRequest request) {
        FlowSchema schema = flowSchemaRepository.findById(automationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "admin.error.automation_not_found"));
        Bot bot = schema.getBot();
        if (bot != null) {
            String reason = request != null ? request.getReason() : null;
            String fullReason = (reason != null && !reason.isBlank()) ? reason : messageUtils.getMessage("admin.reason_rules");
            bot.block(fullReason);
            botRepository.save(bot);
            userAuditService.logAutomationBlocked(bot.getUser(), bot.getId(), bot.getName(), bot.getBlockReason());
        }
    }

    @Override
    @Transactional
    public void unblockAutomation(Long automationId) {
        FlowSchema schema = flowSchemaRepository.findById(automationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "admin.error.automation_not_found"));

        Bot bot = schema.getBot();
        if (bot != null) {
            bot.unblock();
            botRepository.save(bot);
            userAuditService.logAutomationUnblocked(bot.getUser(), bot.getId(), bot.getName());
        }
    }


    private AdminAutomationDto mapToListDto(FlowSchema f) {
        Bot bot = f.getBot();
        User owner = bot != null ? bot.getUser() : null;
        boolean connected = botTokenValidator.isConnected(bot);
        long execCount = (bot != null && connected) ? conversationRepository.countByBotId(bot.getId()) : 0;
        int runsCount = connected ? Math.max((int) execCount, f.getVersion()) : 0;

        return adminMapper.toAutomationDto(f, bot, owner, botTokenValidator.resolveBotName(bot), connected, runsCount);
    }
}
