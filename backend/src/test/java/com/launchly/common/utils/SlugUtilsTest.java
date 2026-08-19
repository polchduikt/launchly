package com.launchly.common.utils;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SlugUtilsTest {

    @Test
    @DisplayName("Should transliterate Ukrainian cyrillic text to latin characters")
    void transliterate_Ukrainian_ReturnsLatin() {
        String text = "Як створити бота у Телеграм";
        String transliterated = SlugUtils.transliterate(text.toLowerCase());
        assertThat(transliterated).isEqualTo("yak-stvoriti-bota-u-telehram");
    }

    @Test
    @DisplayName("Should generate clean URL slug from Ukrainian title")
    void generateOrSanitizeSlug_FromUkrainianTitle_ReturnsCleanSlug() {
        String title = "Як створити Telegram бота!";
        String slug = SlugUtils.generateOrSanitizeSlug(null, title);
        assertThat(slug).isEqualTo("yak-stvoriti-telegram-bota");
    }

    @Test
    @DisplayName("Should preserve and sanitize custom requestedId when provided")
    void generateOrSanitizeSlug_WhenRequestedIdProvided_UsesRequestedId() {
        String slug = SlugUtils.generateOrSanitizeSlug("custom-slug-123", "Some Title");
        assertThat(slug).isEqualTo("custom-slug-123");
    }

    @Test
    @DisplayName("Should return fallback slug with post prefix for null or blank inputs")
    void generateOrSanitizeSlug_WhenNullOrBlank_ReturnsFallback() {
        String slug = SlugUtils.generateOrSanitizeSlug("", "");
        assertThat(slug).startsWith("post-");
    }
}
