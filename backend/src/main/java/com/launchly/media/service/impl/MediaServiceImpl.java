package com.launchly.media.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.launchly.common.exception.AppException;
import com.launchly.media.dto.response.MediaUploadResponse;
import com.launchly.media.service.MediaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaServiceImpl implements MediaService {

    private final Cloudinary cloudinary;

    @Value("${app.media.max-file-size:5242880}")
    private long maxFileSize;

    @Value("${app.media.allowed-types}")
    private List<String> allowedTypes;

    @Override
    public MediaUploadResponse upload(MultipartFile file, String folder, Long userId) {
        if (file == null || file.isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "media.error.file_empty");
        }

        if (file.getSize() > maxFileSize) {
            throw new AppException(HttpStatus.BAD_REQUEST, "media.error.file_too_large");
        }

        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "media.error.invalid_file_type");
        }

        if (folder == null || !folder.matches("^[a-zA-Z0-9_-]+$")) {
            throw new AppException(HttpStatus.BAD_REQUEST, "media.error.invalid_folder_name");
        }

        String resourceType;
        if (contentType != null && contentType.startsWith("image/")) {
            resourceType = "image";
        } else if (contentType != null && (contentType.startsWith("video/") || contentType.startsWith("audio/"))) {
            resourceType = "video";
        } else {
            resourceType = "raw";
        }

        Map<String, Object> params;
        if ("image".equals(resourceType)) {
            params = Map.of(
                    "folder", "launchly/" + userId + "/" + folder,
                    "transformation", "c_limit,w_1200,h_1200,q_auto,f_auto",
                    "resource_type", "image"
            );
        } else {
            params = Map.of(
                    "folder", "launchly/" + userId + "/" + folder,
                    "resource_type", resourceType
            );
        }
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), params);

            String url = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");
            String format = (String) result.get("format");
            Integer width = (Integer) result.get("width");
            Integer height = (Integer) result.get("height");
            Long size = ((Number) result.get("bytes")).longValue();

            return new MediaUploadResponse(url, publicId, format, width, height, size);
        } catch (IOException e) {
            log.error("Cloudinary upload failed: {}", e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "media.error.upload_failed");
        }
    }

    @Override
    public void delete(String publicId, Long userId) {
        if (publicId == null || publicId.trim().isEmpty()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "media.error.public_id_required");
        }
        String cleanedPublicId = publicId.startsWith("/") 
                ? publicId.substring(1) 
                : publicId;

        String expectedPrefix = "launchly/" + userId + "/";
        if (!cleanedPublicId.startsWith(expectedPrefix)) {
            throw new AppException(HttpStatus.FORBIDDEN, "media.error.not_owner");
        }
        try {
            Map<?, ?> result = cloudinary.uploader().destroy(cleanedPublicId, ObjectUtils.emptyMap());
            String resultStatus = (String) result.get("result");
            if (!"ok".equals(resultStatus) && !"not_found".equals(resultStatus)) {
                log.warn("Cloudinary destroy returned unexpected status: {} for publicId {}", resultStatus, cleanedPublicId);
            }
        } catch (IOException e) {
            log.error("Cloudinary deletion failed: {}", e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "media.error.delete_failed");
        }
    }
}

