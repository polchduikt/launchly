package com.launchly.common.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

/**
 * Provides backend-generated translations to the frontend.
 * Only returns keys that the backend itself produces:
 *   - API error messages      (messages_errors*.properties)
 *   - Audit logs & system messages (messages_system*.properties)
 *
 * Frontend UI strings are bundled directly in the frontend JSON files
 * and must NOT be served from here.
 */
@Service
@Slf4j
public class I18nService {

    private static final String[] BACKEND_FILES = {
            "classpath:messages_errors.properties",
            "classpath:messages_system.properties"
    };
    private static final String[] BACKEND_FILES_LANG_PATTERN = {
            "classpath:messages_errors_{lang}.properties",
            "classpath:messages_system_{lang}.properties"
    };

    private final ResourcePatternResolver resourceResolver = new PathMatchingResourcePatternResolver();

    public Map<String, String> getTranslations(String lang) {
        Map<String, String> translations = new HashMap<>();
        // Load English (default) base
        for (String pattern : BACKEND_FILES) {
            loadResource(translations, pattern);
        }
        // Override with language-specific if not English
        if (lang != null && !"en".equalsIgnoreCase(lang)) {
            for (String pattern : BACKEND_FILES_LANG_PATTERN) {
                loadResource(translations, pattern.replace("{lang}", lang.toLowerCase()));
            }
        }
        return translations;
    }

    private void loadResource(Map<String, String> targetMap, String location) {
        try {
            Resource[] resources = resourceResolver.getResources(location);
            for (Resource resource : resources) {
                if (!resource.exists()) continue;
                Properties props = new Properties();
                try (InputStream is = resource.getInputStream();
                     InputStreamReader reader = new InputStreamReader(is, StandardCharsets.UTF_8)) {
                    props.load(reader);
                }
                for (String key : props.stringPropertyNames()) {
                    targetMap.put(key, props.getProperty(key));
                }
            }
        } catch (Exception e) {
            log.debug("Could not load resource '{}': {}", location, e.getMessage());
        }
    }
}
