package com.launchly.bot.service.impl;

import com.launchly.common.security.CustomUserDetails;
import org.springframework.web.client.RestTemplate;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
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
import com.launchly.bot.entity.BotMember;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.mapper.BotMapper;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.bot.repository.InstalledTemplateRepository;
import com.launchly.bot.repository.AccountTemplateRepository;
import com.launchly.bot.service.BotService;
import com.launchly.bot.telegram.TelegramBotManager;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.media.service.MediaService;
import com.launchly.bot.dto.request.BotUserCreateRequest;
import com.launchly.bot.dto.request.BotUserUpdateRequest;
import com.launchly.bot.entity.BotUser;
import com.launchly.broadcast.repository.BotUserTagRepository;
import com.launchly.broadcast.repository.TagRepository;
import com.launchly.broadcast.entity.BotUserTag;
import com.launchly.broadcast.entity.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import com.launchly.admin.service.UserAuditService;

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
    private final BotUserTagRepository botUserTagRepository;
    private final TagRepository tagRepository;
    private final BotMemberRepository botMemberRepository;
    private final InstalledTemplateRepository installedTemplateRepository;
    private final AccountTemplateRepository accountTemplateRepository;
    private final UserAuditService userAuditService;

    @Override
    @Transactional
    @CacheEvict(value = "bots", key = "#userId")
    public BotResponse createBot(BotCreateRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));

        String rawToken = request.telegramToken();
        if (request.copyTokenFromBotId() != null) {
            Bot sourceBot = findBotByIdAndUser(request.copyTokenFromBotId(), userId);
            rawToken = encryptionUtil.decrypt(sourceBot.getTelegramToken());
        }

        boolean isDummy = (rawToken == null || rawToken.trim().isEmpty() || "0000000000:dummyTokenPlaceholderForNoBotConfig".equals(rawToken));
        if (!isDummy) {
            planLimitService.checkBotLimit(userId, rawToken);
        }

        if (rawToken == null || rawToken.trim().isEmpty()) {
            rawToken = "0000000000:dummyTokenPlaceholderForNoBotConfig";
        }

        String encryptedToken = encryptionUtil.encrypt(rawToken);

        Bot bot = Bot.builder()
                .name(request.name())
                .description(request.description())
                .telegramToken(encryptedToken)
                .user(user)
                .build();

        bot = botRepository.save(bot);

        if (!"0000000000:dummyTokenPlaceholderForNoBotConfig".equals(rawToken)) {
            releaseTokenFromOtherBots(rawToken, userId, bot.getId());
            updateBotTelegramInfo(bot, rawToken);
            bot = botRepository.save(bot);
        }

        FlowSchema schema = FlowSchema.builder()
                .bot(bot)
                .build();
        flowSchemaRepository.save(schema);

        userAuditService.logBotConnected(user, bot.getId(), bot.getName(), bot.getCreatedAt());

        return toBotResponseWithStats(bot);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BotResponse> getBotsByUser(Long userId) {
        List<Bot> ownedBots = botRepository.findAllByUserId(userId);
        List<BotMember> memberships = botMemberRepository.findByUserId(userId);
        List<Bot> memberBots = new ArrayList<>();

        for (BotMember bm : memberships) {
            if (bm.getBot() != null) {
                memberBots.add(bm.getBot());
            }
        }

        List<Bot> allBots = new ArrayList<>(ownedBots);
        for (Bot b : memberBots) {
            if (allBots.stream().noneMatch(existing -> existing.getId().equals(b.getId()))) {
                allBots.add(b);
            }
        }

        return allBots.stream()
                .map(this::toBotResponseWithStats)
                .collect(Collectors.toList());
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
                bot.getUsername(),
                bot.getDescription(),
                bot.getAvatar(),
                bot.getAvatarPublicId(),
                bot.isActive(),
                maskedToken,
                schemaResponse,
                bot.getCreatedAt(),
                bot.isTemplate(),
                bot.getTemplateName()
        );
    }

    @Override
    @Transactional
    @CacheEvict(value = "bots", key = "#userId")
    public BotResponse updateBot(Long id, BotUpdateRequest request, Long userId) {
        Bot bot = findBotByIdAndUser(id, userId);
        validateWriteAccess(bot, userId);

        if (request.name() != null) {
            bot.setName(request.name());
        }
        String rawToken = request.telegramToken();
        if (request.copyTokenFromBotId() != null) {
            Bot sourceBot = findBotByIdAndUser(request.copyTokenFromBotId(), userId);
            rawToken = encryptionUtil.decrypt(sourceBot.getTelegramToken());
        }

        if (rawToken != null) {
            String decryptedToken = encryptionUtil.decrypt(bot.getTelegramToken());
            boolean wasDummy = "0000000000:dummyTokenPlaceholderForNoBotConfig".equals(decryptedToken);
            boolean isNewReal = !"0000000000:dummyTokenPlaceholderForNoBotConfig".equals(rawToken);

            if (wasDummy && isNewReal) {
                planLimitService.checkBotLimit(userId, rawToken);
            }

            if (isNewReal) {
                releaseTokenFromOtherBots(rawToken, userId, bot.getId());
                bot.setTemplate(false);
            }

            bot.setTelegramToken(encryptionUtil.encrypt(rawToken));
            if (!"0000000000:dummyTokenPlaceholderForNoBotConfig".equals(rawToken)) {
                updateBotTelegramInfo(bot, rawToken);
            } else {
                bot.setUsername(null);
            }
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
        return toBotResponseWithStats(bot);
    }

    @Override
    @Transactional
    @CacheEvict(value = "bots", key = "#userId")
    public void deleteBot(Long id, Long userId) {
        Bot bot = findBotByIdAndUser(id, userId);
        validateWriteAccess(bot, userId);

        if (bot.isActive()) {
            telegramBotManager.unregisterBot(bot.getId());
        }

        installedTemplateRepository.deleteAllByBotId(bot.getId());
        accountTemplateRepository.detachSourceBot(bot.getId());
        botRepository.delete(bot);
    }

    @Override
    @CacheEvict(value = "bots", key = "#userId")
    public BotResponse startBot(Long id, Long userId) {
        Bot bot = findBotByIdAndUser(id, userId);
        validateWriteAccess(bot, userId);

        if (bot.isActive()) {
            throw new AppException(HttpStatus.CONFLICT, "Bot is already running");
        }

        String decryptedToken = encryptionUtil.decrypt(bot.getTelegramToken());
        if ("0000000000:dummyTokenPlaceholderForNoBotConfig".equals(decryptedToken)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Please configure a valid Telegram token in settings before starting the automation.");
        }

        List<Bot> activeBotsList = botRepository.findAllByActiveTrue();
        for (Bot activeBot : activeBotsList) {
            if (!activeBot.getId().equals(bot.getId())) {
                String activeToken = encryptionUtil.decrypt(activeBot.getTelegramToken());
                if (decryptedToken.equals(activeToken)) {
                    telegramBotManager.unregisterBot(activeBot.getId());
                    activeBot.setActive(false);
                    botRepository.save(activeBot);
                    log.info("Automatically deactivated bot id={} ('{}') because its token was assigned to bot id={} ('{}')",
                            activeBot.getId(), activeBot.getName(), bot.getId(), bot.getName());
                }
            }
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

        return toBotResponseWithStats(bot);
    }

    @Override
    @CacheEvict(value = "bots", key = "#userId")
    public BotResponse stopBot(Long id, Long userId) {
        Bot bot = findBotByIdAndUser(id, userId);
        validateWriteAccess(bot, userId);

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

        return toBotResponseWithStats(bot);
    }

    @Override
    @Transactional
    public FlowSchemaResponse getFlowSchema(Long botId, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        FlowSchema schema = flowSchemaRepository.findByBotId(bot.getId())
                .orElseGet(() -> flowSchemaRepository.save(FlowSchema.builder().bot(bot).build()));
        return toFlowSchemaResponse(schema);
    }

    @Override
    @Transactional
    public FlowSchemaResponse saveFlowSchema(Long botId, FlowSchemaRequest request, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        validateWriteAccess(bot, userId);

        JsonNode nodesNode = objectMapper.valueToTree(request.nodes());
        JsonNode edgesNode = objectMapper.valueToTree(request.edges());
        validateFlowSchema(nodesNode, edgesNode);

        FlowSchema schema = flowSchemaRepository.findByBotId(bot.getId())
                .orElseGet(() -> FlowSchema.builder().bot(bot).build());

        schema.setNodes(toJsonString(nodesNode));
        schema.setEdges(toJsonString(edgesNode));
        schema.setVersion(schema.getVersion() + 1);

        schema = flowSchemaRepository.save(schema);
        redisTemplate.delete("launchly:bot:schema:" + botId);

        bot.setUpdatedAt(LocalDateTime.now());

        userAuditService.logAutomationModified(bot.getUser(), bot.getId(), bot.getName(), bot.getUpdatedAt());
        if (!bot.isActive()) {
            boolean hasRealToken = false;
            try {
                if (bot.getTelegramToken() != null && !bot.getTelegramToken().isBlank()) {
                    String decrypted = encryptionUtil.decrypt(bot.getTelegramToken());
                    if (decrypted != null && !decrypted.isBlank() && 
                        !"0000000000:dummyTokenPlaceholderForNoBotConfig".equals(decrypted)) {
                        hasRealToken = true;
                    }
                }
            } catch (Exception e) {
            }

            if (hasRealToken) {
                try {
                    telegramBotManager.registerBot(bot);
                    bot.setActive(true);
                } catch (Exception e) {
                    log.error("Failed to register bot: {}", e.getMessage(), e);
                }
            }
        }
        botRepository.save(bot);

        return toFlowSchemaResponse(schema);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BotUserResponse> getBotUsers(Long botId, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        return botUserRepository.findAllByBotId(bot.getId()).stream()
                .map(bu -> {
                    List<String> tags = botUserTagRepository.findByBotUserId(bu.getId()).stream()
                            .map(but -> but.getTag().getName())
                            .toList();
                    return new BotUserResponse(
                            bu.getId(),
                            bu.getTelegramId(),
                            bu.getUsername(),
                            bu.getFirstName(),
                            bu.getLastName(),
                            bu.getCurrentNodeId(),
                            bu.getPhotoUrl(),
                            bu.getMetadata(),
                            tags,
                            bu.getCreatedAt()
                    );
                })
                .toList();
    }

    @Override
    @Transactional
    public BotUserResponse updateBotUser(Long botId, Long botUserId, BotUserUpdateRequest request, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        validateWriteAccess(bot, userId);
        BotUser botUser = botUserRepository.findById(botUserId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Contact not found"));

        if (!botUser.getBot().getId().equals(bot.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Access denied to this contact");
        }

        if (request.firstName() != null) {
            botUser.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            botUser.setLastName(request.lastName());
        }
        if (request.metadata() != null) {
            botUser.setMetadata(request.metadata());
        }

        botUser = botUserRepository.save(botUser);

        if (request.tags() != null) {
            botUserTagRepository.deleteByBotUserId(botUser.getId());
            botUserTagRepository.flush();
            for (String tagName : request.tags()) {
                if (tagName == null || tagName.trim().isEmpty()) continue;
                String trimmedName = tagName.trim();
                Tag tag = tagRepository.findByBotIdAndName(bot.getId(), trimmedName)
                        .orElseGet(() -> tagRepository.save(
                                Tag.builder()
                                        .name(trimmedName)
                                        .bot(bot)
                                        .build()
                        ));
                BotUserTag botUserTag = BotUserTag.builder()
                        .botUser(botUser)
                        .tag(tag)
                        .build();
                botUserTagRepository.save(botUserTag);
            }
        }

        List<String> tags = botUserTagRepository.findByBotUserId(botUser.getId()).stream()
                .map(but -> but.getTag().getName())
                .toList();
        return new BotUserResponse(
                botUser.getId(),
                botUser.getTelegramId(),
                botUser.getUsername(),
                botUser.getFirstName(),
                botUser.getLastName(),
                botUser.getCurrentNodeId(),
                botUser.getPhotoUrl(),
                botUser.getMetadata(),
                tags,
                botUser.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public BotUserResponse createBotUser(Long botId, BotUserCreateRequest request, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        validateWriteAccess(bot, userId);
        planLimitService.checkBotUserLimit(bot.getId());

        Long minTelegramId = botUserRepository.findMinTelegramIdByBotId(bot.getId()).orElse(0L);
        Long nextTelegramId = minTelegramId <= 0 ? minTelegramId - 1 : -1L;

        String metadataJson = "{}";
        try {
            Map<String, Object> metaMap = new HashMap<>();
            metaMap.put("paused", false);
            metaMap.put("unsubscribed", false);
            metaMap.put("phone", request.phone());
            metaMap.put("email", request.email());
            metaMap.put("gender", request.gender());

            Map<String, String> customFields = new HashMap<>();
            if (request.phone() != null && !request.phone().trim().isEmpty()) {
                customFields.put("Phone", request.phone().trim());
            }
            if (request.email() != null && !request.email().trim().isEmpty()) {
                customFields.put("Email", request.email().trim());
            }
            if (request.gender() != null && !request.gender().trim().isEmpty()) {
                customFields.put("Gender", request.gender().trim());
            }
            metaMap.put("customFields", customFields);

            metadataJson = objectMapper.writeValueAsString(metaMap);
        } catch (Exception e) {
            log.error("Failed to serialize metadata for contact creation", e);
        }

        BotUser botUser = BotUser.builder()
                .telegramId(nextTelegramId)
                .firstName(request.firstName())
                .lastName(request.lastName())
                .metadata(metadataJson)
                .bot(bot)
                .build();

        botUser = botUserRepository.save(botUser);

        if (request.tags() != null) {
            for (String tagName : request.tags()) {
                if (tagName == null || tagName.trim().isEmpty()) continue;
                String trimmedName = tagName.trim();
                Tag tag = tagRepository.findByBotIdAndName(bot.getId(), trimmedName)
                        .orElseGet(() -> tagRepository.save(
                                Tag.builder()
                                        .name(trimmedName)
                                        .bot(bot)
                                        .build()
                        ));
                BotUserTag botUserTag = BotUserTag.builder()
                        .botUser(botUser)
                        .tag(tag)
                        .build();
                botUserTagRepository.save(botUserTag);
            }
        }

        List<String> tags = botUserTagRepository.findByBotUserId(botUser.getId()).stream()
                .map(but -> but.getTag().getName())
                .toList();

        return new BotUserResponse(
                botUser.getId(),
                botUser.getTelegramId(),
                botUser.getUsername(),
                botUser.getFirstName(),
                botUser.getLastName(),
                botUser.getCurrentNodeId(),
                botUser.getPhotoUrl(),
                botUser.getMetadata(),
                tags,
                botUser.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public void deleteBotUser(Long botId, Long botUserId, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        validateWriteAccess(bot, userId);
        BotUser botUser = botUserRepository.findById(botUserId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Contact not found"));

        if (!botUser.getBot().getId().equals(bot.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Access denied to this contact");
        }
        botUserRepository.delete(botUser);
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

    private Object parseJson(String json) {
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (JacksonException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to parse JSON");
        }
    }

    private String toJsonString(JsonNode jsonNode) {
        try {
            return objectMapper.writeValueAsString(jsonNode);
        } catch (JacksonException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize JSON");
        }
    }

    private void updateBotTelegramInfo(Bot bot, String unencryptedToken) {
        try {
            String url = "https://api.telegram.org/bot" + unencryptedToken + "/getMe";
            RestTemplate restTemplate = new RestTemplate();
            org.springframework.http.ResponseEntity<String> responseEntity = restTemplate.getForEntity(url, String.class);
            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                JsonNode responseNode = objectMapper.readTree(responseEntity.getBody());
                if (responseNode.has("ok") && responseNode.get("ok").asBoolean()) {
                    JsonNode result = responseNode.get("result");
                    if (result.has("username")) {
                        bot.setUsername(result.get("username").asText());
                    }
                    if (result.has("first_name")) {
                        bot.setName(result.get("first_name").asText());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch Telegram bot info: {}", e.getMessage());
        }
    }

    private void releaseTokenFromOtherBots(String token, Long userId, Long currentBotId) {
        if (token == null || "0000000000:dummyTokenPlaceholderForNoBotConfig".equals(token)) {
            return;
        }

        List<Bot> userBots = botRepository.findAllByUserId(userId);
        for (Bot otherBot : userBots) {
            if (!otherBot.getId().equals(currentBotId)) {
                try {
                    String decrypted = encryptionUtil.decrypt(otherBot.getTelegramToken());
                    if (token.equals(decrypted)) {
                        if (otherBot.isActive()) {
                            telegramBotManager.unregisterBot(otherBot.getId());
                            otherBot.setActive(false);
                        }
                        otherBot.setTelegramToken(encryptionUtil.encrypt("0000000000:dummyTokenPlaceholderForNoBotConfig"));
                        otherBot.setUsername(null);
                        botRepository.save(otherBot);
                        log.info("Reassigned token to bot id={}. Automatically reset bot id={} ('{}') to Without bot (inactive)",
                                currentBotId, otherBot.getId(), otherBot.getName());
                    }
                } catch (Exception e) {
                    log.error("Failed to release token from other bot id={}: {}", otherBot.getId(), e.getMessage());
                }
            }
        }
    }

    private Optional<BotMember> getWorkspaceMembership(Bot bot, Long userId) {
        if (bot.getUser().getId().equals(userId)) {
            return Optional.empty();
        }
        return botMemberRepository.findWorkspaceMemberships(bot.getId(), userId).stream().findFirst();
    }

    private BotResponse toBotResponseWithStats(Bot bot) {
        if (bot == null) return null;
        BotResponse response = botMapper.toBotResponse(bot);
        
        boolean hasToken = false;
        try {
            String decryptedToken = encryptionUtil.decrypt(bot.getTelegramToken());
            hasToken = decryptedToken != null && !decryptedToken.isBlank() && !"0000000000:dummyTokenPlaceholderForNoBotConfig".equals(decryptedToken);
        } catch (Exception e) {
            log.error("Failed to decrypt token for bot id={}", bot.getId(), e);
        }

        long totalUsers = hasToken ? botUserRepository.countByBotId(bot.getId()) : 0;

        String role = "Owner";
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
                Long currentUserId = userDetails.getId();
                if (!bot.getUser().getId().equals(currentUserId)) {
                    role = getWorkspaceMembership(bot, currentUserId)
                            .map(BotMember::getRole)
                            .orElse("Viewer");
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
                bot.getTemplateName()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public String getCustomFields(Long botId, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        return bot.getCustomFieldsData() != null ? bot.getCustomFieldsData() : "{}";
    }

    @Override
    @Transactional
    public String saveCustomFields(Long botId, String customFieldsJson, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        validateWriteAccess(bot, userId);
        bot.setCustomFieldsData(customFieldsJson);
        botRepository.save(bot);
        return bot.getCustomFieldsData();
    }

    @Override
    @Transactional(readOnly = true)
    public String getAutomationFolders(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        return user.getAutomationFolders() != null ? user.getAutomationFolders() : "{}";
    }

    @Override
    @Transactional
    public String saveAutomationFolders(String foldersJson, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        user.setAutomationFolders(foldersJson);
        userRepository.save(user);
        return user.getAutomationFolders();
    }

    private void validateWriteAccess(Bot bot, Long userId) {
        if (!bot.getUser().getId().equals(userId)) {
            BotMember member = getWorkspaceMembership(bot, userId)
                    .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Access denied"));
            if ("Viewer".equalsIgnoreCase(member.getRole())) {
                throw new AppException(HttpStatus.FORBIDDEN, "Viewer role cannot modify this bot workspace");
            }
        }
    }
}
