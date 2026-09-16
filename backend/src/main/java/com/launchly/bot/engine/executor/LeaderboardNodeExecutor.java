package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.repository.BotUserRepository;
import com.launchly.bot.service.BotDialogStateService;
import com.launchly.common.utils.MessageUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;
import tools.jackson.databind.ObjectMapper;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class LeaderboardNodeExecutor implements NodeExecutor {

    private final BotUserRepository botUserRepository;
    private final BotDialogStateService stateService;
    private final MessageUtils messageUtils;
    private final ObjectMapper objectMapper;

    private record UserScoreEntry(BotUser botUser, double score, String displayName) {}

    @Override
    public NodeType getType() {
        return NodeType.LEADERBOARD;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long telegramUserId = botUser.getTelegramId();
        Map<String, Object> data = node.data();

        String targetField = "points";
        int limit = 10;
        String sortOrder = "DESC";
        boolean showRank = true;
        boolean showScores = true;
        String outputVariable = "leaderboard";
        String userRankVariable = "user_rank";
        String userScoreVariable = "user_score";
        String customHeader = null;

        if (data != null) {
            if (data.get("targetField") instanceof String s && !s.trim().isEmpty()) {
                targetField = s.trim();
            }
            if (data.get("limit") != null) {
                limit = parsePositiveInt(data.get("limit"), 10);
            }
            if (data.get("sortOrder") instanceof String s && !s.trim().isEmpty()) {
                sortOrder = s.trim().toUpperCase();
            }
            if (data.get("showRank") != null) {
                showRank = Boolean.parseBoolean(data.get("showRank").toString());
            }
            if (data.get("showScores") != null) {
                showScores = Boolean.parseBoolean(data.get("showScores").toString());
            }
            if (data.get("outputVariable") instanceof String s && !s.trim().isEmpty()) {
                outputVariable = s.trim();
            }
            if (data.get("userRankVariable") instanceof String s && !s.trim().isEmpty()) {
                userRankVariable = s.trim();
            }
            if (data.get("userScoreVariable") instanceof String s && !s.trim().isEmpty()) {
                userScoreVariable = s.trim();
            }
            if (data.get("customHeader") instanceof String s && !s.trim().isEmpty()) {
                customHeader = s.trim();
            }
        }

        String chatScope = resolveChatScope(update);
        List<BotUser> allBotUsers = botUserRepository.findAllByBotId(botId);
        List<UserScoreEntry> entries = new ArrayList<>();

        for (BotUser u : allBotUsers) {
            double score = extractUserScore(u, chatScope, targetField);
            String displayName = resolveDisplayName(u);
            if (!"private".equalsIgnoreCase(chatScope)) {
                if (score > 0 || u.getId().equals(botUser.getId())) {
                    entries.add(new UserScoreEntry(u, score, displayName));
                }
            } else {
                entries.add(new UserScoreEntry(u, score, displayName));
            }
        }

        boolean isAscending = "ASC".equalsIgnoreCase(sortOrder);
        if (isAscending) {
            entries.sort(Comparator.comparingDouble(UserScoreEntry::score));
        } else {
            entries.sort((a, b) -> Double.compare(b.score(), a.score()));
        }

        int currentUserRank = 0;
        double currentUserScore = 0.0;

        for (int i = 0; i < entries.size(); i++) {
            UserScoreEntry entry = entries.get(i);
            if (entry.botUser().getId().equals(botUser.getId())) {
                currentUserRank = i + 1;
                currentUserScore = entry.score();
                break;
            }
        }

        StringBuilder sb = new StringBuilder();
        if (customHeader != null && !customHeader.isEmpty()) {
            sb.append(customHeader).append("\n");
        }

        int topCount = Math.min(limit, entries.size());
        if (topCount == 0) {
            sb.append(messageUtils.getMessage("bot.leaderboard.empty"));
        } else {
            for (int i = 0; i < topCount; i++) {
                UserScoreEntry entry = entries.get(i);
                int rank = i + 1;
                StringBuilder line = new StringBuilder();

                if (showRank) {
                    line.append(rank).append(". ");
                }

                line.append(entry.displayName());

                if (showScores) {
                    line.append(" — ").append(formatNumber(entry.score()));
                }

                sb.append(line);
                if (i < topCount - 1) {
                    sb.append("\n");
                }
            }
        }

        String fullLeaderboard = sb.toString();
        String formattedScore = formatNumber(currentUserScore);
        String rankStr = currentUserRank > 0 ? String.valueOf(currentUserRank) : "—";

        stateService.setSessionData(botId, telegramUserId, targetField, fullLeaderboard);
        stateService.setSessionData(botId, telegramUserId, outputVariable, fullLeaderboard);
        stateService.setSessionData(botId, telegramUserId, "leaderboard", fullLeaderboard);
        stateService.setSessionData(botId, telegramUserId, "top_list", fullLeaderboard);
        stateService.setSessionData(botId, telegramUserId, "top", fullLeaderboard);
        stateService.setSessionData(botId, telegramUserId, "rating", fullLeaderboard);
        stateService.setSessionData(botId, telegramUserId, targetField + "_leaderboard", fullLeaderboard);
        stateService.setSessionData(botId, telegramUserId, targetField + "_top", fullLeaderboard);
        stateService.setSessionData(botId, telegramUserId, userRankVariable, rankStr);
        stateService.setSessionData(botId, telegramUserId, "user_rank", rankStr);
        stateService.setSessionData(botId, telegramUserId, "rank", rankStr);
        stateService.setSessionData(botId, telegramUserId, userScoreVariable, formattedScore);
        stateService.setSessionData(botId, telegramUserId, "user_score", formattedScore);

        log.info("Leaderboard computed for botId={} in chatScope '{}': {} entries, currentUser {} rank={}",
                botId, chatScope, entries.size(), telegramUserId, rankStr);

        return edges.stream()
                .filter(e -> e.source().equals(node.id()))
                .findFirst()
                .map(FlowEdge::target)
                .orElse(null);
    }

    private String resolveChatScope(Update update) {
        if (update != null) {
            if (update.hasMessage() && update.getMessage().getChat() != null) {
                String type = update.getMessage().getChat().getType();
                if ("private".equalsIgnoreCase(type)) {
                    return "private";
                }
                return update.getMessage().getChatId().toString();
            }
            if (update.hasCallbackQuery() && update.getCallbackQuery().getMessage() != null && update.getCallbackQuery().getMessage().getChat() != null) {
                String type = update.getCallbackQuery().getMessage().getChat().getType();
                if ("private".equalsIgnoreCase(type)) {
                    return "private";
                }
                return update.getCallbackQuery().getMessage().getChatId().toString();
            }
            if (update.hasChannelPost() && update.getChannelPost().getChat() != null) {
                return update.getChannelPost().getChatId().toString();
            }
        }
        return "private";
    }

    @SuppressWarnings("unchecked")
    private double extractUserScore(BotUser botUser, String chatScope, String fieldName) {
        try {
            if (botUser.getMetadata() != null && !botUser.getMetadata().trim().isEmpty()) {
                Map<String, Object> meta = objectMapper.readValue(botUser.getMetadata(), Map.class);
                if (chatScope != null && !chatScope.isEmpty() && !"private".equalsIgnoreCase(chatScope)) {
                    Map<String, Object> chatCustomFields = (Map<String, Object>) meta.get("chatCustomFields");
                    if (chatCustomFields != null) {
                        Map<String, Object> groupFields = (Map<String, Object>) chatCustomFields.get(chatScope);
                        if (groupFields != null && groupFields.get(fieldName) != null) {
                            Object valObj = groupFields.get(fieldName);
                            if (valObj instanceof Number num) {
                                return num.doubleValue();
                            }
                            return Double.parseDouble(valObj.toString().trim());
                        }
                    }
                    return 0.0;
                } else {
                    Map<String, Object> custom = (Map<String, Object>) meta.get("customFields");
                    if (custom != null && custom.get(fieldName) != null) {
                        Object valObj = custom.get(fieldName);
                        if (valObj instanceof Number num) {
                            return num.doubleValue();
                        }
                        return Double.parseDouble(valObj.toString().trim());
                    }
                }
            }
        } catch (Exception ignored) {}
        return 0.0;
    }

    private String resolveDisplayName(BotUser u) {
        if (u.getUsername() != null && !u.getUsername().trim().isEmpty()) {
            return "@" + u.getUsername().trim().replaceFirst("^@", "");
        }
        String first = u.getFirstName() != null ? u.getFirstName().trim() : "";
        String last = u.getLastName() != null ? u.getLastName().trim() : "";
        String full = (first + " " + last).trim();
        if (!full.isEmpty()) {
            return full;
        }
        return "User #" + (u.getTelegramId() != null ? u.getTelegramId() : u.getId());
    }

    private int parsePositiveInt(Object obj, int fallback) {
        if (obj == null) return fallback;
        if (obj instanceof Number num) return Math.max(1, num.intValue());
        try {
            return Math.max(1, Integer.parseInt(obj.toString().trim()));
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private String formatNumber(double val) {
        if (val == Math.floor(val) && !Double.isInfinite(val)) {
            return String.valueOf((long) val);
        }
        return String.format(Locale.US, "%.2f", val);
    }
}