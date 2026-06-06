package com.launchly.ai.service;

import com.launchly.ai.dto.request.AiChatRequest;
import com.launchly.ai.dto.request.AiSchemaRequest;
import com.launchly.ai.dto.response.AiChatResponse;
import com.launchly.ai.dto.response.AiSchemaResponse;
import com.launchly.ai.dto.response.AiUsageResponse;

public interface AiService {

    AiChatResponse chat(AiChatRequest request, Long userId);

    AiSchemaResponse generateSchema(AiSchemaRequest request, Long userId);

    AiUsageResponse getUsage(Long userId);
}
