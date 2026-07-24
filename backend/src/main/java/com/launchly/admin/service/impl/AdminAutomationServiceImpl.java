package com.launchly.admin.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.admin.dto.AdminAutomationDetailDto;
import com.launchly.admin.dto.AdminAutomationDto;
import com.launchly.admin.dto.UserActivityDto;
import com.launchly.admin.entity.UserAuditLog;
import com.launchly.admin.repository.UserAuditLogRepository;
import com.launchly.admin.service.AdminAutomationService;
import com.launchly.admin.service.UserAuditService;
import com.launchly.auth.entity.User;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.crm.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAutomationServiceImpl implements AdminAutomationService {

    private final FlowSchemaRepository flowSchemaRepository;
    private final BotRepository botRepository;
    private final ConversationRepository conversationRepository;
    private final UserAuditLogRepository userAuditLogRepository;
    private final UserAuditService userAuditService;
    private final EncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private boolean isBotConnected(Bot bot) {
        if (bot == null) return false;
        String rawToken = bot.getTelegramToken();
        if (rawToken == null || rawToken.isBlank()) return false;
        try {
            String decrypted = encryptionUtil.decrypt(rawToken);
            return decrypted != null && !decrypted.isBlank() && !"0000000000:dummyTokenPlaceholderForNoBotConfig".equals(decrypted);
        } catch (Exception e) {
            return false;
        }
    }

    private String resolveBotName(Bot bot) {
        if (!isBotConnected(bot)) return "—";
        return bot.getName() != null && !bot.getName().isBlank() ? bot.getName() : "—";
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminAutomationDto> getAutomations(String search, String status, int page, int size) {
        List<FlowSchema> schemas = flowSchemaRepository.findAll();
        List<AdminAutomationDto> allDtos = schemas.stream()
                .map(f -> {
                    Bot bot = f.getBot();
                    User owner = bot != null ? bot.getUser() : null;
                    boolean botConnected = isBotConnected(bot);
                    long execCount = (bot != null && botConnected) ? conversationRepository.countByBotId(bot.getId()) : 0;
                    int runsCount = botConnected ? Math.max((int) execCount, f.getVersion()) : 0;
                    String botName = resolveBotName(bot);

                    return AdminAutomationDto.builder()
                            .id(f.getId())
                            .name(bot != null ? bot.getName() : "Flow #" + f.getId())
                            .triggerType("KEYWORD")
                            .ownerEmail(owner != null ? owner.getEmail() : "N/A")
                            .ownerName(owner != null ? owner.getName() : "N/A")
                            .botName(botName)
                            .active(bot != null && bot.isActive() && botConnected && !bot.isBlocked())
                            .blocked(bot != null && bot.isBlocked())
                            .blockReason(bot != null ? bot.getBlockReason() : null)
                            .blockedAt(bot != null ? bot.getBlockedAt() : null)
                            .triggerCount(runsCount)
                            .errorCount(0)
                            .lastExecutedAt(f.getUpdatedAt() != null ? f.getUpdatedAt() : LocalDateTime.now())
                            .build();
                })
                .filter(dto -> {
                    if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
                        if ("blocked".equalsIgnoreCase(status) && !dto.isBlocked()) return false;
                        if ("active".equalsIgnoreCase(status) && (!dto.isActive() || dto.isBlocked())) return false;
                        if ("paused".equalsIgnoreCase(status) && (dto.isActive() || dto.isBlocked())) return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String q = search.toLowerCase().trim();
                        boolean matchName = dto.getName() != null && dto.getName().toLowerCase().contains(q);
                        boolean matchOwnerName = dto.getOwnerName() != null && dto.getOwnerName().toLowerCase().contains(q);
                        boolean matchOwnerEmail = dto.getOwnerEmail() != null && dto.getOwnerEmail().toLowerCase().contains(q);
                        boolean matchBot = dto.getBotName() != null && dto.getBotName().toLowerCase().contains(q);
                        boolean matchTrigger = dto.getTriggerType() != null && dto.getTriggerType().toLowerCase().contains(q);
                        return matchName || matchOwnerName || matchOwnerEmail || matchBot || matchTrigger;
                    }
                    return true;
                })
                .collect(Collectors.toList());

        int start = Math.min(page * size, allDtos.size());
        int end = Math.min(start + size, allDtos.size());
        List<AdminAutomationDto> pageContent = allDtos.subList(start, end);

        return new PageImpl<>(pageContent, PageRequest.of(page, size), allDtos.size());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminAutomationDetailDto getAutomationDetails(Long automationId, String period, int page, int size) {
        FlowSchema schema = flowSchemaRepository.findById(automationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Automation flow not found"));

        Bot bot = schema.getBot();
        User owner = bot != null ? bot.getUser() : null;
        boolean botConnected = isBotConnected(bot);
        long execCount = (bot != null && botConnected) ? conversationRepository.countByBotId(bot.getId()) : 0;
        int runsCount = botConnected ? Math.max((int) execCount, schema.getVersion()) : 0;
        String botName = resolveBotName(bot);

        int nodesCount = 0;
        int edgesCount = 0;
        int integrationsCount = 0;

        if (objectMapper != null) {
            try {
                if (schema.getNodes() != null && !schema.getNodes().isBlank()) {
                    List<?> nodeArray = objectMapper.readValue(schema.getNodes(), List.class);
                    nodesCount = nodeArray.size();
                    for (Object nodeObj : nodeArray) {
                        if (nodeObj instanceof Map<?, ?> nodeMap) {
                            Object typeObj = nodeMap.get("type");
                            String typeStr = typeObj != null ? typeObj.toString().toLowerCase() : "";

                            if ("ai".equals(typeStr) || "api_call".equals(typeStr) || "google_sheets".equals(typeStr) || "webhook".equals(typeStr) || "integration".equals(typeStr)) {
                                integrationsCount++;
                                continue;
                            }

                            Object dataObj = nodeMap.get("data");
                            if (dataObj instanceof Map<?, ?> dataMap) {
                                Object actionsObj = dataMap.get("actions");
                                if (actionsObj instanceof List<?> actionsList) {
                                    for (Object act : actionsList) {
                                        if (act instanceof Map<?, ?> actMap) {
                                            Object actType = actMap.get("type");
                                            if (actType != null) {
                                                String actTypeStr = actType.toString().toUpperCase();
                                                if (actTypeStr.startsWith("GS_") || actTypeStr.startsWith("WEBHOOK") || actTypeStr.startsWith("INTEGRATION")) {
                                                    integrationsCount++;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                if (schema.getEdges() != null && !schema.getEdges().isBlank()) {
                    List<?> edgeArray = objectMapper.readValue(schema.getEdges(), List.class);
                    edgesCount = edgeArray.size();
                }
            } catch (Exception e) {
                log.warn("Failed to parse flow schema nodes/edges for id {}", automationId, e);
            }
        }

        LocalDateTime cutoff = LocalDateTime.of(1970, 1, 1, 0, 0);
        if ("week".equalsIgnoreCase(period) || "7_days".equalsIgnoreCase(period)) {
            cutoff = LocalDateTime.now().minusDays(7);
        } else if ("month".equalsIgnoreCase(period) || "30_days".equalsIgnoreCase(period)) {
            cutoff = LocalDateTime.now().minusDays(30);
        } else if ("3months".equalsIgnoreCase(period) || "90_days".equalsIgnoreCase(period)) {
            cutoff = LocalDateTime.now().minusDays(90);
        }

        Page<UserAuditLog> logPage = Page.empty();
        if (bot != null) {
            logPage = userAuditLogRepository.findAutomationLogs(bot.getId(), cutoff, PageRequest.of(page, size));
        }

        List<UserActivityDto> activitiesList = logPage.getContent().stream().map(l -> UserActivityDto.builder()
                .id(l.getId())
                .title(l.getTitle())
                .description(l.getDescription())
                .category(l.getCategory())
                .badge(l.getBadge())
                .timestamp(l.getCreatedAt())
                .build()).collect(Collectors.toList());

        Page<UserActivityDto> activityPage = new PageImpl<>(activitiesList, PageRequest.of(page, size), logPage.getTotalElements());

        return AdminAutomationDetailDto.builder()
                .id(schema.getId())
                .name(bot != null ? bot.getName() : "Flow #" + schema.getId())
                .triggerType("KEYWORD")
                .botId(bot != null ? bot.getId() : null)
                .botName(botName)
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
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Automation flow not found"));
        if (schema.getBot() != null) {
            Bot bot = schema.getBot();
            if (bot.isBlocked()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Automation is blocked by administration");
            }
            bot.setActive(!bot.isActive());
            botRepository.save(bot);
        }
    }

    @Override
    @Transactional
    public void blockAutomation(Long automationId, String reason) {
        FlowSchema schema = flowSchemaRepository.findById(automationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Automation flow not found"));
        Bot bot = schema.getBot();
        if (bot != null) {
            bot.setBlocked(true);
            bot.setActive(false);
            bot.setBlockReason(reason != null && !reason.isBlank() ? reason : "Administrative Block");
            bot.setBlockedAt(LocalDateTime.now());
            botRepository.save(bot);

            userAuditService.logAutomationBlocked(bot.getUser(), bot.getId(), bot.getName(), bot.getBlockReason());
        }
    }

    @Override
    @Transactional
    public void unblockAutomation(Long automationId) {
        FlowSchema schema = flowSchemaRepository.findById(automationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Automation flow not found"));
        Bot bot = schema.getBot();
        if (bot != null) {
            bot.setBlocked(false);
            bot.setBlockReason(null);
            bot.setBlockedAt(null);
            botRepository.save(bot);

            userAuditService.logAutomationUnblocked(bot.getUser(), bot.getId(), bot.getName());
        }
    }
}
