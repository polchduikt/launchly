package com.launchly.common.dto;

public record SuccessResponse(String status, String message) {

    public static SuccessResponse ok(String message) {
        return new SuccessResponse("success", message);
    }
}
