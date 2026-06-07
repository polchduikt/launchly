package com.launchly.bot.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.bot.dto.request.BotCreateRequest;
import com.launchly.bot.dto.request.BotUpdateRequest;
import com.launchly.bot.dto.request.FlowSchemaRequest;
import com.launchly.bot.dto.response.BotDetailResponse;
import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.dto.response.BotStatsResponse;
import com.launchly.bot.dto.response.BotUserResponse;
import com.launchly.bot.dto.response.FlowSchemaResponse;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.mapper.BotMapper;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.bot.service.BotService;
import com.launchly.bot.telegram.TelegramBotManager;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.media.service.MediaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class BotServiceImpl implements BotService {

    private final BotRepository botRepository;
    private final FlowSchemaRepository flowSchemaRepository;
    private final BotUserRepository botUserRepository;
    private final UserRepository userRepository;
    private final BotMapper botMapper;
    private final EncryptionUtil encryptionUtil;
    private final TelegramBotManager telegramBotManager;
    private final ObjectMapper objectMapper;
    private final PlanLimitService planLimitService;
    private final MediaService mediaService;
    private final StringRedisTemplate redisTemplate;

    @Override
    @Transactional
    @CacheEvict(value = "bots", key = "#userId")
    public BotResponse createBot(BotCreateRequest request, Long userId) {
        planLimitService.checkBotLimit(userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        String encryptedToken = encryptionUtil.encrypt(request.telegramToken());

        Bot bot = Bot.builder()
                .name(request.name())
                .description(request.description())
                .telegramToken(encryptedToken)
                .user(user)
                .build();

        bot = botRepository.save(bot);

        FlowSchema schema = FlowSchema.builder()
                .bot(bot)
                .build();
        flowSchemaRepository.save(schema);

        return botMapper.toBotResponse(bot);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "bots", key = "#userId")
    public List<BotResponse> getBotsByUser(Long userId) {
        return botRepository.findAllByUserId(userId).stream()
                .map(botMapper::toBotResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BotDetailResponse getBotById(Long id, Long userId) {
        Bot bot = findBotByIdAndUser(id, userId);
        FlowSchema schema = flowSchemaRepository.findByBotId(bot.getId()).orElse(null);

        String maskedToken = maskToken(encryptionUtil.decrypt(bot.getTelegramToken()));
        FlowSchemaResponse schemaResponse = schema != null ? toFlowSchemaResponse(schema) : null;

        return new BotDetailResponse(
                bot.getId(),
                bot.getName(),
                bot.getDescription(),
                bot.getAvatar(),
                bot.getAvatarPublicId(),
                bot.isActive(),
                maskedToken,
                schemaResponse,
                bot.getCreatedAt()
        );
    }

    @Override
    @Transactional
    @CacheEvict(value = "bots", key = "#userId")
    public BotResponse updateBot(Long id, BotUpdateRequest request, Long userId) {
        Bot bot = findBotByIdAndUser(id, userId);

        if (request.name() != null) {
            bot.setName(request.name());
        }
        if (request.description() != null) {
            bot.setDescription(request.description());
        }
        if (request.avatar() != null) {
            if (!request.avatar().equals(bot.getAvatar())) {
                String oldPublicId = bot.getAvatarPublicId();
                if (oldPublicId != null && !oldPublicId.trim().isEmpty()) {
                    try {
                        mediaService.delete(oldPublicId, userId);
                    } catch (Exception e) {
                        log.error("Failed to delete old avatar publicId {} from Cloudinary: {}", oldPublicId, e.getMessage());
                    }
                }
                bot.setAvatar(request.avatar());
                bot.setAvatarPublicId(request.avatarPublicId());
            }
        }

        bot = botRepository.save(bot);
        return botMapper.toBotResponse(bot);
    }

    @Override
    @Transactional
    @CacheEvict(value = "bots", key = "#userId")
    public void deleteBot(Long id, Long userId) {
        Bot bot = findBotByIdAndUser(id, userId);

        if (bot.isActive()) {
            telegramBotManager.unregisterBot(bot.getId());
        }

        botRepository.delete(bot);
    }

    @Override
    @CacheEvict(value = "bots", key = "#userId")
    public BotResponse startBot(Long id, Long userId) {
        Bot bot = findBotByIdAndUser(id, userId);

        if (bot.isActive()) {
            throw new AppException(HttpStatus.CONFLICT, "Bot is already running");
        }

        telegramBotManager.registerBot(bot);

        try {
            bot.setActive(true);
            bot = botRepository.save(bot);
        } catch (Exception e) {
            try {
                telegramBotManager.unregisterBot(bot.getId());
            } catch (Exception ex) {
            }
            throw e;
        }

        return botMapper.toBotResponse(bot);
    }

    @Override
    @CacheEvict(value = "bots", key = "#userId")
    public BotResponse stopBot(Long id, Long userId) {
        Bot bot = findBotByIdAndUser(id, userId);

        if (!bot.isActive()) {
            throw new AppException(HttpStatus.CONFLICT, "Bot is not running");
        }

        telegramBotManager.unregisterBot(bot.getId());

        try {
            bot.setActive(false);
            bot = botRepository.save(bot);
        } catch (Exception e) {
            try {
                telegramBotManager.registerBot(bot);
            } catch (Exception ex) {
            }
            throw e;
        }

        return botMapper.toBotResponse(bot);
    }

    @Override
    @Transactional(readOnly = true)
    public FlowSchemaResponse getFlowSchema(Long botId, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        FlowSchema schema = flowSchemaRepository.findByBotId(bot.getId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Flow schema not found"));
        return toFlowSchemaResponse(schema);
    }

    @Override
    @Transactional
    public FlowSchemaResponse saveFlowSchema(Long botId, FlowSchemaRequest request, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);

        JsonNode nodesNode = objectMapper.valueToTree(request.nodes());
        JsonNode edgesNode = objectMapper.valueToTree(request.edges());
        validateFlowSchema(nodesNode, edgesNode);

        FlowSchema schema = flowSchemaRepository.findByBotId(bot.getId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Flow schema not found"));

        schema.setNodes(toJsonString(nodesNode));
        schema.setEdges(toJsonString(edgesNode));
        schema.setVersion(schema.getVersion() + 1);

        schema = flowSchemaRepository.save(schema);
        redisTemplate.delete("launchly:bot:schema:" + botId);
        return toFlowSchemaResponse(schema);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BotUserResponse> getBotUsers(Long botId, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        return botUserRepository.findAllByBotId(bot.getId()).stream()
                .map(botMapper::toBotUserResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BotStatsResponse getBotStats(Long botId, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        long totalUsers = botUserRepository.countByBotId(bot.getId());
        return new BotStatsResponse(totalUsers, bot.isActive());
    }

    private Bot findBotByIdAndUser(Long botId, Long userId) {
        return botRepository.findByIdAndUserId(botId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bot not found"));
    }

    private String maskToken(String token) {
        if (token == null || !token.contains(":")) {
            return "****";
        }
        String[] parts = token.split(":", 2);
        return parts[0] + ":****";
    }

    private void validateFlowSchema(JsonNode nodes, JsonNode edges) {
        if (!nodes.isArray()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Nodes must be an array");
        }
        if (!edges.isArray()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Edges must be an array");
        }

        int startCount = 0;
        Set<String> nodeIds = new HashSet<>();

        for (JsonNode node : nodes) {
            String nodeId = node.path("id").asText(null);
            String type = node.path("type").asText(null);
            if (nodeId == null || type == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Each node must have an id and type");
            }
            nodeIds.add(nodeId);
            if ("START".equalsIgnoreCase(type)) {
                startCount++;
            }
        }

        if (startCount != 1) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Flow must have exactly one START node");
        }

        for (JsonNode edge : edges) {
            String source = edge.path("source").asText(null);
            String target = edge.path("target").asText(null);
            if (source == null || target == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Each edge must have source and target");
            }
            if (!nodeIds.contains(source)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Edge references unknown source node: " + source);
            }
            if (!nodeIds.contains(target)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Edge references unknown target node: " + target);
            }
        }
    }

    private FlowSchemaResponse toFlowSchemaResponse(FlowSchema schema) {
        return new FlowSchemaResponse(
                schema.getId(),
                schema.getVersion(),
                parseJson(schema.getNodes()),
                parseJson(schema.getEdges())
        );
    }

    private JsonNode parseJson(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse JSON");
        }
    }

    private String toJsonString(JsonNode jsonNode) {
        try {
            return objectMapper.writeValueAsString(jsonNode);
        } catch (JsonProcessingException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize JSON");
        }
    }
}
