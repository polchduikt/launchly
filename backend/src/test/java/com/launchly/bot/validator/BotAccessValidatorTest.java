package com.launchly.bot.validator;

import com.launchly.auth.entity.User;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotMember;
import com.launchly.bot.repository.BotMemberRepository;
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

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BotAccessValidatorTest {

    @Mock
    private BotMemberRepository botMemberRepository;

    @InjectMocks
    private BotAccessValidator botAccessValidator;

    private User owner;
    private Bot bot;

    @BeforeEach
    void setUp() {
        owner = User.builder().email("owner@launchly.pro").build();
        ReflectionTestUtils.setField(owner, "id", 1L);

        bot = Bot.builder().name("Test Bot").user(owner).build();
        ReflectionTestUtils.setField(bot, "id", 10L);
    }

    @Test
    @DisplayName("Should pass write validation when user is bot owner")
    void validateWriteAccess_WhenOwner_Success() {
        botAccessValidator.validateWriteAccess(bot, 1L);
    }

    @Test
    @DisplayName("Should pass write validation when user is member with Editor role")
    void validateWriteAccess_WhenEditorMember_Success() {
        BotMember editor = BotMember.builder().role("Editor").build();
        when(botMemberRepository.findWorkspaceMemberships(10L, 2L)).thenReturn(List.of(editor));

        botAccessValidator.validateWriteAccess(bot, 2L);
    }

    @Test
    @DisplayName("Should throw Forbidden when user is member with Viewer role")
    void validateWriteAccess_WhenViewerMember_ThrowsForbidden() {
        BotMember viewer = BotMember.builder().role("Viewer").build();
        when(botMemberRepository.findWorkspaceMemberships(10L, 2L)).thenReturn(List.of(viewer));

        assertThatThrownBy(() -> botAccessValidator.validateWriteAccess(bot, 2L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Should throw Forbidden when user is not a member of the workspace")
    void validateWriteAccess_WhenNonMember_ThrowsForbidden() {
        when(botMemberRepository.findWorkspaceMemberships(10L, 3L)).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> botAccessValidator.validateWriteAccess(bot, 3L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Should throw Forbidden when bot or userId is null")
    void validateWriteAccess_WhenNullArgs_ThrowsForbidden() {
        assertThatThrownBy(() -> botAccessValidator.validateWriteAccess(null, 1L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);

        assertThatThrownBy(() -> botAccessValidator.validateWriteAccess(bot, null))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Should return empty membership when user is owner or args null")
    void getWorkspaceMembership_EdgeCases_ReturnsEmpty() {
        assertThat(botAccessValidator.getWorkspaceMembership(null, 1L)).isEmpty();
        assertThat(botAccessValidator.getWorkspaceMembership(bot, null)).isEmpty();
        assertThat(botAccessValidator.getWorkspaceMembership(bot, 1L)).isEmpty();
    }
}
