package com.launchly.blog.controller;

import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.service.BlogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/blog")
@RequiredArgsConstructor
public class BlogController {

    private final BlogService blogService;

    @GetMapping
    public ResponseEntity<List<BlogArticleDto>> getAllArticles(@RequestParam(required = false) String lang) {
        return ResponseEntity.ok(blogService.getAllArticles(lang));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BlogArticleDto> getArticleById(@PathVariable String id) {
        BlogArticleDto article = blogService.getArticleById(id);
        if (article == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(article);
    }
}
