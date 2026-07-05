package com.launchly.blog.service;

import com.launchly.blog.dto.BlogArticleDto;
import java.util.List;

public interface BlogService {
    List<BlogArticleDto> getAllArticles();
    BlogArticleDto getArticleById(String id);
}
