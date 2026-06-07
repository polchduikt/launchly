package com.launchly.broadcast.service.impl;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.broadcast.dto.request.CreateTagRequest;
import com.launchly.broadcast.dto.response.TagResponse;
import com.launchly.broadcast.entity.BotUserTag;
import com.launchly.broadcast.entity.Tag;
import com.launchly.broadcast.mapper.BroadcastMapper;
import com.launchly.broadcast.repository.BotUserTagRepository;
import com.launchly.broadcast.repository.TagRepository;
import com.launchly.broadcast.service.TagService;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TagServiceImpl implements TagService {

    private final TagRepository tagRepository;
    private final BotUserTagRepository botUserTagRepository;
    private final BotRepository botRepository;
    private final BotUserRepository botUserRepository;
    private final BroadcastMapper broadcastMapper;
    private final CacheManager cacheManager;

    @Override
    @Transactional
    public Tag getOrCreateTag(Long botId, String name) {
        return tagRepository.findByBotIdAndName(botId, name)
                .orElseGet(() -> {
                    Bot bot = botRepository.findById(botId)
                            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Bot not found"));
                    Tag tag = Tag.builder()
                            .name(name)
                            .bot(bot)
                            .build();
                    log.info("Created new tag '{}' for botId={}", name, botId);
                    Tag savedTag = tagRepository.save(tag);
                    evictTagsCache(botId);
                    return savedTag;
                });
    }

    @Override
    @Transactional
    public void assignTagToUser(Long botUserId, Long tagId) {
        if (botUserTagRepository.existsByBotUserIdAndTagId(botUserId, tagId)) {
            log.debug("Tag {} already assigned to botUser {}", tagId, botUserId);
            return;
        }
        BotUserTag botUserTag = BotUserTag.builder()
                .botUser(botUserRepository.getReferenceById(botUserId))
                .tag(tagRepository.getReferenceById(tagId))
                .build();
        botUserTagRepository.save(botUserTag);
        log.info("Assigned tag {} to botUser {}", tagId, botUserId);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "tags", key = "#botId")
    public List<TagResponse> getTagsByBot(Long botId, Long userId) {
        validateBotOwnership(botId, userId);
        return broadcastMapper.toTagResponseList(tagRepository.findByBotId(botId));
    }

    @Override
    @Transactional
    public TagResponse createTag(Long botId, Long userId, CreateTagRequest request) {
        Bot bot = validateBotOwnership(botId, userId);

        tagRepository.findByBotIdAndName(botId, request.name())
                .ifPresent(existing -> {
                    throw new AppException(HttpStatus.CONFLICT, "Tag '" + request.name() + "' already exists for this bot");
                });

        Tag tag = Tag.builder()
                .name(request.name())
                .bot(bot)
                .build();
        tag = tagRepository.save(tag);
        evictTagsCache(botId);
        log.info("Created tag '{}' for botId={}", request.name(), botId);
        return broadcastMapper.toTagResponse(tag);
    }

    @Override
    @Transactional
    public void deleteTag(Long tagId, Long userId) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tag not found"));
        Long botId = tag.getBot().getId();
        validateBotOwnership(botId, userId);
        botUserTagRepository.deleteByTagId(tagId);
        tagRepository.delete(tag);
        evictTagsCache(botId);
        log.info("Deleted tag {} (name='{}')", tagId, tag.getName());
    }

    private Bot validateBotOwnership(Long botId, Long userId) {
        return botRepository.findByIdAndUserId(botId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Bot not found or access denied"));
    }

    private void evictTagsCache(Long botId) {
        if (botId != null) {
            org.springframework.cache.Cache cache = cacheManager.getCache("tags");
            if (cache != null) {
                cache.evict(botId);
            }
        }
    }
}
