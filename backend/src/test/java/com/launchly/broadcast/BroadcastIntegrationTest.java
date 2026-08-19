package com.launchly.broadcast;

import com.launchly.BaseIntegrationTest;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.bot.entity.Bot;
import com.launchly.broadcast.dto.request.CreateCampaignRequest;
import com.launchly.broadcast.dto.request.CreateTagRequest;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.FilterType;
import com.launchly.broadcast.entity.Tag;
import com.launchly.broadcast.repository.BroadcastCampaignRepository;
import com.launchly.broadcast.repository.TagRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BroadcastIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private BroadcastCampaignRepository broadcastCampaignRepository;

    @Test
    @DisplayName("Should create tag, persist in database, and list all tags for bot")
    void createTag_And_ListTags_Success() throws Exception {
        User user = createTestUser("taguser", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "Broadcast Bot");

        CreateTagRequest request = new CreateTagRequest("VIP_CUSTOMERS");

        mockMvc.perform(post("/api/v1/broadcast/bots/" + bot.getId() + "/tags")
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("VIP_CUSTOMERS"));

        List<Tag> tags = tagRepository.findByBotId(bot.getId());
        assertThat(tags).hasSize(1);
        assertThat(tags.get(0).getName()).isEqualTo("VIP_CUSTOMERS");

        mockMvc.perform(get("/api/v1/broadcast/bots/" + bot.getId() + "/tags")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("VIP_CUSTOMERS"));
    }

    @Test
    @DisplayName("Should create broadcast campaign, retrieve campaigns list, and delete campaign from DB")
    void createCampaign_And_DeleteCampaign_Success() throws Exception {
        User user = createTestUser("campuser", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "Campaign Bot");

        CreateCampaignRequest request = new CreateCampaignRequest(
                "Spring Promo",
                "Special promo message",
                FilterType.ALL,
                null,
                null,
                null,
                null,
                bot.getId(),
                false
        );

        String responseContent = mockMvc.perform(post("/api/v1/broadcast/bots/" + bot.getId() + "/campaigns")
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Spring Promo"))
                .andReturn().getResponse().getContentAsString();

        Long campaignId = objectMapper.readTree(responseContent).get("id").asLong();

        List<BroadcastCampaign> campaigns = broadcastCampaignRepository.findByBotIdOrderByCreatedAtDesc(bot.getId());
        assertThat(campaigns).isNotEmpty();

        mockMvc.perform(delete("/api/v1/broadcast/bots/" + bot.getId() + "/campaigns/" + campaignId)
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isNoContent());

        assertThat(broadcastCampaignRepository.findById(campaignId)).isEmpty();
    }

    @Test
    @DisplayName("Should delete tag from database")
    void deleteTag_Success() throws Exception {
        User user = createTestUser("deltag", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "Tag Delete Bot");

        Tag tag = Tag.builder()
                .name("OLD_TAG")
                .bot(bot)
                .build();
        tag = tagRepository.save(tag);

        mockMvc.perform(delete("/api/v1/broadcast/bots/" + bot.getId() + "/tags/" + tag.getId())
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isNoContent());

        assertThat(tagRepository.findById(tag.getId())).isEmpty();
    }
}
