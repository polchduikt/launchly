package com.launchly.integration.controller;

import com.launchly.integration.service.HotmartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/integrations/hotmart")
@RequiredArgsConstructor
public class HotmartWebhookController {

    private final HotmartService hotmartService;

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestParam(name = "botId") Long botId,
            @RequestHeader(name = "X-Hotmart-Hottok", required = false) String hottokHeader,
            @RequestBody String rawPayload
    ) {
        hotmartService.processWebhook(botId, hottokHeader, rawPayload);
        return ResponseEntity.ok(Map.of("status", "ok", "message", "Webhook processed successfully"));
    }
}
