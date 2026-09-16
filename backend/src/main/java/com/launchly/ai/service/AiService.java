package com.launchly.ai.service;

import com.launchly.ai.dto.request.AiChatRequest;
import com.launchly.ai.dto.request.AiSchemaRequest;
import com.launchly.ai.dto.request.CreateAiSessionRequest;
import com.launchly.ai.dto.request.UpdateAiSessionRequest;
import com.launchly.ai.dto.response.AiChatResponse;
import com.launchly.ai.dto.response.AiChatSessionDetailResponse;
import com.launchly.ai.dto.response.AiChatSessionResponse;
import com.launchly.ai.dto.response.AiSchemaResponse;
import com.launchly.ai.dto.response.AiUsageResponse;
import java.util.List;

public interface AiService {

    List<AiChatSessionResponse> getSessions(Long userId);

    AiChatSessionDetailResponse getSessionDetails(Long sessionId, Long userId);

    AiChatSessionResponse createSession(CreateAiSessionRequest request, Long userId);

    AiChatSessionResponse updateSessionTitle(Long sessionId, UpdateAiSessionRequest request, Long userId);

    void deleteSession(Long sessionId, Long userId);

    AiChatResponse chat(AiChatRequest request, Long userId);

    AiSchemaResponse generateSchema(AiSchemaRequest request, Long userId);

    AiUsageResponse getUsage(Long userId);
}
