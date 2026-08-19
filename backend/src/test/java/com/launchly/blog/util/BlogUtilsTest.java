package com.launchly.blog.util;

import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.dto.SaveBlogArticleRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BlogUtilsTest {

    @Test
    @DisplayName("Should return default reading time for null request")
    void calculateReadTime_WhenNullRequest_ReturnsDefault() {
        assertThat(BlogUtils.calculateReadTime(null)).isEqualTo("1 хв");
    }

    @Test
    @DisplayName("Should correctly calculate minutes for Ukrainian locale")
    void calculateReadTime_UkrainianLocale_ReturnsMinutesInUkr() {
        SaveBlogArticleRequest request = SaveBlogArticleRequest.builder()
                .language("uk")
                .summary("Короткий опис статті")
                .contentBlocks(List.of(
                        BlogArticleDto.ContentBlockDto.builder()
                                .type("paragraph")
                                .text("Це тестовий параграф для перевірки розрахунку часу читання публікації в блозі.")
                                .build()
                ))
                .build();

        String readTime = BlogUtils.calculateReadTime(request);
        assertThat(readTime).isEqualTo("1 хв");
    }

    @Test
    @DisplayName("Should format suffix with 'min' for English locale")
    void calculateReadTime_EnglishLocale_ReturnsMinutesInEng() {
        SaveBlogArticleRequest request = SaveBlogArticleRequest.builder()
                .language("en")
                .summary("Short summary of article")
                .contentBlocks(List.of(
                        BlogArticleDto.ContentBlockDto.builder()
                                .type("paragraph")
                                .text("This is an English paragraph to verify the reading time calculation.")
                                .build()
                ))
                .build();

        String readTime = BlogUtils.calculateReadTime(request);
        assertThat(readTime).isEqualTo("1 min");
    }

    @Test
    @DisplayName("Should count words inside list content blocks")
    void calculateReadTime_WithListItems_CountsAllWords() {
        List<String> items = List.of("First item", "Second item", "Third list item");
        BlogArticleDto.ContentBlockDto block = BlogArticleDto.ContentBlockDto.builder()
                .type("list")
                .items(items)
                .build();

        String readTime = BlogUtils.calculateReadTime("Summary", List.of(block), "en");
        assertThat(readTime).isEqualTo("1 min");
    }

}
