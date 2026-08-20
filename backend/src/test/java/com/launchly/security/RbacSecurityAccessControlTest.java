package com.launchly.security;

import com.launchly.BaseIntegrationTest;
import com.launchly.admin.dto.AdminBlockRequest;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RbacSecurityAccessControlTest extends BaseIntegrationTest {

    @Test
    @DisplayName("RBAC: Anonymous unauthenticated requests to /api/v1/admin/** must return 401 Unauthorized")
    void adminEndpoints_AnonymousUser_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/stats"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/logs"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/admin/broadcasts"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("RBAC: Regular USER with ROLE_OWNER must be rejected with 403 Forbidden on all admin endpoints")
    void adminEndpoints_RegularUser_ReturnsForbidden() throws Exception {
        User regularUser = createTestUser("regular_rbac_user", Role.ROLE_OWNER);
        String authHeader = getAuthHeader(regularUser);

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", authHeader))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/stats")
                        .header("Authorization", authHeader))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/logs")
                        .header("Authorization", authHeader))
                .andExpect(status().isForbidden());

        AdminBlockRequest blockRequest = new AdminBlockRequest();
        blockRequest.setReason("admin.reason_rules");
        blockRequest.setDetails("Malicious activity detected");

        mockMvc.perform(patch("/api/v1/admin/users/" + regularUser.getId() + "/status")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("RBAC: ADMIN role has authorized access to /api/v1/admin/** endpoints")
    void adminEndpoints_AdminUser_ReturnsOk() throws Exception {
        User adminUser = createTestUser("master_admin", Role.ROLE_ADMIN);
        String authHeader = getAuthHeader(adminUser);

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/stats")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/logs")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk());
    }
}
