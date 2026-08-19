package com.launchly.common.utils;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JsonUtilsTest {

    @Test
    @DisplayName("Повинен серіалізувати об'єкт у валідний JSON")
    void toJson_ValidObject_ReturnsJsonString() {
        Map<String, Object> map = Map.of("key", "value", "count", 42);
        String json = JsonUtils.toJson(map);
        assertThat(json).contains("\"key\":\"value\"").contains("\"count\":42");
    }

    @Test
    @DisplayName("Повинен повертати '[]' для null об'єкта")
    void toJson_NullObject_ReturnsDefaultArray() {
        assertThat(JsonUtils.toJson(null)).isEqualTo("[]");
    }

    @Test
    @DisplayName("Повинен підраховувати кількість елементів у списку або JSON-масиві")
    void countElements_CalculatesCorrectCount() {
        assertThat(JsonUtils.countElements(List.of("a", "b", "c"))).isEqualTo(3);
        assertThat(JsonUtils.countElements("[\"a\", \"b\"]")).isEqualTo(2);
        assertThat(JsonUtils.countElements("[]")).isEqualTo(0);
        assertThat(JsonUtils.countElements(null)).isEqualTo(0);
    }
}
