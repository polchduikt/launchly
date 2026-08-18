package com.launchly.blog.service.impl;

import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.entity.BlogArticle;
import com.launchly.blog.mapper.BlogMapper;
import com.launchly.blog.repository.BlogArticleRepository;
import com.launchly.blog.service.BlogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlogServiceImpl implements BlogService {

    private final BlogArticleRepository blogArticleRepository;
    private final BlogMapper blogMapper;

    @Override
    @Transactional(readOnly = true)
    public List<BlogArticleDto> getAllArticles(String language) {
        List<BlogArticle> articles;
        if (language != null && !language.isBlank()) {
            articles = blogArticleRepository.findByLanguageIgnoreCase(language.trim());
        } else {
            articles = blogArticleRepository.findAll();
        }
        return blogMapper.toDtoList(articles);
    }

    @Override
    @Transactional(readOnly = true)
    public BlogArticleDto getArticleById(String id) {
        String cleanId = id != null ? id.trim() : "";
        BlogArticle article = blogArticleRepository.findById(cleanId)
                .orElseGet(() -> blogArticleRepository.findAll().stream()
                        .filter(a -> a.getId() != null && a.getId().trim().equalsIgnoreCase(cleanId))
                        .findFirst()
                        .orElse(null));
        return article != null ? blogMapper.toDto(article) : null;
    }
}

