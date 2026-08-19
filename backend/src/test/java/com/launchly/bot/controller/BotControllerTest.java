package com.launchly.bot.controller;

import com.launchly.bot.dto.request.BotCreateRequest;
import com.launchly.bot.dto.request.BotUpdateRequest;
import com.launchly.bot.dto.request.FlowSchemaRequest;
import com.launchly.bot.dto.response.BotDetailResponse;
import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.dto.response.FlowSchemaResponse;
import com.launchly.bot.service.BotService;
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
class BotControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private BotService botService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private BotController botController;

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
        mockMvc = MockMvcBuilders.standaloneSetup(botController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/bots - Should return 201 Created for valid bot creation")
    void createBot_ValidRequest_ReturnsCreated() throws Exception {
        BotCreateRequest request = new BotCreateRequest("My Bot", "Description", "123456789:ABCDefghIJklmnOPqrstUVwxyz123456789", null);
        BotResponse mockResponse = mock(BotResponse.class);
        when(mockResponse.id()).thenReturn(10L);
        when(mockResponse.name()).thenReturn("My Bot");

        when(botService.createBot(any(BotCreateRequest.class), eq(1L))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/bots")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.name").value("My Bot"));
    }

    @Test
    @DisplayName("POST /api/v1/bots - Should return 400 Bad Request when name is blank")
    void createBot_BlankName_ReturnsBadRequest() throws Exception {
        BotCreateRequest request = new BotCreateRequest("", "Description", "123456789:ABCDefghIJklmnOPqrstUVwxyz123456789", null);

        mockMvc.perform(post("/api/v1/bots")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/bots - Should return list of user bots with 200 OK")
    void getBots_Success_ReturnsOk() throws Exception {
        BotResponse bot = mock(BotResponse.class);
        when(bot.name()).thenReturn("Sales Bot");
        when(botService.getBotsByUser(1L)).thenReturn(List.of(bot));

        mockMvc.perform(get("/api/v1/bots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Sales Bot"));
    }

    @Test
    @DisplayName("GET /api/v1/bots/{id} - Should return bot detail with 200 OK")
    void getBot_Found_ReturnsOk() throws Exception {
        BotDetailResponse detail = mock(BotDetailResponse.class);
        when(detail.id()).thenReturn(10L);
        when(detail.name()).thenReturn("Sales Bot");
        when(botService.getBotById(10L, 1L)).thenReturn(detail);

        mockMvc.perform(get("/api/v1/bots/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.name").value("Sales Bot"));
    }

    @Test
    @DisplayName("GET /api/v1/bots/{id} - Should return 404 Not Found when bot does not exist")
    void getBot_NotFound_ReturnsNotFound() throws Exception {
        when(botService.getBotById(99L, 1L)).thenThrow(new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found"));

        mockMvc.perform(get("/api/v1/bots/99"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /api/v1/bots/{id} - Should update bot and return 200 OK")
    void updateBot_Success_ReturnsOk() throws Exception {
        BotUpdateRequest request = new BotUpdateRequest("Updated Name", "New Desc", null, null, null, null);
        BotResponse mockResponse = mock(BotResponse.class);
        when(mockResponse.name()).thenReturn("Updated Name");

        when(botService.updateBot(eq(10L), any(BotUpdateRequest.class), eq(1L))).thenReturn(mockResponse);

        mockMvc.perform(put("/api/v1/bots/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Name"));
    }

    @Test
    @DisplayName("DELETE /api/v1/bots/{id} - Should delete bot and return 204 No Content")
    void deleteBot_Success_ReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/bots/10"))
                .andExpect(status().isNoContent());

        verify(botService, times(1)).deleteBot(10L, 1L);
    }

    @Test
    @DisplayName("POST /api/v1/bots/{id}/start - Should start bot and return 200 OK")
    void startBot_Success_ReturnsOk() throws Exception {
        BotResponse mockResponse = mock(BotResponse.class);
        when(mockResponse.active()).thenReturn(true);
        when(botService.startBot(10L, 1L)).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/bots/10/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/bots/{id}/stop - Should stop bot and return 200 OK")
    void stopBot_Success_ReturnsOk() throws Exception {
        BotResponse mockResponse = mock(BotResponse.class);
        when(mockResponse.active()).thenReturn(false);
        when(botService.stopBot(10L, 1L)).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/bots/10/stop"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    @DisplayName("GET /api/v1/bots/{id}/schema - Should return flow schema with 200 OK")
    void getFlowSchema_Success_ReturnsOk() throws Exception {
        FlowSchemaResponse schema = mock(FlowSchemaResponse.class);
        when(schema.id()).thenReturn(10L);
        when(botService.getFlowSchema(10L, 1L)).thenReturn(schema);

        mockMvc.perform(get("/api/v1/bots/10/schema"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L));
    }

    @Test
    @DisplayName("PUT /api/v1/bots/{id}/schema - Should save flow schema and return 200 OK")
    void saveFlowSchema_Success_ReturnsOk() throws Exception {
        FlowSchemaRequest request = new FlowSchemaRequest(List.of(), List.of());
        FlowSchemaResponse schema = mock(FlowSchemaResponse.class);
        when(schema.id()).thenReturn(10L);
        when(botService.saveFlowSchema(eq(10L), any(FlowSchemaRequest.class), eq(1L))).thenReturn(schema);

        mockMvc.perform(put("/api/v1/bots/10/schema")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L));
    }
}
