package com.launchly.broadcast.service.impl;

import com.launchly.auth.entity.User;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.broadcast.dto.request.CreateTagRequest;
import com.launchly.broadcast.dto.response.TagResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
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

    private User testUser;
    private Bot testBot;
    private Tag testTag;

    @BeforeEach
    void setUp() {
        testUser = User.builder().email("user@launchly.pro").name("User").build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        testBot = Bot.builder().name("Test Bot").user(testUser).build();
        ReflectionTestUtils.setField(testBot, "id", 10L);

        testTag = Tag.builder().name("VIP").bot(testBot).build();
        ReflectionTestUtils.setField(testTag, "id", 100L);
    }

    @Test
    @DisplayName("Should return existing tag if found")
    void getOrCreateTag_WhenExists_ReturnsExisting() {
        when(tagRepository.findByBotIdAndName(10L, "VIP")).thenReturn(Optional.of(testTag));

        Tag result = tagService.getOrCreateTag(10L, "VIP");

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("VIP");
        verify(tagRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should create new tag if not found")
    void getOrCreateTag_WhenNotFound_CreatesTag() {
        when(tagRepository.findByBotIdAndName(10L, "VIP")).thenReturn(Optional.empty());
        when(botRepository.findById(10L)).thenReturn(Optional.of(testBot));
        when(tagRepository.save(any(Tag.class))).thenReturn(testTag);

        Tag result = tagService.getOrCreateTag(10L, "VIP");

        assertThat(result).isNotNull();
        verify(tagRepository, times(1)).save(any(Tag.class));
    }

    @Test
    @DisplayName("Should assign tag to user when not already assigned")
    void assignTagToUser_WhenNotAssigned_SavesRelation() {
        when(botUserTagRepository.existsByBotUserIdAndTagId(1L, 100L)).thenReturn(false);
        when(botUserRepository.getReferenceById(1L)).thenReturn(mock(BotUser.class));
        when(tagRepository.getReferenceById(100L)).thenReturn(testTag);

        tagService.assignTagToUser(1L, 100L);

        verify(botUserTagRepository, times(1)).save(any(BotUserTag.class));
    }

    @Test
    @DisplayName("Should skip assigning tag if already assigned")
    void assignTagToUser_WhenAlreadyAssigned_Skips() {
        when(botUserTagRepository.existsByBotUserIdAndTagId(1L, 100L)).thenReturn(true);

        tagService.assignTagToUser(1L, 100L);

        verify(botUserTagRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully create a custom tag")
    void createTag_Success() {
        CreateTagRequest request = new CreateTagRequest("NEW_CUSTOMER");
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        when(tagRepository.findByBotIdAndName(10L, "NEW_CUSTOMER")).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenReturn(testTag);
        when(broadcastMapper.toTagResponse(any(Tag.class))).thenReturn(mock(TagResponse.class));

        TagResponse response = tagService.createTag(10L, 1L, request);

        assertThat(response).isNotNull();
        verify(tagRepository, times(1)).save(any(Tag.class));
    }

    @Test
    @DisplayName("Should throw Conflict when creating a tag that already exists")
    void createTag_WhenDuplicate_ThrowsConflict() {
        CreateTagRequest request = new CreateTagRequest("VIP");
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        when(tagRepository.findByBotIdAndName(10L, "VIP")).thenReturn(Optional.of(testTag));

        assertThatThrownBy(() -> tagService.createTag(10L, 1L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("Should delete tag by ID")
    void deleteTag_Success() {
        when(tagRepository.findById(100L)).thenReturn(Optional.of(testTag));
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));

        tagService.deleteTag(100L, 1L);

        verify(tagRepository, times(1)).delete(testTag);
    }

    @Test
    @DisplayName("Should throw NotFound when deleting non-existent tag")
    void deleteTag_WhenNotFound_ThrowsNotFound() {
        when(tagRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tagService.deleteTag(999L, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Should return list of tags for a bot")
    void getTagsByBot_Success() {
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testBot));
        when(tagRepository.findByBotId(10L)).thenReturn(List.of(testTag));
        when(broadcastMapper.toTagResponseList(List.of(testTag))).thenReturn(List.of(mock(TagResponse.class)));

        List<TagResponse> tags = tagService.getTagsByBot(10L, 1L);

        assertThat(tags).hasSize(1);
    }
}
