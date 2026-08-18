package com.launchly.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AppException extends RuntimeException {

    private final HttpStatus status;
    private final Object[] args;

    public AppException(HttpStatus status, String message) {
        super(message);
        this.status = status;
        this.args = new Object[0];
    }

    public AppException(HttpStatus status, String message, Object... args) {
        super(message);
        this.status = status;
        this.args = args != null ? args : new Object[0];
    }
}

