package com.launchly.blog.controller;

import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.service.BlogService;
import com.launchly.common.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "Blog: Public Articles", description = "Public knowledge base, tutorials, and marketing blog articles")
@RestController
@RequestMapping("/api/v1/blog")
@RequiredArgsConstructor
public class BlogController {

    private final BlogService blogService;

    @Operation(summary = "Get all public blog articles", description = "Retrieve list of published blog articles filtered by optional language code.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of blog articles", content = @Content(array = @ArraySchema(schema = @Schema(implementation = BlogArticleDto.class))))
    })
    @GetMapping
    public ResponseEntity<List<BlogArticleDto>> getAllArticles(
            @Parameter(description = "Language locale filter (e.g. uk, en)") @RequestParam(required = false) String lang) {
        return ResponseEntity.ok(blogService.getAllArticles(lang));
    }

    @Operation(summary = "Get blog article by slug / ID", description = "Retrieve full article content with ordered blocks, media, and author details.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Blog article details"),
            @ApiResponse(responseCode = "404", description = "Article not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<BlogArticleDto> getArticleById(
            @Parameter(description = "Article slug identifier") @PathVariable String id) {
        BlogArticleDto article = blogService.getArticleById(id);
        if (article == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(article);
    }
}

