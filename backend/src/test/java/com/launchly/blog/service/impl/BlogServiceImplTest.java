package com.launchly.blog.service.impl;

import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.entity.BlogArticle;
import com.launchly.blog.mapper.BlogMapper;
import com.launchly.blog.repository.BlogArticleRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BlogServiceImplTest {

    @Mock
    private BlogArticleRepository blogArticleRepository;

    @Mock
    private BlogMapper blogMapper;

    @InjectMocks
    private BlogServiceImpl blogService;

    private BlogArticle testArticle;
    private BlogArticleDto mockDto;

    @BeforeEach
    void setUp() {
        testArticle = BlogArticle.builder()
                .id("telegram-bot-guide")
                .title("Telegram Bot Guide")
                .language("en")
                .build();

        mockDto = mock(BlogArticleDto.class);
    }

    @Test
    @DisplayName("Should return all articles filtered by language")
    void getAllArticles_WithLanguage_ReturnsFiltered() {
        when(blogArticleRepository.findByLanguageIgnoreCase("en")).thenReturn(List.of(testArticle));
        when(blogMapper.toDtoList(List.of(testArticle))).thenReturn(List.of(mockDto));

        List<BlogArticleDto> articles = blogService.getAllArticles("en");

        assertThat(articles).hasSize(1);
    }

    @Test
    @DisplayName("Should return article by ID")
    void getArticleById_WhenExists_ReturnsDto() {
        when(blogArticleRepository.findById("telegram-bot-guide")).thenReturn(Optional.of(testArticle));
        when(blogMapper.toDto(testArticle)).thenReturn(mockDto);

        BlogArticleDto result = blogService.getArticleById("telegram-bot-guide");

        assertThat(result).isNotNull();
    }
}
