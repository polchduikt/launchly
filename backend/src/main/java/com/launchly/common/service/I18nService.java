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

@Service
@Slf4j
public class I18nService {

    private final ResourcePatternResolver resourceResolver = new PathMatchingResourcePatternResolver();

    public Map<String, String> getTranslations(String lang) {
        Map<String, String> translations = new HashMap<>();
        loadProperties(translations, "classpath:messages_*.properties", false);
        if (lang != null && !"en".equalsIgnoreCase(lang)) {
            loadProperties(translations, "classpath:messages_*_" + lang + ".properties", true);
        }
        return translations;
    }

    private void loadProperties(Map<String, String> targetMap, String pattern, boolean isLangSpecific) {
        try {
            Resource[] resources = resourceResolver.getResources(pattern);
            for (Resource resource : resources) {
                String filename = resource.getFilename();
                if (filename == null) continue;

                if (!isLangSpecific) {
                    String nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
                    String[] parts = nameWithoutExt.split("_");
                    if (parts.length > 2) {
                        continue;
                    }
                }

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
            log.error("Failed to load properties files for pattern: {}", pattern, e);
        }
    }
}
