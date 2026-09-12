package com.launchly.bot.service.impl;

import com.launchly.common.constant.CacheConstants;
import org.springframework.web.client.RestTemplate;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.bot.dto.request.BotCreateRequest;
import com.launchly.bot.dto.request.BotUpdateRequest;
import com.launchly.bot.dto.request.FlowSchemaRequest;
import com.launchly.bot.dto.response.BotDetailResponse;
import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.dto.response.BotStatsResponse;
import com.launchly.bot.dto.response.BotUserResponse;
import com.launchly.bot.dto.response.FlowSchemaResponse;
import com.launchly.bot.constant.BotConstants;
import com.launchly.bot.constant.TelegramConstants;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotMember;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.mapper.BotResponseFactory;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.bot.repository.InstalledTemplateRepository;
import com.launchly.bot.repository.AccountTemplateRepository;
import com.launchly.bot.service.BotLifecycleService;
import com.launchly.bot.service.BotService;
import com.launchly.bot.service.BotSubscriberService;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.EncryptionUtil;
import com.launchly.media.service.MediaService;
import com.launchly.bot.dto.request.BotUserCreateRequest;
import com.launchly.bot.dto.request.BotUserUpdateRequest;
import com.launchly.bot.validator.BotAccessValidator;
import com.launchly.bot.validator.FlowSchemaValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

import com.launchly.admin.service.UserAuditService;

@Slf4j
@Service
@RequiredArgsConstructor
public class BotServiceImpl implements BotService {

    private final BotRepository botRepository;
    private final FlowSchemaRepository flowSchemaRepository;
    private final BotUserRepository botUserRepository;
    private final UserQueryService userQueryService;
    private final EncryptionUtil encryptionUtil;
    private final ObjectMapper objectMapper;
    private final PlanLimitService planLimitService;
    private final MediaService mediaService;
    private final StringRedisTemplate redisTemplate;
    private final BotMemberRepository botMemberRepository;
    private final InstalledTemplateRepository installedTemplateRepository;
    private final AccountTemplateRepository accountTemplateRepository;
    private final UserAuditService userAuditService;
    private final FlowSchemaValidator flowSchemaValidator;
    private final BotAccessValidator botAccessValidator;
    private final BotLifecycleService botLifecycleService;
    private final BotSubscriberService botSubscriberService;
    private final BotResponseFactory botResponseFactory;
    private final RestTemplate restTemplate;
    private final org.springframework.transaction.support.TransactionTemplate transactionTemplate;
    private final org.springframework.cache.CacheManager cacheManager;

    private record TelegramBotInfo(String username, String firstName) {}

    private TelegramBotInfo fetchTelegramBotInfo(String unencryptedToken) {
        if (unencryptedToken == null || unencryptedToken.isBlank() || BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(unencryptedToken)) {
            return new TelegramBotInfo(null, null);
        }
        try {
            String url = TelegramConstants.BOT_API_URL + unencryptedToken + "/getMe";
            org.springframework.http.ResponseEntity<String> responseEntity = restTemplate.getForEntity(url, String.class);
            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                JsonNode responseNode = objectMapper.readTree(responseEntity.getBody());
                if (responseNode.has("ok") && responseNode.get("ok").asBoolean()) {
                    JsonNode result = responseNode.get("result");
                    String username = result.has("username") ? result.get("username").asText() : null;
                    String firstName = result.has("first_name") ? result.get("first_name").asText() : null;
                    return new TelegramBotInfo(username, firstName);
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch Telegram bot info: {}", e.getMessage(), e);
        }
        return new TelegramBotInfo(null, null);
    }

    @Override
    @CacheEvict(value = CacheConstants.BOTS, key = "#userId")
    public BotResponse createBot(BotCreateRequest request, Long userId) {
        User user = userQueryService.getUserOrThrow(userId);

        String rawToken = request.telegramToken();
        if (request.copyTokenFromBotId() != null) {
            Bot sourceBot = findBotByIdAndUser(request.copyTokenFromBotId(), userId);
            rawToken = encryptionUtil.decrypt(sourceBot.getTelegramToken());
        }

        boolean isDummy = (rawToken == null || rawToken.trim().isEmpty() || BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(rawToken));
        if (!isDummy) {
            planLimitService.checkBotLimit(userId, rawToken);
        }

        if (rawToken == null || rawToken.trim().isEmpty()) {
            rawToken = BotConstants.DUMMY_TOKEN_PLACEHOLDER;
        }

        final String finalRawToken = rawToken;
        final boolean finalIsDummy = isDummy;
        final TelegramBotInfo tgInfo = !finalIsDummy ? fetchTelegramBotInfo(finalRawToken) : new TelegramBotInfo(null, null);
        final String encryptedToken = encryptionUtil.encrypt(finalRawToken);

        Bot bot = transactionTemplate.execute(status -> {
            List<Bot> existingBots = botRepository.findAllByUserId(userId);
            String inheritedCustomFields = existingBots.stream()
                    .map(Bot::getCustomFieldsData)
                    .filter(data -> data != null && !data.trim().isEmpty() && !data.trim().equals("{}"))
                    .findFirst()
                    .orElse(null);

            String botName = request.name();
            if ((botName == null || botName.isBlank()) && tgInfo.firstName() != null) {
                botName = tgInfo.firstName();
            }

            Bot newBot = Bot.builder()
                    .name(botName)
                    .username(tgInfo.username())
                    .description(request.description())
                    .telegramToken(encryptedToken)
                    .customFieldsData(inheritedCustomFields)
                    .user(user)
                    .build();

            newBot = botRepository.save(newBot);

            if (!finalIsDummy) {
                botLifecycleService.releaseTokenFromOtherBots(finalRawToken, userId, newBot.getId());
            }

            FlowSchema schema = FlowSchema.builder()
                    .bot(newBot)
                    .build();
            flowSchemaRepository.save(schema);

            List<BotMember> ownerMembers = botMemberRepository.findByBotOwnerId(userId);
            Map<Long, BotMember> uniqueMembers = new HashMap<>();
            for (BotMember m : ownerMembers) {
                uniqueMembers.putIfAbsent(m.getUser().getId(), m);
            }
            for (BotMember m : uniqueMembers.values()) {
                BotMember member = BotMember.builder()
                        .bot(newBot)
                        .user(m.getUser())
                        .role(m.getRole())
                        .inboxSeat(m.isInboxSeat())
                        .billingPermission(m.isBillingPermission())
                        .build();
                botMemberRepository.save(member);
                if (cacheManager != null) {
                    org.springframework.cache.Cache cache = cacheManager.getCache(CacheConstants.BOTS);
                    if (cache != null) {
                        cache.evict(m.getUser().getId());
                    }
                }
            }

            userAuditService.logBotConnected(user, newBot.getId(), newBot.getName(), newBot.getCreatedAt());

            return newBot;
        });

        return toBotResponseWithStats(bot);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConstants.BOTS, key = "#userId")
    public List<BotResponse> getBotsByUser(Long userId) {
        List<Bot> allBots = new ArrayList<>(botRepository.findAllAccessibleByUserId(userId));
        allBots.sort(Comparator.comparing(Bot::getId));
        List<BotMember> memberships = botMemberRepository.findByUserId(userId);
        return botResponseFactory.toBotResponseListWithStats(allBots, userId, memberships);
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
                bot.getTemplateName(),
                bot.getResponseMode()
        );
    }

    @Override
    @CacheEvict(value = CacheConstants.BOTS, key = "#userId")
    public BotResponse updateBot(Long id, BotUpdateRequest request, Long userId) {
        Bot existingBot = findBotByIdAndUser(id, userId);
        botAccessValidator.validateWriteAccess(existingBot, userId);

        String rawToken = request.telegramToken();
        if (request.copyTokenFromBotId() != null) {
            Bot sourceBot = findBotByIdAndUser(request.copyTokenFromBotId(), userId);
            rawToken = encryptionUtil.decrypt(sourceBot.getTelegramToken());
        }

        TelegramBotInfo tgInfo = null;
        if (rawToken != null && !BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(rawToken)) {
            tgInfo = fetchTelegramBotInfo(rawToken);
        }

        final TelegramBotInfo finalTgInfo = tgInfo;
        final String finalRawToken = rawToken;

        String oldPublicIdToDelete = null;
        if (request.avatar() != null && !request.avatar().equals(existingBot.getAvatar())) {
            oldPublicIdToDelete = existingBot.getAvatarPublicId();
        }

        Bot updatedBot = transactionTemplate.execute(status -> {
            Bot bot = findBotByIdAndUser(id, userId);
            if (request.name() != null) {
                bot.setName(request.name());
            }

            if (request.responseMode() != null) {
                bot.setResponseMode(request.responseMode());
            }

            if (finalRawToken != null) {
                String decryptedToken = encryptionUtil.decrypt(bot.getTelegramToken());
                boolean wasDummy = BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(decryptedToken);
                boolean isNewReal = !BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(finalRawToken);

                if (wasDummy && isNewReal) {
                    planLimitService.checkBotLimit(userId, finalRawToken);
                }

                if (isNewReal) {
                    botLifecycleService.releaseTokenFromOtherBots(finalRawToken, userId, bot.getId());
                    bot.setTemplate(false);
                }

                bot.setTelegramToken(encryptionUtil.encrypt(finalRawToken));
                if (isNewReal) {
                    if (finalTgInfo != null) {
                        if (finalTgInfo.username() != null) {
                            bot.setUsername(finalTgInfo.username());
                        }
                        if (finalTgInfo.firstName() != null && (bot.getName() == null || bot.getName().isBlank())) {
                            bot.setName(finalTgInfo.firstName());
                        }
                    }
                } else {
                    bot.setUsername(null);
                }
            }

            if (request.description() != null) {
                bot.setDescription(request.description());
            }

            if (request.avatar() != null) {
                bot.setAvatar(request.avatar());
                bot.setAvatarPublicId(request.avatarPublicId());
            }

            bot.setUpdatedAt(LocalDateTime.now());
            return botRepository.save(bot);
        });

        if (oldPublicIdToDelete != null && !oldPublicIdToDelete.trim().isEmpty()) {
            try {
                mediaService.delete(oldPublicIdToDelete, userId);
            } catch (Exception e) {
                log.warn("Failed to delete old avatar publicId {} from Cloudinary: {}", oldPublicIdToDelete, e.getMessage(), e);
            }
        }

        return toBotResponseWithStats(updatedBot);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConstants.BOTS, key = "#userId"),
            @CacheEvict(value = CacheConstants.FLOW_SCHEMAS, key = "#id")
    })
    public void deleteBot(Long id, Long userId) {
        Bot bot = findBotByIdAndUser(id, userId);
        botAccessValidator.validateWriteAccess(bot, userId);

        if (bot.isActive()) {
            botLifecycleService.unregisterBot(bot.getId());
        }

        installedTemplateRepository.deleteAllByBotId(bot.getId());
        accountTemplateRepository.detachSourceBot(bot.getId());
        botRepository.delete(bot);
    }

    @Override
    public BotResponse startBot(Long id, Long userId) {
        return botLifecycleService.startBot(id, userId);
    }

    @Override
    public BotResponse publishBot(Long id, Long userId) {
        return botLifecycleService.publishBot(id, userId);
    }

    @Override
    public BotResponse stopBot(Long id, Long userId) {
        return botLifecycleService.stopBot(id, userId);
    }

    @Override
    @Transactional
    @Cacheable(value = CacheConstants.FLOW_SCHEMAS, key = "#botId")
    public FlowSchemaResponse getFlowSchema(Long botId, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        FlowSchema schema = flowSchemaRepository.findByBotId(bot.getId())
                .orElseGet(() -> flowSchemaRepository.save(FlowSchema.builder().bot(bot).build()));
        return toFlowSchemaResponse(schema);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConstants.BOTS, key = "#userId"),
            @CacheEvict(value = CacheConstants.FLOW_SCHEMAS, key = "#botId")
    })
    public FlowSchemaResponse saveFlowSchema(Long botId, FlowSchemaRequest request, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        botAccessValidator.validateWriteAccess(bot, userId);

        JsonNode nodesNode = objectMapper.valueToTree(request.nodes());
        JsonNode edgesNode = objectMapper.valueToTree(request.edges());
        flowSchemaValidator.validateFlowSchema(nodesNode, edgesNode);

        FlowSchema schema = flowSchemaRepository.findByBotId(bot.getId())
                .orElseGet(() -> FlowSchema.builder().bot(bot).build());

        schema.setNodes(toJsonString(nodesNode));
        schema.setEdges(toJsonString(edgesNode));

        if (schema.getPublishedNodes() == null || schema.getPublishedNodes().isBlank() || "[]".equals(schema.getPublishedNodes().trim())) {
            schema.setPublishedNodes(toJsonString(nodesNode));
            schema.setPublishedEdges(toJsonString(edgesNode));
        }

        schema = flowSchemaRepository.save(schema);

        userAuditService.logAutomationModified(bot.getUser(), bot.getId(), bot.getName(), LocalDateTime.now());

        return toFlowSchemaResponse(schema);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BotUserResponse> getBotUsers(Long botId, Long userId) {
        return botSubscriberService.getBotUsers(botId, userId);
    }

    @Override
    @Transactional
    public BotUserResponse updateBotUser(Long botId, Long botUserId, BotUserUpdateRequest request, Long userId) {
        return botSubscriberService.updateBotUser(botId, botUserId, request, userId);
    }

    @Override
    @Transactional
    public BotUserResponse createBotUser(Long botId, BotUserCreateRequest request, Long userId) {
        return botSubscriberService.createBotUser(botId, request, userId);
    }

    @Override
    @Transactional
    public void deleteBotUser(Long botId, Long botUserId, Long userId) {
        botSubscriberService.deleteBotUser(botId, botUserId, userId);
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
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found"));
    }

    private String maskToken(String token) {
        if (token == null || !token.contains(":")) {
            return "****";
        }
        String[] parts = token.split(":", 2);
        return parts[0] + ":****";
    }

    private FlowSchemaResponse toFlowSchemaResponse(FlowSchema schema) {
        return new FlowSchemaResponse(
                schema.getId(),
                schema.getVersion(),
                parseJson(schema.getNodes()),
                parseJson(schema.getEdges()),
                parseJson(schema.getEffectivePublishedNodes()),
                parseJson(schema.getEffectivePublishedEdges())
        );
    }

    private Object parseJson(String json) {
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (JacksonException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "common.error.json_parse");
        }
    }

    private String toJsonString(JsonNode jsonNode) {
        try {
            return objectMapper.writeValueAsString(jsonNode);
        } catch (JacksonException e) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "common.error.json_serialize");
        }
    }

    private BotResponse toBotResponseWithStats(Bot bot) {
        return botResponseFactory.toBotResponseWithStats(bot);
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
        botAccessValidator.validateWriteAccess(bot, userId);
        bot.setCustomFieldsData(customFieldsJson);
        botRepository.save(bot);
        return bot.getCustomFieldsData();
    }

    @Override
    @Transactional(readOnly = true)
    public String getAutomationFolders(Long userId) {
        User user = userQueryService.getUserOrThrow(userId);
        return user.getAutomationFolders() != null ? user.getAutomationFolders() : "{}";
    }

    @Override
    @Transactional
    public String saveAutomationFolders(String foldersJson, Long userId) {
        User user = userQueryService.getUserOrThrow(userId);
        user.setAutomationFolders(foldersJson);
        userQueryService.save(user);
        return user.getAutomationFolders();
    }

    @Override
    @Transactional
    public void deleteAllUserData(Long userId) {
        List<Bot> ownedBots = botRepository.findAllByUserId(userId);
        for (Bot b : ownedBots) {
            botRepository.delete(b);
        }

        List<BotMember> memberships = botMemberRepository.findByUserId(userId);
        for (BotMember bm : memberships) {
            botMemberRepository.delete(bm);
        }
    }
}