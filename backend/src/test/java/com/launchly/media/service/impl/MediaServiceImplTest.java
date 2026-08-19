package com.launchly.media.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.launchly.common.exception.AppException;
import com.launchly.media.dto.response.MediaUploadResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MediaServiceImplTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @InjectMocks
    private MediaServiceImpl mediaService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(mediaService, "maxFileSize", 5242880L);
        ReflectionTestUtils.setField(mediaService, "allowedTypes", List.of("image/png", "image/jpeg"));
        lenient().when(cloudinary.uploader()).thenReturn(uploader);
    }

    @Test
    @DisplayName("Should successfully upload image file to Cloudinary")
    void upload_ValidImage_Success() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.png", "image/png", "dummy-image-content".getBytes()
        );

        Map<String, Object> cloudinaryResult = Map.of(
                "secure_url", "https://res.cloudinary.com/demo/image.png",
                "public_id", "launchly/1/avatars/avatar123",
                "format", "png",
                "width", 400,
                "height", 400,
                "bytes", 1024L
        );

        when(uploader.upload(any(byte[].class), any(Map.class))).thenReturn(cloudinaryResult);

        MediaUploadResponse response = mediaService.upload(file, "avatars", 1L);

        assertThat(response).isNotNull();
        assertThat(response.url()).isEqualTo("https://res.cloudinary.com/demo/image.png");
        assertThat(response.publicId()).isEqualTo("launchly/1/avatars/avatar123");
    }

    @Test
    @DisplayName("Should throw bad request when file is empty")
    void upload_EmptyFile_ThrowsBadRequest() {
        MockMultipartFile file = new MockMultipartFile("file", "empty.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> mediaService.upload(file, "avatars", 1L))
                .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("Should throw bad request when file type is not allowed")
    void upload_UnsupportedType_ThrowsBadRequest() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "script.exe", "application/x-msdownload", "content".getBytes()
        );

        assertThatThrownBy(() -> mediaService.upload(file, "avatars", 1L))
                .isInstanceOf(AppException.class);
    }

    @Test
    @DisplayName("Should successfully delete file if owned by user")
    void delete_WhenUserOwnsFile_DeletesSuccessfully() throws IOException {
        when(uploader.destroy(eq("launchly/1/avatars/pic123"), any())).thenReturn(Map.of("result", "ok"));

        mediaService.delete("launchly/1/avatars/pic123", 1L);

        verify(uploader, times(1)).destroy(eq("launchly/1/avatars/pic123"), any());
    }

    @Test
    @DisplayName("Should throw forbidden when trying to delete file belonging to another user")
    void delete_WhenNotOwner_ThrowsForbidden() {
        assertThatThrownBy(() -> mediaService.delete("launchly/999/avatars/pic123", 1L))
                .isInstanceOf(AppException.class);
    }
}
