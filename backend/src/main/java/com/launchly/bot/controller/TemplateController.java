package com.launchly.bot.controller;

import com.launchly.common.security.CustomUserDetails;
import com.launchly.bot.dto.request.CreateTemplateRequest;
import com.launchly.bot.dto.request.UpdateTemplateRequest;
import com.launchly.bot.dto.response.TemplateResponse;
import com.launchly.bot.service.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    @PostMapping("/create")
    public ResponseEntity<TemplateResponse> createTemplate(
            @RequestBody CreateTemplateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(templateService.createTemplate(request, userDetails.getId()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<TemplateResponse>> getMyTemplates(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(templateService.getMyTemplates(userDetails.getId()));
    }

    @GetMapping("/installed")
    public ResponseEntity<List<TemplateResponse>> getInstalledTemplates(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(templateService.getInstalledTemplates(userDetails.getId()));
    }

    @GetMapping("/{shareCode}")
    public ResponseEntity<TemplateResponse> getTemplateByShareCode(@PathVariable String shareCode) {
        return ResponseEntity.ok(templateService.getTemplateByShareCode(shareCode));
    }

    @PutMapping("/{shareCode}")
    public ResponseEntity<TemplateResponse> updateTemplate(
            @PathVariable String shareCode,
            @RequestBody UpdateTemplateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(templateService.updateTemplate(shareCode, request, userDetails.getId()));
    }

    @DeleteMapping("/{shareCode}")
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable String shareCode,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        templateService.deleteTemplate(shareCode, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/installed/{shareCode}")
    public ResponseEntity<Void> deleteInstalledTemplate(
            @PathVariable String shareCode,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        templateService.deleteInstalledTemplate(shareCode, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping({"/install/{shareCode}", "/{shareCode}/install"})
    public ResponseEntity<Void> installTemplate(
            @PathVariable String shareCode,
            @RequestParam(required = false) Long botId,
            @RequestParam(required = false) Long targetBotId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        templateService.installTemplate(shareCode, botId != null ? botId : targetBotId, userDetails.getId());
        return ResponseEntity.ok().build();
    }
}
