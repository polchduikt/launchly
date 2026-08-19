package com.launchly.blog.service.impl;

import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.dto.SaveBlogArticleRequest;
import com.launchly.blog.entity.BlogArticle;
import com.launchly.blog.mapper.BlogMapper;
import com.launchly.blog.repository.BlogArticleRepository;
import com.launchly.common.utils.MessageUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminBlogServiceImplTest {

    @Mock
    private BlogArticleRepository blogArticleRepository;

    @Mock
    private com.launchly.auth.service.UserQueryService userQueryService;

    @Mock
    private BlogMapper blogMapper;

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private AdminBlogServiceImpl adminBlogService;

    private BlogArticle testArticle;
    private BlogArticleDto mockDto;

    @BeforeEach
    void setUp() {
        testArticle = BlogArticle.builder()
                .id("how-to-scale-bot")
                .title("How to Scale Bot")
                .language("en")
                .build();

        mockDto = mock(BlogArticleDto.class);
    }

    @Test
    @DisplayName("Should successfully create a new blog article")
    void createArticle_Success() {
        SaveBlogArticleRequest request = SaveBlogArticleRequest.builder()
                .id("how-to-scale-bot")
                .title("How to Scale Bot")
                .summary("Scaling guide")
                .category("Guides")
                .language("en")
                .author("Admin")
                .contentBlocks(List.of())
                .build();

        when(blogArticleRepository.existsById("how-to-scale-bot")).thenReturn(false);
        when(blogArticleRepository.save(any(BlogArticle.class))).thenReturn(testArticle);
        when(blogMapper.toDto(any(BlogArticle.class))).thenReturn(mockDto);

        BlogArticleDto result = adminBlogService.createArticle(request, "admin@launchly.pro");

        assertThat(result).isNotNull();
        verify(blogArticleRepository, times(1)).save(any(BlogArticle.class));
    }

    @Test
    @DisplayName("Should delete blog article by ID")
    void deleteArticle_Success() {
        when(blogArticleRepository.findById("how-to-scale-bot")).thenReturn(Optional.of(testArticle));

        adminBlogService.deleteArticle("how-to-scale-bot");

        verify(blogArticleRepository, times(1)).delete(testArticle);
    }
}
