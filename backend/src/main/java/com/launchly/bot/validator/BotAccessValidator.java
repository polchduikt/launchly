package com.launchly.bot.validator;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotMember;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class BotAccessValidator {

    private final BotMemberRepository botMemberRepository;

    public void validateWriteAccess(Bot bot, Long userId) {
        if (bot == null || userId == null) {
            throw new AppException(HttpStatus.FORBIDDEN, "bot.error.access_denied");
        }
        if (!bot.getUser().getId().equals(userId)) {
            BotMember member = getWorkspaceMembership(bot, userId)
                    .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "bot.error.access_denied"));

            if ("Viewer".equalsIgnoreCase(member.getRole())) {
                throw new AppException(HttpStatus.FORBIDDEN, "bot.error.viewer_cannot_modify");
            }
        }
    }

    public Optional<BotMember> getWorkspaceMembership(Bot bot, Long userId) {
        if (bot == null || userId == null) return Optional.empty();
        if (bot.getUser().getId().equals(userId)) return Optional.empty();
        return botMemberRepository.findWorkspaceMemberships(bot.getId(), userId).stream().findFirst();
    }
}
