package com.launchly.bot.service.impl;

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
import java.time.Duration;
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
import com.launchly.bot.entity.BotUser;
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
import java.util.ArrayList;
import java.util.List;
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

    @Override
    @Transactional
    @CacheEvict(value = "bots", key = "#userId")
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

        String encryptedToken = encryptionUtil.encrypt(rawToken);

        Bot bot = Bot.builder()
                .name(request.name())
                .description(request.description())
                .telegramToken(encryptedToken)
                .user(user)
                .build();

        bot = botRepository.save(bot);

        if (!BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(rawToken)) {
            botLifecycleService.releaseTokenFromOtherBots(rawToken, userId, bot.getId());
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
    @Cacheable(value = "bots", key = "#userId")
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
                bot.getTemplateName()
        );
    }

    @Override
    @Transactional
    @CacheEvict(value = "bots", key = "#userId")
    public BotResponse updateBot(Long id, BotUpdateRequest request, Long userId) {
        Bot bot = findBotByIdAndUser(id, userId);
        botAccessValidator.validateWriteAccess(bot, userId);

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
            boolean wasDummy = BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(decryptedToken);
            boolean isNewReal = !BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(rawToken);

            if (wasDummy && isNewReal) {
                planLimitService.checkBotLimit(userId, rawToken);
            }

            if (isNewReal) {
                botLifecycleService.releaseTokenFromOtherBots(rawToken, userId, bot.getId());
                bot.setTemplate(false);
            }

            bot.setTelegramToken(encryptionUtil.encrypt(rawToken));
            if (!BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(rawToken)) {
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
    @Caching(evict = {
            @CacheEvict(value = "bots", key = "#userId"),
            @CacheEvict(value = "flow_schemas", key = "#id")
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
    @Cacheable(value = "flow_schemas", key = "#botId")
    public FlowSchemaResponse getFlowSchema(Long botId, Long userId) {
        Bot bot = findBotByIdAndUser(botId, userId);
        FlowSchema schema = flowSchemaRepository.findByBotId(bot.getId())
                .orElseGet(() -> flowSchemaRepository.save(FlowSchema.builder().bot(bot).build()));
        return toFlowSchemaResponse(schema);
    }

    @Override
    @Transactional
    @CacheEvict(value = "flow_schemas", key = "#botId")
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

        schema = flowSchemaRepository.save(schema);
        redisTemplate.delete("launchly:bot:schema:" + botId);

        userAuditService.logAutomationModified(bot.getUser(), bot.getId(), bot.getName(), LocalDateTime.now());
        if (!bot.isActive()) {
            boolean hasRealToken = false;
            try {
                if (bot.getTelegramToken() != null && !bot.getTelegramToken().isBlank()) {
                    String decrypted = encryptionUtil.decrypt(bot.getTelegramToken());
                    if (decrypted != null && !decrypted.isBlank() && 
                        !BotConstants.DUMMY_TOKEN_PLACEHOLDER.equals(decrypted)) {
                        hasRealToken = true;
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to decrypt bot token during flow save: {}", e.getMessage());
            }

            if (hasRealToken) {
                try {
                    botLifecycleService.registerBot(bot);
                    bot.setActive(true);
                    bot.setUpdatedAt(LocalDateTime.now());
                    botRepository.save(bot);
                } catch (Exception e) {
                    log.error("Failed to register bot: {}", e.getMessage(), e);
                }
            }
        }

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
                parseJson(schema.getEdges())
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

    private void updateBotTelegramInfo(Bot bot, String unencryptedToken) {
        try {
            String url = TelegramConstants.BOT_API_URL + unencryptedToken + "/getMe";
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
            log.debug("Could not fetch Telegram bot info: {}", e.getMessage());
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
}