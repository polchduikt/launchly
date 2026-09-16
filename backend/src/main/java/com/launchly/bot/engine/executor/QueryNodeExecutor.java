package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.repository.BotUserInteractionRepository;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.BotDialogStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Component
@RequiredArgsConstructor
public class QueryNodeExecutor implements NodeExecutor {

    private static final String DEFAULT_OUTPUT_PREFIX = "found_user";
    private static final String SORT_RANDOM = "RANDOM";
    private static final String SORT_NEWEST = "NEWEST";
    private static final String SORT_OLDEST = "OLDEST";

    private static final String KEY_OUTPUT_PREFIX = "outputPrefix";
    private static final String KEY_SORT_ORDER = "sortOrder";
    private static final String KEY_EXCLUDE_SELF = "excludeSelf";
    private static final String KEY_EXCLUDE_INTERACTIONS = "excludeInteractions";
    private static final String KEY_FILTERS = "filters";

    private static final String KEY_FIELD = "field";
    private static final String KEY_OPERATOR = "operator";
    private static final String KEY_VALUE = "value";

    private static final String KEY_CUSTOM_FIELDS = "customFields";
    private static final String KEY_CHAT_CUSTOM_FIELDS = "chatCustomFields";

    private static final String HANDLE_FOUND = "found";
    private static final String HANDLE_NEXT = "next";
    private static final String HANDLE_NOT_FOUND = "not_found";
    private static final String HANDLE_FALLBACK = "fallback";

    private static final String FIELD_ID = "id";
    private static final String FIELD_TELEGRAM_ID = "telegram_id";
    private static final String FIELD_TELEGRAM_USER_ID = "telegram_user_id";
    private static final String FIELD_FIRST_NAME = "first_name";
    private static final String FIELD_LAST_NAME = "last_name";
    private static final String FIELD_USERNAME = "username";
    private static final String FIELD_TELEGRAM_USERNAME = "telegram_username";
    private static final String FIELD_PHOTO_URL = "photo_url";

    private static final String OP_EQUALS = "equals";
    private static final String OP_IS = "is";
    private static final String OP_NOT_EQUALS = "not_equals";
    private static final String OP_IS_NOT = "is_not";
    private static final String OP_CONTAINS = "contains";
    private static final String OP_NOT_CONTAINS = "not_contains";
    private static final String OP_EXISTS = "exists";
    private static final String OP_IS_SET = "is_set";
    private static final String OP_NOT_EXISTS = "not_exists";
    private static final String OP_IS_NOT_SET = "is_not_set";
    private static final String OP_GREATER_THAN = "greater_than";
    private static final String OP_GT = "gt";
    private static final String OP_LESS_THAN = "less_than";
    private static final String OP_LT = "lt";
    private static final String OP_GREATER_THAN_OR_EQUALS = "greater_than_or_equals";
    private static final String OP_GREATER_THAN_OR_EQUAL = "greater_than_or_equal";
    private static final String OP_GTE = "gte";
    private static final String OP_GTE_SYMBOL = ">=";
    private static final String OP_LESS_THAN_OR_EQUALS = "less_than_or_equals";
    private static final String OP_LESS_THAN_OR_EQUAL = "less_than_or_equal";
    private static final String OP_LTE = "lte";
    private static final String OP_LTE_SYMBOL = "<=";

    private static final String PREFIX_STRIP_REGEX = "^(?i)(contact|user|customfields|custom_fields|fields|metadata)\\.";

    private final BotUserRepository botUserRepository;
    private final BotUserInteractionRepository interactionRepository;
    private final BotDialogStateService stateService;
    private final ObjectMapper objectMapper;

    @Override
    public NodeType getType() {
        return NodeType.QUERY;
    }

    @Override
    @SuppressWarnings("unchecked")
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long currentTelegramId = botUser.getTelegramId();
        Map<String, Object> data = node.data();

        log.info("Executing Query Node {} for bot user {}", node.id(), currentTelegramId);

        String outputPrefix = DEFAULT_OUTPUT_PREFIX;
        String sortOrder = SORT_RANDOM;
        boolean excludeSelf = true;
        List<String> excludeInteractions = new ArrayList<>();
        List<Map<String, Object>> filters = new ArrayList<>();

        if (data != null) {
            if (data.get(KEY_OUTPUT_PREFIX) instanceof String s && !s.trim().isEmpty()) {
                outputPrefix = s.trim();
            }
            if (data.get(KEY_SORT_ORDER) instanceof String s && !s.trim().isEmpty()) {
                sortOrder = s.trim().toUpperCase();
            }
            if (data.get(KEY_EXCLUDE_SELF) != null) {
                excludeSelf = Boolean.parseBoolean(data.get(KEY_EXCLUDE_SELF).toString());
            }
            if (data.get(KEY_EXCLUDE_INTERACTIONS) instanceof List<?> list) {
                for (Object item : list) {
                    if (item != null && !item.toString().trim().isEmpty()) {
                        excludeInteractions.add(item.toString().trim());
                    }
                }
            }
            if (data.get(KEY_FILTERS) instanceof List<?> fList) {
                for (Object f : fList) {
                    if (f instanceof Map<?, ?> fMap) {
                        filters.add((Map<String, Object>) fMap);
                    }
                }
            }
        }

        Map<String, String> currentSessionData = stateService.getSessionData(botId, currentTelegramId);

        Set<Long> excludedTelegramIds = new HashSet<>();
        if (excludeSelf) {
            excludedTelegramIds.add(currentTelegramId);
        }
        if (!excludeInteractions.isEmpty()) {
            List<Long> interactedIds = interactionRepository.findInteractedTargetTelegramIds(
                    botId, currentTelegramId, excludeInteractions
            );
            if (interactedIds != null) {
                excludedTelegramIds.addAll(interactedIds);
            }
        }

        List<BotUser> allBotUsers = botUserRepository.findAllByBotId(botId);
        List<BotUser> candidates = new ArrayList<>();

        for (BotUser candidate : allBotUsers) {
            if (candidate.getTelegramId() != null && excludedTelegramIds.contains(candidate.getTelegramId())) {
                continue;
            }

            Map<String, Object> candidateMetadata = parseMetadata(candidate.getMetadata());

            if (matchesAllFilters(candidate, candidateMetadata, filters, currentSessionData, botUser)) {
                candidates.add(candidate);
            }
        }

        if (!candidates.isEmpty()) {
            BotUser selected;
            if (SORT_NEWEST.equals(sortOrder)) {
                candidates.sort((a, b) -> {
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                });
                selected = candidates.get(0);
            } else if (SORT_OLDEST.equals(sortOrder)) {
                candidates.sort((a, b) -> {
                    if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                    return a.getCreatedAt().compareTo(b.getCreatedAt());
                });
                selected = candidates.get(0);
            } else {
                selected = candidates.get(ThreadLocalRandom.current().nextInt(candidates.size()));
            }

            populateCandidateSessionVariables(botId, currentTelegramId, outputPrefix, selected);

            String foundTarget = findTarget(edges, node.id(), HANDLE_FOUND);
            if (foundTarget != null) {
                return foundTarget;
            }
            return findTarget(edges, node.id(), HANDLE_NEXT);
        } else {
            String notFoundTarget = findTarget(edges, node.id(), HANDLE_NOT_FOUND);
            if (notFoundTarget != null) {
                return notFoundTarget;
            }
            return findTarget(edges, node.id(), HANDLE_FALLBACK);
        }
    }

    private void populateCandidateSessionVariables(Long botId, Long currentTelegramId, String prefix, BotUser candidate) {
        stateService.setSessionData(botId, currentTelegramId, prefix + ".id", String.valueOf(candidate.getId()));
        stateService.setSessionData(botId, currentTelegramId, prefix + ".telegram_id", String.valueOf(candidate.getTelegramId()));
        stateService.setSessionData(botId, currentTelegramId, prefix + ".first_name", candidate.getFirstName() != null ? candidate.getFirstName() : "");
        stateService.setSessionData(botId, currentTelegramId, prefix + ".last_name", candidate.getLastName() != null ? candidate.getLastName() : "");
        stateService.setSessionData(botId, currentTelegramId, prefix + ".name", candidate.getFirstName() != null ? candidate.getFirstName() : "");
        stateService.setSessionData(botId, currentTelegramId, prefix + ".username", candidate.getUsername() != null ? candidate.getUsername() : "");
        stateService.setSessionData(botId, currentTelegramId, prefix + ".telegram_username", candidate.getUsername() != null ? candidate.getUsername() : "");
        stateService.setSessionData(botId, currentTelegramId, prefix + ".photo_url", candidate.getPhotoUrl() != null ? candidate.getPhotoUrl() : "");

        stateService.setSessionData(botId, currentTelegramId, "found_id", String.valueOf(candidate.getId()));
        stateService.setSessionData(botId, currentTelegramId, "found_telegram_id", String.valueOf(candidate.getTelegramId()));
        stateService.setSessionData(botId, currentTelegramId, "found_first_name", candidate.getFirstName() != null ? candidate.getFirstName() : "");
        stateService.setSessionData(botId, currentTelegramId, "found_last_name", candidate.getLastName() != null ? candidate.getLastName() : "");
        stateService.setSessionData(botId, currentTelegramId, "found_username", candidate.getUsername() != null ? candidate.getUsername() : "");
        stateService.setSessionData(botId, currentTelegramId, "found_telegram_username", candidate.getUsername() != null ? candidate.getUsername() : "");
        stateService.setSessionData(botId, currentTelegramId, "found_photo_url", candidate.getPhotoUrl() != null ? candidate.getPhotoUrl() : "");

        Map<String, Object> candidateMetadata = parseMetadata(candidate.getMetadata());
        for (Map.Entry<String, Object> entry : candidateMetadata.entrySet()) {
            if (entry.getValue() != null && !(entry.getValue() instanceof Map)) {
                stateService.setSessionData(botId, currentTelegramId, prefix + "." + entry.getKey(), entry.getValue().toString());
                stateService.setSessionData(botId, currentTelegramId, "found_" + entry.getKey(), entry.getValue().toString());
            }
        }

        if (candidateMetadata.get(KEY_CUSTOM_FIELDS) instanceof Map<?, ?> cfMap) {
            for (Map.Entry<?, ?> entry : cfMap.entrySet()) {
                if (entry.getKey() != null && entry.getValue() != null) {
                    String k = entry.getKey().toString();
                    String v = entry.getValue().toString();
                    stateService.setSessionData(botId, currentTelegramId, prefix + "." + k, v);
                    stateService.setSessionData(botId, currentTelegramId, prefix + "_" + k, v);
                    stateService.setSessionData(botId, currentTelegramId, "found_" + k, v);
                }
            }
        }
    }

    private boolean matchesAllFilters(BotUser candidate, Map<String, Object> candidateMetadata,
                                      List<Map<String, Object>> filters,
                                      Map<String, String> currentSessionData,
                                      BotUser currentUser) {
        if (filters == null || filters.isEmpty()) {
            return true;
        }

        for (Map<String, Object> filter : filters) {
            String field = (String) filter.getOrDefault(KEY_FIELD, "");
            String operator = (String) filter.getOrDefault(KEY_OPERATOR, OP_EQUALS);
            String rawValue = (String) filter.getOrDefault(KEY_VALUE, "");

            String expectedValue = resolveValuePlaceholder(rawValue, currentSessionData, currentUser);
            String actualValue = extractCandidateValue(field, candidate, candidateMetadata);

            log.debug("Evaluating Query filter: field='{}', actual='{}', operator='{}', rawValue='{}', expected='{}'",
                    field, actualValue, operator, rawValue, expectedValue);

            if (!evaluateCondition(actualValue, operator, expectedValue)) {
                return false;
            }
        }
        return true;
    }

    private String extractCandidateValue(String field, BotUser candidate, Map<String, Object> metadata) {
        if (field == null || field.trim().isEmpty()) return "";
        String f = field.trim();
        if (f.startsWith("{") && f.endsWith("}")) {
            f = f.substring(1, f.length() - 1).trim();
        }
        if (f.toLowerCase().startsWith("metadata.")) {
            f = f.substring("metadata.".length());
        }
        if (f.toLowerCase().startsWith("customfields.") || f.toLowerCase().startsWith("custom_fields.")) {
            f = f.substring(f.indexOf('.') + 1);
        }
        if (f.toLowerCase().startsWith("contact.") || f.toLowerCase().startsWith("user.")) {
            f = f.substring(f.indexOf('.') + 1);
        }

        switch (f.toLowerCase()) {
            case FIELD_ID:
                return candidate.getId() != null ? candidate.getId().toString() : "";
            case FIELD_TELEGRAM_ID:
            case FIELD_TELEGRAM_USER_ID:
                return candidate.getTelegramId() != null ? candidate.getTelegramId().toString() : "";
            case FIELD_FIRST_NAME:
                return candidate.getFirstName() != null ? candidate.getFirstName() : "";
            case FIELD_LAST_NAME:
                return candidate.getLastName() != null ? candidate.getLastName() : "";
            case FIELD_USERNAME:
            case FIELD_TELEGRAM_USERNAME:
                return candidate.getUsername() != null ? candidate.getUsername() : "";
            case FIELD_PHOTO_URL:
                return candidate.getPhotoUrl() != null ? candidate.getPhotoUrl() : "";
            default:
                Object val = metadata.get(f);
                if (val == null) {
                    val = metadata.get(field.trim());
                }
                if (val == null && metadata.get(KEY_CUSTOM_FIELDS) instanceof Map<?, ?> cfMap) {
                    for (Map.Entry<?, ?> entry : cfMap.entrySet()) {
                        if (String.valueOf(entry.getKey()).equalsIgnoreCase(f) || String.valueOf(entry.getKey()).equalsIgnoreCase(field.trim())) {
                            val = entry.getValue();
                            break;
                        }
                    }
                }
                if (val == null && metadata.get(KEY_CHAT_CUSTOM_FIELDS) instanceof Map<?, ?> chatMap) {
                    for (Object groupObj : chatMap.values()) {
                        if (groupObj instanceof Map<?, ?> groupMap) {
                            for (Map.Entry<?, ?> entry : groupMap.entrySet()) {
                                if (String.valueOf(entry.getKey()).equalsIgnoreCase(f) || String.valueOf(entry.getKey()).equalsIgnoreCase(field.trim())) {
                                    val = entry.getValue();
                                    break;
                                }
                            }
                            if (val != null) break;
                        }
                    }
                }
                return val != null ? val.toString().trim() : "";
        }
    }

    private String resolveValuePlaceholder(String rawValue, Map<String, String> currentSessionData, BotUser currentUser) {
        if (rawValue == null || rawValue.isEmpty()) return "";
        String trimmed = rawValue.trim();
        String varKey = trimmed;
        boolean hasBraces = trimmed.startsWith("{") && trimmed.endsWith("}");
        if (hasBraces) {
            varKey = trimmed.substring(1, trimmed.length() - 1).trim();
        }

        String strippedKey = varKey.replaceFirst(PREFIX_STRIP_REGEX, "").trim();

        if (currentUser != null) {
            if (FIELD_FIRST_NAME.equalsIgnoreCase(strippedKey) || "First Name".equalsIgnoreCase(strippedKey)) {
                return currentUser.getFirstName() != null ? currentUser.getFirstName() : "";
            }
            if (FIELD_LAST_NAME.equalsIgnoreCase(strippedKey) || "Last Name".equalsIgnoreCase(strippedKey)) {
                return currentUser.getLastName() != null ? currentUser.getLastName() : "";
            }
            if (FIELD_USERNAME.equalsIgnoreCase(strippedKey) || FIELD_TELEGRAM_USERNAME.equalsIgnoreCase(strippedKey)) {
                return currentUser.getUsername() != null ? currentUser.getUsername() : "";
            }
            if (FIELD_TELEGRAM_ID.equalsIgnoreCase(strippedKey) || FIELD_TELEGRAM_USER_ID.equalsIgnoreCase(strippedKey)) {
                return currentUser.getTelegramId() != null ? currentUser.getTelegramId().toString() : "";
            }
            if (FIELD_ID.equalsIgnoreCase(strippedKey) || "contact_id".equalsIgnoreCase(strippedKey)) {
                return currentUser.getId() != null ? currentUser.getId().toString() : "";
            }

            Map<String, Object> userMeta = parseMetadata(currentUser.getMetadata());
            if (userMeta.containsKey(varKey) && userMeta.get(varKey) != null && !(userMeta.get(varKey) instanceof Map)) {
                return userMeta.get(varKey).toString();
            }
            if (userMeta.containsKey(strippedKey) && userMeta.get(strippedKey) != null && !(userMeta.get(strippedKey) instanceof Map)) {
                return userMeta.get(strippedKey).toString();
            }
            if (userMeta.get(KEY_CUSTOM_FIELDS) instanceof Map<?, ?> cfMap) {
                for (Map.Entry<?, ?> entry : cfMap.entrySet()) {
                    if (String.valueOf(entry.getKey()).equalsIgnoreCase(varKey) || String.valueOf(entry.getKey()).equalsIgnoreCase(strippedKey)) {
                        return entry.getValue() != null ? entry.getValue().toString() : "";
                    }
                }
            }
            if (userMeta.get(KEY_CHAT_CUSTOM_FIELDS) instanceof Map<?, ?> chatMap) {
                for (Object groupObj : chatMap.values()) {
                    if (groupObj instanceof Map<?, ?> groupMap) {
                        for (Map.Entry<?, ?> entry : groupMap.entrySet()) {
                            if (String.valueOf(entry.getKey()).equalsIgnoreCase(varKey) || String.valueOf(entry.getKey()).equalsIgnoreCase(strippedKey)) {
                                return entry.getValue() != null ? entry.getValue().toString() : "";
                            }
                        }
                    }
                }
            }
        }

        if (currentSessionData != null) {
            if (currentSessionData.containsKey(varKey)) return currentSessionData.get(varKey);
            if (currentSessionData.containsKey(strippedKey)) return currentSessionData.get(strippedKey);
            for (Map.Entry<String, String> entry : currentSessionData.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(varKey) || entry.getKey().equalsIgnoreCase(strippedKey)) {
                    return entry.getValue() != null ? entry.getValue() : "";
                }
            }
        }

        if (hasBraces) {
            return "";
        }

        return rawValue;
    }

    private boolean evaluateCondition(String actual, String operator, String expected) {
        if (actual == null) actual = "";
        if (expected == null) expected = "";
        String act = actual.trim();
        String exp = expected.trim();

        switch (operator.toLowerCase()) {
            case OP_EQUALS:
            case OP_IS:
                return act.equalsIgnoreCase(exp);
            case OP_NOT_EQUALS:
            case OP_IS_NOT:
                return !act.equalsIgnoreCase(exp);
            case OP_CONTAINS:
                return act.toLowerCase().contains(exp.toLowerCase());
            case OP_NOT_CONTAINS:
                return !act.toLowerCase().contains(exp.toLowerCase());
            case OP_EXISTS:
            case OP_IS_SET:
                return !act.isEmpty();
            case OP_NOT_EXISTS:
            case OP_IS_NOT_SET:
                return act.isEmpty();
            case OP_GREATER_THAN:
            case OP_GT:
                try {
                    return Double.parseDouble(act) > Double.parseDouble(exp);
                } catch (NumberFormatException e) {
                    return act.compareToIgnoreCase(exp) > 0;
                }
            case OP_LESS_THAN:
            case OP_LT:
                try {
                    return Double.parseDouble(act) < Double.parseDouble(exp);
                } catch (NumberFormatException e) {
                    return act.compareToIgnoreCase(exp) < 0;
                }
            case OP_GREATER_THAN_OR_EQUALS:
            case OP_GREATER_THAN_OR_EQUAL:
            case OP_GTE:
            case OP_GTE_SYMBOL:
                try {
                    return Double.parseDouble(act) >= Double.parseDouble(exp);
                } catch (NumberFormatException e) {
                    return act.compareToIgnoreCase(exp) >= 0;
                }
            case OP_LESS_THAN_OR_EQUALS:
            case OP_LESS_THAN_OR_EQUAL:
            case OP_LTE:
            case OP_LTE_SYMBOL:
                try {
                    return Double.parseDouble(act) <= Double.parseDouble(exp);
                } catch (NumberFormatException e) {
                    return act.compareToIgnoreCase(exp) <= 0;
                }
            default:
                return act.equalsIgnoreCase(exp);
        }
    }

    private Map<String, Object> parseMetadata(String json) {
        if (json == null || json.trim().isEmpty()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private String findTarget(List<FlowEdge> edges, String nodeId, String handleId) {
        if (edges == null) return null;
        return edges.stream()
                .filter(e -> e.source().equals(nodeId))
                .filter(e -> handleId.equals(e.sourceHandle()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }
}
