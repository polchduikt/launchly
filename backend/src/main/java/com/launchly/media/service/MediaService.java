package com.launchly.media.service;

import com.launchly.media.dto.response.MediaUploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface MediaService {
    MediaUploadResponse upload(MultipartFile file, String folder, Long userId);
    void delete(String publicId, Long userId);
}
