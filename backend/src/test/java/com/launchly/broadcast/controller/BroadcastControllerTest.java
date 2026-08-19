package com.launchly.broadcast.controller;

import com.launchly.broadcast.dto.request.CreateCampaignRequest;
import com.launchly.broadcast.dto.request.CreateTagRequest;
import com.launchly.broadcast.dto.response.CampaignResponse;
import com.launchly.broadcast.dto.response.TagResponse;
import com.launchly.broadcast.entity.FilterType;
import com.launchly.broadcast.service.BroadcastService;
import com.launchly.broadcast.service.TagService;
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
class BroadcastControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private TagService tagService;

    @Mock
    private BroadcastService broadcastService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private BroadcastController broadcastController;

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
        mockMvc = MockMvcBuilders.standaloneSetup(broadcastController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/broadcast/bots/{botId}/tags - Should return bot tags list")
    void getTags_Success() throws Exception {
        TagResponse tag = new TagResponse(10L, "VIP", 5L, null);
        when(tagService.getTagsByBot(10L, 1L)).thenReturn(List.of(tag));

        mockMvc.perform(get("/api/v1/broadcast/bots/10/tags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("VIP"));
    }

    @Test
    @DisplayName("POST /api/v1/broadcast/bots/{botId}/tags - Should create tag and return 201 Created")
    void createTag_Success() throws Exception {
        CreateTagRequest request = new CreateTagRequest("NEW_LEAD");
        TagResponse tag = new TagResponse(11L, "NEW_LEAD", 0L, null);
        when(tagService.createTag(eq(10L), eq(1L), any(CreateTagRequest.class))).thenReturn(tag);

        mockMvc.perform(post("/api/v1/broadcast/bots/10/tags")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("NEW_LEAD"));
    }

    @Test
    @DisplayName("POST /api/v1/broadcast/bots/{botId}/tags - Should return 400 Bad Request when tag name is blank")
    void createTag_BlankName_ReturnsBadRequest() throws Exception {
        CreateTagRequest request = new CreateTagRequest("");

        mockMvc.perform(post("/api/v1/broadcast/bots/10/tags")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/v1/broadcast/bots/{botId}/tags/{tagId} - Should delete tag and return 204 No Content")
    void deleteTag_Success() throws Exception {
        mockMvc.perform(delete("/api/v1/broadcast/bots/10/tags/5"))
                .andExpect(status().isNoContent());

        verify(tagService, times(1)).deleteTag(5L, 1L);
    }

    @Test
    @DisplayName("GET /api/v1/broadcast/bots/{botId}/campaigns - Should return campaigns list")
    void getCampaigns_Success() throws Exception {
        CampaignResponse campaign = mock(CampaignResponse.class);
        when(campaign.name()).thenReturn("Summer Promo");
        when(broadcastService.getCampaigns(10L, 1L)).thenReturn(List.of(campaign));

        mockMvc.perform(get("/api/v1/broadcast/bots/10/campaigns"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Summer Promo"));
    }

    @Test
    @DisplayName("POST /api/v1/broadcast/bots/{botId}/campaigns - Should create campaign and return 201 Created")
    void createCampaign_Success() throws Exception {
        CreateCampaignRequest request = new CreateCampaignRequest("Promo", "Hello", FilterType.ALL, null, null, null, null, 10L, false);
        CampaignResponse response = mock(CampaignResponse.class);
        when(response.name()).thenReturn("Promo");
        when(broadcastService.createCampaign(eq(10L), eq(1L), any(CreateCampaignRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/broadcast/bots/10/campaigns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Promo"));
    }

    @Test
    @DisplayName("POST /api/v1/broadcast/bots/{botId}/campaigns - Should return 400 Bad Request when campaign name is blank")
    void createCampaign_BlankName_ReturnsBadRequest() throws Exception {
        CreateCampaignRequest request = new CreateCampaignRequest("", "Hello", FilterType.ALL, null, null, null, null, 10L, false);

        mockMvc.perform(post("/api/v1/broadcast/bots/10/campaigns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/broadcast/bots/{botId}/campaigns/{campaignId}/send - Should trigger send now")
    void sendCampaign_Success() throws Exception {
        CampaignResponse response = mock(CampaignResponse.class);
        when(broadcastService.sendNow(20L, 1L)).thenReturn(response);

        mockMvc.perform(post("/api/v1/broadcast/bots/10/campaigns/20/send"))
                .andExpect(status().isOk());

        verify(broadcastService, times(1)).sendNow(20L, 1L);
    }

    @Test
    @DisplayName("DELETE /api/v1/broadcast/bots/{botId}/campaigns/{campaignId} - Should delete campaign and return 204 No Content")
    void deleteCampaign_Success() throws Exception {
        mockMvc.perform(delete("/api/v1/broadcast/bots/10/campaigns/20"))
                .andExpect(status().isNoContent());

        verify(broadcastService, times(1)).deleteCampaign(20L, 1L);
    }
}
