package com.launchly.admin.util;

import com.launchly.admin.dto.AdminAutomationDto;
import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import java.util.List;

public final class AdminFilterUtils {

    private AdminFilterUtils() {
    }

    public static boolean matchesRole(User u, Role roleFilter) {
        if (roleFilter == null) return true;
        return u.getRole() == roleFilter;
    }

    public static boolean matchesSearch(User u, String search) {
        if (search == null || search.isBlank()) return true;
        String q = search.toLowerCase();
        return (u.getName() != null && u.getName().toLowerCase().contains(q))
                || (u.getEmail() != null && u.getEmail().toLowerCase().contains(q))
                || (u.getTelegramUsername() != null && u.getTelegramUsername().toLowerCase().contains(q));
    }

    public static boolean matchesPlan(String userPlan, String planFilter) {
        if (planFilter == null || planFilter.isBlank() || "all".equalsIgnoreCase(planFilter)) return true;
        return userPlan != null && userPlan.equalsIgnoreCase(planFilter.trim());
    }

    public static boolean matchesStatus(AdminAutomationDto dto, String status) {
        if (status == null || status.isBlank() || "all".equalsIgnoreCase(status)) return true;
        if ("blocked".equalsIgnoreCase(status)) return dto.isBlocked();
        if ("active".equalsIgnoreCase(status)) return dto.isActive() && !dto.isBlocked();
        if ("paused".equalsIgnoreCase(status) || "inactive".equalsIgnoreCase(status)) return !dto.isActive() && !dto.isBlocked();
        return true;
    }

    public static boolean matchesAutomationSearch(AdminAutomationDto dto, String search) {
        if (search == null || search.isBlank()) return true;
        String q = search.toLowerCase().trim();
        return (dto.getName() != null && dto.getName().toLowerCase().contains(q))
                || (dto.getOwnerName() != null && dto.getOwnerName().toLowerCase().contains(q))
                || (dto.getOwnerEmail() != null && dto.getOwnerEmail().toLowerCase().contains(q))
                || (dto.getBotName() != null && dto.getBotName().toLowerCase().contains(q))
                || (dto.getTriggerType() != null && dto.getTriggerType().toLowerCase().contains(q));
    }

    public static int countIntegrations(List<?> nodeArray) {
        if (nodeArray == null) return 0;
        int count = 0;
        for (Object nodeObj : nodeArray) {
            if (!(nodeObj instanceof java.util.Map<?, ?> nodeMap)) continue;
            String typeStr = nodeMap.get("type") != null ? nodeMap.get("type").toString().toLowerCase() : "";
            if ("ai".equals(typeStr) || "api_call".equals(typeStr) || "google_sheets".equals(typeStr) || "webhook".equals(typeStr) || "integration".equals(typeStr)) {
                count++;
                continue;
            }
            if (nodeMap.get("data") instanceof java.util.Map<?, ?> dataMap && dataMap.get("actions") instanceof List<?> actionsList) {
                for (Object act : actionsList) {
                    if (act instanceof java.util.Map<?, ?> actMap && actMap.get("type") != null) {
                        String actTypeStr = actMap.get("type").toString().toUpperCase();
                        if (actTypeStr.startsWith("GS_") || actTypeStr.startsWith("WEBHOOK") || actTypeStr.startsWith("INTEGRATION")) {
                            count++;
                            break;
                        }
                    }
                }
            }
        }
        return count;
    }
}

