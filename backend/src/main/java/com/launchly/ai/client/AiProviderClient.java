package com.launchly.ai.client;

import com.launchly.ai.dto.AiMessage;
import java.util.List;
import java.util.Map;

public interface AiProviderClient {

    String name();

    boolean isConfigured();

    String chat(List<AiMessage> messages, Map<String, Object> responseFormat);
}
