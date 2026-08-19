package com.launchly.bot.integration;

import com.launchly.BaseIntegrationTest;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.bot.dto.request.BotCreateRequest;
import com.launchly.bot.dto.request.BotUpdateRequest;
import com.launchly.bot.dto.request.CreateTemplateRequest;
import com.launchly.bot.dto.request.FlowSchemaRequest;
import com.launchly.bot.dto.request.InviteMemberRequest;
import com.launchly.bot.entity.Bot;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BotIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("Should create bot, persist in database, and return bot response with 201 Created")
    void createBot_Success() throws Exception {
        User user = createTestUser("botuser", Role.ROLE_OWNER);
        BotCreateRequest request = new BotCreateRequest("Support Bot", "Handles tickets", "123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ123456789", null);

        mockMvc.perform(post("/api/v1/bots")
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Support Bot"))
                .andExpect(jsonPath("$.description").value("Handles tickets"));

        List<Bot> botsInDb = botRepository.findAllByUserId(user.getId());
        assertThat(botsInDb).hasSize(1);
        assertThat(botsInDb.get(0).getName()).isEqualTo("Support Bot");
    }

    @Test
    @DisplayName("Should retrieve list of user bots and bot details by ID")
    void getBots_And_GetBotById_Success() throws Exception {
        User user = createTestUser("listbot", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "My Store Bot");

        mockMvc.perform(get("/api/v1/bots")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(bot.getId()))
                .andExpect(jsonPath("$[0].name").value("My Store Bot"));

        mockMvc.perform(get("/api/v1/bots/" + bot.getId())
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(bot.getId()))
                .andExpect(jsonPath("$.name").value("My Store Bot"));
    }

    @Test
    @DisplayName("Should update bot name and description in database")
    void updateBot_Success() throws Exception {
        User user = createTestUser("updbot", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "Original Bot");

        BotUpdateRequest updateRequest = new BotUpdateRequest("Renamed Bot", "New Description", null, null, null, null);

        mockMvc.perform(put("/api/v1/bots/" + bot.getId())
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Renamed Bot"))
                .andExpect(jsonPath("$.description").value("New Description"));

        Bot updated = botRepository.findById(bot.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Renamed Bot");
        assertThat(updated.getDescription()).isEqualTo("New Description");
    }

    @Test
    @DisplayName("Should start and stop bot, updating active state in DB")
    void startAndStopBot_Success() throws Exception {
        User user = createTestUser("statebot", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "Toggle Bot");

        mockMvc.perform(post("/api/v1/bots/" + bot.getId() + "/start")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true));

        Bot startedBot = botRepository.findById(bot.getId()).orElseThrow();
        assertThat(startedBot.isActive()).isTrue();

        mockMvc.perform(post("/api/v1/bots/" + bot.getId() + "/stop")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        Bot stoppedBot = botRepository.findById(bot.getId()).orElseThrow();
        assertThat(stoppedBot.isActive()).isFalse();
    }

    @Test
    @DisplayName("Should save and retrieve flow schema for bot")
    void saveAndGetFlowSchema_Success() throws Exception {
        User user = createTestUser("flowbot", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "Flow Bot");

        List<Map<String, Object>> nodes = List.of(
                Map.of("id", "start-1", "type", "START", "data", Map.of("label", "Start")),
                Map.of("id", "msg-1", "type", "MESSAGE", "data", Map.of("text", "Hello!"))
        );
        List<Map<String, Object>> edges = List.of(
                Map.of("id", "e1", "source", "start-1", "target", "msg-1")
        );
        FlowSchemaRequest schemaRequest = new FlowSchemaRequest(nodes, edges);

        mockMvc.perform(put("/api/v1/bots/" + bot.getId() + "/schema")
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(schemaRequest)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/bots/" + bot.getId() + "/schema")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nodes").isNotEmpty());
    }

    @Test
    @DisplayName("Should invite team member to bot collaboration")
    void inviteTeamMember_Success() throws Exception {
        User owner = createTestUser("teamowner", Role.ROLE_OWNER);
        User colleague = createTestUser("colleague", Role.ROLE_OWNER);
        Bot bot = createTestBot(owner, "Team Bot");

        InviteMemberRequest request = new InviteMemberRequest(colleague.getEmail(), "EDITOR", true, false);

        mockMvc.perform(post("/api/v1/bots/" + bot.getId() + "/invitations")
                        .header("Authorization", getAuthHeader(owner))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should create account template from bot and retrieve in template list")
    void createAndGetTemplate_Success() throws Exception {
        User user = createTestUser("templater", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "Template Source Bot");

        CreateTemplateRequest request = new CreateTemplateRequest(
                bot.getId(),
                "Support Template",
                "A template for customer support",
                "https://cdn.example.com/thumb.png",
                false,
                "https://docs.example.com",
                null,
                List.of(),
                List.of(),
                List.of(),
                List.of()
        );

        mockMvc.perform(post("/api/v1/templates/create")
                        .header("Authorization", getAuthHeader(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Support Template"));

        mockMvc.perform(get("/api/v1/templates/my")
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Support Template"));
    }

    @Test
    @DisplayName("Should delete bot from database and return 204 No Content")
    void deleteBot_Success() throws Exception {
        User user = createTestUser("delbot", Role.ROLE_OWNER);
        Bot bot = createTestBot(user, "Bot to Delete");

        mockMvc.perform(delete("/api/v1/bots/" + bot.getId())
                        .header("Authorization", getAuthHeader(user)))
                .andExpect(status().isNoContent());

        assertThat(botRepository.findById(bot.getId())).isEmpty();
    }
}
