package com.launchly.support.controller;

import com.launchly.admin.dto.SupportTicketDto;
import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.utils.MessageUtils;
import com.launchly.support.dto.CreateTicketRequest;
import com.launchly.support.service.UserSupportChatService;
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
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserSupportChatControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private UserSupportChatService chatService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private UserSupportChatController chatController;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        UserDetails userDetails = new User("user@launchly.pro", "password", Collections.emptyList());

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
        mockMvc = MockMvcBuilders.standaloneSetup(chatController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/support/tickets - Should return user support tickets")
    void getUserTickets_Success() throws Exception {
        Page<SupportTicketDto> page = new PageImpl<>(List.of(new SupportTicketDto()), org.springframework.data.domain.PageRequest.of(0, 50), 1);
        when(chatService.getUserTickets("user@launchly.pro", 0, 50)).thenReturn(page);

        mockMvc.perform(get("/api/v1/support/tickets"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/v1/support/tickets - Should create ticket")
    void createTicket_Success() throws Exception {
        CreateTicketRequest request = new CreateTicketRequest("Payment Issue", "Cannot checkout");
        SupportTicketDto dto = new SupportTicketDto();
        when(chatService.createTicket(any(CreateTicketRequest.class), eq("user@launchly.pro"))).thenReturn(dto);

        mockMvc.perform(post("/api/v1/support/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
