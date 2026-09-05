package com.launchly.bot.engine.action.handler;

import com.launchly.bot.engine.action.BotActionHandler;
import com.launchly.bot.entity.BotUser;
import com.launchly.broadcast.entity.BotUserTag;
import com.launchly.broadcast.entity.Tag;
import com.launchly.broadcast.repository.BotUserTagRepository;
import com.launchly.broadcast.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class TagBotActionHandler implements BotActionHandler {

    private final TagRepository tagRepository;
    private final BotUserTagRepository botUserTagRepository;

    @Override
    public Set<String> getSupportedTypes() {
        return Set.of("ADD_TAG", "REMOVE_TAG");
    }

    @Override
    public void execute(String type, Map<String, Object> action, BotUser botUser, Map<String, String> sessionData) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        String tagName = (String) action.get("tagName");
        Object tagIdObj = action.get("tagId");

        if ("ADD_TAG".equals(type)) {
            if (tagIdObj != null && !String.valueOf(tagIdObj).isEmpty()) {
                Long tagId = Long.parseLong(String.valueOf(tagIdObj));
                tagRepository.findById(tagId).ifPresent(tag -> {
                    if (!botUserTagRepository.existsByBotUserIdAndTagId(botUser.getId(), tag.getId())) {
                        botUserTagRepository.save(BotUserTag.builder().botUser(botUser).tag(tag).build());
                        log.info("Added tag ID {} to user {}", tag.getId(), telegramUserId);
                    }
                });
            } else if (tagName != null && !tagName.trim().isEmpty()) {
                Tag tag = tagRepository.findByBotIdAndName(botId, tagName.trim())
                        .orElseGet(() -> tagRepository.save(Tag.builder().name(tagName.trim()).bot(botUser.getBot()).build()));
                if (!botUserTagRepository.existsByBotUserIdAndTagId(botUser.getId(), tag.getId())) {
                    botUserTagRepository.save(BotUserTag.builder().botUser(botUser).tag(tag).build());
                    log.info("Created and added tag '{}' to user {}", tagName, telegramUserId);
                }
            }
        } else if ("REMOVE_TAG".equals(type)) {
            if (tagIdObj != null && !String.valueOf(tagIdObj).isEmpty()) {
                Long tagId = Long.parseLong(String.valueOf(tagIdObj));
                botUserTagRepository.deleteByBotUserIdAndTagId(botUser.getId(), tagId);
                log.info("Removed tag ID {} from user {}", tagId, telegramUserId);
            } else if (tagName != null && !tagName.trim().isEmpty()) {
                tagRepository.findByBotIdAndName(botId, tagName.trim()).ifPresent(tag -> {
                    botUserTagRepository.deleteByBotUserIdAndTagId(botUser.getId(), tag.getId());
                    log.info("Removed tag '{}' from user {}", tagName, telegramUserId);
                });
            }
        }
    }
}
