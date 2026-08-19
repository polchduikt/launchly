package com.launchly.admin.integration;

import com.launchly.BaseIntegrationTest;
import com.launchly.admin.dto.UpdateUserRoleRequest;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("Should retrieve paginated user list when authenticated as ADMIN")
    void getUsers_AsAdmin_Success() throws Exception {
        User admin = createTestUser("adminuser", Role.ROLE_ADMIN);
        createTestUser("targetuser", Role.ROLE_OWNER);

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", getAuthHeader(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    @DisplayName("Should reject regular user from accessing admin endpoints with 403 Forbidden")
    void getUsers_AsRegularUser_ReturnsForbidden() throws Exception {
        User regularUser = createTestUser("regular", Role.ROLE_OWNER);

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", getAuthHeader(regularUser)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should update user role from ROLE_OWNER to ROLE_MANAGER in DB")
    void updateUserRole_Success() throws Exception {
        User admin = createTestUser("adminmaster", Role.ROLE_ADMIN);
        User targetUser = createTestUser("promoted", Role.ROLE_OWNER);

        UpdateUserRoleRequest request = new UpdateUserRoleRequest();
        request.setRole(Role.ROLE_MANAGER);

        mockMvc.perform(patch("/api/v1/admin/users/" + targetUser.getId() + "/role")
                        .header("Authorization", getAuthHeader(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ROLE_MANAGER"));

        User inDb = userRepository.findById(targetUser.getId()).orElseThrow();
        assertThat(inDb.getRole()).isEqualTo(Role.ROLE_MANAGER);
    }

    @Test
    @DisplayName("Should retrieve platform statistics when authenticated as ADMIN")
    void getStats_Success() throws Exception {
        User admin = createTestUser("statsadmin", Role.ROLE_ADMIN);

        mockMvc.perform(get("/api/v1/admin/stats")
                        .header("Authorization", getAuthHeader(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").isNumber());
    }
}
