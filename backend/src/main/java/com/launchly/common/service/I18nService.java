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
import java.util.Set;

@Service
@Slf4j
public class I18nService {

    private static final Set<String> SUPPORTED_LOCALES = Set.of("uk", "en", "es", "de", "fr");

    private static final String[] BACKEND_FILES = {
            "classpath:messages_errors.properties",
            "classpath:messages_system.properties"
    };

    private final ResourcePatternResolver resourceResolver = new PathMatchingResourcePatternResolver();

    public Map<String, String> getTranslations(String lang) {
        Map<String, String> translations = new HashMap<>();
        for (String pattern : BACKEND_FILES) {
            loadResource(translations, pattern);
        }
        if (lang != null) {
            String cleanLang = lang.trim().toLowerCase();
            if (SUPPORTED_LOCALES.contains(cleanLang) && !"en".equals(cleanLang)) {
                loadResource(translations, "classpath:messages_errors_" + cleanLang + ".properties");
                loadResource(translations, "classpath:messages_system_" + cleanLang + ".properties");
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
            log.debug("Could not load localization resource");
        }
    }
}
