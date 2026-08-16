package com.launchly.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveBlogArticleRequest {

    private String id;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Category is required")
    private String category;

    private String author;

    private String readTime;

    private String date;

    private String summary;

    private String coverImage;

    private String language;

    private List<String> tags;

    private List<BlogArticleDto.ContentBlockDto> contentBlocks;
}
