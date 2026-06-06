package com.launchly.media.dto.response;

public record MediaUploadResponse(
        String url,
        String publicId,
        String format,
        Integer width,
        Integer height,
        Long size
) {}
