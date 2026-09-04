package com.launchly.ai.controller;

import com.launchly.ai.dto.request.AiChatRequest;
import com.launchly.ai.dto.request.AiSchemaRequest;
import com.launchly.ai.dto.response.AiChatResponse;
import com.launchly.ai.dto.response.AiChatSessionDetailResponse;
import com.launchly.ai.dto.response.AiChatSessionResponse;
import com.launchly.ai.dto.response.AiSchemaResponse;
import com.launchly.ai.service.AiService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AiControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AiService aiService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private AiController aiController;

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
        mockMvc = MockMvcBuilders.standaloneSetup(aiController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/ai/sessions - Should return user sessions list")
    void getSessions_Success() throws Exception {
        when(aiService.getSessions(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/ai/sessions"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/v1/ai/sessions - Should create new session 201 Created")
    void createSession_Success() throws Exception {
        AiChatSessionResponse res = new AiChatSessionResponse(1L, "New chat", null, null, null);
        when(aiService.createSession(any(), eq(1L))).thenReturn(res);

        mockMvc.perform(post("/api/v1/ai/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    @DisplayName("GET /api/v1/ai/sessions/{id} - Should return session details")
    void getSessionDetails_Success() throws Exception {
        AiChatSessionDetailResponse res = new AiChatSessionDetailResponse(1L, "New chat", null, null, List.of());
        when(aiService.getSessionDetails(eq(1L), eq(1L))).thenReturn(res);

        mockMvc.perform(get("/api/v1/ai/sessions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    @DisplayName("PATCH /api/v1/ai/sessions/{id} - Should update session title")
    void updateSessionTitle_Success() throws Exception {
        AiChatSessionResponse res = new AiChatSessionResponse(1L, "Updated title", null, null, null);
        when(aiService.updateSessionTitle(eq(1L), any(), eq(1L))).thenReturn(res);

        mockMvc.perform(patch("/api/v1/ai/sessions/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Updated title\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated title"));
    }

    @Test
    @DisplayName("DELETE /api/v1/ai/sessions/{id} - Should delete session 204 No Content")
    void deleteSession_Success() throws Exception {
        doNothing().when(aiService).deleteSession(eq(1L), eq(1L));

        mockMvc.perform(delete("/api/v1/ai/sessions/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("POST /api/v1/ai/chat - Should generate chat reply 200 OK")
    void chat_Success() throws Exception {
        AiChatRequest request = new AiChatRequest("How to connect telegram bot?", List.of());
        AiChatResponse response = new AiChatResponse("Use @BotFather to get token", null);
        when(aiService.chat(any(AiChatRequest.class), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/api/v1/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("Use @BotFather to get token"));
    }

    @Test
    @DisplayName("POST /api/v1/ai/chat - Should return 400 Bad Request when message is blank")
    void chat_BlankMessage_ReturnsBadRequest() throws Exception {
        AiChatRequest request = new AiChatRequest("", List.of());

        mockMvc.perform(post("/api/v1/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/ai/generate-schema - Should generate schema 200 OK")
    void generateSchema_Success() throws Exception {
        AiSchemaRequest request = new AiSchemaRequest("E-commerce pizza ordering bot", List.of());
        AiSchemaResponse response = mock(AiSchemaResponse.class);
        when(aiService.generateSchema(any(AiSchemaRequest.class), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/api/v1/ai/generate-schema")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
