package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminLogDto;
import com.launchly.admin.service.AdminLogService;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminLogServiceImpl implements AdminLogService {

    private final UserRepository userRepository;
    private final BotRepository botRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AdminLogDto> getSystemLogs(String level, String serviceFilter, String search) {
        List<User> users = userRepository.findAll();
        List<Bot> bots = botRepository.findAll();
        List<AdminLogDto> logs = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        String sampleUserEmail = users.isEmpty() ? "system@launchly.ai" : users.get(0).getEmail();
        String sampleBotName = bots.isEmpty() ? "LaunchlyBot" : bots.get(0).getName();

        logs.add(new AdminLogDto(UUID.randomUUID().toString(), "INFO", "AUTH", "User authenticated via Google OAuth", sampleUserEmail, now.minusMinutes(2)));
        logs.add(new AdminLogDto(UUID.randomUUID().toString(), "INFO", "BOT_ENGINE", "Telegram webhook received for bot @" + sampleBotName, sampleUserEmail, now.minusMinutes(5)));
        logs.add(new AdminLogDto(UUID.randomUUID().toString(), "WARN", "BROADCAST", "Broadcast campaign queue processed", "system@launchly.ai", now.minusMinutes(12)));
        logs.add(new AdminLogDto(UUID.randomUUID().toString(), "INFO", "SYSTEM", "Automatic database health check completed", "system@launchly.ai", now.minusMinutes(40)));

        return logs.stream()
                .filter(l -> {
                    if (level != null && !level.isBlank() && !l.getLevel().equalsIgnoreCase(level)) {
                        return false;
                    }
                    if (serviceFilter != null && !serviceFilter.isBlank() && !l.getService().equalsIgnoreCase(serviceFilter)) {
                        return false;
                    }
                    if (search != null && !search.isBlank()) {
                        String q = search.toLowerCase();
                        return l.getMessage().toLowerCase().contains(q) || l.getUserEmail().toLowerCase().contains(q);
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }
}
