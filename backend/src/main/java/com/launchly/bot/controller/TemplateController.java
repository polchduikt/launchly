package com.launchly.bot.controller;

import com.launchly.bot.dto.request.CreateTemplateRequest;
import com.launchly.bot.dto.request.UpdateTemplateRequest;
import com.launchly.bot.dto.response.TemplateResponse;
import com.launchly.bot.service.TemplateService;
import com.launchly.common.exception.ErrorResponse;
import com.launchly.common.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "Bot: Templates & Marketplace", description = "Create, share, install, and manage reusable bot workflow templates")
@RestController
@RequestMapping("/api/v1/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;

    @Operation(summary = "Create reusable bot template", description = "Bundle selected flows, broadcasts, tags, and fields from a bot into a sharable template.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Template created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Source bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/create")
    public ResponseEntity<TemplateResponse> createTemplate(
            @RequestBody CreateTemplateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(templateService.createTemplate(request, userDetails.getId()));
    }

    @Operation(summary = "Get user's created templates", description = "Retrieve list of all templates created and published by the authenticated user.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of user templates", content = @Content(array = @ArraySchema(schema = @Schema(implementation = TemplateResponse.class))))
    })
    @GetMapping("/my")
    public ResponseEntity<List<TemplateResponse>> getMyTemplates(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(templateService.getMyTemplates(userDetails.getId()));
    }

    @Operation(summary = "Get user's installed templates", description = "Retrieve list of all external templates installed into the user's workspace.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of installed templates", content = @Content(array = @ArraySchema(schema = @Schema(implementation = TemplateResponse.class))))
    })
    @GetMapping("/installed")
    public ResponseEntity<List<TemplateResponse>> getInstalledTemplates(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(templateService.getInstalledTemplates(userDetails.getId()));
    }

    @Operation(summary = "Get template details by share code", description = "Fetch public metadata and schema bundle for a template by its unique share code.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Template details retrieved"),
            @ApiResponse(responseCode = "404", description = "Template not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/share/{shareCode}")
    public ResponseEntity<TemplateResponse> getTemplateByShareCode(
            @Parameter(description = "Template unique share code") @PathVariable String shareCode) {
        return ResponseEntity.ok(templateService.getTemplateByShareCode(shareCode));
    }

    @Operation(summary = "Track template landing view", description = "Increment view analytics count for a public template share link.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "View tracked successfully")
    })
    @PostMapping("/share/{shareCode}/view")
    public ResponseEntity<Void> trackView(
            @Parameter(description = "Template unique share code") @PathVariable String shareCode,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        templateService.trackTemplateView(shareCode, userId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Update template details", description = "Modify metadata, descriptions, URLs, or bundled items of an owned template.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Template updated successfully"),
            @ApiResponse(responseCode = "404", description = "Template not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{shareCode}")
    public ResponseEntity<TemplateResponse> updateTemplate(
            @Parameter(description = "Template unique share code") @PathVariable String shareCode,
            @RequestBody UpdateTemplateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(templateService.updateTemplate(shareCode, request, userDetails.getId()));
    }

    @Operation(summary = "Delete template", description = "Permanently remove a template created by the authenticated user.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Template deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Template not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{shareCode}")
    public ResponseEntity<Void> deleteTemplate(
            @Parameter(description = "Template unique share code") @PathVariable String shareCode,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        templateService.deleteTemplate(shareCode, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Delete installed template record", description = "Remove an installed template bookmark from the user's workspace.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Installed template removed"),
            @ApiResponse(responseCode = "404", description = "Installed template not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/installed/{shareCode}")
    public ResponseEntity<Void> deleteInstalledTemplate(
            @Parameter(description = "Template unique share code") @PathVariable String shareCode,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        templateService.deleteInstalledTemplate(shareCode, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Install template into bot", description = "Clone and import template flows, broadcasts, tags, and custom fields into a new or existing target bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Template installed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid target bot or template", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Template not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/install/{shareCode}")
    public ResponseEntity<Void> installTemplate(
            @Parameter(description = "Template unique share code") @PathVariable String shareCode,
            @Parameter(description = "Target bot ID") @RequestParam(required = false) Long botId,
            @Parameter(description = "Alternative target bot ID") @RequestParam(required = false) Long targetBotId,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        templateService.installTemplate(shareCode, botId != null ? botId : targetBotId, userDetails.getId());
        return ResponseEntity.ok().build();
    }
}

