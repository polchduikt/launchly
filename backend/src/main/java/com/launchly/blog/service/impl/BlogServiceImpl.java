package com.launchly.blog.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.entity.BlogArticle;
import com.launchly.blog.repository.BlogArticleRepository;
import com.launchly.blog.service.BlogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlogServiceImpl implements BlogService {

    private final BlogArticleRepository blogArticleRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional(readOnly = true)
    public List<BlogArticleDto> getAllArticles(String language) {
        List<BlogArticle> articles;
        if (language != null && !language.isBlank()) {
            articles = blogArticleRepository.findByLanguageIgnoreCase(language.trim());
        } else {
            articles = blogArticleRepository.findAll();
        }
        return articles.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BlogArticleDto getArticleById(String id) {
        String cleanId = id != null ? id.trim() : "";
        return blogArticleRepository.findById(cleanId)
                .orElseGet(() -> blogArticleRepository.findAll().stream()
                        .filter(a -> a.getId() != null && a.getId().trim().equalsIgnoreCase(cleanId))
                        .findFirst()
                        .orElse(null))
                != null ? mapToDto(blogArticleRepository.findById(cleanId)
                .orElseGet(() -> blogArticleRepository.findAll().stream()
                        .filter(a -> a.getId() != null && a.getId().trim().equalsIgnoreCase(cleanId))
                        .findFirst()
                        .orElse(null))) : null;
    }

    private BlogArticleDto mapToDto(BlogArticle entity) {
        try {
            List<BlogArticleDto.ContentBlockDto> blocks = (entity.getContentBlocks() != null && !entity.getContentBlocks().isBlank())
                    ? objectMapper.readValue(entity.getContentBlocks(), new TypeReference<List<BlogArticleDto.ContentBlockDto>>() {})
                    : new ArrayList<>();

            List<String> tagsList = (entity.getTags() != null && !entity.getTags().isBlank())
                    ? Arrays.stream(entity.getTags().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList())
                    : new ArrayList<>();

            return BlogArticleDto.builder()
                    .id(entity.getId())
                    .title(entity.getTitle())
                    .category(entity.getCategory())
                    .author(entity.getAuthor())
                    .readTime(entity.getReadTime())
                    .date(entity.getDatePublished())
                    .summary(entity.getSummary())
                    .coverImage(entity.getCoverImage())
                    .language(entity.getLanguage() != null ? entity.getLanguage() : "uk")
                    .tags(tagsList)
                    .contentBlocks(blocks)
                    .build();
        } catch (Exception e) {
            log.error("Failed to deserialize content blocks for article {}", entity.getId(), e);
            return BlogArticleDto.builder()
                    .id(entity.getId())
                    .title(entity.getTitle())
                    .category(entity.getCategory())
                    .author(entity.getAuthor())
                    .readTime(entity.getReadTime())
                    .date(entity.getDatePublished())
                    .summary(entity.getSummary())
                    .coverImage(entity.getCoverImage())
                    .language(entity.getLanguage() != null ? entity.getLanguage() : "uk")
                    .tags(new ArrayList<>())
                    .contentBlocks(new ArrayList<>())
                    .build();
        }
    }
}
