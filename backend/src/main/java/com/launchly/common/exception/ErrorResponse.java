package com.launchly.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;
import java.time.LocalDateTime;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        int status,
        String error,
        String message,
        Map<String, String> fieldErrors,
        String path,
        LocalDateTime timestamp
) {
    public static ErrorResponse of(HttpStatus status, String message, String path) {
        return new ErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                message,
                null,
                path,
                LocalDateTime.now()
        );
    }

    public static ErrorResponse of(HttpStatus status, String message, Map<String, String> fieldErrors, String path) {
        return new ErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                message,
                fieldErrors != null && !fieldErrors.isEmpty() ? fieldErrors : null,
                path,
                LocalDateTime.now()
        );
    }
}

