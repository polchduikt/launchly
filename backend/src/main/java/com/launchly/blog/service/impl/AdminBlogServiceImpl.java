package com.launchly.blog.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.dto.SaveBlogArticleRequest;
import com.launchly.blog.entity.BlogArticle;
import com.launchly.blog.repository.BlogArticleRepository;
import com.launchly.blog.service.AdminBlogService;
import com.launchly.common.exception.AppException;
import com.launchly.common.utils.MessageUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminBlogServiceImpl implements AdminBlogService {

    private final BlogArticleRepository blogArticleRepository;
    private final UserRepository userRepository;
    private final MessageUtils messageUtils;
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
        BlogArticle article = findArticleOrThrow(id);
        return mapToDto(article);
    }

    @Override
    @Transactional
    public BlogArticleDto createArticle(SaveBlogArticleRequest request, String currentUserEmail) {
        String slug = generateOrSanitizeSlug(request.getId(), request.getTitle());

        if (blogArticleRepository.existsById(slug)) {
            slug = slug + "-" + (System.currentTimeMillis() % 10000);
        }

        String authorName = request.getAuthor();
        if (authorName == null || authorName.isBlank()) {
            if (currentUserEmail != null) {
                User u = userRepository.findByEmail(currentUserEmail).orElse(null);
                authorName = (u != null && u.getName() != null && !u.getName().isBlank()) ? u.getName() : "Launchly Team";
            } else {
                authorName = "Launchly Team";
            }
        }

        String dateStr = request.getDate();
        if (dateStr == null || dateStr.isBlank()) {
            dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("d MMMM, yyyy", new Locale("uk", "UA")));
        }

        String readTimeStr = request.getReadTime();
        if (readTimeStr == null || readTimeStr.isBlank()) {
            readTimeStr = calculateReadTime(request);
        }

        String tagsStr = request.getTags() != null ? String.join(",", request.getTags()) : "";
        String contentBlocksJson = serializeContentBlocks(request.getContentBlocks());
        String lang = (request.getLanguage() != null && !request.getLanguage().isBlank()) ? request.getLanguage().trim().toLowerCase() : "uk";

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
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public BlogArticleDto updateArticle(String id, SaveBlogArticleRequest request) {
        BlogArticle article = findArticleOrThrow(id);

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
        } else {
            article.setReadTime(calculateReadTime(request));
        }
        if (request.getSummary() != null) {
            article.setSummary(request.getSummary().trim());
        }
        if (request.getCoverImage() != null) {
            article.setCoverImage(request.getCoverImage().trim());
        }
        if (request.getLanguage() != null && !request.getLanguage().isBlank()) {
            article.setLanguage(request.getLanguage().trim().toLowerCase());
        }
        if (request.getTags() != null) {
            article.setTags(String.join(",", request.getTags()));
        }
        if (request.getContentBlocks() != null) {
            article.setContentBlocks(serializeContentBlocks(request.getContentBlocks()));
        }

        BlogArticle saved = blogArticleRepository.save(article);
        return mapToDto(saved);
    }

    @Override
    @Transactional
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

    private String generateOrSanitizeSlug(String requestedId, String title) {
        String raw = (requestedId != null && !requestedId.isBlank()) ? requestedId : title;
        if (raw == null || raw.isBlank()) {
            return "post-" + System.currentTimeMillis();
        }
        String transliterated = transliterate(raw.trim().toLowerCase());
        String slug = transliterated.replaceAll("[^a-z0-9\\-]+", "-").replaceAll("^-+|-+$", "");
        return slug.isBlank() ? "post-" + System.currentTimeMillis() : slug;
    }

    private String transliterate(String text) {
        StringBuilder sb = new StringBuilder();
        for (char c : text.toCharArray()) {
            switch (c) {
                case 'а' -> sb.append("a");
                case 'б' -> sb.append("b");
                case 'в' -> sb.append("v");
                case 'г' -> sb.append("h");
                case 'ґ' -> sb.append("g");
                case 'д' -> sb.append("d");
                case 'е', 'є' -> sb.append("e");
                case 'ж' -> sb.append("zh");
                case 'з' -> sb.append("z");
                case 'и', 'і', 'ї' -> sb.append("i");
                case 'й' -> sb.append("y");
                case 'к' -> sb.append("k");
                case 'л' -> sb.append("l");
                case 'м' -> sb.append("m");
                case 'н' -> sb.append("n");
                case 'о' -> sb.append("o");
                case 'п' -> sb.append("p");
                case 'р' -> sb.append("r");
                case 'с' -> sb.append("s");
                case 'т' -> sb.append("t");
                case 'у' -> sb.append("u");
                case 'ф' -> sb.append("f");
                case 'х' -> sb.append("kh");
                case 'ц' -> sb.append("ts");
                case 'ч' -> sb.append("ch");
                case 'ш' -> sb.append("sh");
                case 'щ' -> sb.append("shch");
                case 'ю' -> sb.append("yu");
                case 'я' -> sb.append("ya");
                case ' ' -> sb.append("-");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

    private String calculateReadTime(SaveBlogArticleRequest request) {
        int wordCount = 0;
        if (request.getSummary() != null) {
            wordCount += request.getSummary().split("\\s+").length;
        }
        if (request.getContentBlocks() != null) {
            for (BlogArticleDto.ContentBlockDto b : request.getContentBlocks()) {
                if (b.getText() != null) {
                    wordCount += b.getText().split("\\s+").length;
                }
                if (b.getItems() != null) {
                    for (String item : b.getItems()) {
                        if (item != null) wordCount += item.split("\\s+").length;
                    }
                }
            }
        }
        int minutes = Math.max(1, (int) Math.ceil((double) wordCount / 180));
        return minutes + " хв";
    }

    private String serializeContentBlocks(List<BlogArticleDto.ContentBlockDto> blocks) {
        if (blocks == null || blocks.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(blocks);
        } catch (Exception e) {
            log.error("Failed to serialize content blocks", e);
            return "[]";
        }
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
