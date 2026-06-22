package com.launchly.integration.controller;

import com.launchly.common.security.CustomUserDetails;
import com.launchly.integration.dto.ExportDataType;
import com.launchly.integration.dto.request.IntegrationCreateRequest;
import com.launchly.integration.dto.response.ExcelExportResult;
import com.launchly.integration.dto.response.IntegrationResponse;
import com.launchly.integration.service.ExcelExportService;
import com.launchly.integration.service.GoogleSheetsService;
import com.launchly.integration.service.IntegrationService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
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

@RestController
@RequestMapping("/api/v1/integrations")
@RequiredArgsConstructor
public class IntegrationController {

    private final IntegrationService integrationService;
    private final GoogleSheetsService googleSheetsService;
    private final ExcelExportService excelExportService;

    @Value("${app.integration.google.frontend-uri:http://localhost:5173/integrations}")
    private String frontendUri;

    @GetMapping
    public ResponseEntity<List<IntegrationResponse>> getIntegrations(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(integrationService.getIntegrations(userDetails.getId()));
    }

    @PostMapping
    public ResponseEntity<IntegrationResponse> createIntegration(@Valid @RequestBody IntegrationCreateRequest request,
                                                                 @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED).body(integrationService.createIntegration(request, userDetails.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IntegrationResponse> updateIntegration(@PathVariable Long id,
                                                                 @Valid @RequestBody IntegrationCreateRequest request,
                                                                 @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(integrationService.updateIntegration(id, request, userDetails.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIntegration(@PathVariable Long id,
                                                   @AuthenticationPrincipal CustomUserDetails userDetails) {
        integrationService.deleteIntegration(id, userDetails.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<IntegrationResponse> toggleIntegration(@PathVariable Long id,
                                                                 @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(integrationService.toggleIntegration(id, userDetails.getId()));
    }

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel(@RequestParam Long botId,
                                              @RequestParam ExportDataType dataType,
                                              @AuthenticationPrincipal CustomUserDetails userDetails) {
        ExcelExportResult result = excelExportService.export(botId, dataType, userDetails.getId());
        return ResponseEntity.ok()
                .headers(result.headers())
                .body(result.data());
    }

    @GetMapping("/google/auth")
    public void googleAuth(@RequestParam Long botId,
                           @AuthenticationPrincipal CustomUserDetails userDetails,
                           HttpServletResponse response) throws IOException {
        String authUrl = googleSheetsService.buildAuthorizationUrl(botId, userDetails.getId());
        response.sendRedirect(authUrl);
    }

    @GetMapping("/google/callback")
    public void googleCallback(@RequestParam String code,
                               @RequestParam String state,
                               HttpServletResponse response) throws IOException {
        Long botId = googleSheetsService.authenticate(state, code);
        response.sendRedirect(frontendUri + "?botId=" + botId + "&googleAuth=success");
    }

    @GetMapping("/google/spreadsheets")
    public ResponseEntity<List<java.util.Map<String, String>>> getSpreadsheets(@RequestParam Long botId,
                                                                               @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(googleSheetsService.getSpreadsheets(botId));
    }

    @GetMapping("/google/spreadsheets/{spreadsheetId}/worksheets")
    public ResponseEntity<List<String>> getWorksheets(@PathVariable String spreadsheetId,
                                                      @RequestParam Long botId,
                                                      @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(googleSheetsService.getWorksheets(botId, spreadsheetId));
    }

    @GetMapping("/google/spreadsheets/{spreadsheetId}/values/{worksheetName}/headers")
    public ResponseEntity<List<String>> getHeaders(@PathVariable String spreadsheetId,
                                                   @PathVariable String worksheetName,
                                                   @RequestParam Long botId,
                                                   @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(googleSheetsService.getHeaders(botId, spreadsheetId, worksheetName));
    }
}
