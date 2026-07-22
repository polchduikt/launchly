package com.launchly.support.controller;

import com.launchly.support.dto.SupportAppealRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/support")
@RequiredArgsConstructor
public class SupportAppealController {

    @PostMapping("/appeal")
    public ResponseEntity<Map<String, String>> submitAppeal(@Valid @RequestBody SupportAppealRequest request) {
        log.info("Received support appeal from {}: {}", request.getEmail(), request.getMessage());
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Звернення прийнято. Менеджер розгляне його найближчим часом."
        ));
    }
}
