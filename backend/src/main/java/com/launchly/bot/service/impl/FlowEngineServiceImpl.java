package com.launchly.bot.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.bot.engine.executor.NodeExecutor;
import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.bot.service.FlowEngineService;
import com.launchly.billing.service.PlanLimitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import java.time.Duration;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class FlowEngineServiceImpl implements FlowEngineService {

    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final FlowSchemaRepository flowSchemaRepository;
    private final BotDialogStateService stateService;
    private final ObjectMapper objectMapper;
    private final Map<NodeType, NodeExecutor> executors;
    private final PlanLimitService planLimitService;
    private final StringRedisTemplate redisTemplate;
    private static final String SCHEMA_KEY = "launchly:bot:schema:%d";
    private static final Duration SCHEMA_TTL = Duration.ofMinutes(30);

    public FlowEngineServiceImpl(BotRepository botRepository,
                                  BotUserRepository botUserRepository,
                                  FlowSchemaRepository flowSchemaRepository,
                                  BotDialogStateService stateService,
                                  ObjectMapper objectMapper,
                                  List<NodeExecutor> nodeExecutors,
                                  PlanLimitService planLimitService,
                                  StringRedisTemplate redisTemplate) {
        this.botRepository = botRepository;
        this.botUserRepository = botUserRepository;
        this.flowSchemaRepository = flowSchemaRepository;
        this.stateService = stateService;
        this.objectMapper = objectMapper;
        this.planLimitService = planLimitService;
        this.redisTemplate = redisTemplate;
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

            Bot bot = botRepository.findById(botId).orElse(null);
            if (bot == null || !bot.isActive()) {
                log.warn("Bot {} not found or not active", botId);
                return;
            }

            FlowSchema schema = getSchema(botId);
            if (schema == null) {
                log.warn("No flow schema found for bot {}", botId);
                return;
            }

            List<FlowNode> nodes = objectMapper.readValue(schema.getNodes(), new TypeReference<>() {});
            List<FlowEdge> edges = objectMapper.readValue(schema.getEdges(), new TypeReference<>() {});

            if (nodes.isEmpty()) {
                log.warn("Empty flow schema for bot {}", botId);
                return;
            }

            BotUser botUser = getOrCreateBotUser(bot, update, telegramUserId);

            String currentNodeId = resolveCurrentNodeId(botId, telegramUserId, botUser, nodes);

            int maxIterations = 50;
            int iteration = 0;

            while (currentNodeId != null && iteration < maxIterations) {
                iteration++;

                FlowNode currentNode = findNodeById(nodes, currentNodeId);
                if (currentNode == null) {
                    log.error("Node {} not found in schema for bot {}", currentNodeId, botId);
                    break;
                }

                NodeExecutor executor = executors.get(currentNode.type());
                if (executor == null) {
                    log.error("No executor for node type {} in bot {}", currentNode.type(), botId);
                    break;
                }

                String nextNodeId = executor.execute(currentNode, edges, botUser, update, client);

                if (nextNodeId == null) {
                    stateService.setCurrentNodeId(botId, telegramUserId, currentNodeId);
                    botUser.setCurrentNodeId(currentNodeId);
                    botUserRepository.save(botUser);
                    break;
                }

                currentNodeId = nextNodeId;
                stateService.setCurrentNodeId(botId, telegramUserId, currentNodeId);
                botUser.setCurrentNodeId(currentNodeId);
                botUserRepository.save(botUser);
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

    private BotUser getOrCreateBotUser(Bot bot, Update update, Long telegramUserId) {
        return botUserRepository.findByTelegramIdAndBotId(telegramUserId, bot.getId())
                .orElseGet(() -> {
                    planLimitService.checkBotUserLimit(bot.getId());
                    String username = null;
                    String firstName = null;
                    String lastName = null;

                    if (update.hasMessage() && update.getMessage().getFrom() != null) {
                        var from = update.getMessage().getFrom();
                        username = from.getUserName();
                        firstName = from.getFirstName();
                        lastName = from.getLastName();
                    } else if (update.hasCallbackQuery() && update.getCallbackQuery().getFrom() != null) {
                        var from = update.getCallbackQuery().getFrom();
                        username = from.getUserName();
                        firstName = from.getFirstName();
                        lastName = from.getLastName();
                    }

                    BotUser newUser = BotUser.builder()
                            .telegramId(telegramUserId)
                            .username(username)
                            .firstName(firstName)
                            .lastName(lastName)
                            .bot(bot)
                            .build();
                    return botUserRepository.save(newUser);
                });
    }

    private String resolveCurrentNodeId(Long botId, Long telegramUserId, BotUser botUser, List<FlowNode> nodes) {
        Optional<String> redisNodeId = stateService.getCurrentNodeId(botId, telegramUserId);
        if (redisNodeId.isPresent()) {
            return redisNodeId.get();
        }

        if (botUser.getCurrentNodeId() != null) {
            stateService.setCurrentNodeId(botId, telegramUserId, botUser.getCurrentNodeId());
            return botUser.getCurrentNodeId();
        }

        return nodes.stream()
                .filter(n -> n.type() == NodeType.START)
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
}
