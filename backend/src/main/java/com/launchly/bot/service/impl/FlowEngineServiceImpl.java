package com.launchly.bot.service.impl;

import com.launchly.analytics.entity.AnalyticsEventType;
import com.launchly.analytics.service.AnalyticsService;
import com.launchly.bot.constant.BotConstants;
import com.launchly.bot.engine.cache.FlowSchemaCache;
import com.launchly.bot.engine.callstack.BotCallStackManager;
import com.launchly.bot.engine.callstack.CallStackFrame;
import com.launchly.bot.engine.executor.NodeExecutor;
import com.launchly.bot.engine.model.DataCollectionState;
import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.engine.persister.BotMessagePersister;
import com.launchly.bot.engine.router.FlowNodeRouter;
import com.launchly.bot.engine.validator.BotInputValidator;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.bot.service.BotUserProvisioningService;
import com.launchly.bot.service.FlowEngineService;
import com.launchly.bot.service.SystemBotAuthService;
import com.launchly.bot.telegram.TelegramClientProvider;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class FlowEngineServiceImpl implements FlowEngineService {

    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final BotDialogStateService stateService;
    private final ObjectMapper objectMapper;
    private final Map<NodeType, NodeExecutor> executors;
    private final StringRedisTemplate redisTemplate;
    private final BroadcastCampaignRepository campaignRepository;
    private final TelegramClientProvider telegramClientProvider;
    private final AnalyticsService analyticsService;
    private final BotInputValidator inputValidator;
    private final BotCallStackManager callStackManager;
    private final SystemBotAuthService systemBotAuthService;
    private final BotUserProvisioningService botUserProvisioningService;
    private final FlowSchemaCache schemaCache;
    private final BotMessagePersister botMessagePersister;
    private final FlowNodeRouter router;

    public FlowEngineServiceImpl(BotRepository botRepository,
                                  BotUserRepository botUserRepository,
                                  BotDialogStateService stateService,
                                  ObjectMapper objectMapper,
                                  List<NodeExecutor> nodeExecutors,
                                  StringRedisTemplate redisTemplate,
                                  BroadcastCampaignRepository campaignRepository,
                                  @Lazy TelegramClientProvider telegramClientProvider,
                                  AnalyticsService analyticsService,
                                  BotInputValidator inputValidator,
                                  BotCallStackManager callStackManager,
                                  SystemBotAuthService systemBotAuthService,
                                  BotUserProvisioningService botUserProvisioningService,
                                  FlowSchemaCache schemaCache,
                                  BotMessagePersister botMessagePersister,
                                  FlowNodeRouter router) {
        this.botRepository = botRepository;
        this.botUserRepository = botUserRepository;
        this.stateService = stateService;
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;
        this.campaignRepository = campaignRepository;
        this.telegramClientProvider = telegramClientProvider;
        this.analyticsService = analyticsService;
        this.inputValidator = inputValidator;
        this.callStackManager = callStackManager;
        this.systemBotAuthService = systemBotAuthService;
        this.botUserProvisioningService = botUserProvisioningService;
        this.schemaCache = schemaCache;
        this.botMessagePersister = botMessagePersister;
        this.router = router;
        this.executors = new EnumMap<>(NodeType.class);
        nodeExecutors.forEach(e -> executors.put(e.getType(), e));
    }

    @Override
    public void processUpdate(Long botId, Update update, TelegramClient client) {
        try {
            Long telegramUserId = extractTelegramUserId(update);
            if (telegramUserId == null) {
                log.warn("Could not extract telegram user id from update");
                return;
            }

            if (botId.equals(-1L)) {
                systemBotAuthService.handleSystemBotUpdate(update, client);
                return;
            }

            Bot bot = botRepository.findById(botId).orElse(null);
            if (bot == null || !bot.isActive()) {
                log.warn("Bot {} not found or not active", botId);
                return;
            }

            BotUser botUser = botUserProvisioningService.getOrCreateBotUser(bot, update, telegramUserId, client);
            if (isAutomationPaused(botUser)) {
                log.info("Automation is paused for user {}, skipping processUpdate", botUser.getId());
                return;
            }

            analyticsService.logEvent(botId, botUser, AnalyticsEventType.USER_ACTIVITY, update.hasCallbackQuery() ? "CALLBACK" : "MESSAGE");
            if (update.hasCallbackQuery()) {
                String callbackData = update.getCallbackQuery().getData();
                String buttonLabel = router.resolveButtonLabel(botId, callbackData);
                analyticsService.logEvent(botId, botUser, AnalyticsEventType.CLICK, buttonLabel);
            }

            if (update.hasMessage() && update.getMessage().hasText()
                    && update.getMessage().getText().trim().startsWith("/start")) {
                stateService.clearActiveCampaignId(botId, telegramUserId);
                stateService.setCurrentNodeId(botId, telegramUserId, null);
                callStackManager.clear(botId, telegramUserId);
                callStackManager.setExecutingBotId(botId, telegramUserId, botId);
                redisTemplate.delete("launchly:bot:data_collection:" + botId + ":" + telegramUserId);
                botUser.setCurrentNodeId(null);
                botUser = botUserRepository.save(botUser);
            }

            Long executingBotId = callStackManager.getExecutingBotId(botId, telegramUserId);
            List<FlowNode> nodes;
            List<FlowEdge> edges;
            if (!executingBotId.equals(botId)) {
                FlowSchema schema = schemaCache.getSchema(executingBotId);
                if (schema == null) {
                    log.warn("No flow schema found for executing bot {}", executingBotId);
                    return;
                }
                nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
                edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});
            } else {
                Long campaignId = stateService.getActiveCampaignId(botId, telegramUserId).orElse(null);
                if (campaignId != null) {
                    BroadcastCampaign campaign = campaignRepository.findById(campaignId).orElse(null);
                    if (campaign != null) {
                        nodes = objectMapper.readValue(campaign.getNodes(), new TypeReference<>() {});
                        edges = objectMapper.readValue(campaign.getEdges(), new TypeReference<>() {});
                    } else {
                        FlowSchema schema = schemaCache.getSchema(botId);
                        if (schema == null) {
                            log.warn("No flow schema found for bot {}", botId);
                            return;
                        }
                        nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
                        edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});
                    }
                } else {
                    FlowSchema schema = schemaCache.getSchema(botId);
                    if (schema == null) {
                        log.warn("No flow schema found for bot {}", botId);
                        return;
                    }
                    nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
                    edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});
                }
            }

            if (nodes.isEmpty()) {
                log.warn("Empty flow schema for bot {}", executingBotId);
                return;
            }

            String dcKey = "launchly:bot:data_collection:" + botId + ":" + telegramUserId;
            String dcStateStr = redisTemplate.opsForValue().get(dcKey);
            if (dcStateStr != null && !dcStateStr.trim().isEmpty()) {
                DataCollectionState dcState = objectMapper.readValue(dcStateStr, DataCollectionState.class);
                if (System.currentTimeMillis() > dcState.getExpiresAt()) {
                    redisTemplate.delete(dcKey);
                    String timeoutNodeId = router.findTargetNodeId(edges, dcState.getNodeId(), "timeout");
                    if (timeoutNodeId == null) {
                        timeoutNodeId = router.findTargetNodeId(edges, dcState.getNodeId(), "next");
                    }
                    stateService.setCurrentNodeId(botId, telegramUserId, timeoutNodeId);
                    botUser.setCurrentNodeId(timeoutNodeId);
                    botUser = botUserRepository.save(botUser);
                } else if (update.hasMessage() && update.getMessage().hasText()) {
                    String text = update.getMessage().getText().trim();
                    boolean isValid = inputValidator.validate(text, dcState.getReplyType());
                    if (isValid) {
                        saveCustomField(botUser, dcState.getSaveToField(), text);
                        redisTemplate.delete(dcKey);
                        String successNodeId = router.findTargetNodeId(edges, dcState.getNodeId(), "reply");
                        if (successNodeId == null) {
                            successNodeId = router.findTargetNodeId(edges, dcState.getNodeId(), "next");
                        }
                        stateService.setCurrentNodeId(botId, telegramUserId, successNodeId);
                        botUser.setCurrentNodeId(successNodeId);
                        botUser = botUserRepository.save(botUser);
                    } else {
                        int retriesLeft = dcState.getRetryCount() - 1;
                        if (retriesLeft >= 0) {
                            dcState.setRetryCount(retriesLeft);
                            redisTemplate.opsForValue().set(dcKey, objectMapper.writeValueAsString(dcState));
                            inputValidator.sendValidationErrorMessage(telegramUserId.toString(), dcState.getReplyType(), client);
                            return;
                        } else {
                            redisTemplate.delete(dcKey);
                            String timeoutNodeId = router.findTargetNodeId(edges, dcState.getNodeId(), "timeout");
                            if (timeoutNodeId == null) {
                                timeoutNodeId = router.findTargetNodeId(edges, dcState.getNodeId(), "next");
                            }
                            stateService.setCurrentNodeId(botId, telegramUserId, timeoutNodeId);
                            botUser.setCurrentNodeId(timeoutNodeId);
                            botUser = botUserRepository.save(botUser);
                        }
                    }
                } else {
                    return;
                }
            }

            String currentNodeId = router.resolveCurrentNodeId(botId, telegramUserId, botUser, nodes, stateService);
            executeNodeLoop(botId, botUser, telegramUserId, currentNodeId, nodes, edges, executingBotId, update, client);

        } catch (Exception e) {
            log.error("Error processing update for bot {}: {}", botId, e.getMessage(), e);
        }
    }

    @Override
    public void runFlow(Long botId, BotUser botUser, String startNodeId, Long campaignId) {
        if (botUser == null || isAutomationPaused(botUser)) {
            if (botUser != null) {
                log.info("Automation is paused for user {}, skipping runFlow", botUser.getId());
            }
            return;
        }
        try {
            Long telegramUserId = botUser.getTelegramId();
            TelegramClient client = telegramClientProvider.getTelegramClient(botId);
            if (client == null) {
                log.warn("Telegram client not found for bot {}", botId);
                return;
            }

            callStackManager.clear(botId, telegramUserId);
            callStackManager.setExecutingBotId(botId, telegramUserId, botId);

            if (campaignId != null) {
                stateService.setActiveCampaignId(botId, telegramUserId, campaignId);
            } else {
                stateService.clearActiveCampaignId(botId, telegramUserId);
            }

            List<FlowNode> nodes;
            List<FlowEdge> edges;
            if (campaignId != null) {
                BroadcastCampaign campaign = campaignRepository.findById(campaignId).orElse(null);
                if (campaign != null) {
                    nodes = objectMapper.readValue(campaign.getNodes(), new TypeReference<>() {});
                    edges = objectMapper.readValue(campaign.getEdges(), new TypeReference<>() {});
                } else {
                    return;
                }
            } else {
                FlowSchema schema = schemaCache.getSchema(botId);
                if (schema == null) {
                    return;
                }
                nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
                edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});
            }

            executeNodeLoop(botId, botUser, telegramUserId, startNodeId, nodes, edges, botId, null, client);

        } catch (Exception e) {
            log.error("Error running flow for bot {}: {}", botId, e.getMessage(), e);
        }
    }

    private void executeNodeLoop(Long botId,
                                 BotUser botUser,
                                 Long telegramUserId,
                                 String startNodeId,
                                 List<FlowNode> initialNodes,
                                 List<FlowEdge> initialEdges,
                                 Long initialExecutingBotId,
                                 Update update,
                                 TelegramClient client) throws Exception {
        String currentNodeId = startNodeId;
        List<FlowNode> nodes = initialNodes;
        List<FlowEdge> edges = initialEdges;
        Long executingBotId = initialExecutingBotId;
        int maxIterations = BotConstants.MAX_FLOW_ITERATIONS;
        int iteration = 0;

        while (currentNodeId != null && iteration < maxIterations) {
            iteration++;

            FlowNode currentNode = router.findNodeById(nodes, currentNodeId);
            if (currentNode == null) {
                log.error("Node {} not found in schema for bot {}", currentNodeId, botId);
                stateService.setCurrentNodeId(botId, telegramUserId, null);
                botUser.setCurrentNodeId(null);
                botUserRepository.save(botUser);
                break;
            }

            if (currentNode.type() == NodeType.START_AUTOMATION) {
                Object targetIdObj = currentNode.data().get("targetBotId");
                Long targetBotId = null;
                if (targetIdObj instanceof Number) {
                    targetBotId = ((Number) targetIdObj).longValue();
                } else if (targetIdObj instanceof String) {
                    try {
                        targetBotId = Long.parseLong((String) targetIdObj);
                    } catch (NumberFormatException e) {
                        log.warn("Failed to parse targetBotId from string: {}", targetIdObj);
                    }
                }

                String returnNodeId = router.findTargetNodeId(edges, currentNodeId, "next");

                if (targetBotId != null && !targetBotId.equals(executingBotId)) {
                    Long campaignId = stateService.getActiveCampaignId(botId, telegramUserId).orElse(null);
                    CallStackFrame frame = new CallStackFrame(executingBotId, returnNodeId, campaignId);
                    callStackManager.push(botId, telegramUserId, frame);

                    executingBotId = targetBotId;
                    callStackManager.setExecutingBotId(botId, telegramUserId, executingBotId);
                    stateService.clearActiveCampaignId(botId, telegramUserId);

                    FlowSchema schema = schemaCache.getSchema(executingBotId);
                    if (schema != null) {
                        nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
                        edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});

                        String botStartNodeId = nodes.stream()
                                .filter(n -> n.type() == NodeType.START)
                                .findFirst()
                                .map(FlowNode::id)
                                .orElse(null);

                        if (botStartNodeId != null) {
                            currentNodeId = botStartNodeId;
                            stateService.setCurrentNodeId(botId, telegramUserId, currentNodeId);
                            botUser.setCurrentNodeId(currentNodeId);
                            botUser = botUserRepository.save(botUser);
                            continue;
                        }
                    }
                }

                currentNodeId = returnNodeId;
                stateService.setCurrentNodeId(botId, telegramUserId, currentNodeId);
                botUser.setCurrentNodeId(currentNodeId);
                botUser = botUserRepository.save(botUser);
                continue;
            }

            NodeExecutor executor = executors.get(currentNode.type());
            if (executor == null) {
                log.error("No executor for node type {} in bot {}", currentNode.type(), botId);
                break;
            }

            String nextNodeId = executor.execute(currentNode, edges, botUser, update, client);
            boolean isFirstIterationCallback = (iteration == 1 && update != null && update.hasCallbackQuery());
            if (!isFirstIterationCallback && (currentNode.type() == NodeType.MESSAGE || currentNode.type() == NodeType.BUTTON)) {
                botMessagePersister.saveBotNodeMessage(botId, botUser, currentNode);
            }

            if (nextNodeId == null) {
                CallStackFrame poppedFrame = callStackManager.pop(botId, telegramUserId);
                if (poppedFrame != null) {
                    executingBotId = poppedFrame.getExecutingBotId();
                    callStackManager.setExecutingBotId(botId, telegramUserId, executingBotId);

                    if (!executingBotId.equals(botId)) {
                        FlowSchema schema = schemaCache.getSchema(executingBotId);
                        if (schema != null) {
                            nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
                            edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});
                        }
                    } else {
                        Long campaignId = poppedFrame.getCampaignId();
                        if (campaignId != null) {
                            stateService.setActiveCampaignId(botId, telegramUserId, campaignId);
                            BroadcastCampaign campaign = campaignRepository.findById(campaignId).orElse(null);
                            if (campaign != null) {
                                nodes = objectMapper.readValue(campaign.getNodes(), new TypeReference<>() {});
                                edges = objectMapper.readValue(campaign.getEdges(), new TypeReference<>() {});
                            } else {
                                FlowSchema schema = schemaCache.getSchema(botId);
                                if (schema != null) {
                                    nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
                                    edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});
                                }
                            }
                        } else {
                            stateService.clearActiveCampaignId(botId, telegramUserId);
                            FlowSchema schema = schemaCache.getSchema(botId);
                            if (schema != null) {
                                nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
                                edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});
                            }
                        }
                    }

                    nextNodeId = poppedFrame.getReturnNodeId();
                } else {
                    boolean hasOutgoingEdges = edges.stream().anyMatch(e -> e.source().equals(currentNode.id()));
                    boolean isWaitingForInput = stateService.getExpectedInput(botId, telegramUserId).isPresent();
                    if ((currentNode.type() == NodeType.END || !hasOutgoingEdges) && !isWaitingForInput) {
                        stateService.clearActiveCampaignId(botId, telegramUserId);
                        stateService.setCurrentNodeId(botId, telegramUserId, null);
                        botUser.setCurrentNodeId(null);
                    } else {
                        stateService.setCurrentNodeId(botId, telegramUserId, currentNodeId);
                        botUser.setCurrentNodeId(currentNodeId);
                    }
                    break;
                }
            }

            currentNodeId = nextNodeId;
            stateService.setCurrentNodeId(botId, telegramUserId, currentNodeId);
            botUser.setCurrentNodeId(currentNodeId);
        }

        try {
            botUserRepository.save(botUser);
        } catch (Exception e) {
            log.error("Failed to persist final botUser state for user {}: {}", botUser.getId(), e.getMessage(), e);
            throw e;
        }
    }

    private Long extractTelegramUserId(Update update) {
        if (update.hasMessage() && update.getMessage().getFrom() != null) {
            return update.getMessage().getFrom().getId();
        }
        if (update.hasCallbackQuery() && update.getCallbackQuery().getFrom() != null) {
            return update.getCallbackQuery().getFrom().getId();
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private void saveCustomField(BotUser botUser, String fieldName, String fieldValue) {
        if (fieldName == null || fieldName.trim().isEmpty()) return;
        try {
            Map<String, Object> metaMap = new HashMap<>();
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                metaMap = objectMapper.readValue(botUser.getMetadata(), Map.class);
            }
            Map<String, Object> customFields = (Map<String, Object>) metaMap.get("customFields");
            if (customFields == null) {
                customFields = new HashMap<>();
            }
            customFields.put(fieldName, fieldValue);
            metaMap.put("customFields", customFields);
            botUser.setMetadata(objectMapper.writeValueAsString(metaMap));
            botUserRepository.save(botUser);
        } catch (Exception e) {
            log.error("Failed to save custom field: {}", e.getMessage(), e);
        }
    }

    private boolean isAutomationPaused(BotUser botUser) {
        if (botUser == null) return false;
        String metadata = botUser.getMetadata();
        if (metadata == null || metadata.isBlank() || "{}".equals(metadata)) return false;
        try {
            Map<String, Object> meta = objectMapper.readValue(metadata, new TypeReference<Map<String, Object>>() {});
            if (meta != null && Boolean.TRUE.equals(meta.get("paused"))) {
                Object pausedUntilObj = meta.get("pausedUntil");
                if (pausedUntilObj instanceof Number) {
                    long pausedUntil = ((Number) pausedUntilObj).longValue();
                    if (System.currentTimeMillis() > pausedUntil) {
                        return false;
                    }
                } else if (pausedUntilObj instanceof String) {
                    try {
                        long pausedUntil = Long.parseLong((String) pausedUntilObj);
                        if (System.currentTimeMillis() > pausedUntil) {
                            return false;
                        }
                    } catch (NumberFormatException e) {
                        log.warn("Failed to parse pausedUntil timestamp: {}", pausedUntilObj);
                    }
                }
                return true;
            }
        } catch (Exception e) {
            log.warn("Failed to check if automation is paused for user {}: {}", botUser.getId(), e.getMessage());
        }
        return false;
    }
}
