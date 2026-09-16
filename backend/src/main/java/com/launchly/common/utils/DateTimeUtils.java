package com.launchly.common.utils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public final class DateTimeUtils {

    private DateTimeUtils() {
    }

    public static LocalDateTime parseStart(String startDate) {
        if (startDate == null || startDate.isBlank()) return null;
        try {
            return LocalDateTime.parse(startDate);
        } catch (Exception e) {
            try {
                return LocalDate.parse(startDate).atStartOfDay();
            } catch (Exception ex) {
                log.warn("Failed to parse start date: {}", ex.getMessage());
                return null;
            }
        }
    }

    public static LocalDateTime parseEnd(String endDate) {
        if (endDate == null || endDate.isBlank()) return null;
        try {
            return LocalDateTime.parse(endDate);
        } catch (Exception e) {
            try {
                return LocalDate.parse(endDate).atTime(LocalTime.MAX);
            } catch (Exception ex) {
                log.warn("Failed to parse end date: {}", ex.getMessage());
                return null;
            }
        }
    }

    public static <T> List<T> filterByDateRange(List<T> items, Function<T, LocalDateTime> dateExtractor, LocalDateTime start, LocalDateTime end) {
        if (items == null) return Collections.emptyList();
        return items.stream()
                .filter(item -> {
                    LocalDateTime dt = dateExtractor.apply(item);
                    if (dt == null) return false;
                    return !dt.isBefore(start) && !dt.isAfter(end);
                })
                .collect(Collectors.toList());
    }
}
