package com.launchly.common.controller;

import com.launchly.common.service.I18nService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/i18n")
@RequiredArgsConstructor
public class I18nController {

    private final I18nService i18nService;

    @GetMapping("/translations")
    public Map<String, String> getTranslations(@RequestParam(value = "lang", defaultValue = "en") String lang) {
        return i18nService.getTranslations(lang);
    }
}
