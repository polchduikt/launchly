package com.launchly.media.controller;

import com.launchly.common.exception.ErrorResponse;
import com.launchly.common.security.CustomUserDetails;
import com.launchly.media.dto.response.MediaUploadResponse;
import com.launchly.media.service.MediaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Media: Cloud CDN Storage", description = "Upload, host, and manage images/files on Cloudinary CDN")
@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @Operation(summary = "Upload media file", description = "Upload an image, avatar, or document file to Cloudinary cloud storage under specified folder.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Media uploaded successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid file or unsupported format", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> upload(
            @Parameter(description = "Multipart binary file to upload") @RequestParam("file") MultipartFile file,
            @Parameter(description = "Storage folder category (e.g. avatars, bots, broadcasts)") @RequestParam("folder") String folder,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        MediaUploadResponse response = mediaService.upload(file, folder, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Delete media file", description = "Delete an uploaded asset from CDN storage by its public ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Media deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Media not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{*publicId}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Cloudinary resource public ID") @PathVariable String publicId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        mediaService.delete(publicId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}

