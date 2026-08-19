package com.launchly.blog.controller;

import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.service.BlogService;
import com.launchly.common.exception.GlobalExceptionHandler;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class BlogControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BlogService blogService;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private BlogController blogController;

    @BeforeEach
    void setUp() {
        GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler(messageUtils);
        mockMvc = MockMvcBuilders.standaloneSetup(blogController)
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/blog - Should return all articles")
    void getAllArticles_Success() throws Exception {
        BlogArticleDto article = mock(BlogArticleDto.class);
        when(article.getTitle()).thenReturn("Telegram Automation Guide");
        when(blogService.getAllArticles("en")).thenReturn(List.of(article));

        mockMvc.perform(get("/api/v1/blog").param("lang", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Telegram Automation Guide"));
    }

    @Test
    @DisplayName("GET /api/v1/blog/{id} - Should return article by slug")
    void getArticleById_Success() throws Exception {
        BlogArticleDto article = mock(BlogArticleDto.class);
        when(article.getTitle()).thenReturn("Telegram Automation Guide");
        when(blogService.getArticleById("telegram-guide")).thenReturn(article);

        mockMvc.perform(get("/api/v1/blog/telegram-guide"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Telegram Automation Guide"));
    }

    @Test
    @DisplayName("GET /api/v1/blog/{id} - Should return 404 Not Found when article does not exist")
    void getArticleById_NotFound() throws Exception {
        when(blogService.getArticleById("non-existent")).thenReturn(null);

        mockMvc.perform(get("/api/v1/blog/non-existent"))
                .andExpect(status().isNotFound());
    }
}
