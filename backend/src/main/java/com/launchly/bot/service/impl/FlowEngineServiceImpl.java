package com.launchly.bot.service.impl;

import com.launchly.analytics.entity.AnalyticsEventType;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.launchly.bot.engine.executor.NodeExecutor;
import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.engine.model.DataCollectionState;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.bot.service.FlowEngineService;
import com.launchly.bot.service.SystemBotAuthService;
import com.launchly.bot.service.BotUserProvisioningService;
import com.launchly.bot.telegram.TelegramClientProvider;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.crm.service.CrmService;
import com.launchly.analytics.service.AnalyticsService;
import com.launchly.bot.constant.BotConstants;
import com.launchly.bot.engine.validator.BotInputValidator;
import com.launchly.bot.engine.callstack.BotCallStackManager;
import com.launchly.bot.engine.callstack.CallStackFrame;
import com.launchly.common.utils.MessageUtils;
import org.springframework.context.annotation.Lazy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
public class FlowEngineServiceImpl implements FlowEngineService {

    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final FlowSchemaRepository flowSchemaRepository;
    private final BotDialogStateService stateService;
    private final ObjectMapper objectMapper;
    private final Map<NodeType, NodeExecutor> executors;
    private final StringRedisTemplate redisTemplate;
    private final BroadcastCampaignRepository campaignRepository;
    private final TelegramClientProvider telegramClientProvider;
    private final EncryptionUtil encryptionUtil;
    private final CrmService crmService;
    private final AnalyticsService analyticsService;
    private final BotInputValidator inputValidator;
    private final BotCallStackManager callStackManager;
    private final MessageUtils messageUtils;
    private final SystemBotAuthService systemBotAuthService;
    private final BotUserProvisioningService botUserProvisioningService;
    private static final String SCHEMA_KEY = "launchly:bot:schema:%d";
    private static final Duration SCHEMA_TTL = Duration.ofMinutes(30);

    public FlowEngineServiceImpl(BotRepository botRepository,
                                  BotUserRepository botUserRepository,
                                  FlowSchemaRepository flowSchemaRepository,
                                  BotDialogStateService stateService,
                                  ObjectMapper objectMapper,
                                  List<NodeExecutor> nodeExecutors,
                                  StringRedisTemplate redisTemplate,
                                  BroadcastCampaignRepository campaignRepository,
                                  @Lazy TelegramClientProvider telegramClientProvider,
                                  EncryptionUtil encryptionUtil,
                                  CrmService crmService,
                                  AnalyticsService analyticsService,
                                  BotInputValidator inputValidator,
                                  BotCallStackManager callStackManager,
                                  MessageUtils messageUtils,
                                  SystemBotAuthService systemBotAuthService,
                                  BotUserProvisioningService botUserProvisioningService) {
        this.botRepository = botRepository;
        this.botUserRepository = botUserRepository;
        this.flowSchemaRepository = flowSchemaRepository;
        this.stateService = stateService;
        this.objectMapper = objectMapper;
        this.redisTemplate = redisTemplate;
        this.campaignRepository = campaignRepository;
        this.telegramClientProvider = telegramClientProvider;
        this.encryptionUtil = encryptionUtil;
        this.crmService = crmService;
        this.analyticsService = analyticsService;
        this.inputValidator = inputValidator;
        this.callStackManager = callStackManager;
        this.messageUtils = messageUtils;
        this.systemBotAuthService = systemBotAuthService;
        this.botUserProvisioningService = botUserProvisioningService;
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
                String buttonLabel = resolveButtonLabel(botId, callbackData);
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
                FlowSchema schema = getSchema(executingBotId);
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
                        FlowSchema schema = getSchema(botId);
                        if (schema == null) {
                            log.warn("No flow schema found for bot {}", botId);
                            return;
                        }
                        nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
                        edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});
                    }
                } else {
                    FlowSchema schema = getSchema(botId);
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
                    String timeoutNodeId = findTargetNodeId(edges, dcState.getNodeId(), "timeout");
                    if (timeoutNodeId == null) {
                        timeoutNodeId = findTargetNodeId(edges, dcState.getNodeId(), "next");
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
                        String successNodeId = findTargetNodeId(edges, dcState.getNodeId(), "reply");
                        if (successNodeId == null) {
                            successNodeId = findTargetNodeId(edges, dcState.getNodeId(), "next");
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
                            String timeoutNodeId = findTargetNodeId(edges, dcState.getNodeId(), "timeout");
                            if (timeoutNodeId == null) {
                                timeoutNodeId = findTargetNodeId(edges, dcState.getNodeId(), "next");
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
            String currentNodeId = resolveCurrentNodeId(botId, telegramUserId, botUser, nodes);

            int maxIterations = BotConstants.MAX_FLOW_ITERATIONS;
            int iteration = 0;

            while (currentNodeId != null && iteration < maxIterations) {
                iteration++;

                FlowNode currentNode = findNodeById(nodes, currentNodeId);
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

                    String returnNodeId = findTargetNodeId(edges, currentNodeId, "next");

                    if (targetBotId != null && !targetBotId.equals(executingBotId)) {
                        Long campaignId = stateService.getActiveCampaignId(botId, telegramUserId).orElse(null);
                        CallStackFrame frame = new CallStackFrame(executingBotId, returnNodeId, campaignId);
                        callStackManager.push(botId, telegramUserId, frame);

                        executingBotId = targetBotId;
                        callStackManager.setExecutingBotId(botId, telegramUserId, executingBotId);
                        stateService.clearActiveCampaignId(botId, telegramUserId);

                        FlowSchema schema = getSchema(executingBotId);
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
                    saveBotNodeMessage(botId, botUser, currentNode);
                }

                if (nextNodeId == null) {
                    CallStackFrame poppedFrame = callStackManager.pop(botId, telegramUserId);
                    if (poppedFrame != null) {
                        executingBotId = poppedFrame.getExecutingBotId();
                        callStackManager.setExecutingBotId(botId, telegramUserId, executingBotId);

                        if (!executingBotId.equals(botId)) {
                            FlowSchema schema = getSchema(executingBotId);
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
                                    FlowSchema schema = getSchema(botId);
                                    if (schema != null) {
                                        nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
                                        edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});
                                    }
                                }
                            } else {
                                stateService.clearActiveCampaignId(botId, telegramUserId);
                                FlowSchema schema = getSchema(botId);
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
                log.warn("Failed to persist final botUser state for user {}: {}", botUser.getId(), e.getMessage());
            }

        } catch (Exception e) {
            log.error("Error processing update for bot {}: {}", botId, e.getMessage(), e);
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

    private String resolveCurrentNodeId(Long botId, Long telegramUserId, BotUser botUser, List<FlowNode> nodes) {
        Optional<String> redisNodeId = stateService.getCurrentNodeId(botId, telegramUserId);
        if (redisNodeId.isPresent() && !redisNodeId.get().trim().isEmpty()) {
            return redisNodeId.get();
        }

        if (botUser.getCurrentNodeId() != null && !botUser.getCurrentNodeId().trim().isEmpty()) {
            stateService.setCurrentNodeId(botId, telegramUserId, botUser.getCurrentNodeId());
            return botUser.getCurrentNodeId();
        }

        return nodes.stream()
                .filter(n -> n.type() == NodeType.START || n.type() == NodeType.START_BROADCAST)
                .findFirst()
                .map(FlowNode::id)
                .orElse(null);
    }

    private FlowNode findNodeById(List<FlowNode> nodes, String nodeId) {
        return nodes.stream()
                .filter(n -> n.id().equals(nodeId))
                .findFirst()
                .orElse(null);
    }

    private record CachedSchema(Long id, int version, String nodes, String edges) {}

    private FlowSchema getSchema(Long botId) {
        String key = String.format(SCHEMA_KEY, botId);
        String cached = redisTemplate.opsForValue().get(key);

        if (cached != null) {
            try {
                CachedSchema cachedSchema = objectMapper.readValue(cached, CachedSchema.class);
                FlowSchema schema = new FlowSchema();
                schema.setId(cachedSchema.id());
                schema.setVersion(cachedSchema.version());
                schema.setNodes(cachedSchema.nodes());
                schema.setEdges(cachedSchema.edges());
                return schema;
            } catch (Exception e) {
                log.error("Failed to deserialize cached schema for bot {}: {}", botId, e.getMessage());
            }
        }

        Optional<FlowSchema> schemaOpt = flowSchemaRepository.findByBotId(botId);
        if (schemaOpt.isEmpty()) {
            return null;
        }

        FlowSchema schema = schemaOpt.get();
        try {
            CachedSchema cachedSchema = new CachedSchema(schema.getId(), schema.getVersion(), schema.getNodes(), schema.getEdges());
            redisTemplate.opsForValue().set(key, objectMapper.writeValueAsString(cachedSchema), SCHEMA_TTL);
        } catch (Exception e) {
            log.error("Failed to serialize schema for bot {}: {}", botId, e.getMessage());
        }

        return schema;
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
            Long executingBotId = botId;

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
                FlowSchema schema = getSchema(botId);
                if (schema == null) {
                    return;
                }
                nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
                edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});
            }

            String currentNodeId = startNodeId;
            int maxIterations = BotConstants.MAX_FLOW_ITERATIONS;
            int iteration = 0;

            while (currentNodeId != null && iteration < maxIterations) {
                iteration++;

                FlowNode currentNode = findNodeById(nodes, currentNodeId);
                if (currentNode == null) {
                    log.error("Node {} not found in schema", currentNodeId);
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

                    String returnNodeId = findTargetNodeId(edges, currentNodeId, "next");

                    if (targetBotId != null && !targetBotId.equals(executingBotId)) {
                        Long currentCampaignId = stateService.getActiveCampaignId(botId, telegramUserId).orElse(null);
                        CallStackFrame frame = new CallStackFrame(executingBotId, returnNodeId, currentCampaignId);
                        callStackManager.push(botId, telegramUserId, frame);

                        executingBotId = targetBotId;
                        callStackManager.setExecutingBotId(botId, telegramUserId, executingBotId);
                        stateService.clearActiveCampaignId(botId, telegramUserId);

                        FlowSchema schema = getSchema(executingBotId);
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
                    log.error("No executor for node type {}", currentNode.type());
                    break;
                }

                String nextNodeId = executor.execute(currentNode, edges, botUser, null, client);
                if (currentNode.type() == NodeType.MESSAGE || currentNode.type() == NodeType.BUTTON) {
                    saveBotNodeMessage(botId, botUser, currentNode);
                }

                if (nextNodeId == null) {
                    CallStackFrame poppedFrame = callStackManager.pop(botId, telegramUserId);
                    if (poppedFrame != null) {
                        executingBotId = poppedFrame.getExecutingBotId();
                        callStackManager.setExecutingBotId(botId, telegramUserId, executingBotId);

                        if (!executingBotId.equals(botId)) {
                            FlowSchema schema = getSchema(executingBotId);
                            if (schema != null) {
                                nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
                                edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});
                            }
                        } else {
                            Long originalCampaignId = poppedFrame.getCampaignId();
                            if (originalCampaignId != null) {
                                stateService.setActiveCampaignId(botId, telegramUserId, originalCampaignId);
                                BroadcastCampaign campaign = campaignRepository.findById(originalCampaignId).orElse(null);
                                if (campaign != null) {
                                    nodes = objectMapper.readValue(campaign.getNodes(), new TypeReference<>() {});
                                    edges = objectMapper.readValue(campaign.getEdges(), new TypeReference<>() {});
                                } else {
                                    FlowSchema schema = getSchema(botId);
                                    if (schema != null) {
                                        nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
                                        edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});
                                    }
                                }
                            } else {
                                stateService.clearActiveCampaignId(botId, telegramUserId);
                                FlowSchema schema = getSchema(botId);
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
                log.warn("Failed to persist final botUser state for user {}: {}", botUser.getId(), e.getMessage());
            }
        } catch (Exception e) {
            log.error("Error running flow for bot {}: {}", botId, e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private void saveBotNodeMessage(Long botId, BotUser botUser, FlowNode node) {
        try {
            Map<String, Object> data = node.data();
            if (data == null) return;

            Object blocksObj = data.get("blocks");
            if (blocksObj instanceof List<?> blocks && !blocks.isEmpty()) {
                for (Object blockObj : blocks) {
                    if (blockObj instanceof Map<?,?> block) {
                        String type = (String) block.get("type");
                        if ("text".equals(type) || "data_collection".equals(type)) {
                            StringBuilder text = new StringBuilder();
                            Object t = block.get("text");
                            if (t instanceof String s && !s.isBlank()) {
                                text.append(s);
                            }
                            Object btns = block.get("buttons");
                            if (btns instanceof List<?> btnList) {
                                for (Object btn : btnList) {
                                    if (btn instanceof Map<?,?> b) {
                                        Object lbl = b.get("label");
                                        if (lbl instanceof String l) { text.append(" [").append(l).append("]"); }
                                    }
                                }
                            }
                            if (text.length() > 0) {
                                crmService.saveBotMessage(botId, botUser.getId(), text.toString(), null, null);
                            }
                        } else if ("image".equals(type)) {
                            String imageUrl = (String) block.get("imageUrl");
                            if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                                StringBuilder caption = new StringBuilder();
                                Object t = block.get("text");
                                if (t instanceof String s && !s.isBlank()) {
                                    caption.append(s);
                                } else {
                                    Object cap = block.get("caption");
                                    if (cap instanceof String c && !c.isBlank()) { caption.append(c); }
                                }
                                crmService.saveBotMessage(botId, botUser.getId(), caption.length() > 0 ? caption.toString() : "[Image]", imageUrl, "IMAGE");
                            }
                        } else if ("video".equals(type)) {
                            String videoUrl = (String) block.get("videoUrl");
                            if (videoUrl != null && !videoUrl.trim().isEmpty()) {
                                StringBuilder caption = new StringBuilder();
                                Object t = block.get("text");
                                if (t instanceof String s && !s.isBlank()) {
                                    caption.append(s);
                                } else {
                                    Object cap = block.get("caption");
                                    if (cap instanceof String c && !c.isBlank()) { caption.append(c); }
                                }
                                crmService.saveBotMessage(botId, botUser.getId(), caption.length() > 0 ? caption.toString() : "[Video]", videoUrl, "VIDEO");
                            }
                        } else if ("audio".equals(type)) {
                            String audioUrl = (String) block.get("audioUrl");
                            if (audioUrl != null && !audioUrl.trim().isEmpty()) {
                                StringBuilder caption = new StringBuilder();
                                Object t = block.get("text");
                                if (t instanceof String s && !s.isBlank()) {
                                    caption.append(s);
                                } else {
                                    Object cap = block.get("caption");
                                    if (cap instanceof String c && !c.isBlank()) { caption.append(c); }
                                }
                                crmService.saveBotMessage(botId, botUser.getId(), caption.length() > 0 ? caption.toString() : "[Audio]", audioUrl, "AUDIO");
                            }
                        } else if ("file".equals(type)) {
                            String fileUrl = (String) block.get("fileUrl");
                            if (fileUrl != null && !fileUrl.trim().isEmpty()) {
                                String fileName = (String) block.get("fileName");
                                StringBuilder caption = new StringBuilder();
                                if (fileName != null && !fileName.isBlank()) { caption.append(fileName); }
                                Object t = block.get("text");
                                if (t instanceof String s && !s.isBlank()) {
                                    if (caption.length() > 0) caption.append(": ");
                                    caption.append(s);
                                }
                                crmService.saveBotMessage(botId, botUser.getId(), caption.length() > 0 ? caption.toString() : "[File]", fileUrl, "FILE");
                            }
                        }
                    }
                }
            } else {
                String text = (String) data.getOrDefault("text", "");
                String imageUrl = (String) data.get("imageUrl");
                List<?> buttonsList = (List<?>) data.get("buttons");

                StringBuilder content = new StringBuilder();
                if (text != null && !text.isBlank()) {
                    content.append(text);
                }
                if (buttonsList != null) {
                    for (Object btn : buttonsList) {
                        if (btn instanceof Map<?,?> b) {
                            Object lbl = b.get("label");
                            if (lbl instanceof String l) { content.append(" [").append(l).append("]"); }
                        }
                    }
                }

                if (imageUrl != null && !imageUrl.trim().isEmpty()) {
                    if (content.length() == 0) {
                        content.append("📷 Photo");
                    }
                    crmService.saveBotMessage(botId, botUser.getId(), content.toString(), imageUrl, "image");
                } else if (content.length() > 0) {
                    crmService.saveBotMessage(botId, botUser.getId(), content.toString(), null, null);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to save bot message in CRM for bot {}: {}", botId, e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private String resolveButtonLabel(Long botId, String callbackData) {
        if (callbackData == null || callbackData.isBlank()) return "";
        try {
            FlowSchema schema = getSchema(botId);
            if (schema == null || schema.getNodes() == null) return callbackData;

            List<FlowNode> nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
            for (FlowNode node : nodes) {
                if (node.data() == null) continue;

                Object topBtnsObj = node.data().get("buttons");
                if (topBtnsObj instanceof List<?> topBtns) {
                    for (Object btnObj : topBtns) {
                        if (btnObj instanceof Map<?, ?> btn) {
                            Object val = btn.get("value");
                            Object id = btn.get("id");
                            Object targetNodeId = btn.get("targetNodeId");
                            if (callbackData.equalsIgnoreCase(String.valueOf(val))
                                    || callbackData.equalsIgnoreCase(String.valueOf(id))
                                    || callbackData.equalsIgnoreCase(String.valueOf(targetNodeId))) {
                                Object label = btn.get("label");
                                if (label == null) label = btn.get("text");
                                if (label == null) label = btn.get("name");
                                if (label != null && !label.toString().isBlank()) return label.toString();
                            }
                        }
                    }
                }

                Object blocksObj = node.data().get("blocks");
                if (blocksObj instanceof List<?> blocks) {
                    for (Object blockObj : blocks) {
                        if (blockObj instanceof Map<?, ?> block) {
                            Object btnsObj = block.get("buttons");
                            if (btnsObj instanceof List<?> buttons) {
                                for (Object btnObj : buttons) {
                                    if (btnObj instanceof Map<?, ?> btn) {
                                        Object val = btn.get("value");
                                        Object id = btn.get("id");
                                        Object targetNodeId = btn.get("targetNodeId");
                                        if (callbackData.equalsIgnoreCase(String.valueOf(val))
                                                || callbackData.equalsIgnoreCase(String.valueOf(id))
                                                || callbackData.equalsIgnoreCase(String.valueOf(targetNodeId))) {
                                            Object label = btn.get("label");
                                            if (label == null) label = btn.get("text");
                                            if (label == null) label = btn.get("name");
                                            if (label != null && !label.toString().isBlank()) return label.toString();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to resolve button label for callback data {} in bot {}: {}", callbackData, botId, e.getMessage());
        }
        return callbackData;
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

    private String findTargetNodeId(List<FlowEdge> edges, String sourceNodeId, String sourceHandle) {
        return edges.stream()
                .filter(e -> e.source().equals(sourceNodeId) && sourceHandle.equals(e.sourceHandle()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
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
