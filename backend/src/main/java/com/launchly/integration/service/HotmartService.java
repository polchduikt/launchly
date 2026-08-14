package com.launchly.integration.service;


public interface HotmartService {
    void processWebhook(Long botId, String tokenHeader, String rawPayload);
}
