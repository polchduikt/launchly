package com.launchly.media.controller;

import com.launchly.common.security.CustomUserDetails;
import com.launchly.media.dto.response.MediaUploadResponse;
import com.launchly.media.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @PostMapping("/upload")
    public ResponseEntity<MediaUploadResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("folder") String folder,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        MediaUploadResponse response = mediaService.upload(file, folder, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{*publicId}")
    public ResponseEntity<Void> delete(
            @PathVariable String publicId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        mediaService.delete(publicId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}
