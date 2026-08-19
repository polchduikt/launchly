package com.launchly.blog;

import com.launchly.BaseIntegrationTest;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.blog.entity.BlogArticle;
import com.launchly.blog.repository.BlogArticleRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class FeaturesIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private BlogArticleRepository blogArticleRepository;

    @Test
    @DisplayName("Should retrieve AI token quota and usage statistics for user")
    void getAiUsage_Success() throws Exception {
        User user = createTestUser("aiuser", Role.ROLE_OWNER);

        mockMvc.perform(get("/api/v1/ai/usage")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokensUsed").isNumber())
                .andExpect(jsonPath("$.tokenLimit").isNumber());
    }

    @Test
    @DisplayName("Should retrieve public blog articles and single article by slug")
    void getBlogArticles_Success() throws Exception {
        BlogArticle article = BlogArticle.builder()
                .id("how-to-build-a-bot")
                .title("How to Build a Telegram Bot")
                .category("Tutorial")
                .author("Launchly Team")
                .readTime("3 min")
                .datePublished("2026-08-19")
                .language("en")
                .contentBlocks("[]")
                .build();
        blogArticleRepository.save(article);

        mockMvc.perform(get("/api/v1/blog?lang=en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        mockMvc.perform(get("/api/v1/blog/how-to-build-a-bot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("How to Build a Telegram Bot"))
                .andExpect(jsonPath("$.author").value("Launchly Team"));
    }

    @Test
    @DisplayName("Should update user timezone in database")
    void updateTimezone_Success() throws Exception {
        User user = createTestUser("tzuser", Role.ROLE_OWNER);

        mockMvc.perform(put("/api/v1/notifications/timezone")
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("timezone", "Europe/Kyiv"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.timezone").value("Europe/Kyiv"));

        User inDb = userRepository.findById(user.getId()).orElseThrow();
        assertThat(inDb.getTimezone()).isEqualTo("Europe/Kyiv");
    }
}
