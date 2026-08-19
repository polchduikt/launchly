package com.launchly.bot.controller;

import com.launchly.bot.dto.request.InviteMemberRequest;
import com.launchly.bot.dto.response.TeamMemberResponse;
import com.launchly.bot.service.TeamService;
import com.launchly.common.exception.AppException;
import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.security.CustomUserDetails;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TeamControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private TeamService teamService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private TeamController teamController;

    private CustomUserDetails mockUserDetails;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockUserDetails = mock(CustomUserDetails.class);
        lenient().when(mockUserDetails.getId()).thenReturn(1L);

        HandlerMethodArgumentResolver authResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                        || CustomUserDetails.class.isAssignableFrom(parameter.getParameterType());
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return mockUserDetails;
            }
        };

        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(teamController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/bots/{botId}/members - Should return team members list with 200 OK")
    void getTeamMembers_Success() throws Exception {
        TeamMemberResponse member = mock(TeamMemberResponse.class);
        when(member.email()).thenReturn("colleague@launchly.pro");
        when(member.role()).thenReturn("EDITOR");
        when(teamService.getTeamMembers(10L, 1L)).thenReturn(List.of(member));

        mockMvc.perform(get("/api/v1/bots/10/members"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("colleague@launchly.pro"))
                .andExpect(jsonPath("$[0].role").value("EDITOR"));
    }

    @Test
    @DisplayName("POST /api/v1/bots/{botId}/invitations - Should invite member and return 200 OK")
    void inviteMember_Success() throws Exception {
        InviteMemberRequest request = new InviteMemberRequest("newbie@launchly.pro", "EDITOR", true, false);
        TeamMemberResponse response = mock(TeamMemberResponse.class);
        when(response.email()).thenReturn("newbie@launchly.pro");
        when(teamService.inviteMember(eq(10L), any(InviteMemberRequest.class), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/api/v1/bots/10/invitations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("newbie@launchly.pro"));
    }

    @Test
    @DisplayName("POST /api/v1/bots/{botId}/invitations - Should return 400 Bad Request when email is invalid")
    void inviteMember_InvalidEmail_ReturnsBadRequest() throws Exception {
        InviteMemberRequest request = new InviteMemberRequest("invalid-email", "EDITOR", true, false);

        mockMvc.perform(post("/api/v1/bots/10/invitations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/v1/bots/{botId}/members/{memberId} - Should remove member and return 204 No Content")
    void removeMember_Success() throws Exception {
        mockMvc.perform(delete("/api/v1/bots/10/members/5"))
                .andExpect(status().isNoContent());

        verify(teamService, times(1)).removeMember(10L, 5L, 1L);
    }
}
