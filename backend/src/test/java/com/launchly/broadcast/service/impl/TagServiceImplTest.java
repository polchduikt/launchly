package com.launchly.broadcast.service.impl;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.broadcast.entity.BotUserTag;
import com.launchly.broadcast.entity.Tag;
import com.launchly.broadcast.mapper.BroadcastMapper;
import com.launchly.broadcast.repository.BotUserTagRepository;
import com.launchly.broadcast.repository.TagRepository;
import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TagServiceImplTest {

    @Mock
    private TagRepository tagRepository;

    @Mock
    private BotUserTagRepository botUserTagRepository;

    @Mock
    private BotRepository botRepository;

    @Mock
    private BotUserRepository botUserRepository;

    @Mock
    private BroadcastMapper broadcastMapper;

    @Mock
    private CacheManager cacheManager;

    @InjectMocks
    private TagServiceImpl tagService;

    private Bot testBot;
    private Tag testTag;

    @BeforeEach
    void setUp() {
        testBot = Bot.builder().name("Tag Bot").build();
        ReflectionTestUtils.setField(testBot, "id", 10L);

        testTag = Tag.builder().name("VIP").bot(testBot).build();
        ReflectionTestUtils.setField(testTag, "id", 100L);
    }

    @Test
    @DisplayName("Should return existing tag if found")
    void getOrCreateTag_WhenTagExists_ReturnsExisting() {
        when(tagRepository.findByBotIdAndName(10L, "VIP")).thenReturn(Optional.of(testTag));

        Tag tag = tagService.getOrCreateTag(10L, "VIP");

        assertThat(tag).isEqualTo(testTag);
        verify(tagRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should create new tag when it does not exist")
    void getOrCreateTag_WhenNewTag_CreatesAndReturns() {
        when(tagRepository.findByBotIdAndName(10L, "VIP")).thenReturn(Optional.empty());
        when(botRepository.findById(10L)).thenReturn(Optional.of(testBot));
        when(tagRepository.save(any(Tag.class))).thenReturn(testTag);

        Tag tag = tagService.getOrCreateTag(10L, "VIP");

        assertThat(tag).isNotNull();
        assertThat(tag.getName()).isEqualTo("VIP");
        verify(tagRepository, times(1)).save(any(Tag.class));
    }

    @Test
    @DisplayName("Should assign tag to bot user when not already assigned")
    void assignTagToUser_WhenNotAssigned_SavesRelation() {
        BotUser botUser = BotUser.builder().bot(testBot).telegramId(555L).build();
        ReflectionTestUtils.setField(botUser, "id", 1L);

        when(botUserTagRepository.existsByBotUserIdAndTagId(1L, 100L)).thenReturn(false);
        when(botUserRepository.getReferenceById(1L)).thenReturn(botUser);
        when(tagRepository.getReferenceById(100L)).thenReturn(testTag);

        tagService.assignTagToUser(1L, 100L);

        verify(botUserTagRepository, times(1)).save(any(BotUserTag.class));
    }

    @Test
    @DisplayName("Should skip saving when tag is already assigned to user")
    void assignTagToUser_WhenAlreadyAssigned_DoesNothing() {
        when(botUserTagRepository.existsByBotUserIdAndTagId(1L, 100L)).thenReturn(true);

        tagService.assignTagToUser(1L, 100L);

        verify(botUserTagRepository, never()).save(any());
    }
}
