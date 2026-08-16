package com.launchly.blog.controller;

import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.dto.SaveBlogArticleRequest;
import com.launchly.blog.service.AdminBlogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/blog")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminBlogController {

    private final AdminBlogService adminBlogService;

    @GetMapping
    public ResponseEntity<List<BlogArticleDto>> getAllArticles() {
        return ResponseEntity.ok(adminBlogService.getAllArticles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BlogArticleDto> getArticleById(@PathVariable String id) {
        return ResponseEntity.ok(adminBlogService.getArticleById(id));
    }

    @PostMapping
    public ResponseEntity<BlogArticleDto> createArticle(
            @Valid @RequestBody SaveBlogArticleRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(adminBlogService.createArticle(request, email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BlogArticleDto> updateArticle(
            @PathVariable String id,
            @Valid @RequestBody SaveBlogArticleRequest request) {
        return ResponseEntity.ok(adminBlogService.updateArticle(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable String id) {
        adminBlogService.deleteArticle(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteArticleByQuery(@RequestParam(required = false) String id) {
        adminBlogService.deleteArticle(id != null ? id : "");
        return ResponseEntity.noContent().build();
    }
}
