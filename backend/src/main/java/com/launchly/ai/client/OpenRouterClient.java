package com.launchly.ai.client;

import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;

@Component
public class OpenRouterClient extends OpenAiCompatibleAiClient {

    @Value("${openrouter.api-key:}")
    private String apiKey;

    @Value("${openrouter.base-url:https://openrouter.ai/api/v1}")
    private String baseUrl;

    @Value("${openrouter.model:qwen/qwen3-32b}")
    private String model;

    @Value("${openrouter.max-tokens:8192}")
    private int maxTokens;

    @Value("${openrouter.temperature:0.7}")
    private double temperature;

    @Value("${openrouter.site-url:http://localhost:5173}")
    private String siteUrl;

    @Value("${openrouter.app-name:Launchly}")
    private String appName;

    public OpenRouterClient(HttpClient httpClient, ObjectMapper objectMapper) {
        super(httpClient, objectMapper);
    }

    @Override
    public String name() {
        return "openrouter";
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

    @Override
    protected void applyHeaders(HttpRequest.Builder requestBuilder) {
        if (siteUrl != null && !siteUrl.trim().isEmpty()) {
            requestBuilder.header("HTTP-Referer", siteUrl);
        }
        if (appName != null && !appName.trim().isEmpty()) {
            requestBuilder.header("X-Title", appName);
        }
    }
}
