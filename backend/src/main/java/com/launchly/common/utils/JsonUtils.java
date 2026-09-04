package com.launchly.common.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.databind.DeserializationFeature;
import lombok.extern.slf4j.Slf4j;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
public final class JsonUtils {

    private static final ObjectMapper OBJECT_MAPPER;

    static {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        OBJECT_MAPPER = mapper;
    }

    private JsonUtils() {
    }

    public static String toJson(Object obj) {
        if (obj == null) return "[]";
        try {
            return OBJECT_MAPPER.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Failed to serialize object to JSON", e);
            return "[]";
        }
    }

    public static int countElements(Object jsonElement) {
        if (jsonElement == null) return 0;
        if (jsonElement instanceof List<?> list) {
            return list.size();
        }
        if (jsonElement instanceof String str) {
            String trimmed = str.trim();
            if (trimmed.isEmpty() || trimmed.equals("[]") || trimmed.equals("{}")) return 0;
            try {
                List<?> list = OBJECT_MAPPER.readValue(trimmed, List.class);
                return list != null ? list.size() : 0;
            } catch (Exception e) {
                log.warn("Failed to count elements from json string: {}", e.getMessage());
                return 0;
            }
        }
        return 0;
    }

    public static List<String> readStringList(String json) {
        if (json == null || json.trim().isEmpty()) return Collections.emptyList();
        try {
            return OBJECT_MAPPER.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("Failed to read string list from JSON: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public static List<Long> readLongList(String json) {
        if (json == null || json.trim().isEmpty()) return Collections.emptyList();
        try {
            List<Object> raw = OBJECT_MAPPER.readValue(json, new TypeReference<List<Object>>() {});
            List<Long> result = new ArrayList<>();
            for (Object item : raw) {
                if (item instanceof Number n) {
                    result.add(n.longValue());
                } else if (item instanceof String s) {
                    try {
                        result.add(Long.parseLong(s.trim()));
                    } catch (NumberFormatException e) {
                        log.warn("Failed to parse Long from item '{}': {}", s, e.getMessage());
                    }
                }
            }
            return result;
        } catch (Exception e) {
            log.warn("Failed to read long list from JSON: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}

