package com.launchly.common.exception;

import com.launchly.common.utils.MessageUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GlobalExceptionHandlerTest {

    @Mock
    private MessageUtils messageUtils;

    @InjectMocks
    private GlobalExceptionHandler exceptionHandler;

    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        MockHttpServletRequest mockRequest = new MockHttpServletRequest();
        mockRequest.setRequestURI("/api/test");
        request = mockRequest;
    }

    @Test
    @DisplayName("Should handle AppException and return structured error response with status code")
    void handleAppException_ReturnsStructuredError() {
        AppException ex = new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found");
        lenient().when(messageUtils.getMessageWithDefault(anyString(), anyString()))
                .thenReturn("Bot not found in system");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleAppException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().path()).isEqualTo("/api/test");
    }

    @Test
    @DisplayName("Should handle generic unexpected Exception with 500 Internal Server Error")
    void handleGenericException_ReturnsInternalServerError() {
        Exception ex = new RuntimeException("Unexpected database failure");
        when(messageUtils.getMessage(anyString())).thenReturn("Internal server error occurred");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGenericException(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("Internal server error occurred");
    }
}
