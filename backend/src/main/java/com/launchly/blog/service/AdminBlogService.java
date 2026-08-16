package com.launchly.blog.service;

import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.dto.SaveBlogArticleRequest;
import java.util.List;

public interface AdminBlogService {

    List<BlogArticleDto> getAllArticles();

    BlogArticleDto getArticleById(String id);

    BlogArticleDto createArticle(SaveBlogArticleRequest request, String currentUserEmail);

    BlogArticleDto updateArticle(String id, SaveBlogArticleRequest request);

    void deleteArticle(String id);
}
