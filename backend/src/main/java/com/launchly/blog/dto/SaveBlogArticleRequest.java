package com.launchly.blog.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Schema(description = "Request payload to create or update a blog article")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaveBlogArticleRequest {

    @Schema(description = "Custom slug / ID (optional, auto-generated from title if blank)", example = "how-to-build-telegram-bot")
    private String id;

    @Schema(description = "Article headline title", example = "How to Build a Telegram Bot with Launchly", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Title is required")
    private String title;

    @Schema(description = "Category taxonomy", example = "Tutorials", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Category is required")
    private String category;

    @Schema(description = "Author name", example = "Launchly Team")
    private String author;

    @Schema(description = "Estimated reading duration", example = "5 min")
    private String readTime;

    @Schema(description = "Publication date string", example = "2026-08-15")
    private String date;

    @Schema(description = "Short preview summary excerpt", example = "A step-by-step guide to automating customer support on Telegram.")
    private String summary;

    @Schema(description = "Cover banner image URL", example = "https://res.cloudinary.com/demo/image/upload/cover.jpg")
    private String coverImage;

    @Schema(description = "Article locale / language code: uk, en", example = "uk")
    private String language;

    @Schema(description = "Article tags list", example = "[\"Telegram\", \"Automation\", \"AI\"]")
    private List<String> tags;

    @Schema(description = "Ordered structured content blocks rendering the article")
    private List<BlogArticleDto.ContentBlockDto> contentBlocks;
}

