package com.launchly.blog.controller;

import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.dto.SaveBlogArticleRequest;
import com.launchly.blog.service.AdminBlogService;
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
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminBlogControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @Mock
    private AdminBlogService adminBlogService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private AdminBlogController adminBlogController;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        UserDetails userDetails = new User("admin@launchly.pro", "password", Collections.emptyList());

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
        mockMvc = MockMvcBuilders.standaloneSetup(adminBlogController)
                .setCustomArgumentResolvers(authResolver)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/admin/blog - Should return all articles")
    void getAllArticles_Success() throws Exception {
        BlogArticleDto article = mock(BlogArticleDto.class);
        when(article.getTitle()).thenReturn("Admin Article");
        when(adminBlogService.getAllArticles()).thenReturn(List.of(article));

        mockMvc.perform(get("/api/v1/admin/blog"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Admin Article"));
    }

    @Test
    @DisplayName("POST /api/v1/admin/blog - Should create article and return 201 Created")
    void createArticle_Success() throws Exception {
        SaveBlogArticleRequest request = SaveBlogArticleRequest.builder()
                .title("New Post")
                .category("Tutorials")
                .build();
        BlogArticleDto article = mock(BlogArticleDto.class);
        when(article.getTitle()).thenReturn("New Post");
        when(adminBlogService.createArticle(any(SaveBlogArticleRequest.class), any())).thenReturn(article);

        mockMvc.perform(post("/api/v1/admin/blog")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("New Post"));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/blog/{id} - Should delete article")
    void deleteArticle_Success() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/blog/article-slug"))
                .andExpect(status().isNoContent());

        verify(adminBlogService, times(1)).deleteArticle("article-slug");
    }
}
