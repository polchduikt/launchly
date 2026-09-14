package com.launchly.bot.engine.executor;

import com.launchly.bot.engine.model.FlowEdge;
import com.launchly.bot.engine.model.FlowNode;
import com.launchly.bot.entity.BotUser;
import com.launchly.bot.entity.BotUserInteraction;
import com.launchly.bot.entity.NodeType;
import com.launchly.bot.repository.BotUserInteractionRepository;
import com.launchly.bot.service.BotDialogStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.generics.TelegramClient;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class InteractionNodeExecutor implements NodeExecutor {

    private static final String DEFAULT_TARGET_ID_VAR = "{found_user.telegram_id}";
    private static final String DEFAULT_INTERACTION_TYPE = "like";
    private static final String DEFAULT_MUTUAL_TYPE = "like";

    private static final String KEY_TARGET_USER_ID = "targetUserId";
    private static final String KEY_TARGET_TELEGRAM_ID = "targetTelegramId";
    private static final String KEY_INTERACTION_TYPE = "interactionType";
    private static final String KEY_CHECK_MUTUAL = "checkMutual";
    private static final String KEY_MUTUAL_TYPE = "mutualType";

    private static final String HANDLE_MUTUAL = "mutual";
    private static final String HANDLE_SAVED = "saved";
    private static final String HANDLE_NEXT = "next";

    private final BotUserInteractionRepository interactionRepository;
    private final BotDialogStateService stateService;

    @Override
    public NodeType getType() {
        return NodeType.INTERACTION;
    }

    @Override
    public String execute(FlowNode node, List<FlowEdge> edges, BotUser botUser,
                          Update update, TelegramClient client) {
        Long botId = botUser.getBot().getId();
        Long currentTelegramId = botUser.getTelegramId();
        Map<String, Object> data = node.data();

        log.info("Executing Interaction Node {} for bot user {}", node.id(), currentTelegramId);

        String targetIdVar = DEFAULT_TARGET_ID_VAR;
        String interactionType = DEFAULT_INTERACTION_TYPE;
        boolean checkMutual = true;
        String mutualType = DEFAULT_MUTUAL_TYPE;

        if (data != null) {
            if (data.get(KEY_TARGET_USER_ID) instanceof String s && !s.trim().isEmpty()) {
                targetIdVar = s.trim();
            } else if (data.get(KEY_TARGET_TELEGRAM_ID) instanceof String s && !s.trim().isEmpty()) {
                targetIdVar = s.trim();
            }
            if (data.get(KEY_INTERACTION_TYPE) instanceof String s && !s.trim().isEmpty()) {
                interactionType = s.trim().toLowerCase();
            }
            if (data.get(KEY_CHECK_MUTUAL) != null) {
                checkMutual = Boolean.parseBoolean(data.get(KEY_CHECK_MUTUAL).toString());
            }
            if (data.get(KEY_MUTUAL_TYPE) instanceof String s && !s.trim().isEmpty()) {
                mutualType = s.trim().toLowerCase();
            }
        }

        Map<String, String> sessionData = stateService.getSessionData(botId, currentTelegramId);
        Long targetTelegramId = resolveTargetTelegramId(targetIdVar, sessionData);

        if (targetTelegramId != null && !targetTelegramId.equals(currentTelegramId)) {
            Optional<BotUserInteraction> existing = interactionRepository
                    .findByBotIdAndSourceTelegramIdAndTargetTelegramIdAndInteractionType(
                            botId, currentTelegramId, targetTelegramId, interactionType
                    );

            if (existing.isEmpty()) {
                BotUserInteraction interaction = BotUserInteraction.builder()
                        .bot(botUser.getBot())
                        .sourceTelegramId(currentTelegramId)
                        .targetTelegramId(targetTelegramId)
                        .interactionType(interactionType)
                        .build();
                interactionRepository.save(interaction);
                log.info("Saved interaction: {} -> {} ({})", currentTelegramId, targetTelegramId, interactionType);
            }

            if (checkMutual) {
                boolean isMutual = interactionRepository
                        .existsByBotIdAndSourceTelegramIdAndTargetTelegramIdAndInteractionType(
                                botId, targetTelegramId, currentTelegramId, mutualType
                        );

                if (isMutual) {
                    log.info("Mutual interaction found between {} and {} for type {}", currentTelegramId, targetTelegramId, mutualType);
                    String mutualTarget = findTarget(edges, node.id(), HANDLE_MUTUAL);
                    if (mutualTarget != null) {
                        return mutualTarget;
                    }
                }
            }
        } else {
            log.warn("Invalid or missing target Telegram ID for interaction node {}", node.id());
        }

        String savedTarget = findTarget(edges, node.id(), HANDLE_SAVED);
        if (savedTarget != null) {
            return savedTarget;
        }
        return findTarget(edges, node.id(), HANDLE_NEXT);
    }

    private Long resolveTargetTelegramId(String rawVar, Map<String, String> sessionData) {
        if (rawVar == null || rawVar.trim().isEmpty()) return null;
        String val = rawVar.trim();
        String key = val;
        if (val.startsWith("{") && val.endsWith("}")) {
            key = val.substring(1, val.length() - 1).trim();
        }
        if (sessionData != null) {
            if (sessionData.containsKey(key)) {
                val = sessionData.get(key);
            } else if (sessionData.containsKey(val)) {
                val = sessionData.get(val);
            } else {
                for (Map.Entry<String, String> entry : sessionData.entrySet()) {
                    if (entry.getKey().equalsIgnoreCase(key) || entry.getKey().equalsIgnoreCase(val)) {
                        val = entry.getValue();
                        break;
                    }
                }
            }
        }
        try {
            return Long.parseLong(val.trim());
        } catch (Exception e) {
            return null;
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
