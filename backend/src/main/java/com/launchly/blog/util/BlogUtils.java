package com.launchly.blog.util;

import com.launchly.blog.dto.BlogArticleDto;
import com.launchly.blog.dto.SaveBlogArticleRequest;
import java.util.List;

public final class BlogUtils {

    private static final int WORDS_PER_MINUTE = 180;

    private BlogUtils() {
    }

    public static String calculateReadTime(SaveBlogArticleRequest request) {
        if (request == null) return "1 хв";
        return calculateReadTime(request.getSummary(), request.getContentBlocks(), request.getLanguage());
    }

    public static String calculateReadTime(String summary, List<BlogArticleDto.ContentBlockDto> contentBlocks) {
        return calculateReadTime(summary, contentBlocks, "uk");
    }

    public static String calculateReadTime(String summary, List<BlogArticleDto.ContentBlockDto> contentBlocks, String language) {
        int wordCount = 0;
        if (summary != null) {
            wordCount += summary.split("\\s+").length;
        }
        if (contentBlocks != null) {
            for (BlogArticleDto.ContentBlockDto b : contentBlocks) {
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
        int minutes = Math.max(1, (int) Math.ceil((double) wordCount / WORDS_PER_MINUTE));
        String unit = isEnglish(language) ? "min" : "хв";
        return minutes + " " + unit;
    }

    private static boolean isEnglish(String language) {
        return language != null && language.trim().equalsIgnoreCase("en");
    }
}

