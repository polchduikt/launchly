package com.launchly.bot.service;

import com.launchly.bot.dto.request.BotCreateRequest;
import com.launchly.bot.dto.request.BotUpdateRequest;
import com.launchly.bot.dto.request.FlowSchemaRequest;
import com.launchly.bot.dto.response.BotDetailResponse;
import com.launchly.bot.dto.response.BotResponse;
import com.launchly.bot.dto.response.BotStatsResponse;
import com.launchly.bot.dto.response.BotUserResponse;
import com.launchly.bot.dto.response.FlowSchemaResponse;
import java.util.List;

public interface BotService {

    BotResponse createBot(BotCreateRequest request, Long userId);

    List<BotResponse> getBotsByUser(Long userId);

    BotDetailResponse getBotById(Long id, Long userId);

    BotResponse updateBot(Long id, BotUpdateRequest request, Long userId);

    void deleteBot(Long id, Long userId);

    BotResponse startBot(Long id, Long userId);

    BotResponse stopBot(Long id, Long userId);

    FlowSchemaResponse getFlowSchema(Long botId, Long userId);

    FlowSchemaResponse saveFlowSchema(Long botId, FlowSchemaRequest request, Long userId);

    List<BotUserResponse> getBotUsers(Long botId, Long userId);

    BotStatsResponse getBotStats(Long botId, Long userId);
}
