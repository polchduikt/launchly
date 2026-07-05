package com.launchly.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogArticleDto {
    private String id;
    private String title;
    private String category;
    private String author;
    private String readTime;
    private String date;
    private String summary;
    private String coverImage;
    private List<String> tags;
    private List<ContentBlockDto> contentBlocks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContentBlockDto {
        private String type;
        private String text;
        private Integer level;
        private String author;
        private List<String> items;
        private String url;
        private String caption;
    }
}
