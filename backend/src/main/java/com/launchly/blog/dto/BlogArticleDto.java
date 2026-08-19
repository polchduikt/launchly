package com.launchly.blog.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Schema(description = "Blog article public content model")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogArticleDto {
    @Schema(description = "Article unique slug / ID", example = "how-to-build-telegram-bot")
    private String id;

    @Schema(description = "Article headline title", example = "How to Build a Telegram Bot with Launchly")
    private String title;

    @Schema(description = "Category taxonomy", example = "Tutorials")
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
    private List<ContentBlockDto> contentBlocks;

    @Schema(description = "Structured content block element within an article")
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContentBlockDto {
        @Schema(description = "Block type: paragraph, heading, quote, list, image, callout", example = "paragraph")
        private String type;

        @Schema(description = "Block text body")
        private String text;

        @Schema(description = "Heading level if type is heading (e.g. 2, 3)", example = "2")
        private Integer level;

        @Schema(description = "Quote author if type is quote")
        private String author;

        @Schema(description = "List bullet items if type is list")
        private List<String> items;

        @Schema(description = "Image URL if type is image")
        private String url;

        @Schema(description = "Image caption if type is image")
        private String caption;
    }
}

