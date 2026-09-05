package com.launchly.bot.service.impl;

import tools.jackson.databind.ObjectMapper;
import com.launchly.billing.service.PlanLimitService;
import com.launchly.bot.dto.request.BotUserCreateRequest;
import com.launchly.bot.dto.request.BotUserUpdateRequest;
import com.launchly.bot.dto.response.BotUserResponse;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.BotSubscriberService;
import com.launchly.bot.validator.BotAccessValidator;
import com.launchly.broadcast.entity.BotUserTag;
import com.launchly.broadcast.entity.Tag;
import com.launchly.broadcast.repository.BotUserTagRepository;
import com.launchly.broadcast.repository.TagRepository;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class BotSubscriberServiceImpl implements BotSubscriberService {

    private final BotUserRepository botUserRepository;
    private final BotUserTagRepository botUserTagRepository;
    private final TagRepository tagRepository;
    private final BotAccessValidator botAccessValidator;
    private final PlanLimitService planLimitService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<BotUserResponse> getBotUsers(Long botId, Long userId) {
        Bot bot = botAccessValidator.getBotWithAccess(botId, userId);
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
        Bot bot = botAccessValidator.getBotWithAccess(botId, userId);
        botAccessValidator.validateWriteAccess(bot, userId);
        BotUser botUser = botUserRepository.findById(botUserId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.contact_not_found"));

        if (!botUser.getBot().getId().equals(bot.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "bot.error.contact_access_denied");
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
        Bot bot = botAccessValidator.getBotWithAccess(botId, userId);
        botAccessValidator.validateWriteAccess(bot, userId);
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
        Bot bot = botAccessValidator.getBotWithAccess(botId, userId);
        botAccessValidator.validateWriteAccess(bot, userId);
        BotUser botUser = botUserRepository.findById(botUserId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.contact_not_found"));

        if (!botUser.getBot().getId().equals(bot.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "bot.error.contact_access_denied");
        }
        botUserRepository.delete(botUser);
    }
}
