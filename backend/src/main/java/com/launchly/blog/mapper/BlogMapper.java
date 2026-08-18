package com.launchly.blog.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.entity.BlogArticle;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface BlogMapper {

    ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Mapping(target = "date", source = "datePublished")
    @Mapping(target = "tags", source = "tags", qualifiedByName = "tagsStringToList")
    @Mapping(target = "contentBlocks", source = "contentBlocks", qualifiedByName = "jsonToContentBlocks")
    BlogArticleDto toDto(BlogArticle entity);

    List<BlogArticleDto> toDtoList(List<BlogArticle> entities);

    @Named("tagsStringToList")
    default List<String> tagsStringToList(String tags) {
        if (tags == null || tags.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    @Named("jsonToContentBlocks")
    default List<BlogArticleDto.ContentBlockDto> jsonToContentBlocks(String contentBlocks) {
        if (contentBlocks == null || contentBlocks.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return OBJECT_MAPPER.readValue(contentBlocks, new TypeReference<List<BlogArticleDto.ContentBlockDto>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
