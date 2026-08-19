package com.launchly.blog.mapper;

import com.launchly.blog.dto.BlogArticleDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BlogMapperTest {

    private BlogMapper blogMapper;

    @BeforeEach
    void setUp() {
        blogMapper = Mappers.getMapper(BlogMapper.class);
    }

    @Test
    @DisplayName("Should split comma-separated tags into list")
    void tagsStringToList_Success() {
        List<String> tags = blogMapper.tagsStringToList("Telegram, Marketing, AI Bots");

        assertThat(tags).containsExactly("Telegram", "Marketing", "AI Bots");
    }

    @Test
    @DisplayName("Should return empty list when tags string is null or blank")
    void tagsStringToList_NullOrBlank_ReturnsEmptyList() {
        assertThat(blogMapper.tagsStringToList(null)).isEmpty();
        assertThat(blogMapper.tagsStringToList("   ")).isEmpty();
    }

    @Test
    @DisplayName("Should parse content blocks JSON string to list of ContentBlockDto")
    void jsonToContentBlocks_Success() {
        String json = "[{\"type\":\"paragraph\",\"text\":\"Hello world\"}]";

        List<BlogArticleDto.ContentBlockDto> blocks = blogMapper.jsonToContentBlocks(json);

        assertThat(blocks).hasSize(1);
        assertThat(blocks.get(0).getType()).isEqualTo("paragraph");
        assertThat(blocks.get(0).getText()).isEqualTo("Hello world");
    }

    @Test
    @DisplayName("Should return empty list when content blocks JSON is invalid or null")
    void jsonToContentBlocks_InvalidOrNull_ReturnsEmptyList() {
        assertThat(blogMapper.jsonToContentBlocks(null)).isEmpty();
        assertThat(blogMapper.jsonToContentBlocks("invalid-json")).isEmpty();
    }
}
