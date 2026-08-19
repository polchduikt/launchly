package com.launchly.blog.controller;

import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.dto.SaveBlogArticleRequest;
import com.launchly.blog.service.AdminBlogService;
import com.launchly.common.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "Admin: Blog Content Management", description = "Administrative publishing, editing, and management of blog articles")
@RestController
@RequestMapping("/api/v1/admin/blog")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminBlogController {

    private final AdminBlogService adminBlogService;

    @Operation(summary = "Get all articles (Admin)", description = "Retrieve all blog articles across all languages.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of blog articles", content = @Content(array = @ArraySchema(schema = @Schema(implementation = BlogArticleDto.class)))),
            @ApiResponse(responseCode = "403", description = "Forbidden / Admin role required", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<BlogArticleDto>> getAllArticles() {
        return ResponseEntity.ok(adminBlogService.getAllArticles());
    }

    @Operation(summary = "Get article by slug (Admin)", description = "Retrieve article details for editing.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Blog article details"),
            @ApiResponse(responseCode = "404", description = "Article not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<BlogArticleDto> getArticleById(
            @Parameter(description = "Article slug identifier") @PathVariable String id) {
        return ResponseEntity.ok(adminBlogService.getArticleById(id));
    }

    @Operation(summary = "Create blog article", description = "Publish a new blog article with title, categories, tags, and structured blocks.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Article published successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<BlogArticleDto> createArticle(
            @Valid @RequestBody SaveBlogArticleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(adminBlogService.createArticle(request, email));
    }

    @Operation(summary = "Update blog article", description = "Save edits to existing blog article metadata and blocks.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Article updated successfully"),
            @ApiResponse(responseCode = "404", description = "Article not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}")
    public ResponseEntity<BlogArticleDto> updateArticle(
            @Parameter(description = "Article slug identifier") @PathVariable String id,
            @Valid @RequestBody SaveBlogArticleRequest request) {
        return ResponseEntity.ok(adminBlogService.updateArticle(id, request));
    }

    @Operation(summary = "Delete blog article by path", description = "Remove a blog article permanently.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Article deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Article not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(
            @Parameter(description = "Article slug identifier") @PathVariable String id) {
        adminBlogService.deleteArticle(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Delete blog article by query param", description = "Remove a blog article using optional ID query parameter.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Article deleted successfully")
    })
    @DeleteMapping
    public ResponseEntity<Void> deleteArticleByQuery(
            @Parameter(description = "Article slug identifier") @RequestParam(required = false) String id) {
        adminBlogService.deleteArticle(id != null ? id : "");
        return ResponseEntity.noContent().build();
    }
}

