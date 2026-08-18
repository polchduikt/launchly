package com.launchly.broadcast.validator;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotMember;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class BroadcastValidator {

    private final BotRepository botRepository;
    private final BotMemberRepository botMemberRepository;

    public void validateScheduledAt(LocalDateTime scheduledAt) {
        if (scheduledAt != null && !scheduledAt.isAfter(LocalDateTime.now())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Scheduled time must be in the future.");
        }
    }

    public Bot validateBotOwnership(Long botId, Long userId) {
        return botRepository.findByIdAndUserId(botId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Bot not found or access denied"));
    }

    public void validateWriteAccess(Long botId, Long userId) {
        Bot bot = validateBotOwnership(botId, userId);
        if (!bot.getUser().getId().equals(userId)) {
            BotMember member = botMemberRepository.findWorkspaceMemberships(botId, userId).stream().findFirst()
                    .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "Access denied"));
            if ("Viewer".equalsIgnoreCase(member.getRole())) {
                throw new AppException(HttpStatus.FORBIDDEN, "Viewer role cannot modify campaigns");
            }
        }
    }
}
