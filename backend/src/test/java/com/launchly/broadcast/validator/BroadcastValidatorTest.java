package com.launchly.broadcast.validator;

import com.launchly.auth.entity.User;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotMember;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BroadcastValidatorTest {

    @Mock
    private BotRepository botRepository;

    @Mock
    private BotMemberRepository botMemberRepository;

    @InjectMocks
    private BroadcastValidator validator;

    private User owner;
    private Bot bot;

    @BeforeEach
    void setUp() {
        owner = User.builder().email("owner@launchly.pro").build();
        ReflectionTestUtils.setField(owner, "id", 1L);

        bot = Bot.builder().name("Broadcast Bot").user(owner).build();
        ReflectionTestUtils.setField(bot, "id", 10L);
    }

    @Test
    @DisplayName("Should validate future scheduled date successfully")
    void validateScheduledAt_FutureDate_Success() {
        validator.validateScheduledAt(LocalDateTime.now().plusDays(2));
        validator.validateScheduledAt(null);
    }

    @Test
    @DisplayName("Should throw BadRequest when scheduled date is in the past")
    void validateScheduledAt_PastDate_ThrowsBadRequest() {
        assertThatThrownBy(() -> validator.validateScheduledAt(LocalDateTime.now().minusMinutes(5)))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should validate bot ownership when user is owner")
    void validateBotOwnership_WhenOwner_Success() {
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(bot));

        Bot result = validator.validateBotOwnership(10L, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("Should throw Forbidden when bot ownership is invalid")
    void validateBotOwnership_WhenNotFound_ThrowsForbidden() {
        when(botRepository.findByIdAndUserId(10L, 99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> validator.validateBotOwnership(10L, 99L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Should validate write access for owner and editor")
    void validateWriteAccess_WhenOwnerOrEditor_Success() {
        when(botRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(bot));
        validator.validateWriteAccess(10L, 1L);

        when(botRepository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.of(bot));
        BotMember editor = BotMember.builder().role("Editor").build();
        when(botMemberRepository.findWorkspaceMemberships(10L, 2L)).thenReturn(List.of(editor));
        validator.validateWriteAccess(10L, 2L);
    }

    @Test
    @DisplayName("Should throw Forbidden when viewer tries to write")
    void validateWriteAccess_WhenViewer_ThrowsForbidden() {
        when(botRepository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.of(bot));
        BotMember viewer = BotMember.builder().role("Viewer").build();
        when(botMemberRepository.findWorkspaceMemberships(10L, 2L)).thenReturn(List.of(viewer));

        assertThatThrownBy(() -> validator.validateWriteAccess(10L, 2L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }
}
