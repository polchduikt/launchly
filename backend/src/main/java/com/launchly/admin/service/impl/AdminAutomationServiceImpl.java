package com.launchly.admin.service.impl;

import com.launchly.admin.dto.AdminAutomationDto;
import com.launchly.admin.service.AdminAutomationService;
import com.launchly.auth.entity.User;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.FlowSchema;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.repository.FlowSchemaRepository;
import com.launchly.common.exception.AppException;
import com.launchly.crm.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAutomationServiceImpl implements AdminAutomationService {

    private final FlowSchemaRepository flowSchemaRepository;
    private final BotRepository botRepository;
    private final ConversationRepository conversationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AdminAutomationDto> getAutomations() {
        List<FlowSchema> schemas = flowSchemaRepository.findAll();
        return schemas.stream()
                .map(f -> {
                    Bot bot = f.getBot();
                    User owner = bot != null ? bot.getUser() : null;
                    long execCount = bot != null ? conversationRepository.countByBotId(bot.getId()) : 0;

                    return AdminAutomationDto.builder()
                            .id(f.getId())
                            .name(bot != null ? bot.getName() : "Flow #" + f.getId())
                            .triggerType("KEYWORD")
                            .ownerEmail(owner != null ? owner.getEmail() : "N/A")
                            .ownerName(owner != null ? owner.getName() : "N/A")
                            .botName(bot != null ? bot.getName() : "Unassigned Bot")
                            .active(bot != null && bot.isActive())
                            .triggerCount((int) execCount)
                            .errorCount(0)
                            .lastExecutedAt(f.getUpdatedAt() != null ? f.getUpdatedAt() : LocalDateTime.now())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void toggleAutomation(Long automationId) {
        FlowSchema schema = flowSchemaRepository.findById(automationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Automation flow not found"));
        if (schema.getBot() != null) {
            Bot bot = schema.getBot();
            bot.setActive(!bot.isActive());
            botRepository.save(bot);
        }
    }
}
