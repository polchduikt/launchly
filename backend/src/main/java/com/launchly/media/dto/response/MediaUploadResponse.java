package com.launchly.media.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Uploaded media asset details from CDN / Cloudinary")
public record MediaUploadResponse(
        @Schema(description = "Public CDN HTTPS URL", example = "https://res.cloudinary.com/launchly/image/upload/v1/bots/avatar.png")
        String url,

        @Schema(description = "Storage public ID", example = "launchly/bots/avatar_123")
        String publicId,

        @Schema(description = "File format extension", example = "png")
        String format,

        @Schema(description = "Image width in pixels", example = "512")
        Integer width,

        @Schema(description = "Image height in pixels", example = "512")
        Integer height,

        @Schema(description = "File byte size", example = "1048576")
        Long size
) {}

