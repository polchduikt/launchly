package com.launchly.bot.service.impl;

import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.bot.dto.response.TeamMemberResponse;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotMember;
import com.launchly.bot.repository.BotInvitationRepository;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamServiceImplTest {

    @Mock
    private BotRepository botRepository;

    @Mock
    private BotMemberRepository botMemberRepository;

    @Mock
    private BotInvitationRepository botInvitationRepository;

    @InjectMocks
    private TeamServiceImpl teamService;

    private User owner;
    private User memberUser;
    private Bot testBot;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .email("owner@test.com")
                .name("Owner")
                .role(Role.ROLE_OWNER)
                .build();
        ReflectionTestUtils.setField(owner, "id", 1L);

        memberUser = User.builder()
                .email("member@test.com")
                .name("Member")
                .role(Role.ROLE_OWNER)
                .build();
        ReflectionTestUtils.setField(memberUser, "id", 2L);

        testBot = Bot.builder()
                .name("Test Bot")
                .user(owner)
                .build();
        ReflectionTestUtils.setField(testBot, "id", 10L);
    }

    @Test
    @DisplayName("Should return team members for bot owner")
    void getTeamMembers_WhenOwner_ReturnsList() {
        when(botRepository.findById(10L)).thenReturn(Optional.of(testBot));

        BotMember member = BotMember.builder()
                .bot(testBot)
                .user(memberUser)
                .role("Editor")
                .build();
        ReflectionTestUtils.setField(member, "id", 100L);

        when(botMemberRepository.findByBotOwnerId(1L)).thenReturn(List.of(member));
        when(botInvitationRepository.findByBotOwnerId(1L)).thenReturn(Collections.emptyList());

        List<TeamMemberResponse> team = teamService.getTeamMembers(10L, 1L);

        assertThat(team).isNotEmpty();
        assertThat(team.get(0).email()).isEqualTo("owner@test.com");
    }

    @Test
    @DisplayName("Should throw forbidden exception when non-member requests team list")
    void getTeamMembers_WhenUnauthorized_ThrowsForbidden() {
        when(botRepository.findById(10L)).thenReturn(Optional.of(testBot));
        when(botMemberRepository.existsByBotOwnerIdAndUserId(1L, 99L)).thenReturn(false);

        assertThatThrownBy(() -> teamService.getTeamMembers(10L, 99L))
                .isInstanceOf(AppException.class);
    }
}
