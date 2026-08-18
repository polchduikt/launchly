package com.launchly.admin.dto;

import com.launchly.auth.entity.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Schema(description = "Request payload to change user role")
@Data
public class UpdateUserRoleRequest {

    @Schema(description = "New user role", example = "ROLE_MANAGER", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Role is required")
    private Role role;
}

