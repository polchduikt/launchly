package com.launchly.auth.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "User profile update request payload")
public record UpdateProfileRequest(
        @Schema(description = "Updated user display name", example = "John Doe", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Name cannot be empty")
        @Size(max = 100, message = "Name must not exceed 100 characters")
        String name,

        @Schema(description = "Updated user email address", example = "john.doe@example.com", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Email cannot be empty")
        @Email(message = "Invalid email format")
        String email,

        @Schema(description = "Avatar image URL", example = "https://res.cloudinary.com/demo/image/upload/avatar.jpg")
        String avatar,

        @Schema(description = "Current password (required if updating password)", example = "OldPass123!")
        String currentPassword,

        @Schema(description = "New password (optional)", example = "NewPass456!")
        String newPassword
) {}

