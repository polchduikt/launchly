package com.launchly.blog.service.impl;

import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.dto.SaveBlogArticleRequest;
import com.launchly.blog.entity.BlogArticle;
import com.launchly.blog.mapper.BlogMapper;
import com.launchly.blog.repository.BlogArticleRepository;
import com.launchly.blog.service.AdminBlogService;
import com.launchly.blog.util.BlogUtils;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.JsonUtils;
import com.launchly.common.utils.MessageUtils;
import com.launchly.common.utils.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminBlogServiceImpl implements AdminBlogService {

    private final BlogArticleRepository blogArticleRepository;
    private final UserQueryService userQueryService;
    private final BlogMapper blogMapper;
    private final MessageUtils messageUtils;

    @Override
    @Transactional(readOnly = true)
    public List<BlogArticleDto> getAllArticles() {
        return blogMapper.toDtoList(blogArticleRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public BlogArticleDto getArticleById(String id) {
        BlogArticle article = findArticleOrThrow(id);
        return blogMapper.toDto(article);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"blog_articles", "blog_article"}, allEntries = true)
    public BlogArticleDto createArticle(SaveBlogArticleRequest request, String currentUserEmail) {
        String slug = SlugUtils.generateOrSanitizeSlug(request.getId(), request.getTitle());

        if (blogArticleRepository.existsById(slug)) {
            slug = slug + "-" + (System.currentTimeMillis() % 10000);
        }

        String authorName = request.getAuthor();
        if (authorName == null || authorName.isBlank()) {
            if (currentUserEmail != null) {
                User u = userQueryService.findByEmail(currentUserEmail).orElse(null);
                authorName = (u != null && u.getName() != null && !u.getName().isBlank()) ? u.getName() : "Launchly Team";
            } else {
                authorName = "Launchly Team";
            }
        }

        String lang = (request.getLanguage() != null && !request.getLanguage().isBlank()) ? request.getLanguage().trim().toLowerCase() : "uk";

        String dateStr = request.getDate();
        if (dateStr == null || dateStr.isBlank()) {
            Locale locale = "en".equalsIgnoreCase(lang) ? Locale.ENGLISH : new Locale("uk", "UA");
            dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("d MMMM, yyyy", locale));
        }

        String readTimeStr = request.getReadTime();
        if (readTimeStr == null || readTimeStr.isBlank()) {
            readTimeStr = BlogUtils.calculateReadTime(request);
        }

        String tagsStr = request.getTags() != null ? String.join(",", request.getTags()) : "";
        String contentBlocksJson = JsonUtils.toJson(request.getContentBlocks());

        BlogArticle article = BlogArticle.builder()
                .id(slug)
                .title(request.getTitle().trim())
                .category(request.getCategory().trim())
                .author(authorName.trim())
                .readTime(readTimeStr.trim())
                .datePublished(dateStr.trim())
                .summary(request.getSummary() != null ? request.getSummary().trim() : "")
                .coverImage(request.getCoverImage() != null ? request.getCoverImage().trim() : "")
                .language(lang)
                .tags(tagsStr)
                .contentBlocks(contentBlocksJson)
                .build();

        BlogArticle saved = blogArticleRepository.save(article);
        return blogMapper.toDto(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"blog_articles", "blog_article"}, allEntries = true)
    public BlogArticleDto updateArticle(String id, SaveBlogArticleRequest request) {
        BlogArticle article = findArticleOrThrow(id);

        if (request.getLanguage() != null && !request.getLanguage().isBlank()) {
            article.setLanguage(request.getLanguage().trim().toLowerCase());
        }
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            article.setTitle(request.getTitle().trim());
        }
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            article.setCategory(request.getCategory().trim());
        }
        if (request.getAuthor() != null && !request.getAuthor().isBlank()) {
            article.setAuthor(request.getAuthor().trim());
        }
        if (request.getDate() != null && !request.getDate().isBlank()) {
            article.setDatePublished(request.getDate().trim());
        }
        if (request.getReadTime() != null && !request.getReadTime().isBlank()) {
            article.setReadTime(request.getReadTime().trim());
        } else if (request.getSummary() != null || request.getContentBlocks() != null) {
            article.setReadTime(BlogUtils.calculateReadTime(
                    request.getSummary() != null ? request.getSummary() : article.getSummary(),
                    request.getContentBlocks(),
                    article.getLanguage()
            ));
        }

        if (request.getSummary() != null && !request.getSummary().isBlank()) {
            article.setSummary(request.getSummary().trim());
        }
        if (request.getCoverImage() != null && !request.getCoverImage().isBlank()) {
            article.setCoverImage(request.getCoverImage().trim());
        }
        if (request.getTags() != null) {
            article.setTags(String.join(",", request.getTags()));
        }
        if (request.getContentBlocks() != null) {
            article.setContentBlocks(JsonUtils.toJson(request.getContentBlocks()));
        }

        BlogArticle saved = blogArticleRepository.save(article);

        return blogMapper.toDto(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"blog_articles", "blog_article"}, allEntries = true)
    public void deleteArticle(String id) {
        String cleanId = id != null ? id.trim() : "";
        if (cleanId.isEmpty()) {
            blogArticleRepository.findAll().stream()
                    .filter(a -> a.getId() == null || a.getId().trim().isEmpty())
                    .forEach(blogArticleRepository::delete);
            return;
        }
        BlogArticle article = blogArticleRepository.findById(cleanId)
                .orElseGet(() -> blogArticleRepository.findAll().stream()
                        .filter(a -> a.getId() != null && a.getId().trim().equalsIgnoreCase(cleanId))
                        .findFirst()
                        .orElse(null));
        if (article != null) {
            blogArticleRepository.delete(article);
        }
    }

    private BlogArticle findArticleOrThrow(String id) {
        String cleanId = id != null ? id.trim() : "";
        return blogArticleRepository.findById(cleanId)
                .orElseGet(() -> blogArticleRepository.findAll().stream()
                        .filter(a -> a.getId() != null && a.getId().equalsIgnoreCase(cleanId))
                        .findFirst()
                        .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, messageUtils.getMessage("common.error.not_found"))));
    }
}
