package com.launchly.integration.service;

public interface WebhookService {

    void send(String url, String secret, String payload);
}
