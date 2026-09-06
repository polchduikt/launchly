package com.launchly.crm.scheduler;

import com.launchly.crm.service.CrmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CrmMessageScheduler {

    private static final long SCHEDULED_MESSAGES_CHECK_DELAY_MS = 15_000L;

    private final CrmService crmService;

    @Scheduled(fixedDelay = SCHEDULED_MESSAGES_CHECK_DELAY_MS)
    public void processScheduledMessages() {
        try {
            crmService.sendScheduledMessages();
        } catch (Exception e) {
            log.error("Error processing scheduled messages: {}", e.getMessage(), e);
        }
    }
}
