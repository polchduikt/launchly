package com.launchly.security;

import com.launchly.auth.entity.User;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotMember;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.validator.BotAccessValidator;
import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IdorSecurityAccessControlTest {

    @Mock
    private BotMemberRepository botMemberRepository;

    @InjectMocks
    private BotAccessValidator botAccessValidator;

    @Test
    @DisplayName("IDOR: User A cannot modify Bot belonging to User B without permissions")
    void validateWriteAccess_UnauthorizedUser_ThrowsForbidden() {
        User victimOwner = new User();
        victimOwner.setId(100L);

        Bot victimBot = new Bot();
        victimBot.setId(1L);
        victimBot.setUser(victimOwner);

        Long attackerUserId = 200L;

        when(botMemberRepository.findWorkspaceMemberships(1L, attackerUserId))
                .thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> botAccessValidator.validateWriteAccess(victimBot, attackerUserId))
                .isInstanceOf(AppException.class)
                .satisfies(e -> {
                    AppException appEx = (AppException) e;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(appEx.getMessage()).isEqualTo("bot.error.access_denied");
                });
    }

    @Test
    @DisplayName("IDOR: Team member with VIEWER role cannot modify Bot")
    void validateWriteAccess_ViewerRole_ThrowsForbidden() {
        User victimOwner = new User();
        victimOwner.setId(100L);

        Bot victimBot = new Bot();
        victimBot.setId(1L);
        victimBot.setUser(victimOwner);

        Long viewerUserId = 300L;

        BotMember viewerMember = new BotMember();
        viewerMember.setRole("Viewer");

        when(botMemberRepository.findWorkspaceMemberships(1L, viewerUserId))
                .thenReturn(List.of(viewerMember));

        assertThatThrownBy(() -> botAccessValidator.validateWriteAccess(victimBot, viewerUserId))
                .isInstanceOf(AppException.class)
                .satisfies(e -> {
                    AppException appEx = (AppException) e;
                    assertThat(appEx.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(appEx.getMessage()).isEqualTo("bot.error.viewer_cannot_modify");
                });
    }

    @Test
    @DisplayName("Access Control: Legit owner has full write access")
    void validateWriteAccess_LegitOwner_Succeeds() {
        User legitOwner = new User();
        legitOwner.setId(100L);

        Bot bot = new Bot();
        bot.setId(1L);
        bot.setUser(legitOwner);

        assertThatCode(() -> botAccessValidator.validateWriteAccess(bot, 100L))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Access Control: Team member with EDITOR role has write access")
    void validateWriteAccess_EditorRole_Succeeds() {
        User owner = new User();
        owner.setId(100L);

        Bot bot = new Bot();
        bot.setId(1L);
        bot.setUser(owner);

        Long editorUserId = 400L;

        BotMember editorMember = new BotMember();
        editorMember.setRole("Editor");

        when(botMemberRepository.findWorkspaceMemberships(1L, editorUserId))
                .thenReturn(List.of(editorMember));

        assertThatCode(() -> botAccessValidator.validateWriteAccess(bot, editorUserId))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("IDOR: Null bot or null user ID throws Forbidden immediately")
    void validateWriteAccess_NullInputs_ThrowsForbidden() {
        assertThatThrownBy(() -> botAccessValidator.validateWriteAccess(null, 100L))
                .isInstanceOf(AppException.class)
                .satisfies(e -> assertThat(((AppException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));

        Bot bot = new Bot();
        assertThatThrownBy(() -> botAccessValidator.validateWriteAccess(bot, null))
                .isInstanceOf(AppException.class)
                .satisfies(e -> assertThat(((AppException) e).getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }
}
