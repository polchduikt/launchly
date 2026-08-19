package com.launchly.common.controller;

import com.launchly.common.service.I18nService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@Tag(name = "Common: Internationalization (i18n)", description = "Frontend localization dictionary and translation bundle retrieval")
@RestController
@RequestMapping("/api/i18n")
@RequiredArgsConstructor
public class I18nController {

    private final I18nService i18nService;

    @Operation(summary = "Get UI translation dictionary", description = "Fetch complete key-value dictionary mapping for the requested locale (uk, en).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Translation key-value map")
    })
    @GetMapping("/translations")
    public Map<String, String> getTranslations(
            @Parameter(description = "Language locale code (e.g. uk, en)", example = "uk") @RequestParam(value = "lang", defaultValue = "en") String lang) {
        return i18nService.getTranslations(lang);
    }
}

