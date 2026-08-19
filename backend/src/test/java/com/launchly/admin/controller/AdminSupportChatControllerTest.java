package com.launchly.admin.controller;

import com.launchly.admin.dto.CreateMessageRequest;
import com.launchly.admin.dto.SupportMessageDto;
import com.launchly.admin.dto.SupportTicketDto;
import com.launchly.admin.service.AdminSupportChatService;
import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import tools.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminSupportChatControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AdminSupportChatService adminSupportChatService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private AdminSupportChatController adminSupportChatController;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        UserDetails userDetails = new User("manager@launchly.pro", "password", Collections.emptyList());

        HandlerMethodArgumentResolver authResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                        || UserDetails.class.isAssignableFrom(parameter.getParameterType());
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return userDetails;
            }
        };

        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(adminSupportChatController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/support-chats - Should return support tickets page")
    void getTickets_Success() throws Exception {
        Page<SupportTicketDto> page = new PageImpl<>(List.of(new SupportTicketDto()), PageRequest.of(0, 50), 1);
        when(adminSupportChatService.getSupportTickets(eq("all"), eq("all"), any(), eq(0), eq(50))).thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/support-chats"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/v1/admin/support-chats/{id} - Should return ticket detail")
    void getTicketDetail_Success() throws Exception {
        SupportTicketDto dto = new SupportTicketDto();
        when(adminSupportChatService.getSupportTicketDetail(7L)).thenReturn(dto);

        mockMvc.perform(get("/api/v1/admin/support-chats/7"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/v1/admin/support-chats/{id}/messages - Should send message in support ticket")
    void sendMessage_Success() throws Exception {
        CreateMessageRequest request = new CreateMessageRequest("We are investigating this issue.");
        SupportMessageDto dto = new SupportMessageDto();
        when(adminSupportChatService.addMessage(eq(7L), eq("We are investigating this issue."), eq("manager@launchly.pro"))).thenReturn(dto);

        mockMvc.perform(post("/api/v1/admin/support-chats/7/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
