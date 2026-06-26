package com.launchly.ai.client;

import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.net.http.HttpClient;

@Component
public class CerebrasClient extends OpenAiCompatibleAiClient {

    @Value("${cerebras.api-key:}")
    private String apiKey;

    @Value("${cerebras.base-url:https://api.cerebras.ai/v1}")
    private String baseUrl;

    @Value("${cerebras.model:gpt-oss-120b}")
    private String model;

    @Value("${cerebras.max-tokens:8192}")
    private int maxTokens;

    @Value("${cerebras.temperature:0.7}")
    private double temperature;

    public CerebrasClient(HttpClient httpClient, ObjectMapper objectMapper) {
        super(httpClient, objectMapper);
    }

    @Override
    public String name() {
        return "cerebras";
    }

    @Override
    protected String apiKey() {
        return apiKey;
    }

    @Override
    protected String baseUrl() {
        return baseUrl;
    }

    @Override
    protected String model() {
        return model;
    }

    @Override
    protected int maxTokens() {
        return maxTokens;
    }

    @Override
    protected double temperature() {
        return temperature;
    }
}
