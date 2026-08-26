package com.launchly.integration.controller;

import com.launchly.common.idempotency.Idempotent;
import com.launchly.common.exception.ErrorResponse;
import com.launchly.common.security.CustomUserDetails;
import com.launchly.integration.dto.ExportDataType;
import com.launchly.integration.dto.request.IntegrationCreateRequest;
import com.launchly.integration.dto.response.ExcelExportResult;
import com.launchly.integration.dto.response.IntegrationResponse;
import com.launchly.integration.service.ExcelExportService;
import com.launchly.integration.service.GoogleSheetsService;
import com.launchly.integration.service.IntegrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.io.IOException;
import java.util.List;

@Tag(name = "Integration: Third-Party Services", description = "Google Sheets OAuth/Spreadsheets, Webhooks, Excel Exports, Mailchimp, and Hotmart")
@RestController
@RequestMapping("/api/v1/integrations")
@RequiredArgsConstructor
public class IntegrationController {

    private final IntegrationService integrationService;
    private final GoogleSheetsService googleSheetsService;
    private final ExcelExportService excelExportService;

    @Value("${app.integration.google.frontend-uri:http://localhost:5173/integrations}")
    private String frontendUri;

    @Operation(summary = "Get user integrations", description = "Retrieve list of all active and inactive third-party integrations across user's bots.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of integrations", content = @Content(array = @ArraySchema(schema = @Schema(implementation = IntegrationResponse.class)))),
            @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<List<IntegrationResponse>> getIntegrations(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(integrationService.getIntegrations(userDetails.getId()));
    }

    @Operation(summary = "Connect new integration", description = "Create a new integration configuration for a bot.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Integration connected successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error / invalid configuration", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "Plan feature limit exceeded", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    @Idempotent
    public ResponseEntity<IntegrationResponse> createIntegration(@Valid @RequestBody IntegrationCreateRequest request,
                                                                 @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED).body(integrationService.createIntegration(request, userDetails.getId()));
    }

    @Operation(summary = "Update integration", description = "Modify settings, credentials, or target sheets for an integration.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Integration updated successfully"),
            @ApiResponse(responseCode = "404", description = "Integration not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}")
    public ResponseEntity<IntegrationResponse> updateIntegration(
            @Parameter(description = "Integration ID") @PathVariable Long id,
            @Valid @RequestBody IntegrationCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(integrationService.updateIntegration(id, request, userDetails.getId()));
    }

    @Operation(summary = "Delete integration", description = "Disconnect and remove an integration.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Integration deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Integration not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIntegration(
            @Parameter(description = "Integration ID") @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        integrationService.deleteIntegration(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Toggle integration state", description = "Enable or disable an integration without deleting its credentials.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Integration state toggled"),
            @ApiResponse(responseCode = "404", description = "Integration not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/toggle")
    public ResponseEntity<IntegrationResponse> toggleIntegration(
            @Parameter(description = "Integration ID") @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(integrationService.toggleIntegration(id, userDetails.getId()));
    }

    @Operation(summary = "Export bot data to Excel (.xlsx)", description = "Generate and download an Excel spreadsheet containing subscriber contacts, leads, or orders.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Binary Excel workbook stream", content = @Content(mediaType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")),
            @ApiResponse(responseCode = "404", description = "Bot not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel(
            @Parameter(description = "Target Bot ID") @RequestParam Long botId,
            @Parameter(description = "Data entity to export: USERS, LEADS, ORDERS") @RequestParam ExportDataType dataType,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ExcelExportResult result = excelExportService.export(botId, dataType, userDetails.getId());
        return ResponseEntity.ok()
                .headers(result.headers())
                .body(result.data());
    }

    @Operation(summary = "Initiate Google OAuth flow", description = "Redirect to Google authorization screen to authorize Google Sheets API integration.")
    @GetMapping("/google/auth")
    public void googleAuth(
            @Parameter(description = "Target Bot ID") @RequestParam Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletResponse response) throws IOException {
        String authUrl = googleSheetsService.buildAuthorizationUrl(botId, userDetails.getId());
        response.sendRedirect(authUrl);
    }

    @Operation(summary = "Google OAuth redirect callback", description = "Handles Google OAuth2 authorization code callback and completes token exchange.")
    @GetMapping("/google/callback")
    public void googleCallback(
            @RequestParam String code,
            @RequestParam String state,
            HttpServletResponse response) throws IOException {
        Long botId = googleSheetsService.authenticate(state, code);
        response.sendRedirect(frontendUri + "?botId=" + botId + "&googleAuth=success");
    }

    @Operation(summary = "Get user Google Spreadsheets", description = "List all spreadsheets available in the connected Google Drive account.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of spreadsheets (id and title)")
    })
    @GetMapping("/google/spreadsheets")
    public ResponseEntity<List<java.util.Map<String, String>>> getSpreadsheets(
            @Parameter(description = "Bot ID") @RequestParam Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(googleSheetsService.getSpreadsheets(botId));
    }

    @Operation(summary = "Get spreadsheet worksheets", description = "List individual worksheet tab names inside a selected Google Spreadsheet.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of worksheet titles")
    })
    @GetMapping("/google/spreadsheets/{spreadsheetId}/worksheets")
    public ResponseEntity<List<String>> getWorksheets(
            @Parameter(description = "Google Spreadsheet ID") @PathVariable String spreadsheetId,
            @Parameter(description = "Bot ID") @RequestParam Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(googleSheetsService.getWorksheets(botId, spreadsheetId));
    }

    @Operation(summary = "Get worksheet headers", description = "Fetch the first row column header names of a specific worksheet tab.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "List of column header titles")
    })
    @GetMapping("/google/spreadsheets/{spreadsheetId}/values/{worksheetName}/headers")
    public ResponseEntity<List<String>> getHeaders(
            @Parameter(description = "Google Spreadsheet ID") @PathVariable String spreadsheetId,
            @Parameter(description = "Worksheet title / name") @PathVariable String worksheetName,
            @Parameter(description = "Bot ID") @RequestParam Long botId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(googleSheetsService.getHeaders(botId, spreadsheetId, worksheetName));
    }
}

