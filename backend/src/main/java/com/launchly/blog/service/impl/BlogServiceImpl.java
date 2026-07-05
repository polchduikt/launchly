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
    public List<BlogArticleDto> getAllArticles() {
        return blogArticleRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BlogArticleDto getArticleById(String id) {
        return blogArticleRepository.findById(id)
                .map(this::mapToDto)
                .orElse(null);
    }

    private BlogArticleDto mapToDto(BlogArticle entity) {
        try {
            List<BlogArticleDto.ContentBlockDto> blocks = objectMapper.readValue(
                    entity.getContentBlocks(),
                    new TypeReference<List<BlogArticleDto.ContentBlockDto>>() {}
            );

            List<String> tagsList = entity.getTags() != null 
                    ? Arrays.asList(entity.getTags().split(","))
                    : Arrays.asList();

            return BlogArticleDto.builder()
                    .id(entity.getId())
                    .title(entity.getTitle())
                    .category(entity.getCategory())
                    .author(entity.getAuthor())
                    .readTime(entity.getReadTime())
                    .date(entity.getDatePublished())
                    .summary(entity.getSummary())
                    .coverImage(entity.getCoverImage())
                    .tags(tagsList)
                    .contentBlocks(blocks)
                    .build();
        } catch (Exception e) {
            log.error("Failed to deserialize content blocks for article {}", entity.getId(), e);
            throw new RuntimeException("Deserialization failure", e);
        }
    }
}
